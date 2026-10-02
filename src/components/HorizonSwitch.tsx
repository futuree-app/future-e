'use client';

import type { CSSProperties } from 'react';

import { HORIZONS_ACCUEIL, type HorizonAccueil } from '@/lib/accueil/recits';

// FUT-37 : l'onglet « Aujourd'hui · données actuelles » lisait la projection 2030 (gwl15). DRIAS n'expose
// aucune valeur présente : l'onglet devient la période de référence 1976-2005, reconstruite. Les paliers
// et leur équivalent France viennent de src/lib/horizons.ts, via le module des récits.
export type Horizon = HorizonAccueil;

interface HorizonSwitchProps {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
}

const wrapper: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginBottom: 16,
};

const track: CSSProperties = {
  display: 'flex',
  gap: 3,
  background: 'var(--bg-elev)',
  border: '1px solid var(--border-1)',
  borderRadius: 10,
  padding: 4,
};

const btn = (active: boolean): CSSProperties => ({
  flex: 1,
  padding: '9px 6px',
  borderRadius: 7,
  background: active ? 'rgba(200,184,154,0.15)' : 'transparent',
  border: active ? '1px solid rgba(200,184,154,0.28)' : '1px solid transparent',
  cursor: 'pointer',
  transition: 'background 0.18s ease, border-color 0.18s ease',
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  fontWeight: active ? 600 : 400,
  color: active ? '#c8b89a' : '#9ba3b4',
  letterSpacing: active ? '-0.01em' : '0',
  textAlign: 'center' as const,
  lineHeight: '1',
  whiteSpace: 'nowrap' as const,
});

const scenarioLine: CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 9,
  letterSpacing: '0.07em',
  textTransform: 'uppercase' as const,
  color: '#6b7388',
  lineHeight: 1,
};

export function HorizonSwitch({ value, onChange }: HorizonSwitchProps) {
  return (
    <div style={wrapper}>
      <div style={track}>
        {HORIZONS_ACCUEIL.map((h) => (
          <button
            key={h.key}
            onClick={() => onChange(h.key)}
            style={btn(value === h.key)}
            aria-pressed={value === h.key}
          >
            {h.label}
          </button>
        ))}
      </div>
      <span style={scenarioLine}>{HORIZONS_ACCUEIL.find((h) => h.key === value)?.mention}</span>
    </div>
  );
}
