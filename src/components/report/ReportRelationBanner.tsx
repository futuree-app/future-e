import Link from "next/link";

type Relation =
  | "current_residence"
  | "considering_living"
  | "information_only"
  | "unknown";

// La phrase porte son enjeu : elle dit à qui le rapport s'adresse (c'est ce qui
// règle la posture de la synthèse), sinon « Vous vivez à Lorient » arrive de
// nulle part. Le nom de la commune ancre la phrase.
function label(relation: Relation, commune: string | null): string {
  const lieu = commune ?? "cette commune";
  switch (relation) {
    case "current_residence":
      return `Cette lecture s'adresse à quelqu'un qui vit à ${lieu}.`;
    case "considering_living":
      return `Cette lecture s'adresse à quelqu'un qui envisage de s'installer à ${lieu}.`;
    default:
      return `Cette lecture s'adresse à quelqu'un qui découvre ${lieu}.`;
  }
}

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CADRAGE SE DIT ICI, IL SE MODIFIE AILLEURS (12/08/2026).
//
// Ce bandeau portait un sélecteur qui écrivait `report_context.relation` : un rapport payé
// recommençait son onboarding en bas de page, et la même question se posait dans trois vocabulaires
// sur trois surfaces. L'édition vit désormais au seul endroit qui porte le projet, `/rapport#projet`,
// et ce lien y mène directement.
//
// Le composant n'est plus un composant client : sans état, sans `fetch` et sans routeur, il n'a plus
// rien à faire dans le navigateur. Deux événements PostHog disparaissent avec le sélecteur :
// `report_relation_corrected` et `report_relation_selector_opened`.
// ════════════════════════════════════════════════════════════════════════════════════════════

export function ReportRelationBanner({
  relation,
  communeName,
}: {
  relation: Relation;
  communeName: string | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted">
      <span className="inline-flex items-center gap-2">
        <span className="w-1 h-1 rounded-full bg-info/70 shrink-0" />
        {label(relation, communeName)}
      </span>
      <Link
        href="/rapport#projet"
        className="underline underline-offset-2 text-muted hover:text-label transition-colors"
      >
        Modifier le projet
      </Link>
    </div>
  );
}
