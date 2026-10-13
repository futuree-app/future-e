# Visuels de l'article pilote mobilité La Rochelle

Deux visuels, chacun en **quatre fichiers** : version large (1000 px) et version mobile (640 px, textes agrandis), chacune en **thème clair** (fond blanc) et en **thème sombre** (fond `--bg-deep` du site, #0d1322). SVG et PNG (rendu 2x, police Archivo).

| Visuel | Large | Mobile |
|---|---|---|
| Carte par secteur | `carte_iris_17300_{clair,sombre}.svg/.png` | `carte_iris_17300_mobile_{clair,sombre}.svg/.png` |
| Barres selon le lieu de travail | `barres_lieu_travail_{clair,sombre}.svg/.png` | `barres_lieu_travail_mobile_{clair,sombre}.svg/.png` |
| Tableau accessible associé à la carte | `tableau_iris_17300.html` (balisage `<table>` avec `<caption>`, `scope`) et `tableau_iris_17300.md` | |

## Intégration selon le thème et la largeur

Le site bascule clair/sombre par `data-theme` : choisir le fichier du thème actif (ou, à défaut, `prefers-color-scheme`). Exemple pour un fond sombre :

```html
<figure>
  <picture>
    <source media="(max-width: 640px)" srcset="carte_iris_17300_mobile_sombre.png">
    <img src="carte_iris_17300_sombre.png" alt="(texte alternatif ci-dessous)" width="1000">
  </picture>
  <figcaption>(légende ci-dessous)</figcaption>
</figure>
```

Chaque thème a **sa propre rampe**, validée sur **sa** surface (`validate_palette.js --ordinal` du skill dataviz) : sur fond clair, plus la part est élevée, plus le bleu est foncé ; sur fond sombre, plus il est lumineux. La légende de chaque fichier suit son thème. Ne pas poser une version claire sur fond sombre, ni l'inverse.

## Carte

**Titre** (dans l'image) : Aller travailler en voiture, secteur par secteur (raccourci : deux lignes au lieu de trois en mobile)

**Légende et texte alternatif** : `legendes.html` (version de référence, à reprendre dans l'article). La légende HTML porte les précisions retirées de l'image : secteurs statistiques, pratiques des habitants actuels, prudence sur les petits écarts, rôle de l'encart.

**Dans l'image** : définition courte (actifs occupés de 15 ans ou plus résidant dans le secteur, mode principal déclaré), source et millésime (INSEE, recensement 2022 ; contours IGN).

**Choix** :
- Valeurs de la fiche validée (`fiches/17300/fiche.json`, tableau `iris`, identique à `resultats/iris_mobilite_2022.csv`), jointes aux contours IRIS IGN archivés par code IRIS (31/31, noms identiques). Aplats par secteur, sans interpolation ni précision à la rue.
- Cinq classes égales de 10 points (25 à 75 %), une seule teinte : pas d'opposition « bon » / « mauvais ».
- Chef de Baie (IRIS d'activité) hachuré et exclu. La catégorie « Sans donnée exploitable » n'apparaît en légende que si elle est présente (aucun secteur à La Rochelle).
- Cinq libellés : les trois secteurs cités dans l'article (Centre Préfecture, Mireuil Est, Villeneuve des Salines Ouest), Laleu (la plus grande zone foncée, qui sinon intrigue) et Les Minimes Université (repère connu, valeur intermédiaire). Libellés INSEE tels quels ; l'article peut écrire « Villeneuve-les-Salines ».
- **Encart de situation** « Situer les communes du graphique » : La Rochelle (gris soutenu, « carte ci-contre ») et Aytré, Lagord, Périgny, Puilboreau (gris clair, nommées), soit exactement le périmètre du graphique en barres, sans Châtelaillon-Plage. Contours communaux obtenus par fusion exacte des contours IRIS officiels IGN déjà archivés, aucun tracé approximatif. Couleurs hors de la rampe ; une phrase indique qu'elles sont hors du périmètre de la carte, pas sans données. Choisi plutôt qu'un cadrage élargi : élargir aux quatre voisines fait passer l'emprise est-ouest de 0,13° à 0,20° de longitude, soit une carte des secteurs rochelais réduite d'environ un tiers, au détriment des petits secteurs du centre sur mobile ; l'encart garde la carte des quartiers à pleine largeur.

## Barres

**Titre** : Habiter La Rochelle, travailler ici ou dans une commune voisine

**Sous-titre** : Part utilisant principalement la voiture pour aller travailler, parmi les actifs résidant à La Rochelle.

**Note** (dans l'image, allégée) : Deux groupes distincts de résidents ; l'écart décrit des pratiques. Source : INSEE, recensement 2022. La précision causale complète est dans `legendes.html`.

**Texte alternatif** : Graphique en deux barres sur une échelle de 0 à 100 %. Parmi les actifs résidant à La Rochelle, 44 % de ceux qui travaillent à La Rochelle vont travailler principalement en voiture, contre 72 % de ceux qui travaillent à Aytré, Lagord, Périgny ou Puilboreau. Deux groupes distincts ; l'écart décrit des pratiques, pas un effet causal. Source : INSEE, recensement 2022.

**Valeurs** : `resultats/incertitudes_mobpro.csv`, 0,441 et 0,723 (affichées 44 % et 72 %). Le second groupe porte sur les **quatre** communes nommées ; le fait « communes voisines » de la fiche automatique (0,732) inclut aussi Châtelaillon-Plage et n'est pas utilisé ici. Les autres modes ne sont pas ajoutés.

## Reproduire

Depuis `docs/etudes/2026-10-13-larochelle-mobilite/`, avec l'environnement de `outil/requirements.txt` et Google Chrome (rendu PNG) :

```sh
python visuels/generer_visuels.py --insee 17300 --fiche fiches/17300/fiche.json \
  --contours <checkout>/data/cache-etudes/2026-10-13-larochelle-mobilite/cache-outil/iris_ign_17300.json \
  --incertitudes resultats/incertitudes_mobpro.csv --out visuels
```

L'encart lit les contours `iris_ign_<insee>.json` des communes voisines dans le même dossier que `--contours` ; défaut pour 17300 : `--encart 17200,17291,17274,17028`. `--encart ""` le supprime.

Autre commune : produire d'abord sa fiche (`outil/fiche_mobilite.py`), puis passer `--insee`, `--fiche`, `--contours` (fichier `iris_ign_<insee>.json` du cache de l'outil) et, au besoin, `--libelles CODE,CODE` (libellés posés au centre des secteurs, à replacer à la main si besoin). Le script s'arrête avec un message clair si la commune n'est pas découpée en IRIS d'habitat, ou si une valeur sort des classes 25 à 75 %. Le graphique en barres n'est produit que pour La Rochelle. `--sans-png` saute le rendu Chrome.

## Limites utiles

- Une IRIS de moins de 300 actifs (Mireuil Château d'Eau) est affichée sans traitement particulier : précision de quelques points, comme les autres ; la note le rappelle.
- Les SVG chargent Archivo depuis Google Fonts ; hors ligne, ils retombent sur Helvetica Neue / Arial (largeurs proches, mise en page vérifiée avec Archivo).
- Les positions des libellés de La Rochelle sont réglées à la main pour ces contours ; elles ne se transposent pas à une autre commune.
