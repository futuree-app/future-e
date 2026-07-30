"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { PaymentForm } from "@/components/PaymentForm";

// L'identité de mesure du navigateur, transmise au serveur pour qu'il émette SOUS LA MÊME
// PERSONNE. Sans elle, les événements de paiement appartiennent à quelqu'un d'autre que le
// parcours qui les a produits. Même patron que `ou-vivre` et `comparateur-vie/ask`.
function clientDistinctId(): string | undefined {
  try {
    return posthog.get_distinct_id?.() ?? undefined;
  } catch {
    return undefined;
  }
}

// Territoire ciblé optionnel (parcours comparateur). Sans lui, l'achat porte
// sur la commune de résidence (comportement historique du checkout).
type PaymentGrant = {
  targetInsee: string;
  targetCommune: string | null;
  source: string;
  rank: number | null;
};

type PaymentWrapperProps = {
  amount: number;
  productType: string;
  onSuccess: () => void;
  grant?: PaymentGrant;
  submitLabel?: string;
  pack?: {
    trio: { insee: string; commune: string }[];
    projetLabel: string;
    mode?: "replay" | "choix";
    parsedSnapshot?: unknown; // absent en mode choix
  };
  returnUrl?: string;
  onSubmit?: () => void; // intention de paiement (clic), pour l'instrumentation. cf. PaymentForm.
  // Dossier d'adresse : l'adresse sélectionnée (revalidée côté serveur de toute façon) et la clé
  // d'idempotence de la tentative, générée par la page de checkout.
  address?: unknown;
  checkoutAttemptId?: string;
};

export function PaymentWrapper({
  amount,
  productType,
  onSuccess,
  grant,
  submitLabel,
  pack,
  returnUrl,
  onSubmit,
  address,
  checkoutAttemptId,
}: PaymentWrapperProps) {
  // `requestBody` sert aussi de `requestKey` au useEffect : toutes les valeurs ci-dessous sont
  // stables pour un rendu de page (le distinct_id l'est pour une session), donc le PaymentIntent
  // n'est demandé qu'une fois.
  const requestBody = JSON.stringify({
    amount,
    productType,
    targetInsee: grant?.targetInsee,
    targetCommune: grant?.targetCommune,
    source: grant?.source,
    rank: grant?.rank,
    pack,
    address,
    checkoutAttemptId,
    phDistinctId: clientDistinctId(),
  });
  const requestKey = requestBody;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (!response.ok || !payload.clientSecret) {
          throw new Error(payload.error ?? "Impossible d'initialiser le paiement.");
        }

        if (active) {
          setClientSecret(payload.clientSecret);
          setClientSecretKey(requestKey);
          setError(null);
          setErrorKey(null);
        }
      })
      .catch((requestError: unknown) => {
        if (!active) {
          return;
        }

        const message =
          requestError instanceof Error
            ? requestError.message
            : "Impossible d'initialiser le paiement.";

        setClientSecret(null);
        setClientSecretKey(null);
        setError(message);
        setErrorKey(requestKey);
      });

    return () => {
      active = false;
    };
  }, [requestBody, requestKey]);

  if (error && errorKey === requestKey) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/8 p-6 text-sm text-red-200">
        {error}
      </div>
    );
  }

  if (!clientSecret || clientSecretKey !== requestKey) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="animate-pulse font-mono text-sm tracking-wider text-[var(--fg-4)] uppercase">
          Chargement…
        </span>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "night",
          variables: {
            colorPrimary: "#fb923c",
            colorBackground: "#12172a",
            colorText: "#e9ecf2",
            colorDanger: "#f87171",
            fontFamily: "Instrument Sans, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} submitLabel={submitLabel} returnUrl={returnUrl} onSubmit={onSubmit} />
    </Elements>
  );
}
