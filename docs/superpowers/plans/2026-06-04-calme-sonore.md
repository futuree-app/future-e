# Critère `calme_sonore` : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `calme_sonore` qui note l'éloignement du chef-lieu aux grandes sources de bruit (autoroutes/voies rapides, rail principal, aéroports commerciaux), descriptif, avec récit `sourceDominante`.

**Architecture:** Un script Python (`populate-calme-sonore.py`, venv `.venv-bpe`) calque la mécanique tuiles+miroirs Overpass de `populate-reseau-local.py`, calcule pour chaque commune la distance à la source la plus proche de chaque classe (auto/rail/aéro) par recherche sur grille, applique une décroissance linéaire absolue par classe avec rayons distincts, combine en `max`, écrit `calmeSonore: {score, sourceDominante, distanceKm}` dans `comparateur-index.json`. Le câblage TS suit le patron des 7 autres critères. Le récit `sourceDominante` est gaté en synthèse exactement comme `demographie`/`climatInondation`.

**Tech Stack:** Python 3 + numpy (venv `.venv-bpe`), Overpass API (OSM), TypeScript (Next.js App Router), `comparateur-index.json`.

**Doctrine de vérification (pas de runner de test) :** `--selftest` à assertions côté Python ; `npx tsc --noEmit` + `npm run lint` côté TS ; curl réel sur le dev (port 3000). Sonde → gate porteur → matrice témoins → gate porteur → patch index. Jamais de tiret cadratin (`—`) dans le code/UI : virgule ou deux points.

**Piège cache index :** après `--write-index`, faire une vraie modif de `src/lib/comparateur-vie.ts` (un commentaire suffit) pour réinitialiser `indexCache` ; un `touch` ne suffit pas.

---

## File Structure

- **Create** `scripts/populate-calme-sonore.py` : acquisition OSM + calcul distances/score, modes `--selftest` / `--summary` / `--probe` / `--matrix` / `--write-index` / `--refresh-osm`.
- **Modify** `src/lib/comparateur-vie.ts` : `PREFERENCE_KEYS`, type `IndexCommune` (champ `calmeSonore`), `subScore`, `REASON_POS`/`REASON_NEG`, `AMBIENT_DIMENSIONS`, type `MatchResult` (champ `calmeSonore`), assemblage du récit, helper `calmeSonoreRecit`.
- **Modify** `src/lib/comparateur-labels.ts` : `PREFERENCE_LABELS`, `PREFERENCE_TOOLTIP`.
- **Modify** `src/app/api/comparateur-vie/synthesize/route.ts` : `PREF_LABELS`, type `results`, gating récit.
- **Modify** `src/app/(public)/ou-vivre/OuVivreClient.tsx` : transmission du récit `calmeSonore` dans `results.map`.
- **Verify** `src/app/api/parse/route.ts` : routage de la clé (souvent rien à coder si la liste de clés vient de `PREFERENCE_KEYS`).

---

## Task 1 : Squelette du script + géométrie pure (selftest hors réseau)

**Files:**
- Create: `scripts/populate-calme-sonore.py`

Cette tâche pose toute la logique testable sans réseau : décroissance, combinaison `max`, score, dédup grille, whitelist aéroports. L'acquisition OSM arrive en Task 2.

- [ ] **Step 1: Écrire le squelette du script avec selftest**

Créer `scripts/populate-calme-sonore.py` :

