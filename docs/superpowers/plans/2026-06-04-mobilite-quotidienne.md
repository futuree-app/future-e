# Mobilité du quotidien (chantier #6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `mobilite_quotidienne` mesurant l'accès à un réseau de transports en commun à portée de marche (arrêts GTFS nationaux + bonus tram/métro OSM), précalculé dans l'index.

**Architecture:** Un script offline `scripts/populate-reseau-local.py` calcule, par commune, une couverture d'arrêts pondérée par la proximité (petit rayon marche) × un facteur mode (tram/métro détectés via nœuds OSM), normalisée par un percentile **parmi les seules communes desservies** (zéro épinglé). Le résultat `c.reseauLocal` est lu par le moteur TS comme un simple percentile. Six points de câblage TS (clé, score, raisons, libellés, ambiant, synthèse, parse).

**Tech Stack:** Python 3 (`numpy`, venv `.venv-bpe`), sources : CSV national d'arrêts GTFS (`transport.data.gouv.fr/resources/81333/download`) + OSM tram/métro via Overpass. Index `data/comparateur-index.json`. Pas de runner de test (doctrine) : vérification = `--selftest` à assertions, exécutions réelles, sonde de rayon, matrice témoins, puis `tsc`+`lint`+curl.

**Spec :** `docs/superpowers/specs/2026-06-04-mobilite-quotidienne-design.md`

---

## File Structure

- `scripts/populate-reseau-local.py` (créé) : seul fichier de logique data. Acquisition (arrêts + OSM), dédoublonnage, couverture pondérée, facteur mode, normalisation, `--selftest` / `--summary` / `--probe` / `--write-index`.
- `src/lib/comparateur-vie.ts` (modifié) : type `reseauLocal`, `PREFERENCE_KEYS`, `subScore`, `REASON_POS`/`REASON_NEG`, `AMBIENT_DIMENSIONS`. Sert aussi à buster `indexCache`.
- `src/lib/comparateur-labels.ts` (modifié) : `PREFERENCE_LABELS`, `PREFERENCE_TOOLTIP`.
- `src/app/api/comparateur-vie/synthesize/route.ts` (modifié) : `PREF_LABELS` (map propre, piège mémoire).
- `src/app/api/comparateur-vie/parse/route.ts` (modifié) : router les termes TC urbains vers le nouveau critère, retirer ces termes de `acces_transports`.
- `data/comparateur-index.json` (patché via `--write-index`) et `data/.cache/*` (gitignorés) : artefacts.

---

## Task 1 : Squelette du script + fonctions pures + selftest

Fonctions pures (poids de proximité, facteur mode, normalisation desservies, clé de cellule) vérifiées par `--selftest`. Aucune I/O encore.

**Files:**
- Create: `scripts/populate-reseau-local.py`

- [ ] **Step 1 : Créer le squelette avec constantes et fonctions pures**

```python
#!/usr/bin/env python3
"""populate-reseau-local.py — mobilité du quotidien : accès à un réseau TC à portée de marche.

Couverture = somme pondérée (1 - d/R) des arrêts GTFS dédoublonnés dans un petit rayon R
autour du centroïde communal ; × facteur mode (tram/métro détectés via nœuds OSM). Normalisé
en percentile PARMI LES COMMUNES DESSERVIES (zéro épinglé -> null). cf. spec 2026-06-04.

Venv .venv-bpe (numpy). Modes :
    .venv-bpe/bin/python scripts/populate-reseau-local.py --selftest
    .venv-bpe/bin/python scripts/populate-reseau-local.py --summary
    .venv-bpe/bin/python scripts/populate-reseau-local.py --probe
    .venv-bpe/bin/python scripts/populate-reseau-local.py --write-index
"""
import json, os, sys, csv, math, argparse, bisect, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
STOPS_CACHE = os.path.join(CACHE, "gtfs-stops-france.csv")
OSM_CACHE = os.path.join(CACHE, "osm-tram-metro.json")

STOPS_URL = "https://transport.data.gouv.fr/resources/81333/download"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Rayon d'accès « pas de porte » (marche), en mètres. FIXÉ PAR LA SONDE (Task 3).
RADIUS_M = 1000
DEDUP_DEG = 0.0005   # ~55 m : un arrêt unique par cellule (anti double-comptage multi-GTFS)
CELL = 0.02          # grille de recherche couverture (~2,2 km lat)
NEI = 2              # ±2 cellules couvrent 1,5 km partout (lon ~0.0215° à 51°N)
R_EARTH = 6371.0


def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))


def weight(d_km, r_km):
    """Poids de proximité linéaire, fort (appelé uniquement pour d <= r)."""
    return 1.0 - d_km / r_km


def mode_factor(tram, metro):
    """Facteur de rehaussement par mode structurant. Métro > tram > bus."""
    return 2.0 if metro else (1.5 if tram else 1.0)


def normalize_access(raws):
    """Zéro épinglé -> None ; percentile 1-100 PARMI les communes desservies (raw > 0)."""
    pos = sorted(r for r in raws if r > 0)
    m = len(pos)
    out = []
    for r in raws:
        if r <= 0 or m == 0:
            out.append(None)
        else:
            out.append(max(1, round(100 * bisect.bisect_right(pos, r) / m)))
    return out


def cell_key(lat, lon, size):
    return (int(math.floor(lat / size)), int(math.floor(lon / size)))
```

