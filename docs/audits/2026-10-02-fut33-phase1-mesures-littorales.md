# FUT-33, phase 1 : mesures littorales (donnée seule, rien n'est branché)

Date : 02/10/2026. Branche FUT-33, à partir de l'audit `2026-10-02-fut33-verite-littorale.md` (`375c8209`).
Aucun fichier produit n'est modifié : ni `comparateur-vie`, ni les contraintes, ni la capacité, ni l'interface, ni
l'index de production. `distance_cote_km` reste en place.

Artefacts versionnés : `scripts/mer/` (pipeline, README), `scripts/mer/fixtures/cas-reference.json` (32 communes
de référence), `scripts/mer/fixtures/resume-mesures.json` (agrégats), `src/lib/fut33-mer-pipeline.test.ts`.
Les données lourdes (sources 2 Go, rivage 88 Mo, mesures 7 Mo) restent hors dépôt (`~/futuree-fut33/`).

---

## 1. Méthode finale

Pipeline Python (`scripts/mer/build_mer.py`), outils géospatiaux standard : **GDAL 3.12** via `pyogrio` (lecture
Shapefile / GeoJSON gzip / GeoPackage), **Shapely 2.1** (géométrie robuste, index `STRtree`, distances exactes),
**PROJ** via `pyproj`. Tous les calculs se font en **Lambert 93 (EPSG:2154, mètres)**, jamais en degrés.

1. Lire la LimTM (105 715 tronçons, 17 668 km), ses 883 fermetures (271 LTM, 294 LSE, 318 LAM) et l'attribut
   officiel `limarc` de chaque tronçon.
2. Couper la ligne aux limites transversales de la mer (§3) : on obtient le **rivage marin** (13 176 km conservés,
   4 493 km retirés). Les segments de fermeture LTM sont ajoutés au rivage.
3. Pour chaque commune de l'index (34 788) : distance exacte du **centre** (le point de l'index, centre géométrique)
   au rivage, et distance du **contour communal** au rivage (0 si contact). Les mêmes mesures sur la ligne brute
   sont gardées pour comparaison.
4. Joindre le classement DGALN « loi Littoral » (COG 2022).
5. Écrire le rivage marin (WKB) pour le calcul à l'adresse.

Durée : 9 minutes sur un portable (lecture 1 s, coupure 40 s, mesures 8 min 30).

## 2. Sources

| Source | Millésime | Licence | Rôle |
|---|---|---|---|
| Limite terre-mer Shom-IGN, France métropolitaine | 2021 (paquet mis à jour le 01/10/2026) | Licence Ouverte 2.0 | rivage, fermetures LTM |
| Contours communaux Etalab (IGN ADMIN EXPRESS), simplifiés 5 m | 2026 | Licence Ouverte 2.0 | territoire communal |
| Communes loi Littoral, DGALN-SIDAUH | COG 2022 | Licence Ouverte | classement Mer / Estuaire / Lac |
| Planification maritime, DGAMPA-Shom (façades) | édition 2026 | Licence Ouverte 2.0 | test de rattachement (§10) |
| Index du comparateur futur•e | en production | interne | centre communal, ancienne distance |

## 3. Traitement des estuaires

### 3.1 Ce que dit la donnée

Le descriptif officiel (annexe A) code chaque tronçon par rapport aux limites maritimes : `limarc` contient
**2** pour un tronçon **en amont de la LTM**, 1 pour l'aval, 3 à 6 pour la LSE et la LAM. Vide = aval de toutes
les limites, ou cours d'eau sans limite. C'est la base de la coupure.

### 3.2 Algorithme retenu, en quatre règles

| Règle | Contenu | Effet national |
|---|---|---|
| **A. Codage officiel** | tout tronçon dont `limarc` contient 2 est retiré | 4 114 km retirés ; 136 fermetures couvertes |
| **B. Petits trous de codage** | ligne sectionnée aux deux extrémités de chaque fermeture LTM ; côté amont = celui où les deux rives, suivies sur 500 m, restent proches ; retiré seulement si majoritairement non codé et si les garde-fous passent : **au plus 5 km**, aucun tronçon codé aval (1), côté mer plus long | 21 fermetures, quelques km |
| **C. Compléments explicites** | grand estuaire non codé : désigné à la main, coupé par la droite de sa fermeture, contrôlé par des points de côte qui doivent rester marins | 1 cas : **la Seine** (354 km de rives retirés ; Honfleur, Trouville, Le Havre, Étretat, Fécamp, Dieppe vérifiés intacts) |
| **D. Îles d'estuaire** | île (contour fermé) non codée, à plus de 5 km de tout rivage conservé et trois fois plus proche des rives retirées : retirée | 28 îles, 18 km (îles de la Seine en amont, de la Loire, de la Gironde) |

