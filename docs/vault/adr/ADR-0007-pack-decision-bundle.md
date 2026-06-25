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

## Liens

`adr/ADR-0002-pivot-compatibilite-territoriale.md`,
`adr/ADR-0003-territoire-actif-vs-residence.md`,
`arbitrages/pricing-abonnements-reportes.md`, `doctrine/legal.md`,
`/memory/project_comparateur_complet.md`, `/memory/project_paywall_territoire.md`.
