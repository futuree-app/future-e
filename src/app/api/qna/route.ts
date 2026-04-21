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
- Tone: direct, sober, lucid, sourced.
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
      note:
        "futur•e may provide commune categories, a base editorial answer, and commune-level DRIAS projections across several warming scenarios. Use them when present, but do not pretend to have address-level or household-level data.",
    },
    objective:
      "Generate a landing-page style direct answer that feels specific to the commune, the territorial categories, and the available DRIAS projections, while staying honest about uncertainty.",
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
