# Positionnement : un site de choix de vie

> Règle durable. Fiche miroir : `/memory/feedback_positionnement_compatibilite.md`.
> Vision fondatrice : `vision/positionnement.md`.

## La promesse

futur•e **n'est pas un site sur les risques**. C'est un site sur les **choix de vie**,
qui utilise les risques pour éclairer ces choix. La promesse centrale est la
**compatibilité territoriale à long terme** : choisir où construire sa vie.

Le différenciant (le moat) est la prise en compte des **nuisances et risques invisibles**
que les comparateurs immobiliers ou services ignorent : chaleur future, inondation,
qualité de l'air, bruit, sites industriels à risque, pression agricole. Le climat reste
une composante centrale, mais plus le seul sujet : le moteur est passé de « moteur climat
enrichi » à **moteur de compatibilité territoriale**.

## Pourquoi cette règle

En ajoutant mobilité, vie locale, démographie, exposition industrielle, bruit, santé, le
risque n'est plus de paraître trop ambitieux : il est de **sous-vendre** le moteur, et de
basculer dans l'imaginaire « site des risques » (anxiogène) au lieu de « choisir où bien
vivre » (aspirationnel). Les gens achètent un **arbitrage**, pas une liste de datasets ni
un danger.

## Comment on applique

- **Toute copy de positionnement ouvre par le projet de vie** (positif), jamais par un
  danger. « Choisir un territoire compatible, en tenant compte de ce qui peut dégrader la
  santé et le cadre de vie », pas « Éviter les nuisances ».
- **Division du travail dans un hero** : le SOUS-TITRE porte la DÉCISION (révéler les
  compromis entre familles de critères), le COMPTEUR et les explications portent la PREUVE
  (l'inventaire granulaire, qui entre par le différenciant invisible).
- **Le chiffre** : « près de 30 critères » (28 réels dans `PREFERENCE_KEYS`). Jamais un
  nombre rond qui devient faux : « plus de 30 » serait un mensonge. « critères » plutôt
  qu'« indicateurs » (plus décisionnel).
- **Chips et exemples** : des projets de vie positifs, équilibrés entre catégorie A
  (projection et protection, le moat : climat, santé environnementale, inondation,
  industrie) et catégorie B (aspiration : mobilité, vie locale, retraite, démographie).
  Garder une tête d'affiche climat ou protection, sinon le produit ressemble à un moteur
  de relocalisation banal. Chaque chip est une **promesse**, validée à la sonde réelle
  `scripts/sonde-richesse-chips.mjs` : elle parse vers de vrais critères, donne un
  résultat fort et divergent, aucun signal absent.
- **Ne jamais promettre ce qui n'existe pas** : pas de chip immobilière tant que DVF n'est
  pas au moteur ; « pollution mesurée » n'existe pas (l'exposition industrielle mesure la
  présence de sites à risque), donc « sites industriels à risque » et non « pollutions
  industrielles ».

Livré sur `/ou-vivre` le 2026-06-05 (`main` d80d11c).

## Liens

Récit honnête du territoire : `doctrine/editoriale.md`. Modules concernés :
`modules/comparateur.md`, `modules/territoire.md`.
