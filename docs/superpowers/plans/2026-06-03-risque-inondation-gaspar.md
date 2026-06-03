# Vrai risque inondation (GASPAR CatNat) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le proxy trompeur (« sans inondation » → pluies intenses) par un vrai critère opt-in `faible_risque_inondation`, fondé sur l'historique d'arrêtés CatNat inondation (GASPAR), précalculé dans l'index.

**Architecture:** Un script Python one-shot interroge l'API GASPAR `/gaspar/catnat` pour chaque commune (cache/reprise), compte les arrêtés inondation fluviale/pluviale (hors submersion marine), normalise en percentile national `risque`, et patche `comparateur-index.json` (`c.inondation = {catnat, tri, risque}`, `tri` réservé/false en V1). Le moteur expose `faible_risque_inondation` (subScore = 100 - risque). Le parse dissocie inondation (→ nouvelle clé) de pluies intenses (→ `faible_precip_extremes`, conservée dans son sens littéral).

**Tech Stack:** Python 3 (stdlib `urllib`/`json`/`bisect` — aucune dép, pas besoin du venv), Node/TypeScript (Next.js App Router), Anthropic tool use (parse). Vérification : `npx tsc --noEmit`, `npm run lint`, exécution script + témoins, `curl` parse/match. PAS de runner de test (AGENTS.md).

