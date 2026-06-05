# Critère « Loin des sites industriels à risque » (`faible_exposition_industrielle`) : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `faible_exposition_industrielle` qui note l'éloignement du chef-lieu aux installations industrielles classées à risque (Géorisques ICPE : Seveso, IED, industrie), via une exposition hybride « site dominant + concentration », avec récit en langage courant.

**Architecture:** Un script Python (`populate-exposition-industrielle.py`, venv `.venv-bpe`) calque `populate-calme-sonore.py` : il récupère le nuage national d'ICPE (API Géorisques paginée, cachée), filtre/pondère par gravité, calcule par commune une exposition `E = dominant + λ·bassin` (le pire site proche domine, la concentration ajuste), la sature en score 0-100, et écrit `expoIndustrielle: {score, sourceDominante}` dans `comparateur-index.json`. Le câblage TS suit exactement le patron `calme_sonore` (déjà en place sur main). Récit gaté en synthèse comme `calme_sonore`/`demographie`.

**Tech Stack:** Python 3 + numpy (venv `.venv-bpe`), API Géorisques `installations_classees` (REST JSON), TypeScript (Next.js App Router), `comparateur-index.json`.

**Doctrine de vérification (pas de runner de test) :** `--selftest` à assertions (dont l'INVARIANT « un site majeur proche > tout empilement ») ; `npx tsc --noEmit` + `npm run lint` ; curl réel sur le dev (port 3000). Sonde → gate porteur → matrice témoins → gate porteur → patch index. Jamais de tiret cadratin (`—`) : virgule ou deux points.

**Piège cache index :** après `--write-index`, faire une vraie modif de `src/lib/comparateur-vie.ts` (un commentaire suffit) pour réinitialiser `indexCache` ; un `touch` ne suffit pas.

**Modèle de référence (à lire et copier) :** `scripts/populate-calme-sonore.py` (plomberie tuiles/cache/grille/selftest/handlers) et le câblage `calme_sonore` dans `src/lib/comparateur-vie.ts`, `src/lib/comparateur-labels.ts`, `src/app/api/comparateur-vie/synthesize/route.ts`, `src/app/api/comparateur-vie/parse/route.ts`, `src/app/(public)/ou-vivre/OuVivreClient.tsx`.

---

## File Structure

- **Create** `scripts/populate-exposition-industrielle.py` : fetch ICPE national + filtre/gravité + exposition hybride + modes `--selftest/--summary/--probe/--matrix/--write-index/--refresh`.
- **Modify** `src/lib/comparateur-vie.ts` : `PREFERENCE_KEYS`, type `IndexCommune` (`expoIndustrielle`), `subScore`, `REASON_POS`/`REASON_NEG`, `AMBIENT_DIMENSIONS`, type `MatchResult` (`expoIndustrielle`), helper récit, assemblage.
- **Modify** `src/lib/comparateur-labels.ts` : `PREFERENCE_LABELS`, `PREFERENCE_TOOLTIP`.
- **Modify** `src/app/api/comparateur-vie/synthesize/route.ts` : `PREF_LABELS`, type `results`, gating récit.
- **Modify** `src/app/(public)/ou-vivre/OuVivreClient.tsx` : transmission du récit.
- **Modify** `src/app/api/comparateur-vie/parse/route.ts` : description critère + désambiguïsation.

---

## Task 1 : Squelette + exposition hybride (selftest avec l'INVARIANT)

**Files:**
- Create: `scripts/populate-exposition-industrielle.py`

Cette tâche pose toute la logique testable sans réseau : classes de gravité, exposition hybride, score, et surtout l'invariant porteur encodé en assertion.

- [ ] **Step 1: Écrire le squelette**

Créer `scripts/populate-exposition-industrielle.py` :

```python
#!/usr/bin/env python3
"""Critère faible_exposition_industrielle : éloignement aux sites industriels à risque.

Source : Géorisques ICPE (installations_classees), 137k sites nationaux géolocalisés.
Filtre : Seveso (haut/bas) + IED + industrie (autorisation/enregistrement). EXCLUT élevages,
éoliennes, carrières, déclaratif. Pondéré par GRAVITÉ (le compte brut mentirait : Paris 1427
ICPE / 0 Seveso vs Marseille 411 / Seveso).
Exposition HYBRIDE : E = dominant(max poids*proximité) + λ*bassin(somme). Le site le plus
préoccupant proche domine ; la concentration ajuste. Loin de tout = 100, jamais null.
Récit (langage courant, sans chiffre) : Seveso -> « site industriel à risque majeur » ;
IED/industrie -> « site industriel ». Distance interne. Géométrie (PLM contourné).
cf. docs/superpowers/specs/2026-06-05-exposition-industrielle-design.md

Usage :
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --selftest
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --summary
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --probe
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --matrix
    .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, urllib.parse, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
ICPE_CACHE = os.path.join(CACHE, "georisques-icpe-national.json")

R_EARTH = 6371.0

# ── Boutons FIGÉS PAR SONDE (gate porteur). Valeurs de départ provisoires. ──────
R_EXPO = 8.0     # rayon d'exposition (km) : un site industriel « pèse » dans ce rayon
H_HALF = 6.0     # demi-vie : score = 100 * 0.5^(E/H). Plus H petit, plus c'est sévère.
LAMBDA = 0.15    # poids du terme « bassin » (concentration). FAIBLE : garantit l'invariant.

# Poids de gravité (départ brutal, sonde réduira l'écart si besoin).
WEIGHT = {"seveso_haut": 10.0, "seveso_bas": 5.0, "ied": 3.0, "industrie": 1.0}

def hav_km(lat0, lon0, lats, lons):
    p0 = math.radians(lat0); lp = np.radians(lats)
    a = np.sin((lp - p0) / 2) ** 2 + math.cos(p0) * np.cos(lp) * np.sin(np.radians(lons - lon0) / 2) ** 2
    return 2 * R_EARTH * np.arcsin(np.sqrt(a))

def icpe_class(p):
    """Classe de gravité d'une installation, ou None si exclue. p = dict de propriétés Géorisques."""
    if p.get("eolienne") or p.get("bovins") or p.get("porcs") or p.get("volailles") or p.get("carriere"):
        return None  # hors sujet (agriculture/éolien) ou nuisance locale (carrière, V2)
    s = p.get("statutSeveso")
    if s == "Seveso seuil haut":
        return "seveso_haut"
    if s == "Seveso seuil bas":
        return "seveso_bas"
    if p.get("ied"):
        return "ied"
    if p.get("industrie") and p.get("regime") in ("Autorisation", "Enregistrement"):
        return "industrie"
    return None  # déclaratif / banal : exclu

def exposure(sites):
    """sites = liste de (classe, distance_km). Retourne (E, classe_dominante) ou (0.0, None).

    E = dominant(max poids*proximité) + LAMBDA*bassin(somme poids*proximité). Le site qui
    réalise le dominant donne la classe nommée au récit.
    """
    best_c, best_contrib, total = None, 0.0, 0.0
    for cls, d in sites:
        w = WEIGHT[cls]
        contrib = w * max(0.0, 1.0 - d / R_EXPO)
        if contrib <= 0.0:
            continue
        total += contrib
        if contrib > best_contrib:
            best_contrib, best_c = contrib, cls
    if best_c is None:
        return 0.0, None
    return best_contrib + LAMBDA * total, best_c

def score_from_E(E):
    """Saturant : E=0 -> 100 (loin de tout, jamais null). Score haut = éloigné des sites."""
    return round(100 * 0.5 ** (E / H_HALF))

def selftest():
    assert icpe_class({"statutSeveso": "Seveso seuil haut"}) == "seveso_haut"
    assert icpe_class({"statutSeveso": "Seveso seuil bas"}) == "seveso_bas"
    assert icpe_class({"ied": True}) == "ied"
    assert icpe_class({"industrie": True, "regime": "Autorisation"}) == "industrie"
    assert icpe_class({"industrie": True, "regime": "Déclaration"}) is None  # déclaratif exclu
    assert icpe_class({"eolienne": True}) is None
    assert icpe_class({"porcs": True}) is None
    assert icpe_class({"carriere": True}) is None
    assert icpe_class({"statutSeveso": "Non Seveso"}) is None
    # score : loin de tout -> 100
    assert score_from_E(0.0) == 100
    assert score_from_E(H_HALF) == 50
    # INVARIANT PORTEUR (le coeur du critère) : 1 Seveso seuil haut à 1 km doit être PLUS
    # exposé que 60 petites ICPE à 2 km. Garantit que la gravité bat la quantité.
    E_major, c_major = exposure([("seveso_haut", 1.0)])
    E_pile, _ = exposure([("industrie", 2.0)] * 60)
    assert c_major == "seveso_haut"
    assert E_major > E_pile, f"INVARIANT CASSÉ : Seveso {E_major:.2f} <= pile {E_pile:.2f} (baisser LAMBDA)"
    # le récit nomme la classe du site dominant
    _, c = exposure([("industrie", 1.0), ("seveso_haut", 0.5)])
    assert c == "seveso_haut"
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--probe", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--refresh", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    print("acquisition/calcul : voir Task 2+", file=sys.stderr)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Lancer le selftest**

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --selftest`
Expected: `✓ selftest OK`. Si l'INVARIANT casse, baisser `LAMBDA` (et le selftest le dit explicitement).

- [ ] **Step 3: Commit**

```bash
git add scripts/populate-exposition-industrielle.py
git commit -m "feat(expo-industrielle): squelette + exposition hybride + invariant (selftest)"
```

---

## Task 2 : Acquisition ICPE nationale (gate data : voie de fetch)

**Files:**
- Modify: `scripts/populate-exposition-industrielle.py`

- [ ] **Step 1: Ajouter le fetch national paginé + cache**

L'API Géorisques `installations_classees` (vérifiée live : 137 103 résultats, `page_size` plafonné à 1000, 138 pages) renvoie par page une liste `data` d'objets portant `latitude`, `longitude`, `codeAIOT`, `statutSeveso`, `ied`, `industrie`, `carriere`, `eolienne`, `bovins`/`porcs`/`volailles`, `regime`, `raisonSociale`, `commune`. Ajouter :

```python
GEORISQUES_URL = "https://www.georisques.gouv.fr/api/v1/installations_classees"

def fetch_icpe_national(refresh=False):
    """Récupère toutes les ICPE (pagination page_size=1000) -> liste de dicts, cachée sur disque."""
    if (not refresh) and os.path.exists(ICPE_CACHE):
        return json.load(open(ICPE_CACHE))
    os.makedirs(CACHE, exist_ok=True)
    out, page, total_pages = [], 1, None
    while total_pages is None or page <= total_pages:
        url = f"{GEORISQUES_URL}?page={page}&page_size=1000"
        doc = None
        for attempt in (1, 2, 3):
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-expo-industrielle"})
                with urllib.request.urlopen(req, timeout=120) as r:
                    doc = json.loads(r.read())
                break
            except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
                print(f"  page {page} essai {attempt} : {e}", file=sys.stderr); time.sleep(2)
        if doc is None:
            raise RuntimeError(f"page {page} échouée après 3 essais")
        if total_pages is None:
            total_pages = doc.get("total_pages")
            print(f"total ICPE : {doc.get('results')} | pages : {total_pages}", file=sys.stderr)
        out.extend(doc.get("data", []))
        if page % 20 == 0:
            print(f"  page {page}/{total_pages} ({len(out)} cumulés)", file=sys.stderr)
        page += 1
    json.dump(out, open(ICPE_CACHE, "w"))
    print(f"✓ cache ICPE écrit : {ICPE_CACHE} ({len(out)} installations)", file=sys.stderr)
    return out
```

- [ ] **Step 2: Ajouter le chargement filtré en nuage de points (classe + lat/lon), dédupliqué**

```python
def load_sites(refresh=False):
    """Retourne (classes:list[str], lats:np.ndarray, lons:np.ndarray) des sites RETENUS, dédupliqués
    par codeAIOT. classes parallèle aux coordonnées."""
    raw = fetch_icpe_national(refresh=refresh)
    seen = set()
    cls, lat, lon = [], [], []
    for p in raw:
        cid = p.get("codeAIOT")
        if cid in seen:
            continue
        seen.add(cid)
        c = icpe_class(p)
        if c is None:
            continue
        la, lo = p.get("latitude"), p.get("longitude")
        if la is None or lo is None:
            continue
        cls.append(c); lat.append(la); lon.append(lo)
    return cls, np.array(lat, dtype=np.float64), np.array(lon, dtype=np.float64)
```

- [ ] **Step 3: Câbler `--summary`**

Remplacer le `print("acquisition/calcul ...")` du `main()` par :

```python
    if args.summary:
        import collections
        cls, lat, lon = load_sites(refresh=args.refresh)
        print(f"sites retenus : {len(cls)}", file=sys.stderr)
        print(f"par classe : {dict(collections.Counter(cls))}", file=sys.stderr)
        return
```

- [ ] **Step 4: Lancer `--summary` (gate data : confirmer la voie de fetch)**

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --summary`
Expected: ~137k ICPE récupérées, puis un sous-ensemble RETENU avec une distribution par classe (ex. `{'industrie': N, 'ied': N, 'seveso_bas': N, 'seveso_haut': N}`). Vérifier que les comptes Seveso/IED sont plausibles (quelques centaines à quelques milliers de Seveso en France, ~1300 IED). Si la pagination est trop lente/fragile, basculer sur le geojson national data.gouv « Base des installations classées (ICPE) » (même schéma de champs).

**GATE porteur** : présenter les comptes par classe. Ne pas continuer sans feu vert sur la plausibilité.

- [ ] **Step 5: Commit (après gate)**

```bash
git add scripts/populate-exposition-industrielle.py
git commit -m "feat(expo-industrielle): fetch ICPE national pagine + filtre/gravite + dedup codeAIOT"
```

---

## Task 3 : Exposition par commune + sonde témoins lourds (GATE porteur)

**Files:**
- Modify: `scripts/populate-exposition-industrielle.py`

- [ ] **Step 1: Calcul par commune via grille (le pire site proche + concentration)**

```python
GRID = 0.1  # cellule ~11 km : ±1 cellule couvre R_EXPO=8 km partout

def _grid(lat, lon):
    g = {}
    for k in range(len(lat)):
        key = (int(math.floor(lat[k] / GRID)), int(math.floor(lon[k] / GRID)))
        g.setdefault(key, []).append(k)
    return g

def commune_exposure(la, lo, cls, lat, lon, grid):
    """(E, classe_dominante) pour une commune (chef-lieu la,lo)."""
    if len(lat) == 0:
        return 0.0, None
    ci, cj = int(math.floor(la / GRID)), int(math.floor(lo / GRID))
    idx = []
    for di in (-1, 0, 1):
        for dj in (-1, 0, 1):
            idx.extend(grid.get((ci + di, cj + dj), []))
    if not idx:
        return 0.0, None
    sub = np.array(idx)
    d = hav_km(la, lo, lat[sub], lon[sub])
    sites = [(cls[idx[k]], float(d[k])) for k in range(len(idx)) if d[k] < R_EXPO]
    return exposure(sites)

def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"] if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes

def compute_all(communes, cls, lat, lon):
    grid = _grid(lat, lon)
    out = []
    for c in communes:
        E, dom = commune_exposure(c["lat"], c["lon"], cls, lat, lon, grid)
        out.append({"score": score_from_E(E), "sourceDominante": dom, "E": round(E, 2)})
    return out
```

- [ ] **Step 2: Témoins + affichage**

```python
# Codes INSEE à VÉRIFIER par nom dans l'index avant la sonde (piège : faux témoins / PLM).
TEMOINS = {
    "13039": "Fos-sur-Mer (industrie lourde)",
    "69276": "Feyzin (raffinerie)",
    "64320": "Lacq (bassin chimique)",
    "76305": "Gonfreville-l'Orcher (raffinerie)",
    "44052": "Donges (raffinerie)",
    "75056": "Paris (bcp d'ICPE, 0 Seveso = contrôle)",
    "48095": "Mende (rural, attendu ~100)",
    "12145": "un rural Aveyron (attendu ~100)",
}

def _show(communes, results):
    by = {c["insee"]: i for i, c in enumerate(communes)}
    print(f"\n{'commune':34} {'E':>8} {'score':>6} {'dominante':>12}", file=sys.stderr)
    for ins, lib in TEMOINS.items():
        if ins not in by:
            print(f"{lib:34} {'ABSENT':>8}", file=sys.stderr); continue
        r = results[by[ins]]
        print(f"{lib:34} {r['E']:>8} {r['score']:>6} {str(r['sourceDominante']):>12}", file=sys.stderr)
```

- [ ] **Step 3: Câbler `--probe`**

```python
    if args.probe:
        idx, communes = load_communes()
        cls, lat, lon = load_sites(refresh=args.refresh)
        print(f"R_EXPO={R_EXPO} H={H_HALF} LAMBDA={LAMBDA} | poids={WEIGHT}", file=sys.stderr)
        results = compute_all(communes, cls, lat, lon)
        _show(communes, results)
        return
```

- [ ] **Step 4: Vérifier les codes INSEE témoins puis lancer `--probe` (GATE porteur)**

D'abord confirmer les INSEE par nom (piège faux témoins) :

Run: `.venv-bpe/bin/python -c "import json; d=json.load(open('data/comparateur-index.json')); [print(c['insee'],c['nom']) for c in d['communes'] if c['nom'] in ('Fos-sur-Mer','Feyzin','Lacq','Gonfreville-l\'Orcher','Donges','Mende')]"`
Corriger `TEMOINS` si un code diffère.

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --probe`
Expected: table E / score / dominante par témoin.

**GATE porteur** : les **témoins lourds (Fos, Feyzin, Lacq, Gonfreville, Donges) doivent sortir en tête d'exposition** (E élevé, score bas, `sourceDominante` = seveso_haut), Paris doit rester modéré malgré ses 1427 ICPE (contrôle : la quantité ne gagne pas), le rural à 100. Le porteur lit, puis fige `R_EXPO` / `H_HALF` / `LAMBDA` / `WEIGHT`. Ne pas inventer ces valeurs : elles sortent de cette lecture.

- [ ] **Step 5: Commit**

```bash
git add scripts/populate-exposition-industrielle.py
git commit -m "feat(expo-industrielle): exposition par commune (grille) + sonde temoins lourds --probe"
```

---

## Task 4 : Matrice + distribution (GATE porteur)

**Files:**
- Modify: `scripts/populate-exposition-industrielle.py`

- [ ] **Step 1: Appliquer les boutons figés (issus du gate Task 3)**

Reporter dans `R_EXPO` / `H_HALF` / `LAMBDA` / `WEIGHT` les valeurs validées par le porteur.

- [ ] **Step 2: Câbler `--matrix`**

```python
    if args.matrix:
        import collections
        idx, communes = load_communes()
        cls, lat, lon = load_sites(refresh=args.refresh)
        results = compute_all(communes, cls, lat, lon)
        _show(communes, results)
        scores = [r["score"] for r in results]
        buckets = collections.Counter(s // 10 * 10 for s in scores)
        n100 = sum(1 for s in scores if s == 100)
        print(f"\ndistribution score : {dict(sorted(buckets.items()))}", file=sys.stderr)
        print(f"score=100 (loin de tout) : {n100}/{len(scores)} ({100*n100//len(scores)} %)", file=sys.stderr)
        return
```

- [ ] **Step 3: Lancer `--matrix` (GATE porteur)**

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --matrix`
Expected: table témoins + distribution + part à 100.

Vérifs : témoins lourds en tête, contrôle Paris modéré, distribution crédible (la majorité de la France a peu/pas d'exposition -> beaucoup de 100, c'est voulu). **GATE porteur** : « je connais ce territoire, ce score est-il crédible ? ». Itérer si besoin.

- [ ] **Step 4: Commit (après gate)**

```bash
git add scripts/populate-exposition-industrielle.py
git commit -m "feat(expo-industrielle): boutons figes par sonde + matrice temoins --matrix"
```

---

## Task 5 : Écriture dans l'index

**Files:**
- Modify: `scripts/populate-exposition-industrielle.py`

- [ ] **Step 1: Câbler `--write-index`**

Ajouter à la fin de `main()` (après les `return` des autres modes) :

```python
    # Calcul national complet -> cache + index
    idx, communes = load_communes()
    cls, lat, lon = load_sites(refresh=args.refresh)
    print(f"communes : {len(communes)} | sites : {len(cls)} | R={R_EXPO} H={H_HALF} λ={LAMBDA}", file=sys.stderr)
    results = compute_all(communes, cls, lat, lon)
    rec = {}
    for c, r in zip(communes, results):
        rec[c["insee"]] = {"score": r["score"], "sourceDominante": r["sourceDominante"]}
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(os.path.join(CACHE, "communes-expo-industrielle.json"), "w"))
    print("✓ cache écrit", file=sys.stderr)
    if args.write_index:
        for c in idx["communes"]:
            c["expoIndustrielle"] = rec.get(c["insee"])  # non géolocalisée -> None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (expoIndustrielle)", file=sys.stderr)
