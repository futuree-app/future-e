// FUT-126 · RECETTE AU CLAVIER des finitions du Relevé (serveur local uniquement, aucun envoi, aucune saisie).
//
// Rubrique des contrôles, définition des argiles : tout se déplie à la tabulation et à Entrée ou Espace,
// avec un contour de focus visible ; « Déplier » devient « Replier ». Sur écran tactile, un appui suffit.
// Usage : node scripts/fut126/clavier.mjs [base=http://localhost:3126] [largeur=1440] [--tactile]
import { chromium } from "playwright-core";
import assert from "node:assert/strict";

const [base = "http://localhost:3126", largeur = "1440", ...opts] = process.argv.slice(2);
if (!base.startsWith("http://localhost")) throw new Error("Serveur local seulement.");
const tactile = opts.includes("--tactile");
const url = `${base}/dev/fut92?lieu=${encodeURIComponent("Place de l'Hôtel de Ville 17000 La Rochelle")}&prefs=vie_locale:3,eviter_grandes_villes:3,calme_sonore:2,mobilite_quotidienne:2,proximite_mer:2,faible_risque_inondation:2`;

const navigateur = await chromium.launch({ executablePath: process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await navigateur.newPage({ viewport: { width: Number(largeur), height: 900 }, hasTouch: tactile, isMobile: tactile, deviceScaleFactor: tactile ? 2 : 1 });
await page.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
// Aucune écriture possible : toute requête autre qu'une lecture GET est refusée par le navigateur.
await page.route("**/*", (r) => (r.request().method() === "GET" ? r.continue() : r.abort()));
await page.goto(url, { waitUntil: "networkidle", timeout: 180000 });
await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });

const ok = [];
async function tabulerJusqua(motif, max = 300) {
  for (let i = 0; i < max; i++) {
    await page.keyboard.press("Tab");
    const nom = await page.evaluate(() => (document.activeElement?.textContent ?? "").replace(/\s+/g, " ").trim());
    if (motif.test(nom)) return nom;
  }
  throw new Error(`introuvable au clavier : ${motif}`);
}
const contour = () => page.evaluate(() => {
  const cs = getComputedStyle(document.activeElement);
  return cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
});
const ouvert = (texte) => page.evaluate((t) => [...document.querySelectorAll("summary")].find((s) => s.textContent.includes(t))?.parentElement.open, texte);

// 1. La rubrique « Logement » des contrôles : focus visible, Entrée l'ouvre, le mot devient « Replier ».
if (tactile) {
  await page.locator("summary", { hasText: "Logement" }).last().tap();
} else {
  await page.focus("body");
  await tabulerJusqua(/^Logement.*Déplier/);
  assert.ok(await contour(), "contour de focus sur la rubrique");
  await page.keyboard.press("Enter");
}
await page.waitForTimeout(300);
assert.equal(await ouvert("cavités souterraines"), true, "la rubrique Logement s'ouvre");
const mot = await page.evaluate(() => {
  const s = [...document.querySelectorAll("summary")].find((x) => x.textContent.includes("cavités souterraines"));
  return [...s.querySelectorAll("span")].filter((x) => getComputedStyle(x).display !== "none" && /^(Déplier|Replier)$/.test(x.textContent)).map((x) => x.textContent);
});
assert.deepEqual(mot, ["Replier"]);
ok.push(`rubrique « Logement » : ${tactile ? "un appui" : "Tab puis Entrée, contour visible"}, l'indication passe à « Replier »`);

// 2. La définition des argiles, dans la rubrique ouverte.
if (tactile) {
  await page.locator("summary", { hasText: "Qu'est-ce que le retrait-gonflement" }).tap();
} else {
  await tabulerJusqua(/^Qu'est-ce que le retrait-gonflement des argiles \?$/);
  assert.ok(await contour(), "contour de focus sur la définition");
  await page.keyboard.press(" ");
}
await page.waitForTimeout(400);
assert.equal(await ouvert("Qu'est-ce que le retrait-gonflement"), true);
const definition = await page.evaluate(() => [...document.querySelectorAll("summary")].find((s) => s.textContent.includes("retrait-gonflement"))?.nextElementSibling?.textContent ?? "");
assert.match(definition, /ne dit pas si ce bâtiment a subi des dégâts/);
ok.push(`définition des argiles : ${tactile ? "un appui" : "Tab puis Espace, contour visible"}, texte lisible, sans infobulle`);

// 3. Le complément du geste se lit sans rien déplier.
const complement = await page.evaluate(() => [...document.querySelectorAll("p")].some((p) => /Fissures en escalier|Faites contrôler les fondations/.test(p.textContent) && !p.closest("details:not([open])")));
assert.ok(complement, "le complément du geste « bâti » est visible sous le geste");
ok.push("le complément du geste « bâti » se lit sous le geste, hors de « Données et limites »");

// 4. Cibles tactiles des rubriques.
if (tactile) {
  const h = await page.evaluate(() => [...document.querySelectorAll("summary")].map((s) => s.getBoundingClientRect().height).filter((x) => x > 0));
  ok.push(`tactile : ${h.length} dépliants, hauteur minimale ${Math.round(Math.min(...h))} px`);
}

console.log(ok.map((l) => `✔ ${l}`).join("\n"));
await navigateur.close();
