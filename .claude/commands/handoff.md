---
description: Génère un brief de passation (reprise sur un autre compte/session) dans docs/handoff/CURRENT.md
---

Tu vas écrire un **brief de passation** dans `docs/handoff/CURRENT.md`, pour qu'une session
neuve (éventuellement sur un autre compte Claude, même machine) puisse reprendre le travail
exactement là où il s'est arrêté, sans rejouer cette conversation.

Rappel de contexte : la connaissance DURABLE vit déjà dans le vault (`docs/vault/`, versionné)
et dans `/memory` (`MEMORY.md` + fiches, chargées au démarrage). Ce brief ne duplique PAS ça :
il capture seulement **l'état VIVANT de la session en cours** que la mémoire n'a pas encore.

Méthode :
1. Récupère l'état mécanique : `git branch --show-current`, `git log --oneline -5`,
   `git status --short`, et les PR ouvertes (`gh pr list --state open` si dispo).
2. Écris `docs/handoff/CURRENT.md` avec EXACTEMENT ces sections :
   - **Horodatage + branche courante**.
   - **Objectif en cours** : ce qu'on est en train de faire, en 2-3 phrases.
   - **Fait dans cette session** : les livrables concrets (fichiers, commits, PR, décisions).
   - **Décisions prises** (et par qui : porteur vs proposé) qui ne sont pas encore dans le vault.
   - **État git** : branche, commits non poussés, fichiers modifiés non commités, PR ouvertes.
   - **Prochaine étape immédiate** : la première chose à faire à la reprise, sans ambiguïté.
   - **À lire d'abord à la reprise** : `MEMORY.md`, puis les pages du vault pertinentes au sujet
     courant (chemins précis), et `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.
   - **Pièges / fils ouverts** : ce qui risque de mordre (écarts connus, choix en attente).
3. Sois concret et actionnable : une IA froide doit pouvoir reprendre sans poser de question.
   Pas de récit de la conversation, seulement l'état et le prochain geste.

Après écriture, confirme le chemin et résume en une ligne ce qui a été capturé.
