// La RÉSOLUTION d'un lieu nommé en référence structurée. PURE : elle travaille au-dessus d'un
// PlaceDirectory (interface), et ne charge aucun index, ne fait aucun réseau.
// `comparateur-vie.placeDirectory()` l'implémente sur l'index.
//
// TROIS références DISTINCTES, parce qu'un point ne suffit pas : nearPlace veut des coordonnées,
// excludePlace une unité urbaine, sizeRelativeTo une population de référence (avec son année et sa
// nature). Leur donner le même type obligerait leur évaluateur à rouvrir un index au runtime, et les
// deux moteurs cesseraient de lire la même chose.
import { createHash } from "node:crypto";

export type ResolutionMetadata = {
  // L'empreinte de l'ENTRÉE : label brut + contexte territorial + type attendu + version du résolveur.
  // Sans elle, « resolved présent » voudrait dire « ne rien refaire », et remplacer « gare Matabiau »
  // par « gare Saint-Jean » garderait en silence les coordonnées de Toulouse.
  inputHash: string;
  resolverVersion: string;
};

export type ResolvedPlaceReference =
  | {
      status: "resolved";
      originalLabel: string;
      canonicalLabel: string;
      kind: "commune" | "station" | "address" | "poi";
      lat: number;
      lon: number;
      // LA PROVENANCE N'EST PAS COSMÉTIQUE. Elle servira au read repair (lot 2b), à l'audit, et à
      // l'explication : un POI de la Géoplateforme (avec son cleabs stable) n'est pas une adresse de la
      // BAN, et notre index de communes n'est ni l'un ni l'autre.
      source: "commune_index" | "geoplateforme_poi" | "ban";
      sourceId: string | null;
      confidence: "exact" | "high";
      meta: ResolutionMetadata;
    }
  | {
      status: "ambiguous";
      originalLabel: string;
      candidates: { canonicalLabel: string; lat: number; lon: number; kind: string }[];
      meta: ResolutionMetadata;
    }
  | {
      status: "unresolved";
      originalLabel: string;
      // UNE PANNE N'EST PAS UN CONSTAT. `geocoding_unavailable` dit que les services n'ont pas répondu :
      // c'est retentable, et le lot 2b ne devra JAMAIS le persister. Le confondre avec `no_result` ferait
      // dire au produit « ce lieu n'existe pas » parce qu'un serveur a hoqueté.
      reason: "no_result" | "low_confidence" | "unsupported_type" | "geocoding_unavailable";
      meta: ResolutionMetadata;
    };

export type ResolvedUrbanAreaReference =
  | {
      status: "resolved";
      originalLabel: string;
      canonicalLabel: string;
      // NULLABLE : la table PLM connaît l'unité urbaine de Paris / Lyon / Marseille sans passer par une
      // commune de référence. Un objet `resolved` ne doit jamais porter un identifiant requis VIDE :
      // « » se compare, se sérialise et se log comme une valeur, et personne ne verra qu'elle est absente.
      referenceCommuneInsee: string | null;
      urbanUnitCode: string | null;
      normalizedTerritoryCode: string;
      source: "commune_index" | "plm_table";
      meta: ResolutionMetadata;
    }
  | { status: "unresolved"; originalLabel: string; reason: "no_result"; meta: ResolutionMetadata };

export type ResolvedSizeReference =
  | {
      status: "resolved";
      originalLabel: string;
      canonicalLabel: string;
      urbanUnitCode: string | null;
      comparisonPopulation: number;
      populationYear: number;
      populationKind: "urban_unit" | "isolated_commune";
      source: "commune_index" | "plm_table";
      meta: ResolutionMetadata;
    }
  | { status: "unresolved"; originalLabel: string; reason: "no_result"; meta: ResolutionMetadata };

// L'ANNUAIRE : une interface, pas un index. Le noyau de résolution ne charge rien, ne lit aucun fichier,
// ne fait aucun réseau. La frontière serveur l'implémente sur comparateur-vie.
export type DirectoryEntry = {
  insee: string;
  nom: string;
  lat: number;
  lon: number;
  uu: string | null;
  tailleVille: number | null; // population d'agglomération (UU), ou communale si hors UU
};
export type PlaceDirectory = {
  byName(label: string): DirectoryEntry | null;
  plmByName(label: string): { uu: string; pop: number } | null; // Paris / Lyon / Marseille
};

