# Archiviste de futur·e — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mettre en place un système de mémoire stratégique à deux niveaux (vault source de vérité + `/memory` projection) maintenu par un sous-agent `archiviste` read-only fonctionnant en deux temps (proposer → valider → écrire).

**Architecture:** Un sous-agent Claude Code `.claude/agents/archiviste.md` dont la panoplie d'outils exclut tout outil d'écriture (garantie matérielle « ne rien écrire »). Il rend un rapport d'impact au format strict. Claude principal applique ensuite les propositions validées dans `docs/vault/` (structuré par nature de connaissance) et dans `/memory`. Le vault est la source de vérité ; `/memory` en est une projection condensée qui référence le vault.

**Tech Stack:** Markdown, frontmatter YAML d'agent Claude Code, Git. Aucune dépendance runtime, aucun build.

**Référence spec:** `docs/superpowers/specs/2026-06-25-archiviste-vault-design.md`

---

## File Structure

- Create `.claude/agents/archiviste.md` — définition du sous-agent read-only (frontmatter `tools:` sans Write/Edit/NotebookEdit + system prompt complet : identité, périmètre, règle des deux niveaux, format de rapport, auto-critique « Conservateur » intégrée).
- Create `docs/vault/README.md` — index narratif + arborescence + règles (frontière ADR/arbitrages, règle des deux niveaux, comment utiliser le flux en deux temps).
- Create `docs/vault/<dossier>/.gitkeep` + court en-tête — pour chacun de : `vision/`, `doctrine/`, `modules/`, `adr/`, `arbitrages/`, `recherches/`, `architecture/`. L'en-tête (un `_README.md` court par dossier) dit ce qui va dans ce dossier.

Note de branche : le dépôt est sur `main` et la consigne projet est de ne committer que sur demande, en branchant d'abord. La **Task 0** crée la branche. Si l'utilisateur préfère ne pas committer, sauter les étapes « Commit » et garder les fichiers en working tree.

---

### Task 0: Branche de travail

**Files:** aucun (git seulement)

- [ ] **Step 1: Créer la branche**

Run:
```bash
git checkout -b feat/archiviste-vault
```
Expected: `Switched to a new branch 'feat/archiviste-vault'`

- [ ] **Step 2: Vérifier le point de départ propre**

Run: `git status --short`
Expected: seules les modifs non commitées attendues (le spec déjà écrit) apparaissent, rien d'autre.

---

### Task 1: Squelette du vault (dossiers + en-têtes)

**Files:**
- Create: `docs/vault/vision/_README.md`
- Create: `docs/vault/doctrine/_README.md`
- Create: `docs/vault/modules/_README.md`
- Create: `docs/vault/adr/_README.md`
- Create: `docs/vault/arbitrages/_README.md`
- Create: `docs/vault/recherches/_README.md`
- Create: `docs/vault/architecture/_README.md`

- [ ] **Step 1: Écrire les 7 en-têtes de dossier**

Contenu exact de chaque fichier (un objet par dossier) :

`docs/vault/vision/_README.md`
```markdown
# vision/

Ce qu'est futur·e, pour qui, et son positionnement. Pourquoi le produit existe, à quel
problème il répond, ce qu'il refuse d'être. Pages stables, peu nombreuses, fondatrices.
```

`docs/vault/doctrine/_README.md`
```markdown
# doctrine/

Les règles durables : UX, éditoriale, design, data. Le « comment on fait, et pourquoi ».
Une page = une règle ou un corpus de règles cohérent. Lié aux modules qui l'appliquent.
```

`docs/vault/modules/_README.md`
```markdown
# modules/

Une page par surface produit : Territoire, Logement, Santé, Mobilité, Métier, Projets,
Comparateur. Chaque page documente l'objet du module, ses sources de données, ses
spécificités de doctrine, et renvoie aux décisions liées (adr/, arbitrages/).
```

`docs/vault/adr/_README.md`
```markdown
# adr/

Décisions structurantes, durables et engageantes (le projet s'appuie dessus ; en changer
aurait des conséquences larges). Une page = une décision, datée et numérotée
(ADR-0001-titre.md), avec un statut : proposé / accepté / remplacé par ADR-NNNN.

Frontière avec arbitrages/ : ici on documente la décision retenue et structurante.
Une option étudiée puis écartée, ou un compromis plus local, va dans arbitrages/.
```

