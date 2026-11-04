# FUT-137 · Associations du RNA rangées sous des codes de communes disparus

Correctif préparé le 04/11/2026 sur la branche `bonjourfuturee/fut-137-vie-locale-rattacher-les-associations-rna-rangees-sous-des`, partie de `main` @ `37a108150c774ecbedeff47d16650f268267ac1c` (après FUT-138, #125). Mesure détaillée : `docs/audits/2026-11-04-fut137-associations-rna/effets.json`.

## 1. En une phrase

Le Répertoire national des associations range une association sous le code de la commune de son adresse, souvent le code d'une commune disparue depuis une fusion. Sur `main`, **10 031 associations actives** n'étaient comptées dans aucune commune. Elles le sont désormais dans la commune actuelle qui porte leur territoire. Une association dont la commune actuelle ne peut pas être établie n'est attribuée à personne.

## 2. Diagnostic : le défaut était-il toujours présent ?

**Oui, intact.** L'index de `main` a été rejoué depuis les caches (OSM, RNA, AMALIA) : **0 écart** sur les 34 788 communes, et 1 838 871 associations rattachées, le même « avant » que le diagnostic du 24/10.

- 1 954 654 associations sont actives dans le fichier RNA du 01/06/2026.
- 1 837 059 sont rangées sous un code en vigueur de l'index. FUT-109 en reprenait 1 812 de plus, sous 66 codes repris depuis le 01/01/2024.
- **10 031** étaient rangées sous **1 032 autres codes disparus** et n'étaient comptées nulle part.
- Dont 368 sous 12 codes absorbés **le 01/01/2024** : FUT-109 ne les reprenait pas, car ces communes nouvelles avaient déjà la bonne population. Exemple : 252 associations de Pierre-Bénite, désormais comptées dans Oullins-Pierre-Bénite.

Les fusions de 2016 à 2019 sont les plus nombreuses : 8 484 associations sur 10 031. Il y a aussi des fusions-associations des années 1970.

**Ce qui a changé sur `main` depuis le 24/10** n'a aucun effet sur la vie locale :
- **FUT-138** (prix DVF) : n'utilise pas la vie locale, et a épinglé le COG 2026, réutilisé ici.
- **Le fichier RNA** est le même. Son empreinte est désormais épinglée.
- **Le COG 2026** donne le même successeur que le COG 2025 pour tous les codes du RNA (§7).

## 3. La règle : la table des successeurs du COG

Le correctif est une table : pour chaque code disparu du COG, la commune actuelle de l'index, ou la raison de s'abstenir. Elle est construite depuis les fichiers Insee et versionnée dans `data/successeurs-cog2026.json`. `populate-vie-locale.py` la lit. Elle peut servir à d'autres sources plus tard, sans nouvelle règle.

**Millésime : COG au 01/01/2026.**
- L'index est au COG du 01/01/2025. Le COG 2026 n'a **aucun mouvement territorial** depuis : 34 875 communes identiques. Le constructeur le vérifie (`verifierGeographieCompatible`, la preuve de FUT-138) et refuse sinon.
- Le COG 2026 est le plus récent pour les communes déléguées (règle 1 ci-dessous).
- Son fichier des mouvements est **déjà épinglé** par FUT-138 et partage le même cache. Le fichier des communes est épinglé ici. Les deux empreintes ont été vérifiées le 04/11/2026 contre les fichiers téléchargés chez l'Insee.

**Sens des mouvements dans ce millésime** (vérifié sur des lignes du fichier, pas supposé) :
- 21 : rétablissement. La ligne part de la commune d'origine, vers elle-même et vers la commune rétablie.
- 31 : fusion simple ; 32 : création de commune nouvelle ; 33 : fusion-association.
- 34 : une association devient une fusion simple.
- 41 : changement de code dû à un changement de département. Exemple : Freigné, de 49144 à 44225 en 2018.
- 50 : changement de code dû à un transfert de chef-lieu. Exemple : Champtoceaux, 49069, vers Orée d'Anjou, 49126.

**La règle, dans l'ordre** (`scripts/lib/successeurs-cog.mjs`) :
1. **Un code encore commune déléguée ou associée au COG en vigueur** va dans sa commune de rattachement. C'est la déclaration officielle actuelle.
2. **Sinon, la chaîne des fusions et changements de code**, jusqu'à une commune existante. C'est la règle déjà utilisée par les incendies (FUT-147), les anciens codes (FUT-152) et les prix DVF (FUT-138). Elle est réutilisée sans changement de comportement : `chaineCog` expose ses étapes datées, et `resolveurCog` s'en sert.
3. **Abstention** quand une commune d'arrivée de la chaîne a été **découpée par un rétablissement après l'arrivée du code**. Le territoire peut alors être de l'un ou l'autre côté, et le code ne le dit pas. Rien n'est réparti, ni donné à la commune qui a gardé le code.
4. **Refus** (la table ne s'écrit pas) si la chaîne, sans ambiguïté, et le rattachement officiel désignent deux communes différentes. Cela n'arrive aujourd'hui pour aucun code.
5. **Abstention** si la commune actuelle n'est pas dans l'index : outre-mer, ou Lyon, que l'index lit par arrondissement.

**Le cas qui justifie la règle 1 : La Neuville-Garnier (60455).**
- En 2019, elle entre dans Les Hauts-Talican (60054).
- En 2024, Beaumont-les-Nonains est rétablie **sous 60054**, et Les Hauts-Talican passe sous 60694.
- La chaîne seule mène à 60054, qui n'a gardé que le code. Le COG en vigueur dit que La Neuville-Garnier est déléguée de **60694** : c'est là que vont ses 4 associations.
- 60694 reste non notée, comme toute commune touchée par un rétablissement depuis 2024 (FUT-109).

**Résultat sur tout le COG** : 4 242 codes disparus.

| Issue | Codes | Associations actives |
|---|---|---|
| Rattachés par la chaîne | 4 154 | 11 834 |
| Rattachés par le rattachement officiel (chaîne ambiguë) | 48 | 9 |
| **Abstention : commune d'arrivée découpée après l'arrivée** | **27** | 0 |
| Sans successeur (communes supprimées ; Saint-Barthélemy, Saint-Martin) | 8 | 242 |
| Hors de l'index (Saint-Rambert-l'Île-Barbe dans Lyon ; 4 codes de Guyane) | 5 | 0 |

Les 27 codes ambigus sont listés, avec la commune découpée et les dates, dans `abstentions` de la table. Exemples :
- Cussac entre dans Le Buisson-de-Cadouin en 1960, qui est découpée en 1989 (Urval rétablie).
- Six anciennes communes de la Manche entrent dans Pontorson en 1973, et Pontorson est découpée en 1989.

Aucune association active n'est rangée sous ces codes aujourd'hui. Si une nouvelle édition du RNA en rangeait, elles seraient comptées « non rattachées » sous ce motif, jamais réparties.

**Preuves intégrées au constructeur**, sinon refus et aucune écriture :
- la géographie du COG 2026 est compatible avec l'index ;
- aucune destination n'est hors de l'index, et aucun code rattaché n'est une commune de l'index ;
- un code n'a jamais deux successeurs à la même date (sinon, l'ordre du fichier déciderait) ;
- les 68 codes repris de FUT-109 vont à la même commune ;
- La Neuville-Garnier va dans 60694.

