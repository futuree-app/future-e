// FUT-50 · LA LECTURE D'UNE PRIORITÉ DE L'ACCUEIL, PARTAGÉE PAR LES ROUTES PUBLIQUES ET LE PROTOTYPE.
//
// Un service, deux jeux de sources :
//   - SOURCES LÉGÈRES (`sourcesLegeres`) : les fichiers dérivés de `data/accueil/` (identité, taille, rang de
//     douceur, 8 colonnes DRIAS). C'est ce que servent `/api/accueil/*` et `/dev/fut50/api/*` ;
//   - SOURCES COMPLÈTES (`sourcesCompletes`) : l'index du comparateur, `data_climat.json` et `buildCommuneDossier`,
//     comme avant. Elles ne servent plus qu'aux preuves d'équivalence et à la mesure « avant ».
// Les deux passent par LES MÊMES fonctions ci-dessous et par LES MÊMES règles du moteur (`dossierDepuisFaits`) :
// seule l'origine des intrants change, jamais une règle ni un seuil.
//
// Aucune écriture, aucun compte, aucune génération IA, aucun paiement, aucun dossier complet sur le chemin léger.
import "server-only";
import { estCodeOutremer, getEntiteOutremer, lireClimatOutremer, TERRITOIRES_OUTREMER } from "../outremer/index.ts";
import { villePLM } from "../territoire/plm-communal.ts";
import { summerComfortAction, buildClimatFacts, classifyClimateComfort, reconstructReference, CLIMAT_METRICS, CLIMAT_HORIZON, CLIMAT_REFERENCE_LABEL, type GwlScenarios } from "../decision/climat-facts.ts";
import { classifyAgglomerationSize, categoryStatementFragment } from "../decision/agglomeration-facts.ts";
import { mapCommuneToModuleFacts } from "../decision/module-facts-map.ts";
import { dossierDepuisFaits } from "../decision/territory-facts.ts";
import { projetDeTest } from "../decision/projet-de-test.ts";
import type { ModuleFacts, Dossier } from "../decision/decision-fact.ts";
import type { UserProject } from "../user-project.ts";
import type { IndexCommune } from "../comparateur-vie.ts";
import { formatTemperature, formatCompte } from "./recits.ts";
import { indicatorsDepuisScenarios, construireFaitsCommune } from "./faits.ts";
import { aCommune } from "../typography.ts";
import { communeLegere, scenariosLegers } from "./donnees-legeres.ts";
import { risquesGaspar } from "./gaspar-accueil.ts";
import {
  lireChaleur, lireTaille, lireHivers, lireRisques, lireAdresse,
  type CleePastille, type Lieu, type LecturePastille, type EntreesChaleur, type EntreesTaille, type EntreesHivers,
} from "../../components/prototypes/fut50/c/pastilles.ts";
import { gasparCouvre, lireChaleurOutremer, lireHiversOutremer, lireRisquesHorsGaspar, lireTailleOutremer } from "../../components/prototypes/fut50/c/outremer.ts";

export const CLES_ACCUEIL: readonly CleePastille[] = ["chaleur", "hivers", "taille", "voiture", "risques"];
/** Cinq chiffres, ou 2A / 2B suivis de trois chiffres (Corse). */
export const FORMAT_INSEE = /^(?:\d{2}|2[AB])\d{3}$/;

// LA LIMITE CLIMATIQUE DU MOTEUR, mot pour mot (`LIMITATION_CLIMAT`, materiality-rules.ts, non exportée).
const LIMITE_CLIMAT = "Cette trajectoire est lue à l'échelle de la commune, pas de l'adresse ni du logement.";

// ── Les sources ──────────────────────────────────────────────────────────────────────────────────────────

export type SourcesLecture = {
  nom: "legeres" | "completes";
  /** Le nom canonique d'une commune métropolitaine (arrondissements compris), ou `null` si le code est inconnu. */
  nomCommune: (insee: string) => Promise<string | null>;
  /** Les scénarios DRIAS dans la forme de `getClimatDataCommune(insee).commune.s`, ou `null`. */
  scenarios: (insee: string) => Promise<GwlScenarios | null>;
  /** Le dossier du moteur pour un projet, ou `null` si la commune n'a pas de faits. */
  dossier: (insee: string, projet: UserProject) => Promise<{ moduleFacts: ModuleFacts; dossier: Dossier } | null>;
};

