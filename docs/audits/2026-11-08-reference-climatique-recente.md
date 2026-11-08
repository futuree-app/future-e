# Comparer le climat 2050 au climat récent — audit et prototype (FUT-170)

*08/11/2026 · branche `bonjourfuturee/fut-170-accueil-comparer-le-climat-2050-a-un` · aucune fusion, aucun déploiement, aucune écriture Supabase.*

## Verdict : **GO avec réserves**

Une comparaison « 2050 contre climat récent » est **scientifiquement défendable** dans futur•e, à quatre conditions :

1. **Bons indicateurs.** Le climat récent vient de la réanalyse **SAFRAN** de Météo-France, sur **la grille même** des projections DRIAS-TRACC. Il couvre trois indicateurs : jours ≥ 35 °C, jours ≥ 30 °C et nuits tropicales.
2. **Deux repères juxtaposés, jamais un écart calculé.** On affiche les deux valeurs côte à côte, sans soustraction. Le résidu entre les deux systèmes est faible, mais pas nul : en dessous de 2 à 3 jours ou nuits, un écart n'est pas interprétable.
3. **Une période nommée** (2016–2025), jamais « aujourd'hui ».
4. **Deux limites écrites et consultables.**
   - Une valeur de maille de 8 km n'est pas un thermomètre : en Provence, la station compte deux à trois fois plus de jours ≥ 35 °C que sa maille.
   - En vallée de montagne, la maille décrit les hauteurs, pas la ville.

