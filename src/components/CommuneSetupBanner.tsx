"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type CommuneResult = { code: string; nom: string; codeDepartement: string };

export function CommuneSetupBanner() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommuneResult[]>([]);
  const [open, setOpen] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setFetching(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codeDepartement&boost=population&limit=6`,
      );
      const data: CommuneResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
    } finally {
      setFetching(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 220);
  }

  async function handleSelect(commune: CommuneResult) {
    setOpen(false);
    setQuery(commune.nom);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ field: "commune", insee_code: commune.code, nom: commune.nom }),
      });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(d.error ?? "Erreur de sauvegarde.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de sauvegarde.");
      setSaving(false);
    }
  }

  return (
    <section className="glass rounded-2xl px-7 py-5 border border-accent/[0.18] flex items-center gap-8 flex-wrap">
      <div className="flex-1 min-w-[200px]">
        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] uppercase text-accent mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
          Étape manquante
        </div>
        <h2
          className="font-normal text-[18px] leading-[1.25] tracking-[-0.2px] text-label mb-1"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Quelle est votre commune de résidence ?
        </h2>
        <p className="text-[13px] text-muted leading-[1.6]">
          Elle conditionne toutes les données de votre rapport interactif.
        </p>
      </div>

      <div className="relative w-full max-w-[340px]">
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Tapez votre commune…"
          disabled={saving}
          className="w-full bg-[var(--bg-elev-2)] border border-[var(--border-2)] rounded-lg px-4 py-3 text-[15px] text-label placeholder:text-ghost outline-none focus:border-accent/40 disabled:opacity-50"
        />
        {fetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ghost">…</span>
        )}
        {saving && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-ghost">Enregistrement…</span>
        )}
        {open && results.length > 0 && (
          <ul className="absolute left-0 top-full mt-1 z-10 w-full glass border border-[var(--border-2)] rounded-xl overflow-hidden shadow-xl">
            {results.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onMouseDown={() => handleSelect(c)}
                  className="w-full text-left px-4 py-2.5 text-[13px] text-label hover:bg-[var(--bg-elev-2)] flex justify-between gap-2"
                >
                  <span>{c.nom}</span>
                  <span className="text-ghost font-mono text-[11px]">{c.code}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="mt-2 text-[12px] text-red-300 w-full">{error}</p>
      )}
    </section>
  );
}
