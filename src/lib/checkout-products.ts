export type CheckoutProductSlug = "rapport-complet" | "suivi";

export type CheckoutProduct = {
  slug: CheckoutProductSlug;
  title: string;
  subtitle: string;
  amount: number;
  priceLabel: string;
  productType: "one-shot" | "suivi-solo";
  ctaLabel: string;
  features: string[];
};

export const CHECKOUT_PRODUCTS: Record<CheckoutProductSlug, CheckoutProduct> = {
  "rapport-complet": {
    slug: "rapport-complet",
    title: "Rapport complet",
    subtitle:
      "Le rapport intégral, à conserver, avec ses six modules et un accès lecture seule au dashboard.",
    amount: 14,
    priceLabel: "14 € une fois",
    productType: "one-shot",
    ctaLabel: "Payer 14 €",
    features: [
      "Rapport complet PDF",
      "6 modules d'analyse",
      "Dashboard simplifié en lecture seule",
      "Les 14 € seront déduits à l'ouverture du Suivi (prochainement)",
    ],
  },
  suivi: {
    slug: "suivi",
    title: "Suivi",
    subtitle:
      "Le rapport devient vivant : dashboard interactif, profil modifiable, alertes et mises à jour ciblées.",
    amount: 9,
    priceLabel: "9 €",
    productType: "suivi-solo",
    ctaLabel: "Activer le Suivi",
    features: [
      "Dashboard complet et interactif",
      "Profil modifiable à tout moment",
      "Newsletter mensuelle personnalisée",
      "Notifications ciblées sur les événements",
    ],
  },
};

export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet" || slug === "suivi") {
    return CHECKOUT_PRODUCTS[slug];
  }

  return null;
}
