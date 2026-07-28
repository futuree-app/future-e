import "server-only";

import { irisQueryPrefix, keepIrisOfCommune, scopeFromPoint, type IrisScope } from "./iris-scope";

const COMMUNES_DS = "https://data.ademe.fr/data-fair/api/v1/datasets/8ggfo546-mtjxy4lbqxcl462";
const IRIS_DS     = "https://data.ademe.fr/data-fair/api/v1/datasets/jixoufr9qp0gko9xcqyzbr4a";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommuneData = {
  inseeCode: string;
  nom: string;
  population: number | null;
  vieillissement_pct: number | null;   // évolution annuelle des 65+ (2016-2022)
  logements: {
    vacants_2022: number | null;
    vacants_pct: number | null;
    sociaux_2023: number | null;
    sociaux_pct: number | null;
  };
  qualite_air: {
    pm25: number | null;
    pm10: number | null;
    no2: number | null;
    o3: number | null;
  };
  economie: {
    revenu_median: number | null;
    inferiorite_nationale_pct: number | null; // positif = commune SOUS la médiane nationale, négatif = au-dessus
  };
  sante: {
    acces_medecins: number | null;  // APL médecins généralistes
    eloignement_services_pct: number | null; // % pop à >20 min d'un service
  };
  territoire: {
    densite: number | null;
    incendies: number | null;
    taux_boisement: number | null;
  };
};

export type IrisAggregate = {
  iris_count: number;
  // Logement
  passoires_taux: number | null;      // % passoires thermiques (E+F+G)
  preca_energetique_pct: number | null; // % ménages en précarité énergétique logement
  taux_propriete: number | null;
  taux_location: number | null;
  taux_hlm: number | null;
  taux_suroccupation: number | null;
  // Mobilité
  // NOM CORRIGÉ le 28/07/2026 : ce champ mesure les DÉPLACEMENTS domicile-travail en véhicule
  // motorisé (ENL 2022), pas l'équipement automobile des ménages. L'appeler « motorisation » faisait
  // lire ~20 % là où un ménage sur deux possède une voiture à Saint-Denis (93). L'équipement, lui,
  // vit dans `iris-logement.ts` (INSEE RP 2022, `households_with_car_share`).
  part_deplacements_motorises: number | null;
  taux_transports_communs: number | null;
};

export type CommuneFullData = {
  commune: CommuneData;
  iris: IrisAggregate | null;
  /**
   * CE QUE `iris` DÉCRIT. Sans lui, une valeur sectorielle et une moyenne communale sont
   * indiscernables — et c'est exactement comme ça qu'on servait du communal pour du local.
   * `{ kind: "commune" }` quand aucun point n'a été fourni.
   */
  irisScope: IrisScope;
};

// ── Internal types ────────────────────────────────────────────────────────────

type CommuneApiRecord = {
  code_commune_insee: string;
  commune: string;
  population_totale_2021?: number | null;
  taux_devolution_annuel_des_65_ans_et_plus_20162022?: number | null;
  nombre_de_logements_vacants_2022?: number | null;
  part_des_logements_vacants_2022?: number | null;
  nombre_de_logements_sociaux_rpls_2023?: string | number | null;
  taux_de_logements_sociaux_percent?: number | null;
  moyenne_annuelle_de_concentration_de_pm25_ugm3?: number | null;
  moyenne_annuelle_de_concentration_de_pm10_ugm3?: number | null;
  moyenne_annuelle_de_concentration_de_no2_ugm3?: number | null;
  moyenne_annuelle_de_concentration_de_o3_ugm3?: number | null;
  mediane_du_revenu_disponible_par_uc_2021?: string | number | null;
  taux_dinferiorite_de_la_mediane_de_la_commune_par_rapport_a_la_mediane_nationale_percent?: number | null;
  apl_aux_medecins_generalistes?: number | null;
  part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services?: number | null;
  densite_de_population_2022?: number | null;
  nombre_dincendies?: number | null;
  tauxboisement?: number | null;
};

