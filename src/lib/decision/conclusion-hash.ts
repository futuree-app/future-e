// IDENTITÉ de l'artefact narratif. Les versions sont DANS la matière hachée, jamais concaténées
// après un hash du plan.
//
// Ce hash remplace toute pile de compteurs manuels (rulesRegistryVersion, dossierSchemaVersion,
// projectVersion) : le plan contient DÉJÀ le produit de tout cela (les fallbackText, les libellés,
// les identifiants, l'état), et un compteur qu'on oublie d'incrémenter afficherait un texte périmé
// comme s'il était courant. Le plan est purgé de tout champ volatil (observedAt, sourceMode) par
// construction (cf. conclusion-plan.ts) : sinon l'artefact s'invaliderait à chaque chargement.
//
// SERVEUR : importe sha256Hex (node:crypto). Ne jamais importer depuis un composant client.
import { stableStringify } from "../stable-stringify.ts";
import { sha256Hex } from "../server/sha256.ts";
import type { ConclusionNarrativePlan } from "./conclusion-plan.ts";

// Le schéma de sortie + les règles de validation. À bumper quand conclusion-validate change de contrat.
export const DECISION_NARRATIVE_CONTRACT_VERSION = "c1";
// Le prompt système. À bumper à chaque retouche de son texte.
// v2 (slice 2.1) : le registre des réserves porte le POIDS (le décompte est parti dans l'intertitre
// des cartes), et il n'existe plus quand aucun point ne se détache.
export const DECISION_NARRATIVE_PROMPT_VERSION = "v2";
export const DECISION_NARRATIVE_MODEL = "claude-sonnet-4-6";

export function hashPayload(
  plan: ConclusionNarrativePlan,
  over: { contractVersion?: string; promptVersion?: string; model?: string } = {},
) {
  return {
    contractVersion: over.contractVersion ?? DECISION_NARRATIVE_CONTRACT_VERSION,
    promptVersion: over.promptVersion ?? DECISION_NARRATIVE_PROMPT_VERSION,
    model: over.model ?? DECISION_NARRATIVE_MODEL,
    locale: "fr-FR",
    plan,
  };
}

export function buildConclusionHash(plan: ConclusionNarrativePlan): string {
  return sha256Hex(stableStringify(hashPayload(plan)));
}
