// FUT-50 · Banc clavier, mouvement réduit et vrais viewports (Chrome piloté, fenêtre à la taille testée).
// Usage : BASE=http://localhost:3150 CHROME=<chrome> SORTIE=<dossier de captures> node scripts/fut50/verifier-clavier-mobile.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3150";
// PAGE et API : le prototype par défaut ; `PAGE=/ API=/api/accueil` pour l'accueil public (build de production).
const PAGE = process.env.PAGE ?? "/dev/fut50/c";
const API = process.env.API ?? "/dev/fut50/api";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-16-fut50-clavier-mobile";
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ executablePath: process.env.CHROME });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };
const actif = (p) => p.evaluate(() => {
  const a = document.activeElement;
  return { tag: a?.tagName, role: a?.getAttribute("role"), texte: (a?.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60), contour: a ? getComputedStyle(a).outlineStyle : "", hero: !!a?.closest("section") && !!a?.closest('[aria-labelledby="hero-c"], section:first-of-type') };
});
async function tabJusqua(p, predicat, max = 40) {
  for (let i = 1; i <= max; i++) { await p.keyboard.press("Tab"); const a = await actif(p); if (predicat(a)) return { a, n: i }; }
  return { a: await actif(p), n: -1 };
}
const prete = (p) => p.waitForFunction(() => document.querySelector('[aria-live="polite"] article h2') && !document.querySelector('[aria-busy="true"]'), null, { timeout: 30000 });

