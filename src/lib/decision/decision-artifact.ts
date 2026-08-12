// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ARTEFACT DE DÉCISION : ce qui a été VENDU, figé le jour de la vente.
//
// POURQUOI IL EXISTE. `/rapport` est en `force-dynamic` et `buildCommuneDossier` réassemble tout à
// chaque ouverture, avec le moteur du jour. Un lecteur qui revenait six mois après son achat ne
// consultait donc ni son dossier ni un dossier cohérent : un hybride, où les règles venaient du
// moteur courant pendant que les mesures d'adresse venaient du snapshot d'origine, sans que rien à
// l'écran ne le dise. Pour un produit qui vend la vérifiabilité, « qu'est-ce que futur•e m'avait
// dit quand j'ai décidé ? » n'avait pas de réponse.
//
// LA RÈGLE : on fige la décision et tout ce qui la prouve ; le contexte reste vivant, et se
// présente comme vivant. Le défaut n'était pas que le rapport mêle deux temps, c'est que rien ne
// disait lequel on lisait. Spec : `docs/superpowers/specs/2026-08-05-dossier-date-et-versionne-design.md`.
//
// PUR, testable sous `node --test` : aucun `server-only`, aucune I/O. Le store qui écrit et relit
// vit à côté, dans `server/decision-artifact-store.ts`.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { z } from "zod";
import type { Dossier } from "./decision-fact.ts";
import type { CatnatInondation } from "./catnat-evidence.ts";
import type { UserProject } from "../user-project.ts";

/**
 * LA VERSION DU MOTEUR, qu'un artefact porte pour dire avec quelles règles il a été produit.
 *
 * ELLE N'EST PAS DÉRIVÉE, ELLE EST DÉCIDÉE. Un hash du code changerait à chaque virgule et rendrait
 * incomparables deux dossiers identiques ; un numéro de paquet ne dit rien des règles. Cette
 * constante se relève À LA MAIN quand une règle, un seuil ou une formulation change ce que le
 * moteur CONCLUT, et c'est précisément l'information qu'un lecteur veut quand il compare deux
 * versions de son dossier.
 *
 * Elle est distincte de `PRODUCT_CONVENTIONS_VERSION` (hard-constraints), qui versionne les
 * conventions des contraintes dures. Les deux voyagent dans l'artefact.
 */
export const ENGINE_VERSION = "engine-1";

export type DecisionArtifactV1 = {
  schemaVersion: 1;
  /** ISO 8601. La date de GÉNÉRATION, distincte des dates de consultation des sources. */
  generatedAt: string;
  engineVersion: string;
  conventionsVersion: string;
  projectSnapshot: UserProject;
  dossier: Dossier;
  /**
   * LES DONNÉES CHIFFRÉES QUE LE DOSSIER ANNONCE, sous leur forme structurée (11/08/2026).
   *
   * ── POURQUOI, ALORS QUE `dossier` PORTE DÉJÀ LE TEXTE ────────────────────────────────────
   * Le texte est figé, mais il n'est lisible que par un humain. Quand une AUTRE surface doit
   * afficher le même chiffre (la carte du module Territoire, visée par le lien « Preuve »), elle
   * n'a que deux choix : relire l'index du déploiement courant, et diverger de ce qui a été vendu,
   * ou parser une phrase, ce qui casse au premier changement de formulation. Le défaut était réel :
   * la pastille d'un dossier acheté annonçait 6 pendant que la carte, relisant l'index régénéré,
   * affichait 7.
   *
   * Ce champ est donc le SNAPSHOT DE DONNÉES de l'artefact, à côté du snapshot de projet. Il ne
   * contient que ce qu'une autre surface doit pouvoir réafficher à l'identique.
   *
   * OPTIONNEL, et il le restera : les artefacts vendus avant ce lot n'en ont pas, et leur lecteur
   * doit continuer de voir son dossier. L'absence se traite comme un repli sur l'index courant,
   * jamais comme une erreur.
   */
  dataSnapshot?: DataSnapshot;
};