```

- [ ] **Step 2: Re-selftest puis écrire l'index**

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --selftest`
Expected: `✓ selftest OK`.

Run: `.venv-bpe/bin/python scripts/populate-exposition-industrielle.py --write-index`
Expected: `✓ index patché (expoIndustrielle)`. (Warning GH001 large-file au push = normal.)

- [ ] **Step 3: Vérifier le champ sur un témoin lourd**

Run: `.venv-bpe/bin/python -c "import json; d=json.load(open('data/comparateur-index.json')); c=[x for x in d['communes'] if x['nom']=='Feyzin'][0]; print(c.get('expoIndustrielle'))"`
Expected: dict `{'score': <bas>, 'sourceDominante': 'seveso_haut'}` (Feyzin = raffinerie Seveso).

- [ ] **Step 4: Commit**

```bash
git add scripts/populate-exposition-industrielle.py data/comparateur-index.json
git commit -m "feat(expo-industrielle): write-index (champ expoIndustrielle: score/sourceDominante)"
```

---

## Task 6 : Câblage TypeScript (moteur + labels)

**Files:**
- Modify: `src/lib/comparateur-vie.ts`
- Modify: `src/lib/comparateur-labels.ts`

Tous les points d'insertion sont JUSTE APRÈS l'entrée `calme_sonore` correspondante (déjà en place sur main), même patron.

