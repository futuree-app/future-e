"use client";

import { useSyncExternalStore } from "react";
import { identifiantMesure, souscrireMesure } from "@/lib/mesure-audience";
import { CHAMP_IDENTIFIANT_MESURE } from "@/lib/posthog-identity";

// FUT-181 · Le champ caché qui porte l'identifiant de mesure vers une Server Action d'authentification.
// Vide sans consentement, avant l'hydratation et sans JavaScript : le serveur n'émet alors rien.
const vide = () => "";
const lire = () => identifiantMesure() ?? "";

export function ChampMesure() {
  const valeur = useSyncExternalStore(souscrireMesure, lire, vide);
  return <input type="hidden" name={CHAMP_IDENTIFIANT_MESURE} value={valeur} />;
}
