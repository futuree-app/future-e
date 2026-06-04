# Croissance démographique Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `croissance_demographique` (score = croissance démographique totale 2015-2021) avec un narratif « part de nouveaux arrivants » (IRAN), précalculé dans l'index.

**Architecture:** Script offline `scripts/populate-demographie.py` lit la base INSEE « Évolution et structure de la population 2021 » (déjà en cache `data/.cache/insee-evol-pop.zip`) : par commune, `taux_total = (P21_POP/P15_POP)^(1/6)−1` et `part_nouveaux = Σ(IRAN3..7)/P21_POP01P`. Score = percentile national (signé) du taux ; un code narratif `recit` est précalculé (croisement croissance × arrivées). Le moteur TS lit le percentile ; la synthèse mappe `recit` → phrase. Six points de câblage.

**Tech Stack:** Python 3 (`numpy`, venv `.venv-bpe`). Source : INSEE base-cc-evol-struct-pop-2021 (CSV `;`, latin-1, niveau commune). Pas de runner de test (doctrine) : `--selftest` + exécutions réelles + sonde des extrêmes + matrice témoins, puis `tsc`+`lint`+curl.

**Spec :** `docs/superpowers/specs/2026-06-04-croissance-demographique-design.md`

---

## File Structure

- `scripts/populate-demographie.py` (créé) : seul fichier de logique data. Modes `--selftest` / `--summary` / `--probe` / `--matrix` / `--write-index`.
- `src/lib/comparateur-vie.ts` (modifié) : type `demographie`, `PREFERENCE_KEYS`, `subScore`, `REASON_POS`/`REASON_NEG`, `AMBIENT_DIMENSIONS`, et un mapping `recit` → phrase (narratif). Bust `indexCache`.
- `src/lib/comparateur-labels.ts` (modifié) : `PREFERENCE_LABELS`, `PREFERENCE_TOOLTIP`.
- `src/app/api/comparateur-vie/synthesize/route.ts` (modifié) : `PREF_LABELS`.
- `src/app/api/comparateur-vie/parse/route.ts` (modifié) : routage « se développe / qui attire / se vide ».
- `data/comparateur-index.json` (patché via `--write-index`).

---

## Task 1 : Squelette + fonctions pures + selftest

**Files:**
- Create: `scripts/populate-demographie.py`

- [ ] **Step 1 : Squelette (constantes + fonctions pures)**

```python
#!/usr/bin/env python3
"""populate-demographie.py — croissance démographique (score) + nouveaux arrivants (narratif).

Source INSEE « Évolution et structure de la population 2021 » (recensement) :
  taux_total   = (P21_POP / P15_POP)^(1/6) - 1   (annualisé, fenêtre 2015-2021)
  part_nouveaux = (IRAN3+IRAN4+IRAN5+IRAN6+IRAN7) / P21_POP01P  (arrivées d'ailleurs sur 1 an)
Score = percentile national signé du taux. recit = code narratif (croissance × arrivées).
cf. spec 2026-06-04-croissance-demographique.

Venv .venv-bpe. Modes : --selftest --summary --probe --matrix --write-index.
"""
import json, os, sys, csv, io, math, argparse, bisect, zipfile, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE = os.path.join(ROOT, "data", ".cache")
INSEE_ZIP = os.path.join(CACHE, "insee-evol-pop.zip")
INSEE_URL = "https://www.insee.fr/fr/statistiques/fichier/8201904/base-cc-evol-struct-pop-2021_csv.zip"
INSEE_CSV = "base-cc-evol-struct-pop-2021.CSV"
OUT_CACHE = os.path.join(CACHE, "communes-demographie.json")

YEARS = 6  # 2015 -> 2021
# Zone morte autour de 0 pour « stable » (taux annualisé) ; seuil d'arrivée = tercile haut.
STABLE_BAND = 0.0015      # ±0,15 %/an = stable
# Lissage petites communes : taux *= pop/(pop+SHRINK_K). FIGÉ PAR SONDE (Task 3). 0 = désactivé.
SHRINK_K = 0


def growth_rate(p_old, p_new, years=YEARS):
    """Taux de croissance annualisé. None si données invalides."""
    if not p_old or not p_new or p_old <= 0:
        return None
    return (p_new / p_old) ** (1.0 / years) - 1.0


def part_nouveaux(iran_sum, pop01p):
    """Part des arrivants d'ailleurs (0-1). None si pop trop faible."""
    if not pop01p or pop01p <= 0:
        return None
    return iran_sum / pop01p


def effective_rate(taux, pop, k=SHRINK_K):
    """Lissage optionnel vers 0 pour les petites populations (masse critique)."""
    if taux is None:
        return None
    return taux if k <= 0 else taux * (pop or 0) / ((pop or 0) + k)


def percentile_signed(values):
    """Percentile national 1-100 d'une liste de taux SIGNÉS (déclin -> bas). None -> None."""
    valid = sorted(v for v in values if v is not None)
    n = len(valid)
    return [None if v is None else max(1, round(100 * bisect.bisect_right(valid, v) / n)) for v in values]


def recit_code(taux, part, part_hi):
    """Code narratif (croissance × arrivées). part_hi = seuil 'forte arrivée' (tercile haut)."""
    if taux is None:
        return None
    forte = part is not None and part >= part_hi
    if taux > STABLE_BAND:
        return "gagne_attire" if forte else "gagne_sans_renouv"
    if taux < -STABLE_BAND:
        return "perd"
    return "stable_renouv" if forte else "stable"
```

