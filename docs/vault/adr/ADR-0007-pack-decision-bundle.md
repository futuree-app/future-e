# ADR-0007 : Le Pack Décision est un bundle, entité `decision_packs` persistée

- **Statut** : accepté, **implémenté** (vérifié contre le code 2026-06-25)
- **Date** : décision ~2026-06-07, architecture confirmée en conversation porteur
- **Source** : conversation porteur × ChatGPT « futur•e et climat » (intake 2026-06-25),
  vérifiée dans `supabase/13_init_decision_packs.sql`, `src/lib/decision-packs.ts`,
  `src/app/api/stripe/`. Recoupe `/memory/project_comparateur_complet.md`,
  `arbitrages/pricing-abonnements-reportes.md`.

## Contexte

Le Pack Décision 39 € pouvait être vu comme une simple vue premium (la comparaison
complète). Le porteur l'a repositionné en **bundle attaché à un projet et un trio de
communes**.

## Décision

Le Pack déverrouille simultanément, pour un trio précis : la comparaison complète (matrice
7 thèmes / 27 dimensions), les 3 rapports territoire du trio, la révélation de 3 nouvelles
pistes (rangs 4-6, révélées, pas converties en rapports), et AskFuture (9 questions,
mécanisme = 3 par rapport).

**Modèle de données** (vérifié dans `supabase/13_init_decision_packs.sql`) :
- entité `decision_packs` persistée, parallèle à `report_grants` ;
- identité = `(user_id, trio_key)`, `trio_key` = les 3 INSEE **triés** joints par `-`
  (`trioKey()` dans `src/lib/decision-packs.ts`), contrainte `unique` ;
- l'achat crée en un webhook 1 `decision_pack` + 3 `report_grants` de source
  `pack_decision` (mécanisme du 14 € réutilisé tel quel) ;
- le pack stocke un **snapshot du projet acheté** (`projet_label` + `parsed_snapshot`) : le
  projet n'entre pas dans la clé d'unicité, mais la comparaison achetée reste reproductible.

**Gating** : serveur autoritaire. La propriété se teste par `getDecisionPack(user, trio_key)` ;
le contenu payé suit la doctrine de preview du 14 € (aperçu tronqué libre, payload complet
seulement si le pack est possédé), pour que rien de payé n'atteigne le navigateur d'un
non-acheteur.

## Pourquoi

- Le pack est un objet métier autonome : AskFuture, pistes et projet ont besoin d'un endroit
  où vivre, 3 grants seuls n'y suffisent pas.
- **Jamais de booléen global `pack_access`** (vérifié absent du code) : un achat ne
  déverrouille pas tous les futurs trios, sinon l'économie s'effondre. On achète
  « l'arbitrage entre CES trois territoires », pas « la fonctionnalité comparaison ».
- Économie : 3 rapports = 42 €, le pack = 39 € et ajoute comparaison, pistes, AskFuture.
- Le snapshot encode un principe durable : un Pack Décision est **la photographie d'un
  arbitrage à un instant donné**, qu'on doit pouvoir retrouver à l'identique plus tard.

## Conséquences

