import type { UserProject } from "../user-project.ts";
import { declaredHardConstraintKeys } from "./project-view.ts";
import {
  hardZoneAnchorsDe, excludePlaceDeclares, nearPlaceThreshold, thresholdFrom,
} from "../hard-constraints-hydrate.ts";
import type { HardConstraints } from "../hard-constraint-schema.ts";

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

/**
 * SÉRIALISATION CANONIQUE DES CONTRAINTES DURES : clés triées à TOUS les niveaux, et tableaux
 * traités comme des ENSEMBLES.
 *
 * ── POURQUOI PAS `stableStringify` ───────────────────────────────────────────────────────────
 * Il trie récursivement les clés, mais CONSERVE l'ordre des tableaux, ce qui est le bon défaut pour
 * une fonction d'identité générale. Ici, aucun tableau de `HardConstraints` n'a d'ordre signifiant :
 * `departements`, `zones`, `excludeZones` et `excludePlace` sont des ensembles que le moteur
 * intersecte ou exclut. `["31","33"]` et `["33","31"]` désignent le même projet, et le LLM de
 * `/parse` ne garantit aucun ordre d'une extraction à l'autre.
 *
 * ── CE QUE LE TRI DE PREMIER NIVEAU LAISSAIT PASSER (revue du 12/08/2026) ────────────────────
 * Deux faux changements reproduits par la revue : le même `nearPlace` avec ses clés imbriquées
 * dans un autre ordre (`{maxKm, label}` contre `{label, maxKm}`), et les mêmes départements dans
 * un autre ordre de tableau. Dans les deux cas le lecteur voyait « votre projet a changé » sans
 * avoir rien touché, et un clic sur le bouton produisait une version n+1 identique à la n.
 *
 * SI UN JOUR une contrainte porte une liste ORDONNÉE (un classement de priorité, par exemple), elle
 * ne pourra pas passer par ici : il faudra l'exclure explicitement de la normalisation, sans quoi
 * deux projets réellement différents partageraient une signature.
 */
function canonique(v: unknown): string {
  if (v === undefined || v === null) return "null";
  // ENSEMBLE veut dire trié ET dédupliqué (revue du 12/08/2026) : le commentaire promettait un
  // ensemble, le code n'ôtait que l'ordre. `["31","31"]` et `["31"]` contraignent exactement le même
  // territoire, le moteur intersectant des ensembles ; les distinguer périmait un dossier pour une
  // répétition du parse.
  if (Array.isArray(v)) return `[${[...new Set(v.map(canonique))].sort().join(",")}]`;
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    // UNE CLÉ ABSENTE ET UNE CLÉ NULLE SONT LA MÊME CONTRAINTE, celle qu'on n'a pas. `montagne:
    // null` est d'ailleurs la forme que le parseur émet pour « pas de montagne ». Les distinguer
    // ferait dépendre la signature du chemin d'écriture : un aller-retour JSON supprime les
    // `undefined`, une construction en mémoire les conserve.
    return `{${Object.keys(o).sort()
      .filter((k) => o[k] !== undefined && o[k] !== null)
      .map((k) => `${JSON.stringify(k)}:${canonique(o[k])}`).join(",")}}`;
  }
  return JSON.stringify(v);
}

/**
 * LES CONTRAINTES QUI CONTRAIGNENT VRAIMENT, et elles seules.
 *
 * ── UNE CONTRAINTE INACTIVE N'EST PAS UNE CONTRAINTE (revue du 12/08/2026) ───────────────────
 * L'objet brut était sérialisé en entier. `{ excludeSea: false }` ou `{ nearSea: { active: false } }`
 * changeaient donc la signature, alors que l'hydratation les traite exactement comme absents : le
 * lecteur voyait « votre projet a changé », et la version n+1 qu'il demandait concluait mot pour mot
 * comme la précédente.
 *
 * ── LE FILTRE N'EST PAS RÉÉCRIT ICI, IL EST EMPRUNTÉ ─────────────────────────────────────────
 * `declaredHardConstraintKeys` est la définition déjà en place de « quelles contraintes sont
 * déclarées », et c'est celle que l'assembleur consulte pour conclure `no_hard_constraint_declared`.
 * En écrire une seconde ici en créerait une qui divergerait de la première au premier champ ajouté,
 * et la divergence se verrait en production, sur un dossier périmé à tort ou jamais périmé. La
 * signature suit donc la même liste que la conclusion, par construction.
 *
 * ── UNE FAMILLE ACTIVE PEUT PORTER DES SOUS-VALEURS INERTES (revue du 12/08/2026) ────────────
 * `declaredHardConstraintKeys` dit quelles FAMILLES contraignent, pas ce qui, dans chacune, entre
 * dans le filtre. Deux faux positifs reproduits par la revue : ajouter une ancre `preferred` à côté
 * d'une ancre `hard` (l'hydratation ne garde que les dures), et changer `nearPlace.maxKm` alors
 * qu'un `maxMinutes` valide est déclaré (le temps prime, le kilométrage n'est jamais lu).
 *
 * Les trois règles concernées sont EMPRUNTÉES à l'hydratation, jamais recopiées : `hardZoneAnchorsDe`
 * et `excludePlaceDeclares` en ont été extraites et sont maintenant appelées des deux côtés, et
 * `nearPlaceThreshold` / `thresholdFrom` sont celles-là mêmes qui produisent le seuil appliqué. Le
 * jour où « le temps prime sur la distance » change, il change en un seul endroit.
 *
 * Le reste de la valeur est comparé en entier : un seuil qui bouge (`nearSea.maxKm` de 20 à 5) est
 * un vrai changement de décision.
 */
function valeurDecisionnelle(cle: string, hc: HardConstraints): unknown {
  switch (cle) {
    case "zones":
      return hardZoneAnchorsDe(hc.zones);
    case "excludePlace":
      return excludePlaceDeclares(hc.excludePlace);
    case "nearPlace":
      // Le LABEL (qui désigne le lieu) et le SEUIL appliqué. Le mode ne compte que dans un seuil en
      // temps, où il y est déjà : sur un seuil en distance, l'hydratation ne le lit pas.
      return hc.nearPlace ? { label: hc.nearPlace.label, seuil: nearPlaceThreshold(hc.nearPlace) } : null;
    case "nearSea":
      // `active` est déjà dit par la présence de la famille ; ne reste que le seuil, qui suit la même
      // règle qu'ailleurs (un `maxKm` nul, négatif ou absent ne pose aucune limite).
      return { seuil: thresholdFrom(hc.nearSea?.maxKm) };
    default:
      return (hc as Record<string, unknown>)[cle];
  }
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
