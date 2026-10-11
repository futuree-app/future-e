# FUT-92 · Captures et vidéos

Banc `/dev/fut92` : le gabarit de `/rapport` (racine, navigation, en-tête, carte projet, pieds de page)
autour des composants de production. Données publiques uniquement : un dossier communal et l'adresse de
l'hôtel de ville de Nîmes, projet de test. Aucune capture du vrai `/rapport`. « Avant » : `main`
(`50e500d0`) dans le même gabarit. Le bouton « N » en bas à gauche est l'indicateur de développement de Next.

## Ordinateur

| Fichier | Ce qu'il montre |
| --- | --- |
| `desktop-avant-1440-balance.jpg` | Avant : à la balance, le repère et la navigation principale sont partis avec la page |
| `desktop-apres-1440-1-haut.jpg` | Haut du dossier : repère dans sa colonne, emblème compté à côté de sa lecture |
| `desktop-apres-1440-2-balance.jpg` | Balance : le repère est resté sous la navigation |
| `desktop-apres-1440-3-controles.jpg` | Milieu des contrôles détaillés (dépliés) : toujours là |
| `desktop-apres-1440-4-fin.jpg` | Dernier contrôle : toujours là |
| `desktop-apres-1440-5-pied.jpg` | Après le dossier : arrêté, carte projet et pied de page libres |
| `desktop-apres-1024-controles.jpg` | 1024 × 768, milieu des contrôles |
| `desktop-apres-1280x620-fenetre-basse.jpg` | Fenêtre basse : dessin réduit, liste entière |
| `desktop-apres-1440-communal-controles.jpg` | Dossier communal (une échelle ouverte) |

## Mobile (du repère à la balance)

| Avant | Après | Gain |
| --- | --- | --- |
| `mobile-avant-390-adresse.jpg` | `mobile-apres-390-adresse.jpg` | −344 px |
| `mobile-avant-360-adresse.jpg` | `mobile-apres-360-adresse.jpg` | −366 px |
| `mobile-avant-390-communal.jpg` | `mobile-apres-390-communal.jpg` | −316 px (deux échelles non examinées, en pointillé) |

## Vidéos (défilement complet, 13 s environ)

- `video-avant-desktop-1280.mp4` : `main`, le repère disparaît dès la conclusion.
- `video-apres-desktop-1280.mp4` : le repère accompagne la lecture jusqu'au dernier contrôle, puis s'arrête.
- `video-apres-mobile-390.mp4` : rien ne colle ; un seul emblème ; décompte en trois lignes.

Reproduire : `DOSSIER_NARRATIVE=false npm run dev`, puis `/dev/fut92` (réglages en tête de page :
présentation, états, streaming de la lecture d'adresse, artefact).
