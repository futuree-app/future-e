// ════════════════════════════════════════════════════════════════════════════════════════════
// LA FACTURE, PARTIE PURE : ce qui s'écrit dessus, et comment ça se formate.
//
// Pas de `server-only` : ce module est pur et testé sous `node --test`. L'émission, elle, vit
// dans `src/lib/server/invoice-store.ts` (appel SQL) et dans le webhook Stripe.
//
// RÈGLE QUI GOUVERNE TOUT LE FICHIER : le montant facturé est celui que STRIPE déclare avoir
// encaissé, jamais un tarif lu dans un catalogue. Le dossier d'adresse a deux montants décidés
// côté serveur, et un code promotionnel en ajoutera un troisième. Une facture qui recalculerait
// le prix finirait par contredire l'encaissement, ce qui est le pire défaut possible sur une
// pièce comptable.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { LEGAL_ENTITY, legalAddressLine, legalNameWithForm } from "./legal-entity.ts";

/** Les produits facturables. Aligné sur `productType` des métadonnées Stripe. */
export type InvoiceProductType = "one-shot" | "pack-decision" | "address-dossier";

/**
 * DÉSIGNATION DE LA PRESTATION. Doit décrire ce qui a été vendu de façon qu'un tiers, un
 * comptable ou un agent, comprenne l'objet sans connaître le produit. Le nom commercial seul
 * (« Pack Décision ») ne le permet pas, on décrit donc la prestation.
 *
 * Le complément (une commune, une adresse) entre dans la désignation quand il existe : c'est ce
 * qui rend la facture vérifiable, et c'est aussi ce que le client reconnaîtra six mois plus tard.
 */
export function designationFor(
  productType: InvoiceProductType,
  subject: string | null,
  /**
   * Le tarif appliqué, quand il n'est pas le tarif public (« Tarif de lancement »). Il ENTRE dans
   * la désignation plutôt que de rester implicite : sans lui, une facture à 19 € pour un produit
   * affiché 39 € oblige à retrouver pourquoi, et c'est exactement la question qu'un comptable ou
   * un tiers pose en premier.
   */
  tariffLabel?: string | null,
): string {
  const base: Record<InvoiceProductType, string> = {
    "one-shot": "Rapport d'analyse territoriale d'une commune",
    "pack-decision": "Comparaison complète de plusieurs communes",
    "address-dossier": "Dossier d'analyse d'une adresse",
  };
  const s = subject?.trim();
  const t = tariffLabel?.trim();
  const core = s ? `${base[productType]} — ${s}` : base[productType];
  return t ? `${core} (${t})` : core;
}

// Les deux espaces de la typographie monétaire française, en ÉCHAPPEMENTS EXPLICITES. Les taper
// au clavier déposerait des caractères invisibles qu'aucune relecture ne distingue d'une espace
// ordinaire, et un test comparant deux littéraux visuellement identiques échouerait sans qu'on
// comprenne pourquoi (c'est arrivé en écrivant ce fichier).
const FINE_INSECABLE = "\u202f"; // séparateur de milliers, ce que rend aussi Intl en fr-FR
const INSECABLE = "\u00a0"; // avant le symbole monétaire

/**
 * Montant en centimes vers une somme en euros, typographie française.
 *
 * FORMATÉ À LA MAIN, PAS PAR `Intl`. La sortie d'`Intl` dépend de la version d'ICU du runtime :
 * acceptable sur un écran, non sur une pièce comptable, où le document rendu localement et celui
 * rendu sur Vercel doivent être identiques au caractère près.
 */
export function formatEuro(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100);
  const centimes = String(abs % 100).padStart(2, "0");
  const milliers = String(euros).replace(/\B(?=(\d{3})+(?!\d))/g, FINE_INSECABLE);
  return `${sign}${milliers},${centimes}${INSECABLE}\u20ac`;
}

/** Date au format long français, sans dépendance à `Intl` (rendu serveur et PDF). */
const MOIS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
export function formatDateFr(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * L'IDENTITÉ DU VENDEUR TELLE QU'ELLE SERA FIGÉE dans la colonne `seller`. Prise à l'émission,
 * jamais relue depuis le code au moment d'afficher une facture ancienne.
 */
export function sellerSnapshot() {
  return {
    legalName: LEGAL_ENTITY.legalName,
    legalForm: LEGAL_ENTITY.legalForm,
    tradeName: LEGAL_ENTITY.tradeName,
    nameWithForm: legalNameWithForm(),
    siret: LEGAL_ENTITY.siret,
    apeCode: LEGAL_ENTITY.apeCode,
    address: legalAddressLine(),
    email: LEGAL_ENTITY.contactEmail,
  };
}

export type SellerSnapshot = ReturnType<typeof sellerSnapshot>;

/** Une facture telle qu'elle se lit, quelle que soit sa provenance (base ou émission fraîche). */
export type Invoice = {
  number: string;
  issuedAt: string;
  buyerName: string;
  buyerEmail: string;
  seller: SellerSnapshot;
  designation: string;
  amountCents: number;
  vatMention: string;
};

/**
 * NOM DE FACTURATION. Le nom déclaré par le client sur son compte. Vide chez les comptes créés
 * avant que l'inscription ne le demande, et chez certains comptes Google : dans ce cas la facture
 * NE S'ÉMET PAS, on demande le nom avant le paiement. Émettre une facture « à l'ordre de
 * quentin@exemple.fr » produirait une pièce non conforme, donc inutile là où elle sert.
 */
export function normalizeBuyerName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const s = raw.trim().replace(/\s+/g, " ");
  // Deux caractères au moins, et au moins une lettre : « . » ou « - » ne nomment personne.
  if (s.length < 2 || !/\p{L}/u.test(s)) return null;
  return s.slice(0, 120);
}

/** Le nom du fichier remis au client. Lisible, daté, sans espace. */
export function invoiceFileName(number: string): string {
  return `futur-e-facture-${number}.pdf`;
}
