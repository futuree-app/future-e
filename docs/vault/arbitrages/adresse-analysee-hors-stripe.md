# Arbitrage : l'adresse analysée ne transite pas par le tiers de paiement

- **Date** : tranché 2026-07-30, pendant la conception du checkout du dossier d'adresse.
- **Source** : spec `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`,
  section « L'adresse ne transite pas par Stripe ».
- **Code** : `supabase/26_dossier_intents.sql` (appliquée le 30/07/2026),
  `src/app/api/stripe/create-payment-intent/route.ts`, `src/app/api/stripe/webhook/route.ts`.

## Ce qui est gravé

> **L'adresse d'un bien analysé ne quitte jamais nos systèmes pour un service tiers dont ce n'est
> pas l'objet. Les métadonnées d'un paiement portent ce que la transaction exige, et rien de ce que
> le lecteur envisage.**

## Pourquoi

La première conception mettait l'adresse canonique entière dans les métadonnées du PaymentIntent :
libellé, code INSEE, ville, code postal, latitude, longitude. C'était commode, le webhook créait le
dossier sans état intermédiaire, et cela ne demandait aucune migration.

**L'adresse analysée n'est pas l'adresse de facturation.** Ce n'est pas non plus, le plus souvent,
le domicile de la personne : c'est **le lieu qu'elle envisage**. La transmettre à un prestataire de
paiement avec ses coordonnées géographiques communique une intention de vie qui n'a aucun rôle dans
la transaction, et la dépose en clair dans un système dont la finalité est ailleurs.

Le raisonnement contraire, entendu et écarté : « Stripe est déjà sous-traitant, il reçoit l'e-mail,
il suffit de le documenter dans la politique de confidentialité ». C'est vrai et insuffisant.
Documenter une transmission qu'on peut supprimer revient à demander au lecteur d'accepter un coût
qu'on ne paie pas soi-même.

## Comment, sans rien inventer

**Le patron existait déjà.** Le Pack Décision met son trio de communes dans `pack_snapshots`, clé
`stripe_payment_intent_id`, écrit en service role avant le paiement et relu par le webhook. La table
`dossier_intents` suit exactement cette route.

Ce que Stripe reçoit désormais : le type de produit, l'identifiant du compte, l'e-mail, le code
INSEE (déjà transmis pour le 14 € avant cette décision), l'identité de mesure et la clé
d'idempotence. Aucun libellé d'adresse, aucune coordonnée.

## Trois propriétés que la table doit garder

**Elle n'ouvre aucun droit.** Le droit d'ouvrir un dossier reste l'existence d'une ligne
`address_dossiers`. Une intention sans paiement est sans effet, ce qui évite qu'une seconde table
de droits apparaisse par la fenêtre.

**Le client n'y a aucun accès.** RLS active, aucune policy, `revoke all` pour `authenticated` et
`anon`, vérifié par l'API REST (`permission denied for table dossier_intents`). Un client qui
pourrait y écrire choisirait l'adresse que le webhook lui livre après paiement, ou son montant.

**Elle a une rétention.** Une table créée pour éviter d'envoyer ces lieux à un tiers ne doit pas
devenir l'archive permanente des mêmes lieux. Un index sur `created_at` sert la purge des intentions
abandonnées ; celles rattachées à un dossier réellement payé sont conservées, parce qu'elles
permettent de reconstruire un dossier après incident.

## Le corollaire opérationnel

**Le `clientSecret` n'est jamais rendu si l'intention n'a pas pu s'écrire.** Ouvrir un paiement dont
la livraison est déjà impossible serait pire que de l'échouer : la carte serait débitée pour un
dossier qui ne pourrait pas naître.

**Et le webhook lève quand l'intention manque, au lieu de retourner.** La route répond
`{ received: true }` juste après le traitement : un `return` ferait croire à Stripe que l'événement
est traité, donc il ne le rejouerait jamais, et le paiement resterait encaissé sans dossier,
définitivement. En levant, la route répond 500 et Stripe réessaie pendant trois jours.
