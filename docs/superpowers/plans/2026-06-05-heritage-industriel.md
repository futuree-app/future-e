# Héritage industriel (signal narratif non scoré) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un signal NARRATIF « héritage industriel » (ancien site pollué proche), gaté par une intention exprimée, jamais scoré ni dans le tri, distinct de `faible_exposition_industrielle`.

**Architecture:** Un script Python précompute, par commune, le site SSP/ex-BASOL (`instructions`) le plus proche du chef-lieu et l'écrit dans `data/comparateur-index.json` (`heritageIndustriel`). Le moteur (`comparateur-vie.ts`) en dérive un récit `MatchResult.heritageIndustriel`. Le parse émet un flag `heritageIntent` ; la synthèse surface le récit comme `calme_sonore` ; AskFuture l'injecte toujours.

**Tech Stack:** Python 3 (venv `.venv-bpe`, urllib + numpy comme `populate-exposition-industrielle.py`), TypeScript/Next.js. Vérification = `--selftest` Python, `npx tsc --noEmit`, sonde manuelle (pas de jest/pytest dans le repo).

Spec : `docs/superpowers/specs/2026-06-05-heritage-industriel-design.md`. Modèles à copier :
`scripts/populate-exposition-industrielle.py` (script), `littoral`/`hasCoastalIntent` (intention),
`calmeSonore` (récit gaté + câblage 7 points).

---

## Task 1 : Script Python — fonctions pures + selftest (activité, centroïde)

**Files:**
- Create: `scripts/populate-heritage-industriel.py`

- [ ] **Step 1 : Écrire le squelette + fonctions pures + selftest (qui doit échouer faute de fichier)**

