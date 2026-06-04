# Vie locale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `vie_locale` mesurant l'intensité de vie sociale (densité de lieux de sociabilité OSM + tissu associatif RNA/AMALIA, rapportée à la population avec masse critique), précalculé dans l'index.

**Architecture:** Script offline `scripts/populate-vie-locale.py` : (1) lieux de sociabilité depuis OSM (tags café/bar/restaurant/marché/sport/community_centre, tuilé), rattachés à leur commune (centroïde le plus proche) ; (2) associations actives RNA (waldec, géocodage `adrs_codeinsee`) + AMALIA (Alsace-Moselle, géocodage nom+CP). Pour chaque commune : `densité = compte/(pop+K)` par composante, percentile parmi non-nulles (zéro épinglé), score `= 0.7·P_lieux + 0.3·P_assos`. Le moteur TS lit un percentile. Six points de câblage.

**Tech Stack:** Python 3 (`numpy`, venv `.venv-bpe`). Sources : OSM Overpass (réutilise le patron de tuilage de `populate-reseau-local.py`), RNA waldec (`media.interieur.gouv.fr/rna/rna_waldec_*.zip`, déjà en cache `data/.cache/rna_waldec.zip`), AMALIA 67/68/57 (data.gouv). Pas de runner de test (doctrine) : `--selftest` + exécutions réelles + sondes + matrice témoins, puis `tsc`+`lint`+curl.

**Spec :** `docs/superpowers/specs/2026-06-04-vie-locale-design.md`

---

## File Structure

- `scripts/populate-vie-locale.py` (créé) : seul fichier de logique data. Duplique les petits helpers stables de `populate-reseau-local.py` (`hav_km`, `cell_key`, `tiles`, `fetch_tile`, miroirs/bbox) pour rester self-contained (patron du projet). Modes `--selftest`/`--summary`/`--probe`/`--matrix`/`--write-index`.
- `src/lib/comparateur-vie.ts` (modifié) : type `vieLocale`, `PREFERENCE_KEYS`, `subScore`, `REASON_POS`/`REASON_NEG`, `AMBIENT_DIMENSIONS`. Bust `indexCache`.
- `src/lib/comparateur-labels.ts` (modifié) : `PREFERENCE_LABELS`, `PREFERENCE_TOOLTIP`.
- `src/app/api/comparateur-vie/synthesize/route.ts` (modifié) : `PREF_LABELS`.
- `src/app/api/comparateur-vie/parse/route.ts` (modifié) : routage « vie locale / animé / il se passe des choses ».
- `data/comparateur-index.json` (patché via `--write-index`), `data/.cache/*` (gitignorés).

---

## Task 1 : Squelette + fonctions pures + selftest

**Files:**
- Create: `scripts/populate-vie-locale.py`

- [ ] **Step 1 : Créer le squelette (constantes, helpers OSM dupliqués, fonctions pures)**

