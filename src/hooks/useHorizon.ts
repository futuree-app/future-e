"use client";

import { useEffect, useState } from "react";

export type HorizonKey = "gwl15" | "gwl20" | "gwl30";

const STORAGE_KEY = "futuree:horizon";
const DEFAULT: HorizonKey = "gwl20";
const VALID: HorizonKey[] = ["gwl15", "gwl20", "gwl30"];

export const HORIZON_META: Record<HorizonKey, { year: string; france: string }> = {
  gwl15: { year: "2030", france: "+2°C" },
  gwl20: { year: "2050", france: "+2,7°C" },
  gwl30: { year: "2100", france: "+4°C" },
};

// ─── Mini-store partagé ────────────────────────────────────────────────────
// useHorizon doit être partagé entre QuartierSynthesis (sélecteur) et
// QuartierAside (cartes). Un useState par composant ne suffisait pas : chaque
// hook avait son propre state local, et un changement n'atteignait pas les
// autres consommateurs dans le même onglet (le storage event ne se déclenche
// que cross-tab). Un pub/sub au niveau module règle ça sans Context.

let currentHorizon: HorizonKey = DEFAULT;
const listeners = new Set<(h: HorizonKey) => void>();
let hydrated = false;

function hydrateOnce() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY) as HorizonKey | null;
    if (stored && VALID.includes(stored)) {
      currentHorizon = stored;
    }
  } catch {
    /* ignore */
  }
}

function notifyAll(next: HorizonKey) {
  for (const l of listeners) l(next);
}

export function useHorizon(): [HorizonKey, (h: HorizonKey) => void] {
  const [horizon, setHorizonState] = useState<HorizonKey>(currentHorizon);

  useEffect(() => {
    hydrateOnce();
    // Synchroniser le composant avec la valeur courante du store (peut avoir
    // été hydratée par un autre consommateur monté avant lui).
    if (currentHorizon !== horizon) setHorizonState(currentHorizon);
    listeners.add(setHorizonState);
    return () => {
      listeners.delete(setHorizonState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setHorizon(h: HorizonKey) {
    if (!VALID.includes(h) || h === currentHorizon) return;
    currentHorizon = h;
    try {
      window.localStorage.setItem(STORAGE_KEY, h);
    } catch {
      /* ignore */
    }
    notifyAll(h);
  }

  return [horizon, setHorizon];
}
