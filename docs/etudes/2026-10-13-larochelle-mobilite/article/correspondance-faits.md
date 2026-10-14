# Correspondance des chiffres de l'article avec les faits finalisés

Document interne : ne figure pas dans l'article. Version courante : `article-v3.md` (13/10/2026, passe contre la surjustification). Faits F1 à F11 : `RAPPORT.md`, section 7. Tables d'appui : `RAPPORT.md` sections 2.4 et 2.5, `resultats/`.

| Passage de l'article (v3) | Chiffre | Fait | Source exacte | Remarque |
|---|---|---|---|---|
| Chapeau ; « Ce que la hausse coûte » | environ +0,75 €/L gazole ; 1,55 → 2,29 € ; SP95-E10 1,63 → 2,13 € | F9 | `resultats/carburants_hebdo_la_rochelle_12km.csv`, `controle_prix_apparie.json` | Refaire l'extraction avant publication. « Début mars 2026 » (v2) retiré : n'apportait rien au lecteur |
| Tableau | 90 / 270 / 630 € (gazole) ; 60 / 180 / 420 € (SP95-E10) | F10 | `resultats/scenarios_carburant.csv` | Scénario ; hypothèses dans la phrase d'introduction et en méthode |
| « Une ville de vélo… » | 53 % voiture, 18 % vélo, 12 % TC, 11 % marche | F1 | `fiches/17300/fiche.json` (`mobpro.modes`) | Millésime 2022 posé une fois, à la transition qui précède |
| idem | 2e sur 82 communes pour le vélo, derrière Grenoble ; milieu pour la voiture | F2 | `resultats/communes_25k_80k_actifs.csv` | « Taille comparable » défini en méthode |
| idem | 40 % ; 17 % à vélo | F4 | `RAPPORT.md` 2.3 | Parts parmi les actifs d'un ménage motorisé ; les 40 % incluent les 5 % sans trajet (« ne la déclarent pas comme mode principal » reste exact) |
| « D'un quartier à l'autre, de 27 % à 71 % » | Titre : 27 % (Centre Préfecture) et 71 % (Villeneuve des Salines Ouest) ; centre < 30 % (27, 29, 29 %) ; Laleu 69, La Pallice 69, Mireuil Est 68, Villeneuve-les-Salines Ouest 71 % : « près de 70 % » | F6 | `resultats/iris_mobilite_2022.csv` | |
| idem, Mireuil Est | 68 % ; commerce, pharmacie, école à 500 m pour presque toutes les adresses ; bus fréquents le matin | F11 | `resultats/iris_mobilite_2022.csv` (0,675) ; `resultats/acces_resultats.json` (IRIS 173000503 : panier 98,7 %, ≥ 8 passages/h 99 %) | v3 : constat de proximité seulement ; « les courses et l'école se font près de chez soi » (usage non mesuré) retiré. « À vol d'oiseau » rétabli (13/10) : la distance n'est pas un trajet à pied |
| idem, stationnement | un ménage sur quatre sans voiture (26,5 %) ; 14 à 17 % des ménages de l'hypercentre avec place réservée | F7 | `fiches/17300/fiche.json` (`iris.menages_commune`) ; `iris_mobilite_2022.csv` | Population : ménages |
| « Travailler à La Rochelle… » | 44 % / 72 % | F3 | `resultats/incertitudes_mobpro.csv` (0,441 ; 0,723) | **Quatre communes exactement** (Aytré, Lagord, Périgny, Puilboreau), sans Châtelaillon-Plage. Ce n'est PAS le fait `communes_voisines` de la fiche (0,732, cinq communes) |
| idem | ~50 600 emplois ; 40 % hors unité urbaine ; 90 % en voiture ; unité urbaine de 11 communes | F8 | `fiches/17300/fiche.json` (`mobpro.qui_vient_travailler`) | v3 : la déduction « plus loin, donc plus de kilomètres, donc le surcoût le plus élevé » est retirée ; le tableau suffit pour l'effet de la distance |
| Méthode | toutes les définitions | | `RAPPORT.md` 2.1, 2.5, 2.7, 2.9 | « Les petits écarts entre secteurs ne doivent pas être surinterprétés » remplace « pas significatifs » (13/10) |
| « Votre projet, votre adresse » (ex « Et pour une adresse précise ? ») | aucun | | `redaction/parametres_editoriaux.md`, capacité « Examen d'une adresse à partir du projet » | 13/10 : temps de trajet retiré. 14/10 : conclusion harmonisée avec Niort (projet du lecteur, adresse examinée dans son ensemble, lien `/dossier`) ; l'inventaire équipements / ménages motorisés est retiré |

Visuels : carte des secteurs (F6, section des quartiers) ; graphique 44 % / 72 % (F3) et, à côté, carte de situation des quatre communes du graphique (aucune donnée, contours IGN fusionnés).

Chiffres de la v2 non repris en v3 : « 5 % n'ont pas de trajet » (inclus dans les 40 %), date de début de la hausse.
