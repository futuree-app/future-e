# Rapport produit · Doctrine des apports du lecteur

**Agent** : Product Strategist · **Date** : 21/08/2026 · **Statut** : évaluation datée, pas de la doctrine.
**Question-mère** : cette décision crée-t-elle de la valeur réelle pour le lecteur, ou ajoute-t-elle de la complexité ?

Fichiers ouverts : `docs/vault/briefs/logement-caracteristiques-declarees.md`,
`docs/vault/principes/invariants.md`, `docs/vault/doctrine/positionnement.md`,
`docs/vault/vision/archetype-lecteur.md`, `docs/vault/arbitrages/signaux-communautaires-ecartes.md`,
`src/app/(account)/compte/QuartierWorkbook.tsx`, `src/components/report/QuartierSynthesis.tsx`,
`src/app/api/synthesize-quartier/route.ts`, `src/app/api/ask/route.ts`, `src/lib/report-context.ts`,
`src/lib/thermal-evidence.ts`, `supabase/11_terrain_observations.sql`.

---

## 0. L'idée, telle qu'elle arrive

Deux mouvements présentés ensemble : **retirer** le workbook « Repères de terrain » (4 questions de
ressenti sur le quartier), et **ouvrir** une saisie de caractéristiques de logement au grain adresse,
parce que 75 à 86 % des dossiers à 39 € affichent une échelle Logement à moitié vide.

Le second arrive sous une forme classique de solution déguisée en besoin : « il faut une saisie ».
Le besoin réel n'est pas « remplir les cases du passeport », c'est : **un lecteur a payé pour une
lecture, et sur la moitié la plus chère du produit la lecture ne se produit pas.** Le vide n'est pas
un problème de champs manquants, c'est un problème de sortie manquante (`deriveThermalEvidence`
renvoie `C_NO_DATA`, donc aucun facteur, donc aucune action).

Cette reformulation change tout le périmètre : on ne cherche pas à compléter une fiche, on cherche à
**débloquer les quelques sorties qui sont déjà écrites dans le code** et qu'aucune base ne peut
alimenter ici.

---

## 1. Ce que le produit perd en retirant le workbook

### 1.1 Ce qu'il ne perd pas : la posture « je vis ici »

Vérifié dans le code, pas de mémoire. La posture est portée par `report_context.relation`, lue par
`src/lib/report-context.ts` et transmise à la synthèse indépendamment du workbook :

- `src/app/api/synthesize-quartier/route.ts:237` — `relation` est dérivée du corps de requête, pas des réponses ;
- ligne 350 — `relation_a_la_commune` part dans le payload seule ;
- ligne 355 — `reperes_terrain_utilisateur` est un champ **à part**, déjà nul dans tous les cas de découverte, et nul aussi en résidence si personne n'a répondu (`shapeWorkbook` rend `null`).

Le bloc de prompt « RELATION À LA COMMUNE — POSTURE » est autonome : il autorise « vos étés », « le
quotidien ici » sur la seule foi de `current_residence`. **La posture survit intacte au retrait.**
Elle ne dépend pas d'une seule réponse du lecteur.

### 1.2 Ce qu'il perd vraiment, et ce n'est pas de la valeur décisionnelle

Le prompt dit lui-même ce que les repères produisent : « ancrer la prose dans le ressenti », « nommer
cet écart sobrement », et surtout « ne citez jamais les valeurs brutes ». Autrement dit, quatre
questions posées à un habitant produisent **une inflexion de ton**. C'est exactement la sortie que le
test d'admission refuse, et l'invariant n°4 avec lui : une donnée n'a de valeur que si elle aide une
décision. Ici, aucune décision ne change selon que l'été « commence à peser » ou « est déjà
difficile » : les cartes, les seuils, les actions ouvertes, la hiérarchie du rapport sont identiques.

Ce qu'on perd, précisément, tient en trois lignes :

