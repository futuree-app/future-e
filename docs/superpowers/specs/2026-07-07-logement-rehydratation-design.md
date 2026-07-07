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
1. **Artefact COMPLET** (snapshot + city/postcode + choix DPE **terminal**, jamais `pending`) **et** `canAnalyzeCommune(user, insee)` OK → rehydrate **instantané** (Passeport, DPE, autour, posture) ; re-fetch Géorisques en arrière-plan avec un **léger loader sur le seul bloc Risques** ; à réception, hash-compare → synthèse cohérente affichée ou marquée périmée. **Une analyse abandonnée en cours de sélection DPE (`pending`) n'est PAS un artefact** : la restaurer remet dans un écran de sélection cassé (candidats non garantis au re-fetch) → elle retombe sur la saisie normale (bug trouvé au test 2026-07-07).
2. Commune plus accessible → **message propre + upsell** (réutilise le pattern 4.5 `COMMUNE_NOT_UNLOCKED`).
3. Snapshot incomplet ou absent → **fallback silencieux** vers la saisie d'adresse (l'état actuel, aucune régression).

**Analytics :** event `logement_restored` (avec `address_token` non réversible, source `auto` vs `deeplink`).

## Ce que la ligne porte, et la petite migration nécessaire (décision A)

`LogementRow` stocke déjà `address_label`, `latitude`, `longitude`, `parcel_code`, `posture`, `snapshot` (autour), `selected_dpe_snapshot` + `dpe_selection_status` (DPE figé), `synthesis_text` / `synthesis_fact_hash`, `updated_at`. **Le Passeport, le DPE, l'autour, la posture et la synthèse se reconstruisent depuis la ligne.**

**Sauf pour re-fetcher l'exposition Géorisques** : la route `georisques-logement` valide l'adresse via `validateSelectedBanAddress`, qui **exige `city` + `postcode` non vides** — or la ligne ne les stocke pas. **Décision A (porteur) : petite migration additive** `supabase/22_logement_address_fields.sql` (colonnes `city`, `postcode`), écrites à l'analyse (le client les a dans `payload.address`), threadées via `logement-autour`. La rehydratation re-fetch alors par la route **existante et éprouvée** (on ne touche pas au cœur du fan-out). `getLatestLogement(user)` trie par `updated_at` décroissant.

**Limite assumée v1** : la ligne stocke la **posture** (résidence/prospection), pas le **projet fin** (4 boutons de la sonde). À la rehydratation, la sonde `ProjectProbe` réapparaît **non répondue** (ton par défaut, re-répondable) ; l'autour reste servi du snapshot (posture déjà figée dedans), donc re-répondre ne dégrade rien.

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
