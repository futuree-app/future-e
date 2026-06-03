# Mobilité (dépendance auto + accès transports) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter deux critères opt-in de mobilité au comparateur — `faible_dependance_auto` (part voiture domicile-travail) et `acces_transports` (part TC domicile-travail) — précalculés depuis le RP MOBPRO 2022, sans pénaliser le rural par défaut.

**Architecture:** Précalcul déterministe dans `comparateur-index.json` (champ `c.mobilite`) via un script Python lisant le parquet INSEE et agrégeant par commune pondéré IPONDI. Le moteur `comparateur-vie.ts` ajoute les deux clés (subScore = percentiles nationaux) ; `acces_transports` rejoint les signaux ambiants via sa clé subScore. Le parse LLM apprend à router les intentions mobilité.

**Tech Stack:** TypeScript (moteur + routes Next.js), Python + pyarrow (venv `.venv-bpe`) pour le script. Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels sur le serveur dev (port 3000). PAS de runner de test (cf. AGENTS.md).

**Référence spec :** `docs/superpowers/specs/2026-06-03-mobilite-dependance-auto-design.md`

**Pré-requis serveur :** serveur dev sur port 3000 (`npm run dev`) pour les témoins curl. Vérifier : `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/` → `200`. L'index est mémoïsé (`indexCache`) ; après modification de `comparateur-index.json`, redémarrer le serveur dev si un témoin renvoie une donnée incohérente.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** (modifier) : type `IndexCommune` (+`mobilite`), `PREFERENCE_KEYS` (+2), `subScore` (+2 cas), `REASON_POS`/`REASON_NEG` (+2 chacun), `AMBIENT_DIMENSIONS` (+`transports`). Cœur scoring.
- **`src/lib/comparateur-labels.ts`** (modifier) : `PREFERENCE_LABELS` (+2), `PREFERENCE_INTERPRETATIONS` (+2). Affichage.
- **`src/app/api/comparateur-vie/parse/route.ts`** (modifier) : descriptions de clés + règles de routage mobilité.
- **`scripts/populate-mobilite.py`** (créer) : agrège le parquet RP MOBPRO → `c.mobilite` dans l'index.
- **`.gitignore`** (modifier si besoin) : ignorer `data/rp-mobpro-2022.parquet`.

---

## Task 1 : moteur — clés, subScore, reasons, champ index, signal ambiant

`REASON_POS`/`REASON_NEG` sont `Record<PreferenceKey, …>` (exhaustifs) : ajouter les deux clés sans compléter ces maps casse tsc. Tout se fait donc dans un seul commit.

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter le champ `mobilite` au type `IndexCommune`**

Juste après la ligne du champ `inondation` (le bloc se terminant par `inondation?: { catnat: number; tri: boolean; risque: number } | null;`), ajouter :

```ts
  // Mobilité domicile-travail (cf. scripts/populate-mobilite.py, RP MOBPRO 2022). part_voiture/
  // part_tc = bruts 0..1 (conservés pour un futur rapport) ; dependance = percentile national de
  // part_voiture (haut = dépend de la voiture) ; acces_tc = percentile national de part_tc.
  mobilite?: {
    part_voiture: number;
    part_tc: number;
    dependance: number;
    acces_tc: number;
  } | null;
```

- [ ] **Step 2 : Ajouter les deux clés à `PREFERENCE_KEYS`**

Remplacer la fin du tableau `PREFERENCE_KEYS` :

```ts
  "faible_risque_inondation",
] as const;
```

par :

```ts
  "faible_risque_inondation",
  // Mobilité (RP MOBPRO 2022, part modale domicile-travail, percentile national). Opt-in,
  // préférences graduées. dependance = part voiture ; transports = part TC. cf. populate-mobilite.py.
  "faible_dependance_auto",
  "acces_transports",
] as const;
```

- [ ] **Step 3 : Ajouter les deux cas à `subScore`**

Dans le `switch (key)` de `subScore`, juste après le cas `faible_risque_inondation` (les lignes se terminant par `return c.inondation == null ? null : 100 - c.inondation.risque;`), ajouter :

```ts
    case "faible_dependance_auto":
      // part voiture domicile-travail faible -> score haut. Usage contraint, pas la possession.
      return c.mobilite == null ? null : 100 - c.mobilite.dependance;
    case "acces_transports":
      // part TC domicile-travail élevée -> mieux desservie.
      return c.mobilite?.acces_tc ?? null;
```

