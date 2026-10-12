"use client";

// FUT-93 · SONDE DU BANC. DEV UNIQUEMENT. Distingue un arbre REÇU et RENDU par React (journal de rendu)
// d'un arbre VALIDÉ à l'écran (journal d'effet). Sans effet sur la page.
import { useEffect } from "react";

export function Sonde({ version }: { version: number }) {
  if (typeof window !== "undefined") console.log(`[sonde] rendu v${version}`);
  useEffect(() => { console.log(`[sonde] validé v${version}`); }, [version]);
  return null;
}
