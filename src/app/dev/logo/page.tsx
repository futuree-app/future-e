// BANC DE COMPARAISON DU LOGO. Le texte actuel contre les SVG vectorisés, dans les contextes réels.
//
// Pourquoi cette page existe : le logo « futur•e » est du TEXTE écrit en Instrument Serif italique
// dans dix-neuf endroits du produit. C'est la dernière raison pour laquelle cette police est encore
// chargée, et le dernier signalement du linter de design. Sept SVG vectorisés existent depuis mai
// dans `logo/svg/`, jamais utilisés.
//
// Basculer réglerait quatre choses d'un coup : le finding se ferme, Instrument Serif quitte le
// produit avec ses 70 Ko de TTF, le dessin devient stable quel que soit le chargement des fontes
// (aujourd'hui le logo s'affiche en Georgia pendant un instant si la police tarde), et la marque
// cesse de dépendre d'un fichier tiers.
//
// CE QUE CETTE PAGE DOIT PERMETTRE DE VOIR, et pourquoi une capture ne suffirait pas :
//   1. le DESSIN est-il le même ? Le SVG fait 2542 × 837, donc un logotype ajusté à la main, dont
//      l'espacement et les proportions peuvent différer du texte composé ;
//   2. l'ENCOMBREMENT change-t-il ? Une navbar réserve une place, un logo plus large la déborde ;
//   3. tient-il aux PETITES TAILLES ? Un tracé vectorisé pensé pour du grand format peut se boucher
//      à 20 px de haut, là où du texte reste net.
//
// L'accessibilité n'est pas visible ici et compte autant : les dix-neuf occurrences actuelles sont
// du texte, lu sans effort par un lecteur d'écran. Un SVG demande un `role="img"` et un `aria-label`,
// à écrire à chaque endroit.
//
// DEV UNIQUEMENT : 404 en production.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

/** Le logo tel qu'il est écrit aujourd'hui, dix-neuf fois dans le produit. */
function LogoTexte({ size, color }: { size: number; color: string }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-brand)",
        fontSize: size,
        fontStyle: "italic",
        letterSpacing: "-0.01em",
        color,
        whiteSpace: "nowrap",
      }}
    >
      futur<span style={{ color: "var(--orange)", fontStyle: "normal" }}>•</span>e
    </span>
  );
}

