"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";

type PaymentFormProps = {
  onSuccess: () => void;
  submitLabel?: string;
  returnUrl?: string;
  // Optionnel : intention de paiement (clic sur le bouton payer), AVANT confirmation Stripe.
  // Sert l'instrumentation du funnel ; no-op si non fourni (rétrocompatible).
  onSubmit?: () => void;
  /**
   * Ce que le COMPTE porte déjà. L'acheteur venait de créer son compte avec son nom et son e-mail,
   * et cet écran les redemandait à l'identique : Stripe ne connaît pas notre session, et personne
   * ne les lui passait. Ils PRÉREMPLISSENT les champs, ils ne les remplacent pas : l'acheteur reste
   * libre de facturer à un autre nom, et le serveur garde la main sur ce qui part sur la facture.
   */
  billing?: { name: string | null; email: string | null } | null;
};

export function PaymentForm({ onSuccess, submitLabel, returnUrl, onSubmit, billing }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // L'ACCORD QUI REND L'ACCÈS IMMÉDIAT LÉGAL (04/08/2026). Voir le bloc explicatif au rendu.
  const [consent, setConsent] = useState(false);
  const consentId = useId();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit?.(); // intention de paiement (clic), avant toute logique Stripe

    if (!stripe || !elements) {
      return;
    }
    // Garde-fou côté logique, en plus du bouton désactivé : un formulaire peut être soumis au
    // clavier, et l'accord doit être vrai au moment où l'on parle à Stripe, pas seulement à
    // l'instant où le bouton a été peint.
    if (!consent) {
      setError("Cochez la case au-dessus pour accepter les conditions générales de vente.");
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
          // Les champs que Stripe demande sont préremplis avec ce que le compte sait déjà. Les
          // valeurs vides sont OMISES : passer une chaîne vide écraserait ce que Stripe aurait pu
          // retrouver autrement (un moyen de paiement enregistré, par exemple).
          defaultValues: {
            billingDetails: {
              ...(billing?.name ? { name: billing.name } : {}),
              ...(billing?.email ? { email: billing.email } : {}),
            },
          },
        }}
      />

      {error ? (
        <p className="font-mono text-sm text-red-400">{error}</p>
      ) : null}

      {/* L'ACCEPTATION DES CONDITIONS DE VENTE.
          ══════════════════════════════════════════════════════════════════════════════════════
          CE QUE CETTE CASE NE RECUEILLE PLUS, ET CE QUE ÇA CHANGE (13/08/2026, décision porteur).
          Elle portait deux accords : la demande d'exécution immédiate, et le renoncement exprès au
          droit de rétractation. Ensemble, ils font jouer l'exception de l'article L221-28 13° du
          code de la consommation pour un contenu numérique fourni tout de suite.

          Le porteur a choisi de n'y laisser que l'acceptation des CGV. Conséquence assumée, et
          écrite ici pour que personne ne la redécouvre par un litige : l'exception ne joue pas, et
          l'acheteur CONSERVE ses quatorze jours de rétractation, dossier consulté ou non.

          LES TROIS AUTRES TEXTES ONT SUIVI LE MÊME JOUR, sans quoi le produit se contredirait :
          la section 6 des CGV, qui décrivait le renoncement ; le message de confirmation d'achat,
          qui affirmait que l'acheteur y avait consenti ; et le renvoi de facture. Un document qui
          affirme une renonciation que rien ne recueille se retourne contre celui qui l'écrit.

          ELLE VIT ICI, au seul composant qui parle à Stripe, et non dans les quatre panneaux
          d'achat : un cinquième parcours arriverait sans elle. */}
      <label
        htmlFor={consentId}
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          padding: "14px 16px",
          borderRadius: 10,
          border: `1px solid ${consent ? "var(--orange)" : "var(--border-2)"}`,
          background: "var(--bg-elev)",
          cursor: "pointer",
          transition: "border-color 0.15s",
        }}
      >
        <input
          id={consentId}
          type="checkbox"
          checked={consent}
          onChange={(e) => {
            setConsent(e.target.checked);
            if (e.target.checked) setError(null);
          }}
          style={{ marginTop: 3, width: 16, height: 16, accentColor: "var(--orange)", flexShrink: 0 }}
        />
        <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--fg-2)" }}>
          J&apos;accepte les{" "}
          <Link
            href="/conditions-generales-de-vente"
            target="_blank"
            style={{ color: "var(--orange-ink)", textDecoration: "underline" }}
            onClick={(e) => e.stopPropagation()}
          >
            conditions générales de vente
          </Link>
          .
        </span>
      </label>

      <div
        style={{
          marginTop: 8,
          paddingTop: 16,
          borderTop: "1px solid var(--border-1)",
        }}
      >
        <button
          type="submit"
          disabled={!stripe || loading || !consent}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 8,
            background: loading ? "rgba(232, 130, 58, 0.5)" : "var(--orange)",
            color: "#060812",
            fontFamily: "var(--font-sans)",
            fontSize: 15,
            fontWeight: 600,
            border: "none",
            // L'ÉTAT DÉSACTIVÉ DOIT SE VOIR. `opacity` ne regardait que `stripe` : avec la case
            // décochée, le bouton restait plein et cliquable à l'œil, et l'acheteur cliquait sans
            // comprendre pourquoi rien ne se passait. Un bouton qui refuse doit le dire avant.
            cursor: loading ? "wait" : (!stripe || !consent) ? "not-allowed" : "pointer",
            opacity: (!stripe || !consent) ? 0.5 : 1,
            transition: "opacity 0.15s, background 0.15s",
          }}
        >
          {loading ? "Traitement…" : (submitLabel ?? "Payer")}
        </button>
      </div>
    </form>
  );
}
