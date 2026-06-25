# ADR-0002 : Pivot vers le moteur de compatibilité territoriale

- **Statut** : accepté
- **Date** : ~2026-06-05 (livré sur `/ou-vivre`, `main` d80d11c)
- **Source** : `/memory/feedback_positionnement_compatibilite.md`,
  `/memory/project_roadmap.md`, `doctrine/positionnement.md`. Recoupe et fait évoluer le
  périmètre de `Documentation Notion/.../02 1 — Vision produit`.

## Contexte

L'intention d'origine (avril 2026) décrivait un « moteur climat personnalisé » organisé en
6 modules thématiques. Au printemps, le produit a ajouté mobilité, vie locale, démographie,
exposition industrielle, bruit, santé environnementale. Le centre de gravité s'est déplacé.

## Décision

futur•e passe de **« moteur climat enrichi »** à **moteur de compatibilité territoriale** :
un comparateur (`/ou-vivre`) qui classe les lieux selon ~28 critères exprimés par
préférences, le climat restant une composante centrale mais plus l'unique sujet.

## Pourquoi

En élargissant les dimensions, le risque n'est plus de paraître trop ambitieux, c'est de
**sous-vendre** le moteur et de basculer dans l'imaginaire « site des risques » (anxiogène)
au lieu de « choisir où bien vivre » (aspirationnel). Le différenciant devient la prise en
compte des **nuisances et risques invisibles** que les comparateurs immobiliers ignorent.
Les gens achètent un arbitrage, pas une liste de datasets.

## Conséquences

- Le comparateur devient le **produit public central**, pas une feature gatée.
- Les pages `vision/` (intention d'origine) doivent être lues avec cette évolution en tête.
- Toute la doctrine de copy de positionnement en découle (voir `doctrine/positionnement.md`).
- Implique l'accès par territoire actif plutôt que par résidence (voir ADR-0003).

## Liens

`doctrine/positionnement.md`, `vision/positionnement.md`, `adr/ADR-0001-pas-de-score-synthetique.md`,
`adr/ADR-0003-territoire-actif-vs-residence.md`, `modules/comparateur.md`.