1. **Une impression de personnalisation.** Réelle, mais c'est une impression : le lecteur reconnaît ses réponses dans la prose, il n'obtient rien qu'il n'avait pas. C'est de la satisfaction de miroir, pas de la valeur de décision.
2. **La seule boucle de retour du produit.** `QuartierSynthesis.tsx` porte un bouton « Régénérer avec mes repères » : le seul endroit où un geste du lecteur relance visiblement une production. C'est la vraie perte, et elle est réparable ailleurs (voir §2), à condition que le geste produise autre chose qu'un nouveau texte.
3. **Une asymétrie qui devient béante.** Après retrait, le lecteur en découverte garde son bloc « Vos priorités pour cette commune » (deux champs libres qui, eux, hiérarchisent l'attention de la synthèse) et **le lecteur qui vit là n'a plus rien à dire du tout**. Or c'est lui qui en sait le plus. C'est le seul argument sérieux contre un retrait sec, et il ne plaide pas pour garder le workbook : il plaide pour lui substituer des questions admissibles.

### 1.3 Une dette latente qu'il vaut mieux perdre

`supabase/11_terrain_observations.sql` documente en commentaires une « future intelligence
territoriale collective » avec agrégation anonymisée par commune au-delà de 30 observations. Cette
promesse **contredit frontalement un arbitrage déjà pris** (`arbitrages/signaux-communautaires-ecartes.md`,
avril 2026 : UGC écarté MVP et v2, réévaluation v3 au plus tôt). Retirer le workbook supprime au
passage une porte dérobée vers de l'UGC non sourcé. C'est un gain, pas une perte.

### 1.4 Piège de retrait, à traiter

`src/app/api/ask/route.ts:504-512` consomme encore `profile.workbook_quartier` pour injecter des
« observations » dans AskFuture. Un retrait qui n'enlève que l'écran laisserait AskFuture parler du
vécu d'un lecteur d'après des réponses qu'il ne peut plus ni voir ni corriger. Le retrait doit couvrir
l'écran, la route de synthèse, la route `ask`, `terrain-observations`, et la colonne de profil.

**Verdict §1 : REFUSER le workbook. Complexité évitée, aucune perte décisionnelle.** Ce n'est pas
une amputation, c'est le retrait d'une surface qui demandait un effort au lecteur et lui rendait un
adjectif.

---

## 2. Questions candidates qui passent les quatre conditions

Rappel de la barre : **nature déclarée** (contexte sur soi / constat sur le monde / désignation d'une
source), **objet observable**, **rattachement au bon grain**, **sortie décisionnelle nommée**.

Les huit ci-dessous sont admissibles. Elles ne sont pas toutes à poser (§5).

### Échelle logement (grain : dossier d'adresse)

**Q1 — « Ce logement est-il traversant (des fenêtres sur deux façades opposées) ? »** oui / non / je ne sais pas
- Nature : constat sur le monde. Objet : observable en se tenant dans le couloir. Grain : le logement, stocké sur `address_dossiers`.
- **Sortie** : facteur de lecture. `deriveThermalEvidence` sort de `C_NO_DATA` par une voie déclarée parallèle, et la lecture d'été passe de « rien à dire » à un facteur orienté, attribué au lecteur.

**Q2 — « Les fenêtres les plus exposées au soleil ont-elles des volets, persiennes ou stores extérieurs ? »** toutes / certaines / aucune
- Nature : constat sur le monde. Objet : visible depuis la rue. Grain : logement.
- **Sortie** : facteur **et** action. « Aucune » ouvre le seul levier d'adaptation à faible coût du confort d'été, hiérarchisé au-dessus des travaux lourds. La question n'a pas de sens sans cette action attachée ; si l'action disparaît, la question sort du périmètre.

**Q3 — « Y a-t-il un brasseur d'air fixe (ventilateur de plafond) ? »** oui / non
- Nature : constat sur le monde. Objet : certain. Grain : logement.
- **Sortie** : facteur, et surtout **hiérarchie d'action** : avec Q2, elle sépare « ce logement a déjà de quoi encaisser » de « la première dépense utile ici coûte quelques centaines d'euros ». C'est la seule triade du produit qui aboutit à un geste dont le lecteur peut décider ce soir.

**Q4 — « Avez-vous un diagnostic de performance énergétique dans vos documents ? (numéro à 13 caractères) »**
- Nature : **désignation d'une source**, la troisième nature, la plus précieuse. Objet : un document qu'on a en main, pas une mémoire. Grain : logement.
- **Sortie** : c'est la seule question du lot qui produit de la **donnée sourcée** : l'attribution réelle, donc les `DecisionFact` `housing.*`, donc la couverture du dossier. Déjà livrée le 20/08 ; elle reste la première marche, et toute saisie déclarée doit être proposée **après** elle, jamais à sa place.

### Échelle autour de l'adresse (grain : le point, pas la commune)

**Q5 — « Lors des fortes chaleurs, disposez-vous d'un lieu frais accessible à pied depuis cette adresse ? »** oui / non / je ne sais pas *(question du porteur, retenue telle quelle)*
- Nature : constat sur le monde. Objet : observable par qui habite là. Grain : l'adresse.
- **Sortie** : **vérification ouverte** — horaires, accès, conditions d'accueil du lieu cité. Et, en « non », une hiérarchie : la capacité de repli devient le sujet chaud du dossier, avant l'état du bâti. Bonus de sûreté : en « je ne sais pas », le produit peut confronter à ce que la BPE porte, sans jamais affirmer.

**Q6 — « Depuis que vous occupez ce logement, l'eau a-t-elle déjà posé un problème ici (cave, garage, rue impraticable, refoulement) ? »** oui / non / je ne sais pas
- Nature : constat sur le monde. Objet : vécu observable, pas une notion d'expert. Grain : l'adresse.
- **Sortie** : **vérification ouverte** de haute valeur — relire la garantie CatNat du contrat d'assurance, la franchise applicable, et vérifier si la commune a déjà été reconnue en état de catastrophe naturelle pour cet aléa (le produit porte déjà `historique_catnat`). Et une hiérarchie : l'inondation remonte en tête du dossier même quand le PPRN ne classe pas le point. Ne devient jamais une preuve : le dossier continue de dire ce que les bases établissent.

**Q7 — « Y a-t-il un trajet que vous faites toutes les semaines et que vous ne pouvez pas faire autrement qu'en voiture ? »** oui / non
- Nature : constat sur le monde. Objet : observable, c'est son propre trajet. Grain : l'adresse (départ), pas la commune.
- **Sortie** : **facteur de lecture** qui remet à sa place un indicateur communal. `faible_dependance_auto` décrit une moyenne MOBPRO ; la réponse dit si cette moyenne parle du lecteur. En « oui » sur une commune bien classée, le dossier cesse de rassurer à tort. C'est de la lucidité, pas de la personnalisation.

### Échelle du projet (grain : le dossier, contexte sur soi)

**Q8 — « Combien de temps envisagez-vous de rester à cette adresse ? »** moins de 5 ans / 5 à 15 ans / au-delà, ou je ne sais pas
- Nature : contexte sur soi, sans mélange. Objet : la seule chose que le lecteur sait avec certitude. Grain : le dossier.
- **Sortie** : **hiérarchie**, la plus puissante du lot. Elle décide de l'horizon qui domine la lecture et donc de l'ordre des sujets : à moins de 5 ans, le retrait-gonflement lent et la trajectoire 2100 passent derrière ce qui se joue maintenant ; au-delà de 15 ans, c'est l'inverse. Un clic, une réorganisation entière du rapport, zéro donnée inventée.

**Q9 (variante de contexte, à considérer) — « Êtes-vous propriétaire ou locataire de ce logement ? »**
- **Sortie** : le jeu des actions ouvertes change de nature (travaux et devis d'un côté, échanges avec le bailleur et diagnostics obligatoires de l'autre). Admissible, mais elle est probablement déjà déductible du parcours d'achat : à vérifier avant de la poser, on ne demande jamais ce qu'on sait déjà.

**Écartée volontairement** : « une personne sensible à la chaleur vit-elle ici ? ». La sortie serait
forte (hiérarchie chaleur et air en tête), mais c'est une donnée de santé du foyer, elle frôle
l'invariant n°1 et ouvre un risque RGPD disproportionné pour ce qu'elle change. À ne pas poser tant
qu'aucune autre question n'a été testée.

**Ce que ces neuf questions ont en commun, et qui est la doctrine à graver** : aucune ne demande une
information qu'une base publique porte. On ne demande jamais au lecteur ce qu'on n'a pas su aller
chercher. Ce critère unique disqualifie la surface, l'année de construction, l'étage, l'étiquette DPE,
l'inertie et la ventilation, sans avoir à discuter chacun.

---

## 3. Tension à trancher : service rendu ou facture retournée ?

**Réponse : c'est une facture retournée à l'expéditeur dès que la demande porte sur ce qu'une base
aurait pu fournir, ou dès qu'elle se place avant la livraison. C'est un service rendu dans le cas
inverse, et le cas inverse est étroit.**

Le lecteur n'a pas acheté une base de données, il a acheté une lecture. Lui demander sa surface, c'est
lui faire faire un travail de saisie pour une information qui existe au cadastre et dans les fichiers
fonciers : il paie deux fois. Lui demander si son logement est traversant, c'est lui demander la seule
chose qu'**aucune source ne portera jamais pour lui**. La première demande est humiliante, la seconde
est flatteuse : elle dit « vous savez quelque chose que nous ne savons pas ».

Quatre conditions, sur le moment et la formulation, pas sur le style.

**1. Jamais avant la livraison, jamais comme condition.** La demande n'apparaît qu'à l'intérieur du
dossier déjà ouvert et déjà lisible. Rien de ce qui a été payé ne se débloque contre une réponse. Si
le lecteur ne répond à rien, il a exactement ce qu'il a acheté. (Le brief le dit déjà : « la saisie
est une possibilité offerte, jamais une dette affichée ».)