type IrisApiRecord = {
  iris?: string | number | null; // code IRIS 9 chiffres : ses 5 premiers = le code commune
  passoires_taux?: number | null;
  share_nrj_preca_log?: number | null;
  taux_prop_glob?: number | null;
  taux_loc_glob?: number | null;
  taux_hlm_glob?: number | null;
  taux_suroc?: number | null;
  taux_motor_glob?: number | null;
  taux_transportscommuns_glob?: number | null;
};

const SELECT_COMMUNE = [
  "code_commune_insee",
  "commune",
  "population_totale_2021",
  "taux_devolution_annuel_des_65_ans_et_plus_20162022",
  "nombre_de_logements_vacants_2022",
  "part_des_logements_vacants_2022",
  "nombre_de_logements_sociaux_rpls_2023",
  "taux_de_logements_sociaux_percent",
  "moyenne_annuelle_de_concentration_de_pm25_ugm3",
  "moyenne_annuelle_de_concentration_de_pm10_ugm3",
  "moyenne_annuelle_de_concentration_de_no2_ugm3",
  "moyenne_annuelle_de_concentration_de_o3_ugm3",
  "mediane_du_revenu_disponible_par_uc_2021",
  "taux_dinferiorite_de_la_mediane_de_la_commune_par_rapport_a_la_mediane_nationale_percent",
  "apl_aux_medecins_generalistes",
  "part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services",
  "densite_de_population_2022",
  "nombre_dincendies",
  "tauxboisement",
].join(",");

// ⚠ CE QUE CES INDICATEURS SONT VRAIMENT — relevé sur la fiche du dataset ADEME le 28/07/2026.
// Ils ne viennent PAS d'un recensement exhaustif à l'IRIS, mais de TROIS sources estimées :
//
//   • Enquête Nationale Logement (INSEE, 2022) — une enquête PAR SONDAGE (~40 000 logements pour toute
//     la France, contre 49 059 IRIS dans le dataset : moins d'un ménage enquêté par IRIS en moyenne).
//     Alimente le logement social, les propriétaires/locataires, et les « déplacements domicile-travail
//     en véhicule motorisé ». Les valeurs par IRIS sont donc des ESTIMATIONS modélisées, pas des mesures.
//   • GEODIP (ONPE, 2017) — précarité énergétique. Millésime vieux de huit ans.
//   • Performance énergétique du parc résidentiel (2022) — la fiche dit elle-même « une ESTIMATION des
//     nombres et taux de passoires ».
//
// CONSÉQUENCES, à tenir avant tout usage décisionnel :
//   1. `taux_motor_glob` n'est PAS le taux d'équipement automobile des ménages : c'est la part des
//      déplacements domicile-travail en véhicule motorisé — la même grandeur que la préférence
//      `faible_dependance_auto`, mais estimée, à une autre maille et un autre millésime. Les confondre
//      ferait passer une estimation pour un raffinement de l'indicateur communal.
//   2. 3,2 % des IRIS mesurés portent au moins une valeur à 0 % ou 100 % (échantillon exsangue ou
//      quartier réellement homogène : indiscernable ici). `men_total_weight` NE LES PRÉDIT PAS — leur
//      poids médian est 590 contre 977 en général, donc un seuil d'effectif n'en attrape que 4 sur 18.
//   3. Ces valeurs peuvent être AFFICHÉES avec leur provenance ; elles ne doivent pas FONDER un verdict
//      tant que la méthode d'estimation à l'IRIS n'est pas qualifiée.
const SELECT_IRIS = [
  "iris", // porte le code commune (5 premiers chiffres) : indispensable au filtre d'appartenance
  "passoires_taux",
  "share_nrj_preca_log",
  "taux_prop_glob",
  "taux_loc_glob",
  "taux_hlm_glob",
  "taux_suroc",
  "taux_motor_glob",
  "taux_transportscommuns_glob",
].join(",");

// ── Helpers ───────────────────────────────────────────────────────────────────

function mean(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v != null && !isNaN(v));
  return nums.length > 0 ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null;
}

function num(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return isNaN(n) ? null : n;
}

// ── Fetchers ──────────────────────────────────────────────────────────────────

