// FUT-109 · LA POPULATION AU GRAIN DU RÉFÉRENTIEL. Logique PURE (aucune I/O), testable sans l'index.
//
// LA SOURCE. L'index lit la population dans ADEME `data_communes`, champ `population_totale_2021` : la
// population MUNICIPALE Insee 2021, portée dans la géographie au 01/01/2024. Vérifié sur les sources Insee :
//   - commune au territoire inchangé : égale au PMUN des populations légales 2021 ;
//   - commune nouvelle du 01/01/2024 : égale à la SOMME exacte des PMUN 2021 de ses communes fondatrices
//     (Bazeilles 2 502 = 2 365 + 137 ; Oullins-Pierre-Bénite 37 628 = 27 113 + 10 515) : au bon grain ;
//   - commune RÉTABLIE le 01/01/2024 : `0`, le recensement 2021 ne la sépare pas de sa commune d'origine,
//     qui garde son ancien périmètre (L'Oie et Sainte-Florence 0, Essarts-en-Bocage 9 399 pour 6 851) ;
//   - mouvement postérieur au 01/01/2024 : valeur d'avant le mouvement (Saint-Denis 113 942 pour 149 077
//     après sa fusion du 01/01/2025 avec Pierrefitte-sur-Seine), ou code absent (transfert de chef-lieu).
// La base Insee « évolution et structure de la population 2021 » (scripts/populate-demographie.py) suit la
// même géographie, avec les mêmes trous. Le référentiel de l'index est le COG au 01/01/2025 (liste DRIAS).
//
// LA RÈGLE. Une valeur 2021 n'est gardée que si le territoire et le code de la commune n'ont pas changé
// depuis la géographie de la source, rétablissements de cette date compris. Sinon, on prend la population de
// référence Insee publiée DANS la géographie du référentiel (millésime 2023, limites au 01/01/2025). Jamais
// de somme ni de report d'une commune nouvelle sur une commune déléguée : une valeur officielle au bon
// grain, ou une absence explicite (`null`), jamais un `0` par défaut.
//
// HORS PÉRIMÈTRE, ASSUMÉ. Une commune que la source ne porte pas sans qu'aucun mouvement ne l'explique reste
// `null` : les six villages détruits de la Meuse (Insee : 0 habitant). Les présenter comme « 0 habitant »
// demande une décision éditoriale, pas une correction de grain.

// Millésime et géographie de la source principale (ADEME `population_totale_2021`).
export const SOURCE_PRINCIPALE = { millesime: 2021, geographie: "2024-01-01" };
// Millésime de repli : populations de référence Insee 2023, limites communales au 01/01/2025.
export const SOURCE_GRAIN = { millesime: 2023, geographie: "2025-01-01" };

// Mouvements du COG qui modifient le TERRITOIRE d'une commune : rétablissement (21), fusion simple (31),
// création de commune nouvelle (32), fusion-association (33). La valeur 2021 de toutes les communes en cause
// (celle qui part, celle qui reçoit) n'est plus au grain.
export const MOUVEMENTS_TERRITORIAUX = new Set(["21", "31", "32", "33"]);
// Mouvements qui changent le CODE sans changer le territoire : changement de département (41), transfert de
// chef-lieu (50). Le nouveau code n'existait pas dans la géographie de la source.
export const MOUVEMENTS_DE_CODE = new Set(["41", "50"]);
// Les autres ne touchent ni au territoire ni au code : changement de nom (10), suppression de commune déléguée
// (35), passage d'une fusion-association en fusion simple (34).
const RETABLISSEMENT = "21";

// Un mouvement compte s'il est postérieur à la géographie de la source, ou si c'est un rétablissement à cette
// date même : la source a regroupé les fusions du jour, elle n'a pas pu séparer les communes rétablies.
function horsGeographieSource(m, { apres, jusqua }) {
  if (m.DATE_EFF > jusqua) return false;
  return m.DATE_EFF > apres || (m.DATE_EFF === apres && m.MOD === RETABLISSEMENT);
}

