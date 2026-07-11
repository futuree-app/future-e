"use client";

import { useEffect, useRef } from "react";

// Pousse le projet libre de /ou-vivre (localStorage) vers le compte, une seule fois, si le serveur
// n'en a pas encore. Monté sur /rapport. Sans rendu. Fire-and-forget : un échec laisse l'objet en
// localStorage et retente à la prochaine visite. /ou-vivre est public : la persistance a lieu ici,
// à la première page connectée, comme WizardAnswersSync.
const SESSION_KEY = "futuree:ouvivre:session";

export function OuVivreProjectSync({ hasServerProject }: { hasServerProject: boolean }) {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || hasServerProject) return;
    let payload: { parsed?: unknown; submittedText?: string } | null = null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
    if (!payload?.parsed) return; // rien de riche à sauvegarder
    done.current = true;
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: "user_project_if_empty",
        value: {
          posture: "recherche",
          intent: null,
          rawText: typeof payload.submittedText === "string" ? payload.submittedText : null,
          parsed: payload.parsed,
          updatedAt: new Date().toISOString(),
        },
      }),
    }).catch(() => {
      done.current = false; // retentera
    });
  }, [hasServerProject]);

  return null;
}