```python
#!/usr/bin/env python3
"""Critère calme_sonore : éloignement aux grandes sources de bruit.

Sources V1 (noyau dur incontestable) :
  - autoroutes / voies rapides : OSM highway=motorway|trunk (+ _link)
  - rail principal             : OSM railway=rail filtré (cf. classify_rail / Task 2)
  - aéroports commerciaux      : OSM aeroway=aerodrome dont iata ∈ WHITELIST_IATA

Modèle : distance du CHEF-LIEU (lat/lon de l'index) à la source la plus proche de
chaque classe ; décroissance linéaire ABSOLUE par classe (rayons distincts) ;
combinaison MAX (source dominante) ; score = 100*(1-expo). Loin de tout = 100, JAMAIS null.
Descriptif (proximité), pas acoustique (dB). cf. docs/superpowers/specs/2026-06-04-calme-sonore-design.md

Usage :
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --summary
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --probe
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --matrix
    .venv-bpe/bin/python scripts/populate-calme-sonore.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, urllib.parse
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
OSM_TILE_DIR = os.path.join(CACHE, "osm-calme-tiles")
OUT_CACHE = os.path.join(CACHE, "communes-calme-sonore.json")

R_EARTH = 6371.0

# ── Rayons caractéristiques par classe (km) : décroissance linéaire absolue. ────
# Valeurs INITIALES indicatives, à CONFIRMER/AJUSTER par la sonde (Task 3, gate porteur)
# avant la matrice témoins. Un aéroport porte plus loin qu'une autoroute (R_AUTO<R_RAIL<R_AERO).
R_AUTO = 1.5
R_RAIL = 3.0
R_AERO = 8.0

# ── Whitelist aéroports COMMERCIAUX (codes IATA) ───────────────────────────────
# Liste de référence stable et vérifiable (trafic passagers commercial significatif FR).
# Les coordonnées NE sont PAS codées en dur : récupérées depuis OSM (aeroway=aerodrome[iata])
# en n'acceptant QUE les iata de cette liste (cf. Task 2). On ne note JAMAIS aéroclubs/ULM.
WHITELIST_IATA = {
    "CDG", "ORY", "BVA",                       # Paris
    "NCE", "MRS", "LYS", "TLS", "BOD", "NTE",  # grandes métropoles
    "MLH", "LIL", "MPL", "BIQ", "AJA", "BIA",  # Bâle-Mulhouse, Lille, Montpellier, Biarritz, Corse
    "FSC", "CLY", "PGF", "RNS", "BES", "SXB",  # Figari, Calvi, Perpignan, Rennes, Brest, Strasbourg
    "CFE", "LRH", "TLN", "EGC", "PUF", "LDE",  # Clermont, La Rochelle, Toulon, Bergerac, Pau, Tarbes
    "GNB", "CMF", "BZR", "RDZ", "DCM", "CCF",  # Grenoble, Chambéry, Béziers, Rodez, Castres, Carcassonne
    "ETZ", "EPL", "DIJ", "QXB", "AUF", "BVE",  # Metz, Épinal, Dijon, Aix, Auxerre, Brive
    "LIG", "URO", "DOL", "ANG", "CET", "LBI",  # Limoges, Rouen, Dole, Angoulême, Cholet, Albi
    "NCY", "AVN", "VAF", "TUF", "PIS", "LRT",  # Annecy, Avignon, Valence, Tours, Poitiers, Lorient
    "QUI", "DNR", "LAI", "UIP", "CER", "BOL",  # Quimper, Dinard, Lannion, Quimper, Cherbourg, Bastia
}

def hav_km(lat0, lon0, lats, lons):
    """Distances haversine d'un point (lat0,lon0) à des arrays (lats,lons), en km."""
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))

def expo_class(d_km, r_km):
    """Exposition d'une classe : 1 au contact, décroît linéairement, 0 au-delà du rayon."""
    if d_km is None:
        return 0.0
    return max(0.0, min(1.0, 1.0 - d_km / r_km))

def score_from_dists(d_auto, d_rail, d_aero):
    """Combinaison MAX (source dominante) -> (score 0-100, classe dominante, distance dominante).

    Loin de toute source -> expo 0 -> score 100. Ne renvoie JAMAIS None (calme = mesure, pas absence).
    """
    cands = [
        ("auto", d_auto, expo_class(d_auto, R_AUTO)),
        ("rail", d_rail, expo_class(d_rail, R_RAIL)),
        ("aero", d_aero, expo_class(d_aero, R_AERO)),
    ]
    src, dist, e = max(cands, key=lambda x: x[2])
    score = round(100 * (1 - e))
    if e <= 0.0:
        return 100, None, None  # calme : aucune source dominante à nommer
    return score, src, round(dist, 1)

def selftest():
    assert expo_class(0.0, 1.5) == 1.0
    assert expo_class(1.5, 1.5) == 0.0
    assert abs(expo_class(0.75, 1.5) - 0.5) < 1e-9
    assert expo_class(99.0, 8.0) == 0.0
    assert expo_class(None, 1.5) == 0.0
    # loin de tout -> 100, pas de source dominante, jamais None
    assert score_from_dists(50.0, 50.0, 50.0) == (100, None, None)
    # autoroute proche domine une voie ferrée plus lointaine (en expo)
    s, src, d = score_from_dists(0.75, 2.0, None)  # expo_auto .5 vs expo_rail .33
    assert (src, d) == ("auto", 0.8), (src, d)
    assert s == 50
    # aéroport à 4 km : expo .5 sur R_AERO=8
    s, src, d = score_from_dists(None, None, 4.0)
    assert (s, src, d) == (50, "aero", 4.0), (s, src, d)
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh-osm", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    print("acquisition/calcul : voir Task 2-5", file=sys.stderr)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Lancer le selftest et vérifier qu'il passe**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest`
Expected: `✓ selftest OK` sur stderr, code retour 0.

- [ ] **Step 3: Commit**

```bash
git add scripts/populate-calme-sonore.py
git commit -m "feat(calme-sonore): squelette script + geometrie (expo absolue, max, score, selftest)"
```

---

## Task 2 : Acquisition OSM + vérif data rail (GATE porteur)

**Files:**
- Modify: `scripts/populate-calme-sonore.py`

Acquisition tuilée des trois classes. **C'est ici qu'on vérifie la brique fragile : le tagging du rail principal.** On copie la plomberie réseau de `populate-reseau-local.py` (mêmes miroirs, mêmes tuiles, même cache-par-tuile).

- [ ] **Step 1: Copier la plomberie de tuilage depuis `populate-reseau-local.py`**

