// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONSENTEMENT À LA MESURE, LU À LA SOURCE (FUT-94).
//
// `ConsentBanner` enregistre le choix du lecteur dans `localStorage["futuree-consent"]` : "granted" ou
// "denied". Il ne pilote aujourd'hui QUE Google (Consent Mode) : PostHog est initialisé sans condition
// par `PostHogProvider`, défaut global antérieur à FUT-94 et traité à part (voir
// docs/audits/2026-11-09-fut94-retour-utilite.md, « Consentement PostHog »).
//
// En attendant, un appel de mesure NOUVEAU ne part que si ce prédicat est vrai. Seule la valeur
// explicite "granted" vaut consentement : absente, "denied", illisible (navigation privée, stockage
// bloqué) ou hors navigateur, la réponse est non. Un test vérifie que la clé et les valeurs sont
// celles qu'écrit la bannière.
// ════════════════════════════════════════════════════════════════════════════════════════════

export const CLE_CONSENTEMENT = "futuree-consent";

export function mesureAutorisee(stockage?: Pick<Storage, "getItem"> | null): boolean {
  try {
    const s = stockage ?? (typeof window !== "undefined" ? window.localStorage : null);
    return s?.getItem(CLE_CONSENTEMENT) === "granted";
  } catch {
    return false;
  }
}
