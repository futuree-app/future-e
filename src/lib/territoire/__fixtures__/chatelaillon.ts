// Fixtures FUT-6 : les VRAIES entrées de Châtelaillon-Plage (17094), capturées le 28/09/2026 depuis
// les sources de production (index du comparateur, ADEME, DRIAS, Géorisques, GASPAR, VigiEau,
// littoral, ERA5), et les cinq synthèses réellement générées pendant l'audit du 27/09. Figées ici
// pour que les tests tournent sans réseau.
import { readFileSync } from "node:fs";
import type { TerritoireInputs } from "../facts.ts";

const dir = new URL(".", import.meta.url);

export function chatelaillonInputs(): TerritoireInputs {
  return JSON.parse(readFileSync(new URL("chatelaillon-17094.inputs.json", dir), "utf8")) as TerritoireInputs;
}

/** Les cinq synthèses de l'audit (horizon 2050) : toutes contredisaient l'écran. */
export function auditSyntheses(): string[] {
  return JSON.parse(readFileSync(new URL("chatelaillon-2050-syntheses-audit.json", dir), "utf8")) as string[];
}

/** Trois synthèses RÉELLES du 28/09, validées à tort par la première version des contrôles. */
export function fautivesDu28(): Record<string, { defaut: string; texte: string }> {
  return JSON.parse(readFileSync(new URL("chatelaillon-2050-fautives-28-09.json", dir), "utf8"));
}
