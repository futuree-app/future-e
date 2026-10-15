# FUT-50 · « Connaître les risques naturels » : de l'inventaire à une lecture

15 octobre 2026 · branche `feat/fut-50-accueil-decision` (tête de départ `b0d4169f`, changements récents préservés) · prototype seulement.

**Bibliothèque de production** : `src/lib/georisques.ts` n'est pas modifiée.

## 1. Cause de l'inventaire excessif

- **La source.** GASPAR (Géorisques, `/api/v1/gaspar/risques?code_insee=…`), le recensement des risques par commune tenu par l'État. Le grain est la commune ; pour Paris, Lyon et Marseille, c'est la ville entière (`codeGaspar`).
- **Ce que la source fournit.** Chaque ligne porte un **code hiérarchique** `num_risque` :
  - le **premier chiffre** donne la nature : `1` naturel, `2` technologique, `3` minier ;
  - **deux chiffres** désignent une famille (`11` Inondation) ;
  - **trois chiffres** désignent une déclinaison de cette famille (`112` « Par une crue à débordement lent de cours d'eau »).
- **Ce que le code faisait.** `getGeorisquesSummary` ne garde que `libelle_risque_long` et jette le code. L'accueil recevait donc 23 libellés à plat pour Nantes : familles, déclinaisons, et risques technologiques (industriel, barrage, transport de marchandises dangereuses, engins de guerre) sous le titre « risques naturels ».
- **La règle de nature** a été vérifiée sur Nantes, La Rochelle, Bordeaux, Paris, Lyon, Marseille (`31` / `311` minier), Brest (`22` nucléaire), Briançon, Saint-Denis de La Réunion et une trentaine de communes rurales.
- **Absence de données.** Une commune absente de la base répond « 0 résultat », exactement comme un code inexistant ; deux vraies communes en témoignent, 02813 et 80589. La source ne permet donc pas de distinguer « aucun risque » de « non renseigné ». Une absence de réponse (erreur, délai, réseau) est un troisième cas.
  - L'ancien code confondait les trois en « L'État ne recense aucun risque… » ; seule la panne était traitée à part.

## 2. Règles retenues

**Classement par le code, jamais par le libellé.** C'est la classification de la source, pas une catégorisation de futur•e. Un préfixe inconnu reste affiché dans « Autres risques recensés », sans être deviné.

**Une déclinaison n'est jamais un risque de plus** : elle se range sous sa famille. Une déclinaison arrivée sans sa famille devient sa propre ligne, pour que rien ne se perde.

**Familles naturelles dans les mots du lecteur.** C'est un renommage des familles de la source, même code et même périmètre : 11 inondation, 12 mouvements de terrain, 13 séisme, 14 avalanche, 15 éruption volcanique, 16 feux de forêt, 17 phénomènes météorologiques (« Phénomène lié à l'atmosphère »), 18 radon.
- J'ai écarté les groupes indicatifs du brief (« eau », « sols », « météo », « autres »). Les familles de la source les recouvrent déjà, plus fidèlement.

**Pas de hiérarchie.** Les familles sont citées dans l'ordre des codes. Aucune gravité, aucun score, aucune mise en avant.

**Risques technologiques et miniers** : absents du constat, présentés dans le détail sous leur propre titre, avec une note : « Recensés par la même source, ils ne relèvent pas des risques naturels. »

| Situation | Constat (toujours visible) | Pastille et phrase |
| --- | --- | --- |
| Au moins deux familles naturelles | Plusieurs risques naturels sont recensés dans la commune : … | **À savoir** · Un risque recensé dans la commune ne concerne pas forcément chaque adresse. |
| Une famille naturelle | Un risque naturel est recensé dans la commune : … | (idem) |
| Seulement technologiques ou miniers | Aucun risque naturel n'est recensé dans la commune ; d'autres risques le sont, détaillés ci-dessous. | **À savoir** · Une absence de recensement ne garantit pas l'absence de danger. |
| La base ne renvoie rien | La base nationale des risques ne recense rien pour cette commune. | (idem) ; pas de détail à ouvrir |
| La source ne répond pas | aucun constat | **Donnée indisponible** · La base nationale des risques n'a pas répondu : nous ne pouvons rien en dire, ni dans un sens ni dans l'autre. |

**À vérifier**, dans tous les cas : « À une adresse précise, vérifiez si elle se trouve dans une zone concernée, quelles règles s'y appliquent et ce que l'on sait du terrain et du bâtiment. Être hors zone ne met pas à l'abri de tout risque. »

Le bouton « Examiner une adresse à … » est inchangé.

## 3. Nantes, avant / après

**Avant** (`c11-avant-risques-nantes-*.jpg`, 1 021 px de haut à 1440, 1 206 px à 390) :

