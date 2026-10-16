// LE PROJET DE TEST : une ou plusieurs priorités pondérées, « cle:poids,cle:poids », et `confirmer=cle` pour
// faire d'une priorité une condition sans compromis. Aucune donnée de compte. Déplacé depuis
// `src/app/dev/fut87/projet-de-test.ts` (FUT-50, 16/10/2026) : la lecture publique de l'accueil s'en sert pour
// interroger UNE règle du moteur, et un module de `src/lib` ne dépend pas d'une page de développement.
import type { UserProject, CriterionRef } from "../user-project.ts";
import { normalizeUserProject } from "../user-project.ts";
import { buildConfirmation } from "./conditions.ts";
import { HARD_CONSTRAINT_KEYS, type HardConstraintKey } from "../hard-constraints.ts";
import { PREFERENCE_LABELS } from "../comparateur-labels.ts";

export function projetDeTest(prefsBrutes: string, confirmer = ""): { projet: UserProject; libelles: string[] } {
  const prefs = prefsBrutes.split(",").map((x) => x.trim()).filter(Boolean).flatMap((m) => {
    const [key, poids] = m.split(":");
    if (!key || !(key in PREFERENCE_LABELS)) return [];
    const weight = Number(poids ?? 3);
    return [{ key, weight: Number.isFinite(weight) ? weight : 3 }];
  });
  const brut = {
    posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "projet de test", hardConstraints: {}, preferences: prefs },
  } as unknown as UserProject;
  const base = normalizeUserProject(brut) ?? brut;
  // Même mécanique que `/dev/dossier` : une confirmation construite par le moteur, jamais un drapeau
  // posé à la main.
  const conditions = confirmer.split(",").map((x) => x.trim()).filter(Boolean).flatMap((entree) => {
    const [cle, instance] = entree.split(":");
    const ref: CriterionRef = (HARD_CONSTRAINT_KEYS as string[]).includes(cle!)
      ? { kind: "hard", key: cle as HardConstraintKey, instance: instance ?? null }
      : { kind: "preference", key: cle as never };
    const c = buildConfirmation(base, ref, "2026-10-01T00:00:00.000Z");
    return c ? [c] : [];
  });
  const projet: UserProject = conditions.length > 0 ? { ...base, conditions } : base;
  return { projet, libelles: prefs.map((p) => PREFERENCE_LABELS[p.key as keyof typeof PREFERENCE_LABELS] ?? p.key) };
}
