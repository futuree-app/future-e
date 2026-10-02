# FUT-33, phase 1.5 : sécurisation de la vérité littorale

Date : 02/10/2026. Branche FUT-33, après `a1e24ca2` (phase 1). Rien n'est branché : aucun fichier produit modifié,
`distance_cote_km` et l'index de production inchangés.

Question posée : **la nouvelle vérité littorale est-elle assez sûre pour devenir une donnée de production ?**
Réponse courte : **oui, sous trois réserves documentées** (§13).

Ce qui a changé dans le pipeline pendant cette phase (et pourquoi) :
- **règle E, restes orphelins** : dans un estuaire codé par le Shom-IGN, quelques tronçons non codés (confluences,
  ouvrages) restaient isolés au milieu de rives retirées. 3,5 km de ligne au total, mais ils plaçaient
  Hastingues à 0,7 km de la mer (26 km en réalité), Quimper à 5 km (13 km). Une composante codée amont sur plus de
  90 % de sa longueur est désormais retirée entière. Un premier essai, qui comptait aussi la part retirée par le
  complément Seine, emportait la côte de Honfleur : la règle ne compte que le codage officiel ;
- **héritage PLM** du classement juridique (§4) ;
- outils d'audit : `audit_ltm.py`, `divergences.py`, `export_node.py`, `adresse-node.mjs`.

Chiffres nationaux après ces corrections : 864 communes touchent le rivage marin ; 1 132 ont leur centre à 5 km ou
moins ; 1 566 ont leur territoire à 5 km ou moins (détail §7).

---

## 1. Les 53 fermetures LTM incertaines et la fermeture non accrochée

**Méthode** (`scripts/mer/audit_ltm.py`, résultat versionné `fixtures/audit-ltm.json`). Pour chaque fermeture, on
prend les morceaux de rivage conservés qui touchent ses extrémités (ses « côtés ») et on simule le retrait du plus
court, le candidat « amont ». On recalcule alors la distance de tous les centres communaux à moins de 30 km. C'est
le **pire cas** : si l'amont avait été mal laissé, voici ce qui changerait.

Classes : **A**, effet maximal inférieur à 0,5 km ; **B**, effet d'au plus 3 km ; **C**, au-delà.

| Classe | Nombre |
|---|---|
| A, sans effet pratique | **48** |
| B, effet possible mais local | **5** |
| C, effet fort dans la simulation | **1** |

Les 48 A sont surtout de petites fermetures (3 à 100 m), dont une vingtaine dans les étangs palavasiens, et
quelques-unes en Rance, Somme, Arcachon, Morbihan, Charente ; s'y ajoutent la fermeture de la Seine (4,8 km, déjà
traitée par le complément) et la non accrochée (-2,57 ; 48,57, 7,6 m, sans effet).

**Examen des 6 cas B et C.** Le simulateur retire le côté le plus court ; il faut vérifier si ce côté est un fleuve
(erreur réelle) ou une côte (simulation sans objet).

| Fermeture | Largeur | « Côté court » simulé | Communes touchées | Nature réelle du côté court | Verdict |
|---|---|---|---|---|---|
| Baie des Veys (-1,148 ; 49,363), limite 14-50 | 4,3 km | 60 km | Vierville-sur-Mer, Saint-Laurent-sur-Mer, Ver-sur-Mer (+6 km) | **côte** (plages du Débarquement) ; l'amont (Isigny, Carentan) est déjà retiré par le codage | aucune erreur |
| Gironde (-1,027 ; 45,575), limite 17-33 | 5,4 km | 81 km | Royan, Les Mathes, Saint-Georges-de-Didonne (+2,5 km) | **côte** de Royan | aucune erreur |
| Loire (-2,179 ; 47,274) | 1,9 km | 35,5 km | La Baule, Trignac, Saint-André-des-Eaux (+2 km) | **côte** de La Baule et Brière en aval | aucune erreur |
| Charente (-1,077 ; 45,954) | 975 m | 15,4 km | Saint-Froult, Soubise (+1,1 km) | **côte** de Saint-Froult ; Rochefort est à 8 km | aucune erreur |
| Payré, Vendée (-1,646 ; 46,441) | 515 m | 4,1 km | Poiroux, Nieul-le-Dolent, Talmont (+0,8 km) | **rivière** probablement conservée | **erreur réelle, ≤ 0,8 km** |
| Bidassoa / baie de Txingudi (-1,791 ; 43,372), limite Espagne | 438 m | 7,8 km | Hendaye (+0,9 km) | **baie d'estuaire** conservée | **erreur réelle, ≤ 0,9 km** ; Hendaye touche l'océan de toute façon |

