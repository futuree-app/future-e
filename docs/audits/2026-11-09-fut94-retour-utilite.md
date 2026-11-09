# FUT-94 · Retour d'utilité en fin de dossier (09/11/2026)

> **Reprise après contre-revue (09/11/2026, sur `d57046ea`)** : consentement PostHog (§ PostHog), effacement du commentaire au passage à « Pas encore lu » (§ Stockage), base légale, conservation et effacement (§ Confidentialité), intégration de l'upsert (§ Vérifications).
>
> **Finalisation et recette d'intégration (09/11/2026)** : migration 39 appliquée sur le projet Supabase de **test** `future-e-test` (jamais en production) ; scénario PostgREST réel, 12/12 (§ Intégration réelle) ; purge planifiée, exécutée et surveillée sous pg_cron sur ce projet, puis retirée (§ Conservation) ; recette navigateur réelle sur `/rapport`, 30/30, qui a trouvé et fait corriger un défaut (§ Recette réelle) ; dépendances avec FUT-181 (§ PostHog).

## Ce que voit le lecteur

Sous le dossier de `/rapport`, après les gestes qui le suivent (« Préciser cette lecture à une adresse », le geste du verdict) et avant « Votre projet » :

> **Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?**
> Oui · Pas vraiment · Pas encore lu

- Un clic enregistre la réponse. « Merci, votre réponse est enregistrée. » s'affiche sous les réponses.
- Après « Oui » ou « Pas vraiment », un champ facultatif apparaît : « Quoi, ou qu'est-ce qui vous a manqué ? (facultatif) », avec la mention « Lu par l'équipe de futur•e seulement, jamais publié. » Après « Pas encore lu », aucun champ : la question du commentaire ne s'applique pas à un dossier non lu.
- Passer d'une réponse commentée à « Pas encore lu » **retire le commentaire** (avec sa date) et l'écran le dit : « Merci, c'est noté. Votre commentaire précédent a été retiré. » Entre « Oui » et « Pas vraiment », le commentaire est gardé.
- Vider le champ puis « Envoyer » efface le commentaire enregistré.
- Revenir ensuite de « Pas encore lu » à « Oui » ou « Pas vraiment » rouvre un champ **vide** : ni le commentaire retiré, ni un brouillon jamais envoyé ne sont reproposés (corrigé après la recette réelle puis la contre-revue, voir plus bas). Entre « Oui » et « Pas vraiment », le champ garde son texte et le commentaire enregistré est conservé.
- Une fois le commentaire envoyé, le bloc se replie en une ligne : « Votre retour sur cette analyse : Pas vraiment, avec un commentaire. Merci. · Modifier ».
- À la visite suivante, seule cette ligne s'affiche. La question n'est jamais reposée, mais la réponse reste modifiable.
- En cas d'échec, rien n'est montré comme enregistré. Le texte du commentaire reste dans le champ, mot pour mot, et le bouton devient « Réessayer l'envoi ».

Mêmes textes, même structure et même ordre dans les deux présentations. En classique, la réponse retenue est cerclée d'orange, jamais remplie : l'aplat orange reste réservé à l'action principale. Sous le Relevé, le bloc reprend les primitives du Relevé (`releveSection`, `option`, `texte`, `bouton`, `action`) sans aucune couleur propre.

## Stockage : table `dossier_utility_feedback` (migration 39 : appliquée sur le projet de TEST seulement, NON appliquée en production)

| Colonne | Rôle |
|---|---|
| `user_id` | le compte (cascade à sa suppression) |
| `insee_code`, `scope_key` | **l'identité du dossier**, la même que `decision_artifact` : `commune` ou `logement:<id>` ; la commune est remontée au grain de l'artefact (75101 → 75056) |
| `address_dossier_id` | clé étrangère vers `address_dossiers` pour un dossier d'adresse (cascade), cohérente avec `scope_key` par contrainte |
| `answer` | `oui`, `pas_vraiment` ou `pas_encore_lu`, jamais fusionnés |
| `comment`, `commented_at` | le commentaire privé (1 à 2 000 caractères, jamais une chaîne vide) et sa date |
| `artifact_version` | la version figée servie au moment de la réponse (lue côté serveur), nulle si le dossier était assemblé à l'instant |
| `presentation` | `classique` ou `releve`, telle que l'écran l'a reçue de `/rapport` |
| `created_at`, `updated_at` | première réponse, dernier envoi |

