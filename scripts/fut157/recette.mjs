// FUT-157 · Recette en vrai navigateur de la section « Sols pollués sur ce terrain », dans le vrai module Logement
// (`/dev/fut157`, réponses réelles figées le 30/10/2026). Bureau (1440 px, souris), mobile 390 et 360 px (toucher).
// Vérifie le texte rendu de chaque état, l'absence de défilement horizontal, la taille des cibles au toucher,
// le parcours au clavier (focus visible, dépliant ouvert à la touche Entrée) et l'absence d'erreur de page.
// Le banc n'a pas de session : `/api/synthesize-logement` y redirige vers la connexion, et `LogementSynthesis`
// afficherait le HTML de cette page (défaut antérieur, signalé à part). L'appel est donc servi par un texte court.
// Usage : BASE=http://localhost:3157 SORTIE=<dossier de captures> node scripts/fut157/recette.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3157";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-30-fut157-sites-sols-terrain";
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };

/** Le cas, l'identifiant de capture, et ce que le lecteur doit lire (et ne jamais lire). */
const CAS = [
  { cas: "57463_6453_00096_b", nom: "metz-sotrameuse-96b", lit: [/touche peut-être ce terrain : c.est à vérifier/, /ne tombe dans aucune parcelle\. La plus proche, à 2 m,/, /Sotrameuse/, /instruction en cours/], jamais: [/Cette adresse est dans/] },
  { cas: "57463_6453_00098", nom: "metz-98-voisin", lit: [/^Aucun secteur d.information sur les sols/m, /pas la preuve d.un sol sans pollution/, /9 fiches de la commune n.ont pas d.emprise publiée.*Aucune n.est publiée à cette adresse/], jamais: [/Sotrameuse/] },
  { cas: "57463_6453", nom: "metz-voie", lit: [/ne contient le point de l.adresse, mais le terrain lui-même n.a pas pu être situé/, /n.est connue qu.à la voie/], jamais: [/Sotrameuse/] },
  { cas: "75107_4314_00064", nom: "paris-grenelle-sis", lit: [/Cette adresse est dans un secteur d.information sur les sols : l.État y connaît une pollution des sols/, /Station-service AVIA-RASPAIL/, /soumis à permis/, /informer par écrit/], jamais: [/obligatoire/i, /état des risques/i] },
  { cas: "69387_6430_00050", nom: "lyon-sup", lit: [/périmètre d.une servitude liée à une pollution des sols/, /certificat d.urbanisme/], jamais: [/étude de sols par un bureau/] },
  { cas: "69389_7170_00005", nom: "lyon-parcelle-traversee", lit: [/La parcelle de cette adresse est dans un secteur/, /Toute la parcelle BP 85 de l.adresse est dans ce périmètre/], jamais: [] },
  { cas: "69388_5265_00056", nom: "lyon-adresse-publiee", lit: [/publiée à l.adresse « 56 RUE PAUL CAZENEUVE »/, /n.est située que par un point/], jamais: [/Comparez sur la carte/] },
  { cas: "partiel", nom: "paris-panne-partielle", lit: [/Cette adresse est dans un secteur d.information sur les sols/, /Non lus en entier : servitudes liées à une pollution des sols, sites pollués suivis par l.administration et la liste des fiches de la commune sans emprise publiée\. D.autres périmètres peuvent exister/], jamais: [] },
  { cas: "panne", nom: "panne-totale", lit: [/n.ont pas répondu lors de la collecte : rien ne peut être conclu sur ce terrain/, /Actualisez les données plus tard/], jamais: [/^Aucun/m] },
];

