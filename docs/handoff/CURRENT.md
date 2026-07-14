# Passation — les lots 2a et 2c sont livrés ; il reste 1 migration à appliquer, puis `mismatch`

**Horodatage** : 2026-07-14 · **Branche** : `main` (17 commits d'avance sur `origin`, **non poussés**)
**Dernier commit** : `6f593b7` (corpus de parité, témoin gelé supprimé) · **Aucune PR ouverte.**

---

## ⚠️ LA SEULE ACTION BLOQUANTE : appliquer la migration

`supabase/24_reachability_artifact.sql` **n'est pas appliquée** (Supabase > SQL Editor). Sans elle, le cache
des artefacts de mobilité vit **en mémoire du process** : il fonctionne, mais il meurt à chaque redémarrage
et n'est pas partagé entre instances. Le code le gère sans tomber (`reachabilityStore()` rend `null` sans
clés, et une base indisponible fait simplement rappeler l'API), donc **rien n'est cassé** ; c'est du confort
et de la protection contre le rate-limit d'IGN qu'on n'a pas encore.

---

## Ce qui a été livré

**Lot 2a** (`docs/superpowers/plans/2026-07-14-lot2a-references-nommees.md`) : « à 30 minutes de la gare
Matabiau » devient **posable**, **résoluble** et **évaluable**. Parse étendu (temps + mode + lieu non
communal), géocodage POI Géoplateforme + BAN avec ses contrôles, isochrone IGN, point-dans-polygone.

**Lot 2c** (`docs/superpowers/plans/2026-07-14-lot2c-itineraire-tranche-la-bande.md`) : **l'itinéraire
tranche la bande**. Chaque commune affichée porte une **durée estimée**.

Sur « à moins de 30 minutes en voiture de la gare Matabiau, au calme » :

| | avant le lot 2c | après |
|---|---|---|
| communes proposées | 27 | **16** (onze étaient au-delà de 30 min : proposées à tort) |
| confirmées | 7 | **14** |
| « à la limite du seuil » | 20 | **2** |
| durée affichée | aucune | **oui, sur chaque carte** |

## Les faits d'enquête qui commandent le code (vérifiés contre les API, pas supposés)

1. **La BAN ne sait pas géocoder une gare** : elle rend « **Rue** Matabiau » (`street`, 0,71). C'est la
   Géoplateforme (`index=poi`, BDTOPO) qui connaît la gare.
2. **LE SCORE NE DÉCIDE PAS, LA CATÉGORIE DÉCIDE.** Sur « hôpital de Purpan », le **mieux classé** (0,65) est
   le *Centre de Formation Métiers de la Santé CHU Hôpital de Purpan*. Le vrai hôpital est à **0,42**. Un
   plancher de score à 0,6 l'aurait **tué**. Ne jamais remonter `MIN_SCORE` sans refaire ce test.
3. **Deux lieux à 2,5 km sont deux lieux** : « gare de Lyon » en rend cinq, toutes au même score. Dédup à
   **300 m**, jamais 5 km, et le cas normal est `ambiguous`.
4. **Le vélo n'existe pas** chez IGN (HTTP 400 partout) : `unsupported_metric`, et le produit ne le propose
   pas dans sa question. Vérifié à l'écran : le comparateur **annonce** qu'il n'a pas pu appliquer la
   condition, au lieu de l'approximer.
5. **Les deux services IGN sont COHÉRENTS** : sonde sur les 12 communes les plus proches de la gare,
   isochrone 12 min contre itinéraire, **zéro désaccord**. Donc `outside → exclusion` est un filtre
   **fiable**, et aucun filet de sauvetage n'est nécessaire.
6. **Le rate-limit, mesuré** : concurrence 3 → 0 erreur ; 6 → un 429 ; **12 → douze 429**. D'où le limiteur
   **global au process** (`ign-limiter.ts`), qui respecte `Retry-After`. Ne jamais le contourner.

## L'architecture, et ce qu'elle promet (et ne promet pas)

```
parse (temps + mode + lieu non communal)
  → resolveExternalReferences (SERVEUR : le seul module qui touche le réseau)
      geocode-place.ts   : POI + BAN en parallèle, candidats FUSIONNÉS, `degraded` si un service est tombé
      place-screening.ts : LES CONTRÔLES (type attendu, CATÉGORIE, libellé, territoire, plancher anti-bruit)
      isochrone.ts       : un polygone depuis le LIEU  ─┐
      route-time.ts      : un itinéraire par commune   ─┴─ tous deux via ign-limiter (concurrence 3)
  → hydrateHardConstraints (PURE)
      → noyau : evaluateNearPlace
            l'ESTIMATION prime sur la GÉOMÉTRIE, si elle CONCORDE (même départ, arrivée, mode)
          → comparateur : affine les 24 meilleures par score, retire celles hors seuil, marque le reste
          → dossier     : estime SA commune (ou SON adresse : demande distincte), satisfied/incompatible
```

**Ce que le cache promet** : mémoire (le process ne recalcule pas), en vol (deux lecteurs simultanés ne
partent pas tous les deux), table (deux instances partagent, et un redémarrage ne perd rien).
**Ce qu'il NE promet PAS** : il ne déduplique pas deux premiers calculs **strictement concurrents** sur deux
instances (pas de verrou distribué). Ne pas l'annoncer autrement.

## Invariants à ne PAS casser

- **Un temps de trajet n'est JAMAIS évalué par un haversine**, et aucune minute n'est **jamais** convertie en
  kilomètres, ni dans le code, ni dans le prompt.
- **« Estimé à environ »**, jamais un temps posé comme un fait : le moteur calcule sur son graphe (ni trafic,
  ni stationnement, ni attente). On a corrigé un filtre qui mentait, on ne le remplace pas par une fausse
  précision.
- **L'estimation se PROUVE** : elle ne prime que si son départ, son arrivée et son mode correspondent à ce
  qu'on évalue (concordance au mètre). Sans ce garde-fou, une durée calculée depuis le **centroïde**
  trancherait le sort d'une **adresse**. Un test de parité est tombé sur exactement ce piège.
- **L'arrondi ne masque JAMAIS le franchissement** : 30,4 min ne s'affiche pas « 30 minutes, au-delà de la
  limite de 30 minutes ». La décimale apparaît quand l'arrondi contredirait le verdict.
- **Une panne n'est jamais un constat** : `geocoding_unavailable` ≠ `no_result` ; `routing_unavailable` ≠
  `incompatible`. Retentables, ne filtrent pas, **ne se persistent jamais**.
- **Aucun plafond silencieux** : une commune non affinée **faute de budget** n'est pas une commune dont le
  routage a **échoué**. Les deux états sont distincts, et tous deux sont dits (bandeau + badge).
- **Une géométrie illisible rend `unusable`, jamais `outside`.**
- **Le noyau reste PUR** : ni `server-only`, ni `fetch`. Les libs pures n'importent le reste qu'en **type**.
- **Ne jamais utiliser `git add -A`** : le porteur édite en parallèle.

**Après toute modification** :
```bash
node --test src/lib/*.test.ts src/lib/decision/*.test.ts   # 450 verts aujourd'hui
npx tsc --noEmit                                            # 0
node --env-file=.env.local scripts/probe-conclusion.ts      # 15/15
```

## Limites connues (ce ne sont pas des bugs)

- **Le grain reste le CENTROÏDE communal.** À 12 minutes de la gare Matabiau, aucune commune de France n'est
  retenue, **pas même Toulouse** (son point de référence est à 14,8 minutes, vérifié par itinéraire) alors
  que la gare est *dans* Toulouse et que des quartiers entiers sont à 5 minutes. La cible est la **géométrie
  communale** (la spec §3.3 la nomme déjà « la bonne cible, hors de ce spec »).
- **Latence du comparateur** : ~6,8 s à froid (24 itinéraires, concurrence 3), ~1,5 s ensuite. La migration
  étendra ce gain à tous les lecteurs. Si c'est trop, baisser `REFINE_BAND_CAP` (12 → 4,9 s, mais 9 communes
  restent incertaines au lieu de 2).