**Ce qui n'y est pas** : l'adresse en clair, le projet, le texte du dossier, l'e-mail. **Mais la ligne n'est pas indépendante d'une adresse** : pour un dossier d'adresse, `address_dossier_id` et `scope_key` la relient au bien, donc à son adresse et à son propriétaire. C'est une donnée personnelle, traitée comme telle (§ Confidentialité).

**« Pas encore lu » n'a jamais de commentaire.** La route envoie explicitement `comment = null, commented_at = null` pour cette réponse, quel que soit le corps reçu. La contrainte `dossier_utility_feedback_non_lu_ck` le garantit aussi en base. Raison : « ce qui m'a manqué » décrirait une lecture que la réponse en vigueur dit ne pas avoir eu lieu. Entre « Oui » et « Pas vraiment », le commentaire et sa date sont conservés. Exploitation SQL : dans la requête 2, `avec_commentaire` vaut donc toujours 0 pour `pas_encore_lu`, et le taux d'utilité (requête 3) ne compte que les dossiers lus.

**Doublons** : contrainte `unique (user_id, insee_code, scope_key)`. **Une réponse par compte et par dossier, et elle se remplace.** Un nouvel envoi met à jour la même ligne (upsert). `created_at` garde la date de la première réponse. Un envoi sans clé `comment` garde le commentaire enregistré ; un champ vidé l'efface. Côté écran, un verrou synchrone fait qu'un double clic n'envoie qu'une requête.

## Droits

- `anon` : rien.
- `authenticated` : lecture de ses seules lignes (policy `select_own`), **aucune écriture** (`revoke all` + `grant select` ; pas de policy d'écriture).
- Écriture : uniquement par `POST /api/dossier/retour-utilite`, qui exige une session (401 sinon) et vérifie **sous l'identité du lecteur** que la commune lui est ouverte (`loadTerritoryClaims`) et que le dossier d'adresse est le sien, non révoqué et de cette commune (`getDossier`). Elle écrit ensuite avec le service role (`lib/server/retour-utilite-store.ts`, qui ne rend jamais ce client). `user_id` vient toujours de la session, jamais du corps de la requête.
- Tant que la migration n'est pas appliquée, la lecture échoue et `/rapport` **cache la question**. Rien ne casse.

## PostHog et consentement (FUT-181 livré dans `main` à `51ee554b`)

### Ce que fait FUT-94

1. **Aucun événement FUT-94 sans consentement valide.** L'unique appel `posthog.capture("dossier_utility_feedback_submitted", …)` est gardé par `mesureConsentie()`, **la règle unique de FUT-181** (`src/lib/mesure-audience-regles.ts`) : seule la valeur exacte `"granted"` de `localStorage["futuree-consent"]` vaut accord ; absente, `"denied"`, autre, stockage bloqué ou rendu serveur : non. La copie locale de FUT-94 (`consentement-mesure.ts`, même prédicat mot pour mot) a été **supprimée** à la synchronisation : une seule source de vérité, comportement inchangé (mêmes assertions, toujours vertes ; la garde retirée, 2 tests d'écran échouent).
2. **Trois protections superposées depuis FUT-181** : sans consentement, PostHog n'est **pas initialisé** (ses `capture` sont sans effet et sans file d'attente) ; `before_send` relit le consentement à chaque événement ; la garde locale de FUT-94 s'y ajoute. Elle est redondante, gardée pour qu'aucun envoi de ce bloc ne dépende d'un réglage lointain.
3. **Le texte libre ne part jamais, même avec consentement.** L'événement ne porte que `{ answer, has_comment, step, is_change, scope, presentation }`. posthog-js ne lit jamais la valeur d'un champ ; FUT-181 masque en plus tout texte et attribut d'élément cliqué (`mask_all_text`, `mask_all_element_attributes`) et coupe l'enregistrement de session. Le bloc garde `ph-no-capture` : l'autocapture l'ignore entièrement, et l'enregistreur le masquerait s'il était un jour réactivé. Les erreurs d'envoi sont interceptées ; le journal serveur n'écrit que le code d'erreur et la portée.

### Mesures

