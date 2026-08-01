// BANC D'ESSAI TYPOGRAPHIQUE. Quatre serifs candidates sur le MÊME écran et le MÊME contenu.
//
// Pourquoi cette page existe : `Instrument Serif` est la serif de la direction artistique
// (ADR-0005), et le porteur la soupçonne d'être devenue un marqueur d'interface générée, avis que
// partage le linter de design. Changer la police est une décision d'ADR, elle ne se prend pas au
// ressenti sur deux captures d'écrans différents.
//
// LA MÉTHODE COMPTE AUTANT QUE LE RÉSULTAT. Le piège serait de comparer la police actuelle sur un
// écran pauvre à une candidate sur un écran soigné, puis de créditer la typographie d'une
// amélioration produite en réalité par la hiérarchie. Ici, seule la famille change : mêmes
// contenus, mêmes tailles, mêmes graisses, même espacement, même fond. Le sans et le mono ne
// bougent pas non plus, puisqu'ils ne sont pas en cause.
//
// L'écran reproduit le sommaire des trois échelles du rapport, celui dont la capture a lancé la
// question, plus un titre de verdict et un fragment de prose : les trois moments où la serif se
// voit réellement.
//
// DEV UNIQUEMENT : 404 en production.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

type Candidate = {
  id: string;
  label: string;
  stack: string;
  origine: string;
  argument: string;
};

const CANDIDATES: Candidate[] = [
  {
    id: "instrument",
    label: "Instrument Serif",
    stack: "'Instrument Serif', Georgia, serif",
    origine: "Rodrigo Fuenzalida, 2022, Google Fonts",
    argument:
      "La police actuelle. Contrastée, élégante en grand corps. Devenue en deux ans la serif par défaut des interfaces sombres à effet verre, ce qui est précisément le reproche.",
  },
  {
    id: "newsreader",
    label: "Newsreader",
    stack: "'Newsreader', Georgia, serif",
    origine: "Production Type, Google Fonts",
    argument:
      "Registre de presse, austère et sérieux. Colle au registre du dossier d'instruction, et n'est presque jamais vue dans un produit.",
  },
  {
    id: "spectral",
    label: "Spectral",
    stack: "'Spectral', Georgia, serif",
    origine: "Production Type, Paris, Google Fonts",
    argument:
      "Dessinée pour l'écran, italique de vraie qualité. Atelier français, cohérent avec un produit sur le territoire français.",
  },
  {
    id: "literata",
    label: "Literata",
    stack: "'Literata', Georgia, serif",
    origine: "TypeTogether pour Google Books",
    argument:
      "Conçue pour la lecture longue, plus chaleureuse que les trois autres. Presque absente des interfaces produit.",
  },
];

const ECHELLES = [
  { rang: "01", nom: "Territoire", grain: "La commune", benefit: "Chaleur, inondations, érosion côtière. Ce que Nantes devient selon l'horizon choisi, données climatiques publiques à l'appui." },
  { rang: "02", nom: "Autour de l'adresse", grain: "Le secteur autour de l'adresse", benefit: "Commerces, école, gare, espace vert, chaleur du quartier, place de la voiture. Ce qui se mesure autour du point, et pas à l'échelle de la commune." },
  { rang: "03", nom: "Logement", grain: "Le bâtiment", benefit: "Diagnostic, confort d'été, sol de la parcelle, sinistres indemnisés. Et, pour finir, ce qu'il reste à demander avant de décider." },
];

export default function DevTypoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Banc />;
}

