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
  plan, blocks,
}: {
  plan: ConclusionNarrativePlan;
  blocks: RenderedBlock[];
}) {
  const color = TONE_COLOR[plan.verdictTone];
  const byKey = new Map(blocks.map((b) => [b.key, b]));
  const verdict = byKey.get("verdict")?.text ?? "";
  const poids = byKey.get("reserves_found")?.text;
  const condition = byKey.get("unexamined_hard_constraints");
  const nonCouvert = byKey.get("uncovered_priorities")?.text;

  // Le fait saillant n'est pas affiché en cas d'incompatibilité : le blocage EST la réponse, en haut.
  //
  // En `tied`, l'étiquette ne parle PAS d'égalité ni de poids : le lead est une mécanique qui empêche
  // le moteur de couronner un fait au hasard, et « des poids comparables » exposait cette tuyauterie
  // au lecteur, qui n'en fait rien. En `single`, en revanche, dire qu'un point pèse plus lui dit par où
  // commencer : c'est une information, pas un aveu de méthode.
  const poidsLabel =
    plan.lead.kind === "single" ? "Ce qui pèse le plus"
    : plan.lead.kind === "tied" ? "Ce qui demande votre attention"
    : null;
  const showPoids = poids != null && poidsLabel != null && plan.verdictTone !== "critical";

  return (
    <div
      className="glass rounded-2xl p-7 mb-3.5"
      style={{ borderLeft: `2px solid ${color}`, minHeight: "132px" }}
    >
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <Eyebrow color={color}>{plan.verdictLabel}</Eyebrow>
        <span className="font-mono text-[10px] tracking-[0.08em] uppercase text-ghost shrink-0">
          {SCOPE_LABEL[plan.scope]}
        </span>
      </div>

      {/* LA RÉPONSE. Déterministe, mot pour mot : jamais générée. */}
      <p className="text-[21px] leading-[1.45] text-label">{verdict}</p>

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

      {/* Une priorité non couverte réduit la personnalisation, jamais la validité du verdict. */}
      {nonCouvert ? (
        <p className="mt-4 text-[12.5px] leading-[1.5] text-ghost">{nonCouvert}</p>
      ) : null}
    </div>
  );
}