## 4. Aucun double comptage, effectifs conservés

`rattacher_comptes` (`populate-vie-locale.py`) range **chaque association active une seule fois** :
- soit dans une commune de l'index : directement, ou par la table ;
- soit sous un seul motif de non-rattachement.

Le script refuse si la somme ne se conserve pas. Le bilan est versionné (`data/vie-locale-rattachements-rna.json`) avec le compte de chaque code disparu et l'empreinte de la table appliquée.

| | Associations |
|---|---|
| Actives dans le RNA | 1 954 654 |
| Rangées sous un code en vigueur de l'index | 1 837 059 |
| Rangées sous un code disparu, rattachées | 11 843 (dont 1 812 déjà reprises par FUT-109) |
| **Rattachées, total** | **1 848 902** = 1 838 871 + 10 031 |
| Non rattachées : communes d'outre-mer (hors de l'index) | 75 705 |
| Non rattachées : codes hors COG (Polynésie, Nouvelle-Calédonie, Saint-Pierre-et-Miquelon…) | 29 619 |
| Non rattachées : sans successeur (Saint-Barthélemy, Saint-Martin) | 242 |
| Non rattachées : **code vide ou invalide** (`0`, codes postaux…) | 186 |
| **Non rattachées, total** | **105 752** |

**En métropole, seules 186 associations restent hors de toute commune** : elles n'ont pas de code commune exploitable. AMALIA (Alsace-Moselle, 75 198 associations) est inchangé.

## 5. Effets mesurés

