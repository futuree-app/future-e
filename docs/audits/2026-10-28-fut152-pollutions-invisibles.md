# FUT-152 · Pollutions invisibles : quatre recherches fiabilisées, et la décision pour le dossier payant

28/10/2026 · branche `bonjourfuturee/fut-152-stabiliser-les-donnees-industrielles-irep-2024-et-leur` · non fusionnée, non déployée.

## En une minute

- **Les quatre recherches de `/agir/pollutions-invisibles` étaient fausses ou en panne.** La recherche « sites pollués » ne fonctionnait sur aucune commune : elle visait un hôte qui n'existe pas. La recherche eau potable lisait le mauvais paramètre sous trois libellés sur cinq (la DBO5 sous « Plomb », le cadmium sous « Arsenic », le phosphore sous « Nitrites »). La recherche IREP était retirée depuis FUT-145. Enfin, une panne ATMO s'affichait comme une couverture régionale incomplète.
- **Les quatre recherches sont rétablies** sur des sources officielles vérifiées, avec quatre issues distinctes : résultat, absence dans la source, résultat partiel, source indisponible. Aucune panne ne devient une absence.
- **IREP** : l'export officiel 2025 sert désormais d'index local reproductible (13 811 établissements, dont 2 786 avec au moins un rejet chiffré publié). À Metz, l'ancien extrait ADEME ne trouvait aucun établissement dans un rayon de 10 km ; l'index en trouve 5 avec rejet chiffré, plus 19 autres.
- **Dossier payant : NO GO pour IREP ; GO à instruire pour les sites et sols au point d'adresse.** Un SIS sous l'adresse change ce que l'acheteur doit vérifier, et le dossier n'en dit rien aujourd'hui. Le détail est au §6 et dans un ticket séparé.
- **Incident hors périmètre, traité à part (FUT-158, PR #110)** : depuis Node, Géorisques coupe les requêtes qui portent `Accept: application/json`. En production, `https://futur-e.fr/georisques?insee=57463` répond `500 fetch failed`. Les lectures Géorisques du dossier Logement sont probablement touchées (§7).

## 1. Diagnostic des quatre recherches (avant la correction)

| Recherche | Source réelle | Défaut constaté | Effet sur le lecteur |
|---|---|---|---|
| Installations déclarant des rejets | Extrait ADEME `data_risk_IREP` 2019, environ 1 500 établissements | Retirée par FUT-145 : extrait partiel, liste de 20 sans pagination | Plus de recherche du tout, seulement un renvoi |
| Sites et sols | `data.georisques.gouv.fr/api/v1/sis` | **L'hôte n'existe pas (NXDOMAIN)**, et `www.georisques.gouv.fr/api/v1/sis` répond 404 | Erreur sur toutes les communes. Le texte vide prévu (« Aucun site pollué… recensé ») aurait conclu à tort sur une liste de 20 |
| Qualité de l'air | API ATMO France, lot 112 | Une panne, ou des identifiants absents, est convertie en `null`, puis en 404, puis en « la couverture du réseau ATMO varie selon les régions ». L'échec est **mémorisé une journée** par instance | Une panne passe pour un trou de couverture. Or l'API couvre toutes les communes testées (village de l'Ain, Corse, Réunion, Martinique) |
| Eau potable | Hub'Eau `resultats_dis`, fenêtre de 6 mois, 50 lignes | (1) **Codes Sandre faux** : 1313 = DBO5 sous « Plomb », 1388 = cadmium sous « Arsenic », 1350 = phosphore sous « Nitrites », 6860 inexistant sous « Pesticides ». (2) La fenêtre de 6 mois fait dire « aucun contrôle récent » à L'Abergement-Clémenciat, dont le dernier prélèvement date du 05/02/2026. (3) Un réseau est présenté comme toute la commune : Paris a 4 réseaux, Metz 2. (4) « <0,01 » est affiché « 0 ». (5) Les pastilles « Conforme » masquent la non-conformité aux références de qualité (Metz, 28/08/2026 : carbone organique total) | Des valeurs fausses sous un nom rassurant, et une absence qui n'en est pas une |

