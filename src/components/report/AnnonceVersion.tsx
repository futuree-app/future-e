"use client";

// FUT-93 · L'ANNONCE PERSISTANTE DE LA NOUVELLE VERSION, POUR LES LECTEURS D'ÉCRAN.
//
// Quand la nouvelle analyse s'affiche, le bandeau « Mettre à jour l'analyse » disparaît, et sa région
// annoncée avec lui : un lecteur d'écran n'entendait rien. Cette région-ci vit à côté de la date de
// l'analyse, hors du bandeau : elle existe avant la mise à jour et reste après, si bien que son texte
// change, et s'annonce, au moment où la page sert réellement la version attendue. Elle ne parle que
// sur ce constat (version servie >= version annoncée par le serveur, pour CE dossier et CETTE portée),
// lu dans la mémoire que pose `AnalyseAncienProjet` à la livraison. Invisible à l'écran : la date
// visible, juste au-dessus, dit déjà la même chose aux autres lecteurs.
import { useEffect, useState, useSyncExternalStore } from "react";
import { cleMemoireAffichage, lireMemoireAffichage, versionAtteinte } from "@/lib/interaction/etat-action";

const lire = (k: string): string | null => {
  try { return window.sessionStorage.getItem(k); } catch { return null; }
};
const effacer = (k: string) => {
  try { window.sessionStorage.removeItem(k); } catch { /* stockage indisponible : rien à effacer */ }
};
const sansAbonnement = () => () => {};

export function AnnonceVersion({ insee, scopeKey, versionServie, date }: {
  insee: string;
  scopeKey: string;
  versionServie: number | null;
  /** La date de la version servie, déjà formatée. */
  date: string | null;
}) {
  const cle = `${insee}|${scopeKey}`;
  const brut = useSyncExternalStore(
    sansAbonnement,
    () => { const b = lire(cleMemoireAffichage(cle)); return lireMemoireAffichage(b, cle, Date.now()) ? b : null; },
    () => null,
  );
  const memoire = lireMemoireAffichage(brut, cle);
  const atteinte = memoire !== null && versionAtteinte(memoire.attendue, versionServie);
  // L'annonce reste posée une fois faite : effacer la mémoire ne la retire pas.
  const [annonce, setAnnonce] = useState("");
  if (atteinte && !annonce) {
    setAnnonce(date ? `La nouvelle analyse est affichée. Elle a été générée le ${date}.` : "La nouvelle analyse est affichée.");
  }
  useEffect(() => { if (atteinte) effacer(cleMemoireAffichage(cle)); }, [atteinte, cle]);
  return <p className="sr-only" role="status" aria-live="polite">{annonce}</p>;
}
