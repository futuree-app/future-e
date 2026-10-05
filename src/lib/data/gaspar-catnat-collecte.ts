// ════════════════════════════════════════════════════════════════════════════════════════════
// LA COLLECTE GASPAR DE L'INDEX : UN INSTANTANÉ ENTIER, DATÉ, OU RIEN (FUT-60, 05/10/2026)
//
// ── LE DÉFAUT QUE CE MODULE FERME ────────────────────────────────────────────────────────────
// `scripts/populate-inondation.py` ne réinterrogeait JAMAIS une commune déjà dans son cache : le cache
// était devenu un stockage définitif, sans date. Toulouse y valait 19 quand GASPAR en compte 20
// (inondation du 08/02/2026). Relancer le script donnait l'impression de rafraîchir, et ne
// rafraîchissait rien. Il interrogeait aussi Paris, Lyon et Marseille par arrondissement, où GASPAR
// ne répond rien : 45 faux zéros.
//
// ── CE QUE CE MODULE GARANTIT ────────────────────────────────────────────────────────────────
// 1. Une collecte est un INSTANTANÉ : toutes les communes interrogées dans la même passe, avec une
//    date de début et de fin. L'index ne reçoit un instantané que s'il est COMPLET.
// 2. Une panne ne produit jamais un zéro : un lot en échec n'écrit aucun compte, il reste à faire.
//    `reprendre` ne refait que ce qui manque à la collecte EN COURS ; une nouvelle collecte repart
//    de rien, et ne réutilise aucune valeur d'une collecte précédente.
// 3. Le rang national se calcule sur les comptes d'UN SEUL instantané : jamais une mosaïque de
//    valeurs de dates différentes.
// 4. GASPAR s'interroge à SON grain (`codeGaspar` : Paris, Lyon, Marseille à la ville).
// 5. Une seule taxonomie : un compte « inondation » est le groupe « Inondations » de
//    `simplifyCatnatRisk`, celui que la carte et la synthèse affichent.
//
// Module PUR : aucun réseau, aucun fichier. Le script `scripts/gaspar/collecter-catnat.mts` fait
// l'I/O par-dessus.
// ════════════════════════════════════════════════════════════════════════════════════════════
import { codeGaspar, simplifyCatnatRisk } from "../georisques-flags.ts";

/** L'API refuse au-delà (« Le nombre de codes Insee à traiter ne doit pas dépasser 20 »). */
export const TAILLE_LOT = 20;

export const SOURCE_GASPAR_CATNAT = "Géorisques, API v1 /gaspar/catnat (lots de 20 codes INSEE)";

export type LigneGaspar = { code_insee?: string | null; libelle_risque_jo?: string | null };

export type Collecte = {
  version: 1;
  /** Début de la collecte (ISO). Toutes ses valeurs datent de [debut, fin]. */
  debut: string;
  /** Date du dernier lot réussi (ISO), `null` tant qu'aucun lot n'a abouti. */
  dernierLot: string | null;
  /** Lignes inondation par CODE GASPAR (et non par entrée d'index). Absent = pas encore obtenu. */
  comptes: Record<string, number>;
  /** Codes dont le dernier essai a échoué : à refaire, jamais comptés zéro. */
  echecs: string[];
};

export function nouvelleCollecte(maintenant: string): Collecte {
  return { version: 1, debut: maintenant, dernierLot: null, comptes: {}, echecs: [] };
}

/** Les codes à interroger pour couvrir l'index : un par code GASPAR, triés, sans doublon. */
export function codesAInterroger(insees: string[]): string[] {
  return [...new Set(insees.map(codeGaspar))].sort();
}

export function lotsDe(codes: string[], taille = TAILLE_LOT): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < codes.length; i += taille) out.push(codes.slice(i, i + taille));
  return out;
}

/** Ce qui reste à obtenir pour la collecte en cours (reprise) : jamais ce qui est déjà acquis. */
export function codesRestants(collecte: Collecte, codes: string[]): string[] {
  return codes.filter((c) => !(c in collecte.comptes));
}

/**
 * Un lot RÉUSSI : chaque code du lot reçoit son compte, ZÉRO compris quand GASPAR n'a aucune ligne
 * pour lui (une réponse valide sans ligne est une absence attestée). Seules les lignes du groupe
 * « Inondations » comptent.
 */