**2. Attachée au vide, à l'endroit exact du vide.** La demande ne vit pas dans un écran de profil ni
dans une section « complétez votre dossier ». Elle apparaît **dans le bloc confort d'été**, sous la
phrase qui dit honnêtement que rien ne permet de le qualifier. La proximité physique est ce qui la
transforme de corvée en réponse.

**3. La sortie se nomme avant la question, jamais après.** La formulation admissible est de la forme
*« Trois choses que vous voyez et qu'aucun diagnostic ne dit ici ouvrent la lecture du confort d'été
de ce logement. »* La formulation inadmissible est *« Complétez les caractéristiques de votre
logement »* : elle décrit un formulaire, pas un gain. Règle générale : **une demande d'apport annonce
ce qu'elle rendra, et l'annonce doit être vérifiable dans les trente secondes qui suivent.**

**4. Le rendu est immédiat et visible.** La réponse produit un changement à l'écran tout de suite,
pas au prochain chargement, pas dans un PDF à regénérer. Trois questions qui font apparaître deux
facteurs et une action : c'est le seul moment où le lecteur comprend qu'il a été utile à lui-même.
Sans ce retour immédiat, les quatre conditions précédentes ne suffisent pas.

**Interdit corollaire** : aucun compteur de complétion, aucune barre de progression, aucun « 0/4 »,
aucune relance par mail. Un compteur transforme une offre en dette et rend la non-réponse coupable.
C'est précisément ce que fait le workbook actuel (`progressPill`, `progressBar`) et c'est une des
raisons pour lesquelles il pèse.

