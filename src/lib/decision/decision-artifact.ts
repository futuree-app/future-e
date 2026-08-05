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
): DecisionArtifactV1 {
  return {
    schemaVersion: 1,
    generatedAt,
    engineVersion: ENGINE_VERSION,
    conventionsVersion,
    projectSnapshot,
    dossier,
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
