# FUT-94 · Retour d'utilité en fin de dossier (09/11/2026)

> **Reprise après contre-revue (09/11/2026, sur `d57046ea`)** : consentement PostHog (§ PostHog), effacement du commentaire au passage à « Pas encore lu » (§ Stockage), base légale, conservation et effacement (§ Confidentialité), intégration de l'upsert (§ Vérifications).
>
> **Finalisation et recette d'intégration (09/11/2026)** : migration 39 appliquée sur le projet Supabase de **test** `future-e-test` (jamais en production) ; scénario PostgREST réel, 12/12 (§ Intégration réelle) ; purge planifiée, exécutée et surveillée sous pg_cron sur ce projet, puis retirée (§ Conservation) ; recette navigateur réelle sur `/rapport`, 28/28, qui a trouvé et fait corriger un défaut (§ Recette réelle) ; dépendances avec FUT-181 (§ PostHog).

## Ce que voit le lecteur

Sous le dossier de `/rapport`, après les gestes qui le suivent (« Préciser cette lecture à une adresse », le geste du verdict) et avant « Votre projet » :

> **Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?**
> Oui · Pas vraiment · Pas encore lu

- Un clic enregistre la réponse. « Merci, votre réponse est enregistrée. » s'affiche sous les réponses.
- Après « Oui » ou « Pas vraiment », un champ facultatif apparaît : « Quoi, ou qu'est-ce qui vous a manqué ? (facultatif) », avec la mention « Lu par l'équipe de futur•e seulement, jamais publié. » Après « Pas encore lu », aucun champ : la question du commentaire ne s'applique pas à un dossier non lu.
- Passer d'une réponse commentée à « Pas encore lu » **retire le commentaire** (avec sa date) et l'écran le dit : « Merci, c'est noté. Votre commentaire précédent a été retiré. » Entre « Oui » et « Pas vraiment », le commentaire est gardé.
- Vider le champ puis « Envoyer » efface le commentaire enregistré.
- Revenir ensuite de « Pas encore lu » à « Oui » ou « Pas vraiment » rouvre un champ **vide** : le commentaire retiré n'est ni en base ni dans le champ (corrigé après la recette réelle, voir plus bas).
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

**Ce qui n'y est pas** : l'adresse, le projet, le texte du dossier, l'e-mail.

**« Pas encore lu » n'a jamais de commentaire.** La route envoie explicitement `comment = null, commented_at = null` pour cette réponse, quel que soit le corps reçu. La contrainte `dossier_utility_feedback_non_lu_ck` le garantit aussi en base. Raison : « ce qui m'a manqué » décrirait une lecture que la réponse en vigueur dit ne pas avoir eu lieu. Entre « Oui » et « Pas vraiment », le commentaire et sa date sont conservés. Exploitation SQL : dans la requête 2, `avec_commentaire` vaut donc toujours 0 pour `pas_encore_lu`, et le taux d'utilité (requête 3) ne compte que les dossiers lus.

**Doublons** : contrainte `unique (user_id, insee_code, scope_key)`. **Une réponse par compte et par dossier, et elle se remplace.** Un nouvel envoi met à jour la même ligne (upsert). `created_at` garde la date de la première réponse. Un envoi sans clé `comment` garde le commentaire enregistré ; un champ vidé l'efface. Côté écran, un verrou synchrone fait qu'un double clic n'envoie qu'une requête.

## Droits

