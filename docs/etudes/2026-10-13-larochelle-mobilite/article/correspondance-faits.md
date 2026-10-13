# Correspondance des chiffres de l'article (V2) avec les faits finalisés

Document interne : ne figure pas dans l'article. Faits F1 à F11 : `RAPPORT.md`, section 7. Tables d'appui : `RAPPORT.md` sections 2.4 et 2.5, `resultats/`.

| Passage de l'article | Chiffre | Fait | Source exacte | Remarque |
|---|---|---|---|---|
| Chapô ; « La hausse se compte en kilomètres » | environ +0,75 €/L gazole ; 1,55 → 2,29 € ; SP95-E10 1,63 → 2,13 € ; début mars 2026 | F9 | `resultats/carburants_hebdo_la_rochelle_12km.csv`, `controle_prix_apparie.json` | Refaire l'extraction avant publication |
| Tableau | 90 / 270 / 630 € (gazole) ; 60 / 180 / 420 € (SP95-E10) | F10 | `resultats/scenarios_carburant.csv` | Scénario ; hypothèses dans le texte |
| « Une ville de vélo… » | 53 % voiture, 18 % vélo, 12 % TC, 11 % marche | F1 | `fiches/17300/fiche.json` (`mobpro.modes`) | |
| idem | 2e sur 82 communes pour le vélo, derrière Grenoble ; milieu pour la voiture | F2 | `resultats/communes_25k_80k_actifs.csv` | « Taille comparable » = 25 000 à 80 000 actifs occupés résidents |
| idem | 40 % ; vélo 17 % ; 5 % sans trajet | F4 | `RAPPORT.md` 2.3 | 17 % et 5 % : parts parmi les actifs d'un ménage motorisé |
| « D'un secteur à l'autre… » | Centre Préfecture, Mairie, Marché : moins de 30 % (27, 29, 29 %) ; Laleu 69, La Pallice 69, Mireuil Est 68, Villeneuve-les-Salines Ouest 71 % : « près de 70 % » | F6 | `resultats/iris_mobilite_2022.csv` | La Pallice et Centre Mairie / Marché viennent du même tableau que F6 |
| idem, Mireuil Est | 68 % ; commerce, pharmacie, école à 500 m pour presque toutes les adresses ; bus fréquents | F11 | `resultats/iris_mobilite_2022.csv` (0,675) ; `resultats/acces_resultats.json` (IRIS 173000503 : panier 98,7 %, ≥ 8 passages/h 99 %) | **Corrigé** : 68 % (la V1 et deux passages du rapport disaient 67 %) |
| idem, stationnement | un ménage sur quatre sans voiture (26,5 %) ; 14 à 17 % des ménages de l'hypercentre avec place réservée | F7 | `fiches/17300/fiche.json` (`iris.menages_commune`) ; `iris_mobilite_2022.csv` | Population : ménages |
| « Travailler à La Rochelle… » | 44 % / 72 % | F3 | `resultats/incertitudes_mobpro.csv` (0,441 ; 0,723) | Quatre communes exactement, sans Châtelaillon-Plage |
| idem | ~50 600 emplois ; 40 % hors unité urbaine ; 90 % en voiture ; unité urbaine de 11 communes | F8 | `fiches/17300/fiche.json` (`mobpro.qui_vient_travailler`) | « Habitant plus loin, elles parcourent en général davantage de kilomètres » : interprétation, non mesurée |
| Méthode | toutes les définitions | | `RAPPORT.md` 2.1, 2.5, 2.7, 2.9 | |

Chiffres de la V1 non repris : aucun n'était faux à part Mireuil Est ; la V2 ajoute F2, F7 et F8 et retire le détail du comptage des bus du corps du texte.
