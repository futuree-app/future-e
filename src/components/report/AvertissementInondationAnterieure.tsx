import type { CSSProperties } from "react";
import type { Dossier } from "@/lib/decision/decision-fact";
import { lectureInondationAnterieure } from "@/lib/decision/inondation-anterieure";
import { bindOrphans } from "@/lib/typography";

// FUT-127 : UNE ANALYSE FIGÉE AVANT LA CORRECTION DE LA LECTURE DES INONDATIONS LE DIT, SANS ÊTRE RÉÉCRITE.
// Le texte et sa détection vivent dans `inondation-anterieure.ts` (pur, testé) ; ce composant ne fait que
// les poser, dans l'habillage de la présentation qui l'appelle (classique ou relevé). Rien quand
// l'analyse est courante : un artefact `engine-7` ne porte aucune des deux lectures retirées.
export function AvertissementInondationAnterieure(
  { dossier, className, style }: { dossier: Dossier; className: string; style?: CSSProperties },
) {
  const anterieure = lectureInondationAnterieure(dossier);
  if (!anterieure) return null;
  return (
    <p className={className} style={style} data-fut127={`lecture-inondation-anterieure:${anterieure.motif}`}>
      <span>{bindOrphans(anterieure.texte)}</span>
    </p>
  );
}
