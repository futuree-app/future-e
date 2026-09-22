import type { LngLat } from "./geo-distance.ts";
import type { PermisRetenu } from "./sitadel-selection.ts";

// Foyer canonique de TOUS les types partagés Face 3 (évite les imports en avant entre libs).

export type Face3Cat = "sante" | "alimentation" | "education" | "transports" | "services";
export type Posture = "residence" | "prospection";

/**
 * UN LIEU RECENSÉ PAR LA BPE, pas un établissement.
 *
 * ── POURQUOI LA DISTINCTION (premier test réel, 16/08/2026) ──────────────────────────────────
 * La BPE recense des établissements : au 6 Grande Rue à Ciré-d'Aunis, elle en porte DEUX pour la
 * même boulangerie physique, l'ancienne enseigne et la nouvelle, au même point, dans le millésime
 * 2024 comme dans le 2025. Les shards regroupent donc les enregistrements en LIEUX
 * (`grouper_lieux`, scripts/populate-bpe.py) : c'est ce qui empêche l'ordre des lignes du parquet
 * de décider quelle enseigne s'affiche, et le comptage « à portée de pas » d'annoncer un choix qui
 * n'existe pas.
 *
 * ── TOUS LES CHAMPS D'IDENTITÉ SONT OPTIONNELS, ET ILS DOIVENT LE RESTER ─────────────────────
 * Les shards d'avant le 17/08/2026 ne portent que `c`, `t`, `lat`, `lon`. Absent veut dire « ce
 * millésime ne le disait pas », jamais « cet équipement n'a pas de nom ».
 */
export type BpePoint = {
  c: Face3Cat; t: string; lat: number; lon: number;
  /** Nom de l'établissement, SEULEMENT quand un seul est recensé sur ce lieu. */
  n?: string;
  /** Adresse postale telle que la BPE la porte (capitales d'origine). */
  a?: string;
  /** SIRET : l'identifiant source stable, quand il existe et qu'un seul établissement est recensé. */
  i?: string;
  /** Nombre d'enregistrements sur ce lieu, écrit SEULEMENT s'il est supérieur à 1. */
  x?: number;
  /** Les enregistrements sources, conservés POUR L'AUDIT. Jamais affichés, jamais transportés. */
  s?: { n?: string; i?: string }[];
};
/**
 * LE RAYON « À PORTÉE DE PAS » : 500 m à vol d'oiseau, six à sept minutes de marche.
 *
 * Défini ICI, dans le contrat partagé, parce que deux endroits s'en servent : le comptage des
 * équipements (`nearestByCategory`) et la conclusion du module (`decision/autour-conclusion.ts`).
 * Deux constantes pour un même seuil finiraient par diverger, et l'écran dirait alors « 3 à moins
 * de 500 m » sous une phrase qui parle d'un autre périmètre.
 */
export const BPE_WALK_RADIUS_M = 500;

/**
 * L'IDENTITÉ DU LIEU LE PLUS PROCHE, telle que le snapshot la fige.
 *
 * `nom` absent + `exploitants` > 1 = plusieurs établissements recensés sur ce lieu : le produit ne
 * choisit pas, il le dit. `nom` et `exploitants` tous deux absents = snapshot antérieur au
 * 17/08/2026, qui ne portait que le type et la distance.
 *
 * La liste des exploitants ne descend PAS jusqu'ici : elle vit dans `data/bpe-points`, où un audit
 * la trouve. L'écran n'en a pas l'usage, et le nom d'un professionnel de santé n'a pas à voyager
 * dans un dossier pour n'être jamais affiché.
 */
export type BpeNearestIdentity = {
  nom?: string;
  adresse?: string;
  identifiant?: string;
  exploitants?: number;
};

export type BpeNearest = {
  category: Face3Cat;
  nearest: ({ distanceMeters: number; typeLabel: string | null } & BpeNearestIdentity) | null;
  searchCapMeters: number;
  /**
   * Combien de LIEUX de cette catégorie dans `BPE_WALK_RADIUS_M`.
   *
   * DES LIEUX, PAS DES ÉTABLISSEMENTS (17/08/2026). Deux enseignes successives au même point ne
   * font pas deux boulangeries, et quatre médecins dans un même cabinet ne font pas quatre
   * endroits où aller. Ce compte dit « avoir le choix » : il ne le dirait plus s'il additionnait
   * des enregistrements administratifs.
   *
   * OPTIONNEL, ET IL DOIT LE RESTER. Les snapshots sont figés à leur création : ceux d'avant le
   * 01/08/2026 ne portent pas ce champ, et un dossier ancien ne doit pas afficher « 0 à moins de
   * 500 m » là où le comptage n'a simplement jamais eu lieu. Absent veut dire « non compté »,
   * jamais « aucun ».
   */
  withinWalkCount?: number;
  /**
   * LE PLUS PROCHE DE CHAQUE TYPE, et non plus seulement de la catégorie (22/09/2026).
   *
   * ── CE QUE `nearest` SEUL EFFAÇAIT ─────────────────────────────────────────────────────────
   * Une catégorie mélange des types qui ne répondent pas au même besoin. Une pharmacie à 150 m
   * masquait un médecin généraliste à 900 m : le dossier d'un lecteur qui a déclaré l'accès aux
   * soins racontait la pharmacie et taisait le médecin. Même effacement sur les écoles (une
   * maternelle cache un élémentaire) et sur les transports (une halte cache une gare).
   *
   * La clé est le CODE TYPEQU (`D265`), jamais son libellé : le libellé peut être réécrit sans
   * régénérer les snapshots, et deux codes partagent « Gare ».
   *
   * OPTIONNEL, ET IL DOIT LE RESTER, pour la même raison que `withinWalkCount` : les snapshots
   * sont figés à leur création. Un dossier ouvert avant cette date ne le porte pas, et la lecture
   * retombe alors sur `nearest` seul. Absent veut dire « non ventilé », jamais « aucun ».
   */
  nearestByType?: Record<string, { distanceMeters: number; typeLabel: string | null } & BpeNearestIdentity>;
};

