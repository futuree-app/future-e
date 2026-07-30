# Passation : 30/07/2026, le parcours d'achat par l'adresse encaisse, en mode test

**Horodatage** : 2026-07-30 · **Branche** : `main`, **seize commits en attente, RIEN N'EST POUSSÉ**,
donc rien de tout ceci n'est en production. Un push déploie. Les trois preuves demandées avant push
sont acquises en mode test (voir ci-dessous) ; le push reste une décision du porteur.

> Le handoff précédent (droit territorial cohérent, dashboard supprimé, écrans d'attente) est
> archivé dans **`docs/handoff/2026-07-30-nuit-droit-territorial.md`**. Son **chantier A, « la porte
> j'ai une adresse », est l'objet de cette session** ; ses chantiers B à I restent ouverts.

> **CHANTIER PARALLÈLE, mené dans un autre terminal** : la refonte du langage visuel vit dans
> **`docs/handoff/2026-07-29-design-system-sequencage.md`** et a produit quatre commits ce jour
> (`219bc8f`, `b44f1f0`, `1da154f`, `c40a956`). Cette session n'a touché **aucun** de ses fichiers.
> Les deux arbitrages laissés de côté ici (liens vers la nouvelle porte depuis la landing et les
> pages commune) lui appartiennent.

---

## L'état réel, en une phrase

**Le chemin serveur encaisse et livre : deux paiements de test ont produit deux dossiers, à 39 € puis
25 €, et le rejeu du webhook n'a rien dupliqué. Le chemin NAVIGATEUR n'a jamais été parcouru par un
humain, et le mode production n'a jamais encaissé.**

---

## LES TROIS PREUVES, ACQUISES LE 30/07/2026

Elles ont été obtenues en mode test Stripe, contre la base réelle, puis **entièrement nettoyées** :

1. **Premier achat** : `pi_3TypSz…`, dossier `f0116088…` créé, `amount_paid_cents` = 3900 égal au
   montant déclaré par Stripe, `purchased_at` renseigné, territoire actif posé sur 44109, **zéro
   `report_grant` dérivé**.
2. **Rejeu du webhook** (`stripe events resend`) : réponse 200, **un seul dossier**, et
   `purchased_at` **inchangé**. Sans `ignoreDuplicates`, l'upsert aurait réécrit la date d'achat
   d'un dossier déjà payé : le défaut anticipé dans le commentaire est confirmé par l'expérience.
3. **Second achat à la même adresse** : `pi_3TypVQ…`, second dossier légitime, **2500 centimes**.
   Le défaut d'écrasement du 29/07 (`logement_id = ban_id`) est mort : deux uuid distincts sur un
   même `ban_id`.

Trois vérifications supplémentaires, non prévues au plan :

- **La revalidation écrase bien le client.** L'intention a stocké `47.214294 / -1.559066`, les
  coordonnées rendues par la BAN, là où la requête portait `47.214331 / -1.559088`.
- **La route de statut ne fuit pas.** Un autre compte **connecté** obtient `pending`, jamais l'uuid
  du dossier. Sans session : 307 vers `/connexion`, corps vide.
- **L'idempotence tient des deux côtés.** Même `checkoutAttemptId` rendu deux fois : le même
  PaymentIntent. Tentative neuve : un PaymentIntent distinct.

**Nettoyage vérifié** : base revenue à son état initial (6 dossiers administratifs, 0 payé, 0
intention, 0 compte de test, 0 ligne `payments` de dossier).

### CE QUE CES PREUVES NE COUVRENT PAS

Le test a parcouru le chemin **serveur** de bout en bout, sans navigateur. Restent non éprouvés :

- **Le formulaire de paiement Stripe Elements** : jamais affiché, donc jamais vu avec une clé
  publique de test. C'est le seul écran du parcours qu'aucun test n'a rendu.
- **La page d'attente `/dossier/merci`** et son interrogation du statut, jamais exécutées dans un
  navigateur.
- **Le mode production** : clés live, webhook déployé sur Vercel, `STRIPE_DOSSIER_PRICE_ID` absent.
- **Le tunnel 14 €** après la garde d'authentification, jamais rouvert connecté.

**Conséquence pour la porte administrative** : le plan conditionnait son retrait à un achat réel
**en production**, ouvert et lu. Cette condition n'est pas remplie. **Elle reste ouverte.**

---

## Fait dans cette session

### La conception, d'abord

- **`docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`** : la spec qui
  ferme la frontière laissée ouverte le 29/07 (qualification, prix, webhook, page de succès,
  instrumentation).
- **`docs/superpowers/plans/2026-07-30-qualification-checkout-dossier.md`** : neuf tâches, avec un
  journal d'exécution en fin de document.
- **`docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md`** : sonde du Référentiel National des
  Bâtiments comme couche de rattachement du DPE. **Chantier de données, hors de ce lot.**
- Deux arbitrages gravés : `docs/vault/arbitrages/refus-de-vente-sur-ancrage.md` et
  `docs/vault/arbitrages/adresse-analysee-hors-stripe.md`.

### Le code, dix commits (`3f08387` → `a076c6a`)

**`3f08387` : Aucun paiement anonyme.** `create-payment-intent` acceptait `user?.id ?? "anonymous"`
et le webhook ne pose les droits que sous `if (userId && userId !== "anonymous")` : **un visiteur
non connecté pouvait payer 14 € et ne recevoir qu'un e-mail**. Défaut qui existait en production,
sans victime puisque personne n'a payé. Vérifié : 401 sans session, 400 sur un produit inconnu.

**`162caad` : Une seule identité PostHog.** Le navigateur identifiait sur l'UUID Supabase, les
routes serveur sur l'e-mail : deux personnes distinctes, donc `payment_completed` n'appartenait pas
au parcours qui l'avait produit. Le `distinct_id` du client voyage désormais jusqu'au webhook par
les métadonnées Stripe.

**`41e4058` : La lib pure de décision.** `isSellableAnchor`, `admissibleCandidates`, 11 tests.
L'identifiant BAN portant la voie (`citycode_idvoie_numero`), l'admissibilité d'un numéro voisin est
un test de préfixe, sans seuil de distance inventé.

**`7d92ac8` : Trois sondes qui distinguent une absence d'une panne.** Sans elles, « aucun
diagnostic à cette adresse » se serait affiché pendant un incident ADEME.

**`b90c5d8` : La route de qualification.** Trois issues, deux appels externes, **aucun Géorisques**
(cette route est publique et porterait notre token).

**`dee2088` : La porte publique `/dossier`.** Saisie, trois issues, candidats proposés au clic,
trois événements.

**`5932dd1` : Le checkout du dossier.** `/checkout/dossier`, identité exigée au dernier moment
utile, adresse reconstruite depuis la BAN par le serveur, clé d'idempotence de la tentative.

**`472a5a7` : L'intention, le webhook, l'attente.** Table `dossier_intents`, création idempotente,
route de statut filtrée sur le propriétaire, page d'attente qui n'affirme jamais un dossier
inexistant.

**`73cbcc5` : L'écran vide des dossiers menait nulle part.** Il ne proposait que « revenir au
rapport » : aucun chemin vers la qualification depuis l'application.

**`a076c6a` : Journal d'exécution** dans le plan.

### La migration, appliquée en production

`supabase/26_dossier_intents.sql`, **déjà appliquée** (base `xkewgsccadjmondzmjxj`). Vérifié :
12 colonnes, RLS active, **aucune policy, aucun droit `authenticated`/`anon`**, `permission denied`
confirmé par l'API REST avec la clé publique.

---

## Ce qui a été vérifié, et comment

- 401 et 400 sur `create-payment-intent`, sans session.
- Les trois issues de qualification **contre les API réelles** : « 2 rue Crébillon » qualifiée sans
  avertissement ; « le Cros » à préciser, avec ses deux candidats de la bonne voie et **sans**
  « le Vallon » ; « 1986 le Cros » qualifiée avec `no_exact_dpe_found`.
- **Les candidats portent des points distincts** (43.281987 et 43.282393), ce qui prouve la
  correction du défaut le plus grave de la conception (voir plus bas).
- `/checkout/dossier` : 307 vers `/connexion` avec l'adresse conservée dans `next` ; 307 vers
  `/dossier` sans paramètres. La 307 prouve aussi que le segment statique prime sur `[product]`.
- 24 tests unitaires, `npx tsc --noEmit`, `npx eslint`, `npm run build` en code 0.

**Jamais vérifié** : le tunnel 14 € au navigateur après la garde d'authentification (il n'a pas de
raison d'avoir bougé, la garde étant en amont, mais personne ne l'a ouvert connecté). Et tout le
parcours payant, évidemment.

