# Mobilité (dépendance auto + accès transports) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter deux critères opt-in de mobilité au comparateur — `faible_dependance_auto` (part voiture domicile-travail, INSEE MOBPRO) et `acces_transports` (accès ferroviaire pondéré par la desserte, SNCF Open Data) — précalculés, sans pénaliser le rural par défaut.

**Architecture:** Deux champs précalculés dans `comparateur-index.json` : `c.mobilite` (script MOBPRO) et `c.transport` (script SNCF), indépendants. Le moteur `comparateur-vie.ts` ajoute deux clés (subScore = percentiles nationaux) ; `acces_transports` rejoint les signaux ambiants via sa clé subScore. Le parse LLM route les intentions mobilité.

**Tech Stack:** TypeScript (moteur + routes Next.js), Python (venv `.venv-bpe` : pyarrow pour MOBPRO, numpy pour le calcul géo des gares). Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels (port 3000). PAS de runner de test (cf. AGENTS.md).

**Référence spec :** `docs/superpowers/specs/2026-06-03-mobilite-dependance-auto-design.md`

**Pré-requis serveur :** serveur dev sur port 3000 (`npm run dev`). Vérifier : `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`. Index mémoïsé (`indexCache`) ; redémarrer le dev si un témoin renvoie une donnée incohérente après patch de l'index.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** : type `IndexCommune` (+`mobilite`, +`transport`), `PREFERENCE_KEYS` (+2), `subScore` (+2 cas), `REASON_POS`/`REASON_NEG` (+2 chacun), `AMBIENT_DIMENSIONS` (+`transports`).
- **`src/lib/comparateur-labels.ts`** : `PREFERENCE_LABELS` (+2), `PREFERENCE_INTERPRETATIONS` (+2).
- **`src/app/api/comparateur-vie/parse/route.ts`** : descriptions de clés + règles de routage.
- **`scripts/populate-mobilite.py`** (créer) : MOBPRO → `c.mobilite`.
- **`scripts/populate-transports.py`** (créer) : gares SNCF → `c.transport`.
- **`.gitignore`** : ignorer `data/rp-mobpro-2022.parquet`.

---

## Task 1 : moteur — clés, subScore, reasons, champs index, signal ambiant

`REASON_POS`/`REASON_NEG` sont exhaustifs (`Record<PreferenceKey>`) : tout dans un seul commit.

**Files:** Modify `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter `mobilite` et `transport` au type `IndexCommune`**

Juste après le champ `inondation?: { catnat: number; tri: boolean; risque: number } | null;`, ajouter :

```ts
  // Mobilité domicile-travail (cf. scripts/populate-mobilite.py, RP MOBPRO 2022). part_voiture
  // brut 0..1 (rapport futur) ; dependance = percentile national (haut = dépend de la voiture).
  mobilite?: {
    part_voiture: number;
    dependance: number;
  } | null;
  // Accès ferroviaire (cf. scripts/populate-transports.py, gares SNCF + fréquentation).
  // desserte = percentile national de l'accès pondéré (haut = bien reliée par le train).
  transport?: {
    desserte: number;
    gare_nom: string | null;
    gare_km: number | null;
  } | null;
```

- [ ] **Step 2 : Ajouter les deux clés à `PREFERENCE_KEYS`**

Remplacer :
```ts
  "faible_risque_inondation",
] as const;
```
par :
```ts
  "faible_risque_inondation",
  // Mobilité. faible_dependance_auto = part voiture domicile-travail (MOBPRO) ; acces_transports
  // = accès ferroviaire pondéré desserte (gares SNCF). Opt-in, graduées. cf. populate-mobilite/transports.
  "faible_dependance_auto",
  "acces_transports",
] as const;
```

- [ ] **Step 3 : Ajouter les deux cas à `subScore`**

Juste après le cas `faible_risque_inondation` (`return c.inondation == null ? null : 100 - c.inondation.risque;`), ajouter :

```ts
    case "faible_dependance_auto":
      // part voiture domicile-travail faible -> score haut. Usage contraint, pas la possession.
      return c.mobilite == null ? null : 100 - c.mobilite.dependance;
    case "acces_transports":
      // desserte ferroviaire accessible (gares SNCF pondérées par fréquentation).
      return c.transport?.desserte ?? null;