export function enregistrerLot(collecte: Collecte, codes: string[], lignes: LigneGaspar[], maintenant: string): Collecte {
  const comptes = { ...collecte.comptes };
  for (const c of codes) comptes[c] = 0;
  for (const l of lignes) {
    const c = l.code_insee ?? "";
    if (!codes.includes(c)) continue;
    if (simplifyCatnatRisk(l.libelle_risque_jo ?? "") === "Inondations") comptes[c] = comptes[c]! + 1;
  }
  return { ...collecte, comptes, dernierLot: maintenant, echecs: collecte.echecs.filter((c) => !codes.includes(c)) };
}

/** Un lot EN ÉCHEC : aucun compte écrit, les codes restent à faire. */
export function enregistrerEchec(collecte: Collecte, codes: string[]): Collecte {
  return { ...collecte, echecs: [...new Set([...collecte.echecs, ...codes])].sort() };
}

export function collecteComplete(collecte: Collecte, codes: string[]): boolean {
  return codesRestants(collecte, codes).length === 0;
}

/**
 * Rang national (0-100, plus haut = plus de reconnaissances), formule du script historique :
 * part des communes dont le compte est inférieur ou égal, arrondie. Calculé sur UN instantané.
 */
export function rangsNationaux(comptes: number[]): (n: number) => number {
  const tri = [...comptes].sort((a, b) => a - b);
  const total = tri.length;
  return (n: number) => {
    let lo = 0, hi = total;
    while (lo < hi) { const m = (lo + hi) >> 1; if (tri[m]! <= n) lo = m + 1; else hi = m; }
    return total ? Math.round((100 * lo) / total) : 0;
  };
}

export type MetaGasparCatnat = {
  source: string;
  collecte_debut: string;
  collecte_fin: string;
  statut: "complete";
  unite: string;
  codes_interroges: number;
  communes_index: number;
  lignes_inondation: number;
  convention: string;
};

type EntreeIndex = { insee: string; inondation?: { catnat: number; tri?: boolean; risque: number } | null; [k: string]: unknown };
type Index = { meta?: Record<string, unknown>; communes: EntreeIndex[] };

export type Ecarts = { communesModifiees: number; exemples: string[]; lignesAvant: number; lignesApres: number };

/**
 * APPLIQUE UN INSTANTANÉ COMPLET à l'index, ou refuse. Rend un NOUVEL index (l'ancien n'est pas
 * modifié) : l'appelant ne l'écrit qu'après cette validation, de façon atomique.
 */
export function appliquerCollecte(index: Index, collecte: Collecte, convention: string): { index: Index; ecarts: Ecarts } {
  const codes = codesAInterroger(index.communes.map((c) => c.insee));
  const manquants = codesRestants(collecte, codes);
  if (manquants.length > 0) {
    throw new Error(`Collecte incomplète : ${manquants.length} code(s) GASPAR sans réponse (${manquants.slice(0, 5).join(", ")}…). L'index publié reste inchangé.`);
  }
  if (!collecte.dernierLot) throw new Error("Collecte sans aucun lot réussi.");
  const compteDe = (insee: string) => collecte.comptes[codeGaspar(insee)]!;
  const rang = rangsNationaux(index.communes.map((c) => compteDe(c.insee)));
  let communesModifiees = 0, lignesAvant = 0, lignesApres = 0;
  const exemples: string[] = [];
  const communes = index.communes.map((c) => {
    const n = compteDe(c.insee);
    const avant = c.inondation?.catnat ?? null;
    lignesAvant += avant ?? 0;
    lignesApres += n;
    if (avant !== n) {
      communesModifiees++;
      if (exemples.length < 10) exemples.push(`${c.insee} ${String(c.nom ?? "")} : ${avant ?? "—"} → ${n}`);
    }
    return { ...c, inondation: { catnat: n, tri: c.inondation?.tri ?? false, risque: rang(n) } };
  });
  const meta: MetaGasparCatnat = {
    source: SOURCE_GASPAR_CATNAT,
    collecte_debut: collecte.debut,
    collecte_fin: collecte.dernierLot,
    statut: "complete",
    unite: "lignes GASPAR du groupe Inondations (un arrêté × un phénomène × un événement), submersion marine exclue",
    codes_interroges: codes.length,
    communes_index: index.communes.length,
    lignes_inondation: Object.values(collecte.comptes).reduce((s, n) => s + n, 0),
    convention,
  };
  const sources = { ...((index.meta?.sources as Record<string, unknown>) ?? {}), gaspar_catnat: meta };
  return {
    index: { ...index, meta: { ...(index.meta ?? {}), sources }, communes },
    ecarts: { communesModifiees, exemples, lignesAvant, lignesApres },
  };
}
