# Passation : 30/07/2026, nuit

**Horodatage** : 2026-07-30, ~02h00 · **Branche** : `main` = `a91e613`, **tout est poussé**, donc
**tout est en production**. Aucun commit en attente. Cinq lots de code cette session : `d228417`,
`da6f079`, `273f910`, `a1a629c`, `a91e613`.

> Le handoff précédent (livraison d'`address_dossiers`, le droit descendu à l'échelle du bien) est
> archivé dans **`docs/handoff/2026-07-29-address-dossiers.md`**. Sa section URGENT est **RÉSOLUE**,
> son chantier hérité **C est FAIT**, son chantier **A reste ouvert et prioritaire**.

> **CHANTIER PARALLÈLE, distinct de celui-ci** : la refonte du langage visuel (`PRODUCT.md`, audit
> accueil + Rapport Territoire, séquence vers `DESIGN.md`) vit dans
> **`docs/handoff/2026-07-29-design-system-sequencage.md`**. Il porte deux corrections qui touchent
> des fichiers cités ici (`FutureELanding.tsx`, `rapport/page.tsx`) : les promesses 14 € et le CTA
> d'achat affiché aux payants. Le lire avant d'y toucher. **Son étape 2 a été partiellement exécutée
> cette nuit** (voir « Fait », lot 2) ; deux de ses points restent ouverts, listés en fin de section.

---

## Objectif en cours

Le droit territorial est cohérent d'un écran à l'autre, la bascule de territoire fonctionne
réellement au clic, et le produit ne vend plus que ce qu'il délivre. Reste le vrai blocage, inchangé
depuis deux sessions : **aucune surface ne crée de dossier hors de la route de test**. La spec de
qualification et de checkout est ce qui manque, et rien de payant ne peut exister avant elle.

---

## Fait dans cette session

### 1. `d228417` — Le territoire lu ne suivait pas le bien

**Le défaut.** `territory-claims.ts` acceptait déjà un dossier comme fondement territorial
(`kind: "dossier"`), mais rien ne déplaçait le territoire **lu**. `active_insee_code` restait nul,
donc `/rapport` retombait sur la résidence. Un compte qui possède deux biens à Nantes et réside à
La Rochelle **possédait Nantes en entier et recevait le partiel de La Rochelle**. Le webhook Stripe
pose bien le territoire actif, mais une seule fois, au paiement, et seulement si le paiement portait
un INSEE. Ensuite la seule route existante était `/rapport/residence`, qui **désactive**.

**Le geste.** Nouvelle route `/rapport/dossiers/ouvrir?id=…&vers=logement|autour|territoire` : ouvrir
un dossier pose son territoire, au grain commune (`communeParent`, sinon PLM ferait lire « Paris
1er »). Choix porteur contre un repli automatique dans `/rapport` : le clic sur un bien EST la
désignation, et deviner est ce que `pickSoleDossier` refuse une ligne plus loin. `/rapport` liste
désormais les communes ouvertes par un bien, porte qui n'existait nulle part : `/rapport/dossiers`
n'était atteignable que depuis les modules eux-mêmes.

**L'alignement des cinq points de citation, et le trou jouait dans les DEUX sens.**
`resolveReadableTerritory` ne contrôle rien sur la résidence, délibérément (le contrôle vit sur les
pages). Donc tant que les pages demandaient l'accès au plan, un compte ayant payé Nantes obtenait le
Territoire **complet de sa résidence, jamais payée**, sur `/rapport/quartier`, et pouvait faire
synthétiser **n'importe quelle commune de France** par `synthesize-quartier`, dont l'`inseeCode`
vient du client. La garde y est descendue **après lecture du corps**, seul endroit où elle porte sur
la commune demandée.

`/compte` séparait mal l'état du **plan** et l'ouverture des **échelles** : il annonçait « Trois
échelles, toutes ouvertes » pendant que `/rapport` servait le partiel. Troisième état ajouté (payant
sans commune ouverte).

### 2. `da6f079` — Le dashboard supprimé, et la vitrine cesse de sur-promettre

785 lignes d'écran, un axe de droits à trois valeurs et le CTA primaire de cinq Navbar, pour une page
qui répétait ce que `/rapport` dit mieux. **Arbitrage porteur** : l'équivalent réel est `/rapport` et
« En une minute ». Huit liens re-routés, dont `/merci`, ce que voit un acheteur trente secondes après
avoir payé.

