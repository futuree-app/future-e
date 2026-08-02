// ATELIER DE LA BIFURCATION. Le signe se règle en direct, parce qu'aucune valeur ne se devine.
//
// LA PISTE. Le point médian de « futur•e » est un point d'écriture inclusive : sa fonction
// grammaticale est de faire tenir deux lectures dans un seul mot. Le nom dit donc déjà que le futur
// n'a pas une seule forme. Le signe rend cette idée littérale : le point devient un nœud d'où
// partent trois trajectoires, une montante, une horizontale, une descendante. Trois scénarios,
// aucun désigné.
//
// POURQUOI PAS UN CURSEUR SUR UNE ÉCHELLE, que deux propositions antérieures avaient toutes deux
// réinventé : un point entre deux bornes est une NOTE, et l'ADR-0001 interdit le score synthétique
// comme le graphique qui le suggère. La bifurcation dit « plusieurs futurs partent d'ici », ce qui
// est exactement l'invariant n°1 : on éclaire, on ne décide pas.
//
// LES MÉTRIQUES SONT MESURÉES, PAS ESTIMÉES (lues dans Archivo-Variable, unitsPerEm 1000) :
//   avance du point médian  0,350 em      encre du point  de 0,062 à 0,289 em
//   centre optique du point 0,344 em au-dessus de la ligne de base, diamètre 0,227 em
//   le « e » commence visuellement à 0,390 em
//   ESPACE LIBRE à droite du point : 0,101 em, soit 2,2 px à un corps de 22 px.
//
// D'OÙ LA DÉCISION QUE CET ATELIER DOIT PRENDRE. Des filets lisibles demandent 0,14 em ; la chasse
// n'en offre que 0,101. Loger le signe suppose donc d'ÉLARGIR le point médian, donc de modifier la
// silhouette du nom. Ce n'est plus « on ne touche qu'au signe ». Le curseur « écartement » chiffre
// ce que ça coûte, et le rendu à droite montre le mot avant et après.
//
// TROIS CONTRAINTES TENUES PAR CONSTRUCTION, apprises des propositions précédentes :
//   1. Le nom accessible reste « futur•e ». Le caractère U+2022 demeure dans le flux, rendu
//      transparent : le copier-coller, la recherche et le lecteur d'écran donnent le nom entier.
//      Une proposition antérieure remplaçait le point par un SVG et rendait « future ».
//   2. Le signe tient en monochrome. Aucune information ne repose sur une différence de couleur ni
//      sur une opacité : filets et point ont la même valeur.
//   3. Un seuil de dégradation est déclaré. Sous le seuil, les filets disparaissent et il reste le
//      point plein, c'est-à-dire la marque d'aujourd'hui. Se dégrader en quelque chose, jamais en
//      bouillie.
//
// DEV UNIQUEMENT : 404 en production.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

/** Métriques lues dans la police, en em. */
const M = { advance: 0.35, inkStart: 0.062, inkEnd: 0.289, centerY: 0.344, diameter: 0.227 };

type Reglages = {
  angle: number;      // degrés d'écart des filets extrêmes
  longueur: number;   // em
  epaisseur: number;  // em
  ecart: number;      // em ajoutés à la chasse du point
  seuil: number;      // px : sous ce corps, les filets disparaissent
};

const DEFAUT: Reglages = { angle: 20, longueur: 0.15, epaisseur: 0.032, ecart: 0.06, seuil: 18 };

/**
 * Le nom, avec le point médian augmenté.
 * Le caractère reste dans le flux et devient transparent ; le signe est peint par-dessus, à
 * l'emplacement exact de l'encre du point.
 */
function LogoBifurcation({ size, r, mono, encre }: { size: number; r: Reglages; mono: boolean; encre: string }) {
  const filets = size >= r.seuil;
  const largeur = M.advance + r.ecart;
  const teintePoint = mono ? encre : "var(--accent-ink)";

  // Repère du SVG : 1000 unités = 1 em, axe y vers le bas, origine sur la ligne de base.
  const cx = (M.inkStart + M.inkEnd) / 2 * 1000;
  const cy = -M.centerY * 1000;
  const rad = (M.diameter / 2) * 1000;
  const depart = M.inkEnd * 1000;
  const lg = r.longueur * 1000;

  return (
    <span style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: encre, whiteSpace: "nowrap" }}>
      futur
      <span style={{ position: "relative", display: "inline-block", width: `${largeur}em` }}>
        {/* Le caractère reste : c'est lui que le lecteur d'écran annonce et que le copier-coller emporte. */}
        <span style={{ color: "transparent" }}>•</span>
        <svg
          aria-hidden
          viewBox={`0 -1000 ${largeur * 1000} 1000`}
          style={{ position: "absolute", left: 0, bottom: 0, width: `${largeur}em`, height: "1em", overflow: "visible" }}
        >
          <circle cx={cx} cy={cy} r={rad} fill={teintePoint} />
          {filets &&
            [r.angle, 0, -r.angle].map((a) => {
              const rd = (a * Math.PI) / 180;
              return (
                <line
                  key={a}
                  x1={depart} y1={cy}
                  x2={depart + Math.cos(rd) * lg}
                  y2={cy - Math.sin(rd) * lg}
                  stroke={teintePoint}
                  strokeWidth={r.epaisseur * 1000}
                  strokeLinecap="butt"
                />
              );
            })}
        </svg>
      </span>
      e
    </span>
  );
}

