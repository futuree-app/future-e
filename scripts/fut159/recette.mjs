// FUT-159 et FUT-161 · Recette en vrai navigateur des pages /inondation et /chaleur, bureau (1440 px) et mobile
// (390 px, toucher). Le serveur local tourne avec l'interrupteur `panne-georisques.mjs` ; ce script l'actionne.
// Les pannes passent AVANT les lectures réussies : une réponse réussie est ensuite servie par le cache de données
// du serveur, et la coupure ne l'atteindrait plus.
// Usage : BASE=http://localhost:3159 PANNE_FICHIER=<chemin> node scripts/fut159/recette.mjs <dossier de captures>
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3159";
const PANNE = process.env.PANNE_FICHIER;
const SORTIE = process.argv[2];
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };
const FORMATS = {
  bureau: { viewport: { width: 1440, height: 1000 } },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
};
const INDISPO = "Donnée temporairement indisponible";

async function ouvrir(format, chemin) {
  const ctx = await nav.newContext(FORMATS[format]);
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(`${BASE}${chemin}`, { waitUntil: "networkidle", timeout: 180_000 });
  const texte = await p.locator("main").first().innerText().catch(() => p.locator("body").innerText());
  const debord = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  return { p, ctx, texte, debord, erreurs };
}

/** Le bloc qui suit un titre de section, pour vérifier que la panne est dite à sa place. */
const indispoSous = (texte, titre) => new RegExp(`${titre}[\\s\\S]{0,200}${INDISPO}`, "i").test(texte);

async function capture(o, nom, ancre) {
  const cible = o.p.getByText(ancre, { exact: false }).first();
  if (await cible.count()) await cible.scrollIntoViewIfNeeded();
  await o.p.screenshot({ path: `${SORTIE}/${nom}.png` });
}

async function cas(format, chemin, nom, attentes, ancre) {
  const o = await ouvrir(format, chemin);
  for (const [ok, message] of attentes(o.texte)) verifier(ok, `${format} ${nom} : ${message}`);
  verifier(o.debord <= 0, `${format} ${nom} : aucun défilement horizontal (${o.debord} px)`);
  verifier(o.erreurs.length === 0, `${format} ${nom} : aucune erreur JavaScript ${o.erreurs.join(" | ")}`);
  if (ancre) await capture(o, `${format}-${nom}`, ancre);
  await o.ctx.close();
}

// ── 1. Géorisques coupé en entier ──
writeFileSync(PANNE, "tout");
for (const format of ["bureau", "mobile"]) {
  await cas(format, "/inondation/57463", "inondation-metz-panne", (t) => [
    [indispoSous(t, "Risques officiels reconnus sur cette commune"), "risques officiels : « donnée temporairement indisponible » à la place du bloc"],
    [indispoSous(t, "Ce que la commune a déjà vécu"), "arrêtés CatNat : « donnée temporairement indisponible » à la place du bloc"],
    [/les arrêtés de catastrophe naturelle pour inondation n'ont pas pu être lus/.test(t), "la phrase nomme ce qui n'a pas été lu"],
    [!/a déjà été reconnue/.test(t) && !/reconnaissances? officielles/.test(t), "aucun compte d'arrêtés inventé"],
    [/Projections/i.test(t) && !/Données DRIAS indisponibles/.test(t), "les projections DRIAS, indépendantes, restent affichées"],
  ], "Ce que la commune a déjà vécu");
  await cas(format, "/chaleur/57463", "chaleur-metz-panne", (t) => [
    [indispoSous(t, "Ce que la commune a déjà vécu"), "arrêtés sécheresse : « donnée temporairement indisponible »"],
    [/les arrêtés de catastrophe naturelle pour sécheresse des sols n'ont pas pu être lus/.test(t), "la phrase nomme ce qui n'a pas été lu"],
    [indispoSous(t, "Ce que la chaleur extrême aggrave ici"), "risques aggravés par la chaleur : « donnée temporairement indisponible »"],
    [!/a déjà été reconnue/.test(t), "aucun compte d'arrêtés inventé"],
  ], "Ce que la commune a déjà vécu");
}

// ── 2. Seuls les arrêtés coupés : les risques officiels restent affichés ──
writeFileSync(PANNE, "catnat");
for (const format of ["bureau", "mobile"]) {
  await cas(format, "/inondation/66008", "inondation-argeles-catnat-seul-en-panne", (t) => [
    [/Risques officiels reconnus sur cette commune/i.test(t) && !indispoSous(t, "Risques officiels reconnus sur cette commune"), "risques officiels lus et affichés"],
    [indispoSous(t, "Ce que la commune a déjà vécu"), "arrêtés CatNat seuls dits indisponibles"],
  ], "Ce que la commune a déjà vécu");
}

// ── 3. Retour du service ──
writeFileSync(PANNE, "");
for (const format of ["bureau", "mobile"]) {
  await cas(format, "/inondation/57463", "inondation-metz-retour", (t) => [
    [!t.includes(INDISPO), "plus aucune mention d'indisponibilité"],
    [/Risques officiels reconnus sur cette commune/i.test(t), "risques officiels affichés"],
    [/Metz a déjà été reconnue 17 fois en état de catastrophe naturelle/.test(t), "FUT-161 : « 17 fois », espace insécable"],
    [!/\dfois/.test(t), "FUT-161 : aucun nombre collé à « fois »"],
  ], "Ce que la commune a déjà vécu");
  await cas(format, "/chaleur/57463", "chaleur-metz-retour", (t) => [
    [!t.includes(INDISPO), "plus aucune mention d'indisponibilité"],
    [/Metz a déjà été reconnue \d+ fois en état de catastrophe naturelle/.test(t), "FUT-161 : nombre et « fois » liés"],
    [!/\dfois/.test(t), "FUT-161 : aucun nombre collé à « fois »"],
  ], "Ce que la commune a déjà vécu");
  await cas(format, "/inondation/66008", "inondation-argeles-retour", (t) => [
    [!t.includes(INDISPO) && /Argelès-sur-Mer a déjà été reconnue \d+ fois/.test(t), "arrêtés revenus"],
  ]);

  // ── 4. Source lue, sans fait : le bloc reste absent, sans mention de panne ──
  await cas(format, "/inondation/01002", "inondation-abergement-de-varey-vide", (t) => [
    [!/Risques officiels reconnus sur cette commune/i.test(t), "aucun risque inondation recensé : bloc absent, comme avant"],
    [!t.includes(INDISPO), "aucune panne annoncée"],
    [/a déjà été reconnue 2 fois/.test(t), "les 2 arrêtés inondation affichés"],
  ]);
  await cas(format, "/chaleur/01001", "chaleur-abergement-clemenciat-vide", (t) => [
    [!/Ce que la commune a déjà vécu/.test(t) && !/Ce que la chaleur extrême aggrave ici/.test(t), "aucun fait GASPAR chaleur : blocs absents, comme avant"],
    [!t.includes(INDISPO), "aucune panne annoncée"],
  ]);
}

await nav.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "recette verte");
process.exit(echecs ? 1 : 0);
