# Comparaison complète des 3 communes (Pack Décision) — design

Date : 2026-06-05
Statut : design validé en brainstorming, prêt pour writing-plans
Branche cible : `feat/comparateur-complet` (une branche par chantier, merge ff-only sur main)

## 1. Contexte et périmètre

Le parcours produit est : parcours projet de vie, synthèse, comparateur 3 communes
(gratuit), AskFuture, Pack Décision 39 euros. Le comparateur 3 communes gratuit
(`CompareView.tsx`, mergé sur main) est un **révélateur d'arbitrages** : identité, 2
forces, 1 compromis, zéro chiffre. Il montre LES DIVERGENCES, le héros du gratuit.

Le Pack Décision débloque la **comparaison complète** des 3 territoires sur l'ensemble
des critères. Ce chantier conçoit UNIQUEMENT cette vue complète et la sortie moteur qui
l'alimente.

**Hors périmètre (specs séparées) :**

- Le déverrouillage payant (état acheté, gating du payload, SKU réel).
- L'AskFuture du pack (« posez vos questions »).
- Les « jusqu'à 3 nouvelles pistes ».
- Le teaser depuis la CompareView gratuite vers la comparaison complète (ordre imposé
  par le porteur : construire la comparaison d'abord, dessiner le teaser ensuite).
- Le rapport par commune (autre surface du Pack), où vivent les récits profonds.

## 2. Doctrine

La comparaison complète est un **instrument de décision**, pas une étude territoriale.
Question implicite de chaque ligne : « si cette dimension compte pour vous, lequel des
trois prend l'avantage ? ». Pas « quel score obtient chaque commune ? ».

Principes verrouillés (mémoires projet) :

- **On nomme, on ne mesure pas.** Jamais de score 0-100 affiché, jamais de rond ni de
  jauge (le cerveau lit « plus rempli = meilleur », c'est le réflexe « 87 vs 84» qu'on a
  passé des semaines à fuir).
- **Décrire, pas juger.** Le mot du palier dit la réalité du territoire, jamais une note.
- **La comparaison arbitre, le rapport raconte.** Frontière nette : aucun récit profond
  (héritage industriel, littoral, pression éco, démographie narrative) dans la
  comparaison. Ils restent au rapport par commune.
- Pas de tiret cadratin. Tooltips courts orientés compréhension, sans méthodo ni source.
- Largeur de texte : pas de `max-w` plus étroit que le bloc bordé.

## 3. Architecture

Deux pièces :

1. **Sortie moteur** : un profil par dimension pour le trio affiché, exposé dans
   `MatchOutcome` (nouveau champ, à côté des `MatchResult` existants). Déterministe,
   aucune IA. Réutilise `subScore(key, commune)` (déjà 0-100, direction par dimension) et
   la mécanique de bandes nationales de `AMBIENT_DIMENSIONS`.
2. **Vue** : une bascule client dans `/ou-vivre` (comme CompareView), atteinte une fois le
   Pack acheté (le gating est hors périmètre ; on prévoit le point d'entrée, pas la
   serrure). Style maison : `.glass rounded-2xl`, titres Instrument Serif, accent orange.

Le moteur calcule déjà toute la matière (subScores des 27 dimensions, récits source
dominante, divergences via les signaux ambiants). Le chantier est de la **présentation**
plus une couche de mise en palier. Risque technique faible.

## 4. Modèle de données (sortie moteur)

Pour le trio affiché (les 3 communes retenues), le moteur produit :

```
ComparaisonComplete {
  themes: ThemeBloc[]            // 7 thèmes, ordre fixe
  chapeau: string[]              // 3 à 4 libellés courts « ce qui les sépare vraiment »
}

ThemeBloc {
  id: string                     // climat, risques, sante_env, cadre, mobilite, services, vitalite
  titre: string                  // « CLIMAT », « SANTÉ ENVIRONNEMENTALE »…
  synthese: string               // phrase déterministe (cf. §7)
  lignes: DimensionLigne[]
}

DimensionLigne {
  id: string                     // une DIMENSION (pas une préférence)
  label: string                  // « Calme sonore », « Étés frais »
  avantage: Avantage             // { type: "avantage", insee } | { type: "egalite" }
  cellules: Cellule[]            // 3, dans l'ordre d'affichage des communes
}

Cellule {
  insee: string
  palier: string                 // mot incarné absolu (« Très préservé »)
  qualifier: string | null       // suffixe court non chiffré (« marqué par un axe routier ») ou null
  disponible: boolean            // false = donnée non mesurée pour cette commune
}
```

`MatchResult` et ses champs narratifs gatés restent inchangés (ils servent le rapport).

## 5. Les 27 dimensions, 7 thèmes (ordre fixe)

Mapping des 28 clés de préférence vers 27 dimensions (la taille de ville fusionne
`eviter_grandes_villes` et `prefere_grande_ville` en une dimension « Taille de ville »).

| Thème | Dimensions (clé moteur) |
| --- | --- |
| **Climat** | Étés frais (`faible_chaleur`), Douceur (`douceur_climat`), Ensoleillement (`ensoleillement_recherche`) |
| **Risques naturels** | Inondation (`faible_risque_inondation`), Feu (`faible_risque_feu`), Pluies intenses (`faible_precip_extremes`), Sécheresse (`faible_secheresse`) |
| **Santé environnementale** | Air (`air_sain`), Calme sonore (`calme_sonore`), Sites industriels (`faible_exposition_industrielle`), Agriculture intensive (`faible_pression_agricole`) |
| **Nature & cadre** | Espaces naturels (`nature`), Mer (`proximite_mer`), Cadre calme (`cadre_calme`) |
| **Mobilité** | Sans voiture (`faible_dependance_auto`), Train / gares (`acces_transports`), TC du quotidien (`mobilite_quotidienne`) |
| **Services & proximité** | Soins (`acces_soins`), Services (`acces_services`), Collèges / lycées (`acces_ecoles`), Culture (`acces_culture`), Isolement (`eviter_isolement`) |
| **Vitalité & dynamique** | Emploi (`viabilite_emploi`), Vie locale (`vie_locale`), Vie étudiante (`vie_etudiante`), Démographie (`croissance_demographique`), Taille de ville (`eviter_grandes_villes` / `prefere_grande_ville`) |

Décompte : 3 + 4 + 4 + 3 + 3 + 5 + 5 = 27. L'ordre des thèmes ET des dimensions est
**stable**, jamais réordonné selon le trio (la carte mentale ne doit pas bouger).

**Exhaustivité :** la vue affiche les 27 dimensions pour les 3 communes, qu'elles aient
été demandées ou non. C'est la valeur ajoutée du payant face au gratuit (qui ne montre
que les critères demandés et les divergences).

