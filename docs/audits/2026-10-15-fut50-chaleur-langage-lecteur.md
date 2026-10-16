# FUT-50 · La lecture de chaleur dans la langue du lecteur

15 octobre 2026 (soir) · branche `feat/fut-50-accueil-decision` · prototype seulement.

**Ce qui n'a pas bougé** : les valeurs DRIAS, les seuils, `classifyClimateComfort`, les règles, les autres priorités, les parcours, le hero, l'animation et les dossiers payants.

**Ce qui change** : seulement la formulation et la présentation de la lecture « Éviter les fortes chaleurs ».

## Le principe appliqué

La lecture se fait à deux niveaux :
- **Le niveau 1, visible**, comprend un titre éditorial qui porte le message, une ou deux phrases sur ce qui change, puis la conséquence pour la priorité choisie. On n'y trouve aucun mot du moteur (seuil, signalement, indicateur, convention, favorable), ce qu'un test vérifie.
- **Le niveau 2, « Comment lire ce résultat ? »**, est un `<details>` natif, sans dépendance. On l'ouvre et on le ferme avec Entrée ou Espace, et les lecteurs d'écran l'annoncent comme replié ou déplié. Il explique les mesures, l'horizon, la référence, les repères de futur•e (qui ne sont pas sanitaires), puis ce qu'il en est ici.

L'étiquette (« Plutôt défavorable », « Sous les seuils… ») n'est plus affichée pour la chaleur. Le classement reste dans la donnée (`signal`, attribut `data-classement`), dans les tests et dans l'explication.

## La grammaire : ce qui fonde chaque mot

Je n'ai ajouté **aucun nouveau seuil**. Chaque formulation se déduit des éléments déjà disponibles :

| Ce que dit le texte | D'où il vient |
| --- | --- |
| « correspond mal à votre souhait » | `classifyClimateComfort` → `unfavorable` (au moins un axe ≥ seuil, valeur non arrondie) |
| les axes nommés quand la commune est défavorable | ceux qui atteignent leur seuil, et seulement eux, puisque ce sont eux qui fondent le classement |
| « environ cinq fois plus fréquentes qu'en 1976-2005 » | la valeur projetée divisée par la référence, arrondie : de l'arithmétique sur les chiffres affichés |
| « presque absentes sur 1976-2005, reviendraient plusieurs fois par an en moyenne » | une référence inférieure à 1, qui est le palier existant de l'accueil (`formatCompte`), et une valeur projetée arrondie d'au moins 2 |
| l'axe mis en avant dans le titre | celui qui est le plus proche de **son** seuil (valeur projetée / seuil) |
| « resteraient exceptionnelles » | les deux mesures sous 1 par an (même palier) |
| dans la méthode, « 7,1 pour un repère de 8 » | la valeur exacte, sans qualificatif |

**Ce que je n'ai pas repris de tes exemples, faute de convention pour le fonder :**
- « relativement peu nombreuses », « augmenteraient fortement » et « difficiles à supporter ». Pour les écrire honnêtement, il faudrait d'abord fixer des paliers d'intensité. Je te les présente comme une décision possible, pas codée (cf. « les seuils se discutent »).
- « Des étés de plus en plus difficiles à supporter », pour Nîmes. Je l'ai remplacé par un titre descriptif : « Des étés plus chauds, de jour comme de nuit ».

## Le panel : données, classement, texte visible, méthode

Les valeurs sont celles de `public/data_climat.json`, non arrondies, à l'horizon 2050 (+2,7 °C en France). Les deux chiffres restent affichés en grand au-dessus du texte, comme avant.

| Commune | Jours > 35 °C (réf.) | Nuits tropicales (réf.) | Classement du moteur | Titre visible |
| --- | --- | --- | --- | --- |
| La Rochelle | 2,8 (0,3) | 23,4 (5,1) | sous les seuils | Des nuits chaudes plus fréquentes |
| Nantes | 4,1 (0,5) | 11,1 (2,0) | sous les seuils | Des journées très chaudes plus fréquentes |
| Pau | 7,1 (1,3) | 19,2 (4,2) | sous les seuils | Des journées très chaudes plus fréquentes |
| Bordeaux | 6,3 (1,5) | 28,1 (7,4) | défavorable (nuits) | Des nuits chaudes plus fréquentes |
| Nîmes | 14,4 (2,6) | 69,1 (33,0) | défavorable (les deux) | Des étés plus chauds, de jour comme de nuit |
| La Condamine-Châtelard | 0 (0) | 0 (0) | sous les seuils | Des fortes chaleurs qui resteraient exceptionnelles |
| Code inexistant | absente | absente | absent | Pas de projection de chaleur pour cette commune |
| Une mesure manquante | – | absente | incertain | Des projections de chaleur incomplètes |

**Textes visibles, sous le titre :**