/**
 * LES FAITS DU MOTEUR À PARTIR D'UNE COMMUNE LÉGÈRE. Le même mapping pur que le dossier (`mapCommuneToModuleFacts`),
 * nourri des seuls champs que portent les fichiers légers : identité, taille résolue, rang de douceur. Les autres
 * faits restent ABSENTS (null), jamais inventés ; les règles qui les liraient se taisent. Les deux règles
 * qu'interroge l'accueil (`eviter_grandes_villes`, `douceur_climat`) ne lisent que ceux-là : l'équivalence avec le
 * dossier complet est vérifiée sur les 34 791 codes (`scripts/accueil/verifier-equivalence.mjs`).
 */
export function faitsDepuisCommuneLegere(c: NonNullable<Awaited<ReturnType<typeof communeLegere>>>, climat: GwlScenarios | null): ModuleFacts {
  const entree = {
    insee: c.insee, nom: c.nom, dept: c.dept, lat: c.lat, lon: c.lon, uu: c.uu ?? undefined, population: c.population,
    ...(c.douceurRang ? { rankBands: { douceur_climat: c.douceurRang } } : {}),
  } as unknown as IndexCommune;
  return mapCommuneToModuleFacts(entree, {}, {
    hasAddress: false,
    tailleVille: c.tailleVille,
    tailleVilleSource: c.tailleVilleSource,
    climat: buildClimatFacts(climat),
  });
}

export const sourcesLegeres: SourcesLecture = {
  nom: "legeres",
  nomCommune: async (insee) => communeLegere(insee)?.nom ?? null,
  scenarios: async (insee) => scenariosLegers(insee),
  dossier: async (insee, projet) => {
    const c = communeLegere(insee);
    if (!c) return null;
    return dossierDepuisFaits(faitsDepuisCommuneLegere(c, scenariosLegers(insee)), projet);
  },
};

/** Les sources complètes, chargées seulement si on les demande (mesure « avant », preuves d'équivalence). */
export async function sourcesCompletes(): Promise<SourcesLecture> {
  const [{ getCommuneEntry }, { getClimatDataCommune }, { buildCommuneDossier }] = await Promise.all([
    import("../comparateur-vie.ts"), import("../drias-json.ts"), import("../decision/territory-facts.ts"),
  ]);
  return {
    nom: "completes",
    nomCommune: async (insee) => (await getCommuneEntry(insee))?.nom ?? null,
    scenarios: async (insee) => (await getClimatDataCommune(insee).catch(() => null))?.commune.s ?? null,
    dossier: (insee, projet) => buildCommuneDossier(insee, projet, { hasAddress: false }).catch(() => null),
  };
}

// ── L'identité ───────────────────────────────────────────────────────────────────────────────────────────

/**
 * LA COMMUNE CANONIQUE D'UN CODE, sans jamais lire le nom envoyé par le navigateur :
 *   - outre-mer : le COG embarqué (`@/lib/outremer`), avant toute donnée métropolitaine ;
 *   - Paris, Lyon, Marseille (75056, 69123, 13055) : `villePLM`, la règle du dossier Territoire (FUT-43) ;
 *   - toute autre commune, arrondissements compris : l'index (léger ou complet selon les sources).
 * `null` : code inconnu (inexistant, ancien code d'une commune fusionnée). Aucune identité devinée.
 */
export async function communeCanonique(insee: string, sources: SourcesLecture = sourcesLegeres): Promise<{ insee: string; nom: string } | null> {
  if (estCodeOutremer(insee)) {
    const e = getEntiteOutremer(insee);
    return e ? { insee: e.code, nom: e.nomComplet } : null;
  }
  const plm = villePLM(insee);
  if (plm) return { insee, nom: plm.nom };
  const nom = await sources.nomCommune(insee).catch(() => null);
  return nom ? { insee, nom } : null;
}

// ── Les intrants des lectures (inchangés depuis la route du prototype, sources en paramètre) ─────────────

/**
 * LA CHALEUR : `buildClimatFacts` et `classifyClimateComfort`, les fonctions mêmes de la règle
 * `territoire.climat-chaleur`. Même source, mêmes seuils, même verdict.
 */