// Libellé FR précis par code TYPEQU. Nature de chaque code confirmée sur les noms d'établissement
// réels (NOMRS) le 2026-07-03 (BPE24) ; les seize codes existent à l'identique dans la BPE 2025,
// vérifié le 17/08/2026 avant la bascule des shards. Le rapport affiche ce type précis
// (« Pharmacie », « Boulangerie ») plutôt que la seule famille abstraite. Modifier le
// libellé ici ne demande PAS de régénérer les shards (les shards ne portent que le code).
export const TYPEQU_LABEL: Record<string, string> = {
  // Santé
  D265: "Médecin généraliste",
  D307: "Pharmacie",
  // Alimentation
  B105: "Supermarché",
  B201: "Supérette",
  B202: "Épicerie",
  B204: "Boucherie-charcuterie",
  B207: "Boulangerie",
  B208: "Primeur",
  // Éducation
  C107: "École maternelle",
  C108: "École primaire",
  C109: "École élémentaire",
  // Transports
  E107: "Gare",
  E108: "Gare",
  E109: "Halte ferroviaire",
  // Services essentiels
  A203: "Banque",
  A206: "Bureau de poste",
};

// LE GENRE DE CHAQUE LIBELLÉ, parce qu'une phrase française a besoin d'un article.
//
// Le dossier de décision écrivait « Autour de cette adresse, médecin généraliste est recensé » :
// le libellé était repris tel quel, sans article, et la phrase boitait. Le genre ne se devine pas
// d'une terminaison (« primeur » est masculin, « boulangerie » féminine, « halte » féminine) et il
// n'est nulle part dans la BPE, qui ne livre qu'un code.
//
// LA CLÉ EST LE LIBELLÉ, ET NON LE CODE : c'est le libellé que le snapshot fige et que les faits
// transportent, le code ne voyage pas jusque-là. Deux codes rendent « Gare », une seule entrée
// suffit donc à les servir.
//
// La table vit ICI, collée aux libellés : un libellé ajouté sans son genre est une omission que
// le test refuse, plutôt qu'une faute de langue découverte à l'écran.
const GENRE_PAR_LIBELLE: Record<string, "m" | "f"> = {
  "Médecin généraliste": "m",
  "Pharmacie": "f",
  "Supermarché": "m",
  "Supérette": "f",
  "Épicerie": "f",
  "Boucherie-charcuterie": "f",
  "Boulangerie": "f",
  "Primeur": "m",
  "École maternelle": "f",
  "École primaire": "f",
  "École élémentaire": "f",
  "Gare": "f",
  "Halte ferroviaire": "f",
  "Banque": "f",
  "Bureau de poste": "m",
};

/** Les libellés dont le genre est déclaré. Sert au test qui garde la table alignée. */
export const LIBELLES_AVEC_GENRE = GENRE_PAR_LIBELLE;

/**
 * « un médecin généraliste », « une pharmacie ».
 *
 * Repli masculin sur un libellé inconnu : la phrase reste lisible, et le test empêche qu'un
 * libellé du produit y tombe.
 */
export function avecArticle(libelle: string): string {
  return `${GENRE_PAR_LIBELLE[libelle] === "f" ? "une" : "un"} ${libelle.toLowerCase()}`;
}

// Nature de l'espace vert cartographié (tag OSM conservé pour préciser « parc / bois / … »
// plutôt qu'un « espace vert » générique). Optionnel : les snapshots antérieurs ne l'ont pas.
// `recreation_ground` N'EST PLUS COLLECTÉ depuis le 20/09/2026 : un terrain de loisirs peut être
// entièrement minéral (city-stade, boulodrome), et il répondait « espace vert le plus proche ».
// La valeur RESTE dans ce type : les snapshots figés avant cette date la portent encore, et un
// libellé manquant afficherait un vide à leur place.
/** Un espace vert cartographié : ce qu'il est, où il est, et sa taille quand elle est mesurable. */
export type EspaceVert = {
  distanceMeters: number;
  kind?: GreenKind;
  areaM2?: number;
  /** Le nom cartographié. Absent sur la plupart des petites surfaces, présent sur les grandes. */
  name?: string;
};

