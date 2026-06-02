# Données candidates (exploration CEREMA et autres) — note de conception à rouvrir

Capitalisation d'une exploration de catalogues (CEREMA et adjacents). **Aucune
implémentation, aucune acquisition décidée ici.** Objectif : conserver une analyse
produit critique pour rouvrir le sujet plus tard, dataset par dataset, avec un
verdict « documenter » ou « instruire davantage ».

Date : 2026-06-01. Esprit des autres notes de conception
([PRESSION_CLIMATIQUE_ECONOMIE.md](PRESSION_CLIMATIQUE_ECONOMIE.md),
[LOGEMENT_TERRITORIAL.md](LOGEMENT_TERRITORIAL.md)) : critique, honnête sur les
doublons et le bruit, centré valeur utilisateur, pas richesse de données.

## Le filtre produit appliqué

Trois questions par donnée :
- **(a) projet de vie + différenciation** : répond-elle à une vraie décision d'où
  vivre, ET est-elle dure à trouver ailleurs (donc différenciante) ? (cf. recadrage
  2026-06-02 : ce critère a remplacé un filtre « est-ce du climat ? » trop étroit).
- **(b) maille + couverture** : nationale, communale, non-experte ? Sinon →
  Rapport / Quartier / AskFuture, **jamais le comparateur** (une couverture
  partielle y crée une fausse comparabilité, le piège OLL).
- **(c) doublon** : n'est-elle pas déjà couverte par un signal existant ?

Rappel doctrine : comparateur simple et décisionnel ; pas de score qui impose un
jugement de valeur (logement et pression éco déjà refusés au score) ; on raconte
des territoires ; on évite les données d'experts ; les meilleurs signaux répondent
à une question concrète de projet de vie.

> ⚠ Les verdicts de la grille ci-dessous datent du premier passage (2026-06-01).
> Plusieurs ont été RÉVISÉS le 2026-06-02 (section « Recadrage produit »). En cas
> de divergence, le recadrage fait foi.

## Grille d'analyse (par dataset)

Place : **C** comparateur, **R** rapport, **AF** AskFuture, **Q** module Quartier,
**ML** module logement, **HP** hors périmètre.