---

## 4. La restitution en quatre blocs : élégance de concepteur ou valeur ?

**Argument contre, d'abord, comme demandé.**

Trois des quatre blocs ne parlent pas du logement, ils parlent de **l'état du savoir sur le logement**.
« Ce que les sources établissent », « ce que vous avez indiqué », « ce qui reste inconnu » : ce sont
des méta-informations sur la provenance. Un seul bloc, « ce que cela permet de lire », porte une
lecture. Le lecteur qui a payé 39 € reçoit alors une structure où **75 % de la surface est consacrée à
l'épistémologie de futur•e**, et 25 % à sa décision. C'est le confort du concepteur : cette forme
règle proprement son problème de provenance, et elle le règle en le déléguant à l'écran.

Deux faiblesses précises.

- **« Ce que vous avez indiqué » est un miroir.** Le lecteur vient de taper ces trois réponses, il les
  connaît. Les lui rejouer sous un intertitre n'ajoute rien, sinon la preuve qu'on l'a écouté. C'est
  la même satisfaction de miroir que le workbook, avec un autre habillage.
- **« Ce qui reste inconnu » peut se lire comme la facture de ce qu'on n'a pas livré.** Une liste
  « isolation, inertie, performance énergétique documentée » sur un produit payant se lit d'abord
  comme un inventaire de manques. L'invariant n°3 demande de **montrer ce qu'on ignore** ; il ne
  demande pas d'en faire une rubrique permanente. Un aveu intégré dans une phrase de lecture porte
  la même honnêteté et ne se laisse pas lire comme un solde.

