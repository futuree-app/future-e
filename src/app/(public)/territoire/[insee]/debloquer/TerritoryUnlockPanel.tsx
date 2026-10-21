"use client";

import { useRouter } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";

type Props = {
  insee: string;
  /** Le nom officiel du code, résolu par la page côté serveur (FUT-119) : jamais un nom venu de l'URL. */
  commune: string;
  rank: number | null;
  amount: number;
  submitLabel?: string;
};

// Panneau de paiement d'un dossier de territoire ciblé sur une commune explorée.
// Les deux retours (redirection Stripe et callback) attendent les droits du webhook.
export function TerritoryUnlockPanel({ insee, commune, rank, amount, submitLabel }: Props) {
  const router = useRouter();
  const returnUrl = `/territoire/${insee}/ouvrir`;

  return (
    <>
      <PaymentWrapper
        amount={amount}
        productType="one-shot"
        submitLabel={submitLabel}
        returnUrl={returnUrl}
        grant={{ targetInsee: insee, targetCommune: commune, source: "comparateur_vie", rank }}
        onSuccess={() => router.push(returnUrl)}
      />
    </>
  );
}
