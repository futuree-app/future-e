// FUT-50 · VERSION C · le parcours réel, sur le serveur local : saisie d'un lieu, suggestions du géocodeur
// officiel, sélection, pastilles, lecture ; puis une adresse ; clavier seul ; mouvement réduit ; mesures ;
// une vidéo. Aucune écriture : le géocodeur et la route de lecture ne font que lire.
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

async function ouvrir(largeur, hauteur, dpr, opts = {}) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr, ...opts });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(URL_C, { waitUntil: "networkidle" });
  await sansDev(page);
  return { ctx, page };
}
const lecturePrete = (page) => page.waitForFunction(() => {
  const z = document.querySelector('[aria-live="polite"] article');
  return z && !document.querySelector('[aria-busy="true"]') && !z.textContent.includes("exemple réel");
}, null, { timeout: 30000 });

// ── Parcours complet, trois largeurs ─────────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2], [360, 740, 2]]) {
  const { ctx, page } = await ouvrir(largeur, hauteur, dpr);
  const champ = page.getByRole("combobox");
  await champ.click();
  await champ.pressSequentially("Nîm", { delay: 60 });
  await page.waitForSelector('[role="listbox"]', { timeout: 15000 });
  await page.waitForTimeout(250);
  await page.screenshot({ path: `${IMG}/proto-c-suggestions-${largeur}.jpg`, type: "jpeg", quality: 78 });
  await page.keyboard.press("Enter");
  await page.waitForTimeout(450);
  await page.screenshot({ path: `${IMG}/proto-c-lieu-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const t0 = Date.now();
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await lecturePrete(page);
  const duree = Date.now() - t0;
  await page.waitForTimeout(350);
  if (largeur < 1000) await page.locator('[aria-live="polite"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${IMG}/proto-c-chaleur-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const texte = (await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ");
  constats.push(`C ${largeur} Nîmes chaleur (${duree} ms) : ${texte.slice(0, 160)}`);
  await page.getByRole("button", { name: "Vivre dans une ville à taille humaine" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(350);
  if (largeur < 1000) await page.locator('[aria-live="polite"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${IMG}/proto-c-taille-${largeur}.jpg`, type: "jpeg", quality: 78 });
  constats.push(`C ${largeur} Nîmes taille : ${(await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ").slice(0, 160)}`);
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  constats.push(`C ${largeur} débordement horizontal : ${deborde} px`);
  await ctx.close();
}

// ── Une adresse : lue honnêtement à l'échelle de sa commune ─────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  const champ = page.getByRole("combobox");
  await champ.click();
  await champ.pressSequentially("1 place de l'hôtel de ville nîmes", { delay: 25 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  const options = await page.getByRole("option").allInnerTexts();
  const iAdresse = options.findIndex((o) => /adresse/.test(o));
  await page.getByRole("option").nth(Math.max(0, iAdresse)).click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "Pouvoir vivre sans voiture" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${IMG}/proto-c-adresse-voiture-1440.jpg`, type: "jpeg", quality: 78 });
  await page.getByRole("button", { name: "Connaître les risques naturels" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${IMG}/proto-c-adresse-risques-1440.jpg`, type: "jpeg", quality: 78 });
  constats.push(`C adresse : ${(await page.locator('[aria-live="polite"]').innerText()).replace(/\s+/g, " ").slice(0, 220)}`);
  await ctx.close();
}

// ── Clavier seul ─────────────────────────────────────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1);
  let tabs = 0;
  for (; tabs < 40; tabs++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.getAttribute("role") === "combobox")) break;
  }
  await page.keyboard.type("Lille", { delay: 60 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  await page.keyboard.press("ArrowDown"); await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(400);
  // Jusqu'à la première pastille, puis Espace.
  let versPastille = 0;
  for (; versPastille < 10; versPastille++) {
    await page.keyboard.press("Tab");
    if (await page.evaluate(() => document.activeElement?.getAttribute("aria-pressed") != null)) break;
  }
  await page.keyboard.press("Space");
  await lecturePrete(page);
  const focusVisible = await page.evaluate(() => getComputedStyle(document.activeElement).outlineStyle !== "none");
  await page.screenshot({ path: `${IMG}/proto-c-clavier-1440.jpg`, type: "jpeg", quality: 78 });
  constats.push(`C clavier : champ atteint en ${tabs + 1} tabulations, première pastille ${versPastille + 1} tabulations après le lieu, contour de focus visible : ${focusVisible}`);
  await ctx.close();
}

// ── Mouvement réduit, et mesures de chargement ──────────────────────────────────────────────
{
  const { ctx, page } = await ouvrir(1440, 900, 1, { reducedMotion: "reduce" });
  const anims = await page.evaluate(() => document.getAnimations().length);
  constats.push(`C mouvement réduit : ${anims} animation(s) CSS actives au chargement`);
  await ctx.close();
}
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(URL_C, { waitUntil: "load" });
  const m = await page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0];
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    const images = performance.getEntriesByType("resource").filter((r) => r.initiatorType === "img");
    return { dcl: Math.round(n.domContentLoadedEventEnd), fcp: fcp ? Math.round(fcp.startTime) : null, images: images.length };
  });
  constats.push(`C mesures (serveur de dev, non représentatif de la production) : premier affichage ${m.fcp} ms, DOMContentLoaded ${m.dcl} ms, ${m.images} image(s) chargée(s) au premier écran`);
  await ctx.close();
}

// ── Vidéo : recherche, sélection, une priorité, la lecture qui change ───────────────────────
mkdirSync(VID, { recursive: true });
const tmp = `${VID}/.tmp`;
rmSync(tmp, { recursive: true, force: true });
{
  const ctx = await nav.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  await prep(ctx);
  const page = await ctx.newPage();
  await page.goto(URL_C, { waitUntil: "networkidle" });
  await sansDev(page);
  await page.waitForTimeout(1400);
  const champ = page.getByRole("combobox");
  await champ.click();
  await champ.pressSequentially("Sète", { delay: 140 });
  await page.waitForSelector('[role="option"]', { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.keyboard.press("Enter");
  await page.waitForTimeout(1300);
  await page.getByRole("button", { name: "Éviter les fortes chaleurs" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(2600);
  await page.getByRole("button", { name: "Vivre dans une ville à taille humaine" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(2400);
  await page.getByRole("button", { name: "Connaître les risques naturels" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(2400);
  await page.getByRole("button", { name: "Pouvoir vivre sans voiture" }).click();
  await lecturePrete(page);
  await page.waitForTimeout(2400);
  await ctx.close();
  const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${tmp}/${webm}`, "-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", `${VID}/c-lieu-et-priorites.mp4`]);
  rmSync(tmp, { recursive: true, force: true });
  constats.push(`vidéo ${VID}/c-lieu-et-priorites.mp4`);
}

await nav.close();
console.log(constats.join("\n"));
