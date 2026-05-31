# Gating territoire / paywall — statut V1

Document de décision. À lire avant de toucher à la chaîne territoire actif / report_grants / Pack Décision.

Dernière mise à jour : 2026-05-31.

## Le modèle en une phrase

La **résidence** (`user_profiles.home_insee_code` / `home_commune`) ne change jamais.
Le **territoire actif de lecture** (`user_profiles.active_insee_code` / `active_commune`) est un overlay : `null` = on lit la résidence, défini = on lit ce territoire (bandeau « revenir à … »).
Résolu partout par `resolveActiveTerritory()` (`src/lib/active-territory.ts`).

## Deux mécanismes d'accès, et lequel fait foi

| Mécanisme | Rôle réel en V1 | Table |
|---|---|---|
| `user_accounts.report_access` (`partial` / `complete`) | **Source de vérité du gating V1.** Décide si le rapport complet s'affiche, via `canAccessCompleteReport()`. Granularité = **compte**, pas territoire. | `user_accounts` |
| `report_grants` (1 ligne par INSEE débloqué) | **Traçabilité uniquement en V1.** Écrit par le webhook Stripe à chaque achat ciblé. N'est lu par aucun chemin de gating aujourd'hui. Prépare le multi-territoires. | `report_grants` |

## Contrôle d'accès territoire-aware (implémenté le 2026-05-31)

Le gating de lecture est désormais territoire-aware, via `resolveReadableTerritory()`
(`src/lib/active-territory.ts`) :

- **résidence** → accès historique au niveau compte (`report_access`), inchangé ;
- **territoire actif ≠ résidence** → rapport affiché **uniquement** s'il existe un
  `report_grant` pour `(user_id, insee)` ;
- **pas de grant** → on n'affiche jamais ce territoire : repli silencieux sur la
  résidence, et sur le hub `/rapport` un bandeau « Le rapport de X n'est pas
  débloqué » avec lien vers `/territoire/[insee]/debloquer`.

Branché sur tous les chemins qui lisaient le territoire actif : hub `/rapport`,
modules `quartier` et `logement`, et les deux mounts AskFuture (sinon l'IA aurait
répondu sur un territoire non débloqué).

`POST /api/ask` reçoit `communeInsee` du client : il vérifie désormais lui-même
que c'est la résidence ou un territoire avec grant, sinon 403. L'API ne peut plus
servir de porte dérobée vers un rapport jamais acheté. (Le comparateur
`/api/comparateur-vie/ask` reste ouvert : c'est l'exploration pré-achat, pas du
contenu gaté.)

`report_access` reste juge des **capacités globales** (dashboard, suivi, foyer) ;
`report_grants` est désormais juge du **rapport par territoire**.

## Ce qui reste temporaire (assumé)

1. **`/api/territoire/activer` ne vérifie toujours aucun droit.** Tout utilisateur
   authentifié peut poser n'importe quel `active_insee_code` : c'est une commodité
   UX (éviter la latence webhook), **plus une faille** depuis que la lecture est
   gatée sur le grant. Poser un overlay sans grant ne donne accès à rien : on
   retombe sur la résidence. Reste à durcir si l'on veut éviter les overlays
   « fantômes » en base, mais ce n'est plus un risque d'accès.
2. **La granularité par module n'existe pas.** Un grant ouvre les six modules du
   territoire, pas une sélection. Cohérent avec le produit V1 (rapport = un tout).

## Ce qui sera probablement migré vers report_grants plus tard

- Le gating devient **territoire-aware** : on autorise la lecture d'un territoire si (a) c'est la résidence, ou (b) il existe un `report_grant` pour `(user, insee)`.
- `report_access` reste pour les capacités globales (dashboard, suivi, foyer) mais cesse d'être seul juge du rapport par territoire.
- Le point de contrôle remonte du **compte** vers le **couple (compte, territoire)**.

## Conséquences pour le futur Pack Décision

Le Pack Décision = acheter plusieurs territoires comparés en une fois. Il **dépend** de cette migration :

- Le Pack écrira plusieurs `report_grants` (`source='pack_decision'`).
- Si le gating reste au niveau compte, le Pack n'a aucun sens commercial : un seul achat `complete` débloquerait déjà tout. **Le Pack Décision n'est monétisable que si le gating lit `report_grants`.**
- Donc : la dette « gating au niveau compte » **doit** être remboursée avant de vendre le Pack. Ce n'est pas optionnel à ce moment-là.

## Pourquoi cette simplification a été choisie

