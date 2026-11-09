# FUT-94 · Retour d'utilité en fin de dossier (09/11/2026)

> **Reprise après contre-revue (09/11/2026, sur `d57046ea`)** : consentement PostHog (§ PostHog), effacement du commentaire au passage à « Pas encore lu » (§ Stockage), base légale, conservation et effacement (§ Confidentialité), intégration de l'upsert (§ Vérifications).

## Ce que voit le lecteur

Sous le dossier de `/rapport`, après les gestes qui le suivent (« Préciser cette lecture à une adresse », le geste du verdict) et avant « Votre projet » :

> **Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?**
> Oui · Pas vraiment · Pas encore lu

- Un clic enregistre la réponse. « Merci, votre réponse est enregistrée. » s'affiche sous les réponses.
- Après « Oui » ou « Pas vraiment », un champ facultatif apparaît : « Quoi, ou qu'est-ce qui vous a manqué ? (facultatif) », avec la mention « Lu par l'équipe de futur•e seulement, jamais publié. » Après « Pas encore lu », aucun champ : la question du commentaire ne s'applique pas à un dossier non lu.
- Passer d'une réponse commentée à « Pas encore lu » **retire le commentaire** (avec sa date) et l'écran le dit : « Merci, c'est noté. Votre commentaire précédent a été retiré. » Entre « Oui » et « Pas vraiment », le commentaire est gardé.
- Vider le champ puis « Envoyer » efface le commentaire enregistré.
- Une fois le commentaire envoyé, le bloc se replie en une ligne : « Votre retour sur cette analyse : Pas vraiment, avec un commentaire. Merci. · Modifier ».
- À la visite suivante, seule cette ligne s'affiche. La question n'est jamais reposée, mais la réponse reste modifiable.
- En cas d'échec, rien n'est montré comme enregistré. Le texte du commentaire reste dans le champ, mot pour mot, et le bouton devient « Réessayer l'envoi ».

Mêmes textes, même structure et même ordre dans les deux présentations. En classique, la réponse retenue est cerclée d'orange, jamais remplie : l'aplat orange reste réservé à l'action principale. Sous le Relevé, le bloc reprend les primitives du Relevé (`releveSection`, `option`, `texte`, `bouton`, `action`) sans aucune couleur propre.

## Stockage : table `dossier_utility_feedback` (migration 39, NON appliquée)

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

`purger_retours_utilite()` (migration 39) est idempotente, rend ce qu'elle a fait et refuse des délais incohérents. Elle est réservée au service role et **non planifiée** ; un `cron.schedule` est proposé dans la migration, à poser à la main, sur le modèle de la migration 38. La requête 6 de maintenance montre ce qu'elle ferait avant de la lancer. Les durées proposées sont **à valider** par le responsable du traitement.

**Suppression plutôt qu'anonymisation.** Retirer `user_id` laisserait la ligne rattachée à un dossier d'adresse, donc à son propriétaire : ce serait une pseudonymisation, pas une anonymisation. Ce qui se conserve sans limite, ce sont les décomptes agrégés (requêtes 2 à 4), qui ne désignent personne.

### Politique de confidentialité (`/politique-confidentialite`)

- Date de mise à jour : **9 novembre 2026** (à ajuster au jour de publication si la PR est fusionnée plus tard).
- « Données collectées » : l'avis en fin de dossier, sans adresse ni projet, lu par l'équipe seulement, jamais publié sans accord exprès, modifiable et effaçable depuis le dossier.
- Finalités : « Intérêt légitime (voir ci-dessous) », suivi d'un paragraphe qui l'explique et donne le moyen de s'opposer.
- Conservation : 12 mois pour le commentaire, 24 mois pour la réponse, effacement avec le compte, avec le bien ou sur demande.
- **Non corrigé ici** : la mention « PostHog avec consentement », que le défaut global contredit (voir § PostHog).

## Mise en production (hors de cette mission)

1. Valider la base légale et les durées (§ Confidentialité).
2. Appliquer `supabase/39_retours_utilite_dossier.sql` (SQL Editor). Retour arrière : `39_retours_utilite_dossier_down.sql`, qui détruit les retours et la fonction de purge.
3. Vérifier l'upsert de bout en bout sur le projet Supabase de test (voir « Ce qui reste à vérifier »).
4. Planifier la purge (`cron.schedule`, voir la migration).
5. Déployer. La question n'apparaît qu'une fois la table présente.

