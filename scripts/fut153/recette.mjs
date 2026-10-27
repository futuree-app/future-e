// FUT-153 · Recette en vrai navigateur des aides de la matrice du comparateur (LabelTip).
// Toucher réel (événements tactiles CDP, contexte hasTouch) à 360 et 390 px, souris à 1440 px,
// clavier seul. Chaque thème est dévoilé sur une page neuve (l'aperçu n'en dévoile qu'un de plus).
// Usage : BASE=http://localhost:3153 SORTIE=<dossier de captures> node scripts/fut153/recette.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3153";
const PAGE = process.env.PAGE ?? "/comparateur?communes=69123,38185,73065";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-27-fut153-aides-comparateur";
const ATTENTE_LECTURE = 1500; // la bulle doit tenir au moins ce temps sans nouvelle action
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };

const aides = (p) => p.locator("button.cursor-help");
// État d'une aide, lu dans le DOM : bulle affichée, et lisible en entier (dans la fenêtre, au premier plan
// à ses quatre coins et en son centre).
const lire = (bouton) => bouton.evaluate((b) => {
  const bulle = b.parentElement.querySelector("[role=tooltip]");
  const visible = !!bulle && !bulle.hidden && bulle.getClientRects().length > 0;
  if (!visible) return { visible: false, expanded: b.getAttribute("aria-expanded") };
  const r = bulle.getBoundingClientRect();
    // À 8 px des coins : dans l'arrondi (rayon 10 px), un point plus proche tomberait hors de la bulle.
  const points = [[r.left + 8, r.top + 8], [r.right - 8, r.top + 8], [r.left + 8, r.bottom - 8], [r.right - 8, r.bottom - 8], [(r.left + r.right) / 2, (r.top + r.bottom) / 2]];
  const lisible = r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight
    && points.every(([x, y]) => { const d = document.elementFromPoint(x, y); return !!d && bulle.contains(d); });
  return { visible, lisible, expanded: b.getAttribute("aria-expanded"), boite: [r.left, r.top, r.right, r.bottom].map(Math.round), texte: bulle.textContent.length };
});
const toucher = async (p, loc) => { await loc.scrollIntoViewIfNeeded(); const b = await loc.boundingBox(); await p.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2); };
const themeOuvert = (p) => p.locator("section.mt-12 > h3").first().innerText();

async function charger(ctx, theme) {
  const p = await ctx.newPage();
  await p.goto(`${BASE}${PAGE}`, { waitUntil: "networkidle" });
  if (theme && (await themeOuvert(p)) !== theme) {
    const carte = p.locator("section.mt-12 button.glass", { hasText: theme });
    if (ctx.__tactile) await toucher(p, carte); else await carte.click();
    await p.waitForFunction((t) => document.querySelector("section.mt-12 > h3")?.textContent === t, theme);
  }
  return p;
}

// ── Mobile tactile : chaque aide de chaque thème testé, à 360 et 390 px ──────────────────────────
const THEMES = ["Climat", "Risques naturels", "Nature & cadre", "Mobilité"];
for (const largeur of [360, 390]) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 780 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  ctx.__tactile = true;
  for (const theme of THEMES) {
    const p = await charger(ctx, theme);
    const n = await aides(p).count();
    const rapport = [];
    for (let i = 0; i < n; i++) {
      const b = aides(p).nth(i);
      const nom = await b.innerText();
      // Mi-hauteur d'écran, puis tout en haut (sous la barre collante) : la bulle doit rester lisible.
      for (const position of ["center", "start"]) {
        await b.evaluate((el, pos) => el.scrollIntoView({ block: pos }), position);
        if (position === "start") await p.evaluate(() => scrollBy(0, -70));
        await p.waitForTimeout(150);
        const urlAvant = p.url(); const themeAvant = await themeOuvert(p);
        await toucher(p, b);
        await p.waitForTimeout(ATTENTE_LECTURE);
        const ouvert = await lire(b);
        if (i === 0 && position === "center") await p.screenshot({ path: `${SORTIE}/mobile-${largeur}-${theme.replace(/\W+/g, "-")}.png` });
        if (nom === "Météo propice aux feux") await p.screenshot({ path: `${SORTIE}/mobile-${largeur}-feu-${position}.png` });
        const sansEffet = p.url() === urlAvant && (await themeOuvert(p)) === themeAvant;
        await toucher(p, b);
        await p.waitForTimeout(300);
        const ferme = await lire(b);
        const ok = ouvert.visible && ouvert.lisible && ouvert.expanded === "true" && !ferme.visible && ferme.expanded === "false" && sansEffet;
        if (!ok) verifier(false, `${largeur} px · ${theme} · « ${nom} » (${position}) : ouvert=${JSON.stringify(ouvert)} après 2e appui=${JSON.stringify(ferme)} sansEffet=${sansEffet}`);
        rapport.push(ok);
      }
    }
    verifier(rapport.length > 0 && rapport.every(Boolean), `${largeur} px · ${theme} : ${n} aide(s) × 2 positions : 1 appui ouvre, lisible en entier ${ATTENTE_LECTURE} ms après, 2e appui ferme, aucune action voisine`);

    // Appui à l'extérieur, puis passage d'une aide à une autre.
    const [a, b] = [aides(p).nth(0), aides(p).nth(Math.min(1, n - 1))];
    await a.scrollIntoViewIfNeeded(); await toucher(p, a); await p.waitForTimeout(300);
    const themeAvant = await themeOuvert(p);
    // Zone neutre : le bout de la ligne du libellé, hors du bouton et de sa bulle.
    const ab = await a.boundingBox(); await p.touchscreen.tap(largeur - 12, ab.y + ab.height / 2); await p.waitForTimeout(300);
    verifier(!(await lire(a)).visible && (await themeOuvert(p)) === themeAvant, `${largeur} px · ${theme} : un appui à l'extérieur ferme l'aide`);
    if (n > 1) {
      await toucher(p, a); await p.waitForTimeout(300);
      await toucher(p, b); await p.waitForTimeout(ATTENTE_LECTURE);
      const [ea, eb] = [await lire(a), await lire(b)];
      verifier(!ea.visible && eb.visible && eb.lisible, `${largeur} px · ${theme} : passer de « ${await a.innerText()} » à « ${await b.innerText()} » ferme la première, ouvre la seconde`);
    }
    await p.close();
  }
  await ctx.close();
}

