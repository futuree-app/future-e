"use client";

import { useEffect, useState } from "react";

// Ligne personnalisée optionnelle : reprend les priorités du projet (si l'utilisateur en a
// tapé un sur /ou-vivre) pour relier l'aperçu à SA décision. Best-effort, jamais bloquant.
export function PersonalTouch({ commune }: { commune: string }) {
  const [labels, setLabels] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("futuree:projet:labels");
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
