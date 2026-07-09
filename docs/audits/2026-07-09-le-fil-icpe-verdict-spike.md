# Le Fil × ICPE : ce que 22 802 événements réels disent de l'ontologie

> Audit de données, 2026-07-09. Corpus : `tmp/icpe-a-half-10000.*` (10 000 communes, 12 mois).
> Reproductible : `node scripts/research/fil-event-classify.mjs --events tmp/icpe-a-half-10000.events.csv`
> Aucun PDF n'a été lu. Aucun LLM n'a été appelé.

## La question

Faut-il construire un pipeline d'analyse automatique (OCR + LLM) des rapports d'inspection ICPE
pour alimenter Le Fil, et quelle définition d'un « événement futur•e » retenir ?

## La réponse, en cinq lignes

1. **Ne pas lire les rapports d'inspection.** 93 % ne produisent aucun acte. Le pipeline OCR + LLM
   qui motivait ce spike n'a pas d'objet.
2. **Lire les actes préfectoraux, et seulement eux.** Environ 650 PDF par an au niveau national,
   moins de deux par jour ouvré, contre les 80 000 documents du plan initial.
3. **L'ICPE ne peut pas être une source du Fil.** Sous la définition stricte, elle produit 614
   événements par an en France, une commune touchée tous les 57 ans. Sous la définition large, elle
   produit un fil de mises en demeure, que la doctrine éditoriale récuse.
4. **Le tri P0/P1 doit être abandonné.** Il classe 25 % de bonnes nouvelles en priorité maximale et
   jette les servitudes, les mesures d'urgence et les créations d'installations.
5. **Le spike a trouvé autre chose que ce qu'il cherchait** : les servitudes d'utilité publique,
   20 par an, sans aucun critère pour les porter, et exactement ce qu'un notaire purge avant une vente.

## Les mesures

### M1. Le parc, et la vraie taille du gisement

L'API expose **137 617 installations classées** en France. Les 10 000 communes crawlées en couvrent
**92 564, soit 67,3 % du parc**. Les 25 000 communes restantes sont rurales et portent des
installations moins inspectées.

L'extrapolation nationale doit donc se faire **par installation, pas par commune** :

| | Extrapolation ×3,5 (communes) | Extrapolation ÷0,673 (installations) |
|---|---|---|
| Événements bruts / an | ~80 000 | **~33 900** |
| P0/P1 / an | ~19 000 | **~8 200** (plafond) |

### M2. Les rapports d'inspection ne servent à rien

Sur les 17 623 inspections datées du corpus, rapprochées des actes par identifiant AIOT et fenêtre
de 180 jours :

- **7,0 %** des inspections sont suivies d'un acte préfectoral (MED, mesures d'urgence, conservatoires).
- **66,7 %** des actes sont précédés d'une inspection. Le tiers restant naît d'une plainte, d'un
  accident ou d'une autosaisine, donc lire les inspections ne suffirait pas non plus.
- 257 installations sur 1 408 ont produit un acte sans qu'aucune inspection soit captée.

Lire 14 834 PDF pour anticiper de quelques mois un acte qui arrivera nommé et daté, dans 7 % des cas,
et manquer un tiers des vrais événements. **La stratégie dominante est d'attendre l'acte.**

Angle mort à connaître : **2 801 inspections (12,3 %) n'ont aucun rapport publié.** La promesse
« nous surveillons » porte sur ce qui est publié, pas sur ce qui a lieu.

### M3. `type_fichier` est fiable à 99 %, avec une exception pourrie

Vocabulaire fermé d'une quinzaine de valeurs, rempli à la main par les DREAL. Contradictions
détectables entre `type_fichier` et `nom_fichier` : **48 sur 5 179 documents (0,9 %)**, mais
concentrées :

- **30 des 37** « AP de mesures d'évaluations et/ou remèdes » sont en réalité des mesures d'urgence
  (`APMU ARCELOR BP Fos`, `APMU MONCLAIR`). Le vrai nombre de mesures d'urgence est **~91**, presque
  le double des 53 déclarées.
- 7 « AP mise en demeure » contiennent une levée. 3 « mesures conservatoires » sont des suspensions
  d'activité.

Conséquence : le tri se fait sur `type_fichier` **corrigé par** `nom_fichier`. Aucun PDF n'est requis
pour cela.

### M4. L'objet de l'acte n'est presque jamais dans son nom

**94,4 % des 1 993 actes** n'ont aucun objet identifiable dans leur nom de fichier (ni polluant, ni
milieu, ni nuisance). Les contre-exemples de Fos-sur-Mer (`AP rejets atmosphériques`,
`APC laitiers historiques HF`) sont une pratique locale de nommage, prise à tort pour une règle.

Donc les ~650 actes annuels doivent bien être lus. C'est le seul travail que le LLM mérite.

### M5. La classification par ontologie, sur les 22 802 événements

| Objet | Volume | Part | Ce que c'est |
|---|---:|---:|---|
| indécidable | 14 822 | 65,0 % | rapports d'inspection (à ne pas lire, cf. M2) |
| rien | 5 458 | 23,9 % | prescriptions complémentaires, fiches Seveso, refus |
| état : ouverture | 1 438 | 6,3 % | mises en demeure |
| état : clôture | 535 | 2,3 % | levées de mise en demeure |
| **mouvement** | **423** | **1,9 %** | créations, extensions, suspensions, sols pollués |
| état : danger | 106 | 0,5 % | mesures d'urgence, conservatoires |
| **critère manquant** | **20** | **0,1 %** | servitudes d'utilité publique |

