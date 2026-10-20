// FUT-114 · BANC NAVIGATEUR DU PARCOURS 14 € : accueil → choix de la commune → offre → paiement → connexion.
//
// Usage : serveur local lancé (`npm run build && npx next start -p 3114`), puis
//   node scripts/fut114/parcours-territoire.mjs [http://localhost:3114]
// La recherche de commune interroge geo.api.gouv.fr (lecture publique). Aucun compte, aucun paiement : sans
// session, la route de paiement répond AUTH_REQUIRED APRÈS la garde territoriale, ce qui prouve que la commune
// choisie a passé la garde ; le paiement avec session est couvert par `fut114-garde-territoriale.test.ts`.
import { chromium } from "playwright-core";

const BASE = process.argv[2] ?? "http://localhost:3114";
const exe = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const navigateur = await chromium.launch({ executablePath: exe, headless: true });
const page = await navigateur.newPage();
let echecs = 0;
const ok = (cond, msg) => { console.log(`${cond ? "✔" : "✖"} ${msg}`); if (!cond) echecs += 1; };

// Ce que `TerritoryUnlockPanel` envoie, rejoué depuis la page (même origine, sans session).
const preparer = (corps) => page.evaluate(async (c) => {
  const r = await fetch("/api/stripe/create-payment-intent", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(c) });
  return { status: r.status, ...(await r.json()) };
}, corps);

// Le choix se fait comme un visiteur le ferait, jamais par un événement simulé : un vrai clic de souris,
// Entrée après les flèches, ou Espace après une tabulation (revue de la PR #67 : la sélection ne répondait
// qu'au `mousedown`, que l'ancien banc simulait précisément).
async function choisir(saisie, nom, mode) {
  const champ = page.getByPlaceholder("Nantes, Ajaccio, Lyon…");
  await champ.fill("");
  await champ.pressSequentially(saisie, { delay: 30 });
  const ligne = page.locator("button.cs-row", { hasText: nom }).first();
  await ligne.waitFor({ timeout: 10_000 });
  if (mode === "clic") return ligne.click();
  await page.keyboard.press(mode === "entree" ? "ArrowDown" : "Tab");
  for (let i = 0; i < 8; i += 1) {
    const focus = await page.evaluate(() => document.activeElement?.textContent ?? "");
    if (focus.includes(nom)) break;
    await page.keyboard.press("ArrowDown");
  }
  ok((await page.evaluate(() => document.activeElement?.textContent ?? "")).includes(nom), `${mode} : « ${nom} » a le focus clavier`);
  await page.keyboard.press(mode === "entree" ? "Enter" : "Space");
}

async function parcours(saisie, nom, insee, mode) {
  console.log(`\n— ${nom} (${insee}), choix par ${mode}`);
  // 1. L'accueil, section Tarifs.
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  const cta = page.getByRole("link", { name: "Ouvrir un dossier de territoire · 14 €" });
  ok(await cta.count() === 1, "accueil : le bouton 14 € des Tarifs existe");
  await cta.click();
  await page.waitForURL(/\/checkout\/rapport-complet$/);
  ok(await page.getByText("Quelle commune voulez-vous examiner").isVisible(), "le bouton mène au choix de la commune");
  ok(await page.locator("iframe[src*='stripe']").count() === 0, "aucun formulaire de paiement avant le choix");
  // 2. Le choix de la commune.
  await choisir(saisie, nom, mode);
  await page.waitForURL(new RegExp(`/territoire/${insee}/debloquer\\?`), { timeout: 15_000 });
  const url = new URL(page.url());
  ok(url.searchParams.get("nom") === nom && url.searchParams.get("source") === "tarifs", `offre ouverte : ${url.pathname}${url.search}`);
  // 3. L'offre Territoire de cette commune.
  ok(await page.getByRole("heading", { name: `Ouvrir le dossier de ${nom}` }).isVisible(), `l'offre nomme ${nom}`);
  ok((await page.textContent("body")).includes("14 € · paiement unique"), "l'offre annonce 14 €");
  // 5. L'aller-retour de connexion revient sur la même offre.
  const href = await page.getByRole("link", { name: "J'ai déjà un compte" }).getAttribute("href");
  const next = new URL(href, BASE).searchParams.get("next");
  ok(next === `${url.pathname}${url.search}`, `connexion : next=${next}`);
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded" });
  const champNext = await page.locator("input[name=next]").first().inputValue().catch(() => null);
  ok(champNext === next, "le formulaire de connexion garde la même offre");
  await page.goto(`${BASE}${next}`, { waitUntil: "domcontentloaded" });
  ok(await page.getByRole("heading", { name: `Ouvrir le dossier de ${nom}` }).isVisible(), "retour : même territoire");
  // 4. La préparation du paiement sur ce code : la garde territoriale l'accepte (seule la session manque).
  const r = await preparer({ productType: "one-shot", targetInsee: insee, targetCommune: nom, source: "comparateur_vie" });
  ok(r.status === 401 && r.code === "AUTH_REQUIRED", `paiement ${insee} : garde passée, connexion demandée (${r.status} ${r.code})`);
}

await parcours("Nantes", "Nantes", "44109", "entree");
await parcours("Ajacc", "Ajaccio", "2A004", "clic");
await parcours("Marseille", "Marseille", "13055", "espace");

console.log("\n— Clavier : Échap");
await page.goto(`${BASE}/checkout/rapport-complet`, { waitUntil: "domcontentloaded" });
await page.getByPlaceholder("Nantes, Ajaccio, Lyon…").pressSequentially("Nant", { delay: 30 });
await page.locator("button.cs-row").first().waitFor();
await page.keyboard.press("ArrowDown");
await page.keyboard.press("Escape");
ok(await page.locator("button.cs-row").count() === 0, "Échap ferme la liste");
ok(await page.evaluate(() => document.activeElement?.tagName) === "INPUT", "Échap rend le focus au champ");

console.log("\n— Refus");
await page.goto(`${BASE}/checkout/rapport-complet`, { waitUntil: "domcontentloaded" });
ok(page.url().endsWith("/checkout/rapport-complet"), "ancienne URL ouverte en direct : la page de choix s'affiche");
await choisir("Fort-de-France", "Fort-de-France", "clic");
await page.getByRole("status").waitFor({ timeout: 5_000 });
ok((await page.getByRole("status").textContent()).includes("France métropolitaine, Corse comprise"), "commune ultramarine : message, aucune offre");
ok(page.url().endsWith("/checkout/rapport-complet"), "commune ultramarine : on reste sur le choix");
const direct = await page.goto(`${BASE}/territoire/97209/debloquer?nom=Fort-de-France`);
ok(direct.status() === 404, "offre ultramarine forgée : 404");
for (const [corps, code] of [
  [{ productType: "one-shot" }, "TERRITORY_UNVERIFIED"],
  [{ productType: "one-shot", targetInsee: "97209" }, "TERRITORY_NOT_ELIGIBLE"],
]) {
  await page.goto(`${BASE}/checkout/rapport-complet`, { waitUntil: "domcontentloaded" });
  const r = await preparer(corps);
  ok(r.status === 422 && r.code === code, `paiement ${corps.targetInsee ?? "sans commune"} : ${r.status} ${r.code}`);
}

await navigateur.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nParcours vérifié.");
process.exit(echecs ? 1 : 0);
