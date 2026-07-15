# Compression au repos de l'index comparateur (gzip canonique)

**Date** : 2026-07-15 · **Statut** : conception validée (Approche A + 4 garde-fous) · **Branche cible** : `main`

## 1. Problème

`data/comparateur-index.json` pèse **77,5 Mo dans git** (81 Mo sur disque, 34 788 communes, 43 clés
chacune). GitHub **avertit au-delà de 50 Mo** et **refuse au-delà de 100 Mo**. Le lot 2 de `mismatch`
(états absolus) le fera encore grossir. `.git` pèse déjà **268 Mo** (~25 versions de l'index dans
l'historique). L'avertissement va devenir un mur.

**Faits établis (mesurés le 2026-07-15) :**

| | Aujourd'hui | Après gzip niveau 9 |
|---|---|---|
| Fichier versionné | 77,5 Mo | **10,2 Mo** |
| Chargement runtime (read + parse) | 1034 ms | **935 ms** (read 10 Mo + gunzip < read 81 Mo) |
| Format columnar seul (écarté) | — | 61 Mo (ne repasse pas sous 50) |

Sur ce banc (disque local chaud), lire 10 Mo puis décompresser coûte moins que lire 81 Mo — mais on
**n'affirme pas « aucun surcoût de cold-start » comme vérité générale** tant que le premier chargement réel
sur Vercel (disque froid) n'est pas mesuré (cf. §8). Léger surcoût mémoire transitoire (les ~10 Mo
compressés en plus des octets décompressés + objets parsés), négligeable face aux >80 Mo déjà chargés
aujourd'hui. C'est le seul levier qui repasse **largement** sous 50 Mo (marge pour le lot 2 et au-delà).

## 2. Objectif

Repasser l'index **largement sous 50 Mo dans git**, sans dépendance d'infra nouvelle, sans transformer un
chantier de stockage en migration transversale des ~25 outils qui touchent l'index.

## 3. Décision : Approche A — gz canonique, JSON = copie de travail locale

```
data/comparateur-index.json.gz   → VERSIONNÉ, déployé, lu au runtime   (artefact canonique)
data/comparateur-index.json      → gitignoré, copie de travail locale  (jamais distribuée)
```

**Contrat explicite :** le JSON local n'est **jamais** une source distribuée. Il est seulement la
représentation décompressée de l'artefact canonique, modifiable par les scripts d'enrichissement avant un
nouveau `pack`. Le `.gz` est l'unique source de vérité versionnée et déployée.