**Taille de ville :** dimension à préférence non orientée (certains veulent grand,
d'autres petit). Le palier décrit la taille de fait (« Grande agglomération », « Ville
moyenne », « Petite ville », « Rural »), sans « avantage » directionnel : `avantage` =
`egalite` neutre, ou un libellé factuel « la plus grande / la plus petite » sans jugement.
À cadrer au plan.

## 6. Palier : mot absolu, avantage relatif

Décision verrouillée. Deux référentiels distincts par ligne.

**Le mot (palier) est ABSOLU** (référence nationale). Mêmes seuils partout. Trois à cinq
paliers par dimension selon sa nature, dérivés des seuils nationaux déjà utilisés par
`AMBIENT_DIMENSIONS` (terciles), enrichis en libellés incarnés autoportants. Évite de
fabriquer un « Modéré » faux : un trio nationalement calme affiche « Très préservé » pour
les trois.

**L'avantage est RELATIF au trio.** En-tête éditorial par dimension : « Avantage
Briançon ». On compare les subScores des 3 communes ; la meilleure porte l'avantage,
jamais un perdant nommé.

**Règle d'égalité.** Si les trois sont au même palier ET l'écart de subScore entre la
meilleure et la deuxième est faible (seuil à reprendre de `COMPROMIS_GAP` = 12, à
calibrer), l'en-tête affiche « À égalité » (avec une glose courte : « tous préservés »)
au lieu de forcer un avantage marginal.

**Qualifier optionnel.** Quand le moteur dispose déjà d'un descripteur de source non
chiffré (calme sonore via `calmeSonoreRecit`, exposition industrielle via
`expoIndustrielleRecit`), le palier peut porter un suffixe court (« Modéré, marqué par un
axe routier »). Jamais de chiffre, jamais de distance. Sinon, palier seul.

**Donnée absente.** `subScore` peut rendre `null` (dimension opt-in sans donnée pour la
commune). La cellule affiche « Non mesuré ici » (`disponible: false`) ; l'avantage se
calcule parmi les communes mesurées. `calme_sonore` et `faible_exposition_industrielle`
ne sont jamais null (absent = 100 = à l'écart), conformément au moteur.

L'authoring des tables de paliers incarnés (27 dimensions, 3 à 5 paliers chacune, libellés
autoportants) est le principal coût de mise en oeuvre. Faible risque technique, gros
travail éditorial. Les bandes de `AMBIENT_DIMENSIONS` servent de point de départ.

## 7. Synthèse par thème

Sous le titre de chaque thème, une phrase déterministe construite à partir des avantages
des dimensions du thème. Elle transforme le tableau en récit.