/** Ce que l'artefact fige EN PLUS de sa prose. Une entrée par donnée réaffichée ailleurs. */
export type DataSnapshot = {
  catnatInondation?: CatnatInondation;
};

/**
 * LE PARSEUR D'EXÉCUTION, et ce qu'il vérifie VRAIMENT.
 *
 * ── POURQUOI PAS UN SCHÉMA ZOD COMPLET DU `Dossier` ──────────────────────────────────────────
 * Ce serait une SECONDE DÉFINITION du type, à maintenir en parallèle de la première. Elles
 * divergeraient au premier champ ajouté, et la divergence se découvrirait en production, sur un
 * artefact refusé pour un champ qui n'a jamais compté. Le typage statique couvre déjà l'écriture ;
 * ce parseur ne protège que la RELECTURE d'un JSON écrit par une version antérieure.
 *
 * ── CE QU'IL GARANTIT, ET ÇA SUFFIT ──────────────────────────────────────────────────────────
 * Que le rendu ne tombe pas. Sont donc exigés l'enveloppe complète et les champs du `Dossier` dont
 * `DossierDecisionSection` et `ControlesDuDossier` dépendent structurellement : les sections et
 * leurs cartes, la conclusion, les compositions, les faits absorbés. Le reste passe.
 *
 * ── IL REFUSE, IL NE RÉPARE PAS ──────────────────────────────────────────────────────────────
 * Un artefact invalide rend `null`, et l'appelant retombe sur l'assemblage vivant. Compléter un
 * artefact incomplet produirait un dossier moitié figé moitié recalculé, c'est-à-dire exactement
 * l'hybride que ce lot supprime.
 */
const dossierShape = z.object({
  scope: z.string(),
  conclusion: z.string(),
  conclusionState: z.string(),
  sections: z.array(z.object({
    key: z.string(),
    title: z.string(),
    cards: z.array(z.unknown()),
  }).passthrough()),
  controlesTitle: z.string(),
  compositions: z.array(z.unknown()),
  absorbedFacts: z.array(z.unknown()),
}).passthrough();

const artifactSchema = z.object({
  schemaVersion: z.literal(1),
  // Une date qui ne se parse pas est pire qu'une date absente : elle s'affiche « Invalid Date ».
  generatedAt: z.string().refine((s) => !Number.isNaN(Date.parse(s)), "date de génération illisible"),
  engineVersion: z.string().min(1),
  conventionsVersion: z.string().min(1),
  projectSnapshot: z.object({}).passthrough(),
  dossier: dossierShape,
});

// ── LE SNAPSHOT SE VALIDE À PART, ET SON ÉCHEC NE COÛTE QUE LUI (revue du 11/08/2026) ─────────
//
// Il était dans le schéma principal. Un bloc corrompu faisait donc refuser l'artefact ENTIER, et
// `dossierAServir` retombait en silence sur l'assemblage vivant : la corruption d'un enrichissement
// annexe réécrivait toute la décision vendue, ce que ce lot existe précisément pour empêcher. Le
// commentaire promettait déjà l'inverse de ce que le code faisait.
//
// Deux passes, donc : le dossier figé d'abord, qui est la vente ; le snapshot ensuite, qui est un
// confort de réaffichage. Un snapshot illisible disparaît, l'appelant retombe sur l'index courant,
// et le lecteur garde SA décision.
const dataSnapshotSchema = z.object({
  catnatInondation: z.object({
    count: z.number().int().nonnegative(),
    depuis: z.number().int(),
    origine: z.literal("index_local"),
    insee: z.string().nullable(),
    version: z.string().min(1),
  }).optional(),
});

