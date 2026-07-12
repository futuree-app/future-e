// Accès données Territoire (frontière d'intégration : importe comparateur-vie, qui est server-only,
// donc non testable en node --test). Le mapping pur vit dans module-facts-map.ts (testé). Aucune
// valeur de repli : subScore garde déjà les absences, on ne les enveloppe pas d'un try/catch (une
// erreur inattendue doit exploser, ce n'est pas une « donnée indisponible »).
import { getCommuneEntry, subScore, PREFERENCE_KEYS, type IndexCommune } from "../comparateur-vie.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import { runRules } from "./materiality-rules.ts";
import { assembleDossier } from "./decision-assembler.ts";
import type { ModuleFacts, Dossier } from "./decision-fact.ts";
import type { UserProject } from "../user-project.ts";

export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  return mapCommuneToModuleFacts(entry, scores, opts);
}

export async function loadModuleFacts(insee: string, opts: { hasAddress: boolean }): Promise<ModuleFacts | null> {
  const entry = await getCommuneEntry(insee);
  return entry ? buildModuleFacts(entry, opts) : null;
}

// Orchestrateur du hub : commune -> ModuleFacts -> règles -> assemblage. Slice 1 : hasAddress false,
// scope "commune". parsed null est géré par l'assembleur (état project_not_structured).
export async function buildCommuneDossier(insee: string, project: UserProject): Promise<Dossier | null> {
  const facts = await loadModuleFacts(insee, { hasAddress: false });
  if (!facts) return null;
  return assembleDossier(runRules(facts, project), project, "commune");
}
