# Données : granularité et honnêteté géographique

> Règle durable. Source : `Documentation Notion/.../04 3 — Règles de granularité
> géographique`. Découle de l'invariant n°5 (`principes/invariants.md`). Voir aussi
> `/memory/home_insee_code_pitfall.md`.

futur•e croise des données à des échelles très différentes. C'est normal. **Le risque n'est
pas d'avoir des granularités mixtes, c'est de faire croire qu'elles sont équivalentes.**

## Principe général

Chaque donnée conserve sa **granularité native**. Toute agrégation, approximation ou
correspondance est explicite, documentée et assumée, dans la base comme dans la restitution
éditoriale.

## Règles

1. **Ne jamais surpromettre la précision.** Une donnée communale n'est jamais présentée
   comme une vérité à l'adresse. Pas « Votre immeuble sera exposé à… », mais « Dans votre
   commune… », « Autour de votre localisation… ».
2. **Conserver le niveau géographique d'origine.** Chaque valeur stockée porte son échelle
   réelle (DRIAS = grid_cell, BAN = address/point, Géorisques = commune ou zonage, INSEE =
   commune/IRIS/département, baignade = site).
3. **Hiérarchie géographique explicite.** Ordre de référence auquel toute source se rattache :
   address, point, grid_cell, commune, iris, epci, department, region.
4. **Séparer géocodage et interprétation.** Qu'un utilisateur entre une adresse ne rend pas
   toutes les données précises à cette adresse. Distinguer ce qui vient d'un point géocodé,
   d'une commune, d'une maille climatique, d'un zonage, d'une station proche.