- `anon` : rien.
- `authenticated` : lecture de ses seules lignes (policy `select_own`), **aucune écriture** (`revoke all` + `grant select` ; pas de policy d'écriture).
- Écriture : uniquement par `POST /api/dossier/retour-utilite`, qui exige une session (401 sinon) et vérifie **sous l'identité du lecteur** que la commune lui est ouverte (`loadTerritoryClaims`) et que le dossier d'adresse est le sien, non révoqué et de cette commune (`getDossier`). Elle écrit ensuite avec le service role (`lib/server/retour-utilite-store.ts`, qui ne rend jamais ce client). `user_id` vient toujours de la session, jamais du corps de la requête.
- Tant que la migration n'est pas appliquée, la lecture échoue et `/rapport` **cache la question**. Rien ne casse.

## PostHog et consentement

### Ce que fait FUT-94 (garanti, testé, mesuré)

1. **Aucun événement FUT-94 sans consentement valide.** L'unique appel `posthog.capture("dossier_utility_feedback_submitted", …)` passe par `mesureAutorisee()` (`src/lib/consentement-mesure.ts`). Seule la valeur `"granted"` de `localStorage["futuree-consent"]`, écrite par `ConsentBanner`, l'autorise. Une valeur absente, `"denied"` ou autre, un stockage bloqué ou un rendu côté serveur donnent non. Un test lie la clé et les valeurs à celles de la bannière.
2. **Le bloc n'est jamais autocapturé ni enregistré.** La section porte la classe `ph-no-capture`, que posthog-js 1.375 honore deux fois : l'autocapture l'ignore (vérifié dans `dist/module.js`), et l'enregistreur de session s'en sert comme `blockClass` (vérifié dans `dist/lazy-recorder.js`), ce qui remplace le bloc par un aplat dans un replay.
3. **Le texte libre ne peut pas partir indirectement.** L'événement ne porte que `{ answer, has_comment, step, is_change, scope, presentation }`. posthog-js ne capture jamais la valeur d'un champ de saisie. Les erreurs d'envoi sont interceptées (rien ne remonte à `capture_exceptions`), et le journal serveur n'écrit que le code d'erreur et la portée.

**Mesure dans le navigateur** (`2026-11-09-fut94-retour-utilite/consentement.cjs`, résultat dans `consentement.txt`). Le banc tourne en local, et toutes les requêtes `/ingest/**` sont interceptées et décodées, sans que rien ne sorte. Le parcours complet (réponse, commentaire témoin, envoi) est joué pour les trois états :

| Consentement | `dossier_utility_feedback_submitted` | Autocapture dans le bloc | Bouton témoin hors du bloc | Texte du commentaire envoyé |
|---|---|---|---|---|
| absent | 0 | 0 | 1 | 0 |
| `denied` | 0 | 0 | 1 | 0 |
| `granted` | 2 (réponse, commentaire), sans texte | 0 | 1 | 0 |

Contre-épreuve : la classe `ph-no-capture` est retirée le temps d'une mesure. Trois clics du bloc partent alors en autocapture, même sans consentement. C'est donc bien elle qui protège.

### Le défaut global, antérieur à FUT-94 (NON traité ici)

`PostHogProvider` appelle `posthog.init` sans condition dès que le jeton existe. `ConsentBanner` ne pilote que Google Consent Mode. Mesuré ci-dessus : sans consentement, `$pageview`, `$set` et l'autocapture des clics partent quand même. Périmètre exact :

- **Initialisation** (`src/components/PostHogProvider.tsx`) : `$pageview` à chaque navigation (`PostHogPageView`), `$pageleave`, autocapture (activée par défaut), exceptions (`capture_exceptions`), web vitals, et enregistrement de session si le projet PostHog l'active dans sa configuration distante.
- **Identification** : `posthog.identify(user.id, { email })` à chaque page d'un compte connecté, sans consentement. **L'e-mail part donc vers PostHog.**
- **47 appels `capture` côté client, dans 32 fichiers**, tous soumis au même défaut.
- **6 points de capture côté serveur** (`posthog-node` : `auth/actions.ts`, `qna/route.ts`, `api/comparateur-vie/ask`, `api/inscription-pro`, `api/stripe/webhook`, `api/stripe/create-payment-intent`), hors de portée d'une bannière et à revoir pour leur base légale.
- **Contradiction avec la politique**, qui annonce PostHog « avec consentement » (finalités, sous-traitants, enregistrements de session).

**Traitement proposé, en ticket séparé** (pas de refonte dans FUT-94) :
1. `posthog.init(…, { opt_out_capturing_by_default: true, persistence: "memory" })`, puis `posthog.opt_in_capturing()` ou `opt_out_capturing()` dans `ConsentBanner.handleConsent`, et à la lecture d'un choix déjà enregistré.
2. Ne pas envoyer d'`identify` avant consentement, et retirer l'e-mail des propriétés (`user.id` suffit).
3. Enregistrement de session : seulement après `granted`, champs masqués (déjà par défaut).
4. Revoir les six captures serveur (identifiant, nécessité, base légale).
5. Un test de bout en bout du même type que `consentement.cjs`, étendu au site entier.

Une fois ce ticket livré, la garde `mesureAutorisee()` de FUT-94 devient redondante mais reste sans effet de bord.

### Dépendances avec FUT-181 (ticket du défaut global)

FUT-94 ne modifie ni FUT-181 ni `PostHogProvider`, et ne crée aucune logique de consentement concurrente : `mesureAutorisee()` **lit** la valeur que `ConsentBanner` écrit, sans rien piloter.

| Point | Dépendance | Ordre |
|---|---|---|
| Événement `dossier_utility_feedback_submitted` | sûr dès maintenant (garde locale) ; après FUT-181, double garde sans effet de bord | indépendant |
| `mesureAutorisee()` | à supprimer **ou** à brancher sur l'helper que FUT-181 introduira (`mesure-audience.ts` d'après le ticket) ; un seul appel, dans `RetourUtilite.tsx` | après FUT-181, nettoyage facultatif |
| `ph-no-capture` sur le bloc | à garder même après FUT-181 : il protège le texte libre d'un enregistrement de session consenti | permanent |
| Politique de confidentialité | FUT-94 ajoute la ligne « Votre avis sur un dossier », sa base légale et ses durées ; FUT-181 doit corriger la mention « PostHog avec consentement ». **Même fichier** : celui qui fusionne en second rebase (conflit textuel possible sur `LAST_UPDATED`, aucun conflit de fond) | l'un ou l'autre, rebase du second |
| Recette | `consentement.cjs` et le volet consentement de `recette-reelle.mjs` servent de base au test de bout en bout demandé par FUT-181 | réutilisable |

