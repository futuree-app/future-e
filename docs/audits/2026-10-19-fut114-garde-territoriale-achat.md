# FUT-114 · Garde territoriale des achats (19/10/2026)

Décision FUT-18 (16/10/2026) : la V1 vend ses dossiers en France métropolitaine, Corse comprise. Ce lot garantit
côté serveur qu'aucun paiement ne peut être préparé pour un territoire non éligible.

## 1. Chemins de paiement réels

Une seule route crée un paiement : `POST /api/stripe/create-payment-intent` (PaymentIntent Stripe, aucun
Checkout Session, aucun Payment Link dans le code). Elle sert trois produits :

| Offre | `productType` | Pages appelantes | Objet territorial |
|---|---|---|---|
| Dossier de territoire 14 € | `one-shot` | `/territoire/[insee]/debloquer`, `/checkout/rapport-complet` | `targetInsee` (client) |
| Dossier d'adresse 39 € / complément 25 € / code BETA | `address-dossier` | `/checkout/dossier` | `citycode` de la BAN (serveur) |
| Comparatif 2 ou 3 communes 39 € | `pack-decision` | `/comparateur/pack-decision` | `pack.trio[].insee` (client) |

Le complément 25 € et la remise ne sont pas des routes : `quoteForDossier` et `resolvePromo` s'appliquent dans la
même route, sur le même produit `address-dossier`.

Effets de bord, dans l'ordre : `stripe.paymentIntents.create`, puis `dossier_intents` (adresse) ou
`pack_snapshots` (comparatif). Après paiement, le webhook (et le retour optimiste de la page comparatif) posent
`report_grants`, `address_dossiers`, `decision_packs`, `payments`, la facture : tous dérivent d'un PaymentIntent
ou d'une ligne créés par cette route. `/api/territoire/activer` et `/api/dossier/actualiser` ne créent aucune
commande. `/api/admin/dossier` crée un dossier sans paiement, derrière deux verrous (drapeau d'environnement
absent en production + liste d'e-mails) : hors parcours commercial.

## 2. Protections

Avant ce lot : aucune garde géographique. Un `97xxx` passait la regex `^[0-9AB][0-9]{4}$` pour le territoire et
le comparatif, et l'adresse n'avait que le contrôle « numéro de rue BAN ». La même regex refusait tout code corse
(`2A004` : `cleanInsee` vide, donc 14 € encaissés sans `report_grant`, comparatif corse refusé, page
`/debloquer` en 404).

Ajouté :

- `src/lib/commerce/eligibilite-territoriale.ts` (pur) : `communeVendable` et `ensembleVendable`. Absent,
  mal formé ou inconnu de l'index → `TERRITORY_UNVERIFIED` ; `97xxx`/`98xxx` → `TERRITORY_NOT_ELIGIBLE` ;
  commune de l'index ou code communal PLM → vendable. Un comparatif est refusé entier dès qu'un candidat l'est.
- `src/lib/commerce/referentiel-communes.ts` : le référentiel est `src/data/accueil-communes.json`, projection
  de l'index (34 788 codes, Hexagone et Corse, arrondissements PLM), contrôlée au prebuild.
- Route : territoire et comparatif vérifiés juste après la reconnaissance du produit, AVANT la session ;
  adresse vérifiée sur la commune canonique de la BAN, avant le tarif, Stripe et l'intention. Refus en 422 avec
  un message lisible et un code métier.
- `/territoire/[insee]/debloquer` : même règle, 404 hors périmètre ; la Corse s'ouvre.

## 3. Tests

`src/lib/commerce/fut114-garde-territoriale.test.ts` importe la vraie route ; Stripe, Supabase, BAN, PostHog et
le droit territorial sont simulés et journalisés. Contre la route d'origine, 7 des 8 tests de route échouent.

| Cas | Résultat |
|---|---|
| Territoire métropole, Paris/Lyon/Marseille (commune et arrondissements), Corse | accepté, 14 €, code vérifié au webhook |
| Territoire outre-mer (DROM, COM, Nouvelle-Calédonie) | refusé avant session, 0 Stripe, 0 écriture |
| Code falsifié, inconnu, absent, non textuel ; achat « sans commune » | refusé avant session |
| Adresse métropole, PLM, Corse | acceptée, 39 € ; 25 € après territoire |
| Adresse outre-mer, avec territoire payé et code BETA | refusée, 0 Stripe, 0 intention |
| Adresse falsifiée (client Paris, BAN Réunion) | refusée : la BAN fait foi |
| Comparatif métropole + Corse + PLM | accepté |
| Comparatif mixte ou avec un code falsifié | refusé entier, 0 Stripe, 0 instantané |

## 4. Limites

1. **`/checkout/rapport-complet` ne vend plus rien.** Ce parcours (CTA 14 € de l'accueil, de l'ancienne
   landing et du teaser wizard) créait un paiement sans commune : le webhook n'ouvrait aucun territoire. Il est
   désormais refusé au paiement avec un message. Le CTA reste à rediriger vers le choix d'une commune : décision
   produit.
2. **Hors géographie, signalé :** le retour Stripe de `/comparateur/pack-decision` octroie le pack sur la seule
   foi de `?payment_intent=…&redirect_status=succeeded`, sans demander à Stripe si le paiement a abouti. Les
   instantanés n'existent plus hors métropole, mais le contournement de paiement demeure.
3. La regex anti-Corse subsiste hors du paiement : `comparateur/page.tsx`, `comparateur/pack-decision/page.tsx`,
   `rapport/territoire/route.ts`, `api/territoire/activer`, `accueil/qna.ts`. Un comparatif corse ne se forme
   donc pas depuis l'interface.
4. Les PaymentIntents créés avant déploiement restent livrables (le webhook ne revérifie pas). Les commandes
   ultramarines déjà passées en production n'ont pas été recherchées (lecture seule à faire).
