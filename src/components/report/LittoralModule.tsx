import type { LittoralSummary } from "@/lib/littoral";

const FACADE_LABEL: Record<LittoralSummary["facade"], string> = {
  manche: "façade Manche",
  atlantique: "façade atlantique",
  bretagne: "littoral breton",
  mediterranee: "façade méditerranéenne",
  outre_mer: "littoral ultramarin",
};

function formatDateFr(iso: string | null): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return null;
  const mois = [
    "janvier", "février", "mars", "avril", "mai", "juin",
    "juillet", "août", "septembre", "octobre", "novembre", "décembre",
  ][Number(m) - 1];
  return mois ? `${Number(d)} ${mois} ${y}` : null;
}

// Bloc « Littoral » du rapport : affiché uniquement pour les communes inscrites
// au titre du recul du trait de côte. Statut officiel + contextualisation assurance
// (texte fixe sourcé) + projection. Ton lucide, non anxiogène. Aucun score.
export default function LittoralModule({
  summary,
  communeName,
}: {
  summary: LittoralSummary;
  communeName: string;
}) {
  const { facade, traitDeCote } = summary;
  const decretDate = formatDateFr(traitDeCote.decret?.debut ?? null);

  return (
    <div className="rounded-2xl border border-info/[0.18] bg-info/[0.04] p-6">
      <div className="flex items-center gap-2.5 font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-info shrink-0" />
        Littoral · {FACADE_LABEL[facade]}
      </div>

      <h3
        className="font-normal text-[clamp(20px,2vw,26px)] leading-[1.2] tracking-[-0.3px] text-label mb-3"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {communeName} fait partie des communes engagées face au recul du trait de côte.
      </h3>

      <p className="text-[15px] leading-[1.7] text-muted mb-4">
        {communeName} figure sur la liste nationale des communes dont la politique
        d&apos;urbanisme doit s&apos;adapter au recul du trait de côte
        {decretDate ? `, au titre de la loi Climat et Résilience (décret en vigueur depuis le ${decretDate})` : ", au titre de la loi Climat et Résilience"}.
        Concrètement, la commune doit cartographier l&apos;exposition de son territoire
        à l&apos;érosion et en tenir compte dans ses documents d&apos;urbanisme.
      </p>

      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 mb-4">
        <div className="font-mono text-[10px] tracking-[0.12em] uppercase text-ghost mb-2">
          Ce que beaucoup ignorent
        </div>
        <p className="text-[14px] leading-[1.65] text-muted">
          Le recul du trait de côte n&apos;est pas couvert par le régime
          catastrophes naturelles : il est considéré comme prévisible, donc exclu de
          l&apos;indemnisation. La submersion marine, elle, reste couverte, mais le coût
          des dommages pourrait être multiplié par deux à dix d&apos;ici 2050. Un projet
          de vie sur le littoral se pense donc avec cette assurabilité en tête.
        </p>
      </div>

      <p className="text-[14px] leading-[1.65] text-muted mb-5">
        Vivre près de la mer reste un projet de vie pleinement légitime. futur•e
        l&apos;éclaire simplement avec lucidité : sur ce littoral, l&apos;horizon 2050
        et 2100 fait partie de la décision, au même titre que le prix ou le cadre de vie.
      </p>

      <div className="flex flex-wrap gap-2">
        {[
          "Cerema · Géolittoral",
          "Loi Climat et Résilience · data.gouv.fr",
          "CCR · régime CatNat",
        ].map((s) => (
          <span
            key={s}
            className="font-mono text-[9px] tracking-[0.1em] uppercase text-ghost border border-white/[0.08] rounded px-2 py-1"
          >
            {s}
          </span>
        ))}
      </div>
    </div>
  );
}
