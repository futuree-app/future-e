# Passation — session en cours

**Horodatage** : 2026-07-07 · **Branche courante** : `feat/logement-hotfix-confiance` (créée depuis `main`, NON poussée, 3 commits d'avance). Arbre propre.

## Objectif en cours
Suites de la **revue de board critique du module Logement** (2026-07-07). Un board 4 rôles (product / business / editorial / software-architect) a audité le module ; ses 4 rapports sont versionnés dans `docs/rapports-agents/*/2026-07-07-board-logement-revue-critique.md`. Le porteur a validé un **plan d'exécution en 5 étapes** (mensonges visibles → fondations → cache → extraction → spec 1b). **Étapes 1 et 2 LIVRÉES** sur la branche. Reprise = **étape 3**.

## Le plan en 5 étapes (référence de reprise)
1. **Hotfix confiance + fuites** — FAIT (`5c1ce78`).
2. **Migration adresse (re-key)** — FAIT (`2d3c056`).
3. **Artefact serveur + contrat de cache** — À FAIRE (prochaine étape). Voir détail plus bas.
4. **Extraction des faces** hors `LogementModule.tsx` (une face = un fichier ; `logement-report-types.ts` partagé route↔client ; module réduit ~300 l.).
5. **Spec 1b** : réordonnancement (synthèse en tête) + rehydratation (rouvrir la page sur l'artefact sauvegardé). Brainstorm-first, convoquer Design Critic + Editorial.

## Fait dans cette session
- **Board 4 rapports** écrits + versionnés (`docs/rapports-agents/{product-strategist,business-strategist,editorial-writer,software-architect}/2026-07-07-board-logement-revue-critique.md`). Synthèse croisée rendue au porteur (non versionnée, vit dans le transcript).
- **Étape 1 — hotfix confiance + fuites** (`5c1ce78`) :
  - Hero réécrit (« Ce logement, lu à son adresse. / Énergie, risques, entourage. ») : retrait des promesses mortes « valeur / trajectoire de valeur / pression assurantielle » et de l'antithèse d'emphase.
  - Aside « Les briques du module » supprimée (« Assurance et sécheresse · Lecture à venir » = description d'une absence). Hero passé pleine largeur.
  - Passeport : « Passoire thermique. » → « Classé {lettre} au diagnostic énergétique. » (fin du label de bien ; la glose reste dans le bloc Énergie).
  - Bloc « Actions documentées » **entièrement retiré** (4 cartes /savoir sur 5 en 404, carte assurance contredisant la sinistralité, carte sols-pollués violant la frontière Santé, carte comparateur à promesse fausse). `ActionCard` + vars `isPassoire`/`hasRegulatoryZones` supprimés. Reconstruction « À vérifier avant de décider » renvoyée au spec 1b. **Porteur a confirmé la suppression sèche** (pas de carte comparateur reformulée).
  - Fuites : gate `canAccessCompleteReport` (inline) ajouté sur `POST /api/synthesize-quartier` et `POST /api/georisques-logement`, jusque-là curlables anonymement ; `GET ?q=` de georisques (mort, non authentifié) supprimé + import `geocodeBanAddress` retiré.
  - 3 événements PostHog sur l'entrée adresse : `logement_address_selected` (entrée), `logement_analyzed` enrichi d'un `address_token` non réversible (djb2, pas d'adresse stockée), `logement_same_commune_multi` (émis dès ≥2 adresses distinctes analysées dans une même commune sur la session = signal de re-key + preuve du cas d'usage comparaison).
- **Étape 2 — re-key artefact sur l'adresse** (`2d3c056`) :
  - `supabase/21_logement_rekey_adresse.sql` : add `logement_id` (backfill = insee, non destructif), bascule PK `(user_id, insee)` → `(user_id, logement_id)`, `insee` en colonne indexée.
  - `logement-store.ts` : `LogementRow.logement_id` ; `getLogement`/`upsertLogement`(onConflict)/`saveSynthesis` clés sur `logement_id`.
  - Routes `logement-autour`/`logement-dpe`/`synthesize-logement` : reçoivent et clent sur `logement_id` (le body de synthèse passe de `insee` à `logementId`).
  - Client : `address.id` (banId, déjà échoué par le serveur georisques) exposé au type `ApiResponse.address` et threadé dans `requestAutour`/`persistDpe`/`LogementSynthesis`. `insee` reste porté pour la colonne + analytics.
- **4 rapports board versionnés** (`e…` commit dédié, après les 2 étapes).
- Vérifs à chaque étape : `tsc` + `eslint` (fichiers touchés) + tests libs (`node --test`, 13/13) + `npm run build` : tout vert.

## Décisions prises (porteur) — pas encore dans le vault
- **Ordre d'exécution validé** = les 5 étapes ci-dessus. Fondations (re-key + artefact serveur + extraction) AVANT le réordonnancement 1b : réordonner le monolithe de 1200 l. sans extraction « coule le béton au mauvais endroit » (arbitrage Architecte, retenu).
- **Suppression sèche du bloc AGIR** validée (pas de cross-sell comparateur intermédiaire ; la vraie sortie « À vérifier avant de décider » vient en 1b).
- **Nuances porteur sur la stratégie** (à honorer en 1b et après) : (a) « 70 % reconstructible » est vrai techniquement mais un utilisateur normal n'assemble pas Géorisques+DPE+ERRIAL+ChatGPT ; la valeur payante = hiérarchisation + croisement + engagement + mémoire des biens + comparaison + export + checklists. (b) climat×bâti = héros MAIS **jamais une fausse prédiction** (« invivable en 2050 » interdit ; formuler « des détails du bâti qui comptent peu aujourd'hui peuvent devenir décisifs dans un climat plus chaud »). (c) La sortie d'engagement commence par « quoi vérifier / demander / documenter / comparer / quelles pièces obtenir », **les euros plus tard**.
- **Débat non tranché, à instruire par la donnée** (Product vs Business) : clôture de synthèse posture-neutre vs adressée au projet → A/B après 20 générations réelles, PAS graver. Persistance par adresse validée (fait), mais lecture des chiffres PostHog `relation_inferee`/`logement_same_commune_multi` avant d'aller plus loin sur le multi-biens.

## État git
- Branche `feat/logement-hotfix-confiance` : 3 commits d'avance sur `main` (`5c1ce78` étape 1, `2d3c056` étape 2, + commit docs des 4 rapports board). **NON poussée. Aucune PR ouverte.**
- `main` = `origin/main` (`8067b3e`, à jour, 0 commit d'avance). Le socle spec 1a synthèse est bien sur `origin/main`.
- Arbre propre (rien de non commité).

## Prochaine étape immédiate (sans ambiguïté) — ÉTAPE 3
**Artefact serveur + contrat de cache.** Trois gestes, dans cet ordre :
1. **La ligne `logement` devient la SOURCE des faits.** Aujourd'hui `georisques-logement` calcule les faits puis les jette (stateless), et `synthesize-logement` fait confiance à `body.data` envoyé par le client (vecteur d'injection dans la voix + hash forgeable + générations LLM sans plafond). Cible : persister les faits de l'analyse dans la ligne au moment de l'analyse ; `synthesize-logement` ne reçoit du client qu'un `logementId`, reconstruit le payload depuis la base via `buildSynthesisPayload`. Version minimale acceptable en attendant la refonte complète : plafond de générations par (user, jour) + validation Zod du body.
2. **Hash de CONTENU, pas d'identité.** Remplacer `buildFactHash(lat:lon:dpeId:SOURCES_VERSION:PROMPT_VERSION)` par `hash = SHA-256(sérialisation stable de buildSynthesisPayload(data)) + SYNTHESIS_PROMPT_VERSION`. Motif : le hash actuel ne voit pas les changements de sources amont (ONRN/Géorisques muets) et `SOURCES_VERSION` est la version **Face 3** recyclée (bump Face 3 = invalidation surprise de toutes les synthèses). Mettre à jour la lib `logement-synthesis-cache.ts` + ses tests + le gating client dans `LogementSynthesis.tsx` (le `factHash` de session doit devenir le même contrat).
3. **Gate de complétude avant persistance.** (a) `synthesisReady` (dans `LogementModule.tsx`, ~calcul après `dpeTerminal`) doit ATTENDRE `autour` terminal (`complete`/`failed`), pas seulement `result && dpeTerminal` : sinon la synthèse se génère sans la section « autour » et se fige incomplète (le snapshot arrive après, le hash ne bouge pas). (b) Dans `synthesize-logement/route.ts`, poser un flag `completed` après la sortie propre de la boucle de stream ; `after()` ne persiste QUE si `completed` (la doc Next confirme que `after()` s'exécute même si la réponse a échoué → un abort client persiste sinon un texte tronqué comme artefact définitif). (c) Régler le bouton « Régénérer » qui ment (re-POST → hash identique → cache hit → même texte) : soit ajouter un paramètre `force`, soit le renommer en retry d'erreur.

## À lire d'abord à la reprise
1. `/memory/MEMORY.md` puis `/memory/project_module_logement.md` (état module + priorité de reprise, très à jour ; note la ligne « Spec 1a LIVRÉ + MERGÉ »).
2. Les 4 rapports board : `docs/rapports-agents/software-architect/2026-07-07-board-logement-revue-critique.md` (LE plus important pour l'étape 3 : critiques 2, 3, 6 + « décision à graver » + « version minimale »), puis product/business/editorial pour le cadrage.
3. Fichiers de l'étape 3 : `src/app/api/synthesize-logement/route.ts`, `src/lib/logement-synthesis-cache.ts` (+ `.test.ts`), `src/components/report/LogementSynthesis.tsx`, `src/components/report/LogementModule.tsx` (calcul `synthesisReady`/`synthesisData` ~l.840), `src/app/api/georisques-logement/route.ts` (buildReport = la source des faits à persister), `src/lib/logement-store.ts`.
4. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur ; note : daté du 26 juin, potentiellement périmé).

## Pièges / fils ouverts
- **Migrations 20 ET 21 NON appliquées en base** (au porteur, comme 19). Tant que 21 n'est pas passée, le code s'attend à la colonne `logement_id` qui n'existe pas → `upsertLogement`/`getLogement`/`saveSynthesis` échouent. **À appliquer (20 puis 21) avant tout test en session payante.** Ordre : 17/18/19 (déjà passées) → 20 (synthèse) → 21 (re-key).
- **Rien n'est poussé** (ni la branche, ni de PR). `main` est à jour côté origin.
- **Contrôles visuels toujours en attente** (session payante, `NEXT_PUBLIC_AUTO_SYNTHESIS=true`) : (a) socle thermique Face 1 A/B1/C jamais vu à l'œil ; (b) comportement artefact synthèse (auto-stream, posture ne relance rien, reload=cache, changement DPE régénère) ; (c) hero réécrit + suppression AGIR jamais vus rendus. À faire après application des migrations.
- **Course autour/synthèse ENCORE présente** tant que l'étape 3 (gate de complétude) n'est pas faite : la synthèse peut se figer sans le bloc « autour ». C'est précisément le geste 3 de l'étape 3.
- **`ApiResponse` charge encore `zfe`/`irep`/`cartofriches`/`communeData` riche** (frontières fermées côté produit, appels toujours payés côté API) : nettoyage prévu, PAS bloquant, à traiter lors de l'extraction (étape 4) ou avant.
- **`AUTO_SYNTHESIS` OFF par défaut** en dev : la voie de test de la synthèse reste le bouton « Générer la lecture ».
- **Duplication Quartier/Logement** : les prompts restent séparés (décision Architecte, NE PAS factoriser la voix) ; seule la plomberie de streaming (~50 l. verbatim, probe→502 + repompage) est à factoriser au 3e module — à garder en tête pour l'étape 3 geste 3 (le helper de stream absorberait le flag `completed`).