Mesure par `scripts/fut137/mesurer-effets.mjs`. Chaque commune passe par les vraies fonctions du comparateur et du dossier : sous-score, seuil de raison, identités, catégories, verdict de rang. L'avant est l'index de `main` @ `37a10815`, l'après celui de la branche.

| Indicateur | Avant | Après | Écart |
|---|---|---|---|
| Associations rattachées | 1 838 871 | 1 848 902 | **+10 031** |
| Associations non rattachables | 115 783 | 105 752 | −10 031 |
| Communes dont le nombre d'associations change | | | **570** |
| Notes de vie locale modifiées | | | **2 088** |
| Notes modifiées de plus d'un point | | | **334** (17 au plus) |
| Paliers modifiés (« animée / intermédiaire / discrète ») | | | **69** |
| Raisons favorables modifiées (seuil 55) | | | **30** (13 gagnées, 17 perdues) |
| Identités « vie locale » modifiées (phrases rendues) | | | **16** (11 gagnées, 5 perdues) ; 34 communes franchissent le seuil 60 |
| Catégories « vie locale faible » modifiées | | | **39** (20 sorties, 19 entrées) |
| Verdicts du dossier (20 % extrêmes) | | | **56** |

**Deux effets distincts** :
- **Les communes qui reçoivent des associations** : 570. Seules elles changent de plus d'un point (les 334). Elles gagnent des paliers (39), des raisons (13) et des identités (11). Dans le dossier, 11 entrent dans les 20 % les plus animées et 11 quittent les 20 % les moins animées. Enfin, 20 quittent la catégorie « vie locale faible ».
- **L'effet de distribution** : le percentile associatif est national. Quand 570 communes montent, d'autres descendent d'un point sans que leurs données changent : 1 637 notes. Cela fait perdre 30 paliers, 17 raisons et 5 identités, en limite de seuil. Cela fait aussi entrer **17 communes** dans les 20 % les moins animées (Coutansouze, 8 → 7) et sortir 17 autres des 20 % les plus animées (La Ferté-Hauterive, 61 → 60). C'est la conséquence normale d'un classement relatif corrigé, pas un ajustement.

Les 31 015 bandes de rang modifiées bougent pour la plupart de quelques points de base (médiane 2, 90 % à 4 au plus). Celles des communes qui reçoivent des associations bougent jusqu'à 2 437 points de base, soit 24 points de rang. Aucune bande d'un autre critère ne bouge (preuve de `populate-mismatch-rank.mts`). **Aucun autre champ de l'index ne change**, hors `vieLocale`, `rankBands.vie_locale` et une phrase de convention (§8). Formules, poids, masse critique `K` et seuils sont inchangés.

## 6. Communes les plus affectées

| Commune | Habitants | Associations récupérées | Note | Percentile associatif |
|---|---|---|---|---|
| Gennes-Val-de-Loire (49) | 8 464 | 307 (Gennes, Saint-Martin-de-la-Place) | 64 → **81** | 44 → 99 |
| Val-d'Arc (73) | 2 012 | 34 | 42 → 58 | 25 → 78 |
| Porte-du-Quercy (46) | 547 | 24 | 13 → 28 | 44 → 92 |
| Les Hauts-d'Anjou (49) | 8 727 | 137 | 15 → 30 | 40 → 89 |
| Belsentes (07) | 547 | 14 | 53 → 65 | 40 → 78 |
| Pechs-de-l'Espérance (24) | 772 | 17 | 24 → 36 | 44 → 81 |
| La Hague (50) | 11 223 | 260 (18 anciennes communes) | 57 → **69** | 56 → 98 |
| Binic-Étables-sur-Mer (22) | 6 881 | 141 (Binic) | 49 → 60 | 60 → 97 |
| **Valromey-sur-Séran (01)** | 1 342 | 17 (01221, 01414, 01442) | **79 → 86** | **59 → 83** |

**Pourquoi des écarts si forts.** La note vaut 0,7 × percentile des lieux + 0,3 × percentile des associations. Ces communes nouvelles ont souvent gardé le code de leur ancienne commune la moins active : Gennes-Val-de-Loire porte le code des Rosiers-sur-Loire, et l'essentiel de ses associations est rangé sous Gennes. Leur tissu associatif était donc compté presque nul. Le percentile associatif saute (44 → 99), et la note de 0,3 × 55 ≈ 17 points au plus. Les lieux (OSM) ne changent pas : ils sont rattachés par position géographique.

**Valromey-sur-Séran** retrouve exactement le diagnostic : 79 → 86, percentile associatif 59 → 83.