**Doctrine :** préférence graduée opt-in (jamais d'exclusion ni de pénalité par défaut) ; submersion marine EXCLUE (chantier littoral) ; module `/inondation` DRIAS inchangé ; pas de tiret cadratin ; le scoring ne passe jamais par l'IA. `grep -c` exit 1 sur 0 match (ne pas chaîner en `&&`).

---

## Faits établis en reconnaissance (ne pas re-deviner)

- API : `GET https://georisques.gouv.fr/api/v1/gaspar/catnat?code_insee=<INSEE>&page=1&page_size=500`.
  Réponse : `{ data: [...], total_pages, ... }`. Items : champ `libelle_risque_jo`. 1 page suffit
  par commune (max constaté ~31). Sans token.
- Filtre inondation fluviale/pluviale : label contient `"inondation"` (minuscule) ET NE contient
  PAS `"vague"` (la submersion marine = « Inondations par chocs mécaniques liés à l'action des
  vagues » → exclue). Vérifié sur Nîmes : 21 arrêtés inondation isolés de 7 sécheresse + tempête/etc.
- Pas de bulk CatNat national à jour (data.gouv = 2016, périmé) → loop API. Pas de liste TRI
  nationale propre → `tri` réservé false en V1.
- Index : `data/comparateur-index.json`, communes avec `insee`/`lat`/`lon`. `PREFERENCE_KEYS`,
  `IndexCommune`, subScore (switch), `REASON_POS`/`REASON_NEG` (typés `Record<PreferenceKey,...>`,
  donc une clé manquante = erreur tsc), `PREFERENCE_INTERPRETATIONS` (Record<string,string|null>).
- `faible_precip_extremes` existe déjà : label « moins de pluies intenses », REASON_POS « pluies
  extrêmes rares », `PREFERENCE_INTERPRETATIONS.faible_precip_extremes = null`, prompt parse
  « (proxy inondation) ».

---

## Fichiers touchés

- Create: `scripts/populate-inondation.py` — loop API GASPAR + patch index.
- Modify: `data/comparateur-index.json` — champ `inondation` (via script).
- Modify: `src/lib/comparateur-vie.ts` — `PREFERENCE_KEYS`, `IndexCommune`, subScore, reasons.
- Modify: `src/lib/comparateur-labels.ts` — label + 2 gloses.
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` — `PREF_LABELS`.
- Modify: `src/app/api/comparateur-vie/parse/route.ts` — routing + retrait proxy.

Nommage cohérent : clé `faible_risque_inondation` ; champ `c.inondation = {catnat:number, tri:boolean, risque:number}` ; cache `data/.cache/communes-inondation.json`.

---

### Task 1 : Script `populate-inondation.py` (loop API + patch index)

**Files:**
- Create: `scripts/populate-inondation.py`
- Modify (via `--write-index`): `data/comparateur-index.json`

- [ ] **Step 1 : Écrire le script**

Créer `scripts/populate-inondation.py` :

```python
#!/usr/bin/env python3
"""
populate-inondation.py — risque inondation par commune depuis GASPAR CatNat.

Compte les arrêtés de catastrophe naturelle de type INONDATION FLUVIALE/PLUVIALE
(débordement, ruissellement, coulées de boue) par commune via l'API georisques
/gaspar/catnat. EXCLUT la submersion marine (« chocs mécaniques liés à l'action des
vagues »), qui relève du chantier littoral. Normalise en percentile national -> risque.

Loop ~35k communes avec CACHE/REPRISE (relançable). Aucune dépendance (stdlib).
Usage :
    python3 scripts/populate-inondation.py                # remplit/complète le cache
    python3 scripts/populate-inondation.py --write-index  # + patche comparateur-index.json
"""
import json, os, sys, time, argparse, bisect
import urllib.request, urllib.parse, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
CACHE_DIR = os.path.join(ROOT, "data", ".cache")
CACHE = os.path.join(CACHE_DIR, "communes-inondation.json")
BASE = "https://georisques.gouv.fr/api/v1/gaspar/catnat"


def is_flood(label):
    l = (label or "").lower()
    return "inondation" in l and "vague" not in l


def fetch_count(insee):
    """Nombre d'arrêtés inondation (hors submersion marine) pour une commune. None si échec."""
    qs = urllib.parse.urlencode({"code_insee": insee, "page": "1", "page_size": "500"})
    url = f"{BASE}?{qs}"
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "futur-e/populate-inondation"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.loads(r.read().decode("utf-8"))
            data = d.get("data") or []
            return sum(1 for it in data if is_flood(it.get("libelle_risque_jo")))
        except (urllib.error.URLError, TimeoutError, ValueError):
            time.sleep(1.5 * (attempt + 1))
    return None


def load_cache():
    if os.path.exists(CACHE):
        return json.load(open(CACHE))
    return {}


def save_cache(cache):
    os.makedirs(CACHE_DIR, exist_ok=True)
    json.dump(cache, open(CACHE, "w"))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    idx = json.load(open(INDEX))
    communes = idx["communes"]
    cache = load_cache()  # { insee: count(int) }

    todo = [c["insee"] for c in communes if cache.get(c["insee"]) is None]
    print(f"communes : {len(communes)} | déjà en cache : {len(communes) - len(todo)} | à faire : {len(todo)}", file=sys.stderr)

    t0 = time.time()
    for i, insee in enumerate(todo):
        cnt = fetch_count(insee)
        if cnt is not None:
            cache[insee] = cnt
        time.sleep(0.05)  # politesse
        if (i + 1) % 500 == 0:
            save_cache(cache)
            print(f"  {i+1}/{len(todo)} ({time.time()-t0:.0f}s)", file=sys.stderr)
    save_cache(cache)
    done = sum(1 for c in communes if cache.get(c["insee"]) is not None)
    print(f"✓ cache : {done}/{len(communes)} communes renseignées", file=sys.stderr)

    # Percentile national du comptage -> risque (plus haut = plus exposé).
    counts = sorted(int(cache[c["insee"]]) for c in communes if cache.get(c["insee"]) is not None)
    n = len(counts)

    def risque(cnt):
        return round(100 * bisect.bisect_right(counts, int(cnt)) / n) if n else 0

    if args.write_index:
        for c in communes:
            cnt = cache.get(c["insee"])
            c["inondation"] = (
                {"catnat": int(cnt), "tri": False, "risque": risque(cnt)} if cnt is not None else None
            )
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champ inondation : catnat + tri + risque)", file=sys.stderr)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Lancer le loop (long : ~1-2h, relançable)**