// ── Ordinateur, souris (1440 px) ───────────────────────────────────────────────────────────────
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await charger(ctx, "Risques naturels");
  const feu = aides(p).filter({ hasText: "Météo propice aux feux" });
  const autre = aides(p).first();
  await feu.scrollIntoViewIfNeeded();
  await feu.hover(); await p.waitForTimeout(400);
  const survol = await lire(feu);
  verifier(survol.visible && survol.lisible, `survol : l'aide « Météo propice aux feux » s'ouvre, lisible ${JSON.stringify(survol)}`);
  await p.screenshot({ path: `${SORTIE}/bureau-1440-survol-feu.png` });
  // Monter du libellé dans la bulle (en traversant l'écart de 8 px) : elle reste ouverte.
  const bulle = feu.locator("xpath=following-sibling::*[@role='tooltip']");
  const bb = await bulle.boundingBox(); const fb = await feu.boundingBox();
  await p.mouse.move(fb.x + 10, fb.y + 2, { steps: 4 });
  await p.mouse.move(bb.x + 20, bb.y + bb.height - 4, { steps: 8 }); await p.waitForTimeout(300);
  verifier((await lire(feu)).visible, "pointeur dans la bulle (après l'écart) : l'aide reste ouverte");
  await p.mouse.move(5, 5, { steps: 6 }); await p.waitForTimeout(300);
  verifier(!(await lire(feu)).visible, "pointeur sorti : l'aide survolée se referme");
  await feu.hover(); await p.waitForTimeout(200); await feu.click(); await p.waitForTimeout(ATTENTE_LECTURE);
  verifier((await lire(feu)).visible, `survol puis clic : l'aide reste ouverte ${ATTENTE_LECTURE} ms (plus de fermeture mouseenter + click)`);
  await p.mouse.move(5, 5, { steps: 6 }); await p.waitForTimeout(300);
  verifier((await lire(feu)).visible, "après clic, l'aide survit à la sortie du pointeur");
  await feu.click(); await p.waitForTimeout(300);
  verifier(!(await lire(feu)).visible, "second clic : l'aide se ferme");
  await feu.click(); await p.waitForTimeout(200);
  await p.mouse.click(5, 300); await p.waitForTimeout(300);
  verifier(!(await lire(feu)).visible, "clic à l'extérieur : l'aide se ferme");
  await feu.click(); await p.waitForTimeout(200); await autre.hover(); await p.waitForTimeout(300);
  verifier(!(await lire(feu)).visible && (await lire(autre)).visible, "aide épinglée puis survol d'une autre : une seule ouverte");
  await ctx.close();
}

// ── Clavier seul (1440 px puis 390 px) ─────────────────────────────────────────────────────────
for (const largeur of [1440, 390]) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: 900 } });
  const p = await charger(ctx, "Risques naturels");
  const actif = () => p.evaluate(() => ({ texte: document.activeElement?.textContent ?? "", aide: document.activeElement?.classList.contains("cursor-help") ?? false }));
  let n = 0;
  while (n++ < 80) { await p.keyboard.press("Tab"); if ((await actif()).aide) break; }
  const premier = (await actif()).texte;
  const focus = aides(p).filter({ hasText: premier }).first();
  verifier(n <= 80 && (await lire(focus)).visible === false, `${largeur} px · Tab atteint l'aide « ${premier} » (${n} tabulations), fermée au simple focus`);
  const desc = await focus.evaluate((b) => document.getElementById(b.getAttribute("aria-describedby") ?? "")?.textContent ?? "");
  verifier(desc.length > 20, `${largeur} px · aria-describedby relie l'explication au contrôle (${desc.length} caractères), même fermée`);
  await p.keyboard.press("Enter"); await p.waitForTimeout(400);
  const e1 = await lire(focus);
  verifier(e1.visible && e1.lisible && e1.expanded === "true", `${largeur} px · Entrée ouvre ${JSON.stringify(e1)}`);
  await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  verifier(!(await lire(focus)).visible, `${largeur} px · Entrée referme`);
  await p.keyboard.press("Space"); await p.waitForTimeout(300);
  verifier((await lire(focus)).visible, `${largeur} px · Espace ouvre`);
  await p.keyboard.press("Space"); await p.waitForTimeout(300);
  verifier(!(await lire(focus)).visible, `${largeur} px · Espace referme`);
  await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  await p.keyboard.press("Escape"); await p.waitForTimeout(300);
  verifier(!(await lire(focus)).visible && (await actif()).texte === premier, `${largeur} px · Échap ferme, le focus reste sur « ${premier} »`);
  await p.keyboard.press("Enter"); await p.waitForTimeout(200);
  if (largeur === 1440) await p.screenshot({ path: `${SORTIE}/clavier-1440-ouverte.png` });
  await p.keyboard.press("Tab"); await p.waitForTimeout(300);
  const suivant = await actif();
  verifier(!(await lire(focus)).visible && suivant.aide, `${largeur} px · Tab vers l'aide suivante « ${suivant.texte} » : la précédente se ferme`);
  await ctx.close();
}

await nav.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nRecette verte");
process.exit(echecs ? 1 : 0);
