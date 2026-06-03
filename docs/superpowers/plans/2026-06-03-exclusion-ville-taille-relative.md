# Exclusion ville (UU INSEE) + taille relative — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** « Quitter {ville} » exclut l'unité urbaine de la ville (pas le département), et « plus petit/grand que {ville} » filtre par taille relative, via la table d'appartenance UU2020 INSEE patchée dans l'index.

**Architecture:** Un script Python one-shot lit la table d'appartenance INSEE (xlsx, lecture XML brute car openpyxl bute sur la feuille de styles INSEE) et patche `comparateur-index.json` avec `c.uu` (code UU2020, ou null hors unité urbaine). Le parse émet deux nouveaux champs (`excludePlace`, `sizeRelativeTo`) portant le LABEL de ville ; le moteur résout label→commune (via `nameIndex`) puis exclut par code UU et/ou pose `communeSize`. Paris/Lyon/Marseille (communes à arrondissements, absentes de l'index par code commune) sont gérés par un alias dédié.

**Tech Stack:** Python 3 (venv `.venv-bpe`, stdlib `zipfile`/`xml.etree`, aucune dép nouvelle), Node/TypeScript (Next.js App Router), Anthropic tool use (parse). Vérification : `npx tsc --noEmit`, `npm run lint`, exécution script + témoins, `curl` parse/match. PAS de runner de test (AGENTS.md).

**Doctrine :** A propre dès maintenant (exclusion par UU) ; B simple (population communale de référence, limite assumée documentée) ; C différé ; « quitter Paris » reste le cas spécial petite couronne ; pas de tiret cadratin ; le scoring ne passe jamais par l'IA. `grep -c` exit 1 sur 0 match (ne pas chaîner en `&&`).

---

## Faits établis en reconnaissance (ne pas re-deviner)

- Source : `https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2023.zip` (~1 Mo, zip → `UU2020_au_01-01-2023.xlsx`). Validé : 200, contenu confirmé.
- Feuille `Composition_communale` = `xl/worksheets/sheet3.xml` (l'ordre des fichiers sheetN ne suit PAS l'ordre déclaré ; résoudre via `xl/_rels/workbook.xml.rels`). En-tête (ligne 0-based 5) : `CODGEO, LIBGEO, UU2020, LIBUU2020, TYPE_COMMUNE_UU, STATUT_COM_UU, DEP`. Données dès la ligne 6.
- Hors unité urbaine : `STATUT_COM_UU == "H"` (code UU type `<DEP>000`, ex. `01000`). On normalise alors `c.uu = null`.
- `openpyxl` ÉCHOUE sur ce xlsx (stylesheet INSEE : « Colors must be aRGB hex values »). On lit le XML brut (zip + sharedStrings).
- PLM : la table indexe Lyon=`69123`→UU `00760`, Paris=`75056`→UU `00851`, Marseille=`13055`→UU `00759`. MAIS l'index `comparateur-index.json` n'a PAS ces codes commune : il a les arrondissements (`69381..69389`, `75101..75120`, `13201..13216`). Donc : (a) le script attribue l'UU parente aux arrondissements ; (b) le moteur résout « Lyon/Paris/Marseille » par alias direct (nom → UU + population).
- `nameIndex()` (comparateur-vie.ts:416) : `Map<normalizeName(nom), IndexCommune>`. `normalizeName` (ligne 407) gère casse/accents. Réutilisé pour résoudre les villes de référence.
- `passesHard` (ligne ~682) filtre ; exclusions actuelles = niveau département (`excludeDepts`). On ajoute exclusion par UU + par INSEE.

---

## Fichiers touchés

- Create: `scripts/populate-unite-urbaine.py` — patch `c.uu` dans l'index.
- Modify: `data/comparateur-index.json` — champ `uu` par commune (via script).
- Modify: `src/lib/comparateur-vie.ts` — types `IndexCommune.uu`, `HardConstraints.excludePlace`/`sizeRelativeTo`, alias PLM, résolution + `passesHard`.
- Modify: `src/app/api/comparateur-vie/parse/route.ts` — schéma + prompt.
- Data locale (gitignorée) : `data/uu2020.xlsx`.