- [ ] **Step 2 : Ajouter le selftest et le `main` minimal**

Ajouter à la fin du fichier :

```python
def selftest():
    assert weight(0.0, 1.0) == 1.0
    assert weight(0.5, 1.0) == 0.5
    assert abs(weight(1.0, 1.0)) < 1e-9
    assert mode_factor(False, False) == 1.0
    assert mode_factor(True, False) == 1.5
    assert mode_factor(False, True) == 2.0
    assert mode_factor(True, True) == 2.0
    # normalisation : zéros -> None ; positifs -> percentile parmi desservies (3 positifs).
    assert normalize_access([0, 0, 5, 10, 20]) == [None, None, 33, 67, 100]
    assert normalize_access([0, 0, 0]) == [None, None, None]
    assert cell_key(0.0, 0.0, 0.0005) == (0, 0)
    assert cell_key(0.00051, 0.0, 0.0005) == (1, 0)
    assert cell_key(-0.00001, 0.0, 0.0005) == (-1, 0)
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return


if __name__ == "__main__":
    main()
```

- [ ] **Step 3 : Lancer le selftest**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-reseau-local.py --selftest`
Expected : `✓ selftest OK`, exit 0.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-reseau-local.py
git commit -m "feat(reseau): squelette + fonctions pures (poids, facteur mode, normalisation) + selftest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Acquisition des données (arrêts GTFS + OSM tram/métro)

Télécharge et met en cache les deux sources, dédoublonne les arrêts. `--summary` vérifie les volumes.

**Files:**
- Modify: `scripts/populate-reseau-local.py`

- [ ] **Step 1 : Ajouter le chargement des arrêts (CSV national, filtré + dédoublonné)**

Insérer avant `def selftest():` :

```python
def download(url, dest, data=None):
    """Télécharge url -> dest si absent. data (bytes) => POST. Retourne dest."""
    if os.path.exists(dest):
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    req = urllib.request.Request(url, data=data, headers={"User-Agent": "futur-e/populate-reseau-local"})
    with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f:
        f.write(r.read())
    return dest


def load_stops():
    """Arrêts GTFS nationaux : vrais arrêts (location_type 0/vide), dédoublonnés ~55 m.
    Retourne (lats, lons) numpy."""
    path = download(STOPS_URL, STOPS_CACHE)
    seen = set()
    lats, lons = [], []
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lt = (row.get("location_type") or "").strip()
            if lt not in ("", "0"):
                continue
            try:
                la = float(row["stop_lat"]); lo = float(row["stop_lon"])
            except (TypeError, ValueError):
                continue
            if not (math.isfinite(la) and math.isfinite(lo)):
                continue
            k = cell_key(la, lo, DEDUP_DEG)
            if k in seen:
                continue
            seen.add(k)
            lats.append(la); lons.append(lo)
    print(f"arrêts GTFS dédoublonnés : {len(lats)}", file=sys.stderr)
    return np.array(lats, dtype="float64"), np.array(lons, dtype="float64")
