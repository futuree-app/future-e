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
  "ensoleillement_recherche",  // été chaud + peu de pluie (proxy soleil)
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
  // Notions exprimées par l'utilisateur SANS critère dans le moteur (écoles, vie
  // culturelle, caractère affectif). Pur affichage honnête au gate, aucun impact
  // sur le score. cf. plan 2026-06-03 (constat QA : ces notions étaient avalées en silence).
  horsMesure?: { term: string; kind: HorsMesureKind }[];
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

export type MatchOutcome = {
  perfectMatch: boolean;
  bestCompatibility: number;
  candidates: number;
  message: string | null;
  results: MatchResult[];
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
type IndexCommune = {
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
    case "ensoleillement_recherche": {
      const summer = c.pct.NORTMm_seas_JJA;
      if (summer == null) return null;
      const dry = c.pct.NORRR_yr == null ? 50 : 100 - c.pct.NORRR_yr;
      return Math.round(0.45 * summer + 0.55 * dry);
    }
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
      r.compromis = "Le bon compromis des trois, sans faiblesse marquée.";
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
  ensoleillement_recherche: "plus chaud et plus sec, ensoleillé",
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
  ensoleillement_recherche: "climat plus frais et humide",
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

// Paris / Lyon / Marseille : communes à arrondissements. L'index les stocke par arrondissement
// (75101.., 69381.., 13201..), pas par code commune, et nameIndex ne connaît donc pas « Lyon ».
// On résout ces 3 villes par alias direct : nom normalisé -> { uu, pop municipale INSEE }.
const PLM_VILLES: Record<string, { uu: string; pop: number }> = {
  paris: { uu: "00851", pop: 2_133_111 },
  lyon: { uu: "00760", pop: 522_250 },
  marseille: { uu: "00759", pop: 873_076 },
};

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
      result: {
        insee: c.insee,
        nom: CITY_LABEL[cityKey(c.insee)] ?? c.nom,
        dept: c.dept,
        region: c.region,
        compatibility,
        reasons,
        signature: buildSignature(c),
        identite: buildIdentiteCandidates(c)[0], // défaut ; unicité de groupe via assignIdentite
        tradeoff,
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
        // Évolution démographique : récit construit ici (comme climatInondation), gaté à
        // l'affichage côté synthèse par « croissance_demographique demandée ».
        demographie: c.demographie?.recit ? (RECIT_DEMOGRAPHIE[c.demographie.recit] ?? null) : null,
        // Calme sonore : récit construit ici, gaté côté synthèse par « calme_sonore demandé ».
        calmeSonore: calmeSonoreRecit(c),
        // Exposition industrielle : récit construit ici, gaté côté synthèse par « critère demandé ».
        expoIndustrielle: expoIndustrielleRecit(c),
        signaux: {}, // rempli après l'assemblage final sur le groupe affiché (cf. assignSignaux)
        metrics: {
          distance_cote_km: c.distance_cote_km,
          population: c.population,
          jours_chauds_30: c.clim.NORTX30D_yr ?? null,
          temp_hiver: c.clim.NORTMm_seas_DJF ?? null,
          precip_annuelle: c.clim.NORRR_yr ?? null,
          ifm: c.clim.NORIFM40_yr ?? null,
        },
      } as MatchResult,
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

  return {
    perfectMatch: perfect,
    bestCompatibility: best,
    candidates: candidates.length,
    message,
    results: deduped,
    appliedZones,
    appliedExclusions: exclusion.applied,
    appliedPlaces: appliedPlaces.length ? appliedPlaces : undefined,
  };
}