export function parseDecisionArtifact(value: unknown): DecisionArtifactV1 | null {
  const parsed = artifactSchema.safeParse(value);
  if (!parsed.success) return null;
  // Le cast est SÛR ici et seulement ici : la forme structurelle est vérifiée juste au-dessus, et
  // les champs non validés sont ceux que le rendu traite déjà comme optionnels.
  const artefact = parsed.data as unknown as DecisionArtifactV1;

  // Le snapshot, en seconde passe. Illisible, il TOMBE ; il n'emporte pas la décision avec lui.
  const brut = (value as { dataSnapshot?: unknown })?.dataSnapshot;
  if (brut === undefined) return artefact;
  const snapshot = dataSnapshotSchema.safeParse(brut);
  if (!snapshot.success) {
    console.warn("[artefact] dataSnapshot illisible, ignoré", { generatedAt: artefact.generatedAt });
    return { ...artefact, dataSnapshot: undefined };
  }
  return { ...artefact, dataSnapshot: snapshot.data };
}

/** L'emballage, au moment de la génération. Aucune I/O : l'appelant écrit. */
export function buildDecisionArtifact(
  dossier: Dossier, projectSnapshot: UserProject, generatedAt: string, conventionsVersion: string,
  dataSnapshot?: DataSnapshot,
): DecisionArtifactV1 {
  return {
    schemaVersion: 1,
    generatedAt,
    engineVersion: ENGINE_VERSION,
    conventionsVersion,
    projectSnapshot,
    dossier,
    // `undefined` plutôt qu'un objet vide : `stableStringify` refuse `undefined`, et un
    // `dataSnapshot: {}` ferait croire, à la relecture, qu'on a figé quelque chose.
    ...(dataSnapshot && Object.keys(dataSnapshot).length > 0 ? { dataSnapshot } : {}),
  };
}

/**
 * LA CLÉ D'UN ARTEFACT, identique à celle de `decision_narrative` : la commune ne suffit pas.
 * Le projet évolue, la lecture passe de la commune à l'adresse, et une commune peut porter
 * plusieurs adresses.
 */
export function artifactScopeKey(dossierId: string | null): string {
  return dossierId ? `logement:${dossierId}` : "commune";
}

export type ArtifactStatus = "generating" | "ready" | "failed";

/**
 * L'ÉTAT D'UN SCOPE : ce qu'on SERT, et où en est la dernière TENTATIVE. Les deux, séparément.
 *
 * ── POURQUOI DEUX AXES ET NON UN (revue du 12/08/2026) ───────────────────────────────────────
 * Ce type portait une `version` + un `status` (ceux de la ligne retenue) et un `versionPlusRecente`
 * qui valait dès qu'une version plus haute n'était pas servable, SANS dire pourquoi. Les appelants
 * ne pouvaient donc pas distinguer « une génération est en cours » de « la dernière a échoué », et
 * traitaient les deux comme « déjà en cours » : après une v2 en échec, chaque clic sur « mettre à
 * jour » répondait `ok` et aucune v3 ne naissait jamais. Le même repli faisait retenter au recalcul
 * DPE le numéro DÉJÀ RÉSERVÉ, que la contrainte unique refusait aussitôt.
 *
 * Le contrat est donc explicite :
 *   - `servedVersion` / `artifact` / `generatedAt` : la dernière version PRÊTE et relue. C'est ce
 *     que le lecteur voit, et ce qu'une v2 ratée ne doit jamais masquer.
 *   - `headVersion` / `headStatus` : la dernière TENTATIVE, quel que soit son sort. C'est elle qui
 *     dit s'il faut attendre (`generating`) ou si le numéro suivant est libre (`failed`, `ready`).
 *
 * Le type vit ICI, dans la lib pure, pour que les décisions ci-dessous soient testables sans
 * `server-only` (patron de `comparateur-scores.ts`).
 */
