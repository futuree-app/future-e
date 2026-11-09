# FUT-94 · Retour d'utilité en fin de dossier (09/11/2026)

## Ce que voit le lecteur

Sous le dossier de `/rapport`, après les gestes qui le suivent (« Préciser cette lecture à une adresse », le geste du verdict) et avant « Votre projet » :

> **Cette analyse vous a-t-elle appris quelque chose d'utile pour votre recherche ?**
> Oui · Pas vraiment · Pas encore lu

- Un clic enregistre la réponse. « Merci, votre réponse est enregistrée. » s'affiche sous les réponses.
- Après « Oui » ou « Pas vraiment », un champ facultatif apparaît : « Quoi, ou qu'est-ce qui vous a manqué ? (facultatif) », avec la mention « Lu par l'équipe de futur•e seulement, jamais publié. » Après « Pas encore lu », aucun champ : la question du commentaire ne s'applique pas à un dossier non lu.
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

**Doublons** : contrainte `unique (user_id, insee_code, scope_key)`. **Une réponse par compte et par dossier, et elle se remplace.** Un nouvel envoi met à jour la même ligne (upsert). `created_at` garde la date de la première réponse. Un envoi sans clé `comment` garde le commentaire enregistré ; un champ vidé l'efface. Côté écran, un verrou synchrone fait qu'un double clic n'envoie qu'une requête.

## Droits

- `anon` : rien.
- `authenticated` : lecture de ses seules lignes (policy `select_own`), **aucune écriture** (`revoke all` + `grant select` ; pas de policy d'écriture).
- Écriture : uniquement par `POST /api/dossier/retour-utilite`, qui exige une session (401 sinon) et vérifie **sous l'identité du lecteur** que la commune lui est ouverte (`loadTerritoryClaims`) et que le dossier d'adresse est le sien, non révoqué et de cette commune (`getDossier`). Elle écrit ensuite avec le service role (`lib/server/retour-utilite-store.ts`, qui ne rend jamais ce client). `user_id` vient toujours de la session, jamais du corps de la requête.
- Tant que la migration n'est pas appliquée, la lecture échoue et `/rapport` **cache la question**. Rien ne casse.

## PostHog

Un seul événement, après confirmation du serveur : `dossier_utility_feedback_submitted`, avec `{ answer, has_comment, step: "reponse" | "commentaire", is_change, scope: "commune" | "adresse", presentation }`. **Jamais le texte du commentaire**, ni la commune, ni l'adresse. Un test vérifie que le texte saisi n'apparaît dans aucune capture.

## Consulter les réponses (administrateur)

`supabase/maintenance/fut94-retours-utilite.sql`, à coller dans Supabase > SQL Editor (lecture seule) :
1. les 200 derniers retours avec leurs dates ;
2. le décompte par réponse sur 30 jours ;
3. le taux d'utilité parmi les dossiers **lus** (oui / (oui + pas vraiment)), avec les « pas encore lu » à côté, par semaine ;
4. commune seule ou adresse.

Aucune route HTTP ne liste les retours. Les commentaires ne sont jamais publiés ni cités comme témoignages sans un consentement distinct.

La politique de confidentialité mentionne désormais cet avis : une ligne dans « Données collectées », une finalité avec la base « Intérêt légitime ». **À relire avant mise en production.**

## Mise en production (hors de cette mission)

1. Appliquer `supabase/39_retours_utilite_dossier.sql` (SQL Editor). Retour arrière : `39_retours_utilite_dossier_down.sql`, qui détruit les retours.
2. Déployer. La question n'apparaît qu'une fois la table présente.

## Vérifications

- `src/lib/fut94-retour-utilite.test.ts` (14 tests) : les trois réponses, le commentaire facultatif, l'envoi sans commentaire, le remplacement, l'idempotence, le rattachement (commune, deux biens, arrondissements), l'isolation entre comptes, la panne du stockage ; les garanties de la migration, de la route et de la page, vérifiées sur leurs sources.
- `src/components/report/fut94-retour-utilite-ecran.test.ts` (16 tests, le vrai composant dans les deux présentations) : un geste par réponse, le commentaire, le double clic (une requête, focus conservé), les pannes (500, 502 sans JSON, coupure réseau ; commentaire conservé puis réessai réussi), la réponse déjà enregistrée (question non reposée, « Modifier »), la borne de 2 000 caractères (jamais tronquée), l'absence du texte dans PostHog.
- `scripts/fut94-verifier-rls.mjs` (25 vérifications sur un vrai Postgres, PGlite, avec les privilèges par défaut de Supabase reproduits) : RLS et isolation, refus d'écriture pour `authenticated` et `anon`, contraintes, cascade, retour arrière, rejeu.
- La chaîne complète 01 → 39 du schéma de test s'applique (`schema-de-test.mjs`, `fut10-postgres.mjs`).
- Recette navigateur (banc `/dev/fut94`, 404 en production) : captures et journal dans `2026-11-09-fut94-retour-utilite/` (`recette.txt`, script `captures.cjs`). 0 px de débordement à 360, 390 et 1 440 px ; boutons de 44 px ; parcours au clavier Tab → Oui → Pas vraiment → Pas encore lu → suite ; Espace enregistre sans perdre le focus ; après l'envoi, le focus passe sur la ligne de rappel ; contour de focus de 2 px.

## Limites connues

- La question n'est posée que sur le hub `/rapport`, pas sur les pages de module (Territoire, Autour, Logement).
- Le commentaire en cours de saisie n'est pas conservé si la page est rechargée (il l'est lors d'un échec d'envoi).
- La présentation enregistrée est celle que l'écran déclare : un compte qui la falsifierait ne fausserait que sa propre ligne.
