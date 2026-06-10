"use client";

import { useEffect, useRef } from "react";
import { readWizardAnswersFromStorage } from "./types";

// Pousse les réponses du wizard (sessionStorage) vers le profil de l'utilisateur
// connecté, une seule fois, si le serveur ne les a pas encore. Monté sur les
// pages post-connexion (/compte, /rapport). Sans effet visuel (retourne null).
//
// Pourquoi côté client : le wizard tourne souvent en anonyme sur la home, les
// réponses vivent dans le sessionStorage du navigateur. À la première page
// authentifiée, on les transfère pour rendre la « première lecture »
// retrouvable. Fire-and-forget : un échec laisse les réponses en sessionStorage.
export function WizardAnswersSync({ hasServerAnswers }: { hasServerAnswers: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || hasServerAnswers) return;
    const answers = readWizardAnswersFromStorage();
    if (!answers) return;
    done.current = true;
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ field: "wizard_answers", value: answers }),
    }).catch(() => {
      // Non bloquant : les réponses restent en sessionStorage, on retentera.
      done.current = false;
    });
  }, [hasServerAnswers]);

  return null;
}
