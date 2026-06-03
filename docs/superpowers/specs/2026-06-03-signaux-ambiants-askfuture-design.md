# Signaux ambiants AskFuture — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Problème

AskFuture comparateur ne sait répondre qu'aux dimensions qui ont servi au classement.
Le `CONTEXTE SCELLÉ` d'une réponse ne contient, par territoire, que `raisons`, `compromis`,
`pression_eco`, `logement`, `littoral`, `trait_distinctif`. Les `raisons` ne portent une
dimension que si elle était un critère pesé. Conséquence : à une question libre du type
« et côté inondation ? » sur une recherche qui ne demandait pas l'inondation, AskFuture n'a
aucune donnée et renvoie au rapport. Honnête, mais ressenti comme une esquive.

Symptôme observé : recherche « calme + mer + services » (Hyères / Quimper / Tarnos), puis
question « et côté inondation ? » → « le comparateur ne pèse pas ça en détail, ça appartient
au rapport ». La donnée inondation existe pourtant dans l'index pour les 34 788 communes,
elle n'est simplement pas exposée à AskFuture hors critère.

## Doctrine produit (porteur)

> Le comparateur aide à choisir. Le rapport aide à comprendre.

AskFuture comparateur doit pouvoir comparer les territoires affichés sur plusieurs dimensions
**même hors critères de recherche**, mais uniquement au niveau **qualitatif et relatif**. Il
ne reçoit jamais les données détaillées du rapport (chiffres, sources, projections, cartes).

Il doit pouvoir dire :
> « Parmi les communes proposées, Guérande semble moins exposée aux inondations que La Rochelle. »

Il ne doit jamais pouvoir dire :
> « Guérande a connu 3 arrêtés CatNat contre 12 à La Rochelle. » (→ rapport)

Frontière : AskFuture aide à **comparer**, il ne devient pas un rapport gratuit. D'où le
plafond de signaux (cf. §5).

## Solution

Un nouvel objet `signaux` par territoire affiché : une map `dimension → phrase qualitative
descriptive` (bande nationale), couvrant des dimensions que la recherche n'a pas forcément
classées. Le moteur reste déterministe et sans IA. On réutilise `subScore(key, c)`, qui
renvoie déjà une favorabilité 0–100 (haut = favorable), direction gérée par dimension. Aucune
métrique brute ne quitte le moteur.

### 1. Dimensions V1

Chacune réutilise une clé `subScore` existante :

| Dimension       | Clé `subScore`            |
|-----------------|---------------------------|
| inondation      | `faible_risque_inondation`|
| chaleur         | `faible_chaleur`          |
| sécheresse      | `faible_secheresse`       |
| risque de feu   | `faible_risque_feu`       |
| nature          | `nature`                  |
| soins           | `acces_soins`             |
| emploi          | `viabilite_emploi`        |
| écoles          | `acces_ecoles`            |
| culture         | `acces_culture`           |
| proximité mer   | `proximite_mer`           |
| air             | `air_sain`                |

Exclus car **déjà** dans le contexte AskFuture (pas de doublon) : logement, littoral,
pression éco, trait distinctif.