Nommage cohérent dans tout le plan : champ index `c.uu` (string|null) ; champs parse `excludePlace: {label}[]`, `sizeRelativeTo: {label, direction:"smaller"|"larger"}` ; sets moteur `excludeUU`, `excludeInsee` ; const `PLM_VILLES`.

---

### Task 1 : Acquérir la table d'appartenance UU2020

**Files:** produit `data/uu2020.xlsx` local + gitignore.

- [ ] **Step 1 : Télécharger (petit fichier ~1 Mo, validé en reconnaissance)**

```bash
cd "$(git rev-parse --show-toplevel)"
curl -L --fail -o /tmp/uu2020.zip "https://www.insee.fr/fr/statistiques/fichier/4802589/UU2020_au_01-01-2023.zip"
cd /tmp && unzip -o uu2020.zip && cp "UU2020_au_01-01-2023.xlsx" "$(git rev-parse --show-toplevel)/data/uu2020.xlsx"
cd "$(git rev-parse --show-toplevel)" && ls -lh data/uu2020.xlsx
```
Expected : `data/uu2020.xlsx` présent (~1,4 Mo).

- [ ] **Step 2 : Gitignorer le xlsx source**

```bash
printf '\n# Table d appartenance UU2020 (source locale, non versionnée)\ndata/uu2020.xlsx\n' >> .gitignore
git add .gitignore && git commit -m "chore: ignorer data/uu2020.xlsx (source UU INSEE locale)"
```

---

### Task 2 : Script `populate-unite-urbaine.py`

**Files:**
- Create: `scripts/populate-unite-urbaine.py`
- Modify (via `--write-index`): `data/comparateur-index.json`

- [ ] **Step 1 : Écrire le script**

Créer `scripts/populate-unite-urbaine.py` :

```python
#!/usr/bin/env python3
"""
populate-unite-urbaine.py — patche l'index avec l'unité urbaine (UU2020) par commune.

Source : data/uu2020.xlsx (table d'appartenance INSEE, feuille Composition_communale).
Lecture XML brute (openpyxl bute sur la feuille de styles INSEE). Hors unité urbaine
(STATUT_COM_UU == "H") -> uu = None. Paris/Lyon/Marseille : l'index a les arrondissements,
pas le code commune ; on leur attribue l'UU parente.
Usage (venv .venv-bpe) :
    python scripts/populate-unite-urbaine.py                # diff seulement
    python scripts/populate-unite-urbaine.py --write-index  # patche l'index
"""
import json, os, sys, argparse, re, zipfile
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INDEX = os.path.join(ROOT, "data", "comparateur-index.json")
XLSX = os.path.join(ROOT, "data", "uu2020.xlsx")
NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
RNS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

# Arrondissements -> commune parente (PLM). Ranges INSEE.
def parent_plm(code):
    if "75101" <= code <= "75120": return "75056"
    if "69381" <= code <= "69389": return "69123"
    if "13201" <= code <= "13216": return "13055"
    return None


def colnum(ref):
    c = re.match("[A-Z]+", ref).group(); n = 0
    for ch in c: n = n * 26 + (ord(ch) - 64)
    return n


def read_composition():
    """Retourne {CODGEO: uu|None} depuis la feuille Composition_communale."""
    z = zipfile.ZipFile(XLSX)
    sst = ET.fromstring(z.read("xl/sharedStrings.xml"))
    ss = ["".join(t.text or "" for t in si.iter(NS + "t")) for si in sst.iter(NS + "si")]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2tgt = {r.get("Id"): r.get("Target") for r in rels}
    fn = None
    for s in wb.iter(NS + "sheet"):
        if s.get("name") == "Composition_communale":
            fn = "xl/" + rid2tgt[s.get(RNS + "id")].lstrip("/")
    sh = ET.fromstring(z.read(fn))
    out = {}
    for ri, row in enumerate(sh.iter(NS + "row")):
        if ri < 6:  # 4 lignes de titre + 1 libellé + 1 en-tête VAR
            continue
        cells = {}
        for c in row.iter(NS + "c"):
            v = c.find(NS + "v"); val = v.text if v is not None else None
            if c.get("t") == "s" and val is not None:
                val = ss[int(val)]
            cells[colnum(c.get("r"))] = val
        cod, uu, statut = cells.get(1), cells.get(3), cells.get(6)
        if not cod:
            continue
        out[cod] = None if statut == "H" else uu
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-index", action="store_true")
    args = ap.parse_args()

    comp = read_composition()
    print(f"table : {len(comp)} communes", file=sys.stderr)
    idx = json.load(open(INDEX))

    matched = plm = missing = 0
    patch = {}
    for c in idx["communes"]:
        code = c["insee"]
        if code in comp:
            patch[code] = comp[code]; matched += 1
        else:
            par = parent_plm(code)
            if par and par in comp:
                patch[code] = comp[par]; plm += 1
            else:
                patch[code] = None; missing += 1
    print(f"matched={matched} plm_arrond={plm} sans_uu/absents={missing}", file=sys.stderr)

    if args.write_index:
        for c in idx["communes"]:
            c["uu"] = patch.get(c["insee"])
        json.dump(idx, open(INDEX, "w"))
        print("✓ index patché (champ uu)", file=sys.stderr)
    return patch


if __name__ == "__main__":
    main()
```

