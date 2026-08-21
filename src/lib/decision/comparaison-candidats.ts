// ════════════════════════════════════════════════════════════════════════════════════════════
// COMPARER DEUX CANDIDATS, SANS EN DÉSIGNER UN.
//
// CE QUE CE MOTEUR EST. Une lecture croisée de deux ARTEFACTS DE DÉCISION déjà produits — donc de
// deux analyses figées, telles qu'elles ont été vendues. Il ne recalcule rien, ne réécrit rien, et
// n'ajoute aucun fait : il ne fait que RANGER côte à côte ce que chaque dossier a déjà conclu, en
// commençant par les critères que le lecteur avait lui-même déclarés.
//
// CE QU'IL N'EST PAS, ET NE DEVIENDRA PAS (ADR-0001, non négociable) :
//   - aucune note, aucun total, aucune moyenne. Aucun champ de ce module n'est un nombre qu'on
//     puisse trier : les seuls comptes exposés sont des LONGUEURS DE LISTE, pour l'affichage ;
//   - aucun gagnant, aucun classement. `a` et `b` sont l'ordre de sélection du lecteur, rien d'autre.
//     Aucune fonction ne rend « le meilleur » ;
//   - aucune agrégation de faits hétérogènes. On croise des CRITÈRES DÉCLARÉS et leur issue, jamais
//     des valeurs mesurées : deux mesures peuvent porter sur des grains, des millésimes ou des
//     périmètres différents, et rien ici ne permettrait de le savoir.
//
// CE QUI EMPÊCHE UNE COMPARAISON DE MENTIR. Deux dossiers ne se lisent dans le MÊME CADRE que si le
// même moteur, les mêmes conventions, le même projet et la même échelle les ont produits. Sinon, un
// écart d'issue peut venir du CADRE autant que du LIEU, et rien ne les sépare. Ce cas n'est pas
// masqué : la relation devient `difference_hors_cadre_commun`, et `comparabilite.reserves` dit
// pourquoi, phrase par phrase.
//
// ── CE QUE CE MODULE NE VÉRIFIE PAS, ET POURQUOI IL N'EST PAS RENDABLE EN L'ÉTAT (20/08/2026) ──
//
// Il ne compare PAS les MILLÉSIMES DES DONNÉES SOURCES. Deux dossiers produits par le même moteur,
// sous les mêmes conventions et pour le même projet peuvent avoir lu deux états différents d'une
// même source : une BPE 2024 d'un côté et une BPE 2025 de l'autre, un index de comparateur
// régénéré entre-temps. La différence d'issue vient alors d'une MISE À JOUR DE DONNÉE, et ce
// module la présenterait comme une différence entre deux lieux.
//
// D'où le vocabulaire tenu ici : `memeCadreDAnalyse` dit ce qui est VÉRIFIÉ (le cadre), jamais ce
// qui ne l'est pas (l'attribution au lieu). Un champ nommé `comparable` promettait la seconde
// chose en n'ayant mesuré que la première.
//
// AUCUNE SURFACE NE DOIT RENDRE CE MODULE tant que trois questions ne sont pas tranchées : ce que
// « différence attribuable au lieu » veut dire exactement, quels dossiers sont comparables, et
// comment l'offre y donne accès. Conception et blocages :
// `docs/superpowers/specs/2026-08-19-comparaison-deux-candidats-design.md`.
//
// Lib PURE, testable sous `node --test`. Le droit d'accès (deux dossiers du MÊME compte) est vérifié
// en amont, côté serveur : ce module ne voit jamais qu'un contenu déjà autorisé.
// ════════════════════════════════════════════════════════════════════════════════════════════
import type { DecisionArtifactV1 } from "./decision-artifact.ts";
import type {
  CriterionCoverage, CriterionOutcome, ProjectCriterionAssessment, UnexaminedReason,
} from "./criteria-registry.ts";
import { signatureDecisionnelle } from "./projet-materiel.ts";

/** Un candidat : son identité d'affichage, et l'analyse figée qui le décrit. */
export type CandidatCompare = {
  /** L'identifiant du dossier. Opaque ici : il ne sert qu'à renvoyer vers l'analyse d'origine. */
  id: string;
  /** Ce que le lecteur lit en tête de colonne (adresse ou commune), repris tel quel. */
  label: string;
  artifact: DecisionArtifactV1;
};

export type EtatCritere = {
  outcome: CriterionOutcome;
  coverage: CriterionCoverage;
  unexaminedReason: UnexaminedReason | null;
};

