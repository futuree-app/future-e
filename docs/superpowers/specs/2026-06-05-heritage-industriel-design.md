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

## 2. Source (reconnaissance 2026)

**SSP / ex-BASOL** : « Sites et sols pollués (ou potentiellement pollués) appelant une action
des pouvoirs publics ». ~11 200 sites (2025). Géoréférencé au **point (XY)**. **CSV national**
téléchargeable en une fois (+ déclinaisons régionale/départementale) ; MAJ **quotidienne** ;
API Géorisques également (`rayon` + `latlon`, rate limit 1000 req/min). Curé par construction :
**tout site présent est notable** (pas de filtre de gravité à inventer, contrairement à l'ICPE).

Pourquoi SSP est la bonne colonne vertébrale :
- curé, crédible, géoréférencé ;
- intègre l'inventaire historique des **anciennes usines à gaz EDF-GDF** (~467 sites), donc
  attrape le témoin **Marcel-Paul (La Rochelle)** : ancienne usine à gaz (houille distillée
  depuis 1840, puis GDF), sols HAP/BTEX/cyanures, dépollution en cours. C'est `regime=Déclaration`
  côté ICPE (invisible en exposition active, et c'est CORRECT), mais c'est un site SSP de plein
  droit.

Sources **écartées** pour ce signal :
- **CASIAS / ex-BASIAS** (300 000+ sites) : inventaire historique d'anciennes activités, présence
  ≠ pollution, toute ville en a → bruit massif, banni du signal.
- **SIS** (secteurs d'info sur les sols, parcelles réglementaires) : complément légal intéressant,
  réservé au **rapport** (V2 éventuelle comme couche « constructibilité »).
- **Cartofriches** (câblé, `cartofriches.ts`) : ~3 000 sites, **non exhaustif** → faux « rien ici »,
  réservé au rapport/fiche.
- **IREP** (câblé) : émissions ACTIVES, recoupe l'exposition active, hors héritage.
- **GISSOL** cadmium (câblé) : fond géochimique maille ~16 km, hors sujet héritage.

**Gate data** : confirmer en début d'implémentation la voie de fetch (CSV national data.gouv /
Géorisques vs API paginée) et la présence effective de Marcel-Paul + le champ activité exploitable.

## 3. Donnée d'index

Champ ajouté à `IndexCommune` :

```ts
heritageIndustriel?: {
  activite: HeritageActivite | "generique"; // catégorie grand public du site le PLUS PROCHE
  plusieurs: boolean;                         // ≥ 2 sites SSP notables dans le rayon R
  distanceKm: number;                         // au site le plus proche ; INTERNE (jamais affiché)
} | null;                                      // null = aucun site SSP dans R
```

- `null` = aucun site SSP dans le rayon `R`. **R PROVISOIRE = 3 km**, à **figer par sonde
  (3 km vs 5 km)**. L'héritage est hyperlocal : un rayon serré évite de remonter, dans les villes
  anciennes, un tissu de signaux qui effraie sans raison. Le **rapport** pourra élargir.
- `activite` = catégorie du **site le plus proche**, via **table curée** (cf. §3bis), repli
  `"generique"` si l'activité BASOL n'est pas mappable avec certitude. **On nomme quand on est
  sûr, on reste générique sinon, jamais on ne devine.**
- `distanceKm` interne : tie-break + futur rapport, **jamais** exposé au récit (doctrine no chiffre).

### 3bis. Table d'activité curée (BASOL → label grand public)

Le champ activité/origine de BASOL est semi-libre : on mappe vers une **poignée** de catégories
évocatrices et grand public, chacune avec son **genre** (pour l'accord du récit) :

| Catégorie (`HeritageActivite`) | genre | label récit |
|---|---|---|
| `usine_gaz` | f | « ancienne usine à gaz » |
| `chimie` | m | « ancien site chimique » |
| `metallurgie` | f | « ancienne fonderie » / « ancien site métallurgique » |
| `raffinerie_hydrocarbures` | m | « ancien dépôt d'hydrocarbures » |
| `decharge` | f | « ancienne décharge » |
| `generique` (repli) | m | « ancien site industriel » |

Liste à compléter à l'implémentation d'après la distribution réelle des libellés BASOL
(mapping par mots-clés, casse/accents normalisés). Toute activité non reconnue → `generique`.
**Ne jamais inventer une catégorie** : dans le doute, `generique`.

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
1. fetch national SSP/BASOL (CSV data.gouv/Géorisques, fallback API paginée) ;
2. dédup par identifiant de site ;
3. mapping activité → catégorie curée (§3bis) ;
4. grille spatiale + pour chaque chef-lieu : sites SSP dans `R` → plus proche (catégorie +
   `distanceKm`), `plusieurs` (≥ 2) ;
5. modes `--selftest` (assertions, dont Marcel-Paul ≠ null + catégorie `usine_gaz`),
   `--summary`, `--probe`, `--matrix`, `--write-index`, `--refresh`.

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

1. **Gate data** : confirmer voie de fetch + champ activité + présence de Marcel-Paul (vérif live).
2. **Sonde rayon** : `R = 3 km` vs `5 km` sur communes témoins → **gate porteur** avant de figer.
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

- **Module rapport payant** « héritage industriel & sites pollués » : état de gestion, substances,
  distances précises, densité, SIS, Cartofriches, sources. C'est là que vit la résolution du
  « faut-il s'inquiéter ? ».
- **Filtre opt-in binaire** non scoré (évolution future, cf. §1).
- **SIS** comme couche complémentaire de récit/score (réservé rapport en V1).