/**
 * Les communes (type COM) dont la valeur de la source n'est plus au grain du référentiel, d'après les
 * mouvements postérieurs à la géographie de la source (`apres`), jusqu'à celle du référentiel (`jusqua`).
 * @param {Array<Record<string, string>>} mouvements lignes de `v_mvt_commune_AAAA.csv` (MOD, DATE_EFF, TYPECOM_AV, COM_AV, TYPECOM_AP, COM_AP)
 * @returns {Map<string, Array<{ mod: string, date: string }>>}
 */
export function communesHorsGrain(mouvements, intervalle) {
  const out = new Map();
  const noter = (code, m) => {
    const liste = out.get(code) ?? [];
    if (!liste.some((x) => x.mod === m.MOD && x.date === m.DATE_EFF)) liste.push({ mod: m.MOD, date: m.DATE_EFF });
    out.set(code, liste);
  };
  for (const m of mouvements) {
    if (!horsGeographieSource(m, intervalle)) continue;
    if (MOUVEMENTS_TERRITORIAUX.has(m.MOD)) {
      if (m.TYPECOM_AV === "COM") noter(m.COM_AV, m);
      if (m.TYPECOM_AP === "COM") noter(m.COM_AP, m);
    } else if (MOUVEMENTS_DE_CODE.has(m.MOD) && m.TYPECOM_AP === "COM" && m.COM_AP !== m.COM_AV) {
      noter(m.COM_AP, m);
    }
  }
  return out;
}

/**
 * Les codes disparus depuis la géographie de la source, par commune qui les a repris : communes absorbées par
 * une fusion, ancien code d'un transfert de chef-lieu. Une donnée rangée sous l'un de ces codes (une
 * association du RNA, par exemple) est sur le territoire actuel de la commune qui l'a repris. Un code encore
 * en vigueur (la commune d'origine d'un rétablissement) n'est jamais repris : rien ne permet de le partager.
 * @param {Set<string>} enVigueur codes du référentiel
 * @returns {Map<string, string[]>} code actuel -> codes disparus
 */
export function codesRepris(mouvements, intervalle, enVigueur) {
  const out = new Map();
  for (const m of mouvements) {
    if (!horsGeographieSource(m, intervalle)) continue;
    if (!MOUVEMENTS_TERRITORIAUX.has(m.MOD) && !MOUVEMENTS_DE_CODE.has(m.MOD)) continue;
    if (m.MOD === RETABLISSEMENT || m.TYPECOM_AV !== "COM" || m.TYPECOM_AP !== "COM") continue;
    if (m.COM_AV === m.COM_AP || enVigueur.has(m.COM_AV) || !enVigueur.has(m.COM_AP)) continue;
    const liste = out.get(m.COM_AP) ?? [];
    if (!liste.includes(m.COM_AV)) liste.push(m.COM_AV);
    out.set(m.COM_AP, liste.sort());
  }
  return out;
}

/**
 * Le référentiel des corrections : une entrée par commune de l'index que les mouvements du COG mettent hors
 * grain. Les autres communes ne sont jamais touchées, y compris celles que la source ne porte pas : leur
 * absence reste une absence (`null`), elle n'est pas comblée ici.
 * @param {object} p
 * @param {Array<{ insee: string, nom: string }>} p.communes communes de l'index (référentiel COG)
 * @param {Map<string, number|null>} p.source2021 population ADEME 2021 par code
 * @param {Map<string, Array<{mod: string, date: string}>>} p.horsGrain sortie de `communesHorsGrain`
 * @param {Map<string, number|null>} p.populationsGrain PMUN Insee 2023 par code (géographie du référentiel)
 * @param {Map<string, string[]>} [p.repris] sortie de `codesRepris`
 * @returns {Record<string, { nom: string, population: number|null, millesime: number|null, motif: string, retablissement: boolean, valeur2021: number|null, codesRepris: string[], mouvements: Array<{mod: string, date: string}> }>}
 */
