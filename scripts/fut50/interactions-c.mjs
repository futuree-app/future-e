// FUT-50 · VERSION C AFFINÉE · le parcours réel sur le serveur local : les trois états du hero (vierge, commune,
// priorité), la composition de comparaison, la porte de l'adresse, le clavier, le mouvement réduit, les temps de
// réponse, les erreurs, le storyboard du dossier et une vidéo du hero. Aucune écriture.
// Usage : node scripts/fut50/interactions-c.mjs [http://localhost:3050]
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3050";
const URL_C = `${base}/dev/fut50/c`;
const IMG = "docs/audits/fut50-accueil/images";
const VID = "docs/audits/fut50-accueil/videos";
const exe = process.env.CHROME ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell`;
const nav = await chromium.launch({ executablePath: exe });
const constats = [];
const prep = (ctx) => ctx.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
const sansDev = (p) => p.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});

async function ouvrir(largeur, hauteur, dpr, opts = {}, url = URL_C) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr, ...opts });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: "networkidle" });
  // Le serveur de développement recharge parfois la page juste après son premier rendu : on le laisse faire.
  await page.waitForTimeout(1500);
  await page.waitForLoadState("networkidle");
  await sansDev(page);
  return { ctx, page };
}
const lecturePrete = (page) => page.waitForFunction(() => {
  const z = document.querySelector('[aria-live="polite"] article');
  return z && !document.querySelector('[aria-busy="true"]');
}, null, { timeout: 30000 });
async function choisirCommune(page, texte, nom) {
  const champ = page.getByRole("combobox");
  await champ.click();
  await champ.pressSequentially(texte, { delay: 60 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  await page.waitForTimeout(200);
  if (nom) {
    // Au clavier jusqu'à la commune voulue : la flèche descend dans la liste, Entrée choisit.
    const options = await page.getByRole("option").allInnerTexts();
    const i = options.findIndex((o) => o.split("\n")[0] === nom);
    for (let k = 0; k < Math.max(0, i); k++) await page.keyboard.press("ArrowDown");
  }
}

// ── Les trois états, trois largeurs ──────────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2], [360, 740, 2]]) {
  const { ctx, page } = await ouvrir(largeur, hauteur, dpr);
  await page.screenshot({ path: `${IMG}/c2-etat-a-vierge-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const vierge = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} état A : colonne de lecture ${vierge.trim() === "" ? "vide" : "NON VIDE"}`);
  await choisirCommune(page, "Nant", "Nantes");
  await page.screenshot({ path: `${IMG}/c2-suggestions-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const options = await page.getByRole("option").allInnerTexts();
  constats.push(`${largeur} suggestions : ${options.length} communes (${options.map((o) => o.split("\n")[0]).join(", ")})`);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${IMG}/c2-etat-b-commune-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const b = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} état B : lecture ${b.trim() === "" ? "absente (attendu)" : "PRÉSENTE"}`);
  const t0 = Date.now();
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await lecturePrete(page);
  constats.push(`${largeur} état C (hivers) en ${Date.now() - t0} ms`);
  await page.waitForTimeout(300);
  if (largeur < 1000) await page.locator('[aria-live="polite"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${IMG}/c2-etat-c-priorite-${largeur}.jpg`, type: "jpeg", quality: 78 });
  // Désélection : retour à l'état B, sans résultat.
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await page.waitForTimeout(200);
  const apres = await page.locator('[aria-live="polite"]').innerText();
  constats.push(`${largeur} désélection : lecture ${apres.trim() === "" ? "retirée" : "ENCORE AFFICHÉE"}`);
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  constats.push(`${largeur} débordement horizontal : ${deborde} px`);
  await ctx.close();
}

