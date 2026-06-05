# Comparateur 3 communes : révélateur d'arbitrages (teaser de décision)

Date : 2026-06-05
Statut : design validé (avec raffinements porteur), prêt pour writing-plans
Périmètre : nouvelle vue « en place » dans le parcours `/ou-vivre`, + 2 champs déterministes au moteur

## Thèse

futur•e n'aide pas à analyser des communes, il aide à **choisir**. Cette vue n'est
pas un comparateur, c'est un **révélateur d'arbitrages**. Elle répond à UNE
question : « pourquoi ces trois communes ne racontent pas la même histoire ? », et
génère du **doute intelligent** (« les trois sont bons, mais pas pour les mêmes
raisons ») que le futur Pack Décision résoudra.

Principe directeur : plus le moteur s'enrichit, moins on montre de scores, plus on
montre des arbitrages. Zéro chiffre, zéro détail (le chiffre et le détail restent
le rôle du rapport payant).

## Décisions cadrées (brainstorming porteur)

- **Zéro score affiché.** Un score (88/86/84) fait conclure « le premier est
  meilleur » et détruit la nuance « compatibles pour des raisons différentes ».
- **Compromis toujours présent** par commune (construit la confiance : on ne vend
  pas un territoire parfait).
- **Identité = promesse de vie**, pas description. Déterministe, par archétype.
- **2 forces : une confirme le projet, une est une découverte** (dimension forte
  non demandée). Évite de répéter la requête.
