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

**Google Consent Mode** : finalités et réglages inchangés. Ajouts : un choix fait dans un autre onglet est appliqué à Google dans celui-ci ; rouvrir les préférences (choix effacé) remet Google en refus, dans cet onglet et les autres (contre-revue, §7).

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

## 4. Les six captures serveur (état après contre-revue, §7)

Le serveur ne voit pas la bannière. **Signal retenu** : l'identifiant de mesure, que le navigateur ne transmet que mesure consentie et active (`identifiantMesure()`). Sans lui, aucun événement de mesure, et plus aucun repli (e-mail, UUID, identifiant de paiement). Ce n'est pas une preuve juridique de consentement (un client modifié peut envoyer un identifiant) ; c'est la garantie que le parcours normal sans consentement n'émet rien.

| Point | Événement(s) | Données (après) | Finalité | Nécessité technique | Base légale (à confirmer) | Sans consentement |
|---|---|---|---|---|---|---|
| `auth/actions.ts` | `user_logged_in`, `user_signed_up`, `user_signed_out` | `method`, `email_confirmation_required` ; plus d'e-mail ni d'`identify` serveur | entonnoir d'inscription | aucune (l'authentification ne dépend pas de PostHog) | consentement | rien (champ caché `ChampMesure` vide) |
| `qna/route.ts` (AskFuture) | `$ai_generation` | modèle, jetons, latence, statut HTTP, catégorie, commune, source de la réponse, violations du garde FUT-37 ; `distinctId: "anonymous"`, **`$process_person_profile: false`** | coût et qualité du modèle, détection des réponses remplacées | **oui, diagnostic** | intérêt légitime, **réserve** : à valider (aucun identifiant ni cookie, aucune donnée du lecteur ; pas un traceur au sens de l'art. 82) | **coupé par défaut** (contre-revue) : rien vers PostHog sauf `QNA_TELEMETRIE_POSTHOG=1` ; journal serveur interne conservé |
| `api/comparateur-vie/ask` | `life_ask_submitted`, `life_ask_answered`, `life_ask_limit_reached` | rang, index, longueur de question, mode, indicateurs ; jamais le texte | usage produit | aucune (le quota repose sur un cookie, pas sur PostHog) | consentement | rien (plus de repli « anon ») |
| `api/inscription-pro` | `pro_inscription_submitted` | `profession`, `cabinet_renseigne`, `besoin_renseigne` ; plus d'e-mail, de cabinet ni de texte libre | conversion pro | aucune (l'inscription vit dans `pro_inscriptions`) | consentement | rien |
| `api/stripe/create-payment-intent` | `payment_intent_created` | produit, montant, devise, contexte déclaré (booléens) ; plus d'`user_id` | entonnoir d'achat | aucune | consentement | rien ; l'identifiant n'est plus confié à Stripe |
| `api/stripe/webhook` | ~~`payment_completed` (×2), `address_dossier_purchased`~~ **retirés** | aucune | (chiffre d'affaires par parcours) | **aucune** : le paiement est suivi par Stripe, `payments`, `address_dossiers`, packs, la facture | consentement, impossible à vérifier sans navigateur | **rien, jamais** (contre-revue) |

Intentions de paiement créées **avant** le déploiement : elles portent encore `phDistinctId` dans leurs métadonnées Stripe ; le webhook ne le lit plus et n'émet rien.

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
3. **Google** : GTM et GA4 se chargent sans condition. Avec Consent Mode « default denied », des pings sans cookie partent : constaté en recette, `gcs=G100` vers `region1.google-analytics.com` avant tout choix et après un retrait. Par ailleurs, un événement GA4 créé sous consentement peut partir jusqu'à 4 s après un retrait, marqué accordé (§7.2). Hors périmètre (finalités Google inchangées), à décider en lot B.
4. **Envoi non groupé** (`request_batching: false`) : un événement par requête, pour qu'aucun événement capté avant un retrait ne parte après lui (le SDK n'expose pas de moyen d'abandonner sa file ; ses champs internes sont renommés dans le bundle). Coût : plus de requêtes vers `/ingest`. Un envoi déjà en vol au moment du clic peut encore aboutir.
5. **Suivi des achats dans PostHog** : depuis la contre-revue, seule l'intention de paiement est mesurée (§7.1). Pour rétablir `payment_completed`, il faudra une règle de consentement relue au moment du webhook.
6. **Anthropic** absent de la liste des sous-traitants alors que les questions posées à l'assistant lui sont transmises (§7.3).
7. **Propriétés de profil** : `wizard_completed` (secteur, mobilité, projets en valeurs fermées, commune), `workbook_answered` (réponses fermées) : valeurs d'énumération, pas de texte libre ; à revoir en lot B.
8. **Heatmaps** : actives si le projet les active ; clés d'URL réduites.
9. **Enregistrement de session** : désactivé ; s'il doit revenir, avec `maskTextSelector: "*"` et un masquage des attributs `href`, après revue.

## 7. Reprises après contre-revue indépendante (SHA audité `099c205a`)

Verdict de la contre-revue : architecture validée, NO GO provisoire sur quatre points.

### 7.1 Retrait du consentement entre l'intention de paiement et le webhook

Défaut : `phMesure=1` et l'identifiant de mesure étaient figés dans les métadonnées Stripe à la création de l'intention. Un retrait du consentement avant la confirmation n'y changeait rien : le webhook émettait `payment_completed` ou `address_dossier_purchased` sous l'ancien identifiant.

Correction (la plus simple) : **le webhook n'émet plus aucun événement de mesure** (trois `capture` retirés, et les deux lectures de base qui ne servaient qu'à eux : rang du dossier, détection du rejeu pour `payment_completed`). `create-payment-intent` ne confie plus d'identifiant de mesure à Stripe (`phDistinctId` et `phMesure` retirés des métadonnées). L'entonnoir garde `payment_intent_created`, émis pendant la requête du navigateur consentant.