- [ ] **Step 1: `PREFERENCE_KEYS`**

Dans `src/lib/comparateur-vie.ts`, après l'entrée `"calme_sonore",` du tableau `PREFERENCE_KEYS`, ajouter :

```ts
  // Exposition industrielle : éloignement aux installations classées à risque (Géorisques ICPE :
  // Seveso/IED/industrie). Exposition HYBRIDE (site dominant + concentration), pondérée par
  // gravité. Présence administrative, PAS un niveau de pollution ni un risque sanitaire avéré.
  // Loin de tout = 100. Opt-in. cf. populate-exposition-industrielle.py.
  "faible_exposition_industrielle",
```

- [ ] **Step 2: Champ `IndexCommune`**

Après le bloc `calmeSonore?: {...} | null;` du type `IndexCommune`, ajouter :

```ts
  // Exposition industrielle (cf. scripts/populate-exposition-industrielle.py). score = exposition
  // hybride saturée (dominant + λ·bassin, pondérée gravité) -> loin de tout = 100, JAMAIS null au
  // sens « non noté ». sourceDominante = classe du site le plus préoccupant proche (récit).
  expoIndustrielle?: {
    score: number;
    sourceDominante: "seveso_haut" | "seveso_bas" | "ied" | "industrie" | null;
  } | null;
```