```python
#!/usr/bin/env python3
"""Précompute le signal NARRATIF 'héritage industriel' (SSP/ex-BASOL) par commune.

Source : API Géorisques GET /api/v1/ssp, sous-clé `instructions` UNIQUEMENT (ex-BASOL curé).
casias/conclusions_sis/conclusions_sup IGNORÉS. NON scoré : on écrit juste, par commune, le
site instruit le plus proche du chef-lieu (activité dérivée du nom, pluralité, distance).

Usage :
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --selftest
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --fetch         # boucle géo, cache
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --matrix        # témoins, sonde 3 vs 5
    .venv-bpe/bin/python scripts/populate-heritage-industriel.py --write-index
"""
import json, os, sys, math, argparse, urllib.request, unicodedata, time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
SSP_CACHE = os.path.join(CACHE, "georisques-ssp-instructions.json")  # {insee: [site,...]}

R_EARTH = 6371.0
SSP_URL = "https://www.georisques.gouv.fr/api/v1/ssp"
FETCH_RAYON_M = 5000   # fetch large : couvre la sonde 3 ET 5 km en une passe
R_KM = 3.0             # rayon du SIGNAL, PROVISOIRE — figé par sonde (gate porteur, Task 4)

# (catégorie, genre, mots-clés normalisés) — ordre = priorité. cf. spec §3bis.
ACTIVITE = [
    ("usine_gaz", "f", ["gdf", "gaz de france", "usine a gaz", "edf gdf", "edf  gdf", "edf/gdf"]),
    ("raffinerie_hydrocarbures", "m", ["esso", "raffinerie", "petrol", "hydrocarbure",
                                       "depot petrolier", "shell", "total ", "antar"]),
    ("chimie", "m", ["chimi", "chimique"]),
    ("metallurgie", "f", ["fonderie", "metallurg", "siderurg", "acierie", "aciers", "forge"]),
    ("decharge", "f", ["decharge", "ordures", "dechets menagers"]),
]

def norm(s):
    s = unicodedata.normalize("NFD", s or "")
    s = "".join(ch for ch in s if unicodedata.category(ch) != "Mn")
    return s.lower()

def activite_of(nom):
    """Catégorie grand public du site d'après son nom_etablissement. Repli 'generique'."""
    n = norm(nom)
    for cat, _genre, kws in ACTIVITE:
        if any(k in n for k in kws):
            return cat
    return "generique"

def centroid(geom):
    """Centroïde (lat, lon) d'un geom GeoJSON Point/MultiPolygon, ou None."""
    if not geom:
        return None
    t = geom.get("type")
    coords = geom.get("coordinates")
    if t == "Point":
        return (coords[1], coords[0])
    pts = []
    stack = [coords]
    while stack:
        x = stack.pop()
        if (isinstance(x, list) and len(x) == 2
                and all(isinstance(v, (int, float)) for v in x)):
            pts.append(x)  # [lon, lat]
        elif isinstance(x, list):
            stack.extend(x)
    if not pts:
        return None
    lon = sum(p[0] for p in pts) / len(pts)
    lat = sum(p[1] for p in pts) / len(pts)
    return (lat, lon)

def hav_km(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    a = (math.sin((p2 - p1) / 2) ** 2
         + math.cos(p1) * math.cos(p2) * math.sin(math.radians(lon2 - lon1) / 2) ** 2)
    return 2 * R_EARTH * math.asin(math.sqrt(a))

def selftest():
    assert activite_of("Agence EDF / GDF Services") == "usine_gaz"
    assert activite_of("Centre EDF  GDF Services") == "usine_gaz"
    assert activite_of("ESSO SERVICE PORTE ROYALE") == "raffinerie_hydrocarbures"
    assert activite_of("TRIAXE INDUSTRIES") == "generique"
    assert activite_of("SNC DELFAU ET CIE") == "generique"
    assert activite_of("") == "generique"
    c = centroid({"type": "MultiPolygon", "coordinates":
                  [[[[-1.2, 46.0], [-1.0, 46.0], [-1.0, 46.2], [-1.2, 46.2], [-1.2, 46.0]]]]})
    assert abs(c[0] - 46.08) < 0.06 and abs(c[1] + 1.12) < 0.06, c
    assert centroid({"type": "Point", "coordinates": [-1.15, 46.16]}) == (46.16, -1.15)
    assert centroid(None) is None
    assert round(hav_km(46.16, -1.15, 46.16, -1.15), 3) == 0.0
    print("✓ selftest OK", file=sys.stderr)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--fetch", action="store_true")
    ap.add_argument("--matrix", action="store_true")
    ap.add_argument("--summary", action="store_true")
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--rayon", type=float, default=R_KM)
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return
    print("rien à faire (voir --selftest)", file=sys.stderr)

if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Lancer le selftest, vérifier qu'il PASSE**

Run: `.venv-bpe/bin/python scripts/populate-heritage-industriel.py --selftest`
Expected: `✓ selftest OK` sur stderr, exit 0. (Si `.venv-bpe` absent, utiliser le même venv que `populate-exposition-industrielle.py` ; sinon `python3` système, numpy non requis ici.)

- [ ] **Step 3 : Commit**

```bash
git add scripts/populate-heritage-industriel.py
git commit -m "feat(heritage): script populate - activite + centroide + selftest"
```

---

## Task 2 : Acquisition géo par commune (`instructions` seulement, cache + reprise)

**Files:**
- Modify: `scripts/populate-heritage-industriel.py`

- [ ] **Step 1 : Ajouter le fetch + le `--fetch`**

Ajouter avant `main()` :

```python
def _http_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-heritage"})
    for attempt in (1, 2, 3):
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return json.loads(r.read())
        except Exception as e:  # noqa: BLE001 (résilience réseau volontaire)
            print(f"    essai {attempt} : {e}", file=sys.stderr)
            time.sleep(2)
    return None

