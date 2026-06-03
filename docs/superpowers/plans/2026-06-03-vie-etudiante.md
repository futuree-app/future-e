# Critère vie étudiante (accès + dynamisme) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un critère opt-in `vie_etudiante` combinant l'accès aux établissements supérieurs (BPE C5xx, 40 %) et le dynamisme étudiant (part d'étudiants à l'échelle de l'unité urbaine, MESR, 60 %).

**Architecture:** Deux champs précalculés dans `comparateur-index.json` : `c.etudes_acces` (script BPE étendu) et `c.etudes_dyn` (nouveau script MESR), indépendants. Le moteur ajoute une clé `vie_etudiante` dont le subScore combine les deux (0,4·accès + 0,6·dynamisme) et rejoint les signaux ambiants. Parse LLM pour router l'intention.

**Tech Stack:** TypeScript (moteur + routes), Python (venv `.venv-bpe` : pyarrow pour BPE, numpy + urllib pour MESR). Vérification : `npx tsc --noEmit` + `npm run lint` + `curl` réels (port 3000) + témoins Python. PAS de runner de test (cf. AGENTS.md).

**Référence spec :** `docs/superpowers/specs/2026-06-03-vie-etudiante-design.md`

**Pré-requis serveur :** dev sur port 3000. Après `--write-index`, le cache `indexCache` du dev nécessite une vraie modif de `comparateur-vie.ts` (ou un redémarrage) pour relire l'index — comme constaté au chantier mobilité.

---

## File Structure

- **`src/lib/comparateur-vie.ts`** : type `IndexCommune` (+`etudes_acces`, +`etudes_dyn`), `PREFERENCE_KEYS` (+1), `subScore` (+1 cas combiné), `REASON_POS`/`NEG` (+1), `AMBIENT_DIMENSIONS` (+`vie_etudiante`).
- **`src/lib/comparateur-labels.ts`** : `PREFERENCE_LABELS` (+1), `PREFERENCE_INTERPRETATIONS` (+1).
- **`src/app/api/comparateur-vie/parse/route.ts`** : description + règle de routage.
- **`scripts/populate-bpe.py`** (étendu) : champ accès supérieur.
- **`scripts/populate-etudiants.py`** (créer) : part étudiante (MESR).

---

## Task 1 : moteur — clé `vie_etudiante`, champs index, subScore, signal ambiant

`REASON_POS`/`REASON_NEG` exhaustifs : tout dans un commit. Les champs renvoient `null` tant que l'index n'est pas patché (Tasks 4-5) → aucun crash.

**Files:** Modify `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Champs au type `IndexCommune`**

Juste après le champ `transport?: { ... } | null;` (ajouté au chantier mobilité), ajouter :
```ts
  // Vie étudiante. etudes_acces = percentile présence établissements sup (BPE C5xx, cf.
  // populate-bpe.py) ; etudes_dyn = percentile part étudiante au niveau UU (MESR, cf.
  // populate-etudiants.py). Combinés dans subScore("vie_etudiante").
  etudes_acces?: number | null;
  etudes_dyn?: number | null;
```

- [ ] **Step 2 : Ajouter la clé à `PREFERENCE_KEYS`**

Remplacer :
```ts
  "prefere_grande_ville",
] as const;
```
par :
```ts
  "prefere_grande_ville",
  // Vie étudiante (BPE C5xx + effectifs MESR). Accès aux études + dynamisme étudiant combinés
  // (40/60). Opt-in. cf. populate-bpe (etudes_acces) + populate-etudiants (etudes_dyn).
  "vie_etudiante",
] as const;
```

- [ ] **Step 3 : Cas `subScore` (combiné 40/60)**

Juste après le cas `prefere_grande_ville` (`return lerp(GRANDE_VILLE_MAX, tailleVille(c));`), ajouter :
```ts
    case "vie_etudiante": {
      // 40 % accès (présence établissements sup) + 60 % dynamisme (part étudiante UU).
      const a = c.etudes_acces ?? null;
      const d = c.etudes_dyn ?? null;
      if (a == null && d == null) return null;
      if (a == null) return d;
      if (d == null) return a;
      return Math.round(0.4 * a + 0.6 * d);
    }
```

- [ ] **Step 4 : `REASON_POS`** (après `prefere_grande_ville: "grande ville animée",`)

Formulation FACTUELLE (pas « animée », qui interprète) :
```ts
  vie_etudiante: "forte présence étudiante",
```

- [ ] **Step 5 : `REASON_NEG`** (après `prefere_grande_ville: "petit bassin urbain",`)
```ts
  vie_etudiante: "présence étudiante limitée",