**Pourquoi pas B (tout-gz, source unique via helper) maintenant :** B est structurellement plus pur (une
représentation, une API d'I/O) mais son seul avantage — éliminer une classe de désynchronisation — est déjà
neutralisé par trois petits scripts + une vérification au build. En échange B impose de migrer ~25 scripts
hétérogènes (`.js`/`.mjs`/`.mts`), d'harmoniser plusieurs systèmes de modules, et met en risque des scripts
historiques rarement exécutés, pour zéro valeur produit. Le JSON clair reste par ailleurs une **copie de
travail utile** (inspection, outils Unix, débogage, mutations intermédiaires sans recompresser). A obtient
~95 % de la propreté de B pour ~10 % de son risque. B redeviendra pertinente si les scripts passent en
automatisation, si plusieurs contributeurs enrichissent l'index, ou si la copie locale cause des incidents
réels.

**Pourquoi pas Git LFS, purge d'historique, brotli, columnar :** hors périmètre. LFS ajoute une dépendance
d'infra sans réduire le fichier. La purge de l'historique `.git` (268 Mo) est un chantier séparé et risqué
(réécriture d'historique). Brotli gagnerait quelques Mo de plus mais gzip niveau 9 suffit très largement.
Columnar (61 Mo) ne repasse pas sous 50 seul.

## 4. Composants

### 4.1 Versionnement

- `.gitignore` : ajouter `data/comparateur-index.json` (à côté des caches régénérables déjà ignorés).
- Versionner `data/comparateur-index.json.gz`.
- Retirer l'ancien JSON du suivi git (`git rm --cached data/comparateur-index.json`), committer le `.gz`.

### 4.2 Lecture runtime — `loadIndex()` (`src/lib/comparateur-vie.ts`)

Seul point de lecture runtime réel. Modifications :

- **Format racine gravé.** L'index est un objet, pas un tableau nu :
  ```ts
  type ComparateurIndex = { communes: IndexCommune[]; meta?: unknown };
  ```
  Le lecteur **valide la structure** au lieu de caster (un cast satisfait TS mais peut retourner le mauvais
  niveau) :
  ```ts
  async function readAndParseCompressedIndex(): Promise<IndexCommune[]> {
    const compressed = await readFile(INDEX_GZ_PATH);
    const text = (await gunzip(compressed)).toString("utf8");
    const parsed: unknown = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null ||
        !Array.isArray((parsed as { communes?: unknown }).communes)) {
      throw new Error("Index comparateur invalide : propriété communes absente.");
    }
    return (parsed as ComparateurIndex).communes;
  }
  ```
- **Mémoïsation par promise** pour dédupliquer les lectures concurrentes :
  ```ts
  let indexPromise: Promise<IndexCommune[]> | null = null;
  function loadIndex(): Promise<IndexCommune[]> {
    return (indexPromise ??= readAndParseCompressedIndex());
  }
  ```
  (le code actuel assigne `indexCache` *après* l'`await` : deux appels concurrents lisent le disque deux
  fois. La mémoïsation par promise corrige ce défaut existant.)
- **Doctrine de la promise rejetée (à graver, ne pas « réparer ») :** si le premier chargement échoue, la
  promesse rejetée reste mémoïsée et tous les appels suivants échouent sans retry. Pour un artefact
  **canonique** corrompu c'est la **bonne** doctrine : échec fatal → réparer/repacker l'artefact → redémarrer
  le processus. Un agent futur ne doit **pas** ajouter un retry silencieux. En dev, après réparation il faut
  redémarrer le serveur.
- **Préserver** le peuplement des caches dérivés (`buildUuPop`, `inseeIndexCache`, `uuLabelCache`) tel
  qu'aujourd'hui.
- Runtime **Node** requis (`fs` + `zlib`) : aucune route concernée n'est en `edge` (vérifié) ; le JSON de
  77 Mo imposait déjà cette contrainte.

### 4.3 Bundle serverless — `next.config.ts`

`outputFileTracingIncludes` **déclare** les fichiers à embarquer, il ne les lit pas. Remplacer les **3**
occurrences de `./data/comparateur-index.json` par `./data/comparateur-index.json.gz`. Ne **pas** tracer le
JSON clair (gitignoré, absent en prod). Aucun « contrat de lecture » à partager ici.

### 4.4 Scripts — `pack` / `unpack` / `verify`

```json
"scripts": {
  "index:unpack": "node scripts/index-unpack.mjs",
  "index:pack":   "node scripts/index-pack.mjs",
  "index:verify": "node scripts/index-verify.mjs",
  "prebuild":     "npm run index:verify"
}
```

**`index-unpack.mjs`** (gz → JSON de travail) :
1. lit le `.gz`, `gunzip` ;
2. valide (`JSON.parse`) ;
3. écrit `comparateur-index.json.tmp` ;
4. renomme atomiquement vers `comparateur-index.json`.

**Invariants d'index partagés** (fonction `assertIndexInvariants(communes)` réutilisée par `pack` et
`verify`, peu coûteuse sur 34 788 entrées) :
- `communes` est un tableau, `30 000 < length < 40 000` (plage durable, pas un `=== 34788` figé) ;
- chaque commune d'un **échantillon** (ou toutes, c'est bon marché) a un `insee` string non vide ;
- **aucun code INSEE dupliqué** (un `Set` sur les 34 788) ;
- les enrichissements critiques attendus sont présents sur l'échantillon (ex. `rankBands` sur les communes
  qui doivent en avoir).