- [ ] **Step 2 : Selftest + main minimal**

```python
def selftest():
    assert growth_rate(100, 100) == 0.0
    assert abs(growth_rate(1000, 1061, 6) - 0.01) < 1e-3   # ~ +1 %/an
    assert growth_rate(0, 100) is None
    assert growth_rate(None, 100) is None
    assert abs(part_nouveaux(50, 1000) - 0.05) < 1e-9
    assert part_nouveaux(5, 0) is None
    assert effective_rate(0.10, 50, 0) == 0.10            # lissage off
    assert effective_rate(0.10, 50, 1000) < 0.01          # petite commune écrasée
    assert percentile_signed([-0.02, 0.0, 0.03]) == [33, 67, 100]
    assert percentile_signed([None, 0.0]) == [None, 100]
    assert recit_code(0.02, 0.10, 0.06) == "gagne_attire"
    assert recit_code(0.02, 0.02, 0.06) == "gagne_sans_renouv"
    assert recit_code(0.0, 0.10, 0.06) == "stable_renouv"
    assert recit_code(-0.02, 0.10, 0.06) == "perd"
    assert recit_code(None, 0.10, 0.06) is None
    print("✓ selftest OK", file=sys.stderr)


def main():
    ap = argparse.ArgumentParser()
    for f in ("selftest", "summary", "probe", "matrix", "write-index"):
        ap.add_argument(f"--{f}", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return


if __name__ == "__main__":
    main()
```

- [ ] **Step 3 : Lancer le selftest**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-demographie.py --selftest`
Expected : `✓ selftest OK`, exit 0.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-demographie.py
git commit -m "feat(demographie): squelette + fonctions pures (taux, part_nouveaux, recit) + selftest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Chargement INSEE + calcul par commune

**Files:**
- Modify: `scripts/populate-demographie.py`

- [ ] **Step 1 : Charger la base INSEE et calculer taux_total + part_nouveaux**

Insérer avant `def selftest():` :

```python
def download(url, dest):
    if not os.path.exists(dest):
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-demographie"})
        with urllib.request.urlopen(req, timeout=300) as r, open(dest, "wb") as f:
            f.write(r.read())
    return dest


def _num(s):
    s = (s or "").strip().replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return None


def load_insee(valid_insee):
    """Retourne dict insee -> (taux_total, part_nouveaux) pour les communes de l'index."""
    download(INSEE_URL, INSEE_ZIP)
    out = {}
    z = zipfile.ZipFile(INSEE_ZIP)
    with z.open(INSEE_CSV) as f:
        rd = csv.DictReader(io.TextIOWrapper(f, encoding="latin-1"), delimiter=";")
        for row in rd:
            ins = (row.get("CODGEO") or "").strip()
            if ins not in valid_insee:
                continue
            p15 = _num(row.get("P15_POP")); p21 = _num(row.get("P21_POP"))
            taux = growth_rate(p15, p21)
            p01p = _num(row.get("P21_POP01P"))
            iran = sum(_num(row.get(f"P21_POP01P_IRAN{k}")) or 0.0 for k in (3, 4, 5, 6, 7))
            out[ins] = (taux, part_nouveaux(iran, p01p))
    print(f"INSEE : {len(out)} communes appariées", file=sys.stderr)
    return out


