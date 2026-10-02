import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPostHogClient } from "@/lib/posthog-server";
import { getCommuneEntry, buildTerritorySignals } from "@/lib/comparateur-vie";
import { getClimatDataCommune } from "@/lib/drias-json";
import { getGeorisquesSummary } from "@/lib/georisques";
import {
  SYSTEM_PROMPT,
  construirePromptUtilisateur,
  contexteDepuisCorps,
  finaliserReponseQna,
  type SourcesFaits,
} from "@/lib/accueil/qna";

// Les faits d'une question viennent des sources canoniques, lues ICI à partir de l'INSEE. Le navigateur
// ne transmet que la commune, l'INSEE et la question (FUT-37).
const SOURCES_FAITS: SourcesFaits = {
  climat: async (insee) => (await getClimatDataCommune(insee, { accueil: true }))?.commune.s ?? null,
  georisques: (insee) => getGeorisquesSummary(insee),
};

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-6";
const MODEL_CANDIDATES = [
  process.env.ANTHROPIC_MODEL,
  "claude-sonnet-4-6",
  "claude-sonnet-4-5-20250929",
  "claude-opus-4-7",
  "claude-opus-4-6",
  "claude-opus-4-5-20251101",
  "claude-haiku-4-5-20251001",
  "claude-opus-4-1-20250805",
  DEFAULT_MODEL,
].filter(Boolean) as string[];

// output_config.effort n'est supporté que sur Sonnet 4.6 et Opus 4.5+ : il
// plante (400) sur Sonnet 4.5, Haiku 4.5 et Opus 4.1. On ne le pose donc que
// sur les modèles compatibles ; le thinking désactivé, lui, passe partout.
function supportsEffort(model: string): boolean {
  return (
    model.includes("sonnet-4-6") ||
    model.includes("opus-4-5") ||
    model.includes("opus-4-6") ||
    model.includes("opus-4-7") ||
    model.includes("opus-4-8")
  );
}

// Le prompt système vit dans src/lib/accueil/qna.ts : le contrôle des nombres en dépend (les chiffres
// nationaux sourcés qu'il cite sont les seuls que le modèle peut écrire hors des faits de la commune).

const QUESTION_CATEGORY_MAP: Record<string, string> = {
  canicule: "chaleur",
  chaleur: "chaleur",
  incendie: "chaleur",
  secheresse: "eau",
  eau: "eau",
  inondation: "inondation",
  submersion: "inondation",
  littoral: "inondation",
  logement: "logement",
  retrait_gonflement: "logement",
  energie: "energie",
  sante: "sante",
  assurance: "assurance",
  mobilite: "demenagement",
  biodiversite: "autre",
};

function resolveQuestionCategory(tensionId: string): string {
  return QUESTION_CATEGORY_MAP[tensionId?.toLowerCase?.()] ?? "autre";
}

// FUT-37 : la réponse affichée n'est JAMAIS le texte brut du modèle. Elle passe le contrôle déterministe
// de src/lib/accueil/qna.ts ; à la moindre violation, ou si le modèle est indisponible, c'est le repli
// déterministe construit sur les seuls faits de la commune demandée. Aucune seconde tentative du modèle.
//
// Le corps ne transporte plus de « réponse éditoriale de base » : `tension_answers` (Supabase) servait des
// textes écrits pour La Rochelle, Bressuire ou la Charente à toutes les communes. La table reste en base,
// plus rien ne la lit.
export async function POST(request: Request) {
  const body = await request.json();
  const { categories, tension, questionType = "preset", freeTextQuestion = null, inseeCode = null } = body ?? {};

  // Les faits sont reconstruits côté serveur depuis l'INSEE ; un champ `faits` du corps est ignoré.
  const contexte = await contexteDepuisCorps(body, SOURCES_FAITS);
  if (!contexte) {
    return NextResponse.json(
      { error: "Missing commune or tension payload." },
      { status: 400 },
    );
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    const repli = finaliserReponseQna(null, contexte);
    return NextResponse.json({ ...repli, violations: ["modele:indisponible"] });
  }

  // Signaux territoire (index A) pour ancrer les questions hors climat/risque
  // (calme, transports, croissance, vie locale…) sans que Claude invente.
  // Absent (arrondissements Paris/Lyon/Marseille, ou échec) = on n'injecte rien.
  let territorySignals: Record<string, unknown> | null = null;
  if (inseeCode) {
    try {
      const entry = await getCommuneEntry(String(inseeCode));
      if (entry) territorySignals = buildTerritorySignals(entry);
    } catch {
      territorySignals = null;
    }
  }

  const userPrompt = construirePromptUtilisateur({
    contexte,
    categories: Array.isArray(categories) ? categories.filter((c: unknown) => typeof c === "string") : [],
    questionType: questionType === "free" ? "free" : "preset",
    freeTextQuestion: typeof freeTextQuestion === "string" ? freeTextQuestion : null,
    territorySignals,
  });

  let lastErrorText = "No Anthropic model could be used.";

  const traceId = randomUUID();

  for (const model of MODEL_CANDIDATES) {
    const t0 = Date.now();
    const anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model,
        max_tokens: 320,
        temperature: 0.35,
        // Sonnet 4.6 tourne en effort "high" par défaut : c'est ce qui rend la
        // première réponse de la home (l'effet « wow ») lente. On coupe le
        // thinking partout et on baisse l'effort là où c'est supporté.
        thinking: { type: "disabled" },
        ...(supportsEffort(model) ? { output_config: { effort: "low" } } : {}),
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPrompt),
          },
        ],
      }),
    });
    const latency = (Date.now() - t0) / 1000;

    if (!anthropicResponse.ok) {
      lastErrorText = await anthropicResponse.text();
      continue;
    }

    const anthropicJson = await anthropicResponse.json();
    const text =
      anthropicJson?.content?.find?.((item: { type: string }) => item.type === "text")
        ?.text ?? "";

    const finale = finaliserReponseQna(text, contexte);

    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "anonymous",
      event: "$ai_generation",
      properties: {
        $ai_trace_id: traceId,
        $ai_provider: "anthropic",
        $ai_model: model,
        $ai_input_tokens: anthropicJson?.usage?.input_tokens ?? null,
        $ai_output_tokens: anthropicJson?.usage?.output_tokens ?? null,
        $ai_latency: latency,
        $ai_http_status: anthropicResponse.status,
        $ai_base_url: "https://api.anthropic.com",
        $ai_span_name: "qna",
        question_category: resolveQuestionCategory(tension.id),
        module_id: tension.id ?? null,
        module_context: tension.id ?? null,
        report_id: inseeCode ?? null,
        // FUT-37 : la réponse affichée vient-elle du modèle, ou du repli après une violation ?
        qna_source: finale.source,
        qna_violations: finale.violations,
      },
    });
    await posthog.shutdown();

    return NextResponse.json({ ...finale, model_used: model });
  }

  // Aucun modèle n'a répondu : le repli déterministe, jamais une erreur affichée telle quelle.
  console.warn("[qna] modèle indisponible :", lastErrorText.slice(0, 300));
  return NextResponse.json({ ...finaliserReponseQna(null, contexte), violations: ["modele:indisponible"] });
}