Le prototype est implémenté dans la PR (bloc « Éviter les fortes chaleurs » de l'accueil seulement). Il ne touche ni au moteur, ni aux seuils, ni au classement, ni aux dossiers.

**Deux arbitrages restent à faire** (§ E.4) :
- le changement de base des qualificatifs de la phrase ;
- la politique de mise à jour annuelle.


> **Contre-revue du 08/11/2026 : trois corrections appliquées, une limite de reproductibilité levée ; puis trois ajustements avant fusion (section « Dernières corrections avant fusion »), puis deux corrections de la contre-revue finale (section « Contre-revue finale »).** Voir la section « Corrections après contre-revue » ci-dessous. Elle **prime** sur le reste du document : nuits tropicales au sens strict de DRIAS (`> 20 °C`), phrase qui juge les journées comme les nuits, réserve de maille au premier niveau pour les cas démontrés en montagne, comparabilité recalculable depuis le dépôt.

## Corrections après contre-revue (08/11/2026)

Contre-revue indépendante (Work) du SHA `1a8b4025` : **NO GO en l'état** pour trois corrections ciblées, fondations validées (source SAFRAN, période 2016–2025, jointures, contrôle de 2022, 34 788 signaux inchangés). Les corrections portent sur la PR #132, sans changer l'architecture, le moteur, les seuils, le classement ni les dossiers.

### 1. Nuits tropicales : le seuil strict de DRIAS

**Cause.** Le calcul SAFRAN comptait `TINF_H >= 20`. DRIAS définit l'indicateur `TR` comme « Nombre de nuits tropicales (température minimale > 20°C) » ([drias-climat.fr, jeu TRACC, « Les indicateurs »](https://www.drias-climat.fr/accompagnement/section/401)). Les fichiers DRIAS du dépôt ne donnent que « Nombre de nuits tropicales » sans seuil (`data/source/*.txt`, ligne `NORTR_yr`). Les journées chaudes sont bien inclusives des deux côtés (« Tx ≥ 35 °C », « Tx ≥ 30 °C »).

**Correction.** `agreger_safran.py` compte `TINF_H > 20` (schéma 2 des fichiers, contrôlé au build : un fichier au schéma 1 est refusé). SIM2 donne `TINF_H` au dixième : une nuit à 20,0 °C exactement n'est plus tropicale. Les deux sources ont été régénérées (`safran-2016-2025.json`, nouveau `safran-1976-2005.json`, empreintes SHA-256 par année dans le fichier), ainsi que `src/data/climat-recent-communes.json`. Formulation au lecteur : « où la température reste au-dessus de 20 °C », « sans tomber à 20 °C » (au lieu de « sans descendre sous 20 °C », qui décrit `>= 20`).

**Effet sur les valeurs.** −0,43 nuit par an en moyenne par commune (au plus −3,2) ; 30 319 communes changent au dixième, 13 849 au chiffre affiché (arrondi). Pilotes, nuits 2016–2025 (avant → après) : Rochefort 13,1 → **12,5** ; La Rochelle 12,1 → **11,6** ; Nantes 3,4 → **3,3** ; Bordeaux 23,0 → **21,9** ; Nîmes 54,2 → **52,6** ; Marciac 11,8 → **10,6** ; Paris (1er arr.) 14,2 → **13,6** ; Briançon et Chamonix 0 → 0. Journées inchangées.

**Effet sur la concordance historique (non masqué : elle se dégrade légèrement).** SAFRAN 1976–2005 contre la référence DRIAS, 8 981 points :

| Nuits tropicales | Biais DRIAS − SAFRAN | Écart absolu moyen | p95 | Corrélation |
|---|---|---|---|---|
| `>= 20` (avant), médiane des références | +0,47 | 0,58 | 2,17 | 0,995 |
| **`> 20` (définition DRIAS), médiane des références** | **+0,71** | 0,76 | 2,97 | 0,994 |
| `> 20`, reconstruction de futur•e (méd. NOR − méd. A) | +0,74 | 0,81 | 3,20 | 0,993 |

La forme `>= 20` concordait mieux, mais c'est la définition officielle qui fait foi : DRIAS reste un peu plus « chaud » que SAFRAN sur ses propres nuits de référence (+0,7 nuit en moyenne), écart dans le même sens que pour les journées à 30 °C (+0,7). Une hypothèse plausible, non vérifiée : l'agrégat quotidien sur lequel ADAMONT a été calibré n'est pas exactement `TINF_H`. Cette différence entre dans la convention de bruit ci-dessous (2 nuits).

### 2. La phrase : exposition et évolution, deux questions distinctes

**Cause.** Sous les repères du moteur, `phraseChaleur` ne regardait que l'évolution des **nuits** : les journées à 35 °C étaient toujours dites « peu nombreuses », quelle que soit leur hausse. Avec la comparaison au climat récent (premier passage de FUT-170), 1 103 communes basculaient en « comme les nuits tropicales resteraient peu nombreuses », dont Avignonet (38023) : de **0,5 à 5,3** journées à 35 °C par an. Second défaut : une hausse était dite dès **1** jour ou nuit de plus, écart inférieur au bruit entre deux systèmes de données ; et « beaucoup plus fréquentes » se déclenchait sur un doublement près de zéro.

**Règle éditoriale minimale (implémentée, `pastilles.ts`).**
- **L'exposition** reste celle du moteur, dite par la pastille (« À surveiller », « Plutôt défavorable »…) : inchangée.
- **L'évolution** est dite **axe par axe** (journées à 35 °C, nuits tropicales), contre la période affichée et nommée (« qu'en 2016–2025 », ou « qu'en 1976-2005 » sans climat récent) :
  - hausse **lisible** à partir de `ECART_LISIBLE` = **2** par an → « deviendraient plus fréquentes » ;
  - hausse lisible **et** doublée → « beaucoup plus fréquentes » (le doublement seul ne suffit plus : 0,3 → 0,8 n'est pas une hausse dite) ;
  - sinon « resteraient peu nombreuses », pour cet axe seulement.
- **Justification de 2, et sa nature.** C'est une **convention éditoriale fondée sur le bruit mesuré**, pas un seuil scientifique : erreur type d'une moyenne sur dix ans ≈ 0,9 jour à 35 °C et 1,1 nuit ; écart moyen des deux systèmes sur leur période commune 0,1 à 0,7 (tableau ci-dessus) ; p95 de cet écart 0,4 à 3,0. Elle était déjà écrite dans le verdict (« en dessous de 2 à 3 jours, un écart n'est pas interprétable ») ; la phrase l'applique désormais.
- **« Particulièrement fréquentes »** (repère atteint) : « deviendraient » seulement si la période de comparaison n'atteint pas déjà le repère ; sinon « seraient » (Nîmes : 52,6 nuits sur 2016–2025 pour un repère de 25). « Augmenteraient de jour comme de nuit » suit la même hausse lisible.

**Les 1 103 communes rejouées** (avant = SHA `1a8b4025` ; après = cette correction ; mêmes entrées réelles) :

| Situation | Communes | Avant | Après |
|---|---|---|---|
| Journées en hausse lisible, pas les nuits | **101** | « … comme les nuits tropicales resteraient peu nombreuses. » | « Les journées au-dessus de 35 °C deviendraient beaucoup plus fréquentes qu'en 2016–2025 ; les nuits tropicales resteraient peu nombreuses. » |
| Aucune hausse lisible (écarts < 2) | **1 002** | « … comme les nuits tropicales resteraient peu nombreuses. » | inchangé |
| Nuits en hausse lisible, pas les journées | 0 | (par construction du lot) | — |

Exemples : Avignonet (38023) 0,5 → 5,3 jours, 1,7 → 2,0 nuits : ligne 1. Bétheny (51055) 1,1 → 3,0 jours (+1,9), 4,8 → 6,0 nuits : ligne 2, à la frontière de la convention.

**Sur les 34 788 communes** (et Paris, Lyon, Marseille) : **signal identique partout** (0 changement, testé) ; 28 832 phrases changent par rapport au SHA audité. Communes sous les repères (29 093) :

| Évolution 2016–2025 → 2050 | Communes | Phrase |
|---|---|---|
| Journées et nuits en hausse lisible | 16 275 | « Les journées au-dessus de 35 °C et les nuits tropicales deviendraient (beaucoup) plus fréquentes qu'en 2016–2025. » (ou qualificatifs distincts par axe) |
| Nuits seules | 8 837 | « Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales deviendraient (beaucoup) plus fréquentes qu'en 2016–2025. » |
| Journées seules | 226 | « Les journées au-dessus de 35 °C deviendraient (beaucoup) plus fréquentes qu'en 2016–2025 ; les nuits tropicales resteraient peu nombreuses. » |
| Aucune hausse lisible | 3 755 | « Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses. » |

Dont 9 134 communes avec un écart entre 1 et 2 sur au moins un axe : hier « plus fréquentes », aujourd'hui non qualifiées (évolution faible ou non interprétable). Côté défavorable, 702 phrases changent : 701 passent de « deviendraient » à « seraient particulièrement fréquentes » (repère déjà atteint sur 2016–2025), 1 de « augmenteraient » à « seraient fréquentes ».

**Test d'invariant** (`climat-recent.test.ts`, « LA PHRASE DIT VRAI ») : sur toutes les communes sous les repères, « peu nombreuses » n'est jamais dit d'un axe en hausse lisible, et « deviendraient … plus fréquentes » jamais d'un axe qui ne l'est pas.

### 3. Montagne : la maille contredite par le thermomètre

**Cause.** Briançon et Chamonix lisent 0 sur leur maille, pour 2016–2025 comme pour 2050 ; la phrase affirmait « Les fortes chaleurs resteraient exceptionnelles ici, même en 2050 » alors que les stations de vallée relèvent déjà 16 à 23 journées à 30 °C par an. Les propriétés disponibles ne permettent pas de corriger : `data/communes-altitude.json` donne l'altitude au **centroïde** (IGN RGE ALTI : Chamonix 1 865 m, pour une ville à 1 035 m), et aucune source ouverte du dépôt ne donne l'altitude des mailles SAFRAN.

**Correction (la plus petite démontrable).** Un **témoin**, pas un indicateur d'altitude : les stations Météo-France (« Données climatologiques de base – quotidiennes », Licence Ouverte 2.0), sur 2016–2025, avec **les mêmes définitions** (TX ≥ 35, ≥ 30, TN > 20). `scripts/climat-recent/stations_temoins.py` parcourt les 96 départements (lecture en flux, ~17 Mo chacun, rien de stocké hors une sortie de 0,2 Mo) : 1 392 stations retenues (≥ 8 années complètes, ≥ 90 % des jours de mai à septembre), 1 065 écartées faute de données, 2 sans commune. Chaque commune reçoit les stations de **son secteur** : sa maille (même jointure que les communes), ou à moins d'une demi-maille (4 km) de son point de référence.

**Règle (`stationContredit`).** Sur une mesure affichée, la maille projette **moins d'un** jour (ou d'une nuit) par an pour 2050 — l'absence que la phrase présenterait comme un fait — alors qu'une station du secteur en relève **déjà au moins 2** par an (même convention de bruit). Aucun seuil nouveau : le palier « moins d'un par an » et `ECART_LISIBLE` existent déjà. La règle « la station dépasse la projection » tout court a été mesurée puis **écartée** : 2 684 communes l'auraient reçue, presque toutes en plaine, où une station compte couramment quelques journées à 30 °C de plus que sa maille (écart ordinaire, déjà dit dans « Comment lire ce résultat ? »).

**Ce qui change au premier niveau** (signal du moteur inchangé ; seulement pour les communes présentées comme peu exposées, « Plutôt favorable » ou « À surveiller ») :

- Avant (Chamonix) : « Les fortes chaleurs resteraient exceptionnelles ici, même en 2050. »
- Après : « Sur le secteur de 8 km qui sert au calcul, les fortes chaleurs resteraient exceptionnelles, même en 2050. La station Météo-France Chamonix (1 042 m d'altitude, à 4 km) relève pourtant déjà 16 jours au-dessus de 30 °C par an en moyenne sur 2016–2025, plus que ce secteur de 8 km n'en prévoit pour 2050 : ces chiffres sous-estiment la chaleur là où elle mesure. »
- Briançon : même forme, station de Villar-Saint-Pancrace (1 310 m, à 2,4 km), 23 jours au-dessus de 30 °C.
- « Comment lire ce résultat ? » ajoute le détail (années complètes, valeur projetée de la maille) et précise qu'en montagne le secteur peut être bien plus haut que la vallée habitée.

**Communes touchées : 121** (45 « Plutôt favorable », 76 « À surveiller ») : Savoie 19, Hautes-Alpes 17, Haute-Savoie 16, Hautes-Pyrénées 15, Haute-Garonne (Luchonnais) 12, Isère 7, Alpes-de-Haute-Provence 7, Lozère 4, Bas-Rhin (Val de Villé) 4, Corse 5, et quelques fonds de vallée (Jura, Ain, Drôme, Puy-de-Dôme, Haute-Loire, Corrèze, Pyrénées-Orientales, Eure, Seine-Maritime). Déclencheur : 56 sur les journées à 30 °C, 65 sur les journées à 35 °C. Les valeurs DRIAS et SAFRAN affichées restent celles de la maille, qualifiées comme telles.

**Limite encore ouverte.** La réserve n'existe que là où un thermomètre la démontre : une vallée sans station de ≥ 8 années complètes dans son secteur garde la phrase d'avant. *(Le signal « Plutôt favorable » des 45 communes concernées est devenu « À surveiller » : voir « Dernières corrections avant fusion ».)* Une correction nationale (altitude réelle des mailles contre lieux habités, par croisement avec un MNT et l'occupation du sol) reste une **suite distincte**, non implémentée.

### 4. Reproductibilité des corrélations

**Cause.** Les corrélations de la section B venaient d'une chaîne exploratoire hors dépôt (`~/Documents/futuree-climat-recent/`).

**Correction.** Les trois comptes de chaleur sont recalculables **depuis le dépôt seul** : `python3 -P scripts/climat-recent/agreger_safran.py 1976 2005` (écrit `data/climat-recent/safran-1976-2005.json`, versionné, 2 Mo, empreinte de chaque fichier Météo-France), puis `node scripts/climat-recent/comparer-drias.mjs --ecrire` (lit les 51 fichiers DRIAS de `data/source/`, écrit `data/climat-recent/comparabilite-1976-2005.json`). Recalculé le 08/11 : **identique** aux chiffres exploratoires (35 °C : +0,11, r = 0,980 ; 30 °C : +0,71, r = 0,996 ; nuits strictes : +0,71, r = 0,994).

**Portée réduite.** Les lignes **températures** (moyenne annuelle, hiver, maximale d'été) et **sol sec** du tableau de la section B, ainsi que la comparaison `>= 20` et les colonnes 1991–2020 / 2006–2025 du tableau des pilotes (section C), restent issues de la chaîne exploratoire : elles sont **indicatives, non reproductibles depuis le dépôt**, et ne fondent aucune décision du produit (seuls les trois comptes de chaleur sont affichés). Le contrôle des stations de la section C (rayon 20 km) est remplacé, pour ce qui sert au produit, par `stations_temoins.py`.

### Validation

- Pipeline SAFRAN 2016–2025 et 1976–2005 régénéré ; empreintes vérifiées par les tests (`source.sha256`, `stations_source.sha256`) et par le `prebuild` (vérification octet pour octet).
- Tests ciblés : 19 dans `climat-recent.test.ts` (dont 8 nouveaux), `pastilles.test.ts` mis à jour (règle des qualificatifs). Suite complète, `tsc`, lint, build : voir le compte rendu de la PR.
- Moteur, seuils, classement, dossiers payants, Supabase : non modifiés. Aucune Preview déclenchée (déploiements Git désactivés hors `main`).

### Suites distinctes (non implémentées)

1. **Altitude de maille contre lieux habités** (correction nationale de la montagne), avec un MNT.
2. **Formulation « ne descend pas sous 20 °C »** ailleurs dans le produit (`recits.ts`, `reponses.ts`, dossier `QuartierClimatData.tsx`) : décrit `>= 20` alors que l'indicateur DRIAS est `> 20`. Écart d'un dixième de degré, hors du bloc FUT-170 ; à harmoniser dans un ticket dédié (« reste au-dessus de 20 °C »).
3. **Le signal « Plutôt favorable »** des communes à maille contredite : à réexaminer avec le moteur, si l'on veut que la pastille, et pas seulement la phrase, porte la réserve.


## Dernières corrections avant fusion (08/11/2026, soir)

*Reprise du SHA `e531338c`. Cette section prime sur « Corrections après contre-revue » pour les points qu'elle traite.*

**Convention validée.** L'écart d'au moins **2 jours ou 2 nuits par an** (`ECART_LISIBLE`) pour qualifier une hausse entre SAFRAN 2016–2025 et DRIAS 2050 est validé par le porteur, **comme convention éditoriale prudente, pas comme seuil scientifique**. Le code et ce document le disent dans ces termes.

### 1. Les 45 communes « Plutôt favorable » à maille contredite : « À surveiller »

**Cause.** La réserve de station (`stationContredit`) nuançait la phrase, mais la pastille restait « Plutôt favorable » : elle affirmait une rareté que le thermomètre du secteur dément.

**Correction.** Dans `phraseChaleur`, une commune dont les deux mesures sont sous une par an en 2050 ET dont la maille est contredite reçoit le signal d'interface `sous_seuil` (« À surveiller ») au lieu de `favorable`. **Le classement du moteur (`verdict`), les valeurs climatiques, les seuils et les dossiers ne changent pas.** Les 76 autres communes à réserve étaient déjà « À surveiller ».

**Les 45 exceptions**, listées une à une dans le test de non-régression (`MAILLE_CONTREDITE`, `climat-recent.test.ts`) : toute autre commune dont le signal bougerait fait échouer le test ; chacune doit passer exactement de `favorable` à `sous_seuil` et être contredite par une station.

Allos (04006), Barcelonnette (04019), Clamensane (04057), Faucon-de-Barcelonnette (04086), Méailles (04115), Turriers (04222), Arvieux (05007), Aspres-lès-Corps (05009), Briançon (05023), Eygliers (05052), Gap (05061), La Chapelle-en-Valgaudémar (05064), Les Orres (05098), Vallouise-Pelvoux (05101), Puy-Saint-Pierre (05109), Saint-Crépin (05136), Dévoluy (05139), Saint-Firmin (05142), Saint-Jacques-en-Valgodemard (05144), Saint-Maurice-en-Valgodemard (05152), Villar-Loubière (05182), Villar-Saint-Pancrace (05183), Rimplas (06102), Clavans-en-Haut-Oisans (38112), Le Freney-d'Oisans (38173), Lavaldens (38207), Mizoën (38237), Saint-Christophe-en-Oisans (38375), La Salette-Fallavaux (38469), Gavarnie-Gèdre (65192), Sazos (65413), Aussois (73023), Avrieux (73026), Feissons-sur-Salins (73113), Moûtiers (73181), Saint-Marcel (73253), Sainte-Marie-de-Cuines (73255), Saint-Martin-d'Arc (73256), Saint-Martin-sur-la-Chambre (73259), Saint-Michel-de-Maurienne (73261), Valloire (73306), Villarodin-Bourget (73322), Chamonix-Mont-Blanc (74056), Les Contamines-Montjoie (74085), Les Houches (74143).

**Rendus réels vérifiés** (build de production, `next start`, route `/api/accueil/lecture`) :
- Briançon : « À surveiller » ; « Sur le secteur de 8 km qui sert au calcul, les fortes chaleurs resteraient exceptionnelles, même en 2050. La station Météo-France Villar St Pancrace (1 310 m d'altitude, à 2,4 km) relève pourtant déjà 23 jours à 30 °C ou plus par an en moyenne sur 2016–2025, plus que ce secteur de 8 km n'en prévoit pour 2050 : ces chiffres sous-estiment la chaleur là où elle mesure. »
- Chamonix : « À surveiller » ; station Chamonix (1 042 m, à 4 km), 16 jours à 30 °C ou plus.
- Gap (station Gap, 885 m, 5 jours à 35 °C ou plus), Moûtiers (480 m, 10 jours à 35 °C ou plus), Barcelonnette (1 155 m, 18 jours à 30 °C ou plus) : « À surveiller », même forme.
- Témoin sans station contradictoire : La Condamine-Châtelard reste « Plutôt favorable », « Les fortes chaleurs resteraient exceptionnelles ici, même en 2050. »

### 2. Les formulations d'exposition

**Cause.** « Resteraient peu nombreuses » était dit de tout axe sans hausse lisible, quelle que soit sa valeur : un jugement d'exposition tiré d'une absence d'évolution. Près des repères, il trompait : Cercoux, 6,9 journées à 35 °C ou plus en 2050 pour un repère de 8 ; Campestre-et-Luc, 20 nuits tropicales pour 25. Avant correction, 12 818 phrases contenaient « peu nombreuses », dont **27** sur des journées entre 6 et 8 par an et **12** sur des nuits entre 20 et 25.

**Correction : une description, plus un jugement.** Sans hausse lisible, la phrase **décrit l'évolution** : « n'augmenteraient pas nettement par rapport à 2016–2025 ». Elle ne dit « resteraient rares » que sous **une par an** en 2050, le palier « moins d'un par an » déjà en usage (aucun seuil nouveau). « Peu nombreuses » n'est plus employé nulle part ; l'exposition reste dite par la pastille. Sans période de comparaison lisible (référence non reconstructible et pas de climat récent), aucune évolution n'est dite : « L'évolution de ces deux mesures ne peut pas être établie ici : la période de comparaison manque. » (aucune commune réelle concernée aujourd'hui).

**Avant → après :**
- Cercoux (17077 ; 5,3 → 6,9 jours, 10,7 → 23 nuits) : « Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales deviendraient beaucoup plus fréquentes qu'en 2016–2025. » → « Les journées à 35 °C ou plus n'augmenteraient pas nettement par rapport à 2016–2025, mais les nuits tropicales deviendraient beaucoup plus fréquentes. »
- Arre (30016 ; 23 → 23,2 nuits) : « … ; les nuits tropicales resteraient peu nombreuses. » → « … ; les nuits tropicales n'augmenteraient pas nettement. »
- Campestre-et-Luc (30064 ; 18,3 → 20 nuits) : « … comme les nuits tropicales resteraient peu nombreuses. » → « Les journées à 35 °C ou plus comme les nuits tropicales n'augmenteraient pas nettement par rapport à 2016–2025. »
- Avignonet (38023) : « Les journées à 35 °C ou plus deviendraient beaucoup plus fréquentes qu'en 2016–2025 ; les nuits tropicales n'augmenteraient pas nettement. »

**Définitions officielles.** DRIAS-TRACC définit les indicateurs par `Tmax ≥ 30 °C` et `Tmax ≥ 35 °C` (inclusifs). Tout le bloc chaleur de l'accueil dit désormais « à 35 °C ou plus », « à 30 °C ou plus » (grands chiffres, légendes, bascule « Et à 30 °C ou plus ? », texte des lecteurs d'écran, méthode, réserve de station), au lieu de « au-dessus de ».

**Conséquences, sur les 34 788 communes (et Paris, Lyon, Marseille)** : 30 264 phrases changent par rapport à `e531338c` (la formulation « à 35 °C ou plus » touche toutes celles qui nomment les journées) ; signal changé pour **45** communes exactement, classement pour aucune. Répartition des phrases sous les repères :

| Phrase | Communes |
|---|---|
| Journées et nuits « deviendraient beaucoup plus fréquentes qu'en 2016–2025 » | 11 377 |
| Journées sans hausse nette, nuits en hausse (« beaucoup plus » / « plus ») | 5 449 / 1 504 |
| Journées « beaucoup plus », nuits « plus » | 4 254 |
| Journées rares, nuits sans hausse nette | 1 982 |
| Journées comme nuits sans hausse nette | 1 770 |
| Journées rares, nuits en hausse (« beaucoup plus » / « plus ») | 1 756 / 128 |
| Journées « plus », nuits « beaucoup plus » | 410 |
| Journées et nuits « plus » | 234 |
| Journées en hausse, nuits sans hausse nette / rares | 224 / 2 |
| Journées sans hausse nette, nuits rares | 3 |
| Maille contredite (réserve de station) | 45 |

**Test d'invariant mis à jour** (« LA PHRASE DIT VRAI ») : sur toutes les communes sous les repères, jamais « peu nombreuses » ; « n'augmenteraient pas nettement » seulement si l'écart est sous 2 ET la valeur 2050 d'au moins une par an ; « resteraient rares » seulement sous une par an ; « deviendraient … plus fréquentes » seulement pour une hausse lisible.

### 3. Lint global : préexistant, preuve

Reproduit avec les mêmes versions (Node 25.8.2, ESLint 9.39.4, `node_modules` cloné, `package-lock.json` et `eslint.config.mjs` identiques entre `main` `4c0ebc5b` et la branche) :
- `npx eslint .` **plante de la même façon sur `main` et sur la branche** : « A configuration object specifies rule "react/no-unescaped-entities", but could not find plugin "react" ». Cause : le dernier objet de `eslint.config.mjs` applique cette règle sans `files`, donc aussi aux fichiers `.cjs` que les configurations Next ne couvrent pas ; le premier rencontré est `docs/audits/2026-10-21-fut41-vos-lieux/outils/recette-compat.cjs` (FUT-41, présent sur `main`, hors PR).
- En excluant les `.cjs` : **56 problèmes, 23 erreurs sur `main` ; exactement les mêmes 56 sur la branche** (comparaison fichier, règle, ligne) ; **aucun propre à la PR**. Les fichiers de la PR passent le lint sans erreur.
- Non corrigé ici (hors périmètre, configuration commune) ; correctif probable : restreindre cet objet de règles à `files: ["**/*.{js,jsx,mjs,ts,tsx}"]`, dans un ticket dédié.

### Validation
- Tests ciblés `climat-recent.test.ts` + `pastilles.test.ts` : 58, 0 échec. Suite complète : 4 373 tests, 4 372 réussis, 1 ignoré, 0 échec.
- `tsc` sans erreur ; lint des fichiers de la PR sans erreur ; build de production réussi (variables Supabase fictives, aucun appel abouti) ; `build-climat-recent.mjs` : fichier à jour ; `comparer-drias.mjs` : corrélations inchangées.
- Moteur, seuils scientifiques, classement, architecture SAFRAN, dossiers payants, Supabase : non modifiés. Aucun déploiement, aucune Preview.

### Suites distinctes (mises à jour)
1. Altitude de maille contre lieux habités (correction nationale de la montagne, MNT).
2. Harmoniser hors du bloc FUT-170 : « ne descend pas sous 20 °C » (→ « reste au-dessus de 20 °C ») et « au-dessus de 30/35 °C » (→ « à 30/35 °C ou plus ») dans `recits.ts`, `reponses.ts`, la synthèse Territoire, `climat-facts.ts`, le dossier (`QuartierClimatData.tsx`), la page `/chaleur`.
3. Lint : restreindre l'objet de règles React aux fichiers JS/TS.

---

## Contre-revue finale (08/11/2026, nuit) : deux corrections rédactionnelles

*Reprise du SHA `8547bd3f` (NO GO). Le reste de ce SHA a été validé par la contre-revue : 45 changements de pastille exactement, réserves de station, projections, seuils et moteur inchangés, données et corrélations reproductibles.*

### 1. « Deviendraient particulièrement fréquentes » sous l'écart lisible

- **Cause.** Dans la branche « Plutôt défavorable » à un seul axe, le verbe ne vérifiait que le repère sur la période de comparaison (`reference >= seuil` donnait « seraient », sinon « deviendraient »). Il ne vérifiait pas l'écart lisible. À Courmes (06049), Coursegoules (06050) et Vence (06157), les nuits passent de **23,6 à 25** (+1,4) : la phrase disait « deviendraient », donc un changement que la convention de 2 nuits ne permet pas d'affirmer.
- **Correction.** « deviendraient » exige maintenant une hausse lisible **et** une période de comparaison sous le repère ; sinon, « seraient particulièrement fréquentes », qui décrit l'exposition seule. Le signal défavorable et le classement ne bougent pas.
- **Avant / après.** Vence : « Les nuits tropicales deviendraient particulièrement fréquentes… » devient « Les nuits tropicales seraient particulièrement fréquentes… ». 3 communes.

### 2. La frontière exacte de 2,0

- **Cause.** Les valeurs sont au dixième, mais leur différence se calcule en virgule flottante binaire : 2,3 − 0,3 donne `1.9999999999999998`. À La Cavalerie (12063), les journées passent de **0,3 à 2,3** et la phrase disait « n'augmenteraient pas nettement ». Le défaut touchait 236 axes, dans 231 communes.
- **Correction.** Les qualificatifs comparent avec une tolérance de 10⁻⁹ (`auMoins`), soit des millions de fois moins que le dixième affiché. Elle ne déplace pas la frontière : elle la rend exacte. Le classement du moteur garde ses propres comparaisons, inchangées.
- **Avant / après.** La Cavalerie : « Les journées à 35 °C ou plus n'augmenteraient pas nettement par rapport à 2016–2025, mais les nuits tropicales deviendraient beaucoup plus fréquentes. » devient « Les journées à 35 °C ou plus et les nuits tropicales deviendraient beaucoup plus fréquentes qu'en 2016–2025. »

### Mesure nationale (34 791 lectures rejouées, SHA `8547bd3f` contre ce SHA)

| | Nombre |
|---|---|
| phrases modifiées | **234** (231 à la frontière de 2,0, 3 défavorables) |
| signaux modifiés | **0** |
| classements modifiés | **0** |

### Tests

- Le test « LA PHRASE DIT VRAI » compte maintenant l'écart en **dixièmes entiers**, avec sa propre arithmétique et sans la tolérance du code testé. Il vérifie aussi le sens inverse : une hausse lisible n'est jamais dite « pas nettement ». C'est ce sens inverse qui manquait : l'ancien test calculait l'écart en flottant, comme le code, et ne voyait donc pas le défaut.
- Nouveau test national : dans la branche défavorable, « deviendraient particulièrement » n'apparaît qu'après une hausse lisible, et seulement si la période de comparaison est sous le repère.
- Nouveaux tests ciblés :
  - la frontière, avec La Cavalerie, 0,3 → 2,3 et 3,1 → 5,1 ;
  - un cas juste sous la frontière, 0,3 → 2,2 ;
  - Courmes, Coursegoules et Vence ;
  - 23 → 25 nuits, la frontière exacte côté défavorable.
- Les deux fichiers ciblés passent : 61 tests, 0 échec.
- La suite complète, lancée seule (`--test-concurrency=1`), passe : 4 376 tests, 4 375 réussis, 1 ignoré, 0 échec.
- `tsc` passe. Le lint de `pastilles.ts` passe.

**Limite ouverte.** Aucune nouvelle. La tolérance ne vaut que pour les qualificatifs de la phrase ; les repères du moteur (`>=` sur valeur non arrondie) restent tels quels, par consigne.

## A. Disponibilité des données

### Ce que futur•e avait déjà (et pourquoi cela ne suffit pas)

| Donnée | Où | Ce qu'elle donne | Utilisable ici ? |
|---|---|---|---|
| **DRIAS-TRACC** (17 couples de modèles EURO-CORDEX, médiane) | `data/data_climat.json`, extrait `src/data/apercu-climat-communes.json` | Projections à +2 / +2,7 / +4 °C France. La référence 1976–2005 est **reconstruite** (projeté − écart). | C'est la projection. |
| **ERA5-Land** (Copernicus) | `scripts/populate-era5-trend.py` → table Supabase `commune_era5_trend` ; page `/chaleur/[insee]`, dossier Territoire, `wizard-preview` | **Température moyenne annuelle** des 10 dernières années, contre 1961–1990 (moyennes mensuelles, maille ~9 km) | **Non.** Sans données quotidiennes, aucun compte de jours ou de nuits. Sa référence (1961–1990) et sa grille ne sont pas celles de DRIAS. |
| ERA5 rayonnement, SocleOM (outre-mer) | comparateur, accueil outre-mer | Hors sujet | — |

Au passage, deux défauts sur l'existant ERA5, **hors périmètre, non corrigés** :
- la page `/chaleur/[insee]` écrit « +X °C depuis la fin du XXᵉ siècle » pour une base **1961–1990** ;
- la fiche chaleur du dossier Territoire juxtapose une base 1961–1990 (ERA5) et une base 1976–2005 (DRIAS) sans le dire au premier niveau.

### Sources examinées

| Source | Accès, licence | Maille, pas de temps | Jours ≥ 35 / ≥ 30 °C, nuits ≥ 20 °C ? | Retenue ? |
|---|---|---|---|---|
| **SAFRAN (SIM2 quotidienne)**, Météo-France | [data.gouv.fr](https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne), **Licence Ouverte 2.0**, un CSV par année depuis 1958, ~140 Mo compressé | 8 km (9 892 mailles, dont 8 981 terrestres), quotidien. `TSUP_H` = maximum des 24 températures horaires (06–06 UTC) ; `TINF_H` = minimum (18–18 UTC) | **Oui**, exactement | **Oui** |
| Normales 1991–2020 (stations) | Fiches climatologiques Météo-France | Stations | Oui, mais par station seulement, sans couverture communale | Contrôle seulement |
| Données quotidiennes de stations, Météo-France | [data.gouv.fr](https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes), Licence Ouverte 2.0, par département | Ponctuel | Oui | **Contrôle** (maille contre thermomètre) |
| ERA5-Land quotidien (Copernicus) | Compte CDS | ~9 km | Possible | Non : ce n'est pas la grille de correction de DRIAS, et il est déjà écarté pour les extrêmes |

**SAFRAN est une réanalyse, pas une mesure.** Les observations des stations y sont interpolées par massif et par tranche d'altitude de 300 m, puis sur une grille de 8 km ([présentation Météo-France](https://static.data.gouv.fr/resources/donnees-changement-climatique-sim-quotidienne/20260602-150234/climatologie-presentation-modele-sim-20260602.pdf)). Chaque valeur est celle d'un carré de 8 km, pas d'une adresse.

### Pourquoi SAFRAN, et pas une autre source

DRIAS-2020, dont DRIAS-TRACC est tiré, est **corrigé de ses biais par la méthode ADAMONT à partir de l'analyse SAFRAN**, et livré **sur la grille SAFRAN** de 8 km (134 × 143 points), selon la [fiche technique DRIAS-2020](https://drias-prod.meteo.fr/serveur/simulations_climatiques/Documentations_Donnees/Fiches_techniques_Atmospherique/5-DRIAS-2020/Doc_database_DRIAS-2020_CNRM-CM5_RACMO22E.pdf). Vérifié ici : les 8 981 points DRIAS de `data/source` retrouvent chacun leur maille SAFRAN à moins de 0,001° (aucun doublon). **C'est la seule source récente qui partage la maille et le référentiel des projections.**

### Quelle période ? Recommandation : **2016–2025**

Écart de température moyenne annuelle à 1976–2005, en moyenne sur les 8 981 points :

| Période | Écart | Ce que c'est |
|---|---|---|
| 1991–2020 | +0,47 °C | Normale officielle (30 ans), centrée sur 2005 |
| 2006–2025 | +0,87 °C | 20 ans, la même longueur que les fenêtres DRIAS |
| 2015–2024 | +1,22 °C | 10 ans |
| **2016–2025** | **+1,27 °C** | **Les 10 dernières années complètes** |
| *DRIAS « 2030 » (+2 °C France)* | *+1,35 °C* | *projection* |
| *DRIAS « 2050 » (+2,7 °C France)* | *+2,08 °C* | *projection* |

| Critère | 1991–2020 | 2006–2025 | **2016–2025** |
|---|---|---|---|
| Pertinence pour le lecteur | Faible : les étés 2018, 2019, 2022 et 2025 y pèsent peu | Moyenne : inclut 2006–2010 | **Forte : les étés qu'il a vécus** |
| Robustesse (erreur type d'une moyenne, médiane nationale) | — | Nuits tropicales ±0,8 ; jours ≥ 35 °C ±0,65 | Nuits tropicales ±1,1 ; jours ≥ 35 °C ±0,9 |
| Retard dû à la tendance | Très fort | Fort : 6,8 nuits tropicales en moyenne nationale, contre 8,7 sur 2016–2025 | **Minimal** |
| Normale climatologique | Oui | Non | Non (à dire) |
| Homogénéité SAFRAN | Réseau densifié dans les années 1990 | Bonne | Bonne. Les 4 dernières années sont révisables (mise à jour bimensuelle) |
| Licence, reproduction, coût | identiques | identiques | identiques (~1,4 Go lus en flux, ~7 min) |

**Raisonnement.**
- **La tendance pèse plus que le bruit.** Sur les nuits tropicales, l'écart entre la fenêtre de 20 ans et celle de 10 ans (≈ 1,9 nuit en moyenne nationale) dépasse l'erreur type d'une moyenne sur 10 ans (≈ 1,1). Une fenêtre de 20 ans décrit donc le climat d'il y a dix ans plus fidèlement que celui d'aujourd'hui.
- **1991–2020 est une normale, mais elle répond à une autre question** : elle situe le climat de la fin du XXᵉ siècle, et non le climat que le lecteur connaît.
- **Le prix de 2016–2025 : sa sensibilité à une décennie.** Elle contient 2022, année exceptionnelle (Bordeaux : 17 jours ≥ 35 °C cette année-là, 4,8 en moyenne). C'est pour cela que la période est **nommée**, et que la méthode rappelle qu'une année isolée peut s'éloigner nettement de la moyenne.
- **2017–2026 n'est pas encore disponible** : 2026 est incomplète. Aucune période plus récente et complète n'existe.

---

## B. Comparabilité avec DRIAS-TRACC

### Même grandeur, mêmes seuils, même maille

| | DRIAS-TRACC | SAFRAN (ce calcul) |
|---|---|---|
| Jours ≥ 35 °C | `NORTX35D_yr` « Nombre de jours avec Tx ≥ 35 °C » | `TSUP_H ≥ 35` |
| Jours ≥ 30 °C | `NORTX30D_yr` | `TSUP_H ≥ 30` |
| Nuits tropicales | `NORTR_yr`, « température minimale > 20°C » | `TINF_H > 20` **(corrigé le 08/11 : `≥ 20` auparavant, voir « Corrections après contre-revue »)** |
| Maille | grille SAFRAN 8 km | grille SAFRAN 8 km, **appariée point par point** |
| Jointure commune → point | `joindreAuPointLePlusProche` | **la même fonction** (`build-drias-median.js`) |
| Période | 20 ans autour de l'année où le niveau de réchauffement est atteint | 10 années civiles nommées |

### Le test décisif : SAFRAN 1976–2005 retrouve-t-il la référence DRIAS ?

Si DRIAS et SAFRAN parlent du même monde, la référence 1976–2005 des projections, corrigée vers SAFRAN, doit coïncider avec SAFRAN observé sur 1976–2005, point par point. Mesuré sur les 8 981 points, contre la médiane des 17 références (identique à ±0,1 près à la reconstruction de futur•e, médiane(NOR) − médiane(A)) :

| Indicateur | Moyenne DRIAS | Moyenne SAFRAN | Biais moyen | Écart absolu moyen | p95 | Corrélation |
|---|---|---|---|---|---|---|
| Jours ≥ 35 °C | 0,67 | 0,56 | **+0,11** | 0,14 | 0,43 | 0,980 |
| Jours ≥ 30 °C | 8,37 | 7,66 | **+0,71** | 0,72 | 2,30 | 0,996 |
| Nuits ≥ 20 °C *(ancienne définition, exploratoire)* | 4,07 | 3,59 | +0,47 | 0,58 | 2,17 | 0,995 |
| **Nuits > 20 °C (définition DRIAS, retenue)** | 4,07 | 3,36 | **+0,71** | 0,76 | 2,97 | 0,994 |
| Température moyenne annuelle | 10,80 | 10,61 | +0,18 °C | 0,18 | 0,31 | 0,999 |
| Température moyenne d'hiver | 3,73 | 3,91 | −0,17 °C | 0,18 | 0,35 | 0,999 |
| Maximale moyenne d'été | 22,65 | 22,35 | +0,29 °C | 0,30 | 0,52 | 0,999 |
| Jours de sol sec (SWI < 0,4) | 91,3 | 76,5 | **+14,8** | 14,9 | 28,8 | 0,981 |

**Lecture.**
- **Températures et comptes de chaleur : comparables.** DRIAS reproduit la géographie de SAFRAN presque parfaitement. Il est très légèrement plus chaud, sans doute parce que la version de SAFRAN de calibration (« SAFRAN 2016 ») et la période de calibration d'ADAMONT diffèrent de la version diffusée aujourd'hui ; nous n'avons pas trouvé la documentation qui le confirmerait.
- **Le résidu fixe un plancher d'interprétation.** En dessous d'environ 2 jours ou nuits (p95 de l'écart à la référence), une différence entre « récent » et « 2050 » n'a pas de sens.
- **Jours de sol sec : non comparables.** Le biais est de 15 jours ; les versions d'ISBA diffèrent probablement. À exclure.
- **Indice forêt-météo : non calculable** à partir de SIM2 seul. Non évalué.

### Où se situe le climat récent sur la trajectoire DRIAS ?

Moyennes nationales sur les 8 981 points :

| | 1976–2005 (DRIAS) | **SAFRAN 2016–2025** | DRIAS « 2030 » | DRIAS « 2050 » | Points où récent > 2050 |
|---|---|---|---|---|---|
| Jours ≥ 35 °C | 0,68 | **1,52** | 2,34 | 4,03 | 0,3 % |
| Jours ≥ 30 °C | 8,34 | **14,18** | 15,74 | 21,34 | 1,0 % |
| Nuits tropicales | 4,09 | **8,69** | 10,43 | 15,69 | 0,7 % |

Le climat récent se place **entre la référence et 2050 presque partout**. Il a parcouru environ 20 % (jours ≥ 35 °C), 41 % (≥ 30 °C) et 33 % (nuits) du chemin, en médiane. La juxtaposition « 2050 contre climat récent » ne raconte donc pas de baisse trompeuse. Un test (`climat-recent.test.ts`) bloque la lecture si ce constat change à une mise à jour.

**Une question reste ouverte, sans changer la conclusion.** En température moyenne, 2016–2025 a déjà atteint le niveau DRIAS « 2030 » (+1,27 contre +1,35 °C). Les comptes d'extrêmes restent pourtant en deçà : 8,7 nuits contre 10,4. Or la littérature montre au contraire que les extrêmes de chaleur d'Europe de l'Ouest progressent plus vite que dans les modèles ([Vautard et al., 2023](https://www.nature.com/articles/s41467-023-42143-3)). Deux explications possibles :
- l'interpolation SAFRAN lisse les pointes (voir C) ;
- la relation entre un compte au-dessus d'un seuil et la moyenne n'est pas linéaire.

Sur les communes pilotes, les **évolutions relatives** observées par les stations et par SAFRAN concordent. Exemple à Nîmes, jours ≥ 35 °C de 1976–2005 à 2016–2025 : ×3,8 pour la station, ×3,8 pour la maille. Nous n'avons donc pas d'indice d'une tendance amortie. Le point mérite une revue par un climatologue avant toute communication chiffrée sur le « chemin parcouru ».

### Les précautions retenues

1. **Pas de soustraction affichée.** Deux repères juxtaposés, chacun avec sa période et sa source. La phrase sous la pastille ne qualifie une hausse qu'à partir de **2** jours ou nuits de plus par an (`ECART_LISIBLE`, corrigé le 08/11 : 1 auparavant), axe par axe. Elle ne cite aucun chiffre, sauf la réserve de station en montagne.
2. **Jamais « aujourd'hui », jamais « actuel »** : « climat récent (2016–2025) ». Un test le vérifie.
3. **Deux natures, deux sources nommées** : « DRIAS · Météo-France, horizon 2050 » et « réanalyse SAFRAN · Météo-France ».
4. **La limite de maille** est écrite dans « Comment lire ce résultat ? ».
5. **La référence 1976–2005 reste consultable**, au même endroit.

---

## C. Résultats du prototype

Valeurs au **point DRIAS de la commune** (même jointure que futur•e ; Paris par son 1er arrondissement, comme DRIAS). Les colonnes DRIAS sont celles que futur•e affiche déjà, relues dans `src/data/apercu-climat-communes.json`.

**Contrôle de cohérence.** Rochefort à 2,8 jours (affiché « 3 ») et 23,6 nuits (« 24 ») en 2050, contre 0,3 (« moins d'une journée ») et 5,3 (« 5 ») sur 1976–2005 : ce sont exactement les chiffres cités dans la mission.

| Commune | Indicateur | DRIAS 1976–2005 (reconstruite) | SAFRAN 1976–2005 | SAFRAN 1991–2020 | SAFRAN 2006–2025 | **SAFRAN 2016–2025** | DRIAS « 2030 » | **DRIAS « 2050 »** | σ annuel |
|---|---|---|---|---|---|---|---|---|---|
| Rochefort (17299) | Jours ≥ 35 °C | 0,3 | 0,2 | 0,3 | 0,9 | **1,5** | 1,5 | **2,8** | 0,7 |
| | Jours ≥ 30 °C | 7,1 | 6,4 | 6,5 | 7,3 | **10,8** | 13,9 | **18,5** | 3,7 |
| | Nuits tropicales | 5,3 | 4,9 | 7,2 | 9,9 | **13,1 → 12,5** | 13,8 | **23,6** | 6,1 |
| La Rochelle (17300) | Jours ≥ 35 °C | 0,3 | 0,2 | 0,3 | 0,9 | **1,5** | 1,2 | **2,8** | 0,7 |
| | Jours ≥ 30 °C | 6,7 | 6,3 | 6,5 | 7,0 | **10,2** | 13,6 | **18,0** | 3,7 |
| | Nuits tropicales | 5,3 | 4,7 | 6,7 | 9,0 | **12,1 → 11,6** | 13,6 | **23,4** | 5,9 |
| Nantes (44109) | Jours ≥ 35 °C | 0,5 | 0,7 | 0,6 | 0,8 | **1,2** | 2,0 | **4,1** | 1,1 |
| | Jours ≥ 30 °C | 8,1 | 7,7 | 7,6 | 8,2 | **11,2** | 15,6 | **21,8** | 5,1 |
| | Nuits tropicales | 2,0 | 1,8 | 1,8 | 2,2 | **3,4 → 3,3** | 6,2 | **11,1** | 2,1 |
| Bordeaux (33063) | Jours ≥ 35 °C | 1,5 | 1,2 | 1,6 | 3,2 | **4,8** | 4,6 | **6,3** | 2,4 |
| | Jours ≥ 30 °C | 16,5 | 15,1 | 18,1 | 20,2 | **25,3** | 27,6 | **35,1** | 7,2 |
| | Nuits tropicales | 7,3 | 5,5 | 11,7 | 17,2 | **23,0 → 21,9** | 18,5 | **28,1** | 7,9 |
| Nîmes (30189) | Jours ≥ 35 °C | 2,7 | 2,1 | 3,4 | 5,5 | **8,0** | 8,7 | **14,4** | 4,7 |
| | Jours ≥ 30 °C | 36,2 | 33,5 | 41,0 | 45,4 | **53,9** | 56,3 | **67,9** | 13,1 |
| | Nuits tropicales | 33,0 | 28,4 | 38,6 | 45,0 | **54,2 → 52,6** | 56,5 | **69,1** | 11,9 |
| Marciac (32233, rurale, Gers) | Jours ≥ 35 °C | 1,5 | 1,5 | 1,5 | 2,0 | **3,1** | 5,2 | **8,2** | 2,5 |
| | Jours ≥ 30 °C | 14,5 | 14,8 | 15,5 | 18,0 | **23,1** | 26,9 | **34,2** | 8,6 |
| | Nuits tropicales | 5,0 | 2,9 | 4,7 | 7,9 | **11,8 → 10,6** | 12,6 | **21,0** | 4,8 |
| Briançon (05023, montagne) | les trois | 0,0 | 0,0 | 0,0 | 0,0 | **0,0** | ≤ 0,1 | **≤ 0,6** | 0 |
| Chamonix (74056, montagne) | les trois | 0,0 | 0,0 | 0,0 | 0,0 | **0,0** | 0,0 | **0,0** | 0 |
| Paris (75101, contrôle) | Jours ≥ 35 °C | 0,9 | 0,8 | 1,2 | 1,4 | **2,2** | 2,4 | **4,4** | 2,0 |
| | Jours ≥ 30 °C | 10,1 | 9,1 | 10,7 | 10,4 | **12,6** | 15,9 | **22,8** | 6,1 |
| | Nuits tropicales | 8,7 | 8,3 | 10,8 | 11,0 | **14,2 → 13,6** | 17,6 | **26,3** | 7,2 |

*Nuits SAFRAN : colonnes 1976–2005, 1991–2020, 2006–2025 et série annuelle comptées `≥ 20` (chaîne exploratoire) ; colonne 2016–2025 : ancienne valeur → valeur au sens strict `> 20` servie par le produit.* *Sources : DRIAS-TRACC (Météo-France, 17 modèles, médiane) ; SAFRAN SIM2 quotidienne (Météo-France), maille DRIAS de la commune. La colonne σ donne l'écart-type interannuel 1991–2020 au point. La dispersion des 17 modèles sur la référence reste faible : q10–q90 de 5,0–5,8 nuits à Rochefort, 31,1–33,1 à Nîmes.*

**Séries annuelles 2016–2025 au point** (nuits tropicales) :
- Bordeaux : 13, 20, 30, 21, 19, 12, **37**, 32, 16, 30.
- Nîmes : 45, 53, 52, 57, 51, 47, **79**, 54, 52, 52.
- Rochefort : 7, 13, 15, 12, 9, 10, **24**, 16, 8, 17.

Une seule année peut doubler la moyenne : la période doit rester nommée.

### Écarts et incohérences relevés

**1. Bordeaux : le climat récent dépasse déjà la projection « 2030 ».** C'est le cas pour les nuits (23,0 contre 18,5) et les jours ≥ 35 °C (4,8 contre 4,6). Ce n'est pas une incohérence : 2016–2025 se situe au niveau de réchauffement « 2030 », et Bordeaux est au-dessus de la médiane des modèles. C'est un résultat, pas un bug, mais il interdit de présenter « 2030 » comme « dans quelques années ».

**2. Maille contre thermomètre : l'écart est grand, et dans les deux sens.** Moyennes 2016–2025 sur les étés complets, stations Météo-France à moins de 20 km :

| Commune | Station (altitude, distance) | Jours ≥ 35 °C station / maille | Jours ≥ 30 °C station / maille | Nuits ≥ 20 °C station / maille |
|---|---|---|---|---|
| Rochefort | Saint-Agnant (18 m, 6 km) | 4,2 / 1,5 | 22,8 / 10,8 | 4,5 / 13,1 |
| La Rochelle | La Rochelle–Île de Ré (20 m, 2 km) | 2,6 / 1,5 | 16,6 / 10,2 | 6,8 / 12,1 |
| Nantes | Nantes-Bouguenais (26 m, 10 km) | 3,2 / 1,2 | 18,8 / 11,2 | 2,9 / 3,4 |
| Bordeaux | Bordeaux-Paulin, en ville (10 m, 1 km) | 11,4 / 4,8 | 44,1 / 25,3 | 17,3 / 23,0 |
| Bordeaux | Mérignac (47 m, 9 km) | 8,1 / 4,8 | 35,1 / 25,3 | 10,0 / 23,0 |
| Nîmes | Courbessac (59 m, 6 km) | **22,2 / 8,0** | 77,7 / 53,9 | 38,0 / 54,2 |
| Marciac | Mirande (184 m, 20 km) | 11,4 / 3,1 | 45,8 / 23,1 | 5,2 / 11,8 |
| Briançon | Villar-Saint-Pancrace (1 310 m, 2 km) | 0,5 / 0,0 | **22,8 / 0,0** | 0,0 / 0,0 |
| Chamonix | Chamonix (1 042 m, 4 km) | 0,7 / 0,0 | **16,3 / 0,0** | 0,0 / 0,0 |
| Paris | Montsouris (75 m, 4 km) | 3,5 / 2,2 | 19,8 / 12,6 | 9,7 / 14,2 |

- **Journées chaudes : la maille en compte deux à trois fois moins que la station.** SAFRAN lisse les pointes de l'après-midi : maximum horaire contre maximum instantané, et moyenne sur 8 km.
- **Nuits tropicales : le littoral et le Midi en comptent plus sur la maille.** Exception : le centre de Bordeaux, où l'îlot de chaleur urbain inverse l'écart.
- **Évolutions relatives concordantes.** Exemple sur Nîmes, de 1976–2005 à 2016–2025 : ×3,8 pour la station comme pour la maille en jours ≥ 35 °C ; ×2,1 pour la station et ×1,9 pour la maille en nuits.
- **Ce constat vaut déjà pour les chiffres DRIAS affichés aujourd'hui.** Les projections sont calibrées sur la même maille. Il justifie la limite écrite (« moyennes de secteur, pas les relevés d'un thermomètre »).

**3. Les vallées de montagne : la maille ne décrit pas la ville.** *(Corrigé en partie le 08/11 : réserve au premier niveau quand une station du secteur le démontre, voir « Corrections après contre-revue », § 3.)* Briançon et Chamonix lisent 0 partout. Pourtant, les stations de vallée comptent 16 à 23 jours ≥ 30 °C par an sur 2016–2025. La bascule « Et au-dessus de 30 °C ? » affiche donc « 0 jour par an » à Briançon pour 2050 (0,6), alors que la vallée en vit déjà plus de vingt. Ce défaut est **préexistant**, côté DRIAS. Le prototype ne l'aggrave pas, mais ne le corrige pas non plus. **Suite proposée :** un ticket « altitude de maille contre altitude habitée » pour les communes de relief, avec la piste d'un repli ou d'une mention lorsque l'altitude de la mairie s'écarte de celle de la maille. Les fichiers ouverts ne donnent pas l'altitude des mailles : il faudrait la croiser avec un modèle numérique de terrain.

**4. Comparaison aux publications officielles.** Les stations de contrôle ci-dessus sont celles des fiches climatologiques Météo-France. Sur 1991–2020, Nîmes-Courbessac compte 10,4 jours ≥ 35 °C et 23,7 nuits ≥ 20 °C par an (nos agrégats des données quotidiennes publiques). Ces valeurs sont à comparer aux normales publiées : nous ne les avons pas relues dans le PDF officiel. Les comptes sont faits sur les seuls étés complets (mai à septembre, ≥ 150 jours valides), en ajoutant les rares occurrences hors de cette saison.

---

## D. Proposition produit (implémentée dans la PR)

Le grand chiffre reste **2050**. La comparaison du premier niveau devient le **climat récent**, avec ses années. La référence 1976–2005 passe dans « Comment lire ce résultat ? ».

**Rochefort, avant :**

> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre moins d'une journée sur 1976-2005
> **24** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 5 nuits sur 1976-2005

**Rochefort, après :**

> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)
> **24** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 13 nuits dans le climat récent (2016–2025)
>
> *à l'échelle de la commune · DRIAS · Météo-France, horizon 2050 (+2,7 °C en France) · climat récent 2016–2025 : réanalyse SAFRAN · Météo-France*

**Dans « Comment lire ce résultat ? » :**

> Deux mesures du climat de la commune : les journées où il fait plus de 35 °C, et les nuits tropicales, où la température ne descend pas sous 20 °C. Le grand chiffre est une projection pour 2050, quand la France se serait réchauffée d'environ 2,7 °C. Il est comparé au climat récent : la moyenne des années 2016 à 2025.
>
> Les deux viennent de Météo-France et sont calculés sur la même grille de 8 km : le climat récent est reconstitué à partir des observations (réanalyse SAFRAN), et les projections sont ajustées sur ces mêmes données. Ce sont des moyennes de secteur, pas les relevés d'un thermomètre : selon la ville ou le relief, les valeurs locales peuvent s'en écarter. Une année isolée peut aussi s'éloigner nettement de la moyenne.
>
> Référence historique des projections (DRIAS) : sur 1976-2005, moins d'une journée au-dessus de 35 °C et 5 nuits tropicales par an.

La bascule « Et au-dessus de 30 °C ? » suit la même règle : « 18 jours, dont 3 au-dessus de 35 °C ; contre 11 jours dans le climat récent (2016–2025) ».

Les autres communes pilotes (sorties réelles du code) sont en annexe.

---

## E. Implémentation

### E.1 Fichiers

| Fichier | Rôle |
|---|---|
| `scripts/climat-recent/agreger_safran.py` *(nouveau)* | Lit en flux les fichiers SIM2 de la période. Apparie chaque point DRIAS à sa maille SAFRAN et **échoue** au-delà de 0,002°. Vérifie années complètes et absence de valeurs manquantes. Écrit les comptes **annuels** par point, avec l'URL, la date `Last-Modified` et le SHA-256 de chaque fichier source. |
| `data/climat-recent/safran-2016-2025.json` *(nouveau, 0,95 Mo, versionné)* | Sortie du script ; non empaquetée. |
| `scripts/build-climat-recent.mjs` *(nouveau)* | Moyenne de la période par commune. Jointure par **les fonctions mêmes de DRIAS** (`loadCommunes`, `parseDriasFile`, `buildNearestPointIndex`). Mode `--ecrire`, sinon **vérification** octet pour octet. |
| `src/data/climat-recent-communes.json` *(nouveau, 1,1 Mo, empaqueté ; schéma 2 depuis le 08/11)* | 34 788 communes × [jours ≥ 35, ≥ 30, nuits > 20], stations témoins de 6 517 communes, empreintes des deux sources. |
| `data/climat-recent/safran-1976-2005.json`, `comparabilite-1976-2005.json` *(08/11)* | Comptes SAFRAN de la période de référence ; comparaison à DRIAS recalculable (`scripts/climat-recent/comparer-drias.mjs`). |
| `scripts/climat-recent/stations_temoins.py`, `data/climat-recent/stations-2016-2025.json` *(08/11)* | Stations Météo-France de métropole sur 2016–2025, mêmes définitions : témoins de la maille. |
| `src/lib/accueil/climat-recent.ts` *(nouveau, pur)* | Lecture et contrôle du fichier ; outre-mer et absence → `null`, jamais 0. |
| `src/lib/accueil/donnees-legeres.ts` | `climatRecentLeger(insee)`, même repli Paris, Lyon, Marseille que DRIAS. |
| `src/lib/accueil/lecture-accueil.ts` | `SourcesLecture.climatRecent` ; `entreesChaleur` le transmet **après** le calcul du verdict, qui ne le lit pas. |
| `src/lib/accueil/pastilles.ts` | `EntreesChaleur.recent`, comparaison affichée, sources, méthode, base des qualificatifs (`baseComparaison`). |
| `package.json` | `prebuild` vérifie que le fichier dérivé correspond à sa source. |
| `src/lib/accueil/climat-recent.test.ts` *(nouveau, 13 tests)* | Voir E.2. |

**Non modifiés** : `climat-facts.ts` (seuils, `buildClimatFacts`, `classifyClimateComfort`), le moteur, le comparateur, les dossiers Territoire et Logement, `recits.ts` (cartes de l'aperçu Territoire), `faits.ts` (contexte /qna), l'outre-mer, les projections DRIAS et leur extrait.

### E.2 Tests

- **Le fichier** : produit depuis la source versionnée (empreinte) ; mêmes 34 788 communes que l'extrait DRIAS ; valeurs finies et positives, avec ≥ 35 °C ⊂ ≥ 30 °C ; valeurs des pilotes.
- **Point d'arrêt scientifique** : le climat récent ne dépasse 2050 que sur moins de 2 % des communes. Si une mise à jour inverse ce constat, la juxtaposition est réexaminée avant d'être servie.
- **Non-régression** : sur les **34 788 communes**, le verdict du moteur et le signal de la pastille sont identiques avec et sans climat récent.
- **Ce que le texte raconte** : comparaison, période et sources exactes (Rochefort) ; 1976–2005 absente du premier niveau mais présente dans la méthode ; jamais « aujourd'hui » ni « actuel » ; les qualificatifs mesurés contre la période affichée ; repli à l'identique sans climat récent ; accord « moins d'une nuit tropicale ».
- **Contrôle croisé hors dépôt** : le script du dépôt et la chaîne exploratoire indépendante (1976–2025) produisent des séries identiques sur les 8 981 points × 3 indicateurs × 10 ans.

### E.3 Coûts

| | |
|---|---|
| Traitement | ~7 min par mise à jour (10 fichiers de ~140 Mo lus en flux, rien stocké), puis 2 s de jointure |
| Stockage dépôt | +0,95 Mo (`data/`) et +0,77 Mo (`src/data/`) |
| Accueil | +0,77 Mo dans le paquet de la fonction (à côté des 4,6 et 2,7 Mo existants) ; **aucune requête externe**, aucune lecture Supabase |
| Actualisation | Une fois par an, quand l'année N est complète et stabilisée : script Python, `--ecrire`, revue du diff, PR |

### E.4 Arbitrages demandés

1. **La phrase sous la pastille change pour 10 962 communes sur 34 788, le signal pour aucune.** Ses qualificatifs (« augmenteraient », « plus fréquentes », « beaucoup plus fréquentes », c'est-à-dire au moins doublées) se mesuraient contre 1976–2005. Ils se mesurent désormais contre la période **affichée**. Afficher « contre 13 nuits (2016–2025) » à côté de « deviendraient beaucoup plus fréquentes », calculé contre 5 nuits, serait le piège décrit dans AGENTS.md : un texte qui raconte une comparaison qu'il n'affiche pas. Effet mesuré :

   | Avant → après | Communes |
   |---|---|
   | « … mais les nuits tropicales deviendraient beaucoup plus fréquentes » → « … seraient plus fréquentes » | 9 858 |
   | « … beaucoup plus fréquentes » → « Les journées au-dessus de 35 °C comme les nuits tropicales resteraient peu nombreuses » | 1 103 |
   | « Les fortes chaleurs augmenteraient de jour comme de nuit » → « … seraient fréquentes de jour comme de nuit » | 1 |

   C'est plus juste, mais moins alarmant. Si tu préfères garder l'ampleur depuis 1976–2005, il faut alors **dire** cette base dans la phrase (« … beaucoup plus fréquentes qu'en 1976-2005 »), ce qui ramène la période ancienne au premier niveau. La convention « au moins doublé » restait d'ailleurs marquée « à valider » depuis le 15/10.

2. **Mise à jour annuelle glissante ou période figée.** En glissant d'un an (2015–2024 → 2016–2025), 90 % des points de grille bougent d'une nuit tropicale au plus, le maximum de 5 nuits. Je recommande un glissement annuel, période toujours affichée, après stabilisation des fichiers (les quatre dernières années sont révisables).

### E.5 Conséquences pour les autres modules (non traitées)

- **Aperçu Territoire et cartes de l'accueil** (`recits.ts`, onglet « 1976–2005 » de `HorizonSwitch`) : la même donnée pourrait remplacer l'onglet « 1976–2005 » par « Climat récent (2016–2025) ». C'est un chantier distinct (FUT-103).
- **/qna** (`faits.ts`) : le contexte envoyé au modèle ne contient pas le climat récent. La note « aucune n'est une valeur actuelle » reste vraie.
- **Dossier Territoire** : il pourrait remplacer ERA5 (température annuelle seule, base 1961–1990) par SAFRAN, sur la même base et la même maille que les projections. Ce serait aussi l'occasion de corriger la juxtaposition 1961–1990 / 1976–2005.
- **Autres indicateurs** : température moyenne annuelle, d'hiver et d'été extensibles (biais ≤ 0,4 °C). Jours de sol sec exclus (biais de 15 jours). Indice forêt-météo et pluies non évalués.

---

## F. Piste éditoriale : un article « ce que les relevés disent déjà des projections », ville par ville

Le matériau est là, et le sujet est fort. Garde-fous à poser **avant** d'écrire :

- **Comparer en jours ou en nuits, pas en pourcentage, sur les petits comptes.** Passer de 0,3 à 1,5 jour à 35 °C fait « +400 % » et ne veut rien dire. Le pourcentage n'est lisible qu'au-delà de ~10 occurrences par an. Alternative lisible : « le chemin déjà parcouru entre 1976–2005 et 2050 ». Rochefort a par exemple parcouru 43 % du chemin en nuits tropicales.
- **Toujours sur la même maille.** Pour « relevé contre projection », la seule comparaison honnête est SAFRAN contre DRIAS. Une station contre DRIAS mêle deux écarts (maille et changement). Elle donnerait par exemple « Nîmes vit déjà plus de jours à 35 °C que DRIAS n'en projette pour 2050 », ce qui est faux sur la même maille.
- **L'écart station / maille est lui-même un sujet** (C.2). Les chiffres d'une projection décrivent un secteur de 8 km. Sous abri en ville, on en mesure souvent deux à trois fois plus pour les journées chaudes.
- **Un encadré « une année n'est pas un climat »**, avec 2022.
- **La question ouverte de B** (les extrêmes progressent-ils plus vite que les modèles ?) relève d'une relecture par un climatologue avant publication.

---

## Annexe — les lectures réelles des communes pilotes (sorties du code de la PR)

**La Rochelle** — À surveiller
> **3** jours par an — au-dessus de 35 °C à l'horizon 2050, contre 2 jours dans le climat récent (2016–2025)
> **23** nuits tropicales — par an à l'horizon 2050, sans descendre sous 20 °C, contre 12 nuits dans le climat récent (2016–2025)
> *Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales seraient plus fréquentes.* (avant : « … deviendraient beaucoup plus fréquentes », voir E.4)

**Nantes** — À surveiller
> **4** jours par an, contre 1 jour dans le climat récent (2016–2025) · **11** nuits tropicales, contre 3 nuits
> *Les journées au-dessus de 35 °C resteraient peu nombreuses, mais les nuits tropicales deviendraient beaucoup plus fréquentes.* (inchangée)

**Bordeaux** — Plutôt défavorable
> **6** jours par an, contre 5 jours dans le climat récent (2016–2025) · **28** nuits tropicales, contre 23 nuits
> *Les nuits tropicales deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*
>
> 6 contre 5 jours : un écart sous le plancher d'interprétation (B). C'est pourquoi la phrase ne qualifie aucune hausse des jours à 35 °C et que l'interface ne soustrait rien.

**Nîmes** — Plutôt défavorable
> **14** jours par an, contre 8 jours dans le climat récent (2016–2025) · **69** nuits tropicales, contre 54 nuits
> *Les fortes chaleurs augmenteraient de jour comme de nuit. Sur ces deux aspects, Nîmes correspond mal à votre priorité.*

**Marciac** (rurale) — Plutôt défavorable
> **8** jours par an, contre 3 jours dans le climat récent (2016–2025) · **21** nuits tropicales, contre 12 nuits
> *Les journées au-dessus de 35 °C deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*

**Briançon** (montagne) — Plutôt favorable
> **moins de 1** jour par an, contre aucune journée dans le climat récent (2016–2025) · **moins de 1** nuit tropicale, contre aucune nuit
> *Les fortes chaleurs resteraient exceptionnelles ici, même en 2050.* La limite de C.3 s'applique : c'est la maille, pas la vallée.

**Paris** — Plutôt défavorable
> **4** jours par an, contre 2 jours dans le climat récent (2016–2025) · **26** nuits tropicales, contre 14 nuits
> *Les nuits tropicales deviendraient particulièrement fréquentes, ce qui correspond mal à votre souhait d'éviter les fortes chaleurs.*

Les signaux sont identiques à ceux d'avant FUT-170 pour les 34 788 communes (test de non-régression).

## Annexe — reproduire

```sh
# Climat récent du produit (dépôt)
python3 -P scripts/climat-recent/agreger_safran.py 2016 2025   # ~7 min, flux
python3 -P scripts/climat-recent/stations_temoins.py           # ~15 min, flux, 96 départements
# Comparabilité historique (08/11), depuis le dépôt seul
python3 -P scripts/climat-recent/agreger_safran.py 1976 2005   # ~20 min, flux
node scripts/climat-recent/comparer-drias.mjs --ecrire
node scripts/build-climat-recent.mjs --ecrire                  # jointure DRIAS
node scripts/build-climat-recent.mjs                           # vérification (prebuild)
node --test src/lib/accueil/climat-recent.test.ts
```

L'analyse exploratoire (1976–2025, comparabilité nationale, stations) vit hors du dépôt, sous `~/Documents/futuree-climat-recent/` :
- `scripts/agreger_sim2.py` : comptes mensuels, 50 années ;
- `scripts/drias_par_point.py` : références modèle par modèle ;
- `scripts/analyse.py` et `scripts/analyse_suite.py` ;
- `scripts/stations.py` et `scripts/stations_moyennes.py` ;
- les résultats dans `sorties/analyse/`.

Sources :
- [SIM quotidienne, Météo-France](https://www.data.gouv.fr/datasets/donnees-changement-climatique-sim-quotidienne) ;
- [données quotidiennes des stations](https://www.data.gouv.fr/datasets/donnees-climatologiques-de-base-quotidiennes) ;
- [fiche DRIAS-2020 (ADAMONT, grille SAFRAN)](https://drias-prod.meteo.fr/serveur/simulations_climatiques/Documentations_Donnees/Fiches_techniques_Atmospherique/5-DRIAS-2020/Doc_database_DRIAS-2020_CNRM-CM5_RACMO22E.pdf) ;
- [Vidal et al. 2010, réanalyse SAFRAN](https://www.drias-climat.fr/document/vidal2010.pdf) ;
- [Vautard et al. 2023](https://www.nature.com/articles/s41467-023-42143-3) ;
- [DREAL Centre-Val de Loire, correspondance des niveaux de réchauffement](https://www.centre-val-de-loire.developpement-durable.gouv.fr/IMG/pdf/une_trajectoire_d_adaptation_pour_faire_face_au_changement_climatique.pdf).
