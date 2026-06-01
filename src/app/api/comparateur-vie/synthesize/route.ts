// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · SYNTHÈSE (interprétation éditoriale)
//
// Streame une synthèse éditoriale qui INTERPRÈTE le résultat déterministe du
// moteur. Elle ne choisit pas, ne reranke pas, ne modifie pas les communes :
// le moteur a déjà décidé. Elle donne l'effet « ce produit a compris mon projet ».
//
// Frontière produit (cf. BUSINESS_MODEL_B2C.md) :
//   - la synthèse parle des RAISONS (pourquoi ces territoires ressortent) ;
//   - le rapport payant parle des CONSÉQUENCES (chiffres, modules, projections).
//   La synthèse doit créer une question, pas apporter une réponse complète.
//
// Contrat d'entrée extensible : `enrichment` (eau, cadmium, sols suivis) est
// optionnel. Tant qu'il est absent, la synthèse s'appuie sur les seules données
// du match. On le branchera ensuite sans changer la signature.
//
// Routing modèle : Anthropic direct tant que le produit n'est pas en vente.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

// Glose humaine des clés de préférence (jamais le terme technique côté prompt).
const PREF_LABELS: Record<string, string> = {
  faible_chaleur: "des étés plus frais",
  douceur_climat: "un climat doux",
  ensoleillement_recherche: "du soleil et de la chaleur",
  faible_secheresse: "des sols peu exposés à la sécheresse",
  faible_risque_feu: "un faible risque de feu",
  faible_precip_extremes: "moins de pluies intenses",
  proximite_mer: "la proximité de la mer",
  cadre_calme: "un cadre calme",
  eviter_isolement: "ne pas être isolé",
  air_sain: "un air plus pur",
  acces_soins: "un bon accès aux soins",
  acces_services: "des services du quotidien accessibles",
  faible_pression_agricole: "un environnement peu marqué par l'agriculture intensive",
};

const SYSTEM = `Vous écrivez la synthèse éditoriale du Comparateur de vie de futur•e.

Le moteur a DÉJÀ choisi les territoires de façon déterministe. Vous n'en changez
aucun, vous n'en ajoutez aucun, vous ne les classez pas. Vous INTERPRÉTEZ.

OBJECTIF
Créer l'effet « ce produit a compris mon projet », puis donner envie d'explorer.
Vous créez une question, vous n'apportez pas une réponse complète.

DEUX RÉGIMES
- Généreux sur l'INTERPRÉTATION DU PROJET : dites ce que la recherche révèle au
  fond (un besoin d'équilibre, une priorité, une tension). C'est le cœur de la
  valeur.
- Avare sur le DÉTAIL DES COMMUNES : restez qualitatif, ne livrez pas tout. Le
  manque crée la curiosité.

FRONTIÈRE AVEC LE RAPPORT
Vous parlez des RAISONS (pourquoi ces territoires ressortent). Vous ne parlez
jamais des CONSÉQUENCES détaillées (ça, c'est le rapport). Donc :
- aucun chiffre, aucun pourcentage, aucune donnée brute, aucun horizon daté ;
- vocabulaire qualitatif uniquement : faible, modéré, élevé, plus exposé, moins
  exposé, accès favorable, accès plus limité ;
- jamais de résumé exhaustif des dimensions, jamais d'inventaire.

STRUCTURE (court, 110 à 170 mots, 1 à 2 paragraphes)
1. Ce que le projet révèle (interprétation, le miroir).
2. La logique d'ensemble des territoires proposés (l'arbitrage qu'ils représentent).
3. Le ou les compromis principaux, nommés honnêtement. Le compromis est un pont :
   il pointe vers ce qu'on gagnerait à regarder de plus près.
4. Si aucun territoire ne réunit tout : dites-le clairement, ce sont les options
   qui impliquent le moins de compromis.
5. Rappelez implicitement que la décision appartient au lecteur.

TON
Vous êtes intelligent mais simple et direct. Vous EXPLIQUEZ, vous n'interprétez
pas plus que nécessaire. Phrases courtes, mots concrets, vocabulaire courant.
- Évitez les tournures littéraires et les aphorismes, en particulier les
  antithèses du type « moins une fuite qu'une relocalisation choisie » ou
  « ce n'est pas X, c'est Y ». Dites simplement les choses.
- Pas d'envolées abstraites (« un projet de repli choisi », « une quête de
  sens »). Parlez du projet réel, pas d'une idée de projet.
- Une personne pressée doit comprendre du premier coup. Si une phrase sonne
  comme une citation, réécrivez-la plus simplement.

INTERDITS
- Jamais « top », « meilleures villes », « classement », « numéro 1 ».
- Jamais alarmiste, jamais prescriptif (« vous devriez vivre à… »).
- Jamais les termes techniques internes (« IFT », « pression agricole »,
  « percentile »). Dites « environnement agricole marqué » ou « peu marqué ».
- « pression » n'est pas « exposition » ; un suivi environnemental public n'est
  pas un danger. Formulez avec prudence et incertitude.
- Vouvoiement. Aucun tiret cadratin (virgule ou deux points). Aucun point d'exclamation.
- Ne donnez pas l'impression que la commune est déjà comprise. Donnez envie de l'ouvrir.
- N'attribuez jamais à l'utilisateur un critère qu'il n'a pas formulé. Certains
  critères sont déduits (ex. « ne pas être isolé » pour un projet familial) :
  présentez-les comme votre lecture (« pour élever un enfant, un cadre qui ne soit
  pas trop isolé compte souvent »), jamais comme sa demande (« vous ne voulez pas
  être isolé »). S'il ne l'a pas dit, ne le lui faites pas dire.

PÉRIMÈTRE ET ORIENTATION GÉOGRAPHIQUES
- perimetre_geographique (cadre dur) : l'utilisateur a CHOISI cette zone, tous les
  territoires proposés y sont. Choix délibéré : ne suggérez jamais de regarder
  ailleurs, ne le présentez pas comme une limite subie.
- orientation_geographique (penchant) : l'utilisateur PRÉFÈRE cette zone sans s'y
  limiter. Les résultats penchent vers elle mais peuvent en sortir si un territoire
  est nettement plus pertinent. Ne la présentez jamais comme une frontière ; vous
  pouvez noter le penchant et expliquer un résultat hors zone.
- Dans les deux cas : nommez la zone en langage humain, ne récitez aucun
  département, n'inventez aucune caractéristique. Si les deux sont absents, la
  recherche est nationale, n'évoquez pas de périmètre.

Si des éléments de santé environnementale (eau, sols, sites suivis) vous sont
fournis, mentionnez-les une fois, avec prudence et au conditionnel, sans jamais
les présenter comme un verdict. S'ils sont absents, n'en parlez pas.`;

