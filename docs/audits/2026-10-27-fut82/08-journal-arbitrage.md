# FUT-82 · 8. Journal d'arbitrage

> Ce qui reste ouvert, ce qui est incertain, et ce qui demande l'accord du porteur. Rien n'est
> engagé : aucune intégration, aucun ticket créé, aucun contact externe pris.

## Décisions qui demandent votre accord

| # | Décision | Options | Recommandation | Conséquence si oui |
|---|---|---|---|---|
| D1 | **Vague A** | A1 seule · A2 seule · A1 + A2 · aucune | **A1 + A2**, développées ensemble (même patron) | Deux tickets à créer **après** la fusion de FUT-81 |
| D2 | **Calendrier** | Avant ou après l'ouverture publique (FUT-18) | Après FUT-81, sans bloquer FUT-18 | — |
| D3 | **Seuil « en limite de zone »** (convention chiffrée) | Réutiliser 2 % de la parcelle ou 25 m² (FUT-81) · autre seuil · point seul | Réutiliser le seuil de FUT-81, nommé et versionné | Une seule convention parcellaire dans le produit |
| D4 | **Place du PEB** | Logement (statut réglementaire) · Autour (bruit) · les deux | Logement, avec un renvoi d'une ligne dans Autour | Coordination avec FUT-118 |
| D5 | **Contact BDIFF** (externe) | Écrire à `bdiff.dgpe@agriculture.gouv.fr` pour lever la contradiction de licence · ne rien faire | Écrire, en votre nom, avant toute vague B | Conditionne BDIFF |
| D6 | **Contact DGAC** (externe) | Demander la licence des couches PEB et PGS · se fier à la diffusion Géoplateforme | Demander une confirmation écrite | Lève une réserve de A1 |
| D7 | **Dette `PollutionLookup`** | Corriger avant le lancement (retirer la phrase de vide, ou passer au registre officiel) · laisser | Corriger : la page publique affirme une absence fausse | Petit ticket indépendant |
| D8 | **Dette `nombre_dincendies` dans AskFuture** | Retirer du prompt · documenter la source · laisser | Retirer tant que la provenance est inconnue | Petit ticket ; aucune synthèse à régénérer |
| D9 | **Question « sous-sol / cave »** | L'ajouter à la qualification (FUT-143) ou au Projet · renoncer aux nappes | À trancher en vague B seulement | Condition de la lecture nappes |
| D10 | **Notes doctrinales** | Graver dans le vault les règles « projection native », « exception en 200 », « portée au numéro » | Oui, via l'archiviste | Mémoire durable des pièges |

## Hypothèses encore ouvertes

1. **Sémantique du zonage OLD** déduite par comptage (`zonage = 2` diffusé = zone soumise ; `zonage = 1`
   = massifs) : la documentation IGN n'est plus accessible (redirection vers cartes.gouv.fr). À
   confirmer auprès de l'IGN ou en comparant quelques arrêtés.
2. **Décret d'application de la loi n° 2023-580** (information de l'acquéreur sur les OLD) : numéro et
   date à citer après vérification Légifrance ; les sources secondaires divergent (projet de décret du
   07/02/2024, décret d'avril 2024 cité par un site privé).
3. **Art. L112-10** (constructibilité en zones A, B, C, D) : résumé à partir de sources secondaires et
   d'extraits ; seul l'art. L112-11 a été lu en version en vigueur sur Légifrance. À relire avant
   d'écrire une phrase de restitution sur l'extension.
4. **Licence des couches DGAC** : non indiquée dans les métadonnées CSW lues.
5. **Millésime de la carte des nappes** : non exposé par le service ; à documenter auprès du BRGM avant
   d'afficher une date.
6. **Champ ADEME `nombre_dincendies`** : il coïncide avec le compte BDIFF pour 11 des 13 communes tirées
   où il existe, ce qui suggère un dérivé de BDIFF sur une période inconnue ; il manque pour 17 communes
   ayant pourtant des feux BDIFF.

## Résultats incertains, et pourquoi

| Mesure | Valeur | Intervalle à 95 % (Wilson) | Réserve |
|---|---|---|---|
| Logements en zone « sujette » aux nappes | 60 % (120/200) | 53-67 % | Logements **diagnostiqués** (DPE), deux par commune : les intervalles réels sont plus larges (grappes) |
| idem, fiabilité moyenne ou forte | 39 % (78/200) | 33-46 % | idem |
| Logements en zone OLD | 10 % (20/200) | 7-15 % | Très régional : la moyenne nationale masque 0 % au nord et bien davantage au sud |
| Logements en zone PEB | 3 % (6/200) | 1-6 % | Petit nombre ; dépend du tirage des communes proches d'aéroports |
| Logements en zone PEB A, B ou C | 1,5 % (3/200) | 0,5-4 % | idem |
| Réseau de chaleur « éligible » | 21,5 % (43/200) | 16-28 % | Seuils FCU « volontairement élevés » |
| Natura 2000 au point | 0 % (0/200) | 0-2 % | Mesure au point, pas au voisinage |
| Ligne haute tension à moins de 100 m | 1 % (2/200) | 0,3-4 % | Transport seulement (pas Enedis) |

**Limite de l'échantillon de sonde (45 points).** 38 points sur 45 ne sont pas géocodés au numéro (rue,
lieu-dit, centre de commune) : ils décrivent un secteur. C'est aussi un constat pour le produit (la portée
« à l'adresse » doit dépendre du géocodage), mais cela interdit de tirer de ces 45 points une conclusion
sur un logement précis. Les cas « à l'adresse » cités dans les scénarios ont été rejoués au numéro par le
POC quand c'était possible (Villeneuve-le-Roi, La Rochelle).

## Ce qui n'a pas été fait, et pourquoi

| Élément de la mission | Statut | Motif |
|---|---|---|
| Lecture ARCEP à l'adresse | Non faite | Pas d'API ; fichier national de 835 Mo par trimestre : ingestion hors du cadre « sondes bornées » |
| Mesures ANFR | Non faites | Portail en maintenance (HTTP 503) le 27/10/2026 ; fichiers mensuels repérés, non téléchargés (écartée sur le fond) |
| ARIA | Non sondée | Faible priorité après l'analyse IREP |
| Comparaison à grande échelle des zonages OLD avec les arrêtés | Non faite | Demande des arrêtés département par département : à faire en revue de A2 |
| Rapport Géorisques au point sur tout l'échantillon | Partiel (26/45) | Connexions coupées par le serveur ; non contourné |
| Toute modification du produit | Non faite | Hors autorisation |

## Écarts au benchmark du 10/10/2026 à corriger dans le document canonique

- « IREP par polluant : même dataset que `irep.ts` » : **faux**, `irep.ts` lit un extrait ADEME 2019 ;
  le détail vit dans le registre officiel Géorisques.
- « BDIFF : faible effort probable » : **faux** au sens produit, à cause de la licence et du grain.
- « Nappes : signal fort » : **à nuancer**, la carte classe 60 % des logements tirés.
- Le **débroussaillement (OLD)** n'apparaît pas dans le benchmark alors qu'il porte une obligation
  légale à l'adresse et une information obligatoire du vendeur.

Ces corrections ne sont pas appliquées au benchmark (fichier hors périmètre de cette branche
documentaire) ; elles sont proposées ici.
