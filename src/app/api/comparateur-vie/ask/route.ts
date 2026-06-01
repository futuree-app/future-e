// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · ASKFUTURE COMPARATEUR (guide de lecture, SCELLÉ)
//
// Rôle : répondre à « POURQUOI regarder ici ? ». Pas « que faut-il comprendre en
// détail de cette commune ? » (ça, c'est le rapport).
//
//   Comparateur          → Où regarder ?
//   AskFuture comparateur → Pourquoi regarder ici ?   ← CET ENDPOINT
//   Rapport              → Que faut-il comprendre ?
//   AskFuture rapport    → Explorons en profondeur.
//
// FIREWALL PAR CONSTRUCTION (frontière d'import, pas filtre runtime) :
//   - n'importe JAMAIS la donnée profonde : ni @/lib/commune-enrichment, ni
//     georisques / eaufrance / vigieau / commune-data / drias-json, ni Supabase ;
//   - ne lit jamais l'index, n'appelle jamais matchProjects, ne recalcule rien ;
//   - ne consomme QUE le contexte scellé envoyé par le client (déjà qualitatif,
//     sans chiffre). Même si un INSEE était injecté, aucun chemin de code ne
//     permet de reconstruire le rapport.
//
// Anonyme (comme synthesize). Aucun stockage serveur des échanges : l'historique
// est porté par le client dans `history`. Seul état persistant : le cookie
// compteur (2 questions gratuites, GLOBAL au parcours comparateur).
//
// Routing modèle : Anthropic direct (claude-sonnet-4-5), comme synthesize.
// Migration Vercel AI Gateway à la mise en vente.
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 2 questions gratuites, comptées sur tout le parcours comparateur (pas par
// territoire). Cookie httpOnly : contournable en effaçant ses cookies, ce qui est
// acceptable (limite d'usage gratuit, pas un mur de paiement dur).
const FREE_COMPARATEUR_QUESTIONS = 2;
const COUNT_COOKIE = "comparateur_ask_count";

type Territoire = {
  rang: number;
  nom: string;
  region: string | null;
  raisons: string[];
  compromis: string | null;
};

type Body = {
  question?: string;
  context?: {
    reformulation?: string;
    criteres?: string[]; // libellés humains (jamais les clés techniques)
    perimetre?: string[]; // ancres dures = cadre choisi
    orientation?: string[]; // ancres souples = penchant
    synthese?: string;
    aucun_territoire_parfait?: boolean;
    territoires?: Territoire[];
  };
  focus?: { rang?: number } | null;
  history?: { role: "user" | "assistant"; content: string }[];
  distinctId?: string; // posthog distinct id côté client (mesure seulement)
};

// ─── Sortie structurée (tool use) : answer + signal de routage rapport ────────
const TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    answer: {
      type: "string",
      description:
        "Réponse TRÈS courte, UN SEUL paragraphe, 60 à 100 mots maximum. Structure : une idée principale, un compromis principal, et au plus une phrase de transition vers le rapport. Vouvoiement strict. Aucun chiffre, aucun pourcentage, aucune date, aucun horizon chiffré. Aucun tiret cadratin (virgule ou deux points). Aucun point d'exclamation.",
    },
    routes_to_report: {
      type: "boolean",
      description:
        "true si la vraie réponse exige un niveau de détail qui appartient au rapport (risques précis, eau, sols, qualité de l'air chiffrée, projections climatiques datées, n'importe quel module du rapport). Dans ce cas, answer doit le dire et renvoyer au rapport sans inventer aucune donnée.",
    },
    focus_rang: {
      type: ["integer", "null"],
      enum: [1, 2, 3, null],
      description: "Rang du territoire concerné si identifiable, sinon null.",
    },
  },
  required: ["answer", "routes_to_report"],
};

type ToolInput = {
  answer: string;
  routes_to_report: boolean;
  focus_rang?: number | null;
};

