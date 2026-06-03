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
  viabilite_emploi: "un bassin d'emploi dynamique",
  acces_ecoles: "l'accès aux collèges et lycées",
  acces_culture: "l'accès à une offre culturelle",
  faible_risque_inondation: "un faible risque d'inondation",
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

NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ (règle stricte, anti-rationalisation)
Le moteur n'a évalué QUE les critères listés dans "ce_que_l_utilisateur_cherche",
"perimetre_geographique" et "orientation_geographique", plus les "raisons", les
"compromis" et le "trait_distinctif" de chaque territoire. Le champ "projet" est le texte brut de
l'utilisateur : il vous sert à capter le ton et l'intention, il n'est JAMAIS une
liste de critères à vérifier.
- N'affirmez ni ne niez jamais qu'un territoire satisfait ou non une notion ABSENTE
  de ces signaux mesurés, même si le texte du projet la mentionne.
- En particulier, ne dites jamais « aucun n'est / aucun n'a X » pour un X que le
  moteur n'a pas mesuré (par exemple la proximité d'un massif si elle n'est pas dans
  les signaux). Ce serait rationaliser après coup un critère que le moteur a ignoré,
  exactement ce que futur•e s'interdit.
- Si le projet évoque une attente que le moteur n'a pas traitée, restez silencieux
  dessus : ni satisfaite, ni manquante, ni présentée comme un compromis. On n'invente
  pas un verdict sur une donnée qui n'existe pas.

CRITÈRES EXPLICITEMENT DEMANDÉS (couverture obligatoire)
Tout critère listé dans "ce_que_l_utilisateur_cherche" a été demandé par l'utilisateur ET
utilisé au classement. Chacun doit apparaître AU MOINS UNE FOIS dans votre récit, au moins
qualitativement (vous pouvez en regrouper plusieurs dans une même phrase). Ne laissez jamais
un critère demandé totalement absent du texte : l'utilisateur l'a formulé, il doit se
retrouver dans la lecture. Cela vaut surtout pour les critères concrets faciles à oublier
(par exemple l'accès aux écoles ou à la culture). Cette règle n'autorise PAS à inventer un
verdict sur une dimension non mesurée : elle impose seulement de ne pas omettre ce qui a été
demandé et mesuré.

TRAIT DISTINCTIF (signal mesuré, à manier avec parcimonie)
Chaque territoire peut porter un champ "trait_distinctif" : un signal MESURÉ par le
moteur, relatif aux seules communes affichées (par exemple « la plus pluvieuse des
trois » ou « le meilleur accès aux médecins des trois »). Vous pouvez vous en servir
pour dire ce qui distingue un territoire des autres, même si l'utilisateur ne l'a pas
demandé : c'est une vraie différence, ce n'est pas un critère de classement.
Règles : ne commentez que le contenu exact du champ, n'inventez aucun second trait,
n'en faites pas un critère de tri, présentez-le comme une différence relative entre
les options proposées, n'extrapolez pas au-delà du libellé.
Usage SÉLECTIF : servez-vous d'un trait distinctif seulement quand il aide vraiment à
raconter l'arbitrage. Ne les listez pas, n'en faites pas l'inventaire, ne paraphrasez
pas les cartes. Si un trait n'éclaire rien ou alourdit le récit, ignorez-le. Certains
territoires n'en ont pas : n'en inventez aucun pour eux.

FRONTIÈRE AVEC LE RAPPORT
Vous parlez des RAISONS (pourquoi ces territoires ressortent). Vous ne parlez
jamais des CONSÉQUENCES détaillées (ça, c'est le rapport). Donc :
- aucun chiffre, aucun pourcentage, aucune donnée brute, aucun horizon daté ;
- vocabulaire qualitatif uniquement : faible, modéré, élevé, plus exposé, moins
  exposé, accès favorable, accès plus limité ;
- jamais de résumé exhaustif des dimensions, jamais d'inventaire.

STRUCTURE (court, 110 à 170 mots, 1 à 2 paragraphes)
1. Ce que le projet révèle (interprétation, le miroir).
2. La logique d'ensemble des territoires proposés (l'arbitrage qu'ils représentent),
   et ce qui distingue les uns des autres quand un trait distinctif le permet. Ne
   lissez pas les territoires : s'ils se ressemblent, dites aussi ce qui les sépare.
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
les présenter comme un verdict. S'ils sont absents, n'en parlez pas.

Si un champ "pression_climatique_economie" est fourni pour un territoire,
mentionnez-le UNE fois, comme une note de lecture prudente : une part de l'économie
locale repose sur une activité sensible à un aléa climatique. RÈGLES STRICTES :
jamais le mot "résilience" ni "fragile" ; ne dites jamais qu'un territoire "va
décliner", est "menacé" ou "condamné" ; aucun verdict sur son avenir économique.
Vous pouvez rappeler que la capacité d'adaptation n'est pas mesurée. Si le champ est
absent ou nul, n'en parlez pas (ne le déduisez jamais vous-même).

Si un champ "logement" est fourni pour un territoire, vous pouvez le mentionner UNE
fois comme une information pratique : c'est un NIVEAU DE PRIX relatif (achat et/ou
loyers, par rapport au reste de la France), déjà formulé en clair. RÈGLES : reprenez
le sens tel quel (plus cher / moins cher), jamais un chiffre, jamais "abordable" ni
un jugement d'accessibilité (on ne sait pas le budget du lecteur), jamais un verdict.
Si le champ est absent ou nul, n'en parlez pas (notamment : l'absence de donnée
d'achat en Alsace-Moselle n'est pas un marché "moyen", ne l'interprétez pas).

Si un champ "littoral" est fourni pour un territoire, vous pouvez l'évoquer UNE fois,
en LANGAGE CLAIR : la commune est exposée à l'ÉROSION du littoral (la côte y recule).
N'employez JAMAIS le jargon "inscrite au titre du recul du trait de côte" et ne citez
pas la loi : parlez simplement d'érosion côtière, sobrement, jamais comme une alarme,
sans "menace" ni commune "condamnée", sans vitesse ni chiffre. Si le champ est absent
ou nul, n'en parlez pas.`;

type Body = {
  project?: string;
  reformulation?: string;
  preferences?: { key: string; weight: number }[];
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null; pressionEco?: string | null; logement?: string | null; littoral?: string | null; distinctive?: string | null }[];
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
      pression_climatique_economie: r.pressionEco ?? null,
      logement: r.logement ?? null,
      littoral: r.littoral ?? null,
      trait_distinctif: r.distinctive ?? null,
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
