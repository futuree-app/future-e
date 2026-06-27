# Brief de passation — session vivante

**Horodatage** : 2026-06-28 · **Branche** : `main` (tout poussé jusqu'à `6904124`)

## Objectif en cours

Deux fils vivants :
1. **CHANTIER ACTIF — « Explorer à partir d'une commune »** : brainstorm terminé, **spec écrit et
   commité** (`6904124`), **EN ATTENTE de validation du porteur** avant de passer au plan
   d'implémentation. C'est la première chose à reprendre.
2. **Stratégie (réflexion, pas de code)** : rapport d'internationalisation du Business Strategist
   produit + critique externe ChatGPT analysée. Décisions de cadrage prises, à capitaliser.

## Fait dans cette session (tout poussé sur main)

1. **Harmonisation accueil** (`5283b2b`) : l'accueil tire ses catégories de la vraie donnée commune
   (`deriveCategoriesFromEntry` + `/api/landing-signals`) au lieu du préfixe dept ; 5 nouvelles
   questions territoire (calme/transports/croissance/vie locale/quitter) avec `/qna` nourri de
   `territory_signals` qualitatifs ; règle de diversité 3 climat + 1 territoire. Cf. mémoire
   `project_accueil_harmonisation.md`.
2. **uu_pop** (`540faf6`) : taille d'agglomération dans la ligne « Rôle » de la carte d'identité Territoire.
3. **STATIC_ANSWERS** (`1ecdd2e`) : 3 réponses de secours codées en dur (La Rochelle/Bressuire)
   réécrites en générique commune-agnostique. Démo d'accueil (villes-exemples) intact.
4. **Spec « Explorer à partir d'une commune »** (`6904124`) :
   `docs/superpowers/specs/2026-06-28-explorer-depuis-commune-design.md`.
5. **Rapport internationalisation** (Business Strategist, **fichier non commité, untracked**) :
   `docs/rapports-agents/business-strategist/2026-06-28-internationalisation.md`. Verdict : DIFFÉRER.

## Décisions prises (porteur = tranché)

**Produit / modules :**
- Prochain module = **Logement** (le logement + la vulnérabilité, le « autour » à définir).
  Cf. mémoire `project_module_logement.md`. Santé environnementale → plus tard.
- **HLM** non surfacé, nulle part (piste d'affichage abandonnée, donnée dormante en base).

**« Explorer à partir d'une commune » (design verrouillé, détaillé dans le spec) :**
- Intention (c) : confirmer/lire ce qu'on aime à l'ancre → proposer des lieux qui le portent.
- Forme = **A** (le parse apprend à lire « comme {commune} » et en dérive des préférences) d'abord,
  **B** (entrée guidée discrète) ensuite si utile. Doctrine Pari #7 : ancrage ≠ similarité, mot
  « similaire » banni, **moteur inchangé**.
- Dérivation = Approche 1 (signature distinctive + faits identitaires), **pas** tous les points forts.
- L'ancre **n'hérite ni de la région ni du climat** ; **l'explicite écrase le dérivé** ;
  multi-ancres = **intersection** des signatures. Dérivation déterministe **dans la route parse**
  (post-LLM), `matchProjects` intact, exclusion de l'ancre via `excludePlace`.

**Stratégie internationalisation (réflexion) :**
- **Décision inchangée : ne pas internationaliser maintenant** (goulot = preuve de paiement B2C France).
- **Paywall** : ne PAS instrumenter pour analyser maintenant (pré-lancement = bruit). Juste vérifier
  un jour que les événements clés (vue paywall → checkout → paiement) se déclenchent, pour ne pas
  perdre la 1re cohorte au lancement. PostHog déjà câblé sur `$ai_generation`.
- **Greffes acceptées à la critique ChatGPT** (à intégrer au rapport BS, voir Pièges) :
  (a) **découpler** l'international du succès du Fil ; (b) reformuler le gate en « moteur économique
  France démontré » (B2C one-shot OU récurrent OU B2B), **pas** un chiffre rond type « 1 000 sessions » ;
  (c) traiter l'international comme un **test de portabilité** à hygiène cheap MAINTENANT (règles
  précises : `territory` pas « commune française », id pays, adaptateurs de sources isolés — PAS
  d'abstraction préventive) ; (d) choisir un futur 1er test par **similarité du système de données**,
  pas par la langue (Belgique/Suisse = piège fédéral/cantonal) ; (e) **réordonner le segment Pro**
  (chasseurs immobiliers / consultants relocation / mobilité d'entreprise AVANT les CGP, car alignés
  sur l'intérêt du client) — contredit l'hypothèse vault « CGP d'abord ».

## État git

- Branche `main`, **tout poussé** jusqu'à `6904124`. Aucune PR ouverte.
- Working tree :
  - `M docs/handoff/CURRENT.md` = ce fichier.
  - `docs/rapports-agents/business-strategist/2026-06-28-internationalisation.md` = commité (avec
    addendum critique ChatGPT + raffinements acceptés).
  - **NE PAS committer (pré-existants, non-miens)** : `src/components/PaymentForm.tsx`,
    `PaymentWrapper.tsx`, `comparateur/pack-decision/PackPaymentPanel.tsx`,
    `?? docs/rapports-agents/researcher/2026-06-27-relation-territoires.md`.

## Prochaine étape immédiate

**Faire valider le spec par le porteur** :
`docs/superpowers/specs/2026-06-28-explorer-depuis-commune-design.md`. Une fois validé, invoquer la
skill **`superpowers:writing-plans`** pour produire le plan d'implémentation, PUIS coder.
**HARD-GATE brainstorming : ne rien implémenter avant validation du spec.**

## À lire d'abord à la reprise

1. `MEMORY.md` (index mémoire), notamment `project_accueil_harmonisation.md`, `project_module_logement.md`.
2. Le spec : `docs/superpowers/specs/2026-06-28-explorer-depuis-commune-design.md`.
3. Vault : `docs/vault/paris.md` (Pari #7), `docs/vault/modules/comparateur.md`,
   `docs/vault/arbitrages/comparateur-un-moteur-trois-portes.md`,
   `docs/vault/arbitrages/carte-nationale-ecartee.md` (si présent ; sinon le board
   `docs/board/traitees/2026-06-26-carte-de-france-synthese.md`).
4. Le code à toucher : `src/app/api/comparateur-vie/parse/route.ts` (le « deviner » existant) et
   `src/lib/comparateur-vie.ts` (`ParsedProject`, `matchProjects`, `getCommuneDistinctive`).
5. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur).

## Pièges / fils ouverts

- **HARD-GATE** : le spec « Explorer-commune » doit être validé par le porteur avant tout code.
- **Greffes ChatGPT** : écrites en addendum du rapport BS (commité). Elles ne sont PAS encore
  reflétées dans le vault (`vision/modele-economique.md` dit toujours « relais B2B = CGP d'abord ») :
  à graver au vault quand le porteur décidera d'ouvrir le B2B.
- **Accueil livré** : les 5 nouvelles questions + uu_pop sont dans le code/la base mais ne
  s'activent qu'au **prochain déploiement** (les nouvelles catégories ne sont émises que par le code
  poussé). Vérifié en runtime local (landing-signals + /qna ancré). Prod = sûr (rien ne s'active avant deploy).
- **Seuil de « distinction »** dans `communeToPreferences` (quels critères = signature) : laissé au
  plan d'implémentation, à fixer (p.ex. percentile ≥ 70).
- **tsc** : erreur pré-existante `.next/types/validator.ts` (route `suivi-bientot`) sans rapport — ignorer.
- **Restes parqués** : Git LFS (`comparateur-index.json` = 67,7 Mo), moustique tigre → signal
  structuré pour module Santé (Data Curator), Design Critic labels (porteur a dit non).