type Body = {
  project?: string;
  reformulation?: string;
  preferences?: { key: string; weight: number }[];
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null }[];
  outcome?: { perfectMatch?: boolean; message?: string | null };
  perimetre?: string[]; // ancres dures = cadre choisi (tous les territoires y sont)
  orientation?: string[]; // ancres souples = penchant (résultats inclinés, sans s'y limiter)
  enrichment?: Record<string, unknown>; // extensible : eau / cadmium / sols suivis (à venir)
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return new Response("Corps invalide.", { status: 400 });
  }

  const results = Array.isArray(body.results) ? body.results : [];
  if (results.length === 0) {
    return new Response("Aucun résultat à interpréter.", { status: 400 });
  }

  const prefs = (body.preferences ?? [])
    .map((p) => PREF_LABELS[p.key])
    .filter(Boolean);

  const perimetre = Array.isArray(body.perimetre) ? body.perimetre.filter((s) => typeof s === "string" && s) : [];
  const orientation = Array.isArray(body.orientation) ? body.orientation.filter((s) => typeof s === "string" && s) : [];

  // Payload sobre : pas de chiffres, uniquement le qualitatif déjà produit par le moteur.
  const payload = {
    projet: body.project ?? null,
    reformulation: body.reformulation ?? null,
    ce_que_l_utilisateur_cherche: prefs,
    perimetre_geographique: perimetre.length ? perimetre : null,
    orientation_geographique: orientation.length ? orientation : null,
    aucun_territoire_parfait: body.outcome?.perfectMatch === false,
    message_moteur: body.outcome?.message ?? null,
    territoires: results.map((r) => ({
      commune: r.nom,
      region: r.region ?? null,
      raisons: r.reasons ?? [],
      compromis: r.tradeoff ?? null,
    })),
    sante_environnementale: body.enrichment ?? null,
  };

  const userMessage = `Interprétez ce résultat selon vos règles. Ne récitez pas le payload, ne citez aucun chiffre, paraphrasez les raisons en qualitatif.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-5"),
    system: SYSTEM,
    prompt: userMessage,
    onError: ({ error }) => {
      console.error("[comparateur-vie/synthesize] streamText error:", error);
    },
  });

  // Probe du premier chunk : vrai 502 si l'IA est down (le client bascule sur
  // un fallback déterministe à base des raisons du moteur).
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[comparateur-vie/synthesize] first chunk failed:", err);
    return new Response("AI provider unavailable.", { status: 502 });
  }
  if (firstChunk.done) {
    return new Response("Empty stream from AI provider.", { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controller.enqueue(encoder.encode(firstChunk.value));
      try {
        for (;;) {
          const next = await iter.next();
          if (next.done) break;
          controller.enqueue(encoder.encode(next.value));
        }
        controller.close();
      } catch (err) {
        try {
          controller.error(err);
        } catch {
          /* stream déjà terminé côté client */
        }
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
