"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type PaymentFormProps = {
  onSuccess: () => void;
  submitLabel?: string;
  returnUrl?: string;
  // Optionnel : intention de paiement (clic sur le bouton payer), AVANT confirmation Stripe.
  // Sert l'instrumentation du funnel ; no-op si non fourni (rétrocompatible).
  onSubmit?: () => void;
};

export function PaymentForm({ onSuccess, submitLabel, returnUrl, onSubmit }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(); // intention de paiement (clic), avant toute logique Stripe

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

    // STRIPE EXIGE UNE URL ABSOLUE. Un chemin relatif fait échouer la confirmation avec
    // « Not a valid URL », et l'erreur s'affiche à la place du formulaire, donc rien ne se paie.
    // Le repli historique était déjà absolu, ce qui a caché le piège jusqu'au premier appelant qui
    // a passé un chemin (le dossier d'adresse, 30/07/2026). La normalisation vit ICI, au seul
    // endroit qui parle à Stripe, pour qu'aucun appelant futur n'ait à y penser.
    const absoluteReturnUrl = new URL(returnUrl ?? "/merci", window.location.origin).toString();

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: absoluteReturnUrl,
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
          borderTop: "1px solid var(--border-1)",
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
            fontFamily: "var(--font-sans)",
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