- Metadata Stripe élargie (3 INSEE + `grantSource: "pack_decision"`), octroi via webhook et
  page de retour (éviter l'attente Stripe).
- Page de conviction dédiée (esprit `/territoire/[insee]/debloquer`) : hero de continuité sur
  le trio, aperçu réel tronqué, « ce que vous débloquez », pourquoi 39 €. Mention légale :
  « TVA non applicable, art. 293 B » (jamais « TVA incluse », vérifié absent).

## Addendum (2026-06-26) : le Pack se définit par l'arbitrage, pas par le nombre de communes

Décision issue d'un mini-board (Product, Business, Software Architect, Editorial) déclenché par
la consolidation des surfaces de comparaison sur un moteur unique et l'ouverture d'une porte
**« mode choix »** : le lecteur **nomme** lui-même 2-3 communes à départager (mutation, deux
offres d'emploi), là où `/ou-vivre` lui en **propose** un trio (découverte). Voir
`arbitrages/comparateur-un-moteur-trois-portes.md` et `modules/comparateur.md`.

**Redéfinition.** Le Pack n'est plus « un bundle de **trois** communes » mais **« la matrice
complète sur les communes que le lecteur compare (N ∈ {2, 3}) »**, prix unique 39 €. Le compteur
sort de la définition : on paie la **profondeur de l'arbitrage**, pas un nombre de fiches.
Convergence des quatre lentilles : Product (la paire suffit déjà à révéler un compromis ; le
palier ABSOLU est indépendant du nombre), Business (un palier « 2 communes moins cher » est
refusé, il dilue l'ancre et grave un second prix avant la première vente), Editorial (le compteur
hors définition est un gain de voix), Architecte (le calcul de la matrice est déjà
cardinal-agnostique, il dégrade proprement à n=2).

**Deux modes de pack, une colonne `mode` (la vraie décision d'architecture).** La reconstruction
d'un Pack supposait de **rejouer le projet** (`matchProjects(snapshot)` → top-3). Le mode choix
casse cette hypothèse : le trio est nommé, aucun projet ne le régénère. Donc deux modes coexistent
et doivent être **matérialisés explicitement** en base (inférer le mode de `insee_3 IS NULL` serait
faux : un mode choix peut avoir 3 communes) :
- `replay` : seed par un projet de vie, top-3 (le mode historique de `/ou-vivre`) ;
- `choix` : seed par les INSEE nommés par le lecteur.

**Ce qui change dans le modèle de données** (chantier de build à venir, estimé moyen, ~1-2 j) :
- colonne `decision_packs.mode` (`replay` | `choix`) ;
- `insee_3` / `commune_3` deviennent **nullables** (`decision_packs` et `pack_snapshots`) ;
- l'octroi crée **N** `report_grants` (2 ou 3), plus « 3 en dur » ;
- la révélation des **« 3 nouvelles pistes » (rangs 4-6) est propre au mode `replay`** : en mode
  choix il n'y a pas de rang, donc pas de pistes (conditionner la copy de conviction aussi) ;
- `trio_key` et sa contrainte d'unicité **survivent tels quels** (`{A,B}` ≠ `{A,B,C}`, cohérent
  avec « on achète CET arbitrage précis »).

**Borne d'altitude.** Le modèle « colonnes fixes `insee_1/2/3` » tient pour N ∈ {2, 3}. Au-delà
(un éventuel N=4), migrer vers une table enfant `decision_pack_communes`, pas une 4e colonne.

**Ancre de prix.** L'ancre « trois rapports valent 42 €, le Pack 39 € » est une remise par unité :
elle **s'inverse à 2 communes** (2 rapports = 28 € < 39 €, le Pack devient un premium). L'ancre
primaire bascule donc vers la **valeur** (« 39 € contre le coût d'une commune mal choisie »), la
remise devenant secondaire et jamais invoquée à 2 communes. Voir `vision/modele-economique.md`.

**Voix.** La promesse du Pack reste « Vous hésitez entre {…} ? Tranchez, sans deviner » : le verbe
qui tranche reste **côté lecteur**, jamais « résoudre votre choix » (qui ferait de futur•e le
décideur, contre les invariants n°1 et n°2). Voir `doctrine/editoriale.md`.

**Piège de saisie à border au build.** L'entrée « le lecteur nomme ses communes » expose le piège
PLM/arrondissements et les communes hors index (cf. `/memory/project_exclusion_ville_uu.md`,
`/memory/home_insee_code_pitfall.md`).

## Liens

`adr/ADR-0002-pivot-compatibilite-territoriale.md`,
`adr/ADR-0003-territoire-actif-vs-residence.md`,
`arbitrages/pricing-abonnements-reportes.md`, `doctrine/legal.md`,
`/memory/project_comparateur_complet.md`, `/memory/project_paywall_territoire.md`.