### Logement (déjà scopé, cf. LOGEMENT_TERRITORIAL.md)

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| Prix d'achat (DVF/CEREMA) | C (note) + R/ML | — | élevée (demande n°1) | moyenne (agrégation DVF) | court | **instruit, à finir** |
| Loyers (ANIL) | C (note) + R/ML | — | élevée | faible (CSV prêt) | court | **instruit, à finir** |
| Tension locative | C (note) + R | partiel avec calme | moyenne, pratique | moyenne | court | **instruit** (zonage tendu + vacance) |
| Accessibilité (CEREMA) | R / ML / AF | — | forte (« puis-je m'y installer ») | moyenne (Box manuel) | moyen | **module seulement** (biais revenu hors classement) |

### Quartier / cadre de vie

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| LCZ (Local Climate Zones) | Q / R | **fort** avec chaleur DRIAS | faible seule (nuance îlot de chaleur) | moyenne (raster → commune) | long | **documenter** ; au mieux nuance du drawer chaleur, jamais signal autonome |
| Confort d'été local | Q / R | **fort** avec chaleur + LCZ | la QUESTION est forte, la donnée redondante | moyenne | long | **documenter** comme cadrage narratif, pas acquisition neuve |
| Éclairage nocturne | AF / R | — | faible-moyenne, charme | faible | long | **documenter** ; hors mission climat, risque de dilution |
| Bruit routier | Q / R | partiel avec calme (density ≠ bruit) | **forte et concrète** (« sera-ce calme ? ») | moyenne-élevée | moyen | **instruire la couverture** (agglos >100k + grands axes seulement) avant tout engagement ; jamais au comparateur |
| Bruit ferroviaire | Q / R | idem | forte (TGV/fret) | moyenne-élevée | moyen | **idem bruit routier**, même chantier |
| Artificialisation des sols | C + R | recoupe densité, **comble trou « nature »** | **forte** (préservé vs bétonné) | moyenne (CLC / ENAF) | court-moyen | **instruire** (candidat critère « nature ») |

### Mobilité (UN seul signal, trois facettes)

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| Dépendance à la voiture | C + R | partiel avec acces_services | **très forte** (vie + climat) | faible-moyenne (INSEE mobilités) | court | **instruire en priorité** (signal mobilité unifié) |
| Accessibilité transports collectifs | C/R (composant) | **fort** avec dépendance voiture | forte | moyenne | court | **composant** du signal mobilité, pas une acquisition séparée |
| Mobilité quotidienne | R (source) | **fort** | — | — | — | **source** sous-jacente, pas un signal produit distinct |

### Littoral (sous-ensemble côtier ; candidat module littoral)

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| Érosion du trait de côte | C (côtier) + R / module littoral | adjacent submersion (distinct) | **forte** (recul du littoral) | moyenne (vecteur CEREMA) | moyen | **instruire** ; ancre un module littoral |
| CatNat liés à la mer | R / module littoral | **fort** avec CatNat GASPAR + submersion | faible (marginal) | faible | long | **documenter** |
| Immobilier touristique (Conitiff) | R / ML | partiel logement | moyenne (vivre vs villégiature) | moyenne | moyen | **documenter**, à rattacher au module logement |
| Conservatoire du littoral | AF / R | — | faible (charme/nature côtière) | faible | long | **documenter** ; pépite AskFuture |
| Sentier du littoral | AF | — | faible (randonnée) | faible | long | **documenter** ; pépite AskFuture |
| Nature du trait de côte | R (composant érosion) | composant | faible seule | moyenne | long | **documenter** comme contexte de l'érosion |
| Trafic maritime | HP | — | nulle pour « où vivre » | — | — | **rejeter** |

### Risques

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| Historique CatNat | Q (existant) | **déjà couvert** (GASPAR) | — | — | — | **ne pas réacquérir** |

### Santé environnementale

| Donnée | Place | Doublon | Valeur | Difficulté | Terme | Verdict |
|---|---|---|---|---|---|---|
| Décharges anciennes littorales | AF / R | recoupe BASOL/SIS | faible, niche | moyenne | long | **documenter** ; pépite AskFuture côtière |

## Recadrage produit (2026-06-02)

Révision après une relecture stratégique (challenge du porteur). Le premier passage
appliquait un filtre trop étroit (« est-ce du climat ? ») et sous-estimait le rôle
du module Quartier. Ce recadrage corrige et fait foi sur les divergences.

### futur·e = projet de vie territorial dans un monde qui change

Le produit score déjà sur climat, emploi, cadre de vie, santé environnementale,
relief, logement : c'est **un produit de projet de vie territorial**, pas un produit
climat pur. Le climat est la **colonne vertébrale** (la lucidité « monde qui
change », ce qui nous différencie), le corps est le projet de vie entier. Donc le
bon filtre n'est pas « est-ce du climat ? » mais « **répond-elle à une vraie décision
d'où vivre, est-elle différenciante, est-elle défendable ?** ». Garde-fou conservé :
la colonne climat empêche de dériver vers un guide qualité-de-vie générique (il y en
a déjà ; notre angle est le territoire face au changement).

### Table-stakes vs moat (la distinction qui manquait)

- **Fonctionnel / table-stakes** (logement, mobilité, emploi, prix, transports) :
  l'utilisateur les attend, on les trouve partout. Leur absence pénalise, leur
  présence ne différencie pas. Nécessaire, pas un moat.
- **Vécu quotidien / moat** (confort d'été réel, qualité des nuits, préservation,
  artificialisation, bruit, végétalisation) : durs à trouver ailleurs, **c'est là
  qu'on est unique**. Territoire du **module Quartier**, probable différenciateur
  durable de futur·e. Le premier passage l'a sous-évalué.

Conséquence : deux files de priorité (must-have fonctionnel ET moat de vécu), ne pas
laisser la première écraser la seconde.

### Verdicts révisés

- **LCZ / confort d'été** : était « doublon avec la chaleur DRIAS ». **Révisé : ce
  n'est PAS un doublon.** DRIAS = climat macro de la commune ; LCZ = îlot de chaleur
  intra-urbain VÉCU. Complémentaire, et différenciateur climat-vécu majeur.
  → **instruire (module Quartier)**, gros riser.
- **Bruit** : valeur revue à la hausse (premier regret de déménagement, dur à
  trouver). Verrou couverture maintenu → Quartier/rapport, jamais comparateur.
- **Nature / végétalisation** : remonte (angle mort « accès à la nature » + moat +
  colonne climat). Voir Top 5.
- **Éclairage nocturne, conservatoire et sentier du littoral** : n'étaient « charme
  hors mission ». **Reframe en « accès à la nature / cadre préservé »**, vrai besoin
  de projet de vie. Montent modestement (Quartier / AskFuture), le « charme »
  dédaigneux est retiré.
- **Tenu (inchangé)** : le comparateur reste lean (le vécu va au Quartier/rapport, le
  produit s'élargit, pas le comparateur) ; couverture partielle hors comparateur ;
  trafic maritime et CatNat-historique restent dehors (hors sujet / doublon GASPAR).

### Angles morts (besoins, pas datasets)

Dimensions de projet de vie encore invisibles dans futur·e :
- **Accès à la nature (positif)** : on mesure l'artificialisation (le négatif) et le
  relief, pas « forêt / eau / espaces verts accessibles ». Manque fort, on-brand.
- **Vivacité locale / sociabilité** : on a l'isolement (proxy population), pas
  « village vivant vs cité-dortoir » (commerces, marchés, vie associative).
- **Connectivité numérique (fibre / 4G)** : must du projet de vie (télétravail,
  moteur de relocalisations). Aveugle, donnée ARCEP disponible.
- **Écoles** et **sécurité** : exclus par choix (anti-biais social) ; angles morts
  ASSUMÉS mais énormes pour les familles, à reposer consciemment un jour.
- Secondaire : **vie culturelle / loisirs** (commoditisé, faible différenciation).

Les deux vrais manques stratégiques : **accès à la nature (positif)** et **vivacité
locale**.

## Synthèse (avis PM)

### Les 5 prochaines acquisitions recommandées (révisé 2026-06-02)

Logement étant **livré** (en prod), il sort de la file. Classement repondéré par le
moat (vécu) autant que par le fonctionnel :

1. **Nature / végétalisation** (Corine Land Cover) : comble le plus gros angle mort
   (accès à la nature), à la fois moat de vécu et colonne climat (fraîcheur,
   biodiversité). Candidat critère comparateur + Quartier. *(était #3)*
2. **Mobilité / dépendance à la voiture** : must-have fonctionnel, on-mission
   (climat + quotidien), national, faisable (INSEE mobilités). Unifier voiture +
   transports + mobilité quotidienne en un signal. *(était #2)*
3. **Confort d'été / îlot de chaleur (LCZ)** : LE différenciateur climat-vécu, on
   n'est unique que là. Module Quartier (intra-communal, hors comparateur). *(gros
   riser, était « documenter »)*
4. **Bruit (routier + ferroviaire)** : premier regret de déménagement, différenciant.
   Module Quartier, couverture bornée, jamais comparateur. *(était #5)*
5. **Érosion du trait de côte** : risque côtier réel, distinct de la submersion,
   ancre un module littoral. Plus étroit (sous-ensemble côtier). *(était #4)*

### Ce qui est du bruit produit ou du doublon

- **Rejeter** : trafic maritime (hors « où vivre »).
- **Doublons déjà couverts** : CatNat historique (GASPAR), confort d'été / LCZ
  (chaleur DRIAS), CatNat mer (GASPAR + submersion).
- **Charme hors mission, AskFuture au mieux** : éclairage nocturne, sentier et
  conservatoire du littoral, décharges littorales, nature du trait de côte.

### Idée structurante : un module littoral

Plutôt que d'éparpiller les pistes côtières, les bundler en un **enrichissement
littoral** pour les communes côtières : érosion (signal), submersion (déjà là),
CatNat mer, et en couleur conservatoire / sentier / décharges. Cohérent, raconte un
territoire, évite des signaux orphelins.

### Ce qui ne doit jamais entrer dans le comparateur

Tout l'intra-communal et le partiel : LCZ, confort d'été, bruit (couverture
partielle), trafic maritime, décharges, sentier, conservatoire. Le comparateur est
national et communal ; un signal à couverture partielle y fabrique une fausse
comparabilité. Et par doctrine, aucun signal imposant un jugement de valeur en score.

## Risques transverses

- **Dilution de la mission climat** : éclairage nocturne, sentiers, charme côtier
  font glisser futur•e vers un « guide qualité de vie » générique. Garder le cap.
- **Fausse comparabilité** : acquérir une donnée à couverture partielle et la
  traiter comme nationale (piège OLL / bruit / LCZ).
- **Doublons silencieux** : réacquérir ce que GASPAR / chaleur / submersion /
  BASOL couvrent déjà.
- **Inflation de signaux** : multiplier les axes finit par noyer le projet de vie.
  Préférer peu de signaux forts (mobilité, nature) à beaucoup de signaux faibles.

## À rouvrir plus tard

- Mobilité : instruire les sources INSEE mobilités + CEREMA accessibilité transports,
  définir le signal unifié, trancher narratif vs critère (mêmes garde-fous que le
  logement : éviter le jugement de valeur).
- Nature / artificialisation : instruire Corine Land Cover comme critère « nature »
  (combler le trou connu).
- Érosion : instruire l'indicateur national d'érosion côtière, définir le module
  littoral.
- Bruit : instruire la couverture réelle avant tout engagement.
- Tout le reste : conservé ici, documenté, non instruit.