export async function entreesChaleur(insee: string, sources: SourcesLecture): Promise<EntreesChaleur> {
  const sc = await sources.scenarios(insee).catch(() => null);
  const f = buildClimatFacts(sc);
  const seuils = { jours: CLIMAT_METRICS.joursTresChauds.threshold, nuits: CLIMAT_METRICS.nuitsTropicales.threshold };
  const referenceTexte = (v: number, nuits: boolean) => formatCompte(v, nuits ? { singulier: "nuit", pluriel: "nuits", feminin: true } : undefined);
  const gesteSansAdresse = summerComfortAction(false).label;
  if (!f) {
    return { verdict: "absent", jours: { projete: null, reference: null, seuil: seuils.jours }, nuits: { projete: null, reference: null, seuil: seuils.nuits }, referenceTexte, limite: LIMITE_CLIMAT, gesteSansAdresse };
  }
  return {
    verdict: classifyClimateComfort(f).verdict,
    jours: { projete: f.joursTresChauds.projete, reference: f.joursTresChauds.reference, seuil: f.joursTresChauds.threshold },
    nuits: { projete: f.nuitsTropicales.projete, reference: f.nuitsTropicales.reference, seuil: f.nuitsTropicales.threshold },
    // Les journées au-dessus de 30 °C : même chargement, même horizon, même reconstruction ; hors classifieur.
    jours30: (() => {
      const v = sc?.[CLIMAT_HORIZON]?.v?.NORTX30D_yr;
      return { projete: typeof v === "number" && Number.isFinite(v) ? v : null, reference: reconstructReference(sc, "NORTX30D_yr", "ATX30D_yr") };
    })(),
    referenceTexte, limite: LIMITE_CLIMAT, gesteSansAdresse,
  };
}

/** « PETITE VILLE » : la règle `eviter_grandes_villes` du moteur, sur la taille d'agglomération résolue. */
export async function entreesTaille(insee: string, sources: SourcesLecture): Promise<EntreesTaille> {
  const d = await sources.dossier(insee, projetDeTest("eviter_grandes_villes:2").projet).catch(() => null);
  if (!d) return { issue: "absent", phraseTaille: null, population: null, source: null };
  const critere = d.dossier.criteria.registry.find((c) => c.criterionKey === "eviter_grandes_villes");
  const issue = critere?.coverage === "examined" ? critere.outcome : undefined;
  const cat = classifyAgglomerationSize(d.moduleFacts.tailleVille);
  const source = d.moduleFacts.tailleVilleSource;
  return {
    issue: issue === "favorable" || issue === "mismatch" || issue === "indeterminate" ? issue : "absent",
    phraseTaille: cat !== "uncertain" && source ? categoryStatementFragment(d.moduleFacts.nom, cat, source) : null,
    population: d.moduleFacts.tailleVille,
    source,
  };
}

/** « HIVERS DOUX » : la règle `douceur_climat` du moteur (rang de douceur), et la température de référence DRIAS. */
export async function entreesHivers(insee: string, sources: SourcesLecture): Promise<EntreesHivers> {
  const [d, sc] = await Promise.all([
    sources.dossier(insee, projetDeTest("douceur_climat:2").projet).catch(() => null),
    sources.scenarios(insee).catch(() => null),
  ]);
  if (!d) return { issue: "absent", position: null, limite: null, temperatureReference: null };
  const critere = d.dossier.criteria.registry.find((c) => c.criterionKey === "douceur_climat");
  const issue = critere?.coverage === "examined" ? critere.outcome : undefined;
  const carte = d.dossier.sections.flatMap((s) => s.cards)
    .flatMap((c) => (c.kind === "fact" && (c.fact.role === "alignment" || c.fact.role === "mismatch") && c.fact.projectKey === "douceur_climat" ? [c.fact] : []))[0];
  const ref = sc
    ? construireFaitsCommune(d.moduleFacts.nom, indicatorsDepuisScenarios(sc), null).climat?.temperature_moyenne_hiver_C.reference ?? null
    : null;
  return {
    issue: issue === "favorable" || issue === "mismatch" || issue === "indeterminate" ? issue : "absent",
    // Le préambule d'un écart (« Vous avez placé … parmi vos priorités. ») n'a pas de sens ici : une pastille
    // n'est pas un projet déclaré. Même règle que les conditions (`condition-rules.ts`, sansPreambule).
    position: carte ? carte.statement.replace(/^Vous avez placé [^.]*\. /, "") : null,
    limite: carte && "limitation" in carte ? (carte.limitation ?? null) : null,
    temperatureReference: ref != null ? `Température moyenne de l'hiver : ${formatTemperature(ref)} ${CLIMAT_REFERENCE_LABEL}.` : null,
    temperatureValeur: ref != null ? formatTemperature(ref) : null,
  };
}

