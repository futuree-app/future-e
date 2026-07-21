# Rapport éditorial : cartes mismatch en série et carte chaleur (« En une minute »)

Agent : Editorial Writer. Date : 2026-07-17. Mission : le dossier Toulouse relu par un lecteur
fait ressortir deux proses mécaniques. Fichiers lus : `docs/vault/doctrine/editoriale.md`,
`docs/vault/principes/invariants.md`, `src/lib/decision/mismatch-facts.ts`,
`src/lib/decision/mismatch-rules.ts`, `src/lib/decision/materiality-rules.ts`,
`src/lib/decision/climat-facts.ts`, `src/lib/decision/fact-compositions.ts`,
`src/lib/decision/decision-assembler.ts`, `src/lib/decision/conclusion-prompt.ts`,
`src/components/report/DecisionFactRenderParts.tsx`,
`src/components/report/DossierDecisionSection.tsx`.

Contraintes système vérifiées dans le code : gabarits déterministes mot pour mot ; le rang vit
dans une bande `[low, high]` qui ne prétend jamais à une précision qu'elle n'a pas
(`mismatch-facts.ts` l.6-9) ; le tri des cartes est tier puis ordre d'insertion
(`decision-assembler.ts` l.40), donc la carte la plus nette peut arriver en second (cas Toulouse :
nature 20 % avant cadre_calme 5 %) ; la `limitation` est rendue sur la carte en ligne discrète
sous le constat (`DecisionFactRenderParts.tsx` l.51-58) et recopiée dans les compositions
(`fact-compositions.ts` l.78), mais ne nourrit pas la conclusion rédigée (card-only).

---

## 1. Les cartes mismatch en série

### Texte jugé

`src/lib/decision/mismatch-rules.ts` l.82 :

> « Vous avez placé {projectPhrase} parmi vos priorités. Sur {indicator}, {nom} se situe parmi
> {rankPhrase} les moins favorables de France. Cela répond moins bien à cette dimension de votre
> projet, sans rendre {nom} incompatible avec lui. »

Moment : section « Ce qui correspond moins bien » du dossier, juste après le verdict. Décision
servie : l'arbitrage entre priorités déclarées. Émotion visée : être pris au sérieux sans être
alarmé.

### Où le texte touche juste (à ne pas casser en réparant)

- **« Vous avez placé {projectPhrase} parmi vos priorités. »** C'est la preuve que la carte
  existe à cause du projet du lecteur, opposable à son geste dans le wizard. C'est ce qui
  distingue cette carte d'un contenu générique. À conserver en ouverture de la **première** carte.
- **« se situe parmi les {X} % de communes les moins favorables de France. »** Le percentile EST
  le constat, l'univers est nommé, le comparatif ne devient jamais un jugement absolu. C'est la
  doctrine du mismatch devenue phrase. Ne pas toucher un mot de ce segment.
- L'indicatif « se situe » pour une position mesurée : juste. Le constat est établi, il n'a pas
  à s'excuser au conditionnel.

### Ce qui trahit le ton

