# Rapport d'architecture — Software Architect (futur•e)
## Sous-système `src/lib/comparateur-vie.ts` (2317 lignes)

> Produit par l'agent **Software Architect** le 2026-06-26, en **test à froid de validation** de
> son mandat (premier run depuis sa création). Cible choisie pour exercer sa signature « temps de
> reprise » : le plus gros fichier du moteur. Read-only : l'agent propose, le porteur tranche,
> Claude principal applique. Trouvailles vérifiées contre le code réel (`default:` de `subScore`
> L.1006, `byInsee` reconstruit L.2254 redondant avec `inseeIndexCache` L.513) : exactes.
> Verdict de validation du mandat : **concluant** (garde-fou anti-caricature bien exercé, section
> facile/difficile substantielle, dette concrète chiffrée en temps de reprise).

---

## Périmètre

- **Fichier** : `src/lib/comparateur-vie.ts` (2317 lignes, `server-only`).
- **Rôle** : moteur déterministe unique du comparateur de communes. Il fait trois choses qui partagent toutes le même index : (1) le **matching** (`matchProjects` : filtre dur → scoring pondéré → tri → étalement → assemblage narratif), (2) les **accesseurs lecture seule du module Territoire** (`getCommuneEntry`, `getTerritoryContext`, `getCommuneDistinctive`), (3) la **comparaison complète** du Pack Décision (`buildComparaisonComplete`, `truncateComparaison`).
- **Ce qu'il appelle** : `@/lib/geo-zones` (table jeton→départements, résolution d'ancres), `@/lib/littoral` (index érosion), et deux JSON lus via `fs` au runtime puis cachés en module (`data/comparateur-index.json`, `data/ze-emploi-na38.json`). Aucune dépendance DB/réseau dans le chemin chaud.
- **Ce qui l'appelle** : routes API `match`, `apercu` (via `matchProjects`/`truncateComparaison`), `parse` (via `PREFERENCE_KEYS`), `synthesize-quartier` et page `rapport/quartier` (via les accesseurs Territoire + `RECIT_DEMOGRAPHIE`), et les libs `territory-identity.ts` / `decision-packs.ts` (types). C'est un **carrefour** : beaucoup de surfaces consomment ses types exportés.

## Ce qui est sain (à préserver d'abord)

- **La frontière IA / déterministe est explicite et tenue.** Le bandeau d'en-tête pose la règle (« le scoring ne choisit JAMAIS via l'IA ») et le code la respecte de bout en bout. C'est l'invariant architectural le plus précieux du fichier : il rend le comportement reproductible et testable sans appel modèle. À ne jamais éroder.
- **Les commentaires de doctrine ne sont PAS du bruit, ils sont la mémoire.** Chaque seuil (88/75 pour `buildClimatInondation`, ×2,0 ratio taille, λ exposition) porte sa justification et souvent ses témoins réels (Nîmes, Lens, Toulouse/Foix). C'est exactement ce qui protège le temps de reprise : un futur-toi comprend *pourquoi* un nombre vaut ce qu'il vaut sans rejouer les arbitrages. C'est l'actif principal du fichier.
- **`subScore` comme table de dispatch unique.** Toute la favorabilité 0–100 par critère transite par une seule fonction. Les autres couches (signaux, comparaison, découverte, compromis) la réutilisent au lieu de recalculer. Couplage central mais *voulu et lisible*.
- **`REASON_POS` / `REASON_NEG` sont des `Record<PreferenceKey, …>` exhaustifs** : oublier un libellé en ajoutant un critère = erreur de compilation. C'est le bon réflexe, et il faudrait l'étendre (voir dette).
- **Les courbes comportementales sont des constantes isolées** (`ISOLEMENT`, `CALME`, `GRANDE_VILLE_*`, `MONTAGNE`). Recalibrer = toucher un tableau d'ancres, sans risque de débordement ailleurs. Excellent pour un produit qui se calibre « au réel ».
- **Conformité déploiement vérifiée** : la note interne (« ajouter à `outputFileTracingIncludes` ») est honorée dans `next.config.ts` (les deux JSON y sont tracés pour `/api/comparateur-vie/match` et `/rapport/quartier`). Pas de piège « marche en local, casse en prod ».

## Dette en temps de reprise (hiérarchisée)