export type RelationCritere =
  /** Les deux dossiers concluent la même chose sur ce critère. */
  | "meme_lecture"
  /** Ils concluent différemment, DANS LE MÊME CADRE D'ANALYSE. Ce n'est pas encore dire que l'écart
   *  vient du lieu : les millésimes des données sources ne sont pas comparés (cf. en-tête). */
  | "difference_dans_le_meme_cadre"
  /** Ils concluent différemment, et le cadre lui-même diffère : moteur, conventions, projet ou
   *  échelle. L'écart existe, il ne s'interprète pas. */
  | "difference_hors_cadre_commun"
  /** Au moins un des deux n'a pas pu conclure ici : il n'y a rien à comparer, il y a à vérifier. */
  | "indetermine_ici";

export type LigneCritere = {
  criterionKey: string;
  kind: "hard_constraint" | "preference";
  /** Le libellé instancié du critère. Celui du candidat A quand les deux existent : même projet,
   *  même libellé ; s'ils diffèrent, c'est que les projets diffèrent, et la réserve le dit déjà. */
  label: string;
  a: EtatCritere | null;
  b: EtatCritere | null;
  relation: RelationCritere;
};

/** Ce que chaque dossier dit de lui-même, repris MOT POUR MOT de l'artefact vendu. */
export type FaceCandidat = {
  id: string;
  label: string;
  /** Le verdict tel qu'il a été vendu. Jamais recomposé, jamais comparé à l'autre. */
  verdictLabel: string;
  verdictHeadline: string;
  scope: "commune" | "commune+adresse";
  /** Les critères déclarés dont l'issue est favorable ici. */
  correspond: { criterionKey: string; label: string }[];
  /** Ceux dont l'issue contredit le projet : incompatible, ou écart de fond (mismatch). */
  contredit: { criterionKey: string; label: string; outcome: "incompatible" | "mismatch" }[];
  /** Ceux qui portent une réserve : ce qui se compromet, ce qui se contrôle. */
  compromis: { criterionKey: string; label: string }[];
  /** Ce que ce dossier n'a pas su trancher, avec la raison quand elle est connue. */
  inconnues: { criterionKey: string; label: string; raison: UnexaminedReason | null }[];
  /** Les démarches du contrôle prioritaire, reprises mot pour mot du plan. Jamais réécrites. */
  controlesPrioritaires: { label: string; anchorId: string }[];
  /** La couverture des critères déclarés, telle que le moteur l'a qualifiée. */
  couverture: "none" | "partial" | "high";
  /** La version et la date de l'analyse : elles sont la condition de lecture de tout le reste. */
  version: { engineVersion: string; conventionsVersion: string; generatedAt: string };
};

export type Comparabilite = {
  /**
   * Moteur, conventions, projet et échelle concordent-ils ? C'est TOUT ce que ce champ affirme.
   * Il ne dit pas qu'un écart d'issue est imputable au lieu : les millésimes des données sources
   * ne sont pas comparés. Le nom porte la mesure, pas l'espoir qu'on en a.
   */
  memeCadreDAnalyse: boolean;
  /** Une phrase par empêchement, dans un ordre fixe. Vide quand le cadre concorde. */
  reserves: string[];
};

export type ComparaisonDeuxCandidats = {
  a: FaceCandidat;
  b: FaceCandidat;
  comparabilite: Comparabilite;
  /** Les critères déclarés, dans l'ordre du registre de A puis les propres à B. */
  lignes: LigneCritere[];
  /** Les critères qu'un seul des deux dossiers connaît. Nommés, jamais silencieusement écartés. */
  criteresNonPartages: { criterionKey: string; label: string; presentChez: "a" | "b" }[];
};

const CONTREDIT = new Set<CriterionOutcome>(["incompatible", "mismatch"]);

function etat(c: ProjectCriterionAssessment): EtatCritere {
  return { outcome: c.outcome, coverage: c.coverage, unexaminedReason: c.unexaminedReason };
}

function face(c: CandidatCompare): FaceCandidat {
  const { artifact } = c;
  const registre = artifact.dossier.criteria.registry;
  const plan = artifact.dossier.narrativePlan;
  return {
    id: c.id,
    label: c.label,
    verdictLabel: plan.verdictLabel,
    verdictHeadline: plan.verdict.headline.text,
    scope: artifact.dossier.scope,
    correspond: registre.filter((x) => x.outcome === "favorable").map((x) => ({ criterionKey: x.criterionKey, label: x.label })),
    contredit: registre.filter((x) => CONTREDIT.has(x.outcome)).map((x) => ({
      criterionKey: x.criterionKey, label: x.label, outcome: x.outcome as "incompatible" | "mismatch",
    })),
    compromis: registre.filter((x) => x.outcome === "reserve").map((x) => ({ criterionKey: x.criterionKey, label: x.label })),
    // Une inconnue, c'est un critère DÉCLARÉ resté sans réponse : `indeterminate`, ou non examiné.
    inconnues: registre
      .filter((x) => x.outcome === "indeterminate" || x.coverage === "unexamined")
      .map((x) => ({ criterionKey: x.criterionKey, label: x.label, raison: x.unexaminedReason })),
    controlesPrioritaires: (plan.priorityControl?.actions ?? []).map((a) => ({ label: a.label, anchorId: a.anchorId })),
    couverture: artifact.dossier.criteria.coverage,
    version: {
      engineVersion: artifact.engineVersion,
      conventionsVersion: artifact.conventionsVersion,
      generatedAt: artifact.generatedAt,
    },
  };
}

