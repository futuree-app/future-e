"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ReportSection } from "@/components/report/kit";
import { AUTO_SYNTHESIS } from "@/lib/auto-synthesis";
import { buildFactHash, type SynthesisData } from "@/lib/logement-synthesis-cache";

type State = "idle" | "streaming" | "done" | "error";

export function LogementSynthesis({
  ready, data, logementId, insee,
}: {
  ready: boolean;
  data: SynthesisData;
  logementId: string;
  insee: string;
}) {
  const posthog = usePostHog();
  const [text, setText] = useState("");
  const [state, setState] = useState<State>("idle");
  const lastHashRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hash de CONTENU : dérivé des faits eux-mêmes (même contrat que le serveur). Le gate en session
  // ne relance donc que si un fait change (un DPE confirmé, une exposition re-fetchée), jamais la
  // posture. Il porte aussi la version du prompt : une synthèse figée sous une version antérieure
  // ne peut pas être resservie, elle est régénérée — c'est ce qui a retiré tout seul l'entourage
  // des textes écrits avant le 29/07/2026.
  const factHash = buildFactHash(data);

  const run = useCallback(async (force = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastHashRef.current = factHash;
    setText("");
    setState("streaming");
    posthog?.capture("logement_ai_summary_started", { insee });
    try {
      const res = await fetch("/api/synthesize-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, logementId, insee, force }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        setText(buffer);
      }
      setState("done");
      posthog?.capture("logement_ai_summary_completed", { insee, char_count: buffer.length });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState("error");
      posthog?.capture("logement_ai_summary_failed", { insee, error: err instanceof Error ? err.message : "unknown" });
    }
  }, [data, logementId, insee, factHash, posthog]);

  // Auto-déclenchement : données prêtes, flag actif, et le hash de faits a changé (gating).
  useEffect(() => {
    if (!ready || !AUTO_SYNTHESIS) return;
    if (lastHashRef.current === factHash) return;
    run();
  }, [ready, factHash, run]);

  if (!ready) return <></>;

  return (
    <ReportSection eyebrow="Lecture de ce logement" tone="accent">
      <div style={{ padding: "4px 0" }}>
        {state === "idle" && !AUTO_SYNTHESIS && (
          <button
            onClick={() => run()}
            style={{ fontSize: 14, padding: "10px 18px", borderRadius: 10, border: "1px solid var(--border-1)", background: "var(--bg-elev)", color: "var(--fg-hi)", cursor: "pointer" }}
          >
            Générer la lecture
          </button>
        )}
        {text && (
          // Paragraphes explicites (split sur les sauts doubles) avec inter-paragraphe serré :
          // le pre-wrap + lineHeight 1.75 laissaient des blancs trop grands entre blocs (retour porteur).
          <div style={{ fontSize: 16, lineHeight: 1.62, color: "var(--fg-2)" }}>
            {text.split(/\n{2,}/).map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "0.6em 0 0" }}>{para}</p>
            ))}
          </div>
        )}
        {state === "streaming" && !text && (
          <p style={{ fontSize: 14, color: "var(--fg-4)" }}>Lecture en cours…</p>
        )}
        {state === "error" && (
          <p style={{ fontSize: 14, color: "var(--fg-3)" }}>La lecture n&apos;a pas pu être générée. Réessayez dans un instant.</p>
        )}
        {(state === "done" || state === "error") && (
          <button
            onClick={() => run(state === "error" ? false : true)}
            style={{ marginTop: 14, fontSize: 12.5, padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border-1)", background: "transparent", color: "var(--fg-3)", cursor: "pointer" }}
          >
            {state === "error" ? "Réessayer" : "Régénérer"}
          </button>
        )}
      </div>
    </ReportSection>
  );
}