**Sécurité du rendu.** `PollutionLookup.tsx` construisait des chaînes HTML avec les noms, adresses et statuts venus de Géorisques, puis les injectait par `dangerouslySetInnerHTML`. Aucune exploitation n'a été observée, mais rien n'échappait ces champs. Le composant rend désormais des éléments React (échappement natif). Un lien de fiche n'est rendu qu'en `https`, vers `fiches-risques.brgm.fr` ou `georisques.gouv.fr`. La recette injecte `<img onerror>` et un lien `javascript:` : rien ne s'exécute.

## 2. Sources officielles et millésimes vérifiés

### IREP (registre des émissions polluantes)

- **Pas d'API.** Les spécifications OpenAPI Géorisques v1 et v2 (`/api/v3/api-docs/georisques-api-v1|v2`), relues le 28/10/2026, ne contiennent aucun chemin IREP.
- **Exports annuels**, listés par le service de la page Géorisques (`/webappReport/ws/telechargement/irep`) : 2003 à 2025 publiés, **2026 annoncé « données non disponibles »**. Archives `https://files.georisques.fr/irep/AAAA.zip`, modifiées le 16/09/2026. La page affiche « dernière mise à jour décembre 2024 », ce qui est contredit par les fichiers.
- **Le millésime 2025 est réellement accessible** : archive de 7,8 Mo, sha256 `eb965b9c…c5ec`, `annee_emission = 2025` sur toutes les lignes.

| Export | Établissements | Avec au moins un rejet chiffré publié | Lignes d'émission | dont « < seuil » | Coordonnées |
|---|---:|---:|---:|---:|---|
| ADEME 2019 (ancien extrait) | ≈ 1 500 | ? | | | |
| 2019 | 9 754 | 2 533 | 6 890 | 16 | 4 systèmes de projection, 20 sans code |
| 2023 | 12 832 | 2 802 | 62 566 | 55 373 | EPSG:4326 |
| 2024 | 13 507 | 2 824 | 63 935 | 56 755 | EPSG:4326 |
| **2025** | **13 811** | **2 787** (2 786 après exclusion) | 64 047 | 57 062 | EPSG:4326 |

- **Identifiants** : uniques dans chaque export. Un même SIRET couvre plusieurs sites distincts (605 SIRET en double, par exemple les syndicats de déchets du Lot) : l'unité retenue est l'établissement, pas le SIRET.
- **Plateformes industrielles** : 439 positions sont partagées par plusieurs établissements (Roussillon : 8 exploitants au même point). C'est conforme à la réalité.
- **Code commune ≠ site** : la commune déclarée est souvent celle du siège. Exemples : entrepôts déclarés « Paris 13e » et situés en Essonne, à 24 km ; Suez « Metz » situé à 23 km au nord. La recherche se fait donc sur les coordonnées.
- **Positions impossibles** (coordonnées hors du territoire du département déclaré) : 4 en 2025, écartées et listées dans `meta.exclus` (Eiffage Guyane placé dans le Pas-de-Calais, un établissement du Doubs placé en Espagne, Les Chais du Prunelas en mer, Verde SXM dans le Rhône). Conservés à raison : Kourou (31 km du centre de sa commune), EDF Saint-Barthélemy (déclaré 971), EDF Saint-Pierre (département « NR », lu sur le code commune).
- **Ce que le registre ne dit pas** : un établissement sans rejet chiffré publié n'est ni « sans rejet » ni « sans pollution ». En outre, le registre ne couvre pas toutes les ICPE, seulement les établissements soumis à déclaration.

### Sites et sols (Géorisques, BRGM)

- **Service officiel documenté** `https://georisques.gouv.fr/api/v1/ssp/{casias|instructions|conclusions_sis|conclusions_sup}`, sans jeton, jusqu'à 10 codes INSEE par appel, `page_size` ≤ 1000 (5000 rend 500). Recherche possible par point (`latlon`, `rayon` ≤ 10 km).
- **Quatre inventaires, à ne pas confondre** : SIS (pollution connue, arrêté préfectoral, études de sols exigées, mention à l'état des risques) ; instructions ex-BASOL (pollution suspectée ou avérée suivie par l'administration) ; SUP (restrictions d'usage) ; CASIAS (inventaire historique d'activités, sans constat de pollution). Un même terrain peut figurer dans trois d'entre eux (Sotrameuse, Metz).
- **Pièges mesurés** :
  - Paris, Lyon et Marseille rattachent leurs fiches tantôt à la ville, tantôt à l'arrondissement. Paris : 7 fiches CASIAS sous 75056, 8 241 sous les arrondissements. Pour les SIS, 37 fiches distinctes, dont 9 visibles seulement sous un arrondissement.
  - Les communes fusionnées gardent des fiches CASIAS sous leur ancien code (Cherbourg-en-Cotentin : 185 sous 50129, 252 avec ses anciens codes).
  - Les réponses contiennent des doublons : l'interrogation sur plusieurs codes en produit (Marseille : 67 lignes pour 55 fiches), et même un seul code (Cherbourg, instructions : 19 lignes pour 16 fiches).

