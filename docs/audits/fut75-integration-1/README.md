# FUT-75 · Intégration motion n° 1 : vidéos et captures

Compte rendu : `docs/audits/2026-10-12-fut75-integration-1.md`.
Avant = `main` (`9cd6a34c`) ; après = `feat/fut-75-motion-integration-1`. Temps réel, interactions
réelles, ordinateur 1280 × 800 et mobile 390 × 844. Données publiques ou de démonstration signalées ;
aucune donnée personnelle. Lancement : `DOSSIER_NARRATIVE=false npm run dev`.

| Vidéo | Où | Ce qu'on y voit |
| --- | --- | --- |
| `videos/q4-avant-*.mp4`, `videos/q4-apres-*.mp4` | `/dev/fut92`, carte réelle du relevé | « Données et limites » : ouvrir, fermer, interrompre, autre carte |
| `videos/q5-avant-*.mp4`, `videos/q5-apres-*.mp4` | `/dev/synthese-territoire`, vrai `QuartierSynthesis` | préparation, proposition, affichage, retour à la lecture immédiate |
| `videos/q5echec-avant-ordinateur.mp4`, `videos/q5echec-apres-ordinateur.mp4` | idem | lecture enrichie indisponible (silencieuse avant, dite après) |
| `videos/q1-apres-*.mp4` | `/dev/motion#q1` | livrée, réponse rapide, 409, déjà en cours, double appui |
| `videos/q2-apres-*.mp4` | `/dev/motion#q2` | 140, 180, 220 ms, clics rapides |

Les réponses de `/api/synthesize-quartier` sont simulées dans le navigateur (`page.route`) ; aucun appel
au modèle. Q1 rejoue le contrat réel d'`actualiser` par `/dev/motion/api/actualiser`, sans écriture.

| Capture (1440 et 390 px) | État |
| --- | --- |
| `images/q4-carte-ouverte-*.jpg` | carte du relevé, « Données et limites » ouvert |
| `images/q5-preparation-*.jpg` | lecture enrichie en préparation |
| `images/q5-proposition-*.jpg` | lecture enrichie prête, proposée |
| `images/q5-indisponible-*.jpg` | lecture enrichie indisponible |
| `images/q1-repos-*.jpg` | page de contrôle Q1 au repos |
