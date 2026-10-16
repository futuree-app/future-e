// L'AUDIT ÉNERGÉTIQUE ADEME, TEL QUE LE PRODUIT LE LIT (FUT-59). Module PUR : aucune I/O, testable sous
// `node --test`. Le chargement réseau vit dans `audit.ts`.
//
// ── LE CONTRAT, ÉTABLI LE 04/10/2026 ──────────────────────────────────────────────────────────
// Jeu `audit-opendata` (ADEME, « Audits énergétiques logement existants », data.ademe.fr). Une ligne
// par ÉTAPE de scénario. Pour la consommation en énergie primaire, tous usages (« 5 usages »), le jeu
// publie DEUX grandeurs :
//   - `ep_conso_5_usages_m2` (titre source « conso_ep_5_usages_par_m2 ») : par m² et par an,
//     c'est-à-dire kWh EP/m²/an ;
//   - `ep_conso_5_usages` (« conso_ep_5_usages ») : la consommation TOTALE de l'objet audité,
//     kWh EP/an, égale à la précédente multipliée par la surface habitable de référence.
// Vérifié sur l'audit de l'incident (5 étapes : total = par m² × 434 m², surface de l'IMMEUBLE) et sur
// 80 lignes publiques : la surface de référence est `surface_habitable_logement` quand elle est
// renseignée (40/40), sinon `surface_habitable_immeuble` (40/40). Même structure pour les émissions
// (`emission_ges_5_usages_m2`, kg CO₂/m²/an).
//
// LE DÉFAUT CORRIGÉ. `audit.ts` lisait `ep_conso_5_usages` (le TOTAL) et l'écran l'affichait suivi de
// « kWh/m²/an » : 218 538 kWh EP/an pour un immeuble de 434 m² devenaient « 218538.427059351 kWh/m²/an »,
// au lieu de 503,5 kWh EP/m²/an. Aucune division n'est faite ici : la grandeur par m² existe à la source,
// et c'est elle qu'on lit. Les champs internes portent désormais leur unité dans leur nom.
//
// ── LE GRAIN ─────────────────────────────────────────────────────────────────────────────────
// Un audit porte sur un LOGEMENT ou sur un IMMEUBLE entier, et il est trouvé par l'identifiant BAN de
// l'adresse, pas rattaché au diagnostic choisi. L'objet audité se lit dans ses surfaces : l'écran le
// dit, pour qu'un audit d'immeuble ne passe pas pour celui du logement.

/** Une étape de scénario, par m² de la surface de référence de l'audit. */
export type AuditScenario = {
  categorie: string | null;
  etape: string | null;
  travaux: string | null;
  /** Consommation d'énergie primaire, 5 usages, kWh EP/m²/an (source `ep_conso_5_usages_m2`). */
  conso_ep_m2: number | null;
  /** Émissions de gaz à effet de serre, 5 usages, kg CO₂/m²/an (source `emission_ges_5_usages_m2`). */
  emission_ges_m2: number | null;
};

/**
 * L'objet audité, et la surface à laquelle se rapportent les valeurs par m². Dictionnaire ADEME (JDD) :
 * `surface_habitable_logement` est « renseignée sauf dans le cas du dpe à l'immeuble » ;
 * `surface_habitable_immeuble` est la « surface habitable totale de l'immeuble ».
 */
export type AuditObjet =
  | { grain: "logement"; surface_m2: number }
  | { grain: "immeuble"; surface_m2: number }
  | null;

/**
 * COMMENT L'AUDIT A ÉTÉ TROUVÉ (FUT-59). Deux concepts, deux TYPES, jamais mélangés :
 *   - `exact_address` : le même identifiant BAN que l'adresse. Seul cas qui porte des valeurs, et seul
 *     cas que l'écran Logement peut afficher (`AuditRecord`) ;
 *   - `nearby_candidate` : un audit trouvé à moins d'environ 50 m, SANS correspondance d'adresse
 *     (`AuditCandidatProche`). Une distance ne prouve pas qu'il concerne ce bâtiment : ce type ne porte
 *     donc AUCUNE valeur énergétique. Il est conservé pour qu'une preuve future (parcelle, identifiant de
 *     bâtiment, BDNB…) puisse un jour confirmer l'attribution ; la distance seule ne la confirme jamais.
 */
export type AuditCorrespondance = "exact_address";

