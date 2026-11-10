# FUT-173 · Immutabilité des conclusions figées (`decision_artifact`)

10 novembre 2026. Audit, reproduction sur base isolée, correctif. Rien n'a été écrit en production.

## En une phrase

Une version `ready` pouvait être réécrite, repassée en `failed` ou supprimée : par son propriétaire, directement avec son jeton et sans passer par le serveur, et par le serveur lui-même dans un cas d'erreur. Désormais, PostgreSQL le refuse à tous les rôles, et le navigateur n'a plus aucun droit d'écriture sur la table.

## 1. Diagnostic

### Ce qui garantissait l'immutabilité avant : rien en base

| Couche | État avant | Conséquence |
|---|---|---|
| RLS `decision_artifact_own_update` (28) | `using (auth.uid() = user_id)`, sans condition de statut ni `with check` | le propriétaire réécrit tout champ de ses lignes, `ready` comprises |
| RLS `decision_artifact_own_delete` (28) | `using (auth.uid() = user_id)` | le propriétaire supprime ses versions prêtes |
| RLS `decision_artifact_own_insert` (28) | `with check (auth.uid() = user_id)`, statut libre | le propriétaire insère une version `ready` au contenu de son choix, ou réserve une place avant le webhook |
| Privilèges | ceux que Supabase pose par défaut : tout pour `anon`, `authenticated`, `service_role` (observé en production : `anon` a SELECT) | TRUNCATE ouvert à tous les rôles au niveau SQL (non exposé par PostgREST) |
| `service_role` | BYPASSRLS | aucune policy ne s'applique au webhook ; seul un trigger l'arrête |
| Code (`decision-artifact-store.ts`) | `completeArtifact` / `failArtifact` filtrent l'identité, pas le statut `generating` ; un UPDATE à zéro ligne rend `error: null` | voir les deux chemins fautifs ci-dessous |

### Pourquoi le navigateur avait ces droits

Trois des quatre chemins de génération écrivaient avec le **client du lecteur** (rôle `authenticated`) :

| Chemin | Client | Fichier |
|---|---|---|
| Webhook Stripe (première livraison) | service role | `src/app/api/stripe/webhook/route.ts:87` |
| Rattrapage commune au rendu de `/rapport` | **jeton du lecteur** | `src/app/(account)/rapport/page.tsx:251` |
| Rattrapage / succession adresse | **jeton du lecteur** | `src/components/report/DossierAvecLogement.tsx:190` |
| « Mettre à jour l'analyse » | **jeton du lecteur** | `src/app/api/dossier/actualiser/route.ts:152` |

Pour que ces écritures marchent, la migration 28 devait laisser au propriétaire INSERT et UPDATE (et DELETE, jamais utilisé par le code). Or un jeton Supabase s'utilise aussi hors de l'application, directement contre l'API REST.

### Les deux chemins fautifs du serveur

1. **Le rattrapage d'exception** (`generate-decision-artifact.ts`, bloc `catch`) appelle `failArtifact` sans filtre de statut. Si `completeArtifact` a été validé en base mais que sa réponse s'est perdue (coupure réseau), le `catch` repasse la version **prête** en `failed`. Le lecteur perd sa version vendue jusqu'à la suivante. Possible, jamais observé : la production ne compte aucune ligne `failed` avec une date de génération.
2. **Zéro ligne = succès.** Un UPDATE qui ne trouve rien rend `error: null` : un `completeArtifact` sur une place disparue ou déjà terminée était un succès silencieux.

### Nature du risque

Intégrité et traçabilité des conclusions vendues, **sans accès inter-comptes** : un autre compte ne lit ni ne modifie rien, avant comme après (cas X1 à X4). Aucune exploitation n'est connue. Le risque est qu'un lecteur fabrique ou altère « ce que futur•e lui a dit », ou qu'une panne serveur efface la version servie.

### Production : ce qui a été vérifié, et comment

Aucun connecteur Supabase n'était disponible dans la session (outil MCP absent, CLI non liée). Vérifié par des **décomptes HEAD en lecture seule** sur l'API REST (aucun payload, aucun identifiant lu), le 10/11/2026 :

