# Positionnement : un site de choix de vie

> Règle durable. Fiche miroir : `/memory/feedback_positionnement_compatibilite.md`.
> Vision fondatrice : `vision/positionnement.md`.

## La promesse

futur•e **n'est pas un site sur les risques**. C'est un site sur les **choix de vie**,
qui utilise les risques pour éclairer ces choix. La promesse centrale est la
**compatibilité territoriale à long terme** : choisir où construire sa vie.

Le climat, les risques et les nuisances invisibles restent une matière centrale du
produit, mais **la donnée elle-même n'est plus le moat**. DPE, DVF, Géorisques, cadastre,
PLU, BDNB, transports, pollution et services deviennent progressivement des commodités
accessibles dans de nombreuses fiches concurrentes.

Le moat de futur•e repose désormais sur quatre couches cumulatives :

### 1. Projet personnel

Répondre à la question : **« Est-ce que cet endroit convient à ce que cette personne
essaie réellement de faire ? »**

La valeur ne vient pas du nombre de critères, mais du rattachement explicite des faits au
Projet, à ses conditions sans compromis, à ses préférences et à ce qui reste hors mesure.

### 2. Composition

Transformer plusieurs faits de grains différents en une lecture décisionnelle sans score
opaque.

Exemple de chaîne cible :

`nuits chaudes en hausse → ventilation nocturne importante pour ce Projet → bruit réel
inconnu → vérification nécessaire avant de conclure`.

Le différenciant est le raisonnement entre Territoire, Autour et Logement, pas la
juxtaposition des couches.

### 3. Incertitude actionnable

Quand futur•e ne sait pas conclure, il ne comble pas le trou par une note. Il indique
**ce qui manque, pourquoi cela compte et comment le vérifier avant de s'engager**.

L'inconnue utile devient ainsi une partie du produit :

`fait / projection → inconnue déterminante → vérification → réponse attribuée → lecture
réévaluée`.

### 4. Continuité de la décision

futur•e doit accompagner une décision qui évolue dans le temps :

`recherche → shortlist → dossier → visite → nouvelle information → réévaluation →
compromis / abandon`.

La mémoire des candidats, des versions, des vérifications et des changements peut devenir
plus différenciante qu'un rapport statique.

**Conséquence durable :** toute nouvelle donnée doit être évaluée selon sa capacité à
renforcer au moins un de ces quatre moats. Une source supplémentaire qui enrichit seulement
une fiche technique n'est pas, à elle seule, une priorité produit.

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