const SYSTEM = `Vous êtes AskFuture, le guide de lecture du Comparateur de vie de futur•e.

Votre unique rôle : expliquer POURQUOI le comparateur a fait ressortir ces territoires. Vous éclairez la lecture du résultat, vous ne livrez pas une analyse de commune.

QUATRE NIVEAUX, NE FRANCHISSEZ JAMAIS LE VÔTRE
- Le comparateur répond : « Où regarder ? »
- Vous répondez : « Pourquoi regarder ici ? »   ← VOUS ÊTES ICI
- Le rapport répond : « Que faut-il comprendre ? »
- AskFuture rapport répond : « Explorons en profondeur. »

CE QUE VOUS FAITES
Éclairer la logique du résultat en quelques phrases : pourquoi un territoire
ressort, le compromis principal, comment lire l'arbitrage. Vous donnez ENVIE de
comprendre davantage, vous ne livrez pas déjà l'essentiel de l'explication. Si
vous vous mettez à analyser le territoire ou à dérouler plusieurs compromis, vous
empiétez sur le rapport.

CE QUE VOUS NE FAITES JAMAIS
- Analyser en profondeur une commune. Vous ne disposez d'AUCUNE donnée chiffrée,
  d'aucun risque détaillé, d'aucun module de rapport. Vous ne les avez pas, vous
  ne les inventez pas, vous ne les devinez pas.
- Modifier, classer, reranker, ajouter ou retirer un territoire. Le moteur a déjà
  décidé. Vous interprétez, vous ne décidez pas.
- Donner un chiffre, un pourcentage, une date, un horizon chiffré.

SI LA QUESTION DEMANDE LE DÉTAIL DU RAPPORT
Si on vous demande un niveau de précision que vous n'avez pas (risque d'inondation
précis, potabilité de l'eau, pollution des sols, jours de canicule, projections
datées, n'importe quel module), mettez routes_to_report=true. Dans answer : dites en
une phrase que cette lecture précise appartient au rapport du territoire, puis
revenez à ce que le comparateur, lui, permet de comprendre (pourquoi ce territoire
ressort, le compromis qu'il représente). Vous ne donnez aucune donnée, vous ne
faites aucune estimation.

SI UN PÉRIMÈTRE OU UNE ORIENTATION SONT DONNÉS
- perimetre_geographique (cadre dur) : zone choisie, tous les territoires proposés
  y sont. Ne proposez jamais de chercher ailleurs, ce n'est pas une contrainte subie.
- orientation_geographique (penchant) : zone préférée sans s'y limiter. Les
  résultats penchent vers elle mais peuvent en sortir. Ne la présentez pas comme
  une frontière ; vous pouvez noter le penchant.
- Dans les deux cas : nommez la zone, sans réciter de département ni inventer de
  caractéristique.

SI LA QUESTION SORT DU SUJET futur•e
Emploi, prix de l'immobilier, écoles, vie nocturne, politique : ramenez brièvement
vers ce que le comparateur éclaire (le pourquoi des territoires proposés).

FORMAT
- UN SEUL paragraphe, 60 à 100 mots maximum. Court. Jamais un mini-rapport.
- Structure : une idée principale, puis LE compromis principal, puis au plus une
  phrase de transition vers le rapport. Rien de plus.
- UN SEUL compromis. N'en déroulez jamais plusieurs. Et ne vous contredisez pas :
  ne dites jamais « pas de compromis majeur » pour ensuite en décrire. Soit vous
  nommez le compromis principal, soit vous dites simplement que les options sont
  proches, mais pas les deux.
- Vouvoiement. Ton sobre, calme, clair.
- Aucun tiret cadratin (virgule ou deux points). Aucun point d'exclamation.
- Vocabulaire qualitatif uniquement (faible, modéré, plus exposé, accès favorable),
  jamais de donnée brute.

EXEMPLE DE LONGUEUR ET DE FORME VISÉE
« Narbonne ressort en premier car elle offre le meilleur équilibre entre accès aux
soins, vie locale et proximité de la mer. Quimper est plus maritime mais moins
favorable sur l'offre médicale. Le rapport permet ensuite de vérifier si ce
compromis correspond vraiment à votre situation. »`;