/** Un audit voisin, non attribué. Référence et distance seulement : aucune consommation, aucune classe. */
export type AuditCandidatProche = {
  correspondance: "nearby_candidate";
  n_audit: string;
  date_audit: string | null;
  /** Distance à vol d'oiseau entre le point de l'adresse et le point géocodé de l'audit, en mètres. */
  distance_m: number | null;
};

export type AuditRecord = {
  /** La provenance de l'attribution. Seule une correspondance d'adresse exacte existe. */
  correspondance: AuditCorrespondance;
  n_audit: string;
  date_audit: string | null;
  classe_dpe_actuel: string | null;
  adresse: string | null;
  objet: AuditObjet;
  scenarios: AuditScenario[];
  /**
   * FUT-62 : le numéro du DPE auquel la source rattache l'audit (`numero_dpe`, titre « numero_dpe_rattache »).
   * C'est la seule PREUVE qu'un audit trouvé par l'adresse porte sur le diagnostic retenu pour ce logement :
   * une surface ou une consommation voisines n'en sont pas. Optionnel : absent des rapports antérieurs.
   */
  numero_dpe?: string | null;
  /**
   * FUT-62 : le numéro d'immatriculation de la copropriété, quand la source le publie (`n_immatriculation_copro`).
   * Présent, il établit que l'immeuble audité est une copropriété ; absent, il ne prouve RIEN (la plupart des
   * audits d'immeuble ne le renseignent pas, et un immeuble peut appartenir à un seul propriétaire).
   */
  copropriete?: string | null;
  /** FUT-62 : le nombre de logements de l'immeuble audité, tel que publié (`nb_appartement`). */
  nb_logements?: number | null;
  /**
   * FUT-62 (revue) : la source a coupé la réponse dans les lignes de CET audit. Des étapes peuvent manquer :
   * aucune conclusion sur la rénovation complète ne se tire de lui. Absent = lu en entier.
   */
  lecture_partielle?: true;
};

/** Les colonnes lues. Les totaux (`ep_conso_5_usages`, `emission_ges_5_usages`) n'en font PAS partie. */
export const AUDIT_SELECT = [
  "n_audit",
  "id_etape",
  "identifiant_ban",
  "adresse_ban",
  "code_insee_ban",
  "date_etablissement_audit",
  "classe_bilan_dpe",
  "categorie_scenario",
  "etape_travaux",
  "travaux_realises",
  "ep_conso_5_usages_m2",
  "emission_ges_5_usages_m2",
  "surface_habitable_logement",
  "surface_habitable_immeuble",
  // FUT-62 : ce qui relie l'audit au diagnostic retenu, à la copropriété, et à l'audit qu'il remplace.
  "numero_dpe",
  "n_immatriculation_copro",
  "nb_appartement",
  "n_audit_remplace",
] as const;

export type AuditApiRow = {
  n_audit: string;
  identifiant_ban?: string | null;
  adresse_ban?: string | null;
  date_etablissement_audit?: string | null;
  classe_bilan_dpe?: string | null;
  categorie_scenario?: string | null;
  etape_travaux?: string | null;
  travaux_realises?: string | null;
  ep_conso_5_usages_m2?: number | null;
  emission_ges_5_usages_m2?: number | null;
  surface_habitable_logement?: number | null;
  surface_habitable_immeuble?: number | null;
  numero_dpe?: string | null;
  n_immatriculation_copro?: string | null;
  nb_appartement?: number | null;
  n_audit_remplace?: string | null;
};

const fini = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** La surface de référence, selon la règle observée à la source : le logement s'il est renseigné. */
export function objetAudite(row: AuditApiRow): AuditObjet {
  if (fini(row.surface_habitable_logement) && row.surface_habitable_logement > 0) {
    return { grain: "logement", surface_m2: row.surface_habitable_logement };
  }
  if (fini(row.surface_habitable_immeuble) && row.surface_habitable_immeuble > 0) {
    return { grain: "immeuble", surface_m2: row.surface_habitable_immeuble };
  }
  return null;
}

const texte = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

