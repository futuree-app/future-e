# Pression climatique inondation (signal narratif) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter `climatInondation`, un signal narratif complémentaire (hors score, hors tri, hors reasons) qui n'apparaît que lorsque la trajectoire DRIAS des pluies extrêmes change la lecture de l'historique CatNat observé.

**Architecture:** Pur moteur + narration, zéro repopulation : toutes les entrées (`c.inondation.risque`, `c.pct.NORRx1d_yr`, `c.pct.NORRRq99_yr`) sont déjà dans l'index. Un builder `buildClimatInondation(c)` calcule une phrase ou `null` ; elle est posée sur `MatchResult.climatInondation`, injectée dans la map `signaux` (canal AskFuture existant) et threadée dans le payload synthèse sous condition que `faible_risque_inondation` soit demandé.

**Tech Stack:** TypeScript (`src/lib/comparateur-vie.ts`, routes `synthesize`/`ask`). Vérification : `npx tsc --noEmit` + `npm run lint` + témoins `curl` réels (port 3000) + témoin Python de calage des seuils. PAS de runner de test (cf. AGENTS.md). `grep -c` renvoie exit 1 sur 0 match (ne pas chaîner en `&&`).

**Spec :** `docs/superpowers/specs/2026-06-03-pression-climatique-inondation-design.md`

---

## Task 1 : Moteur — champ `climatInondation`, builder, assemblage, injection signaux

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `MatchResult` ~l.138 ; nouveau builder près de `pressionEcoNote` ~l.823 ; assemblage ~l.1217 ; `assignSignaux` ~l.739)

- [ ] **Step 1 : Ajouter le champ `climatInondation` au type `MatchResult`**

Dans `src/lib/comparateur-vie.ts`, juste après le bloc `pressionEco` (l.136-138), insérer :

```ts
  // Pression climatique inondation (NARRATIF, n'entre PAS dans le score/tri/reasons).
  // Signal complémentaire affiché UNIQUEMENT quand la trajectoire DRIAS des pluies
  // extrêmes change la lecture de l'historique CatNat observé. Jamais une prédiction.
  // null = silence (climat n'ajoute rien, ou DRIAS manquant). cf. buildClimatInondation.
  climatInondation: string | null;
```

- [ ] **Step 2 : Écrire le builder `buildClimatInondation`**

Juste après la fonction `pressionEcoNote(...)` (se termine ~l.825), insérer :

```ts
// Signal narratif (hors score). N'existe que si la PRESSION climatique est marquée :
// tendance projetée des pluies extrêmes forte (NORRx1d, moteur principal) ET niveau déjà
// significatif (NORRRq99, garde-fou). La phrase s'adapte à l'historique CatNat observé.
// Seuils calés sur témoins réels (porteur) : tendance >= 88 ET niveau >= 75 -> ~12,5 % des
// communes, garde Nîmes (94/93) et Arles (88/79), exclut Lens (3/1) et Paris (4/8, crue de
// Seine fluviale non captée par la tendance pluies extrêmes). Préférence : rare mais crédible.
function buildClimatInondation(c: IndexCommune): string | null {
  const inond = c.inondation;
  if (!inond) return null;
  const tendance = c.pct.NORRx1d_yr; // Δ projeté des pluies extrêmes (percentile national)
  const niveau = c.pct.NORRRq99_yr; // niveau p99 journalier (percentile national)
  if (tendance == null || niveau == null) return null; // DRIAS manquant -> silence
  const pressionMarquee = tendance >= 88 && niveau >= 75;
  if (!pressionMarquee) return null; // le climat n'ajoute rien -> silence
  const historiqueNotable = inond.risque >= 66; // beaucoup d'arrêtés CatNat observés
  return historiqueNotable
    ? "Historique d'inondation déjà présent ; les pluies extrêmes tendent à s'intensifier."
    : "Peu d'inondations recensées à ce jour ; les pluies extrêmes tendent à s'intensifier.";
}
```

- [ ] **Step 3 : Poser le champ à l'assemblage du résultat**

Dans le `scored.map(...)`, dans l'objet `result:` (après la ligne `pressionEco: ...` qui se termine l.1219, avant `logement:`), insérer :

```ts
        // Narratif, hors score : nuance climatique sur l'inondation (ou null/silence).
        climatInondation: buildClimatInondation(c),
```

