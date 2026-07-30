# Passation : 30/07/2026, le parcours d'achat par l'adresse, éprouvé, vérifié, non poussé

**Horodatage** : 2026-07-30, ~13h00 · **Branche** : `main` = `171ae9a`, plus une modification non
commitée. **17 commits en attente, RIEN N'EST POUSSÉ.** Aucune PR ouverte : le projet pousse
directement sur `main` et **un push déploie en production**.

> Handoff précédent archivé dans **`docs/handoff/2026-07-30-nuit-droit-territorial.md`** (droit
> territorial cohérent, dashboard supprimé, écrans d'attente). Son chantier A, « la porte j'ai une
> adresse », est l'objet de cette session.

> **CHANTIER PARALLÈLE, autre terminal** : la refonte du langage visuel vit dans
> **`docs/handoff/2026-07-29-design-system-sequencage.md`** (commits `219bc8f`, `b44f1f0`,
> `1da154f`, `c40a956`). Cette session n'a touché aucun de ses fichiers.

---

## Objectif en cours

Le porteur a demandé **de pousser les 17 commits**, ce qui déploiera le parcours d'achat par
l'adresse en production. La vérification préalable est **terminée et verte** : 36 tests,
`npm run build` en code 0, aucune ligne d'erreur. Le push n'a pas été exécuté, la session ayant été
réorientée vers l'écriture de cette passation.

---

## Fait dans cette session

**Conception** : la spec `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`,
le plan `docs/superpowers/plans/2026-07-30-qualification-checkout-dossier.md` (9 tâches, avec un
journal d'exécution), l'audit `docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md` (sonde du
RNB, chantier de données hors périmètre), et deux arbitrages gravés dans `docs/vault/arbitrages/` :
`refus-de-vente-sur-ancrage.md`, `adresse-analysee-hors-stripe.md`.

**Code, 12 commits de `3f08387` à `171ae9a`** :

| Commit | Livrable |
|---|---|
| `3f08387` | Aucun paiement anonyme, sur les trois produits. Fermait un trou réel : un visiteur non connecté pouvait payer 14 € et ne recevoir qu'un e-mail. |
| `162caad` | Une seule identité PostHog du navigateur au webhook (le navigateur identifiait sur l'UUID Supabase, le serveur sur l'e-mail : deux personnes distinctes). |
| `41e4058` | `src/lib/dossier-qualification.ts`, lib pure de décision, 11 tests. |
| `7d92ac8` | Trois sondes qui distinguent une absence d'une panne : `probeDpeByBanId`, `probeCadastreAtPoint`, `reverseHouseNumbers`. |
| `b90c5d8` | `POST /api/dossier/qualification` et `src/lib/dossier-pricing.ts`. |
| `dee2088` | La porte publique `/dossier`. |
| `5932dd1` | `/checkout/dossier` et `src/lib/ban-verify.ts`. |
| `472a5a7` | `dossier_intents`, branche webhook idempotente, `/api/dossier/statut`, `/dossier/merci`. |
| `73cbcc5` | L'écran vide des dossiers ne menait nulle part. |
| `6a457d8` | `return_url` absolue (bug bloquant) et l'écran qui montre la matière. |
| `5dbe64c`, `4de2d35`, `772bddb`, `171ae9a` | Passation, arbitrages, pièges. |

**Migration appliquée en production** : `supabase/26_dossier_intents.sql` sur la base
`xkewgsccadjmondzmjxj`. Vérifié : 12 colonnes, RLS active, aucune policy, aucun droit
`authenticated`/`anon`, `permission denied` confirmé par l'API REST avec la clé publique.

**Preuves obtenues** (mode test Stripe, base réelle, puis nettoyées) : premier achat à 3900 avec
`amount_paid_cents` conforme au montant déclaré par Stripe et zéro `report_grant` dérivé ; rejeu du
webhook sans doublon **et sans réécriture de `purchased_at`** ; second achat au même `ban_id` à
2500. Plus : la revalidation écrase les coordonnées reçues du client, la route de statut rend
`pending` à un autre compte connecté, le double clic rend le même PaymentIntent. **Puis le parcours
complet au navigateur**, formulaire Stripe compris, validé par le porteur.

---

## Décisions prises, pas encore dans le vault

1. **Porteur** : tarif d'approfondissement à **25 €** forfaitaires dès que `decidePaidTerritory` est
   vrai, quelle que soit la provenance du droit. *À porter dans `vision/modele-economique.md`.*
2. **Porteur** : le compte devient obligatoire après le clic d'achat, avant la création du
   PaymentIntent.
3. **Porteur** : les liens vers la porte depuis la landing et les pages commune appartiennent au
   chantier visuel. `/dossier` n'est donc atteignable aujourd'hui que par URL directe ou depuis
   l'écran vide de `/rapport/dossiers`.
4. **Porteur** : le dossier de test créé au navigateur **reste sur son compte** (voir Pièges).
5. **Porteur** : la porte administrative reste ouverte jusqu'à un achat réel en production.
6. **Proposé et retenu** : l'adresse analysée ne transite pas par Stripe (gravé au vault).
7. **Proposé et retenu** : le cookie signé de parcours (`decision_journey_id`) est abandonné au
   lancement plutôt que promis ; le `distinct_id` PostHog suffit, et une colonne sans écrivain est
   le piège refusé pour `dwelling_discriminator`.
8. **Proposé et retenu** : **ne pas créer `STRIPE_DOSSIER_PRICE_ID`** dans Vercel. Un Price Stripe
   porte un montant fixe, or ce produit en a deux, décidés serveur ; le champ n'est lu par personne,
   et `STRIPE_PACK_PRICE_ID` est déjà absente sans conséquence. Motif écrit dans le code.

---

## État git

- **Branche** : `main` = `171ae9a`. **17 commits non poussés.** Aucune PR ouverte.
- **Modifié non commité** : `src/app/api/stripe/create-payment-intent/route.ts`, un commentaire
  seul (le motif du point 8). Diff relu : rien d'autre.
- **Non suivis, appartenant au chantier visuel** : `.impeccable/`, `PRODUCT.md`. Ne pas les
  committer depuis cette session. `Futur.e Design System.zip` ne doit jamais être committé.
- **Worktrees** : celui de cette session est supprimé. Reste
  `.claude/worktrees/agent-a34fa3e0af58bf46f` sur `feat/lot-a-depate-en-une-minute`, antérieur.

---

## Prochaine étape immédiate

**Committer le commentaire, puis pousser.** La vérification est déjà faite et verte, il n'y a pas à
la rejouer.

```bash
git add src/app/api/stripe/create-payment-intent/route.ts
git commit -m "STRIPE_DOSSIER_PRICE_ID n'a pas à exister : le produit a deux montants"
git push origin main     # DÉPLOIE EN PRODUCTION
```

Puis surveiller le déploiement Vercel, et faire un test de fumée en production **sans confirmer de
paiement** : `/dossier`, qualification d'une adresse, connexion, affichage du checkout.

**Si un typecheck est relancé** : `npx tsc --noEmit` exécuté **pendant** un build affiche une erreur
trompeuse, `.next/types/validator.ts … Cannot find module './routes.js'`. Elle vient des types
régénérés par le build, jamais du code. Relancer après la fin du build.

---

## À lire d'abord à la reprise

1. `MEMORY.md`, puis les fiches `project_qualification_checkout_dossier.md` (l'état de ce chantier),
   `project_droit_territorial_ecrans.md`, `business_modele_economique.md`.
2. `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md` : **la doctrine fait
   foi** en cas de divergence avec le code.
3. `docs/superpowers/plans/2026-07-30-qualification-checkout-dossier.md` : son journal d'exécution,
   et la tâche 8 (retrait de la porte administrative), encore bloquée.
4. `docs/vault/arbitrages/refus-de-vente-sur-ancrage.md` et
   `docs/vault/arbitrages/adresse-analysee-hors-stripe.md`.
5. `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` : le socle du dossier d'adresse.
6. `docs/handoff/AUTO-SNAPSHOT.md` : **daté du 08/07, très en retard.** Ne pas s'y fier.

---

## Pièges et fils ouverts

**Le push a été demandé et n'est pas fait.** C'est le premier geste attendu.

**Un dossier de TEST vit sur le compte du porteur, et il le garde délibérément** :
`ceaa8e6a-57bf-4f74-a902-934a75d04382`, 2 Rue Crébillon, 3900,
`pi_3Tyrb9RZMIJhaPi50gMK1f78`. Il provient d'un paiement en mode test. À savoir avant toute lecture
de chiffres : il compte comme payé, donc il **fausse le chiffre d'affaires** et **ouvre le tarif à
25 € sur Nantes** pour ce compte. Requête de suppression, si elle devient souhaitable :

```sql
delete from public.payments where stripe_payment_intent_id = 'pi_3Tyrb9RZMIJhaPi50gMK1f78';
delete from public.dossier_intents where stripe_payment_intent_id = 'pi_3Tyrb9RZMIJhaPi50gMK1f78';
delete from public.address_dossiers where id = 'ceaa8e6a-57bf-4f74-a902-934a75d04382';
```

**`.env.local` porte des clés Stripe LIVE.** Tout test local qui rend le formulaire de paiement doit
surcharger `sk_test_`, `pk_test_` et le `whsec_` de `stripe listen`, sinon une vraie carte est
débitée.

**`NEXT_PUBLIC_*` est inlinée au BUILD, pas lue à l'exécution.** Passer `pk_test` à
`npx next start` ne change rien : le bundle servi garde la clé du build. Pour un test navigateur, il
faut `next dev`, qui lit le processus, ou un rebuild. **Next 16 refuse un second `next dev` dans le
même répertoire** : la voie utilisée ici était un worktree git avec `node_modules` copié par liens
physiques (`cp -al`), un symlink étant refusé par Turbopack.

**Le webhook lève au lieu de retourner** quand l'intention manque : `POST` répond
`{ received: true }` juste après, donc un `return` ferait croire à Stripe que l'événement est traité
et il ne le rejouerait jamais. Conséquence assumée : une erreur permanente produit des rejeux
pendant trois jours, ce qui reste préférable à un encaissement muet.

**L'upsert du dossier exige `onConflict` ET `ignoreDuplicates`.** Sans le premier, Postgres arbitre
sur la clé primaire et le vrai conflit n'est jamais vu ; sans le second, un rejeu écrase le montant
et la date d'achat d'un dossier déjà payé. La liste vide qu'il rend distingue une création d'un
rejeu, et c'est elle qui gouverne l'e-mail et l'événement d'achat.

**`return_url` doit être absolue pour Stripe.** Un chemin relatif affiche « Not a valid URL » à la
place du formulaire, donc rien ne se paie. Normalisé dans `PaymentForm`, ne pas défaire.

**Un `<Link>` vers une Route Handler ne navigue pas.** Concerne `/rapport/dossiers/ouvrir` et
`/rapport/residence`.

**`GET /search?…&type=housenumber` ne prouve jamais l'absence de numéro** : zéro résultat sur une
rue pleine de numéros, le score plein texte ne les faisant pas remonter. Seul `/reverse` filtré
répond à cette question.

**Deux sessions dans le même arbre de travail** : stager par chemin, jamais `git add -A`. L'autre
session a déjà emporté un fichier de celle-ci dans un de ses commits (`c40a956`).

**Rappels mécaniques** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore. Un
module qui importe `server-only` casse sous `node --test`. Un commentaire JSX dans un ternaire casse
le build. Un backtick dans un commentaire CSS ferme le template literal d'un bloc `<style>`. Écrire
une classe de caractères de contrôle en littéral dépose de vrais octets NUL dans le fichier : passer
par des échappements Unicode. Le hook de pre-commit lance `index:verify`. **Ne pas lancer
`scripts/probe-conclusion.ts`** (45 appels LLM facturés).