def load_communes():
    idx = json.load(open(INDEX))
    communes = [c for c in idx["communes"]]
    return idx, communes
```

- [ ] **Step 2 : Brancher `--summary`**

Dans `main()`, après le bloc `--selftest` :

```python
    if args.summary:
        idx, communes = load_communes()
        valid = {c["insee"] for c in communes}
        data = load_insee(valid)
        taux = [data.get(c["insee"], (None, None))[0] for c in communes]
        nonnull = [t for t in taux if t is not None]
        import statistics
        print(f"communes avec taux : {len(nonnull)}/{len(communes)}", file=sys.stderr)
        print(f"taux médian : {statistics.median(nonnull)*100:.2f} %/an | "
              f"min {min(nonnull)*100:.1f} max {max(nonnull)*100:.1f}", file=sys.stderr)
        parts = [data.get(c['insee'],(None,None))[1] for c in communes]
        pv = sorted(p for p in parts if p is not None)
        print(f"part_nouveaux terciles : P33={pv[len(pv)//3]*100:.1f}% P66={pv[2*len(pv)//3]*100:.1f}%", file=sys.stderr)
        return
```

- [ ] **Step 3 : Lancer `--summary`**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-demographie.py --summary`
Expected (stderr) : `communes avec taux : ~34000/34788` ; `taux médian : ~0.2-0.4 %/an` (cohérent INSEE 2015-2021 ≈ +0,3 %/an national) ; bornes min/max (des très petites communes à ±10-20 %/an, attendu, c'est l'objet de la sonde) ; terciles de part_nouveaux (P66 ≈ seuil « forte arrivée », ordre de grandeur quelques %).

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-demographie.py
git commit -m "feat(demographie): chargement base INSEE + taux croissance + part nouveaux arrivants

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Sonde des extrêmes (GATE n°1 — avant tout lissage)

**Files:**
- Modify: `scripts/populate-demographie.py`

- [ ] **Step 1 : Brancher `--probe` (top 50 / bottom 50 du taux brut)**

Dans `main()`, après `--summary` :

```python
    if args.probe:
        idx, communes = load_communes()
        valid = {c["insee"] for c in communes}
        data = load_insee(valid)
        rows = []
        for c in communes:
            taux, part = data.get(c["insee"], (None, None))
            if taux is not None:
                rows.append((taux, c["insee"], c["nom"], c.get("population"), part))
        rows.sort(reverse=True)
        def show(label, rs):
            print(f"\n=== {label} ===", file=sys.stderr)
            for taux, ins, nom, pop, part in rs:
                pn = f"{part*100:.0f}%" if part is not None else "—"
                print(f"  {taux*100:+6.1f}%/an  pop {str(pop):>7}  arrivées {pn:>4}  {nom} ({ins})", file=sys.stderr)
        show("TOP 50 (plus forte croissance brute)", rows[:50])
        show("BOTTOM 50 (plus fort déclin brut)", rows[-50:])
        # combien de petites communes (<500 hab) dans le top 50 ?
        small = sum(1 for r in rows[:50] if (r[3] or 0) < 500)
        print(f"\npetites communes (<500 hab) dans le TOP 50 : {small}/50", file=sys.stderr)
        return
```

