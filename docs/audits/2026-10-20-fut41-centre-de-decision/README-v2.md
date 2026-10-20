# FUT-41 / FUT-22 · Passe UX V2 : la direction D, « La planche »

20 octobre 2026 · branche `explore/fut-41-centre-decision` · prototype de revue, données fictives.

- Prototype V2 : `prototype-v2.html` (s'ouvre dans un navigateur ; menu « Données fictives » en haut à droite pour changer de situation, ou `?situation=dix` dans l'adresse).
- Captures : `captures-v2/` (26 images, bureau, tablette, mobile 390 et 360, sombre et clair).
- La V1 (`prototype.html`, directions A, B, C) et le cadrage (`README.md`) sont conservés tels quels.

Rien n'est implémenté dans le produit. Aucune migration, aucune table, aucun droit, aucun prix, aucun appel Anthropic. Les neuf arbitrages du cadrage restent ouverts.

---

## A · Diagnostic UX de la V1

**Pourquoi elle se lit comme un document.** Les trois directions partaient d'une même idée : la comparaison est une suite d'énoncés justes, chacun avec sa preuve dans la marge. C'est la grammaire de `/rapport`, qui sert bien un dossier qu'on lit une fois. Appliquée à une recherche qui dure des semaines, elle produit cinq mouvements de prose avant le premier geste. La justesse des phrases était le livrable de la V1 ; elle a pris toute la place de l'interface.

**Pourquoi le premier écran ne guide pas.** Il s'ouvrait sur un titre de démonstration, puis le Projet en paragraphe, puis « ce qui départage » en phrases. Les possibilités arrivaient en quatrième position, dans un tableau. Rien ne disait quoi toucher, et la seule action visible (« Mettre au même cadre ») était un bouton au milieu d'un paragraphe.

**Ce que ses interactions réussissaient déjà.**
- A : la preuve à côté de l'affirmation, et l'inconnue expliquée plutôt que masquée.
- B : la condition comme lentille, la sélection de deux lieux, le « Et si… ».
- C : la raison d'un écartement gardée avec la version du Projet qui l'a motivée.

Ces quatre gestes sont repris dans D. Ce qui change est leur place : ils deviennent l'interface au lieu d'en être des annexes.

**Pourquoi D est une évolution.** D ne juxtapose pas A, B et C. Elle part d'un objet que le produit possède déjà et que la V1 réduisait à des glyphes de 10 px : l'emblème des trois échelles (cercle, carré, losange). Dans D, chaque lieu de la recherche **est** cet emblème, dessiné à la profondeur où il a été examiné. Le texte arrive ensuite, pour justifier ce que le dessin montre.

---

## B · La direction D, « La planche »

### Le principe central

Une recherche est une **planche de relevé**. Chaque commune est un cercle ; chaque bien est un carré posé **dans** le cercle de sa commune ; un logement examiné est un losange dans son carré. Une forme pleine a été examinée. Une forme pointillée ne l'a pas été. Une commune examinée porte la rose graduée de l'emblème : graduée veut dire mesurée.

On lit donc avant tout texte :
- deux biens dans la même commune partagent un cercle : leur socle territorial commun se voit ;
- une annonce sans adresse est un carré pointillé marqué « ? » dans le cercle de sa commune ;
- une commune non débloquée est un cercle en pointillé fin, sans graduation ;
- une commune seule garde un carré et un losange en pointillé léger : sans adresse, ces échelles ne s'appliquent pas.

### Le geste principal

**Toucher.** Un lieu touché s'ouvre dans le panneau de droite. Un deuxième lieu touché déclenche le **rapprochement**, sous la planche. Aucun glisser-déposer, aucun survol nécessaire : tout passe par des boutons, au clavier comme au doigt.

