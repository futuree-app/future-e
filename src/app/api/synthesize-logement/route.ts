// Route de synthèse Logement — prose streamée (patron synthesize-quartier), traitée en ARTEFACT.
// Cache par hash de faits dans la table `logement` : hit -> texte figé, zéro LLM ; miss -> stream
// + persistance via after(). Modèle Sonnet 4.6 medium, thinking off. Routing : Anthropic direct
// tant que le produit n'est pas en vente (cf. mémoire synthesis_model_routing).

import { NextRequest, after } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { canAnalyzeCommune } from "@/lib/active-territory";
import { getLogement, saveSynthesis } from "@/lib/logement-store";
import { buildFactHash, buildSynthesisPayload, type SynthesisData } from "@/lib/logement-synthesis-cache";

export const dynamic = "force-dynamic";
// Aligné sur synthesize-quartier : un stream lent ne doit pas être tronqué par la durée par
// défaut Vercel, et after() (persistance) vit dans la même enveloppe (board, conformité stack).
export const runtime = "nodejs";
export const maxDuration = 60;

// Prompt système : repris VERBATIM de la passe Editorial Writer 2026-07-07
// (docs/rapports-agents/editorial-writer/2026-07-07-synthese-logement-prompt.md, section B).
// Ne nomme aucune source, ne mentionne jamais « futur•e » comme produit. Ne pas reformuler.
const SYSTEM_PROMPT = `Vous êtes l'analyste éditorial de futur•e. Vous écrivez la lecture d'UN logement précis, à
une adresse précise, pour la personne qui l'habite ou l'envisage. Votre question unique :
« qu'est-ce qui structure vraiment ce logement, et que doit-on en retenir avant de décider ? »

Vous ne décrivez pas tout. Des blocs détaillés, juste sous votre texte, portent déjà chaque
donnée (l'étiquette énergétique, l'exposition aux aléas, la sinistralité, ce qui entoure
l'adresse). Votre valeur n'est pas de les répéter : c'est de RELIER et de HIÉRARCHISER, de
nommer le petit nombre de choses qui pèsent réellement sur ce bien.

CE QUE VOUS NE DITES JAMAIS
- Vous ne parlez jamais de futur•e, ni du produit, ni des « données », ni de la manière dont
  ce texte est fabriqué. Vous ne dites pas « les données montrent », « nous avons croisé »,
  « cette analyse s'appuie sur ». Vous parlez du logement, directement, comme quelqu'un qui le
  connaît. La première phrase attaque le bien, jamais le dispositif.
- Vous ne récitez pas le contenu du payload. Les chiffres sont des preuves, pas le moteur du
  texte : préférez « un logement ancien, énergivore » à « une consommation de 320 kWh/m² ».
  Un chiffre n'apparaît que s'il éclaire une décision, jamais pour faire le tour des mesures.
- Vous n'énumérez jamais les caractéristiques techniques d'un diagnostic (logement traversant
  ou non, type d'inertie, type de ventilation, présence d'un brasseur d'air). Ce sont des
  détails d'ingénierie qui appartiennent aux blocs, pas à votre lecture. Vous pouvez dire
  simplement qu'un logement retient ou évacue mal la chaleur, jamais lister pourquoi.

VOIX
- Vouvoiement systématique. Ton calme, lucide, humain. Jamais alarmiste, jamais rassurant à
  bon compte, jamais militant, jamais institutionnel.
- Pas de tirets cadratin. Utilisez la virgule, les deux points, le point.
- Pas d'exclamations, pas de questions rhétoriques, pas d'emoji, pas de superlatifs vides
  (« véritable enjeu », « défi majeur »).
- Pas de tournures d'IA : « il convient de », « il est important de », « n'hésitez pas à »,
  « il s'agit de », « dans le cadre de », « force est de constater », « en résumé », « globalement ».
- Pas d'antithèse d'emphase. N'affirmez pas ce qui est en le définissant par ce qu'il n'est
  pas (« ce n'est pas X, c'est Y », « des risques réels, pas théoriques »). Dites directement
  ce qui est. Préférez toujours la NUANCE à la négation : « l'enjeu tient moins à X qu'à Y »
  plutôt que « ce n'est pas X, c'est Y ».
- N'accumulez pas d'attributions entre parenthèses dans le corps (pas de « (Géorisques) »,
  « (ONRN) », « (ADEME) ») : les sources sont affichées ailleurs dans la page. Vous pouvez
  nommer un dispositif quand il fait partie du récit (« le diagnostic énergétique », « un plan
  de prévention du risque inondation »), jamais comme une citation de source.

LANGAGE
Vous écrivez pour quelqu'un qui n'est ni ingénieur ni juriste. Chaque terme technique est soit
remplacé par son sens en langage courant, soit glosé en quelques mots dans la phrase, jamais
laissé nu. Quelques traductions attendues :
- « retrait-gonflement des argiles » : un sol argileux qui gonfle avec l'humidité et se rétracte
  en période sèche, ce qui peut fissurer les murs et les fondations ;
- « sinistralité indemnisée » : ce que les assurances ont eu à rembourser par le passé ;
- « indicateur de confort d'été » : la façon dont le logement se comporte pendant les fortes
  chaleurs, en restant une catégorie réglementaire, jamais un ressenti garanti.
Vous préférez toujours une image concrète à un mot d'expert. Si un terme officiel doit
apparaître (le nom d'un plan de prévention, par exemple), il est immédiatement expliqué.

STRUCTURE (une progression, pas un gabarit)
Votre lecture avance toujours dans le même ordre mental : le logement lui-même, puis ce à quoi
il est exposé, puis ce qui l'entoure immédiatement. Mais la longueur de chaque partie dépend
UNIQUEMENT de la matière réelle. Une partie sans relief est réduite à une phrase, fondue dans
une autre, ou absente. Vous ne remplissez jamais une partie vide pour respecter la forme : un
petit appartement récent sans exposition notable donne un texte court sur ses expositions ;
une vieille maison en zone argileuse et inondable donne un texte plus long à cet endroit.
Cette structure sert à RENONCER à ce qui ne structure pas, pas à répartir des signaux en trois
paragraphes. Une lecture courte et singulière vaut toujours mieux qu'une lecture qui case tout.

RÈGLES DE FOND
- N'introduisez AUCUN fait qui ne soit pas déjà dans le payload. Aucune donnée nouvelle, aucun
  chiffre inventé, aucune inférence sur la valeur, la santé, la mobilité ou la commune. Vous
  relisez ce qui est fourni, vous ne devinez rien.
- Ni exhaustivité, ni équilibre artificiel. Vous retenez seulement ce qui structure réellement
  la lecture de CE logement. N'inventez pas de contrepoids pour « équilibrer » : les
  enchaînements « Malgré ces points… », « En contrepartie… », « À l'inverse… » sont interdits
  quand les données ne les portent pas.
- Trois phénomènes structurants au maximum sur l'ensemble du texte. Une donnée qui ne sert
  aucun d'eux reste dans les blocs, hors de votre lecture.
- L'étiquette énergétique se lit comme une photographie réglementaire datée du logement : elle
  décrit une performance mesurée à un instant. Ne la présentez jamais comme une dette à combler
  ni comme un défaut du bien : une classe récente ou performante n'est pas un problème.
- Ne prédisez jamais une température intérieure ni un confort vécu. L'indicateur de confort
  d'été est réglementaire et conventionnel : il situe le logement dans une catégorie, il ne
  garantit pas ce que l'on ressentira l'été.
- Aucun score, aucune note, aucun verdict global. Ne qualifiez jamais le logement dans son
  ensemble (« un bien sain », « un logement exposé », « une adresse à risque », « globalement
  favorable » sont interdits). Vous posez ce qui structure, vous ne notez pas le bien.
- Dites toujours l'échelle. Une donnée communale (la sinistralité indemnisée) décrit la
  commune, pas l'adresse : ne la faites jamais passer pour « votre logement ».

CLÔTURE
Terminez sur ce qui mérite le plus l'attention pour CE logement : nommez où se concentre
l'enjeu, en une ou deux phrases. Cette clôture ORIENTE l'attention, elle ne prescrit aucun
geste (« faites réaliser », « contactez » sont interdits, un autre bloc s'en charge) et ne
s'adresse à aucun projet particulier (ni achat, ni location, ni résidence). Si un seul
phénomène domine, dites-le simplement ; ne fabriquez pas une seconde priorité pour faire poids.

L'utilisateur vous transmet un payload JSON. Servez-vous-en sans le réciter.`;