function versRecord(auditRows: AuditApiRow[]): AuditRecord {
  const head = auditRows[0];
  return {
    correspondance: "exact_address",
    n_audit: head.n_audit,
    date_audit: head.date_etablissement_audit ?? null,
    classe_dpe_actuel: head.classe_bilan_dpe ?? null,
    adresse: head.adresse_ban ?? null,
    objet: objetAudite(head),
    scenarios: auditRows.map((r) => ({
      categorie: r.categorie_scenario ?? null,
      etape: r.etape_travaux ?? null,
      travaux: r.travaux_realises ?? null,
      conso_ep_m2: fini(r.ep_conso_5_usages_m2) ? r.ep_conso_5_usages_m2 : null,
      emission_ges_m2: fini(r.emission_ges_5_usages_m2) ? r.emission_ges_5_usages_m2 : null,
    })),
    // FUT-62 : écrits SEULEMENT s'ils ont une valeur. Un rapport dont l'audit ne les publie pas garde ainsi
    // exactement la forme (et l'empreinte) d'avant : aucune « nouvelle version » à l'actualisation.
    ...siPresent("numero_dpe", auditRows.map((r) => texte(r.numero_dpe)).find(Boolean)),
    ...siPresent("copropriete", auditRows.map((r) => texte(r.n_immatriculation_copro)).find(Boolean)),
    ...siPresent("nb_logements", auditRows.map((r) => r.nb_appartement).find((v): v is number => fini(v) && v > 0)),
  };
}

function siPresent<K extends string, V>(cle: K, v: V | null | undefined): Partial<Record<K, V>> {
  return v == null ? {} : ({ [cle]: v } as Record<K, V>);
}

/**
 * TOUS LES AUDITS D'UNE ADRESSE (FUT-62), du plus pertinent au moins pertinent.
 *
 * Seules les lignes dont l'identifiant BAN est EXACTEMENT celui de l'adresse sont gardées : la recherche
 * plein texte de la source ne doit jamais faire entrer l'audit d'une autre adresse.
 *
 * LE DÉFAUT CORRIGÉ. `toAuditRecord` gardait « le premier audit rencontré », sans dire qu'il y en avait
 * d'autres. Au 1 rue Saint-Dominique (Paris 7e), la source en publie trois, établis le même jour (un
 * immeuble de 434 m², un « immeuble » de 55 m², un appartement de 195 m²) : lequel s'affichait dépendait
 * de l'ordre de l'API, et les deux autres n'existaient pour personne. L'ordre est maintenant écrit :
 *   1. le plus récent (un audit plus ancien décrit un état peut-être dépassé) ;
 *   2. à date égale, l'immeuble avant un logement : l'immeuble concerne tous les logements de l'adresse,
 *      un audit de logement n'en concerne qu'un, qui n'est pas forcément celui-ci ;
 *   3. puis la plus grande surface, puis le numéro d'audit (stable d'un appel à l'autre).
 * Un audit que la source dit REMPLACÉ par un autre audit présent (`n_audit_remplace`) est écarté.
 */
export function toAuditRecords(rows: AuditApiRow[], banId: string): AuditRecord[] {
  rows = rows.filter((r) => r.identifiant_ban === banId);
  const byAudit = new Map<string, AuditApiRow[]>();
  for (const row of rows) {
    const list = byAudit.get(row.n_audit) ?? [];
    list.push(row);
    byAudit.set(row.n_audit, list);
  }
  const remplaces = new Set(rows.map((r) => texte(r.n_audit_remplace)).filter((v): v is string => v != null));
  const rangGrain = (a: AuditRecord) => (a.objet?.grain === "immeuble" ? 0 : a.objet?.grain === "logement" ? 1 : 2);
  return [...byAudit.values()]
    .map(versRecord)
    .filter((a) => !remplaces.has(a.n_audit))
    .sort((a, b) =>
      (b.date_audit ?? "").localeCompare(a.date_audit ?? "")
      || rangGrain(a) - rangGrain(b)
      || (b.objet?.surface_m2 ?? 0) - (a.objet?.surface_m2 ?? 0)
      || a.n_audit.localeCompare(b.n_audit));
}

/** L'audit retenu pour une adresse : le premier de `toAuditRecords` (cf. son ordre), ou `null`. */
export function toAuditRecord(rows: AuditApiRow[], banId: string): AuditRecord | null {
  return toAuditRecords(rows, banId)[0] ?? null;
}

/**
 * Une consommation par m², au dixième, à la française : la précision des diagnostics publiés
 * (`conso_5_usages_par_m2_ep` du DPE est au dixième). L'audit publie le quotient brut
 * (503,544762809564) : ses douze décimales ne disent rien de plus que la mesure.
 */
