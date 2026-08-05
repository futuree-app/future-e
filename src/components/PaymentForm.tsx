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
};

export function PaymentForm({ onSuccess, submitLabel, returnUrl, onSubmit }: PaymentFormProps) {
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
      setError(
        "Cochez la case au-dessus pour demander l'ouverture immédiate de votre dossier.",
      );
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

      {/* L'ACCORD PRÉALABLE, ET IL EST OBLIGATOIRE (04/08/2026).
          ══════════════════════════════════════════════════════════════════════════════════════
          Un achat à distance ouvre quatorze jours de rétractation. L'article L221-28 13° du code
          de la consommation en dispense les contenus numériques fournis immédiatement, mais à
          trois conditions cumulatives : accord exprès pour l'exécution immédiate, renoncement
          exprès au droit de rétractation, et confirmation écrite sur support durable.

          SANS CETTE CASE, L'EXCEPTION NE JOUE PAS, et un acheteur peut lire son dossier puis se
          faire rembourser pendant quatorze jours. Les CGV décriraient un mécanisme qui n'existe
          pas, ce qui est pire que de ne rien écrire.

          UNE SEULE CASE POUR LES DEUX ACCORDS, parce que le texte les lie : demander l'exécution
          immédiate EST ce qui fait perdre la rétractation. Deux cases feraient croire à deux
          décisions séparées, dont l'une serait refusable sans conséquence.

          ELLE VIT ICI, au seul composant qui parle à Stripe, et non dans les quatre panneaux
          d'achat : un cinquième parcours arriverait sans elle.

          RESTE À FAIRE, et ce n'est pas optionnel : la confirmation sur support durable. La
          facture émise au webhook doit porter la mention de cet accord. Tant que ce n'est pas le
          cas, la troisième condition n'est pas remplie. */}
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
        {/* LE LIBELLÉ DIT LA MISE À DISPOSITION, PAS LA LECTURE (05/08/2026).
            « en l'obtenant tout de suite je renonce » laissait entendre que le droit se perdait en
            consultant le dossier. Il se perd au COMMENCEMENT DE LA FOURNITURE : un dossier ouvert
            dans le compte et jamais consulté n'est déjà plus rétractable. La case et la section 6
            des CGV doivent dire exactement la même chose, sinon l'acheteur a consenti à autre chose
            que ce qu'il a lu. */}
        <span style={{ fontSize: 13, lineHeight: 1.6, color: "var(--fg-2)" }}>
          Je demande que mon dossier soit mis à disposition{" "}
          <strong>immédiatement</strong> après le paiement, et je reconnais que je perds mon droit
          de rétractation de quatorze jours dès cette mise à disposition, que je consulte le dossier
          ou non. J&apos;accepte les{" "}
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
