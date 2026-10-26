// FUT-143 · Recette au clavier et de lisibilité, dans Google Chrome (1440 px, Pixel 7, 360 px).
//
// Complète `recette-rendu.mjs`, qui pilotait la souris. Ici, aucun clic : Tab, Maj+Tab, Entrée, flèches.
// A. `/dev/fut80?cas=monchaux` : atteindre la ligne contredite, l'ouvrir, annuler, rouvrir, confirmer.
//    Compte les POST `/api/logement-dpe` (interceptés, jamais transmis) et suit le focus à chaque geste.
// B. `/dossier` : saisir l'adresse, la choisir au clavier, lire l'aperçu, atteindre « Créer mon dossier ».
// Mesure aussi : focus visible, contraste WCAG des textes ajoutés, hauteur des cibles, débordement.
// Usage : CHROME=<chemin> node scripts/fut143/recette-clavier.mjs http://localhost:3143
import { chromium, devices } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";
import { GEOCODEUR_BAN } from "../../src/lib/geocodeur-ban.ts";

const base = process.argv[2];
assert.match(base ?? "", /^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
const dir = "docs/audits/2026-10-26-fut143/clavier";
mkdirSync(dir, { recursive: true });
const APPAREILS = [
  ["ordinateur", { viewport: { width: 1440, height: 1000 } }],
  ["android", devices["Pixel 7"]],
  ["etroit-360", { viewport: { width: 360, height: 760 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }],
];
const browser = await chromium.launch({ executablePath: process.env.CHROME, headless: true });
const bilan = [];

// Ce qui a le focus, et s'il se voit : contour, ombre ou bordure qui change au focus.
const FOCUS = () => {
  const e = document.activeElement;
  if (!e || e === document.body) return { tag: "body" };
  const s = getComputedStyle(e);
  return {
    tag: e.tagName.toLowerCase(), nom: e.getAttribute("aria-label") ?? e.getAttribute("placeholder") ?? e.textContent.trim().slice(0, 60),
    visible: (s.outlineStyle !== "none" && parseFloat(s.outlineWidth) > 0) || s.boxShadow !== "none",
    contour: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
  };
};

// Contraste WCAG d'un élément contre le premier fond opaque de ses ancêtres (opacité du texte comprise).
const CONTRASTE = (el) => {
  const rgb = (c) => { const m = c.match(/[\d.]+/g).map(Number); return { r: m[0], g: m[1], b: m[2], a: m[3] ?? 1 }; };
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  let fond = null;
  for (let n = el; n && !fond; n = n.parentElement) { const c = rgb(getComputedStyle(n).backgroundColor); if (c.a > 0.95) fond = c; }
  fond ??= { r: 0, g: 0, b: 0 };
  const s = getComputedStyle(el);
  let a = rgb(s.color).a * Number(s.opacity);
  const t = rgb(s.color);
  const mel = { r: t.r * a + fond.r * (1 - a), g: t.g * a + fond.g * (1 - a), b: t.b * a + fond.b * (1 - a) };
  const [l1, l2] = [lum(mel), lum(fond)].sort((x, y) => y - x);
  return { ratio: Math.round(((l1 + 0.05) / (l2 + 0.05)) * 100) / 100, taille: s.fontSize };
};

async function tabJusqua(page, re, max = 120, arriere = false) {
  for (let i = 1; i <= max; i++) {
    await page.keyboard.press(arriere ? "Shift+Tab" : "Tab");
    const f = await page.evaluate(FOCUS);
    if (f.nom && re.test(f.nom)) return { ...f, tabs: i };
  }
  throw new Error(`focus jamais atteint : ${re}`);
}

// ── A ────────────────────────────────────────────────────────────────────────────────────────────────
for (const [appareil, opts] of APPAREILS) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const ecritures = [];
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route("**/*", (route) => {
    const r = route.request();
    if (r.method() === "GET") return route.continue();
    const chemin = new URL(r.url()).pathname;
    if (chemin === "/api/logement-dpe") { ecritures.push(r.postData()); return route.fulfill({ status: 200, contentType: "application/json", body: "{}" }); }
    return route.abort();
  });
  await page.goto(`${base}/dev/fut80?cas=monchaux`, { waitUntil: "networkidle", timeout: 120_000 });
  await page.waitForTimeout(800);
  // Le bandeau de mesure d'audience prend le focus en premier : on le refuse au clavier comme un lecteur.
  const etapes = [];

  const ligne = await tabJusqua(page, /après confirmation/);
  etapes.push({ geste: "Tab jusqu'à la ligne contredite", ...ligne });
  assert.ok(ligne.visible, `A/${appareil} : focus de la ligne invisible (${ligne.contour})`);
  await page.screenshot({ path: `${dir}/a-${appareil}-1-focus-ligne.png` });

  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const ouvert = await page.evaluate(() => document.activeElement?.getAttribute("aria-expanded"));
  etapes.push({ geste: "Entrée sur la ligne", ariaExpanded: ouvert, ecritures: ecritures.length });
  assert.equal(ouvert, "true");
  assert.equal(ecritures.length, 0, `A/${appareil} : Entrée sur la ligne n'écrit rien`);

  const conf = await (async () => { await page.keyboard.press("Tab"); return page.evaluate(FOCUS); })();
  etapes.push({ geste: "Tab après ouverture", ...conf });
  assert.match(conf.nom, /Retenir quand même ce diagnostic/, `A/${appareil} : le Tab suivant mène à la confirmation`);
  assert.ok(conf.visible, `A/${appareil} : focus de la confirmation invisible`);
  await page.screenshot({ path: `${dir}/a-${appareil}-2-focus-confirmer.png` });

  await page.keyboard.press("Tab");
  const ann = await page.evaluate(FOCUS);
  etapes.push({ geste: "Tab vers Annuler", ...ann });
  assert.match(ann.nom, /^Annuler$/);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  const apresAnnuler = await page.evaluate(FOCUS);
  etapes.push({ geste: "Entrée sur Annuler", ...apresAnnuler, ecritures: ecritures.length });
  assert.equal(ecritures.length, 0, `A/${appareil} : annuler n'écrit rien`);
  assert.match(apresAnnuler.nom ?? "", /après confirmation/, `A/${appareil} : après Annuler, le focus revient sur la ligne (obtenu : ${JSON.stringify(apresAnnuler)})`);

  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  etapes.push({ geste: "Espace sur la ligne", ecritures: ecritures.length });
  assert.equal(ecritures.length, 0);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(250);
  const apresEchap = await page.evaluate(FOCUS);
  const fermeEchap = await page.evaluate(() => document.activeElement?.getAttribute("aria-expanded"));
  etapes.push({ geste: "Tab puis Échap dans l'explication", ...apresEchap, ariaExpanded: fermeEchap, ecritures: ecritures.length });
  assert.match(apresEchap.nom ?? "", /après confirmation/, `A/${appareil} : Échap rend le focus à la ligne`);
  assert.equal(fermeEchap, "false");
  assert.equal(ecritures.length, 0);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1200);
  etapes.push({ geste: "Tab puis Entrée sur la confirmation", ecritures: ecritures.length });
  assert.equal(ecritures.length, 1, `A/${appareil} : une écriture après confirmation`);
  assert.equal(JSON.parse(ecritures[0]).status, "user_confirmed");

  // Lisibilité du panneau (rouvert sur une page neuve pour le mesurer).
  await page.goto(`${base}/dev/fut80?cas=monchaux`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /après confirmation/ }).click();
  const groupe = page.getByRole("group", { name: /Confirmer un diagnostic/ });
  const lisible = {
    texte: await groupe.locator("p").evaluate(CONTRASTE),
    confirmer: await groupe.getByRole("button", { name: /Retenir quand même/ }).evaluate((e) => ({ hauteur: Math.round(e.getBoundingClientRect().height) })),
    annuler: await groupe.getByRole("button", { name: "Annuler" }).evaluate((e) => ({ hauteur: Math.round(e.getBoundingClientRect().height) })),
    mention: await page.getByText(/rattaché par la base ADEME/).evaluate(CONTRASTE),
    debord: await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  };
  await groupe.screenshot({ path: `${dir}/a-${appareil}-3-panneau.png` });
  assert.ok(lisible.texte.ratio >= 4.5, `A/${appareil} : contraste explication ${lisible.texte.ratio}`);
  assert.ok(lisible.mention.ratio >= 4.5, `A/${appareil} : contraste mention ${lisible.mention.ratio}`);
  assert.ok(lisible.confirmer.hauteur >= 44 && lisible.annuler.hauteur >= 44, `A/${appareil} : cibles ${JSON.stringify(lisible)}`);
  assert.ok(lisible.debord <= 1);
  assert.deepEqual(erreurs, []);
  bilan.push({ cas: "A-monchaux", appareil, etapes, lisible });
  await ctx.close();
}

