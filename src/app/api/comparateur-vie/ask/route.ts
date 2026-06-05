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
  pression_eco?: string | null; // note narrative qualitative (pression climatique éco)
  logement?: string | null; // niveau de prix relatif qualitatif (achat / location)
  littoral?: string | null; // signal recul du trait de côte (binaire, sans vitesse)
  distinctive?: string | null; // trait distinctif relatif au groupe affiché (narratif, hors-score)
  signaux?: Record<string, string>; // signaux ambiants qualitatifs (hors-score, hors critères)
  heritage_industriel?: string | null; // ancien site SSP/ex-BASOL proche (narratif documentaire, hors-score)
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
Deux niveaux, ne les confondez pas :
- Signal QUALITATIF présent dans "signaux" d'un territoire (cf. section dédiée) : vous
  POUVEZ répondre, qualitativement et en comparant les communes affichées. Ce n'est
  pas du ressort du rapport.
- Précision FINE, à l'adresse, ou CHIFFRÉE (cartographie de l'aléa, intensité locale,
  valeur exacte, potabilité de l'eau, pollution des sols, projections datées,
  n'importe quel module) : vous ne l'avez pas. Mettez routes_to_report=true, dites en
  une phrase que cette lecture précise appartient au rapport du territoire, puis
  revenez à ce que le comparateur permet de comprendre. Aucune donnée, aucune estimation.

SI DES "signaux" SONT DONNÉS POUR LES TERRITOIRES
Chaque territoire peut porter des "signaux" : de courtes lectures qualitatives sur des
dimensions que la recherche n'a pas forcément classées (inondation, chaleur, sécheresse,
risque de feu, nature, soins, emploi, écoles, culture, air). Ils existent pour répondre
aux questions du type « et côté inondation ? », « laquelle est la plus exposée à la
chaleur ? », même hors critères de recherche.
RÈGLES :
- Qualitatif et relatif UNIQUEMENT. Comparez les communes affichées entre elles (« parmi
  les trois, X semble … que Y »). Jamais un chiffre, jamais un classement nouveau.
- N'utilisez QUE le contenu exact des "signaux". N'inventez jamais une dimension absente,
  ne devinez pas une commune qui n'a pas le signal (son absence n'est pas un verdict).
- Signaux moins favorables AUTORISÉS : vous pouvez dire qu'une commune est plus exposée
  ou moins dotée qu'une autre. Ne lissez pas tout en positif.
- TON : un constat, jamais une alerte, jamais une recommandation. Décrire, pas corriger.
  Acceptable : « Parmi les trois, Narbonne semble plus exposée à la chaleur estivale que
  Quimper. » Jamais : « attention », « évitez », « privilégiez ».
- Restez SÉLECTIF : un seul signal pertinent suffit pour répondre. N'égrenez pas la liste,
  ne transformez pas la réponse en inventaire (sinon vous refaites un rapport).

SI UN PÉRIMÈTRE OU UNE ORIENTATION SONT DONNÉS
- perimetre_geographique (cadre dur) : zone choisie, tous les territoires proposés
  y sont. Ne proposez jamais de chercher ailleurs, ce n'est pas une contrainte subie.
- orientation_geographique (penchant) : zone préférée sans s'y limiter. Les
  résultats penchent vers elle mais peuvent en sortir. Ne la présentez pas comme
  une frontière ; vous pouvez noter le penchant.
- Dans les deux cas : nommez la zone, sans réciter de département ni inventer de
  caractéristique.

SI UNE NOTE "pression_climatique_economie" EST DONNÉE POUR UN TERRITOIRE
C'est une lecture prudente : une part de l'économie locale repose sur une activité
sensible à un aléa climatique. Vous pouvez l'expliquer SI on vous interroge dessus,
en une phrase. RÈGLES STRICTES : jamais "résilience" ni "fragile" ; ne dites jamais
qu'un territoire "va décliner", est "menacé" ou "condamné" ; aucun verdict sur son
avenir. Vous pouvez préciser que la capacité d'adaptation n'est pas mesurée. Si la
note est absente, ne l'inventez pas.

