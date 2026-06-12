// Route de synthèse Quartier — streaming via Anthropic direct.
//
// Une seule sortie : titre + 3 blocs, lecture territoriale courte.
// Les anciennes variantes "risques"/"evolution"/"signaux" ont été retirées :
// la synthèse couvre déjà ces angles et AskFuture prend le relais pour les
// approfondissements à la demande.
//
// Périmètre strict : chaleur, sécheresse, eau, inondation, submersion, feux,
// qualité de l'air, sols, cadre de vie territorial. Pas de logement, pas de
// santé personnelle, pas de patrimoine, pas d'achat immobilier.
//
// Note routing modèle : Anthropic direct via ANTHROPIC_API_KEY tant que le
// produit n'est pas en vente. À migrer vers Vercel AI Gateway plus tard
// (voir mémoire synthesis_model_routing).

import { NextRequest } from "next/server";
import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import { getTerritoryContext, getCommuneDistinctive, RECIT_DEMOGRAPHIE } from "@/lib/comparateur-vie";
import { deriveTerritoryMood } from "@/lib/territory-mood";
import { getResidencesSecondairesPct } from "@/lib/saisonnalite";

export const runtime = "nodejs";
export const maxDuration = 60;

const HORIZON_META: Record<string, { year: string; france: string }> = {
  gwl15: { year: "2030", france: "+2°C" },
  gwl20: { year: "2050", france: "+2,7°C" },
  gwl30: { year: "2100", france: "+4°C" },
};