// ── B ────────────────────────────────────────────────────────────────────────────────────────────────
const BAN = { type: "FeatureCollection", features: [{ type: "Feature", geometry: { type: "Point", coordinates: [4.880117, 45.769826] },
  properties: { id: "69266_0110_00002", label: "2 Rue des Alliés 69100 Villeurbanne", name: "2 Rue des Alliés", housenumber: "2",
    street: "Rue des Alliés", postcode: "69100", citycode: "69266", city: "Villeurbanne", type: "housenumber", score: 0.97 } }] };

for (const [appareil, opts] of APPAREILS) {
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();
  const erreurs = [];
  page.on("pageerror", (e) => erreurs.push(e.message));
  await page.route(`${GEOCODEUR_BAN}/**`, (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(BAN) }));
  // La VRAIE route de qualification (sondes publiques ADEME et RNB en lecture seule, visiteur anonyme).
  await page.route("**/*", (r) => (r.request().method() === "GET" || r.request().url().includes("/api/dossier/qualification") ? r.fallback() : r.abort()));
  await page.goto(`${base}/dossier`, { waitUntil: "networkidle", timeout: 120_000 });
  const etapes = [];
  const champ = await tabJusqua(page, /adresse/i);
  etapes.push({ geste: "Tab jusqu'au champ d'adresse", ...champ });
  assert.ok(champ.visible || champ.tag === "input", `B/${appareil} : focus du champ`);
  await page.keyboard.type("2 rue des Alliés Villeurbanne", { delay: 20 });
  await page.getByRole("option").first().waitFor({ timeout: 15_000 });
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await page.getByText("Ce que nous examinerons ici").waitFor({ timeout: 30_000 });
  await page.waitForTimeout(300);
  const texte = (await page.locator(".card-answer").innerText()).replace(/\s+/g, " ");
  etapes.push({ geste: "Flèche bas + Entrée sur la suggestion", qualifie: true });
  assert.match(texte, /Autres adresses du même bâtiment/i);
  assert.match(texte, /à vérifier avant d'en retenir un pour ce logement/);
  const cta = await tabJusqua(page, /Créer mon dossier/, 40);
  etapes.push({ geste: "Tab jusqu'à Créer mon dossier", ...cta });
  assert.ok(cta.visible, `B/${appareil} : focus du bouton d'achat invisible (${cta.contour})`);
  await page.screenshot({ path: `${dir}/b-${appareil}-focus-cta.png` });
  const ligne = page.getByText("Autres adresses du même bâtiment", { exact: true });
  const etat = page.getByText("diagnostics à vérifier", { exact: true });
  const lisible = {
    ligne: await ligne.evaluate(CONTRASTE),
    etat: await etat.evaluate(CONTRASTE),
    aucunAdresse: await page.getByText("aucun à cette adresse", { exact: true }).evaluate(CONTRASTE),
    paragraphe: await page.getByText(/néanmoins à d'autres adresses/).evaluate(CONTRASTE),
    debord: await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth),
  };
  await page.locator(".card-answer").screenshot({ path: `${dir}/b-${appareil}-apercu.png` });
  for (const k of ["ligne", "etat", "aucunAdresse", "paragraphe"]) assert.ok(lisible[k].ratio >= 4.5, `B/${appareil} : contraste ${k} ${lisible[k].ratio}`);
  assert.ok(lisible.debord <= 1);
  assert.deepEqual(erreurs, []);
  bilan.push({ cas: "B-villeurbanne-reel", appareil, etapes, lisible });
  await ctx.close();
}

await browser.close();
writeFileSync(`${dir}/bilan.json`, JSON.stringify(bilan, null, 2));
console.log(JSON.stringify(bilan.map((b) => ({ cas: b.cas, appareil: b.appareil, lisible: b.lisible })), null, 1));
