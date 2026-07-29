export type CheckoutProductSlug = "rapport-complet";

export type CheckoutProduct = {
  slug: CheckoutProductSlug;
  title: string;
  subtitle: string;
  amount: number;
  priceLabel: string;
  productType: "one-shot";
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
      // « qui s'enrichit au fil des prochains modules » a été retiré le 30/07/2026. La ligne
      // promettait que les modules à venir tomberaient dans cet achat, ce que le découpage tranché
      // contredit : les échelles Autour et Logement demandent un dossier d'adresse, qui se paie.
      // Une promesse d'enrichissement gratuit dans le produit le moins cher rendrait tout achat
      // ultérieur illégitime aux yeux de qui l'a lue.
      "À conserver, et régénérable une fois par an",
    ],
  },
};

export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet") {
    return CHECKOUT_PRODUCTS[slug];
  }

  return null;
}
