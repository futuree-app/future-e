# FUT-33, phase 2B.2 A : trois refus de la mer, trois représentations

Date : 02/10/2026. Base : `853dc3d9` (2B.1, en production). Rien du dossier n'est migré (étape C).

## Le problème

Depuis la 2B.1, `excludeSea` veut dire « commune non classée Mer ». Le parseur y rangeait aussi « loin de la mer »
et « à au moins 30 km de la mer » : Caen (9 km du rivage), Montpellier ou Rochefort passaient alors pour « loin de
la mer ». La donnée était juste, le sens faux.

## Modèle cible

| Intention | Représentation | Recherche « Où vivre » | Besoin d'une définition |
|---|---|---|---|
| « pas une commune littorale », « hors littoral » | `excludeSea: true` | filtre : `loi_effective` sans Mer | non (convention dite à l'écran) |
| « à au moins N km de la mer » | `farFromSea: { active: true, minKm: N }` | filtre : `mer_centre_km >= N` | non (le nombre du lecteur) |
| « loin de la mer », « dans les terres » | `farFromSea: { active: true, minKm: null }` | aucun filtre ; le lecteur est prévenu | oui : une distance à préciser |

`farFromSea` est l'objet symétrique de `nearSea` (`{ active, maxKm }`). Les deux refus peuvent coexister (« pas sur
le littoral, et au moins 20 km de la mer »).

« Loin de la mer » sans nombre ne devient ni un filtre, ni une préférence inverse : une préférence inverse aurait
besoin d'une courbe, qui est justement la question de l'étude B. Quand la courbe sera validée, une préférence
« éloignement de la mer » pourra s'appuyer sur elle (décision à prendre alors). En attendant, la recherche affiche :
« Une condition que vous avez posée n'a pas pu être appliquée à ces résultats : l'éloignement de la mer, faute de
distance précisée en kilomètres. »

Garde-fou déterministe (`parse-assainir.ts`) : un `minKm` n'est conservé que si le texte contient un nombre suivi
de « km » ou « kilomètres ». Un nombre inventé par le modèle tombe ; l'intention reste.

## Phrases réelles (vrai prompt, même modèle et mêmes réglages que la production)

`node scripts/mer/sonder-parseur.mts <.env>` ; sortie figée : `scripts/mer/fixtures/sonde-parseur-2b2a.json`.

| Phrase | Représentation | Filtre immédiat | Définition à préciser |
|---|---|---|---|
| Je ne veux pas vivre sur le littoral, une petite ville calme. | excludeSea | oui (loi) | non |
| Hors littoral, avec une gare. | excludeSea | oui (loi) | non |
| Pas une commune littorale s'il vous plaît. | excludeSea | oui (loi) | non |
| Je veux être à au moins 30 km de la mer. | farFromSea 30 | oui (≥ 30 km) | non |
| Pas à moins de 20 km de la côte, une ville moyenne. | farFromSea 20 | oui (≥ 20 km) | non |
| On veut vivre loin de la mer. | farFromSea sans nombre | non | oui |
| Plutôt dans les terres, au calme. | farFromSea sans nombre | non | oui |
| Je ne veux pas être près de la mer. | farFromSea sans nombre | non | oui |
| Une ville comme Brest mais loin de la mer. | farFromSea sans nombre ; ancre Brest | non ; la suggestion littorale de Brest est retirée | oui |
| Pas sur le littoral, et au moins 20 km de la mer. | excludeSea + farFromSea 20 | oui (les deux) | non |
| Surtout pas au bord de la mer. | excludeSea | oui (loi) | non (cas discutable, voir risques) |
| Je n'aime pas la mer, je préfère la campagne. | rien | non | non |
| Pas forcément près de la mer, mais pas trop chaud. | rien | non | non |
| Je veux être proche de la mer. | préférence proximite_mer, poids 3 | non (classement) | non |
| Il nous faut absolument la mer, à moins de 10 km. | nearSea 10 | oui (≤ 10 km) | non |

## Impact sur la recherche

- « Loin de la mer » ne filtre plus sur la loi Littoral : Caen, Montpellier, Rochefort ne sont plus présentées comme
  répondant à une demande d'éloignement.
- « À au moins N km » applique N au centre de la commune.
- L'ancre littorale (« comme Brest ») est retirée dès qu'un refus de la mer est exprimé (`perimeterAllowsCoast`,
  `hasCoastalIntent`).
- Le périmètre appliqué dit désormais la mesure : « centre de la commune à N km au plus / au moins du rivage
  marin », « hors communes littorales (classement loi Littoral) ».

## Impact sur Projet / dossier (non migré)

- `farFromSea` est une 12e clé de contrainte : registre d'évaluateurs, règles du dossier, libellés, valeur de
  critère (`{ minKm }`), déclaration. Elle est déclarée seulement si le parseur l'a écrite : aucun projet
  existant ne la porte, aucune empreinte existante ne change.
- Au dossier, `farFromSea` s'évalue pour l'instant sur l'ancienne distance (comme `nearSea`) ; l'étape C migre les
  trois ensemble.
- Capacité : `farFromSea` = « apprécier » (point de référence, ou sans seuil), comme `nearSea`. Aucune capacité
  existante ne change (testé aux deux grains).

## Migrations

Aucune migration de données. Limite connue : un projet enregistré AVANT ce changement avec `excludeSea: true` peut
venir d'une phrase « loin de la mer ». On ne peut pas le savoir sans reparser le texte d'origine. Option pour
l'étape C : reparser les projets persistés portant `excludeSea` (peu nombreux, cf. usage réel de septembre),
ou demander au lecteur au prochain passage.

## Risques et points ouverts

- « Surtout pas au bord de la mer » est rangé en commune littorale : défendable (une commune classée Mer est au
  bord de la mer au sens courant), mais c'est une lecture. À trancher si le cas revient.
- `nearSea` sans nombre garde son rayon d'exploration de 30 km (`LEGACY_NEAR_SEA_KM`), bonus de classement dit
  à l'écran, jamais un filtre. À revoir avec la courbe B.
- `@/lib/littoral` (érosion du trait de côte) porte une façade PAR DÉPARTEMENT : consommateur éditorial / risque, à
  traiter en D.
