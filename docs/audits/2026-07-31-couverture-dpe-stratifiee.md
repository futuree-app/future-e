# La couverture DPE, par strate, sur le chemin que le produit emprunte vraiment

**Date** : 2026-07-31 · **Script** : `scripts/mesure-dpe-stratifiee.mjs` · **Données brutes et
liste exacte des adresses** : `docs/audits/mesure-dpe-2026-07-31.json` (rejouable par
`--rejouer`).

## Ce qui a déclenché la mesure

La doctrine du produit cite « **35 à 53 %** des adresses sans diagnostic », de l'audit du
03/07/2026 (124 adresses, communes pondérées par la population). Ce taux gouverne des décisions
écrites : `refus-de-vente-sur-ancrage.md` s'en sert pour établir qu'on ne peut pas refuser une
vente sur l'absence de DPE, et la spec de qualification le cite deux fois.

Un sondage de onze adresses le 30/07 avait trouvé neuf diagnostics sur onze, ce qui suggérait une
répartition non uniforme. Ce sondage était en réalité **massivement biaisé** : onze adresses
choisies à la main, toutes des centres-villes connus.

## Le résultat

160 adresses, tirées au hasard dans quatre strates de population, par la même méthode que l'audit
de juillet (point au hasard dans la boîte englobante communale, puis `/reverse` filtré sur
`housenumber`).

| Strate | Absence, **chemin du produit** | Absence, avec repli 50 m |
|---|---|---|
| Urbain dense (≥ 50 000 hab.) | **73,1 %** (38/52) | 28,8 % (15/52) |
| Péri-urbain (10 000-49 999) | **84,8 %** (39/46) | 43,5 % (20/46) |
| Petite ville (2 000-9 999) | **86,1 %** (31/36) | 44,4 % (16/36) |
| Rural (< 2 000) | **92,3 %** (24/26) | 61,5 % (16/26) |

## Les deux chemins ne mesurent pas la même chose, et c'est tout le sujet

Le produit cherche **uniquement sur l'identifiant BAN exact**
(`getDpeCandidatesByBanId`, `probeDpeByBanId`, jeux « existant » et « neuf »). La sonde de
qualification refuse explicitement la recherche par coordonnées, et son commentaire dit pourquoi :
un diagnostic à 50 m est un candidat à confirmer, l'annoncer avant paiement promettrait une matière
que le produit refuse d'affirmer après l'achat.

Le taux de 44 % de juillet, lui, **inclut le repli à 50 m**. Les deux ne sont donc pas comparables,
et la doctrine cite depuis un mois un chiffre mesuré sur une recherche que le produit ne fait pas.
**Le taux réel d'absence, sur le chemin réel, est de 73 à 92 % selon la densité.**

## Ce que le repli à 50 m ramènerait vraiment : le diagnostic du VOISIN

Vérifié sur les 65 adresses sans diagnostic exact mais avec un diagnostic à moins de 50 m, en
comparant l'adresse portée par ce diagnostic à celle qu'on analyse :

- **même adresse sous un autre identifiant (jointure ratée) : 0**
- adresse voisine : **57**
- indéterminé : 8

**La jointure du produit est juste.** Il ne rate pas des diagnostics de l'adresse par un défaut
d'identifiant : les diagnostics qu'il ne trouve pas n'existent pas pour ce bien. Le repli à 50 m
n'améliorerait pas la couverture, il attribuerait le diagnostic d'un voisin — exactement ce que la
doctrine interdit, et elle a raison de l'interdire.

## Conséquences

1. **Le chiffre de doctrine doit être corrigé.** « 35 à 53 % » décrit une recherche que le produit
   ne fait pas. Les textes qui le citent (`refus-de-vente-sur-ancrage.md`, la spec de
   qualification) doivent porter les deux taux et dire lequel s'applique.
2. **La conclusion de ces textes ne change pas, elle se renforce.** Refuser une vente sur l'absence
   de diagnostic refuserait non pas la moitié des adresses, mais les trois quarts.
3. **La face Énergie du dossier est vide pour la majorité des acheteurs**, y compris en ville. Ce
   n'est pas un défaut à corriger, c'est un fait de la donnée ouverte : la valeur du dossier vient
   d'ailleurs (exposition de l'adresse, sinistralité, secteur, trajectoire de la commune), et la
   qualification l'annonce honnêtement avant paiement.
4. **Le contexte « diagnostics à cette adresse » livré le 31/07 sert une minorité de cas.** Il
   n'apparaît que quand des candidats existent, donc sur environ un quart des adresses urbaines.
   Il reste juste, et il traite bien le cas où il s'applique.

## Limites

- Le tirage par reverse-géocodage penche vers les centres-bourgs, donc vers les adresses les mieux
  couvertes : **le vrai taux d'absence est probablement plus haut encore**. Le biais est le même
  que celui de l'audit de juillet, ce qui rend les deux comparables.
- Les effectifs par strate (52, 46, 36, 26) donnent des intervalles d'environ ±12 points. L'écart
  entre 73 % et 44 % est très au-delà de cette incertitude ; l'ordre entre strates, lui, est
  suggéré plus que prouvé.
- Le jeu « legacy » (avant juillet 2021) n'entre que dans le chemin de proximité, comme dans
  `getDpeByCoordinates`.