export type GreenKind = "park" | "wood" | "forest" | "grass" | "recreation_ground";

export type OsmProximity = {
  potentiallyNoisyInfrastructure: { type: "motorway" | "trunk" | "railway"; distanceMeters: number }[];
  /**
   * `areaM2` est OPTIONNEL, et son absence a un sens : la géométrie n'était pas fermée, donc sa
   * surface n'a pas pu être mesurée. Les snapshots figés avant le 20/09/2026 ne la portent pas
   * non plus. Dans les deux cas l'écran affiche la distance seule, jamais une surface supposée.
   */
  nearestMappedGreenSpace: EspaceVert | null;
  /**
   * LE GRAND ESPACE QUI VAUT LE DÉPLACEMENT (20/09/2026), quand il en existe un.
   *
   * « Le plus proche » répond au besoin de sortir cinq minutes ; celui-ci à celui d'aller passer
   * un dimanche. Un square de 900 m² à 35 m masquait le parc Charruyer, 25 ha à 222 m, que
   * n'importe quel Rochelais citerait en premier.
   *
   * `null` quand aucun candidat n'apprend rien de plus, ce qui est le cas le plus fréquent : trois
   * adresses sur quatre dans la calibration. Absent des snapshots figés avant cette date, d'où
   * l'optionnalité.
   */
  largerGreenSpaceNearby?: EspaceVert | null;
  bboxRadiusMeters: number;
};

// Signal îlot de chaleur urbain du quartier (CSTB, grain grand-IRIS). null si l'adresse n'est pas
// dans une commune couverte (596) ou si la résolution IRIS a échoué : dans les deux cas le bloc
// « Chaleur autour du logement » n'apparaît pas (jamais de « non renseigné »). iuhi = °C.
export type IcuSnapshot = { iuhi: number; level: "marque" | "present" } | null;

/**
 * LES AUTORISATIONS D'URBANISME AUTOUR DE L'ADRESSE, GELÉES AVEC LEUR PÉRIMÈTRE.
 *
 * Le rayon, la fenêtre d'ancienneté et l'année de référence sont écrits ICI, à côté des permis
 * qu'ils ont sélectionnés, et jamais relus depuis les constantes du jour. Le jour où le rayon
 * change, un dossier ancien doit continuer de décrire ce qui a réellement servi à le construire :
 * une phrase bâtie sur la constante courante raconterait un périmètre que ces permis n'ont pas
 * connu.
 *
 * `consulteLe` est affiché. Le registre national est mensuel et un dossier se relit des mois
 * après sa création : sans la date de consultation, le lecteur ne peut pas savoir de quand date
 * ce qu'il lit.
 */
export type PermisSnapshot = {
  /** Du plus récent au plus ancien. Vide veut dire CONSULTÉ ET RIEN TROUVÉ, jamais « non su ». */
  permis: PermisRetenu[];
  rayonMeters: number;
  ancienneteMaxAns: number;
  /** L'année qui a servi de référence à la fenêtre d'ancienneté. */
  anneeReference: number;
  /** ISO 8601. */
  consulteLe: string;
};

export type Face3Snapshot = {
  center: LngLat;
  bpe: { categories: BpeNearest[] };
  osm: OsmProximity;
  icu?: IcuSnapshot;
  /**
   * OPTIONNEL, ET IL DOIT LE RESTER. Absent veut dire « le registre n'a pas été consulté » : les
   * snapshots figés avant le 01/08/2026 ne portent pas ce champ, et une panne de l'API en cours
   * d'analyse le laisse absent. Dans les deux cas le bloc DISPARAÎT, au lieu d'annoncer une
   * absence de permis qui n'a jamais été établie.
   */
  permis?: PermisSnapshot;
  sourceStatus: {
    bpe: "complete" | "failed";
    osmInfrastructure: "complete" | "pending" | "failed";
    osmGreenSpaces: "complete" | "pending" | "failed";
  };
  /**
   * `bpeVersion` porte la version du SNAPSHOT (`SOURCES_VERSION`), pas le millésime de la BPE :
   * le nom est trompeur, il est conservé pour ne pas invalider les snapshots figés.
   *
   * `bpeMillesime` est le millésime réel, lu dans les shards eux-mêmes. Il est OPTIONNEL : les
   * snapshots figés avant le 17/08/2026 ne le portent pas, et l'écran affichait alors « BPE 2024 »
   * écrit en dur dans le composant, ce qui était précisément la dette de fraîcheur relevée le
   * 16/08 (JL-11). Absent = millésime non su, jamais un millésime supposé.
   */
  sources: { bpeVersion: string; osmFetchedAt: string | null; osmQueryVersion: string; bpeMillesime?: string };
  sourcesVersion: string;
  computedAt: string;
};

export const FACE3_CATS: Face3Cat[] = ["sante", "alimentation", "education", "transports", "services"];
export const BPE_CAP_M = 3000; // cap de recherche v1 (commun). Affinable par famille plus tard.