Copier **verbatim** dans `populate-calme-sonore.py` les constantes et fonctions suivantes de `scripts/populate-reseau-local.py` (elles sont génériques, ne pas les réécrire) : `OVERPASS_MIRRORS`, `METRO_BBOX`, `DOM_BBOXES`, `TILE_DEG`, la fonction `tiles()` (lignes ~132-143), et `fetch_tile(query, dest)` (lignes ~109-129). Adapter uniquement le `User-Agent` en `"futur-e/populate-calme-sonore"`.

- [ ] **Step 2: Ajouter les requêtes Overpass des trois classes**

Ajouter dans `populate-calme-sonore.py` :

```python
# ── Requêtes Overpass par classe (géométrie incluse : out geom) ────────────────
def query_roads(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'way["highway"~"^(motorway|trunk|motorway_link|trunk_link)$"]{bb};'
            ');out geom;')

def query_rail(s, w, n, e):
    # Rail PRINCIPAL uniquement. On part de railway=rail puis on filtre côté Python
    # (classify_rail) car usage/highspeed sont mal couverts dans certains réseaux :
    # on ramène large ici, on tranche au parsing après inspection (vérif data, Step 5).
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'way["railway"="rail"]{bb};'
            ');out geom;')

def query_airports(s, w, n, e):
    bb = f"({s},{w},{n},{e})"
    return ('[out:json][timeout:180];('
            f'nwr["aeroway"="aerodrome"]["iata"]{bb};'
            ');out center;')

def classify_rail(tags):
    """True si voie ferrée de GRANDE CIRCULATION (source de bruit). Filtre le secondaire/inerte.

    Inclut : usage=main, OU highspeed=yes (LGV). Exclut explicitement service, sidings,
    usage industrial/tourism/military, disused/abandoned/construction, voies de manœuvre.
    """
    if tags.get("service"):
        return False
    if tags.get("usage") in ("industrial", "tourism", "military", "branch"):
        return False
    for k in ("disused", "abandoned", "construction", "razed", "proposed"):
        if tags.get(k) or tags.get("railway") == k:
            return False
    return tags.get("usage") == "main" or tags.get("highspeed") == "yes"
```

- [ ] **Step 3: Densifier la géométrie des lignes en points-échantillons**

Ajouter le parseur qui transforme les `way` (lignes) en nuage de points (pour la recherche de distance par grille en Task 3). Densifier ~tous les 200 m pour qu'« arrête la plus proche » ≈ « segment le plus proche » :

```python
DENSIFY_KM = 0.2  # pas d'échantillonnage le long des lignes (~200 m)

def densify(geom):
    """geom = liste de {lat,lon} (Overpass out geom) -> liste (lat,lon) densifiée ~200 m."""
    pts = []
    for i in range(len(geom) - 1):
        a, b = geom[i], geom[i + 1]
        pts.append((a["lat"], a["lon"]))
        d = hav_km(a["lat"], a["lon"], np.array([b["lat"]]), np.array([b["lon"]]))[0]
        n = int(d / DENSIFY_KM)
        for k in range(1, n):
            t = k / n
            pts.append((a["lat"] + t * (b["lat"] - a["lat"]), a["lon"] + t * (b["lon"] - a["lon"])))
    if geom:
        pts.append((geom[-1]["lat"], geom[-1]["lon"]))
    return pts

def load_osm(refresh=False):
    """Retourne (auto_pts, rail_pts, aero_pts) : 3 arrays Nx2 (lat,lon) en float64."""
    os.makedirs(OSM_TILE_DIR, exist_ok=True)
    auto, rail, aero = [], [], []
    for (s, w, n, e) in tiles():
        for name, q, sink in (("roads", query_roads, auto), ("rail", query_rail, rail)):
            dest = os.path.join(OSM_TILE_DIR, f"{name}_{s}_{w}.json")
            els = _tile_elements(dest, q, s, w, n, e, refresh)
            for el in els:
                if el.get("type") != "way" or "geometry" not in el:
                    continue
                if name == "rail" and not classify_rail(el.get("tags", {})):
                    continue
                sink.extend(densify(el["geometry"]))
        dest = os.path.join(OSM_TILE_DIR, f"airports_{s}_{w}.json")
        for el in _tile_elements(dest, query_airports, s, w, n, e, refresh):
            iata = (el.get("tags", {}).get("iata") or "").strip().upper()
            if iata not in WHITELIST_IATA:
                continue
            c = el.get("center") or el
            if c.get("lat") is not None:
                aero.append((c["lat"], c["lon"]))
    def arr(p):
        return np.array(p, dtype=np.float64) if p else np.empty((0, 2))
    return arr(auto), arr(rail), arr(aero)

def _tile_elements(dest, qfn, s, w, n, e, refresh):
    if (not refresh) and os.path.exists(dest):
        return json.load(open(dest)).get("elements", [])
    return fetch_tile(qfn(s, w, n, e), dest)
```

