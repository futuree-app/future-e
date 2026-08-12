// Rendu du verdict, en STRATES. La hiérarchie que le moteur calcule (gravité décroissante, fait
// saillant désigné) était jusqu'ici jetée au rendu : quatre <p> identiques, donc quatre phrases de
// même poids, donc aucune. Le lead, que le déterministe désigne, n'était même pas affiché.
//
// Chaque strate porte désormais une ÉTIQUETTE qui dit sa nature : un fait saillant qui surgit sans
// être nommé « arrive de nulle part » ; nommé, il devient une information.
//
// Structure DOM IDENTIQUE que les blocs soient déterministes ou générés : la substitution sous
// Suspense ne doit pas faire sauter la page. Aucun LLM ici.
import type React from "react";
import type { ConclusionNarrativePlan, VerdictTone } from "@/lib/decision/conclusion-plan";
import type { RenderedBlock } from "@/lib/decision/conclusion-validate";
import type { EvidenceRef } from "@/lib/decision/decision-fact";
import { Chip } from "@/components/report/DecisionFactRenderParts";
import { PriorityControlActions } from "@/components/report/PriorityControlActions";
import { bindOrphans } from "@/lib/typography";

// CE QUE LA CONDITION NON REMPLIE APPORTE EN PLUS DU TEXTE : sa preuve, et la limite du constat.
// Quand une seule condition est en cause, le bloc de tête la porte ENTIÈREMENT et la section
// « Vos conditions non négociables » ne s'affiche pas : elle recopiait le constat au mot près, à
// trois centimètres d'écart. Le blocage est la réponse, il se lit une fois.
export type ConditionEvidence = { evidence: EvidenceRef[]; limitation?: string };

// LES QUATRE TONS DOIVENT ÊTRE QUATRE COULEURS. `caution` et `positive` rendaient EXACTEMENT la même
// (--orange et --accent valent tous deux #E8823A) : deux états opposés du verdict, « à nuancer » et
// « bonne correspondance », portaient le même signal. `positive` prend le vert de la palette, qui n'a
// pas d'autre emploi et que personne ne lit comme une mise en garde.
const TONE_COLOR: Record<VerdictTone, string> = {
  critical: "var(--red)",
  caution: "var(--orange)",
  neutral: "var(--ghost)",
  positive: "var(--green)",
};

const SCOPE_LABEL: Record<ConclusionNarrativePlan["scope"], string> = {
  commune: "commune",
  "commune+adresse": "commune + adresse",
};

// Les blocs déterministes, dans la forme EXACTE que produira la validation de la sortie IA.
export function planToBlocks(plan: ConclusionNarrativePlan): RenderedBlock[] {
  return plan.blocks.map((b) => ({
    key: b.key, text: b.fallbackText, sourceIds: b.sourceIds, generated: false,
  }));
}

function Eyebrow({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.14em] uppercase mb-1.5" style={{ color }}>
      {children}
    </p>
  );
}

/** LE NIVEAU DE TITRE EST UNE PROP, ET NON UNE CONSTANTE (12/08/2026).
 *  Ce bloc est rendu par la page `/rapport` (où il est LE titre de l'écran), par les quatre
 *  chemins de `ConclusionRedigee`, et par la galerie `/dev/conclusion`, qui en affiche plusieurs.
 *  Le figer en `h1` ferait apparaître plusieurs titres de page dans la galerie. Le défaut reste
 *  donc le comportement actuel, et seule la page qui SAIT qu'il est son titre le promeut.
 *
 *  Promouvoir la seule BALISE ne suffisait pas : en `--text-section` (19 à 23 px), la réponse
 *  restait plus petite que les titres de section situés plus bas (`--text-title`, 23 à 31 px). La
 *  taille voyage donc avec le niveau. */
export type NiveauTitre = { niveau: "h1" | "h2"; classe: string };

const TITRE_DEFAUT: NiveauTitre = {
  niveau: "h2",
  classe: "text-[length:var(--text-section)] font-[var(--weight-section)] tracking-[-0.4px]",
};

