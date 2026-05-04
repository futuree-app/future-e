'use client';

import { startTransition, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type CommuneResult = {
  code: string;
  nom: string;
  codePostal: string | null;
  codeDepartement: string | null;
};

type SelectedCommune = {
  code: string;
  nom: string;
};

type InputKey = 'left' | 'right';

interface ComparatorSearchProps {
  initialLeft?: SelectedCommune | null;
  initialRight?: SelectedCommune | null;
}

type SearchState = {
  value: string;
  selected: SelectedCommune | null;
  results: CommuneResult[];
  open: boolean;
  loading: boolean;
};

const EMPTY_STATE: SearchState = {
  value: '',
  selected: null,
  results: [],
  open: false,
  loading: false,
};

export function ComparatorSearch({
  initialLeft = null,
  initialRight = null,
}: ComparatorSearchProps) {
  const router = useRouter();
  const debounce = useRef<Record<InputKey, ReturnType<typeof setTimeout> | undefined>>({
    left: undefined,
    right: undefined,
  });
  const [left, setLeft] = useState<SearchState>({
    ...EMPTY_STATE,
    value: initialLeft?.nom ?? '',
    selected: initialLeft,
  });
  const [right, setRight] = useState<SearchState>({
    ...EMPTY_STATE,
    value: initialRight?.nom ?? '',
    selected: initialRight,
  });
  const [copyLabel, setCopyLabel] = useState('Copier le lien');

  const updateState = useCallback(
    (key: InputKey, updater: (prev: SearchState) => SearchState) => {
      if (key === 'left') {
        setLeft((prev) => updater(prev));
        return;
      }

      setRight((prev) => updater(prev));
    },
    [],
  );

  const search = useCallback(
    async (key: InputKey, query: string) => {
      if (query.trim().length < 2) {
        updateState(key, (current) => ({
          ...current,
          loading: false,
          results: [],
          open: false,
        }));
        return;
      }

      updateState(key, (current) => ({ ...current, loading: true }));

      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(query)}&fields=nom,code,codesPostaux,codeDepartement&limit=8&boost=population`,
        );
        const payload = await res.json();
        const data: CommuneResult[] = Array.isArray(payload)
          ? payload.map((item: {
              code: string;
              nom: string;
              codesPostaux?: string[];
              codeDepartement?: string;
            }) => ({
              code: item.code,
              nom: item.nom,
              codePostal: item.codesPostaux?.[0] ?? null,
              codeDepartement: item.codeDepartement ?? null,
            }))
          : [];

        updateState(key, (current) => {
          if (current.value.trim().toLowerCase() !== query.trim().toLowerCase()) {
            return current;
          }

          return {
            ...current,
            loading: false,
            results: data,
            open: data.length > 0,
          };
        });
      } catch {
        updateState(key, (current) => ({
          ...current,
          loading: false,
          results: [],
          open: false,
        }));
      }
    },
    [updateState],
  );

  const resolveSelection = useCallback(
    async (key: InputKey) => {
      const state = key === 'left' ? left : right;

      if (state.selected || state.value.trim().length < 2) {
        return state.selected;
      }

      try {
        const res = await fetch(
          `https://geo.api.gouv.fr/communes?nom=${encodeURIComponent(state.value)}&fields=nom,code,codesPostaux,codeDepartement&limit=1&boost=population`,
        );
        const payload = await res.json();
        const first = Array.isArray(payload) ? payload[0] : null;

        if (!first?.code || !first?.nom) {
          return null;
        }

        const commune: CommuneResult = {
          code: first.code,
          nom: first.nom,
          codePostal: first.codesPostaux?.[0] ?? null,
          codeDepartement: first.codeDepartement ?? null,
        };

        handleSelect(key, commune);
        return { code: commune.code, nom: commune.nom };
      } catch {
        return null;
      }
    },
    [left, right],
  );

  function handleChange(key: InputKey, value: string) {
    updateState(key, (current) => ({
      ...current,
      value,
      selected:
        current.selected && current.selected.nom.toLowerCase() === value.trim().toLowerCase()
          ? current.selected
          : null,
    }));

    clearTimeout(debounce.current[key]);
    debounce.current[key] = setTimeout(() => {
      void search(key, value);
    }, 220);
  }

  function handleSelect(key: InputKey, commune: CommuneResult) {
    updateState(key, () => ({
      value: commune.nom,
      selected: { code: commune.code, nom: commune.nom },
      results: [],
      open: false,
      loading: false,
    }));
  }

  async function runComparison() {
    const resolvedLeft = left.selected ?? (await resolveSelection('left'));
    const resolvedRight = right.selected ?? (await resolveSelection('right'));

    if (!resolvedLeft || !resolvedRight) {
      return;
    }

    const params = new URLSearchParams();
    params.set('a', resolvedLeft.code);
    params.set('an', resolvedLeft.nom);
    params.set('b', resolvedRight.code);
    params.set('bn', resolvedRight.nom);

    startTransition(() => {
      router.replace(`/comparateur?${params.toString()}`, { scroll: false });
    });
  }

  async function copyShareLink() {
    if (!left.selected || !right.selected) {
      return;
    }

    const params = new URLSearchParams();
    params.set('a', left.selected.code);
    params.set('an', left.selected.nom);
    params.set('b', right.selected.code);
    params.set('bn', right.selected.nom);

    const url = `${window.location.origin}/comparateur?${params.toString()}`;
    await navigator.clipboard.writeText(url);
    setCopyLabel('Lien copié');
    window.setTimeout(() => setCopyLabel('Copier le lien'), 1800);
  }

  const ready = left.value.trim().length >= 2 && right.value.trim().length >= 2;

  return (
    <>
      <style>{`
        .cmp-input:focus { border-color: rgba(248,113,113,0.35) !important; background: rgba(255,255,255,0.05) !important; outline: none; }
        .cmp-row:hover { background: rgba(255,255,255,0.05) !important; }
      `}</style>

      <div className="compare-shell">
        <div className="compare-selector">
          <SearchInput
            label="Commune A"
            state={left}
            onChange={(value) => handleChange('left', value)}
            onFocus={() =>
              left.results.length > 0 &&
              updateState('left', (current) => ({ ...current, open: true }))
            }
            onBlur={() =>
              window.setTimeout(
                () => updateState('left', (current) => ({ ...current, open: false })),
                140,
              )
            }
            onSelect={(commune) => handleSelect('left', commune)}
          />

          <div className="compare-divider">vs</div>

          <SearchInput
            label="Commune B"
            state={right}
            onChange={(value) => handleChange('right', value)}
            onFocus={() =>
              right.results.length > 0 &&
              updateState('right', (current) => ({ ...current, open: true }))
            }
            onBlur={() =>
              window.setTimeout(
                () => updateState('right', (current) => ({ ...current, open: false })),
                140,
              )
            }
            onSelect={(commune) => handleSelect('right', commune)}
          />
        </div>

        <div className="compare-actions">
          <button type="button" className="compare-btn" onClick={runComparison} disabled={!ready}>
            Lancer la comparaison
          </button>
          <button type="button" className="share-btn" onClick={copyShareLink} disabled={!ready}>
            {copyLabel}
          </button>
        </div>
      </div>
    </>
  );
}

interface SearchInputProps {
  label: string;
  state: SearchState;
  onChange: (value: string) => void;
  onFocus: () => void;
  onBlur: () => void;
  onSelect: (commune: CommuneResult) => void;
}

function SearchInput({
  label,
  state,
  onChange,
  onFocus,
  onBlur,
  onSelect,
}: SearchInputProps) {
  return (
    <div className="compare-input-wrap">
      <div className="compare-label">{label}</div>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          className="cmp-input compare-input"
          value={state.value}
          onChange={(event) => onChange(event.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Tapez une commune"
          autoComplete="off"
        />
        {state.loading ? <span className="compare-loading">…</span> : null}

        {state.open && state.results.length > 0 ? (
          <div className="compare-dropdown">
            {state.results.map((commune) => (
              <button
                key={commune.code}
                type="button"
                className="cmp-row compare-row"
                  onMouseDown={() => onSelect(commune)}
              >
                <span className="compare-row-name">{commune.nom}</span>
                <span className="compare-row-meta">
                  {commune.codePostal ? `${commune.codePostal} · ` : ''}Dept. {commune.codeDepartement ?? commune.code.slice(0, 2)}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