```bash
python3 scripts/populate-inondation.py
```
Expected : progression « N/35000 ... », puis « cache : ~34788/34788 communes renseignées ». Si interrompu (réseau, Ctrl-C), RELANCER la même commande : le cache reprend où il s'est arrêté. Tolérer quelques communes non renseignées (API capricieuse) ; relancer une 2e fois pour les rattraper.

- [ ] **Step 3 : Témoins (sur le cache, sans patcher)**

```bash
python3 -c "
import json, bisect
cache=json.load(open('data/.cache/communes-inondation.json'))
idx=json.load(open('data/comparateur-index.json'))
counts=sorted(int(v) for v in cache.values())
n=len(counts)
risque=lambda c: round(100*bisect.bisect_right(counts,int(c))/n)
for code,label in [('30189','Nîmes'),('62498','Lens'),('13004','Arles'),('05061','Embrun (alt)'),('15014','Aurillac')]:
    v=cache.get(code)
    print(f'{label:16} catnat={v} risque={risque(v) if v is not None else None} subScore={100-risque(v) if v is not None else None}')
"
```
Expected (juger) : Nîmes/Lens/Arles → `catnat` élevé, `risque` haut, subScore bas ; une commune sèche d'altitude (Embrun) → `catnat` faible, subScore haut. Aucune valeur aberrante.

- [ ] **Step 4 : Patcher l'index + contrôle**

```bash
python3 scripts/populate-inondation.py --write-index 2>&1 | tail -2
python3 -c "
import json
idx=json.load(open('data/comparateur-index.json'))
byc={c['insee']:c for c in idx['communes']}
print('Nîmes:', byc['30189'].get('inondation'))
n=sum(1 for c in idx['communes'] if c.get('inondation'))
print('communes avec inondation:', n, '/', len(idx['communes']))
"
```
Expected : Nîmes a un `inondation` non nul (catnat>0, tri:false, risque haut) ; compte proche du total.

- [ ] **Step 5 : Gitignorer le cache (s'il ne l'est pas déjà) + commit**

```bash
git check-ignore data/.cache/communes-inondation.json || printf 'data/.cache/\n' >> .gitignore
git add .gitignore scripts/populate-inondation.py data/comparateur-index.json
git commit -m "feat(data): risque inondation (GASPAR CatNat fréquence) par commune dans l'index"
```
Note : `data/.cache/` est déjà ignoré (sprint BPE). Le cache n'est pas versionné ; le script est relançable pour le reconstruire.

---

### Task 2 : Moteur — clé, type, scoring, reasons

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter la clé à `PREFERENCE_KEYS`**

Dans `PREFERENCE_KEYS`, après `"acces_culture",` (dernières clés ajoutées), ajouter :

```ts
  // Risque inondation fluvial/pluvial : historique d'arrêtés CatNat (GASPAR), percentile national.
  // Opt-in, préférence graduée. Distinct de faible_precip_extremes (pluies, pas risque réel).
  "faible_risque_inondation",
```

- [ ] **Step 2 : Champ `inondation` dans `IndexCommune`**

Après `uu?: string | null;` (ajouté au sprint précédent), ajouter :

```ts
  // Risque inondation (cf. scripts/populate-inondation.py). catnat = nb d'arrêtés CatNat
  // inondation (hors submersion marine) ; tri réservé (false en V1) ; risque 0-100 (haut = exposé).
  inondation?: { catnat: number; tri: boolean; risque: number } | null;
```

- [ ] **Step 3 : subScore**

Dans la fonction de score, après `case "acces_culture":` ... `return c.culture?.score ?? null;`, ajouter :

```ts
    case "faible_risque_inondation":
      // risque faible -> score haut. Historique CatNat inondation, pas une garantie d'absence de crue.
      return c.inondation == null ? null : 100 - c.inondation.risque;
```