// ── C. Le parcours complet au clavier (ordinateur) ─────────────────────────────────────────────
{
  const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${PAGE}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  let r = await tabJusqua(p, (a) => a.role === "combobox");
  // Le focus du champ est porté par son CADRE (anneau orange et bordure claire), pas par l'outline de l'input.
  await p.waitForTimeout(400); // l'anneau apparaît par une transition : on le lit une fois posé
  const anneau = await p.evaluate(() => getComputedStyle(document.activeElement.parentElement).boxShadow);
  verifier(r.n > 0 && /\b3px\b/.test(anneau) && !/\/ 0\)/.test(anneau), `champ atteint en ${r.n} tabulations, cadre de focus : ${anneau}`);
  await p.keyboard.type("Saint-Denis", { delay: 50 });
  await p.waitForSelector('[role="option"]', { timeout: 15000 });
  const champ = p.getByRole("combobox");
  verifier((await champ.getAttribute("aria-expanded")) === "true" && !!(await champ.getAttribute("aria-controls")), "liste ouverte : aria-expanded=true, aria-controls présent");
  await p.keyboard.press("ArrowDown"); await p.keyboard.press("ArrowDown");
  const desc = await champ.getAttribute("aria-activedescendant");
  const optActive = desc ? await p.locator(`#${desc}`).getAttribute("aria-selected") : null;
  verifier(!!desc && optActive === "true", `flèches : aria-activedescendant=${desc}, option aria-selected=${optActive}, focus resté dans le champ : ${(await actif(p)).role === "combobox"}`);
  await p.keyboard.press("Escape");
  verifier((await champ.getAttribute("aria-expanded")) === "false" && (await p.locator('[role="option"]').count()) === 0 && (await actif(p)).role === "combobox", "Échap : liste fermée, focus dans le champ");
  await p.keyboard.press("ArrowDown");
  await p.waitForSelector('[role="option"]', { timeout: 15000 }).catch(() => null);
  const rouverte = (await champ.getAttribute("aria-expanded")) === "true";
  if (!rouverte) { await p.keyboard.type(" ", { delay: 30 }); await p.keyboard.press("Backspace"); await p.waitForSelector('[role="option"]', { timeout: 15000 }); }
  console.log(`info flèche bas après Échap : ${rouverte ? "rouvre la liste" : "ne rouvre pas (la saisie la rouvre)"}`);
  await p.keyboard.press("Enter");
  await p.waitForSelector('[data-identite="canonique"]', { timeout: 15000 });
  verifier((await p.locator("[data-identite]").innerText()).length > 0, `Entrée : commune « ${await p.locator("[data-identite]").innerText()} », focus sur ${(await actif(p)).tag}`);
  r = await tabJusqua(p, (a) => a.tag === "BUTTON" && /chaleurs/.test(a.texte));
  verifier(r.n > 0 && r.n <= 4, `première priorité en ${r.n} tabulation(s) après la commune`);
  await p.keyboard.press("Space"); await prete(p);
  verifier((await p.getByRole("button", { name: "Éviter les fortes chaleurs" }).getAttribute("aria-pressed")) === "true", "Espace : priorité choisie (aria-pressed=true)");
  r = await tabJusqua(p, (a) => a.tag === "BUTTON" && /Connaître les risques/.test(a.texte));
  await p.keyboard.press("Enter"); await prete(p); await p.waitForTimeout(400);
  const onglets = await p.locator('[role="tab"]').count();
  verifier(onglets === 2, `Entrée : deuxième priorité, ${onglets} onglets`);
  await p.locator('[role="tab"][aria-selected="true"]').focus();
  await p.keyboard.press("ArrowLeft"); await p.waitForTimeout(400);
  const ong = await p.evaluate(() => ({ focus: document.activeElement?.textContent, choisi: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent, tabindex: [...document.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("tabindex")).join(","), panneau: document.querySelector('[role="tabpanel"]')?.getAttribute("aria-labelledby") }));
  verifier(ong.focus === ong.choisi && ong.tabindex.includes("-1") && !!ong.panneau, `onglets : flèche gauche → « ${ong.focus} », tabindex ${ong.tabindex}, panneau ${ong.panneau}`);
  // Le détail « Comment lire ce résultat ? » ou « Voir les risques recensés », selon l'onglet.
  r = await tabJusqua(p, (a) => a.tag === "SUMMARY");
  await p.keyboard.press("Enter");
  const ouvert = await p.evaluate(() => document.activeElement?.closest("details")?.open);
  verifier(r.n > 0 && ouvert === true && r.a.contour !== "none", `détail « ${r.a.texte} » : atteint, Entrée ouvre, contour ${r.a.contour}`);
  await p.keyboard.press("Enter");
  // Les liens d'action, puis la sortie du hero : aucun piège.
  // Périmètre V1 (Hexagone et Corse) : une lecture ultramarine n'a pas de bouton vers `/dossier`, elle dit le constat.
  const horsOffre = await p.evaluate(() => /couvrent\s+pour\s+l'instant\s+l'Hexagone\s+et\s+la\s+Corse/.test(document.querySelector('[aria-live="polite"]')?.textContent ?? ""));
  if (horsOffre) {
    const liens = await p.evaluate(() => [...document.querySelectorAll('[aria-live="polite"] a')].map((a) => a.getAttribute("href")));
    verifier(!liens.includes("/dossier"), `outre-mer (V1) : aucun lien vers /dossier dans la lecture, constat affiché ; liens ${liens.join(", ")}`);
  } else {
    r = await tabJusqua(p, (a) => a.tag === "A" && /Examiner une adresse/.test(a.texte));
    const href = await p.evaluate(() => document.activeElement?.getAttribute("href"));
    verifier(r.n > 0 && href === "/dossier", `CTA « ${r.a.texte} » atteint, href ${href}`);
  }
  r = await tabJusqua(p, (a) => a.tag === "A" && /Chercher des communes/.test(a.texte));
  verifier(r.n > 0, `lien « ${r.a.texte} » atteint`);
  const avant = await p.evaluate(() => document.activeElement?.getBoundingClientRect().top + scrollY);
  r = await tabJusqua(p, () => true, 1);
  let sorti = false;
  for (let i = 0; i < 25; i++) { const y = await p.evaluate(() => document.activeElement?.getBoundingClientRect().top + scrollY); if (y > avant + 200) { sorti = true; break; } await p.keyboard.press("Tab"); }
  verifier(sorti, "aucun piège : Tab sort du hero vers la suite de la page");
  // Changer de commune au clavier.
  await p.getByRole("button", { name: "Changer de commune" }).focus();
  await p.keyboard.press("Enter"); await p.waitForTimeout(300);
  verifier((await actif(p)).role === "combobox" && (await p.locator("[data-identite]").count()) === 0, "« Changer de commune » au clavier : focus dans le champ, commune retirée");
  await p.screenshot({ path: `${SORTIE}/clavier-1440.jpg`, type: "jpeg", quality: 75 });
  await ctx.close();
}

