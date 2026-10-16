// FUT-50 · Captures des accueils (production en lecture, prototypes en local). Aucun clic, aucune saisie.
// Usage : node scripts/fut50/capturer.mjs <url> <prefixe> [largeurs=1440,1024,390] [--plein]
import { chromium } from "playwright-core";
const [url, prefixe, largeursBrutes = "1440,1024,390", ...opts] = process.argv.slice(2);
const plein = opts.includes("--plein");
const reduit = opts.includes("--reduit");
const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell` });
for (const largeur of largeursBrutes.split(",").map(Number)) {
  const hauteur = largeur <= 480 ? 844 : 900;
  const page = await navigateur.newPage({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: largeur <= 480 ? 2 : 1, reducedMotion: reduit ? "reduce" : "no-preference" });
  // En local seulement : le consentement est REFUSÉ d'avance pour que le bandeau ne masque pas la capture.
  if (url.startsWith("http://localhost")) await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => {});
  await page.waitForTimeout(Number(process.env.ATTENTE ?? 1500));
  // Masque l'indicateur du serveur de développement Next (absent en production).
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
  const fichier = `docs/audits/fut50-accueil/images/${prefixe}-${largeur}${plein ? "-page" : ""}.jpg`;
  await page.screenshot({ path: fichier, fullPage: plein, type: "jpeg", quality: 78 });
  console.log(fichier);
  await page.close();
}
await navigateur.close();
