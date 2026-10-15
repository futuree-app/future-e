# FUT-50 · « Connaître les risques naturels » : de l'inventaire à une lecture

15 octobre 2026 · branche `feat/fut-50-accueil-decision` (tête de départ `b0d4169f`, changements récents préservés) · prototype seulement.

**Bibliothèque de production** : `src/lib/georisques.ts` n'est pas modifiée.

## 1. Cause de l'inventaire excessif

- **La source.** GASPAR (Géorisques, `/api/v1/gaspar/risques?code_insee=…`), le recensement des risques par commune tenu par l'État. Le grain est la commune ; pour Paris, Lyon et Marseille, c'est la ville entière (`codeGaspar`).
- **Ce que la source fournit.** Chaque ligne porte un **code hiérarchique** `num_risque` :
  - le **premier chiffre** donne la nature : `1` naturel, `2` technologique, `3` minier ;
  - **deux chiffres** désignent une famille (`11` Inondation) ;
  - **trois chiffres** désignent une déclinaison de cette famille (`112` « Par une crue à débordement lent de cours d'eau »).
- **Ce que le code faisait.** `getGeorisquesSummary` ne garde que `libelle_risque_long` et jette le code. L'accueil recevait donc 23 libellés à plat pour Nantes : familles, déclinaisons, et risques technologiques (industriel, barrage, transport de marchandises dangereuses, engins de guerre) sous le titre « risques naturels ».
- **La règle de nature** a été vérifiée sur Nantes, La Rochelle, Bordeaux, Paris, Lyon, Marseille (`31` / `311` minier), Brest (`22` nucléaire), Briançon, Saint-Denis de La Réunion et une trentaine de communes rurales.
- **Absence de données.** Une commune absente de la base répond « 0 résultat », exactement comme un code inexistant ; deux vraies communes en témoignent, 02813 et 80589. La source ne permet donc pas de distinguer « aucun risque » de « non renseigné ». Une absence de réponse (erreur, délai, réseau) est un troisième cas.
  - L'ancien code confondait les trois en « L'État ne recense aucun risque… » ; seule la panne était traitée à part.

## 2. Règles retenues

**Classement par le code, jamais par le libellé.** C'est la classification de la source, pas une catégorisation de futur•e. Un préfixe inconnu reste affiché dans « Autres risques recensés », sans être deviné.

**Une déclinaison n'est jamais un risque de plus** : elle se range sous sa famille. Une déclinaison arrivée sans sa famille devient sa propre ligne, pour que rien ne se perde.

**Familles naturelles dans les mots du lecteur.** C'est un renommage des familles de la source, même code et même périmètre : 11 inondation, 12 mouvements de terrain, 13 séisme, 14 avalanche, 15 éruption volcanique, 16 feux de forêt, 17 phénomènes météorologiques (« Phénomène lié à l'atmosphère »), 18 radon.
- J'ai écarté les groupes indicatifs du brief (« eau », « sols », « météo », « autres »). Les familles de la source les recouvrent déjà, plus fidèlement.

**Pas de hiérarchie.** Les familles sont citées dans l'ordre des codes. Aucune gravité, aucun score, aucune mise en avant.

**Risques technologiques et miniers** : absents du constat, présentés dans le détail sous leur propre titre, avec une note : « Recensés par la même source, ils ne relèvent pas des risques naturels. »

| Situation | Constat (toujours visible) | Pastille et phrase |
| --- | --- | --- |
| Au moins deux familles naturelles | Plusieurs risques naturels sont recensés dans la commune : … | **À savoir** · Un risque recensé dans la commune ne concerne pas forcément chaque adresse. |
| Une famille naturelle | Un risque naturel est recensé dans la commune : … | (idem) |
| Seulement technologiques ou miniers | Aucun risque naturel n'est recensé dans la commune ; d'autres risques le sont, détaillés ci-dessous. | **À savoir** · Une absence de recensement ne garantit pas l'absence de danger. |
| La base ne renvoie rien | La base nationale des risques ne recense rien pour cette commune. | (idem) ; pas de détail à ouvrir |
| La source ne répond pas | aucun constat | **Donnée indisponible** · La base nationale des risques n'a pas répondu : nous ne pouvons rien en dire, ni dans un sens ni dans l'autre. |

