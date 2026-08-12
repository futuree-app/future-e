// La conclusion RÉDIGÉE (slice 2). Server Component async sous <Suspense> : le fallback EST la
// conclusion déterministe, et la substitution est ATOMIQUE (tous les blocs d'un coup, validés).
// Aucun streaming de tokens : un rapport de décision n'a pas à ressembler à un chatbot, et une phrase
// provisoire à l'écran serait une phrase non validée.
//
// Le VERDICT n'est jamais confié au modèle : il part en LECTURE SEULE, pour que les registres
// suivants s'y articulent. Le modèle ne peut ni choisir ce qui apparaît (présence et ordre viennent
// du plan), ni élire un fait saillant (le lead est désigné par le déterministe), ni fabriquer une
// provenance (il ne renvoie que { key, text }), ni faire disparaître une matière (requiredPhrases),
// ni inventer un chiffre. Tout cela est VÉRIFIÉ dans conclusion-validate, pas espéré du prompt.
//
// L'infrastructure narrative n'est JAMAIS nécessaire pour lire le dossier : lecture du cache,
// génération et écriture sont toutes rattrapées et retombent sur le déterministe, en journalisant.
import { headers } from "next/headers";
import { generateObject } from "ai";
import { anthropic, type AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { z } from "zod";
import { shouldGenerateNarrative, type ConclusionNarrativePlan } from "@/lib/decision/conclusion-plan";
import { validateGeneratedBlocks } from "@/lib/decision/conclusion-validate";
import { CONCLUSION_SYSTEM_PROMPT } from "@/lib/decision/conclusion-prompt";
import {
  buildConclusionHash, DECISION_NARRATIVE_MODEL, DECISION_NARRATIVE_PROMPT_VERSION,
} from "@/lib/decision/conclusion-hash";
import { readNarrative, saveNarrative, pruneNarratives } from "@/lib/server/decision-narrative-store";
import { requireCurrentUser } from "@/lib/user-account";
import { ConclusionBlock, planToBlocks, type ConditionEvidence, type NiveauTitre } from "@/components/report/ConclusionBlock";

// Défaut sûr à la livraison : « ne dépense pas ». Tant que le flag est absent, le déterministe EST
// le produit, et ce repli-là est digne (ConclusionBlock rend le plan complet, sans texte généré).
//
// LE FLAG EST POSÉ À `true` EN PRODUCTION depuis le 13/07/2026. Attention à la classe de piège :
// son frère `AUTO_SYNTHESIS` gouvernait les synthèses des modules payants, n'a jamais été posé, et
// a laissé l'interprétation derrière un bouton pendant toute la phase de lancement. Il a été
// supprimé le 30/07/2026. Si ce flag-ci disparaît des variables Vercel, la conclusion rédigée
// disparaît sans bruit : le repli déterministe la rend indiscernable d'une panne.
const NARRATIVE_ENABLED = process.env.DOSSIER_NARRATIVE === "true";

// Schéma de TRANSPORT, permissif jusqu'à l'élément : un schéma strict ferait échouer l'objet ENTIER
// sur un seul élément malformé, et tuerait la récupération bloc par bloc. Le vrai contrat est dans
// validateGeneratedBlocks (pur, testé), qui valide chaque élément séparément.
const transportSchema = z.object({ blocks: z.array(z.unknown()) });


export async function ConclusionRedigee({
  plan, insee, scopeKey, condition = null, renderedIds = [], titre,
}: {
  plan: ConclusionNarrativePlan;
  insee: string;
  scopeKey: string;
  // La preuve de la condition non remplie, quand sa section ne s'affiche pas (cf. ConclusionBlock).
  // Elle traverse ce composant sans jamais entrer dans le plan : le modèle ne la voit pas.
  condition?: ConditionEvidence | null;
  // Les cartes rendues sous le bloc. Traverse aussi sans entrer dans le plan : c'est un fait
  // d'AFFICHAGE, il n'a rien à faire dans la matière hachée ni devant le modèle.
  renderedIds?: string[];
  /** Le niveau et la taille du titre du verdict, propagés jusqu'au bloc. Voir ConclusionBlock. */
  titre?: NiveauTitre;
}) {
  const deterministe = <ConclusionBlock plan={plan} blocks={planToBlocks(plan)} condition={condition} renderedIds={renderedIds} titre={titre} />;

  // 1. Le PREFETCH ne doit jamais déclencher une génération. Next précharge les routes liées par
  //    <Link> avant tout clic : sans cette garde, un simple survol coûterait un appel Sonnet. On teste
  //    la PRÉSENCE du header (le contrat porte sur le header, pas sur une valeur « 1 »). C'est la vraie
  //    protection : un <Link prefetch={false}> oublié ne coûte alors plus rien.
  const h = await headers();
  const isPrefetch = h.has("next-router-prefetch") || h.has("next-router-segment-prefetch");
  if (!NARRATIVE_ENABLED || isPrefetch) return deterministe;

  // 2. Le GATE passe AVANT le hash et AVANT la base : un plan qui ne justifie aucune rédaction ne
  //    requête pas Supabase, et ne peut pas ressusciter une narration mise en cache à une époque où le
  //    gate était positif.
  if (!shouldGenerateNarrative(plan)) return deterministe;

  const { supabase, user } = await requireCurrentUser();
  const inputHash = buildConclusionHash(plan);

  // 3. Artefact existant pour cette identité EXACTE ? Le JSON est validé contre le contrat courant
  //    (dans le store) : un artefact périmé est ignoré, jamais affiché. Une base indisponible ne doit
  //    pas coûter la conclusion.
  let cached = null;
  try {
    cached = await readNarrative(supabase, user.id, insee, scopeKey, inputHash);
  } catch (error) {
    console.error("[dossier-narrative] lecture artefact échouée", { insee, scopeKey, error });
  }
  if (cached) {
    const { blocks } = validateGeneratedBlocks(plan, cached);
    return <ConclusionBlock plan={plan} blocks={blocks} condition={condition} renderedIds={renderedIds} titre={titre} />;
  }

  // 4. Génération. Le verdict n'est pas dans les registres confiés : il part en contexte seul.
  const generables = plan.blocks.filter((b) => b.generable);
  let raw: unknown[];
  try {
    const { object } = await generateObject({
      model: anthropic(DECISION_NARRATIVE_MODEL),
      providerOptions: {
        anthropic: { effort: "medium", thinking: { type: "disabled" } } satisfies AnthropicProviderOptions,
      },
      temperature: 0.3,
      schema: transportSchema,
      system: CONCLUSION_SYSTEM_PROMPT,
      prompt: JSON.stringify({
        verdictEnLectureSeule: plan.blocks.find((b) => b.key === "verdict")?.fallbackText ?? "",
        scope: plan.scope,
        conclusionState: plan.conclusionState,
        posture: plan.posture,
        reservesCount: plan.reservesCount,
        // Le lead est envoyé PROJETÉ sur ce que le modèle a le droit d'écrire : les sujets. Lui
        // transmettre le `statement` entier, comme avant le lot D, c'était lui tendre la phrase de la
        // carte située juste dessous en lui demandant de ne pas la recopier.
        lead: plan.lead.kind === "single" ? { kind: "single", sujets: [plan.lead.subject] }
          : plan.lead.kind === "tied" ? { kind: "tied", sujets: plan.lead.facts.map((f) => f.subject) }
          : { kind: "none", sujets: [] },
        registresAConfier: generables.map((b) => ({
          key: b.key,
          texteDeRepli: b.fallbackText,
          matiereObligatoire: b.requiredPhrases,
          nombresAutorises: b.allowedNumbers, // les seuls nombres VRAIS de ce registre
          maxChars: b.maxChars,
        })),
      }),
    });
    raw = object.blocks;
  } catch (error) {
    console.error("[dossier-narrative] génération échouée", { insee, scopeKey, error });
    return deterministe;
  }

  const { blocks, rejected } = validateGeneratedBlocks(plan, raw);
  if (rejected.length > 0) console.warn("[dossier-narrative] blocs rejetés", { insee, scopeKey, rejected });

  // Aucun bloc généré : rien à figer. On rend le déterministe sans polluer la base d'un échec.
  if (!blocks.some((b) => b.generated)) return deterministe;

  // 5. ARTEFACT DURABLE. On stocke TOUS les blocs générables rendus (y compris ceux retombés en repli) :
  //    la base contient alors exactement ce qui a été affiché. On rend la ligne CANONIQUE retournée par
  //    le store : si une requête concurrente a gagné la course, c'est SON texte que le lecteur voit, et
  //    donc celui qu'il retrouvera. L'échec d'écriture ne coûte jamais la conclusion.
  const generableKeys = new Set<string>(generables.map((b) => b.key));
  const toStore = blocks
    .filter((b) => generableKeys.has(b.key))
    .map((b) => ({ key: b.key as string, text: b.text }));
  try {
    const canonical = await saveNarrative(
      supabase, user.id, insee, scopeKey, inputHash, toStore,
      DECISION_NARRATIVE_PROMPT_VERSION, DECISION_NARRATIVE_MODEL,
    );
    await pruneNarratives(supabase, user.id, insee, scopeKey, 3);
    const { blocks: canonicalBlocks } = validateGeneratedBlocks(plan, canonical);
    return <ConclusionBlock plan={plan} blocks={canonicalBlocks} condition={condition} renderedIds={renderedIds} titre={titre} />;
  } catch (error) {
    console.error("[dossier-narrative] persistance échouée", { insee, scopeKey, error });
    return <ConclusionBlock plan={plan} blocks={blocks} condition={condition} renderedIds={renderedIds} titre={titre} />;
  }
}
