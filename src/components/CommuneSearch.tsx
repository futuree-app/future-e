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
  accent?: string;
  placeholder?: string;
  // Chemin de destination, ex : '/chaleur' → /chaleur/17300. Obligatoire dès qu'`onSelect` n'est pas
  // fourni. Le repli historique vers `/territoires/[slug]/[code]` a disparu avec ce gabarit
  // (30/07/2026) : il n'existe plus de destination générique par défaut.
  basePath?: string;
  // Si fourni, on appelle ce callback au choix d'une commune AU LIEU de naviguer
  // (utilisé par l'amorce « partez d'une commune » de /ou-vivre, Phase B).
  onSelect?: (commune: { code: string; nom: string }) => void;
}

export function CommuneSearch({
  accent = '#60a5fa',
  placeholder = 'Saisissez votre commune…',
  basePath,
  onSelect,
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
    if (onSelect) {
      onSelect({ code: commune.code, nom: commune.nom });
      return;
    }
    startTransition(() => {
      router.push(`${basePath}/${commune.code}`);
    });
  }

  // ════════════════════════════════════════════════════════════════════════════════════════════════
  // LA SOURIS ET LE CLAVIER CHOISISSENT DE LA MÊME FAÇON (FUT-114, revue de la PR #67).
  //
  // La ligne se choisissait au `mousedown` seul : Entrée ou Espace sur une suggestion ne faisaient rien, et
  // la liste se fermait 180 ms après que le champ perdait le focus, donc avant qu'une tabulation l'atteigne.
  // Or ce champ est désormais le passage obligé du dossier de territoire à 14 €. La sélection passe par
  // `click` (souris, Entrée, Espace) ; le `mousedown` est seulement neutralisé pour que le champ garde le
  // focus pendant le clic ; la liste ne se ferme que lorsque le focus quitte le composant entier.
  // ════════════════════════════════════════════════════════════════════════════════════════════════
  function fermerSiFocusSort(e: React.FocusEvent) {
    if (!wrapRef.current?.contains(e.relatedTarget as Node | null)) setOpen(false);
  }

  function lignes(): HTMLButtonElement[] {
    return Array.from(wrapRef.current?.querySelectorAll<HTMLButtonElement>('button.cs-row') ?? []);
  }

  function naviguer(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      // Le focus d'abord (son `onFocus` rouvre la liste), la fermeture ensuite : la dernière mise à jour l'emporte.
      wrapRef.current?.querySelector<HTMLInputElement>('input')?.focus();
      setOpen(false);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const liste = lignes();
    if (liste.length === 0) return;
    e.preventDefault();
    const i = liste.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowDown') liste[Math.min(i + 1, liste.length - 1)]?.focus();
    else if (i <= 0) wrapRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    else liste[i - 1]?.focus();
  }

  return (
    <>
      <style>{`
        .cs-input:focus { border-color: ${accent}80 !important; background: var(--bg-elev-3) !important; outline: none; }
        .cs-row:hover { background: var(--bg-elev-2) !important; }
        .cs-row:focus-visible { background: var(--bg-elev-2) !important; outline: 2px solid ${accent}; outline-offset: -2px; }
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
            onBlur={fermerSiFocusSort}
            onKeyDown={naviguer}
            placeholder={placeholder}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '14px 16px 14px 44px',
              background: 'var(--bg-elev-2)',
              border: '1px solid var(--border-2)',
              borderRadius: 8,
              color: 'var(--fg-1)',
              fontFamily: "var(--font-mono)",
              fontSize: 13,
              transition: 'border-color 0.2s, background 0.2s',
            }}
          />
          {loading && (
            <span
              style={{
                position: 'absolute',
                right: 14,
                fontFamily: "var(--font-mono)",
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
              border: '1px solid var(--border-2)',
              borderRadius: 8,
              overflow: 'hidden',
              zIndex: 20,
              boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            }}
          >
            {results.map((commune) => (
              <button
                key={commune.code}
                type="button"
                className="cs-row"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(commune)}
                onBlur={fermerSiFocusSort}
                onKeyDown={naviguer}
                style={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '11px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border-1)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    color: 'var(--fg-1)',
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                  }}
                >
                  {commune.nom}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
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
