// HARNAIS DE RENDU du bloc de conclusion. Le parcours réel (compte payant -> commune -> projet ->
// analyse d'adresse) coûte plusieurs minutes et ne montre QU'UN cas à la fois : les variantes de
// `priorityControl` (une action, deux actions, dédoublonnage, étiquette « ensuite ») ne se croisent
// jamais sur un même dossier. Cette page les met côte à côte, sans Supabase et sans appel LLM — les
// plans sont construits par le VRAI `buildConclusionPlan`, jamais écrits à la main.
//
// Elle sert aussi d'atelier pour la phase 2 (le raccourci cliquable vers la carte source).
//
// DEV UNIQUEMENT : 404 en production.
import { notFound } from "next/navigation";
import { buildConclusionPlan, type ConclusionPlanInput } from "@/lib/decision/conclusion-plan";
import type { DecisionFact, MaterialityTier } from "@/lib/decision/decision-fact";
import type { FactComposition } from "@/lib/decision/fact-composition";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";
import { dossierAnchorId } from "@/lib/decision/dossier-anchors";
import { evidenceAnchorId, type EvidenceTargetKey } from "@/lib/decision/evidence-targets";
import { EvidenceArrival } from "@/components/report/EvidenceArrival";
import { EvidenceRow } from "@/components/report/DecisionFactRenderParts";

export const dynamic = "force-dynamic";

// Les libellés d'action sont ceux des VRAIES règles (logement-rules.ts, posture « neutre ») : un
// harnais qui inventerait ses propres libellés ne prouverait rien sur ce que le lecteur lira.
function verification(
  id: string, tier: MaterialityTier, topic: string, statement: string, actionLabel: string,
  // Une preuve porteuse de CLÉ DE PHÉNOMÈNE : sa chip pointe alors vers la carte du module qui la
  // démontre, et non vers le haut du module (cf. evidence-targets.ts).
  preuve?: { observedValue: string; href: string; targetKey: EvidenceTargetKey },
): DecisionFact {
  return {
    id, ruleId: `logement.${id}`, sourceFactIds: [], module: "logement", statement, topic,
    materialityTier: tier, role: "verification",
    evidence: [{ factId: id, module: "logement", label: "Géorisques", grain: "adresse", ...preuve }],
    action: { type: "verifier_sur_place", label: actionLabel },
  };
}

const ARGILES = verification(
  "exposition-bati", "structuring", "le retrait-gonflement des argiles",
  "À cette adresse, le sol est exposé au retrait-gonflement des argiles (aléa moyen ou fort).",
  "Regardez les signes visibles sur le bâti",
);
const CAVITES = verification(
  "cavite", "structuring", "les cavités souterraines proches",
  "À cette adresse, une ou plusieurs cavités souterraines sont recensées à moins de 500 m.",
  "Faites examiner la stabilité du sol avant de vous engager",
);
const INONDATION = verification(
  "inondation", "decision_critical", "l'exposition à l'inondation",
  "L'exposition de la commune à l'inondation ressort élevée. 19 arrêtés de catastrophe naturelle depuis 1982.",
  "Vérifiez le zonage inondation à cette adresse",
  // Une pastille = UNE affirmation, et son lien la démontre (11/08/2026). L'exemple portait
  // « exposition élevée · 19 arrêtés CatNat depuis 1982 » sous une clé `risk.flooding`, dont la
  // carte ne mentionne aucun arrêté : c'est le défaut corrigé dans la règle inondation, et cette
  // page de référence le reproduisait à l'identique.
  { observedValue: "19 arrêtés CatNat depuis 1982", href: "/rapport/quartier", targetKey: "risk.catnat" },
);

const PATRIMOINE = verification(
  "patrimoine", "secondary", "le périmètre patrimonial protégé",
  "À cette adresse, le bien est dans un périmètre patrimonial protégé.",
  "Demandez l'avis des Bâtiments de France",
);

