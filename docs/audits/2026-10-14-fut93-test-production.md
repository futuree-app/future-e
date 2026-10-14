# FUT-93 · Test de production du 14/10/2026 : la relecture après un changement de lien ne s'affiche pas

Production : `futur-e.fr`, déploiement `dpl_FbS3UX4u…`, construit depuis `a85fa930` (PR #56), qui
contient `ad942f3f` (PR #54). Dossier : le dossier d'adresse de test du compte du projet, à Nantes
(44109), portée `logement:<id>`, jamais acheté, aucun client concerné. Chrome sur ordinateur, fenêtre
de 1680 px. Preuves : `fut93-production/` (captures, adresse et résidence masquées).

**Verdict : test arrêté à l'étape 2. FUT-93 non validé.** Aucune génération réelle, aucune nouvelle
version, aucun appel Anthropic.

## Avant (12:30:31 UTC)

- Versions de la portée : v1, v2, v3 prêtes ; v3 servie (« Analyse générée le 12 octobre 2026 ») ;
  aucune ligne `generating` sur le compte ni dans toute la table ; 55 artefacts sur le compte, 64 en tout.
- Lien et objectif du bien non déclarés ; projet : achat (empreinte inchangée depuis le 12/10).
- Témoins d'appels au modèle : 6 narrations en cache (`decision_narrative`), budget modèle du jour nul
  (`budget_llm`).
- Page : pas de bandeau, région d'annonce vide.

## Ce qui a été fait

Une sonde dans la page journalise, horodatés, les requêtes (méthode, chemin, statut, sans corps ni
cookie), l'apparition d'un bandeau, le libellé du bouton et la région d'annonce. La page est défilée
sous le dossier (`scrollY` 2261), sur le contrôle « Ce bien ».

| Geste (UTC) | Enregistrement | Relecture `/rapport` | Attendu | Observé |
| --- | --- | --- | --- | --- |
| « Pour l'acheter », 12:33:09 | PATCH 200 en 0,47 s ; objectif `buy` en base à 12:33:10 | reçue | pas de bandeau : avec un projet d'achat, ce choix ne change ni la voix ni les gestes (`contexteAChangeMateriellement`, vérifié par calcul) | pas de bandeau : conforme |
| « Pour le louer », 12:34:15 | PATCH 200 en 0,57 s ; objectif `rent` en base à 12:34:15 | **reçue en entier : 7,1 s, 13,7 Ko** | bandeau « Vous avez modifié votre lien… » et « Mettre à jour l'analyse » | **rien, plus de 2 min après** (capture 01) |

- Le serveur sert bien le bandeau : un GET de `/rapport` lancé depuis la page (7,8 s, 200) le contient,
  avec le bouton et « Pour le louer » pressé.
- Un rechargement manuel l'affiche aussitôt, sur le même dossier (capture 02).
- La position de lecture n'a pas bougé (`scrollY` 2261, contrôle à 416 px), mais rien n'a changé à
  l'écran : ce n'est pas une mesure de stabilité.

## Après (12:36:09 UTC)

Toujours 3 versions (v1 à v3 prêtes), 64 artefacts, aucune `generating`, 6 narrations, budget du jour
nul. Seul changement en base : l'objectif du bien du dossier de test (`rent`), voulu par le test.

## Diagnostic

La relecture du routeur arrive en entier, mais React ne la valide pas : l'écran garde l'ancien état.
C'est la course identifiée le 12/10, sur la frontière EXTÉRIEURE de `/rapport` (le `Suspense` de
`DossierAvecLogement`, servi en 7 s), que la PR #56 n'a pas remontée à chaque rendu. Sur le banc, 0
blocage en 115 relectures ; en production, au premier geste qui devait afficher le bandeau. Les six
actions de relecture n'ont aucune récupération : le lecteur ne voit pas l'effet de son geste.

## Non vérifié

- Étapes 3 et 4 (génération, protection du second onglet) : non lancées, la condition de l'étape 2
  n'étant pas remplie.
- Safari sur iPhone : pas accessible depuis ce poste. Aucune émulation n'en tient lieu.
- Fréquence du blocage en production : un seul geste matériel observé.

## Suite

Correctif sur `fix/fut-93-relecture-secours` : une récupération bornée pour les six actions, sur le
modèle de celle de Q1 (voir `2026-10-14-fut93-relecture-secours.md`).