**1. (Majeur) Le rituel « ajouter un critère » est éclaté sur 6 à 8 tables, sans garde-fou de synchronisation.** C'est la vraie dette de ce fichier. Pour ajouter un 31e critère, un futur-toi doit toucher : `PREFERENCE_KEYS`, le type `IndexCommune`, le `switch` de `subScore`, `REASON_POS`/`REASON_NEG`, et selon le cas `DIMENSIONS`, `AMBIENT_DIMENSIONS`, `DECOUVERTE_KEYS`, `COMPROMIS_KEYS`/`COMPROMIS_NEG`. Seuls `REASON_POS/NEG` sont protégés par le compilateur. Le **piège silencieux** : `subScore` se termine par `default: return null`. Si on oublie le `case`, le critère n'est jamais scoré : **aucune erreur, juste un critère muet en production**. Coût concret à la reprise : devoir reconstituer de tête « la checklist des endroits à toucher », et risquer un bug invisible. C'est typiquement le genre de couplage diffus qui se paie deux fois.

**2. (Majeur) `matchProjects` est une fonction de ~385 lignes qui enchaîne 9 phases.** Résolution places → résolution zones → prefs+baseline → filtre → scoring → tri → rollup PLM → dédup/étalement → messages → 2 pipelines d'assemblage narratif. Elle se lit top-to-bottom, ce qui amortit, mais le **bloc d'étalement échelonné** (`anyPreferred`, lignes 2171-2214) est le point le plus opaque du fichier : deux branches divergentes, `zonePicks`/`alt`/dédup imbriqués, sémantique intersection-vs-union des ancres. Un futur-toi qui veut juste « afficher 4 cartes au lieu de 3 » ou changer la règle d'ouverture hors-zone devra relire et re-comprendre toute cette mécanique avant d'oser y toucher. C'est là que se cache le plus de temps de reprise.

**3. (Mineur) Trois concerns cohabitent** (matching / accesseurs Territoire / comparaison complète). La cohésion est réelle (tout repose sur `IndexCommune` + `subScore`), donc je **ne recommande pas** de scinder à la hâte : ça ne ferait que déplacer le couplage et créer du churn d'imports chez 7 appelants. Mais c'est une des causes de la taille, et à signaler comme tension (voir Cohérence).

**4. (Mineur) Répétition du pipeline d'assemblage.** La séquence `assignSignaux → assignIdentite → assignCompromis → assignDecouverte` + `buildDistinctive` est dupliquée pour `shownPicks` (2256-2276) et `pistesPicks` (2282-2292). Si la liste des passes change, il faut penser aux deux endroits. Un petit helper `assembleGroup(picks, …)` supprimerait ce doublon.

## Ce qui peut disparaître

Peu de code mort — le fichier est dense mais utile. Deux points de **travail refait** plutôt que de code à supprimer :
- `byInsee = new Map(communes.map(...))` (ligne 2254) reconstruit une Map insee→commune **sur les ~35k communes à chaque appel** de `matchProjects`, alors que `buildInseeIndex`/`inseeIndexCache` (ligne 518) construit déjà exactement cette Map et la met en cache pour les accesseurs Territoire. Réutiliser le cache existant supprime une reconstruction complète par requête.
- `MASSIF_LABEL`/`DEPT_TO_MASSIF` : sain, juste à mentionner que l'inverse de `ZONE_TABLE` est recalculé en IIFE au chargement (négligeable).

## Performance

Pas d'optimisation spéculative à faire ; un seul point **structurel et mesurable** : le `byInsee` ci-dessus (rebuild O(n) sur tout l'index national à chaque match, redondant avec un cache déjà présent). Le `filter` + `map` de scoring sur tout l'index est intrinsèque (on note tout le territoire) et acceptable en mémoire pour un appel serveur ; je ne le touche pas. `getLittoralIndex()` est appelé même hors intention littorale (pour « le littoral le moins exposé »), mais il est caché et l'intention est documentée — non, pas un problème.

## Conformité à la stack (ADR-0004 + doc Next installée)

Conforme. `import "server-only"` correct pour un module à secret de données serveur, lecture `fs` au runtime + cache module, aucune API Next.js exercée ici (donc rien à vérifier contre `node_modules/next/dist/docs/` : pas de route handler, pas de `fetch`/cache Next, pas de rendu). Le seul point d'intégration Next (tracing du JSON pour le bundling serverless) est correctement déclaré dans `next.config.ts`. Aucun écart à signaler.