**Conclusion.** Aucun cas C réel. Deux erreurs locales réelles, d'au plus 0,9 km, sur des communes situées entre 3
et 22 km de la mer : elles ne peuvent rendre côtière aucune ville intérieure. Pas de correction proposée pour ces
deux cas (gain inférieur à un kilomètre) ; on peut les ajouter plus tard à `COMPLEMENTS` si un usage le justifie.
Test : aucune commune de plus de 20 000 habitants ne bouge de plus de 2,5 km dans ces simulations.

## 2. Les communes sans classement juridique qui touchent le rivage

Après la règle E, elles sont **20** (et non plus 28) : Quimper, Quimperlé, Plomelin, Langoat et quatre communes de
l'Adour sortent de la liste, car leur « contact » venait des restes orphelins. Après héritage PLM (§4), il en reste
**13**. Liste complète (`fixtures/divergences.json`) :

| Commune | Contact avec le rivage | Nature des tronçons touchés | Classification | Lecture |
|---|---|---|---|---|
| Marseille 1er, 2e, 7e, 8e, 9e, 15e, 16e | 0,35 à 50 km | côte | **arrondissement PLM** | classement porté par 13055 (Mer) ; résolu par l'héritage |
| Saint-Jean-d'Angle (17) | 21 m | fermeture LTM | **contact ponctuel avec une fermeture** | touche la limite transversale d'un chenal ; divergence de construction, sans portée |
| Beauvoisin (30) | 32 m | fermeture LTM | **contact ponctuel avec une fermeture** | idem (voisine d'une commune d'estuaire) |
| Harfleur (76) | 108 m | aval LTM + fermeture | **commune d'estuaire** touchant la limite transversale de la Seine | divergence légitime : la loi ne la classe pas |
| Martin-Église, Rouxmesnil-Bouteilles (76) | 39-49 m | aval LTM + fermeture | **communes d'estuaire** (Arques, à Dieppe) | idem |
| Coudekerque-Branche (59) | 69 m | rivage non codé | **contact ponctuel**, bassins du port de Dunkerque | divergence de contour |
| Saint-Georges-de-Gréhaigne (35) | 479 m | aval LTM (1,3,6) | **rétro-littorale** sur la baie du Mont-Saint-Michel | divergence légitime : rivage réel, commune non classée par la loi |
| La Fresnais (35) | 483 m | rivage non codé | **rétro-littorale**, marais de Dol / baie | divergence légitime |
| Saint-Molf (44) | 12,2 km | rivage non codé | **rétro-littorale**, traict de Pen-Bé (marais salants) | divergence légitime la plus nette : contact long, commune non classée |
| Eu (76) | 2,4 km | rivage non codé | **rétro-littorale**, embouchure de la Bresle | divergence légitime ou **référentiel juridique à vérifier** |
| Alénya (66) | 2,9 km | rivage non codé | **rétro-littorale**, plaine du Tech | **à vérifier** (contour ou référentiel) |
| Puget-sur-Argens (83) | 1,2 km | rivage non codé | **commune d'estuaire**, basse vallée de l'Argens | divergence légitime ou référentiel |
| Bastelicaccia (2A) | 640 m | rivage non codé | **rétro-littorale**, golfe d'Ajaccio | **à vérifier** (contour) |

**Lecture.** La géométrie n'est fausse dans aucun cas de façon démontrée : les contacts courts (moins de 100 m)
viennent de la façon dont les contours IGN rejoignent une fermeture ; les contacts longs correspondent à des
communes rétro-littorales ou d'estuaire que la loi ne classe pas. Les deux sources répondent à deux questions :
« où est l'eau de mer » et « quelle commune la loi soumet-elle à ses règles ». Elles ne doivent pas être forcées à
coïncider. Trois cas (Eu, Alénya, Bastelicaccia) méritent une vérification sur carte avant une éventuelle
utilisation éditoriale ; aucun ne change une distance.