- [ ] **Step 4: Câbler `--summary` (compte + déclenche l'acquisition)**

Remplacer le `print("acquisition/calcul ...")` du `main()` par :

```python
    if args.summary:
        auto, rail, aero = load_osm(refresh=args.refresh_osm)
        print(f"points autoroute/voie rapide : {len(auto)}", file=sys.stderr)
        print(f"points rail principal        : {len(rail)}", file=sys.stderr)
        print(f"aéroports commerciaux retenus : {len(aero)}", file=sys.stderr)
        return
```

- [ ] **Step 5: Lancer `--summary` et VÉRIFIER LA DATA (gate porteur)**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --summary`

Inspecter (vérif data, doctrine « vérifier avant de figer ») :
1. **Rail** : le compte de points rail est-il plausible (réseau LGV + grandes lignes couvert) ou anormalement bas (`usage=main` troué) ? Sonder quelques réseaux connus : vérifier qu'une LGV (ex. autour de Tours/Avignon) et une grande ligne classique ressortent. Si `classify_rail` laisse passer trop de secondaire ou en jette trop, ajuster le filtre (ex. accepter aussi un `way` long non taggué sur un corridor LGV) AVANT de continuer.
2. **Aéroports** : le compte (~30-45 attendu) correspond-il à des aéroports réels ? Lister les iata retenus (ajouter un `print` temporaire si besoin) et confirmer qu'aucun aéroclub n'est entré.

**GATE porteur** : présenter le compte des trois classes + l'échantillon rail/aéroport. Ne pas continuer sans feu vert sur la qualité de la donnée rail. Si le rail est troué, c'est le moment de basculer la stratégie (cf. spec, Risque rail).

- [ ] **Step 6: Commit (après gate)**

```bash
git add scripts/populate-calme-sonore.py
git commit -m "feat(calme-sonore): acquisition OSM 3 classes + filtre rail principal + whitelist aeroports"
```

---

## Task 3 : Distances par commune + sonde rayons (GATE porteur)

**Files:**
- Modify: `scripts/populate-calme-sonore.py`

- [ ] **Step 1: Calcul de la distance la plus proche par classe via grille**

Recherche par grille (mêmes idées que `compute_access` de reseau-local : on n'évalue que les points dans les cellules voisines). Ajouter :

```python
GRID = 0.1  # cellule ~11 km lat : garantit de capter toute source dans les rayons max

def _grid(pts):
    g = {}
    for k in range(len(pts)):
        key = (int(math.floor(pts[k, 0] / GRID)), int(math.floor(pts[k, 1] / GRID)))
        g.setdefault(key, []).append(k)
    return g

def nearest_km(lat, lon, pts, grid):
    """Distance (km) au point le plus proche, ou None si aucune source dans ±1 cellule."""
    if len(pts) == 0:
        return None
    ci, cj = int(math.floor(lat / GRID)), int(math.floor(lon / GRID))
    idx = []
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            idx.extend(grid.get((ci + di, cj + dj), []))
    if not idx:
        return None
    sub = pts[idx]
    return float(np.min(hav_km(lat, lon, sub[:, 0], sub[:, 1])))

def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes

def compute_dists(communes, auto, rail, aero):
    ga, gr, ge = _grid(auto), _grid(rail), _grid(aero)
    out = []
    for c in communes:
        la, lo = c["lat"], c["lon"]
        out.append((nearest_km(la, lo, auto, ga),
                    nearest_km(la, lo, rail, gr),
                    nearest_km(la, lo, aero, ge)))
    return out
```

Note : `GRID=0.1` (~11 km) avec voisinage ±1 cellule couvre jusqu'à ~22 km, bien au-delà de `R_AERO`. Si un rayon dépasse ~20 km après sonde, élargir le voisinage.

- [ ] **Step 2: Ajouter les témoins et le mode `--probe`**

Ajouter la table de témoins (la doctrine privilégie la validation qualitative locale) et le mode probe qui imprime les distances brutes :

```python
TEMOINS = {
    "17300": "La Rochelle (aéroport régional + rocade)",   # vérifier le INSEE exact du chef-lieu
    "13201": "Marseille 1er (rocade + voies)",
    "75056": "Paris (axes + aéroports proches)",
    "01034": "Bellegarde (LGV + A40)",
    "26362": "Valence TGV secteur (LGV)",
    "15014": "un bourg du Cantal (isolé, attendu calme=100)",
    "48095": "Mende (isolé Lozère, attendu 100)",
    "69123": "Lyon (rocade/A7)",
    "31555": "Toulouse (périph + aéroport Blagnac)",
}

def _probe_matrix(communes, dists, mode):
    by = {c["insee"]: i for i, c in enumerate(communes)}
    print(f"\n{'commune':42} {'d_auto':>8} {'d_rail':>8} {'d_aero':>8}"
          + ("" if mode == 'probe' else f" {'score':>6} {'src':>5} {'d_km':>6}"), file=sys.stderr)
    for ins, lib in TEMOINS.items():
        if ins not in by:
            print(f"{lib:42} {'ABSENT':>8}", file=sys.stderr); continue
        da, dr, de = dists[by[ins]]
        cells = f"{_f(da):>8} {_f(dr):>8} {_f(de):>8}"
        if mode == 'matrix':
            sc, src, d = score_from_dists(da, dr, de)
            cells += f" {sc:>6} {str(src):>5} {_f(d):>6}"
        print(f"{lib:42} {cells}", file=sys.stderr)

def _f(x):
    return "—" if x is None else f"{x:.1f}"
```

(Remplacer le caractère `—` du helper `_f` par `"n/a"` : pas de tiret cadratin, doctrine.)

Vérifier/corriger les codes INSEE des témoins (chef-lieu) avant de lancer : un mauvais code = témoin `ABSENT`.

- [ ] **Step 3: Câbler `--probe` dans `main()`**

```python
    if args.probe:
        idx, communes = load_communes()
        auto, rail, aero = load_osm(refresh=args.refresh_osm)
        dists = compute_dists(communes, auto, rail, aero)
        _probe_matrix(communes, dists, 'probe')
        return
```

- [ ] **Step 4: Lancer `--probe` et lire les distances réelles (GATE porteur)**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --probe`
Expected: table des distances `d_auto/d_rail/d_aero` pour chaque témoin.

**GATE porteur** : présenter la table. Le porteur lit les distances réelles (ex. « La Rochelle : aéroport à X km ») et **fige R_AUTO / R_RAIL / R_AERO** en conséquence. Mettre à jour les trois constantes en tête de fichier avec les valeurs validées. Ne pas inventer les rayons : ils sortent de cette lecture.

- [ ] **Step 5: Commit**

```bash
git add scripts/populate-calme-sonore.py
git commit -m "feat(calme-sonore): distances par commune (grille) + sonde temoins --probe"
```

---

## Task 4 : Score + matrice témoins (GATE porteur)

**Files:**
- Modify: `scripts/populate-calme-sonore.py`

- [ ] **Step 1: Appliquer les rayons figés (issus du gate Task 3)**

Reporter dans `R_AUTO`/`R_RAIL`/`R_AERO` les valeurs validées par le porteur. (Si le gate a confirmé les valeurs initiales 1.5/3/8, les laisser ; sinon, les remplacer.)

- [ ] **Step 2: Câbler `--matrix` dans `main()`**

```python
    if args.matrix:
        idx, communes = load_communes()
        auto, rail, aero = load_osm(refresh=args.refresh_osm)
        dists = compute_dists(communes, auto, rail, aero)
        _probe_matrix(communes, dists, 'matrix')
        scores = [score_from_dists(*d)[0] for d in dists]
        import collections
        buckets = collections.Counter(s // 10 * 10 for s in scores)
        n100 = sum(1 for s in scores if s == 100)
        print(f"\ndistribution score : {dict(sorted(buckets.items()))}", file=sys.stderr)
        print(f"calme=100 (loin de tout) : {n100}/{len(scores)} ({100*n100//len(scores)} %)", file=sys.stderr)
        return
```

- [ ] **Step 3: Lancer `--matrix` et valider la crédibilité (GATE porteur)**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --matrix`
Expected: par témoin, `score / src / d_km` ; distribution globale ; part à 100.

Vérifs attendues (test « La Rochelle » et au-delà) :
- bourgs isolés (Cantal, Lozère) = **100** ;
- communes traversées/bordées par autoroute = score bas avec `src=auto` ;
- secteur LGV = `src=rail` avec distance crédible ;
- aéroport régional = `src=aero` ;
- la **majorité** des communes à 100 (la France est surtout loin des grands axes : c'est voulu, pas un bug).

**GATE porteur** : « je connais cet endroit, ce score est-il crédible ? ». Si un témoin choque, réajuster le rayon de la classe concernée et relancer `--matrix`. Itérer jusqu'au feu vert.

- [ ] **Step 4: Commit (après gate)**

```bash
git add scripts/populate-calme-sonore.py
git commit -m "feat(calme-sonore): rayons figes par sonde + matrice temoins --matrix"
```

---

## Task 5 : Écriture dans l'index

**Files:**
- Modify: `scripts/populate-calme-sonore.py`

- [ ] **Step 1: Câbler `--write-index`**

Ajouter à la fin de `main()` (avant le `if args.summary`-bloc, peu importe l'ordre tant que c'est traité) :

```python
    # Calcul national complet -> cache + index
    idx, communes = load_communes()
    auto, rail, aero = load_osm(refresh=args.refresh_osm)
    print(f"communes : {len(communes)} | R_auto={R_AUTO} R_rail={R_RAIL} R_aero={R_AERO}", file=sys.stderr)
    dists = compute_dists(communes, auto, rail, aero)
    rec = {}
    for i, c in enumerate(communes):
        sc, src, d = score_from_dists(*dists[i])
        rec[c["insee"]] = {"score": sc, "sourceDominante": src, "distanceKm": d}
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT_CACHE, "w"))
    print(f"✓ cache écrit : {OUT_CACHE}", file=sys.stderr)
    if args.write_index:
        for c in idx["communes"]:
            c["calmeSonore"] = rec.get(c["insee"])  # absent si non géolocalisé -> None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (calmeSonore)", file=sys.stderr)
