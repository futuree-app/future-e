// FUT-152 · Recette en vrai navigateur des quatre recherches de /agir/pollutions-invisibles.
// Bureau (1440 px, souris) et mobile (390 px, toucher). Sources réelles, puis pannes simulées (route coupée)
// et une réponse piégée (HTML et lien `javascript:` dans les données) pour vérifier qu'aucun ne s'exécute.
// Revue du 29/10/2026 : réponses partielles (total annoncé non lu) et réponse ATMO inattendue côté serveur, puis
// retour réel du service ATMO sur le même serveur (`atmo-inattendu.mjs`, interrupteur `ATMO_FICHIER`).
// Usage : BASE=http://localhost:3152 SORTIE=<dossier de captures> ATMO_FICHIER=<même chemin que le serveur>
//         node scripts/fut152/recette.mjs
import { chromium } from "playwright-core";
import { mkdirSync, writeFileSync } from "node:fs";

const BASE = process.env.BASE ?? "http://localhost:3152";
const SORTIE = process.env.SORTIE ?? "docs/audits/2026-10-28-fut152-pollutions-invisibles";
const ATMO_FICHIER = process.env.ATMO_FICHIER;
if (!ATMO_FICHIER) throw new Error("ATMO_FICHIER requis (le même que celui du serveur).");
mkdirSync(SORTIE, { recursive: true });
const nav = await chromium.launch({ channel: "chrome" });
let echecs = 0;
const verifier = (ok, message) => { console.log(`${ok ? "ok  " : "ÉCHEC"} ${message}`); if (!ok) echecs++; };

const BLOCS = { irep: 0, sis: 1, atmo: 2, eau: 3 };
const bloc = (p, nom) => p.locator(".lookup-block").nth(BLOCS[nom]);

async function rechercher(p, nom, commune, choix = commune) {
  const b = bloc(p, nom);
  await b.scrollIntoViewIfNeeded();
  const champ = b.locator("input.lookup-input");
  await champ.fill("");
  await champ.pressSequentially(commune, { delay: 20 });
  const option = b.locator(".commune-opt", { hasText: choix }).first();
  await option.waitFor({ timeout: 10_000 });
  await option.dispatchEvent("mousedown");
  await b.locator("button.lookup-btn").click();
  await b.locator(".lookup-loading").waitFor({ state: "detached", timeout: 90_000 });
  return b;
}

