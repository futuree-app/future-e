# Suivi de rétention Vercel — protocole séparé de la livraison

Projet `future-e`, équipe `futuree-apps-projects`, `prj_k4X3A1e5ovsQTEfdBTu2sdI8g5uf`.

## Observation du 28 octobre

Le 28 octobre, aucune comparaison des journées futures des 29–30 n'est revendiquée. Une requête API englobant ces dates peut déjà retourner une enveloppe et des lignes : cela ne prouve ni la clôture de ces journées, ni une économie. Les périodes réelles des charges, leur publication et leur caractère complet doivent être contrôlés.

| Mesure | Référence d'audit | Nouvelle observation le 28/10 |
|---|---:|---:|
| Ready listés, pagination et IDs uniques | 365 | 365 |
| Production Ready | 99 | 99 |
| Preview Ready | 266 | 266 |
| Function Storage | 360,09 Go relevés par le porteur | 361,35 GB affichés dans Usage, vue par projet, cycle courant |
| Function + Deployment Storage quotidiens | 1,2003 + environ 0,14 $ | Pas de nouveau relevé quotidien finalisé des 29–30 disponible à cette date |

Le compteur de déploiements visibles ne mesure pas les octets encore conservés ; le chiffre Usage du cycle ne remplace pas une charge quotidienne clôturée. On ne peut pas conclure à une baisse ou à un échec du nettoyage sur la seule observation ci-dessus.

La production active reste `dpl_47Kp6S3s5RDJHVUkFHPf6MNDfQUp` (`4d75603f`), domaines inchangés. La rétention enregistrée par le porteur vers 01 h le 28/10 est conservée : previews, erreurs et annulations 1 jour ; production 1 semaine. Aucune suppression manuelle ni mutation d'alias/rétention.

## Contrôles programmés

Deux contrôles, **29 et 30 octobre à 18 h Europe/Paris**, ont été créés. Ils sont en lecture seule et indépendants du GO de livraison. Si la journée n'est pas encore clôturée/publiée lors du contrôle, le résultat doit dire « non disponible / provisoire » et ne pas traiter une ligne future ou un zéro comme une baisse.

À chaque contrôle :

1. Lire la politique et la production active sans les modifier. Paginer les déploiements Ready, dédupliquer les IDs, compter production et previews et comparer à l'inventaire initial `2026-10-28-vercel-storage/deployments.json`.
2. Lire séparément Function Storage et Deployment Storage dans Usage, **même équipe, projet et jour**. Conserver l'heure de collecte, le fuseau/période du filtre, l'unité, le volume et le coût de chaque poste. L'API de facturation est un recoupement : inspecter `ChargePeriodStart/End` et le contexte de troncature de son échantillon ; ne pas attribuer un total d'équipe au seul projet.
3. Distinguer trois colonnes : déploiements visibles ; stockage encore indiqué/conservé ; maximum journalier facturé. Vercel facture le maximum de chaque journée par projet, à 0,10 $/Go-mois ; une purge intrajournalière n'efface pas ce maximum ni les charges du passé.
4. Rapprocher les survivants avec les exceptions : dix derniers déploiements, vingt productions Ready, vingt previews Ready, production aliasée, aliases/environnements concernés, dernière preview d'une branche active. L'audit initial avait 51 exceptions étayées, dont 13 dernières previews de branches actives ; actualiser ce rapprochement au lieu de le supposer constant.
5. Présenter les écarts en nombres et pourcentages, avec la qualité du relevé. Les scénarios 5,62 $ et 1,76 $/mois restent des simulations et ne doivent pas apparaître dans la colonne « économie observée ».

Le premier marquage en suppression est généralement sous 48 h après éligibilité ; une réévaluation après cessation d'exception peut prendre davantage. La récupération, la suppression physique et la publication du compteur sont des étapes distinctes. Leur délai exact de facturation n'est pas établi par cet audit.

## Si le premier cycle n'apporte pas de diminution nette

- Ready inchangés : examiner l'âge, les exceptions et le passage effectif du nettoyage ; ne pas conclure seulement depuis les durées de politique.
- Ready en baisse mais métrique encore haute : relever la période de facturation, le maximum journalier, le rafraîchissement d'Usage et les déploiements récemment supprimés/récupérables ; ne pas supposer que les fichiers ont déjà quitté le compteur.
- Au-delà du premier cycle et avec des déploiements manifestement éligibles conservés sans exception étayée : préparer un dossier support Vercel avec captures/exports horodatés, IDs exemples et chronologie. Aucun contact externe sans nouvelle autorisation.
- Proposer ensuite, si nécessaire, un manifeste de nettoyage manuel rafraîchi pour accord explicite, en protégeant production, domaines et rollbacks. Le suivi n'autorise jamais sa mise en œuvre.

### Brouillon de demande au support — ne pas envoyer automatiquement

Objet : Function Storage conservé après réduction de rétention — future-e / Pro

Notre projet `prj_k4X3A1e5ovsQTEfdBTu2sdI8g5uf` de `futuree-apps-projects` a une rétention previews/erreurs/annulations de 1 jour et production de 1 semaine, enregistrée le 28/10/2026 vers 01 h Europe/Paris. Nous conservons la production et les rollbacks ; les déploiements Git de branches sont désactivés.

Après le premier cycle de nettoyage, nos relevés horodatés indiquent [compléter : Ready, Go et coût quotidien pour chaque jour, statuts/provisoire]. Les déploiements [IDs exemples] paraissent éligibles sans exception retrouvée ; [ou Ready ont baissé mais Functions Storage reste à X]. Pouvez-vous confirmer le passage du nettoyage, les exceptions appliquées à ces IDs, et le moment où les bundles récupérables/supprimés cessent de contribuer au maximum journalier facturé ? Nous ne demandons aucune suppression de la production ni de ses aliases.

Pièces à joindre après collecte : politique, chronologie, export des déploiements et aliases, relevés Usage et charges par période. Ne pas joindre clés, variables d'environnement, cookies ou données client.

Sources : https://vercel.com/docs/deployment-retention ; https://vercel.com/docs/deployment-storage.
