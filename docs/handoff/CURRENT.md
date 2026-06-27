# Brief de passation — session vivante

**Horodatage** : 2026-06-28 (nuit) · **Branche** : `main` (poussé jusqu'à `9862459`)

## Objectif en cours

**Harmonisation de la page d'accueil avec le moteur réel.** Le porteur a tranché : l'accueil
EST volontairement un teaser léger (premier écran + « questions en tension »), c'est la FORME qui
reste. Le problème était que son SUBSTRAT de données avait divergé du moteur enrichi.
**Parties 1 ET 2 LIVRÉES** (non commitées, tsc propre). Reste : commit + vérif runtime + le fil
moustique→Santé (Data Curator).

## Fait dans cette session

1. **Audit Software Architect** (rapport : `docs/rapports-agents/software-architect/2026-06-27-harmonisation-substrat-accueil.md`) :
   3 substrats confirmés (A index / B socle `gatherCommuneEnrichment` / C moteur privé de l'accueil
   `FutureELanding.tsx`). Correction clé : le **climat de l'accueil n'est PAS divergent** (il appelle
   `getClimatDataCommune`, même lib que B). La vraie dette = les **catégories éditoriales** (cartes
   profondeur + choix des questions) dérivées du **préfixe département** au lieu de la commune.
2. **Comptage Supabase** (état réel) : `communes_categorization` = **44 communes** manuelles (sur
   ~34 788) → 99,9 % retombaient sur le préfixe dept. `tensions_catalog` = 27 questions actives.
   `tension_answers` = **6** (mais ce n'est qu'un FILET : la vraie réponse est générée live par Claude
   via `/qna` avec le climat + risques de la commune). `communes_tension` legacy = 1271 lignes (à jeter).
3. **PARTIE 1 LIVRÉE (non commitée, tsc propre)** — l'accueil tire ses catégories de la vraie donnée
   commune. 4 fichiers :
   - `src/lib/commune-categories.ts` : fix des tags cassés à la SOURCE (`vectoriel`→`colonise_albopictus`,
     `littoral`→`littoral_atlantique`/`_mediterranee`), sets dept exposés + `deptRegionalCategories`.
   - `src/lib/comparateur-vie.ts` : nouvelle `deriveCategoriesFromEntry(c)` = mapping donnée commune →
     vocabulaire complet du catalogue (régional au dept ; côte/montagne/densité/mobilité/industrie/agri
     à la commune). Seuils tolérants assumés (doctrine : choisir un angle, pas afficher un chiffre).
   - `src/app/api/landing-signals/route.ts` : endpoint, repli dept pour Paris/Lyon/Marseille (absents
     de l'index, interrogés par code commune).
   - `src/components/FutureELanding.tsx` (~l.1238) : fetch `/api/landing-signals` au lieu de
     `deriveCategories(dept)`. Catégorisation manuelle (44) reste prioritaire. Climat + mécanisme de
     réponse + forme INCHANGÉS.
   - Vérifié offline sur 8 communes : Brest réveille `surfer_ici`, Nice `baignade_ici`, Grenoble
     `vallee_industrielle`+`ski_ici`, Auch `rural_agricole`+moustique. 10-17 questions vs 5-8 avant.
   - **Partie 1 est indépendamment shippable** (ne touche qu'aux questions climat/risque déjà répondables).
4. **Baignade atlantique** corrigée EN BASE (déjà live) : `tensions_catalog.baignade_ici.categories` =
   `{littoral_mediterranee, littoral_atlantique, rural_lacs}`.
5. **Audit Editorial Writer** sur 6 candidates de nouvelles questions (rapport :
   `docs/rapports-agents/editorial-writer/2026-06-27-questions-tension-accueil.md`).

## Décisions prises (porteur = tranché)

Set FINAL des nouvelles questions à câbler (Partie 2), formulations validées par l'Editorial + porteur :
| id (préfixe NEUF requis) | label_template | subtitle | déclencheur (catégorie) |
|---|---|---|---|
| Q1 `calme_*` | Trouver le calme à {commune} ? | Routes, voie ferrée, avions | `expose_bruit` ← calmeSonore exposé |
| Q2 `tc_*` (PAS `voiture`/`mobilite`) | Vivre sans voiture à {commune} ? | Tram, métro, marche | `reseau_tc` ← reseauLocal crédible |
| Q3 `croissance_*` | S'installer à {commune} pendant qu'elle change ? | Nouveaux arrivants, prix, écoles | `croissance_forte` ← demographie haute |
| Q4 `vielocale_*` | Une vraie vie locale à {commune} ? | Commerces, cafés, associations | `faible_vie_locale` ← vieLocale basse (non dense) |
| Q7 `quitter_*` | Quitter la ville pour {commune} ? | Cadre de vie, services, isolement | réutilise `rural_peri_urbain` (existe déjà) |

- **Q5 (passé industriel) SUPPRIMÉE de l'accueil** (Editorial : promet au-delà de la preuve, stigmatise ;
  sa place = le rapport / futur module Santé).
- **Q6 (étudiant) ABANDONNÉE** (reste un critère du rapport, pas d'accroche dédiée).
- Q2 : porteur a choisi « Vivre sans voiture » (accroche) plutôt que « Lâcher la voiture » (option fidèle de l'Editorial).

## PARTIE 2 LIVRÉE (non commitée) — détail

Le blocage `/qna` est levé : il reçoit maintenant les signaux index A et les passe à Claude
(plus d'invention, règle d'attribution respectée). Fait :
1. **`/qna` étendu** (src/app/qna/route.ts) : récupère `getCommuneEntry(inseeCode)` +
   `buildTerritorySignals`, injecte `territory_signals` (QUALITATIFS, jamais de percentile brut) dans
   `available_context` + ligne système sur l'usage honnête. L'accueil passe `inseeCode` au fetch.
2. **`buildTerritorySignals(entry)`** dans comparateur-vie.ts : traduit calme/transports/vie locale/
   démographie/expo industrielle/nature/ensoleillement/train en niveaux + faits nommables.
3. **4 règles** ajoutées à `deriveCategoriesFromEntry` : `expose_bruit` (calmeSonore≤40), `reseau_tc`
   (tram/métro/acces≥60), `croissance_forte` (demographie≥80), `faible_vie_locale` (vieLocale≤30 non dense).
4. **Règle de diversité** (porteur) dans `buildTensions` (FutureELanding.tsx) : 3 climat + 1 territoire
   GARANTI (slot réservé à `TERRITORY_TENSION_IDS`). `dedupeTensions`→`dedupeByPrefix`, `MAX_TENSIONS=4`.
5. **5 lignes insérées** dans `tensions_catalog` (EN BASE, déjà live) : `vielocale_reelle`(p1),
   `croissance_transformation`(p2), `quitter_ville`(p2), `tc_sansvoiture`(p2), `calme_infra`(p3).
   Priorités calibrées pour la DIVERSITÉ : la question territoire la plus SPÉCIFIQUE gagne le slot
   (vie locale faible > croissance/transports/quitter > calme qui est le plus commun).
   Simulé OK : Brest→transports, Nice→croissance, Auch→quitter, rural tissu faible→vie locale.

## Prochaine étape immédiate

1. **Vérif runtime** (dev server) : saisir Brest / Nice / un rural à vie locale faible, cliquer une
   nouvelle question, confirmer que la réponse Claude s'appuie sur les territory_signals (pas d'invention).
2. **Design Critic** sur la longueur des labels (« S'installer à {commune} pendant qu'elle change ? » +
   commune longue peut casser la carte — limite signalée par l'Editorial).
3. **Commit** de tout (Parties 1+2). cf. État git.

## Autres fils ouverts (par priorité)

1. **Moustique tigre = signal structuré qui ne vit QUE dans l'accueil** (`DEPT_VECTORIEL` dans
   commune-categories.ts). Absent de l'index A et du socle B → ni `/ou-vivre`, ni rapport, ni synthèse.
   Le porteur trouve ça anormal (à juste titre). → matière pour le **module Santé environnementale** ;
   le faire entrer dans le système = **Data Curator** (granularité dept seulement, est-ce assez fin ?).
2. **Commit de la Partie 1** : 4 fichiers propres, à committer (le porteur n'a pas encore tranché ce soir).
3. **Git LFS** : `data/comparateur-index.json` = 67,7 Mo (>50 Mo warne GitHub).
4. **Passe de surface** : exposer `uu_pop` (TerritoryIdentityCard) + `hlm_pct` (LogementModule).

## État git

- Branche `main`. Working tree = changements PRÉ-EXISTANTS non-miens, à NE PAS committer :
  `src/components/PaymentForm.tsx`, `PaymentWrapper.tsx`, `comparateur/pack-decision/PackPaymentPanel.tsx`,
  `?? docs/rapports-agents/researcher/2026-06-27-relation-territoires.md`.
- **MES changements Parties 1+2, NON commités** : `src/lib/commune-categories.ts`,
  `src/lib/comparateur-vie.ts`, `src/app/api/landing-signals/route.ts`, `src/app/qna/route.ts`,
  `src/components/FutureELanding.tsx`, + rapports d'agents (`software-architect/`, `editorial-writer/`).
- **EN BASE Supabase (PAS dans git, déjà live)** : baignade atlantique + 5 nouvelles lignes
  `tensions_catalog`. Si rollback du code, ces lignes restent : leurs catégories (`expose_bruit` etc.)
  ne seraient alors émises par personne → questions dormantes, sans casse.

## Pièges / fils ouverts

- **`dedupeTensions` (FutureELanding.tsx l.203) regroupe par préfixe d'id avant le `_` ET plafonne à 4
  questions affichées.** D'où : préfixe NEUF obligatoire pour chaque nouvelle question (sinon écrasée),
  et `priority` détermine lesquelles surfacent réellement.
- **`tensions_catalog` est lu EN DIRECT par l'accueil** : ne PAS insérer de ligne tant que `/qna` ne sait
  pas répondre avec la vraie donnée (sinon réponses inventées en prod).
- **`pression_agricole` ne traque PAS la ruralité** (Auch 12 < Brest 24) ; pour `rural_agricole` j'utilise
  `nature.composition.agricole` (Auch 37 %), pas pression_agricole.
- **tsc** : erreur pré-existante `.next/types/validator.ts` (route `suivi-bientot`) sans rapport — ignorer.
