# Passation : 30/07/2026, le parcours d'achat par l'adresse existe, il n'a jamais encaissé

**Horodatage** : 2026-07-30 · **Branche** : `main`, **quatorze commits en attente, RIEN N'EST
POUSSÉ**, donc rien de tout ceci n'est en production. Un push déploie : ne pas pousser avant la
preuve décrite ci-dessous.

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

**Un inconnu peut qualifier une adresse gratuitement, se voir refuser, ou aller jusqu'au formulaire
de paiement ; le webhook sait créer le dossier. Aucun euro n'a été encaissé par ce chemin, et tant
que ce n'est pas fait, le checkout n'est pas terminé.**

---

## LE CHECKOUT N'EST PAS CONSIDÉRÉ TERMINÉ

Sept tâches sur neuf sont livrées, testées unitairement et vérifiées contre les API réelles. **Cela
ne vaut pas preuve.** Trois faits, et trois seulement, feront du checkout un chantier fini :

1. **Un premier achat réel** en mode test Stripe : de `/dossier` au dossier ouvert, avec une ligne
   `address_dossiers` portant `stripe_payment_intent_id`, `amount_paid_cents` égal au montant Stripe
   et `purchased_at` renseigné.
2. **Le rejeu du webhook** depuis le tableau de bord Stripe : **aucun second dossier**, et une
   réponse en succès. La contrainte unique garantit qu'un doublon échoue ; ce test garantit que le
   rejeu réussit, ce qui est une autre affirmation.
3. **Un second achat à la même adresse**, qui doit créer un second dossier légitime **à 25 €**,
   puisque la commune est alors payée.

Tant que ces trois preuves manquent : **ne pas pousser**, **ne pas retirer la porte administrative**,
et considérer que le parcours payant n'existe que sur le papier.

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

**Le test d'achat de bout en bout.** Rien d'autre ne compte tant qu'il n'est pas fait.

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Puis, connecté, sur `/dossier` : qualifier « 2 rue Crébillon Nantes », cliquer « Créer mon dossier »,
payer avec `4242 4242 4242 4242`.

Les six vérifications sont détaillées dans le plan, tâche 7, étape 11. **Une variable manque
probablement** : `STRIPE_DOSSIER_PRICE_ID`. Elle n'est lue que pour être recopiée dans les
métadonnées, donc son absence ne bloque pas, mais autant la poser avant.

Ensuite seulement : le push (quatorze commits), puis la tâche 8 (retrait de la porte
administrative), qui attend ce même achat réel.

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
