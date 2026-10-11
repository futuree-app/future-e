// FUT-87 · LE PROJET DE TEST DES PROTOTYPES, lu dans l'URL. Même convention que `/dev/dossier` :
// « cle:poids,cle:poids ». Aucune donnée de compte : le dossier est assemblé pour une commune
// publique et un projet décrit dans l'URL.
import type { UserProject } from "@/lib/user-project";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";

export const DEFAUT = {
  insee: "30189",
  prefs: "faible_chaleur:3,vie_locale:2,acces_soins:2,nature:2,faible_risque_inondation:2",
};

export function projetDeTest(prefsBrutes: string): { projet: UserProject; libelles: string[] } {
  const prefs = prefsBrutes.split(",").map((x) => x.trim()).filter(Boolean).flatMap((m) => {
    const [key, poids] = m.split(":");
    if (!key || !(key in PREFERENCE_LABELS)) return [];
    const weight = Number(poids ?? 3);
    return [{ key, weight: Number.isFinite(weight) ? weight : 3 }];
  });
  const projet = {
    posture: "recherche", intent: null, rawText: null, updatedAt: "1970-01-01T00:00:00.000Z",
    parsed: { reformulation: "projet de test", hardConstraints: {}, preferences: prefs },
  } as unknown as UserProject;
  return { projet, libelles: prefs.map((p) => PREFERENCE_LABELS[p.key as keyof typeof PREFERENCE_LABELS] ?? p.key) };
}
