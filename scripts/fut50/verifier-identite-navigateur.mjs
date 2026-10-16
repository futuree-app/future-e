// FUT-50 · Banc navigateur de l'identité confirmée (serveur de développement local).
// La commune choisie dans la recherche porte une étiquette de saisie ; le nom affiché après confirmation est celui
// du serveur (COG, index des communes). Les réponses arrivées après un changement de commune sont ignorées.
// Usage : BASE=http://localhost:3150 CHROME=<chrome-headless-shell> node scripts/fut50/verifier-identite-navigateur.mjs
import { chromium } from "playwright-core";

const BASE = process.env.BASE ?? "http://localhost:3150";
const nav = await chromium.launch({ executablePath: process.env.CHROME });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };

async function page(options = {}) {
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/dev/fut50/c`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  return { ctx, p };
}

/** Saisit, puis choisit au clavier la suggestion dont le texte contient `repere`. */
async function choisir(p, saisie, repere) {
  const champ = p.getByRole("combobox");
  await champ.fill("");
  await champ.click();
  await champ.pressSequentially(saisie, { delay: 50 });
  await p.waitForSelector('[role="option"]', { timeout: 15000 });
  const options = await p.getByRole("option").allInnerTexts();
  const k = options.findIndex((o) => o.replace(/\s+/g, " ").includes(repere));
  if (k < 0) throw new Error(`aucune suggestion « ${repere} » parmi ${options.join(" | ")}`);
  for (let i = 0; i < k; i++) await p.keyboard.press("ArrowDown");
  await p.keyboard.press("Enter");
}

const nom = (p) => p.locator("[data-identite]").innerText();
const etat = (p) => p.locator("[data-identite]").getAttribute("data-identite");

// 1. Le nom canonique, dès la confirmation, sans priorité.
for (const [saisie, repere, attendu] of [
  ["Saint-Denis", "974", "Saint-Denis (La Réunion)"],
  ["Fort-de-France", "Fort-de-France", "Fort-de-France (Martinique)"],
  ["Papeete", "Papeete", "Papeete (Polynésie française)"],
  ["Nîmes", "Nîmes", "Nîmes"],
  ["Saint-Denis", "93,", "Saint-Denis"],
]) {
  const { ctx, p } = await page();
  await choisir(p, saisie, repere);
  await p.waitForSelector('[data-identite="canonique"]', { timeout: 15000 });
  const affiche = await nom(p);
  const champ = await p.getByRole("combobox").inputValue();
  const priorites = await p.locator('button[aria-pressed="true"]').count();
  verifier(affiche === attendu && champ === attendu && priorites === 0, `${saisie} (${repere}) → « ${affiche} », champ « ${champ} », ${priorites} priorité choisie`);
  await ctx.close();
}

// 2. Réponses dans le désordre : la confirmation de Saint-Denis arrive APRÈS le choix de Nîmes.
{
  const { ctx, p } = await page();
  await p.route("**/dev/fut50/api/commune?insee=97411", async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await choisir(p, "Saint-Denis", "974");
  await p.getByRole("button", { name: "Changer de commune" }).click();
  await choisir(p, "Nîmes", "Nîmes");
  await p.waitForTimeout(3500);
  verifier((await nom(p)) === "Nîmes" && (await p.getByRole("combobox").inputValue()) === "Nîmes", `désordre : Saint-Denis lente, puis Nîmes → « ${await nom(p)} »`);
  // La même chose sans « Changer de commune » : la saisie reprend directement dans le champ.
  await p.route("**/dev/fut50/api/commune?insee=97209", async (route) => { await new Promise((r) => setTimeout(r, 2500)); await route.continue(); });
  await choisir(p, "Fort-de-France", "Fort-de-France");
  await choisir(p, "Papeete", "Papeete");
  await p.waitForTimeout(3500);
  verifier((await nom(p)) === "Papeete (Polynésie française)", `désordre : Fort-de-France lente, puis Papeete → « ${await nom(p)} »`);
  // Puis une priorité : la lecture porte la même identité.
  await p.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await p.waitForFunction(() => document.querySelector('[aria-live="polite"] article h2'), null, { timeout: 30000 });
  const titre = await p.locator('[aria-live="polite"] article h2').innerText();
  verifier(titre.endsWith("Papeete (Polynésie française)"), `lecture : « ${titre.replace(/\s+/g, " ")} »`);
  await ctx.close();
}

// 3. Commune inconnue du serveur : rien n'est confirmé, rien n'est inventé.
{
  const { ctx, p } = await page();
  await p.route("**/dev/fut50/api/commune?insee=30189", (route) => route.fulfill({ status: 404, contentType: "application/json", body: '{"error":"commune_inconnue"}' }));
  await choisir(p, "Nîmes", "Nîmes");
  await p.waitForSelector('[data-identite="inconnue"]', { timeout: 15000 });
  verifier((await etat(p)) === "inconnue", `inconnue → état « ${await etat(p)} »`);
  await ctx.close();
}

await nav.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
