# Écoles & culture en critères BPE — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire de l'accès aux écoles (collèges + lycées) et à une offre culturelle deux vrais critères opt-in du comparateur, alimentés par la BPE24 (INSEE) via un accès par rayon percentile, sans jamais mesurer la qualité ni la vitalité.

**Architecture:** Un script Python one-shot (`populate-bpe.py`, calqué sur `populate-nature.py`) lit la BPE24 géolocalisée, compte les équipements pertinents dans un rayon ~15 km autour de chaque centroïde de commune, normalise en percentile national, et patche `comparateur-index.json` (champs `ecoles`/`culture`). Le moteur expose deux préférences `acces_ecoles`/`acces_culture` (pur lookup, comme `nature`). Le parse route l'intention d'ACCÈS vers ces préférences et conserve l'intention de QUALITÉ/VITALITÉ en hors-mesure recadré. Aucun appel runtime.

**Tech Stack:** Python 3 (pandas 3.0.3, numpy 2.4.4 présents ; `pyarrow` à installer pour le parquet), Node/TypeScript (Next.js App Router, `node_modules/next/dist/docs/`), Anthropic tool use (parse). Vérification : `npx tsc --noEmit`, `npm run lint`, exécution du script + communes témoins, `curl` sur `/parse` et `/match`. PAS de runner de test (AGENTS.md) : on n'en introduit pas.

**Doctrine (rappel) :** accès/présence jamais qualité ; opt-in, ne jamais pénaliser le rural ; « accès à une offre culturelle » jamais « vie culturelle » ; culture au sens large (diffusion + pratique, pas que musée/biblio) ; pas de tiret cadratin (virgule/deux points) ; le scoring ne passe jamais par l'IA. `grep -c` renvoie exit 1 sur 0 match : ne pas le chaîner en `&&`.

---

## Fichiers touchés

- Create: `scripts/populate-bpe.py` — calcul accès BPE par rayon + patch index.
- Modify: `data/comparateur-index.json` — champs `ecoles`/`culture` par commune (via script).
- Modify: `src/lib/comparateur-vie.ts` — `PREFERENCE_KEYS`, type `IndexCommune`, scoring, `REASON_POS`/`REASON_NEG`.
- Modify: `src/lib/comparateur-labels.ts` — `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, `HORS_MESURE_PHRASES`.
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` — `PREF_LABELS` (gloses synthèse).
- Modify: `src/app/api/comparateur-vie/parse/route.ts` — prompt SYSTEM (routage + déduction + recadrage).
- Data locale (non commitée) : `data/bpe24.parquet` (~183 Mo, téléchargée).

Décision de nommage (cohérence à travers tout le plan) :
- clés de préférence : `acces_ecoles`, `acces_culture` ;
- champs d'index : `c.ecoles = { score, count }`, `c.culture = { score, count }` ;
- constantes Python : `ECOLES_TYPEQU`, `CULTURE_TYPEQU` (sets de codes), `RAYON_KM = 15`.

---

### Task 1 : Acquérir BPE24 et confirmer colonnes + codes TYPEQU

**Files:**
- Aucun fichier de code. Produit : `data/bpe24.parquet` local + une liste confirmée de codes.

- [ ] **Step 1 : Installer un lecteur parquet**

Run :
```bash
python3 -m pip install pyarrow
```
Expected : installation OK. Vérifier :
```bash
python3 -c "import pyarrow; print('pyarrow', pyarrow.__version__)"
```
Expected : affiche une version (plus « ABSENT »).

- [ ] **Step 2 : Télécharger BPE24 (action explicite, ~183 Mo)**

Le porteur a validé ce téléchargement. Le lancer (depuis la racine du repo) :
```bash
curl -L -o data/bpe24.parquet "https://static.data.gouv.fr/resources/base-permanente-des-equipements-3/20260330-145351/bpe24.parquet"
```
Expected : `data/bpe24.parquet` présent, taille ~183 Mo (`ls -lh data/bpe24.parquet`).

- [ ] **Step 3 : Inspecter les colonnes**

