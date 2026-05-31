# Ancres géographiques — conception (avant toute implémentation)

Travail de modélisation produit déclenché par le cas « Fuir les canicules, rester
dans le Sud ». Aucune décision d'implémentation ici : on vérifie d'abord qu'on
modélise correctement l'espace mental de l'utilisateur.

Date : 2026-06-01.

## Validation produit (2026-06-01)

Le porteur valide la direction et la reformule ainsi : **on fait évoluer le moteur
d'un système de préférences vers un système de contraintes.**

```
Avant :     Préférences → scoring → top 3
Maintenant : Contraintes géographiques → espace de recherche → scoring → top 3
```

La phrase jugée la plus importante du document : **« L'ancre définit l'espace de
recherche ; les préférences ordonnent dedans. »** C'est exactement ce qui explique
le cas Sud : le moteur n'était pas faux, il optimisait la chaleur correctement,
mais sur la France entière alors que l'utilisateur raisonnait déjà dans un espace
géographique précis. Ce document corrige la **représentation**, pas le score, et
vaut à ce titre plus que des semaines d'ajustement de pondérations.

Périmètre validé (meilleur ratio impact/complexité) : macro-zones vernaculaires,
façades maritimes nommées, exclusions géographiques, massifs nommés.

Deux nuances ajoutées par le porteur :

1. **Toutes les mentions géographiques ne sont pas des filtres durs.** « J'aimerais
   bien rester dans le Sud » ≠ « je veux absolument rester dans le Sud ». À terme,
   un **gradient de force** sera nécessaire : ancre dure / ancre préférée / simple
   inspiration. **Pas indispensable pour la première version** (binaire filtre/préf
   suffit au départ), mais c'est la trajectoire. Cela répond à la question 1
   ci-dessous : le défaut binaire convient en V1, le gradient est la V-suivante.
2. **Les ancres relationnelles sont presque aussi importantes que les ancres
   géographiques** (voir catégorie dédiée ci-dessous).

## Le problème, prouvé

Trace réelle du cas :
- parse → `faible_chaleur` (3), `ensoleillement_recherche` (2), et **« le Sud »
  capté par RIEN** (region null, departements vide), juste signalé en ambiguïté
  « Périmètre du Sud ».
- match → #1 **Dunkerque** (78 %), puis Lamballe, Caen, Reims. Toute la façade
  Nord.

Le moteur optimise parfaitement les critères qu'il comprend (`faible_chaleur` de
poids 3 écrase `ensoleillement` de poids 2), mais **dans un espace national**,
alors que l'utilisateur raisonne dans l'espace « le Sud ». Quand on injecte « le
Sud » comme filtre départements, le même moteur renvoie Briançon, Font-Romeu,
Barcelonnette : le Sud le moins caniculaire. Humainement juste.

**Conclusion : le problème n'est pas le scoring. C'est que « le Sud » n'existe pas
dans le modèle.** L'utilisateur exprime un périmètre ; le moteur n'a pas de place
pour le recevoir.

## Principe directeur

1. **Représentation avant algorithme.** Le moteur sait optimiser. Il lui manque
   l'espace dans lequel optimiser. On modélise d'abord l'espace.
2. **L'ancre définit l'espace de recherche ; les préférences ordonnent dedans.**
   Une ancre n'est pas un critère de plus à pondérer : elle change le périmètre.
   La plupart des « tensions » disparaissent une fois le périmètre correct.
3. **Séparer le lieu de sa connotation.** « Le Sud » est un lieu ; sa chaleur est
   une connotation. Le modèle ne doit ni laisser « Sud » injecter une préférence
   chaleur en douce, ni laisser une préférence climatique effacer l'ancre lieu.
4. **Le moteur possède la géographie, le LLM la nomme.** Le parse émet un jeton de
   zone issu d'une liste fermée ; le moteur détient la table jeton → départements.
   Le LLM n'invente jamais de liste de départements (même discipline que
   `nearPlace` aujourd'hui : le LLM donne le label, le moteur géolocalise).
