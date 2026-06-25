'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * HeroProjetTerritoires
 *
 * Animation propriétaire de la home : « Le projet de vie devient territoire ».
 * Récit à deux actes :
 *   Acte 1 — on écrit un projet (machine à écrire) -> décomposition en critères ->
 *            mise en relation -> 3 territoires, chacun avec ses COMPROMIS (2/3 des
 *            envies, mais pas les mêmes d'une ville à l'autre).
 *   Bascule — le projet est édité : on ajoute « , sans subir la canicule ».
 *   Acte 2 — re-décomposition (4 critères) -> les résultats CHANGENT (La Rochelle,
 *            plus chaude, sort ; Saint-Brieuc, plus fraîche, entre) -> compromis -> boucle.
 *
 * - Aucune dépendance. Machine à états (phase 0->9) + compteur de frappe.
 * - Ne tourne que visible (IntersectionObserver) ; prefers-reduced-motion -> état
 *   final statique (fin d'acte 2, le plus complet).
 * - Conteneur en aspect-ratio 4/3 : un <svg viewBox 0 0 400 300> preserveAspectRatio
 *   "none" partage le repère des éléments HTML positionnés en %.
 */

// Durée de chaque phase (ms). 0..4 = acte 1, 5..9 = acte 2.
const PHASE_MS = [3000, 1800, 1400, 1800, 3000, 2400, 1800, 1400, 2800, 3600];
const TYPE1 = 0, DECOMP1 = 1, RELATE1 = 2, CITIES1 = 3, COMPRO1 = 4;
const TYPE2 = 5, DECOMP2 = 6, RELATE2 = 7, CITIES2 = 8, COMPRO2 = 9;
const FINAL = COMPRO2;

// Repère SVG 400x300 (== 4/3). Conversion depuis un % : x% -> x/100*400.
const SX = (pct: number) => (pct / 100) * 400;
const SY = (pct: number) => (pct / 100) * 300;

const CENTER = { x: 50, y: 48 };
const CITY_X = [17, 50, 83];

// Phrase en segments (texte + mots-clés accentués). La frappe révèle char par char.
type Seg = { t: string; kw?: boolean };
const PHRASE1: Seg[] = [
  { t: '« Près de la ' }, { t: 'mer', kw: true }, { t: ', au ' }, { t: 'calme', kw: true },
  { t: ', sans dépendre de la ' }, { t: 'voiture', kw: true }, { t: '. »' },
];
const PHRASE2: Seg[] = [
  { t: '« Près de la ' }, { t: 'mer', kw: true }, { t: ', au ' }, { t: 'calme', kw: true },
  { t: ', sans dépendre de la ' }, { t: 'voiture', kw: true },
  { t: ', sans subir la ' }, { t: 'canicule', kw: true }, { t: '. »' },
];
const plainLen = (segs: Seg[]) => segs.reduce((n, s) => n + s.t.length, 0);
const LEN1 = plainLen(PHRASE1);
const LEN2 = plainLen(PHRASE2);
const START2 = LEN1 - 3; // longueur de PHRASE1 sans le ". »" final (3 chars) -> point de reprise

// Critères + territoires par acte. met[] aligné sur l'ordre des critères.
const CRIT1 = ['Mer', 'Calme', 'Mobilité'];
const CITIES_A1 = [
  { name: 'Vannes', met: [1, 1, 0] },
  { name: 'Saint-Nazaire', met: [1, 0, 1] },
  { name: 'La Rochelle', met: [1, 0, 1] },
];
const CRIT2 = ['Mer', 'Calme', 'Mobilité', 'Fraîcheur'];
const CITIES_A2 = [
  { name: 'Vannes', met: [1, 1, 0, 1] },
  { name: 'Saint-Nazaire', met: [1, 0, 1, 1] },
  { name: 'Saint-Brieuc', met: [1, 1, 0, 1] },
];

export default function HeroProjetTerritoires({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<number>(0);
  const [typed, setTyped] = useState<number>(0);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);

  // prefers-reduced-motion -> état final statique (fin acte 2).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => {
      setReduced(mq.matches);
      if (mq.matches) { setPhase(FINAL); setTyped(LEN2); }
    };
    apply();
    mq.addEventListener?.('change', apply);
    return () => mq.removeEventListener?.('change', apply);
  }, []);

  // Visible ?
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Machine à états (visible + mouvement autorisé).
  useEffect(() => {
    if (reduced || !inView) return;
    let timer: ReturnType<typeof setTimeout>;
    const run = (p: number) => {
      setPhase(p);
      timer = setTimeout(() => run((p + 1) % PHASE_MS.length), PHASE_MS[p]);
    };
    run(0);
    return () => clearTimeout(timer);
  }, [reduced, inView]);

  // Booléens dérivés.
  const act = phase >= TYPE2 ? 2 : 1;
  const phrase = act === 2 ? PHRASE2 : PHRASE1;
  const isTyping = phase === TYPE1 || phase === TYPE2;
  // Hors saisie, la phrase est entière : on le dérive au rendu (pas de setState inutile).
  const displayTyped = isTyping ? typed : (act === 2 ? LEN2 : LEN1);

  // Compteur de frappe : n'anime que pendant les phases de saisie.
  useEffect(() => {
    if (reduced || !isTyping) return;
    const from = phase === TYPE1 ? 0 : START2;
    const to = phase === TYPE1 ? LEN1 : LEN2;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- amorce de l'animation de frappe
    setTyped(from);
    let cur = from;
    const stepMs = Math.max(28, PHASE_MS[phase] / (to - from));
    const iv = setInterval(() => {
      cur += 1;
      setTyped(cur);
      if (cur >= to) clearInterval(iv);
    }, stepMs);
    return () => clearInterval(iv);
  }, [phase, isTyping, reduced]);
  const kwOn = phase === TYPE1 || phase === DECOMP1 || phase === TYPE2 || phase === DECOMP2;

  const showDecomp1 = phase === DECOMP1 || phase === RELATE1;
  const showDecomp2 = phase === DECOMP2 || phase === RELATE2;
  const showConstellation = showDecomp1 || showDecomp2;
  const showPulse = phase === RELATE1 || phase === CITIES1 || phase === RELATE2 || phase === CITIES2;
  // Le trio acte 1 reste affiché pendant l'édition (phases 3->5), se retire pendant le
  // recalcul (6,7), puis CÈDE la place en phase 8 : La Rochelle s'estompe lentement
  // tandis que Saint-Brieuc émerge à sa position (entrée décalée = on lit la substitution).
  const citiesA1Op = phase >= CITIES1 && phase <= TYPE2 ? 1 : (phase === DECOMP2 || phase === RELATE2 ? 0.4 : 0);
  const citiesA2Op = phase >= CITIES2 ? 1 : 0;
  const showDots1 = phase === COMPRO1;
  const showDots2 = phase === COMPRO2;
  const showConnectors = phase >= CITIES1 && phase <= COMPRO2;
  const showLegend = phase === COMPRO1 || phase === COMPRO2;
  const phraseDim = phase === CITIES1 || phase === COMPRO1 || phase === CITIES2 || phase === COMPRO2;

  return (
    <div
      ref={rootRef}
      className={['hpt-root', className].filter(Boolean).join(' ')}
      role="img"
      aria-label="futur•e traduit un projet de vie en territoires et montre les compromis : Vannes, Saint-Nazaire, La Rochelle ; en ajoutant « sans subir la canicule », les résultats changent (Saint-Brieuc remplace La Rochelle)."
      style={{
        position: 'relative',
        width: '100%',
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid var(--border-1)',
        background:
          'radial-gradient(120% 90% at 50% 16%, color-mix(in srgb, var(--orange) 7%, var(--bg)) 0%, var(--bg) 55%)',
        containerType: 'inline-size',
        // @ts-expect-error custom prop consommée par les styles inline
        '--e': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      }}
    >
      {/* Filets : constellation + connecteurs vers les villes */}
      <svg
        aria-hidden="true"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <g style={{ opacity: showConstellation ? 0.5 : 0, transition: 'opacity 0.9s var(--e)' }}>
          {(act === 2 ? decompX(4) : decompX(3)).map((cx, i, arr) => (
            <g key={i}>
              {i < arr.length - 1 && (
                <line x1={SX(cx)} y1={SY(38)} x2={SX(arr[i + 1])} y2={SY(38)} stroke="var(--orange)" strokeWidth="1" strokeOpacity="0.45" />
              )}
              <line x1={SX(cx)} y1={SY(38)} x2={SX(CENTER.x)} y2={SY(CENTER.y)} stroke="var(--orange)" strokeWidth="1" strokeOpacity="0.26" />
            </g>
          ))}
        </g>

        <g style={{ opacity: showConnectors ? 0.32 : 0, transition: 'opacity 1s var(--e)' }}>
          {CITY_X.map((cx, i) => (
            <line key={i} x1={SX(CENTER.x)} y1={SY(CENTER.y)} x2={SX(cx)} y2={SY(58)} stroke="var(--orange)" strokeWidth="1" strokeOpacity="0.5" />
          ))}
        </g>

        <circle
          cx={SX(CENTER.x)} cy={SY(CENTER.y)} r="3" fill="var(--orange)"
          style={{
            opacity: showPulse ? 1 : 0,
            transition: 'opacity 0.7s var(--e)',
            transformOrigin: `${SX(CENTER.x)}px ${SY(CENTER.y)}px`,
            animation: showPulse ? 'hpt-pulse 1.8s ease-in-out infinite' : 'none',
          }}
        />
      </svg>

      {/* Phrase projet de vie (machine à écrire) */}
      <div
        style={{
          position: 'absolute', top: '6%', left: '6%', width: '88%', textAlign: 'center',
          fontFamily: "'Instrument Serif', serif", fontStyle: 'italic',
          fontSize: 'clamp(14px, 4.2cqw, 20px)', lineHeight: 1.32, color: 'var(--fg-1)',
          opacity: phraseDim ? 0.5 : 1, transition: 'opacity 1s var(--e)',
        }}
      >
        <PhraseTyped segs={phrase} typed={displayTyped} kwOn={kwOn} caret={isTyping} />
      </div>

      {/* Jetons de décomposition (centre) */}
      {CRIT1.map((label, i) => (
        <Token key={`a1-${label}`} label={label} x={decompX(3)[i]} y={38}
          visible={showDecomp1} pull={phase === RELATE1} />
      ))}
      {CRIT2.map((label, i) => (
        <Token key={`a2-${label}`} label={label} x={decompX(4)[i]} y={38}
          visible={showDecomp2} pull={phase === RELATE2} />
      ))}

      {/* Territoires acte 1 (cèdent la place) */}
      <CityRow cities={CITIES_A1} crit={CRIT1} opacity={citiesA1Op} showDots={showDots1} dur={1.0} stagger={0.08} />
      {/* Territoires acte 2 (émergent ; Saint-Brieuc, 3e, entre en dernier) */}
      <CityRow cities={CITIES_A2} crit={CRIT2} opacity={citiesA2Op} showDots={showDots2} dur={1.2} stagger={0.22} />

      {/* Légende compromis */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', bottom: '4%', left: 0, width: '100%', textAlign: 'center',
          fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(7px, 1.9cqw, 9px)',
          letterSpacing: '0.04em', color: 'var(--fg-4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          opacity: showLegend ? 1 : 0, transition: 'opacity 0.7s var(--e)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Dot filled /> répondu</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Dot /> en retrait</span>
      </div>

      <style>{`
        .hpt-root { aspect-ratio: 4 / 3; }
        @media (max-width: 600px) { .hpt-root { aspect-ratio: 1 / 1; } }
        @keyframes hpt-pulse { 0%,100% { r: 3; opacity: .85; } 50% { r: 6; opacity: .35; } }
        @keyframes hpt-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
      `}</style>
    </div>
  );
}