```

- [ ] **Step 2 : Ajouter le chargement OSM tram/métro (Overpass, caché)**

Insérer ensuite :

```python
OVERPASS_QUERY = """
[out:json][timeout:180];
area["ISO3166-1"="FR"][admin_level=2]->.fr;
(
  node["railway"="tram_stop"](area.fr);
  node["railway"="station"]["station"="subway"](area.fr);
  node["railway"="station"]["subway"="yes"](area.fr);
  node["station"="subway"](area.fr);
);
out body;
""".strip()


def load_osm_modes(refresh=False):
    """Nœuds OSM tram (railway=tram_stop) et métro (station subway). Caché en JSON brut.
    Retourne (tram_lat, tram_lon, metro_lat, metro_lon) numpy."""
    if refresh and os.path.exists(OSM_CACHE):
        os.remove(OSM_CACHE)
    path = download(OVERPASS_URL, OSM_CACHE, data=urllib.parse.urlencode({"data": OVERPASS_QUERY}).encode())
    elements = json.load(open(path)).get("elements", [])
    tl, to, ml, mo = [], [], [], []
    for e in elements:
        if e.get("lat") is None or e.get("lon") is None:
            continue
        if (e.get("tags") or {}).get("railway") == "tram_stop":
            tl.append(e["lat"]); to.append(e["lon"])
        else:
            ml.append(e["lat"]); mo.append(e["lon"])
    print(f"OSM tram : {len(tl)} | OSM métro : {len(ml)}", file=sys.stderr)
    return (np.array(tl, "float64"), np.array(to, "float64"),
            np.array(ml, "float64"), np.array(mo, "float64"))


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes
```

- [ ] **Step 3 : Brancher `--summary` dans `main`**

Dans `main()`, après le bloc `--selftest`, ajouter :

```python
    if args.summary:
        idx, communes = load_communes()
        print(f"communes géolocalisées : {len(communes)}", file=sys.stderr)
        load_stops()
        load_osm_modes(refresh=args.refresh_osm)
        return
```

- [ ] **Step 4 : Lancer `--summary` (télécharge + vérifie les volumes)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-reseau-local.py --summary`
Expected (stderr), ordres de grandeur :
- `communes géolocalisées : ~34788`
- `arrêts GTFS dédoublonnés : ` plusieurs centaines de milliers (la masse brute du CSV est plus grande, le dédoublonnage ~55 m la réduit).
- `OSM tram : ~3326 | OSM métro : ~488`

Garde-fou : si `OSM tram` ou `OSM métro` = 0, Overpass a échoué (rate-limit / requête) — relancer avec `--refresh-osm`, ou réessayer après une pause. Si `arrêts` < 50 000, le CSV n'a pas été lu correctement (vérifier le header).

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-reseau-local.py
git commit -m "feat(reseau): acquisition arrets GTFS dedoublonnes + tram/metro OSM (Overpass cache)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Calcul de couverture + sonde du rayon (GATE produit)

Implémente le calcul par commune, puis `--probe` compare le comportement du score à R = 500 / 1000 / 1500 m sur des communes témoins. **Le porteur fige R après cette sonde** (paramètre le plus sensible du chantier).

**Files:**
- Modify: `scripts/populate-reseau-local.py`

- [ ] **Step 1 : Ajouter le calcul par commune**

Insérer avant `def selftest():` :

