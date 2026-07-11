# Spec — Persister le projet de l'utilisateur au compte (clé de voûte)

**Date** : 2026-07-11 · **Branche cible** : `feat/user-project-persistance` (depuis `main`) · **Statut** : design validé par le porteur, à planifier.

Prolonge `docs/vault/arbitrages/moat-assemblage-largeur-en-tunnel.md` (le payant vend la décision,
personnalisée par le projet). Piste produit liée : `docs/vault/recherches/ou-chercher-dans-cette-ville.md`.

## Problème

Le texte libre saisi sur `/ou-vivre` est parsé en `ParsedProject` (reformulation + contraintes dures
+ préférences pondérées), le signal de projet le plus riche que futur•e capte. Il est stocké
**uniquement dans le `localStorage`** du navigateur (`OuVivreClient.tsx`, `SESSION_KEY`), sur une page
**publique**. Il n'est jamais persisté au compte : perdu au changement d'appareil, au vidage du cache,
ou pour qui arrive sans passer par `/ou-vivre`. L'architecture « décision motivée » (Section 1 « Votre
projet tel que nous l'avons compris ») n'a donc rien de fiable sur quoi s'appuyer.

## Scope

**DANS (v1) :**
- Un objet `UserProject` persistant au compte, avec une **posture** et un payload.
- La posture `recherche` complètement remplie (payload = `ParsedProject`, déjà mûr).
- Le sync `localStorage → compte` depuis `/ou-vivre` (pattern `WizardAnswersSync`).
- Le comblement du trou : sur `/rapport`, si aucun projet, une invitation à le décrire (texte libre →
  `/parse`).
- L'affichage de la reformulation sur `/rapport`, éditable (ré-`/parse`).

**HORS, et pourquoi :**
- **Brancher le projet sur la génération du rapport** (tri par matérialité, éliminatoires, Section 1
  motivée) : c'est le chantier suivant. Ici on capte / persiste / affiche / édite. Mélanger les deux
  ne livrerait ni l'un ni l'autre.
- **Remplir les postures `adresse`, `habitant`, `recherche_quartier`** : réservées dans le type, leur
  payload se conçoit avec leur rapport. `rawText` les couvre déjà (on garde ce que la personne écrit).
- **Plusieurs projets par compte** : un objet par compte suffit (YAGNI). Migration vers une table le
  jour où le multi-projet arrivera.

## Doctrine

**On garde le brut à côté du parsé.** `rawText` survit à `parsed`, pour re-parser si le prompt évolue
sans perdre ce que la personne a écrit (comme DVF garde la source sous la version).

**Le silence honnête.** Sans projet, le rapport reste lisible et le dit (« lecture non personnalisée,
faute de projet déclaré »). L'invitation n'est jamais bloquante.

**Auditable.** La reformulation affichée est corrigeable ; éditer relance `/parse`. Le lecteur voit la
prémisse et peut la réfuter.

**Fire-and-forget.** Le sync n'interrompt jamais un parcours. Un échec laisse l'objet en `localStorage`
et retente à la page connectée suivante, exactement comme `WizardAnswersSync`.

## Architecture

**Le type (lib pure `src/lib/user-project.ts`, testée).**

```ts
export type ProjectPosture = "recherche" | "adresse" | "habitant" | "recherche_quartier";
export type ProjectIntent = "achat" | "location"; // posture "adresse"

export type UserProject = {
  posture: ProjectPosture;
  intent?: ProjectIntent | null;
  rawText: string | null;              // texte libre tel que saisi (survit au parse)
  parsed: ParsedProject | null;        // /parse ; rempli pour la posture "recherche"
  updatedAt: string;                   // ISO
};

// Valide et normalise un objet venu du client ou de la base. Rejette ce qui n'est pas conforme,
// ne devine jamais. `null` si irrécupérable.
export function normalizeUserProject(raw: unknown): UserProject | null;

// Fusionne une édition (nouveau rawText + nouveau parsed) dans un projet existant, en conservant
// la posture et l'intent, en réécrivant updatedAt.
export function mergeProjectEdit(prev: UserProject | null, next: { rawText: string; parsed: ParsedProject | null; posture?: ProjectPosture; intent?: ProjectIntent | null }): UserProject;
```