---

## Décisions prises, gravées ou à graver

1. **Porteur** : le refus de vente porte sur l'identification du bien, jamais sur la matière.
   *Gravé* (`arbitrages/refus-de-vente-sur-ancrage.md`).
2. **Porteur** : tarif d'approfondissement à **25 €** forfaitaires dès que `decidePaidTerritory` est
   vrai, quelle que soit la provenance du droit. *Dans la spec, pas encore dans
   `vision/modele-economique.md`.*
3. **Porteur** : le compte devient obligatoire **après le clic d'achat et avant la création du
   PaymentIntent**. *Dans la spec.*
4. **Proposé et retenu** : l'adresse analysée ne transite pas par Stripe. *Gravé
   (`arbitrages/adresse-analysee-hors-stripe.md`).*
5. **Proposé et retenu** : le cookie signé de parcours (`decision_journey_id`) est **abandonné au
   lancement** plutôt que promis. Le `distinct_id` PostHog persiste déjà, et une colonne sans
   écrivain est le piège refusé pour `dwelling_discriminator`.
6. **Porteur** : les liens vers la nouvelle porte depuis la landing et les pages commune
   **appartiennent au chantier visuel**, pas à celui-ci.

**À porter au vault** : le tarif 25 € dans `vision/modele-economique.md`, avec la correction déjà
signalée trois fois (l'ancre « 600 à 800 € de diagnostics » est à la charge du **vendeur**,
art. L271-4 CCH, donc fausse pour un acquéreur).

