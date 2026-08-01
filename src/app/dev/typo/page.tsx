// BANC D'ESSAI TYPOGRAPHIQUE. Six propositions sur le MÊME écran et le MÊME contenu.
//
// Pourquoi cette page existe : `Instrument Serif` est la serif de la direction artistique
// (ADR-0005), et le porteur la soupçonne d'être devenue un marqueur d'interface générée, avis que
// partage le linter de design. Changer la police est une décision d'ADR, elle ne se prend pas au
// ressenti sur deux captures d'écrans différents.
//
// SECONDE VERSION : ON TESTE LE REGISTRE, PLUS SEULEMENT LA FAMILLE. Quatre serifs comparées
// n'avaient produit aucun coup de cœur, ce qui est un résultat en soi : elles partagent toutes le
// même parti pris, un titrage serif littéraire. Or futur•e est un instrument de mesure doublé d'un
// dossier d'expertise, registre où un rapport d'ingénierie ou une étude notariale n'emploient
// justement pas de serif élégante. Le banc met donc en concurrence des PARTIS PRIS, pas des noms.
//
// CHAQUE PROPOSITION REÇOIT SES PROPRES RÉGLAGES, et c'est indispensable à l'honnêteté du test :
// une serif tient en 400 à 44 px, une grotesque y paraîtrait molle sans graisse ni resserrement.
// Comparer toutes les familles avec les réglages de la serif actuelle truquerait la comparaison
// dans l'autre sens.
//
// Toutes les polices proposées sont LIBRES (SIL OFL), donc sans coût de licence.
//
// DEV UNIQUEMENT : 404 en production.
"use client";

import { useState } from "react";
import { notFound } from "next/navigation";

type Proposition = {
  id: string;
  label: string;
  registre: string;
  origine: string;
  argument: string;
  reserve: string;
  /** Famille des titres. */
  title: string;
  titleWeight: number;
  titleTracking: string;
  /** L'accent du hero : italique pour une serif, autre chose pour une sans. */
  accentStyle: "italic" | "normal";
  accentWeight: number;
  /** Famille du texte courant. Identique au titre quand la proposition unifie. */
  body: string;
  /** Famille des rangs et valeurs. Le mono du produit, sauf si la proposition le remplace. */
  meta: string;
  /** Axe de largeur, pour les familles variables. 100 = largeur normale. */
  titleStretch?: number;
};

const SANS = "'Instrument Sans', system-ui, sans-serif";
const MONO = "'JetBrains Mono', monospace";