Inchangés : Stripe, l'octroi des produits, les tables `payments` / `address_dossiers` / packs, la facture, l'e-mail de confirmation. Le chiffre d'affaires se lit dans Stripe et `payments`.

Perte assumée : PostHog ne voit plus l'achat confirmé, seulement l'intention. Rétablir `payment_completed` demande une règle de consentement actualisé côté serveur (par exemple un consentement horodaté relu au webhook), hors lot A.

Tests (exécutés, `fut115-octroi-comparatif`) : nouveau scénario « consentement → intention → retrait → confirmation → webhook et rejeu » : seul `payment_intent_created` existe, aucun identifiant dans les métadonnées, droits livrés, une confirmation, un paiement enregistré et rapprochable. Le compteur des rejeux s'appuie désormais sur `payments` (un encaissement = une ligne), et plus sur `payment_completed`. Statique (`fut181-consentement-mesure`) : le webhook n'importe plus PostHog, le bloc `metadata` ne porte plus d'identifiant de mesure.

### 7.2 Réouverture des préférences Google

Défaut : `futuree:show-consent` effaçait le choix et arrêtait PostHog, mais Google restait à `granted`.

Correction (`ConsentBanner.tsx`) : la réouverture envoie `gtag("consent", "update", …denied)`. Dans les autres onglets, l'événement `storage` suit la même règle que PostHog : seule la valeur exacte `granted` ouvre ; une valeur effacée, inconnue, ou un `clear()` (clé nulle) vaut refus.

Tests (exécutés, `fut121-sans-cascade`, harnais existant de la bannière) : un onglet, accepter → rouvrir → refuser → rouvrir → accepter, avec la suite exacte des commandes Google ; deux onglets, effacement, refus, nouvelle acceptation, `clear()`, valeur inconnue, autre clé. Réseau (recette Playwright, scénarios 12 et 13, vrai conteneur GTM chargé, toute requête de mesure vers Google relevée puis bloquée pour ne pas polluer GA4) :
- commandes poussées dans `dataLayer` : `default denied` → `update granted` → réouverture `update denied` → refus → réouverture → `update granted`, dans un onglet ; dans deux onglets, B suit l'effacement, le refus et la nouvelle acceptation faits dans A ;
- état interne du tag (`google_tag_data.ics`, `analytics_storage.update`) : `false` dès la réouverture, dans A comme dans B ;
- requêtes : les événements créés après la réouverture partent en `gcs=G100` (refus ; ce sont les pings sans cookie du Consent Mode avancé, voir risque 3).

**Limite constatée, hors de portée de la page** : GA4 garde des événements déjà créés jusqu'à son envoi suivant, et chacun porte l'état de consentement du moment de sa création. Reproduit trois fois : la `page_view` d'un onglet chargé pendant le consentement part jusqu'à 4 s **après** le retrait, marquée `G111`, avec ou sans interaction ; l'événement créé juste après part en `G100`. Une fois, c'est un `scroll` de la page ouverte avant le retrait qui est sorti ainsi ; il est rattaché à cette file par sa page, sans preuve individuelle de son heure de création. La recette le relève en `INFO`, sans le compter comme réussite. Rien dans l'API publique de gtag ne permet de vider cette file. La seule parade connue est `window['ga-disable-G-MLT5Y4TC6W'] = true` au refus : elle couperait aussi les pings sans cookie, ce qui change la configuration Google et revient au responsable (lot B).

### 7.3 Politique de confidentialité et télémétrie `/qna`

