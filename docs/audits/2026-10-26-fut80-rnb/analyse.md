# Mesure FUT-80 — 2026-10-26T18:24:18.425Z
Paramètres : {"PAR_STRATE":200,"N_COLLECTIF":220,"N_DPE":200,"graine":80}
Réseau : appels {"ademe":6249,"rnb":1825,"bdnb":250}, échecs {"ademe":525,"rnb":36,"bdnb":33}, médiane {"ademe":39,"rnb":85,"bdnb":123} ms, p95 {"ademe":79,"rnb":126,"bdnb":294} ms

## 1. Adresse BAN → bâtiment RNB, tirage uniforme (A)
| Strate | n | 0 bâtiment | 1 bâtiment | ≥ 2 bâtiments | indisponible |
| --- | --- | --- | --- | --- | --- |
| urbain_dense | 200 | 22 (11.0 %) | 155 (77.5 % [71.2 ; 82.7]) | 23 (11.5 %) | 0 |
| peri_urbain | 200 | 7 (3.5 %) | 149 (74.5 % [68.0 ; 80.0]) | 44 (22.0 %) | 0 |
| petite_ville | 200 | 23 (11.5 %) | 125 (62.5 % [55.6 ; 68.9]) | 52 (26.0 %) | 0 |
| rural | 200 | 37 (18.5 %) | 104 (52.0 % [45.1 ; 58.8]) | 59 (29.5 %) | 0 |
| TOTAL | 800 | 89 (11.1 %) | 533 (66.6 % [63.3 ; 69.8]) | 178 (22.3 %) | 0 |
Adresses à plusieurs bâtiments : 178, nombre de bâtiments médian 2, max 7.

## 1 bis. Adresse BAN → bâtiment RNB, adresses collectives (B)
| Strate | n | 0 bâtiment | 1 bâtiment | ≥ 2 bâtiments | indisponible |
| --- | --- | --- | --- | --- | --- |
| collectif_ademe | 190 | 5 (2.6 %) | 121 (63.7 % [56.6 ; 70.2]) | 64 (33.7 %) | 0 |
| TOTAL | 190 | 5 (2.6 %) | 121 (63.7 % [56.6 ; 70.2]) | 64 (33.7 %) | 0 |
Adresses à plusieurs bâtiments : 64, nombre de bâtiments médian 2, max 13.

## 2. DPE — tirage uniforme (A)
- adresses : 800 ; avec au moins un DPE par la jointure BAN actuelle : 162 (20.3 %)
- adresses SANS DPE par BAN mais avec un DPE du même bâtiment RNB : 31 (3.9 % [2.7 ; 5.4])
- adresses avec DPE par BAN ET des DPE supplémentaires du même bâtiment : 14
- DPE trouvés par BAN : 285 ; dont porteurs d'un id_rnb : 147 (51.6 %)
- parmi eux, id_rnb = un bâtiment RNB de l'adresse : 144/147 (98.0 % [94.2 ; 99.3])
- CONTRADICTIONS (DPE à l'adresse, id_rnb d'un AUTRE bâtiment) : 3 ; adresses concernées : 3
    · 59350_95c8dn_00329 (329 Avenue de Dunkerque 59160 Lille) — DPE 2559E3031611W Logiciel id_rnb=RMZRHHT613PM ; bâtiments de l'adresse aucun ; distance null m
    · 33407_0060_00005 (5 Place de l’Eglise 33240 Saint-Genès-de-Fronsac) — DPE 2633E0896581J Logiciel id_rnb=GME44AGV1XQG ; bâtiments de l'adresse aucun ; distance null m
    · 59407_0051_00055 (55 Rue du Chaufour 59224 Monchaux-sur-Écaillon) — DPE 2159N0072016M Reprise RNB id_rnb=Z4ZCPFA4P9P2 ; bâtiments de l'adresse JHR966BZVKDA ; distance 78.5 m
