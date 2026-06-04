# Design : critère `calme_sonore`

Date : 2026-06-04 (révisé 2026-06-05)
Statut : validé (brainstorming) ; pivot scoring acté en sonde (cf. RÉVISION ci-dessous)

## RÉVISION 2026-06-05 : pivot « plus proche » → « exposition cumulée »

La sonde a invalidé le modèle initial « distance à la source dominante la plus proche »
(`max`) : depuis un point unique (chef-lieu), il produit un bruit d'échantillonnage en
grande ville (Nantes-centre sortait à 100 « calme » parce que son périph tombait à 2.2 km,
pile hors rayon). Diagnostic porteur : *la distance à la source la plus proche n'est pas
une bonne représentation du bruit AMBIANT.*

**Nouveau modèle (A, validé sur témoins) : exposition CUMULÉE.** Pour chaque commune, on
intègre la proximité `(1 - d/R)` le long de TOUTES les sources dans un rayon `R` (~5 km),
pondérée par classe, plus une contribution ponctuelle aéroport. C'est une « densité
d'infrastructures bruyantes autour du lieu de vie », conceptuellement proche de l'ambiance
sonore vécue. Résultat : les métropoles ressortent naturellement bruyantes (Lille/Paris/
Marseille/Lyon en bas), le rural reste calme (Mende 100), et un village collé à l'autoroute
(Valserhône) reste exposé : ce n'est PAS une taille-de-ville déguisée (garde-fou clé). La
couronne de La Rochelle (territoire connu du porteur) sort cohérente (cœur + couronne proche
~47-49, couronne externe ~59-62).

Conséquences sur le reste du design :
- Le **score** vient de l'exposition cumulée via une fonction saturante
  `score = round(100 * 0.5^(E/H))` (E=0 → 100 ; absolu, pas percentile ; jamais null).
- Le **récit `sourceDominante`** garde le calcul « source la plus proche » (inchangé) : le
  score raconte l'ambiance, le récit NOMME le coupable (« la proximité d'un grand axe
  routier »), SANS chiffre (doctrine : aucune donnée précise en synthèse/AskFuture ; la
  distance reste interne au champ index, jamais exposée).
- **Sources V1 inchangées** (autoroute/voie rapide, rail à 3 tiers lgv/main/branch, aéroports
  commerciaux). `primary` testé en sonde et REJETÉ : il resserre le haut (métropoles) mais
  érode le rural (Mende 100→75, bourg rural 71→44), car OSM ne donne pas le trafic et une
  nationale quasi déserte compte autant qu'un boulevard urbain. Mauvais échange (casse le
  cœur de valeur « far = 100 » pour un gain cosmétique sur des cœurs de ville que personne ne
  filtre pour le calme).
- **Rail à 3 tiers** (décidé en sonde) : `highspeed=yes` (LGV) > `usage=main` > `usage=branch`,
  proxy du NIVEAU D'INFRASTRUCTURE OSM, jamais « intensité réelle » (pas de GTFS, pas de
  trains/jour). Glose : « voies distinguées selon leur niveau d'infrastructure OSM (proxy) ».
- **Nouveaux boutons à sonder/figer** : rayon d'exposition `R`, demi-vie `H`, poids aéroport
  `W_AERO`, poids de classes (`W_AUTO/W_MAIN/W_LGV/W_BRANCH`).
- **Limite documentée (candidate V2)** : résidu de point unique sur quelques cœurs de grande
  métropole (Bordeaux/Montpellier/Nantes lisent un peu trop calme). Correctif éventuel = une
  « densité de maillage » qui annule les nationales isolées, PAS un `primary` brut.
- **Propreté d'implémentation** : dédup des ways par id au chargement (un way à cheval sur
  deux tuiles ne doit compter qu'une fois dans l'intégrale).

Le reste du document ci-dessous décrit le modèle initial « plus proche » : conservé pour
l'historique ; lire la présente révision comme la source de vérité du scoring.

---

Date : 2026-06-04
Statut initial : validé (brainstorming), prêt pour writing-plans

## Intention

Mesurer l'**éloignement aux grandes sources de bruit** : autoroutes/voies rapides,
voie ferrée principale, aéroports commerciaux. Critère **descriptif**, pas acoustique :
on dit « source de bruit majeure à X km », jamais des décibels.

