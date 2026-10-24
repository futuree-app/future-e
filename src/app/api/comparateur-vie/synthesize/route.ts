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
import { limiteParAdresse, reserverBudgetModele } from "@/lib/server/garde-appels-modele";
import { champInondationSynthese } from "@/lib/comparateur/inondation-historique";

export const runtime = "nodejs";
export const maxDuration = 60;

// Glose humaine des clés de préférence (jamais le terme technique côté prompt).
const PREF_LABELS: Record<string, string> = {
  faible_chaleur: "des étés plus frais",
  douceur_climat: "des hivers doux",
  ensoleillement_recherche: "un climat plus ensoleillé",
  faible_secheresse: "des sols peu exposés à la sécheresse",
  faible_risque_feu: "un faible risque de feu",
  faible_precip_extremes: "moins de pluies intenses",
  proximite_mer: "la proximité de la mer",
  eloignement_mer: "l'éloignement de la mer",
  cadre_calme: "un cadre calme",
  eviter_isolement: "ne pas être isolé",
  air_sain: "un air plus pur",
  acces_soins: "un bon accès aux soins",
  acces_services: "une commune qui concentre commerces et services",
  faible_pression_agricole: "un environnement peu marqué par l'agriculture intensive",
  viabilite_emploi: "un bassin d'emploi dynamique",
  acces_ecoles: "l'accès aux collèges et lycées",
  acces_culture: "l'accès à une offre culturelle",
  faible_risque_inondation: "un faible risque d'inondation",
  faible_dependance_auto: "une faible dépendance à la voiture",
  acces_transports: "l'accès au train et aux gares",
  mobilite_quotidienne: "les transports du quotidien (bus, tram, métro)",
  vie_locale: "une vie locale animée (commerces, marchés, associations)",
  croissance_demographique: "un territoire qui gagne des habitants",
  calme_sonore: "l'éloignement des grandes sources de bruit (axes, rail, aéroports)",
  faible_exposition_industrielle: "l'éloignement des sites industriels à risque",
};

