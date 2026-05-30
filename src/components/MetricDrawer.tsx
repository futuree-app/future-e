"use client";

// Drawer de détail d'une carte-indicateur — primitive de design-system réutilisable.
//
// Principe : une carte n'est pas un KPI mort, c'est une porte d'entrée. Au clic,
// ce panneau glisse depuis la droite (desktop) ou monte du bas (mobile) SANS
// quitter la page. Contenu court et éditorial : chiffre phare → répartition →
// faits → « pourquoi ce chiffre compte » → (optionnel) question AskFuture.
//
// Agnostique du module : Quartier, Logement, Santé… fournissent juste un CardDetail.

import { useEffect } from "react";

export type CardDetail = {
  eyebrow: string;
  title: string;
  headline: string;
  /** Phrase de synthèse courte sous le chiffre phare. */
  subhead?: string;
  accent?: string;
  breakdown?: { label: string; value: string }[];
  facts?: { label: string; value: string }[];
  why: string;
  /** Si fourni, affiche « Poser une question » qui pré-remplit AskFuture (événement). */
  askPrefill?: string;
};

export function MetricDrawer({
  detail,
  onClose,
}: {
  detail: CardDetail | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!detail) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [detail, onClose]);

  if (!detail) return null;
  const accent = detail.accent ?? "var(--orange)";

  return (
    <div className="metric-drawer-root" onClick={onClose} role="presentation">
      <aside
        className="metric-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label={detail.title}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="metric-drawer-close" onClick={onClose} aria-label="Fermer">
          ✕
        </button>

        <p className="metric-drawer-eyebrow" style={{ color: accent }}>{detail.eyebrow}</p>
        <h3 className="metric-drawer-title">{detail.title}</h3>
        <div className="metric-drawer-head">
          <p className="metric-drawer-headline" style={{ color: accent }}>{detail.headline}</p>
          {detail.subhead && <p className="metric-drawer-subhead">{detail.subhead}</p>}
        </div>

        {detail.breakdown && detail.breakdown.length > 0 && (
          <div className="metric-drawer-section">
            <p className="metric-drawer-label">Répartition</p>
            <ul className="metric-drawer-rows">
              {detail.breakdown.map((r) => (
                <li key={r.label}>
                  <span>{r.label}</span>
                  <span className="metric-drawer-val">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {detail.facts && detail.facts.length > 0 && (
          <div className="metric-drawer-facts">
            {detail.facts.map((f) => (
              <div key={f.label} className="metric-drawer-fact">
                <span>{f.label}</span>
                <span className="metric-drawer-val">{f.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="metric-drawer-section">
          <p className="metric-drawer-label">Pourquoi ce chiffre compte</p>
          <p className="metric-drawer-why">{detail.why}</p>
        </div>

        {detail.askPrefill && (
          <button
            type="button"
            className="metric-drawer-ask"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent("futuree:ask", { detail: { prefill: detail.askPrefill } }),
              );
              onClose();
            }}
          >
            Poser une question à futur•e <span aria-hidden>→</span>
          </button>
        )}
      </aside>

      <style>{`
        .metric-drawer-root {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(4,6,14,0.55);
          backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
          display: flex; justify-content: flex-end;
          animation: metric-fade 0.18s ease;
        }
        .metric-drawer-panel {
          position: relative; width: clamp(320px, 92vw, 440px); height: 100%;
          overflow-y: auto; background: #0b101c;
          border-left: 1px solid rgba(255,255,255,0.1);
          box-shadow: -20px 0 60px rgba(0,0,0,0.5);
          padding: 30px 28px 36px;
          animation: metric-slide-right 0.26s cubic-bezier(0.22,1,0.36,1);
          font-family: 'Instrument Sans', sans-serif;
        }
        .metric-drawer-close {
          position: absolute; top: 18px; right: 18px; width: 30px; height: 30px;
          border-radius: 8px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1); color: #9ba3b4; cursor: pointer; font-size: 13px;
        }
        .metric-drawer-close:hover { background: rgba(255,255,255,0.08); color: #e9ecf2; }
        .metric-drawer-eyebrow {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 8px;
        }
        .metric-drawer-title {
          font-family: 'Instrument Serif', serif; font-weight: 400; font-style: italic;
          font-size: 24px; color: #e9ecf2; margin: 0 0 14px; line-height: 1.2;
        }
        .metric-drawer-head { margin-bottom: 26px; }
        .metric-drawer-headline {
          font-family: 'JetBrains Mono', monospace; font-size: 20px; font-weight: 600;
          margin: 0 0 6px; letter-spacing: 0.01em;
        }
        .metric-drawer-subhead {
          font-size: 14px; line-height: 1.5; color: #9ba3b4; margin: 0;
        }
        .metric-drawer-section { margin-bottom: 24px; }
        .metric-drawer-label {
          font-family: 'JetBrains Mono', monospace; font-size: 10px;
          letter-spacing: 0.16em; text-transform: uppercase; color: #6b7388; margin: 0 0 10px;
        }
        .metric-drawer-rows { list-style: none; margin: 0; padding: 0; }
        .metric-drawer-rows li {
          display: flex; justify-content: space-between; align-items: baseline;
          padding: 9px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 14px; color: #c6cfdb;
        }
        .metric-drawer-val { font-family: 'JetBrains Mono', monospace; color: #e9ecf2; }
        .metric-drawer-facts { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; }
        .metric-drawer-fact {
          flex: 1; min-width: 130px;
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px; padding: 12px 14px;
          display: flex; flex-direction: column; gap: 4px; font-size: 12px; color: #9ba3b4;
        }
        .metric-drawer-fact .metric-drawer-val { font-size: 16px; }
        .metric-drawer-why { font-size: 15px; line-height: 1.7; color: #9ba3b4; margin: 0; }
        .metric-drawer-ask {
          margin-top: 8px; width: 100%;
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          padding: 12px 16px; border-radius: 10px;
          background: rgba(200,184,154,0.12); border: 1px solid rgba(200,184,154,0.35);
          color: #c8b89a; font-size: 14px; font-weight: 500; cursor: pointer;
          font-family: inherit; transition: all 0.15s;
        }
        .metric-drawer-ask:hover { background: rgba(200,184,154,0.2); border-color: rgba(200,184,154,0.6); }
        @keyframes metric-fade { from { opacity: 0; } to { opacity: 1; } }
        @keyframes metric-slide-right { from { transform: translateX(40px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
        @media (max-width: 640px) {
          .metric-drawer-root { justify-content: center; align-items: flex-end; }
          .metric-drawer-panel {
            width: 100%; height: auto; max-height: 86vh;
            border-left: none; border-top: 1px solid rgba(255,255,255,0.1);
            border-radius: 18px 18px 0 0;
            animation: metric-slide-up 0.26s cubic-bezier(0.22,1,0.36,1);
          }
        }
        @keyframes metric-slide-up { from { transform: translateY(40px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
