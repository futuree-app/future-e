// FUT-27 · Recette locale (anonyme) : « Où vivre » → session → /rapport. Aucune écriture : pas de compte.
import { chromium } from "playwright-core";
import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3127";
const OUT = process.env.OUT ?? ".";
const browser = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
const appels = [];
page.on("request", (r) => { if (r.url().includes("/api/")) appels.push(`${r.method()} ${new URL(r.url()).pathname}`); });

const lireSession = () => page.evaluate(() => localStorage.getItem("futuree:ouvivre:session"));
const resultats = {};

async function chercher(texte) {
  await page.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
  // Une recherche précédente est restaurée : le lecteur repasse par « Affiner » pour écrire la suivante.
  const affiner = page.getByRole("button", { name: /Affiner/ });
  if (await affiner.count()) await affiner.first().click();
  await page.locator("textarea").first().fill(texte);
  await page.getByRole("button", { name: "Explorer mes possibilités" }).click();
  try {
    await page.getByText("Territoires à explorer").waitFor({ timeout: 120_000 });
  } catch (e) {
    await page.screenshot({ path: `${OUT}/echec.png`, fullPage: true });
    console.log(appels.join("\n"));
    throw e;
  }
  await page.waitForTimeout(1500);
  const s = JSON.parse(await lireSession());
  return { v: s.v, texte: s.submittedText, communes: s.outcome.results.length };
}

// Cas C : trois recherches successives, chacune remplace la précédente.
for (const ville of ["Nantes", "Rennes", "Bordeaux"]) {
  resultats[ville] = await chercher(`Une ville à moins de 30 km de ${ville}, avec une gare et au calme`);
}
await page.screenshot({ path: `${OUT}/fut27-ou-vivre-bordeaux.png`, fullPage: false });
resultats.repriseVisibleAnonyme = await page.getByText(/cette recherche pour/).count();

// Retour sur /ou-vivre : la dernière recherche est restaurée (même lecteur que /rapport).
await page.goto(`${BASE}/ou-vivre`, { waitUntil: "networkidle" });
await page.getByText("Territoires à explorer").waitFor({ timeout: 15_000 });
resultats.restauree = await page.locator("textarea").first().inputValue();

const brute = await lireSession();
writeFileSync(`${OUT}/session-reelle.json`, brute);

// Anonyme : /rapport mène à la connexion ; la route de reprise refuse sans compte.
await page.goto(`${BASE}/rapport`, { waitUntil: "load" });
resultats.rapportAnonyme = new URL(page.url()).pathname;
resultats.fromSearchAnonyme = await page.evaluate(async (s) => {
  const j = JSON.parse(s);
  const r = await fetch("/api/project/from-search", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "apercu", parsed: j.parsed, rawText: j.submittedText }) });
  return r.status;
}, brute);
resultats.appelsProjet = appels.filter((a) => /\/api\/(profile|project)/.test(a));
console.log(JSON.stringify(resultats, null, 2));
await browser.close();
