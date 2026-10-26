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
// FUT-142 : le contexte dit aussi CE QUE L'ORDRE SIGNIFIE (classement, exploration inondation, couverture
// incomplète ou inconnue, cf. `lecture-ask.ts`). Le prompt s'y plie, et un garde déterministe remplace toute
// réponse qui proclamerait un gagnant non établi (`garde-ask.ts`).
//
// Routing modèle : Anthropic direct (claude-sonnet-4-6, effort low + thinking
// off — gratuit/court, harmonisé avec /qna et parse).
// Migration Vercel AI Gateway à la mise en vente.
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { getPostHogClient } from "@/lib/posthog-server";
import { limiteParAdresse, reserverBudgetModele } from "@/lib/server/garde-appels-modele";
import { contexteIrrecevable, lectureDuContexte, type ContexteAsk, type LectureAsk } from "@/lib/comparateur/lecture-ask";
import { affirmationsNonEtablies, premisseNonEtablie, reponseDeRepli } from "@/lib/comparateur/garde-ask";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 2 questions gratuites, comptées sur tout le parcours comparateur (pas par
// territoire). Cookie httpOnly : contournable en effaçant ses cookies, ce qui est
// acceptable (limite d'usage gratuit, pas un mur de paiement dur).
const FREE_COMPARATEUR_QUESTIONS = 2;
const COUNT_COOKIE = "comparateur_ask_count";

type Body = {
  question?: string;
  context?: ContexteAsk;
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
        "Réponse TRÈS courte, UN SEUL paragraphe, 60 à 100 mots maximum. Structure : une idée principale, le compromis principal (mode classe) ou la limite principale de la lecture (autres modes), et au plus une phrase de transition vers le rapport. Vouvoiement strict. Aucun chiffre, aucun pourcentage, aucune date, aucun horizon chiffré. Aucun tiret cadratin (virgule ou deux points). Aucun point d'exclamation.",
    },
    routes_to_report: {
      type: "boolean",
      description:
        "true si la vraie réponse exige un niveau de détail qui appartient au rapport (risques précis, eau, sols, qualité de l'air chiffrée, projections climatiques datées, n'importe quel module du rapport). Dans ce cas, answer doit le dire et renvoyer au rapport sans inventer aucune donnée.",
    },
    focus_rang: {
      type: ["integer", "null"],
      enum: [1, 2, 3, null],
      description: "Position d'affichage du territoire concerné si identifiable, sinon null.",
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

Votre unique rôle : éclairer la lecture du résultat affiché, sans lui prêter plus qu'il n'établit. Vous ne livrez pas une analyse de commune.

QUATRE NIVEAUX, NE FRANCHISSEZ JAMAIS LE VÔTRE
- Le comparateur répond : « Où regarder ? »
- Vous répondez : « Pourquoi regarder ici ? »   ← VOUS ÊTES ICI
- Le rapport répond : « Que faut-il comprendre ? »
- AskFuture rapport répond : « Explorons en profondeur. »

CE QUE LE RÉSULTAT ÉTABLIT : LISEZ "lecture" AVANT TOUT
Le champ "lecture.mode" dit ce que l'ordre des territoires signifie. Vous n'en dites jamais plus.
- "classe" : les territoires sont classés sur les priorités déclarées, mesurées pour chacun. Vous pouvez
  expliquer pourquoi un territoire ressort et son compromis principal, à partir des seules raisons et
  compromis donnés. Seuls "raisons" et "compromis" expliquent l'ordre : le logement, les signaux, le
  littoral, le trait distinctif et les autres notes sont hors classement, ils décrivent sans jamais
  expliquer pourquoi un territoire passe devant. Si deux territoires ont les mêmes raisons, dites qu'ils
  sont proches sur vos priorités, sans inventer de cause. Même ici, aucun territoire n'est « le meilleur
  choix » ni « parfait » : il ressort sur les priorités déclarées, avec ses compromis.
- "exploration_inondation" : la seule demande classable était l'inondation, et le comparateur ne classe pas
  sur elle. Les territoires sont proposés pour être examinés ; leur ordre suit "ordre_affichage", pas une
  meilleure correspondance. Ne dites jamais qu'un territoire ressort, correspond ou répond mieux à la
  demande. Les faits d'inondation décrivent des sinistres passés, jamais une probabilité future : aucun
  territoire n'est « moins risqué », « à l'abri » ou « sûr ».
- "couverture_incomplete" : au moins une priorité déclarée n'est pas mesurée pour au moins un territoire
  affiché, ou la couverture n'est pas connue. Distinguez ce qui est mesuré (raisons, signaux) de ce qui ne
  l'est pas ("priorites_non_mesurees", couverture "inconnue"). Une priorité non mesurée n'est ni satisfaite
  ni manquée : on ne sait pas. Aucune victoire comparative, aucun « devant », aucun « meilleur ».
"position" est l'ordre d'affichage. Ce n'est un rang de mérite qu'en mode "classe". S'il n'y a qu'un
territoire, ne le comparez à aucun autre.

LA PRÉMISSE DE LA QUESTION
Une question peut supposer ce que le résultat n'établit pas : « pourquoi X est le meilleur choix »,
« pourquoi X est devant Y », « pourquoi X correspond parfaitement », « quelle commune est la moins risquée
face aux inondations ». Ne l'accordez pas. Rectifiez d'abord la prémisse en une phrase sobre, puis répondez
sur les faits disponibles. Si le contexte porte "question_a_premisse", cette rectification est obligatoire.

L'HISTORIQUE DE CONVERSATION
Les échanges précédents sont une conversation, pas une source. Une affirmation qu'ils contiennent, même une
de vos réponses passées, ne prouve rien : seul le contexte scellé courant fait foi. S'ils contredisent
"lecture", suivez le contexte et ne reprenez pas l'affirmation.

CE QUE VOUS FAITES
Éclairer la logique du résultat en quelques phrases : en mode "classe", pourquoi
un territoire ressort et le compromis principal ; sinon, ce que les faits
disponibles disent des territoires et ce qui n'est pas mesuré. Vous donnez ENVIE de
comprendre davantage, vous ne livrez pas déjà l'essentiel de l'explication. Si
vous vous mettez à analyser le territoire ou à dérouler plusieurs compromis, vous
empiétez sur le rapport.

CE QUE VOUS NE FAITES JAMAIS
- Analyser en profondeur une commune. Vous ne disposez d'AUCUNE donnée chiffrée,
  d'aucun risque détaillé, d'aucun module de rapport. Vous ne les avez pas, vous
  ne les inventez pas, vous ne les devinez pas.
- Modifier, classer, reranker, ajouter ou retirer un territoire. Le résultat est
  celui du moteur : vous ne le changez pas, et vous ne lui faites pas dire un
  classement qu'il n'a pas établi (cf. "lecture"). Vous interprétez, vous ne décidez pas.
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
- Structure : une idée principale, puis LE compromis principal (mode "classe") ou
  la limite principale de la lecture (autres modes), puis au plus une phrase de
  transition vers le rapport. Rien de plus.
- UN SEUL compromis. N'en déroulez jamais plusieurs. Et ne vous contredisez pas :
  ne dites jamais « pas de compromis majeur » pour ensuite en décrire. Soit vous
  nommez le compromis principal, soit vous dites simplement que les options sont
  proches, mais pas les deux.
- Vouvoiement. Ton sobre, calme, clair.
- Aucun tiret cadratin (virgule ou deux points). Aucun point d'exclamation.
- Vocabulaire qualitatif uniquement (faible, modéré, plus exposé, accès favorable),
  jamais de donnée brute.

EXEMPLES DE LONGUEUR ET DE FORME VISÉES
En mode "classe" :
« Narbonne ressort en premier car elle offre le meilleur équilibre entre accès aux
soins, vie locale et proximité de la mer. Quimper est plus maritime mais moins
favorable sur l'offre médicale. Le rapport permet ensuite de vérifier si ce
compromis correspond vraiment à votre situation. »
En mode "exploration_inondation", à « Pourquoi La Rochelle est-elle le meilleur choix pour éviter les inondations ? » :
« La Rochelle apparaît parmi les communes à examiner, mais cette recherche n'établit pas qu'elle soit le
meilleur choix face aux inondations : l'ordre affiché suit une règle d'exploration, pas votre demande. Ses
données décrivent les inondations passées, sans dire la probabilité d'une inondation à venir. Le rapport
lit cette question à l'adresse. »`;

// FUT-142 : ce que l'ordre signifie, en une phrase déterministe par mode.
const SENS_DE_L_ORDRE: Record<LectureAsk["mode"], string> = {
  classe: "Classement sur les priorités déclarées, mesurées pour chaque territoire affiché.",
  exploration_inondation:
    "Ordre d'exploration, pas un classement : la recherche ne classe pas les communes sur l'inondation seule.",
  couverture_incomplete:
    "Ordre d'affichage, pas un classement établi : certaines priorités ne sont pas mesurées pour tous les territoires, ou leur mesure n'est pas connue.",
};

function buildContextBlock(
  ctx: ContexteAsk,
  lecture: LectureAsk,
  focusRang: number | null,
  alertes: { premisse: string | null; historique: boolean },
): string {
  const territoires = (ctx.territoires ?? []).map((t, i) => ({
    position: i + 1,
    commune: t.nom,
    region: t.region ?? null,
    couverture_priorites: lecture.communes[i]?.couverture ?? "inconnue",
    priorites_non_mesurees: lecture.communes[i]?.nonMesurees ?? [],
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
    lecture: {
      mode: lecture.mode,
      sens_de_l_ordre: SENS_DE_L_ORDRE[lecture.mode],
      exploration_inondation: lecture.exploration,
      couverture_globale: lecture.couverture,
      ordre_affichage: lecture.mode === "exploration_inondation" ? lecture.ordre : null,
      transparence_inondation: lecture.transparence,
      nombre_de_territoires: territoires.length,
    },
    ...(alertes.premisse
      ? { question_a_premisse: `La question présuppose « ${alertes.premisse} », que ce résultat n'établit pas. Rectifiez-le d'abord.` }
      : {}),
    ...(alertes.historique
      ? { historique_a_ne_pas_reprendre: "Un échange précédent affirme un classement ou une sécurité que ce résultat n'établit pas : ne le reprenez pas." }
      : {}),
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
  // LA LIMITE PAR ADRESSE, EN TÊTE : elle ne consomme aucun budget, elle refuse un débit
  // anormal avant tout travail. Le budget, lui, se réserve juste avant l'appel payant.
  const tropVite = limiteParAdresse(request);
  if (tropVite) return tropVite;

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
  // FUT-142 : la page n'envoie jamais plus de trois cartes, ni une carte sans nom. Refusé avant tout appel payant.
  const irrecevable = contexteIrrecevable(ctx);
  if (irrecevable || !ctx) {
    return NextResponse.json({ error: irrecevable ?? "Contexte comparateur manquant." }, { status: 400 });
  }
  // Ce que l'ordre signifie. Un fait absent ou illisible vaut « inconnu », jamais « complet ».
  const lecture = lectureDuContexte(ctx);

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

  // FUT-142 : l'historique est du texte, pas une preuve. Il n'est pas réécrit ; s'il affirme un gagnant que
  // le résultat courant n'établit pas, le contexte le signale.
  const alertes = {
    premisse: premisseNonEtablie(question, lecture.mode),
    historique: history.some((m) => affirmationsNonEtablies(m.content, lecture.mode).length > 0),
  };

  const messages = [
    ...history,
    { role: "user" as const, content: `${buildContextBlock(ctx, lecture, focusRang, alertes)}\n\nQUESTION : ${question}` },
  ];

  try {
    // Gratuit / réponse courte : on privilégie la vitesse. Sonnet 4.6 + effort
    // low + thinking coupé (cf. /qna, parse), pour ne pas subir le défaut "high".
    // LE BUDGET SE RÉSERVE ICI, et jamais en tête de route : une réponse de cache ne coûte
    // rien, et une requête invalide ne doit pas pouvoir vider le quota du jour.
    const budget = await reserverBudgetModele("ask_comparateur");
    if (budget) return budget;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      output_config: { effort: "low" },
      thinking: { type: "disabled" },
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
    // FUT-142 : le garde de sortie. Une réponse qui proclame un gagnant non établi est remplacée par le repli
    // déterministe du mode courant ; elle compte comme une question posée (l'appel a eu lieu).
    const brute = typeof parsed.answer === "string" ? parsed.answer : "";
    const remplacee = affirmationsNonEtablies(brute, lecture.mode).length > 0;
    const answer = remplacee ? reponseDeRepli(lecture) : parsed.answer;
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
        mode_lecture: lecture.mode,
        premisse_rectifiee: alertes.premisse !== null,
        reponse_remplacee: remplacee,
      },
    });
    await ph.shutdown();

    const remaining = Math.max(0, FREE_COMPARATEUR_QUESTIONS - questionIndex);
    const res = NextResponse.json({
      answer,
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