Côté juridique, 2 communes classées Mer ne touchent pas le rivage : Parentis-en-Born (6,3 km) et Sanguinet (4,1 km),
classées « Lac, Mer » par la DGALN. Carentan-les-Marais n'est plus une exception.

## 3. Millésime de la liste loi Littoral

| Jeu | Source | Accès | Contenu | Verdict |
|---|---|---|---|---|
| COG 2022 (DGALN-SIDAUH) | data.gouv.fr, ressource `5da30edb…` | xlsx 65 Ko, téléchargé | INSEE + **Mer / Estuaire / Lac** ; 1 078 communes métropolitaines | utilisé |
| COG 2025 (Observatoire des territoires, ANCT) | `GC_API_download.php?type=stat&nivgeo=com2025&dataset=typo_loilitt&indic=loilitt_simp` | xlsx 860 Ko, téléchargé et reproductible | INSEE + **« C » / « NC » seulement**, 1 174 communes classées (outre-mer compris) | **moins riche** : ne distingue pas Mer, Estuaire, Lac |
| « Communes de la loi littoral » (Ministère, data.gouv mis à jour le 10/06/2026) | lien vers un ancien fichier .xls de l'Observatoire | le lien renvoie une page HTML | aucun | **inexploitable** |

**Comparaison 2022 / 2025 (métropole).** Même ensemble de communes classées : 1 066 en 2025 contre 1 067 en 2022,
la seule différence étant Annoville (50015), absorbée par une fusion de communes et déjà absente de l'index
futur•e. Aucune commune nouvellement classée. Les 45 codes de l'index absents du fichier 2025 sont les 45
arrondissements PLM.

**Décision.** Garder le **COG 2022 pour la typologie Mer / Estuaire / Lac** (seule source ouverte qui la donne),
et utiliser le **COG 2025 comme contrôle d'appartenance** (identique à ce jour). À la prochaine fusion de communes
touchant une commune classée, la jointure 2022 devra passer par la table de passage du COG.

## 4. Doctrine Paris, Lyon, Marseille

**Proposition retenue.**
- La **qualification juridique est communale** : un arrondissement en hérite. Le champ porte son origine :
  `loi_effective = ["Mer"]`, `loi_source_commune = "13055"`, `loi` (brut) reste nul pour l'arrondissement.
- Les **distances restent locales** : chaque arrondissement garde sa propre distance du centre et du territoire
  (Marseille 7e : 0 km ; 11e : 7,8 km ; 16e : 0,5 km).

**Cohérence vérifiée.**
- Même règle que `communeParent` (`src/lib/plm.ts`), déjà utilisée à 27 endroits : la correspondance
  arrondissement → commune n'est pas une règle cachée nouvelle, elle est reprise telle quelle
  (`commune_parent` dans `build_mer.py` en recopie les bornes).
- Même partage qu'en FUT-8 pour la population : la commune porte ce qui est communal (population communale,
  classement juridique), l'arrondissement porte ce qui se mesure sur place (distances).
- Paris et Lyon héritent de « aucun classement » ; la commune entière est à 143 km (Paris) et 233 km (Lyon) de la
  mer par son territoire. Rien de nouveau, mais la règle est la même pour les trois.

## 5. D2 : le rivage marin canonique

**Proposition à figer** : la donnée canonique mesure la distance au rivage marin défini par la LimTM coupée aux
LTM, sans séparation géométrique supplémentaire entre mer ouverte, golfe, bassin, lagune ou étang salé. Pas de
largeur de passe, pas de scénario B en production.

**Vérification sur les cas de référence** : aucune incohérence technique. Arcachon, Vannes, Sète, La Grande-Motte,
Mauguio touchent le rivage ; Montpellier est à 6,9 km (centre) et 3,1 km (territoire), via les étangs.

**Signalement avant de figer.** Deux situations montrent ce que la décision implique pour le lecteur :
- **Narbonne** : centre de la commune à 1,6 km du rivage marin, par l'étang de Bages-Sigean (point le plus proche
  au sud de la ville), alors que la plage (Narbonne-Plage) est à une douzaine de kilomètres de la ville ;
- **Istres, Martigues, Marignane, Berre-l'Étang** : « au bord de la mer » par l'étang de Berre.

