// FUT-87 · LE PROJET DE TEST DES PROTOTYPES, lu dans l'URL. Même convention que `/dev/dossier` :
// « cle:poids,cle:poids », et `confirmer=cle` pour faire d'une priorité une condition sans compromis.
// Aucune donnée de compte : le dossier est assemblé pour une commune publique et un projet décrit dans
// l'URL.
import type { UserProject, CriterionRef } from "@/lib/user-project";
import { normalizeUserProject } from "@/lib/user-project";
import { buildConfirmation } from "@/lib/decision/conditions";
import { HARD_CONSTRAINT_KEYS, type HardConstraintKey } from "@/lib/hard-constraints";
import { PREFERENCE_LABELS } from "@/lib/comparateur-labels";

export const DEFAUT = {
  insee: "30189",
  prefs: "faible_chaleur:3,vie_locale:2,acces_soins:2,nature:2,faible_risque_inondation:2",
};

/** Les situations difficiles du prototype « Ma décision » (revue V2), toutes sur des communes publiques. */
export const CAS_DECISION: { nom: string; requete: string }[] = [
  { nom: "Cas de référence (arbitrage)", requete: `insee=${DEFAUT.insee}&prefs=${DEFAUT.prefs}` },
  { nom: "Condition sans compromis", requete: "insee=30189&prefs=proximite_mer:3,vie_locale:2,acces_soins:2&confirmer=proximite_mer" },
  { nom: "Nombreuses réserves", requete: "insee=13201&prefs=faible_chaleur:3,faible_risque_inondation:3,calme_sonore:3,air_sain:3,faible_exposition_industrielle:3,nature:2,faible_risque_feu:2" },
  { nom: "Titre long", requete: "insee=33236&prefs=faible_risque_feu:3,vie_locale:2,proximite_mer:3,acces_soins:2,acces_transports:2" },
  { nom: "Correspondance sans réserve", requete: "insee=56260&prefs=proximite_mer:3,faible_chaleur:3" },
  // Un DOSSIER D'ADRESSE réel, sur un bâtiment public (l'hôtel de ville de Nîmes) : le périmètre
  // « commune + adresse » où secteur et logement sont examinés, avec ou sans constat.
  { nom: "Dossier d'adresse (bâtiment public)", requete: `lieu=${encodeURIComponent("1 Place de l'Hôtel de Ville 30000 Nîmes")}&prefs=${DEFAUT.prefs}` },
];

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
