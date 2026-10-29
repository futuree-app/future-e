"use client";

// FUT-155 · Sous le champ AskFuture : la limite de la question, visible dès la saisie, et l'avis d'un refus de
// taille. Pas de `maxLength` sur le champ : le navigateur couperait en silence un texte collé trop long.
import { MAX_QUESTION_ASK, longueurQuestion } from "@/lib/comparateur/lecture-ask";

const LIMITE = "1 000";

export function LigneQuestionAsk({ texte, avis }: { texte: string; avis: string | null }) {
  const n = longueurQuestion(texte);
  const trop = n > MAX_QUESTION_ASK;
  if (!avis && n === 0) return null;
  return (
    <p aria-live="polite" className={`mt-1.5 text-[12px] leading-[1.5] ${avis || trop ? "text-accent" : "text-ghost"}`}>
      {avis ?? (trop
        ? `${n.toLocaleString("fr-FR")} / ${LIMITE} caractères : raccourcissez votre question pour l'envoyer.`
        : `${n.toLocaleString("fr-FR")} / ${LIMITE} caractères`)}
    </p>
  );
}