## Ce que cette architecture rend FACILE / DIFFICILE à changer (section obligatoire)

**Facile à changer (l'architecture accueille bien) :**
- **Recalibrer un comportement** : déplacer une ancre de courbe, un seuil, un poids. Constantes nommées et localisées, avec leur justification. C'est la forme d'évolution la plus probable d'un produit « calé au réel », et elle est très bien servie.
- **Changer la formulation** d'une raison, d'un palier, d'un récit : tables de libellés isolées, zéro logique mêlée.
- **Ajouter une couche narrative gatée** (logement, calme, héritage…) : ce sont des fonctions pures `(IndexCommune) → string | null`, branchées en un point, sans effet sur le score. Le pattern est clair et réplicable.

**Difficile à changer (l'architecture bloque ou rend coûteux) :**
- **Ajouter un critère** : pas par difficulté technique, mais par **dispersion sans filet** (point 1). Le coût n'est pas dans le code, il est dans la mémoire requise pour ne rien oublier, et le `default: null` transforme l'oubli en bug silencieux.
- **Modifier la règle de sélection/diversité des communes affichées** : le bloc d'étalement (point 2) est le verrou cognitif. Toute évolution du « combien de cartes, lesquelles, quelle ouverture hors-zone » oblige à re-disséquer une mécanique dense à deux branches.
- **Faire évoluer une seule des trois responsabilités sans toucher aux autres** : possible mais inconfortable, car elles vivent dans le même fichier et partagent le type pivot.

## Verdict : **SAIN, avec deux dettes à traiter ciblées**

Garde-fou anti-caricature appliqué : **les 2317 lignes ne sont PAS, en soi, le problème.** C'est un moteur de domaine unique couvrant ~30 critères × plusieurs couches narratives ; cette taille est en grande partie *gagnée*. Le découper maintenant déplacerait le couplage et coûterait plus qu'il ne rapporterait. Et les commentaires de doctrine, qu'un audit superficiel prendrait pour du verbiage, sont précisément ce qui **réduit** le temps de reprise : ne pas les élaguer.

Ce qui compte vraiment, et que je hiérarchise au-dessus du reste :
1. **Verrouiller le rituel « ajouter un critère »** : c'est la dette qui se paiera deux fois (oubli silencieux). Petit effort, gros effet.
2. **Isoler/documenter la logique d'étalement** : c'est le point qui coûtera le plus cher à la prochaine évolution de l'affichage.

Le reste (rebuild `byInsee`, doublon de pipeline, cohabitation des 3 concerns) est du détail à traiter par opportunité, pas une urgence.

## Cohérence (tensions posées, non tranchées)

- **Trois responsabilités dans un fichier vs contrainte solo.** Tension réelle entre « un fichier, un sujet » et « ne pas multiplier les fichiers/imports en solo ». Je ne la tranche pas : tant que `matchProjects` reste l'usage dominant et que les accesseurs Territoire sont minces, la co-location est défendable. Le point de bascule serait l'ajout d'une 4e responsabilité ou la croissance des accesseurs Territoire. À surveiller, pas à corriger aujourd'hui.

## Décision à graver (prête pour un ADR / note, à valider par le porteur)

> **Note d'architecture — Procédure d'ajout d'un critère au comparateur.** Ajouter un `PreferenceKey` impose de toucher un ensemble fixe de tables (`PREFERENCE_KEYS`, type `IndexCommune`, `subScore`, `REASON_POS/NEG`, et selon l'usage `DIMENSIONS`, `AMBIENT_DIMENSIONS`, `DECOUVERTE_KEYS`, `COMPROMIS_KEYS`). Deux protections à instaurer : (a) remplacer le `default: return null` de `subScore` par un `default: { const _exhaustive: never = key; return null; }` pour que tout critère non géré devienne une erreur de compilation plutôt qu'un critère muet ; (b) consigner la checklist des tables à mettre à jour en tête de la section Scoring. Objectif : faire porter au compilateur la mémoire que le futur-toi solo n'aura plus.

Aucune modification n'a été faite : ce rapport est read-only et constitue la seule sortie de l'agent.
