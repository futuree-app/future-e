'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { isArrondissement } from '@/lib/communes';

interface CommuneResult {
  code: string;
  nom: string;
  codesPostaux: string[];
  codeDepartement: string;
}

interface CommuneSearchProps {
  slug: string;
  accent?: string;
  placeholder?: string;
  basePath?: string; // ex: '/chaleur' — override du chemin de destination
}

export function CommuneSearch({
  slug,
  accent = '#60a5fa',
  placeholder = 'Saisissez votre commune…',
  basePath,
}: CommuneSearchProps) {
  const [value, setValue] = useState('');
  const [results, setResults] = useState<CommuneResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const debounce = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapRef = useRef<HTMLDivElement>(null);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(q)}&fields=nom,code,codesPostaux,codeDepartement&limit=8&boost=population`,
      );
      const raw: CommuneResult[] = await res.json();
      const data = raw.filter((c) => !isArrondissement(c.code));
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setValue(q);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(() => search(q), 220);
  }

  function handleSelect(commune: CommuneResult) {
    setOpen(false);
    setValue(commune.nom);
    startTransition(() => {
      router.push(basePath ? `${basePath}/${commune.code}` : `/territoires/${slug}/${commune.code}`);
    });
  }

  return (
    <>
      <style>{`
        .cs-input:focus { border-color: ${accent}80 !important; background: rgba(255,255,255,0.07) !important; outline: none; }
        .cs-row:hover { background: rgba(255,255,255,0.05) !important; }
        @keyframes cs-progress {
          0%   { width: 0%;   opacity: 1; }
          60%  { width: 75%;  opacity: 1; }
          90%  { width: 92%;  opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .cs-progress-bar {
          position: fixed; top: 0; left: 0; height: 2px; z-index: 9999;
          background: linear-gradient(90deg, ${accent}, ${accent}99);
          border-radius: 0 2px 2px 0;
          animation: cs-progress 8s cubic-bezier(0.1, 0.4, 0.2, 1) forwards;
        }
      `}</style>
      {isPending && <div className="cs-progress-bar" />}
      <div ref={wrapRef} style={{ position: 'relative', maxWidth: 520 }}>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              position: 'absolute',
              left: 16,
              color: accent,
              fontSize: 18,
              pointerEvents: 'none',
              opacity: 0.8,
            }}
          >
            ⌖
          </span>
          <input
            type="text"
            className="cs-input"
            value={value}
            onChange={handleChange}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 180)}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              color: '#e9ecf2',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          {loading && (
            <span
              style={{
                position: 'absolute',
                right: 14,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10,
                color: '#6b7388',
                letterSpacing: '0.06em',
              }}
            >
              …
            </span>
          )}
        </div>

        {open && results.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: 0,
              right: 0,
              background: 'rgba(10,13,28,0.98)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              overflow: 'hidden',
              zIndex: 20,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            {results.map((commune) => (
              <button
                key={commune.code}
                className="cs-row"
                onMouseDown={() => handleSelect(commune)}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    color: '#e9ecf2',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontSize: 14,
                  }}
                >
                  {commune.nom}
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 10,
                    color: '#6b7388',
                    letterSpacing: '0.06em',
                    flexShrink: 0,
                  }}
                >
                  {commune.codesPostaux[0] ?? ''} · Dept. {commune.codeDepartement}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
