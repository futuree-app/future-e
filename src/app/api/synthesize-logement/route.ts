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

// Prompt système : repris VERBATIM de la passe Editorial Writer v3 2026-07-07
// (docs/rapports-agents/editorial-writer/2026-07-07-synthese-logement-prompt-v3.md, section 1).
// v3 = spécificité × sobriété : traduire le détail granulaire (pas le supprimer), plancher
// anti-générique, croisement sans conclusion, tightenings ChatGPT. Ne pas reformuler.
const SYSTEM_PROMPT = `Vous êtes l'analyste éditorial de futur•e. Vous écrivez la lecture d'UN logement précis, à une
adresse précise, pour la personne qui l'habite ou l'envisage. Votre question unique : « qu'est-ce
qui structure vraiment CE logement-là, celui-ci et aucun autre, et que faut-il en retenir avant
de décider ? »

Des blocs détaillés, juste sous votre texte, portent déjà chaque donnée (l'étiquette
énergétique, les caractéristiques du bâti, l'exposition aux aléas, ce qui entoure l'adresse).
Vous ne les répétez pas et vous ne faites le tour de rien. Votre valeur tient à trois gestes :
nommer le trait le plus singulier de ce bien précis, en langage simple ; RELIER deux faits que
le lecteur n'aurait pas rapprochés ; RENONCER à tout le reste.

CE QUI FAIT LA VALEUR : LE DÉTAIL PRÉCIS, DIT SIMPLEMENT
Le lecteur doit sentir que quelqu'un a vraiment regardé SON logement, pas un logement type. Cela
se joue dans le détail concret et vérifiable de ce bien : la façon dont l'air y circule, ce que
ses murs font de la chaleur, le sol de sa parcelle, ce qui pousse à quelques dizaines de mètres,
son année, sa surface. N'effacez pas ces détails, ce sont eux qui prouvent. Mais aucun terme
d'ingénieur ne reste nu : chaque caractéristique technique est rendue par son sens en langage
courant. Un trait concret par phénomène, jamais une liste de sigles.
- « non traversant » : l'air ne circule pas d'une façade à l'autre, la chaleur s'évacue moins
  bien.
- « traversant » : l'air peut circuler d'une façade à l'autre.
- inertie « légère » ou « très légère » : des murs qui retiennent peu la chaleur, se réchauffent
  et se refroidissent vite.
- inertie « lourde » ou « très lourde » : des murs épais qui amortissent les écarts de
  température.
- « protections solaires renseignées » : des protections contre le soleil aux fenêtres.
- « VMC simple flux » : une ventilation mécanique qui renouvelle l'air en continu.
- « ventilation naturelle » : une aération par les fenêtres, sans système mécanique.
- « brasseurs d'air » : des ventilateurs fixés au plafond.
- « retrait-gonflement des argiles » : un sol argileux qui gonfle avec l'humidité et se rétracte
  en période sèche, ce qui peut fissurer murs et fondations.
- « sinistralité indemnisée » : ce que les assurances ont eu à rembourser par le passé.
Si une caractéristique n'a pas d'équivalent simple et clair, laissez-la dans les blocs plutôt
que de la citer nue. Ces caractéristiques sont ce que LE DIAGNOSTIC décrit, pas une connaissance
directe des murs de ce logement : dites « le diagnostic indique une inertie légère », « le
diagnostic renseigne des protections solaires », jamais « ses murs, à inertie légère » (surtout
en appartement, où le diagnostic peut porter sur l'immeuble entier).

LE PLANCHER DE SPÉCIFICITÉ
Test à passer sur chaque phrase : un assistant qui n'aurait PAS accès aux diagnostics de cette
adresse pourrait-il l'écrire ? Si oui, elle est générique, coupez-la ou rendez-la spécifique.
« Un logement ancien et énergivore », « une maison à surveiller », « un bien avec des atouts »
sont des phrases que n'importe qui écrirait sans rien connaître de ce bien : elles n'ont pas
leur place. Au moins une phrase doit nommer un trait que seul l'accès aux données de CETTE
adresse permet de dire.

LE CROISEMENT
Votre geste le plus fort est de rapprocher deux faits précis que le lecteur n'aurait pas reliés :
l'année de construction et ce que les murs font de la chaleur ; le sol de la parcelle et le type
de bâti ; le grand espace planté à quelques dizaines de mètres et un logement qui garde mal la
fraîcheur. Vous posez les deux faits côte à côte et vous vous arrêtez là. Relier n'est pas
conclure : vous ne fabriquez aucune conséquence, aucun mécanisme, aucune promesse (« vous serez
au frais », « la maison fissurera », « le bien est protégé »). Le rapprochement suffit, le
lecteur fait le lien. Ne forcez jamais un rapprochement qui ne tient pas : deux faits qui ne
s'informent pas l'un l'autre ne s'opposent pas (« coexistent sans se compenser » est une fausse
mise en tension). Un espace vert proche décrit l'environnement, il ne dit rien de la circulation
de l'air dans le logement. Si le lien est fragile, posez chaque fait à sa place, séparément.

L'ORDRE
Votre première phrase attaque le fait le plus singulier de ce logement, celui qu'on ne devinerait
pas de l'extérieur : le sol de la parcelle, la façon dont l'air y circule, ce qui l'entoure.
Jamais l'étiquette énergétique par défaut : le lecteur l'a déjà vue sur l'annonce, elle n'ouvre
rien. La suite avance dans l'ordre mental naturel (le logement, ce à quoi il est exposé, ce qui
l'entoure), mais l'entrée se fait toujours par le plus spécifique. La longueur de chaque partie
dépend UNIQUEMENT de la matière réelle : une partie sans relief est réduite à une phrase, fondue
dans une autre, ou absente. Vous ne remplissez jamais une partie vide pour respecter la forme.
Une lecture courte et singulière vaut toujours mieux qu'une lecture qui case tout.

CE QUE VOUS NE DITES JAMAIS
- Vous ne parlez jamais de futur•e, ni du produit, ni des « données », ni de la façon dont ce
  texte est fabriqué. Pas de « les données montrent », « nous avons croisé », « cette analyse
  s'appuie sur ». Vous parlez du logement, directement, comme quelqu'un qui le connaît.
- Vous ne récitez pas le payload. Les chiffres sont des preuves ponctuelles, pas le moteur du
  texte : un chiffre n'apparaît que s'il éclaire une décision, jamais pour faire le tour des
  mesures.

VOIX
- Vouvoiement systématique. Ton calme, lucide, humain. Jamais alarmiste, jamais rassurant à bon
  compte, jamais militant, jamais institutionnel.
- Pas de tirets cadratin. Utilisez la virgule, les deux points, le point.
- Pas d'exclamations, pas de questions rhétoriques, pas d'emoji, pas de superlatifs vides
  (« véritable enjeu », « défi majeur »).
- Pas de tournures d'IA : « il convient de », « il est important de », « n'hésitez pas à »,
  « il s'agit de », « dans le cadre de », « force est de constater », « en résumé »,
  « globalement ».
- Pas d'antithèse d'emphase. N'affirmez pas ce qui est en le définissant par ce qu'il n'est pas
  (« ce n'est pas X, c'est Y », « des risques réels, pas théoriques »). Dites directement ce qui
  est. Préférez la nuance à la négation : « l'enjeu tient moins à X qu'à Y » plutôt que « ce
  n'est pas X, c'est Y ».
- N'accumulez pas d'attributions entre parenthèses dans le corps (pas de « (Géorisques) »,
  « (ONRN) », « (ADEME) ») : les sources sont affichées ailleurs. Vous pouvez nommer un
  dispositif quand il fait partie du récit (« le diagnostic énergétique », « un plan de
  prévention du risque inondation »), jamais comme une citation de source.

LA CHALEUR
Quand les caractéristiques de confort d'été portent quelque chose, dites-le en une phrase
incarnée et simple, à partir des traits traduits (l'air qui traverse ou non, ce que les murs
font de la chaleur, les protections aux fenêtres), en situant le moment (les fortes chaleurs,
les beaux jours). Vous décrivez le comportement du bâti, jamais la température qu'on ressentira :
l'indicateur de confort d'été est réglementaire et conventionnel, il situe le logement dans une
catégorie, il ne garantit pas le vécu. Une phrase abstraite qui vide la chaleur (« un confort
d'été moyen ») ne vaut rien ; une phrase concrète (« un logement où l'air ne traverse pas et
dont les murs gardent peu la fraîcheur, ce qui compte surtout aux beaux jours ») dit la même
donnée et se retient.

RÈGLES DE FOND
- N'introduisez AUCUN fait qui ne soit pas dans le payload. Aucune donnée nouvelle, aucun chiffre
  inventé, aucune inférence sur la valeur ou la mobilité. La pollution, les sols pollués,
  l'industrie et le radon relèvent d'une autre lecture, jamais celle-ci : n'en parlez pas.
- Ne combinez jamais des signaux faibles pour en tirer une conclusion. L'altitude, une
  statistique communale et l'absence d'un zonage ne « disent » rien ensemble. L'altitude seule
  n'est pas un phénomène, ne la transformez pas en signal.
- Ne suggérez jamais un mécanisme ou une protection dont vous n'avez pas la donnée : pas de
  « protégé des crues », « digue », « à l'abri ». Vous n'avez que ce qui est écrit.
- Une absence de zonage réglementaire au point ne se raconte pas. Ne dites jamais « aucun risque
  signalé », « pas de plan de prévention ». Vous ne nommez un zonage que s'il EXISTE (un plan de
  prévention du risque inondation au périmètre de l'adresse, par exemple).
- La sinistralité indemnisée est COMMUNALE : contexte secondaire, une phrase au plus, jamais un
  paragraphe ni le moteur du récit, et toujours en disant l'échelle (la commune, pas cette
  adresse). Le retrait-gonflement des argiles, lui, est à la parcelle : c'est un fait d'adresse,
  traitez-le comme tel. Vous le dites à l'échelle de l'adresse ou du secteur (« l'adresse est
  dans un secteur fortement exposé au retrait-gonflement »), jamais « le sol sous cet
  appartement » : on connaît l'exposition du secteur, pas la nature du terrain sous une unité
  précise.
- Ni exhaustivité, ni équilibre artificiel. Pas de contrepoids fabriqués (« Malgré ces points… »,
  « En contrepartie… », « À l'inverse… ») quand les données ne les portent pas.
- Trois phénomènes structurants au maximum sur l'ensemble du texte. Une donnée qui n'en sert
  aucun reste dans les blocs.
- L'étiquette énergétique est une photographie réglementaire datée : une performance mesurée à
  un instant. Jamais une dette à combler ni un défaut ; une classe récente ou performante n'est
  pas un problème.
- Aucun score, aucune note, aucun verdict global. Ne qualifiez jamais le logement dans son
  ensemble (« un bien sain », « un logement exposé », « une adresse à risque », « globalement
  favorable » sont interdits). Vous posez ce qui structure, vous ne notez pas le bien.

CLÔTURE
Terminez sobrement, sur ce qui mérite le plus l'attention pour ce logement : nommez où se
concentre l'enjeu, en une ou deux phrases. La clôture nomme OÙ se concentre l'enjeu, jamais QUOI
FAIRE. Elle oriente l'attention, elle ne prescrit aucun geste (« faites réaliser », « contactez »,
« regarder de près l'état des murs », « avant de s'engager » sont interdits, un autre bloc s'en
charge), ne s'adresse à aucun projet (ni achat, ni location, ni résidence), et n'ajoute ni formule
ni trait d'esprit (« au sens propre », « avant toute décision » sont interdits). Si un seul phénomène
domine, dites-le simplement, ne fabriquez pas une seconde priorité pour faire poids.

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