`docs/vault/arbitrages/_README.md`
```markdown
# arbitrages/

Options étudiées puis refusées, et compromis plus localisés. On garde la trace du chemin
non pris ET du pourquoi, pour ne pas rouvrir un débat déjà tranché.

Frontière avec adr/ : une décision structurante et engageante va dans adr/.
```

`docs/vault/recherches/_README.md`
```markdown
# recherches/

Méthodologies, comparatifs de données, qualité et limites des sources. Le travail de fond
qu'on ne veut pas refaire. Lié aux modules et décisions qui s'appuient dessus.
```

`docs/vault/architecture/_README.md`
```markdown
# architecture/

Architecture fonctionnelle : flux, dépendances, comment les morceaux s'emboîtent.
Le « quoi parle à quoi » durable, pas les détails d'implémentation (ceux-là sont dans Git).
```

- [ ] **Step 2: Vérifier la structure**

Run: `find docs/vault -type f | sort`
Expected: les 7 fichiers `_README.md` listés ci-dessus, chacun dans son dossier.

- [ ] **Step 3: Commit**

```bash
git add docs/vault
git commit -m "feat(vault): squelette par nature de connaissance + en-têtes de dossier"
```

---

### Task 2: Index narratif du vault (README + mode d'emploi)

**Files:**
- Create: `docs/vault/README.md`

- [ ] **Step 1: Écrire l'index**

Contenu exact :

