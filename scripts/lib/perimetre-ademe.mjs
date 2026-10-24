// FUT-109 · LE PÉRIMÈTRE DES INDICATEURS ADEME. Logique PURE (aucune I/O), testable sans l'index.
//
// LE CONSTAT. ADEME `data_communes` range sous un même code des sources publiées dans DEUX géographies. Ses
// lignes sont celles du 01/01/2024 (les communes absorbées le 01/01/2025 y ont encore leur ligne), mais une
// partie des champs vient de sources déjà passées au COG du 01/01/2025 :
//   - champs « 2025 » : vides pour toutes les communes absorbées, et calculés sur la commune FUSIONNÉE sous le
//     code de la commune nouvelle. Prouvé à chaque construction (scripts/population/construire-perimetre-ademe.mjs) :
//     population 2022 = somme exacte des populations légales 2022 des communes fusionnées, et densité 2022
//     dont la surface implicite (population ÷ densité) est la surface fusionnée, pas l'ancienne ;
//   - champs « 2024 » : renseignés pour les communes absorbées, donc publiés dans la géographie du 01/01/2024 :
//     sous le code d'une commune nouvelle de 2025, ils décrivent sa seule ancienne commune.
//
// LA RÈGLE, par commune du référentiel (data/population-referentiel-cog2025.json) dont le mouvement est
// postérieur au 01/01/2024 :
//   - territoire modifié (fusion, rétablissement) : les champs « 2024 » ne sont pas lus (abstention, `null`).
//     Aucune agrégation : un accès aux soins (APL), une concentration de polluants ou un indice de traitement
//     ne s'additionnent pas, et la méthode du producteur n'est pas publiée au niveau qui permettrait de la
//     refaire exactement ;
//   - code modifié seul (transfert de chef-lieu) : même territoire. Les champs « 2024 » de l'ancien code sont
//     les siens, rattachés tels quels. Les champs « 2025 » manquent sous les deux codes (non publiés) ;
//   - les champs « 2025 » des communes fusionnées sont gardés : ils sont au bon périmètre.
// Une commune sans aucune ligne ADEME n'a pas de niveau de centralité : la clé `agri.equip` est retirée
// (non noté), car `null` y signifie « aucun centre d'équipements » (src/lib/centralite-services.ts).

export const GEOGRAPHIE_LIGNES = "2024-01-01";
export const GEOGRAPHIE_RECENTE = "2025-01-01";

// Les champs ADEME que lisent l'index et l'application. `index` : chemin dans une commune de l'index, `pct` :
// percentile national associé (vivpct), `entier` : niveau « 3 - Centre structurant… » lu comme 3.
export const CHAMPS = [
  { source: "apl_aux_medecins_generalistes", index: ["viv", "apl"], pct: true },
  { source: "moyenne_annuelle_de_concentration_de_pm25_ugm3", index: ["viv", "pm25"], pct: true },
  { source: "moyenne_annuelle_de_concentration_de_no2_ugm3", index: ["viv", "no2"], pct: true },
  { source: "part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services", index: ["viv", "eloignement"], pct: true },
  { source: "ift_t", index: ["agri", "ift_t"] },
  { source: "ift_h", index: ["agri", "ift_h"] },
  { source: "p_sau", index: ["agri", "p_sau"] },
  { source: "p_bio", index: ["agri", "p_bio"] },
  { source: "niveau_de_centres_dequipements_et_de_services_des_communes_2021", index: ["agri", "equip"], entier: true },
  { source: "densite_de_population_2022", index: ["densite"] },
  { source: "taux_de_logements_sociaux_percent", index: ["hlm_pct"] },
  { source: "nombre_de_logements_sociaux_rpls_2023", index: ["hlm_nb"] },
  // Lus en direct par src/lib/commune-data.ts.
  { source: "taux_devolution_annuel_des_65_ans_et_plus_20162022" },
  { source: "nombre_de_logements_vacants_2022" },
  { source: "part_des_logements_vacants_2022" },
  { source: "moyenne_annuelle_de_concentration_de_pm10_ugm3" },
  { source: "moyenne_annuelle_de_concentration_de_o3_ugm3" },
  { source: "mediane_du_revenu_disponible_par_uc_2021" },
  { source: "taux_dinferiorite_de_la_mediane_de_la_commune_par_rapport_a_la_mediane_nationale_percent" },
  { source: "nombre_dincendies" },
  { source: "tauxboisement" },
  // Preuves.
  { source: "population_totale_2021" },
  { source: "population_au_dernier_recensement_2022" },
  { source: "surfcom2024" },
];

// Une cellule vide est une absence : `Number("")` vaudrait 0.
export const valeur = (v, entier = false) => {
  if (v == null || String(v).trim() === "") return null;
  if (entier) return parseInt(String(v), 10) || null;
  return Number.isNaN(Number(v)) ? null : Number(v);
};

const posterieur = (r) => r.mouvements.some((m) => m.date > GEOGRAPHIE_LIGNES);

/** Les fusions postérieures à la géographie des lignes : { code de la commune nouvelle: codes absorbés }. */
export function fusionsPosterieures(referentiel) {
  return Object.fromEntries(Object.entries(referentiel)
    .filter(([, r]) => r.motif === "territoire_modifie" && !r.retablissement && posterieur(r))
    .map(([k, r]) => [k, r.codesRepris]));
}

