# FUT-10 : le projet et la relation au bien, recueillis avant l'achat

**Date** : 11/10/2026 · **Branche** : `feat/fut-10-projet-relation-checkout` (depuis `origin/main` f457f467, FUT-26 et FUT-54 inclus)
**Tickets** : FUT-10 (ce lot), FUT-26 (relation à l'adresse, livré), FUT-25 (décisions), FUT-9 (parent), FUT-57 (aperçu, hors lot)

## A. Le parcours réel avant FUT-10

| # | Étape | Code | Ce qui s'y passe | Ce qui manque |
|---|---|---|---|---|
| 1 | Arrivée | `(public)/dossier/page.tsx` | Page publique prérendue. Lit `?code=` au montage. | Rien sur le projet. |
| 2 | Qualification | `DossierQualificationClient.tsx` → `POST /api/dossier/qualification` | Adresse BAN, matière (DPE, parcelle), devis indicatif. Lien « Créer mon dossier » vers `/checkout/dossier?banId&label&insee&code`. | Rien sur le projet. |
| 3 | Checkout | `(public)/checkout/dossier/page.tsx` (serveur, dynamique) | Revalide l'adresse auprès de la BAN, calcule le devis et le code, génère `checkoutAttemptId` à **chaque rendu**. | Ne lit pas `user_project`. |
| 4 | Authentification | même page | Sans compte : redirection `/connexion?next=…`, code compris. | Rien à perdre : aucune réponse n'existe encore. |
| 5 | Compte | même page | `hasPaidTerritory` pour la déduction, e-mail affiché. | Le projet n'est pas chargé. |
| 6 | Prix | `DossierCheckoutPanel.tsx` | Affichage seul ; « J'ai un code » réécrit l'URL (`router.replace`), donc nouveau rendu serveur, donc **nouveau `checkoutAttemptId`**. | |
| 7 | PaymentIntent | `PaymentWrapper.tsx` (`useEffect` au **montage**) → `create-payment-intent` | Le PaymentIntent est créé dès que le composant apparaît. Clé d'idempotence Stripe `dossier_${user}_${attemptId}`. | **Toute question posée à côté du formulaire arriverait après la création.** |
| 8 | `dossier_intents` | `create-payment-intent/route.ts` | Adresse canonique, montant, déduction ; service role ; échec → 500, pas de `clientSecret`. | Ni relation, ni objectif, ni projet. |
| 9 | Paiement | `PaymentForm` (Stripe Elements) | Confirmation, retour `/dossier/merci`. | |
| 10 | Webhook | `stripe/webhook/route.ts` | Relit `dossier_intents` (absente → lève, Stripe rejoue). | |
| 11 | `address_dossiers` | même | `upsert(onConflict: stripe_payment_intent_id, ignoreDuplicates: true)` ; `created` gouverne les effets de bord. | `place_relation` reste `NULL` : la colonne existe (migration 36) mais **aucun écrivain** avant ou pendant l'achat. |
| 12 | Artefact | `planifierArtefact` dans `after()` → `generateDecisionArtifact` | Relit `user_profiles.user_project` **au moment de la génération** ; sans projet, aucun artefact. Lit `place_relation` en base. | Le projet figé est celui de la génération, pas celui que le lecteur a vu ; aucune trace de ce qu'il avait confirmé. |
| 13 | Première ouverture | `(account)/rapport/page.tsx` → `DossierAvecLogement` | Artefact servi s'il existe ; sinon assemblage vivant et rattrapage. Sans projet : en-tête « invite », pas de verdict. | Aucune surface ne permet de déclarer la relation (la route `PATCH /api/dossier/relation` existe sans écran). |

### Où l'information se perd ou arrive trop tard

1. **Jamais demandée.** Un acheteur peut payer sans projet et sans relation : c'est le défaut constaté (dossiers payés sans projet, 16/09/2026).
2. **Trop tard par construction.** `PaymentWrapper` crée l'intention au montage : la collecte doit précéder son montage, pas l'accompagner.
3. **Une seule information pour deux.** `place_relation` ne dit que le lien (« j'y habite ») ; l'intention vient du projet global. Le locataire qui achète son logement reçoit la voix d'un habitant (limite documentée par le test FUT-26 « 9 bis »).
4. **Le projet dérive.** Le projet lu à la génération peut différer de celui que le lecteur avait sous les yeux en payant ; rien ne permet de le savoir.
5. **Le changement après coup est silencieux.** Modifier la relation ne signalait rien sur un dossier figé.

### Points techniques vérifiés

- **Retour après connexion** : la redirection se fait avant tout rendu ; les questions sont posées après, sur la page de paiement. Rien n'est perdu.
- **Code promotionnel** : `router.replace` garde le composant client monté, donc les réponses survivent à l'application d'un code. Le nouveau `checkoutAttemptId` produit un nouveau PaymentIntent (comportement existant, voulu).
- **Tentatives répétées / idempotence** : revenir aux questions démonte le formulaire ; repasser au paiement renvoie la même clé d'idempotence avec les mêmes paramètres Stripe (la personnalisation n'y figure pas), donc Stripe rend **le même PaymentIntent**. Seule la ligne `dossier_intents` est mise à jour (`upsert` sur l'identifiant du PaymentIntent). Aucun PaymentIntent superflu.
- **Rechargement / retour arrière** : un rechargement crée une tentative neuve (comportement existant). Les deux réponses fermées sont gardées en `sessionStorage` (par adresse, jamais le texte libre) ; le projet, lui, est déjà enregistré au compte.
- **Projet modifié pendant un checkout initialisé** : voir C.3.

## B. Le contrat métier

### Trois informations, trois places

| Information | Question posée | Stockage | Portée |
|---|---|---|---|
| **Projet durable** | « Qu'est-ce qui compte le plus pour vous ? » | `user_profiles.user_project` (inchangé, seule source) | Tous les lieux |
| **Relation au bien** | « Quel est votre lien actuel avec ce bien ? » | `address_dossiers.place_relation` (FUT-26) | Ce bien |
| **Objectif de cette analyse** | « Pourquoi examinez-vous ce logement ? » | `address_dossiers.place_objective` (nouveau) | Ce bien |

**Objectif** (`AddressObjective`) : `buy` (l'acheter), `rent` (le louer), `understand` (mieux connaître le logement où je vis), `other` (une autre raison), `NULL` (non dit).

- `other` existe parce qu'il dit quelque chose : la personne n'est **ni** en train d'acheter **ni** de louer ce bien. Il neutralise l'intention globale pour ce bien (un bailleur qui examine son bien loué, avec un projet d'achat ailleurs, ne reçoit pas une liste d'achat).
- `understand` porte sa propre déclaration (« le logement où je vis ») : il donne la voix d'habitant sans écrire de relation. La relation n'est enregistrée que si la personne la coche.
- Ce n'est **pas** une copie de `intent` : rien n'est écrit dans le projet, et la valeur ne vaut que pour ce dossier.

### Priorité (du plus spécifique au plus général)

À l'adresse, quand un objectif est déclaré, il décide ; sinon l'ordre FUT-26 s'applique, inchangé.

| Objectif | Relation | Voix | Gestes |
|---|---|---|---|
| `buy` | toute | engagement | achat |
| `rent` | toute | engagement | location |
| `understand` | `lives_here` ou inconnue | habitant | reside |
| `understand` | `studying` (contradictoire) | neutre | neutre |
| `other` | `lives_here` | habitant | reside |
| `other` | autre | neutre | neutre |
| `NULL` | — | ordre FUT-26 : `lives_here` > intention globale > résidence communale > envisage confirmé / `studying` > neutre | idem |

Le locataire acheteur garde `lives_here` **et** reçoit les contrôles d'achat. L'habitant qui veut acheter ailleurs déclare `understand` pour son logement : voix d'habitant, pas de liste d'achat.

### Sans réponse

Permis, et dit. Rien n'est déduit du silence : ni relation, ni objectif, ni préférence, ni condition. Si aucun projet n'existe, l'écran de paiement le dit avant de payer : le dossier décrit le logement et son territoire, il ne pourra pas juger s'il correspond aux priorités. Après l'achat, l'en-tête existant invite à décrire le projet ; aucun verdict n'est affiché sans projet (inchangé).

### Conditions sans compromis (FUT-25)

Le checkout n'en crée aucune et n'en propose aucune : l'écriture générique du projet ignore `conditions` (`normalizeUserProjectInput`), et la confirmation reste dans « Votre projet ». Le silence ne vaut jamais confirmation.

## C. Les contrats techniques

### C.1 Persistance avant Stripe

`create-payment-intent` reçoit `dossierContext = { relation, objectif, projetVu }` et le valide strictement (`lireContexteCheckout`) : une valeur hors liste répond 400, sans PaymentIntent. Puis, dans le même `upsert` que l'adresse, `dossier_intents` reçoit :

- `place_relation`, `place_objective` ;
- `place_context_declared_at` : l'horloge du serveur au moment de l'enregistrement ;
- `project_snapshot` : le projet **relu en base** (jamais reçu du navigateur).

Rien de tout cela ne part dans les métadonnées Stripe (test sur la source). Échec d'écriture : 500, aucun `clientSecret`, aucun formulaire.

### C.2 Au webhook

Le même `upsert(ignoreDuplicates)` qui crée `address_dossiers` y recopie relation et objectif, avec leur date de déclaration (celle de `dossier_intents`). Un rejeu ne réécrit rien ; deux achats à la même adresse ont deux intentions, donc deux contextes. Le prix ne dépend d'aucune réponse.

### C.3 La course du projet

**Décision : snapshot de livraison, vérifié à la confirmation.**

1. Le navigateur envoie l'`updatedAt` du projet qu'il a affiché (`projetVu`, ou `null` s'il n'en a montré aucun).
2. Le serveur relit le projet canonique ; si son `updatedAt` diffère, il refuse (409) : le lecteur ne confirme jamais un projet qu'il n'a pas vu.
3. Le projet relu est copié dans `dossier_intents.project_snapshot`.
4. Le webhook génère l'artefact avec **ce** snapshot. L'artefact le fige déjà dans `projectSnapshot` (convention inchangée).
5. Si le projet a changé entre-temps, le bandeau existant « Votre projet a changé depuis cette analyse » apparaît (`projetAChangeMateriellement`), avec la mise à jour explicite.

Ce snapshot n'est pas une seconde source : personne ne l'édite, aucun écran ne le lit, il ne sert qu'à reproduire la lecture vendue.

**Corrigé le 12/10 (voir E.1)** : la version initiale relisait le projet du compte quand le snapshot était vide, ce qui confondait « intention antérieure » et « le lecteur a continué sans projet ». `project_state` distingue désormais les trois cas.

Alternatives écartées : l'empreinte seule (on saurait que le projet a changé, sans pouvoir reproduire celui confirmé) ; la référence de version (le projet n'a pas d'historique, `updatedAt` ne désigne rien qu'on puisse relire).

### C.4 Après l'achat

Option retenue : **la modification est enregistrée, la version vendue reste, l'écart est signalé, la mise à jour se demande.**

- L'artefact fige le contexte du bien qu'il a lu (`contexteDuBien`, optionnel : les artefacts antérieurs n'en ont pas et ne signalent rien).
- `contexteAChangeMateriellement` compare la voix et les gestes que donneraient l'ancien et le nouveau contexte : un changement sans effet (par exemple `studying` → inconnu avec un projet d'achat) ne dérange pas le lecteur.
- Le bandeau existant (`AnalyseAncienProjet`, raison « lien ») propose « Mettre à jour l'analyse » : `POST /api/dossier/actualiser`, version n+1, l'ancienne reste en base. `claimArtifactSlot` empêche les générations en rafale.
- Aucune génération n'est déclenchée par la modification elle-même.

La déclaration se fait depuis le hub (« Ce bien »), par `PATCH /api/dossier/relation` étendu à l'objectif (patch partiel).

### C.5 Confidentialité et rétention

- `dossier_intents` reste réservée au service role (aucune policy).
- Aucun texte libre dans PostHog : l'événement de checkout ne porte que des booléens (réponse donnée ou non).
- Aucun détail de projet dans les journaux.
- Rétention : voir E.4 (migration 38, fonction de purge idempotente).

### C.6 Migration 37 et ordre d'application (complété en E.5)

`supabase/37_contexte_checkout_dossier.sql` (additive, colonnes nullables, aucune ligne existante touchée) et son retour arrière `37_contexte_checkout_dossier_down.sql`.

**La migration doit être appliquée AVANT le déploiement du code** : `create-payment-intent` écrit les nouvelles colonnes, et une base sans elles ferait échouer l'écriture de l'intention, donc refuser tout paiement de dossier (comportement voulu : on ne vend pas un dossier dont le contexte serait perdu). Non appliquée en production dans ce lot.

## D. Ce qui a été vérifié, et ce qui ne l'a pas été

### Tests automatiques

| Vérification | Résultat |
|---|---|
| `node --test src/lib/fut10-contexte-checkout.test.ts` (nouveau) | 34 / 34 |
| `node --test src/lib/fut26-relation-au-lieu.test.ts` (3 attentes mises à jour : la lecture porte l'objectif) | 23 / 23 |
| Suite complète (194 fichiers de test, au 11/10) | 2 436 / 2 436 |
| `tsc --noEmit` | aucune erreur |
| ESLint sur les fichiers modifiés | aucune erreur (le dépôt en compte 42 ailleurs, inchangés) |
| `next build --webpack` | réussi |

Ce que couvre le nouveau fichier : modèle (habitant, locataire acheteur, acheteur ailleurs, deux adresses, inconnus, intention globale contre objectif, réponses contradictoires, suggestion qui ne coche rien) ; projet (création sans intention déduite ni condition, conservation, modification, conflit) ; validation et colonnes avant Stripe ; câblage de la route de paiement et du webhook (sur la source) ; chaîne paiement → dossier sur une base simulée (création, réponses corrigées, rejeu, abandon, deux achats à la même adresse, intention ancienne, projet modifié avant génération) ; artefact et signalement ; sécurité de la route (patch partiel, autre compte, révoqué, valeurs invalides) ; données anciennes ; migration.

**Limites des tests** : aucun environnement Supabase de test n'existe. La RLS, les contraintes `check` de la migration 37 et l'upsert réel ne sont pas exécutés : ils sont simulés ou lus sur la source. Aucun paiement n'a été tenté, ni réel ni en mode test.

### Contrôles visuels

Faits sur une page de maquette temporaire (retirée, jamais commitée), sans session : la route de paiement répond donc « Connexion requise » avant tout appel à Stripe, ce qui permet aussi de voir l'état d'erreur. Captures anonymisées (adresse fictive) dans `docs/audits/2026-10-11-fut10-captures/`.

- 1280, 390 et 360 px : aucun débordement horizontal. À 360 px, le « ? » des questions partait seul à la ligne : corrigé par une espace insécable.
- Aucune demande de PaymentIntent tant que l'étape des questions est affichée ; les réponses partent avec la première demande.
- Corriger ses réponses : la réponse précédente est conservée, la même clé d'idempotence est renvoyée, la dernière réponse est transmise.
- Rechargement : les deux réponses fermées reviennent (`sessionStorage`), jamais le texte libre.
- Clavier : tabulation par groupe (Tab entre, flèches choisissent, Espace coche), focus visible ; les deux boutons d'action sont atteignables.
- En développement, React rejoue les effets : deux demandes identiques partent par montage (même clé, donc même PaymentIntent côté Stripe). Une seule part en production.
- **Thème clair : non vérifiable sur ce parcours.** La page de paiement (comme `/dossier`) pose `bg-canvas`, figé à `#060812` quel que soit le thème. Défaut antérieur à FUT-10, laissé à FUT-87.

### Décisions restant ouvertes

1. **Vocabulaire d'un projet créé au checkout** : posture « J'étudie ce lieu » par défaut (comme « Je cherche où vivre » pour la reprise d'une recherche). Un habitant qui crée son projet ici lira « votre projet » plutôt que « ce que vous avez demandé » jusqu'à ce qu'il change son objectif dans « Votre projet ».
2. **Gestes d'achat pour un occupant** : le locataire acheteur reçoit la table `achat` telle quelle, dont un détail dit « dès la première visite ». Une variante « achat par l'occupant » demanderait de réécrire des textes approuvés : hors lot.
3. **Purge** : traitée le 12/10 par la migration 38 (voir E.4), planification à décider.
4. **Bloc « Ce bien »** : posé sur le hub, dans le style existant ; à habiller avec la direction artistique de FUT-87.
5. **Événement PostHog** `address_checkout_context_set` : les contrôles visuels en local en ont émis quelques-uns vers le projet PostHog configuré dans `.env.local`.


## E. Revue du 11-12/10/2026 : finalisation

Branche remise à jour avec `main` (FUT-87, FUT-91) par une fusion sans conflit ; les trois commits FUT-10 sont conservés.

### E.1 Correction A : un projet absent reste absent

**Cause.** `project_snapshot = null` voulait dire deux choses : intention antérieure à FUT-10, ou lecteur qui a payé sans projet. Le webhook relisait `user_profiles.user_project` dans les deux cas. Un projet créé dans un autre onglet entre le paiement et le webhook entrait donc dans un dossier présenté au lecteur comme factuel.

**Correction.** `dossier_intents.project_state` :

| Valeur | Sens | Snapshot (contrainte SQL) | Livraison (`projetPourLivraison`) |
|---|---|---|---|
| `confirmed` | un projet a été montré et gardé | obligatoire | ce snapshot, jamais le compte |
| `absent` | aucun projet, le lecteur a continué | interdit | aucun projet, aucun artefact |
| `NULL` | intention antérieure, ou client sans contexte | — | relecture du compte (historique) |

Un snapshot `confirmed` illisible (corrompu ou purgé) vaut `absent`, jamais une relecture. Dans le webhook, l'absence se décide avant `after()` : aucune requête ne lit le projet du compte.

**Décision à valider par le porteur.** Après un achat sans projet, le dossier livré est factuel (aucun artefact). Si le lecteur décrit ensuite son projet, comme l'écran le lui propose, le dossier se lit avec lui et une version datée de ce moment est figée par le rattrapage existant. C'est un geste postérieur et daté, jamais confondu avec la vente. Si le porteur préfère qu'un dossier acheté sans projet le reste jusqu'à une mise à jour explicite, il faudra conditionner le rattrapage de `DossierAvecLogement` (fichier actuellement modifié par FUT-92, donc non touché ici).

### E.2 Correction B : le contexte se verrouille à la confirmation

**Cause.** La route de paiement réutilise le PaymentIntent (même clé d'idempotence) et réécrivait `dossier_intents` sans condition. Une requête partie d'un autre onglet après la confirmation pouvait remplacer les réponses et le snapshot d'une vente engagée. Contrôler le statut Stripe avant d'écrire n'aurait pas suffi : la réponse idempotente de Stripe rejoue l'objet du jour de la création (statut compris), et une lecture suivie d'une écriture laisse une fenêtre.

**Invariant.** Une fois la confirmation engagée, relation, objectif, état et snapshot du projet ne changent plus.

**Mécanisme** (`src/lib/verrou-intention-dossier.ts`) :
1. Colonne `context_locked_at`, posée par **une** instruction conditionnelle (`update … where context_locked_at is null`).
2. Toute écriture de contexte porte la même condition dans la requête. Postgres réévalue la condition après avoir pris le verrou de ligne : verrou et écriture s'ordonnent, aucune écriture ne passe après le verrou.
3. Le navigateur verrouille **juste avant** `stripe.confirmPayment` (`POST /api/dossier/intention/verrouiller`) ; en cas d'échec, la confirmation n'est pas envoyée.
4. Le webhook verrouille **avant** de lire l'intention (filet pour un client qui aurait sauté l'étape 3) ; un rejeu relit la même ligne.
5. La route de paiement, avant de mettre à jour une intention existante, interroge Stripe (`retrieve`) : statut hors `requires_payment_method` / `requires_confirmation`, elle verrouille et refuse (409 `CONTEXT_LOCKED`), sans rendre de formulaire.

**Scénarios de concurrence**

| Scénario | Résultat |
|---|---|
| Réponses corrigées avant de payer | même PaymentIntent, intention mise à jour |
| Correction envoyée après le verrou (autre onglet) | rien n'est écrit, 409, pas de formulaire |
| Confirmation engagée sans verrou (client modifié), puis correction | `retrieve` voit le statut engagé : verrou posé, rien n'est écrit |
| Correction et verrou simultanés | l'une passe entière avant l'autre ; jamais d'écriture après le verrou |
| Webhook rejoué | verrou déjà posé, même ligne lue, `ignoreDuplicates` : aucun second dossier, aucune réécriture |
| Carte refusée après le verrou, nouvelle carte | même intention, mêmes réponses (verrouillées) |
| Carte refusée, le lecteur veut changer ses réponses | 409 ; un rechargement ouvre une tentative neuve (nouveau PaymentIntent) |
| Code promotionnel appliqué | nouvelle tentative (comportement existant), nouvelle intention non verrouillée |

**Fenêtre résiduelle.** Un client qui ne passe pas par notre formulaire, confirme lui-même puis envoie une correction entre la confirmation et le `retrieve` peut encore modifier ses propres réponses avant que le webhook ne verrouille. Seul le titulaire du compte peut le faire, sur sa propre vente.

### E.3 Passe éditoriale

- Le projet passe en premier. Sans projet : « Un lieu ne se résume pas à ses données. », une phrase sur ce que les priorités changent, le champ, puis deux exemples illustratifs (« Vivre sans voiture », « Rester au frais l'été »), sans chiffre, sans adresse, sans verdict. Avec projet : « Votre projet est déjà renseigné. », puis ce que futur•e en connaît (intention, priorités, conditions **confirmées** seulement), avec « Garder ce projet » choisi par défaut.
- Puis « Et pour ce logement » : objectif et lien, deux questions distinctes. Les choix de l'objectif passent à la deuxième personne.
- Boutons : « Continuer sans préciser davantage » quand un projet existe ; « Continuer sans personnaliser mon dossier » sinon, avec sa conséquence en une ligne.
- Récapitulatif : « Votre dossier prendra en compte » (projet, objectif, situation), puis ce que futur•e en fera, sans promesse : rapprocher des informations documentées, et signaler une priorité non mesurée.
- Les erreurs d'enregistrement du projet disent quoi faire selon qu'un projet existe déjà.

### E.4 Rétention (migration 38)

`public.purger_dossier_intents(p_maintenant, p_delai = 30 jours)`, réservée au service role, idempotente, rend ce qu'elle a fait :

| État | Traitement passé le délai |
|---|---|
| Abandonnée (pas de dossier, pas de verrou) | supprimée |
| Paiement engagé sans dossier (verrou posé) | supprimée : Stripe ne rejoue un webhook que 3 jours |
| Plus jeune que le délai | intacte |
| Dossier livré | ligne gardée, `project_snapshot` remplacé par un marqueur sans donnée |

Un délai inférieur à 7 jours est refusé. Planification proposée, **non appliquée** : `select cron.schedule('purge-dossier-intents', '17 3 * * *', $$select * from public.purger_dossier_intents()$$);`

### E.5 Migrations et déploiement

Ordre, sur une base de test puis en production, **après revue et avant le déploiement du code** :
1. `supabase/37_contexte_checkout_dossier.sql` (colonnes, contraintes) ;
2. `supabase/38_purge_dossier_intents.sql` (fonction) ;
3. déployer le code ;
4. plus tard, si souhaité, planifier la purge.

Retours arrière : `38_…_down.sql` puis `37_…_down.sql` (les contextes déclarés sont perdus). Sans la migration 37, la route de paiement échoue à écrire l'intention et ne rend aucun formulaire : aucun dossier ne peut être vendu avec un contexte perdu.

### E.6 Ce qui a été réellement exécuté

| Vérification | Résultat |
|---|---|
| `fut10-revue.test.ts` (bugs A et B, 200 entrelacements concurrents simulés, textes, FUT-54) | 22 / 22 |
| `fut10-contexte-checkout.test.ts` | 34 / 34 |
| Suite complète | 2 484 / 2 484 |
| Intégration Postgres (PGlite 0.5.8, vraies migrations 26/36/37/38) | 9 / 9 |
| TypeScript, ESLint (fichiers touchés), `next build --webpack` | sans erreur |
| Intégration Stripe en mode test (`scripts/integration/fut10-stripe-test.mjs`) | **non exécutée** : la clé de test du CLI Stripe a expiré le 05/09/2026 |
| Webhook réel (`stripe listen`), base Supabase de test | **non exécutés** : aucun environnement de test disponible |

L'intégration Postgres a trouvé un vrai défaut, corrigé : un pilote Postgres rend les dates comme objets `Date`, et la date de déclaration recopiée au dossier était alors perdue (PostgREST rend des chaînes, la production n'était pas touchée).

Elle ne couvre ni PostgREST / supabase-js, ni la vraie concurrence (une seule connexion), ni le schéma complet de production (`auth.users` et `address_dossiers` minimaux).

### E.7 Contrôles visuels

Captures « avant » : `docs/audits/2026-10-11-fut10-captures/`. Captures « après » : `docs/audits/2026-10-12-fut10-captures-apres/`, sur les vrais composants montés dans une maquette temporaire retirée. Parseur, profil et paiement étaient interceptés : aucun appel au modèle, aucun appel à Stripe.

- 1280, 390, 360 px : aucun débordement.
- Aucun PaymentIntent avant la fin des questions ou le choix de passer.
- État de chargement (« Enregistrement de votre projet… ») et erreur d'enregistrement : aucun PaymentIntent demandé.
- Clavier : prix → projet → objectif → lien → boutons, flèches dans chaque groupe, focus visible.
- Thème clair toujours non vérifiable sur cette page (`bg-canvas` figé), défaut antérieur.

### E.8 Risques résiduels et prérequis

1. **Mode « Le relevé » (`DECISION_RELEVE`, éteint par défaut).** `DossierDecisionReleve` ne reçoit pas encore le signal « lien modifié » : avec le drapeau allumé, une relation changée après l'achat ne serait pas signalée. Le fichier est en cours de modification par FUT-92 : à brancher à l'intégration (une prop, et la raison `"lien"` déjà gérée par `AnalyseAncienProjet`).
2. Intégration Stripe et Supabase réelles non exécutées : à faire sur des environnements de test avant la mise en production (`! stripe login`, puis le script ; projet Supabase de test avec les migrations 37 et 38).
3. Le verrou ajoute un appel réseau avant la confirmation : s'il échoue, le paiement est bloqué (message affiché, carte non débitée).
4. Décision E.1 (personnalisation d'un dossier acheté sans projet, après coup) à confirmer.

## F. Dernière revue (12/10/2026) : fidélité de livraison, réconciliation, rétention

### F.1 Les chemins qui produisent un artefact (audit)

| Chemin | Avant cette revue | Après |
|---|---|---|
| Webhook (`planifierArtefact`) | projet confirmé ; relation relue sur `address_dossiers` (modifiable) | contexte d'achat complet (projet, relation, objectif) relu dans l'intention verrouillée, relation imposée |
| Rattrapage `/rapport` (`DossierAvecLogement`) | **projet ET relation du jour** pour une première version | première livraison : contexte de l'achat ; jamais de figement sans contexte établi |
| Succession après dépôt d'un DPE | projet du jour | contexte de la version servie (`projectSnapshot`, `contexteDuBien`) |
| `POST /api/dossier/actualiser` | projet du jour, toujours | avec une version prête : contexte du jour (mise à jour) ; sans version prête : contexte de l'achat, sauf achat sans projet (lecture personnalisée demandée) |
| Rattrapage du territoire (`/rapport`, scope `commune`) | projet du jour | inchangé : produit du territoire, hors du contrat d'achat d'une adresse |

**Cause du mauvais projet** : `DossierAvecLogement` appelait `generateDecisionArtifact(sb, userId, project, …)` avec le projet chargé par la page (`user_profiles.user_project`), et le générateur relisait `address_dossiers.place_relation`. Après un échec au webhook, la version vendue se figeait avec ce que le compte contenait au moment de la réouverture.

### F.2 Le contrat de livraison (`src/lib/contexte-livraison.ts`)

| Opération | Quand | Contexte |
|---|---|---|
| Première livraison | aucune version `ready` pour ce dossier (webhook, rattrapage, reprise après échec, clic) | celui de l'achat (`dossier_intents`) |
| Succession automatique | une version est servie et un DPE la périme | celui de la version servie |
| Mise à jour explicite | une version est servie et le lecteur clique | celui du jour |

Données achetées (`dossier_intents`, verrouillées) et données modifiables (`address_dossiers.place_relation` / `place_objective`) restent séparées. On retrouve l'intention par `address_dossiers.stripe_payment_intent_id` (`src/lib/server/contexte-achat.ts`, service role, filtré par compte). Aucune seconde source éditable du projet.

**Reprise d'une première génération échouée** : le mécanisme existant réserve le numéro suivant (v1 `failed`, v2 `ready`). La v1 échouée reste en base et la v2 suit le contexte de l'achat. Trois tentatives automatiques au plus ; au-delà, la page sert une lecture provisoire.

**Lecture provisoire** : tant qu'aucune version n'est figée, la page assemble la lecture avec le contexte de l'achat. Le socle communal est reconstruit avec ce projet s'il diffère du projet du jour. Elle n'est pas datée et porte l'avis : « Lecture provisoire, établie avec le projet et les réponses confirmés à votre achat. Sa version datée n'a pas encore pu être figée ; elle le sera avec ces mêmes informations. » Si le contexte d'achat est illisible (panne), la lecture utilise le contexte du jour, le dit, et rien n'est figé.

### F.3 Achat sans projet

- À l'achat : aucun artefact (rien d'inventé).
- Le compte reçoit ensuite un projet : `/rapport` ne l'assemble pas pour ce bien. Il affiche `LectureFactuelleDuBien` (« Ce dossier a été ouvert sans projet. », ce que contient le dossier, ce qu'il ne fait pas), avant même le `Suspense`, pour que le repli communal personnalisé n'apparaisse pas.
- « Lire ce bien avec mon projet » → `/api/dossier/actualiser` → une première version, datée du jour, avec le projet et la relation du jour.
- Ensuite, au-dessus du verdict : « Ce bien a été acheté sans projet, le … Cette lecture personnalisée a été demandée ensuite, avec votre projet. »
- Aucun artefact factuel historique n'est prétendu : il n'en a jamais existé.

### F.4 Purge (migration 38 révisée)

| État (`etat_livraison_intention`) | Traitement |
|---|---|
| `abandonnee_ou_en_cours` (aucun dossier, aucun verrou) | supprimée passé 30 jours |
| `paiement_engage_sans_dossier` (verrou, aucun dossier) | **jamais supprimée** ; signalée passé 3 jours (`intentions_a_reconcilier`) |
| `livraison_inachevee` (dossier, projet confirmé, aucune version `ready` pour CE dossier) | **snapshot gardé** ; signalée passé 3 jours |
| `livree` (version `ready` pour ce dossier, dossier révoqué, achat sans projet, intention historique) | ligne gardée ; snapshot remplacé par un marqueur passé 30 jours |

**Moment où la copie du projet peut être effacée** : quand une version `ready` existe pour ce dossier. Elle porte le projet livré (`projectSnapshot`) et le contexte du bien (`contexteDuBien`). La lecture vendue est alors reproductible sans l'intention, et les successions automatiques partent de cette version, jamais de l'intention.

**Réconciliation** : pour chaque ligne de `intentions_a_reconcilier()`, vérifier le statut du PaymentIntent dans Stripe. S'il est `succeeded`, renvoyer l'événement (`stripe events resend`), le webhook crée le dossier. S'il est échoué ou annulé, la ligne peut être supprimée à la main.

**Limite connue** : une intention jamais verrouillée est supprimée après 30 jours. Un paiement confirmé hors de notre formulaire, dont le webhook n'aurait jamais tourné (Stripe abandonne au bout de 3 jours), perdrait alors son intention.

### F.5 Le relevé (FUT-91) et FUT-92

FUT-92 a été fusionné dans `main` pendant cette revue (9cd6a34c), et la branche FUT-10 l'a intégré sans conflit. Le terminal B n'avait aucune modification en cours. L'adaptation est donc faite à sa vraie place : `DossierDecisionReleve` reçoit `contexteAChange` et applique la même priorité qu'en présentation classique (projet > lien > voisinage). Le bloc provisoire posé au-dessus du relevé est retiré. Le test FUT-91 qui figeait l'ancienne condition du bandeau évolue en conséquence. La navigation sticky et les animations ne sont pas touchées.

### F.6 Tests d'intégration : ce qui existe, ce qui a tourné

| Script | Rôle | Exécuté |
|---|---|---|
| `scripts/integration/garde-environnement.mjs` | refuse tout environnement non isolé (catégories seulement, aucun secret) | oui : refuse l'environnement du poste (clés Stripe et projet Supabase de production, vraie clé Resend, PostHog réel, rédaction allumée) |
| `scripts/integration/schema-de-test.mjs` | assemble 01 → 38 pour une base vierge (deux adaptations de test dites) | oui, dans PGlite |
| `scripts/integration/fut10-postgres.mjs` | vraies migrations, contraintes, verrou, purge, droits, schéma complet | **oui, 10 / 10** (PGlite, une connexion) |
| `scripts/integration/fut10-supabase-integration.mjs` | supabase-js / PostgREST, deux connexions, politiques, upsert du webhook | **non** : Docker et le CLI Supabase absents |
| `scripts/integration/fut10-stripe-test.mjs` | API Stripe en mode test, idempotence, statut réel | **non** : clé de test du CLI expirée (05/09/2026) |
| `scripts/integration/fut10-bout-en-bout.mjs` | parcours complet, webhook signé, rejeu, refus après confirmation | **non** : prérequis ci-dessus |

**Prérequis manquants** : Docker et le CLI Supabase (`supabase start`) ; une clé Stripe de test (`! stripe login`) ; un fichier d'environnement de test conforme au garde-fou ; `stripe listen` pour le secret de webhook. Procédure détaillée en tête de chaque script.

### F.7 Mise en production (après revue)

1. Sur un environnement de test : schéma de test, puis `fut10-supabase-integration.mjs`, `fut10-stripe-test.mjs`, `fut10-bout-en-bout.mjs`.
2. En production, dans l'ordre : `37_contexte_checkout_dossier.sql`, `38_purge_dossier_intents.sql`, **puis** déploiement du code.
3. Vérifier `select * from public.intentions_a_reconcilier();` (doit être vide au départ).
4. Plus tard, sur décision : planifier la purge (pg_cron, commande en tête de la migration 38).

Retours arrière : déployer l'ancien code, puis `38_…_down.sql`, puis `37_…_down.sql` (les contextes déclarés sont perdus).

## G. Dernières corrections (12/10/2026) et validation sur le projet Supabase de test

### G.1 Correction A : une intention d'achat manquante n'est jamais un achat historique

Constat vérifié dans l'historique : depuis le 30/07/2026 (commit 472a5a7a, qui crée à la fois `dossier_intents` et la création des dossiers par le webhook), **le seul écrivain** de `address_dossiers.stripe_payment_intent_id` est le webhook. Il lève une erreur quand l'intention manque. Les dossiers ouverts par l'administration ont un PaymentIntent nul.

| Situation | Contexte d'achat | Effet |
|---|---|---|
| Dossier sans PaymentIntent (administration) | `historique / sans_paiement` | contexte du jour (compatibilité) |
| Intention présente, sans `project_state` | `historique / intention_anterieure` (prouvé) | contexte du jour (compatibilité) |
| PaymentIntent présent, intention introuvable | `indisponible / intention_introuvable` | **aucune version figée**, même sur un clic ; anomalie journalisée et listée par `dossiers_sans_intention()` |
| Projet confirmé effacé par la purge | `indisponible / projet_efface` | jamais confondu avec un achat sans projet ; la purge n'agit qu'après une version prête, dont les successions partent |
| Projet confirmé illisible | `indisponible / projet_illisible` | aucune version figée |
| Lecture impossible (panne) | `indisponible / lecture_impossible` | idem |

### G.2 Correction B : la lecture provisoire incertaine

Quand le contexte d'achat est indisponible, la lecture assemblée avec le contexte du jour porte : « La version de votre dossier n'a pas encore pu être établie, et nous ne pouvons pas confirmer pour l'instant les informations retenues lors de votre achat. La lecture affichée est provisoire : elle ne remplace pas votre analyse achetée. » Rien n'est figé, et rien n'est promis sur la version à venir. Les autres cas sont inchangés : contexte acheté retrouvé (lecture provisoire avec lui), achat sans projet (lecture factuelle), historique prouvé.

### G.3 Correction C : un test de bout en bout qui ne peut plus réussir à tort

`fut10-bout-en-bout.mjs --parcours nominal` exige un artefact `ready` avec le projet, la relation et l'objectif de l'achat ; un `failed` le fait échouer (sortie 1). `--parcours degrade` exige l'échec de la v1, aucune version tenue pour livrée, le contexte conservé, puis un rattrapage prêt avec le projet de l'achat alors que le compte porte un autre projet.

Composants **réels** : Stripe en mode test (PaymentIntent, confirmation, webhook signé par `stripe listen`), le projet Supabase de test (authentification, tables, politiques), l'application locale (routes, moteur, sources publiques). **Remplacés** : la carte (`4242…`, mode test) ; dans le parcours dégradé, l'échec de la première génération, injecté par `FUT10_TEST_ECHEC_PREMIERE_GENERATION=1`. Ce point d'injection est inactif sans cette variable, en production Next (`NODE_ENV`) et en production Vercel (`VERCEL_ENV`).

**Rejeu** : `stripe events resend` vise les endpoints enregistrés dans le tableau de bord, pas forcément l'écoute éphémère de `stripe listen`. Le script rejoue donc lui-même le **vrai** événement (relu dans l'API Stripe), signé avec le secret du webhook, vers l'application.

**Sorties** : 0 seulement si tout a été vérifié, 1 sur une assertion fausse, 2 si l'environnement n'est pas isolé, 3 si un prérequis manque (PGlite). Aucun script ne donne plus de faux feu vert.

### G.4 Purge : une vente confirmée hors du formulaire peut-elle perdre son intention ?

Une intention non verrouillée et sans dossier est supprimée au bout de 30 jours. Ce qui l'empêche de concerner une vente :
- notre formulaire verrouille **avant** de confirmer, et ne confirme pas si le verrou échoue ;
- le webhook verrouille dès son arrivée, avant toute autre opération : une vente dont le webhook a seulement atteint le serveur est verrouillée, donc jamais supprimée (elle passe en `paiement_engage_sans_dossier`, signalée).

Ce qui ne l'empêche pas : un paiement confirmé **hors de notre formulaire** (appel direct à Stripe avec le secret client) dont le webhook n'aurait **jamais** atteint le serveur. Stripe abandonne au bout de 3 jours en production, et personne n'aurait réconcilié pendant 30 jours. L'intention serait supprimée, la vente resterait encaissée sans dossier ni adresse.

**Proposition, avant toute activation du cron** : une étape de réconciliation Stripe préalable. Pour chaque intention candidate à la suppression, relire le PaymentIntent dans Stripe ; supprimer seulement si son statut est `requires_payment_method` ou `canceled` (ou s'il est introuvable), sinon rejouer l'événement. SQL ne peut pas interroger Stripe : cette étape vit dans un script d'administration, à écrire au moment où la purge sera planifiée. **Le cron reste désactivé.**

### G.5 Projet Supabase de test et environnement isolé

- Projet de test : `future-e-test` (`atvknbgahcuovcyqapfx`). Production interdite en dur dans le garde-fou (`xkewgsccadjmondzmjxj`), en plus des projets trouvés dans les `.env` de production du poste.
- `.env.fut10-test` (ignoré par Git, droits 600) : redéclare **chaque** variable de `.env.local`, au besoin vide. Sans cela, `next dev` reprendrait sa valeur de production. Le garde-fou le vérifie.
- Le garde-fou contrôle aussi qu'une clé Supabase au format JWT appartient bien au projet déclaré, et que l'URL Postgres désigne le projet de test.
- `appliquer-schema-test.mjs` : sans `--confirmer <référence>`, il affiche le plan et ne fait rien ; il refuse une base qui n'est pas vierge.
- `fut10-supabase-local.mjs` est renommé `fut10-supabase-integration.mjs` (projet de test ou instance locale).

## H. Validation réelle (12/10/2026) : Stripe en mode test et projet Supabase `future-e-test`

Environnement : `.env.fut10-test` (ignoré par Git), garde-fou au vert (13 / 13). Application locale lancée depuis le worktree FUT-10 sur le port 3010, et non 3000 : ce port était occupé par un serveur d'un autre worktree, probablement en configuration de production. Aucun événement ne lui a été relayé. `stripe listen` tournait avec la clé de l'environnement de test : le profil par défaut du CLI vise un autre compte.

| Test | Nature | Résultat |
|---|---|---|
| `appliquer-schema-test.mjs --confirmer` | réel, projet de test | migrations 01 → 38 appliquées ; tables, colonnes, contraintes, fonctions, index, RLS, déclencheurs et droits vérifiés |
| `fut10-supabase-integration.mjs` | réel (supabase-js, PostgREST, deux connexions) | 4 / 4 |
| `fut10-stripe-test.mjs` | réel, Stripe mode test | réussi ; la réponse idempotente rejoue bien `requires_payment_method` après confirmation, d'où le `retrieve` |
| `fut10-bout-en-bout.mjs --parcours nominal` | réel (seule la carte est de test) | 6 / 6 étapes, sortie 0 |
| `fut10-bout-en-bout.mjs --parcours degrade` | réel, avec échec injecté de la v1 | 7 / 7 étapes, sortie 0 |

Preuves relues en base et dans Stripe, indépendamment des scripts :
- PaymentIntent `succeeded`, `livemode: false`, 3 900 centimes encaissés ;
- dossier `lives_here` / `buy`, date de déclaration posée, intention verrouillée, `project_state = confirmed`, projet A ;
- nominal : v1 `ready`, projet figé A, `contexteDuBien = {relation: lives_here, objectif: buy}`, alors que le compte porte B ;
- dégradé : v1 `failed`, v2 `ready` avec A et le même contexte, alors que le compte porte B ; un seul dossier ;
- rejeu du vrai événement, signé : aucun second dossier, aucune régénération.

Défauts trouvés et corrigés pendant la validation :
1. Après l'achat, renvoyer une tentative de paiement faisait une erreur 500 : le montant change (déduction territoire) et Stripe refuse la clé d'idempotence. C'est désormais un 409 `CHECKOUT_STALE`, sans aucune écriture.
2. Supabase hébergé refuse toute écriture dans `auth`, même un `create table if not exists` : le préambule du schéma de test teste l'existence avant.
3. Sans `GEORISQUES_API_TOKEN`, l'application n'interroge pas Géorisques et la première génération échoue, à raison. Le jeton (lecture de données publiques) est renseigné dans l'environnement de test.

Nettoyage : 6 utilisateurs de test supprimés (et leurs lignes par cascade) ; le projet de test est revenu à 0 utilisateur, 0 dossier, 0 intention, 0 artefact. Les objets Stripe de test restent dans le compte de test.
