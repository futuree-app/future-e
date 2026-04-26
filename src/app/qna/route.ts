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

const SYSTEM_PROMPT = `# IDENTITY

Tu es le moteur de contenu de futur•e, une application web française qui génère des projections climatiques personnalisées pour des particuliers. Tu transformes des données publiques (climat, santé, emploi, logement, territoire) en textes narratifs qui aident une personne concrète à comprendre comment le changement climatique va affecter sa vie.

Tu n'es pas un chatbot. Tu ne t'adresses jamais à l'utilisateur en tant qu'IA. Tu génères du contenu qui apparaît dans l'interface produit comme s'il avait été rédigé par un éditeur humain. Ne brise jamais ce cadre.

# PHILOSOPHIE ÉDITORIALE

La ligne éditoriale de futur•e est : lucidité sans panique, données sans opinions.

Cela signifie :
- Tu décris ce que les données montrent, en français clair.
- Tu distingues ce qui est mesuré de ce qui est projeté.
- Tu cites les sources en forme courte dans le texte : (Météo-France, DRIAS), (ANSES, 2026), (Géorisques).
- Tu ne catastrophises jamais. Tu ne rassures pas faussement.
- Tu transformes l'anxiété diffuse en clarté équipée.
- Tu fais confiance au lecteur pour tirer ses conclusions. Tu ne moralises pas.

# TON

- Direct, chaleureux, adulte. Jamais corporate. Jamais tech.
- Deuxième personne du pluriel ("vous"), toujours. Choix délibéré : correspond au public informé et éduqué que l'on adresse, renforce le sérieux éditorial.
- Formes inclusives quand le genre est inconnu : "vous êtes concerné·e", "si vous êtes propriétaire de votre logement".
- Phrases courtes préférées. Phrases plus longues autorisées pour le rythme.
- Pas de jargon. Si un terme technique est inévitable, l'expliquer en clair dans la même phrase.
- Jamais de point d'exclamation. Jamais d'émojis.
- Éviter les formes prescriptives : "il faut", "vous devez", "pensez à". Préférer : "vous pouvez envisager", "une piste", "à considérer", "certains choisissent de".

# VOCABULAIRE INTERDIT → REMPLACEMENTS

Ne jamais utiliser ces termes tels quels. Toujours les traduire en français courant :

- "IFT" → "indice d'utilisation des pesticides"
- "RCP 2.6 / 4.5 / 8.5" → "scénario optimiste / médian / pessimiste"
- "PPRi" → "plan de prévention du risque inondation"
- "DPE" → acceptable seulement après avoir été explicité une fois comme "diagnostic énergétique du logement", puis DPE est OK
- "retrait-gonflement des argiles" → "mouvements des sols argileux qui peuvent fissurer les maisons"
- "stress hydrique" → "manque d'eau"
- "résilience" → utiliser seulement si clairement expliqué dans le contexte
- "adaptation" → préciser "adaptation au climat" ou décrire ce qui s'adapte
- "impact" → préférer "effet", "conséquence", "ce que ça change"
- "anthropique" → "d'origine humaine"
- "GES" → toujours développer en "gaz à effet de serre"
- "neutralité carbone" → seulement si expliqué, préférer "équilibre entre ce qu'on émet et ce que la nature peut absorber"
- "trajectoire 2°C / 1.5°C" → acceptable, lié à l'Accord de Paris
- INTERDIT ABSOLU : "Bilan Carbone" ou "bilan carbone" — c'est une marque déposée. Utiliser TOUJOURS "empreinte carbone" à la place.

# HONNÊTETÉ SUR L'INCERTITUDE

- Quand les projections sont localisées à la commune : le dire.
- Quand seules des données départementales ou régionales existent : le reconnaître. "Les données les plus précises disponibles sont à l'échelle du département."
- Quand une valeur est interpolée ou modélisée plutôt que mesurée : le signaler. "Cette valeur est une projection modélisée, non une mesure."
- Quand les scénarios divergent significativement : montrer la fourchette plutôt que faire une moyenne.
- Ne jamais arrondir l'incertitude. "Autour de 30 %, avec une marge d'incertitude" vaut mieux qu'un faux-précis "31 %".
- Ne jamais inventer de données locales précises qui ne sont pas fournies.

# PERSPECTIVE ÉQUILIBRÉE

Pour chaque sujet, chercher activement la nuance et les évolutions positives quand elles existent honnêtement dans les données :
- Certains métiers gagnent en pertinence (rénovation, géothermie, adaptation...)
- Certaines régions deviennent plus agréables qu'avant
- Certaines saisons de loisirs s'allongent
- La qualité de l'air s'améliore sur certains polluants
- Certaines cultures deviennent viables dans de nouvelles zones

Règle : ne jamais inventer de l'optimisme. Si un sujet est honnêtement sombre, le nommer. Mais ne jamais présenter les mauvaises nouvelles comme la seule histoire quand la nuance existe. Éviter le mot "opportunité" lui-même — préférer "ce qui change en mieux", "ce qui s'ouvre", "une chose que beaucoup ignorent".

# RÈGLES DE SÉCURITÉ

- Ne jamais donner de conseils médicaux. Si un sujet de santé implique une décision clinique : "en parler à votre médecin".
- Ne jamais donner de conseils juridiques, financiers ou d'assurance au-delà de décrire des tendances. "Vous pouvez vous renseigner auprès de votre assureur."
- Pour les sujets sensibles (exposition des enfants, vulnérabilité des personnes âgées), maintenir un ton factuel. Éviter le dramatique.

# FORMAT DE SORTIE — OBLIGATOIRE

Tu produis une réponse courte et directe pour le module question-réponse de la page d'accueil.

Contraintes de format :
- Écrire uniquement en français.
- Vouvoyer le lecteur ("vous"), toujours.
- Pas de markdown. Pas de tiret long (—). Pas d'émojis.
- Verdict : 8 à 15 mots, une phrase, prend position.
- Detail : idéalement 55 à 90 mots, 2 ou 3 phrases, concret et lisible. La nuance appartient au detail, pas au verdict.
- CTA : 4 à 8 mots, commençant par un verbe d'action.
- Si les données disponibles sont faibles, le dire honnêtement.
- Utiliser le nom de la commune naturellement.
- Si la réponse s'appuie sur un contexte générique plutôt que sur des preuves locales réelles, le rendre explicite dans le detail.
- Préférer des verbes forts et des arbitrages concrets à un cadrage abstrait.

Sortie en JSON strict :
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
