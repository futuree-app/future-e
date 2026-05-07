'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Commune = {
  nom: string;
  code: string;
  codesPostaux?: string[];
  departement?: { nom: string; code: string };
};

export function LandingComparatorInput() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Commune[]>([]);
  const [selected, setSelected] = useState<Commune | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) { setSuggestions([]); setOpen(false); return; }
    setLoading(true);
    try {
      const r = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,departement&boost=population&limit=6`
      );
      const data: Commune[] = await r.json();
      setSuggestions(data);
      setOpen(data.length > 0);
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    setSelected(null);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fetchSuggestions(v), 260);
  };

  const handleSelect = (c: Commune) => {
    setSelected(c);
    setQuery(c.nom);
    setSuggestions([]);
    setOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleGo = () => {
    if (!selected) return;
    router.push(`/comparateur?commune=${encodeURIComponent(selected.code)}&nom=${encodeURIComponent(selected.nom)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selected) handleGo();
    if (e.key === 'Escape') setOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label className="lm-label" htmlFor="lm-commune-input">
          Votre commune
        </label>
        <div className="lm-input-wrap" ref={wrapRef}>
          <input
            id="lm-commune-input"
            className="lm-input"
            type="text"
            placeholder="Ex. : La Rochelle, Nantes, Bordeaux…"
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            aria-label="Nom de commune"
            aria-expanded={open}
            aria-haspopup="listbox"
          />
          {loading && (
            <span style={{
              position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: 'var(--fg-4)',
            }}>…</span>
          )}
          {open && suggestions.length > 0 && (
            <div className="lm-dropdown" role="listbox">
              {suggestions.map((c) => (
                <button
                  key={c.code}
                  className="lm-row"
                  role="option"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(c); }}
                >
                  <span className="lm-row-name">{c.nom}</span>
                  <span className="lm-row-meta">
                    {c.codesPostaux?.[0]} · {c.departement?.nom}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <button
        className="lm-cta"
        onClick={handleGo}
        disabled={!selected}
        aria-label={selected ? `Comparer ${selected.nom}` : 'Sélectionnez une commune'}
      >
        {selected ? `Comparer ${selected.nom}` : 'Comparer cette commune'}
        <span aria-hidden style={{ fontSize: 16 }}>→</span>
      </button>

      <a href="/comparateur" className="lm-secondary">
        Voir le comparateur complet
      </a>
    </div>
  );
}
