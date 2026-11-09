// FUT-94 · RECETTE FONCTIONNELLE RÉELLE : la vraie page /rapport, servie par `next dev` local branché sur le
// projet Supabase de TEST (future-e-test), avec de vrais comptes jetables. Chaque cas est vérifié à l'écran
// ET dans la base (service role). Rien n'est simulé côté serveur ; seul PostHog est intercepté dans le
// navigateur (aucune requête /ingest ne sort).
//
// Phases (l'environnement de test chargé : set -a; . ./.env.fut10-test; set +a) :
//   node …/recette-reelle.mjs preparer     comptes A (classique) et R (relevé), biens, projet → état.json
//   (lancer l'application avec DECISION_RELEVE_COMPTES=<R> : la commande est imprimée par « preparer »)
//   node …/recette-reelle.mjs jouer        tous les cas, captures, recette-reelle.txt
//   node …/recette-reelle.mjs absente      la question n'apparaît pas quand la table est illisible
//   node …/recette-reelle.mjs nettoyer     supprime comptes, biens et retours (cascades)
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { diagnostiquer, afficher, refsDeProduction } from "../../../scripts/integration/garde-environnement.mjs";

const diag = diagnostiquer(process.env, refsDeProduction());
const utiles = { ok: diag.lignes.filter((l) => l.nom.startsWith("Supabase")).every((l) => l.ok), lignes: diag.lignes.filter((l) => l.nom.startsWith("Supabase")) };
if (!utiles.ok) { afficher(utiles); process.exit(2); }

// fileURLToPath, pas `.pathname` : le chemin du dépôt contient « · », qu'une URL encode (%C2%B7).
const DOSSIER = fileURLToPath(new URL(".", import.meta.url));
// Les identifiants des comptes JETABLES vivent hors du dépôt (mode 600), le temps de la recette.
const ETAT = process.env.FUT94_ETAT ?? `${tmpdir()}/fut94-recette-etat.json`;
const RAPPORT = `${DOSSIER}recette-reelle.txt`;
const APP = process.env.FUT94_APP ?? "http://localhost:3194";
const SECRET = "Texte-temoin-FUT94 le bruit de la rocade";
const service = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const TABLE = "dossier_utility_feedback";
const phase = process.argv[2];

const PROJET = { posture: "adresse", intent: null, rawText: "Recette FUT-94 : calme et transports.", updatedAt: new Date().toISOString(), schemaVersion: 3, parsed: { reformulation: "Calme et transports", hardConstraints: {}, preferences: [{ key: "calme_sonore", weight: 3 }] } };

async function compte(nom) {
  const email = `fut94+recette-${nom}-${Date.now()}@futuree.test`;
  const password = `Test-${crypto.randomUUID()}`;
  const { data, error } = await service.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  const p = await service.from("user_profiles").update({ user_project: PROJET, home_insee_code: "44109", home_commune: "Nantes" }).eq("user_id", data.user.id);
  if (p.error) throw p.error;
  return { id: data.user.id, email, password };
}
async function bien(userId, label) {
  const { data, error } = await service.from("address_dossiers").insert({
    user_id: userId, ban_id: `fut94_recette_${label}`, insee: "44109", address_label: `${label} rue du Test 44000 Nantes`,
    city: "Nantes", postcode: "44000", latitude: 47.2184, longitude: -1.5536,
  }).select("id").single();
  if (error) throw error;
  return data.id;
}

if (phase === "preparer") {
  const A = await compte("a");
  const R = await compte("r");
  A.d1 = await bien(A.id, "1");
  A.d2 = await bien(A.id, "2");
  R.d1 = await bien(R.id, "3");
  writeFileSync(ETAT, JSON.stringify({ A, R }), { mode: 0o600 });
  console.log(`état écrit (comptes ${A.id.slice(0, 8)}…, ${R.id.slice(0, 8)}…)`);
  console.log(`DECISION_RELEVE_COMPTES=${R.id}`);
  process.exit(0);
}