### Eau potable (Hub'Eau, données des ARS)

`communes_udi` (réseaux de la commune et zone desservie), `resultats_dis` (dernier prélèvement par réseau, `conclusion_conformite_prelevement`, conformités aux limites et aux références). Les ARS publient avec environ deux mois de délai (dernier prélèvement national lu : 28/08/2026). Codes vérifiés auprès de Hub'Eau : 1340 nitrates, 1339 nitrites, 1382 plomb, 1369 arsenic, 6276 total des pesticides.

### Qualité de l'air

API ATMO France (`admindata.atmo-france.org`, lot 112, indice par commune). Elle répond pour toutes les communes testées et nomme l'association qui publie l'indice (`source`).

## 3. Correctifs

| Fichier | Rôle |
|---|---|
| `src/lib/sites-sols.ts` + `src/lib/server/sites-sols.ts` | Lib pure et appel réseau. Périmètre (ville + arrondissements + anciens codes, arrondissement élargi à sa ville), lots de 10 codes, dédoublonnage par identifiant, état par catégorie, liens filtrés. |
| `src/lib/anciens-codes-communes.generated.ts` | 2 661 communes, 4 234 anciens codes, générés depuis le COG Insee 2025 (`scripts/fut152/anciens-codes.mts`, même règle que FUT-147). |
| `src/lib/eau-potable.ts` + `src/lib/server/eau-potable.ts` | Codes corrigés, dernier prélèvement par réseau sans fenêtre, zone desservie, conclusion de l'ARS, valeurs telles que publiées. |
| `src/lib/atmo.ts`, `src/app/api/atmo/[insee]/route.ts` | `lireAtmoCommune` à trois états. Une panne n'est plus mémorisée. La route répond 502, 404 ou 200. Le contrat historique (`getAtmoForCommune`) est inchangé pour la page chaleur et l'aperçu du wizard. |
| `src/lib/data/irep-registre.ts`, `src/lib/server/irep-registre.ts`, `data/irep-registre.json` | Index IREP 2025 (1,4 Mo, 263 Ko compressé), construction qui refuse un export incohérent, recherche sans troncature. |
| `src/components/PollutionLookup.tsx`, page | Rendu React, quatre états, périmètre et date affichés, dépliable « Précisions sur la source », listes longues ouvertes à la demande. |
| Suppressions | `src/lib/irep.ts` (extrait ADEME), `/api/irep` et `/api/proxy/atmo` (Recosanté injoignable). Ces routes n'étaient appelées par aucun code. |

Conventions arbitrées par le porteur le 28/10/2026 :

- IREP : lister les établissements avec rejet chiffré, puis compter séparément les autres, avec la formule « sans rejet chiffré publié au-dessus des seuils ».
- Positions impossibles : écarter et compter.
- Eau : afficher le dernier prélèvement publié, daté, sans seuil d'ancienneté.
- CASIAS : compter et renvoyer vers la carte, sans lister, ce que le porteur a accepté provisoirement le 28/10/2026. L'expérience visée à terme est d'explorer les fiches proches d'une adresse dans futur•e, et de les réutiliser dans le dossier payant. Le compte est celui des **fiches distinctes** : lues page par page et dédoublonnées par identifiant, elles ne sont jamais tirées du total annoncé. Si le plafond de 10 pages par lot coupe la lecture, l'écran affiche « au moins N fiches ».

Le repère « vigilance » nitrates à 25 mg/L existait déjà. Il est conservé, et désormais présenté au lecteur comme repère futur•e sans valeur réglementaire.

## 4. Reproduire l'import

