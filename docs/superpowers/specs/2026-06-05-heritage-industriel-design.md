# Design : signal narratif « Héritage industriel » (SSP / ex-BASOL)

Date : 2026-06-05
Statut : validé (brainstorming), prêt pour writing-plans
Reconnaissance data : ce document (§2) + `docs/comparateur-sante-environnementale.md` (§4)
Précédent technique : `littoral` (récit gaté, non scoré) + `faible_exposition_industrielle`
(spec `2026-06-05-exposition-industrielle-design.md`, pour la plomberie nuage-de-points national).

## 0. Doctrine fondatrice (la ligne à ne jamais franchir)

Deux objets DISTINCTS, jamais fondus dans un même score :

> **ICPE / Seveso = industrie EN ACTIVITÉ** (déjà livré : `faible_exposition_industrielle`, scoré).
> **SSP / ex-BASOL = HÉRITAGE industriel** (ce chantier : narratif, NON scoré).

L'exposition active répond à « qu'y a-t-il autour de moi aujourd'hui ? ». L'héritage répond à
« que s'est-il passé ici il y a 30, 50 ou 150 ans ? ». La seconde question est trop ambiguë pour
un score : un ancien site peut être dépollué, surveillé, transformé. Scorer l'héritage
pénaliserait mécaniquement les ports, les villes industrielles historiques, les bassins ouvriers,
les centres anciens : on scorerait l'histoire plus que le présent. C'est exactement le biais
social que futur·e refuse. **Donc : signal narratif, jamais une note.**

## 1. Statut & nature

