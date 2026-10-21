// FUT-118 · Captures des surfaces (serveur local uniquement, aucun clic, aucune saisie).
// Usage : node scripts/fut118/capturer.mjs <url> <prefixe> [largeurs=1440,390] [--plein] [--reduit]
// Sortie : docs/audits/2026-10-20-fut118-releve/captures/<prefixe>-<largeur>[-page].jpg
// Mesure aussi le débordement horizontal (scrollWidth > innerWidth) et l'écrit sur la sortie standard.
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [url, prefixe, largeursBrutes = "1440,390", ...opts] = process.argv.slice(2);
if (!url?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const plein = opts.includes("--plein");
const reduit = opts.includes("--reduit");
const dossier = "docs/audits/2026-10-20-fut118-releve/captures";
mkdirSync(dossier, { recursive: true });
const navigateur = await chromium.launch({
  executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
});
for (const largeur of largeursBrutes.split(",").map(Number)) {
  const hauteur = largeur <= 480 ? 844 : 900;
  const page = await navigateur.newPage({
    viewport: { width: largeur, height: hauteur },
    deviceScaleFactor: largeur <= 480 ? 2 : 1,
    reducedMotion: reduit ? "reduce" : "no-preference",
    colorScheme: opts.includes("--clair") ? "light" : "dark",
  });
  await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
  await page.goto(url, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(Number(process.env.ATTENTE ?? 1500));
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const fichier = `${dossier}/${prefixe}-${largeur}${plein ? "-page" : ""}.jpg`;
  await page.screenshot({ path: fichier, fullPage: plein, type: "jpeg", quality: 72 });
  console.log(`${fichier}\tdébordement=${debord}px`);
  await page.close();
}
await navigateur.close();