export type StoredArtifact = {
  /** Le numéro de la version servie, ou `null` : aucune version prête et relisible. */
  servedVersion: number | null;
  /** Nul quand aucune version n'est prête, ou quand son contenu ne s'est pas relu. */
  artifact: DecisionArtifactV1 | null;
  /** La date de la version SERVIE. Nulle quand il n'y en a pas. */
  generatedAt: string | null;
  /**
   * La dernière tentative, prête ou non. Toujours >= `servedVersion`, et son statut vient de LA
   * MÊME LIGNE que son numéro (revue du 12/08/2026) : deux lectures parallèles pouvaient sinon
   * composer un couple qui n'a jamais existé, `headVersion` d'une ligne et `headStatus` d'une autre.
   */
  headVersion: number;
  headStatus: ArtifactStatus;
  /** Quand la tentative de tête a été RÉSERVÉE. Sert à détecter une génération abandonnée. */
  headCreatedAt: string | null;
};

/** Une ligne de `decision_artifact`, telle que la base la rend. */
export type ArtifactRow = {
  version: number;
  status: ArtifactStatus;
  generatedAt: string | null;
  createdAt: string | null;
  payload: unknown;
};

/**
 * L'ÉTAT, DÉDUIT DES LIGNES. Pure et sans I/O, pour être testable sur les transitions qui comptent :
 * `ready` + `generating`, `ready` + `failed`, payload invalide, plusieurs échecs d'affilée,
 * génération abandonnée.
 *
 * ── UNE SEULE LISTE, ET LA TÊTE EN FAIT PARTIE ───────────────────────────────────────────────
 * La fonction prenait la tête à part. Les deux requêtes du store partant en parallèle, une version
 * qui se terminait entre les deux apparaissait dans l'une sans l'autre, et l'état composé annonçait
 * « v2 prête » tout en servant la v1 : une demande concurrente réservait alors une v3 inutile. Ici,
 * toutes les lignes entrent dans la même liste, la tête EST la ligne de version maximale, et son
 * statut vient d'elle.
 *
 * Une même version peut arriver deux fois, lue par les deux requêtes à un instant différent. On
 * garde alors la forme la plus avancée : les statuts ne reculent jamais (`generating` → `ready` |
 * `failed`, tous deux terminaux), donc une ligne non `generating` est toujours la plus récente.
 *
 * Rend `null` quand il n'y a aucune ligne, ce qui veut dire « ce scope n'a jamais eu d'artefact »
 * et ne se confond avec aucun échec.
 */
export function etatArtefact(lignes: ArtifactRow[]): StoredArtifact | null {
  const parVersion = new Map<number, ArtifactRow>();
  for (const ligne of lignes) {
    const connue = parVersion.get(ligne.version);
    if (!connue || connue.status === "generating") parVersion.set(ligne.version, ligne);
  }
  const triees = [...parVersion.values()].sort((a, b) => b.version - a.version);
  const head = triees[0];
  if (!head) return null;

  for (const ligne of triees) {
    if (ligne.status !== "ready") continue;
    const artefact = parseDecisionArtifact(ligne.payload);
    if (!artefact) continue;
    return {
      servedVersion: ligne.version, artifact: artefact, generatedAt: artefact.generatedAt,
      headVersion: head.version, headStatus: head.status, headCreatedAt: head.createdAt,
    };
  }
  return {
    servedVersion: null, artifact: null, generatedAt: null,
    headVersion: head.version, headStatus: head.status, headCreatedAt: head.createdAt,
  };
}

/**
 * LE BAIL D'UNE GÉNÉRATION : au-delà, on considère qu'elle ne finira jamais.
 *
 * ── POURQUOI UNE ÉCHÉANCE (revue du 12/08/2026) ──────────────────────────────────────────────
 * `generating` est écrit AVANT le travail, et le travail tourne dans un `after()` ou une route
 * plafonnée à 60 s. Une fonction tuée entre la réservation et la fin laisse donc une ligne qui ne
 * changera plus jamais de statut. Sans échéance, cette ligne devenait la tête pour toujours : chaque
 * clic sur « mettre à jour » répondait « déjà en cours », et le dossier ne pouvait plus JAMAIS
 * produire de version. Le blocage qu'on vient de corriger pour l'échec existait à l'identique pour
 * l'abandon, en plus silencieux, puisque rien ne le marque en base.
 *
 * Quinze minutes : très au-dessus des 60 s de `maxDuration`, donc jamais atteint par une génération
 * qui vit encore ; assez court pour qu'un lecteur bloqué ne le reste pas une journée. Une reprise
 * après expiration ne détruit rien : elle réserve le numéro SUIVANT, et la ligne abandonnée reste en
 * base, telle qu'elle était.
 */