export function formatKwhEpM2(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/ /g, " ")} kWh EP/m²/an`;
}

/** Des émissions par m², au dixième, à la française (même contrat que `formatKwhEpM2`). */
export function formatGesM2(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/\u202f/g, "\u00a0")} kg CO₂/m²/an`;
}

/** Une surface, au dixième au plus, à la française : « 194,7 m² », « 2 877 m² ». Jamais « 194.7 ». */
export function formatSurfaceM2(v: number): string {
  return `${v.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/\u202f/g, "\u00a0")} m²`;
}

// ── FUT-67 : LES SCÉNARIOS D'AUDIT LUS COMME DES PARCOURS DE TRAVAUX ──────────────────────────────
// L'écran listait les lignes de la source telles quelles (« scénario multi étapes "principal" » /
// « étape intermédiaire 1 »), dans l'ordre de l'API : l'état initial arrivait en dernier, l'étape
// intermédiaire avant la première, et « 5 scénarios » comptait des LIGNES. Un audit réglementaire porte
// en réalité un état de départ et un ou deux parcours (par étapes, ou en une fois), chacun fait
// d'étapes ordonnées. Cette fonction ne fait que ranger et nommer : aucune classe déduite (une classe
// DPE dépend aussi des émissions), aucun coût, aucun gain annoncé (FUT-62 décidera de leur lecture).

export type EtapeParcours = { libelle: string; scenario: AuditScenario };
/** `cle` : la catégorie de la source, unique par parcours (clé de rendu) ; `titre` : ce que lit le lecteur. */
export type ParcoursAudit = { cle: string; titre: string; etapes: EtapeParcours[] };
/** `autresDeparts` : les lignes d'état initial au-delà de la première. Elles restent visibles, à part :
 *  un état avant travaux n'est jamais un parcours de travaux (revue FUT-67). */
export type LectureAudit = { depart: AuditScenario | null; autresDeparts: AuditScenario[]; parcours: ParcoursAudit[] };