async function contexte(format) {
  const ctx = format === "bureau"
    ? await nav.newContext({ viewport: { width: 1440, height: 900 } })
    : await nav.newContext({ viewport: { width: format === "mobile-390" ? 390 : 360, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.route("**/api/synthesize-logement", (r) => r.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: "Synthèse du banc : non rédigée." }));
  return ctx;
}

for (const format of ["bureau", "mobile-390", "mobile-360"]) {
  const ctx = await contexte(format);
  for (const c of CAS) {
    const p = await ctx.newPage();
    const erreurs = [];
    p.on("pageerror", (e) => erreurs.push(String(e)));
    await p.goto(`${BASE}/dev/fut157?vue=logement&cas=${c.cas}`, { waitUntil: "networkidle", timeout: 120_000 });
    const s = p.locator("section[aria-labelledby='sites-sols']");
    const present = await s.count();
    verifier(present === 1, `${format} ${c.nom} : une seule section`);
    if (!present) { await p.close(); continue; }
    await s.scrollIntoViewIfNeeded();
    const t = (await s.innerText()).replace(/ /g, " ");
    for (const r of c.lit) verifier(r.test(t), `${format} ${c.nom} : lit ${r}`);
    for (const r of c.jamais) verifier(!r.test(t), `${format} ${c.nom} : ne lit jamais ${r}`);
    const debord = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    verifier(debord <= 0, `${format} ${c.nom} : aucun défilement horizontal (${debord} px)`);
    // Un débordement masqué par un ancêtre (`overflow: hidden`) ne fait pas défiler la page, mais coupe le texte.
    const boite = await s.boundingBox();
    const fenetre = p.viewportSize().width;
    verifier(boite.x >= 0 && boite.x + boite.width <= fenetre, `${format} ${c.nom} : la section tient dans la fenêtre (${Math.round(boite.x)} + ${Math.round(boite.width)} ≤ ${fenetre})`);

    // Les cibles : sur écran tactile, chaque lien seul et le dépliant font au moins 44 px de haut.
    if (format !== "bureau") {
      const hauteurs = await s.locator("a, summary").evaluateAll((els) => els.map((e) => Math.round(e.getBoundingClientRect().height)));
      verifier(hauteurs.every((h) => h >= 44), `${format} ${c.nom} : cibles tactiles ≥ 44 px (${hauteurs.join(", ")})`);
      await s.locator("summary").tap();
    } else {
      // Au clavier : le focus atteint chaque lien puis le dépliant, visiblement, et Entrée l'ouvre.
      const cibles = await s.locator("a, summary").count();
      await s.locator("p").first().click();
      let vus = 0;
      for (let i = 0; i < cibles; i++) {
        await p.keyboard.press("Tab");
        const ok = await p.evaluate(() => {
          const e = document.activeElement;
          if (!e || !e.closest("section[aria-labelledby='sites-sols']")) return false;
          const st = getComputedStyle(e);
          return st.outlineStyle !== "none" && parseFloat(st.outlineWidth) >= 1;
        });
        if (ok) vus++;
      }
      verifier(vus === cibles, `${format} ${c.nom} : ${vus}/${cibles} cibles atteintes au clavier, focus visible`);
      await p.keyboard.press("Enter");
    }
    verifier(await s.locator("details").evaluate((d) => d.open), `${format} ${c.nom} : « En savoir plus » s'ouvre`);
    await p.waitForTimeout(400);
    await s.screenshot({ path: `${SORTIE}/${format}-${c.nom}.png` });
    verifier(erreurs.length === 0, `${format} ${c.nom} : aucune erreur de page${erreurs.length ? ` (${erreurs[0]})` : ""}`);
    await p.close();
  }
  // Un rapport antérieur à FUT-157 : rien ne s'affiche, ni absence ni panne.
  const p = await ctx.newPage();
  await p.goto(`${BASE}/dev/fut157?vue=logement&cas=ancien`, { waitUntil: "networkidle", timeout: 120_000 });
  verifier(await p.locator("section[aria-labelledby='sites-sols']").count() === 0, `${format} rapport antérieur : aucune section`);
  verifier(await p.getByText("Ce à quoi cette adresse est exposée").count() >= 1, `${format} rapport antérieur : le module est rendu`);
  if (format === "bureau") await p.screenshot({ path: `${SORTIE}/${format}-module-entier-ancien.png`, fullPage: true });
  await p.close();
  if (format === "bureau") {
    const q = await ctx.newPage();
    await q.goto(`${BASE}/dev/fut157?vue=logement&cas=57463_6453_00096_b`, { waitUntil: "networkidle", timeout: 120_000 });
    await q.screenshot({ path: `${SORTIE}/${format}-module-entier-sotrameuse.png`, fullPage: true });
    await q.close();
  }
  await ctx.close();
}
await nav.close();
console.log(echecs ? `\n${echecs} ÉCHEC(S)` : "\nToutes les vérifications passent.");
process.exit(echecs ? 1 : 0);
