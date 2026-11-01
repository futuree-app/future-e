#!/usr/bin/env node
/**
 * FUT-149 — Captures de recette du banc `/dev/fut149` (serveur de dev local), sur ordinateur (1 280 px) et mobile
 * (390 px), avec le Chrome installé. Pour chaque cas : le bloc du débroussaillement seul, le texte qu'il affiche,
 * et le débordement horizontal de la page (doit être nul).
 *
 *   node scripts/research/fut149-captures.mjs [http://localhost:3149]
 */
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] ?? "http://localhost:3149";
const OUT = "docs/audits/2026-10-28-fut149-debroussaillement/captures";
const CAS = [
  ["section", "la-teste-pyla-en-zone"], ["section", "la-teste-centre-hors-zone"], ["section", "gonfaron-foch-limite"],
  ["section", "la-teste-daugey-limite"], ["section", "oleron-boudet-13"], ["section", "lyon-bellecour"], ["section", "panne"],
  ["section", "gonfaron-en-zone"], ["section", "nimes-hors-zone"], ["section", "ancien"],
  ["autour", "oleron-boudet-13"], ["autour", "oleron-boudet-855"], ["autour", "landiras-en-zone"], ["autour", "frejus-sakharov-limite"],
  ["autour", "lyon-bellecour"], ["autour", "panne"],
];
const navigateur = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const bilan = [];
for (const [largeur, nom] of [[1280, "bureau"], [390, "mobile"]]) {
  const page = await navigateur.newPage({ viewport: { width: largeur, height: 900 }, deviceScaleFactor: 2 });
  for (const [vue, cas] of CAS) {
    await page.goto(`${BASE}/dev/fut149?vue=${vue}&cas=${cas}`, { waitUntil: "networkidle", timeout: 120_000 });
    // Le bandeau de mesure d'audience et l'indicateur de Next (fixes) couvrent le bas de l'écran : masqués, jamais cliqués.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) if (getComputedStyle(el).position === "fixed") el.style.visibility = "hidden";
      document.querySelector("nextjs-portal")?.remove();
    });
    const debord = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const bloc = vue === "autour"
      ? page.locator("section", { hasText: "Débroussaillement obligatoire : le zonage du secteur" }).last()
      : page.locator("section", { hasText: "Statut réglementaire à cette adresse" }).last();
    // Un rapport antérieur garde la section, mais sans le bloc : il est « affiché » seulement s'il en parle.
    const present = (await bloc.count()) && /débroussaill/i.test(await bloc.innerText()) ? 1 : 0;
    let texte = "";
    let largeurBloc = null;
    if (present) {
      texte = (await bloc.innerText()).replace(/\s+/g, " ").trim();
      largeurBloc = Math.round((await bloc.boundingBox()).width);
      await bloc.screenshot({ path: `${OUT}/${nom}-${vue}-${cas}.png` });
    }
    bilan.push({ ecran: nom, vue, cas, debordementPx: debord, blocAffiche: present > 0, largeurBloc, texte });
    console.log(nom, vue, cas, "débord", debord, "bloc", present ? largeurBloc : "absent");
  }
  await page.close();
}
await navigateur.close();
writeFileSync(`${OUT}/../recette-textes.json`, JSON.stringify(bilan, null, 1) + "\n");
