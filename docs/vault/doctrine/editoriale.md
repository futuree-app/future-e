# Voix et honnêteté éditoriale

> Règle durable. Sources : `Documentation Notion/.../03 1 — Voix et positionnement
> éditorial`, et fiches `/memory/feedback_no_em_dash.md`,
> `/memory/feedback_signature_identitaire.md`, `/memory/feedback_callendar.md`. Découle des
> invariants n°3, 4 et 7 (`principes/invariants.md`).

## Ce que futur·e dit, ce qu'elle ne dit pas

futur·e dit : voici ce que les données publiques montrent pour votre vie dans votre commune,
à l'horizon que vous choisissez. futur·e ne dit pas : voici ce que vous devriez faire pour
sauver la planète. La différence est absolue, elle structure chaque phrase.

## Les trois piliers du ton

- **Lucidité, pas panique.** On dit ce que les données disent, sans minimiser ni amplifier.
  Quand c'est préoccupant, on le dit sobrement. Quand c'est rassurant, on le dit aussi.
- **Données, pas opinions.** Chaque affirmation significative est sourcée. On distingue ce
  qui est mesuré, projeté, modélisé, interprété, et on ne confond pas les quatre.
- **Respect de l'intelligence du lecteur.** On ne simplifie pas à l'excès, on ne cache pas
  l'incertitude pour faire propre. « Les projections indiquent », pas « il fera ». « À
  l'échelle de la commune, car les données IRIS ne sont pas disponibles », plutôt que de
  feindre une précision qu'on n'a pas (voir `doctrine/data.md`).

## Ce que futur·e ne fait pas

- **Ne prescrit pas de gestes individuels** comme solutions climatiques. Un geste améliore
  la résilience personnelle, il ne remplace pas le changement systémique. On ne confond pas
  les deux.
- **Ne culpabilise pas. Jamais.** Ni explicitement, ni par le choix des mots.
- **Ne fabrique pas d'optimisme.** Si aucun signal positif n'existe dans les données pour un
  module, on n'en invente pas. Le silence est plus honnête que l'optimisme manufacturé.
- **Ne fait pas de politique partisane.** On peut mentionner les engagements publics d'élus
  locaux et les outils de suivi citoyen. On ne nomme jamais un parti, on ne prescrit jamais
  un vote.

## Règles typographiques et stylistiques

- **Vouvoiement** toujours, sans exception.
- **Tirets cadratins (—) interdits** dans tous les outputs produit : c'est le marqueur le
  plus reconnaissable des textes générés par IA. Les remplacer par des virgules, parenthèses,
  deux points ou points. *Exception unique* : un modèle ou prompt figé fourni par le porteur
  qu'il demande de ne pas modifier (ex. blocs STYLE/NEGATIVE des prompts d'illustration). Le
  « — » comme marqueur « pas de donnée » dans une valeur d'UI reste une convention distincte
  et acceptable (voir `doctrine/interface.md`).
- **Points d'exclamation interdits** dans tous les outputs produit.
- **Formules interdites** : « il ne tient qu'à vous » (rejette le systémique sur l'individu),
  « à l'heure où », « à l'ère de », « dans un monde où » (ouvertures creuses), « en résumé »,
  « pour conclure », « en somme », « globalement » dans les synthèses.
- **« Bilan Carbone » interdit** (méthodologie déposée) : toujours « empreinte carbone ».

## Glossaire des termes à traduire

| Terme technique | Formulation futur·e |
| --- | --- |
| IFT | indice d'utilisation des pesticides |
| RCP 2.6 / 4.5 / 8.5 | scénario optimiste / médian / pessimiste |
| PPRi | plan de prévention du risque inondation |
| DPE | diagnostic énergétique du logement (puis DPE) |
| RMQS | réseau national de mesure des sols |
| maladies vectorielles | maladies transmises par moustiques et tiques |
| retrait-gonflement des argiles | mouvements des sols argileux qui peuvent fissurer les maisons |
| stress hydrique | manque d'eau |
| anthropique | d'origine humaine |
| GES | gaz à effet de serre (toujours développé) |
| Bilan Carbone | interdit, utiliser « empreinte carbone » |
| résilience | acceptable seulement si clairement expliqué |
| impact | préférer « effet », « conséquence », « ce que ça change » |

## Signature territoriale : distinctive ET identitaire

Tout élément affiché pour décrire un lieu doit être **distinctif ET identitaire** : une
chose par laquelle un humain décrit spontanément le territoire (« Aux portes des Alpes »,
« Côte méditerranéenne », « Bassin de Grenoble »). Pas une donnée vraie mais **inerte**
(« Altitude 286 m », « altitude modérée ») : personne ne choisit une commune pour son
altitude, l'afficher est une fuite de donnée.

Corollaires : une signature peut être courte, on ne remplit jamais pour remplir. L'altitude
n'est identitaire qu'en haute altitude (la montagne EST le lieu, ex. Aurillac, Le Puy ≥
600 m), jamais dans la bande 200 à 600 m. Principe transverse : **ne jamais déguiser une
position relative en caractéristique absolue** (invariant n°6). Implémenté dans
`buildSignature` (`src/lib/comparateur-vie.ts`), commit 4c56923.

## Ne pas citer Callendar comme source

Ne pas citer « Callendar » dans les contenus affichés (cartes signaux, attributions,
méthodologie front) : c'est un concurrent commercial, pas une source publique française. Ne
citer que les sources publiques réelles : IGN (RGE Alti), Géorisques, BRGM, ADEME, INSEE,
DRIAS / Météo-France, Prométhée / DREAL, GisSol / RMQS, Agences de l'eau. Le code peut
comparer d'autres données en interne, les attributions visibles ne les nomment jamais.

## Liens

`doctrine/interface.md`, `doctrine/data.md`, `doctrine/positionnement.md`,
`vision/positionnement.md`, `principes/invariants.md`.