def fetch_commune_instructions(lat, lon):
    """Liste des sites `instructions` (ex-BASOL) dans FETCH_RAYON_M autour de (lat,lon).
    Ne lit QUE la sous-clé instructions. page_size=1000 -> tous les sites instruits tiennent
    en page 1 (couche curée, comptes faibles). Pagine la sous-base si jamais results > data."""
    url = f"{SSP_URL}?latlon={lon},{lat}&rayon={int(FETCH_RAYON_M)}&page=1&page_size=1000"
    doc = _http_json(url)
    if not doc:
        return None  # échec réseau : ne pas cacher, on retentera
    blk = doc.get("instructions") or {}
    data = list(blk.get("data") or [])
    out = []
    seen = set()
    for rec in data:
        sid = rec.get("identifiant_ssp")
        if sid in seen:
            continue
        seen.add(sid)
        cen = centroid(rec.get("geom"))
        if cen is None:
            continue
        out.append({"id": sid, "nom": rec.get("nom_etablissement"),
                    "statut": rec.get("statut"), "lat": cen[0], "lon": cen[1]})
    return out

def fetch_all(refresh=False):
    """Boucle sur toutes les communes de l'index ; cache {insee: [sites]} avec reprise."""
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]
                if c.get("lat") is not None and c.get("lon") is not None]
    os.makedirs(CACHE, exist_ok=True)
    cache = {} if refresh else (json.load(open(SSP_CACHE)) if os.path.exists(SSP_CACHE) else {})
    todo = [c for c in communes if c["insee"] not in cache]
    print(f"{len(cache)} en cache, {len(todo)} à récupérer", file=sys.stderr)
    for n, c in enumerate(todo, 1):
        sites = fetch_commune_instructions(c["lat"], c["lon"])
        if sites is None:
            continue  # réseau KO : laissé hors cache, repris au prochain run
        cache[c["insee"]] = sites
        if n % 200 == 0:
            json.dump(cache, open(SSP_CACHE, "w"))
            print(f"  {n}/{len(todo)} (cumul {len(cache)})", file=sys.stderr)
    json.dump(cache, open(SSP_CACHE, "w"))
    print(f"✓ cache écrit : {SSP_CACHE} ({len(cache)} communes)", file=sys.stderr)
    return cache
```

Brancher dans `main()` après le bloc `--selftest` :

```python
    if args.fetch:
        fetch_all()
        return
```

- [ ] **Step 2 : Selftest de non-régression (les fonctions pures restent OK)**

Run: `.venv-bpe/bin/python scripts/populate-heritage-industriel.py --selftest`
Expected: `✓ selftest OK`.

- [ ] **Step 3 : Smoke-test réseau sur 1 commune (La Rochelle) — vérifier Marcel-Paul**

Run:
```bash
.venv-bpe/bin/python - <<'PY'
import importlib.util, os
spec = importlib.util.spec_from_file_location("h", "scripts/populate-heritage-industriel.py")
h = importlib.util.module_from_spec(spec); spec.loader.exec_module(h)
sites = h.fetch_commune_instructions(46.16, -1.15)  # La Rochelle
print(len(sites), "sites instructions")
for s in sites[:12]:
    print(" ", h.activite_of(s["nom"]), "|", s["nom"], "|", round(h.hav_km(46.16,-1.15,s["lat"],s["lon"]),2),"km")
assert any(h.activite_of(s["nom"]) == "usine_gaz" for s in sites), "Marcel-Paul (usine à gaz) absent !"
print("✓ Marcel-Paul présent")
PY
```
Expected: une dizaine de sites, dont au moins un `usine_gaz` (« Agence EDF / GDF Services »), et `✓ Marcel-Paul présent`. (Si réseau indisponible dans l'environnement : marquer ce step à refaire au gate data, ne pas bloquer.)

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-heritage-industriel.py
git commit -m "feat(heritage): fetch geo par commune (instructions only) + cache/reprise"
```

---

## Task 3 : Calcul par commune + `--matrix` (témoins, sonde 3 vs 5 km)

**Files:**
- Modify: `scripts/populate-heritage-industriel.py`

- [ ] **Step 1 : Ajouter le calcul par commune + témoins + `--matrix`/`--summary`/`--write-index`**

Ajouter avant `main()` :

