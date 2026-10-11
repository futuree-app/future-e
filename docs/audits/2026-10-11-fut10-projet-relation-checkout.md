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

Ce snapshot n'est pas une seconde source : personne ne l'édite, aucun écran ne le lit, il ne sert qu'à reproduire la lecture vendue. Absent (intentions antérieures, ou aucun projet confirmé), la génération relit le projet canonique, comme avant.

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
- Rétention : la purge manuelle documentée en migration 26 s'étend à `project_snapshot` (effacé au-delà de 30 jours, y compris pour les intentions payées : l'artefact en porte déjà la copie livrée).

### C.6 Migration 37 et ordre d'application

`supabase/37_contexte_checkout_dossier.sql` (additive, colonnes nullables, aucune ligne existante touchée) et son retour arrière `37_contexte_checkout_dossier_down.sql`.

**La migration doit être appliquée AVANT le déploiement du code** : `create-payment-intent` écrit les nouvelles colonnes, et une base sans elles ferait échouer l'écriture de l'intention, donc refuser tout paiement de dossier (comportement voulu : on ne vend pas un dossier dont le contexte serait perdu). Non appliquée en production dans ce lot.

## D. Ce qui a été vérifié, et ce qui ne l'a pas été

### Tests automatiques

| Vérification | Résultat |
|---|---|
| `node --test src/lib/fut10-contexte-checkout.test.ts` (nouveau) | 34 / 34 |
| `node --test src/lib/fut26-relation-au-lieu.test.ts` (3 attentes mises à jour : la lecture porte l'objectif) | 23 / 23 |
| Suite complète (194 fichiers de test) | 2 436 / 2 436 |
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
3. **Purge** : la rétention reste manuelle (SQL en commentaire des migrations 26 et 37). Une tâche planifiée serait plus sûre.
4. **Bloc « Ce bien »** : posé sur le hub, dans le style existant ; à habiller avec la direction artistique de FUT-87.
5. **Événement PostHog** `address_checkout_context_set` : les contrôles visuels en local en ont émis quelques-uns vers le projet PostHog configuré dans `.env.local`.