---

## Prochaine étape immédiate

**Le parcours au navigateur, avec des clés de test.** C'est le seul morceau que le test serveur n'a
pas pu couvrir, et il porte l'écran le plus visible du tunnel.

Les clés de test sont disponibles sans manipulation : la CLI Stripe est authentifiée et son fichier
de configuration porte `test_mode_api_key` et `test_mode_pub_key`, valides jusqu'au 05/09/2026.
**Next 16 refuse un second `next dev` dans le même répertoire** : servir le build par
`npx next start -p 3001` contourne le verrou sans toucher au serveur de l'autre session.

```bash
stripe listen --forward-to localhost:3001/api/stripe/webhook
# puis, avec les trois valeurs (sk_test, pk_test, whsec de la session) :
npx next start -p 3001
```

Vérifier : le formulaire de paiement s'affiche, la page d'attente bascule seule vers le dossier,
et le dossier s'ouvre. Puis **nettoyer** (voir la requête plus bas).

Ensuite : le push (seize commits), et seulement après un achat éprouvé **en production**, la
tâche 8. **`STRIPE_DOSSIER_PRICE_ID` est absente** ; elle n'est lue que pour être recopiée dans les
métadonnées, donc elle ne bloque rien, mais autant la poser.

### Nettoyer après un test

Le mode test écrit dans la **même base que la production**. Les dossiers créés comptent comme payés,
donc ils fausseraient le chiffre d'affaires et offriraient le tarif d'approfondissement. Le plus sûr
est de créer un compte de test dédié et de le supprimer : `address_dossiers`, `dossier_intents`,
`user_profiles` et `user_accounts` **cascadent**, mais `payments` passe seulement `user_id` à NULL,
donc ces lignes se suppriment à part, avant le compte.

---

## Chantiers ouverts, par priorité

**A. Les trois preuves du checkout.** Voir la section en tête.

**B. Le retrait de la porte administrative**, une fois A fait : retirer
`ENABLE_ADMIN_DOSSIER_CREATION` de l'environnement Vercel (ce geste seul suffit à fermer la porte),
supprimer les dossiers de test (`delete ... where stripe_payment_intent_id is null`), puis les trois
fichiers. **Décision porteur : elle reste ouverte jusque-là.**

**C. Les liens vers la porte** depuis la landing et les pages commune. Appartient au chantier
visuel.