```python
def commune_heritage(c, sites, rayon_km):
    """{activite, plusieurs, distanceKm} pour une commune, ou None si aucun site dans rayon_km.
    `sites` vient du cache (déjà dans 5 km) ; on re-filtre à rayon_km (sonde)."""
    near = []
    for s in sites:
        d = hav_km(c["lat"], c["lon"], s["lat"], s["lon"])
        if d <= rayon_km:
            near.append((d, s))
    if not near:
        return None
    near.sort(key=lambda x: x[0])
    d, s = near[0]
    return {"activite": activite_of(s["nom"]), "plusieurs": len(near) >= 2,
            "distanceKm": round(d, 2)}

def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]
                if c.get("lat") is not None and c.get("lon") is not None]
    return idx, communes

# Témoins VÉRIFIÉS par nom dans l'index (piège PLM = arrondissements).
TEMOINS = {
    "17300": "La Rochelle (Marcel-Paul, usine à gaz — OBLIGATOIRE non-null)",
    "59350": "Lille (bassin industriel ancien)",
    "57463": "Metz (Lorraine sidérurgique)",
    "69123": "Lyon (vallée de la chimie proche)",
    "48095": "Mende (rural, attendu null)",
    "15014": "Aurillac (rural, attendu null)",
}

def _matrix(communes, cache):
    by = {c["insee"]: c for c in communes}
    print(f"\n{'commune':52} {'3km':>22} {'5km':>22}", file=sys.stderr)
    for ins, lib in TEMOINS.items():
        c = by.get(ins)
        if not c:
            print(f"{lib:52} {'ABSENT (insee?)':>22}", file=sys.stderr); continue
        sites = cache.get(ins, [])
        def fmt(r):
            return "null" if r is None else f"{r['activite']}{'+' if r['plusieurs'] else ''}@{r['distanceKm']}"
        r3 = commune_heritage(c, sites, 3.0)
        r5 = commune_heritage(c, sites, 5.0)
        print(f"{lib:52} {fmt(r3):>22} {fmt(r5):>22}", file=sys.stderr)

def _summary(communes, cache, rayon_km):
    n_nonnull = 0
    cats = {}
    for c in communes:
        r = commune_heritage(c, cache.get(c["insee"], []), rayon_km)
        if r:
            n_nonnull += 1
            cats[r["activite"]] = cats.get(r["activite"], 0) + 1
    print(f"R={rayon_km}km : {n_nonnull}/{len(communes)} communes non-null", file=sys.stderr)
    print("  par catégorie :", dict(sorted(cats.items(), key=lambda x: -x[1])), file=sys.stderr)

def write_index(communes, idx, cache, rayon_km):
    for c in idx["communes"]:
        if c.get("lat") is None or c.get("lon") is None:
            c["heritageIndustriel"] = None
            continue
        c["heritageIndustriel"] = commune_heritage(c, cache.get(c["insee"], []), rayon_km)
    json.dump(idx, open(INDEX, "w"), ensure_ascii=False)
    print(f"✓ index écrit (R={rayon_km}km)", file=sys.stderr)
```

Brancher dans `main()` (après `--fetch`) :

```python
    cache = json.load(open(SSP_CACHE)) if os.path.exists(SSP_CACHE) else {}
    idx, communes = load_communes()
    if args.matrix:
        _matrix(communes, cache); return
    if args.summary:
        _summary(communes, cache, args.rayon); return
    if args.write_index:
        write_index(communes, idx, cache, args.rayon); return
```

- [ ] **Step 2 : Selftest de non-régression**

Run: `.venv-bpe/bin/python scripts/populate-heritage-industriel.py --selftest`
Expected: `✓ selftest OK`.

- [ ] **Step 3 : Commit**

```bash
git add scripts/populate-heritage-industriel.py
git commit -m "feat(heritage): commune_heritage + matrix/summary/write-index (sonde 3 vs 5)"
```

---