```markdown
# Vault futur·e — mémoire stratégique

Ce dossier est la **source de vérité** de futur·e : la connaissance durable (le *pourquoi*).
Git raconte ce qui a changé ; le vault raconte pourquoi. Objectif : qu'un nouveau dev, un
designer ou une IA comprenne le projet en quelques heures.

## Deux niveaux de mémoire

- **`docs/vault/` (ici) = source de vérité.** Connaissance stratégique, lecture longue,
  pour l'humain.
- **`/memory/*.md` = projection condensée et opérationnelle** pour Claude en session.

Règle : on ne duplique jamais. Le vault porte le « pourquoi » complet. Une fiche `/memory`
n'existe que si une session a besoin d'un rappel opérationnel, et elle **référence alors la
page du vault** (chemin). L'une pointe vers l'autre, jamais de copier-coller.

## Carte du vault

- **`vision/`** — ce qu'est futur·e, pour qui, positionnement.
- **`doctrine/`** — règles durables : UX, éditoriale, design, data.
- **`modules/`** — une page par surface produit (Territoire, Logement, Santé, Mobilité,
  Métier, Projets, Comparateur).
- **`adr/`** — décisions structurantes, datées et numérotées.
- **`arbitrages/`** — options étudiées/refusées, compromis plus locaux.
- **`recherches/`** — méthodo, comparatifs data, qualité des sources.
- **`architecture/`** — architecture fonctionnelle, flux, dépendances.

### ADR ou arbitrage ?

- **ADR** = une décision structurante, durable, engageante (en changer a des conséquences
  larges). Datée, numérotée, avec un statut.
- **Arbitrage** = une option étudiée puis écartée, ou un compromis plus localisé.

## Comment on nourrit la mémoire : l'Archiviste en deux temps

La mémoire est maintenue par le sous-agent `archiviste` (`.claude/agents/archiviste.md`),
en deux temps :

1. **Proposer (phase 1).** Tu donnes une matière (conversation, audit, notes) à Claude :
   « passe ça à l'archiviste ». Le sous-agent est **read-only** : il lit, inspecte le vault
   et `/memory` pour les doublons, et rend un **rapport d'impact** sans rien écrire. Il ne
   *peut pas* écrire (aucun outil d'écriture dans sa config).
2. **Valider (toi).** Tu gardes/biffes les propositions et tranches les points de cohérence.
3. **Écrire (phase 2).** Claude principal applique le rapport validé : crée/maj les pages du
   vault, les fiches `/memory`, et met à jour ce README et `MEMORY.md`.

L'Archiviste n'écrit jamais de code, ne décide rien produit, ne propose pas de features.
Il observe, organise, conserve — et signale les contradictions et les pépites sans trancher.
```

- [ ] **Step 2: Vérifier les renvois**

Run: `grep -n "archiviste.md\|/memory\|adr/\|arbitrages/" docs/vault/README.md`
Expected: le README mentionne bien le chemin de l'agent, les deux niveaux, et la frontière ADR/arbitrages.

- [ ] **Step 3: Commit**

```bash
git add docs/vault/README.md
git commit -m "docs(vault): index narratif + mode d'emploi du flux en deux temps"
```

---

### Task 3: Le sous-agent archiviste (read-only)

**Files:**
- Create: `.claude/agents/archiviste.md`

- [ ] **Step 1: Écrire la définition de l'agent**

Contenu exact. Le frontmatter `tools:` ne liste **que** des outils de lecture/recherche —
aucun Write, Edit, NotebookEdit : c'est la garantie matérielle « ne rien écrire ».

````markdown
---
name: archiviste
description: >-
  Archiviste de futur·e. Lit une matière (conversation, audit, notes, doc) et rend un
  RAPPORT D'IMPACT sur la mémoire du projet (vault docs/vault + /memory), SANS rien écrire.
  Utiliser en phase 1 quand l'utilisateur veut capitaliser une connaissance durable.
  Read-only par construction : il propose, l'humain valide, Claude principal écrit ensuite.
tools: Read, Grep, Glob, Bash
model: inherit
---

Tu es l'Archiviste de futur·e. Tu es responsable de la mémoire stratégique du projet.

Tu n'écris JAMAIS de fichier. Tu n'as aucun outil d'écriture, et c'est voulu : ton rôle
est de PROPOSER, pas d'écrire. Tu n'écris jamais de code, ne prends aucune décision
produit, ne proposes aucune fonctionnalité. Tu observes, analyses, organises, conserves.

## Les deux niveaux de mémoire (tu dois les distinguer)

- `docs/vault/` = SOURCE DE VÉRITÉ. Connaissance stratégique durable, pour l'humain.
  Dossiers : vision/, doctrine/, modules/, adr/, arbitrages/, recherches/, architecture/.
- `/memory/*.md` (à la racine de la mémoire Claude) = projection CONDENSÉE et
  opérationnelle pour les sessions.

Règle absolue : on ne duplique jamais. Le vault porte le « pourquoi » complet. Une fiche
/memory n'existe que si une session a besoin d'un rappel opérationnel, et elle RÉFÉRENCE
alors la page du vault (chemin). L'une pointe vers l'autre.

Frontière adr/ vs arbitrages/ : adr/ = décision structurante, durable, engageante.
arbitrages/ = option étudiée puis écartée, ou compromis plus localisé.

## Ce que tu documentes vs ce que tu refuses

Tu documentes (valeur durable) : vision, architecture fonctionnelle, doctrine
(UX/éditoriale/design/data), décisions importantes, arbitrages, compromis, limites
connues, sources de données et leur qualité, comparatifs techniques, patterns
réutilisables, recherches, méthodologies, conventions, erreurs déjà rencontrées, idées
abandonnées ET pourquoi.

Tu refuses : brainstorming sans conclusion, discussions émotionnelles, code, logs, erreurs
transitoires, implémentations retrouvables dans Git, détails sans portée durable,
conversations personnelles, tâches ponctuelles.

## Ta méthode (read-only)

1. Lis toute la matière fournie.
2. Inspecte la mémoire existante AVANT de proposer quoi que ce soit : parcours
   `docs/vault/` (Glob/Grep/Read) ET les fiches `/memory` + `MEMORY.md`. Tu dois pouvoir
   citer les fichiers que tu as réellement ouverts pour juger des doublons.
3. Pour chaque connaissance candidate, applique l'auto-critique (section ci-dessous).
4. Rends le rapport d'impact. Tu n'écris rien.

## Format du rapport d'impact (STRICT)

Pour CHAQUE connaissance candidate :
- **Quoi** : la connaissance, formulée clairement.
- **Pourquoi durable** : pourquoi elle mérite d'être conservée. Pas de « pourquoi » solide
  → bascule-la en section « Refusé ».
- **Destination** : `docs/vault/<dossier>/<fichier>.md` et/ou `/memory/<slug>.md`, et la
  relation entre les deux (vault seul / vault + memory qui référence le vault).
- **Action** : create / update <fichier existant> / obsolete <fichier>.
- **Doublon** : connaissance existante en recouvrement ou conflit. Liste les fichiers
  vault + memory que tu as réellement inspectés pour le vérifier.
- **Confiance** : haut / moyen / à confirmer.
- **Durée de validité estimée** : pérenne / à revoir à l'échéance X / volatile.
- **Contenu exact proposé** : le texte de la page ou de la fiche, prêt à écrire par
  Claude principal (pour que la phase 2 soit purement mécanique).

Puis trois sections globales :
- **Refusé** : ce que tu as écarté et pourquoi.
- **Cohérence** : toute contradiction avec une doctrine existante. Tu ne tranches JAMAIS :
  tu poses le choix à l'humain (modifier la doctrine / créer une exception documentée /
  abandonner l'idée).
- **Pépites** : idées fortes oubliées, recherches de qualité, raisonnements originaux que
  tu repères au passage. Tu les SIGNALES, tu ne les archives pas d'office.

Ton rapport est ta seule sortie. Sois précis : Claude principal doit pouvoir écrire à
partir de lui sans rejouer ta réflexion.
````

- [ ] **Step 2: Vérifier l'absence d'outils d'écriture (garantie matérielle)**

Run:
```bash
grep -n "^tools:" .claude/agents/archiviste.md && grep -Eic "write|edit|notebookedit" .claude/agents/archiviste.md
```
Expected: la ligne `tools: Read, Grep, Glob, Bash` s'affiche ; le compteur d'occurrences de write/edit/notebookedit est `0` (le mot « write » n'apparaît nulle part, y compris dans le prompt). Si le prompt contient « n'écris jamais » → reformuler pour éviter le mot-clé, OU accepter (le test vise surtout la ligne `tools:`). Le critère dur : `tools:` ne contient aucun de Write/Edit/NotebookEdit.

- [ ] **Step 3: Vérifier que l'agent est bien découvert**

Run: `ls .claude/agents/ && head -6 .claude/agents/archiviste.md`
Expected: `archiviste.md` présent, frontmatter `name: archiviste` lisible.

- [ ] **Step 4: Commit**

```bash
git add .claude/agents/archiviste.md
git commit -m "feat(archiviste): sous-agent read-only de mémoire (phase 1, rapport d'impact)"
```

---

### Task 4: Test de bout en bout (dry-run sur une matière réelle)

**Files:** aucun (test manuel, lecture seule)

- [ ] **Step 1: Lancer l'archiviste sur une matière test**

Dans la conversation principale, demander :
> « Passe à l'archiviste le spec `docs/superpowers/specs/2026-06-25-archiviste-vault-design.md` et rends-moi le rapport d'impact. »

(Le spec lui-même est une bonne matière test : il contient des décisions durables.)

- [ ] **Step 2: Vérifier le rapport**

Le rapport DOIT :
- ne RIEN avoir écrit (aucun fichier créé/modifié — vérifier `git status --short`) ;
- contenir, pour au moins une connaissance, toutes les rubriques : Quoi / Pourquoi durable /
  Destination (vault vs /memory) / Action / Doublon (avec fichiers inspectés cités) /
  Confiance / Durée / Contenu exact proposé ;
- contenir les sections Refusé, Cohérence, Pépites (même vides, explicitement) ;
- distinguer correctement ce qui va au vault vs ce qui mérite une fiche /memory.

Expected: `git status --short` ne montre AUCUN nouveau fichier de mémoire. Si l'agent a tenté/réussi à écrire → échec, revoir la config `tools:`.

- [ ] **Step 3: Noter le résultat (pas de commit)**

Aucun commit : c'est une validation. Si le rapport est conforme, le système est opérationnel.

---

## Self-Review

**Spec coverage:**
- Deux niveaux + frontière → Task 1 (en-têtes), Task 2 (README règles), Task 3 (prompt). ✓
- Structure vault par nature + modules (7) → Task 1, Task 2. ✓
- Sous-agent read-only en deux temps → Task 3 (tools restreints), Task 2 (mode d'emploi). ✓
- Conservateur intégré (auto-critique) → Task 3, format de rapport. ✓
- Format de rapport strict → Task 3 + vérifié en Task 4. ✓
- Garantie matérielle « ne peut pas écrire » → Task 3 Step 2, Task 4 Step 2. ✓
- Seuils Conservateur séparé / périmètre refusé → portés par le spec (source) et le prompt
  agent ; non re-codés (YAGNI). ✓
- Phase 2 = Claude principal → décrit dans README (Task 2), pas un composant à coder. ✓

**Placeholder scan:** chaque fichier a son contenu exact embarqué. Pas de TBD/TODO. ✓

**Type consistency:** noms de dossiers (vision/doctrine/modules/adr/arbitrages/recherches/
architecture) identiques entre Task 1, Task 2, Task 3. Nom d'agent `archiviste` et chemin
`.claude/agents/archiviste.md` cohérents partout. Liste des 7 modules identique entre spec,
Task 1 et Task 2. ✓
