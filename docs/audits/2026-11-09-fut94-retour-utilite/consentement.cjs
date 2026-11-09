// FUT-94 · LE CONSENTEMENT POSTHOG, MESURÉ DANS LE NAVIGATEUR (banc /dev/fut94, serveur de dev local).
// Toutes les requêtes `/ingest/**` (le proxy PostHog du site) sont INTERCEPTÉES et décodées ici : rien ne
// sort. Pour chaque état du consentement (absent, "denied", "granted"), le parcours complet : réponse
// « Pas vraiment », commentaire, envoi. On relève les événements que posthog-js a tenté d'envoyer.
const { chromium } = require(process.cwd() + "/node_modules/playwright-core");
const zlib = require("zlib");
const fs = require("fs");
const OUT = process.cwd() + "/docs/audits/2026-11-09-fut94-retour-utilite";
const SECRET = "Texte-temoin-FUT94 le bruit de la rocade";

function decoder(req) {
  const buf = req.postDataBuffer();
  if (!buf) return [];
  let txt;
  try { txt = zlib.gunzipSync(buf).toString("utf8"); } catch { txt = buf.toString("utf8"); }
  if (txt.startsWith("data=")) txt = Buffer.from(decodeURIComponent(txt.slice(5)), "base64").toString("utf8");
  try {
    const j = JSON.parse(txt);
    const lot = Array.isArray(j) ? j : j.batch ?? [j];
    return lot.map((e) => ({ event: e.event, props: e.properties ?? {}, brut: JSON.stringify(e) }));
  } catch { return [{ event: "(illisible)", props: {}, brut: txt }]; }
}

(async () => {
  const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
  const lignes = [];
  for (const etat of [null, "denied", "granted"]) {
    // posthog-js écarte les robots : agent utilisateur « HeadlessChrome » et `navigator.webdriver`.
    // Le test se présente donc comme un Chrome ordinaire ; rien d'autre n'est modifié.
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
    });
    await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false }));
    await ctx.addInitScript((v) => { try { if (v) localStorage.setItem("futuree-consent", v); } catch {} }, etat);
    const evenements = [];
    await ctx.route("**/ingest/**", async (route) => {
      const req = route.request();
      const u = req.url();
      if (req.method() === "POST" && !/\/flags\//.test(u)) evenements.push(...decoder(req));
      if (/\.js(\?|$)/.test(u)) return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
      if (/\/flags\//.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ flags: {}, featureFlags: {}, featureFlagPayloads: {}, errorsWhileComputingFlags: false, requestId: "x" }) });
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 1 }) });
    });
    const page = await ctx.newPage();
    await page.goto("http://localhost:3094/dev/fut94?vue=releve", { waitUntil: "networkidle" });
    // TÉMOIN : un clic sur un bouton HORS du bloc, pour vérifier que l'autocapture est bien active.
    const horsBloc = await page.evaluate(() => {
      const b = [...document.querySelectorAll("button")].find((x) => !x.closest("[data-retour-utilite]") && x.offsetParent !== null);
      if (b) { b.setAttribute("data-temoin", "1"); return b.textContent.trim().slice(0, 40); }
      return null;
    });
    if (horsBloc) await page.locator("[data-temoin]").click();
    await page.getByRole("button", { name: "Pas vraiment" }).click();
    await page.getByText("Merci, votre réponse est enregistrée.").waitFor();
    await page.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(SECRET);
    await page.getByRole("button", { name: "Envoyer" }).click();
    await page.getByText("Merci, votre commentaire est enregistré.").waitFor();
    await page.waitForTimeout(6000); // laisse posthog-js vider sa file (lots de 3 s)
    await page.close(); // déclenche aussi $pageleave
    await ctx.close();
    const noms = evenements.map((e) => e.event);
    const compte = (n) => noms.filter((x) => x === n).length;
    const fut94 = evenements.filter((e) => e.event === "dossier_utility_feedback_submitted");
    const autocaptureTemoin = evenements.filter((e) => e.event === "$autocapture" && !/Pas vraiment|Envoyer|Quoi, ou/.test(e.brut));
    const autocaptureBloc = evenements.filter((e) => e.event === "$autocapture" && /Pas vraiment|Envoyer|retour-utilite|Quoi, ou/.test(e.brut));
    const fuite = evenements.filter((e) => e.brut.includes("Texte-temoin-FUT94") || e.brut.includes("rocade"));
    lignes.push(`consentement ${etat ?? "absent"} : ${evenements.length} événement(s) tentés [${[...new Set(noms)].map((x) => `${x}×${compte(x)}`).join(", ")}]`);
    lignes.push(`  dossier_utility_feedback_submitted : ${fut94.length}${fut94.length ? ` ${JSON.stringify(fut94.map((e) => ({ answer: e.props.answer, has_comment: e.props.has_comment, step: e.props.step })))}` : ""}`);
    lignes.push(`  autocapture du bouton témoin hors du bloc (« ${horsBloc} ») : ${autocaptureTemoin.length}`);
    lignes.push(`  autocapture d'un élément du bloc FUT-94 : ${autocaptureBloc.length}`);
    lignes.push(`  texte du commentaire présent dans un envoi : ${fuite.length}`);
  }
  await browser.close();
  console.log(lignes.join("\n"));
  fs.writeFileSync(`${OUT}/consentement.txt`, lignes.join("\n") + "\n");
})().catch((e) => { console.error(e); process.exit(1); });
