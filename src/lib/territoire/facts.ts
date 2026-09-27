// ════════════════════════════════════════════════════════════════════════════════════════════
// LE REGISTRE DES FAITS TERRITOIRE (FUT-6, 28/09/2026).
//
// Construit le `FactsSnapshot` de l'écran /rapport/quartier : une seule photo, que les cartes
// affichent et dont la synthèse reçoit une projection. Pur : il REÇOIT les sources déjà lues
// (cf. src/lib/server/territoire-snapshot.ts), il ne va jamais les chercher.
//
// AUCUN NOUVEAU SEUIL ICI. Les quatre règles déterministes reprennent, à l'identique, des grilles
// qui existaient déjà dans le code (inventaire : docs/audits/2026-09-27-fut6-cartographie-territoire.md,
// section 3). Ce qui change : elles vivent en un seul endroit, versionnées, et toutes les surfaces
// les lisent au lieu de recopier leur propre variante.
// ════════════════════════════════════════════════════════════════════════════════════════════

import type {
  CardPolicy, DerivedFact, Fact, FactScale, FactSource, FactStatus, FactsSnapshot, SynthesisPolicy,
} from "../facts/contract.ts";
import type { GeorisquesSummary, GasparCatnatSummary } from "../georisques.ts";
import type { VigieauSummary } from "../vigieau.ts";
import type { EaufranceSummary } from "../eaufrance.ts";
import type { LittoralSummary } from "../littoral.ts";
import type { Era5Trend } from "../era5-trend.ts";
import type { CatnatInondation } from "../decision/catnat-evidence.ts";
import type { TerritoryType } from "../territory-mood.ts";

/** Version du registre et de ses règles. La monter invalide les snapshots, donc les synthèses. */
export const TERRITOIRE_REGISTRY_VERSION = "territoire-facts@1";

// ── Les entrées : ce que le chargeur serveur a lu, UNE fois ─────────────────────────────────

export type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;

/** Le sous-ensemble de l'entrée d'index que Territoire lit. Tout est nullable : absent ≠ zéro. */
export type TerritoireIndexEntry = {
  population: number | null;
  densite: number | null;
  distance_cote_km: number | null;
  relief_proximite: number | null;
  altitude: number | null;
  nature: {
    brut_pct: number | null;
    radius_pct: number | null;
    composition: Record<string, number> | null;
  } | null;
  demographie: {
    taux_total: number | null;
    part_nouveaux: number | null;
    recit: string | null;
  } | null;
};

export type UrbanRole = { role: "isolee" | "pole" | "agglo"; uuLabel: string | null; uuPop: number | null };

export type TerritoireInputs = {
  insee: string;
  communeName: string;
  entry: TerritoireIndexEntry | null;
  urbanRole: UrbanRole | null;
  typology: { type: TerritoryType; label: string };
  ademe: {
    densite: number | null;
    taux_boisement: number | null;
    population: number | null;
    vieillissement_pct: number | null;
    vacants_pct: number | null;
  } | null;
  scenarios: GwlScenarios | null;
  georisques: GeorisquesSummary | null;
  catnat: GasparCatnatSummary | null;
  catnatInondationIndex: CatnatInondation | null;
  vigieau: VigieauSummary | null;
  drought: NonNullable<EaufranceSummary["drought"]> | null;
  littoral: LittoralSummary | null;
  era5: Era5Trend | null;
  saisonnalitePct: number | null;
  distinctiveTrait: string | null;
};

// ── Les règles déterministes (grilles EXISTANTES, reprises telles quelles) ──────────────────

export type LandCategory = "mostly_built" | "high_natural" | "agricultural" | "low_natural" | "mixed";

export const LAND_LABEL: Record<LandCategory, string> = {
  mostly_built: "Majoritairement urbanisé",
  high_natural: "Forte présence naturelle",
  agricultural: "À dominante agricole",
  low_natural: "Faible présence d'espaces naturels",
  mixed: "Occupation mixte",
};