```

- [ ] **Step 4 : Compléter `REASON_POS`** (après `faible_risque_inondation: "peu d'arrêtés CatNat inondation",`)

```ts
  faible_dependance_auto: "peu dépendante de la voiture au quotidien",
  acces_transports: "bien reliée par le train",
```

- [ ] **Step 5 : Compléter `REASON_NEG`** (après `faible_risque_inondation: "historique CatNat inondation plus marqué",`)

```ts
  faible_dependance_auto: "territoire où la voiture reste quasi indispensable",
  acces_transports: "desserte ferroviaire limitée",
```

- [ ] **Step 6 : Ajouter `transports` aux signaux ambiants** (dans `AMBIENT_DIMENSIONS`, après l'entrée `air`)

```ts
  { id: "transports", key: "acces_transports", bands: ["bien reliée par le train", "desserte ferroviaire intermédiaire", "peu reliée par le train"] },
```

- [ ] **Step 7 : Vérifier tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint sur `comparateur-vie.ts`. (Les deux critères renvoient `null` tant que l'index n'a pas les champs : aucun crash.)

- [ ] **Step 8 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): cles mobilite (dependance auto + acces transports ferroviaire) + signal ambiant

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : libellés + gloses

**Files:** Modify `src/lib/comparateur-labels.ts`

- [ ] **Step 1 : `PREFERENCE_LABELS`** (après `faible_risque_inondation: "un faible risque d'inondation",`)

```ts
  faible_dependance_auto: "une faible dépendance à la voiture",
  acces_transports: "l'accès au train et aux gares",
```

- [ ] **Step 2 : `PREFERENCE_INTERPRETATIONS`** (après `faible_risque_inondation: "historique d'arrêtés CatNat inondation et territoires à risque important, pas une garantie d'absence de crue",`)

```ts
  faible_dependance_auto: "part des trajets domicile-travail faits en voiture, pas la qualité du réseau routier",
  acces_transports: "desserte ferroviaire accessible alentour (présence et fréquentation des gares), pas le détail des horaires",
```

- [ ] **Step 3 : tsc** — Run: `npx tsc --noEmit` — Expected: aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): libelles + gloses mobilite (dependance auto, acces train)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : parse — router les intentions mobilité

**Files:** Modify `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Descriptions de clés** (après la ligne décrivant `acces_culture`)

```
- faible_dependance_auto : pouvoir vivre en conduisant moins (part des trajets domicile-travail faits en voiture, percentile national). Pour « sans voiture », « moins conduire », « ne pas dépendre de la voiture », « tout à pied », « ne pas être coincé sans voiture »
- acces_transports : accès au train et aux gares (desserte ferroviaire pondérée par la fréquentation). Pour « une gare », « le train », « TER », « TGV », « rejoindre une métropole », « transports en commun », « bien desservi », « aller en ville sans voiture »
```

- [ ] **Step 2 : Règles de routage** (dans « TRADUCTION AUTOMATIQUE », après la ligne `full remote → emploiHorsSujet:true`)

```
- "sans voiture", "se passer de la voiture", "moins conduire", "ne pas dépendre de la voiture", "tout à pied", "se garer c'est l'enfer" → faible_dependance_auto (poids 2 à 3).
- "une gare", "le train", "TER", "TGV", "rejoindre une métropole", "transports en commun", "bien desservi", "aller en ville sans voiture" → acces_transports (poids 2 à 3).
- Mobilité : faible_dependance_auto (se passer de la voiture) et acces_transports (offre ferroviaire) sont DISTINCTS et peuvent coexister. N'en déduisez aucun par défaut d'un projet rural ou familial.
```

- [ ] **Step 3 : tsc** — Run: `npx tsc --noEmit` — Expected: aucune erreur (enum tiré de `PREFERENCE_KEYS`).