Reporté en V2 : **froid hivernal** (pas de clé `subScore` dédiée, et surtout faible valeur
d'usage : question rarement posée spontanément, donnée disponible ≠ besoin exprimé).

### 2. Bande qualitative (terciles nationaux)

`subScore` 0–100 → 3 bandes :
- **≥ 66** : pôle favorable (peu de risque / accès facile / présence forte)
- **34–65** : intermédiaire
- **< 34** : pôle notable (risque marqué / accès limité / présence faible)

Chaque dimension porte un **triplet de phrases descriptives** (décrire le territoire, pas le
juger ; jamais « favorable / défavorable ») :

| Clé                       | ≥ 66 (favorable)                  | 34–65 (intermédiaire)                  | < 34 (notable)                     |
|---------------------------|-----------------------------------|----------------------------------------|------------------------------------|
| `faible_risque_inondation`| historique d'inondation plus faible | historique d'inondation intermédiaire | historique d'inondation plus marqué |
| `faible_chaleur`          | étés généralement plus supportables | étés intermédiaires                   | étés généralement plus chauds      |
| `faible_secheresse`       | sols moins exposés à la sécheresse | exposition intermédiaire à la sécheresse | sols plus exposés à la sécheresse |
| `faible_risque_feu`       | risque de feu plus faible          | risque de feu intermédiaire            | risque de feu plus marqué          |
| `nature`                  | davantage de nature autour         | présence de nature intermédiaire       | moins de nature autour             |
| `acces_soins`             | accès aux soins plus facile        | accès aux soins intermédiaire          | accès aux soins plus limité        |
| `viabilite_emploi`        | bassin d'emploi plus dynamique     | bassin d'emploi intermédiaire          | bassin d'emploi moins dynamique    |
| `acces_ecoles`            | accès aux écoles plus facile       | accès aux écoles intermédiaire         | accès aux écoles plus limité       |
| `acces_culture`           | offre culturelle plus présente     | offre culturelle intermédiaire         | offre culturelle plus limitée      |
| `proximite_mer`           | littoral plus proche               | littoral à distance intermédiaire      | littoral plus éloigné              |
| `air_sain`                | air généralement plus sain         | qualité de l'air intermédiaire         | air généralement moins sain        |

### 3. Dédoublonnage avec `reasons`

Si une dimension **était** un critère de tri (sa clé est dans `parsed.preferences`), on
**n'émet pas** son signal ambiant : la `reason` la porte déjà. Net : `reasons` = « pourquoi
ça ressort », `signaux` = « tout le reste, qualitatif ». Pas de double mention.

### 4. Sélection des 5 signaux les plus discriminants

Plafond **5 signaux par territoire**, pour ne pas recréer un mini-rapport. Règle :

1. Calculer `subScore` pour chaque dimension ambiante, retirer celles déjà critères (§3) et
   celles dont le score est `null` (donnée absente).
2. Trier par **|score − 50| décroissant** (les traits les plus marqués, favorables OU
   notables, d'abord ; les « intermédiaire » fades tombent en bas).
3. Garder les **5 premières**. En cas d'égalité de |score − 50|, ordre stable selon l'ordre
   fixe du tableau §1 (déterminisme).
4. Mapper chaque dimension retenue sur sa phrase de bande (§2).

`signaux` est donc un `Record<string, string>` de **0 à 5 entrées** (clé dimension lisible →
phrase). 0 si toutes les dimensions sont déjà des critères ou absentes.

### 5. Où c'est calculé

Dans `src/lib/comparateur-vie.ts`, à la construction de chaque `MatchResult` **affiché**
(les `results` seulement, coût négligeable) :
- nouvelle table module `AMBIENT_DIMENSIONS` : liste ordonnée `{ id, key, bands: [fav, mid, notable] }` ;
- helper `buildSignaux(c, requestedKeys)` : applique §2–§4, renvoie `Record<string,string>` ;
- `MatchResult` gagne le champ `signaux: Record<string, string>`.

Aucune métrique brute n'est exposée : seules les phrases de bande quittent le moteur.

### 6. Branchement dans les routes

**`ask/route.ts`**
- `buildContextBlock` : ajouter `signaux: t.signaux ?? {}` par territoire dans le payload scellé.
- Réécrire la section `124-131` (« SI LA QUESTION DEMANDE LE DÉTAIL DU RAPPORT ») pour
  distinguer deux niveaux :
  - signal **qualitatif présent dans `signaux`** → réponds, compare entre communes affichées,
    ne souligne un écart que s'il est net (bandes différentes), **jamais de chiffre** ;
  - précision **fine / à l'adresse / chiffrée** (cartographie de l'aléa, intensité locale,
    valeur exacte) → `routes_to_report=true`, renvoi au rapport.
- Nouvelle section « SI DES `signaux` SONT DONNÉS POUR LES TERRITOIRES » : qualitatif et
  relatif uniquement ; comparaison entre communes affichées autorisée ; ne jamais inventer une
  dimension absente de `signaux` ; jamais de nombre ; pas un nouveau classement.

**Synthèse (`synthesize/route.ts`) — inchangée en V1, UNE exception**
- Les signaux ambiants **ne** vont **pas** à la synthèse (son rôle reste d'expliquer le
  classement, pas de dérouler des dimensions non demandées).
- Exception (corrige la limite écoles/culture) : **toute préférence explicitement demandée et
  utilisée dans le classement doit apparaître au moins une fois dans la synthèse.** Ajout
  d'une règle au prompt de synthèse : ne pas omettre un critère demandé du récit principal.

## Hors périmètre

- Froid hivernal (V2).
- Toute métrique brute, source, projection, carte, intensité locale (restent au rapport).
- Synthèse : pas de signaux ambiants (réservés à AskFuture).
- Aucune modification du moteur de scoring / tri (les signaux sont post-classement, narratifs).

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. `curl /match` : chaque `result` porte `signaux` (≤ 5 entrées) ; un critère demandé n'y est
   pas dupliqué ; une commune sans donnée sur une dimension ne l'émet pas.
3. `curl /ask` avec `signaux` en contexte + « et côté inondation ? » → réponse qualitative et
   comparative entre communes affichées, **zéro chiffre**, pas d'esquive vers le rapport.
4. `curl /ask` « et côté X ? » pour une dimension **hors** `signaux` du territoire → renvoie
   honnêtement au rapport (pas d'invention).
5. `curl /synthesize` avec un critère explicite (ex. `acces_culture`) → le récit le mentionne
   au moins une fois.
6. Témoin transversal : aucun nombre n'apparaît dans une réponse AskFuture.

## Notes doctrine

- Signaux **descriptifs**, jamais normatifs (« plus marqué », pas « défavorable »).
- Bande **nationale** ; l'« écart notable » entre communes émerge du fait qu'AskFuture voit la
  bande de tous les territoires affichés (pas de logique relative supplémentaire dans le moteur).
- Cf. [[feedback_callendar]] (ne pas citer Callendar), [[feedback_no_em_dash]] (pas de tiret
  cadratin), [[feedback_tooltip_no_sources]] (esprit : qualitatif, pas de méthodo/source).
