// FUT-127 · Captures (copie du script FUT-125, dossier de sortie propre) d'une zone de page (serveur local uniquement, aucune saisie, aucun envoi).
//
// Usage : node scripts/fut127/capturer.mjs <url> <prefixe> <de> <a> [largeurs=1440,390,360] [--clair] [--ouvrir=<texte>]
//   <de>, <a>   sélecteurs CSS : la capture va du haut du premier au bas du second (zone de lecture)
//   --ouvrir    clique d'abord le bouton qui porte ce texte (ouvrir un éditeur : aucun envoi)
//   --deplier   ouvre les dépliables « Données et limites » de la zone (preuves de niveau 3)
//   MOTEUR=webkit  rend avec WebKit (moteur de Safari) au lieu de Chrome
// Sortie : docs/audits/2026-10-22-fut127-correctifs/captures/<prefixe>-<largeur>[-clair].png
// Mesure aussi le débordement horizontal (scrollWidth > innerWidth) et l'écrit sur la sortie standard.
import { chromium, webkit } from "playwright-core";
import { mkdirSync } from "node:fs";

const [url, prefixe, de, a, largeursBrutes = "1440,390,360", ...opts] = process.argv.slice(2);
if (!url?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const clair = opts.includes("--clair");
const ouvrir = opts.find((o) => o.startsWith("--ouvrir="))?.slice(9);
const deplier = opts.includes("--deplier");
const moteurWebkit = process.env.MOTEUR === "webkit";
const dossier = "docs/audits/2026-10-22-fut127-correctifs/captures";
mkdirSync(dossier, { recursive: true });
const navigateur = moteurWebkit
  ? await webkit.launch({ headless: true })
  : await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
for (const largeur of largeursBrutes.split(",").map(Number)) {
  const page = await navigateur.newPage({
    viewport: { width: largeur, height: largeur <= 480 ? 844 : 900 },
    deviceScaleFactor: largeur <= 480 ? 2 : 1,
    colorScheme: clair ? "light" : "dark",
  });
  await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
  page.on("console", (m) => { if (m.type() === "error") console.log(`console.error : ${m.text().slice(0, 200)}`); });
  await page.goto(url, { waitUntil: "networkidle", timeout: 180000 }).catch(() => {});
  await page.waitForTimeout(Number(process.env.ATTENTE ?? 1200));
  await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
  if (ouvrir) { await page.getByRole("button", { name: ouvrir, exact: true }).click(); await page.waitForTimeout(400); }
  if (deplier) { await page.evaluate(() => document.querySelectorAll("#fut127-dossier details").forEach((d) => { d.open = true; })); await page.waitForTimeout(300); }
  const debord = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const haut = await page.locator(de).first().boundingBox();
  const bas = await page.locator(a).first().boundingBox();
  if (!haut || !bas) { console.log(`${prefixe}-${largeur} : zone introuvable`); await page.close(); continue; }
  // `boundingBox` est relatif à la fenêtre ; la capture pleine page attend des coordonnées de page.
  const defile = await page.evaluate(() => window.scrollY);
  const y = Math.max(0, haut.y + defile - 16);
  const h = Math.min(bas.y + defile + bas.height + 16 - y, 6000);
  const fichier = `${dossier}/${prefixe}-${largeur}${clair ? "-clair" : ""}${moteurWebkit ? "-webkit" : ""}.png`;
  await page.screenshot({ path: fichier, clip: { x: 0, y, width: largeur, height: h }, fullPage: true });
  console.log(`${fichier}\tdébordement=${debord}px`);
  await page.close();
}
await navigateur.close();
