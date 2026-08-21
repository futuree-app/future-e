# Attribution des apports du lecteur : formulations et garde-fou

> Rapport de l'Editorial Writer, 21/08/2026. **Proposition, aucun code de production écrit.**
> Chantier : « Doctrine des apports du lecteur » (`docs/vault/briefs/logement-caracteristiques-declarees.md`).
> Lu pour ce rapport : le brief, `docs/vault/doctrine/editoriale.md`, `docs/vault/principes/invariants.md`,
> `src/lib/synthesis-guardrails.ts`, `src/lib/synthesis-guardrails.test.ts`,
> `src/app/api/synthesize-quartier/route.ts` (VOICE_RULES, ATTENTES DU LECTEUR, REPÈRES DE TERRAIN),
> `docs/audits/2026-08-11-syntheses-logement-fautives.md`, `src/lib/thermal-evidence.ts` (noms des facteurs).

---

## Ce que je juge, en une phrase

Le lecteur qui décrit son logement fait un cadeau au produit. Le texte doit lui rendre ce cadeau
sans le lui reprocher (mise en doute), sans le lui confisquer (transformation en fait sourcé), et
sans le lui revendre en verdict (« votre logement est confortable »). Les trois fautes sont
différentes et n'appellent pas les mêmes remèdes.

---

# PARTIE 1 · LES FORMULATIONS

## 1. Le répertoire d'attribution

### 1.1 Combien de formules faut-il vraiment ?

La question posée (« combien pour que trois paragraphes ne deviennent pas litaniques ? ») contient un
piège de dosage. La réponse n'est pas « le plus possible » : un répertoire de dix formules produit une
prose qui a l'air de chercher des synonymes, ce qui est un marqueur d'IA aussi net que le tiret cadratin.

**La réponse est : cinq formules, et une règle de densité qui en fait employer deux ou trois par texte.**

La règle de densité fait plus de travail que le répertoire :

> L'attribution se pose **à la première assertion d'un bloc**, et **à toute phrase qui tire une
> conséquence**. Entre les deux, elle se tait. Une caractéristique déjà attribuée ne se réattribue pas
> à chaque mention.

Trois paragraphes ne demandent donc jamais plus de trois marqueurs explicites. Au-delà, c'est le
signe que le texte énumère au lieu de lire.

### 1.2 Les cinq formules retenues

| # | Formule | Emploi | Pourquoi elle tient |
|---|---|---|---|
| 1 | **« Vous indiquez que… »** | ouverture courte, en cours de prose | La plus neutre. Verbe au présent, sujet = le lecteur. Elle n'évalue rien. |
| 2 | **« D'après ce que vous avez indiqué, … »** | ouverture de bloc, une fois | La plus posée. Elle installe le régime de provenance pour ce qui suit. C'est la formule du test d'acceptation du brief. |
| 3 | **« Le logement que vous décrivez … »** | phrase de lecture | **La meilleure des cinq.** L'attribution est portée par le sujet grammatical, pas par une incise. Zéro effet litanique : on peut l'employer deux fois sans que ça s'entende. |
| 4 | **« Ce que vous en dites … »** | bascule vers la conséquence | Attribue au moment exact où le texte s'apprête à conclure, là où le risque est maximal. |
| 5 | **« Selon votre description, … »** | variante de secours | Correcte, très légèrement clinique. À garder en troisième position, jamais en ouverture. |

Deux **reprises légères**, qui ne comptent pas comme des formules mais évitent la répétition quand
une conséquence doit être ré-ancrée :

