# Menu divergent — Researcher (futur•e)
## Problème ouvert : quel geste visuel ancre l'identité d'UNE commune en tête du rapport Territoire ?

> Produit par l'agent **Researcher** (ouverture / divergence) le 2026-07-01.
> **NON VÉRIFIÉ par construction** : matière brute, non triée, non classée, aucun gagnant désigné.
> La sélection appartient à la convergence (Data Curator sur la faisabilité/honnêteté des sources
> déterministes, puis Design Critic sur l'écran, puis board). Je génère, je ne tranche pas.

---

## Le problème, recadré en question créative

La contrainte centrale n'est pas « trouver une image ». Elle est : **le lecteur connaît déjà sa
commune mieux que nous ; qu'est-ce que futur•e peut lui montrer d'elle qu'il n'a jamais vu ?**
Une carte postale lui apprend zéro. Une photo aérienne, zéro. Le seul ancrage qui a une raison
d'exister est celui qui **retourne un fait familier en révélation** : « votre commune, vue comme
un territoire qui change ». Le générateur : quelle forme se génère déterministiquement depuis
l'index ET fait éprouver quelque chose que le lecteur ne savait pas ressentir sur son propre lieu ?

Reformulation de chaque contrainte en carburant :
- « il sait où c'est » → ne localise pas, **caractérise** (la forme du lieu, pas sa position).
- « pas la carte postale » → l'ancrage porte déjà la **tension** (trajectoire, exposition dominante),
  pas la sérénité.
- « pas de score, le produit parle » → l'identité vient de la donnée **rendue en forme, sans chiffre**.
- « tenable à 35 000 » → **génération procédurale déterministe**, zéro asset humain.
- « sobre, ne vole pas la synthèse » → la version la plus minimale qui a quand même une âme.

---

## Et si je jetais la question ? (espace des PROBLÈMES)

Oui, j'ai le droit, et je m'en sers. Trois reformulations, dont une qui jette la question visuelle.

1. **« L'ancrage d'identité n'est peut-être pas visuel du tout. »** Le passeport territorial
   (TerritoryIdentityCard) raconte DÉJÀ le lieu par la donnée, avec un sceau signature. Le vrai
   problème pourrait être : le bandeau est une **redondance décorative** au-dessus d'un passeport
   qui fait déjà le travail. La question à poser au board : *faut-il un ancrage AU-DESSUS du
   passeport, ou le passeport EST l'ancrage et le bandeau doit disparaître partout, pas seulement
   pour les 34 929 communes sans illustration ?*

2. **« L'ancrage ne devrait pas figer l'identité, il devrait porter la TRAJECTOIRE. »** futur•e ne
   vend pas « ce que le lieu EST » (identité figée = carte postale par nature) mais « ce qu'il
   DEVIENT ». Le bandeau, aujourd'hui, esthétise un présent. Reformulé : *l'ancrage devrait être la
   première apparition du mouvement, un avant/après discret, pas un portrait.* C'est la reformulation
   la plus alignée sur la marque.

3. **« Le bon ancrage est peut-être une PHRASE, pas une image. »** La signature de futur•e c'est
   « le produit parle ». Une ligne éditoriale déterministe (« Commune dense d'un littoral qui
   recule, dont la population monte pendant que l'eau aussi ») ancre plus fort qu'un aplat. La
   question devient : *pourquoi chercher un geste visuel là où la voix est notre signature ?*

Ces trois reformulations remontent à l'orchestrateur/board (pas au Data Curator) : si l'une est
retenue, on rejoue la divergence sur la bonne question. Le menu ci-dessous couvre les DEUX espaces :
il propose des gestes visuels ET des pistes qui contestent le besoin d'un geste visuel.

---

## Les paradigmes (la carte des idées)

- **P1 — Le lieu dessine sa propre forme.** L'ancrage est la géométrie réelle du territoire
  (contour, tissu bâti, hydrographie) rendue en signe, pas une scène.
- **P2 — L'ancrage est déjà le mouvement.** Le bandeau porte la trajectoire (démographie, climat)
  dès le premier regard : c'est une bande de temps, pas une vue.
- **P3 — La donnée devient texture.** Densité, couvert, exposition rendus comme matière/motif
  abstrait, jamais comme chiffre ni comme illustration figurative.
- **P4 — La voix comme ancrage.** Pas d'image, ou l'image se réduit à un signe typographique :
  le lieu est nommé et caractérisé par la langue.
- **P5 — Contester le bandeau.** Le supprimer, le fondre dans le passeport, ou le remplacer par
  un objet-document.

---

## Le menu (pistes)

### P1 — Le lieu dessine sa propre forme

**1. Le contour nu.** Le polygone administratif réel de la commune (IGN Admin Express), tracé
en 1px accent sur le fond sombre, occupant la bande, légèrement débordant/rogné.
- Révèle : la SILHOUETTE du territoire — un lieu côtier a une frange d'eau, une commune de montagne
  une forme torturée, une ville-centre un pavé compact. Chaque contour est unique par construction.
- Hypothèse remise en cause : « le lecteur connaît déjà sa commune » — il connaît son nom, pas sa
  forme dessinée seule, hors de tout fond de carte.
- Étiquette : `déterministe depuis l'index` (si contours en base) / `dépend d'une donnée à valider`
  (poids des 35k polygones).

**2. Le contour qui respire l'eau.** Idem contour nu, mais la portion du périmètre exposée à l'aléa
(trait de côte, lit majeur EAIP) est rendue différemment (pointillé, halo froid) du reste.
- Révèle : la part du territoire qui touche la menace, comme une blessure sur le dessin.
- Hypothèse remise en cause : « l'identité est esthétique » — ici l'identité EST l'exposition.
- Étiquette : `dépend d'une donnée à valider` (jointure contour × EAIP/trait de côte), `dangereusement séduisante`.

**3. Le tissu bâti en négatif.** La tache d'urbanisation réelle (empreinte OSM buildings / couvert
artificialisé) rendue en aplat sombre sur clair : la ville comme constellation de bâti.
- Révèle : la MORPHOLOGIE — village-rue étiré, bourg compact, conurbation diffuse. Le sol dominant
  (déjà dans l'index) devient forme.
- Hypothèse remise en cause : « il faut une scène pour évoquer un lieu » — la seule densité bâtie suffit.
- Étiquette : `dépend d'une donnée à valider` (rendu 35k), `déterministe` si dérivé du % couvert.

**4. La coupe topographique.** Un profil d'altitude (une ligne, du point bas au point haut de la
commune) traversant la bande, comme un électrocardiogramme du relief.
- Révèle : plat de plaine vs mur de montagne vs pente littorale, en un trait. La géographie ressentie.
- Hypothèse remise en cause : « la trajectoire climatique prime » — ici c'est le relief muet qui
  identifie, mais il conditionne l'exposition (ruissellement, îlot de chaleur).
- Étiquette : `dépend d'une donnée à valider` (MNT par commune), `déterministe` de calcul.

**5. L'hydrographie signature.** Le réseau d'eau (fleuve, côte, absence d'eau) tracé seul : certaines
communes SONT une rivière, d'autres n'ont pas une goutte.
- Révèle : le rapport à l'eau, muet, qui préfigure inondation/submersion/sécheresse.
- Hypothèse remise en cause : « l'ancrage doit être généraliste » — l'eau ne dit rien pour une
  commune sèche, et ce vide EST une information.
- Étiquette : `dépend d'une donnée à valider` (couche hydro).

### P2 — L'ancrage est déjà le mouvement

**6. La bande-trajectoire démographique.** Une seule ligne horizontale qui monte ou descend
doucement de gauche (2015) à droite (aujourd'hui/2050), la pente = croissance/déclin de la commune.
- Révèle : le lieu qui se remplit ou se vide, dès le premier regard, sans chiffre. Déjà dans l'index
  (croissance_demographique).
- Hypothèse remise en cause : « l'identité est un état » — non, c'est une direction.
- Étiquette : `déterministe depuis l'index`.

**7. L'horizon qui se déplace.** Deux lignes d'horizon superposées et décalées : l'une « le lieu
tel qu'il est », l'autre translucide « le lieu en 2050 » (température, trait de côte, boisement).
Le décalage entre les deux EST l'ancrage.
- Révèle : la tension future rendue visible sans dramatiser, juste un glissement.
- Hypothèse remise en cause : « l'ancrage montre le présent » — il montre l'écart présent/futur.
- Étiquette : `dépend d'une donnée à valider` (bute peut-être sur l'interdit DRIAS-projeté-graphique),
  `dangereusement séduisante`.

**8. Le thermo-strip du lieu.** Une bande de fines colonnes, une par année, teinte = température/
nombre de nuits chaudes de CETTE commune, façon « warming stripes » de Hawkins, mais sobre et
gatée (sans échelle criarde).
- Révèle : le réchauffement propre au lieu, en texture, pas en score.
- Hypothèse remise en cause : « pas de couleur qui dramatise » — retournée : la couleur raconte une
  trajectoire honnête si elle est la donnée elle-même, pas un jugement.
- Étiquette : `déterministe depuis l'index` (données climat déjà là), `dangereusement séduisante`,
  `remet en cause l'invariant pas-de-choroplèthe` (à trancher : est-ce un choroplèthe ? non, c'est
  une série temporelle mono-lieu).

**9. Le sablier des saisons.** L'ancrage montre le nombre de jours de forte chaleur qui « grignote »
l'année, la part rouge grandissant du présent vers le futur, en un ruban horizontal.
- Révèle : l'été qui s'allonge, spécifique au lieu.
- Hypothèse remise en cause : « l'identité est spatiale » — ici elle est calendaire.
- Étiquette : `dépend d'une donnée à valider`.

### P3 — La donnée devient texture

**10. Le grain de densité.** Le fond de bande est un semis de points dont la densité = la densité
réelle de population : un village respire de vide, une métropole sature.
- Révèle : l'intensité humaine du lieu, ressentie comme texture, jamais comme chiffre.
- Hypothèse remise en cause : « il faut du figuratif » — l'abstraction suffit à faire éprouver dense/vide.
- Étiquette : `déterministe depuis l'index`.

**11. La palette-vérité.** Pas d'image : la bande est un dégradé composé des VRAIES proportions de
couvert des sols de la commune (X% urbain, Y% forêt, Z% agricole), en bandes de couleur sobres.
- Révèle : la composition réelle du territoire comme drapeau du lieu. Deux communes n'ont jamais le
  même. Déjà dans l'index (composition couvert).
- Hypothèse remise en cause : « la couleur dramatise » — retournée : la couleur DÉCRIT si elle est
  la proportion réelle, pas une alerte.
- Étiquette : `déterministe depuis l'index`.

**12. Le champ d'exposition dominante.** La bande porte une texture dérivée de l'aléa dominant du
lieu (houle discrète pour submersion, craquelures pour sécheresse, stries de chaleur), abstraite,
jamais illustrative.
- Révèle : ce qui PÈSE sur ce lieu précis, en signature de matière.
- Hypothèse remise en cause : « l'ancrage esthétise » — ici il inquiète juste ce qu'il faut.
- Étiquette : `dépend d'une donnée à valider`, `dangereusement séduisante`, `éloignée de la marque`
  (risque de figuration météo, à surveiller).

**13. L'empreinte spectrale.** Chaque commune génère une « signature » abstraite unique (type
génération procédurale déterministe façon identicon), seed = code INSEE + typologie + exposition.
Deux communes ont deux signes différents, reproductibles.
- Révèle : l'unicité pure, un blason algorithmique. Ne PRÉTEND rien de vrai, assume le décoratif honnête.
- Hypothèse remise en cause : « l'ancrage doit informer » — et s'il devait seulement individualiser,
  comme un filigrane, sans mentir ?
- Étiquette : `déterministe depuis l'index`, `éloignée de la marque` (proche du gadget), `contre-intuitive`.

### P4 — La voix comme ancrage

**14. La ligne caractérisante.** Pas d'image : une phrase déterministe, grande, en serif, assemblée
depuis l'index (« Commune peu dense d'un littoral atlantique, dont la population monte pendant que
le trait de côte recule »). Le sceau du passeport reste le seul signe graphique.
- Révèle : le lieu caractérisé, pas situé, dans la voix de la marque. La signature de futur•e c'est
  « le produit parle ».
- Hypothèse remise en cause : « il faut un geste VISUEL » — la question elle-même.
- Étiquette : `déterministe depuis l'index`, `contre-intuitive`.

**15. Le nom qui pèse.** Le nom de la commune en très grand serif, avec sous lui, en filigrane
mono, trois attributs bruts (typologie · rôle UU · exposition dominante), typographie seule sur fond
mesh. L'ancrage est un titre de page d'identité.
- Révèle : la commune comme sujet nommé, gravité par la typographie.
- Hypothèse remise en cause : « le passeport le fait déjà » — donc peut-être fusionner (cf. P5).
- Étiquette : `déterministe depuis l'index`.

**16. Le télex du lieu.** Une bande mono, façon bandeau d'agence de presse, une ligne défilante
sobre (ou statique) : « SAINT-MALO · 46 000 hab · littoral · population +3% · submersion suivie ».
- Révèle : le lieu comme dépêche, factuel, tendu, anti-carte-postale par nature.
- Hypothèse remise en cause : « l'ancrage doit être contemplatif » — et s'il était brut, journalistique ?
- Étiquette : `déterministe depuis l'index`, `éloignée de la marque` (ton hors-marque assumé).

### P5 — Contester le bandeau lui-même

**17. Pas de bandeau, le passeport porte seul.** Suppression pure pour toutes les communes ;
le TerritoryIdentityCard (sceau + nom géant + champs) devient le premier bloc.
- Révèle : que l'ancrage existait peut-être déjà et que le bandeau était une redondance. Cohérence
  totale à 35 000, zéro asset, zéro faux-semblant.
- Hypothèse remise en cause : « un rapport a besoin d'une bande d'ouverture visuelle ».
- Étiquette : `déterministe` (rien à générer), `contre-intuitive`.

**18. Le passeport EST le bandeau.** Fusionner : élargir le passeport en ratio d'ouverture, le
sceau de cire devenant le seul objet-signature en tête. On garde l'âme (la cire, le nom géant), on
supprime le problème des 71 vs 35 000.
- Révèle : un objet-document cohérent, déjà dessiné, déjà tenable partout.
- Hypothèse remise en cause : « il faut deux blocs distincts (photo + données) ».
- Étiquette : `déterministe`, `déjà à moitié codé`.

**19. Le cachet seul.** Réduire l'ancrage au SEUL sceau de cire, agrandi, centré, glyphe = typologie,
avec le code INSEE pressé dedans. Un timbre officiel sur un dossier sombre.
- Révèle : la gravité d'un document d'état civil du territoire. Minimal, âme forte, déjà codé.
- Hypothèse remise en cause : « l'ancrage doit occuper la largeur ».
- Étiquette : `déterministe`, version minimale-avec-âme.

**20. Le bandeau conditionnel honnête.** Garder l'illustration LÀ où elle existe (71), mais pour les
autres, ne pas dégrader vers un aplat : basculer vers une des formes procédurales ci-dessus (contour,
palette-vérité, thermo-strip). Le bandeau change de NATURE selon la donnée disponible, jamais de
qualité.
- Révèle : une stratégie de repli qui n'a pas l'air d'un repli.
- Hypothèse remise en cause : « il faut UNE réponse unique pour 35 000 » — et si la réponse était
  un système à plusieurs états, tous dignes ?
- Étiquette : `déterministe` / `dépend d'une donnée à valider` selon la forme retenue.

---

## Réaction aux DEUX pistes pressurisées (je réagis, je ne valide pas)

**Carte de France minimaliste + point (éventuellement clignotant).**
Franchement : dans sa forme naïve, elle tombe en plein dans l'inerte-localisateur déjà écarté par
le board. Le lecteur sait où est sa commune ; un point sur l'Hexagone ne lui apprend rien, et le
point clignotant ajoute une agitation qui contredit « sobre, sombre, adulte ». **Elle n'échappe au
piège qu'à une condition : que la France ne serve pas à SITUER mais à RELATIVISER** — c.-à-d. que le
fond porte une information nationale et que le point montre où se PLACE la commune dedans. Mutations
qui la sauveraient : (a) fond = trame de l'aléa dominant du lieu à l'échelle nationale, le point
révélant « votre commune est dans/hors de la zone qui chauffe le plus » ; (b) pas un point mais un
CADRAGE : la France se resserre/zoome sur la maille locale, l'échelle nationale n'étant qu'un point
de départ narratif ; (c) cartogramme déformé (cf. menu précédent, piste 11) plutôt que carte
géographique. Dans sa version « joli point qui clignote sur l'Hexagone aux couleurs de la marque »,
mon avis d'ouvreur : **récupérable seulement si elle cesse d'être une carte de localisation.** Sinon
elle est de la donnée vraie et inerte. Étiquette : `dangereusement séduisante` (facile, jolie, vide).

**Pas de bandeau du tout, le passeport porte seul (pistes 17-19).**
C'est, de mon point de vue génératif, la reformulation la plus honnête du problème : elle attaque
frontalement l'hypothèse « un rapport a besoin d'une bande d'ouverture ». Le passeport RACONTE déjà
le lieu par la donnée et possède déjà un signe-signature (le sceau). La supprimer résout d'un coup
les deux problèmes (71 vs 35 000 ET carte-postale). Le risque que la convergence devra peser : perte
de respiration/d'entrée en matière visuelle avant un rapport dense. D'où les variantes fusion (18) et
cachet-seul (19) qui gardent l'âme sans le faux-semblant. Je ne tranche pas ; je signale que « pas de
bandeau » n'est pas un renoncement, c'est une posture (P5) qui mérite d'être pesée comme les autres.

---

## Le test « sans écran »

Si futur•e devenait une borne vocale ou un conseiller humain décrivant votre commune à voix haute,
laquelle survit ?

- **Piste 14 (ligne caractérisante) : survit intégralement.** « Commune peu dense d'un littoral qui
  recule, dont la population monte » se DIT. C'est une expérience ressentie (le lieu caractérisé,
  tendu), pas une interface. Elle survit parce qu'elle n'était jamais visuelle.
- **Piste 6/7 (la trajectoire comme ancrage) : survit.** « Votre commune se remplit pendant que l'eau
  monte » se raconte à voix haute et fait éprouver le mouvement. Le graphe n'était qu'une des
  incarnations de l'idée « l'ancrage EST le mouvement ». Concept, pas interface.
- **Piste 17-19 (passeport/sceau seul) : survit partiellement.** Le sceau de cire est un objet
  visuel ; décrit à voix haute il devient « un cachet officiel sur votre territoire » — l'idée de
  GRAVITÉ documentaire survit, l'exécution non. C'est un concept d'expérience (« ce lieu mérite un
  dossier d'état civil »), donc valable.
- **Piste 1 (contour nu) : ne survit PAS.** « Le dessin de votre commune » ne se dit pas, ne se
  ressent pas sans l'œil. C'était une belle interface, pas un concept. Signal pour la convergence :
  jolie mais fragile.
- **Carte + point : ne survit pas** (« un point sur la France » = néant à voix haute). Confirme le
  diagnostic d'inerte.

Verdict du test : les pistes les plus solides conceptuellement sont **la voix caractérisante (14),
l'ancrage-mouvement (6/7) et l'objet-document (18/19)** — parce qu'elles portent une expérience
ressentie, pas un affichage.

---

## Les pistes que je n'ose presque pas proposer

- **X. Le rapport commence par un blanc nommé.** En tête, juste le nom de la commune, seul, sur du
  noir, longtemps (beaucoup d'espace vide). L'ancrage est l'ABSENCE d'ancrage : on laisse le lieu
  résonner avant la donnée. Mon instinct crie « vide = bug », je le propose quand même : le silence
  visuel peut être la chose la plus adulte du produit. `éloignée de la marque`, `contre-intuitive`.
- **Y. L'ancrage qui vieillit sous vos yeux.** Au chargement, le bandeau passe en 2 secondes du lieu
  « aujourd'hui » à « 2050 » (trait de côte qui recule, vert qui jaunit) puis se fige sur le futur.
  Une micro-animation unique. Frôle le dramatique interdit, MAIS c'est la lucidité climatique rendue
  physique dès la première seconde. `dangereusement séduisante`, `remet en cause pas-de-dramatisation`.
- **Z. Pas d'ancrage d'identité, un ancrage d'ENJEU.** Et si la tête du rapport ne montrait pas le
  lieu du tout, mais la QUESTION que ce lieu pose (« Ici, l'inconnu décisif est l'eau »)? On jette
  l'identité pour la tension. Frôle le hors-sujet (ce n'est plus « qui est ce lieu ») mais c'est
  peut-être ce que futur•e vend vraiment. `contre-intuitive`, remonte à l'espace des problèmes.

---

## Réflexe de clôture — quand ré-explorer ?

Rouvrir et élargir ce menu si :
- la convergence SÈCHE (Data Curator + Design Critic n'arrivent pas à départager P1/P2/P4/P5 sans
  nouveau matériau) ;
- une contrainte SAUTE : si les contours IGN ou une couche hydro/MNT entrent en base à coût nul, tout
  le paradigme P1 (le lieu dessine sa forme) devient déterministe et change le champ ;
- l'interdit « DRIAS projeté en graphique » est clarifié : s'il tombe, P2 (ancrage-mouvement, 7/8/9)
  explose en possibilités ;
- un usage réel déplace la question : si la mesure d'usage montre que les lecteurs SCROLLENT
  immédiatement au-delà du bandeau, la vraie question devient « faut-il un ancrage » (P5), pas « lequel » ;
- le module Logement/quartier arrive : l'échelle IRIS pourrait offrir une identité intra-communale
  (îlot de chaleur, cf. ICU réservé Logement) qui rouvrirait l'ancrage à une granularité neuve.

> Rappel de statut : tout ceci est NON VÉRIFIÉ. La sélection appartient au Data Curator (faisabilité
> des sources déterministes), puis au Design Critic (l'écran), puis au board si structurant. J'ai
> ouvert le champ ; je ne le referme pas.