## Task 4 : GATE PORTEUR — fetch national + sonde rayon, puis écriture index

> **CHECKPOINT humain.** Ne pas figer le rayon seul.

- [ ] **Step 1 : Fetch national (long, caché, repris)**

Run: `.venv-bpe/bin/python scripts/populate-heritage-industriel.py --fetch`
Expected: progression, `✓ cache écrit` (~34k communes ; relancer si coupé, la reprise saute le cache).

- [ ] **Step 2 : Matrice témoins + volumétrie 3 vs 5 km**

Run:
```bash
.venv-bpe/bin/python scripts/populate-heritage-industriel.py --matrix
.venv-bpe/bin/python scripts/populate-heritage-industriel.py --summary --rayon 3
.venv-bpe/bin/python scripts/populate-heritage-industriel.py --summary --rayon 5
```
Expected/contrôles : La Rochelle non-null `usine_gaz` aux deux rayons ; Mende/Aurillac `null` ; 5 km remonte nettement plus de communes que 3 km (c'est l'enjeu : 3 km plus sobre). **Présenter les deux au porteur, choisir `R_KM`.**

- [ ] **Step 3 : Figer `R_KM` (décision porteur) et écrire l'index**

Si porteur choisit 3 km, `R_KM` est déjà à 3.0. Sinon, éditer `R_KM` dans le script. Puis :
Run: `.venv-bpe/bin/python scripts/populate-heritage-industriel.py --write-index --rayon 3`
Expected: `✓ index écrit (R=3.0km)`.

- [ ] **Step 4 : Commit (script + index ; cache reste gitignoré comme les autres)**

```bash
git add scripts/populate-heritage-industriel.py data/comparateur-index.json
git commit -m "feat(heritage): index national heritageIndustriel (R figé par sonde)"
```

---

## Task 5 : Type d'index TS

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `IndexCommune`, après le champ `expoIndustrielle`)

- [ ] **Step 1 : Ajouter le champ au type `IndexCommune`**

Après le bloc `expoIndustrielle?: {...} | null;` dans `IndexCommune` :

```ts
  // Héritage industriel (cf. scripts/populate-heritage-industriel.py). Signal NARRATIF, NON scoré.
  // Site SSP/ex-BASOL (couche `instructions`) le plus proche du chef-lieu. null = aucun dans le
  // rayon. activite = catégorie grand public (repli "generique"). distanceKm INTERNE (jamais affichée).
  heritageIndustriel?: {
    activite: "usine_gaz" | "raffinerie_hydrocarbures" | "chimie" | "metallurgie" | "decharge" | "generique";
    plusieurs: boolean;
    distanceKm: number;
  } | null;
```

- [ ] **Step 2 : Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: aucune sortie (clean).