```

- [ ] **Step 6 : Signal ambiant** (dans `AMBIENT_DIMENSIONS`, après l'entrée `transports`)

Bandes factuelles (présence, pas jugement d'ambiance) :
```ts
  { id: "vie_etudiante", key: "vie_etudiante", bands: ["forte présence étudiante", "présence étudiante intermédiaire", "présence étudiante limitée"] },
```

- [ ] **Step 7 : tsc + lint**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -i "comparateur-vie" || echo "pas d'erreur lint sur comparateur-vie.ts"`
Expected: tsc sans erreur ; aucune ligne lint sur `comparateur-vie.ts`.

- [ ] **Step 8 : Commit**
```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): cle vie_etudiante (acces + dynamisme combines) + signal ambiant

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : libellés + glose

**Files:** Modify `src/lib/comparateur-labels.ts`

- [ ] **Step 1 : `PREFERENCE_LABELS`** (après `prefere_grande_ville: "une grande ville",`)
```ts
  vie_etudiante: "une ville étudiante",
```

- [ ] **Step 2 : `PREFERENCE_INTERPRETATIONS`** (après `prefere_grande_ville: "taille de l'agglomération (unité urbaine), pas de la seule commune",`)
```ts
  vie_etudiante: "présence d'établissements supérieurs et poids des étudiants dans la population, pas la qualité ni la réputation des formations",
```

- [ ] **Step 3 : tsc** — Run: `npx tsc --noEmit` — Expected: aucune erreur.

- [ ] **Step 4 : Commit**
```bash
git add src/lib/comparateur-labels.ts
git commit -m "feat(comparateur): libelle + glose vie etudiante

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : parse + note de doctrine (prompts synthèse & AskFuture)

**Files:** Modify `src/app/api/comparateur-vie/parse/route.ts`, `src/app/api/comparateur-vie/synthesize/route.ts`, `src/app/api/comparateur-vie/ask/route.ts`

- [ ] **Step 1 : Description de clé** (après la ligne décrivant `prefere_grande_ville`)
```
- vie_etudiante : ville étudiante / accès aux études supérieures (présence d'établissements supérieurs ET poids des étudiants dans la population, niveau agglomération). Pour « une ville étudiante », « université », « fac », « faire des études », « pour mes études » ou celles des enfants, « campus », « vie étudiante », « ville animée par les étudiants »
```

- [ ] **Step 2 : Règle de routage + NON-routage** (dans « TRADUCTION AUTOMATIQUE », après la dernière règle de taille de ville — repère : la ligne `... → prefere_grande_ville (poids 2 à 3).`)
```
- "ville étudiante", "université", "fac", "faire des études", "pour mes études", "pour les études des enfants", "campus", "vie étudiante", "animée par les étudiants" → vie_etudiante (poids 2 à 3).
- NE PAS router "ville dynamique", "ville vivante", "ville animée" vers vie_etudiante : ce sont des intentions distinctes (les étudiants ne sont qu'un proxy partiel du dynamisme). vie_etudiante ne s'active que sur une intention explicite d'études / d'étudiants.
```

- [ ] **Step 3 : Note de doctrine dans le prompt SYNTHÈSE**

Dans `src/app/api/comparateur-vie/synthesize/route.ts`, juste avant la ligne `STRUCTURE (court, 110 à 170 mots, 1 à 2 paragraphes)`, insérer :
```
SI "une ville étudiante" EST DEMANDÉ (vie_etudiante)
Ce critère mesure DEUX choses : la présence d'établissements supérieurs accessibles, et le poids
des étudiants dans la population du bassin de vie. Il NE mesure PAS la qualité des formations, la
réputation des établissements, les classements, les débouchés, ni la vie culturelle étudiante.
Présentez-le comme un indicateur de présence et de dynamisme étudiant, jamais comme une évaluation
qualitative des études proposées.

```

- [ ] **Step 4 : Note de doctrine dans le prompt ASKFUTURE**

Dans `src/app/api/comparateur-vie/ask/route.ts`, juste avant la ligne `SI LA QUESTION SORT DU SUJET futur•e`, insérer :
```
SI LA VIE ÉTUDIANTE EST EN JEU (critère ou signal vie_etudiante)
C'est un indicateur de PRÉSENCE et de DYNAMISME étudiant : présence d'établissements supérieurs
accessibles + poids des étudiants dans la population du bassin de vie. Il ne dit RIEN de la qualité
des formations, de la réputation, des classements ni des débouchés. Répondez en termes de présence
et de dynamisme, jamais en évaluation qualitative des études.

```