const sansAccents = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/["«»]/g, "").trim();
const estEtatInitial = (s: AuditScenario) => /etat initial/.test(sansAccents(`${s.categorie ?? ""} ${s.etape ?? ""}`));

/**
 * LE NUMÉRO D'ÉTAPE EST CELUI DE LA SOURCE, jamais une position recalculée (revue FUT-67) : « étape
 * première » = 1, « étape intermédiaire N » = N + 1. Une étape absente de la source laisse un trou
 * visible (« Étape 2 », « Étape finale ») au lieu d'être masquée par une renumérotation.
 */
function numeroEtape(etape: string): number | null {
  const e = sansAccents(etape);
  if (/premiere/.test(e)) return 1;
  const inter = /intermediaire\s*(\d+)?/.exec(e);
  if (inter) return 1 + Number(inter[1] ?? 1);
  return null;
}
function rangEtape(etape: string): number {
  const n = numeroEtape(etape);
  if (n != null) return n;
  return /finale/.test(sansAccents(etape)) ? 1_000 : 500;
}

type Genre = "etapes" | "une_fois" | "autre";
function titreParcours(categorie: string): { titre: string; ordre: number; genre: Genre } {
  const c = sansAccents(categorie);
  const variante = /complementaire/.test(c) ? " (variante)" : "";
  if (/multi|plusieurs/.test(c)) return { titre: `Rénovation par étapes${variante}`, ordre: variante ? 3 : 1, genre: "etapes" };
  if (/une etape|une seule/.test(c)) return { titre: `Rénovation en une seule fois${variante}`, ordre: variante ? 4 : 2, genre: "une_fois" };
  // FUT-62 : « scénario complémentaire 1 », tel que la source l'écrit (4 % des audits échantillonnés) : un
  // parcours de plus, proposé par l'auditeur, dont la source ne dit pas s'il procède par étapes.
  const complementaire = /^scenario complementaire\s*(\d+)?$/.exec(c);
  if (complementaire) return { titre: `Parcours complémentaire${complementaire[1] ? ` ${complementaire[1]}` : ""}`, ordre: 4.5 + Number(complementaire[1] ?? 0) / 100, genre: "autre" };
  const brut = categorie.replace(/["«»]/g, "").trim();
  return { titre: brut.charAt(0).toUpperCase() + brut.slice(1), ordre: 5, genre: "autre" };
}

export function parcoursAudit(scenarios: AuditScenario[]): LectureAudit {
  // Le point de départ est LA première ligne d'état initial. Une éventuelle seconde ligne n'est pas
  // perdue, ni comptée comme un parcours : elle est rendue à part, comme un autre état avant travaux.
  const initiaux = scenarios.filter(estEtatInitial);
  const depart = initiaux[0] ?? null;
  const groupes = new Map<string, AuditScenario[]>();
  for (const s of scenarios) {
    if (estEtatInitial(s)) continue;
    const cle = s.categorie ?? "Parcours non précisé par la source";
    groupes.set(cle, [...(groupes.get(cle) ?? []), s]);
  }
  const parcours = [...groupes.entries()].map(([categorie, lignes]) => {
    const { titre, ordre, genre } = titreParcours(categorie);
    const triees = [...lignes].sort((a, b) => rangEtape(a.etape ?? "") - rangEtape(b.etape ?? ""));
    const etapes = triees.map((s) => {
      const e = sansAccents(s.etape ?? "");
      const n = numeroEtape(s.etape ?? "");
      // « Après travaux » seulement pour une rénovation en une fois : un parcours par étapes dont la
      // source ne donne que la fin reste « Étape finale », jamais déguisé en rénovation d'un coup.
      const libelle = /finale/.test(e)
        ? (genre === "une_fois" ? "Après travaux" : "Étape finale")
        : n != null
          ? `Étape ${n}`
          : (s.etape ?? "Étape non précisée");
      return { libelle, scenario: s };
    });
    return { cle: categorie, titre, etapes, ordre };
  });
  parcours.sort((a, b) => a.ordre - b.ordre);
  // DEUX CATÉGORIES, DEUX TITRES. Si deux catégories de la source donnent le même titre lisible, le
  // libellé de la source les distingue : la simplification ne fusionne jamais deux parcours à l'œil.
  const vus = new Map<string, number>();
  for (const p of parcours) vus.set(p.titre, (vus.get(p.titre) ?? 0) + 1);
  return {
    depart,
    autresDeparts: initiaux.slice(1),
    parcours: parcours.map(({ cle, titre, etapes }) => ({
      cle,
      titre: (vus.get(titre) ?? 0) > 1 ? `${titre} · ${cle.replace(/["«»]/g, "").trim()}` : titre,
      etapes,
    })),
  };
}

/** La phrase qui dit sur quoi porte l'audit. */
export function libelleObjet(objet: AuditObjet): string {
  if (!objet) return "Objet audité non précisé par la source";
  const s = Math.round(objet.surface_m2).toLocaleString("fr-FR").replace(/ /g, " ");
  return objet.grain === "logement"
    ? `Audit d'un logement de ${s} m², rattaché à cette adresse`
    : `Audit de l'immeuble entier (${s} m² habitables), pas de ce seul logement`;
}

// ── LA RECHERCHE À PROXIMITÉ ─────────────────────────────────────────────────────────────────────
// Elle ne demande à la source AUCUNE colonne de valeur : seulement de quoi identifier l'audit et le situer.

/** Les seules colonnes de la recherche spatiale. */
export const AUDIT_PROCHE_SELECT = ["n_audit", "identifiant_ban", "date_etablissement_audit", "_geopoint"] as const;

export type AuditProcheApiRow = {
  n_audit: string;
  identifiant_ban?: string | null;
  date_etablissement_audit?: string | null;
  /** « lat,lon », tel que la source le publie. */
  _geopoint?: string | null;
};

function distanceM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6_371_000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2
    + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Le candidat le plus proche, hors audits de l'adresse elle-même (ceux-là sont des correspondances
 * exactes, et passent par `toAuditRecord`). Jamais une valeur : une référence, une date, une distance.
 */
export function candidatProche(
  rows: AuditProcheApiRow[], point: { latitude: number; longitude: number }, banId: string | null,
): AuditCandidatProche | null {
  let meilleur: AuditCandidatProche | null = null;
  for (const r of rows) {
    if (banId && r.identifiant_ban === banId) continue;
    const [lat, lon] = String(r._geopoint ?? "").split(",").map(Number);
    const d = Number.isFinite(lat) && Number.isFinite(lon) ? Math.round(distanceM(point.latitude, point.longitude, lat, lon)) : null;
    if (!meilleur || (d != null && (meilleur.distance_m == null || d < meilleur.distance_m))) {
      meilleur = { correspondance: "nearby_candidate", n_audit: r.n_audit, date_audit: r.date_etablissement_audit ?? null, distance_m: d };
    }
  }
  return meilleur;
}

/**
 * CE QU'A ÉTABLI LA RECHERCHE DE L'AUDIT EXACT (FUT-65). Trois états, parce qu'une panne n'est pas une
 * absence : la base ADEME qui répond 500, dépasse son délai ou rend une réponse illisible ne dit RIEN de
 * l'existence d'un audit à cette adresse. Avant FUT-65, ces trois cas rendaient `[]`, donc `null`, donc
 * « aucun audit exact », et la route partait chercher un voisin sur la foi d'une absence jamais établie.
 *
 * Même doctrine que `probeDpeByBanId` (`found / none / unavailable`) ; les mots sont ceux du rapport.
 */
export type AuditStatus = "present" | "absent" | "unavailable";
export type AuditLookup =
  /** FUT-62 : `autres` = les autres audits de la même adresse ; `autresIncomplets` = la liste a été coupée. */
  | { status: "present"; audit: AuditRecord; autres?: AuditRecord[]; autresIncomplets?: boolean }
  | { status: "absent" }
  | { status: "unavailable" };

/**
 * Les lignes rendues par la source → l'état établi. `null` : la source n'a pas répondu exploitablement.
 *
 * `tronquee` (FUT-62) : la source a rendu autant de lignes que demandé, d'autres existent peut-être. Les
 * lignes arrivent triées par date puis par numéro d'audit : seul le DERNIER audit de la page peut être
 * coupé (une partie de ses étapes manquerait). Il est écarté, et la liste des autres audits est dite
 * incomplète, pour que l'écran écrive « au moins ».
 */
export function lectureAudit(rows: AuditApiRow[] | null, banId: string, tronquee = false): AuditLookup {
  if (rows == null) return { status: "unavailable" };
  if (!tronquee || rows.length === 0) {
    const [audit, ...autres] = toAuditRecords(rows, banId);
    return audit ? { status: "present", audit, autres, autresIncomplets: false } : { status: "absent" };
  }
  // Page pleine : le dernier audit de la page est TOUJOURS écarté des audits lus en entier (revue FUT-62 :
  // il était gardé quand il était seul, donc lu comme complet). S'il ne reste rien d'autre, il est rendu,
  // mais marqué `lecture_partielle` : on sait qu'un audit existe, pas où mènent ses parcours.
  const dernier = rows[rows.length - 1].n_audit;
  const [audit, ...autres] = toAuditRecords(rows.filter((r) => r.n_audit !== dernier), banId);
  if (audit) return { status: "present", audit, autres, autresIncomplets: true };
  const coupe = toAuditRecord(rows, banId);
  return coupe ? { status: "present", audit: { ...coupe, lecture_partielle: true }, autres: [], autresIncomplets: true } : { status: "absent" };
}

/**
 * LE VOISIN N'EST CHERCHÉ QUE SUR UNE ABSENCE ÉTABLIE. Présent : l'exact gagne, rien à chercher.
 * Indisponible : on ne sait pas si un audit exact existe, et signaler un voisin laisserait entendre
 * qu'il n'y en a pas.
 */
export function voisinAutorise(exact: AuditLookup): boolean {
  return exact.status === "absent";
}

/** Ce que rend le module Logement : l'audit exact s'il existe, sinon (et seulement sur absence établie) un candidat voisin. */
export function resultatAudit(
  exact: AuditLookup, proche: AuditCandidatProche | null,
): {
  audit: AuditRecord | null; auditProche: AuditCandidatProche | null; auditStatus: AuditStatus;
  autresAudits?: AuditRecord[]; autresAuditsIncomplets?: boolean;
} {
  if (exact.status === "present") {
    const base = { audit: exact.audit, auditProche: null, auditStatus: "present" as const };
    // FUT-62 : les autres audits de l'adresse ne sont rendus que s'il y en a, pour ne rien changer ailleurs.
    return exact.autres?.length || exact.autresIncomplets
      ? { ...base, autresAudits: exact.autres ?? [], autresAuditsIncomplets: exact.autresIncomplets === true }
      : base;
  }
  return { audit: null, auditProche: voisinAutorise(exact) ? proche : null, auditStatus: exact.status };
}
