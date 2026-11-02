// FUT-138 · PRIX DE VENTE OBSERVÉS (DVF) : logique PURE, testable sans les fichiers nationaux.
//
// Trois questions, trois fonctions :
//  1. Quelle mutation compte ?        `retenirMutation` : une vente d'UN seul logement (ef77afdd).
//  2. À quelle commune la rattacher ? `rattacheur`      : la commune ACTUELLE, au grain de l'index.
//  3. Quel prix publier ?             `resoudreAchat`   : médiane communale, sinon EPCI, sinon rien.
//
// LA GÉOGRAPHIE (constat FUT-109 §5.7). Jusqu'à la livraison d'avril 2026, geo-dvf rangeait une vente sous
// le code de la commune l'année de la vente : La Moncelle (absorbée par Bazeilles en 2024) gardait ses
// ventes, L'Oie (rétablie en 2024) n'en avait aucune. Depuis la livraison du 20/10/2026, Etalab retrouve la
// parcelle et la commune ACTUELLES par les coordonnées dans le cadastre le plus récent : `code_commune` est
// le code actuel (COG 2026), l'ancien passe dans `ancien_code_commune`. Les ventes de L'Oie de 2022 sont
// sous 85165, avec `ancien_code_commune` = 85084.
//
// Ce que la livraison ne règle pas, et que `rattacheur` traite :
//  - une ligne SANS coordonnées garde son code d'origine (parcelle introuvable dans le cadastre). Sous un
//    code disparu, on suit la chaîne des fusions du COG (`resolveurCog`, la règle unique du dépôt) ;
//  - sous le code d'une commune DÉCOUPÉE ensuite par un rétablissement, une vente non géocodée antérieure au
//    rétablissement peut être chez l'une ou l'autre : ABSTENTION, jamais attribuée à l'ancienne commune ;
//  - le référentiel de l'index est le COG 2025 ; la livraison est au COG 2026. Le script vérifie qu'aucun
//    mouvement territorial ne les sépare (vrai au 01/01/2026 : 34 875 communes identiques), et refuse
//    sinon plutôt que de mélanger deux géographies.

export const SEUIL = 10; // ventes par type pour publier une médiane à une maille
export const BORNES_EUR_M2 = [300, 20000]; // garde-fou aberrants, inchangé depuis juin 2026

/** Lit une ligne CSV geo-dvf. La plupart des lignes n'ont pas de guillemets ; quelques dizaines par an en ont
 *  (une virgule dans un nom de voie). Un `split(",")` naïf décalait leurs colonnes. */