- [ ] **Step 3 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(heritage): type index heritageIndustriel"
```

---

## Task 6 : Récit moteur (`heritageRecit`) + champ `MatchResult` + assemblage

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter la table de labels + le helper récit**

Près des autres helpers récit (ex. à côté de `expoIndustrielleRecit`/`calmeSonoreRecit`) :

```ts
// ── Héritage industriel (récit narratif, gaté, hors score) ───────────────────
// Label grand public + genre par catégorie. Le récit reste DOCUMENTAIRE et au passé
// (« ancienne … recensée »), JAMAIS « pollué/risque/toxique » (réservés au rapport). cf. spec §4.
const HERITAGE_LABEL: Record<NonNullable<IndexCommune["heritageIndustriel"]>["activite"], { mot: string; genre: "m" | "f" }> = {
  usine_gaz: { mot: "ancienne usine à gaz", genre: "f" },
  raffinerie_hydrocarbures: { mot: "ancien dépôt d'hydrocarbures", genre: "m" },
  chimie: { mot: "ancien site chimique", genre: "m" },
  metallurgie: { mot: "ancienne fonderie", genre: "f" },
  decharge: { mot: "ancienne décharge", genre: "f" },
  generique: { mot: "ancien site industriel", genre: "m" },
};
function heritageRecit(c: IndexCommune): string | null {
  const h = c.heritageIndustriel;
  if (!h) return null;
  const { mot, genre } = HERITAGE_LABEL[h.activite];
  const art = genre === "f" ? "Une" : "Un";
  const rec = genre === "f" ? "recensée" : "recensé";
  if (h.plusieurs) {
    if (h.activite === "generique") {
      return "Plusieurs anciens sites industriels sont recensés à proximité.";
    }
    return `${art} ${mot}, parmi d'autres anciens sites industriels, est ${rec} à proximité.`;
  }
  return `${art} ${mot} est ${rec} à proximité.`;
}
```

- [ ] **Step 2 : Ajouter le champ à `MatchResult`**

Après `expoIndustrielle: string | null;` dans `MatchResult` :

```ts
  // Héritage industriel (NARRATIF, hors score/tri). Nomme au passé l'ancien site SSP/ex-BASOL le
  // plus proche (« une ancienne usine à gaz est recensée à proximité »), SANS « pollué/risque » ni
  // chiffre (état/substances = rapport). Gaté en synthèse par l'intention héritage exprimée (comme
  // calmeSonore par son critère). null = silence (aucun site instruit assez proche). cf. heritageRecit.
  heritageIndustriel: string | null;
```

- [ ] **Step 3 : Renseigner le champ à l'assemblage**

Dans le `result: {...}` construit dans le `.map` d'assemblage (près de `expoIndustrielle: expoIndustrielleRecit(c),`) :

```ts
        heritageIndustriel: heritageRecit(c),
```

- [ ] **Step 4 : Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(heritage): recit moteur heritageRecit + champ MatchResult"
```

---

## Task 7 : Intention héritage au parse (`heritageIntent`)

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `ParsedProject`)
- Modify: `src/app/api/comparateur-vie/parse/route.ts` (schéma + prompt)

- [ ] **Step 1 : Ajouter `heritageIntent` au type `ParsedProject`**

Après `emploiHorsSujet?: boolean;` dans `ParsedProject` :

```ts
  // Intention « héritage industriel / sols pollués » exprimée par l'utilisateur. Booléen pur
  // (PAS une préférence pesée, PAS un PREFERENCE_KEY). Gate le récit heritageIndustriel en synthèse,
  // comme l'intention littorale gate le récit littoral. cf. parse/route.ts.
  heritageIntent?: boolean;
```

- [ ] **Step 2 : Ajouter le champ au schéma du parse**

Dans `parse/route.ts`, dans l'objet de schéma, après le bloc `emploiHorsSujet` :

```js
    heritageIntent: {
      type: "boolean",
      description:
        "true UNIQUEMENT si l'utilisateur exprime un intérêt pour le passé industriel / la pollution historique des sols (anciens sites industriels, sols pollués, anciennes usines, héritage industriel). Ne JAMAIS créer de préférence ni de critère pour autant.",
    },
```

- [ ] **Step 3 : Ajouter la consigne au prompt**

Dans la chaîne de prompt système (près des consignes HORS-MESURE), ajouter une ligne :

```
- HÉRITAGE INDUSTRIEL : si la demande évoque "sols pollués", "terrain pollué", "ancienne usine", "anciens sites industriels", "passé industriel", "héritage industriel", "pollution historique" → heritageIntent:true. C'est un signal narratif NON scoré : n'ajoutez AUCUNE préférence (ni faible_exposition_industrielle, qui ne couvre QUE l'industrie active).
```

- [ ] **Step 4 : Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5 : Smoke-test parse (réseau LLM requis)**

