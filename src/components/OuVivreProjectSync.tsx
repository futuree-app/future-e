"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Pousse le projet libre de /ou-vivre (localStorage) vers le compte, une seule fois, si le serveur
// n'en a pas encore. Monté sur /rapport. rawText survit même sans parsed. Après une écriture réussie,
// on rafraîchit pour que la carte serveur reflète le projet sans rechargement manuel.
const SESSION_KEY = "futuree:ouvivre:session";

export function OuVivreProjectSync({ hasServerProject }: { hasServerProject: boolean }) {
  const done = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (done.current || hasServerProject) return;
    let payload: { parsed?: unknown; submittedText?: string } | null = null;
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      payload = raw ? JSON.parse(raw) : null;
    } catch {
      payload = null;
    }
    const rawText =
      typeof payload?.submittedText === "string" && payload.submittedText.trim()
        ? payload.submittedText.trim()
        : null;
    if (!rawText && !payload?.parsed) return; // rien à sauvegarder
    done.current = true;
    fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        field: "user_project_if_empty",
        value: { posture: "recherche", intent: null, rawText, parsed: payload?.parsed ?? null },
      }),
    })
      .then(async (r) => {
        if (!r.ok) {
          done.current = false; // retentera
          return;
        }
        const data = (await r.json().catch(() => null)) as { written?: boolean } | null;
        if (data?.written) router.refresh(); // la carte serveur reprend le projet
      })
      .catch(() => {
        done.current = false; // retentera
      });
  }, [hasServerProject, router]);

  return null;
}
