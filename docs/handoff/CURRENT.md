# Passation : 30/07/2026, nuit

**Horodatage** : 2026-07-30, ~00h30 · **Branche** : `main` = `273f910`, **tout est poussé**,
donc **tout est en production**. Rien en attente de commit.

> Le handoff précédent (livraison d'`address_dossiers`, le droit descendu à l'échelle du bien) est
> archivé dans **`docs/handoff/2026-07-29-address-dossiers.md`**. Sa section URGENT est **RÉSOLUE**,
> son chantier hérité **C est FAIT**, son chantier **A reste ouvert et prioritaire**.

---

## Objectif en cours

Le droit territorial est cohérent d'un écran à l'autre, et le produit ne vend plus que ce qu'il
délivre. Reste le vrai blocage, inchangé depuis hier : **aucune surface ne crée de dossier hors de
la route de test**. La spec de qualification et de checkout est ce qui manque.

---

## Fait dans cette session : trois lots, 27 fichiers, +368 / −1547

### 1. `d228417` — Le territoire lu ne suivait pas le bien

**Le défaut.** `territory-claims.ts` acceptait déjà un dossier comme fondement territorial
(`kind: "dossier"`), mais rien ne déplaçait le territoire **lu**. `active_insee_code` restait nul,
donc `/rapport` retombait sur la résidence. Un compte qui possède deux biens à Nantes et réside à
La Rochelle **possédait Nantes en entier et recevait le partiel de La Rochelle**. Le webhook Stripe
pose bien le territoire actif, mais une seule fois, au paiement, et seulement si le paiement portait
un INSEE. Ensuite la seule route existante était `/rapport/residence`, qui **désactive**.

**Le geste.** Nouvelle route `/rapport/dossiers/ouvrir?id=…&vers=logement|autour|territoire` : ouvrir
un dossier pose son territoire, au grain commune (`communeParent`, sinon PLM ferait lire « Paris
1er »). Choix explicite du porteur contre un repli automatique dans `/rapport` : le clic sur un bien
EST la désignation, et deviner est ce que `pickSoleDossier` refuse une ligne plus loin. GET à effet
de bord sur le patron de `rapport/residence/route.ts`, avec `prefetch={false}` sur tous les liens
qui y mènent, sinon Next basculerait le territoire au survol.

`/rapport` liste désormais les communes ouvertes par un bien : `/rapport/dossiers` n'était
atteignable depuis aucun hub, uniquement depuis les modules eux-mêmes.

**L'alignement des cinq points de citation, et le trou jouait dans les DEUX sens.**
`resolveReadableTerritory` ne contrôle rien sur la résidence, délibérément (le contrôle vit sur les
pages). Donc tant que les pages demandaient l'accès au plan, un compte ayant payé Nantes obtenait le
Territoire **complet de sa résidence, jamais payée**, sur `/rapport/quartier`, et pouvait faire
synthétiser **n'importe quelle commune de France** par `synthesize-quartier`, dont l'`inseeCode`
vient du client. La garde y est descendue **après lecture du corps**, seul endroit où elle porte sur
la commune demandée.

`/compte` séparait mal deux questions, l'état du **plan** et l'ouverture des **échelles** : il
annonçait « Trois échelles, toutes ouvertes » pendant que `/rapport` servait le partiel. Troisième
état ajouté (payant sans commune ouverte). `/dashboard` gardait `canAccessCompleteReport`
légitimement, sa valeur décrivant le plan sans ouvrir d'accès ; documenté sur place, puis la page a
disparu au lot suivant.

### 2. `da6f079` — Le dashboard supprimé, et la vitrine cesse de sur-promettre

785 lignes d'écran, un axe de droits à trois valeurs et le CTA primaire de cinq Navbar, pour une page
qui répétait ce que `/rapport` dit mieux. **Arbitrage porteur** : l'équivalent réel est `/rapport` et
« En une minute ».

Huit liens re-routés, dont `/merci`, ce que voit un acheteur trente secondes après avoir payé. Les
Navbar des modules pointent vers `/rapport/dossiers`.

**Deux promesses fausses découvertes en cartographiant, sans rapport avec le dashboard.** La landing
vendait « Trois échelles : la commune, le secteur autour de votre adresse, le logement » et
`/checkout/rapport-complet` « trois modules interactifs », quand **le webhook 14 € pose un
`report_grant` sur une commune et rien d'autre** : Autour et Logement exigent un dossier d'adresse,
qu'aucun paiement à 14 € ne crée. `checkout-products.ts`, lui, décrivait déjà le territoire seul.
Trois surfaces, trois discours. Elles disent maintenant ce que la caisse livre.

Chantier hérité **C fait** au passage : « qui s'enrichit au fil des prochains modules » retiré.

