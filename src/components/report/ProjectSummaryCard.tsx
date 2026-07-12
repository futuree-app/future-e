"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProject, ProjectPosture } from "@/lib/user-project";

const POSTURE_OPTIONS: { value: ProjectPosture; label: string }[] = [
  { value: "recherche", label: "Je cherche où vivre" },
  { value: "adresse", label: "J'étudie ce lieu pour acheter ou louer" },
  { value: "habitant", label: "J'y habite déjà" },
];

// Carte « Votre projet » en tête du hub, dans le langage visuel de futur•e (glass, eyebrow mono,
// Instrument Serif, accent orange). Trois états : projet présent, absent (invitation), édition. La
// sauvegarde explicite ne prétend JAMAIS avoir réussi sans confirmation serveur : en cas d'échec
// l'éditeur reste ouvert avec un message. La posture est choisie, jamais devinée.
export function ProjectSummaryCard({ initial }: { initial: UserProject | null }) {
  const [project, setProject] = useState<UserProject | null>(initial);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial?.rawText ?? "");
  const [posture, setPosture] = useState<ProjectPosture | null>(initial?.posture ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function save() {
    const raw = text.trim();
    if (!raw || !posture) return;
    setBusy(true);
    setError(null);
    // 1) parse (best-effort). 2) persist. rawText survit à un parse en échec.
    let parsed: UserProject["parsed"] = null;
    try {
      const r = await fetch("/api/comparateur-vie/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: raw }),
      });
      if (r.ok) {
        const data = (await r.json()) as { parsed?: unknown };
        if (data.parsed && typeof data.parsed === "object") parsed = data.parsed as UserProject["parsed"];
      }
    } catch {
      parsed = null;
    }
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          field: "user_project",
          value: { posture, intent: project?.intent ?? null, rawText: raw, parsed },
        }),
      });
      if (!res.ok) {
        setError("Enregistrement impossible pour le moment. Réessayez.");
        setBusy(false);
        return;
      }
      const data = (await res.json()) as { project?: UserProject };
      if (!data.project) {
        setError("Enregistrement impossible pour le moment. Réessayez.");
        setBusy(false);
        return;
      }
      setProject(data.project); // uniquement le projet confirmé par le serveur
      setEditing(false);
      router.refresh(); // régénère le dossier de décision (rendu serveur) avec le projet à jour
    } catch {
      setError("Enregistrement impossible pour le moment. Réessayez.");
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  const Eyebrow = () => (
    <div className="flex items-center gap-2.5 font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-3">
      <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
      Votre projet
    </div>
  );

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  // ── Projet présent ──
  if (!editing && project && reformulation) {
    return (
      <div className="glass rounded-2xl p-7">
        <Eyebrow />
        <p className="text-[17px] leading-[1.65] text-label max-w-[680px]">{reformulation}</p>
        <button
          type="button"
          onClick={() => { setText(project.rawText ?? ""); setPosture(project.posture); setError(null); setEditing(true); }}
          className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.08em] uppercase text-accent hover:text-label transition-colors"
        >
          Affiner
          <span aria-hidden className="text-[13px] leading-none">→</span>
        </button>
      </div>
    );
  }

  // ── Aucun projet ──
  if (!editing && !project) {
    return (
      <div className="glass rounded-2xl p-7">
        <Eyebrow />
        <p className="text-[16px] leading-[1.65] text-muted max-w-[560px] mb-5">
          Décrivez votre projet pour une lecture qui parle de votre situation, pas d&apos;une commune en général.
        </p>
        <button
          type="button"
          onClick={() => { setError(null); setEditing(true); }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] hover:opacity-90 transition-opacity"
        >
          Décrire mon projet
        </button>
      </div>
    );
  }

  // ── Édition ──
  return (
    <div className="glass rounded-2xl p-7">
      <Eyebrow />
      <p className="font-mono text-[10px] tracking-[0.1em] uppercase text-ghost mb-2.5">Vous êtes plutôt</p>
      <div className="flex gap-2 flex-wrap mb-5">
        {POSTURE_OPTIONS.map((o) => {
          const active = posture === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setPosture(o.value)}
              className={
                active
                  ? "rounded-lg px-3.5 py-2 text-[13px] font-medium bg-accent text-canvas border border-transparent transition-colors"
                  : "rounded-lg px-3.5 py-2 text-[13px] text-muted bg-white/[0.04] border border-white/[0.12] hover:text-label hover:border-white/25 transition-colors"
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        className="w-full rounded-xl bg-white/[0.03] border border-white/[0.12] px-4 py-3 text-[14px] text-label placeholder:text-ghost leading-[1.6] resize-y focus:outline-none focus:border-accent/60 transition-colors"
        style={{ fontFamily: "inherit" }}
      />

      {error ? <p className="text-danger text-[13px] mt-2.5">{error}</p> : null}

      <div className="flex items-center gap-4 mt-4">
        <button
          type="button"
          onClick={save}
          disabled={busy || !text.trim() || !posture}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-canvas font-semibold text-[14px] transition-opacity disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
        >
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button
            type="button"
            onClick={() => { setEditing(false); setError(null); }}
            className="font-mono text-[11px] tracking-[0.08em] uppercase text-ghost hover:text-label transition-colors"
          >
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
