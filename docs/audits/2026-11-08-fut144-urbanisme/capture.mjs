// Capture du bloc « Plan d'urbanisme de la parcelle » sur le banc /dev/fut81.
// usage : node capture.mjs <dossier-sortie> [cas,...]
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
const require = createRequire("/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut144/package.json");
const { chromium } = require("playwright-core");

const out = process.argv[2];
const CAS = (process.argv[3] ?? "besancon,sucy,merignac,six-fours,vigueur,incertaine,lyon,la-rochelle,vauquois,repli-invalide,sans-preuve,chatelard,grandvals,panne").split(",");
const LARGEURS = [["bureau", 1280], ["390", 390], ["360", 360]];
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const textes = {};
for (const [nom, w] of LARGEURS) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, colorScheme: "dark" });
  await ctx.route("**/*", (r) => (new URL(r.request().url()).hostname === "localhost" ? r.continue() : r.abort()));
  const page = await ctx.newPage();
  for (const cas of CAS) {
    await page.goto(`http://localhost:3144/dev/fut81?cas=${cas}`, { waitUntil: "networkidle", timeout: 120000 });
    await page.evaluate(() => {
      // Artefact du banc : la synthèse IA échoue en dev et affiche une page HTML brute, sans coupure.
      for (const x of document.querySelectorAll("p")) if (x.textContent.trimStart().startsWith("<!DOCTYPE")) x.style.display = "none";
      // Le bandeau de consentement fixe masque le bas de l'écran : hors sujet.
      for (const x of document.querySelectorAll("body *")) if (getComputedStyle(x).position === "fixed" && /ACCEPTER|Accepter/.test(x.textContent || "")) x.style.display = "none";
      const p = [...document.querySelectorAll("p")].find((x) => x.textContent.trim() === "Plan d’urbanisme de la parcelle");
      let e = p.parentElement;
      if (e.style.display !== "grid") e = e.parentElement;
      e.setAttribute("data-capture", "urbanisme");
    });
    const cadre = page.locator("[data-capture=urbanisme]");
    await cadre.scrollIntoViewIfNeeded();
    await cadre.screenshot({ path: `${out}/${nom}-${cas}.png` });
    if (nom === "bureau") {
      textes[cas] = await cadre.innerText();
      // Le dépliable ouvert, pour la capture de détail.
      const d = cadre.locator("details");
      for (let i = 0; i < (await d.count()); i++) await d.nth(i).evaluate((e) => { e.open = true; });
      await cadre.screenshot({ path: `${out}/${nom}-${cas}-deplie.png` });
      textes[`${cas} (déplié)`] = await cadre.innerText();
    }
  }
  await ctx.close();
}
writeFileSync(`${out}/textes.json`, JSON.stringify(textes, null, 2));
await browser.close();
console.log("ok", Object.keys(textes).length);
