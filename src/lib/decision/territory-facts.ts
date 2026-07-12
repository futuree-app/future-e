// Accès données Territoire (frontière d'intégration : importe comparateur-vie, qui est server-only,
// donc non testable en node --test). Le mapping pur vit dans module-facts-map.ts (testé). Aucune
// valeur de repli : subScore garde déjà les absences, on ne les enveloppe pas d'un try/catch (une
// erreur inattendue doit exploser, ce n'est pas une « donnée indisponible »).
import { getCommuneEntry, subScore, PREFERENCE_KEYS, type IndexCommune } from "../comparateur-vie.ts";
import { mapCommuneToModuleFacts } from "./module-facts-map.ts";
import type { ModuleFacts } from "./decision-fact.ts";

export function buildModuleFacts(entry: IndexCommune, opts: { hasAddress: boolean }): ModuleFacts {
  const scores: ModuleFacts["scores"] = {};
  for (const key of PREFERENCE_KEYS) scores[key] = subScore(key, entry);
  return mapCommuneToModuleFacts(entry, scores, opts);
}

export async function loadModuleFacts(insee: string, opts: { hasAddress: boolean }): Promise<ModuleFacts | null> {
  const entry = await getCommuneEntry(insee);
  return entry ? buildModuleFacts(entry, opts) : null;
}
