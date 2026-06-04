# Rayon BPE adaptatif Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le rayon d'accès BPE fixe de 15 km par un rayon adaptatif à quatre classes de bassin de vie (5 / 10 / 15 / 25 km), pour les critères `ecoles`, `culture`, `etudes_acces`.

**Architecture:** Tout le changement vit dans `scripts/populate-bpe.py` (offline, hors runtime). On dérive par commune un rayon depuis `tailleVille` (pop d'UU, sinon pop communale), on compte les équipements BPE dans ce rayon adaptatif, puis on normalise en percentile national unique (inchangé). Le moteur TS continue de lire un simple percentile : zéro impact runtime. On corrige aussi le voisinage de la grille spatiale (±1 → ±2 cellules) pour que 25 km soit couvert partout, et on met à jour les gloses « 15 km » devenues fausses.

**Tech Stack:** Python 3 (`numpy`, `pyarrow`, venv `.venv-bpe`), source `data/bpe24.parquet`, index `data/comparateur-index.json`. Pas de runner de test (doctrine projet) : vérification = `--selftest` à assertions, exécution réelle du script, comparaison témoin, puis `tsc` + `lint` + curl sur le dev.

**Spec :** `docs/superpowers/specs/2026-06-04-rayon-bpe-adaptatif-design.md`

---

## File Structure

- `scripts/populate-bpe.py` (modifié) : ajoute `radius_for`, `build_uupop`, `taille_ville`, un mode `--selftest`, branche un tableau de rayons dans `count_within_radius`, élargit le voisinage grille. Seul fichier de logique modifié.
- `src/lib/comparateur-vie.ts` (modifié) : gloses commentaires BPE « ~15 km » → « rayon adapté au territoire » (lignes 288, 631, 633 UNIQUEMENT — NE PAS toucher les commentaires `nature` lignes 263/265/628 qui restent à 15 km). Sert aussi à invalider `indexCache` après `--write-index`.
- `data/.cache/communes-bpe.json` (régénéré) et `data/comparateur-index.json` (patché) : artefacts de données, pas du code.

---

## Task 1 : Logique de rayon adaptatif + selftest

Ajoute les fonctions pures (table de classes, reconstruction pop d'UU) et un mode `--selftest` qui les vérifie par assertions. Aucune intégration au comptage encore : cette tâche est isolée et vérifiable seule.

**Files:**
- Modify: `scripts/populate-bpe.py` (constante `RAYON_KM` ligne 25 ; bloc fonctions après `haversine_np` ; `argparse` dans `main` lignes 96-99)

- [ ] **Step 1 : Remplacer la constante `RAYON_KM` par la doc de la table**

Dans `scripts/populate-bpe.py`, remplacer la ligne 25 :

```python
RAYON_KM = 15
```

par :

```python
# Rayon d'accès ADAPTATIF au type de territoire (cf. spec 2026-06-04-rayon-bpe-adaptatif).
# Le rayon suit la mobilité acceptée par les habitants, PAS la taxonomie des cartes.
# tailleVille (pop d'UU, sinon pop communale)  ->  rayon
#   >= 500 000 (vraie métropole)        5 km
#   100 000 - 500 000 (grande ville)   10 km
#   30 000 - 100 000 (ville moyenne)   15 km
#   < 30 000 ou null (rural / isolé)   25 km
# 25 km en rural assume la doctrine « ne jamais pénaliser le rural par défaut » : même
# à 25 km, une métropole reste devant en nombre d'équipements (comparabilité conservée).
RADIUS_TABLE = ((500_000, 5.0), (100_000, 10.0), (30_000, 15.0))
RADIUS_RURAL = 25.0
```

- [ ] **Step 2 : Ajouter les fonctions pures après `haversine_np`**

Insérer, juste après la fonction `haversine_np` (vers la ligne 56, avant `load_equip_points`) :

```python
def radius_for(taille):
    """Rayon d'accès en km selon tailleVille. None -> rural (25 km)."""
    if taille is None:
        return RADIUS_RURAL
    for seuil, r in RADIUS_TABLE:
        if taille >= seuil:
            return r
    return RADIUS_RURAL


def build_uupop(idx_communes):
    """Somme des populations communales par code UU (réplique uuPopCache côté TS).
    Itère sur TOUTES les communes de l'index (y compris non géolocalisées) : une UU
    pèse par sa population totale, pas seulement ses communes géolocalisées."""
    uupop = {}
    for c in idx_communes:
        uu = c.get("uu")
        pop = c.get("population")
        if uu and pop is not None:
            uupop[uu] = uupop.get(uu, 0) + pop
    return uupop


def taille_ville(c, uupop):
    """Pop d'UU si la commune appartient à une UU connue, sinon sa pop communale
    (une commune hors UU est son propre bassin). Réplique tailleVille() côté TS."""
    uu = c.get("uu")
    if uu and uu in uupop:
        return uupop[uu]
    return c.get("population")
```

- [ ] **Step 3 : Ajouter le mode `--selftest`**

Insérer cette fonction juste avant `def main():` :

```python
def selftest():
    # Bornes exactes de la table de rayons.
    assert radius_for(None) == 25.0
    assert radius_for(0) == 25.0
    assert radius_for(29_999) == 25.0
    assert radius_for(30_000) == 15.0
    assert radius_for(99_999) == 15.0
    assert radius_for(100_000) == 10.0
    assert radius_for(499_999) == 10.0
    assert radius_for(500_000) == 5.0
    assert radius_for(12_000_000) == 5.0
    # Reconstruction pop d'UU : somme par code, ignore pop null, ignore uu null.
    up = build_uupop([
        {"uu": "00851", "population": 100},
        {"uu": "00851", "population": 50},
        {"uu": None, "population": 800},
        {"uu": "00851", "population": None},
    ])
    assert up == {"00851": 150}, up
    # tailleVille : UU connue -> pop d'UU ; hors UU -> pop communale ; UU inconnue -> pop communale.
    assert taille_ville({"uu": "00851", "population": 100}, up) == 150
    assert taille_ville({"uu": None, "population": 800}, up) == 800
    assert taille_ville({"uu": "99999", "population": 700}, up) == 700
    print("✓ selftest OK", file=sys.stderr)
```

Puis, dans `main()`, après `args = ap.parse_args()` (ligne ~99), brancher le flag en TÊTE et l'option argparse. Remplacer :

```python
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()
```

par :

```python
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()

    if args.selftest:
        selftest()
        return
```

- [ ] **Step 4 : Lancer le selftest, vérifier qu'il passe**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-bpe.py --selftest`
Expected : `✓ selftest OK` sur stderr, exit 0. (Si `.venv-bpe` n'existe pas, utiliser `python3` avec numpy/pyarrow disponibles ; le selftest n'utilise ni numpy ni pyarrow, donc `python3 scripts/populate-bpe.py --selftest` suffit même sans le venv.)

- [ ] **Step 5 : Commit**

```bash
git add scripts/populate-bpe.py
git commit -m "feat(bpe): table de rayon adaptatif par classe de bassin de vie + selftest

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Comptage à rayon adaptatif + fix grille

Branche un rayon PAR commune dans `count_within_radius` et élargit le voisinage de la grille à ±2 cellules pour couvrir 25 km partout. Régénère le cache (sans patcher l'index) pour inspection.

**Files:**
- Modify: `scripts/populate-bpe.py` (`count_within_radius` lignes 68-86 ; corps de `main` lignes 101-115)

- [ ] **Step 1 : Réécrire `count_within_radius` (rayon par commune + voisinage ±2)**

Remplacer toute la fonction `count_within_radius` (lignes 68-86) par :

```python
# Voisinage grille : ±2 cellules (±0.36° avec CELL=0.18) couvre 25 km partout, y compris
# en longitude vers Dunkerque (~51°N, 25 km ≈ 0.357°) et dans les DOM. cf. spec.
NEI = 2


def count_within_radius(clat, clon, elat, elon, radius):
    """Pour chaque commune i, compte les équipements dans radius[i] km (rayon adaptatif).
    Grille spatiale sur les équipements pour éviter le O(n*m)."""
    grid = {}
    for j in range(len(elat)):
        grid.setdefault((int(elat[j] // CELL), int(elon[j] // CELL)), []).append(j)
    out = np.zeros(len(clat), dtype=np.int64)
    for i in range(len(clat)):
        ci, cj = int(clat[i] // CELL), int(clon[i] // CELL)
        idxs = []
        for di in range(-NEI, NEI + 1):
            for dj in range(-NEI, NEI + 1):
                idxs += grid.get((ci + di, cj + dj), [])
        if not idxs:
            continue
        idxs = np.array(idxs)
        d = haversine_np(clat[i], clon[i], elat[idxs], elon[idxs])
        out[i] = int((d <= radius[i]).sum())
    return out
```

- [ ] **Step 2 : Construire le tableau de rayons dans `main` et le passer au comptage**

Dans `main()`, après le bloc qui construit `clat`/`clon` (juste après la ligne `print(f"communes géolocalisées ...")`, ligne ~106), insérer :

```python
    uupop = build_uupop(idx["communes"])
    radius = np.array([radius_for(taille_ville(c, uupop)) for c in communes], dtype="float64")
    # Distribution des classes de rayon, pour contrôle visuel.
    import collections as _c
    dist = _c.Counter(radius.tolist())
    print("rayons (km -> communes) : "
          + ", ".join(f"{int(k)}:{v}" for k, v in sorted(dist.items())), file=sys.stderr)
```

Puis remplacer, dans la boucle des champs, l'appel :

```python
        counts = count_within_radius(clat, clon, elat, elon)
```

par :

```python
        counts = count_within_radius(clat, clon, elat, elon, radius)
```

- [ ] **Step 3 : Régénérer le cache (SANS `--write-index`) et lire la distribution**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-bpe.py`
Expected (stderr) :
- `communes géolocalisées : ~34788`
- une ligne `rayons (km -> communes) : 5:NNN, 10:NNN, 15:NNN, 25:NNN` où **25 km domine** (la grande majorité des communes françaises sont < 30 000 hab en bassin), 5 km est le plus petit groupe (cœurs de très grandes UU).
- `ecoles : N équipements géolocalisés`, idem culture / etudes_acces
- `✓ cache écrit : data/.cache/communes-bpe.json`

Garde-fou : si un seul rayon apparaît (ex. tout en 25), c'est que `tailleVille` est cassé (uu/population mal lus) — arrêter et corriger avant de continuer.

- [ ] **Step 4 : Commit**

```bash
git add scripts/populate-bpe.py
git commit -m "feat(bpe): comptage a rayon adaptatif par commune + voisinage grille ±2

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : Validation témoins, patch index, gloses, vérification finale

Compare ancien vs nouveau sur la matrice de cas témoins (le test décisif : corrige-t-on un biais ou déforme-t-on le signal ?), puis patche l'index, met à jour les gloses, invalide le cache et vérifie le build + le dev.

**Files:**
- Read: `data/comparateur-index.json` (ancien, avant patch), `data/.cache/communes-bpe.json` (nouveau, produit en Task 2)
- Modify: `data/comparateur-index.json` (via `--write-index`), `src/lib/comparateur-vie.ts` (gloses + busting cache)

- [ ] **Step 1 : Comparaison ancien → nouveau sur la matrice témoins**

L'index actuel (non encore patché) porte les ANCIENS scores ; le cache porte les NOUVEAUX. Lancer cette comparaison :

```bash
cd "$(git rev-parse --show-toplevel)" && python3 - <<'PY'
import json
idx = json.load(open("data/comparateur-index.json"))      # ancien
cache = json.load(open("data/.cache/communes-bpe.json"))   # nouveau
m = {c["insee"]: c for c in idx["communes"]}

# Matrice de cas témoins (cf. spec). insee -> (libellé, attendu).
temoins = {
    "75101": ("Paris 1er (UU>500k, 5km)",        "baisse un peu, reste excellent"),
    "69381": ("Lyon 1er (UU>500k, 5km)",         "baisse un peu, reste excellent"),
    "35238": ("Rennes (UU 371k, 10km)",          "baisse un peu, reste haut"),
    "35353": ("Vezin-le-Coquet (periph. Rennes)", "reste bien notee (herite 10km)"),
    "56260": ("Vannes (UU 81k, 15km inchange)",  "stable a +/- le rescaling"),
    "56157": ("Plaudren (~15km de Vannes, 25km)", "monte"),
    "29233": ("Quimperle (petite ville, 25km)",  "monte"),
    "48095": ("Mende (Lozere, isole, 25km)",     "monte peu / reste bas"),
}
def sc(d, f):
    if f == "etudes_acces":
        return d.get("etudes_acces")
    return (d.get(f) or {}).get("score") if isinstance(d.get(f), dict) else None
print(f"{'commune':34} {'ecoles':>14} {'culture':>14} {'etudes':>14}   attendu")
for ins, (lib, att) in temoins.items():
    c = m.get(ins)
    if not c:
        print(f"{lib:34} ABSENT DE L'INDEX"); continue
    new = cache.get(ins, {})
    cells = []
    for f in ("ecoles", "culture", "etudes_acces"):
        old = sc(c, f)
        nv = new.get(f, {}).get("score") if isinstance(new.get(f), dict) else None
        cells.append(f"{str(old):>5}->{str(nv):<5}")
    print(f"{lib:34} {cells[0]:>14} {cells[1]:>14} {cells[2]:>14}   {att}")

# Auto-surface : plus gros gagnants et stagnants parmi le rural (tailleVille < 30k => 25km).
from collections import defaultdict
uup = defaultdict(int)
for c in idx["communes"]:
    if c.get("uu") and c.get("population") is not None:
        uup[c["uu"]] += c["population"]
def taille(c):
    uu = c.get("uu")
    return uup[uu] if (uu and uu in uup) else c.get("population")
deltas = []
for c in idx["communes"]:
    if (taille(c) or 1e9) >= 30_000:
        continue
    ins = c["insee"]; nv = cache.get(ins, {})
    o = (c.get("ecoles") or {}).get("score"); n = (nv.get("ecoles") or {}).get("score")
    if o is not None and n is not None:
        deltas.append((n - o, ins, c["nom"], o, n))
deltas.sort(reverse=True)
print("\nTop 8 gagnants ruraux (ecoles, old->new) — attendu : villages proches d'une ville :")
for d, ins, nom, o, n in deltas[:8]:
    print(f"  +{d:>3}  {ins} {nom[:26]:26} {o}->{n}")
print("Bas 8 (ruraux qui ne montent pas) — attendu : vraiment isoles :")
for d, ins, nom, o, n in deltas[-8:]:
    print(f"  {d:>4}  {ins} {nom[:26]:26} {o}->{n}")
PY
```

Expected (interprétation, pas valeurs exactes) :
- **Paris 1er / Lyon 1er** : restent ≥ 90 (excellents). Une légère baisse est normale et acceptable.
- **Rennes** : reste haut (≥ ~85), baisse modérée.
- **Vezin-le-Coquet** (périphérie rennaise, hérite 10 km) : reste bien notée, PAS d'effondrement (test du piège banlieue).
- **Plaudren / Quimperlé** : montent.
- **Mende** : monte peu ou reste bas (isolé en Lozère).
- **Top gagnants ruraux** : des villages à 16-24 km d'une ville moyenne (juste hors de l'ancien rayon 15 km, désormais dans 25 km).
- **Bas du classement** : des communes vraiment éloignées de tout, qui ne bougent quasi pas.

**GATE bloquant** : si Paris/Lyon s'effondrent, si une périphérie rennaise chute fortement, ou si des villages isolés montent en flèche, le design déforme le signal. NE PAS patcher l'index : revenir au design (spec) avec ces chiffres.

- [ ] **Step 2 : Présenter le tableau témoins au porteur et obtenir le feu vert**

Coller la sortie du Step 1 et confirmer ligne par ligne contre la colonne « attendu ». Le porteur a posé cette matrice comme critère de validation : attendre son OK explicite avant le patch d'index.

- [ ] **Step 3 : Patcher l'index**

Run : `cd "$(git rev-parse --show-toplevel)" && .venv-bpe/bin/python scripts/populate-bpe.py --write-index`
Expected (stderr) : la même distribution de rayons qu'en Task 2, puis `✓ index patché (ecoles + culture + etudes_acces)`.

- [ ] **Step 4 : Mettre à jour les gloses BPE dans `comparateur-vie.ts`**

Trois commentaires BPE deviennent faux. NE PAS toucher les commentaires `nature` (263/265/628), qui restent à 15 km.

Ligne 288, remplacer :

```typescript
  // Accès BPE par rayon ~15 km (cf. scripts/populate-bpe.py). score = percentile national
```
par :
```typescript
  // Accès BPE par rayon adapté au territoire, 5 km en métropole à 25 km en rural
  // (cf. scripts/populate-bpe.py). score = percentile national
```

Ligne 631, remplacer :

```typescript
      return c.ecoles?.score ?? null; // percentile accès collèges+lycées dans ~15 km
```
par :
```typescript
      return c.ecoles?.score ?? null; // percentile accès collèges+lycées, rayon adapté au territoire
```

Ligne 633, remplacer :

```typescript
      return c.culture?.score ?? null; // percentile accès offre culturelle dans ~15 km
```
par :
```typescript
      return c.culture?.score ?? null; // percentile accès offre culturelle, rayon adapté au territoire
```

Aussi, ligne 54 (commentaire de la clé), remplacer :

```typescript
  // Accès BPE (collèges+lycées / offre culturelle large) dans ~15 km, percentile national.
```
par :
```typescript
  // Accès BPE (collèges+lycées / offre culturelle large), rayon adapté au territoire, percentile national.
```

Cette modification réelle de `comparateur-vie.ts` invalide aussi `indexCache` au prochain build du dev (piège cache index documenté).

- [ ] **Step 5 : Re-grep anti-glose-menteuse**

Run : `cd "$(git rev-parse --show-toplevel)" && grep -rn "15 km\|15km" src/lib/comparateur-vie.ts src/app src/components`
Expected : seules subsistent les occurrences `nature` (couvert naturel) et la page pro (« 15 ans », hors sujet). AUCUNE occurrence ne doit associer « 15 km » à `ecoles` / `culture` / BPE / accès écoles/culture. (`grep` renvoie exit 1 si zéro match — ne pas chaîner en `&&`.)

- [ ] **Step 6 : Vérification build + lint**

Run : `cd "$(git rev-parse --show-toplevel)" && npx tsc --noEmit && npm run lint`
Expected : tsc sans erreur ; lint sans nouvelle erreur.

- [ ] **Step 7 : Vérification dev réelle (curl)**

Démarrer le dev (`npm run dev`, port 3000) si pas déjà lancé, puis frapper le comparateur sur un critère BPE et vérifier une réponse 200 cohérente. Exemple :

```bash
curl -s "http://localhost:3000/api/ou-vivre?..." # adapter au endpoint réel du comparateur
```

Si l'endpoint exact n'est pas connu : ouvrir `/ou-vivre`, activer `acces_ecoles` + `acces_culture`, et vérifier que les classements se chargent sans erreur et que les communes rurales proches de villes remontent par rapport à avant. Le but est de confirmer qu'aucune régression runtime n'a été introduite (le moteur lit toujours un percentile).

- [ ] **Step 8 : Commit**

```bash
git add src/lib/comparateur-vie.ts data/comparateur-index.json data/.cache/communes-bpe.json
git commit -m "feat(bpe): rayon adaptatif applique a l'index + gloses honnetes

Index ecoles/culture/etudes_acces recalcules sur rayon adapte au bassin de vie
(5/10/15/25 km). Gloses '15 km' BPE corrigees. Warning GH001 large-file = normal.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

(Ne PAS pousser sur main : attendre le « push sur main » explicite du porteur.)

---

## Self-Review (effectuée à la rédaction)

- **Couverture spec** : table 4 classes → Task 1 ; périmètre trio BPE (un seul script) → Task 2 ; percentile national du comptage adaptatif → Task 2 ; fix grille ±2 → Task 2 ; gloses honnêtes → Task 3 Step 4-5 ; matrice de cas témoins comme gate → Task 3 Step 1-2 ; busting `indexCache` → Task 3 Step 4 ; vérif tsc+lint+curl → Task 3 Step 6-7. Exclusions (nature/transport/mer) respectées : aucune tâche ne les touche, et le Step 4 protège explicitement les commentaires `nature`.
- **Placeholders** : le seul flou résiduel est l'URL curl exacte (Step 7), volontairement laissée ouverte avec une procédure de repli UI, car le endpoint dépend de l'état du dev ; tout le reste est du code complet.
- **Cohérence des types/noms** : `radius_for`, `build_uupop`, `taille_ville`, `RADIUS_TABLE`, `RADIUS_RURAL`, `NEI`, `radius` (tableau) sont nommés identiquement de la Task 1 à la Task 3. Signature `count_within_radius(clat, clon, elat, elon, radius)` cohérente entre définition (Task 2 Step 1) et appel (Task 2 Step 2).
