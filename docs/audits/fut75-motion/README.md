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