const etat = JSON.parse(readFileSync(ETAT, "utf8"));
const { A, R } = etat;

if (phase === "nettoyer") {
  for (const c of [A, R]) await service.auth.admin.deleteUser(c.id);
  const restes = await Promise.all([
    service.from(TABLE).select("id", { count: "exact", head: true }).in("user_id", [A.id, R.id]),
    service.from("address_dossiers").select("id", { count: "exact", head: true }).in("user_id", [A.id, R.id]),
  ]);
  console.log(`nettoyé : retours restants ${restes[0].count}, biens restants ${restes[1].count}`);
  process.exit(restes[0].count === 0 && restes[1].count === 0 ? 0 : 1);
}

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? `${process.cwd()}/node_modules/playwright-core/index.mjs`);
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });

function decoder(req) {
  const buf = req.postDataBuffer();
  if (!buf) return [];
  let txt;
  try { txt = gunzipSync(buf).toString("utf8"); } catch { txt = buf.toString("utf8"); }
  if (txt.startsWith("data=")) txt = Buffer.from(decodeURIComponent(txt.slice(5)), "base64").toString("utf8");
  try { const j = JSON.parse(txt); const lot = Array.isArray(j) ? j : j.batch ?? [j]; return lot.map((e) => ({ event: e.event, props: e.properties ?? {}, brut: JSON.stringify(e) })); }
  catch { return [{ event: "(illisible)", props: {}, brut: txt }]; }
}

/** Un navigateur connecté au compte, PostHog intercepté, consentement fixé. */
async function session(c, { consentement = "denied", largeur = 1280 } = {}) {
  const ctx = await browser.newContext({
    viewport: { width: largeur, height: 900 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36",
  });
  await ctx.addInitScript(() => Object.defineProperty(Navigator.prototype, "webdriver", { get: () => false }));
  await ctx.addInitScript((v) => { try { if (v) localStorage.setItem("futuree-consent", v); } catch {} }, consentement);
  await ctx.addInitScript(() => { const s = document.createElement("style"); s.textContent = "nextjs-portal{display:none!important}"; document.documentElement.appendChild(s); });
  const evenements = [];
  await ctx.route("**/ingest/**", async (route) => {
    const req = route.request(); const u = req.url();
    if (req.method() === "POST" && !/\/flags\//.test(u)) evenements.push(...decoder(req));
    if (/\.js(\?|$)/.test(u)) return route.fulfill({ status: 200, contentType: "application/javascript", body: "" });
    if (/\/flags\//.test(u)) return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ flags: {}, featureFlags: {}, featureFlagPayloads: {}, errorsWhileComputingFlags: false, requestId: "x" }) });
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ status: 1 }) });
  });
  const page = await ctx.newPage();
  const envois = [];
  page.on("request", (r) => { if (r.url().includes("/api/dossier/retour-utilite")) envois.push(r.postData()); });
  await page.goto(`${APP}/connexion?next=${encodeURIComponent("/rapport")}`);
  await page.fill('input[type="email"]', c.email);
  await page.fill('input[type="password"]', c.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/rapport/, { timeout: 60000 });
  return { ctx, page, evenements, envois };
}
const bloc = (page) => page.locator("[data-retour-utilite]");
/** Le texte rendu, insécables (bindOrphans) ramenées à des espaces. */
const texteDe = async (loc) => (await loc.innerText()).replace(/[\u00a0\u202f]/g, " ");
const lignes = async (userId) => (await service.from(TABLE).select("*").eq("user_id", userId).order("created_at")).data ?? [];
const ligneDe = async (userId, scope) => (await lignes(userId)).filter((l) => l.scope_key === scope);
const capture = async (page, nom) => {
  const b = bloc(page);
  if (await b.count()) await b.screenshot({ path: `${DOSSIER}reel-${nom}.png` });
};