| Commune | Texte |
| --- | --- |
| La Rochelle | Les nuits tropicales seraient environ cinq fois plus fréquentes qu'en 1976-2005. Cela ne signifie pas que les étés resteront frais. |
| Nantes | Les journées au-dessus de 35 °C, presque absentes sur 1976-2005, reviendraient plusieurs fois par an en moyenne. Cela ne signifie pas que les étés resteront frais. |
| Pau | Les journées au-dessus de 35 °C seraient environ cinq fois plus fréquentes qu'en 1976-2005. Cela ne signifie pas que les étés resteront frais. |
| Bordeaux | Les nuits tropicales seraient environ quatre fois plus fréquentes qu'en 1976-2005. Cette évolution correspond mal à votre souhait d'éviter les fortes chaleurs. |
| Nîmes | Les nuits tropicales seraient environ deux fois plus fréquentes qu'en 1976-2005, et les journées au-dessus de 35 °C environ six fois plus. Cette évolution correspond mal à votre souhait d'éviter les fortes chaleurs. |
| La Condamine-Châtelard | Moins d'une journée au-dessus de 35 °C et moins d'une nuit tropicale par an, même à l'horizon 2050. Cela ne dit rien des épisodes de chaleur plus modérés. |
| Code inexistant | Sans ces données, nous ne pouvons rien dire de ses étés futurs : une absence de donnée n'est pas une bonne nouvelle. |
| Mesure manquante | Une des deux mesures manque pour cette commune : nous ne tirons aucune conclusion de celle qui reste. |

**« Comment lire ce résultat ? »** Deux paragraphes, dont seule la fin change d'une commune à l'autre.

Le premier paragraphe est identique pour toutes les communes :

> Deux mesures du climat de la commune : les journées où il fait plus de 35 °C, et les nuits tropicales, où la température ne descend pas sous 20 °C. Elles sont projetées pour 2050, quand la France se serait réchauffée d'environ 2,7 °C, et comparées à la période 1976-2005, qui n'est pas la situation actuelle.

Le second commence toujours ainsi :

> futur•e signale une exposition à partir de 8 journées au-dessus de 35 °C, ou de 25 nuits tropicales par an en 2050. Ce sont des repères propres à futur•e, pas des seuils sanitaires officiels.

Puis il se termine selon la commune :

| Commune | Fin du second paragraphe |
| --- | --- |
| La Rochelle | Ici, aucun des deux repères n'est atteint ; la mesure qui s'en approche le plus est celle des nuits tropicales (23,4 pour un repère de 25). Une commune peut se réchauffer beaucoup sans atteindre ces repères. |
| Nantes | même phrase, avec « journées au-dessus de 35 °C (4,1 pour un repère de 8) » |
| Pau | même phrase, avec « journées au-dessus de 35 °C (7,1 pour un repère de 8) » |
| Bordeaux | Ici, seul le repère des nuits tropicales est atteint. |
| Nîmes | Ici, les deux repères sont atteints. |
| La Condamine-Châtelard | Ici, aucun des deux repères n'est atteint. |

Ce qui dépend du quartier et du logement reste dans « À vérifier », qui n'a pas changé. Je ne le répète pas dans la méthode.

**Cohérence avec les chiffres et le classement**, contrôlée par les tests :
- aucune conclusion défavorable sous les seuils ;
- aucune omission d'un axe qui fonde un classement défavorable ;
- aucun « chaque été » à partir d'une moyenne ;
- aucun qualificatif d'intensité (fortement, nettement, peu nombreux, difficile, bien plus).

## Avant / après

| | Avant (`c4-chaleur-*.jpg`) | Après (`c5-chaleur-*.jpg`, `*-methode.jpg`) |
| --- | --- | --- |
| La Rochelle | **Sous les seuils de signalement** · « Les deux indicateurs restent sous les seuils de signalement de futur•e (8 jours…, ou 25 nuits…), mais les nuits tropicales en sont proches (23 pour un seuil de 25). Ces seuils sont des conventions de lecture, pas des seuils sanitaires… » | **Des nuits chaudes plus fréquentes** · « Les nuits tropicales seraient environ cinq fois plus fréquentes qu'en 1976-2005. Cela ne signifie pas que les étés resteront frais. » · méthode repliée |
| Nîmes | **Plutôt défavorable** · « Des étés plus difficiles à concilier avec cette priorité : les jours au-dessus de 35 °C et les nuits tropicales atteignent le seuil de signalement de futur•e (8…, ou 25…). » | **Des étés plus chauds, de jour comme de nuit** · « Les nuits tropicales seraient environ deux fois plus fréquentes qu'en 1976-2005, et les journées au-dessus de 35 °C environ six fois plus. Cette évolution correspond mal à votre souhait d'éviter les fortes chaleurs. » |

## Vérifications

**Tests** :
- 31/31 pour FUT-50, dont 7 nouveaux cas de chaleur sur les valeurs réelles ;
- suite complète : 2 586/2 586 ;
- `tsc` et `eslint` sans erreur ;
- le build de production n'a pas été relancé dans cette passe (dernier vert : `85cb950a`).

**Navigateur (Chromium)** :
- trois états du hero inchangés à 1440, 390 et 360 px, sans débordement, CLS 0,000 ;
- titre de la lecture visible sous l'en-tête sur mobile ;
- explication atteinte par Tab, ouverte par Entrée, fermée par Espace, avec un contour de focus visible ;
- sous mouvement réduit, mêmes gestes et aucune animation.

**Non testé** : Safari, Firefox, un vrai lecteur d'écran, de vrais téléphones.

## Pour le test avec de vrais lecteurs

- Après La Rochelle puis Nîmes, la personne sait-elle dire laquelle aura les étés les plus chauds, et pourquoi ?
- « Des nuits chaudes plus fréquentes » est-il lu comme une alerte ou comme une simple information ?
- Ouvre-t-on « Comment lire ce résultat ? », et ce qu'on y lit change-t-il la compréhension ?