```python
def compute_access(communes, slat, slon, tlat, tlon, mlat, mlon, radius_m):
    """Pour chaque commune : couverture pondérée des arrêts dans R, × facteur mode, + arret_km.
    Retourne (raws, trams, metros, arret_kms) alignés sur `communes`."""
    r_km = radius_m / 1000.0
    grid = {}
    for j in range(len(slat)):
        grid.setdefault(cell_key(slat[j], slon[j], CELL), []).append(j)
    raws, trams, metros, arret_kms = [], [], [], []
    for c in communes:
        clat, clon = c["lat"], c["lon"]
        ci, cj = cell_key(clat, clon, CELL)
        idxs = []
        for di in range(-NEI, NEI + 1):
            for dj in range(-NEI, NEI + 1):
                idxs += grid.get((ci + di, cj + dj), [])
        cov = 0.0; nearest = None
        if idxs:
            idxs = np.array(idxs)
            d = hav_km(clat, clon, slat[idxs], slon[idxs])
            win = d <= r_km
            if win.any():
                cov = float(weight(d[win], r_km).sum())
                nearest = round(float(d[win].min()), 3)
        tram = bool(len(tlat) and (hav_km(clat, clon, tlat, tlon) <= r_km).any())
        metro = bool(len(mlat) and (hav_km(clat, clon, mlat, mlon) <= r_km).any())
        raws.append(cov * mode_factor(tram, metro))
        trams.append(tram); metros.append(metro); arret_kms.append(nearest)
    return raws, trams, metros, arret_kms


# Communes témoins (INSEE) pour sonde + matrice. Résolues sur l'index réel.
TEMOINS = {
    "75101": "Paris 1er (métro+tram+bus)",
    "69381": "Lyon 1er (métro)",
    "35238": "Rennes (métro)",
    "67482": "Strasbourg (tram)",
    "33063": "Bordeaux (tram)",
    "72181": "Le Mans (tram, ville moyenne)",
    "56260": "Vannes (bus seul, ville moyenne)",
    "93048": "Montreuil (banlieue dense, métro)",
    "48095": "Mende (petite ville isolée)",
    "56157": "Plaudren (village rural)",
}
```

- [ ] **Step 2 : Brancher `--probe` dans `main`**

Dans `main()`, après le bloc `--summary`, ajouter :

```python
    if args.probe:
        idx, communes = load_communes()
        slat, slon = load_stops()
        tlat, tlon, mlat, mlon = load_osm_modes(refresh=args.refresh_osm)
        by_insee = {c["insee"]: c for c in communes}
        sel = [by_insee[i] for i in TEMOINS if i in by_insee]
        print(f"\n{'commune':34} " + "".join(f"{f'R={r}m':>22}" for r in (500, 1000, 1500)), file=sys.stderr)
        print(f"{'':34} " + "".join(f"{'cov / mode / arrêt':>22}" for _ in range(3)), file=sys.stderr)
        for r in (500, 1000, 1500):
            raws, trams, metros, aks = compute_access(sel, slat, slon, tlat, tlon, mlat, mlon, r)
            sel[0].setdefault("_p", {})[r] = (raws, trams, metros, aks)
        for k, c in enumerate(sel):
            cells = []
            for r in (500, 1000, 1500):
                raws, trams, metros, aks = sel[0]["_p"][r]
                md = "métro" if metros[k] else "tram" if trams[k] else "bus" if raws[k] > 0 else "—"
                cells.append(f"{raws[k]:6.1f} {md:>5} {str(aks[k]):>6}")
            print(f"{TEMOINS[c['insee']]:34} " + "".join(f"{x:>22}" for x in cells), file=sys.stderr)
        # Masse de zéros (sur tout le territoire, au rayon médian 1000 m).
        raws_all, _, _, _ = compute_access(communes, slat, slon, tlat, tlon, mlat, mlon, 1000)
        z = sum(1 for x in raws_all if x <= 0)
        print(f"\nmasse de zéros @1000m : {z}/{len(raws_all)} communes non desservies "
              f"({100*z//len(raws_all)} %)", file=sys.stderr)
        return
```

