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
LAMBDA = 0.04    # poids du terme « bassin » (concentration). FIGÉ PAR SONDE (gate 2026-06-05) :
#                  à 0.15 Paris-centre (380 ICPE banales, 0 Seveso) sortait aussi exposé que Fos ;
#                  à 0.04 tous les sites Seveso lourds restent sous Paris, l'invariant tient.

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

# ── Acquisition ICPE nationale (Géorisques, pagination, cachée) ────────────────
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

# ── Exposition par commune (grille) ────────────────────────────────────────────
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

# Codes INSEE VÉRIFIÉS par nom dans l'index (Lacq=64300 ; Paris en arrondissement, piège PLM).
TEMOINS = {
    "13039": "Fos-sur-Mer (industrie lourde)",
    "69276": "Feyzin (raffinerie)",
    "64300": "Lacq (bassin chimique)",
    "76305": "Gonfreville-l'Orcher (raffinerie)",
    "44052": "Donges (raffinerie)",
    "75101": "Paris 1er (bcp d'ICPE, 0 Seveso = contrôle)",
    "17300": "La Rochelle (contrôle, Marcel-Paul exclu)",
    "48095": "Mende (rural, attendu ~100)",
}

def _show(communes, results):
    by = {c["insee"]: i for i, c in enumerate(communes)}
    print(f"\n{'commune':38} {'E':>8} {'score':>6} {'dominante':>12}", file=sys.stderr)
    for ins, lib in TEMOINS.items():
        if ins not in by:
            print(f"{lib:38} {'ABSENT':>8}", file=sys.stderr); continue
        r = results[by[ins]]
        print(f"{lib:38} {r['E']:>8} {r['score']:>6} {str(r['sourceDominante']):>12}", file=sys.stderr)

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

    if args.summary:
        import collections
        cls, lat, lon = load_sites(refresh=args.refresh)
        print(f"sites retenus : {len(cls)}", file=sys.stderr)
        print(f"par classe : {dict(collections.Counter(cls))}", file=sys.stderr)
        return

    if args.probe:
        idx, communes = load_communes()
        cls, lat, lon = load_sites(refresh=args.refresh)
        print(f"R_EXPO={R_EXPO} H={H_HALF} LAMBDA={LAMBDA} | poids={WEIGHT}", file=sys.stderr)
        results = compute_all(communes, cls, lat, lon)
        _show(communes, results)
        return

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

    print("calcul : voir --probe / --matrix / --write-index", file=sys.stderr)

if __name__ == "__main__":
    main()
