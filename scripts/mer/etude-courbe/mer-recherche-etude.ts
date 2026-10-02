// ÉTUDE SEULEMENT (FUT-33 2B.2 B) : remplace src/lib/mer-recherche.ts dans le moteur, le temps d'une mesure.
// La courbe est choisie par la variable d'environnement COURBE_MER (A, B, C). Jamais importé par le produit.
import * as vrai from "../../../src/lib/mer-recherche.ts";
export const { bonusMer, communeLittoraleMer, ancreLittorale, ANCRE_LITTORALE_CENTRE_MAX_KM } = vrai;
export const COURBES: Record<string, (d: number) => number> = {
  A: (d) => Math.max(0, Math.min(100, 100 - d / 1.5)),
  B: (d) => 100 * Math.exp(-d / 25),
  C: (d) => 100 / (1 + Math.pow(d / 20, 2)),
};
export function scoreProximiteMer(c: { mer_centre_km?: number | null }): number | null {
  if (c.mer_centre_km == null) return null;
  return COURBES[process.env.COURBE_MER ?? "A"](c.mer_centre_km);
}