/* Positions en % des jetons de décomposition selon leur nombre. */
function decompX(n: number): number[] {
  return n === 4 ? [16, 39, 61, 84] : [24, 50, 76];
}

/* Phrase révélée char par char, mots-clés accentués, caret clignotant optionnel. */
function PhraseTyped({ segs, typed, kwOn, caret }: { segs: Seg[]; typed: number; kwOn: boolean; caret: boolean }) {
  const out: React.ReactNode[] = [];
  let remaining = typed;
  for (let i = 0; i < segs.length; i++) {
    if (remaining <= 0) break;
    const s = segs[i];
    const slice = s.t.slice(0, remaining);
    remaining -= s.t.length;
    out.push(
      s.kw ? (
        <span
          key={i}
          style={{
            color: kwOn ? 'var(--orange)' : 'inherit',
            borderBottom: kwOn ? '1px solid var(--orange-ring)' : '1px solid transparent',
            transition: 'color 0.8s var(--e), border-color 0.8s var(--e)',
          }}
        >
          {slice}
        </span>
      ) : (
        <span key={i}>{slice}</span>
      ),
    );
  }
  return (
    <>
      {out}
      {caret && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block', width: '1px', marginLeft: 1,
            alignSelf: 'stretch', borderRight: '2px solid var(--orange)',
            animation: 'hpt-blink 1s steps(1) infinite',
          }}
        >
          &#8203;
        </span>
      )}
    </>
  );
}