// ── Changer de commune : aucune lecture de l'ancienne ne reste ───────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await choisirCommune(page, "Annec", "Annecy");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Vivre dans une petite ville" }).click();
  await lecturePrete(page);
  await page.getByRole("button", { name: "Changer de commune" }).click();
  await choisirCommune(page, "Guér", "Guéret");
  await page.keyboard.press("Enter");
  await lecturePrete(page);
  const t = (await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ");
  constats.push(`changement de commune : ${/Annecy/.test(t) ? "LECTURE D'ANNECY ENCORE VISIBLE" : "seule la nouvelle commune est lue"} (${t.slice(0, 90)})`);
  await page.screenshot({ path: `${IMG}/c2-changement-commune-1440.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── Composition de comparaison (mobilité) ────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1, {}, `${URL_C}?pastilles=mobilite`);
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Pouvoir vivre sans voiture" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${IMG}/c2-composition-mobilite-1440.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── La porte de l'adresse ────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await page.getByRole("link", { name: "Examiner cette adresse" }).click();
  await page.waitForURL("**/dossier", { timeout: 20000 });
  constats.push(`porte de l'adresse : ${new URL(page.url()).pathname}`);
  await ctx.close();
}

// ── Erreur de lecture : le message et « Réessayer » ──────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  await page.route("**/dev/fut50/api/lecture**", (r) => r.fulfill({ status: 500, body: "" }));
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await page.waitForSelector('[aria-live="polite"] [role="alert"]', { timeout: 10000 });
  await page.screenshot({ path: `${IMG}/c2-erreur-lecture-1440.jpg`, type: "jpeg", quality: 78 });
  constats.push(`erreur de lecture : ${(await page.locator('[aria-live="polite"] [role="alert"]').innerText()).replace(/\s+/g, " ")}`);
  await ctx.close();
}

// ── Clavier seul, mouvement réduit ───────────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  let tabs = 0;
  for (; tabs < 40; tabs++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.getAttribute("role") === "combobox")) break; }
  await page.keyboard.type("Lille", { delay: 60 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(300);
  let n = 0;
  for (; n < 10; n++) { await page.keyboard.press("Tab"); if (await page.evaluate(() => document.activeElement?.getAttribute("aria-pressed") != null)) break; }
  await page.keyboard.press("Space");
  await lecturePrete(page);
  const focus = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== "none");
  constats.push(`clavier : champ en ${tabs + 1} tabulations, première priorité ${n + 1} tabulations après la commune, focus visible : ${focus}`);
  await ctx.close();
}
{
  const { ctx, page } = await ouvrir(1440, 900, 1, { reducedMotion: "reduce" });
  await choisirCommune(page, "Nant", "Nantes");
  await page.keyboard.press("Enter");
  await page.getByRole("button", { name: "Avoir des hivers doux" }).click();
  await lecturePrete(page);
  const anims = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  constats.push(`mouvement réduit : ${anims} animation(s) en cours après interaction`);
  await ctx.close();
}

// ── Storyboard et section Dossier Adresse ────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2]]) {
  const { ctx, page } = await ouvrir(largeur, hauteur, dpr, {}, `${base}/dev/fut50/storyboard`);
  await page.screenshot({ path: `${IMG}/c2-storyboard-${largeur}-page.jpg`, type: "jpeg", quality: 78, fullPage: true });
  await page.goto(`${URL_C}#dossier-adresse`, { waitUntil: "networkidle" });
  await sansDev(page);
  await page.locator("#dossier-adresse").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -20));
  await page.screenshot({ path: `${IMG}/c2-section-dossier-${largeur}.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── Vidéo du hero corrigé ────────────────────────────────────────────────────────────────────
mkdirSync(VID, { recursive: true });
const tmp = `${VID}/.tmp`;
rmSync(tmp, { recursive: true, force: true });
{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(URL_C, { waitUntil: "networkidle" });
  await sansDev(page);
  await page.waitForTimeout(1500);
  const champ = page.getByRole("combobox");
  await champ.click();
  await champ.pressSequentially("Annecy", { delay: 130 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  await page.waitForTimeout(800);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1600);
  for (const nom of ["Avoir des hivers doux", "Éviter les fortes chaleurs", "Vivre dans une petite ville"]) {
    await page.getByRole("button", { name: nom }).click();
    await lecturePrete(page);
    await page.waitForTimeout(2600);
  }
  await page.getByRole("button", { name: "Vivre dans une petite ville" }).click();
  await page.waitForTimeout(1600);
  await ctx.close();
  const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${tmp}/${webm}`, "-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", `${VID}/c2-hero-commune-et-priorites.mp4`]);
  rmSync(tmp, { recursive: true, force: true });
  constats.push(`vidéo ${VID}/c2-hero-commune-et-priorites.mp4`);
}

await nav.close();
console.log(constats.join("\n"));