- [ ] **Step 2 : Smoke test + témoins (sans patcher)**

```bash
./.venv-bpe/bin/python scripts/populate-unite-urbaine.py 2>&1 | tail -3
```
Expected : `table : ~34945 communes`, `matched` proche du nombre de communes de l'index, `plm_arrond` ≈ 45 (20 Paris + 9 Lyon + 16 Marseille). Puis vérifier les témoins :

```bash
./.venv-bpe/bin/python -c "
import sys; sys.argv=['x']
import importlib.util as u
spec=u.spec_from_file_location('p','scripts/populate-unite-urbaine.py'); m=u.module_from_spec(spec); spec.loader.exec_module(m)
comp=m.read_composition()
import json
idx=json.load(open('data/comparateur-index.json'))
codes={c['insee'] for c in idx['communes']}
# arrondissements PLM -> uu parente
for code in ['69381','75101','13201','35047','35281','33063','59350','48095']:
    par=m.parent_plm(code)
    uu = comp.get(code) if code in comp else (comp.get(par) if par else None)
    print(code, 'parent', par, '-> uu', uu, '| dans index:', code in codes)
"
```
Expected (juger) : `69381 -> uu 00760` (Lyon), `75101 -> uu 00851` (Paris), `13201 -> uu 00759` (Marseille) ; `35047`/`35281` (Bruz/… agglo Rennes) -> `35701` ; `33063` (Bordeaux) et `59350` (Lille) -> un code UU non nul ; `48095` (Mende) -> None ou UU mono-commune.

- [ ] **Step 3 : Patcher l'index + contrôle**

```bash
./.venv-bpe/bin/python scripts/populate-unite-urbaine.py --write-index 2>&1 | tail -2
./.venv-bpe/bin/python -c "
import json
idx=json.load(open('data/comparateur-index.json'))
byc={c['insee']:c for c in idx['communes']}
print('Lyon 1er uu:', byc['69381'].get('uu'))
print('Villeurbanne uu:', byc.get('69266',{}).get('uu'))
n=sum(1 for c in idx['communes'] if c.get('uu'))
print('communes avec uu non nul:', n, '/', len(idx['communes']))
"
```
Expected : `69381` et `69266` partagent `00760` ; le compte de communes en UU est de l'ordre de ~50-60% (le reste hors-UU).

- [ ] **Step 4 : Commit (script + index)**

```bash
git add scripts/populate-unite-urbaine.py data/comparateur-index.json
git commit -m "feat(data): unité urbaine (UU2020 INSEE) par commune dans l'index"
```

---

### Task 3 : Moteur — types, alias PLM, résolution, filtre

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

- [ ] **Step 1 : Ajouter `uu` au type `IndexCommune`**

