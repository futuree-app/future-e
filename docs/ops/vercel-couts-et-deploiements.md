# Vercel — éviter les dépenses de previews pendant le développement

**Décision du 28 octobre 2026 :** pendant la phase précédant le lancement public de futur•e, seul `main` doit déclencher un déploiement Git automatique sur le projet Vercel `future-e`.

## 1. Configuration dans le dépôt

Le fichier racine `vercel.json` contient :

```json
"git": {
  "deploymentEnabled": {
    "**": false,
    "main": true
  }
}
```

- `"**": false` : désactive les déploiements Git automatiques sur **toutes** les branches, y compris les noms avec barre oblique (`feat/...`, `bonjourfuturee/...`, `docs/...`).
- `"main": true` : conserve les déploiements de production lorsque le code validé rejoint `main`. Vercel donne priorité à un motif `true` lorsqu'une branche correspond à plusieurs motifs.
- Utiliser `**` plutôt que seulement `*` pour couvrir les noms de branches contenant `/`. Voir la syntaxe minimatch documentée par Vercel.
- Le réglage est propre au projet qui contient ce `vercel.json` ; il ne modifie pas les autres projets de l'équipe.
- Les déploiements CLI manuels, deploy hooks ou autres mécanismes hors déploiements Git automatiques ne sont pas nécessairement bloqués par cette règle.

Documentation officielle : https://vercel.com/docs/project-configuration/git-configuration

En complément, Vercel > `future-e` > Settings > Build and Deployment > Ignored Build Step est réglé par le porteur sur **Only build production** (déclaré le 28/10/2026). Le réglage vérifié dans le dépôt ci-dessus est la protection principale et versionnée.

**Pour rétablir les previews** après le lancement : modifier intentionnellement cette règle par PR ; documenter le besoin, estimer les builds/stockage, puis activer seulement les branches utiles. Ne pas supprimer ce verrou par inadvertance.

## 2. Pourquoi : facture du 30 septembre au 30 octobre 2026

Compte Vercel Pro : `futuree-apps-projects`; projet principal `future-e`.

Lecture du tableau de bord le 28/10/2026, **montants évolutifs** :

| Poste | Montant (USD) |
| --- | ---: |
| Build CPU Minutes — 149 h | 31,18 |
| Function Storage — 124 Go-mois | 12,42 |
| Deployment Storage — 19 Go-mois | 1,90 |
| Autres postes d'infrastructure | environ 0,46 |
| Infrastructure brute | 45,96 |
| Crédit mensuel d'infrastructure | -20,00 |
| Dépassement | 25,95 |
| Abonnement Pro | 20,00 |
| **Facture prévisionnelle** | **45,95** |

Du 1er au 27 octobre, inventaire de 420 déploiements : **323 previews future-e**, **88 productions future-e**, **9 productions d'un autre projet**. Beaucoup de versions ne servaient pas de recette ; certaines avaient échoué. Le trafic public ne motive pas ce coût. Les anciennes versions déjà déployées peuvent continuer à générer du stockage jusqu'à expiration/effacement.

Les nouvelles règles **ne remboursent pas** les frais déjà comptabilisés ; les économies futures sont à mesurer au cycle suivant.

## 3. Garde-fous de facturation (hors dépôt)

Le budget Spend Management est une configuration d'équipe dans Vercel, non gérée par `vercel.json`. Lors de la lecture du 28/10/2026 : **budget de dépassement 35 USD ; Pause = Off**. Le budget n'est donc qu'une alerte, **pas une limite bloquante**.

- Pour éviter les surcoûts sans interrompre la production : surveiller les alertes et ne pas multiplier les builds.
- Pour une limite plus stricte : activer `Pause` en connaissance de cause ; **cela interrompt tous les projets de l'équipe en production (503)** dès franchissement, et ne constitue pas une garantie bancaire d'absence de dépassement minute par minute.
- Ne pas configurer un seuil inférieur au dépassement déjà consommé sans vouloir déclencher cette pause.
- Réexaminer le budget au changement de cycle : 30 octobre 2026 ; viser un dépassement faible une fois les versions nettoyées.
- Revoir périodiquement les paramètres de rétention du projet : **Deployment Retention Policy** dans Settings > Security. Politique courte à privilégier pour previews/erreurs/annulations ; conserver assez de productions récentes pour revenir en arrière. Les durées exactes choisies dans l'interface ne sont pas attestées dans cette note. Les déploiements avec alias actif et certains déploiements récents sont exemptés de suppression.
- Surveiller l'évolution de Function Storage et Deployment Storage après quelques jours, pas seulement les minutes de build.

Références :
- https://vercel.com/docs/spend-management
- https://vercel.com/docs/deployment-retention
- https://vercel.com/futuree-apps-projects/~/usage
- https://vercel.com/futuree-apps-projects/~/settings/billing

## 4. Règles de fonctionnement avant lancement

1. Développer/tester dans les worktrees locaux, avec les suites de tests locales et les simulations de route nécessaires.
2. Garder GitHub PR + revue indépendante, mais sans builds Preview Vercel automatiques.
3. Regrouper les fusions validées dans `main` lorsque raisonnable ; un merge `main` déclenche encore un build de production payant.
4. Ne pas confondre revue d'une PR, publication d'une preview, livraison en production et stockage de versions.
5. Vérifier régulièrement budget, volumes de builds et stockage. Si un PR exige vraiment une URL de recette, décider explicitement de rétablir temporairement les previews utiles.