> L'État recense pour la commune : inondation, par une crue à débordement lent de cours d'eau, par ruissellement et coulée de boue, par remontées de nappes naturelles, mouvement de terrain, affaissements et effondrements d'origine anthropique (anciennes carrières souterraines, hors mines), affaissements et effondrements d'origine naturelle (cavités souterraines), eboulement ou chutes de pierres et de blocs, glissement de terrain, avancée dunaire, tassements différentiels, séisme, phénomène lié à l'atmosphère, tempête et grains (vent), foudre, grêle, neige et pluies verglaçantes, radon, risque industriel, rupture de barrage, transport de marchandises dangereuses et engins de guerre.
>
> **À savoir** · Ce recensement est actuel et porte sur la commune entière : il ne dit pas quelle partie est concernée, ni comment le risque évoluera.
>
> À vérifier · L'état des risques précise ce qu'il en est à une adresse donnée : zone réglementée, sol, sinistres reconnus.

**Après** (`c11-apres-risques-nantes-*.jpg`, 779 px à 1440, 859 px à 390) :

> Plusieurs risques naturels sont recensés dans la commune : inondation, mouvements de terrain, séisme, phénomènes météorologiques et radon.
>
> ＋ Voir les risques recensés
>
> **À savoir** · Un risque recensé dans la commune ne concerne pas forcément chaque adresse.
>
> À vérifier · À une adresse précise, vérifiez si elle se trouve dans une zone concernée, quelles règles s'y appliquent et ce que l'on sait du terrain et du bâtiment. Être hors zone ne met pas à l'abri de tout risque.

**Détail ouvert** (`c11-apres-risques-nantes-*-detail.jpg`) :
- **Risques naturels** :
  - Inondation : par une crue à débordement lent de cours d'eau ; par ruissellement et coulée de boue ; par remontées de nappes naturelles
  - Mouvements de terrain : six déclinaisons, dont cavités souterraines, éboulement, glissement de terrain et tassements différentiels
  - Séisme
  - Phénomènes météorologiques : tempête et grains (vent) ; foudre ; grêle ; neige et pluies verglaçantes
  - Radon
- **Risques technologiques**, avec leur note : risque industriel ; rupture de barrage ; transport de marchandises dangereuses ; engins de guerre.

Aucune des 23 lignes de la source ne se perd, et aucune n'est comptée deux fois. Un test le vérifie sur Nantes, La Rochelle et Marseille.

## 4. Les autres cas

Réponses réelles de GASPAR, vues à travers la route du prototype :

| Commune | Constat | Détail |
| --- | --- | --- |
| La Rochelle | inondation, mouvements de terrain, séisme et phénomènes météorologiques | inondation : *par submersion marine* ; un technologique |
| Ageville (52001), peu de risques | inondation et phénomènes météorologiques | aucun technologique |
| 60358, technologique seul | Aucun risque naturel n'est recensé… ; d'autres risques le sont | risque industriel |
| Neuilly-le-Dien (80589), base vide | La base nationale des risques ne recense rien pour cette commune. | aucun |
| Marseille, naturel, technologique et minier | inondation, mouvements de terrain, séisme et feux de forêt | trois groupes, dont « Risques miniers » |
| Source muette (test) | aucun constat | « Donnée indisponible » |

Le titre « Connaître les risques naturels » correspond désormais au constat : celui-ci ne nomme que des familles de code 1x. Un test vérifie l'absence de termes technologiques dans le constat de Nantes.

## 5. Vérifications

**Tests** :
- tests FUT-50 : 38/38, dont 5 nouveaux sur les risques, à partir des réponses GASPAR réelles ;
- suite complète : 2 593/2 593 ;
- `tsc` et `eslint` sans erreur ;
- build de production réussi ;
- en production, le prototype et sa route renvoient 404.

**Navigateur (Chromium)** :
- **Clavier** : à 1440, 390 et 360 px (Nantes) et à 1440 et 390 px (La Rochelle), le résumé « Voir les risques recensés » s'atteint par Tab, avec un contour visible. Entrée l'ouvre, Espace le referme.
- **Débordement** : 0 px.

**Hauteur du panneau** :

| | 1440 px | 390 px | 360 px |
| --- | --- | --- | --- |
| Nantes avant | 1 021 | 1 206 | – |
| Nantes replié | 779 | 859 | 937 |
| La Rochelle replié | 779 | 864 | – |

**Non testé** : Safari, Firefox, un vrai lecteur d'écran.

## 6. Limites

- **« Aucun risque » et « non renseigné » restent indiscernables.** La source ne les distingue pas ; le texte dit seulement que la base ne recense rien.
- **La nature des codes est relevée sur les réponses, pas sur une nomenclature officielle.** Je l'ai vérifiée sur une quarantaine de communes. Un code nouveau ou inattendu tombe dans « Autres risques recensés », visible, plutôt que d'être mal classé. La nomenclature GASPAR publiée reste à consulter pour figer la table.
- **Le constat ne dit pas la déclinaison.** À La Rochelle, « inondation » recouvre la seule submersion marine, qui n'apparaît que dans le détail. C'est le prix de la lecture par familles.
- **La route du prototype interroge GASPAR directement**, parce que la bibliothèque de production jette le code.
  - Pour la production, il faudra ajouter le code au résumé de `getGeorisquesSummary`. C'est un ajout sans effet sur ses usages actuels, mais hors de cette passe.
- **Géorisques ne répond qu'aux adresses IP françaises.** C'est un piège connu, déjà résolu en production.