| Mesure | Valeur |
|---|---|
| lignes | 96 |
| `ready` / `failed` / `generating` | 80 / 16 / 0 |
| `ready` sans payload ou sans `generated_at` | 0 / 0 |
| non-`ready` avec payload ; `failed` avec `generated_at` | 0 / 0 |
| versions > 1 | 50 |
| `generating` abandonnées (> 15 min) | 0 |
| `anon` : SELECT accordé (HTTP 200, 0 ligne par RLS) | oui |

**Non vérifié en production** : les policies réellement en place, les privilèges d'écriture par rôle, l'absence de trigger existant. Le diagnostic les suppose conformes à la migration 28 et aux privilèges par défaut de Supabase, ce que confirme le SELECT d'`anon`. À faire avant la migration : `supabase/maintenance/fut173-audit-lecture-seule.sql` (transaction `read only`, catalogue seulement).

## 2. Le correctif

**Migration `40_decision_artifact_immuable.sql`**, un trigger et des droits :

- **Trigger `decision_artifact_integrite`** (BEFORE INSERT/UPDATE/DELETE, pour toutes les lignes, tous les rôles, y compris `service_role`) :
  - une ligne naît `generating`, sans payload ni date ;
  - l'identité (`id`, `user_id`, `insee_code`, `scope_key`, `version`, `created_at`) ne change jamais ;
  - transitions permises : `generating → ready` (avec payload et date) et `generating → failed` (sans contenu) ; `ready` et `failed` sont terminaux ;
  - une version `ready` ne se supprime que si son compte n'existe plus (cascade de `auth.users`).
- **Droits** : les policies own insert/update/delete sont retirées ; `authenticated` garde SELECT (RLS inchangée), `anon` n'a plus rien, TRUNCATE est retiré à `service_role`.

**Serveur, strictement nécessaire :**

- `src/lib/decision/decision-artifact-ecriture.ts` (nouveau) : les trois écritures, avec le filtre `status = generating`, et une erreur `AucunePlaceEnCours` quand l'UPDATE ne touche aucune ligne.
- `src/lib/server/decision-artifact-store.ts` : `claimArtifactSlot`, `completeArtifact`, `failArtifact` écrivent avec un client service role interne au module (patron de `retour-utilite-store.ts`) et ne reçoivent plus de client. Les lectures restent sous l'identité du lecteur.
- `generate-decision-artifact.ts` : appels adaptés à la nouvelle signature. Aucune autre ligne ne change ; les routes vérifient déjà le droit avant de générer, et l'identité écrite vient de leur session.

### Pourquoi cette solution, et pas une autre

| Option | Écartée parce que |
|---|---|
| RLS seule (`using (status = 'generating')`) | ne s'applique pas au service role (BYPASSRLS), et laisse le propriétaire écrire le contenu de sa place en cours |
| Révoquer les droits seule | le service role contourne encore tout (cas S1 à S9) |
| Garde en TypeScript seule | n'engage pas la base |
| RPC `security definer` | ajoute une surface d'API ; le trigger donne la même garantie sans changer le transport |
| Dérogation par variable de session | tout rôle peut poser une variable personnalisée : ce serait une porte ouverte |

Le trigger tient l'invariant pour tous les rôles ; les droits séparent qui écrit (le serveur) de qui lit (le propriétaire). C'est le patron déjà en place pour `logement_report_versions` (migration 35).

## 3. Matrice avant / après

Reproduite par `scripts/integration/fut173-decision-artifact-postgres.mjs` : PostgreSQL 18.3 (PGlite), rôles et privilèges par défaut de Supabase, `auth.uid()` lu dans les claims JWT comme PostgREST. Comptes fictifs A et B ; A possède v1 `ready`, v2 `failed`, v3 `generating` sur la même commune ; B possède v1 `ready`. Chaque cas tourne sous le rôle réellement utilisé, dans une transaction annulée.

