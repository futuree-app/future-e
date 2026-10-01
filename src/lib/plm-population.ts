// LA POPULATION COMMUNALE DE PARIS, LYON, MARSEILLE (FUT-8). Lib PURE.
//
// L'index range ces trois villes par arrondissement. Leur population communale se reconstruit en sommant
// TOUS leurs arrondissements, présents dans l'index et chiffrés (même millésime que les autres communes).
// Un seul arrondissement absent ou sans population rend la somme INCONNUE : jamais un total partiel, qui
// produirait un faux verdict.
const plage = (prefixe: string, de: number, a: number, largeur: number) =>
  Array.from({ length: a - de + 1 }, (_, i) => `${prefixe}${String(de + i).padStart(largeur, "0")}`);

export const ARRONDISSEMENTS_PLM: Record<string, readonly string[]> = {
  paris: plage("751", 1, 20, 2),      // 75101 … 75120
  lyon: plage("6938", 1, 9, 1),       // 69381 … 69389
  marseille: plage("132", 1, 16, 2),  // 13201 … 13216
};

export function populationCommunalePLM(
  ville: string, communes: readonly { insee: string; population?: number | null }[],
): number | null {
  const attendus = ARRONDISSEMENTS_PLM[ville];
  if (!attendus) return null;
  const parInsee = new Map(communes.map((c) => [c.insee, c.population ?? null]));
  let total = 0;
  for (const insee of attendus) {
    const pop = parInsee.get(insee);
    if (pop == null) return null;
    total += pop;
  }
  return total;
}
