# MAJ texte : richesse du moteur (/ou-vivre)

Date : 2026-06-05
Statut : design validé, prêt pour writing-plans
Périmètre : copy de `src/app/(public)/ou-vivre/OuVivreClient.tsx` uniquement

## Problème

Le positionnement affiché sur `/ou-vivre` raconte encore un futur•e de mars-avril :
un « moteur climat enrichi ». Or le moteur compte aujourd'hui 28 critères
(`PREFERENCE_KEYS`) répartis sur 8 familles (climat, risques naturels, santé
environnementale, cadre de vie, services, mobilité, vie locale, dynamiques
territoriales). Le risque n'est plus de paraître trop ambitieux : c'est de
sous-vendre le moteur.

Les compteurs d'indicateurs sont en plus faux et incohérents à travers le site
(20 sur /ou-vivre, 50 et 10 sur l'accueil, « dix » sur /comparateur). Ce chantier
ne corrige que /ou-vivre (les autres surfaces sont hors-scope, voir plus bas).

## Thèse de positionnement

futur•e n'est pas un site sur les risques. C'est un site sur les choix de vie,
qui utilise les risques pour éclairer ces choix.

- Promesse centrale : la compatibilité territoriale à long terme (choisir où
  construire sa vie). Ouverture positive, jamais par un danger.
- Différenciant : la prise en compte des nuisances et risques invisibles
  (chaleur, inondations, qualité de l'air, bruit, sites industriels à risque,
  pression agricole, sécheresse, feu), que les comparateurs immobiliers et de
  services ignorent.
- Hiérarchie du message : compatibilité d'abord, puis « en tenant compte de »
  pour le différenciant (nuisances/risques), puis « mais aussi » pour
  l'agrément (soins, mobilité, services, vie locale).
- Division du travail entre les deux phrases du hero : les gens achètent un
  arbitrage, pas une liste de datasets. Donc le SOUS-TITRE porte la promesse
  (révéler les compromis entre familles, registre décision), et le COMPTEUR
  porte la preuve (l'inventaire granulaire, qui mène par le différenciant
  invisible). On ne met pas l'inventaire de critères dans le sous-titre.

Repère d'honnêteté : l'immobilier (prix) n'est pas un critère du moteur
aujourd'hui (DVF = roadmap V2). On ne le mentionne jamais comme une chose qu'on
fait ; il sert seulement de repère mental de ce que futur•e n'est PAS.

## Surfaces modifiées (4)

### 1. Sous-titre du hero (ligne ~619)

Avant :
> Changement climatique, pollution, accès aux soins, qualité de vie... futur•e
> vous aide à identifier les territoires les plus compatibles avec votre
> situation, vos projets et les compromis qu'ils impliquent.

Après :
> futur•e vous aide à identifier les territoires les plus compatibles avec votre
> projet de vie, en révélant les compromis entre climat, santé, cadre de vie,
> mobilité et accès aux services.

Décision : le sous-titre est centré DÉCISION (révéler les compromis), pas
inventaire de critères. L'inventaire détaillé descend dans le compteur. La
mention « compromis » redevient ainsi la colonne vertébrale du sous-titre, ce
qui résout la question précédente sur sa disparition.

Note : le texte reste passé par `bindOrphans`.

### 2. Compteur / micro-réassurance (ligne ~656)

Avant :
> Plus de 20 indicateurs publics, climatiques, sanitaires et territoriaux,
> croisés sur les 34 000 communes de France métropolitaine, avec les projections
> climatiques à l'horizon 2050.

Après (aligné sur la même hiérarchie) :
> Près de 30 critères publics croisés sur les 34 000 communes de France
> métropolitaine, avec les projections climatiques à l'horizon 2050 : chaleur,
> inondations, qualité de l'air, bruit et risques industriels, mais aussi soins,
> mobilité, services et vie locale.

Décisions figées :
- « Près de 30 critères » et non « Plus de 30 indicateurs » : il y a 28 critères
  réels, donc « plus de 30 » serait faux (garde-fou « pas de nombre rond qui
  devient faux »). « critères » est plus fort/décisionnel que « indicateurs ».
- On conserve la mention des projections 2050 (différenciant DRIAS réel). Si la
  phrase est jugée trop longue en self-review, c'est le segment ajustable.

### 3. Chips d'exemples `EXAMPLES` (lignes ~61-66)

Aujourd'hui 4 exemples très climat/retraite. Jeu de candidats (8), formulés en
projets de vie positifs, couvrant l'étendue (protection + agrément) :

1. Je veux vivre sans voiture au quotidien
2. Une petite ville vivante près de l'océan
3. Élever mes enfants dans un environnement sain
4. Un coin calme avec gare et vie étudiante
5. Rester dans le Sud sans subir les canicules
6. Une ville qui attire de nouveaux habitants
7. Près de la nature mais avec des médecins accessibles
8. Préparer ma retraite dans un climat tempéré

Set final : 5 à 6 chips, choisis par la validation moteur (voir Gate data).
Cible visuelle : ça reste lisible en flex-wrap, on évite la surcharge.

### 4. Phrases machine à écrire `PLACEHOLDER_PHRASES` (lignes ~72-82)

C'est la meilleure vitrine de l'étendue. Jeu de candidats (5), multi-critères,
chacune racontant « ça ne fait pas que du climat » :

1. Je cherche une petite ville vivante, avec une gare, des médecins accessibles
   et un climat supportable l'été.
2. Nous voulons élever nos enfants loin des sites industriels à risque, sans
   être isolés des services.
3. Je voudrais vivre sans voiture, près de l'océan, dans une ville qui attire
   encore de nouveaux habitants.
4. Un endroit calme pour la retraite, avec des étudiants, des commerces et peu
   de risque d'inondation.
5. Rester dans le Sud, mais éviter les canicules les plus intenses.

Correction d'honnêteté appliquée : « pollutions industrielles » devient « sites
industriels à risque », car le critère `faible_exposition_industrielle` mesure la
présence administrative de sites à risque, PAS une pollution mesurée.

On peut compléter avec 1 à 2 phrases existantes encore fortes (ex. la phrase
« loin de l'agriculture intensive et de l'air pollué ») si elles survivent à la
validation, pour la variété. Set final : 6 à 8 phrases.

## Gate data (doctrine, non négociable)

Chaque chip et chaque phrase machine à écrire est une PROMESSE. Avant de figer le
set final, passer chaque candidat dans le moteur réel sur le dev (port 3000) :

1. Appeler le `/parse` réel et vérifier que la phrase parse vers les critères
   réels visés (et est bien routée/désambiguïsée).
2. Lancer le moteur et vérifier que le résultat est FORT (correspondance haute)
   et DIVERGENT (les 3 communes ne se ressemblent pas, l'arbitrage est visible).
3. Rejeter tout candidat qui s'appuie sur un signal absent (prix, tempête,
   maladies émergentes, pollution mesurée) ou qui sort un résultat plat/incohérent.

Patron : sonde live réelle (le shell principal sort sur le réseau), matrice de
résultats par candidat, gate porteur sur le set retenu, puis patch de la copy.
On ne fige aucune chip/phrase non passée par cette validation.

## Hors-scope explicite

- Accueil `FutureELanding.tsx` (compteurs « plus de 50 » et « 10 indicateurs »).
- Page `/comparateur` (« les dix dimensions lues ici »).
- H1 de /ou-vivre (« Découvrez où vivre, selon ce qui compte pour vous »), déjà
  neutre et juste.
- Toute logique moteur : ce chantier est 100 % copy, zéro changement de scoring.

## Vérification

- `npx tsc --noEmit` propre sur le fichier touché.
- eslint sur `OuVivreClient.tsx`.
- curl/parse réels sur le dev pour le gate data.
- Relecture doctrine : aucun tiret cadratin, aucun chiffre faux, aucune promesse
  d'un signal absent.
