# Passation — reprise de session

> Brief de reprise (commande `/handoff`). Une session neuve, éventuellement sur un autre
> compte Claude (même machine), reprend ici. La connaissance durable est déjà dans le vault
> (`docs/vault/`) et `/memory` (`MEMORY.md` + fiches) : ce fichier ne capture que l'état vivant.

- **Horodatage** : 2026-06-26
- **Branche courante** : `main` (propre, à jour, tout poussé). Aucune PR ouverte.

## Objectif en cours
**Consolidation du comparateur** : un seul moteur de comparaison, trois portes (découverte
`/ou-vivre` / départage « mode choix » / Pack), une sortie. La **décision est entièrement prise et
gravée** dans le vault. **Le BUILD est le prochain chantier** (le porteur ne veut PAS le différer) :
reconstruire la porte « mode choix » sur le moteur conforme et redéfinir le Pack par l'arbitrage
(N ∈ {2,3}). Rien de ce build n'est commencé.

## Fait dans cette session
- **Audit dette doc** (clos, commit `1eb159e`) : index ADR/arbitrages corrigés, orphelin carte
  indexé, 2 TODO résolus, climat « composante centrale » (manifeste).
- **`paris.md` créé** (commit `017e879`) : 4e type d'artefact du vault, registre vivant des paris
  (boucle de retour). Agent « gardien de la calibration » (famille *Learning*) décidé mais NI créé
  NI en roadmap, déclencheur = besoin pas volume. Voir fiche `project_paris_registre`.
- **Honnêteté site pré-lancement** (commit `30a88d2`) : `/professionnels` « dix dimensions » (faux)
  → « sept thèmes territoriaux » / « près de trente critères ». **Le Fil : tout prix retiré**
  (hero `le-fil`, kicker + carte `/checkout`, CTA `/comparateur`, `priceLabel`) — l'offre Le Fil
  est à cadrer avant son lancement (phase 2). `amount: 9` conservé en data inerte.
- **Mini-board comparateur** (Product → Business → Software Architect → Editorial, challengé par
  ChatGPT) puis **gravure** (commit `8433d90`) : voir Décisions ci-dessous.

## Décisions prises (porteur, gravées dans le vault)
- **Un moteur, trois portes** : legacy `/comparateur` (table `communes_tension`, scoré, cadre
  risque) **à jeter** (viole invariant n°2 + pivot ADR-0002). Le « mode choix » (le lecteur NOMME
  2-3 communes) est le besoin réel non servi (modèle de contrôle distinct du trio proposé par
  `/ou-vivre`). Préserver l'URL `/comparateur` (funnel SEO), changer le moteur.
- **Pack redéfini par l'arbitrage** (addendum `ADR-0007`) : « matrice complète sur les communes
  comparées (N ∈ {2,3}) », prix unique 39 €, compteur hors définition. **Refus net** d'un palier
  « 2 communes moins cher » (Business). **Ancre primaire** bascule remise → valeur (la remise
  « 3 rapports = 42 € » s'inverse à 2 communes : 2 rapports = 28 € < 39 €).
- **Voix** (Editorial) : la copy du Pack est DÉJÀ juste (« Vous hésitez entre {…} ? Tranchez, sans
  deviner »). **Rejet** du « résoudre votre choix » de ChatGPT (ferait de futur•e le décideur).
  Règle gravée dans `editoriale.md`. Ne PAS réécrire le hero.

## État git
- Branche `main`, **working tree propre, tout poussé**. Dernier commit `8433d90`.
- Commits de la session : `1eb159e`, `017e879`, `30a88d2`, `8433d90`. **Aucune PR ouverte.**
- Mémoire `/memory` à jour (fiches `project_paris_registre`, `project_comparateur_consolidation`
  + index), hors-repo.

## Prochaine étape immédiate
**Démarrer le build du mode choix + redéfinition du Pack.** Ordre conseillé (du moins risqué au
plus engageant), tout détaillé dans `/memory/project_comparateur_consolidation.md` :
1. **Exporter `buildComparaisonComplete`** (`src/lib/comparateur-vie.ts`) + une entrée
   `seed(insees[])` qui court-circuite `matchProjects`/préférences.
2. **Rendu à n=2** : corriger le bug d'égalité (`comparateur-vie.ts` ~l.1189 : à 2 communes au
   même palier, émet « Avantage A et B » au lieu d'« égalité » ; condition correcte
   `holders.length < present.length`), rendre la grille de `ComparaisonCompleteView.tsx` fonction
   de `trio.length` (sinon colonne fantôme), border la copy « trois » en dur (moteur l.1238/1265,
   vue l.208/238).
3. **Porte de saisie** des 2-3 communes nommées (URL `/comparateur` réutilisée) + **piège
   PLM/arrondissements et communes hors index** (`/memory/project_exclusion_ville_uu`,
   `home_insee_code_pitfall`).
4. **Plomberie payante** (le plus engageant) : colonne `decision_packs.mode` (`replay`|`choix`),
   `insee_3`/`commune_3` nullables, N `report_grants`, « 3 pistes » propres à `replay`, migration.

## À lire d'abord à la reprise
1. `MEMORY.md` (index) + fiche `project_comparateur_consolidation` (TOUT le terrain du build) et
   `project_comparateur_complet` (la matrice payante déjà livrée).
2. `docs/vault/modules/comparateur.md` (l'objet : 1 moteur, 3 portes), `adr/ADR-0007-pack-decision-bundle.md`
   (+ son addendum), `arbitrages/comparateur-un-moteur-trois-portes.md`, `paris.md` (paris #3/#4/#5).
3. Code : `src/lib/comparateur-vie.ts` (`buildComparaisonComplete` l.1149+), `src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx`,
   `src/lib/decision-packs.ts`, `supabase/13_init_decision_packs.sql`, `src/app/api/stripe/create-payment-intent/route.ts`,
   `src/app/(public)/comparateur/page.tsx` (legacy à remplacer).
4. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges / fils ouverts
- **Build estimé MOYEN (~1-2 j)** : le calcul de la matrice est déjà cardinal-agnostique (dégrade
  à n=2), le coût est dans la **plomberie payante**. La vraie décision durable = la **colonne
  `mode`** (un pack en mode choix ne se reconstruit pas en rejouant le projet). Borne : au-delà de
  N=3, table enfant `decision_pack_communes`, pas une 4e colonne.
- **Paris ouverts à instrumenter** (`paris.md`) : #4 le moment « 2 villes » est-il solvable ou de
  la réassurance peu monétisable (inversion ChatGPT, angle mort de consensus) ; #5 ce moment a-t-il
  du volume. Rouvrir le pricing fin (palier ? prix ?) seulement après ~15-30 ventes.
- **Le Fil** : page volontairement SANS prix désormais ; l'offre de l'abonnement reste **à cadrer**
  avant lancement (phase 2). `arbitrages/pricing-abonnements-reportes.md`.
- **Dettes doc laissées exprès** : C2 partiellement purgée (`modules/comparateur.md` écrit) ; restent
  `modules/` Logement/Santé/Mobilité/Métier/Projets + `architecture/parcours-et-acces.md` non écrits.
- **Staleness site (hors comparateur)** : `/professionnels` corrigé ; reste le reste du site à
  auditer au lancement (verrou robots/noindex à lever page par page, sitemap `/inondation`, JSON-LD).
- **Fils anciens** : module **Métier** (verdict agent « REFORMULER », jamais appliqué) = le sujet
  que le porteur a nommé comme suivant AVANT que le comparateur ne prenne la session ; carte de
  France = problème OUVERT côté Researcher.
