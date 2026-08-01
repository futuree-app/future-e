'use client';

import type { CSSProperties } from 'react';

export type Horizon = 'today' | '2030' | '2050' | '2100';

interface HorizonSwitchProps {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
}

const HORIZONS: { key: Horizon; label: string }[] = [
  { key: 'today', label: "Aujourd'hui" },
  { key: '2030',  label: '2030'        },
  { key: '2050',  label: '2050'        },
  { key: '2100',  label: '2100'        },
];

const SCENARIO_LABEL: Record<Horizon, string> = {
  today: 'données actuelles',
  '2030': 'projection +2°C · DRIAS TRACC-2023',
  '2050': 'projection +2.7°C · DRIAS TRACC-2023',
  '2100': 'projection +4°C · DRIAS TRACC-2023',
};

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
        {HORIZONS.map((h) => (
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
      <span style={scenarioLine}>{SCENARIO_LABEL[value]}</span>
    </div>
  );
}