- [ ] **Step 4 : Reasons (libellés validés porteur)**

Dans `REASON_POS`, après `acces_culture: "équipements culturels accessibles autour",`, ajouter :

```ts
  faible_risque_inondation: "peu d'arrêtés CatNat inondation",
```

Dans `REASON_NEG`, après `acces_culture: "offre culturelle accessible plus limitée",`, ajouter :

```ts
  faible_risque_inondation: "historique CatNat inondation plus marqué",
```

- [ ] **Step 5 : Compilation + tiret cadratin (ajouts)**

```bash
npx tsc --noEmit
echo "exit: $?"
grep -nE "faible_risque_inondation" src/lib/comparateur-vie.ts | grep "—" || echo "aucun tiret cadratin dans les ajouts"
```
Expected : `tsc` exit 0 (les `Record<PreferenceKey,...>` forceraient une erreur si un libellé manquait).

- [ ] **Step 6 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): critère faible_risque_inondation (clé, type, scoring, reasons)"
```

---

### Task 3 : Libellés & gloses

**Files:**
- Modify: `src/lib/comparateur-labels.ts`
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts`

- [ ] **Step 1 : `PREFERENCE_LABELS` (comparateur-labels.ts)**

Dans `PREFERENCE_LABELS`, après `acces_culture: "l'accès à une offre culturelle",`, ajouter :

```ts
  faible_risque_inondation: "un faible risque d'inondation",
```

- [ ] **Step 2 : `PREFERENCE_INTERPRETATIONS` — nouvelle glose + corriger celle de precip**

Dans `PREFERENCE_INTERPRETATIONS`, ajouter la glose inondation (après celle de `acces_culture`) :

```ts
  faible_risque_inondation: "historique d'arrêtés CatNat inondation et territoires à risque important, pas une garantie d'absence de crue",
```

Puis remplacer la ligne `faible_precip_extremes: null,` par :

```ts
  faible_precip_extremes: "pluies intenses projetées, pas le risque d'inondation réel",
```

- [ ] **Step 3 : `PREF_LABELS` de la synthèse (synthesize/route.ts)**

Dans `PREF_LABELS`, après `acces_culture: "l'accès à une offre culturelle",`, ajouter :

```ts
  faible_risque_inondation: "un faible risque d'inondation",
```

- [ ] **Step 4 : Vérif + commit**

```bash
npx tsc --noEmit
echo "exit: $?"
npm run lint 2>&1 | grep -iE "comparateur-labels|synthesize/route" || echo "aucune erreur lint sur les 2 fichiers"
grep -n "—" src/lib/comparateur-labels.ts | grep -i "inondation\|precip" || echo "aucun tiret cadratin dans les ajouts"
git add src/lib/comparateur-labels.ts src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): libellés + gloses inondation, glose precip explicite (fin du proxy)"
```

---

### Task 4 : Parse — routing dissocié

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Retirer « (proxy inondation) » et ajouter la ligne inondation dans la LISTE**

Repérer dans le prompt SYSTEM la ligne :
```
- faible_precip_extremes : moins de pluies intenses (proxy inondation)
```
La remplacer par :
```
- faible_precip_extremes : moins de pluies intenses / orages violents / épisodes de précipitations extrêmes (PAS le risque d'inondation réel)
- faible_risque_inondation : faible risque d'inondation fluviale/pluviale (historique d'arrêtés CatNat inondation). Pour « inondation », « inondable », « zone inondable », « crue », « débordement », « ruissellement », « sans risque d'inondation »
```

- [ ] **Step 2 : Ajouter une règle de dissociation explicite (anti-confusion)**

Repérer la section TRADUCTION/règles climat (près de la ligne sur le climat perçu). Juste après la ligne `- Climat perçu : ...`, ajouter :