- **Vue en place** dans `/ou-vivre` (réutilise l'état client déjà calculé). Route
  dédiée partageable = V2.
- **Génération 100 % déterministe.** Aucune IA. Aligné avec tout le moteur.
- **Résolution V1 : les deux** (rapport par territoire existant + placeholder Pack
  Décision « élargir + trancher »).

## Placement et flux

Le CTA existant « Comparer ces territoires » (fin de `OuVivreClient.tsx`, qui pointe
aujourd'hui vers l'ancien `/comparateur?a&b&c`) est **repointé** vers la nouvelle
vue, affichée **en place** (bascule d'écran focalisée avec retour), car le contenu
dépend du projet en mémoire client (`outcome` : `reasons`, `tradeoff`, `distinctive`,
`signaux`). Aucune page autonome par INSEE (elle n'aurait pas le projet). Aucun
recalcul : la vue est une présentation pure de `outcome`.

L'ancien `/comparateur` 2 communes (live data, gated Suivi) reste **intact**, pour
qui arrive avec deux communes déjà en tête (usage devenu anecdotique, non touché).

## Contenu, par commune (structure fixe)

Au-dessus des 3 blocs, la phrase de cadrage :
> Les trois pourraient convenir à votre projet. Mais ils ne racontent pas la même histoire.

Chaque commune, dans le même ordre :

### 1. Identité (promesse de vie, déterministe par archétype)

Une phrase « Pour… » qui raconte la décision, pas la géographie. Construite en deux
temps :

a) **Classement en archétype** à partir des seuls signaux mesurés :
   - `taille` (UU) : village / petite ville / ville moyenne / grande ville / métropole
   - `contexte` : littoral / montagne / rural / périurbain (proche d'une grande UU) / urbain
   - `dominante` : le plus haut subScore parmi un ensemble curé de traits de
     caractère : `vie_locale`, `vie_etudiante`, `cadre_calme`/`calme_sonore`,
     `nature`, `acces_services`/`acces_soins`, `croissance_demographique`,
     `faible_chaleur`, `proximite_mer`.

b) **Mapping archétype → promesse** depuis une banque curée (table de départ, à
   valider et affiner par sonde) :

   | Archétype (contexte + dominante + taille) | Promesse « Pour… » |
   |---|---|
   | périurbain d'une métropole + services/transports | Pour rester proche d'une grande ville sans en vivre le centre. |
   | littoral + proximite_mer/calme + petite/moyenne | Pour un quotidien tourné vers la mer, à un rythme plus posé. |
   | sud + littoral/proche + services grande ville | Pour le quotidien méditerranéen avec les services d'une grande ville. |
   | faible_chaleur dominante + rural/calme | Pour chercher davantage de fraîcheur et un rythme plus posé. |
   | ville moyenne + vie_etudiante | Pour une ville étudiante à taille humaine. |
   | croissance_demographique + services | Pour s'installer dans un territoire qui monte. |
   | rural + nature/calme | Pour un cadre rural préservé, loin de l'agitation. |
   | grande ville/métropole + services/transports | Pour la vie d'une grande ville et tous ses services. |
   | vie_locale dominante + petite/moyenne | Pour une petite ville qui reste vraiment vivante. |

   Repli neutre si aucun archétype ne se détache nettement : une promesse générique
   sobre dérivée de la dominante seule (« Pour un bon équilibre entre cadre de vie et
   services. »). Jamais d'invention au-delà des signaux.

   Honnêteté : la promesse est toujours adossée à un signal réel et formulée en
   aspiration relative (« chercher davantage de fraîcheur »), jamais en superlatif
   absolu. Respecte [[feedback_signature_identitaire]] (raconter le lieu, ne pas
   fuiter une donnée brute) et « décrire, jamais juger ».

### 2. Deux forces (une confirmation, une découverte)

- **Force 1, confirmation** : la meilleure `reason` (critère demandé bien noté).
- **Force 2, découverte** : la dimension forte la plus saillante **non demandée**,
  tirée des `signaux` ambiants (déjà filtrés par contraste de groupe). Crée l'effet
  « tiens, je n'y avais pas pensé » (bassin étudiant, accès aux soins, littoral…).
- Replis : si aucune découverte disponible, prendre les 2 meilleures `reasons` ; si
  < 2 `reasons`, compléter par `distinctive` ou meilleurs subScores.

### 3. Un compromis, toujours

- `tradeoff` s'il existe ; sinon la dimension la plus en retrait **du groupe affiché**
  (réutilise la logique de contraste déjà server-side), en prose douce :
  > En échange, la chaleur estivale est plus marquée que dans les autres options.
- Cas sans faiblesse réelle : « Le bon compromis des trois, sans faiblesse marquée. »
- Toujours formulé « que dans les autres options » (relatif au groupe, jamais nommer
  un perdant ni donner de chiffre).

### Fallback quand les trois se ressemblent

Le compromis toujours affiché traite déjà le « pas de territoire parfait ». Si les
identités et forces se recouvrent fortement (peu de contraste de groupe), une phrase
de cadrage honnête remplace la promesse de divergence :
> Ces trois-là se ressemblent beaucoup. Elles se séparent surtout sur [dimension].

On ne force jamais une divergence inventée.

## Moteur : deux champs déterministes ajoutés

Dans `matchProjects` (`src/lib/comparateur-vie.ts`), calculés sur le groupe affiché
(`shownPicks`), exactement comme `distinctive`/`signaux` le sont déjà :

- `MatchResult.identite: string` : la promesse de vie (composer archétype ci-dessus).
- `MatchResult.compromis: string` : le compromis toujours non-null (tradeoff, sinon
  retrait de groupe, sinon « bon compromis sans faiblesse marquée »).

Les forces (confirmation + découverte) se dérivent côté client depuis `reasons` +
`signaux` déjà exposés (pas de nouveau champ). Aucune modification du scoring ni du
tri : ces champs sont narratifs, hors score, hors tri (même statut que `distinctive`).

## Résolution (bas de vue)

Deux chemins :

1. **Rapport par territoire** (existant) : « Débloquer le rapport de [commune] » →
   `/territoire/[insee]/debloquer?...` (paywall déjà codé, cf. [[parcours_doctrine]]).
2. **Placeholder Pack Décision** (« bientôt ») :
   > Les 3 rapports détaillés, plus jusqu'à 3 nouvelles idées de territoires pour le
   > même projet et un rapport supplémentaire offert.

   CTA qui capte l'intention (analytics/waitlist), sans produit derrière. Gardes-fous :
   « jusqu'à 3 » (honnête si le vivier est mince), cadrage « bientôt », promesse
   livrable (le moteur sait générer plus : `TARGET=5` aujourd'hui, passable à 6 ;
   l'étalement diversité gère déjà les rangs 4-6). Le teaser gratuit reste à 3 ; les
   rangs au-delà ne sont pas dévoilés (à isoler du payload quand on construira le Pack).

## Instrumentation

Évènements PostHog pour mesurer la valeur dans le parcours : ouverture de la vue
(clic « comparer »), temps passé, clic « débloquer rapport » (par rang), clic
placeholder Pack Décision, retour/abandon.

## Hors-scope

- SKU Pack Décision réel (repoussé) : seul le placeholder est livré.
- Ancien `/comparateur` 2 communes : intact.
- Tout chiffre / détail / accessibilité : rapport payant.
- Wizard (parcours commune connue, cf. [[parcours_doctrine]]).
- Route dédiée partageable + SEO « X ou Y » : V2.
- Aucune modification du scoring / tri / étalement.

## Vérification

- `npx tsc --noEmit` propre + eslint sur les fichiers touchés.
- Sonde live (gate data, doctrine) : passer des projets réels variés dans le moteur
  et lire les sorties `identite` / forces / `compromis` sur de vrais trios. On ne
  fige la table d'archétypes et les règles de forces qu'après lecture porteur (les
  promesses sont des PROMESSES, comme les chips du chantier A).
- Relecture doctrine : aucun tiret cadratin, aucun chiffre, aucune promesse d'un
  signal absent, « décrire jamais juger ».

Cf. [[parcours_doctrine]], [[project_trait_distinctif]], [[project_signaux_ambiants_askfuture]],
[[feedback_positionnement_compatibilite]], [[feedback_signature_identitaire]], [[feedback_no_em_dash]].
