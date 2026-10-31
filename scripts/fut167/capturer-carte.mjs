// FUT-167 · Recette en vrai navigateur de la carte « Santé environnementale » (banc /dev/fut167, données réelles).
// Bureau (1440 px) et mobile (390 px) : la carte dans la grille, puis son volet ouvert ; et l'arrivée par une
// preuve (#evidence-health-radon…) qui doit ouvrir le volet sur SA ligne.
// Usage : BASE=http://localhost:3167 SORTIE=<dossier> node scripts/fut167/capturer-carte.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3167";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-30-fut167-d1-sante-environnementale";
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, m) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${m}`); if (!ok) echecs++; };

for (const [format, viewport] of [["bureau", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await nav.newContext({ viewport, deviceScaleFactor: 2, colorScheme: "dark" });
  for (const cas of ["feyzin", "lille", "radon", "larochelle-adresse", "paris", "lyon9"]) {
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(String(e)));
    await p.goto(`${BASE}/dev/fut167?cas=${cas}`, { waitUntil: "networkidle", timeout: 120_000 });
    const carte = p.locator("#evidence-health-air-background");
    await carte.waitFor({ timeout: 60_000 });
    await carte.scrollIntoViewIfNeeded();
    await carte.screenshot({ path: `${SORTIE}/${format}-${cas}-carte.png` });
    await carte.click();
    const volet = p.locator("aside.metric-drawer-panel");
    await volet.waitFor();
    await p.screenshot({ path: `${SORTIE}/${format}-${cas}-volet.png`, fullPage: false });
    const texte = await volet.innerText();
    verifier(/les quatre lectures/i.test(texte) && /Air de fond/.test(texte) && /Radon/.test(texte), `${format} ${cas} : volet à quatre lectures`);
    verifier(!/air (pur|sain)|sans danger|—/i.test(texte), `${format} ${cas} : aucune phrase interdite`);
    verifier(erreurs.length === 0, `${format} ${cas} : aucune erreur JavaScript ${erreurs.join(" | ")}`);
    await p.close();
  }
  // L'arrivée par une preuve ouvre le volet sur la ligne visée.
  for (const [cas, ancre, ligne] of [["radon", "evidence-health-radon", "Radon"], ["lille", "evidence-health-air-background", "Air de fond"], ["feyzin", "evidence-health-industrial-site", "Sites industriels"]]) {
    const p = await ctx.newPage();
    await p.goto(`${BASE}/dev/fut167?cas=${cas}#${ancre}`, { waitUntil: "networkidle", timeout: 120_000 });
    const volet = p.locator("aside.metric-drawer-panel");
    await volet.waitFor({ timeout: 30_000 });
    const cible = volet.locator("[data-cible='true']");
    const lu = (await cible.count()) ? await cible.first().innerText() : "";
    verifier(lu.startsWith(ligne), `${format} arrivée #${ancre} : ligne « ${ligne} » mise en évidence (${lu.split("\n")[0]})`);
    await p.screenshot({ path: `${SORTIE}/${format}-arrivee-${ancre.replace("evidence-health-", "")}.png` });
    await p.close();
  }
  await ctx.close();
}
await nav.close();
console.log(echecs ? `${echecs} échec(s)` : "recette visuelle : tout est vert");
process.exit(echecs ? 1 : 0);
