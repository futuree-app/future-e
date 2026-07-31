// ════════════════════════════════════════════════════════════════════════════════════════════
// LES CODES DE LANCEMENT.
//
// UNE TABLE EN DUR, PAS UNE TABLE EN BASE. Il y a un code, un montant, une date de fin. Une table
// SQL demanderait une migration, un écran d'administration et une politique d'accès pour gérer
// une seule ligne. Le jour où les codes deviennent nombreux ou créés à la volée, ce fichier sera
// remplacé par une table ; d'ici là il est plus lisible, versionné avec le code, et son historique
// se lit dans git.
//
// LE CODE NE VIT QUE CÔTÉ SERVEUR. Il n'est jamais inclus dans un bundle client : le navigateur
// envoie ce que la personne a saisi, le serveur décide. Un client qui inventerait un montant ne
// changerait rien, `quoteForDossier` recalcule tout.
//
// ── LE MONTANT EST UN PLANCHER, PAS UNE REMISE ────────────────────────────────────────────────
// C'est la règle qui casse silencieusement si on l'oublie. `quoteForDossier` retire déjà 14 € au
// compte qui a payé le territoire de la commune. Si le code était un rabais supplémentaire, un
// proche ayant déjà payé une commune tomberait à 0 € : Stripe refuse en dessous de 50 centimes, et
// surtout un encaissement nul ne prouve rien, ce qui est exactement le contraire de ce qu'on
// cherche. Dix-neuf euros restent dix-neuf euros, territoire payé ou non.
//
// ── POURQUOI 19 € ET PAS 14 € ─────────────────────────────────────────────────────────────────
// Décision porteur du 30/07/2026. Quatorze euros est déjà le prix du rapport de territoire : au
// même montant, les deux produits deviennent indiscernables par le prix, et il faudrait expliquer
// pourquoi le dossier d'une adresse coûte autant que le rapport d'une commune. Dix-neuf euros se
// raconte comme un tarif de lancement, et une vente à ce prix prouve une disposition à payer là
// où neuf euros prouveraient surtout une complaisance.
//
// ── POURQUOI UNE DATE DE FIN ──────────────────────────────────────────────────────────────────
// Un tarif de lancement sans fin devient le prix.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type PromoCode = {
  /** Le code tel qu'il est communiqué, en majuscules. La saisie est comparée sans casse. */
  code: string;
  /** Ce que le client paie, quoi qu'il arrive. Un PLANCHER, jamais une remise cumulable. */
  amountCents: number;
  /** Ce qui s'écrit sur la facture, à côté de la prestation. */
  label: string;
  /**
   * Dernier instant de validité, inclus. Fuseau de Paris explicite : un `Z` ferait expirer le code
   * deux heures trop tôt pour quelqu'un qui achète le 30 septembre au soir.
   */
  validUntil: string;
  /** Les produits concernés. Le dossier d'adresse seul : c'est lui qu'on fait tester. */
  products: readonly string[];
};

const CODES: readonly PromoCode[] = [
  {
    code: "BETA",
    amountCents: 1900,
    label: "Tarif de lancement",
    validUntil: "2026-09-30T23:59:59.999+02:00",
    products: ["address-dossier"],
  },
];

/**
 * Résout un code saisi. Rend `null` si le code est inconnu, expiré, ou ne concerne pas ce produit.
 *
 * `now` est un paramètre pour que la fonction reste PURE et testable : une fonction qui lit
 * l'horloge ne peut pas être testée sur sa date d'expiration, qui est précisément la chose à
 * tester.
 */
export function resolvePromo(
  raw: unknown,
  productType: string,
  now: Date,
): PromoCode | null {
  if (typeof raw !== "string") return null;
  const needle = raw.trim().toUpperCase();
  if (!needle) return null;

  const found = CODES.find((c) => c.code === needle);
  if (!found) return null;
  if (!found.products.includes(productType)) return null;
  if (now.getTime() > new Date(found.validUntil).getTime()) return null;
  return found;
}

/** Le code est-il connu, indépendamment de sa validité ? Sert à distinguer « expiré » d'« inconnu ». */
export function promoExists(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const needle = raw.trim().toUpperCase();
  return CODES.some((c) => c.code === needle);
}
