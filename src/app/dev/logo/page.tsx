// BANC DE COMPARAISON DU LOGO. Cinq propositions dans les contextes réels du produit.
//
// Pourquoi cette page existe : le logo « futur•e » est du TEXTE écrit en Instrument Serif italique
// dans dix-neuf endroits. C'est la dernière raison pour laquelle cette police est encore chargée, et
// le dernier signalement du linter de design.
//
// LA QUESTION S'EST DÉPLACÉE EN COURS DE ROUTE, et c'est le porteur qui l'a vue : les sept SVG de
// `logo/svg/` sont le dessin d'Instrument Serif VECTORISÉ, figé le 20 mai quand c'était la police du
// produit. Passer au SVG reviendrait donc à graver pour toujours le dessin de la police qu'on vient
// d'écarter. Ce n'est pas absurde (un logotype est une signature, pas une police d'interface), mais
// ça se décide au lieu de se subir.
//
// LES TROIS DERNIÈRES PROPOSITIONS GARDENT LE MOT EN TEXTE et ne dessinent que le SIGNE. C'est ce
// qui permet de sortir d'Instrument Serif sans perdre ce que le SVG faisait perdre : un logo en
// image n'est plus sélectionnable, ne suit plus la taille de texte choisie par la personne, et
// demande un texte alternatif à dix-neuf endroits.
//
// Le signe travaille sur le POINT MÉDIAN, seul élément déjà distinctif du nom, et il dit ce que le
// produit fait : situer un lieu sur une trajectoire. Un signe qui décore serait hors doctrine ; un
// signe qui informe est une signature.
//
// DEV UNIQUEMENT : 404 en production.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

type Variante = {
  id: string;
  label: string;
  nature: string;
  argument: string;
  reserve: string;
  render: (size: number, encre: string, variant: "dark" | "light") => React.ReactNode;
};

/* ── 1. L'existant : du texte en Instrument Serif italique ────────────────────────────────── */
function LogoTexte({ size, encre }: { size: number; encre: string }) {
  return (
    <span style={{ fontFamily: "var(--font-brand)", fontSize: size, fontStyle: "italic", letterSpacing: "-0.01em", color: encre, whiteSpace: "nowrap" }}>
      futur<span style={{ color: "var(--orange)", fontStyle: "normal" }}>•</span>e
    </span>
  );
}