- [ ] **Step 4 : Compléter `REASON_POS`**

Dans `REASON_POS`, juste après la ligne `faible_risque_inondation: "peu d'arrêtés CatNat inondation",` ajouter :

```ts
  faible_dependance_auto: "peu dépendante de la voiture au quotidien",
  acces_transports: "bien desservie en transports en commun",
```

- [ ] **Step 5 : Compléter `REASON_NEG`**

Dans `REASON_NEG`, juste après la ligne `faible_risque_inondation: "historique CatNat inondation plus marqué",` ajouter :

```ts
  faible_dependance_auto: "territoire où la voiture reste quasi indispensable",
  acces_transports: "peu desservie en transports en commun",
```

- [ ] **Step 6 : Ajouter `transports` aux signaux ambiants**

Dans `AMBIENT_DIMENSIONS`, juste après la ligne de l'entrée `air` (`{ id: "air", key: "air_sain", bands: [...] },`), ajouter :

```ts
  { id: "transports", key: "acces_transports", bands: ["mieux desservie en transports", "desserte en transports intermédiaire", "moins desservie en transports"] },
```

- [ ] **Step 7 : Vérifier tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint sur `comparateur-vie.ts`. (Les deux critères renvoient `null` tant que l'index n'a pas le champ `mobilite` : aucun crash, ils ne scorent simplement rien.)

- [ ] **Step 8 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): cles mobilite (dependance auto + acces transports) + signal ambiant

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : libellés + gloses affichés

**Files:**
- Modify: `src/lib/comparateur-labels.ts`

- [ ] **Step 1 : Ajouter les libellés (`PREFERENCE_LABELS`)**

Dans `PREFERENCE_LABELS`, juste après la ligne `faible_risque_inondation: "un faible risque d'inondation",` ajouter :

```ts
  faible_dependance_auto: "une faible dépendance à la voiture",
  acces_transports: "l'accès aux transports en commun",
```

- [ ] **Step 2 : Ajouter les gloses (`PREFERENCE_INTERPRETATIONS`)**

Dans `PREFERENCE_INTERPRETATIONS`, juste après la ligne `faible_risque_inondation: "historique d'arrêtés CatNat inondation et territoires à risque important, pas une garantie d'absence de crue",` ajouter :

```ts
  faible_dependance_auto: "part des trajets domicile-travail faits en voiture, pas la qualité du réseau routier",
  acces_transports: "part des trajets domicile-travail en transports en commun, pas le détail des lignes ni des horaires",
```

- [ ] **Step 3 : Vérifier tsc**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 4 : Commit**

```bash
git add src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): libelles + gloses mobilite (dependance auto, transports)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : parse — router les intentions mobilité

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Ajouter les descriptions de clés**

Juste après la ligne décrivant `acces_culture` (`- acces_culture : accès à une offre culturelle autour au sens large, diffusion et pratique (cinéma, médiathèque, théâtre, musée, salle de spectacle/concert, conservatoire). PAS la vitalité ni la programmation`), ajouter :

```
- faible_dependance_auto : pouvoir vivre en conduisant moins (part des trajets domicile-travail faits en voiture, percentile national). Pour « sans voiture », « moins conduire », « ne pas dépendre de la voiture », « tout à pied », « ne pas être coincé sans voiture »
- acces_transports : accès aux transports en commun (part des trajets domicile-travail en TC). Pour « une gare », « le train », « des bus », « tramway », « métro », « transports en commun », « bien desservi », « pouvoir aller en ville sans voiture »
```

- [ ] **Step 2 : Ajouter les règles de routage**

Dans le bloc « TRADUCTION AUTOMATIQUE », juste après la ligne `- "télétravail total", "100 % télétravail", "je travaille de chez moi", "full remote" → emploiHorsSujet:true (l'emploi local n'est pas un enjeu).` ajouter :

```
- "sans voiture", "se passer de la voiture", "moins conduire", "ne pas dépendre de la voiture", "tout à pied", "se garer c'est l'enfer" → faible_dependance_auto (poids 2 à 3).
- "une gare", "le train", "des bus", "tram", "tramway", "métro", "transports en commun", "bien desservi", "aller en ville sans voiture" → acces_transports (poids 2 à 3).
- Mobilité : faible_dependance_auto (se passer de la voiture) et acces_transports (avoir une desserte) sont DISTINCTS et peuvent coexister (« sans voiture, avec une gare » → les deux). N'en déduisez aucun par défaut d'un projet rural ou familial.
```

- [ ] **Step 3 : Vérifier tsc**

Run: `npx tsc --noEmit`
Expected: aucune erreur (l'enum du schéma tire automatiquement de `PREFERENCE_KEYS`, déjà étendu en Task 1).

- [ ] **Step 4 : Témoin curl — routage des deux intentions**

Run :
```bash
for q in "je veux pouvoir vivre sans voiture" "je veux une gare et des trains" "sans voiture mais avec une gare"; do
  echo "Q: $q"
  curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' -d "{\"text\":\"$q\"}" \
   | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ->', [p['key'] for p in d.get('parsed',d).get('preferences',[])])"
