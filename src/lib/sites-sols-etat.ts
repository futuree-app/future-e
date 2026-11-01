// L'ÉTAT D'UNE LECTURE DES SOLS POLLUÉS AU TERRAIN (FUT-157). Types et règles de lecture, SANS dépendance :
// l'écran (rendu côté client) et la couverture du module les lisent sans embarquer le calcul géométrique
// (Clipper), qui vit dans `sites-sols-terrain.ts` et ne s'exécute que côté serveur. Même découpage que
// `urbanisme-nomenclature.ts` (FUT-81).

/** Version de la règle de lecture, gravée dans chaque lecture enregistrée. */
// `fut157-2026-10-31` (contre-revue) : une intersection positive de moins de 0,05 m² n'est plus supprimée, et le
// point de l'adresse ne démontre le terrain que dans la parcelle attribuée. Une lecture enregistrée sous
// `fut157-2026-10-30b` se relit sans erreur ; sa preuve par le point est re-dérivée par `ficheDemontree`.
export const SITES_SOLS_TERRAIN_CONVENTION = "fut157-2026-10-31";
/** Les conventions qu'une lecture enregistrée peut porter (compatibilité historique). */
export type ConventionSitesSols = typeof SITES_SOLS_TERRAIN_CONVENTION | "fut157-2026-10-30b";

export type InventaireTerrain = "sis" | "sup" | "instructions";
export const INVENTAIRES: InventaireTerrain[] = ["sis", "sup", "instructions"];

/** « adresse » : géocodé au numéro. « secteur » : à la voie, au lieu-dit, à la commune. Comme FUT-146. */
export type PorteeSitesSols = "adresse" | "secteur" | "non_precisee";

/**
 * CE QUE LA PARCELLE PEUT PROUVER. `attribuee` : rattachée au point, seule, mesurable, adresse au numéro.
 * `incertaine` : mesurable, mais trouvée par proximité (`repli`) ou sur une limite (`limite`) ; elle peut être
 * celle d'un voisin. `ecartee` : elle ne sert pas (absente, non mesurable, trop étendue, ou adresse sans numéro).
 */
export type UsageParcelle =
  | { statut: "attribuee"; code: string | null }
  | { statut: "incertaine"; code: string | null; raison: "repli" | "limite"; distanceM: number | null }
  | { statut: "ecartee"; raison: "absente" | "non_mesurable" | "trop_etendue" | "adresse_sans_numero" };

/**
 * OÙ EST LE PÉRIMÈTRE PAR RAPPORT AU TERRAIN. Deux situations peuvent démontrer (`point_dans`, `parcelle_recoupe`),
 * et seulement à la parcelle attribuée (`ficheDemontree`) ; toutes les autres appellent une vérification, et disent pourquoi.
 * La preuve est une PROFONDEUR (`TOLERANCE_TRACE_M`, 2 m, dans `sites-sols-terrain.ts`) : un périmètre qui
 * n'entre pas de 2 m dans le terrain peut n'être qu'un écart de tracé. Aucun recoupement n'est écarté pour sa
 * petite taille : seul un contact, une aire indiscernable de zéro à la précision du calcul, ne compte pas.
 * - `point_dans` : le point de l'adresse est dans le périmètre, à plus de 2 m de sa limite. C'est un fait sur le
 *   POINT : il ne dit le terrain que si ce point tombe dans la parcelle attribuée. Une adresse posée sur la voie,
 *   rattachée par proximité, sur une limite entre deux parcelles, ou sans parcelle trouvée, reste « à vérifier ».
 * - `parcelle_recoupe` : le périmètre entre de plus de 2 m dans la parcelle attribuée (en tout ou en partie).
 * - `parcelle_bordure` : il recoupe la parcelle attribuée sans y entrer de 2 m : un liseré le long d'une limite,
 *   quelle que soit son aire.
 * - `point_en_limite` : le point est sur la limite du périmètre, ou dedans à moins de 2 m d'elle, et aucune
 *   parcelle attribuée ne tranche.
 * - `parcelle_incertaine` : il recoupe une parcelle rattachée par proximité ou sur une limite.
 * - `localisation_ponctuelle` : la fiche n'est localisée que par un point, qui tombe dans la parcelle.
 * - `geometrie_illisible` : le périmètre publié ne se mesure pas ; sa position ne se vérifie pas.
 * - `adresse_publiee` : une fiche sans emprise (un point, ou rien) est publiée à l'adresse même du logement.
 */
export type Situation =
  | "point_dans" | "parcelle_recoupe"
  | "parcelle_bordure" | "point_en_limite" | "parcelle_incertaine" | "localisation_ponctuelle" | "geometrie_illisible"
  | "adresse_publiee";