Répond à la demande fréquente et concrète « je veux du calme », que `cadre_calme` ne
couvre pas : `cadre_calme` est un proxy de densité (`comparateur-vie.ts:639`), il note
un environnement peu urbain. Un village peu dense traversé par l'A7 est calme au sens
densité mais bruyant au sens sonore. Ce sont deux dimensions distinctes qu'on ne fusionne
pas, pour rester lisible et honnête.

## Doctrine (non négociable pour ce critère)

- `cadre_calme` reste le proxy de densité, inchangé.
- `calme_sonore` est un critère **opt-in distinct** : l'utilisateur peut demander l'un,
  l'autre ou les deux.
- Score **descriptif** : proximité de grandes sources de bruit, jamais une mesure en dB.
- Règle mentale de cadrage des sources : *si la source ne peut pas réveiller quelqu'un
  la nuit à plusieurs kilomètres, elle n'entre pas dans la V1.* Filtre anti-excès-de-signal.

## Glose (UI / tooltip)

> Éloignement des grandes infrastructures bruyantes (grands axes routiers, voie ferrée,
> aéroport). Ne mesure pas le bruit réel ni les nuisances locales (chantier, voisinage,
> route passante).

## Sources V1

Noyau dur incontestable uniquement. Rien d'autre.

| Classe | OSM / source | Inclus V1 |
|---|---|---|
| Autoroute + voie rapide | `highway=motorway/trunk` (+ `_link`) | Oui |
| Rail principal | `railway=rail` filtré (voir Risque rail) | Oui |
| Aéroport commercial | whitelist ~40-50 aéroports à trafic commercial FR | Oui |
| Route primaire (`highway=primary`) | n/a | **Non** (V2 si source trafic réel) |
| Industrie / carrière | n/a | **Non** (V2, signal faible/bruité) |

Exclu de V1 sciemment : `highway=primary` (OSM ne donne pas le trafic, on refait le piège
du rayon BPE, énormément de faux positifs ruraux), industrie/carrière (signal faible).

## Modèle d'exposition

Trois choix structurants, tous validés :

**3a. Décroissance absolue, pas de percentile.**
Le calme n'a pas besoin d'être classé. La majorité des communes est loin de toute source
majeure et mérite le même score haut. Percentiler fabriquerait de fausses différences
entre deux villages également tranquilles. C'est l'inverse de `vie_locale` /
`mobilite_quotidienne` / `vie_etudiante` (où le percentile est juste).

