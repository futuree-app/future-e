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
  // Le snapshot de données est OPTIONNEL et vérifié champ par champ : un artefact antérieur au lot
  // n'en a pas, et un artefact dont ce bloc serait illisible doit rester servable (le repli sur
  // l'index courant est dégradé, pas cassé).
  dataSnapshot: z.object({
    catnatInondation: z.object({
      count: z.number().int().nonnegative(),
      depuis: z.number().int(),
      origine: z.literal("index_local"),
      insee: z.string().nullable(),
      version: z.string().min(1),
    }).optional(),
  }).optional(),
});

export function parseDecisionArtifact(value: unknown): DecisionArtifactV1 | null {
  const parsed = artifactSchema.safeParse(value);
  if (!parsed.success) return null;
  // Le cast est SÛR ici et seulement ici : la forme structurelle est vérifiée juste au-dessus, et
  // les champs non validés sont ceux que le rendu traite déjà comme optionnels.
  return parsed.data as unknown as DecisionArtifactV1;
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

/** Ce que la base rend, une fois le payload validé. Le type vit ICI, dans la lib pure, pour que la
 *  décision ci-dessous soit testable sans `server-only` (patron de `comparateur-scores.ts`). */
export type StoredArtifact = {
  version: number;
  status: ArtifactStatus;
  generatedAt: string | null;
  /** Nul quand le statut n'est pas `ready`, ou quand le contenu ne s'est pas relu. */
  artifact: DecisionArtifactV1 | null;
};

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
