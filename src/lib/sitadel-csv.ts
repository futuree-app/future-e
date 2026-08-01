// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CSV DU REGISTRE DES AUTORISATIONS, LU SANS RIEN INVENTER.
//
// Troisième brique du chantier « les permis autour de l'adresse » (après `sitadel-etat.ts` qui
// déduit l'état des dates, et `sitadel-selection.ts` qui décide quoi montrer). Elle transforme la
// réponse de l'API DiDo en autorisations exploitables, et rien d'autre : aucun appel réseau ici,
// donc la lecture du format se teste sur des chaînes.
//
// ── LES COLONNES SONT DEMANDÉES, PAS SUBIES ───────────────────────────────────────────────────
// Le jeu SDES porte 94 colonnes ; on en demande DIX (`columns=` côté API, mesuré le 01/08/2026 :
// 538 Ko -> 31 Ko pour La Rochelle, 17 fois moins). Deux conséquences ici :
//
//   • aucune des dix colonnes retenues n'est du TEXTE LIBRE — ce sont des sections, des numéros,
//     une année, des dates. Un découpage sur « ; » est donc sûr : il n'y a pas de point-virgule
//     à l'intérieur d'une valeur. La seule colonne libre du jeu, l'adresse du terrain
//     (« AVENU CARNOT »), a été écartée du chantier pour une autre raison, et elle n'est jamais
//     demandée ;
//   • si l'entête ne porte pas les colonnes attendues, le format a changé. On rend alors `null`,
//     jamais une liste vide : une liste vide se lirait « aucun permis autour de cette adresse »,
//     ce qui serait une affirmation fausse tirée d'une panne.
//
// Pur, testé sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════════════════════

import { cleParcelle, type Autorisation } from "./sitadel-selection.ts";

/** Les colonnes demandées à l'API, dans l'ordre où on les documente. Rien de plus. */
export const COLONNES_SITADEL = [
  "SEC_CADASTRE1", "NUM_CADASTRE1",
  "SEC_CADASTRE2", "NUM_CADASTRE2",
  "SEC_CADASTRE3", "NUM_CADASTRE3",
  "AN_DEPOT",
  "DATE_REELLE_AUTORISATION", "DATE_REELLE_DOC", "DATE_REELLE_DAACT",
] as const;

const nettoie = (v: string | undefined): string => (v ?? "").replace(/"/g, "").trim();

/**
 * Les autorisations d'une commune.
 *
 * `null` veut dire ILLISIBLE (entête absente ou colonnes manquantes), et l'appelant doit alors
 * s'abstenir d'afficher quoi que ce soit. Un tableau vide, lui, est une réponse : la commune n'a
 * aucune autorisation dans la fenêtre demandée.
 */
export function parseSitadelCsv(csv: string): Autorisation[] | null {
  const lignes = csv.split("\n").map((l) => l.replace(/\r$/, "")).filter((l) => l.length > 0);
  if (lignes.length === 0) return null;

  const entete = lignes[0].split(";").map(nettoie);
  const idx = (nom: string) => entete.indexOf(nom);
  // La clé de lecture minimale : sans la première parcelle ni les dates, rien n'est joignable ni
  // datable, et le reste du travail porterait sur du vide.
  for (const c of ["SEC_CADASTRE1", "NUM_CADASTRE1", "AN_DEPOT", "DATE_REELLE_AUTORISATION"]) {
    if (idx(c) === -1) return null;
  }

  const iSec = [idx("SEC_CADASTRE1"), idx("SEC_CADASTRE2"), idx("SEC_CADASTRE3")];
  const iNum = [idx("NUM_CADASTRE1"), idx("NUM_CADASTRE2"), idx("NUM_CADASTRE3")];
  const iAn = idx("AN_DEPOT");
  const iAut = idx("DATE_REELLE_AUTORISATION");
  const iDoc = idx("DATE_REELLE_DOC");
  const iDaact = idx("DATE_REELLE_DAACT");

  const out: Autorisation[] = [];
  for (const ligne of lignes.slice(1)) {
    const c = ligne.split(";").map(nettoie);

    // Jusqu'à trois parcelles par dossier. Une parcelle n'est retenue que si sa section ET son
    // numéro sont là : une moitié de clé ne joint rien et, pire, `cleParcelle("", "300")` rendrait
    // une clé « |300 » qui pourrait coïncider avec une autre moitié de clé ailleurs.
    const parcelles: string[] = [];
    for (let k = 0; k < 3; k++) {
      const s = iSec[k] === -1 ? "" : c[iSec[k]];
      const n = iNum[k] === -1 ? "" : c[iNum[k]];
      if (s && n) parcelles.push(cleParcelle(s, n));
    }
    if (parcelles.length === 0) continue; // sans parcelle, le dossier n'est rattachable à rien

    const annee = Number.parseInt(c[iAn] ?? "", 10);
    if (!Number.isFinite(annee)) continue;

    out.push({
      parcelles,
      annee,
      autorisation: c[iAut] || null,
      ouvertureChantier: iDoc === -1 ? null : c[iDoc] || null,
      achevement: iDaact === -1 ? null : c[iDaact] || null,
    });
  }
  return out;
}