Run :
```bash
python3 -c "
import pyarrow.parquet as pq
sch = pq.read_schema('data/bpe24.parquet')
print(sch)
"
```
Expected : la liste des colonnes. Repérer :
- la colonne du type d'équipement (candidat : `TYPEQU`) ;
- les colonnes de coordonnées (candidats WGS84 : `LATITUDE`/`LONGITUDE` ; sinon Lambert 93 : `LAMBERT_X`/`LAMBERT_Y` ou `lambert_x`/`lambert_y`) ;
- la colonne code commune (candidat : `DEPCOM`).
Noter les noms EXACTS (casse comprise). Si les coordonnées sont en Lambert 93, prévoir une conversion (Step 6).

- [ ] **Step 4 : Lister les codes TYPEQU présents pour écoles et culture**

Run (adapter le nom de colonne TYPEQU si différent) :
```bash
python3 -c "
import pyarrow.parquet as pq
t = pq.read_table('data/bpe24.parquet', columns=['TYPEQU'])
import collections
c = collections.Counter(t.column('TYPEQU').to_pylist())
for k in sorted(c):
    print(k, c[k])
" | grep -E "^(C2|C3|F3|F1|G1)" 
```
Expected : la liste des codes commençant par C2/C3 (enseignement secondaire) et F3 (culture/loisirs), avec effectifs. Comparer à la nomenclature BPE INSEE pour fixer les sets définitifs.

- [ ] **Step 5 : Fixer les sets de codes (candidats à confirmer contre la nomenclature INSEE)**

Set candidat ÉCOLES (enseignement secondaire) :
- `C201` Collège
- `C301` Lycée d'enseignement général et/ou technologique
- `C302` Lycée d'enseignement professionnel
- `C303` Lycée d'enseignement technique et/ou professionnel agricole