- [ ] **Step 3 : Lancer la sonde**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-reseau-local.py --probe`
Expected (interprétation) : un tableau couverture/mode/arrêt par commune pour R = 500/1000/1500 m, plus la masse de zéros. Lecture attendue :
- Paris/Lyon/Rennes/Montreuil : couverture forte, mode `métro`.
- Strasbourg/Bordeaux/Le Mans : mode `tram`.
- Vannes : desservie, mode `bus`.
- Mende : faible.
- Plaudren (village) : couverture nulle ou quasi (`—` ou bus très faible).
- Le passage 500→1500 m doit faire **monter** les couvertures sans rendre le classement incohérent.

- [ ] **Step 4 : Présenter la sonde au porteur et figer R (GATE)**

Coller la sortie. Le porteur choisit R parmi 500 / 1000 / 1500 m (paramètre le plus sensible). Attendre son choix explicite. Critère : R où l'écart ville/village est net, où une commune réellement marchable est captée, sans que le rayon ne « voiture-ise » l'accès. Reco par défaut si équilibré : **1000 m**.

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-reseau-local.py
git commit -m "feat(reseau): calcul couverture pondere x facteur mode + sonde de rayon (temoins)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Fige R, calcule l'index complet, matrice témoins (GATE signal)

**Files:**
- Modify: `scripts/populate-reseau-local.py`

- [ ] **Step 1 : Fixer `RADIUS_M` à la valeur validée en Task 3**

Dans `scripts/populate-reseau-local.py`, mettre `RADIUS_M` à la valeur choisie par le porteur (ex. si 1000 m validé, laisser `RADIUS_M = 1000`). Ajuster le commentaire pour acter la décision (« figé par sonde Task 3 : 1000 m »).

- [ ] **Step 2 : Ajouter le calcul de l'index + écriture cache/patch dans `main`**

Dans `main()`, remplacer le `if args.probe:` final par l'ajout du bloc principal après lui :

```python
    idx, communes = load_communes()
    slat, slon = load_stops()
    tlat, tlon, mlat, mlon = load_osm_modes(refresh=args.refresh_osm)
    print(f"communes géolocalisées : {len(communes)} | rayon : {RADIUS_M} m", file=sys.stderr)
    raws, trams, metros, aks = compute_access(communes, slat, slon, tlat, tlon, mlat, mlon, RADIUS_M)
    acces = normalize_access(raws)
    served = sum(1 for a in acces if a is not None)
    print(f"desservies : {served}/{len(communes)} ({100*served//len(communes)} %)", file=sys.stderr)

    rec = {}
    for i, c in enumerate(communes):
        if acces[i] is None:
            rec[c["insee"]] = None
        else:
            rec[c["insee"]] = {"acces": acces[i], "tram": trams[i], "metro": metros[i], "arret_km": aks[i]}
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(os.path.join(CACHE, "communes-reseau-local.json"), "w"))
    print("✓ cache écrit : data/.cache/communes-reseau-local.json", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["reseauLocal"] = rec.get(c["insee"])
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (reseauLocal)", file=sys.stderr)
```

- [ ] **Step 3 : Calculer le cache (SANS `--write-index`)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-reseau-local.py`
Expected (stderr) : volumes de Task 2, puis `desservies : N/34788 (XX %)` (attendu : minorité desservie, masse de zéros assumée), puis `✓ cache écrit`.

- [ ] **Step 4 : Matrice témoins + distribution (GATE avant write-index)**

Run :

```bash
cd "$(git rev-parse --show-toplevel)" && python3 - <<'PY'
import json
cache = json.load(open("data/.cache/communes-reseau-local.json"))
idx = json.load(open("data/comparateur-index.json"))
m = {c["insee"]: c["nom"] for c in idx["communes"]}
temoins = {
    "75101": ("Paris 1er", "très haut, métro"),
    "69381": ("Lyon 1er", "très haut, métro"),
    "35238": ("Rennes", "haut, métro"),
    "67482": ("Strasbourg", "haut, tram"),
    "33063": ("Bordeaux", "haut, tram"),
    "72181": ("Le Mans", "boosté tram (vs Vannes)"),
    "56260": ("Vannes", "desservie, bus seul"),
    "93048": ("Montreuil", "haut, banlieue métro"),
    "48095": ("Mende", "bas mais desservie"),
    "56157": ("Plaudren", "null (non desservie)"),
}
print(f"{'commune':16} {'acces':>6} {'mode':>7} {'arrêt km':>9}   attendu")
for ins, (lib, att) in temoins.items():
    r = cache.get(ins)
    if r is None:
        print(f"{lib:16} {'null':>6} {'—':>7} {'—':>9}   {att}")
    else:
        md = "métro" if r["metro"] else "tram" if r["tram"] else "bus"
        print(f"{lib:16} {r['acces']:>6} {md:>7} {str(r['arret_km']):>9}   {att}")
# Anti-inversion + distribution
served = [r["acces"] for r in cache.values() if r]
print(f"\ndesservies : {len(served)} | min {min(served)} max {max(served)}")
import collections
buckets = collections.Counter((a-1)//10*10 for a in served)
print("distribution acces (desservies) :", dict(sorted(buckets.items())))
le_mans = cache.get("72181"); vannes = cache.get("56260")
print(f"GATE tram>bus : Le Mans {le_mans and le_mans['acces']} vs Vannes {vannes and vannes['acces']}")
paris = cache.get("75101"); montreuil = cache.get("93048")
print(f"GATE pas d'inversion : Paris {paris and paris['acces']} >= Montreuil {montreuil and montreuil['acces']} ?")
PY
```

Expected (interprétation, GATE bloquant) :
- Paris/Lyon/Rennes/Montreuil : `acces` haut, mode `métro`.
- Strasbourg/Bordeaux : haut, `tram`. Le Mans (tram) ≥ Vannes (bus) à taille comparable.
- Vannes : desservie, `bus`.
- Mende : bas mais desservie. Plaudren : `null`.
- Distribution des desservies : étalée, pas tassée sur une seule tranche.
- **Anti-inversion** : une banlieue-tram ne dépasse pas un cœur de métropole (Paris ≥ Montreuil).

Si Plaudren n'est pas `null`, si Le Mans < Vannes, ou si une banlieue dépasse Paris : revoir R (Task 3) ou les valeurs de `mode_factor` AVANT `--write-index`. Présenter la sortie au porteur pour feu vert.

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-reseau-local.py
git commit -m "feat(reseau): calcul index complet (rayon fige) + cache reseauLocal

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Câblage TS + patch index + vérification

**Files:**
- Modify: `src/lib/comparateur-vie.ts`, `src/lib/comparateur-labels.ts`, `src/app/api/comparateur-vie/synthesize/route.ts`, `src/app/api/comparateur-vie/parse/route.ts`, `data/comparateur-index.json`

- [ ] **Step 1 : Type `reseauLocal` (comparateur-vie.ts)**

Après le bloc `transport?: { ... } | null;` (se termine ligne ~312), insérer :

```typescript
  // Réseau de mobilité du quotidien (cf. scripts/populate-reseau-local.py : arrêts GTFS
  // nationaux + tram/métro OSM). acces = percentile PARMI les communes desservies ; null =
  // non desservie. tram/metro = mode structurant à portée de marche. arret_km = arrêt le plus proche.
  reseauLocal?: {
    acces: number;
    tram: boolean;
    metro: boolean;
    arret_km: number;
  } | null;
```

- [ ] **Step 2 : Clé `mobilite_quotidienne` (PREFERENCE_KEYS)**

Après la ligne `"acces_transports",` (ligne ~66), insérer :

```typescript
  // Mobilité du quotidien : réseau TC à portée de marche (arrêts GTFS + tram/métro OSM),
  // rehaussé par le mode structurant. Distinct du rail (ouverture) et de la dépendance auto
  // (comportement). Opt-in. cf. populate-reseau-local.
  "mobilite_quotidienne",
```

- [ ] **Step 3 : `subScore` (comparateur-vie.ts)**

Après le `case "acces_transports": ... return c.transport?.desserte ?? null;` (ligne ~644), insérer :

```typescript
    case "mobilite_quotidienne":
      // réseau TC du quotidien à portée de marche ; pas de réseau = 0 (l'utilisateur l'a demandé).
      return c.reseauLocal?.acces ?? 0;
```

- [ ] **Step 4 : `REASON_POS` + `REASON_NEG` (comparateur-vie.ts)**

Dans `REASON_POS` (après `acces_transports: "bien reliée par le train",`, ligne ~774), insérer :

```typescript
  mobilite_quotidienne: (c) => {
    const r = c.reseauLocal;
    const mode = r?.metro ? "métro" : r?.tram ? "tram" : "bus";
    return `réseau de ${mode} à portée de marche`;
  },
```

Dans `REASON_NEG` (après `acces_transports: "desserte ferroviaire limitée",`, ligne ~806), insérer :

```typescript
  mobilite_quotidienne: "peu ou pas de transports en commun de proximité",
```

- [ ] **Step 5 : `AMBIENT_DIMENSIONS` (comparateur-vie.ts)**

Après la ligne `{ id: "transports", key: "acces_transports", ... },` (ligne ~681), insérer :

```typescript
  { id: "mobilite_quotidienne", key: "mobilite_quotidienne", bands: ["transports du quotidien bien présents", "desserte du quotidien intermédiaire", "peu de transports du quotidien à pied"] },
```

- [ ] **Step 6 : `PREFERENCE_LABELS` + `PREFERENCE_TOOLTIP` (comparateur-labels.ts)**

Dans `PREFERENCE_LABELS` (après `acces_transports: "l'accès au train et aux gares",`, ligne ~32), insérer :

```typescript
  mobilite_quotidienne: "les transports en commun du quotidien (bus, tram, métro)",
```

Dans `PREFERENCE_TOOLTIP` (après `acces_transports: "Présence et fréquentation des gares à proximité.",`), insérer :

```typescript
  mobilite_quotidienne: "Indique si un réseau de bus, tram ou métro dessert les environs immédiats. Mesure la possibilité de s'y déplacer au quotidien sans voiture.",
```

- [ ] **Step 7 : `PREF_LABELS` de synthèse (synthesize/route.ts)**

Dans `PREF_LABELS` (après `acces_transports: "l'accès au train et aux gares",`, ligne ~47), insérer :

```typescript
  mobilite_quotidienne: "les transports du quotidien (bus, tram, métro)",
```

- [ ] **Step 8 : Routage du parse (parse/route.ts)**

8a. Ajouter la description du critère. Après la ligne `- acces_transports : accès au train et aux gares ...` (ligne ~208), insérer :

```
- mobilite_quotidienne : réseau de transports en commun urbains à portée de marche (bus, tram, métro de proximité, présence d'un réseau local). DISTINCT du train (acces_transports) et de la dépendance auto. Pour « bus », « tram », « métro », « transports en commun », « réseau de transport local », « se déplacer en ville sans voiture », « bien desservi en TC urbains »
```

8b. Retirer les termes TC urbains de `acces_transports` et créer la règle dédiée. Remplacer la ligne (ligne ~208) :

```
- acces_transports : accès au train et aux gares (desserte ferroviaire pondérée par la fréquentation). Pour « une gare », « le train », « TER », « TGV », « rejoindre une métropole », « transports en commun », « bien desservi », « aller en ville sans voiture »
```

par :

```
- acces_transports : accès au train et aux gares (desserte ferroviaire pondérée par la fréquentation). Pour « une gare », « le train », « TER », « TGV », « rejoindre une métropole en train »
```

8c. Dans la section TRADUCTION AUTOMATIQUE, remplacer la ligne (ligne ~222) :

```
- "une gare", "le train", "TER", "TGV", "rejoindre une métropole", "transports en commun", "bien desservi", "aller en ville sans voiture" → acces_transports (poids 2 à 3).
```

par ces deux lignes :

```
- "une gare", "le train", "TER", "TGV", "rejoindre une métropole en train" → acces_transports (poids 2 à 3).
- "transports en commun", "bus", "tram", "métro", "réseau local", "bien desservi en ville", "se déplacer en ville sans voiture" → mobilite_quotidienne (poids 2 à 3).
```

8d. Remplacer la ligne de coexistence (ligne ~223) :

```
- Mobilité : faible_dependance_auto (se passer de la voiture) et acces_transports (offre ferroviaire) sont DISTINCTS et peuvent coexister. N'en déduisez aucun par défaut d'un projet rural ou familial.
```

par :

```
- Mobilité : faible_dependance_auto (se passer de la voiture, comportement), acces_transports (train/gares, ouverture du territoire) et mobilite_quotidienne (TC urbains à portée de marche) sont TROIS critères DISTINCTS et cumulables. N'en déduisez aucun par défaut d'un projet rural ou familial.
```

- [ ] **Step 9 : Patcher l'index**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-reseau-local.py --write-index`
Expected (stderr) : `desservies : N/34788 ...`, puis `✓ index patché (reseauLocal)`.

- [ ] **Step 10 : Vérification build + lint**

La modification réelle de `comparateur-vie.ts` (Steps 1-5) invalide `indexCache` au prochain build.

Run : `cd "$(git rev-parse --show-toplevel)" && npx tsc --noEmit && npm run lint 2>&1 | grep -iE "mobilite_quotidienne|reseauLocal|comparateur-vie|comparateur-labels|synthesize|parse" || echo "→ aucune nouvelle erreur sur les fichiers touchés"`
Expected : `tsc` sans erreur (notamment `REASON_POS`/`REASON_NEG`/`PREFERENCE_LABELS`/`subScore` sont des `Record<PreferenceKey, ...>` : la nouvelle clé DOIT être présente partout sinon `tsc` casse — c'est le filet). Lint : aucune nouvelle erreur sur les fichiers touchés.

- [ ] **Step 11 : Vérification dev réelle (curl)**

Démarrer le dev si besoin (`npm run dev`, port 3000). Frapper le match avec le nouveau critère :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
  -H "Content-Type: application/json" \
  -d '{"parsed":{"preferences":[{"key":"mobilite_quotidienne","weight":3}],"hardConstraints":{}}}' \
  --max-time 30 | python3 -c "import sys,json; d=json.load(sys.stdin); r=d['results']; print('n=',len(r)); [print(' ', x['nom'], x['insee'], x['compatibility'], [s for s in x['reasons'] if 'march' in s or 'métro' in s or 'tram' in s or 'bus' in s]) for x in r[:5]]"
```

Expected : 200, communes denses/urbaines en tête (Paris/Lyon/grandes agglos), `reasons` mentionnant « réseau de métro/tram/bus à portée de marche ». Vérifier qu'un village rural n'apparaît pas en tête.

- [ ] **Step 12 : Re-grep anti-glose-menteuse + commit**

Run : `cd "$(git rev-parse --show-toplevel)" && grep -rn "transports en commun\|aller en ville sans voiture" src/app/api/comparateur-vie/parse/route.ts | grep "acces_transports"` — Expected : aucune ligne (les termes TC urbains ne doivent plus router vers le rail ; `grep` exit 1 = OK).

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts \
  src/app/api/comparateur-vie/synthesize/route.ts src/app/api/comparateur-vie/parse/route.ts \
  data/comparateur-index.json
git commit -m "feat(reseau): critere mobilite_quotidienne cable + index patche

Reseau TC du quotidien a portee de marche (arrets GTFS + tram/metro OSM), opt-in,
distinct du rail et de la dependance auto. Parse : termes TC urbains routes vers le
nouveau critere. Warning GH001 large-file = normal.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Ne PAS pousser : attendre le « push sur main » explicite du porteur.)

---

## Self-Review (effectuée à la rédaction)

- **Couverture spec** : critère/champ → Task 1 (pures) + Task 5 (type, câblage) ; deux sources → Task 2 ; dédoublonnage 55 m → Task 2 Step 1 ; couverture pondérée × facteur mode → Task 3 Step 1 ; détection mode par nœud OSM → Task 3 (`compute_access`) ; normalisation zéro-épinglé + percentile desservies → Task 1 (`normalize_access`) ; sonde du rayon → Task 3 (GATE) ; témoin masse de zéros + matrice → Task 3/4 (GATE) ; câblage 6 points + pièges synthesize/parse/cache → Task 5 ; gloses honnêtes → tooltip Step 6.
- **Placeholders** : `RADIUS_M` est figé par la sonde (Task 3 → Task 4 Step 1), procédure explicite, pas un TBD. URL curl du Step 11 concrète. Aucun « etc. » de code.
- **Cohérence types/noms** : `compute_access`, `normalize_access`, `mode_factor`, `weight`, `cell_key`, `load_stops`, `load_osm_modes`, `reseauLocal.{acces,tram,metro,arret_km}` identiques de Task 1 à Task 5. `subScore` lit `c.reseauLocal?.acces ?? 0`, cohérent avec le champ écrit en Task 4 Step 2. La clé `mobilite_quotidienne` est ajoutée dans TOUS les `Record<PreferenceKey, ...>` (PREFERENCE_KEYS, subScore, REASON_POS, REASON_NEG, PREFERENCE_LABELS) — `tsc` l'impose.
