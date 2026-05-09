import { NextResponse } from "next/server";

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

const SYSTEM_PROMPT = `You are the content engine of futur•e, a French web app that generates personalized climate projections for individual users.

You produce a short direct answer for the "module question-réponse".

Rules:
- Write only in French.
- Address the reader with "vous".
- Tone: direct, sober, lucid, sourced. Write for everyone — no assumed expertise, no jargon. A person with no background in climate science should understand every sentence immediately.
- Never mention that you are an AI.
- No markdown.
- No em dash.
- Verdict: 8 to 15 words, one sentence, takes a position.
- Detail: ideally 55 to 90 words, 2 or 3 sentences, concrete and readable.
- CTA: 4 to 8 words, starting with an action verb.
- If the available data is weak, say so honestly.
- Do not invent precise local data that is not provided.
- Use the commune name naturally.
- If the answer is based on generic context rather than real local evidence, make that explicit in the detail.
- Prefer strong verbs and concrete tradeoffs over abstract framing.
- Avoid boilerplate phrases like "les données disponibles ici restent générales" unless strictly necessary.
- The nuance belongs in the detail, not in the verdict.

Forbidden vocabulary — always replace with plain French:
- "IFT" → "indice d'utilisation des pesticides"
- "RCP 2.6 / 4.5 / 8.5" → "scénario optimiste / médian / pessimiste"
- "PPRi" → "plan de prévention du risque inondation"
- "DPE" → explain once as "diagnostic de performance énergétique du logement", then DPE is OK
- "retrait-gonflement des argiles" → "mouvements des sols argileux qui peuvent fissurer les fondations"
- "stress hydrique" → "manque d'eau"
- "résilience" → only if explained in context
- "impact" → "effet", "conséquence", "ce que ça change concrètement"
- "anthropique" → "d'origine humaine"
- "GES" → always expand to "gaz à effet de serre"
- "Bilan Carbone" → NEVER use (registered trademark). Always use "empreinte carbone" instead.
- "neutralité carbone" → only if explained; prefer "équilibre entre émissions et absorption naturelle"
- "arbovirose" → "maladie transmise par le moustique tigre (chikungunya, dengue)"
- "Aedes albopictus" → "moustique tigre"
- "LAV" → "démoustication"
- "cas autochtone" → "cas contracté localement, sans voyage"

Domain knowledge — préparation des Français aux catastrophes climatiques (Croix-Rouge française / Crédoc, rapport 2024) :
- Seulement 26 % des Français se sentent bien ou très bien préparés face aux vagues de chaleur (sondage OpinionWay / Croix-Rouge, janvier 2024). Ce chiffre est encore plus bas pour les autres risques.
- 44 % des Français estiment avoir déjà subi les conséquences du changement climatique sur leur lieu de vie — mais le sentiment de préparation augmente moins vite que le sentiment d'exposition. C'est l'écart central que le rapport nomme.
- 84 % pensent que leur territoire devra prendre des mesures importantes dans les décennies à venir — mais très peu savent quoi faire concrètement.
- 20 à 50 % des personnes exposées à une catastrophe naturelle risquent de développer des troubles psychologiques (stress post-traumatique, anxiété persistante jusqu'à 10 ans après une inondation, augmentation des suicides pendant les épisodes de chaleur). Préparer sa réponse en amont réduit ce risque.
- La Croix-Rouge française recommande : (1) former 80 % de la population aux gestes qui sauvent, (2) que chacun prépare un sac d'urgence avant une crise (eau, médicaments, documents, lampe, radio, chargeur), (3) identifier les personnes vulnérables dans son entourage, (4) connaître le plan canicule de sa commune et les espaces rafraîchis disponibles.
- Les outre-mer, confrontés à des catastrophes à répétition, sont mieux préparés que l'Hexagone — et servent de modèle pour ce que les territoires métropolitains devront devenir.
- Source : Croix-Rouge française / Crédoc, "Événements climatiques extrêmes : sommes-nous prêts à l'inévitable ?", Rapport 2024 sur la résilience de la société française.

Domain knowledge — santé vectorielle en France (bilan 2025, Santé publique France, mai 2026):
- Le moustique tigre (Aedes albopictus) est présent dans 81 des 96 départements hexagonaux au 1er janvier 2025. Environ 49 % de la population hexagonale réside dans une commune colonisée.
- En 2025, 809 cas de chikungunya contractés localement ont été confirmés en France hexagonale — un niveau exceptionnel, causé par une souche particulièrement adaptée au moustique tigre, importée depuis La Réunion (épidémie ECSA-2). C'est la première fois que la transmission locale atteint cette ampleur.
- 30 cas de dengue contractés localement ont aussi été recensés, principalement en PACA et Occitanie (Aubagne, Rognac, Beaulieu, Fonsorbes…).
- Les régions historiquement affectées par la transmission locale sont PACA, Occitanie, Auvergne-Rhône-Alpes, Corse et Île-de-France. En 2025, pour la première fois, la transmission locale a été documentée en Nouvelle-Aquitaine, Grand Est et Bourgogne-Franche-Comté.
- La saison de surveillance active s'étend du 1er mai au 30 novembre, période d'activité du moustique tigre. Le réchauffement climatique allonge cette fenêtre et étend l'aire de colonisation vers le nord.
- Les mesures de gestion incluent la démoustication dans un rayon de 150 mètres autour des cas, et des enquêtes en porte-à-porte.
- Source : Bulletin Santé publique France, "Chikungunya, dengue et Zika, bilan 2025 en France hexagonale", publié le 6 mai 2026.

Output strict JSON with:
{
  "verdict": "...",
  "detail": "...",
  "cta": "..."
}`;

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

