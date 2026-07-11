"use client";

import { useState } from "react";
import type { UserProject } from "@/lib/user-project";

// Carte « Votre projet » en tête du hub. Trois états : projet présent (reformulation + Affiner),
// absent (invitation non bloquante), édition (champ texte -> /parse -> /api/profile). rawText est
// conservé même si /parse échoue. La reformulation est corrigeable : la prémisse est réfutable.
export function ProjectSummaryCard({ initial }: { initial: UserProject | null }) {
  const [project, setProject] = useState<UserProject | null>(initial);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(initial?.rawText ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    const raw = text.trim();
    if (!raw) return;
    setBusy(true);
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
        if (data.parsed && typeof data.parsed === "object") {
          parsed = data.parsed as UserProject["parsed"];
        }
      }
    } catch {
      parsed = null;
    }
    const value: UserProject = {
      posture: project?.posture ?? "recherche",
      intent: project?.intent ?? null,
      rawText: raw,
      parsed,
      updatedAt: new Date().toISOString(),
    };
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "user_project", value }),
      });
    } catch {
      // non bloquant : l'UI reflète quand même la saisie
    }
    setProject(value);
    setEditing(false);
    setBusy(false);
  }

  const reformulation = project?.parsed?.reformulation ?? project?.rawText ?? null;

  if (!editing && project && reformulation) {
    return (
      <div className="glass" style={{ padding: 18, borderRadius: 14, marginBottom: 20 }}>
        <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--fg-4)", margin: "0 0 6px" }}>Votre projet</p>
        <p style={{ fontSize: 15, color: "var(--fg-1)", lineHeight: 1.6, margin: 0 }}>{reformulation}</p>
        <button type="button" onClick={() => { setText(project.rawText ?? ""); setEditing(true); }}
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
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3}
        placeholder="Par exemple : nous cherchons une maison au calme, proche de la mer, avec une école à pied."
        style={{ width: "100%", background: "var(--bg-deep)", border: "1px solid var(--border-2)", borderRadius: 10, padding: 12, color: "var(--fg-1)", fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
      <div style={{ display: "flex", gap: 10, marginTop: 10, alignItems: "center" }}>
        <button type="button" onClick={save} disabled={busy || !text.trim()}
          style={{ background: "var(--accent)", border: "none", borderRadius: 10, padding: "8px 16px", color: "#060812", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: busy || !text.trim() ? 0.5 : 1 }}>
          {busy ? "Enregistrement…" : "Enregistrer"}
        </button>
        {project && (
          <button type="button" onClick={() => setEditing(false)}
            style={{ background: "none", border: "none", padding: 0, color: "var(--fg-4)", cursor: "pointer", fontSize: 13 }}>
            Annuler
          </button>
        )}
      </div>
    </div>
  );
}