Ce que FUT-94 ne peut pas garantir tant que FUT-181 n'est pas livré : **le reste du site** envoie `$pageview`, `$set` et l'autocapture sans consentement (mesuré à nouveau en recette réelle : 6 événements tentés sans consentement, aucun ne venant du bloc).

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
2. **Nécessité** : l'avis ne peut s'obtenir qu'en le demandant. Les données sont minimales : une réponse parmi trois, un commentaire facultatif, l'identifiant du dossier (sans adresse, sans projet, sans e-mail). Aucune donnée n'est déduite.
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

**Limite de l'alerte** : c'est une requête, pas une notification. Tant qu'aucune supervision ne l'appelle, quelqu'un doit la lancer chaque semaine (procédure ci-dessous). Brancher une notification (Edge Function planifiée, ou supervision externe qui lit la requête) est hors du périmètre de FUT-94.

**Suppression plutôt qu'anonymisation.** Retirer `user_id` laisserait la ligne rattachée à un dossier d'adresse, donc à son propriétaire : ce serait une pseudonymisation, pas une anonymisation. Ce qui se conserve sans limite, ce sont les décomptes agrégés (requêtes 2 à 4), qui ne désignent personne.

### Politique de confidentialité (`/politique-confidentialite`)

- Date de mise à jour : **9 novembre 2026** (à ajuster au jour de publication si la PR est fusionnée plus tard).
- « Données collectées » : l'avis en fin de dossier, sans adresse ni projet, lu par l'équipe seulement, jamais publié sans accord exprès, modifiable et effaçable depuis le dossier.
- Finalités : « Intérêt légitime (voir ci-dessous) », suivi d'un paragraphe qui l'explique et donne le moyen de s'opposer.
- Conservation : 12 mois pour le commentaire, 24 mois pour la réponse, effacement avec le compte, avec le bien ou sur demande.
- **Non corrigé ici** : la mention « PostHog avec consentement », que le défaut global contredit (voir § PostHog).

## Mise en production (hors de cette mission, chaque étape sur accord explicite)

