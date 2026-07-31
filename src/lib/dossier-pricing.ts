// Le prix du dossier d'adresse. Pas de `server-only` : pure, testée sous `node --test`.
//
// LA DÉDUCTION EST UN ÉTAT RECALCULÉ, JAMAIS UN CRÉDIT CONSOMMABLE. Elle vaut pour TOUS les biens
// d'une commune déjà payée, pas seulement le premier. Le fait générateur est `decidePaidTerritory`
// (src/lib/territory-claims.ts), vrai pour un 14 € direct, un grant `pack_decision` et un dossier
// antérieur payé ; faux pour la seule résidence (déclarative, sinon `home_insee_code` deviendrait
// un bon de réduction) et faux pour un dossier administratif, puisque rien n'a été encaissé.
//
// Renversement assumé du 29/07/2026, à ne pas re-litiger : le business strategist recommandait le
// deuxième dossier à plein tarif pour ne pas brouiller la mesure de la disposition à repayer.
// Revendre le tiers d'un ensemble que le compte possède déjà est un fait que futur•e connaîtrait
// au moment de l'encaisser, et l'invariant n°1 passe avant la propreté de la mesure.
export const DOSSIER_PRICE = {
  fullCents: 3900,
  deepeningCents: 2500,
  territoryDeductionCents: 1400,
} as const;

export type DossierQuote = {
  basePriceCents: number;
  territoryDeductionCents: number;
  amountDueCents: number;
  /** Le libellé du tarif de lancement appliqué, s'il y en a un. Écrit sur la facture. */
  promoLabel: string | null;
};

/**
 * Le devis du dossier.
 *
 * `promo` est un PLANCHER, jamais une remise qui s'ajoute à la déduction. Cumuler les deux ferait
 * tomber à 0 € un compte ayant déjà payé le territoire : Stripe refuse en dessous de 50 centimes,
 * et un encaissement nul ne prouverait rien. Quand un code s'applique, la déduction territoriale
 * est donc ANNULÉE, pas soustraite : le lecteur paie le tarif de lancement, point.
 *
 * Conséquence assumée, et elle va dans le bon sens : quelqu'un qui a déjà payé le territoire paie
 * 19 € au lieu de 25 €, donc le code lui profite aussi. L'inverse (facturer 25 € malgré le code)
 * serait incompréhensible pour la personne à qui on a annoncé un prix.
 */
export function quoteForDossier(
  hasPaidTerritory: boolean,
  promo?: { amountCents: number; label: string } | null,
): DossierQuote {
  if (promo) {
    return {
      basePriceCents: DOSSIER_PRICE.fullCents,
      territoryDeductionCents: 0,
      amountDueCents: promo.amountCents,
      promoLabel: promo.label,
    };
  }
  const territoryDeductionCents = hasPaidTerritory
    ? DOSSIER_PRICE.territoryDeductionCents
    : 0;
  return {
    basePriceCents: DOSSIER_PRICE.fullCents,
    territoryDeductionCents,
    amountDueCents: DOSSIER_PRICE.fullCents - territoryDeductionCents,
    promoLabel: null,
  };
}
