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
