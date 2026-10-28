#!/usr/bin/env node
// FUT-147 · Recette réelle, bureau (1440 px) et mobile (390 px), sur le serveur de développement local :
//   1. Territoire : la vraie grille de cartes (banc /dev/fut147), volet « Conditions favorables au feu »
//      ouvert, « En savoir plus » déplié ;
//   2. Dossier comparatif : la vraie vue achetée (banc /dev/fut147), ligne « Incendies observés » ;
//   3. Comparateur : la vraie page /ou-vivre, restaurée depuis une session construite par la route `match`
//      (aucun modèle : l'analyse du projet est fournie, la synthèse rédigée est vide).
// TOUTE requête vers une route qui appelle un modèle est BLOQUÉE et comptée ; le script échoue si une
// seule part. Captures et textes relevés dans `docs/audits/2026-10-28-fut147/`.
//
//   npx next dev -p 3147 &   node scripts/fut147/recette.mjs [--base http://localhost:3147]
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg("base", "http://localhost:3147");
const OUT = path.join("docs", "audits", "2026-10-28-fut147");
mkdirSync(OUT, { recursive: true });

const ROUTES_MODELE = /\/api\/(comparateur-vie\/(parse|synthesize|ask)|synthesize-quartier|ask|territoire\/synthese)/;
const FORMATS = [
  { nom: "bureau", viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false },
  { nom: "mobile", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
];
const PROJETS = [
  { nom: "pays-basque", texte: "Nature, calme, peu de risque de feu, Pyrénées-Atlantiques", departements: ["64"] },
  { nom: "gironde", texte: "Nature, calme, peu de risque de feu, Gironde", departements: ["33"] },
];
const TERRITOIRES = ["brasparts", "gonfaron", "garde-freinet", "lyon", "paris", "marseille", "creteil"];
const PACKS = ["pack-finistere", "pack-maures", "pack-marseille"];

const releve = { base: BASE, date: new Date().toISOString(), appelsModeleBloques: [], territoire: {}, pack: {}, comparateur: {} };
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });

async function contexte(f) {
  const ctx = await browser.newContext({ viewport: f.viewport, isMobile: f.isMobile, hasTouch: f.hasTouch, deviceScaleFactor: f.deviceScaleFactor ?? 1, locale: "fr-FR" });
  await ctx.route(ROUTES_MODELE, (route) => { releve.appelsModeleBloques.push(route.request().url()); return route.abort(); });
  return ctx;
}
const texte = (s) => s.replace(/\s+/g, " ").trim();

for (const f of FORMATS) {
  const ctx = await contexte(f);
  const page = await ctx.newPage();

  for (const cas of TERRITOIRES) {
    await page.goto(`${BASE}/dev/fut147?cas=${cas}`, { waitUntil: "networkidle", timeout: 180_000 });
    const carte = page.getByText("Conditions favorables au feu", { exact: true }).first();
    await carte.scrollIntoViewIfNeeded();
    await carte.click();
    const volet = page.locator(".metric-drawer-panel");
    await volet.waitFor({ timeout: 20_000 });
    const plus = volet.locator("summary", { hasText: "En savoir plus" });
    if (await plus.count()) await plus.first().click();
    await page.waitForTimeout(400);
    await volet.screenshot({ path: path.join(OUT, `territoire-${cas}-${f.nom}.png`) });
    (releve.territoire[cas] ??= {})[f.nom] = texte(await volet.innerText());
    // Débordement horizontal (mobile surtout) : le volet ne doit jamais dépasser l'écran.
    const deborde = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    if (deborde) releve.territoire[cas][`${f.nom}-debordement`] = true;
    await page.keyboard.press("Escape");
  }

  for (const cas of PACKS) {
    await page.goto(`${BASE}/dev/fut147?cas=${cas}`, { waitUntil: "networkidle", timeout: 180_000 });
    const lib = page.getByText("Incendies observés", { exact: true }).first();
    if (!(await lib.count())) { (releve.pack[cas] ??= {})[f.nom] = "LIGNE ABSENTE"; continue; }
    await lib.scrollIntoViewIfNeeded();
    // Les deux lignes voisines de la matrice : « Météo propice aux feux » puis « Incendies observés ».
    const zone = await page.evaluate(() => {
      const ligneDe = (label) => [...document.querySelectorAll("div.border-t")].find((d) => d.firstElementChild?.textContent?.trim().startsWith(label));
      const a = ligneDe("Météo propice aux feux"), b = ligneDe("Incendies observés");
      if (!a || !b) return null;
      const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
      return { x: Math.min(ra.left, rb.left) - 8, y: ra.top + window.scrollY - 8, width: Math.max(ra.width, rb.width) + 16, height: rb.bottom - ra.top + 16, texte: `${a.innerText}\n---\n${b.innerText}` };
    });
    if (!zone) { (releve.pack[cas] ??= {})[f.nom] = "LIGNES INTROUVABLES"; continue; }
    await page.screenshot({ path: path.join(OUT, `pack-${cas}-${f.nom}.png`), fullPage: true, clip: { x: Math.max(0, zone.x), y: Math.max(0, zone.y), width: zone.width, height: zone.height } });
    (releve.pack[cas] ??= {})[f.nom] = texte(zone.texte);
  }

  for (const p of PROJETS) {
    const parsed = {
      reformulation: p.texte,
      hardConstraints: { departements: p.departements },
      preferences: [{ key: "faible_risque_feu", weight: 3 }, { key: "nature", weight: 2 }, { key: "cadre_calme", weight: 2 }],
    };
    const r = await fetch(`${BASE}/api/comparateur-vie/match`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ parsed }) });
    const outcome = await r.json();
    await page.goto(`${BASE}/ou-vivre`, { waitUntil: "domcontentloaded", timeout: 180_000 });
    await page.evaluate(({ parsed, outcome, texte }) => {
      localStorage.setItem("futuree:ouvivre:session", JSON.stringify({
        v: 5, savedAt: Date.now(), submittedText: texte, parsed, outcome, synthesis: "", askMessages: [], askRemaining: 2, askLimit: false,
      }));
    }, { parsed, outcome, texte: p.texte });
    await page.reload({ waitUntil: "networkidle", timeout: 180_000 });
    const cartes = page.locator("article.card-answer");
    await cartes.first().waitFor({ timeout: 30_000 });
    const grille = cartes.first().locator("xpath=..");
    await grille.scrollIntoViewIfNeeded();
    await grille.screenshot({ path: path.join(OUT, `comparateur-${p.nom}-${f.nom}.png`) });
    (releve.comparateur[p.nom] ??= {})[f.nom] = await cartes.evaluateAll((as) => as.map((a) => a.innerText.replace(/\s+/g, " ").trim()));
  }
  await ctx.close();
}
await browser.close();
writeFileSync(path.join(OUT, "recette-textes.json"), `${JSON.stringify(releve, null, 1)}\n`);
console.log(`captures et textes dans ${OUT} ; appels modèle bloqués : ${releve.appelsModeleBloques.length}`);
if (releve.appelsModeleBloques.length > 0) { console.error(releve.appelsModeleBloques); process.exit(1); }