/** Le logo vectorisé. Rapport 3,04 : une hauteur de 22 px donne 67 px de large. */
function LogoSvg({ size, variant }: { size: number; variant: "dark" | "light" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/logo/futuree-primary-on-${variant}.svg`}
      alt="futur•e"
      style={{ height: size, width: "auto", display: "block" }}
    />
  );
}

export default function DevLogoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Banc />;
}

function Banc() {
  const [clair, setClair] = useState(false);
  const fond = clair ? "#faf8f3" : "var(--bg)";
  const encre = clair ? "#1a1d28" : "var(--fg-hi)";
  const filet = clair ? "rgba(26,29,40,0.10)" : "var(--border-1)";
  const variant = clair ? "light" : "dark";

  return (
    <div className="min-h-screen" style={{ background: fond, color: encre, fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-10">
        <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ghost)" }}>
          Banc d&apos;essai · dev
        </p>
        <h1 className="font-[var(--weight-title)] text-[length:var(--text-title)] mb-3">
          Le logo, texte ou tracé
        </h1>
        <p className="text-[length:var(--text-body)] leading-[1.7] max-w-[640px] mb-8" style={{ opacity: 0.75 }}>
          À gauche le logo tel qu&apos;il est écrit aujourd&apos;hui, en Instrument Serif italique.
          À droite le SVG vectorisé qui existe depuis mai sans avoir jamais servi. Mêmes hauteurs,
          même fond, alignés sur la même ligne de base.
        </p>

        <button
          type="button"
          onClick={() => setClair(!clair)}
          className="px-4 py-2.5 rounded-lg text-[length:var(--text-dense)] border mb-12"
          style={{ background: clair ? "#f2ede4" : "var(--bg-deep)", borderColor: filet, color: encre }}
        >
          {clair ? "Passer au fond sombre" : "Passer au fond clair"}
        </button>

        <Bloc titre="1 · Navbar" detail="22 px, la taille la plus fréquente du produit" filet={filet}>
          <Paire size={22} encre={encre} variant={variant} filet={filet} />
        </Bloc>

        <Bloc titre="2 · Pied de page" detail="20 px" filet={filet}>
          <Paire size={20} encre={encre} variant={variant} filet={filet} />
        </Bloc>

        <Bloc titre="3 · Petite taille" detail="14 px, la limite basse : un tracé se bouche avant un texte" filet={filet}>
          <Paire size={14} encre={encre} variant={variant} filet={filet} />
        </Bloc>

        <Bloc titre="4 · Grand format" detail="72 px, pour juger le dessin lui-même" filet={filet}>
          <Paire size={72} encre={encre} variant={variant} filet={filet} />
        </Bloc>

        <Bloc titre="5 · En situation" detail="dans une barre de navigation réelle" filet={filet}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
            {(["texte", "svg"] as const).map((k) => (
              <div key={k} className="rounded-xl overflow-hidden border" style={{ borderColor: filet }}>
                <div
                  className="flex items-center justify-between px-5"
                  style={{ height: 64, borderBottom: `1px solid ${filet}`, background: clair ? "rgba(255,255,255,0.6)" : "var(--bg-card)" }}
                >
                  {k === "texte" ? <LogoTexte size={22} color={encre} /> : <LogoSvg size={22} variant={variant} />}
                  <div className="flex items-center gap-5 text-[length:var(--text-dense)]" style={{ opacity: 0.7 }}>
                    <span>Où vivre</span>
                    <span>Explorer</span>
                    <span>Pourquoi futur•e</span>
                  </div>
                </div>
                <p className="px-5 py-3 font-mono text-[length:var(--text-meta)]" style={{ color: "var(--ghost)" }}>
                  {k === "texte" ? "texte, aujourd'hui" : "SVG vectorisé"}
                </p>
              </div>
            ))}
          </div>
        </Bloc>

        <div className="mt-14 pt-8 border-t" style={{ borderColor: filet }}>
          <h2 className="font-[var(--weight-section)] text-[length:var(--text-section)] mb-4">Ce que chaque option coûte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[length:var(--text-dense)] leading-[1.7]" style={{ opacity: 0.85 }}>
            <div>
              <p className="font-[var(--weight-strong)] mb-2">Garder le texte</p>
              <p>
                Instrument Serif reste chargée pour ce seul usage, 70 Ko de TTF, et le linter continue
                de la signaler. Le logo s&apos;affiche en Georgia le temps que la police arrive. En
                revanche il reste sélectionnable, lu sans effort par un lecteur d&apos;écran, et il
                suit la taille de texte choisie par la personne.
              </p>
            </div>
            <div>
              <p className="font-[var(--weight-strong)] mb-2">Passer au SVG</p>
              <p>
                La police quitte le produit, le dessin devient stable, et le finding se ferme. En
                échange il faut écrire un texte alternatif à dix-neuf endroits, le logo cesse de
                grandir avec les préférences de taille de texte, et son dessin doit être identique à
                ce que la marque montre déjà ailleurs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Bloc({ titre, detail, filet, children }: { titre: string; detail: string; filet: string; children: React.ReactNode }) {
  return (
    <section className="mb-12">
      <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.1em] uppercase mb-1" style={{ color: "var(--ghost)" }}>
        {titre}
      </p>
      <p className="text-[length:var(--text-meta)] mb-4" style={{ opacity: 0.6 }}>{detail}</p>
      <div className="rounded-xl border p-8" style={{ borderColor: filet }}>{children}</div>
    </section>
  );
}

function Paire({ size, encre, variant, filet }: { size: number; encre: string; variant: "dark" | "light"; filet: string }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-end">
      {(["texte", "svg"] as const).map((k) => (
        <div key={k}>
          <div style={{ minHeight: size * 1.4, display: "flex", alignItems: "flex-end" }}>
            {k === "texte" ? <LogoTexte size={size} color={encre} /> : <LogoSvg size={size} variant={variant} />}
          </div>
          <p className="font-mono text-[length:var(--text-micro)] mt-3 pt-2 border-t" style={{ color: "var(--ghost)", borderColor: filet }}>
            {k === "texte" ? "TEXTE · INSTRUMENT SERIF ITALIQUE" : "SVG · TRACÉ VECTORISÉ"}
          </p>
        </div>
      ))}
    </div>
  );
}