async function fetchCommuneRecord(inseeCode: string): Promise<CommuneApiRecord | null> {
  const url = new URL(`${COMMUNES_DS}/lines`);
  url.searchParams.set("qs", `code_commune_insee:${inseeCode}`);
  url.searchParams.set("size", "1");
  url.searchParams.set("select", SELECT_COMMUNE);
  const res = await fetch(url.toString(), { next: { revalidate: 604800 } });
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: CommuneApiRecord[] };
  return json.results?.[0] ?? null;
}

const IRIS_PAGE_SIZE = 1000;
const IRIS_MAX_PAGES = 5; // 5 000 IRIS : Paris, la plus fournie, en compte 940

/**
 * Les IRIS d'une commune, par PRÉFIXE DE CODE puis filtre d'appartenance (cf. `iris-scope.ts`).
 *
 * TOUTE TRONCATURE EST UNE ERREUR, jamais une moyenne partielle. L'ancien `size=200` en dur coupait
 * Paris (940 IRIS) sans le dire : la moyenne portait alors sur un sous-ensemble arbitraire. Ici, si
 * la pagination n'a pas tout ramené, on rend `null` — l'appelant affiche une absence, pas un chiffre
 * faux. Une source qui n'a pas pu répondre entièrement n'a pas répondu.
 */
async function fetchIrisRecords(inseeCode: string): Promise<IrisApiRecord[] | null> {
  const prefix = irisQueryPrefix(inseeCode);
  const rows: IrisApiRecord[] = [];

  for (let page = 1; page <= IRIS_MAX_PAGES; page += 1) {
    const url = new URL(`${IRIS_DS}/lines`);
    url.searchParams.set("qs", `iris:${prefix}*`);
    url.searchParams.set("size", String(IRIS_PAGE_SIZE));
    url.searchParams.set("page", String(page));
    url.searchParams.set("select", SELECT_IRIS);
    const res = await fetch(url.toString(), { next: { revalidate: 604800 } });
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: IrisApiRecord[]; total?: number };
    const batch = json.results ?? [];
    rows.push(...batch);
    const total = typeof json.total === "number" ? json.total : rows.length;
    if (rows.length >= total) return keepIrisOfCommune(rows, inseeCode);
    if (batch.length === 0) return null; // plus rien ne vient alors que `total` annonce davantage
  }
  return null; // au-delà du plafond : on ne moyenne pas un échantillon
}

/**
 * L'IRIS QUI CONTIENT LE POINT. `geo_distance=lon,lat,0` fait le point-in-polygon côté data-fair :
 * aucune géométrie à rapatrier (Paris en compte 940). Vérifié le 28/07/2026 sur huit points —
 * centres de Paris/Lyon/Marseille, littoral, rural, et un point en mer qui rend bien 0 résultat.
 *
 * Rend `null` si le point n'est dans aucun IRIS, et lève si la source n'a pas répondu : l'appelant
 * doit pouvoir distinguer « aucun IRIS ici » de « on ne sait pas ».
 */