## Vérifications

- `src/lib/fut94-retour-utilite.test.ts` (**16**) : les trois réponses, le commentaire facultatif, l'envoi sans commentaire, le remplacement, **les transitions Oui ↔ Pas vraiment (commentaire et date gardés) et → Pas encore lu (effacés, même si le corps en porte un), puis → Oui (rien ne revient)**, l'idempotence, le rattachement (commune, deux biens, arrondissement), l'isolation entre comptes, la panne du stockage, **le consentement** (`granted`, `denied`, absent, illisible, hors navigateur ; clé et valeurs liées à la bannière). La migration (dont la contrainte « pas encore lu » et les droits de la purge), la route et la page sont vérifiées sur leurs sources.
- `src/components/report/fut94-retour-utilite-ecran.test.ts` (**22**, le vrai composant dans les deux présentations) : un geste par réponse ; le commentaire ; le double clic ; les pannes (texte conservé, réessai) ; la réponse déjà enregistrée ; la borne de 2 000 caractères ; **aucun événement sans `granted`** ; **`ph-no-capture` sur le bloc**, avec un seul appel PostHog gardé ; **« Pas encore lu » après un commentaire (retrait annoncé) contre Oui ↔ Pas vraiment (gardé)** ; **l'effacement depuis l'écran**.
- **Tests de mutation** : on réintroduit chaque défaut corrigé et le test correspondant échoue. Sans l'effacement « pas encore lu » : 2 échecs. Sans la garde de consentement : 2. Sans `ph-no-capture` : 1.
- `scripts/fut94-verifier-rls.mjs` : **31 vérifications** sur un vrai Postgres (PGlite, privilèges par défaut de Supabase reproduits) : RLS, refus d'écriture pour `authenticated` et `anon`, contraintes (dont « pas encore lu » sans commentaire), **purge** (commentaire de 13 mois effacé et réponse gardée, commentaire de 11 mois gardé, réponse de 25 mois supprimée, idempotence, interdite à `authenticated` et `anon`, délais incohérents refusés), cascades, retour arrière (table et fonction), rejeu.
- `scripts/fut94-verifier-upsert.mjs` : **8 vérifications**, de `supabase-js` jusqu'à Postgres :
  - le **vrai** `ecrireRetourUtilite`, avec le `supabase-js` du projet, émet `POST /rest/v1/dossier_utility_feedback?on_conflict=user_id,insee_code,scope_key` avec `Prefer: resolution=merge-duplicates,return=representation`, **sans `created_at` ni `id`**, et sans `comment` quand seule la réponse change ;
  - ce corps, rejoué dans Postgres sous la forme SQL de PostgREST (`json_populate_recordset` + `ON CONFLICT … DO UPDATE SET` des seules colonnes envoyées), donne : **`created_at` inchangé sur trois envois**, commentaire et date gardés de Pas vraiment à Oui, effacés à Pas encore lu, une seule ligne.
- Consentement mesuré dans le navigateur : voir § PostHog (`consentement.cjs`, `consentement.txt`).
- Chaîne 01 → 39 du schéma de test et `fut10-postgres.mjs` : verts.
- Recette navigateur (captures de la première livraison, `recette.txt`) : 360, 390 et 1 440 px, sans débordement, boutons de 44 px, clavier.

### Ce qui reste à vérifier

**Le passage par le binaire PostgREST lui-même.** Le chaînon intermédiaire (requête HTTP → SQL) est reproduit d'après le comportement documenté de PostgREST, pas exécuté. Le téléchargement d'un PostgREST local a été refusé dans cette session, et appliquer la migration sur une base Supabase était hors mission. À faire avant la mise en production, sur le projet de test : appliquer la 39, enregistrer deux réponses successives par la route et comparer `created_at`.

## Limites connues

- La question n'est posée que sur le hub `/rapport`, pas sur les pages de module (Territoire, Autour, Logement).
- Le commentaire en cours de saisie n'est pas conservé si la page est rechargée (il l'est lors d'un échec d'envoi).
- La présentation enregistrée est celle que l'écran déclare : un compte qui la falsifierait ne fausserait que sa propre ligne.