**À vérifier**, dans tous les cas : « À une adresse précise, vérifiez si elle se trouve dans une zone concernée, quelles règles s'y appliquent et ce que l'on sait du terrain et du bâtiment. Être hors zone ne met pas à l'abri de tout risque. »

Le bouton « Examiner une adresse à … » est inchangé.

## 3. Nantes, avant / après

**Avant** (`c11-avant-risques-nantes-*.jpg`, 1 021 px de haut à 1440, 1 206 px à 390) :

> L'État recense pour la commune : inondation, par une crue à débordement lent de cours d'eau, par ruissellement et coulée de boue, par remontées de nappes naturelles, mouvement de terrain, affaissements et effondrements d'origine anthropique (anciennes carrières souterraines, hors mines), affaissements et effondrements d'origine naturelle (cavités souterraines), eboulement ou chutes de pierres et de blocs, glissement de terrain, avancée dunaire, tassements différentiels, séisme, phénomène lié à l'atmosphère, tempête et grains (vent), foudre, grêle, neige et pluies verglaçantes, radon, risque industriel, rupture de barrage, transport de marchandises dangereuses et engins de guerre.
>
> **À savoir** · Ce recensement est actuel et porte sur la commune entière : il ne dit pas quelle partie est concernée, ni comment le risque évoluera.
>
> À vérifier · L'état des risques précise ce qu'il en est à une adresse donnée : zone réglementée, sol, sinistres reconnus.

**Après** (`c11-apres-risques-nantes-*.jpg`, 779 px à 1440, 859 px à 390) :

> Plusieurs risques naturels sont recensés dans la commune : inondation, mouvements de terrain, séisme, phénomènes météorologiques et radon.
>
> ＋ Voir les risques recensés
>
> **À savoir** · Un risque recensé dans la commune ne concerne pas forcément chaque adresse.
>
> À vérifier · À une adresse précise, vérifiez si elle se trouve dans une zone concernée, quelles règles s'y appliquent et ce que l'on sait du terrain et du bâtiment. Être hors zone ne met pas à l'abri de tout risque.

**Détail ouvert** (`c11-apres-risques-nantes-*-detail.jpg`) :
- **Risques naturels** :
  - Inondation : par une crue à débordement lent de cours d'eau ; par ruissellement et coulée de boue ; par remontées de nappes naturelles
  - Mouvements de terrain : six déclinaisons, dont cavités souterraines, éboulement, glissement de terrain et tassements différentiels
  - Séisme
  - Phénomènes météorologiques : tempête et grains (vent) ; foudre ; grêle ; neige et pluies verglaçantes
  - Radon
- **Risques technologiques**, avec leur note : risque industriel ; rupture de barrage ; transport de marchandises dangereuses ; engins de guerre.

Aucune des 23 lignes de la source ne se perd, et aucune n'est comptée deux fois. Un test le vérifie sur Nantes, La Rochelle et Marseille.

## 4. Les autres cas

Réponses réelles de GASPAR, vues à travers la route du prototype :

| Commune | Constat | Détail |
| --- | --- | --- |
| La Rochelle | inondation, mouvements de terrain, séisme et phénomènes météorologiques | inondation : *par submersion marine* ; un technologique |
| Ageville (52001), peu de risques | inondation et phénomènes météorologiques | aucun technologique |
| 60358, technologique seul | Aucun risque naturel n'est recensé… ; d'autres risques le sont | risque industriel |
| Neuilly-le-Dien (80589), base vide | La base nationale des risques ne recense rien pour cette commune. | aucun |
| Marseille, naturel, technologique et minier | inondation, mouvements de terrain, séisme et feux de forêt | trois groupes, dont « Risques miniers » |
| Source muette (test) | aucun constat | « Donnée indisponible » |

Le titre « Connaître les risques naturels » correspond désormais au constat : celui-ci ne nomme que des familles de code 1x. Un test vérifie l'absence de termes technologiques dans le constat de Nantes.

## 5. Vérifications

**Tests** :
- tests FUT-50 : 38/38, dont 5 nouveaux sur les risques, à partir des réponses GASPAR réelles ;
- suite complète : 2 593/2 593 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi ;
- en production, le prototype et sa route renvoient 404.

**Navigateur (Chromium)** :
- **Clavier** : à 1440, 390 et 360 px (Nantes) et à 1440 et 390 px (La Rochelle), le résumé « Voir les risques recensés » s'atteint par Tab, avec un contour visible. Entrée l'ouvre, Espace le referme.
- **Débordement** : 0 px.

