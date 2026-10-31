// FUT-167 (D2) · Recette en vrai navigateur de la section « Risques industriels à cette adresse » (banc
// /dev/fut167-adresse, lecture réelle). Bureau (1440 px) et mobile (390 px) ; la section seule, et sa place dans le
// vrai module Logement.
// Usage : BASE=http://localhost:3168 SORTIE=<dossier> node scripts/fut167/capturer-adresse.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3168";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-30-fut167-d2-industrie-adresse";
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, m) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${m}`); if (!ok) echecs++; };
const ATTENDU = {
  feyzin: /Oui\. Le point de cette adresse est dans le périmètre réglementé du plan « Vallée de la chimie »/,
  fos: /Oui\. Le point de cette adresse est dans le périmètre réglementé du plan « PPRT - Fos Est 2018 »/,
  lyon: /Non, d'après la base consultée le 30\/10\/2026 : la commune est concernée par un plan/,
  paris: /Non\. Aucun plan de prévention des risques technologiques n'est recensé/,
  rural: /Non\. Aucun plan|Aucun site classé Seveso/,
  panne: /Non déterminable : la base des plans n'a pas répondu/,
  ancien: /n'existait pas lors de la collecte de ce rapport/,
};

for (const [format, viewport] of [["bureau", { width: 1440, height: 1000 }], ["mobile", { width: 390, height: 844 }]]) {
  const ctx = await nav.newContext({ viewport, deviceScaleFactor: 2, colorScheme: "dark" });
  for (const [cas, motif] of Object.entries(ATTENDU)) {
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(String(e)));
    await p.goto(`${BASE}/dev/fut167-adresse?vue=section&cas=${cas}`, { waitUntil: "networkidle", timeout: 120_000 });
    const section = p.locator("#fut167-section section");
    await section.waitFor({ timeout: 60_000 });
    const texte = (await section.innerText()).replace(/[\u00a0\u202f]/g, " ");
    verifier(motif.test(texte), `${format} ${cas} : réponse attendue`);
    verifier(!/sans danger|à l'abri|aucun risque|—/i.test(texte), `${format} ${cas} : aucune phrase interdite`);
    verifier(erreurs.length === 0, `${format} ${cas} : aucune erreur JavaScript ${erreurs.join(" | ")}`);
    await section.screenshot({ path: `${SORTIE}/${format}-section-${cas}.png` });
    await p.close();
  }
  // Dans le vrai module : la section se tient avec les risques au point.
  const p = await ctx.newPage();
  await p.goto(`${BASE}/dev/fut167-adresse?vue=logement&cas=feyzin`, { waitUntil: "networkidle", timeout: 120_000 });
  const s = p.locator("section[aria-labelledby='industrie-adresse']");
  await s.waitFor({ timeout: 60_000 });
  await s.scrollIntoViewIfNeeded();
  await p.screenshot({ path: `${SORTIE}/${format}-module-feyzin.png` });
  verifier(await s.isVisible(), `${format} : la section est rendue dans le module Logement`);
  await p.close();
  await ctx.close();
}
await nav.close();
console.log(echecs ? `${echecs} échec(s)` : "recette visuelle D2 : tout est vert");
process.exit(echecs ? 1 : 0);
