# Veille Pinterest : représenter les trois échelles du rapport

Date : 21 août 2026  
Périmètre : repère interactif de `/rapport`, dans une colonne de 280 px.  
Objet : représenter **Territoire · la commune**, **Autour de l'adresse · le voisinage** et
**Logement · le bâtiment** sans fabriquer une fausse carte ni concurrencer le verdict.

## Décision courte

La meilleure direction n'est pas une illustration de ville contenant une maison. C'est un **zoom
continu en trois fenêtres** : un même lieu abstrait, vu successivement comme territoire, voisinage
et bâtiment.

Le cercle, le carré arrondi et le losange restent les trois zones cliquables. Ce qui change est leur
contenu : chaque forme masque un dessin plus précis du même champ spatial. Le cercle reste
parfaitement rond. Le logement ne devient pas un pictogramme de maison, mais une empreinte ou un
mini-plan. Au survol, le cadre choisi gagne en contraste et son contenu se précise ; les deux autres
reculent. Aucun mouvement de repos, aucune couleur de statut.

Cette direction synthétise trois mécanismes trouvés dans la veille : les lentilles de zoom, la
progression d'échelle et les plans superposés. Elle ne copie aucun visuel de référence.

## Contraintes de Futur·e utilisées pour trier

- Le repère doit tenir et rester lisible à environ 224 px dans une colonne de 280 px.
- Les trois formes doivent rester cliquables à la souris ; la liste adjacente reste la voie
  sémantique au clavier et au lecteur d'écran.
- Le cercle Territoire doit être un cercle pur, pas une pseudo-frontière communale.
- Le dessin ne doit pas prétendre représenter la commune ou le bâtiment réels.
- L'orange ne peut pas signaler une échelle dans le rapport ; contraste et épaisseur portent l'état.
- Aucun mouvement permanent dans la vision périphérique du verdict.
- Quand seule la commune est ouverte, le grand dessin d'emboîtement disparaît.
- Le dessin doit rester une navigation secondaire, pas la surface dominante du viewport.

## Références conservées

Les liens Pinterest peuvent changer. La description de chaque mécanisme est donc conservée ici,
indépendamment de l'image.

### 1. Lentilles de contexte : la référence la plus utile