const journal = [];
async function cas(nom, fn) {
  try { await fn(); journal.push(`✔ ${nom}`); console.log(`✔ ${nom}`); }
  catch (e) { journal.push(`✘ ${nom}\n    ${e.message.split("\n")[0]}`); console.log(`✘ ${nom}\n    ${e.message}`); process.exitCode = 1; }
}

if (phase === "absente") {
  const { ctx, page } = await session(A);
  await page.locator("h1").first().waitFor({ timeout: 90000 });
  // Le bloc est rendu côté serveur avec la page : on attend la fin du rendu (le pied de page), pas
  // « networkidle », que les sondes de la page n'atteignent jamais en développement.
  await page.getByText("MENTIONS LÉGALES", { exact: false }).first().waitFor({ timeout: 90000 });
  await page.waitForTimeout(3000);
  const n = await bloc(page).count();
  appendFileSync(RAPPORT, `\n${n === 0 ? "✔" : "✘"} table illisible pour le compte (droit de lecture retiré sur le projet de test) : la question n'est pas posée, la page s'affiche (${await page.locator("h1").first().innerText()})\n`);
  console.log(`bloc présent : ${n}`);
  await ctx.close(); await browser.close();
  process.exit(n === 0 ? 0 : 1);
}

if (phase !== "jouer") { console.error("phase : preparer | jouer | absente | nettoyer"); process.exit(2); }