Statuts des 271 fermetures LTM : 136 couvertes par le codage, 21 par la règle B, 60 refusées par les garde-fous
(sans effet : le codage ou l'aval les couvre déjà), 53 incertaines (rives qui ne s'écartent pas nettement), 1 non
accrochée (extrémité à plus d'1 m de la ligne). Toutes sont listées dans `estuaires.json` (hors dépôt).

### 3.3 Trois erreurs trouvées en route, et corrigées

Elles montrent pourquoi chaque règle a un garde-fou :
1. **Une règle purement géométrique ne suffit pas.** Appliquée seule, elle a retiré 8 300 km sur 17 700 : la Corse
   entière, la Provence, le pays de Caux, pris pour des estuaires.
2. **La Seine n'est pas codée.** Ses rives de Tancarville à Rouen n'ont pas le code 2 ; une extrémité de sa
   fermeture (4,8 km de large) n'accroche pas la ligne. Seul un complément explicite la règle (règle C).
3. **La règle B a pris la côte de l'Hérault pour un fleuve** (60 km, Vias, Portiragnes, Sérignan perdaient la mer).
   D'où le plafond de 5 km.

### 3.4 Les cas obligatoires

| Estuaire | Commune | Ligne brute (centre) | Après coupure : centre / territoire | Attendu | Verdict |
|---|---|---|---|---|---|
| Gironde | Bordeaux | 1,8 km | **39,4 / 35,1 km** | intérieure | ✓ |
| Loire | Nantes | 2,7 km | **38,9 / 31,0 km** | intérieure | ✓ |
| Orne | Caen | 1,2 km | **9,2 / 6,5 km** | ~10 km, non littorale | ✓ |
| Charente | Rochefort | 1,1 km | **8,0 / 5,2 km**, classée Estuaire | commune d'estuaire | ✓ |
| Seine | Rouen | 0,3 km | **48,2 / 43,8 km** | intérieure | ✓ (règles C et D) |
| Léguer | Lannion | 0,7 km | **0,7 / 0 km** | au bord de la mer (LTM dans la ville) | ✓ |
| Rivière de Morlaix | Morlaix | 1,4 km | **3,2 / 0 km** | centre derrière la LTM, territoire sur la baie | ✓ |

Tests qui échoueraient si la ligne brute réapparaissait : `fut33-mer-pipeline.test.ts` exige, pour Bordeaux,
Nantes, Caen et Rouen, une distance brute de moins de 3 km **et** une distance coupée de plus de 20, 20, 5 et 30 km.

## 4. Validation nationale (géométrie contre classement juridique)

| Contrôle | Résultat |
|---|---|
| Communes classées **Mer** (839 dans l'index) dont le territoire n'atteint pas le rivage (> 50 m) | **3** : Parentis-en-Born (6,3 km) et Sanguinet (4,1 km), classées « Lac, Mer » par la DGALN mais sans contact avec l'Atlantique (même sur la ligne brute) ; Carentan-les-Marais (0,14 km, commune nouvelle « Estuaire, Mer », baie des Veys) |
| Communes **sans classement** dont le territoire touche le rivage | **28** : 7 arrondissements de Marseille (classement porté par la commune 13055) ; 21 communes rétro-littorales ou d'estuaire (Quimper, Quimperlé, Harfleur, Eu, Coudekerque-Branche, Puget-sur-Argens, Saint-Martin-de-Seignanx…) dont le contour atteint une rive aval non classée par la loi |
| Communes **Estuaire** seules (82) | 12 touchent le rivage marin (Berville-sur-Mer, Marais-Vernier, Tréguier et voisines…), 70 non. **Aucune n'est requalifiée Mer** : le classement reste distinct |
| Communes **Lac** seules (144) | aucune à moins de 5 km du rivage marin ; jamais utilisées comme preuve de mer |

Aucune exception n'a été effacée en jouant sur un seuil. Tolérance proposée pour le test national « Mer touche le
rivage » : 0 km, avec la liste nominative des 3 exceptions ci-dessus.

## 5. Distributions (34 788 communes)

| Communes à… | ancienne `distance_cote_km` | centre (coupé) | territoire (coupé) | centre (brut) | territoire (brut) |
|---|---|---|---|---|---|
| = 0 | 5 | 30 | **875** | 32 | 1 208 |
| ≤ 2 km | 36 | 552 | 1 117 | 842 | 1 563 |
| ≤ 5 km | 156 | 1 163 | 1 611 | 1 668 | 2 281 |
| ≤ 8 km | 377 | 1 698 | 2 082 | 2 399 | 2 918 |
| ≤ 15 km | 1 082 | 2 731 | 3 107 | 3 772 | 4 243 |
| ≤ 30 km | 3 289 | 4 648 | 4 989 | 6 153 | 6 519 |
| ≤ 100 km | 11 794 | 12 425 | 12 686 | 14 319 | 14 604 |

Lecture : l'ancienne distance sous-estimait massivement la proximité de la mer (156 communes à 5 km contre 1 163
réellement). La ligne brute, à l'inverse, la surestime (estuaires).

## 6. Comparaison ancienne / nouvelle

| Bascule | Entrent | Sortent |
|---|---|---|
| centre au seuil de 5 km | 1 038 | 31 |
| centre au seuil de 15 km | 1 749 | 100 |
| territoire au seuil de 5 km | 1 478 | 23 |
| territoire au seuil de 15 km | 2 097 | 72 |

| Ancien monde | Nombre |
|---|---|
| Communes Mer ratées par le proxy (à plus de 5 km) | **754** sur 839 |
| « Littoral » par le proxy (≤ 5 km) mais ni Mer ni territoire à moins de 2 km | 39 (Caen, communes voisines des 46 ancres) |
| Communes des anciennes listes départementales « littoral » | 5 065 |
| dont ni Mer ni territoire à moins de 5 km | **3 881** (jusqu'aux Alpes-de-Haute-Provence, à 117 km de la mer) |

Plus grosses différences (centre) : Locquirec 68 → 0,7 km ; Guimaëc 67 → 0,9 ; Trébeurden 65 → 1,2 ; Trégastel
64 → 0,6 ; Pleumeur-Bodou 64 → 0,9 ; Perros-Guirec 63 → 0 ; Plestin-les-Grèves 64 → 2,2 ; Aléria 59 → 0,6 ;
Lannion 58 → 0,7. Dans l'autre sens : Caen 1 → 9,2 ; communes proches des anciennes ancres.

## 7. Matrice des communes de référence

| Commune | Ancienne | Centre | Territoire | Ligne brute (centre) | Loi | Rôle |
|---|---|---|---|---|---|---|
| Châtelaillon-Plage | 11 | 1,0 | 0 | 1,0 | Mer | critère d'acceptation |
| Brest | 2 | 1,4 | 0 | 1,4 | Mer | littorale |
| Nice | 1 | 1,1 | 0 | 1,1 | Mer | Méditerranée |
| Dieppe | 0 | 0,3 | 0 | 0,3 | Mer | Manche |
| Saint-Malo | 0 | 0,3 | 0 | 0,3 | Mer | Manche |
| Saint-Nazaire | 2 | 1,7 | 0 | 1,7 | Mer | littorale près d'un estuaire |
| Perros-Guirec | 63 | 0 | 0 | 0 | Mer | pire cas du proxy |
| Lannion | 58 | 0,7 | 0 | 0,7 | Mer | proxy |
| Morlaix | 54 | 3,2 | 0 | 1,4 | Mer | centre ≠ territoire |
| Locquirec | 68 | 0,7 | 0 | 0,7 | Mer | proxy |
| Trébeurden | 65 | 1,2 | 0 | 1,2 | Mer | proxy |
| Bordeaux | 51 | 39,4 | 35,1 | 1,8 | aucun | estuaire |
| Nantes | 49 | 38,9 | 31,0 | 2,7 | aucun | estuaire |
| Caen | 1 | 9,2 | 6,5 | 1,2 | aucun | estuaire, faux positif ancien |
| Rochefort | 27 | 8,0 | 5,2 | 1,1 | Estuaire | estuaire ≠ mer |
| Rouen | 53 | 48,2 | 43,8 | 0,3 | aucun | estuaire non codé |
| Saintes | 33 | 23,8 | 18,3 | 22,9 | aucun | intérieure 17 |
| Saint-Jean-d'Angély | 54 | 39,4 | 36,8 | 24,2 | aucun | intérieure 17 |
| Rennes | 64 | 47,6 | 43,5 | 45,8 | aucun | intérieure Bretagne |
| Pontivy | 46 | 37,2 | 33,7 | 35,6 | aucun | intérieure Bretagne |
| Carhaix-Plouguer | 52 | 43,4 | 40,3 | 38,2 | aucun | intérieure Finistère |
| Arcachon | 1 | 1,3 | 0 | 1,3 | Mer | bassin |
| Vannes | 1 | 0,8 | 0 | 0,8 | Mer | golfe |
| Sète | 5 | 0 | 0 | 0 | Mer | lagune et mer |
| Montpellier | 17 | 6,9 | 3,1 | 5,6 | aucun | étangs |
| Mauguio | 6 | 0,2 | 0 | 0,2 | Mer | étang de l'Or |
| La Grande-Motte | 1 | 0,0 | 0 | 0,0 | Mer | lagune et mer |
| Annecy | 260 | 259,7 | 254,0 | 258,8 | Lac | lac ≠ mer |
| Marseille 7e / 16e | 4 / 8 | 0 / 0,5 | 0 / 0 | idem | (13055 : Mer) | PLM |

**Marseille.** L'index porte les 16 arrondissements ; la DGALN classe la commune 13055 (Mer). Le pipeline mesure
aussi la commune entière depuis son contour : territoire 0 km, centre du contour 3,8 km. Pour le produit, il faudra
choisir : rattacher le classement de 13055 à ses arrondissements (proposé), comme pour la population communale
(FUT-8).

## 8. Exceptions

Toutes listées, aucune masquée :
- 3 communes Mer sans contact géométrique (§4) ;
- 28 communes sans classement qui touchent le rivage (§4) ;
- 53 fermetures LTM incertaines et 1 non accrochée (`estuaires.json`) : sans effet mesuré sur les cas de
  référence, mais à revoir si un estuaire secondaire se révèle mal traité ;
- le complément Seine est une décision manuelle, documentée et contrôlée ; une nouvelle édition de la LimTM qui
  coderait la Seine le rendrait inutile.

## 9. Lagunes et bassins : scénarios A et B

**Ce que permet la source.** La LimTM ne qualifie pas les lagunes : leurs rives sont du rivage comme les autres, et
les règles de production ferment une lagune seulement en cas d'obstacle à la navigation ou de passe de moins de
7 m (descriptif, §4.2.2.1). Il n'existe pas d'attribut « lagune ». Le scénario B est donc **construit
géométriquement** (`lagunes_b.py`) : eau = fenêtre moins les polygones de terre LimTM ; ouverture morphologique
de rayon r ; la mer ouverte est la plus grande masse d'eau restante. Le résultat dépend de r : c'est un choix
de convention, pas une donnée.

| Commune | A (lagunes = mer) centre / territoire | B, r = 250 m | B, r = 500 m | B, r = 1 000 m |
|---|---|---|---|---|
| Arcachon | 1,3 / 0 | 1,4 / 0 | 1,4 / 0 | 1,4 / 0 |
| La Teste-de-Buch | 2,8 / 0 | 2,8 / 0 | 2,9 / 0 | 3,1 / 0 |
| Vannes | 0,8 / 0 | 5,2 / 1,1 | **16,7 / 12,6** | 16,7 / 12,6 |
| Arradon | 1,4 / 0 | 1,4 / 0 | **11,5 / 8,2** | 11,6 / 8,5 |
| Sarzeau | 1,3 / 0 | 1,3 / 0 | 2,8 / 0 | 2,9 / 0 |
| Sète | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| Mèze | 1,7 / 0 | **7,2 / 2,8** | 7,2 / 2,8 | 7,2 / 2,8 |
| Balaruc-les-Bains | 0,3 / 0 | **5,0 / 3,5** | 5,0 / 3,5 | 5,0 / 3,5 |
| Montpellier | 6,9 / 3,1 | 10,4 / 6,6 | 10,5 / 6,6 | 10,5 / 6,6 |
| Mauguio | 0,2 / 0 | 4,2 / 0 | 4,2 / 0 | 4,2 / 0 |
| La Grande-Motte | 0,0 / 0 | 1,6 / 0 | 1,6 / 0 | 1,6 / 0 |

Lecture :
- **Arcachon ne se distingue jamais** de la mer : la passe du bassin fait plusieurs kilomètres. En B, le bassin
  est de la mer, ce qui correspond à l'usage.
- **Le golfe du Morbihan bascule selon r** : Vannes est « au bord de la mer » ou « à 17 km » selon que l'on fixe
  250 ou 500 m. La passe de Port-Navalo mesure environ 900 m.
- **Thau et les étangs palavasiens** se détachent dès 250 m : Mèze et Balaruc passent de 0 à 3-5 km.
- Les communes qui touchent à la fois la lagune et la mer (Sète, La Grande-Motte, Mauguio pour son territoire)
  restent à 0 dans les deux scénarios.

D2 reste donc ouvert, avec cette matière : le scénario A est simple et sans convention ; le scénario B exige de
fixer une largeur de passe, et un seul paramètre fait basculer tout le golfe du Morbihan.

## 10. Façades officielles

| Question | Réponse |
|---|---|
| Source | « Planification maritime », DGAMPA-Shom, couche `MSP_Spatial_Plan`, une emprise par façade : Manche Est-mer du Nord (MEMN), Nord Atlantique-Manche Ouest (NAMO), Sud-Atlantique (SA), Méditerranée (MED) |
| Format | GeoPackage par façade (paquet 7z de 709 Mo, surtout les zones de vocation) ; WMS ; le WFS public refuse la couche (« MissingRights ») |
| Licence | Licence Ouverte 2.0 ; citation « DGAMPA-Shom, 2026. Planification maritime. https://dx.doi.org/10.17183/MSP » |
| Géométrie | **polygones en mer** (emprise maritime de chaque façade), pas un découpage du trait de côte |
| Rattachement d'un point de rivage | possible par proximité : sur 1 117 communes à moins de 2 km du rivage, médiane de 0 m entre le point de rivage le plus proche et une emprise ; 95e centile 5,4 km ; 4 cas ambigus (marge < 2 km, Marais poitevin, limite SA/NAMO) |
| Limites | les lagunes et le fond des rias sont hors des emprises (étangs de l'Aude et de Berre jusqu'à 26 km) ; la limite NAMO/SA passe entre la Vendée et la Charente-Maritime |

Ce que la source ne permet pas : les façades administratives ne correspondent pas aux notions du lecteur. « La
façade atlantique » d'un lecteur couvre NAMO (une partie) et SA ; la Bretagne nord est en NAMO avec la Manche
ouest ; la « côte basque » n'existe pas. Le rattachement à une façade officielle est fiable ; la traduction en
« Atlantique / Manche / côte basque » reste une convention produit à définir (D6).

## 11. Prototype adresse

Distance exacte point → rivage marin, sur 5 000 points tirés autour de la côte (4 493 à moins de 30 km du rivage),
selon le niveau de simplification (Douglas-Peucker, topologie conservée) :

| Tolérance | Sommets | Poids WKB | Gzip | Erreur max | Erreur moyenne | 99e centile | Temps / point |
|---|---|---|---|---|---|---|---|
| 0 (source) | 8,05 M | 129,6 Mo | 73,1 Mo | 0 | 0 | 0 | 0,105 ms |
| 2 m | 819 k | 13,9 Mo | 8,2 Mo | 2,0 m | 0,19 m | 1,5 m | 0,031 ms |
| 5 m | 499 k | 8,8 Mo | 4,9 Mo | 4,9 m | 0,50 m | 3,7 m | 0,026 ms |
| 10 m | 379 k | 6,9 Mo | 3,7 Mo | 9,9 m | 0,97 m | 7,3 m | 0,025 ms |
| 20 m | 317 k | 5,9 Mo | 3,0 Mo | 19,5 m | 1,9 m | 14,5 m | 0,023 ms |
| 50 m | 280 k | 5,3 Mo | 2,6 Mo | 48,8 m | 4,1 m | 34,6 m | 0,023 ms |
| 100 m | 269 k | 5,1 Mo | 2,5 Mo | 95,9 m | 7,3 m | 65,5 m | 0,023 ms |

L'erreur maximale reste égale à la tolérance, comme attendu. Entre 5 et 20 m, la géométrie pèse 3 à 5 Mo
compressés, avec une erreur au plus égale à 20 m : deux ordres de grandeur sous un seuil d'un kilomètre. Au-delà de
20 m, le gain de poids devient marginal (la géométrie est dominée par les petites îles et les ports). La
tolérance n'est pas choisie ici. Le calcul est en Python ; un portage Node (index en grille ou `flatbush`) reste
à mesurer.

## 12. Poids et performances

| Élément | Mesure |
|---|---|
| Téléchargements | LimTM 255 Mo (7z) ; contours 90 Mo ; liste juridique 65 Ko ; façades 709 Mo (facultatif) |
| Disque de travail | ~2 Go (sources décompressées) |
| Construction nationale | 9 min (dont 8 min 30 de mesures communales) |
| Rivage marin produit | 88 920 segments, 88 Mo WKB brut |
| Champs futurs de l'index | 3 nombres + 1 classement par commune, de l'ordre de 0,5 Mo non compressé |

## 13. Licence et attribution

Formulation exigée par le descriptif Shom (§5.3), relevée dans le document officiel :

- mention explicite de la source : **« © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM »** ;
- indication claire à l'utilisateur des limites d'usage de la donnée ;
- sur un site internet, **logos du Shom et de l'IGN** avec un lien vers shom.fr et ign.fr.

Le pipeline écrit cette provenance dans `build-meta.json` (source, millésime, méthode `mer-v2`, licence,
attribution) pour chaque construction. Proposition pour « Données et limites », à valider plus tard :

> Distance à la mer : Limite terre-mer © Shom-IGN, 2021, coupée aux limites transversales de la mer.
> Communes littorales : DGALN, loi Littoral (COG 2022).

L'obligation de logos sur le site est à arbitrer : elle concerne la représentation de la donnée ; un affichage de
distances calculées sans carte pourrait n'exiger que la mention. À vérifier auprès du Shom avant la mise en ligne.

## 14. Décisions encore ouvertes

| # | Question | Matière apportée par cette phase |
|---|---|---|
| D2 | Lagunes et bassins comptent-ils comme la mer ? | §9 : A sans convention ; B dépend d'une largeur de passe, qui fait basculer le golfe du Morbihan |
| D4 | « Pas le littoral » | trois lectures mesurables : classement Mer (839 communes), territoire ≤ X, centre ≤ X ; distributions §5 |
| D5 | Ancre « au bord de la mer » | classement Mer (839) contre centre ≤ 15 km (2 731) : écart de 1 900 communes |
| D6 | Façades | façade officielle rattachable ; notions du lecteur à définir |
| D9 | Tolérance de la géométrie adresse | §11 : 5 à 20 m, 3 à 5 Mo |
| D10 | Seuils | §5 : distributions nouvelles ; aucun ancien seuil reconduit |
| Nouveau | Classement juridique et arrondissements PLM | rattacher 13055 à ses arrondissements ? |
| Nouveau | 3 communes Mer sans contact (Landes, Carentan) | garder la loi comme vérité juridique et la géométrie comme vérité de distance, sans les mélanger |

## 15. Recommandations pour la phase 2

1. **Figer le pipeline** : publier `rivage-marin` simplifié (tolérance à choisir) et un fichier `mer-communes`
   compact (`mer_centre_km`, `mer_territoire_km`, `loi_littoral`) comme artefacts de construction ; brancher
   `build-comparateur-index.mjs` dessus sans retirer `distance_cote_km` dans un premier temps.
2. **Trancher D2, D5, D10 sur ces chiffres**, avant tout code de règle.
3. **Brancher le décisionnel** derrière les nouveaux champs (filtres, classement, ancres, règles du dossier),
   avec des tests sur le texte rendu ; capacité inchangée (D3 reste hors périmètre).
4. **Distance à l'adresse** : porter le calcul en Node, mesurer la latence, puis seulement envisager « à moins de
   N km de la mer » tranchable à l'adresse.
5. **Éditorial et façades** ensuite (catégories, carte d'identité, textes climat découplés).
6. Revoir la liste juridique au millésime 2025 annoncé par l'Observatoire des territoires.