- [ ] **Step 3: `subScore`**

Après le `case "calme_sonore":` du `switch` de `subScore`, ajouter :

```ts
    case "faible_exposition_industrielle":
      // éloignement aux sites industriels à risque ; loin de tout = 100 (jamais « non noté »).
      return c.expoIndustrielle?.score ?? 100;
```

- [ ] **Step 4: `REASON_POS` et `REASON_NEG`**

Dans `REASON_POS`, après `calme_sonore: "à l'écart des grandes infrastructures bruyantes",` ajouter :

```ts
  faible_exposition_industrielle: "à l'écart des sites industriels à risque",
```

Dans `REASON_NEG`, après `calme_sonore: "environnement assez maillé d'infrastructures bruyantes",` ajouter :

```ts
  faible_exposition_industrielle: "à proximité de sites industriels à risque",
```

- [ ] **Step 5: `AMBIENT_DIMENSIONS`**

Après l'entrée `{ id: "calme_sonore", ... }`, ajouter :

```ts
  { id: "expo_industrielle", key: "faible_exposition_industrielle", bands: ["à l'écart des sites industriels à risque", "présence industrielle intermédiaire", "environnement industriel marqué"] },
```

- [ ] **Step 6: Labels + tooltip**

Dans `src/lib/comparateur-labels.ts`, dans `PREFERENCE_LABELS` après l'entrée `calme_sonore:`, ajouter :

