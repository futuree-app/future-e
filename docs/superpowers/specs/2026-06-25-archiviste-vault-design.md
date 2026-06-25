# Archiviste de futur·e — mémoire stratégique à deux niveaux

Date : 2026-06-25
Statut : design validé, prêt pour plan d'implémentation

## Problème

futur·e accumule des centaines d'heures de réflexion (conversations ChatGPT/Claude,
audits, recherches data, arbitrages). Git raconte *ce qui a changé*. Personne ne tient
*le pourquoi* de façon durable et navigable. On risque de refaire des recherches déjà
faites, de rouvrir des débats déjà tranchés, et de perdre la doctrine si l'équipe change.

Contrainte de départ : le projet a **déjà deux mémoires actives** qu'il ne faut pas
concurrencer avec un troisième silo.
- La mémoire Claude `/memory/*.md` (~38 fiches frontmatter + index `MEMORY.md`), nourrie
  et utilisée à chaque session.
- `docs/` (audits, specs, todos techniques).

## Objectif ultime

Dans cinq ans, un nouveau dev / designer / IA doit comprendre en quelques heures :
la vision de futur·e, son architecture, sa doctrine, ses grands arbitrages et les
raisons profondes des choix. Le vault devient la mémoire stratégique du projet.

## Décisions structurantes (tranchées en brainstorming)

1. **Deux niveaux, frontière nette, pas de troisième silo.**
   - `docs/vault/` = **source de vérité**. Connaissance stratégique durable, lecture
     longue, destinée à l'humain (futur dev/IA).
   - `/memory/` (existant) = **projection condensée et opérationnelle** pour Claude en
     session. Reste au format actuel (`name` / `description` / `metadata.type`).
   - Règle de cohérence : une connaissance n'est jamais dupliquée aux deux endroits.
     Le vault porte le « pourquoi » complet ; une fiche `/memory` ne l'accompagne que si
     une session a besoin d'un rappel opérationnel, et elle **pointe alors vers la page
     du vault** (chemin en référence). L'une référence l'autre, jamais le copier-coller.

2. **Forme : sous-agent read-only en deux temps.**
   - Phase 1 — l'agent `archiviste` **lit et propose seulement**. Il est privé des outils
     d'écriture (panoplie type `Explore` : pas de Write/Edit/NotebookEdit). « Ne rien
     écrire » est une **garantie matérielle**, pas une consigne contournable. Il ne peut
     pas corrompre la source de vérité, seulement produire un rapport d'impact.
   - Validation humaine = le sas, entre les deux passages.
   - Phase 2 — **Claude principal** applique le rapport validé. Pas de second agent :
     le rapport est déjà précis et la lecture lourde (le coûteux) a eu lieu en phase 1.
     Le contexte principal n'absorbe que le rapport compact, pas les milliers de lignes
     source.

3. **Rôle « Conservateur » intégré, pas un second agent (pour démarrer).**
   Chaque connaissance candidate du rapport arrive auto-challengée (voir format §3).
   Un Conservateur séparé ne sera créé que si l'un de ces seuils est franchi :
   - le vault dépasse ~100 pages ;
   - on observe des doublons récurrents ;
   - l'Archiviste devient trop permissif (bruit qui entre) ;
   - on veut un audit mensuel formel de la mémoire.

## 1. Structure du vault

```
docs/vault/
  README.md          # index narratif : raconte futur·e + pointe vers l'essentiel
  vision/            # ce qu'est futur·e, pour qui, positionnement
  doctrine/          # règles durables : UX, éditoriale, design, data
  modules/           # une page par surface produit (voir liste)
  adr/               # décisions structurantes datées + numérotées (ADR-0001-...)
  arbitrages/        # options étudiées/refusées, compromis plus localisés
  recherches/        # méthodo, comparatifs data, qualité des sources
  architecture/      # architecture fonctionnelle, flux, dépendances
```

Pages `modules/` à couvrir : **Territoire, Logement, Santé, Mobilité, Métier, Projets,
Comparateur**. Chaque page module documente : objet du module, sources de données,
spécificités de doctrine, décisions liées (liens vers `adr/` et `arbitrages/`).

