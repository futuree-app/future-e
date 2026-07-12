"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProject, ProjectPosture } from "@/lib/user-project";

const POSTURE_OPTIONS: { value: ProjectPosture; label: string }[] = [
  { value: "recherche", label: "Je cherche où vivre" },
  { value: "adresse", label: "J'étudie ce lieu pour acheter ou louer" },
  { value: "habitant", label: "J'y habite déjà" },
];

// Carte « Votre projet » en tête du hub. Trois états : projet présent, absent (invitation),
// édition. La sauvegarde explicite ne prétend JAMAIS avoir réussi sans confirmation serveur :
// en cas d'échec l'éditeur reste ouvert avec un message. La posture est choisie, jamais devinée.
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

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  if (!editing && project && reformulation) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 6px" }}>Votre projet</p>
        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>{reformulation}</p>
        <button type="button" onClick={() => { setText(project.rawText ?? ""); setPosture(project.posture); setEditing(true); }}
          style={{ marginTop: 10, background: "none", border: "none", padding: 0, color: "var(--accent)", cursor: "pointer", fontSize: 13 }}>
          Affiner
        </button>
      </div>
    );
  }

  if (!editing && !project) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.6, margin: "0 0 10px" }}>
          Décrivez votre projet pour une lecture qui parle de votre situation.
        </p>
        <button type="button" onClick={() => setEditing(true)}
          style={{ background: "none", border: "1px solid var(--border-2)", borderRadius: 10, padding: "8px 14px", color: "var(--fg-1)", cursor: "pointer", fontSize: 14 }}>
          Décrire mon projet
        </button>
      </div>
    );
  }

  return (
    <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
        {POSTURE_OPTIONS.map((o) => (
          <button key={o.value} type="button" onClick={() => setPosture(o.value)}
            style={{ background: posture === o.value ? "var(--accent)" : "none", color: posture === o.value ? "#060812" : "var(--fg-1)", border: "1px solid var(--border-2)", borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 13 }}>
            {o.label}
          </button>
        ))}
      </div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, color: "var(--fg-1)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
      {error ? <p style={{ color: "var(--red)", fontSize: 13, margin: "8px 0 0" }}>{error}</p> : null}
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button type="button" onClick={save} disabled={busy || !text.trim() || !posture}
          style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#060812", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: busy || !text.trim() || !posture ? 0.5 : 1 }}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button type="button" onClick={() => { setEditing(false); setError(null); }}
            style={{ background: "none", border: "none", padding: 0, color: "var(--fg-4)", cursor: "pointer", fontSize: 13 }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
