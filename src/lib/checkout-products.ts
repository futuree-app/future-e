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

// LE SLUG NE SUIT PAS LE NOM COMMERCIAL, et c'est délibéré. « rapport-complet » est écrit dans les
// metadata des PaymentIntent Stripe déjà émis et relu par le webhook (`api/stripe/webhook`) pour
// décider quel droit poser. Le renommer casserait la relecture des paiements passés et l'URL
// /checkout/rapport-complet déjà indexée. Le slug est un identifiant technique, le `title` est ce
// que le lecteur voit : les deux ont cessé de coïncider le 04/08/2026, quand le produit d'entrée a
// arrêté de s'appeler « complet » alors qu'il est la première des trois échelles.
export const CHECKOUT_PRODUCTS: Record<CheckoutProductSlug, CheckoutProduct> = {
  "rapport-complet": {
    slug: "rapport-complet",
    title: "Dossier de territoire",
    subtitle:
      "Ce que devient une commune, lu depuis votre projet. La première des trois échelles.",
    amount: 14,
    priceLabel: "14 € une fois",
    productType: "one-shot",
    ctaLabel: "Ouvrir le dossier de territoire",
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
      // Ajoutée le 04/08/2026 : l'escalier était CODÉ dans `dossier-pricing.ts` (les 14 € sont
      // déduits des 39 € du dossier d'adresse) et affiché nulle part. Le lecteur pouvait croire
      // qu'acheter le territoire d'abord lui coûterait 53 € au total.
      "Déduit des 39 € si vous ouvrez ensuite le dossier d'adresse de cette commune",
    ],
  },
};

export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet") {
    return CHECKOUT_PRODUCTS[slug];
  }

  return null;
}
