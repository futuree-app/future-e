"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// FUT-115 : Stripe n'a pas encore confirmé le paiement, ou l'a confirmé sans que les droits soient encore
// écrits. La page se recharge : le serveur relit le paiement chez Stripe à chaque passage, et le comparatif
// s'affiche dès qu'il est ouvert (par cette page ou par le webhook). Au bout d'une trentaine de secondes, une
// issue explicite plutôt qu'une attente sans fin. Aucune phrase n'affirme un comparatif qui n'est pas ouvert.
export function PackPaiementEnAttente() {
  const router = useRouter();
  const [lent, setLent] = useState(false);

  useEffect(() => {
    const debut = Date.now();
    const id = setInterval(() => {
      if (Date.now() - debut > 30_000) {
        setLent(true);
        clearInterval(id);
        return;
      }
      router.refresh();
    }, 3000);
    return () => clearInterval(id);
  }, [router]);

  return (
    <section style={{ maxWidth: 640, margin: "48px auto", textAlign: "left" }} aria-live="polite">
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          margin: "0 0 8px",
        }}
      >
        Paiement en cours de confirmation
      </p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: 32, lineHeight: 1.2, color: "var(--fg-hi)", margin: "0 0 16px" }}>
        Merci.
      </h1>
      <p style={{ fontSize: 15, lineHeight: 1.6, color: "var(--fg-3)", margin: 0 }}>
        {lent
          ? "La confirmation de Stripe prend plus de temps que prévu. Votre comparaison s’ouvrira dès qu’elle arrive : rechargez cette page dans quelques minutes."
          : "Nous attendons la confirmation de Stripe. Votre comparaison s’ouvre dès qu’elle arrive, en général en quelques secondes."}
      </p>
    </section>
  );
}