- **Les 300 m de tolérance sont une convention prudente PROVISOIRE**, pas une précision mesurée. Depuis le
  lot 2c, elle compte moins : l'itinéraire tranche la bande.

## PROCHAINE ÉTAPE : le chantier B, `mismatch`

Un lieu répond **mal** à une priorité déclarée, sans que ce soit éliminatoire : ce n'est ni une
incompatibilité, ni un compromis, ni une inconnue, ni une vérification. Il entraîne un nouvel outcome de
règle, une **orientation refondue**, une **table de vérité réécrite**, une **section propre** (un mismatch
demande d'être **arbitré**, pas examiné), un **bump de `DECISION_NARRATIVE_PROMPT_VERSION`** et un
re-passage de la sonde. C'est seulement après B que les préférences à score (`cadre_calme`, `vie_locale`,
`nature`, `acces_ecoles`) pourront être couvertes honnêtement : sans `mismatch`, une règle qui les examine
n'aurait **aucun outcome honnête à rendre** quand le score est mauvais.

**Reste aussi en réserve** (le lot 2b d'origine, jamais fait, et sa valeur est faible) : persister
`ResolvedPlaceReference` dans `UserProject` + read repair. Le comparateur étant **anonyme**, cela ne le sert
pas ; et le géocodage est déjà mis en cache. À ne faire que si un besoin d'**opposabilité** (tracer ce que
futur•e a affirmé, avec quelle référence) le justifie.

## À lire d'abord à la reprise

1. `/memory/MEMORY.md`, puis la fiche `project_dossier_decision`.
2. Les deux plans (les faits d'enquête y sont, avec la raison de chaque contrôle).
3. Code : `place-screening.ts` (les contrôles) → `ign-limiter.ts` (le rate-limit) → `route-time.ts` →
   `hard-constraints.ts` (`evaluateNearPlace`, `estimationConcorde`) → `hard-constraints-filter.ts`
   (« retenue, pas confirmée ») → `parity.test.ts` (le corpus qui a remplacé le témoin gelé).
