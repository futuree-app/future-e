# ADR-0010 : Les modules sont des mailles ; la santé et la mobilité sont des thèmes

- **Statut** : accepté
- **Date** : 2026-07-14
- **Source** : question du porteur (« si futur•e devient un quadriptyque, on supprime des modules ? »),
  déclenchée par le lot de couverture climat. Révise `modules/_README.md`.

## Contexte

`modules/_README.md` annonce sept pages : Territoire, Logement, **Santé**, **Mobilité**, **Métier**,
**Projets**, Comparateur. **Cinq n'ont jamais été écrites.** Ce n'est pas un retard de documentation :
c'est le symptôme. Une page ne s'écrit pas quand son objet n'existe pas.

Trois faits, vérifiés, ont rendu le diagnostic évident.

**1. Météo-France range les mêmes données sous des thèmes différents.** ClimaDiag classe les *jours très
chauds* et les *nuits chaudes* en **santé**, et les *pluies intenses*, la *sécheresse* et le *feu* en
**risques naturels**. Ce sont les mêmes indicateurs DRIAS. Les nuits tropicales que le dossier vient de
coder comme un fait *climat* sont, chez Météo-France, un fait *sanitaire*. Aucun des deux n'a tort :

> **La santé environnementale n'est pas un gisement de données. C'est une LECTURE.**
> Le même chiffre est un fait climatique, sanitaire ou agricole selon la question posée.

Un module est un conteneur. Il ne peut pas contenir une lecture. D'où l'impossibilité d'écrire `santé.md`.

**2. La santé environnementale est DÉJÀ répartie sur les mailles, de fait.** `air_sain`, `calme_sonore`,
`faible_exposition_industrielle` et `faible_pression_agricole` sont des critères du comparateur, au grain
**commune**. Le radon, les argiles, le DPE et le bruit de façade vivent dans Logement, au grain
**adresse**. Il n'y a rien à déplacer : la matière est là où elle est vraie.

**3. Le « quartier » n'existe pas partout.** La décision ÎCU l'a établi : **59 % des communes n'ont qu'un
seul IRIS**. Pour l'essentiel de la France, quartier = commune. Ce n'est donc pas une maille au même titre
que les deux autres.

## Décision

### La structure de futur•e

```
LE PROJET DE VIE            la PRÉMISSE. Jamais un module : c'est l'entrée (UserProject).
      ↓
TERRITOIRE                  la commune et son bassin de vie
AUTOUR DU LIEU              ce qui entoure l'adresse (un RAYON, pas un découpage administratif)
LOGEMENT                    le bâtiment et la parcelle
      ↓
DÉCISION                    ce qui correspond, ce qui ne correspond pas, les réserves, les limites,
                            et ce qu'il reste à vérifier
```

**Une prémisse, trois mailles, un dossier.** Les mailles sont **emboîtées**, pas parallèles.

### Les thèmes traversent les mailles

Climat, santé environnementale, mobilité, services, vie locale, nature, emploi, coût. Ils disent
**pourquoi** l'information compte ; la maille dit **où** elle s'observe. Un thème n'est pas un écran.

Exemple, la santé environnementale :

| Maille | Ce qu'elle en dit |
|---|---|
| Territoire | chaleur, air de fond, pression agricole, présence industrielle, bruit des infrastructures |
| Autour du lieu | axe routier proche, îlot de chaleur, site pollué voisin, parcelle agricole mitoyenne |
| Logement | confort d'été, orientation, ventilation, radon, argiles |

### Ce qui est supprimé, et ce qui ne l'est pas

**Supprimés** : les *conteneurs* Santé, Mobilité, Métier, Projets. Ils n'ont aucun code : on ne supprime
pas un module, on **renonce à en construire un qui n'existe pas**. C'est le moment le moins cher de toute
la vie du produit.

**Conservées, et c'est non négociable** : les **promesses**. « Santé environnementale » et « mobilité »
restent des mots du produit, visibles dans l'offre, dans les chapitres du dossier, dans les pages `/savoir`
et dans le SEO (un thème = un slug, cf. les hubs). Le moat est *climat + santé environnementale* : tuer le
conteneur ne doit **jamais** tuer le nom.

### Les deux cas particuliers

**Emploi.** La *structure économique du territoire* (bassin, taille, diversité) est un thème de maille
communale, comme un autre. « **Mon métier** peut-il fonctionner ici ? » est un croisement projet ×
territoire : cela appartient à la **Décision**, pas à un module. Un module Emploi ne se justifierait que si
futur•e développait une vraie profondeur (offres, salaires, navettes, télétravail).

**Projets.** Deux réalités se cachaient derrière le mot. Le *projet du lecteur* est la prémisse (déjà
`UserProject`). Les *projets qui transforment le lieu* se rangent selon leur maille. Mais **attention** :
la veille événementielle a déjà été écartée (quatre flux disqualifiés, 87 % des communes muettes, « le
territoire ne bouge pas, le lecteur si »). Ne pas rouvrir un chapitre « Transformations » sans données.

## Conséquences

- **Aucune migration de code.** Le moteur travaille déjà en thème × maille. C'est une **re-nomination**,
  pas un chantier.
- **La couverture de la santé environnementale est DÉBLOQUÉE**, immédiatement. Le module n'était pas
  l'habilitateur : il était le bloqueur. Quatre critères (`air_sain`, `calme_sonore`,
  `faible_exposition_industrielle`, `faible_pression_agricole`) peuvent recevoir des règles au-dessus de
  données déjà présentes, exactement comme le climat vient de le faire.
- **« Autour du lieu » n'existe pas sans adresse.** Le comparateur gratuit est **anonyme**, au grain
  commune : la navigation à trois mailles décrit le **rapport**, pas tout le produit. Le dire, plutôt que
  de promettre une maille qu'on ne peut pas remplir.
- **Une seule navigation.** Les thèmes ne reçoivent pas de second système de navigation (pas de vue
  transversale agrégée en v1) : ce serait construire deux navigations pour un produit qui n'en a pas
  validé une. La vue thématique agrégée reste une hypothèse, à instruire si un besoin l'exige.

## Ce qui aurait dû nous alerter plus tôt

La doctrine du module Logement avait dû écrire une **frontière** explicite (« pollution, sols, industrie,
radon → Santé »). Une frontière qu'il faut décréter entre deux modules est presque toujours le signe que
la ligne de découpe est fausse. Ici, elle l'était : ces objets n'appartiennent pas à un module, ils
appartiennent à une **maille** (l'adresse) et à un **thème** (la santé).
