"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type PaymentFormProps = {
  onSuccess: () => void;
  submitLabel?: string;
  returnUrl?: string;
};

export function PaymentForm({ onSuccess, submitLabel, returnUrl }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setError(submitError.message ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl ?? `${window.location.origin}/merci`,
      },
    });

    if (confirmError) {
      setError(confirmError.message ?? "Une erreur est survenue.");
      setLoading(false);
      return;
    }

    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <PaymentElement
        options={{
          layout: {
            type: "accordion",
            defaultCollapsed: false,
            spacedAccordionItems: false,
          },
        }}
      />

      {error ? (
        <p className="font-mono text-sm text-red-400">{error}</p>
      ) : null}

      <div
        style={{
          marginTop: 8,
          paddingTop: 16,
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <button
          type="submit"
          disabled={!stripe || loading}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 8,
            background: loading ? "rgba(251,146,60,0.5)" : "#fb923c",
            color: "#060812",
            fontFamily: "Instrument Sans, system-ui, sans-serif",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            cursor: loading ? "wait" : "pointer",
            opacity: !stripe ? 0.5 : 1,
            transition: "opacity 0.15s, background 0.15s",
          }}
        >
          {loading ? "Traitement…" : (submitLabel ?? "Payer")}
        </button>
      </div>
    </form>
  );
}
