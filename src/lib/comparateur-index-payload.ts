import type { IndexCommune } from "./comparateur-vie.ts";

// Valide la structure racine (objet { communes: [...] }) au lieu de caster : un
// cast satisferait TS mais pourrait retourner le mauvais niveau. Module PUR
// (aucun server-only) : testable en isolation.
export function communesFromPayload(text: string): IndexCommune[] {
  const parsed: unknown = JSON.parse(text);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { communes?: unknown }).communes)
  ) {
    throw new Error("Index comparateur invalide : propriété communes absente.");
  }
  return (parsed as { communes: IndexCommune[] }).communes;
}