/**
 * D4 : LA grille du couvert, celle de la face de carte (ex-`couvertHeadline`, territory-identity.ts).
 * La carte d'identité (grille à 40 %) et le volet (75 / 50 / 25) la reprennent désormais : il n'y a
 * plus trois lectures du même chiffre sur un écran.
 */
export function landCategory(naturalPct: number, composition: Record<string, number>): LandCategory {
  const urb = composition.artificialise ?? 0;
  const agri = composition.agricole ?? 0;
  if (urb >= 50) return "mostly_built";
  if (naturalPct >= 45) return "high_natural";
  if (agri >= 50) return "agricultural";
  if (naturalPct < 20) return "low_natural";
  return "mixed";
}

export type DensityCategory = "dense" | "intermediate" | "low";

export const DENSITY_LABEL: Record<DensityCategory, string> = {
  dense: "Commune dense",
  intermediate: "Densité intermédiaire",
  low: "Commune peu dense",
};

/** D3 : grille existante de la carte d'identité (1 500 / 150 hab/km²). */
export function densityCategory(d: number): DensityCategory {
  return d >= 1500 ? "dense" : d >= 150 ? "intermediate" : "low";
}

/**
 * D7 : la démographie DÉCRIT. Les codes viennent de `scripts/populate-demographie.py` (±0,15 %/an =
 * stable ; arrivants ≥ tercile haut national). « attire de nouveaux arrivants » affirmait une cause
 * qu'aucune mesure n'établit : la phrase dit désormais ce qui est observé.
 */
export type DemographyCode = "gagne_attire" | "gagne_sans_renouv" | "stable_renouv" | "stable" | "perd";

export const DEMOGRAPHY_STATUS: Record<DemographyCode, string> = {
  gagne_attire: "Croissance récente",
  gagne_sans_renouv: "Croissance récente",
  stable_renouv: "Population stable",
  stable: "Population stable",
  perd: "Population en recul",
};

export const DEMOGRAPHY_PHRASE: Record<DemographyCode, string> = {
  gagne_attire: "gagne des habitants, avec une part d'arrivants récents parmi les plus élevées",
  gagne_sans_renouv: "gagne des habitants, sans part d'arrivants récents particulièrement élevée",
  stable_renouv: "population globalement stable, avec une part d'arrivants récents parmi les plus élevées",
  stable: "population globalement stable",
  perd: "perd des habitants",
};

export function isDemographyCode(v: unknown): v is DemographyCode {
  return typeof v === "string" && v in DEMOGRAPHY_STATUS;
}

export type SeasonalityCategory = "high" | "marked" | "moderate" | "low";

export const SEASONALITY_LABEL: Record<SeasonalityCategory, string> = {
  high: "Forte",
  marked: "Marquée",
  moderate: "Modérée",
  low: "Faible",
};

/** Grille existante de la carte « Résidences secondaires » (40 / 20 / 8 %). */
export function seasonalityCategory(pct: number): SeasonalityCategory {
  return pct >= 40 ? "high" : pct >= 20 ? "marked" : pct >= 8 ? "moderate" : "low";
}

// ── Construction ─────────────────────────────────────────────────────────────────────────────

type FactSpec<V> = {
  key: string;
  value: V | null | undefined;
  unit?: string | null;
  scale: FactScale;
  source: FactSource;
  vintage?: string | null;
  observedAt?: string | null;
  status?: FactStatus;
  limits?: string;
  card: CardPolicy;
  synthesis: SynthesisPolicy;
};

function fact<V>(spec: FactSpec<V>): Fact<V> {
  const value = spec.value ?? null;
  const out: Fact<V> = {
    key: spec.key,
    value,
    unit: spec.unit ?? null,
    scale: spec.scale,
    source: spec.source,
    vintage: spec.vintage ?? null,
    observedAt: spec.observedAt ?? null,
    status: spec.status ?? (value == null ? "missing" : "ok"),
    card: spec.card,
    synthesis: spec.synthesis,
  };
  if (spec.limits) out.limits = spec.limits;
  return out;
}