```python
#!/usr/bin/env python3
"""populate-vie-locale.py — intensité de vie sociale (lieux de sociabilité OSM + tissu associatif).

Pour chaque commune : densité = compte/(pop+K) pour les lieux (OSM) et les associations
(RNA waldec + AMALIA), percentile parmi les communes non nulles (zéro épinglé), score
= 0.7·P_lieux + 0.3·P_assos. cf. spec 2026-06-04-vie-locale.

Venv .venv-bpe (numpy). Modes : --selftest --summary --probe --matrix --write-index.
"""
import json, os, sys, csv, io, math, argparse, bisect, zipfile, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-social-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-vie-locale.json")
RNA_WALDEC_ZIP = os.path.join(CACHE, "rna_waldec.zip")
RNA_WALDEC_URL = "https://media.interieur.gouv.fr/rna/rna_waldec_20260601.zip"
AMALIA = {  # dept -> URL data.gouv (CSV ; ETAT_ASSOCIATION, COMMUNE, CODE_POSTAL)
    "67": "https://static.data.gouv.fr/resources/associations-de-droit-local-alsace-moselle-pour-le-departement-du-bas-rhin-67/20260602-153021/67-opendatas.csv",
}
AMALIA_CACHE = os.path.join(CACHE, "amalia")

OVERPASS_MIRRORS = [
    "https://overpass.openstreetmap.fr/api/interpreter",
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]
METRO_BBOX = (41.0, -5.6, 51.6, 9.8)
DOM_BBOXES = [(15.7, -61.9, 16.6, -60.9), (14.3, -61.3, 14.9, -60.7),
              (2.0, -54.8, 6.0, -51.5), (-21.5, 55.1, -20.8, 56.0), (-13.1, 44.9, -12.5, 45.4)]
TILE_DEG = 2.0
ASSIGN_CELL = 0.1   # grille de rattachement POI -> commune (centroïde le plus proche)
R_EARTH = 6371.0

# K (masse critique) : population virtuelle au dénominateur. FIGÉ PAR SONDE (Task 4).
K = 3000


def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))


def cell_key(lat, lon, size):
    return (int(math.floor(lat / size)), int(math.floor(lon / size)))


def density(count, pop, k=K):
    """Intensité par habitant lissée par la masse critique k."""
    return count / ((pop or 0) + k)


def component_pct(densities):
    """Zéro épinglé -> 0 ; percentile 1-100 parmi les communes à densité > 0."""
    pos = sorted(d for d in densities if d > 0)
    m = len(pos)
    return [0 if (d <= 0 or m == 0) else max(1, round(100 * bisect.bisect_right(pos, d) / m)) for d in densities]


def combine(p_lieux, p_assos):
    """Score vie_locale = 0.7 lieux + 0.3 assos (composantes déjà 0-100)."""
    return round(0.7 * p_lieux + 0.3 * p_assos)
```

- [ ] **Step 2 : Ajouter le selftest et le `main` minimal**

```python
def selftest():
    assert abs(density(10, 7000) - 10 / 10000) < 1e-12
    assert abs(density(1, 30) - 1 / 3030) < 1e-12   # hameau écrasé par K
    assert density(0, 5000) == 0.0
    # composante : zéros -> 0, positifs -> percentile parmi >0 (3 positifs : 0.001,0.002,0.004)
    assert component_pct([0, 0, 0.001, 0.002, 0.004]) == [0, 0, 33, 67, 100]
    assert component_pct([0, 0]) == [0, 0]
    assert combine(100, 0) == 70
    assert combine(0, 100) == 30
    assert combine(90, 50) == 78
    assert cell_key(0.00051, 0.0, 0.0005) == (1, 0)
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    for f in ("selftest", "summary", "probe", "matrix", "write-index", "refresh-osm"):
        ap.add_argument(f"--{f}", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return


if __name__ == "__main__":
    main()
```

- [ ] **Step 3 : Lancer le selftest**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --selftest`
Expected : `✓ selftest OK`, exit 0.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-vie-locale.py
git commit -m "feat(vie-locale): squelette + fonctions pures (densite, percentile, combine) + selftest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Lieux de sociabilité (OSM tuilé) → comptes par commune

**Files:**
- Modify: `scripts/populate-vie-locale.py`

- [ ] **Step 1 : Helpers de tuilage OSM (dupliqués du patron reseau-local) + requête sociabilité**

Insérer avant `def selftest():` :

```python
SOCIAL_QUERY_BODY = (
    'node["amenity"~"^(cafe|bar|pub|restaurant|marketplace|community_centre)$"]{bb};'
    'node["leisure"~"^(sports_centre|pitch|stadium|sports_hall)$"]{bb};'
)


