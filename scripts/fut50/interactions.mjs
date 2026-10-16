// FUT-50 · Captures des INTERACTIONS des prototypes (serveur local uniquement) : états des interrupteurs (A),
// révélation du relevé (B), parcours clavier, mouvement réduit, et deux courtes vidéos.
// Usage : node scripts/fut50/interactions.mjs [http://localhost:3050]
import { chromium } from "playwright-core";
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, rmSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:3050";
const IMG = "docs/audits/fut50-accueil/images";
const VID = "docs/audits/fut50-accueil/videos";
const exe = process.env.CHROME ?? `${process.env.HOME}/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-x64/chrome-headless-shell`;
const navigateur = await chromium.launch({ executablePath: exe });
const preparer = async (ctx) => {
  await ctx.addInitScript(() => { try { localStorage.setItem("futuree-consent", "denied"); } catch {} });
};
const masquerDev = (page) => page.addStyleTag({ content: "nextjs-portal { display: none !important; }" }).catch(() => {});
const constats = [];

// ── A · quatre états, desktop et mobile ────────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2]]) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr });
  await preparer(ctx);
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/fut50/a`, { waitUntil: "networkidle" });
  await masquerDev(page);
  const demo = page.locator("#demo-titre");
  const [ete, mer] = [page.getByRole("switch").nth(0), page.getByRole("switch").nth(1)];
  const etats = [["arbitrage", null], ["sans-ete", ete], ["sans-ete-mer-condition", mer], ["mer-condition", ete]];
  for (const [nom, bascule] of etats) {
    if (bascule) { await bascule.click(); await page.waitForTimeout(500); }
    await demo.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -24));
    await page.waitForTimeout(300);
    const verdict = await page.locator("[aria-live=polite]").first().innerText();
    constats.push(`A ${largeur} ${nom} : ${verdict.replace(/\s+/g, " ").slice(0, 120)}`);
    await page.screenshot({ path: `${IMG}/proto-a-demo-${nom}-${largeur}.jpg`, type: "jpeg", quality: 78 });
  }
  // Débordement horizontal : la page ne doit jamais défiler en largeur.
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  constats.push(`A ${largeur} débordement horizontal : ${deborde} px`);
  await ctx.close();
}

// ── B · avant et après la révélation ──────────────────────────────────────────────────────────
for (const [largeur, hauteur, dpr] of [[1440, 900, 1], [390, 844, 2]]) {
  const ctx = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: dpr });
  await preparer(ctx);
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/fut50/b`, { waitUntil: "networkidle" });
  await masquerDev(page);
  const bouton = page.getByRole("button", { name: /Lire ces faits avec ce projet/ });
  await bouton.scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -160));
  await page.screenshot({ path: `${IMG}/proto-b-releve-avant-${largeur}.jpg`, type: "jpeg", quality: 78 });
  await bouton.click();
  await page.waitForTimeout(700);
  await page.locator("#lecture-projet").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -120));
  await page.screenshot({ path: `${IMG}/proto-b-releve-apres-${largeur}.jpg`, type: "jpeg", quality: 78 });
  const deborde = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  constats.push(`B ${largeur} débordement horizontal : ${deborde} px`);
  await ctx.close();
}

// ── Clavier : l'ordre de tabulation atteint les deux portes avant toute autre chose du contenu ──
for (const d of ["a", "b"]) {
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 } });
  await preparer(ctx);
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/fut50/${d}`, { waitUntil: "networkidle" });
  await masquerDev(page);
  const vus = [];
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press("Tab");
    const info = await page.evaluate(() => {
      const el = document.activeElement;
      const style = el ? getComputedStyle(el) : null;
      return el ? { texte: (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60), href: el.getAttribute("href"), contour: style.outlineStyle !== "none" || style.boxShadow !== "none" } : null;
    });
    if (info) vus.push(info);
    if (info?.href === "/dossier" && vus.some((v) => v.href === "/ou-vivre")) break;
  }
  const portes = vus.filter((v) => v.href === "/ou-vivre" || v.href === "/dossier");
  constats.push(`clavier ${d} : portes atteintes en ${vus.length} tabulations, focus visible sur les portes : ${portes.every((p) => p.contour)}`);
  await page.keyboard.press("Shift+Tab");
  await page.screenshot({ path: `${IMG}/proto-${d}-focus-1440.jpg`, type: "jpeg", quality: 78 });
  await ctx.close();
}

// ── Mouvement réduit : tout le contenu est visible tout de suite ──────────────────────────────
for (const d of ["a", "b"]) {
  const ctx = await navigateur.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await preparer(ctx);
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/fut50/${d}`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(150);
  const h1 = await page.locator("h1").first().isVisible();
  const portes = await page.locator('a[href="/ou-vivre"], a[href="/dossier"]').count();
  constats.push(`mouvement réduit ${d} : titre visible à 150 ms ${h1}, ${portes} liens de porte présents`);
  await ctx.close();
}

// ── Vidéos courtes ────────────────────────────────────────────────────────────────────────────
mkdirSync(VID, { recursive: true });
const tmp = `${VID}/.tmp`;
for (const [nom, d, scenario] of [
  ["a-bascule-priorite", "a", async (page) => {
    await page.locator("#demo-titre").scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -24));
    await page.waitForTimeout(1600);
    for (const i of [0, 0, 1, 1]) { await page.getByRole("switch").nth(i).click(); await page.waitForTimeout(2200); }
  }],
  ["b-revelation-projet", "b", async (page) => {
    await page.locator("#releve-titre").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, 700); await page.waitForTimeout(1500);
    const bouton = page.getByRole("button", { name: /Lire ces faits avec ce projet/ });
    await bouton.scrollIntoViewIfNeeded(); await page.evaluate(() => window.scrollBy(0, -200)); await page.waitForTimeout(1200);
    await bouton.click(); await page.waitForTimeout(1800);
    await page.mouse.wheel(0, 420); await page.waitForTimeout(2600);
  }],
]) {
  rmSync(tmp, { recursive: true, force: true });
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 800 }, recordVideo: { dir: tmp, size: { width: 1280, height: 800 } } });
  await preparer(ctx);
  const page = await ctx.newPage();
  await page.goto(`${base}/dev/fut50/${d}`, { waitUntil: "networkidle" });
  await masquerDev(page);
  await scenario(page);
  await ctx.close();
  const webm = readdirSync(tmp).find((f) => f.endsWith(".webm"));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", `${tmp}/${webm}`, "-vf", "scale=1280:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "28", "-movflags", "+faststart", `${VID}/${nom}.mp4`]);
  rmSync(tmp, { recursive: true, force: true });
  constats.push(`vidéo ${VID}/${nom}.mp4`);
}

await navigateur.close();
console.log(constats.join("\n"));