- [ ] **Step 4 : Injecter le signal dans la map `signaux` (canal AskFuture)**

Dans `assignSignaux`, juste avant `r.signaux = signaux;` (l.740), insérer :

```ts
    // Signal narratif climatique (déjà calculé à l'assemblage, self-gated, hors cap ambiant).
    if (r.climatInondation) signaux["climat_inondation"] = r.climatInondation;
```

- [ ] **Step 5 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected : aucune sortie (clean).

Run: `npm run lint 2>&1 | grep -i "comparateur-vie"; echo "exit:$?"`
Expected : aucune ligne `comparateur-vie` (exit 1 = 0 erreur sur le fichier touché).

- [ ] **Step 6 : Témoin Python de calage des seuils sur l'index**

Réplique exacte de la logique TS sur `data/comparateur-index.json` pour valider la distribution et exhiber des témoins par cas. Run :

```bash
python3 - <<'PY'
import json
d=json.load(open("data/comparateur-index.json"))
communes=next(v for v in d.values() if isinstance(v,list))
def signal(c):
    inond=c.get("inondation")
    if not inond: return None
    t=c.get("pct",{}).get("NORRx1d_yr"); n=c.get("pct",{}).get("NORRRq99_yr")
    if t is None or n is None: return None
    if not (t>=88 and n>=75): return None
    return "accentuer" if inond.get("risque",0)>=66 else "surveiller"
buckets={"surveiller":[],"accentuer":[],None:0}
miss_drias=0
for c in communes:
    inond=c.get("inondation")
    if inond and (c.get("pct",{}).get("NORRx1d_yr") is None or c.get("pct",{}).get("NORRRq99_yr") is None):
        miss_drias+=1
    s=signal(c)
    if s: buckets[s].append(c.get("nom"))
    else: buckets[None]+=1
print("total communes:",len(communes))
print("signal 'surveiller' (historique limité/intermédiaire + pression):",len(buckets["surveiller"]))
print("signal 'accentuer'  (historique notable + pression):",len(buckets["accentuer"]))
print("silence:",buckets[None]," | dont DRIAS manquant:",miss_drias)
print("exemples surveiller:",buckets["surveiller"][:8])
print("exemples accentuer :",buckets["accentuer"][:8])
# Cas motivants du V2 (porteur) : vérifier que le signal raconte quelque chose d'utile.
print("--- cas motivants ---")
def find(name):
    return next((c for c in communes if str(c.get("nom","")).lower()==name.lower()), None)
for n in ["Paris","Marseille","Lens","Nîmes","Arles"]:
    c=find(n)
    if not c: print(f"  {n}: introuvable (vérifier libellé/arrondissements PLM)"); continue
    inond=c.get("inondation") or {}
    print(f"  {n:10} risque={inond.get('risque')} NORRx1d={c.get('pct',{}).get('NORRx1d_yr')} NORRRq99={c.get('pct',{}).get('NORRRq99_yr')} -> signal={signal(c)}")
PY
```

Expected : les deux buckets non vides ; « accentuer » contient des communes méditerranéennes connues (Nîmes, Arles, Gard/Hérault/Vaucluse) ; le silence reste **largement majoritaire** (le signal doit rester RARE).

**Garde-fou rareté (porteur, remarque 2) :** objectif indicatif — le total des communes avec signal devrait rester de l'ordre de quelques pourcents, pas des dizaines. Si > ~10 % des communes déclenchent, **resserrer** les seuils (monter `66` vers `75`/`80` sur la tendance, et/ou `34` vers `50` sur le niveau) et relancer ce témoin AVANT de continuer. Préférence assumée : manquer quelques cas intéressants plutôt que produire du bruit.

**Cas motivants (porteur, remarque 4) :** présenter au porteur les lignes Paris / Marseille / Lens / Nîmes / Arles. Attendu : le signal raconte quelque chose d'utile sur ces cas (ex : Nîmes/Arles historique notable + pression → « accentuer » ; Paris/Marseille = cas où l'observé communal sous-estimait l'aléa, le signal doit éclairer s'il se déclenche, ou rester silencieux de façon défendable). **Checkpoint de revue porteur ici** avant Step 7.