Frontière **ADR vs arbitrages** :
- `adr/` = une **décision structurante, durable et engageante** (un choix sur lequel le
  projet s'appuie ; le changer aurait des conséquences larges). Datée, numérotée,
  statut (proposé / accepté / remplacé par ADR-NNNN).
- `arbitrages/` = une **option étudiée puis refusée**, ou un **compromis plus localisé**.
  On garde la trace du chemin non pris ET du pourquoi, pour ne pas le rouvrir.

Chaque page : un seul objet, un « pourquoi » explicite, sourcée, reliée aux pages
voisines par des liens `[[ ]]`. Le `README.md` est la porte d'entrée qui tient la
promesse « compris en quelques heures ».

## 2. Périmètre de l'Archiviste

**Il documente** (valeur durable) : vision produit, architecture fonctionnelle, doctrine
UX/éditoriale/design/data, décisions importantes, arbitrages, compromis, limites connues,
sources de données et leur qualité, comparatifs techniques, patterns réutilisables,
recherches, méthodologies, conventions, erreurs déjà rencontrées, idées abandonnées **et
pourquoi**.

**Il refuse** : brainstorming sans conclusion, discussions émotionnelles, code, logs,
erreurs transitoires, implémentations retrouvables dans Git, détails techniques sans
portée durable, conversations personnelles, tâches ponctuelles.

**Il ne fait jamais** : écrire du code, prendre une décision produit, proposer des
fonctionnalités. Il observe, analyse, organise, conserve.

**Pépites** : il repère les idées fortes oubliées, recherches de qualité, raisonnements
originaux — il les **signale** dans le rapport, il ne les archive pas d'office.

**Cohérence** : si une connaissance nouvelle contredit une doctrine existante, il **ne
tranche pas**. Il pose le choix à l'humain : modifier la doctrine / créer une exception
documentée / abandonner l'idée.

## 3. Format du rapport d'impact (phase 1)

Sortie strictement structurée pour que la phase 2 soit purement mécanique.

Pour **chaque** connaissance candidate :
- **Quoi** — la connaissance, formulée clairement.
- **Pourquoi durable** — pourquoi elle mérite d'être conservée. Si pas de « pourquoi »
  solide → elle passe en section « Refusé ».
- **Destination** — `docs/vault/<dossier>/<fichier>.md` et/ou fiche `/memory/<slug>.md` ;
  et la relation entre les deux (vault seul / vault + memory qui référence le vault).
- **Action** — `create` / `update <fichier existant>` / `obsolete <fichier>`.
- **Doublon** — connaissance existante en recouvrement ou conflit. L'agent **liste les
  fichiers vault + memory qu'il a réellement inspectés** pour le vérifier (preuve de
  diligence, pas une affirmation à l'aveugle).
- **Confiance** — niveau (haut / moyen / à confirmer).
- **Durée de validité estimée** — pérenne / à revoir à l'échéance X / volatile.
- **Contenu exact proposé** — le texte de la page ou de la fiche, prêt à écrire.

Sections globales du rapport :
- **Refusé** — ce qui a été écarté et pourquoi (renvoie au périmètre §2).
- **Cohérence** — contradictions détectées avec la doctrine existante, posées comme un
  choix à l'humain (jamais tranchées par l'agent).
- **Pépites** — idées fortes repérées, signalées sans être archivées.

## 4. Le flux complet

1. L'utilisateur fournit la matière (conversation, doc, notes, audit, export).
2. **Phase 1** : `archiviste` (read-only) lit tout, inspecte vault + `/memory` existants
   pour les doublons, rend le rapport d'impact.
3. **Validation** : l'utilisateur coche/biffe les propositions, tranche les points de
   cohérence.
4. **Phase 2** : Claude principal applique le rapport validé — crée/maj les pages vault,
   les fiches `/memory`, met à jour `docs/vault/README.md` et `MEMORY.md`.

## 5. Composants à produire

1. `.claude/agents/archiviste.md` — le sous-agent read-only (phase 1). Tools restreints
   (pas de Write/Edit/NotebookEdit), system prompt = identité + périmètre + format de
   rapport imposé + règle des deux niveaux + auto-critique « Conservateur » intégrée.
2. `docs/vault/README.md` — squelette de l'index narratif + l'arborescence des dossiers
   (avec un court README ou en-tête par dossier expliquant ce qui y va).
3. Documentation courte du flux en deux temps (où, dans le repo, pour que l'usage soit
   évident plus tard) — p. ex. une section dans `docs/vault/README.md` ou un
   `docs/vault/COMMENT-UTILISER.md`.

Non inclus volontairement (YAGNI) : agent Conservateur séparé, génération automatique
d'index, migration de l'historique des conversations passées. À reconsidérer si les
seuils du §décisions-3 sont franchis.

## 6. Critères de réussite

- L'agent phase 1 **ne peut pas** écrire (vérifiable : aucun outil d'écriture dans sa
  config).
- Un rapport d'impact sur une matière test contient toutes les rubriques du §3, distingue
  vault vs `/memory`, et liste les fichiers inspectés pour les doublons.
- Le vault a sa structure §1 en place avec un `README.md` qui oriente un nouvel arrivant.
- La frontière ADR/arbitrages et la règle des deux niveaux sont écrites dans le repo, pas
  seulement dans ce spec.
