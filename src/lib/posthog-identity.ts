// Le distinct_id de PostHog voyage du navigateur au serveur, puis jusqu'au webhook par les
// métadonnées Stripe.
//
// SANS LUI, LES ÉVÉNEMENTS SERVEUR CRÉENT UNE SECONDE PERSONNE. Le navigateur identifie sur l'UUID
// Supabase (`mesure-audience.ts`, `identify(compte)`, depuis FUT-181) tandis que les routes émettaient sur
// l'e-mail : deux `identify` sur deux clés font deux personnes, pas un alias, donc l'achat
// n'appartenait pas au parcours qui l'a produit. Le patron correct existe déjà dans
// `comparateur-vie/ask/route.ts`, où le client transmet son identifiant.
//
// Pas de `server-only` : la fonction est pure et testée sous `node --test`.

const MAX_LEN = 200;

export function sanitizeDistinctId(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  // Refuser plutôt que tronquer : un identifiant coupé ressemble à un vrai et fusionnerait
  // silencieusement deux personnes.
  if (trimmed.length > MAX_LEN) return fallback;
  // Caractères de contrôle et espaces INTERNES : un identifiant qui en porte vient d'un client
  // bricolé, et il polluerait la table des personnes de l'outil de mesure.
  if (/[\u0000-\u001f\u007f\s]/.test(trimmed)) return fallback;
  return trimmed;
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// FUT-181 · LE SERVEUR N'ÉMET UN ÉVÉNEMENT DE MESURE QUE SI LE NAVIGATEUR A CONSENTI.
//
// Le serveur ne voit pas le choix de la bannière (il vit dans le stockage du navigateur). Le signal
// est donc l'identifiant de mesure lui-même : le navigateur ne le transmet QUE si la mesure est
// consentie et active (`identifiantMesure()` dans `mesure-audience.ts`). Sans identifiant, aucun
// événement de mesure produit : ni repli sur l'e-mail, ni sur l'UUID du compte, ni sur un
// identifiant de paiement, qui reconstitueraient la personne sans son accord.
//
// Ce n'est pas une preuve juridique de consentement (un client modifié peut envoyer n'importe quoi),
// c'est la garantie que le parcours normal sans consentement ne produit aucun événement serveur.
// ════════════════════════════════════════════════════════════════════════════════════════════

// Le champ caché des formulaires d'authentification (`ChampMesure`).
export const CHAMP_IDENTIFIANT_MESURE = "ph_distinct_id";

// La métadonnée Stripe qui dit que l'intention de paiement est née d'un navigateur consentant. Les
// intentions créées avant FUT-181 portaient `phDistinctId` = UUID du compte même sans consentement :
// sans ce marqueur, le webhook n'émet rien.
export const METADATA_MESURE_CONSENTIE = "phMesure";

export function identifiantMesureConsenti(input: unknown): string | null {
  return sanitizeDistinctId(input, "") || null;
}

// Le client de mesure quand rien ne doit partir : mêmes méthodes, aucun effet, aucun réseau.
const rien = () => {};
export const MESURE_MUETTE: { capture: (evenement: unknown) => void; shutdown: () => Promise<void> } = {
  capture: rien,
  shutdown: async () => {},
};