Après `culture?: { score: number | null; count: number } | null;` (ajouté au sprint précédent), ajouter :

```ts
  // Unité urbaine INSEE (UU2020, cf. scripts/populate-unite-urbaine.py). null = commune hors
  // unité urbaine (isolée/rurale). Sert à « quitter {ville} » (exclusion par agglomération).
  uu?: string | null;
```

- [ ] **Step 2 : Étendre `HardConstraints`**

Dans le type `HardConstraints`, après `communeSize?: { min?: number | null; max?: number | null } | null;`, ajouter :

```ts
  // « Quitter {ville} » : exclut l'unité urbaine de la ville (le moteur résout label -> UU).
  excludePlace?: { label: string }[];
  // « Plus petit / grand que {ville} » : le moteur résout label -> population communale de
  // référence et pose communeSize (V1 : comparaison COMMUNALE, pas d'agglomération, cf. spec).
  sizeRelativeTo?: { label: string; direction: "smaller" | "larger" } | null;
```

- [ ] **Step 3 : Ajouter l'alias PLM**

Juste avant `export async function matchProjects`, ajouter :

```ts
// Paris / Lyon / Marseille : communes à arrondissements. L'index les stocke par arrondissement
// (75101.., 69381.., 13201..), pas par code commune, et nameIndex ne connaît donc pas « Lyon ».
// On résout ces 3 villes par alias direct : nom normalisé -> { uu, pop municipale INSEE }.
const PLM_VILLES: Record<string, { uu: string; pop: number }> = {
  paris: { uu: "00851", pop: 2_133_111 },
  lyon: { uu: "00760", pop: 522_250 },
  marseille: { uu: "00759", pop: 873_076 },
};
```

- [ ] **Step 4 : Étendre la signature de `passesHard`**

Repérer la signature de `passesHard` (commence vers la ligne 680, paramètres `c, hc, placePoint, zoneDepts, excludeDepts`). Ajouter deux paramètres :

```ts
  excludeDepts: Set<string>,
  excludeUU: Set<string>,
  excludeInsee: Set<string>,
): boolean {
```

Puis, juste après la ligne `if (excludeDepts.has(c.dept)) return false;`, ajouter :

```ts
  // Exclusion de ville par unité urbaine (« quitter Lyon ») et par commune (ville hors-UU).
  if (c.uu && excludeUU.has(c.uu)) return false;
  if (excludeInsee.has(c.insee)) return false;
```

- [ ] **Step 5 : Résoudre excludePlace + sizeRelativeTo dans `matchProjects`**

Dans `matchProjects`, REMPLACER le bloc actuel de résolution `nearPlace` (lignes ~822-828) :

```ts
  // Résolution nearPlace (label → coords d'une commune de l'index)
  let placePoint: { lat: number; lon: number; maxKm: number } | null = null;
  if (parsed.hardConstraints?.nearPlace?.label) {
    const names = await nameIndex();
    const hit = names.get(normalizeName(parsed.hardConstraints.nearPlace.label));
    if (hit) placePoint = { lat: hit.lat, lon: hit.lon, maxKm: parsed.hardConstraints.nearPlace.maxKm ?? 50 };
  }
```

par :

