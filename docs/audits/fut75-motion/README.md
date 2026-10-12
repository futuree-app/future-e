# FUT-75 · Planche des prototypes motion

Atelier : `/dev/fut75` (développement uniquement), lancé avec `DOSSIER_NARRATIVE=false npm run dev`.
Données publiques uniquement : hôtel de ville de Nîmes (dossier d'adresse), médianes DRIAS-TRACC de
Nîmes, Rennes et Strasbourg, projet de test. Aucune donnée personnelle.

Chaque état se reproduit par l'URL : `a` variante (`production`, `reticule`, `recul`), `am` mouvement
(`systeme`, `anime`, `reduit`, `aucun`), `ae` état (`repos`, `territoire`, `autour`, `logement`), `ap`
dossier (`adresse`, `commune`) · `b` (`regle`, `trace`), `bm`, `bc` (code INSEE), `bh` (`gwl15`, `gwl20`,
`gwl30`) · `c` (`pas`, `trait`, `statique`), `cm`, `ce` (étape de -1 à 5).

## Vidéos (temps réel, interactions réelles)

Le bandeau « [banc FUT-75] » en bas de l'image est ajouté par l'enregistreur pour nommer chaque geste ;
il ne fait pas partie du prototype.

| Fichier | Durée | Ce qu'on y voit |
| --- | --- | --- |
| `videos/a-ordinateur-1280.mp4` | 27 s | ouverture tracée ; réticule au pointage ; pointages rapides ; ouverture interrompue ; clavier ; recul ; dossier communal en pointillé ; mouvement réduit |
| `videos/a-mobile-390.mp4` | 12 s | ouverture ; états imposés (pas de survol au toucher) ; dossier communal ; mouvement réduit |
| `videos/b-ordinateur-1280.mp4` | 21 s | 2030, 2100, 2050 ; trace de l'horizon quitté ; clavier ; choix rapides ; Rennes ; mouvement réduit |
| `videos/b-mobile-390.mp4` | 16 s | les mêmes gestes au toucher |
| `videos/c-ordinateur-1280.mp4` | 19 s | conclusion d'abord ; parcours pas à pas ; flèches ; « d'un trait » ; mouvement réduit |
| `videos/c-mobile-390.mp4` | 19 s | les mêmes gestes au toucher |

## Séquences figées (animations arrêtées à des instants précis)

| Fichier | Instants |
| --- | --- |
| `images/a-ouverture-sequence.jpg` | ouverture, dossier d'adresse : 0, 150, 300, 450, 600, 750, 900 ms |
| `images/a-ouverture-communal-sequence.jpg` | ouverture, dossier communal (pointillés posés, non tracés) : 0 à 600 ms |
| `images/c-trait-sequence.jpg` | le rail de C2 : 0 à 900 ms (convergence, puis séparation) |

## Images de chaque variante (état final, sans animation)

| Fichier | URL |
| --- | --- |
| `images/a0-production-repos.jpg` | `?a=production&ae=repos&am=aucun` |
| `images/a1-reticule-repos.jpg` | `?a=reticule&ae=repos&am=aucun` |
| `images/a1-reticule-territoire.jpg` | `?a=reticule&ae=territoire&am=aucun` |
| `images/a1-reticule-autour.jpg` | `?a=reticule&ae=autour&am=aucun` |
| `images/a1-reticule-logement.jpg` | `?a=reticule&ae=logement&am=aucun` |
| `images/a2-recul-autour.jpg` | `?a=recul&ae=autour&am=aucun` |
| `images/a2-recul-logement.jpg` | `?a=recul&ae=logement&am=aucun` |
| `images/a1-dossier-communal.jpg` | `?a=reticule&ap=commune&am=aucun` |
| `images/b1-curseur-2030.jpg` | `?b=regle&bh=gwl15&bm=aucun` |
| `images/b1-curseur-2050.jpg` | `?b=regle&bh=gwl20&bm=aucun` |
| `images/b1-curseur-2100.jpg` | `?b=regle&bh=gwl30&bm=aucun` |
| `images/b2-trace-2050-vers-2100.jpg` | `?b=trace&bm=aucun`, puis 2100 |
| `images/b2-rennes-2100.jpg` | `?b=trace&bc=35238&bh=gwl30&bm=aucun` |
| `images/b1-mobile-390-2100.jpg` | `?b=regle&bh=gwl30&bm=aucun`, 390 px |
| `images/c1-pas-initial.jpg` | `?c=pas&ce=-1&cm=aucun` |
| `images/c1-pas-etape-3.jpg` | `?c=pas&ce=2&cm=aucun` |
| `images/c1-pas-final.jpg` | `?c=pas&ce=5&cm=aucun` |
| `images/c2-trait-final.jpg` | `?c=trait&ce=5&cm=aucun` |
| `images/c3-statique.jpg` | `?c=statique&cm=aucun` |
| `images/c1-mobile-390-etape-4.jpg` | `?c=pas&ce=3&cm=aucun`, 390 px |

---

# Deuxième itération (12/10/2026)

Compte rendu : `docs/audits/2026-10-12-fut75-motion-iteration2.md`. Réglages d'URL supplémentaires :
`b=editoriale|instrument` (v1 : `regle`, `trace`), `c=devoile|couches` (v1 : `pas`, `trait`, `statique`) ;
`ce` = scène de C1 (0 à 3) ou C2 déplié (`1`). La section « Interactions du quotidien » est en bas de
l'atelier (ancres `#q1` à `#q6`), chaque proposition face à son comportement actuel.

## Comparaisons v1 / v2 (`iteration2/comparaisons/`)

| Fichier | À gauche | À droite |
| --- | --- | --- |
| `b-v1-vs-b1.jpg` | B v1, curseur, 2050 | B1 éditoriale, 2050 |
| `b-v1-vs-b2.jpg` | B v1, curseur, 2050 | B2 instrument, 2050 |
| `c-v1-vs-c1.jpg` | C v1, pas à pas, final | C1 dévoilement, scène 3 |
| `c-v1-vs-c2.jpg` | C v1, pas à pas, final | C2 couches, dépliée |
| `a-v1-vs-v2.jpg` | A réticule v1, Autour | A réticule peaufiné (coins décalés, croisée de visée) |

## Vidéos (`iteration2/videos/`, temps réel, interactions réelles)

| Fichier | Ce qu'on y voit |
| --- | --- |
| `a-ordinateur.mp4` | A peaufiné : ouverture, coins qui s'accrochent, croisée de visée, pointages rapides |
| `b1-ordinateur.mp4`, `b1-mobile.mp4` | B1 : survol qui penche, 2030 / 2100 / 2050, clavier, changements rapides, Rennes |
| `b2-ordinateur.mp4`, `b2-mobile.mp4` | B2 : barres, cote, lignes de rappel, nuits tropicales, Rennes |
| `c1-ordinateur.mp4`, `c1-mobile.mp4` | C1 : quatre scènes, fondements qui changent de fonction, retour, clavier |
| `c2-ordinateur.mp4`, `c2-mobile.mp4` | C2 : couches une à une, repli, déplier puis replier aussitôt |
| `q1-ordinateur.mp4`, `q1-mobile.mp4` | Q1 : succès daté, échec, réponse rapide sans clignotement, « déjà en cours », comportement actuel |
| `q2-ordinateur.mp4`, `q2-mobile.mp4` | Q2 : horizon, échelle, mesure ; HorizonSwitch de production pour comparer |
| `q3-ordinateur.mp4`, `q3-mobile.mp4` | Q3 : trois communes, limite dite, retrait d'un jeton |
| `q4-ordinateur.mp4`, `q4-mobile.mp4` | Q4 : la carte s'agrandit, le titre reste ; `<details>` actuel |
| `q5-ordinateur.mp4`, `q5-mobile.mp4` | Q5 : préparation (secondes écoulées), proposition, échange, retour, échec |
| `q6-ordinateur.mp4`, `q6-mobile.mp4` | Q6 : vues qui arrivent du bon côté, glyphe qui se transforme, retour vers une preuve |

## Images (`iteration2/images/`, états finaux sans animation)

| Fichier | URL ou état |
| --- | --- |
| `v2-a-reticule-autour.jpg`, `v2-a-reticule-logement.jpg` | `?a=reticule&ae=autour&am=aucun` (et `logement`) |
| `v2-b1-editoriale-2030.jpg`, `-2050`, `-2100` | `?b=editoriale&bh=gwl15&bm=aucun` (`gwl20`, `gwl30`) |
| `v2-b1-editoriale-rennes-2100.jpg` | `?b=editoriale&bc=35238&bh=gwl30&bm=aucun` |
| `v2-b1-mobile-390-2050.jpg` | `?b=editoriale&bm=aucun`, 390 px |
| `v2-b2-instrument-2050.jpg`, `-2100.jpg` | `?b=instrument&bm=aucun` (`&bh=gwl30`) |
| `v2-b2-instrument-strasbourg-2030.jpg` | `?b=instrument&bc=67482&bh=gwl15&bm=aucun` |
| `v2-b2-mobile-390-2050.jpg` | `?b=instrument&bm=aucun`, 390 px |
| `v2-c1-devoilement-1.jpg` à `-4.jpg` | `?c=devoile&cm=aucun&ce=0` à `3` |
| `v2-c1-mobile-390-2.jpg` | `?c=devoile&cm=aucun&ce=1`, 390 px |
| `v2-c2-couches-repliee.jpg`, `-depliee.jpg` | `?c=couches&cm=aucun` (`&ce=1`) |
| `v2-c2-mobile-390-depliee.jpg` | `?c=couches&cm=aucun&ce=1`, 390 px |
| `v2-q1-ordinateur.jpg` à `v2-q6-ordinateur.jpg` | sections `#q1` à `#q6`, au repos |
| `v2-q1-mobile-390.jpg` à `v2-q6-mobile-390.jpg` | idem, 390 px |
