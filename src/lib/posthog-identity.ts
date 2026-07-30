// Le distinct_id de PostHog voyage du navigateur au serveur, puis jusqu'au webhook par les
// métadonnées Stripe.
//
// SANS LUI, LES ÉVÉNEMENTS SERVEUR CRÉENT UNE SECONDE PERSONNE. Le navigateur identifie sur l'UUID
// Supabase (`PostHogProvider.tsx`, `identify(user.id)`) tandis que les routes émettaient sur
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