```
curl -o /tmp/irep/2025.zip https://files.georisques.fr/irep/2025.zip
node scripts/fut152/construire-irep.mts --zip /tmp/irep/2025.zip --annee 2025 --sha256 eb965b9c0f64bd35e866b7cae3b215b5abc9da3d5b9816ed4f428566eb3cc5ec
curl -o /tmp/cog/v_commune_2025.csv     https://www.insee.fr/fr/statistiques/fichier/8377162/v_commune_2025.csv
curl -o /tmp/cog/v_mvt_commune_2025.csv https://www.insee.fr/fr/statistiques/fichier/8377162/v_mvt_commune_2025.csv
node scripts/fut152/anciens-codes.mts --cog /tmp/cog
```

**Rafraîchissement** : l'export IREP est annuel. Le millésime 2026 sera publié vers septembre 2027 ; il suffira de relancer la construction avec la nouvelle archive. Le test de l'index échouera tant que l'empreinte et les comptes n'auront pas été revus, ce qui est voulu.

## 5. Contre-épreuves et recette

**Indépendantes de la table** : un script Python lit directement les CSV de l'export, sans passer par l'index, autour du centre geo.api de chaque commune, dans un rayon de 10 km. Les points sont exactement ceux que l'écran envoie (revue du 29/10 : Fos et Gramat portaient auparavant un autre point, voir plus bas).

| Point | Tous | Avec rejet chiffré | Index (avec / autres) |
|---|---:|---:|---|
| Metz | 24 | 5 | 5 / 19 |
| Paris (centre) | 119 | 33 | 33 / 86 |
| Fos-sur-Mer | 49 | 17 | 17 / 32 |
| Gramat (rural) | 4 | 1 | 1 / 3 |
| En mer (46 N, 6 O) | 0 | 0 | absent dans la source |

Pour comparaison, l'ancien extrait ADEME ne trouvait aucun établissement autour de Metz et 9 autour de Paris.

Sites et sols, recomptés par appels séparés puis union par identifiant :

| Commune | SIS | Instructions | SUP | CASIAS (fiches distinctes) |
|---|---:|---:|---:|---:|
| Paris | 37 | 55 | 0 | 8 248 (la source annonce 8 250 lignes, dont 2 doublons) |
| Metz | 8 | 19 | 2 | 546 |
| Cherbourg-en-Cotentin | 13 | 16 | 1 | 252 |
| Annecy | 6 | 27 | 1 | 841 |
| L'Abergement-Clémenciat | 0 | 0 | 0 | 3 |

**Tests** : `src/lib/fut152-pollutions-invisibles.test.ts`, 21 tests (fixtures tirées de lignes réelles des exports). La suite complète passe : 3 758 tests, 0 échec. Contrôle de types et lint sans erreur.