```ts
  const hc = parsed.hardConstraints ?? {};

  // nameIndex partagé : nearPlace (proximité), excludePlace (exclusion agglo), sizeRelativeTo (taille).
  const needNames =
    !!hc.nearPlace?.label || (hc.excludePlace?.length ?? 0) > 0 || !!hc.sizeRelativeTo?.label;
  const names = needNames ? await nameIndex() : null;

  // Résolution nearPlace (label → coords d'une commune de l'index)
  let placePoint: { lat: number; lon: number; maxKm: number } | null = null;
  if (hc.nearPlace?.label && names) {
    const hit = names.get(normalizeName(hc.nearPlace.label));
    if (hit) placePoint = { lat: hit.lat, lon: hit.lon, maxKm: hc.nearPlace.maxKm ?? 50 };
  }

  // Exclusion de ville (« quitter {ville} ») par unité urbaine ; ville hors-UU → la commune seule.
  const excludeUU = new Set<string>();
  const excludeInsee = new Set<string>();
  for (const ep of hc.excludePlace ?? []) {
    const key = normalizeName(ep?.label ?? "");
    if (!key) continue;
    const plm = PLM_VILLES[key];
    if (plm) { excludeUU.add(plm.uu); continue; }
    const hit = names?.get(key);
    if (!hit) continue; // ville inconnue : ignorée (pas de filtre, pas d'erreur)
    if (hit.uu) excludeUU.add(hit.uu);
    else excludeInsee.add(hit.insee);
  }

  // Taille relative (« plus petit/grand que {ville} ») → population communale de référence.
  if (hc.sizeRelativeTo?.label && names) {
    const key = normalizeName(hc.sizeRelativeTo.label);
    const refPop = PLM_VILLES[key]?.pop ?? names.get(key)?.population ?? null;
    if (refPop != null) {
      const cs = hc.communeSize ?? {};
      if (hc.sizeRelativeTo.direction === "smaller") {
        cs.max = Math.min(cs.max ?? Infinity, refPop);
      } else {
        cs.min = Math.max(cs.min ?? 0, refPop);
      }
      hc.communeSize = cs;
    }
  }
```

Note : ce bloc DÉFINIT désormais `const hc = ...`. SUPPRIMER la ligne `const hc = parsed.hardConstraints ?? {};` plus bas (vers la ligne ~833) pour éviter la double déclaration.

- [ ] **Step 6 : Passer les nouveaux sets à l'appel de `passesHard`**

Repérer l'appel (vers la ligne ~877) :

```ts
  const candidates = communes.filter((c) =>
    passesHard(c, hc, placePoint, zone.hardDepartements, exclusion.departements),
  );
```

le remplacer par :

```ts
  const candidates = communes.filter((c) =>
    passesHard(c, hc, placePoint, zone.hardDepartements, exclusion.departements, excludeUU, excludeInsee),
  );
```

- [ ] **Step 7 : Compilation + tiret cadratin (ajouts)**

```bash
npx tsc --noEmit
grep -nE "excludePlace|sizeRelativeTo|PLM_VILLES|excludeUU" src/lib/comparateur-vie.ts | grep "—" || echo "aucun tiret cadratin dans les ajouts"
```
Expected : `tsc` exit 0 (si « hc redéclaré », appliquer la suppression du Step 5). Aucun tiret cadratin.

- [ ] **Step 8 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): exclusion ville par UU + taille relative (moteur, alias PLM)"
```

---

### Task 4 : Parse — schéma + prompt

**Files:**
- Modify: `src/app/api/comparateur-vie/parse/route.ts`

- [ ] **Step 1 : Ajouter les champs au schéma `hardConstraints`**

Dans l'objet `properties` de `hardConstraints` du schéma de l'outil (là où sont `nearPlace`, `communeSize`…), ajouter :

```ts
        excludePlace: {
          type: "array",
          description:
            "Villes que l'utilisateur veut QUITTER (\"quitter Lyon\", \"fuir Bordeaux\", \"ne plus vivre à Lille\"). Le moteur exclut l'agglomération de la ville. Donnez le nom de la ville tel quel. EXCEPTION : Paris et la région parisienne vont dans excludeZones (paris / idf), PAS ici.",
          items: {
            type: "object",
            properties: { label: { type: "string" } },
            required: ["label"],
          },
        },
        sizeRelativeTo: {
          type: "object",
          description:
            "Taille relative à une ville citée : \"plus petit que Lyon\", \"pas plus grand que Bordeaux\", \"une ville plus grande que Niort\". Donnez le nom de la ville et la direction. Le moteur résout la taille.",
          properties: {
            label: { type: "string" },
            direction: { type: "string", enum: ["smaller", "larger"] },
          },
          required: ["label", "direction"],
        },