export const BAIL_GENERATION_MS = 15 * 60 * 1000;

/** Une génération de tête est-elle abandonnée ? Sans date lisible, on ne l'affirme JAMAIS. */
function generationAbandonnee(etat: StoredArtifact, maintenant: Date): boolean {
  if (etat.headStatus !== "generating") return false;
  if (!etat.headCreatedAt) return false;
  const depuis = Date.parse(etat.headCreatedAt);
  if (Number.isNaN(depuis)) return false;
  return maintenant.getTime() - depuis > BAIL_GENERATION_MS;
}

/**
 * LE NUMÉRO À RÉSERVER pour une nouvelle tentative, ou `null` quand il ne faut PAS en lancer.
 *
 * `null` ne signifie qu'une chose : une génération est en cours ET son bail court encore. La doubler
 * ne produirait rien, la contrainte unique de la table refusant la place. L'appelant doit alors dire
 * « en cours », jamais « abouti ».
 *
 * Une tentative ÉCHOUÉE ne bloque pas : le numéro suivant est libre, et c'est tout l'objet de la
 * correction. Une version prête non plus : c'est le cas normal d'une mise à jour demandée. Une
 * génération ABANDONNÉE non plus, passé son bail.
 *
 * `maintenant` est injecté : sans lui, l'échéance ne serait pas testable, et une règle de temps
 * qu'on ne peut pas tester est une règle qu'on ne connaît pas.
 */
export function prochaineVersionAReserver(etat: StoredArtifact | null, maintenant: Date): number | null {
  if (!etat) return 1;
  if (etat.headStatus === "generating" && !generationAbandonnee(etat, maintenant)) return null;
  return etat.headVersion + 1;
}

/**
 * COMBIEN DE TENTATIVES AUTOMATIQUES on accepte d'empiler au-dessus de la version servie.
 *
 * Un rattrapage lancé depuis un RENDU (le figement d'un dossier antérieur au lot, le recalcul après
 * dépôt d'un diagnostic) se déclenche à chaque ouverture de page. Autoriser sans limite le numéro
 * suivant ferait, sur une panne durable, une version morte par rechargement : la table grossirait
 * indéfiniment sans qu'aucune ne se termine. Au-delà de ce plafond, la page continue de servir ce
 * qu'elle a et attend une demande EXPLICITE du lecteur, qui n'est bornée que par ses clics.
 */
export const TENTATIVES_AUTOMATIQUES_MAX = 3;

/**
 * Le numéro à réserver pour une tentative AUTOMATIQUE, ou `null` : génération en cours, ou plafond
 * de tentatives atteint. La demande explicite du lecteur passe par `prochaineVersionAReserver`.
 */
export function prochaineVersionAutomatique(etat: StoredArtifact | null, maintenant: Date): number | null {
  const version = prochaineVersionAReserver(etat, maintenant);
  if (version === null || !etat) return version;
  const tentativesMortes = etat.headVersion - (etat.servedVersion ?? 0);
  return tentativesMortes >= TENTATIVES_AUTOMATIQUES_MAX ? null : version;
}