// ── D. Mouvement réduit réellement émulé ──────────────────────────────────────────────────────
for (const [largeur, hauteur] of [[390, 844], [1440, 900]]) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 2, reducedMotion: "reduce", hasTouch: largeur < 800, isMobile: largeur < 800 });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${PAGE}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  const media = await p.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches);
  await p.evaluate(() => { window.__defilements = []; const o = window.scrollTo.bind(window); window.scrollTo = (...a) => { window.__defilements.push(JSON.stringify(a[0] ?? a)); return o(...a); }; });
  const champ = p.getByRole("combobox");
  await champ.click(); await champ.pressSequentially("Nantes", { delay: 50 });
  await p.waitForSelector('[role="option"]', { timeout: 15000 }); await p.keyboard.press("Enter");
  await p.waitForSelector('[data-identite="canonique"]', { timeout: 15000 });
  await p.getByRole("button", { name: "Éviter les fortes chaleurs" }).click(); await prete(p);
  const animations = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  const transitions = await p.evaluate(() => { const s = new Set(); for (const e of document.querySelectorAll("main *")) { if (e.closest("header, nav")) continue; const d = getComputedStyle(e).transitionDuration; if (d && !/^0s(, 0s)*$/.test(d)) s.add(`${e.tagName}.${String(e.className).slice(0, 30)} ${d}`); } return [...s].slice(0, 5); });
  const entete = await p.evaluate(() => [...document.querySelectorAll("header *, nav *")].filter((e) => !/^0s(, 0s)*$/.test(getComputedStyle(e).transitionDuration)).length);
  console.log(`info ${largeur} réduit : en-tête global du site (hors FUT-50), ${entete} éléments gardent une transition (couleurs 0,15 s, flèche du menu 0,2 s)`);
  const pos = await p.evaluate(() => ({ titre: Math.round(document.querySelector('[aria-live="polite"] article h2').getBoundingClientRect().top), entete: Math.round(document.querySelector("nav").getBoundingClientRect().bottom), y: Math.round(scrollY), h: innerHeight }));
  const defil = await p.evaluate(() => window.__defilements);
  await p.getByRole("button", { name: "Et au-dessus de 30 °C ?" }).click();
  const anim30 = await p.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").length);
  verifier(media && animations === 0 && anim30 === 0 && transitions.length === 0, `${largeur} réduit : media=${media}, animations ${animations} puis ${anim30} au basculement 30 °C, transitions non nulles ${JSON.stringify(transitions)}`);
  const visible = pos.titre >= pos.entete && pos.titre < pos.h - 80;
  verifier(defil.every((d) => !/smooth/.test(d)), `${largeur} réduit : défilements JS ${JSON.stringify(defil)} (aucun « smooth »)`);
  console.log(`${visible ? "ok  " : "NOTE"} ${largeur} réduit : titre de la lecture à ${pos.titre} px (en-tête ${pos.entete}, fenêtre ${pos.h}, défilé ${pos.y}) → ${visible ? "visible" : "HORS ÉCRAN"}`);
  if (!visible && largeur < 800) echecs++;
  await p.screenshot({ path: `${SORTIE}/reduit-${largeur}.jpg`, type: "jpeg", quality: 75 });
  await ctx.close();
}

