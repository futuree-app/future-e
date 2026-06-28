"use client";

// Amorce « Partez d'une commune que vous aimez » (Phase B). Lien discret -> se déplie
// en autocomplete + traits lus RETIRABLES + lancement. Toute la dérivation/assemblage
// est serveur (/api/comparateur-vie/anchor) ; ici on n'affiche que des chips et on relaie
// le ParsedProject reçu. Voix /ou-vivre. cf. spec Phase B.

import { useState } from "react";
import { CommuneSearch } from "@/components/CommuneSearch";
import { bindOrphans } from "@/lib/typography";
import type { ParsedProject } from "@/lib/comparateur-vie";

type Chip = { key: string; text: string };

export function AnchorAmorce({
  onLaunch,
}: {
  onLaunch: (parsed: ParsedProject, nom: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<{ code: string; nom: string } | null>(null);
  const [chips, setChips] = useState<Chip[]>([]);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [found, setFound] = useState(true);
  const [loading, setLoading] = useState(false);
  const [launching, setLaunching] = useState(false);

  async function fetchAnchor(insee: string, removedKeys: string[]) {
    const r = await fetch("/api/comparateur-vie/anchor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ insee, removedKeys }),
    });
    return r.json();
  }

  async function handleSelect(commune: { code: string; nom: string }) {
    setSelected(commune);
    setRemoved(new Set());
    setLoading(true);
    try {
      const data = await fetchAnchor(commune.code, []);
      setFound(!!data.found);
      setChips(data.found ? (data.chips ?? []) : []);
    } catch {
      setFound(false);
      setChips([]);
    } finally {
      setLoading(false);
    }
  }

  function toggleRemove(key: string) {
    setRemoved((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function launch() {
    if (!selected) return;
    setLaunching(true);
    try {
      const data = await fetchAnchor(selected.code, [...removed]);
      if (data.found && data.parsed) onLaunch(data.parsed as ParsedProject, data.nom as string);
    } finally {
      setLaunching(false);
    }
  }

  const visibleCount = chips.filter((c) => !removed.has(c.key)).length;
  const canLaunch = !!selected && found && visibleCount > 0 && !launching;

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="mt-4 text-[13px] text-muted hover:text-label no-underline transition-colors"
        style={{ fontFamily: "'Instrument Sans', sans-serif" }}
      >
        Pas d&apos;idée ? Partez d&apos;une commune que vous aimez <span aria-hidden>→</span>
      </button>
    );
  }

  return (
    <div className="mt-4 glass rounded-2xl p-5">
      <CommuneSearch
        onSelect={handleSelect}
        placeholder="Saisissez une commune que vous aimez…"
      />
      {loading && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.06em] text-ghost">Lecture de la commune…</p>
      )}
      {selected && !loading && !found && (
        <p className="mt-3 text-[13px] leading-[1.7] text-muted">
          {bindOrphans("Je n'ai pas pu lire cette commune ; décrivez plutôt ce que vous cherchez ci-dessus.")}
        </p>
      )}
      {selected && found && chips.length > 0 && (
        <div className="mt-4">
          <p className="text-[13px] text-muted mb-2">{bindOrphans(`À ${selected.nom}, ce qui ressort :`)}</p>
          <div className="flex flex-wrap gap-2">
            {chips.map((c) => {
              const off = removed.has(c.key);
              return (
                <button
                  key={c.key}
                  onClick={() => toggleRemove(c.key)}
                  aria-pressed={!off}
                  className={`text-[12px] rounded-full px-3 py-1.5 border transition-colors ${
                    off
                      ? "border-white/[0.08] text-ghost line-through"
                      : "border-white/[0.18] text-label hover:border-white/[0.3]"
                  }`}
                  style={{ fontFamily: "'Instrument Sans', sans-serif" }}
                >
                  {c.text} <span aria-hidden>{off ? "↺" : "✕"}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={launch}
              disabled={!canLaunch}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ fontFamily: "'Instrument Sans', sans-serif" }}
            >
              {launching ? "Analyse en cours…" : "Explorer dans cet esprit"} <span aria-hidden>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