export function lireLigneCsv(l) {
  if (!l.includes('"')) return l.split(",");
  const out = [];
  let cur = "", q = false;
  for (let i = 0; i < l.length; i++) {
    const ch = l[i];
    if (q) {
      if (ch === '"' && l[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export const COLONNES = {
  id: "id_mutation", date: "date_mutation", nature: "nature_mutation", valeur: "valeur_fonciere",
  code: "code_commune", ancien: "ancien_code_commune", type: "type_local", surface: "surface_reelle_bati",
  longitude: "longitude", parcelle: "id_parcelle", pieces: "nombre_pieces_principales", culture: "nature_culture",
  lot1: "lot1_numero", lot2: "lot2_numero", lot3: "lot3_numero", lot4: "lot4_numero", lot5: "lot5_numero",
};

/** Index des colonnes ; lève si une colonne attendue manque (changement de format non relu). */
export function indexColonnes(entete) {
  const I = {};
  for (const [k, nom] of Object.entries(COLONNES)) {
    const i = entete.indexOf(nom);
    if (i < 0) throw new Error(`colonne DVF absente : ${nom}`);
    I[k] = i;
  }
  return I;
}

/**
 * Les LOCAUX d'habitation distincts d'une mutation. DVF répète la ligne d'un local pour chaque nature de
 * culture de sa parcelle (« sols », « jardins », « terrains d'agrément ») : une maison sur un terrain à deux
 * cultures sort en deux lignes identiques. Le correctif ef77afdd comptait ces deux lignes comme deux
 * logements et écartait la vente (mesuré sur 2024 : 67 334 des 115 266 mutations « à plusieurs logements »).
 *
 * Deux lignes sont LE MÊME local quand elles ont le même type, la même surface, la même parcelle, le même
 * nombre de pièces et les mêmes numéros de lot, ET que leur répétition s'explique : cultures différentes, ou
 * même numéro de lot. Des lignes identiques en tout, sans lot (4 250 cas en 2024), peuvent être deux studios
 * jumeaux vendus ensemble : AMBIGU, la mutation reste écartée.
 * @returns {number | null} le nombre de locaux, ou null si ambigu
 */
export function locauxDistincts(logements, I) {
  const groupes = new Map();
  for (const c of logements) {
    const cle = [c[I.type], c[I.surface], c[I.parcelle], c[I.pieces], c[I.lot1], c[I.lot2], c[I.lot3], c[I.lot4], c[I.lot5]].join("|");
    if (!groupes.has(cle)) groupes.set(cle, []);
    groupes.get(cle).push(c);
  }
  for (const g of groupes.values()) {
    if (g.length === 1 || g[0][I.lot1]) continue;
    if (new Set(g.map((c) => c[I.culture])).size !== g.length) return null;
  }
  return groupes.size;
}

/**
 * Une mutation (toutes ses lignes) compte-t-elle pour le prix au m² ?
 * `valeur_fonciere` porte sur la MUTATION entière. Un logement + ses dépendances (garage, cave) : on garde,
 * c'est la convention du marché. PLUSIEURS logements : la valeur ne se rapporte à aucun m², on écarte.
 * `repetitions: "ef77afdd"` rejoue la règle d'avant FUT-138 (chaque ligne = un logement), pour la mesure.
 * @returns {{ type: "maison"|"appart", eurM2: number, code: string, ancien: string, date: string, geocodee: boolean } | { rejet: string }}
 */
export function retenirMutation(lignes, I, { repetitions = "local" } = {}) {
  if (lignes[0][I.nature] !== "Vente") return { rejet: "pas_une_vente" };
  const logements = lignes.filter((c) => c[I.type] === "Appartement" || c[I.type] === "Maison");
  if (logements.length === 0) return { rejet: "sans_logement" };
  const n = repetitions === "ef77afdd" ? logements.length : locauxDistincts(logements, I);
  if (n === null) return { rejet: "logements_indiscernables" };
  if (n > 1) return { rejet: "plusieurs_logements" };
  const seul = logements[0];
  const v = parseFloat(seul[I.valeur]), s = parseFloat(seul[I.surface]);
  if (!(v > 0) || !(s > 0)) return { rejet: "valeur_ou_surface" };
  const eurM2 = v / s;
  if (eurM2 < BORNES_EUR_M2[0] || eurM2 > BORNES_EUR_M2[1]) return { rejet: "aberrant" };
  return {
    type: seul[I.type] === "Maison" ? "maison" : "appart",
    eurM2,
    code: seul[I.code],
    ancien: seul[I.ancien] ?? "",
    date: seul[I.date],
    geocodee: Boolean(seul[I.longitude]),
  };
}

/**
 * Regroupe un flux de lignes (déjà découpées) en mutations. geo-dvf groupe les lignes d'une mutation ; on ne
 * s'y fie pas : une reprise non contiguë d'un identifiant déjà clos est comptée et écartée, jamais recomposée.
 */
export function grouperMutations(I) {
  const closes = new Set();
  let courante = null, lots = [];
  let reprises = 0;
  const vider = (emettre) => {
    if (!lots.length) return;
    const groupe = lots;
    lots = [];
    const id = groupe[0][I.id];
    if (closes.has(id)) { reprises++; return; }
    closes.add(id);
    emettre(groupe);
  };
  return {
    pousser(c, emettre) {
      if (c[I.id] !== courante) { vider(emettre); courante = c[I.id]; }
      lots.push(c);
    },
    finir(emettre) { vider(emettre); return { reprises }; },
  };
}

/**
 * Le rattachement d'une vente à une commune de l'index (géographie ACTUELLE).
 * @param {object} p
 * @param {Set<string>} p.referentiel codes des communes (et arrondissements) de l'index
 * @param {(code: string) => string | null} p.resoudre chaîne des fusions et changements de code (resolveurCog)
 * @param {Array<{MOD: string, DATE_EFF: string, TYPECOM_AV: string, COM_AV: string}>} p.mouvements COG
 * @returns {(v: { code: string, date: string, geocodee: boolean }) => { code: string } | { abstention: string }}
 */
export function rattacheur({ referentiel, resoudre, mouvements }) {
  // Commune d'origine d'un rétablissement -> date du découpage (la plus récente si plusieurs).
  const decoupee = new Map();
  for (const m of mouvements) {
    if (m.MOD !== "21" || m.TYPECOM_AV !== "COM") continue;
    if (!decoupee.has(m.COM_AV) || m.DATE_EFF > decoupee.get(m.COM_AV)) decoupee.set(m.COM_AV, m.DATE_EFF);
  }
  return ({ code, date, geocodee }) => {
    let cible = referentiel.has(code) ? code : resoudre(code);
    // hors_index : en pratique les DROM, que l'index (France métropolitaine) ne couvre pas.
    if (!cible || !referentiel.has(cible)) return { abstention: "hors_index" };
    // Une vente géocodée a été replacée par sa parcelle dans la commune actuelle : son code est sûr.
    // Une vente non géocodée garde son code d'origine : s'il désigne un territoire découpé APRÈS la vente,
    // rien ne dit de quel côté elle était.
    if (!geocodee) {
      for (const k of new Set([code, cible])) {
        const d = decoupee.get(k);
        if (d && date < d) return { abstention: "retablissement_non_reparti" };
      }
    }
    return { code: cible };
  };
}

export const median = (a) => {
  if (!a.length) return null;
  const b = [...a].sort((x, y) => x - y);
  const m = b.length >> 1;
  return Math.round(b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2);
};

/** Proportion des valeurs <= v dans un tableau trié. */
export function pctRank(sorted, v) {
  let lo = 0, hi = sorted.length;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (sorted[mid] <= v) lo = mid + 1; else hi = mid; }
  return sorted.length ? lo / sorted.length : null;
}

// 5 paliers par percentile national (déciles aux extrêmes, tiers au centre).
export function niveauFromPct(pct) {
  if (pct == null) return null;
  if (pct >= 0.9) return "tres_haut";
  if (pct >= 0.66) return "haut";
  if (pct >= 0.34) return "moyen"; // silence au comparateur
  if (pct >= 0.1) return "bas";
  return "tres_bas";
}

/**
 * La médiane publiée pour une commune et un type : la commune si elle a assez de ventes ; pour un
 * arrondissement de Paris, Lyon ou Marseille, sa ville entière (`achatVille`) ; sinon l'EPCI ; sinon rien.
 * La ville passe avant l'EPCI : l'EPCI de Paris est la Métropole du Grand Paris, dont les maisons
 * (4 929 €/m², surtout en banlieue) n'ont rien à voir avec celles de Paris (12 557 €/m²).
 * `ventes` est l'effectif de la maille retenue (limite affichée au lecteur).
 */
export function resoudreAchat(achat, epciDe, achatEpci, code, type, achatVille = null) {
  const own = achat[code]?.[type] || [];
  if (own.length >= SEUIL) return { med: median(own), maille: "commune", ventes: own.length };
  const va = achatVille?.[type] || [];
  if (va.length >= SEUIL) return { med: median(va), maille: "ville", ventes: va.length };
  const e = epciDe[code];
  const ea = e ? achatEpci[e]?.[type] || [] : [];
  if (ea.length >= SEUIL) return { med: median(ea), maille: "EPCI", ventes: ea.length };
  return { med: null, maille: "au-dela", ventes: 0 };
}

// Hors DVF : Alsace-Moselle (livre foncier) et Mayotte. Un « non disponible » qui a une raison.
export const HORS_DVF = new Set(["57", "67", "68", "976"]);
export const departementDe = (code) => (code.startsWith("97") ? code.slice(0, 3) : code.slice(0, 2));