## 7. Écarts avec le diagnostic du 24/10

Le diagnostic annonçait 9 973 associations, 2 072 notes, 332 de plus d'un point, 69 paliers, 30 raisons, 32 identités et 39 catégories. **Sa règle, rejouée sur les sources actuelles, le reproduit à l'unité** : 1 848 844 associations, 2 072, 332, 69, 30, 32 et 39. Elle écartait un code dès qu'une commune d'arrivée avait **un jour** été découpée.

| Cause | Effet sur la vie locale |
|---|---|
| Évolution des sources (RNA, AMALIA, OSM) | **aucun** : `main` rejoué à 0 écart, empreinte du RNA identique |
| Référentiel COG 2025 → 2026 | **aucun** : même successeur pour tous les codes du RNA ; les 201 lignes nouvelles sont des changements de nom, des suppressions ou transformations de communes déléguées et associées, et l'historique de l'outre-mer |
| Corrections intervenues depuis (FUT-138…) | **aucun** sur `vieLocale` |
| **FUT-137 : règle d'ambiguïté affinée** | **+58 associations** sous 12 codes, détail ci-dessous |

Le détail des 12 codes :
- **7 codes, 49 associations** : la commune d'arrivée a été découpée **avant** l'arrivée du code. Le Bois et Saint-Oyen entrent en 2019 dans Grand-Aigueblanche, découpée en 1988 ; Saint-Jouin-de-Marnes et Taizé entrent dans Plaine-et-Vallées, découpée en 1983. Aucune ambiguïté : le COG les donne d'ailleurs comme communes déléguées de cette commune.
- **5 codes, 9 associations** : la chaîne est ambiguë, mais le COG en vigueur donne la commune de rattachement, dont 60455 (§3).

Ces 58 associations changent la note de 5 communes (Plaine-et-Vallées 16 → 24, Grand-Aigueblanche 59 → 61, Airvault, Foulain, Meroux-Moval), et de 14 autres d'un point par effet de distribution. C'est l'écart entre 2 072 et 2 088 notes, entre 332 et 334, et entre 32 et 34 bascules du seuil d'identité. Les paliers, raisons et catégories sont identiques.

## 8. Les points de citation de l'ancienne règle

La règle « codes repris » de FUT-109 était citée à quatre endroits. Chacun a été mis à jour :
- le point de décision, `load_rna` ;
- la docstring de `populate-vie-locale.py` ;
- l'en-tête de `populate-population-grain.mjs` ;
- la convention affichée `meta.population.conventions.scoresDependants`, qui dit désormais : « comptées dans la commune actuelle qui porte son territoire (table des successeurs du COG 2026) […] jamais réparties quand la succession est ambiguë ». `populate-population-grain.mjs` a été relancé ; seule cette phrase change dans l'index.

Les textes lus par le lecteur (« associations », « tissu associatif RNA/AMALIA ») restent vrais et ne changent pas. Le commentaire de `subScore` sur les communes rétablies reste exact.

Le rang `vie_locale` reçoit une identité de distribution nouvelle, `mismatch-dist-2026-11-04-vie_locale`, ajoutée au registre `distributions-rang.ts`. L'identité historique y reste pour les dossiers déjà vendus.

## 9. Validation

| Contrôle | Résultat |
|---|---|
| Suite complète (seule, `--test-concurrency=1`) | base `main` **4 294/4 294** ; branche **4 322/4 322** (+28 tests ajoutés, 0 échec) |
| `tsc --noEmit` | 0 erreur |
| ESLint (fichiers modifiés) | 0 erreur, 0 avertissement |
| `verifier-equivalence.mjs` (34 791 codes) | **104 373/104 373** lectures identiques |
| `npm run build` | vert |
| Selftest Python (`populate-vie-locale.py --selftest`, lancé par la suite) | vert |
| Reproductibilité | rejeu complet depuis l'index de `main` (table, vie locale, rangs, convention, empaquetage, accueil) : **`git status` vide**, artefacts identiques octet pour octet |

Empreintes (sha256, 16 premiers caractères) : index `75f18e7d6c636161`, table `c5e3efd7af1977ef`, bilan `122830982fbe69a4`, accueil `6c48a37921ec0077`.