- « Ces éléments, tels que vous les décrivez, … »
- « Sur cette base, … » (uniquement si l'attribution est encore lisible à une phrase de distance).

### 1.3 Ce qui est écarté, et pourquoi

**Administratif (langue du contrôle et du sinistre) :**

- « selon vos déclarations » : c'est le vocabulaire de l'assureur et du fisc. « Déclaration » est le mot
  qui précède « fausse déclaration ». Il installe un soupçon que rien ne justifie.
- « sur la base des éléments déclaratifs » : jargon pur.
- « les caractéristiques renseignées par l'utilisateur » : « utilisateur » à la troisième personne, dans un
  texte qui vouvoie. Rupture de voix.

**Sur « d'après les caractéristiques renseignées » (proposée par le brief) :** acceptable comme **étiquette
d'interface** courte, à écarter **en prose**. « Renseigner » est le verbe du formulaire, et le participe passé
sans agent efface précisément la personne qu'on veut attribuer. En prose, préférer la formule 2.

**Mise en doute :**

- « vous auriez indiqué », « il semblerait que », « vous estimez que » : le conditionnel et le verbe d'opinion
  transforment l'attribution en réserve. Le lecteur n'est pas suspect, il est la meilleure source disponible
  sur ses volets.

**Mise en scène du produit :**

- « vous nous avez dit que », « merci de nous avoir indiqué » : futur•e devient un interlocuteur qui se raconte.
  Violation directe de « la page s'adresse au lecteur, pas à elle-même » (`doctrine/editoriale.md`).
- « vous le savez mieux qu'un document » : flatteur, donc vendeur. C'est vrai, et c'est exactement pour ça
  qu'il ne faut pas le dire au lecteur : ça sonne comme une justification de ce qu'on lui demande.

**Contraintes du dépôt, rappelées :** aucun tiret cadratin dans ces formules (aucune n'en contient) ;
aucune antithèse « c'est X, pas Y » (« ce n'est pas un fait sourcé, c'est votre description » est interdit,
et de toute façon parle de l'architecture).

### 1.4 Le piège structurel de l'étiquette de bloc

La forme d'écran proposée par le brief (« **Ce que vous avez indiqué** · Appartement, traversant, volets »)
porte l'attribution une fois pour toutes, ce qui est excellent pour l'écran. **Elle ne suffit pas pour la
prose**, et pour deux raisons distinctes :

1. la synthèse rédigée est reprise dans le PDF, citée, relue hors de son bloc ;
2. le garde-fou déterministe travaille **à la phrase** (voir `phrases()` dans `synthesis-guardrails.ts`) :
   il ne voit aucun intertitre. Une prose qui s'appuie sur l'étiquette de bloc sera refusée.

Conséquence éditoriale à graver : **la phrase qui tire une conséquence porte toujours son attribution,
même sous un intertitre qui l'a déjà donnée.**

---

## 2. Ce que le lecteur dit de lui, ce qu'il dit du monde

### 2.1 La règle, sans jargon

> **Ce que vous dites de vous, futur•e le prend pour ce que c'est. Ce que vous dites de votre logement,
> futur•e dit d'où ça vient.**

Version longue, si elle doit s'écrire quelque part pour le lecteur :

> Vous êtes la seule autorité sur ce qui compte pour vous : futur•e ne met pas ça à distance. Votre
> logement, lui, pourra un jour être décrit par un document : tant qu'aucun ne le décrit, futur•e
> précise que la description vient de vous.

### 2.2 Le test qui tranche en une seconde

*Un tiers pourrait-il, un jour, produire un papier qui contredit cette phrase ?*

- Oui (le logement est traversant, il a des volets, il fait 72 m²) : **attribuer**.
- Non (le calme compte beaucoup pour vous) : **ne pas attribuer**. Attribuer ici serait une mise en doute.

### 2.3 Exemples

**Autorisé, sans attribution :**
- « Le calme compte beaucoup pour vous. »
- « Vous cherchez d'abord un été tenable. »
- « Votre hésitation porte sur l'eau. »

**Interdit (mise en doute d'une déclaration sur soi) :**
- « D'après vous, le calme compte beaucoup. »
- « Vous estimez que le calme est important pour vous. »
- « Le calme semble compter pour vous. »

**Le cas fourbe, à connaître :** une phrase qui commence sur soi et bascule sur le monde.

> « Le calme compte beaucoup pour vous, et le quartier est calme. »

La première moitié est correcte, la seconde est une affirmation sur le territoire qui doit venir d'une
donnée ou disparaître. La bascule se fait sur une conjonction, et c'est là qu'elle se rate.

### 2.4 Note de cohérence avec le prompt Territoire

`synthesize-quartier/route.ts` traite déjà cette matière sous « ATTENTES DU LECTEUR » et « REPÈRES DE
TERRAIN », avec une consigne qui va dans le sens inverse de la mienne : *« Ne citez jamais les champs
bruts ("vous avez écrit…"). Traduisez-les en lecture. »* Cette consigne est **juste pour les attentes**
(déclaration sur soi : on ne cite pas, on hiérarchise) et **dangereuse si on l'étend aux repères de
terrain** (déclaration sur le monde : « le quartier paraît encore tenir » est déjà, aujourd'hui, une
affirmation sur le quartier tirée d'un ressenti non attribué).

**Tension posée, non tranchée par moi :** faut-il aligner les REPÈRES DE TERRAIN sur la règle
d'attribution ? Je pense que oui, et l'exemple donné dans le prompt actuel (« Le quartier paraît encore
tenir ») en est la démonstration : « paraît » ne dit pas à qui il paraît.

---

## 3. Quand la caractéristique est à la fois déclarée et sourcée

### 3.1 Elles concordent : la source prime, et on ne fait pas passer d'examen

Oui, le texte peut affirmer sans attribution : ce n'est plus la déclaration qui porte la phrase, c'est le
diagnostic. Le brief est net (« le diagnostic gagne toujours sur la déclaration pour les champs qu'il porte »).

**Phrase type, option A (sobre, recommandée par défaut) :**

> Le diagnostic attribué à ce logement le décrit comme traversant.

**Phrase type, option B (la convergence est nommée) :**

> Le diagnostic attribué le décrit lui aussi comme traversant.

**L'arbitrage que je pose sans le trancher :** l'option B crée de la confiance (le lecteur voit que sa
connaissance du lieu tient debout) au prix d'un mot qui met sa parole en balance avec un document.
Le « lui aussi » est le moins mauvais des marqueurs de convergence, parce qu'il n'inverse pas la charge.
**À écarter dans les deux cas :** « votre déclaration est confirmée par le diagnostic », qui fait du lecteur
un candidat qu'on corrige.

### 3.2 Elles se contredisent : deux régimes, pas un

Le brief pose la condition dure, et elle est éditoriale autant que technique : *un écart ne se signale que
si les deux valeurs décrivent la même chose sous la même définition.*

**Régime 1, définitions différentes (surface Carrez contre surface habitable) : on ne signale aucun écart.**
Signaler ici apprendrait au lecteur à se méfier d'un document qui a raison.

> Le diagnostic mesure 62 m² de surface habitable. Une surface inscrite sur un acte de vente ne compte
> pas les mêmes espaces, les deux chiffres peuvent différer sans que l'un soit faux.

**Régime 2, même définition, valeurs contraires (traversant oui / non) :**

> Le diagnostic attribué décrit un logement non traversant, quand vous le décrivez traversant. Le dossier
> retient le diagnostic, parce qu'un tiers peut le vérifier. Si le document est antérieur à des travaux,
> c'est lui qui a vieilli.

Trois choses s'y jouent, et aucune n'est décorative : l'écart est nommé, la règle est **expliquée** (sinon
c'est un désaveu), et la dernière phrase rend au lecteur la seule action qui lui appartient.

**À écarter :** « incohérence détectée » (langue de la validation de formulaire), « votre déclaration est
erronée » (verdict sur la personne), et le silence pur, qui laisserait le lecteur voir deux valeurs
contraires à l'écran sans explication.

---

## 4. Le vécu : trois phrases autorisées, trois interdites

Le principe qui les sépare tient en une ligne :

> **Un vécu ne change jamais le sujet de la phrase. Le sujet reste vous, jamais la commune, jamais le
> logement.** Le vécu répond à « qu'est-ce que ça vous a fait », jamais à « qu'est-ce qu'il en est ici ».

**Autorisées :**

1. « Vous avez mal dormi pendant la canicule. Les nuits chaudes deviennent plus fréquentes ici. »
   *(deux phrases, deux régimes, aucune passerelle causale : la juxtaposition suffit et le lecteur la fait.)*
2. « Ce que vous avez vécu pendant les fortes chaleurs oriente ce que ce dossier regarde en premier. »
   *(le vécu comme posture, dit explicitement.)*
3. « Vous dites que l'été a été difficile à tenir chez vous. Les projections rendent ce type de nuit plus fréquent. »
   *(« ce type de nuit » reste à l'échelle du phénomène, jamais du logement.)*

**Interdites :**

1. « Les nuits sont difficiles dans cette commune. » *(le vécu est devenu un état du territoire.)*
2. « Comme vous l'avez constaté, les nuits sont ici difficilement supportables. » **La plus dangereuse :**
   l'attribution est en façade, la généralisation est derrière. Elle passera tous les garde-fous par
   marqueur d'attribution.
3. « Votre expérience confirme que ce logement supporte mal la chaleur. » *(le vécu est devenu une preuve
   sur le bâti, et « confirme » lui donne le statut d'un test.)*

À noter, quatrième interdit qui existe déjà ailleurs dans le dépôt : « les habitants dorment mal l'été »
tombe sous « PAS DE PSYCHOLOGIE COLLECTIVE » (`synthesize-quartier/route.ts`).

**La paire à retenir**, parce qu'un caractère les sépare presque :

> ✅ « Vous avez mal dormi pendant la canicule. » / ❌ « On dort mal ici pendant les canicules. »

---

# PARTIE 2 · LE GARDE-FOU DÉTERMINISTE

## 5. Les motifs proposés

### 5.0 Ce que j'ai lu du dispositif existant

Les quatre familles actuelles (`altitude`, `absence_conclue`, `absence_sinistre_conclue`,
`protection_supposee`) partagent une forme : une liste de **chaînes normalisées** (sans diacritiques, via
`fold`), un booléen `desamorcable`, et un désamorçage **borné à la phrase** par le lexique `INCERTITUDE`.
La sévérité assumée est explicite en tête de fichier : *en cas de doute, on refuse*, parce qu'un texte
refusé à tort ne coûte que de la prose, jamais un fait.

**Le cas qui nous occupe casse cette forme sur un point**, et il faut le dire avant de proposer des motifs :
la faute n'est pas la présence d'un mot, c'est **l'absence d'un autre**. « Le logement est traversant » est
fautif si `traversant` est déclaré, et parfaitement légitime s'il vient du diagnostic (le test de non-régression
existant contient déjà `l'air peut traverser le logement d'une façade à l'autre`, qui **doit passer**).

**Deux conséquences d'architecture, que je pose et que l'Architecte tranche :**

1. `validateAssertions(text)` doit accepter un contexte : quelles caractéristiques sont **déclarées**, et un
   diagnostic est-il attribué. Sans ce contexte, cette famille produit des faux positifs sur tous les dossiers
   sourcés, c'est-à-dire précisément là où la prose est la meilleure.
2. Le désamorçage doit devenir typé (`desamorce: "incertitude" | "attribution" | "aucun"`), au lieu du
   booléen actuel : ici, ce qui rend une phrase honnête n'est pas une marque de doute, c'est une marque de
   provenance.

### 5.1 Famille A · `declare_non_attribue`

*Portée : uniquement les caractéristiques présentes dans `declared_features`. Désamorçage : marqueur
d'attribution dans la MÊME phrase. Sévérité : refus, faux positif assumé.*

Motifs, groupés par caractéristique (**à confirmer sur textes réels, voir §6 ; ceci est une amorce, pas une liste établie**) :

```
traversant            : "traversant", "traversante", "d'une facade a l'autre",
                        "double orientation", "l'air traverse", "traversee par l'air"
protections_solaires  : "volets", "stores", "persiennes", "protections solaires",
                        "occultations exterieures"
brasseur_air          : "brasseur", "brasseurs d'air", "ventilateur de plafond"
type_batiment         : "maison individuelle", "pavillon", "appartement" (voir avertissement)
surface               : "m2", "metres carres"
annee_construction    : "construit en", "datant de", "batiment des annees", "date de construction"
```

Marqueurs d'attribution qui désamorcent (dans la phrase) :

```
"vous indiquez", "vous nous indiquez", "vous avez indique", "vous decrivez",
"vous avez decrit", "que vous decrivez", "tel que vous", "telle que vous",
"selon votre description", "d'apres ce que vous", "d'apres votre", "d'apres vous",
"vous signalez", "vous dites", "vous en dites", "caracteristiques renseignees"
```

Le validateur désamorce sur la **provenance**, pas sur l'élégance : « d'apres vous » y figure alors que je
l'écarte du répertoire éditorial (§1.3). Le filet ne juge pas le style, la relecture le fait.

**Avertissements honnêtes sur trois motifs :**
- `"appartement"` et `"maison"` apparaissent dans presque toute prose Logement, souvent depuis la source.
  Ne les activer que si `type_batiment` est effectivement déclaré, sinon le taux de faux positifs sera tel
  que la famille sera désactivée dans les trois semaines.
- `"m2"` attrapera aussi les surfaces sourcées. Même gate.
- `"volets"` peut apparaître dans une phrase de lacune (« les protections solaires ne sont pas renseignées »),
  déjà couverte par le désamorçage `INCERTITUDE` si on cumule les deux jeux de marqueurs.

### 5.2 Famille B · `verdict_confort`

*Portée : dès qu'aucun diagnostic n'est attribué. Désamorçage : AUCUN, ni incertitude ni attribution.
Sévérité : refus sec.*

C'est la famille qui attrape la phrase que le brief interdit nommément (« Le logement présente un bon confort
d'été »), et **elle n'est pas la même que la famille A** : la phrase interdite ne cite aucune caractéristique
déclarée. La famille A ne la verrait jamais.

```
"bon confort d'ete", "confort d'ete satisfaisant", "confort d'ete correct",
"confortable en ete", "reste confortable", "supporte bien la chaleur",
"bien protege de la chaleur", "protege de la chaleur", "reste frais",
"restera frais", "peu sensible aux fortes chaleurs", "bien isole", "bien isolee",
"performant", "performante", "logement sain", "de bonne qualite thermique"
```

**Pourquoi non désamorçable par l'attribution :** « d'après vous, le logement offre un bon confort d'été »
reste interdit. Le lecteur a autorité sur ses volets, pas sur le comportement thermique de son bâti. C'est
la traduction exacte de la ligne du brief : le déclaré est une **entrée de lecture**, jamais un fait de décision.
Une attribution ne peut pas racheter une conclusion que personne n'a le droit de tirer.

### 5.3 Famille C · `vecu_generalise` (piste, à établir sur corpus)

*La faute du §4.2 : sujet = commune ou quartier, prédicat = vécu.* Je la propose sans prétendre à des motifs
solides, parce que je ne l'ai pas vue dans des textes réels.

```
"les nuits sont difficiles", "les etes sont difficiles", "on y dort mal",
"on dort mal", "le quartier est etouffant", "invivable", "insupportable l'ete",
"les habitants", "on souffre de la chaleur"
```

À n'inscrire qu'après §6. Une famille écrite de mémoire est exactement ce que ce dépôt s'interdit.

### 5.4 Consignes de relance (`correctionPourAssertions`)

```
declare_non_attribue :
"Vous avez affirmé une caractéristique du logement que le lecteur a lui-même décrite, sans dire
qu'elle vient de lui. Aucun document ne la porte. Reformulez la phrase en nommant sa provenance
(« vous indiquez que… », « le logement que vous décrivez… »), ou retirez-la."

verdict_confort :
"Vous avez conclu sur le confort d'été ou sur la qualité du bâti. Aucun diagnostic n'est attribué à
ce logement : rien ici ne permet cette conclusion, y compris à partir de ce que le lecteur a décrit.
Vous pouvez dire quels éléments jouent dans un sens, jamais quel est le résultat. Retirez la phrase."

vecu_generalise :
"Vous avez transformé ce qu'une personne a vécu en état du territoire. Ce qu'elle a ressenti reste
sa phrase, avec elle pour sujet. Réécrivez en gardant le lecteur comme sujet, ou retirez la phrase."
```

### 5.5 Ce qu'un motif textuel attrape, et ce qu'il ne peut pas attraper

**Attrapé, avec une confiance raisonnable :**
- la caractéristique déclarée affirmée nue dans sa phrase : « Le logement est traversant et dispose de volets extérieurs. » ;
- la reformulation lexicale connue, si le lexique a été établi sur corpus : « l'air traverse d'une façade à l'autre » ;
- le verdict de confort, dans ses tournures usuelles.

**Non attrapé, et je le dis sans le minimiser :**

1. **La conclusion à distance.** « Vous indiquez que le logement est traversant et équipé de volets. Le
   confort d'été s'en trouve amélioré. » La seconde phrase ne cite aucune caractéristique. Seule la famille B
   peut la prendre, et seulement si sa formulation figure dans le lexique. Un découpage à la phrase ne
   reconstruit jamais une chaîne de raisonnement.
2. **Le pronom.** « Vous indiquez que le logement est traversant. Il dispose aussi de volets. » Deuxième
   phrase fautive au regard de la règle, invisible pour un marqueur d'attribution borné à la phrase.
   Question ouverte pour l'Architecte : faut-il une fenêtre de deux phrases pour cette famille ? Le
   commentaire du 11/08 dans `synthesis-guardrails.ts` documente précisément pourquoi la fenêtre a été
   abandonnée. Je ne rouvre pas cette décision, je signale ce qu'elle coûte ici.
3. **La synonymie non prévue.** « Le logement respire d'un bout à l'autre. » Aucun motif ne la voit.
   C'est la leçon de la faute 3 du 11/08 : la tournure qui a échappé à l'audit était une **négation**
   (« l'altitude n'éloigne pas »), que personne n'aurait écrite de mémoire.
4. **L'attribution de façade.** « Comme vous l'avez constaté, les nuits sont ici difficilement supportables. »
   Le désamorçage devient l'exploit : le marqueur d'attribution rend la phrase acceptable au filet alors
   qu'elle est la pire du lot. Seule la famille C peut la prendre.
5. **La fusion en prose fluide.** Le brief le dit et c'est exact : un modèle qui fond plusieurs éléments en
   une phrase élégante efface la provenance, et c'est son comportement normal.

**Ce que j'en conclus, et qui doit figurer en tête du module :** cette famille est un filet **plus troué**
que `altitude` (motif sans faux positif possible, car la donnée n'est plus transmise). La garantie forte
reste en amont : deux blocs séparés dans le payload, et surtout, **ne pas alimenter `DecisionFact` depuis
un déclaré**, ce que le brief a déjà tranché. Le garde-fou protège la prose, il ne protège pas la doctrine.

---

## 6. Le protocole minimal pour établir les motifs honnêtement

Le brief l'exige (« à faire sur des textes générés, jamais de mémoire ») et le dépôt l'a payé une fois.
Voici le plus petit protocole qui tient debout. Il coûte quelques euros de tokens et une demi-journée
de lecture, pas un chantier.

**Étape 0 · Figer le dispositif.** Payload en deux blocs (`sources_etablies` / `elements_declares_par_le_lecteur`)
et bloc de voix rédigés **avant** de générer. Sinon on établit des motifs sur un dispositif qui va changer.

**Étape 1 · Huit à douze payloads qui couvrent la matrice de risque, pas la moyenne :**
(a) déclaré seul, aucun diagnostic (le cas ordinaire, 75 à 86 % des adresses) ;
(b) déclaré + diagnostic concordant ;
(c) déclaré + diagnostic contradictoire, même définition ;
(d) déclaré + diagnostic divergent, définitions différentes (surfaces) ;
(e) « je ne sais pas » sur tous les champs ;
(f) un seul champ déclaré ;
(g) vécu libre seul, sans caractéristique ;
(h) **tous les champs déclarés favorables** (traversant, volets, brasseur) : le cas qui appelle le verdict
« bon confort d'été », donc le plus informatif de tous.

**Étape 2 · Générer sans garde-fou actif**, au modèle, à l'effort et à la température de production
(cf. `/memory/synthesis_model_routing`), au moins 5 tirages par cas, soit 50 à 100 textes. Stocker brut
dans un fichier daté, **jamais en base** : une synthèse s'écrase, un fichier reste.

**Étape 3 · Lire à la main et surligner chaque phrase fautive.** Compter les formulations.
**Règle d'entrée d'un motif : apparu au moins deux fois, sur deux cas différents.** Un motif inventé
n'entre pas, même s'il paraît évident.

**Étape 4 · Constituer symétriquement le corpus de PASSAGE** : les phrases correctes du même corpus.
Sans elles, on ne mesure pas le faux positif, et le filet coûtera la prose entière. C'est la leçon
« rue de la Digue ».

**Étape 5 · Mesurer, et décider avec deux nombres** : combien de fautives attrapées, combien de correctes
refusées. Écrire ces deux nombres dans l'en-tête du fichier de test. Une famille qui refuse plus de correctes
qu'elle n'attrape de fautives ne se livre pas.

**Étape 6 · Geler mot pour mot.** Les textes fautifs entrent dans `synthesis-guardrails.test.ts` sans être
nettoyés (convention déjà en place pour les trois sorties du 11/08), et l'analyse dans
`docs/audits/AAAA-MM-JJ-attribution-declare.md`.

**Étape 7 · Dater les motifs du modèle qui les a produits**, et rejouer le corpus à tout changement de
modèle, d'effort ou de prompt. Un changement de modèle change les formulations, donc périme le lexique.

---

## Rythme et longueur

La prose déclarée est **structurellement** exposée à la litanie : chaque caractéristique appelle son
attribution, et le rythme s'aplatit en trois phrases de même longueur commençant toutes par « vous ».
La règle de densité du §1.1 est d'abord une règle de rythme. Le meilleur garde-fou contre la fatigue n'est
pas le synonyme, c'est la **formule 3** (« le logement que vous décrivez »), qui attribue sans incise.

Sur la longueur du bloc déclaré : deux à trois phrases. Au-delà, le texte récite un formulaire, ce qui est
exactement l'écran que le brief refuse de construire.

## Honnêteté de la promesse

Un point de vigilance que le chantier n'a pas encore nommé : la phrase du test d'acceptation contient
« Ces éléments jouent en faveur du confort d'été ». C'est correct, et c'est fragile. « Jouent en faveur de »
est **la dernière formulation honnête avant le verdict**. Trois glissements attendus, à refuser :
« améliorent le confort d'été », « assurent un bon confort », « suffisent à tenir l'été ».
Le vocabulaire autorisé pour le sens d'un facteur sans son résultat : « joue en faveur de », « pèse dans le
bon sens », « compte parmi ce qui aide ». Rien qui quantifie, rien qui conclue.

## Verdict

**DANS LA VOIX** pour la phrase de référence du brief : elle attribue, elle nomme le sens des facteurs sans
conclure, et elle maintient l'absence de diagnostic à côté au lieu de la combler. Elle est un bon étalon.

**À RETOUCHER** pour le prompt `synthesize-quartier` : la consigne « Ne citez jamais les champs bruts,
traduisez-les en lecture » est juste pour les attentes et laisse aujourd'hui passer, sur les repères de
terrain, des affirmations sur le quartier tirées d'un ressenti non attribué (« Le quartier paraît encore
tenir » est l'exemple donné par le prompt lui-même).

**À ÉCRIRE** pour la famille B (`verdict_confort`) : c'est elle qui garde le test d'acceptation du brief.

---

## Cohérence (tensions posées, non tranchées)

1. **Repères de terrain du module Territoire.** Faut-il leur appliquer la règle d'attribution ? Cela
   modifierait un prompt en production et une consigne écrite volontairement dans l'autre sens.
2. **Fenêtre d'une ou deux phrases** pour la famille A. Le pronom en début de phrase suivante est une faute
   fréquente et invisible ; élargir la fenêtre rouvre une décision documentée du 11/08.
3. **Convergence nommée ou non** quand déclaré et sourcé concordent (§3.1, options A et B) : gain de
   confiance contre risque de mise en balance de la parole du lecteur.
4. **Contexte requis par le validateur.** Passer `declared_features` et l'existence d'un diagnostic à
   `validateAssertions` change sa signature, aujourd'hui purement textuelle. C'est une décision d'architecture.

## Mise à jour de la doctrine (prêt à écrire dans `docs/vault/doctrine/editoriale.md`)

> ### Ce que le lecteur apporte
>
> Ce que le lecteur dit de lui, futur•e le prend pour ce que c'est. Ce que le lecteur dit du monde,
> futur•e dit d'où ça vient. Le test : un tiers pourrait-il un jour produire un document qui contredit
> cette phrase ? Si oui, on attribue. Si non, attribuer serait une mise en doute.
>
> L'attribution se pose à la première assertion d'un bloc et à toute phrase qui tire une conséquence,
> jamais à chaque mention. Répertoire : « vous indiquez que », « d'après ce que vous avez indiqué »,
> « le logement que vous décrivez », « ce que vous en dites », « selon votre description ».
> Écartés : « selon vos déclarations » et « éléments déclaratifs » (langue du contrôle), « vous auriez
> indiqué » et « vous estimez que » (mise en doute), « vous nous avez dit » (futur•e se met en scène).
>
> Un élément décrit par le lecteur peut être nommé, jamais conclu : « joue en faveur du confort d'été »,
> jamais « le logement présente un bon confort d'été ». Un vécu ne change jamais le sujet de la phrase :
> le sujet reste le lecteur, jamais la commune, jamais le logement. « Vous avez mal dormi pendant la
> canicule » est autorisé ; « les nuits sont difficiles ici » ne l'est jamais.
>
> Une déclaration qui concorde avec une source ne se fait pas « confirmer » : la source porte la phrase.
> Une divergence ne se signale que si les deux valeurs décrivent la même chose sous la même définition.

## La version minimale (90 % de la valeur)

**Si une seule chose est faite : la famille B (`verdict_confort`), pas la famille A.**

La phrase que le brief interdit nommément (« Le logement présente un bon confort d'été ») ne contient
**aucune** caractéristique déclarée : la famille A ne la verrait jamais, et le lexique de la famille B tient
en dix chaînes sans gate de contexte, tant qu'aucun diagnostic n'est attribué. Une caractéristique déclarée
citée sans attribution est une faute de provenance ; un verdict de confort est une faute de fond. C'est la
seconde qui coûte la promesse du produit.

Côté prose, le plus petit geste qui change tout est un mot : remplacer, dans tout texte de ce chantier,
tout verbe de résultat (« présente », « offre », « assure ») par un verbe d'orientation (« joue en faveur de »).
La provenance peut se perdre dans une phrase mal tournée ; un verdict, non.

## Limites de mon regard (ce run)

- **Je n'ai lu aucun texte réellement généré sur un payload déclaré**, pour la raison simple qu'il n'en
  existe aucun : rien n'est codé. Tous les motifs du §5 sont donc des **hypothèses de formulation**, et je
  suis en train de faire exactement ce que le §6 interdit de considérer comme établi. Ils valent comme
  amorce de lecture du corpus, pas comme liste à livrer.
- **Je n'ai pas ouvert le prompt de `synthesize-logement`**, seulement celui de `synthesize-quartier` (demandé
  dans ma consigne) et l'audit qui cite le premier. La famille s'appliquera pourtant d'abord au module Logement.
  Mes recommandations sur la cohabitation avec ses règles existantes sont donc partielles.
- **Je juge la prose, pas son effet à l'écran.** Je ne sais pas si le bloc « Ce que vous avez indiqué » sera
  lu comme une reconnaissance ou comme une décharge de responsabilité : cela dépend d'un rendu visuel qui
  relève du Design Critic.
- **Je ne mesure ni le taux de refus, ni son coût.** Si la famille A refuse la moitié des générations, elle
  sera désactivée, et mon avis sur ses motifs n'aura servi à rien. Seule l'étape 5 du protocole le dira.
- **Je n'ai pas vérifié comment le PDF reprend la synthèse**, alors que l'argument du §1.4 (l'étiquette de
  bloc ne voyage pas) repose sur cette hypothèse.

## Quand rouvrir ce sujet

- **Le corpus du §6 existe** : mes motifs sont périmés le jour même, les vrais les remplacent.
- **Changement de modèle ou d'effort de synthèse** : les formulations changent, le lexique se re-mesure.
- **Le taux de refus en production dépasse 15 %** sur la famille A : le filet coûte plus de prose qu'il ne
  protège de fautes, arbitrer entre élargir les marqueurs d'attribution et réduire le lexique.
- **À l'inverse, si le corpus montre que le modèle attribue spontanément dans plus de 90 % des cas** : la
  famille A devient du zèle, la famille B suffit, et on économise une signature de fonction.
- **Un nouveau champ déclaré entre en V2** (surface, année de construction) : le lexique s'étend, et surtout
  les motifs `"m2"` et `"construit en"` deviennent actifs, avec leur risque de faux positifs sur le sourcé.
- **Si l'étiquette DPE déclarée est un jour demandée** (le brief propose de ne pas la demander) : une famille
  dédiée devient obligatoire, parce que le vocabulaire « passoire thermique » d'un dossier payant deviendrait
  adossé à un souvenir.
- **Si les repères de terrain du module Territoire produisent une plainte ou un écart relevé en audit** : la
  tension n°1 se tranche à ce moment-là, avec un cas réel plutôt qu'un exemple de prompt.
