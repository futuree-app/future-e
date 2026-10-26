# FUT-135 · Part étudiante : un village sans étudiant n'est plus noté comme une ville étudiante

25/10/2026 · branche `bonjourfuturee/fut-135-part-etudiante-village`, partie de `main` @ `e18b56d7` · sans réseau pour le calcul (source MESR en cache local), sans appel Anthropic, sans écriture utilisateur.

## 1. Cause exacte

`scripts/populate-etudiants.py` faisait deux choses qui, ensemble, notaient la quasi-totalité de la France comme étudiante :

1. **Une part conventionnelle de 0** pour tout bassin (unité urbaine, sinon commune hors unité urbaine) de moins de 5 000 habitants. Une absence de mesure devenait une valeur mesurée.
2. **Un percentile `bisect_right`**, qui donne à tout groupe d'ex æquo le rang du **haut** du groupe. 88 % des communes partageant la valeur 0, ce plateau recevait le rang 88.

Résultat, reproduit exactement sur l'index de `main` (`d92b56ff…`) :

| Constat du ticket | Index de `main` |
|---|---|
| communes à `etudes_dyn = 88` | **30 771** sur 34 788 |
| dont bassin de moins de 5 000 habitants | **29 217** |
| dont bassin d'au moins 5 000 habitants | **1 554** = 1 279 sans aucun étudiant + 275 avec quelques étudiants (par exemple 20 dans une unité urbaine de 22 120 habitants), dont le rang arrondi tombait aussi à 88 |
| valeur minimale | **88** (aucune commune en dessous) |
| `vie_etudiante` minimale de ces communes | **69** : toutes au palier « forte », toutes avec une raison favorable (≥ 55) et l'identité « Pour une ville étudiante à taille humaine. » |
| Leménil-Mitry (2 hab.) | accès 65, dynamisme 88, **vie 79** : palier forte, raison, identité, découverte, et trait « vie étudiante » transmis à « une ville comme Leménil-Mitry » |
| Rochefourchat (1 hab.) | accès 40 (aucun établissement dans 25 km), dynamisme 88, **vie 69** |
| « 9 848 resteraient forte par l'accès seul » | 9 848 = communes à 88 dont l'accès est ≥ 66 ; sur tout l'index, 12 002 communes ont un accès ≥ 66 |

Le moteur aggravait l'effet : `subScore("vie_etudiante")` se repliait sur l'accès seul quand le dynamisme manquait.

La spécification d'origine (`docs/superpowers/specs/2026-06-03-vie-etudiante-design.md`) voulait pourtant qu'« une commune sans étudiant [ait] une part de 0 (percentile bas) » : le défaut est d'implémentation. La spec porte désormais un amendement daté.

## 2. Règle retenue

**Trois états, jamais confondus** (`part_etudiante`, `scripts/populate-etudiants.py`) :

| Situation | `etudes_dyn` | Communes |
|---|---|---|
| bassin de moins de 5 000 habitants | `null` : part non représentative dans cette convention | 29 227 |
| bassin sans population connue | `null` : donnée absente | 6 |
| bassin mesuré sans aucun étudiant recensé par l'atlas | **vrai zéro, mesuré**, rang 12 | 1 280 |
| bassin mesuré avec étudiants | rang 13 à 100 | 4 275 |

**Rang** : sur les seules communes mesurées, ex æquo **par le milieu** (midrank) : `100 × (nb < x + nb ≤ x) / 2 / n`, arrondi au demi supérieur (`Math.round`, pas l'arrondi à l'entier pair de Python). C'est la convention déjà retenue et motivée dans `src/lib/rang-national.ts` : un plateau lit la position de son milieu, ni son bas ni son haut. Une abstention ne déplace le rang de personne. Le plateau des zéros reçoit 12, et un bassin sans étudiant plafonne à `vie_etudiante = 47` (accès 100 compris), sous le seuil des raisons et de l'identité (55).