- [ ] **Step 2 : Lancer la sonde**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-demographie.py --probe`
Expected : deux listes de 50 communes (top croissance / bottom déclin) avec taux, population, part d'arrivées, + le compte de petites communes dans le top 50.

- [ ] **Step 3 : Présenter au porteur et décider du lissage (GATE)**

Coller la sortie. Test de plausibilité humaine (doctrine porteur) :
- Si le TOP 50 est dominé par des villages < 500 hab / micro-communes atypiques (compte élevé) → **activer le shrinkage** : choisir `SHRINK_K` (ex. 500 / 1000 / 2000) et re-sonder jusqu'à ce que le haut ressemble à des **périphéries attractives réelles**.
- Si le TOP 50 ressemble déjà à des périphéries d'agglo attractives (Rennes/Annecy/Montpellier/Toulouse) → **garder le taux brut** (`SHRINK_K = 0`).
Attendre le choix explicite du porteur avant Task 4.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-demographie.py
git commit -m "feat(demographie): sonde des extremes (top/bottom 50) avant decision de lissage

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Fige le lissage, calcule l'index, matrice témoins (GATE n°2)

**Files:**
- Modify: `scripts/populate-demographie.py`

- [ ] **Step 1 : Fixer `SHRINK_K` à la valeur décidée en Task 3**

Mettre `SHRINK_K` à la valeur validée (0 si le brut suffit ; sinon la valeur sondée). Commentaire actant la décision.

- [ ] **Step 2 : Bloc de calcul complet (cache + matrice + write-index)**

Insérer avant `def selftest():` :

```python
TEMOINS = {
    "34172": "Montpellier (grande ville en croissance)",
    "35210": "Pacé (périphérie rennaise attractive)",
    "18279": "Vierzon (ville en déclin)",
    "75101": "Paris 1er (référence)",
    "73304": "Val-d'Isère (micro-commune touristique)",
    "23096": "Felletin (rural Creuse en déclin)",
}
RECIT_LABEL = {
    "gagne_attire": "gagne des habitants et attire de nouveaux arrivants",
    "gagne_sans_renouv": "gagne des habitants sans fort renouvellement récent",
    "stable_renouv": "population stable, mais renouvellement résidentiel marqué",
    "stable": "population globalement stable",
    "perd": "perd des habitants",
}


