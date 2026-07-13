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
import type { ConclusionState } from "@/lib/decision/decision-fact";
import { shouldGenerateNarrative, type ConclusionNarrativePlan } from "@/lib/decision/conclusion-plan";
import { validateGeneratedBlocks } from "@/lib/decision/conclusion-validate";
import {
  buildConclusionHash, DECISION_NARRATIVE_MODEL, DECISION_NARRATIVE_PROMPT_VERSION,
} from "@/lib/decision/conclusion-hash";
import { readNarrative, saveNarrative, pruneNarratives } from "@/lib/server/decision-narrative-store";
import { requireCurrentUser } from "@/lib/user-account";
import { ConclusionBlock, planToBlocks } from "@/components/report/ConclusionBlock";

// Défaut sûr : « ne dépense pas » (doctrine AUTO_SYNTHESIS). On livre, on observe les artefacts, on
// allume ensuite. Tant que le flag est absent, le déterministe EST le produit.
const NARRATIVE_ENABLED = process.env.DOSSIER_NARRATIVE === "true";

// Schéma de TRANSPORT, permissif jusqu'à l'élément : un schéma strict ferait échouer l'objet ENTIER
// sur un seul élément malformé, et tuerait la récupération bloc par bloc. Le vrai contrat est dans
// validateGeneratedBlocks (pur, testé), qui valide chaque élément séparément.
const transportSchema = z.object({ blocks: z.array(z.unknown()) });

const SYSTEM_PROMPT = `Vous êtes l'analyste éditorial de futur•e. On vous remet une conclusion DÉJÀ DÉCIDÉE,
découpée en registres. Votre seul travail est de reformuler le texte des registres qu'on vous confie, pour
qu'ils se lisent d'un trait, dans une voix humaine et sobre.

LE VERDICT NE VOUS APPARTIENT PAS. On vous le donne pour que vos phrases s'y articulent. Vous ne le
reformulez pas, vous ne le renvoyez pas, vous ne le contredisez pas.

CE QUE VOUS NE POUVEZ PAS FAIRE, JAMAIS :
- ajouter, retirer ou fusionner un registre. Vous renvoyez exactement les clés qu'on vous confie ;
- faire disparaître une matière à l'intérieur d'un registre. Chaque élément listé dans « matiereObligatoire »
  doit se retrouver TEL QUEL dans votre phrase, au mot près. Deux contraintes non examinées ne deviennent
  pas « une condition importante » ;
- mélanger deux registres. Une condition absolue qui n'a pas pu être vérifiée n'est pas une préférence non
  couverte : la première diminue la valeur du verdict, la seconde réduit seulement la personnalisation ;
- introduire un chiffre, un pourcentage, une année ou un horizon qui ne figure pas déjà dans le texte de
  repli du registre que vous reformulez ;
- recommander quoi que ce soit. Les actions vivent ailleurs dans le rapport. Vous pouvez écrire que des
  points méritent d'être examinés. Vous n'écrivez jamais ce qu'il faut faire ;
- désigner un fait comme le plus important si le plan ne l'a pas désigné.

LE FAIT SAILLANT (champ lead) :
- lead.kind = "single" : vous pouvez le nommer (« à commencer par… », « notamment… ») en reprenant son constat ;
- lead.kind = "tied" : plusieurs points partagent le même poids. Vous écrivez « plusieurs points structurants »,
  et vous n'en couronnez aucun ;
- lead.kind = "none" : vous ne nommez aucun fait, vous vous en tenez au nombre.

LA VOIX :
- vous parlez au lecteur de SON projet. futur•e n'est jamais le sujet d'une phrase, sauf pour dire ce qu'elle
  ne sait pas encore lire ;
- une phrase par registre, deux au plus. Pas de tiret cadratin : une virgule ou deux points ;
- jamais d'antithèse en figure de style (« c'est X, pas Y ») ;
- vous n'annoncez pas ce que vous allez dire, vous le dites.

Vous renvoyez { blocks: [{ key, text }] }, une entrée par registre confié.`;

export async function ConclusionRedigee({
  plan, state, insee, scopeKey,
}: {
  plan: ConclusionNarrativePlan;
  state: ConclusionState;
  insee: string;
  scopeKey: string;
}) {
  const deterministe = <ConclusionBlock state={state} blocks={planToBlocks(plan)} />;

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
    return <ConclusionBlock state={state} blocks={blocks} />;
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
      system: SYSTEM_PROMPT,
      prompt: JSON.stringify({
        verdictEnLectureSeule: plan.blocks.find((b) => b.key === "verdict")?.fallbackText ?? "",
        scope: plan.scope,
        conclusionState: plan.conclusionState,
        posture: plan.posture,
        reservesCount: plan.reservesCount,
        lead: plan.lead,
        registresAConfier: generables.map((b) => ({
          key: b.key,
          texteDeRepli: b.fallbackText,
          matiereObligatoire: b.requiredPhrases,
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
    return <ConclusionBlock state={state} blocks={canonicalBlocks} />;
  } catch (error) {
    console.error("[dossier-narrative] persistance échouée", { insee, scopeKey, error });
    return <ConclusionBlock state={state} blocks={blocks} />;
  }
}
