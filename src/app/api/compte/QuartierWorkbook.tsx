"use client";

import { useEffect, useMemo, useRef, useState } from "react";

// ─── palette ─────────────────────────────────────────────────────────────────
const C = {
  bg: "#060812",
  bgElev: "rgba(255,255,255,0.03)",
  border: "rgba(255,255,255,0.08)",
  text: "#e9ecf2",
  muted: "#9ba3b4",
  dim: "#6b7388",
  orange: "#fb923c",
  blue: "#60a5fa",
  green: "#4ade80",
  violet: "#a78bfa",
};

function glass(extra: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: C.bgElev,
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${C.border}`,
    ...extra,
  };
}

// ─── types ────────────────────────────────────────────────────────────────────
type QuartierWorkbookProps = { userKey: string };
type QuartierAnswers = { heat: string; water: string; shelter: string; note: string };
const EMPTY: QuartierAnswers = { heat: "", water: "", shelter: "", note: "" };
const PREFIX = "futuree:quartier-workbook:";

// ─── questions ────────────────────────────────────────────────────────────────
const QUESTIONS = [
  {
    key: "heat" as const,
    label: "L\u2019\u00e9t\u00e9, comment tenez-vous d\u00e9j\u00e0 dans votre quartier\u00a0?",
    sub: "Chaleur, nuits, sorties",
    options: [
      { value: "supportable", label: "L\u2019\u00e9t\u00e9 reste supportable" },
      { value: "fragile",     label: "L\u2019\u00e9t\u00e9 commence \u00e0 peser" },
      { value: "difficile",   label: "L\u2019\u00e9t\u00e9 est d\u00e9j\u00e0 difficile" },
    ],
  },
  {
    key: "water" as const,
    label: "Le sujet eau est-il d\u00e9j\u00e0 visible autour de vous\u00a0?",
    sub: "Restrictions, nappes, ruissellement",
    options: [
      { value: "loin",      label: "Je ne me sens pas expos\u00e9" },
      { value: "ponctuel",  label: "J\u2019ai d\u00e9j\u00e0 vu des tensions ponctuelles" },
      { value: "present",   label: "L\u2019eau est d\u00e9j\u00e0 un sujet concret ici" },
    ],
  },
  {
    key: "shelter" as const,
    label: "Le cadre de vie absorbe-t-il encore bien les \u00e9t\u00e9s qui se durcissent\u00a0?",
    sub: "Ombre, espaces verts, \u00eelots de chaleur",
    options: [
      { value: "resilient",  label: "Le quartier absorbe encore bien" },
      { value: "tendu",      label: "Le cadre de vie se tend l\u2019\u00e9t\u00e9" },
      { value: "fragilise",  label: "Le quartier montre d\u00e9j\u00e0 ses limites" },
    ],
  },
];

// ─── styles ───────────────────────────────────────────────────────────────────
const S = {
  wrap: {
    ...glass({ borderRadius: 16, padding: "32px 28px" }),
    borderTop: `2px solid ${C.blue}`,
    display: "flex",
    flexDirection: "column" as const,
    gap: 28,
  },
  head: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  kicker: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 10,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: C.dim,
    marginBottom: 6,
  },
  title: {
    fontFamily: "'Instrument Serif', serif",
    fontWeight: 400,
    fontSize: 20,
    color: C.text,
    margin: 0,
    letterSpacing: -0.2,
    lineHeight: 1.2,
  },
  progressPill: (pct: number): React.CSSProperties => ({
    flexShrink: 0,
    padding: "5px 12px",
    borderRadius: 100,
    background: pct === 1
      ? "rgba(74,222,128,0.12)"
      : "rgba(255,255,255,0.04)",
    border: `1px solid ${pct === 1 ? "rgba(74,222,128,0.3)" : C.border}`,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: pct === 1 ? C.green : C.dim,
    letterSpacing: "0.04em",
    whiteSpace: "nowrap" as const,
  }),
  progressBar: {
    height: 2,
    borderRadius: 2,
    background: "rgba(255,255,255,0.06)",
    overflow: "hidden",
  },
  progressFill: (pct: number): React.CSSProperties => ({
    height: "100%",
    borderRadius: 2,
    background: pct === 1
      ? C.green
      : `linear-gradient(90deg, ${C.blue}, ${C.violet})`,
    width: `${pct * 100}%`,
    transition: "width 0.4s ease",
  }),
  questionWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 10,
  },
  questionLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: C.text,
    lineHeight: 1.4,
    margin: 0,
  },
  questionSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: "0.04em",
    marginTop: 2,
  },
  choiceGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  choiceBtn: (active: boolean): React.CSSProperties => ({
    width: "100%",
    textAlign: "left" as const,
    padding: "12px 16px",
    borderRadius: 8,
    background: active ? "rgba(96,165,250,0.1)" : "rgba(255,255,255,0.03)",
    border: `1px solid ${active ? "rgba(96,165,250,0.5)" : C.border}`,
    color: active ? C.text : C.muted,
    fontSize: 14,
    fontFamily: "'Instrument Sans', sans-serif",
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    gap: 12,
    boxShadow: active ? "0 0 0 1px rgba(96,165,250,0.2), 0 4px 16px rgba(96,165,250,0.08)" : "none",
  }),
  checkCircle: (active: boolean): React.CSSProperties => ({
    width: 16,
    height: 16,
    borderRadius: "50%",
    border: `1.5px solid ${active ? C.blue : C.border}`,
    background: active ? C.blue : "transparent",
    flexShrink: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
  }),
  checkMark: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: C.bg,
  } as React.CSSProperties,
  noteWrap: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 8,
  },
  noteLabel: {
    fontSize: 15,
    fontWeight: 500,
    color: C.text,
    lineHeight: 1.4,
    margin: 0,
  } as React.CSSProperties,
  noteSub: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: "0.04em",
  } as React.CSSProperties,
  textarea: (focused: boolean): React.CSSProperties => ({
    width: "100%",
    padding: "14px 16px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${focused ? "rgba(96,165,250,0.5)" : C.border}`,
    color: C.text,
    fontSize: 14,
    fontFamily: "'Instrument Sans', sans-serif",
    lineHeight: 1.65,
    resize: "vertical" as const,
    outline: "none",
    boxSizing: "border-box" as const,
    minHeight: 110,
    transition: "border-color 0.15s ease",
  }),
  savedRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 11,
    color: C.dim,
    letterSpacing: "0.04em",
  } as React.CSSProperties,
  savedDot: (saved: boolean): React.CSSProperties => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: saved ? C.green : C.dim,
    boxShadow: saved ? `0 0 6px ${C.green}` : "none",
    transition: "all 0.3s ease",
    flexShrink: 0,
  }),
  helperBox: {
    ...glass({
      borderRadius: 8,
      padding: "14px 16px",
      borderLeft: "2px solid rgba(96,165,250,0.4)",
      borderColor: "rgba(96,165,250,0.15)",
    }),
    fontSize: 13,
    color: C.muted,
    lineHeight: 1.65,
  } as React.CSSProperties,
};