**Navigateur** : `scripts/fut152/recette.mjs`, Chrome réel, à 1440 px (souris) et 390 px (toucher). 21 vérifications par format, toutes vertes. Elles couvrent les sources réelles (Metz, Paris, L'Abergement-Clémenciat), une panne simulée sur chacune des quatre routes, les données piégées et l'absence de défilement horizontal. Captures dans `2026-10-28-fut152-pollutions-invisibles/`.

**Coût** :
- IREP : index lu une fois par instance (19 ms, 13 Mo de mémoire), 2 ms par recherche, aucun appel réseau.
- Sites et sols : 4 appels pour une commune ordinaire. CASIAS est lu page par page pour être compté par identifiant distinct : Paris demande 3 lots et 9 pages de 1 000 fiches, soit environ 4 Mo, pour 4,9 s au premier passage, puis 0,07 s en cache (24 h). Pour Lyon : 1,6 s. Pour Metz : 0,3 s.
- Eau : 6 à 7 appels plus un par réseau supplémentaire, mis en cache 24 h.
- Aucune lecture ni écriture Supabase. Surcoût Vercel négligeable (+1,4 Mo dans la seule fonction `/api/proxy/irep`).
- Aucun rapport payant ne change : `georisques-logement` n'est touché qu'en commentaire, et la garde FUT-145 « le dossier n'appelle pas IREP » est conservée.

## 6. Dossier payant : décision

**Question** : que peut vérifier ou décider le lecteur grâce à cette information qu'il ne savait pas déjà ?

**Ce que le dossier contient aujourd'hui** :
- Logement charge Cartofriches autour de l'adresse, **mais aucun composant ne l'affiche**. Seul le libellé de couverture « friches (Cartofriches) » apparaît.
- Seveso et IED sont lus à la commune dans les faits santé (exposition industrielle, déclencheur sans score affiché).
- La qualité de l'air de fond (PM2,5, NO2) est lue à la commune.
- **Aucune lecture SIS, ex-BASOL ou SUP à l'adresse.**

**Situations testées** (API officielle, recherche par point) :

1. *Achat boulevard de la Solidarité, Metz.* Le point tombe dans le SIS « Sotrameuse » et dans une instruction en cours. Pour l'acheteur, cela décide de choses concrètes : tout permis de construire ou d'agrandir exige une attestation d'étude de sols par un bureau certifié, l'information doit figurer dans l'état des risques, et il faut demander l'historique au vendeur. **Le dossier n'en dit rien aujourd'hui.**
2. *Location rue de Rivoli, Paris 4e.* Aucun SIS ni instruction à moins de 300 m ; 30 fiches CASIAS dans le même rayon. Pour un locataire, ces fiches ne changent aucun geste : elles relèvent du bruit.
3. *Maison à Gramat.* Rien dans les quatre inventaires à 300 m, un établissement IREP à 247 m du centre (méthanisation). Le registre ne dit rien de l'exposition. Le seul geste possible serait de « se renseigner », ce qui n'est pas une vérification.

**IREP dans le dossier : NO GO.** Un établissement déclarant ne démontre aucune exposition de l'adresse. Le dossier porte déjà la catégorie légale Seveso, qui est le fait opposable, et le registre n'ouvre aucun geste de vérification que l'acheteur puisse accomplir. La page publique suffit pour la curiosité. Le ticket pourra être rouvert si une situation montre un geste concret (par exemple une enquête publique en cours sur l'extension d'un site déclarant à moins de 1 km).

**Sites et sols au point d'adresse : GO à instruire en phase 2.** Proposition :
- **Emplacement** : Logement, face « terrain », à côté des risques au point (cavités, mouvements de terrain). Rien dans Autour, qui raisonne au quartier.
- **Affiché** : seulement si le point ou la parcelle **intersecte** un SIS, une SUP ou une instruction ex-BASOL. Le nom du site, la nature de l'inventaire, la date, un lien vers la fiche. Une carte au plus.
- **Non affiché** : CASIAS (sauf une fiche à moins de 50 m, en mention « à vérifier », à arbitrer), les friches, IREP.
- **Règle de pertinence** : l'intersection est le fait. La distance n'est jamais un niveau de danger.
- **Texte** (à relire par l'Editorial Writer) : « L'adresse se trouve dans un secteur d'information sur les sols : l'État y connaît une pollution. Avant d'acheter, demandez au vendeur l'état des risques et l'historique du terrain ; pour construire ou agrandir, une étude de sols par un bureau certifié sera exigée. »
- **Absence** : « Aucun secteur d'information sur les sols, ni servitude, ni pollution suivie par l'administration sur ce point » n'est dit que si les trois catégories ont été lues. Sinon, la couverture affiche « non vérifié ».
- **Cartofriches** : l'afficher sous la même règle (intersection, pollution qualifiée), ou cesser de le charger. Il ne doit plus rester chargé sans être lu.
- **Technique** : `getSitesSolsAutour(lat, lon, rayon)` sur la même lib (la normalisation est déjà écrite), un appel de plus dans le fan-out de `georisques-logement` (environ 300 ms en parallèle), un champ versionné dans `LogementReport`, une règle de couverture dans `deriveLogementCoverage`. Tests : intersection, absence lue, panne, PLM, parcelle à cheval.

## 7. Incident Géorisques (traité à part : FUT-158, PR #110)

Le diagnostic complet est dans `docs/audits/2026-10-28-fut158-incident-georisques.md`. Géorisques coupe une partie des requêtes `fetch` de Node selon leurs en-têtes ; `Accept-Encoding: identity` lève la coupure sur tous les chemins du dossier. La lib de cette PR (`server/sites-sols.ts`) envoie un User-Agent nommé et aucun `Accept` : elle a été vérifiée sous Next.js sur toutes les communes de la recette. Elle adoptera les en-têtes partagés de FUT-158 (`EN_TETES_GEORISQUES`) une fois les deux PR fusionnées.

## 6. Revue du 29/10/2026 : les quatre NO GO levés

Branche rebasée sur `main` (`76095598`, avec #108, #110 et #112), sans conflit.

1. **Total annoncé jamais lu comme une absence (SIS et eau).**
   - Sites et sols : une ligne sans identifiant n'est plus ignorée en silence, et une page qui annonce `results > 0` interdit `absent_dans_source`. La catégorie est alors `partiel`. `lotIncomplet` compare les lignes lues au total annoncé, ce qui couvre aussi un `total_pages` absent ou faux.
   - Eau : un réseau, un repli communal ou un paramètre qui annonce `count > 0` sans ligne exploitable rend la lecture `partiel`. Le réseau est dit « résultat indisponible », jamais « aucun prélèvement publié ».
   - Écran : un partiel sans fiche n'affiche ni la phrase d'absence ni « 0 ». Il dit : « La source annonce des fiches qui n'ont pas pu être lues : rien ne peut en être conclu. » Avec des fiches, le compte devient « au moins N ».
2. **Eau, au-delà de 50 réseaux.** Toutes les pages de `communes_udi` sont lues (50 par page, 20 pages au plus). Si une page échoue, si le plafond coupe la lecture ou si une ligne annoncée n'a pas de réseau, la liste lue est montrée et la lecture est dite partielle, sans mise en cache.
3. **ATMO, JSON inattendu.** `enregistrementsAtmo` n'accepte que les deux formes documentées : un tableau, ou un GeoJSON dont chaque élément porte ses `properties`. Toute autre forme lève une erreur, et un `code_qual` hors de 1 à 6 aussi, sauf 0 qui signifie « indice absent » dans la nomenclature ATMO. La réponse est alors 502, jamais 404. Le cache de données Next est retiré : il gardait une heure une réponse 200 au contenu inattendu. Seule une lecture réussie est gardée.
4. **Géorisques, transport commun.** `server/sites-sols.ts` envoie `EN_TETES_GEORISQUES` (dont `Accept-Encoding: identity`) et trace `georisques_echec`, comme les autres appels. Le garde-fou FUT-158 reconnaît désormais un appel par `SITES_SOLS_SOURCE.api`, et son exclusion du proxy SIS est retirée.

**Contre-épreuves.**
- 13 tests ajoutés.
- Mutations : chaque correctif retiré fait échouer au moins un test (6 sur 6).
- `npm test` : 3 851 tests, 0 échec. `tsc` et `eslint` : 0 erreur.

**Réel, le 29/10.**
- Sites et sols, avec les nouveaux en-têtes : Paris 37 SIS et 8 248 CASIAS, Metz 8 et 546, Cherbourg 13 et 252, Marseille 56 et 4 326. Valeurs identiques à la revue précédente, aucune trace `georisques_echec`.
- Eau : Marseille 16 réseaux, tous lus. Un premier passage était `partiel` parce qu'un des 22 appels parallèles n'avait pas répondu à temps, ce qui est l'état attendu.
- ATMO : indice servi à Metz, Paris, Fos et L'Abergement-Clémenciat.

**Recette navigateur** (1440 px et 390 px tactile) : 58 vérifications, 0 échec.
- Partiels sites et sols et eau.
- JSON ATMO inattendu injecté côté serveur (`scripts/fut152/atmo-inattendu.mjs`), puis retour réel du service sur le même serveur, à Nancy et à Épinal.
- IREP à Fos-sur-Mer.

**IREP à Fos, au point exact de l'écran.** L'écran cherche autour du `centre` de geo.api.gouv.fr, soit 43,4545 N et 4,8979 E. La contre-épreuve précédente utilisait 43,4378 N et 4,9447 E, soit 26 / 40. Au vrai point :
- l'export recompté en Python sans l'index (archive de même empreinte `eb965b9c…`) donne 49 établissements, dont 17 avec un rejet chiffré et 32 autres ;
- l'index, la route `/api/proxy/irep` et l'écran donnent 17 / 32 ;
- un seul établissement est proche de la limite, à 9,92 km.

Gramat avait le même écart de point, sans effet sur le compte (1 / 3). Les deux points sont corrigés dans le test.
