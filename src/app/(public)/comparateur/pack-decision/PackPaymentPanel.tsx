"use client";

import posthog from "posthog-js";
import { PaymentWrapper } from "@/components/PaymentWrapper";
import type { ParsedProject } from "@/lib/comparateur-vie";

type Props = {
  trio: { insee: string; commune: string }[];
  projetLabel: string;
  // replay : snapshot du projet requis ; choix : communes nommées, pas de projet.
  mode?: "replay" | "choix";
  parsedSnapshot?: ParsedProject;
  returnUrl: string;
  submitLabel?: string;
};

// Panneau Stripe du Pack Décision. Stripe redirige vers returnUrl (la page de
// conviction) sur succès : c'est là que l'octroi optimiste a lieu (via ?payment_intent),
// pas dans un onSuccess client. Le webhook reste le filet de sécurité. onSuccess est
// laissé en no-op (rarement atteint, le cas sans redirection).
export function PackPaymentPanel({ trio, projetLabel, mode = "replay", parsedSnapshot, returnUrl, submitLabel }: Props) {
  return (
    <PaymentWrapper
      amount={39}
      productType="pack-decision"
      submitLabel={submitLabel}
      returnUrl={returnUrl}
      pack={{ trio, projetLabel, mode, parsedSnapshot }}
      onSubmit={() =>
        posthog.capture("pack_payment_submitted", {
          mode,
          n: trio.length,
          insees: trio.map((t) => t.insee),
        })
      }
      onSuccess={() => {}}
    />
  );
}