- Quand le thème sépare : nommer la ou les communes qui mènent et sur quoi. « Briançon
  prend l'avantage grâce à un environnement plus calme, Gap se distingue sur l'accès aux
  services. »
- **Garde-fou honnêteté** : quand le thème ne sépare pas vraiment (toutes les dimensions du
  thème en « À égalité », ou avantages dispersés sans dominante), la phrase le dit : « Sur
  ce thème les trois se ressemblent, sauf sur le calme sonore. » On ne fabrique jamais un
  faux gagnant de thème.

Phrase générée par règles (compte des avantages par commune dans le thème, dimension la
plus saillante), pas par IA. Descriptive, sans chiffre.

## 8. Chapeau « Ce qui les sépare vraiment »

En tête de page, avant les thèmes : 3 à 4 libellés courts des divergences majeures du
trio (outil de navigation). Exemple : « Le calme sonore · La mobilité · La vie locale ».

**Alimenté par les divergences, y compris narratives.** La sélection des divergences
majeures peut s'appuyer sur les signaux narratifs (submersion littoral, pression
immobilière, héritage) pour repérer ce qui sépare vraiment, MAIS n'affiche que le libellé
court : jamais la prose du récit (elle reste au rapport). Le chapeau oriente, il ne
raconte pas.

Sélection : dimensions où l'écart de subScore dans le trio est le plus grand (au-dessus
d'un seuil), plus les signaux narratifs contrastés. Cap à 3 ou 4. Si le trio est très
homogène, le chapeau le dit (« Trois territoires très proches ; ils se distinguent surtout
sur … »).

## 9. Layout

Liste empilée par dimension (pas de tableau à colonnes : le palier incarné est verbeux et
trois colonnes serrées rappellent le comparateur immobilier qu'on évite ; la liste
respire et marche en mobile).

```
CE QUI LES SÉPARE VRAIMENT
  Calme sonore · Mobilité · Vie locale

──────────────────────────────
CLIMAT
Climat de montagne proche pour les trois ; Embrun a des étés un peu plus doux.

  Étés frais                 Avantage Briançon
    Briançon   Très frais
    Embrun     Frais
    Gap        Frais, plus chaud l'été

  Douceur du climat          À égalité
    Briançon   Hivers rigoureux
    Embrun     Hivers rigoureux
    Gap        Hivers plus doux
  …
```

- Thèmes en sections, titre + phrase de synthèse, puis les dimensions.
- Chaque dimension : en-tête d'arbitrage (« Avantage X » ou « À égalité ») puis les 3
  communes empilées avec leur palier (et qualifier éventuel).
- Ordre des communes cohérent et stable dans toute la vue.
- Respecte la doctrine de largeur (le texte remplit le bloc, pas de `max-w` étroit).

## 10. Frontière avec le rapport

| Surface | Question | Matière |
| --- | --- | --- |
| **Comparaison** (cette vue) | Qu'est-ce qui distingue ces trois ? | 27 dimensions, paliers, avantages, synthèses de thème, chapeau |
| **Rapport communal** (autre surface du Pack) | Que dois-je savoir sur cette commune ? | Héritage industriel, littoral, pression éco, démographie détaillée, trajectoires, contexte |

Les récits profonds que le moteur calcule déjà (et gate aujourd'hui) ne sont PAS rendus
dans la comparaison. Ils peuvent informer la sélection du chapeau, sans s'afficher.

## 11. Points ouverts (à trancher au plan ou avec le porteur)

- Tables de paliers incarnés : nombre de paliers et libellés exacts par dimension (gros
  travail éditorial, à valider par le porteur sur quelques dimensions témoins).
- Seuil d'égalité (réutiliser `COMPROMIS_GAP` = 12 ou calibrer un seuil propre).
- Dimension « Taille de ville » : formulation de l'avantage non directionnel.
- Sonde de calibrage sur trios réels (à l'image de `sonde-comparateur-3.mjs`) : vérifier
  que les paliers absolus, avantages et synthèses tiennent sur des trios contrastés ET
  homogènes.

## 12. Critères de succès

- La vue affiche les 27 dimensions des 3 communes, groupées en 7 thèmes stables, sans
  aucun chiffre ni jauge.
- Chaque dimension porte un palier incarné absolu par commune et un en-tête d'arbitrage
  relatif au trio, avec « À égalité » honnête quand les trois se rejoignent.
- Chaque thème porte une phrase de synthèse honnête (ne fabrique pas de faux gagnant).
- Le chapeau remonte 3 à 4 divergences majeures, sans dérouler de récit.
- Aucun récit profond n'apparaît dans la comparaison.
- Sortie moteur 100 % déterministe, sans IA, réutilisant `subScore` et les bandes
  nationales existantes.