- [ ] **Step 4 : Témoin curl**

```bash
for q in "je veux pouvoir vivre sans voiture" "je veux une gare et le TGV" "sans voiture mais avec une gare"; do
  echo "Q: $q"
  curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' -d "{\"text\":\"$q\"}" \
   | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ->', [p['key'] for p in d.get('parsed',d).get('preferences',[])])"
done
```
Expected : « sans voiture » → `faible_dependance_auto` ; « gare et TGV » → `acces_transports` ; « sans voiture mais avec une gare » → les deux.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse route les intentions mobilite (sans voiture / gare-train)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : script MOBPRO → `c.mobilite`

**Files:** Create `scripts/populate-mobilite.py` ; Modify `.gitignore`, `data/comparateur-index.json`

- [ ] **Step 1 : Télécharger le parquet RP MOBPRO 2022**

```bash
# Page : https://www.insee.fr/fr/statistiques/8589904 — copier le lien "France hors Mayotte" (Parquet).
curl -L -o data/rp-mobpro-2022.parquet "<URL>"
# Si .zip : dézipper et renommer le .parquet en data/rp-mobpro-2022.parquet
ls -lh data/rp-mobpro-2022.parquet
```
Expected : fichier présent (plusieurs centaines de Mo).

- [ ] **Step 2 : Vérifier les colonnes**

```bash
.venv-bpe/bin/python -c "
import pyarrow.parquet as pq
pf = pq.ParquetFile('data/rp-mobpro-2022.parquet')
print('colonnes:', pf.schema_arrow.names)
b = next(pf.iter_batches(batch_size=5)).to_pydict()
for k in ('COMMUNE','TRANS','IPONDI'): print(k, '->', b.get(k))
"
```
Expected : `COMMUNE`, `TRANS` (valeurs '1'..'6'), `IPONDI` présents. Si un nom diffère, adapter le script (Step 3).

- [ ] **Step 3 : Créer `scripts/populate-mobilite.py`**

```python
#!/usr/bin/env python3
"""populate-mobilite.py — dépendance auto (RP MOBPRO 2022).

Agrège la part voiture domicile-travail par COMMUNE de résidence, pondérée IPONDI :
  part_voiture = IPONDI[TRANS==5] / IPONDI_total
Seuil MIN_TOTAL ; en deçà -> null. Percentile national -> c.mobilite. Venv .venv-bpe (pyarrow).

Usage :
    .venv-bpe/bin/python scripts/populate-mobilite.py                # agrège + résumé
    .venv-bpe/bin/python scripts/populate-mobilite.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
PARQUET = os.path.join(ROOT, "data", "rp-mobpro-2022.parquet")
MIN_TOTAL = 50.0


def aggregate():
    agg = {}  # insee -> [total, voiture]
    pf = pq.ParquetFile(PARQUET)
    for batch in pf.iter_batches(columns=["COMMUNE", "TRANS", "IPONDI"], batch_size=200_000):
        d = batch.to_pydict()
        for c, t, w in zip(d["COMMUNE"], d["TRANS"], d["IPONDI"]):
            if c is None or w is None:
                continue
            w = float(w)
            a = agg.get(c)
            if a is None:
                a = agg[c] = [0.0, 0.0]
            a[0] += w
            if str(t) == "5":
                a[1] += w
    return agg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    agg = aggregate()
    parts = {insee: v / tot for insee, (tot, v) in agg.items() if tot >= MIN_TOTAL}
    print(f"communes agrégées : {len(agg)} | fiables (>= {MIN_TOTAL:.0f}) : {len(parts)}", file=sys.stderr)

    pv_sorted = sorted(parts.values())
    n = len(parts)

    def pct(x):
        return round(100 * bisect.bisect_right(pv_sorted, x) / n) if n else 0

    preview = sorted(parts.items(), key=lambda kv: kv[1])[:5]
    print("moins dépendantes (part voiture la plus basse) :", file=sys.stderr)
    for insee, pv in preview:
        print(f"  {insee}  voiture={pv:.0%}", file=sys.stderr)

    if args.write_index:
        idx = json.load(open(INDEX))
        hit = 0
        for c in idx["communes"]:
            pv = parts.get(c["insee"])
            if pv is None:
                c["mobilite"] = None
            else:
                c["mobilite"] = {"part_voiture": round(pv, 4), "dependance": pct(pv)}
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(idx['communes'])} communes avec mobilité", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4 : Ignorer le parquet**

```bash
grep -q "rp-mobpro" .gitignore || printf '\n# RP MOBPRO (volumineux, non versionné)\ndata/rp-mobpro-2022.parquet\n' >> .gitignore
grep "rp-mobpro" .gitignore
```
Expected : la ligne apparaît.

- [ ] **Step 5 : Agréger (sans écrire) et contrôler**

Run: `.venv-bpe/bin/python scripts/populate-mobilite.py`
Expected : l'aperçu « moins dépendantes » liste des arrondissements parisiens / grandes villes (part voiture basse). Si tout est à 0 ou 1, revérifier `TRANS` (Step 2) avant d'écrire.

- [ ] **Step 6 : Patcher l'index + témoins data**

```bash
.venv-bpe/bin/python scripts/populate-mobilite.py --write-index
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
by={c['insee']:c for c in idx['communes']}
for insee,nom in [('75101','Paris 1er'),('69381','Lyon 1er'),('13201','Marseille 1er')]:
    print(nom, insee, '->', (by.get(insee) or {}).get('mobilite'))