**Hauteur du panneau** :

| | 1440 px | 390 px | 360 px |
| --- | --- | --- | --- |
| Nantes avant | 1 021 | 1 206 | – |
| Nantes replié | 779 | 859 | 937 |
| La Rochelle replié | 779 | 864 | – |

**Non testé** : Safari, Firefox, un vrai lecteur d'écran.

## 6. Limites

- **« Aucun risque » et « non renseigné » restent indiscernables.** La source ne les distingue pas ; le texte dit seulement que la base ne recense rien.
- **La nature des codes est relevée sur les réponses, pas sur une nomenclature officielle.** Je l'ai vérifiée sur une quarantaine de communes. Un code nouveau ou inattendu tombe dans « Autres risques recensés », visible, plutôt que d'être mal classé. La nomenclature GASPAR publiée reste à consulter pour figer la table.
- **Le constat ne dit pas la déclinaison.** À La Rochelle, « inondation » recouvre la seule submersion marine, qui n'apparaît que dans le détail. C'est le prix de la lecture par familles.
- **La route du prototype interroge GASPAR directement**, parce que la bibliothèque de production jette le code.
  - Pour la production, il faudra ajouter le code au résumé de `getGeorisquesSummary`. C'est un ajout sans effet sur ses usages actuels, mais hors de cette passe.
- **Géorisques ne répond qu'aux adresses IP françaises.** C'est un piège connu, déjà résolu en production.

---

## Finition (15/10, soir) : précision, « À vérifier », codes inattendus, réponses incomplètes

### Référence de la nomenclature

**Fichier consulté** : `ddrm_risq_gaspar_2026-10-05.csv`, dans l'archive officielle GASPAR (`https://files.georisques.fr/GASPAR/gaspar.zip`, mise à jour du 5 octobre 2026). Cette archive est référencée par data.gouv.fr (« Base nationale de Gestion ASsistée des Procédures Administratives relatives aux Risques (GASPAR) ») et documentée sur georisques.gouv.fr (« Base GASPAR »).
- Colonnes : `cod_commune`, `lib_commune`, `lib_risque`, `num_risque`.
- Couverture : 31 733 communes.

**Table officielle** (intitulés exacts) :

| Nature | Familles | Déclinaisons |
| --- | --- | --- |
| **Naturels (1x)** | 11 Inondation · 12 Mouvement de terrain · 13 Séisme · 14 Avalanche · 15 Eruption volcanique · 16 Feu de forêt · 17 Phénomène lié à l'atmosphère · 18 Radon | 112 à 117 (inondation, toutes « Par … ») · 121 à 127 (mouvements de terrain) · 171 à 176 (atmosphère) |
| **Technologiques (2x)** | 21 Risque industriel · 22 Nucléaire · 23 Rupture de barrage · 24 Transport de marchandises dangereuses · 25 Engins de guerre | 211 à 214 |
| **Miniers (3x)** | 31 Affaissement minier · 32 Inondations de terrains miniers · 33 Emissions en surface de gaz de mine · 34 Echauffement des terrains de dépôts | 311 à 317, 321, 322 |
| **Hors hiérarchie** | `AUTRE` « Autre risque », 27 communes (Oise, Calvados) | – |

**Correspondance avec l'API** :
- Codes et libellés identiques à toutes les réponses vues (Nantes, La Rochelle, Lyon, Marseille, Brest, etc.).
- Une seule différence : l'API écrit **`AUT`** là où le fichier écrit `AUTRE` (vérifié sur Abancourt, 60001).
- Aucune déclinaison sans famille parente dans le fichier.
- La règle de nature (premier chiffre) est donc confirmée par la nomenclature publiée, plus seulement par observation. Au passage, « 32 Inondations de terrains miniers » est un risque minier, pas une inondation naturelle.

### Précision dans le constat : la règle retenue

**Règle** : une famille se précise dans le constat quand elle a **une seule déclinaison** et que cette déclinaison est une **manière** dont la famille se produit. Dans la nomenclature, ce sont les déclinaisons d'inondation, toutes rédigées « Par … » (112 à 117). Elles qualifient la famille d'elles-mêmes : « inondation par submersion marine ».

Formes courtes, fidèles au libellé officiel :

