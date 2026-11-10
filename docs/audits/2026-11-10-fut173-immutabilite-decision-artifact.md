# FUT-173 · Immutabilité des conclusions figées (`decision_artifact`)

10 novembre 2026. Audit, reproduction sur base isolée, correctif. Rien n'a été écrit en production.

**Révision 2 (même jour, après contre-revue)** : audit réel des droits de production intégré (§ 1), privilèges réduits au strict nécessaire et `search_path` vide pour la fonction privilégiée (§ 2), banc rejoué sous PostgreSQL 17.5 et 18.3 (§ 3), protocole de recette Supabase préparé mais **non exécuté** (§ 8).

**Ce qui est établi, et ce qui ne l'est pas encore :**

| Conclusion | Statut |
|---|---|
| Les droits réels de production sont ceux de la migration 28 (le défaut existe en production) | **vérifié**, audit catalogue en lecture seule du 10/11 |
| La migration 40 protège l'invariant sur PostgreSQL | **vérifié sur base isolée** (PGlite, PostgreSQL 17.5 et 18.3) |
| La migration 40 fonctionne sur Supabase (PostgREST, supabase-js, Auth, concurrence réelle) | **non vérifié** : recette du projet de test à faire (§ 8) |
| Une version vendue a été altérée en production | **non observé** : risque prouvé, exploitation non constatée |

## En une phrase

Une version `ready` pouvait être réécrite, repassée en `failed` ou supprimée : par son propriétaire, directement avec son jeton et sans passer par le serveur, et par le serveur lui-même dans un cas d'erreur. Désormais, PostgreSQL le refuse à tous les rôles, et le navigateur n'a plus aucun droit d'écriture sur la table.

## 1. Diagnostic

### Ce qui garantissait l'immutabilité avant : rien en base

