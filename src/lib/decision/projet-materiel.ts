import type { UserProject } from "../user-project.ts";
import { declaredHardConstraintKeys } from "./project-view.ts";
// L'EMPREINTE D'UN CRITÈRE vit dans `criterion-value.ts` (FUT-7) : la confirmation d'une condition s'y
// épingle, et elle ne doit jamais diverger de ce qui périme un dossier vendu.
import { canonique, valeurDecisionnelle } from "./criterion-value.ts";
import { confirmedCriteria } from "./conditions.ts";

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

/**
 * Les préférences, réduites à ce que le moteur lit : la clé et son poids, l'ordre en moins.
 *
 * LA PREMIÈRE OCCURRENCE D'UNE CLÉ GAGNE, comme chez le moteur (revue du 12/08/2026). Sans cette
 * réduction, deux projets portant `[{chaleur,1},{chaleur,3}]` et `[{chaleur,3},{chaleur,1}]`
 * signaient pareil (les couples sont triés) alors que `preferenceWeight`, qui lit par `find`,
 * applique 1 dans un cas et 3 dans l'autre : un vrai changement de décision restait invisible.
 * `normalizeUserProject` canonise désormais à l'entrée ; ceci couvre les projets figés AVANT elle,
 * dans les artefacts déjà vendus, qu'aucune normalisation ne repassera.
 */
function preferencesComparables(p: UserProject | null | undefined): string {
  const prefs = p?.parsed?.preferences ?? [];
  const vues = new Set<string>();
  const couples: string[] = [];
  for (const pref of prefs) {
    const key = String((pref as { key?: unknown }).key ?? "");
    if (vues.has(key)) continue;
    vues.add(key);
    couples.push(`${key}:${String((pref as { weight?: unknown }).weight ?? "")}`);
  }
  return couples.sort().join("|");
}

function contraintesComparables(p: UserProject | null | undefined): string {
  const hc = p?.parsed?.hardConstraints;
  if (!p || !hc) return "";
  return declaredHardConstraintKeys(p)
    .slice()
    .sort()
    .map((k) => `${k}=${canonique(valeurDecisionnelle(k, hc))}`)
    .join("|");
}

/**
 * La signature décisionnelle d'un projet. Deux projets de même signature concluent pareil.
 *
 * `structure` N'EST PAS REDONDANT avec le reste (revue du 12/08/2026). `conclusionState` commence
 * par `isStructured`, c'est-à-dire par `parsed != null`, et rend `project_not_structured` : un
 * projet en texte libre et un projet structuré SANS aucune contrainte ni préférence donnaient la
 * même signature (`hard` et `prefs` vides des deux côtés) alors que le premier conclut « projet non
 * structuré » et le second « aucune contrainte déclarée ». Passer de l'un à l'autre change ce que le
 * lecteur lit, et ne périmait rien.
 */
export function signatureDecisionnelle(p: UserProject | null | undefined): string {
  return [
    `posture=${p?.posture ?? ""}`,
    `intent=${p?.intent ?? ""}`,
    `structure=${p?.parsed != null}`,
    `hard=${contraintesComparables(p)}`,
    `prefs=${preferencesComparables(p)}`,
    // FUT-7 : CONFIRMER OU RETIRER UNE CONDITION CHANGE LA DÉCISION (un critère devient, ou cesse d'être,
    // éliminatoire). Seules les confirmations VALIDES comptent : une confirmation périmée ne vaut plus,
    // et sa présence ne change rien à ce que le moteur conclut. Un projet sans condition signe ce segment
    // vide, des deux côtés : les dossiers figés avant FUT-7 ne se déclarent pas périmés pour autant.
    `conditions=${p ? confirmedCriteria(p).map((r) => `${r.kind}:${r.key}${r.instance ? `:${r.instance}` : ""}`).sort().join(",") : ""}`,
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