**Deux promesses fausses trouvées en cartographiant, sans rapport avec le dashboard.** La landing
vendait « Trois échelles : la commune, le secteur autour de votre adresse, le logement » et
`/checkout/rapport-complet` « trois modules interactifs », quand **le webhook 14 € pose un
`report_grant` sur une commune et rien d'autre** : Autour et Logement exigent un dossier d'adresse,
qu'aucun paiement à 14 € ne crée. `checkout-products.ts`, lui, décrivait déjà le territoire seul.
Trois surfaces, trois discours. Elles disent maintenant ce que la caisse livre. Chantier hérité **C
fait** au passage : « qui s'enrichit au fil des prochains modules » retiré.

`globals.css` perd 495 lignes (71 classes `account-*` / `dashboard-*` / `gating-*` mortes), retirées
par équilibrage d'accolades puis vérifiées : 155/155, aucun sélecteur hors périmètre perdu.

### 3. `273f910` — Mode foyer et plans d'abonnement

Le mode foyer n'avait jamais été construit : `canAccessHouseholdFeatures` avait un seul appelant, la
page dashboard supprimée juste avant, et n'ouvrait rien. Les plans `suivi` et `foyer` n'étaient
vendus nulle part. `subscription.ts` existait pour les distinguer, sans un seul appelant. Doctrine
gravée dans `docs/vault/arbitrages/mode-foyer-recadre.md` (réécriture : la version de juin gardait le
Foyer comme feature future à base de comptes multi-personnes).

**Piège traité** : les comptes existants portent encore ces plans en base, dont celui du porteur
(`plan = suivi`). Sans table de compatibilité, un plan inconnu retombe sur `free` et l'écran
afficherait « Compte gratuit » à un compte payant. `LEGACY_PLANS` mappe `suivi` et `foyer` vers
`one_shot`, **à la lecture seulement**. Aucune migration, aucune écriture en production.

### 4. `a1a629c` — Un `<Link>` vers une Route Handler ne navigue pas

**Défaut constaté en production juste après le lot 1** : cliquer « Ouvrir Nantes » ne faisait rien.
Le serveur était hors de cause, et le test l'a prouvé sans ambiguïté : la MÊME URL collée dans la
barre d'adresse basculait le territoire correctement. Avec `<Link>`, Next demande un payload RSC ; la
Route Handler répond une redirection vers du HTML, que le router ne sait pas consommer, et il
abandonne sans rien faire ni rien dire. `prefetch={false}` ne protégeait que du préchargement.

Les cinq liens visant une Route Handler passent en `<a>` natif. **« Revenir à {commune} » est corrigé
au passage, et il était cassé AVANT cette session** : `/rapport/residence` est une Route Handler
atteinte par un `<Link>` depuis toujours, donc le territoire actif ne pouvait pas se désactiver
depuis l'interface. **Vérifié au navigateur par le porteur, dans les deux sens.**

**Règle à retenir** : dans ce projet, tout lien vers un `route.ts` doit être un `<a>`, jamais un
`<Link>`.

### 5. `a91e613` — Les écrans d'attente

« Chargement… » remplacé par **six jeux contextuels**, un par segment (`src/lib/loading-messages.ts`
+ un `loading.tsx` par segment). Discipline : la matière d'abord (ce qui est réellement chargé), puis
ce que cette lecture permet de comprendre, puis la transparence sur le délai.

**Six jeux CONTEXTUELS, pas six échelles** (correction porteur) : le produit a trois échelles,
Territoire, Autour, Logement ; `compte`, `rapport` et `dossiers` sont des surfaces.

Tout est en CSS, aucun JS : un `Math.random()` ou un `setInterval` rendrait le fallback dynamique,
donc plus lent à s'afficher, ce qui lui retire sa seule qualité. La variété entre écrans vient du
segment, celle dans le temps de l'attente réelle.