Run (serveur dev lancé) :
```bash
curl -s localhost:3000/api/comparateur-vie/parse -H 'content-type: application/json' \
  -d '{"text":"un endroit loin des anciens sites industriels et des sols pollués"}' | python3 -c "import sys,json;p=json.load(sys.stdin)['parsed'];print('heritageIntent=',p.get('heritageIntent'),'| prefs=',[x['key'] for x in p['preferences']])"
```
Expected: `heritageIntent= True` et pas de préférence `faible_exposition_industrielle` fabriquée. (Si pas de clé LLM en local : reporter au test bout-en-bout.)

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(heritage): intention heritageIntent au parse (non scoree)"
```

---

## Task 8 : Transmission + gating synthèse (frontière `calme_sonore`)

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1 : Transmettre le récit + l'intention au corps de la synthèse**

Dans `OuVivreClient.tsx`, dans le `results: top.map((r) => ({ ... }))` envoyé à la synthèse (près de `expoIndustrielle: r.expoIndustrielle,`), ajouter :

```tsx
              heritageIndustriel: r.heritageIndustriel, // récit héritage, gaté côté route par heritageIntent
```

Et dans le même corps de requête `synthesize` (à côté de `preferences: p.preferences,`), ajouter :

```tsx
            heritageIntent: p.heritageIntent ?? false,
```

- [ ] **Step 2 : Étendre le type `Body` + gater dans `synthesize/route.ts`**

Dans le type `Body` : ajouter `heritageIntent?: boolean;` et, dans le type inline de `results[]`, ajouter `heritageIndustriel?: string | null`.

Après `const expoIndustrielleDemandee = ...` :

```ts
  // Même frontière pour l'héritage industriel : on ne nomme un ancien site QUE si l'utilisateur
  // a exprimé l'intention (heritageIntent). Pas un critère scoré -> on lit le flag, pas preferences.
  const heritageDemande = body.heritageIntent === true;
```

Dans le `territoires: results.map((r) => ({ ... }))`, après `exposition_industrielle: ...,` :

```ts
      heritage_industriel: heritageDemande ? (r.heritageIndustriel ?? null) : null,
```

- [ ] **Step 3 : Ajouter la consigne de prudence au prompt de synthèse**

Près des consignes sur `exposition_industrielle`, ajouter (le champ `heritage_industriel` n'apparaît que si l'intention a été exprimée) :

```
- heritage_industriel : signal DOCUMENTAIRE au passé (ex. « une ancienne usine à gaz est recensée à proximité »). Reprenez-le tel quel si présent, SANS ajouter « pollué/risque/dangereux », SANS chiffre. Si absent ou nul, n'en parlez pas. Ne le confondez pas avec l'exposition industrielle active.
```

- [ ] **Step 4 : Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 5 : Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx" src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(heritage): transmission + gating synthese (frontiere calme_sonore)"
```

---

## Task 9 : Injection AskFuture comparateur

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx` (builder de contexte ask, ~ligne 454-465)
- Modify: `src/app/api/comparateur-vie/ask/route.ts` (type `Territoire` ~ligne 42 + map ~ligne 237 + prompt)

Le récit héritage est TOUJOURS disponible dans AskFuture (pas de gating par intention, cf. spec §5).

- [ ] **Step 1 : Client — ajouter le champ au contexte `territoires` envoyé à `/ask`**

Dans `OuVivreClient.tsx`, dans `territoires: top.map((r, i) => ({ ... }))` (à côté de `signaux: r.signaux,`) :

```tsx
              heritage_industriel: r.heritageIndustriel ?? null, // récit héritage (narratif, hors-score), firewall préservé
```

- [ ] **Step 2 : Route — étendre le type `Territoire`**

Dans `ask/route.ts`, dans `type Territoire = { ... }` (après `signaux?: Record<string, string>;`) :

```ts
  heritage_industriel?: string | null; // ancien site SSP/ex-BASOL proche (narratif documentaire, hors-score)
```

- [ ] **Step 3 : Route — passer le champ au contexte modèle**

Dans `const territoires = (ctx.territoires ?? []).map((t) => ({ ... }))` (~ligne 237), ajouter :

```ts
    heritage_industriel: t.heritage_industriel ?? null,
