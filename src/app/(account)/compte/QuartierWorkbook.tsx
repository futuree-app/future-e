"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePostHog } from "posthog-js/react";

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
type QuartierWorkbookProps = {
  userKey: string;
  /** Commune observée — requise pour persister dans terrain_observations. */
  commune?: string | null;
  inseeCode?: string | null;
  /** report_id si un jour le concept existe ; aujourd'hui null. */
  reportId?: string | null;
};
type QuartierAnswers = { heat: string; water: string; shelter: string; change: string; note: string };
const EMPTY: QuartierAnswers = { heat: "", water: "", shelter: "", change: "", note: "" };
const PREFIX = "futuree:quartier-workbook:";
type ChoiceKey = "heat" | "water" | "shelter" | "change";

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
    label: "L\u2019eau est-elle d\u00e9j\u00e0 devenue un sujet dans votre quartier\u00a0?",
    sub: "Restrictions, s\u00e9cheresse, ruissellement",
    options: [
      { value: "loin",      label: "Je ne me sens pas concern\u00e9" },
      { value: "ponctuel",  label: "J\u2019ai d\u00e9j\u00e0 vu quelques tensions" },
      { value: "present",   label: "L\u2019eau est d\u00e9j\u00e0 un sujet concret ici" },
    ],
  },
  {
    key: "shelter" as const,
    label: "Votre quartier reste-t-il agr\u00e9able pendant les fortes chaleurs\u00a0?",
    sub: "Ombre, espaces verts, fra\u00eecheur",
    options: [
      { value: "resilient",  label: "Oui, plut\u00f4t" },
      { value: "tendu",      label: "Cela devient plus difficile" },
      { value: "fragilise",  label: "Non, cela se ressent d\u00e9j\u00e0 fortement" },
    ],
  },
  {
    key: "change" as const,
    label: "Avez-vous observ\u00e9 des changements dans votre quartier ces derni\u00e8res ann\u00e9es\u00a0?",
    sub: "V\u00e9g\u00e9tation, usages, saisons, eau, chaleur",
    options: [
      { value: "faible",  label: "Pas vraiment" },
      { value: "visible", label: "Quelques \u00e9volutions visibles" },
      { value: "fort",    label: "Beaucoup de changements" },
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
export function QuartierWorkbook({ userKey, commune, inseeCode, reportId }: QuartierWorkbookProps) {
  const storageKey = `${PREFIX}${userKey}`;
  const posthog = usePostHog();
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<QuartierAnswers>(EMPTY);
  const [ready, setReady] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [focusedTextarea, setFocusedTextarea] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Anti-doublon des événements PostHog dans une même session de page.
  const completedFiredRef = useRef(false);
  const freeTextFiredLenRef = useRef(0);

  // Propriétés communes à tous les événements workbook. Le contenu du texte
  // libre n'y figure JAMAIS, uniquement sa longueur / sa présence.
  const baseEventProps = useMemo(
    () => ({
      module: "quartier",
      commune: commune ?? null,
      insee_code: inseeCode ?? null,
      report_id: reportId ?? null,
    }),
    [commune, inseeCode, reportId],
  );

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
            change: p.change ?? "",
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

  // ── sync to server with 1 s debounce
  // Double écriture : /api/terrain-observations persiste à la fois
  // user_profiles.workbook_quartier (compat) ET terrain_observations (base
  // propre). Si la commune n'est pas connue, on retombe sur l'ancien PATCH
  // /api/profile pour préserver la compatibilité.
  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      if (inseeCode && commune) {
        fetch("/api/terrain-observations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            answers,
            inseeCode,
            commune,
            reportId: reportId ?? null,
            module: "quartier",
          }),
        }).catch(() => {});
      } else {
        fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "workbook_quartier", value: answers }),
        }).catch(() => {});
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [answers, ready, inseeCode, commune, reportId]);

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

  const answeredChoices = useMemo(
    () => [answers.heat, answers.water, answers.shelter, answers.change].filter(Boolean).length,
    [answers],
  );

  const completion = useMemo(() => {
    return [answers.heat, answers.water, answers.shelter, answers.change, answers.note.trim()].filter(Boolean).length;
  }, [answers]);

  const completionPct = completion / 5;

  // ── workbook_completed : une fois les 4 questions à choix renseignées.
  // Tiré au plus une fois par session de page (réinitialisé si l'utilisateur
  // retire une réponse, pour pouvoir re-déclencher après re-complétion).
  useEffect(() => {
    if (!ready) return;
    if (answeredChoices >= QUESTIONS.length) {
      if (!completedFiredRef.current) {
        completedFiredRef.current = true;
        posthog?.capture("workbook_completed", {
          ...baseEventProps,
          answered_count: answeredChoices,
          has_free_text: answers.note.trim().length > 0,
        });
      }
    } else {
      completedFiredRef.current = false;
    }
  }, [ready, answeredChoices, answers.note, posthog, baseEventProps]);

  function pick(field: ChoiceKey, value: string) {
    const next = answers[field] === value ? "" : value;
    // workbook_answered : uniquement lors d'une sélection (pas d'une dé-sélection).
    if (next) {
      posthog?.capture("workbook_answered", {
        ...baseEventProps,
        question_id: field,
        answer_value: next,
      });
    }
    setAnswers((c) => ({ ...c, [field]: next }));
  }

  return (
    <div style={S.wrap}>

      {/* en-tête + toggle */}
      <button
        type="button"
        onClick={() => {
          if (!open) posthog?.capture("workbook_opened", baseEventProps);
          setOpen((v) => !v);
        }}
        style={{ all: "unset", cursor: "pointer", display: "block", width: "100%" }}
      >
        <div style={S.head}>
          <div>
            <p style={S.kicker}>{open ? "Observation du territoire · Ouvert" : "Observation du territoire"}</p>
            <h3 style={S.title}>Vos repères de terrain</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={S.progressPill(completionPct)}>
              {completion}/5{completionPct === 1 ? " ✓" : ""}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.dim, letterSpacing: "0.04em" }}>
              {open ? "▲" : "▼"}
            </span>
          </div>
        </div>
        {open && (
          <div style={{ marginTop: 14 }}>
            <div style={S.progressBar}>
              <div style={S.progressFill(completionPct)} />
            </div>
          </div>
        )}
      </button>

      {!open && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65, margin: 0 }}>
            Vos observations de terrain complètent les données publiques et affinent la lecture de votre commune.
          </p>
          <p
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10,
              letterSpacing: "0.08em",
              color: C.dim,
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            Stocké localement dans votre navigateur
          </p>
        </div>
      )}

      {/* 3 questions à choix */}
      {open && (<>
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
          placeholder="Les nuits sont devenues plus lourdes, certains arbres souffrent davantage, l'eau manque plus souvent, les rues se vident plus tôt l'été..."
          rows={5}
          value={answers.note}
          onChange={(e) => setAnswers((c) => ({ ...c, note: e.target.value }))}
          onFocus={() => setFocusedTextarea(true)}
          onBlur={() => {
            setFocusedTextarea(false);
            // workbook_free_text_written : on n'envoie QUE la longueur, jamais
            // le contenu. Tiré quand le texte change réellement entre deux blur.
            const len = answers.note.trim().length;
            if (len > 0 && len !== freeTextFiredLenRef.current) {
              freeTextFiredLenRef.current = len;
              posthog?.capture("workbook_free_text_written", {
                ...baseEventProps,
                text_length: len,
              });
            }
          }}
        />
      </div>

      {/* statut sauvegarde */}
      <div style={S.savedRow}>
        <span style={S.savedDot(justSaved)} />
        {justSaved ? "Sauvegardé dans ce navigateur" : "Sauvegarde automatique"}
      </div>

      {/* note éditoriale */}
      <div style={S.helperBox}>
        Les données racontent une partie de l&apos;histoire. Ce que vous observez raconte le reste.
      </div>
      </>)}
    </div>
  );
}