/** Le logo actuel, pour comparer la silhouette. */
function LogoActuel({ size, encre }: { size: number; encre: string }) {
  return (
    <span style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: encre, whiteSpace: "nowrap" }}>
      futur<span style={{ color: "var(--accent-ink)" }}>•</span>e
    </span>
  );
}

export default function DevBifurcationPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Atelier />;
}

function Atelier() {
  const [r, setR] = useState<Reglages>(DEFAUT);
  const [mono, setMono] = useState(false);
  const encre = "var(--fg-hi)";
  const set = (k: keyof Reglages) => (e: React.ChangeEvent<HTMLInputElement>) => setR({ ...r, [k]: Number(e.target.value) });

  const libre = M.advance + 0.04 - M.inkEnd;
  const deborde = r.longueur > libre + r.ecart;

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-10">
        <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.14em] uppercase text-ghost mb-2">Atelier · dev</p>
        <h1 className="font-[var(--weight-title)] text-[length:var(--text-title)] mb-3">La bifurcation</h1>
        <p className="text-[length:var(--text-body)] leading-[1.7] text-muted max-w-[640px] mb-8">
          Le point médian devient un nœud d&apos;où partent trois trajectoires. Le mot reste du texte,
          le caractère reste dans le flux, et le nom emporté par un copier-coller reste
          <span className="font-mono"> futur•e</span>. Réglez, puis lisez les trois blocs de contrôle
          en bas.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
          {/* Réglages */}
          <div className="flex flex-col gap-5">
            {([
              { k: "angle" as const, label: "Angle des filets extrêmes", min: 0, max: 40, step: 1, unite: "°" },
              { k: "longueur" as const, label: "Longueur des filets", min: 0.04, max: 0.3, step: 0.005, unite: " em" },
              { k: "epaisseur" as const, label: "Épaisseur", min: 0.012, max: 0.07, step: 0.002, unite: " em" },
              { k: "ecart" as const, label: "Écartement ajouté au point", min: 0, max: 0.2, step: 0.005, unite: " em" },
              { k: "seuil" as const, label: "Seuil de dégradation", min: 10, max: 40, step: 1, unite: " px" },
            ]).map((c) => (
              <label key={c.k} className="block">
                <span className="flex items-baseline justify-between text-[length:var(--text-dense)] mb-1">
                  <span>{c.label}</span>
                  <span className="font-mono text-[length:var(--text-meta)] text-ghost">
                    {r[c.k]}{c.unite}
                  </span>
                </span>
                <input type="range" min={c.min} max={c.max} step={c.step} value={r[c.k]} onChange={set(c.k)} className="w-full" />
              </label>
            ))}
            <label className="flex items-center gap-2.5 text-[length:var(--text-dense)]">
              <input type="checkbox" checked={mono} onChange={(e) => setMono(e.target.checked)} />
              Monochrome (tampon, gravure, fax)
            </label>
            <button
              type="button"
              onClick={() => setR(DEFAUT)}
              className="mt-1 px-4 py-2 rounded-lg text-[length:var(--text-dense)] border border-[var(--border-2)] text-muted hover:text-label transition-colors"
            >
              Revenir aux valeurs de départ
            </button>

            <div className="mt-2 p-4 rounded-xl border border-[var(--border-1)]">
              <p className="font-mono text-[length:var(--text-micro)] uppercase text-ghost mb-2">Ce que la chasse permet</p>
              <p className="text-[length:var(--text-meta)] leading-[1.6] text-muted">
                Espace libre à droite du point, avant le <span className="font-mono">e</span> :
                <span className="font-mono text-label"> {libre.toFixed(3)} em</span>.
              </p>
              <p className="text-[length:var(--text-meta)] leading-[1.6] mt-2" style={{ color: deborde ? "var(--yellow-ink)" : "var(--green-ink)" }}>
                {deborde
                  ? `Les filets débordent : le mot s'écarte de ${r.ecart.toFixed(3)} em, soit la silhouette du nom qui change.`
                  : "Les filets tiennent dans la chasse : la silhouette du nom est inchangée."}
              </p>
            </div>
          </div>

          {/* Rendus */}
          <div className="flex flex-col gap-10">
            <Bloc titre="Grand format · 72 px" detail="pour juger le dessin">
              <LogoBifurcation size={72} r={r} mono={mono} encre={encre} />
            </Bloc>

            <Bloc titre="Comparaison de silhouette · 44 px" detail="au-dessus la bifurcation, en dessous le logo actuel">
              <div className="flex flex-col gap-3">
                <LogoBifurcation size={44} r={r} mono={mono} encre={encre} />
                <LogoActuel size={44} encre={encre} />
              </div>
            </Bloc>

            <Bloc titre="Navbar · 22 px" detail="la taille la plus fréquente du produit">
              <div className="flex items-center justify-between px-5 rounded-lg border border-[var(--border-1)]" style={{ height: 64, background: "var(--bg-card)" }}>
                <LogoBifurcation size={22} r={r} mono={mono} encre={encre} />
                <span className="text-[length:var(--text-dense)] text-muted">Où vivre · Explorer</span>
              </div>
            </Bloc>

            <Bloc titre="Le seuil de dégradation" detail={`sous ${r.seuil} px, les filets disparaissent et il reste la marque d'aujourd'hui`}>
              <div className="flex items-end gap-8 flex-wrap">
                {[r.seuil + 4, r.seuil, r.seuil - 1, 14, 11].map((s, i) => (
                  <div key={i}>
                    <LogoBifurcation size={s} r={r} mono={mono} encre={encre} />
                    <p className="font-mono text-[length:var(--text-micro)] text-ghost mt-2">{s} px</p>
                  </div>
                ))}
              </div>
            </Bloc>

            <Bloc titre="Le nom emporté" detail="sélectionnez la ligne ci-dessous et copiez-la">
              <LogoBifurcation size={28} r={r} mono={mono} encre={encre} />
              <p className="text-[length:var(--text-meta)] text-muted mt-3 leading-[1.6]">
                Le caractère <span className="font-mono">•</span> est resté dans le flux, rendu
                transparent. Un lecteur d&apos;écran annonce <span className="font-mono">futur•e</span>,
                la recherche du navigateur le trouve, et le copier-coller l&apos;emporte.
              </p>
            </Bloc>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-[var(--border-1)]">
          <h2 className="font-[var(--weight-section)] text-[length:var(--text-section)] mb-4">Ce qui reste à trancher</h2>
          <ul className="flex flex-col gap-3 text-[length:var(--text-dense)] leading-[1.7] text-muted max-w-[720px]">
            <li>
              <span className="text-label font-[var(--weight-strong)]">L&apos;écartement.</span> Des
              filets lisibles demandent plus de place que la chasse n&apos;en offre. Élargir le point
              modifie la silhouette du nom, ce qui dépasse « on ne touche qu&apos;au signe ».
            </li>
            <li>
              <span className="text-label font-[var(--weight-strong)]">La lecture parasite.</span>{" "}
              Trois traits divergents peuvent lire « réseau », « partage » ou « étincelle ». Angles
              faibles et filets d&apos;égale épaisseur écartent le risque, à vérifier à l&apos;œil.
            </li>
            <li>
              <span className="text-label font-[var(--weight-strong)]">Le seuil.</span> Sous le
              seuil, le signe redevient le logo actuel. C&apos;est une pièce du dessin, pas un
              pis-aller : un logo sans version petite déclarée n&apos;est pas terminé.
            </li>
            <li>
              <span className="text-label font-[var(--weight-strong)]">Le plafond de l&apos;exercice.</span>{" "}
              Ceci reste un mot composé avec un signe. Un vrai logotype demande un dessinateur de
              caractères et des glyphes corrigés.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function Bloc({ titre, detail, children }: { titre: string; detail: string; children: React.ReactNode }) {
  return (
    <section>
      <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.1em] uppercase text-ghost mb-1">{titre}</p>
      <p className="text-[length:var(--text-meta)] text-muted mb-4">{detail}</p>
      <div className="rounded-xl border border-[var(--border-1)] p-8">{children}</div>
    </section>
  );
}
