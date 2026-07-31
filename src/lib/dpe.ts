import "server-only";

const BASE = "https://data.ademe.fr/data-fair/api/v1/datasets";

const DS = {
  existant:  `${BASE}/dpe03existant`,
  neuf:      `${BASE}/dpe02neuf`,
  legacy:    `${BASE}/dpe-france`,    // avant juillet 2021
  tertiaire: `${BASE}/dpe01tertiaire`,
} as const;

// ── Legacy DPE (avant juillet 2021) ──────────────────────────────────────────
// Schéma différent : classe_consommation_energie, code_insee_commune_actualise

const SELECT_LEGACY = [
  "numero_dpe",
  "classe_consommation_energie",
  "classe_estimation_ges",
  "annee_construction",
  "tr002_type_batiment_description",
  "date_etablissement_dpe",
  "latitude",
  "longitude",
  "geo_adresse",
].join(",");

type LegacyApiRecord = {
  numero_dpe: string;
  classe_consommation_energie?: string | null;
  classe_estimation_ges?: string | null;
  annee_construction?: number | null;
  tr002_type_batiment_description?: string | null;
  date_etablissement_dpe?: string | null;
  geo_adresse?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

function toRecordLegacy(r: LegacyApiRecord): DpeRecord {
  return {
    id_dpe:             r.numero_dpe,
    date_dpe:           r.date_etablissement_dpe ?? null,
    id_ban:             null,
    adresse:            r.geo_adresse ?? null,
    etiquette_dpe:      (r.classe_consommation_energie as DpeLabel) ?? null,
    etiquette_ges:      (r.classe_estimation_ges as DpeLabel) ?? null,
    conso_ep_m2:        null, // non disponible dans le format pré-2021
    emission_ges_m2:    null,
    surface_m2:         null,
    annee_construction: r.annee_construction ?? null,
    type_batiment:      r.tr002_type_batiment_description ?? null,
    etage:              null,
    complement:         null,
    confort_ete: null, traversant: null, protection_solaire: null, ventilation: null,
    inertie: null, isolation_toiture: null, brasseur_air: null, isolation_murs: null,
    isolation_menuiseries: null, methode_dpe: null,
  };
}

// ── Types ────────────────────────────────────────────────────────────────────

// La logique pure d'attribution + les types de base vivent dans dpe-attribution.ts (sans
// server-only, car le client s'en sert). On les ré-exporte ici pour les consommateurs serveur.
export type { DpeLabel, DpeRecord, DpeAttribution } from "./dpe-attribution.ts";
export { dedupeAndCollapseDpe, dpeAttributionStatus } from "./dpe-attribution.ts";

import { LABEL_ORDER, dedupeAndCollapseDpe } from "./dpe-attribution.ts";
import type { DpeLabel, DpeRecord } from "./dpe-attribution.ts";

export type DpeCommuneSummary = {
  inseeCode: string;
  total: number;
  distribution: Record<DpeLabel, number>;
  passoiresPct: number;
  medianLabel: DpeLabel | null;
  mostRecent: DpeRecord | null;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function computeMedian(distribution: Record<DpeLabel, number>, total: number): DpeLabel | null {
  if (total === 0) return null;
  const mid = Math.floor(total / 2);
  let cumul = 0;
  for (const label of LABEL_ORDER) {
    cumul += distribution[label];
    if (cumul > mid) return label;
  }
  return null;
}

const SELECT_LOGEMENT = [
  "numero_dpe",
  "identifiant_ban",
  "etiquette_dpe",
  "etiquette_ges",
  "adresse_ban",
  "annee_construction",
  "surface_habitable_logement",
  "type_batiment",
  "numero_etage_appartement",
  "complement_adresse_logement",
  "date_etablissement_dpe",
  "conso_5_usages_par_m2_ep",
  "emission_ges_5_usages_par_m2",
  "indicateur_confort_ete",
  "logement_traversant",
  "protection_solaire_exterieure",
  "type_ventilation",
  "classe_inertie_batiment",
  "isolation_toiture",
  "presence_brasseur_air",
  "qualite_isolation_murs",
  "qualite_isolation_menuiseries",
  "methode_application_dpe",
  "_geopoint",
].join(",");

type ApiRecord = {
  numero_dpe: string;
  identifiant_ban?: string | null;
  etiquette_dpe?: string | null;
  etiquette_ges?: string | null;
  adresse_ban?: string | null;
  annee_construction?: number | null;
  surface_habitable_logement?: number | null;
  type_batiment?: string | null;
  numero_etage_appartement?: string | null;
  complement_adresse_logement?: string | null;
  date_etablissement_dpe?: string | null;
  conso_5_usages_par_m2_ep?: number | null;
  emission_ges_5_usages_par_m2?: number | null;
  indicateur_confort_ete?: string | null;
  logement_traversant?: string | number | null;
  protection_solaire_exterieure?: string | number | null;
  type_ventilation?: string | null;
  classe_inertie_batiment?: string | null;
  isolation_toiture?: string | null;
  presence_brasseur_air?: string | number | null;
  qualite_isolation_murs?: string | null;
  qualite_isolation_menuiseries?: string | null;
  methode_application_dpe?: string | null;
  _geopoint?: string | null;
};

// 0/1 ADEME -> booléen ; null si non renseigné. Tolère string ("1") ou number (1).
function toBool01(v: string | number | null | undefined): boolean | null {
  if (v == null || v === "") return null;
  return String(v) === "1";
}

function toConfort(v: string | null | undefined): DpeRecord["confort_ete"] {
  return v === "bon" || v === "moyen" || v === "insuffisant" ? v : null;
}

function toRecord(r: ApiRecord): DpeRecord {
  return {
    id_dpe:            r.numero_dpe,
    date_dpe:          r.date_etablissement_dpe ?? null,
    id_ban:            r.identifiant_ban ?? null,
    adresse:           r.adresse_ban ?? null,
    etiquette_dpe:     (r.etiquette_dpe as DpeLabel) ?? null,
    etiquette_ges:     (r.etiquette_ges as DpeLabel) ?? null,
    conso_ep_m2:       r.conso_5_usages_par_m2_ep ?? null,
    emission_ges_m2:   r.emission_ges_5_usages_par_m2 ?? null,
    surface_m2:        r.surface_habitable_logement ?? null,
    annee_construction: r.annee_construction ?? null,
    type_batiment:     r.type_batiment ?? null,
    etage:             r.numero_etage_appartement ?? null,
    complement:        r.complement_adresse_logement ?? null,
    confort_ete:          toConfort(r.indicateur_confort_ete),
    traversant:           toBool01(r.logement_traversant),
    protection_solaire:   toBool01(r.protection_solaire_exterieure),
    ventilation:          r.type_ventilation ?? null,
    inertie:              r.classe_inertie_batiment ?? null,
    isolation_toiture:    r.isolation_toiture ?? null,
    brasseur_air:         toBool01(r.presence_brasseur_air),
    isolation_murs:       r.qualite_isolation_murs ?? null,
    isolation_menuiseries: r.qualite_isolation_menuiseries ?? null,
    methode_dpe:          r.methode_application_dpe ?? null,
  };
}

async function fetchLines(dataset: string, params: Record<string, string>): Promise<ApiRecord[]> {
  const url = new URL(`${dataset}/lines`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = await res.json() as { results?: ApiRecord[] };
  return json.results ?? [];
}

async function fetchAgg(
  dataset: string,
  field: string,
  qs: string,
): Promise<Array<{ value: string; total: number }>> {
  const url = new URL(`${dataset}/values_agg`);
  url.searchParams.set("field", field);
  url.searchParams.set("qs", qs);
  url.searchParams.set("size", "10");
  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) return [];
  const json = await res.json() as { aggs?: Array<{ value: string; total: number }> };
  return (json.aggs ?? []).map(({ value, total }) => ({ value, total }));
}

// ── Public API ───────────────────────────────────────────────────────────────

// Renvoie TOUS les DPE rattachés à l'identifiant BAN (existant puis neuf), triés du plus
// récent au plus ancien, dédupliqués et collapsés (cf. dedupeAndCollapseDpe). Remplace le
// « plus récent unique » de getDpeByBanId côté module Logement.
export async function getDpeCandidatesByBanId(banId: string): Promise<DpeRecord[]> {
  const collected: DpeRecord[] = [];
  for (const dataset of [DS.existant, DS.neuf]) {
    const results = await fetchLines(dataset, {
      qs:     `identifiant_ban:"${banId}"`,
      size:   "30",
      sort:   "-date_etablissement_dpe",
      select: SELECT_LOGEMENT,
    });
    collected.push(...results.map(toRecord));
  }
  return dedupeAndCollapseDpe(collected)
    .sort((a, b) => (b.date_dpe ?? "").localeCompare(a.date_dpe ?? ""));
}

// Sonde de QUALIFICATION : dit si un diagnostic EXACT existe à cet identifiant BAN, et distingue
// l'absence de la panne. `fetchLines` rend `[]` dans les deux cas, ce qui ferait annoncer « aucun
// diagnostic » pendant un incident ADEME, alors que l'invariant central de la qualification est
// qu'une source en panne ne se présente jamais comme une absence de donnée.
//
// Elle ne cherche PAS par coordonnées : un DPE à 50 m est un candidat à confirmer (doctrine
// B2_NEARBY_UNCONFIRMED du socle thermique), et l'annoncer avant paiement promettrait une matière
// que le produit refuse d'affirmer après l'achat.
export async function probeDpeByBanId(
  banId: string,
): Promise<{ status: "found" | "none" | "unavailable"; count: number }> {
  let sawFailure = false;
  let count = 0;

  for (const dataset of [DS.existant, DS.neuf]) {
    const url = new URL(`${dataset}/lines`);
    url.searchParams.set("qs", `identifiant_ban:"${banId}"`);
    url.searchParams.set("size", "5");
    url.searchParams.set("select", "numero_dpe");
    try {
      // Timeout explicite : sans lui, une ADEME lente bloque une route PUBLIQUE jusqu'au timeout
      // de la plateforme, et le lecteur regarde un écran vide au lieu de lire un avertissement.
      const res = await fetch(url.toString(), {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        sawFailure = true;
        continue;
      }
      const json = (await res.json()) as { results?: unknown[] };
      count += json.results?.length ?? 0;
    } catch {
      sawFailure = true;
    }
  }

  if (count > 0) return { status: "found", count };
  // Une absence n'est affirmée que si les DEUX jeux ont RÉPONDU. Sinon on ne sait pas.
  return sawFailure ? { status: "unavailable", count: 0 } : { status: "none", count: 0 };
}

export async function getDpeByBanId(banId: string): Promise<DpeRecord | null> {
  for (const dataset of [DS.existant, DS.neuf]) {
    const results = await fetchLines(dataset, {
      qs:     `identifiant_ban:"${banId}"`,
      size:   "1",
      sort:   "-date_etablissement_dpe",
      select: SELECT_LOGEMENT,
    });
    if (results.length > 0) return toRecord(results[0]);
  }
  return null;
  // Note: dpe-france (pre-2021) n'a généralement pas d'identifiant_ban fiable
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// ATTENTION : CETTE FONCTION ATTRIBUE PAR COORDONNÉES, ET ELLE LIT UN JEU EXPIRÉ.
//
// Deux raisons de ne PAS l'appeler sur le chemin payant, vérifiées le 31/07/2026.
//
// 1. Un diagnostic à 50 m est celui d'un VOISIN. Mesuré sur 65 adresses : 57 fois une adresse
//    voisine, ZÉRO fois la même sous un autre identifiant. Le rayon ne répare pas une jointure, il
//    emprunte le diagnostic d'à côté — ce que la doctrine du produit interdit.
// 2. `DS.legacy` (« DPE Logements avant juillet 2021 », 10,7 millions de lignes) ne contient QUE
//    des diagnostics EXPIRÉS : ceux de 2013-2017 le sont depuis le 31/12/2022, ceux de 2018 à
//    juin 2021 depuis le 31/12/2024. Depuis le 1er janvier 2025, aucun DPE antérieur à juillet
//    2021 n'est valide. Ce jeu ne peut donc jamais servir à dire « le diagnostic de ce logement ».
//
// Elle n'est atteignable que SANS identifiant BAN (`georisques-logement`, branche `address.id`
// absente). Un dossier en porte toujours un, la colonne `ban_id` étant `not null` : la branche est
// morte sur le chemin payant, et elle doit le rester.
// ════════════════════════════════════════════════════════════════════════════════════════════
export async function getDpeByCoordinates(
  latitude: number,
  longitude: number,
  radiusM = 50,
): Promise<DpeRecord | null> {
  const deg  = radiusM / 111_000;
  const bbox = `${longitude - deg},${latitude - deg},${longitude + deg},${latitude + deg}`;

  for (const dataset of [DS.existant, DS.neuf, DS.legacy]) {
    const isLegacy = dataset === DS.legacy;
    const results  = await fetchLines(dataset, {
      bbox,
      size:   "10",
      sort:   "-date_etablissement_dpe",
      select: isLegacy ? SELECT_LEGACY : SELECT_LOGEMENT,
    });
    if (results.length === 0) continue;

    if (isLegacy) {
      // Legacy records use lat/lon fields, not _geopoint
      const legacyResults = results as unknown as LegacyApiRecord[];
      let best = legacyResults[0];
      let bestDist = Infinity;
      for (const r of legacyResults) {
        if (r.latitude == null || r.longitude == null) continue;
        const d = (r.latitude - latitude) ** 2 + (r.longitude - longitude) ** 2;
        if (d < bestDist) { bestDist = d; best = r; }
      }
      return toRecordLegacy(best);
    }

    let best = results[0];
    let bestDist = Infinity;
    for (const r of results) {
      if (!r._geopoint) continue;
      const [lat, lon] = r._geopoint.split(",").map(Number);
      const d = (lat - latitude) ** 2 + (lon - longitude) ** 2;
      if (d < bestDist) { bestDist = d; best = r; }
    }
    return toRecord(best);
  }
  return null;
}

async function getDpeCommuneSummary(inseeCode: string): Promise<DpeCommuneSummary | null> {
  const qs = `code_insee_ban:"${inseeCode}"`;

  const [aggs, recent] = await Promise.all([
    fetchAgg(DS.existant, "etiquette_dpe", qs),
    fetchLines(DS.existant, {
      qs,
      size:   "1",
      sort:   "-date_etablissement_dpe",
      select: SELECT_LOGEMENT,
    }),
  ]);

  if (aggs.length === 0 && recent.length === 0) return null;

  const distribution: Record<DpeLabel, number> = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0 };
  let total = 0;
  for (const { value, total: count } of aggs) {
    if (value in distribution) {
      distribution[value as DpeLabel] = count;
      total += count;
    }
  }

  const passoires    = distribution.E + distribution.F + distribution.G;
  const passoiresPct = total > 0 ? Math.round((passoires / total) * 100) : 0;

  return {
    inseeCode,
    total,
    distribution,
    passoiresPct,
    medianLabel: computeMedian(distribution, total),
    mostRecent:  recent[0] ? toRecord(recent[0]) : null,
  };
}

const communeCache = new Map<string, Promise<DpeCommuneSummary | null>>();

export function getDpeSummaryForCommune(inseeCode: string): Promise<DpeCommuneSummary | null> {
  const key = inseeCode.trim();
  if (!communeCache.has(key)) {
    communeCache.set(key, getDpeCommuneSummary(key).catch(() => null));
  }
  return communeCache.get(key)!;
}
