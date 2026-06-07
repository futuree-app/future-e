# Paywall Pack Décision (39 €) : déverrouillage de la comparaison complète

Date : 2026-06-07
Statut : design validé en brainstorming, prêt pour writing-plans
Branche cible : `feat/paywall-pack-decision` (merge ff-only sur main)

## 1. Contexte

Le comparateur de vie `/ou-vivre` produit, à partir d'un projet de vie en langage naturel, un
trio de communes compatibles. Trois vues s'enchaînent dans `OuVivreClient` :
`results` (les cartes), `compare` (la `CompareView`, révélateur d'arbitrages gratuit), et
`complete` (la `ComparaisonCompleteView`, matrice 7 thèmes / 27 dimensions).

État actuel : la vue `complete` est atteinte par un bouton d'aperçu temporaire
(`onPreviewComplete` dans `CompareView`, ligne « Voir la comparaison complète (aperçu) »). Elle
s'affiche librement. Le CTA « Pack Décision » de la `CompareView` ne fait qu'inscrire à une liste
d'attente (`onPackDecision`). Il n'existe ni serrure, ni produit payant, ni entité d'achat.

La comparaison complète est déjà calculée côté serveur : `OuVivreClient` appelle
`/api/comparateur-vie/match`, qui exécute `matchProjects` (dans `src/lib/comparateur-vie.ts`) et
renvoie l'`outcome`, **`comparaisonComplete` compris**. Aujourd'hui ce payload payable part donc
gratuitement dans le navigateur.

Le paiement existant (rapport territoire 14 €) repose sur :
- `/checkout/[product]` + `CheckoutPaymentPanel` (Stripe PaymentIntent), produits dans
  `src/lib/checkout-products.ts` (`rapport-complet`, `suivi`).
- `/api/stripe/create-payment-intent` : pose les `metadata` (dont `targetInsee`, `targetCommune`,
  `grantSource`, `grantRank`).
- `/api/stripe/webhook` : sur `payment_intent.succeeded`, écrit `payments`, les entitlements
  `user_accounts`, et pour un territoire ciblé un `report_grants (user_id, insee)` plus le
  territoire actif de lecture.
- Gating de lecture : `report_grants` par `(user, insee)` via `resolveReadableTerritory`
  (`src/lib/active-territory.ts`).

## 2. Repositionnement produit : le 39 € est un bundle

Le Pack Décision n'est pas l'achat d'une fonctionnalité (« la comparaison »). C'est l'achat d'un
**arbitrage entre trois territoires précis, à un instant donné**. Pour 39 €, il déverrouille d'un
seul geste :

1. la **comparaison complète** (matrice 7 thèmes / 27 dimensions) du trio ;
2. les **3 rapports territoire complets** des communes du trio ;
3. **3 nouvelles pistes** : les communes suivantes (rangs 4-5-6) du même projet, révélées en
   cartes (nom, identité, 2 forces, compromis), sans rapport complet ;
4. **AskFuture : 9 questions incluses** dans le Pack Décision.

Économie : 3 rapports à 14 € valent 42 €. Le pack à 39 € est donc une offre cohérente (les 3
rapports, plus la comparaison, plus les pistes, plus AskFuture).

## 3. Principe d'identité du pack

**Un pack est identifié par le trio de communes**, pas par une commune isolée ni par un
déblocage global de compte. Clé d'unicité : `(user_id, trio_key)`, où `trio_key` est la
concaténation des 3 codes INSEE triés (ex. `12345-44135-44158`). Tu n'achètes pas « la
comparaison », tu achètes « l'arbitrage entre ces trois-là ».

**Le projet acheté est figé dans un snapshot.** Un Pack Décision représente une décision à un
instant donné. La matrice et les pistes du pack se calculent à partir d'un `parsed_snapshot`
stocké à l'achat, **jamais** à partir du projet courant du navigateur. Sans cela, un acheteur qui
revient trois mois plus tard avec un autre projet (même trio, autre intention) verrait une matrice
recalculée qu'il ne reconnaîtrait pas : il ne comprendrait plus ce qu'il a payé. Le snapshot
n'entre ni dans la clé d'unicité ni dans le prix : c'est une référence de calcul, garante de
reproductibilité.

## 4. Modèle de données : `decision_packs`

Nouvelle table, parallèle à `report_grants` (un seul système de permissions ; le pack ne
réimplémente rien, il s'appuie sur `report_grants` pour les rapports).

| colonne | rôle |
|---|---|
| `user_id` | acheteur |
| `insee_1`, `insee_2`, `insee_3` | les 3 communes du trio (rangs 1-2-3 au moment de l'achat) |
| `trio_key` | les 3 INSEE triés et joints ; **unicité `(user_id, trio_key)`** |
| `commune_1`, `commune_2`, `commune_3` | noms d'affichage |
| `projet_label` | libellé court du projet (affichage) |
| `parsed_snapshot` | jsonb : le `ParsedProject` figé à l'achat, référence de calcul de la matrice et des pistes |
| `stripe_payment_intent_id` | traçabilité |
| `created_at` | horodatage |

RLS : un utilisateur ne lit que ses propres packs (policy `decision_packs_select_own`), miroir de
`report_grants_select_own`.

L'achat crée **dans un seul webhook** : 1 ligne `decision_packs` + **3 `report_grants`** (un par
commune du trio, `source: "pack_decision"`).

## 5. Le verrou : séparation de payload serveur

Le contenu payé ne doit jamais atteindre le navigateur d'un non-acheteur. Doctrine alignée sur
`getQuartierPreview` (paywall 14 €).

**`/api/comparateur-vie/match` (gratuit)** cesse de renvoyer `comparaisonComplete` et les rangs
au-delà du top 3. Il garde résultats + `identite` / forces / `compromis` : la `CompareView` reste
entièrement gratuite.

**Nouvelle route gatée `/api/comparateur-vie/comparaison-complete`**, `POST { parsed, trioInsee }` :
- cherche un `decision_pack` pour `(user, trio_key)` reconstruit depuis `trioInsee` ;
- **si le pack existe** : calcule la matrice complète **et** les rangs 4-5-6 à partir de
  `pack.parsed_snapshot` (pas du `parsed` du client). Renvoie `{ locked: false, complete, pistes }` ;
- **sinon** : calcule un **aperçu tronqué** (1 à 2 thèmes) à partir du `parsed` courant. Renvoie
  `{ locked: true, preview }`.

Note : en cas de pack possédé, `trioInsee` suffit à identifier le pack ; on n'a pas besoin du
`parsed` client. Le `parsed` n'est utilisé que pour l'aperçu non possédé.

## 6. La porte d'achat : page de conviction dédiée

Route dédiée (ex. `/comparateur/pack-decision`), dans l'esprit de
`/territoire/[insee]/debloquer` déjà livrée. C'est une page de conviction, pas une caisse.

- Reçoit le trio (3 codes INSEE via l'URL) et lit le projet en `localStorage`
  (`futuree:projet:labels`, déjà déposé au clic « explorer »).
- **Héro de continuité** nommant les trois communes (« Vous hésitez entre Annecy, Chambéry et
  Grenoble »).
- **Aperçu réel tronqué** de la matrice, obtenu via la route gatée (`locked: true`), avec le
  garde-fou de latence du pattern 14 €.
- **« Ce que vous débloquez »** : les 3 rapports complets, la comparaison complète, 3 nouvelles
  pistes, AskFuture (9 questions incluses). La promesse produit reste simple : « 9 questions
  incluses », jamais « 3 × 3 ».
- **Pourquoi 39 €** (3 rapports valent 42 €, donc l'offre) ; aucun engagement.
- **Compte requis avant paiement** (même règle que le 14 €).
- Nouveau produit `pack-decision` (39 €) dans `checkout-products.ts`.
- `metadata` du PaymentIntent élargie pour porter les 3 INSEE, les 3 noms de communes, le
  `projet_label`, le `parsed_snapshot` (sérialisé), et `grantSource: "pack_decision"`. Si
  `parsed_snapshot` est trop volumineux pour les `metadata` Stripe (limite ~500 caractères par
  clé), on le persiste côté serveur à la création du PaymentIntent (table tampon ou colonne
  `payments`) et le webhook le relit par `payment_intent_id`. À trancher en writing-plans.

Le CTA « Pack Décision » de la `CompareView` (aujourd'hui waitlist) pointe désormais vers cette
page, en passant le trio.

## 7. L'expérience déverrouillée

Au retour de paiement, l'utilisateur revient sur la comparaison complète. La
`ComparaisonCompleteView` :
- demande la route gatée avec le `trioInsee` explicite (threadé dans la navigation, jamais
  re-dérivé d'un projet qui aurait pu changer) ;
- pack possédé : affiche la **matrice complète** calculée depuis le snapshot ;
- **3 pistes** : rangs 4-5-6 révélés en cartes style `CompareView` (nom, identité, 2 forces,
  compromis), zéro appel IA. Cadrage produit : « si aucune des trois ne vous convainc totalement,
  regardez ici », pas « trois rapports gratuits de plus » ;
- les 3 communes du trio : liens vers leur **rapport complet** (accessible via `report_grants`),
  et non plus vers la page debloquer ;
- AskFuture : **9 questions incluses**, mécanisme hérité du par-rapport (3 par `report_grant`),
  présenté comme un quota unique de pack ;
- pas de pack : vue en **aperçu tronqué** + CTA vers la page de conviction.

## 8. Doctrine respectée

- On nomme, on ne mesure pas ; pas de score brut ; pas de « rond faux ».
- Honnêteté : ne promettre que ce qui est livré. Les 3 pistes sont des pistes (révélées), pas des
  rapports. Les rapports des modules non finis ne sont pas survendus (cf. contrainte du paywall
  14 €).
- Pas de tiret cadratin dans le copy produit (virgule ou deux points).
- Tooltips ≤ 2 phrases, « pourquoi ça aide à comprendre », sans méthodo ni source.
- Largeur de texte : pas de `max-w` plus étroit que le bloc bordé.
- Piège CSS : `var(--accent)` n'existe pas ; tokens orange réels `--orange` / `--orange-tint` /
  `--orange-ring` ; côté Tailwind `text-accent` / `bg-accent` OK, mais
  `style={{ color: "var(--accent)" }}` est invalide. La `CompareView` porte ce bug latent
  (bordure / ombre du bloc Pack Décision) : à corriger au passage.

## 9. Hors-périmètre (notés, pas traités dans ce spec)

- AskFuture **transversal** au trio (questions sur la comparaison elle-même) : tranché, on reste à
  3 par rapport présentés comme 9 inclus.
- Crédit ou remboursement si une commune du trio a déjà été achetée seule à 14 €.
- Transformation des pistes (rangs 4-6) en rapports complets : elles restent révélées.
- Le **teaser** depuis la `CompareView` gratuite vers la comparaison complète : spec séparée
  (ordre imposé : la comparaison d'abord, faite ; le teaser ensuite).

## 10. Critères de réussite

- Un utilisateur sans pack n'obtient jamais `comparaisonComplete` ni les rangs 4-6 dans une
  réponse réseau (vérifiable par sonde réseau / `curl` sur `/api/comparateur-vie/match` et la
  route gatée).
- Après paiement (webhook simulé), `decision_packs` contient une ligne `(user, trio_key)` et
  `report_grants` contient 3 lignes pour les 3 INSEE.
- La comparaison complète et les 3 pistes affichées après achat sont calculées depuis le snapshot
  (stables même si le projet courant change).
- La page de conviction affiche un aperçu réel tronqué du trio acheté, jamais la matrice complète.
- `npx tsc --noEmit` propre ; `npx eslint` propre sur les fichiers touchés ; sonde dédiée
  `scripts/sonde-pack-decision.mjs` verte.