async function scenario(ctx, libelle) {
  const p = await ctx.newPage();
  const erreurs = [];
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(`${BASE}/agir/pollutions-invisibles`, { waitUntil: "networkidle" });

  // ── Sources réelles ──
  let b = await rechercher(p, "irep", "Metz");
  let t = await b.innerText();
  verifier(/Dans un rayon de 10 km autour du centre de Metz · déclarations 2025/.test(t), `${libelle} IREP Metz : périmètre et millésime`);
  verifier(/5 établissements avec au moins un rejet chiffré publié/.test(t), `${libelle} IREP Metz : 5 établissements avec rejet`);
  verifier(/19 autres établissements du registre dans\s+ce rayon, sans rejet chiffré publié au-dessus des seuils/.test(t), `${libelle} IREP Metz : 19 autres, formulation arbitrée`);
  verifier(/ne mesure pas l’exposition d’un logement voisin/.test(t), `${libelle} IREP Metz : limite d'interprétation`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-irep-metz.png` });

  b = await rechercher(p, "irep", "Paris");
  t = await b.innerText();
  verifier(/33 établissements/.test(t) && /Afficher les 25 autres/.test(t), `${libelle} IREP Paris : 33 listés, 8 visibles, le reste dépliable`);

  // Revue du 29/10/2026 : Fos au point que l'écran envoie lui-même (centre geo.api), recompté depuis l'export.
  b = await rechercher(p, "irep", "Fos-sur-Mer");
  t = await b.innerText();
  verifier(/17 établissements avec au moins un rejet chiffré publié/.test(t) && /32 autres établissements du registre/.test(t), `${libelle} IREP Fos-sur-Mer : 17 avec rejet, 32 autres, comme le recomptage de l'export`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-irep-fos.png` });

  b = await rechercher(p, "sis", "Metz");
  t = await b.innerText();
  verifier(/Secteurs d’information sur les sols \(SIS\) : 8/.test(t), `${libelle} SIS Metz : 8 SIS`);
  verifier(/CASIAS\) : 546 fiches/.test(t), `${libelle} SIS Metz : 546 fiches CASIAS comptées`);
  verifier(/les nombres ne s’additionnent pas/.test(t), `${libelle} SIS Metz : inventaires non additionnés`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-sites-sols-metz.png` });

  b = await rechercher(p, "sis", "Paris");
  t = await b.innerText();
  verifier(/\(SIS\) : 37/.test(t) && /8\s?248 fiches/.test(t), `${libelle} SIS Paris : ville et arrondissements (37 SIS, 8 248 fiches CASIAS distinctes)`);

  b = await rechercher(p, "sis", "L'Abergement-Cl", "L'Abergement-Clémenciat");
  t = await b.innerText();
  verifier(/Aucun secteur d’information sur les sols arrêté dans cette commune/.test(t) && /CASIAS\) : 3 fiches/.test(t), `${libelle} SIS village : absences nommées, 3 CASIAS`);

  b = await rechercher(p, "atmo", "Metz");
  t = await b.innerText();
  verifier(/Indice ATMO du \d\d\/\d\d\/2026/.test(t) && /Atmo Grand Est/.test(t), `${libelle} ATMO Metz : indice daté, association nommée`);

  b = await rechercher(p, "eau", "Metz");
  t = await b.innerText();
  verifier(/desservie par 2 réseaux/.test(t) && /carbone organique total/.test(t), `${libelle} Eau Metz : 2 réseaux, conclusion ARS (référence COT)`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-eau-metz.png` });

  b = await rechercher(p, "eau", "L'Abergement-Cl", "L'Abergement-Clémenciat");
  t = await b.innerText();
  verifier(/Dernier prélèvement publié : 05\/02\/2026/.test(t), `${libelle} Eau village : prélèvement du 05/02/2026 affiché`);

  b = await rechercher(p, "eau", "Paris");
  t = await b.innerText();
  verifier(/desservie par 4 réseaux/.test(t) && /Dessert : /.test(t), `${libelle} Eau Paris : 4 réseaux et leurs zones`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-eau-paris.png` });

  // ── Pannes simulées : aucune ne devient une absence ──
  for (const [nom, motif] of [["irep", "**/api/proxy/irep*"], ["sis", "**/api/proxy/sis*"], ["atmo", "**/api/atmo/**"], ["eau", "**/api/proxy/eau*"]]) {
    await p.route(motif, (r) => r.abort());
    b = await rechercher(p, nom, "Metz");
    t = await b.innerText();
    verifier(/indisponible/i.test(t) && !/Aucun/.test(t), `${libelle} panne ${nom} : dite indisponible, jamais « aucun »`);
    await p.unroute(motif);
  }

  // ── Revue 1 et 2 : une réponse partielle n'est jamais une absence ──
  await p.route("**/api/proxy/sis*", (r) => r.fulfill({ json: {
    perimetre: { demande: "57463", commune: "57463", codes: ["57463"], elargiALaVille: false }, consulteLe: "2026-10-29T12:00:00Z",
    sis: { etat: "partiel", total: 0, fiches: [] },
    instructions: { etat: "partiel", total: 1, fiches: [{ id: "I1", nom: "Site lu", adresse: null, commune: "METZ", statut: null, fiche: null, miseAJour: null }] },
    sup: { etat: "absent_dans_source", total: 0, fiches: [] }, casias: { etat: "partiel", total: 0 },
  } }));
  b = await rechercher(p, "sis", "Metz");
  t = await b.innerText();
  verifier(!/Aucun secteur/.test(t) && !/Aucune fiche dans l’inventaire/.test(t) && !/\(SIS\) : 0/.test(t), `${libelle} partiel sans fiche : ni « aucun », ni « 0 »`);
  verifier((t.match(/La source annonce des fiches qui n’ont pas pu être lues : rien ne peut en être conclu/g) ?? []).length === 2, `${libelle} partiel sans fiche : SIS et CASIAS disent que rien n'est conclu`);
  verifier(/\(ex-BASOL\) : au moins 1/.test(t) && /Liste incomplète/.test(t), `${libelle} partiel avec fiche : « au moins 1 », liste dite incomplète`);
  verifier(/Aucune servitude de ce type/.test(t), `${libelle} partiel : le vrai vide voisin reste dit`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-sites-sols-partiel.png` });
  await p.unroute("**/api/proxy/sis*");

  await p.route("**/api/proxy/eau*", (r) => r.fulfill({ json: { etat: "partiel", consulteLe: "2026-10-29T12:00:00Z", reseaux: [], parametres: [] } }));
  b = await rechercher(p, "eau", "Metz");
  t = await b.innerText();
  verifier(!/Aucun prélèvement/.test(t) && /La source annonce des résultats qui n’ont pas pu être lus : rien ne peut en être conclu/.test(t), `${libelle} eau partielle sans résultat : jamais « aucun prélèvement »`);
  await p.unroute("**/api/proxy/eau*");

  // ── Revue 3 : ATMO répond un JSON inattendu (côté serveur), puis le service revient ──
  // Une commune par contexte, jamais lue avant : le cache du jour (par commune) ne peut rien masquer.
  const villeAtmo = libelle === "bureau" ? "Nancy" : "Épinal";
  writeFileSync(ATMO_FICHIER, "inattendu");
  b = await rechercher(p, "atmo", villeAtmo);
  t = await b.innerText();
  verifier(/indisponible/i.test(t) && !/Aucun indice/.test(t), `${libelle} ATMO JSON inattendu : dit indisponible, jamais « aucun indice »`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-atmo-inattendu.png` });
  writeFileSync(ATMO_FICHIER, "");
  b = await rechercher(p, "atmo", villeAtmo);
  t = await b.innerText();
  verifier(/Indice ATMO du \d\d\/\d\d\/2026/.test(t) && /Atmo Grand Est/.test(t), `${libelle} ATMO retour réel du service : indice servi, l'erreur n'a pas été gardée`);
  await b.screenshot({ path: `${SORTIE}/${libelle}-atmo-retour.png` });

  // ── Données piégées : rien ne s'exécute, aucun lien hors domaine ──
  await p.route("**/api/proxy/sis*", (r) => r.fulfill({ json: {
    perimetre: { demande: "57463", commune: "57463", codes: ["57463"], elargiALaVille: false }, consulteLe: "2026-10-28T12:00:00Z",
    sis: { etat: "disponible", total: 1, fiches: [{ id: "X", nom: '<img src=x onerror="window.__xss=1">', adresse: "<b>gras</b>", commune: "METZ", statut: null, fiche: "javascript:window.__xss=2", miseAJour: null }] },
    instructions: { etat: "absent_dans_source", total: 0, fiches: [] }, sup: { etat: "absent_dans_source", total: 0, fiches: [] }, casias: { etat: "disponible", total: 1 },
  } }));
  b = await rechercher(p, "sis", "Metz");
  await b.locator("a", { hasText: "fiche officielle" }).first().click({ timeout: 2000 }).catch(() => {});
  const xss = await p.evaluate(() => window.__xss ?? null);
  const texte = await b.innerText();
  verifier(xss === null && texte.includes('<img src=x onerror="window.__xss=1">'), `${libelle} injection : le HTML des données est affiché comme texte, rien ne s'exécute`);
  await p.unroute("**/api/proxy/sis*");

  // ── Mise en page ──
  const debord = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  verifier(debord <= 0, `${libelle} aucun défilement horizontal (${debord} px)`);
  verifier(erreurs.length === 0, `${libelle} aucune erreur JavaScript ${erreurs.join(" | ")}`);
  await p.close();
}

const bureau = await nav.newContext({ viewport: { width: 1440, height: 1000 } });
await scenario(bureau, "bureau");
const mobile = await nav.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
await scenario(mobile, "mobile");
await nav.close();
console.log(echecs ? `${echecs} ÉCHEC(S)` : "recette verte");
process.exit(echecs ? 1 : 0);
