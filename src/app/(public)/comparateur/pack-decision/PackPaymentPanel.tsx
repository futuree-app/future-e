"use client";

import { PaymentWrapper } from "@/components/PaymentWrapper";
import type { ParsedProject } from "@/lib/comparateur-vie";

type Props = {
  trio: { insee: string; commune: string }[];
  projetLabel: string;
  parsedSnapshot: ParsedProject;
  returnUrl: string;
  submitLabel?: string;
};

// Panneau Stripe du Pack Décision. Stripe redirige vers returnUrl (la page de
// conviction) sur succès : c'est là que l'octroi optimiste a lieu (via ?payment_intent),
// pas dans un onSuccess client. Le webhook reste le filet de sécurité. onSuccess est
// laissé en no-op (rarement atteint, le cas sans redirection).
export function PackPaymentPanel({ trio, projetLabel, parsedSnapshot, returnUrl, submitLabel }: Props) {
  return (
    <PaymentWrapper
      amount={39}
      productType="pack-decision"
      submitLabel={submitLabel}
      returnUrl={returnUrl}
      pack={{ trio, projetLabel, parsedSnapshot }}
      onSuccess={() => {}}
    />
  );
}
