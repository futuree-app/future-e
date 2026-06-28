import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import {
  resolveZoneAnchors,
  resolveExclusions,
  ZONE_TABLE,
  type AppliedZone,
  type ZoneAnchor,
  type ZoneStrength,
  type SoftZone,
} from "@/lib/geo-zones";
import { getLittoralIndex, type LittoralSummary } from "@/lib/littoral";
import {
  deptRegionalCategories,
  deptFromInsee,
  DEPT_MEDITERRANEE,
  DEPT_LITTORAL_ATLANTIQUE,
} from "@/lib/commune-categories";

// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie — moteur de compatibilité déterministe (V1).
//
// Principe : le scoring ne choisit JAMAIS via l'IA. Il filtre (contraintes
// dures), puis pondère (préférences), sur l'index national pré-calculé
// (data/comparateur-index.json). L'IA n'intervient qu'en amont (parse du projet)
// et en aval (synthèse d'interprétation), jamais ici.
//
// Objectif produit : des communes qu'un conseiller humain trouverait pertinentes,
// pas l'optimum d'indicateurs. D'où des courbes comportementales (isolement,
// calme, douceur) plutôt que des percentiles bruts, et une baseline de viabilité.
//
// NOTE DÉPLOIEMENT : l'index est lu via fs depuis data/. En prod (bundling
// serverless), ajouter data/comparateur-index.json à outputFileTracingIncludes
// dans next.config.ts pour qu'il soit embarqué.
// ════════════════════════════════════════════════════════════════════════════

export const PREFERENCE_KEYS = [
  "faible_chaleur",            // = rechercher la fraîcheur
  "douceur_climat",            // hivers tempérés + étés non extrêmes
  "ensoleillement_recherche",  // rayonnement solaire réel (ERA5)
  "faible_secheresse",
  "faible_risque_feu",
  "faible_precip_extremes",
  "proximite_mer",
  "cadre_calme",
  "eviter_isolement",
  // Viabilité du bassin d'emploi (ZE2020, Flores A38) : taille + diversité
  // sectorielle. Préférence poids 2 si l'emploi est signalé ; sinon partage le
  // plancher de réalisme avec eviter_isolement (baseline). Jamais un filtre dur.
  "viabilite_emploi",
  // Santé environnementale + vivabilité (V1.5/V1.6)
  "air_sain",                 // air de fond plus pur (PM2.5 ≫ NO2)
  "acces_soins",              // accès aux médecins généralistes (APL)
  "acces_services",           // services/commerces accessibles
  "faible_pression_agricole", // éloigné des cultures à traitements fréquents (pression, pas exposition)
  // Caractère naturel à proximité (OSO 2023, couvert naturel élargi dans 15 km).
  // « perçu comme naturel », pas biodiversité ni wilderness. cf. NATURE_TERRITORIAL.md.
  "nature",
  // Accès BPE (collèges+lycées / offre culturelle large), pondéré par la proximité,
  // rayon adapté au territoire (5 à 25 km), percentile national.
  // Opt-in strict : aucun plancher. Accès, JAMAIS la qualité ni la vitalité.
  "acces_ecoles",
  "acces_culture",
  // Risque inondation fluvial/pluvial : historique d'arrêtés CatNat (GASPAR), percentile national.
  // Opt-in, préférence graduée. Distinct de faible_precip_extremes (pluies, pas risque réel).
  "faible_risque_inondation",
  // Mobilité. faible_dependance_auto = part voiture domicile-travail (MOBPRO) ; acces_transports
  // = accès ferroviaire pondéré desserte (gares SNCF). Opt-in, graduées. cf. populate-mobilite/transports.
  "faible_dependance_auto",
  "acces_transports",
  // Mobilité du quotidien : réseau TC à portée de marche (arrêts OSM bus/tram/métro, rehaussé
  // par le mode structurant). Distinct du rail (ouverture) et de la dépendance auto
  // (comportement). Opt-in. cf. populate-reseau-local.
  "mobilite_quotidienne",
  // Taille de ville (UU). eviter_grandes_villes = préférer le petit (cloche petite/moyenne ville
  // avec le plancher eviter_isolement) ; prefere_grande_ville = préférer le grand. cf. chantier C.
  "eviter_grandes_villes",
  "prefere_grande_ville",
  // Vie étudiante (BPE C5xx + effectifs MESR). Accès aux études + dynamisme étudiant combinés
  // (40/60). Opt-in. cf. populate-bpe (etudes_acces) + populate-etudiants (etudes_dyn).
  "vie_etudiante",
  // Vie locale : intensité de vie sociale (lieux de sociabilité OSM + tissu associatif RNA/AMALIA,
  // densité par habitant avec masse critique). Présence d'une vie sociale, jamais l'événementiel. Opt-in.
  "vie_locale",
  // Croissance démographique : trajectoire de population (gagne/perd des habitants), INSEE
  // 2015-2021. Narratif = part de nouveaux arrivants (IRAN). Descriptif, jamais normatif. Opt-in.
  "croissance_demographique",
  // Calme sonore : EXPOSITION CUMULÉE aux grandes infrastructures bruyantes (autoroutes/voies
  // rapides, rail à 3 tiers lgv/main/branch, aéroports commerciaux) dans un rayon d'ambiance.
  // Score = densité d'infra bruyantes autour du lieu de vie (pas la distance à la plus proche),
  // saturée -> loin de tout = 100. Récit = source la plus proche nommable. Descriptif, pas dB.
  // Distinct de cadre_calme (densité de bâti). Opt-in. cf. populate-calme-sonore.py.
  "calme_sonore",
  // Exposition industrielle : éloignement aux installations classées à risque (Géorisques ICPE :
  // Seveso/IED/industrie EN ACTIVITÉ). Exposition HYBRIDE (site dominant + concentration), pondérée
  // par gravité. Présence administrative, PAS un niveau de pollution ni un risque sanitaire avéré.
  // Ne couvre PAS l'héritage pollué (Marcel-Paul, V2). Loin de tout = 100. Opt-in. cf.
  // populate-exposition-industrielle.py.
  "faible_exposition_industrielle",
] as const;
export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

export type Preference = { key: PreferenceKey; weight: number };

export type HardConstraints = {
  departements?: string[];
  // Ancres géographiques avec gradient de force (cf. geo-zones.ts). Chaque ancre
  // porte une force : hard (filtre, définit le périmètre, ancres dures
  // intersectées), preferred / inspiration (bonus de score, sans exclusion). Les
  // régions administratives sont des jetons de zone comme les autres (plus de champ
  // region séparé). excludeZones = ancres négatives, dures en V1. Le parse n'émet
  // que des jetons d'une liste fermée ; le moteur détient la table jeton → départements.
  zones?: ZoneAnchor[];
  excludeZones?: string[];
  // Montagne générique = critère d'ALTITUDE propre à la commune (distinct des
  // massifs nommés, qui sont des zones). Même gradient de force : hard = filtre
  // (altitude ≥ ~600 m), preferred / inspiration = bonus proportionnel à la
  // montagnosité.
  montagne?: { strength: ZoneStrength } | null;
  // « Proche d'une montagne » = PROXIMITÉ au relief (massif à portée), distincte de
  // l'altitude propre (montagne). Grenoble (214 m) est proche d'une montagne sans
  // être en altitude. Même gradient : hard = filtre (relief_proximite ≥ 50),
  // preferred / inspiration = bonus proportionnel. Adossé à relief_proximite (index).
  reliefProche?: { strength: ZoneStrength } | null;
  nearSea?: { active: boolean; maxKm?: number | null };
  excludeSea?: boolean;
  nearPlace?: { label: string; maxKm?: number | null } | null;
  communeSize?: { min?: number | null; max?: number | null } | null;
  // « Quitter {ville} » : exclut l'unité urbaine de la ville (le moteur résout label -> UU).
  excludePlace?: { label: string }[];
  // « Plus petit / grand que {ville} » : le moteur résout label -> population communale de
  // référence et pose communeSize (V1 : comparaison COMMUNALE, pas d'agglomération, cf. spec).
  sizeRelativeTo?: { label: string; direction: "smaller" | "larger" } | null;
};

export type HorsMesureKind = "ecoles" | "culture" | "affectif";

export type ParsedProject = {
  reformulation: string;
  hardConstraints: HardConstraints;
  preferences: Preference[];
  ambiguities?: { topic: string; question: string }[];
  // Projet hors-emploi (retraite, télétravail total, sans activité) : supprime la
  // baseline de viabilité du bassin d'emploi (ne jamais pénaliser un tel projet).
  emploiHorsSujet?: boolean;
  // Intention « héritage industriel / sols pollués » exprimée par l'utilisateur. Booléen pur
  // (PAS une préférence pesée, PAS un PREFERENCE_KEY). Gate le récit heritageIndustriel en synthèse,
  // comme l'intention littorale gate le récit littoral. cf. parse/route.ts.
  heritageIntent?: boolean;
  // Notions exprimées par l'utilisateur SANS critère dans le moteur (écoles, vie
  // culturelle, caractère affectif). Pur affichage honnête au gate, aucun impact
  // sur le score. cf. plan 2026-06-03 (constat QA : ces notions étaient avalées en silence).
  horsMesure?: { term: string; kind: HorsMesureKind }[];
  // Communes-ANCRES (« une ville comme {commune} »). Le LLM n'extrait que le label ;
  // la dérivation des traits est déterministe, dans la route parse (post-LLM).
  // ANCRAGE, pas similarité : traduit en préférences nommées, jamais en score. cf. Pari #7.
  communeAncre?: { label: string }[];
};

export type MatchResult = {
  insee: string;
  nom: string;
  dept: string;
  region: string | null;
  compatibility: number; // 0–100
  reasons: string[];
  // Signature territoriale : couche DISTINCTE des reasons. Ne justifie pas le
  // score, donne une image du territoire (géo → bassin → climat/relief, max 3),
  // à partir des seuls attributs mesurés. cf. buildSignature.
  signature: string[];
  tradeoff: string | null; // le compromis principal, ou null
  // Pression climatique sur l'économie locale (NARRATIF, n'entre PAS dans le score).
  // Note de lecture prudente : dépendance à un secteur sensible, pas un verdict.
  pressionEco: { palier: "moderee" | "marquee"; note: string } | null;
  // Pression climatique inondation (NARRATIF, n'entre PAS dans le score/tri/reasons).
  // Signal complémentaire affiché UNIQUEMENT quand la trajectoire DRIAS des pluies
  // extrêmes change la lecture de l'historique CatNat observé. Jamais une prédiction.
  // null = silence (climat n'ajoute rien, ou DRIAS manquant). cf. buildClimatInondation.
  climatInondation: string | null;
  // Logement (NARRATIF, hors score, hors tri). UNE phrase de niveau de prix RELATIF :
  // agrégée (« marché … ») quand achat et location vont dans le même sens, détaillée
  // (« achat …, loyers … ») seulement en cas de divergence. Jamais un chiffre ni une
  // accessibilité (détail au rapport). null = silence (moyen, ou achat indisponible).
  logement: string | null;
  // Littoral (NARRATIF, hors score, hors tri). Renseigné UNIQUEMENT si l'utilisateur
  // exprime une intention littorale ET que la commune est inscrite au titre du recul
  // du trait de côte (liste officielle). null sinon (silence). cf. hasCoastalIntent.
  littoral: string | null;
  // Trait distinctif RELATIF aux communes affichées (« la plus proche de grands
  // espaces naturels des trois »). Palette hiérarchisée (P1 projet de vie > P2 climat/
  // taille). Narratif, hors score, hors tri. null si rien ne se détache. cf. buildDistinctive.
  distinctive: string | null;
  // Identité « promesse de vie » (NARRATIF, hors score/tri). Déterministe par
  // archétype (taille UU × contexte × dominante). Raconte la décision, pas la
  // géographie. cf. buildIdentite.
  identite: string;
  // Compromis TOUJOURS présent (NARRATIF, hors score/tri). tradeoff absolu si
  // worst < 50, sinon retrait relatif au groupe affiché, sinon « sans faiblesse
  // marquée ». Finalisé après assemblage (assignCompromis). cf. spec.
  compromis: string;
  // Découverte (NARRATIF, hors score/tri) : une force POSITIVE sur une dimension
  // NON demandée (« tiens, je n'y avais pas pensé »). null si rien de saillant.
  // Finalisée après assemblage (assignDecouverte). cf. spec (2e force).
  decouverte: string | null;
  // Évolution démographique (NARRATIF, hors score/tri). Récit plus riche que la reason :
  // distingue « gagne et attire », « gagne sans renouvellement », « stable mais renouvellement »,
  // « perd ». Surfacé en synthèse UNIQUEMENT si croissance_demographique est demandée (même
  // frontière que climatInondation). null = pas de donnée. cf. RECIT_DEMOGRAPHIE.
  demographie: string | null;
  // Calme sonore (NARRATIF, hors score/tri). Récit explicatif : nomme la source bruyante la
  // plus proche NOMMABLE et sa distance (« autoroute à ~900 m »). Le score, lui, est cumulé.
  // Surfacé en synthèse UNIQUEMENT si calme_sonore est demandé (même frontière que demographie/
  // climatInondation). null = silence (aucune source proche nommable). cf. calmeSonoreRecit.
  calmeSonore: string | null;
  // Exposition industrielle (NARRATIF, hors score/tri). Nomme en langage courant le site le plus
  // préoccupant proche, SANS chiffre : « la proximité d'un site industriel à risque majeur »
  // (Seveso) / « d'un site industriel » (IED/industrie). Gaté en synthèse par « critère demandé ».
  // null = silence (aucun site préoccupant proche). cf. expoIndustrielleRecit.
  expoIndustrielle: string | null;
  // Héritage industriel (NARRATIF, hors score/tri). Nomme au passé l'ancien site SSP/ex-BASOL le
  // plus proche identifiable (« une ancienne usine à gaz est recensée à proximité »), SANS
  // « pollué/risque » ni chiffre (état/substances = rapport). Gaté en synthèse par l'intention
  // héritage exprimée (comme calmeSonore par son critère). null = silence. cf. heritageRecit.
  heritageIndustriel: string | null;
  // Signaux ambiants (NARRATIF, hors score, hors tri) : 0 à 5 phrases qualitatives
  // descriptives par territoire (bande nationale, filtrées par contraste de groupe),
  // pour qu'AskFuture réponde aux « et côté X ? » hors critères. clé dimension lisible
  // -> phrase. Jamais de chiffre. cf. assignSignaux + AMBIENT_DIMENSIONS.
  signaux: Record<string, string>;
  metrics: {
    distance_cote_km: number;
    population: number | null;
    jours_chauds_30: number | null;
    temp_hiver: number | null;
    precip_annuelle: number | null;
    ifm: number | null;
  };
};

// ── Comparaison complète (Pack Décision, narratif, hors score/tri) ────────────
// Matrice d'arbitrages du trio affiché : 27 dimensions groupées en 7 thèmes stables.
// Mot du palier = ABSOLU (seuils nationaux), avantage = RELATIF au trio. cf. spec
// 2026-06-05-comparateur-complet-design.
export type ComparaisonAvantage =
  | { type: "avantage"; insees: string[] } // 1 ou 2 communes au meilleur palier du trio
  | { type: "egalite" } // les trois au même palier
  | { type: "neutre" }; // dimension non directionnelle (taille, ensoleillement) : pas de gagnant

export type ComparaisonCellule = {
  insee: string;
  palier: string; // mot incarné absolu (« Très préservé »)
  qualifier: string | null; // suffixe court non chiffré (« axe routier proche ») ou null
  disponible: boolean; // false = donnée non mesurée pour cette commune
  alerte: boolean; // true = pire tier d'un critère de RISQUE, alors qu'une autre commune fait mieux
};

export type ComparaisonLigne = {
  id: string; // id de dimension
  label: string; // « Calme sonore »
  aide: string; // glose tooltip affichée au survol du label
  avantage: ComparaisonAvantage;
  cellules: ComparaisonCellule[]; // 3, ordre des picks
};

export type ComparaisonTheme = {
  id: string;
  titre: string; // « SANTÉ ENVIRONNEMENTALE »
  synthese: string; // phrase honnête
  lignes: ComparaisonLigne[];
};

// Divergence (« la ligne de fracture », mode choix) : LE point où les communes nommées
// s'écartent le plus. Déterministe, hors score. Sert l'ouverture du résultat gratuit (montrer
// la TENSION, pas un classement) et désigne le thème à dévoiler en entier. domine = aucune
// vraie tension (une commune mène presque tous les thèmes) : on bascule sur « ce ne sont pas
// vraiment des compromis » et la fracture pointe la seule raison de pencher autrement.
export type Divergence = {
  dimId: string;
  themeId: string;
  label: string; // libellé de la dimension (« Risque d'inondation »)
  leaderInsee: string;
  leaderPalier: string; // palier favorable de la commune qui mène
  exposeInsee: string;
  exposePalier: string; // palier défavorable de la commune en retrait
  domine: boolean;
  dominatorInsee: string | null; // si domine : la commune qui mène presque tous les thèmes
} | null;

export type ComparaisonComplete = {
  resume: string[]; // « En résumé » : 1 à 3 phrases, niveau thème (qui mène sur quels thèmes)
  // Phrase de hiérarchisation (mode choix) : forme conditionnelle à deux pôles, qui rend le
  // critère au lecteur (« Si X compte d'abord, A prend l'avantage ; … »). Déterministe, bâtie
  // depuis les deux communes qui mènent le plus de thèmes. null si pas de vrai arbitrage à deux
  // pôles (une commune domine, ou une seule mène).
  arbitrage: string | null;
  // Contexte spatial (mode choix) : UNE ligne sur la RELATION entre les communes (distance, même
  // région / même unité urbaine). Révèle ce que les thèmes ne disent pas (à quel point les
  // options sont proches ou éloignées : « même agglo » = on coupe les cheveux en quatre ;
  // « 920 km, deux régions » = deux vies radicalement différentes). Déterministe, jamais une
  // carte ni un bloc (cf. arbitrage board 2026-06-27 « révéler, pas localiser »). null si données
  // de position manquantes.
  spatialContext: string | null;
  divergence: Divergence; // mode choix : la ligne de fracture (null si tout est à égalité)
  themes: ComparaisonTheme[];
};

export type MatchOutcome = {
  perfectMatch: boolean;
  bestCompatibility: number;
  candidates: number;
  message: string | null;
  results: MatchResult[];
  // Comparaison complète du trio affiché (Pack Décision). Calculée sur les 3 premiers
  // results, narratif, hors score/tri. cf. buildComparaisonComplete.
  comparaisonComplete: ComparaisonComplete;
  // Pistes : les communes suivantes (rangs 4-5-6) du MÊME projet, narratif calculé
  // comme leur propre groupe de 3 (identité, forces, compromis), pour le Pack Décision.
  // Réservé au payload payant : le verrou (route /match) le retire de la réponse gratuite.
  pistes: MatchResult[];
  // Ancres réellement appliquées (libellé + convention assumée), pour un affichage
  // honnête du périmètre côté UI (« recherche limitée au Sud, au sens… »).
  appliedZones?: AppliedZone[];
  appliedExclusions?: AppliedZone[];
  // Contraintes ville/taille résolues (« exclusion de l'agglomération de Lyon »,
  // « communes plus petites que Bordeaux »), pour l'affichage honnête du périmètre.
  appliedPlaces?: string[];
};

// Tailles de ville (V1) — utilisées par le parse pour traduire "petite / moyenne
// / grande ville" en contrainte communeSize.
export const VILLE_SIZE = {
  petite: { min: 5000, max: 25000 },
  moyenne: { min: 25000, max: 100000 },
  grande: { min: 100000, max: null as number | null },
};

const POP_FLOOR = 1500; // plancher de réalisme : on retire les hameaux
const PERFECT_THRESHOLD = 80;
const VIABILITY_BASELINE_W = 1; // plancher de réalisme classique (isolement) si absent
// Quand l'emploi n'est pas mentionné, on PARTAGE ce budget de 1 entre isolement et
// viabilité du bassin (0,5 + 0,5) : le plancher devient bassin-conscient sans ajouter
// de poids universel (budget de viabilité implicite inchangé vs V1). cf. checkpoint 2026-06-01.
const VIABILITY_BASELINE_SPLIT = 0.5;