Codes : `42501` privilège refusé, `23514` refus du trigger, `23001` suppression refusée par le trigger, `23505` contrainte unique. « 0 LIGNE » est un **succès silencieux** pour supabase-js (aucune erreur rendue).

| Cas | Rôle | Opération | AVANT (28) | APRÈS (28+40) |
|---|---|---|---|---|
| P1 | A authenticated | lire ses versions | AUTORISÉ (3) | AUTORISÉ (3) |
| P2 | A authenticated | réécrire le payload de sa v1 ready | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P3 | A authenticated | repasser sa v1 ready en failed | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P4 | A authenticated | changer engine/schema_version, generated_at de v1 | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P5 | A authenticated | supprimer sa v1 ready | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P6 | A authenticated | changer insee/scope/version de v1 | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P7 | A authenticated | donner sa v1 à B (user_id) | REFUSÉ (42501) | REFUSÉ (42501) |
| P8 | A authenticated | insérer une v9 ready au contenu fabriqué | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P9 | A authenticated | réserver une place avant le webhook | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P10 | A authenticated | remplir sa v3 generating (contenu libre) | **AUTORISÉ (1)** | REFUSÉ (42501) |
| P11 | A authenticated | supprimer sa v2 failed (témoin) | **AUTORISÉ (1)** | REFUSÉ (42501) |
| X1 | B authenticated | lire les versions de A | 0 LIGNE | 0 LIGNE |
| X2 | B authenticated | réécrire la v1 de A | 0 LIGNE | REFUSÉ (42501) |
| X3 | B authenticated | supprimer la v1 de A | 0 LIGNE | REFUSÉ (42501) |
| X4 | B authenticated | insérer une version au nom de A | REFUSÉ (42501) | REFUSÉ (42501) |
| N1 | anon | lire la table | 0 LIGNE | REFUSÉ (42501) |
| N2 | anon | insérer | REFUSÉ (42501) | REFUSÉ (42501) |
| S1 | service_role | réécrire le payload d'une v1 ready | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S2 | service_role | ready → failed (SQL de l'ancien failArtifact) | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S3 | service_role | ready → ready (ancien completeArtifact rejoué) | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S4 | service_role | changer l'identité (version) d'une v1 ready | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S5 | service_role | changer user_id d'une v1 ready | REFUSÉ (23505)¹ | REFUSÉ (23514) |
| S6 | service_role | supprimer une v1 ready | **AUTORISÉ (1)** | REFUSÉ (23001) |
| S7 | service_role | insérer directement une version ready | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S8 | service_role | failed → ready (ressusciter v2) | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S9 | service_role | generating → ready SANS contenu | **AUTORISÉ (1)** | REFUSÉ (23514) |
| S10 | service_role | réserver v4 (claim) | AUTORISÉ (1) | AUTORISÉ (1) |
| S11 | service_role | réserver v1 déjà prise (rejeu webhook) | REFUSÉ (23505) | REFUSÉ (23505) |
| S12 | service_role | generating → ready avec contenu | AUTORISÉ (1) | AUTORISÉ (1) |
| S13 | service_role | generating → failed | AUTORISÉ (1) | AUTORISÉ (1) |
| S14 | service_role | supprimer une v2 failed | AUTORISÉ (1) | AUTORISÉ (1) |
| S15 | service_role | TRUNCATE la table | **AUTORISÉ** | REFUSÉ (42501) |
| S16 | service_role | lire toutes les versions | AUTORISÉ (4) | AUTORISÉ (4) |

¹ Refusé avant par hasard : B possède déjà une v1 sur la même commune. Sans cette collision, le changement passait.

### Parcours avec le vrai code d'écriture du serveur (après correctif)

Les fonctions de `decision-artifact-ecriture.ts` exécutées sous `service_role` par un client minimal qui émet le SQL de PostgREST. Les 17 passent :

