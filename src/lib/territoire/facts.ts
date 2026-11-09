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
import type { RoleUrbain, RoleUrbainAncien } from "./statut-urbain.ts";
import type { VigieauSummary } from "../vigieau.ts";
import type { EaufranceSummary } from "../eaufrance.ts";
import type { LittoralSummary } from "../littoral.ts";
import type { Era5Trend } from "../era5-trend.ts";
import type { CatnatInondation } from "../decision/catnat-evidence.ts";
import type { TerritoryType } from "../territory-mood.ts";
import { millesimePopulation } from "../population-millesime.ts";
import { avecProvenances } from "./provenances.ts";
import { densiteInseeRetenue, type DensitePLM } from "./plm-densite.ts";

/**
 * Version du registre et de ses règles. La monter invalide les snapshots, donc les synthèses.
 * @2 (FUT-175) : les parts d'occupation du sol se lisent sur les TERRES, l'eau est un fait à part.
 */
export const TERRITOIRE_REGISTRY_VERSION = "territoire-facts@2";

// ── Les entrées : ce que le chargeur serveur a lu, UNE fois ─────────────────────────────────

export type GwlScenarios = Record<string, { h: string; v: Record<string, number> }>;

/** Le sous-ensemble de l'entrée d'index que Territoire lit. Tout est nullable : absent ≠ zéro. */
export type TerritoireIndexEntry = {
  population: number | null;
  densite: number | null;
  // FUT-33 : distance du point de référence au rivage marin (l'ancienne distance à des villes côtières est retirée).
  mer_centre_km: number | null;
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

// FUT-176 : le rôle suit le STATUT Insee (statut-urbain.ts), jamais l'absence d'un code ni le nom de l'agglomération.
// Un snapshot ancien peut encore porter « isolee » / « pole » / « agglo » : les lecteurs passent par
// `normaliserRoleUrbain`. `arrondissementDe` : la ville d'un arrondissement de Paris, Lyon ou Marseille (absent sinon).
export type UrbanRole = { role: RoleUrbain | RoleUrbainAncien; uuLabel: string | null; uuPop: number | null; arrondissementDe?: string };

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
  /**
   * FUT-160 · VRAI QUAND LA LECTURE A ÉCHOUÉ (Géorisques en panne). Le fait passe alors `source_unavailable`,
   * comme VigiEau, et plus `missing`. Absent ou faux : `null` reste `missing`, une donnée non collectée.
   */
  georisquesIndisponible?: boolean;
  catnatIndisponible?: boolean;
  catnatInondationIndex: CatnatInondation | null;
  vigieau: VigieauSummary | null;
  drought: NonNullable<EaufranceSummary["drought"]> | null;
  /** FUT-165 : la lecture de l'écoulement a échoué ; le fait passe `source_unavailable`, jamais « aucune observation ». */
  droughtIndisponible?: boolean;
  littoral: LittoralSummary | null;
  era5: Era5Trend | null;
  saisonnalitePct: number | null;
  distinctiveTrait: string | null;
  /**
   * FUT-179 : Paris, Lyon, Marseille et leurs arrondissements n'ont pas de densité ADEME. Celle-ci est recalculée
   * par l'Insee (population 2022 / superficie), sur le périmètre lu : la commune entière OU l'arrondissement, jamais
   * l'un pour l'autre. Elle n'est lue qu'à défaut de densité ADEME. Absent pour toute autre commune.
   */
  densiteInsee?: DensitePLM | null;
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

/** Les postes de `nature.composition` (index) qui couvrent des terres ; l'eau est le seul autre poste. */
export const LAND_KEYS = ["artificialise", "agricole", "foret", "prairies", "landes_pelouses", "mineral_dunes"] as const;

/** En deçà, les terres sont trop réduites pour qu'une part en soit lisible : aucune catégorie. */
export const MIN_LAND_PCT = 10;

export type LandShares = {
  /** Part du contour communal couverte d'eau (mer, lagune, étang, lac, cours d'eau), en %. */
  waterPct: number;
  /** Milieux naturels terrestres (forêts, prairies, landes et pelouses, roche et dunes), en % des terres. */
  naturalLandPct: number;
  /** Les six postes terrestres, en % des terres (somme ≈ 100, aux arrondis de l'index près). */
  composition: Record<string, number>;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Les postes naturels de l'index, eau comprise : `brut_pct` en est la somme, comptée sur les pixels. */
const NATURAL_KEYS = ["foret", "prairies", "landes_pelouses", "mineral_dunes", "eau"] as const;

/**
 * FUT-175 · TOLÉRANCES D'ARRONDI. L'index arrondit chaque poste et `brut_pct` au dixième (populate-nature.py),
 * soit 0,05 point d'écart au plus par valeur. Les sept postes somment donc à 100 ± 7 × 0,05 = 0,35 ; `brut_pct`
 * égale la somme des cinq postes naturels (eau comprise) à 6 × 0,05 = 0,30 près. Au-delà, ce n'est plus un
 * arrondi mais une contradiction. Mesuré sur l'index du 09/11/2026 : écarts maximaux de 0,2 dans les deux cas,
 * sur les 34 743 communes. Le millième absorbe le bruit flottant des sommes.
 */
export const OSO_SUM_TOLERANCE = 7 * 0.05 + 1e-3;
export const OSO_BRUT_TOLERANCE = 6 * 0.05 + 1e-3;

/**
 * FUT-175 : ce que couvrent les pourcentages OSO. Ils portent sur les pixels que la carte a classés (classes 1 à 23)
 * dans le contour administratif, pas sur toute la surface géographique : les pixels non classés, dont la part
 * n'est pas connue (raster non conservé), n'y figurent pas.
 */
export const OSO_COUVERTURE = "Parts calculées sur la surface que la carte OSO a classée dans le contour administratif ; les pixels non classés, dont la part n'est pas mesurée, n'y figurent pas.";

export type LandSharesReading =
  | { status: "ok"; shares: LandShares }
  | { status: "missing" }
  | { status: "inconsistent"; reason: string };

/**
 * FUT-175 : L'EAU N'EST NI UNE TERRE NI UN ESPACE NATUREL. L'index (scripts/populate-nature.py) rapporte
 * chaque poste aux pixels CLASSÉS du contour administratif (classes OSO 1 à 23 ; les autres valeurs, de part
 * inconnue, ne sont comptées nulle part), eau comprise, et compte l'eau dans `brut_pct`. Sète (50,6 % d'eau,
 * étang de Thau) y lisait « Forte présence naturelle » quand la moitié de ses terres est urbanisée. On retire
 * donc l'eau du dénominateur : chaque part est rapportée aux terres, soit `100 − eau` (les sept postes
 * partagent le même dénominateur de pixels).
 *
 * Le naturel terrestre part de `brut_pct` (compté sur les pixels, sans arrondi par poste), moins l'eau : c'est
 * la même définition qu'avant, l'eau en moins. Sans eau, rien ne bouge, pas même d'un dixième.
 *
 * Lecture refusée, jamais complétée :
 * - `missing` : composition ou `brut_pct` absent, ou un des sept postes manquant (absent ≠ zéro) ;
 * - `inconsistent` : une valeur hors de [0, 100], des postes qui ne somment pas à 100 aux arrondis près, un
 *   `brut_pct` qui contredit les postes naturels, ou des terres sous `MIN_LAND_PCT` (aucune commune
 *   aujourd'hui : 71,4 % d'eau au plus, à Paimbœuf). La raison est écrite dans le snapshot (`limits`).
 */
export function readLandShares(
  brutPct: number | null | undefined,
  composition: Record<string, number> | null | undefined,
): LandSharesReading {
  const present = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
  if (!composition || !present(brutPct)) return { status: "missing" };
  const keys = [...LAND_KEYS, "eau"] as const;
  if (!keys.every((k) => present(composition[k]))) return { status: "missing" };
  const horsBornes = [["brut_pct", brutPct] as const, ...keys.map((k) => [k, composition[k]] as const)]
    .find(([, v]) => v < 0 || v > 100);
  if (horsBornes) return { status: "inconsistent", reason: `${horsBornes[0]} hors de [0, 100] (${horsBornes[1]})` };
  const sum = keys.reduce((a, k) => a + composition[k], 0);
  if (Math.abs(sum - 100) > OSO_SUM_TOLERANCE) {
    return { status: "inconsistent", reason: `les sept postes somment à ${round1(sum)} %, pas à 100 %` };
  }
  const natural = NATURAL_KEYS.reduce((a, k) => a + composition[k], 0);
  if (Math.abs(brutPct - natural) > OSO_BRUT_TOLERANCE) {
    return { status: "inconsistent", reason: `brut_pct (${brutPct}) contredit les postes naturels et l'eau (${round1(natural)})` };
  }
  const water = composition.eau;
  const land = 100 - water;
  if (land < MIN_LAND_PCT) return { status: "inconsistent", reason: `terres trop réduites (${round1(land)} %) pour une part lisible` };
  const comp: Record<string, number> = {};
  for (const k of LAND_KEYS) comp[k] = round1((composition[k] * 100) / land);
  return {
    status: "ok",
    shares: {
      waterPct: round1(water),
      // `brut − eau` ne passe sous zéro que d'un arrondi (≤ 0,30, contrôlé ci-dessus) : on le ramène à 0.
      naturalLandPct: round1(Math.max(0, ((brutPct - water) * 100) / land)),
      composition: comp,
    },
  };
}

/** Les parts lisibles, ou `null` (absentes ou incohérentes : cf. `readLandShares` pour la raison). */
export function landShares(
  brutPct: number | null | undefined,
  composition: Record<string, number> | null | undefined,
): LandShares | null {
  const r = readLandShares(brutPct, composition);
  return r.status === "ok" ? r.shares : null;
}

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

/** FUT-179 : le périmètre de la densité Insee, dit au lecteur ; un chiffre de ville ne vaut pour aucun arrondissement. */
function limiteDensitePLM(d: DensitePLM): string {
  const entier = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f");
  const mesure = `${entier(d.population2022)} habitants sur ${String(d.superficieKm2).replace(".", ",")} km², parcs, bois et espaces non bâtis compris`;
  return d.perimetre === "commune"
    ? `Densité moyenne de toute la commune de ${d.ville} (${mesure}) : elle ne décrit aucun arrondissement en particulier.`
    : `Densité moyenne de l'arrondissement (${mesure}) ; celle de ${d.ville} entière est différente.`;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

export function buildTerritoireSnapshot(i: TerritoireInputs, builtAt: string): FactsSnapshot {
  const e = i.entry;
  // FUT-175 : les parts se lisent sur les terres, l'eau à part (cf. `landShares`).
  const lecture = readLandShares(e?.nature?.brut_pct, e?.nature?.composition);
  const shares = lecture.status === "ok" ? lecture.shares : null;
  // Une contradiction de l'index n'est pas tue : sa raison remplace les limites des faits OSO de la commune.
  const osoRefus = lecture.status === "inconsistent"
    ? `Données OSO de l'index incohérentes pour cette commune (${lecture.reason}) : aucune part n'est affichée.`
    : null;
  const composition = shares?.composition ?? null;
  const naturalPct = shares?.naturalLandPct ?? null;
  const hasOso = shares != null;
  // FUT-179 : à défaut d'ADEME seulement, la densité Insee du périmètre lu (cf. `densiteInsee`).
  const densitePLM = densiteInseeRetenue(i);
  const density = num(e?.densite) ?? num(i.ademe?.densite) ?? num(densitePLM?.habitantsParKm2);
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
      // FUT-109 : 2021, sauf pour une commune dont le territoire ou le code a changé depuis la géographie de la
      // source (population de référence Insee 2023). L'index et ADEME servent la même valeur, au même millésime.
      key: "place.population", value: num(e?.population) ?? num(i.ademe?.population), unit: "habitants",
      scale: "commune", vintage: String(millesimePopulation(i.insee)),
      source: { producer: "INSEE", dataset: "Recensement de la population", field: "population" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.density", value: density, unit: "hab/km²", scale: "commune", vintage: "2022",
      source: densitePLM
        ? { producer: "INSEE", dataset: "Populations légales 2022 ; superficie, base du comparateur de territoires", field: "PMUN / SUP" }
        : { producer: "INSEE via ADEME", dataset: "Données communales", field: "densite_de_population_2022" },
      ...(densitePLM ? { limits: limiteDensitePLM(densitePLM) } : {}),
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.typology", value: i.typology.label, scale: "commune",
      source: { producer: "futur•e", dataset: "Index du comparateur ; loi Littoral (DGALN) ; planification maritime (DGAMPA-Shom)", field: "loi_effective, mer_facade" },
      limits: "« Littoral » désigne une commune classée « Mer » au titre de la loi Littoral ; le type ne dit rien du climat ni de l'exposition.",
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.urban_role", value: i.urbanRole, scale: "urban_unit", vintage: "2020",
      source: { producer: "INSEE", dataset: "Unités urbaines 2020", field: "uu" },
      card: card("identity"), synthesis: INCLUDE,
    }),
    fact({
      key: "place.position",
      // FUT-43 : une position dont aucun champ n'est connu (Paris, Lyon, Marseille lus à la commune : une
      // position se mesure en un point, elle ne s'agrège pas) est une ABSENCE, pas un objet vide.
      value: e && [e.mer_centre_km, e.relief_proximite, e.altitude].some((v) => num(v) != null)
        ? { merCentreKm: num(e.mer_centre_km), reliefProximite: num(e.relief_proximite), altitude: num(e.altitude) }
        : null,
      scale: "point",
      source: { producer: "futur•e", dataset: "Index du comparateur ; Limite terre-mer © Shom-IGN, 2021", field: "mer_centre_km, relief_proximite, altitude" },
      limits: "Distance à vol d'oiseau du point de référence de la commune au rivage marin, lagunes comprises ; ni une plage, ni un trajet.",
      card: card("identity"),
      // La carte d'identité dit la distance ; la synthèse n'en tire aucun qualificatif (lagunes comprises, une
      // distance au rivage n'est ni une plage ni un climat).
      synthesis: exclude("Distance au rivage marin : montrée sur la carte d'identité, jamais qualifiée par la synthèse."),
    }),
    fact({
      key: "land.composition", value: composition, unit: "% des terres", scale: "commune", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.composition, eau retirée du dénominateur" },
      limits: osoRefus ?? `En % des terres de la commune, l'eau étant comptée à part. ${OSO_COUVERTURE} Couvert observé par satellite : « urbanisé » inclut routes, parkings et surfaces imperméabilisées, pas seulement l'emprise des bâtiments ; ce n'est pas l'artificialisation réglementaire (OCS GE).`,
      card: card("nature.green_spaces"), synthesis: INCLUDE,
    }),
    fact({
      key: "land.water_share", value: shares?.waterPct ?? null, unit: "% de la surface cartographiée", scale: "commune", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.composition.eau" },
      limits: osoRefus ?? `Part de l'eau (mer, lagune, étang, lac, cours d'eau) dans la surface cartographiée de la commune. ${OSO_COUVERTURE} Elle n'est comptée ni dans les espaces naturels ni dans les parts des terres.`,
      card: card("nature.green_spaces"), synthesis: INCLUDE,
    }),
    fact({
      key: "land.natural_share", value: naturalPct, unit: "% des terres", scale: "commune", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.composition, hors urbanisé, cultures et eau" },
      limits: osoRefus ?? `Milieux naturels terrestres, en % des terres : forêts, prairies, landes et pelouses, roche et dunes. Ni les cultures ni l'eau n'en font partie. ${OSO_COUVERTURE}`,
      card: card("nature.green_spaces"), synthesis: INCLUDE,
    }),
    fact({
      key: "land.natural_share_15km", value: num(e?.nature?.radius_pct), unit: "%", scale: "radius_15km", vintage: "2023",
      source: { producer: "CESBIO", dataset: "OSO 2023 (raster 10 m)", field: "nature.radius_pct" },
      limits: "Mesuré dans un rayon de 15 km, pas sur la commune ; espaces naturels et eau confondus, rapportés à toute la surface cartographiée (l'eau n'a pas pu en être retirée).",
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
      key: "place.distinctive_trait", value: i.distinctiveTrait, scale: "commune",
      source: { producer: "futur•e", dataset: "Percentiles nationaux de l'index", field: "getCommuneDistinctive" },
      // FUT-34 : le trait « urbanisées » (bas du couvert naturel dans 15 km, cultures comprises) est retiré. Les traits
      // restants n'ont pas tous la même échelle : climat et démographie à la commune, nature dans 15 km, relief dans 35 km.
      limits: "Trait national le plus marqué parmi climat, couvert naturel (15 km), démographie et relief (35 km) ; l'échelle dépend du trait.",
      card: noCard("other", "Trait d'identité du comparateur, jamais affiché sur Territoire."),
      synthesis: exclude("D2 : l'échelle change d'un trait à l'autre ; la synthèse s'appuie sur les faits mesurés eux-mêmes."),
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
      ...(i.drought == null && i.droughtIndisponible ? { status: "source_unavailable" as const } : {}),
      source: { producer: "OFB", dataset: "ONDE (Hub'Eau)", field: "observations d'écoulement" },
      card: card("climate.drought"), synthesis: INCLUDE,
    }),
    fact({
      key: "risk.georisques",
      value: i.georisques ? { flood: i.georisques.flags.flood, marineSubmersion: i.georisques.flags.marineSubmersion } : null,
      scale: "commune",
      status: i.georisques ? "ok" : i.georisquesIndisponible ? "source_unavailable" : "missing",
      source: { producer: "Géorisques", dataset: "Risques recensés sur la commune", field: "flags" },
      limits: "Échelle communale : un risque recensé ne dit pas quelle adresse est touchée.",
      card: card("risk.flooding"), synthesis: INCLUDE,
    }),
    fact({
      key: "risk.catnat", value: i.catnat, scale: "commune",
      status: i.catnat ? "ok" : i.catnatIndisponible ? "source_unavailable" : "missing",
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
  facts.splice(0, facts.length, ...avecProvenances(facts, i)); // FUT-12 : provenance affichée, hors empreinte (`provenances.ts`).

  const derived: DerivedFact[] = [];
  if (hasOso) {
    const c = landCategory(naturalPct!, composition!);
    derived.push({
      key: "land.category", value: c, label: LAND_LABEL[c], from: ["land.natural_share", "land.composition"],
      rule: "land-category@2", card: card("nature.green_spaces"), synthesis: INCLUDE,
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