`ParsedProject` est importé de `comparateur-vie.ts` (type déjà partagé, pas server-only).

**La persistance : colonne `jsonb` `user_project` sur `user_profiles`.** Migration SQL calquée sur
`14_add_wizard_answers.sql`. Pas de nouvelle table (objet par compte).

**L'écriture : `/api/profile` (PATCH) étendu.** La route est un `PATCH { field, value }` où chaque
`field` fait un `update` ciblé (merge partiel natif, cf. `wizard_answers`, `commune`, `workbook_quartier`).
On ajoute deux `field` :
- `field: "user_project"` : édition explicite, validée par `normalizeUserProject` côté serveur, écrase
  toujours (chemin `/rapport`).
- `field: "user_project_if_empty"` : le sync `/ou-vivre` n'écrit **que si `user_project` est nul en
  base** (lecture puis update conditionnel), pour ne pas écraser un projet édité par un ancien
  `localStorage`. Retourne `{ success, written: boolean }`.

**Le sync `/ou-vivre` : `OuVivreProjectSync`**, calqué sur `WizardAnswersSync`. À la première page
connectée, si le `localStorage` `SESSION_KEY` contient un `parsed` et que le profil n'a pas de
`user_project`, PATCH `field: "user_project_if_empty"`, value `{ posture: "recherche", rawText, parsed }`. Fire-and-forget.

**Le comblement + l'édition sur `/rapport` : `ProjectSummaryCard`** (client). Lit `user_project`.
- Présent : affiche la reformulation + bouton « Affiner » (rouvre un champ texte, POST vers
  `/parse` puis `/api/profile`, écrase).
- Absent : une invitation « Décrivez votre projet pour une lecture qui parle de votre situation »,
  même champ texte, même chaîne `/parse` → `/api/profile`.
- `/parse` échoue ou rend un projet vide : on stocke `rawText` seul (`parsed: null`), la carte montre
  le texte brut plutôt que rien.

## Ce que le lecteur voit

Sur `/rapport`, en tête, quand le projet existe :

> **Votre projet**
> {reformulation} · *Affiner*

Sans projet : une invitation discrète, non bloquante, à le décrire. Le reste du hub (modules) inchangé.

## Erreurs et cas limites

| Cas | Comportement |
|---|---|
| `localStorage` vide (jamais fait `/ou-vivre`) | pas de sync, l'invitation s'affiche sur `/rapport` |
| profil a déjà un `user_project` | le sync `/ou-vivre` n'écrase pas ; l'édition explicite oui |
| `/parse` échoue | `parsed: null`, `rawText` conservé et affiché |
| `/api/profile` échoue (sync) | fire-and-forget, reste en `localStorage`, retente |
| objet `user_project` corrompu en base | `normalizeUserProject` rend `null`, traité comme absent |
| `/ou-vivre` non authentifié | aucun sync sur la page publique ; il a lieu à la 1re page connectée |

## Tests (lib pure, TDD)

- `normalizeUserProject` : objet valide → conservé ; posture inconnue → `null` ; `parsed` malformé →
  `parsed: null` mais `rawText` gardé ; `null`/`undefined` → `null`.
- `mergeProjectEdit` : conserve posture/intent, réécrit `rawText`/`parsed`/`updatedAt` ; sur `prev
  null` crée un projet de posture par défaut `recherche`.
- Le type accepte les quatre postures (dont `recherche_quartier` réservée) sans payload requis.

## Critères d'acceptation

1. Une recherche `/ou-vivre` faite en étant connecté se retrouve sur `/rapport` (reformulation
   affichée) après navigation, sans re-saisie.
2. Un compte sans projet voit l'invitation ; la remplir affiche la reformulation.
3. Éditer la reformulation la met à jour (ré-`/parse`), et persiste.
4. Un `/parse` en échec n'efface pas le texte saisi.
5. Le sync n'écrase jamais un projet déjà présent au compte.
6. Le rapport reste rendu, sans projet, sans erreur, avec sa mention honnête.

## Non-objectifs

- Personnaliser la génération du rapport avec le projet (chantier suivant).
- Concevoir les payloads des postures `adresse` / `habitant` / `recherche_quartier`.
- Multi-projet par compte.
- Toucher à l'auth du parcours public `/ou-vivre`.
