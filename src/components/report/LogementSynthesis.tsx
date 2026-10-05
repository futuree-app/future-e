"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";
import { ReportSection } from "@/components/report/kit";
import { buildFactHash, type ClimatProjete, type SynthesisData } from "@/lib/logement-synthesis-cache";
import { syntheseEnregistreeUtilisable } from "@/lib/logement-report-version";

// « refused » n'est PAS une erreur : la génération a abouti, et le contrôle a refusé de montrer le
// texte parce qu'il affirmait plus que ce que le moteur établit (voir `synthesis-guardrails`). Le
// distinguer d'une panne est une question d'honnêteté : « réessayez dans un instant » serait faux,
// puisque rien ne dit qu'une relance produirait un texte conforme.
//
// « loading » et non plus « streaming » : la réponse arrive d'un bloc depuis le 11/08/2026, une
// prose ne se vérifiant pas après avoir été affichée. Un état qui garde le nom de l'ancien
// comportement finit par le faire revenir.
type State = "idle" | "loading" | "done" | "error" | "refused";

export function LogementSynthesis({
  ready, data, dossierId, insee, texteEnregistre = null, hashEnregistre = null, climatProjete = null, versionNumero = null,
}: {
  /** L'empreinte des faits que la synthèse enregistrée a lus (FUT-60). `null` : elle ne vaut pour rien. */
  hashEnregistre?: string | null;
  /** Le signal climat injecté par le serveur avant son hash : sans lui, les deux empreintes divergent. */
  climatProjete?: ClimatProjete | null;
  ready: boolean;
  data: SynthesisData;
  dossierId: string;
  /** Le numéro de la version affichée : la synthèse n'est rangée que dans la version qu'elle a lue. */
  versionNumero?: number | null;
  insee: string;
  /**
   * LA SYNTHÈSE ENREGISTRÉE, quand le module s'ouvre depuis une version (FUT-13, lot B). Elle s'affiche
   * sans appel SI ELLE A LU LES FAITS COURANTS (même empreinte, FUT-60) ; sinon elle n'est pas montrée
   * et une lecture est générée. Le modèle n'est sollicité que si les faits diffèrent de ceux qu'elle a lus.
   */
  texteEnregistre?: string | null;
}) {
  const posthog = usePostHog();
  const [text, setText] = useState(texteEnregistre ?? "");
  // L'empreinte des faits que le texte affiché a lus. Un texte ne se montre que pour SES faits.
  const [texteHash, setTexteHash] = useState<string | null>(texteEnregistre ? hashEnregistre : null);
  const [state, setState] = useState<State>(texteEnregistre ? "done" : "idle");
  const lastHashRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Hash de CONTENU : dérivé des faits eux-mêmes (même contrat que le serveur). Le gate en session
  // ne relance donc que si un fait change (un DPE confirmé, une exposition re-fetchée), jamais la
  // posture. Il porte aussi la version du prompt : une synthèse figée sous une version antérieure
  // ne peut pas être resservie, elle est régénérée — c'est ce qui a retiré tout seul l'entourage
  // des textes écrits avant le 29/07/2026.
  // Le climat entre dans l'empreinte comme côté serveur : c'est ce qui rend les deux comparables.
  const factHash = buildFactHash({ ...data, climatProjete });

  const run = useCallback(async (force = false) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastHashRef.current = factHash;
    const hashDeCetteLecture = factHash;
    setText("");
    setState("loading");
    posthog?.capture("logement_ai_summary_started", { insee });
    try {
      const res = await fetch("/api/synthesize-logement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `insee` n'est plus transmis : le serveur le lit sur le dossier. Il reste ici pour
        // l'instrumentation seule.
        body: JSON.stringify({ data, dossierId, force, versionNumero }),
        signal: controller.signal,
      });
      if (res.status === 422) {
        setState("refused");
        posthog?.capture("logement_ai_summary_refused", { insee });
        return;
      }
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
      setTexteHash(hashDeCetteLecture);
      setState("done");
      posthog?.capture("logement_ai_summary_completed", { insee, char_count: buffer.length });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState("error");
      posthog?.capture("logement_ai_summary_failed", { insee, error: err instanceof Error ? err.message : "unknown" });
    }
  }, [data, dossierId, insee, factHash, posthog, versionNumero]);

  // Auto-déclenchement : données prêtes et le hash de faits a changé (gating). Un hash inchangé
  // sert le texte figé sans appeler le modèle, donc l'auto ne dépense que sur un fait nouveau.
  //
  // INCONDITIONNEL DEPUIS LE 30/07/2026. Cette lecture était derrière un flag `AUTO_SYNTHESIS`,
  // absent des variables de production : l'acheteur d'un dossier à 39 € voyait un bouton
  // « Générer la lecture » à la place du bloc qu'il avait payé, et personne n'appuie sur un
  // bouton dont il ignore qu'il contient le produit.
  useEffect(() => {
    if (!ready) return;
    // Première lecture d'une version : la synthèse enregistrée vaut pour ces faits SI elle les a lus
    // (même empreinte). Aucun appel. Sinon, elle n'est pas resservie : une lecture est générée.
    if (lastHashRef.current === null && syntheseEnregistreeUtilisable(texteEnregistre, hashEnregistre, factHash)) {
      lastHashRef.current = factHash;
      return;
    }
    if (lastHashRef.current === factHash) return;
    run();
  }, [ready, factHash, run, texteEnregistre, hashEnregistre]);

  if (!ready) return <></>;

  // LE BLOC DISPARAÎT QUAND LA LECTURE EST REFUSÉE (décision porteur, 11/08/2026).
  //
  // Une première version affichait « la lecture rédigée n'a pas passé nos contrôles ». C'est de la
  // plomberie : le lecteur n'a pas à connaître l'existence d'un validateur, et la phrase attire
  // l'attention sur une absence qu'il n'aurait jamais remarquée. Le module ne perd rien de ce qu'il
  // a vendu, ses cartes portent chaque donnée, sa source et sa limite ; il perd une mise en prose.
  //
  // L'ERREUR TECHNIQUE, ELLE, RESTE DITE : « réessayez dans un instant » est une promesse tenable
  // quand le fournisseur n'a pas répondu, et le lecteur peut agir. Un refus n'est pas retentable,
  // et le silence est la seule réponse honnête.
  if (state === "refused") return <></>;

  // UN TEXTE QUI N'A PAS LU LES FAITS COURANTS NE S'AFFICHE PAS, même une fraction de seconde avant
  // que la génération ne parte : il se lit comme « en cours ».
  const perime = state === "done" && texteHash !== factHash;
  const affiche = perime ? "loading" : state;
  const texteVisible = perime ? "" : text;

  return (
    <ReportSection eyebrow="Lecture de ce logement" tone="accent">
      <div style={{ padding: "4px 0" }}>
        {texteVisible && (
          // Paragraphes explicites (split sur les sauts doubles) avec inter-paragraphe serré :
          // le pre-wrap + lineHeight 1.75 laissaient des blancs trop grands entre blocs (retour porteur).
          <div style={{ fontSize: 16, lineHeight: 1.62, color: "var(--fg-2)" }}>
            {texteVisible.split(/\n{2,}/).map((para, i) => (
              <p key={i} style={{ margin: i === 0 ? 0 : "0.6em 0 0" }}>{para}</p>
            ))}
          </div>
        )}
        {affiche === "loading" && !texteVisible && (
          <p style={{ fontSize: 14, color: "var(--fg-4)" }}>Lecture en cours…</p>
        )}
        {affiche === "error" && (
          <p style={{ fontSize: 14, color: "var(--fg-3)" }}>La lecture n&apos;a pas pu être générée. Réessayez dans un instant.</p>
        )}
        {(affiche === "done" || affiche === "error") && (
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
