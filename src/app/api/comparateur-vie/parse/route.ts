// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · PARSE
// POST { text } → projet structuré (contraintes dures + préférences pondérées).
//
// L'IA ne choisit AUCUNE commune ici. Elle traduit un projet de vie en langage
// libre vers une structure exploitable par le moteur déterministe (match).
// Sortie garantie via Anthropic tool use (pas de parsing texte fragile).
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";
import { PREFERENCE_KEYS, type ParsedProject } from "@/lib/comparateur-vie";
import { ANCHOR_ZONE_TOKENS, EXCLUSION_ZONE_TOKENS } from "@/lib/geo-zones";

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    reformulation: {
      type: "string",
      description:
        "1 à 2 phrases, vouvoiement, reformulant ce que futur•e a compris du projet. Aucun tiret cadratin.",
    },
    hardConstraints: {
      type: "object",
      description:
        "Critères qui ÉLIMINENT les communes. Ne remplir que ce qui est EXPLICITE. En cas de doute, ne pas mettre en contrainte dure : utiliser une préférence ou une ambiguïté.",
      properties: {
        departements: { type: "array", items: { type: "string" }, description: "Codes département à 2 chiffres (ex: '17','2A') UNIQUEMENT si l'utilisateur cite un département précis. N'inventez jamais une liste de départements pour traduire une zone (le Sud, l'Atlantique, la Bretagne…) : passez par zones." },
        zones: {
          type: "array",
          items: {
            type: "object",
            properties: {
              zone: { type: "string", enum: [...ANCHOR_ZONE_TOKENS] },
              strength: { type: "string", enum: ["hard", "preferred", "inspiration"] },
            },
            required: ["zone", "strength"],
          },
          description:
            "Ancres géographiques avec FORCE. Chaque ancre = { zone, strength }. Jetons (liste fermée) : régions administratives (bretagne, normandie, pays_de_la_loire, nouvelle_aquitaine, occitanie, provence_alpes_cote_d_azur, auvergne_rhone_alpes, bourgogne_franche_comte, grand_est, hauts_de_france, centre_val_de_loire, ile_de_france), macro-zones (sud, sud_ouest, sud_est, nord, est, grand_ouest, centre), façades (atlantique, manche, mediterranee, cote_basque), massifs (alpes, pyrenees, massif_central, vosges, jura, corse). Le moteur détient la table jeton → départements. FORCE : 'hard' = filtre (nécessité ou mention nue : 'je veux vivre en Bretagne', 'dans le Sud') ; 'preferred' = forte préférence sans exclusion ('j'aimerais bien la Bretagne', 'idéalement le Sud-Ouest') ; 'inspiration' = ouverture légère ('pourquoi pas la Bretagne', 'je suis ouvert au Sud-Ouest'). Jeton LE PLUS SPÉCIFIQUE : 'le Sud-Ouest' → sud_ouest seul (jamais sud aussi). Plusieurs ancres dures = intersection.",
        },
        excludeZones: {
          type: "array",
          items: { type: "string", enum: [...EXCLUSION_ZONE_TOKENS] },
          description:
            "Ancres géographiques NÉGATIVES (zones à EXCLURE). 'quitter Paris' → ['paris'] ; 'loin de la région parisienne' → ['idf'] ; 'pas dans le Nord' → ['nord']. 'fuir la ville' n'est PAS une zone : c'est une taille de commune (communeSize), pas excludeZones.",
        },
        montagne: {
          type: ["object", "null"],
          properties: {
            strength: { type: "string", enum: ["hard", "preferred", "inspiration"] },
          },
          required: ["strength"],
          description:
            "Vivre EN ALTITUDE / à la montagne, par l'altitude de la commune elle-même. Renseignez SI l'utilisateur veut ÊTRE à la montagne ('à la montagne', 'en montagne', 'en altitude', 'un village de montagne', 'en haute montagne'), avec la MÊME force que les zones (hard = nécessité ou mention nue ; preferred = j'aimerais bien ; inspiration = pourquoi pas). NE PAS l'utiliser pour un massif nommé ('près des Pyrénées' = zones), NI pour 'proche d'une montagne' (= reliefProche). null sinon.",
        },
        reliefProche: {
          type: ["object", "null"],
          properties: {
            strength: { type: "string", enum: ["hard", "preferred", "inspiration"] },
          },
          required: ["strength"],
          description:
            "PROCHE d'une montagne / d'un massif, accès au relief SANS forcément vivre en altitude ('proche d'une montagne', 'proche de la montagne', 'près des sommets', 'pour faire de la randonnée en montagne', 'au pied des montagnes'). Distinct de montagne (= être EN altitude) et d'un massif nommé (= zones). Le moteur mesure la proximité d'un massif (un relief élevé est à portée). Force : hard = nécessité ou mention nue ; preferred = souhait ; inspiration = ouverture. null sinon.",
        },
        nearSea: {
          type: "object",
          properties: { active: { type: "boolean" }, maxKm: { type: ["number", "null"] } },
          required: ["active"],
          description: "active=true SEULEMENT si la proximité de la mer est explicitement indispensable ('au bord de la mer', 'il nous faut la mer'). 'pas trop loin de l'océan' ou 'on aime la mer' n'est PAS une contrainte dure : c'est la préférence proximite_mer.",
        },
        excludeSea: { type: "boolean", description: "true si l'utilisateur ne veut PAS le littoral." },
        nearPlace: {
          type: ["object", "null"],
          properties: { label: { type: "string" }, maxKm: { type: ["number", "null"] } },
          description: "Proximité d'un lieu nommé (famille, ville). label = nom de commune/ville. Le moteur le géolocalise, n'inventez pas de coordonnées.",
        },
        communeSize: {
          type: ["object", "null"],
          properties: { min: { type: ["number", "null"] }, max: { type: ["number", "null"] } },
          description: "Taille de commune si explicite. petite ville = {min:5000,max:25000} ; ville moyenne = {min:25000,max:100000} ; grande ville = {min:100000,max:null}.",
        },
        excludePlace: {
          type: "array",
          description:
            "Villes que l'utilisateur veut QUITTER ('quitter Lyon', 'fuir Bordeaux', 'ne plus vivre à Lille'). Le moteur exclut l'agglomération de la ville. Donnez le nom de la ville tel quel. EXCEPTION : Paris et la région parisienne vont dans excludeZones (paris / idf), PAS ici.",
          items: {
            type: "object",
            properties: { label: { type: "string" } },
            required: ["label"],
          },
        },
        sizeRelativeTo: {
          type: ["object", "null"],
          description:
            "Taille relative à une ville citée : 'plus petit que Lyon', 'pas plus grand que Bordeaux', 'une ville plus grande que Niort'. Donnez le nom de la ville et la direction. Le moteur résout la taille.",
          properties: {
            label: { type: "string" },
            direction: { type: "string", enum: ["smaller", "larger"] },
          },
          required: ["label", "direction"],
        },
      },
    },
    preferences: {
      type: "array",
      description: "Critères qui PONDÈRENT le score. Choisir uniquement dans la liste fermée. weight: 1=secondaire, 2=important, 3=essentiel.",
      items: {
        type: "object",
        properties: {
          key: { type: "string", enum: [...PREFERENCE_KEYS] },
          weight: { type: "integer", minimum: 1, maximum: 3 },
        },
        required: ["key", "weight"],
      },
    },
    ambiguities: {
      type: "array",
      description: "Points réellement ambigus à clarifier, avec UNE question simple chacun. Maximum 2. Vide si tout est clair.",
      items: {
        type: "object",
        properties: { topic: { type: "string" }, question: { type: "string" } },
        required: ["topic", "question"],
      },
    },
    horsMesure: {
      type: "array",
      description:
        "Notions exprimées par l'utilisateur qui n'ont AUCUN critère dans le moteur. Ne JAMAIS fabriquer de proxy. Maximum 3. Vide si aucune.",
      items: {
        type: "object",
        properties: {
          term: { type: "string", description: "le mot tel que l'utilisateur l'a dit" },
          kind: { type: "string", enum: ["ecoles", "culture", "affectif"] },
        },
        required: ["term", "kind"],
      },
    },
    emploiHorsSujet: {
      type: "boolean",
      description:
        "true UNIQUEMENT si le projet est explicitement hors-emploi (retraite, télétravail total / 100 % à distance, sans activité, rentier). Supprime le plancher de viabilité du bassin d'emploi (on ne pénalise jamais un tel projet). Ne pas mettre true si l'emploi compte, ni par défaut.",
    },
  },
  required: ["reformulation", "hardConstraints", "preferences"],
};

