# Rapport produit — Product Strategist (futur•e)
## Décision évaluée : le module « Métier » / Emploi a-t-il sa place ?

> Rapport produit par le sous-agent `product-strategist` (read-only) lors de son test à blanc, 2026-06-26.
> Évaluation datée, pas de la doctrine (cf. `../_README.md`). Verdict : REFORMULER.
> Faits vérifiés par Claude principal : l'arbitrage `loisirs-pas-de-module-autonome.md` existe et
> dit bien ce qui est cité ; l'état du code Métier est réel (`metier_general`, wizard à secteurs,
> `product.ts`).

---

### L'idée
Conserver et investir un module **Métier** parmi les six surfaces produit : « Ce que le climat fait à votre secteur et à votre travail ». Il arrive comme une **brique déjà posée dans l'architecture** (6 modules, 6 étapes de wizard) qu'on suppose devoir compléter, parce qu'elle existe dans la grille. La vraie question n'est pas « comment le finir » mais « a-t-il sa place ? ».

Ce qui existe réellement dans le code (vérifié) :
- Une **étape de wizard** (`WizardStep.tsx`) : on choisit un secteur parmi 12 (Agriculture, BTP, Santé, Tourisme, Retraité, Sans emploi…).
- Un **dictionnaire de textes nationaux figés** (`FutureELanding.tsx`, `metier_general`) : un paragraphe générique par secteur, identique quelle que soit la commune.
- **Aucune source de données externe**. Pas de rendu de rapport localisé.

C'est donc moins « à peine commencé » que **structurellement non-territorial dans sa conception actuelle** : la réponse est la même pour La Rochelle et pour Lyon.

### Le vrai besoin du lecteur
Derrière « Métier », un besoin **réel** et présent dans l'archétype : le moment déclencheur cite « une réorientation ». Le besoin authentique : **« si je m'installe ici, est-ce que je pourrai y travailler / mon activité y tient-elle ? »** — une facette de « ne pas avoir oublié l'essentiel ».

Mais ce besoin est **territorial** (la vitalité du bassin d'emploi *de ce lieu*), alors que le module actuel répond à une **autre** question, sectorielle et nationale : « que devient mon métier dans le pays ? ». Vraie, mais **détachée du lieu**, donc du moat. La réponse la plus évidente (un onglet par secteur), pas la plus juste.

### Valeur pour le lecteur
Faible, telle que conçue. Le texte sectoriel **donne à voir sans aider à arbitrer** : identique partout, il ne change rien au choix entre deux communes. Or `positionnement.md` : « la décision, pas la compréhension », « pas un SIG ». Un module qui informe sur l'avenir du BTP sans aider à trancher *où vivre* est un **ornement de culture générale**, le « contenu crédible sans l'être » que l'archétype rejette. La version *territoriale* aurait, elle, de la valeur décisionnelle — mais sans besoin d'un module autonome.

### Coût de complexité
Un septième front : une étape de wizard de plus (friction), une promesse home (« 6 analyses… métier ») à tenir, une dette de crédibilité (un module sans données fragilise la confiance que tout le produit vend). **Ce qui pourrait ne pas exister** : le module en tant que surface autonome, et l'étape de wizard dédiée, sans perte d'actionnable pour le lecteur.

### Cohérence avec la vision
Le **précédent est déjà tranché** : `arbitrages/loisirs-pas-de-module-autonome.md` décrit mot pour mot la situation — « le sujet est réel mais ne porte pas une surface produit entière (…) un module dédié aurait dilué l'offre sans masse critique de données propres ». Le territoire de marque est la **compatibilité d'un lieu**, pas un observatoire des métiers. Le Métier sectoriel pousse vers le « média qui raconte le climat », ce que futur•e refuse d'être.

### Transformation
Nulle. Apprendre que « le BTP est exposé à la chaleur » n'ajoute pas de capacité d'arbitrage : donnée vraie et inerte, le piège de l'« altitude modérée » (`feedback_signature_identitaire`).

### Ce qu'on ne sait pas (et comment l'apprendre)
- **Hypothèse** : les lecteurs veulent-ils une lentille emploi dans une décision *résidentielle* ? → PostHog : complétion de l'étape « métier » du wizard, et ouverture du module Métier vs les autres. S'il est le moins ouvert, le verdict se confirme.
- **Forme du besoin** : « comparer la solidité économique d'un lieu » vs « se rassurer sur son métier » ? → une sonde sur `/ou-vivre`, ou 5 entretiens du segment réorientation.
- Avant d'investir une heure de données : ne pas construire sur une intuition d'architecture.

### Verdict : REFORMULER (le besoin est réel, la surface autonome ne l'est pas)
Deux destinations légitimes, comme pour les loisirs :
1. **Vitalité économique du lieu → fondre dans Territoire** (un signal « bassin d'emploi / dynamisme économique », territorial, comparable, décisionnel).
2. **Contenu sectoriel national → éditorial, pas module** : vit mieux dans `/savoir` (un article par secteur), et c'est là qu'il devient un actif **B2B** (un CGP qui qualifie l'exposition sectorielle d'un client).

### Victoire produit (à graver dans `arbitrages/`)
**« Pas de module Métier autonome. »** Complexité évitée (7e surface sans données, étape de friction, promesse home intenable), parcours préservé, précédent appliqué (loisirs). Besoin redistribué : vitalité du bassin dans Territoire, contenu sectoriel en éditorial/B2B.

### Tension avec le Business (à porter en `/board`)
Frontale et assumée. Le découpage **par secteur** est exactement l'angle qui sert le **relais B2B** (assurance et CGP raisonnent par exposition sectorielle ; CityScan facture déjà cette intelligence à ces professions). Le Business a une raison rationnelle de **garder** la donnée sectorielle comme actif 2027. Ma lentille B2C dit l'inverse : dans le parcours du particulier, ce module **dilue**. Je ne tranche pas, mais je signale que « investir Métier *pour le B2C* » et « investir le secteur *comme actif B2B* » sont **deux décisions différentes qu'on confond parce qu'elles portent le même nom**. La seconde peut être bonne ; elle ne justifie pas la première.

### Mise à jour de la doctrine (prête à écrire)
- Nouvel `arbitrages/metier-pas-de-module-autonome.md` (calqué sur loisirs).
- `modules/territoire.md` : la frontière « secteur d'activité (Métier) » devient caduque côté module ; ajouter un signal « vitalité économique du bassin ».
- `project_modules` (/memory) : passer de « 6 modules » à 5, Métier reformulé.
- `product.ts` / `WizardStep.tsx` / `FutureELanding.tsx` (home « 6 analyses ») : reliquats à nettoyer une fois tranché.

---

**Si j'étais le gardien du produit** : je ne construirais pas le module Métier. Je l'écarte comme surface autonome, je vérifie sur PostHog que l'étape « métier » du wizard est bien la plus abandonnée, et je ne garde la donnée sectorielle que si le Business la défend explicitement comme **actif B2B 2027**, jamais comme promesse B2C.
