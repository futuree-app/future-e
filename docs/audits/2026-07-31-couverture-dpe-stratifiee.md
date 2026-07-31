# La couverture DPE, par strate, sur le chemin que le produit emprunte vraiment

**Date** : 2026-07-31 · **Script** : `scripts/mesure-dpe-stratifiee.mjs` · **Données et liste
exacte des adresses** : `docs/audits/mesure-dpe-2026-07-31-adresses.json` (rejouable par
`--rejouer`).

## Ce qui a déclenché la mesure

La doctrine du produit citait « **35 à 53 %** des adresses sans diagnostic », de l'audit du
03/07/2026. Ce taux gouverne des décisions écrites : `refus-de-vente-sur-ancrage.md` s'en sert
pour établir qu'on ne peut pas refuser une vente sur l'absence de DPE, et la spec de qualification
le cite deux fois.

## Le résultat

**800 adresses**, 200 par strate, **tirées uniformément parmi les adresses réelles de la Base
Adresse Nationale** (échantillonnage par réservoir sur huit fichiers départementaux, de Paris à la
Creuse ; 3,28 millions d'adresses parcourues).

| Strate | Absence, **chemin du produit** | Avec repli 50 m |
|---|---|---|
| Urbain dense (≥ 50 000 hab.) | **75,0 %** ± 6,0 (150/200) | 3,5 % (7/200) |
| Péri-urbain (10 000-49 999) | **79,5 %** ± 5,6 (159/200) | 7,5 % (15/200) |
| Petite ville (2 000-9 999) | **81,5 %** ± 5,4 (163/200) | 20,0 % (40/200) |
| Rural (< 2 000) | **85,5 %** ± 4,9 (171/200) | 40,0 % (80/200) |

Marges à 95 %.

## Les deux chemins ne mesurent pas la même chose, et c'est tout le sujet

Le produit cherche **uniquement sur l'identifiant BAN exact** (`getDpeCandidatesByBanId`,
`probeDpeByBanId`, jeux « existant » et « neuf »). La sonde de qualification refuse explicitement
la recherche par coordonnées, et son commentaire dit pourquoi : un diagnostic à 50 m est un
candidat à confirmer, l'annoncer avant paiement promettrait une matière que le produit refuse
d'affirmer après l'achat.

Le taux de 44 % de juillet, lui, **inclut le repli à 50 m**. Les deux ne sont donc pas comparables.
**Le taux réel d'absence, sur le chemin réel, est de 75 à 85 % selon la densité.**

La colonne « avec repli » achève de le démontrer : en urbain dense, elle tombe à **3,5 %**. Un
rayon de 50 m en ville contient forcément des logements diagnostiqués. Ce chiffre ne mesure donc
pas la couverture d'une adresse, il mesure la présence de voisins.

## Ce que le repli à 50 m ramènerait vraiment : le diagnostic du VOISIN

Vérifié sur 65 adresses sans diagnostic exact mais avec un diagnostic à moins de 50 m, en comparant
l'adresse portée par ce diagnostic à celle qu'on analyse :

- **même adresse sous un autre identifiant (jointure ratée) : 0**
- adresse voisine : **57**
- indéterminé : 8

**La jointure du produit est juste.** Il ne rate pas des diagnostics de l'adresse par un défaut
d'identifiant : ceux qu'il ne trouve pas n'existent pas pour ce bien. Le repli n'améliorerait pas
la couverture, il attribuerait le diagnostic d'un voisin, exactement ce que la doctrine interdit.

## Deux mesures antérieures, toutes deux biaisées, en sens opposés

**Onze adresses sondées le 30/07, neuf avec diagnostic.** Adresses choisies à la main, toutes des
centres-villes connus (Capitole, place Kléber, rue Saint-Jean). Biais de sélection maximal.

**160 adresses tirées le 31/07 au matin, 73 à 92 % d'absence.** Un point au hasard dans la boîte
englobante communale, puis l'adresse la plus proche : cadre uniforme sur la SURFACE, donc
sur-représentation massive de la périphérie (« 320 Chemin du Plan d'Aillane » à Aix, « Allée de
Livermead » à Caen). Son propre commentaire annonçait un biais vers les centres-bourgs, soit
l'inverse de ce qu'il faisait. Résultats conservés dans `mesure-dpe-2026-07-31.json` comme trace.