- [ ] **Step 5 : tsc** — Run: `npx tsc --noEmit` — Expected: aucune erreur (enum tiré de `PREFERENCE_KEYS`).

- [ ] **Step 6 : Témoin curl — routage + non-routage**
```bash
for q in "je cherche une ville étudiante" "un endroit pour faire mes études" "une ville avec une université" "je veux une ville dynamique et vivante"; do
  printf "Q: %s\n" "$q"
  curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' -d "{\"text\":\"$q\"}" \
   | python3 -c "import sys,json; d=json.load(sys.stdin); print('  ->', [p['key'] for p in d.get('parsed',d).get('preferences',[])])"
done
```
Expected : les trois premières contiennent `vie_etudiante` ; « ville dynamique et vivante » ne contient **pas** `vie_etudiante`.

- [ ] **Step 7 : Commit**
```bash
git add src/app/api/comparateur-vie/parse/route.ts src/app/api/comparateur-vie/synthesize/route.ts src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(comparateur): parse vie etudiante (+ non-routage ville dynamique) + doctrine prompts

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : accès supérieur dans `populate-bpe.py` → `c.etudes_acces`

**Files:** Modify `scripts/populate-bpe.py`, `data/comparateur-index.json`

- [ ] **Step 1 : Ajouter le set des codes supérieurs**

Juste après la ligne `CULTURE_TYPEQU = {"F303", "F305", "F307", "F312", "F315"}` (~39), ajouter :
```python
# Enseignement supérieur : universités, écoles, STS/CPGE, santé, autres (cf. spec vie étudiante).
SUP_TYPEQU = {"C501", "C502", "C503", "C504", "C505", "C509"}
```

- [ ] **Step 2 : Ajouter le champ à la boucle de calcul**

Remplacer :
```python
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU)):
```
par :
```python
    for field, typeset in (("ecoles", ECOLES_TYPEQU), ("culture", CULTURE_TYPEQU), ("etudes_acces", SUP_TYPEQU)):
```

- [ ] **Step 3 : Écrire le percentile (number) dans l'index**

Remplacer :
```python
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champs ecoles + culture : score + count)", file=sys.stderr)
```
par :
```python
        for c in idx["communes"]:
            r = rec.get(c["insee"])
            c["ecoles"] = r["ecoles"] if r else None
            c["culture"] = r["culture"] if r else None
            # etudes_acces : on n'expose que le percentile (number), pas le count.
            c["etudes_acces"] = r["etudes_acces"]["score"] if r else None
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (ecoles + culture + etudes_acces)", file=sys.stderr)
```

- [ ] **Step 4 : Lancer + témoin data**

```bash
.venv-bpe/bin/python scripts/populate-bpe.py --write-index 2>&1 | tail -3
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
by={c['insee']:c for c in idx['communes']}
for insee,nom in [('31555','Toulouse'),('59350','Lille'),('69381','Lyon 1er')]:
    print(nom, '-> etudes_acces', (by.get(insee) or {}).get('etudes_acces'))
hi=sum(1 for c in idx['communes'] if (c.get('etudes_acces') or 0)>=90)
print('communes etudes_acces>=90:', hi)
"
```
Expected : grandes villes universitaires `etudes_acces` haut (~100) ; un nombre raisonnable de communes au-dessus de 90 (zones urbaines).

- [ ] **Step 5 : Commit**
```bash
git add scripts/populate-bpe.py data/comparateur-index.json
git commit -m "feat(data): acces enseignement superieur (BPE C5xx) dans l'index

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5 : part étudiante (MESR) → `c.etudes_dyn`

**Files:** Create `scripts/populate-etudiants.py`, Modify `data/comparateur-index.json`

- [ ] **Step 1 : Vérifier les champs du dataset MESR**

```bash
.venv-bpe/bin/python -c "
import json, urllib.request
url='https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/records?limit=1&order_by=rentree%20desc'
req=urllib.request.Request(url, headers={'User-Agent':'futur-e'})
d=json.loads(urllib.request.urlopen(req, timeout=60).read().decode())
r=d['results'][0]
print('total_count:', d['total_count'])
print('champs:', list(r.keys()))
print('com_id', r.get('com_id'), '| effectif_atlas', r.get('effectif_atlas'), '| rentree', r.get('rentree'))
"
```
Expected : `com_id`, `effectif_atlas`, `rentree` présents. Si un nom diffère, adapter le script (Step 2).

- [ ] **Step 2 : Créer `scripts/populate-etudiants.py`**

