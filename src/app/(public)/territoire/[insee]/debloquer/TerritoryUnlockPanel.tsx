"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";

type Props = {
  insee: string;
  commune: string | null;
  rank: number | null;
  amount: number;
  submitLabel?: string;
};

// Panneau de paiement d'un dossier de territoire ciblé sur une commune explorée.
// À la réussite : bascule immédiate du territoire actif de lecture, puis rapport.
export function TerritoryUnlockPanel({ insee, commune, rank, amount, submitLabel }: Props) {
  const router = useRouter();
  const [activating, setActivating] = useState(false);

  return (
    <>
      <PaymentWrapper
        amount={amount}
        productType="one-shot"
        submitLabel={submitLabel}
        grant={{ targetInsee: insee, targetCommune: commune, source: "comparateur_vie", rank }}
        onSuccess={async () => {
          setActivating(true);
          try {
            await fetch("/api/territoire/activer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ insee, commune: commune ?? "" }),
            });
          } catch {
            // Le webhook posera le territoire actif de toute façon.
          }
          router.push("/rapport");
        }}
      />
      {activating && (
        <p className="mt-4 text-[13px] text-[var(--fg-3)]">
          Ouverture de votre dossier…
        </p>
      )}
    </>
  );
}