Le second geste est **la lentille** : chaque condition du Projet est un bouton. Une lentille recolore la planche **en place** : seules les formes de l'échelle où cette condition se lit prennent un trait, à la teinte de leur registre. « Le calme se lit à la commune et aux abords : les cercles et les carrés répondent. » Le lecteur voit qu'à Port-Anvel le cercle est en compromis et que le carré du 12 rue des Sternes l'est aussi, tandis qu'à Saint-Aurec tout correspond.

### L'organisation de l'espace

1. **Le Projet**, en tête, réduit à une phrase et à six lentilles : deux sans compromis (un cadenas), quatre priorités (le poids déclaré en trois barres). Le budget, non mesuré, est dit sur une ligne : aucune possibilité ne gagne à son silence.
2. **Depuis votre visite du…** : une règle courte, de la dernière visite à la prochaine échéance (un carré par événement, un rond pour une révision du Projet, un carré vide pour un événement à venir). Elle se déplie en journal.
3. **La planche**, à gauche, avec le geste « Ajouter une possibilité » et la marge des écartées.
4. **Maintenant**, à droite : les prochaines actions, trois au plus, chacune avec sa raison.
5. **Le rapprochement**, sous la planche, quand deux lieux sont touchés.
6. **Condition par condition**, en bas : toutes les possibilités en jeu, une forme par case, dans l'ordre d'ajout, sans total.

### La comparaison

Le rapprochement est la pièce maîtresse. Chaque condition est **une piste tendue entre les deux lieux** :
- ce qu'ils partagent se pose **au milieu**, sur une ligne continue (« Correspond, tous deux ») ;
- ce qui les sépare est **tiré vers chaque bord**, la ligne coupée au milieu ;
- ce qui reste incertain est relié par un pointillé de la teinte « contrôle » ;
- deux analyses qui ne répondent pas à la même version du Projet sont reliées par des tirets, avec leur révision écrite sous chaque marque ;
- un lieu non examiné à cette échelle n'a pas de ligne : sa marque est une forme vide en pointillé (« il faut une adresse », « adresse inconnue »).