5. **Ancre par défaut quand la mention est identitaire ; préférence seulement si
   explicitement souple.** Mirror de la discipline `nearSea` actuelle
   (« indispensable » → dur ; « j'aime bien » → souple).

## Taxonomie des ancres géographiques

Récapitulatif (détail par catégorie ensuite) :

| Catégorie | Représentation | Filtre / Préférence | État actuel |
|---|---|---|---|
| 1. Région administrative | enum région → filtre | Filtre (souple si « j'aime bien ») | **existe** |
| 2. Macro-zone vernaculaire | jeton → table départements | Filtre | **manque** ← cœur du sujet |
| 3. Façade maritime nommée | jeton → départements côtiers + mer | Filtre | **manque** |
| 4. Proximité d'une ville | nearPlace (label + rayon) | Filtre (rayon) | **existe** |
| 5. Distance à la famille | nearPlace si lieu nommé, sinon ouvert | Filtre ou question | partiel |
| 6. Montagne / massif | massif nommé → départements ; générique → altitude | Filtre | **manque** (+ trou data) |
| 7. Littoral / mer générique | nearSea (dur) + proximite_mer (souple) | Les deux | **existe** |
| 8. Rural / urbain / taille | communeSize + densité (cadre_calme) | Mixte | **existe** |
| 9. Exclusion géographique | anti-filtre (exclure départements) | Filtre négatif | partiel (excludeSea) |
| 10. Ancre relative / directionnelle | besoin de la résidence | non résoluble en V1 | **absent** |

### 1. Régions administratives (Bretagne, Normandie, Occitanie, PACA…)
1. **Représentation** : déjà là (`hardConstraints.region`, enum fermé).
2. **Filtre/préf** : filtre par défaut (« je veux vivre en Bretagne »). Souple
   seulement si formulé comme un goût (« j'aime bien la Bretagne, sans plus »).
3. **Ambiguïtés** : noms anciens encore très employés (« Languedoc-Roussillon »,
   « Midi-Pyrénées » fusionnés en Occitanie ; « Aquitaine » ⊂ Nouvelle-Aquitaine).
   Confusion région administrative vs sentiment (« la Normandie » historique).
4. **Formulations** : « en Bretagne », « rester en PACA », « vivre en Alsace ».

### 2. Macro-zones vernaculaires (le Sud, le Sud-Ouest, le Grand Ouest, le Nord…)
1. **Représentation** : NOUVEAU. Liste fermée de jetons {sud, sud_ouest, sud_est,
   nord, grand_ouest, est, centre, …}, chacun → un ensemble de départements
   détenu par le moteur. Le parse choisit le jeton, pas les départements.
2. **Filtre/préf** : **filtre**. C'est une ancre identitaire forte. Cœur du fix.
3. **Ambiguïtés** : frontières floues et subjectives. « Le Sud » inclut-il le
   Pays basque et les Landes ? Les Alpes ? « Sud-Ouest » ⊂ « Sud » ? « Le Midi »
   = le Sud. Chaque zone doit avoir une définition départementale **assumée comme
   convention**, affichée honnêtement (« le Sud, au sens PACA + Occitanie + … »).
4. **Formulations** : « rester dans le Sud », « descendre dans le Sud », « le
   Sud-Ouest », « quelque part dans le Grand Ouest », « le Midi », « le grand
   Sud ».

### 3. Façades maritimes nommées (Atlantique, Manche, Méditerranée, côte basque)
1. **Représentation** : NOUVEAU. Jeton de façade → départements côtiers de cette
   mer (combine `distance_cote_km` court ET appartenance à la façade). On peut
   dériver la façade par lon/lat mais ce n'est pas un champ aujourd'hui.
2. **Filtre/préf** : filtre quand nommée (« je veux l'Atlantique »). À distinguer
   du littoral générique (catégorie 7).
3. **Ambiguïtés** : Méditerranée recoupe « le Sud ». Frontière Manche/Atlantique
   à la pointe bretonne. Corse = Méditerranée. « La côte » sans mer précisée
   bascule en catégorie 7.
4. **Formulations** : « sur la côte Atlantique », « au bord de la Méditerranée »,
   « la façade atlantique », « la côte basque », « la Manche ».

### 4. Proximité d'une ville nommée (proche de Lyon, à côté de Toulouse)
1. **Représentation** : déjà là (`nearPlace` : label + maxKm, le moteur
   géolocalise via l'index).
2. **Filtre/préf** : filtre (rayon). Déjà un filtre.
3. **Ambiguïtés** : rayon rarement donné (« pas trop loin de Lyon » → défaut
   50 km). « Proche » élastique (1 h de trajet ≠ week-end). « Lyon » = la ville
   ou sa métropole ?
4. **Formulations** : « pas trop loin de Lyon », « à une heure de Bordeaux »,
   « dans le coin de Nantes ».

### 5. Distance à la famille / point personnel
1. **Représentation** : cas particulier de `nearPlace` SI le lieu est nommé
   (« ma famille à Lyon »). Sinon (« proche de ma famille ») : **non résoluble**
   sans demander où. Vrai besoin du mécanisme d'affinage interactif (V2).
2. **Filtre/préf** : filtre si lieu connu ; sinon question ouverte.
3. **Ambiguïtés** : lieu familial non nommé = impasse en V1. Plusieurs points
   familiaux. « Proche » = quelle fréquence de visite ?
4. **Formulations** : « rester près de ma famille », « à 2 h de mes parents »,
   « pas trop loin des grands-parents ».

### 6. Montagne / massif (à la montagne, près des Alpes, en altitude)
1. **Représentation** : deux sous-cas. (a) massif nommé {Alpes, Pyrénées, Massif
   central, Vosges, Jura, Corse} → départements/altitude. (b) « montagne /
   altitude » générique → seuil d'altitude ou de relief. **Trou de données** :
   pas de champ altitude/relief dans l'index aujourd'hui ; le générique est dur à
   modéliser sans l'ajouter ; les massifs nommés sont plus faciles (départements).
2. **Filtre/préf** : filtre (ancre forte).
3. **Ambiguïtés** : « proche de la montagne » (accès) vs « à la montagne »
   (dedans). Sans champ altitude, « montagne » générique est approximé par les
   massifs nommés seulement.
4. **Formulations** : « à la montagne », « en altitude », « près des Pyrénées »,
   « au pied des Alpes ».

### 7. Littoral / mer générique (au bord de la mer, proche de la côte)
1. **Représentation** : déjà là (`nearSea.active` dur + `proximite_mer` souple +
   `distance_cote_km`). Bon modèle existant.
2. **Filtre/préf** : les DEUX déjà supportés (dur si indispensable, souple
   sinon). Sert de patron pour les autres catégories.
3. **Ambiguïtés** : « près de la mer » dur vs souple (déjà géré). Quelle mer
   (couple avec la catégorie 3).
4. **Formulations** : « au bord de la mer », « proche de l'océan », « vue mer ».

### 8. Rural / urbain / taille de ville (campagne, grande ville, village)
1. **Représentation** : partiel. `communeSize` (population, filtre) + densité via
   `cadre_calme` (souple) + `eviter_isolement`. « Campagne » ≈ petite taille /
   faible densité. « Grande ville » = communeSize.min.
2. **Filtre/préf** : mixte. La taille peut être dure (« une grande ville ») ou
   souple ; la densité (calme) est souple. Déjà modélisé.
3. **Ambiguïtés** : « campagne » flou (petite commune ? faible densité ? proche
   nature ?). « Ville moyenne » = convention 25-100k. « Campagne mais avec
   services » = tension qui disparaît si on filtre rural puis optimise services
   dedans.
4. **Formulations** : « à la campagne », « une grande ville », « un village »,
   « pas une métropole ».

### 9. Exclusions géographiques (quitter Paris, pas le Nord, loin de la ville)
1. **Représentation** : anti-filtre (exclure un ensemble de départements / une
   zone). Le moteur a déjà `excludeSea` ; généraliser en `excludeZone`.
2. **Filtre/préf** : filtre négatif.
3. **Ambiguïtés** : « quitter Paris » = exclure Paris seul, l'Île-de-France, ou
   « toute grande ville » ? « Loin de la ville » = exclusion de taille, pas de
   lieu.
4. **Formulations** : « quitter Paris », « loin de la région parisienne », « pas
   dans le Nord », « fuir la ville ».

### 10. Ancres relatives / directionnelles (plus au sud, se rapprocher, descendre)
1. **Représentation** : nécessite la **résidence** de l'utilisateur. Or le
   comparateur est anonyme (pas de résidence connue). **Non résoluble en V1.**
2. **Filtre/préf** : sans objet sans point de référence.
3. **Ambiguïtés** : « plus au sud » que quoi ? « se rapprocher » de quoi ?
4. **Formulations** : « plus au sud qu'aujourd'hui », « descendre vers le Sud »,
   « me rapprocher de la côte ».

## Ancres relationnelles (catégorie structurante future, à ne pas perdre)

Élevée par le porteur au rang de sujet « presque aussi important que les ancres
géographiques ». Les utilisateurs formulent très souvent leur projet de vie par
rapport à des **personnes** ou à un **point d'accès**, pas par rapport à une
région, un climat ou une façade :

- « proche de ma famille »
- « accessible depuis Lyon »
- « à moins de 2 h de Paris »
- « pas trop loin des grands-parents »

Ce n'est ni une région, ni un climat, ni une façade : c'est une **contrainte
humaine**. Elle recoupe en partie les catégories 4 (proximité d'une ville) et 5
(distance famille) ci-dessus, mais le porteur veut la traiter comme une **classe
à part entière**, parce que la mécanique est spécifique :

- le point de référence est souvent une **personne** (non géocodable sans le
  nommer) ou un **hub de transport** (« accessible depuis Lyon » = isochrone, pas
  un simple rayon à vol d'oiseau) ;
- « à moins de 2 h de Paris » est une contrainte de **temps de trajet** (TGV,
  route), pas de distance kilométrique. L'index n'a ni isochrones ni temps de
  trajet : **trou de données majeur** à instruire.

Décision actuelle : **ne pas l'implémenter maintenant**, mais la noter comme
future catégorie structurante du moteur (au même titre que les macro-zones).

## Cas limites structurants (transverses)

- **Sur-contrainte / résultat vide.** Les ancres en filtre peuvent vider le
  vivier (« la montagne en Bretagne »). Il faut détecter l'intersection vide,
  relâcher l'ancre la plus faible, et le DIRE (« la Bretagne n'a pas de montagne
  au sens strict, voici les communes les plus vallonnées »). Sans ça, l'ancre dure
  produit un cul-de-sac silencieux.
- **Composition d'ancres = intersection.** « Le Sud-Ouest, près de la montagne »
  = départements SO ∩ proximité Pyrénées. Modèle d'intersection propre nécessaire ;
  intersections vides = mode d'échec fréquent à gérer.
- **Lieu vs climat (le piège du cas Sud).** « Le Sud » porte une attente de
  chaleur ; quand l'utilisateur dit « le Sud mais sans canicule », l'ancre est le
  LIEU, la chaleur est un critère explicitement inversé. Le modèle doit traiter
  l'ancre comme lieu pur et laisser le critère climatique opérer dedans.
- **Ancre dure vs goût.** « En Bretagne » (dur) vs « j'aime bien la Bretagne »
  (souple). La frontière est linguistique ; le parse doit la trancher, et en cas
  de doute, signaler (et, en V2, demander).

## Trous de données à acter

- **Pas d'altitude / relief** dans l'index → « montagne » générique difficile ;
  s'appuyer d'abord sur les massifs nommés (départements).
- **Pas de façade maritime** comme champ → dérivable de lon/lat, à pré-calculer.
- **Pas de résidence** dans le comparateur → ancres relatives et « famille » non
  nommée non résolubles (renvoi au mécanisme d'affinage interactif V2).

## Premier périmètre que je recommanderais (sans coder maintenant)

Par valeur/effort décroissant, quand on passera à l'implémentation :
1. **Macro-zones vernaculaires (cat. 2)** : le trou qui a causé le cas Sud. Plus
   haut levier. Liste fermée + table départements + filtre + message honnête.
2. **Façades maritimes nommées (cat. 3)** : même mécanique, fréquent.
3. **Exclusions (cat. 9)** : « quitter Paris » est ultra-courant et déjà à moitié
   là (excludeSea → excludeZone).
4. **Massifs nommés (cat. 6a)** : sans toucher au trou altitude.

Les catégories 1, 4, 7, 8 existent déjà et n'ont besoin que d'être confirmées
comme ancres (filtre) plutôt que de rester implicites.

## Questions de conception qui te reviennent

1. **Force par défaut** : ~~ancre par défaut sauf goût explicite ?~~ **Tranché** :
   binaire filtre/préférence en V1 (ancre par défaut, mirror de `nearSea`), avec un
   gradient à trois niveaux (dure / préférée / inspiration) prévu pour la version
   suivante, pas maintenant.
2. **Frontières des zones** : assume-t-on des conventions documentées et affichées
   (« le Sud = PACA + Occitanie + … »), quitte à ce qu'elles soient discutables ?
3. **Sur-contrainte** : en cas d'intersection vide, relâche-t-on automatiquement
   (avec message) ou bascule-t-on en question d'affinage (V2) ?
4. **Le Sud inclut-il le Pays basque / les Landes ?** (cas test de frontière qui
   tranchera la philosophie : Sud = méditerranéen, ou Sud = grand quart sud.)

## Implémenté (V1, 2026-06-01)

Premier lot codé et vérifié en réel. Décisions de conception tranchées par le
porteur avant implémentation :

- **Le Sud = grand quart sud** : PACA + Occitanie + sud de la Nouvelle-Aquitaine
  (Landes et Pays basque inclus). `sud_ouest` reste un jeton distinct (sous-zone),
  jamais émis en même temps que `sud`. Réponse à la question 4 : Sud = grand quart
  sud, pas méditerranéen strict.
- **Sur-contrainte = détecter et le dire** : en cas d'intersection vide, le moteur
  renvoie zéro résultat avec un message honnête nommant le périmètre, sans relâche
  automatique ni résultat inventé. Réponse à la question 3 (la relâche auto et
  l'affinage interactif restent V2).

Mécanique livrée (primitive unique sous les 4 catégories) : **jeton → ensemble de
départements**, le moteur détenant la table, le parse choisissant le jeton.

- `src/lib/geo-zones.ts` : table des zones + résolution. Ancres positives
  intersectées (`resolveZones`), exclusions unionées (`resolveExclusions`). Chaque
  zone porte un texte `convention` affiché honnêtement. Module pur, client-safe.
- Catégories couvertes : macro-zones (sud, sud_ouest, sud_est, nord, est,
  grand_ouest, centre), façades maritimes (atlantique, manche, mediterranee,
  cote_basque), massifs nommés (alpes, pyrenees, massif_central, vosges, jura,
  corse), exclusions (paris, idf, + n'importe quelle zone en négatif).
- `comparateur-vie.ts` : `HardConstraints.zones` / `excludeZones`, filtrage dans
  `passesHard`, message de sur-contrainte, `appliedZones` / `appliedExclusions`
  exposés dans l'outcome.
- `parse/route.ts` : schéma à enums fermés + prompt (jeton le plus spécifique,
  ancre par défaut, séparation lieu/climat, interdiction d'inventer des
  départements).
- UI (`OuVivreClient.tsx`) : bloc « Le périmètre recherché » au gate, convention
  assumée affichée aux résultats. Périmètre transmis à synthesize et ask
  (libellés qualitatifs seulement, firewall préservé), avec consigne de ne jamais
  proposer de regarder ailleurs ni réciter de département.

Vérifié en réel sur le cas fondateur (« fuir les canicules, rester dans le Sud »
→ Gap, Bagnères-de-Bigorre, Barcelonnette, Font-Romeu, tous dans le Sud, sans
`ensoleillement` parasite), les façades, les exclusions, l'intersection et la
sur-contrainte.

## Catégories futures notées (non implémentées)

À instruire ensuite, par ordre de valeur pressentie :

1. **Gradient de force d'ancre** (dure / préférée / inspiration) : aujourd'hui
   binaire (filtre si présente, sinon rien). Manque une ancre « souple » qui
   oriente sans éliminer. Demande un mécanisme de score de zone, pas seulement un
   filtre.
2. **Ancres relationnelles** (« à 2 h de Paris », « accessible depuis Lyon ») :
   contrainte de temps de trajet, pas de distance à vol d'oiseau. Trou de données
   majeur (ni isochrones ni temps de trajet dans l'index).
3. **Montagne générique sans nom** (« à la montagne », « en altitude ») : pas de
   champ altitude/relief dans l'index. Aujourd'hui seuls les massifs nommés sont
   gérés (par département).
4. **Ancres relatives / directionnelles** (« plus au sud », « me rapprocher ») :
   nécessitent la résidence de l'utilisateur, absente du comparateur anonyme.