`globals.css` perd 495 lignes (71 classes `account-*` / `dashboard-*` / `gating-*` qui ne servaient
qu'à cet écran), retirées par équilibrage d'accolades puis vérifiées : 155/155, aucun sélecteur hors
périmètre perdu, la seule media query supprimée ne contenait que des règles mortes.

### 3. `273f910` — Mode foyer et plans d'abonnement

Le mode foyer n'avait jamais été construit : `canAccessHouseholdFeatures` avait un seul appelant, la
page dashboard supprimée juste avant, et n'ouvrait rien. Les plans `suivi` et `foyer` n'étaient
vendus nulle part. `subscription.ts` existait pour les distinguer, sans un seul appelant.

**Doctrine gravée par le porteur**, réécrite dans
`docs/vault/arbitrages/mode-foyer-recadre.md` (le fichier de juin gardait le Foyer comme feature
future à base de comptes multi-personnes ; c'est ce reste qui tombe) :

> Le foyer n'est pas une échelle ni une posture produit. Sa composition alimente le projet de vie et
> personnalise les conclusions. La décision peut être partagée entre plusieurs personnes, mais
> l'unité métier reste le projet puis le dossier, jamais un compte foyer.

**Piège traité** : les comptes existants portent encore ces plans en base, dont celui du porteur
(`plan = suivi`). Sans table de compatibilité, un plan inconnu retombe sur `free` et l'écran
afficherait « Compte gratuit » à un compte payant (le droit de lire ne bougerait pas, il vient de
`report_access` et des grants, mais l'écran mentirait). `LEGACY_PLANS` mappe `suivi` et `foyer` vers
`one_shot`, **à la lecture seulement**. Aucune migration, aucune écriture en production.

**Effet de bord assumé** : changer sa commune de résidence n'est plus réservé. La garde s'appuyait
sur ces plans et ne protégeait rien, `/api/profile` écrivant `field=commune` sans consulter le plan.
Son texte de repli invitait à « passer au Fil », produit écarté.

---

## À vérifier au navigateur, en priorité

Rien n'a été testé en production depuis le déploiement des trois lots. Dans cet ordre :

1. **Connecté, ouvrir `/rapport`.** Le bandeau « Vous avez analysé un bien dans une autre commune »
   doit apparaître avec « Ouvrir Nantes ». Le clic doit basculer le territoire et rendre le rapport
   **complet** de Nantes, avec le bandeau « revenir à La Rochelle ».
2. **`/compte`** doit cesser d'annoncer « Trois échelles, toutes ouvertes » quand elles ne le sont
   pas, et afficher « Rapport interactif » comme plan malgré `plan = suivi` en base (`LEGACY_PLANS`).
3. **`/rapport/quartier` sur une commune sans droit** doit rediriger vers `/rapport`. Attention :
   c'est le seul point qui peut **fermer** quelque chose qui était ouvert.
4. **`/compte/memoire`** : le bouton « Modifier » de la commune doit être présent.
5. **Le gel du module Autour** (`cb3fc79`), jamais vérifié depuis hier :
   `https://futur-e.fr/rapport/autour?dossierId=cfe1ed8e-5fc0-4b8c-81ad-989c1d0c3db6`, bloc « Espace
   vert ». S'il répète « environnement en cours de récupération », la racine serveur est corrigée et
   le reste est côté client (`autourRetriedRef` ne retente qu'une fois par montage).

```sql
select id, snapshot->'sourceStatus' from public.address_dossiers;
```
`osmInfrastructure` et `osmGreenSpaces` doivent être `complete`.

---

## Chantiers ouverts, par priorité

**A. La porte « j'ai une adresse ». TOUJOURS LE PLUS URGENT, inchangé.**
Il n'existe **aucune entrée par l'adresse dans le produit**, hors la porte de test : la saisie libre
a été retirée des modules hier, et `georisques-logement` exige que l'adresse soit celle du dossier.
C'est la condition d'existence du parcours payant. À traiter avec la spec de qualification, qui est
l'endroit naturel de cette saisie.

**B. Le test manuel de la bascule `address_dossiers`. Partiellement fait.**
Restent non vérifiés : une adresse **sans DPE** (le trou fréquent, où le Passeport doit rester
digne), et l'aller-retour Territoire → Autour → Logement.

**C. La composition du foyer n'atteint le moteur que par le texte libre.**
Chantier ouvert nommé par la doctrine du jour. `user_profiles` porte déjà `presence_enfants`,
`age_enfants`, `travail_exterieur`, `vehicule_type`, `health_flags`, `life_projects`, mais
`WizardAnswers` ne demande pas qui vivra là, `UserProject` porte posture / intention / texte libre,
et `HardConstraints` est purement géographique. Ce n'est **pas une régression** : rien n'a été perdu
par le retrait du mode foyer.

**D. « Autour » : quatre chantiers, dans l'ordre.** Afficher les infrastructures bruyantes déjà
calculées (une session, aucune donnée nouvelle) · compter dans un rayon plutôt que le plus proche ·
les permis Sitadel autour de l'adresse (API vérifiée, jointure par parcelle) · le zonage PLU des
parcelles voisines.

**E. La conclusion déterministe d'« Autour »** : le module rend des faits sans synthèse. **Ne PAS
créer un troisième prompt** : assembler des énoncés déterministes depuis `secteur-facts.ts`
(`equipementAutoStatement` fait déjà ce geste).

**F. Le radon attend une décision produit**, pas du code : libellé exact de la carte, et si le geste
« faire mesurer » mérite un annuaire. Si oui, annuaire qualifié SANS commission.

**G. Le teaser nomme la mauvaise commune.** `WizardTeaser.tsx:292` titre avec `answers.quartier`
mais charge les signaux sur `inseeCode`. Chez le porteur : quatre points d'attention calculés sur
La Rochelle, affichés sous le nom de Carpentras. Faux silencieux, antérieur.

---

## Décisions de cette session à porter au vault

1. **Fait** : `arbitrages/mode-foyer-recadre.md` réécrit.
2. **À écrire** : un arbitrage sur la suppression du dashboard (l'équivalent est `/rapport` +
   « En une minute »), et la correction des promesses 14 €.
3. **À corriger, déjà signalé hier et toujours vrai** : `vision/modele-economique.md` compare 39 € aux
   « 600 à 800 € de diagnostics ». Le dossier de diagnostics est à la charge du **vendeur**
   (art. L271-4 CCH) : l'acquéreur ne débourse pas cette somme. L'ancre resterait juste pour un
   vendeur ou un propriétaire, segment non instruit.

---

## Pièges et fils ouverts

**Le produit ne peut toujours pas créer de dossier sans la porte de test.** Deux variables absentes
du repo (`.env.example` est gitignoré), **actives en production** :
```
ENABLE_ADMIN_DOSSIER_CREATION=true      # absent = route 404, quelle que soit la liste
FUTUREE_ADMIN_EMAILS=bonjourfuturee@gmail.com
```
Comparaison d'e-mail stricte : Gmail confond `bonjour.futuree@` et `bonjourfuturee@`, pas nous.
**À RETIRER le jour où le checkout dossier existera** : ce genre de porte reste ouverte des années.

**Colonnes devenues muettes en base**, aucune migration destructive : `dashboard_access`,
`household_mode_enabled`, et les valeurs `suivi` / `foyer` de `plan` (encore portées par cinq
comptes, lues via `LEGACY_PLANS`). La contrainte `check` de `04_init_accounts.sql` les autorise
toujours, ce qui est sans effet puisque plus rien ne les écrit.

**Le webhook Stripe n'a AUCUNE idempotence propre** : toute sa protection contre un événement rejoué
vient des contraintes de table. `address_dossiers` porte un index unique sur
`stripe_payment_intent_id`, mais la gestion `ON CONFLICT` appartient à la spec du webhook, qui
n'existe pas.

**Vérification RLS jamais exécutée** (elle demande le mot de passe du porteur) :
```bash
TEST_USER_EMAIL=bonjourfuturee@gmail.com TEST_USER_PASSWORD='…' \
TEST_OTHER_USER_ID=b779cc8f-40c9-4ba5-a3d8-5a5726897c84 \
  node scripts/verify-address-dossiers-rls.mjs
```

**`TRUNCATE` reste accordé à `authenticated` sur toutes les tables sauf `address_dossiers`** (défaut
Supabase). PostgREST ne l'expose pas, donc c'est théorique. Chantier distinct.

**Deux dossiers de test vivent en base** (2 rue Crébillon, Nantes), `stripe_payment_intent_id` nul,
donc exclus de tout comptage et d'aucun tarif. Supprimables par `DELETE /api/admin/dossier`.

**Rappels mécaniques** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore, un
lint vert ne dit rien d'eux. Un module important `server-only` casse sous `node --test`. Un
commentaire JSX dans un ternaire casse le build. Le hook pre-commit lance `index:verify`.
**Ne pas lancer `scripts/probe-conclusion.ts`** (45 appels LLM facturés). Le build voit passer des
`Failed to build /chaleur/[insee]` en timeout réseau : ils repassent au retry, vérifier le compte
final plutôt qu'une ligne isolée.

---

## À lire d'abord à la reprise

1. `MEMORY.md` puis les fiches `project_module_logement`, `project_paywall_territoire`,
   `business_modele_economique`.
2. `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` — **la doctrine fait foi** en cas
   de divergence avec le code.
3. `docs/vault/arbitrages/mode-foyer-recadre.md` — réécrit cette nuit.
4. `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` — §6 (protocole de
   test sans historique payant) et §7 (les six événements) alimentent la spec de qualification.
5. `docs/handoff/2026-07-29-address-dossiers.md` — l'archive de la veille.
6. `docs/handoff/AUTO-SNAPSHOT.md` — **daté du 08/07, très en retard.** Ne pas s'y fier.