**Règle d'honnêteté, écrite dans le fichier pour ne pas être cassée par symétrie** : `territoire`
peut nommer DRIAS, Géorisques et VigiEau, car `/rapport/quartier` les interroge pendant le rendu
serveur ; `autour` et `logement` nomment leur matière, leurs sources arrivant après le rendu par des
routes API. Trois fausses précisions retirées après revue porteur (« sinistres », « à trois cents
mètres près », « deux logements d'un même immeuble ne vieillissent pas pareil »).

`/dev/loading` rejoue les six jeux, 404 en production.

---

## Décisions prises, pas encore dans le vault

1. **Porteur** : le dashboard n'a pas de valeur propre, son équivalent est `/rapport` + « En une
   minute ». Supprimé.
2. **Porteur** : `foyer` et `suivi` sortent du modèle. Un éventuel suivi sera **B2B**, donc un autre
   modèle, pas la reprise de ces valeurs. (Doctrine foyer déjà gravée, arbitrage abonnement non.)
3. **Porteur** : la bascule de territoire se fait par un geste explicite du lecteur, jamais par un
   repli automatique.
4. **Proposé et retenu** : la garde territoriale de `synthesize-quartier` descend après lecture du
   corps, seul endroit où elle porte sur la commune demandée.
5. **Proposé et retenu** : `/dashboard` gardait légitimement `canAccessCompleteReport` (question de
   plan, sans ouvrir d'accès). L'analyse du handoff précédent, qui le comptait parmi les cinq points
   à aligner, était donc inexacte sur ce point. Devenu sans objet avec la suppression.
6. **Porteur** : discipline des écrans d'attente en trois temps (matière, sens, délai), pas de statut
   générique répété, aucune phrase qui promette une granularité absente.

**À porter au vault** : un arbitrage sur la suppression du dashboard, un sur le retrait des
abonnements. Et **la correction déjà signalée deux fois** : `vision/modele-economique.md` compare
39 € aux « 600 à 800 € de diagnostics », or ce dossier est à la charge du **vendeur**
(art. L271-4 CCH). L'ancre resterait juste pour un vendeur ou un propriétaire, segment non instruit.

---

## État git

- **Branche** : `main` = `a91e613`, à jour avec `origin/main`. **Aucun commit non poussé.**
- **Aucune PR ouverte.** Le projet pousse directement sur `main`, et **un push déploie en
  production**.
- **Non commités, et ce sont les livrables du CHANTIER PARALLÈLE** (560 lignes de documentation, pas
  une ligne de code) :
  - `PRODUCT.md` (152 l.)
  - `docs/audits/2026-07-29-accueil-rapport-territoire.md` (179 l.)
  - `docs/handoff/2026-07-29-design-system-sequencage.md` (229 l.)
  - `.impeccable/` (12 K, configuration de la skill design)
  - **Ils existent sur disque, donc ils survivent à une coupure de session, mais un `git checkout` ou
    un `git clean` les perdrait. À committer tôt.**
- **Non commité, à ne jamais committer** : `Futur.e Design System.zip` (non suivi).
- **Branches locales à nettoyer** : `feat/address-dossiers` est fusionnée. Restent
  `feat/composition-faits-lies`, `feat/lot-a-depate-en-une-minute`, `feat/verdict-heros`, antérieures
  et hors sujet.
- **Base** : une seule base Supabase (`xkewgsccadjmondzmjxj`), **c'est la production**. Pas
  d'environnement de développement séparé.

---

## Prochaine étape immédiate

**Committer les cinq fichiers du chantier parallèle** (`PRODUCT.md`, l'audit, son handoff,
`.impeccable/`). C'est un geste de trente secondes qui protège 560 lignes de travail, et aucun de ces
fichiers ne touche le code de production.

**Ensuite, la spec de qualification et de checkout**, qui est le seul vrai blocage : il n'existe
aucune entrée par l'adresse dans le produit hors la porte de test, et deux des trois échelles
l'exigent. Matière prête pour l'écrire :
`docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md`, §6 (protocole de test
sans historique payant) et §7 (les six événements).

---

## À vérifier au navigateur, jamais fait

Les lots 1 à 3 n'ont été vérifiés que partiellement (le lot 4 l'a été dans les deux sens). Restent :

1. **`/compte`** doit cesser d'annoncer « Trois échelles, toutes ouvertes » quand elles ne le sont
   pas, et afficher « Rapport interactif » comme plan malgré `plan = suivi` en base (`LEGACY_PLANS`).
2. **`/rapport/quartier` sur une commune sans droit** doit rediriger vers `/rapport`. Attention :
   c'est le seul changement de la session qui peut **fermer** quelque chose qui était ouvert.
3. **`/compte/memoire`** : le bouton « Modifier » de la commune doit être présent (le verrou de plan
   est tombé avec les abonnements).
4. **Le gel du module Autour** (`cb3fc79`), toujours pas vérifié depuis le 29/07 :
   `https://futur-e.fr/rapport/autour?dossierId=cfe1ed8e-5fc0-4b8c-81ad-989c1d0c3db6`, bloc « Espace
   vert ». S'il répète « environnement en cours de récupération », la racine serveur est corrigée et
   le reste est côté client (`AutourModule`, `autourRetriedRef` ne retente qu'une fois par montage).

```sql
select id, snapshot->'sourceStatus' from public.address_dossiers;
```
`osmInfrastructure` et `osmGreenSpaces` doivent être `complete`.

**Vérification RLS jamais exécutée** (elle demande le mot de passe du porteur) :
```bash
TEST_USER_EMAIL=bonjourfuturee@gmail.com TEST_USER_PASSWORD='…' \
TEST_OTHER_USER_ID=b779cc8f-40c9-4ba5-a3d8-5a5726897c84 \
  node scripts/verify-address-dossiers-rls.mjs
```

---

## Chantiers ouverts, par priorité

**A. La porte « j'ai une adresse ». TOUJOURS LE PLUS URGENT.** Aucune entrée par l'adresse dans le
produit, hors la porte de test : la saisie libre a été retirée des modules le 29/07, et
`georisques-logement` exige que l'adresse soit celle du dossier. Condition d'existence du parcours
payant. À traiter avec la spec de qualification, son endroit naturel.

**B. Deux points de l'étape 2 du chantier parallèle, non traités et vérifiés encore présents :**
- `FutureELanding.tsx:3099` promet encore « ce qui entoure votre adresse et ce qui pèse sur votre
  logement » dans le CTA wizard. Même famille de sur-promesse que celle corrigée au lot 2.
- `FutureELanding.tsx:2688` dit « plus de 50 indicateurs » ; la formule prouvée est « près de 30
  critères », et elle existe déjà ligne 2803 de la même page.
- Le reste de l'étape 2 (liens `href="#"` du pied de page du rapport, CTA d'achat affiché aux
  payants, token sable `#c8b89a`) est décrit dans son handoff.

**C. Le test manuel de la bascule `address_dossiers`, partiellement fait.** Restent : une adresse
**sans DPE** (le trou fréquent, où le Passeport doit rester digne), et l'aller-retour
Territoire → Autour → Logement.

**D. La composition du foyer n'atteint le moteur que par le texte libre.** `user_profiles` porte
`presence_enfants`, `age_enfants`, `travail_exterieur`, `vehicule_type`, `health_flags`,
`life_projects`, mais `WizardAnswers` ne demande pas qui vivra là, `UserProject` porte posture /
intention / texte libre, et `HardConstraints` est purement géographique. **Pas une régression** :
rien n'a été perdu par le retrait du mode foyer.

**E. « Autour » : quatre chantiers, dans l'ordre.** Afficher les infrastructures bruyantes déjà
calculées (une session, aucune donnée nouvelle) · compter dans un rayon plutôt que le plus proche ·
les permis Sitadel autour de l'adresse (API vérifiée, jointure par parcelle) · le zonage PLU des
parcelles voisines.

**F. La conclusion déterministe d'« Autour »** : le module rend des faits sans synthèse. **Ne PAS
créer un troisième prompt** : assembler des énoncés déterministes depuis `secteur-facts.ts`
(`equipementAutoStatement` fait déjà ce geste).

**G. Le radon attend une décision produit**, pas du code : libellé exact de la carte, et si le geste
« faire mesurer » mérite un annuaire. Si oui, annuaire qualifié SANS commission.

**H. Le teaser nomme la mauvaise commune.** `WizardTeaser.tsx:292` titre avec `answers.quartier` mais
charge les signaux sur `inseeCode`. Chez le porteur : quatre points d'attention calculés sur La
Rochelle, affichés sous le nom de Carpentras. Faux silencieux, antérieur.

**I. Dette conceptuelle `/rapport/quartier`.** L'URL dit encore « quartier » alors qu'Autour porte
désormais la lecture locale. Constat porteur. Non traité parce que l'URL est indexée et sert le
levier de découvrabilité : c'est un chantier de redirections, pas une ligne. Consigné dans
`src/app/dev/loading/page.tsx` (table `SEGMENTS`), là où il se voit.

---

## À lire d'abord à la reprise

1. `MEMORY.md` (chargé au démarrage), puis les fiches `project_droit_territorial_ecrans`,
   `project_foyer_pas_une_echelle`, `project_module_logement`, `project_paywall_territoire`,
   `business_modele_economique`.
2. `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` — **la doctrine fait foi** en cas
   de divergence avec le code.
3. `docs/vault/arbitrages/mode-foyer-recadre.md` — réécrit cette session.
4. `docs/handoff/2026-07-29-design-system-sequencage.md` — le chantier parallèle, à lire avant de
   toucher `FutureELanding.tsx` ou `rapport/page.tsx`.
5. `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` — §6 et §7 alimentent
   la spec de qualification.
6. `docs/handoff/2026-07-29-address-dossiers.md` — l'archive de la veille.
7. `docs/handoff/AUTO-SNAPSHOT.md` — **daté du 08/07, très en retard.** Ne pas s'y fier.

---

## Pièges et fils ouverts

**Un `<Link>` vers une Route Handler ne navigue pas.** Tout lien vers un `route.ts` doit être un
`<a>`. Ce défaut a rendu inertes trois boutons neufs et un ancien, silencieusement, sans erreur
console ni signal serveur. Concerne aujourd'hui `/rapport/dossiers/ouvrir` et `/rapport/residence`.

**Le produit ne peut toujours pas créer de dossier sans la porte de test.** Deux variables absentes
du repo (`.env.example` est gitignoré), **actives en production** :
```
ENABLE_ADMIN_DOSSIER_CREATION=true      # absent = route 404, quelle que soit la liste
FUTUREE_ADMIN_EMAILS=bonjourfuturee@gmail.com
```
Comparaison d'e-mail stricte : Gmail confond `bonjour.futuree@` et `bonjourfuturee@`, pas nous.
**À RETIRER le jour où le checkout dossier existera** : ce genre de porte reste ouverte des années.

**Colonnes devenues muettes en base**, aucune migration destructive : `dashboard_access`,
`household_mode_enabled`, et les valeurs `suivi` / `foyer` de `plan` (encore portées par cinq comptes,
lues via `LEGACY_PLANS`). La contrainte `check` de `04_init_accounts.sql` les autorise toujours, sans
effet puisque plus rien ne les écrit.

**Le webhook Stripe n'a AUCUNE idempotence propre** : toute sa protection contre un événement rejoué
vient des contraintes de table. `address_dossiers` porte un index unique sur
`stripe_payment_intent_id`, mais la gestion `ON CONFLICT` appartient à la spec du webhook, qui
n'existe pas.

**Pas de bouton de réessai sur les écrans d'attente, et c'est délibéré.** Dans un fallback de
Suspense sans JS, il ne pourrait être qu'un lien vers la même URL, qui relancerait une navigation
par-dessus celle en cours au lieu de la reprendre. Le construire demanderait un composant client sur
le chemin critique, exactement ce qui rend cet écran lent à s'afficher. À traiter avec une vraie
frontière d'erreur si la reprise devient nécessaire.

**`TRUNCATE` reste accordé à `authenticated` sur toutes les tables sauf `address_dossiers`** (défaut
Supabase). PostgREST ne l'expose pas, donc c'est théorique. Chantier distinct.

**Deux dossiers de test vivent en base** (2 rue Crébillon, Nantes), `stripe_payment_intent_id` nul,
donc exclus de tout comptage et d'aucun tarif. Supprimables par `DELETE /api/admin/dossier`.

**Rappels mécaniques** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore, un
lint vert ne dit rien d'eux. Un module important `server-only` casse sous `node --test`. Un
commentaire JSX dans un ternaire casse le build. **Un backtick dans un commentaire CSS ferme le
template literal** d'un bloc `<style>{\`…\`}</style>` (rencontré cette session). Le hook pre-commit
lance `index:verify`. **Ne pas lancer `scripts/probe-conclusion.ts`** (45 appels LLM facturés).

**Le build affiche des `Failed to build /chaleur/[insee]` en timeout réseau**, jusqu'à 71 sur un run
quand un serveur de dev tourne en parallèle. Ils repassent au retry : vérifier le compte final et le
code de sortie, jamais une ligne isolée.

**Le hook design signale `Instrument Serif` comme « fonte surexploitée »** à chaque édition de
`RouteLoadingBar.tsx`. Faux positif contextuel : c'est la fonte de titre de tout le site. Aucune
exception n'a été posée, le porteur reprenant la typographie au global, et une exception figée
deviendrait fausse au changement de fonte.
