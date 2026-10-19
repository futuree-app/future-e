# Editorial Writer · FUT-20 · titres et gestes de la carte chaleur × logement (2026-10-19)

Source relue : `src/lib/decision/chaleur-logement.ts` (titreDe l. 142-146, actionDe l. 117-140), en contexte : `materiality-rules.ts` (règles chaleur déclarée et ambiante), `fact-compositions.ts` (titres voisins : « Des hivers doux, avec une exposition estivale à arbitrer », « Un sol argileux et la règle qui l'encadre »), `docs/vault/doctrine/editoriale.md` (label qui ne promet pas plus que le calcul, « les projections indiquent » et non « il fera », pas de tiret cadratin). Longueurs comptées en `String.length` JS.

## 1. Titres

Diagnostic commun : « Des étés très chauds » pose un fait certain sur la saison entière (indicatif implicite, sans marqueur de projection), alors que le moteur classe un NIVEAU projeté à l'horizon 2050. Deux écarts : (a) le statut modélisé disparaît (invariant n°5) ; (b) une commune peut franchir le seuil par les seules nuits tropicales (≥ 25 ou ≥ 39), avec peu de jours > 35 °C : « étés très chauds » nomme alors une grandeur que le calcul n'a pas retenue (test du label, editoriale.md). Le produit a déjà le bon mot, et il le dit partout ailleurs : « fortes chaleurs projetées » (statements l. 91-102, resumeDe l. 150-155, `topic: "les fortes chaleurs"`). Il couvre jours et nuits, dit « projeté », ne dit pas « plus ». Le titre doit reprendre ce terme.

Côté logement, « un logement au confort d'été insuffisant » attribue l'indicateur au logement comme une propriété mesurée. « Classé » rétablit ce qu'est l'indicateur : une classification réglementaire.

- **A insuffisant** : `De fortes chaleurs projetées, et un confort d'été classé insuffisant` (68)
  Ce titre dit la relation commune × logement en deux faits de statut explicite (projeté, classé), sans rien prédire de l'intérieur.
- **A bon / moyen**, deux options (à arbitrer) :
  - Option 1, parallèle : `De fortes chaleurs projetées, et un confort d'été classé moyen` (62) / `… classé bon` (60). Le lecteur apprend le fait dès le titre. Le risque : « classé bon » sous « Ce qui correspond moins bien » peut se lire comme « problème réglé ». Le statement (« ne change rien à l'exposition de la commune ») corrige, mais seulement si le lecteur va le lire.
  - Option 2, neutre : `De fortes chaleurs projetées, et ce qu'en dit le diagnostic du logement` (71, juste au-dessus de 70). Le « en » relie le diagnostic à la chaleur, pas au logement en général. Variante à 70 tout juste : `De fortes chaleurs projetées, et ce qu'en dit le diagnostic` (59), si « du logement » est porté par le libellé « À cette adresse ».
  Ma préférence : option 1 pour moyen, option 2 pour bon. Je pose l'arbitrage, je ne le tranche pas.
- **B1 et C** : `De fortes chaleurs projetées, et un confort d'été encore à vérifier` (67)
  Ce titre remplace « ce que l'on ne sait pas encore », qui parle de notre ignorance, par ce que le lecteur a à faire. L'objet est précis (le confort d'été, pas « le logement », qui sonnerait comme un soupçon sur le bien). Variante plus sèche : `De fortes chaleurs projetées, et un confort d'été à vérifier` (60).

« De » et non « Des » : devant un adjectif antéposé au pluriel, l'usage soigné écrit « de fortes chaleurs ». Pas de « ici » dans le titre : le constat est au grain commune, et « ici » pourrait se lire « à cette adresse ».

## 2. Gestes : principe

Les remarques 1 et 2 révèlent un problème de construction, pas seulement de mots : le code coordonne des ATTRIBUTS sous un seul sujet (« si le logement est X et Y »). Ça marche pour traversant / protégé du soleil, pas pour l'aération (qui porte sur un usage, les chambres, la nuit) ni pour la toiture (une position). Il vaut mieux coordonner des QUESTIONS, chacune avec son sujet :

| clé | fragment de question (indirecte) |
|---|---|
| protection | `si les fenêtres ont des volets ou des stores` (ou plus abstrait : `si le logement est protégé du soleil`) |
| traversant | `si le logement est traversant` |
| aération | `si l'on peut aérer les chambres la nuit` |
| toiture (hors A) | `si le logement est sous les toits` |

Règle de libellé : **une seule question dans le libellé, pour les trois verbes.** Le libellé B1/C actuel fait déjà 71 caractères avec « Demandez au bailleur » : le code retombe sur une seule question pour le locataire seulement, et le même dossier poserait donc des gestes de forme différente selon la posture. Une question partout, c'est plus simple et c'est stable. Les autres vont dans le détail, en une liste de « si » distincts (joinFr : « a, b et c »).

Nuance sur l'aération (remarque 2) : on ne dit jamais « aérer évacue la chaleur ». Phrase fixe : « L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur. » C'est vrai physiquement et ça ne promet rien. Je n'ajoute pas le lien avec les nuits tropicales (« justement ce qui se raréfie ici ») : il serait juste, mais il ferait faire au geste une lecture climatique que la carte porte déjà.

## 3. Gestes : textes prêts à coller ({V} = Demandez / Demandez au bailleur / Vérifiez)

**Libellé A** (protections non renseignées)
- Proposé : `{V} si les fenêtres ont des volets ou des stores` (max 65)
  C'est concret, on peut y répondre par oui ou non, et un bailleur ou un vendeur sait le dire. « Protégé du soleil » peut se lire comme une orientation au nord.
- Variante : `{V} si le logement est protégé du soleil` (max 57)
- Cas annexes de A : seul « traversant » non renseigné → `{V} si le logement est traversant` (max 50) ; rien de non renseigné → `{V} si l'on peut aérer les chambres la nuit` (max 60).

**Détail A** (libellé protections)
- Proposé : `Volets, stores ou brise-soleil limitent la chaleur qui entre dans la journée. {V} aussi si l'on peut aérer les chambres la nuit : cela ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.`
- Variante plus courte : `Volets, stores ou brise-soleil limitent la chaleur qui entre le jour. {V} aussi si l'on peut aérer les chambres la nuit, ce qui n'aide que si l'air dehors est plus frais.`
- Si A traversant non renseigné en plus : insérer la question dans la phrase « aussi » : `{V} aussi si le logement est traversant et si l'on peut aérer les chambres la nuit : l'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.`

**Libellé B1 / C**
- Proposé : `{V} si le logement est traversant` (max 50). C'est l'inconnue principale hors niveau A, et elle tient pour les trois verbes.
- Variante (si vous tenez à deux objets) : `{V} si le logement est traversant et protégé du soleil` est correct grammaticalement (même sujet, deux attributs de même nature) mais fait 71 caractères avec « Demandez au bailleur ». À éviter pour la raison de stabilité ci-dessus.

**Détail B1 / C** (cas complet : protections et traversant non renseignés)
- Proposé : `Un logement traversant permet de créer un courant d'air d'une façade à l'autre. {V} aussi si les fenêtres ont des volets ou des stores, si l'on peut aérer les chambres la nuit et si le logement est sous les toits. L'aération de nuit ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur.`
- Variante courte : `{V} aussi si les fenêtres ont des volets ou des stores, si l'on peut aérer les chambres la nuit et si le logement est sous les toits. Aérer la nuit n'aide que si l'air dehors est plus frais.`
- B1 avec protections renseignées par le diagnostic : retirer le fragment « volets ou stores » de la liste. Rien d'autre ne change.

Je ne justifie pas « sous les toits » dans la prose : ce serait une affirmation générale de physique du bâtiment que rien dans la carte n'étaye. La question suffit.

## 4. Où le texte touche juste (à ne pas casser)
- La règle « ce qui n'est pas renseigné n'est pas absent » (l. 74, 112) est l'âme de ce module. Les gestes en sont la suite logique : chaque inconnue devient une question à poser. Garder cette chaîne.
- « Volets, stores ou brise-soleil limitent la chaleur qui entre le jour » est concret, vrai et sans promesse. On garde.
- Les verbes par posture (Demandez / Demandez au bailleur / Vérifiez) laissent le geste au lecteur. Conforme à « ne tranche jamais ».

## Honnêteté de la promesse
- Corrigé : « très chauds » (fait certain, grandeur partiellement non mesurée) devient « fortes chaleurs projetées ».
- Corrigé : « au confort d'été insuffisant » (propriété) devient « classé insuffisant » (classification).
- Corrigé : « permet d'évacuer celle de la journée » (efficacité présumée) devient une condition explicite.

## Verdict
Titres : À RÉÉCRIRE (le mot « très chauds » outrepasse la preuve). Gestes : À RETOUCHER (la construction plus que le lexique : passer d'attributs coordonnés à des questions distinctes).

## Cohérence (posée, non tranchée)
- Le fallback sans logement, `"Des étés plus difficiles à concilier avec votre projet"` (fact-compositions.ts l. 148), dit « plus difficiles », donc une évolution que la classification ne lit pas (même grief que la remarque 3). C'est hors périmètre FUT-20, mais c'est le même mot sur la même carte. À signaler à l'humain.
- `nonRenseigne` dit « s'il dispose de protections solaires », le geste proposé dit « volets ou stores ». Les deux registres coexistent sans contradiction. Si on veut un seul lexique, aligner le geste sur « protections solaires » (variante A).

## Mise à jour de la doctrine (proposée à Claude principal)
> **Chaleur : nommer le niveau projeté, pas l'été.** Un titre ou un label tiré de la classification chaleur dit « fortes chaleurs projetées », jamais « étés très chauds » (certitude, et grandeur fausse quand le seuil est franchi par les nuits tropicales) ni « plus chauds » (évolution que la classification ne lit pas). L'indicateur DPE de confort d'été est « classé » bon/moyen/insuffisant, jamais attribué au logement comme une propriété mesurée.
> **Geste à plusieurs questions : coordonner des questions, pas des attributs.** « si le logement est X et Y » seulement si X et Y sont des attributs de même nature ; sinon, des « si » distincts, chacun avec son sujet. Une seule question dans le libellé quand l'un des verbes de posture ne tient pas en 70 caractères avec deux.

## Limites de mon regard
- Je n'ai pas vu le rendu des cartes. Je ne sais pas si un titre de 68 caractères passe sur une ligne à la largeur mobile, ni comment le titre dialogue visuellement avec le libellé de section (« Ce qui correspond moins bien » / « À contrôler »).
- Je n'ai pas lu les tests ni le constat DRIAS complet tel qu'il s'affiche au-dessus. J'ai supposé qu'il porte déjà l'horizon 2050, d'où l'absence de date dans le titre.
- Je n'ai pas vérifié la répartition réelle des communes qui franchissent le seuil par les nuits seules. L'argument (b) contre « très chauds » vaut dès qu'il en existe une, mais son poids dépend de leur nombre.
- La phrase physique sur l'aération est juste en règle générale. Je ne suis pas thermicien et je n'ai pas de source citée dans le dépôt.

## Version minimale (~90 % de la valeur)
Remplacer « Des étés très chauds » par « De fortes chaleurs projetées » dans les trois titres. Dans le geste, remplacer « aérable la nuit » par la question « si l'on peut aérer les chambres la nuit ». Dans le détail, remplacer « permet d'évacuer celle de la journée » par « ne rafraîchit que lorsque l'air extérieur est plus frais qu'à l'intérieur ».

## Quand rouvrir
- Si la classification chaleur se met à lire une évolution (écart à la référence) : « plus chauds » redeviendrait légitime, et le titre pourrait le dire.
- Si un lecteur ou un testeur lit « classé bon » comme « pas de souci de chaleur ici » : passer le cas bon à l'option 2 (neutre).
- Si le DPE expose un jour un champ fiable d'étage ou de dernier niveau : la question « sous les toits » sort du geste pour devenir un constat.
- Si les retours montrent que les bailleurs ne savent pas répondre à « traversant » : remettre les volets et stores en tête du libellé B1/C.
