// LA POPULATION COMMUNALE DE PARIS, LYON, MARSEILLE (FUT-8). Lib PURE.
//
// L'index range ces trois villes par arrondissement. Leur population communale se reconstruit en sommant
// les arrondissements de l'index (même millésime que toutes les autres communes). Un arrondissement sans
// population rend la somme INCONNUE : jamais un total partiel, qui produirait un faux verdict.
const ARRONDISSEMENTS: Record<string, RegExp> = {
  paris: /^751\d\d$/,
  lyon: /^6938\d$/,
  marseille: /^132\d\d$/,
};

export function populationCommunalePLM(
  ville: string, communes: readonly { insee: string; population?: number | null }[],
): number | null {
  const motif = ARRONDISSEMENTS[ville];
  if (!motif) return null;
  const arr = communes.filter((c) => motif.test(c.insee));
  if (arr.length === 0 || arr.some((c) => c.population == null)) return null;
  return arr.reduce((t, c) => t + (c.population ?? 0), 0);
}