```

Placer ce bloc de façon à ne PAS s'exécuter pour `--selftest/--summary/--probe/--matrix` (qui `return` avant). Le défaut (sans flag) calcule et écrit le cache ; `--write-index` patche en plus l'index.

- [ ] **Step 2: Re-lancer le selftest (régression géométrie)**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest`
Expected: `✓ selftest OK`.

- [ ] **Step 3: Patcher l'index**

Run: `.venv-bpe/bin/python scripts/populate-calme-sonore.py --write-index`
Expected: `✓ index patché (calmeSonore)`. (Warning GH001 large-file au push = normal.)

- [ ] **Step 4: Vérifier le champ dans l'index sur un témoin**

Run: `.venv-bpe/bin/python -c "import json; d=json.load(open('data/comparateur-index.json')); c=[x for x in d['communes'] if x['insee']=='17300'][0]; print(c.get('calmeSonore'))"`
Expected: un dict `{'score': ..., 'sourceDominante': ..., 'distanceKm': ...}`, jamais `None` pour une commune géolocalisée.

- [ ] **Step 5: Commit**

```bash
git add scripts/populate-calme-sonore.py data/comparateur-index.json
git commit -m "feat(calme-sonore): write-index (champ calmeSonore: score/sourceDominante/distanceKm)"
```

