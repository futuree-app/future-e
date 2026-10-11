// FUT-87 · PRIMITIVES DU PROTOTYPE « LE RELEVÉ ». DEV UNIQUEMENT.
//
// Neuf rôles, et pas un composant par carte. Chacun dit un USAGE de l'information :
//   Surtitre       désigne un mouvement de la page (numéro citable + nom en casse normale)
//   Ligne          un énoncé et sa preuve, alignés : le texte à gauche, la marge à droite
//   Marge          la preuve d'une affirmation : grain, valeur observée, source, date
//   Grain          le grain d'un fait, dit par une FORME (cercle, carré, losange), jamais une teinte
//   Chiffre        une valeur mesurée mise en avant, avec son unité
//   Registre       le sujet d'un fait, précédé du trait de son registre de décision
//   Plaque         la seule surface élevée d'un mouvement (le verdict, le passeport)
//   RegleDuTemps   un axe 1980-2100 où se posent les dates et les horizons réels
//   CoupeEchelles  la navigation entre Territoire, Autour et Logement
//
// Aucune logique métier ici : ces primitives reçoivent des textes déjà produits par le moteur ou
// par les fixtures, et ne les reformulent pas.
import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import s from "./releve.module.css";

export { s as releve };

// ── Grain ────────────────────────────────────────────────────────────────────────────────────

/** Les grains du moteur (`EvidenceRef.grain`) et celui du bâtiment, propre au module Logement. */
export type GrainCle = "commune" | "unite_urbaine" | "secteur" | "adresse" | "batiment";

const GRAIN_LIBELLE: Record<GrainCle, string> = {
  commune: "commune",
  unite_urbaine: "agglomération",
  secteur: "secteur",
  adresse: "adresse",
  batiment: "bâtiment",
};

/**
 * LE GRAIN EST UNE FORME. Le cercle, le carré et le losange sont ceux de l'emblème des trois
 * échelles (`echelle-geometry.ts`) : le lecteur qui a vu le repère du hub reconnaît, à côté de
 * chaque fait, à quelle échelle il a été établi. DESIGN.md § 7 interdit de dire l'échelle par la
 * couleur ; la forme le dit sans entrer en concurrence avec les registres.
 */