async function fetchIrisAtPoint(lat: number, lon: number): Promise<IrisApiRecord | null> {
  const url = new URL(`${IRIS_DS}/lines`);
  url.searchParams.set("geo_distance", `${lon},${lat},0`);
  url.searchParams.set("size", "1");
  url.searchParams.set("select", SELECT_IRIS);
  const res = await fetch(url.toString(), { next: { revalidate: 604800 } });
  if (!res.ok) throw new Error(`iris-point:${res.status}`);
  const json = (await res.json()) as { results?: IrisApiRecord[] };
  return json.results?.[0] ?? null;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function toCommuneData(r: CommuneApiRecord): CommuneData {
  return {
    inseeCode: r.code_commune_insee,
    nom:       r.commune,
    population: num(r.population_totale_2021),
    vieillissement_pct: num(r.taux_devolution_annuel_des_65_ans_et_plus_20162022),
    logements: {
      vacants_2022:  num(r.nombre_de_logements_vacants_2022),
      vacants_pct:   num(r.part_des_logements_vacants_2022),
      sociaux_2023:  num(r.nombre_de_logements_sociaux_rpls_2023),
      sociaux_pct:   num(r.taux_de_logements_sociaux_percent),
    },
    qualite_air: {
      pm25: num(r.moyenne_annuelle_de_concentration_de_pm25_ugm3),
      pm10: num(r.moyenne_annuelle_de_concentration_de_pm10_ugm3),
      no2:  num(r.moyenne_annuelle_de_concentration_de_no2_ugm3),
      o3:   num(r.moyenne_annuelle_de_concentration_de_o3_ugm3),
    },
    economie: {
      revenu_median:             num(r.mediane_du_revenu_disponible_par_uc_2021),
      inferiorite_nationale_pct: num(r.taux_dinferiorite_de_la_mediane_de_la_commune_par_rapport_a_la_mediane_nationale_percent),
    },
    sante: {
      acces_medecins:           num(r.apl_aux_medecins_generalistes),
      eloignement_services_pct: num(r.part_de_la_population_eloignee_de_plus_de_20_minutes_dau_moins_un_des_services),
    },
    territoire: {
      densite:         num(r.densite_de_population_2022),
      incendies:       num(r.nombre_dincendies),
      taux_boisement:  num(r.tauxboisement),
    },
  };
}

function toIrisAggregate(rows: IrisApiRecord[]): IrisAggregate | null {
  if (rows.length === 0) return null;
  return {
    iris_count:            rows.length,
    passoires_taux:        mean(rows.map((r) => r.passoires_taux)),
    preca_energetique_pct: mean(rows.map((r) => r.share_nrj_preca_log)),
    taux_propriete:        mean(rows.map((r) => r.taux_prop_glob)),
    taux_location:         mean(rows.map((r) => r.taux_loc_glob)),
    taux_hlm:              mean(rows.map((r) => r.taux_hlm_glob)),
    taux_suroccupation:    mean(rows.map((r) => r.taux_suroc)),
    part_deplacements_motorises: mean(rows.map((r) => r.taux_motor_glob)),
    taux_transports_communs: mean(rows.map((r) => r.taux_transportscommuns_glob)),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function fetchCommuneFullData(
  inseeCode: string,
  point?: { lat: number; lon: number } | null,
): Promise<CommuneFullData | null> {
  const communeRecord = await fetchCommuneRecord(inseeCode);
  if (!communeRecord) return null;
  const commune = toCommuneData(communeRecord);

  // UN POINT EST FOURNI : on tente l'IRIS qui le contient. C'est la seule lecture réellement
  // sectorielle ; la moyenne communale écrase des écarts de 0,3 % à 85,1 % (HLM, La Rochelle).
  if (point) {
    const row = await fetchIrisAtPoint(point.lat, point.lon).then(
      (r) => ({ ok: true as const, r }),
      () => ({ ok: false as const, r: null }),
    );
    const scope = scopeFromPoint(row.r, inseeCode, row.ok);
    if (scope.kind === "point" && row.r) {
      return { commune, iris: toIrisAggregate([row.r]), irisScope: scope };
    }
    // Aucun IRIS au point, désaccord de commune, ou source muette : on REPLIE sur la moyenne
    // communale — mais `irisScope` dira `commune`, donc l'appelant ne peut pas la présenter comme
    // locale. Un repli annoncé est du contexte ; un repli silencieux serait le défaut qu'on ferme.
  }

  const irisRows = await fetchIrisRecords(inseeCode);
  const iris = irisRows ? toIrisAggregate(irisRows) : null;
  return {
    commune,
    iris,
    irisScope: iris ? { kind: "commune", irisCount: iris.iris_count } : { kind: "unavailable" },
  };
}

/**
 * Les données d'une commune. `point` (facultatif) = les coordonnées d'une adresse : quand il est
 * fourni ET que l'IRIS se résout, `iris` décrit le SECTEUR et non la commune. Toujours lire
 * `irisScope` avant d'afficher une valeur : c'est lui qui dit à quelle échelle elle vaut.
 */
export function getCommuneFullData(
  inseeCode: string,
  point?: { lat: number; lon: number } | null,
): Promise<CommuneFullData | null> {
  return fetchCommuneFullData(inseeCode.trim(), point).catch(() => null);
}