1. le propriétaire ne peut pas modifier une version ready (payload, statut, versions, date, identité) ;
2. il ne peut pas la supprimer par une requête ordinaire (ni le service role) ;
3. un autre compte ne lit ni ne modifie rien ; `anon` n'a rien ;
4. génération normale `generating → ready` ; 4b. un webhook rejoué ne réserve pas deux fois ;
5. une génération échouée laisse servir la dernière version prête ; 5b. la reprise prend la version suivante, la `failed` reste telle quelle ;
6. une v2 se crée sans mutation de la v1 (ni de la v1 de B) ;
7. transitions et mutations d'identité interdites refusées, même en service role ;
8. le rattrapage `marquerEchec` sur une version déjà prête lève, la version reste prête ; 8b. l'ancien chemin (jeton du lecteur) est refusé ; 8c. une écriture à zéro ligne lève ;
9. suppression de compte : la cascade emporte toutes les versions de B, `ready` comprise, rien de A ; 9b. effacement ciblé par la procédure de maintenance, trigger réactivé ensuite, protection intacte hors procédure ; 9c. la purge 38 lit toujours l'état de livraison ;
10. le retour arrière rétablit exactement les droits de la 28 ;
11. la migration s'applique sur une base qui porte déjà des lignes de tous statuts **sans les modifier**, et se rejoue.

### Reproduire

```
mkdir -p /tmp/pg && (cd /tmp/pg && npm i @electric-sql/pglite@0.5.8)
PGLITE_MODULE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node scripts/integration/fut173-decision-artifact-postgres.mjs
node --test src/lib/decision/decision-artifact-ecriture.test.ts
```

Sortie 0 = conforme, 1 = écart, 3 = non exécuté. Le banc FUT-10 (`fut10-postgres.mjs`), qui applique toutes les migrations 01 → 40 sur une base vierge, passe aussi.

Suite complète `npm test` : 4 306 tests, les 69 échecs sont identiques sur `main` ; 5 échecs de plus n'apparaissent que dans un chemin contenant « · » (tests FUT-27 qui lisent un chemin d'URL encodé, sans lien avec ce ticket).

### Ce que le banc ne prouve pas

- PostgREST et supabase-js eux-mêmes (le client minimal en reproduit les requêtes) ;
- la concurrence réelle : PGlite n'a qu'une connexion. Le raisonnement : deux `figerVersion` concurrents sur la même place se sérialisent sur le verrou de ligne ; le second relit la condition `status = generating` après le premier (READ COMMITTED) et ne trouve rien (il lève), et sans ce filtre le trigger verrait `old.status = ready` et refuserait ;
- les droits réels de production (voir § 1).

## 4. Compatibilité et parcours existants

