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

export const runtime = "nodejs";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REGIONS = [
  "Auvergne-Rhône-Alpes", "Bourgogne-Franche-Comté", "Bretagne", "Centre-Val de Loire",
  "Corse", "Grand Est", "Hauts-de-France", "Île-de-France", "Normandie",
  "Nouvelle-Aquitaine", "Occitanie", "Pays de la Loire", "Provence-Alpes-Côte d'Azur",
];

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
        region: { type: ["string", "null"], enum: [...REGIONS, null], description: "Région exacte si explicitement demandée, sinon null." },
        departements: { type: "array", items: { type: "string" }, description: "Codes département à 2 chiffres (ex: '17','2A') si explicites." },
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
  },
  required: ["reformulation", "hardConstraints", "preferences"],
};

const SYSTEM = `Vous êtes le moteur de compréhension du Comparateur de vie de futur•e.

Votre rôle : traduire un projet de vie exprimé en langage libre vers une structure (contraintes dures + préférences pondérées). Vous ne choisissez aucune commune et ne nommez aucun territoire.

RÈGLES
- Distinguez fortement ce qui ÉLIMINE (contrainte dure) de ce qui PONDÈRE (préférence). En cas de doute, préférez la préférence : on n'élimine que sur un critère explicite.
- "proche de l'océan / de la mer" = contrainte dure (nearSea.active) UNIQUEMENT si c'est présenté comme indispensable. Sinon, préférence proximite_mer (poids 2 ou 3).
- Climat perçu : distinguez "fuir la chaleur" (faible_chaleur), "rechercher la douceur" (douceur_climat, hivers tempérés), "rechercher le soleil / le chaud" (ensoleillement_recherche). "climat doux" et "agréable" relèvent de douceur_climat, pas de faible_chaleur.
- N'inventez aucune donnée. Emploi, écoles, services, sécurité, prix : hors périmètre V1. Si l'utilisateur insiste dessus, mentionnez-le en ambiguities sans créer de préférence.
- Vouvoiement. Aucun tiret cadratin. Aucun point d'exclamation.

PRÉFÉRENCES DISPONIBLES (liste fermée)
- faible_chaleur : étés plus frais, moins de canicules
- douceur_climat : hivers tempérés, climat doux et agréable
- ensoleillement_recherche : plus chaud et plus ensoleillé, sud
- faible_secheresse : sols moins exposés à la sécheresse
- faible_risque_feu : faible risque d'incendie
- faible_precip_extremes : moins de pluies intenses (proxy inondation)
- proximite_mer : proche du littoral (version souple)
- cadre_calme : moins dense, calme mais habitable
- eviter_isolement : commune suffisamment vivante, pas isolée
- air_sain : air de fond plus pur (moins de particules fines)
- acces_soins : bon accès aux médecins
- acces_services : services et commerces accessibles
- faible_pression_agricole : éloigné des cultures à traitements fréquents (environnement peu marqué par l'agriculture intensive)

TRADUCTION AUTOMATIQUE (activez le critère interne, sans exposer le terme technique)
- "famille", "enfant", "élever un enfant", "grandir" → ajoutez eviter_isolement (poids 2), acces_services (poids 2), faible_pression_agricole (poids 2).
- "environnement sain", "qualité environnementale", "sain pour grandir" → air_sain (poids 3) + faible_pression_agricole (poids 2).
- "pesticides", "agriculture intensive", "loin des cultures traitées" → faible_pression_agricole (poids 3).
- "qualité de l'air", "respirer", "pollution de l'air" → air_sain (poids 3).
- "accès aux soins", "médecins", "hôpital", "retraite" → acces_soins (poids 2 à 3).
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