**3b. Combinaison `max` (source dominante).**
`expo = max(expo_auto, expo_rail, expo_aero)`. La nuisance perçue = la source la plus
proche qui domine. Une autoroute à 700 m domine une voie ferrée à 6 km. Pas de somme
(rouvrirait l'empilement artificiel). Un éventuel bonus de cumul est repoussé en V2.

**3c. Distance au chef-lieu.**
Point de référence = coords du chef-lieu (`data/communes-france-coords.csv`), comme les
autres critères. Conséquence voulue et honnête : une autoroute qui traverse le bout d'une
grande commune rurale loin du bourg ne pénalise pas, parce qu'elle ne dérange pas là où
les gens vivent.

**Formule par classe (décroissance linéaire clampée, comme `proximite_mer`/BPE) :**

```
expo_classe = clamp(1 − d_classe / R_classe, 0, 1)
expo        = max sur les classes
calme_sonore = round(100 × (1 − expo))
```

**Rayons distincts par classe**, `R_auto < R_rail < R_aero` (un aéroport porte beaucoup
plus loin qu'une autoroute). Valeurs **non figées** : placeholders indicatifs
1.5 / 3 / 8 km, à **calibrer par sonde sur témoins** avant de figer (patron récurrent
futur·e : sonde → gate porteur → matrice témoins → gate porteur → patch index).

## Saturation & null

Au-delà du rayon de toutes les classes → `expo = 0` → **score 100** (calme).

Point important : ici l'absence de source proche **n'est pas une donnée manquante**, c'est
la mesure même. Le subScore **ne renvoie jamais `null`** (contrairement à
`croissance_demographique` ou `air_sain` qui passent en « non noté » si la donnée manque).
Loin de tout = 100, pas « non noté ». Le critère reste opt-in au sens où le subScore n'est
calculé que si la clé est demandée.

## Récit explicatif (`sourceDominante`)

Exposé **dès la V1**, parce que `Calme sonore : 42` ne raconte rien, alors que
`Calme sonore : 42, source principale : autoroute à ~900 m` est immédiatement
compréhensible. Le score classe, la source dominante explique. Même logique que
`climatInondation` / `pressionEco` / `demographie`.

Nuance ferme : `sourceDominante` est un **récit explicatif attaché au critère demandé**,
**pas un trait distinctif global**. Gaté exactement comme la démographie : on ne génère le
récit que si l'utilisateur a demandé `calme_sonore`. On ne veut jamais une synthèse qui
dise « ce qui distingue La Rochelle, c'est son aéroport » alors que l'utilisateur n'a pas
demandé le calme sonore.

## Plomberie

**Script** : nouveau `scripts/populate-calme-sonore.py` (venv `.venv-bpe`), réutilise la
mécanique tuiles + miroirs Overpass + retry + cache tuiles de `populate-reseau-local.py`,
cache tuiles dédié, mode `--selftest` à assertions.

**Champ index** : `calmeSonore: { score, sourceDominante, distanceKm }` par commune dans
`comparateur-index.json`. `sourceDominante` ∈ {auto, rail, aero}, `distanceKm` = distance
à la source dominante (sert au récit).

**Câblage 6 points** (cf. AGENTS / mémoire) :
1. `PREFERENCE_KEYS` + `subScore` (`comparateur-vie.ts`) : subScore = `c.calmeSonore?.score`,
   jamais `null` (loin = 100 ; si champ absent en index, traiter comme calme = 100).
2. `REASON_POS` / `REASON_NEG` (Record exhaustif → tsc impose la clé).
3. `PREFERENCE_LABELS` / `PREFERENCE_TOOLTIP` (`comparateur-labels.ts`).
4. `AMBIENT_DIMENSIONS`.
5. `PREF_LABELS` propre de `synthesize/route.ts` + branchement récit `calmeSonore`
   (construit au match → transmis par le map results de `OuVivreClient.tsx` → gaté côté
   route par critère demandé, comme `demographie`/`climatInondation`).
6. Routage `parse/route.ts`.

Piège connu : après `--write-index`, modifier réellement `src/lib/comparateur-vie.ts`
(un commentaire suffit) pour réinitialiser `indexCache` ; un `touch` ne suffit pas.

## Sonde avant calibrage (séquence à gates)

1. **Vérif data (préalable bloquant)** :
   - Rail OSM : `usage=main` est-il tagué proprement et uniformément en France, ou troué
     (lignes principales sans `usage`, ou en `branch`) ? Si troué (risque GTFS-Lyon),
     bascule sur un autre discriminant : `highspeed=yes` (LGV) + `usage=main`, en excluant
     `service` / `usage=industrial|tourism` / `disused` / `abandoned`. À sonder réseau par
     réseau. **C'est la brique la plus fragile du projet** : autoroutes et aéroports sont
     fiables, le rail réserve des cas bizarres (LGV, fret, lignes peu circulées, anciennes).
   - Whitelist aéroports : figer sur une source nette (liste DGAC/UAF des aéroports à
     trafic commercial, par code OACI/IATA), pas à l'instinct OSM.
2. **Sonde distances** sur communes témoins → lecture des distances réelles → **gate porteur**.
3. **Figer R_auto / R_rail / R_aero** → matrice témoins → **gate porteur**.
4. **Patch index**.

**Témoins terrain (test « La Rochelle » et au-delà)** : la validation qualitative locale
prime ici sur la distribution nationale, le risque n'est pas statistique mais
« je connais cet endroit et ce score n'est pas crédible » :
- commune proche d'un aéroport régional + LGV + rocade (type La Rochelle) ;
- bourg traversé par une autoroute ;
- commune dense mais loin des grands axes (doit rester correcte) ;
- village rural isolé (doit être à 100).

## Hors périmètre V1 (V2 possible)

- `highway=primary` avec source de trafic réel.
- Industrie lourde / carrière.
- Bonus de cumul multi-sources.
- Distance à la géométrie complète de la commune (vs chef-lieu).