// ── Courbes comportementales (interpolation linéaire entre ancres) ───────────
type Anchors = [number, number][];
function lerp(anchors: Anchors, x: number | null | undefined): number | null {
  if (x == null) return null;
  if (x <= anchors[0][0]) return anchors[0][1];
  const last = anchors[anchors.length - 1];
  if (x >= last[0]) return last[1];
  for (let i = 1; i < anchors.length; i++) {
    if (x <= anchors[i][0]) {
      const [x0, y0] = anchors[i - 1];
      const [x1, y1] = anchors[i];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return last[1];
}
const ISOLEMENT: Anchors = [[0, 0], [1000, 5], [2000, 15], [5000, 45], [10000, 65], [20000, 80], [50000, 92], [100000, 97], [300000, 100]];
// Taille d'UU -> préférence. Bornes éditoriales (cf. spec) : village <2k, petite 2-25k,
// moyenne 25-100k, grande 100-500k, métropole >500k. GRANDE_VILLE_MIN décroît (favorise le
// petit), GRANDE_VILLE_MAX croît (favorise le grand). La cloche petite/moyenne émerge de la
// composition avec eviter_isolement (plancher).
const GRANDE_VILLE_MIN: Anchors = [[0, 100], [2000, 100], [25000, 85], [100000, 55], [300000, 25], [500000, 12], [1000000, 3]];
const GRANDE_VILLE_MAX: Anchors = [[0, 0], [25000, 10], [100000, 40], [300000, 70], [500000, 85], [1000000, 97], [2000000, 100]];
const CALME: Anchors = [[0, 55], [30, 65], [80, 85], [150, 95], [400, 100], [800, 95], [1500, 80], [3000, 55], [6000, 30], [12000, 12], [30000, 3]];
const WINTER_MILD: Anchors = [[-3, 5], [1, 30], [4, 60], [7, 88], [9, 100], [12, 95], [16, 80]];
// Montagnosité : altitude (m) → score 0-100, recalée « vivre à la montagne » (pas
// que la haute montagne). Pivot 600 m = 50 (= seuil du filtre dur). cf. ANCRES.
const MONTAGNE: Anchors = [[300, 0], [600, 50], [1000, 85], [1400, 100]];
function montagnosite(alt: number | null | undefined): number | null {
  return alt == null ? null : lerp(MONTAGNE, alt);
}

// ── Index ────────────────────────────────────────────────────────────────────
export type IndexCommune = {
  insee: string;
  nom: string;
  dept: string;
  region: string | null;
  lat: number;
  lon: number;
  population: number | null;
  densite: number | null;
  distance_cote_km: number;
  altitude?: number | null; // m NGF, centroïde IGN RGE ALTI (base de la détection « montagne »)
  // Proximité au relief (0–100) : altitude max dans ~35 km. Distingue « proche
  // d'une montagne » (Grenoble 95, Pau 69) de la plaine (Toulouse 0), là où
  // l'altitude propre échoue (Grenoble est à 214 m). cf. scripts/add-relief-proximite.mjs.
  relief_proximite?: number | null;
  // Ensoleillement réel : rayonnement solaire reçu au sol (ERA5-Land, indice
  // J/m²/j) et son percentile national (0–100, haut = plus ensoleillé). Remplace
  // l'ancien proxy faux (été chaud + peu de pluie). cf. scripts/populate-rayonnement-*.
  rayonnement?: number | null;
  rayonnement_pct?: number | null;
  clim: Record<string, number | null>;
  pct: Record<string, number | null>;
  viv?: Record<string, number | null>;
  vivpct?: Record<string, number | null>;
  agri?: Record<string, number | null>;
  pression_agricole?: number | null;
  // Viabilité du bassin d'emploi (ZE2020 héritée). taille/diversite = 0–100.
  emploi?: { ze: string; taille: number; diversite: number } | null;
  // Pression climatique sur l'économie locale (NARRATIF, hors score) : un secteur
  // sensible dont l'économie dépend, exposé à un aléa. null = faible (aucune note).
  pression_eco?: { palier: "moderee" | "marquee"; secteur: string; alea: string } | null;
  // Caractère naturel (cf. scripts/populate-nature.py, OSO 2023). score = percentile
  // national du rayon 15 km (pour le moteur) ; brut_pct + composition pour le rapport.
  nature?: {
    score: number; // 0-100, percentile national du couvert naturel élargi dans 15 km
    brut_pct: number; // couvert naturel élargi DANS la commune
    radius_pct: number | null;
    composition: Record<string, number>;
  } | null;
  // Logement (cf. scripts/populate-logement.mjs). Niveaux relatifs en paliers ;
  // médianes/maille/fiabilité conservées pour le RAPPORT, jamais exposées au gate.
  logement?: {
    achat:
      | { dispo: false }
      | {
          dispo: true;
          niveau: "tres_bas" | "bas" | "moyen" | "haut" | "tres_haut";
          maison: { eur_m2: number; maille: string } | null;
          appart: { eur_m2: number; maille: string } | null;
        };
    location: {
      niveau: "tres_bas" | "bas" | "moyen" | "haut" | "tres_haut";
      appart_eur_m2: number | null;
      maison_eur_m2: number | null;
      fiabilite: "observee" | "estimee";
    } | null;
  } | null;
  // Accès BPE pondéré par la proximité, rayon adapté au territoire, 5 km en métropole à
  // 25 km en rural (cf. scripts/populate-bpe.py). score = percentile national
  // du comptage d'équipements ; count = brut conservé pour un futur rapport. Accès, pas qualité.
  ecoles?: { score: number | null; count: number } | null;
  culture?: { score: number | null; count: number } | null;
  // Unité urbaine INSEE (UU2020, cf. scripts/populate-unite-urbaine.py). null = commune hors
  // unité urbaine (isolée/rurale). Sert à « quitter {ville} » (exclusion par agglomération).
  uu?: string | null;
  // Risque inondation (cf. scripts/populate-inondation.py). catnat = nb d'arrêtés CatNat
  // inondation (hors submersion marine) ; tri réservé (false en V1) ; risque 0-100 (haut = exposé).
  inondation?: { catnat: number; tri: boolean; risque: number } | null;
  // Mobilité domicile-travail (cf. scripts/populate-mobilite.py, RP MOBPRO 2022). part_voiture
  // brut 0..1 (rapport futur) ; dependance = percentile national (haut = dépend de la voiture).
  mobilite?: {
    part_voiture: number;
    dependance: number;
  } | null;
  // Accès ferroviaire (cf. scripts/populate-transports.py, gares SNCF + fréquentation).
  // desserte = percentile national de l'accès pondéré (haut = bien reliée par le train).
  transport?: {
    desserte: number;
    gare_nom: string | null;
    gare_km: number | null;
  } | null;
  // Réseau de mobilité du quotidien (cf. scripts/populate-reseau-local.py : arrêts OSM
  // bus/tram/métro). acces = percentile PARMI les communes desservies (réseau crédible à
  // pied) ; null = non desservie. tram/metro = mode structurant à portée de marche.
  reseauLocal?: {
    acces: number;
    tram: boolean;
    metro: boolean;
    arret_km: number;
  } | null;
  // Vie locale (cf. scripts/populate-vie-locale.py). score = 0.7 lieux de sociabilité (OSM) +
  // 0.3 tissu associatif (RNA + AMALIA), densité par habitant lissée (masse critique K=1000).
  // null = pas de vie locale mesurable. Présence d'une vie sociale, PAS l'événementiel.
  vieLocale?: {
    score: number;
    lieux_pct: number;
    assos_pct: number;
  } | null;
  // Croissance démographique (cf. scripts/populate-demographie.py, INSEE 2015-2021).
  // croissance = percentile national signé du taux de croissance total. part_nouveaux + recit =
  // narratif « nouveaux arrivants » (IRAN), HORS score. Trajectoire, PAS désirabilité.
  demographie?: {
    croissance: number;
    taux_total: number;
    part_nouveaux: number | null;
    recit: string | null;
  } | null;
  // Vie étudiante. etudes_acces = percentile présence établissements sup (BPE C5xx, cf.
  // populate-bpe.py) ; etudes_dyn = percentile part étudiante au niveau UU (MESR, cf.
  // populate-etudiants.py). Combinés dans subScore("vie_etudiante").
  etudes_acces?: number | null;
  etudes_dyn?: number | null;
  // Calme sonore (cf. scripts/populate-calme-sonore.py). score = exposition cumulée saturée
  // (densité d'infra bruyantes dans R_EXPO, jamais la distance à la plus proche) -> loin de
  // tout = 100, JAMAIS null au sens « non noté ». sourceDominante ∈ {auto,rail,aero} | null +
  // distanceKm = source la plus proche NOMMABLE (récit seul, pas le score) ; null = silence.
  calmeSonore?: {
    score: number;
    sourceDominante: "auto" | "rail" | "aero" | null;
    distanceKm: number | null;
  } | null;
  // Exposition industrielle (cf. scripts/populate-exposition-industrielle.py). score = exposition
  // hybride saturée (dominant + λ·bassin, pondérée gravité) -> loin de tout = 100, JAMAIS null au
  // sens « non noté ». sourceDominante = classe du site le plus préoccupant proche (récit).
  expoIndustrielle?: {
    score: number;
    sourceDominante: "seveso_haut" | "seveso_bas" | "ied" | "industrie" | null;
  } | null;
  // Héritage industriel (cf. scripts/populate-heritage-industriel.py). Signal NARRATIF, NON scoré.
  // Site SSP/ex-BASOL (couche `instructions`) IDENTIFIABLE le plus proche du chef-lieu. null =
  // aucun dans le rayon. activite = catégorie grand public (repli "generique"). distanceKm INTERNE.
  heritageIndustriel?: {
    activite: "usine_gaz" | "raffinerie_hydrocarbures" | "station_service" | "chimie" | "metallurgie" | "mine" | "decharge" | "generique";
    plusieurs: boolean;
    distanceKm: number;
  } | null;
};
type IndexFile = { meta: unknown; communes: IndexCommune[] };

let indexCache: IndexCommune[] | null = null;
let nameCache: Map<string, IndexCommune> | null = null;

// Population d'unité urbaine = somme des populations communales par code UU. Dérivée au
// chargement de l'index (pas de source externe, pas de regénération de l'index). Sert à
// mesurer la TAILLE D'AGGLOMÉRATION (isolement, taille de ville) plutôt que la commune seule.
let uuPopCache: Map<string, number> | null = null;
function buildUuPop(communes: IndexCommune[]): void {
  const m = new Map<string, number>();
  for (const c of communes) {
    if (c.uu && c.population != null) m.set(c.uu, (m.get(c.uu) ?? 0) + c.population);
  }
  uuPopCache = m;
}
// Taille du « bassin de ville » : pop d'UU si la commune est dans une UU, sinon sa pop
// communale (une commune hors UU est son propre bassin). cf. spec chantier C.
function tailleVille(c: IndexCommune): number | null {
  if (c.uu && uuPopCache) {
    const p = uuPopCache.get(c.uu);
    if (p != null) return p;
  }
  return c.population ?? null;
}

async function loadIndex(): Promise<IndexCommune[]> {
  if (indexCache) return indexCache;
  const filePath = path.join(process.cwd(), "data", "comparateur-index.json");
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as IndexFile;
  indexCache = parsed.communes;
  buildUuPop(indexCache);
  return indexCache;
}

// ════════════════════════════════════════════════════════════════════════════
// ACCESSEURS LECTURE SEULE — module Territoire
// N'affectent ni le matching, ni le scoring : ils relisent l'index déjà chargé
// (et son cache UU) pour exposer une seule commune à la page /rapport/quartier.
// ════════════════════════════════════════════════════════════════════════════

let inseeIndexCache: Map<string, IndexCommune> | null = null;
// Libellé d'unité urbaine dérivé de l'index : nom de la commune la plus peuplée
// de l'UU (convention INSEE usuelle). Aucune source externe, aucun parsing xlsx.
let uuLabelCache: Map<string, string> | null = null;

function buildInseeIndex(communes: IndexCommune[]): void {
  const m = new Map<string, IndexCommune>();
  for (const c of communes) m.set(c.insee, c);
  inseeIndexCache = m;
}

function buildUuLabels(communes: IndexCommune[]): void {
  const best = new Map<string, { nom: string; pop: number }>();
  for (const c of communes) {
    if (!c.uu) continue;
    const pop = c.population ?? 0;
    const prev = best.get(c.uu);
    if (!prev || pop > prev.pop) best.set(c.uu, { nom: c.nom, pop });
  }
  const m = new Map<string, string>();
  for (const [uu, v] of best) m.set(uu, v.nom);
  uuLabelCache = m;
}

export async function getCommuneEntry(insee: string): Promise<IndexCommune | null> {
  const communes = await loadIndex();
  if (!inseeIndexCache) buildInseeIndex(communes);
  // Paris/Lyon/Marseille : l'index est par arrondissement, le code commune (75056/
  // 69123/13055) n'existe pas ici. Repli null assumé (la page n'affiche alors pas
  // les cartes concernées plutôt qu'un trou).
  return inseeIndexCache!.get(insee.trim()) ?? null;
}

export type TerritoryContext = {
  entry: IndexCommune;
  uuLabel: string | null; // nom de l'agglomération (commune la plus peuplée de l'UU)
  uuPop: number | null; // population de l'unité urbaine
  role: "isolee" | "pole" | "agglo"; // place de la commune dans son agglomération
};

export async function getTerritoryContext(insee: string): Promise<TerritoryContext | null> {
  const communes = await loadIndex();
  if (!inseeIndexCache) buildInseeIndex(communes);
  const entry = inseeIndexCache!.get(insee.trim());
  if (!entry) return null;
  if (!uuLabelCache) buildUuLabels(communes);

  const uuLabel = entry.uu ? uuLabelCache!.get(entry.uu) ?? null : null;
  const uuPop = entry.uu ? uuPopCache?.get(entry.uu) ?? null : null;
  let role: TerritoryContext["role"];
  if (!entry.uu) role = "isolee";
  else if (uuLabel && normalizeName(uuLabel) === normalizeName(entry.nom)) role = "pole";
  else role = "agglo";

  return { entry, uuLabel, uuPop, role };
}

// ════════════════════════════════════════════════════════════════════════════
// CATÉGORIES ÉDITORIALES DE L'ACCUEIL (landing) — depuis la VRAIE donnée commune
//
// Remplace l'ancien fallback par préfixe département (commune-categories.ts), qui
// ne savait émettre que 5 étiquettes et laissait dormir l'essentiel du catalogue
// de tensions. Ici on lit l'entrée d'index (commune-level) pour émettre le
// vocabulaire que tensions_catalog attend réellement.
//
// DOCTRINE : ces catégories CHOISISSENT un angle (quelle question / quelle carte
// proposer pour donner envie), elles n'affichent JAMAIS un chiffre. Les seuils
// sont donc volontairement tolérants — pas de fausse précision. La couche
// régionale (climat méditerranéen, front albopictus) reste au département, qui
// est la bonne granularité pour ces signaux-là.
// ════════════════════════════════════════════════════════════════════════════

export function deriveCategoriesFromEntry(c: IndexCommune): string[] {
  const cats = new Set<string>(['all']); // les 5 questions génériques restent dispo

  // Régional (département = bonne maille) : climat méditerranéen, moustique tigre.
  for (const cat of deptRegionalCategories(c.insee)) cats.add(cat);

  const dept = deptFromInsee(c.insee);
  const lat = c.lat;
  const sud = lat != null && lat < 45.3; // axe canicule : framing « sud » vs « nord »

  // ── Côte : distance réelle, plus le préfixe département ─────────────────────
  if (c.distance_cote_km != null && c.distance_cote_km <= 5) {
    cats.add('littoral');
    if (DEPT_MEDITERRANEE.has(dept)) cats.add('littoral_mediterranee');
    else if (DEPT_LITTORAL_ATLANTIQUE.has(dept)) cats.add('littoral_atlantique');
  }

  // ── Montagne : altitude propre OU proximité au relief ──────────────────────
  if ((c.altitude != null && c.altitude >= 800) ||
      (c.relief_proximite != null && c.relief_proximite >= 70)) {
    cats.add('montagne');
  }

  // ── Densité : urbain dense (sud/nord) vs rural/périurbain ───────────────────
  // densite null = arrondissement (Paris/Lyon) présent dans l'index → cœur urbain.
  const dense = c.densite == null || c.densite >= 1500;
  if (dense) {
    cats.add(sud ? 'urbain_dense_sud' : 'urbain_dense_nord');
  } else {
    cats.add('rural_peri_urbain');
    // Dépendance à la voiture : percentile haut = peu d'alternatives.
    if (c.mobilite && c.mobilite.dependance >= 60) cats.add('periurbain_dependance_auto');
  }

  // ── Caractère rural : agricole / forestier (couvert OSO, pas pression_agricole,
  //    qui ne traque pas la ruralité). Réservé aux communes peu denses.
  if (!dense && c.nature?.composition) {
    const comp = c.nature.composition;
    if ((comp.agricole ?? 0) >= 30) cats.add('rural_agricole');
    if ((comp.foret ?? 0) >= 35) cats.add('rural_forestier');
  }

  // ── Exposition industrielle marquée → vallée industrielle ───────────────────
  // score bas = exposé ; on exige une source réellement préoccupante.
  if (c.expoIndustrielle &&
      c.expoIndustrielle.score <= 30 &&
      (c.expoIndustrielle.sourceDominante === 'seveso_haut' ||
       c.expoIndustrielle.sourceDominante === 'seveso_bas' ||
       c.expoIndustrielle.sourceDominante === 'ied')) {
    cats.add('vallee_industrielle');
  }

  // ── Catégories des nouvelles questions en tension (validées Editorial + porteur).
  //    Chacune ne se déclenche que là où la tension EST en jeu (l'angle, pas le chiffre).
  // Calme : exposition au bruit d'infra notable (score bas = exposé).
  if (c.calmeSonore && c.calmeSonore.score <= 40) cats.add('expose_bruit');
  // Vivre sans voiture : réseau de transports en commun crédible à pied.
  if (c.reseauLocal && (c.reseauLocal.tram || c.reseauLocal.metro || c.reseauLocal.acces >= 60)) {
    cats.add('reseau_tc');
  }
  // Commune qui change : forte croissance démographique récente.
  if (c.demographie && c.demographie.croissance >= 80) cats.add('croissance_forte');
  // Vie locale en jeu : tissu social faible, hors cœur urbain (où la question ne se pose pas).
  if (!dense && c.vieLocale && c.vieLocale.score <= 30) cats.add('faible_vie_locale');

  return Array.from(cats);
}

// ════════════════════════════════════════════════════════════════════════════
// SIGNAUX TERRITOIRE pour /qna — traduit l'index A en faits QUALITATIFS honnêtes
//
// Sert à répondre aux questions en tension qui ne sont ni climat ni risque (calme,
// transports, croissance, vie locale…) SANS que Claude invente : on lui donne le
// signal mesuré, en niveau et en fait nommable, JAMAIS le percentile brut (doctrine
// « on ne raconte que ce qu'on mesure », et le signal reste gaté). null/absent =
// on ne dit rien plutôt qu'inventer.
// ════════════════════════════════════════════════════════════════════════════

const SOURCE_BRUIT_FR: Record<string, string> = {
  auto: "un grand axe routier",
  rail: "une voie ferrée",
  aero: "un aéroport",
};
const SOURCE_INDUS_FR: Record<string, string> = {
  seveso_haut: "un site industriel Seveso seuil haut",
  seveso_bas: "un site industriel Seveso seuil bas",
  ied: "une grande installation industrielle classée",
  industrie: "un site industriel",
};

export function buildTerritorySignals(c: IndexCommune): Record<string, unknown> {
  const s: Record<string, unknown> = {};

  if (c.calmeSonore) {
    const sc = c.calmeSonore.score;
    s.calme = {
      niveau: sc >= 70 ? "plutôt calme" : sc >= 40 ? "exposition sonore modérée" : "exposé au bruit d'infrastructures",
      source_proche: c.calmeSonore.sourceDominante ? SOURCE_BRUIT_FR[c.calmeSonore.sourceDominante] ?? null : null,
    };
  }

  if (c.reseauLocal) {
    const a = c.reseauLocal.acces;
    s.transports_commun = {
      desservie: true,
      tramway: c.reseauLocal.tram,
      metro: c.reseauLocal.metro,
      niveau: a >= 70 ? "réseau dense à portée de marche" : a >= 40 ? "réseau correct à portée de marche" : "réseau limité",
    };
  } else {
    s.transports_commun = { desservie: false };
  }

  if (c.vieLocale) {
    const sc = c.vieLocale.score;
    s.vie_locale = { niveau: sc >= 70 ? "animée" : sc >= 40 ? "moyenne" : "réduite" };
  }

  if (c.demographie) {
    const t = c.demographie.taux_total;
    s.demographie = {
      tendance: t == null ? null : t > 0.05 ? "forte croissance récente" : t > 0.01 ? "croissance" : t < -0.01 ? "déclin" : "stable",
      recit_nouveaux_arrivants: c.demographie.recit ?? null,
    };
  }

  if (c.expoIndustrielle && c.expoIndustrielle.score <= 40) {
    s.exposition_industrielle = {
      niveau: c.expoIndustrielle.score <= 25 ? "notable" : "modérée",
      source_proche: c.expoIndustrielle.sourceDominante ? SOURCE_INDUS_FR[c.expoIndustrielle.sourceDominante] ?? null : null,
    };
  }

  if (c.nature) {
    const sc = c.nature.score;
    s.nature = { niveau: sc >= 70 ? "fort caractère naturel" : sc >= 40 ? "nature présente" : "territoire peu naturel" };
  }

  if (c.rayonnement_pct != null) {
    s.ensoleillement = {
      niveau: c.rayonnement_pct >= 66 ? "très ensoleillé" : c.rayonnement_pct >= 33 ? "moyennement ensoleillé" : "peu ensoleillé",
    };
  }

  if (c.transport && c.transport.gare_nom) {
    s.train = { gare: c.transport.gare_nom, desserte: c.transport.desserte >= 60 ? "bien reliée" : "desserte limitée" };
  }

  return s;
}

// ── Bassins d'emploi (ZE2020) : nom + effectif salarié ────────────────────────
// Pour NOMMER le bassin dans la signature (« bassin de Brest ») et GRADUER la
// raison emploi (« vaste » seulement si la ZE est réellement grande). Chargé une
// fois, comme l'index. Source : data/ze-emploi-na38.json (Flores A38).
type ZeInfo = { nom: string; total: number };
let zeTableCache: Map<string, ZeInfo> | null = null;
async function loadZeTable(): Promise<Map<string, ZeInfo>> {
  if (zeTableCache) return zeTableCache;
  const map = new Map<string, ZeInfo>();
  try {
    const filePath = path.join(process.cwd(), "data", "ze-emploi-na38.json");
    const raw = JSON.parse(await fs.readFile(filePath, "utf8")) as {
      data: Record<string, { nom: string; total: number }>;
    };
    for (const [code, v] of Object.entries(raw.data)) {
      if (v?.nom != null) map.set(code, { nom: v.nom, total: v.total });
    }
  } catch {
    // Table absente : signature sans nom de bassin, raison emploi non graduée.
  }
  zeTableCache = map;
  return zeTableCache;
}
function zeInfo(c: IndexCommune): ZeInfo | null {
  return c.emploi ? zeTableCache?.get(c.emploi.ze) ?? null : null;
}

// ── Signature territoriale ────────────────────────────────────────────────────
// Couche d'IMAGE du territoire, distincte des reasons (qui justifient le score).
// Ordre fixe géographie → bassin → climat/relief, max 3. Libellés incarnés mais
// 100 % adossés à des tables déterministes (mêmes tables que les filtres d'ancres).

// Région littorale → nom de côte incarné. Ne s'applique QUE si la commune est
// proche du trait de côte (gate distance). Fallback « Bord de mer » sinon.
const COAST_BY_REGION: Record<string, string> = {
  Bretagne: "Côte bretonne",
  Normandie: "Côte normande",
  "Hauts-de-France": "Côte d'Opale",
  "Pays de la Loire": "Côte atlantique",
  "Nouvelle-Aquitaine": "Côte atlantique",
  Occitanie: "Côte méditerranéenne",
  "Provence-Alpes-Côte d'Azur": "Côte méditerranéenne",
  Corse: "Littoral corse",
};
// Régions à littoral méditerranéen : le climat côtier y est « méditerranéen »
// (plus évocateur que « maritime »), ailleurs « maritime » (Atlantique/Manche).
const MED_REGIONS = new Set([
  "Occitanie",
  "Provence-Alpes-Côte d'Azur",
  "Corse",
]);
// Massif → libellé incarné. Le département appartient au token massif de
// ZONE_TABLE (la table même qui filtre « près des Alpes »).
const MASSIF_LABEL: Record<string, string> = {
  alpes: "Aux portes des Alpes",
  pyrenees: "Au pied des Pyrénées",
  massif_central: "Dans le Massif central",
  vosges: "Au pied des Vosges",
  jura: "Dans le Jura",
};
// dept → token massif (inverse de ZONE_TABLE), construit une fois.
const DEPT_TO_MASSIF: Record<string, string> = (() => {
  const out: Record<string, string> = {};
  for (const token of Object.keys(MASSIF_LABEL)) {
    for (const dept of ZONE_TABLE[token]?.departements ?? []) {
      if (!(dept in out)) out[dept] = token;
    }
  }
  return out;
})();

// « Bassin de X » avec élision/contraction correcte (de + Le = du, de + Les = des,
// de + voyelle = d'). Les noms de ZE peuvent commencer par un article (« Le Mont
// Blanc ») ou une voyelle (« Annecy »).
function bassinLabel(nom: string): string {
  if (/^Les /.test(nom)) return `Bassin des ${nom.slice(4)}`;
  if (/^Le /.test(nom)) return `Bassin du ${nom.slice(3)}`;
  if (/^La /.test(nom)) return `Bassin de la ${nom.slice(3)}`;
  if (/^[AEIOUYÉÈÊÀHaeiouyéèêàh]/.test(nom)) return `Bassin d'${nom}`;
  return `Bassin de ${nom}`;
}

function buildSignature(c: IndexCommune): string[] {
  const sig: string[] = [];
  const coastal = c.distance_cote_km != null && c.distance_cote_km <= 15;
  const massifToken = DEPT_TO_MASSIF[c.dept];
  const alt = c.altitude ?? 0;

  // 1. Géographie : côte si littorale, sinon massif (gate altitude ≥ 200 m pour
  //    ne pas écrire « aux portes des Alpes » à une commune de plaine).
  if (coastal) {
    sig.push((c.region && COAST_BY_REGION[c.region]) || "Bord de mer");
  } else if (massifToken && alt >= 200) {
    sig.push(MASSIF_LABEL[massifToken]);
  } else {
    // 1b. Ville (repli géographique) : sans côte ni massif, la TAILLE de la ville est
    //     son image, c'est ainsi qu'un humain la décrit. Langage naturel, jamais le
    //     jargon « pôle urbain ». Ne se déclenche que sur le créneau géo vide (Nice
    //     garde « Côte méditerranéenne », Grenoble « Aux portes des Alpes »). Sous
    //     10 000 hab : pas de label, signature courte assumée.
    const pop = c.population ?? 0;
    if (pop >= 100_000) sig.push("Grande ville");
    else if (pop >= 30_000) sig.push("Ville moyenne");
    else if (pop >= 10_000) sig.push("Petite ville");
  }

  // 2. Bassin d'emploi nommé, SEULEMENT s'il apporte un contexte au-delà de la
  //    commune. « Bassin de Limoges » sur la commune Limoges ne raconte rien de
  //    plus que le nom déjà affiché ; on l'omet. « Bassin de Grenoble » sur Crolles
  //    situe le territoire : on le garde. Règle : le nom du bassin doit différer de
  //    celui de la commune (comparaison normalisée).
  const nom = zeInfo(c)?.nom;
  if (nom && normalizeName(nom) !== normalizeName(c.nom)) sig.push(bassinLabel(nom));

  // 3. Climat / relief, seulement si DISTINCTIF ET IDENTITAIRE, et s'il reste une
  //    place. Règle : un élément de signature doit être une chose par laquelle un
  //    humain décrit spontanément le territoire, pas une donnée vraie mais inerte.
  //    L'altitude n'est identitaire qu'en haute altitude (la montagne EST le lieu :
  //    Aurillac, Le Puy). La bande 200–600 m (« altitude modérée ») est du
  //    remplissage : elle ne sortait que quand le label massif portait déjà le
  //    relief (Grenoble, Clermont). On la supprime, on ne remplit jamais pour
  //    remplir, une signature courte est assumée.
  if (sig.length < 3) {
    const djf = c.clim?.NORTMm_seas_DJF ?? null;
    // Sur la côte méditerranéenne, « Climat méditerranéen » répète le mot déjà posé
    // par « Côte méditerranéenne » : il n'ajoute aucune facette. On laisse alors
    // parler le climat VÉCU distinctif, la douceur des hivers (« Hivers doux »), via
    // la cascade ci-dessous. L'Atlantique/Manche n'a pas ce doublon : « Climat
    // maritime » est une facette neuve à côté de « Côte bretonne/normande ».
    const med = coastal && c.region != null && MED_REGIONS.has(c.region);
    if (coastal && !med) sig.push("Climat maritime");
    else if (massifToken && alt >= 600) sig.push("En altitude");
    else if (djf != null && djf <= 3) sig.push("Hivers marqués");
    else if (djf != null && djf >= 8) sig.push("Hivers doux");
  }
  return sig.slice(0, 3);
}

// ── Identité « promesse de vie » (narratif, hors score) ──────────────────────
// Déterministe : archétype (taille × contexte × dominante) → promesse « Pour… ».
// Raconte la décision, pas la fiche. 100 % adossé aux signaux mesurés.
function tailleLabel(pop: number | null): "village" | "petite" | "moyenne" | "grande" | "metropole" {
  if (pop == null) return "petite";
  if (pop < 2000) return "village";
  if (pop < 25000) return "petite";
  if (pop < 100000) return "moyenne";
  if (pop < 500000) return "grande";
  return "metropole";
}

// Candidats d'identité, ordonnés du plus distinctif au plus générique. On en
// renvoie PLUSIEURS pour que la passe de groupe (assignIdentite) puisse départager
// deux communes au profil proche (deux côtières, deux montagnes) sans répéter la
// même promesse dans un trio. Le dernier candidat (neutre) est toujours présent.
function buildIdentiteCandidates(c: IndexCommune): string[] {
  const uuPop = tailleVille(c);
  const taille = tailleLabel(uuPop);
  const coastal = c.distance_cote_km != null && c.distance_cote_km <= 15;
  const altitude = c.altitude ?? 0;
  const relief = c.relief_proximite ?? 0;
  // Montagne : altitude propre élevée, ou massif vraiment à portée et déjà en hauteur.
  const montagne = altitude >= 600 || (relief >= 60 && altitude >= 350);
  const periurbain =
    c.population != null && uuPop != null && uuPop >= 100000 && c.population < 25000;
  // « Grande ville » : la COMMUNE elle-même est grande (pas l'UU), sinon un village
  // dans une grande agglo serait mal étiqueté (Espelette).
  const grandeVille = c.population != null && c.population >= 50000;
  const med = c.region != null && MED_REGIONS.has(c.region);
  // Macro-Sud pour incarner « le Sud / le Sud-Ouest » dans la promesse.
  const sudOuest = c.region === "Nouvelle-Aquitaine";
  const sud = c.region === "Occitanie" || c.region === "Provence-Alpes-Côte d'Azur";
  const frais = (subScore("faible_chaleur", c) ?? 0) >= 60;
  const doux = (subScore("douceur_climat", c) ?? 0) >= 65;
  const vieLocaleForte = (subScore("vie_locale", c) ?? 0) >= 60;
  const natureForte = (subScore("nature", c) ?? 0) >= 60;
  const calmeForte = Math.max(subScore("cadre_calme", c) ?? 0, subScore("calme_sonore", c) ?? 0) >= 62;
  const etudianteForte = (subScore("vie_etudiante", c) ?? 0) >= 55;
  const croissanceForte = (subScore("croissance_demographique", c) ?? 0) >= 62;
  const petit = taille === "village" || taille === "petite";

  const out: string[] = [];
  const push = (s: string) => { if (!out.includes(s)) out.push(s); };

  // Axe géographique majeur (le plus identitaire) en premier.
  if (montagne && vieLocaleForte) push("Pour vivre en montagne dans une commune qui reste animée.");
  if (montagne && frais) push("Pour vivre en montagne, dans un climat plus supportable l'été.");
  if (montagne) push("Pour vivre en montagne, au grand air.");
  if (coastal && med) push("Pour un quotidien méditerranéen, les pieds près de l'eau.");
  if (coastal && grandeVille) push("Pour la vie au bord de l'eau avec les services d'une vraie ville.");
  if (coastal) push("Pour un quotidien tourné vers la mer, à un rythme plus posé.");
  if (periurbain) push("Pour vivre aux portes d'une grande ville, sans en habiter le centre.");
  // Climat.
  if (frais && sudOuest) push("Pour rester dans le Sud-Ouest sans subir les plus fortes chaleurs.");
  if (frais && sud) push("Pour rester dans le Sud sans subir les plus fortes chaleurs.");
  if (frais) push("Pour chercher davantage de fraîcheur et un rythme plus posé.");
  if (doux) push("Pour un climat doux une bonne partie de l'année.");
  // Traits de caractère (départagent deux communes de même géographie).
  if (etudianteForte) push("Pour une ville étudiante à taille humaine.");
  if (croissanceForte) push("Pour s'installer dans un territoire qui attire.");
  if (vieLocaleForte && (taille === "petite" || taille === "moyenne")) push("Pour une petite ville qui reste vraiment vivante.");
  if ((natureForte || calmeForte) && petit) push("Pour un cadre rural préservé, loin de l'agitation.");
  if (calmeForte) push("Pour un quotidien au calme, loin de l'agitation.");
  if (natureForte) push("Pour vivre au plus près de la nature.");
  if (grandeVille) push("Pour la vie d'une grande ville et tous ses services.");
  if (petit) push("Pour la tranquillité d'une commune à taille humaine.");
  // Repli neutre, toujours disponible en dernier recours.
  push("Pour un cadre de vie équilibré, sans excès.");
  return out;
}

// Identité unique DANS le groupe affiché : chaque commune prend, dans l'ordre
// d'affichage, son meilleur candidat non encore pris par une autre du trio. Les
// raisons et compromis peuvent se répéter (logique), pas l'identité (choix porteur).
function assignIdentite(shownPicks: MatchResult[], byInsee: Map<string, IndexCommune>): void {
  const used = new Set<string>();
  for (const r of shownPicks) {
    const c = byInsee.get(r.insee);
    const cands = c ? buildIdentiteCandidates(c) : ["Pour un cadre de vie équilibré, sans excès."];
    const chosen = cands.find((x) => !used.has(x)) ?? cands[cands.length - 1];
    used.add(chosen);
    r.identite = chosen;
  }
}

// ── Découverte : 2e force POSITIVE sur une dimension non demandée ─────────────
// Effet « conseiller » : surfacer un atout réel auquel l'utilisateur n'a pas pensé.
// Top subScore parmi un ensemble curé NON demandé, seuil de saillance (>=66), phrasé
// via reasonText (donc toujours positif). null si rien ne se détache. Hors score/tri.
// On écarte acces_services/acces_soins : trop génériques (presque partout hauts),
// ils écrasent la découverte et ne « surprennent » pas. On garde les dimensions
// distinctives et évocatrices.
const DECOUVERTE_KEYS: PreferenceKey[] = [
  "proximite_mer", "nature", "vie_locale", "vie_etudiante", "acces_transports",
  "mobilite_quotidienne", "calme_sonore", "faible_chaleur", "douceur_climat",
  "croissance_demographique", "air_sain",
];
function assignDecouverte(
  shownPicks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
  requestedKeys: Set<PreferenceKey>,
): void {
  for (const r of shownPicks) {
    const c = byInsee.get(r.insee);
    if (!c) { r.decouverte = null; continue; }
    let bestKey: PreferenceKey | null = null;
    let bestScore = 65; // seuil de saillance (band haute)
    for (const k of DECOUVERTE_KEYS) {
      if (requestedKeys.has(k)) continue; // non demandée seulement
      const s = subScore(k, c);
      if (s != null && s > bestScore) { bestScore = s; bestKey = k; }
    }
    r.decouverte = bestKey ? reasonText(bestKey, c) : null;
  }
}

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function nameIndex(): Promise<Map<string, IndexCommune>> {
  if (nameCache) return nameCache;
  const communes = await loadIndex();
  const m = new Map<string, IndexCommune>();
  for (const c of communes) {
    const key = normalizeName(c.nom);
    const prev = m.get(key);
    // en cas d'homonymes, garder la plus peuplée (la plus probable)
    if (!prev || (c.population ?? 0) > (prev.population ?? 0)) m.set(key, c);
  }
  nameCache = m;
  return nameCache;
}

// ── Géo ───────────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// Rollup Paris / Lyon / Marseille : l'index contient les arrondissements (DRIAS
// indexe par arrondissement). On regroupe sous la ville mère pour ne montrer
// qu'une entrée par grande ville.
function cityKey(insee: string): string {
  if (/^751\d\d$/.test(insee)) return "PARIS";
  if (/^6938\d$/.test(insee)) return "LYON";
  if (/^132\d\d$/.test(insee)) return "MARSEILLE";
  return insee;
}
const CITY_LABEL: Record<string, string> = { PARIS: "Paris", LYON: "Lyon", MARSEILLE: "Marseille" };

// ── Scoring ────────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

// Énumération française : ["a"] → "a" ; ["a","b"] → "a et b" ; ["a","b","c"] → "a, b et c".
function listFr(items: string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  return `${items.slice(0, -1).join(", ")} et ${items[items.length - 1]}`;
}

// Gradient de force d'ancre : bonus additif de score pour les ancres souples
// (cf. ANCRES_GEOGRAPHIQUES.md). hard ne bonifie pas (il filtre). Constantes à
// caler en réel : preferred domine d'ordinaire le haut du classement sans agir
// comme un filtre, inspiration oriente à peine.
const STRENGTH_BONUS: Record<ZoneStrength, number> = { hard: 0, preferred: 12, inspiration: 4 };
// Plafond du bonus souple combiné entre axes orthogonaux (zone + montagne). Permet
// à l'intersection (« le Sud-Ouest ET en altitude ») de primer sur chaque axe seul
// (12) sans agir comme un filtre dur. Au sein d'un même axe, c'est un max, pas une somme.
const SOFT_BONUS_CAP = 18;
function softZoneBonus(dept: string, soft: SoftZone[]): number {
  let b = 0; // sémantique OU : max du bonus auquel la commune a droit, pas de cumul
  for (const s of soft) if (s.departements.has(dept)) b = Math.max(b, STRENGTH_BONUS[s.strength]);
  return b;
}
// Bonus montagne souple : proportionnel à la montagnosité (une commune haute est
// tirée plus fort qu'une moyenne montagne). hard ne bonifie pas (il filtre).
function montagneBonus(alt: number | null | undefined, strength: ZoneStrength | undefined): number {
  if (!strength || strength === "hard") return 0;
  const m = montagnosite(alt);
  return m == null ? 0 : (m / 100) * STRENGTH_BONUS[strength];
}
// Bonus « proche d'une montagne » : proportionnel à relief_proximite (massif à
// portée). hard ne bonifie pas (il filtre). Une commune au pied des Alpes est
// tirée fort même à basse altitude (là où montagneBonus la rate).
function reliefBonus(relief: number | null | undefined, strength: ZoneStrength | undefined): number {
  if (!strength || strength === "hard") return 0;
  return relief == null ? 0 : (relief / 100) * STRENGTH_BONUS[strength];
}
const RELIEF_PROCHE_HARD = 50; // seuil filtre « il me faut la montagne proche » (Pau 69, Nice 62 passent ; plaine non)

function avgPct(c: IndexCommune, fields: string[]): number | null {
  const vals = fields.map((f) => c.pct[f]).filter((v): v is number => v != null);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}

function subScore(key: PreferenceKey, c: IndexCommune): number | null {
  switch (key) {
    case "faible_chaleur": {
      const p = avgPct(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr", "NORTMm_seas_JJA"]);
      return p == null ? null : 100 - p;
    }
    case "faible_secheresse": {
      const p = c.pct.NORSWI04_yr; return p == null ? null : 100 - p;
    }
    case "faible_risque_feu": {
      const p = c.pct.NORIFM40_yr; return p == null ? null : 100 - p;
    }
    case "faible_precip_extremes": {
      const p = avgPct(c, ["NORRRq99_yr", "NORRx1d_yr"]); return p == null ? null : 100 - p;
    }
    case "proximite_mer":
      return clamp(100 - c.distance_cote_km / 1.5, 0, 100);
    case "cadre_calme":
      return lerp(CALME, c.densite);
    case "eviter_isolement":
      return lerp(ISOLEMENT, tailleVille(c)); // taille d'agglomération, pas la commune seule
    case "douceur_climat": {
      const w = lerp(WINTER_MILD, c.clim.NORTMm_seas_DJF);
      if (w == null) return null;
      const s = c.pct.NORTX35D_yr == null ? 50 : 100 - c.pct.NORTX35D_yr;
      return Math.round(0.6 * w + 0.4 * s);
    }
    case "ensoleillement_recherche":
      // Rayonnement solaire réel (ERA5), percentile national. Remplace l'ancien
      // proxy FAUX (été chaud + peu de pluie, qui ne mesurait pas le soleil).
      // Récit qualitatif (très/moyennement/peu ensoleillé), jamais d'heures.
      return c.rayonnement_pct ?? null;
    case "air_sain": {
      const pm = c.vivpct?.pm25;
      if (pm == null) return null;
      const no2 = c.vivpct?.no2 == null ? pm : c.vivpct.no2; // PM2.5 ≫ NO2 (NO2 = trafic très local)
      return Math.round(0.7 * (100 - pm) + 0.3 * (100 - no2));
    }
    case "acces_soins":
      return c.vivpct?.apl == null ? null : c.vivpct.apl; // APL haut = bon accès
    case "acces_services":
      return c.vivpct?.eloignement == null ? null : 100 - c.vivpct.eloignement; // éloignement bas = mieux
    case "faible_pression_agricole":
      return c.pression_agricole == null ? null : 100 - c.pression_agricole;
    case "viabilite_emploi":
      // taille (courbe saturante) + diversité (entropie A38), maille ZE héritée.
      return c.emploi == null ? null : Math.round(0.6 * c.emploi.taille + 0.4 * c.emploi.diversite);
    case "nature":
      // percentile national du couvert naturel élargi dans 15 km (cf. populate-nature.py).
      return c.nature?.score ?? null;
    case "acces_ecoles":
      return c.ecoles?.score ?? null; // percentile accès collèges+lycées, pondéré proximité, rayon adapté
    case "acces_culture":
      return c.culture?.score ?? null; // percentile accès offre culturelle, pondéré proximité, rayon adapté
    case "faible_risque_inondation":
      // risque faible -> score haut. Historique CatNat inondation, pas une garantie d'absence de crue.
      return c.inondation == null ? null : 100 - c.inondation.risque;
    case "faible_dependance_auto":
      // part voiture domicile-travail faible -> score haut. Usage contraint (MOBPRO), pas la possession.
      return c.mobilite == null ? null : 100 - c.mobilite.dependance;
    case "acces_transports":
      // desserte ferroviaire accessible (gares SNCF pondérées par fréquentation).
      return c.transport?.desserte ?? null;
    case "mobilite_quotidienne":
      // réseau TC du quotidien à portée de marche ; pas de réseau crédible = 0 (l'utilisateur l'a demandé).
      return c.reseauLocal?.acces ?? 0;
    case "eviter_grandes_villes":
      return lerp(GRANDE_VILLE_MIN, tailleVille(c));
    case "prefere_grande_ville":
      return lerp(GRANDE_VILLE_MAX, tailleVille(c));
    case "vie_etudiante": {
      // 40 % accès (présence établissements sup, BPE) + 60 % dynamisme (part étudiante UU, MESR).
      const a = c.etudes_acces ?? null;
      const d = c.etudes_dyn ?? null;
      if (a == null && d == null) return null;
      if (a == null) return d;
      if (d == null) return a;
      return Math.round(0.4 * a + 0.6 * d);
    }
    case "vie_locale":
      // intensité de vie sociale (lieux + assos par habitant) ; pas de vie locale mesurable = 0.
      return c.vieLocale?.score ?? 0;
    case "croissance_demographique":
      // trajectoire démographique ; null (donnée absente) -> non noté (opt-in, pas de pénalité).
      return c.demographie?.croissance ?? null;
    case "calme_sonore":
      // exposition cumulée aux infra bruyantes ; loin de tout = 100 (jamais « non noté »).
      // Champ absent (commune sans calcul) -> traité comme calme (100), pas comme pénalité.
      return c.calmeSonore?.score ?? 100;
    case "faible_exposition_industrielle":
      // éloignement aux sites industriels à risque ; loin de tout = 100 (jamais « non noté »).
      return c.expoIndustrielle?.score ?? 100;
    default:
      return null;
  }
}

// ── Signaux ambiants (narratif, hors score) ──────────────────────────────────
// Petit jeu de dimensions que la recherche n'a pas forcément classées, pour qu'AskFuture
// réponde aux « et côté X ? » de façon qualitative et comparative. Réutilise subScore
// (favorabilité 0-100, direction gérée par dimension). Bandes = terciles nationaux ;
// phrases DESCRIPTIVES (décrire, pas juger). cf. spec 2026-06-03-signaux-ambiants-askfuture.
type AmbientDim = { id: string; key: PreferenceKey; bands: [string, string, string] };
// bands = [ >=66 favorable, 34-65 intermédiaire, <34 notable ]. Ordre = priorité de départage.
const AMBIENT_DIMENSIONS: AmbientDim[] = [
  { id: "inondation", key: "faible_risque_inondation", bands: ["historique d'inondation plus faible", "historique d'inondation intermédiaire", "historique d'inondation plus marqué"] },
  { id: "chaleur", key: "faible_chaleur", bands: ["étés généralement plus supportables", "étés intermédiaires", "étés généralement plus chauds"] },
  { id: "secheresse", key: "faible_secheresse", bands: ["sols moins exposés à la sécheresse", "exposition intermédiaire à la sécheresse", "sols plus exposés à la sécheresse"] },
  { id: "feu", key: "faible_risque_feu", bands: ["risque de feu plus faible", "risque de feu intermédiaire", "risque de feu plus marqué"] },
  { id: "nature", key: "nature", bands: ["davantage de nature autour", "présence de nature intermédiaire", "moins de nature autour"] },
  { id: "soins", key: "acces_soins", bands: ["accès aux soins plus facile", "accès aux soins intermédiaire", "accès aux soins plus limité"] },
  { id: "emploi", key: "viabilite_emploi", bands: ["bassin d'emploi plus dynamique", "bassin d'emploi intermédiaire", "bassin d'emploi moins dynamique"] },
  { id: "ecoles", key: "acces_ecoles", bands: ["accès aux écoles plus facile", "accès aux écoles intermédiaire", "accès aux écoles plus limité"] },
  { id: "culture", key: "acces_culture", bands: ["offre culturelle plus présente", "offre culturelle intermédiaire", "offre culturelle plus limitée"] },
  { id: "air", key: "air_sain", bands: ["air généralement plus sain", "qualité de l'air intermédiaire", "air généralement moins sain"] },
  { id: "transports", key: "acces_transports", bands: ["bien reliée par le train", "desserte ferroviaire intermédiaire", "peu reliée par le train"] },
  { id: "mobilite_quotidienne", key: "mobilite_quotidienne", bands: ["transports du quotidien bien présents", "desserte du quotidien intermédiaire", "peu de transports du quotidien à pied"] },
  { id: "vie_etudiante", key: "vie_etudiante", bands: ["forte présence étudiante", "présence étudiante intermédiaire", "présence étudiante limitée"] },
  { id: "vie_locale", key: "vie_locale", bands: ["vie locale animée", "vie locale intermédiaire", "vie locale plus discrète"] },
  { id: "croissance_demographique", key: "croissance_demographique", bands: ["gagne des habitants", "population stable", "perd des habitants"] },
  { id: "calme_sonore", key: "calme_sonore", bands: ["à l'écart des grandes infrastructures bruyantes", "exposition sonore intermédiaire", "environnement maillé d'infrastructures bruyantes"] },
  { id: "expo_industrielle", key: "faible_exposition_industrielle", bands: ["à l'écart des sites industriels à risque", "présence industrielle intermédiaire", "environnement industriel marqué"] },
];

// ── Dimensions de la comparaison complète ────────────────────────────────────
// 27 dimensions (la taille de ville fusionne eviter/prefere_grande_ville). Chaque
// dimension porte 3 paliers ABSOLUS [favorable (>=66), intermédiaire, notable (<34)],
// alignés sur les seuils de bandIndex. Mot autoportant, jamais un score. Les paliers
// sont un PREMIER JET éditorial, à calibrer avec le porteur (test du maire, cf. spec §6).
type ComparaisonDim = {
  id: string;
  label: string;
  themeId: string;
  key: PreferenceKey | "taille_ville"; // "taille_ville" = palier factuel via tailleVille
  paliers: [string, string, string]; // [hi, mid, lo]
  gp: string; // groupe nominal neutre avec article (« le calme sonore »)
  forte: string; // groupe nominal VALENCÉ pour la synthèse (« son faible risque d'inondation »)
  aide: string; // glose tooltip (≤2 phrases, « pourquoi ça aide à comprendre », sans méthodo)
  risque: boolean; // true = critère de risque/nuisance : le pire tier s'affiche en rouge si contraste
  directionnel: boolean; // false = préférence non universelle (ensoleillement, taille) : pas de gagnant
};

// gp = libellé du thème pour le résumé, avec une glose entre parenthèses (on explicite ce
// que chaque thème recouvre, « risques naturels = inondation, feu… »).
// gp = groupe nominal long (synthèses « En résumé »). court = forme brève pour la phrase
// d'arbitrage (« Si la mobilité compte d'abord… »), sans parenthèses ni énumération.
export const THEME_ORDER: { id: string; titre: string; gp: string; court: string }[] = [
  { id: "climat", titre: "Climat", gp: "le climat (chaleur, douceur, soleil)", court: "le climat" },
  { id: "risques", titre: "Risques naturels", gp: "les risques naturels (inondation, feu, sécheresse)", court: "les risques naturels" },
  { id: "sante_env", titre: "Santé environnementale", gp: "la santé environnementale (air, bruit, industrie)", court: "la santé environnementale" },
  { id: "cadre", titre: "Nature & cadre", gp: "la nature et le cadre de vie (espaces naturels, mer)", court: "le cadre de vie" },
  { id: "mobilite", titre: "Mobilité", gp: "la mobilité (voiture, train, transports)", court: "la mobilité" },
  { id: "services", titre: "Services & proximité", gp: "les services (soins, écoles, commerces)", court: "les services" },
  { id: "vitalite", titre: "Vie locale & trajectoires", gp: "la vie locale et les trajectoires (emploi, démographie)", court: "la vie locale" },
];

// Paliers [favorable (>=66), intermédiaire, notable (<34)]. Libellés clairs et concrets
// (compréhensibles sans jargon). forte = groupe valencé pour la synthèse. risque = critère
// dont le pire tier s'affiche en rouge si une autre commune fait mieux. directionnel=false
// = préférence non universelle (pas de gagnant). Premier jet, à calibrer.
const DIMENSIONS: ComparaisonDim[] = [
  { id: "etes_frais", label: "Étés frais", themeId: "climat", key: "faible_chaleur", paliers: ["Étés frais", "Étés tempérés", "Étés chauds"], gp: "les étés frais", forte: "ses étés frais", aide: "À quel point les étés restent supportables côté chaleur.", risque: false, directionnel: true },
  { id: "douceur", label: "Douceur du climat", themeId: "climat", key: "douceur_climat", paliers: ["Climat doux", "Climat contrasté", "Hivers rigoureux"], gp: "la douceur du climat", forte: "la douceur de son climat", aide: "Des hivers tempérés et des étés sans excès.", risque: false, directionnel: true },
  { id: "ensoleillement", label: "Ensoleillement", themeId: "climat", key: "ensoleillement_recherche", paliers: ["Très ensoleillé", "Moyennement ensoleillé", "Peu ensoleillé"], gp: "l'ensoleillement", forte: "son ensoleillement", aide: "Le rayonnement solaire reçu au sol (ERA5), exprimé sans nombre d'heures. Affiché sans gagnant : c'est une préférence, pas un avantage universel.", risque: false, directionnel: false },
  { id: "inondation", label: "Inondation", themeId: "risques", key: "faible_risque_inondation", paliers: ["Risque d'inondation faible", "Risque modéré", "Risque élevé"], gp: "le risque d'inondation", forte: "son faible risque d'inondation", aide: "Ce que dit l'historique d'inondations du territoire.", risque: true, directionnel: true },
  { id: "feu", label: "Feu", themeId: "risques", key: "faible_risque_feu", paliers: ["Risque de feu faible", "Risque modéré", "Risque élevé"], gp: "le risque de feu", forte: "son faible risque de feu", aide: "L'exposition du secteur au risque d'incendie.", risque: true, directionnel: true },
  { id: "pluies", label: "Pluies intenses", themeId: "risques", key: "faible_precip_extremes", paliers: ["Peu de pluies intenses", "Pluies intenses modérées", "Pluies intenses fréquentes"], gp: "les pluies intenses", forte: "ses pluies intenses rares", aide: "La fréquence des épisodes de pluies très intenses.", risque: true, directionnel: true },
  { id: "secheresse", label: "Sécheresse", themeId: "risques", key: "faible_secheresse", paliers: ["Sols peu exposés à la sécheresse", "Exposition modérée", "Sols très exposés"], gp: "la sécheresse", forte: "ses sols peu exposés à la sécheresse", aide: "À quel point les sols sont exposés au manque d'eau.", risque: true, directionnel: true },
  { id: "air", label: "Air", themeId: "sante_env", key: "air_sain", paliers: ["Air pur", "Qualité de l'air moyenne", "Air pollué"], gp: "l'air", forte: "son air pur", aide: "La qualité de l'air respiré au quotidien.", risque: true, directionnel: true },
  { id: "calme_sonore", label: "Calme sonore", themeId: "sante_env", key: "calme_sonore", paliers: ["Très préservé du bruit", "Exposition sonore modérée", "Fortement exposé au bruit"], gp: "le calme sonore", forte: "son calme", aide: "L'éloignement des grandes sources de bruit (axes, rail, aéroports).", risque: true, directionnel: true },
  { id: "industrie", label: "Sites industriels", themeId: "sante_env", key: "faible_exposition_industrielle", paliers: ["Peu exposé aux sites industriels à risque", "Présence industrielle modérée", "Environnement industriel marqué"], gp: "les sites industriels", forte: "son éloignement des sites industriels", aide: "La présence de sites industriels classés à proximité, pas un niveau de pollution.", risque: true, directionnel: true },
  { id: "agriculture", label: "Agriculture intensive", themeId: "sante_env", key: "faible_pression_agricole", paliers: ["Peu d'agriculture intensive", "Agriculture intensive modérée", "Agriculture intensive marquée"], gp: "l'agriculture intensive", forte: "le peu d'agriculture intensive autour", aide: "L'éloignement des cultures à traitements fréquents.", risque: true, directionnel: true },
  { id: "nature", label: "Espaces naturels", themeId: "cadre", key: "nature", paliers: ["Beaucoup de nature autour", "Nature présente", "Peu de nature autour"], gp: "les espaces naturels", forte: "ses espaces naturels", aide: "La présence d'espaces naturels autour du lieu de vie.", risque: false, directionnel: true },
  { id: "mer", label: "Mer", themeId: "cadre", key: "proximite_mer", paliers: ["En bord de mer", "Proche du littoral", "Loin de la mer"], gp: "la proximité de la mer", forte: "sa proximité de la mer", aide: "La proximité de la côte.", risque: false, directionnel: true },
  { id: "cadre_calme", label: "Cadre de vie", themeId: "cadre", key: "cadre_calme", paliers: ["Cadre paisible et habitable", "Cadre intermédiaire", "Très urbain ou très isolé"], gp: "le cadre de vie", forte: "son cadre de vie paisible", aide: "À quel point le cadre est paisible et habitable, ni trop urbain et dense, ni trop isolé.", risque: false, directionnel: true },
  { id: "sans_voiture", label: "Sans voiture", themeId: "mobilite", key: "faible_dependance_auto", paliers: ["Peu dépendant de la voiture", "Dépendance modérée à la voiture", "Voiture indispensable"], gp: "la vie sans voiture", forte: "sa faible dépendance à la voiture", aide: "Part des trajets du quotidien faisables autrement qu'en voiture.", risque: false, directionnel: true },
  { id: "train", label: "Train / gares", themeId: "mobilite", key: "acces_transports", paliers: ["Bien relié par le train", "Gare accessible, desserte limitée", "Peu relié par le train"], gp: "le train", forte: "sa desserte ferroviaire", aide: "La desserte par le train et les gares proches.", risque: false, directionnel: true },
  { id: "tc_quotidien", label: "Transports du quotidien", themeId: "mobilite", key: "mobilite_quotidienne", paliers: ["Réseau de transports présent", "Desserte partielle", "Peu de transports en commun"], gp: "les transports du quotidien", forte: "ses transports du quotidien", aide: "Un réseau de bus, tram ou métro pour se déplacer sans voiture au quotidien.", risque: false, directionnel: true },
  { id: "soins", label: "Soins", themeId: "services", key: "acces_soins", paliers: ["Bon accès aux soins", "Accès intermédiaire", "Accès aux soins limité"], gp: "l'accès aux soins", forte: "son accès aux soins", aide: "La facilité d'accès aux médecins.", risque: false, directionnel: true },
  { id: "services", label: "Services", themeId: "services", key: "acces_services", paliers: ["Services proches", "Accès intermédiaire", "Services éloignés"], gp: "les services", forte: "ses services accessibles", aide: "La proximité des commerces et services du quotidien.", risque: false, directionnel: true },
  { id: "ecoles", label: "Collèges / lycées", themeId: "services", key: "acces_ecoles", paliers: ["Collèges et lycées accessibles", "Accès intermédiaire", "Accès limité"], gp: "l'accès aux collèges et lycées", forte: "son accès aux collèges et lycées", aide: "L'accès aux collèges et lycées alentour.", risque: false, directionnel: true },
  { id: "culture", label: "Culture", themeId: "services", key: "acces_culture", paliers: ["Offre culturelle présente", "Offre intermédiaire", "Offre limitée"], gp: "l'offre culturelle", forte: "son offre culturelle", aide: "La présence d'équipements culturels à proximité.", risque: false, directionnel: true },
  { id: "isolement", label: "Isolement", themeId: "services", key: "eviter_isolement", paliers: ["Bassin de vie étendu", "Bassin de proximité", "Bassin de vie restreint"], gp: "le bassin de vie", forte: "son bassin de vie étendu", aide: "La taille du bassin de vie qui dessert le territoire.", risque: false, directionnel: true },
  { id: "emploi", label: "Emploi", themeId: "vitalite", key: "viabilite_emploi", paliers: ["Bassin d'emploi étendu", "Bassin d'emploi intermédiaire", "Bassin d'emploi resserré"], gp: "le bassin d'emploi", forte: "son bassin d'emploi étendu", aide: "L'étendue et la diversité du bassin d'emploi.", risque: false, directionnel: true },
  { id: "vie_locale", label: "Vie locale", themeId: "vitalite", key: "vie_locale", paliers: ["Vie locale animée", "Vie locale intermédiaire", "Vie locale discrète"], gp: "la vie locale", forte: "sa vie locale animée", aide: "L'intensité de la vie sociale (cafés, marchés, sport, associations).", risque: false, directionnel: true },
  { id: "vie_etudiante", label: "Vie étudiante", themeId: "vitalite", key: "vie_etudiante", paliers: ["Forte présence étudiante", "Présence étudiante intermédiaire", "Présence étudiante limitée"], gp: "la vie étudiante", forte: "sa vie étudiante", aide: "La présence d'étudiants et d'établissements supérieurs.", risque: false, directionnel: true },
  { id: "demographie", label: "Démographie", themeId: "vitalite", key: "croissance_demographique", paliers: ["Gagne des habitants", "Population stable", "Perd des habitants"], gp: "la démographie", forte: "sa croissance démographique", aide: "Si le territoire gagne ou perd des habitants.", risque: false, directionnel: true },
  { id: "taille_ville", label: "Taille de ville", themeId: "vitalite", key: "taille_ville", paliers: ["Grande agglomération", "Ville moyenne", "Petite ville ou rural"], gp: "la taille de ville", forte: "sa taille", aide: "La taille de l'agglomération.", risque: false, directionnel: false },
];

// Palier factuel de taille d'agglomération (dimension non directionnelle).
function tailleVillePalier(c: IndexCommune): string {
  const t = tailleVille(c) ?? 0;
  return t >= 100_000 ? "Grande agglomération"
    : t >= 25_000 ? "Ville moyenne"
    : t >= 5_000 ? "Petite ville"
    : "Plutôt rural";
}

// Suffixe court non chiffré pour les dimensions qui portent une source dominante nommable.
// Réutilise les sources des récits existants (sans chiffre), abrégées en suffixe de palier.
function dimQualifier(dimId: string, c: IndexCommune): string | null {
  if (dimId === "calme_sonore") {
    const src = c.calmeSonore?.sourceDominante;
    return src === "auto" ? "axe routier proche"
      : src === "rail" ? "voie ferrée proche"
      : src === "aero" ? "aéroport proche"
      : null;
  }
  if (dimId === "industrie") {
    const src = c.expoIndustrielle?.sourceDominante;
    return src == null ? null
      : (src === "seveso_haut" || src === "seveso_bas") ? "site à risque majeur proche"
      : "site industriel proche";
  }
  return null;
}

// Commune qui mène un thème = celle qui a le plus d'avantages NETS (1 commune) parmi ses
// dimensions, si elle est strictement devant. Égalité de tête -> thème équilibré (null).
function themeLeaderInsee(lignes: ComparaisonLigne[]): string | null {
  const cnt = new Map<string, number>();
  for (const l of lignes) {
    if (l.avantage.type === "avantage" && l.avantage.insees.length === 1) {
      const i = l.avantage.insees[0];
      cnt.set(i, (cnt.get(i) ?? 0) + 1);
    }
  }
  const sorted = [...cnt.entries()].sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  if (sorted.length > 1 && sorted[0][1] === sorted[1][1]) return null;
  return sorted[0][0];
}

// Contexte spatial : UNE phrase sur la relation entre les communes (proches/éloignées, même
// région/UU). Pas un bloc, pas une carte. Révèle ce que les thèmes ne disent pas. Déterministe.
function buildSpatialContext(cols: (IndexCommune | null)[]): string | null {
  const pts = cols.filter((c): c is IndexCommune => c != null);
  if (pts.length < 2) return null;
  const n = pts.length;
  const nMot = n >= 3 ? "Trois" : "Deux";

  // Écart du groupe = distance maximale entre deux communes.
  let span = 0;
  for (let i = 0; i < pts.length; i++)
    for (let j = i + 1; j < pts.length; j++)
      span = Math.max(span, haversineKm(pts[i].lat, pts[i].lon, pts[j].lat, pts[j].lon));
  const km = Math.max(5, span >= 100 ? Math.round(span / 10) * 10 : Math.round(span / 5) * 5);

  const uus = pts.map((c) => c.uu ?? null);
  const sameUU = uus.every((u) => u != null && u === uus[0]);
  if (sameUU) return `${nMot} communes de la même unité urbaine.`;

  const regions = [...new Set(pts.map((c) => c.region).filter((r): r is string => r != null))];
  const sameRegion = regions.length === 1 && pts.every((c) => c.region != null);
  if (sameRegion) {
    return n >= 3
      ? `${nMot} communes de la même région, dans un rayon de ~${km} km.`
      : `À ~${km} km, dans la même région.`;
  }

  // Régions différentes : c'est le contraste fort (deux vies éloignées).
  if (n >= 3) {
    const regMot = regions.length === 2 ? "deux" : regions.length === 3 ? "trois" : `${regions.length}`;
    return `${nMot} communes, ${regMot} régions, jusqu'à ~${km} km d'écart.`;
  }
  return `À ~${km} km, deux régions différentes.`;
}

// Construit la comparaison complète du trio affiché. Déterministe, hors score/tri.
// Mot du palier ABSOLU (bandIndex), avantage RELATIF au trio (égalité si écart < gap
// OU même palier partout), synthèse honnête par thème, chapeau de divergences.
export function buildComparaisonComplete(
  picks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
): ComparaisonComplete {
  const trio = picks.slice(0, 3);
  const cols = trio.map((r) => byInsee.get(r.insee) ?? null);
  // Cardinal-agnostique : le « trio » peut être 2 ou 3 communes (mode choix). Le mot qui
  // dénombre les territoires dans les phrases de synthèse suit le cardinal réel.
  const nMot = trio.length >= 3 ? "trois" : "deux";

  // subScore par dimension, aligné sur le trio (null = donnée absente pour la commune)
  const rawByDim = new Map<string, (number | null)[]>();
  for (const dim of DIMENSIONS) {
    if (dim.key === "taille_ville") {
      rawByDim.set(dim.id, cols.map((c) => (c ? tailleVille(c) ?? null : null)));
    } else {
      const key = dim.key; // narrowed à PreferenceKey ; hoisté hors closure (TS perd la narrowing sinon)
      rawByDim.set(dim.id, cols.map((c) => (c ? subScore(key, c) : null)));
    }
  }

  // une ligne par dimension : palier absolu + avantage relatif au trio
  const ligneByDim = new Map<string, ComparaisonLigne>();
  // Candidats à la « ligne de fracture » (mode choix) : dimensions directionnelles où les
  // communes s'écartent (un meilleur palier ET un pire présents). cf. type Divergence.
  type DivCand = {
    dimId: string; themeId: string; label: string; themeIdx: number;
    leaderInsee: string; leaderPalier: string; exposeInsee: string; exposePalier: string;
    spread: number; risque: boolean;
  };
  const divCands: DivCand[] = [];
  for (const dim of DIMENSIONS) {
    const raw = rawByDim.get(dim.id)!;
    // bande de favorabilité par commune (null = donnée absente, ou taille = factuel non bandé)
    const bands = trio.map((r, i) =>
      raw[i] == null || dim.key === "taille_ville" ? null : bandIndex(raw[i]!),
    );
    const someoneBetter = (b: number) => bands.some((x) => x != null && x < b);

    // Avantage fondé sur le PALIER affiché. Dimension non directionnelle (préférence : soleil,
    // taille) -> « neutre », pas de gagnant. Sinon les communes au MEILLEUR palier mènent, MAIS
    // seulement si au moins une commune présente est en retrait : « À égalité » dès que TOUTES
    // les communes ayant la donnée partagent le meilleur palier. Cardinal-agnostique (2 ou 3) :
    // à 2 communes au même palier, c'est une égalité, pas « Avantage A et B ». On nomme qui mène,
    // jamais qui est en retrait.
    let avantage: ComparaisonAvantage = { type: "egalite" };
    if (!dim.directionnel) {
      avantage = { type: "neutre" };
    } else {
      const present = bands.filter((b): b is 0 | 1 | 2 => b != null);
      if (present.length >= 1) {
        const best = Math.min(...present);
        const holders = trio.filter((r, i) => bands[i] === best);
        if (holders.length < present.length) {
          avantage = { type: "avantage", insees: holders.map((h) => h.insee) };
        }
      }
    }
    const leaderSet = avantage.type === "avantage" ? new Set(avantage.insees) : new Set<string>();

    const cellules: ComparaisonCellule[] = trio.map((r, i) => {
      const c = cols[i];
      const s = raw[i];
      if (c == null || s == null) {
        return { insee: r.insee, palier: "Non concernée", qualifier: null, disponible: false, alerte: false };
      }
      const band = bands[i];
      const palier = dim.key === "taille_ville" ? tailleVillePalier(c) : dim.paliers[band!];
      // Qualifier (source proche) seulement pour expliquer une EXPOSITION : pas sur le tier
      // favorable, pas sur la commune qui MÈNE (sinon « Avantage » + « site à risque proche »
      // se contredisent).
      const qualifier =
        band != null && band >= 1 && !leaderSet.has(r.insee) ? dimQualifier(dim.id, c) : null;
      // Alerte rouge : pire tier d'un critère de risque, alors qu'une autre commune fait mieux.
      const alerte = dim.risque && band === 2 && someoneBetter(2);
      return { insee: r.insee, palier, qualifier, disponible: true, alerte };
    });

    ligneByDim.set(dim.id, { id: dim.id, label: dim.label, aide: dim.aide, avantage, cellules });

    // Candidat fracture : dimension directionnelle où le trio s'écarte (meilleur + pire palier
    // présents). On retient qui mène (meilleur palier) et qui est exposé (pire), pour la phrase.
    if (dim.directionnel) {
      const present = bands.filter((b): b is 0 | 1 | 2 => b != null);
      if (present.length >= 2) {
        const minBand = Math.min(...present);
        const maxBand = Math.max(...present);
        const spread = maxBand - minBand;
        if (spread >= 1) {
          const leaderIdx = bands.findIndex((b) => b === minBand);
          const exposeIdx = bands.findIndex((b) => b === maxBand);
          divCands.push({
            dimId: dim.id,
            themeId: dim.themeId,
            label: dim.label,
            themeIdx: THEME_ORDER.findIndex((t) => t.id === dim.themeId),
            leaderInsee: trio[leaderIdx].insee,
            leaderPalier: dim.paliers[minBand],
            exposeInsee: trio[exposeIdx].insee,
            exposePalier: dim.paliers[maxBand],
            spread,
            risque: !!dim.risque,
          });
        }
      }
    }
  }

  // thèmes : phrase de synthèse honnête (phrases naturelles, groupes nominaux avec article)
  const nomByInsee = new Map(trio.map((r) => [r.insee, r.nom]));
  const forteById = new Map(DIMENSIONS.map((d) => [d.id, d.forte]));
  const joinFr = (xs: string[]): string =>
    xs.length <= 1 ? (xs[0] ?? "") : `${xs.slice(0, -1).join(", ")} et ${xs[xs.length - 1]}`;
  const themes: ComparaisonTheme[] = THEME_ORDER.map((th) => {
    const lignes = DIMENSIONS.filter((d) => d.themeId === th.id).map((d) => ligneByDim.get(d.id)!);
    const winners = new Map<string, string[]>(); // insee -> groupes nominaux menés
    for (const l of lignes) {
      // Seuls les avantages NETS (une seule commune) nourrissent la synthèse ; les
      // avantages partagés (2 communes) sont ambigus et n'y entrent pas.
      if (l.avantage.type === "avantage" && l.avantage.insees.length === 1) {
        const insee = l.avantage.insees[0];
        const arr = winners.get(insee) ?? [];
        arr.push(forteById.get(l.id) ?? l.label.toLowerCase());
        winners.set(insee, arr);
      }
    }
    const ranked = [...winners.entries()].sort((a, b) => b[1].length - a[1].length);
    let synthese: string;
    if (ranked.length === 0) {
      // Conclure, pas seulement décrire : un thème sans gagnant net ne départage pas (il ne
      // pèsera pas dans le choix). « départage » reste neutre (vaut pour la découverte aussi).
      synthese = `Sur ce thème, les ${nMot} territoires se ressemblent : rien ne les départage ici.`;
    } else if (ranked.length === 1) {
      const [insee, fortes] = ranked[0];
      synthese = `${nomByInsee.get(insee)} se distingue par ${joinFr(fortes.slice(0, 2))}.`;
    } else {
      const [a, b] = ranked;
      synthese = `${nomByInsee.get(a[0])} se distingue par ${a[1][0]}, ${nomByInsee.get(b[0])} par ${b[1][0]}.`;
    }
    return { id: th.id, titre: th.titre, synthese, lignes };
  });

  // « En résumé » : niveau thème. Quelles communes mènent quels thèmes (prépare la lecture
  // du détail). Déterministe. La 1re commune (mène le plus de thèmes) « prend l'avantage »,
  // les suivantes « se distinguent ». On nomme qui mène, jamais qui est en retrait.
  const gpThemeById = new Map(THEME_ORDER.map((t) => [t.id, t.gp]));
  const courtThemeById = new Map(THEME_ORDER.map((t) => [t.id, t.court]));
  const ledByInsee = new Map<string, string[]>();
  // insee -> thèmes menés avec la FORCE du lead (nb de dimensions gagnées seul). Sert à choisir,
  // pour la phrase d'arbitrage, le thème le plus distinctif de la commune (pas le 1er affiché :
  // le climat, en tête de liste, n'est presque jamais le plus décisif).
  const ledThemesByInsee = new Map<string, { themeId: string; strength: number }[]>();
  for (const th of themes) {
    const lead = themeLeaderInsee(th.lignes);
    if (lead) {
      const arr = ledByInsee.get(lead) ?? [];
      arr.push(gpThemeById.get(th.id) ?? th.titre.toLowerCase());
      ledByInsee.set(lead, arr);
      const strength = th.lignes.filter(
        (l) => l.avantage.type === "avantage" && l.avantage.insees.length === 1 && l.avantage.insees[0] === lead,
      ).length;
      const tarr = ledThemesByInsee.get(lead) ?? [];
      tarr.push({ themeId: th.id, strength });
      ledThemesByInsee.set(lead, tarr);
    }
  }
  const ordered = [...ledByInsee.entries()].sort((a, b) => b[1].length - a[1].length);
  const resume: string[] = [];
  if (ordered.length === 0) {
    resume.push(`Les ${nMot} territoires sont très proches sur l'ensemble des thèmes.`);
  } else {
    ordered.forEach(([insee, gps], idx) => {
      const verbe = idx === 0 ? "prend l'avantage sur" : "se distingue sur";
      resume.push(`${nomByInsee.get(insee)} ${verbe} ${joinFr(gps)}.`);
    });
  }

  // Ligne de fracture : le candidat au plus grand écart, le risque d'abord (plus décisif),
  // puis l'ordre des thèmes. Domination = une commune mène (presque) tous les thèmes : il n'y a
  // pas de vrai compromis, la fracture pointe alors la SEULE dimension où une AUTRE commune mène.
  // Pertinence décisionnelle du DÉFAUT dévoilé : un risque de niche à fort écart (feu,
  // pluies, sécheresse) ne doit pas s'imposer comme thème par défaut devant un thème
  // largement décisif. Pénalité d'écart (pas une exclusion : le lecteur peut toujours
  // l'ouvrir via l'explorateur). cf. spec 2.5.
  const LOW_RELEVANCE_DIMS = new Set(["feu", "pluies", "secheresse"]);
  const relScore = (c: (typeof divCands)[number]) =>
    c.spread - (LOW_RELEVANCE_DIMS.has(c.dimId) ? 1 : 0);
  const sortedCands = [...divCands].sort(
    (a, b) => relScore(b) - relScore(a) || a.themeIdx - b.themeIdx,
  );
  const dominator = ordered.length > 0 && ordered[0][1].length >= themes.length - 1 ? ordered[0][0] : null;

  // Phrase de hiérarchisation à deux pôles. Seulement quand deux communes distinctes mènent
  // (pas de domination) : on prend les deux qui mènent le PLUS de thèmes, et pour chacune son
  // thème de tête (1er dans l'ordre THEME_ORDER). Forme conditionnelle : le critère reste au
  // lecteur, on ne décide pas pour lui. cf. challenge paywall / doctrine éditoriale.
  let arbitrage: string | null = null;
  if (!dominator && ordered.length >= 2) {
    // Thème le plus distinctif de chaque commune : force du lead décroissante (tri stable =
    // départage par l'ordre THEME_ORDER à force égale).
    const strongest = (insee: string) =>
      [...(ledThemesByInsee.get(insee) ?? [])].sort((a, b) => b.strength - a.strength)[0]?.themeId;
    const inseeA = ordered[0][0];
    const inseeB = ordered[1][0];
    const themeA = strongest(inseeA);
    const themeB = strongest(inseeB);
    // Les thèmes menés sont disjoints par commune (un seul leader par thème) : themeA/B/C sont
    // donc nécessairement distincts dès qu'ils existent.
    if (ordered.length >= 3) {
      // TRIO : couvrir les TROIS communes (ne pas réduire un choix à trois à une opposition
      // binaire, cf. audit éditorial). Énumération qui rend le critère au lecteur, sans couronner.
      const inseeC = ordered[2][0];
      const themeC = strongest(inseeC);
      if (themeA && themeB && themeC) {
        // « X pour Y » (pas « X sur Y », ambigu sur la direction pour un thème de risque) :
        // chaque commune est le bon choix POUR cette priorité (le critère reste au lecteur).
        arbitrage =
          `Selon votre priorité : ${nomByInsee.get(inseeA)} pour ${courtThemeById.get(themeA)}, ` +
          `${nomByInsee.get(inseeB)} pour ${courtThemeById.get(themeB)}, ${nomByInsee.get(inseeC)} pour ${courtThemeById.get(themeC)}.`;
      }
    } else if (themeA && themeB) {
      const courtA = courtThemeById.get(themeA)!;
      const courtB = courtThemeById.get(themeB)!;
      const verbeA = courtA.startsWith("les ") ? "comptent" : "compte"; // accord sujet pluriel
      arbitrage =
        `Si ${courtA} ${verbeA} d'abord pour vous, ${nomByInsee.get(inseeA)} prend l'avantage ; ` +
        `si vous regardez surtout ${courtB}, ${nomByInsee.get(inseeB)} reprend la main.`;
    }
  }
  const chosen = dominator
    ? sortedCands.find((c) => c.leaderInsee !== dominator) ?? sortedCands[0] ?? null
    : sortedCands[0] ?? null;
  const divergence: Divergence = chosen
    ? {
        dimId: chosen.dimId,
        themeId: chosen.themeId,
        label: chosen.label,
        leaderInsee: chosen.leaderInsee,
        leaderPalier: chosen.leaderPalier,
        exposeInsee: chosen.exposeInsee,
        exposePalier: chosen.exposePalier,
        domine: dominator != null,
        dominatorInsee: dominator,
      }
    : null;

  const spatialContext = buildSpatialContext(cols);

  return { resume, arbitrage, spatialContext, divergence, themes };
}

// Narratif « nouveaux arrivants » (HORS score) : phrase descriptive, jamais normative.
// Mappe c.demographie.recit -> phrase (cf. populate-demographie.py RECIT_LABEL).
export const RECIT_DEMOGRAPHIE: Record<string, string> = {
  gagne_attire: "gagne des habitants et attire de nouveaux arrivants",
  gagne_sans_renouv: "gagne des habitants sans fort renouvellement récent",
  stable_renouv: "population stable, mais renouvellement résidentiel marqué",
  stable: "population globalement stable",
  perd: "perd des habitants",
};

// Récit explicatif du calme sonore (HORS score, qui est cumulé). Nomme la source bruyante
// la plus proche NOMMABLE + sa distance. null = aucune source proche (silence : rien à
// expliquer, même si l'ambiance cumulée reste un peu exposée). Descriptif, jamais un jugement.
function calmeSonoreRecit(c: IndexCommune): string | null {
  const cs = c.calmeSonore;
  if (!cs || cs.sourceDominante == null) return null;
  // Doctrine : AUCUN chiffre dans la synthèse / AskFuture. On NOMME la source proche
  // (axe routier, voie ferrée, aéroport), jamais la distance (distanceKm reste interne).
  return cs.sourceDominante === "auto" ? "la proximité d'un grand axe routier"
    : cs.sourceDominante === "rail" ? "la proximité d'une voie ferrée"
    : "la proximité d'un aéroport";
}

// Récit de l'exposition industrielle (HORS score). Langage courant, sans chiffre, sans jargon
// (« Seveso » jamais affiché). « à risque majeur » = sens factuel de Seveso, pas un jugement.
// null = aucun site préoccupant proche (silence). Descriptif, jamais « dangereux/toxique ».
function expoIndustrielleRecit(c: IndexCommune): string | null {
  const src = c.expoIndustrielle?.sourceDominante;
  if (src == null) return null;
  return (src === "seveso_haut" || src === "seveso_bas")
    ? "la proximité d'un site industriel à risque majeur"
    : "la proximité d'un site industriel";
}

// ── Héritage industriel (récit narratif, gaté, hors score) ───────────────────
// Label grand public + genre par catégorie. Le récit reste DOCUMENTAIRE et au passé
// (« ancienne … recensée »), JAMAIS « pollué/risque/toxique » (réservés au rapport). cf. spec §4.
const HERITAGE_LABEL: Record<
  NonNullable<IndexCommune["heritageIndustriel"]>["activite"],
  { mot: string; genre: "m" | "f" }
> = {
  usine_gaz: { mot: "ancienne usine à gaz", genre: "f" },
  raffinerie_hydrocarbures: { mot: "ancien dépôt d'hydrocarbures", genre: "m" },
  station_service: { mot: "ancienne station-service", genre: "f" },
  chimie: { mot: "ancien site chimique", genre: "m" },
  metallurgie: { mot: "ancienne fonderie", genre: "f" },
  mine: { mot: "ancienne mine", genre: "f" },
  decharge: { mot: "ancienne décharge", genre: "f" },
  generique: { mot: "ancien site industriel", genre: "m" },
};
function heritageRecit(c: IndexCommune): string | null {
  const h = c.heritageIndustriel;
  if (!h) return null;
  const { mot, genre } = HERITAGE_LABEL[h.activite];
  const art = genre === "f" ? "Une" : "Un";
  const rec = genre === "f" ? "recensée" : "recensé";
  if (h.plusieurs) {
    if (h.activite === "generique") {
      return "Plusieurs anciens sites industriels sont recensés à proximité.";
    }
    return `${art} ${mot}, parmi d'autres anciens sites industriels, est ${rec} à proximité.`;
  }
  return `${art} ${mot} est ${rec} à proximité.`;
}
const SIGNAUX_MAX = 5;

function bandIndex(score: number): 0 | 1 | 2 {
  return score >= 66 ? 0 : score < 34 ? 2 : 1;
}

// ── Compromis toujours présent (narratif, hors score) ────────────────────────
// tradeoff absolu (worst < 50, déjà dans r.tradeoff) sinon le retrait le plus net
// RELATIF au groupe affiché, sinon « sans faiblesse marquée ». Jamais de chiffre,
// jamais nommer un perdant (« que dans les autres options »).
const COMPROMIS_KEYS: PreferenceKey[] = [
  "faible_chaleur", "faible_secheresse", "faible_risque_inondation", "air_sain",
  "acces_soins", "acces_services", "calme_sonore", "faible_exposition_industrielle",
  "vie_locale", "faible_dependance_auto",
];
const COMPROMIS_NEG: Partial<Record<PreferenceKey, string>> = {
  faible_chaleur: "la chaleur estivale est plus marquée",
  faible_secheresse: "la sécheresse est plus présente",
  faible_risque_inondation: "le risque d'inondation est plus présent",
  air_sain: "l'air de fond est un peu moins pur",
  acces_soins: "l'offre de soins est plus limitée",
  acces_services: "les services sont moins accessibles",
  calme_sonore: "l'environnement est plus bruyant",
  faible_exposition_industrielle: "les sites industriels sont plus présents",
  vie_locale: "la vie locale est plus discrète",
  faible_dependance_auto: "la voiture y est plus indispensable",
};

// Écart minimal pour citer une commune de référence (« qu'à Briançon ») : en deçà,
// la divergence n'est pas crédible (le « leader » est lui aussi faible), on reste sur
// la formulation absolue. Sert au seuil relatif ET au comparatif.
const COMPROMIS_GAP = 12;

// Commune affichée qui MÈNE sur la dimension (la meilleure, jamais un perdant), pour
// le comparatif « qu'à X ». null si aucune autre n'est notée sur cette clé.
function compromisLeader(
  key: PreferenceKey,
  self: MatchResult,
  shownPicks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
): { nom: string; score: number } | null {
  let nom: string | null = null;
  let score = -1;
  for (const o of shownPicks) {
    if (o.insee === self.insee) continue;
    const oc = byInsee.get(o.insee);
    const os = oc ? subScore(key, oc) : null;
    if (os != null && os > score) { score = os; nom = o.nom; }
  }
  return nom ? { nom, score } : null;
}

// Candidats de compromis d'une commune, ordonnés du plus saillant au moins saillant.
// On en renvoie PLUSIEURS (comme buildIdentiteCandidates) pour que la passe de groupe
// puisse garantir un compromis UNIQUE par dimension dans le trio : sinon deux communes
// affichent le même arbitrage et la tension comparative s'effondre. Chaque candidat
// porte sa clé (dimension, base de l'unicité) et son texte déjà rendu (comparatif si un
// leader se détache, sinon formulation absolue). Jamais de chiffre, jamais un perdant nommé.
type CompromisCand = { key: PreferenceKey; severity: number; text: string };
function buildCompromisCandidates(
  r: MatchResult,
  c: IndexCommune | null,
  tradeoffKey: PreferenceKey | null,
  groupMean: Map<PreferenceKey, number>,
  shownPicks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
): CompromisCand[] {
  const out: CompromisCand[] = [];
  const seen = new Set<PreferenceKey>();
  const add = (key: PreferenceKey, severity: number) => {
    if (seen.has(key)) return;
    seen.add(key);
    const self = c ? subScore(key, c) : null;
    const leader = compromisLeader(key, r, shownPicks, byInsee);
    const neg = COMPROMIS_NEG[key];
    // Comparatif seulement si la dimension a un sens relatif (COMPROMIS_NEG) ET qu'un
    // leader se détache vraiment (écart ≥ seuil) : « moins accessibles qu'à X ». Sinon
    // formulation absolue télégraphique (REASON_NEG), honnête sans inventer de divergence.
    const text =
      neg && leader && self != null && leader.score - self >= COMPROMIS_GAP
        ? `En échange, ${neg} qu'à ${leader.nom}.`
        : `En échange, ${REASON_NEG[key]}.`;
    out.push({ key, severity, text });
  };

  // 1. Faiblesse ABSOLUE (pref demandée scorant < 50) : priorité maximale, comme avant
  //    (où r.tradeoff court-circuitait). Severity gonflée pour primer sur les retraits relatifs.
  if (tradeoffKey) add(tradeoffKey, 1000);

  // 2. Retraits RELATIFS au groupe (COMPROMIS_KEYS), ordonnés par delta décroissant.
  if (c) {
    const rel: { key: PreferenceKey; delta: number }[] = [];
    for (const k of COMPROMIS_KEYS) {
      const s = subScore(k, c);
      const mean = groupMean.get(k);
      if (s == null || mean == null || !COMPROMIS_NEG[k]) continue;
      const delta = mean - s; // positif = en retrait du groupe
      if (delta >= COMPROMIS_GAP) rel.push({ key: k, delta });
    }
    rel.sort((a, b) => b.delta - a.delta);
    for (const x of rel) add(x.key, x.delta);
  }
  return out;
}

function assignCompromis(
  shownPicks: MatchResult[],
  byInsee: Map<string, IndexCommune>,
  tradeoffKeyByInsee: Map<string, PreferenceKey | null>,
): void {
  // Scores de groupe par clé (moyenne sur les communes affichées).
  const groupMean = new Map<PreferenceKey, number>();
  for (const k of COMPROMIS_KEYS) {
    const vals: number[] = [];
    for (const r of shownPicks) {
      const c = byInsee.get(r.insee);
      const s = c ? subScore(k, c) : null;
      if (s != null) vals.push(s);
    }
    if (vals.length) groupMean.set(k, vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  // Compromis UNIQUE par dimension : dans l'ordre d'affichage, chaque commune prend son
  // candidat le plus saillant dont la dimension n'est pas déjà prise par une autre du
  // trio. Résultat : trois arbitrages distincts (chaleur / services / industrie…) plutôt
  // que le même compromis répété. Repli si aucune dimension libre ne se détache.
  const used = new Set<PreferenceKey>();
  for (const r of shownPicks) {
    const c = byInsee.get(r.insee) ?? null;
    const tradeoffKey = tradeoffKeyByInsee.get(r.insee) ?? null;
    const cands = buildCompromisCandidates(r, c, tradeoffKey, groupMean, shownPicks, byInsee);
    const chosen = cands.find((x) => !used.has(x.key));
    if (chosen) {
      used.add(chosen.key);
      r.compromis = chosen.text;
    } else {
      // Cardinal-agnostique : 2 ou 3 communes en mode choix (« des deux » / « des trois »).
      const nMot = shownPicks.length >= 3 ? "trois" : "deux";
      r.compromis = `Le bon compromis des ${nMot}, sans faiblesse marquée.`;
    }
  }
}

// Calcule les signaux ambiants sur le GROUPE affiché (mutation in place de r.signaux).
// 1) score par (dim, commune) hors critères demandés et hors données absentes ;
// 2) filtre de contraste de groupe (>=2 communes : la dim doit s'étaler sur >=2 bandes) ;
// 3) par commune, classer par |score - moyenne de groupe| (ou |score - 50| si une seule
//    commune), garder 5, mapper la phrase de bande.
function assignSignaux(
  picks: MatchResult[],
  communeByInsee: Map<string, IndexCommune>,
  requestedKeys: Set<PreferenceKey>,
): void {
  const cols = picks.map((r) => communeByInsee.get(r.insee) ?? null);

  // 1. scores alignés sur picks, par dimension (null = critère demandé OU donnée absente)
  const scoresByDim = new Map<string, (number | null)[]>();
  for (const dim of AMBIENT_DIMENSIONS) {
    if (requestedKeys.has(dim.key)) {
      scoresByDim.set(dim.id, picks.map(() => null));
    } else {
      scoresByDim.set(dim.id, cols.map((c) => (c ? subScore(dim.key, c) : null)));
    }
  }

  // 2. filtre de contraste de groupe
  const groupContrast = picks.length >= 2;
  const kept = new Set<string>();
  for (const dim of AMBIENT_DIMENSIONS) {
    const present = scoresByDim.get(dim.id)!.filter((s): s is number => s != null);
    if (present.length === 0) continue;
    if (!groupContrast) {
      kept.add(dim.id);
    } else if (new Set(present.map(bandIndex)).size >= 2) {
      kept.add(dim.id);
    }
  }

  // 3. moyenne de groupe par dimension retenue
  const meanByDim = new Map<string, number>();
  for (const id of kept) {
    const present = scoresByDim.get(id)!.filter((s): s is number => s != null);
    meanByDim.set(id, present.reduce((a, b) => a + b, 0) / present.length);
  }

  // 4. sélection par commune (Array.sort est stable -> égalité = ordre du tableau §1)
  picks.forEach((r, i) => {
    const ranked = AMBIENT_DIMENSIONS
      .filter((dim) => kept.has(dim.id))
      .map((dim) => ({ dim, s: scoresByDim.get(dim.id)![i] }))
      .filter((x): x is { dim: AmbientDim; s: number } => x.s != null)
      .map((x) => ({
        dim: x.dim,
        s: x.s,
        dist: groupContrast ? Math.abs(x.s - (meanByDim.get(x.dim.id) ?? 50)) : Math.abs(x.s - 50),
      }))
      .sort((a, b) => b.dist - a.dist)
      .slice(0, SIGNAUX_MAX);
    const signaux: Record<string, string> = {};
    for (const x of ranked) signaux[x.dim.id] = x.dim.bands[bandIndex(x.s)];
    // Signal narratif climatique (déjà calculé à l'assemblage, self-gated, hors cap ambiant).
    if (r.climatInondation) signaux["climat_inondation"] = r.climatInondation;
    r.signaux = signaux;
  });
}

const REASON_POS: Record<PreferenceKey, string | ((c: IndexCommune) => string)> = {
  faible_chaleur: "étés plus frais",
  douceur_climat: "climat doux, hivers tempérés",
  ensoleillement_recherche: "plus ensoleillé",
  faible_secheresse: "sols peu exposés à la sécheresse",
  faible_risque_feu: "faible risque de feu",
  faible_precip_extremes: "pluies extrêmes rares",
  // On nomme, on ne mesure pas : paliers qualitatifs, jamais la distance brute
  // (le chiffre cassait le récit sur le révélateur d'arbitrages). Le détail au rapport.
  proximite_mer: (c) =>
    c.distance_cote_km <= 2
      ? "en bord de mer"
      : c.distance_cote_km <= 8
        ? "à deux pas du littoral"
        : "à proximité du littoral",
  cadre_calme: "cadre calme et habitable",
  // On nomme, on ne mesure pas : paliers qualitatifs sur la taille du bassin de vie,
  // jamais le nombre d'habitants brut (le chiffre cassait le récit). Détail au rapport.
  eviter_isolement: (c) => {
    const t = tailleVille(c) ?? 0;
    return t >= 100_000
      ? "au cœur d'un vaste bassin de vie"
      : t >= 25_000
        ? "bassin de vie bien pourvu"
        : "bassin de vie de proximité";
  },
  air_sain: "air de fond plus pur",
  acces_soins: "bon accès aux médecins",
  acces_services: "services et commerces à proximité",
  faible_pression_agricole: "loin des cultures à traitements fréquents",
  // « à proximité » assumé : on mesure le couvert naturel autour, pas dans la commune.
  // Jamais « commune naturelle / préservée / sauvage / biodiversité » (cf. doctrine).
  nature: "forêts et espaces naturels à proximité",
  acces_ecoles: "collèges et lycées accessibles autour",
  acces_culture: "équipements culturels accessibles autour",
  faible_risque_inondation: "peu d'arrêtés CatNat inondation",
  faible_dependance_auto: "peu dépendante de la voiture au quotidien",
  acces_transports: "bien reliée par le train",
  mobilite_quotidienne: (c) => {
    const r = c.reseauLocal;
    const mode = r?.metro ? "métro" : r?.tram ? "tram" : "bus";
    return `réseau de ${mode} à portée de marche`;
  },
  eviter_grandes_villes: "ville à taille humaine",
  prefere_grande_ville: "grande ville animée",
  vie_etudiante: "forte présence étudiante",
  vie_locale: "vie locale animée (commerces, marchés, associations)",
  croissance_demographique: "population en croissance",
  // Positif = score haut = environnement peu maillé d'infra bruyantes. Le coupable proche
  // (autoroute/rail/aéro) se raconte côté récit (calmeSonoreRecit), pas dans la reason positive.
  calme_sonore: "à l'écart des grandes infrastructures bruyantes",
  faible_exposition_industrielle: "à l'écart des sites industriels à risque",
  // « Vaste » est gradué sur la taille RÉELLE de la ZE (effectif salarié absolu),
  // pas sur le percentile saturé : le mot ne sort que là où il est mérité. La
  // diversité (entropie A38) est, elle, toujours défendable.
  viabilite_emploi: (c) =>
    (zeInfo(c)?.total ?? 0) >= 200_000
      ? "vaste bassin d'emploi diversifié"
      : "bassin d'emploi diversifié",
};
const REASON_NEG: Record<PreferenceKey, string> = {
  faible_chaleur: "chaleur en hausse",
  douceur_climat: "hivers rudes ou étés marqués",
  ensoleillement_recherche: "moins ensoleillé",
  faible_secheresse: "sols exposés à la sécheresse",
  faible_risque_feu: "risque de feu notable",
  faible_precip_extremes: "pluies intenses fréquentes",
  proximite_mer: "éloignée du littoral",
  cadre_calme: "plus dense que recherché",
  eviter_isolement: "bassin de vie réduit, plus isolé",
  air_sain: "air plus chargé en particules",
  acces_soins: "zone sous-dotée en médecins",
  acces_services: "services parfois éloignés",
  faible_pression_agricole: "environnement agricole à traitements fréquents à proximité",
  viabilite_emploi: "bassin d'emploi étroit ou peu diversifié",
  nature: "peu d'espaces naturels à proximité",
  acces_ecoles: "établissements du secondaire plus éloignés",
  acces_culture: "offre culturelle accessible plus limitée",
  faible_risque_inondation: "historique CatNat inondation plus marqué",
  faible_dependance_auto: "territoire où la voiture reste quasi indispensable",
  acces_transports: "desserte ferroviaire limitée",
  mobilite_quotidienne: "peu ou pas de transports en commun de proximité",
  eviter_grandes_villes: "grande agglomération",
  prefere_grande_ville: "petit bassin urbain",
  vie_etudiante: "présence étudiante limitée",
  vie_locale: "peu de lieux de vie et d'animation locale",
  croissance_demographique: "population en baisse",
  calme_sonore: "environnement assez maillé d'infrastructures bruyantes",
  faible_exposition_industrielle: "à proximité de sites industriels à risque",
};
function reasonText(key: PreferenceKey, c: IndexCommune): string {
  const r = REASON_POS[key];
  return typeof r === "function" ? r(c) : r;
}

// Pression climatique sur l'économie locale → libellé qualitatif (NARRATIF).
// Garde-fous : parle de DÉPENDANCE à un secteur sensible, jamais de verdict
// (« fragile », « va décliner », « résilient ») ni de chiffre. cf.
// PRESSION_CLIMATIQUE_ECONOMIE.md. La capacité d'adaptation n'est pas mesurée
// (rappelé à l'affichage, pas dans chaque note).
const PE_SECTEUR: Record<string, string> = {
  agri_foret: "l'agriculture et la forêt",
  tourisme_estival: "le tourisme estival",
  tourisme_montagne: "le tourisme de montagne",
};
const PE_ALEA: Record<string, string> = {
  secheresse: "sensibles à la sécheresse",
  feu: "exposées au risque de feu",
  chaleur: "sensible à la hausse des chaleurs",
  neige: "sensible à l'évolution de l'enneigement",
};
function pressionEcoNote(pe: { palier: "moderee" | "marquee"; secteur: string; alea: string }): string {
  const part = pe.palier === "marquee" ? "Une part importante" : "Une part";
  const secteur = PE_SECTEUR[pe.secteur] ?? "certaines activités";
  const alea = PE_ALEA[pe.alea] ?? "sensibles au climat";
  return `${part} de l'économie locale repose sur ${secteur}, ${alea}.`;
}

// Signal narratif (hors score). N'existe que si la PRESSION climatique est marquée :
// tendance projetée des pluies extrêmes forte (NORRx1d, moteur principal) ET niveau déjà
// significatif (NORRRq99, garde-fou). La phrase s'adapte à l'historique CatNat observé.
// Seuils calés sur témoins réels (porteur) : tendance >= 88 ET niveau >= 75 -> ~12,5 % des
// communes, garde Nîmes (94/93) et Arles (88/79), exclut Lens (3/1) et Paris (4/8, crue de
// Seine fluviale non captée par la tendance pluies extrêmes). Préférence : rare mais crédible.
function buildClimatInondation(c: IndexCommune): string | null {
  const inond = c.inondation;
  if (!inond) return null;
  const tendance = c.pct.NORRx1d_yr; // Δ projeté des pluies extrêmes (percentile national)
  const niveau = c.pct.NORRRq99_yr; // niveau p99 journalier (percentile national)
  if (tendance == null || niveau == null) return null; // DRIAS manquant -> silence
  const pressionMarquee = tendance >= 88 && niveau >= 75;
  if (!pressionMarquee) return null; // le climat n'ajoute rien -> silence
  const historiqueNotable = inond.risque >= 66; // beaucoup d'arrêtés CatNat observés
  return historiqueNotable
    ? "Historique d'inondation déjà présent ; les pluies extrêmes tendent à s'intensifier."
    : "Peu d'inondations recensées à ce jour ; les pluies extrêmes tendent à s'intensifier.";
}

// Logement : niveau de prix RELATIF en libellé qualitatif (NARRATIF, hors score).
// « moyen » → silence (pas de note) ; achat indisponible (Alsace-Moselle) → silence
// aussi (jamais déguisé en « moyen »). Jamais de chiffre ni d'accessibilité : le
// détail vit au rapport. Achat et location séparés. cf. populate-logement.mjs.
const LOGEMENT_ACHAT: Record<string, string> = {
  tres_haut: "immobilier parmi les plus chers",
  haut: "immobilier plus cher que la moyenne",
  bas: "immobilier moins cher que la moyenne",
  tres_bas: "immobilier parmi les moins chers",
};
const LOGEMENT_LOCATION: Record<string, string> = {
  tres_haut: "loyers parmi les plus élevés",
  haut: "loyers plus élevés que la moyenne",
  bas: "loyers plus bas que la moyenne",
  tres_bas: "loyers parmi les plus bas",
};
// niveau → sens (+ cher / − moins cher / 0 silence) ; « moyen » = silencieux.
function logementSens(n: string | null): -1 | 0 | 1 {
  if (n === "tres_haut" || n === "haut") return 1;
  if (n === "tres_bas" || n === "bas") return -1;
  return 0;
}
const isExtreme = (n: string | null) => n === "tres_haut" || n === "tres_bas";
// UNE phrase. Agrégée si achat et location concordent ; détaillée si divergence ;
// un seul axe si l'autre est silencieux ; rien si les deux sont moyens / absents.
function logementNote(c: IndexCommune): string | null {
  const lg = c.logement;
  if (!lg) return null;
  const aN = lg.achat?.dispo ? lg.achat.niveau : null;
  const lN = lg.location ? lg.location.niveau : null;
  const a = logementSens(aN), l = logementSens(lN);
  if (a === 0 && l === 0) return null;
  if (a !== 0 && l !== 0) {
    if (a === l) {
      // concordance : une seule phrase « marché … ». « parmi les … » si les DEUX
      // axes sont extrêmes, sinon « … que la moyenne » (on ne sur-promet pas).
      const both = isExtreme(aN) && isExtreme(lN);
      return a > 0
        ? both ? "marché parmi les plus chers" : "marché plus cher que la moyenne"
        : both ? "marché parmi les moins chers" : "marché moins cher que la moyenne";
    }
    // divergence : on détaille, sans jamais le mot « abordable » (= accessibilité).
    return `${a > 0 ? "achat plus cher" : "achat moins cher"}, ${l > 0 ? "loyers plus élevés" : "loyers plus bas"}`;
  }
  // un seul axe distinctif
  if (a !== 0) return LOGEMENT_ACHAT[aN!] ?? null;
  return LOGEMENT_LOCATION[lN!] ?? null;
}

function passesHard(
  c: IndexCommune,
  hc: HardConstraints,
  placePoint: { lat: number; lon: number; maxKm: number } | null,
  zoneDepts: Set<string> | null,
  excludeDepts: Set<string>,
  excludeUU: Set<string>,
  excludeInsee: Set<string>,
): boolean {
  // Population nulle = commune fantôme/donnée manquante : exclue comme sous le plancher
  // (sinon le critère nature pourrait faire remonter des communes quasi inhabitées).
  if (c.population == null || c.population < POP_FLOOR) return false;
  if (hc.departements?.length && !hc.departements.includes(c.dept)) return false;
  // Ancres dures : zoneDepts (intersection des ancres hard) restreint le périmètre ;
  // excludeDepts (union des ancres négatives) le rogne. Les ancres souples ne
  // filtrent pas (elles bonifient le score, hors de cette fonction).
  if (zoneDepts && !zoneDepts.has(c.dept)) return false;
  if (excludeDepts.has(c.dept)) return false;
  // Exclusion de ville par unité urbaine (« quitter Lyon ») et par commune (ville hors-UU).
  if (c.uu && excludeUU.has(c.uu)) return false;
  if (excludeInsee.has(c.insee)) return false;
  // Montagne dure : altitude ≥ ~600 m (montagnosité ≥ 50). Les communes sans
  // altitude (îles, littoral) sont exclues, ce qui est correct pour « à la montagne ».
  if (hc.montagne?.strength === "hard") {
    const m = montagnosite(c.altitude);
    if (m == null || m < 50) return false;
  }
  // « Proche d'une montagne » dur : un massif doit être à portée (relief_proximite
  // ≥ seuil). Capture les villes au pied du relief (Grenoble), que le filtre
  // d'altitude propre exclurait à tort.
  if (hc.reliefProche?.strength === "hard") {
    if ((c.relief_proximite ?? 0) < RELIEF_PROCHE_HARD) return false;
  }
  if (hc.nearSea?.active && c.distance_cote_km > (hc.nearSea.maxKm ?? 30)) return false;
  if (hc.excludeSea && c.distance_cote_km < 15) return false;
  if (hc.communeSize) {
    // Évalué en TAILLE D'AGGLOMÉRATION (UU), pas en population communale (cf. chantier C).
    const t = tailleVille(c);
    if (hc.communeSize.min != null && (t ?? 0) < hc.communeSize.min) return false;
    if (hc.communeSize.max != null && (t ?? Infinity) > hc.communeSize.max) return false;
  }
  if (placePoint) {
    if (haversineKm(c.lat, c.lon, placePoint.lat, placePoint.lon) > placePoint.maxKm) return false;
  }
  return true;
}

// Intention littorale (déclencheur du signal littoral, narratif). Large : mer
// indispensable, façade maritime nommée, ou simple préférence de proximité mer.
// Jamais si l'utilisateur exclut le littoral. Aucun effet sur le score ni le tri.
function hasCoastalIntent(parsed: ParsedProject): boolean {
  const hc = parsed.hardConstraints ?? {};
  if (hc.excludeSea) return false;
  if (hc.nearSea?.active) return true;
  const FACADES = new Set(["atlantique", "manche", "mediterranee", "cote_basque"]);
  if (hc.zones?.some((z) => FACADES.has(z.zone))) return true;
  if (parsed.preferences?.some((p) => p.key === "proximite_mer")) return true;
  return false;
}

// ── Trait distinctif (narratif, hors score) ──────────────────────────────────
// Pour CHAQUE commune affichée, l'arbitrage le plus UTILE qui la démarque du groupe.
// Palette hiérarchisée : P1 (projet de vie) prime sur P2 (climat/taille). Muet si rien
// ne se détache. cf. plan 2026-06-03-trait-distinctif-palette.
function erosionSeverity(insee: string, littoralIndex: Map<string, LittoralSummary> | null): number | null {
  const e = littoralIndex?.get(String(insee).padStart(5, "0"))?.erosion;
  if (!e || !e.classe) return null;
  const rank: Record<string, number> = { faible: 1, "modéré": 2, "marqué": 3, "très marqué": 4 };
  return rank[e.classe] ?? null;
}
const LOGEMENT_ORDINAL: Record<string, number> = { tres_bas: 1, bas: 2, moyen: 3, haut: 4, tres_haut: 5 };
function logementNiveau(c: IndexCommune): number | null {
  const a = c.logement?.achat;
  if (!a || !a.dispo) return null;
  return LOGEMENT_ORDINAL[a.niveau] ?? null;
}
function eteSupportable(c: IndexCommune): number | null {
  const heat = avgPct(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr"]);
  const dry = c.pct["NORSWI04_yr"] ?? null;
  const parts = [heat, dry].filter((x): x is number => x != null);
  return parts.length ? parts.reduce((a, b) => a + b, 0) / parts.length : null;
}

type DistinctiveCand = {
  tier: 1 | 2;
  value: (c: IndexCommune) => number | null;
  dir: "min" | "max";
  scale: number;
  mode?: "ratio" | "step";
  label: string;
  guard?: (winner: number) => boolean;
};
const DISTINCTIVE_FLOOR = 0.5;

function buildDistinctive(
  picks: IndexCommune[],
  littoralIndex: Map<string, LittoralSummary> | null,
): Record<string, string> {
  const n = picks.length;
  if (n < 2) return {};
  const suffix = n >= 3 ? " des trois" : " des deux";
  const CANDS: DistinctiveCand[] = [
    { tier: 1, value: (c) => c.nature?.score ?? null, dir: "max", scale: 22, label: "la plus proche de grands espaces naturels", guard: (w) => w >= 60 },
    { tier: 1, value: (c) => c.vivpct?.apl ?? null, dir: "max", scale: 22, label: "le meilleur accès aux médecins", guard: (w) => w >= 50 },
    { tier: 1, value: (c) => (c.emploi ? 0.6 * c.emploi.taille + 0.4 * c.emploi.diversite : null), dir: "max", scale: 22, label: "le bassin d'emploi le plus dynamique", guard: (w) => w >= 50 },
    { tier: 1, value: eteSupportable, dir: "min", scale: 22, label: "les étés les plus supportables" },
    { tier: 1, value: (c) => erosionSeverity(c.insee, littoralIndex), dir: "min", scale: 1, mode: "step", label: "le littoral le moins exposé" },
    { tier: 1, value: logementNiveau, dir: "min", scale: 1, mode: "step", label: "le marché immobilier le plus accessible" },
    { tier: 1, value: (c) => c.relief_proximite ?? null, dir: "max", scale: 22, label: "la plus proche de la montagne", guard: (w) => w >= 55 },
    { tier: 2, value: (c) => c.clim.NORRR_yr ?? null, dir: "max", scale: 250, label: "la plus pluvieuse", guard: (w) => w >= 850 },
    { tier: 2, value: (c) => c.clim.NORTMm_seas_DJF ?? null, dir: "max", scale: 4, label: "les hivers les plus doux" },
    { tier: 2, value: (c) => c.clim.NORTX30D_yr ?? null, dir: "max", scale: 15, label: "les étés les plus chauds" },
    { tier: 2, value: (c) => tailleVille(c), dir: "min", scale: 1, mode: "ratio", label: "la plus petite ville" },
    { tier: 2, value: (c) => tailleVille(c), dir: "max", scale: 1, mode: "ratio", label: "la plus grande ville" },
  ];
  const cand = new Map<string, { tier: number; label: string; sal: number }[]>(picks.map((c) => [c.insee, []]));
  for (const cd of CANDS) {
    const vals = picks.map((c) => ({ insee: c.insee, v: cd.value(c) })).filter((x): x is { insee: string; v: number } => x.v != null);
    if (vals.length < 2) continue;
    const sorted = [...vals].sort((a, b) => a.v - b.v);
    const ext = cd.dir === "min" ? sorted[0] : sorted[sorted.length - 1];
    const nearest = cd.dir === "min" ? sorted[1] : sorted[sorted.length - 2];
    if (cd.guard && !cd.guard(ext.v)) continue;
    let sal: number;
    if (cd.mode === "ratio") {
      // Taille de ville : signal RARE, seulement si l'écart est vraiment structurant
      // (×2,5). Toulouse/Foix → oui ; Toulouse/Bordeaux → non. cf. doctrine porteur.
      const ratio = cd.dir === "min" ? nearest.v / ext.v : ext.v / nearest.v;
      if (!(ratio >= 2.0)) continue;
      sal = Math.log2(ratio);
    } else if (cd.mode === "step") {
      if (Math.abs(ext.v - nearest.v) < 1) continue;
      sal = Math.abs(ext.v - nearest.v);
    } else {
      sal = Math.abs(ext.v - nearest.v) / cd.scale;
      if (sal < DISTINCTIVE_FLOOR) continue;
    }
    cand.get(ext.insee)!.push({ tier: cd.tier, label: cd.label + suffix, sal });
  }
  const out: Record<string, string> = {};
  for (const c of picks) {
    const best = (cand.get(c.insee) ?? []).sort((a, b) => a.tier - b.tier || b.sal - a.sal)[0];
    if (best) out[c.insee] = best.label;
  }
  return out;
}

// ── Distinctif mono-commune (relatif au national) ─────────────────────────────
// Indépendant de buildDistinctive (qui compare un trio). Ici on lit les
// percentiles nationaux déjà stockés et on retient le trait le plus marqué, s'il
// dépasse un seuil de saillance. Sinon null (commune sans trait distinctif net).
// Périmètre Territoire : climat, couvert naturel, trajectoire démographique,
// relief. Aucun signal logement / santé / mobilité / métier.
type MonoDistinctive = { pct: (c: IndexCommune) => number | null; dir: "high" | "low"; label: string };
const MONO_DISTINCTIVE: MonoDistinctive[] = [
  { pct: (c) => avgPct(c, ["NORTX30D_yr", "NORTX35D_yr", "NORTR_yr"]), dir: "high", label: "compte parmi les communes aux étés les plus chauds de France" },
  { pct: (c) => c.pct.NORRR_yr ?? null, dir: "high", label: "compte parmi les communes les plus pluvieuses de France" },
  { pct: (c) => avgPct(c, ["NORRRq99_yr", "NORRx1d_yr"]), dir: "high", label: "compte parmi les communes aux pluies les plus intenses de France" },
  { pct: (c) => c.pct.NORSWI04_yr ?? null, dir: "high", label: "compte parmi les communes aux sols les plus exposés à la sécheresse" },
  { pct: (c) => c.pct.NORIFM40_yr ?? null, dir: "high", label: "compte parmi les communes les plus exposées aux conditions de feu" },
  { pct: (c) => c.nature?.score ?? null, dir: "high", label: "compte parmi les communes les plus entourées d'espaces naturels" },
  { pct: (c) => c.nature?.score ?? null, dir: "low", label: "compte parmi les communes les plus urbanisées de France" },
  { pct: (c) => c.demographie?.croissance ?? null, dir: "high", label: "compte parmi les communes les plus dynamiques sur le plan démographique" },
  { pct: (c) => c.demographie?.croissance ?? null, dir: "low", label: "compte parmi les communes qui perdent le plus d'habitants" },
  { pct: (c) => c.relief_proximite ?? null, dir: "high", label: "compte parmi les communes les plus proches du relief" },
];
const MONO_HI = 88;
const MONO_LO = 12;
// Trait distinctif d'une commune par rapport au national. Le percentile le plus
// extrême au-delà du seuil l'emporte. null = pas de trait assez marqué.
export function getCommuneDistinctive(c: IndexCommune): string | null {
  let best: { label: string; extremity: number } | null = null;
  for (const d of MONO_DISTINCTIVE) {
    const p = d.pct(c);
    if (p == null) continue;
    let extremity: number | null = null;
    if (d.dir === "high" && p >= MONO_HI) extremity = p;
    else if (d.dir === "low" && p <= MONO_LO) extremity = 100 - p;
    if (extremity == null) continue;
    if (!best || extremity > best.extremity) best = { label: d.label, extremity };
  }
  return best?.label ?? null;
}

// ════════════════════════════════════════════════════════════════════════════
// Explorer à partir d'une commune (ANCRAGE, pas similarité) — Pari #7.
// On dérive d'une commune-ancre des PRÉFÉRENCES NOMMÉES (signature distinctive +
// faits identitaires) que matchProjects consomme comme n'importe quel projet.
// Aucun score de similarité entre communes. N'hérite NI de la région NI du climat.
// ════════════════════════════════════════════════════════════════════════════

// Critères de « signature » candidats : traits de vie distinctifs, SANS climat (non
// hérité) ni géographie (pilotée par les zones explicites). Liste verrouillée au spec.
const SIGNATURE_KEYS: PreferenceKey[] = [
  "vie_locale", "calme_sonore", "nature", "mobilite_quotidienne",
  "acces_transports", "vie_etudiante", "croissance_demographique",
  "faible_exposition_industrielle",
];
const SIGNATURE_MIN = 70;      // percentile minimal pour qu'un trait « distingue » la commune
const SIGNATURE_MAX_KEYS = 4;  // 1 dominant (poids 3) + jusqu'à 3 secondaires (poids 2)
const ANCRE_COAST_KM = 15;     // au-delà, pas « au bord de la mer » (aligné sur buildSignature)
const ANCRE_SIZE_BAND = 2.5;   // gabarit : [pop/2.5, pop*2.5] autour de la taille d'agglo

// subScore mais SANS ses valeurs par défaut (donnée absente) : on n'invente pas une
// signature à partir d'un champ manquant. Dans subScore, calme_sonore/expo défaut=100,
// vie_locale/mobilite défaut=0 ; ici on les neutralise si la donnée brute manque.
function signatureScore(key: PreferenceKey, c: IndexCommune): number | null {
  switch (key) {
    case "calme_sonore": if (c.calmeSonore?.score == null) return null; break;
    case "faible_exposition_industrielle": if (c.expoIndustrielle?.score == null) return null; break;
    case "mobilite_quotidienne": if (c.reseauLocal?.acces == null) return null; break;
    case "vie_locale": if (c.vieLocale?.score == null) return null; break;
  }
  return subScore(key, c);
}

export type AnchorDerivation = {
  preferences: Preference[];
  communeSize: { min: number; max: number } | null;
  // Traits dérivés KEYÉS : phrase humaine == EXACTEMENT la préférence injectée (pour
  // la reformulation honnête) ET key, pour pouvoir retirer un trait dont le périmètre
  // explicite contredit la promesse (cf. perimeterAllowsCoast / proximite_mer).
  traits: { key: PreferenceKey; text: string }[];
};

// Dérivation déterministe d'UNE commune-ancre. Lit l'index déjà chargé (server-only) :
// l'appelant a résolu le label via resolveCommuneByName, donc loadIndex a tourné.
export function communeToPreferences(entry: IndexCommune): AnchorDerivation {
  const preferences: Preference[] = [];
  const traits: { key: PreferenceKey; text: string }[] = [];

  // 1) Signature distinctive : critères où la commune se distingue au national.
  const ranked = SIGNATURE_KEYS
    .map((key) => ({ key, s: signatureScore(key, entry) }))
    .filter((x): x is { key: PreferenceKey; s: number } => x.s != null && x.s >= SIGNATURE_MIN)
    .sort((a, b) => b.s - a.s)
    .slice(0, SIGNATURE_MAX_KEYS);
  ranked.forEach((x, i) => {
    preferences.push({ key: x.key, weight: i === 0 ? 3 : 2 });
    traits.push({ key: x.key, text: reasonText(x.key, entry) });
  });

  // 2) Faits identitaires évidents. Bord de mer -> proximite_mer (poids selon distance).
  if (entry.distance_cote_km != null && entry.distance_cote_km <= ANCRE_COAST_KM) {
    preferences.push({ key: "proximite_mer", weight: entry.distance_cote_km <= 5 ? 3 : 2 });
    traits.push({ key: "proximite_mer", text: reasonText("proximite_mer", entry) });
  }

  // 3) Gabarit de taille (taille d'AGGLOMÉRATION), fourchette large autour de l'ancre.
  const pop = tailleVille(entry);
  const communeSize = pop != null
    ? { min: Math.round(pop / ANCRE_SIZE_BAND), max: Math.round(pop * ANCRE_SIZE_BAND) }
    : null;

  return { preferences, communeSize, traits };
}

// Plusieurs ancres (« comme Brest ou Lorient ») -> INTERSECTION des signatures (ce que
// les ancres ont en COMMUN), poids = min (prudence), taille = fourchette englobante.
export function deriveAnchorPreferences(entries: IndexCommune[]): AnchorDerivation {
  if (entries.length === 0) return { preferences: [], communeSize: null, traits: [] };
  if (entries.length === 1) return communeToPreferences(entries[0]);

  const per = entries.map(communeToPreferences);
  const weightsByKey = new Map<PreferenceKey, number[]>();
  for (const d of per) {
    for (const p of d.preferences) {
      const arr = weightsByKey.get(p.key) ?? [];
      arr.push(p.weight);
      weightsByKey.set(p.key, arr);
    }
  }
  const preferences: Preference[] = [];
  const traits: { key: PreferenceKey; text: string }[] = [];
  for (const [key, weights] of weightsByKey) {
    if (weights.length !== entries.length) continue; // pas partagée par TOUTES les ancres
    preferences.push({ key, weight: Math.min(...weights) });
    traits.push({ key, text: reasonText(key, entries[0]) }); // trait partagé, phrasé sur la 1re ancre
  }
  const sizes = per
    .map((d) => d.communeSize)
    .filter((s): s is { min: number; max: number } => s != null);
  const communeSize = sizes.length
    ? { min: Math.min(...sizes.map((s) => s.min)), max: Math.max(...sizes.map((s) => s.max)) }
    : null;
  return { preferences, communeSize, traits };
}

// Résolution nom d'ancre -> entrée d'index (réutilise nameIndex partagé). Paris / Lyon /
// Marseille (index par arrondissement, absents de nameIndex) -> null : ancre ignorée (spec A.5).
export async function resolveCommuneByName(label: string): Promise<IndexCommune | null> {
  const key = normalizeName(label ?? "");
  if (!key) return null;
  const names = await nameIndex();
  return names.get(key) ?? null;
}

// Le périmètre dur (zones / départements explicites) peut-il livrer du littoral ? Sert à
// retirer le fait identitaire dérivé proximite_mer quand l'utilisateur a fixé une zone sans
// mer (« comme Brest mais en Auvergne ») : l'explicite écrase le dérivé, on ne nomme pas un
// trait que le périmètre ne peut pas tenir (honnêteté du signal). Data-driven : on regarde
// si une commune du périmètre est réellement côtière, plutôt qu'une liste de départements.
export async function perimeterAllowsCoast(hc: HardConstraints): Promise<boolean> {
  if (hc.excludeSea) return false;
  if (hc.nearSea?.active) return true;
  const zone = resolveZoneAnchors(hc.zones);
  const hardDepts = new Set<string>([
    ...(hc.departements ?? []),
    ...(zone.hardDepartements ?? []),
  ]);
  if (hardDepts.size === 0) return true; // aucun périmètre géographique dur -> littoral atteignable
  const communes = await loadIndex();
  return communes.some(
    (c) => hardDepts.has(c.dept) && c.distance_cote_km != null && c.distance_cote_km <= ANCRE_COAST_KM,
  );
}

// Suffixe de reformulation DÉTERMINISTE : nomme EXACTEMENT les traits dérivés de l'ancre.
// Jamais « similaire », jamais de score. Vouvoiement, pas de tiret cadratin.
export function anchorReformulationSuffix(anchorLabels: string[], traits: string[]): string {
  if (anchorLabels.length === 0) return "";
  const villes = listFr(anchorLabels);
  if (traits.length === 0) {
    return `Vous partez de ${villes}. Voici des communes à explorer dans cet esprit.`;
  }
  const objet = anchorLabels.length > 1 ? "ce que ces villes ont en commun" : `ce qui fait ${anchorLabels[0]}`;
  return `Vous aimez ${villes} pour ${listFr(traits)}. Voici des communes qui portent ${objet}.`;
}

// Paris / Lyon / Marseille : communes à arrondissements. L'index les stocke par arrondissement
// (75101.., 69381.., 13201..), pas par code commune, et nameIndex ne connaît donc pas « Lyon ».
// On résout ces 3 villes par alias direct : nom normalisé -> { uu, pop municipale INSEE }.
const PLM_VILLES: Record<string, { uu: string; pop: number }> = {
  paris: { uu: "00851", pop: 2_133_111 },
  lyon: { uu: "00760", pop: 522_250 },
  marseille: { uu: "00759", pop: 873_076 },
};

// Construit le MatchResult d'une commune à partir de l'index, hors champs RELATIFS au groupe
// (distinctive/compromis/decouverte/signaux, finalisés par les assign* après assemblage).
// `scoring` porte ce qui dépend du matching (score, reasons, compromis absolu) ; en mode
// « choix » (communes nommées, sans préférences) il est neutre. `littoralIndex` non-null
// active le récit d'érosion (intention littorale exprimée) ; null = silence.
function baseResult(
  c: IndexCommune,
  scoring: { compatibility: number; reasons: string[]; tradeoff: string | null },
  littoralIndex: Map<string, LittoralSummary> | null,
): MatchResult {
  return {
    insee: c.insee,
    nom: CITY_LABEL[cityKey(c.insee)] ?? c.nom,
    dept: c.dept,
    region: c.region,
    compatibility: scoring.compatibility,
    reasons: scoring.reasons,
    signature: buildSignature(c),
    identite: buildIdentiteCandidates(c)[0], // défaut ; unicité de groupe via assignIdentite
    tradeoff: scoring.tradeoff,
    compromis: "", // finalisé après assemblage (assignCompromis)
    decouverte: null, // finalisé après assemblage (assignDecouverte)
    // Narratif, hors score : note de pression climatique sur l'économie (ou null).
    pressionEco: c.pression_eco
      ? { palier: c.pression_eco.palier, note: pressionEcoNote(c.pression_eco) }
      : null,
    // Narratif, hors score : nuance climatique sur l'inondation (ou null/silence).
    climatInondation: buildClimatInondation(c),
    // Logement : note narrative qualitative (achat / location), hors score.
    logement: logementNote(c),
    // Littoral : renseigné seulement sur intention littorale + commune inscrite.
    littoral:
      littoralIndex?.get(String(c.insee).padStart(5, "0"))?.traitDeCote.concernee
        ? "exposée à l'érosion du littoral (la côte recule)"
        : null,
    distinctive: null, // renseigné après l'assemblage final (relatif au groupe affiché)
    // Évolution démographique : récit construit ici, gaté côté synthèse par « croissance demandée ».
    demographie: c.demographie?.recit ? (RECIT_DEMOGRAPHIE[c.demographie.recit] ?? null) : null,
    // Calme sonore : récit construit ici, gaté côté synthèse par « calme_sonore demandé ».
    calmeSonore: calmeSonoreRecit(c),
    // Exposition industrielle : récit construit ici, gaté côté synthèse par « critère demandé ».
    expoIndustrielle: expoIndustrielleRecit(c),
    heritageIndustriel: heritageRecit(c),
    signaux: {}, // rempli après l'assemblage final sur le groupe affiché (cf. assignSignaux)
    metrics: {
      distance_cote_km: c.distance_cote_km,
      population: c.population,
      jours_chauds_30: c.clim.NORTX30D_yr ?? null,
      temp_hiver: c.clim.NORTMm_seas_DJF ?? null,
      precip_annuelle: c.clim.NORRR_yr ?? null,
      ifm: c.clim.NORIFM40_yr ?? null,
    },
  };
}

// Entrée « mode choix » : le lecteur NOMME 2-3 communes (codes INSEE). Court-circuite
// matchProjects et les préférences — il n'y a ni score, ni tri, ni reasons, seulement la
// matrice d'arbitrages et les narratifs RELATIFS au groupe nommé. Renvoie le même couple
// { trio, comparaison } que consomme le path /ou-vivre, plus la liste des codes ignorés
// (hors index, dont PLM 75056/69123/13055 absents car l'index est par arrondissement).
// null si moins de 2 communes valides après filtrage. cf. arbitrages/comparateur-un-moteur-trois-portes.
export async function seedComparaison(
  insees: string[],
): Promise<{ trio: MatchResult[]; comparaison: ComparaisonComplete; ignores: string[] } | null> {
  const communes = await loadIndex();
  const byInsee = new Map(communes.map((c) => [c.insee, c]));
  // Chargé pour le trait distinctif (relatif au groupe, pertinent même hors intention) ; on
  // ne le passe PAS à baseResult (le récit d'érosion par carte reste gaté par l'intention,
  // que le mode choix n'exprime pas).
  const littoralIndex = await getLittoralIndex();

  // Dédoublonnage en préservant l'ordre nommé ; codes hors index écartés et signalés.
  const seen = new Set<string>();
  const picks: MatchResult[] = [];
  const ignores: string[] = [];
  for (const raw of insees) {
    const insee = String(raw).trim();
    if (!insee || seen.has(insee)) continue;
    seen.add(insee);
    const c = byInsee.get(insee);
    if (!c) { ignores.push(insee); continue; }
    // compatibility 0 = neutre, non affiché en mode choix (le lecteur a nommé les communes,
    // il n'y a pas de score de correspondance). Le matrice et les narratifs n'en dépendent pas.
    picks.push(baseResult(c, { compatibility: 0, reasons: [], tradeoff: null }, null));
    if (picks.length >= 3) break;
  }
  if (picks.length < 2) return null;

  // Narratifs RELATIFS au groupe nommé, comme le path /ou-vivre. Aucune préférence en mode
  // choix : requestedKeys vide, compromis absolu (tradeoffKey) nul partout.
  const requestedKeys = new Set<PreferenceKey>();
  const distinctiveMap = buildDistinctive(
    picks.map((r) => byInsee.get(r.insee)).filter((c): c is IndexCommune => c != null),
    littoralIndex,
  );
  for (const r of picks) r.distinctive = distinctiveMap[r.insee] ?? null;
  assignSignaux(picks, byInsee, requestedKeys);
  assignIdentite(picks, byInsee);
  assignCompromis(picks, byInsee, new Map(picks.map((r) => [r.insee, null])));
  assignDecouverte(picks, byInsee, requestedKeys);

  const comparaison = buildComparaisonComplete(picks, byInsee);
  return { trio: picks, comparaison, ignores };
}

export async function matchProjects(parsed: ParsedProject): Promise<MatchOutcome> {
  const communes = await loadIndex();
  await loadZeTable(); // nom + taille des bassins (signature + raison emploi graduée)

  const hc = parsed.hardConstraints ?? {};

  // nameIndex partagé : nearPlace (proximité), excludePlace (exclusion agglo), sizeRelativeTo (taille).
  const needNames =
    !!hc.nearPlace?.label || (hc.excludePlace?.length ?? 0) > 0 || !!hc.sizeRelativeTo?.label;
  const names = needNames ? await nameIndex() : null;

  // Résolution nearPlace (label → coords d'une commune de l'index)
  let placePoint: { lat: number; lon: number; maxKm: number } | null = null;
  if (hc.nearPlace?.label && names) {
    const hit = names.get(normalizeName(hc.nearPlace.label));
    if (hit) placePoint = { lat: hit.lat, lon: hit.lon, maxKm: hc.nearPlace.maxKm ?? 50 };
  }

  // Libellés de périmètre ville/taille effectivement appliqués (pour l'outcome, cf. Task 5).
  const appliedPlaces: string[] = [];

  // Exclusion de ville (« quitter {ville} ») par unité urbaine ; ville hors-UU → la commune seule.
  const excludeUU = new Set<string>();
  const excludeInsee = new Set<string>();
  for (const ep of hc.excludePlace ?? []) {
    const raw = ep?.label ?? "";
    const key = normalizeName(raw);
    if (!key) continue;
    const plm = PLM_VILLES[key];
    if (plm) {
      excludeUU.add(plm.uu);
      appliedPlaces.push(`exclusion de l'agglomération de ${raw}`);
      continue;
    }
    const hit = names?.get(key);
    if (!hit) continue; // ville inconnue : ignorée (pas de filtre, pas d'erreur)
    if (hit.uu) excludeUU.add(hit.uu);
    else excludeInsee.add(hit.insee);
    appliedPlaces.push(`exclusion de l'agglomération de ${raw}`);
  }

  // Taille relative (« plus petit/grand que {ville} ») → population communale de référence.
  if (hc.sizeRelativeTo?.label && names) {
    const raw = hc.sizeRelativeTo.label;
    const key = normalizeName(raw);
    // Référence en TAILLE D'AGGLOMÉRATION : pop d'UU (PLM via leur UU parente ; sinon
    // tailleVille de la commune de référence). Corrige la limite B (comparaison communale).
    const plm = PLM_VILLES[key];
    const refHit = names.get(key);
    const refPop = plm
      ? uuPopCache?.get(plm.uu) ?? null
      : refHit
        ? tailleVille(refHit)
        : null;
    if (refPop != null) {
      const cs = hc.communeSize ?? {};
      // Bornes STRICTEMENT exclusives : « plus petit que Lyon » exclut l'agglo lyonnaise
      // elle-même (taille d'UU égale), pas seulement ce qui la dépasse.
      if (hc.sizeRelativeTo.direction === "smaller") {
        cs.max = Math.min(cs.max ?? Infinity, refPop - 1);
        appliedPlaces.push(`communes plus petites que ${raw}`);
      } else {
        cs.min = Math.max(cs.min ?? 0, refPop + 1);
        appliedPlaces.push(`communes plus grandes que ${raw}`);
      }
      hc.communeSize = cs;
    }
  }

  // Ancres géographiques : résolution jeton → départements avec gradient de force.
  // hard → périmètre dur (intersection) ; preferred / inspiration → bonus de score.
  // Le moteur détient la table ; le parse n'a fourni que des jetons et leur force.
  const zone = resolveZoneAnchors(hc.zones);
  const exclusion = resolveExclusions(hc.excludeZones);
  const montagne = hc.montagne ?? null;
  const reliefProche = hc.reliefProche ?? null;

  // Signal littoral (narratif, hors score) : on ne charge l'index et on ne
  // renseigne le champ QUE si une intention littorale est exprimée. Sinon, silence.
  const coastalIntent = hasCoastalIntent(parsed);
  const littoralIndex = coastalIntent ? await getLittoralIndex() : null;

  // Ancres PRÉFÉRÉES (zones + montagne + relief) : servent au prédicat d'étalement
  // échelonné. inspiration n'en fait pas partie (son penchant léger passe par le score).
  const preferredDepts = new Set<string>();
  for (const sz of zone.soft) {
    if (sz.strength === "preferred") for (const d of sz.departements) preferredDepts.add(d);
  }
  const montagnePreferred = montagne?.strength === "preferred";
  const reliefPreferred = reliefProche?.strength === "preferred";
  const anyPreferred = preferredDepts.size > 0 || montagnePreferred || reliefPreferred;

  const prefs: (Preference & { baseline?: boolean })[] = parsed.preferences
    .filter((p) => PREFERENCE_KEYS.includes(p.key))
    .map((p) => ({ key: p.key, weight: clamp(Math.round(p.weight) || 1, 1, 3) }));

  // Plancher de réalisme (baseline de viabilité), cf. checkpoint 2026-06-01 :
  //  - emploi signalé (préférence) OU projet hors-emploi → plancher classique sur
  //    eviter_isolement (poids 1) ; l'emploi ne pèse pas en plus en implicite.
  //  - emploi non mentionné → on PARTAGE ce budget de 1 entre isolement et bassin
  //    (0,5 + 0,5) : plancher bassin-conscient, budget de viabilité implicite
  //    INCHANGÉ vs V1, pas de préférence universelle ajoutée.
  //  - si l'utilisateur a explicitement demandé eviter_isolement, le plancher est
  //    déjà exprimé : on n'ajoute aucune baseline.
  const hasIsolement = prefs.some((p) => p.key === "eviter_isolement");
  const hasEmploi = prefs.some((p) => p.key === "viabilite_emploi"); // signalé par le parse
  const horsEmploi = parsed.emploiHorsSujet === true;
  if (hasEmploi || horsEmploi) {
    if (!hasIsolement) prefs.push({ key: "eviter_isolement", weight: VIABILITY_BASELINE_W, baseline: true });
  } else if (!hasIsolement) {
    prefs.push({ key: "eviter_isolement", weight: VIABILITY_BASELINE_SPLIT, baseline: true });
    prefs.push({ key: "viabilite_emploi", weight: VIABILITY_BASELINE_SPLIT, baseline: true });
  }
  const totalW = prefs.reduce((s, p) => s + p.weight, 0) || 1;

  const candidates = communes.filter((c) =>
    passesHard(c, hc, placePoint, zone.hardDepartements, exclusion.departements, excludeUU, excludeInsee),
  );

  type Sub = { key: PreferenceKey; weight: number; baseline?: boolean; s: number };
  const scored = candidates.map((c) => {
    const subs: Sub[] = [];
    for (const p of prefs) {
      const s = subScore(p.key, c);
      if (s != null) subs.push({ key: p.key, weight: p.weight, baseline: p.baseline, s });
    }
    // Score de base (préférences), puis bonus d'ancre souple (preferred / inspiration).
    // On garde le score brut (non plafonné) pour le tri : sinon, quand les grandes
    // villes saturent déjà à 100, le clamp écrase le bonus et l'ancre préférée ne
    // départage plus. Le score affiché reste borné à 100.
    const base = subs.reduce((s, x) => s + x.weight * x.s, 0) / totalW;
    // Bonus d'ancre souple. Au sein d'un axe : max (sémantique OU, ex. « Atlantique
    // ou Sud-Ouest »). Entre axes orthogonaux (zone vs altitude) : somme bornée, pour
    // que l'intersection (« le Sud-Ouest ET en altitude ») prime sans filtrer.
    // Montagne (altitude propre) et relief (massif à portée) sont le MÊME axe : on
    // prend le max, pas la somme (sinon double comptage si les deux sont posés).
    const mountainBonus = Math.max(
      montagneBonus(c.altitude, montagne?.strength),
      reliefBonus(c.relief_proximite, reliefProche?.strength),
    );
    const soft = Math.min(SOFT_BONUS_CAP, softZoneBonus(c.dept, zone.soft) + mountainBonus);
    const rawScore = base + soft;
    const compatibility = clamp(Math.round(rawScore), 0, 100);
    // « In-zone » pour l'étalement échelonné. Quand zone ET montagne sont toutes
    // deux préférées, le cœur dominant est l'INTERSECTION (« le Sud-Ouest ET en
    // altitude »), pas l'union : sinon les grandes villes de plaine de la zone
    // écraseraient l'altitude. Sinon, critère unique (zone seule, ou montagne seule).
    const inZoneDept = preferredDepts.has(c.dept);
    // Cœur « montagne » : soit en altitude (montagne), soit un massif à portée
    // (relief). Les deux sont le même axe pour l'étalement.
    const mountainPref =
      (montagnePreferred && (montagnosite(c.altitude) ?? 0) >= 50) ||
      (reliefPreferred && (c.relief_proximite ?? 0) >= RELIEF_PROCHE_HARD);
    const anyMountainPreferred = montagnePreferred || reliefPreferred;
    const pref =
      preferredDepts.size > 0 && anyMountainPreferred
        ? inZoneDept && mountainPref
        : inZoneDept || mountainPref;
    const visible = subs.filter((x) => !x.baseline);
    const ranked = [...visible].sort((a, b) => b.weight * b.s - a.weight * a.s);
    let reasons = ranked.slice(0, 3).filter((x) => x.s >= 55).map((x) => reasonText(x.key, c));
    // Garantie : une carte ne doit jamais paraître vide ou « pas finie ». Si aucun
    // aspect ne dépasse le seuil de saillance, on montre quand même les 1 à 2
    // meilleurs aspects relatifs (ce qui explique pourquoi la commune ressort), sans
    // le seuil. Le tri reste honnête, on ne fabrique pas une raison qui n'existe pas.
    if (reasons.length === 0) reasons = ranked.slice(0, 2).map((x) => reasonText(x.key, c));
    const worst = [...visible].sort((a, b) => a.weight * a.s - b.weight * b.s)[0];
    const tradeoffKey: PreferenceKey | null = worst && worst.s < 50 ? worst.key : null;
    const tradeoff = tradeoffKey ? REASON_NEG[tradeoffKey] : null;
    return {
      cityKey: cityKey(c.insee),
      sortScore: rawScore,
      pref,
      // Clé du compromis absolu (pref demandée scorant < 50), conservée pour l'unicité
      // par dimension dans le trio (assignCompromis). null = pas de faiblesse absolue.
      tradeoffKey,
      result: baseResult(c, { compatibility, reasons, tradeoff }, littoralIndex),
    };
  });

  // Tri sur le score brut (bonus d'ancre souple inclus, non plafonné) : le n°1
  // reste le meilleur, et une ancre préférée départage à saturation.
  scored.sort((a, b) => b.sortScore - a.sortScore);

  const TARGET = 5;
  const DISPLAY = 3; // cartes réellement affichées (le client tranche à 3)

  // Rollup big-3 : une seule entrée par ville mère (la meilleure, déjà en tête).
  const seenCity = new Set<string>();
  const unique = scored.filter((s) => {
    if (seenCity.has(s.cityKey)) return false;
    seenCity.add(s.cityKey);
    return true;
  });

  const seenRegion = new Set<string>();
  const seenDept = new Set<string>();
  const deduped: MatchResult[] = [];
  const pushPick = (r: MatchResult) => {
    seenRegion.add(r.region ?? r.dept);
    seenDept.add(r.dept);
    deduped.push(r);
  };

  if (anyPreferred) {
    // Étalement ÉCHELONNÉ (ancre préférée : zone OU montagne) : la zone préférée
    // domine, avec UNE seule ouverture hors zone, au dernier rang affiché pour
    // rester visible sans la noyer. Distingue preferred (2 in-zone + 1 ouverture sur
    // 3 cartes) de hard (3 in-zone) et d'inspiration (diversité). cf. ANCRES.
    const zSeen = new Set<string>();
    const zonePicks: MatchResult[] = [];
    for (const s of unique) {
      if (!s.pref || zSeen.has(s.result.dept)) continue;
      zSeen.add(s.result.dept);
      zonePicks.push(s.result);
    }
    const alt = unique.find((s) => !s.pref && !zSeen.has(s.result.dept))?.result ?? null;
    for (const r of zonePicks.slice(0, DISPLAY - 1)) pushPick(r);
    if (alt) pushPick(alt);
    for (const r of zonePicks) {
      if (deduped.length >= TARGET) break;
      if (!deduped.includes(r)) pushPick(r);
    }
    for (const s of unique) {
      if (deduped.length >= TARGET) break;
      if (!deduped.includes(s.result)) pushPick(s.result);
    }
  } else {
    // Étalement géographique standard (dégel diversité, 2026-05-31) : meilleure par
    // région, puis départements encore absents, puis sans contrainte. Le n°1 reste le
    // meilleur score (bonus inspiration inclus) ; les suivants favorisent des
    // territoires réellement différents (cf. OU_VIVRE_ROADMAP.md).
    for (const s of unique) {
      if (deduped.length >= TARGET) break;
      if (seenRegion.has(s.result.region ?? s.result.dept)) continue;
      pushPick(s.result);
    }
    for (const s of unique) {
      if (deduped.length >= TARGET) break;
      if (deduped.includes(s.result) || seenDept.has(s.result.dept)) continue;
      pushPick(s.result);
    }
    for (const s of unique) {
      if (deduped.length >= TARGET) break;
      if (deduped.includes(s.result)) continue;
      pushPick(s.result);
    }
  }

  const best = deduped[0]?.compatibility ?? 0;
  const perfect = candidates.length > 0 && best >= PERFECT_THRESHOLD;

  // Sur-contrainte : quand les ancres en filtre vident le vivier, on le DIT en
  // nommant le périmètre, sans relâcher automatiquement ni inventer de résultat
  // (cf. ANCRES_GEOGRAPHIQUES.md, choix V1 « détecter et le dire »).
  // Montagne intégrée aux ancres appliquées (libellé + convention + force), pour
  // l'affichage et la synthèse, exactement comme une zone.
  const montagneApplied: AppliedZone[] = montagne
    ? [{
        label: "la montagne",
        convention: "communes de montagne, à partir d'environ 600 m d'altitude",
        strength: montagne.strength,
      }]
    : [];
  const appliedZones = [...zone.applied, ...montagneApplied];

  // Seules les ancres DURES (et les exclusions) peuvent vider le vivier : ce sont
  // elles qu'on nomme. Les ancres souples ne filtrent pas.
  const anchorLabels = [
    ...appliedZones.filter((z) => z.strength === "hard"),
    ...exclusion.applied,
  ].map((z) => z.label);
  const emptyMessage =
    anchorLabels.length > 0
      ? `Aucun territoire ne réunit l'ensemble de vos critères dans ${listFr(anchorLabels)}. Essayez d'élargir le périmètre ou un autre critère.`
      : "Aucun territoire ne respecte l'ensemble de vos contraintes. Essayez d'élargir un critère.";
  const message =
    candidates.length === 0
      ? emptyMessage
      : perfect
        ? null
        : "Aucun territoire ne réunit l'ensemble de vos critères. Voici ceux qui impliquent le moins de compromis.";

  // Trait distinctif (narratif, hors score) sur les seules communes AFFICHÉES, relatif
  // au groupe. Le moteur a accès à tous les sous-scores ; on charge l'index littoral ici
  // si besoin (pour « le littoral le moins exposé », même hors intention littorale).
  const liDistinct = littoralIndex ?? (await getLittoralIndex());
  const byInsee = new Map(communes.map((c) => [c.insee, c]));
  const shownPicks = deduped.slice(0, DISPLAY);
  const distinctiveMap = buildDistinctive(
    shownPicks.map((r) => byInsee.get(r.insee)).filter((c): c is IndexCommune => c != null),
    liDistinct,
  );
  for (const r of shownPicks) r.distinctive = distinctiveMap[r.insee] ?? null;

  // Signaux ambiants (narratif, hors score) sur le groupe affiché. requestedKeys = clés
  // EXPLICITEMENT demandées (hors baseline auto) : un critère pesé n'est pas redondé ici,
  // sa raison le porte déjà. byInsee est déjà construit ci-dessus pour le trait distinctif.
  const requestedKeys = new Set<PreferenceKey>(
    parsed.preferences.filter((p) => PREFERENCE_KEYS.includes(p.key)).map((p) => p.key),
  );
  // Clés de compromis absolu par commune (faiblesse demandée scorant < 50), pour
  // l'unicité par dimension dans le trio (cf. assignCompromis).
  const tradeoffKeyByInsee = new Map<string, PreferenceKey | null>(
    scored.map((s) => [s.result.insee, s.tradeoffKey]),
  );
  assignSignaux(shownPicks, byInsee, requestedKeys);
  assignIdentite(shownPicks, byInsee);
  assignCompromis(shownPicks, byInsee, tradeoffKeyByInsee);
  assignDecouverte(shownPicks, byInsee, requestedKeys);

  // Pistes : rangs 4-5-6, narratif calculé comme un groupe de 3 distinct (le trio
  // garde son narratif relatif au groupe de 3 affiché). byInsee couvre déjà tous
  // les candidats. Cartes seulement : pas de comparaison complète sur les pistes.
  const pistesPicks = deduped.slice(3, 6);
  if (pistesPicks.length) {
    const pistesDistinctive = buildDistinctive(
      pistesPicks.map((r) => byInsee.get(r.insee)).filter((c): c is IndexCommune => c != null),
      liDistinct,
    );
    for (const r of pistesPicks) r.distinctive = pistesDistinctive[r.insee] ?? null;
    assignSignaux(pistesPicks, byInsee, requestedKeys);
    assignIdentite(pistesPicks, byInsee);
    assignCompromis(pistesPicks, byInsee, tradeoffKeyByInsee);
    assignDecouverte(pistesPicks, byInsee, requestedKeys);
  }

  const comparaisonComplete = buildComparaisonComplete(shownPicks, byInsee);

  return {
    perfectMatch: perfect,
    bestCompatibility: best,
    candidates: candidates.length,
    message,
    results: deduped,
    comparaisonComplete,
    pistes: pistesPicks,
    appliedZones,
    appliedExclusions: exclusion.applied,
    appliedPlaces: appliedPlaces.length ? appliedPlaces : undefined,
  };
}

// Aperçu tronqué de la comparaison complète : on ne garde que les 2 premiers thèmes,
// pour le teaser de la page de conviction. Le complet n'a aucun endpoint d'API.
export function truncateComparaison(cc: ComparaisonComplete): ComparaisonComplete {
  return {
    resume: cc.resume.slice(0, 1),
    arbitrage: cc.arbitrage,
    spatialContext: cc.spatialContext,
    divergence: cc.divergence,
    themes: cc.themes.slice(0, 2),
  };
}