| Parcours | Effet |
|---|---|
| Webhook Stripe, première livraison | inchangé (service role, réserver puis terminer) |
| Webhook rejoué | inchangé (23505 → `skipped`) |
| Générations concurrentes | inchangé pour la réservation ; une double terminaison lève au lieu de réécrire |
| Rattrapage `/rapport` et adresse, « Mettre à jour l'analyse » | écrivent en service role ; mêmes vérifications de droit qu'avant, en amont |
| Lecture des versions, anciennes comprises | inchangée (SELECT, RLS own) |
| Nouvelle version | inchangée (numéro suivant, la précédente n'est pas touchée) |
| Échec puis reprise | inchangé : `failed` est terminal, la reprise prend le numéro suivant (c'était déjà le contrat de `prochaineVersionAReserver`) |
| Génération abandonnée (`generating` > 15 min) | peut encore aboutir ou échouer ; la reprise prend le numéro suivant |
| Suppression de compte (Auth) | cascade autorisée, toutes versions comprises |
| Purge des intentions (38), audits en lecture | inchangés (lecture seule de la table) |
| Retour d'utilité (39) | aucun lien (pas de clé étrangère vers la table) |
| Scripts de test FUT-10 sur projet de test | le schéma de test inclut la 40 ; ils passent par le code de l'application |

**Artefacts déjà présents** : aucune ligne n'est lue, modifiée ni supprimée par la migration (cas 11). Les 80 `ready` deviennent immuables ; les 16 `failed` restent des témoins ; aucune `generating` en cours. Aucune ligne de production ne contredit le contrat du trigger. Les payloads ne sont pas réécrits.

**Risques de compatibilité :**

1. **Ordre de déploiement.** La migration avant le code casserait les trois chemins qui écrivaient avec le jeton du lecteur (42501) : pas de page en erreur (le lecteur voit l'assemblage vivant, et « Mettre à jour » répond 502), mais aucune version ne naît hors webhook. D'où l'ordre ci-dessous.
2. **`SUPABASE_SERVICE_ROLE_KEY`** doit être présente partout où ces chemins tournent. Elle l'est en production (le webhook en dépend) et dans `.env.local`.
3. **Une réparation de données** sur une version prête n'est plus possible par une requête ordinaire : elle passe par `supabase/maintenance/fut173-effacement-controle.sql` (rôle propriétaire, trigger suspendu le temps d'une transaction).
4. **TRUNCATE** n'est plus accordé au service role. Aucun code ne l'utilise.

## 5. Effacement RGPD

- **Cas ordinaire, suppression du compte** (Supabase > Authentication, ou `auth.admin.deleteUser`) : la cascade de `user_id` supprime toutes les versions, y compris `ready`. Le trigger le permet parce que la ligne du compte n'existe plus au moment de la cascade. Tracé par le journal d'Auth. Testé (9a).
- **Effacement ciblé sans suppression du compte** : `supabase/maintenance/fut173-effacement-controle.sql`, par le rôle propriétaire (SQL Editor), dans une seule transaction qui désactive le trigger, supprime les lignes listées, le réactive et contrôle. Le motif, le compte (identifiant) et les versions se consignent dans le ticket qui demande l'opération. Testé (9b).
- Aucune route ni aucun rôle applicatif ne peut effacer une version prête.

## 6. Déploiement et retour arrière

**Avant toute action en production (GO du porteur requis à chaque étape) :**

1. Contre-revue indépendante de la PR.
2. Lancer `supabase/maintenance/fut173-audit-lecture-seule.sql` en production et comparer : policies = les 4 de la 28, privilèges = défaut Supabase, aucun trigger, colonnes = celles de la 28. Tout écart arrête le déploiement.
3. Recette sur le projet Supabase de test (schéma 01 → 40) : achat de test, rattrapage `/rapport`, « Mettre à jour l'analyse », dépôt d'un diagnostic, suppression du compte de test.

**Déploiement :**

4. Fusionner la PR : le code (écritures en service role) part en production. Il fonctionne avec la migration 28 comme avec la 40.
5. Vérifier en production un rattrapage ou une mise à jour réelle (une version naît).
6. Appliquer `40_decision_artifact_immuable.sql` (SQL Editor), puis relancer l'audit : trigger présent et actif (`O`), policies réduites à `own_select`, `authenticated` = SELECT seul, `anon` = rien.

**Retour arrière :**

- Code seul : revert de la PR ; à faire **après** `40_decision_artifact_immuable_down.sql` si la 40 est déjà appliquée (le code antérieur écrit avec le jeton du lecteur).
- Migration seule : `40_decision_artifact_immuable_down.sql` rétablit les policies et privilèges de la 28 (testé, cas 10). Aucune donnée n'est touchée dans un sens comme dans l'autre.

## 7. Fichiers

- `supabase/40_decision_artifact_immuable.sql`, `supabase/40_decision_artifact_immuable_down.sql`
- `supabase/maintenance/fut173-audit-lecture-seule.sql`, `supabase/maintenance/fut173-effacement-controle.sql`
- `src/lib/decision/decision-artifact-ecriture.ts` (+ `.test.ts`)
- `src/lib/server/decision-artifact-store.ts`, `src/lib/server/generate-decision-artifact.ts`
- `scripts/integration/fut173-decision-artifact-postgres.mjs`
- ajustements de libellés : `src/lib/fut10-livraison.test.ts`, `src/lib/decision/artefact-voisinage.test.ts`, `scripts/integration/schema-de-test.mjs`, `appliquer-schema-test.mjs`, `fut10-postgres.mjs`, `supabase/README.md`