```ts
  faible_exposition_industrielle: "être loin des sites industriels à risque",
```

Dans `PREFERENCE_TOOLTIP`, après l'entrée `calme_sonore:`, ajouter :

```ts
  faible_exposition_industrielle: "Densité d'installations industrielles classées en activité à proximité (sites Seveso, IED). Mesure leur présence, pas un niveau de pollution ni un risque sanitaire avéré. Ne couvre pas les anciens sites pollués ni les friches (signal distinct à venir).",
```

- [ ] **Step 7: tsc + lint**

Run: `npx tsc --noEmit`
Expected: aucune erreur (les Record exhaustifs `REASON_POS`/`REASON_NEG` imposent la clé).

Run: `npm run lint`
Expected: aucune nouvelle erreur.

- [ ] **Step 8: Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts
git commit -m "feat(expo-industrielle): cablage moteur (cle, subScore, reasons, ambiant, labels)"
```

---

## Task 7 : Récit gaté (langage courant, sans chiffre) + curl réel

**Files:**
- Modify: `src/lib/comparateur-vie.ts`
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1: Champ récit dans `MatchResult`**

Dans `export type MatchResult`, après le champ `calmeSonore: string | null;`, ajouter :

```ts
  // Exposition industrielle (NARRATIF, hors score/tri). Nomme en langage courant le site le plus
  // préoccupant proche, SANS chiffre : « la proximité d'un site industriel à risque majeur »
  // (Seveso) / « d'un site industriel » (IED/industrie). Gaté en synthèse par « critère demandé ».
  // null = silence (aucun site préoccupant proche). cf. expoIndustrielleRecit.
  expoIndustrielle: string | null;