export function GlypheGrain({ grain, taille = 12 }: { grain: GrainCle; taille?: number }) {
  const t = taille;
  const c = t / 2;
  const trait = 1.4;
  return (
    <svg width={t} height={t} viewBox={`0 0 ${t} ${t}`} aria-hidden focusable="false">
      {grain === "commune" ? (
        <circle cx={c} cy={c} r={c - trait} fill="none" stroke="currentColor" strokeWidth={trait} />
      ) : grain === "unite_urbaine" ? (
        <>
          <circle cx={c} cy={c} r={c - trait} fill="none" stroke="currentColor" strokeWidth={trait} />
          <circle cx={c} cy={c} r={c / 2.6} fill="currentColor" />
        </>
      ) : grain === "secteur" ? (
        <rect x={trait} y={trait} width={t - 2 * trait} height={t - 2 * trait} rx={t / 6} fill="none" stroke="currentColor" strokeWidth={trait} />
      ) : (
        <rect
          x={c - (t * 0.34)} y={c - (t * 0.34)} width={t * 0.68} height={t * 0.68} rx={t / 12}
          transform={`rotate(45 ${c} ${c})`}
          fill={grain === "batiment" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={trait}
        />
      )}
    </svg>
  );
}

export function Grain({ grain, children }: { grain: GrainCle; children?: ReactNode }) {
  return (
    <span className={s.grain}>
      <GlypheGrain grain={grain} />
      {children ?? GRAIN_LIBELLE[grain]}
    </span>
  );
}

// ── Surtitre ─────────────────────────────────────────────────────────────────────────────────

export function Surtitre({ numero, children, id }: { numero?: string; children: ReactNode; id?: string }) {
  return (
    <p className={s.surtitre} id={id}>
      {numero ? <span className={s.numero}>{numero}</span> : null}
      <span>{children}</span>
    </p>
  );
}

// ── Ligne et marge ───────────────────────────────────────────────────────────────────────────

export type ElementDeMarge =
  | { type: "grain"; grain: GrainCle; libelle?: string }
  | { type: "valeur"; libelle?: string; valeur: string; href?: string }
  | { type: "source"; texte: string }
  | { type: "date"; texte: string };

export function Marge({ elements, etiquette = "Preuve" }: { elements: ElementDeMarge[]; etiquette?: string }) {
  if (elements.length === 0) return <div aria-hidden />;
  return (
    <aside className={s.marge} aria-label={etiquette}>
      {elements.map((e, i) => {
        if (e.type === "grain") return <Grain key={i} grain={e.grain}>{e.libelle}</Grain>;
        if (e.type === "valeur") {
          const v = <span className={s.margeValeur}>{e.valeur}</span>;
          return (
            <span key={i}>
              {e.libelle ? <>{e.libelle} · </> : null}
              {e.href ? <Link href={e.href}>{v}</Link> : v}
            </span>
          );
        }
        return <span key={i}>{e.texte}</span>;
      })}
    </aside>
  );
}

export function Ligne({ children, marge, id }: { children: ReactNode; marge?: ReactNode; id?: string }) {
  return (
    <div className={s.ligne} id={id}>
      <div className={s.pile}>{children}</div>
      {marge ?? <div aria-hidden />}
    </div>
  );
}

// ── Registre ─────────────────────────────────────────────────────────────────────────────────

/** La teinte d'un registre : celle de la charte, en jeton. Une teinte inconnue tombe sur le non su. */
export const TEINTE_REGISTRE: Record<string, string> = {
  incompatibilities: "var(--reg-incompatibilite)",
  alignments: "var(--reg-alignement)",
  mismatches: "var(--reg-ecart)",
  compromises: "var(--reg-compromis)",
  unknowns: "var(--reg-non-su)",
  verifications: "var(--reg-controle)",
  condition_check: "var(--reg-controle)",
  condition_met: "var(--reg-alignement)",
};

export function Registre({ teinte, children, as: T = "p", className }: { teinte?: string; children: ReactNode; as?: "p" | "h2" | "h3" | "h4"; className?: string }) {
  return (
    <T className={`${s.registre} ${className ?? s.sousTitre}`} style={{ "--r-teinte": teinte } as CSSProperties}>
      <span>{children}</span>
    </T>
  );
}

// ── Chiffre ──────────────────────────────────────────────────────────────────────────────────

export function Chiffre({ valeur, unite }: { valeur: string; unite?: string }) {
  return (
    <span className={s.chiffre}>
      {valeur}
      {unite ? <span className={s.unite}>{unite}</span> : null}
    </span>
  );
}

// ── Plaque ───────────────────────────────────────────────────────────────────────────────────

export function Plaque({ children, etiquette, className }: { children: ReactNode; etiquette?: string; className?: string }) {
  return (
    <section className={`${s.plaque} ${className ?? ""}`} aria-label={etiquette}>
      {children}
    </section>
  );
}

// ── Règle du temps ───────────────────────────────────────────────────────────────────────────

export type JalonTemps = {
  annee: number;
  /** Ce qui s'est passé ou est projeté à cette date, en mots du moteur ou de la source. */
  libelle: string;
  /** Une valeur à poser au-dessus du jalon (« 90 nuits »), jamais inventée. */
  valeur?: string;
  /** Une période plutôt qu'un point (la référence climatique 1976-2005). */
  jusqua?: number;
};

const FIN = 2105;

/**
 * LA RÈGLE DU TEMPS. Un même axe pour tout ce qui a une date : la référence climatique, la
 * construction d'un bâtiment, un diagnostic, les horizons 2030 / 2050 / 2100. L'échelle est
 * linéaire, donc honnête : 2100 est loin, et la règle le montre. « Aujourd'hui » est marqué d'un
 * pointillé. Aucune animation (DESIGN.md § 6.4).
 */
export function RegleDuTemps({
  jalons, aujourdhui = 2026, hauteurValeurs, etiquette,
}: {
  jalons: JalonTemps[];
  aujourdhui?: number;
  /** Si fourni, trace la trajectoire des valeurs numériques (même unité), de bas en haut. */
  hauteurValeurs?: { min: number; max: number; valeurs: Record<number, number> };
  etiquette: string;
}) {
  // Hauteurs en pixels réels : le SVG est étiré en largeur seulement (`preserveAspectRatio="none"`),
  // et tous les traits gardent 1 px grâce à `vector-effect`. Les textes sont du HTML posé par-dessus.
  // LE DÉBUT SUIT LA DONNÉE : un bâtiment de 1890 ne sort pas du cadre. Jamais après 1975, pour que
  // la référence climatique (1976-2005) et le présent gardent leur place.
  const DEBUT = Math.min(1975, Math.floor((Math.min(...jalons.map((j) => j.annee)) - 6) / 10) * 10);
  const L = 1000;
  const H = hauteurValeurs ? 168 : 64;
  const yAxe = H - 2;
  const pct = (a: number) => ((a - DEBUT) / (FIN - DEBUT)) * 100;
  const x = (a: number) => (pct(a) / 100) * L;
  const y = (v: number) => {
    if (!hauteurValeurs) return yAxe;
    const { min, max } = hauteurValeurs;
    return yAxe - 14 - ((v - min) / Math.max(1, max - min)) * (yAxe - 64);
  };
  const centre = (j: JalonTemps) => (j.jusqua ? (j.annee + j.jusqua) / 2 : j.annee);
  const valeurDe = (j: JalonTemps) => hauteurValeurs?.valeurs[j.annee];
  const points = jalons
    .filter((j) => valeurDe(j) != null)
    .map((j) => `${x(centre(j))},${y(valeurDe(j)!)}`);
  const pose = (p: number): CSSProperties => (p > 80
    ? { right: `${100 - p}%`, transform: "translateX(6px)", textAlign: "right" }
    : { left: `${p}%`, transform: "translateX(-6px)", textAlign: "left" });
  return (
    <figure style={{ margin: 0 }} aria-label={etiquette}>
      <div style={{ position: "relative", height: H }}>
        <svg className={s.regle} viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: H }} aria-hidden focusable="false">
          <line className={s.regleAxe} x1={0} x2={L} y1={yAxe} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: Math.floor((2100 - DEBUT) / 20) + 1 }, (_, i) => 2100 - i * 20).filter((a) => a > DEBUT).map((a) => (
            <line key={a} className={s.regleTic} x1={x(a)} x2={x(a)} y1={yAxe - 5} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <line className={s.regleAujourdhui} x1={x(aujourdhui)} x2={x(aujourdhui)} y1={4} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {points.length > 1 ? (
            <polyline className={s.regleTrace} points={points.join(" ")} strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
          ) : null}
          {jalons.map((j) => {
            const v = valeurDe(j);
            const cy = v != null ? y(v) : yAxe;
            return j.jusqua ? (
              <rect key={j.annee} className={s.regleBande} x={x(j.annee)} width={x(j.jusqua) - x(j.annee)} y={cy - 3} height={6} vectorEffect="non-scaling-stroke" />
            ) : (
              <line key={j.annee} className={s.regleTic} x1={x(j.annee)} x2={x(j.annee)} y1={v != null ? cy : yAxe - 18} y2={yAxe} strokeWidth={1} strokeDasharray={v != null ? "2 3" : undefined} vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>
        {jalons.map((j) => (j.valeur ? (
          <span key={j.annee} className={s.chiffre} style={{
            position: "absolute", fontSize: 19, whiteSpace: "nowrap",
            top: Math.max(0, (valeurDe(j) != null ? y(valeurDe(j)!) : yAxe - 18) - 30),
            ...pose(pct(centre(j))),
          }}>
            {j.valeur}
          </span>
        ) : null))}
        <span className={s.mono} style={{ position: "absolute", top: 0, fontSize: 10.5, color: "var(--r-meta)", whiteSpace: "nowrap", ...pose(pct(aujourdhui)), transform: "translateX(6px)" }}>
          aujourd&apos;hui
        </span>
      </div>
      <figcaption style={{ position: "relative", height: 40, marginTop: 8 }}>
        {jalons.map((j) => (
          <span key={j.annee} className={s.mono} style={{
            position: "absolute", top: 0, fontSize: 11, color: "var(--r-meta)", whiteSpace: "nowrap", lineHeight: 1.4,
            ...pose(pct(centre(j))),
          }}>
            {j.jusqua ? `${j.annee}–${j.jusqua}` : j.annee}
            <br />
            <span style={{ color: "var(--r-discret)" }}>{j.libelle}</span>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

// ── Coupe des trois échelles ─────────────────────────────────────────────────────────────────

export type CleEchelle = "territoire" | "autour" | "logement";

const ECHELLES: { cle: CleEchelle; nom: string; grain: GrainCle; grainNom: string; contenu: string }[] = [
  { cle: "territoire", nom: "Territoire", grain: "commune", grainNom: "la commune", contenu: "Climat projeté, risques recensés, services, population." },
  { cle: "autour", nom: "Autour de l'adresse", grain: "secteur", grainNom: "le secteur", contenu: "Ce qui est à portée de pas, la chaleur du quartier, les projets autorisés." },
  { cle: "logement", nom: "Logement", grain: "batiment", grainNom: "le bâtiment", contenu: "Le diagnostic, l'audit, les risques du bâti, ce qui reste à demander." },
];

/**
 * LA COUPE. Les trois échelles côte à côte, du large au précis, chacune avec son glyphe. L'échelle
 * courante se lit au contraste et au filet supérieur, jamais à une teinte (DESIGN.md § 7.1).
 */
export function CoupeEchelles({ courante, liens }: { courante?: CleEchelle; liens: Partial<Record<CleEchelle, string>> }) {
  return (
    <nav aria-label="Les trois échelles du dossier" className={s.coupe}>
      {ECHELLES.map((e) => {
        const contenu = (
          <>
            <span style={{ paddingTop: 3, color: courante === e.cle ? "var(--r-encre)" : "var(--r-discret)" }}>
              <GlypheGrain grain={e.grain} taille={16} />
            </span>
            <span className={s.pileSerree}>
              <span className={s.sousTitre} style={{ fontSize: 15.5 }}>
                {e.nom} <span className={s.etiquette} style={{ fontWeight: 500 }}>· {e.grainNom}</span>
              </span>
              <span className={s.nuance}>{e.contenu}</span>
            </span>
          </>
        );
        const href = liens[e.cle];
        return href ? (
          <Link key={e.cle} href={href} className={s.coupeCase} aria-current={courante === e.cle ? "page" : undefined}>
            {contenu}
          </Link>
        ) : (
          <div key={e.cle} className={s.coupeCase} aria-current={courante === e.cle ? "page" : undefined}>{contenu}</div>
        );
      })}
    </nav>
  );
}

// ── Bandeau de prototype ─────────────────────────────────────────────────────────────────────

export function BandeauPrototype({ children }: { children: ReactNode }) {
  return (
    <div className={s.bandeauProto}>
      <div className={s.feuille}>{children}</div>
    </div>
  );
}

// ── Les fondements dessinés ──────────────────────────────────────────────────────────────────

/**
 * LA RÈGLE DE RANG. Une position parmi les communes de France se dit déjà en mots (« parmi les 20 %
 * … »). Le trait la montre en LONGUEUR (DESIGN.md § 3.6) : la ligne va du moins au plus favorable,
 * la bande est le groupe d'ex æquo où se trouve la commune. Aucune teinte de jugement : l'encre seule.
 */
export function RegleDeRang({ bas, haut, sujet }: { bas: number; haut: number; sujet: string }) {
  const g = Math.max(0, Math.min(1, bas)) * 100;
  const d = Math.max(0, Math.min(1, haut)) * 100;
  return (
    <figure style={{ margin: "4px 0 0", maxWidth: 420 }} aria-label={`Position de la commune parmi les communes de France pour ${sujet}`}>
      <div style={{ position: "relative", height: 16 }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: 7, height: 1, background: "var(--r-filet-fort)" }} />
        {[0, 25, 50, 75, 100].map((t) => (
          <div key={t} style={{ position: "absolute", left: `${t}%`, top: 4, width: 1, height: 7, background: "var(--r-discret)", transform: t === 100 ? "translateX(-1px)" : undefined }} />
        ))}
        <div style={{ position: "absolute", left: `${g}%`, width: `${Math.max(1.5, d - g)}%`, top: 3, height: 9, background: "var(--r-encre)" }} />
      </div>
      <figcaption className={s.mono} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--r-meta)", marginTop: 4 }}>
        <span>moins favorable</span>
        <span>communes de France</span>
        <span>plus favorable</span>
      </figcaption>
    </figure>
  );
}

const MESURE: Record<string, { nom: string; unite: string }> = {
  days_over_35: { nom: "Jours au-dessus de 35 °C", unite: "j/an" },
  tropical_nights: { nom: "Nuits tropicales", unite: "nuits/an" },
  fire_weather_days: { nom: "Jours de météo propice aux feux", unite: "j/an" },
};

/**
 * LES SEUILS. Chaque mesure projetée est une barre, et le seuil de signalement que la règle a
 * appliqué est un trait vertical : le lecteur voit pourquoi la carte existe, et de combien la valeur
 * le dépasse ou non. La convention est affichée, pas seulement appliquée.
 */
export function Seuils({ horizon, mesures }: { horizon: number; mesures: { cle: string; valeur: number; seuil: number; defavorable: boolean }[] }) {
  // UNE ÉCHELLE PAR MESURE : des jours et des nuits ne se comparent pas sur un même axe. Chaque
  // barre va de zéro à 1,3 fois la plus grande de ses deux valeurs (projection, seuil).
  const maxDe = (m: { valeur: number; seuil: number }) => Math.max(m.valeur, m.seuil) * 1.3 || 1;
  return (
    <figure style={{ margin: "6px 0 0", display: "grid", gap: 12, maxWidth: 460 }} aria-label={`Valeurs projetées à l'horizon ${horizon} et seuils de signalement`}>
      {mesures.map((m) => {
        const info = MESURE[m.cle] ?? { nom: m.cle, unite: "" };
        const max = maxDe(m);
        return (
          <div key={m.cle} style={{ display: "grid", gap: 5 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
              <span className={s.etiquette}>{info.nom}, horizon {horizon}</span>
              <span className={s.mono} style={{ fontSize: 13, color: "var(--r-encre)", whiteSpace: "nowrap" }}>
                {Math.round(m.valeur)} <span style={{ color: "var(--r-meta)" }}>{info.unite}</span>
              </span>
            </div>
            <div style={{ position: "relative", height: 12 }}>
              <div className={s.barre} style={{ position: "absolute", left: 0, right: 0, top: 1 }} />
              <div className={s.barrePleine} style={{ position: "absolute", left: 0, width: `${(m.valeur / max) * 100}%`, top: 1, opacity: m.defavorable ? 1 : 0.55 }} />
              <div style={{ position: "absolute", left: `${(m.seuil / max) * 100}%`, top: -3, width: 2, height: 18, background: "var(--r-encre)", boxShadow: "0 0 0 2px var(--r-plaque)" }} />
            </div>
            <span className={s.mono} style={{ fontSize: 10.5, color: "var(--r-meta)" }}>
              seuil de signalement : {m.seuil} {info.unite}{m.defavorable ? " · franchi" : " · non franchi"}
            </span>
          </div>
        );
      })}
    </figure>
  );
}
