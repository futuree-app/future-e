// FUT-129 · Captures du banc /dev/fut129 (Dossier comparatif rouvert, comparatif de communes nommées).
// Usage : node scripts/fut129/capturer-banc.mjs http://localhost:3129 <cas> [largeurs]
import { chromium } from "playwright-core";
const [base, cas, largeursBrutes = "1440,390"] = process.argv.slice(2);
if (!base?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const largeur of largeursBrutes.split(",").map(Number)) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 }, deviceScaleFactor: largeur <= 480 ? 2 : 1, colorScheme: "dark" });
  await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
  await page.goto(`${base}/dev/fut129?cas=${cas}`, { waitUntil: "networkidle", timeout: 180000 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
  // La ligne « Risques naturels » est dans un thème replié : on ouvre tous les dépliables de la vue.
  await page.evaluate(() => document.querySelectorAll("#fut129-vue details").forEach((d) => { d.open = true; }));
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const fichier = `docs/audits/2026-10-23-fut129-captures/${cas}-${largeur}.png`;
  await page.screenshot({ path: fichier, fullPage: true });
  console.log(`${fichier}\tdébordement=${debord}px`);
  await page.close();
}
await navigateur.close();