rural=[c for c in idx['communes'] if (c.get('mobilite') or {}).get('dependance',0)>=98][:3]
print('forte dépendance:', [(c['nom'],c['mobilite']['part_voiture']) for c in rural])
print('null:', sum(1 for c in idx['communes'] if c.get('mobilite') is None), '/', len(idx['communes']))
"
```
Expected : arrondissements parisiens/lyonnais → `dependance` basse ; communes rurales → `dependance` ~100 ; nombre limité de `null`.

- [ ] **Step 7 : Témoin curl /match (dépendance auto)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"faible_dependance_auto","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
```
Expected : grandes villes en tête, reason « peu dépendante de la voiture au quotidien ».

- [ ] **Step 8 : Commit**

```bash
git add scripts/populate-mobilite.py .gitignore data/comparateur-index.json
git commit -m "feat(data): dependance auto (RP MOBPRO 2022) dans l'index + populate-mobilite

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : script SNCF → `c.transport` (accès ferroviaire pondéré)

**Files:** Create `scripts/populate-transports.py` ; Modify `data/comparateur-index.json`

- [ ] **Step 1 : Créer `scripts/populate-transports.py`**

```python
#!/usr/bin/env python3
"""populate-transports.py — accès ferroviaire pondéré par la desserte (SNCF Open Data).

Pour chaque commune (lat/lon de l'index), accès = max sur gares à <100 km de
  voyageurs_g / (1 + (d/20)^2)
voyageurs_g = total_voyageurs_2024 (jointure UIC) ou proxy de segment DRG (fallback).
Percentile national -> c.transport. Venv .venv-bpe (numpy).

Usage :
    .venv-bpe/bin/python scripts/populate-transports.py                # résumé
    .venv-bpe/bin/python scripts/populate-transports.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect, urllib.request
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
GARES_URL = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/gares-de-voyageurs/exports/json"
FREQ_URL = "https://ressources.data.sncf.com/api/explore/v2.1/catalog/datasets/frequentation-gares/exports/json"
SEG_PROXY = {"A": 5_000_000.0, "B": 500_000.0, "C": 50_000.0}
CUTOFF_KM = 100.0
TAU_KM = 20.0
R_KM = 6371.0


def fetch_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-transports"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode("utf-8"))


def load_gares():
    gares = fetch_json(GARES_URL)
    freq = fetch_json(FREQ_URL)
    freq_by_uic = {}
    for f in freq:
        uic = str(f.get("code_uic_complet") or "").strip()
        v = f.get("total_voyageurs_2024")
        if uic and v is not None:
            freq_by_uic[uic] = float(v)
    lats, lons, voys, noms = [], [], [], []
    for g in gares:
        pos = g.get("position_geographique")
        if not pos:
            continue
        uic = str(g.get("codes_uic") or "").split(";")[0].strip()
        seg = (g.get("segment_drg") or "C").strip().upper()
        v = freq_by_uic.get(uic, SEG_PROXY.get(seg, SEG_PROXY["C"]))
        lats.append(float(pos[0])); lons.append(float(pos[1])); voys.append(v); noms.append(g.get("nom"))
    print(f"gares chargées : {len(lats)} | fréquentations jointes : {len(freq_by_uic)}", file=sys.stderr)
    return (np.radians(np.array(lats)), np.radians(np.array(lons)), np.array(voys), noms)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    glat, glon, gvoy, gnoms = load_gares()
    idx = json.load(open(INDEX))
    communes = idx["communes"]

    raws = []      # acces_raw aligné sur communes (None si lat/lon absents)
    best = []      # (nom, km) de la meilleure gare, ou (None, None)
    for c in communes:
        lat, lon = c.get("lat"), c.get("lon")
        if lat is None or lon is None:
            raws.append(None); best.append((None, None)); continue
        rlat = np.radians(lat); rlon = np.radians(lon)
        dlat = glat - rlat; dlon = glon - rlon
        a = np.sin(dlat / 2) ** 2 + np.cos(rlat) * np.cos(glat) * np.sin(dlon / 2) ** 2
        d = 2 * R_KM * np.arcsin(np.sqrt(a))  # km
        mask = d <= CUTOFF_KM
        if not mask.any():
            raws.append(0.0); best.append((None, None)); continue
        atten = gvoy[mask] / (1 + (d[mask] / TAU_KM) ** 2)
        j = int(np.argmax(atten))
        idx_global = np.nonzero(mask)[0][j]
        raws.append(float(atten[j]))
        best.append((gnoms[idx_global], round(float(d[idx_global]), 1)))

    finite = sorted(r for r in raws if r is not None)
    n = len(finite)
    def pct(x):
        return round(100 * bisect.bisect_right(finite, x) / n) if n else 0

    # aperçu : 5 communes les mieux desservies
    order = sorted((i for i, r in enumerate(raws) if r is not None), key=lambda i: raws[i], reverse=True)[:5]
    print("mieux desservies :", file=sys.stderr)
    for i in order:
        print(f"  {communes[i]['nom']} -> gare {best[i][0]} ({best[i][1]} km), desserte {pct(raws[i])}", file=sys.stderr)

    if args.write_index:
        hit = 0
        for c, r, (gn, gk) in zip(communes, raws, best):
            if r is None:
                c["transport"] = None
            else:
                c["transport"] = {"desserte": pct(r), "gare_nom": gn, "gare_km": gk}
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(communes)} communes avec transport", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Lancer (sans écrire) et contrôler la jointure + l'aperçu**

Run: `.venv-bpe/bin/python scripts/populate-transports.py`
Expected : « gares chargées : ~3000 | fréquentations jointes : ~3000 » (si « jointes » ≈ 0, la clé UIC ne matche pas → le fallback segment s'applique mais c'est dégradé : inspecter `codes_uic` vs `code_uic_complet` et ajuster, ex. comparer sur 8 chiffres). L'aperçu « mieux desservies » liste de grandes villes (Lyon, Lille, Paris, Bordeaux) avec une gare majeure plausible.

- [ ] **Step 3 : Patcher l'index + témoins data**

```bash
.venv-bpe/bin/python scripts/populate-transports.py --write-index
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
by={c['insee']:c for c in idx['communes']}
for insee,nom in [('69381','Lyon 1er'),('37261','Tours'),('59350','Lille'),('05061','Embrun')]:
    print(nom, insee, '->', (by.get(insee) or {}).get('transport'))
hi=[c for c in idx['communes'] if (c.get('transport') or {}).get('desserte',0)>=99][:3]
print('mieux desservies:', [c['nom'] for c in hi])
lo=[c for c in idx['communes'] if (c.get('transport') or {}).get('desserte',100)<=2][:3]
print('moins desservies:', [c['nom'] for c in lo])
print('null:', sum(1 for c in idx['communes'] if c.get('transport') is None), '/', len(idx['communes']))
"
```
Expected : grandes villes à gare TGV → `desserte` haute, `gare_nom` plausible ; communes de montagne isolées → `desserte` basse ; très peu de `null` (seulement communes sans lat/lon).

- [ ] **Step 4 : Témoin curl /match (accès transports) + rural non pénalisé**

```bash
echo "=== acces_transports ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"acces_transports","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
echo "=== neutre (nature) : pas de reason mobilité ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"nature","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); bad=[c['nom'] for c in d.get('results',[]) if any('train' in r or 'voiture' in r or 'desserte' in r for r in c.get('reasons',[]))]; print('  reasons mobilité hors critère (attendu 0):', len(bad), bad)"
```
Expected : `acces_transports` → villes à gare majeure en tête avec « bien reliée par le train » ; recherche `nature` → 0 reason mobilité (rural non pénalisé).

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-transports.py data/comparateur-index.json
git commit -m "feat(data): acces transports ferroviaire (gares SNCF) dans l'index + populate-transports

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6 : vérification finale + intégration

**Files:** aucun

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -E "comparateur-vie\.ts|comparateur-labels\.ts|parse/route\.ts" && echo "(erreurs ci-dessus)" || echo "aucune erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune nouvelle erreur lint sur les fichiers touchés.

- [ ] **Step 2 : Témoin /ask « et côté transports ? » (signal ambiant)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et côté transports ?","context":{"territoires":[
   {"rang":1,"nom":"Lyon","region":"Auvergne-Rhône-Alpes","raisons":["dynamisme"],"compromis":null,"signaux":{"transports":"bien reliée par le train"}},
   {"rang":2,"nom":"Embrun","region":"Provence-Alpes-Côte d'\''Azur","raisons":["nature"],"compromis":null,"signaux":{"transports":"peu reliée par le train"}}
 ]}}' \
 | python3 -c "import sys,json,re; a=json.load(sys.stdin).get('answer',''); print('answer:', a); print('contient un chiffre:', bool(re.search(r'[0-9]', a)))"
```
Expected : réponse qualitative comparative (Lyon mieux relié qu'Embrun), zéro chiffre, ton constat.

- [ ] **Step 3 : État git** — Run: `git status --short` — Expected: aucun fichier source non committé (le parquet reste ignoré).

- [ ] **Step 4 : finishing-a-development-branch** — Invoquer `superpowers:finishing-a-development-branch`. Ne pas merger sur `main` sans le « push sur main » explicite du porteur.

---

## Self-review (auteur du plan)

- **Couverture spec :** sources A/B → Tasks 4 Step 1-2 + 5 Step 1-2. métriques dependance/desserte → scripts (Tasks 4/5). champs `mobilite`/`transport` → Task 1 Step 1 + scripts. moteur (2 clés, subScore, reasons, labels, gloses) → Tasks 1-2. signal ambiant transports → Task 1 Step 6. parse → Task 3. densité exclue → scripts ne l'utilisent pas. vérif → Tasks 3/4/5/6.
- **Placeholders :** URL parquet à copier (Task 4 Step 1) et clé de jointure UIC à valider (Task 5 Step 2) sont des contrôles explicites, pas des placeholders de logique. Tout le code est complet.
- **Cohérence des types :** `c.mobilite { part_voiture, dependance }` et `c.transport { desserte, gare_nom, gare_km }` identiques entre type `IndexCommune` (Task 1), scripts (Tasks 4/5) et `subScore` (`c.mobilite.dependance`, `c.transport.desserte`). Clés `faible_dependance_auto`/`acces_transports` cohérentes dans `PREFERENCE_KEYS`, `subScore`, `REASON_POS/NEG`, `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, `AMBIENT_DIMENSIONS`, parse.
