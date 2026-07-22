# Passe éditoriale : le verdict héros de « En une minute » (+ libellés d'action A2)

**Date** : 2026-07-22 · **Agent** : Editorial Writer · **Statut** : read-only, aucune modification de code.

Textes régénérés depuis le code réel (`node --experimental-strip-types` sur `buildConclusionPlan`),
pas depuis le brief : les 14 branches produites ont été lues telles qu'elles s'affichent.

Fichiers ouverts : `docs/vault/doctrine/editoriale.md`, `docs/vault/principes/invariants.md`,
`src/lib/decision/conclusion-plan.ts`, `mismatch-facts.ts`, `absence-rules.ts`, `agglomeration-rules.ts`,
`coast-rules.ts`, `hard-constraint-rules.ts`, `src/lib/hard-constraints.ts`,
`src/lib/decision/project-view.ts`, `src/lib/comparateur-labels.ts`, `logement-rules.ts`,
`materiality-rules.ts`, les deux specs du 2026-07-22.

---

## 0. Le verdict d'ensemble, en une phrase

Le héros est **structurellement juste** (un signal, pas un paragraphe ; nommé, pas catégorisé ; jamais
généré) et **grammaticalement inversé sur sa branche principale** : il dit que la priorité du lecteur
correspond mal au lieu, là où c'est le lieu qui répond mal à la priorité. Deux branches sur onze sont
du vocabulaire de moteur posé en 32 px. Le détail répète le héros dans deux branches, dont une au mot
près. Et la branche la plus grave du dossier, l'incompatibilité, est la seule qui ne bénéficie pas du
travail de `headlineSubject` : elle affiche encore le `topic`, qui décrit le lieu au lieu de nommer la
condition posée par le lecteur, et répète le nom de la commune dans la même phrase.

---

## 1. LE HÉROS, branche par branche

### 1.1 Arbitrage nommé (la branche la plus fréquente) : À RÉÉCRIRE

**Texte actuel** (94 car.) :
> Deux priorités correspondent moins bien à Toulouse : le calme et l'accès aux espaces naturels.

**Où le texte touche juste.** Il nomme. « le calme », « l'accès aux espaces naturels » : le lecteur
retrouve ses propres mots dans le plus grand texte de l'écran, ce qu'aucune version antérieure ne
faisait. Le gabarit à deux-points est un vrai trouvaille d'ingénierie éditoriale : il neutralise
l'accord et laisse la charge sémantique tomber en fin de phrase, exactement là où l'œil s'arrête en
Serif. Et il ne dramatise pas : « moins bien » est un mot lucide, ni « mauvais » ni « faible ». Ne
cassez pas ces trois choses en réparant le reste.

**Ce qui trahit le ton.**

1. **L'inversion logique.** « Une priorité correspond moins bien à Toulouse » fait de *la priorité du
   lecteur* le sujet qui s'ajuste mal. Ce n'est pas ce qui a été mesuré : c'est Toulouse qui répond mal
   à une priorité. La différence n'est pas cosmétique. Dans la version actuelle, la chose déviante,
   c'est ce que le lecteur veut. Invariant n°6 (« on parle à une intelligence, pas à une peur ») et
   doctrine « la page s'adresse au lecteur » : le lieu est l'objet du jugement, jamais le désir.
2. **« priorités » ouvre la phrase.** Les trois premiers mots lus en 32 px sont « Deux priorités
   correspondent » : du vocabulaire de formulaire. Rien du lecteur, rien du lieu.
3. **« correspondent »** appartient à la famille lexicale de l'étiquette (« Correspondance favorable »,
   « Correspondance à nuancer »). Le héros redit donc le mot du badge posé juste au-dessus de lui.