| Mesure | Consentement absent | `denied` | `granted` |
|---|---|---|---|
| Banc local, avant FUT-181 (`consentement.cjs`, `consentement.txt`) : événements FUT-94 / autocapture du bloc / texte envoyé | 0 / 0 / 0 | 0 / 0 / 0 | 2 / 0 / 0 |
| Recette réelle `/rapport`, après fusion de FUT-181 (`recette-reelle.txt`) : événements FUT-94 / autocapture du bloc / texte envoyé | 0 / 0 / 0, et **0 événement de tout type** (PostHog non initialisé) | 0 / 0 / 0, et 0 événement de tout type | 2 (réponse, commentaire) / 0 / 0 |

Avant FUT-181, le reste du site envoyait sans consentement `$pageview`, `$set` et l'autocapture (6 événements tentés par parcours en recette réelle). Ce défaut global, relevé par l'audit FUT-94 et traité par FUT-181, est décrit dans `docs/audits/2026-11-09-fut181-consentement-posthog.md`.

### Compatibilité avec FUT-181

| Point | État après synchronisation |
|---|---|
| Règle de consentement | une seule : `mesureConsentie()` ; même clé, même valeur, test lié à la bannière |
| Événement du formulaire | inchangé ; passe par `before_send` de FUT-181 (URL nettoyée, aucune donnée ajoutée) |
| `ph-no-capture` | gardé (permanent) |
| Politique de confidentialité | fusion sans conflit ; une seule date (`9 novembre 2026`) ; par rapport à `main`, la branche n'ajoute que les passages FUT-94 (avis, base légale, durées) |
| Tests | FUT-181 (17), FUT-121 (15), FUT-147 non-régression (21) et voisins, octroi FUT-115 (34), FUT-94 (40) : verts sur la branche synchronisée |

## Consulter les réponses (administrateur)

`supabase/maintenance/fut94-retours-utilite.sql`, à coller dans Supabase > SQL Editor (lecture seule) :
1. les 200 derniers retours avec leurs dates ;
2. le décompte par réponse sur 30 jours ;
3. le taux d'utilité parmi les dossiers **lus** (oui / (oui + pas vraiment)), avec les « pas encore lu » à côté, par semaine ;
4. commune seule ou adresse ;
5. **(écriture)** l'effacement à la demande, du commentaire seul ou du retour entier ;
6. ce que la purge de conservation ferait aujourd'hui, puis la purge elle-même (commentée).

Aucune route HTTP ne liste les retours. Les commentaires ne sont jamais publiés ni cités comme témoignages sans un consentement distinct.

## Confidentialité

### Base légale retenue : l'intérêt légitime, sous réserve de validation

L'intérêt légitime (art. 6.1.f RGPD) n'est **pas acquis d'office** : il suppose un test en trois temps, documenté ci-dessous, que le responsable du traitement doit **valider ou rejeter**. À défaut, la base de repli est le consentement (art. 6.1.a), recueilli par le geste même de répondre, avec une mention dédiée.