- DPE ajoutés par l'id_rnb seul (même bâtiment, pas même identifiant BAN) : 296
    · sans identifiant BAN : 0 ; avec un AUTRE identifiant BAN : 296
    · grains : logement 291, immeuble 5 ; provenance : Reprise RNB 259, Logiciel 37
    · dont sur une adresse à un seul bâtiment : 257 ; sur une adresse à plusieurs bâtiments : 39
    ex. 5 Rue Thiac 33000 Bordeaux ← DPE 2333E1517265S (logement, Reprise RNB) enregistré à 33063_8915_00003
    ex. 5 Rue Thiac 33000 Bordeaux ← DPE 2533E0448903Y (logement, Reprise RNB) enregistré à 33063_8915_00003
    ex. 5 Rue Thiac 33000 Bordeaux ← DPE 2533E1174743W (logement, Reprise RNB) enregistré à 33063_8915_00003
    ex. 5 Rue Thiac 33000 Bordeaux ← DPE 2633E2136094Y (logement, Logiciel) enregistré à 33063_8915_00003
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2444E1715653M (logement, Reprise RNB) enregistré à 44162_0027_00014
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2144E0363846U (logement, Reprise RNB) enregistré à 44162_0027_00016
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2144E0528475R (logement, Reprise RNB) enregistré à 44162_0027_00020
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2144E1032480M (logement, Reprise RNB) enregistré à 44162_0027_00016
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2244E0346959I (logement, Reprise RNB) enregistré à 44162_0027_00016
    ex. 23 Rue de Cahors 44800 Saint-Herblain ← DPE 2244E0193655A (logement, Reprise RNB) enregistré à 44162_0027_00020
- géométrie (DPE par BAN, adresse à ≥ 1 bâtiment) : point dans l'empreinte 125/275 (45.5 %) ; à ≤ 5 m 206 (74.9 %)
- adresses à ≥ 2 bâtiments avec DPE : 35 ; DPE répartis sur ≥ 2 bâtiments : 1

## 2 bis. DPE — adresses collectives (B)
- adresses : 190 ; avec au moins un DPE par la jointure BAN actuelle : 190 (100.0 %)
- adresses SANS DPE par BAN mais avec un DPE du même bâtiment RNB : 0 (0.0 % [0.0 ; 2.0])
- adresses avec DPE par BAN ET des DPE supplémentaires du même bâtiment : 53
- DPE trouvés par BAN : 2934 ; dont porteurs d'un id_rnb : 1430 (48.7 %)
- parmi eux, id_rnb = un bâtiment RNB de l'adresse : 1413/1430 (98.8 % [98.1 ; 99.3])
- CONTRADICTIONS (DPE à l'adresse, id_rnb d'un AUTRE bâtiment) : 17 ; adresses concernées : 8
    · 17444_0140_00043 (43 Rue de la République 17460 Thénac) — DPE 2617E2416271J Logiciel id_rnb=HQF38WX69PPC ; bâtiments de l'adresse ASTCYQ4TDP38 ; distance 182.6 m
    · 17444_0140_00043 (43 Rue de la République 17460 Thénac) — DPE 2617E2416705B Logiciel id_rnb=HQF38WX69PPC ; bâtiments de l'adresse ASTCYQ4TDP38 ; distance 182.6 m
    · 17444_0140_00043 (43 Rue de la République 17460 Thénac) — DPE 2617E2416987X Logiciel id_rnb=HQF38WX69PPC ; bâtiments de l'adresse ASTCYQ4TDP38 ; distance 182.6 m
    · 17444_0140_00043 (43 Rue de la République 17460 Thénac) — DPE 2617E2416460Q Logiciel id_rnb=HQF38WX69PPC ; bâtiments de l'adresse ASTCYQ4TDP38 ; distance 182.6 m
    · 13204_1213_00014 (14 Boulevard de la blancarde 13004 Marseille) — DPE 2613E0215648W Logiciel id_rnb=Y94DTHPDJHBP ; bâtiments de l'adresse 1N9B66X8E75C ; distance 0 m
    · 17283_0520_00040 (40 Rue du Marechal Leclerc 17800 Pons) — DPE 2617E0757416G Logiciel id_rnb=J11ZH55PEQSJ ; bâtiments de l'adresse Q36P34NPYNWH,6VN5PZ6NXBBX ; distance 0 m
    · 75114_8388_00007 (7 Impasse du Rouet 75014 Paris) — DPE 2675E2396536O Logiciel id_rnb=AN56VGVNYX71 ; bâtiments de l'adresse J4WT3PGRFN18,VTTWC8TKW7N8,SXCKZ5RMEZQA,B1A7FS1RMFE4,6Y67DVWTDY1C ; distance 0 m
    · 33063_xex497_00027 (27 Rue du Parc 33200 Bordeaux) — DPE 2633E1877821J Logiciel id_rnb=NVW2RQ4JMCQE ; bâtiments de l'adresse aucun ; distance null m
    · 33063_xex497_00027 (27 Rue du Parc 33200 Bordeaux) — DPE 2633E1875508K Logiciel id_rnb=NVW2RQ4JMCQE ; bâtiments de l'adresse aucun ; distance null m
    · 33063_xex497_00027 (27 Rue du Parc 33200 Bordeaux) — DPE 2633E1877822K Logiciel id_rnb=NVW2RQ4JMCQE ; bâtiments de l'adresse aucun ; distance null m
    · 33063_xex497_00027 (27 Rue du Parc 33200 Bordeaux) — DPE 2633E1877823L Logiciel id_rnb=NVW2RQ4JMCQE ; bâtiments de l'adresse aucun ; distance null m
    · 33063_xex497_00027 (27 Rue du Parc 33200 Bordeaux) — DPE 2633E1877820I Logiciel id_rnb=NVW2RQ4JMCQE ; bâtiments de l'adresse aucun ; distance null m
