# Veille stratégique : « Assurer ma ville » (Reclaim Finance × Data For Good)

- **Agent** : Business Strategist
- **Date** : 2026-07-02
- **Objet** : le lancement d'assurermaville.fr (1er juillet 2026) change-t-il quelque chose au moteur et au moat de futur•e ? Y a-t-il une action à prendre ?
- **Terrain lu** : `docs/vault/vision/modele-economique.md`, `docs/vault/adr/ADR-0001-pas-de-score-synthetique.md`, `/memory/project_tension_gratuit_payant.md` (goulot recadré 2026-06-28), `/memory/project_pages_explorees_dedup.md` (dette découvrabilité). Faits sur assurermaville fournis vérifiés par l'orchestrateur (2026-07-02).

## Le goulot aujourd'hui

Le goulot de futur•e est le **débit d'inconnus qualifiés en décision active devant le payant** (conclusion croisée du 28/06 : le funnel est instrumenté, l'intrant manque). Il est en amont du pari central du modèle (la disposition à payer B2C, non mesurée) : tant que personne n'arrive, on ne peut même pas mesurer le pari. Le site est en noindex, le sitemap est cassé. Toute la lecture d'assurermaville se fait à travers ce goulot : **ce site ne prend aucun inconnu qualifié à futur•e, et n'en apporte aucun**.

## Décision évaluée

Aucune décision n'est proposée : c'est une veille. Les décisions implicites à instruire sont : (1) réagir ou non au lancement, (2) re-prioriser la dette découvrabilité contre le module Logement à cause du timing presse, (3) ouvrir ou non un chantier « assurance habitation des ménages », (4) traiter ou non un risque de confusion de positionnement (leur note 0-5).

## La vraie question

La variable dominante reste le débit d'inconnus, et assurermaville ne la touche presque pas. La vraie question n'est pas « que faire face à eux ? » mais « ce lancement crée-t-il une fenêtre à coût quasi nul sur notre goulot ? ». Réponse : oui, une seule, petite : **la vague presse en cours cherche déjà la suite du sujet** (« ma commune est vulnérable, et moi, habitant ? »), et futur•e est aujourd'hui la seule à répondre à cette question-là. Tout le reste (construire, re-séquencer, contrer) serait de l'attention brûlée sur une variable secondaire.

## 1. Concurrent, allié objectif, ou bruit ?

**Allié objectif, avec un effet de bord à surveiller.**