// ── E. Vrais viewports ─────────────────────────────────────────────────────────────────────────
for (const [nom, largeur, hauteur, mobile] of [["360x800", 360, 800, true], ["390x844", 390, 844, true], ["tablette-820x1180", 820, 1180, true], ["ordinateur-1440x900", 1440, 900, false]]) {
  const ctx = await nav.newContext({ viewport: { width: largeur, height: hauteur }, deviceScaleFactor: 2, isMobile: mobile, hasTouch: mobile });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${PAGE}`, { waitUntil: "networkidle" }); await p.waitForTimeout(1200);
  const vw = await p.evaluate(() => innerWidth);
  const champ = p.getByRole("combobox");
  await champ.click(); await champ.pressSequentially("Saint-Denis", { delay: 50 });
  await p.waitForSelector('[role="option"]', { timeout: 15000 }); await p.keyboard.press("Enter");
  await p.waitForSelector('[data-identite="canonique"]', { timeout: 15000 });
  const deb1 = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  await p.getByRole("button", { name: "Éviter les fortes chaleurs" }).click(); await prete(p); await p.waitForTimeout(1200);
  const m = await p.evaluate(() => {
    const t = document.querySelector('[aria-live="polite"] article h2').getBoundingClientRect();
    const valeurs = [...document.querySelectorAll('[aria-live="polite"] [class*=mesureValeur]')].filter((e) => e.offsetParent && getComputedStyle(e.closest("[data-visible]") ?? e).visibility !== "hidden").map((e) => ({ texte: e.textContent.replace(/\s+/g, " ").trim(), taille: parseFloat(getComputedStyle(e).fontSize), droite: Math.round(e.getBoundingClientRect().right) }));
    // WCAG 2.2, 2.5.8 : 24 px au moins, SAUF lien dans une phrase, ou cible assez espacée (aucune autre cible à moins
    // de 24 px de son centre).
    const toutes = [...document.querySelectorAll('button, a[href], summary, input')].filter((e) => e.offsetParent);
    const cibles = toutes.filter((e) => e.closest("section")).map((e) => {
      const r = e.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const texte = (e.textContent || e.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim();
      const enLigne = ((e.parentElement?.textContent ?? "").replace(/\s+/g, " ").trim().length > texte.length + 10) && getComputedStyle(e).display.startsWith("inline");
      const voisine = Math.min(...toutes.filter((o) => o !== e).map((o) => o.getBoundingClientRect()).filter((o) => o.height > 0).map((o) => Math.hypot(Math.max(o.left - cx, cx - o.right, 0), Math.max(o.top - cy, cy - o.bottom, 0))));
      return { t: texte.slice(0, 30), h: Math.round(r.height), enLigne, voisine: Math.round(voisine) };
    }).filter((c) => c.h > 0 && c.h < 24 && !c.enLigne && c.voisine < 24);
    return { titre: Math.round(t.top), entete: Math.round(document.querySelector("nav").getBoundingClientRect().bottom), y: Math.round(scrollY), h: innerHeight, valeurs, petites: cibles, deb: document.documentElement.scrollWidth - innerWidth };
  });
  await p.screenshot({ path: `${SORTIE}/${nom}-chaleur.jpg`, type: "jpeg", quality: 75 });
  // Changer de commune : stabilité, aucune valeur de l'ancienne commune.
  await p.getByRole("button", { name: "Changer de commune" }).click();
  await champ.pressSequentially("Nîmes", { delay: 50 });
  await p.waitForSelector('[role="option"]', { timeout: 15000 }); await p.keyboard.press("Enter");
  await p.waitForSelector('[data-identite="canonique"]', { timeout: 15000 }); await prete(p); await p.waitForTimeout(900);
  const apres = await p.evaluate(() => ({ titre: document.querySelector('[aria-live="polite"] article h2')?.textContent, deb: document.documentElement.scrollWidth - innerWidth, texte: document.querySelector('[aria-live="polite"]').textContent }));
  verifier(vw === largeur && deb1 <= 0 && m.deb <= 0 && apres.deb <= 0, `${nom} : viewport réel ${vw} px, débordement ${deb1}/${m.deb}/${apres.deb} px`);
  verifier(m.valeurs.length === 2 && m.valeurs.every((v) => v.taille >= 28 && v.droite <= largeur), `${nom} : grands chiffres ${m.valeurs.map((v) => `${v.texte} (${v.taille} px)`).join(" | ")}`);
  verifier(m.titre >= m.entete, `${nom} : titre de la lecture à ${m.titre} px sous l'en-tête (${m.entete} px), défilé ${m.y}`);
  verifier(m.petites.length === 0, `${nom} : cibles < 24 px hors exceptions WCAG 2.5.8 : ${m.petites.length ? JSON.stringify(m.petites) : "aucune"}`);
  verifier(/Nîmes/.test(apres.titre ?? "") && !/La Réunion/.test(apres.texte), `${nom} : après changement, « ${(apres.titre ?? "").replace(/\s+/g, " ")} », aucune trace de Saint-Denis`);
  await p.screenshot({ path: `${SORTIE}/${nom}-apres-changement.jpg`, type: "jpeg", quality: 75 });
  await ctx.close();
}

await nav.close();
console.log(echecs ? `\n${echecs} échec(s)` : "\nTout est conforme.");
process.exit(echecs ? 1 : 0);
