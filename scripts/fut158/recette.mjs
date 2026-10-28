// FUT-158 · Recette navigateur : la page publique inondation de Metz, avant (port 3152, main) et après (3158).
// Usage : node scripts/fut158/recette.mjs docs/audits/2026-10-28-fut158-incident-georisques
import { chromium } from "playwright-core";
const SORTIE = process.argv[2];
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
for (const [nom, ctxOpts] of [["bureau", { viewport: { width: 1440, height: 1000 } }], ["mobile", { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const ctx = await nav.newContext(ctxOpts);
  for (const [port, etat] of [[3152, "avant"], [3158, "apres"]]) {
    const p = await ctx.newPage();
    await p.goto(`http://localhost:${port}/inondation/57463`, { waitUntil: "networkidle", timeout: 120000 });
    const bloc = p.getByText("Ce que la commune a déjà vécu").first();
    const present = await bloc.count() > 0;
    console.log(`${nom} ${etat} : bloc CatNat ${present ? "affiché" : "absent"}`);
    if (etat === "apres" && !present) echecs++;
    if (present) { await bloc.scrollIntoViewIfNeeded(); await p.screenshot({ path: `${SORTIE}/${nom}-${etat}-inondation-metz.png` }); }
    else await p.screenshot({ path: `${SORTIE}/${nom}-${etat}-inondation-metz.png`, fullPage: false });
    const debord = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (debord > 0) { console.log(`${nom} ${etat} débordement ${debord}px`); echecs++; }
    await p.close();
  }
}
await nav.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "recette verte");
