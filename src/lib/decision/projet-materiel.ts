import type { UserProject } from "../user-project.ts";

// ════════════════════════════════════════════════════════════════════════════════════════════
// LE PROJET A-T-IL CHANGÉ *POUR LA DÉCISION* ?
//
// ── POURQUOI PAS UNE DATE ────────────────────────────────────────────────────────────────────
// `updatedAt` bouge à chaque écriture, y compris quand le lecteur corrige une faute de frappe dans
// son texte libre ou rouvre son projet sans rien toucher. Comparer des dates ferait donc annoncer
// « votre analyse répond à un ancien projet » sur des dossiers que rien n'a bougés, et le message
// perdrait tout son sens en une semaine.
//
// C'est aussi la leçon de `artefactPerimeParLeDpe`, qui compare bien des dates : là-bas, la date du
// CHOIX de diagnostic ne bouge que si le lecteur choisit, donc elle dit la matière. Ici, non.
//
// ── CE QUI COMPTE, ET RIEN D'AUTRE ───────────────────────────────────────────────────────────
// Ce que le moteur LIT pour conclure :
//   - `posture` : elle gouverne le bucket des gestes (`bucketDuProjet`) et la voix du verdict ;
//   - `intent` : achat ou location changent les gestes proposés ;
//   - les CONTRAINTES DURES : elles peuvent rendre un lieu incompatible ;
//   - les PRÉFÉRENCES et leur POIDS : elles décident quelles règles s'expriment, et leur matérialité.
//
// Ce qui n'y entre pas, et qu'on ignore délibérément : `rawText` et `reformulation` (le texte du
// lecteur et sa reformulation, aucune règle ne les lit), `updatedAt`, `ambiguities`, et tout ce qui
// ne sert qu'à l'affichage. Les faire compter reviendrait à périmer un dossier vendu pour une
// virgule.
//
// ── L'ABSENCE DE SNAPSHOT N'EST PAS UN CHANGEMENT ────────────────────────────────────────────
// Les artefacts d'avant le 05/08/2026 n'en portent pas. Sans point de comparaison, on ne peut RIEN
// affirmer : on se tait, plutôt que d'annoncer une obsolescence qu'on n'a pas établie.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** Les préférences, réduites à ce que le moteur lit : la clé et son poids, l'ordre en moins. */
function preferencesComparables(p: UserProject | null | undefined): string {
  const prefs = p?.parsed?.preferences ?? [];
  return [...prefs]
    .map((pref) => `${String((pref as { key?: unknown }).key ?? "")}:${String((pref as { weight?: unknown }).weight ?? "")}`)
    .sort()
    .join("|");
}

/**
 * Les contraintes dures, sérialisées de façon STABLE.
 *
 * `JSON.stringify` suffirait presque, mais l'ordre des clés d'un objet reconstruit après un
 * aller-retour JSON n'est pas garanti d'être celui d'origine : deux projets identiques
 * produiraient deux chaînes différentes, et le lecteur verrait « votre projet a changé » sans avoir
 * rien touché.
 */
function contraintesComparables(p: UserProject | null | undefined): string {
  const hc = (p?.parsed?.hardConstraints ?? {}) as Record<string, unknown>;
  return Object.keys(hc)
    .sort()
    .map((k) => `${k}=${JSON.stringify(hc[k] ?? null)}`)
    .join("|");
}

/** La signature décisionnelle d'un projet. Deux projets de même signature concluent pareil. */
export function signatureDecisionnelle(p: UserProject | null | undefined): string {
  return [
    `posture=${p?.posture ?? ""}`,
    `intent=${p?.intent ?? ""}`,
    `hard=${contraintesComparables(p)}`,
    `prefs=${preferencesComparables(p)}`,
  ].join("§");
}

/**
 * Le projet actuel diffère-t-il, POUR LA DÉCISION, de celui figé dans l'artefact ?
 *
 * `false` quand l'un des deux manque : sans point de comparaison, il n'y a rien à affirmer.
 */
export function projetAChangeMateriellement(
  snapshot: UserProject | null | undefined, actuel: UserProject | null | undefined,
): boolean {
  if (!snapshot || !actuel) return false;
  return signatureDecisionnelle(snapshot) !== signatureDecisionnelle(actuel);
}
