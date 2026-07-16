# Passation — mismatch lot 4b (refonte douceur hivernale) MERGÉ sur `main` ; chantier climat mismatch TERMINÉ

**Horodatage** : 2026-07-16 · **Branche** : `main` (`13947b5`, à jour avec `origin/main`, **rien à pousser**).
**Aucune PR ouverte.** `vercel.json` (Large Functions) + engines 24.x sur main. Lots 3a/3b/4a/4b tous mergés.

## Objectif : la MIGRATION est LIVRÉE

Le **lot 4b** refond `douceur_climat` d'un composite annuel opaque en **douceur hivernale monotone** — livré et
mergé sur `main`. **Couverture 26 → 27 sur 28** (dernier critère couvrable ; `faible_secheresse` reste exclu par
décision). Le chantier climat du rôle `mismatch` est terminé.

## Ce que le lot change

Ancien `douceur_climat` = `0.6·cloche_hivernale(pic 9°C) + 0.4·(100 - NORTX35D)` — la cloche **pénalisait les
hivers les plus doux** (Nice/Corse > 9°C), et `NORTX35D` **double-comptait `faible_chaleur`**. Le libellé du
critère promettait « Douceur à l'année » (hiver + été).

Nouveau : `douceur_climat = winterMildnessScore(pct.NORTMm_seas_DJF)` — **position nationale de la température
moyenne hivernale (DJF), monotone, historique 1976-2005**. L'été est rendu à `faible_chaleur`. Le critère
devient « Hivers doux ». Forme dossier `relative_position` (comme l'ensoleillement). Convention pure
`src/lib/climate/winter-mildness.ts` (source unique comparateur + dossier).

## Le rapport d'impact (la preuve du lot)

`node scripts/analysis/douceur-impact.mts` : **corrélation old↔new = 0,330** (le composite déformait vraiment).
Les 10 plus gros mouvements sont des **villages de montagne** (DJF ~3°C) passant de **70 à 5** : l'ancien score
les disait « doux » à cause de leurs étés frais (double-comptage rendu visible). Nice 90→100, Bastia 75→99, La
Rochelle 83→95 (Méditerranée/Atlantique montent) ; Chamonix 43→0, Strasbourg 58→29 (montagne/continental
descendent). Arbitrage désormais lisible (Ariège : douceur haute ET chaleur haute, deux signaux séparés).

## Décisions (gate + revues, 2 tours de revue porteur)

- **Seuil identitaire = 80** (le cinquième supérieur, 20,5 %), figé APRÈS le rapport d'impact (gate), dans
  `WINTER_MILDNESS_CONVENTION.identityThreshold`. S'aligne sur le `satisfied` de `relative_position` (≥ 0,80).
- **Parser : douceur annuelle → douceur_climat + faible_chaleur** (sonde 5 cas, cas critique OK).
- **Cas A** : aucun projet persistant à préserver (pré-lancement).
- **`doux` sans `?? 0`** (condition explicite). **Paliers relatifs** (« parmi les plus doux / intermédiaire /
  parmi les moins doux »). **`faible_chaleur`** : « exposition aux fortes chaleurs » (pas « supportable »).

## Fichiers (branche `feat/mismatch-lot4b-douceur`, 6 commits)

- Spec/plan : `docs/superpowers/specs/2026-07-16-mismatch-lot4b-douceur-hivernale-design.md`, `…/plans/…`.
- `src/lib/climate/winter-mildness.ts` (NOUVEAU, pur) : convention + `winterMildnessScore` + test (seuil 80 figé).
- `comparateur-vie.ts` : `subScore` refondu, `WINTER_MILD` supprimée, critère/aide/paliers/identité/`doux` alignés.
- `comparateur-scores.ts` : `MISMATCH_RANK_KEYS` + cas + tests comportementaux (dé-doublonnage, monotonie).
- `comparateur-labels.ts`, `synthesize/route.ts`, `parse/route.ts` : éditorial + parser.
- `mismatch-facts.ts` (LABELS.douceur_climat), `mismatch-rules.ts` (MISMATCH_KEYS), `winter-mildness-e2e.test.ts`.
- `scripts/populate-mismatch-rank.mts` (preuve percentile↔rang à seuils durs), `data/comparateur-index.json.gz`.
- `scripts/analysis/douceur-impact.mts` (rapport d'impact).

## Vérification (toute verte en local)

`node --test src/lib/*.test.ts src/lib/decision/*.test.ts src/lib/climate/*.test.ts` = **591/591** ;
`node --test scripts/lib/*.test.mjs scripts/*.test.mjs` = **22/22** ; `npx tsc --noEmit` = 0 ; `npm run build`
exit 0 (2255 pages) ; index gzip 10,56 → **10,75 Mo** (+0,2 Mo pour la bande douceur). Sonde parser : cas
critique (annuel → 2 critères) OK.

## Prochaine étape immédiate

Chantier climat mismatch **terminé et mergé** (27/28 couverts + `faible_secheresse` exclu assumé). Options pour
la suite : capitaliser la **mémoire `/memory`** (4 formes de fondement mismatch, non couvertes), la **fusion de
deux mismatchs** en compromis narratif, ou le **régime de la fonction `/rapport`**.

(NB : le porteur n'utilise PAS les déploiements Preview Vercel ; ne pas ajouter d'étape Preview aux plans. Le
déploiement de prod se fait sur push `main`.)

## Fils ouverts / dettes

- **impact-B (3 profils sur le vrai matcher)** : le plan prévoyait une comparaison baseline vs migration (même
  code, `git stash`) via `/api/comparateur-vie/match`. Le rapport d'impact (script) prouve déjà le score + la
  lisibilité de l'arbitrage per-commune ; la comparaison top-N multi-critères reste à faire manuellement si
  désiré (non bloquant : la refonte est prouvée au grain score + arbitrage).
- **Parser** : « je supporte la chaleur mais pas le froid » ajoute `ensoleillement_recherche(2)` (tendance
  PRÉ-EXISTANTE, non touchée par 4b) — à recalibrer un jour.
- **Identité via `rankBand.low ≥ 0,80`** plutôt que `score ≥ 80` (raffinement porteur, ex æquo frontière) :
  `buildIdentiteCandidates` n'a pas les bandes sous la main, parqué.
- **Reste chantier B** : fusion de deux mismatchs en compromis narratif ; `ProjectFit × DecisionConfidence` ;
  dettes poids-1 / baseline implicite ; régime fonction `/rapport` (cible 200-220 Mo).
- **Mémoire `/memory`** : aucune fiche ne couvre les 4 formes de fondement mismatch — à graver.
