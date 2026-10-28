# FUT-148 · 2. Restitution, recette et mise à jour

> 28/10/2026. Ce que futur•e affiche, pourquoi, et comment cela a été vérifié.

## 1. Les décisions

1. **Territoire : une carte « Fibre optique » pour tous les lecteurs**, dans le groupe « Le territoire ».
   Un fait daté, pas une note : aucune couleur d'alerte, aucun mot de jugement. Le volet suit le patron du
   Relevé : le niveau en une phrase, ce que le taux ne dit pas, où vérifier (lien cartefibre), la méthode
   repliée.
2. **Hors du snapshot Territoire.** La carte est chargée à côté du snapshot dont l'empreinte indexe les
   synthèses rédigées (`synthesisCacheKey`). Aucune synthèse existante n'est invalidée, aucun appel modèle
   n'est ajouté. Un test vérifie que `territoire-snapshot.ts`, `facts.ts`, `synthesis-contract.ts` et
   `synthesis-cache.ts` ne citent pas la fibre.
3. **Le besoin du lecteur se lit dans SES mots, pas dans une déduction.** Le Projet n'a ni priorité
   « télétravail » ni priorité « fibre », et ce ticket n'en crée pas. Signal retenu : un terme de
   `horsMesure` (les mots du lecteur que le parseur garde tels quels) qui parle de fibre, d'Internet, de haut
   débit ou de télétravail. **Écartés** : `emploiHorsSujet` (il réunit retraite, sans activité et
   télétravail total), le métier, l'âge, la « connexion » seule (« une bonne connexion avec Paris » est une
   demande de transport), la 4G (une autre grandeur).
4. **Avec ce signal** : la carte passe en tête du groupe « Le territoire » et dit « une question de votre
   projet » ; dans Où vivre, chacune des trois communes proposées reçoit une ligne factuelle.
5. **Où vivre : la ligne est posée par la route `match`, APRÈS le classement.** `matchProjects`, ses scores,
   paliers et ordre ne lisent pas la fibre (ni import, ni champ). La synthèse rédigée ne la reçoit pas
   (projection explicite des champs dans `OuVivreClient.tsx`).