```
- Inondation vs pluies (ne pas confondre) : « inondation / crue / zone inondable / débordement / ruissellement / sans risque d'inondation » → faible_risque_inondation (risque réel). « pluies intenses / orages violents / grosses averses / précipitations extrêmes » → faible_precip_extremes (pluie, pas inondation). Ne routez JAMAIS « inondation » vers faible_precip_extremes.
```

- [ ] **Step 3 : Vérif + commit**

```bash
npx tsc --noEmit
echo "exit: $?"
grep -n "—" src/app/api/comparateur-vie/parse/route.ts || echo "aucun tiret cadratin"
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse dissocie inondation (faible_risque_inondation) des pluies intenses"
```

---

### Task 5 : Vérification end-to-end

**Files:** aucun.

- [ ] **Step 1 : Serveur dev**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ou-vivre  # 200 ; sinon `npm run dev`
```

- [ ] **Step 2 : `/parse` — dissociation (champ `text`, réponse sous `parsed`)**

```bash
# inondation -> faible_risque_inondation (PAS precip)
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' \
  -d '{"text":"je veux éviter les zones inondables, surtout pas de risque de crue"}' \
  | python3 -c "import sys,json;p=json.load(sys.stdin)['parsed']['preferences'];print([x['key'] for x in p])"
# pluies intenses -> faible_precip_extremes (PAS inondation)
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' \
  -d '{"text":"je supporte mal les gros orages et les pluies violentes à répétition"}' \
  | python3 -c "import sys,json;p=json.load(sys.stdin)['parsed']['preferences'];print([x['key'] for x in p])"
```
Expected : 1er → contient `faible_risque_inondation`, PAS `faible_precip_extremes`. 2e → contient `faible_precip_extremes`, PAS `faible_risque_inondation`.

- [ ] **Step 3 : `/match` — risque inondation reflété**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
  -d '{"parsed":{"reformulation":"éviter l inondation","hardConstraints":{},"preferences":[{"key":"faible_risque_inondation","weight":3}]}}' \
  | python3 -c "
import sys,json
d=json.load(sys.stdin); res=d.get('results') or []
for r in res[:6]: print(' ', r.get('nom'), '|', (r.get('reasons') or [])[:2])
"
```
Expected : des communes peu exposées en tête ; la reason « peu d'arrêtés CatNat inondation » apparaît ; Nîmes/Lens/Arles ne dominent pas. Lancer aussi un projet sans ce critère (`nature` seul) et vérifier qu'une commune exposée n'est pas pénalisée quand l'inondation n'est pas demandée.

- [ ] **Step 4 : Rien à committer (vérification).**

---

## Self-Review (effectuée)

- **Couverture spec :** données CatNat freq via loop API + cache/reprise + exclusion submersion marine (Task 1) ✓ ; clé `faible_risque_inondation` opt-in graduée + subScore 100-risque + reasons validés (Task 2) ✓ ; `c.inondation={catnat,tri,risque}`, tri réservé false (Task 1 Step 4, Task 2 Step 2) ✓ ; gloses verbatim + glose precip explicite (fin proxy) (Task 3) ✓ ; parse dissocie inondation/pluies, retire « proxy inondation » (Task 4) ✓ ; faible_precip_extremes conservée littérale (Task 4 Step 1) ✓ ; vérif témoins + curls + rural non pénalisé (Task 1 Step 3, Task 5) ✓ ; module /inondation DRIAS non touché (absent du plan) ✓.
- **Placeholders :** aucun ; le script et tous les edits sont fournis intégralement. Le caractère « long » du loop est opérationnel, pas un trou.
- **Cohérence des noms :** clé `faible_risque_inondation`, champ `c.inondation={catnat,tri,risque}`, cache `communes-inondation.json` — identiques de Task 1 à Task 5.

## Hors périmètre

TRI (différé, champ `tri` réservé), submersion marine (chantier littoral), module `/inondation` DRIAS, risque parcellaire/adresse (rapport), exclusion dure.