done
```
Expected : « sans voiture » → contient `faible_dependance_auto` ; « gare et trains » → contient `acces_transports` ; « sans voiture mais avec une gare » → contient **les deux**.

- [ ] **Step 5 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse route les intentions mobilite (sans voiture / gare)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : script de précalcul + patch de l'index

**Files:**
- Create: `scripts/populate-mobilite.py`
- Modify: `.gitignore` (si `data/rp-mobpro-2022.parquet` n'est pas déjà ignoré)
- Modify: `data/comparateur-index.json` (via `--write-index`)

- [ ] **Step 1 : Télécharger le fichier détail RP MOBPRO 2022**

Récupérer l'URL du fichier **France entière** (Parquet) sur la page INSEE et le placer dans `data/` :
```bash
# 1. Ouvrir https://www.insee.fr/fr/statistiques/8589904 et copier le lien du fichier
#    "France hors Mayotte" au format Parquet (.parquet ou .zip contenant le .parquet).
# 2. Télécharger (remplacer <URL> par le lien copié) :
curl -L -o data/rp-mobpro-2022.parquet "<URL>"
# Si l'INSEE ne fournit qu'un .zip : dézipper et renommer le .parquet en data/rp-mobpro-2022.parquet
ls -lh data/rp-mobpro-2022.parquet
```
Expected : fichier présent, plusieurs centaines de Mo.

- [ ] **Step 2 : Vérifier les noms de colonnes du parquet**

Run (venv pyarrow) :
```bash
.venv-bpe/bin/python -c "
import pyarrow.parquet as pq
pf = pq.ParquetFile('data/rp-mobpro-2022.parquet')
print('colonnes:', pf.schema_arrow.names)
b = next(pf.iter_batches(batch_size=5)).to_pydict()
for k in ('COMMUNE','TRANS','IPONDI'):
    print(k, '->', b.get(k))