def compute(communes, data):
    """Retourne (rec dict insee->{croissance,taux_total,part_nouveaux,recit}, debug list)."""
    parts = [data.get(c["insee"], (None, None))[1] for c in communes]
    pv = sorted(p for p in parts if p is not None)
    part_hi = pv[2 * len(pv) // 3] if pv else 0.0  # tercile haut = « forte arrivée »
    eff = [effective_rate(data.get(c["insee"], (None, None))[0], c.get("population")) for c in communes]
    pcts = percentile_signed(eff)
    rec = {}
    for i, c in enumerate(communes):
        taux, part = data.get(c["insee"], (None, None))
        if pcts[i] is None:
            rec[c["insee"]] = None
        else:
            rec[c["insee"]] = {
                "croissance": pcts[i],
                "taux_total": round(taux * 100, 2),
                "part_nouveaux": round(part * 100, 1) if part is not None else None,
                "recit": recit_code(taux, part, part_hi),
            }
    return rec, part_hi
```

Puis, dans `main()`, après le bloc `--probe` :

```python
    idx, communes = load_communes()
    valid = {c["insee"] for c in communes}
    data = load_insee(valid)
    rec, part_hi = compute(communes, data)
    served = sum(1 for v in rec.values() if v)
    print(f"communes notées : {served}/{len(communes)} | SHRINK_K={SHRINK_K} | seuil arrivée P66={part_hi*100:.1f}%", file=sys.stderr)
    os.makedirs(CACHE, exist_ok=True)
    json.dump(rec, open(OUT_CACHE, "w"))
    print(f"✓ cache écrit : {OUT_CACHE}", file=sys.stderr)

    if args.matrix:
        print(f"\n{'commune':40} {'score':>6} {'taux':>7} {'arriv':>6}  recit", file=sys.stderr)
        for ins, lib in TEMOINS.items():
            r = rec.get(ins)
            if not r:
                print(f"{lib:40} {'ABSENT/null':>6}", file=sys.stderr); continue
            print(f"{lib:40} {r['croissance']:>6} {r['taux_total']:>6}% {str(r['part_nouveaux']):>5}%  {r['recit']}", file=sys.stderr)
        import collections
        dist = collections.Counter(v["recit"] for v in rec.values() if v)
        print(f"\ndistribution recit : {dict(dist)}", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["demographie"] = rec.get(c["insee"])
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (demographie)", file=sys.stderr)
```

- [ ] **Step 3 : Calculer le cache + matrice (SANS write-index)**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-demographie.py --matrix`
Expected (GATE) :
- Montpellier / Pacé : score **haut**, recit `gagne_attire`.
- Vierzon / Felletin : score **bas**, recit `perd`, libellé factuel.
- Paris : score médian/bas (Paris perd des habitants depuis ~2015 — plausible), recit cohérent.
- Val-d'Isère : test bruit (selon lissage retenu en Task 3).
- `distribution recit` : les 5 codes présents, répartition plausible.

Présenter au porteur pour feu vert avant `--write-index`.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-demographie.py
git commit -m "feat(demographie): calcul index complet (lissage fige) + recit narratif + matrice

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : Câblage TS + patch index + vérification

**Files:**
- Modify: `src/lib/comparateur-vie.ts`, `src/lib/comparateur-labels.ts`, `src/app/api/comparateur-vie/synthesize/route.ts`, `src/app/api/comparateur-vie/parse/route.ts`, `data/comparateur-index.json`

- [ ] **Step 1 : Type `demographie` + mapping `recit` (comparateur-vie.ts)**

Après le champ `vieLocale?: { ... } | null;` (chercher `vieLocale?:`), insérer :

```typescript
  // Croissance démographique (cf. scripts/populate-demographie.py, INSEE 2015-2021).
  // croissance = percentile national signé du taux de croissance total. part_nouveaux + recit =
  // narratif « nouveaux arrivants » (IRAN), HORS score. Trajectoire, PAS désirabilité.
  demographie?: {
    croissance: number;
    taux_total: number;
    part_nouveaux: number | null;
    recit: string | null;
  } | null;
```

Puis, près des autres helpers narratifs (par ex. après la définition de `AMBIENT_DIMENSIONS`), ajouter le mapping `recit` → phrase, exporté pour la synthèse :

```typescript
// Narratif « nouveaux arrivants » (HORS score) : phrase descriptive, jamais normative.
export const RECIT_DEMOGRAPHIE: Record<string, string> = {
  gagne_attire: "gagne des habitants et attire de nouveaux arrivants",
  gagne_sans_renouv: "gagne des habitants sans fort renouvellement récent",
  stable_renouv: "population stable, mais renouvellement résidentiel marqué",
  stable: "population globalement stable",
  perd: "perd des habitants",
};
```

- [ ] **Step 2 : Clé `croissance_demographique` (PREFERENCE_KEYS)**

Après la ligne `"vie_locale",` (dernière clé avant `] as const;`), insérer :

```typescript
  // Croissance démographique : trajectoire de population (gagne/perd des habitants), INSEE
  // 2015-2021. Narratif = part de nouveaux arrivants (IRAN). Descriptif, jamais normatif. Opt-in.
  "croissance_demographique",
```

- [ ] **Step 3 : `subScore` (comparateur-vie.ts)**

Après le `case "vie_locale": return c.vieLocale?.score ?? 0;`, insérer avant `default:` :

```typescript
    case "croissance_demographique":
      // trajectoire démographique ; null (donnée absente) -> non noté (opt-in, pas de pénalité).
      return c.demographie?.croissance ?? null;
```

- [ ] **Step 4 : `REASON_POS` + `REASON_NEG` (comparateur-vie.ts)**

Dans `REASON_POS` (après l'entrée `vie_locale: ...`), insérer :

```typescript
  croissance_demographique: "population en croissance",
```

Dans `REASON_NEG` (après l'entrée `vie_locale: ...`), insérer (FACTUEL, jamais « peu dynamique ») :

```typescript
  croissance_demographique: "population en baisse",
```

- [ ] **Step 5 : `AMBIENT_DIMENSIONS` (comparateur-vie.ts)**

Après la ligne `{ id: "vie_locale", key: "vie_locale", ... },` insérer (bandes factuelles) :

```typescript
  { id: "croissance_demographique", key: "croissance_demographique", bands: ["gagne des habitants", "population stable", "perd des habitants"] },
```

- [ ] **Step 6 : `PREFERENCE_LABELS` + `PREFERENCE_TOOLTIP` (comparateur-labels.ts)**

Dans `PREFERENCE_LABELS` (après `vie_locale: ...`), insérer :

```typescript
  croissance_demographique: "Un territoire qui gagne des habitants",
```

Dans `PREFERENCE_TOOLTIP` (après `vie_locale: ...`), insérer :

```typescript
  croissance_demographique: "Évolution récente de la population (gagne ou perd des habitants). Mesure la trajectoire du territoire, pas sa désirabilité.",
```

- [ ] **Step 7 : `PREF_LABELS` de synthèse (synthesize/route.ts)**

Dans `PREF_LABELS` (après `vie_locale: ...`), insérer :

```typescript
  croissance_demographique: "un territoire qui gagne des habitants",
```

- [ ] **Step 8 : Routage du parse (parse/route.ts)**

8a. Après la ligne `- vie_locale : ...`, insérer :

```
- croissance_demographique : trajectoire démographique du territoire (gagne ou perd des habitants, INSEE). Le narratif précise la part de nouveaux arrivants. DISTINCT de vie_locale (vie sociale). Pour « une ville qui se développe », « qui bouge », « qui attire », « ne pas aller dans un endroit qui se vide », « de nouveaux habitants », « un territoire dynamique »
```

8b. Dans la section TRADUCTION AUTOMATIQUE, ajouter :

```
- "se développe", "qui bouge", "qui attire", "ne pas se vider", "de nouveaux habitants", "territoire dynamique", "ville en croissance" → croissance_demographique (poids 2 à 3).
```

- [ ] **Step 9 : Patcher l'index**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-demographie.py --write-index`
Expected : `communes notées : N/34788 ...`, puis `✓ index patché (demographie)`.

- [ ] **Step 10 : Vérification build + lint**

La modif réelle de `comparateur-vie.ts` busте `indexCache`.

Run : `cd "$(git rev-parse --show-toplevel)" && npx tsc --noEmit && npm run lint 2>&1 | grep -iE "croissance_demographique|demographie|comparateur-vie|comparateur-labels|synthesize/route|parse/route" || echo "→ aucune nouvelle erreur sur les fichiers touchés"`
Expected : `tsc` sans erreur (les `Record<PreferenceKey>` `REASON_POS`/`REASON_NEG` imposent la clé). Lint : aucune nouvelle erreur sur les fichiers touchés.

- [ ] **Step 11 : Vérification dev réelle (curl)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match \
  -H "Content-Type: application/json" \
  -d '{"parsed":{"preferences":[{"key":"croissance_demographique","weight":3}],"hardConstraints":{}}}' \
  --max-time 30 | python3 -c "import sys,json;d=json.load(sys.stdin);r=d['results'];print('n=',len(r));[print(' ',x['nom'],x['insee'],x['compatibility'],[s for s in x['reasons'] if 'croissance' in s.lower() or 'population' in s.lower()]) for x in r[:6]]"
```

Expected : 200, communes en forte croissance en tête (périphéries d'agglo attractives), `reasons` « population en croissance ». Vérifier qu'une ville en déclin n'apparaît pas en tête.

- [ ] **Step 12 : Commit**

```bash
git add src/lib/comparateur-vie.ts src/lib/comparateur-labels.ts \
  src/app/api/comparateur-vie/synthesize/route.ts src/app/api/comparateur-vie/parse/route.ts \
  data/comparateur-index.json
git commit -m "feat(demographie): critere croissance_demographique cable + index patche

Score = croissance totale (INSEE 2015-2021), narratif = nouveaux arrivants (IRAN). Opt-in,
descriptif jamais normatif. Warning GH001 large-file = normal.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Ne PAS pousser : attendre le « push sur main » explicite du porteur.)

---

## Self-Review (effectuée à la rédaction)

- **Couverture spec** : score taux total 2015-2021 → Task 1/2 (`growth_rate`) ; narratif IRAN → Task 1/2 (`part_nouveaux`) + Task 4 (`recit`) ; source INSEE confirmée → Task 2 ; percentile signé → Task 1 (`percentile_signed`) ; sonde extrêmes AVANT lissage → Task 3 (GATE) ; lissage sondé → `SHRINK_K` (Task 3→4) ; matrice témoins → Task 4 (GATE) ; vocabulaire non normatif → REASON_NEG « population en baisse », bandes factuelles, tooltip ; 4 formulations narratives → `RECIT_LABEL`/`RECIT_DEMOGRAPHIE` ; câblage 6 points + synthesize/parse → Task 5 ; cas-3 capté → `stable_renouv`.
- **Placeholders** : `SHRINK_K` figé par sonde (Task 3→4), explicite. URL INSEE concrète. URL curl concrète. Aucun « TBD ».
- **Cohérence types/noms** : `growth_rate`, `part_nouveaux`, `effective_rate`, `percentile_signed`, `recit_code`, `compute`, `load_insee`, `demographie.{croissance,taux_total,part_nouveaux,recit}` identiques Task 1→5. `subScore` lit `c.demographie?.croissance ?? null`, cohérent avec Task 4. `RECIT_DEMOGRAPHIE` (TS) ↔ `RECIT_LABEL` (Py) mêmes clés. Clé `croissance_demographique` ajoutée aux deux `Record<PreferenceKey>` (REASON_POS/NEG) — `tsc` l'impose.