const SYSTEM = `Vous êtes le moteur de compréhension du Comparateur de vie de futur•e.

Votre rôle : traduire un projet de vie exprimé en langage libre vers une structure (contraintes dures + préférences pondérées). Vous ne choisissez aucune commune et ne nommez aucun territoire.

RÈGLES
- Distinguez fortement ce qui ÉLIMINE (contrainte dure) de ce qui PONDÈRE (préférence). En cas de doute, préférez la préférence : on n'élimine que sur un critère explicite.
- "proche de l'océan / de la mer" = contrainte dure (nearSea.active) UNIQUEMENT si c'est présenté comme indispensable. Sinon, préférence proximite_mer (poids 2 ou 3).
- Climat perçu : distinguez "fuir la chaleur" (faible_chaleur), "rechercher la douceur" (douceur_climat, hivers tempérés), "rechercher le soleil / le chaud" (ensoleillement_recherche). "climat doux" et "agréable" relèvent de douceur_climat, pas de faible_chaleur.
- Inondation vs pluies (ne pas confondre) : "inondation / crue / zone inondable / débordement / ruissellement / sans risque d'inondation" → faible_risque_inondation (risque réel). "pluies intenses / orages violents / grosses averses / précipitations extrêmes" → faible_precip_extremes (pluie, pas inondation). Ne routez JAMAIS "inondation" vers faible_precip_extremes.
- Nature vs calme (faux-ami à ne pas confondre) : "nature" = couvert naturel autour (forêts, prairies, milieux naturels) → nature. "calme / tranquille / peu de monde" = densité, ambiance → cadre_calme. "la campagne" est AMBIGU : selon la phrase, c'est souvent les DEUX (nature + cadre_calme) ; n'activez les deux que si le sens le porte, sinon le plus explicite. Ne confondez jamais "vert/forêts" (nature) avec "calme" (densité).
- N'inventez aucune donnée. Sécurité, prix : hors périmètre, ne créez pas de préférence. L'ACCÈS aux écoles (collèges/lycées) et à une offre culturelle EST mesuré (acces_ecoles / acces_culture, voir LISTE et HORS-MESURE) ; seule leur QUALITÉ / VITALITÉ reste en horsMesure.
- EMPLOI (critère viabilite_emploi = vitalité du bassin d'emploi : taille + diversité sectorielle, jamais la promesse d'un poste précis) :
  • Si l'emploi est un enjeu du projet (besoin de retrouver un poste, conjoint·e qui doit travailler, "trouver du travail", "le marché de l'emploi", projet de vie actif) → préférence viabilite_emploi poids 2. Le détail de VOTRE métier face au climat reste au rapport ; ici on pèse seulement la vitalité du bassin.
  • Si le projet est HORS-EMPLOI (retraite, télétravail total / 100 % à distance, sans activité, rentier) → emploiHorsSujet:true et N'ajoutez PAS viabilite_emploi.
  • Si rien n'indique l'emploi → ne rien mettre (le moteur applique seul un plancher de viabilité par défaut).
- Vouvoiement. Aucun tiret cadratin. Aucun point d'exclamation.

ANCRES GÉOGRAPHIQUES (zones / excludeZones) : règles spécifiques
- Une ancre est un LIEU, pas une préférence. Quand l'utilisateur nomme une région, une zone, une façade ou un massif ("la Bretagne", "le Sud", "le Sud-Ouest", "sur la côte atlantique", "près des Pyrénées"), ajoutez une ancre { zone, strength } dans zones. Les régions administratives sont des jetons de zone comme les autres (il n'y a plus de champ region séparé).
- FORCE de l'ancre (gradient), lisez le MARQUEUR d'intensité, pas la zone :
  • hard = nécessité ou mention nue. Marqueurs : absolument, impérativement, obligatoirement, uniquement, il faut, "je veux rester/vivre en/dans". Une mention nue sans marqueur ("en Bretagne", "dans le Sud", "sur la côte Atlantique") est hard par défaut.
  • preferred = souhait au conditionnel. Marqueurs : j'aimerais bien, idéalement, de préférence, plutôt, si possible.
  • inspiration = ouverture, hypothèse. Marqueurs : pourquoi pas, je suis ouvert à, éventuellement, ça pourrait être, pas contre.
- Polarité d'abord : "surtout pas le Sud" est une exclusion (excludeZones), jamais une ancre positive. L'émotion n'est pas une contrainte : "j'adore le Sud" plafonne à preferred, ne durcit pas.
- NE SÉPAREZ JAMAIS le lieu de sa connotation. "Le Sud" est un LIEU, pas une demande de chaleur. N'ajoutez une préférence climatique (ensoleillement_recherche, faible_chaleur, douceur_climat) QUE si l'utilisateur exprime lui-même ce souhait. Exemple clé : "fuir les canicules tout en restant dans le Sud" → zones:[{zone:"sud",strength:"hard"}] + preference faible_chaleur. Surtout PAS ensoleillement_recherche.
- Jeton le plus spécifique : "le Sud-Ouest" → [{zone:"sud_ouest",...}] uniquement, jamais sud en plus. La force peut différer par ancre : "la mer absolument, pourquoi pas le Sud-Ouest" → nearSea.active=true + zones:[{zone:"sud_ouest",strength:"inspiration"}].
- Façade maritime nommée → zones (atlantique / manche / mediterranee). Mer générique sans façade ("au bord de la mer") → nearSea ou proximite_mer, pas zones.
- RELIEF, trois cas DISTINCTS à ne pas confondre :
  • ÊTRE en altitude (champ montagne) : "à la montagne", "en altitude", "un village de montagne", "en haute montagne" → montagne, force adéquate (mention nue = hard).
  • PROCHE d'une montagne (champ reliefProche) : "proche d'une montagne", "proche de la montagne", "au pied des montagnes", "pour faire de la randonnée", "près des sommets" → reliefProche, force adéquate. C'est l'accès au relief sans vivre en altitude (une ville au pied d'un massif convient). NE confondez PAS avec montagne.
  • Massif NOMMÉ (zones) : "près des Alpes", "dans les Pyrénées" → zones (alpes/pyrenees…), PAS montagne ni reliefProche.
- Exclusions de ZONE → excludeZones (jetons fermés). "pas le Nord" → excludeZones:["nord"]. "quitter Paris" / "la région parisienne" → excludeZones:["paris"|"idf"] (cas spécial petite couronne, NE PAS utiliser excludePlace).
- Exclusion de VILLE → excludePlace. "quitter Lyon", "fuir Bordeaux", "ne plus vivre à Lille", "partir de Nantes" → excludePlace:[{label:"Lyon"}] etc. (le moteur exclut l'agglomération). Une ville n'est PAS un jeton de zone : ne la mettez jamais dans excludeZones.
- TAILLE RELATIVE → sizeRelativeTo. "plus petit que Lyon", "pas plus grand que Bordeaux" → {label:"Lyon", direction:"smaller"}. "plus grand que Niort" → {label:"Niort", direction:"larger"}. Donnez le label brut, jamais une population.
- Vous ne fournissez QUE des jetons et leur force. N'écrivez jamais vous-même de liste de départements.

PRÉFÉRENCES DISPONIBLES (liste fermée)
- faible_chaleur : étés plus frais, moins de canicules
- douceur_climat : hivers tempérés, climat doux et agréable
- ensoleillement_recherche : plus chaud et plus ensoleillé, sud
- faible_secheresse : sols moins exposés à la sécheresse
- faible_risque_feu : faible risque d'incendie
- faible_precip_extremes : moins de pluies intenses / orages violents / épisodes de précipitations extrêmes (PAS le risque d'inondation réel)
- faible_risque_inondation : faible risque d'inondation fluviale/pluviale (historique d'arrêtés CatNat inondation). Pour « inondation », « inondable », « zone inondable », « crue », « débordement », « ruissellement », « sans risque d'inondation »
- proximite_mer : proche du littoral (version souple)
- cadre_calme : moins dense, calme mais habitable
- eviter_isolement : commune suffisamment vivante, pas isolée
- air_sain : air de fond plus pur (moins de particules fines)
- acces_soins : bon accès aux médecins
- acces_services : services et commerces accessibles
- faible_pression_agricole : éloigné des cultures à traitements fréquents (environnement peu marqué par l'agriculture intensive)
- viabilite_emploi : vitalité du bassin d'emploi (taille + diversité sectorielle), à activer (poids 2) si l'emploi est un enjeu du projet
- nature : couvert naturel à proximité (forêts, prairies, landes, milieux naturels autour). Pour « proche de la nature », « du vert », « des forêts », « la campagne », « entouré de nature »
- acces_ecoles : accès aux collèges et lycées autour (présence/proximité, PAS la qualité des établissements). Pour « écoles », « collège », « lycée », « scolarité », ou déduit d'une famille avec enfants (poids 1)
- acces_culture : accès à une offre culturelle autour au sens large, diffusion et pratique (cinéma, médiathèque, théâtre, musée, salle de spectacle/concert, conservatoire). PAS la vitalité ni la programmation

TRADUCTION AUTOMATIQUE (activez le critère interne, sans exposer le terme technique)
- "famille", "enfant", "élever un enfant", "grandir" → ajoutez eviter_isolement (poids 2), acces_services (poids 2), faible_pression_agricole (poids 2).
- "environnement sain", "qualité environnementale", "sain pour grandir" → air_sain (poids 3) + faible_pression_agricole (poids 2).
- "pesticides", "agriculture intensive", "loin des cultures traitées" → faible_pression_agricole (poids 3).
- "qualité de l'air", "respirer", "pollution de l'air" → air_sain (poids 3).
- "accès aux soins", "médecins", "hôpital", "retraite" → acces_soins (poids 2 à 3).
- "retraite", "à la retraite", "jeune retraité" → acces_soins (poids 2 à 3) ET emploiHorsSujet:true (pas de viabilite_emploi).
- "télétravail total", "100 % télétravail", "je travaille de chez moi", "full remote" → emploiHorsSujet:true (l'emploi local n'est pas un enjeu).
HORS-MESURE (notions sans critère dans le moteur) : remplissez horsMesure, ne fabriquez JAMAIS de proxy.
- ÉCOLES. L'ACCÈS aux collèges et lycées EST mesuré (acces_ecoles). La QUALITÉ ne l'est pas.
  • "écoles", "collège", "lycée", "scolarité", "scolariser" (accès) → préférence acces_ecoles (poids 2, ou 3 si essentiel).
  • Si le projet exprime clairement une FAMILLE avec enfants à scolariser SANS dire "école" → acces_ecoles poids 1 (déduction, jamais plus). Présentée comme votre lecture, jamais comme sa demande.
  • "bonnes écoles", "qualité", "réputation", "établissement réputé", "options" (bilingue, latin) → AJOUTER en plus { term, kind: "ecoles" } (qualité, hors-mesure). NE rabattez PAS sur acces_services.
  • CAS CANONIQUE : "une ville avec de bonnes écoles" → préférence acces_ecoles (poids 2) ET horsMesure { kind: "ecoles" }. Les deux à la fois.
- CULTURE. L'ACCÈS à une offre culturelle EST mesuré (acces_culture), AU SENS LARGE : cinéma, médiathèque, théâtre, musée, mais aussi diffusion et pratique (salle de spectacle/concert, conservatoire, école de musique). La VITALITÉ (programmation, scène locale, associations) ne l'est pas.
  • "culture", "cinéma", "théâtre", "musée", "médiathèque", "bibliothèque", "concerts", "spectacle", "conservatoire", "sorties culturelles" (accès) → préférence acces_culture (poids 2, ou 3 si essentiel). JAMAIS de déduction culture (uniquement si exprimé).
  • "vie culturelle animée", "ambiance", "scène locale", "vie associative", "ça bouge culturellement" (vitalité) → AJOUTER { term, kind: "culture" } (hors-mesure). NE rabattez PAS sur eviter_isolement ni sur une grande ville.
  • Dites toujours "accès à une offre culturelle", JAMAIS "vie culturelle", dans la reformulation.
- "authentique", "chaleureux", "accueillant", "convivial", "esprit de village", "du caractère", "de l'âme", "qui bouge", "vivante" → { term, kind: "affectif" }.
- Ne remplissez horsMesure QUE si la notion est réellement exprimée ; ces notions n'ajoutent AUCUNE préférence. La nature, le calme, les services et les soins SONT mesurés : ne les mettez jamais en horsMesure.

Dans la reformulation, restez en langage humain (ex. « un environnement peu marqué par l'agriculture intensive »), n'employez jamais les termes "IFT", "pression agricole" ni "exposition aux pesticides".`;

export async function POST(request: NextRequest) {
  let text: string;
  try {
    ({ text } = await request.json());
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (typeof text !== "string" || text.trim().length < 3) {
    return NextResponse.json({ error: "Décrivez votre projet en quelques mots." }, { status: 400 });
  }
  if (text.length > 2000) text = text.slice(0, 2000);

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 800,
      system: SYSTEM,
      tools: [
        {
          name: "projet_structure",
          description: "Renvoie la structure du projet de vie (contraintes dures + préférences pondérées).",
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "projet_structure" },
      messages: [{ role: "user", content: text }],
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json({ error: "Analyse indisponible. Réessayez." }, { status: 502 });
    }

    const parsed = toolBlock.input as ParsedProject;
    return NextResponse.json({ parsed });
  } catch (error) {
    console.error("[comparateur-vie/parse]", error);
    return NextResponse.json({ error: "Erreur lors de l'analyse du projet." }, { status: 500 });
  }
}
