'use client';

import type { CSSProperties } from 'react';

export type Horizon = 'today' | '2030' | '2050' | '2100';

interface HorizonSwitchProps {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
}

const HORIZONS: { key: Horizon; label: string; sublabel: string | null }[] = [
  { key: 'today', label: "Auj.",  sublabel: null     },
  { key: '2030',  label: '2030',  sublabel: '+2°C'   },
  { key: '2050',  label: '2050',  sublabel: '+2.7°C' },
  { key: '2100',  label: '2100',  sublabel: '+4°C'   },
];

const wrapper: CSSProperties = {
  display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14,
};
const label: CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6b7388',
};
const track: CSSProperties = {
  display: 'inline-flex', gap: 2,
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8, padding: 3,
};
const btn = (active: boolean): CSSProperties => ({
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
  padding: '6px 10px', borderRadius: 6,
  background: active ? 'rgba(200,184,154,0.14)' : 'transparent',
  border: active ? '1px solid rgba(200,184,154,0.3)' : '1px solid transparent',
  cursor: 'pointer', transition: 'all 0.15s ease', minWidth: 48,
});
const btnLabel = (active: boolean): CSSProperties => ({
  fontFamily: "'Instrument Sans', system-ui, sans-serif",
  fontSize: 12, fontWeight: 500,
  color: active ? '#c8b89a' : '#9ba3b4',
  transition: 'color 0.15s', lineHeight: '1',
});
const btnSublabel = (active: boolean): CSSProperties => ({
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: 9, letterSpacing: '0.04em',
  color: active ? 'rgba(200,184,154,0.7)' : '#6b7388',
  transition: 'color 0.15s', lineHeight: '1',
});

export function HorizonSwitch({ value, onChange }: HorizonSwitchProps) {
  return (
    <div style={wrapper}>
      <span style={label}>Projection climatique</span>
      <div style={track}>
        {HORIZONS.map((h) => {
          const active = value === h.key;
          return (
            <button
              key={h.key}
              onClick={() => onChange(h.key)}
              style={btn(active)}
              aria-pressed={active}
            >
              <span style={btnLabel(active)}>{h.label}</span>
              {h.sublabel && (
                <span style={btnSublabel(active)}>{h.sublabel}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