export type FicheTerrain = {
  inventaire: InventaireTerrain;
  id: string;
  nom: string;
  /** Instructions : « En cours » ou « Clôturée », tel que publié. */
  statut: string | null;
  /** Fiche officielle (domaine public filtré par `lienFicheSur`). */
  fiche: string | null;
  /** Date de mise à jour de la fiche (AAAA-MM-JJ), telle que publiée. */
  miseAJour: string | null;
  situation: Situation;
  /** Part de la parcelle couverte (0 à 1) et aire (m²) ; `null` sans mesure à la parcelle. */
  part: number | null;
  surfaceM2: number | null;
  /** `adresse_publiee` seulement : l'adresse telle que la fiche la publie, et ce qui tient lieu de localisation. */
  adressePubliee?: { texte: string; localisation: "point" | "aucune" };
};

export type EtatInventaire = "complet" | "partiel" | "indisponible";

export type LectureSitesSols = {
  convention: ConventionSitesSols;
  /** `indisponible` : aucun des trois inventaires n'a pu être lu. Jamais une absence. */
  statut: "lu" | "indisponible";
  portee: PorteeSitesSols;
  parcelle: UsageParcelle;
  /** Le rayon demandé à l'API (préfiltre), en mètres. Jamais affiché comme un seuil. */
  rayonM: number;
  inventaires: Record<InventaireTerrain, EtatInventaire>;
  /** Les fiches qui concernent le terrain ou appellent une vérification, triées par inventaire puis par nom. */
  fiches: FicheTerrain[];
  /**
   * LES FICHES DE LA COMMUNE SANS EMPRISE PUBLIÉE : localisées par un simple point (`ponctuelles`), ou sans
   * aucune géométrie (`sansGeometrie`, qu'aucune recherche géographique ne voit). Lues à la commune (avec
   * arrondissements et anciens codes, FUT-152) ; `null` si cette lecture n'a pas été faite.
   */
  sansEmprise: { etat: EtatInventaire; ponctuelles: number; sansGeometrie: number } | null;
  // Aucune date de consultation : le rapport entier fait l'empreinte de sa version, et une date changerait
  // l'empreinte de deux collectes identiques. La date est celle de la collecte (`version.collecteeLe`).
};

// ── Ce que la lecture établit (dérivé à chaque lecture, jamais enregistré) ──────────────────────

/**
 * UNE FICHE DÉMONTRE-T-ELLE QUE LE TERRAIN EST CONCERNÉ ? Le point dans le périmètre, ou la parcelle recoupée en
 * profondeur, et seulement à la PARCELLE ATTRIBUÉE : une adresse géocodée au numéro dont le point tombe dans une
 * parcelle, et elle seule. Le point d'une voie n'est pas un terrain ; le point d'un numéro non plus, quand il ne
 * tombe dans aucune parcelle (contre-revue du 31/10/2026 : une adresse posée sur la voie, à l'intérieur d'un SIS,
 * rattachée par proximité à une parcelle voisine hors du SIS, était dite « concernée »).
 * Calculé ici, à la lecture, et non figé dans le rapport (cf. AGENTS.md : un champ pré-calculé est un seuil figé) :
 * une lecture enregistrée avant cette règle est relue avec elle.
 */
export function ficheDemontree(f: FicheTerrain, l: Pick<LectureSitesSols, "portee" | "parcelle">): boolean {
  return l.portee === "adresse" && l.parcelle?.statut === "attribuee" && (f.situation === "point_dans" || f.situation === "parcelle_recoupe");
}

/**
 * L'ÉTAT DE LA LECTURE, dans cet ordre :
 * - `concerne` : au moins une fiche démontrée. Un résultat attesté est gardé même si un autre inventaire manque.
 * - `a_verifier` : au moins une fiche située sans preuve suffisante.
 * - `indisponible` : aucun inventaire n'a pu être lu.
 * - `incomplet` : un inventaire, ou la liste communale des fiches sans emprise, n'a pas été lu en entier.
 * - `terrain_non_situe` : tout a été lu, aucun périmètre ne contient le point, mais aucune parcelle n'a pu
 *   être attribuée : l'absence vaut pour le point, pas pour le terrain.
 * - `aucun` : tout a été lu, à la parcelle attribuée, sans aucune correspondance.
 */
export type EtatSitesSols = "concerne" | "a_verifier" | "indisponible" | "incomplet" | "terrain_non_situe" | "aucun";

export function etatSitesSols(l: LectureSitesSols): EtatSitesSols {
  if (l.fiches.some((f) => ficheDemontree(f, l))) return "concerne";
  if (l.fiches.length > 0) return "a_verifier";
  if (l.statut === "indisponible") return "indisponible";
  if (INVENTAIRES.some((i) => l.inventaires[i] !== "complet") || l.sansEmprise?.etat !== "complet") return "incomplet";
  if (l.parcelle.statut !== "attribuee") return "terrain_non_situe";
  return "aucun";
}