- DPE ajoutés par l'id_rnb seul (même bâtiment, pas même identifiant BAN) : 458
    · sans identifiant BAN : 1 ; avec un AUTRE identifiant BAN : 457
    · grains : logement 447, immeuble 11 ; provenance : Reprise RNB 394, Logiciel 64
    · dont sur une adresse à un seul bâtiment : 267 ; sur une adresse à plusieurs bâtiments : 191
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2121E0233437E (logement, Reprise RNB) enregistré à 21292_0400_00015
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2121E0552312P (logement, Reprise RNB) enregistré à 21292_0400_00013
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2221E2324589D (logement, Reprise RNB) enregistré à 21292_0400_00017
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2221E1847391J (logement, Reprise RNB) enregistré à 21292_0400_00015
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2321E0858876P (logement, Reprise RNB) enregistré à 21292_0400_00017
    ex. 19 Rue de Franche-comté 21110 Genlis ← DPE 2321E3958011C (logement, Reprise RNB) enregistré à 21292_0400_00017
    ex. 96 Rue du 1 Mars 1943 69100 Villeurbanne ← DPE 2569E3819625M (logement, Logiciel) enregistré à 69266_6wm7w4_00094
    ex. 33 Place Gambetta 33000 Bordeaux ← DPE 2233E0602691T (logement, Reprise RNB) enregistré à 33063_3810_00032
    ex. 33 Place Gambetta 33000 Bordeaux ← DPE 2233E1446619N (logement, Reprise RNB) enregistré à 33063_3810_00032
    ex. 6 Rue du Bourbonnais 35000 Rennes ← DPE 2135E0362130L (logement, Reprise RNB) enregistré à 35238_1105_00004
- géométrie (DPE par BAN, adresse à ≥ 1 bâtiment) : point dans l'empreinte 945/2865 (33.0 %) ; à ≤ 5 m 1881 (65.7 %)
- adresses à ≥ 2 bâtiments avec DPE : 64 ; DPE répartis sur ≥ 2 bâtiments : 7

