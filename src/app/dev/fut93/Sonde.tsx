"use client";

// FUT-93 · SONDE DU BANC. DEV UNIQUEMENT. Distingue un arbre REÇU et RENDU par React (journal de rendu)
// d'un arbre VALIDÉ à l'écran (journal d'effet). Le `jeton` change à chaque rendu serveur : il révèle
// la validation d'une relecture même quand la version servie ne change pas. Sans effet sur la page.
import { useEffect } from "react";

export function Sonde({ version, jeton }: { version: number; jeton: number }) {
  if (typeof window !== "undefined") console.log(`[sonde] rendu v${version} #${jeton}`);
  useEffect(() => { console.log(`[sonde] validé v${version} #${jeton}`); }, [version, jeton]);
  return null;
}

/** La même sonde, posée DANS le contenu asynchrone d'une frontière : son contenu est-il validé ? */
export function SondeInterne({ jeton }: { jeton: number }) {
  if (typeof window !== "undefined") console.log(`[sonde] rendu intérieur #${jeton}`);
  useEffect(() => { console.log(`[sonde] validé intérieur #${jeton}`); }, [jeton]);
  return null;
}
