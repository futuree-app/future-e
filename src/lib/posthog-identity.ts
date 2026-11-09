// Le distinct_id de PostHog voyage du navigateur au serveur, dans la requête que le navigateur
// consentant fait lui-même. Il ne va pas plus loin : ni Stripe, ni webhook (contre-revue FUT-181).
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

// Aucun identifiant de mesure n'est confié à Stripe : le webhook, qui arrive sans navigateur et parfois
// après un retrait du consentement, n'émet aucun événement de mesure (contre-revue FUT-181).

export function identifiantMesureConsenti(input: unknown): string | null {
  return sanitizeDistinctId(input, "") || null;
}

// Le client de mesure quand rien ne doit partir : mêmes méthodes, aucun effet, aucun réseau.
const rien = () => {};
export const MESURE_MUETTE: { capture: (evenement: unknown) => void; shutdown: () => Promise<void> } = {
  capture: rien,
  shutdown: async () => {},
};

// ════════════════════════════════════════════════════════════════════════════════════════════════
// TÉLÉMÉTRIE DU MODÈLE `/qna` (`$ai_generation`) : COUPÉE PAR DÉFAUT (contre-revue FUT-181).
//
// Elle ne dépend pas du consentement navigateur : identifiant constant « anonymous », aucun profil
// (`$process_person_profile: false`), géolocalisation désactivée (`$geoip_disable`, défaut de
// posthog-node), émise depuis le serveur (l'adresse IP vue par PostHog est celle de l'hébergeur).
// Elle porte la commune consultée et le module, à l'heure près : ce n'est pas une anonymisation
// garantie, seulement l'absence de rattachement à une personne dans PostHog.
//
// Son fondement (intérêt légitime ou consentement) appartient au responsable du traitement. Tant
// qu'il n'est pas validé, rien ne part vers PostHog ; la variable `QNA_TELEMETRIE_POSTHOG=1` la
// rallume, sans changement de code. Le diagnostic interne (journal serveur) reste dans tous les cas.
// ════════════════════════════════════════════════════════════════════════════════════════════════
export function telemetrieQnaPostHogActive(env: Record<string, string | undefined> = process.env): boolean {
  return env.QNA_TELEMETRIE_POSTHOG === "1";
}