## 3. DPE porteurs d'un id_rnb (C)
| Provenance | n | ID connu du RNB | bâtiment actif | ID ∈ bâtiments de l'adresse du DPE | adresse du DPE ∈ adresses du bâtiment | point dans l'empreinte | point ≤ 5 m | distance > 50 m |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Reprise RNB | 200 | 100.0 % | 99.5 % | 199/200 (99.5 % [97.2 ; 99.9]) | 100.0 % | 33.5 % | 73.0 % | 2.0 % |
| Logiciel | 200 | 100.0 % | 98.0 % | 152/200 (76.0 % [69.6 ; 81.4]) | 78.0 % | 27.0 % | 59.0 % | 8.5 % |

Désaccords Reprise RNB (1) : adresse du DPE sans bâtiment RNB 1 ; adresse à d'autres bâtiments 0
    · 2574E0701739Z 74258_0192_00110 bâtiments adresse=0 etat=constructed actif=false distance=0 m

Désaccords Logiciel (48) : adresse du DPE sans bâtiment RNB 20 ; adresse à d'autres bâtiments 28
    · 2606E1010877I 06033_0138_00100 bâtiments adresse=2 etat=constructed actif=true distance=12.9 m
    · 2513E3393014F 13001_rgpzrw bâtiments adresse=0 etat=constructed actif=true distance=4.7 m
    · 2533E3913340N 33063_2000_00078 bâtiments adresse=1 etat=constructed actif=false distance=0.8 m
    · 2474E3796263C 74043_0406_00021 bâtiments adresse=4 etat=constructed actif=true distance=11.9 m
    · 2617E0732713D 17093_0089 bâtiments adresse=0 etat=constructed actif=true distance=61.2 m
    · 2531E4034270P 31157_0392_00017 bâtiments adresse=1 etat=constructed actif=true distance=74.6 m
    · 2617E2052796O 17299_0993 bâtiments adresse=0 etat=constructed actif=true distance=33.3 m
    · 2506E1014881H 06104_0440 bâtiments adresse=0 etat=constructed actif=true distance=0 m

DPE dont l'adresse compte ≥ 2 bâtiments : 64 ; l'id_rnb est l'un d'eux : 58

## 4. BDNB (millésime de l'API ouverte) pour les bâtiments RNB trouvés
- bâtiments RNB : 1288 ; reliés à une construction BDNB : 1152 (89.4 %) ; avec groupe lu : 1132
- groupes BDNB distincts : 967 ; groupes contenant ≥ 2 bâtiments RNB de l'échantillon : 115
| Champ | renseigné | remarque |
| --- | --- | --- |
| annee_construction | 809/967 (83.7 %) | années « rondes » (siècle) : 59/809 |
| nb_niveau | 833/967 (86.1 %) |  |
| hauteur_mean | 948/967 (98.0 %) |  |
| nb_log | 833/967 (86.1 %) | écart > 20 % avec le RNIC sur 36/107 groupes où les deux existent |
| nb_log_rnc | 111/967 (11.5 %) |  |
| mat_mur_txt | 695/967 (71.9 %) | INDETERMINE : 138 |
| mat_toit_txt | 680/967 (70.3 %) |  |
| usage_principal_bdnb_open | 849/967 (87.8 %) | Résidentiel individuel: 590 ; null: 118 ; Résidentiel collectif: 168 ; Tertiaire: 78 ; Dépendance: 11 ; Secondaire: 2 |
| numero_immat_principal | 111/967 (11.5 %) |  |
| fiabilite_hauteur | 821/967 (84.9 %) | BONNE: 814 ; null: 146 ; FAIBLE: 2 ; MOYENNE: 5 |
| fiabilite_emprise_sol | 831/967 (85.9 %) | MOYENNE: 369 ; FAIBLE: 184 ; null: 136 ; BONNE: 278 |
| fiabilite_cr_adr_niv_1 | 950/967 (98.2 %) | données croisées à l'adresse fiables: 879 ; données croisées à l'adresse moyennement fiables: 62 ; données croisées à l'adresse fiables à l'echelle de la parcelle unifiee: 9 ; null: 17 |
- niveaux (Fichiers fonciers) cohérents avec la hauteur (BD TOPO, 2 à 4,5 m par niveau) : 622/821 (75.8 %)