Critères déplacés par les 423 mouvements : `expoIndustrielle ↑` (413), `heritageIndustriel` (7),
`expoIndustrielle ↓` (3).

**Actes à lire réellement : 440.** Le reste se tranche sur les métadonnées.

### M6. Ce que chaque définition donne comme produit

| Définition | Communes touchées / an | Population | Contenu dominant |
|---|---:|---:|---|
| Mouvement (déplace un critère) | 386 / 10 000 | **6,7 %** | créations d'ICPE |
| État (MED, urgence, conservatoire) | 1 023 / 10 000 | 22,5 % | **70 % de mises en demeure** |

Au niveau national, la définition stricte donne **629 mouvements par an**, dont 614 créations ou
extensions d'installations, soit une commune donnée touchée **tous les 57 ans en moyenne**.

## Les croyances que ce spike a démenties

**Trois sont de moi.**

1. « L'objet de l'acte est souvent lisible dans le nom du fichier. » Faux : 94,4 % ne le sont pas.
   J'avais généralisé trois exemples de Fos-sur-Mer.
2. « La moitié des lignes du tableau réclameront un critère manquant. » Faux sur l'ICPE : 0,1 %.
   La prédiction vaudra peut-être pour un corpus multi-sources, elle ne valait pas ici.
3. « Le Fil sera riche là où l'audience est pauvre (communes industrielles). » Faux : les événements
   décisionnels tombent en villes moyennes et périurbain. Ma conclusion reposait sur la distribution
   des P0/P1, c'est-à-dire sur le filtre défectueux que je critiquais par ailleurs.

**Une est du cadrage initial.**

4. « Le goulot est la qualification, donc il faut un pipeline de lecture IA. » Le goulot était la
   définition de l'événement. Une fois posée, et une fois écartés les rapports d'inspection,
   **98,1 % du corpus se tranche sans ouvrir un seul PDF** (22 362 événements sur 22 802).

## Ce que le spike décide

**L'ICPE alimente un critère, pas un fil.** Les 614 créations et extensions annuelles doivent
rafraîchir `expoIndustrielle` (le critère existe déjà, il compte les ICPE actives). Le Fil ne raconte
un événement que si ce rafraîchissement déplace assez le score pour changer ce que le lecteur lit.
C'est la réalisation littérale de « Le Fil est le diff de l'index comparateur ».

**Les mises en demeure ne se publient pas telles quelles.** Trois raisons cumulées :
la MED décrit la conformité d'un exploitant, non l'exposition d'un territoire ; elle nomme une
personne morale, ce qu'aucune règle éditoriale ne borne aujourd'hui ; et elle crée un **biais de
détection**, puisqu'une commune inspectée paraîtra pire qu'une commune négligée. C'est le piège déjà
rencontré et corrigé sur `calme_sonore` (le bruit d'échantillonnage des métropoles bien
instrumentées). Une MED n'est interprétable qu'avec l'intensité du contrôle en dénominateur.

**Les mesures d'urgence sont des états, pas des mouvements.** Elles ont une date de fin. Elles
servent le résident, pas le candidat au déménagement. Cette distinction d'audience (celui qui habite
contre celui qui choisit) est la frontière la plus importante à graver, et elle traverse tout Le Fil.

## Ce que le spike a trouvé sans le chercher

**Les servitudes d'utilité publique.** Vingt par an, 0,1 % du corpus, et chacune grève des terrains
sur un quartier entier : `SFPTM-LegréMante-SUP` (site à l'arsenic de la Madrague, Marseille),
`SUP_MICHELIN_Cataroux` (Clermont-Ferrand), `AP SUP_OranoMining`.

La fréquence écrase leur valeur dans une statistique. Chacune pèse plus qu'un millier d'arrêtés de
prescriptions complémentaires. Aucun critère de futur•e ne les porte, et leur grain naturel est
l'adresse ou la parcelle, donc le module Logement. C'est aussi précisément ce qu'un notaire purge
avant une vente, ce qui la relie à la piste B2B de l'ADR-0008.

Une servitude est un fait durable, opposable, sourcé, localisé, et décisif pour un acheteur. Elle
satisfait tous les tests d'admission simultanément. **C'est le meilleur candidat du corpus, et il
était classé P2, donc écarté.**

## Ce qui reste ouvert

- **La définition à deux objets** (mouvement / état) tient sur ce corpus. Elle n'a pas été éprouvée
  sur une source non administrative (étude scientifique, décision de justice).
- **Le seuil de déplacement** : de combien un critère doit-il bouger pour qu'on le raconte ? Un delta
  de percentile peut faire changer de palier sans rien changer de réel.
- **La distance à l'habitat, la récidive, la nouveauté** ne sont pas dans le jeu de données. L'API
  expose `latitude` / `longitude` par installation. Le crawler les jette. Ce sont les trois variables
  les plus décisionnelles, et aucune ne se trouve dans un PDF.
- **L'audience** : le conjoncturel sert le résident, le structurel sert le candidat. futur•e vend
  aujourd'hui à des candidats. La porte « rapport sur ma propre commune » vise des résidents. Ces
  deux produits n'ont ni la même latence, ni la même exigence de fiabilité, ni la même responsabilité.