function comparabilite(a: CandidatCompare, b: CandidatCompare): Comparabilite {
  const reserves: string[] = [];
  if (a.artifact.engineVersion !== b.artifact.engineVersion) {
    reserves.push(
      `Les deux analyses n'ont pas été produites par le même moteur (${a.artifact.engineVersion} et ${b.artifact.engineVersion}). Un écart peut venir des règles autant que des lieux.`,
    );
  }
  if (a.artifact.conventionsVersion !== b.artifact.conventionsVersion) {
    reserves.push(
      `Les conventions de lecture ont changé entre les deux analyses (${a.artifact.conventionsVersion} et ${b.artifact.conventionsVersion}).`,
    );
  }
  // LA MÊME SIGNATURE QUE LA PÉREMPTION D'UN DOSSIER (`projet-materiel.ts`) : « deux projets de même
  // signature concluent pareil ». Une seconde définition du « même projet » aurait fini par dire
  // comparable ce que l'autre déclare périmé.
  if (signatureDecisionnelle(a.artifact.projectSnapshot) !== signatureDecisionnelle(b.artifact.projectSnapshot)) {
    reserves.push(
      "Les deux dossiers ne répondent pas au même projet : les critères examinés ne sont pas les mêmes, ou pas dans la même posture.",
    );
  }
  if (a.artifact.dossier.scope !== b.artifact.dossier.scope) {
    reserves.push(
      "Les deux dossiers ne portent pas sur la même échelle : l'un s'arrête à la commune, l'autre descend à l'adresse.",
    );
  }
  return { memeCadreDAnalyse: reserves.length === 0, reserves };
}

function relation(a: EtatCritere | null, b: EtatCritere | null, memeCadre: boolean): RelationCritere {
  if (!a || !b) return "indetermine_ici";
  if (a.outcome === "indeterminate" || b.outcome === "indeterminate") return "indetermine_ici";
  if (a.coverage === "unexamined" || b.coverage === "unexamined") return "indetermine_ici";
  if (a.outcome === b.outcome) return "meme_lecture";
  return memeCadre ? "difference_dans_le_meme_cadre" : "difference_hors_cadre_commun";
}

/**
 * LA COMPARAISON, DÉTERMINISTE. Même entrée, même sortie : aucune date du jour, aucun aléa, aucun
 * appel de modèle. L'ORDRE DES LIGNES est celui du registre de A, puis les critères propres à B :
 * le registre suit l'ordre du projet déclaré, donc deux dossiers d'un même projet donnent le même
 * ordre quelle que soit la colonne choisie en premier. Trier autrement fabriquerait une hiérarchie
 * de critères que le lecteur n'a pas exprimée.
 */
export function comparerDeuxCandidats(a: CandidatCompare, b: CandidatCompare): ComparaisonDeuxCandidats {
  const comp = comparabilite(a, b);
  const parCleA = new Map(a.artifact.dossier.criteria.registry.map((c) => [c.criterionKey, c]));
  const parCleB = new Map(b.artifact.dossier.criteria.registry.map((c) => [c.criterionKey, c]));

  const lignes: LigneCritere[] = [];
  const criteresNonPartages: ComparaisonDeuxCandidats["criteresNonPartages"] = [];

  for (const c of a.artifact.dossier.criteria.registry) {
    const autre = parCleB.get(c.criterionKey);
    lignes.push({
      criterionKey: c.criterionKey, kind: c.kind, label: c.label,
      a: etat(c), b: autre ? etat(autre) : null,
      relation: relation(etat(c), autre ? etat(autre) : null, comp.memeCadreDAnalyse),
    });
    if (!autre) criteresNonPartages.push({ criterionKey: c.criterionKey, label: c.label, presentChez: "a" });
  }
  for (const c of b.artifact.dossier.criteria.registry) {
    if (parCleA.has(c.criterionKey)) continue;
    lignes.push({
      criterionKey: c.criterionKey, kind: c.kind, label: c.label,
      a: null, b: etat(c),
      relation: "indetermine_ici",
    });
    criteresNonPartages.push({ criterionKey: c.criterionKey, label: c.label, presentChez: "b" });
  }

  return { a: face(a), b: face(b), comparabilite: comp, lignes, criteresNonPartages };
}