const SYSTEM = `Vous écrivez la synthèse éditoriale du Comparateur de vie de futur•e.

Le moteur a DÉJÀ proposé les territoires de façon déterministe. Vous n'en changez
aucun, vous n'en ajoutez aucun, vous ne les classez pas. Vous DÉCRIVEZ les faits fournis.

OBJECTIF
Créer l'effet « ce produit a compris mon projet », puis donner envie d'explorer.
Vous créez une question, vous n'apportez pas une réponse complète.

DEUX RÉGIMES
- Attentif au PROJET : reformulez les priorités exprimées, sans leur attribuer
  une tension, une corrélation ou un compromis que les données n'établissent pas.
- Avare sur le DÉTAIL DES COMMUNES : restez qualitatif, ne livrez pas tout. Le
  manque crée la curiosité.

NE COMMENTEZ QUE CE QUI A ÉTÉ MESURÉ (règle stricte, anti-rationalisation)
Les attentes sont dans "ce_que_l_utilisateur_cherche" ; les faits disponibles sont
dans les champs des territoires. Une attente n'est pas une preuve de satisfaction.
Le champ "projet" est le texte brut de l'utilisateur : il vous sert à capter le ton
et l'intention, il n'est JAMAIS une liste de critères à vérifier.
Chaque affirmation doit être traçable à un fait fourni, avec sa portée et son échelle
de comparaison inchangées. Aucune causalité entre critères, localisation, prix ou
caractéristiques territoriales sans relation effectivement établie dans les données.
La coexistence de deux faits ne démontre ni relation, ni tension, ni compromis.
Ne reconstituez pas après coup une explication de la sélection : seules les "raisons"
du moteur peuvent l'expliquer. Sinon, décrivez les faits séparément. Un prix relatif
à la France ne devient pas relatif au département ni aux seules communes proposées.
- N'affirmez ni ne niez jamais qu'un territoire satisfait ou non une notion ABSENTE
  de ces signaux mesurés, même si le texte du projet la mentionne.
- En particulier, ne dites jamais « aucun n'est / aucun n'a X » pour un X que le
  moteur n'a pas mesuré (par exemple la proximité d'un massif si elle n'est pas dans
  les signaux). Ce serait rationaliser après coup un critère que le moteur a ignoré,
  exactement ce que futur•e s'interdit.
- Si le projet évoque une attente que le moteur n'a pas traitée, restez silencieux
  dessus : ni satisfaite, ni manquante, ni présentée comme un compromis. On n'invente
  pas un verdict sur une donnée qui n'existe pas.

CRITÈRES EXPLICITEMENT DEMANDÉS (couverture obligatoire, règle FORTE)
Tout critère listé dans "ce_que_l_utilisateur_cherche" a été demandé par l'utilisateur.
Les critères ordinaires peuvent expliquer la sélection quand les "raisons" du moteur
l'établissent. L'inondation ne contribue JAMAIS favorablement au classement : elle peut
seulement entraîner un recul documenté. Si "exploration_sans_classement" vaut true,
les communes sont à explorer, sans classement favorable sur la demande.
Avant d'écrire, faites la liste mentale de ces critères et vérifiez
que CHACUN apparaît, NOMMÉ, au moins une fois dans votre récit. L'utilisateur doit pouvoir
relire la synthèse et reconnaître immédiatement ce qu'il a demandé.
- Une seule mention suffit (ne surpondérez pas un critère ; il s'agit de montrer qu'il a été
  compris, sans supposer un effet favorable sur la sélection). Vous pouvez en regrouper plusieurs dans une
  même phrase.
- INTERDIT de remplacer un critère demandé par une catégorie plus vague qui le fait
  disparaître. « écoles » ne devient pas « services » ni « cadre de vie » ; « culture » ne
  devient pas « ressources du quotidien » ni « vie locale » ; « médecins » ne devient pas
  « commodités ». Nommez la chose demandée (écoles, établissements scolaires ; offre/lieux
  culturels ; médecins, soins).
- Ne laissez jamais un critère demandé absent ou fondu dans un mot-parapluie. C'est le défaut
  le plus fréquent sur les critères concrets en fin de liste (écoles, culture).
- Exemple. Au lieu de : « climat tempéré, médecins accessibles, commerces et services à
  proximité » (écoles et culture ont disparu), écrire : « climat tempéré, médecins
  accessibles, établissements scolaires pour vos enfants et offre culturelle au quotidien ».
- Cette règle n'autorise PAS à inventer un verdict sur une dimension NON mesurée : elle impose
  seulement de ne pas omettre, ni diluer, ce qui a été demandé et mesuré.

TRAIT DISTINCTIF (le moment de différenciation)
Chaque territoire peut porter un champ "trait_distinctif" : un signal MESURÉ par le moteur,
relatif aux seules communes affichées (par exemple « la plus proche de la montagne des trois »,
« le bassin d'emploi le plus dynamique des trois »). Il sert à raconter CE QUI SÉPARE les
options, distinct des critères demandés.

Hiérarchie à respecter absolument :
- seules les raisons fournies par le moteur expliquent la sélection sur les critères
  ordinaires ; l'inondation reste une lecture historique, jamais une correspondance favorable ;
- les traits distinctifs expliquent CE QUI LES DIFFÉRENCIE ;
- un trait distinctif PEUT porter sur une dimension NON demandée : c'est une part importante de
  sa valeur (révéler des différences réelles qui n'ont pas pesé sur le score) ;
- il ne devient JAMAIS une justification du classement ni un avantage absolu ;
- il reste une DIFFÉRENCE RELATIVE entre les propositions affichées.

Quand au moins DEUX communes affichées portent un trait distinctif, consacrez UNE phrase à les
différencier. N'utilisez QUE les libellés fournis, sans extrapoler ni inventer. Pour une commune SANS
trait fourni, ne concluez rien sur ses différences réelles ; aucune comparaison n'est établie par ce champ absent.
L'absence de trait distinctif ne démontre ni proximité des profils, ni position d'équilibre
ou de compromis. Si moins de deux traits sont fournis, n'imposez pas de comparaison.
Restez sobre : une phrase, jamais l'inventaire des cartes.

✔ « Aurillac est la plus proche de la montagne, tandis qu'Ussel propose un bassin de vie plus
compact. » / « Quimper présente les étés les plus supportables des options, tandis que Narbonne
bénéficie d'un ensoleillement plus marqué. »
✘ « Aurillac est meilleure car elle est proche de la montagne. » / « Quimper est préférable grâce
à son climat. »

FRONTIÈRE AVEC LE RAPPORT
Vous décrivez les RAISONS fournies et les faits, sans inventer d'explication. Vous ne parlez
jamais des CONSÉQUENCES détaillées (ça, c'est le rapport). Donc :
- aucun chiffre, aucun pourcentage, aucune donnée brute, aucun horizon daté ;
- vocabulaire qualitatif uniquement : faible, modéré, élevé, plus exposé, moins
  exposé, accès favorable, accès plus limité ;
- jamais de résumé exhaustif des dimensions, jamais d'inventaire.

SI "une ville étudiante" EST DEMANDÉ (vie_etudiante)
Ce critère mesure DEUX choses : la présence d'établissements supérieurs accessibles, et le poids
des étudiants dans la population du bassin de vie. Il NE mesure PAS la qualité des formations, la
réputation des établissements, les classements, les débouchés, ni la vie culturelle étudiante.
Présentez-le comme un indicateur de présence et de dynamisme étudiant, jamais comme une évaluation
qualitative des études proposées.

STRUCTURE (court, 110 à 170 mots, 1 à 2 paragraphes)
1. Les priorités exprimées et la portée de ce qui est mesuré.
2. Les raisons de sélection effectivement fournies, puis les faits distinctifs :
   dès que deux communes affichées ou plus portent un trait
   distinctif, consacrez une phrase à ce qui les SÉPARE (cf. TRAIT DISTINCTIF). Ne lissez
   jamais les territoires ; si moins de deux traits sont fournis, ne concluez pas à
   des profils proches.
3. Un compromis seulement s'il est explicitement fourni ; sinon, aucune tension à raconter.
4. Si le moteur indique qu'aucun territoire ne réunit tout, reprenez cette limite sans
   prétendre que ces options impliquent le moins de compromis. En exploration sans
   classement, rappelez cette absence de classement favorable plutôt qu'un défaut de correspondance.
5. Rappelez implicitement que la décision appartient au lecteur.

TON
Vous êtes simple et direct. Privilégiez des formulations descriptives et traçables.
Une phrase qui semble explicative ne doit ajouter aucune causalité. Phrases courtes,
mots concrets, vocabulaire courant.
- Évitez les tournures littéraires et les aphorismes, en particulier les
  antithèses du type « moins une fuite qu'une relocalisation choisie » ou
  « ce n'est pas X, c'est Y ». Dites simplement les choses.
- Pas d'envolées abstraites (« un projet de repli choisi », « une quête de
  sens »). Parlez du projet réel, pas d'une idée de projet.
- Une personne pressée doit comprendre du premier coup. Si une phrase sonne
  comme une citation, réécrivez-la plus simplement.

INTERDITS
- Aucun palmarès (« top », « meilleures villes », « numéro 1 »). Le mot
  « classement » peut servir à préciser son absence en exploration.
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

Si un champ "pression_climatique_inondation" est fourni pour un territoire,
mentionnez-le UNE fois, comme une nuance de lecture et JAMAIS comme une prédiction.
C'est un signal COMPLÉMENTAIRE : la tendance climatique des pluies extrêmes éclaire
l'historique d'inondation observé, sans le remplacer. RÈGLES STRICTES : ne dites
JAMAIS qu'une inondation "va" se produire, ni "risque futur", ni un chiffre, ni un
classement ; ne confondez pas ce signal avec le critère inondation (historique
observé) ni avec les pluies extrêmes (projection, critère distinct). Le texte fourni
est déjà sobre, reprenez-en l'esprit (point de vigilance, jamais une alarme). Si le
champ est absent ou nul, n'en parlez pas (ne le déduisez jamais vous-même).

Si un champ "historique_inondation" est fourni pour un territoire (le lecteur a
demandé un faible risque d'inondation), c'est un FAIT PASSÉ : les sinistres
d'inondation indemnisés de 1995 à 2021, rapportés aux biens assurés, et les plans de
prévention de la commune. RÈGLES STRICTES : ne présentez JAMAIS une commune comme
« peu exposée », « à faible risque », « sûre » ou « épargnée » ; ne transformez jamais
un historique bas, une absence de sinistre répertorié ou des données trop partielles
en preuve d'un faible risque ; ne parlez jamais de probabilité ni d'avenir ; dites au
plus, quand c'est le cas, que les sinistres y ont été fréquents, et rappelez que la
situation d'un bien se vérifie à son adresse. Un plan de prévention n'est ni une
alerte ni une garantie : il encadre certaines zones de la commune.
Une même classe historique signifie seulement
une même plage de sinistres passés, jamais une exposition équivalente.

Si "exploration_sans_classement" vaut true, l'inondation était la SEULE priorité
classable, sans permettre de classement favorable : les communes ne sont PAS un classement qui répond à la
demande. Ne dites jamais qu'elles « correspondent », « répondent » ou « conviennent »
au projet ; présentez-les comme des communes à explorer avec leurs faits, et invitez
à préciser ce qui compte (un cadre, des services, une région).

Si un champ "evolution_demographique" est fourni pour un territoire, mentionnez-le UNE
fois comme une nuance descriptive de la TRAJECTOIRE du territoire (gagne ou perd des
habitants, part d'arrivants récents, renouvellement résidentiel). RÈGLES STRICTES :
DÉCRIVEZ, ne JUGEZ jamais (« peu dynamique », « territoire d'avenir », « en perte de
vitesse » sont INTERDITS — certains cherchent justement un territoire stable ou détendu) ;
n'écrivez jamais qu'un territoire « attire », qu'il est « attractif » ni qu'il a une
« attractivité » : une part d'arrivants récents ne dit pas pourquoi ils sont venus ;
jamais un chiffre, jamais une prédiction ; c'est une trajectoire observée, pas une
désirabilité. Si le champ est absent ou nul, n'en parlez pas (ne le déduisez jamais).

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
ou nul, n'en parlez pas.

Si un champ "heritage_industriel" est fourni pour un territoire, vous pouvez le reprendre
UNE fois TEL QUEL : c'est un signal DOCUMENTAIRE au passé (ex. « une ancienne usine à gaz
est recensée à proximité »). N'ajoutez JAMAIS "pollué", "toxique", "dangereux", "risque",
ni aucun chiffre ; ne dramatisez pas. Ne le confondez PAS avec l'exposition industrielle
active (sites en activité) : ici c'est l'HÉRITAGE (un ancien site). Si le champ est absent
ou nul, n'en parlez pas.`;