| Code | Libellé officiel | Forme courte |
| --- | --- | --- |
| 112 | Par une crue à débordement lent de cours d'eau | par crue lente |
| 113 | Par une crue torrentielle ou à montée rapide de cours d'eau | par crue rapide |
| 114 | Par ruissellement et coulée de boue | par ruissellement |
| 115 | Par lave torrentielle (torrent et talweg) | par lave torrentielle |
| 116 | Par remontées de nappes naturelles | par remontée de nappe |
| 117 | Par submersion marine | par submersion marine |

**Alternative écartée, mesurée sur les 31 733 communes** :

| Règle | Longueur moyenne de la liste | 95e centile | Maximum | Précisions par commune |
| --- | --- | --- | --- | --- |
| Sans précision (avant) | 37 caractères | 76 | 105 | 0 |
| **Toute famille à une seule déclinaison** | 51 (+40 %) | 109 | 150 | jusqu'à 3 |
| **Règle retenue** | 41 (+11 %) | 85 | 111 | au plus 1 (10 115 communes) |

Avec la règle écartée, La Rochelle aurait donné : « inondation (submersion marine), mouvements de terrain (tassements différentiels), séisme, phénomènes météorologiques (tempête) ». C'est une liste dans la liste, avec du jargon.

**Ce que la règle ne fait pas** :
- elle ne précise pas une famille à plusieurs déclinaisons (Nantes, Attigny), qui restent dans le détail ;
- elle ne dit rien de la gravité ;
- elle ne masque aucune famille.

**Limite assumée** : « inondation par submersion marine » reprend la seule déclinaison que la source recense. GASPAR ne garantit pas que cette liste de déclinaisons soit exhaustive.

