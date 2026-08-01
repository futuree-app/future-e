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
  /** Intention de code de lancement. Le serveur le résout : le client ne fixe aucun montant. */
  promoCode?: string | null;
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
  promoCode,
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
    promoCode,
    phDistinctId: clientDistinctId(),
  });
  const requestKey = requestBody;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [clientSecretKey, setClientSecretKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  // LE NOM MANQUE SUR LE COMPTE. Le serveur refuse de créer le paiement tant qu'il ne peut pas
  // établir une facture nommée. On le demande ici, puis on rejoue : `retry` change, l'effet
  // repart. Un simple message d'erreur laisserait l'acheteur devant une impasse.
  const [needsName, setNeedsName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    fetch("/api/stripe/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: requestBody,
    })
      .then(async (response) => {
        const payload = await response.json();

        if (payload?.code === "BILLING_NAME_REQUIRED") {
          if (active) {
            setNeedsName(true);
            setClientSecret(null);
            setClientSecretKey(null);
            setError(null);
            setErrorKey(null);
          }
          return;
        }

        if (!response.ok || !payload.clientSecret) {
          throw new Error(payload.error ?? "Impossible d'initialiser le paiement.");
        }

        if (active) {
          setClientSecret(payload.clientSecret);
          setClientSecretKey(requestKey);
          setError(null);
          setErrorKey(null);
          setNeedsName(false);
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
  }, [requestBody, requestKey, retry]);

  if (needsName) {
    return (
      <form
        className="rounded-2xl border border-[var(--border-2)] bg-[var(--bg-elev)] p-6"
        onSubmit={async (e) => {
          e.preventDefault();
          setSavingName(true);
          setNameError(null);
          try {
            const res = await fetch("/api/account/billing-name", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ fullName: nameDraft }),
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error ?? "Enregistrement impossible.");
            setNeedsName(false);
            setRetry((n) => n + 1);
          } catch (err) {
            setNameError(err instanceof Error ? err.message : "Enregistrement impossible.");
          } finally {
            setSavingName(false);
          }
        }}
      >
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Dernière chose
        </p>
        <label htmlFor="billing-name" className="block text-[length:var(--text-body)] text-label mb-1.5">
          À quel nom établir votre facture&nbsp;?
        </label>
        <p className="text-[length:var(--text-dense)] text-muted leading-relaxed mb-4">
          Votre compte n&apos;en porte pas encore. Il figurera sur votre facture, rien
          d&apos;autre n&apos;en dépend.
        </p>
        <input
          id="billing-name"
          type="text"
          autoComplete="name"
          maxLength={120}
          required
          value={nameDraft}
          onChange={(e) => setNameDraft(e.target.value)}
          placeholder="Camille Rivière"
          className="w-full rounded-lg border border-[var(--border-2)] bg-[var(--bg-deep,#0f1424)] px-4 py-3 text-[15px] text-label outline-none focus:border-accent/60"
        />
        {nameError && (
          <p className="mt-3 text-[length:var(--text-dense)] text-red-300">{nameError}</p>
        )}
        <button
          type="submit"
          disabled={savingName}
          className="mt-4 rounded-lg bg-accent px-5 py-2.5 text-[14px] font-medium text-[#12172a] disabled:opacity-60"
        >
          {savingName ? "Enregistrement…" : "Continuer"}
        </button>
      </form>
    );
  }

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
            fontFamily: "var(--font-sans)",
            borderRadius: "8px",
          },
        },
      }}
    >
      <PaymentForm onSuccess={onSuccess} submitLabel={submitLabel} returnUrl={returnUrl} onSubmit={onSubmit} />
    </Elements>
  );
}
