// ════════════════════════════════════════════════════════════════════════════════════════════
// LA DENSITÉ DE PARIS, LYON, MARSEILLE ET DE LEURS ARRONDISSEMENTS (FUT-179). Lib PURE.
//
// ADEME data_communes, d'où vient la densité de toutes les autres communes, n'a aucune ligne pour 75056, 69123
// et 13055, et ses lignes d'arrondissement n'ont pas de densité. La table générée (plm-densite.generated.ts)
// la recalcule avec la méthode d'ADEME (population municipale 2022 / superficie Insee), vérifiée sur 34 728
// communes de l'index (écart médian 0,2 %).
//
// LA RÈGLE DE GRAIN. Chaque valeur est celle de SON périmètre : l'arrondissement lu pour un arrondissement, la
// commune entière pour la commune. Jamais le chiffre de Paris pour le 11e, jamais celui du 1er pour Paris.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { DENSITE_PLM, type DensitePLM } from "./plm-densite.generated.ts";

export type { DensitePLM };

/** La densité Insee du périmètre lu (75056, 75111…), ou `null` hors de Paris, Lyon et Marseille. */
export function densiteInseePLM(insee: string): DensitePLM | null {
  return DENSITE_PLM[insee.trim()] ?? null;
}

const n = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/**
 * LA SEULE DÉCISION : la densité Insee ne sert qu'à défaut de densité ADEME (index, puis jeu communal). Le registre
 * (`facts.ts`, valeur, source, limites) et la provenance (`provenances.ts`) la lisent ici, pour ne jamais diverger.
 */
export function densiteInseeRetenue(i: {
  entry: { densite: number | null } | null;
  ademe: { densite: number | null } | null;
  densiteInsee?: DensitePLM | null;
}): DensitePLM | null {
  return !n(i.entry?.densite) && !n(i.ademe?.densite) && i.densiteInsee ? i.densiteInsee : null;
}