```python
#!/usr/bin/env python3
"""populate-etudiants.py — dynamisme étudiant (part d'étudiants par UU, MESR).

Effectifs étudiants par commune (effectif_atlas, dernière rentrée) agrégés à l'unité urbaine
via le mapping commune->UU de l'index ; part étudiante = effectifs_UU / popUU. Percentile
national -> c.etudes_dyn. Venv .venv-bpe (urllib stdlib).

Usage :
    .venv-bpe/bin/python scripts/populate-etudiants.py                # résumé
    .venv-bpe/bin/python scripts/populate-etudiants.py --write-index  # + patche l'index
"""
import json, os, sys, argparse, bisect, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
EXPORT_URL = ("https://data.enseignementsup-recherche.gouv.fr/api/explore/v2.1/catalog/datasets/"
              "fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/exports/json")


def fetch_rows():
    req = urllib.request.Request(EXPORT_URL, headers={"User-Agent": "futur-e/populate-etudiants"})
    with urllib.request.urlopen(req, timeout=300) as r:
        return json.loads(r.read().decode("utf-8"))


def eff_by_commune(rows):
    # dernière rentrée
    rentrees = [r.get("rentree") for r in rows if r.get("rentree") is not None]
    last = max(rentrees)
    eff = {}
    for r in rows:
        if r.get("rentree") != last:
            continue
        com = r.get("com_id")
        v = r.get("effectif_atlas")
        if not com or v is None:
            continue
        eff[com] = eff.get(com, 0) + int(v)
    print(f"rentrée retenue : {last} | communes avec étudiants : {len(eff)} | total : {sum(eff.values())}", file=sys.stderr)
    return eff


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    rows = fetch_rows()
    eff = eff_by_commune(rows)

    idx = json.load(open(INDEX))
    communes = idx["communes"]

    # popUU + effUU (agrégation par UU via le mapping de l'index)
    popUU, effUU = {}, {}
    for c in communes:
        uu = c.get("uu")
        if uu and c.get("population") is not None:
            popUU[uu] = popUU.get(uu, 0) + c["population"]
            effUU[uu] = effUU.get(uu, 0) + eff.get(c["insee"], 0)

    def part(c):
        uu = c.get("uu")
        if uu and popUU.get(uu):
            return effUU[uu] / popUU[uu]
        pop = c.get("population")
        if pop:
            return eff.get(c["insee"], 0) / pop
        return None

    parts = {c["insee"]: part(c) for c in communes}
    vals = sorted(p for p in parts.values() if p is not None)
    n = len(vals)

    def pct(x):
        return round(100 * bisect.bisect_right(vals, x) / n) if n else 0

    top = sorted(((c["nom"], parts[c["insee"]]) for c in communes if parts[c["insee"]] is not None),
                 key=lambda kv: kv[1], reverse=True)[:6]
    print("plus forte part étudiante :", file=sys.stderr)
    for nom, p in top:
        print(f"  {nom}  {p:.1%}", file=sys.stderr)

    if args.write_index:
        hit = 0
        for c in communes:
            p = parts[c["insee"]]
            if p is None:
                c["etudes_dyn"] = None
            else:
                c["etudes_dyn"] = pct(p)
                hit += 1
        json.dump(idx, open(INDEX, "w"))
        print(f"✓ index patché : {hit}/{len(communes)} communes avec etudes_dyn", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 3 : Lancer (sans écrire) et contrôler**

Run: `.venv-bpe/bin/python scripts/populate-etudiants.py`
Expected : « rentrée retenue : 2023 (ou plus récent) | … | total : ~2,7-2,9 M » ; « plus forte part étudiante » liste des agglos universitaires (Poitiers, Rennes, Montpellier, La Rochelle, Grenoble…). Si le total est très loin de ~2,8 M ou si l'agrégation double-compte, revoir le filtre (Step 1) avant d'écrire.

- [ ] **Step 4 : Patcher l'index + témoin**

```bash
.venv-bpe/bin/python scripts/populate-etudiants.py --write-index 2>&1 | tail -2
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
by={c['insee']:c for c in idx['communes']}
for insee,nom in [('86194','Poitiers'),('35238','Rennes'),('34172','Montpellier'),('15014','Aurillac')]:
    print(nom, '-> etudes_dyn', (by.get(insee) or {}).get('etudes_dyn'))
