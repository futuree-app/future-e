// FUT-118 · Capture d'un élément (serveur local uniquement) : le n-ième élément qui correspond au sélecteur.
// Usage : node scripts/fut118/capturer-element.mjs <url> <selecteur> <prefixe> [largeur=360] [index=0]
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const [url, selecteur, prefixe, largeur = "360", index = "0"] = process.argv.slice(2);
if (!url?.startsWith("http://localhost")) throw new Error("Captures locales seulement.");
const dossier = "docs/audits/2026-10-20-fut118-releve/captures";
mkdirSync(dossier, { recursive: true });
const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await navigateur.newPage({ viewport: { width: Number(largeur), height: 844 }, deviceScaleFactor: Number(process.env.DPR ?? 2) });
await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
page.on("console", (m) => { if (m.type() === "error") console.log(`console.error : ${m.text().slice(0, 300)}`); });
await page.goto(url, { waitUntil: "networkidle", timeout: 120000 }).catch(() => {});
await page.waitForTimeout(1500);
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
const el = page.locator(selecteur).nth(Number(index));
await el.scrollIntoViewIfNeeded();
const b = await el.boundingBox();
const fichier = `${dossier}/${prefixe}-${largeur}.png`;
// Le cadre déborde de 70 px sous l'élément : les libellés de la règle du temps sont posés hors de son SVG.
await page.screenshot({ path: fichier, clip: { x: 0, y: Math.max(0, b.y - 12), width: Number(largeur), height: b.height + 82 } });
console.log(fichier);
await navigateur.close();
