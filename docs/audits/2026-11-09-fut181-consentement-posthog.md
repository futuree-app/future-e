# FUT-181 · Consentement PostHog : correctif (09/11/2026)

Base : `main` à `51a493d0` (FUT-121 #137 incluse). FUT-94 (#135, `b48ad276`) non fusionnée, non requise.
SDK installés : `posthog-js` 1.375.0, `posthog-node` 5.35.0.

## 1. Diagnostic

Constaté par l'audit FUT-94, puis vérifié dans le code du SDK installé :

| Cause | Preuve |
|---|---|
| `PostHogProvider` appelait `posthog.init` sans condition. | `src/components/PostHogProvider.tsx` (avant). |
| `init` parle à PostHog **même en refus par défaut** : il charge la configuration distante (`/array/<jeton>/config`), puis `/flags` avec l'identifiant anonyme. | `posthog-core.js` `_loaded` → `RemoteConfigLoader.load()`, sans test de consentement. `opt_out_capturing_by_default` seul ne suffit donc pas. |
| `ConsentBanner` ne pilotait que Google Consent Mode. | `updateGoogleConsent` seul. |
| `identify(user.id, { email })` à chaque page d'un compte connecté. | Provider (avant). |
| Trois événements serveur d'authentification identifiés **par l'e-mail**, avec l'e-mail en propriété, plus un `identify` serveur sur l'e-mail. | `auth/actions.ts` (avant). |
| L'autocapture joint `attr__href` **même avec `mask_all_element_attributes`** ; certaines URLs portent une adresse complète (`/checkout/dossier?label=…&banId=…`, puis `/connexion?next=<la même URL>`), un identifiant de dossier (`?dossierId=`), ou le secret Stripe (`payment_intent_client_secret`). | `autocapture.js` l. 168 ; routes `checkout/dossier`, `rapport/logement`, retour Stripe. |
| `address_token` = hachage djb2 32 bits de l'identifiant BAN, envoyé avec la commune : retrouvable par dictionnaire (BAN publique). | `LogementModule`, `AutourModule` (avant). |
| Le serveur créait l'intention de paiement avec `phDistinctId` = **UUID du compte** quand le navigateur n'envoyait rien : le webhook émettait `payment_completed` sous la personne, sans consentement. | `create-payment-intent` l. 160 (avant). |
| `inscription-pro` envoyait l'e-mail (comme identifiant), le nom du cabinet et le besoin en texte libre. | route (avant). |

Point favorable, vérifié : avant `init`, `capture` / `identify` / `reset` sont sans effet **et sans file d'attente** (`if (!this.__loaded) return`). Ne pas initialiser suffit donc à garantir qu'aucun événement n'est envoyé rétroactivement après une acceptation.

## 2. Ce qui est implémenté (lot A)

**Source de vérité unique** : `localStorage["futuree-consent"]`, écrit par `ConsentBanner` (inchangé : clé, valeurs, `setItem`, ce que vérifie aussi le test FUT-94). Lu par `src/lib/mesure-audience-regles.ts` ; seule la valeur exacte `"granted"` vaut consentement ; stockage illisible = non. Un test lie la clé et les valeurs à la bannière.

**Pilotage unique** : `src/lib/mesure-audience.ts` est le seul endroit qui initialise, arrête ou identifie PostHog (vérifié par un test sur toutes les sources).

1. **Pas de consentement, pas d'`init`** : ni requête, ni identifiant.
2. **`before_send` relit le consentement à chaque événement** et réduit les URLs : un retrait dans un autre onglet coupe l'envoi au plus tard à l'événement suivant.
3. **Retrait** (refus, réouverture des préférences, autre onglet via l'événement `storage`) : drapeaux coupés, enregistrement arrêté, `reset(true)` (identifiant et identifiant d'appareil neufs), `opt_out_capturing` (persistance coupée), tampon des heatmaps vidé, puis effacement des traces `ph_*` / `__ph_opt_in_out_*` (stockage local, de session, cookies sur l'hôte et les domaines parents).
4. **`opt_out_capturing_by_default` + `opt_out_persistence_by_default`** : si le marqueur interne de PostHog disparaît, le SDK retombe en refus.
5. **Traces d'avant FUT-181** : effacées à chaque page sans consentement.
6. **Acceptation sans rechargement** : `init` (ou `opt_in_capturing` si déjà chargé), `$pageview` de la page courante, sans `$opt_in`.
7. **Identité** : `identify(UUID)` sans propriété, seulement mesure active ; `reset` à la déconnexion (y compris par la Server Action : détectée à la page suivante) et au changement de compte (jamais de fusion de deux comptes). Le `$pageview` attend que la session soit relue.

8. **Envoi non groupé** (`request_batching: false`) : la recette a montré qu'un `$$heatmap` capté avant un retrait partait après lui, à la fermeture de l'onglet, depuis la file d'envoi groupé.

**Minimisation, même avec consentement** : URLs réduites à une liste blanche de paramètres (`insee`, `communes`, `mode`, `source`, `rank`, `horizon`, `utm_*`), fragment retiré, dans `$current_url`, `$referrer`, propriétés initiales, `$elements_chain`, `$elements`, clés `$heatmap_data`, messages d'exception ; `mask_all_text`, `mask_all_element_attributes`, `mask_personal_data_properties` ; pas de chronométrage réseau ; **enregistrement de session désactivé** (il filmerait le contenu des dossiers ; à réexaminer en lot B) ; `address_token` retiré.

**Google Consent Mode** : finalités et réglages inchangés. Ajout : un choix fait dans un autre onglet est appliqué à Google dans celui-ci.

**FUT-121** : `ConsentBanner` garde son `useSyncExternalStore` et sa logique d'affichage ; les ajouts sont dans l'effet existant. Les tests FUT-121 de la bannière passent.

**FUT-94** : `mesureAutorisee()` et `ph-no-capture` restent valables et sans effet de bord (même clé, même valeur). Conflits textuels attendus au merge, triviaux : `LAST_UPDATED` (même date) et le tableau des finalités de la politique (lignes voisines).

## 3. Matrice avant / après (navigateur)

| Situation | Avant | Après (mesuré, `recette.txt`) |
|---|---|---|
| Première visite | `$pageview`, `$set`, `$autocapture`, exceptions, web vitals ; config + flags | 0 événement, 0 requête PostHog |
| Refus | idem | 0 / 0, rechargement compris |
| Acceptation | idem | mesure dès le clic, sans rechargement, sans rejeu |
| Acceptation puis refus | rien ne change | 0 événement après, traces effacées |
| Deux onglets, refus dans A | B continue | B n'envoie plus rien |
| Connecté sans consentement | `identify(id, {email})` | aucune identification, 0 requête |
| Connecté avec consentement | `identify` avec e-mail | `identify(UUID)`, e-mail absent de tout envoi |
| Déconnexion (Server Action) | identité conservée | identité réinitialisée avant la page suivante |
| Changement de compte | fusion possible | identité neuve |
| Champ libre, adresse dans l'URL | adresse dans `$current_url`, `attr__href`, `next` | absente de tout envoi |
| Stockage inaccessible | mesure active | 0 / 0, même après « Accepter » |

## 4. Les six captures serveur

Le serveur ne voit pas la bannière. **Signal retenu** : l'identifiant de mesure, que le navigateur ne transmet que mesure consentie et active (`identifiantMesure()`). Sans lui, aucun événement de mesure, et plus aucun repli (e-mail, UUID, identifiant de paiement). Ce n'est pas une preuve juridique de consentement (un client modifié peut envoyer un identifiant) ; c'est la garantie que le parcours normal sans consentement n'émet rien.

| Point | Événement(s) | Données (après) | Finalité | Nécessité technique | Base légale (à confirmer) | Sans consentement |
|---|---|---|---|---|---|---|
| `auth/actions.ts` | `user_logged_in`, `user_signed_up`, `user_signed_out` | `method`, `email_confirmation_required` ; plus d'e-mail ni d'`identify` serveur | entonnoir d'inscription | aucune (l'authentification ne dépend pas de PostHog) | consentement | rien (champ caché `ChampMesure` vide) |
| `qna/route.ts` (AskFuture) | `$ai_generation` | modèle, jetons, latence, statut HTTP, catégorie, commune, source de la réponse, violations du garde FUT-37 ; `distinctId: "anonymous"`, **`$process_person_profile: false`** | coût et qualité du modèle, détection des réponses remplacées | **oui, diagnostic** | intérêt légitime, **réserve** : à valider (aucun identifiant ni cookie, aucune donnée du lecteur ; pas un traceur au sens de l'art. 82) | maintenu, catégorie B |
| `api/comparateur-vie/ask` | `life_ask_submitted`, `life_ask_answered`, `life_ask_limit_reached` | rang, index, longueur de question, mode, indicateurs ; jamais le texte | usage produit | aucune (le quota repose sur un cookie, pas sur PostHog) | consentement | rien (plus de repli « anon ») |
| `api/inscription-pro` | `pro_inscription_submitted` | `profession`, `cabinet_renseigne`, `besoin_renseigne` ; plus d'e-mail, de cabinet ni de texte libre | conversion pro | aucune (l'inscription vit dans `pro_inscriptions`) | consentement | rien |
| `api/stripe/create-payment-intent` | `payment_intent_created` | produit, montant, devise, contexte déclaré (booléens) ; plus d'`user_id` | entonnoir d'achat | aucune | consentement | rien ; pose `phMesure=1` seulement si consenti |
| `api/stripe/webhook` | `payment_completed` (×2), `address_dossier_purchased` | montant, produit, devise, `payment_intent_id` (rapprochement), commune ; plus d'`user_id` ni de `dossier_id` | chiffre d'affaires par parcours | **aucune** : le paiement est suivi par Stripe, `payments`, `address_dossiers`, la facture | consentement | rien sans `phMesure=1` |

Intentions de paiement créées **avant** le déploiement : elles portent `phDistinctId` = UUID sans le marqueur, donc le webhook n'émet rien pour elles (protection conservatoire, perte de mesure assumée sur cette fenêtre).

## 5. Tests

**Exécutés**
- `src/lib/fut181-consentement-mesure.test.ts` : 15 tests (règles, purge, pilotage exécuté contre une doublure du SDK, sources).
- Recette réseau Playwright sur le site (`2026-11-09-fut181-consentement-posthog/recette.cjs`, résultat `recette.txt`) : 11 scénarios, 31 attendus, toutes les requêtes `/ingest/**` et `*.posthog.com` interceptées et décodées, événements et trafic technique comptés séparément. Tous tenus, sur deux exécutions consécutives.
- Contre-épreuves (`contre-epreuve.txt`), défauts réintroduits un par un, recette en échec à chaque fois :
  1. PostHog démarré sans condition → 7 attendus en échec (événements, requêtes, traces, identification) ;
  2. e-mail remis dans les propriétés de la personne → « l'e-mail n'apparaît dans aucun envoi » en échec ;
  3. envoi groupé rétabli → un `$$heatmap` part de l'onglet B après le retrait ;
  4. (involontaire) `$pageview` sans attente de la session → déconnexion en échec.
- TypeScript (0 erreur), ESLint (0 problème, comme `main`), build de production réussi.
- Suite complète (`node --test --test-concurrency=1`), sur ce Mac : `main` 4 468 tests, 5 échecs ; branche 4 484 tests (+16 : 15 FUT-181, 1 FUT-115), **les 5 mêmes échecs**, tous dans `fut27-*` (le « · » du chemin, connu). Les mêmes suites relancées dans une copie sans « · » : fut27 32/32 sur `main` et sur la branche ; suite complète de la branche 4 484 tests, **0 échec**.
- Deux tests existants adaptés, au comportement voulu : `fut147-non-regression` (lignes FUT-181 admises dans la route `/ask`, comme FUT-138) et `fut115-octroi-comparatif` (le paiement de test vient d'un navigateur consentant ; nouveau test : sans consentement, livraison et confirmation identiques, aucun événement PostHog, ni marqueur ni UUID dans les métadonnées).

Au passage, la recette a corrigé deux défauts de la première version du correctif : la file d'envoi groupé (un événement capté avant le retrait partait après lui, à la fermeture de l'onglet ; les champs internes du SDK étant renommés dans le bundle, seule l'option `request_batching: false` est fiable), et le premier `$pageview` après une déconnexion par la Server Action, parti sous l'UUID avant la relecture de la session.

**Statiques seulement** : l'absence d'e-mail dans les `capture`/`identify` serveur (lecture des sources), le comportement des routes Stripe (pas de Stripe réel), l'effet en production de la configuration distante du projet PostHog.

## 6. Risques résiduels et lot B

1. **Données déjà collectées sans consentement** dans PostHog : personnes identifiées avec la propriété `email`, événements anonymes, éventuels replays. Rien n'a été supprimé à distance. À décider : suppression des propriétés `email`, purge des personnes/événements antérieurs, durée de conservation du projet.
2. **IP** : PostHog conserve l'IP et la géolocalisation par défaut (réglage de projet, pas du SDK). Recommandé : activer « Discard client IP data ».
3. **Google** : GTM et GA4 se chargent sans condition ; Consent Mode « default denied » peut émettre des pings sans cookie (mode avancé). Hors périmètre (finalités Google inchangées), à examiner.
4. **Envoi non groupé** (`request_batching: false`) : un événement par requête, pour qu'aucun événement capté avant un retrait ne parte après lui (le SDK n'expose pas de moyen d'abandonner sa file ; ses champs internes sont renommés dans le bundle). Coût : plus de requêtes vers `/ingest`. Un envoi déjà en vol au moment du clic peut encore aboutir.
5. **Propriétés de profil** : `wizard_completed` (secteur, mobilité, projets en valeurs fermées, commune), `workbook_answered` (réponses fermées) : valeurs d'énumération, pas de texte libre ; à revoir en lot B.
6. **Heatmaps** : actives si le projet les active ; clés d'URL réduites.
7. **Enregistrement de session** : désactivé ; s'il doit revenir, avec `maskTextSelector: "*"` et un masquage des attributs `href`, après revue.