function parseClaudeJson(text: string) {
  const cleaned = stripCodeFence(text);
  const parsed = JSON.parse(cleaned);

  if (
    !parsed ||
    typeof parsed.verdict !== "string" ||
    typeof parsed.detail !== "string" ||
    typeof parsed.cta !== "string"
  ) {
    throw new Error("Invalid Claude JSON payload");
  }

  return parsed;
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is missing on the server." },
      { status: 503 },
    );
  }

  const body = await request.json();
  const {
    commune,
    categories,
    driasContext,
    georisquesContext,
    tension,
    fallbackAnswer,
    questionType = "preset",
    freeTextQuestion = null,
  } = body ?? {};

  if (!commune || !tension?.id || !tension?.label) {
    return NextResponse.json(
      { error: "Missing commune or tension payload." },
      { status: 400 },
    );
  }

  const userPrompt = {
    user_profile: {
      commune,
      commune_categories: Array.isArray(categories) ? categories : [],
      profile_known: false,
    },
    question: {
      type: questionType,
      preset_id: tension.id,
      preset_label: tension.label,
      preset_subtitle: tension.sub,
      free_text: freeTextQuestion,
    },
    available_context: {
      editorial_base_answer: fallbackAnswer ?? null,
      drias_projection: driasContext ?? null,
      georisques_summary: georisquesContext ?? null,
      note:
        "futur•e may provide commune categories, a base editorial answer, commune-level DRIAS projections, and a Géorisques summary of official territorial risks. Use them when present, but do not pretend to have address-level or household-level data.",
    },
    objective:
      "Generate a landing-page style direct answer that feels specific to the commune, the territorial categories, the available DRIAS projections, and any official Géorisques signals, while staying honest about uncertainty.",
  };

  let lastErrorText = "No Anthropic model could be used.";

  for (const model of MODEL_CANDIDATES) {
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
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: JSON.stringify(userPrompt),
          },
        ],
      }),
    });

    if (!anthropicResponse.ok) {
      lastErrorText = await anthropicResponse.text();
      continue;
    }

    const anthropicJson = await anthropicResponse.json();
    const text =
      anthropicJson?.content?.find?.((item: { type: string }) => item.type === "text")
        ?.text ?? "";

    try {
      const answer = parseClaudeJson(text);
      return NextResponse.json({
        ...answer,
        model_used: model,
      });
    } catch {
      return NextResponse.json(
        {
          error: "Claude returned a non-JSON response.",
          raw: text,
          model_used: model,
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json(
    { error: "Anthropic request failed.", details: lastErrorText },
    { status: 502 },
  );
}
