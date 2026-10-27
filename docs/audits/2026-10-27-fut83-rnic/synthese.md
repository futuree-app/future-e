# FUT-83 · Le registre des copropriétés mérite-t-il une place dans futur•e ?

**Date** : 27/10/2026 · **Ticket** : [FUT-83](https://linear.app/future-e/issue/FUT-83) · **Branche** : `docs/fut-83-audit-rnic`
**Lecture** : 5 minutes. Le détail est dans `sources-et-champs.md`, `rattachement.md`, `scenarios-acheteur.md` et
`arbitrage.md`. La décision est résumée dans `conclusion.md`.

---

## Décision : reporter (option C), validée par le porteur le 27/10/2026

Le registre ne publie pas ce qui aiderait un acheteur à décider. Ce qu'il publie, l'annonce le donne déjà. Et sur une
adresse d'immeuble collectif, il ne désigne une seule copropriété, sans contradiction, qu'environ quatre fois sur
dix. La piste « guider les documents à demander » est suivie à part, dans
[FUT-150](https://linear.app/future-e/issue/FUT-150).

---

## Les trois découvertes

**1. Les informations qui comptent ne sont pas dans les données ouvertes.** La loi prévoit que le registre rende
publiques les procédures (mandat ad hoc, administration provisoire, carence) et les arrêtés (péril, insalubrité).
Aucun des fichiers vérifiés, de 2023 à aujourd'hui, ne les contient, alors que la notice de l'Anah les décrit. Les finances, les
impayés, le fonds de travaux et le plan de travaux ne sont pas publics du tout. Seul l'annuaire en ligne montre les
procédures, fiche par fiche, sans API.

**2. Ce qui est publié et utile, l'acheteur l'a déjà.** Une annonce de vente en copropriété doit dire que le bien est
en copropriété, combien de lots elle compte, les charges courantes moyennes, et si une procédure est en cours
(article L721-1 du code de la construction). Le reste (charges du lot, travaux votés, impayés, fonds de travaux, plan
de travaux) arrive avec les pièces que le vendeur doit remettre avant la promesse (L721-2). Le registre n'en
contient aucune.

**3. Le fichier demande une méfiance champ par champ.** 8 233 copropriétés y figurent deux fois. La « date de
dernière mise à jour » est surtout une date de traitement informatique : 174 632 copropriétés sont datées du
dimanche 24 août 2025. Deux classements de période de construction se mélangent. Entre l'automne 2025 et
aujourd'hui, 15 630 copropriétés sont passées de « aidée par l'Anah » à « non aidée », alors que l'indicateur compte
les aides depuis 2014 et ne devrait jamais redescendre. Le statut du mandat de syndic a changé pour une copropriété
sur cinq en dix mois.

---

## Le rattachement d'une adresse à sa copropriété : fiabilité moyenne, couverture faible

Le registre ne connaît ni l'identifiant d'adresse (BAN) ni celui du bâtiment (RNB). On rapproche par l'adresse
déclarée, et la parcelle sert de contrôle. Le travail de FUT-80 sur le bâtiment n'aide presque pas : une copropriété
couvre souvent plusieurs bâtiments, ou partage un bâtiment avec une autre.

Sur 190 adresses d'immeubles collectifs (catégories exhaustives) :

- **l'adresse désigne une seule copropriété, rien ne la contredit : 79 (42 %)** ;
- plusieurs copropriétés, sans moyen de choisir : 6 (3 %), par exemple à Marseille (avenue de la Jarre), Toulouse
  (rue de Bayard) et Paris 15e (rue de la Fédération) ;
- l'adresse ne trouve rien, mais la BDNB ou la parcelle proposent une seule copropriété : 20 (10,5 %). Ce n'est pas
  une preuve : la BDNB a fait son propre rapprochement, et une parcelle porte souvent plusieurs copropriétés ;
- l'adresse désigne une copropriété, la parcelle ou la BDNB en proposent aussi d'autres : 3 (1,6 %) ;
- **rien du tout : 82 (43 %)**, sans qu'on puisse distinguer une copropriété non immatriculée, un logement social ou
  une adresse mal déclarée.

Pour contrôler les réponses uniques, on les a comparées au numéro que le diagnostiqueur a saisi sur 382 DPE. Elles
concordent **250 fois sur 261 (96 %)**, et 250 sur 262 (95 %) si l'on compte un numéro inconnu du registre. Ce taux
vaut **seulement pour les réponses uniques**, sur des DPE déjà rattachés à une copropriété par leur auteur (1 % des
DPE d'appartement). Il ne se généralise pas à toutes les adresses : sur les 382 DPE, l'adresse ne trouve seule la
bonne copropriété que 250 fois (65 %). Même parmi les réponses uniques, futur•e afficherait environ une fois sur 25
la taille d'une copropriété voisine sans le savoir.

---

## Ce qui serait vraiment utile à un acheteur

- **La taille de la copropriété en logements**, pas en lots : « 46 lots » à Bruz, c'est 18 logements. Elle sert à
  préparer des questions, pas à juger un risque.
- **Le rattachement à une ASL ou une AFUL**, ou une **résidence-service** : une seconde source de charges et de
  règles. Cela concerne environ 5 % des copropriétés.
- **Le nom du syndic**, quand il est professionnel.

Le plus utile ne dépend pas du registre : dire à quelqu'un qui achète un appartement quelles pièces exiger et quoi y
lire (travaux votés, plan de travaux, impayés, fonds de travaux non remboursé). Cela vient de la loi et du projet du
lecteur. C'est la piste [FUT-150](https://linear.app/future-e/issue/FUT-150).

---

## Les limites de ce verdict

- L'échantillon de vérité de terrain favorise les copropriétés bien identifiées. L'erreur réelle est probablement
  plus fréquente que 4 %, ce qui renforce le report.
- L'intérêt des acheteurs pour la taille ou la gestion de la copropriété n'a pas été testé.
- Les DROM et les grands ensembles en volumes sont peu représentés.

---

## Si l'intégration était retenue malgré tout

Option A, limitée au numéro (avec un lien vers l'annuaire), au nombre de logements, à l'ASL ou l'AFUL, à la
résidence-service et au syndic professionnel, seulement quand l'adresse désigne une copropriété unique : **5 à 6
jours**, puis une surveillance du format du fichier, qui a déjà changé une fois en 2026. Aucun impact sur les
rapports déjà achetés.

**On rouvre le sujet si** l'Anah publie les procédures et les arrêtés en données ouvertes, si le registre porte un
identifiant de bâtiment ou d'adresse, ou si une recherche utilisateur montre que la taille de la copropriété pèse
dans le choix avant la visite. Point de contrôle daté : le décret n° 2025-831, qui enrichit le registre (bâtiments, énergie, plan de
travaux, habitat indigne), entre en vigueur vers le 21/02/2027. Il faudra regarder alors si le fichier ouvert
change.

---

## Reproduire

Scripts : `scripts/fut83/` (Python, bibliothèque standard). Mesures : `mesures/` (voir `mesures/LISEZMOI.md`). Les
fichiers du registre (411 et 453 Mo) ne sont pas versionnés : ils se téléchargent depuis data.gouv.fr.
