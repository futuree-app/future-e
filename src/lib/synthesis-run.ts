import {
  validateAssertions, correctionPourAssertions,
} from "./synthesis-guardrails.ts";
import { validateCoverageClosure, correctionPourClosure } from "./coverage-closure.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// L'ORCHESTRATION D'UNE SYNTHÈSE VÉRIFIÉE, SÉPARÉE DE LA ROUTE QUI L'APPELLE.
//
// Elle vivait dans le corps de `POST`, mêlée à l'authentification, au cache et à la persistance :
// aucune de ses garanties n'était donc testable, et ce sont pourtant elles qui portent le chantier
// (revue du 11/08/2026). Ce que ce module promet, et que la route ne peut plus défaire seule :
//
//   1. un texte n'est rendu que s'il passe TOUS les contrôles ;
//   2. une relance a lieu, et une seule, avec la correction qui cite le passage en cause ;
//   3. un second échec REFUSE, il ne laisse pas passer ;
//   4. un refus ne se confond pas avec une panne du fournisseur, ni l'inverse ;
//   5. rien de refusé ne remonte à l'appelant, donc rien de refusé ne peut être persisté.
//
// La génération est injectée : ce module ne connaît ni le modèle, ni le prompt, ni le réseau.
// ════════════════════════════════════════════════════════════════════════════════════════════

export type SynthesisRefus = { raison: string; detail: string };

export type SynthesisOutcome =
  | { status: "ok"; texte: string; essais: number }
  /** Le fournisseur n'a rien rendu (panne, coupure). Distinct d'un texte refusé. */
  | { status: "unavailable" }
  /** Deux textes produits, deux fois refusés. Le dernier motif porte la raison. */
  | { status: "refused"; refus: SynthesisRefus; essais: number };

export type GenerateFn = (correction: string | null) => Promise<string | null>;

/**
 * Vérifie un texte selon les deux contrats du module Logement.
 *
 * Les ASSERTIONS d'abord : elles portent sur ce que le texte affirme, quand la clôture ne regarde
 * que ce qu'il conclut des dimensions non lues. Une phrase peut être irréprochable du point de vue
 * de la couverture et inventer un mécanisme.
 */
export function verifierTexte(
  texte: string, nonLues: string[],
): { ok: true } | { ok: false; refus: SynthesisRefus; correction: string } {
  const assertions = validateAssertions(texte);
  if (!assertions.ok) {
    return {
      ok: false,
      refus: { raison: `assertion_${assertions.famille}`, detail: assertions.extrait },
      correction: correctionPourAssertions(assertions),
    };
  }
  if (nonLues.length > 0) {
    const closure = validateCoverageClosure(texte, nonLues);
    if (!closure.ok) {
      return {
        ok: false,
        refus: { raison: closure.raison, detail: closure.detail },
        correction: correctionPourClosure(closure, nonLues),
      };
    }
  }
  return { ok: true };
}

/**
 * Génère, vérifie, relance une fois, puis tranche.
 *
 * `generate` reçoit la correction à joindre au prompt (`null` au premier essai) et rend le texte,
 * ou `null` si le fournisseur n'a rien produit.
 */
export async function runValidatedSynthesis(
  generate: GenerateFn, nonLues: string[], maxEssais = 2,
): Promise<SynthesisOutcome> {
  let dernier: SynthesisRefus | null = null;
  let correction: string | null = null;
  let essais = 0;

  for (let i = 0; i < maxEssais; i++) {
    const texte = await generate(correction);
    // RIEN DE PRODUIT. Sur la première tentative c'est une panne ; après un refus, on garde le
    // refus : le texte fautif existait, et l'annoncer comme une panne inviterait le lecteur à
    // « réessayer dans un instant » là où le contenu était le problème.
    if (!texte?.trim()) {
      return dernier
        ? { status: "refused", refus: dernier, essais }
        : { status: "unavailable" };
    }
    essais = i + 1;

    const verdict = verifierTexte(texte, nonLues);
    if (verdict.ok) return { status: "ok", texte, essais };

    dernier = verdict.refus;
    correction = verdict.correction;
  }

  return { status: "refused", refus: dernier!, essais };
}
