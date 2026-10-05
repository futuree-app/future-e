# FUT-43 : les données Territoire de Paris, Lyon, Marseille au grain commune (06/10/2026)

## Défaut reproduit (main 470cc10d)

`loadTerritoireSnapshot("75056")` appelait `getTerritoryContext("75056")`. L'index ne porte que les
arrondissements, donc `entry = null`. Paris, Lyon et Marseille perdaient alors :
- population ;
- rôle urbain ;
- démographie ;
- position ;
- couvert naturel ;
- trait distinctif.

La synthèse retombait sur « les données disponibles ne permettent pas de décrire ce point ».

Second défaut, de même cause : le nom d'une agglomération est celui de sa commune la plus peuplée de
l'index. Celle de Paris s'appelait donc « Paris 15e Arrondissement » (425 communes), celle de Lyon
« Villeurbanne » (130), celle de Marseille « Aix-en-Provence » (65). Montreuil se lisait
« dans l'agglomération de Paris 15e Arrondissement ».

## Matrice fait / source / grain / stratégie

| Fait | Source | Grain disponible | Stratégie PLM |
|---|---|---|---|
| population | index (INSEE 2021) | arrondissement | **somme** (`populationCommunalePLM`) ; un arrondissement manquant = inconnu |
| unité urbaine, population de l'UU | index (INSEE UU 2020) | arrondissement (identique dans toute la ville) | **commune directe** si tous les arrondissements concordent |
| nom de l'agglomération, rôle | index | arrondissement | les arrondissements concourent **ensemble, au nom de la ville** |
| taux démographique 2015-2021 | index (INSEE) | arrondissement | **recalcul sur les sommes** : P2015 = P2021 / (1 + t)^6, puis t = (ΣP2021 / ΣP2015)^(1/6) − 1 |
| part d'arrivants | index (INSEE, IRAN) | arrondissement | **absent** : un déménagement entre arrondissements y compte comme une arrivée d'ailleurs |
| récit démographique | dérivé | — | « perd » seulement (taux < −0,15 %/an) ; « gagne / stable » exigent les arrivants, donc absents |
| densité | ADEME | aucune ligne ville ; arrondissement `null` ; aucune superficie dans l'index | **absent** |
| couvert naturel (OSO) | index | `null` pour les 45 arrondissements | **absent** |
| position (mer, relief, altitude) | index | un point par arrondissement, variable (Marseille) | **absent** (un point ne s'agrège pas) |
| trait distinctif | percentiles de l'index | arrondissement | **absent** (un percentile ne s'additionne pas) |
| vieillissement, vacance, boisement | ADEME | aucune ligne ville ; arrondissement `null` | **absent** |
| résidences secondaires | INSEE | commune | inchangé (déjà présent) |
| DRIAS | jeu local | règles PLM propres | inchangé (déjà présent) |
| CatNat direct, risques GASPAR | Géorisques | commune (`codeGaspar`, FUT-60) | inchangé |
| compte inondation de l'index | index (FUT-60) | identique dans chaque arrondissement | inchangé (lecture spécifique FUT-60 conservée) |
| zonage sismique | Géorisques | arrondissement seulement | hors lot (déjà noté par FUT-60) |
| radon | Géorisques | arrondissement, variable | hors du snapshot Territoire ; `codePourSourceParArrondissement` inchangé |

## Correction

- `src/lib/territoire/plm-communal.ts` (pur) contient :
  - `lectureCommunalePLM` (population, UU, taux) ;
  - `libellesAgglomeration` (nom de l'agglomération).
- `comparateur-vie.ts` :
  - `getLectureCommunalePLM` pour les trois villes ;
  - `buildUuLabels` délègue à `libellesAgglomeration`.
- `territoire-snapshot.ts` : la lecture communale remplit `entry` et `urbanRole` quand l'index n'a pas
  la commune. Le reste est explicitement `null`.
- `facts.ts` : une position dont aucun champ n'est connu est une absence, pas un objet vide.

## Effet sur le cache

- Le snapshot reste **communal** : il ne reçoit ni adresse ni arrondissement, donc deux lecteurs de
  Paris partagent la même empreinte.
- Les empreintes de Paris, Lyon et Marseille changent : la synthèse Territoire de ces trois villes sera
  régénérée à la prochaine visite.
- Les communes des trois agglomérations voient leur `uuLabel` changer. Il y en a 575 dans l'index, hors les 45 arrondissements
  (Montreuil : « Paris 15e Arrondissement » → « Paris »). Leur synthèse Territoire est donc régénérée
  à la prochaine visite. C'est une correction voulue, mais elle a un coût modèle à la visite.
- `getTerritoryContext` n'est utilisé que par Territoire : le classement du comparateur ne change pas.

## Résultat (snapshots réels, sans modèle)

| | Population | Agglomération | Taux 2015-2021 | Récit |
|---|---|---|---|---|
| Paris | 2 133 111 | pôle, « Paris » (10,86 M) | −0,56 %/an | perd |
| Lyon | 522 250 | pôle, « Lyon » (1,70 M) | +0,29 %/an | — |
| Marseille | 873 076 | pôle, « Marseille » (1,63 M) | +0,22 %/an | — |
| Toulouse | inchangée (empreinte identique) | | | |

## Hors périmètre, constaté

- **Géorisques** ne répond qu'aux IP françaises : un VPN hors de France vide CatNat direct et
  Géorisques, Toulouse comprise.
- **ERA5 et assèchement des cours d'eau** sont absents pour les quatre villes, y compris Toulouse. Ce
  n'est donc pas une question de grain PLM.
- **Lyon et Marseille** n'ont pas de carte démographie : elle exige un récit, indéterminable sans les
  arrivants.