5. **Documenter les règles de rattachement par source.** Ex. : BAN (adresse → coordonnées +
   INSEE), DRIAS (point → maille la plus proche), Géorisques (INSEE ou zonage selon couche),
   baignade (point → site balnéaire pertinent).
   - **Eaufrance / SISE-Eaux (eau potable)** : la donnée n'est pas nativement communale, elle
     est agrégée par Unité de Distribution (UDI). Une commune peut dépendre de plusieurs UDI de
     qualité différente : ne jamais présenter « l'eau de la commune X » sans réduire
     l'affirmation à l'UDI de rattachement. *(Vérifié sur data.gouv.fr, fiche SISE-Eaux,
     2026-07-01.)*
   - **ATMO (qualité de l'air)** : l'indice classique se calcule « en situation de fond », sans
     tenir compte des phénomènes de proximité (effet canyon entre bâtiments, exposition en bord
     d'axe routier). Un indice communal moyen masque une surexposition réelle à l'échelle de la
     rue : ne jamais dire « l'air à {commune} est bon » sans nommer cette limite si le contenu
     s'approche d'une lecture à la rue. *(Vérifié sur atmo-hdf.fr, « Carte stratégique de
     l'air », 2026-07-01.)*
6. **Préférer la cohérence à l'hyper-précision.** Quand deux sources ont des mailles
   incompatibles, remonter à une échelle robuste plutôt que produire un croisement
   artificiellement précis.
7. **L'incertitude géographique apparaît dans le produit.** La narration explicite la limite :
   « Cette projection repose sur la maille DRIAS la plus proche », « Cet indicateur est
   disponible à l'échelle de la commune », « Cette donnée traduit une tendance territoriale,
   pas une mesure à l'adresse ».

## Horizon temporel : seulement là où la donnée est projetée

Un sélecteur d'horizon (2030 / 2050 / 2100) ou toute mention d'échéance future ne
s'affiche que sur les contenus réellement projetés : Territoire/Quartier (DRIAS), Santé,
Métier. Les modules à données présentes (Logement, Mobilité, Projets) ne revendiquent
aucune projection : leur texte ne mentionne pas l'horizon, sous peine de promettre une
trajectoire qu'on n'a pas. Formule de cadrage validée : « les données s'adaptent quand
c'est possible ». Une donnée présente affichée dans un module projeté (ex. qualité de
l'air actuelle) doit être explicitement nommée comme point de départ, pas comme
projection.

## Scénarios DRIAS = GWL, affichés à l'échelle France

Les scénarios DRIAS-TRACC utilisés (`gwl15` / `gwl20` / `gwl30`) sont des Global Warming
Levels : un réchauffement **mondial** de +1,5 / +2 / +3 °C, pas des RCP/SSP. Mais la France
métropolitaine se réchauffe environ 1,5× plus vite que la moyenne mondiale. **Décision
d'affichage (2026-06-25) : futur•e affiche partout l'échelle France**, conforme au cadrage
national TRACC/PNACC-3 : +2 °C en 2030, +2,7 °C en 2050, **+4 °C en 2100** (gwl30). Donc
« gwl30 = +4 °C » est correct à l'échelle France et doit être retenu (la lecture « +3 °C »
serait l'échelle mondiale du même scénario). Règle : tout label de scénario dit son échelle,
l'interface ne mélange jamais mondial et France d'un écran à l'autre, et l'échelle par défaut
est la France. À harmoniser sur toutes les surfaces (HorizonBar, dashboard, fiches) et dans
le glossaire de `doctrine/editoriale.md`.

## La question de contrôle

Le produit doit toujours pouvoir répondre à : **à quelle échelle cette affirmation est-elle
vraie ?** Si la réponse est floue, la donnée n'est pas utilisée telle quelle dans une
restitution.

## Confidentialité

futur•e **ne stocke jamais l'adresse exacte** de l'utilisateur. La table `accounts` ne porte
que `home_insee_code` (et `report_grants.active_insee_code` pour le territoire actif, voir
ADR-0003) : aucune colonne adresse. L'adresse saisie sert au géocodage en mémoire, pas au
stockage. Cohérent avec la doctrine de granularité : on ne conserve que l'échelle à laquelle
on restitue honnêtement. *(Vérifié dans le schéma Supabase, 2026-06-25.)*

## Doctrine

futur•e gagne sa crédibilité non en promettant une précision absolue, mais en disant
clairement ce qui est local, ce qui est territorial, ce qui est projeté, et ce qui reste
incertain.

## Liens

`doctrine/editoriale.md` (formulations honnêtes), `principes/invariants.md` (n°3 et n°6),
`recherches/inventaire-sources.md` (terrain de l'agent Data Curator),
`/memory/home_insee_code_pitfall.md`.

## Un équipement n'est pas un refuge

> Règle ajoutée le 2026-08-03, après l'examen de la cartographie « Refuges climatiques »
> (TRIBU, labos toulousains, Toulouse Métropole, financement ADEME, données sous ODbL).

**Un équipement susceptible d'accueillir pendant une forte chaleur n'est pas, à lui seul, un
refuge.** futur•e distingue trois niveaux de preuve, et ne les mélange jamais dans une même
affirmation :

| Niveau | Ce qu'on sait | D'où ça vient |
| --- | --- | --- |
| **Lieu potentiel** | l'équipement existe et il est à telle distance | BPE, OSM : sources canoniques déjà lues par le module Autour |
| **Conditions favorables observables** | couvert arboré, plan d'eau, taille du parc, distance à pied | mesuré, mais ce sont des indices, jamais une garantie de fraîcheur |
| **Refuge documenté** | la fraîcheur, l'ombrage, l'accès ou les horaires ont été caractérisés | collectivité, étude, ou contribution locale attribuée |

**Pourquoi la règle existe.** BPE et OSM disent qu'une médiathèque est à dix minutes. Ils ne disent
pas qu'elle est climatisée, ouverte pendant la canicule, gratuite, ni qu'on peut y rester sans
consommer. Reprendre l'étiquette « refuge » sur un équipement reviendrait à afficher une promesse
thermique que rien ne mesure, ce qu'interdit le principe « on n'affirme jamais au-delà de la preuve ».

**Corollaire chiffré, mesuré sur l'API le 03/08/2026** : sur 42 547 lieux publiés, les trois quarts
sont des imports de bases publiques (IGN bibliothèques, parcs, musées, piscines, cinémas ; Institut
Paris Région), que futur•e possède déjà. Les lieux portant une **qualification réelle** sont
**environ 160** : 159 « espace très ombragé », 157 « espace très frais ». Soit **0,4 %**. La couche
qui aurait de la valeur existe, elle est minuscule, et le niveau « refuge documenté » serait vide
presque partout.

**Ce que ça n'interdit pas.** Le troisième niveau reste la bonne cible produit, et la question qu'il
adresse est bien résidentielle (« aurai-je un endroit où me réfugier »), pas météorologique. Il se
remplira par les collectivités et les études avant de se remplir par la contribution.

### Tension ouverte : deux faits résidentiels vivent hors du moteur

Relevé par le porteur le 03/08/2026, en instruisant la lecture ci-dessus. **L'îlot de chaleur du
secteur et l'espace vert le plus proche ne sont pas des `DecisionFact`** : ils vivent dans
`Face3Snapshot`, donc dans l'affichage du module Autour, sans poids, sans matérialité et sans effet
sur le verdict.

C'est étrange pour deux faits qui pèsent sur une décision résidentielle, et ça mérite d'être
instruit. Deux lectures possibles, non tranchées : ou bien ils manquent au registre de matérialité
et devraient y entrer, ou bien ils relèvent du décor d'un lieu plutôt que d'une condition du projet,
et leur place est bien celle qu'ils occupent.

Conséquence pratique connue : tant qu'ils restent hors du moteur, aucune de leurs compositions ne
peut créer de double comptage. Le jour où ils y entreraient, la règle du § composition s'applique,
une lecture liée remplace ses composants au lieu de s'y ajouter.
