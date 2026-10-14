# Test réel de Q1 en production, 12/10/2026 (dossier de test, compte de test du projet)

Dossier : dossier d'adresse créé par l'outil de test (sans achat), adresse publique à Nantes (44109),
portée `logement:<id du dossier>`. Un seul clic.

## Avant (13:06:50 UTC)
- versions de la portée : v1 ready (12/08 20:18), v2 ready (12/08 21:18) ; aucune `generating` sur le compte ; 54 artefacts
- projet : intent achat, posture recherche (empreinte 4d5e00ce…) ; relation et objectif du bien non déclarés ; 5 intentions d'achat (empreinte d78b043c…)
- la page affiche « Analyse générée le 12 août 2026 », le bandeau « Votre projet a changé… » et le bouton

## Journal du navigateur (ms depuis l'instrumentation)
- 34623 · POST /api/dossier/actualiser · {"insee":"44109","scopeKey":"logement:…"}
- 34626 · bouton attente, aria-busy=true, « La nouvelle version se prépare… »
- 34929 · emblème affiché, « Mise à jour en cours » (303 ms)
- 44933 · réponse 200 {"ok":true,"statut":"abouti","version":3} (10,3 s)
- 44934 · bouton succès « Analyse mise à jour », « La nouvelle version est prête. La page l'affiche dans un instant. »
- 45920 → 53091 · relecture RSC de /rapport (router.refresh, 987 ms après la réponse)
- ≈ 60000+ · la page affiche toujours « Analyse générée le 12 août 2026 » et le bandeau (capture `apres-relecture-automatique.jpg`)

## Après (13:08:54 UTC)
- v3 ready, engine-4, créée 13:07:58, générée 13:08:06 ; v1 et v2 inchangées (mêmes empreintes de payload)
- 55 artefacts (+1), aucune `generating`, aucune autre ligne créée depuis le relevé
- projet, relation, objectif, intentions : empreintes identiques ; `address_dossiers.updated_at` inchangé depuis 13:05:22 (avant le clic)

## Lecture du serveur après coup (sans clic)
- GET RSC /rapport : la section du logement porte « 12 octobre 2026 », plus de bandeau pour la portée logement
- second `router.refresh()` lancé à la main : la page affiche « Analyse générée le 12 octobre 2026 », bandeau disparu
