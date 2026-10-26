// FUT-80 · Recette du rendu réel : le banc `/dev/fut80` (vrai `LogementModule`, fixtures réelles RNB/ADEME),
// sur ordinateur (1440 px) et sur Android/Chrome émulé (Pixel 7). Lit le TEXTE rendu, vérifie l'absence de
// défilement horizontal, ouvre la liste du même bâtiment, et capture chaque état. Toute requête POST est
// bloquée ; aucune ne doit viser `/api/logement-dpe` (aucune attribution automatique sur `monchaux`).
// Usage : CHROME=<chemin> node scripts/fut80/recette-rendu.mjs http://localhost:3080
import { chromium, devices } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

const base = process.argv[2];
assert.match(base ?? "", /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir = "docs/audits/2026-10-26-fut80-rnb/rendu";
mkdirSync(dir, { recursive: true });
const norm = (t) => t.replace(/ /g, " ").replace(/\s+/g, " ");

const ATTENDU = {
  villeurbanne: {
    present: [/Bâtiment \(RNB\)/i, /ETRZ-P8JQ-3DNK/, /Il porte aussi 122 Avenue Roger Salengro\./,
      /18 diagnostics de logement sont enregistrés à d'autres adresses du même bâtiment\./, /Ils ne sont pas enregistrés à cette adresse\./],
    absent: [/Classé [A-G] au diagnostic/],
    ouvrir: /Voir ces diagnostics/,
    // Une seule autre adresse : l'introduction la nomme, les lignes ne la répètent pas.
    apresOuverture: [/Diagnostic de l'immeuble entier, classé C/, /5° étage/],
    absentApresOuverture: [/enregistré au 122 Avenue Roger Salengro/],
  },
  "la-couarde": { present: [/Un diagnostic de logement est enregistré à une autre adresse du même bâtiment\./, /porte aussi 58 Grande Rue\./], absent: [], ouvrir: /Voir ce diagnostic/, apresOuverture: [/appartement|m²/], absentApresOuverture: [/enregistré au/] },
  // Liste repliée (44 diagnostics) : la mention se lit après « Identifier mon logement » (étape `ouvrirListe`).
  thenac: { present: [/44 diagnostics sont enregistrés à cette adresse\./], absent: [/rattaché par son diagnostiqueur/, /d'autres adresses du même bâtiment/], ouvrirListe: true },
  monchaux: { present: [/rattaché par la base ADEME à un autre bâtiment/, /Est-ce celui de ce logement \?/], absent: [/retenu automatiquement/] },
  puyravault: { present: [/7 bâtiments rattachés à cette adresse/, /ne dit pas lequel abrite le logement/], absent: [/même bâtiment/] },
  bordeaux: { present: [], absent: [/Bâtiment \(RNB\)/i, /même bâtiment/] },
  ancien: { present: [], absent: [/Bâtiment \(RNB\)/i, /même bâtiment/] },
};

const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const bilan = [];
for (const [cas, att] of Object.entries(ATTENDU)) {
  for (const [nomAppareil, opts] of [["ordinateur", { viewport: { width: 1440, height: 1000 } }], ["android", devices["Pixel 7"]]]) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const ecritures = [];
    const erreurs = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    await page.route("**/*", (route) => {
      const r = route.request();
      if (r.method() !== "GET") { ecritures.push(`${r.method()} ${new URL(r.url()).pathname}`); return route.abort(); }
      return route.continue();
    });
    await page.goto(`${base}/dev/fut80?cas=${cas}`, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(800);
    let texte = norm(await page.locator("body").innerText());
    for (const re of att.present) assert.match(texte, re, `${cas}/${nomAppareil} : ${re}`);
    for (const re of att.absent) assert.doesNotMatch(texte, re, `${cas}/${nomAppareil} : ${re}`);
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert.ok(debord <= 1, `${cas}/${nomAppareil} : défilement horizontal de ${debord} px`);
    const section = page.locator("text=même bâtiment").first();
    if (await section.count()) await section.scrollIntoViewIfNeeded();
    else if (await page.locator("text=Bâtiment (RNB)").count()) await page.locator("text=Bâtiment (RNB)").first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${dir}/${cas}-${nomAppareil}.png`, fullPage: false });
    if (att.ouvrir) {
      await page.getByRole("button", { name: att.ouvrir }).click();
      await page.waitForTimeout(300);
      texte = norm(await page.locator("body").innerText());
      for (const re of att.apresOuverture) assert.match(texte, re, `${cas}/${nomAppareil} après ouverture : ${re}`);
      for (const re of att.absentApresOuverture ?? []) assert.doesNotMatch(texte, re, `${cas}/${nomAppareil} après ouverture : ${re}`);
      await page.getByRole("button", { name: att.ouvrir }).count().then((n) => assert.equal(n, 0));
      await page.screenshot({ path: `${dir}/${cas}-${nomAppareil}-ouvert.png`, fullPage: false });
    }
    if (att.ouvrirListe) {
      const bouton = page.getByRole("button", { name: "Identifier mon logement" });
      if (await bouton.count()) await bouton.click();
      await page.waitForTimeout(300);
      const tout = page.getByRole("button", { name: /Voir les \d+ autres diagnostics/ });
      if (await tout.count()) await tout.click();
      texte = norm(await page.locator("body").innerText());
      assert.match(texte, /rattaché par son diagnostiqueur à un autre bâtiment/);
      await page.locator("text=rattaché par son diagnostiqueur").first().scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${dir}/${cas}-${nomAppareil}-ouvert.png`, fullPage: false });
    }
    // Toutes les requêtes non-GET sont bloquées (analytique, synthèse, outils du serveur de dev) ; la
    // garde porte sur la seule écriture qui compte ici, celle d'une sélection de diagnostic.
    const selections = ecritures.filter((e) => e.includes("/api/logement-dpe"));
    assert.deepEqual(selections, [], `${cas}/${nomAppareil} : sélection écrite ${selections.join(", ")}`);
    bilan.push({ cas, appareil: nomAppareil, debord, erreurs: erreurs.length, ecritures: ecritures.filter((e) => e.includes("/api/logement-dpe")).length });
    await ctx.close();
  }
}
await browser.close();
writeFileSync(`${dir}/bilan.json`, JSON.stringify(bilan, null, 1));
console.log(bilan.map((b) => `${b.cas.padEnd(12)} ${b.appareil.padEnd(10)} débord ${b.debord}px  erreurs ${b.erreurs}  écritures ${b.ecritures}`).join("\n"));