"
```
Expected : les colonnes `COMMUNE` (code commune résidence), `TRANS` (mode, valeurs '1'..'6'), `IPONDI` (poids) existent. Si un nom diffère (ex. `TRANS` orthographié autrement), adapter les noms dans le script à l'étape suivante.

- [ ] **Step 3 : Créer le script `scripts/populate-mobilite.py`**

```python
#!/usr/bin/env python3
"""populate-mobilite.py — dépendance auto + accès transports (RP MOBPRO 2022).

Agrège la part modale domicile-travail par COMMUNE de résidence, pondérée IPONDI :
  part_voiture = IPONDI[TRANS==5] / IPONDI_total   (voiture/camion/fourgonnette)
  part_tc      = IPONDI[TRANS==6] / IPONDI_total   (transports en commun)
Seuil de fiabilité MIN_TOTAL ; en deçà -> commune laissée à null (échantillon trop faible).
Percentiles nationaux -> champ c.mobilite de l'index. Venv .venv-bpe (pyarrow).

Usage :
    .venv-bpe/bin/python scripts/populate-mobilite.py                # agrège + résumé
    .venv-bpe/bin/python scripts/populate-mobilite.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect
import pyarrow.parquet as pq

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
PARQUET = os.path.join(ROOT, "data", "rp-mobpro-2022.parquet")
MIN_TOTAL = 50.0  # actifs pondérés ; en deçà, part trop bruitée


def aggregate():
    agg = {}  # insee -> [total, voiture, tc]
    pf = pq.ParquetFile(PARQUET)
    for batch in pf.iter_batches(columns=["COMMUNE", "TRANS", "IPONDI"], batch_size=200_000):
        d = batch.to_pydict()
        for c, t, w in zip(d["COMMUNE"], d["TRANS"], d["IPONDI"]):
            if c is None or w is None:
                continue
            w = float(w)
            a = agg.get(c)
            if a is None:
                a = agg[c] = [0.0, 0.0, 0.0]
            a[0] += w
            ts = str(t)
            if ts == "5":
                a[1] += w
            elif ts == "6":
                a[2] += w
    return agg


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    agg = aggregate()
    parts = {}  # insee -> (part_voiture, part_tc)
    for insee, (tot, v, tc) in agg.items():
        if tot < MIN_TOTAL:
            continue
        parts[insee] = (v / tot, tc / tot)
    print(f"communes agrégées : {len(agg)} | fiables (>= {MIN_TOTAL:.0f}) : {len(parts)}", file=sys.stderr)

    pv_sorted = sorted(p[0] for p in parts.values())
    tc_sorted = sorted(p[1] for p in parts.values())
    n = len(parts)

    def pct(sorted_vals, x):
        return round(100 * bisect.bisect_right(sorted_vals, x) / n) if n else 0

    # Aperçu : 5 communes les moins dépendantes de la voiture
    preview = sorted(parts.items(), key=lambda kv: kv[1][0])[:5]
    print("moins dépendantes (part voiture la plus basse) :", file=sys.stderr)
    for insee, (pv, ptc) in preview:
        print(f"  {insee}  voiture={pv:.0%}  tc={ptc:.0%}", file=sys.stderr)

    if args.write_index:
        idx = json.load(open(INDEX))
        hit = 0
        for c in idx["communes"]:
            p = parts.get(c["insee"])
            if p is None:
                c["mobilite"] = None
            else:
                pv, ptc = p
                c["mobilite"] = {
                    "part_voiture": round(pv, 4),
                    "part_tc": round(ptc, 4),
                    "dependance": pct(pv_sorted, pv),
                    "acces_tc": pct(tc_sorted, ptc),
                }
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(idx['communes'])} communes avec mobilité", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 4 : Ignorer le parquet dans git**

Run :
```bash
grep -q "rp-mobpro" .gitignore || printf '\n# RP MOBPRO (volumineux, non versionné)\ndata/rp-mobpro-2022.parquet\n' >> .gitignore
grep "rp-mobpro" .gitignore
```
Expected : la ligne `data/rp-mobpro-2022.parquet` apparaît dans `.gitignore`.

- [ ] **Step 5 : Lancer le script (agrégation, sans écrire) et contrôler**

Run :
```bash
.venv-bpe/bin/python scripts/populate-mobilite.py
```
Expected : « communes agrégées … | fiables … » ; l'aperçu « moins dépendantes » liste des codes de grandes villes / arrondissements parisiens (part voiture basse, TC haute). Si l'aperçu montre des parts aberrantes (toutes à 0 ou 1), revérifier le mapping `TRANS` (Step 2) avant d'écrire.

- [ ] **Step 6 : Patcher l'index + témoins data**

Run :
```bash
.venv-bpe/bin/python scripts/populate-mobilite.py --write-index
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
by={c['insee']:c for c in idx['communes']}
def show(insee,nom):
    m=(by.get(insee) or {}).get('mobilite')
    print(f'{nom:18} {insee} -> {m}')
for insee,nom in [('75056','Paris'),('75101','Paris 1er'),('69381','Lyon 1er'),('13201','Marseille 1er')]:
    show(insee,nom)
# une commune rurale isolée : forte dépendance attendue
rural=[c for c in idx['communes'] if (c.get('mobilite') or {}).get('dependance',0)>=95][:3]
print('exemples forte dépendance:', [(c['nom'],c['mobilite']['part_voiture']) for c in rural])
miss=sum(1 for c in idx['communes'] if c.get('mobilite') is None)
print('communes sans mobilité (null):', miss, '/', len(idx['communes']))
"
```
Expected : Paris / arrondissements parisiens et lyonnais ont une `dependance` basse et un `acces_tc` haut ; des communes rurales ont `dependance` proche de 100 (part_voiture ~0.9+) ; un nombre limité de `null` (petites communes sous le seuil). Note : si Paris « 75056 » est `null` mais les arrondissements « 751xx » sont renseignés, c'est normal (MOBPRO code par arrondissement, comme l'index).

- [ ] **Step 7 : Témoin curl — /match (critères) + rural non pénalisé**

Run :
```bash
echo "=== acces_transports : métropoles desservies en tête ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"acces_transports","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
echo "=== faible_dependance_auto : grandes villes en tête ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"faible_dependance_auto","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
echo "=== critère neutre : pas de reason mobilité (rural non pénalisé) ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"nature","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); bad=[c['nom'] for c in d.get('results',[]) if any('voiture' in r or 'transport' in r for r in c.get('reasons',[]))]; print('  reasons mobilité hors critère (attendu 0):', len(bad), bad)"
```
Expected : `acces_transports` → grandes villes desservies en tête avec « bien desservie en transports en commun » ; `faible_dependance_auto` → grandes villes en tête ; recherche `nature` → 0 reason mobilité (le rural n'est pas pénalisé par un critère non demandé).

- [ ] **Step 8 : Commit (script + index)**

```bash
git add scripts/populate-mobilite.py .gitignore data/comparateur-index.json
git commit -m "feat(data): mobilite (RP MOBPRO 2022) dans l'index + script populate-mobilite

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : vérification finale + intégration

**Files:** aucun (vérification transversale)

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -E "comparateur-vie\.ts|comparateur-labels\.ts|parse/route\.ts" && echo "(erreurs ci-dessus)" || echo "aucune erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune nouvelle erreur lint sur les fichiers touchés (les problèmes préexistants du repo, sans rapport, subsistent).

- [ ] **Step 2 : Témoin curl — /ask « et côté transports ? » (signal ambiant)**

Run :
```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et côté transports ?","context":{"territoires":[
   {"rang":1,"nom":"Lyon","region":"Auvergne-Rhône-Alpes","raisons":["dynamisme"],"compromis":null,"signaux":{"transports":"mieux desservie en transports"}},
   {"rang":2,"nom":"Aurillac","region":"Auvergne-Rhône-Alpes","raisons":["nature"],"compromis":null,"signaux":{"transports":"moins desservie en transports"}}
 ]}}' \
 | python3 -c "import sys,json,re; a=json.load(sys.stdin).get('answer',''); print('answer:', a); print('contient un chiffre:', bool(re.search(r'[0-9]', a)))"
```
Expected : réponse qualitative comparative (Lyon mieux desservi qu'Aurillac), zéro chiffre, ton constat.

- [ ] **Step 3 : Vérifier l'état git**

Run: `git status --short`
Expected: aucune modification non committée des fichiers source (le parquet `data/rp-mobpro-2022.parquet` reste untracked/ignoré).

- [ ] **Step 4 : finishing-a-development-branch**

Invoquer la skill `superpowers:finishing-a-development-branch` pour présenter les options. Ne pas merger sur `main` sans le « push sur main » explicite du porteur.

---

## Self-review (rempli par l'auteur du plan)

- **Couverture spec :** §source → Task 4 Step 1-2. §métriques (part voiture/tc, seuil 50, percentiles) → Task 4 Step 3 script. §champ index → Task 1 Step 1 + Task 4 Step 6. §moteur (2 clés, subScore, reasons, labels, gloses) → Tasks 1-2. §signal ambiant transports → Task 1 Step 6. §parse → Task 3. §densité exclue → script n'utilise pas la densité (Task 4). §vérification → Tasks 3/4/5.
- **Placeholders :** l'URL du parquet est volontairement à copier depuis la page INSEE (Step 1) — pas un placeholder de logique ; tout le code est explicite. Le mapping de colonnes est validé en Task 4 Step 2 avant usage.
- **Cohérence des types :** champ `mobilite { part_voiture, part_tc, dependance, acces_tc }` identique entre le type `IndexCommune` (Task 1), le script (Task 4) et `subScore` (`c.mobilite.dependance`, `c.mobilite.acces_tc`). Clés `faible_dependance_auto` / `acces_transports` ajoutées de façon cohérente à `PREFERENCE_KEYS`, `subScore`, `REASON_POS`, `REASON_NEG`, `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, `AMBIENT_DIMENSIONS` et au parse. `acces_transports` réutilise sa clé subScore dans `AMBIENT_DIMENSIONS` (cohérent avec `acces_soins`).