print('null:', sum(1 for c in idx['communes'] if c.get('etudes_dyn') is None), '/', len(idx['communes']))
"
```
Expected : Poitiers/Rennes/Montpellier `etudes_dyn` élevé ; Aurillac plus modeste ; peu de `null` (communes sans population).

- [ ] **Step 5 : Forcer le rechargement de l'index puis témoins /match + /ask**

L'index a changé : faire une modif inerte de `comparateur-vie.ts` pour invalider `indexCache` du dev (comme au chantier mobilité) — ajouter/retirer un espace en fin de fichier suffit s'il déclenche la recompilation ; sinon redémarrer `npm run dev`. Puis :
```bash
echo "=== vie_etudiante ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"vie_etudiante","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],c['reasons']) for c in d.get('results',[])[:3]]"
echo "=== neutre (nature) : pas de reason vie étudiante ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"nature","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); bad=[c['nom'] for c in d.get('results',[]) if any('étudiant' in r for r in c.get('reasons',[]))]; print('reasons étudiantes hors critère (attendu 0):', len(bad), bad)"
echo "=== /ask ==="
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et côté vie étudiante ?","context":{"territoires":[
   {"rang":1,"nom":"Rennes","region":"Bretagne","raisons":["dynamisme"],"compromis":null,"signaux":{"vie_etudiante":"forte présence étudiante"}},
   {"rang":2,"nom":"Aurillac","region":"Auvergne-Rhône-Alpes","raisons":["nature"],"compromis":null,"signaux":{"vie_etudiante":"présence étudiante limitée"}}
 ]}}' \
 | python3 -c "import sys,json,re; a=json.load(sys.stdin).get('answer',''); print(a); print('chiffre:', bool(re.search(r'[0-9]', a)))"
```
Expected : `vie_etudiante` → villes étudiantes en tête avec « ville étudiante animée » ; recherche `nature` → 0 reason étudiante (rural non pénalisé) ; `/ask` → réponse qualitative comparative, zéro chiffre.

- [ ] **Step 6 : Commit (script + index)**
```bash
git add scripts/populate-etudiants.py data/comparateur-index.json
git commit -m "feat(data): dynamisme etudiant (part etudiante UU, MESR) dans l'index + populate-etudiants

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

Note : si la modif inerte de `comparateur-vie.ts` (Step 5) a été committée séparément, l'inclure proprement ; sinon la retirer avant le commit.

---

## Task 6 : vérification finale + intégration

**Files:** aucun

- [ ] **Step 1 : tsc + lint global**

Run: `npx tsc --noEmit && npm run lint 2>&1 | grep -E "comparateur-vie\.ts|comparateur-labels\.ts|parse/route\.ts" && echo "(erreurs ci-dessus)" || echo "aucune erreur lint sur les fichiers touchés"`
Expected: tsc sans erreur ; aucune nouvelle erreur lint sur les fichiers touchés.

- [ ] **Step 2 : Témoin combinaison 40/60**

```bash
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
# une commune avec accès mais faible dynamisme ne doit pas dominer : score = 0.4*acces + 0.6*dyn
ex=[c for c in idx['communes'] if (c.get('etudes_acces') or 0)>=80 and (c.get('etudes_dyn') or 0)<=40][:3]
for c in ex:
    a=c['etudes_acces']; d=c['etudes_dyn']; print(c['nom'],'acces',a,'dyn',d,'-> score',round(0.4*a+0.6*d))
"
```
Expected : ces communes (accès fort, dynamisme faible) ont un score combiné tiré vers le bas par le 60 % dynamisme (cohérent avec « pas une vraie ville étudiante »).

- [ ] **Step 3 : État git** — Run: `git status --short` — Expected: aucun fichier source non committé.

- [ ] **Step 4 : finishing-a-development-branch** — Invoquer `superpowers:finishing-a-development-branch`. Ne pas merger sur `main` sans « push sur main ».

---

## Self-review (auteur du plan)

- **Couverture spec :** un critère combiné → Task 1 (subScore 40/60). accès BPE C5xx → Task 4. dynamisme part UU MESR → Task 5. champs index → Task 1 Step 1 + scripts. moteur (clé, reasons, label, glose) → Tasks 1-2. signal ambiant → Task 1 Step 6. parse → Task 3. vérif (villes étudiantes en tête, rural non pénalisé, 40/60, /ask) → Tasks 4/5/6.
- **Placeholders :** la validation des champs MESR (Task 5 Step 1) et le total France (Step 3) sont des contrôles explicites, pas des placeholders. Tout le code est complet.
- **Cohérence des types :** `c.etudes_acces` / `c.etudes_dyn` (number|null) identiques entre type `IndexCommune` (Task 1), scripts (Tasks 4/5) et `subScore`. Clé `vie_etudiante` cohérente dans `PREFERENCE_KEYS`, `subScore`, `REASON_POS/NEG`, `PREFERENCE_LABELS`, `PREFERENCE_INTERPRETATIONS`, `AMBIENT_DIMENSIONS`, parse. Agrégation UU réutilise le mapping `c.uu` + population (même logique que `uuPopCache` du chantier C).