**D. Le rattachement bâtimentaire RNB.** `docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md`.
Le RNB rend l'empreinte au sol d'un bâtiment depuis une clé BAN, gratuitement : de quoi remplacer le
cercle de 50 m par un test point-en-polygone. **Les 34 % de DPE « à moins de 50 m » ne sont pas tous
attribuables au bon bâtiment**, donc la couverture honnête est peut-être inférieure à 55 %.

**E. La spec B (« résolution, actualisation et vécu »).** L'intake déclaratif, la confirmation
d'actualité et d'identité du diagnostic, le numéro de DPE fourni par le lecteur. **Après le
paiement, jamais avant** : aucune déclaration ne peut fournir ce qui manque à un ancrage absent.

**F à N** : les chantiers B à I du handoff précédent restent ouverts sans changement (composition du
foyer, module Autour, conclusion déterministe, radon, teaser qui nomme la mauvaise commune, dette
`/rapport/quartier`).

---

## Pièges et fils ouverts

**Un `<Link>` vers une Route Handler ne navigue pas.** La page d'attente redirige par
`window.location` vers `/rapport/dossiers/ouvrir`, qui est un `route.ts`.

**Le webhook lève au lieu de retourner** quand l'intention manque. C'est délibéré : `POST` répond
`{ received: true }` juste après, donc un `return` ferait croire à Stripe que l'événement est traité
et il ne le rejouerait jamais. Conséquence à connaître : une erreur permanente produira des rejeux
pendant trois jours, et c'est préférable à un encaissement muet.

**L'upsert du dossier exige ses deux options.** Sans `onConflict`, Postgres arbitre sur la clé
primaire (un uuid neuf) et le conflit réel n'est jamais vu ; sans `ignoreDuplicates`, un rejeu
**écrase** le montant et la date d'achat d'un dossier déjà payé. La liste vide qu'il rend distingue
une création d'un rejeu, et c'est elle qui gouverne l'e-mail et l'événement d'achat.

**Deux défauts de conception ont été attrapés avant d'être écrits, et il faut savoir pourquoi.**
Le premier : les candidats de précision étaient qualifiés avec **les coordonnées de la voie**, donc
le cadastre aurait été sondé au centroïde pendant que l'écran affichait un numéro précis. Le
second : le lien menait à `/checkout/dossier`, une page qui n'existait pas, `/checkout/[product]`
appelant `notFound()` hors `rapport-complet`. Aucune relecture ne les avait vus ; c'est la
confrontation au code réel et aux API réelles qui les a révélés.

**`GET /search/?…&type=housenumber` ne prouve pas l'absence de numéro** : il rend zéro résultat sur
une rue pleine de numéros, le score plein texte ne les faisant pas remonter sans numéro dans la
requête. Seul `/reverse/?…&type=housenumber` répond à cette question.

**Deux sessions dans le même arbre de travail.** Stager par chemin, jamais `git add -A` : l'autre
session a déjà emporté un fichier de celle-ci dans un de ses commits (`c40a956`).

**Rappels mécaniques** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore. Un
module qui importe `server-only` casse sous `node --test`. Un commentaire JSX dans un ternaire casse
le build. Un backtick dans un commentaire CSS ferme le template literal d'un bloc `<style>`. **Écrire
une classe de caractères de contrôle en littéral dans un fichier y dépose de vrais octets NUL** :
utiliser des echappements Unicode dans la classe. Le hook de pre-commit lance `index:verify`. **Ne pas lancer
`scripts/probe-conclusion.ts`** (45 appels LLM facturés).

---

## À lire d'abord à la reprise

1. `MEMORY.md`, puis `project_droit_territorial_ecrans`, `project_module_logement`,
   `business_modele_economique`.
2. `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md` : **la doctrine fait
   foi** en cas de divergence avec le code.
3. `docs/superpowers/plans/2026-07-30-qualification-checkout-dossier.md`, dont le journal
   d'exécution et la tâche 7 étape 11 (le test à faire).
4. Les deux arbitrages du jour dans `docs/vault/arbitrages/`.
5. `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` : le socle du dossier.
6. `docs/handoff/2026-07-30-nuit-droit-territorial.md` : l'archive de la veille.
7. `docs/handoff/AUTO-SNAPSHOT.md` : **daté du 08/07, très en retard.** Ne pas s'y fier.
