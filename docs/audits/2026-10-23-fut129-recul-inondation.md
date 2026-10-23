# FUT-129 · L'inondation dans le comparateur : simulation du recul et architecture

Branche `bonjourfuturee/fut-129-comparateur-ne-plus-presenter-comme-risque-dinondation`, depuis `main` 3af53c3c. Indépendante de FUT-127 / PR #83.
Arbitrages du porteur du 23/10/2026 :
- **Option.** V4 « ONRN prudente ».
- **Seuil.** Classes 5 ‰ et plus.
- **Mécanisme.** Recul non positif.
- **Représentativité.** À vérifier.
- **Plans.** Sans pénalité.
- **EAIP.** Demande à adresser au SDES ou à la DGPR.

**Validé le 23/10/2026 :** λ = 0,2, seuil 5 ‰, représentativité 30 %. Rien n'est fusionné ni déployé.

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

## 5. Ce qui est livré (V4 complète)

Arbitrages du 23/10, second temps : **λ = 0,2 validé**, seuil 5 ‰, représentativité 30 %, pas de plafond pour la priorité seule, mais pas de palmarès quand elle est la seule demande classable.

| Surface | Avant | Après |
|---|---|---|
| **Classement de la recherche** | sous-score = 100 − rang CatNat | priorité retirée du score (numérateur et dénominateur), puis recul de λ × 100 × poids ÷ poids total pour les classes 5 ‰ et plus (représentativité ≥ 30 %). Jamais favorable. |
| **Raison et compromis** | « peu de reconnaissances CatNat inondation » / « historique CatNat inondation plus marqué » | aucune raison favorable ; « inondations indemnisées fréquentes de 1995 à 2021 » pour une commune qui recule |
| **Carte de résultat** (priorité déclarée) | rien | « Inondation : 1 à 2 sinistres pour 1 000 biens par an (1995-2021) · plan de prévention approuvé » ; en ambre si sinistres fréquents |
| **Explication** | rien | une fois par recherche : « Nous comparons des sinistres passés, pas la probabilité d'une inondation à venir… » |
| **Inondation seule demande classable** | palmarès « Forte correspondance » tiré de l'emploi et de l'isolement | exploration : ordre annoncé (nombre d'habitants, sinistres fréquents en dernier), aucun palier de correspondance, message vide de « compromis ». Une orientation géographique souple reste classable ; un périmètre dur borne l'exploration sans la classer. |
| **Comparaison de 3 communes et Dossier comparatif** | paliers « Risque d'inondation faible / modéré / élevé », gagnant, rouge | ligne de faits : classe ONRN en clair, « Aucun sinistre répertorié », « Données trop partielles » ; plan (approuvé, anticipé, en préparation) en qualificatif ; jamais de gagnant ni de ligne de fracture ; rouge réservé aux sinistres fréquents |
| **Résumé de la comparaison** | « se distingue sur les risques naturels (inondation, feu, sécheresse) » | l'inondation n'y est plus citée (elle ne départage plus) |
| **Signaux d'AskFuture** | « historique d'inondation plus faible » (terciles) | le fait daté, même bas, avec sa limite |
| **Phrase climatique** | « Peu d'inondations recensées à ce jour ; … » | se tait sur l'historique, sauf sinistres fréquents |
| **Synthèse rédigée** | nuance climatique seulement | reçoit les deux phrases factuelles (filtrées) et `exploration_sans_classement` ; règles strictes dans le prompt (jamais « peu exposée », « faible risque », probabilité, avenir) |
| **Aide du critère, analyse de la demande** | « Historique d'inondations observé », « historique d'arrêtés CatNat » | « Sinistres indemnisés de 1995 à 2021 et plans de prévention… Des faits passés, pas une probabilité » |
| **Comparatifs déjà vendus** | recalculés en silence ; en mode projet, **le trio affiché était le haut du nouveau classement**, pas forcément celui acheté | `rejouerPack` : les communes achetées priment ; si le classement ne les rend plus en tête, le comparatif est reconstruit sur elles et la page le dit. Avertissement daté pour un achat antérieur à `LECTURE_INONDATION_DEPUIS` (**à ajuster au jour de la mise en production**). Rien n'est réécrit en base. |
| **Recherche restaurée** (session locale de 2 h) | pouvait réafficher l'ancienne lecture | `SESSION_VERSION` 4 → 5 : l'ancienne n'est plus restaurée |

**Données.** Deux champs sont ajoutés à l'index par `scripts/populate-inondation-comparateur.mts`, qui refuse toute autre modification :
- `historiqueInondation` : labels ONRN verbatim, 34 732 communes ;
- `plansInondation` : statut et aléas, 11 939 communes avec au moins un plan.

La table GASPAR des plans (`data/gaspar-pprn-inondation.json`, `src/lib/data/gaspar-pprn-inondation.ts`, `scripts/gaspar/extraire-pprn-inondation.mts`) est **reprise à l'identique** de FUT-127 / PR #83 : la fusion des deux PR ne produit aucun conflit sur ces fichiers. L'index pèse 358 Ko de plus compressé. `src/data/accueil-communes.json` est régénéré, et seule son empreinte change.

## 6. Effets mesurés sur les classements (vraie recherche `matchProjects`, `main` contre la branche)

| Recherche | `main` (trio) | Branche (trio) | Communes à sinistres fréquents dans les 10 premières (main → branche) |
|---|---|---|---|
| Charente-Maritime · inondation 3 + soins 2 | Aytré, **Yves** (> 10 ‰), Périgny | Aytré, Dompierre-sur-Mer, Lagord | 2 → 0 |
| Gard · inondation 3 + soins 2 | **Mus**, Le Grau-du-Roi, **Caissargues** | Nîmes, **Gallargues-le-Montueux**, **Caissargues** | 4 → 4 |
| Vaucluse · inondation 3 + soins 2 | Caromb, Le Pontet, Morières-lès-Avignon | Le Pontet, Avignon, Pertuis | 1 → 0 |
| Bouches-du-Rhône · inondation 3 + soins 2 | Mollégès, Aureille, Cornillon-Confoux | Bouc-Bel-Air, Saint-Victoret, Noves | 0 → 0 |
| Loire-Atlantique · inondation 3 + soins 2 | La Montagne, Montoir-de-Bretagne, Saint-Molf | Basse-Goulaine, Sainte-Luce-sur-Loire, Les Sorinières | 0 → 0 |
| Vendée · inondation 3 + soins 2 | Soullans, Venansault, Sainte-Gemme-la-Plaine | Cugand-la-Bernardière, Sallertaine, Le Fenouiller | 0 → 0 |
| Hérault · inondation 3 + soins 2 | Gigean, La Grande-Motte, Nébian | Lattes, Fabrègues, Gigean | 0 → 0 |
| Gironde · inondation 3 + soins 2 | Saint-Gervais, Le Porge, Val de Virvée | Artigues-près-Bordeaux, Bruges, Cenon | 0 → 0 |
| Charente-Maritime · inondation 1 + vie locale 3 + train 2 | Châtelaillon-Plage, La Rochelle, **La Flotte** | La Rochelle, Châtelaillon-Plage, Lagord | 1 → 0 |
| Gard · inondation 1 + vie locale 3 + train 2 | Le Grau-du-Roi, Aigues-Mortes, Les Angles | Aigues-Mortes, Les Angles, Le Grau-du-Roi | 1 → 1 |
| France · inondation 2 + nature 2 + étés frais 2 | Séez, Les Rousses, Tollevast | Bagnères-de-Bigorre, Doussard, Schirmeck | 0 → 0 |
| France · inondation 3 + soins 2 | Le Pont-de-Claix, Vendeville, La Membrolle-sur-Choisille | Meylan, Basse-Goulaine, Niederhausbergen | 0 → 0 |
| Charente-Maritime · soins 2 + nature 2 (**témoin, sans inondation**) | Bourcefranc-le-Chapus, Saint-Martin-de-Ré, Dolus-d'Oléron | **identique** | 1 → 1 |

**Lecture.**
- **Pas de faux palmarès.** Sur `main`, la première raison affichée était souvent « peu de reconnaissances CatNat inondation ». Elle a disparu.
- **Le témoin sans inondation est identique**, ce qui est démontré aussi par le test de non-régression sur l'index entier.
- **Le Gard montre que le recul n'est pas une exclusion.** Sur les 109 communes retenues, celles qui ont le meilleur accès aux soins sont presque toutes à 5 ‰ et plus. Elles dépassent les autres de plus de 10 points sur ce critère et restent devant. Leur carte le dit (« Inondation : sinistres fréquents… », en ambre), et leur compromis aussi (« En échange, inondations indemnisées fréquentes de 1995 à 2021 »).

## 6 bis. Ce qui reste à faire avant la mise en production

1. Ajuster `LECTURE_INONDATION_DEPUIS` au jour du déploiement.
2. Fusionner FUT-127 / PR #83 avant ou avec cette PR. Les fichiers GASPAR sont identiques ; après les deux fusions, `src/lib/data/gaspar-pprn-inondation.ts` n'existe qu'une fois.
3. Relecture de la synthèse rédigée en recette, sur un vrai appel (aucun appel n'a été fait ici).

## 7. Demande EAIP communale (brouillon prêt, non envoyé, sans bloquer FUT-129)

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

**Destinataires vérifiés le 23/10/2026.**
- **À :** `bem.sdie.sdes.cgdd@developpement-durable.gouv.fr`. C'est le contact « Affaire suivie par » de la fiche ONRN « Exposition des logements et des personnes au risque d'inondation par débordement de cours d'eau », version 2 du 11/12/2024 (SDES, producteur de l'indicateur).
- **Copie :** `bipcp.srnh.dgpr@developpement-durable.gouv.fr`, contact DGPR des fiches ONRN.

**Statut : NON ENVOYÉ.** Aucun canal d'envoi autorisé depuis le compte officiel de futur•e n'était disponible : la connexion Gmail n'est pas authentifiée, et elle n'est pas désignée comme compte officiel. Le message ci-dessus est un brouillon, à envoyer depuis le compte de futur•e.

## 8. Captures (`docs/audits/2026-10-23-fut129-captures/`, WebP)

- **Page « Où vivre », vraie page.** Le résultat est calculé par `/api/comparateur-vie/match`, qui ne fait aucun appel au modèle, puis restauré comme session. La synthèse affichée est un texte de remplacement explicite. Script : `scripts/fut129/capturer-recherche.mjs`. Les quatre parcours sont à 1440, 390 et 360 px :
  - `recherche-inondation-soins-17-*` : inondation et soins, en Charente-Maritime ;
  - `exploration-inondation-seule-17-*` : inondation seule, en Charente-Maritime ;
  - `exploration-inondation-seule-france-*` : inondation seule, toute la France ;
  - `temoin-sans-inondation-17-*` : témoin sans la priorité.
- **Dossier comparatif, banc `/dev/fut129`.** On y voit les composants de production sur l'index réel, sans compte et sans paiement. Script : `scripts/fut129/capturer-banc.mjs`. Les trois cas sont à 1440 et 390 px :
  - `pack-ancien-*` : achat simulé au 01/09/2026, trio d'alors Yves, Île-d'Aix et La Couarde-sur-Mer, avec les deux avertissements ;
  - `pack-actuel-*` : le même projet rejoué aujourd'hui ;
  - `choix-*` : Charron, La Rochelle et Grenoble nommées.
- **Cas simulés.**
  - `pack-ancien` : la date d'achat et le trio d'alors sont simulés. Le trio est celui que l'ancien classement mettait en tête : ce n'est pas un pack réel.
  - Toutes les autres captures rendent des données réelles.
- **Aucun débordement horizontal.**