export function ConclusionBlock({
  plan, blocks, condition: conditionEvidence = null, renderedIds = [], titre = TITRE_DEFAUT,
}: {
  plan: ConclusionNarrativePlan;
  blocks: RenderedBlock[];
  condition?: ConditionEvidence | null;
  titre?: NiveauTitre;
  // Les cartes rendues sous ce bloc, pour n'activer un renvoi que vers ce qui existe (cf.
  // PriorityControlActions). Vide par défaut : sans elles, les démarches restent du texte.
  renderedIds?: string[];
}) {
  const color = TONE_COLOR[plan.verdictTone];
  const byKey = new Map(blocks.map((b) => [b.key, b]));
  // Le bloc `verdict` porte le DÉTAIL ; le headline vit sur le plan (jamais confié au modèle).
  const detail = byKey.get("verdict")?.text ?? plan.verdict.detail;
  const condition = byKey.get("unexamined_hard_constraints");
  const nonCouvert = byKey.get("uncovered_priorities")?.text;

  // LA PROCHAINE DÉMARCHE, déterministe. L'étiquette dit la NATURE (des CONTRÔLES à mener, pas un second
  // point défavorable) : « Ce qui demande votre attention » rejouait un jugement et, sous un verdict
  // d'arbitrage, annexait ces contrôles au registre défavorable. Elle porte aussi l'ORDRE — « À contrôler
  // ensuite » quand le héros a DÉJÀ nommé le principal contrôle (il a puisé dans les réserves),
  // « en priorité » sinon. Le CORPS reprend l'action mot pour mot depuis la carte (une seule source de
  // vérité) : une ou deux lignes verbatim, « Puis » ajouté par le renderer, jamais de recomposition.
  const control = plan.priorityControl;
  const suiteDuHeros = plan.verdict.headline.consumedFrom === "reserves";
  const controlLabel = suiteDuHeros ? "À contrôler ensuite" : "À contrôler en priorité";
  const showControl = control != null && control.actions.length > 0 && plan.verdictTone !== "critical";

  return (
    // Le bloc ne se distingue plus par un filet à gauche sur le MÊME verre que les cartes du dessous :
    // il porte le verre surélevé du système (cf. .card-verdict), et son halo suit le ton du verdict.
    // La mesure de 168 px, calibrée à l'écran, ne bouge pas.
    <div
      className="card-verdict rounded-2xl p-6 sm:p-8 mb-5"
      style={{ "--tone": color, minHeight: "168px" } as React.CSSProperties}
    >
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <Eyebrow color={color}>{plan.verdictLabel}</Eyebrow>
        <span className="font-mono text-[11px] tracking-[0.08em] uppercase text-ghost shrink-0">
          {SCOPE_LABEL[plan.scope]}
        </span>
      </div>

      {/* LE HÉROS, et le TITRE de la section : l'ancien H2 de cadrage a disparu, un <p> aurait laissé
          le bloc sans titre accessible. Déterministe, mot pour mot, jamais généré. Le `max-width` est
          l'usage prévu de l'exception de la doctrine de largeur (un titre de hero mesuré en espace
          ouvert) : une phrase de héros qui traverse toute la carte perd son impact. Il ne s'applique
          JAMAIS aux paragraphes. */}
      {(() => {
        const T = titre.niveau;
        return (
          <T
            className={`${titre.classe} leading-[1.2] text-label max-w-[540px]`}
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {bindOrphans(plan.verdict.headline.text)}
          </T>
        );
      })()}

      {/* Le détail : construit AVEC le headline, jamais une troncature de lui. */}
      {detail ? (
        <p className="mt-3.5 text-[17px] leading-[1.6] text-muted">{detail}</p>
      ) : null}

      {/* Une contrainte dure non testée réduit la PORTÉE du verdict : elle se lit juste sous lui,
          AVANT le poids (registre 2 de conclusion-plan.ts). C'est une condition posée par le lecteur,
          non encore examinée : la teinte est celle du non-savoir (violet), jamais celle d'une alerte
          établie (orange), qui affirmerait au-delà de la preuve. La gravité vient de la position. */}
      {condition ? (
        <div
          className="mt-5 rounded-xl px-4 py-3 border"
          style={{
            borderColor: "color-mix(in srgb, var(--violet) 30%, transparent)",
            background: "color-mix(in srgb, var(--violet) 6%, transparent)",
          }}
        >
          <Eyebrow color="var(--violet)">
            {condition.sourceIds.length > 1 ? "Conditions à vérifier" : "Condition à vérifier"}
          </Eyebrow>
          <p className="text-[15px] leading-[1.55] text-muted">{condition.text}</p>
        </div>
      ) : null}

      {/* LE REGISTRE BLEU DES CONTRÔLES. Distinct du verdict (orange) : ce sont des faits ÉTABLIS dont les
          conséquences se contrôlent, pas des écarts au projet. La teinte info + l'étiquette de nature
          suffisent à séparer les deux registres — pas de second halo. Une ou deux DÉMARCHES concrètes,
          reprises mot pour mot de la carte ; « Puis » relie la seconde. Plus d'air avant, pour que ça se
          lise comme la suite à mener, jamais comme une seconde conclusion.
          `space-y-1` : sans lui, deux démarches à l'interligne du texte courant se lisent comme UNE
          phrase qui passe à la ligne (vu à l'écran sur le cas argiles + PPR). Quatre pixels suffisent à
          en faire deux gestes, sans les détacher au point de rompre le groupe. */}
      {showControl ? (
        <div className="mt-7 space-y-1">
          <Eyebrow color="var(--info)">{controlLabel}</Eyebrow>
          <PriorityControlActions actions={control!.actions} renderedIds={renderedIds} />
        </div>
      ) : null}

      {/* La preuve de la condition non remplie, quand la section correspondante ne s'affiche pas.
          Même idiome que les cartes : la limite d'abord, la preuve chiffrée ensuite. */}
      {conditionEvidence ? (
        <div className="mt-4">
          {conditionEvidence.limitation ? (
            <p className="text-ghost text-[13px] leading-[1.5] mb-2">{conditionEvidence.limitation}</p>
          ) : null}
          {conditionEvidence.evidence.length > 0 ? (
            <div className="flex items-center gap-2 flex-wrap">
              {conditionEvidence.evidence.map((e, i) => (
                <Chip
                  key={i}
                  label={e.href && e.observedValue ? "Preuve" : e.label}
                  value={e.observedValue}
                  href={e.href}
                  color={color}
                />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Une priorité non couverte réduit la personnalisation, jamais la validité du verdict. */}
      {nonCouvert ? (
        <p className="mt-4 text-[13px] leading-[1.5] text-ghost">{nonCouvert}</p>
      ) : null}
    </div>
  );
}