for (const [c, vue] of [[A, "classique"], [R, "releve"]]) {
  // Le bien lu est le dernier créé (aucun active_dossier_id) : D2 pour A, l'unique bien pour R.
  const actif = c.d2 ?? c.d1;
  const S = `logement:${actif}`;
  const { ctx, page, envois } = await session(c);
  const b = bloc(page);
  await cas(`${vue} · la question est posée sous le dossier, aucune réponse en base`, async () => {
    await b.waitFor({ timeout: 120000 });
    await b.scrollIntoViewIfNeeded();
    assert.match(await texteDe(b), /Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche/);
    assert.equal((await lignes(c.id)).length, 0);
    assert.equal(await b.getByRole("button", { pressed: true }).count(), 0);
    await capture(page, `${vue}-1-question`);
  });
  let premiere;
  await cas(`${vue} · première réponse « Oui » sans commentaire : une ligne, réponse seule`, async () => {
    await b.getByRole("button", { name: "Oui", exact: true }).click();
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    const l = await ligneDe(c.id, S);
    assert.equal(l.length, 1); assert.equal(l[0].answer, "oui"); assert.equal(l[0].comment, null); assert.equal(l[0].commented_at, null);
    assert.equal(l[0].presentation, vue); assert.equal(l[0].address_dossier_id, actif);
    premiere = l[0];
  });
  await cas(`${vue} · ajouter un commentaire : enregistré avec sa date, résumé replié`, async () => {
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(SECRET);
    await capture(page, `${vue}-2-commentaire`);
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText(/Votre retour sur cette analyse : Oui, avec un commentaire/).waitFor();
    const [l] = await ligneDe(c.id, S);
    assert.equal(l.comment, SECRET); assert.ok(l.commented_at); assert.equal(l.id, premiere.id); assert.equal(l.created_at, premiere.created_at);
    premiere = l;
    await capture(page, `${vue}-3-resume`);
  });
  await cas(`${vue} · modifier le commentaire : texte et date remplacés, même ligne`, async () => {
    await b.getByRole("button", { name: "Modifier" }).click();
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(`${SECRET} (modifié)`);
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText(/avec un commentaire/).waitFor();
    const [l] = await ligneDe(c.id, S);
    assert.equal(l.comment, `${SECRET} (modifié)`); assert.ok(l.commented_at > premiere.commented_at); assert.equal(l.id, premiere.id);
  });
  await cas(`${vue} · effacer le commentaire (champ vidé) : comment et commented_at à NULL`, async () => {
    await b.getByRole("button", { name: "Modifier" }).click();
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill("");
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText(/Votre retour sur cette analyse : Oui\. Merci\./).waitFor();
    const [l] = await ligneDe(c.id, S);
    assert.equal(l.comment, null); assert.equal(l.commented_at, null); assert.equal(l.answer, "oui");
  });
  await cas(`${vue} · « Pas vraiment » commenté → « Pas encore lu » : commentaire retiré, annoncé à l'écran`, async () => {
    await b.getByRole("button", { name: "Modifier" }).click();
    await b.getByRole("button", { name: "Pas vraiment" }).click();
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(SECRET);
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText(/Pas vraiment, avec un commentaire/).waitFor();
    await b.getByRole("button", { name: "Modifier" }).click();
    await b.getByRole("button", { name: "Pas encore lu" }).click();
    await b.getByText("Merci, c'est noté. Votre commentaire précédent a été retiré.").waitFor();
    assert.equal(await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).count(), 0, "pas de champ pour un dossier non lu");
    const [l] = await ligneDe(c.id, S);
    assert.equal(l.answer, "pas_encore_lu"); assert.equal(l.comment, null); assert.equal(l.commented_at, null); assert.equal(l.created_at, premiere.created_at);
    await capture(page, `${vue}-4-commentaire-retire`);
  });
  await cas(`${vue} · retour à « Oui » : pas de commentaire ressuscité, champ vide`, async () => {
    await b.getByRole("button", { name: "Oui", exact: true }).click();
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    assert.equal(await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).inputValue(), "");
    const [l] = await ligneDe(c.id, S);
    assert.equal(l.answer, "oui"); assert.equal(l.comment, null);
  });
  await cas(`${vue} · rechargement : l'état vient de la base (résumé « Oui »), aucune question reposée`, async () => {
    await page.reload(); await b.waitFor({ timeout: 120000 });
    assert.match(await texteDe(b), /Votre retour sur cette analyse : Oui\. Merci\./);
    assert.equal(await b.getByRole("button", { name: "Pas vraiment" }).count(), 0);
    await capture(page, `${vue}-5-apres-rechargement`);
  });
  await cas(`${vue} · double clic : un seul envoi, une seule ligne`, async () => {
    await b.getByRole("button", { name: "Modifier" }).click();
    const avant = envois.length;
    await b.getByRole("button", { name: "Pas vraiment" }).dblclick();
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    assert.equal(envois.length - avant, 1, `${envois.length - avant} envois`);
    const l = await ligneDe(c.id, S);
    assert.equal(l.length, 1); assert.equal(l[0].answer, "pas_vraiment");
  });
  await cas(`${vue} · panne réseau puis nouvel essai : texte conservé, envoi réussi`, async () => {
    let coupe = true;
    await page.route("**/api/dossier/retour-utilite", (route) => (coupe ? route.abort("internetdisconnected") : route.continue()));
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(SECRET);
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText("Votre commentaire n'a pas pu être envoyé. Il est conservé dans le champ : réessayez.").waitFor();
    assert.equal(await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).inputValue(), SECRET);
    assert.equal((await ligneDe(c.id, S))[0].comment, null, "rien d'écrit pendant la panne");
    await capture(page, `${vue}-6-panne`);
    coupe = false;
    await b.getByRole("button", { name: "Réessayer l'envoi" }).click();
    await b.getByText(/Pas vraiment, avec un commentaire/).waitFor();
    assert.equal((await ligneDe(c.id, S))[0].comment, SECRET);
    await page.unroute("**/api/dossier/retour-utilite");
  });
  await cas(`${vue} · clavier : Tab jusqu'à une réponse, Entrée l'enregistre, le focus reste dans le bloc`, async () => {
    await b.getByRole("button", { name: "Modifier" }).focus();
    await page.keyboard.press("Enter");
    const focusTitre = await page.evaluate(() => Boolean(document.activeElement?.closest("[data-retour-utilite]")));
    assert.ok(focusTitre, "focus dans le bloc après « Modifier »");
    await b.getByRole("button", { name: "Oui", exact: true }).focus();
    await capture(page, `${vue}-7-focus-clavier`);
    await page.keyboard.press("Enter");
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    assert.equal(await b.getByRole("button", { name: "Oui", exact: true }).getAttribute("aria-pressed"), "true");
    const statut = await b.locator('[role="status"]').innerText();
    assert.match(statut, /enregistrée/);
    assert.equal((await ligneDe(c.id, S))[0].comment, SECRET, "« Oui » sans clé comment : commentaire conservé");
  });
  await ctx.close();
}