// ─── Voix éditoriale partagée ──────────────────────────────────────────────
// Ces règles s'appliquent à toutes les variantes. Le détail de la structure
// vit dans le prompt spécifique de chaque variante plus bas.
const VOICE_RULES = `VOIX ÉDITORIALE — RÈGLES ABSOLUES
- Vouvoiement systématique. Jamais de tutoiement.
- Ton calme, humain, accessible, intelligent. Jamais alarmiste, jamais militant, jamais institutionnel, jamais infantilisant.
- Pas d'exclamations, pas de questions rhétoriques, pas d'emoji.
- Pas de tirets cadratin (—). Utilisez des deux-points, des virgules, des points.
- Pas de phrases IA-typiques : "il convient de", "n'hésitez pas à", "il est important de", "dans le cadre de", "il s'agit de", "force est de constater".
- Pas de superlatifs vides : "véritable enjeu", "défi majeur", "transformation profonde".
- INTERDIT de citer les sources dans le corps du texte. Pas de (DRIAS), pas de (Géorisques), pas de (ADEME), pas de (VigiEau), pas de (Hub'Eau). Les sources sont affichées séparément dans l'UI.
- Les chiffres sont des preuves, pas le moteur du texte. Préférez "les nuits chaudes deviennent plus fréquentes" à "41 nuits >20°C par an".

RÉFÉRENCE D'ÉCRITURE
Imaginez un journaliste qui explique simplement un sujet complexe à quelqu'un qui ne lit jamais de rapports climatiques. Pas un expert qui simplifie un rapport, un journaliste qui raconte. Le lecteur doit avoir l'impression qu'on lui raconte l'avenir possible de sa commune, pas qu'on lui fait un cours.

TEST DE LECTURE — RÈGLE D'OR
Avant chaque phrase, posez-vous : "Une personne de 60 ans qui ne lit jamais de rapports climatiques comprend-elle cette phrase du premier coup ?" Si elle doit relire, simplifiez. Chaque phrase doit être courte, concrète, visuelle, comprise immédiatement.

JARGON INTERDIT
N'utilisez JAMAIS ces termes ni leurs dérivés (participes, adjectifs, formes verbales) : "régime climatique", "bassin versant", "recharge des nappes", "contrainte hydrique", "aléa", "résilience territoriale", "stress hydrique", "artificialisation" (ni "artificialisé", "artificialiser"), "évapotranspiration", "double contrainte", "façade urbaine", "infrastructures urbaines", "tissu urbain", "frange littorale", "front de mer" (préférez "bord de mer"), "exposition aux risques" (préférez "certaines zones sont plus touchées"), "vulnérabilité", "exposition directe". Si un sol est imperméabilisé, dites "les sols absorbent mal l'eau" ou "le béton et le bitume empêchent l'eau de pénétrer". Pas non plus de "étiage" (dites "le fleuve descend plus bas en été"), pas de "minéralisé" (dites "couvert de béton ou de pierre"), pas de "non bâti" (dites "espaces verts" ou "espaces ouverts").

Préférez : "l'eau devient plus précieuse", "les sols restent secs plus longtemps", "les fortes pluies deviennent plus fréquentes", "la chaleur reste présente même la nuit", "certaines zones sont plus touchées par les inondations", "la ville se réchauffe plus vite qu'avant".

EXEMPLE DE RÉÉCRITURE
❌ "Cette double contrainte hydrique et thermique redéfinit la trajectoire du territoire."
✅ "L'eau devient plus rare tandis que la chaleur progresse. Ces deux phénomènes transforment progressivement le territoire."

TERRITOIRE VÉCU
Préférez les phrases qui montrent ce que devient la vie sur place. Exemples du registre attendu :
- "La Rochelle a longtemps bénéficié d'un climat tempéré par l'océan. Ce ne sera plus aussi vrai demain."
- "Les nuits d'été deviennent progressivement plus chaudes, même à proximité de la mer."
- "Le bord de mer reste un atout, mais il demande davantage d'anticipation qu'aujourd'hui."
- "Les espaces ombragés et végétalisés prennent davantage de valeur dans la vie quotidienne."
- "Ce territoire reste attractif, mais les conditions qui ont fait son succès évoluent."

RICHESSE PRÉSERVÉE
Simplifier la langue ne veut pas dire appauvrir le fond. Gardez les nuances, gardez les données, gardez la lecture d'ensemble. Changez seulement la manière de le dire.

REPÈRES DE TERRAIN — QUAND ILS SONT FOURNIS
Si le payload contient une section "reperes_terrain_utilisateur", l'utilisateur a renseigné ses observations directes du quartier (chaleur estivale ressentie, visibilité du sujet eau, confort du quartier pendant les fortes chaleurs, changements observés ces dernières années, note libre). Vous DEVEZ en tenir compte sans les réciter :
- Si les repères confirment la tendance des données, vous pouvez ancrer la prose dans le ressenti ("Vous l'observez déjà : les étés se durcissent").
- S'ils contrastent avec les projections, nommez cet écart sobrement ("Le quartier paraît encore tenir, mais la trajectoire change ce confort").
- Ne citez jamais les valeurs brutes des repères (jamais "vous avez répondu fragile"). Traduisez-les en lecture.
- N'inventez pas de repères absents.

HISTOIRE VÉCUE DU TERRITOIRE — ARRÊTÉS CATNAT
Si le payload contient "historique_catnat", la commune a déjà été reconnue en état de catastrophe naturelle un certain nombre de fois (nombre_arretes, depuis depuis_annee, aléas dans aleas_principaux). C'est une mémoire vécue, pas une projection. Vous POUVEZ l'évoquer UNE fois, sobrement, pour ancrer le récit dans le passé réel du territoire : "la commune a déjà connu X reconnaissances de catastrophe naturelle depuis {année}, surtout liées à {aléa}". Règles : jamais alarmiste, jamais une liste, ne citez pas la source (ni GASPAR ni Géorisques), n'inventez aucun chiffre absent. Si le champ est absent ou nul, n'en parlez pas.

PÉRIMÈTRE — MODULE TERRITOIRE
Le module Territoire pose le décor de la commune : ce qu'elle est, ce qui la transforme, ce à quoi elle est exposée. Vous traitez, à l'échelle communale : typologie et caractère du territoire, trajectoire de population, chaleur, sécheresse des sols, eau, inondation, submersion, feux, couvert naturel, évolution de la commune.
Vous ne concluez JAMAIS sur : le logement (valeur, confort, état du bâti), la santé (air respiré, effets sur le corps, exposition, bruit, pollution), la mobilité (trajets, dépendance à la voiture), le métier (secteur, emploi) ni les projets personnels (achat, enfants, retraite, départ). Si un de ces sujets émerge, mentionnez-le en une phrase comme une question à explorer dans le module concerné, sans la traiter ici.`;

