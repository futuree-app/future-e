// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DIAGNOSTICS DU MÊME BÂTIMENT, CE QUI LES SÉPARE DE CEUX DE L'ADRESSE (FUT-80).
//
// La recherche par `id_rnb` rend AUSSI les diagnostics de l'adresse du dossier : ils sont déjà dans sa
// liste, par l'identifiant BAN. Les compter deux fois gonflerait le bloc « autres adresses » d'un
// diagnostic qui n'est pas ailleurs. Seuls restent ceux enregistrés à une AUTRE adresse, ou sans
// adresse BAN.
//
// Pur, sans `server-only`, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { dedupeAndCollapseDpe, type DpeRecord } from "./dpe-attribution.ts";

export function memeBatimentSeulement(records: DpeRecord[], banIdDuDossier: string): DpeRecord[] {
  return dedupeAndCollapseDpe(records.filter((r) => r.id_ban !== banIdDuDossier))
    .sort((a, b) => (b.date_dpe ?? "").localeCompare(a.date_dpe ?? ""));
}

/**
 * Les candidats du même bâtiment qui ne sont pas déjà dans la liste de l'adresse. La recherche par
 * adresse et celle par bâtiment se font en parallèle : un même numéro peut ressortir des deux, par
 * exemple quand l'identifiant BAN de la fiche a changé entre deux millésimes.
 */
export function horsListeDeLAdresse(memeBatiment: DpeRecord[], adresse: DpeRecord[]): DpeRecord[] {
  const vus = new Set(adresse.map((d) => d.id_dpe));
  return memeBatiment.filter((d) => !vus.has(d.id_dpe));
}

/**
 * La recherche par bâtiment, une fois retirés les diagnostics déjà listés à l'adresse. Le statut suit :
 * « présent » ne se dit que s'il RESTE un candidat. Une panne reste une panne, même sans candidat.
 */
export function memeBatimentHorsAdresse<S extends "present" | "absent" | "unavailable">(
  res: { status: S; candidates: DpeRecord[]; tronque: boolean },
  adresse: DpeRecord[],
): { status: "present" | "absent" | "unavailable"; candidates: DpeRecord[]; tronque: boolean } {
  const candidates = horsListeDeLAdresse(res.candidates, adresse);
  const status = res.status === "unavailable" ? "unavailable" : candidates.length > 0 ? "present" : "absent";
  return { status, candidates, tronque: res.tronque };
}
