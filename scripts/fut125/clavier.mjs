// FUT-125 · RECETTE AU CLAVIER de l'en-tête, de « Votre projet » et de « Ce bien » sous le Relevé.
//
// Serveur local uniquement. Les trois routes d'écriture sont INTERCEPTÉES par le navigateur (rien ne part
// vers le serveur) : la recette vérifie ce que chaque geste ENVOIE, et ce que l'écran montre ensuite.
// Usage : node scripts/fut125/clavier.mjs [base=http://localhost:3125] [largeur=1440] [--tactile]
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const [base = "http://localhost:3125", largeur = "1440", ...opts] = process.argv.slice(2);
if (!base.startsWith("http://localhost")) throw new Error("Serveur local seulement.");
const tactile = opts.includes("--tactile");
const url = `${base}/dev/fut92?lieu=${encodeURIComponent("Place de l'Hôtel de Ville 17000 La Rochelle")}&projet=recette&ailleurs=6&biens=2&residence=Lorient`;

const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await navigateur.newPage({ viewport: { width: Number(largeur), height: 900 }, hasTouch: tactile, isMobile: tactile, deviceScaleFactor: tactile ? 2 : 1 });
await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });

const envois = [];
await page.route(/\/api\/(project\/criterion|report-context|dossier\/relation)/, async (route) => {
  const req = route.request();
  const corps = JSON.parse(req.postData() ?? "{}");
  envois.push({ route: new URL(req.url()).pathname, methode: req.method(), corps });
  const reponse = req.url().includes("dossier/relation") ? { relation: corps.relation ?? null, objectif: corps.objectif ?? null } : { ok: true };
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(reponse) });
});

await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

/** Tabule jusqu'à l'élément dont le nom accessible correspond, en comptant les arrêts. */
async function tabulerJusqua(motif, max = 200) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const nom = await page.evaluate(() => {
      const e = document.activeElement;
      return e ? (e.getAttribute("aria-label") ?? e.textContent ?? "").trim() : "";
    });
    if (motif.test(nom)) return nom;
  }
  throw new Error(`introuvable au clavier : ${motif}`);
}
async function contourVisible() {
  return page.evaluate(() => {
    const cs = getComputedStyle(document.activeElement);
    return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
  });
}
const resultats = [];
const ok = (l) => { resultats.push(`✔ ${l}`); };

// 1. L'en-tête : le premier arrêt du dossier est le retour vers « Vos lieux ».
await page.focus("body");
const retour = await tabulerJusqua(/^←\s*Vos lieux$/); // la barre de navigation porte aussi « Vos lieux »
assert.ok(await contourVisible(), "contour de focus sur « Vos lieux »");
assert.equal(await page.evaluate(() => document.activeElement.getAttribute("href")), "/rapport/dossiers");
ok(`en-tête : « ${retour} » atteint au clavier, contour visible, vers /rapport/dossiers`);
await tabulerJusqua(/Y revenir/);
assert.equal(await page.evaluate(() => document.activeElement.tagName), "A");
ok("en-tête : « Y revenir » (résidence différente) est un lien <a>");

// 2. Un critère inspiré : « Garder » au clavier envoie l'adoption de CE critère.
const garder = await tabulerJusqua(/^Garder : une ville étudiante$/);
assert.ok(await contourVisible(), "contour de focus sur une action discrète");
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
assert.deepEqual(envois.at(-1)?.corps?.action, "adopter");
assert.equal(envois.at(-1)?.corps?.criterion?.key, "vie_etudiante");
ok(`projet : « ${garder} » → POST /api/project/criterion { action: adopter, vie_etudiante }`);

// 3. Écarter, au clavier (Espace).
await page.focus("body");
await tabulerJusqua(/^Écarter, ça ne compte pas pour moi : la proximité de la mer$/);
await page.keyboard.press(" ");
await page.waitForTimeout(400);
assert.equal(envois.at(-1)?.corps?.action, "rejeter");
assert.equal(envois.at(-1)?.corps?.criterion?.key, "proximite_mer");
ok("projet : « Écarter » (Espace) → { action: rejeter, proximite_mer }");

// 4. La condition sans compromis : ouvrir la confirmation, l'annuler, sans rien envoyer.
const avant = envois.length;
await page.focus("body");
await tabulerJusqua(/^En faire une condition sans compromis : /);
await page.keyboard.press("Enter");
await page.waitForTimeout(200);
const annuler = await tabulerJusqua(/^Annuler$/);
await page.keyboard.press("Enter");
assert.equal(envois.length, avant, "ouvrir puis annuler n'envoie rien");
ok(`projet : confirmation d'une condition ouverte puis « ${annuler} », aucun envoi`);

// 5. Le lien avec la commune : un sélecteur, état annoncé par aria-pressed.
await page.focus("body");
await tabulerJusqua(/^J'y vis$/); // résidence ailleurs : la relation déduite est « J'envisage d'y vivre »
assert.equal(await page.evaluate(() => document.activeElement.getAttribute("aria-pressed")), "false");
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
assert.equal(envois.at(-1)?.route, "/api/report-context");
assert.equal(envois.at(-1)?.corps?.relation, "current_residence");
ok("projet : « J'y vis » → PATCH /api/report-context { relation: current_residence }");

// 6. Ce bien : choisir, puis re-choisir pour effacer.
await page.focus("body");
await tabulerJusqua(/^Pour l'acheter$/);
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
assert.deepEqual(envois.at(-1)?.corps, { dossierId: "dossier-de-test", objectif: "buy" });
const presse = await page.locator('button:has-text("Pour l\'acheter")').getAttribute("aria-pressed");
assert.equal(presse, "true");
await page.locator('button:has-text("Pour l\'acheter")').focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
assert.deepEqual(envois.at(-1)?.corps, { dossierId: "dossier-de-test", objectif: null });
ok("ce bien : « Pour l'acheter » → { objectif: buy }, aria-pressed=true ; re-choisi → { objectif: null }");
await page.focus("body");
await tabulerJusqua(/^Vous y habitez déjà$/);
await page.keyboard.press(" ");
await page.waitForTimeout(400);
assert.deepEqual(envois.at(-1)?.corps, { dossierId: "dossier-de-test", relation: "lives_here" });
ok("ce bien : « Vous y habitez déjà » (Espace) → { relation: lives_here }");

// 7. L'éditeur du projet s'ouvre au clavier ; le texte a son étiquette.
await page.focus("body");
await tabulerJusqua(/^Affiner mon projet$/);
await page.keyboard.press("Enter");
await page.waitForTimeout(300);
const etiquette = await page.evaluate(() => document.querySelector('label[for="projet-texte"]')?.textContent?.trim());
assert.match(etiquette ?? "", /Vos priorités/);
await tabulerJusqua(/^Annuler$/);
await page.keyboard.press("Enter");
ok("projet : « Affiner mon projet » ouvre l'éditeur (texte étiqueté), « Annuler » le referme");

// 8. Cibles tactiles : les gestes discrets et les réponses font au moins 44 px de haut sur écran tactile.
if (tactile) {
  const hauteurs = await page.evaluate(() => [...document.querySelectorAll("button")]
    .filter((b) => /option|action/.test(b.className))
    .map((b) => b.getBoundingClientRect().height));
  assert.ok(hauteurs.length > 0 && hauteurs.every((h) => h >= 44), `cibles tactiles : ${Math.min(...hauteurs)} px`);
  ok(`tactile : ${hauteurs.length} cibles, toutes ≥ 44 px`);
}

console.log(resultats.join("\n"));
console.log(`${envois.length} envois interceptés, aucun n'a atteint le serveur.`);
await navigateur.close();