**Tests ajoutés** :
- `scripts/lib/successeurs-cog.test.mjs` (13 tests, COG fictif) : fusion simple, chaîne de trois mouvements, changement de code seul, découpage après l'arrivée (abstention), rattachement officiel, découpage avant l'arrivée, commune en vigueur, chaîne circulaire, hors index, refus d'une divergence, une seule issue par code, indépendance à l'ordre, refus de deux successeurs à la même date.
- `scripts/fut137/rattachement-rna.test.mjs` (10 tests, artefacts versionnés) :
  - le selftest Python (comptes fictifs : conservation, aucun double comptage, refus d'une destination hors index) ;
  - les sources épinglées et les 68 codes de FUT-109 ;
  - des territoires réels : Valromey-sur-Séran, Lieury en quatre mouvements, Conques, Freigné, La Neuville-Garnier, Cussac ;
  - la reconstruction à l'identique ;
  - la conservation du bilan, et le bilan qui applique exactement la table ;
  - les 17 associations de Valromey-sur-Séran ;
  - les abstentions de FUT-109 intactes ;
  - une note ⇔ un rang, et le rang qui suit l'ordre des notes.
- `src/lib/fut137-vie-locale.test.ts` (5 tests, ce que racontent les cartes, avec le vrai moteur) :
  - palier de la comparaison (Gennes-Val-de-Loire, La Hague, Valromey-sur-Séran : « Vie locale animée ») ;
  - identité de La Hague, et la règle vérifiée sur toutes les communes ;
  - sortie de Gouffern en Auge de la catégorie « vie locale faible », et la règle vérifiée sur toutes les communes ;
  - raison favorable de Binic-Étables-sur-Mer ;
  - position favorable de La Hague dans le dossier, sous la nouvelle identité.
- `distributions-rang.test.ts` : `vie_locale` rejoint les critères recalculés.

## 10. Artefacts et Vercel

| Fichier | Taille | Lu par l'application ? |
|---|---|---|
| `data/comparateur-index.json.gz` | 12 183 518 octets (**−2 025**) | oui, 34 fonctions (inchangé) |
| `src/data/accueil-communes.json` | inchangée : seule l'empreinte de l'index source change | oui |
| `data/successeurs-cog2026.json` | 92 Ko | **non** (scripts seulement) |
| `data/vie-locale-rattachements-rna.json` | 73 Ko | **non** (scripts et tests) |

Après le build, aucune des 171 traces `.nft.json` n'embarque les deux nouveaux fichiers. Le stockage des fonctions ne grossit pas.

## 11. Limites, hors périmètre

- **Rétablissements antérieurs à 2024 sous un code en vigueur.** Une association rangée sous une commune encore existante y reste comptée, même si cette commune a été découpée il y a longtemps. FUT-109 n'a traité que les rétablissements depuis 2024. Ce ticket ne rouvre pas ce choix, faute d'anomalie démontrée.
- **AMALIA** (Alsace-Moselle) : rattachement par nom de commune, 847 lignes non résolues. C'est antérieur et inchangé.
- **Lieux OSM** : 239 693 points écartés à plus de 8 km de tout centre communal, surtout dans les pays voisins couverts par les tuiles. C'est antérieur, inchangé et non examiné ici.
- **Positions relatives** : 17 communes entrent dans les 20 % les moins animées sans que leurs données changent (§5). C'est voulu par un classement national ; la contre-revue peut vouloir le vérifier.

## 12. Régénérer

```bash
npm run index:unpack
node scripts/fut137/construire-successeurs.mjs            # table (COG 2026 épinglé, cache data/cache-logement/cog)
.venv-bpe/bin/python scripts/populate-vie-locale.py --write-index   # caches data/.cache (OSM, RNA épinglé, AMALIA)
npx tsx scripts/populate-mismatch-rank.mts --recalculer vie_locale
node scripts/populate-population-grain.mjs                 # convention affichée
npm run index:pack
node scripts/accueil/donnees-accueil.mjs --ecrire
# Mesure :
node scripts/fut137/mesurer-effets.mjs --avant <index de main .gz> --apres data/comparateur-index.json.gz
# Contrôle de la table seule :
node scripts/fut137/construire-successeurs.mjs --verifier
```

## Sources

- Insee, Code officiel géographique au 01/01/2026 : `v_mvt_commune_2026.csv` (sha256 `8b339fad…f1`) et `v_commune_2026.csv` (sha256 `7be1153d…d3`), https://www.insee.fr/fr/statistiques/fichier/8740222/
- Ministère de l'Intérieur, RNA waldec du 01/06/2026 : `rna_waldec_20260601.zip` (sha256 `f641be11…23`)
- FUT-109 : `docs/audits/2026-10-23-fut109-populations-grain.md` §5.1 et §8.3