**Formulation (porteur, remarque 5) :** la phrase « Historique d'inondation limité, mais évolution climatique à surveiller » est jugée potentiellement trop interprétative. Après les témoins réels, proposer 1-2 variantes plus factuelles au porteur (ex : « Peu d'inondations recensées à ce jour ; les pluies extrêmes tendent à s'intensifier. ») et recaler dans `buildClimatInondation` (Step 2) si validé. Noter les seuils ET la formulation retenus.

- [ ] **Step 7 : Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(comparateur): signal narratif climatInondation (DRIAS, hors score)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2 : Synthèse — payload conditionnel + note de doctrine

**Files:**
- Modify: `src/app/api/comparateur-vie/synthesize/route.ts` (type `Body` l.228 ; `prefs`/gate ~l.248 ; `payload` ~l.269 ; `SYSTEM` ~l.207)

- [ ] **Step 1 : Étendre le type `results` du `Body`**

Dans `synthesize/route.ts`, dans `type Body`, à la fin de l'objet `results?` (l.228), ajouter le champ `climatInondation` :

```ts
  results?: { nom: string; region?: string | null; reasons?: string[]; tradeoff?: string | null; pressionEco?: string | null; logement?: string | null; littoral?: string | null; distinctive?: string | null; climatInondation?: string | null }[];
```

- [ ] **Step 2 : Calculer la frontière « inondation demandée »**

Juste après le bloc `const prefs = (...)` (qui se termine l.250), insérer :

```ts
  // Frontière porteur : la nuance climatique inondation n'apparaît dans la synthèse
  // que si l'inondation a été explicitement demandée (sinon la synthèse l'introduirait
  // spontanément alors que l'utilisateur n'a pas parlé d'inondation).
  const inondationDemandee = (body.preferences ?? []).some((p) => p.key === "faible_risque_inondation");
```

- [ ] **Step 3 : Ajouter le champ au payload (gaté)**

Dans `payload.territoires` (le `results.map((r) => ({...}))`), après la ligne `pression_climatique_economie: r.pressionEco ?? null,` (l.269), insérer :

```ts
      pression_climatique_inondation: inondationDemandee ? (r.climatInondation ?? null) : null,
```

- [ ] **Step 4 : Ajouter la note de doctrine au prompt `SYSTEM`**

Dans `synthesize/route.ts`, juste après le bloc `pression_climatique_economie` du prompt (se termine l.207, avant le bloc `"logement"` l.209), insérer :

```ts

Si un champ "pression_climatique_inondation" est fourni pour un territoire,
mentionnez-le UNE fois, comme une nuance de lecture et JAMAIS comme une prédiction.
C'est un signal COMPLÉMENTAIRE : la tendance climatique des pluies extrêmes éclaire
l'historique d'inondation observé, sans le remplacer. RÈGLES STRICTES : ne dites
JAMAIS qu'une inondation "va" se produire, ni "risque futur", ni un chiffre, ni un
classement ; ne confondez pas ce signal avec le critère inondation (historique
observé) ni avec les pluies extrêmes (projection, critère distinct). Le texte fourni
est déjà sobre, reprenez-en l'esprit (point de vigilance, jamais une alarme). Si le
champ est absent ou nul, n'en parlez pas (ne le déduisez jamais vous-même).
```

- [ ] **Step 5 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected : clean.

Run: `npm run lint 2>&1 | grep -i "synthesize/route"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 6 : Témoin curl — synthèse AVEC inondation demandée**

(Dev sur port 3000.) Run :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/synthesize -H 'Content-Type: application/json' \
 -d '{
   "preferences":[{"key":"faible_risque_inondation","weight":3}],
   "project":"Je veux éviter les zones inondables",
   "results":[
     {"nom":"Nîmes","region":"Occitanie","reasons":["historique d inondation plus marqué"],"tradeoff":null,"climatInondation":"Historique d'\''inondation déjà présent ; les pluies extrêmes tendent à s'\''intensifier."},
     {"nom":"Rennes","region":"Bretagne","reasons":["historique d inondation plus faible"],"tradeoff":null,"climatInondation":"Peu d'\''inondations recensées à ce jour ; les pluies extrêmes tendent à s'\''intensifier."}
   ]
 }' | python3 -c "import sys,re; a=sys.stdin.read(); print(a); print('--- chiffre:',bool(re.search(r'[0-9]',a)),'| mots interdits:',[w for w in ['va se produire','risque futur','prédiction','classement','résilience','fragile','menacé','condamné'] if w in a.lower()])"
```