const PROPOSITIONS: Proposition[] = [
  {
    id: "actuel",
    label: "Instrument Serif",
    registre: "Serif littéraire · la direction actuelle",
    origine: "Rodrigo Fuenzalida, 2022 · SIL OFL",
    argument:
      "Contrastée, élégante en grand corps. C'est la référence contre laquelle les autres se jugent.",
    reserve:
      "Devenue en deux ans la serif par défaut des interfaces sombres à effet verre. C'est le reproche.",
    title: "'Instrument Serif', Georgia, serif",
    titleWeight: 400,
    titleTracking: "-1px",
    accentStyle: "italic",
    accentWeight: 400,
    body: SANS,
    meta: MONO,
  },
  {
    id: "newsreader",
    label: "Newsreader",
    registre: "Serif de presse · la meilleure du premier banc",
    origine: "Production Type · SIL OFL",
    argument:
      "Austère et sérieuse, registre journal. Colle au dossier d'instruction, et n'est presque jamais vue en produit.",
    reserve: "Reste un titrage serif : le parti pris ne change pas, seulement son exécution.",
    title: "'Newsreader', Georgia, serif",
    titleWeight: 400,
    titleTracking: "-0.5px",
    accentStyle: "italic",
    accentWeight: 400,
    body: SANS,
    meta: MONO,
  },
  {
    id: "public",
    label: "Public Sans",
    registre: "Sans institutionnelle · le document officiel",
    origine: "US Web Design System · SIL OFL",
    argument:
      "Dessinée pour l'administration américaine, pour des documents qui engagent. Sobre sans être fade, et c'est exactement le registre d'un état des risques. Titre et texte dans la même famille : la hiérarchie passe par la graisse et la taille.",
    reserve: "Peut paraître froide si la mise en page ne compense pas par le rythme.",
    title: "'Public Sans', system-ui, sans-serif",
    titleWeight: 600,
    titleTracking: "-1.2px",
    accentStyle: "normal",
    accentWeight: 600,
    body: "'Public Sans', system-ui, sans-serif",
    meta: MONO,
  },
  {
    id: "atkinson",
    label: "Atkinson Hyperlegible",
    registre: "Sans hyper-lisible · la lisibilité comme signature",
    origine: "Braille Institute · SIL OFL",
    argument:
      "Dessinée pour les lecteurs malvoyants : chaque lettre est rendue impossible à confondre avec une autre. Formes très caractérisées, donc immédiatement reconnaissable. Cohérente avec un produit qui se donne WCAG AA comme plancher et qui affiche des chiffres qui engagent une décision.",
    reserve: "Deux graisses seulement, et un dessin marqué qui devient un parti pris fort.",
    title: "'Atkinson Hyperlegible', system-ui, sans-serif",
    titleWeight: 700,
    titleTracking: "-1.4px",
    accentStyle: "normal",
    accentWeight: 700,
    body: "'Atkinson Hyperlegible', system-ui, sans-serif",
    meta: MONO,
  },
  {
    id: "archivo",
    label: "Archivo",
    registre: "Grotesque dense · le titre qui tient la page",
    origine: "Omnibus-Type · SIL OFL",
    argument:
      "Grotesque compacte, pensée pour la presse à forte densité. Un titre y devient un bloc, ce qui donne au dossier l'autorité que la serif cherchait à obtenir par l'élégance. Texte laissé en Instrument Sans pour garder une respiration.",
    reserve: "Le contraste titre / texte devient subtil : deux sans se ressemblent forcément un peu.",
    title: "'Archivo', system-ui, sans-serif",
    titleWeight: 600,
    titleTracking: "-1.6px",
    accentStyle: "normal",
    accentWeight: 600,
    body: SANS,
    meta: MONO,
  },
  {
    id: "archivo-partout",
    label: "Archivo partout",
    registre: "Une seule famille · titre et texte",
    origine: "Omnibus-Type · SIL OFL · variable",
    argument:
      "La même grotesque du titre au paragraphe. Le produit descend à deux familles au lieu de trois, la hiérarchie ne tient plus qu'à la graisse et à la taille, et les deux Instrument disparaissent, or le linter les condamne toutes les deux. Archivo est une police de presse : elle sait aussi porter du texte long.",
    reserve:
      "Sans le contraste d'une seconde famille, tout repose sur la discipline des graisses. Une page mal réglée devient plate.",
    title: "'Archivo', system-ui, sans-serif",
    titleWeight: 600,
    titleTracking: "-1.6px",
    accentStyle: "normal",
    accentWeight: 600,
    body: "'Archivo', system-ui, sans-serif",
    meta: MONO,
  },
  {
    id: "archivo-serre",
    label: "Archivo partout, titres resserrés",
    registre: "Une seule famille · la largeur devient la signature",
    origine: "Omnibus-Type · SIL OFL · variable, axe de largeur",
    argument:
      "Même parti pris, en exploitant l'axe de largeur de la police variable : les titres se resserrent à 82 %, le texte reste à largeur normale. C'est ce qui empêche Archivo de rester neutre. Une grotesque condensée en titre est un geste qu'aucune interface générée ne produit, parce qu'il demande de régler un axe à la main.",
    reserve:
      "Le resserrement doit être tenu partout, sinon deux écrans ne se ressembleront plus. C'est une règle à graver, pas un effet.",
    title: "'Archivo', system-ui, sans-serif",
    titleWeight: 600,
    titleTracking: "-1.2px",
    titleStretch: 82,
    accentStyle: "normal",
    accentWeight: 600,
    body: "'Archivo', system-ui, sans-serif",
    meta: MONO,
  },
  {
    id: "martian",
    label: "Martian Mono",
    registre: "Mono en titre · l'instrument assumé",
    origine: "Evil Martians · SIL OFL",
    argument:
      "Le parti pris le plus radical : le titre passe en mono, et futur•e assume d'être un appareil de mesure plutôt qu'un magazine. Aucune interface concurrente ne fait ça, et le mono est déjà dans le produit pour les valeurs.",
    reserve:
      "Un mono en grand corps fatigue vite et rend la prose difficile. Ne tient que si les titres restent courts.",
    title: "'Martian Mono', monospace",
    titleWeight: 500,
    titleTracking: "-1.5px",
    accentStyle: "normal",
    accentWeight: 500,
    body: SANS,
    meta: MONO,
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
  const [actif, setActif] = useState<Proposition>(PROPOSITIONS[0]);
  const [cote, setCote] = useState<Proposition | null>(null);

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: SANS }}>
      {/* Les familles non embarquées dans le produit sont chargées ICI seulement. Toutes libres. */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300..600;1,6..72,300..600&family=Public+Sans:ital,wght@0,300..700;1,300..700&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&family=Archivo:ital,wdth,wght@0,62..125,300..700;1,62..125,300..700&family=Martian+Mono:wght@300..600&display=swap"
      />

      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-10">
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">
          Banc d&apos;essai · dev
        </p>
        <h1 className="text-[26px] mb-2" style={{ fontFamily: actif.title, fontWeight: actif.titleWeight }}>
          Quel registre typographique pour futur•e
        </h1>
        <p className="text-[15px] text-muted leading-[1.7] max-w-[720px] mb-3">
          Six partis pris, pas six polices. Quatre serifs comparées n&apos;avaient donné aucun coup
          de cœur, ce qui est un résultat : elles partagent toutes le même parti pris. Ici, trois
          propositions abandonnent la serif, et une abandonne même l&apos;idée d&apos;un titrage de
          livre.
        </p>
        <p className="text-[13px] text-ghost leading-[1.7] max-w-[720px] mb-8">
          Chaque proposition porte ses propres réglages de graisse et de resserrement. Une serif
          tient en 400 à 44 px, une grotesque y paraîtrait molle : les comparer avec les mêmes
          réglages truquerait le test. Toutes ces familles sont libres, aucune licence à acheter.
        </p>

        <div className="flex flex-wrap gap-2 mb-3">
          {PROPOSITIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setActif(p)}
              className="px-4 py-2.5 rounded-lg text-[14px] border transition-colors"
              style={{
                background: actif.id === p.id ? "var(--bg-elev-3)" : "var(--bg-deep)",
                borderColor: actif.id === p.id ? "var(--border-hi)" : "var(--border-1)",
                color: actif.id === p.id ? "var(--fg-1)" : "var(--fg-3)",
                fontFamily: p.title,
                fontWeight: actif.id === p.id ? p.titleWeight : 400,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-10">
          <span className="text-[13px] text-ghost">Comparer côte à côte avec :</span>
          {PROPOSITIONS.filter((p) => p.id !== actif.id).map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setCote(cote?.id === p.id ? null : p)}
              className="px-3 py-1.5 rounded-lg text-[13px] border transition-colors"
              style={{
                background: cote?.id === p.id ? "var(--bg-elev-3)" : "transparent",
                borderColor: cote?.id === p.id ? "var(--border-hi)" : "var(--border-1)",
                color: cote?.id === p.id ? "var(--fg-1)" : "var(--fg-3)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className={cote ? "grid grid-cols-1 lg:grid-cols-2 gap-10" : ""}>
          <Echantillon p={actif} />
          {cote && <Echantillon p={cote} />}
        </div>
      </div>
    </div>
  );
}

function Echantillon({ p }: { p: Proposition }) {
  const titre = {
    fontFamily: p.title,
    fontWeight: p.titleWeight,
    letterSpacing: p.titleTracking,
    ...(p.titleStretch ? { fontStretch: `${p.titleStretch}%` } : {}),
  };
  return (
    <section>
      <div className="pb-4 mb-8 border-b" style={{ borderColor: "var(--border-1)" }}>
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost">{p.registre}</p>
        <p className="text-[12px] text-ghost mt-1">{p.origine}</p>
        <p className="text-[13px] text-muted leading-[1.6] mt-2">{p.argument}</p>
        <p className="text-[13px] leading-[1.6] mt-2" style={{ color: "var(--yellow-ink)" }}>
          Réserve : {p.reserve}
        </p>
      </div>

      <div style={{ fontFamily: p.body }}>
        {/* 1. Le grand titre de page. */}
        <h2 className="text-[clamp(30px,3.4vw,44px)] leading-[1.08] mb-3" style={titre}>
          Nantes en 2030, 2050, 2100.<br />
          <span
            style={{
              color: "var(--accent-ink)",
              fontStyle: p.accentStyle,
              fontWeight: p.accentWeight,
            }}
          >
            Ce que ça change pour vous.
          </span>
        </h2>
        <p className="text-[17px] leading-[1.72] text-muted mb-12 max-w-[500px]">
          Ce que le changement climatique fait concrètement à votre quotidien ici. Choisissez un
          horizon. Les données s&apos;adaptent quand c&apos;est possible.
        </p>

        {/* 2. Le sommaire des échelles, l'écran qui a lancé la question. */}
        <h3 className="text-[clamp(22px,2.4vw,30px)] leading-[1.18] mb-6" style={titre}>
          Trois échelles, de la commune à vos murs.
        </h3>
        <div className="flex flex-col mb-12">
          {ECHELLES.map((e, i) => (
            <article
              key={e.rang}
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 items-baseline py-5 border-t first:border-t-0"
              style={{ borderColor: i === 0 ? "transparent" : "var(--border-1)" }}
            >
              <span className="text-[13px] text-ghost tabular-nums" style={{ fontFamily: p.meta }}>
                {e.rang}
              </span>
              <div>
                <h4 className="text-[20px] text-label" style={titre}>
                  {e.nom}
                  {/* UN TRACKING NÉGATIF NE S'HÉRITE PAS. Il est calibré pour la taille du titre :
                      hérité par ce grain de 15 px, il refermait les espaces entre les mots, d'autant
                      plus fort que la proposition resserre (jusqu'à -1,6 px). La remise à `normal`
                      est nécessaire, pas cosmétique. */}
                  <span
                    className="text-muted text-[15px]"
                    style={{ fontFamily: p.body, fontWeight: 400, letterSpacing: "normal", fontStretch: "normal" }}
                  >
                    {" "}· {e.grain}
                  </span>
                </h4>
                <p className="text-[13px] text-muted leading-[1.65] mt-2.5">{e.benefit}</p>
              </div>
            </article>
          ))}
        </div>

        {/* 3. Le verdict, là où la famille porte une phrase longue. */}
        <div
          className="rounded-2xl p-6 sm:p-8"
          style={{ background: "var(--bg-elev-2)", border: "1px solid var(--border-2)", borderTop: "2px solid var(--orange)" }}
        >
          <p className="text-[11px] tracking-[0.12em] uppercase mb-3" style={{ fontFamily: p.meta, color: "var(--orange-ink)" }}>
            Ce qui départage
          </p>
          <p className="text-[clamp(20px,2.2vw,26px)] leading-[1.28]" style={titre}>
            Nantes tient bien vos priorités de cadre de vie, à un arbitrage près : les étés y
            deviennent nettement plus chauds, quand vous cherchiez à les éviter.
          </p>
          <p className="text-[14px] text-muted leading-[1.7] mt-4">
            Trente-deux jours au-dessus de 30 °C attendus en 2050, contre dix-neuf aujourd&apos;hui.
            La donnée vient de DRIAS, scénario France +2,7 °C.
          </p>
        </div>

        {/* 4. La prose longue, où une famille de titre montre si elle sait aussi se taire. */}
        <div className="mt-12 max-w-[720px]">
          <h3 className="text-[22px] leading-[1.2] mb-4" style={titre}>
            Ce que la chaleur change vraiment
          </h3>
          <p className="text-[16px] leading-[1.75] text-muted mb-4">
            La chaleur ne se lit pas seulement dans la température maximale d&apos;un après-midi
            d&apos;août. Elle se lit dans le nombre de nuits où le thermomètre ne redescend pas sous
            vingt degrés, dans la durée des épisodes, et dans la capacité d&apos;un bâtiment à
            restituer ce qu&apos;il a absorbé.
          </p>
          <p className="text-[16px] leading-[1.75] text-muted">
            Les projections indiquent une transformation nette d&apos;ici 2050 sur la façade
            atlantique, plus tardive qu&apos;en Méditerranée mais plus rapide en rythme. Ce que cela
            change pour un logement dépend ensuite de son orientation, de son isolation et de son
            environnement immédiat.
          </p>
        </div>
      </div>
    </section>
  );
}