**`index-pack.mjs`** (JSON de travail → gz canonique) :
1. vérifie que le JSON existe et se parse (sinon message explicite, cf. 4.6) ;
2. `assertIndexInvariants` ;
3. `gzip` **niveau 9** → `comparateur-index.json.gz.tmp` ;
4. **round-trip** : relit le `.tmp`, `gunzip`, compare le **SHA-256** des octets décompressés au SHA-256 du
   JSON source — refuse si divergence ;
5. renomme atomiquement vers `comparateur-index.json.gz`.

**Déterminisme (garde-fou anti-delta git).** `zlib.gzipSync` niveau 9 est **déterministe** (`MTIME=0` dans
l'en-tête ; deux compressions du même JSON → SHA-256 identique — **vérifié empiriquement** le 2026-07-15).
Conséquence gravée et **testée** : un `pack` sans changement de données ne doit **pas** produire de diff git.
Test d'acceptation :
```bash
npm run index:pack && sha256sum data/comparateur-index.json.gz
npm run index:pack && git diff --exit-code data/comparateur-index.json.gz   # doit sortir 0
```
Sans ce garde-fou, on aggraverait le risque git décrit au §6.

**`index-verify.mjs`** — la structure est validée **dans les deux régimes** (deux contenus identiques peuvent
être tous deux invalides ; l'égalité de hash ne suffit pas). Séquence :
1. **intégrité du gz** : il se lit et se `gunzip` ;
2. **validité JSON** : `JSON.parse` réussit ;
3. **invariants** : `assertIndexInvariants` ;
4. **synchronisation, seulement si le JSON local existe** : compare `SHA-256(comparateur-index.json)` à
   `SHA-256(gunzip(comparateur-index.json.gz))`. Divergence → refus :
   > « L'index local a été modifié mais l'artefact versionné n'a pas été repacké. Lancez `npm run
   > index:pack`. »

En régime **build / checkout frais** (pas de JSON local), les étapes 1→3 constituent le contrôle
d'**intégrité** de l'artefact canonique ; l'étape 4 est omise (rien à comparer). La synchronisation se
vérifie par **contenu (SHA-256)**, jamais par `mtime` (une date change après checkout, copie ou restauration
sans que le contenu bouge).

### 4.5 Garde-fous d'exécution du verify

- **Pre-commit hook + `prebuild` local** contrôlent la **synchronisation** — mais seulement là où la copie
  de travail existe. Le hook *dissuade*, il ne rend rien impossible (`--no-verify`, machine sans hook). Pas
  de husky dans le projet → hook git natif installé par un script idempotent `npm run hooks:install`,
  documenté.
- **`prebuild` Vercel** garantit l'**intégrité de l'artefact canonique** (régime checkout frais : le `.gz`
  se décompresse, se parse, passe les invariants). Il **ne peut pas** détecter une copie locale oubliée,
  puisqu'elle n'est pas versionnée et n'existe pas sur Vercel.

**Portée honnête de A (limite intrinsèque, pas un défaut d'implémentation) :** le pre-commit et le prebuild
local contrôlent la synchronisation quand la copie de travail existe ; le build Vercel garantit l'intégrité
du canonique mais ne voit pas un JSON local non repacké. Seul B offrirait l'impossibilité structurelle de
désync. Avec un contributeur principal et un dépôt non poussé, ce niveau est suffisant — mais la spec ne
promet pas ce que seul B donnerait. **Il n'y a pas de CI GitHub Actions** aujourd'hui ; un workflow pourra
être ajouté le jour où le repo est poussé, inerte d'ici là.

### 4.6 Clone frais — échec propre

Sur un checkout neuf, `comparateur-index.json` n'existe pas. On veut un message métier plutôt qu'un `ENOENT`
brut :
> « La copie de travail de l'index n'existe pas. Lancez `npm run index:unpack`. »

**Lever la contradiction « scripts inchangés ET erreur propre ».** Un script qui exécute directement
`fs.readFile("…json")` produira toujours `ENOENT` — les deux affirmations ne tiennent pas ensemble. Doctrine
retenue (couverture **best-effort**, cohérente avec le refus de migrer les 25 scripts) :
- un helper de garde partagé `scripts/lib/require-index-worktree.mjs` exporte `assertIndexWorktree()` (teste
  l'existence du JSON, affiche le message métier, `process.exit(1)`) ;
- on le câble **au fil de l'eau**, une ligne en tête des scripts d'enrichissement **ESM/tsx actifs** (import
  + appel) — cela ne touche **pas** leur logique I/O, donc ce n'est **pas** B ;
- là où le helper n'est pas (encore) câblé — scripts `.js` CommonJS, scripts `research/*` one-shot — un
  `ENOENT` reste possible ; il est **toléré et documenté**. La doctrine : les scripts d'enrichissement
  s'exécutent sur une copie de travail obtenue par `npm run index:unpack`.

Pas de `postinstall` automatique (décompresser 81 Mo à chaque `npm install` est une opération cachée et pas
toujours nécessaire). À la place : instruction claire dans le handoff/README. Les scripts d'enrichissement ne
voient **pas leur logique modifiée** (au plus une ligne de garde en tête).

## 5. Les 4 garde-fous obligatoires (rappel)

1. le `.gz` est explicitement l'**unique artefact canonique** ;
2. `pack` et `unpack` écrivent **atomiquement** (`.tmp` + rename) et **valident** leur sortie (round-trip) ;
3. la synchronisation est vérifiée par **comparaison de contenu (SHA-256)**, pas par `mtime` ;
4. le contrôle existe **au build** (`prebuild` Vercel, régime intégrité) en plus du pre-commit local
   (régime synchronisation) — voir la portée honnête de A au §4.5.

## 6. Risque à surveiller (post-livraison, ne bloque pas)

Les formats compressés produisent parfois de **mauvais deltas git** : une petite modification du JSON peut
changer une grande partie du flux gzip et ajouter plusieurs Mo à l'historique à chaque enrichissement (A et
B partagent ce risque, toutes deux versionnent le `.gz`). Après quelques mises à jour, mesurer :
```bash
git count-objects -vH
git verify-pack -v .git/objects/pack/*.idx
```
Si chaque enrichissement ajoute ~10 Mo à l'historique, envisager plus tard : stockage d'artefact externe,
Git LFS, ou enrichissements regroupés/moins fréquents. Hors périmètre de ce chantier.

## 7. Tests (suite dédiée, en plus de la vérif manuelle)

Sur la logique pure des scripts (fonctions extraites, testables sans I/O réel quand possible) :

| Cas | Résultat attendu |
|---|---|
| `pack` puis `unpack` | octets du JSON identiques (round-trip) |
| deux `pack` du même JSON | gzip identique, **aucun diff git** (déterminisme) |
| gzip tronqué | `verify` échoue clairement |
| gzip valide contenant du JSON invalide | échec de parsing |
| racine sans `communes` | échec d'invariant |
| INSEE dupliqué / échantillon sans `insee` | échec d'invariant |
| JSON local différent du gzip | erreur demandant `index:pack` |
| JSON local absent | vérification d'intégrité réussie (étape 4 omise) |
| deux appels concurrents à `loadIndex()` | **une seule** lecture disque |
| première lecture échouée | erreur **persistante** jusqu'au redémarrage (pas de retry) |

Le test de concurrence et celui de la promesse rejetée sont importants : ils gravent le comportement de
`loadIndex()` que ce lot corrige/établit, pour qu'un agent futur ne le régresse pas.

## 8. Vérification de fin

```bash
npm run index:pack && npm run index:verify   # round-trip + intégrité OK
node --test src/lib/*.test.ts src/lib/decision/*.test.ts   # 505 verts (non-régression)
npx tsc --noEmit                                           # 0
npm run build                                              # prebuild = index:verify passe
```
Plus : vérifier à l'écran qu'un dossier réel (ex. Roubaix) se charge et rend comme avant (l'index lu est
identique au JSON d'origine, garanti par le round-trip SHA-256).

## 9. Note à confirmer

Le 935 ms est mesuré sur disque local chaud. Vérifier au premier chargement réel en déploiement (disque
froid Vercel) que le ratio tient. Même s'il varie, lire 10 Mo au lieu de 77,5 Mo reste la bonne direction.
