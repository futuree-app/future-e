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
plafond de signaux (cf. §4).

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
| air             | `air_sain`                |

Exclus car **déjà** dans le contexte AskFuture (pas de doublon) : logement, littoral,
pression éco, trait distinctif.

Reporté en V2 :
- **froid hivernal** (pas de clé `subScore` dédiée, et surtout faible valeur d'usage :
  question rarement posée spontanément, donnée disponible ≠ besoin exprimé).
- **proximité mer** (`proximite_mer`) : déjà visible partout, souvent demandée explicitement,
  faible intelligence comparative. Les dimensions retenues (inondation, air, soins, emploi,
  culture, écoles, chaleur, sécheresse, feu, nature) sont précisément celles qu'un humain ne
  voit pas immédiatement. On préserve la rareté du signal en l'écartant.

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
| `air_sain`                | air généralement plus sain         | qualité de l'air intermédiaire         | air généralement moins sain        |

### 3. Dédoublonnage avec `reasons`

Si une dimension **était** un critère de tri (sa clé est dans `parsed.preferences`), on
**n'émet pas** son signal ambiant : la `reason` la porte déjà. Net : `reasons` = « pourquoi
ça ressort », `signaux` = « tout le reste, qualitatif ». Pas de double mention.

### 4. Sélection : contraste de groupe d'abord, puis 5 signaux max

AskFuture répond sur « parmi ces territoires… », pas « par rapport à la France entière ». Un
signal n'a donc de valeur que s'il **différencie les communes affichées**. La bande nationale
sert à produire la phrase (description honnête et absolue) ; un **filtre de contraste local**
décide si on l'émet. Si les trois communes partagent la même bande sur une dimension (toutes
« accès aux soins plus facile »), le signal n'aide pas à choisir : on ne l'émet pas.

Le calcul est donc **collectif** sur l'ensemble des territoires affichés (`results`), pas
isolément par commune :

1. Pour chaque dimension ambiante : `subScore` + bande nationale (§2) pour chaque commune
   affichée. Retirer la dimension par commune si elle est déjà un critère (§3) ou si le score
   est `null` (donnée absente).
2. **Filtre de contraste de groupe** (si ≥ 2 communes affichées) : ne **retenir** une
   dimension que si les communes qui ont la donnée s'étalent sur **≥ 2 bandes nationales
   distinctes**. Sinon (toutes la même bande), la dimension est écartée pour tout le groupe.
3. **Sélection par territoire** : parmi les dimensions retenues, classer pour chaque commune
   par **|score − moyenne du groupe sur cette dimension| décroissant** (ce qui distingue
   *cette* commune de ses voisines remonte en premier), garder les **5 premières**. Égalité :
   ordre stable selon le tableau §1.
4. Mapper chaque dimension retenue sur sa phrase de bande (§2).

**Cas d'une seule commune affichée** (ex. `perfectMatch`) : pas de contraste possible. On
retombe sur la lecture absolue : dimensions non critères et non nulles, classées par
**|score − 50| décroissant**, 5 max. Ainsi un résultat unique garde des signaux utiles à une
question « et côté X ? ».

`signaux` est un `Record<string, string>` de **0 à 5 entrées** (clé dimension lisible →
phrase). 0 si rien ne contraste / tout est déjà critère ou absent.

### 5. Où c'est calculé

Dans `src/lib/comparateur-vie.ts`. Comme la sélection est **collective** (filtre de contraste
de groupe), le calcul se fait une fois sur l'ensemble des `results` affichés, après leur
sélection :
- nouvelle table module `AMBIENT_DIMENSIONS` : liste ordonnée `{ id, key, bands: [fav, mid, notable] }` ;
- helper `assignSignaux(results, requestedKeys)` : applique §2–§4 sur le groupe (calcule les
  bandes, le filtre de contraste, la moyenne de groupe par dimension, puis remplit jusqu'à 5
  signaux par commune) ;
- `MatchResult` gagne le champ `signaux: Record<string, string>` (rempli par `assignSignaux`).

Coût négligeable (≤ ~10 communes × 10 dimensions). Aucune métrique brute n'est exposée :
seules les phrases de bande quittent le moteur.

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
  - **Signaux moins favorables autorisés** (le filtre de contraste les fait remonter
    légitimement) : AskFuture peut spontanément dire qu'une commune affichée est plus exposée /
    moins dotée qu'une autre. Sinon on retombe dans le travers « tout est merveilleux ».
  - **Règle de ton (stricte)** : constat, jamais alerte, jamais recommandation. Décrire, pas
    corriger. Ex. acceptable : « Parmi les trois, Narbonne semble plus exposée à la chaleur
    estivale que Quimper. » Jamais : « attention », « évitez », « privilégiez ».

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
   pas dupliqué ; une commune sans donnée sur une dimension ne l'émet pas ; **une dimension où
   toutes les communes affichées partagent la même bande n'apparaît dans aucun `signaux`**
   (filtre de contraste). Témoin inverse : une dimension où les communes diffèrent apparaît.
3. `curl /ask` avec `signaux` en contexte + « et côté inondation ? » → réponse qualitative et
   comparative entre communes affichées, **zéro chiffre**, pas d'esquive vers le rapport.
4. `curl /ask` « et côté X ? » pour une dimension **hors** `signaux` du territoire → renvoie
   honnêtement au rapport (pas d'invention).
5. `curl /synthesize` avec un critère explicite (ex. `acces_culture`) → le récit le mentionne
   au moins une fois.
6. Témoin transversal : aucun nombre n'apparaît dans une réponse AskFuture.

## Notes doctrine

- Signaux **descriptifs**, jamais normatifs (« plus marqué », pas « défavorable »). Le ton est
  un constat, jamais une alerte ni une recommandation.
- Bande **nationale** pour la phrase, mais l'utilité comparative est garantie au niveau
  **donnée** : un signal n'est émis que s'il contraste dans le groupe affiché (§4). On ne se
  repose donc PAS sur le LLM pour filtrer le bruit « les trois sont pareilles ».
- Un signal n'est affiché que s'il apporte une différence utile entre les territoires proposés.
- Cf. [[feedback_callendar]] (ne pas citer Callendar), [[feedback_no_em_dash]] (pas de tiret
  cadratin), [[feedback_tooltip_no_sources]] (esprit : qualitatif, pas de méthodo/source).
