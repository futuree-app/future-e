// Route de synthèse Logement — prose streamée (patron synthesize-quartier), traitée en ARTEFACT.
// Cache par hash de faits dans la table `logement` : hit -> texte figé, zéro LLM ; miss -> stream
// + persistance via after(). Modèle Sonnet 4.6 medium, thinking off. Routing : Anthropic direct
// tant que le produit n'est pas en vente (cf. mémoire synthesis_model_routing).

import { NextRequest, after } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { getCurrentUserAccount, requireCurrentUser } from "@/lib/user-account";
import { canAccessCompleteReport } from "@/lib/access";
import { getLogement, saveSynthesis, SOURCES_VERSION } from "@/lib/logement-store";
import { buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION, type SynthesisData } from "@/lib/logement-synthesis-cache";

export const dynamic = "force-dynamic";

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
  latitude?: number;
  longitude?: number;
  dpeId?: string | null;
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
  if (!body?.data || !body.logementId || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return new Response("data/logementId/latitude/longitude requis", { status: 400 });
  }

  const { supabase, user } = await requireCurrentUser();
  const factHash = buildFactHash({
    latitude: body.latitude,
    longitude: body.longitude,
    dpeId: body.dpeId ?? null,
    sourcesVersion: SOURCES_VERSION,
    promptVersion: SYNTHESIS_PROMPT_VERSION,
  });

  // Cache touché : texte figé, zéro LLM.
  const existing = await getLogement(supabase, user.id, body.logementId);
  if (existing?.synthesis_fact_hash === factHash && existing.synthesis_text) {
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
        controller.close();
      } catch (err) {
        try { controller.error(err); } catch { /* client déjà parti */ }
      }
    },
  });

  // Persistance post-réponse : le texte complet est prêt quand after() s'exécute (stream clos).
  after(async () => {
    if (!full.trim()) return;
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