0. **Préalables** : base légale et durées validées par le responsable du traitement (§ Confidentialité) ; PR fusionnée.
1. **Migration** : appliquer `supabase/39_retours_utilite_dossier.sql` en production (SQL Editor, fichier entier, en une fois). Elle ne touche aucune table existante. Retour arrière : `39_retours_utilite_dossier_down.sql` (détruit les retours et la fonction ; retirer d'abord la planification, étape 5).
2. **Contrôles, avant tout déploiement** (SQL Editor, production) :
   - `select grantee, privilege_type from information_schema.role_table_grants where table_name = 'dossier_utility_feedback' and grantee in ('anon','authenticated');` → **une seule ligne** : `authenticated | SELECT` ;
   - `select has_function_privilege('authenticated', 'public.purger_retours_utilite(interval,interval)', 'execute');` → `false` (idem `anon`) ;
   - `select policyname, cmd from pg_policies where tablename = 'dossier_utility_feedback';` → `dossier_utility_feedback_select_own | SELECT` ;
   - avis de sécurité Supabase : aucun avis sur ces deux objets (vérifié sur le projet de test).
3. **Déploiement** de la branche fusionnée. Sans l'étape 1, la question reste simplement absente.
4. **Vérification** sur un compte interne qui possède un dossier : la question apparaît sous le dossier ; une réponse « Pas vraiment » + commentaire, puis « Oui », puis « Pas encore lu » ; requête 1 de `fut94-retours-utilite.sql` : une seule ligne, commentaire effacé à la fin, `created_at` inchangé. Puis effacer cette ligne de test (requête 5).
5. **Purge planifiée** : `supabase/maintenance/fut94-planifier-purge.sql`, blocs 1 à 3 ; le lendemain, bloc 3 (une exécution `succeeded`) ; puis le bloc 4 (alerte) chaque semaine, ou branché sur une supervision.

## Vérifications

- `src/lib/fut94-retour-utilite.test.ts` (**16**) : les trois réponses, le commentaire facultatif, l'envoi sans commentaire, le remplacement, **les transitions Oui ↔ Pas vraiment (commentaire et date gardés) et → Pas encore lu (effacés, même si le corps en porte un), puis → Oui (rien ne revient)**, l'idempotence, le rattachement (commune, deux biens, arrondissement), l'isolation entre comptes, la panne du stockage, **le consentement** (`granted`, `denied`, absent, illisible, hors navigateur ; clé et valeurs liées à la bannière). La migration (dont la contrainte « pas encore lu » et les droits de la purge), la route et la page sont vérifiées sur leurs sources.
- `src/components/report/fut94-retour-utilite-ecran.test.ts` (**22**, le vrai composant dans les deux présentations) : un geste par réponse ; le commentaire ; le double clic ; les pannes (texte conservé, réessai) ; la réponse déjà enregistrée ; la borne de 2 000 caractères ; **aucun événement sans `granted`** ; **`ph-no-capture` sur le bloc**, avec un seul appel PostHog gardé ; **« Pas encore lu » après un commentaire (retrait annoncé, puis champ vide au retour à « Oui »)** contre Oui ↔ Pas vraiment (gardé) ; **l'effacement depuis l'écran**.
- **Tests de mutation** : on réintroduit chaque défaut corrigé et le test correspondant échoue. Sans l'effacement « pas encore lu » : 2 échecs. Sans la garde de consentement : 2. Sans `ph-no-capture` : 1. **Sans le vidage du champ après retrait : 2** (classique et Relevé).
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

**28/28**, dans chaque présentation : première question sans réponse en base ; « Oui » sans commentaire ; ajout, modification puis effacement du commentaire ; réponse commentée → « Pas encore lu » (retrait annoncé, plus de champ) ; retour à « Oui » (champ vide, rien en base) ; rechargement (état relu en base, question non reposée) ; double clic (un seul envoi, une ligne) ; panne réseau puis « Réessayer l'envoi » (texte conservé, rien écrit pendant la panne) ; clavier (Entrée sur « Modifier » puis sur une réponse, focus gardé dans le bloc, statut annoncé). Puis : deux biens d'un même compte isolés ; consentement absent et `denied` (0 événement FUT-94) et `granted` (2 événements, sans texte) ; table illisible (question absente, page intacte) et sa contre-épreuve (question de retour). Journal serveur : 29 envois, tous 200, **texte du commentaire jamais présent**.

**Défaut trouvé et corrigé.** Après « Pas encore lu », l'écran annonçait « Votre commentaire précédent a été retiré » ; la base était juste (NULL), mais revenir à « Oui » **reproposait l'ancien texte dans le champ**, et un clic sur « Envoyer » l'aurait ré-enregistré. Le composant vide désormais le champ quand un commentaire est retiré. Le test d'écran correspondant échoue sans le correctif (2 échecs) et passe avec. Un test d'écran existant reposait sur un faux serveur qui ne conservait pas le commentaire, contrairement au vrai : il part maintenant du même état que l'écran.

**Limites de cette recette.** L'artefact figé du dossier n'est pas généré sur la base de test (les sources de référence y sont vides) : `artifact_version` reste nul ; sa lecture est couverte par les tests de la route. Le paiement n'est pas joué (biens insérés par le service role) : hors périmètre FUT-94.

## Limites connues

- La question n'est posée que sur le hub `/rapport`, pas sur les pages de module (Territoire, Autour, Logement).
- Le commentaire en cours de saisie n'est pas conservé si la page est rechargée (il l'est lors d'un échec d'envoi).
- La présentation enregistrée est celle que l'écran déclare : un compte qui la falsifierait ne fausserait que sa propre ligne.