function buildContextBlock(ctx: NonNullable<Body["context"]>, focusRang: number | null): string {
  const territoires = (ctx.territoires ?? []).map((t) => ({
    rang: t.rang,
    commune: t.nom,
    region: t.region ?? null,
    raisons: t.raisons ?? [],
    compromis: t.compromis ?? null,
  }));

  const payload = {
    reformulation_du_projet: ctx.reformulation ?? null,
    criteres_detectes: ctx.criteres ?? [],
    perimetre_geographique: Array.isArray(ctx.perimetre) && ctx.perimetre.length ? ctx.perimetre : null,
    orientation_geographique: Array.isArray(ctx.orientation) && ctx.orientation.length ? ctx.orientation : null,
    synthese_deja_affichee: ctx.synthese ?? null,
    aucun_territoire_parfait: ctx.aucun_territoire_parfait ?? false,
    territoires,
    territoire_au_centre_de_la_question: focusRang,
  };

  return `CONTEXTE SCELLÉ DU COMPARATEUR (votre seule source, rien d'autre n'existe) :
${JSON.stringify(payload, null, 2)}`;
}

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  const question = typeof body.question === "string" ? body.question.trim() : "";
  if (question.length < 3) {
    return NextResponse.json({ error: "Posez une question en quelques mots." }, { status: 400 });
  }
  const ctx = body.context;
  if (!ctx || !Array.isArray(ctx.territoires) || ctx.territoires.length === 0) {
    return NextResponse.json({ error: "Contexte comparateur manquant." }, { status: 400 });
  }

  const focusRang =
    body.focus?.rang === 1 || body.focus?.rang === 2 || body.focus?.rang === 3
      ? body.focus.rang
      : null;

  const distinctId = typeof body.distinctId === "string" && body.distinctId ? body.distinctId : "anon";

  // ─── Compteur 2 questions gratuites (global parcours) ──────────────────────
  const rawCount = Number.parseInt(request.cookies.get(COUNT_COOKIE)?.value ?? "0", 10);
  const used = Number.isFinite(rawCount) && rawCount > 0 ? rawCount : 0;

  if (used >= FREE_COMPARATEUR_QUESTIONS) {
    const ph = getPostHogClient();
    ph.capture({
      distinctId,
      event: "life_ask_limit_reached",
      properties: { source: "comparateur_vie", territoire_rang: focusRang },
    });
    await ph.shutdown();
    return NextResponse.json(
      { error: "limit", limit: FREE_COMPARATEUR_QUESTIONS },
      { status: 402 },
    );
  }

  const questionIndex = used + 1; // 1 ou 2

  const ph = getPostHogClient();
  ph.capture({
    distinctId,
    event: "life_ask_submitted",
    properties: {
      source: "comparateur_vie",
      question_index: questionIndex,
      territoire_rang: focusRang,
      question_length: question.length,
    },
  });

  // Historique scellé : on ne garde que le fil de la conversation, pas de donnée.
  const history = Array.isArray(body.history)
    ? body.history
        .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  const messages = [
    ...history,
    { role: "user" as const, content: `${buildContextBlock(ctx, focusRang)}\n\nQUESTION : ${question}` },
  ];

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      system: SYSTEM,
      tools: [
        {
          name: "askfuture_comparateur",
          description: "Renvoie le guide de lecture du comparateur (pourquoi regarder ici).",
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "askfuture_comparateur" },
      messages,
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      await ph.shutdown();
      return NextResponse.json({ error: "Réponse indisponible. Réessayez." }, { status: 502 });
    }

    const parsed = toolBlock.input as ToolInput;
    const answeredRang =
      parsed.focus_rang === 1 || parsed.focus_rang === 2 || parsed.focus_rang === 3
        ? parsed.focus_rang
        : focusRang;

    ph.capture({
      distinctId,
      event: "life_ask_answered",
      properties: {
        source: "comparateur_vie",
        question_index: questionIndex,
        territoire_rang: answeredRang,
        routes_to_report: parsed.routes_to_report === true,
      },
    });
    await ph.shutdown();

    const remaining = Math.max(0, FREE_COMPARATEUR_QUESTIONS - questionIndex);
    const res = NextResponse.json({
      answer: parsed.answer,
      routesToReport: parsed.routes_to_report === true,
      focusRang: answeredRang,
      remaining,
    });
    res.cookies.set(COUNT_COOKIE, String(questionIndex), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 6, // 6 h : durée raisonnable d'un parcours comparateur
    });
    res.headers.set("X-Comparateur-Ask-Remaining", String(remaining));
    return res;
  } catch (error) {
    console.error("[comparateur-vie/ask]", error);
    await ph.shutdown();
    return NextResponse.json({ error: "Erreur lors de la génération de la réponse." }, { status: 500 });
  }
}
