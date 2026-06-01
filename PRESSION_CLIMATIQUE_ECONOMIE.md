# Pression climatique sur l'économie locale — conception (avant toute implémentation)

Travail de modélisation produit déclenché par le besoin de crédibilité du projet
de vie sur le volet économique, et par l'exigence du porteur d'une rigueur
extrême sur les mots employés. Aucune décision d'implémentation ici : on fige
d'abord le cadre méthodologique et le vocabulaire défendable publiquement.

Date : 2026-06-01.

Ce document est jumeau du chantier viabilité (lot A, MVP bassin d'emploi) mais en
reste **strictement distinct** : le porteur tient à ce qu'un signal robuste
(taille + diversité du bassin) ne soit jamais contaminé par un signal
interprétatif (pression climatique sur les secteurs). Deux lentilles séparées,
jamais fusionnées en une note unique.

## Validation produit (2026-06-01)

Le porteur valide la direction et, surtout, **abandonne le terme « résilience »**
faute de données pour le tenir sérieusement. Décision fondatrice : on préfère
renoncer à un mot qu'on ne peut pas défendre plutôt que de bâtir un proxy fragile.

Validé explicitement :
- la séparation viabilité / pression climatique sur l'économie ;
- le périmètre **adaptation / exposition physique uniquement** (pas la transition
  bas-carbone, hors doctrine « résilience, pas bilan carbone » et trop spéculative
  à la maille commune) ;
- la logique **narratif d'abord, non scoré** ;
- la **table sectorielle courte et défendable** ;
- le refus de prédire des gagnants ou des perdants ;
- le vocabulaire : le signal s'appellera **« pression climatique sur l'économie
  locale »** (ou variante proche), jamais « résilience », jamais « exposition
  économique » seule (jugée réductrice).

## Clarification méthodologique (le cœur, à graver)

Le porteur a demandé, avant tout code, de trancher trois notions souvent confondues.

### Les trois lentilles

| Lentille | Définition | Données aujourd'hui |
|---|---|---|
| **Viabilité** | santé du bassin + capacité d'absorption structurelle (taille des emplois + diversité sectorielle) | **Oui**, robuste (lot A) |
| **Pression climatique sur l'économie** | pression climatique exercée sur les activités × dépendance du territoire à des activités sensibles | **Oui**, partiel et narratif (ce document) |
| **Résilience économique** | capacité du territoire à absorber **ou se transformer** face aux chocs (capital, gouvernance, innovation, reconversion) | **Non**, pas de données fiables à la maille commune |

Trois notions distinctes, à ne jamais télescoper :
1. **Exposition** = pression climatique exercée sur les activités économiques.
2. **Fragilité** = dépendance du territoire à ces activités.
3. **Résilience** = capacité à absorber ou transformer ces chocs.

Une économie exposée n'est pas forcément fragile ; une économie fragile n'est pas
forcément incapable de s'adapter.

### Ce que mesure réellement la formule proposée

```
pression_brute = Σ  part_emploi  ×  sensibilité  ×  aléa_local(percentile DRIAS)
                    └─────┬────┘    └────┬─────┘    └──────────┬──────────────┘
                     dépendance      couplage          pression climatique
                    du territoire   secteur×aléa        sur le territoire
```

Décomposition facteur par facteur, sur les deux grilles de lecture :

| Facteur | Vocabulaire porteur | Cadre IPCC (risque = aléa × exposition × vulnérabilité) |
|---|---|---|
| `aléa_local` (percentile DRIAS) | **Exposition** (pression climatique) | aléa (hazard) |
| `part_emploi` (part du secteur dans l'emploi) | **Fragilité** (dépendance) | exposition de l'enjeu (présence) |
| `sensibilité` (table secteur × aléa) | le couplage | sensibilité (composante de vulnérabilité) |

Conclusion nette, tranchée avec le porteur :

- **Le signal ne mesure pas une simple exposition.** C'est un **produit exposition
  × fragilité**, pondéré par une sensibilité sectorielle. D'où le rejet du terme
  « exposition économique » seul, qui sous-vend la dépendance et sur-vend la
  pression.
- **Le signal ne contient aucun terme de résilience.** La capacité d'absorption ou
  de transformation n'entre nulle part dans le calcul. Le scorer reviendrait
  précisément à désigner des perdants, ce que le produit refuse.

### Pourquoi « résilience » n'est pas mesurable aujourd'hui

Cas révélateur (Chamonix) : exposition neige très haute, fragilité modérée (déjà
amortie par la diversification été), résilience très haute (capital, notoriété,
capacité d'investissement, bascule été). La formule classerait Chamonix « marquée »
au sens du risque physique brut, ce qui serait lu à tort comme « territoire
menacé » si le mot employé suggérait une issue.

Ce qu'on a, qui touche à la résilience :
- **diversité sectorielle** et **taille du bassin** : proxys de la capacité
  d'**absorption**, mais ils vivent déjà dans le **signal viabilité**, et la
  diversité amortit déjà mécaniquement la pression (un secteur sensible diversifié
  a une `part_emploi` faible, donc une contribution faible à la somme). C'est le
  seul morceau de résilience qu'on capte, et il est déjà encodé des deux côtés.

Ce qu'on n'a pas, et qui est le cœur de la résilience (absorber **ou** transformer) :
- capacité d'investissement et réserves financières du territoire ;
- gouvernance, capacité d'innovation, niveau de formation ;
- dynamique de reconversion (un territoire qui a déjà basculé) ;
- attractivité résidentielle indépendante de l'activité menacée.

Aucune de ces variables n'a de source publique propre et stable à la maille
commune. Approcher la résilience reviendrait à inventer un proxy interprétatif :
exactement le signal fragile que le porteur refuse. On l'**acte comme trou de
données assumé**, pas comme un chantier à bricoler.

## Principes directeurs

1. **Adaptation, pas mitigation.** On parle de pression physique sur les activités,
   jamais d'empreinte carbone ni de transition bas-carbone (trop spéculatif à la
   commune, hors doctrine). Un territoire n'est jamais flagué sur son exposition à
   la transition. Limite assumée (cf. cas Pau plus bas).
2. **Narratif avant score.** V1 ne déplace pas le classement. Le signal est une
   raison qualitative et un compromis, pas une note.
3. **Jamais une prédiction, jamais un verdict.** Une pression marquée nomme une
   dépendance à un aléa qui monte, pas un déclin annoncé. Humilité explicite : on
   dit à voix haute qu'on ne mesure pas la capacité d'adaptation.
4. **Table de sensibilité courte, publiée, défendable.** Peu d'entrées, chacune
   tenable devant un expert. Tout ce qui n'y figure pas est neutre.
5. **Signal distinct de la viabilité.** Deux lentilles, jamais une moyenne. Le
   robuste ne se laisse pas contaminer par l'interprétatif.
6. **Firewall préservé.** Comme pour les ancres : le comparateur et AskFuture ne
   reçoivent que du qualitatif (libellés de pression, secteur, aléa nommé), jamais
   les percentiles, les parts d'emploi chiffrées ni les INSEE.

## Le signal

### Nom

**Pression climatique sur l'économie locale.** Variantes acceptables si besoin
UX : « pression climatique sur le tissu économique local ». Proscrits :
« résilience » (non mesurée), « exposition économique » seule (réductrice),
« risque » (verdict).

### Formule

```
pression_brute(commune) = Σ_secteurs  part_emploi_secteur
                                     × sensibilité(secteur, aléa)
                                     × aléa_local(percentile DRIAS de l'aléa)
```

- Pas d'amortisseur de diversité explicite : il est déjà encodé dans les parts
  (un secteur dilué pèse peu).
- `aléa_local` = le percentile DRIAS déjà présent dans l'index (`pct`), normalisé
  0-1. On lit la pression **relative à la France**, pas une valeur absolue.

### Table de sensibilité (courte, publiée)

| Secteur (proxy emploi) | Aléa | Sensibilité | Variable d'aléa (index) |
|---|---|---|---|
| Agriculture | sécheresse | 0,7 | `pct.NORSWI04_yr` |
| Forêt / sylviculture | feu | 0,8 | `pct.NORIFM40_yr` |
| Tourisme estival | chaleur | 0,7 | `pct.NORTX30D_yr` (ou `NORTX35D_yr`) |
| Tourisme de montagne | neige | 0,8 | proxy altitude + `pct.NORTMm_seas_DJF` |

Tout le reste = **neutre** (sensibilité 0). Coefficients assumés comme convention
défendable, affichables, pas comme une vérité fine.

### Variables et sources

- **Chaleur** : `NORTX30D_yr` (jours > 30 °C), `NORTX35D_yr` (jours > 35 °C),
  `NORTMm_seas_JJA` (moyenne estivale). Déjà dans l'index, avec percentiles.
- **Sécheresse** : `NORSWI04_yr` (indice d'humidité des sols). **Attention
  polarité** : le sens « plus sec = plus de pression » doit être vérifié sur la
  définition exacte de l'indice avant tout calcul (ne pas inverser par accident).
- **Feu** : `NORIFM40_yr` (indice feu météo). Déjà dans l'index.
- **Neige (tourisme montagne)** : **maillon le plus faible.** Pas de variable
  d'enneigement directe. Proxy = `altitude` (déjà dans l'index, IGN RGE ALTI) +
  `NORTMm_seas_DJF` (température moyenne hiver). À traiter comme le moins robuste
  des quatre couples, et à signaler comme tel dans le doc et la synthèse.
- **Parts d'emploi sectorielles** : NA38 INSEE + emploi touristique INSEE.
  **Trou de données à instruire** : pas dans l'index aujourd'hui. À préparer par
  un script `populate-*` statique committé (même discipline que altitude / tension),
  à la **maille zone d'emploi INSEE héritée par commune** (cohérent avec le lot A
  viabilité, qui prépare déjà l'emploi par zone d'emploi : synergie de source, pas
  fusion de signal).

### Paliers qualitatifs

Sens « pression » (pas « résilience »), trois paliers : **faible / modérée /
marquée**. Bornes à caler en réel sur la distribution nationale, jamais un
pourcentage affiché. Une commune sans secteur sensible significatif tombe en
« faible » par construction (somme proche de zéro).

## Séparation des deux lentilles (cas testés)

Estimations raisonnées à confirmer sur données. Elles valident que les deux
lentilles disent des choses différentes et ne doivent pas être fusionnées.

| Territoire | Pression climatique sur l'économie | Viabilité | Lecture |
|---|---|---|---|
| Bastia | marquée | faible | les deux signaux convergent vers la prudence, mais pour des raisons distinctes |
| La Rochelle | modérée | bonne | exposée mais solide |
| Chamonix | marquée (neige) | moyenne | exposée, mais résilience (non mesurée) probablement haute : ne pas conclure |
| Pau | faible | bonne | non flaguée sur la transition carbone (limite assumée du périmètre) |
| Clermont-Ferrand | faible | forte | ni pression ni fragilité notables |
| Arcachon | marquée (chaleur + feu) | moyenne | double aléa sur un tissu touristique |
| Guéret | modérée | faible | problème de marché de l'emploi, pas de climat : c'est la viabilité qui parle, pas la pression |

Guéret et Chamonix sont les deux cas qui interdisent la fusion : à pression
comparable, la viabilité et la résilience divergent du tout au tout.

## Intégration recommandée (phasée)

1. **V1 — narratif non scoré.** La pression apparaît comme **raison / compromis**
   au comparateur et dans la synthèse, sans déplacer le classement. Libellés
   qualitatifs seulement (« tissu touristique estival exposé à la chaleur »),
   jamais de chiffre. AskFuture reçoit le libellé qualitatif via le firewall.
2. **Détail fin — module Métier (premium).** Le module Métier existe au catalogue
   sans données : ce signal lui en donne enfin (« ce que le climat fait à votre
   secteur »). C'est là que vit le détail par activité, dans le rapport payant.
3. **V2 — petit signal scoré indépendant**, seulement après épreuve réelle du
   narratif. Jamais fusionné à la viabilité ; au mieux un second axe, faible poids,
   borné, présenté comme tel.

Mise à jour du cadrage du gate (cohérence avec lot A) : « l'emploi se lit dans le
rapport » devient « le bassin d'emploi est pesé ; la pression climatique sur les
secteurs locaux est signalée ; le détail métier reste au rapport ».

## Garde-fous

- **Firewall.** Comparateur + AskFuture : qualitatif uniquement. Pas de percentile,
  pas de part d'emploi chiffrée, pas d'INSEE. Le chiffre reste au rapport.
- **Pas de verdict.** Le récit nomme une pression et une dépendance, jamais un
  avenir. Formule type : « une part de l'emploi local dépend du tourisme estival,
  exposé à la hausse des chaleurs », pas « territoire menacé ».
- **Humilité affichée.** Quand on nomme une pression, dire qu'on ne mesure pas la
  capacité d'adaptation du territoire (la résilience).
- **Convention assumée.** Coefficients de sensibilité et paliers affichés comme
  des conventions discutables, comme pour les frontières de zones.

## Trous de données à acter

- **Parts d'emploi sectorielles (NA38 + tourisme INSEE)** : à préparer en script
  statique, maille zone d'emploi héritée par commune (synergie avec lot A).
- **Enneigement** : pas de variable directe ; proxy altitude + DJF, maillon le plus
  faible, à signaler.
- **Polarité SWI sécheresse** : à vérifier avant calcul.
- **Résilience économique** : pas de données fiables à la commune. Trou assumé,
  pas un chantier.

## Décisions tranchées (2026-06-01)

- Terme « résilience » abandonné (pas de données).
- Nom retenu : « pression climatique sur l'économie locale ».
- Signal = produit exposition × fragilité, sensibilité en pondération ; jamais
  présenté comme exposition seule ni comme résilience.
- Narratif d'abord, non scoré, jamais une prédiction ni un verdict.
- Table de sensibilité courte à 4 couples, reste neutre.
- Distinct de la viabilité, jamais fusionné.
- Périmètre adaptation physique uniquement ; transition carbone hors champ
  (limite assumée).

## Questions ouvertes (à trancher avant implémentation)

1. **Affichage : produit unique ou deux composantes ?** Montrer un seul palier de
   pression, ou décomposer en « un aléa qui monte » + « une part d'emploi
   dépendante de cet aléa » (plus honnête, laisse AskFuture raisonner sans
   conclure) ? Recommandation : décomposer si l'UX le permet.
2. **Granularité des secteurs.** NA38 complet ou un sous-ensemble réduit aux seuls
   secteurs sensibles de la table ? Le reste étant neutre, un sous-ensemble suffit
   peut-être au calcul.
3. **Bornes des paliers** faible / modérée / marquée : à caler sur la distribution
   nationale réelle.
4. **Choix de l'indicateur chaleur** pour le tourisme estival : `NORTX30D_yr`
   (plus fréquent, plus stable) ou `NORTX35D_yr` (canicule, plus rare mais plus
   parlant) ?