function Banc() {
  const [actif, setActif] = useState<Candidate>(CANDIDATES[0]);
  const [cote, setCote] = useState<Candidate | null>(null);

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "'Instrument Sans', sans-serif" }}>
      {/* Les trois candidates non embarquées dans le produit sont chargées ICI seulement. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=Spectral:ital,wght@0,300;0,400;0,500;1,300;1,400&family=Literata:ital,opsz,wght@0,7..72,300..600;1,7..72,300..600&display=swap"
      />

      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-10">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">
          Banc d&apos;essai · dev
        </p>
        <h1 className="text-[26px] mb-2" style={{ fontFamily: actif.stack }}>
          Quelle serif pour futur•e
        </h1>
        <p className="text-[15px] text-muted leading-[1.7] max-w-[680px] mb-8">
          Seule la famille change d&apos;un choix à l&apos;autre. Mêmes contenus, mêmes tailles,
          mêmes graisses, même fond, et le sans et le mono ne bougent pas. Ce qui vous plaira
          davantage viendra donc de la police, et de rien d&apos;autre.
        </p>

        {/* Sélecteur. Fond opaque et non translucide : un sélecteur se lit sur ce qu'il recouvre. */}
        <div className="flex flex-wrap gap-2 mb-3">
          {CANDIDATES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActif(c)}
              className="px-4 py-2.5 rounded-lg text-[14px] border transition-colors"
              style={{
                background: actif.id === c.id ? "var(--bg-elev-3)" : "var(--bg-deep)",
                borderColor: actif.id === c.id ? "var(--border-hi)" : "var(--border-1)",
                color: actif.id === c.id ? "var(--fg-1)" : "var(--fg-3)",
                fontFamily: c.stack,
              }}
            >
              {c.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="text-[13px] text-ghost">Comparer côte à côte avec :</span>
          {CANDIDATES.filter((c) => c.id !== actif.id).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCote(cote?.id === c.id ? null : c)}
              className="px-3 py-1.5 rounded-lg text-[13px] border transition-colors"
              style={{
                background: cote?.id === c.id ? "var(--bg-elev-3)" : "transparent",
                borderColor: cote?.id === c.id ? "var(--border-hi)" : "var(--border-1)",
                color: cote?.id === c.id ? "var(--fg-1)" : "var(--fg-3)",
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className={cote ? "grid grid-cols-1 lg:grid-cols-2 gap-10" : ""}>
          <Echantillon c={actif} />
          {cote && <Echantillon c={cote} />}
        </div>
      </div>
    </div>
  );
}

function Echantillon({ c }: { c: Candidate }) {
  return (
    <section>
      <div className="pb-4 mb-8 border-b" style={{ borderColor: "var(--border-1)" }}>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost">{c.label}</p>
        <p className="text-[12px] text-ghost mt-1">{c.origine}</p>
        <p className="text-[13px] text-muted leading-[1.6] mt-2">{c.argument}</p>
      </div>

      {/* 1. Le grand titre de page. */}
      <h2
        className="font-normal text-[clamp(30px,3.4vw,44px)] leading-[1.08] tracking-[-1px] mb-3"
        style={{ fontFamily: c.stack }}
      >
        Nantes en 2030, 2050, 2100.<br />
        <span className="italic" style={{ color: "var(--accent-ink)" }}>Ce que ça change pour vous.</span>
      </h2>
      <p className="text-[17px] leading-[1.72] text-muted mb-12 max-w-[500px]">
        Ce que le changement climatique fait concrètement à votre quotidien ici. Choisissez un
        horizon. Les données s&apos;adaptent quand c&apos;est possible.
      </p>

      {/* 2. Le sommaire des échelles, l'écran qui a lancé la question. */}
      <h3 className="font-normal text-[clamp(22px,2.4vw,30px)] leading-[1.18] tracking-[-0.5px] mb-6" style={{ fontFamily: c.stack }}>
        Trois échelles, de la commune à vos murs.
      </h3>
      <div className="flex flex-col mb-12">
        {ECHELLES.map((e, i) => (
          <article
            key={e.rang}
            className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 items-baseline py-5 border-t first:border-t-0"
            style={{ borderColor: i === 0 ? "transparent" : "var(--border-1)" }}
          >
            <span className="font-mono text-[13px] text-ghost tabular-nums">{e.rang}</span>
            <div>
              <h4 className="font-normal text-[20px] text-label" style={{ fontFamily: c.stack }}>
                {e.nom}
                <span className="text-muted text-[15px]"> · {e.grain}</span>
              </h4>
              <p className="text-[13px] text-muted leading-[1.65] mt-2.5">{e.benefit}</p>
            </div>
          </article>
        ))}
      </div>

      {/* 3. Le verdict, là où la serif porte une phrase longue. */}
      <div className="rounded-2xl p-6 sm:p-8" style={{ background: "var(--bg-elev-2)", border: "1px solid var(--border-2)", borderTop: "2px solid var(--orange)" }}>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase mb-3" style={{ color: "var(--orange-ink)" }}>
          Ce qui départage
        </p>
        <p className="font-normal text-[clamp(20px,2.2vw,26px)] leading-[1.28] tracking-[-0.3px]" style={{ fontFamily: c.stack }}>
          Nantes tient bien vos priorités de cadre de vie, à un arbitrage près : les étés y
          deviennent nettement plus chauds, quand vous cherchiez à les éviter.
        </p>
        <p className="text-[14px] text-muted leading-[1.7] mt-4">
          Trente-deux jours au-dessus de 30 °C attendus en 2050, contre dix-neuf aujourd&apos;hui.
          La donnée vient de DRIAS, scénario France +2,7 °C.
        </p>
      </div>
    </section>
  );
}
