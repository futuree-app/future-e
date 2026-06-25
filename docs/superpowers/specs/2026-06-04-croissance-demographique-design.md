# Croissance démographique — design

Date : 2026-06-04
Statut : design validé, prêt pour plan d'implémentation.

## Problème

Le comparateur ne répond pas à une phrase utilisateur fréquente : « je veux une ville qui se
développe », « je ne veux pas vivre dans un endroit qui se vide », « un territoire qui attire ».
Aucun critère actuel ne porte la **trajectoire démographique** du territoire. C'est distinct de
`vie_locale` (vie sociale) : un territoire peut gagner des habitants en étant un lotissement
péri-urbain sans âme, ou en perdre légèrement tout en ayant une vie locale exceptionnelle.

## Intention

Critère opt-in `croissance_demographique` : mesurer si un territoire **gagne ou perd des
habitants**, avec un narratif qui explique la **nature** du phénomène (arrivée de nouveaux
habitants vs natalité).

Architecture en deux temps, cohérente avec le patron récent de futur•e (score lisible + signal
narratif qui qualifie le phénomène, cf. inondation observée + pression, vie étudiante accès +
dynamisme, mobilité observée + transports) :
- **Score = A** : taux de croissance démographique **total** (le plus universel, « se
  développe / se vide »).
- **Narratif = B** : **part de nouveaux arrivants** (habitants ayant emménagé depuis une autre
  commune / dépt / région / l'étranger dans l'année), via les variables IRAN du recensement.
  Plus fidèle à « est-ce que des gens viennent s'installer ici ? » que la décomposition
  naturel/migratoire, et **une seule source**.

Principe de nommage (test de stabilité du porteur) : « si je retire le narratif migratoire, le
nom reste-t-il vrai ? ». `croissance_demographique` → oui. `attractivité` → non (ce serait le
migratoire, qui n'est que le narratif). Donc la clé repose sur ses propres jambes, et on évite
la collision sémantique avec `vie_locale` (les gens projetteraient vie sociale/commerces/emploi
sur « attractivité »).

## Identité du critère

- **Clé** : `croissance_demographique`.
- **Libellé utilisateur** (incarné) : « Un territoire qui gagne des habitants ».
- **Champ index** : `c.demographie = { croissance, taux_total, part_nouveaux } | null`.
  - `croissance` : score 0-100 (percentile national du taux total).
  - `taux_total` : taux de croissance annualisé (%).
  - `part_nouveaux` : part (%) des habitants ayant emménagé depuis une autre commune/dépt/
    région/l'étranger dans l'année (IRAN3-7 / pop 1 an+). Narratif uniquement.
  - `null` = donnée absente (commune trop récente, fusionnée, hors champ recensement).
- **Opt-in strict** : rural/territoire stable non pénalisé hors critère.

## Source de données

INSEE, **base communale « Évolution et structure de la population » 2021 (recensement)**, une
seule source (confirmée à l'acquisition) :
`https://www.insee.fr/fr/statistiques/fichier/8201904/base-cc-evol-struct-pop-2021_csv.zip`
(zip → `base-cc-evol-struct-pop-2021.CSV`, séparateur `;`, encodage latin-1, 321 colonnes,
niveau commune `CODGEO`). On en dérive **les deux** signaux :
- `taux_total` = `(P21_POP / P15_POP)^(1/6) − 1` annualisé (fenêtre 2015-2021).
- `part_nouveaux` = `(P21_POP01P_IRAN3 + IRAN4 + IRAN5 + IRAN6 + IRAN7) / P21_POP01P` : part des
  habitants (1 an et +) ayant emménagé d'une autre commune/dépt/région/DOM/étranger dans
  l'année. (IRAN1 = même logement, IRAN2 = même commune → exclus : ce ne sont pas des arrivées
  d'ailleurs.)

La base ne contient **pas** de naissances/décès (donc pas de décomposition naturel/migratoire) ;
le narratif passe par les arrivées IRAN, plus fidèle à l'intention et sans 2ᵉ source.

**Fenêtre temporelle : 2015-2021 par défaut.** Choix assumé : robuste > frais. Une fenêtre
intercensitaire de ~6 ans lisse le bruit ; pour un comparateur de projet de vie, un signal
légèrement ancien mais stable vaut mieux qu'un indicateur frais mais volatil.

## Métrique

- **Score** : percentile national du `taux_total` annualisé. **Signé** : une commune qui se
  vide → percentile bas, qui gagne → haut. Lisible : « gagne / stable / perd des habitants ».
- **Narratif nouveaux arrivants** : surfacé en synthèse + AskFuture (patron `climatInondation`
  = signal narratif HORS score), en croisant le **signe de la croissance** et le **niveau de
  `part_nouveaux`** (tercile national). Quatre cas (formulations descriptives) :
  - croissance + forte arrivée → « gagne des habitants et attire de nouveaux arrivants »,
  - croissance + faible arrivée → « gagne des habitants sans fort renouvellement récent »,
  - stable + forte arrivée → « population stable, mais renouvellement résidentiel marqué »
    (le « cas 3 », désormais capté),
  - déclin + faible arrivée → « perd des habitants et accueille peu de nouveaux arrivants ».

**Limite honnête inscrite** : `part_nouveaux` est une **arrivée résidentielle récente sur 1 an**
(année du recensement), pas une attractivité structurelle parfaite ; flux **entrant** (pas le
net entrées-sorties). Plus volatil sur les très petites communes — acceptable pour un narratif
**qualitatif par bandes**, glosé, jamais présenté comme une mesure fine.

**Bruit des petites communes : à trancher PAR SONDE, pas a priori.** Un village de 50 hab à
+5 habitants = +10 %/6 ans, qui squatterait le haut du classement. NE PAS winsoriser d'emblée :
d'abord regarder les extrêmes réels (cf. Validation), puis décider si un lissage (shrinkage du
taux vers 0 pour les faibles populations, comme le K de `vie_locale`) est nécessaire.

## Câblage TS

Script `scripts/populate-demographie.py` (venv `.venv-bpe`, numpy ; `--selftest` / `--summary`
/ `--probe` / `--matrix` / `--write-index`).

Six points de câblage (`comparateur-vie.ts` + `comparateur-labels.ts`) :
- `PREFERENCE_KEYS` : `croissance_demographique`.
- `subScore` : `c.demographie?.croissance ?? null`.
- `REASON_POS` : « population en croissance ». `REASON_NEG` : **« population en baisse »**
  (FACTUEL, jamais « peu dynamique / peu attractif » : certains cherchent des territoires
  stables ou détendus — décrire, jamais juger).
- `PREFERENCE_LABELS` : « Un territoire qui gagne des habitants ».
- `PREFERENCE_TOOLTIP` (≤ 2 phrases, non normatif) : « Évolution récente de la population (gagne
  ou perd des habitants). Mesure la trajectoire du territoire, pas sa désirabilité. »
- `AMBIENT_DIMENSIONS` : bandes **factuelles** — `["gagne des habitants", "population stable",
  "perd des habitants"]`.

Pièges de câblage connus (mémoire) :
- **`synthesize/route.ts` a son PROPRE `PREF_LABELS`** : l'y ajouter, et surfacer le narratif
  migratoire dans le récit.
- **Parse** (`parse/route.ts`) : « se développe », « qui bouge », « qui attire », « ne pas se
  vider », « nouveaux habitants », « territoire dynamique » → `croissance_demographique`.
  Distinct de `vie_locale`.
- **Cache index dev** : après `--write-index`, vraie modif de `comparateur-vie.ts`.

## Doctrine / gloses honnêtes

On mesure une **trajectoire démographique**, PAS la désirabilité. La croissance peut être de
l'étalement péri-urbain ; le déclin n'est pas un défaut (certains veulent la stabilité, le
calme, des zones peu tendues). Vocabulaire **descriptif, jamais normatif**, partout (libellés,
reasons, bandes ambiantes). Le critère est opt-in : il ne joue que si l'utilisateur le demande.

## Note d'exécution (2026-06-04)

La sonde des extrêmes a tranché net : sur le **taux brut**, **39/50** du top 50 étaient des
communes **< 500 hab** (bruit : un hameau de 16 hab à +17 %/an). Lissage requis. `SHRINK_K`
figé à **3000** (`taux *= pop/(pop+3000)`) après comparaison 1000/3000/8000 : 3000 élimine le
bruit (0/50) et fait remonter les vraies périphéries d'agglo attractives (Betton/Rennes,
Bègles/Bordeaux, Couëron/Nantes, Aucamville/Toulouse, Fontanil/Grenoble en `match` réel) sans
sur-écraser un petit bourg en boom réel (Bezannes). Score signé : Vierzon/Felletin/Paris en bas
(`perd`), Montpellier en haut (`gagne_attire`). Distribution récit : perd ~45 %, gagne ~44 %,
stable ~11 % (dont `stable_renouv` = cas-3, 1166 communes). Source : INSEE évolution-structure
2021 (34 770/34 788 communes notées).