/**
 * La géographie de chaque champ, lue sur les communes absorbées après le 01/01/2024, rapportée au taux de
 * remplissage national du champ (un champ clairsemé est vide pour beaucoup de communes, absorbées ou non) :
 *   - les communes absorbées sont renseignées au moins moitié autant qu'ailleurs : la source les publie encore,
 *     elle est dans la géographie des lignes ;
 *   - aucune ne l'est alors qu'on en attendrait au moins cinq, et les communes nouvelles le sont : la source est
 *     passée au COG 2025 ;
 *   - entre les deux : indécidable, jamais deviné.
 */
export function classerChamps(lignes, referentiel, champs = CHAMPS) {
  const parCode = new Map(lignes.map((l) => [l.code_commune_insee, l]));
  const fusions = fusionsPosterieures(referentiel);
  const nouvelles = Object.keys(fusions);
  const absorbees = Object.values(fusions).flat();
  const plein = (v) => v != null && String(v).trim() !== "";
  const out = {};
  for (const { source } of champs) {
    const renseigne = (code) => plein(parCode.get(code)?.[source]);
    const a = absorbees.filter(renseigne).length;
    const n = nouvelles.filter(renseigne).length;
    const taux = lignes.filter((l) => plein(l[source])).length / lignes.length;
    const attendu = taux * absorbees.length;
    let geographie = null;
    if (a > 0 && a >= 0.5 * attendu) geographie = GEOGRAPHIE_LIGNES;
    else if (a === 0 && attendu >= 5 && n >= 0.9 * taux * nouvelles.length) geographie = GEOGRAPHIE_RECENTE;
    out[source] = { geographie, absorbees: `${a}/${absorbees.length}`, nouvelles: `${n}/${nouvelles.length}`, remplissage: Number(taux.toFixed(3)) };
  }
  return out;
}

/**
 * Le traitement de chaque commune du référentiel au mouvement postérieur à la géographie des lignes :
 * abstention sur les champs 2024 (territoire modifié), ou rattachement de l'ancien code (code modifié seul).
 */
export function traitements(referentiel, lignes, geographies) {
  const parCode = new Map(lignes.map((l) => [l.code_commune_insee, l]));
  const anciens = CHAMPS.filter((c) => geographies[c.source]?.geographie === GEOGRAPHIE_LIGNES);
  const out = {};
  for (const [k, r] of Object.entries(referentiel)) {
    if (!posterieur(r)) continue;
    const ligne = parCode.has(k);
    if (r.motif === "code_modifie") {
      if (r.codesRepris.length !== 1) throw new Error(`${k} : un changement de code doit reprendre un seul code`);
      const depuis = r.codesRepris[0];
      const l = parCode.get(depuis);
      if (!l) throw new Error(`${k} : ancien code ${depuis} absent d'ADEME`);
      out[k] = {
        traitement: "rattachement", depuis, ligne,
        valeurs: Object.fromEntries(anciens.filter((c) => c.index).map((c) => [c.source, valeur(l[c.source], c.entier)])),
      };
    } else {
      out[k] = { traitement: "abstention", ligne };
    }
  }
  return out;
}

const lire = (c, chemin) => chemin.reduce((o, p) => (o == null ? undefined : o[p]), c);
function ecrire(c, chemin, v) {
  let o = c;
  for (const p of chemin.slice(0, -1)) o = o[p] ??= {};
  o[chemin.at(-1)] = v;
}

// Percentile national, à l'identique de build-comparateur-index.mjs (borne inférieure, arrondi).
function percentile(tries, v) {
  const n = tries.length;
  if (n <= 1) return 50;
  let lo = 0, hi = n;
  while (lo < hi) { const m = (lo + hi) >> 1; if (tries[m] < v) lo = m + 1; else hi = m; }
  return Math.round((lo / (n - 1)) * 100);
}

/**
 * Applique `perimetre` (data/perimetre-ademe-cog2025.json) aux communes de l'index, en place. Idempotent.
 * Le percentile d'une valeur rattachée se lit dans la distribution des AUTRES communes, inchangée : aucune
 * commune hors du référentiel ne bouge.
 */
export function appliquerPerimetre(communes, perimetre, pressionAgricole) {
  const anciens = CHAMPS.filter((c) => c.index && perimetre.champs[c.source]?.geographie === GEOGRAPHIE_LIGNES);
  const vises = new Set(Object.keys(perimetre.communes));
  const distributions = {};
  for (const c of anciens.filter((x) => x.pct)) {
    distributions[c.source] = communes.filter((x) => !vises.has(x.insee)).map((x) => lire(x, c.index)).filter((v) => v != null).sort((a, b) => a - b);
  }
  let abstentions = 0, rattachements = 0;
  for (const c of communes) {
    const t = perimetre.communes[c.insee];
    if (!t) continue;
    for (const champ of anciens) {
      const v = t.traitement === "rattachement" ? t.valeurs[champ.source] ?? null : null;
      if (champ.index[0] === "hlm_pct" && !("hlm_pct" in c) && v == null) continue; // pas encore porté (populate-hlm)
      ecrire(c, champ.index, v);
      if (champ.pct) ecrire(c, ["vivpct", champ.index[1]], v == null ? null : percentile(distributions[champ.source], v));
    }
    if ("pression_agricole" in c || c.agri) c.pression_agricole = pressionAgricole(c.agri?.ift_t ?? null, c.agri?.p_sau ?? null);
    if (!t.ligne && c.agri) delete c.agri.equip;
    if (t.traitement === "rattachement") rattachements++; else abstentions++;
  }
  return { abstentions, rattachements };
}
