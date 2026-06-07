export type CheckoutProductSlug = "rapport-complet" | "suivi" | "pack-decision";

export type CheckoutProduct = {
  slug: CheckoutProductSlug;
  title: string;
  subtitle: string;
  amount: number;
  priceLabel: string;
  productType: "one-shot" | "suivi-solo" | "pack-decision";
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
  suivi: {
    slug: "suivi",
    title: "Suivi",
    subtitle:
      "Le rapport interactif devient vivant : dashboard évolutif, profil modifiable, alertes et mises à jour ciblées.",
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
  "pack-decision": {
    slug: "pack-decision",
    title: "Pack Décision",
    subtitle:
      "L'arbitrage entre trois territoires : la comparaison complète, leurs trois rapports, et trois nouvelles pistes.",
    amount: 39,
    priceLabel: "39 € une fois",
    productType: "pack-decision",
    ctaLabel: "Débloquer le Pack Décision",
    features: [
      "La comparaison complète des trois territoires, thème par thème",
      "Les trois rapports complets, un par commune",
      "Trois nouvelles pistes sur le même projet",
      "AskFuture : 9 questions incluses",
    ],
  },
};

export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet" || slug === "suivi" || slug === "pack-decision") {
    return CHECKOUT_PRODUCTS[slug];
  }

  return null;
}