def overpass_query(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return f'[out:json][timeout:180];({SOCIAL_QUERY_BODY.replace("{bb}", bb)});out body;'


def fetch_tile(query, dest):
    payload = urllib.parse.urlencode({"data": query}).encode()
    last = None
    for url in OVERPASS_MIRRORS:
        for attempt in (1, 2):
            try:
                req = urllib.request.Request(url, data=payload, headers={"User-Agent": "futur-e/populate-vie-locale"})
                with urllib.request.urlopen(req, timeout=300) as r:
                    body = r.read()
                doc = json.loads(body)
                if "elements" in doc:
                    with open(dest, "wb") as f:
                        f.write(body)
                    return doc["elements"]
                last = f"{url}: pas d'elements"
            except Exception as e:  # noqa: BLE001
                last = f"{url} (essai {attempt}) : {e}"
    raise RuntimeError(f"tuile Overpass échouée. Dernier : {last}")


def tiles():
    out = []
    s0, w0, n0, e0 = METRO_BBOX
    s = s0
    while s < n0:
        w = w0
        while w < e0:
            out.append((round(s, 3), round(w, 3), round(min(s + TILE_DEG, n0), 3), round(min(w + TILE_DEG, e0), 3)))
            w += TILE_DEG
        s += TILE_DEG
    return out + DOM_BBOXES


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes
```

- [ ] **Step 2 : Charger les POI OSM et les rattacher à la commune la plus proche**

```python
def load_social_pois():
    """Récupère les POI de sociabilité OSM (tuilé, caché). Retourne (lats, lons) numpy."""
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    lats, lons = [], []
    tl = tiles()
    for i, (s, w, n, e) in enumerate(tl):
        dest = os.path.join(OSM_TILE_DIR, f"t_{s}_{w}.json")
        if os.path.exists(dest):
            elements = json.load(open(dest)).get("elements", [])
        else:
            elements = fetch_tile(overpass_query(s, w, n, e), dest)
            print(f"  tuile {i+1}/{len(tl)} ({s},{w}) : {len(elements)} POI", file=sys.stderr)
        for el in elements:
            if el.get("lat") is not None and el.get("lon") is not None:
                lats.append(el["lat"]); lons.append(el["lon"])
    print(f"POI sociabilité OSM : {len(lats)}", file=sys.stderr)
    return np.array(lats, "float64"), np.array(lons, "float64")


def assign_to_communes(communes, plat, plon):
    """Rattache chaque POI à la commune au centroïde le plus proche (grille, recherche en
    anneaux croissants). Retourne dict insee -> nb POI."""
    grid = {}
    for i, c in enumerate(communes):
        grid.setdefault(cell_key(c["lat"], c["lon"], ASSIGN_CELL), []).append(i)
    counts = {c["insee"]: 0 for c in communes}
    for j in range(len(plat)):
        ci, cj = cell_key(plat[j], plon[j], ASSIGN_CELL)
        best = None; bestd = 1e18
        ring = 0
        while best is None and ring <= 20:
            for di in range(-ring, ring + 1):
                for dj in range(-ring, ring + 1):
                    if ring and max(abs(di), abs(dj)) != ring:
                        continue  # seulement l'anneau extérieur
                    for i in grid.get((ci + di, cj + dj), []):
                        d = hav_km(plat[j], plon[j], np.array([communes[i]["lat"]]), np.array([communes[i]["lon"]]))[0]
                        if d < bestd:
                            bestd = d; best = i
            ring += 1
        if best is not None:
            counts[communes[best]["insee"]] += 1
    return counts
```

- [ ] **Step 3 : Brancher `--summary` (partie lieux)**

Dans `main()`, après le bloc `--selftest`, ajouter :

```python
    if args.summary:
        idx, communes = load_communes()
        print(f"communes : {len(communes)}", file=sys.stderr)
        plat, plon = load_social_pois()
        lieux = assign_to_communes(communes, plat, plon)
        nz = sum(1 for v in lieux.values() if v > 0)
        top = sorted(lieux.items(), key=lambda kv: -kv[1])[:5]
        print(f"communes avec ≥1 POI : {nz} | top : {[(k, v) for k, v in top]}", file=sys.stderr)
        return
```

- [ ] **Step 4 : Lancer `--summary` (télécharge OSM, ~quelques minutes la 1re fois)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --summary`
Expected (stderr) : progression des tuiles, `POI sociabilité OSM : ` plusieurs centaines de milliers, `communes avec ≥1 POI :` une large part, `top :` de grandes villes (Paris, Lyon, Marseille…) avec des milliers de POI. Garde-fou : si 0 POI ou tuiles toutes vides, vérifier les miroirs Overpass.

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-vie-locale.py
git commit -m "feat(vie-locale): POI sociabilite OSM tuiles + rattachement commune (Voronoi grille)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Associations actives (RNA waldec + AMALIA) → comptes par commune

**Files:**
- Modify: `scripts/populate-vie-locale.py`

- [ ] **Step 1 : Charger le RNA waldec (géocodage `adrs_codeinsee`, actif = `position == 'A'`)**

Insérer avant `def selftest():` :

```python
def download(url, dest):
    if not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-vie-locale"})
        with urllib.request.urlopen(req, timeout=580) as r, open(dest, "wb") as f:
            f.write(r.read())
    return dest


def load_rna(valid_insee):
    """RNA waldec : associations ACTIVES (position == 'A') par INSEE (adrs_codeinsee).
    valid_insee = set des INSEE de l'index (pour ignorer codes hors périmètre)."""
    download(RNA_WALDEC_URL, RNA_WALDEC_ZIP)
    counts = {}
    z = zipfile.ZipFile(RNA_WALDEC_ZIP)
    files = [n for n in z.namelist() if n.lower().endswith(".csv")]
    for name in files:
        with z.open(name) as f:
            rd = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";")
            # 1re colonne porte un BOM : retrouver les clés par suffixe.
            for row in rd:
                pos = (row.get("position") or "").strip().upper()
                if pos != "A":
                    continue
                ins = (row.get("adrs_codeinsee") or "").strip()
                if ins in valid_insee:
                    counts[ins] = counts.get(ins, 0) + 1
    print(f"RNA actives géocodées : {sum(counts.values())} sur {len(counts)} communes", file=sys.stderr)
    return counts
```

- [ ] **Step 2 : Charger AMALIA (Alsace-Moselle, géocodage nom+CP → INSEE)**

```python
def normalize_nom(s):
    import unicodedata
    s = unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()
    for ch in "-'":
        s = s.replace(ch, " ")
    return " ".join(s.split())


def build_nom_index(communes, depts):
    """(nom normalisé, dept) -> insee, restreint aux départements `depts`."""
    m = {}
    for c in communes:
        if str(c.get("dept")) in depts:
            m[(normalize_nom(c["nom"]), str(c["dept"]))] = c["insee"]
    return m


def load_amalia(communes, valid_insee):
    """AMALIA 67/68/57 : associations INSCRITE par INSEE (résolu via nom+dept).
    dept déduit du CODE_POSTAL (2 premiers chiffres)."""
    depts = {"67", "68", "57"}
    nom_idx = build_nom_index(communes, depts)
    counts = {}
    unmatched = 0
    for dept, url in AMALIA.items():
        path = download(url, os.path.join(AMALIA_CACHE, f"{dept}.csv"))
        rd = csv.DictReader(open(path, encoding="utf-8-sig"), delimiter=";")
        for row in rd:
            if (row.get("ETAT_ASSOCIATION") or "").strip().upper() != "INSCRITE":
                continue
            cp = (row.get("CODE_POSTAL") or "").strip()
            d = cp[:2] if cp[:2] in depts else dept
            ins = nom_idx.get((normalize_nom(row.get("COMMUNE", "")), d))
            if ins and ins in valid_insee:
                counts[ins] = counts.get(ins, 0) + 1
            else:
                unmatched += 1
    print(f"AMALIA inscrites géocodées : {sum(counts.values())} ({unmatched} non résolues)", file=sys.stderr)
    return counts
```

- [ ] **Step 3 : Compléter `AMALIA` avec les URLs 68 et 57**

Récupérer les URLs courantes des deux datasets restants et compléter le dict `AMALIA` :

```bash
cd "$(git rev-parse --show-toplevel)"
for slug in "associations-de-droit-local-alsace-moselle-pour-le-departement-du-haut-rhin-68" \
            "associations-de-droit-local-alsace-moselle-pour-le-departement-de-la-moselle-57"; do
  echo "=== $slug ==="
  curl -sL "https://www.data.gouv.fr/api/1/datasets/$slug/" | python3 -c "import json,sys;d=json.load(sys.stdin);print([r['url'] for r in d['resources'] if r.get('format')=='csv'][:1])"
done
```

Ajouter les deux URLs obtenues dans le dict `AMALIA` (clés `"68"` et `"57"`). Si un slug a changé, chercher « associations droit local <dept> » sur data.gouv.

- [ ] **Step 4 : Fusionner RNA + AMALIA et brancher dans `--summary`**

Ajouter la fonction de fusion :

```python
def load_assos(communes):
    valid = {c["insee"] for c in communes}
    rna = load_rna(valid)
    amalia = load_amalia(communes, valid)
    out = dict(rna)
    for ins, v in amalia.items():
        out[ins] = out.get(ins, 0) + v
    print(f"assos totales : {sum(out.values())} sur {len(out)} communes", file=sys.stderr)
    return out
```

Et dans `main()`, à la fin du bloc `--summary` (avant `return`), ajouter :

```python
        assos = load_assos(communes)
        # contrôle Alsace-Moselle : Strasbourg (67482) doit être non nul (via AMALIA).
        print(f"Strasbourg assos : {assos.get('67482', 0)} | Paris 1er : {assos.get('75101', 0)}", file=sys.stderr)
```

- [ ] **Step 5 : Lancer `--summary` (vérifie RNA + AMALIA)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --summary`
Expected (stderr) : `RNA actives géocodées : ` ~1,2-1,5 M sur ~30k communes ; `AMALIA inscrites géocodées : ` plusieurs dizaines de milliers (67+68+57) ; `Strasbourg assos :` non nul (preuve que le trou Alsace-Moselle est comblé) ; `Paris 1er :` non nul. Garde-fou : si `Strasbourg assos : 0`, le géocodage AMALIA nom+dept a échoué (vérifier `normalize_nom` / colonnes).

- [ ] **Step 6 : Commit**

```bash
git add scripts/populate-vie-locale.py
git commit -m "feat(vie-locale): assos actives RNA waldec (adrs_codeinsee) + AMALIA Alsace-Moselle

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Densités + sonde de K (GATE produit)

**Files:**
- Modify: `scripts/populate-vie-locale.py`

- [ ] **Step 1 : Calcul du score + témoins**

Insérer avant `def selftest():` :

```python
TEMOINS = {
    "30334": "Uzès (petite ville vivante)",
    "93071": "Sevran (banlieue dortoir dense)",
    "83119": "Saint-Tropez (village touristique)",
    "56157": "Plaudren (village 1 café)",
    "69381": "Lyon 1er (grande ville active)",
    "17300": "La Rochelle (agglo centre)",
    "17286": "Puilboreau (agglo périph)",
    "17197": "Lagord (agglo périph)",
    "17028": "Aytré (agglo périph)",
}


def compute_scores(communes, lieux, assos, k):
    """Retourne dict insee -> (score, p_lieux, p_assos, n_lieux, n_assos)."""
    dl = [density(lieux.get(c["insee"], 0), c.get("population"), k) for c in communes]
    da = [density(assos.get(c["insee"], 0), c.get("population"), k) for c in communes]
    pl = component_pct(dl)
    pa = component_pct(da)
    out = {}
    for i, c in enumerate(communes):
        out[c["insee"]] = (combine(pl[i], pa[i]), pl[i], pa[i],
                           lieux.get(c["insee"], 0), assos.get(c["insee"], 0))
    return out
```

- [ ] **Step 2 : Brancher `--probe` (balayage de K sur témoins)**

Dans `main()`, après le bloc `--summary` :

```python
    if args.probe:
        idx, communes = load_communes()
        plat, plon = load_social_pois()
        lieux = assign_to_communes(communes, plat, plon)
        assos = load_assos(communes)
        print(f"\n{'commune':32} " + "".join(f"{f'K={k}':>10}" for k in (1000, 3000, 8000)), file=sys.stderr)
        scores = {k: compute_scores(communes, lieux, assos, k) for k in (1000, 3000, 8000)}
        for ins, lib in TEMOINS.items():
            cells = [f"{scores[k].get(ins, ('—',))[0]:>10}" for k in (1000, 3000, 8000)]
            print(f"{lib:32} " + "".join(cells), file=sys.stderr)
        return
```

- [ ] **Step 3 : Lancer la sonde**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --probe`
Expected : un tableau score par commune témoin pour K = 1000/3000/8000. Lecture attendue : Uzès / Lyon haut ; Sevran (dortoir) bas ; Saint-Tropez élevé (à surveiller, biais tourisme) ; Plaudren moyen et **décroissant quand K monte** (la masse critique écrase le village) ; l'agglo La Rochelle : centre haut, périphéries graduées.

- [ ] **Step 4 : Présenter la sonde au porteur et figer K (GATE)**

Coller la sortie. Le porteur choisit K. Critère : K où le village (Plaudren) est « moyen pas exceptionnel », la banlieue-dortoir (Sevran) basse, et la petite ville vivante (Uzès) haute. Attendre le choix explicite avant de continuer.

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-vie-locale.py
git commit -m "feat(vie-locale): calcul score 70/30 + sonde de K (temoins)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Fige K, calcule l'index, matrice témoins (GATE signal)

**Files:**
- Modify: `scripts/populate-vie-locale.py`

- [ ] **Step 1 : Fixer `K` à la valeur validée en Task 4**

Mettre la constante `K` à la valeur choisie par le porteur (commentaire actant la décision).

- [ ] **Step 2 : Bloc de calcul complet + cache + matrice + write-index**

Dans `main()`, après le bloc `--probe`, ajouter :

```python
    idx, communes = load_communes()
    plat, plon = load_social_pois()
    lieux = assign_to_communes(communes, plat, plon)
    assos = load_assos(communes)
    scores = compute_scores(communes, lieux, assos, K)
    rec = {}
    for c in communes:
        sc, pl, pa, nl, na = scores[c["insee"]]
        rec[c["insee"]] = None if (pl == 0 and pa == 0) else {"score": sc, "lieux_pct": pl, "assos_pct": pa}
    served = sum(1 for v in rec.values() if v)
    print(f"communes avec vie_locale : {served}/{len(communes)} | K={K}", file=sys.stderr)
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT_CACHE, "w"))
    print(f"✓ cache écrit : {OUT_CACHE}", file=sys.stderr)

    if args.matrix:
        print(f"\n{'commune':32} {'score':>6} {'lieux':>6} {'assos':>6} {'nL':>6} {'nA':>7}", file=sys.stderr)
        for ins, lib in TEMOINS.items():
            r = rec.get(ins); sc = scores.get(ins)
            if not sc:
                print(f"{lib:32} ABSENT", file=sys.stderr); continue
            s, pl, pa, nl, na = sc
            print(f"{lib:32} {s:>6} {pl:>6} {pa:>6} {nl:>6} {na:>7}", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["vieLocale"] = rec.get(c["insee"])
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (vieLocale)", file=sys.stderr)
```

- [ ] **Step 3 : Calculer le cache + matrice (SANS write-index)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --matrix`
Expected : `communes avec vie_locale : N/34788`, puis le tableau témoins. **GATE bloquant** — lecture attendue :
- Uzès (petite ville vivante) : **haut**.
- Sevran (banlieue dortoir) : **bas** (le test le plus important).
- Saint-Tropez : élevé, à commenter (biais tourisme assumé).
- Plaudren (village 1 café) : **moyen, pas exceptionnel**.
- Lyon 1er : **haut**.
- La Rochelle centre **haut** ; Puilboreau / Lagord / Aytré **gradués** (pas d'aberration ; sous-notation périphérique = limite connue, non bloquante).

Si Sevran score comme Uzès, ou si une aberration apparaît sur l'agglo, revoir K (Task 4) avant `--write-index`. Présenter au porteur pour feu vert.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-vie-locale.py
git commit -m "feat(vie-locale): calcul index complet (K fige) + matrice temoins

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : Câblage TS + patch index + vérification

**Files:**
- Modify: `src/lib/comparateur-vie.ts`, `src/lib/comparateur-labels.ts`, `src/app/api/comparateur-vie/synthesize/route.ts`, `src/app/api/comparateur-vie/parse/route.ts`, `data/comparateur-index.json`

- [ ] **Step 1 : Type `vieLocale` (comparateur-vie.ts)**

Après le champ `reseauLocal?: { ... } | null;` (chercher `reseauLocal?:`), insérer :

```typescript
  // Vie locale (cf. scripts/populate-vie-locale.py). score = 0.7 lieux de sociabilité (OSM) +
  // 0.3 tissu associatif (RNA + AMALIA), densité par habitant lissée (masse critique).
  // null = pas de vie locale mesurable. Présence d'une vie sociale, PAS l'événementiel.
  vieLocale?: {
    score: number;
    lieux_pct: number;
    assos_pct: number;
  } | null;
```

- [ ] **Step 2 : Clé `vie_locale` (PREFERENCE_KEYS)**

Après la ligne `"vie_etudiante",` (dernière clé avant le `] as const;`), insérer :

```typescript
  // Vie locale : intensité de vie sociale (lieux de sociabilité OSM + tissu associatif RNA/AMALIA,
  // densité par habitant avec masse critique). Présence d'une vie sociale, jamais l'événementiel. Opt-in.
  "vie_locale",
```

- [ ] **Step 3 : `subScore` (comparateur-vie.ts)**

Après le `case "vie_etudiante": { ... }` (le bloc se termine par `}`), insérer avant `default:` :

```typescript
    case "vie_locale":
      // intensité de vie sociale (lieux + assos par habitant) ; pas de vie locale mesurable = 0.
      return c.vieLocale?.score ?? 0;
```

- [ ] **Step 4 : `REASON_POS` + `REASON_NEG` (comparateur-vie.ts)**

Dans `REASON_POS` (après l'entrée `vie_etudiante: ...`), insérer :

```typescript
  vie_locale: "vie locale animée (commerces, marchés, associations)",
```

Dans `REASON_NEG` (après l'entrée `vie_etudiante: ...`), insérer :

```typescript
  vie_locale: "peu de lieux de vie et d'animation locale",
```

- [ ] **Step 5 : `AMBIENT_DIMENSIONS` (comparateur-vie.ts)**

Après la ligne `{ id: "vie_etudiante", key: "vie_etudiante", ... },` insérer :

```typescript
  { id: "vie_locale", key: "vie_locale", bands: ["vie locale animée", "vie locale intermédiaire", "vie locale plus discrète"] },
```

- [ ] **Step 6 : `PREFERENCE_LABELS` + `PREFERENCE_TOOLTIP` (comparateur-labels.ts)**

Dans `PREFERENCE_LABELS` (après `vie_etudiante: "une ville étudiante",`), insérer :

```typescript
  vie_locale: "une vie locale animée",
```

Dans `PREFERENCE_TOOLTIP` (après l'entrée `vie_etudiante: ...`), insérer :

```typescript
  vie_locale: "Densité des lieux où l'on se retrouve (cafés, marchés, sport, associations) rapportée à la population. Indique si le territoire a une vie sociale au quotidien.",
```

- [ ] **Step 7 : `PREF_LABELS` de synthèse (synthesize/route.ts)**

Dans `PREF_LABELS` (après la dernière entrée mobilité/transports), insérer :

```typescript
  vie_locale: "une vie locale animée (commerces, marchés, associations)",
```

- [ ] **Step 8 : Routage du parse (parse/route.ts)**

8a. Après la ligne `- vie_etudiante : ...` (description des critères), insérer :

```
- vie_locale : intensité de vie sociale du territoire (densité de lieux où l'on se retrouve — cafés, bars, restaurants, marchés, sport, maisons des associations — et tissu associatif, par habitant). DISTINCT de acces_culture (équipements) et acces_services (commerces). Pour « une ville vivante », « animé », « il se passe des choses », « ne pas s'ennuyer », « vie de quartier », « des cafés, des assos, un marché »
```

8b. Dans la section TRADUCTION AUTOMATIQUE, ajouter une ligne :

```
- "une ville vivante", "animé", "il se passe des choses", "ne pas s'ennuyer", "vie de quartier", "des cafés et des assos" → vie_locale (poids 2 à 3).
```

- [ ] **Step 9 : Patcher l'index**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-vie-locale.py --write-index`
Expected : `communes avec vie_locale : N/34788`, puis `✓ index patché (vieLocale)`.

- [ ] **Step 10 : Vérification build + lint**

La modif réelle de `comparateur-vie.ts` busте `indexCache`.

Run : `cd "$(git rev-parse --show-toplevel)" && npx tsc --noEmit && npm run lint 2>&1 | grep -iE "vie_locale|vieLocale|comparateur-vie|comparateur-labels|synthesize/route|parse/route" || echo "→ aucune nouvelle erreur sur les fichiers touchés"`
Expected : `tsc` sans erreur (les `Record<PreferenceKey>` `REASON_POS`/`REASON_NEG` imposent la présence de `vie_locale` — filet). Lint : aucune nouvelle erreur sur les fichiers touchés.

- [ ] **Step 11 : Vérification dev réelle (curl)**

Dev sur :3000. Frapper le match avec le critère :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
  -H "Content-Type: application/json" \
  -d '{"parsed":{"preferences":[{"key":"vie_locale","weight":3}],"hardConstraints":{}}}' \
  --max-time 30 | python3 -c "import sys,json;d=json.load(sys.stdin);r=d['results'];print('n=',len(r));[print(' ',x['nom'],x['insee'],x['compatibility'],[s for s in x['reasons'] if 'vie locale' in s or 'anim' in s]) for x in r[:6]]"
```

Expected : 200, communes à forte vie sociale en tête (villes-centres animées), `reasons` mentionnant « vie locale animée ». Vérifier qu'une banlieue-dortoir n'apparaît pas en tête.

- [ ] **Step 12 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts \
  src/app/api/comparateur-vie/synthesize/route.ts src/app/api/comparateur-vie/parse/route.ts \
  data/comparateur-index.json
git commit -m "feat(vie-locale): critere vie_locale cable + index patche

Intensite de vie sociale (lieux OSM + assos RNA/AMALIA, densite par habitant avec masse
critique), opt-in. Warning GH001 large-file = normal.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Ne PAS pousser : attendre le « push sur main » explicite du porteur.)

---

## Self-Review (effectuée à la rédaction)

- **Couverture spec** : champ/clé → Task 1 (pures) + Task 6 ; lieux OSM + rattachement commune → Task 2 ; assos RNA waldec (`adrs_codeinsee`, `position=='A'`) + AMALIA → Task 3 ; densité `/(pop+K)` + masse critique → Task 1/4 ; zéro épinglé par composante + percentile → Task 1 (`component_pct`) ; combinaison 70/30 → Task 1 (`combine`) ; sonde K → Task 4 (GATE) ; matrice témoins tourisme/banlieue/agglo → Task 5 (GATE) ; 6 points de câblage + synthesize/parse → Task 6 ; gloses honnêtes → tooltip + REASON.
- **Placeholders** : `K` figé par sonde (Task 4→5), explicite. Les URLs AMALIA 68/57 sont récupérées en Task 3 Step 3 (procédure concrète, pas un TBD) car les URLs versionnées changent ; le 67 est déjà figé. URL curl du Step 11 concrète.
- **Cohérence types/noms** : `density`, `component_pct`, `combine`, `load_social_pois`, `assign_to_communes`, `load_rna`, `load_amalia`, `load_assos`, `compute_scores`, `vieLocale.{score,lieux_pct,assos_pct}` identiques de Task 1 à Task 6. `subScore` lit `c.vieLocale?.score ?? 0`, cohérent avec le champ écrit en Task 5. La clé `vie_locale` est ajoutée dans les deux `Record<PreferenceKey>` exhaustifs (`REASON_POS`, `REASON_NEG`) — `tsc` l'impose.
