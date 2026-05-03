import "server-only";

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
    inferiorite_nationale_pct: number | null; // écart à la médiane nationale (négatif = sous la médiane)
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
  taux_motorisation: number | null;
  taux_transports_communs: number | null;
};

export type CommuneFullData = {
  commune: CommuneData;
  iris: IrisAggregate | null;
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

const SELECT_IRIS = [
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

function escapeQueryStringValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

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

async function fetchIrisRecords(communeName: string): Promise<IrisApiRecord[]> {
  const url = new URL(`${IRIS_DS}/lines`);
  url.searchParams.set("qs", `_contours_iris.nom_com:"${escapeQueryStringValue(communeName)}"`);
  url.searchParams.set("size", "200");
  url.searchParams.set("select", SELECT_IRIS);
  const res = await fetch(url.toString(), { next: { revalidate: 604800 } });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: IrisApiRecord[] };
  return json.results ?? [];
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
    taux_motorisation:     mean(rows.map((r) => r.taux_motor_glob)),
    taux_transports_communs: mean(rows.map((r) => r.taux_transportscommuns_glob)),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

async function fetchCommuneFullData(inseeCode: string): Promise<CommuneFullData | null> {
  const communeRecord = await fetchCommuneRecord(inseeCode);
  if (!communeRecord) return null;

  const commune = toCommuneData(communeRecord);
  const irisRows = await fetchIrisRecords(commune.nom);
  const iris = toIrisAggregate(irisRows);

  return { commune, iris };
}

export function getCommuneFullData(inseeCode: string): Promise<CommuneFullData | null> {
  return fetchCommuneFullData(inseeCode.trim()).catch(() => null);
}
