"use client";

import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { stripePromise } from "@/lib/stripe-client";
import { PaymentForm } from "@/components/PaymentForm";

type PaymentWrapperProps = {
  amount: number;
  productType: string;
  onSuccess: () => void;
};

export function PaymentWrapper({
  amount,
  productType,
  onSuccess,
}: PaymentWrapperProps) {
  const requestKey = `${amount}:${productType}`;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, productType }),
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
  }, [amount, productType, requestKey]);

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
            colorPrimary: "#c8b89a",
            colorBackground: "#12172a",
            colorText: "#e9ecf2",
            colorDanger: "#f87171",
            fontFamily: "Instrument Sans, system-ui, sans-serif",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} />
    </Elements>
  );
}
