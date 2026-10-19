# FUT-115 · Octroi du Comparatif sur paiement confirmé (19/10/2026)

## A. Cause racine

Chaîne réelle avant correctif :

1. `POST /api/stripe/create-payment-intent` (`pack-decision`) crée le PaymentIntent (statut `requires_payment_method`)
   **puis écrit `pack_snapshots`** (propriétaire = compte de session), et rend au navigateur le `clientSecret`
   `pi_XXX_secret_YYY`, dont le préfixe est l'identifiant du paiement.
2. Le navigateur confirme chez Stripe, puis Stripe le renvoie sur
   `/comparateur/pack-decision?communes=…&payment_intent=pi_XXX&redirect_status=succeeded`.
3. La page (`page.tsx`) appelait `grantDecisionPackFromSnapshot(admin, pi_XXX, user.id, email)` dès que l'URL
   portait `redirect_status=succeeded`. La fonction (`decision-packs.ts`) ne vérifiait que l'appartenance de
   l'instantané au compte, puis écrivait `decision_packs`, trois `report_grants` et `user_accounts.plan = one_shot`.
4. Le webhook signé (`payment_intent.succeeded`) appelait la même fonction : idempotente (upserts), mais
   **ignorant toute erreur d'écriture** (réponse 200, Stripe ne rejoue jamais).

**Exploitation établie** (reproduite en test sur le code d'origine) : un compte connecté, avec nom de
facturation, appelle la route de paiement, lit `pi_XXX` dans la réponse, ne paie rien, et charge l'URL de
retour avec `redirect_status=succeeded`. Le comparatif, ses trois territoires et le plan payant s'ouvrent.
Aucune compétence au-delà des outils du navigateur. Aucune exploitation réelle n'a été recherchée en base.

## B. Correctif

- `src/lib/commerce/preuve-paiement-pack.ts` (pur) : `preuvePaiementPack(pi, instantané, compte?)` exige
  `status = succeeded`, 3 900 centimes (montant et montant reçu), `eur`, `productType = pack-decision`, le même
  compte dans les métadonnées, l'instantané et la session, et les mêmes communes que l'instantané.
- `grantDecisionPackFromSnapshot(admin, paiement, { attendu, email })` prend désormais un **PaymentIntent lu
  chez Stripe** et n'écrit rien sans la preuve. Toute erreur de lecture ou d'écriture lève.
- Webhook : passe l'objet signé ; un refus ou une erreur lève, donc 500 et rejeu Stripe (même doctrine que
  l'intention de dossier introuvable).
- Page de retour : `redirect_status` n'est plus lu. `traiterRetourPaiementPack` relit le paiement par
  `paymentIntents.retrieve` (clé secrète, serveur à serveur) et applique la même preuve. Justification de la
  lecture synchrone : le webhook arrive souvent après le navigateur ; sans elle, un acheteur verrait fermé ce
  qu'il vient de payer. Elle n'est pas moins fiable que le webhook : même source, même preuve.
- États du retour : comparatif ouvert ; **attente** (`processing`, `requires_action`, ou base momentanément
  indisponible) avec rechargement toutes les 3 s pendant 30 s ; sinon l'aperçu, comme avant.
- Création : une écriture d'instantané échouée renvoie 500 **avant** le `clientSecret` (elle était ignorée :
  paiement possible, livraison impossible). Le prix du comparatif vient de la constante que vérifie l'octroi.

## C. Tests

`src/lib/commerce/fut115-octroi-comparatif.test.ts` (21 tests), vrais points d'entrée (route de paiement,
webhook, logique de la page, fonction d'octroi), Stripe et base simulés en mémoire.

Refus, chacun vérifié par l'absence de lignes `decision_packs`, `report_grants`, `user_accounts` : URL
recopiée sans paiement, `requires_payment_method`, `processing`, `requires_action`, `canceled`, identifiant
inexistant, falsifié ou mal formé, paiement d'un autre compte, autre produit, montant ou devise ou montant
reçu incohérents, instantané absent ou d'un autre compte, appel direct de l'octroi (aucune écriture même
tentée), webhook à signature invalide.

Légitimes : webhook avant le retour, webhook après le retour, `processing` puis confirmation, webhook rejoué
trois fois et page rafraîchie trois fois sans duplication, rachat du même trio, écriture des droits
momentanément impossible (attente, webhook en 500, rejeu qui livre), instantané momentanément illisible,
comparatif à deux communes (Corse comprise).

Contre-épreuve (non conservée dans le dépôt) : la fonction d'origine, appelée comme la page d'origine après une
commande non payée passée par la vraie route, ouvre le comparatif, trois territoires et le plan payant ; le
code corrigé, même scénario, n'écrit rien.

Suites `src/lib/**`, décision, proxy : 2 534/2 534. `tsc`, `eslint`, `next build` verts.

## D. Compatibilité

- Aucune migration, aucun changement de schéma ni de RLS, aucune donnée touchée.
- Droits existants : lus par `resolvePackOwnership`, inchangé ; un comparatif déjà ouvert ne redemande rien à
  Stripe.
- Paiements déjà confirmés dont le webhook serait encore en rejeu : leurs métadonnées sont celles que la route
  pose depuis la création du produit (prix 39 € constant depuis `96afaa59`), la preuve les accepte.
- Facturation, e-mail et enregistrement `payments` du webhook : inchangés pour un paiement prouvé.

## E. Autres produits

- Dossier de territoire (14 €) : droit posé par le webhook seul ; `/api/territoire/activer` ne change que le
  territoire actif, l'accès reste gouverné par `canAccessTerritory`. Pas de faille équivalente.
- Dossier d'adresse : dossier créé par le webhook seul ; la page de retour interroge `/api/dossier/statut` en
  lecture. Pas de faille équivalente.

## F. Risques ouverts

- Des comparatifs ont pu être ouverts sans paiement avant ce correctif. Lecture seule à faire, sur accord :
  `decision_packs` dont le `stripe_payment_intent_id` n'a pas de ligne `payments` au statut `succeeded`. Ce sont
  des candidats, pas des preuves : chacun se confirme ensuite par son statut chez Stripe.
- Le webhook ne traite pas `charge.refunded` : un remboursement ne retire aucun droit (hors périmètre).
