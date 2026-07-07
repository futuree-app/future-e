# Spec — Rehydratation du module Logement (Scope A)

**Date** : 2026-07-07 · **Branche cible** : `feat/logement-hotfix-confiance` · **Statut** : design validé, à planifier.

C'est le dernier volet restant de « spec 1b » (réordonnancement + checklist « À vérifier » déjà livrés sous les commits « 5a »).

## Problème

Quand l'utilisateur revient sur `/rapport/logement`, la page démarre `result = null` (`LogementModule.tsx:49`) : il doit re-saisir l'adresse et ré-attendre tout le calcul, même pour un bien déjà analysé. Irritant de confiance (critique 6 du board). Le re-key sur l'adresse (étape 2) et l'artefact persistant (ligne `logement` = snapshot autour + DPE figé + synthèse + posture) rendent la restauration possible.

## Scope

**DANS (Scope A) :**
- Restauration automatique du **dernier logement analysé** au retour sur la page.
- Deep-link `?logementId=<banId>` pour rouvrir un bien précis (prépare B, quasi gratuit : `getLogement` existe).

**HORS (Scope B — parqué sous le nom produit « Mémoire des biens ») :** liste des biens, carte « Mes logements » dans le dashboard, switch multi-adresses, suppression/renommage, comparaison entre biens. Pensé comme une vraie promesse produit (cf. thèse business « mémoire des biens = valeur payante »), pas une extension technique de la rehydratation. La rehydratation partielle de A sert de socle à B.

## Doctrine centrale : fraîcheur du risque + cohérence par le hash

La ligne `logement` porte le snapshot (autour, DPE, synthèse, posture) mais **pas** l'exposition Géorisques (RGA, PPRN, sinistralité, sismicité). Décision :

1. **Le risque doit rester frais.** On **re-fetch l'exposition Géorisques** à la rehydratation (pas de risque gelé : afficher un PPRN périmé serait malhonnête pour un produit de risque). L'autour, lui, reste servi depuis le snapshot (déjà figé par design).
2. **On ne mélange jamais silencieusement les générations.** La synthèse stockée a été écrite pour un état de faits donné, identifié par son `synthesis_fact_hash`. À la rehydratation, on **recalcule `buildFactHash`** sur les faits rehydratés + re-fetchés et on compare :
   - **hash identique** → la synthèse correspond encore aux faits : on l'affiche telle quelle, zéro LLM.
   - **hash différent** → les faits ont dérivé : la synthèse est **périmée**, marquée régénérable (ou régénérée si `AUTO_SYNTHESIS`), jamais affichée à côté de blocs qui ne matchent plus.

Conséquence : **aucune migration, aucune colonne neuve.** On réutilise `getLogement`, le re-fetch Géorisques, et le hash existant. (L'alternative — snapshoter tout le rapport Géorisques dans une colonne pour un artefact 100 % gelé — est écartée : le risque doit être frais, et le hash gère déjà la cohérence.)

## Flux de rehydratation

**Entrée :**
- `?logementId=<banId>` présent → `getLogement(user, banId)`.
- sinon → dernier logement du user via nouvelle fonction store `getLatestLogement(user)` (tri par `synthesis_generated_at` décroissant).

**Rendu :**
1. Snapshot présent **et** `canAnalyzeCommune(user, insee)` OK → rehydrate **instantané** (Passeport, DPE, autour, posture) ; re-fetch Géorisques en arrière-plan avec un **léger loader sur le seul bloc Risques** (les autres blocs sont déjà là → pas de spinner long) ; à réception, hash-compare → synthèse cohérente affichée ou marquée périmée.
2. Commune plus accessible → **message propre + upsell** (réutilise le pattern 4.5 `COMMUNE_NOT_UNLOCKED`).
3. Snapshot incomplet ou absent → **fallback silencieux** vers la saisie d'adresse (l'état actuel, aucune régression).

**Analytics :** event `logement_restored` (avec `address_token` non réversible, source `auto` vs `deeplink`).

## La ligne porte déjà tout le nécessaire (aucune migration)

Vérifié dans `LogementRow` (`logement-store.ts`) : la ligne stocke `address_label`, `latitude`, `longitude`, `parcel_code`, `posture`, `snapshot` (autour), `selected_dpe_snapshot` (DPE figé), `synthesis_text` / `synthesis_fact_hash` / `synthesis_generated_at`, et `updated_at`. **Le Passeport, le DPE, l'autour, la posture et la synthèse se reconstruisent intégralement depuis la ligne.** Seule l'exposition Géorisques manque → re-fetch. **Donc aucune migration** ; `getLatestLogement(user)` trie par `updated_at` décroissant.

## Critères d'acceptation

- Je reviens sur `/rapport/logement` → mon dernier logement réapparaît (adresse, DPE, autour, synthèse, posture).
- Pas de spinner long : tout ce qui est snapshoté s'affiche tout de suite ; seul le bloc Risques attend le re-fetch.
- La synthèse affichée correspond aux faits affichés (hash identique) ; sinon elle est marquée périmée, jamais incohérente en silence.
- `?logementId=<banId>` rouvre le bon bien.
- Commune non accessible → message propre + upsell, jamais les données.
- Snapshot incomplet → retour au champ de saisie, sans planter.
- Event `logement_restored` émis.

## Non-objectifs

- Pas de liste, pas de dashboard, pas de multi-bien navigable (→ B « Mémoire des biens »).
- Pas de gel du rapport Géorisques (le risque reste frais).