Les pistes sont rangées **par échelle**, du large au précis (Territoire, Autour de l'adresse, Logement). Deux biens de la même commune voient leur bande Territoire repliée en un **socle commun** : un seul trait épais, « une seule lecture pour les deux ». Ce qui les distingue se lit alors aux abords et dans le logement.

En tête, une phrase gabarit dit où se joue la différence (« Ce qui les sépare se lit à la commune et aux abords : des nuits fraîches l'été et le calme. »). Des filtres comptent les pistes par nature (les sépare, pas au même cadre, incertain, en commun, non examiné), ce qui permet de ne garder que ce qui sépare. Toucher une piste ouvre ses preuves des deux côtés : valeur, source, analyse, révision, date, et vos observations. En bas, « Ce qui pourrait changer votre avis » liste les inconnues avec la vérification utile.

**Aucun total, aucun classement.** Le décompte porte sur des natures de différence, jamais sur un lieu. Une condition sans compromis non tenue n'est jamais compensée : la piste dit « rien ne compense », la planche barre le cercle de la commune, et « Maintenant » la place en tête.

### La place du Projet

Le Projet ne se modifie jamais depuis cet écran. On peut :
- l'utiliser (les lentilles) ;
- consulter ses révisions (« Votre Projet · révision 2 du 8 oct. ») ;
- mettre de côté une priorité, en simulation d'affichage, pour voir ce qui sépare encore sans elle. Une condition sans compromis ne se met pas de côté : « pour la changer, il faut réviser votre Projet ».

### L'apparition progressive du raisonnement

Le dessin d'abord, puis le mot d'état sous chaque lieu, puis la phrase gabarit du rapprochement, puis la piste, puis la preuve. Chaque niveau se demande d'un geste. Aucune phrase n'est générée : ce sont des gabarits, nourris par les issues du moteur.

### La place de la mémoire

Pas de grande frise. Trois endroits :
- la règle « Depuis votre visite », qui se déplie en journal ;
- l'histoire de chaque lieu, dans son panneau ;
- **le contexte d'un écartement**, conservé avec la version du Projet qui l'a motivé. Quand cette raison a changé depuis, « Maintenant » le signale : Landéven a été écartée sous « moins de 20 min », le Projet dit aujourd'hui « moins de 30 min ». futur•e ne dit pas si elle y correspondrait.

### Le guidage

« Maintenant » calcule ses points à partir de l'état réel de la recherche, dans cet ordre :
1. une condition sans compromis non tenue ;
2. des analyses qui répondent à une ancienne version du Projet ;
3. un lieu écarté pour une raison que le Projet a changée ;
4. une visite prévue et ce qui reste à y vérifier ;
5. les inconnues qui pourraient changer l'arbitrage ;
6. deux biens en course difficiles à départager sur la priorité principale ;
7. une annonce sans adresse, une adresse non examinée dans une commune déjà lue, une piste, un aperçu gratuit ;
8. une seule possibilité.

Chaque point dit pourquoi il est là. Aucun ne parle de prix ni de délai. Le seul geste d'examen (« Examiner Kermoal ») est marqué « simulation » et explique ce qu'il ouvrirait dans le produit.

### Ce qui la rend singulière

L'emblème des échelles est la signature visuelle de futur•e (accueil, `/rapport`). D en fait **l'unité de la recherche** : un lieu y est dessiné par ce qu'on sait de lui. Aucun comparateur immobilier ne représente un bien comme une profondeur d'examen emboîtée dans le territoire qui le porte.

---

## C · Le prototype

`prototype-v2.html`, un seul fichier, sans dépendance hors des polices. Ce qui est réellement fonctionnel :

| # | Demande | Où |
| --- | --- | --- |
| 1 | Retrouver toutes les possibilités | la planche, filtres « En course » et « À considérer » au-delà de quatre lieux, marge des écartées |
| 2 | Sélectionner un lieu et comprendre son état | toucher une forme ou son nom ; panneau avec emblème, échelles, conditions |
| 3 | Rapprocher deux possibilités | toucher un deuxième lieu, ou « Rapprocher avec » dans le panneau |
| 4 | Passer d'une condition à l'autre | les six lentilles du Projet |
| 5 | Voir la comparaison évoluer | la piste de la condition passe en tête et s'ouvre ; la planche se recolore en place |
| 6 | Explorer Territoire, Autour, Logement | bandes du rapprochement, socle commun, formes cliquables de l'emblème du panneau |
| 7 | Ouvrir une preuve | toucher une piste, ou une condition dans le panneau |
| 8 | Identifier une inconnue et une vérification | « Ce qui pourrait changer votre avis », « Ajouter à la visite du 24 oct. », liste « Mes vérifications » |
| 9 | Ajouter une possibilité non examinée | « Ajouter une possibilité » : Kerlavan (piste) ou 4 rue de l'Écluse (adresse dans une commune déjà lue) |
| 10 | Retrouver une possibilité écartée | Landéven, son motif, la version du Projet d'alors, « Reprendre cette piste » |

Simulations, toutes marquées comme telles : « Mettre au même cadre » (relit les analyses comme si elles avaient été actualisées ; la piste glisse vers le milieu quand l'écart disparaît), « Examiner… », les ajouts, la mise de côté d'une priorité. Les notes, vérifications et écartements sont gardés le temps de la page.

### Les huit situations du menu « Données fictives »

| Situation | Ce qu'elle éprouve |
| --- | --- |
| Votre recherche | cinq possibilités, une écartée, deux analyses hors cadre |
| Une seule possibilité | le centre comme prolongement d'un dossier d'adresse : la fiche est ouverte, « Maintenant » invite à ajouter un lieu |
| Deux possibilités | rapprochement ouvert d'emblée |
| Dix possibilités | six communes, quatre biens ; trois biens dans un cercle ; une commune barrée (mer à 31 km) |
| Deux logements, même commune | socle territorial replié ; la différence se lit aux abords (calme) et dans le logement (nuits fraîches) |
| Une commune non débloquée | l'aperçu gratuit en pointillé, « hors départage » sur chaque piste |
| Deux analyses hors cadre | cinq différences « pas au même cadre », puis la simulation |
| Retour après un mois | règle et journal dépliés depuis le 19 septembre |

---

## D · Captures

Dans `captures-v2/` :

| Fichier | Contenu |
| --- | --- |
| `01-vue-initiale-sombre` | premier écran |
| `02-une-possibilite` | 12 rue des Sternes ouvert |
| `03-deux-possibilites-rapprochees` | Sternes et Kervily, hors cadre |
| `04-condition-activee-planche`, `05-…-rapprochement` | lentille « le calme » |
| `06-plusieurs-echelles-meme-commune` | socle commun, Sternes et Goélands |
| `07-preuve-ouverte-apres-meme-cadre` | preuve « nuits fraîches », après la simulation |
| `08-action-guidee-landeven-ecartee`, `09-…-preparer-visite` | deux actions de « Maintenant » |
| `10-donnees-incompletes-commune-non-debloquee`, `11-…-annonce-sans-adresse` | données incomplètes |
| `12-ajout-possibilite-non-examinee` | 4 rue de l'Écluse dans le cercle de Saint-Aurec |
| `13-dix-possibilites-page-entiere` | dix lieux, page entière |
| `14-retour-apres-un-mois`, `15-une-seule-possibilite` | situations |
| `16-vue-initiale-claire`, `17-rapprochement-clair` | thème clair |
| `18-tablette-820` | tablette |
| `19` à `22`, en 390 et 360 | mobile : premier écran, fiche, rapprochement, bandes d'échelles |

Vérifié par script à chaque largeur : aucune erreur JavaScript, aucun défilement horizontal de la page ni de la feuille mobile.

---

## E · Évaluation critique

**Ce qu'elle rend immédiatement plus compréhensible.**
- Le niveau d'examen de chaque lieu, sans lire un mot.
- Le socle commun de deux biens d'une même commune.
- Ce qui sépare deux lieux : au bord, et non au milieu.
- Une condition sans compromis non tenue, visible sur la planche avant toute comparaison.
- Quoi faire maintenant, et pourquoi.

**Ce qu'elle rend plus compliqué.**
- La grammaire des formes s'apprend. Un premier lecteur ne sait pas qu'un carré dans un cercle veut dire « un bien dans sa commune » ; la légende n'existe qu'à travers la lentille et le bas de page. Il faudra une première visite guidée ou une légende repliable.
- La planche ne dit rien de la géographie. Deux communes voisines et deux communes à 60 km se dessinent pareil. J'ai écarté la carte (proposition FUT-87 : un faux relevé se lit comme une donnée) ; c'est un arbitrage à confirmer.
- Le rapprochement reste long : neuf pistes pour deux biens examinés à toutes les échelles. Les filtres et le socle replié aident ; il manque peut-être un état replié par défaut des pistes « en commun ».

**Risques de surcharge.**
- Au-delà de dix lieux, la planche devient une grille de cercles semblables. Il faudra regrouper (par état, par commune) ou réduire les emblèmes des lieux « à considérer ».
- « Maintenant » peut accumuler sept points ; la limite à trois est arbitraire et doit être éprouvée sur de vrais comptes.
- La teinte des registres sur la planche (lentille) ajoute de la couleur à un écran qui en portait peu. Elle reste liée à un geste explicite.

**Interactions difficiles sur mobile.**
- Le rapprochement passe dans une feuille plein écran : on perd la planche de vue pendant la comparaison.
- Le second lieu se choisit par « Rapprocher avec », pas sur la planche : c'est fiable mais moins direct.
- Le tableau « Condition par condition » défile dans son propre conteneur au-delà de cinq lieux.
- Les pistes tiennent à 360 px, mais deux libellés longs (« Moins bien que demandé · rév. 1 ») passent sur deux lignes.

**Composants du Relevé réutilisés.** Jetons de `design-tokens.css` et de `releve.module.css` (fonds, plaque, encre, filets, six registres, mouvement FUT-75), la plaque à coins de coupe, le surtitre en Archivo semi-condensée, le trait de registre de 3 px, la marge de preuve (grain, valeur, source, date), les glyphes de grain, l'emblème et sa rose graduée, la règle du temps (sous forme courte).

**Propositions à soumettre à FUT-118** (aucune n'est adoptée) :
1. *L'emblème d'un lieu* : l'emblème des échelles en état par lieu (plein, pointillé, points fins), emboîté pour plusieurs biens d'une commune.
2. *La piste de rapprochement* : commun au milieu, séparé au bord, incertain en pointillé, hors cadre en tirets, non examiné sans ligne.
3. *Le socle commun* : une bande d'échelle repliée en un trait quand les deux lieux partagent la même lecture.
4. *La lentille* : une condition qui recolore des formes en place, avec la phrase « se lit à… ».
5. *La marque d'issue* : forme de l'échelle et teinte du registre, pleine si établie, pointillée sinon, barrée si une condition sans compromis n'est pas tenue.
6. *La règle courte « Depuis votre visite »*, déclinaison de la règle du temps à l'échelle des jours.
7. *La barre d'incompatibilité sur l'emblème* (diagonale en teinte « incompatibilité »).

**Ce qui ne pourra être validé qu'avec de vrais artefacts.**
- La distribution réelle des issues : combien de pistes « en commun » entre deux lieux réels, et si la planche reste lisible quand presque tout correspond.
- La fréquence du hors cadre une fois les révisions du Projet en place.
- L'échelle à laquelle le moteur établit vraiment chaque condition (la correspondance condition → échelle est fixée à la main ici).
- Les preuves réelles, souvent plus longues que les valeurs fictives.
- Le comportement de la règle « Depuis votre visite » avec des dizaines d'événements.

---

## F · Recommandation

**Oui, cette V2 commence à ressembler à l'expérience centrale de futur•e.** Le premier écran se comprend sans lecture : un Projet, des lieux dessinés à leur profondeur, trois choses à faire. La comparaison se manipule. Les trois échelles portent la navigation, et la même grammaire relie l'accueil, `/rapport` et le centre de décision.

**Ce qui reste faible, explicitement :**
1. **L'apprentissage des formes.** Sans légende ni première visite, la planche est belle mais muette pour un nouveau venu. C'est le premier risque à éprouver en test.
2. **L'absence de géographie.** Je la crois juste, mais un utilisateur qui hésite entre deux côtes voudra voir la distance. À arbitrer.
3. **La longueur du rapprochement** pour deux biens entièrement examinés.
4. **Le mobile** est utilisable, sans être encore pensé pour la visite sur place (liste de vérifications hors ligne, notes rapides).
5. **Le guidage** est juste mais nombreux ; son ordre et sa limite sont des conventions à présenter avant d'être codées.

**Arbitrages UX proposés** (s'ajoutent aux neuf du cadrage) :

| # | Question | Ma proposition |
| --- | --- | --- |
| U1 | Retenir « La planche » comme direction de travail ? | oui, avec A comme registre de lecture des preuves |
| U2 | Carte géographique ou planche abstraite ? | planche ; distance à un point de référence en texte, si l'arbitrage 5 du cadrage le retient |
| U3 | Comparer à deux, ou à trois ? | deux ; « Condition par condition » couvre la vue d'ensemble |
| U4 | Légende des formes | une légende repliable sous la planche, et la première visite guidée |
| U5 | Limite de « Maintenant » | trois points, ordre ci-dessus, à revoir sur données réelles |
| U6 | Mobile en visite | chantier distinct, après validation de U1 |

Arrêt ici pour revue. Aucun ticket n'est créé et aucun statut n'est modifié.