Set candidat CULTURE (diffusion + pratique, au sens large) :
- `F303` Cinéma
- bibliothèque/médiathèque (confirmer le code exact : souvent `F312`)
- théâtre, musée (confirmer les codes `F3xx` exacts d'après la nomenclature)
- conservatoire / école de musique / salle de spectacle/concert/scène (confirmer s'ils
  existent dans la nomenclature du millésime ; les inclure s'ils existent).

Action : confirmer chaque code contre la nomenclature INSEE BPE24 (libellés des TYPEQU) et
écrire la liste finale dans la description de commit du Step suivant. Ces sets deviennent les
constantes `ECOLES_TYPEQU` / `CULTURE_TYPEQU` de la Task 2.

- [ ] **Step 6 : Ignorer ou ajouter `data/bpe24.parquet` au gitignore**

Le parquet (~183 Mo) ne doit PAS être commité. Vérifier :
```bash
grep -n "bpe24.parquet\|*.parquet" .gitignore || echo "à ajouter"
```
S'il n'est pas ignoré, l'ajouter :
```bash
printf '\n# BPE source locale (téléchargée, non versionnée)\ndata/bpe24.parquet\n' >> .gitignore
git add .gitignore && git commit -m "chore: ignorer data/bpe24.parquet (source BPE locale)"
```

---

### Task 2 : Script `populate-bpe.py` (calcul + patch index)

**Files:**
- Create: `scripts/populate-bpe.py`
- Modify (via `--write-index`): `data/comparateur-index.json`

- [ ] **Step 1 : Écrire le script**

Créer `scripts/populate-bpe.py` avec ce contenu (adapter les noms de colonnes confirmés en
Task 1 Step 3, et les sets confirmés en Task 1 Step 5) :

```python
#!/usr/bin/env python3
"""
populate-bpe.py — accès écoles (collèges+lycées) et culture (offre large) par rayon.

Calque populate-nature.py : pour chaque centroïde de commune (lu dans l'index), compte
les équipements BPE pertinents dans un rayon RAYON_KM, normalise en percentile national.
Accès / présence, JAMAIS la qualité ni la vitalité.

Source : data/bpe24.parquet (BPE24 INSEE géolocalisée, téléchargée hors runtime).
Usage :
    python3 scripts/populate-bpe.py                # calcule + écrit le cache
    python3 scripts/populate-bpe.py --write-index  # en plus, patche comparateur-index.json
"""
import json, os, sys, argparse, bisect
import numpy as np
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
PARQUET = os.path.join(ROOT, "data", "bpe24.parquet")
CACHE = os.path.join(ROOT, "data", ".cache")
OUT = os.path.join(CACHE, "communes-bpe.json")

RAYON_KM = 15
CELL = 0.18  # grille spatiale, comme populate-nature.py

# Codes confirmés en Task 1 (adapter si la nomenclature diffère).
ECOLES_TYPEQU = {"C201", "C301", "C302", "C303"}
CULTURE_TYPEQU = {"F303", "F312"}  # + théâtre/musée/conservatoire/scène confirmés en Task 1

# Noms de colonnes confirmés en Task 1 Step 3.
COL_TYPE = "TYPEQU"
COL_LAT = "LATITUDE"
COL_LON = "LONGITUDE"


def haversine_np(lat0, lon0, lats, lons):
    R = 6371.0
    p0 = np.radians(lat0); lp = np.radians(lats)
    dphi = lp - p0
    dlmb = np.radians(lons - lon0)
    a = np.sin(dphi / 2) ** 2 + np.cos(p0) * np.cos(lp) * np.sin(dlmb / 2) ** 2
    return 2 * R * np.arcsin(np.sqrt(a))


def load_equip_points(typequ_set):
    """Retourne (lats, lons) des équipements dont TYPEQU est dans typequ_set, géoloc valide."""
    t = pq.read_table(PARQUET, columns=[COL_TYPE, COL_LAT, COL_LON])
    types = np.array(t.column(COL_TYPE).to_pylist(), dtype=object)
    lats = np.array(t.column(COL_LAT).to_pylist(), dtype="float64")
    lons = np.array(t.column(COL_LON).to_pylist(), dtype="float64")
    keep = np.isin(types, list(typequ_set)) & np.isfinite(lats) & np.isfinite(lons)
    return lats[keep], lons[keep]


def count_within_radius(clat, clon, elat, elon):
    """Pour chaque commune (clat/clon), compte les équipements (elat/elon) dans RAYON_KM.
    Grille spatiale sur les équipements pour éviter le O(n*m)."""
    grid = {}
    for j in range(len(elat)):
        grid.setdefault((int(elat[j] // CELL), int(elon[j] // CELL)), []).append(j)
    out = np.zeros(len(clat), dtype=np.int64)
    for i in range(len(clat)):
        ci, cj = int(clat[i] // CELL), int(clon[i] // CELL)
        idxs = []
        for di in (-1, 0, 1):
            for dj in (-1, 0, 1):
                idxs += grid.get((ci + di, cj + dj), [])
        if not idxs:
            continue
        idxs = np.array(idxs)
        d = haversine_np(clat[i], clon[i], elat[idxs], elon[idxs])
        out[i] = int((d <= RAYON_KM).sum())
    return out


def percentile_scores(counts):
    """Percentile national du comptage (bisect, comme finalize() de populate-nature.py)."""
    srt = sorted(int(c) for c in counts)
    n = len(srt)
    return [round(100 * bisect.bisect_right(srt, int(c)) / n) if n else None for c in counts]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    codes = [c["insee"] for c in communes]
    clat = np.array([c["lat"] for c in communes], dtype="float64")
    clon = np.array([c["lon"] for c in communes], dtype="float64")
    print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)

    rec = {code: {} for code in codes}
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU)):
        elat, elon = load_equip_points(typeset)
        print(f"{field} : {len(elat)} équipements géolocalisés", file=sys.stderr)
        counts = count_within_radius(clat, clon, elat, elon)
        scores = percentile_scores(counts)
        for i, code in enumerate(codes):
            rec[code][field] = {"score": scores[i], "count": int(counts[i])}

    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT, "w"))
    print(f"✓ cache écrit : {OUT} ({len(rec)} communes)", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champs ecoles + culture : score + count)", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Lancer le calcul sans patcher (smoke test)**

Run :
```bash
python3 scripts/populate-bpe.py
```
Expected : logs « communes géolocalisées : ~35000 », « ecoles : N équipements », « culture : M équipements », puis « cache écrit ». Aucune exception. Si erreur de nom de colonne ou de code, revenir à Task 1 Step 3/5.

- [ ] **Step 3 : Contrôler les communes témoins (qualité de la donnée)**

Run :
```bash
python3 -c "
import json
rec = json.load(open('data/.cache/communes-bpe.json'))
for code,label in [('75056','Paris'),('31555','Toulouse'),('23001','Aubusson approx'),('48095','Mende'),('15014','Aurillac')]:
    r = rec.get(code)
    print(label, code, r)
"
```
Expected (ordre de grandeur, à juger) : une métropole (Paris/Toulouse) = scores écoles ET culture élevés (count élevé) ; une petite préfecture (Mende/Aurillac) = intermédiaire ; un village isolé = count faible, score bas. Vérifier qu'aucune valeur n'est aberrante (count négatif, score > 100). Juger la surpondération éventuelle des communes touristiques pour la culture (cf. spec) ; si flagrante, le noter pour un affinage ultérieur (hors V1).

- [ ] **Step 4 : Patcher l'index**

Run :
```bash
python3 scripts/populate-bpe.py --write-index
```
Expected : « index patché (champs ecoles + culture : score + count) ». Vérifier :
```bash
python3 -c "
import json
idx = json.load(open('data/comparateur-index.json'))
c = next(x for x in idx['communes'] if x['insee']=='75056')
print('ecoles', c.get('ecoles'), '| culture', c.get('culture'))
n = sum(1 for x in idx['communes'] if x.get('ecoles'))
print('communes avec champ ecoles :', n)
"
```
Expected : Paris a `ecoles` et `culture` non nuls ; le compte de communes renseignées est proche du total.

- [ ] **Step 5 : Commit (script + index)**

```bash
git add scripts/populate-bpe.py data/comparateur-index.json
git commit -m "feat(data): accès écoles & culture BPE24 par rayon (populate-bpe.py + index)"
```
Note : `data/comparateur-index.json` (~51 Mo) est déjà versionné dans ce repo ; le diff est volumineux mais attendu (comme pour nature/logement).

---

### Task 3 : Moteur — clés, type, scoring, reasons

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter les deux clés à `PREFERENCE_KEYS`**

Dans le tableau `PREFERENCE_KEYS`, après la ligne `"nature",` (dernière entrée), ajouter :

```ts
  // Accès BPE (collèges+lycées / offre culturelle large) dans ~15 km, percentile national.
  // Opt-in strict : aucun plancher. Accès, JAMAIS la qualité ni la vitalité.
  "acces_ecoles",
  "acces_culture",
```

- [ ] **Step 2 : Ajouter les champs au type `IndexCommune`**

Dans le type `IndexCommune`, après le bloc `logement?: { ... } | null;` (avant l'accolade
fermante du type), ajouter :

```ts
  // Accès BPE par rayon ~15 km (cf. scripts/populate-bpe.py). score = percentile national
  // du comptage d'équipements ; count = brut conservé pour un futur rapport. Accès, pas qualité.
  ecoles?: { score: number | null; count: number } | null;
  culture?: { score: number | null; count: number } | null;
```

- [ ] **Step 3 : Ajouter les cas de scoring**

Dans la fonction de score, juste après `case "nature":` ... `return c.nature?.score ?? null;`,
ajouter :

```ts
    case "acces_ecoles":
      return c.ecoles?.score ?? null; // percentile accès collèges+lycées dans ~15 km
    case "acces_culture":
      return c.culture?.score ?? null; // percentile accès offre culturelle dans ~15 km
```

- [ ] **Step 4 : Ajouter les libellés de raisons**

Dans `REASON_POS`, après la ligne `nature: "forêts et espaces naturels à proximité",` (et
avant `viabilite_emploi:`), ajouter :

```ts
  acces_ecoles: "collèges et lycées accessibles autour",
  acces_culture: "équipements culturels accessibles autour",
```

Dans `REASON_NEG`, après la ligne `nature: "peu d'espaces naturels à proximité",`, ajouter :

```ts
  acces_ecoles: "établissements du secondaire plus éloignés",
  acces_culture: "offre culturelle accessible plus limitée",
```

- [ ] **Step 5 : Vérifier compilation + absence de tiret cadratin**

```bash
npx tsc --noEmit
grep -n "—" src/lib/comparateur-vie.ts || echo "aucun tiret cadratin"
```
Expected : `tsc` sans erreur (les `Record<PreferenceKey, ...>` exigent les nouvelles clés,
donc une erreur ici signalerait un libellé manquant). `grep` : aucun tiret cadratin.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): critères acces_ecoles & acces_culture (clés, type, scoring, reasons)"
```

---

### Task 4 : Libellés, gloses, hors-mesure recadré

**Files:**
- Modify: `src/lib/comparateur-labels.ts`
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1 : `PREFERENCE_LABELS` (comparateur-labels.ts)**

Dans `PREFERENCE_LABELS`, après `nature: "des espaces naturels à proximité",`, ajouter :

```ts
  acces_ecoles: "l'accès aux collèges et lycées",
  acces_culture: "l'accès à une offre culturelle",
```

- [ ] **Step 2 : `PREFERENCE_INTERPRETATIONS` (gloses visibles obligatoires)**

Dans `PREFERENCE_INTERPRETATIONS`, après la ligne `nature: "forêts, prairies et milieux naturels autour",`, ajouter :

```ts
  // Gloses OBLIGATOIRES (caveat méthodo assumé) : éviter le contresens « critère présent =
  // bonnes écoles / vie culturelle riche ». On mesure l'accès, pas la qualité ni la vitalité.
  acces_ecoles: "accès aux collèges et lycées autour, pas la qualité des établissements",
  acces_culture: "présence d'équipements culturels accessibles autour, pas l'animation ni la qualité",
```

- [ ] **Step 3 : `HORS_MESURE_PHRASES` recadrées (qualité/vitalité)**

Dans `HORS_MESURE_PHRASES`, remplacer les entrées `ecoles` et `culture` (garder `affectif`) :

Remplacer :
```ts
  ecoles:
    "La présence d'écoles, de collèges et de lycées n'est pas encore un critère mesuré par futur•e.",
  culture:
    "L'accès à la vie culturelle (cinémas, théâtres, musées) n'est pas encore un critère mesuré par futur•e.",
```
par :
```ts
  ecoles:
    "La qualité, la réputation et les options des établissements ne sont pas mesurées par futur•e ; seul l'accès aux collèges et lycées l'est.",
  culture:
    "L'animation culturelle, la programmation et la vie associative locale ne sont pas mesurées par futur•e ; seul l'accès aux équipements culturels l'est.",
```

Mettre aussi à jour le commentaire au-dessus (lignes ~91-94) qui dit « écoles / culture = pas
encore » : le remplacer par :
```ts
// Phrases honnêtes affichées au gate pour les facettes SANS critère dans le moteur. écoles /
// culture sont désormais MESURÉES en ACCÈS (acces_ecoles / acces_culture) ; leur phrase
// hors-mesure est recadrée sur la facette non mesurée (qualité / vitalité). affectif = jamais
// mesurable (expérience personnelle). On n'interpole jamais le mot brut (accords bancals).
```

- [ ] **Step 4 : `PREF_LABELS` de la synthèse (synthesize/route.ts)**

Dans `synthesize/route.ts`, dans la const `PREF_LABELS`, après la dernière entrée
(`viabilite_emploi: "un bassin d'emploi dynamique",`), ajouter :

```ts
  acces_ecoles: "l'accès aux collèges et lycées",
  acces_culture: "l'accès à une offre culturelle",
```

- [ ] **Step 5 : Vérifier compilation + lint + tiret cadratin**

```bash
npx tsc --noEmit
npm run lint 2>&1 | grep -iE "comparateur-labels|synthesize/route" || echo "aucune erreur lint sur les 2 fichiers"
grep -n "—" src/lib/comparateur-labels.ts src/app/api/comparateur-vie/synthesize/route.ts || echo "aucun tiret cadratin"
```
Expected : `tsc` propre, pas d'erreur lint sur ces deux fichiers, aucun tiret cadratin.

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-labels.ts src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): libellés + gloses acces_ecoles/culture, hors-mesure recadré (qualité/vitalité)"
```

---

### Task 5 : Parse — routage accès, déduction famille, recadrage, vocabulaire

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Réécrire les lignes HORS-MESURE du prompt SYSTEM**

Dans la const `SYSTEM`, remplacer les trois lignes actuelles (écoles / culture / affectif)
de la section « HORS-MESURE » :

Remplacer :
```
- "écoles", "école", "collège", "lycée", "scolarité", "bon établissement scolaire" → { term, kind: "ecoles" }. NE rabattez PAS sur acces_services.
- "vie culturelle", "culture", "cinéma", "théâtre", "musée", "concerts", "sorties", "animée culturellement" → { term, kind: "culture" }. NE rabattez PAS sur eviter_isolement ni sur une grande ville.
```
par :
```
- ÉCOLES. L'ACCÈS aux collèges et lycées EST mesuré (acces_ecoles). La QUALITÉ ne l'est pas.
  • "écoles", "collège", "lycée", "scolarité", "scolariser" (accès) → préférence acces_ecoles (weight 2, ou 3 si essentiel).
  • Si le projet exprime clairement une FAMILLE avec enfants à scolariser SANS dire "école" → acces_ecoles weight 1 (déduction, jamais plus). Présentée comme votre lecture, jamais comme sa demande.
  • "bonnes écoles", "qualité", "réputation", "établissement réputé", "options" (bilingue, latin) → AJOUTER en plus { term, kind: "ecoles" } (qualité, hors-mesure). NE rabattez PAS sur acces_services.
  • CAS CANONIQUE : "une ville avec de bonnes écoles" → préférence acces_ecoles (weight 2) ET horsMesure { kind: "ecoles" }. Les deux à la fois.
- CULTURE. L'ACCÈS à une offre culturelle EST mesuré (acces_culture), AU SENS LARGE : cinéma, médiathèque, théâtre, musée, mais aussi diffusion et pratique (salle de spectacle/concert, conservatoire, école de musique). La VITALITÉ (programmation, scène locale, associations) ne l'est pas.
  • "culture", "cinéma", "théâtre", "musée", "médiathèque", "bibliothèque", "concerts", "spectacle", "conservatoire", "sorties culturelles" (accès) → préférence acces_culture (weight 2, ou 3 si essentiel). JAMAIS de déduction culture (uniquement si exprimé).
  • "vie culturelle animée", "ambiance", "scène locale", "vie associative", "ça bouge culturellement" (vitalité) → AJOUTER { term, kind: "culture" } (hors-mesure). NE rabattez PAS sur eviter_isolement ni sur une grande ville.
  • Dites toujours "accès à une offre culturelle", JAMAIS "vie culturelle", dans la reformulation.
```

- [ ] **Step 2 : Mettre à jour la phrase de cadrage qui interdisait écoles/culture en préférence**

Dans la section haute du prompt, repérer la phrase (vers le début) :
```
- N'inventez aucune donnée. Services, sécurité, prix : hors périmètre V1, ne créez pas de préférence. Les écoles et la vie culturelle se déclarent en horsMesure (voir HORS-MESURE), jamais en préférence ni en ambiguities.
```
La remplacer par :
```
- N'inventez aucune donnée. Sécurité, prix : hors périmètre, ne créez pas de préférence. L'ACCÈS aux écoles (collèges/lycées) et à une offre culturelle EST mesuré (acces_ecoles / acces_culture, voir LISTE et HORS-MESURE) ; seule leur QUALITÉ / VITALITÉ reste en horsMesure.
```

- [ ] **Step 3 : Ajouter les deux clés à la LISTE des préférences du prompt**

Dans la section qui décrit chaque préférence (celle contenant `- nature : ...`), après la
ligne `nature`, ajouter :
```
- acces_ecoles : accès aux collèges et lycées autour (présence/proximité, PAS la qualité des établissements). Pour « écoles », « collège », « lycée », « scolarité », ou déduit d'une famille avec enfants (weight 1).
- acces_culture : accès à une offre culturelle autour au sens large, diffusion et pratique (cinéma, médiathèque, théâtre, musée, salle de spectacle/concert, conservatoire). PAS la vitalité ni la programmation.
```

- [ ] **Step 4 : Vérifier compilation + tiret cadratin**

```bash
npx tsc --noEmit
grep -n "—" src/app/api/comparateur-vie/parse/route.ts || echo "aucun tiret cadratin"
```
Expected : `tsc` propre ; aucun tiret cadratin (les flèches `→` et puces `•`/`-` sont permises, seul le tiret cadratin `—` est interdit).

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse route l'accès écoles/culture en préférences, qualité/vitalité en hors-mesure"
```

---

### Task 6 : Vérification end-to-end (serveur dev)

**Files:** aucun (vérification manuelle).

- [ ] **Step 1 : Lancer le serveur dev (si pas déjà lancé)**

```bash
npm run dev
```
Expected : prêt sur `http://localhost:3000`.

- [ ] **Step 2 : `/parse` — cas canonique « bonnes écoles »**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'Content-Type: application/json' \
  -d '{"project":"une ville avec de bonnes écoles, pas trop chère"}' | python3 -m json.tool
```
Expected : `preferences` contient `acces_ecoles` (weight 2 environ) ET `horsMesure` contient `{ kind: "ecoles" }`. Les deux à la fois (accès mesuré + qualité honnête).

- [ ] **Step 3 : `/parse` — déduction famille (sans le mot « école »)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'Content-Type: application/json' \
  -d '{"project":"on déménage en famille avec nos deux enfants à scolariser, on veut du calme"}' | python3 -m json.tool
```
Expected : `acces_ecoles` présent avec weight 1 (déduction), `cadre_calme` présent. Pas de `acces_culture`.

- [ ] **Step 4 : `/parse` — culture au sens large, et vitalité en hors-mesure**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse \
  -H 'Content-Type: application/json' \
  -d '{"project":"j aime le cinéma, les concerts et une médiathèque ; idéalement une ville avec une vraie vie culturelle et des assos"}' | python3 -m json.tool
```
Expected : `acces_culture` en préférence ; `horsMesure` contient `{ kind: "culture" }` (la « vraie vie culturelle / assos » = vitalité). La reformulation parle d'« accès à une offre culturelle », jamais de « vie culturelle » comme critère mesuré.

- [ ] **Step 5 : `/match` — accès reflété, rural non pénalisé**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
  -H 'Content-Type: application/json' \
  -d '{"reformulation":"accès aux collèges et lycées","hardConstraints":{},"preferences":[{"key":"acces_ecoles","weight":2}]}' | python3 -m json.tool | head -60
```
Expected : des communes bien dotées en accès secondaire ressortent ; la reason « collèges et lycées accessibles autour » apparaît. Lancer aussi un projet SANS acces_ecoles/culture (ex. `{"preferences":[{"key":"nature","weight":2}]}`) et vérifier qu'une commune rurale n'est pas pénalisée par l'absence d'écoles/culture (les clés non demandées n'entrent pas dans le score).

- [ ] **Step 6 : Rien à committer (vérification). En cas d'anomalie, corriger dans la tâche concernée et re-committer.**

---

## Self-Review (effectuée)

- **Couverture spec :** source BPE24 figée + pyarrow (Task 1) ✓ ; accès par rayon percentile, écoles=collège+lycée, culture large diffusion+pratique, brut conservé (Task 2) ✓ ; deux clés opt-in + scoring + reasons (Task 3) ✓ ; gloses visibles verbatim + hors-mesure recadré qualité/vitalité + PREF_LABELS synthèse (Task 4) ✓ ; parse routage accès, déduction famille poids 1, jamais culture, vocabulaire « offre culturelle », cas canonique « bonnes écoles » (Task 5) ✓ ; vérif témoins + curl parse/match + rural non pénalisé (Task 2 Step 3, Task 6) ✓ ; points à vérifier (TYPEQU, coords, surpondération touristique, effet de bord rayon, rayon unique urbain/rural) couverts (Task 1, Task 2 Step 3, et notés hors-V1).
- **Placeholders :** sets TYPEQU et noms de colonnes sont des CANDIDATS confirmés par données réelles en Task 1 (étape de vérification, pas un trou) ; tout le code est fourni.
- **Cohérence des noms :** clés `acces_ecoles`/`acces_culture` ; champs index `ecoles`/`culture` avec `{ score, count }` ; constantes `ECOLES_TYPEQU`/`CULTURE_TYPEQU` ; `RAYON_KM=15`. Identiques de la Task 2 à la Task 6.

## Hors périmètre (rappel spec)

Qualité/réputation écoles, vitalité culturelle réelle, temps d'accès routier, module rapport
écoles/culture, primaire/maternelle, rayon adaptatif à la densité. Tous notés, hors V1.