// ─── component ────────────────────────────────────────────────────────────────
export function QuartierWorkbook({ userKey }: QuartierWorkbookProps) {
  const storageKey = `${PREFIX}${userKey}`;
  const [answers, setAnswers] = useState<QuartierAnswers>(EMPTY);
  const [ready, setReady] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [focusedTextarea, setFocusedTextarea] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── hydrate from localStorage
  useEffect(() => {
    let cancelled = false;
    const frame = window.requestAnimationFrame(() => {
      if (cancelled) return;
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const p = JSON.parse(stored) as Partial<QuartierAnswers>;
          setAnswers({
            heat: p.heat ?? "",
            water: p.water ?? "",
            shelter: p.shelter ?? "",
            note: p.note ?? "",
          });
        }
      } catch {
        setAnswers(EMPTY);
      } finally {
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
    };
  }, [storageKey]);

  // ── persist to localStorage (séparé du feedback visuel)
  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(storageKey, JSON.stringify(answers));
  }, [answers, ready, storageKey]);

  // ── feedback visuel "Sauvegardé" (effet indépendant)
  useEffect(() => {
    if (!ready) return;
    setJustSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setJustSaved(false), 1800);
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, [answers, ready]);

  const completion = useMemo(() => {
    return [answers.heat, answers.water, answers.shelter, answers.note.trim()].filter(Boolean).length;
  }, [answers]);

  const completionPct = completion / 4;

  function pick(field: "heat" | "water" | "shelter", value: string) {
    setAnswers((c) => ({ ...c, [field]: c[field] === value ? "" : value }));
  }

  return (
    <div style={S.wrap}>

      {/* en-tête + barre de progression */}
      <div>
        <div style={S.head}>
          <div>
            <p style={S.kicker}>Module ouvert · À compléter</p>
            <h3 style={S.title}>Vos repères de terrain</h3>
          </div>
          <span style={S.progressPill(completionPct)}>
            {completion}/4{completionPct === 1 ? " ✓" : ""}
          </span>
        </div>
        <div style={{ marginTop: 14 }}>
          <div style={S.progressBar}>
            <div style={S.progressFill(completionPct)} />
          </div>
        </div>
      </div>

      {/* 3 questions à choix */}
      {QUESTIONS.map((q) => (
        <div key={q.key} style={S.questionWrap}>
          <div>
            <p style={S.questionLabel}>{q.label}</p>
            <span style={S.questionSub}>{q.sub}</span>
          </div>
          <div style={S.choiceGrid}>
            {q.options.map((opt) => {
              const active = answers[q.key] === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  style={S.choiceBtn(active)}
                  onClick={() => pick(q.key, opt.value)}
                >
                  <span style={S.checkCircle(active)}>
                    {active && <span style={S.checkMark} />}
                  </span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* note libre */}
      <div style={S.noteWrap}>
        <div>
          <p style={S.noteLabel}>Ce que vous avez déjà vu changer</p>
          <span style={S.noteSub}>Libre, facultatif, conservé dans ce navigateur</span>
        </div>
        <textarea
          id="quartier-note"
          style={S.textarea(focusedTextarea)}
          placeholder="Les nuits sont devenues plus lourdes, l'ombre manque en été, le jardin souffre, les rues se vident plus tôt..."
          rows={5}
          value={answers.note}
          onChange={(e) => setAnswers((c) => ({ ...c, note: e.target.value }))}
          onFocus={() => setFocusedTextarea(true)}
          onBlur={() => setFocusedTextarea(false)}
        />
      </div>

      {/* statut sauvegarde */}
      <div style={S.savedRow}>
        <span style={S.savedDot(justSaved)} />
        {justSaved ? "Sauvegardé dans ce navigateur" : "Sauvegarde automatique"}
      </div>

      {/* note éditoriale */}
      <div style={S.helperBox}>
        Ce module ne remplace pas la lecture du territoire. Il lui donne un point d&apos;accroche plus personnel : vos observations croisées avec les données publiques, dans la suite du rapport.
      </div>
    </div>
  );
}
