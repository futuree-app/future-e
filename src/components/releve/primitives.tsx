// LE RELEVÉ · PRIMITIVES CANONIQUES DE FUTUR•E (FUT-87 ; canon depuis FUT-118 R0, DESIGN.md v3.0).
//
// Utilisées en production par l'accueil, et par Ma décision sous `DECISION_RELEVE`. Toute nouvelle
// interface (dont le centre de décision) part d'ici ; un composant qui manque s'ajoute ici, avec ses
// tests, plutôt que dans un module. `BandeauPrototype` est la seule exception : il ne sert qu'aux
// bancs de développement.
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
import {
  CERCLE_TERRITOIRE, CARRE_AUTOUR, LOSANGE_LOGEMENT, ECHELLE_VIEWBOX, ECHELLE_CENTRE,
} from "@/components/report/echelle-geometry";
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
  | { type: "valeur"; libelle?: string; valeur: string; href?: string; date?: string; grain?: GrainCle }
  | { type: "source"; texte: string; href?: string; date?: string; grain?: GrainCle }
  | { type: "date"; texte: string };

/**
 * LA MARGE DE PREUVE. Grain, valeur observée, source, date : ce qui fonde l'affirmation d'à côté.
 * Une valeur ou une source qui porte son propre grain (carte à grains mêlés) le dit par son glyphe ;
 * un lien reste un lien, qu'il y ait une valeur ou non (revue V2). `enLigne` : sous un texte, sans
 * filet vertical (côtés d'une composition, preuves du verdict).
 */