Expected : la nuance climatique est reprise UNE fois, sobrement (point de vigilance) ; zéro chiffre ; zéro mot interdit ; jamais formulée comme une prédiction.

- [ ] **Step 7 : Témoin curl — synthèse SANS inondation demandée (le signal ne doit PAS apparaître)**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/synthesize -H 'Content-Type: application/json' \
 -d '{
   "preferences":[{"key":"nature","weight":2}],
   "project":"Je veux de la nature",
   "results":[
     {"nom":"Nîmes","region":"Occitanie","reasons":["nature à proximité"],"tradeoff":null,"climatInondation":"Historique d'\''inondation déjà présent ; les pluies extrêmes tendent à s'\''intensifier."}
   ]
 }' | python3 -c "import sys; a=sys.stdin.read(); print(a); print('--- mentionne inondation/climat (attendu: non):', any(w in a.lower() for w in ['inondation','pluies extrêmes','aléa climatique']))"
```

Expected : la synthèse ne parle PAS d'inondation (le critère n'a pas été demandé → `pression_climatique_inondation` est `null` dans le payload).

- [ ] **Step 8 : Commit**

```bash
git add src/app/api/comparateur-vie/synthesize/route.ts
git commit -m "feat(comparateur): synthese reprend climatInondation si inondation demandee (+ doctrine)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3 : AskFuture — note de doctrine pour le signal `climat_inondation`

**Files:**
- Modify: `src/app/api/comparateur-vie/ask/route.ts` (prompt, après le bloc « SI DES "signaux" SONT DONNÉS » ~l.145 ou près du bloc vie étudiante l.196)

Le signal circule déjà dans `context.territoires[].signaux["climat_inondation"]` (injecté en Task 1, et le client envoie `signaux` à `/ask`). Cette tâche ajoute seulement la doctrine d'usage.

- [ ] **Step 1 : Ajouter la note de doctrine au prompt**

Dans `ask/route.ts`, juste avant le bloc `SI LA VIE ÉTUDIANTE EST EN JEU` (l.196), insérer :

```ts

SI UN SIGNAL "climat_inondation" EST DONNÉ POUR UN TERRITOIRE
C'est une nuance COMPLÉMENTAIRE : la tendance climatique des pluies extrêmes éclaire
l'historique d'inondation observé, sans jamais le remplacer ni prédire une inondation.
Répondez-y en termes de lecture (point de vigilance), jamais comme une alarme ni une
prédiction ("va se produire", "risque futur" sont interdits). Ne le confondez pas avec
l'historique d'inondation observé (signal "inondation") ni avec les pluies extrêmes
projetées : c'est leur articulation. Jamais de chiffre. Ne le sortez que si la question
porte sur l'inondation, les pluies extrêmes ou le climat.
```

- [ ] **Step 2 : Vérifier la compilation**

Run: `npx tsc --noEmit`
Expected : clean.

Run: `npm run lint 2>&1 | grep -i "ask/route"; echo "exit:$?"`
Expected : aucune ligne (exit 1).

- [ ] **Step 3 : Témoin curl — AskFuture reprend la nuance**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/ask -H 'Content-Type: application/json' \
 -d '{"question":"et côté inondations et climat ?","context":{"territoires":[
   {"rang":1,"nom":"Rennes","region":"Bretagne","raisons":["historique faible"],"compromis":null,"signaux":{"inondation":"historique d inondation plus faible","climat_inondation":"Peu d'\''inondations recensées à ce jour ; les pluies extrêmes tendent à s'\''intensifier."}},
   {"rang":2,"nom":"Nîmes","region":"Occitanie","raisons":["nature"],"compromis":null,"signaux":{"inondation":"historique d inondation plus marqué","climat_inondation":"Historique d'\''inondation déjà présent ; les pluies extrêmes tendent à s'\''intensifier."}}
 ]}}' | python3 -c "import sys,re; a=__import__('json').load(sys.stdin).get('answer',''); print(a); print('--- chiffre:',bool(re.search(r'[0-9]',a)),'| mots interdits:',[w for w in ['va se produire','risque futur','prédiction'] if w in a.lower()])"