[Site Context Diagram, Pinar Kahya](https://ph.pinterest.com/pin/667095763582111860/)

Une vue urbaine continue sert de fond et plusieurs ouvertures circulaires en extraient des fragments
agrandis. Le lien entre ensemble et détail reste immédiatement compréhensible, parce que des lignes
relient chaque lentille à son emplacement d'origine.

**À reprendre** : une seule géographie, des cadrages qui révèlent progressivement le grain, et un
rapport explicite entre le détail et son contexte.  
**À ne pas reprendre** : les six bulles, les légendes et la densité du projet architectural. À
224 px, Futur·e doit se limiter à trois cadres et quelques traits.

### 2. Powers of Ten : le meilleur principe narratif

[Powers of Ten, Charles et Ray Eames](https://uk.pinterest.com/pin/powers-of-ten--492299803000848380/)

Chaque image conserve le même centre mais change de champ. La progression est comprise avant même
de lire les valeurs : le proche appartient au lointain, et le lointain donne son contexte au proche.

**À reprendre** : un point de repère commun et trois niveaux de détail nettement différents.  
**À ne pas reprendre** : la grille de vignettes photographiques et les chiffres de puissance. Le
rapport n'a besoin que du geste de zoom.

### 3. Plans détachés : la meilleure variante d'empilement

[Exploded axon mapping](https://in.pinterest.com/pin/756393699924001128/) et
[sélection de diagrammes architecturaux en couches](https://tr.pinterest.com/merveozen_98/diyagram-%C3%B6rnekleri/)

Plusieurs plans du même site sont détachés verticalement. Chaque plaque porte une information, mais
les axes partagés montrent qu'elles décrivent le même lieu.

**À reprendre** : la profondeur très légère, les trois plans alignés et la possibilité de faire
remonter de quelques pixels le plan survolé.  
**À ne pas reprendre** : la perspective forte, les ombres et l'animation automatique. Une version
Futur·e resterait presque frontale et monochrome.

### 4. Cartographic Grounds : la meilleure matière graphique

[Cartographic Grounds](https://ca.pinterest.com/pin/622552348527468084/) et
[autre planche de Cartographic Grounds](https://www.pinterest.com/pin/405183297709560958/)

Ces dessins utilisent le trait, le vide et la densité plutôt que des aplats illustratifs. Une carte
peut ainsi devenir une matière abstraite, presque technique, sans ressembler à une carte touristique.

**À reprendre** : peu de traits, des épaisseurs hiérarchisées, beaucoup de fond visible.  
**À ne pas reprendre** : toute ligne qui pourrait être lue comme une donnée réelle. Le motif du
repère doit rester explicitement abstrait et stable d'une commune à l'autre.

### 5. Cartographie expérimentale : une bibliothèque de textures

[Board Mapping](https://www.pinterest.com/gontsa/mapping/)

Le board mélange cartes de bâti, réseaux, aplats de parcelles, vides et repères typographiques. Il est
utile moins pour une composition précise que pour calibrer trois densités de dessin : faible au
territoire, moyenne au voisinage, forte mais bornée au bâtiment.

**À reprendre** : la différence de grain portée par la densité et la nature du trait.  
**À ne pas reprendre** : les textures nombreuses, les palettes cartographiques et les légendes.

### 6. Axonométrie urbaine : utile comme limite haute, pas comme solution

[Axonometric Urban Block Diagram](https://www.pinterest.com/pin/816981188681577767/)

Le dessin rouge et blanc obtient une belle hiérarchie avec une encre dominante et quelques repères.
Il montre toutefois pourquoi une ville détaillée n'est pas adaptée au rapport : à la taille cible, les
rues, personnages et bâtiments deviennent une texture indéchiffrable.

**À reprendre** : la retenue chromatique et la hiérarchie du trait.  
**À ne pas reprendre** : la ville figurative, les personnages et la profusion de détails.

## Classement des directions

| Direction | Compréhension des échelles | Tenue à 224 px | Interaction | Compatibilité Futur·e | Verdict |
|---|---:|---:|---:|---:|---|
| Trois fenêtres d'un même lieu | 5/5 | 5/5 | 5/5 | 5/5 | À prototyper |
| Trois plans légèrement détachés | 4/5 | 4/5 | 5/5 | 4/5 | Variante B |
| Trois vignettes en progression | 5/5 | 3/5 | 4/5 | 4/5 | Mieux pour une page large |
| Axonométrie urbaine détaillée | 4/5 | 1/5 | 2/5 | 2/5 | À écarter |
| Ville, quartier et maison illustrés | 3/5 | 3/5 | 3/5 | 1/5 | À écarter |
| Trois cercles concentriques vides | 3/5 | 5/5 | 4/5 | 3/5 | Trop générique |

## Direction A à prototyper : « un lieu, trois précisions »

### Composition au repos

1. **Territoire** : cercle pur. Deux ou trois grandes lignes abstraites traversent son champ, avec
   quelques vides. Il dit une étendue, pas une frontière.
2. **Autour de l'adresse** : carré arrondi inscrit dans le cercle. Le même réseau y est recadré et
   complété par quelques empreintes de bâti.
3. **Logement** : losange ou carré tourné inscrit au centre. Le motif y devient une empreinte de
   parcelle ou un plan très simple. Aucune silhouette de maison.
4. Un repère central neutre garantit que les trois cadrages parlent du même point.
5. Le fond reste visible. La sophistication vient de la précision du masque et du trait, pas de la
   quantité de détails.

### Interaction

- Chaque contour conserve son propre lien et sa propre zone de clic.
- Au survol d'une forme : trait de 1,6 à 2,8 px, motif interne plus net, deux autres motifs atténués.
- Le texte adjacent affiche le bénéfice concret de l'échelle.
- La transition dure environ 180 ms et respecte `prefers-reduced-motion`.
- Aucun halo, aucune respiration, aucun zoom permanent.
- La liste reste toujours visible et demeure la seule voie annoncée aux technologies d'assistance.

### Ce qui rendrait la proposition premium

- Une géométrie très exacte, sans petite irrégularité pseudo-organique.
- Trois densités de trait plutôt que trois pictogrammes.
- Des masques nets et un seul point d'alignement.
- Un contraste neutre, sans couleur décorative.
- Une interaction brève qui révèle de l'information au lieu d'animer pour attirer l'attention.

## Variante B : trois plans détachés

Si l'emboîtement frontal reste trop proche d'un diagramme générique, les trois formes peuvent être
séparées de 10 à 14 px sur un axe vertical oblique, comme un plan architectural éclaté. Le survol
rapproche le plan choisi du lecteur. Cette version raconte mieux l'empilement, mais prend davantage de
hauteur et rend moins immédiate l'idée que le logement appartient au voisinage, lui-même inscrit dans
la commune.

## Pistes explicitement écartées

- **La ville générique avec une maison au premier plan** : elle répète l'ancienne illustration de la
  charte et invente un lieu qui n'est pas celui du lecteur.
- **La carte réaliste** : sans géométrie réelle de la commune et de la parcelle, elle ment par
  ressemblance ; avec les vraies données, elle devient un autre produit à charger et maintenir.
- **Le rail Commune → Autour → Logement** : il ressemble à une jauge ou à une position mesurée et
  perd l'idée d'inclusion spatiale.
- **Le cutaway de logement** : trop figuratif et trop dense ; il réduit Logement à l'intérieur des
  pièces alors que l'échelle comprend aussi le bâtiment et sa parcelle.
- **L'animation de zoom en boucle** : elle concurrence la lecture du verdict et donne un poids de hero
  à une navigation secondaire.

## Requêtes Pinterest à conserver

- `site context diagram exploded callouts`
- `powers of ten editorial design`
- `exploded axon mapping monochrome`
- `cartographic grounds landscape representation`
- `abstract cartography monochrome graphic design`
- `map inset zoom architecture diagram`
- `nested spatial frames editorial design`

## Prochaine étape recommandée

Produire **deux prototypes SVG dans le vrai gabarit de 224 px** :

1. direction A, trois fenêtres masquées et emboîtées ;
2. variante B, trois plans détachés.

Les comparer au repos, avec chaque échelle survolée, puis à 112 px sur mobile. Ne retenir une
direction que si le grain Territoire / voisinage / bâtiment reste compréhensible sans lire les
libellés. Si les deux échouent à 112 px, conserver la géométrie actuelle et utiliser ces recherches
uniquement pour raffiner le trait.