// resolve-2 : le résolveur ne se contente plus de l'index des communes, il géocode (POI Géoplateforme,
// puis BAN) et il CONTRÔLE. Un inputHash d'hier ne dit donc plus la même chose : la version le déclare.
export const RESOLVER_VERSION = "resolve-2";
// L'année de la population de l'index (INSEE, millésime 2021 : cf. scripts/populate-*, croissance
// 2015-2021). Vérifiée contre l'index, jamais supposée.
export const INDEX_POPULATION_YEAR = 2021;

export function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function resolutionInputHash(label: string, context: string, kind: string): string {
  return createHash("sha256")
    .update([normalizeName(label), context, kind, RESOLVER_VERSION].join("|"))
    .digest("hex")
    .slice(0, 32);
}

export type ResolutionInput = { context: string }; // départements déclarés, commune du rapport…

function meta(label: string, input: ResolutionInput, kind: string): ResolutionMetadata {
  return { inputHash: resolutionInputHash(label, input.context, kind), resolverVersion: RESOLVER_VERSION };
}

export function resolveNearPlace(
  label: string,
  dir: PlaceDirectory,
  input: ResolutionInput,
): ResolvedPlaceReference {
  const m = meta(label, input, "place");
  const hit = dir.byName(normalizeName(label));
  if (!hit) {
    // LOT 1 : on ne devine pas. « Gare Matabiau » n'est pas une commune, donc la référence n'est pas
    // résolue, et elle est DÉCLARÉE telle. Le comparateur la sautait en silence ; il ne le pourra plus.
    return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  }
  return {
    status: "resolved",
    originalLabel: label,
    canonicalLabel: hit.nom,
    kind: "commune",
    lat: hit.lat,
    lon: hit.lon,
    source: "commune_index",
    sourceId: hit.insee,
    confidence: "exact",
    meta: m,
  };
}

export function resolveUrbanArea(
  label: string,
  dir: PlaceDirectory,
  input: ResolutionInput,
): ResolvedUrbanAreaReference {
  const m = meta(label, input, "urban_area");
  const key = normalizeName(label);
  const plm = dir.plmByName(key);
  if (plm) {
    // Paris / Lyon / Marseille : la table PLM donne l'unité urbaine PARENTE (les arrondissements ne sont
    // pas des communes ordinaires). On récupère quand même l'INSEE de la ville quand l'index la connaît,
    // plutôt que d'écrire une chaîne vide dans un champ requis.
    const ville = dir.byName(key);
    return {
      status: "resolved",
      originalLabel: label,
      canonicalLabel: ville?.nom ?? label,
      referenceCommuneInsee: ville?.insee ?? null,
      urbanUnitCode: plm.uu,
      normalizedTerritoryCode: `uu:${plm.uu}`,
      source: "plm_table",
      meta: m,
    };
  }
  const hit = dir.byName(key);
  if (!hit) return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  return {
    status: "resolved",
    originalLabel: label,
    canonicalLabel: hit.nom,
    referenceCommuneInsee: hit.insee,
    urbanUnitCode: hit.uu,
    // Une ville hors unité urbaine est son propre périmètre : on exclut la commune, pas une agglo.
    normalizedTerritoryCode: hit.uu ? `uu:${hit.uu}` : `insee:${hit.insee}`,
    source: "commune_index",
    meta: m,
  };
}

export function resolveSizeReference(
  label: string,
  dir: PlaceDirectory,
  input: ResolutionInput,
): ResolvedSizeReference {
  const m = meta(label, input, "size");
  const hit = dir.byName(normalizeName(label));
  if (!hit || hit.tailleVille == null) {
    return { status: "unresolved", originalLabel: label, reason: "no_result", meta: m };
  }
  return {
    status: "resolved",
    originalLabel: label,
    canonicalLabel: hit.nom,
    urbanUnitCode: hit.uu,
    comparisonPopulation: hit.tailleVille,
    populationYear: INDEX_POPULATION_YEAR,
    populationKind: hit.uu ? "urban_unit" : "isolated_commune",
    source: "commune_index",
    meta: m,
  };
}