- **L'objet mesuré est différent** : eux notent la commune comme institution (budget municipal, compte 6161, bâtiments communaux) ; futur•e éclaire le ménage dans une décision de vie. Le « qui paie » du moteur (ménage en décision active, 14/39 €) n'est pas leur cible (élus, citoyens-militants). Le job-to-be-done ne se recouvre pas : personne ne consulte assurermaville pour choisir où vivre.
- **Le moat n'est pas entamé** : ils utilisent les mêmes sources publiques (DRIAS, CatNat, RGA), ce qui re-démontre la doctrine ADR-0002 : la donnée brute n'a jamais été le moat, la transformation vers une décision individuelle l'est. Leur existence rend même l'argument tangible : « DRIAS est public, la preuve, une ONG en fait un indice gratuit ».
- **Effet positif** : ils légitiment la catégorie « vulnérabilité climatique d'une commune » dans la presse grand public (82 % des communes, chiffre repris partout). C'est du réchauffage de marché gratuit, en amont de notre entonnoir. Ils affaiblissent aussi un futur argument concurrent (« personne ne s'intéresse à ça »).
- **Effet de bord négatif (le seul)** : ils occupent l'espace de recherche « [commune] + climat + vulnérabilité » pendant que futur•e est invisible (noindex). Leur SEO vise des requêtes de plaidoyer, pas des requêtes décisionnelles (« vivre à X », « acheter à X risques ») ; le recouvrement est faible aujourd'hui. Mais chaque mois de noindex, des acteurs gratuits accumulent l'actif de distribution que futur•e n'accumule pas. C'est un rappel, pas une alerte.

**Verdict Q1 : allié objectif. Aucune riposte, aucun ajustement produit.**

## 2. Le timing presse change-t-il la priorité dette découvrabilité vs module Logement ?

**Il ne la change pas, il la confirme.** Trois raisons de ne pas se précipiter :

- La vague presse du jour J est déjà en train de retomber ; l'indexation SEO prend des semaines. Même en levant le noindex aujourd'hui, futur•e ne capterait rien de cette vague par le SEO. Se dépêcher de payer la dette « à cause d'assurermaville » serait confondre un pic d'actualité et un actif de distribution.
- Le goulot recadré le 28/06 a un premier jalon nommé : distribution founder-led vers 20-30 inconnus, apprentissage binaire sur la disposition à payer. Ni la dette découvrabilité ni le module Logement ne sont ce jalon.
- En revanche, l'événement ajoute un argument structurel (pas conjoncturel) à l'ordre déjà acté : **la dette découvrabilité avant le module Logement**. Un module Logement plus riche améliore la conversion de personne tant que personne n'arrive ; la dette découvrabilité est l'actif de distribution qui compose. Assurermaville rappelle que le terrain « commune × climat » se peuple pendant qu'on est invisible.

**La seule action datée que la vague presse justifie** : un pitch presse founder-led, cette semaine, vers les journalistes qui ont couvert assurermaville (Mediacités, rubriques éco/climat). L'angle est évident et non servi : « l'indice mesure la mairie ; voici ce que ça change pour l'habitant qui décide où vivre ». Coût : quelques heures. Upside : des inconnus qualifiés (le goulot) et un début de marque presse. C'est le pari asymétrique de la semaine, et il est compatible avec le jalon founder-led déjà décidé. Réserve honnête : pitcher un site en noindex avec paywall est faisable (les pages vivent, noindex n'empêche pas la visite), mais il faut choisir UNE page d'atterrissage propre avant d'envoyer.

## 3. L'angle « assurance habitation des ménages » : maintenant, plus tard, fausse bonne idée ?

**Plus tard comme signal, jamais comme produit autonome maintenant.**

- **La douleur économique est réelle et va croître** : surprime CatNat 12 → 20 % au 01/01/2025 (déjà dans la doctrine), franchises, non-renouvellements. C'est une ancre de prix naturelle pour futur•e (« votre assurance vous coûte déjà X de plus à cause du lieu ; 14 € pour comprendre avant de signer »).
- **Mais en faire un chantier data aujourd'hui serait un pari hors goulot** : pas de donnée publique propre à la maille ménage/adresse, un travail de sourcing lourd, et surtout aucune preuve que « l'assurabilité » soit la variable qui déclenche le paiement (la disposition à payer n'est pas même mesurée sur l'offre actuelle). Ce serait optimiser une variable secondaire avec la ressource la plus rare.
- **La version qui compose** : un signal « assurabilité » dans le futur module Logement, construit sur des données déjà en stock (récurrence CatNat, RGA), plus l'angle éditorial dès maintenant dans le discours (pitch presse, pages Savoir). Zéro chantier nouveau, l'actif de connaissance existant est réutilisé.
- **Hypothèse à tester, pas un fait** : « la peur de la non-assurabilité fait payer les ménages » est une hypothèse séduisante mais non démontrée ; assurermaville prouve l'intérêt des militants et des élus, pas celui des acheteurs. À inscrire au registre `paris.md` si on veut la suivre, pas à financer.

## 4. Risque de confusion de positionnement (leur note 0-5 vs notre refus ADR-0001) ?

**Risque faible en soi, mais il renchérit une dette interne existante.**

- La confusion directe est improbable : leur note porte sur la mairie, la leur est un outil de plaidoyer, les publics ne se croisent guère.
- L'effet réel est ailleurs : chaque acteur qui « note les communes » installe dans la tête du marché la catégorie « classement de communes », c'est-à-dire le risque structurant n°1 de la doctrine (la catégorie mal comprise : être lu comme « un comparateur de plus »). Le refus de la note (ADR-0001) devient un différenciant plus visible et plus précieux à mesure que les noteurs se multiplient.
- **L'ironie à corriger** : futur•e affiche encore des scores /100 sur `savoir/[slug]/[insee]` et l'orphelin `territoires/[slug]/[insee]` (dette documentée). Tant que ces pages existent, futur•e ne peut pas revendiquer sa distinction face aux noteurs : un journaliste ou un lecteur venant d'assurermaville qui tombe sur un /100 chez nous efface la différence. Assurermaville augmente le coût de positionnement de cette dette. C'est un argument de plus pour l'item 1 de la dette découvrabilité (retirer les /100), indépendamment du SEO.

## Effet sur le moteur, le moat, les boucles

- **Moteur** : aucun effet sur qui paie / pourquoi / quand. Effet marginal positif sur « pourquoi il paie » (l'ancre assurantielle se renforce dans le contexte 2025-2026).
- **Moat** : intact, et pédagogiquement renforcé (la donnée publique gratuite existe désormais sous une autre forme ; ce qui reste rare est la transformation en décision individuelle).
- **Boucles** : rien. Ni la boucle d'apprentissage ni la prescription ne sont touchées. Un pitch presse réussi nourrirait la prescription en amont.

## Niveau de preuve

Cette analyse repose sur des faits vérifiés (le site, sa méthodologie, sa cible) et sur deux hypothèses que je nomme comme telles : (1) « les journalistes ayant couvert l'indice sont réceptifs à l'angle habitant » (plausible, non testé, coût de test quasi nul) ; (2) « l'assurabilité fera payer les ménages » (non démontrée, à ne pas financer). Le pari central du modèle (disposition à payer B2C) reste non mesuré ; rien dans cet événement ne le lève.

## Verdict

**PASS sur le fond (aucune décision produit à prendre), avec UNE action opportuniste bornée** : le pitch presse founder-led cette semaine, parce qu'il touche le goulot (des inconnus qualifiés) pour quelques heures d'effort, pendant que le sujet est chaud. Tout le reste : ne rien construire, ne rien re-séquencer, ne pas ouvrir de chantier assurance.

### Victoire stratégique (à noter, pas à graver en arbitrage)

Trois dilutions évitées : (1) le réflexe « un concurrent est sorti, réagissons produit » alors que l'objet mesuré est une mairie ; (2) le chantier « assurance ménage » comme produit, pari déguisé en opportunité ; (3) la re-priorisation panique de la dette SEO sur un pic de presse qu'on ne peut de toute façon pas capter par l'indexation.

### Cohérence (à trancher par l'humain, pas par moi)

Le pitch presse suppose d'accepter d'exposer un produit dont le porteur connaît les inachevés (noindex, scores /100 résiduels sur des pages secondaires). Deux lectures possibles : « on pitche maintenant, la fenêtre prime » ou « on retire d'abord les /100 des pages vivantes (item 1 de la dette), puis on pitche ». Les deux sont défendables ; l'écart est de quelques jours. Je pose le choix, je ne le tranche pas.

### Mise à jour de la doctrine (si le porteur valide)

Dans `modele-economique.md` :
- **Risque n°3 (concurrence gratuite SEO)** : ajouter assurermaville.fr à la liste des acteurs, avec la qualification « plaidoyer commune-institution, recouvrement décisionnel faible, allié objectif sur la légitimation de la catégorie ».
- **Contexte d'accélération 2025-2026** : ajouter une ligne sourcée « indice de vulnérabilité assurantielle des communes (Reclaim Finance × Data For Good, juillet 2026) ; 82 % des communes ont vu leurs dépenses multirisques augmenter 2020-2024 » comme preuve supplémentaire que la douleur assurantielle devient un sujet grand public. Respecter la doctrine statistiques tierces (source militante : citer l'ONG comme auteur, ne jamais la présenter comme institut neutre).
- **Registre `paris.md`** (optionnel) : inscrire l'hypothèse « la pression assurantielle sur les ménages devient un déclencheur de paiement » avec confiance faible et critère d'observation (mentions spontanées de l'assurance dans les conversations founder-led).

## La version minimale

Un e-mail de pitch à 3-5 journalistes ayant couvert assurermaville, avec l'angle « l'indice note la mairie ; voici l'outil pour l'habitant qui décide », pointant vers UNE page d'atterrissage choisie. Une demi-journée. Ça capture ~90 % de la valeur actionnable de cet événement : le reste (doctrine, veille) est de l'hygiène.

## Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Débit d'inconnus qualifiés en décision active devant le payant (en amont du pari disposition à payer, non mesuré) |
| **Variable dominante** | L'acquisition d'inconnus qualifiés ; assurermaville ne la touche que par la fenêtre presse |
| **Temps à investir** | Une demi-journée : pitch presse founder-led + note de veille dans la doctrine (15 min) |
| **Impact attendu** | Faible à moyen, asymétrique (coût quasi nul, upside = premiers inconnus qualifiés + relation presse) |
| **Temps à NE PAS investir** | Chantier data « assurance ménage » ; riposte produit ; re-priorisation SEO en urgence ; analyse concurrentielle approfondie de leur méthodologie |
| **Priorité suivante** | Le jalon déjà acté : distribution founder-led vers 20-30 inconnus (le pitch presse en est une déclinaison) ; puis dette découvrabilité avant module Logement |
| **Sujet à rouvrir** | Voir conditions ci-dessous |

**Si j'étais CEO** : j'enverrais le pitch presse cette semaine avec l'angle « et pour l'habitant ? », je noterais assurermaville en une ligne dans les risques du modèle, et je n'y repenserais plus avant un signal listé ci-dessous.

## Quand rouvrir ce sujet

- Assurermaville (ou un fork Data For Good) ajoute un volet **ménage ou adresse** : le recouvrement devient réel, re-instruire.
- Leurs pages commencent à ranker sur des requêtes **décisionnelles** (« vivre à X climat », « acheter à X risques »), constaté lors du chantier découvrabilité : re-prioriser la dette.
- La presse installe « la note 0-5 des communes » comme catégorie grand public : accélérer le retrait des /100 résiduels et rendre le refus de la note visible dans le discours.
- Un portail immobilier ou un assureur **reprend leur indice** dans un parcours grand public : c'est le risque structurant n°4 qui s'active, board stratégique.
- Les conversations founder-led font remonter **spontanément l'assurance** comme motif : promouvoir le pari « assurabilité » du registre vers un chantier.