| Commune | Constat |
| --- | --- |
| La Rochelle | Plusieurs risques naturels sont recensés dans la commune : **inondation par submersion marine**, mouvements de terrain, séisme et phénomènes météorologiques. |
| Nantes (3 déclinaisons d'inondation) | Plusieurs risques naturels sont recensés dans la commune : inondation, mouvements de terrain, séisme, phénomènes météorologiques et radon. |
| Attigny (une famille, deux déclinaisons) | Un risque naturel est recensé dans la commune : inondation. |
| Ageville (peu de risques) | Plusieurs risques naturels sont recensés dans la commune : inondation par crue lente et phénomènes météorologiques. |
| Le Crotoy | Un risque naturel est recensé dans la commune : inondation par submersion marine. |
| Brest | … inondation par submersion marine, mouvements de terrain, séisme et radon. |

**La Rochelle, avant / après** :
- **Avant** : « … inondation, mouvements de terrain, séisme et phénomènes météorologiques. » La submersion marine n'apparaissait qu'en ouvrant le détail.
- **Après** : « … inondation par submersion marine, mouvements de terrain, séisme et phénomènes météorologiques. »

### « À vérifier »

**Avant** : « À une adresse précise, vérifiez si elle se trouve dans une zone concernée, quelles règles s'y appliquent et ce que l'on sait du terrain et du bâtiment. Être hors zone ne met pas à l'abri de tout risque. »

**Après** : « À une adresse précise, vérifiez si elle se trouve dans une zone réglementée, les règles qui s'y appliquent et la nature du sol. »

**Ce que le dossier d'adresse fournit au point**, d'après `GeorisquesAddressSummary` et `GeorisquesParcelSummary` :
- le zonage et les règles d'un plan de prévention, quand il en existe un (`pprn`, `regulatoryPlans`) ;
- les argiles (`rga`) et la zone sismique (`seismic`).

Le bâtiment n'est plus promis dans cette ligne. La limite « Être hors d'une zone réglementée ne met pas à l'abri de tout risque. » reste accessible, en fin de détail replié.

### Codes inattendus : plus rien n'est ignoré en silence

**Le défaut corrigé** : `/^\d{2,}$/` écartait tout code non numérique.
- Pour Abancourt (60001), dont le seul risque est « AUT · Autre risque », l'accueil affichait « La base nationale des risques ne recense rien ».

**Nouveau traitement** :

| Entrée | Traitement |
| --- | --- |
| `AUT`, code vide, code d'un chiffre, code altéré, avec un libellé | groupe « Autres risques recensés », avec le code d'origine (`?` si vide), jamais classée naturelle |
| Seul risque non classé | constat : « La source recense pour la commune un risque sans en préciser la nature : il est détaillé ci-dessous. » ; on ne dit pas « aucun risque naturel » |
| Ligne sans libellé | non affichée (rien de lisible), mais comptée et signalée en fin de détail |
| Uniquement des lignes sans libellé | constat : « … sans libellé lisible : nous ne pouvons pas les nommer. », jamais « ne recense rien » |
| Déclinaison sans famille (possible dans l'API, absente du fichier) | son code nomme la famille (`117` → inondation), la déclinaison reste dessous ; sans famille naturelle connue, elle devient sa propre ligne |

### Réponse vide, réponse incomplète, panne

La fonction pure `interpreterReponseGaspar` est désormais testée sans réseau.

| Réponse de l'API | Lecture |
| --- | --- |
| `data: []` (commune absente de la base) | réponse **valide** sans recensement → « ne recense rien » |
| `risques_detail: []` | réponse valide sans recensement |
| `risques_detail` absent, nul ou d'un autre type ; `data` absent ; JSON nul | **incomplète** → « Donnée indisponible », comme une panne |
| Erreur HTTP, délai, réseau | « Donnée indisponible » |
| Lignes incomplètes | toutes transmises ; `regrouperRisques` décide |

L'ancienne route assimilait un `risques_detail` absent à une liste vide : la réponse incomplète devenait « rien de recensé ».

### Défilement mobile : non reproduit

**Parcours complet** : accueil, commune, « Connaître les risques naturels », à 390 et 360 px, sur La Rochelle et Nantes.
- **Position** : après le défilement automatique, le titre de la lecture est à 599 px (390) et 567 px (360), sous l'en-tête fixe qui finit à 65 px.
- **Pourquoi** : le défilement ne se déclenche que si la lecture est hors écran ; ici, son haut est déjà visible.
- **D'où venait l'apparence de titre masqué** : les captures `*-detail.jpg` sont des captures d'élément. Playwright fait défiler le panneau en haut de la fenêtre, sous l'en-tête fixe. C'est un artefact de la méthode de capture, pas le parcours réel (voir les captures de page `c12-risques-*-390.jpg`).
- **Conséquence** : aucune correction apportée.

### Vérifications

**Tests** :
- tests FUT-50 : 41/41, dont 3 nouveaux sur la précision, les codes hors format et l'interprétation des réponses ;
- suite complète : 2 596/2 596 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi ;
- en production, le prototype et sa route renvoient 404.

**Navigateur**, La Rochelle et Nantes à 1440, 390 et 360 px :
- résumé atteint par Tab, avec un contour visible ; Entrée ouvre, Espace referme ;
- débordement : 0 px.

**Hauteur du panneau** :

| | 1440 px | 390 px | 360 px |
| --- | --- | --- | --- |
| La Rochelle, replié → ouvert | 781 → 1 145 | 865 → 1 252 | 888 → 1 297 |
| Nantes, replié → ouvert | 754 → 1 412 | 834 → 1 560 | 888 → 1 658 |

**Captures** : `c12-risques-{la-rochelle,nantes}-{1440,390,360}.jpg` (page) et `…-detail.jpg` (détail ouvert).

### Adaptations nécessaires à la future route publique

1. **`getGeorisquesSummary`** (`src/lib/georisques.ts`, non modifié ici) doit conserver `num_risque` à côté du libellé. Par exemple, un champ `risks: { code, label }[]` ajouté sans retirer `riskLabels`, pour ne rien casser chez ses usages actuels.
2. **Elle doit aussi distinguer réponse vide et réponse incomplète.** Aujourd'hui, `gasparItem?.risques_detail ?? []` fait d'un détail absent une liste vide, et `data: []` donne aussi `riskLabels: []`. Reprendre la logique de `interpreterReponseGaspar`.
3. **`riskFlagsFromLabels`** (`georisques-flags.ts`) classe par libellé ; il serait plus sûr de classer par code. C'est hors de cette passe, à évaluer avec ses consommateurs (flags du rapport).
4. **Déplacer `regrouperRisques` et `interpreterReponseGaspar`** du prototype vers `src/lib`, avec leurs tests, puis brancher l'accueil public sur la bibliothèque.
5. **Géorisques ne répond qu'aux adresses IP françaises** : les fonctions sont déjà en `cdg1`.