Ce n'est pas une erreur de donnée : ces étangs sont du rivage marin au sens de la LimTM et de la loi. Mais cela
confirme que « distance à la mer » ne peut jamais être traduite en « plage », « baignade » ou « océan ». La
décision D2 peut être figée **à condition** que la phase 2 interdise ces traductions dans les libellés.

## 6. D5 : ancre « au bord de la mer » (étude, rien n'est codé)

**Avertissement.** La colonne « intuition » est un jugement produit à discuter, pas une donnée.

| Commune | Loi Mer | Centre | Territoire | Intuition « ville au bord de la mer » |
|---|---|---|---|---|
| Brest | oui | 1,4 | 0 | oui |
| Lannion | oui | 0,7 | 0 | oui |
| Morlaix | oui | 3,2 | 0 | plutôt oui (port au fond d'une baie) |
| Perros-Guirec | oui | 0 | 0 | oui |
| La Rochelle | oui | 1,0 | 0 | oui |
| Châtelaillon-Plage | oui | 1,0 | 0 | oui |
| Saint-Malo | oui | 0,3 | 0 | oui |
| Saint-Nazaire | oui | 1,7 | 0 | oui |
| Arcachon | oui | 1,3 | 0 | oui |
| Biarritz | oui | 1,1 | 0 | oui |
| Nice | oui | 1,1 | 0 | oui |
| Marseille (7e) | hérité | 0 | 0 | oui |
| Toulon | oui | 1,6 | 0 | oui |
| Le Havre | oui | 0,4 | 0 | oui |
| Dieppe | oui | 0,3 | 0 | oui |
| Calais | oui | 0,7 | 0 | oui |
| Dunkerque | oui | 1,8 | 0 | oui |
| Cherbourg-en-Cotentin | oui | 1,3 | 0 | oui |
| Ajaccio | oui | 1,6 | 0 | oui |
| Lorient | oui | 1,5 | 0 | oui (rade) |
| Vannes | oui | 0,8 | 0 | discutable : sur le golfe, pas sur l'océan |
| Sète | oui | 0 | 0 | oui |
| Royan | oui | 1,5 | 0 | oui |
| Les Sables-d'Olonne | oui | 3,2 | 0 | oui |
| Cannes | oui | 0 | 0 | oui |
| Fréjus | oui | 3,8 | 0 | oui |
| La Teste-de-Buch | oui | 2,8 | 0 | plutôt oui (bassin) |
| Agde | oui | 3,2 | 0 | partiellement (Le Cap-d'Agde oui, le centre ancien non) |
| Narbonne | oui | 1,6 | 0 | **non** (la ville est à 12 km de la plage ; l'étang est proche) |
| Montpellier | non | 6,9 | 3,1 | non |
| Caen | non | 9,2 | 6,5 | non |
| Quimper | non | 13,3 | 6,1 | non |
| Bordeaux | non | 39,4 | 35,1 | non |
| Nantes | non | 38,9 | 31,0 | non |
| Lacanau, Carcans, Hourtin (33) | oui | 8,5 / 11,9 / 9,8 | 0 | non pour le bourg, oui pour la station |
| Arles | oui | 13,4 | 0 | **non** (commune immense jusqu'à la Camargue) |

**Effectifs nationaux.**

| Règle | Communes |
|---|---|
| loi Mer (après héritage PLM) | 855 |
| centre ≤ 2 km | 546 |
| centre ≤ 5 km | 1 132 |
| centre ≤ 8 km | 1 652 |
| centre ≤ 15 km | 2 673 |
| loi Mer **et** centre ≤ 2 km | 530 |
| loi Mer **et** centre ≤ 5 km | 810 |
| loi Mer **et** centre ≤ 8 km | 843 |
| loi Mer **et** centre ≤ 15 km | 855 |

**Lecture.**
- « Loi Mer » seul garde Arles, Lacanau, Carcans, Narbonne : grandes communes dont le bourg est loin de la côte.
- « Centre ≤ N » seul ajoute des communes non littorales (Montpellier à 8 km, Caen à 10 km, Aubagne à 9 km).
- **« Loi Mer et centre ≤ 5 km »** (810 communes) correspond le mieux, dans ce panel, à l'intuition d'une ville au
  bord de la mer : elle écarte Arles, Lacanau et Carcans, garde Morlaix, Fréjus, les Sables-d'Olonne, Agde. Elle ne
  règle pas Narbonne (étang, D2), ni Vannes (golfe).
- À décider en phase 2 ; rien n'est codé.

## 7. D10 : distributions par seuil

| Seuil | Centre (cumul) | Territoire (cumul) | Exemples qui entrent dans la tranche (centre) | Sens possible |
|---|---|---|---|---|
| 1 km | 258 | 945 | Le Havre 0,4 ; La Rochelle 1,0 ; Calais 0,7 | bord de mer |
| 2 km | 546 | 1 084 | Nice 1,1 ; Toulon 1,6 ; Brest 1,4 ; Dunkerque 1,8 | bord de mer |
| 5 km | 1 132 | 1 566 | Marseille 9e, 10e, 14e, 15e (2 à 3,5) | très proche |
| 8 km | 1 652 | 2 038 | Montpellier 6,9 ; Perpignan 7,3 | proche |
| 10 km | 1 944 | 2 319 | Caen 9,2 ; Aubagne 8,7 ; Salon-de-Provence 9,8 | proche |
| 15 km | 2 673 | 3 046 | Aix-en-Provence 14,5 ; Béziers 12,2 ; Quimper 13,3 ; Arles 13,4 | proximité régionale |
| 20 km | 3 353 | 3 654 | Gardanne 17,2 ; Vidauban 17,4 ; Saintes (territoire 18,3) | influence régionale |
| 30 km | 4 539 | 4 876 | Nîmes 21 ; Pessac 28,6 ; La Roche-sur-Yon 29,6 | influence régionale |
| 50 km | 6 859 | 7 162 | Nantes 38,9 ; Bordeaux 39,4 ; Rennes 47,6 ; Rouen 48,2 | arrière-pays |
| 100 km | 12 187 | 12 453 | Lille 62 ; Amiens 53 ; Roubaix 63 | loin de la mer |

Les distributions complètes et les six plus grandes communes de chaque tranche sont dans
`fixtures/resume-mesures.json` (clé `rapport.d10`). Aucune tranche n'est une décision.

## 8. Prototype Node pour l'adresse

`scripts/mer/adresse-node.mjs` : charge un rivage simplifié (segments Float32 en Lambert 93), le projette sans
dépendance (formules IGN de la conique conforme Lambert 93), indexe en grille de 5 km et cherche par anneaux.
Panel : 5 000 points (4 000 tirés à moins de 30 km d'un point du rivage, 1 000 entre 30 et 120 km), distance exacte
calculée sur la géométrie source par Shapely.

| Tolérance | Segments | Fichier | Gzip | Initialisation | Mémoire (structures) | Latence p50 / p95 / max | Erreur moyenne / p99 / max |
|---|---|---|---|---|---|---|---|
| 5 m | 410 002 | 6,6 Mo | 2,5 Mo | 36 ms | 8,3 Mo | 0,12 / 0,45 / 4,0 ms | 0,53 / 3,8 / 4,9 m |
| 10 m | 289 808 | 4,6 Mo | 1,9 Mo | 25 ms | 5,9 Mo | 0,09 / 0,32 / 2,7 ms | 0,99 / 7,4 / 10,0 m |
| 20 m | 227 195 | 3,6 Mo | 1,5 Mo | 31 ms | 4,6 Mo | 0,07 / 0,25 / 1,3 ms | 1,99 / 15,1 / 19,5 m |

L'erreur maximale égale la tolérance, projection comprise : la projection embarquée est exacte au point de
définition (test). Les trois niveaux sont très largement sous un seuil d'un kilomètre ; **10 m** est un bon compromis
(1,9 Mo compressé, erreur au plus 10 m). Le choix reste à faire (D9). Rien n'est mis dans `src/lib`.

## 9. Attribution et licence

**Ce qui est certain** (documents officiels lus) :
- la LimTM est diffusée sous **Licence Ouverte 2.0** (descriptif Shom, §5.3) ;
- la Licence Ouverte 2.0 autorise explicitement à « adapter, modifier, extraire et transformer » pour créer des
  « Informations dérivées », à titre commercial, **sous réserve de mentionner la paternité : la source (au moins le
  nom du concédant) et la date de dernière mise à jour** ; un lien vers la source suffit ; la mention ne doit pas
  suggérer une caution du producteur ;
- le descriptif Shom ajoute, pour une réutilisation « dans des bases de données ou services intégrés » : la mention
  « © Shom-IGN, 2021, http://dx.doi.org/10.17183/LIMTM », l'**indication des limites d'usage**, et la
  « **représentation sur site internet** accompagnée obligatoirement des logos du Shom et de l'IGN » avec lien.

**Ce qui n'est pas certain** :
- si une **distance dérivée**, sans carte ni tracé, est une « représentation sur site internet » au sens du
  descriptif. Le texte ne le dit pas ;
- si les conditions du descriptif s'ajoutent à la Licence Ouverte ou la précisent seulement (la Licence Ouverte ne
  prévoit, elle, que la mention de paternité).

**Mentions minimales proposées pour un fait dérivé**, conformes aux deux textes à coup sûr :

> Distance à la mer calculée par futur•e à partir de la Limite terre-mer © Shom-IGN, 2021
> (http://dx.doi.org/10.17183/LIMTM), coupée aux limites transversales de la mer. Donnée non destinée à la
> navigation. Communes littorales : DGALN, loi Littoral.

**À faire avant la mise en ligne** : demander au Shom (et à l'IGN) si l'affichage d'une distance dérivée, sans
représentation de la ligne, impose les logos. Ne pas conclure d'ici là.

## 10. Risques résiduels

| Risque | Gravité | État |
|---|---|---|
| Payré et Txingudi : rive ou baie d'estuaire conservée | faible (≤ 0,9 km) | documentés, non corrigés |
| Narbonne, étang de Berre : « mer » par une lagune | moyenne (sens, pas donnée) | à traiter dans les libellés (D2) |
| Grandes communes juridiquement Mer au bourg lointain (Arles, Lacanau) | moyenne pour D5 | traité si D5 = « Mer et centre ≤ N » |
| Complément Seine manuel | faible | contrôlé par 6 points de côte ; à revoir à chaque nouvelle LimTM |
| Typologie juridique au COG 2022 | faible | contrôlée par le COG 2025 (identique) |
| Logos Shom-IGN | à clarifier | question au producteur |
| Coût de construction | faible | 10 min, 2 Go de sources, hors production |

## 11. Décisions figées

- **D1** : LimTM coupée aux LTM, règles A à E, complément Seine.
- **D2** : rivage marin = LimTM coupée, lagunes et bassins compris, sans largeur de passe (avec l'interdiction de
  traduire en « plage », « baignade », « océan »).
- **D8** : champs distincts `mer_centre_km`, `mer_territoire_km`, `loi_littoral` (brut), `loi_effective` et
  `loi_source_commune`.
- **Doctrine PLM** : classement communal hérité avec son origine, distances locales.
- **Source juridique** : COG 2022 pour la typologie, COG 2025 en contrôle.

## 12. Décisions encore ouvertes

| # | Question | Matière |
|---|---|---|
| D4 | « Pas le littoral » | §7 : classement Mer (855), territoire ≤ X, centre ≤ X |
| D5 | Ancre « au bord de la mer » | §6 : « Mer et centre ≤ 5 km » paraît la plus proche de l'intuition |
| D6 | Façades | façade officielle rattachable (phase 1) ; notions du lecteur à définir |
| D9 | Tolérance adresse | §8 : 10 m proposé |
| D10 | Seuils | §7 |
| Licence | logos | §9 : question au Shom |

## 13. Go / No-Go pour brancher le référentiel dans l'index

**Go pour commencer la phase 2**, au sens strict : générer les nouveaux champs dans l'index (à côté de
`distance_cote_km`, sans le retirer), et préparer le branchement des règles. Les raisons :
- aucune fermeture incertaine ne peut rendre côtière une ville intérieure (§1) ;
- les divergences avec la loi sont expliquées et ne révèlent aucune erreur de géométrie démontrée (§2) ;
- les estuaires des grandes villes sont coupés et testés (Bordeaux, Nantes, Caen, Rouen, Rochefort, Adour, Odet) ;
- le calcul à l'adresse est léger et précis (§8).

**Réserves, à lever avant tout changement visible pour le lecteur** :
1. trancher D5 et D10 (et D4) sur ces chiffres ;
2. écrire les libellés en respectant D2 (jamais « plage » ni « océan ») ;
3. obtenir la réponse du Shom sur les logos, ou afficher d'emblée les logos par prudence.