// Le patron réel : deux vérifications dont les actions se mènent ENSEMBLE (argiles + PPR sécheresse).
const ARGILES_PPR: FactComposition = {
  id: "31555:composition-argiles-ppr", kind: "grouped_verification", patternId: "clay_regulation_grouped",
  title: "Un sol argileux et la règle qui l'encadre",
  headlineSubject: "ce qu'impose le sol argileux",
  summary: "Le sol argileux expose le bâti à cette adresse, et un plan de prévention sécheresse y encadre les travaux.",
  items: [
    {
      label: "L'exposition du sol",
      statement: "À cette adresse, le sol est exposé au retrait-gonflement des argiles (aléa moyen ou fort).",
      evidence: [], ruleIds: ["logement.exposition-bati"], factIds: ["f-argiles"],
      action: { type: "verifier_sur_place", label: "Regardez les signes visibles sur le bâti" },
    },
    {
      label: "La règle applicable",
      statement: "À cette adresse, un plan de prévention des risques s'applique : PPR Sécheresse - Territoire 1 - Toulouse.",
      evidence: [], ruleIds: ["logement.zone-reglementee"], factIds: ["f-ppr"],
      action: { type: "obtenir_document", label: "Lisez le règlement de la zone en mairie" },
    },
  ],
  absorbedFactIds: ["f-argiles", "f-ppr"],
  referencedRuleIds: ["logement.exposition-bati", "logement.zone-reglementee"],
  materialityTier: "structuring", displaySection: "verifications",
};

function input(over: Partial<ConclusionPlanInput> = {}): ConclusionPlanInput {
  return {
    scope: "commune+adresse", communeNom: "Toulouse",
    conclusionState: "no_incompatibility_established", posture: "recherche",
    shownFacts: [], shownCompositions: [], uncovered: [], uncoveredPriorities: [],
    establishedIncompatibility: null, coverage: "partial", orientation: "minor_reserves",
    hasFavorable: true, favorableCount: 1, majorReserveCount: 0, reservesShown: 0,
    mismatchTotal: 0, mismatchShown: 0,
    ...over,
  };
}

const CAS: { titre: string; attendu: string; plan: ReturnType<typeof buildConclusionPlan>; cibles: { id: string; titre: string; fact?: DecisionFact }[] | null }[] = [
  {
    titre: "1 · Une seule démarche",
    attendu: "Étiquette « À contrôler en priorité », une ligne : « Vérifiez le zonage inondation à cette adresse ».",
    plan: buildConclusionPlan(input({
      shownFacts: [INONDATION, PATRIMOINE], reservesShown: 2,
    })),
    cibles: [{ id: "inondation", titre: "L'exposition à l'inondation", fact: INONDATION }],
  },
  {
    titre: "2 · Deux démarches — composition argiles + PPR (la cible du lot D)",
    attendu: "Deux lignes, la seconde préfixée « Puis » et en minuscule : « Puis lisez le règlement de la zone en mairie ».",
    plan: buildConclusionPlan(input({
      shownFacts: [PATRIMOINE], shownCompositions: [ARGILES_PPR], reservesShown: 2,
      hasFavorable: true, favorableCount: 2,
    })),
    cibles: [{ id: "31555:composition-argiles-ppr", titre: "Un sol argileux et la règle qui l'encadre (UNE carte, deux lignes)" }],
  },
  {
    titre: "3 · Deux démarches — deux faits À ÉGALITÉ (nouveau)",
    attendu: "Deux lignes issues de DEUX cartes : le bâti, puis la stabilité du sol. Avant ce commit, une seule s'affichait.",
    plan: buildConclusionPlan(input({
      shownFacts: [ARGILES, CAVITES, PATRIMOINE], reservesShown: 3,
    })),
    cibles: [
      { id: "exposition-bati", titre: "Le retrait-gonflement des argiles" },
      { id: "cavite", titre: "Les cavités souterraines proches" },
    ],
  },
  {
    titre: "4 · Même geste prescrit deux fois — dédoublonné",
    attendu: "UNE seule ligne : deux règles voisines prescrivent le même geste, il ne se lit pas deux fois.",
    plan: buildConclusionPlan(input({
      shownFacts: [
        verification("a", "structuring", "le retrait-gonflement des argiles", "constat a", "Vérifier sur place"),
        verification("b", "structuring", "les cavités souterraines proches", "constat b", "vérifier sur place."),
      ],
      reservesShown: 2,
    })),
    cibles: [{ id: "a", titre: "Le retrait-gonflement des argiles" }],
  },
  {
    titre: "5 · Le héros a déjà nommé une réserve -> « À contrôler ensuite »",
    attendu: "L'étiquette bascule sur « À contrôler ensuite » (consumedFrom = reserves), la démarche porte le fait résiduel.",
    plan: buildConclusionPlan(input({
      coverage: "high", hasFavorable: false, favorableCount: 0,
      shownFacts: [INONDATION, ARGILES], reservesShown: 2, majorReserveCount: 2,
    })),
    cibles: [{ id: "exposition-bati", titre: "Le retrait-gonflement des argiles" }],
  },
  {
    titre: "6 · Aucune action à mener -> AUCUN bloc",
    attendu: "Pas d'étiquette bleue du tout : le fait de tête ne porte pas d'action, on n'affiche pas un sujet nu.",
    plan: buildConclusionPlan(input({
      shownFacts: [
        {
          id: "u1", ruleId: "logement.u1", sourceFactIds: [], module: "logement",
          statement: "La donnée n'est pas disponible à cette adresse.", topic: "l'exposition du bâti",
          materialityTier: "structuring", role: "unknown", impact: "scoped",
          evidence: [{ factId: "u1", module: "logement", label: "Géorisques", grain: "adresse" }],
        },
        PATRIMOINE,
      ],
      reservesShown: 2,
    })),
    cibles: null,
  },
  {
    titre: "7 · La carte cible n'est PAS rendue -> pas de lien",
    attendu: "La démarche reste du TEXTE, jamais un lien mort. (Le fait de tête porte ici un id qui n'existe dans AUCUNE autre section : sur une page qui empile sept dossiers, réutiliser celui d'un autre cas ferait pointer le lien vers sa carte.)",
    plan: buildConclusionPlan(input({
      shownFacts: [
        verification("sinistralite-sans-carte", "decision_critical", "les indemnisations recensées",
          "Des indemnisations sont recensées sur la commune.", "Demandez l'historique des sinistres"),
        PATRIMOINE,
      ],
      reservesShown: 2,
    })),
    cibles: null,
  },
];