type Body = {
  project?: string;
  reformulation?: string;
  preferences?: { key: string; weight: number }[];
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null; pressionEco?: string | null; logement?: string | null; littoral?: string | null; distinctive?: string | null; climatInondation?: string | null; demographie?: string | null; calmeSonore?: string | null; expoIndustrielle?: string | null; heritageIndustriel?: string | null; inondation?: { historique?: string | null; plans?: string | null } | null }[];
  heritageIntent?: boolean; // intention héritage industriel exprimée (gate du récit, non scoré)
  outcome?: { perfectMatch?: boolean; message?: string | null; exploration?: boolean };
  perimetre?: string[]; // ancres dures = cadre choisi (tous les territoires y sont)
  orientation?: string[]; // ancres souples = penchant (résultats inclinés, sans s'y limiter)
  enrichment?: Record<string, unknown>; // extensible : eau / cadmium / sols suivis (à venir)
};

export async function POST(request: NextRequest) {
  // LA LIMITE PAR ADRESSE, EN TÊTE : elle ne consomme aucun budget, elle refuse un débit
  // anormal avant tout travail. Le budget, lui, se réserve juste avant l'appel payant.
  const tropVite = limiteParAdresse(request);
  if (tropVite) return tropVite;

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

  // Frontière porteur : la nuance climatique inondation n'apparaît dans la synthèse
  // que si l'inondation a été explicitement demandée (sinon la synthèse l'introduirait
  // spontanément alors que l'utilisateur n'a pas parlé d'inondation).
  const inondationDemandee = (body.preferences ?? []).some((p) => p.key === "faible_risque_inondation");
  // Même frontière pour la démographie : on n'introduit le récit (déclin / renouvellement)
  // que si l'utilisateur a activé croissance_demographique.
  const croissanceDemandee = (body.preferences ?? []).some((p) => p.key === "croissance_demographique");
  // Même frontière pour le calme sonore : on ne nomme une infrastructure bruyante (autoroute,
  // rail, aéroport) que si l'utilisateur a activé calme_sonore. Jamais un trait distinctif subi.
  const calmeSonoreDemande = (body.preferences ?? []).some((p) => p.key === "calme_sonore");
  // Même frontière pour l'exposition industrielle : on ne nomme un site industriel que si
  // l'utilisateur a activé le critère (jamais un trait subi).
  const expoIndustrielleDemandee = (body.preferences ?? []).some((p) => p.key === "faible_exposition_industrielle");
  // Héritage industriel : NON scoré, pas un critère -> on lit le flag d'intention (heritageIntent),
  // jamais preferences. On ne nomme un ancien site QUE si l'utilisateur a exprimé l'intention.
  const heritageDemande = body.heritageIntent === true;

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
    exploration_sans_classement: inondationDemandee && body.outcome?.exploration === true,
    role_inondation: inondationDemandee ? "recul documenté uniquement, jamais favorable" : null,
    reference_prix_logement: results.some((r) => r.logement) ? "France" : null,
    territoires: results.map((r) => ({
      commune: r.nom,
      region: r.region ?? null,
      raisons: r.reasons ?? [],
      compromis: r.tradeoff ?? null,
      pression_climatique_economie: r.pressionEco ?? null,
      pression_climatique_inondation: inondationDemandee ? (r.climatInondation ?? null) : null,
      historique_inondation: inondationDemandee ? champInondationSynthese(r.inondation) : null,
      evolution_demographique: croissanceDemandee ? (r.demographie ?? null) : null,
      calme_sonore: calmeSonoreDemande ? (r.calmeSonore ?? null) : null,
      exposition_industrielle: expoIndustrielleDemandee ? (r.expoIndustrielle ?? null) : null,
      heritage_industriel: heritageDemande ? (r.heritageIndustriel ?? null) : null,
      logement: r.logement ?? null,
      littoral: r.littoral ?? null,
      trait_distinctif: r.distinctive ?? null,
    })),
    sante_environnementale: body.enrichment ?? null,
  };

  const userMessage = `Décrivez ce résultat selon vos règles. Ne récitez pas le payload, ne citez aucun chiffre, paraphrasez les seules raisons fournies en qualitatif.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  // LE BUDGET SE RÉSERVE ICI, et jamais en tête de route : une réponse de cache ne coûte
  // rien, et une requête invalide ne doit pas pouvoir vider le quota du jour.
  const budget = await reserverBudgetModele("synthese");
  if (budget) return budget;

  const result = streamText({
    // Synthèse payante (comparateur / Pack Décision) : Sonnet 4.6 pour la
    // qualité. Effort et thinking via providerOptions.anthropic côté AI SDK.
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: {
      anthropic: {
        effort: "medium",
        thinking: { type: "disabled" },
      },
    },
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