Le tirage uniforme parmi les adresses réelles, ci-dessus, donne 75 à 85 % : **très proche du
tirage à la surface**, ce qui montre que le biais de cadre changeait peu le résultat sur ce
chemin-là. C'est le tirage à la main, lui, qui était trompeur.

## Conséquences

1. **Le chiffre de doctrine est corrigé** dans `refus-de-vente-sur-ancrage.md`, la spec et le plan
   de qualification, et le commentaire de `dossier-qualification.ts`.
2. **La conclusion de ces textes ne change pas, elle se renforce.** Refuser une vente sur l'absence
   de diagnostic refuserait non pas la moitié des adresses, mais les quatre cinquièmes.
3. **La face Énergie du dossier est vide pour la grande majorité des acheteurs**, y compris en
   ville. Ce n'est pas un défaut à corriger, c'est un fait de la donnée ouverte : la valeur du
   dossier vient d'ailleurs (exposition de l'adresse, sinistralité, secteur, trajectoire de la
   commune), et la qualification l'annonce honnêtement avant paiement.
4. **Le contexte « diagnostics à cette adresse » livré le 31/07 sert une minorité de cas**, environ
   une adresse urbaine sur quatre. Il reste juste, et il traite bien le cas où il s'applique.

## Existe-t-il une autre base ? Non, et c'est vérifié

L'ADEME publie huit jeux liés au DPE. Trois seulement pourraient concerner un logement :

| Jeu | Lignes | Verdict |
|---|---|---|
| DPE Logements existants (depuis juillet 2021) | 15,3 M | **Utilisé.** C'est la source. |
| DPE Logements neufs (depuis juillet 2021) | 1,4 M | **Utilisé.** |
| DPE Logements **avant juillet 2021** | 10,7 M | **Inutilisable : tous expirés.** |
| Audits énergétiques logement existants | 3,1 M | **Utilisé**, et il n'apporte presque rien. |
| DPE Tertiaire (deux jeux) | 1,1 M | Hors sujet, ce ne sont pas des logements. |

**Le jeu d'avant juillet 2021 est tentant et inutilisable.** Dix millions de diagnostics, soit
presque autant que la source actuelle. Mais les mesures transitoires de la réforme les ont tous
périmés : ceux de 2013-2017 depuis le 31/12/2022, ceux de 2018 à juin 2021 depuis le 31/12/2024.
**Depuis le 1er janvier 2025, aucun DPE antérieur à juillet 2021 n'est valide.** Il ne porte
d'ailleurs aucun identifiant BAN, seulement des coordonnées et une adresse géocodée : l'exploiter
demanderait en plus d'attribuer par proximité, ce que la doctrine interdit. Le produit a donc
raison de l'ignorer, et `getDpeByCoordinates`, seule fonction qui le lit encore, porte désormais
cet avertissement en tête.

**Les audits énergétiques ne comblent pas le trou.** Ils sont joignables par identifiant BAN
exactement comme les DPE, et ils portent une classe (`classe_bilan_dpe`). Mesurés sur les mêmes
800 adresses : **11 audits au total, et un seul sur une adresse dépourvue de DPE**. C'est logique,
un audit accompagne la vente d'un logement mal classé, qui a donc déjà un diagnostic. Ils
enrichissent les adresses déjà couvertes, ils n'en ouvrent pas de nouvelles.

> Un défaut relevé au passage : la section Énergie n'affiche l'audit que dans la branche où un DPE
> est déjà attribué. Sur l'adresse qui a un audit sans DPE, il est donc invisible. Un cas sur 800,
> à corriger quand ce fichier sera rouvert, pas avant.

**L'absence de diagnostic n'est donc pas un défaut d'intégration, c'est un fait de la donnée
ouverte.** Il n'y a pas de source à ajouter.

## Limites

- Les huit départements sont **choisis à la main** pour couvrir la densité, pas tirés au sort.
- **Une adresse n'est pas une transaction.** Un acheteur regarde des biens en vente, dont la
  répartition n'est pas celle des adresses : un logement mis en vente a, par construction, un
  diagnostic récent. Ce script mesure « les adresses analysables », jamais « les biens visités ».
  L'écart entre les deux est la seule raison sérieuse de penser que la couverture réellement
  rencontrée par un acheteur est meilleure que 20 %.
- Le jeu « legacy » (avant juillet 2021) n'entre que dans le chemin de proximité, comme dans
  `getDpeByCoordinates`.
