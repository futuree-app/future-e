import type { IndexCommune } from "./comparateur-vie.ts";

// Valide la structure racine (objet { communes: [...] }) au lieu de caster : un
// cast satisferait TS mais pourrait retourner le mauvais niveau. Module PUR
// (aucun server-only) : testable en isolation.
export function payloadFromText(text: string): { communes: IndexCommune[]; meta: Record<string, unknown> } {
  const parsed: unknown = JSON.parse(text);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { communes?: unknown }).communes)
  ) {
    throw new Error("Index comparateur invalide : propriété communes absente.");
  }
  const meta = (parsed as { meta?: unknown }).meta;
  return {
    communes: (parsed as { communes: IndexCommune[] }).communes,
    meta: typeof meta === "object" && meta !== null ? (meta as Record<string, unknown>) : {},
  };
}

export function communesFromPayload(text: string): IndexCommune[] {
  return payloadFromText(text).communes;
}