| Couche | État avant | Conséquence |
|---|---|---|
| RLS `decision_artifact_own_update` (28) | `using (auth.uid() = user_id)`, sans condition de statut ni `with check` | le propriétaire réécrit tout champ de ses lignes, `ready` comprises |
| RLS `decision_artifact_own_delete` (28) | `using (auth.uid() = user_id)` | le propriétaire supprime ses versions prêtes |
| RLS `decision_artifact_own_insert` (28) | `with check (auth.uid() = user_id)`, statut libre | le propriétaire insère une version `ready` au contenu de son choix, ou réserve une place avant le webhook |
| Privilèges | ceux que Supabase pose par défaut, **relevés en production** : SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES pour `anon`, `authenticated` et `service_role` | TRUNCATE ouvert à tous les rôles au niveau SQL (non exposé par PostgREST) |
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
   **Après correctif**, ce même cas ne détruit plus rien : `failArtifact` ne vise que les places `generating` et le trigger refuse `ready → failed`. Il reste un effet bénin, accepté pour ce ticket : le générateur peut encore **déclarer** `failed` à son appelant (journal « génération échouée », réponse 502 de « Mettre à jour l'analyse ») alors que la version est prête en base. C'est un diagnostic erroné transitoire ; la page suivante sert la version prête. Pas de refonte de l'orchestration ici.
2. **Zéro ligne = succès.** Un UPDATE qui ne trouve rien rend `error: null` : un `completeArtifact` sur une place disparue ou déjà terminée était un succès silencieux.

### Nature du risque

Intégrité et traçabilité des conclusions vendues, **sans accès inter-comptes** : un autre compte ne lit ni ne modifie rien, avant comme après (cas X1 à X4). Aucune exploitation n'est connue. Le risque est qu'un lecteur fabrique ou altère « ce que futur•e lui a dit », ou qu'une panne serveur efface la version servie.

### Production : ce qui a été vérifié, et comment

**Audit du catalogue, en lecture seule** (contre-revue, 10/11/2026, transaction `READ ONLY` sur le projet Supabase de production ; aucun payload, aucun identifiant de compte lu, aucune donnée modifiée) :

| Point | Constat en production |
|---|---|
| Version de PostgreSQL | **17.6** |
| `public.decision_artifact` | propriétaire `postgres` ; RLS active, non forcée |
| Policies | `own_select`, `own_insert`, `own_update`, `own_delete`, toutes `auth.uid() = user_id` : **exactement la migration 28** |
| Privilèges | `anon`, `authenticated`, `service_role` : SELECT, INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES |
| Contournement de RLS | `service_role` oui ; `authenticated` et `anon` non |
| Triggers | aucun trigger d'immutabilité |
| Contraintes | unicité (user, commune, scope, version) ; clé étrangère `user_id → auth.users` `ON DELETE CASCADE` |
| Fonctions citant la table | `etat_livraison_intention` seule (migration 38), lecture `exists(... status = 'ready')`, non exécutable par `authenticated` |
| Lignes | 80 `ready`, 16 `failed`, 0 `generating` ; aucune `ready` sans contenu ni date |

**Décomptes complémentaires** (HEAD en lecture seule sur l'API REST, première livraison) : 96 lignes, 50 versions > 1, aucune ligne non `ready` avec payload, aucune `failed` avec date de génération, aucune `generating` abandonnée.

**Conclusion.** Le diagnostic est confirmé sur les droits réels : le défaut existe en production tel que décrit. Cet audit **ne dit rien** du comportement de la migration 40 sur Supabase ; il fixe l'état de départ que le retour arrière doit rétablir.

## 2. Le correctif

**Migration `40_decision_artifact_immuable.sql`**, un trigger et des droits :

- **Trigger `decision_artifact_integrite`** (BEFORE INSERT/UPDATE/DELETE, pour toutes les lignes, tous les rôles, y compris `service_role`). Sa fonction est `SECURITY DEFINER` pour lire `auth.users` ; elle a un `search_path` **vide** (tout ce qu'elle cite est qualifié, le reste vient de `pg_catalog`) et son EXECUTE est retiré à `PUBLIC`, `anon`, `authenticated` et `service_role` (un trigger se déclenche sans ce droit, et une fonction trigger ne s'appelle pas directement). Aucune autre fonction privilégiée, aucune RPC :
  - une ligne naît `generating`, sans payload ni date ;
  - l'identité (`id`, `user_id`, `insee_code`, `scope_key`, `version`, `created_at`) ne change jamais ;
  - transitions permises : `generating → ready` (avec payload et date) et `generating → failed` (sans contenu) ; `ready` et `failed` sont terminaux ;
  - une version `ready` ne se supprime que si son compte n'existe plus (cascade de `auth.users`).
- **Droits**, remis à zéro puis rendus au strict nécessaire (`revoke all` puis `grant`) :

  | Rôle | Avant (relevé en production) | Après |
  |---|---|---|
  | `anon` | les 7 privilèges | aucun |
  | `authenticated` | les 7 privilèges | **SELECT seul**, filtré par `decision_artifact_own_select` (inchangée) |
  | `service_role` | les 7 privilèges | SELECT, INSERT, UPDATE, DELETE (réserver, terminer, lire, nettoyer une ligne non prête) |

  Les policies own insert/update/delete sont retirées. TRUNCATE (qui ne déclenche aucun trigger de ligne), TRIGGER et REFERENCES ne sont plus accordés qu'au propriétaire `postgres`. Dépendances vérifiées : aucune vue ne lit la table, et la seule fonction qui la lit (`etat_livraison_intention`) est `SECURITY DEFINER`, propriété de `postgres`, donc indépendante de ces privilèges.

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

Reproduite par `scripts/integration/fut173-decision-artifact-postgres.mjs`, exécuté sous **PostgreSQL 17.5** (PGlite 0.3.14, la version la plus proche de la 17.6 de production) **et 18.3** (PGlite 0.5.8), avec des résultats identiques : rôles et privilèges par défaut de Supabase, `auth.uid()` lu dans les claims JWT comme PostgREST. Comptes fictifs A et B ; A possède v1 `ready`, v2 `failed`, v3 `generating` sur la même commune ; B possède v1 `ready`. Chaque cas tourne sous le rôle réellement utilisé, dans une transaction annulée.

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

Les fonctions de `decision-artifact-ecriture.ts` exécutées sous `service_role` par un client minimal qui émet le SQL de PostgREST. Les 19 passent, sous 17.5 comme sous 18.3 :

1. le propriétaire ne peut pas modifier une version ready (payload, statut, versions, date, identité) ;
2. il ne peut pas la supprimer par une requête ordinaire (ni le service role) ;
3. un autre compte ne lit ni ne modifie rien ; `anon` n'a rien ;
4. génération normale `generating → ready` ; 4b. un webhook rejoué ne réserve pas deux fois ;
5. une génération échouée laisse servir la dernière version prête ; 5b. la reprise prend la version suivante, la `failed` reste telle quelle ;
6. une v2 se crée sans mutation de la v1 (ni de la v1 de B) ;
7. transitions et mutations d'identité interdites refusées, même en service role ;
8. le rattrapage `marquerEchec` sur une version déjà prête lève, la version reste prête ; 8b. l'ancien chemin (jeton du lecteur) est refusé ; 8c. une écriture à zéro ligne lève ;
9. suppression de compte, exécutée sous un rôle `supabase_auth_admin` non superutilisateur qui n'a aucun droit sur la table (comme le service Auth) : la cascade emporte toutes les versions de B, `ready` comprise, rien de A ; 9b. effacement ciblé par la procédure de maintenance, trigger réactivé ensuite, protection intacte hors procédure ; 9c. la purge 38 lit toujours l'état de livraison ;
10. le retour arrière rétablit exactement les droits de la 28 ;
11. la migration s'applique sur une base qui porte déjà des lignes de tous statuts **sans les modifier**, et se rejoue ;
12. privilèges exacts (lus par `has_table_privilege`) : avant = les 7 pour les 3 rôles (l'état de production) ; après = `authenticated` SELECT seul, `anon` rien, `service_role` SELECT/INSERT/UPDATE/DELETE ; la lecture du propriétaire marche encore sous RLS ; seule `own_select` reste ; après le retour arrière, privilèges identiques à l'état de départ ;
13. fonction privilégiée : `SECURITY DEFINER`, `search_path=""`, EXECUTE refusé à `anon`, `authenticated`, `service_role` ; le trigger se déclenche quand même, y compris quand l'appelant pose un `search_path` hostile.

### Reproduire

```
mkdir -p /tmp/pg17 && (cd /tmp/pg17 && npm i @electric-sql/pglite@0.3.14)   # PostgreSQL 17.5
PGLITE_MODULE=/tmp/pg17/node_modules/@electric-sql/pglite/dist/index.js node scripts/integration/fut173-decision-artifact-postgres.mjs
mkdir -p /tmp/pg && (cd /tmp/pg && npm i @electric-sql/pglite@0.5.8)       # PostgreSQL 18.3
PGLITE_MODULE=/tmp/pg/node_modules/@electric-sql/pglite/dist/index.js node scripts/integration/fut173-decision-artifact-postgres.mjs
node --test src/lib/decision/decision-artifact-ecriture.test.ts
```

Sortie 0 = conforme, 1 = écart, 3 = non exécuté. Le banc FUT-10 (`fut10-postgres.mjs`), qui applique toutes les migrations 01 → 40 sur une base vierge, passe aussi.

Suite complète `npm test` : 4 306 tests, les 69 échecs sont identiques sur `main` ; 5 échecs de plus n'apparaissent que dans un chemin contenant « · » (tests FUT-27 qui lisent un chemin d'URL encodé, sans lien avec ce ticket).

### Ce que le banc ne prouve pas

La réussite de ces tests isolés **n'est pas une validation du déploiement Supabase**.

- l'écart de version : PGlite 17.5 et 18.3, production 17.6. Rien dans le correctif ne dépend d'une fonctionnalité récente (trigger PL/pgSQL, `has_table_privilege`, `revoke`/`grant`), mais l'équivalence n'est pas démontrée sur Supabase ;
- le propriétaire réel de la fonction : dans PGlite, `postgres` est superutilisateur ; sur Supabase il ne l'est pas tout à fait. La lecture de `auth.users` par la fonction `SECURITY DEFINER` doit donc être vérifiée en recette (cascade de `deleteUser`) ;

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

Aucune de ces étapes n'est autorisée à ce jour ; chacune demande un GO explicite du porteur.

1. Dernière contre-revue indépendante.
2. GO pour fusionner : le code (écritures en service role) part en production. Il fonctionne avec la migration 28 comme avec la 40.
3. Vérifier le déploiement et une génération réelle (une version naît par un rattrapage ou « Mettre à jour l'analyse »).
4. GO distinct pour appliquer `40_decision_artifact_immuable.sql` (SQL Editor). Juste avant, relancer `supabase/maintenance/fut173-audit-lecture-seule.sql` : tout écart avec l'état relevé le 10/11 (§ 1) arrête l'opération.
5. Relancer l'audit : trigger présent et actif (`O`), seule `own_select` reste, `authenticated` = SELECT, `anon` = rien, `service_role` = SELECT/INSERT/UPDATE/DELETE, fonction avec `search_path=""`.
6. Vérifier les parcours de lecture (un dossier figé s'ouvre) et de génération (une nouvelle version naît).

**Retour arrière :**

- Migration seule : `40_decision_artifact_immuable_down.sql` rétablit les policies et les privilèges relevés en production (les 7 pour les 3 rôles), retire le trigger et sa fonction. Testé (cas 10 et 12). Aucune donnée touchée.
- Code : la migration doit être annulée **avant** de redéployer l'ancien code, qui écrit avec le jeton du lecteur. Le code FUT-173 fonctionne avec ou sans la migration.

## 7. Fichiers

- `supabase/40_decision_artifact_immuable.sql`, `supabase/40_decision_artifact_immuable_down.sql`
- `supabase/maintenance/fut173-audit-lecture-seule.sql`, `supabase/maintenance/fut173-effacement-controle.sql`
- `src/lib/decision/decision-artifact-ecriture.ts` (+ `.test.ts`)
- `src/lib/server/decision-artifact-store.ts`, `src/lib/server/generate-decision-artifact.ts`
- `scripts/integration/fut173-decision-artifact-postgres.mjs` (banc isolé), `scripts/integration/fut173-recette-supabase.mjs` (recette réelle, non exécutée)
- ajustements de libellés : `src/lib/fut10-livraison.test.ts`, `src/lib/decision/artefact-voisinage.test.ts`, `scripts/integration/schema-de-test.mjs`, `appliquer-schema-test.mjs`, `fut10-postgres.mjs`, `supabase/README.md`

## 8. Recette sur le projet Supabase de test

### Statut au 10/11/2026 : NON exécutée

Un projet de test distinct de la production existe : `future-e-test` (réf. `atvknbgahcuovcyqapfx`), utilisé par FUT-10 et FUT-94 (09/11). Ses clés vivaient dans `.env.fut10-test`, **absent de ce poste** ; aucune variable `FUT10_*` n'est définie, aucune instance Supabase locale n'existe (pas de Docker). Sans ces clés, la recette n'a pas été lancée, et rien n'a été improvisé en production. Aucun projet distant n'a été créé, aucune migration distante lancée.

### Ce qui est prêt

`scripts/integration/fut173-recette-supabase.mjs`, protégé par le garde-fou FUT-10 : il refuse de démarrer sans un projet déclaré dans `FUT10_SUPABASE_REF_TEST`, refuse la production en dur et d'après les `.env` du poste, et refuse des clés d'un autre projet. Vérifié : avec la référence de production déclarée « de test », il s'arrête (sortie 2) avant tout appel réseau.

Il utilise le **vrai** supabase-js, PostgREST et Auth : deux comptes fictifs `fut173+…@futuree.test` connectés par mot de passe, et le vrai code d'écriture du serveur avec un vrai client service role. Il nettoie tout en fin de course (`deleteUser`), y compris en cas d'échec.

### Protocole (sur le projet de TEST uniquement, chaque étape sur GO)

1. Charger l'environnement de test : `set -a; . ./.env.fut10-test; set +a` (jamais `.env.local`).
2. Vérifier l'état du schéma du projet de test (migrations 01 → 39, comme la production ; relancer `fut173-audit-lecture-seule.sql` dessus).
3. `node scripts/integration/fut173-recette-supabase.mjs --phase=avant` : reproduit le défaut à travers PostgREST (le propriétaire réécrit sa version prête, insère une version fabriquée).
4. Appliquer `40_decision_artifact_immuable.sql` **sur le projet de test**.
5. `node scripts/integration/fut173-recette-supabase.mjs --phase=apres`.
6. Appliquer `40_decision_artifact_immuable_down.sql` sur le projet de test, puis relancer `--phase=avant` : le comportement d'origine revient.
7. Réappliquer la 40 sur le projet de test si la recette applicative (étape suivante) doit suivre.
8. Recette applicative, application locale (`next dev`) branchée sur le projet de test : achat de test Stripe (première livraison), rejeu du webhook (`stripe events resend`), rattrapage commune et adresse au rendu, « Mettre à jour l'analyse », dépôt d'un diagnostic, suppression du compte de test.

### Ce que couvre `--phase=apres`

| Vérification | Couvert |
|---|---|
| authentification et isolement entre deux comptes fictifs | oui |
| écriture par le vrai supabase-js et PostgREST (service role) | oui |
| réservation et génération normales | oui |
| rejeu d'une même version | oui |
| mise à jour créant une nouvelle version, l'ancienne intacte | oui |
| concurrence : deux réservations, puis deux terminaisons simultanées (connexions distinctes) | oui |
| lecture de la dernière version prête après un échec | oui |
| zéro ligne modifiée = erreur applicative | oui |
| refus de modifier ou supprimer une version prête (propriétaire 42501, service role 23514 / 23001) | oui |
| suppression d'un compte fictif et cascade | oui |
| retour arrière sur données fictives | oui (étape 6) |
| parcours applicatifs (Stripe, `/rapport`, actualisation) | non : recette manuelle, étape 8 |