## Validation

Procédure : après `--write-index`, toucher `comparateur-vie.ts` (bust `indexCache`), puis
`npx tsc --noEmit` + `npm run lint` + curl réel sur `/api/comparateur-vie/match`.

1. **Sonde des extrêmes (GATE n°1, AVANT tout lissage).** Lister les **50 premières** et **50
   dernières** communes du taux brut. Test de plausibilité humaine :
   - Si le haut = villages de 80 hab, micro-communes touristiques, micro-bourgs atypiques →
     **shrinkage requis** (puis re-sonder).
   - Si le haut = périphéries attractives réelles (Rennes / Annecy / La Rochelle / Montpellier) →
     le **taux brut suffit**, pas de lissage.
2. **Matrice témoins** :

| Cas | Attendu |
|---|---|
| Périphérie d'agglo attractive (ex. couronne de Rennes / Montpellier) | Haut, narratif migratoire |
| Territoire en déclin réel (rural isolé / ancienne ville industrielle) | Bas, libellé **factuel** (« perd des habitants ») |
| Grande ville stable | Médian |
| Micro-commune touristique (ex. station) | Test du bruit (ne doit pas écraser le haut) |
| Commune à croissance naturelle (jeune, natalité) | Haut, narratif « structure démographique » |

Garde-fou : pas de jugement de valeur dans aucun libellé ; les extrêmes doivent être
humainement plausibles.

## Hors périmètre

- Sit@del / construction de logements (urbanisme/spéculation, pas la trajectoire vécue).
- Décomposition naturel/migratoire par naissances/décès (2ᵉ source) : remplacée par les arrivées
  IRAN (même source, capte le renouvellement / cas-3).
- Critère inverse « je veux un territoire stable » (partiellement couvert par `cadre_calme` /
  `eviter_grandes_villes` ; le score non normatif suffit en V1).
- Composite A+B+C.
