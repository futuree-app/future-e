# Comparateur mode choix — résultat « wow » — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le résultat gratuit plat de `/comparateur` (mode choix) par un face-à-face qui montre la divergence/tension entre communes nommées, avec un thème dévoilé, le reste verrouillé, et AskFuture.

**Architecture:** Pivot « qui gagne » → « où ça se joue ». Un seul morceau de moteur neuf (`divergence` calculée dans `buildComparaisonComplete` depuis les `bands` déjà présentes) ; le reste est du réemploi (champs `identite`/`compromis` déjà calculés par `seedComparaison`, rendu de ligne extrait de `ComparaisonCompleteView`, AskFuture group-aware de `/ou-vivre`).

**Tech Stack:** Next.js (App Router), React, TypeScript, Tailwind. Pas de runner de tests unitaires dans ce repo → vérification = `npx tsc --noEmit` + `npx eslint <fichiers>` + assertions runtime `curl`+`grep` sur le dev server (port 3000).

## Global Constraints

- **Aucun score, aucun classement, aucune jauge** (invariant n°2 / ADR-0001). Le résultat gratuit ne doit plus produire de leaderboard.
- **Pas de tiret cadratin `—`** dans le texte (`feedback_no_em_dash`) : virgule ou deux-points.
- **futur•e ne tranche pas** : pas de verdict « pour vous c'est X » ; le verbe qui tranche reste côté lecteur.
- **Largeur de texte** : pas de `max-w` px plus étroit que le bloc bordé qui l'entoure (`feedback_text_maxwidth`).
- **Tailwind** : pas de classe arbitraire interpolée dynamiquement (le JIT ne l'extrait pas) → littéraux par cardinal.
- **`/ou-vivre` et le parcours payant doivent rester inchangés** (réemploi non destructif ; le bloc `resume` reste, on ne fait que cesser de l'utiliser dans le gratuit mode choix).
- Vérif transverse à chaque tâche : `npx tsc --noEmit` (ignorer les erreurs `.next/`) + `npx eslint` propres.

---

### Task 1: `divergence` dans le moteur (la ligne de fracture)

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `ComparaisonComplete` ~l.263 ; `buildComparaisonComplete` ~l.1149-1280 ; `truncateComparaison` ~l.2380)

**Interfaces:**
- Produces: type `Divergence = { dimId: string; themeId: string; label: string; leaderInsee: string; leaderPalier: string; exposeInsee: string; exposePalier: string; domine: boolean } | null` et champ `divergence: Divergence` sur `ComparaisonComplete`.

- [ ] **Step 1: Ajouter le type + le champ.** Dans `comparateur-vie.ts`, près de `ComparaisonComplete`, ajouter le type `Divergence` (ci-dessus) et `divergence: Divergence;` au type `ComparaisonComplete`. `domine = true` quand une commune mène (quasi) tous les thèmes (pas de vraie tension) → on bascule la phrase en « ce ne sont pas vraiment des compromis ».

- [ ] **Step 2: Calculer la divergence dans `buildComparaisonComplete`.** Dans la boucle qui construit `ligneByDim`, on a déjà `bands` (0=meilleur,2=pire) et `dim` (avec `risque`, `directionnel`, `themeId`, `label`, `paliers`). Accumuler les candidats directionnels où `present` contient à la fois un 0 et un 2 (spread max) : `{ dimId: dim.id, themeId: dim.themeId, label: dim.label, leaderIdx, worstIdx, spread, risque: dim.risque }`. Après la boucle des thèmes, choisir le candidat : spread max, puis `risque` d'abord, puis ordre `THEME_ORDER`. Repli : plus grand spread présent (≥1). Construire la phrase via `dim.paliers[band]` et `nomByInsee`. Si aucune divergence (toutes égalités) OU une commune domine ≥ (nThemes−1) thèmes (réutiliser `ledByInsee` déjà calculé pour `resume`) → `domine: true`, fracture = la meilleure dimension d'une AUTRE commune (la seule raison de pencher autrement). Retourner `divergence` dans l'objet final.

- [ ] **Step 3: `truncateComparaison` porte la divergence.** Ajouter `divergence: cc.divergence` au retour de `truncateComparaison`.

- [ ] **Step 4: Vérifier.** `npx tsc --noEmit 2>&1 | grep -v '^\.next/'` → vide. `npx eslint src/lib/comparateur-vie.ts` → exit 0.

- [ ] **Step 5: Commit** (sur la branche dédiée, voir handoff exécution).
  `git add src/lib/comparateur-vie.ts && git commit -m "feat(comparateur): calcule la divergence (ligne de fracture) hors leaderboard"`

---

### Task 2: Extraire le rendu d'un thème réutilisable de `ComparaisonCompleteView`

**Files:**
- Create: `src/app/(public)/comparateur/ThemeMatrix.tsx`
- Modify: `src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx`

**Interfaces:**
- Produces: `ThemeMatrix({ theme, trio })` — rend l'en-tête de colonnes (communes en Serif) + les `LigneRow` d'un seul thème, exactement comme aujourd'hui dans `ComparaisonCompleteView`. Consomme `ComparaisonTheme` + `MatchResult[]`.

- [ ] **Step 1: Déplacer `LigneRow` + `gridFor`/`MERGED_SPAN_BY_N` + `Cellule` + `LabelTip` + `paletteTone`** dans `ThemeMatrix.tsx` (export des pièces nécessaires), et y créer `ThemeMatrix` qui rend l'en-tête de colonnes (le bloc `${gridFor(trio.length)} hidden md:grid …`) + `theme.lignes.map(LigneRow)`. Garder les icônes de thème dans `ComparaisonCompleteView`.

- [ ] **Step 2: `ComparaisonCompleteView` consomme `ThemeMatrix`.** Remplacer, pour chaque thème, l'en-tête + la liste de lignes par `<ThemeMatrix theme={th} trio={trio} />` (garder `ThemeIcon` + titre + synthèse au-dessus).

- [ ] **Step 3: Vérifier le non-régression du payant.** `npx tsc --noEmit | grep -v '^\.next/'` vide ; `npx eslint` des deux fichiers exit 0. Dev server : `curl -s "http://localhost:3000/ou-vivre" -o /dev/null -w "%{http_code}"` → 200. (La vue payante réelle se vérifie à la Task 3 via le gratuit qui réutilise `ThemeMatrix`.)

- [ ] **Step 4: Commit.** `git add … && git commit -m "refactor(comparateur): extrait ThemeMatrix réutilisable"`

---

### Task 3: Nouveau résultat gratuit `/comparateur` (face-à-face)

**Files:**
- Modify: `src/app/(public)/comparateur/page.tsx`
- (Réemploi : `ThemeMatrix` de Task 2, `divergence` de Task 1.)

**Interfaces:**
- Consumes: `seedComparaison(insees)` → `{ trio, comparaison: { divergence, resume, themes }, ignores }`, `ThemeMatrix`.

- [ ] **Step 1: Remplacer le bloc « aperçu gratuit ».** Supprimer le bloc « En résumé » (l.~108-130 du résultat) et les 2 thèmes en synthèse. À la place, de haut en bas :
  1. **Fracture** : si `comparaison.divergence`, un bloc en tête, kicker mono accent « LÀ OÙ ÇA SE JOUE », puis la phrase (`divergence.domine` → variante « ce ne sont pas vraiment des compromis : {leader} domine… »).
  2. **Colonnes face à face** : les communes (numéro mono + nom Serif), et sous chacune `identite` (offre) + `compromis` (« en échange ») — réemploi des champs du `trio`.
  3. **Thème dévoilé** : `<ThemeMatrix theme={themeFracture} trio={trio} />` où `themeFracture = comparaison.themes.find(t => t.id === divergence.themeId) ?? comparaison.themes[0]`. Titre + synthèse du thème au-dessus.
  4. **Thèmes verrouillés** : les autres thèmes, chacun = titre + liste des `lignes.map(l => l.label)` (libellés visibles) avec un cadenas et le verdict masqué (pas de paliers, pas d'avantage, pas de `synthese`).

- [ ] **Step 2: Corriger le tiret cadratin metadata.** `page.tsx` l.12 `description` : remplacer les `—` par des virgules.

- [ ] **Step 3: CTA amorce.** Ajuster le texte du CTA : « Vous voyez où chacune penche. Le Pack vous donne les 7 thèmes critère par critère, le palier de chaque commune et ce qui les départage, là où ça compte pour votre décision. »

- [ ] **Step 4: Vérifier (runtime).** Dev server. Trio La Rochelle/Rennes/Lorient = `17300,35238,56121` :
  `curl -s "http://localhost:3000/comparateur?communes=17300,35238,56121" -o /tmp/w.html -w "%{http_code}"` → 200.
  `grep -c "En résumé" /tmp/w.html` → **0** (le leaderboard a disparu). `grep -o "LÀ OÙ ÇA SE JOUE\|Avantage\|À égalité" /tmp/w.html | sort -u` → la fracture + au moins un verdict de thème dévoilé présents. Tester aussi n=2 (`17300,35238`).

- [ ] **Step 5: Commit.** `git add … && git commit -m "feat(comparateur): résultat gratuit face-à-face (fracture + thème dévoilé + verrouillé)"`

---

### Task 4: AskFuture en mode choix

**Files:**
- Create: `src/app/(public)/comparateur/ModeChoixAsk.tsx` (composant client : champ + messages + suggestions + appel `/api/comparateur-vie/ask`)
- Modify: `src/app/(public)/comparateur/page.tsx` (monter `ModeChoixAsk` entre les thèmes verrouillés et le CTA, en passant le `trio` sérialisable)

**Interfaces:**
- Consumes: `/api/comparateur-vie/ask` (POST `{ question, context, focus:null, history, distinctId }`), gating 402 = limite atteinte.
- Produces: `ModeChoixAsk({ trio })` où `trio = { insee, nom, identite, compromis, distinctive, signaux, logement, littoral, heritageIndustriel }[]`.

- [ ] **Step 1: Construire le contexte mode choix.** Dans `ModeChoixAsk`, POST vers `/api/comparateur-vie/ask` avec `context = { reformulation: "", criteres: [], perimetre: [], orientation: [], synthese: "", aucun_territoire_parfait: false, territoires: trio.map((r,i) => ({ rang:i+1, nom:r.nom, region:null, raisons:[], compromis:r.compromis, distinctive:r.distinctive, signaux:r.signaux, logement:r.logement, littoral:r.littoral, heritage_industriel:r.heritageIndustriel })) }`. FREE_ASK = 2. Gérer 402 → état `askLimit` (message « Créez un compte / débloquez le Pack pour continuer »). Réutiliser la mécanique de `OuVivreClient.sendAsk` (debounce non nécessaire, historique `slice(-6)`).
- [ ] **Step 2: Pool de suggestions mode choix.** 4-6 questions templatées sur les noms du trio, comparatives/risque/horizon : ex. `Entre ${a} et ${b}, laquelle tient le mieux face aux canicules ?`, `À ${a}, l'inondation est-elle un vrai sujet ?`, `Laquelle vieillit le mieux face au climat de 2050 ?`. PAS de « pourquoi le moteur a choisi ». Rotation tant que le champ est vide.
- [ ] **Step 3: Monter dans la page.** Dans `page.tsx`, après les thèmes verrouillés et avant le CTA, `<ModeChoixAsk trio={trio.map(r => ({ insee:r.insee, nom:r.nom, identite:r.identite, compromis:r.compromis, distinctive:r.distinctive, signaux:r.signaux, logement:r.logement, littoral:r.littoral, heritageIndustriel:r.heritageIndustriel }))} />`.
- [ ] **Step 4: Vérifier.** `tsc`/`eslint` propres. Runtime : la page affiche le champ AskFuture + les suggestions ; `curl … | grep -o "posez une question\|<nom suggestion>"`. (Le cycle question→réponse dépend du LLM ; vérifier au moins le rendu + que le POST part sans erreur 500.)
- [ ] **Step 5: Commit.** `git commit -m "feat(comparateur): AskFuture en mode choix (contexte + suggestions départage)"`

---

### Task 5: Passe finale design + honnêteté du voile

**Files:**
- Modify: `src/app/(public)/comparateur/page.tsx` (espacements, hiérarchie), éventuellement `ThemeMatrix.tsx`

- [ ] **Step 1: Resserrer la composition.** Hiérarchie : la fracture domine visuellement, les colonnes face-à-face ensuite, le thème dévoilé, puis le voile plus discret. Corriger les espacements ternes signalés (`space-y` cohérents, pas de cartes `.glass` toutes identiques empilées). Appliquer `text-wrap: pretty` aux phrases longues + espaces insécables sur les petits mots des phrases importantes.
- [ ] **Step 2: Garde-fou honnêteté du voile.** Vérifier qu'aucun faux contenu flouté n'est inventé : on masque un verdict RÉEL (les `lignes` existent), on n'affiche pas de fausses valeurs.
- [ ] **Step 3: Vérif visuelle humaine.** Demander au porteur de regarder `http://localhost:3000/comparateur?communes=17300,35238,56121` (et un trio à lui). Itérer si besoin.
- [ ] **Step 4: Commit.** `git commit -m "polish(comparateur): hiérarchie + honnêteté du voile du résultat"`

---

## Self-Review

- **Couverture spec :** fracture (T1+T3), colonnes offre/compromis (T3, réemploi identite/compromis), thème dévoilé = fracture (T3), voile libellés-seuls (T3), AskFuture mode choix + suggestions (T4), em-dash metadata (T3), polish (T5). `resume`-leaderboard global = hors scope (spec). ✓
- **Placeholders :** algorithme de divergence décrit (spread 0/2, priorité risque puis THEME_ORDER, cas `domine`) ; contexte AskFuture donné en entier ; suggestions exemples concrets. ✓
- **Cohérence des types :** `Divergence`/`divergence` (T1) consommés en T3 ; `ThemeMatrix({theme,trio})` (T2) consommé en T3 ; `ModeChoixAsk({trio})` (T4) avec la forme exacte du trio. ✓