**Combinaison 40 % accès / 60 % dynamisme** : `vie_etudiante` exige **ses deux mesures**. Sans l'une d'elles, la priorité est **non mesurée** :
- accès connu, dynamisme absent (tous les petits bassins) : `null`. Le repli sur l'accès seul notait « ville étudiante » un village voisin d'un campus ; l'accès reste un fait distinct (`etudesSup`, règle d'absence du dossier, inchangée) ;
- dynamisme connu, accès absent (aucune commune aujourd'hui) : `null`. Se replier sur le dynamisme seul lui donnerait 100 % du poids et changerait le sens de l'indicateur.

C'est la règle la plus conservatrice, sans nouveau seuil : le seul seuil (5 000 habitants) existait déjà, il change seulement d'effet (abstention au lieu d'un zéro fictif).

**Doctrine FUT-109 préservée** : une priorité déclarée non mesurée sort du numérateur et du dénominateur, rend la couverture « partielle » ou « aucune », place la commune après les communes mesurées, et ne reçoit ni palier, ni raison, ni compromis sur ce critère (`scorePreferences`, `ordreClassement`, inchangés).

## 3. Source et millésime

- MESR, `fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables`, champ `effectif_atlas` (effectifs par commune de l'établissement). Export téléchargé le 25/10/2026, sha256 `18f6c723…`, mis en cache dans `data/.cache/mesr-atlas-effectifs.json` (non versionné), empreinte écrite dans `meta.etudesDyn.sourceSha256`.
- **Rentrée figée à 2024** (`RENTREE` dans le script, `--rentree` pour la changer). Le script prenait d'office la rentrée la plus récente : la source publie désormais 2025.
- Preuve que `main` est en 2024 : le script d'origine rejoué en 2024 sur l'index courant ne diffère de `main` que sur **15 communes**, exactement l'effet différé de FUT-109 (audit FUT-109 §5.3) : les 11 communes laissées `null` recevraient 88 (Conques-en-Rouergue, Aurseulles, les 4 rétablies du Cantal, Orée d'Anjou, Les Hauts-Talican, Porte des Pierres Dorées, L'Oie, Sainte-Florence), et les 4 communes de l'unité urbaine de Tréguier passeraient de 92 à 93. En 2025, l'écart serait de 456.
- Le correctif est donc **la seule cause** des changements, à ces 15 communes près, dont la population a été corrigée par FUT-109 et qui sont désormais calculées à la bonne population (10 non mesurées : petit bassin ; Orée d'Anjou mesurée).

**Rentrée 2025, mesurée à part et non appliquée** (même méthode, même index) : effectifs 3 027 462 → 3 059 745 ; changerait **3 132 rangs** (jusqu'à 28 points), 2 017 scores `vie_etudiante`, 76 paliers, 36 raisons ou identités ; aucune commune ne changerait d'état mesuré / non mesuré. L'effet est plus visible qu'avec l'ancienne méthode (456) parce que l'échelle n'est plus écrasée entre 88 et 100. À traiter comme une mise à jour de source déclarée.

## 4. Mesures avant / après (index entier, vrai moteur)

Script reproductible : `node scripts/fut135/audit-vie-etudiante.mjs --photo …` puis `--comparer avant après`. Sortie complète : `docs/audits/2026-10-25-fut135-part-etudiante/comparaison.json`.

**`etudes_dyn`**

| | non mesuré | 10-19 | 20-29 | 30-39 | 40-49 | 50-59 | 60-69 | 70-79 | 80-89 | 90-99 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| avant | 17 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 31 117 | 3 479 | 175 |
| après | 29 233 | 1 280 | 363 | 551 | 554 | 558 | 567 | 471 | 663 | 523 | 25 |

**`vie_etudiante`**

| | non mesuré | 20-29 | 30-39 | 40-49 | 50-59 | 60-69 | 70-79 | 80-89 | 90-99 | 100 |
|---|---|---|---|---|---|---|---|---|---|---|
| avant | 0 | 0 | 0 | 7 | 5 | 13 288 | 9 500 | 8 546 | 3 365 | 77 |
| après | 29 233 | 443 | 753 | 1 210 | 709 | 733 | 737 | 582 | 376 | 12 |

**Ce que lit le lecteur**

| | avant | après |
|---|---|---|
| communes au palier « Forte présence étudiante » | 34 772 | **1 985** |
| transitions de palier | | forte → non mesuré 29 218 ; forte → intermédiaire 2 861 ; forte → limitée 708 ; forte → forte 1 985 ; intermédiaire → non mesuré 15 ; intermédiaire → limitée 1 |
| raison favorable possible (≥ 55) | 34 781 | perdue par 32 012, gagnée par 0 |
| identité « ville étudiante à taille humaine » possible (≥ 55) | 34 781 | perdue par 32 012, gagnée par 0 |
| « vie étudiante » en découverte (> 65) | | perdue par 32 787, gagnée par 0 |
| trait « vie étudiante » d'une ville de référence (≥ 70) | | perdu par 18 163, gagné par 0 |
| petits bassins présentés comme étudiants (palier, raison ou identité) | **29 226** | **0** |

Index : seul `etudes_dyn` change (34 747 communes), plus le bloc `meta.etudesDyn`. Aucun autre champ, aucune autre clé de meta, aucun `rankBands` (il n'en existe pas pour `vie_etudiante` : `populate-mismatch-rank` n'a pas été relancé, les bandes services, écoles et culture de FUT-136 sont intactes).

**Trois premières communes des recherches « vie étudiante »**

| Recherche | Avant | Après |
|---|---|---|
| vie étudiante seule | Aubière · Betton · Angers | Betton · Angers · Corenc |
| vie étudiante + éviter les grandes villes | Jonage · Erstein · Arradon | Arradon · La Roche-sur-Yon · **Corte** |
| vie étudiante + train + vie locale | Lyon · Paris · Talence | Lyon · Strasbourg · Noyal-Châtillon-sur-Seiche |
| vie étudiante en Bretagne | Betton · Bohars · Plescop | Betton · Bohars · Séné |
| vie étudiante + nature, Auvergne | Royat · Aurillac · Saint-Didier-en-Velay | Royat · Aurillac · Pont-Salomon |
| retraite calme, un peu d'étudiants | Niederhausbergen · Isneauville · Saint-Grégoire | Niederhausbergen · Saint-Grégoire · Verson |
| une ville comme Poitiers | Paris · Talence · Ramonville-Saint-Agne | Ramonville-Saint-Agne · Rennes · Beaucouzé |
| une ville comme Rennes | Gentilly · Lyon · Lingolsheim | Lingolsheim · Rennes · Lyon |
| une ville comme Brest | Sainte-Adresse · Brest · Saint-Mandrier-sur-Mer | Brest · Sainte-Adresse · Jacou |
| une ville comme Albi | Chamalières · Mareil-Marly · Montpellier | Chamalières · Pérols · Longueau |
| une ville comme Leménil-Mitry | Châtel-Saint-Germain · Saint-Clément-de-Rivière · Marseille | Sadirac · Thurins · Marseille (le trait « forte présence étudiante » n'est plus dérivé) |

Corte (51,7 % d'étudiants, la plus forte part de France) garde son score (97) ; il entre dans le trio parce que les communes notées au-dessus de lui par le 88 conventionnel (Jonage, Erstein) redescendent. Avant, 497 communes valaient au moins 97.

**Autres recherches** (nature + calme, mer + soins, vie locale petite ville en Charente-Maritime, fraîcheur + train) : **trios inchangés**. Une seule carte change : Jonzac perd l'identité « Pour une ville étudiante à taille humaine. » et prend « Pour s'installer dans une commune qui gagne des habitants. ». Les signaux « vie étudiante » réapparaissent sur 2 cartes (Melesse, « forte présence étudiante », agglomération de Rennes ; Barr, « présence étudiante limitée ») : avant, toutes les communes étant « forte », le filtre de contraste les taisait. Sur les 18 recherches, les identités « ville étudiante » passent de 16 à 12.

**Synthèses** : elles ne lisent que ces cartes (raisons, identité, découverte, signaux, couverture) et le message de couverture FUT-109 ; les signaux ignorent une valeur nulle (`assignSignaux`). Aucune synthèse n'a été générée (appel payant) : l'équivalence se lit sur leurs entrées.

**Accueil** : `src/data/accueil-communes.json` régénéré, seule l'empreinte de l'index source change ; `verifier-equivalence` : identité 34 791/34 791, intrants chaleur, taille et hivers identiques, 104 373/104 373 lectures rendues identiques.

## 5. Changements observables pour le lecteur

- Une commune dont le bassin compte moins de 5 000 habitants n'est plus jamais « ville étudiante » : ni palier, ni raison, ni identité, ni découverte, ni trait d'ancre. Dans la comparaison complète, sa case « Vie étudiante » dit « Non mesurée », sans palier ni avantage (les autres dimensions gardent « Non concernée »).
- Si le lecteur a demandé la vie étudiante, ces communes passent après les communes mesurées et leur carte dit que ce critère n'y est pas mesuré (FUT-109).
- Les recherches « vie étudiante » remontent de vraies villes étudiantes (Corte, Rennes, Angers, La Roche-sur-Yon, Strasbourg) au lieu de communes promues par le 88 conventionnel.
- Le palier « Forte présence étudiante » redevient rare (1 985 communes) et donc informatif.

## 6. Tests

- `src/lib/fut135-vie-etudiante.test.ts` (12 tests, dont « Non mesurée » dans la comparaison complète d'un petit bassin, avec la couverture FUT-109 qui continue de signaler l'absence ; index réel et vrai moteur) : bassin de moins de 5 000 habitants ; bassin mesuré sans étudiant ; données réellement absentes ; bassin étudiant significatif (Corte, Poitiers, Rennes) ; ex æquo (une UU, un rang ; le plateau des zéros au plus bas) ; accès connu sans dynamisme ; dynamisme connu sans accès ; combinaison 40/60 ; **index entier** : aucun petit bassin ni bassin sans étudiant à `vie_etudiante` ≥ 55 ; aucune promotion par un critère non mesuré (Lozère : couverture, raisons, identité, découverte, case de comparaison) ; aucun trait d'ancre sans mesure.
- `scripts/populate-etudiants.test.mjs` : autotest Python (abstention, vrai zéro, rang moyen, plafond, rentrée absente refusée).
- `src/lib/comparateur-demographie-causalite.test.ts` (D2, FUT-36) ajusté : il figeait un effet du défaut. Ambérieu-en-Bugey, notée 71 en vie étudiante par le 88 conventionnel (41 désormais), prenait l'identité « ville étudiante » ; elle prend maintenant la première l'identité de croissance, unique dans le groupe, et Belley son candidat suivant. L'intention (aucune identité causale, croissance dite sans « qui attire ») est conservée et vérifiée.
- `npm test` : **3 184 / 3 184**. `tsc --noEmit` : 0 erreur. Build : vert (`prebuild` compris : index vérifié, données de l'accueil identiques).
- Lint : `npx eslint` sans argument plante **sur `main` aussi** (règle `react/no-unescaped-entities` déclarée dans un bloc sans `files`, configuration inchangée ici). Sur les fichiers modifiés : 0 erreur, 1 avertissement antérieur (`tailleVilleFrom` inutilisé dans `comparateur-vie.ts`). `npx eslint src` : 6 erreurs, toutes dans des fichiers non touchés.
- Reproductibilité : deux rejeux complets depuis l'index de `main` (`populate-etudiants.py --write-index`, `index:pack`) donnent la même empreinte `eff0bea6…`.

## 7. Limites

1. **L'accès a le même défaut d'ex æquo.** Le score mêle deux faits distincts : la **présence étudiante dans l'agglomération** (`etudes_dyn`, part des étudiants dans la population de l'unité urbaine) et les **établissements accessibles depuis la commune** (`etudes_acces`, établissements du supérieur dans le rayon autour de la commune). Ce second fait (`populate-bpe.py`, `percentile_scores`) range aussi par `bisect_right` : les 14 123 communes sans établissement accessible valent 40. Parmi les communes mesurées, 487 sans établissement accessible atteignent encore ≥ 55, par la seule présence étudiante de leur agglomération (Thurins, 3 131 habitants dans l'unité urbaine de Lyon : aucun établissement dans son rayon, accès 40, présence étudiante de l'agglomération 92, vie 71). Avec un rang moyen sur l'accès (≈ 20), 360 resteraient ≥ 55, mais seulement 11 sur 255 au palier « forte ». Non corrigé ici : `etudes_acces` ne se rejoue pas depuis l'index (accès brut arrondi, 15 714 écarts), et relancer `populate-bpe.py` réécrit écoles et culture, qui relèvent de FUT-136. Décision du porteur (25/10) : **aucun calcul modifié dans cette PR** ; la question sera traitée séparément, avec une méthode vérifiable, dans **FUT-141** (coordonné avec FUT-136 : la convention d'ex æquo de `percentile_scores` concerne aussi écoles et culture). Leurs **textes**, eux, sont corrigés dans cette PR (§8).
2. **Le bassin est l'agglomération** (choix de la spec) : une petite commune d'une grande unité urbaine étudiante est notée sur la part de son agglomération. C'est voulu ; depuis la revue (§8), les textes le disent, et l'identité « ville étudiante » est réservée au pôle de son bassin. Elle reste « à taille humaine » pour un pôle de grande taille (Lyon) : formulation antérieure, non traitée ici.
3. **Zéro = aucun étudiant recensé par l'atlas**, compté à la commune de l'établissement, pas au domicile : un bassin sans établissement mais avec des étudiants résidents vaut 0.
4. **Échelle des rangs** : elle compte des communes, pas des bassins (convention conservée) ; une grande unité urbaine pèse autant de fois qu'elle a de communes.
5. ~~« Non concernée »~~ : corrigé le 25/10 pour la seule vie étudiante, qui dit désormais « Non mesurée » quand le score est absent (une priorité non mesurée concerne toujours le lecteur qui l'a demandée). Les autres dimensions gardent « Non concernée ». Aucun score, classement ni artefact ne change (photographie d'audit identique, même empreinte d'index).
6. **Rentrée 2025** : disponible, non appliquée (§3).

## 8. Revue indépendante du 25/10 : les mots suivent le grain des données

La revue de Work (FUT-135, SHA `db788843`) a validé le calcul et bloqué la livraison sur les **formulations** : elles prêtaient à une commune une présence étudiante mesurée à l'échelle de son agglomération. Correctif **exclusivement narratif** : aucun score, seuil, palier numérique, avantage, couverture, classement ni donnée ne change.

### Trois mesures, trois échelles

| Mesure | Échelle | Ce que le texte peut dire |
|---|---|---|
| `etudes_dyn` | bassin, l'unité urbaine le plus souvent | une présence étudiante **dans l'agglomération de X** (dit tel quel pour le pôle, ou une commune seule dans son bassin) |
| `etudes_acces` / `etudesSup` | la commune, dans un rayon (5 à 25 km) | « aucun établissement supérieur recensé à moins de N km », borné au rayon ; jamais une absence d'étudiants résidents |
| `vie_etudiante` | combinaison 40/60 | un niveau (forte, intermédiaire, limitée) **égal au palier** de la comparaison, jamais au-dessus |

Une seule fonction rédige ces phrases (`presenceEtudiante`, `src/lib/comparateur-vie.ts`). Le pôle est la commune qui donne son nom à l'agglomération (`libellesAgglomeration`, Paris, Lyon et Marseille en ville entière) ou une commune seule dans son bassin. L'absence d'établissement reprend **le prédicat du dossier** (`classifyHigherEdAbsence`, même attestation que `module-facts-map.ts`).

### Consommateurs corrigés

- **Raisons des cartes** (`REASON_POS`) : niveau du palier (une raison à 63 dit « intermédiaire ») et échelle.
- **Découverte** et **traits d'une ville de référence** : même fonction.
- **Compromis** (`REASON_NEG` via `raisonNeg`) : « présence étudiante limitée » seulement au palier limité, à l'échelle mesurée.
- **Signaux ambiants** (AskFuture, synthèse) : même fonction.
- **Comparaison complète** : palier à l'échelle (« Forte présence étudiante dans l'agglomération de Lyon ») ; qualificatif « aucun établissement supérieur recensé à moins de 5 km », affiché même pour la commune qui mène ; aide : « La part d'étudiants dans l'agglomération, et les établissements supérieurs accessibles depuis la commune. » ; synthèse de thème : « Thurins se distingue par la présence étudiante de son agglomération », « sa vie étudiante » restant réservé au pôle avec établissement.
- **Identité** « Pour une ville étudiante à taille humaine. » : réservée à une commune pôle de son bassin avec au moins un établissement recensé dans son rayon. Les communes concernées prennent leur candidat suivant ; le seuil (55) est inchangé.
- Inchangés : résumés et arbitrages (niveau thème, ils ne citent pas la vie étudiante), prompts de synthèse, moteur, dossiers.

### Reproductions avant / après

Script : `scripts/fut135/reproductions-revue.mjs` ; sorties : `docs/audits/2026-10-25-fut135-part-etudiante/reproductions-revue.txt`.

| Cas | Avant (`db788843`) | Après |
|---|---|---|
| A. Pont-Salomon, 3ᵉ de « vie étudiante + nature en Auvergne » (score 63) | raison « forte présence étudiante » | « présence étudiante intermédiaire dans l'agglomération de Saint-Étienne, aucun établissement supérieur recensé à moins de 10 km » ; trio identique |
| B. Thurins dans la comparaison complète | « Forte présence étudiante » ; aide « La présence d'étudiants et d'établissements supérieurs. » | « Forte présence étudiante dans l'agglomération de Lyon », qualificatif « aucun établissement supérieur recensé à moins de 5 km », nouvelle aide ; avantage inchangé (Thurins et Poitiers), lu sur des paliers qui disent leur échelle |
| C. Saint-Jean-des-Vignes (479 hab.) | identité « Pour une ville étudiante à taille humaine. » | « Pour s'installer dans une commune qui gagne des habitants. » |

### Aucun changement fonctionnel

`node scripts/fut135/audit-vie-etudiante.mjs --recits avant après` (sortie : `recits-revue.json`) compare `db788843` et ce correctif sur les **34 788 communes** et les **18 recherches** : **0 écart** sur l'accès, le dynamisme, le score, le palier, les raisons, découvertes et traits possibles, la composition et l'ordre des trios et des pistes, les compatibilités, la couverture, la disponibilité et l'avantage des cellules. Empreinte d'index inchangée (`eff0bea6…`), données de l'accueil inchangées, `verifier-equivalence` 104 373/104 373.

Récits modifiés : dans les 18 recherches (raisons et découvertes nommant l'agglomération ; aide et cellules de la comparaison ; Saint-Mandrier, à 63, passe de « forte » à « intermédiaire »). **Identités finales** changées dans les trios et pistes : Verson, Beaucouzé, Bègles, Échirolles et Thurins quittent « ville étudiante » ; Besançon (pôle avec établissements) la reprend dans son groupe, libérée par Échirolles. Sur l'index, l'identité étudiante candidate passe de 2 769 à **259** communes : 2 023 communes hors pôle (avec établissement dans leur rayon) et les 487 sans établissement recensé la perdent.

### Les 487 communes de la revue

`node scripts/fut135/controle-487.mjs` : les 487 communes (dont 255 au palier fort), vérifiées une par une sur les vraies sorties, **0 faute** :
- candidats d'identité et traits d'ancre : jamais « ville étudiante » ;
- comparaison complète avec Poitiers : palier à l'échelle de l'agglomération et qualificatif du rayon pour les 487, identité, découverte, signaux et synthèses de thème ;
- carte de recherche réelle (département et population exacte, hors réseau) pour les **405** communes au-dessus du plancher de réalisme du moteur (1 500 habitants) : raison étudiante qualifiée sur les 405 ; les **82** sous le plancher n'apparaissent dans aucune recherche ;
- 42 cartes et pistes de recherches « vie étudiante » de leurs départements.

Une première version de ce contrôle forçait les communes par `nearPlace` : pour les noms ambigus, le moteur a interrogé le géocodeur public de la BAN (environ 85 requêtes de lecture, aucune écriture). La version versionnée n'utilise plus aucun réseau.

### Tests ajoutés (`src/lib/fut135-vie-etudiante.test.ts`)

Pont-Salomon (raison et palier cohérents, trio inchangé, aucune raison « forte » sous 66 dans la recherche) ; Thurins (palier, qualificatif, aide, avantage, résumé, synthèse de thème) ; Saint-Jean-des-Vignes (identité finale et candidats) ; Angers, Rennes, Poitiers, Corte (formulations favorables intactes) ; « Non mesurée » et couverture FUT-109 ; Thurins et La Flèche (présence mesurée et absence d'établissement, deux faits distincts) ; les 487 sur l'index entier.

### Limites de ce correctif

- L'**avantage** de la comparaison suit toujours les paliers numériques : Thurins mène avec Poitiers, sur un palier qui dit désormais « dans l'agglomération de Lyon ». Le retirer aurait changé un résultat de comparaison.
- La **ligne de fracture** (`divergence`) reprend le palier à l'échelle, sans le qualificatif du rayon.
- Les raisons qualifiées sont **longues** (jusqu'à ~110 caractères) ; aucune capture navigateur n'a été faite.
- La Flèche (seule dans son unité urbaine) a des étudiants recensés par le MESR mais aucun établissement recensé par la BPE dans 25 km : les deux faits sont dits côte à côte, sans réconciliation des sources.
- **FUT-141** : la méthode de l'accès (`etudes_acces`, ex æquo à zéro) reste un chantier distinct, coordonné avec FUT-136.

## 9. Régénérer

```bash
npm run index:unpack
.venv-bpe/bin/python scripts/populate-etudiants.py --selftest
.venv-bpe/bin/python scripts/populate-etudiants.py --write-index   # rentrée 2024 figée ; --refresh pour retélécharger la source
npm run index:pack && npm run index:verify
node scripts/accueil/donnees-accueil.mjs --ecrire
node scripts/accueil/verifier-equivalence.mjs
```

Ne pas relancer `populate-mismatch-rank.mts` ni `populate-bpe.py` pour ce ticket.