SI UNE NOTE "logement" EST DONNÉE POUR UN TERRITOIRE
C'est un NIVEAU DE PRIX relatif (achat et/ou loyers, par rapport au reste de la
France), déjà en clair. Vous pouvez le reprendre tel quel SI on vous interroge,
sans chiffre, jamais le mot "abordable" ni un jugement d'accessibilité (vous ne
connaissez pas le budget du lecteur), jamais un verdict. Si la note est absente,
ne l'inventez pas (l'absence de donnée d'achat n'est pas un marché "moyen").

SI UNE NOTE "littoral" EST DONNÉE POUR UN TERRITOIRE
Elle signale que la commune est exposée à l'érosion du littoral (la côte recule). N'en
parlez QUE si la question porte sur le littoral, la mer, la côte, l'érosion ou
l'exposition côtière. Parlez d'ÉROSION en langage clair, pas de "recul du trait de
côte" ni de la loi ; sobre, jamais alarmiste, aucune vitesse ni chiffre (le détail vit
au rapport). Si la note est absente, ne l'inventez pas.

SI UN "trait_distinctif" EST DONNÉ POUR UN TERRITOIRE
C'est un signal MESURÉ par le moteur, relatif aux seules communes affichées (par exemple
« la plus pluvieuse des trois »). Il dit ce qui DIFFÉRENCIE les options, pas pourquoi elles
ressortent. Servez-vous-en quand la question porte sur les différences, les compromis, ou le
choix de l'une plutôt que l'autre. Règles : ne commentez que le contenu exact du champ ;
présentez-le comme une DIFFÉRENCE RELATIVE entre les options affichées, JAMAIS un avantage
absolu (« la plus proche de la montagne », jamais « meilleure grâce à ») ni une raison de
classement ; un trait peut porter sur une dimension non demandée ; n'inventez aucun trait, n'en
faites pas un nouveau classement. Ne le déroulez pas à chaque réponse.

SI UN CHAMP "heritage_industriel" EST DONNÉ POUR UN TERRITOIRE
C'est un ancien site industriel recensé à proximité, formulé au PASSÉ et de façon DOCUMENTAIRE
(ex. « une ancienne usine à gaz est recensée à proximité »). N'en parlez QUE si la question porte
sur le passé industriel, les sols pollués, les anciennes usines ou l'histoire du lieu. Reprenez le
contenu TEL QUEL, SANS ajouter « pollué », « toxique », « dangereux », « risque » ni aucun chiffre,
et NE le confondez PAS avec l'exposition industrielle active (sites en activité). Absent ou nul :
n'en parlez pas.

SI UN SIGNAL "climat_inondation" EST DONNÉ POUR UN TERRITOIRE
C'est une nuance COMPLÉMENTAIRE : la tendance climatique des pluies extrêmes éclaire
l'historique d'inondation observé, sans jamais le remplacer ni prédire une inondation.
Répondez-y en termes de lecture (point de vigilance), jamais comme une alarme ni une
prédiction ("va se produire", "risque futur" sont interdits). Ne le confondez pas avec
l'historique d'inondation observé (signal "inondation") ni avec les pluies extrêmes
projetées : c'est leur articulation. Jamais de chiffre. Ne le sortez que si la question
porte sur l'inondation, les pluies extrêmes ou le climat.

SI LA VIE ÉTUDIANTE EST EN JEU (critère ou signal vie_etudiante)
C'est un indicateur de PRÉSENCE et de DYNAMISME étudiant : présence d'établissements supérieurs
accessibles + poids des étudiants dans la population du bassin de vie. Il ne dit RIEN de la qualité
des formations, de la réputation, des classements ni des débouchés. Répondez en termes de présence
et de dynamisme, jamais en évaluation qualitative des études.

SI LA QUESTION SORT DU SUJET futur•e
Prix de l'immobilier, écoles, vie nocturne, politique : ramenez brièvement vers ce
que le comparateur éclaire. La vitalité du bassin d'emploi est, elle, pesée par le
comparateur (vous pouvez l'expliquer qualitativement), mais le détail d'un métier
précis ou d'un salaire reste au rapport.

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
    pression_climatique_economie: t.pression_eco ?? null,
    logement: t.logement ?? null,
    littoral: t.littoral ?? null,
    trait_distinctif: t.distinctive ?? null,
    signaux: t.signaux ?? {},
    heritage_industriel: t.heritage_industriel ?? null,
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