export default function DevConclusionPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="max-w-[920px] mx-auto px-5 py-12">
      <h1 className="text-2xl font-semibold text-label mb-1">Harnais — bloc de conclusion</h1>
      <p className="text-sm text-muted mb-10">
        Plans construits par <code>buildConclusionPlan</code>, rendus par le composant de production.
        Aucun appel LLM. Dev uniquement.
      </p>

      {/* L'ARRIVÉE sur une preuve, éprouvée ici : charger cette page avec #evidence-risk-flooding doit
          poser le focus et le halo sur la carte ci-dessous, comme dans le module Territoire. */}
      <EvidenceArrival />
      <section className="mb-12">
        <h2 className="text-[15px] font-semibold text-label mb-1">0 · Arrivée depuis une preuve</h2>
        <p className="text-[13px] text-muted mb-3">
          Ouvrir <code>/dev/conclusion#evidence-risk-flooding</code> : la carte ci-dessous doit prendre le
          focus et un liseré bleu bref.
        </p>
        <div id={evidenceAnchorId("risk.flooding")} className="glass rounded-xl p-4 scroll-mt-24">
          <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ghost mb-1">carte du module</p>
          <p className="text-[15px] text-label">Inondation fluviale</p>
        </div>
      </section>

      <div className="flex flex-col gap-12">
        {CAS.map((cas) => (
          <section key={cas.titre}>
            <h2 className="text-[15px] font-semibold text-label mb-1">{cas.titre}</h2>
            <p className="text-[13px] text-muted mb-3">{cas.attendu}</p>
            <ConclusionBlock plan={cas.plan} blocks={planToBlocks(cas.plan)} renderedIds={(cas.cibles ?? []).map((c) => c.id)} />
            {/* Les cartes CIBLES, en réduction : sans elles, aucune ancre n'existe dans le document et
                les démarches resteraient du texte (c'est justement le comportement voulu quand la carte
                n'est pas rendue — le cas 7 le montre en laissant sa cible absente). */}
            {cas.cibles ? (
              <ul className="mt-4 flex flex-col gap-3">
                {cas.cibles.map((c) => (
                  <li
                    key={c.id}
                    id={dossierAnchorId(c.id)}
                    tabIndex={-1}
                    className="scroll-mt-24 focus:outline-none glass rounded-xl p-4"
                  >
                    <p className="font-mono text-[11px] uppercase tracking-[0.1em] text-ghost mb-1">carte cible</p>
                    <p className="text-[15px] text-label">{c.titre}</p>
                    {c.fact ? <EvidenceRow fact={c.fact} color="var(--info)" /> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            <pre className="mt-3 text-[11px] text-ghost overflow-x-auto">
              {JSON.stringify(
                { lead: cas.plan.lead.kind, consumedFrom: cas.plan.verdict.headline.consumedFrom, priorityControl: cas.plan.priorityControl },
                null, 2,
              )}
            </pre>
          </section>
        ))}
      </div>
    </main>
  );
}
