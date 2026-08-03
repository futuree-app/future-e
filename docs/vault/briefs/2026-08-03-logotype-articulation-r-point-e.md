# Brief · le point médian devient un dessin de marque

**3 août 2026 · à remettre à un dessinateur de caractères · le produit ne bouge pas d'ici là.**

---

## Ce qu'on demande, en une phrase

Rendre **propriétaire l'événement typographique qui existe déjà** dans le nom, l'articulation entre le
`r`, le point médian et le `e`. Pas un pictogramme, pas une seconde métaphore, pas un symbole à
décoder.

## Ce qui est acquis et ne se rediscute pas

Le nom s'écrit **futur•e**, en minuscules, avec le point médian (U+2022). Cette lecture est
intangible : le mot copié, indexé et annoncé par un lecteur d'écran reste `futur•e`.

**Le point médian est déjà l'événement.** Il porte la double lecture (futur, future), la bascule, le
point de décision. Le travail consiste à le dessiner, jamais à lui ajouter un signe qui redirait la
même chose.

L'interface est composée en **Archivo** (grotesque variable, SIL OFL) depuis le 01/08/2026. Le
logotype n'a pas d'obligation de s'y conformer : une marque a le droit d'être d'une autre nature que
son interface. Mais elle doit **cohabiter** avec elle dans une barre de navigation.

## La contrainte mesurée, à connaître avant de dessiner

Métriques lues dans Archivo (unitsPerEm 1000) :

| Élément | Valeur |
| --- | --- |
| Chasse du point médian | 0,350 em |
| Encre du point | de 0,062 à 0,289 em |
| Centre optique du point | 0,344 em au-dessus de la ligne de base |
| Diamètre du point | 0,227 em |
| Le `e` commence visuellement à | 0,390 em |
| **Espace libre entre le point et le `e`** | **0,101 em**, soit 2,2 px à un corps de 22 px |

**Une articulation dessinée doit tenir dans ces 0,101 em, ou assumer d'élargir la chasse.** Élargir
modifie la silhouette du nom : c'est une décision de marque, à prendre explicitement et à montrer
avant et après. Une piste antérieure est morte sur cette mesure, découverte trop tard.

## Ce que trois passages ont éliminé

| Piste | Pourquoi elle est morte |
| --- | --- |
| Le point devient un curseur entre deux crans | Grammaire du **score**, interdite par `ADR-0001` |
| Une ligne de temps sous le mot | Même défaut, et se lit d'abord comme un soulignement |
| Le `e` dédoublé | Se lit spontanément comme un défaut de calage |
| La traverse du `t` prolongée | Se lit spontanément comme une rature |
| Une ligature `u–r` | L'identité ne vit pas là ; le geste est arbitraire |
| Le SVG vectorisé existant | Fige le dessin d'une police écartée, et ne suit pas le thème |

**Le critère qui les a toutes tuées** : elles avaient besoin de leur légende. Les références du
porteur (fuse, Spark, CONNECT) fonctionnent avant qu'on connaisse leur concept.

## Les degrés attendus

Livrer **plusieurs degrés d'intervention**, du presque invisible au franchement distinctif, pour que
le choix se fasse sur des formes et non sur des intentions. Le degré le plus faible doit rester
défendable : ne rien changer est une option légitime.

## Contraintes dures

1. Le point fonctionne **en orange comme en monochrome**. Aucune information ne repose sur une
   couleur ni sur une opacité.
2. À **18 à 20 px de haut**, le mot reste immédiatement lisible et n'évoque jamais une faute, une
   apostrophe, une tache ou un caractère manquant.
3. Un **seuil de simplification déclaré** : sous ce seuil, le dessin se dégrade vers une forme
   légitime, idéalement la marque actuelle. Un logotype sans version petite spécifiée n'est pas
   terminé.
4. Le dessin ne doit **pas suggérer une position sur une échelle**. Voir la doctrine du score.

## Les cinq situations de test

Les grands visuels de présentation avantagent artificiellement toutes les propositions. Le
départage se fait ici, et seulement ici :

1. **Barre de navigation mobile**, 22 px sur fond sombre.
2. **En-tête du rapport**, la surface payante.
3. **Noir et blanc**, sans aucune couleur.
4. **Favicon, 16 px.**
5. **Export PDF du rapport**, où le rendu n'est pas celui d'un navigateur.

### La question que le favicon pose, et qui n'a jamais été traitée

À seize pixels, « futur•e » **n'est pas lisible**, quel que soit le dessin. Le mot ne peut donc pas
être le favicon. C'est le seul endroit du produit qui réclame un **signe autonome**, et aucune des
recherches menées jusqu'ici ne l'a abordé.

Hypothèse à instruire, qui prend le problème par l'autre bout : **le signe propriétaire naît de cette
contrainte**, puis remonte dans le mot. Trois jours de recherche ont pris le chemin inverse, du
grand format vers le petit, et se sont cassés à chaque fois sur la petite taille.

## Ce qui reste vrai après ce brief

Ceci produira un **logotype**, c'est-à-dire un mot dessiné. Tout ce qui a été tenté sans dessinateur
produisait un mot composé avec une intervention CSS, et c'est le plafond de l'exercice sans
typographe.