**Ce que je retiens quand même.** La forme touche juste sur un point : elle **sert le moat** en
rendant visible que futur•e distingue quatre statuts d'information là où un comparateur en affiche un
seul. Mais cette distinction se démontre mieux **au niveau de la valeur** (une mention « d'après vous »
collée au facteur, comme le brief le prévoit lui-même dans son schéma `provenance`) qu'au niveau du
bloc. La provenance voyage avec la valeur : le brief l'écrit pour la base de données, et la même règle
vaut à l'écran.

**Recommandation** : deux blocs, pas quatre.
- **Ce que cela permet de lire** (les facteurs, chacun portant sa provenance en ligne) ;
- **Ce qui reste à vérifier** — reformulation active de « ce qui reste inconnu », qui n'admet que
  des inconnues **actionnables** (un document à retrouver, un horaire à vérifier, une garantie à
  relire). Une inconnue que personne ne peut lever ne fait pas une ligne, elle fait au mieux une
  proposition subordonnée dans la lecture.

Test de survie de ce choix : si le bloc « ce qui reste à vérifier » se remplit d'items sans verbe
d'action, la forme a échoué et il faut revenir à un seul bloc.

---

## 5. Combien de champs avant que ça devienne un formulaire ?

**Le seuil n'est pas un nombre de champs, c'est un rapport.** Le critère que je propose :

> **Un champ n'existe que s'il porte une sortie distincte, nommée, et repérable dans le code par un
> `grep`. Le nombre de champs ne dépasse jamais le nombre de sorties distinctes.**

Dès que deux champs partagent la même sortie, le second est décoratif : il est là pour la complétude,
pas pour la décision. C'est le premier symptôme de formulaire, et il apparaît bien avant que la liste
soit longue.

Trois limites dures, dérivées :

1. **Trois champs visibles au même moment, maximum.** Au-delà, le lecteur passe d'« répondre » à
   « remplir ». Q1, Q2, Q3 forment un lot cohérent parce qu'ils partagent une seule promesse (la
   lecture d'été) et qu'aucune sortie ne se produit sans les autres.
2. **Deux moments de sollicitation par dossier, maximum**, et jamais deux dans le même écran.
3. **Zéro champ dont la sortie est « la synthèse en parlera ».** Ce n'est pas une sortie, c'est la
   définition de la personnalisation de prose que l'invariant n°4 refuse.

