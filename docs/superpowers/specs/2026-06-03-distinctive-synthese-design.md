# Trait distinctif → moment de différenciation (synthèse + AskFuture) — design

Date : 2026-06-03
Statut : design validé (porteur), prêt pour plan d'implémentation.

## Problème — « cartes jumelles » (identifié par Cowork)

Aujourd'hui : les cartes savent différencier les territoires, le moteur sait ce qui les distingue
(`MatchResult.distinctive`, déjà transmis à la synthèse et à AskFuture), mais la **synthèse
continue souvent à raconter pourquoi les communes ressortent sans raconter ce qui les sépare**.
Le prompt de synthèse traite le trait distinctif en « usage sélectif, n'en faites pas
l'inventaire » : ce contrat produit le lissage. Résultat : l'utilisateur qui lit la synthèse
après les cartes a une impression d'uniformité, alors que les cartes montraient des différences.

## Objectif

La synthèse doit comporter un **moment de différenciation explicite**, distinct du moment
« pourquoi ces communes ressortent ». Quand l'utilisateur lit la synthèse après les cartes, il
retrouve les **mêmes arbitrages et les mêmes différences**.

## Doctrine (porteur) — à inscrire explicitement dans le prompt

- Les **critères demandés** expliquent **pourquoi** les communes ressortent (le score).
- Les **traits distinctifs** expliquent **ce qui les différencie**.
- Un trait distinctif **peut porter sur une dimension non demandée** : c'est une part importante
  de sa valeur (révéler des différences réelles qui n'ont pas participé au score).
- Il ne devient **jamais** une justification du classement ni un avantage absolu.
- Il reste une **différence relative** entre les propositions affichées.

Cette séparation évite à la fois le lissage des communes ET la dérive du récit hors des critères
réellement utilisés par le moteur.

### Exemples (à mettre dans le prompt)

✔ Autorisé :
> Aurillac est la plus proche de la montagne, tandis qu'Ussel propose un bassin de vie plus compact.
> Quimper présente les étés les plus supportables des options proposées, tandis que Narbonne
> bénéficie d'un ensoleillement plus marqué.

✘ À éviter :
> Aurillac est meilleure car elle est proche de la montagne.
> Quimper est préférable grâce à son climat.

## Données — le moteur fournit déjà la matière

`buildDistinctive(picks, littoralIndex)` renvoie **un trait par commune** (le plus saillant,
relatif au groupe affiché, libellé « le plus X des trois/deux »), ou rien si aucune commune ne se
détache. Vérifié sur trois recherches : 3/3 communes portaient un trait, sur des dimensions
différentes. **Aucun enrichissement du calcul n'est nécessaire** (pas de second trait par commune).

## Moteur — un seul fix de cohérence

`buildDistinctive` : les candidats « la plus grande ville » / « la plus petite ville » utilisent
encore `c.population` (taille communale). Le chantier C a basculé la sémantique de taille sur
l'**unité urbaine** partout ailleurs ; sans alignement, la synthèse raconterait une taille
incohérente (une commune de banlieue qualifiée « la plus grande ville »). Correction : ces deux
candidats utilisent `tailleVille(c)` (pop d'UU, fallback pop communale) au lieu de `c.population`.
Le mode `ratio` (seuil d'écart structurant) et les libellés restent inchangés. Aucun autre
changement moteur.

## Synthèse (`synthesize/route.ts`) — cœur, réécriture de deux sections du prompt

### a) STRUCTURE
Ajouter une étape explicite de différenciation : **dès que ≥2 communes affichées portent un trait
distinctif**, le récit dit ce qui les sépare (une phrase, adossée aux traits fournis). Si moins de
2 traits sont fournis, dire honnêtement que les profils sont proches — pas de moment forcé, pas
d'invention.

### b) Section TRAIT DISTINCTIF
Basculer de « usage sélectif, n'en faites pas l'inventaire » vers « racontez ce qui sépare les
options, à partir des traits fournis ». Règles inscrites :
- n'utiliser **que** les traits réellement fournis (un par commune) ; jamais inventer ni
  extrapoler un axe absent ;
- présenter chaque trait comme une **différence relative** entre les communes proposées, jamais un
  avantage absolu (« est la plus proche de la montagne », jamais « est meilleure car… ») ni une
  raison de classement (le score est déjà décidé par les critères) ;
- un trait **peut** porter sur une dimension non demandée (c'est légitime et utile) ; ce qui est
  interdit, c'est l'invention par le modèle et la dérive vers des dimensions non fournies ;
- une commune **sans** trait distinctif → « ne se détache pas nettement » (formulation neutre),
  sans fabriquer d'axe ;
- rester sobre : une phrase de différenciation, pas un inventaire exhaustif.
- inclure les exemples ✔/✘ ci-dessus dans le prompt.

La hiérarchie reste : critères demandés = récit principal (« pourquoi »), traits = moment de
différenciation (« ce qui sépare »). La règle existante de couverture des critères demandés est
conservée.

## AskFuture (`ask/route.ts`)

La section « SI UN trait_distinctif EST DONNÉ » existe déjà et répond à « qu'est-ce qui les
distingue ? ». Léger renfort de vocabulaire pour aligner la doctrine : différence **relative**
entre options affichées, jamais avantage absolu ni raison de score. Pas de refonte.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint`.
2. Témoin moteur : `/match` (ex. recherche taille) → un trait « la plus grande/petite ville »
   reflète la taille d'**agglomération** (pas une commune de banlieue qualifiée « la plus grande »).
3. `curl /synthesize` sur 2-3 recherches « cartes jumelles » : la synthèse contient un moment de
   différenciation **qui nomme les traits réels** renvoyés par `/match` (cohérence cartes ↔
   synthèse) ; aucun chiffre ; aucun trait inventé ; aucune formulation d'avantage absolu
   (« meilleure car », « préférable grâce à »).
4. Témoin « profils proches » : une recherche où <2 traits sont fournis → la synthèse dit que les
   profils sont proches, sans fabriquer de différence.
5. `curl /ask` « qu'est-ce qui distingue ces communes ? » → réponse adossée aux traits fournis,
   en différences relatives.

## Hors périmètre

- Enrichissement de `buildDistinctive` (second trait par commune) : non, un trait suffit.
- `cadre_calme` et le reste du moteur : inchangés.
- Nouvelle donnée : aucune (tout existe déjà).

## Notes doctrine

- Cf. [[project_trait_distinctif]] (doctrine du trait distinctif : rare, impact projet de vie,
  relatif aux communes affichées), [[project_taille_ville]] (tailleVille, dont dépend le fix de
  cohérence), [[project_signaux_ambiants_askfuture]] (la synthèse ne reçoit pas les signaux
  ambiants ; ce chantier ne touche que le trait distinctif), [[feedback_no_em_dash]].