V1 vend un rapport unique (14 € one-shot) sur la résidence ou un territoire exploré. À un rapport par compte, gating compte = gating territoire dans les faits. `report_grants` est posé **maintenant** pour ne pas avoir à migrer le schéma plus tard, mais le branchement en lecture est reporté pour ne pas alourdir la V1.

Le risque de cette simplification est réel et documenté ci-dessous.

## Risque historique (corrigé)

Avant le 2026-05-31, un compte `complete` pouvait consulter un territoire jamais
acheté en posant `active_insee_code` via `/api/territoire/activer` (aucune
vérification de grant). Exploitable, pas seulement théorique. Corrigé par le
contrôle territoire-aware ci-dessus : la lecture est désormais gatée sur le grant,
le repli est silencieux sur la résidence.

## État de la base (2026-05-31)

Migration `supabase/12_init_report_grants.sql` **appliquée en production** (projet
`future·e`, `xkewgsccadjmondzmjxj`) : table `report_grants` (RLS select-own),
colonnes `user_profiles.active_insee_code` / `active_commune`, colonne
`payments.target_insee`. Advisor sécurité : aucun warning sur `report_grants`.

## V2 — multi-compte / multi-territoire : ce qui reste à faire

La V1 est volontairement mono-territoire-actif et mono-compte. Pour passer à un
vrai compte multi-territoires (et au foyer / multi-compte), voici la dette
identifiée, par ordre logique. Rien de tout ça n'est nécessaire pour `/ou-vivre`
ni pour vendre le rapport unitaire ; c'est le palier au-dessus.

### 1. Découpler l'accès du « territoire actif » (cœur du chantier)
- Aujourd'hui un seul `active_insee_code` à la fois : l'utilisateur consulte UN
  territoire, bascule via overlay. En V2, un compte doit pouvoir **lister et
  ouvrir plusieurs territoires débloqués** sans bascule destructive.
- `report_grants` porte déjà le modèle (1 ligne = 1 territoire). Ce qui manque :
  une **vue « mes territoires »** (liste des grants + résidence) comme porte
  d'entrée, à la place de l'overlay unique. L'overlay `active_*` peut rester comme
  « dernier consulté » mais cesse d'être l'unique chemin de lecture.
- Conséquence routing : `/rapport` devrait accepter un INSEE explicite
  (`/rapport/[insee]` ou `?territoire=`) plutôt que de dépendre de l'overlay en
  base. Gating inchangé : `resolveReadableTerritory` vérifie déjà le grant, il
  suffira de lui passer l'INSEE demandé au lieu de l'overlay.

### 2. Gating : retirer le rôle « source de vérité » de report_access
- En V1, `report_access=complete` reste le juge des capacités globales ET co-juge
  implicite du rapport résidence. En V2, le rapport **résidence** doit lui aussi
  devenir un grant (`source='direct'` sur `home_insee_code`) pour un modèle
  uniforme « 1 territoire lu = 1 grant ».
- `report_access` ne garderait alors que les capacités transverses (dashboard,
  suivi, foyer, newsletter). À faire : écrire un grant résidence à l'achat
  one-shot historique + migration de données pour les comptes existants.

### 3. Pack Décision (déclencheur commercial de la V2)
- Écrit N grants `source='pack_decision'` en un paiement. Bloqué tant que le point
  1 n'existe pas (sinon pas de surface pour consulter les N territoires).
- Pricing à câbler dans `create-payment-intent` (un PaymentIntent, N grants au
  webhook) et UI de sélection des territoires comparés.

### 4. Foyer / multi-compte (households)
- Les tables `households` / `household_members` existent déjà (vides). En V2
  foyer, un grant doit pouvoir être **partagé au foyer**, pas seulement au
  `user_id`. À trancher : grant porté par `household_id` quand le compte est en
  mode foyer, ou duplication par membre. Impacte la policy RLS `select_own`
  (devient `select_own_or_household`).
- `household_mode_enabled` est déjà posé sur l'entitlement foyer ; rien n'est
  branché côté lecture.

### 5. Hygiène / dette mineure
- `/api/territoire/activer` ne vérifie aucun droit (commodité UX). Sans risque
  d'accès depuis le gating lecture, mais en V2 multi-territoires, le poser devrait
  exiger un grant pour éviter les overlays « fantômes ». Trivial à ajouter quand
  le point 1 sera fait.
- `payments.target_insee` est tracé mais pas réconcilié avec `report_grants` :
  pour de l'analytics/SAV multi-territoires, une jointure ou une vue serait utile.

### Invariant à préserver dans toute la V2
La résidence (`home_insee_code` / `home_commune`) ne change jamais par un achat.
Tout le reste est overlay / grant. C'est la règle qui a guidé la V1, elle tient
pour la V2.
