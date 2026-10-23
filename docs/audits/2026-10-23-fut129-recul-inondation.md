# FUT-129 · L'inondation dans le comparateur : simulation du recul et architecture

Branche `bonjourfuturee/fut-129-comparateur-ne-plus-presenter-comme-risque-dinondation`, depuis `main` 3af53c3c. Indépendante de FUT-127 / PR #83.
Arbitrages du porteur du 23/10/2026 :
- **Option.** V4 « ONRN prudente ».
- **Seuil.** Classes 5 ‰ et plus.
- **Mécanisme.** Recul non positif.
- **Représentativité.** À vérifier.
- **Plans.** Sans pénalité.
- **EAIP.** Demande à adresser au SDES ou à la DGPR.

**Non finalisé.** L'intensité du recul attend la validation du porteur. Aucune PR n'est ouverte.

## 1. Le mécanisme

Le score d'une commune est d'abord calculé **sans** la priorité inondation : son poids est retiré du numérateur **et** du dénominateur. Une commune dont les sinistres d'inondation indemnisés ont été fréquents, avec un échantillon suffisant, perd alors :

> recul = λ × 100 × poids de l'inondation ÷ (poids de l'inondation + poids des autres critères)

Ce recul se retranche du score de compatibilité, sur 100. Il a quatre propriétés :
- **Jamais positif.** Le score avec la priorité n'est jamais supérieur au score sans elle. C'est la propriété demandée, vérifiée sur les 34 788 communes et quatre profils.
- **Proportionnel au poids déclaré.** Une priorité légère recule peu.
- **Pas une exclusion.** Une commune nettement meilleure sur le reste reste devant.
- **Sans effet ailleurs.** Une recherche **sans** cette priorité garde **exactement** son score d'avant ; c'est testé sur l'index entier.

**Pourquoi pas un sous-score de 20.** Une note fixe entre dans la moyenne pondérée. Si la commune a des notes plus basses ailleurs, cette note de 20 la ferait **monter**. Le recul part d'un score de référence et ne peut que le baisser.

## 2. Simulation des trois intensités (index complet, vraie fonction `subScore`)

| Profil | λ = 0,1 | λ = 0,2 | λ = 0,3 |
|---|---|---|---|
| **Recul en points** | | | |
| inondation 3 + soins 2 | 5,0 | 10,0 | 15,0 |
| inondation 2 + nature 2 + étés frais 2 | 2,9 | 5,7 | 8,6 |
| inondation 1 + vie locale 3 + train 2 | 1,4 | 2,9 | 4,3 |
| inondation 3 seule | 7,5 | 15,0 | 22,5 |
| **Rang national perdu, médiane des communes concernées (sur 34 788)** | | | |
| inondation 3 + soins 2 | 2 451 | 4 913 | 7 372 |
| inondation 2 + nature 2 + étés frais 2 | 1 631 | 3 295 | 5 058 |
| inondation 1 + vie locale 3 + train 2 | 852 | 1 711 | 2 566 |
| inondation 3 seule | 9 298 | 13 977 | 14 736 |
| **Communes concernées dans les 10 premières du Gard** (sans recul : 10 · 1 · 6 · 8) | | | |
| inondation 3 + soins 2 | 5 | **0** | 0 |
| inondation 2 + nature 2 + étés frais 2 | 1 | 1 | 1 |
| inondation 1 + vie locale 3 + train 2 | 6 | 5 | 5 |
| inondation 3 seule | 1 | 0 | 0 |

Autres départements testés (Charente-Maritime, Vaucluse, Bouches-du-Rhône, Loire-Atlantique, Vendée), pour la priorité de poids 3 : dès λ = 0,1, les communes concernées sortent des 10 premières. Au poids 2, dans le Gard, une commune concernée reste parmi les 10 premières à toutes les intensités : elle se détache nettement sur la nature et les étés frais. Au poids 1, elles restent quand le reste le justifie : 2 sur 10 dans les Bouches-du-Rhône, 5 sur 10 dans le Gard. Ce n'est pas une exclusion.

**Lecture.**
- **λ = 0,1 est trop faible.** Pour un lecteur qui donne à l'inondation son poids maximal, la moitié des 10 premières communes du Gard ont encore des sinistres fréquents.
- **λ = 0,3 frôle l'exclusion.** Avec la priorité seule au poids 3, le recul atteint 22,5 points et la médiane de recul la moitié du classement national.
- **λ = 0,2 est la proposition.** Au poids 3, 10 points : les communes concernées quittent le haut de liste sans disparaître. Une commune meilleure de plus de 10 points sur le reste reste devant. Au poids 1, 2,9 points : une légère inclinaison, à la mesure d'une priorité secondaire.

Reste à décider : faut-il **plafonner** le recul du cas « priorité inondation seule » (15 points à λ = 0,2) ? Ce cas devra de toute façon afficher qu'il n'existe pas de classement fondé sur cette seule demande (arbitrage du 23/10).

## 3. Représentativité

- **Une seule représentativité.** Les deux fichiers ONRN, fréquence et coût moyen, ont **la même** représentativité pour les 34 839 communes (vérifié le 23/10). Elle mesure la part de marché des sinistres présents dans la base de la CCR (« Lisez moi » du fichier).
- **La convention.** Le seuil de 30 % est une **convention de futur•e**, la même que celle du module Logement (`onrn-sinistralite.ts`, `GATE_REPR`). Une commune « lue » dans un écran ne peut donc pas être « trop partielle » dans un autre.
- **Sensibilité** (classes 5 ‰ et plus) :

  | Représentativité retenue | Communes concernées |
  |---|---|
  | plus de 50 % | 681 |
  | **30 % et plus** | **1 536** |
  | 15 % et plus | 1 877 |
  | sans condition | 2 148 |

