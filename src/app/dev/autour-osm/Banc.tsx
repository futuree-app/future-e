"use client";

// Le client du banc : intercepte `/api/logement-autour` AVANT le montage du vrai `AutourModule`, et rend la réponse
// que le scénario prévoit à chaque appel. Rien d'autre n'est simulé : reprises, affichage et bouton sont ceux de prod.
import { useState } from "react";
import AutourModule from "@/components/report/AutourModule";
import type { AddressDossierRow } from "@/lib/address-dossier-store";
import type { Face3Snapshot } from "@/lib/logement-autour-types";

type Statut = "complete" | "pending" | "failed";

export default function Banc({
  dossier, initial, reponses, complet,
}: {
  dossier: AddressDossierRow;
  initial: Face3Snapshot | null;
  /** Le statut OSM rendu à chaque appel successif ; le dernier se répète. */
  reponses: Statut[];
  complet: Face3Snapshot;
}) {
  const [journal, setJournal] = useState<string[]>([]);
  // Installé une seule fois, au premier rendu, avant les effets du module.
  useState(() => {
    if (typeof window === "undefined") return null;
    const original = window.fetch.bind(window);
    let n = 0;
    const t0 = Date.now();
    window.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("/api/logement-autour")) {
        const statut = reponses[Math.min(n, reponses.length - 1)];
        n++;
        const ligne = `appel ${n} à ${((Date.now() - t0) / 1000).toFixed(1)} s → ${statut}`;
        setTimeout(() => setJournal((j) => [...j, ligne]), 0);
        const snapshot: Face3Snapshot = statut === "complete" ? complet : {
          ...complet,
          osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1500 },
          sourceStatus: { bpe: "complete", osmInfrastructure: statut, osmGreenSpaces: statut },
          sources: { ...complet.sources, osmFetchedAt: null },
        };
        return new Response(JSON.stringify({ snapshot, carOwnership: { kind: "unknown" } }), { status: 200 });
      }
      return original(input, init);
    }) as typeof fetch;
    return null;
  });
  return (
    <>
      <div style={{ position: "relative", zIndex: 10, padding: "8px 16px", fontSize: 12, fontFamily: "var(--font-mono)", background: "var(--bg-elev-2)" }}>
        {journal.length === 0 ? "aucun appel à la route" : journal.join(" · ")}
      </div>
      <AutourModule dossier={{ ...dossier, snapshot: initial }} defaultCommune={null} initialCarOwnership={{ kind: "unknown" }} />
    </>
  );
}
