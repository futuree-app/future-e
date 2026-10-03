// LE TRAIT DISTINCTIF D'UNE COMMUNE PAR RAPPORT AU NATIONAL. Lib PURE (réexportée par comparateur-vie.ts).
//
// On lit les percentiles nationaux déjà stockés dans l'index et on retient le trait le plus marqué, s'il dépasse un
// seuil de saillance (≥ 88 ou ≤ 12). Sinon null : la commune n'a pas de trait distinctif net, et c'est une réponse.
// Périmètre Territoire : climat, couvert naturel, trajectoire démographique, relief. Aucun signal logement / santé /
// mobilité / métier.
//
// CHAQUE LIBELLÉ DIT CE QUE SA MESURE MESURE. FUT-34 (03/10/2026) : le trait « compte parmi les communes les plus
// urbanisées de France » est RETIRÉ. Il lisait le bas du percentile de couvert naturel dans un rayon de 15 km ; or
// ce qui n'est pas naturel autour d'une commune, ce sont surtout des cultures. Sur les 4 324 communes concernées,
// 73 % comptent moins de 100 hab./km² et la part artificialisée dans la commune est en médiane de 5,9 % (Bony,
// Janville-en-Beauce, Châtelaillon-Plage et la plaine d'Aunis). Aucune métrique d'urbanisation ne le remplace ici :
// un tel trait demanderait une mesure communale et son propre classement (audit :
// docs/audits/2026-10-03-fut34-trait-urbanisee-audit.md).

export type CommunePourTrait = {
  pct: Record<string, number | null | undefined>;
  nature?: { score?: number | null } | null;
  demographie?: { croissance?: number | null } | null;
  relief_proximite?: number | null;
};

function moyennePct(c: CommunePourTrait, champs: string[]): number | null {
  const vals = champs.map((f) => c.pct[f]).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

type TraitNational = { pct: (c: CommunePourTrait) => number | null; dir: "high" | "low"; label: string };

export const TRAITS_NATIONAUX: readonly TraitNational[] = [
  { pct: (c) => moyennePct(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr"]), dir: "high", label: "compte parmi les communes aux étés les plus chauds de France" },
  { pct: (c) => c.pct.NORRR_yr ?? null, dir: "high", label: "compte parmi les communes les plus pluvieuses de France" },
  { pct: (c) => moyennePct(c, ["NORRRq99_yr", "NORRx1d_yr"]), dir: "high", label: "compte parmi les communes aux pluies les plus intenses de France" },
  { pct: (c) => c.pct.NORSWI04_yr ?? null, dir: "high", label: "compte parmi les communes aux sols les plus exposés à la sécheresse" },
  { pct: (c) => c.pct.NORIFM40_yr ?? null, dir: "high", label: "compte parmi les communes les plus exposées aux conditions de feu" },
  // Le HAUT du couvert naturel dans 15 km : « entourées » dit le rayon. Son bas n'a pas de libellé (voir l'en-tête).
  { pct: (c) => c.nature?.score ?? null, dir: "high", label: "compte parmi les communes les plus entourées d'espaces naturels" },
  // La croissance est le percentile national d'un TAUX annuel de variation de la population (INSEE 2015-2021) :
  // ni « dynamisme » (attractivité, emploi, jeunesse), ni nombre d'habitants perdus (qui favoriserait les grandes villes).
  { pct: (c) => c.demographie?.croissance ?? null, dir: "high", label: "compte parmi les communes dont la population augmente le plus" },
  { pct: (c) => c.demographie?.croissance ?? null, dir: "low", label: "compte parmi les communes dont la population diminue le plus" },
  { pct: (c) => c.relief_proximite ?? null, dir: "high", label: "compte parmi les communes les plus proches du relief" },
];

export const TRAIT_SEUIL_HAUT = 88;
export const TRAIT_SEUIL_BAS = 12;

/** Le trait distinctif national le plus marqué, ou null. */
export function getCommuneDistinctive(c: CommunePourTrait): string | null {
  let best: { label: string; extremity: number } | null = null;
  for (const d of TRAITS_NATIONAUX) {
    const p = d.pct(c);
    if (p == null) continue;
    let extremity: number | null = null;
    if (d.dir === "high" && p >= TRAIT_SEUIL_HAUT) extremity = p;
    else if (d.dir === "low" && p <= TRAIT_SEUIL_BAS) extremity = 100 - p;
    if (extremity == null) continue;
    if (!best || extremity > best.extremity) best = { label: d.label, extremity };
  }
  return best?.label ?? null;
}
