export type CheckoutProductSlug = "rapport-complet" | "le-fil";

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
    title: "Rapport interactif",
    subtitle:
      "Une lecture interactive de ce que le territoire devient, à conserver et à enrichir.",
    amount: 14,
    priceLabel: "14 € une fois",
    productType: "one-shot",
    ctaLabel: "Débloquer le rapport",
    features: [
      "La lecture du territoire : ce qu'il devient face au climat (canicule, inondation, sécheresse)",
      "Les sources publiques croisées et rendues lisibles pour cette commune",
      "AskFuture : 3 questions pour approfondir le territoire",
      "À conserver, et qui s'enrichit au fil des prochains modules",
    ],
  },
  "le-fil": {
    slug: "le-fil",
    title: "Le Fil",
    subtitle:
      "Le rapport interactif devient vivant : dashboard évolutif, profil modifiable, alertes et mises à jour ciblées.",
    amount: 9,
    priceLabel: "9 €",
    productType: "suivi-solo",
    ctaLabel: "Activer Le Fil",
    features: [
      "Dashboard complet et interactif",
      "Profil modifiable à tout moment",
      "Newsletter mensuelle personnalisée",
      "Notifications ciblées sur les événements",
    ],
  },
};

export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet" || slug === "le-fil") {
    return CHECKOUT_PRODUCTS[slug];
  }

  return null;
}