```

- [ ] **Step 2 : Mettre à jour le prompt SYSTEM (section exclusions)**

Repérer la ligne du prompt :
```
- Exclusions → excludeZones. "quitter Paris" → excludeZones:["paris"]. "pas le Nord" → excludeZones:["nord"].
```
La remplacer par :
```
- Exclusions de ZONE → excludeZones (jetons fermés). "pas le Nord" → excludeZones:["nord"]. "quitter Paris" / "la région parisienne" → excludeZones:["paris"|"idf"] (cas spécial petite couronne, NE PAS utiliser excludePlace).
- Exclusion de VILLE → excludePlace. "quitter Lyon", "fuir Bordeaux", "ne plus vivre à Lille", "partir de Nantes" → excludePlace:[{label:"Lyon"}] etc. (le moteur exclut l'agglomération). Une ville n'est PAS un jeton de zone : ne la mettez jamais dans excludeZones.
- TAILLE RELATIVE → sizeRelativeTo. "plus petit que Lyon", "pas plus grand que Bordeaux" → {label:"Lyon", direction:"smaller"}. "plus grand que Niort" → {label:"Niort", direction:"larger"}. Donnez le label brut, jamais une population.
```

- [ ] **Step 3 : Compilation + tiret cadratin**

```bash
npx tsc --noEmit
grep -n "—" src/app/api/comparateur-vie/parse/route.ts || echo "aucun tiret cadratin"
```
Expected : `tsc` exit 0 ; aucun tiret cadratin.

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/comparateur-vie/parse/route.ts
git commit -m "feat(comparateur): parse émet excludePlace et sizeRelativeTo (ville → moteur)"
```

---

### Task 5 : Affichage / outcome (libellés de périmètre)

**Files:**
- Modify: `src/lib/comparateur-vie.ts`

Objectif : surfacer en clair les contraintes ville/taille appliquées, comme les zones (`appliedZones`/`outcome.message`). On reste minimal et honnête : on n'affiche que ce qui a effectivement résolu.

- [ ] **Step 1 : Repérer comment l'outcome expose déjà le périmètre**

```bash
grep -n "appliedZones\|outcome\|message\|applied\b\|perimetre\|MatchOutcome" src/lib/comparateur-vie.ts | head -20
```
Lire le type `MatchOutcome` et la construction de l'`outcome` (zones appliquées). Identifier le tableau/structure qui liste le périmètre appliqué (ex. `applied` issu de `resolveExclusions`/`resolveZoneAnchors`).

- [ ] **Step 2 : Ajouter les libellés ville/taille au périmètre appliqué**

Au moment où l'outcome agrège le périmètre (là où `exclusion.applied` / `zone.applied` sont rassemblés), ajouter des entrées dérivées des résolutions du Task 3 :
- pour chaque `excludePlace` RÉSOLU (UU ou commune ajoutée) : un libellé `exclusion de l'agglomération de {label}` (réutiliser le label d'origine, capitalisé) ;
- pour un `sizeRelativeTo` RÉSOLU : `communes plus petites que {label}` (smaller) ou `communes plus grandes que {label}` (larger).

Implémentation : pendant la boucle de résolution (Task 3 Step 5), accumuler `const appliedPlaces: string[] = []` et y pousser le libellé quand la résolution aboutit (ville trouvée / PLM). Puis inclure `appliedPlaces` dans l'objet `outcome` retourné (au même endroit que les zones appliquées). Adapter au type `MatchOutcome` réel constaté au Step 1 (ne pas inventer de champ : si l'outcome porte déjà une liste de libellés de périmètre, y ajouter ; sinon ajouter un champ `appliedPlaces?: string[]`).

- [ ] **Step 3 : Compilation + commit**

```bash
npx tsc --noEmit
grep -n "—" src/lib/comparateur-vie.ts || echo "aucun tiret cadratin"
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): surface exclusion ville / taille relative dans l'outcome"
```

---

### Task 6 : Vérification end-to-end

**Files:** aucun.

- [ ] **Step 1 : Serveur dev**

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ou-vivre  # 200 attendu, sinon `npm run dev`
```

- [ ] **Step 2 : `/parse` — exclusion + taille (rappel : champ `text`, réponse sous `parsed`)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' \
  -d '{"text":"je veux quitter Lyon, idéalement une ville plus petite que Lyon"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin)['parsed'];print('exclP:',d['hardConstraints'].get('excludePlace'));print('size:',d['hardConstraints'].get('sizeRelativeTo'))"
```
Expected : `excludePlace:[{label:"Lyon"}]` et `sizeRelativeTo:{label:"Lyon",direction:"smaller"}`.

- [ ] **Step 3 : `/parse` — Paris reste en excludeZones**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/parse -H 'Content-Type: application/json' \
  -d '{"text":"on veut quitter Paris pour la province"}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin)['parsed'];print('exclZones:',d['hardConstraints'].get('excludeZones'));print('exclP:',d['hardConstraints'].get('excludePlace'))"
```
Expected : `excludeZones` contient `paris` (ou `idf`) ; `excludePlace` absent/vide.

- [ ] **Step 4 : `/match` — exclusion Lyon effective**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
  -d '{"parsed":{"reformulation":"quitter Lyon","hardConstraints":{"excludePlace":[{"label":"Lyon"}]},"preferences":[{"key":"acces_services","weight":2}]}}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);res=d.get('results') or d.get('matches') or [];noms=[r.get('nom') for r in res];print('communes:',noms[:8]);print('Lyon/Villeurbanne/Vénissieux présents ?', any(n in ('Lyon','Lyon 1er Arrondissement','Villeurbanne','Vénissieux') for n in noms))"
```
Expected : aucune commune de l'agglo lyonnaise (Lyon arrondissements, Villeurbanne, Vénissieux) dans les résultats.

- [ ] **Step 5 : `/match` — taille relative + ville inconnue inoffensive**

```bash
# plus petit que Lyon : aucune commune de population > ~522k
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
  -d '{"parsed":{"reformulation":"plus petit que Lyon","hardConstraints":{"sizeRelativeTo":{"label":"Lyon","direction":"smaller"}},"preferences":[{"key":"acces_services","weight":2}]}}' \
  | python3 -c "import sys,json;d=json.load(sys.stdin);res=d.get('results') or d.get('matches') or [];print('top:',[ (r.get('nom')) for r in res[:6]])"
# ville inconnue : aucun crash, aucun filtre
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
  -d '{"parsed":{"reformulation":"quitter Trifouillis","hardConstraints":{"excludePlace":[{"label":"Trifouillis-les-Oies"}]},"preferences":[{"key":"nature","weight":2}]}}'
```
Expected : la liste « plus petit que Lyon » ne contient que des villes plus petites que Lyon ; la requête ville inconnue renvoie `200` (aucune erreur), résultats non filtrés par l'exclusion.

- [ ] **Step 6 : Rien à committer (vérification). Corriger dans la tâche concernée si anomalie.**

---

## Self-Review (effectuée)

- **Couverture spec :** donnée UU via table INSEE + script (Task 1-2) ✓ ; A exclusion par UU + PLM (Task 3 Step 3-6) ✓ ; B taille relative communale + limite assumée (Task 3 Step 5, commentaire) ✓ ; Paris reste excludeZones (Task 4 Step 2) ✓ ; parse excludePlace/sizeRelativeTo (Task 4) ✓ ; outcome libellés (Task 5) ✓ ; communeSize « le plus contraignant » via Math.min/max (Task 3 Step 5) ✓ ; robustesse ville inconnue (Task 3 Step 5, Task 6 Step 5) ✓ ; C hors périmètre (non traité, conforme).
- **Placeholders :** Task 5 décrit l'intégration à l'outcome RÉEL (constaté au Step 1) plutôt que d'inventer une structure ; c'est une adaptation guidée, pas un trou, car le type `MatchOutcome` doit être lu d'abord. Le reste est du code complet.
- **Cohérence des noms :** `c.uu`, `excludePlace`/`sizeRelativeTo`, `excludeUU`/`excludeInsee`, `PLM_VILLES`, directions `smaller`/`larger` — identiques de Task 2 à Task 6.

## Hors périmètre (différé, cf. spec)

C (sémantique petite ville/calme/isolé agglo-aware), taille B sur agglomération, AAV, unification « quitter Paris » avec UU.
