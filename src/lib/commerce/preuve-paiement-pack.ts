// FUT-115 · UN COMPARATIF NE S'OUVRE QUE SUR UN PAIEMENT QUE STRIPE A CONFIRMÉ. Lib PURE.
//
// La page de retour octroyait le comparatif sur la foi de son URL (`?payment_intent=…&redirect_status=succeeded`).
// Or l'instantané `pack_snapshots` existe dès la CRÉATION du PaymentIntent, avant tout paiement, et son
// identifiant figure dans le `clientSecret` remis au navigateur : il suffisait de recopier cet identifiant dans
// l'URL de retour pour ouvrir un comparatif sans payer.
//
// LA PREUVE EST UN PaymentIntent LU CHEZ STRIPE PAR LE SERVEUR : l'objet signé du webhook, ou la réponse de
// `paymentIntents.retrieve` (clé secrète, serveur à serveur). Jamais un paramètre d'URL. Cette fonction dit si
// cet objet prouve l'achat de CE comparatif par CE compte ; `grantDecisionPackFromSnapshot` refuse d'écrire
// quoi que ce soit sans elle, quel que soit l'appelant.

/** Prix du comparatif, en centimes. Lu aussi par la route de paiement : une seule source. */
export const PACK_DECISION_AMOUNT_CENTS = 3900;
export const PACK_DECISION_PRODUCT_TYPE = "pack-decision";

/** Ce que l'on lit d'un PaymentIntent Stripe (sous-ensemble de `Stripe.PaymentIntent`). */
export type PaiementStripe = {
  id: string;
  status: string;
  amount: number;
  amount_received?: number | null;
  currency: string;
  metadata?: Record<string, string> | null;
};

/** Les colonnes de `pack_snapshots` que la preuve confronte. */
export type InstantanePack = {
  stripe_payment_intent_id: string;
  user_id: string | null;
  insee_1: string | null;
  insee_2: string | null;
  insee_3: string | null;
};

export type MotifRefus =
  | "statut_non_confirme"
  | "montant"
  | "devise"
  | "produit"
  | "proprietaire"
  | "instantane_absent"
  | "instantane_different";

export type VerdictPreuve = { ok: true } | { ok: false; motif: MotifRefus };

/**
 * Le paiement prouve-t-il l'achat de cet instantané ? `attendu` est le compte de la session quand l'appel vient
 * d'une page : le comparatif ne s'ouvre que pour celui qui l'a payé.
 */
export function preuvePaiementPack(
  pi: PaiementStripe,
  snap: InstantanePack | null,
  attendu?: string,
): VerdictPreuve {
  if (pi.status !== "succeeded") return { ok: false, motif: "statut_non_confirme" };
  if (pi.currency !== "eur") return { ok: false, motif: "devise" };
  if (pi.amount !== PACK_DECISION_AMOUNT_CENTS) return { ok: false, motif: "montant" };
  if (pi.amount_received != null && pi.amount_received !== PACK_DECISION_AMOUNT_CENTS) return { ok: false, motif: "montant" };
  const meta = pi.metadata ?? {};
  if (meta.productType !== PACK_DECISION_PRODUCT_TYPE) return { ok: false, motif: "produit" };
  if (!snap || !snap.user_id) return { ok: false, motif: "instantane_absent" };
  if (snap.stripe_payment_intent_id !== pi.id) return { ok: false, motif: "instantane_different" };
  // Le compte qui a payé (métadonnée posée par notre serveur à la création), celui de l'instantané, et celui de
  // la session quand il y en a une : les trois doivent coïncider.
  if (!meta.userId || meta.userId !== snap.user_id) return { ok: false, motif: "proprietaire" };
  if (attendu !== undefined && attendu !== snap.user_id) return { ok: false, motif: "proprietaire" };
  // Les communes payées sont celles de l'instantané (métadonnées figées à la création).
  const payees = [meta.packInsee1, meta.packInsee2, meta.packInsee3].map((v) => v || null);
  const figees = [snap.insee_1, snap.insee_2, snap.insee_3].map((v) => v || null);
  if (payees.some((v, i) => v !== figees[i])) return { ok: false, motif: "instantane_different" };
  return { ok: true };
}