// ─── Synthèse principale ───────────────────────────────────────────────────
const SYNTHESIS_PROMPT = `Vous êtes l'analyste éditorial de futur•e pour le module Territoire. Vous répondez à une seule question : "Que devient ce territoire ?"

${VOICE_RULES}

FORMAT DE SORTIE
Strictement :
1. Première ligne : un titre court de la forme "{Nom de la commune} à l'horizon {année}"
2. Une ligne vide.
3. Trois blocs, chacun introduit par exactement "## {nom du bloc}" sur sa propre ligne, suivi d'une ligne vide, puis de 2 à 4 phrases.
4. Une ligne vide entre les blocs.

Les trois blocs, dans cet ordre exact :
## Ce qui change
Évolutions majeures du territoire à l'horizon demandé. Décrire ce que devient le quotidien, le paysage, le rythme des saisons. Préférez "les étés deviennent plus longs et plus difficiles à rafraîchir la nuit" à une liste d'indicateurs.

## Les transformations à surveiller
Au plus 3 ou 4 sujets parmi : chaleur, eau, submersion, feux, sécheresse, qualité de l'air. Une à deux phrases par sujet, intégrées au paragraphe. Pas de liste à puces.

## Ce que cela raconte du territoire
Lecture d'ensemble. Le sujet principal n'est pas un événement isolé : c'est une trajectoire. Nommez-la sobrement.

LONGUEUR
Entre 350 et 550 mots au total. Pas plus. Mieux vaut court et clair que long et exhaustif.

CONTEXTE DU TERRITOIRE — QUAND IL EST FOURNI
Si le payload contient typologie, role_territorial, trajectoire_demographique, saisonnalite_touristique ou trait_distinctif, servez-vous-en pour situer le territoire (ce qu'il est, comment il évolue) avant ou pendant la lecture du climat. Posez le décor, ne dressez pas une liste. Le trait distinctif s'évoque une fois, sobrement, jamais comme un classement. La saisonnalité (résidences secondaires) se lit comme un trait du territoire, jamais comme un conseil d'achat ou d'investissement.

DONNÉES À VENIR
L'utilisateur vous transmet un payload JSON. Utilisez-le sans le réciter.`;

type WorkbookInput = {
  heat?: string;
  water?: string;
  shelter?: string;
  change?: string;
  note?: string;
};

type RequestBody = {
  inseeCode?: string;
  communeName?: string;
  horizon?: string;
  workbook?: WorkbookInput;
};

// Traduit les codes du workbook en repères lisibles pour le modèle.
// On envoie le sens (pas le code) pour qu'il puisse les interpréter sans
// avoir à connaître la grille interne.
const WORKBOOK_LABELS = {
  heat: {
    supportable: "L'été reste supportable",
    fragile: "L'été commence à peser",
    difficile: "L'été est déjà difficile",
  } as Record<string, string>,
  water: {
    loin: "Ne se sent pas concerné par l'eau",
    ponctuel: "A déjà vu quelques tensions autour de l'eau",
    present: "L'eau est déjà un sujet concret ici",
  } as Record<string, string>,
  shelter: {
    resilient: "Le quartier reste agréable pendant les fortes chaleurs",
    tendu: "Le quartier devient plus difficile pendant les fortes chaleurs",
    fragilise: "Le quartier souffre nettement pendant les fortes chaleurs",
  } as Record<string, string>,
  change: {
    faible: "N'observe pas vraiment de changement ces dernières années",
    visible: "Observe quelques évolutions visibles ces dernières années",
    fort: "Observe beaucoup de changements ces dernières années",
  } as Record<string, string>,
};