```

Expected : réponse qualitative reprenant la nuance observé↔projeté, zéro chiffre, jamais une prédiction.

- [ ] **Step 4 : Commit**

```bash
git add src/app/api/comparateur-vie/ask/route.ts
git commit -m "feat(comparateur): AskFuture, doctrine signal climat_inondation

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4 : Vérification finale + non-régression du classement + intégration

**Files:** aucun (vérification) puis mémoire.

- [ ] **Step 1 : Non-régression — le classement inondation est INCHANGÉ vs V1**

Le signal ne doit toucher ni score, ni tri, ni reasons. Rafraîchir le cache index du dev si besoin (modif inerte d'un commentaire de `comparateur-vie.ts` → recompilation Next). Run :

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"faible_risque_inondation","weight":3}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],c['compatibility'],'| reasons:',c['reasons'],'| climatInondation:',c.get('climatInondation')) for c in d.get('results',[])[:3]]"
```

Expected : Nîmes/Arles/Lens toujours écartés du haut (classement identique au V1) ; `reasons` ne contient AUCUNE mention climatique ; `climatInondation` peut être renseigné sur certaines communes sans changer leur rang ni leur `compatibility`.

- [ ] **Step 2 : Témoin — signal présent dans `signaux` pour AskFuture**

```bash
curl -s -X POST http://localhost:3000/api/comparateur-vie/match -H 'Content-Type: application/json' \
 -d '{"parsed":{"preferences":[{"key":"nature","weight":2}],"hardConstraints":{}}}' \
 | python3 -c "import sys,json; d=json.load(sys.stdin); [print(' ',c['nom'],'| climat_inondation:',c.get('signaux',{}).get('climat_inondation')) for c in d.get('results',[])[:5]]"
```

Expected : sur les communes au signal présent, `signaux["climat_inondation"]` porte la phrase ; sur les autres, la clé est absente (silence). Le critère `faible_risque_inondation` n'étant pas demandé ici, la nuance reste un signal ambiant (cohérent).

- [ ] **Step 3 : Lint global sur les 3 fichiers touchés**

```bash
npm run lint 2>&1 | grep -iE "comparateur-vie|synthesize/route|ask/route"; echo "exit:$?"
```

Expected : aucune ligne (exit 1) → aucune erreur sur les fichiers touchés.

- [ ] **Step 4 : git status propre + log**

```bash
git status --short; git log --oneline -4
```

Expected : working tree propre, 3 commits de feature + le commit de spec.

- [ ] **Step 5 : finishing-a-development-branch**

Invoquer la skill `superpowers:finishing-a-development-branch`, présenter les options. Sur « push sur main » du porteur :

```bash
git checkout main && git merge --ff-only feat/pression-climatique-inondation && git push origin main && git branch -d feat/pression-climatique-inondation
```

- [ ] **Step 6 : Mémoire (après merge)**

Mettre à jour `inondation_scoring.md` : ajouter une section « V2 — signal narratif `climatInondation` » (règle tendance NORRx1d + garde-fou NORRRq99, hors score, frontière synthèse/ask, seuils retenus au calage) ; pointer la dette V2 comme close. Passer le chantier #4 à ✅ dans `project_roadmap.md` et mettre à jour son hook dans `MEMORY.md`.

---

## Self-review (couverture spec)

- Doctrine score/tri = CatNat inchangé → Task 4 Step 1 (non-régression vérifiée).
- `climatInondation` jamais dans score/tri/reasons → builder hors `subScore`, vérifié Task 4 Step 1.
- Règle pression marquée (tendance NORRx1d + garde-fou NORRRq99) → Task 1 Step 2.
- Garde-fou DRIAS manquant → silence → Task 1 Step 2 (`tendance/niveau == null`).
- Matrice de sortie + 2 formulations + ton point de vigilance → Task 1 Step 2.
- Calage des seuils sur témoins → Task 1 Step 6.
- Surface synthèse gatée par inondation demandée → Task 2 Steps 2-3-6-7.
- Surface AskFuture sur question inondation/climat → Task 1 Step 4 (signaux) + Task 3.
- Notes de doctrine prompts → Task 2 Step 4 + Task 3 Step 1.
- Hors-périmètre (TRI, submersion marine, modulation score) → aucun code les touche (pas de tâche, par construction).