```

- [ ] **Step 2: Helper `expoIndustrielleRecit`**

Près des autres helpers narratifs (après `calmeSonoreRecit`), ajouter :

```ts
// Récit de l'exposition industrielle (HORS score). Langage courant, sans chiffre, sans jargon
// (« Seveso » jamais affiché). « à risque majeur » = sens factuel de Seveso, pas un jugement.
// null = aucun site préoccupant proche (silence). Descriptif, jamais « dangereux/toxique ».
function expoIndustrielleRecit(c: IndexCommune): string | null {
  const src = c.expoIndustrielle?.sourceDominante;
  if (src == null) return null;
  return (src === "seveso_haut" || src === "seveso_bas")
    ? "la proximité d'un site industriel à risque majeur"
    : "la proximité d'un site industriel";
}
```

- [ ] **Step 3: Renseigner à l'assemblage**

Dans l'objet `as MatchResult`, après `calmeSonore: calmeSonoreRecit(c),`, ajouter :

```ts
        // Exposition industrielle : récit construit ici, gaté côté synthèse par « critère demandé ».
        expoIndustrielle: expoIndustrielleRecit(c),
```

- [ ] **Step 4: Transmission `OuVivreClient.tsx`**

Dans le `results: top.map((r) => ({ ... }))`, après `calmeSonore: r.calmeSonore,`, ajouter :

```tsx
              expoIndustrielle: r.expoIndustrielle, // récit sites industriels, gaté côté route par critère demandé