export function construireCorrections({ communes, source2021, horsGrain, populationsGrain, repris = new Map() }) {
  const out = {};
  for (const { insee, nom } of communes) {
    const mouvements = horsGrain.get(insee);
    if (!mouvements) continue; // valeur 2021 au bon grain (ou absence de la source, laissée telle quelle)
    const officielle = populationsGrain.get(insee);
    const connue = typeof officielle === "number" && Number.isFinite(officielle) && officielle >= 0;
    out[insee] = {
      nom,
      population: connue ? officielle : null,
      millesime: connue ? SOURCE_GRAIN.millesime : null,
      motif: mouvements.some((m) => MOUVEMENTS_TERRITORIAUX.has(m.mod)) ? "territoire_modifie" : "code_modifie",
      // Un rétablissement partage un territoire : aucune donnée rangée par code ne se répartit d'elle-même
      // entre la commune rétablie et sa commune d'origine.
      retablissement: mouvements.some((m) => m.mod === RETABLISSEMENT),
      valeur2021: source2021.get(insee) ?? null,
      codesRepris: repris.get(insee) ?? [],
      mouvements,
    };
  }
  return out;
}

/**
 * Preuve que les valeurs GARDÉES sont au grain : pour chaque commune de l'index hors corrections, la valeur
 * de la source doit égaler la somme des PMUN 2021 officiels (populations légales 2021) de ses communes
 * fondatrices, c'est-à-dire elle-même, plus les communes qu'elle a absorbées à la date de la géographie de la
 * source. Rend les écarts ; une liste vide veut dire que la règle est vérifiée sur toute la France.
 * @param {Map<string, number|null>} p.pmun2021 PMUN 2021 par code, géographie de son année de publication
 * @param {Array<Record<string, string>>} p.mouvements
 */
export function ecartsAuGrain({ communes, source2021, corrections, pmun2021, mouvements }) {
  const fondatrices = new Map();
  for (const m of mouvements) {
    if (m.DATE_EFF !== SOURCE_PRINCIPALE.geographie || !MOUVEMENTS_TERRITORIAUX.has(m.MOD) || m.MOD === RETABLISSEMENT) continue;
    if (m.TYPECOM_AV !== "COM" || m.TYPECOM_AP !== "COM" || m.COM_AV === m.COM_AP) continue;
    fondatrices.set(m.COM_AP, [...(fondatrices.get(m.COM_AP) ?? []), m.COM_AV]);
  }
  const ecarts = [];
  for (const { insee, nom } of communes) {
    if (corrections[insee]) continue;
    const v = source2021.get(insee) ?? null;
    if (v == null) continue; // absente de la source : non comblée, rien à prouver
    const codes = [insee, ...(fondatrices.get(insee) ?? [])];
    const attendue = codes.every((k) => pmun2021.has(k)) ? codes.reduce((s, k) => s + pmun2021.get(k), 0) : null;
    if (attendue !== v) ecarts.push({ insee, nom, source: v, attendue, fondatrices: codes });
  }
  return ecarts;
}

/**
 * Applique les corrections aux communes de l'index (mutation en place, idempotente).
 * Une correction sans valeur officielle écrit `null` : jamais `0` par défaut.
 * @returns {{ corrigees: number, absentes: number }}
 */
export function appliquerCorrections(communes, corrections) {
  let corrigees = 0;
  let absentes = 0;
  for (const c of communes) {
    const k = corrections[c.insee];
    if (!k) continue;
    c.population = k.population ?? null;
    if (c.population == null) absentes++;
    else corrigees++;
  }
  return { corrigees, absentes };
}

// Un effectif lu dans un fichier : entier positif ou nul, sinon `null`. Jamais `Number(v)` seul : `Number("")`
// et `Number(" ")` valent 0, et une cellule vide deviendrait « 0 habitant ».
export function effectifOfficiel(v) {
  const s = String(v ?? "").trim();
  return /^\d+$/.test(s) ? Number(s) : null;
}

// Lecteur CSV minimal pour les fichiers Insee (séparateur `;` ou `,`, champs éventuellement entre guillemets,
// sans saut de ligne dans les champs, ce qui est le cas des fichiers COG et populations de référence).
export function lireCsv(texte, separateur) {
  const lignes = texte.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.length > 0);
  const nettoyer = (v) => v.replace(/^"(.*)"$/, "$1");
  const entetes = lignes[0].split(separateur).map(nettoyer);
  return lignes.slice(1).map((l) => {
    const valeurs = l.split(separateur).map(nettoyer);
    return Object.fromEntries(entetes.map((h, i) => [h, valeurs[i] ?? ""]));
  });
}
