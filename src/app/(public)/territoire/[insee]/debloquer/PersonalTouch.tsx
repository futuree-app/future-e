"use client";

import { useEffect, useState } from "react";
import { CLE_PAYWALL_LABELS } from "@/lib/comparateur/session-ou-vivre";
import { appliquerPurgeDifferee, useOubliALaPurge } from "@/components/interaction/purge-recherche-navigateur";

// Ligne personnalisée optionnelle : reprend les priorités du projet (si l'utilisateur en a
// tapé un sur /ou-vivre) pour relier l'aperçu à SA décision. Best-effort, jamais bloquant.
export function PersonalTouch({ commune }: { commune: string }) {
  const [labels, setLabels] = useState<string[]>([]);
  // FUT-27 : une déconnexion explicite efface ces priorités ; la ligne disparaît aussi de l'écran.
  useOubliALaPurge(() => setLabels([]));

  useEffect(() => {
    appliquerPurgeDifferee(); // FUT-27 : avant de lire, une déconnexion restée sans purge
    try {
      const raw = window.localStorage.getItem(CLE_PAYWALL_LABELS);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // Lecture localStorage post-montage (client-only) : pattern légitime, pas un cascading render.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLabels(parsed.filter((x): x is string => typeof x === "string").slice(0, 4));
      }
    } catch {
      // ignore : pas de perso, l'aperçu commune suffit
    }
  }, []);

  if (labels.length === 0) return null;

  return (
    <p className="mb-4 text-[14px] leading-[1.6] text-muted">
      <span className="text-accent">Vu vos priorités</span> ({labels.join(", ")}), le rapport
      situe {commune} sur chacun de ces points.
    </p>
  );
}