/**
 * QUEL DOSSIER LE LECTEUR VOIT, et c'est LA décision de tout ce lot.
 *
 * ── L'ARTEFACT GAGNE TOUJOURS ────────────────────────────────────────────────────────────────
 * Dès qu'une version figée existe et se relit, c'est elle qui s'affiche, MÊME SI le moteur du jour
 * conclurait autrement. C'est tout l'objet du lot : la décision du 5 août reste la décision du
 * 5 août. Un moteur amélioré produira une version 2, il ne réécrit pas la première.
 *
 * ── L'ABSENCE N'EST PAS UNE PANNE ────────────────────────────────────────────────────────────
 * Les dossiers achetés avant ce lot n'ont pas d'artefact, une génération peut avoir échoué, et un
 * dossier ouvert sans projet renseigné n'en produit pas. Dans ces cas on sert l'assemblage vivant,
 * exactement comme avant, et SANS DATE : une lecture recalculée à l'instant n'a pas d'âge, et la
 * dater ferait croire à un figement qui n'a pas eu lieu.
 *
 * Cette fonction est pure et sans I/O pour être testable : aucun module `server/` de ce dépôt ne
 * l'est, `server-only` empêchant `node --test` de les charger.
 */
export function dossierAServir<D>(
  stocke: StoredArtifact | null, assemble: D,
): { dossier: D | Dossier; generatedAt: string | null; source: "artefact" | "assemblage" } {
  const fige = stocke?.artifact ?? null;
  if (fige) return { dossier: fige.dossier, generatedAt: fige.generatedAt, source: "artefact" };
  return { dossier: assemble, generatedAt: null, source: "assemblage" };
}

/**
 * LE DIAGNOSTIC ARRIVE APRÈS LA VENTE, ET LE GEL NE PEUT PAS L'IGNORER.
 *
 * L'artefact est figé au webhook, à un instant où le client n'a PAS PU choisir son diagnostic :
 * `savedDpe` y vaut `null` par construction, le dossier venant d'être créé. Le choix se fait
 * ensuite, sur la page Logement. Sans cette règle, il n'entrait jamais dans la décision : le module
 * Logement affichait l'étiquette, la conclusion figée continuait de l'ignorer, et la carte
 * `logement.dpe-faible` (une réserve STRUCTURANTE) n'apparaissait dans aucun dossier vendu. Deux
 * moitiés du même écran disaient deux choses du même logement.
 *
 * ── CE N'EST PAS UNE ENTORSE AU GEL, C'EST SA RAISON D'ÊTRE ──────────────────────────────────
 * Le gel protège le lecteur d'une réécriture qu'il n'a pas demandée. Ici, c'est LUI qui apporte la
 * pièce. La version figée n'est pas modifiée : elle reste en base, et une version 2 est produite,
 * comme la migration 28 l'annonçait dès le premier jour.
 *
 * ── POURQUOI COMPARER DES DATES PLUTÔT QUE DES DPE ───────────────────────────────────────────
 * L'artefact ne porte pas trace du diagnostic qui l'a nourri, et le lui ajouter demanderait un
 * schéma de payload nouveau, donc une seconde forme à maintenir pour tous les artefacts déjà
 * vendus. « Le choix est postérieur au figement » répond exactement à la question posée : un
 * artefact ne peut pas avoir vu une pièce déposée après lui. La règle couvre du même coup la
 * CORRECTION d'un diagnostic, qui repose une date plus récente.
 *
 * Les statuts sans diagnostic (`not_in_list`, `not_found`) ne posent pas de date : ils ne changent
 * pas la matière (`savedDpe` reste nul) et ne périment donc rien.
 *
 * ── UNE DATE ILLISIBLE NE PÉRIME JAMAIS ──────────────────────────────────────────────────────
 * L'inverse ferait régénérer à chaque ouverture, sans fin et sans trace, un dossier dont une date
 * est corrompue.
 */
export function artefactPerimeParLeDpe(
  stocke: StoredArtifact | null, dpeChoisiLe: string | null,
): boolean {
  if (!stocke?.artifact || !dpeChoisiLe) return false;
  const fige = Date.parse(stocke.artifact.generatedAt);
  const choisi = Date.parse(dpeChoisiLe);
  if (Number.isNaN(fige) || Number.isNaN(choisi)) return false;
  return choisi > fige;
}
