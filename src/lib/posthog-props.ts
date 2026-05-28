/**
 * Centralise les propriétés communes pour les événements PostHog.
 * Jamais d'adresse complète ni de donnée personnelle sensible.
 */

export function departmentFromInsee(insee: string | null | undefined): string | null {
  if (!insee || insee.length < 2) return null;
  // DOM-TOM : 971–976
  if (insee.startsWith("97")) return insee.slice(0, 3);
  return insee.slice(0, 2);
}

export type GeoContext = {
  commune?: string | null;
  inseeCode?: string | null;
  reportId?: string | null;
};

export function buildGeoProps(ctx: GeoContext) {
  return {
    commune: ctx.commune ?? null,
    insee_code: ctx.inseeCode ?? null,
    department: departmentFromInsee(ctx.inseeCode),
    report_id: ctx.reportId ?? ctx.inseeCode ?? null,
  };
}
