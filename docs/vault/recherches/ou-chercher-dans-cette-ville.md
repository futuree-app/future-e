# Piste produit : « Où chercher dans cette ville ? » (le milieu manquant)

- **Statut** : PISTE, non construite, à ne pas lancer avant validation de l'acquisition et de l'achat
  principal. Notée 2026-07-11.
- **Origine** : idée du porteur (le zoom de `/ou-vivre` au grain infra-communal), affinée par un
  échange contradictoire (Claude puis un modèle externe).

## L'idée

futur•e sait aider à choisir une **commune** (`/ou-vivre`), puis à analyser une **adresse** précise
(module Logement). Entre les deux manque le moment très concret : « D'accord pour La Rochelle, mais
**où** dois-je chercher à La Rochelle ? ». C'est le **milieu manquant** de la chaîne
**France → commune → secteur → adresse**, et un moment plus engagé (donc plus solvable) que le
rapport commune généraliste.

## Ce qu'il est, ce qu'il n'est pas

- **Pas** « le meilleur quartier », **pas** un classement, **pas** un score de compatibilité (ce
  serait une concurrence frontale avec Chacun Son Lieu, KelQuartier, GoodPlaceToLive, qui traitent
  le problème en matching/notation).
- **Est** une recherche de **secteurs compatibles** avec le projet : un front de compromis (3 à 5
  profils réellement différents, non dominés), avec la doctrine décisionnelle de futur•e (pourquoi
  ce secteur remonte, ce qu'il protège, ce qu'il oblige à accepter, les preuves, les inconnues, les
  vérifications). « Aucun ne réunit toutes vos priorités : voici ce que chacun préserve et sacrifie. »

## Pourquoi il valorise l'usine

Une servitude, un périmètre ABF, un îlot de chaleur, une distance à la gare, un prix DVF discriminent
peu entre deux communes entières. **À l'intérieur d'une commune, ils deviennent structurants.** La
donnée fine (accumulée cette semaine) devient directement actionnable. Ce n'est toujours pas un moat,
mais c'est un usage bien plus fort de l'usine qu'un rapport exhaustif de plus.

## La difficulté réelle (à ne pas sous-estimer)

- **Pas** l'espace continu (se discrétise facilement). **Le vrai piège** : fabriquer un faux
  « meilleur endroit » avec des données qui ne mesurent pas la vie vécue (bruit réel d'une rue,
  ambiance du soir, stationnement, voisinage, disponibilité effective de biens). Le moteur cherche
  des **secteurs à explorer**, jamais un verdict immobilier.
- **L'unité n'est PAS l'IRIS** (maille statistique ~2000 hab, ~1900 communes découpées, hétérogène
  en interne : fausse précision). Modèle **multirésolution** : IRIS pour le contexte socio-démo ;
  maille fine 150-300 m ou bâtiments résidentiels comme points candidats ; polygones natifs pour
  risques/servitudes/ABF ; distances et temps de parcours pour services/gares/écoles ; rayons DVF
  pour le prix ; adresse/parcelle pour la validation finale. On regroupe les cellules contiguës de
  profil cohérent en « secteurs » lisibles (« secteur ouest de Tasdon »), jamais « maille 8F3A ».
- **DVF décrit le passé, pas le stock disponible.** Sans flux d'annonces, futur•e est un outil de
  **ciblage de recherche**, pas un moteur immobilier complet. Défendable si on ne surpromet pas.

## Ce qui est réutilisable, ce qui est neuf

Réutilise : l'objet projet, le moteur `/ou-vivre` (langage naturel + logique de compromis), les
modules Territoire/Logement/Santé/Mobilité/Environnement, la matrice du Pack (comparaison sans
score), la checklist, la doctrine de preuve. **Neuf** : un moteur de génération de mailles/points
candidats, l'agrégation multirésolution, le calcul de proximité/temps de parcours, le regroupement
en secteurs, la génération de compromis distincts, une carte conçue pour la recherche. C'est un
**nouveau moteur d'assemblage spatial**, pas une nouvelle usine thématique.

## Séquencement

- **Maintenant** : réserver la posture `recherche_quartier` dans l'objet projet (fait dans la spec
  `2026-07-11-user-project-persistance`), sans construire le moteur.
- **Après lancement** : prototype sur UNE commune riche (La Rochelle), maille résidentielle simple,
  5-8 critères, 3 profils de secteurs, aucun score, comparaison du Pack, checklist de visite.
- **Ensuite** : étendre aux communes où l'IRIS et la donnée fine sont assez riches et la variation
  interne significative.

Débouché possible : un **Pack Recherche locale** (secteurs + compromis + carte + zones à éviter +
vérifications + crédits d'analyse d'adresse), potentiellement plus fort que le rapport à 14 €.