- **Contradictions de la source**, traitées comme un échantillon insuffisant : 84 communes ont une fréquence d'au moins 1 ‰ sans aucun sinistre répertorié, et 12 sont dans le cas inverse. Les 508 communes classées « 0 à 1 ‰ » sans sinistre répertorié ont des biens assurés mais aucun sinistre : elles sont lues comme « aucun sinistre répertorié ».

## 4. Les trois situations qui ne rassurent pas

| État | Effectif | Phrase |
|---|---|---|
| Fréquence mesurée sous 5 ‰ | 12 616 | « De 1995 à 2021, les inondations ont donné lieu en moyenne chaque année à 1 à 2 sinistres pour 1 000 biens assurés dans la commune. » |
| Aucun sinistre répertorié | 17 927 | « Aucun sinistre d'inondation indemnisé n'est répertorié de 1995 à 2021 dans les données des assureurs. » |
| Échantillon trop partiel | 2 653 | « Les données des assureurs sur les inondations de 1995 à 2021 sont trop partielles ici pour être comparées. » |

Chacune s'accompagne de sa limite : « Peu ou pas de sinistres passés ne veut pas dire un faible risque : cela se vérifie à l'adresse. » La recherche dit une fois : « Nous comparons des sinistres passés, pas la probabilité d'une inondation à venir. »

## 5. Ce qui est fait dans la branche (architecture et tests)

- `src/lib/comparateur/inondation-historique.ts` (pur) : les cinq états, le recul, les phrases. L'intensité est **isolée** dans `INTENSITE_RECUL_INONDATION` (0,2, en attente de validation).
- `scripts/populate-historique-inondation.mts` : ajoute `historiqueInondation` (labels verbatim) à l'index, refuse toute autre modification. Index : +227 Ko compressés, 34 732 communes couvertes. `src/data/accueil-communes.json` est régénéré ; seule son empreinte change (vérifié).
- `comparateur-vie.ts` : `scorePreferences` (exporté, testé) remplace le calcul du classement. L'inondation est retirée du score et agit par son recul ; la raison affichée est « inondations indemnisées fréquentes de 1995 à 2021 ».
- `src/lib/fut129-inondation-classement.test.ts` (7 tests sur l'index entier) : propriété non positive, non-régression exacte sans la priorité, états et phrases, modération du recul, Charron qui recule, La Rochelle, Châtelaillon et Grenoble qui ne deviennent jamais favorables.
- `npm test` : 2 963 tests, 0 échec.

## 6. Ce qui reste avant une PR prête à fusionner

1. Fixer l'intensité, après validation, et décider du plafond éventuel du cas « priorité seule ».
2. Faire porter la même lecture par toutes les autres surfaces, qui lisent encore l'ancien rang :
   - le sous-score `faible_risque_inondation` (découverte, compromis, signaux ambiants d'AskFuture) ;
   - les paliers de la comparaison de 3 communes et du Dossier comparatif, à remplacer par les faits, sans gagnant ;
   - la phrase climatique « Peu d'inondations recensées à ce jour » ;
   - le prompt de synthèse et l'aide du critère.
3. Afficher la phrase de transparence, et le message « pas de classement sur cette seule demande ».
4. Afficher les faits « plans de prévention » (approuvé, appliqué par anticipation, prescrit, phénomène). La table GASPAR des plans vient de FUT-127 (PR #83) : soit l'attendre, soit l'extraire ici de la même façon.
5. Ajouter un avertissement de contexte pour les comparatifs payants vendus avant la correction, sans les réécrire.
6. Prendre des captures de la recherche, de la comparaison de 3 communes et du Dossier comparatif.

## 7. Demande EAIP communale (à envoyer, sans bloquer FUT-129)

> **Objet :** Accès aux indicateurs communaux d'exposition à l'EAIP (débordement de cours d'eau et submersion marine)
>
> Bonjour,
>
> futur•e aide les particuliers à choisir où vivre en lisant les données publiques sur les risques naturels. Nous souhaiterions utiliser, à l'échelle de la commune, les indicateurs de l'ONRN sur la part des habitants et des logements situés dans l'enveloppe approchée des inondations potentielles (EAIP), séparément pour le débordement de cours d'eau et pour la submersion marine (analyses « Cours d'eau » et « Submersion marine », 2024, données 2021).
>
> La page de l'ONRN sur Géorisques annonce ces jeux de données (« lien à venir »), et le SDES publie sur data.gouv.fr les mêmes indicateurs par EPCI. Pourriez-vous nous indiquer :
> 1. s'il est possible d'accéder aux fichiers communaux, et sous quelle forme ;
> 2. leur méthodologie et leur millésime (EAIP 2011, Fidéli 2021, recensement 2021) ;
> 3. leurs conditions de réutilisation (licence, mention de la source).
>
> Nous les présenterions comme une exposition potentielle aux inondations extrêmes, jamais comme une probabilité, avec la source et la période.
>
> Merci par avance,
> [nom], futur•e

Destinataires proposés : `bipcp.srnh.dgpr@developpement-durable.gouv.fr` (contact des fiches ONRN), et le SDES par le formulaire de contact du catalogue DiDo.
