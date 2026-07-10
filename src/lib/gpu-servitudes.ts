// Protections patrimoniales au point (Face 2 Logement), depuis les assiettes de servitude du
// Géoportail de l'urbanisme. Lib PURE (pas server-only) : utilisée côté serveur par `gpu.ts`, son
// TYPE est importé côté client par le rapport.
//
// Ne déduit JAMAIS les travaux autorisés ou interdits : elle filtre, dédoublonne et nomme.
//
// Sémantique vérifiée sur la donnée réelle (2026-07-09) :
//  - un point est dans autant d'assiettes qu'il y a de monuments autour (Place Stanislas : 134,
//    cathédrale de Strasbourg : 107). Le fait utile est binaire, jamais un compteur ;
//  - la famille se lit dans le préfixe de `idass` : "AC1-172014607-2401160004-1-1" -> "AC1" ;
//  - les familles non patrimoniales (PM1 risques, AS1 captages, I4, T1...) sont écartées ici :
//    les risques sont déjà portés par la brique PPRN, le reste ne change aucune décision d'habitant.

export type HeritageFamily = "AC1" | "AC2" | "AC4";

export type HeritageProtection = {
  family: HeritageFamily;
  label: string; // terme officiel, jamais un jugement de sévérité
};

export type RawSupFeature = { properties?: { idass?: string | null } | null };

// Vit ici, dans la lib PURE, et non dans `gpu.ts` (server-only) : le contrat partagé
// `logement-report-types.ts` est lu côté client et n'importe que des libs pures, comme il le fait
// déjà pour `RegulatoryPlan`. `gpu.ts` le ré-exporte pour les appelants serveur.
export type HeritageStatus = {
  items: HeritageProtection[];
  // Une panne n'est JAMAIS une absence de servitude : le rendu doit pouvoir les distinguer.
  sourceStatus: "ok" | "unavailable";
};

const LABELS: Record<HeritageFamily, string> = {
  AC1: "Abords d'un monument historique",
  AC4: "Site patrimonial remarquable",
  AC2: "Site classé ou inscrit",
};

// Convention de LECTURE, non une hiérarchie de contrainte : un site classé (AC2) peut être plus
// contraignant que des abords (AC1).
const ORDER: HeritageFamily[] = ["AC1", "AC4", "AC2"];

function familyOf(idass: string | null | undefined): HeritageFamily | null {
  if (!idass) return null;
  const prefix = idass.split("-")[0];
  return prefix === "AC1" || prefix === "AC2" || prefix === "AC4" ? prefix : null;
}

export function buildHeritageProtections(
  features: RawSupFeature[] | null | undefined,
): HeritageProtection[] {
  const found = new Set<HeritageFamily>();
  for (const feature of features ?? []) {
    const family = familyOf(feature?.properties?.idass);
    if (family) found.add(family);
  }
  return ORDER.filter((f) => found.has(f)).map((family) => ({ family, label: LABELS[family] }));
}