```

- [ ] **Step 5: Route synthesize (type + label + gating)**

Dans `src/app/api/comparateur-vie/synthesize/route.ts` :

a) Dans le type `results?: { ... }[]`, ajouter `expoIndustrielle?: string | null` à la liste des champs.

b) Dans `PREF_LABELS`, après l'entrée `calme_sonore:`, ajouter :

```ts
  faible_exposition_industrielle: "l'éloignement des sites industriels à risque",
```

c) Après `const calmeSonoreDemande = ...`, ajouter :

```ts
  // Récit industriel surfacé seulement si l'utilisateur a activé le critère (même doctrine que
  // calme_sonore/demographie : on ne nomme pas un site industriel non demandé).
  const expoIndustrielleDemandee = (body.preferences ?? []).some((p) => p.key === "faible_exposition_industrielle");
```

d) Dans l'objet par territoire, après `calme_sonore: calmeSonoreDemande ? ... : null,`, ajouter :

```ts
      exposition_industrielle: expoIndustrielleDemandee ? (r.expoIndustrielle ?? null) : null,
```

- [ ] **Step 6: tsc + lint**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

Run: `npm run lint`
Expected: aucune nouvelle erreur.

- [ ] **Step 7: curl réel (récit + gating + score)**

Run: `npm run dev` (port 3000, arrière-plan), attendre la disponibilité.

Vérifier le score + le récit sur un témoin lourd (Feyzin / Fos), via le match en filtrant le département :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'content-type: application/json' \
  -d '{"parsed":{"preferences":[{"key":"prefere_grande_ville","weight":1}],"hardConstraints":{"departements":["69"]}}}' \
  | python3 -c "import sys,json; d=json.load(sys.stdin); [print(r['nom'], repr(r.get('expoIndustrielle'))) for r in d['results'] if r['nom'] in ('Feyzin','Lyon','Villeurbanne')]"
```