1. **Le moule répété à l'identique.** Deux cartes qui se suivent avec les trois mêmes phrases,
   au même tempo, dans le même ordre : le lecteur n'entend plus une voix, il voit un publipostage.
   La justesse de chaque phrase ne sauve pas la série (le rythme se juge au service de
   l'attention, pas phrase à phrase).
2. **La troisième phrase est une phrase de trop, trois fois.** « Cela répond moins bien à cette
   dimension de votre projet » (a) répète le titre de section affiché trois lignes plus haut
   (« Ce qui correspond moins bien »), (b) parle en « dimension de votre projet », abstraction
   administrative là où le lecteur a dit « un cadre calme », (c) est recopiée mot pour mot dans
   au moins cinq familles de règles (`mismatch-rules`, `absence-rules` l.42, `coast-rules` l.57,
   `agglomeration-rules` l.35-42) : c'est LA phrase que le lecteur apprend à sauter. Sa seconde
   moitié (« sans rendre {nom} incompatible ») porte en revanche une doctrine indispensable
   (mismatch ≠ incompatibilité) : elle se garde, sous une forme plus courte et dite moins souvent.
3. **La duplication interne quand projectPhrase = indicator.** Pour `acces_ecoles` les deux
   libellés sont identiques (`mismatch-facts.ts` l.62) : « Vous avez placé l'accès aux collèges
   et lycées parmi vos priorités. Sur l'accès aux collèges et lycées, … ». Marqueur de gabarit
   le plus visible de tous.
4. **La hiérarchie muette.** 5 % et 20 % sont affichés dans un cadre strictement identique alors
   que la donnée (les bandes) sait dire lequel des deux écarts est le plus net. Le dossier
   possède l'information et refuse de la raconter : c'est une donnée vraie laissée inerte
   (invariant n°4).

### Réécriture proposée (gabarits exacts, paramétrables)

**G1, carte seule ou première carte mismatch de la section** (et forme canonique du
`fact.statement`, voir la note d'architecture) :

> « Vous avez placé {projectPhrase} parmi vos priorités. Sur {indicator}, {nom} se situe parmi
> {rankPhrase} les moins favorables de France. Cet écart s'arbitre : il ne rend pas {nom}
> incompatible avec votre projet. »

Variante de clôture si « s'arbitre » paraît trop elliptique (arbitrage de ton que je pose sans
trancher ; « arbitrage » est déjà le vocabulaire du verdict et des compositions, je crois la
forme courte tenable) :

> « Cet écart appelle un arbitrage, il ne rend pas {nom} incompatible avec votre projet. »

**G2, cartes suivantes (k ≥ 2), avec narration de la hiérarchie.** La comparaison n'est émise
que si les bandes ne se chevauchent pas (doctrine des ex æquo : la bande ne prétend jamais à
une précision qu'un score arrondi n'a pas) :

- écart plus net que la carte précédente (`band_k.high <= band_prec.low`) :
  > « Vous avez aussi placé {projectPhrase} parmi vos priorités, et l'écart est ici plus net :
  > sur {indicator}, {nom} se situe parmi {rankPhrase} les moins favorables de France. »
- écart moins marqué (`band_k.low >= band_prec.high`) :
  > « Vous avez aussi placé {projectPhrase} parmi vos priorités. L'écart est ici moins marqué :
  > sur {indicator}, {nom} se situe parmi {rankPhrase} les moins favorables de France. »
- bandes chevauchantes ou même palier (aucune hiérarchie opposable) :
  > « Vous avez aussi placé {projectPhrase} parmi vos priorités. Sur {indicator}, {nom} se situe
  > parmi {rankPhrase} les moins favorables de France. »

**G3, quand projectPhrase et indicator sont identiques** (aujourd'hui `acces_ecoles`) :

> « Vous avez placé {projectPhrase} parmi vos priorités. Sur ce point, {nom} se situe parmi
> {rankPhrase} les moins favorables de France. »

**La phrase de portée, dite une fois par section.** Deux placements possibles :

- **Option A** : sur la première carte (G1 tel quel), les suivantes s'arrêtent après le constat.
- **Option B (recommandée)** : sur la dernière carte mismatch de la section, au pluriel, pour que
  la section atterrisse sur la portée et non sur le constat le plus dur :
  > « Ces écarts s'arbitrent : aucun d'eux ne rend {nom} incompatible avec votre projet. »
  (au singulier, G1 complet, quand la section n'a qu'une carte).

**Rendu sur le cas Toulouse (option B, bandes supposées disjointes) :**

> Carte 1 : « Vous avez placé la proximité des espaces naturels parmi vos priorités. Sur l'accès
> aux espaces naturels, Toulouse se situe parmi les 20 % de communes les moins favorables de
> France. »
>
> Carte 2 : « Vous avez aussi placé un cadre calme parmi vos priorités, et l'écart est ici plus
> net : sur le calme du cadre de vie, Toulouse se situe parmi les 5 % de communes les moins
> favorables de France. Ces écarts s'arbitrent : aucun d'eux ne rend Toulouse incompatible avec
> votre projet. »

La paire se lit désormais comme une narration : la seconde carte reconnaît la première et se
situe par rapport à elle. Deux tempos différents, une seule phrase de portée.

**Note d'architecture (à l'Architecte, pas à moi).** La variante de séquence ne doit PAS vivre
dans `fact.statement` : le fait est un objet autonome, recopié par les compositions
(`shared_evidence` recopie `f.statement`) et servant de matière au lead de la conclusion. Un
« aussi » ou un « l'écart est ici plus net » stocké dans le fait fuirait hors de son contexte.
Le `statement` canonique reste G1 (autosuffisant) ; la variante est une sélection de présentation
au moment de l'assemblage des cartes (`decision-assembler.ts`, `sectionCards`), déterministe,
appliquée aux seules cartes `kind: "fact"` de la section mismatches (les compositions gardent
leur texte). Même logique que le tri : une affaire de liste, pas de règle.

**Portée hors mismatch-rules.** La même phrase de clôture vit dans `absence-rules.ts` l.42,
`coast-rules.ts` l.57, `agglomeration-rules.ts` l.35 et l.42 : appliquer le même remplacement
(« Cet écart s'arbitre : il ne rend pas {nom} incompatible avec votre projet. ») pour que la
correction ne crée pas un nouveau moule à deux vitesses. **Ne pas toucher** en revanche aux deux
clôtures différentes et plus prudentes (`absence-rules.ts` l.55 « sans permettre de conclure à
l'absence de vie étudiante », `agglomeration-rules.ts` l.49 « sans permettre de conclure à son
isolement effectif ») : ce ne sont pas des répétitions, ce sont des périmètres d'honnêteté
distincts.

### Honnêteté de la promesse

- Je n'ai PAS proposé « {nom} reste compatible avec votre projet » : la donnée ne prouve pas la
  compatibilité globale (d'autres incompatibilités peuvent exister ailleurs dans le dossier). La
  forme négative scopée (« ne rend pas incompatible ») est la seule que la preuve porte.
- La narration de hiérarchie est gardée par le non-chevauchement des bandes : on ne dit jamais
  « plus net » quand les positions réelles pourraient être inversées à l'intérieur des bandes.

### Verdict : À RETOUCHER

Le cœur (percentile, univers, personnalisation) est juste et doit survivre tel quel. Ce qui est
à corriger : la clôture (phrase de trop répétée), la série (variante de séquence), la
duplication `acces_ecoles`.

---

## 2. La carte chaleur

### Texte jugé

`src/lib/decision/materiality-rules.ts` l.201 (assemblage) et `climat-facts.ts` l.164-180
(gabarit `trajectoirePhrase`). Rendu Toulouse :

> « Les jours au-dessus de 35 °C passeraient de 2 jours par an sur la période de référence
> 1976-2005 à 9 jours à l'horizon 2050. Les nuits tropicales passeraient de 14 jours par an sur
> la même période à 44 jours à l'horizon 2050, ces nuits où la température ne descend pas sous
> 20 °C et où le corps ne récupère plus. futur•e signale cette exposition à partir de 8 jours
> par an au-dessus de 35 °C, ou de 25 nuits tropicales par an. »

Moment : section « À examiner avant de vous engager ». Décision servie : instruire le confort
d'été au grain du logement avant un achat.

### Où le texte touche juste

- **Le mouvement « passeraient de … à … »** au conditionnel, référence nommée : c'est la
  projection dite honnêtement (« les projections indiquent », jamais « il fera »). Ne pas toucher
  à la structure de trajectoire ni au conditionnel.
- **L'existence même de la traduction charnelle de « nuit tropicale »** : donner le terme puis le
  traduire dans le corps du lecteur est exactement la signature de futur•e (glossaire de la
  doctrine éditoriale). C'est ce qui sépare une donnée d'un sens. À garder, corrigée (voir plus
  bas).
- **La phrase de seuils** : « futur•e signale cette exposition à partir de… » est une des rares
  phrases légitimes où futur•e est sujet (elle décrit sa propre convention, pas le monde). Son
  libellé « à partir de » dit l'opérateur réellement appliqué (`>=`). À garder mot pour mot.
  C'est sa PLACE qui est fausse, pas son texte.
- **L'action** (« Vérifiez le confort d'été : orientation, dernier étage, inertie des murs… ») :
  spécifique, légitime, dans la voix. Ne pas toucher.

### Ce qui trahit le ton

1. **Trois régimes dans un seul paragraphe** : le constat (la trajectoire), la définition (la
   nuit tropicale), la convention de signalement (les seuils). Quatre-vingt-dix mots au même
   niveau typographique : la ligne d'honnêteté noie le constat qu'elle est censée servir.
2. **« Les nuits tropicales passeraient de 14 jours par an »** : des nuits comptées en jours.
   Bug d'unité de `fmtClimat` (qui ne connaît que « jours » et « mm »), présent aussi dans la
   chip de preuve (`climatEvidence` : « 44 jours à l'horizon 2050 » pour des nuits). Petite
   trahison de précision, très visible pour le lecteur attentif, exactement celui que ce dossier
   veut convaincre.
3. **« jours » trois fois dans la première phrase** (« Les jours … 2 jours … 9 jours ») et
   **« à l'horizon 2050 » deux fois** dans le paragraphe : le gabarit s'entend.
4. **« où le corps ne récupère plus »** : absolu au-delà de la preuve (invariant n°5). La
   littérature sanitaire établit une récupération dégradée au-dessus de 20 °C la nuit, pas une
   récupération nulle. La traduction doit rester (c'est la voix) ; son absolu doit tomber.

### Réécriture proposée

**Statement (deux axes notables), gabarit :**

> « Les jours au-dessus de 35 °C passeraient de {ref_jours} par an sur la période de référence
> 1976-2005 à {proj_jours} à l'horizon 2050. Les nuits tropicales, elles, passeraient de
> {ref_nuits} à {proj_nuits} par an : des nuits où la température ne redescend pas sous 20 °C,
> et où le corps récupère mal. »

Rendu Toulouse (52 mots au lieu de 90) :

> « Les jours au-dessus de 35 °C passeraient de 2 par an sur la période de référence 1976-2005 à
> 9 à l'horizon 2050. Les nuits tropicales, elles, passeraient de 14 à 44 par an : des nuits où
> la température ne redescend pas sous 20 °C, et où le corps récupère mal. »

Choix qui portent la correction :
- la seconde trajectoire hérite du cadre posé par la première (« de 14 à 44 par an ») : plus de
  « sur la même période », plus de second « à l'horizon 2050 », et le bug d'unité disparaît sans
  nouveau paramètre (aucun nom d'unité après les nombres, le sujet « les nuits tropicales » le
  porte). Le cadre reste opposable : phrase 1 + chips de preuve datées ;
- pour les comptes de jours/nuits, le nom d'unité tombe quand le sujet le porte déjà (« Les jours
  … passeraient de 2 par an ») : supprime le « jours jours jours ». Le « mm » des pluies, lui,
  reste obligatoire ;
- « ne récupère plus » devient « récupère mal » : le charnel reste, l'absolu tombe ;
- la définition arrive après deux points, en fin de phrase : pas d'incise ouverte au milieu de la
  trajectoire (contrainte existante du code, respectée).

**Cas un seul axe notable** (gabarits complets, cadre entier) :

> « Les jours au-dessus de 35 °C passeraient de {ref} par an sur la période de référence
> 1976-2005 à {proj} à l'horizon 2050. »

> « Les nuits tropicales passeraient de {ref} par an sur la période de référence 1976-2005 à
> {proj} à l'horizon 2050 : des nuits où la température ne redescend pas sous 20 °C, et où le
> corps récupère mal. »

**La phrase de seuils déménage dans `limitation`** (rendue sur la carte, ligne discrète sous le
constat, recopiée par la composition saisonnière : elle ne disparaît d'aucune surface du
dossier) :

> « futur•e signale cette exposition à partir de {seuil_jours} jours par an au-dessus de 35 °C,
> ou de {seuil_nuits} nuits tropicales par an. Cette trajectoire est lue à l'échelle de la
> commune, pas de l'adresse ni du logement. »

Les deux phrases sont du même registre (la convention et la limite : ce que futur•e sait et
d'où) ; les réunir dans la ligne de limite est cohérent, et libère le constat. Conséquences à
assumer : (a) le commentaire doctrinal de `materiality-rules.ts` l.128-130 (« LA CONVENTION DE
SIGNALEMENT EST DITE DANS LE TEXTE ») devient « dite sur la carte, dans la ligne de limite » ;
(b) les règles feu (l.234) et pluies (l.265) portent la même phrase de seuils dans leur
statement : leur appliquer le même déménagement, sinon la chaleur devient une exception muette ;
(c) la conclusion rédigée ne verra plus les seuils (la `limitation` ne lui est pas transmise) :
je tiens cela pour un progrès (la conclusion n'a pas à réciter une convention), mais c'est un
déplacement de la frontière d'honnêteté à valider par le porteur.

**Micro-correctif de preuve** : donner aux chips l'unité juste (« 44 nuits à l'horizon 2050 »),
par exemple un nom de compte par métrique dans `CLIMAT_METRICS`.

### Verdict : À RETOUCHER

Rien ici ne mérite la suppression : chaque élément du paragraphe a une fonction. C'est leur
cohabitation au même niveau qui fatigue, plus deux fautes de précision (unité, absolu).

---

## Ce que je recommande de NE PAS changer

1. « Vous avez placé … parmi vos priorités » en ouverture de première carte : c'est la preuve de
   personnalisation, opposable au geste du wizard. (Sur les cartes suivantes, « aussi » suffit à
   la dé-mécaniser sans la perdre.)
2. « se situe parmi les {X} % de communes les moins favorables de France » : le percentile est le
   constat, mot pour mot.
3. Le conditionnel des trajectoires climat et la référence 1976-2005 nommée en entier une fois.
4. Le libellé de la phrase de seuils (« à partir de » = l'opérateur `>=` réellement appliqué) :
   il change de place, pas d'un mot.
5. Les actions spécifiques (confort d'été, débroussaillement, ruissellement).
6. Les clôtures prudentes distinctes (« sans permettre de conclure à … ») des absences attestées
   et de l'isolement : périmètres d'honnêteté, pas des répétitions.
7. La phrase de grain (« lue à l'échelle de la commune, pas de l'adresse ni du logement »).

## Cohérence (tensions posées, non tranchées)

- **Portée « incompatible » une fois par section vs autonomie de chaque fait.** Ma proposition
  garde le statement canonique autosuffisant et ne fait varier que l'affichage ; si le porteur
  veut que CHAQUE carte affichée porte sa portée, l'option A (portée sur la première carte,
  G1 complet partout en canonique) reste disponible, au prix d'un retour partiel de la répétition.
- **Seuils hors de la conclusion rédigée** : voir section chaleur, point (c). À valider.
- **« s'arbitre » vs « appelle un arbitrage »** : arbitrage de ton, deux options fournies.

## Mise à jour de la doctrine (prête à écrire dans `editoriale.md`)

1. « **Dans une série de cartes du même registre, le gabarit ne se répète jamais à l'identique.**
   La première carte porte le cadre complet (personnalisation, portée) ; les suivantes portent le
   constat et, quand les bandes de rang ne se chevauchent pas, la hiérarchie (« l'écart est ici
   plus net »). La phrase de portée (« ne rend pas X incompatible avec votre projet ») se dit une
   fois par registre, pas une fois par carte. »
2. « **Une convention de signalement (seuils futur•e) se lit sur la carte, dans la ligne de
   limite, jamais au milieu du constat.** Elle ne disparaît jamais du dossier. »
3. « **Les traductions charnelles de termes techniques n'ont pas droit à l'absolu** : « le corps
   récupère mal », jamais « le corps ne récupère plus ». Le corps du lecteur est un registre de
   la voix, pas un argument d'autorité. »

## La version minimale (~90 % de la valeur)

- **Mismatch** : remplacer la seule phrase de clôture, partout où elle est recopiée :
  « Cela répond moins bien à cette dimension de votre projet, sans rendre {nom} incompatible
  avec lui. » devient « Cet écart s'arbitre : il ne rend pas {nom} incompatible avec votre
  projet. » et, sur les cartes 2+, ajouter « aussi » (« Vous avez aussi placé … »). Sans même la
  narration de hiérarchie, ces deux retouches cassent l'effet publipostage.
- **Chaleur** : deux mots et un déménagement : « ne récupère plus » devient « récupère mal », et
  la phrase de seuils passe du statement à la limitation.

## Quand rouvrir ce sujet

- Un lecteur testé décrit encore les cartes comme « générées » ou « templatées » après la
  correction : la variante de séquence ne suffit pas, il faudra une vraie composition narrative
  des mismatchs (patron « plusieurs priorités répondent moins bien », à la manière de
  `territory-size-multiple-consequences`).
- La sonde de conclusion (`scripts/probe-conclusion.ts`) montre le modèle qui importe « plus
  net » ou les seuils dans la conclusion hors contexte : revoir la frontière canonique/affiché.
- Les sections mismatch dépassent régulièrement 3 cartes affichées (cap actuel) : « aussi » ne
  porte pas une série de 4+, re-prioriser le patron composé.
- Un nouveau millésime de distribution resserre les bandes : la gate de non-chevauchement se
  déclenchera plus souvent, vérifier que la narration de hiérarchie apparaît réellement (sinon
  elle est morte-née, la retirer).
- Une source sanitaire de référence (Santé publique France, Météo-France) fournit une
  formulation validée de l'effet des nuits tropicales sur la récupération : réaligner la
  traduction charnelle dessus.

## Limites de mon regard

- **Je n'ai pas le rendu visuel de ce dossier Toulouse.** Déplacer les seuils dans la ligne de
  limite (12,5 px, couleur ghost) pourrait visuellement enterrer la ligne d'honnêteté ; seul le
  Design Critic peut juger si elle reste assez lisible pour tenir sa fonction.
- **Je n'ai pas les bandes réelles de Toulouse.** Si les bandes nature/calme se chevauchent, la
  narration « plus net » ne se déclenchera pas sur le cas précis qui a motivé la relecture, et
  ma correction se réduira au « aussi » et à la clôture.
- **Je n'ai pas relu le dossier de bout en bout** (verdict rédigé, compositions, vérifications,
  logement) : je juge deux familles de cartes, pas la fatigue cumulée de la page entière, qui
  peut demander plus que des corrections de gabarit.
- **Je parie sur « s'arbitre » sans preuve de réception** : le mot appartient au vocabulaire du
  produit, pas forcément encore à celui du lecteur. Un test de lecture tranchera mieux que moi.
