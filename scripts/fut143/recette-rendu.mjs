// FUT-143 · Recette du rendu réel, sur ordinateur (1440 px) et sur Android/Chrome émulé (Pixel 7).
//
// A. Le banc `/dev/fut80?cas=monchaux` (vrai `LogementModule`, fixtures RNB/ADEME du 26/10/2026). Le clic
//    sur la ligne contredite ne doit RIEN écrire ; « Annuler » non plus ; « Retenir quand même » écrit UNE
//    fois. Le POST `/api/logement-dpe` est intercepté et compté, jamais transmis au serveur.
// B. La vraie page `/dossier` (vrai `DossierQualificationClient`). La BAN est servie par une réponse fixe ;
//    la route de qualification est simulée pour chaque état, sauf `villeurbanne-reel`, qui l'appelle
//    vraiment (sondes publiques ADEME et RNB en lecture seule, visiteur anonyme, aucun paiement).
//
// Lit le TEXTE rendu, vérifie l'absence de défilement horizontal, et capture chaque état.
// Usage : CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" node scripts/fut143/recette-rendu.mjs http://localhost:3143
import { chromium, devices } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { GEOCODEUR_BAN } from "../../src/lib/geocodeur-ban.ts";

const base = process.argv[2];
assert.match(base ?? "", /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir = "docs/audits/2026-10-26-fut143/rendu";
mkdirSync(dir, { recursive: true });
const norm = (t) => t.replace(/ /g, " ").replace(/\s+/g, " ");
const APPAREILS = [["ordinateur", { viewport: { width: 1440, height: 1000 } }], ["android", devices["Pixel 7"]]];
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const bilan = [];

async function debordement(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
}

// ── A. Le diagnostic contredit, dans la liste de l'adresse ─────────────────────────────────────────────
for (const [nomAppareil, opts] of APPAREILS) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const ecritures = [];
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route("**/*", (route) => {
    const r = route.request();
    if (r.method() === "GET") return route.continue();
    const chemin = new URL(r.url()).pathname;
    ecritures.push({ chemin, corps: r.postData() });
    // Le choix est « accepté » sans rien transmettre, pour voir l'état qui suit la confirmation.
    if (chemin === "/api/logement-dpe") return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
    return route.abort();
  });
  await page.goto(`${base}/dev/fut80?cas=monchaux`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(800);
  const dpe = () => ecritures.filter((e) => e.chemin === "/api/logement-dpe");

  let texte = norm(await page.locator("body").innerText());
  assert.match(texte, /rattaché par la base ADEME à un autre bâtiment/, `A/${nomAppareil}`);
  assert.doesNotMatch(texte, /L'une des deux bases se trompe/, `A/${nomAppareil} : explication imposée avant le geste`);
  assert.equal(dpe().length, 0, `A/${nomAppareil} : aucune attribution automatique (FUT-80)`);

  const ligne = page.getByRole("button", { name: /^Retenir ce diagnostic pour ce logement, après confirmation/ });
  await ligne.scrollIntoViewIfNeeded();
  await ligne.click();
  await page.waitForTimeout(300);
  texte = norm(await page.locator("body").innerText());
  assert.match(texte, /L'une des deux bases se trompe, et rien ne dit laquelle : ne le retenez que si vous savez/, `A/${nomAppareil}`);
  assert.equal(dpe().length, 0, `A/${nomAppareil} : le clic sur la ligne n'écrit rien`);
  assert.equal(await ligne.getAttribute("aria-expanded"), "true");
  assert.ok((await debordement(page)) <= 1, `A/${nomAppareil} : défilement horizontal`);
  await page.getByRole("group", { name: /Confirmer un diagnostic rattaché à un autre bâtiment/ }).screenshot({ path: `${dir}/a-monchaux-${nomAppareil}-explication.png` });
  await page.screenshot({ path: `${dir}/a-monchaux-${nomAppareil}-page.png`, fullPage: false });

  await page.getByRole("button", { name: "Annuler" }).click();
  await page.waitForTimeout(200);
  texte = norm(await page.locator("body").innerText());
  assert.doesNotMatch(texte, /L'une des deux bases se trompe/, `A/${nomAppareil} : annuler replie`);
  assert.equal(dpe().length, 0, `A/${nomAppareil} : annuler n'écrit rien`);

  await ligne.click();
  await page.getByRole("button", { name: "Retenir quand même ce diagnostic" }).click();
  await page.waitForTimeout(1200);
  assert.equal(dpe().length, 1, `A/${nomAppareil} : une écriture et une seule après confirmation`);
  const corps = JSON.parse(dpe()[0].corps);
  assert.equal(corps.status, "user_confirmed");
  assert.equal(corps.source, "liste");
  await page.screenshot({ path: `${dir}/a-monchaux-${nomAppareil}-confirme.png`, fullPage: false });
  assert.deepEqual(erreurs, [], `A/${nomAppareil} : erreurs JS`);
  // Seules les écritures de l'application : la mesure d'audience, interceptée elle aussi, n'a rien à faire ici.
  bilan.push({ cas: "A-monchaux", appareil: nomAppareil, ecritures: dpe().map((e) => `${e.chemin} ${e.corps}`) });
  await ctx.close();
}

// ── B. L'aperçu avant achat ─────────────────────────────────────────────────────────────────────────────
const BAN = {
  type: "FeatureCollection",
  features: [{
    type: "Feature", geometry: { type: "Point", coordinates: [4.880117, 45.769826] },
    properties: {
      id: "69266_0110_00002", label: "2 Rue des Alliés 69100 Villeurbanne", name: "2 Rue des Alliés", housenumber: "2",
      street: "Rue des Alliés", postcode: "69100", citycode: "69266", city: "Villeurbanne", type: "housenumber", score: 0.97,
    },
  }],
};
const qualifie = (matter) => ({
  status: "qualified", anchorSource: "ban_housenumber", matter,
  quote: { status: "provisional", basePriceCents: 3900, amountDueCents: 3900 },
});
const CAS_B = {
  "villeurbanne-reel": {
    reponse: null,
    present: [/Diagnostic énergétique aucun à cette adresse/i, /Autres adresses du même bâtiment diagnostics à vérifier/i,
      /Des diagnostics de logements le sont néanmoins à d'autres adresses du même bâtiment/],
    absent: [/ne pourra donc qualifier/, /Sans diagnostic, ce dossier/],
  },
  candidats: {
    reponse: qualifie({ dpe: "none", parcel: "found", memeBatiment: "candidats" }),
    present: [/Autres adresses du même bâtiment diagnostics à vérifier/i, /à vérifier avant d'en retenir un pour ce logement/],
    absent: [/ne pourra donc qualifier/, /la plupart des adresses/],
  },
  "dpe-exact": {
    reponse: qualifie({ dpe: "found", parcel: "found" }),
    present: [/Diagnostic énergétique disponible/i], absent: [/même bâtiment/, /Aucun diagnostic/],
  },
  "aucun-candidat": {
    reponse: qualifie({ dpe: "none", parcel: "found", memeBatiment: "aucun" }),
    present: [/Sans diagnostic, ce dossier ne pourra qualifier/, /la plupart des adresses/], absent: [/même bâtiment/, /néanmoins/],
  },
  "plusieurs-batiments": {
    reponse: qualifie({ dpe: "none", parcel: "found", memeBatiment: "sans_objet" }),
    present: [/Sans diagnostic, ce dossier ne pourra qualifier/], absent: [/même bâtiment/, /néanmoins/],
  },
  "rnb-indisponible": {
    reponse: qualifie({ dpe: "none", parcel: "found", memeBatiment: "non_verifie" }),
    present: [/n'ont pas pu être consultées à l'instant/, /sans garantie d'y trouver un diagnostic/],
    absent: [/ne pourra donc qualifier/, /Sans diagnostic, ce dossier/, /diagnostics à vérifier/],
  },
  "ademe-indisponible": {
    reponse: qualifie({ dpe: "unavailable", parcel: "found" }),
    present: [/n'a pas répondu/], absent: [/Aucun diagnostic/, /même bâtiment/],
  },
  "ancienne-reponse": {
    // Une réponse sans `memeBatiment` (déploiement antérieur) : le texte d'avant, rendu conditionnel.
    reponse: qualifie({ dpe: "none", parcel: "found" }),
    present: [/Sans diagnostic, ce dossier ne pourra qualifier/], absent: [/même bâtiment/],
  },
};

for (const [cas, att] of Object.entries(CAS_B)) {
  for (const [nomAppareil, opts] of APPAREILS) {
    const ctx = await browser.newContext(opts);
    const page = await ctx.newPage();
    const erreurs = [];
    const postes = [];
    page.on("pageerror", (e) => erreurs.push(e.message));
    await page.route(`${GEOCODEUR_BAN}/**`, (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BAN) }));
    await page.route("**/api/dossier/qualification", async (route) => {
      postes.push(route.request().url());
      if (!att.reponse) {
        const t = Date.now();
        const res = await route.fetch();
        bilan.push({ cas: `B-${cas}`, appareil: nomAppareil, route_reelle_ms: Date.now() - t, reponse: await res.json() });
        return route.fulfill({ response: res });
      }
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(att.reponse) });
    });
    await page.route("**/*", (route) => (route.request().method() === "GET" || route.request().url().includes("/api/dossier/qualification")
      ? route.fallback() : route.abort()));
    await page.goto(`${base}/dossier`, { waitUntil: "networkidle", timeout: 120_000 });
    const champ = page.getByPlaceholder("Saisissez une adresse");
    await champ.click();
    await champ.fill("2 rue des Alliés Villeurbanne");
    await page.getByRole("option").first().click({ timeout: 15_000 });
    await page.getByText("Ce que nous examinerons ici").waitFor({ timeout: 30_000 });
    await page.waitForTimeout(300);
    const texte = norm(await page.locator("body").innerText());
    for (const re of att.present) assert.match(texte, re, `B-${cas}/${nomAppareil} : ${re}`);
    for (const re of att.absent) assert.doesNotMatch(texte, re, `B-${cas}/${nomAppareil} : ${re}`);
    assert.equal(postes.length, 1, `B-${cas}/${nomAppareil} : une qualification`);
    assert.ok((await debordement(page)) <= 1, `B-${cas}/${nomAppareil} : défilement horizontal`);
    assert.deepEqual(erreurs, [], `B-${cas}/${nomAppareil} : erreurs JS`);
    const carte = page.locator(".card-answer").first();
    await carte.screenshot({ path: `${dir}/b-${cas}-${nomAppareil}.png` });
    if (att.reponse) bilan.push({ cas: `B-${cas}`, appareil: nomAppareil, ok: true });
    await ctx.close();
  }
}

await browser.close();
writeFileSync(`${dir}/bilan.json`, JSON.stringify(bilan, null, 2));
console.log(`Recette FUT-143 : ${bilan.length} vérifications, toutes conformes.`);
