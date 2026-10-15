# FUT-50 · Une chaleur plus concrète, et « Et au-dessus de 30 °C ? »

15 octobre 2026 · branche `feat/fut-50-accueil-decision` · prototype seulement.

**Inchangés** : valeurs DRIAS, seuils, `classifyClimateComfort`, règles, autres priorités, parcours, hero, animation, dossiers payants.

**Pas de sélecteur d'horizon** : l'aperçu gratuit reste sur 2050.

## 1. Les vraies valeurs

**Source** : `public/data_climat.json`.
- **Horizon** : palier TRACC `gwl20`, soit 2050 et +2,7 °C en France.
- **Indicateurs** : `NORTX35D_yr` / `ATX35D_yr` (colonnes 08 / 23), `NORTX30D_yr` / `ATX30D_yr` (09 / 24), `NORTR_yr` / `ATR_yr` (10 / 25).
- **Référence 1976-2005** : reconstruite par `reconstructReference`, la fonction du moteur, qui prend la **médiane** des trois paliers (valeur moins anomalie à gwl15, gwl20 et gwl30). C'est la même règle pour 35 °C, 30 °C et les nuits.
  - Exemple à La Rochelle, 30 °C : médiane(6,3 ; 6,7 ; 6,0) = 6,3.

| Commune | > 35 °C en 2050 (réf.) | > 30 °C en 2050 (réf.) | Nuits tropicales en 2050 (réf.) | Classement du moteur |
| --- | --- | --- | --- | --- |
| La Rochelle | 2,8 (0,3) | **18 (6,3)** | 23,4 (5,1) | sous les seuils |
| Nîmes | 14,4 (2,6) | **67,9 (36,2)** | 69,1 (33,0) | défavorable |
| Nantes | 4,1 (0,5) | 21,8 (7,7) | 11,1 (2,0) | sous les seuils |
| Bordeaux | 6,3 (1,5) | 35,1 (15,9) | 28,1 (7,4) | défavorable (nuits) |
| Pau | 7,1 (1,3) | 31,0 (13,1) | 19,2 (4,2) | sous les seuils |
| La Condamine-Châtelard | 0 (0) | 0 (0) | 0 (0) | sous les seuils |

**Couverture** : les 35 006 communes ont une valeur et une anomalie à 30 °C. Les cas « 30 °C indisponible » et « référence non reconstructible » n'existent donc dans aucune commune réelle ; je les ai vérifiés par des tests sur des valeurs construites.

## 2. La narration retenue, et pourquoi

**Le principe** : la phrase dit ce que les deux chiffres affichés ne disent pas d'eux-mêmes, **combien la commune gagnerait** de nuits tropicales et de journées au-dessus de 35 °C par an. C'est l'écart, arrondi, entre la valeur 2050 et la référence. Les multiplicateurs disparaissent, et les chiffres de la légende ne sont plus paraphrasés.

| Mot ou tournure | Ce qui le fonde |
| --- | --- |
| « environ 18 nuits tropicales … de plus par an qu'en 1976-2005 » | écart entre les deux chiffres affichés, arrondi |
| « en moyenne », « par an » | ce sont des moyennes annuelles : ni durée continue, ni année précise, ni saison |
| « y étaient presque absentes sur cette période » | référence sous 1 par an, palier « moins d'un » déjà utilisé sur l'accueil |
| « y étaient déjà nombreuses » | référence qui atteignait déjà le seuil du moteur sur 1976-2005 (Nîmes : 33 nuits pour un seuil de 25) |
| « resteraient à peu près au même niveau » | écart sous 1 par an (même palier) |
| « correspond mal à votre souhait » | classement défavorable du moteur ; on ne raconte que les axes qui le fondent |
| titre de la lecture | l'axe qui gagne le plus |

La formule « Cela ne signifie pas que les étés resteront frais » n'est plus systématique. La nuance reste dans « Comment lire ce résultat ? » : « Une commune peut se réchauffer beaucoup sans atteindre ces repères. »

### Avant / après (texte sous le titre)

| Commune | Avant (`2a5bc436`) | Après |
| --- | --- | --- |
| La Rochelle | Les nuits tropicales seraient environ cinq fois plus fréquentes qu'en 1976-2005. Cela ne signifie pas que les étés resteront frais. | À l'horizon 2050, la commune compterait en moyenne environ 18 nuits tropicales et 3 journées au-dessus de 35 °C de plus par an qu'en 1976-2005. Les journées au-dessus de 35 °C y étaient presque absentes sur cette période. |
| Nîmes | Les nuits tropicales seraient environ deux fois plus fréquentes qu'en 1976-2005, et les journées au-dessus de 35 °C environ six fois plus. Cette évolution correspond mal à votre souhait d'éviter les fortes chaleurs. | À l'horizon 2050, la commune compterait en moyenne environ 36 nuits tropicales et 12 journées au-dessus de 35 °C de plus par an qu'en 1976-2005. Les nuits tropicales y étaient déjà nombreuses. Cette évolution correspond mal à votre souhait d'éviter les fortes chaleurs. |
| Nantes | Les journées au-dessus de 35 °C, presque absentes sur 1976-2005, reviendraient plusieurs fois par an en moyenne. Cela ne signifie pas que les étés resteront frais. | … environ 9 nuits tropicales et 4 journées au-dessus de 35 °C de plus par an qu'en 1976-2005. Les journées au-dessus de 35 °C y étaient presque absentes sur cette période. |
| Bordeaux | Les nuits tropicales seraient environ quatre fois plus fréquentes qu'en 1976-2005. Cette évolution correspond mal… | … environ 21 nuits tropicales de plus par an qu'en 1976-2005. Cette évolution correspond mal… |
| Pau | Les journées au-dessus de 35 °C seraient environ cinq fois plus fréquentes qu'en 1976-2005. Cela ne signifie pas… | … environ 15 nuits tropicales et 6 journées au-dessus de 35 °C de plus par an qu'en 1976-2005. |
| La Condamine-Châtelard | … Cela ne dit rien des épisodes de chaleur plus modérés. | … Les journées au-dessus de 30 °C y resteraient elles aussi sous une par an. (La donnée à 30 °C répond à la question au lieu de la laisser ouverte.) |