Expected : Feyzin -> `"la proximité d'un site industriel à risque majeur"` ; une commune sans site proche -> `None` (silence). Vérifier aussi qu'en demandant `faible_exposition_industrielle` les communes les moins exposées remontent, et que le récit n'apparaît dans la synthèse QUE si le critère est demandé (gating).

- [ ] **Step 8: Commit**

```bash
git add src/lib/comparateur-vie.ts "src/app/(public)/ou-vivre/OuVivreClient.tsx" src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(expo-industrielle): recit langage courant sans chiffre, gate par critere demande"
```

---

## Task 8 : Routage parse + finition

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1: Description critère + désambiguïsation**

Dans le prompt système de `src/app/api/comparateur-vie/parse/route.ts`, après la ligne décrivant `calme_sonore`, ajouter :

```
- faible_exposition_industrielle : éloignement des installations industrielles classées à risque (sites Seveso, IED, industrie lourde, dépôts/usines chimiques, raffineries, traitement de déchets dangereux). DISTINCT de air_sain (qualité de l'air) et calme_sonore (bruit). Pour « loin des usines », « éviter les zones industrielles », « pas de site Seveso à côté », « loin de l'industrie lourde », « pas de raffinerie / usine chimique »
```

Et dans la section TRADUCTION AUTOMATIQUE, après la ligne `calme_sonore`, ajouter :

```
- "loin des usines", "éviter les zones industrielles", "pas d'industrie lourde", "loin d'une raffinerie / usine chimique", "pas de site Seveso" → faible_exposition_industrielle (poids 2 à 3).
```

- [ ] **Step 2: Vérification finale globale**

Run: `npx tsc --noEmit && npm run lint && .venv-bpe/bin/python scripts/populate-exposition-industrielle.py --selftest`
Expected: tout passe.

Run (parcours réel) : un projet « je veux éviter les zones industrielles » via `/ou-vivre`, vérifier que `faible_exposition_industrielle` est parsé, scoré, et que le récit apparaît sur une commune exposée.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(expo-industrielle): routage parse + desambiguisation (loin des usines / zones industrielles)"
```

- [ ] **Step 4: Mémoire + finition**

Écrire une mémoire `exposition_industrielle.md` (type project) : critère = éloignement ICPE/Seveso, exposition hybride dominant+bassin (invariant gravité>quantité), filtre, récit 2 niveaux sans chiffre, source Géorisques, pièges (PLM contourné par géométrie, compte brut ment). Ajouter la ligne d'index dans `MEMORY.md` et mettre à jour `project_roadmap.md`. Puis invoquer `superpowers:finishing-a-development-branch` (merge `--ff-only` sur main + push UNIQUEMENT sur parole du porteur).

---

## Self-Review (couverture de la spec)

- Clé `faible_exposition_industrielle` + libellé user « Loin des sites industriels à risque » : Task 6 Step 1, Task 6 Step 6. ✅
- Source Géorisques ICPE national, fetch paginé + cache : Task 2. ✅
- Filtre (Seveso/IED/industrie ; exclut élevages/éoliennes/carrières/déclaratif) : Task 1 `icpe_class` + selftest. ✅
- Pondération gravité (10/5/3/1) : Task 1 `WEIGHT`. ✅
- Exposition hybride dominant + λ·bassin + INVARIANT : Task 1 `exposure` + assertion selftest ; gate Task 3. ✅
- Géométrie (PLM contourné) : Task 3 (grille sur lat/lon, jamais de jointure code_insee). ✅
- Score saturant, loin = 100, jamais null : Task 1 `score_from_E` + Task 6 Step 3 (`?? 100`). ✅
- Récit 2 niveaux, langage courant, sans chiffre, gaté : Task 7. ✅
- Glose « présence, pas pollution ni risque sanitaire » : Task 6 Step 6 (tooltip). ✅
- Sonde à gates + témoins lourds : Tasks 3-4. ✅
- Câblage 7 points + parse désambiguïsation : Tasks 6-8. ✅
- Hors V1 (sols/friches/carrières) : non implémenté (correct, hors périmètre). ✅