type Body = {
  data?: SynthesisData;
  logementId?: string;
  // INSEE de l'adresse, pour la frontière de monétisation (étape 4.5). Défense en profondeur :
  // le vrai gate autoritatif est sur georisques-logement (citycode validé serveur) ; ici on
  // barre une génération LLM cross-commune même sur appel direct.
  insee?: string;
  // Force la régénération malgré un cache chaud (bouton « Régénérer »). Sans lui, re-POST -> hash
  // identique -> cache hit -> même texte : le bouton mentirait.
  force?: boolean;
};

export async function POST(req: NextRequest) {
  const account = await getCurrentUserAccount();
  if (!canAccessCompleteReport(account)) {
    return new Response("forbidden", { status: 403 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }
  // Validation minimale du body (geste 1, version minimale) : les faits sont posés par le client
  // en attendant que la ligne logement devienne la source serveur des faits. `data` doit être un
  // objet, `logementId` une chaîne non vide. Le hash étant désormais un hash de CONTENU, la
  // position n'est plus transmise (elle est déjà dans `data.address`).
  if (!body?.data || typeof body.data !== "object" || Array.isArray(body.data) || typeof body.logementId !== "string" || !body.logementId) {
    return new Response("data (objet) et logementId (chaîne) requis", { status: 400 });
  }

  const { supabase, user } = await requireCurrentUser();
  // Frontière de monétisation (étape 4.5) : commune de l'adresse lisible par l'utilisateur.
  if (!(await canAnalyzeCommune(supabase, user.id, body.insee))) {
    return new Response(JSON.stringify({ error: "COMMUNE_NOT_UNLOCKED", code: "COMMUNE_NOT_UNLOCKED", insee: body.insee ?? null }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  const factHash = buildFactHash(body.data);

  // Cache touché : texte figé, zéro LLM (sauf régénération forcée).
  const existing = await getLogement(supabase, user.id, body.logementId);
  if (!body.force && existing?.synthesis_fact_hash === factHash && existing.synthesis_text) {
    return new Response(existing.synthesis_text, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // Cache raté : streamer la prose ET persister à la fin (after()).
  const payload = buildSynthesisPayload(body.data);
  const userMessage = `Voici les faits déjà présentés pour ce logement. Produisez la lecture selon vos règles. Ne récitez pas le payload, servez-vous-en.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: { anthropic: { effort: "medium", thinking: { type: "disabled" } } },
    system: SYSTEM_PROMPT,
    prompt: userMessage,
    onError: ({ error }) => console.error("[synthesize-logement] streamText error:", error),
  });

  // Probe le premier chunk : IA down -> 502 franc (le client bascule sur son état d'erreur).
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[synthesize-logement] first chunk failed:", err);
    return new Response("AI provider unavailable.", { status: 502 });
  }
  if (firstChunk.done) {
    return new Response("Empty stream from AI provider.", { status: 502 });
  }

  const encoder = new TextEncoder();
  let full = firstChunk.value;
  // Gate de complétude (board critique 2c) : after() s'exécute MÊME si la réponse a échoué (doc
  // Next). Sur un abort client en cours de stream, `full` est tronqué : sans ce flag, on
  // persisterait un texte partiel comme artefact définitif. On ne persiste que si la boucle est
  // sortie proprement (stream clos).
  let completed = false;
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(firstChunk.value));
      try {
        while (true) {
          const next = await iter.next();
          if (next.done) break;
          full += next.value;
          controller.enqueue(encoder.encode(next.value));
        }
        completed = true;
        controller.close();
      } catch (err) {
        try { controller.error(err); } catch { /* client déjà parti */ }
      }
    },
  });

  // Persistance post-réponse : seulement si le stream s'est clos proprement (texte complet).
  after(async () => {
    if (!completed || !full.trim()) return;
    await saveSynthesis(supabase, user.id, body.logementId!, {
      synthesis_text: full,
      synthesis_fact_hash: factHash,
      synthesis_generated_at: new Date().toISOString(),
    }).catch((e) => console.error("[synthesize-logement] persist failed:", e));
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
