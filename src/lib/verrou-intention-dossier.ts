// ════════════════════════════════════════════════════════════════════════════════════════════
// LE VERROU DU CONTEXTE D'UNE INTENTION DE DOSSIER (correction du 11/10/2026, revue FUT-10). Lib PURE,
// stockage injecté : testée sans base, puis contre un vrai Postgres (PGlite) dans les tests d'intégration.
//
// ── L'INVARIANT ──────────────────────────────────────────────────────────────────────────────
// Une fois la confirmation du paiement engagée, le contexte de l'intention (relation, objectif, état et
// snapshot du projet) ne change plus. Le dossier créé par le webhook porte donc exactement les réponses
// associées à la vente, et un webhook rejoué les retrouve à l'identique.
//
// ── LE MÉCANISME, ET POURQUOI CELUI-LÀ ───────────────────────────────────────────────────────
// Une colonne `context_locked_at`, posée par UNE instruction conditionnelle :
//     update … set context_locked_at = now() where pi = $1 and context_locked_at is null
// et toutes les écritures de contexte sont elles-mêmes conditionnées par « context_locked_at is null ».
// Postgres prend le verrou de ligne et RÉÉVALUE la condition après l'avoir obtenu (READ COMMITTED) :
// entre une écriture de contexte et la pose du verrou, l'une passe entière avant l'autre, jamais un
// mélange, et aucune écriture ne passe après le verrou. Un « lire l'état puis écrire » côté serveur
// laisserait au contraire une fenêtre entre la lecture et l'écriture.
//
// QUI POSE LE VERROU :
//   1. le navigateur, JUSTE AVANT `stripe.confirmPayment` (route /api/dossier/intention/verrouiller) ;
//      si le verrou échoue, la confirmation n'est pas envoyée ;
//   2. le webhook, avant de lire l'intention (filet pour un client qui aurait sauté l'étape 1) ;
// et la route de paiement refuse toute mise à jour quand Stripe dit le PaymentIntent déjà engagé.
//
// Désactiver un bouton n'aurait rien garanti : une requête partie d'un autre onglet, ou rejouée, passe.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les colonnes qu'une intention porte, adresse et contexte. Le verrou n'en fait pas partie. */
export type LigneIntention = Record<string, unknown> & { stripe_payment_intent_id: string; user_id: string };

/** Le stockage, réduit aux deux instructions atomiques dont le verrou a besoin. */
export type StoreIntentions = {
  /** `insert … on conflict (stripe_payment_intent_id) do nothing` ; vrai si la ligne a été créée. */
  insererSiAbsente: (ligne: LigneIntention) => Promise<boolean>;
  /**
   * `update … set <champs> where pi = $1 and user_id = $2 and context_locked_at is null` ; vrai si une
   * ligne a été modifiée. C'est la condition SQL, pas une lecture préalable, qui protège le verrou.
   */
  mettreAJourSiOuverte: (pi: string, userId: string, champs: Record<string, unknown>) => Promise<boolean>;
  /** `update … set context_locked_at = $3 where pi = $1 [and user_id = $2] and context_locked_at is null`. */
  verrouillerSiOuverte: (pi: string, userId: string | null, maintenant: string) => Promise<boolean>;
  /** Lecture simple, pour distinguer « déjà verrouillée » de « introuvable ». */
  lire: (pi: string, userId: string | null) => Promise<{ context_locked_at: string | null } | null>;
};

/** Les statuts Stripe où le paiement n'est PAS encore engagé : seuls ceux-là laissent changer le contexte. */
export const STATUTS_STRIPE_MODIFIABLES: readonly string[] = ["requires_payment_method", "requires_confirmation"];

export function statutStripeModifiable(statut: string | null | undefined): boolean {
  return typeof statut === "string" && STATUTS_STRIPE_MODIFIABLES.includes(statut);
}

/**
 * ÉCRIRE L'INTENTION, en respectant le verrou.
 *   - `creee`      : première écriture pour ce PaymentIntent ;
 *   - `mise_a_jour`: réponses corrigées avant toute confirmation ;
 *   - `verrouillee`: la confirmation est engagée, RIEN n'a été écrit. La route refuse alors de rendre
 *                    le formulaire : on ne paie pas avec des réponses qui ne seraient pas celles livrées.
 */
export async function enregistrerIntention(
  store: StoreIntentions, ligne: LigneIntention,
  opts: {
    /**
     * Interrogé AVANT toute mise à jour d'une intention existante : rend `false` quand le paiement est
     * déjà engagé côté Stripe (statut hors `STATUTS_STRIPE_MODIFIABLES`). L'intention est alors
     * verrouillée sur-le-champ, sans rien écrire : c'est le filet d'un client qui n'aurait pas posé le
     * verrou avant de confirmer. La condition SQL reste la garantie ; ceci réduit la fenêtre.
     */
    paiementEncoreModifiable?: () => Promise<boolean>;
    maintenant?: Date;
  } = {},
): Promise<"creee" | "mise_a_jour" | "verrouillee"> {
  if (await store.insererSiAbsente(ligne)) return "creee";
  const { stripe_payment_intent_id: pi, user_id: userId, ...champs } = ligne;
  if (opts.paiementEncoreModifiable && !(await opts.paiementEncoreModifiable())) {
    await store.verrouillerSiOuverte(pi, userId, (opts.maintenant ?? new Date()).toISOString());
    return "verrouillee";
  }
  return (await store.mettreAJourSiOuverte(pi, userId, champs)) ? "mise_a_jour" : "verrouillee";
}

/**
 * VERROUILLER LE CONTEXTE. Idempotent : verrouiller deux fois répond `verrouillee` les deux fois.
 * `introuvable` quand aucune intention n'existe pour ce PaymentIntent (et ce compte, quand il est donné).
 */
export async function verrouillerIntention(
  store: StoreIntentions, pi: string, userId: string | null, maintenant: Date,
): Promise<"verrouillee" | "introuvable"> {
  if (await store.verrouillerSiOuverte(pi, userId, maintenant.toISOString())) return "verrouillee";
  const ligne = await store.lire(pi, userId);
  return ligne ? "verrouillee" : "introuvable";
}

/** Un identifiant de PaymentIntent tel que Stripe les forme, et rien d'autre. */
export function estIdentifiantPaymentIntent(v: unknown): v is string {
  return typeof v === "string" && /^pi_[A-Za-z0-9]{8,64}$/.test(v);
}

/** L'identifiant du PaymentIntent, depuis le `clientSecret` que le navigateur détient (`pi_…_secret_…`). */
export function paymentIntentDuSecret(clientSecret: string | null | undefined): string | null {
  const id = clientSecret?.split("_secret_")[0] ?? null;
  return estIdentifiantPaymentIntent(id) ? id : null;
}
