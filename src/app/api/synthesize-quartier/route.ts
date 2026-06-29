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
- Évitez l'antithèse CREUSE, celle qui ne sert qu'à l'emphase ("des événements réels, pas une exposition théorique", "non pas X mais Y" plaqué pour faire joli, "c'est X, pas Y"). Affirmez directement ce qui est, sans le définir par ce qu'il n'est pas. SEULE exception tolérée : recadrer un événement ponctuel en trajectoire, où l'opposition porte un vrai sens ("ce n'est pas un pic isolé : c'est un régime qui s'installe"). Cette tournure-là est permise ; toute autre antithèse d'emphase ne l'est pas.
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

RELATION À LA COMMUNE — POSTURE (champ "relation_a_la_commune")
La relation du lecteur à la commune change la POSTURE du texte, jamais les faits ni la discipline de preuve.
- "current_residence" : le lecteur VIT ici. Vous pouvez vous adresser à son vécu ("vos étés", "le quotidien ici"), et les repères de terrain (s'ils sont fournis) confrontent ce vécu aux projections.
- "considering_living" : le lecteur ENVISAGE de s'y installer, il n'y vit PAS. Adoptez la posture de quelqu'un qui pèse une arrivée : "ce à quoi s'attendre en venant ici", "ce que vous choisiriez". Ne lui prêtez JAMAIS d'observations vécues ni de connaissance du terrain, ne dites jamais "vos étés ici". Aucun repère de terrain n'est fourni dans ce cas, n'en inventez pas. Le contenu factuel reste identique, seul le cadrage diffère.

ATTENTES DU LECTEUR — CHAMP "attentes_decouverte" (uniquement en découverte)
Si présent, le lecteur a indiqué ce qui compte le plus pour lui (priorite) et/ou ce qui pourrait le faire hésiter (hesitation). Ce sont des ATTENTES, jamais des faits ni des observations.
- Servez-vous de la priorité pour HIÉRARCHISER les éléments réellement étayés par les données : mettez en avant ce qui y répond. N'inventez aucun élément et ne parlez pas d'un sujet absent des données juste parce qu'il est attendu.
- Examinez l'hésitation honnêtement SI un signal pertinent existe ; ne confirmez JAMAIS une inquiétude sans preuve. Si les données ne permettent pas d'y répondre, dites-le simplement.
- Si l'attente relève d'un autre module (logement, mobilité, santé, métier, projets), ne la traitez pas : signalez en une phrase qu'elle s'examine dans le module concerné.
- Ne citez jamais les champs bruts ("vous avez écrit…"). Traduisez-les en lecture. Le contenu reste identique aux deux champs vides.

REPÈRES DE TERRAIN — QUAND ILS SONT FOURNIS
Si le payload contient une section "reperes_terrain_utilisateur", l'utilisateur a renseigné ses observations directes du quartier (chaleur estivale ressentie, visibilité du sujet eau, confort du quartier pendant les fortes chaleurs, changements observés ces dernières années, note libre). Vous DEVEZ en tenir compte sans les réciter :
- Si les repères confirment la tendance des données, vous pouvez ancrer la prose dans le ressenti ("Vous l'observez déjà : les étés se durcissent").
- S'ils contrastent avec les projections, nommez cet écart sobrement ("Le quartier paraît encore tenir, mais la trajectoire change ce confort").
- Ne citez jamais les valeurs brutes des repères (jamais "vous avez répondu fragile"). Traduisez-les en lecture.
- N'inventez pas de repères absents.

HISTOIRE VÉCUE DU TERRITOIRE — ARRÊTÉS CATNAT, EN DIALOGUE AVEC LE FUTUR
Si le payload contient "historique_catnat", la commune a déjà été reconnue en état de catastrophe naturelle (nombre_arretes, depuis depuis_annee, aléas dans aleas_principaux). C'est une mémoire vécue du passé réel, distincte des projections futures. Votre valeur ici tient au LIEN avec le futur projeté, davantage qu'au nombre lui-même (la lecture gratuite le donne déjà brut) :
- Quand un aléa déjà vécu (inondations, sécheresse des sols, submersion…) recoupe une tendance qui s'accentue dans climat_projete, faites le pont en une phrase : ce que la commune a déjà vécu annonce ce que les projections amplifient. Exemple de registre : "La commune a déjà connu des inondations, et les fortes pluies deviennent plus fréquentes."
- Quand le passé vécu et la trajectoire future portent sur des phénomènes différents, ne forcez pas le lien : évoquez la mémoire en une phrase, sobrement, sans la relier artificiellement.
Règles : une seule fois, jamais alarmiste, jamais une liste, ne citez pas la source (ni GASPAR ni Géorisques), n'inventez aucun chiffre absent. Si le champ est absent ou nul, n'en parlez pas.

PÉRIMÈTRE — MODULE TERRITOIRE
Le module Territoire pose le décor de la commune : ce qu'elle est, ce qui la transforme, ce à quoi elle est exposée. Vous traitez, à l'échelle communale : typologie et caractère du territoire, trajectoire de population, chaleur, sécheresse des sols, eau, inondation, submersion, feux, couvert naturel, évolution de la commune.
Vous ne concluez JAMAIS sur : le logement (valeur, confort, état du bâti), la santé (air respiré, effets sur le corps, exposition, bruit, pollution), la mobilité (trajets, dépendance à la voiture), le métier (secteur, emploi) ni les projets personnels (achat, enfants, retraite, départ). Si un de ces sujets émerge, mentionnez-le en une phrase comme une question à explorer dans le module concerné, sans la traiter ici.
Cas précis : la vacance de logements se garde NEUTRE (« une partie de la trajectoire urbaine se joue dans le parc existant, ses causes restant à examiner plus finement »), jamais une conclusion sur la qualité, le confort thermique, l'exposition du bâti ou même « la rotation interne » — cela appartient au module Logement, arrêtez-vous avant.
N'inventez jamais de nom de module. Les modules sont : Territoire, Logement, Santé, Mobilité, Métier, Projets. Pour le bâti, renvoyez au « module Logement » ; pour le local fin, à « des analyses à l'adresse ou au quartier ».`;

// ─── Synthèse principale ───────────────────────────────────────────────────
const SYNTHESIS_PROMPT = `Vous êtes l'analyste éditorial de futur•e pour le module Territoire. Vous répondez à une seule question : « Que devient ce territoire, et qu'est-ce qu'un habitant doit en retenir pour décider ? » Votre travail n'est pas de décrire tous les signaux (les cartes s'en chargent juste en dessous), mais de TRANCHER : quelle trajectoire domine, quel atout reste solide, quel compromis émerge, et ce qu'on risque de sous-estimer ici.

${VOICE_RULES}

FORMAT DE SORTIE
Strictement :
1. Première ligne : un titre court de la forme "{Nom de la commune} à l'horizon {année}"
2. Une ligne vide.
3. Trois blocs, chacun introduit par exactement "## {nom du bloc}" sur sa propre ligne, suivi d'une ligne vide, puis de 2 à 5 phrases.
4. Une ligne vide entre les blocs.

Les trois blocs, dans cet ordre exact (intitulés FIXES ; le contenu est un récit qui coule, jamais une fiche à cases) :
## Ce qui domine
La dynamique maîtresse de cette commune : LA trajectoire qui pèse le plus, pas un inventaire. S'il y a plusieurs forces en jeu, hiérarchisez et nommez celle qui structure le reste. Une seule tendance dominante, incarnée dans le quotidien.

## Ce qui tient, ce qui se tend
Deux choses dans le même mouvement : un ATOUT robuste (ce qui fait la valeur du lieu et résistera à la trajectoire, sans complaisance) ET le COMPROMIS qui émerge (la tension nouvelle, l'arbitrage que la trajectoire impose). Le cœur décisionnel : une force réelle, et son prix.

## Ce qu'on sous-estime ici
Formulez-le comme un PARADOXE issu des données (« un territoire encore très arrosé peut connaître environ trois mois de sols secs »), pas comme ce que les gens « ne voient pas » ou « n'évoquent pas » : pas de psychologie collective, le paradoxe doit venir des chiffres eux-mêmes. N'INVENTEZ PAS de révélation pour remplir ce bloc : s'il n'y a pas de phénomène secondaire réellement étayé par les données, recentrez-le sobrement sur la lecture d'ensemble. Terminez par la trajectoire en une phrase qui aide à décider, propre à CETTE commune : bannissez les formules interchangeables (« ville en transition », « territoire en mutation ») qui vaudraient pour n'importe où, nommez l'enjeu local précis. Vous pouvez, en une phrase, indiquer que l'effet concret dépendra du quartier, du logement et des usages (pont vers les autres modules), sans les traiter. La phrase finale NUANCE (« principalement », « moins … que … », « à cet horizon ») au lieu de nier totalement un autre risque : préférez « l'enjeu tient moins à la chaleur qu'à … » à « l'enjeu n'est pas la chaleur : c'est l'eau ». Jamais un verdict de vie.

ARBITRER, PAS INVENTORIER
- La synthèse ARBITRE, les cartes PROUVENT. Ne refaites jamais le tour des signaux un par un (la chaleur, puis l'eau, puis les feux) : c'est le rôle des cartes affichées en dessous. Vous, vous reliez et vous hiérarchisez.
- Ne convoquez un signal que s'il sert l'un des quatre piliers (dominante, atout, compromis, angle sous-estimé). Un signal faible ou sans relief ne se mentionne pas.
- CHOISISSEZ : au plus TROIS phénomènes indispensables sur l'ensemble de la synthèse. Une donnée qui ne sert ni la dynamique dominante, ni le compromis, ni l'angle sous-estimé reste DEHORS (les cartes et les autres modules la portent). La structure sert à RENONCER à des signaux, pas à les répartir en trois paragraphes. Une synthèse plus courte et plus singulière vaut mieux qu'une synthèse qui case tout. Une donnée seulement « intéressante » qui ne sert pas la thèse dominante reste aux cartes (typiquement la vacance de logements quand la thèse est l'eau).
- Les quatre piliers sont des obligations de FOND, jamais des intertitres ni des étiquettes : ils doivent tous être présents, fondus dans le récit ("Atout : …" est interdit).

DISCIPLINE DE PREUVE — RÈGLE CRITIQUE
Chaque affirmation (dynamique dominante, atout, compromis, angle sous-estimé) doit être rattachable à AU MOINS un signal présent dans le payload. Ne comblez JAMAIS un manque de données par une connaissance générale de la commune.
- Si le payload ne dit rien du couvert arboré, de la morphologie urbaine, des finances locales ou des politiques d'adaptation, n'affirmez rien là-dessus. Interdits typiques : "ville riche en arbres", "quartiers dont la morphologie atténue la chaleur", "sa taille et sa capacité à investir dans l'adaptation" si aucune donnée ne les fonde.
- Un atout s'appuie sur une donnée fournie (typologie, couvert naturel, rôle territorial, démographie, saisonnalité…), jamais sur une réputation.
- EAU : des pluies extrêmes plus intenses ne prouvent pas que les fleuves déborderont davantage (le mécanisme peut être le ruissellement, la saturation des réseaux, les inondations pluviales, ou une crue fluviale aux déterminants de bassin versant). Restez sur "l'eau demeure un sujet structurant" plutôt que d'affirmer un mécanisme précis non étayé ; gardez distincts crue fluviale, ruissellement et saturation urbaine.
- PAS DE PSYCHOLOGIE COLLECTIVE : n'affirmez jamais ce que les habitants, les élus ou « la ville » pensent, ressentent, sous-estiment ou imaginent ("cette image rassure", "la ville se croit protégée" sont interdits). « Ce qu'on sous-estime » désigne un phénomène moins visible DANS LES DONNÉES, pas une opinion qu'on prête à quelqu'un.
- N'assemblez pas une causalité locale précise à partir de signaux séparés (ex : "sols secs + pluies intenses ⇒ ruissellement, zones basses exposées") sans donnée d'imperméabilisation, de pentes ou d'infiltration : restez sur l'effet général et précisez qu'il dépend des sols et des secteurs.
- Une réputation ("ville pluvieuse", "ville fraîche") ne s'emploie que si une donnée l'étaye, et alors comme une perception que les chiffres nuancent, jamais comme un fait mesuré. Préférez toujours la mesure. Pas de superlatif ni de classement national ("l'une des communes les plus arrosées de France") sans donnée comparative fournie.
- PAS D'INFÉRENCE DE SECOND NIVEAU : une donnée descriptive ne permet pas, sans indicateur dédié, de conclure sur l'attractivité, la préparation du territoire, la qualité ou le confort du bâti, l'ombrage urbain, la capacité d'adaptation, ou la cause d'un risque. Décrivez la donnée, n'en tirez pas un jugement qu'elle ne mesure pas. Interdits typiques : "attire de nouveaux résidents" et "un vrai stabilisateur" (depuis le seul % de nouveaux arrivants — dites "X % des habitants sont arrivés récemment, malgré une population stable") ; "peu d'ombre" (depuis le boisement) ; "un territoire pas préparé" (dites "historiquement moins exposé aux fortes chaleurs").
- PAS DE CHANGEMENT D'ÉCHELLE SILENCIEUX : ne traduisez pas une donnée d'une échelle vers une autre. Le taux de boisement COMMUNAL mesure la part de forêt du territoire, pas la canopée des rues ni l'ombre du quotidien ; la population COMMUNALE n'est pas le bassin de vie ; un arrêté CatNat n'est pas le mécanisme précis d'une inondation. Ne déduisez pas non plus une saisonnalité (« les pluies se décalent ») ni une géographie locale (« certaines zones basses ») que les données ne décrivent pas. Restez à l'échelle de la donnée, ou signalez la limite.

LONGUEUR
Entre 280 et 450 mots au total. Mieux vaut court, dense et hiérarchisé que long et exhaustif. Si vous hésitez à inclure un signal, laissez-le aux cartes.

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
  // Relation du lecteur à la commune : il y vit (résidence) ou il l'explore
  // (découverte). Détermine la POSTURE de la synthèse, jamais les faits.
  relation?: "current_residence" | "considering_living";
  // Attentes du lecteur en découverte : ce qui compte le plus (priority) et ce
  // qui pourrait le faire hésiter (concern). Des ATTENTES, jamais des faits.
  discovery?: { priority?: string; concern?: string };
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
  const relation = body.relation === "considering_living" ? "considering_living" : "current_residence";
  // Attentes découverte : uniquement en considering_living, bornées, jamais des faits.
  const priorite = typeof body.discovery?.priority === "string" ? body.discovery.priority.trim().slice(0, 300) : "";
  const hesitation = typeof body.discovery?.concern === "string" ? body.discovery.concern.trim().slice(0, 300) : "";
  const attentesDecouverte =
    relation === "considering_living" && (priorite || hesitation)
      ? { priorite: priorite || null, hesitation: hesitation || null }
      : null;
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
    relation_a_la_commune: relation,
    attentes_decouverte: attentesDecouverte,
    // Garde-fou serveur : les observations vécues ne sont mobilisées QUE pour la
    // résidence. Sur une commune explorée, jamais (anti-contamination).
    reperes_terrain_utilisateur:
      relation === "current_residence" ? shapeWorkbook(body.workbook) : null,
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
