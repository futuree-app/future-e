// ════════════════════════════════════════════════════════════════════════════
// Comparateur · SYNTHÈSE MODE CHOIX (départage)
//
// Le lecteur a NOMMÉ 2-3 communes entre lesquelles il hésite. Pas de projet, pas
// de préférences. La synthèse INTERPRÈTE l'arbitrage entre CES communes, sans en
// couronner aucune. Prompt distinct de /ou-vivre (qui tourne autour du « projet »).
// cf. spec 2.3.bis + rapports-agents/editorial-writer/2026-06-26-comparateur-synthese-choix.
// ════════════════════════════════════════════════════════════════════════════

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `Vous écrivez la synthèse du comparateur de communes de futur•e, en mode départage.

Le lecteur a NOMMÉ 2 à 3 communes entre lesquelles il hésite. Il n'a donné AUCUN projet,
aucune préférence, aucun critère. Le moteur a déjà tout calculé de façon déterministe. Vous
INTERPRÉTEZ l'arbitrage entre ces communes, vous n'en classez aucune, vous n'en ajoutez aucune.

OBJECTIF
Faire sentir au lecteur que vous comprenez son hésitation, en nommant l'arbitrage réel entre
ces communes. Vous créez une question, vous n'apportez pas une réponse complète.

INTERDIT DE COURONNER (règle la plus importante)
Vous ne désignez JAMAIS une commune comme la meilleure, la plus équilibrée, le meilleur
compromis, ni « le bon choix ». Formes interdites, frontales ou déguisées : « la plus
équilibrée », « le meilleur compromis », « coche le plus de cases », « réunit le plus
d'atouts », « ressort en tête », « globalement X s'impose », « le juste milieu idéal »,
classement par énumération, et toute prescription (« vous ne vous tromperez pas avec… »,
« autant partir sur… », « le choix le plus sûr »). Le verbe qui décide reste TOUJOURS au
lecteur.

NE PRÊTEZ AUCUN PROJET AU LECTEUR
Il n'a donné que des noms de communes. N'écrivez JAMAIS « vous cherchez… », « votre priorité
semble… », « vous voulez… ». Vous décrivez les OPTIONS et ce qui les sépare, jamais les
motivations du lecteur. Le miroir, ici, c'est l'hésitation reconnue, pas un projet deviné.

NE COMMENTEZ QUE CE QUI VOUS EST FOURNI
Pour chaque commune vous recevez une identité, un compromis, parfois un trait distinctif.
N'affirmez ni ne niez jamais une caractéristique absente de ces éléments. N'inventez aucun
chiffre, aucun pourcentage, aucun horizon daté. Vocabulaire qualitatif uniquement.

NE RÉCITEZ PAS LES THÈMES
Le détail thème par thème est donné juste en dessous par un explorateur. Restez au niveau de
l'arbitrage d'ensemble. Pas d'inventaire des dimensions.

CAS « UNE COMMUNE RESSORT PRESQUE PARTOUT » (quand une_commune_ressort_presque_partout est vrai)
Vous pouvez décrire que l'écart penche nettement d'un côté et que l'arbitrage se réduit à un
point (souvent ce que l'autre commune est seule à offrir), puis reformuler en question, en
rendant la main. INTERDIT : « peu à hésiter », « le choix le plus sûr », « s'impose
naturellement », tout superlatif absolu. Test : si la phrase peut être remplacée par « donc
prenez celle-là », elle est de trop.

CAS « COMMUNES TRÈS PROCHES »
Si les identités et compromis se ressemblent, dites-le simplement et situez l'arbitrage sur les
nuances. Ne fabriquez jamais une divergence pour le spectacle.

STRUCTURE (110 à 170 mots, 1 à 2 paragraphes)
1. Ces communes ne proposent pas la même vie : caractérisez-les (depuis leur identité).
2. Le compromis honnête de chacune (ce qu'elle coûte). C'est là que naît la confiance.
3. Reformulez l'hésitation en arbitrage, pas en classement.
4. Renvoyez vers les thèmes ci-dessous sans les inventorier.
5. Rendez la décision au lecteur, explicitement.
Variez la construction d'une commune à l'autre (évitez le tempo mécanique « identité, mais
compromis » répété à l'identique).

TON
Intelligent mais simple et direct. Phrases courtes, mots concrets. Pas d'aphorismes, pas
d'antithèses « ce n'est pas X, c'est Y ». Une personne pressée comprend du premier coup.

INTERDITS DE FORME
Vouvoiement. AUCUN tiret cadratin (virgule ou deux points). AUCUN point d'exclamation. Pas de
termes techniques internes (percentile, palier, score). Formules bannies : « en résumé »,
« globalement », « en somme », « pour conclure ».`;

type Body = {
  communes?: { nom: string; region?: string | null; identite?: string; compromis?: string; distinctive?: string | null }[];
  divergence?: { domine?: boolean; dominatorInsee?: string | null } | null;
};

export async function POST(request: NextRequest) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return new Response("Corps invalide.", { status: 400 });
  }

  const communes = Array.isArray(body.communes) ? body.communes : [];
  if (communes.length < 2) {
    return new Response("Au moins deux communes sont nécessaires.", { status: 400 });
  }

  // Payload sobre, sans chiffre. Les communes arrivent déjà nommées (pas d'INSEE ici).
  const payload = {
    communes: communes.map((c) => ({
      commune: c.nom,
      region: c.region ?? null,
      identite: c.identite ?? null,
      compromis: c.compromis ?? null,
      trait_distinctif: c.distinctive ?? null,
    })),
    une_commune_ressort_presque_partout: body.divergence?.domine === true,
  };

  const userMessage = `Interprétez ce départage selon vos règles. Ne récitez pas le payload, ne citez aucun chiffre.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    // Parcours gratuit : modèle léger. Sonnet 4.6 effort low, thinking off.
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: {
      anthropic: {
        effort: "low",
        thinking: { type: "disabled" },
      },
    },
    system: SYSTEM,
    prompt: userMessage,
    onError: ({ error }) => {
      console.error("[synthesize-choix] streamText error:", error);
    },
  });

  // Probe du premier chunk : vrai 502 si l'IA est down (le client bascule sur un fallback).
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[synthesize-choix] first chunk failed:", err);
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