- Objet **narratif**, hors score, hors tri, **sans hiérarchie nationale** (pas de percentile).
- **PAS** un `PREFERENCE_KEY` : aucun ajout à `PREFERENCE_KEYS`, `subScore`, `AMBIENT_DIMENSIONS`.
  Le compteur « près de 30 critères » reste donc honnête (ce n'en est pas un).
- Précédent exact dans le code : **`littoral`** — un récit gaté par une intention exprimée au
  parse ET une condition factuelle par commune, à zéro impact sur le score/tri.
- **Évolution future explicitement ouverte (hors V1)** : un **filtre opt-in binaire** non scoré
  (« je veux voir / éviter les territoires comportant plusieurs anciens sites pollués »), qui
  reste dans « je veux voir » et jamais « le moteur juge que c'est mauvais ».

## 2. Source (reconnaissance live 2026-06-05, vérifiée en appel réel)

API **Géorisques `GET /api/v1/ssp`** (`latlon=lon,lat` + `rayon` en m, rate limit 1000 req/min).
C'est un endpoint **composite** qui renvoie QUATRE sous-bases ; on n'en garde **qu'une seule** :

| sous-clé | nature | usage |
|---|---|---|
| **`instructions`** | dossiers d'instruction SSP = **ex-BASOL curé** (sites pollués appelant une action publique) | **SOURCE DU SIGNAL** |
| `casias` | inventaire historique (ex-BASIAS) | **IGNORÉ** (418 sites en 3 km à La Rochelle vs 8 en `instructions` : c'est le bruit qu'on bannit) |
| `conclusions_sis` | secteurs SIS (réglementaire) | réservé **rapport** |
| `conclusions_sup` | servitudes d'utilité publique | réservé **rapport** |

La couche `instructions` est curée par construction : **tout site présent est notable** (pas de
filtre de gravité à inventer, contrairement à l'ICPE). Ordre de grandeur national ~11 000 sites.

**Témoin Marcel-Paul CONFIRMÉ en live** : « Agence EDF / GDF Services » / « Centre EDF GDF
Services », `code_insee=17300` (La Rochelle), présent dans `instructions` (statut « Clôturée » /
« En cours ») ET dans `conclusions_sis`. L'ancienne usine à gaz tombe donc bien dans la couche
curée. ✓ (côté ICPE c'est `regime=Déclaration`, invisible en exposition active, et c'est CORRECT.)

**Champs réels d'un enregistrement `instructions`** :
`identifiant_ssp`, `nom_etablissement`, `adresse`, `adresse_lieudit`, `code_insee`, `nom_commune`,
`statut` (« Clôturée » / « En cours » …), `fiche_risque`, `date_maj`, `geom` (**MultiPolygon**).

Deux réalités structurantes (≠ hypothèses initiales de la spec) :
1. **Pas de champ activité propre.** Le seul descripteur est `nom_etablissement` (texte libre :
   « Agence EDF / GDF Services », « ESSO SERVICE PORTE ROYALE », « TRIAXE INDUSTRIES »,
   « SNC DELFAU ET CIE »). L'activité se dérive donc **par mots-clés** sur `nom_etablissement`
   (cf. §3bis), et le **repli `generique` sera la norme** (on ne nomme que les cas sûrs : usines à
   gaz, pétroliers, chimie/métallurgie identifiables). C'est honnête et assumé.
2. **Géométrie = MultiPolygon**, pas un point → distance calculée sur le **centroïde** (moyenne des
   sommets) du site.

**Acquisition retenue** : **boucle géo par commune** sur le chef-lieu (`latlon` + `rayon=5000`),
en ne lisant que `instructions`, avec **cache + reprise** sur disque. Le rayon de fetch 5 km
couvre les deux variantes de sonde (3 vs 5 km) en **une seule passe** : on stocke la distance
réelle au centroïde et la sonde ne fait que filtrer. ~34 788 communes × 1 appel ≈ 35 min à 1000
req/min (précompute offline, caché, repris en cas de coupure). Bulk national CSV data.gouv = repli
si l'API est trop instable.

Sources **écartées** pour ce signal : `casias` (bruit), SIS/SUP (rapport), Cartofriches (`câblé`,
~3 000 sites non exhaustifs → faux « rien ici », rapport), IREP (émissions actives, hors héritage),
GISSOL cadmium (maille ~16 km, hors sujet).

**Gate data** : FRANCHI en live (endpoint, champs, Marcel-Paul confirmés). Reste à confirmer à
l'implémentation la **robustesse de la boucle 34k appels** (sinon repli bulk CSV).

## 3. Donnée d'index

Champ ajouté à `IndexCommune` :

```ts
heritageIndustriel?: {
  activite: HeritageActivite | "generique"; // catégorie grand public du site le PLUS PROCHE
  plusieurs: boolean;                         // ≥ 2 sites SSP notables dans le rayon R
  distanceKm: number;                         // au site le plus proche ; INTERNE (jamais affiché)
} | null;                                      // null = aucun site SSP dans R
```

- `null` = aucun site `instructions` dans le rayon `R`. **R FIGÉ À 3 km** (gate porteur
  2026-06-05). Sonde nationale (échantillon ~1500 communes ≥ 1500 hab) : **3 km → 18 % des communes
  portent un signal, 5 km → 32 %** (5 km double l'empreinte). Choix produit : l'enjeu n'est pas le
  faux négatif mais le **faux signal narratif** (« une ancienne usine à gaz est recensée » est très
  chargé cognitivement) ; mieux vaut manquer quelques cas que flaguer trop large. **Le rapport
  détaillé (payant) pourra, lui, élargir à 5 km** — le fetch est d'ailleurs caché à 5 km, le rayon
  n'est qu'un filtre, donc le rapport réutilise le même cache sans re-fetch.
- `activite` = catégorie du **site IDENTIFIABLE le plus proche** (on privilégie un site nommable
  même un peu plus loin qu'un générique très proche : le crochet « usine à gaz » vaut mieux que le
  banal à 30 m), dérivée par **mots-clés sur `nom_etablissement`** (cf. §3bis), repli `"generique"`
  sinon. **On nomme quand on est sûr, on reste générique sinon, jamais on ne devine.**
- `distanceKm` interne (centroïde du MultiPolygon) : tie-break + futur rapport, **jamais** exposé
  au récit (doctrine no chiffre).

### 3bis. Table d'activité (mots-clés `nom_etablissement` → label grand public)

`nom_etablissement` est un texte libre (raison sociale historique). On mappe vers une **poignée**
de catégories évocatrices, chacune avec son **genre** (pour l'accord du récit), par recherche de
mots-clés sur le libellé **normalisé** (minuscules, sans accents) :

| Catégorie (`HeritageActivite`) | genre | mots-clés (extrait) | label récit |
|---|---|---|---|
| `usine_gaz` | f | `gdf`, `gaz de france`, `usine a gaz`, `edf gdf` | « ancienne usine à gaz » |
| `station_service` | f | `station service`, `station-service`, `garage` | « ancienne station-service » |
| `raffinerie_hydrocarbures` | m | `esso`, `total`, `raffinerie`, `petrol`, `hydrocarbure`, `fioul`, `avia` | « ancien dépôt d'hydrocarbures » |
| `chimie` | m | `chimi`, `chimique` | « ancien site chimique » |
| `metallurgie` | f | `fonderie`, `metallurg`, `siderurg`, `cokerie`, `laminoir`, `trefilerie` | « ancienne fonderie » |
| `mine` | f | `minier`, `houillere`, `charbonnage`, `mine de` | « ancienne mine » |
| `decharge` | f | `decharge`, `ordures`, `dechets menagers` | « ancienne décharge » |
| `generique` (repli) | m | (tout le reste) | « ancien site industriel » |

ORDRE = priorité (1er match gagne) : `station_service` avant `raffinerie_hydrocarbures` (un
« GARAGE TOTAL » est une station, pas un dépôt). Tables **affinées par audit des `generique`**
(gate porteur 2026-06-05) : station-service/garage et mine sortis du repli, cokerie/laminoir →
métallurgie, fix marque « total » en fin de nom. Après curation, `generique` reste ~47 % des
non-null (raisons sociales non généralisables : « TRIAXE INDUSTRIES », « SNC DELFAU ») — assumé,
on ne force pas. Toute raison sociale non reconnue → `generique`. **Ne jamais inventer une
catégorie.** « ancienne décharge » est gardée nommée (présente dans SSP, colle à l'intention « sols
pollués »), même si pas industrielle au sens strict.

## 4. Récit (NARRATIF, gaté, SANS chiffre)

Lexique **documentaire, au passé** : « ancienne », « recensée », « documentée ». **Jamais**
« pollué / toxique / dangereux / risque » dans le gratuit. L'**état de gestion** (traité / en
cours / sous surveillance), les substances, la distance précise, la densité : **tout cela est la
valeur du rapport payant**, pas du gratuit.

Garde-fou anti-cliffhanger : nommer l'activité sans l'état ne doit pas créer une angoisse
(« usine à gaz… payez pour savoir si c'est grave »). « ancienne » + « recensée » = un **fait de
patrimoine connu et suivi**, pas une menace cachée. On reste dans la **transparence**.

`heritageRecit(c)` → `string | null` :

| cas (`activite`, `plusieurs`) | récit |
|---|---|
| nommé, `plusieurs=false` | « Une ancienne usine à gaz est recensée à proximité. » |
| générique, `plusieurs=false` | « Un ancien site industriel est recensé à proximité. » |
| nommé, `plusieurs=true` | « Une ancienne usine à gaz, parmi d'autres anciens sites industriels, est recensée à proximité. » |
| générique, `plusieurs=true` | « Plusieurs anciens sites industriels sont recensés à proximité. » |
| `heritageIndustriel == null` | `null` (silence) |

Templates **accordés en genre** d'après la catégorie (« une ancienne usine à gaz » / « un ancien
site chimique » / « une ancienne fonderie »). Accord du verbe « recensé·e » suit le genre.

Champ ajouté à `MatchResult` : `heritageIndustriel: string | null`. Construit au match.

## 5. Déclenchement (gate)

- **Intention héritage** au parse : un **booléen** (comme `coastalIntent` du littoral), **pas**
  une préférence pesée. Déclencheurs : « sols pollués », « terrain pollué », « site pollué »,
  « ancienne usine », « anciens sites industriels », « passé industriel », « héritage industriel »,
  « pollution historique ». Représentation : flag dans `ParsedProject` (mirroir de l'intention
  littorale ; **pas** d'entrée dans `preferences`).
- **Synthèse** : récit surfacé quand l'intention est exprimée ET `heritageIndustriel != null`.
  Frontière de gating identique à `calmeSonore` / `climatInondation` (gaté côté
  `synthesize/route.ts`).
- **AskFuture comparateur** : le récit (`heritageIndustriel`) est transmis dans le contexte
  par commune du payload, pour répondre aux « et côté passé industriel ? » **même sans intention
  au parse**. Ce n'est **pas** une dimension ambiante (`AMBIENT_DIMENSIONS` = scoré) : c'est du
  **texte injecté** dans le contexte, pas un subScore.
- **Pas** affiché sur la carte gratuite par défaut (cohérent avec `calmeSonore`, gaté).

## 6. Plomberie

Script `scripts/populate-heritage-industriel.py` (venv `.venv-bpe`, modèle
`populate-exposition-industrielle.py`) :
1. **boucle géo par commune** : `GET /api/v1/ssp?latlon=lon,lat&rayon=5000`, ne lire que la
   sous-clé `instructions` (ignorer `casias`/`conclusions_sis`/`conclusions_sup`) ; **cache +
   reprise** par `code_insee` sur disque (résilience réseau, 3 essais/commune comme l'exposition) ;
2. dédup par `identifiant_ssp` ; **centroïde** du MultiPolygon `geom` → distance haversine au
   chef-lieu (pas de grille nécessaire : l'API a déjà borné au rayon) ;
3. activité du site le plus proche via mots-clés sur `nom_etablissement` normalisé (§3bis) ;
4. par commune (au rayon `R` de sonde ≤ 5 km cachés) : `activite` (plus proche), `plusieurs`
   (≥ 2 sites dans `R`), `distanceKm` (plus proche) ; aucun site → `null` ;
5. modes `--selftest` (assertions : mapping activité, accord récit, Marcel-Paul `17300` ≠ null +
   catégorie `usine_gaz`), `--summary`, `--probe`, `--matrix`, `--write-index`, `--refresh`.

Câblage TS :
1. type `IndexCommune` (champ `heritageIndustriel`).
2. `MatchResult` (champ `heritageIndustriel: string | null`) + helper `heritageRecit(c)` +
   table `HERITAGE_ACTIVITE_LABEL` (label + genre) + assemblage au match.
3. Intention héritage au parse (`parse/route.ts` + désambiguïsation) → flag `ParsedProject`.
4. Transmission via le map results de `OuVivreClient.tsx`.
5. Gating synthèse dans `synthesize/route.ts` (frontière `calmeSonore`).
6. Injection du récit dans le contexte AskFuture comparateur (`ask/route.ts`).
7. `comparateur-labels.ts` : **rien** (pas un critère, pas de chip/tooltip).

**Aucun** ajout à `PREFERENCE_KEYS`, `subScore`, `AMBIENT_DIMENSIONS`, `STRENGTH_BONUS`, au tri.

## 7. Sonde à gates

1. **Gate data** : FRANCHI en live le 2026-06-05 (endpoint `/api/v1/ssp` sous-clé `instructions`,
   champs réels, Marcel-Paul confirmé `code_insee=17300`). Reste à confirmer la robustesse de la
   boucle 34k appels (sinon repli bulk CSV data.gouv).
2. **Sonde rayon** : `R = 3 km` vs `5 km` (filtré sur le cache fetché à 5 km) sur communes témoins
   → **gate porteur** avant de figer.
   - Témoin OBLIGATOIRE : **Marcel-Paul / La Rochelle** doit sortir (catégorie `usine_gaz`). Si le
     récit ne fire pas, l'axe est raté.
   - Témoins « héritage lourd » attendus non-null : bassins miniers/sidérurgiques (Nord, Lorraine),
     vallée de la chimie (Rhône), anciens ports gaziers.
   - Contrôle « faux positif » : une commune rurale sans passé industriel doit rester `null` ;
     une ville ancienne ne doit pas remonter un tissu effrayant à 3 km (c'est l'enjeu du rayon).
   - Codes INSEE vérifiés par NOM dans l'index avant la sonde (piège PLM = arrondissements).
3. **Sonde récit** : sur trios réels, vérifier le ton documentaire (pas anxiogène), l'accord en
   genre, le repli générique quand l'activité n'est pas mappable.

## 8. Hors scope V1 (notés)

- **Module rapport payant** « héritage industriel & sites pollués » : état de gestion (Clôturée /
  En cours), substances, distances précises, densité, **rayon élargi à 5 km** (réutilise le même
  cache, fetché à 5 km — le gratuit n'en montre que 3 km), SIS, Cartofriches, sources. C'est là que
  vit la résolution du « faut-il s'inquiéter ? ».
- **Filtre opt-in binaire** non scoré (évolution future, cf. §1).
- **SIS** comme couche complémentaire de récit/score (réservé rapport en V1).