1. **Finalité légitime** : vérifier qu'un dossier payant apprend réellement quelque chose à son lecteur et le corriger. C'est un intérêt réel, actuel et licite, directement lié au service vendu.
2. **Nécessité** : l'avis ne peut s'obtenir qu'en le demandant. Les données sont minimales : une réponse parmi trois, un commentaire facultatif, l'identifiant du dossier, qui pour un dossier d'adresse renvoie à cette adresse (l'adresse n'est pas recopiée, mais elle reste reliée par le dossier) ; ni projet, ni e-mail. Aucune donnée n'est déduite.
3. **Mise en balance** : le lecteur peut raisonnablement s'attendre à cette question en fin de dossier. La réponse est facultative et ne conditionne rien. Le traitement n'est ni un profilage ni de la publicité, et rien n'est publié. Les durées sont courtes, l'opposition est simple (effacer le commentaire depuis l'écran, ou écrire pour supprimer la réponse). **Risque résiduel : le commentaire libre**, où une personne peut écrire des informations personnelles. Il est réduit par la durée de 12 mois, la lecture réservée à l'équipe, l'interdiction de publication et l'exclusion de PostHog.

### Conservation

| Donnée | Durée | Mécanisme |
|---|---|---|
| Commentaire libre (et sa date) | **12 mois** après son envoi | `purger_retours_utilite()` le met à `NULL` ; la réponse reste |
| Réponse | **24 mois** après son dernier envoi | `purger_retours_utilite()` supprime la ligne |
| Tout le retour | à la suppression du **compte** ou du **bien** | cascades `auth.users` et `address_dossiers` |
| Tout le retour | **sur demande** | requête 5 de `supabase/maintenance/fut94-retours-utilite.sql` |

`purger_retours_utilite()` (migration 39) est idempotente, rend ce qu'elle a fait et refuse des délais incohérents. Elle est réservée au service role et **non planifiée par la migration**. La requête 6 de maintenance montre ce qu'elle ferait avant de la lancer. Les durées proposées sont **à valider** par le responsable du traitement.

**Ce qui est garanti en base** (PGlite, 34 vérifications, puis projet de test) :
- délais : commentaire effacé à 12 mois de `commented_at` (13 mois → effacé, 11 mois → gardé, bornes à ±1 h), réponse supprimée à 24 mois de `updated_at` (25 mois → supprimée) ;
- **réponse modifiée** : chaque envoi repousse `updated_at`, donc une réponse changée il y a 3 mois survit même si la première date de 30 mois ; un commentaire **réécrit** repart de sa nouvelle date (`commented_at`), un commentaire gardé lors d'un changement Oui ↔ Pas vraiment garde sa date d'origine ;
- cascades : compte supprimé → retours supprimés ; bien supprimé → son retour seul ;
- idempotence : un second passage ne touche rien ;
- droits : exécution refusée à `anon` et `authenticated` (42501, vérifié aussi par PostgREST réel), accordée au seul `service_role` ; `security definer` avec `search_path = public`.

**Planification : `supabase/maintenance/fut94-planifier-purge.sql`**, à appliquer à la main après validation : activation de pg_cron, `cron.schedule('fut94-purge-retours-utilite', '23 3 * * *', …)` (par nom, donc rejouable sans doublon), contrôle de la planification et des dernières exécutions, **requête d'alerte** qui ne rend rien quand tout va bien (tâche absente ou inactive, échec dans les 7 jours avec son message, aucune exécution réussie depuis 48 h), retrait.

**Éprouvé sur le projet de test le 09/11/2026**, à la minute près puis retiré :

| Tâche | Exécutions | Statut | Requête d'alerte |
|---|---|---|---|
| `fut94-purge-retours-utilite` (la vraie purge) | 10:22, 10:23 UTC | `succeeded`, « 1 row » | **0 ligne** |
| `fut94-recette-echec` (délais incohérents, échec voulu) | 10:22, 10:23 UTC | `failed`, « Délais incohérents : commentaire 01:00:00, réponse 00:01:00 » | **3 lignes** (deux échecs datés avec leur message, aucune réussite depuis 48 h) |
| tâche inexistante | — | — | **1 ligne** « tâche absente » |

Les deux tâches ont ensuite été retirées (`cron.unschedule`) et l'extension pg_cron désinstallée du projet de test. **Aucune planification n'existe en production** : elle reste une décision du responsable du traitement (durées), puis une étape de mise en production.

**Limite de l'alerte** : c'est une requête, pas une notification. Une planification quotidienne ne se surveille pas elle-même : si pg_cron s'arrête, si le projet est mis en pause ou si la tâche disparaît, rien ne le signale. D'où la supervision par signal de vie proposée dans le plan de mise en production (étapes 5 et 6).

**Suppression plutôt qu'anonymisation.** Retirer `user_id` laisserait la ligne rattachée à un dossier d'adresse, donc à son propriétaire : ce serait une pseudonymisation, pas une anonymisation. Ce qui se conserve sans limite, ce sont les décomptes agrégés (requêtes 2 à 4), qui ne désignent personne.

### Politique de confidentialité (`/politique-confidentialite`)

- Date de mise à jour : **9 novembre 2026** (à ajuster au jour de publication si la PR est fusionnée plus tard).
- « Données collectées » : l'avis en fin de dossier, enregistré avec le compte et rattaché au dossier concerné, qui peut être celui d'une adresse (l'adresse n'est pas recopiée, mais reste reliée par le dossier) ; sans le projet ; lu par l'équipe seulement, jamais publié sans accord exprès, modifiable et effaçable depuis le dossier. Les avis ne sont présentés ni comme anonymes ni comme indépendants d'une adresse (contre-revue du 09/11/2026).
- Finalités : « Intérêt légitime (voir ci-dessous) », suivi d'un paragraphe qui l'explique et donne le moyen de s'opposer.
- Conservation : 12 mois pour le commentaire, 24 mois pour la réponse, effacement avec le compte, avec le bien ou sur demande.
- Les passages PostHog de la politique relèvent de FUT-181, livré : ils décrivent désormais une mesure soumise au consentement, conforme au code.

## Mise en production : plan exécutable (rien n'est exécuté sans accord explicite)

**État de la production constaté** (vérification indépendante du 09/11/2026) : `public.dossier_utility_feedback` absente, `public.purger_retours_utilite(interval,interval)` absente, extension `pg_cron` absente. Les commandes ci-dessous partent de cet état. Chaque étape a son contrôle et son retour arrière ; on ne passe à la suivante que si le contrôle est conforme.

### 1. Décisions préalables (responsable du traitement)

- Base légale : intérêt légitime (test en trois temps, § Confidentialité) **ou** consentement. Si consentement : ne pas livrer en l'état, la mention et le recueil changent.
- Durées : 12 mois (commentaire), 24 mois (réponse). Les changer = changer les valeurs par défaut de la fonction, la politique et cette note, avant l'étape 2.
- Supervision : choix du service de signal de vie et du destinataire des alertes (étape 5).
- Inscription au registre des traitements (finalité, données, durées, destinataires : l'équipe).

### 2. Migration 39 (SQL Editor, production)

Avant : vérifier les prérequis (doivent rendre `true`, `true`, `false`, `false`) :

```sql
select to_regclass('public.address_dossiers') is not null as biens,
       exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'address_dossiers' and column_name = 'id' and data_type = 'uuid') as id_uuid,
       to_regclass('public.dossier_utility_feedback') is not null as table_39,
       to_regprocedure('public.purger_retours_utilite(interval,interval)') is not null as purge_39;
```

Puis coller **le fichier entier** `supabase/39_retours_utilite_dossier.sql` (SHA-256 `8ff1c99fb65af1cfce9b260360587592ca0a441de02425146cc48eb178a80d40`, identique à celui audité et appliqué sur le projet de test, inchangé depuis `1f3285c5` ; le retour arrière : `d3033dfe81a0050bc704aacc721e2dd8b3680cc39bfe8cf8c5720b92bb37aa1d`), et l'exécuter une fois. Il est transactionnel (`begin … commit`) et ne modifie aucune table existante. Retour arrière : `supabase/39_retours_utilite_dossier_down.sql` (détruit la table, donc les retours, et la fonction ; retirer d'abord toute planification, étape 5).

### 3. Vérification RLS, privilèges et fonction (SQL Editor, production)

```sql
-- a. Privilèges de table : attendu  authenticated | SELECT  (une ligne, rien pour anon)
select grantee, string_agg(privilege_type, ',') from information_schema.role_table_grants
 where table_schema = 'public' and table_name = 'dossier_utility_feedback' and grantee in ('anon', 'authenticated') group by grantee;
-- b. RLS et policy : attendu  true  puis  dossier_utility_feedback_select_own | SELECT | {authenticated}
select relrowsecurity from pg_class where oid = 'public.dossier_utility_feedback'::regclass;
select policyname, cmd, roles from pg_policies where schemaname = 'public' and tablename = 'dossier_utility_feedback';
-- c. Fonction : attendu  false, false, false, true, security definer = true, search_path=public
select has_function_privilege('anon', 'public.purger_retours_utilite(interval,interval)', 'execute') as anon,
       has_function_privilege('authenticated', 'public.purger_retours_utilite(interval,interval)', 'execute') as authenticated,
       has_function_privilege('public', 'public.purger_retours_utilite(interval,interval)', 'execute') as public,
       has_function_privilege('service_role', 'public.purger_retours_utilite(interval,interval)', 'execute') as service_role,
       prosecdef, proconfig
  from pg_proc where oid = 'public.purger_retours_utilite(interval,interval)'::regprocedure;
-- d. Contraintes : attendu 12 (relevé sur le projet de test) : address_dossier_id_fkey, answer_check, artifact_version_check,
--    comment_check, comment_date_ck, insee_code_check, non_lu_ck, one_per_dossier, pkey, presentation_check, scope_ck, user_id_fkey
select conname from pg_constraint where conrelid = 'public.dossier_utility_feedback'::regclass order by 1;
-- e. Purge à blanc : attendu  0 | 0  (table vide)
select * from public.purger_retours_utilite();
```

Puis Supabase > Advisors > Security : aucun avis sur ces deux objets (aucun sur le projet de test).

### 4. Fusion et déploiement

Fusion de la PR #135 (SHA validé par la contre-revue finale), puis déploiement de `main` (seule branche déployée, `vercel.json`). Contrôle : sur un dossier, la question apparaît sous le dossier ; `/politique-confidentialite` montre la ligne « Votre avis sur un dossier ». Retour arrière : redéployer le déploiement précédent ; la table reste, inerte. Sans l'étape 2, la question reste absente et rien ne casse (ordre inverse toléré).

### 5. Purge planifiée et signal de vie

La planification quotidienne seule ne dit rien de ses échecs, et une requête d'alerte qu'on ne lance pas ne protège rien. Proposition : **un signal de vie (heartbeat) envoyé par la purge elle-même, surveillé hors de Supabase.**

- Un service de surveillance de tâches planifiées (Healthchecks.io, Better Stack, Cronitor… **à choisir**, étape 1) attend un appel par jour et alerte (e-mail, SMS) s'il manque après un délai de grâce (26 h conseillé).
- La tâche pg_cron enchaîne la purge et l'appel, dans **la même transaction** : si la purge échoue, la transaction est annulée et `pg_net` n'envoie rien (ses requêtes partent à la validation). Le silence déclenche alors l'alerte.
- Ce schéma détecte ce que la requête d'alerte ne peut pas signaler seule : purge en échec, tâche supprimée ou désactivée, pg_cron arrêté, base indisponible, projet mis en pause.
- L'appel ne transmet **aucune donnée personnelle** (une URL, aucun corps). Le service est néanmoins un nouveau prestataire, à noter.
- L'URL, qui fait office de jeton, va dans Supabase Vault, pas en clair dans `cron.job`.

Les commandes exactes sont le bloc 6 de `supabase/maintenance/fut94-planifier-purge.sql` (activation de `pg_cron` et `pg_net`, secret Vault, `cron.schedule` avec signal de vie). Le même schéma vaut pour la purge de la migration 38 (`purge-dossier-intents`), elle aussi non planifiée.

### 6. Contrôle de la supervision effective

- Le jour même : le test d'alerte du service (notification de test reçue par le destinataire désigné).
- J+1 : bloc 3 (`cron.job_run_details` : une exécution `succeeded`, « 1 row ») ; le service montre un appel reçu.
- **Épreuve d'échec**, une fois, en production, sans effet sur les données : planifier pour une minute une tâche de test qui appelle la purge avec des délais incohérents (elle échoue avant toute écriture), suivie du même appel de signal vers un **second** contrôle du service, réglé à 5 minutes de grâce et amorcé par un appel manuel ; constater l'alerte « manquant », puis `cron.unschedule` et supprimer ce second contrôle. Sur le projet de test, cette épreuve a montré l'échec et son message dans `cron.job_run_details`, et la requête d'alerte l'a rendu (§ Conservation).
- Ensuite : bloc 4 (requête d'alerte) en diagnostic quand le service alerte.

### 7. Recette sur un compte interne

Sur un compte interne qui possède un dossier (aucune donnée de client) : « Pas vraiment » + commentaire de test, puis « Oui » (commentaire gardé), puis « Pas encore lu » (commentaire effacé, champ vide au retour à « Oui »). Requête 1 de `fut94-retours-utilite.sql` : une seule ligne, `created_at` inchangé, commentaire nul. Puis **supprimer la ligne d'essai** (requête 5, retour entier) et vérifier qu'elle a disparu. Si le consentement est accordé sur ce navigateur, vérifier dans PostHog que l'événement ne porte aucun texte.

## Vérifications

- `src/lib/fut94-retour-utilite.test.ts` (**16**) : les trois réponses, le commentaire facultatif, l'envoi sans commentaire, le remplacement, **les transitions Oui ↔ Pas vraiment (commentaire et date gardés) et → Pas encore lu (effacés, même si le corps en porte un), puis → Oui (rien ne revient)**, l'idempotence, le rattachement (commune, deux biens, arrondissement), l'isolation entre comptes, la panne du stockage, **le consentement** (`granted`, `denied`, absent, illisible, hors navigateur ; clé et valeurs liées à la bannière). La migration (dont la contrainte « pas encore lu » et les droits de la purge), la route et la page sont vérifiées sur leurs sources.
- `src/components/report/fut94-retour-utilite-ecran.test.ts` (**24**, le vrai composant dans les deux présentations) : un geste par réponse ; le commentaire ; le double clic ; les pannes (texte conservé, réessai) ; la réponse déjà enregistrée ; la borne de 2 000 caractères ; **aucun événement sans `granted`** ; **`ph-no-capture` sur le bloc**, avec un seul appel PostHog gardé ; **« Pas encore lu » après un commentaire (retrait annoncé, puis champ vide au retour à « Oui »)** contre Oui ↔ Pas vraiment (gardé) ; **un brouillon jamais envoyé, non reproposé après « Pas encore lu »** ; **l'effacement depuis l'écran**.
- **Tests de mutation** : on réintroduit chaque défaut corrigé et le test correspondant échoue. Sans l'effacement « pas encore lu » : 2 échecs. Sans la garde de consentement : 2. Sans `ph-no-capture` : 1. **Sans le vidage du champ après retrait : 2** (classique et Relevé). **Avec le vidage limité aux commentaires enregistrés (version `1f3285c5`) : 2**, sur le brouillon non envoyé.
- `scripts/fut94-verifier-rls.mjs` : **34 vérifications** sur un vrai Postgres (PGlite, privilèges par défaut de Supabase reproduits) : RLS, refus d'écriture pour `authenticated` et `anon`, contraintes (dont « pas encore lu » sans commentaire), **purge** (commentaire de 13 mois effacé et réponse gardée, commentaire de 11 mois gardé, réponse de 25 mois supprimée, idempotence, interdite à `authenticated` et `anon`, délais incohérents refusés), cascades, retour arrière (table et fonction), rejeu.
- `scripts/fut94-verifier-upsert.mjs` : **8 vérifications**, de `supabase-js` jusqu'à Postgres :
  - le **vrai** `ecrireRetourUtilite`, avec le `supabase-js` du projet, émet `POST /rest/v1/dossier_utility_feedback?on_conflict=user_id,insee_code,scope_key` avec `Prefer: resolution=merge-duplicates,return=representation`, **sans `created_at` ni `id`**, et sans `comment` quand seule la réponse change ;
  - ce corps, rejoué dans Postgres sous la forme SQL de PostgREST (`json_populate_recordset` + `ON CONFLICT … DO UPDATE SET` des seules colonnes envoyées), donne : **`created_at` inchangé sur trois envois**, commentaire et date gardés de Pas vraiment à Oui, effacés à Pas encore lu, une seule ligne.
- Consentement mesuré dans le navigateur : voir § PostHog (`consentement.cjs`, `consentement.txt`).
- Chaîne 01 → 39 du schéma de test et `fut10-postgres.mjs` : verts.
- Recette navigateur (captures de la première livraison, `recette.txt`) : 360, 390 et 1 440 px, sans débordement, boutons de 44 px, clavier.

## Intégration réelle (projet Supabase de TEST, 09/11/2026)

**Environnement.** Projet `future-e-test` (réf. `atvknbgahcuovcyqapfx`, distinct de la production), réactivé pour l'occasion, schéma 01 → 38 déjà en place, aucune donnée réelle. Clés dans `.env.fut10-test` (ignoré par Git, mode 600), jamais `.env.local` ; le garde-fou FUT-10 refuse toute réf. de production. **Modifications distantes, toutes sur ce projet seulement** : migration 39 appliquée (contenu du fichier, sans les commentaires ni `begin/commit`, l'outil de migration ouvrant déjà une transaction) ; pg_cron activé, deux tâches, puis tâches et extension retirées ; droit `SELECT` de `authenticated` retiré quelques minutes pour le cas « table illisible », puis rétabli et vérifié. Comptes et biens jetables créés puis supprimés : en fin de recette, 0 retour, 0 bien, 0 compte `fut94+…`.

**Droits constatés** après application : `anon` aucun ; `authenticated` `SELECT` seul ; `service_role` tout ; RLS active ; une policy `select_own` ; purge exécutable par `service_role` seul.

**`scripts/integration/fut94-supabase-integration.mjs` : 12/12**, à travers le vrai PostgREST, la vraie logique de la route (`enregistrerRetourUtilite`) et les vraies lectures de droits sous le JWT de deux comptes réels :
1. « Pas vraiment » avec commentaire ;
2. « Oui » sans commentaire : commentaire et `commented_at` **conservés**, `created_at` **identique**, même ligne ;
3. « Pas encore lu » : `comment` et `commented_at` à **NULL**, même ligne, `created_at` identique ;
4. trois envois simultanés : **une seule ligne** ;
5. deux biens et la commune d'un même compte : trois lignes distinctes ;
6. RLS : chaque compte ne lit que ses lignes, `anon` rien ;
7. aucune écriture directe pour un compte ordinaire (insert, update, delete, upsert), ni sur ses lignes ni sur celles d'un autre : **42501** ;
8. route : un compte B ne peut écrire ni sur le bien de A (403) ni sur une commune qui ne lui est pas ouverte (403) ;
9. purge par le service role : idempotente, sans effet sur des retours récents ; refusée à un compte et à `anon` (42501) ;
10–11. cascades bien et compte.

## Recette réelle (`/rapport`, 09/11/2026)

`2026-11-09-fut94-retour-utilite/recette-reelle.mjs`, résultat dans `recette-reelle.txt`, captures `reel-*.png`. L'application locale (`next dev`) branchée sur le projet de test, deux comptes réels (A en classique, R en Relevé via `DECISION_RELEVE_COMPTES`), connexion par le vrai formulaire, chaque cas vérifié **à l'écran et en base**. Seul PostHog est intercepté dans le navigateur.

**30/30** (rejouée après la contre-revue, puis à nouveau après la fusion de FUT-181 : 28/28 sur le code courant, les 2 cas « table illisible » venant de la première passe), dans chaque présentation : première question sans réponse en base ; « Oui » sans commentaire ; ajout, modification puis effacement du commentaire ; réponse commentée → « Pas encore lu » (retrait annoncé, plus de champ) ; retour à « Oui » (champ vide, rien en base) ; **brouillon jamais envoyé → « Pas encore lu » → « Oui » (champ vide, brouillon jamais parti)** ; rechargement (état relu en base, question non reposée) ; double clic (un seul envoi, une ligne) ; panne réseau puis « Réessayer l'envoi » (texte conservé, rien écrit pendant la panne) ; clavier (Entrée sur « Modifier » puis sur une réponse, focus gardé dans le bloc, statut annoncé). Puis : deux biens d'un même compte isolés ; consentement absent et `denied` (0 événement FUT-94) et `granted` (2 événements, sans texte) ; table illisible (question absente, page intacte) et sa contre-épreuve (question de retour), jouées lors de la première passe. Journal serveur de la dernière passe : 33 envois, tous 200, **textes du commentaire et du brouillon jamais présents**.

**Défaut trouvé et corrigé.** Après « Pas encore lu », l'écran annonçait « Votre commentaire précédent a été retiré » ; la base était juste (NULL), mais revenir à « Oui » **reproposait l'ancien texte dans le champ**, et un clic sur « Envoyer » l'aurait ré-enregistré. Le composant vide désormais le champ à chaque passage à « Pas encore lu ». La première version de ce correctif ne vidait le champ que si un commentaire **enregistré** était retiré : un brouillon jamais envoyé revenait encore (relevé par la contre-revue sur `1f3285c5`). Deux tests d'écran couvrent les deux cas, dans les deux présentations, chacun rouge sans le correctif (2 échecs) et vert avec. Un test d'écran existant reposait sur un faux serveur qui ne conservait pas le commentaire, contrairement au vrai : il part maintenant du même état que l'écran.

**Limites de cette recette.** L'artefact figé du dossier n'est pas généré sur la base de test (les sources de référence y sont vides) : `artifact_version` reste nul ; sa lecture est couverte par les tests de la route. Le paiement n'est pas joué (biens insérés par le service role) : hors périmètre FUT-94.

## Limites connues

- La question n'est posée que sur le hub `/rapport`, pas sur les pages de module (Territoire, Autour, Logement).
- Le commentaire en cours de saisie n'est pas conservé si la page est rechargée (il l'est lors d'un échec d'envoi).
- La présentation enregistrée est celle que l'écran déclare : un compte qui la falsifierait ne fausserait que sa propre ligne.
