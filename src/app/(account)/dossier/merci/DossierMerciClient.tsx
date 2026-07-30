"use client";

import { useEffect, useState } from "react";

// Elle NE PEUT PAS supposer le dossier créé : Stripe confirme côté client avant que le webhook
// n'arrive. Elle interroge donc le statut, et au bout d'une trentaine de secondes elle donne une
// issue explicite plutôt que de tourner indéfiniment.
//
// Discipline d'attente du produit (src/lib/loading-messages.ts) : la matière d'abord, ce que la
// lecture permet ensuite, la transparence sur le délai en dernier. Aucune phrase n'affirme un
// dossier qui n'existe pas encore.
export function DossierMerciClient({ paymentIntentId }: { paymentIntentId: string }) {
  const [state, setState] = useState<"waiting" | "ready" | "slow">("waiting");

  useEffect(() => {
    let stopped = false;
    const started = Date.now();

    const tick = async () => {
      if (stopped) return;
      try {
        const res = await fetch(
          `/api/dossier/statut?pi=${encodeURIComponent(paymentIntentId)}`,
        );
        const payload = (await res.json().catch(() => null)) as
          | { status?: string; dossierId?: string }
          | null;
        if (payload?.status === "ready" && payload.dossierId) {
          setState("ready");
          // `/rapport/dossiers/ouvrir` est une ROUTE HANDLER : navigation native obligatoire.
          // Avec le router de Next, le payload RSC demandé ne correspond pas à la redirection
          // rendue, et le clic reste sans effet.
          window.location.href = `/rapport/dossiers/ouvrir?id=${encodeURIComponent(payload.dossierId)}&vers=logement`;
          return;
        }
      } catch {
        // Une requête ratée n'est pas une réponse : on retente jusqu'à la borne de temps.
      }
      if (Date.now() - started > 30_000) {
        setState("slow");
        return;
      }
      setTimeout(tick, 2000);
    };

    void tick();
    return () => {
      stopped = true;
    };
  }, [paymentIntentId]);

  if (state === "slow") {
    return (
      <p className="text-[15px] text-muted leading-relaxed">
        Votre paiement est enregistré. Votre dossier s&apos;ouvre dans un instant : vous le
        retrouverez dans vos dossiers.
      </p>
    );
  }

  return (
    <p className="text-[15px] text-muted leading-relaxed">
      {state === "ready"
        ? "Nous ouvrons votre dossier."
        : "Nous préparons votre dossier : l'adresse, ce qui l'entoure, et ce que dit le bâtiment."}
    </p>
  );
}