---

## Task 6 : Câblage TypeScript (moteur + labels)

**Files:**
- Modify: `src/lib/comparateur-vie.ts`
- Modify: `src/lib/comparateur-labels.ts`

- [ ] **Step 1: Déclarer la clé dans `PREFERENCE_KEYS`**

Dans `src/lib/comparateur-vie.ts`, après l'entrée `"croissance_demographique",` (dernière du tableau, ligne ~82), ajouter :

```ts
  // Calme sonore : éloignement aux grandes sources de bruit (autoroutes/voies rapides,
  // rail principal, aéroports commerciaux). Décroissance ABSOLUE, source dominante (max),
  // distance au chef-lieu. Loin de tout = 100. Descriptif (proximité), pas dB. Distinct de
  // cadre_calme (densité). Opt-in. cf. populate-calme-sonore.py.
  "calme_sonore",
```

- [ ] **Step 2: Ajouter le champ au type `IndexCommune`**

Dans `src/lib/comparateur-vie.ts`, après le bloc `etudes_acces?`/`etudes_dyn?` (fin du type `IndexCommune`, ligne ~358), ajouter :

```ts
  // Calme sonore (cf. scripts/populate-calme-sonore.py). score = 100*(1-expo), décroissance
  // absolue par classe, max (source dominante). sourceDominante ∈ {auto,rail,aero} | null,
  // distanceKm = distance à la source dominante. Loin de tout = {score:100, src:null}. JAMAIS null
  // au sens « non noté » : l'absence de source est la mesure même.
  calmeSonore?: {
    score: number;
    sourceDominante: "auto" | "rail" | "aero" | null;
    distanceKm: number | null;
  } | null;
```

- [ ] **Step 3: Ajouter le `subScore`**

Dans `src/lib/comparateur-vie.ts`, dans le `switch (key)` de `subScore`, après le `case "croissance_demographique":` (ligne ~705), ajouter :

```ts
    case "calme_sonore":
      // éloignement aux grandes sources de bruit ; loin de tout = 100 (jamais « non noté »).
      // Si le champ manque (commune sans calcul), traiter comme calme : 100.
      return c.calmeSonore?.score ?? 100;
```

- [ ] **Step 4: Ajouter les entrées `REASON_POS` et `REASON_NEG`**

Dans `REASON_POS` (Record exhaustif → tsc imposera la clé), après `croissance_demographique: "population en croissance",` ajouter une fonction (récit court attaché à la reason) :

```ts
  calme_sonore: (c) => {
    const cs = c.calmeSonore;
    if (!cs || cs.sourceDominante == null) return "à l'écart des grandes sources de bruit";
    const lib = cs.sourceDominante === "auto" ? "d'un grand axe routier"
      : cs.sourceDominante === "rail" ? "d'une voie ferrée"
      : "d'un aéroport";
    return cs.distanceKm != null
      ? `proche ${lib} (à ~${cs.distanceKm} km)`
      : `proche ${lib}`;
  },
```

Dans `REASON_NEG`, après `croissance_demographique: "population en baisse",` ajouter :

```ts
  calme_sonore: "proche d'une grande source de bruit",
```

- [ ] **Step 5: Ajouter la dimension ambiante**

Dans `AMBIENT_DIMENSIONS` (ligne ~720), après l'entrée `croissance_demographique`, ajouter :

```ts
  { id: "calme_sonore", key: "calme_sonore", bands: ["à l'écart des grandes sources de bruit", "exposition sonore intermédiaire", "proche d'une grande source de bruit"] },
```

- [ ] **Step 6: Ajouter `PREFERENCE_LABELS` et `PREFERENCE_TOOLTIP`**