Appliqué au brief : la V1 proposée (type de logement, traversant, protections, brasseur) tient, à une
réserve près — **le type de logement n'est pas à demander s'il est déductible** du parcours d'achat
ou de la BAN. Si on doit le demander, c'est 4 champs pour 1 promesse, donc la limite haute atteinte
d'entrée, sans marge pour Q5 ou Q8. Je préfère : Q1-Q2-Q3 dans le bloc confort d'été, Q8 seule au
niveau du dossier (elle n'est pas dans le même écran ni la même promesse), et **rien d'autre en V1**.

Le signal d'alerte à surveiller, plus fiable qu'un compte de champs : le jour où quelqu'un propose
d'ajouter une **barre de progression** ou un **enregistrement automatique de brouillon**, c'est que
la surface est devenue un formulaire. Ces deux objets n'existent que pour des formulaires.

---

## 6. Ce que je recommande de NE PAS faire

1. **Ne pas demander l'étiquette DPE de mémoire.** Position du brief confirmée sans réserve. C'est un
   résultat de calcul, pas un observable ; elle nourrirait `energyState` et le vocabulaire « passoire
   thermique » d'un dossier payant, exactement là où le lecteur ira chercher un chiffre à opposer à un
   vendeur. Le produit sait déjà dire une phrase vraie : « aucune étiquette n'est attribuée ». On
   n'échange pas une vérité contre une vraisemblance.
2. **Ne pas demander la surface, l'année de construction, l'étage, l'inertie, la ventilation,
   l'isolation.** Les trois premières existent dans des bases qu'on n'a pas encore branchées ; les
   trois dernières ne sont pas observables. Aucune ne passe le test.
3. **Ne pas construire un écran « compléter mon dossier ».** Un lieu unique où l'on saisit est un
   formulaire par construction, même avec trois champs. Les questions vivent là où leur sortie
   s'affiche.
4. **Ne pas rouvrir l'agrégation communautaire** des observations d'habitants (`terrain_observations`,
   commentaires SQL). Tranché en avril 2026, et le retrait du workbook doit emporter cette table
   plutôt que la laisser en germe.
5. **Ne pas laisser le workbook à moitié retiré.** `ask/route.ts:504-512` lit encore
   `workbook_quartier` : un AskFuture qui parlerait du vécu déclaré d'un lecteur qui ne peut plus ni
   le voir ni le corriger serait pire que la version actuelle.
6. **Ne pas faire évoluer `expectedCoverage` ni la promesse d'avant-vente.** On vend ce que les bases
   portent. Une saisie possible n'est pas un argument commercial ; le jour où elle en devient un, la
   ligne « une déclaration n'est pas une donnée sourcée » sera franchie par le marketing avant de
   l'être par le code.
7. **Ne pas conditionner la régénération d'une synthèse à une saisie**, et ne pas reproduire le bouton
   « Régénérer avec mes repères ». Un geste du lecteur doit produire un **facteur ou une action**, pas
   un nouveau texte sur les mêmes faits.

---

## 7. Verdicts, hiérarchisés

| Objet | Verdict |
|---|---|
| Workbook « Repères de terrain » (4 questions) | **REFUSER** — retrait complet, écran + `ask` + table |
| Q1-Q2-Q3 (traversant, protections, brasseur), dans le bloc confort d'été | **CONSTRUIRE**, V1, trois champs, une promesse |
| Q4 (numéro de diagnostic) | **DÉJÀ LIVRÉ** — reste la première marche, proposée avant toute déclaration |
| Q8 (durée d'occupation envisagée) | **CONSTRUIRE**, séparément, si et seulement si la hiérarchie du rapport la consomme réellement |
| Q5 (lieu frais) et Q6 (l'eau ici) | **DIFFÉRER** — admissibles, mais chacune ouvre une action à écrire d'abord ; sans l'action, la question devient de la prose |
| Q7 (trajet contraint) | **DIFFÉRER** — hypothèse parquée ; déclencheur : le jour où le dossier d'adresse porte une lecture de mobilité au grain du point |
| Q9 (statut d'occupation) | **VÉRIFIER D'ABORD** s'il est déjà connu du parcours d'achat |
| Restitution en quatre blocs | **REFORMULER** en deux blocs (lecture + à vérifier), provenance au niveau de la valeur |
| Étiquette DPE déclarée, surface, année, étage, inertie, ventilation | **REFUSER** |

---

## 8. L'hypothèse porteuse de ce rapport

Elle est unique et il faut pouvoir la contester : **je crois que le lecteur d'un dossier payé
n'attribue aucune valeur au fait de se voir reflété, et une valeur forte au fait de voir apparaître
quelque chose qu'il ne savait pas.** C'est de là que découle tout le reste : le rejet de la
personnalisation de prose, l'exigence d'une sortie visible en trente secondes, la préférence pour
deux blocs plutôt que quatre.

Si cette hypothèse est fausse (si le miroir rassure, si « on m'a écouté » vaut autant que « j'ai
appris »), alors le workbook avait une valeur que je ne lui accorde pas, et la restitution en quatre
blocs en a une aussi. C'est cette croyance qu'il faut tester, pas mes conclusions.

**Ce qu'on ne sait pas, et comment l'apprendre avant de construire** :
- Le taux de réponse réel au workbook, par relation et par commune. Il est en base
  (`terrain_observations`) et il n'a jamais été regardé. **À faire avant tout retrait** : c'est une
  requête SQL, pas un chantier. Un taux très élevé invaliderait une partie de ce rapport.
- Ce que le lecteur ressent devant une demande post-achat. Testable à peu de frais : poser Q1-Q2-Q3 à
  cinq acheteurs réels et écouter le premier mot de leur réaction. « Ah oui, ça je le sais » valide ;
  « c'est à moi de le remplir ? » invalide.
- Si Q8 change vraiment la hiérarchie ou seulement le ton. Vérifiable dans le code avant de la poser :
  si aucune fonction ne consomme l'horizon pour réordonner, la question ne passe pas la condition 4.

---

## 9. Différenciation et moat

Un concurrent crédible poserait-il ces questions ? Hypothèse à vérifier (WebFetch non fait ici) : un
comparateur immobilier demanderait volontiers la surface et l'étiquette DPE, parce qu'il en fait de la
donnée. **Aucun ne demanderait « avez-vous des volets » en s'interdisant d'en faire une donnée.**
C'est là que la différenciation se joue, et elle est fragile : elle ne tient pas au fait de demander,
elle tient au fait de **refuser de convertir la réponse en preuve**. La séparation
`DecisionFact` / `CaracteristiqueDeclaree` du brief n'est donc pas une précaution technique, c'est
l'objet différenciant lui-même.

À l'inverse, le workbook actuel ne creusait rien : quatre questions de ressenti sur un quartier, c'est
la première chose que n'importe qui construirait, et c'est même ce que font les applications de
« bien-être territorial ». Il rendait futur•e plus riche, pas plus difficile à copier.

---

## 10. Tension avec le Business Strategist (non tranchée)

Trois points où nos lentilles s'opposent, à porter en `/board` :

1. **La saisie comme réponse à un vide vendu.** Sa lentille : 75 à 86 % de dossiers à moitié vides est
   un risque de remboursement et de bouche-à-oreille négatif, donc combler vite. La mienne : combler
   par de la déclaration masque le problème réel, qui est que la couverture annoncée avant l'achat
   promet une échelle que les bases ne portent pas dans 8 cas sur 10. La bonne réponse pourrait être
   commerciale (qualification plus honnête, ou prix), pas produit.
2. **Le nombre de champs.** Sa lentille : plus de champs, plus de dossiers « complets », meilleure
   perception de valeur. La mienne : trois maximum, et jamais un champ sans sortie. Nous ne
   trancherons pas ça par l'argumentation, seulement par un test.
3. **`terrain_observations` comme actif.** Sa lentille : une base d'observations d'habitants est un
   actif de données potentiellement B2B. La mienne : c'est de l'UGC non sourcé déjà écarté, et son
   existence latente est un risque de crédibilité plus qu'un actif. Ici je signale honnêtement que ma
   lentille pourrait être la mauvaise à pondérer si un débouché B2B précis existait ; je n'en vois pas
   aujourd'hui.

---

## 11. Mise à jour de doctrine proposée (à écrire par Claude principal)

- **Nouvel arbitrage** `docs/vault/arbitrages/workbook-reperes-terrain-retire.md` : rédigé comme une
  victoire produit (une surface retirée, aucune perte décisionnelle, la posture « je vis ici » prouvée
  indépendante), avec le test d'admission à quatre conditions comme corps du texte.
- **Nouvelle doctrine** `docs/vault/doctrine/apports-du-lecteur.md` : les trois natures, les quatre
  conditions, la règle « on ne demande jamais ce qu'une base porte », le plafond « autant de champs que
  de sorties, trois par moment », l'interdiction des compteurs de progression, et la formule de
  demande (nommer la sortie avant la question).
- **`docs/vault/modules/logement.md`** : la déclaration n'entre pas dans le passeport comme une case
  remplie ; elle entre dans la lecture d'été comme un facteur portant sa provenance.
- **Hypothèse parquée** (ne pas supprimer du vault) : Q5, Q6, Q7 avec leur déclencheur de réévaluation.

---

## 12. Les quatre questions de clôture

**1. Si on reconstruisait futur•e aujourd'hui, construirait-on encore le workbook ?**
Non. On ne construirait pas quatre questions dont la sortie est un adjectif. On construirait
peut-être Q1-Q2-Q3, parce qu'elles font sortir une fonction d'un état mort.

**2. Qu'est-ce qu'on perd si on le supprime ?**
La seule chose que futur•e demandait à quelqu'un qui connaît son territoire, et la seule boucle où un
geste du lecteur relançait une production. On abandonne aussi l'hypothèse d'une intelligence
territoriale collective par le ressenti — mais elle était déjà abandonnée par écrit en avril 2026, on
ne fait que cesser de la financer en dette technique. Le lecteur déçu existe : celui qui avait répondu
et qui verra sa synthèse redevenir générique. Il est rare, et on peut le nommer dans le changelog.

**3. Existe-t-il une version dix fois plus simple ?**
Oui, et c'est la recommandation : **une seule question dans le bloc confort d'été** (« ce logement
est-il traversant ? »), livrée seule, mesurée, avant d'en ajouter deux. Si personne n'y répond, aucune
des huit autres ne mérite d'être construite. Si tout le monde y répond, on a appris quelque chose que
huit questions n'auraient pas appris plus vite.

**4. Cette décision rend-elle futur•e plus difficile à copier, ou seulement plus riche ?**
Le retrait, oui : il durcit la règle « rien de non sourcé ne circule ». La saisie, seulement si la
séparation déclaré / sourcé tient dans le code et à l'écran. Une saisie sans cette séparation rendrait
futur•e plus riche et strictement plus copiable, parce qu'elle ressemblerait à ce que tout le monde
sait faire : un formulaire.

---

## 13. Si j'étais le gardien du produit

Je retirerais le workbook cette semaine sans le remplacer, et je n'ouvrirais qu'**une seule question**
(« ce logement est-il traversant ? ») dans le bloc confort d'été, pour vérifier que le lecteur répond
quand la sortie est visible, avant d'écrire quoi que ce soit sur les caractéristiques déclarées.

---

## 14. Quand rouvrir ce sujet

- **Le taux de réponse au workbook mesuré en base dépasse 40 % des dossiers en résidence** : mon
  verdict de retrait est trop rapide, il faut d'abord comprendre pourquoi on répond.
- **Q1 seule obtient moins de 15 % de réponses** : la thèse « le lecteur répond quand la sortie est
  visible » est fausse ; ne construire ni Q2, ni Q3, ni la suite, et traiter le vide du dossier
  d'adresse par la qualification d'avant-vente ou par une nouvelle source.
- **Q1 dépasse 50 %** : ouvrir Q2-Q3, puis instruire Q5 (lieu frais) avec son action.
- **Une base publique branchée (BDNB, fichiers fonciers, cadastre) fait tomber le taux d'adresses sans
  caractéristiques sous 40 %** : la saisie déclarée perd sa raison d'être pour la moitié des cas, et
  le périmètre se rediscute en entier.
- **Une réclamation ou un remboursement motivé par « la section Logement est vide »** : le sujet n'est
  plus produit, il est commercial ; il passe au Business Strategist et à la qualification.
- **Un débouché B2B identifié pour des observations d'habitants agrégées** : ma position sur
  `terrain_observations` se rediscute, et l'arbitrage UGC d'avril 2026 avec elle.