function shapeWorkbook(wb: WorkbookInput | undefined) {
  if (!wb) return null;
  const heat = wb.heat ? WORKBOOK_LABELS.heat[wb.heat] : null;
  const water = wb.water ? WORKBOOK_LABELS.water[wb.water] : null;
  const shelter = wb.shelter ? WORKBOOK_LABELS.shelter[wb.shelter] : null;
  const change = wb.change ? WORKBOOK_LABELS.change[wb.change] : null;
  const note = wb.note?.trim() || null;
  if (!heat && !water && !shelter && !change && !note) return null;
  return {
    chaleur_ressentie: heat,
    visibilite_sujet_eau: water,
    cadre_de_vie: shelter,
    changements_observes: change,
    note_libre: note,
  };
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response("Invalid JSON body.", { status: 400 });
  }

  const { inseeCode, communeName, horizon } = body;
  if (!inseeCode || !horizon || !HORIZON_META[horizon]) {
    return new Response("Missing or invalid inseeCode / horizon.", { status: 400 });
  }

  const meta = HORIZON_META[horizon];

  // Socle commun : une seule passe, Géorisques + GASPAR inclus.
  const enrichment = await gatherCommuneEnrichment(inseeCode).catch(() => null);
  const georisques = enrichment?.georisques ?? null;
  const catnat = enrichment?.catnat ?? null;

  const gwlData = enrichment?.drias?.commune.s?.[horizon]?.v ?? null;
  const displayName = communeName ?? enrichment?.ademe?.commune.nom ?? "votre commune";

  // Contexte macro (index comparateur, lecture seule) : pose le décor du territoire.
  const territoryCtx = await getTerritoryContext(inseeCode).catch(() => null);
  const entry = territoryCtx?.entry ?? null;
  const mood = deriveTerritoryMood({
    communeName: displayName,
    inseeCode,
    territoire: enrichment?.ademe?.commune.territoire ?? null,
  });
  const saisonnalitePct = await getResidencesSecondairesPct(inseeCode).catch(() => null);

  const payload = {
    commune: {
      nom: displayName,
      insee: inseeCode,
      population: enrichment?.ademe?.commune.population ?? null,
    },
    horizon: {
      annee: meta.year,
      scenario_france: meta.france,
    },
    climat_projete: gwlData
      ? {
          jours_au_dessus_30C: gwlData["NORTX30D_yr"] ?? null,
          jours_au_dessus_35C: gwlData["NORTX35D_yr"] ?? null,
          nuits_tropicales_au_dessus_20C: gwlData["NORTR_yr"] ?? null,
          jours_conditions_feu_meteo: gwlData["NORIFM40_yr"] ?? null,
          jours_secheresse_des_sols_SWI_inf_04: gwlData["NORSWI04_yr"] ?? null,
          precipitations_annuelles_mm: gwlData["NORRR_yr"] ?? null,
          precipitations_extremes_p99_mm: gwlData["NORRRq99_yr"] ?? null,
        }
      : null,
    risques_classes: georisques
      ? {
          inondation_fluviale: georisques.flags.flood,
          submersion_marine: georisques.flags.marineSubmersion,
        }
      : null,
    secheresse_actuelle_vigieau: enrichment?.vigieau?.maxLevel
      ? {
          niveau: enrichment.vigieau.maxLevel,
          bassin: enrichment.vigieau.topZone?.label ?? null,
          fin_validite: enrichment.vigieau.topZone?.endDate ?? null,
        }
      : null,
    cours_eau_assec_observe_onde: enrichment?.eau?.drought?.isDry
      ? {
          nom: enrichment.eau.drought.riverName ?? null,
          derniere_observation: enrichment.eau.drought.lastObservationDate ?? null,
        }
      : null,
    territoire_ademe: enrichment?.ademe?.commune.territoire
      ? {
          densite_hab_par_km2: enrichment.ademe.commune.territoire.densite,
          taux_boisement_pct: enrichment.ademe.commune.territoire.taux_boisement,
          vieillissement_pct_65_plus: enrichment.ademe.commune.vieillissement_pct ?? null,
          vacance_logements_pct: enrichment.ademe.commune.logements.vacants_pct ?? null,
        }
      : null,
    typologie: mood.typeLabel,
    role_territorial: territoryCtx
      ? { role: territoryCtx.role, agglomeration: territoryCtx.uuLabel }
      : null,
    trajectoire_demographique:
      entry?.demographie?.recit
        ? {
            tendance: RECIT_DEMOGRAPHIE[entry.demographie.recit] ?? null,
            part_nouveaux_arrivants_pct: entry.demographie.part_nouveaux,
          }
        : null,
    trait_distinctif: entry ? getCommuneDistinctive(entry) : null,
    saisonnalite_touristique:
      saisonnalitePct != null && saisonnalitePct >= 20
        ? {
            part_residences_secondaires_pct: saisonnalitePct,
            niveau: saisonnalitePct >= 40 ? "forte" : "marquée",
          }
        : null,
    historique_catnat:
      catnat && catnat.total > 0
        ? {
            nombre_arretes: catnat.total,
            depuis_annee: catnat.firstYear,
            derniere_annee: catnat.lastYear,
            aleas_principaux: catnat.byRisk.slice(0, 3),
          }
        : null,
    reperes_terrain_utilisateur: shapeWorkbook(body.workbook),
  };

  const userMessage = `Commune : ${displayName}. Horizon : ${meta.year} (scénario France ${meta.france}).

Produisez la sortie selon vos règles de format. Ne récitez pas le payload, utilisez-le.

DONNÉES :
${JSON.stringify(payload, null, 2)}`;

  const result = streamText({
    // Synthèse payante : Sonnet 4.6 pour la qualité. Côté AI SDK, l'effort et le
    // thinking se posent via providerOptions.anthropic (pas output_config).
    model: anthropic("claude-sonnet-4-6"),
    providerOptions: {
      anthropic: {
        effort: "medium",
        thinking: { type: "disabled" },
      },
    },
    system: SYNTHESIS_PROMPT,
    prompt: userMessage,
    onError: ({ error }) => {
      console.error("[synthesize-quartier] streamText error:", error);
    },
  });

  // Probe le premier chunk avant d'envoyer les headers : si l'IA est down,
  // on renvoie un vrai 502 plutôt que 200 + body vide. Le client peut alors
  // basculer sur le fallback statique.
  const iter = result.textStream[Symbol.asyncIterator]();
  let firstChunk: IteratorResult<string>;
  try {
    firstChunk = await iter.next();
  } catch (err) {
    console.error("[synthesize-quartier] first chunk failed:", err);
    return new Response("AI provider unavailable.", { status: 502 });
  }
  if (firstChunk.done) {
    return new Response("Empty stream from AI provider.", { status: 502 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode(firstChunk.value));
      try {
        while (true) {
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
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
