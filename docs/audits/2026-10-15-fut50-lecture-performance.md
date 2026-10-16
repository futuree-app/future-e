# FUT-50 · La première lecture d'une commune : performance à froid

15 octobre 2026 · constat seulement, **aucune refonte engagée** (hors périmètre de FUT-50).

## Ce qui a été mesuré (serveur de développement local)

| Situation | Temps |
| --- | --- |
| Toute première lecture après démarrage ou rechargement du serveur | 2,5 à 7,7 s |
| Première lecture d'une commune nouvelle, serveur chaud | 0,13 à 0,27 s en général ; jusqu'à 4,2 s observé ponctuellement |
| Lectures suivantes de la même commune | 0,05 à 0,15 s |

## D'où vient le délai

La route de prototype `/dev/fut50/api/lecture` appelle le moteur complet (`buildCommuneDossier`) pour une seule priorité :

1. **Le premier appel charge l'index des communes et les données DRIAS en mémoire.** C'est le gros des secondes à froid. Les appels suivants réutilisent ce cache tant que le processus vit.
2. **Chaque nouvelle commune interroge Géorisques**, mis en cache ensuite. Le service est externe : sa latence varie, et il ne répond qu'aux adresses IP françaises (`piege_georisques_france_seulement`). Le moteur l'appelle même pour une priorité qui n'en a pas besoin (hivers, taille).
3. **La chaleur lance deux fois le moteur** : une lecture simple, et une lecture en condition pour obtenir sa phrase quand le constat est favorable.

En production, sur des fonctions serverless, **chaque instance froide paierait le point 1**.

## Pistes, sans engagement

- **Une route publique légère.** Elle lirait directement l'index et DRIAS pour la chaleur, les hivers et la taille, sans Géorisques ; Géorisques resterait pour la pastille « risques » seulement. À vérifier : que ses phrases restent identiques à celles du moteur (rejouer le panel de communes, comme le fait `verifier-cas-sete.mjs`).
- **Un cache par commune et par pastille**, côté serveur ou CDN, avec une durée longue : les données changent par millésime.
- **Le préchauffage de la commune** dès sa sélection (état 2), pour que la lecture soit prête au moment du clic sur une priorité.
- **Une ligne d'état patiente** au-delà de 2 s, à l'image de FUT-75 Q5, plutôt qu'un chargement muet.

Aucune de ces pistes n'est engagée dans FUT-50.
