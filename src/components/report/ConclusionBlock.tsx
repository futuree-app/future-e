// Rendu du verdict, en STRATES. La hiérarchie que le moteur calcule (gravité décroissante, fait
// saillant désigné) était jusqu'ici jetée au rendu : quatre <p> identiques, donc quatre phrases de
// même poids, donc aucune. Le lead, que le déterministe désigne, n'était même pas affiché.
//
// Chaque strate porte désormais une ÉTIQUETTE qui dit sa nature : un fait saillant qui surgit sans
// être nommé « arrive de nulle part » ; nommé, il devient une information.
//
// Structure DOM IDENTIQUE que les blocs soient déterministes ou générés : la substitution sous
// Suspense ne doit pas faire sauter la page. Aucun LLM ici.
import type { ConclusionNarrativePlan, VerdictTone } from "@/lib/decision/conclusion-plan";
import type { RenderedBlock } from "@/lib/decision/conclusion-validate";
import type { EvidenceRef } from "@/lib/decision/decision-fact";
import { Chip } from "@/components/report/DecisionFactRenderParts";
import { bindOrphans } from "@/lib/typography";

// CE QUE LA CONDITION NON REMPLIE APPORTE EN PLUS DU TEXTE : sa preuve, et la limite du constat.
// Quand une seule condition est en cause, le bloc de tête la porte ENTIÈREMENT et la section
// « Vos conditions non négociables » ne s'affiche pas : elle recopiait le constat au mot près, à
// trois centimètres d'écart. Le blocage est la réponse, il se lit une fois.
export type ConditionEvidence = { evidence: EvidenceRef[]; limitation?: string };

const TONE_COLOR: Record<VerdictTone, string> = {
  critical: "var(--red)",
  caution: "var(--orange)",
  neutral: "var(--ghost)",
  positive: "var(--accent)",
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
    <p className="font-mono text-[10px] tracking-[0.14em] uppercase mb-1.5" style={{ color }}>
      {children}
    </p>
  );
}

export function ConclusionBlock({
  plan, blocks, condition: conditionEvidence = null,
}: {
  plan: ConclusionNarrativePlan;
  blocks: RenderedBlock[];
  condition?: ConditionEvidence | null;
}) {
  const color = TONE_COLOR[plan.verdictTone];
  const byKey = new Map(blocks.map((b) => [b.key, b]));
  // Le bloc `verdict` porte le DÉTAIL ; le headline vit sur le plan (jamais confié au modèle).
  const detail = byKey.get("verdict")?.text ?? plan.verdict.detail;
  const poids = byKey.get("reserves_found")?.text;
  const condition = byKey.get("unexamined_hard_constraints");
  const nonCouvert = byKey.get("uncovered_priorities")?.text;

  // Le fait saillant n'est pas affiché en cas d'incompatibilité : le blocage EST la réponse, en haut.
  //
  // UNE SEULE ÉTIQUETTE. Elle distinguait `single` (« Ce qui pèse le plus ») de `tied` (« Ce qui
  // demande votre attention ») parce que la phrase, elle, ne disait pas par où commencer. Depuis le
  // lot D elle le dit (« À regarder d'abord / ensuite »), et une étiquette qui reprendrait cet ordre
  // le répéterait deux fois en deux lignes. Elle dit donc la NATURE du bloc, l'ordre reste au texte.
  // Le lead reste une mécanique interne : l'égalité de poids ne s'affiche pas, elle se lit dans la
  // liste.
  const poidsLabel = plan.lead.kind === "none" ? null : "Ce qui demande votre attention";
  const showPoids = poids != null && poidsLabel != null && plan.verdictTone !== "critical";

  return (
    <div
      className="glass rounded-2xl p-7 mb-3.5"
      style={{ borderLeft: `2px solid ${color}`, minHeight: "168px" }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <Eyebrow color={color}>{plan.verdictLabel}</Eyebrow>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ghost shrink-0">
          {SCOPE_LABEL[plan.scope]}
        </span>
      </div>

      {/* LE HÉROS, et le TITRE de la section : l'ancien H2 de cadrage a disparu, un <p> aurait laissé
          le bloc sans titre accessible. Déterministe, mot pour mot, jamais généré. Le `max-width` est
          l'usage prévu de l'exception de la doctrine de largeur (un titre de hero mesuré en espace
          ouvert) : une phrase de héros qui traverse toute la carte perd son impact. Il ne s'applique
          JAMAIS aux paragraphes. */}
      <h2
        className="font-normal text-[clamp(24px,2.6vw,32px)] leading-[1.2] tracking-[-0.4px] text-label max-w-[540px]"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {bindOrphans(plan.verdict.headline.text)}
      </h2>

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

      {showPoids ? (
        <div className="mt-5">
          <Eyebrow color="var(--accent)">{poidsLabel}</Eyebrow>
          <p className="text-[17px] leading-[1.55] text-label">{poids}</p>
        </div>
      ) : null}

      {/* La preuve de la condition non remplie, quand la section correspondante ne s'affiche pas.
          Même idiome que les cartes : la limite d'abord, la preuve chiffrée ensuite. */}
      {conditionEvidence ? (
        <div className="mt-4">
          {conditionEvidence.limitation ? (
            <p className="text-ghost text-[12.5px] leading-[1.5] mb-2">{conditionEvidence.limitation}</p>
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
        <p className="mt-4 text-[12.5px] leading-[1.5] text-ghost">{nonCouvert}</p>
      ) : null}
    </div>
  );
}
