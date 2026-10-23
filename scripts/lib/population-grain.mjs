// FUT-109 · LA POPULATION AU GRAIN DU RÉFÉRENTIEL. Logique PURE (aucune I/O), testable sans l'index.
//
// LE DÉFAUT. L'index lit la population dans ADEME `data_communes`, champ `population_totale_2021`. Ce champ
// est la population MUNICIPALE Insee 2021 (vérifié : égale au PMUN des populations légales 2021 pour les
// 34 704 communes au territoire inchangé), publiée dans la géographie au 01/01/2023. ADEME l'a rattachée aux
// codes d'un COG plus récent SANS la recalculer :
//   - commune rétablie (défusion) : `0`, alors que la commune compte des habitants (L'Oie, Sainte-Florence,
//     Les Hauts-Talican, rétablies le 01/01/2024) ;
//   - commune d'origine d'une défusion : la population de l'ancienne commune nouvelle, avant séparation
//     (Essarts-en-Bocage 9 399 pour 6 851) ;
//   - commune nouvelle : la seule population de la commune qui a gardé son code (Saint-Denis 113 942 pour
//     149 077 après fusion avec Pierrefitte-sur-Seine) ;
//   - code créé depuis 2023 (transfert de chef-lieu) : absent de la source.
// Le référentiel de l'index est le COG au 01/01/2025 (liste DRIAS) : ces valeurs ne sont pas à son grain.
//
// LA RÈGLE. Une valeur 2021 n'est gardée que si le territoire de la commune n'a pas changé entre la
// géographie de ce millésime (01/01/2023) et celle du référentiel (01/01/2025), et si son code existait déjà.
// Sinon, on prend la population de référence Insee publiée DANS la géographie du référentiel (millésime 2023,
// limites au 01/01/2025). Jamais de somme ni de report d'une commune nouvelle sur une commune déléguée : une
// valeur officielle au bon grain, ou une absence explicite (`null`), jamais un `0` par défaut.
//
// HORS PÉRIMÈTRE, ASSUMÉ. Une commune que la source ne porte pas sans qu'aucun mouvement ne l'explique reste
// `null` : les six villages détruits de la Meuse (Insee : 0 habitant). Les présenter comme « 0 habitant »
// demande une décision éditoriale, pas une correction de grain.

// Millésime et géographie de la source principale (ADEME `population_totale_2021`).
export const SOURCE_PRINCIPALE = { millesime: 2021, geographie: "2023-01-01" };
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

/**
 * Les communes (type COM) dont la valeur de la source n'est plus au grain du référentiel, d'après les
 * mouvements de l'intervalle ]apres, jusqua].
 * @param {Array<Record<string, string>>} mouvements lignes de `v_mvt_commune_AAAA.csv` (MOD, DATE_EFF, TYPECOM_AV, COM_AV, TYPECOM_AP, COM_AP)
 * @returns {Map<string, Array<{ mod: string, date: string }>>}
 */
export function communesHorsGrain(mouvements, { apres, jusqua }) {
  const out = new Map();
  const noter = (code, m) => {
    const liste = out.get(code) ?? [];
    if (!liste.some((x) => x.mod === m.MOD && x.date === m.DATE_EFF)) liste.push({ mod: m.MOD, date: m.DATE_EFF });
    out.set(code, liste);
  };
  for (const m of mouvements) {
    if (!(m.DATE_EFF > apres && m.DATE_EFF <= jusqua)) continue;
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
 * Le référentiel des corrections : une entrée par commune de l'index que les mouvements du COG mettent hors
 * grain. Les autres communes ne sont jamais touchées, y compris celles que la source ne porte pas : leur
 * absence reste une absence (`null`), elle n'est pas comblée ici.
 * @param {object} p
 * @param {Array<{ insee: string, nom: string }>} p.communes communes de l'index (référentiel COG)
 * @param {Map<string, number|null>} p.source2021 population ADEME 2021 par code
 * @param {Map<string, Array<{mod: string, date: string}>>} p.horsGrain sortie de `communesHorsGrain`
 * @param {Map<string, number|null>} p.populationsGrain PMUN Insee 2023 par code (géographie du référentiel)
 * @returns {Record<string, { nom: string, population: number|null, millesime: number|null, motif: string, valeur2021: number|null, mouvements: Array<{mod: string, date: string}> }>}
 */
export function construireCorrections({ communes, source2021, horsGrain, populationsGrain }) {
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
      valeur2021: source2021.get(insee) ?? null,
      mouvements,
    };
  }
  return out;
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
