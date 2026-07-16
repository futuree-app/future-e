// LA CONVENTION DE TAILLE D'AGGLOMÉRATION, versionnée, son classifieur et ses libellés. PURS.
//
// On NE réutilise PAS `tailleLabel` de comparateur-vie.ts (null -> "petite", repli métier que le chantier A
// a tué ; module server-only). Le dossier exige null -> uncertain et une lib pure. La convention PILOTE le
// classifieur (les seuils ne sont pas répétés), et les catégories sont une constante unique (validateur + type).
export const AGGLOMERATION_CATEGORIES = ["village", "petite", "moyenne", "grande", "metropole"] as const;
export type AgglomerationCategory = (typeof AGGLOMERATION_CATEGORIES)[number];

export const AGGLOMERATION_SIZE_CONVENTION = {
  id: "agglomeration-size-v1",
  // tailleVille = population de l'unité urbaine si disponible, sinon population communale (cf. tailleVilleSource).
  thresholds: {
    villageMaxExclusive: 2_000,
    petiteMaxExclusive: 25_000,
    moyenneMaxExclusive: 100_000,
    grandeMaxExclusive: 500_000,
  },
} as const;

export function classifyAgglomerationSize(
  population: number | null,
): AgglomerationCategory | "uncertain" {
  if (population == null || !Number.isFinite(population) || population < 0) return "uncertain";
  const t = AGGLOMERATION_SIZE_CONVENTION.thresholds;
  if (population < t.villageMaxExclusive) return "village";
  if (population < t.petiteMaxExclusive) return "petite";
  if (population < t.moyenneMaxExclusive) return "moyenne";
  if (population < t.grandeMaxExclusive) return "grande";
  return "metropole";
}

// « agglomération » et « métropole » ne sont légitimes que si la classification repose sur l'unité urbaine.
// En repli « population communale », libellé neutre (« grande ville », « très grande ville », « petite commune »).
export function labelForCategory(cat: AgglomerationCategory, source: "urban_unit" | "commune"): string {
  const uu = source === "urban_unit";
  switch (cat) {
    case "village": return "un village";
    case "petite": return uu ? "une petite agglomération" : "une petite commune";
    case "moyenne": return "une ville moyenne";
    case "grande": return uu ? "une grande agglomération" : "une grande ville";
    case "metropole": return uu ? "une métropole" : "une très grande ville";
  }
}

// Une phrase COMPLÈTE dépendante de la source. Une commune n'« appartient » pas à une catégorie de taille
// (source UU, périmètre agglo) ; elle « est classée comme » (source commune, périmètre communal).
export function categoryStatementFragment(
  nom: string, cat: AgglomerationCategory, source: "urban_unit" | "commune",
): string {
  return source === "urban_unit"
    ? `${nom} appartient à ${labelForCategory(cat, "urban_unit")} selon la population de son unité urbaine et la convention de taille utilisée par futur•e`
    : `${nom} est classée comme ${labelForCategory(cat, "commune")} selon sa population communale`;
}