```

- [ ] **Step 4 : Route — consigne de prudence au prompt AskFuture**

Près des consignes décrivant les champs par territoire, ajouter :

```
- heritage_industriel : ancien site industriel recensé à proximité, formulé au passé et de façon documentaire. Si l'utilisateur pose la question du passé industriel / des sols pollués, reprenez-le SANS ajouter « pollué/risque/dangereux » ni chiffre, et NE le confondez PAS avec l'exposition industrielle active (ICPE/Seveso). Absent ou nul : n'en parlez pas.
```

- [ ] **Step 5 : Typecheck**

Run: `npx tsc --noEmit -p tsconfig.json`
Expected: clean.

- [ ] **Step 6 : Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx" src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(heritage): injection recit heritage dans AskFuture comparateur"
```

---

## Task 10 : Validation bout-en-bout (témoin Marcel-Paul)

**Files:** aucun (vérification)

- [ ] **Step 1 : Lancer le serveur dev**

Run: `npm run dev` (si pas déjà lancé).

- [ ] **Step 2 : Sonde héritage exprimé près de La Rochelle**

Run:
```bash
.venv-bpe/bin/python - <<'PY'
import json, urllib.request
def post(path, body):
    req = urllib.request.Request("http://localhost:3000"+path, method="POST",
        headers={"content-type":"application/json"}, data=json.dumps(body).encode())
    return json.loads(urllib.request.urlopen(req, timeout=120).read())
parsed = post("/api/comparateur-vie/parse",
    {"text":"vivre du côté de La Rochelle, mais je veux savoir s'il y a un passé industriel ou des sols pollués"})["parsed"]
print("heritageIntent =", parsed.get("heritageIntent"))
out = post("/api/comparateur-vie/match", {"parsed": parsed})
for r in out["results"][:5]:
    print(" ", r["nom"], "| heritage:", r.get("heritageIndustriel"))
PY
```
Expected : `heritageIntent = True` ; au moins une commune de l'agglo rochelaise porte un récit `heritageIndustriel` non nul, du type « Une ancienne usine à gaz … est recensée à proximité. » (ton documentaire, sans « pollué/risque », sans chiffre).

- [ ] **Step 3 : Contrôle négatif (intention NON exprimée → pas dans la synthèse)**

Vérifier qu'un projet SANS mention d'héritage ne fait PAS apparaître `heritage_industriel` dans le payload de synthèse (le champ est gaté ; le récit `MatchResult.heritageIndustriel` peut exister mais n'est pas surfacé). Inspection manuelle du corps envoyé à `synthesize`.

- [ ] **Step 4 : Mettre à jour la roadmap + mémoire**

Marquer le point 8 d'`OU_VIVRE_ROADMAP.md` comme LIVRÉ (branche `feat/heritage-industriel`, non mergé tant que le porteur n'a pas dit « push sur main »). Mettre à jour `idee_sante_environnementale` / `exposition_industrielle` en mémoire (héritage livré comme signal narratif).

- [ ] **Step 5 : Commit final**

```bash
git add OU_VIVRE_ROADMAP.md
git commit -m "docs(heritage): roadmap point 8 livre (signal narratif non score)"
```

---

## Notes d'exécution

- **Pas de jest/pytest** dans le repo : la vérif = `--selftest` Python, `npx tsc --noEmit`, sondes manuelles. Ne pas inventer de harness.
- **Réseau** : si l'environnement d'exécution n'a pas accès à Géorisques / au LLM, les steps réseau (Task 2.3, 4, 7.5, 10) sont des GATES à repasser quand l'accès est là ; ne pas bloquer les tâches de code pur (1, 3, 5, 6, 8, 9 hors fetch).
- **Branche** : tout sur `feat/heritage-industriel` ; merge `--ff-only` sur main seulement sur « push sur main ».
- **Doctrine** : aucun ajout à `PREFERENCE_KEYS` / `subScore` / `AMBIENT_DIMENSIONS` / au tri. Aucun chiffre ni « pollué/risque » dans le gratuit.