export function Marge({ elements, etiquette = "Preuve", enLigne = false }: { elements: ElementDeMarge[]; etiquette?: string; enLigne?: boolean }) {
  if (elements.length === 0) return <div aria-hidden />;
  return (
    <aside className={enLigne ? `${s.marge} ${s.margeEnLigne}` : s.marge} aria-label={etiquette}>
      {elements.map((e, i) => {
        if (e.type === "grain") return <Grain key={i} grain={e.grain}>{e.libelle}</Grain>;
        if (e.type === "date") return <span key={i}>{e.texte}</span>;
        const glyphe = e.grain ? <span className={s.margeGlyphe}><GlypheGrain grain={e.grain} taille={10} /></span> : null;
        if (e.type === "valeur") {
          const v = <span className={s.margeValeur}>{e.valeur}</span>;
          return (
            <span key={i} className={s.margeLigne}>
              {glyphe}
              <span>
                {e.libelle ? <>{e.libelle} · </> : null}
                {e.href ? <Link href={e.href}>{v}</Link> : v}
                {e.date ? <span className={s.margeDate}> · {e.date}</span> : null}
              </span>
            </span>
          );
        }
        return (
          <span key={i} className={s.margeLigne}>
            {glyphe}
            <span>
              {e.href ? <Link href={e.href}>{e.texte}</Link> : e.texte}
              {e.date ? <span className={s.margeDate}> · {e.date}</span> : null}
            </span>
          </span>
        );
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
export { TEINTE_REGISTRE } from "./marge";

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
 *
 * DES JALONS, JAMAIS UNE COURBE (revue V2). Une valeur à 2030, 2050 ou 2100 est une projection à
 * un palier de réchauffement, la référence est une moyenne sur trente ans : aucune n'est un point
 * d'une série annuelle. La V1 les reliait par une ligne, qui laissait croire que la trajectoire
 * entre deux horizons était connue. Chaque valeur est désormais un jalon isolé (une tige depuis
 * l'axe, un repère carré à sa hauteur), et rien n'est tracé entre deux jalons.
 */
export function RegleDuTemps({
  jalons, aujourdhui = 2026, hauteurValeurs, etiquette,
}: {
  jalons: JalonTemps[];
  aujourdhui?: number;
  /** Si fourni, pose chaque valeur numérique à sa hauteur (même unité), sans les relier. */
  hauteurValeurs?: { min: number; max: number; valeurs: Record<number, number> };
  etiquette: string;
}) {
  // LE DÉBUT SUIT LA DONNÉE : un bâtiment de 1890 ne sort pas du cadre. Jamais après 1975, pour que
  // la référence climatique (1976-2005) et le présent gardent leur place.
  const DEBUT = Math.min(1975, Math.floor((Math.min(...jalons.map((j) => j.annee)) - 6) / 10) * 10);
  // Hauteurs en pixels réels : le SVG est étiré en largeur seulement (`preserveAspectRatio="none"`),
  // et tous les traits gardent 1 px grâce à `vector-effect`. Les textes et les repères sont du HTML
  // posé par-dessus, pour garder leur dessin à toute largeur.
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
  const pose = (p: number): CSSProperties => (p > 80
    ? { right: `${100 - p}%`, transform: "translateX(6px)", textAlign: "right" }
    : { left: `${p}%`, transform: "translateX(-6px)", textAlign: "left" });
  // DEUX JALONS PROCHES NE SE CHEVAUCHENT PAS (revue V2, cas « immeuble » : diagnostic 2023 et audit
  // 2024 s'écrivaient l'un sur l'autre). Un libellé trop près du précédent descend d'une ligne.
  const ECART_MIN = 14; // en % de la largeur : un libellé de deux mots en mono
  const rangs = new Map<number, number>();
  const dernierParRang: number[] = [];
  [...jalons].sort((a, b) => centre(a) - centre(b)).forEach((j) => {
    const p = pct(centre(j));
    let rang = 0;
    while (dernierParRang[rang] != null && p - dernierParRang[rang]! < ECART_MIN) rang++;
    dernierParRang[rang] = p;
    rangs.set(j.annee, rang);
  });
  const nbRangs = Math.max(1, ...[...rangs.values()].map((r) => r + 1));
  return (
    <figure style={{ margin: 0 }} aria-label={etiquette}>
      <div style={{ position: "relative", height: H }}>
        <svg className={s.regle} viewBox={`0 0 ${L} ${H}`} preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: H }} aria-hidden focusable="false">
          <line className={s.regleAxe} x1={0} x2={L} y1={yAxe} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {Array.from({ length: Math.floor((2100 - DEBUT) / 20) + 1 }, (_, i) => 2100 - i * 20).filter((a) => a > DEBUT).map((a) => (
            <line key={a} className={s.regleTic} x1={x(a)} x2={x(a)} y1={yAxe - 5} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          ))}
          <line className={s.regleAujourdhui} x1={x(aujourdhui)} x2={x(aujourdhui)} y1={4} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          {jalons.map((j) => {
            const v = valeurDe(j);
            const cy = v != null ? y(v) : yAxe - 18;
            return j.jusqua ? (
              <rect key={j.annee} className={s.regleBande} x={x(j.annee)} width={x(j.jusqua) - x(j.annee)} y={cy - 3} height={6} vectorEffect="non-scaling-stroke" />
            ) : (
              <line key={j.annee} className={s.regleTic} x1={x(j.annee)} x2={x(j.annee)} y1={cy} y2={yAxe} strokeWidth={1} vectorEffect="non-scaling-stroke" />
            );
          })}
        </svg>
        {/* Le repère carré de chaque horizon, à la hauteur de sa valeur : un point, pas un sommet de courbe. */}
        {jalons.filter((j) => !j.jusqua && valeurDe(j) != null).map((j) => (
          <span key={`repere-${j.annee}`} aria-hidden style={{
            position: "absolute", left: `${pct(j.annee)}%`, top: y(valeurDe(j)!) - 4,
            width: 8, height: 8, marginLeft: -4, background: "var(--r-encre)",
          }} />
        ))}
        {jalons.map((j) => (j.valeur ? (
          <span key={j.annee} className={s.chiffre} style={{
            position: "absolute", fontSize: 19, whiteSpace: "nowrap",
            top: Math.max(0, (valeurDe(j) != null ? y(valeurDe(j)!) : yAxe - 18) - 32),
            ...pose(pct(centre(j))),
          }}>
            {j.valeur}
          </span>
        ) : null))}
        <span className={s.mono} style={{ position: "absolute", top: 0, fontSize: 10.5, color: "var(--r-meta)", whiteSpace: "nowrap", ...pose(pct(aujourdhui)), transform: "translateX(6px)" }}>
          aujourd&apos;hui
        </span>
      </div>
      <figcaption style={{ position: "relative", height: 40 * nbRangs, marginTop: 8 }}>
        {jalons.map((j) => (
          <span key={j.annee} className={s.mono} style={{
            position: "absolute", top: 40 * (rangs.get(j.annee) ?? 0), fontSize: 11, color: "var(--r-meta)", whiteSpace: "nowrap", lineHeight: 1.4,
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

// ── L'emblème des trois échelles ─────────────────────────────────────────────────────────────

/**
 * L'EMBLÈME, EN GRAND. Les formes exactes du repère du hub (`echelle-geometry.ts`), en trait seul,
 * avec trois renvois de planche : un trait, un texte. L'accueil y écrit le nom des échelles, le
 * dossier le nombre de constats lus à chacune. Le dessin ne représente jamais le lieu lui-même.
 */
export type EtatTrace = "constats" | "examinee" | "non_examinee";

export function EmblemeEchelles({ renvois, etiquette, etats }: {
  /** Les trois textes de renvoi : commune, secteur, bâtiment. Absents : l'emblème seul, sans renvois. */
  renvois?: [string, string, string];
  etiquette: string;
  /**
   * L'état de chaque forme. `constats` : trait plein ; `examinee` (examinée, aucun constat affiché) :
   * trait fin et discret ; `non_examinee` : pointillé, la forme est là mais cette lecture ne l'a pas
   * parcourue. Absent : les trois formes en trait plein (accueil).
   */
  etats?: { commune: EtatTrace; secteur: EtatTrace; batiment: EtatTrace };
}) {
  const V = ECHELLE_VIEWBOX;
  const c = ECHELLE_CENTRE;
  const marge = renvois ? 70 : 16;
  const trace = (e: EtatTrace | undefined, epaisseur: number) => (
    e === "non_examinee" ? { stroke: "var(--r-discret)", strokeWidth: 0.9, strokeDasharray: "3 4" }
      : e === "examinee" ? { stroke: "var(--r-discret)", strokeWidth: 0.9 }
        : { stroke: "currentColor", strokeWidth: epaisseur }
  );
  return (
    <figure style={{ margin: 0 }} aria-label={etiquette}>
      <svg viewBox={`${-marge} ${-16} ${V + marge * 2} ${V + 32}`} style={{ width: "100%", height: "auto", display: "block", color: "var(--r-encre)" }} aria-hidden focusable="false">
        {/* Graduations de la commune : 48 repères, un sur quatre plus long, comme une rose de relevé. */}
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 48) * Math.PI * 2;
          const r1 = CERCLE_TERRITOIRE.r + 4;
          const r2 = CERCLE_TERRITOIRE.r + (i % 4 === 0 ? 11 : 7);
          return <line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2} stroke="var(--r-discret)" strokeWidth={0.6} />;
        })}
        <circle {...CERCLE_TERRITOIRE} fill="none" {...trace(etats?.commune, 1.1)} />
        <rect {...CARRE_AUTOUR} fill="none" {...trace(etats?.secteur, 1.1)} />
        <rect {...LOSANGE_LOGEMENT} fill="none" {...trace(etats?.batiment, 1.3)} />
        <circle cx={c} cy={c} r={2.2} fill="currentColor" />
        {renvois ? (
          <>
            <g stroke="var(--r-discret)" strokeWidth={0.6} fill="none">
              <polyline points={`${c + 68},${c - 68} ${c + 96},${c - 98} ${V + marge - 6},${c - 98}`} />
              <polyline points={`${c + 54},${c + 30} ${V + 14},${c + 30} ${V + marge - 6},${c + 30}`} />
              <polyline points={`${c - 22},${c + 22} ${c - 64},${c + 118} ${-marge + 6},${c + 118}`} />
            </g>
            <g fontFamily="var(--font-mono)" fontSize={8.5} fill="var(--r-meta)">
              <text x={V + marge - 6} y={c - 103} textAnchor="end">{renvois[0]}</text>
              <text x={V + marge - 6} y={c + 25} textAnchor="end">{renvois[1]}</text>
              <text x={-marge + 6} y={c + 113}>{renvois[2]}</text>
            </g>
          </>
        ) : null}
      </svg>
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