// ── La lecture ──────────────────────────────────────────────────────────────────────────────────────────

export type ResultatLecture =
  | { statut: 200; lecture: LecturePastille; durable: boolean; motif: string }
  | { statut: 400 | 404; erreur: "requete_invalide" | "commune_inconnue" };

/**
 * LA LECTURE D'UNE PRIORITÉ. `durable` dit si la réponse peut être mise en cache : vrai pour toute lecture tirée de
 * données publiées (y compris une indisponibilité STRUCTURELLE : territoire hors couverture, critère non défini
 * outre-mer) ; faux pour une panne TEMPORAIRE (GASPAR), même si le statut HTTP vaut 200.
 */
export async function lireAccueil(
  inseeBrut: string,
  cleBrute: string,
  opts: { type?: "commune" | "adresse"; sources?: SourcesLecture; gaspar?: typeof risquesGaspar } = {},
): Promise<ResultatLecture> {
  const insee = inseeBrut.trim().toUpperCase();
  const cle = cleBrute as CleePastille;
  if (!FORMAT_INSEE.test(insee) || !CLES_ACCUEIL.includes(cle)) return { statut: 400, erreur: "requete_invalide" };
  const sources = opts.sources ?? sourcesLegeres;
  const gaspar = opts.gaspar ?? risquesGaspar;
  const canon = await communeCanonique(insee, sources);
  if (!canon) return { statut: 404, erreur: "commune_inconnue" };
  const lieu: Lieu = { type: opts.type ?? "commune", libelle: canon.nom, commune: canon.nom, insee };
  const om = estCodeOutremer(insee) ? getEntiteOutremer(insee) : null;
  const ok = (lecture: LecturePastille, durable = true, motif = "donnees_publiees"): ResultatLecture => ({ statut: 200, lecture, durable, motif });
  const lireLesRisques = async () => {
    const g = await gaspar(insee);
    return ok(lireRisques(lieu, g.risques), !g.panne, g.panne ? "gaspar_indisponible" : "donnees_publiees");
  };
  if (om) {
    // OUTRE-MER : SocleOM pour la chaleur, aucune règle ni donnée métropolitaine (ni DRIAS, ni classifyClimateComfort,
    // ni dossier) ; une indisponibilité dite quand aucune lecture n'est validée (structurelle, donc durable).
    const t = TERRITOIRES_OUTREMER[om.territoire];
    if (cle === "chaleur") return ok(lireChaleurOutremer(lieu, lireClimatOutremer(insee)!));
    if (cle === "hivers") return ok(lireHiversOutremer(lieu, t));
    if (cle === "taille") return ok(lireTailleOutremer(lieu, om, t));
    if (cle === "risques") return gasparCouvre(insee) ? lireLesRisques() : ok(lireRisquesHorsGaspar(lieu, t), true, "hors_couverture_gaspar");
    return ok(lireAdresse("voiture", lieu, aCommune));
  }
  if (cle === "chaleur") return ok(lireChaleur(lieu, await entreesChaleur(insee, sources)));
  if (cle === "hivers") return ok(lireHivers(lieu, await entreesHivers(insee, sources)));
  if (cle === "taille") return ok(lireTaille(lieu, await entreesTaille(insee, sources)));
  if (cle === "risques") return lireLesRisques();
  return ok(lireAdresse("voiture", lieu, aCommune));
}

/** Les en-têtes de cache d'une réponse : CDN 24 h + 24 h de « stale » pour une lecture durable, rien sinon. */
export function enTetesCache(durable: boolean): Record<string, string> {
  return durable
    ? { "Cache-Control": "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400" }
    : { "Cache-Control": "no-store" };
}
