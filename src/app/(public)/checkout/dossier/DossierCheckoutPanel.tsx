"use client";

import { useRouter } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";

type Address = {
  banId: string;
  label: string;
  postcode: string;
  city: string;
  citycode: string;
  latitude: number;
  longitude: number;
  type: string | null;
};

export function DossierCheckoutPanel({
  address,
  quote,
  userEmail,
  checkoutAttemptId,
}: {
  address: Address;
  quote: { basePriceCents: number; territoryDeductionCents: number; amountDueCents: number };
  userEmail: string | null | undefined;
  checkoutAttemptId: string;
}) {
  const router = useRouter();
  const eur = (cents: number) => `${Math.round(cents / 100)} €`;

  return (
    <div className="glass rounded-xl p-6">
      <p className="text-[19px] text-label mb-1">{eur(quote.amountDueCents)}</p>

      {quote.territoryDeductionCents > 0 && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          Vous avez déjà la lecture de {address.city} : {eur(quote.territoryDeductionCents)} déduits
          des {eur(quote.basePriceCents)}.
        </p>
      )}

      <p className="text-[14px] text-muted leading-relaxed mb-6">
        Paiement rattaché à <span className="text-label">{userEmail}</span>. TVA non applicable,
        art. 293 B du CGI.
      </p>

      <PaymentWrapper
        // `amount` n'est qu'un AFFICHAGE : le montant facturé est recalculé côté serveur par
        // `quoteForDossier`, donc un client qui modifierait cette valeur ne changerait rien.
        amount={quote.amountDueCents / 100}
        productType="address-dossier"
        address={address}
        // Généré à chaque rendu de la page serveur : un double clic réutilise la même valeur,
        // puisqu'elle vit dans les props, tandis qu'un retour explicite sur cette page ouvre une
        // tentative neuve. C'est la frontière voulue entre doublon technique et second achat
        // légitime, le produit autorisant plusieurs dossiers à la même adresse.
        checkoutAttemptId={checkoutAttemptId}
        returnUrl="/dossier/merci"
        onSuccess={() => router.push("/dossier/merci")}
      />
    </div>
  );
}