Dans `src/lib/comparateur-labels.ts`, dans `PREFERENCE_LABELS` après `croissance_demographique:`, ajouter :

```ts
  calme_sonore: "le calme sonore (loin des grands axes, du rail, des aéroports)",
```

Dans `PREFERENCE_TOOLTIP`, ajouter :

```ts
  calme_sonore: "Éloignement des grandes infrastructures bruyantes (grands axes, voie ferrée, aéroport). Ne mesure pas le bruit réel ni les nuisances locales.",
```

- [ ] **Step 7: Vérifier la compilation et le lint**

Run: `npx tsc --noEmit`
Expected: aucune erreur. (Si `REASON_POS`/`REASON_NEG`/`AMBIENT` étaient incomplets, tsc l'aurait signalé : le Record exhaustif garantit la couverture.)

Run: `npm run lint`
Expected: aucune nouvelle erreur.

- [ ] **Step 8: Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts
git commit -m "feat(calme-sonore): cablage moteur (cle, subScore, reasons, ambiant, labels, tooltip)"
```

---

## Task 7 : Récit `sourceDominante` en synthèse (gaté comme la démographie)

**Files:**
- Modify: `src/lib/comparateur-vie.ts`
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1: Ajouter le champ récit au type `MatchResult`**

Dans `src/lib/comparateur-vie.ts`, dans `export type MatchResult`, après le champ `demographie: string | null;` (ligne ~171), ajouter :

```ts
  // Calme sonore (NARRATIF, hors score/tri). Récit explicatif du critère : nomme la source
  // dominante et sa distance (« autoroute à ~900 m »). Surfacé en synthèse UNIQUEMENT si
  // calme_sonore est demandé (même frontière que demographie/climatInondation). null = silence
  // (loin de toute source, rien à raconter). cf. calmeSonoreRecit.
  calmeSonore: string | null;
```

- [ ] **Step 2: Ajouter le helper `calmeSonoreRecit`**

Dans `src/lib/comparateur-vie.ts`, près des autres helpers narratifs (ex. après `RECIT_DEMOGRAPHIE`, ligne ~745), ajouter :

```ts
// Récit explicatif du calme sonore (HORS score). Nomme la source dominante + distance.
// null = loin de toute source (silence : rien à expliquer). Descriptif, jamais un jugement.
function calmeSonoreRecit(c: IndexCommune): string | null {
  const cs = c.calmeSonore;
  if (!cs || cs.sourceDominante == null || cs.distanceKm == null) return null;
  const lib = cs.sourceDominante === "auto" ? "un grand axe routier"
    : cs.sourceDominante === "rail" ? "une voie ferrée"
    : "un aéroport";
  return `proximité d'${lib === "un aéroport" ? "un aéroport" : lib} à environ ${cs.distanceKm} km`;
}
```

(Note : `d'un grand axe` se contracte mal ; garder la forme `proximité de <source> à environ N km` si la liaison sonne faux. Préférer : `` `${lib} à environ ${cs.distanceKm} km` `` précédé de « proximité de » géré à l'affichage, pour éviter l'élision. Choisir l'une des deux formes et rester cohérent.)

- [ ] **Step 3: Renseigner le champ à l'assemblage**

Dans `src/lib/comparateur-vie.ts`, dans l'objet `as MatchResult` (bloc assemblage ligne ~1333), après la ligne `demographie: c.demographie?.recit ? ... : null,`, ajouter :

```ts
        // Calme sonore : récit construit ici (comme climatInondation/demographie), gaté à
        // l'affichage côté synthèse par « calme_sonore demandé ».
        calmeSonore: calmeSonoreRecit(c),
```

- [ ] **Step 4: Transmettre le récit depuis `OuVivreClient.tsx`**

Dans `src/app/(public)/ou-vivre/OuVivreClient.tsx`, dans le `results: top.map((r) => ({ ... }))` (ligne ~189), après `demographie: r.demographie, ...`, ajouter :

```tsx
              calmeSonore: r.calmeSonore, // récit calme sonore, gaté côté route par calme_sonore demandé
```

- [ ] **Step 5: Étendre le type `results` et le gating dans la route synthesize**

Dans `src/app/api/comparateur-vie/synthesize/route.ts` :

a) Dans le type `results?: { ... }[]` (ligne ~249), ajouter `calmeSonore?: string | null` à la liste des champs.

b) Ajouter le `PREF_LABELS` (ligne ~28), après `croissance_demographique:` :

```ts
  calme_sonore: "le calme sonore (loin des grands axes, du rail, des aéroports)",
```

c) Près de `const croissanceDemandee = ...` (ligne ~279), ajouter :

```ts
  // Récit calme sonore surfacé seulement si l'utilisateur a activé calme_sonore (même
  // doctrine que demographie/inondation : on ne raconte pas une nuisance non demandée).
  const calmeSonoreDemande = (body.preferences ?? []).some((p) => p.key === "calme_sonore");
```

