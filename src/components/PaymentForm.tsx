"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type PaymentFormProps = {
  onSuccess: () => void;
};

export function PaymentForm({ onSuccess }: PaymentFormProps) {
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
        return_url: `${window.location.origin}/merci`,
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
      <PaymentElement />

      {error ? (
        <p className="font-mono text-sm text-red-400">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full rounded-lg bg-[var(--accent)] px-4 py-4 font-medium text-[var(--bg)] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Traitement…" : "Payer"}
      </button>
    </form>
  );
}
