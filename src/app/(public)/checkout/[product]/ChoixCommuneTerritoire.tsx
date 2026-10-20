"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CommuneSearch } from "@/components/CommuneSearch";
import { cheminOffreTerritoire } from "@/lib/commerce/parcours-territoire";

// FUT-114 : le dossier de territoire porte sur UNE commune, choisie ici avant tout paiement. Le choix mène à
// l'offre de cette commune (`/territoire/[insee]/debloquer`), où se font la connexion et le paiement.
export function ChoixCommuneTerritoire({ accent }: { accent: string }) {
  const router = useRouter();
  const [refus, setRefus] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-kicker)",
          letterSpacing: "var(--tracking-kicker)",
          textTransform: "uppercase",
          color: "var(--fg-4)",
          margin: 0,
        }}
      >
        Avant de payer
      </p>
      <h3
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 26,
          lineHeight: 1.2,
          letterSpacing: "var(--tracking-display)",
          margin: 0,
          color: "var(--fg-hi)",
        }}
      >
        Quelle commune voulez-vous examiner&nbsp;?
      </h3>
      <p style={{ fontSize: 14, lineHeight: "var(--lh-body)", color: "var(--fg-3)", margin: 0 }}>
        Le dossier porte sur une commune précise. Vous verrez ce qu&apos;il contient pour elle avant de payer.
      </p>
      <CommuneSearch
        accent={accent}
        placeholder="Nantes, Ajaccio, Lyon…"
        onSelect={(commune) => {
          const chemin = cheminOffreTerritoire(commune);
          if (!chemin) {
            setRefus(
              "Les dossiers payants couvrent pour l’instant la France métropolitaine, Corse comprise. Ceux des territoires d’outre-mer ne sont pas encore disponibles.",
            );
            return;
          }
          setRefus(null);
          startTransition(() => router.push(chemin));
        }}
      />
      {refus && (
        <p role="status" style={{ fontSize: 14, lineHeight: "var(--lh-body)", color: "var(--fg-2)", margin: 0 }}>
          {refus}
        </p>
      )}
    </div>
  );
}