6. **Les phrases qui disaient « non mesuré » ont été corrigées** (règle d'AGENTS.md : chercher tous les points
   de citation). Recherche faite : `grep -rn "fibre\|horsMesure\|manque_produit\|demandesNonMesurees"`.
   - Où vivre, « Ce qui reste ouvert » : « futur•e ne mesure pas ce sujet » devient « futur•e n'en fait pas un
     critère et n'a pas classé les communes sur ce point ; la part des locaux raccordables à la fibre est
     indiquée pour chaque commune proposée ».
   - Dossier, limites : « futur•e ne sait pas encore éclairer « fibre »… sans réponse » devient « « fibre » :
     futur•e n'en fait pas un critère de ce dossier. Le module Territoire donne la part des locaux de la
     commune raccordables à la fibre ; elle ne garantit rien pour une adresse précise. » Règle fixe dans
     `classerNonMesuree`, comme le budget et les écoles.
   - Coût : ce bloc entre dans le plan de conclusion, donc dans l'empreinte de la conclusion rédigée. Le
     28/10/2026, **0 des 5 projets enregistrés en production** ne cite la fibre, Internet ou le télétravail
     (requête en lecture sur `user_profiles`) : aucune régénération déclenchée.
   - Non modifiés : la consigne du parseur (elle cite « fibre » comme exemple de `manque_produit`, ce qui
     reste vrai : ce n'est pas un critère), AskFuture, le Pack Décision.

## 2. Les textes réellement affichés

Relevés dans le navigateur le 28/10/2026 (banc `/dev/fut148`, page `/ou-vivre` restaurée).

**Carte, face** (Job) : « Fibre optique · 3 % des locaux · raccordables à la fibre, juin 2026 · Arcep ·
échelle communale · Détail → ». Avec un projet qui en parle : « … juin 2026 · une question de votre projet ».
Chabreloche : « Aucun local · raccordable à la fibre, juin 2026 ».

**Volet** (Job) :
- « Le raccordement à la fibre » · *Fibre optique* · **3 % des locaux raccordables**
- « Au 30 juin 2026, 3 % des locaux de la commune sont raccordables à la fibre, selon l'Arcep. »
- Locaux raccordables 22 · Locaux recensés environ 765
- *Ce que ce taux ne dit pas* : « Ce taux concerne l'ensemble de la commune. Il ne garantit pas que le
  logement qui vous intéresse est raccordable. Un local que la fibre n'atteint pas encore n'est pas privé
  d'Internet pour autant : le cuivre (ADSL), la 4G ou la 5G fixe, le satellite ou un réseau câblé peuvent le
  desservir. »
- *À vérifier* : « Pour une adresse précise, la carte de l'Arcep indique si l'immeuble ou la maison est
  raccordable ; l'opérateur le confirme ensuite. » · lien « Vérifier une adresse sur cartefibre.arcep.fr ↗ »
- *Méthodologie et sources* (replié) : fichier, date, licence, formule et effectifs, dénominateur Insee le
  cas échéant, définition de « raccordable », exclusion des « raccordables sur demande », « raccordable ne
  veut dire ni abonné, ni proposé par tous les opérateurs, ni un débit garanti », « En France, 95 % des
  locaux sont raccordables à la même date. »

**Données manquantes** : « — · Chiffres de l'Arcep à confirmer » (Thumeréville) ; « Aucun local recensé »
(Beaumont-en-Verdunois) ; « Non publiée par l'Arcep » ; « Donnée indisponible ». Le volet dit chaque fois
que ce n'est pas une absence de fibre, et garde le lien de vérification.

**Où vivre**, carte de résultat (projet « … Je télétravaille, il me faut la fibre ») :
« Fibre : 93 % des locaux de la commune raccordables (Arcep, juin 2026), à vérifier à l'adresse. »
À 0 % : « Fibre : aucun local de la commune raccordable (Arcep, juin 2026) ; d'autres accès à Internet
peuvent exister. »

## 3. Recette contre la source

Les valeurs attendues des tests (`src/lib/fut148-fibre.test.ts`) sont relevées dans le **classeur** de
l'observatoire, une publication distincte du fichier dont la table est tirée.

| Commune | Locaux | Raccordables | Affiché | Remarque |
|---|---|---|---|---|
| Chabreloche (63) | 742,10 (Insee) | 0 | Aucun local | Audit FUT-82 : 0 % |
| Gelles (63) | 828 | 0 | Aucun local | Audit FUT-82 : 0 % |
| Job (63) | 765,06 (Insee) | 22 | 3 % | 2,88 % ; audit FUT-82 : 3 % |
| Murat (03) | 207,06 (Insee) | 0 | Aucun local | |
| Murat (15) | 1 650 | 1 579 | 96 % | Audit FUT-82 : 96 % |
| Brasparts (29) | 904 | 878 | 97 % | Audit FUT-82 : 97 % |
| Ajaccio, Bordeaux, Rennes, Strasbourg | | | 99, 97, 97, 93 % | Forte couverture |
| Rochefourchat (26) | 7,67 (Insee) | 7 | 91 % | 1 habitant, dénominateur atypique |
| Haucourt-Moulaine (54) | 1 577,27 / 1 686 | 0 | Aucun local | Écart sans effet ; réseau câblé |
| Thumeréville (54) | 472 / 52 | 49 | Aucun taux | Publications discordantes |
| Beaumont-en-Verdunois (55) | 0 | 0 | Aucun taux | Dénominateur nul |
| Paris (somme de 20) | 1 811 579 | 1 744 131 | 96 % | = ligne communale du classeur |
| Lyon, Marseille (sommes) | | | 98 %, 90 % | = lignes communales du classeur |
| Paris 1er, Lyon 9e, Marseille 16e | | | 91, 95, 85 % | « de l'arrondissement » |
| Les Abymes, Saint-Denis (974), Mamoudzou | | | 94, 97, 27 % | Outre-mer : dans la table, hors du référentiel produit |
| Code inconnu, table illisible | | | Aucun taux | Jamais 0 % |

Vérifications demandées par le ticket :

1. Pourcentages = effectifs de la source : 18 communes contre le classeur, 34 919 classes `couv`.
2. Millésime : « Au 30 juin 2026 », trimestre 2026T2, contrôlé par test.
3. 0 % ≠ aucun accès Internet : la phrase de limite et la ligne Où vivre le disent, test dédié.
4. Jamais une affirmation à l'adresse : test d'interdits sur toutes les sorties.
5. Erreur, absence, commune hors fichier : jamais 0 %, test dédié.
6. Scores et classement inchangés : même trio, mêmes scores, avec ou sans le mot « fibre », sur la vraie
   route (Briançon 95, Doussard 94, Pontarlier 92 ; puis La Bourboule 85, Saint-Flour 85, Espaly 81) ;
   `comparateur-vie.ts` n'importe rien de la fibre (test).
7. Avec le mot « fibre » : carte en tête et lignes Où vivre ; sans : carte à son rang, aucune ligne.
8. Aucun appel modèle : snapshot Territoire, synthèse Où vivre et chaîne fibre vérifiés par test.

Recette bureau (1 366 px) et mobile (390 px, volet en feuille du bas, aucun défilement horizontal).
Défaut trouvé et corrigé en recette : « Aucun local / raccordables » (accord).

## 4. Coût et performance

Mesurés le 28/10/2026, voir la PR pour les chiffres du build.

- Table : 901 Ko (246 Ko compressée), lue une fois par process et par route qui l'utilise.
- Import : 56 Mo téléchargés, ≈ 12 s au total, aucun service ni tâche planifiée.
- Territoire : une lecture de fichier embarqué, sans réseau. Où vivre : idem, et seulement pour un projet
  qui parle de connexion.

## 5. Mise à jour trimestrielle (manuelle, documentée)

L'Arcep publie un trimestre environ trois mois après sa clôture (T2 au 10 septembre, T3 attendu en décembre).
Aucune automatisation : la fréquence (quatre fois par an) et la durée (moins d'une minute) ne la justifient pas.

1. `node scripts/arcep/telecharger.mjs` (le trimestre le plus récent qui publie les deux fichiers).
2. `node scripts/arcep/construire.mts --rapport /tmp/arcep-rapport.json`. Si la construction échoue,
   lire le message : un changement de géographie communale (couverture < 99,5 %) se traite avant de publier.
3. Relire le rapport : `discordantes`, `ecartsSansEffet`, `referentielAbsents`, `sansLocaux`.
4. Mettre à jour les valeurs attendues de `src/lib/fut148-fibre.test.ts` depuis le **classeur** du nouveau
   trimestre (jamais depuis la table), puis lancer le test.
5. `git diff data/arcep-fibre.json` : une commune par ligne.

La date affichée (« Au 30 juin 2026 ») et le mois (« juin 2026 ») viennent de la table : rien d'autre à changer.

## 6. Limites et réserves

- **Le signal « télétravail » est étroit.** Un lecteur qui dit « 100 % télétravail » sans parler de fibre
  peut n'obtenir que `emploiHorsSujet`, que nous n'utilisons pas : il voit la carte Territoire à son rang
  ordinaire, pas la ligne Où vivre. L'élargir supposerait un champ dédié du Projet (hors périmètre).
- La détection repose sur le parseur, qui range « fibre » en `horsMesure` (constaté dans la sonde FUT-45) ;
  non re-sondé ici pour ne pas ajouter d'appel modèle.
- Le Pack Décision (comparatif payant) et AskFuture ne disent rien de la fibre.
- Le dénominateur Insee est une estimation, et l'Arcep prévient que les déclarations « peuvent être sujettes
  à modification ». Le volet dit « environ ».
- Deux publications de l'Arcep peuvent se contredire (Thumeréville) : la construction le détecte et futur•e
  se tait plutôt que de choisir.