d) Dans l'objet par territoire (près de `evolution_demographique:`, ligne ~300), ajouter :

```ts
      calme_sonore: calmeSonoreDemande ? (r.calmeSonore ?? null) : null,
```

- [ ] **Step 6: Vérifier compilation + lint**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run lint`
Expected: aucune nouvelle erreur.

- [ ] **Step 7: Réinitialiser le cache index (piège connu) puis curl réel**

Le champ `calmeSonore` a été ajouté à l'index en Task 5, mais `indexCache` ne se réinitialise que sur une vraie modif de `comparateur-vie.ts` (déjà faite en Task 6/7). Démarrer le dev :

Run: `npm run dev` (port 3000, en arrière-plan)

Puis un appel réel avec `calme_sonore` demandé, sur un périmètre contenant un témoin bruyant connu (ex. autour de La Rochelle / Lyon). Exemple :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/synthesize \
  -H 'content-type: application/json' \
  -d '{"preferences":[{"key":"calme_sonore","weight":2}],"results":[{"nom":"...","calmeSonore":"proximité d'\''un grand axe routier à environ 0.9 km"}]}' | head
```

Expected: la synthèse intègre le récit calme sonore. Vérifier ensuite via un parcours réel `/ou-vivre` que :
- avec `calme_sonore` demandé, le récit `calme_sonore` apparaît ;
- sans `calme_sonore` demandé, il n'apparaît PAS (gating), et il ne fuit jamais comme trait distinctif global.

- [ ] **Step 8: Commit**

```bash
git add src/lib/comparateur-vie.ts "src/app/(public)/ou-vivre/OuVivreClient.tsx" src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(calme-sonore): recit sourceDominante en synthese, gate par calme_sonore demande"
```

---

## Task 8 : Vérification du routage parse + finition

**Files:**
- Verify: `src/app/api/parse/route.ts`

- [ ] **Step 1: Vérifier que la clé est routable par le parse**

Run: `grep -n "calme\|PREFERENCE_KEYS\|croissance_demographique" src/app/api/parse/route.ts`

Si la route construit sa liste de clés depuis `PREFERENCE_KEYS` (import), rien à faire (la clé est déjà reconnue). Si elle maintient une liste/énumération en dur, y ajouter `calme_sonore` au même endroit que `croissance_demographique`. Vérifier aussi tout prompt système listant les critères demandables : y ajouter le calme sonore avec une glose descriptive.

- [ ] **Step 2: Vérification finale globale**

Run: `npx tsc --noEmit && npm run lint && .venv-bpe/bin/python scripts/populate-calme-sonore.py --selftest`
Expected: tout passe.

Run (parcours réel bout en bout) : un projet en langage naturel mentionnant « je veux du calme / loin des autoroutes » via `/ou-vivre`, vérifier que `calme_sonore` est parsé, scoré, et que le récit apparaît sur une commune bruyante.

- [ ] **Step 3: Commit éventuel**

```bash
git add -A
git commit -m "feat(calme-sonore): routage parse + verification finale"
```

- [ ] **Step 4: Mémoire + finition**

Écrire une mémoire `calme_sonore.md` (type project) : critère = éloignement aux 3 classes de sources, décroissance absolue + max + distance chef-lieu, rayons figés par sonde, récit sourceDominante gaté, pièges (rail OSM fragile, whitelist IATA). Ajouter la ligne d'index dans `MEMORY.md`. Puis invoquer `superpowers:finishing-a-development-branch` (merge `--ff-only` sur main + push UNIQUEMENT sur parole du porteur).

---

## Self-Review (couverture de la spec)

- Critère autonome opt-in distinct de `cadre_calme` : Task 6 Step 1+3 (clé + subScore séparés). ✅
- Sources V1 (motorway/trunk + rail principal + aéroports commerciaux, rien d'autre) : Task 2 Step 2 (`query_roads`/`query_rail`/`query_airports` + `classify_rail` + `WHITELIST_IATA`). ✅
- Décroissance absolue, pas de percentile : Task 1 (`expo_class` linéaire, aucun percentile). ✅
- Combinaison max (source dominante) : Task 1 (`score_from_dists`). ✅
- Distance au chef-lieu : Task 3 (`compute_dists` sur `c["lat"]/c["lon"]`). ✅
- Rayons distincts par classe, figés par sonde : Task 3-4 (gates R_AUTO/R_RAIL/R_AERO). ✅
- Jamais null / loin = 100 : Task 1 (`score_from_dists` retourne 100), Task 6 Step 3 (`?? 100`). ✅
- Récit sourceDominante dès V1, gaté comme la démographie : Task 7 (champ + helper + assemblage + transmission + gating `calmeSonoreDemande`). ✅
- Vérif data rail avant figer : Task 2 Step 5 (GATE). ✅
- Whitelist aéroports sur source nette (IATA) : Task 1/2 (`WHITELIST_IATA` + filtre OSM). ✅
- Câblage 6/7 points : Tasks 6-8. ✅
- selftest + tsc + lint + curl, sonde à gates : tout au long. ✅