const INCLUDE: SynthesisPolicy = { include: true };
const exclude = (reason: string): SynthesisPolicy => ({ include: false, reason });
const card = (id: string): CardPolicy => ({ card: id });
const noCard = (reason: "redundant" | "context_only" | "too_granular" | "low_standalone_value" | "other", note: string): CardPolicy =>
  ({ noCard: { reason, note } });

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function buildTerritoireSnapshot(i: TerritoireInputs, builtAt: string): FactsSnapshot {
  const e = i.entry;
  const composition = e?.nature?.composition ?? null;
  const naturalPct = num(e?.nature?.brut_pct);
  const hasOso = composition != null && naturalPct != null;
  const density = num(e?.densite) ?? num(i.ademe?.densite);
  const demo = e?.demographie ?? null;

  // VigiEau : la date de consultation sort de la valeur pour aller dans `observedAt`, hors empreinte.
  // La carte la remet en place à l'affichage (elle la verbalise : « État consulté le … »).
  const { consultedAt, ...vigieauValue } = i.vigieau ?? ({} as Partial<VigieauSummary>);

  const facts: Fact[] = [
    fact({
      key: "place.name", value: i.communeName, scale: "commune",
      source: { producer: "INSEE", dataset: "Code officiel géographique", field: "nom" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.population", value: num(e?.population) ?? num(i.ademe?.population), unit: "habitants",
      scale: "commune", vintage: "2021",
      source: { producer: "INSEE", dataset: "Recensement de la population", field: "population" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.density", value: density, unit: "hab/km²", scale: "commune", vintage: "2022",
      source: { producer: "INSEE via ADEME", dataset: "Données communales", field: "densite_de_population_2022" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.typology", value: i.typology.label, scale: "department",
      source: { producer: "futur•e", dataset: "Catégories par département", field: "deriveCategories" },
      limits: "Attribuée par département : toute commune d'un département côtier reçoit un type littoral (FUT-33).",
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.urban_role", value: i.urbanRole, scale: "urban_unit", vintage: "2020",
      source: { producer: "INSEE", dataset: "Unités urbaines 2020", field: "uu" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.position",
      value: e ? { distanceCoteKm: num(e.distance_cote_km), reliefProximite: num(e.relief_proximite), altitude: num(e.altitude) } : null,
      scale: "point",
      source: { producer: "futur•e", dataset: "Index du comparateur", field: "distance_cote_km, relief_proximite, altitude" },
      limits: "La distance à la côte est approximée par une liste de villes côtières (FUT-33).",
      card: card("identity"),
      synthesis: exclude("Proxy littoral non fiable (Châtelaillon-Plage à « 11 km » de la mer) : traité dans FUT-33."),
    }),
    fact({
      key: "land.composition", value: composition, unit: "%", scale: "commune", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.composition" },
      limits: "Occupation du sol vue par satellite ; « urbanisé » inclut routes et surfaces bâties.",
      card: card("nature.green_spaces"), synthesis: INCLUDE,
    }),
    fact({
      key: "land.natural_share", value: naturalPct, unit: "%", scale: "commune", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.brut_pct" },
      limits: "Naturel élargi : forêts, prairies, landes et pelouses, roche et dunes, eau. Les cultures n'en font pas partie.",
      card: card("nature.green_spaces"), synthesis: INCLUDE,
    }),
    fact({
      key: "land.natural_share_15km", value: num(e?.nature?.radius_pct), unit: "%", scale: "radius_15km", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.radius_pct" },
      limits: "Mesuré dans un rayon de 15 km, pas sur la commune.",
      card: card("nature.green_spaces"),
      synthesis: exclude("Autre échelle que la commune : sa lecture comme « urbanisation » a produit la contradiction de Châtelaillon."),
    }),
    fact({
      key: "land.forest_ademe", value: num(i.ademe?.taux_boisement), unit: "%", scale: "commune", vintage: null,
      source: { producer: "ADEME", dataset: "Données communales", field: "tauxboisement" },
      limits: "Définition et millésime non documentés : ne se compare pas à la forêt d'OSO.",
      card: hasOso
        ? noCard("redundant", "La carte « Espaces naturels » (OSO) porte la lecture canonique du couvert (D1).")
        : card("nature.forest_cover"),
      synthesis: hasOso
        ? exclude("D1 : OSO est canonique ; le boisement ADEME concurrençait sa lecture (1,5 % contre 10,3 % de forêt à Châtelaillon).")
        : INCLUDE,
    }),
    fact({
      key: "demography.trend",
      value: demo ? { annualPct: num(demo.taux_total), newcomersPct: num(demo.part_nouveaux), code: demo.recit ?? null } : null,
      unit: "%", scale: "commune", vintage: "2015-2021",
      source: { producer: "INSEE", dataset: "Évolution et structure de la population 2021", field: "demographie" },
      limits: "Arrivants = personnes qui habitaient ailleurs un an avant le recensement. Aucune mesure d'attractivité.",
      card: card("territory.demography"), synthesis: INCLUDE,
    }),
    fact({
      key: "demography.ageing_65", value: num(i.ademe?.vieillissement_pct), unit: "%/an", scale: "commune", vintage: "2016-2022",
      source: { producer: "INSEE via ADEME", dataset: "Données communales", field: "taux_devolution_annuel_des_65_ans_et_plus_20162022" },
      limits: "Évolution annuelle du NOMBRE de 65 ans et plus, pas leur part dans la population.",
      card: noCard("other", "Rôle produit en cours de clarification (FUT-35)."),
      synthesis: exclude("D6 : champ ambigu (évolution lue comme une part) ; son rôle est traité dans FUT-35."),
    }),
    fact({
      key: "housing.secondary_share", value: i.saisonnalitePct, unit: "%", scale: "commune", vintage: "2022",
      source: { producer: "INSEE", dataset: "Base communale logement 2022", field: "residences-secondaires" },
      card: card("territory.secondary_homes"), synthesis: INCLUDE,
    }),
    fact({
      key: "housing.vacancy_share", value: num(i.ademe?.vacants_pct), unit: "%", scale: "commune", vintage: "2022",
      source: { producer: "INSEE via ADEME", dataset: "Données communales", field: "part_des_logements_vacants_2022" },
      limits: "Un seul indicateur : il ne mesure ni la tension du marché ni l'attractivité (D5).",
      card: card("territory.vacancy"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.distinctive_trait", value: i.distinctiveTrait, scale: "radius_15km",
      source: { producer: "futur•e", dataset: "Percentiles nationaux de l'index", field: "getCommuneDistinctive" },
      limits: "Le trait « urbanisées » lit la part naturelle dans 15 km, cultures comptées comme non naturelles.",
      card: noCard("other", "Trait d'identité du comparateur, jamais affiché sur Territoire."),
      synthesis: exclude("D2 : change d'échelle et de définition ; ne prouve pas une urbanisation communale (FUT-34)."),
    }),
    fact({
      key: "climate.scenarios", value: i.scenarios, scale: "commune", vintage: "DRIAS-TRACC, référence 1976-2005",
      source: { producer: "Météo-France", dataset: "DRIAS-TRACC", field: "drias.commune.s" },
      card: card("climate.*"), synthesis: INCLUDE,
    }),
    fact({
      key: "climate.era5_trend", value: i.era5, unit: "°C", scale: "commune",
      vintage: i.era5 ? `1961-1990 → ${i.era5.data_through_year}` : null,
      source: { producer: "Copernicus", dataset: "ERA5-Land", field: "commune_era5_trend" },
      card: card("climate.mean_temperature"), synthesis: INCLUDE,
    }),
    fact({
      key: "water.restrictions",
      value: i.vigieau ? vigieauValue : null,
      scale: "commune", observedAt: consultedAt ?? null,
      status: !i.vigieau ? "missing" : i.vigieau.status === "unavailable" ? "source_unavailable" : "ok",
      source: { producer: "Ministère de la Transition écologique", dataset: "VigiEau", field: "arrêtés de restriction" },
      card: card("climate.drought"), synthesis: INCLUDE,
    }),
    fact({
      key: "water.river_drought", value: i.drought, scale: "point",
      source: { producer: "OFB", dataset: "ONDE (Hub'Eau)", field: "observations d'écoulement" },
      card: card("climate.drought"), synthesis: INCLUDE,
    }),
    fact({
      key: "risk.georisques",
      value: i.georisques ? { flood: i.georisques.flags.flood, marineSubmersion: i.georisques.flags.marineSubmersion } : null,
      scale: "commune",
      source: { producer: "Géorisques", dataset: "Risques recensés sur la commune", field: "flags" },
      limits: "Échelle communale : un risque recensé ne dit pas quelle adresse est touchée.",
      card: card("risk.flooding"), synthesis: INCLUDE,
    }),
    fact({
      key: "risk.catnat", value: i.catnat, scale: "commune",
      source: { producer: "Géorisques", dataset: "Base GASPAR (arrêtés CatNat)", field: "catnat" },
      card: card("risk.catnat"), synthesis: INCLUDE,
    }),
    fact({
      key: "risk.catnat_flood_index", value: i.catnatInondationIndex, scale: "commune",
      source: { producer: "Géorisques", dataset: "Base GASPAR, compte de l'index", field: "inondation.catnat" },
      card: card("risk.catnat"),
      synthesis: exclude("Doublon du relevé GASPAR direct (tous risques), qui porte déjà les inondations reconnues."),
    }),
    fact({
      key: "coast.littoral", value: i.littoral, scale: "commune",
      source: { producer: "Cerema", dataset: "Indicateur national de l'érosion côtière ; loi Climat et Résilience", field: "littoral" },
      card: card("coast.erosion"), synthesis: INCLUDE,
    }),
  ];

  const derived: DerivedFact[] = [];
  if (hasOso) {
    const c = landCategory(naturalPct!, composition!);
    derived.push({
      key: "land.category", value: c, label: LAND_LABEL[c], from: ["land.natural_share", "land.composition"],
      rule: "land-category@1", card: card("nature.green_spaces"), synthesis: INCLUDE,
    });
  }
  if (density != null) {
    const c = densityCategory(density);
    derived.push({
      key: "density.category", value: c, label: DENSITY_LABEL[c], from: ["place.density"],
      rule: "density-category@1", card: card("identity"), synthesis: INCLUDE,
    });
  }
  if (isDemographyCode(demo?.recit)) {
    derived.push({
      key: "demography.category", value: demo!.recit!, label: DEMOGRAPHY_STATUS[demo!.recit as DemographyCode],
      from: ["demography.trend"], rule: "demography-category@1",
      card: card("territory.demography"), synthesis: INCLUDE,
    });
  }
  if (i.saisonnalitePct != null) {
    const c = seasonalityCategory(i.saisonnalitePct);
    derived.push({
      key: "seasonality.category", value: c, label: SEASONALITY_LABEL[c], from: ["housing.secondary_share"],
      rule: "seasonality-category@1", card: card("territory.secondary_homes"), synthesis: INCLUDE,
    });
  }

  return {
    scope: { kind: "commune", id: i.insee },
    registryVersion: TERRITOIRE_REGISTRY_VERSION,
    builtAt,
    facts,
    derived,
  };
}