/* ── 2. Le SVG existant : le dessin d'Instrument Serif, figé ──────────────────────────────── */
function LogoSvg({ size, variant }: { size: number; variant: "dark" | "light" }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/logo/futuree-primary-on-${variant}.svg`} alt="futur•e" style={{ height: size, width: "auto", display: "block" }} />;
}

/* ── 3. Le mot composé dans la police de l'interface ──────────────────────────────────────── */
function LogoArchivo({ size, encre }: { size: number; encre: string }) {
  return (
    <span style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: encre, whiteSpace: "nowrap" }}>
      futur<span style={{ color: "var(--orange)" }}>•</span>e
    </span>
  );
}

/* ── 4. LE REPÈRE. Le point médian devient un curseur sur une graduation. ──────────────────
   Ce que le produit fait, en un signe : situer un lieu sur une échelle. Le point garde sa place
   dans le mot, deux traits l'encadrent comme les crans d'une règle. Dimensionné en `em`, donc il
   suit la taille du texte et reste net à toute échelle. */
function LogoRepere({ size, encre }: { size: number; encre: string }) {
  return (
    <span style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: encre, whiteSpace: "nowrap", display: "inline-flex", alignItems: "baseline" }}>
      futur
      <svg width="0.42em" height="1em" viewBox="0 0 42 100" style={{ display: "inline-block", overflow: "visible" }} aria-hidden>
        <line x1="6" y1="48" x2="6" y2="68" stroke={encre} strokeWidth="5" opacity="0.35" />
        <line x1="36" y1="48" x2="36" y2="68" stroke={encre} strokeWidth="5" opacity="0.35" />
        <circle cx="21" cy="58" r="9" fill="var(--orange)" />
      </svg>
      e
    </span>
  );
}

/* ── 5. L'HORIZON. Une ligne traverse le mot et se prolonge au-delà. ───────────────────────
   « Habiter dans un monde qui change » : la ligne est le temps, elle passe sous le mot et continue
   à droite, hors du nom. Le point médian est le seul endroit où elle s'épaissit, là où le lecteur se
   situe. Le prolongement est ce qui empêche le signe d'être un simple soulignement. */
function LogoHorizon({ size, encre }: { size: number; encre: string }) {
  return (
    <span style={{ position: "relative", display: "inline-block", whiteSpace: "nowrap", paddingRight: size * 0.5 }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 600, letterSpacing: "-0.03em", color: encre }}>
        futur<span style={{ color: "var(--orange)" }}>•</span>e
      </span>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: -size * 0.12,
          height: Math.max(1, size * 0.045),
          background: `linear-gradient(90deg, ${encre} 0%, ${encre} 62%, var(--orange) 62%, var(--orange) 74%, transparent 100%)`,
          opacity: 0.9,
        }}
      />
    </span>
  );
}

const VARIANTES: Variante[] = [
  {
    id: "texte",
    label: "Texte, aujourd'hui",
    nature: "Instrument Serif italique",
    argument: "Sélectionnable, lu sans effort par un lecteur d'écran, et il grandit avec la taille de texte choisie par la personne.",
    reserve: "70 Ko de TTF pour ce seul usage, le linter continue de signaler, et le logo s'affiche en Georgia le temps que la police arrive.",
    render: (s, e) => <LogoTexte size={s} encre={e} />,
  },
  {
    id: "svg",
    label: "SVG existant",
    nature: "le dessin d'Instrument Serif, vectorisé le 20 mai",
    argument: "La police quitte le produit, le dessin devient stable, le finding se ferme. Les fichiers portent déjà les tokens du produit.",
    reserve: "Grave pour toujours le dessin de la police qu'on vient d'écarter. Et un logo en image cesse d'être du texte : alternative à écrire dix-neuf fois, plus de suivi des préférences de taille.",
    render: (s, _e, v) => <LogoSvg size={s} variant={v} />,
  },
  {
    id: "archivo",
    label: "Archivo",
    nature: "le mot dans la police de l'interface",
    argument: "L'identité dit une seule chose, du logo au dernier surtitre. Instrument Serif disparaît complètement, et le logo reste du texte.",
    reserve: "Une grotesque en 600 ressemble à un titre plus qu'à une signature. Le nom perd la note chaleureuse que l'italique portait.",
    render: (s, e) => <LogoArchivo size={s} encre={e} />,
  },
  {
    id: "repere",
    label: "Le repère",
    nature: "le point médian devient un curseur de graduation",
    argument: "Le signe dit ce que le produit fait : situer un lieu sur une échelle. Il travaille sur le point médian, seul élément déjà distinctif du nom, et le mot reste du texte. Dessiné en `em`, il suit la taille choisie par le lecteur.",
    reserve: "Les deux crans peuvent se fermer sous 14 px. À vérifier dans le bloc « petite taille ».",
    render: (s, e) => <LogoRepere size={s} encre={e} />,
  },
  {
    id: "horizon",
    label: "L'horizon",
    nature: "une ligne de temps traverse le mot et se prolonge",
    argument: "« Habiter dans un monde qui change » : la ligne est le temps, elle passe sous le nom et continue au-delà. Elle ne s'épaissit qu'au point médian, là où le lecteur se situe.",
    reserve: "Un trait sous un mot se lit d'abord comme un soulignement. C'est le prolongement à droite qui doit sauver le signe, et il ne survivra pas à un recadrage serré.",
    render: (s, e) => <LogoHorizon size={s} encre={e} />,
  },
];

export default function DevLogoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Banc />;
}

function Banc() {
  const [clair, setClair] = useState(false);
  const fond = clair ? "#faf8f3" : "var(--bg)";
  const encre = clair ? "#1a1d28" : "var(--fg-hi)";
  const filet = clair ? "rgba(26,29,40,0.10)" : "var(--border-1)";
  const variant: "dark" | "light" = clair ? "light" : "dark";

  return (
    <div className="min-h-screen" style={{ background: fond, color: encre, fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-10">
        <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.14em] uppercase mb-2" style={{ color: "var(--ghost)" }}>
          Banc d&apos;essai · dev
        </p>
        <h1 className="font-[var(--weight-title)] text-[length:var(--text-title)] mb-3">Le logo, cinq propositions</h1>
        <p className="text-[length:var(--text-body)] leading-[1.7] max-w-[660px] mb-3" style={{ opacity: 0.8 }}>
          Les deux premières existent déjà. La troisième compose le nom dans la police de
          l&apos;interface. Les deux dernières gardent le mot en texte et ne dessinent que le signe,
          en travaillant sur le point médian, seul élément déjà distinctif du nom.
        </p>
        <p className="text-[length:var(--text-dense)] leading-[1.7] max-w-[660px] mb-8" style={{ opacity: 0.6 }}>
          Garder le mot en texte n&apos;est pas un détail technique : le logo reste sélectionnable, lu
          par un lecteur d&apos;écran, et il grandit avec la taille de texte que la personne a choisie
          dans son navigateur. C&apos;est ce que la piste SVG fait perdre.
        </p>

        <button
          type="button"
          onClick={() => setClair(!clair)}
          className="px-4 py-2.5 rounded-lg text-[length:var(--text-dense)] border mb-12"
          style={{ background: clair ? "#f2ede4" : "var(--bg-deep)", borderColor: filet, color: encre }}
        >
          {clair ? "Passer au fond sombre" : "Passer au fond clair"}
        </button>

        {[
          { t: "1 · Navbar", d: "22 px, la taille la plus fréquente du produit", s: 22 },
          { t: "2 · Pied de page", d: "20 px", s: 20 },
          { t: "3 · Petite taille", d: "14 px, la limite basse : c'est ici qu'un signe se ferme", s: 14 },
          { t: "4 · Grand format", d: "72 px, pour juger le dessin lui-même", s: 72 },
        ].map((b) => (
          <section key={b.t} className="mb-12">
            <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.1em] uppercase mb-1" style={{ color: "var(--ghost)" }}>{b.t}</p>
            <p className="text-[length:var(--text-meta)] mb-4" style={{ opacity: 0.6 }}>{b.d}</p>
            <div className="rounded-xl border p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 items-end" style={{ borderColor: filet }}>
              {VARIANTES.map((v) => (
                <div key={v.id}>
                  <div style={{ minHeight: b.s * 1.7, display: "flex", alignItems: "flex-end" }}>{v.render(b.s, encre, variant)}</div>
                  <p className="font-mono text-[length:var(--text-micro)] mt-3 pt-2 border-t uppercase" style={{ color: "var(--ghost)", borderColor: filet }}>
                    {v.label}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}

        <section className="mb-12">
          <p className="font-mono text-[length:var(--text-kicker)] tracking-[0.1em] uppercase mb-1" style={{ color: "var(--ghost)" }}>5 · En situation</p>
          <p className="text-[length:var(--text-meta)] mb-4" style={{ opacity: 0.6 }}>dans une barre de navigation réelle</p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {VARIANTES.map((v) => (
              <div key={v.id} className="rounded-xl overflow-hidden border" style={{ borderColor: filet }}>
                <div
                  className="flex items-center justify-between px-5"
                  style={{ height: 64, borderBottom: `1px solid ${filet}`, background: clair ? "rgba(255,255,255,0.6)" : "var(--bg-card)" }}
                >
                  {v.render(22, encre, variant)}
                  <div className="flex items-center gap-5 text-[length:var(--text-dense)]" style={{ opacity: 0.7 }}>
                    <span>Où vivre</span>
                    <span>Explorer</span>
                  </div>
                </div>
                <p className="px-5 py-3 font-mono text-[length:var(--text-meta)]" style={{ color: "var(--ghost)" }}>{v.label}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-14 pt-8 border-t" style={{ borderColor: filet }}>
          <h2 className="font-[var(--weight-section)] text-[length:var(--text-section)] mb-6">Ce que chaque option coûte</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8 text-[length:var(--text-dense)] leading-[1.7]">
            {VARIANTES.map((v) => (
              <div key={v.id}>
                <p className="font-[var(--weight-strong)]">{v.label}</p>
                <p className="font-mono text-[length:var(--text-micro)] uppercase mb-2" style={{ color: "var(--ghost)" }}>{v.nature}</p>
                <p style={{ opacity: 0.85 }}>{v.argument}</p>
                <p className="mt-2" style={{ color: "var(--yellow-ink)" }}>Réserve : {v.reserve}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
