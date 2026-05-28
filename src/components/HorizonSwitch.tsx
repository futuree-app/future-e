'use client';

export type Horizon = 'today' | '2030' | '2050' | '2100';

interface HorizonSwitchProps {
  value: Horizon;
  onChange: (horizon: Horizon) => void;
}

const HORIZONS: { key: Horizon; label: string; sublabel: string | null }[] = [
  { key: 'today', label: "Aujourd'hui", sublabel: null },
  { key: '2030',  label: '2030',         sublabel: '+2°C'   },
  { key: '2050',  label: '2050',         sublabel: '+2.7°C' },
  { key: '2100',  label: '2100',         sublabel: '+4°C'   },
];

export function HorizonSwitch({ value, onChange }: HorizonSwitchProps) {
  return (
    <div className="horizon-switch-wrapper">
      <div className="horizon-switch-label">Projection climatique</div>
      <div className="horizon-switch">
        {HORIZONS.map((h) => (
          <button
            key={h.key}
            onClick={() => onChange(h.key)}
            className={`horizon-btn${value === h.key ? ' horizon-btn--active' : ''}`}
            aria-pressed={value === h.key}
          >
            <span className="horizon-btn-label">{h.label}</span>
            {h.sublabel && (
              <span className="horizon-btn-sublabel">{h.sublabel}</span>
            )}
          </button>
        ))}
      </div>
      <div className="horizon-switch-source">Source DRIAS · TRACC-2023 · Météo-France</div>
    </div>
  );
}