**Titres** : ceux de Nantes et de Pau passent de « Des journées très chaudes plus fréquentes » à **« Des nuits chaudes plus fréquentes »**. Le titre suit désormais l'axe qui gagne le plus (Nantes : +9 nuits contre +4 jours), et non plus l'axe le plus proche de son seuil. Le titre et la phrase racontent ainsi la même chose. La proximité du seuil de Pau (7,1 pour 8) reste dans la méthode.

**Repris de tes exemples** : les valeurs concrètes, l'évolution, le contraste jour/nuit.

**Pas repris** : « près de 69 nuits » répète la légende, et « ne pas redescendre sous 20 °C pendant … nuits » pourrait se lire comme une durée continue.

## 3. L'interaction « Et au-dessus de 30 °C ? »

- **Le contrôle** : un lien-bouton discret sous la première mesure (souligné en pointillé, plein au survol, contour orange au focus clavier). Il devient « Revenir à 35 °C ».
- **Ce qui change** : seulement la valeur, l'unité et la légende de la première mesure.
  - À 30 °C, la légende dit l'inclusion et garde la référence : « au-dessus de 30 °C à l'horizon 2050, dont 3 au-dessus de 35 °C ; contre 6 jours sur 1976-2005 ».
- **Ce qui ne change jamais** : le chiffre des nuits, le titre, le texte, le classement, la méthode, l'horizon. Un test le vérifie sur les cinq communes.
- **Mouvement** : les deux vues occupent la même cellule de grille, sans aucun changement de hauteur. Le passage est un fondu `--m-bascule` de 180 ms, sans mouvement latéral, et il devient instantané en mouvement réduit.
- **Contrepartie assumée** : en vue 35 °C, un blanc d'une ligne environ reste réservé pour la légende à 30 °C, plus longue.
- **Données** : la valeur à 30 °C arrive avec la lecture (même chargement DRIAS). Le basculement ne fait aucune requête vers futur•e. Les seules requêtes observées partent vers `clarity.ms`, la mesure d'audience déjà présente sur le site.
- **État** : la vue est locale au contenu de la lecture, qui est remonté à chaque changement de commune ou de priorité. Elle revient donc toujours à 35 °C.
- **Lecteurs d'écran** : les chiffres visibles sont masqués. Une phrase complète, celle de la vue affichée, est lue, et la zone vivante du panneau l'annonce au basculement.
- **Données manquantes** :
  - sans valeur à 30 °C, aucun contrôle n'apparaît et la lecture à 35 °C reste entière ;
  - sans référence à 30 °C, la légende dit « sans comparaison possible avec 1976-2005 ».
- **Méthode** : un paragraphe s'ajoute quand la donnée existe : « Les journées au-dessus de 30 °C … comprennent celles au-dessus de 35 °C, et n'entrent pas dans ce résultat. »

## 4. Captures

Les captures sont dans `docs/audits/fut50-accueil/images/`.

| Commune | 35 °C | 30 °C |
| --- | --- | --- |
| La Rochelle | `c6-chaleur-la-rochelle-{1440,390,360}-35.jpg` | `c6-chaleur-la-rochelle-{1440,390,360}-30.jpg` |
| Nîmes | `c6-chaleur-nimes-{1440,390,360}-35.jpg` | `c6-chaleur-nimes-{1440,390,360}-30.jpg` |

- **Méthode ouverte** : `c6-chaleur-{la-rochelle,nimes}-1440-methode.jpg`.
- **Avant** : `c5-chaleur-*.jpg`.

## 5. Vérifications

**Tests** :
- tests FUT-50 : 34/34, sur les valeurs réelles, les branches, les données manquantes et la non-influence des 30 °C ;
- suite complète : 2 589/2 589 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi (290 pages) ;
- en production, `/dev/fut50/c` et la route de lecture renvoient 404.

**Navigateur (Chromium)**, à 1440, 390 et 360 px, pour La Rochelle et Nîmes :

| Point | Résultat |
| --- | --- |
| Valeurs et légendes | conformes à la table, dans les deux sens |
| Hauteur du panneau | identique au pixel près |
| Mesure des nuits | position et texte identiques |
| Débordement | 0 px |
| Focus | reste sur le contrôle |
| Retour par Entrée | fonctionne |

**Navigateur, autres points** :
- **Clavier** : contrôle atteint par Tab, ouvert par Entrée, refermé par Espace, contour visible.
- **Mouvement réduit** : transition à 0 s.
- **Changements** : après un changement de priorité, puis de commune, la vue est revenue à 35 °C.
- **Hero** : trois états inchangés, CLS 0,000.

**Non testé** : Safari, Firefox, un vrai lecteur d'écran, de vrais téléphones.

**Limite** : le texte cite des gains arrondis (« environ 18 »). Ils se déduisent des chiffres affichés, mais à l'unité près, la soustraction des deux nombres arrondis peut différer d'un (exemple : 23 − 5 = 18, correct ici ; un autre cas pourrait donner 17 contre « environ 18 »). Le mot « environ » couvre cet écart. Si tu préfères, on peut calculer le gain sur les valeurs arrondies affichées.