/* Une rangée de 3 territoires + leurs critères (points pleins/creux).
   opacity pilote l'apparition/disparition ; dur + stagger choréographient le crossfade. */
function CityRow({
  cities, crit, opacity, showDots, dur, stagger,
}: {
  cities: { name: string; met: number[] }[];
  crit: string[];
  opacity: number;
  showDots: boolean;
  dur: number;
  stagger: number;
}) {
  const shown = opacity > 0.05;
  return (
    <>
      {cities.map((city, i) => (
        <div
          key={city.name}
          style={{
            position: 'absolute', top: '53%', left: `${CITY_X[i] - 15.5}%`, width: '31%',
            textAlign: 'center',
            opacity,
            transform: shown ? 'translateY(0)' : 'translateY(10px)',
            transition: `opacity ${dur}s var(--e) ${i * stagger}s, transform ${dur}s var(--e) ${i * stagger}s`,
          }}
        >
          <div
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 'clamp(13px, 3.7cqw, 18px)', lineHeight: 1.1, color: 'var(--fg-1)',
              marginBottom: '8%',
            }}
          >
            {city.name}
          </div>
          <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
            {crit.map((label, j) => {
              const met = city.met[j] === 1;
              return (
                <span
                  key={label}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 'clamp(8px, 2.2cqw, 11px)', letterSpacing: '0.02em',
                    color: met ? 'var(--fg-1)' : 'var(--fg-4)',
                    whiteSpace: 'nowrap',
                    opacity: showDots ? 1 : 0,
                    transform: showDots ? 'translateX(0)' : 'translateX(-4px)',
                    transition: `opacity 0.5s var(--e) ${i * 0.08 + j * 0.1}s, transform 0.5s var(--e) ${i * 0.08 + j * 0.1}s`,
                  }}
                >
                  <Dot filled={met} />
                  {label}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </>
  );
}

/* Jeton de décomposition (Mer / Calme / Mobilité / Fraîcheur). */
function Token({
  label, x, y, visible, pull,
}: { label: string; x: number; y: number; visible: boolean; pull: boolean }) {
  const dx = pull ? (50 - x) * 0.22 : 0;
  const dy = pull ? (48 - y) * 0.22 : 0;
  return (
    <span
      style={{
        position: 'absolute', top: `${y}%`, left: `${x}%`,
        transform: `translate(-50%, -50%) translate(${dx}%, ${dy}%) scale(${visible ? 1 : 0.9})`,
        display: 'inline-flex', alignItems: 'center', gap: 5,
        padding: '3px 9px', borderRadius: 999,
        border: '1px solid var(--orange-ring)',
        background: 'color-mix(in srgb, var(--orange) 10%, var(--bg))',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 'clamp(9px, 2.5cqw, 12px)', letterSpacing: '0.02em', color: 'var(--fg-1)',
        whiteSpace: 'nowrap',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s var(--e), transform 1s var(--e)',
        pointerEvents: 'none',
      }}
    >
      <Dot filled />
      {label}
    </span>
  );
}

/* Marqueur futur•e : point plein (répondu) ou anneau creux (en retrait). Pas d'emoji. */
function Dot({ filled }: { filled?: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 6, height: 6, borderRadius: '50%', flexShrink: 0, boxSizing: 'border-box',
        ...(filled
          ? { background: 'var(--orange)', boxShadow: '0 0 0 2px color-mix(in srgb, var(--orange) 22%, transparent)' }
          : { background: 'transparent', border: '1.5px solid var(--fg-4)' }),
      }}
    />
  );
}
