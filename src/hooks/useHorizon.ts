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

export function useHorizon(): [HorizonKey, (h: HorizonKey) => void] {
  const [horizon, setHorizonState] = useState<HorizonKey>(DEFAULT);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as HorizonKey | null;
    if (stored && VALID.includes(stored)) {
      setHorizonState(stored);
    }
  }, []);

  function setHorizon(h: HorizonKey) {
    localStorage.setItem(STORAGE_KEY, h);
    setHorizonState(h);
  }

  return [horizon, setHorizon];
}