4. **« moins bien » sans terme de comparaison.** Moins bien que quoi ? Que vos autres priorités ?
   Qu'ailleurs ? Le calcul dit « qu'ailleurs » (rang national pour 13 critères, absence attestée /
   mesure absolue / catégorie pour les 5 autres, et dans les quatre cas d'autres communes font mieux).
   L'ambiguïté est réparable en 11 caractères.

**Réécriture proposée (option A, recommandée).** Le lieu redevient sujet, le gabarit à deux-points est
conservé intégralement, aucun accord nouveau à gérer.

```
m == 1, tout nommé   `${nom} répond moins bien à une de vos priorités : ${sujets}.`
m >= 2, tout nommé   `${nom} répond moins bien à ${compte} de vos priorités : ${sujets}.`
m > nommés           `${nom} répond moins bien à ${compte} de vos priorités, dont ${sujets}.`
```

Mesures réelles :
- 94 car. « Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux espaces naturels. »
- 61 car. « Toulouse répond moins bien à une de vos priorités : le calme. »
- 100 car. « Toulouse répond moins bien à quatre de vos priorités, dont le calme et l'accès aux espaces naturels. »
- 99 car. « Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux services du quotidien. »
- 97 car. « Toulouse répond moins bien à deux de vos priorités : le calme et le dynamisme du bassin d'emploi. »

À longueur strictement identique à l'actuelle (94 = 94) : **la gate de 110 se comporte exactement
pareil**, aucune régression de bascule en posture.

**Option B (le lecteur en sujet)** : `Deux de vos priorités sont moins bien servies à Toulouse : …`
(100 car.). Elle ouvre sur « vos priorités », c'est-à-dire sur le lecteur, mais passive le lieu et
coûte 6 caractères. Arbitrage que je pose, que je ne tranche pas : **ouvrir sur le lieu (actif, plus
court) ou sur le lecteur (possessif, plus enveloppant)**. Je recommande A, parce que toutes les autres
branches du héros ouvrent déjà sur le nom de la commune : c'est une famille sonore, et une famille
vaut mieux que deux exceptions.

**Sur « qu'ailleurs ».** `Toulouse répond moins bien qu'ailleurs à deux de vos priorités : …` fait
106 car. C'est plus honnête, et c'est ce que la donnée dit. Mais 106 sur 110 : la moindre commune un peu
longue bascule en posture, donc on perdrait des héros nommés pour gagner un adverbe. **Recommandation :
ne pas le mettre dans le héros, le mettre dans le détail** (qui a 320 caractères et le porte déjà :
« nettement moins bien servies qu'ailleurs »).

**Rythme.** La phrase A tient en 2 lignes à 540 px et pose son poids sur les deux derniers groupes
nominaux. Rien à corriger.

---

### 1.2 Arbitrage, posture (gate dépassée ou 3+ hétérogènes) : À RÉÉCRIRE

**Texte actuel** (67 car.) :
> Un arbitrage réel au Kremlin-Bicêtre, sans incompatibilité établie.

**Le soupçon du porteur est confirmé, et c'est la pire phrase du lot avec 1.4.** Trois fautes cumulées :

1. **Phrase sans verbe, purement nominale** : c'est une étiquette de moteur, pas une phrase adressée.
2. **« Un arbitrage réel »** : futur•e commente le statut de son propre calcul. Le lecteur n'a pas
   demandé s'il y avait « un arbitrage réel », il a demandé si ce lieu lui va.
3. **« sans incompatibilité établie »** décrit **l'absence d'un problème**, exactement le défaut que le
   commentaire de `verdictPresentation` revendique d'avoir corrigé (« "Aucune contrainte n'est
   contredite" décrivait l'absence d'un problème »). Et « établie » est du vocabulaire de preuve
   interne. En 32 px, on demande au lecteur de calculer une double négation.

**Aggravant** : cette branche **connaît le compte réel** (`m`) et **ne le dit pas**, alors que la gate
qui l'a déclenchée ne portait que sur les *noms*, pas sur le nombre. On remplace une information qu'on
possède par une abstraction qu'on fabrique.

**Réécriture proposée** :
```
`${compte} de vos priorités sont moins bien servies ${a}.`
```
- 66 car. « Trois de vos priorités sont moins bien servies au Kremlin-Bicêtre. »
- 67 car. « Quatre de vos priorités sont moins bien servies au Kremlin-Bicêtre. »

Variante alignée sur la famille « lieu sujet » de 1.1 : « Le Kremlin-Bicêtre répond moins bien à trois
de vos priorités. » (62 car.). Je recommande celle-ci pour l'unité de voix avec 1.1.

**Et corollaire éditorial fort** : quand le héros renonce à nommer, **c'est le détail qui doit nommer**
(17 px, 320 caractères, trois sujets y tiennent sans faire paragraphe). Aujourd'hui, dans cette
branche, le lecteur n'apprend nulle part dans la synthèse *lesquelles* de ses priorités sont mal
servies. La gate protège la mesure du héros ; elle ne doit pas faire disparaître l'information du
dossier. Voir le détail proposé en 2.2.

---

### 1.3 Neutral : À RÉÉCRIRE

**Texte actuel** (71 car.) :
> Toulouse ne se distingue nettement ni favorablement ni défavorablement.

Confirmé : synthèse de moteur. « ne se distingue » est du langage de distribution statistique ; trois
adverbes en -ment dans une phrase de héros ; double négation corrélative « ni… ni… ». Et c'est la
phrase la **moins** informative du produit affichée dans le **plus grand** corps de l'écran : le
rapport signal/taille s'inverse, ce que la refonte entière cherchait à corriger.

Est-ce que ce texte devrait exister ? **Oui**, l'information est réelle et utile (« rien ici ne tranche
pour vous »), mais elle doit être dite du point de vue de la décision, pas de la distribution.

**Réécriture proposée** (71 car.) :
> Rien, dans ce que vous avez demandé, ne penche pour ou contre Toulouse.

Elle nomme l'acte du lecteur (« ce que vous avez demandé »), n'emploie aucun mot de moteur, et dit
exactement l'état : aucun signal d'un côté ni de l'autre. Option plus sobre, si « penche » paraît trop
imagé (66 car.) : « Sur vos priorités, Toulouse ne ressort ni en avantage ni en écart. » (elle
réintroduit le « ni… ni » : je la donne, je ne la recommande pas).

---

### 1.4 Incompatibilité : À RÉÉCRIRE (priorité la plus haute du rapport)

**Texte actuel** (98 car., exemple du brief) :
> Une contrainte de votre projet n'est pas satisfaite aux Sables-d'Olonne : la proximité d'une gare.

Le détail (« La gare la plus proche est à 42 km. ») est **excellent** : concret, mesuré, sans
commentaire. Ne le touchez pas.

**Ce qui trahit le ton.**

1. **« Une contrainte … n'est pas satisfaite »** : vocabulaire de satisfaction de contraintes, au
   passif. C'est le pire endroit du dossier pour parler comme un solveur : c'est la branche où la
   réponse est « non », donc celle où le lecteur a le plus besoin d'entendre une voix humaine.
2. **Le sujet affiché n'est pas le bon.** Le code prend `inc.topic`. Or les `topic` d'incompatibilité
   (`src/lib/hard-constraints.ts`) sont écrits pour décrire **le lieu**, pas la condition du lecteur, et
   ils **portent le nom de la commune** :
   - `la distance de Toulouse au littoral`
   - `l'altitude de Briançon`
   - `le relief autour de Rodez`
   - `la taille de Rodez face à Lyon`
   - `la zone où se situe Toulouse`

   Rendu réel : « Une contrainte de votre projet n'est pas satisfaite **à Toulouse** : la distance **de
   Toulouse** au littoral. » Le nom deux fois dans une phrase de héros, et un sujet qui nomme
   l'indicateur défavorable (« la distance au littoral ») là où le lecteur a écrit « je veux être à
   moins de 20 km de la mer ». C'est exactement la faute que `headlineSubject` a corrigée pour les
   mismatchs (`coast-rules.ts:58`), restée non corrigée pour les contraintes dures.

3. **La bonne chaîne existe déjà** : `hardConstraintLabel(project, key)`
   (`src/lib/decision/project-view.ts:73`) rend **la condition telle que le lecteur l'a posée** : « la
   proximité de la gare Matabiau », « le département 31 », « le fait de quitter Lyon », « une commune de
   moins de 20 000 habitants », « la proximité de la mer (moins de 20 km) ». Le bloc
   `unexamined_hard_constraints` l'utilise déjà ; le héros, non. `IncompatibilityFact` porte
   `hardConstraintKey` : la substitution est mécanique.

**Réécriture proposée** :
```
`Une condition de votre projet n'est pas remplie ${a} : ${hardConstraintLabel(...)}.`
```
- 94 car. « Une condition de votre projet n'est pas remplie aux Sables-d'Olonne : la proximité d'une gare. »
- 94 car. « Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la gare Matabiau. »
- 102 car. « Une condition de votre projet n'est pas remplie à Toulouse : une commune de moins de 20 000 habitants. »
- 89 car. « Une condition de votre projet n'est pas remplie à Villeurbanne : le fait de quitter Lyon. »
- 101 car. « Une condition de votre projet n'est pas remplie à Toulouse : la proximité de la mer (moins de 20 km). »

« condition » plutôt que « contrainte » : c'est le mot du lexique tranché (« une condition posée par le
lecteur »), et c'est le mot que le lecteur emploie de lui-même. « remplie » plutôt que « satisfaite » :
même sens, zéro odeur d'algorithme. Tous les cas testés passent la gate, y compris les libellés
instanciés les plus longs.

Variante si vous voulez marquer que c'est **lui** qui l'a posée (98 car.) : « Une condition que vous
avez posée n'est pas remplie aux Sables-d'Olonne : la proximité d'une gare. » Plus chaude, 4 car. de
plus, plus de risque de bascule sur commune longue. Arbitrage posé, non tranché.

---

### 1.5 Réserve dominante nommée : DANS LA VOIX (retouche mineure)

**Texte actuel** (64 car.) :
> Le principal point à contrôler à Toulouse : la chaleur estivale.

C'est le meilleur héros du lot. Il nomme une chose vraie, il donne un ordre de marche, il n'emploie
aucun mot de moteur, et « à contrôler » est exactement le mot du lexique tranché pour un constat
établi. Rien à réécrire.

Deux réserves de niveau typographique, à traiter ou à ignorer :
- collision sonore « à contrôler **à** Toulouse » (deux `à` en trois mots). Variante : « À Toulouse, le
  premier point à contrôler : la chaleur estivale. » (63 car.). Coût : elle sort de la famille
  « commune en tête de phrase comme sujet », elle la met en complément. Je penche pour **garder
  l'actuelle** : la collision est réelle mais faible, et l'unité de famille vaut plus.
- « le retrait-gonflement des argiles » arrive parfois comme sujet (87 car. aux Sables-d'Olonne) : c'est
  un terme du glossaire à traduire (`doctrine/editoriale.md`). En héros, on ne peut pas le gloser sans
  exploser la mesure. La carte, plus bas, le fait. **Acceptable, mais c'est une dette** : voir §6.

---

### 1.6 Réserves mineures avec favorable : À RETOUCHER

**Textes actuels** :
> HÉROS  Toulouse semble bien correspondre à votre projet, sous réserve. (63)
> DÉTAIL 2 constats restent à contrôler. (31)
> STRATE Deux points demandent votre attention : la chaleur estivale et l'exposition au bruit.

« sous réserve » est un mot d'acte notarié, et il **pré-annonce le détail** qui dit exactement ça deux
lignes plus bas. Puis la strate redit le même compte, avec un autre nom (« constats » → « points ») et
la même matière. Trois niveaux, une seule information : c'est du **texte de trop**.

**Réécriture proposée** :
```
HÉROS  Toulouse semble bien correspondre à votre projet.                 (49)
DÉTAIL Deux constats restent à contrôler avant de conclure.
STRATE À regarder d'abord : la chaleur estivale et l'exposition au bruit. (voir §4)
```
Trois fonctions, trois contenus, zéro recouvrement : c'est le principe directeur du spec, appliqué.
Le héros ne surpromet pas (« semble », et `hasFavorable` + `coverage === "high"` le prouvent) ;
le détail porte la réserve ; la strate porte les noms.

---

### 1.7 Réserves majeures, couverture élevée : À RÉÉCRIRE (défaut le plus grossier)

**Textes réellement produits** :
> HÉROS  2 points structurants empêchent de conclure nettement à Toulouse. (65)
> DÉTAIL Toulouse répond à plusieurs dimensions de votre projet, mais 2 points structurants empêchent encore de conclure nettement.

**Le détail recopie le héros mot pour mot** (« 2 points structurants empêchent … de conclure
nettement »), à un adverbe près. L'invariant du spec (« le détail n'est jamais une version tronquée du
verdict ») est violé ici, et nulle part ailleurs aussi littéralement.

Trois autres fautes :
- **« structurants »** est le nom d'un `materialityTier`. Le tier est une décision interne de
  matérialité ; le lecteur ne peut ni l'expliquer ni l'opposer. C'est de la tuyauterie affichée en
  32 px, au même titre que le « 72/100 » que le Lot A retire des pastilles.
- **« empêchent de conclure »** met l'incapacité du côté de futur•e alors que la couverture est
  *élevée* : les données sont là. Ce n'est pas notre lecture qui bute, c'est la situation qui est
  mitigée. La doctrine n'autorise l'effacement de futur•e que quand l'objet de la phrase **est** notre
  incapacité (donnée manquante). Ce n'est pas le cas ici.
- **le héros commence par un chiffre** (« 2 points… ») alors que la branche arbitrage écrit « Deux ».
  Deux registres typographiques dans le même bloc.

**Réécriture proposée** :
```
HÉROS   `${capitalize(compteEnLettres)} points restent à contrôler avant de conclure ${a}.`   (61)
        `Un point reste à contrôler avant de conclure ${a}.`
DÉTAIL  favorable >= 2 : `${nom} répond bien à plusieurs de vos priorités. Ces contrôles portent sur des points qui pèsent.`
        favorable == 1 : `${nom} présente un élément favorable pour votre projet. Ces contrôles portent sur des points qui pèsent.`
        aucun favorable : `Tant que ces points ne sont pas levés, rien ne permet de dire que ${nom} correspond à votre projet.`
```
« qui pèsent » traduit `structuring` sans le jargon ; « rien ne permet de dire » garde l'honnêteté
épistémique sans faire de futur•e le sujet.

---

### 1.8 Réserves majeures, couverture partielle : BUG DE LANGUE, à corriger

**Texte réellement produit** :
> DÉTAIL La lecture reste incomplète et 2 points structurants demandent attention.

`points(n, "structurant", "demande")` produit « demandent » et la chaîne ajoute « attention » : il
manque le déterminant. **« demandent attention » n'est pas français** (« demandent votre attention »,
« demandent de l'attention »). C'est le genre de faute qui, dans le plus grand bloc de la page, détruit
la confiance que tout le reste construit, exactement comme le « 1 points structurants » que le
commentaire du code prend soin d'éviter deux lignes plus haut.

**Correctif** : `La lecture reste incomplète, et deux points demandent votre attention.`
(et suppression de « structurants », voir 1.7).

Héros de cette branche : « Il est encore trop tôt pour dire que Toulouse correspond à votre projet. »
(72), **dans la voix**, rien à changer. C'est une des phrases les plus justes du lot : elle refuse de
trancher sans blâmer personne.

---

### 1.9 Couverture nulle : À RETOUCHER

> HÉROS  Toulouse ne peut pas encore être évalué au regard de vos critères. (66)

Deux problèmes : **l'accord** (« Toulouse … évalué » : les noms de communes en français prennent
généralement l'accord féminin en usage courant ; la formule est instable d'une commune à l'autre et on
ne peut pas dériver le genre), et **« être évalué »**, qui fait du lieu l'objet d'une évaluation, mot
que le positionnement récuse (on n'attribue pas de note).

**Réécriture proposée** (53 car.) :
> Vos critères n'ont pas encore pu être lus à Toulouse.

Le sujet devient les critères du lecteur, l'accord disparaît, et « lus » est le verbe honnête (on lit
des données, on n'évalue pas une ville). Détail, en gardant l'existant à peine resserré : « Les données
qui permettraient de répondre manquent encore pour cette commune. »

---

### 1.10 Favorable, couverture partielle : À RETOUCHER

> HÉROS Le Havre va dans le sens de votre projet sur les critères déjà couverts. (72)

« les critères déjà couverts » est du vocabulaire de couverture (product), et il **finit** la phrase,
donc il reçoit l'accent. Inversion proposée (71 car.) :
> Sur ce qui a pu être regardé, Le Havre va dans le sens de votre projet.

La restriction passe en tête (position honnête, elle qualifie tout ce qui suit) et la phrase se termine
sur le lecteur. Détail inchangé, il est bon.

### 1.11 Favorable, couverture élevée / couverture insuffisante / projet non structuré : DANS LA VOIX

- « Le Havre semble bien correspondre à votre projet. » : juste, sobre, hedgé par « semble ». Garder.
- « Des éléments essentiels manquent encore pour trancher à Toulouse. » : c'est le cas où l'objet **est**
  notre incapacité ; l'effacement est légitime. Garder. Le détail (« Une donnée déterminante manque
  encore pour conclure sur Toulouse ») dit presque la même chose au singulier : je le remplacerais par
  ce qu'il manque *pour le lecteur* si la clé est connue, sinon **le supprimer** (il n'ajoute rien).
- « Décrivez votre projet pour mettre Toulouse en regard de ce qui compte pour vous. » : la seule
  branche à l'impératif, et c'est justifié (c'est une invite). Garder.

---

## 2. LE DÉTAIL

### 2.1 Détail d'arbitrage nommé : À RÉÉCRIRE

**Texte actuel** (251 car.) :
> Toulouse répond à plusieurs dimensions de votre projet, et aucune incompatibilité n'a été établie. Ces écarts appellent un arbitrage entre vos priorités, sans rendre Toulouse incompatible avec votre projet. 4 constats restent par ailleurs à contrôler.

Le porteur a raison sur les deux points, et il y en a un troisième :

1. **« Toulouse » deux fois**, à 20 mots d'intervalle.
2. **La même idée deux fois** : « aucune incompatibilité n'a été établie » puis « sans rendre Toulouse
   incompatible avec votre projet ». Deux formulations de la même absence, dans deux phrases
   consécutives. La seconde est du **texte de trop** : à supprimer, pas à reformuler.
3. **« dimensions de votre projet »** : le lecteur a des priorités, pas des dimensions. « dimension »
   est le mot de la matrice interne (27 dimensions du Pack).

251 caractères en 17 px sous un héros, cela fait 3 à 4 lignes qui **ré-instaurent le paragraphe** que la
refonte a supprimé. Le détail doit tenir en 2 lignes.

**Réécriture proposée** (branche `named`) :
```
favorable >= 2  `${nom} répond bien à plusieurs de vos autres priorités. Ces écarts sont à peser contre ce que vous y gagnez.${suite}`
favorable == 1  `${nom} répond bien à une autre de vos priorités. Ces écarts sont à peser contre ce que vous y gagnez.${suite}`
aucun favorable `Aucune de vos conditions n'est contredite ici. Ces écarts sont à peser avant de vous décider.${suite}`
suite           ` Quatre constats restent par ailleurs à contrôler.` / ` Un constat reste par ailleurs à contrôler.`
```
Rendu complet, cas courant, 174 car. au lieu de 251 :
> Toulouse répond bien à plusieurs de vos autres priorités. Ces écarts sont à peser contre ce que vous y gagnez. Quatre constats restent par ailleurs à contrôler.

Ce que ça gagne : « **vos autres priorités** » dit explicitement que le favorable et l'écart ne portent
pas sur les mêmes choses (l'arbitrage devient lisible) ; « **à peser contre ce que vous y gagnez** »
nomme les **deux côtés** de l'arbitrage, ce que le texte actuel promettait en commentaire sans le faire
en prose ; le verbe qui décide reste au lecteur (invariant n°1) ; « y » évite la seconde occurrence du
nom **et** l'accord de genre.

**Chiffres en lettres.** « 4 constats » cohabite avec « Deux priorités » du héros. Écrire les nombres en
lettres jusqu'à dix dans le héros **et** le détail (`numberForms` fournit déjà les deux formes ;
`allowedNumbers` accepte les deux, donc aucun risque de validation).

### 2.2 Détail d'arbitrage en posture : À RÉÉCRIRE

**Texte actuel** (239 car.) :
> Aucune incompatibilité n'a été établie au Kremlin-Bicêtre, mais 2 de vos priorités sont nettement moins bien servies qu'ailleurs. Cela appelle un arbitrage entre vos priorités, sans rendre Le Kremlin-Bicêtre incompatible avec votre projet.

Mêmes défauts, en pire : commune deux fois, non-incompatibilité deux fois, et **aucun nom d'enjeu**
alors que c'est précisément la branche où le héros y a renoncé.

**Réécriture proposée** : le détail **reprend le travail de nommage** que le héros a lâché.
```
`Le calme, l'accès aux espaces naturels et l'accès aux collèges et lycées sont moins bien servis ici qu'ailleurs. Ces écarts sont à peser avant de vous décider.${suite}`
```
soit, en gabarit : `${capitalize(joinFr(sujets))} sont moins bien servis ici qu'ailleurs. Ces écarts
sont à peser avant de vous décider.${suite}` (avec `est moins bien servi` au singulier, cas
inatteignable ici mais à câbler proprement).

Note d'accord : `servis` au masculin pluriel est correct dès qu'il y a un sujet masculin ; pour une
liste entièrement féminine (« la vie locale et la proximité de la mer »), l'accord juste est
« servies ». Deux moyens honnêtes : soit un gabarit sans accord (« Ces priorités sont moins bien
servies ici qu'ailleurs : … » suivi de la liste), soit porter le genre dans la table des sujets. **Je
recommande le gabarit sans accord** : `Ces priorités sont moins bien servies ici qu'ailleurs : le
calme, l'accès aux espaces naturels et l'accès aux collèges et lycées. Ces écarts sont à peser avant
de vous décider.` Zéro accord à dériver, et la liste tombe encore en fin de phrase.

### 2.3 Les autres détails

| Branche | Verdict | Action |
|---|---|---|
| incompatibilité (« La gare la plus proche est à 42 km. ») | DANS LA VOIX | garder tel quel |
| réserve dominante (« La correspondance de Toulouse avec votre projet reste à confirmer. Ce point fait partie de 3 constats à contrôler. ») | À RETOUCHER | « correspondance » nominalisée ; proposer : « Rien ne permet encore de dire que Toulouse correspond à votre projet. Ce point fait partie de trois constats à contrôler. » |
| réserves mineures + favorable (« 2 constats restent à contrôler. ») | À RETOUCHER | « Deux constats restent à contrôler avant de conclure. » |
| neutral (« Vos priorités ont pu être examinées sur ces dimensions. Aucun écart notable n'apparaît, ni avantage net. ») | À RETOUCHER | « dimensions » à bannir. Proposer : « Vos priorités ont toutes pu être examinées ici. Aucun écart marqué n'apparaît, aucun avantage net non plus. » |
| favorable high (« Les critères de votre projet qui ont pu être examinés vont dans ce sens. ») | DANS LA VOIX | garder |
| couverture insuffisante | À SUPPRIMER (voir 1.11) | il redit le héros au singulier |

---

## 3. LES SUJETS PAR CRITÈRE (le mot qui se lit après le deux-points)

Règle appliquée : **nommer la priorité du lecteur** (celle qu'il a cochée, dont le libellé exact vit
dans `PREFERENCE_LABELS`, `src/lib/comparateur-labels.ts`), **jamais l'indicateur défavorable, jamais
la mesure**. Second garde-fou : ne pas promettre une grandeur que le calcul ne contient pas
(`doctrine/editoriale.md`, « on ne raconte que ce qu'on mesure exactement »).

| clé | sujet actuel | ce que le lecteur a coché | verdict | sujet proposé |
|---|---|---|---|---|
| `cadre_calme` | le calme | un cadre calme | **garder** | le calme |
| `proximite_mer` | la proximité de la mer | la proximité de la mer | **garder** | la proximité de la mer |
| `acces_soins` | l'accès aux soins | un bon accès aux soins | **garder** | l'accès aux soins |
| `acces_transports` | l'accès au train | l'accès au train et aux gares | **garder** | l'accès au train |
| `acces_ecoles` | l'accès aux collèges et lycées | idem | **garder** | l'accès aux collèges et lycées |
| `nature` | l'accès aux espaces naturels | des espaces naturels à proximité | **garder** | l'accès aux espaces naturels |
| `douceur_climat` | la douceur des hivers | des hivers doux | **garder** | la douceur des hivers |
| `ensoleillement_recherche` | l'ensoleillement | un climat plus ensoleillé | **garder** | l'ensoleillement |
| `faible_dependance_auto` | la faible dépendance à la voiture | une faible dépendance à la voiture | **retoucher** | la possibilité de se passer de la voiture |
| `vie_etudiante` | l'environnement étudiant | une ville étudiante | **garder, avec réserve** | l'environnement étudiant |
| `mobilite_quotidienne` | les transports du quotidien | les transports en commun du quotidien | **retoucher** | les transports en commun du quotidien |
| `acces_culture` | l'accès à la culture | l'accès à une offre culturelle | **retoucher** | l'accès à l'offre culturelle |
| `acces_services` | les services du quotidien | des services du quotidien accessibles | **retoucher** | l'accès aux services du quotidien |
| `viabilite_emploi` | le bassin d'emploi | un bassin d'emploi dynamique | **retoucher** | le dynamisme du bassin d'emploi |
| `vie_locale` | la vie locale | une vie locale animée | **retoucher** | une vie locale animée |
| `croissance_demographique` | la trajectoire démographique | un territoire qui gagne des habitants | **réécrire** | un territoire qui gagne des habitants |
| `eviter_grandes_villes` | la taille de la ville | une ville à taille humaine | **réécrire** | une ville à taille humaine |
| `prefere_grande_ville` | la taille de la ville | une grande ville | **réécrire** | une grande ville |
| `eviter_isolement` | la taille du bassin de vie | ne pas être isolé | **réécrire** | le fait de ne pas être isolé |

**Les trois qui gênaient le porteur, argumentés.**

- **« la taille de la ville » (× 2)** : c'est le défaut le plus net de la table, parce qu'il est
  **double**. (a) C'est la mesure (catégorie d'agglomération), pas la priorité. (b) Surtout : **deux
  priorités opposées produisent le même mot**. Le lecteur qui veut fuir la grande ville et celui qui la
  cherche lisent exactement la même phrase, et aucun des deux ne se reconnaît. Les libellés du wizard
  existent déjà et sont bons : « une ville à taille humaine » (26 car.) et « une grande ville » (16
  car.). Test dans le gabarit : « Rodez répond moins bien à une de vos priorités : une grande ville. »
  (66 car.) et « Toulouse répond moins bien à une de vos priorités : une ville à taille humaine. »
  (79 car.). Les deux passent, et les deux disent enfin ce que le lecteur a demandé.
- **« la taille du bassin de vie »** (`eviter_isolement`) : « bassin de vie » est un terme INSEE que
  personne ne prononce, et la règle elle-même reconnaît dans sa `limitation` que la catégorie de taille
  « ne décrit pas à elle seule l'accès aux services, aux transports ou aux pôles voisins ». Donc on ne
  peut PAS écrire « les services alentour » (on promettrait ce qu'on ne mesure pas). Le seul sujet à la
  fois honnête et lisible est la priorité brute : **« le fait de ne pas être isolé »** (28 car.).
  Lourdeur assumée : « ne pas être isolé » est ce que le lecteur a coché, mot pour mot.
- **« les services du quotidien »** : moins grave, mais c'est le seul sujet de la table qui nomme un
  **objet** au lieu d'une **relation à l'objet** ; or ce qui est mesuré est bien l'accès (rayon BPE
  pondéré), pas les services. `topic` dit déjà « l'accès aux services du quotidien » : aligner le
  `subject` dessus (33 car., passe la gate en duo : 99 car. avec « le calme »).

**Deux autres à changer, hors liste du porteur** :

- **`croissance_demographique` → « la trajectoire démographique »** : c'est **l'indicateur neutre**, et
  une trajectoire peut monter comme descendre. Le lecteur a coché « un territoire qui gagne des
  habitants ». Le sujet doit dire ça. Attention à ne pas dériver vers « l'arrivée de nouveaux
  habitants » : la mesure est le solde de population 2015-2021 (naturel + migratoire), pas les arrivées.
  Ce serait raconter plus que ce qu'on mesure.
- **`faible_dependance_auto` → « la faible dépendance à la voiture »** : la règle actuelle est
  correcte sur le fond (elle nomme bien la priorité), mais la phrase produite empile deux valeurs
  négatives : « Toulouse répond moins bien à une de vos priorités : la faible dépendance à la
  voiture. » Le lecteur doit inverser deux fois. « la possibilité de se passer de la voiture » (41 car.)
  dit la même chose en positif, et c'est déjà la formulation du champ `indicator`.

**Réserve sur `vie_etudiante`** : « l'environnement étudiant » nomme bien la priorité, mais la mesure
est la présence d'établissements du supérieur dans un rayon, et la `limitation` de la règle avertit
qu'on ne peut pas conclure à l'absence de vie étudiante. Le héros dit « répond moins bien », pas
« il n'y a pas de vie étudiante » : c'est tenable. Je le garde, en notant que c'est le sujet le plus
tendu de la table vis-à-vis de l'invariant n°5.

**Et les 11 sujets manquants** : les contraintes dures n'ont pas de `subject` du tout (voir 1.4). Ce
n'est pas un critère à retoucher, c'est une case vide. Solution sans nouvelle table :
`hardConstraintLabel(project, key)`.

### 3.1 Le sujet de la composition `shared_evidence` (le 19e sujet)

`fact-compositions.ts:128` porte `headlineSubject: "la taille du territoire"` pour le patron
« une même petite taille touche plusieurs priorités » (`prefere_grande_ville` + `eviter_isolement`,
catégorie village). Rendu réel dans le héros : « Deux priorités correspondent moins bien à Gueret,
**dont la taille du territoire**. »

**C'est une erreur de catégorie, pas seulement un mot tiède.** « la taille du territoire » n'est pas
une priorité du lecteur : c'est **la cause commune** qui en dessert deux. Le gabarit « dont X » la
présente comme l'une d'elles. Le lecteur qui a coché « une grande ville » et « ne pas être isolé » lit
un troisième mot qu'il n'a jamais écrit, et perd les deux siens.

Or c'est exactement ce que la composition existe pour dire : une raison, deux conséquences. Le héros
peut le dire (88 car.) :

> Rodez répond moins bien à deux de vos priorités, pour la même raison : sa petite taille.

Gabarit : `${nom} répond moins bien à ${compte} de vos priorités, pour la même raison : ${cause}.`
avec `cause = "sa petite taille"` (le `headlineSubject` de la composition devient la CAUSE nommée
comme telle, pas un pseudo-critère).

Deux autres textes du même patron, dans la même veine :
- `title` : « Une même petite taille touche plusieurs **dimensions** de votre projet » : « dimensions »
  est le mot de la matrice interne. Proposer : « Une même petite taille joue sur plusieurs de vos
  priorités » (58 car.).
- `summary` : « **La catégorie de taille** de Rodez répond moins bien à deux de vos priorités, pour la
  même raison. » : « la catégorie de taille » est la classification interne, et « pour la même raison »
  n'a plus d'antécédent une fois la cause devenue sujet. Proposer : « La petite taille de Rodez dessert
  deux de vos priorités à la fois : une grande ville et le fait de ne pas être isolé. »

### 3.2 Les titres de composition entrent en héros avec une majuscule au milieu de la phrase

Testé sur le code, pas déduit. Quand une composition `tradeoff` ou `grouped_verification` domine les
réserves, `rankLeadCandidates` prend son `title` comme `subject`, et le héros rend :

> [101] Le principal point à contrôler à Toulouse : Des hivers doux, avec une exposition estivale à arbitrer.
> [87] Le principal point à contrôler à Toulouse : Un sol argileux, et la règle qui l'encadre.

Et la strate rend la même chose (« À regarder ensuite : Un sol argileux, et la règle qui l'encadre. »).

Trois fautes, dont deux graves :

1. **Une majuscule au milieu d'une phrase.** Les `title` sont écrits pour coiffer une carte, donc
   capitalisés ; les `subject` sont écrits pour se lire après un deux-points, donc en bas de casse. Le
   code prend les uns pour les autres. C'est le défaut exact que le commentaire de `reserves_found`
   prend soin d'éviter pour les `statement` (« Un point pèse plus que les autres : Le logement porte… »),
   non traité pour les titres.
2. **Un titre de tradeoff n'est pas un sujet.** « Des hivers doux, avec une exposition estivale à
   arbitrer » annonce **les deux côtés** d'un compromis. Présenté comme « le principal point à
   contrôler », il fait des hivers doux un problème. C'est un contresens sur le seul patron qui sert à
   dire qu'un lieu donne et prend à la fois.
3. **Une virgule et une subordonnée dans un héros** : la mesure de 540 px reçoit une demi-phrase de
   carte, pas un signal.

**Correctif proposé** : donner un `headlineSubject` court et en bas de casse aux deux patrons, comme
`shared_evidence` en a déjà un.

| patron | `title` (inchangé, il coiffe la carte) | `headlineSubject` proposé |
|---|---|---|
| `tradeoff` climat `:63` | Des hivers doux, avec une exposition estivale à arbitrer | l'exposition aux fortes chaleurs |
| `grouped_verification` argiles + PPR `:175` | Un sol argileux, et la règle qui l'encadre | le sol argileux et ce qu'il impose |
| `shared_evidence` taille `:128` | Une même petite taille joue sur plusieurs de vos priorités | sa petite taille (voir §3.1) |

Rendus : « Le principal point à contrôler à Toulouse : l'exposition aux fortes chaleurs. » (76 car.) et
« Le principal point à contrôler à Toulouse : le sol argileux et ce qu'il impose. » (79 car.). Les deux
passent la gate avec de la marge, et la strate hérite du même sujet propre.

---

## 4. LA STRATE DE POIDS

Quatre moules coexistent aujourd'hui :

```
A  suite, single   « À regarder ensuite : le retrait-gonflement des argiles. »
B  suite, tied     « À regarder ensuite : le retrait-gonflement des argiles et l'exposition au bruit. »
C  hors suite, single « Un point pèse plus que les autres. Le logement porte … (statement entier) »
D  hors suite, tied   « Parmi ces quatre points, deux pèsent le plus : l'inondation et le retrait-gonflement des argiles. »
    ou               « Deux points demandent votre attention : la chaleur estivale et l'exposition au bruit. »
```

**A et B sont justes.** Courts, séquentiels, aucun mot de moteur, et « ensuite » installe une
progression au lieu d'un classement. C'est le bon moule.

**C et D sont à supprimer**, pour trois raisons :

1. **D fait de l'arithmétique sur sa propre liste.** « Parmi ces quatre points, deux pèsent le plus »
   demande au lecteur de tenir deux comptes en tête pour lui dire… quoi regarder d'abord. Et le compte
   est **déjà dit deux fois autour** : par le détail (« 4 constats restent à contrôler ») et par
   l'intertitre des cartes (« Les 4 points à examiner avant de décider »). Trois occurrences du même
   nombre dans un écran d'une minute.
2. **Dérive de vocabulaire** : le détail dit « constats », la strate dit « points », les cartes disent
   « points ». Trois mots pour deux choses, dans 200 pixels de haut.
3. **C recopie le `statement` entier**, c'est-à-dire exactement la phrase que la carte affiche trois
   centimètres plus bas. C'est le défaut que le commentaire de `selectResidualLead` interdit
   explicitement pour les sujets, toléré ici pour les constats.

**Proposition : un seul moule, deux variantes d'ordre.**
```
suiteDuHeros === true   `À regarder ensuite : ${sujets}.`
suiteDuHeros === false  `À regarder d'abord : ${sujets}.`
```
`${sujets}` = `joinFr(topics)` dans les deux cas (`single` inclus : le `topic`, jamais le `statement`).

Ce que ça donne, cas « posture + 2 dominants sur 4 » :
```
HÉROS  Toulouse semble bien correspondre à votre projet.
DÉTAIL Quatre constats restent à contrôler avant de conclure.
STRATE À regarder d'abord : l'inondation et le retrait-gonflement des argiles.
```
Le compte est dit une fois (détail), l'ordre est dit une fois (strate), les noms sont dits une fois
(strate), les preuves sont dites une fois (cartes). Quatre niveaux, zéro recouvrement.

Conséquence technique que je signale sans la trancher : `allowedNumbers` de `reserves_found` devient
`[]` dans tous les cas (la strate ne porte plus de nombre), ce qui **resserre** la validation du modèle
au lieu de la relâcher. `requiredPhrases` (les `coreLabel(topic)`) reste inchangé, et reste
indispensable.

**Le mot « d'abord » plutôt que « en premier »** : « d'abord » installe une suite sans promettre
d'exhaustivité, ce que « le plus important » ferait à tort (le résiduel n'est jamais exhaustif, dit le
spec).

---

## 5. LES LIBELLÉS D'ACTION DU LOT A2

### 5.0 Une erreur d'attribution dans le spec, à corriger avant d'implémenter

Le spec propose pour `materiality-rules.ts:342` : label « Vérifiez l'exposition du logement **au bruit
routier** ». **Ce fait n'est pas le bruit.** C'est la règle `RULE_AIR` (`:332-343`) : son `statement`
parle de dioxyde d'azote et de particules fines, son `evidence` est `viv.pm25`, sa `limitation` explique
que le NO2 chute de moitié à quelques dizaines de mètres d'un axe. Coller « bruit routier » sur une
carte qui affiche « AIR · PM2,5 12,4 µg/m³ » casserait le couplage étiquette/mesure, c'est-à-dire
exactement la règle « on ne raconte que ce qu'on mesure exactement ». Le `detail` proposé, lui, est
juste. Corriger le `label`.

### 5.1 Les sept réécritures du spec, relues

| Règle | `label` du spec | verdict | `label` proposé (car.) | `detail` proposé |
|---|---|---|---|---|
| air / axes routiers `:342` | Vérifiez l'exposition du logement au bruit routier | **faux sujet** | Situez le logement par rapport aux axes passants (47) | Repérez la distance aux voies passantes et la façade sur laquelle donnent les chambres. |
| feux `:252` | Vérifiez la protection du terrain face au feu | retoucher | Regardez la végétation autour du terrain (40) | Renseignez-vous sur l'obligation de débroussaillement, l'accès des secours et les matériaux de la toiture. |
| confort d'été `:221` | Vérifiez le confort d'été du logement | retoucher | Regardez comment le logement tient l'été (40) | L'orientation, l'étage, l'épaisseur des murs, les protections solaires et la possibilité d'ouvrir la nuit pèsent sur l'inconfort ressenti. |
| ruissellement `:284` | Vérifiez l'exposition de l'adresse au ruissellement | retoucher | Regardez où va l'eau autour de l'adresse (40) | Pente du terrain, présence d'un sous-sol, réseaux d'évacuation, historique des dégâts des eaux. |
| bruit `:378` | Écoutez le bruit sur place | **garder** | Écoutez sur place, à plusieurs heures (37) | La carte de bruit de la commune donne le fond ; le reste s'entend depuis le logement, fenêtres ouvertes. |
| bâti / argiles, achat | Vérifiez l'historique du bâti | retoucher | Demandez l'historique des fissures et des sinistres (50) | Faites contrôler les fondations si un doute subsiste. |
| patrimoine, achat | Vérifiez les règles applicables aux travaux extérieurs | retoucher | Demandez en mairie ce que le périmètre autorise (46) | Façade, menuiseries, toiture : les travaux visibles peuvent demander un accord, avec l'avis de l'Architecte des Bâtiments de France. |

**Pourquoi je change six labels sur sept alors que le principe du spec est bon.** Cinq des sept
commencent par « Vérifiez ». Deux conséquences :

1. **Rythme.** Empilées sur une colonne de cartes, cinq phrases qui commencent par le même verbe se
   lisent comme un formulaire. La face d'une carte n'a qu'une ligne d'action : c'est là que la voix se
   joue, et elle s'aplatit.
2. **Lexique.** Vous venez de trancher : « un constat établi est **à contrôler**, une condition posée
   et non testée est **à vérifier** ». Or ces actions pendent toutes à des `VerificationFact`,
   c'est-à-dire à des **constats établis** au grain commune. « Vérifiez » y contredit le lexique que le
   dossier applique dix lignes plus haut. La sortie n'est pas de basculer sur « Contrôlez » partout (ce
   serait le même aplatissement) : c'est de **nommer le geste réel**, qui est différent à chaque fois.
   Regardez / Demandez / Consultez / Écoutez / Faites chiffrer / Situez. Chaque verbe dit ce que la
   personne va effectivement faire, et le lexique cesse d'être en tension.

**Deux points du spec que je confirme et que je vous demande de ne pas rouvrir** : le refus de
« Évaluez le bruit **réel** » (qualifier de réel ce que le lecteur constatera dit que la mesure affichée
ne l'est pas), et le refus de la troncature à l'ellipse. Les deux sont des jugements éditoriaux justes.

**Deux libellés non listés par le spec, à traiter dans la même passe** :
- `:407` (exposition industrielle), 117 car., dépasse la garde des 70 :
  label « Consultez l'état des risques applicable à l'adresse » (51) ;
  detail « Le plan de prévention des risques technologiques, s'il existe, précise ce qui s'applique
  autour du site (Géorisques). »
- `:222` « Renseignez une adresse pour évaluer le confort d'été du logement » : c'est la seule action
  qui demande une manœuvre **dans le produit** plutôt que dans le monde. Elle est honnête et utile, je
  la garde, mais elle mérite un ton d'invitation : « Renseignez votre adresse pour descendre au niveau
  du logement » (58).

### 5.2 Les 23 variantes posture-aware du module Logement

(6 tables × 4 postures, moins `patrimoine/location` que la règle exclut : 23, pas 24.)
Toutes les `label` sans point final, ≤ 70 caractères.

**`batiAction`, retrait-gonflement des argiles, au grain adresse**

| posture | `label` | `detail` |
|---|---|---|
| achat | Demandez l'historique des fissures et des sinistres | Faites contrôler les fondations si un doute subsiste. |
| location | Signalez les fissures apparentes au bailleur | Photographiez ce qui est visible et signalez-le par écrit. |
| réside | Suivez les fissures dans le temps | Photographiez-les avec une date, et comparez d'une saison à l'autre. |
| neutre | Regardez les signes visibles sur le bâti | Fissures en escalier sur les façades, portes ou fenêtres qui coincent, sol qui se déforme. |

**`pprnAction`, un plan de prévention des risques s'applique**

| posture | `label` | `detail` |
|---|---|---|
| achat | Consultez le règlement de la zone en mairie | Il fixe ce qui est autorisé en cas de travaux ou d'extension, et ce qu'il impose au bâti existant. |
| location | Demandez au bailleur les prescriptions qui s'appliquent | L'état des risques remis à la signature indique le zonage et ce qu'il impose au logement. |
| réside | Lisez le règlement avant une extension | Une rénovation lourde peut être conditionnée par le zonage. |
| neutre | Lisez le règlement de la zone en mairie | Il dit ce que le zonage autorise, interdit ou impose à cette adresse. |

**`caviteAction`, cavités souterraines recensées à moins de 500 m**

| posture | `label` | `detail` |
|---|---|---|
| achat | Faites examiner la stabilité du sol avant de vous engager | Le recensement porte sur des ouvrages connus alentour, pas sous ce logement : seul un avis technique tranche. |
| location | Signalez tout affaissement au bailleur | Un affaissement du terrain ou une fissure nouvelle se signale par écrit. |
| réside | Surveillez les signes d'affaissement | Affaissement du terrain, fissures nouvelles, portes qui se bloquent : notez la date. |
| neutre | Renseignez-vous sur les cavités recensées | La mairie et Géorisques indiquent les cavités connues et le suivi dont elles font l'objet. |

**`patrimoineAction`, périmètre patrimonial protégé** (pas de variante location)

| posture | `label` | `detail` |
|---|---|---|
| achat | Demandez en mairie ce que le périmètre autorise | Façade, menuiseries, toiture : les travaux visibles peuvent demander un accord, avec l'avis de l'Architecte des Bâtiments de France. |
| réside | Vérifiez en mairie avant des travaux extérieurs | Le périmètre encadre ce qui se voit depuis l'espace public. |
| neutre | Renseignez-vous sur ce que le périmètre autorise | Il encadre les travaux visibles depuis l'espace public : façade, menuiseries, toiture. |

**`siniAction`, indemnisations recensées sur la commune**

| posture | `label` | `detail` |
|---|---|---|
| achat | Demandez l'état des risques et les sinistres déjà indemnisés | Le vendeur indique les sinistres indemnisés au titre d'une catastrophe naturelle pendant qu'il occupait le bien. |
| location | Demandez au bailleur l'état des risques | Il est remis à la signature. Signalez sans tarder tout sinistre survenu pendant le bail. |
| réside | Renseignez-vous sur les indemnisations déjà versées | Les arrêtés de catastrophe naturelle pris sur la commune disent quels épisodes ont donné lieu à indemnisation. |
| neutre | Consultez l'état des risques de la commune | Il récapitule les arrêtés de catastrophe naturelle et les zonages qui s'appliquent. |

**Action DPE** (`ruleDpe`)

| posture | `label` | `detail` |
|---|---|---|
| achat | Faites chiffrer les travaux d'amélioration | Demandez des devis avant de vous engager : isolation, chauffage, ventilation. |
| location | Demandez la date du diagnostic et les factures réelles | L'étiquette date d'un diagnostic ; les factures des derniers hivers disent ce que ça coûte vraiment. |
| réside | Gardez la trace des travaux déjà engagés | Devis et factures d'isolation ou de chauffage documentent l'écart avec l'étiquette affichée. |
| neutre | Regardez le détail du diagnostic et sa date | L'étiquette résume ; le détail dit d'où viennent les pertes. |

**Trois précautions à tenir dans cette table.**
- Aucun `detail` n'affirme un droit ou un délai précis (« le diagnostic vaut dix ans », « le délai de
  déclaration est de… »). Ce sont des affirmations juridiques non sourcées dans le produit : invariant
  n°3. Les formulations ci-dessus décrivent la pratique, jamais la règle de droit.
- Aucun `detail` ne promet un résultat (« un diagnostic lève le doute », « ces travaux augmenteront la
  valeur »). Invariant n°5.
- Aucune posture n'est culpabilisée : la variante `réside` ne dit jamais « vous auriez dû », elle
  documente.

---

## 6. Ce qui reste ouvert, et que je ne tranche pas

1. **Le glossaire non appliqué dans les sujets.** « le retrait-gonflement des argiles » est dans la
   table des termes à traduire de `doctrine/editoriale.md` (« mouvements des sols argileux qui peuvent
   fissurer les maisons »), et il apparaît **en héros** et **en strate**, sans glose, parce qu'aucune
   des deux mesures ne permet de le gloser. Trois sorties possibles, aucune évidente : (a) accepter que
   la carte glose (statu quo, dette assumée) ; (b) un `subject` court et traduit pour ce seul fait
   (« les sols argileux ») ; (c) une glose au survol. Je penche pour (b) mais c'est un arbitrage
   produit autant qu'éditorial.
2. **Les étiquettes du bandeau** (`verdictLabel`), qui vivent au contact du héros :
   « Correspondance sans signal marqué » (le mot « signal » est du moteur),
   « Lecture non disponible » et « Lecture encore partielle » (le lecteur ne sait pas ce qu'est une
   « lecture » chez vous). Propositions, si vous voulez les rouvrir : « Rien de marqué » / « Pas encore
   lisible » / « Lecture partielle ». Ce n'est pas dans votre demande ; je le pose, je ne le pousse pas.
3. **`posture` n'a aucun effet sur la copie du verdict.** Le plan porte `posture` (candidat / habitant)
   et aucune des onze branches ne s'en sert. Un habitant lit « Toulouse semble bien correspondre à
   votre projet » alors qu'il y vit. Hors périmètre de ce lot, mais c'est une tension de voix réelle,
   et elle grandira.

---

## 7. Mise à jour de doctrine proposée

Deux règles stabilisées par ce passage, prêtes à écrire dans `docs/vault/doctrine/editoriale.md` :

> **Le lieu répond au lecteur, jamais l'inverse.** Dans toute phrase qui met en regard un territoire et
> ce que le lecteur a demandé, le sujet grammatical est le lieu (ou le lecteur), et le verbe va du lieu
> vers la priorité : « Toulouse répond moins bien à deux de vos priorités ». Est banni le renversement
> qui fait de l'attente du lecteur la chose qui s'ajuste mal (« Deux priorités correspondent moins bien
> à Toulouse ») : il déplace sur le lecteur un défaut qui appartient au territoire.

> **On ne décrit jamais l'absence d'un problème.** « Sans incompatibilité établie », « aucune contrainte
> n'est contredite », « rien ne s'y oppose » demandent au lecteur de calculer une double négation pour
> obtenir une information qu'il n'a pas demandée. Ce qui n'a pas été constaté ne se dit pas ; ce qui
> compte, c'est ce que le lieu apporte et ce qu'il coûte. Corollaire du corollaire « on ne décrit jamais
> ce qu'on ne fait pas ».

Et une quatrième, tirée de §3.2 :

> **Un titre coiffe, un sujet se lit après un deux-points.** Tout objet nommable par la conclusion
> (fait, composition, contrainte) porte deux chaînes distinctes : un `title`/`topic` capitalisé pour la
> carte, et un `subject` en bas de casse, sans virgule ni subordonnée, pour la phrase du héros et la
> strate. Les confondre produit une majuscule au milieu d'une phrase et fait entrer une demi-phrase de
> carte dans un signal de 540 px.

Et une troisième, si vous adoptez §5.1 :

> **Un libellé d'action nomme le geste, pas la catégorie de vérification.** « Vérifiez X » répété d'une
> carte à l'autre transforme la colonne en formulaire et entre en collision avec le lexique du dossier
> (un constat établi est *à contrôler*, une condition posée est *à vérifier*). On écrit le geste réel :
> Regardez, Demandez, Consultez, Écoutez, Faites chiffrer, Situez.

---

## 8. La version minimale (~90 % de la valeur)

Si vous ne changez que trois choses, changez celles-ci :

1. **Le verbe et le sujet du héros d'arbitrage** : `Deux priorités correspondent moins bien à Toulouse :`
   → `Toulouse répond moins bien à deux de vos priorités :`. Un déplacement de mots, même longueur,
   même gate, et l'inversion logique disparaît sur la branche la plus fréquente.
2. **Le sujet de l'incompatibilité** : `inc.topic` → `hardConstraintLabel(project, key)`. Une ligne, et
   la branche la plus grave cesse de répéter le nom de la commune et de nommer un indicateur à la place
   de la condition posée.
3. **La deuxième phrase du détail d'arbitrage** : supprimer « , sans rendre {nom} incompatible avec
   votre projet ». Une suppression, et le détail perd sa redondance et 50 caractères.

Le reste (les 8 sujets à retoucher, les moules de strate, les 23 actions) est réel mais séquençable.

---

## 9. Quand rouvrir ce sujet

- **Si la gate de 110 fait basculer en posture plus de ~1 dossier sur 5.** Les phrases nommées sont
  toute la valeur du héros ; si la posture devient le cas courant, ce n'est plus la copie qu'il faut
  retoucher, c'est la gate (ou la longueur des `subject`). À instrumenter sur un échantillon réel de
  communes, pas sur les 5 cas de test.
- **Le jour où un fait favorable déterministe existe.** Toute la branche « favorable » est aujourd'hui
  en posture faute de matière ; le jour où un positif est prouvable, le héros doit pouvoir **nommer** ce
  qui va bien, et ma recommandation « ouvrir sur le lieu » devra être rejouée (« Toulouse répond bien à
  deux de vos priorités : … » devient possible et change l'équilibre du bloc).
- **Si le module `posture` (habitant) est branché sur le verdict.** Les onze branches sont écrites pour
  un candidat au départ ; pour un habitant, « correspondre à votre projet » n'a pas le même sens et
  plusieurs héros deviennent faux de ton.
- **Si un test utilisateur montre que « à contrôler » et « à vérifier » ne se distinguent pas.** Tout le
  lexique tranché repose sur cette distinction ; si elle ne s'entend pas chez le lecteur, elle ne mérite
  pas la complexité qu'elle impose au code et aux 23 libellés d'action.
- **À la première commune à nom long en production** (Saint-Rémy-de-Provence,
  Bagnères-de-Bigorre, Villeneuve-lès-Avignon) **avec deux sujets longs** : vérifier au navigateur que
  le héros reste à 2-3 lignes. Je n'ai pas ce rendu.

---

## 10. Limites de mon regard (ce run)

- **Je n'ai pas vu l'écran.** J'ai lu les chaînes et compté les caractères ; je n'ai pas vu comment
  « Toulouse répond moins bien à deux de vos priorités : le calme et l'accès aux espaces naturels. » se
  casse à 540 px en Instrument Serif. Un point de césure malheureux (un « : » en fin de ligne, un
  « l'accès » orphelin) peut défaire une phrase que je déclare bonne. Le Design Critic voit ça ; pas moi.
- **Je n'ai pas de statistique de fréquence des branches.** Je dis « la branche la plus fréquente » pour
  l'arbitrage par inférence (deux entrées de dossier, beaucoup de priorités déclarées), pas par mesure.
  Si en réalité 60 % des dossiers tombent en `minor_reserves`, ma hiérarchie de priorités est mal
  calibrée.
- **Je juge la justesse de la voix, pas l'effet sur la décision.** Je ne sais pas si « Toulouse répond
  moins bien à deux de vos priorités » fait scroller plus loin que « Deux priorités correspondent moins
  bien ». Aucun A/B ici, et je ne prétends pas le contraire.
- **Je n'ai pas lu le parcours complet.** Je n'ai pas ouvert `DossierDecisionSection.tsx` ni les cartes :
  je m'appuie sur les `statement` et `topic` du code métier. Si les cartes reformulent, mes verdicts de
  non-répétition entre héros, détail, strate et cartes sont partiels.
- **Sur les 23 libellés d'action, je n'ai pas vérifié le fond juridique** (ce que le vendeur doit
  légalement remettre, la validité d'un DPE). J'ai écrit des formulations qui **n'affirment pas** de
  règle de droit pour cette raison précise ; si vous voulez affirmer, il faut une source, et ce n'est
  pas moi qui la fournis.
- **Les compositions : je n'ai relu que les trois patrons existants** (§3.1, §3.2), et seulement leurs
  `title` / `headlineSubject` / `summary`. Je n'ai pas relu les `consequences` ni les `statement`
  absorbés, qui remontent en carte. Un quatrième patron ajouté demain retomberait dans le même piège de
  la majuscule si la règle n'est pas écrite dans la doctrine.