await cas("isolation multi-dossiers : l'autre bien de A (D1) n'hérite d'aucune réponse, sa réponse est une ligne distincte", async () => {
  const { error } = await service.from("user_profiles").update({ active_dossier_id: A.d1 }).eq("user_id", A.id);
  if (error) throw error;
  const { ctx, page } = await session(A);
  const b = bloc(page);
  await b.waitFor({ timeout: 120000 });
  assert.equal(await b.getByRole("button", { pressed: true }).count(), 0, "question vierge sur D1");
  await b.getByRole("button", { name: "Pas encore lu" }).click();
  await b.getByText("Merci, c'est noté.").waitFor();
  const l = await lignes(A.id);
  assert.deepEqual(l.map((x) => `${x.scope_key.replace(A.d1, "D1").replace(A.d2, "D2")}=${x.answer}`).sort(), ["logement:D1=pas_encore_lu", "logement:D2=oui"]);
  assert.equal((await lignes(R.id)).length, 1, "R : une ligne, intacte");
  await ctx.close();
});

for (const consentement of [null, "denied", "granted"]) {
  await cas(`consentement ${consentement ?? "absent"} : événements FUT-94 conformes, aucun texte de commentaire envoyé`, async () => {
    const { ctx, page, evenements } = await session(R, { consentement });
    const b = bloc(page);
    await b.waitFor({ timeout: 120000 });
    await b.getByRole("button", { name: "Modifier" }).click();
    await b.getByRole("button", { name: "Pas vraiment" }).click();
    await b.getByText("Merci, votre réponse est enregistrée.").waitFor();
    await b.getByLabel(/Quoi, ou qu'est-ce qui vous a manqué/).fill(`${SECRET} ${consentement}`);
    await b.getByRole("button", { name: "Envoyer" }).click();
    await b.getByText(/avec un commentaire/).waitFor();
    await page.waitForTimeout(6000);
    await page.close();
    await ctx.close();
    const fut94 = evenements.filter((e) => e.event === "dossier_utility_feedback_submitted");
    const bloc94 = evenements.filter((e) => e.event === "$autocapture" && /retour-utilite|Pas vraiment|Envoyer|Modifier/.test(e.brut));
    const fuite = evenements.filter((e) => e.brut.includes("Texte-temoin-FUT94"));
    const attendu = consentement === "granted" ? 2 : 0;
    journal.push(`    ${evenements.length} événement(s) tentés ; FUT-94 : ${fut94.length} ${JSON.stringify(fut94.map((e) => ({ answer: e.props.answer, has_comment: e.props.has_comment, step: e.props.step, scope: e.props.scope, presentation: e.props.presentation })))} ; autocapture du bloc : ${bloc94.length} ; texte du commentaire : ${fuite.length}`);
    assert.equal(fut94.length, attendu, `${fut94.length} événements FUT-94`);
    assert.equal(bloc94.length, 0); assert.equal(fuite.length, 0);
  });
}

await browser.close();
writeFileSync(RAPPORT, `FUT-94 · recette réelle (next dev local + Supabase future-e-test), ${new Date().toISOString()}\n\n${journal.join("\n")}\n`);