Politique :
- les URL partent avec **les seuls paramètres explicitement autorisés**, décrits un par un (code des communes, mode d'affichage, horizon, origine et rang du lien, `utm_…`) ; un test lie cette liste à `PARAMETRES_URL_CONSERVES`, si bien qu'un paramètre ajouté en code sans mise à jour de la phrase fait échouer le test ;
- « votre navigateur ne lui envoie rien » remplace « rien ne lui est envoyé » ;
- nouvelle section « Journal technique de l'assistant », séparée de la mesure navigateur.

`$ai_generation` (avant contre-revue, émis à chaque réponse du modèle) :

| Propriété | Contenu |
|---|---|
| `distinctId` | constante `"anonymous"`, la même pour tous |
| `$process_person_profile` | `false` : aucune personne créée ni enrichie |
| `$geoip_disable` | `true`, ajouté par posthog-node (défaut `disableGeoip: true`) |
| IP vue par PostHog | celle du serveur (Vercel), pas celle du lecteur |
| `$ai_trace_id` | UUID aléatoire par requête, non relié au lecteur |
| `$ai_provider`, `$ai_model`, `$ai_base_url`, `$ai_span_name` | constantes techniques |
| `$ai_input_tokens`, `$ai_output_tokens`, `$ai_latency`, `$ai_http_status` | mesures techniques |
| `question_category`, `module_id`, `module_context` | thème de la question (désormais filtré : identifiant bien formé seulement) |
| `report_id` | code INSEE de la commune (désormais filtré : code bien formé seulement) |
| `qna_source`, `qna_violations` | modèle ou repli, codes de règle du garde FUT-37 (jamais d'extrait de texte) |

Ni la question (prédéfinie ou libre), ni la réponse, ni un identifiant de compte, de mesure ou de session.

**Limites de l'anonymisation** : l'absence de profil n'est pas une anonymisation au sens du RGPD. L'horodatage, la commune et le thème, croisés avec d'autres journaux (hébergeur, base, mesure navigateur consentie sur la même page), peuvent permettre de relier une génération à une visite. Le risque est faible, mais il n'est pas nul.

**Désactivation conservatoire** : la base légale (intérêt légitime ou consentement) relève du responsable du traitement et n'est pas présumée. La capture PostHog est donc **coupée par défaut** et ne se rallume qu'avec `QNA_TELEMETRIE_POSTHOG=1` (`telemetrieQnaPostHogActive`, test exécuté). Le diagnostic interne reste : une ligne `console.info("[qna] génération", …)` dans les journaux du serveur, avec le modèle, le statut, la latence, les jetons, le module, la commune, la source et les violations, sans question, sans texte et sans identifiant. Si le fondement est validé et la variable activée, la phrase de la politique « Il n'est pas transmis à PostHog » devra changer : le test de la politique le rappelle.

À signaler : la question posée à l'assistant est transmise à Anthropic pour produire la réponse, et Anthropic ne figure pas dans la liste des sous-traitants de la politique. Ce point est hors du périmètre de la mesure ; il est à trancher par le responsable du traitement.

### 7.4 Intégration du dernier `main`

`origin/main` (FUT-175, FUT-176, FUT-178, FUT-180) fusionné dans la branche sans conflit : seul `fut147-non-regression.test.ts` était touché des deux côtés, et la fusion automatique l'a résolu. Les tests FUT-147 (contrats de synthèse, registre Territoire, garde FUT-175), FUT-121, FUT-115, FUT-119, FUT-10 et FUT-181 passent.

FUT-94 (#135, non fusionnée, tête `1b53571b`) : fusion d'essai sans écrire (`git merge-tree`) avec la branche : **aucun conflit**. Dans la politique fusionnée, la date est identique, la ligne « avis de fin de dossier » de FUT-94 s'ajoute et la ligne « Cartes de clics (heatmaps) » de FUT-181 la suit. Le texte reste cohérent. Seul fichier modifié des deux côtés hors politique : `fut147-non-regression.test.ts`, fusionné sans conflit.

Résultats : voir §7.5.

### 7.5 Résultats de la reprise

- Recette réseau : 13 scénarios, 41 attendus, **tous tenus** sur deux exécutions complètes (`recette.txt`), plus 2 constats `INFO` (file GA4, §7.2).
- Contre-épreuves 5 à 8 (`contre-epreuve.txt`), toutes en échec comme attendu :
  - 5. réouverture sans révocation Google : 1 test FUT-121 et 2 attendus de recette (scénario 12) en échec ;
  - 6. autre onglet à l'ancienne règle : 1 test et 2 attendus (scénario 13) ;
  - 7. webhook et intention remis à `099c205a` : 3 tests (FUT-115 ×2, sources FUT-181) ;
  - 8. `/qna` rallumé par défaut : 2 tests (garde `/qna`, politique).
- TypeScript : 0 erreur. ESLint : 0 problème. Build de production réussi.
- Suite complète (`--test-concurrency=1`, deux exécutions de chaque côté, comptes stables) : `main` (`bab5eb49`) 4 525 tests, 5 échecs ; branche 4 546 tests (+21 : 16 du premier lot, plus 5 nouveaux : FUT-181 ×2, FUT-121 ×2, FUT-115 ×1), **les 5 mêmes échecs** (`fut27-*`, « · » du chemin). fut27 rejoué dans une copie de la branche sans « · » : 32/32.
- Statique seulement : la garde `/qna` et le bloc `metadata` de l'intention de paiement (lecture des sources). La route `/qna` n'a pas été exécutée contre le modèle.
