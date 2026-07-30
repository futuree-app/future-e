# Qualification et checkout du dossier d'adresse : plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un inconnu de qualifier une adresse gratuitement, de se voir refuser la vente
quand le bien n'est pas identifiable, puis de payer 39 € (ou 25 €) et de recevoir un dossier
possédé.

**Architecture:** Une route publique de qualification décide de l'éligibilité sur l'ancrage BAN,
annonce les manques et rend un devis. L'identité est exigée au dernier moment utile, juste avant la
création du PaymentIntent, où le serveur revalide l'adresse contre la BAN, recalcule le prix et
persiste l'adresse canonique dans une table d'intention. Le webhook relit cette intention et crée la
ligne `address_dossiers`, dont l'existence **est** le droit.

**Tech Stack:** Next.js App Router (voir `node_modules/next/dist/docs/` avant d'écrire du Next),
Supabase (service role pour toute écriture de dossier), Stripe PaymentIntents, PostHog, API BAN, API
Carto cadastre, API ADEME. Tests en `node:test` sur des libs pures.

**Spec de référence :** `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`.
**La doctrine fait foi** en cas de divergence avec ce plan.

## Global Constraints

- **Aucun `INSERT` / `UPDATE` direct sur `address_dossiers` pour `authenticated`.** Toute écriture
  passe par le service role. Les policies d'écriture ont été supprimées, `select_own` seule subsiste.
- **Un `<Link>` vers une Route Handler ne navigue pas.** Tout lien vers un `route.ts` est un `<a>`.
- **Code INSEE, jamais code postal.** Un code postal fait échouer ADEME, DRIAS et Hub'Eau en silence.
- **PLM** : `communeParent()` (`src/lib/plm.ts`) sert au droit et au prix ; la colonne `insee` d'un
  dossier garde le code local de l'arrondissement. Ne jamais normaliser la colonne.
- **Géorisques n'est jamais appelé depuis une route publique.** Notre token y est engagé.
- **Une panne de source ne se présente jamais comme une absence de donnée.**
- **Aucune donnée décidant de l'éligibilité ou du prix ne vient du navigateur sans vérification
  serveur.** La matière se met en cache par adresse ; les droits et le prix jamais.
- **Prix, en centimes, serveur uniquement** : `fullCents: 3900`, `deepeningCents: 2500`.
- **`amount_paid_cents` s'écrit depuis `paymentIntent.amount`**, jamais depuis un montant préparé.
- Un module qui importe `server-only` **casse sous `node --test`** : toute lib testée reste pure.
- `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore : un lint vert ne dit rien
  d'eux. Lancer les tests explicitement.
- Un commentaire JSX `{/* … */}` dans un ternaire casse le build. Un backtick dans un commentaire CSS
  ferme le template literal d'un bloc `<style>{`…`}</style>`.
- Le hook de pre-commit lance `index:verify`. Push direct sur `main`, **un push déploie en
  production**. Ne pas pousser sans le dire.
- **Deux sessions peuvent travailler dans cet arbre** : stager par chemin, jamais `git add -A`.
- Commande de test : `node --test src/lib/<fichier>.test.ts` (Node 25, type stripping natif, imports
  avec l'extension `.ts`).

---

## Structure des fichiers

**Libs pures (testables, aucun `server-only`)**

| Fichier | Responsabilité |
|---|---|
| `src/lib/posthog-identity.ts` | Assainir un `distinct_id` reçu du client, avec repli |
| `src/lib/dossier-qualification.ts` | Décider l'ancrage, filtrer les candidats de précision |
| `src/lib/dossier-pricing.ts` | Le devis : base, déduction, montant dû |
| `src/lib/ban-verify.ts` | Choisir dans une liste de features BAN celle dont l'id correspond |

**Sondes de sources (serveur, distinguent panne et absence)**

| Fichier | Responsabilité |
|---|---|
| `src/lib/dpe.ts` (modifié) | `probeDpeByBanId` : `found` / `none` / `unavailable` |
| `src/lib/cadastre.ts` (modifié) | `probeCadastreAtPoint` : idem |
| `src/lib/ban.ts` (modifié) | `reverseHouseNumbers`, `fetchBanFeaturesByLabel` |

**Routes**

| Fichier | Responsabilité |
|---|---|
| `src/app/api/dossier/qualification/route.ts` | La qualification publique |
| `src/app/api/dossier/statut/route.ts` | Le dossier d'un paiement, filtré sur son propriétaire |
| `src/app/api/stripe/create-payment-intent/route.ts` (modifié) | Garde d'auth, branche `address-dossier` |
| `src/app/api/stripe/webhook/route.ts` (modifié) | Branche `address-dossier`, création idempotente |

**Écrans**

| Fichier | Responsabilité |
|---|---|
| `src/app/(public)/dossier/page.tsx` | La porte, publique |
| `src/app/(public)/dossier/DossierQualificationClient.tsx` | Saisie, issues, candidats, CTA |
| `src/app/(public)/checkout/dossier/page.tsx` | Identité exigée, adresse revalidée, devis final |
| `src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx` | Le formulaire de paiement du dossier |
| `src/app/(account)/dossier/merci/page.tsx` | Attente du webhook, puis ouverture |

**Migration** : `supabase/26_dossier_intents.sql`.

---

### Task 1: La garde d'authentification sur le paiement

Ferme un trou en production : un visiteur non connecté peut aujourd'hui payer 14 € et ne recevoir
qu'un e-mail, parce que `create-payment-intent` accepte `"anonymous"` et que le webhook ne pose les
droits que si un `userId` existe.

**Files:**
- Modify: `src/app/api/stripe/create-payment-intent/route.ts:36-46` (bloc `supabase`/`getUser`)

**Interfaces:**
- Consumes: rien.
- Produces: garantie que `paymentIntent.metadata.userId` n'est jamais `"anonymous"`. Les tâches 6 et
  7 en dépendent.

- [ ] **Step 1: Déplacer la lecture de l'utilisateur avant toute création Stripe, et refuser sans lui**

Dans `POST`, le bloc actuel lit l'utilisateur après avoir validé le produit et juste avant
`getStripe()`. Remplacer :

```ts
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const stripe = getStripe();
```

par :

```ts
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // AUCUN PAIEMENT ANONYME, POUR AUCUN DES TROIS PRODUITS. Chacun livre un droit rattaché à un
    // compte : le 14 € pose un report_grant sur un user_id, le Pack en pose trois, le dossier crée
    // une ligne address_dossiers dont la colonne user_id est `not null`. Sans utilisateur, le
    // webhook encaissait et ne livrait rien (il garde `if (userId && userId !== "anonymous")`),
    // donc l'acheteur recevait un e-mail et zéro accès.
    if (!user) {
      return NextResponse.json(
        { error: "Connexion requise pour finaliser un achat.", code: "AUTH_REQUIRED" },
        { status: 401 },
      );
    }

    const stripe = getStripe();
```

Puis, dans l'objet `metadata`, remplacer les replis devenus impossibles :

```ts
        userId: user.id,
        userEmail: user.email ?? "",
```

Et dans le `posthog.capture` de fin, remplacer `distinctId: user?.email ?? "anonymous"` par
`distinctId: user.email ?? user.id` et `user_id: user?.id ?? null` par `user_id: user.id`.

Enfin, dans le bloc `pack_snapshots` (`admin.from("pack_snapshots").upsert`), remplacer
`user_id: user?.id ?? null` par `user_id: user.id`.

- [ ] **Step 2: Vérifier le refus, sans session**

Lancer le serveur (`npm run dev`) puis :

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" -d '{"productType":"one-shot"}'
```

Attendu : `401`. Avant le correctif, cette commande rendait `200` et créait un PaymentIntent réel
chez Stripe.

- [ ] **Step 3: Vérifier qu'un produit inconnu répond toujours 400 avant l'authentification**

```bash
curl -s -X POST http://localhost:3000/api/stripe/create-payment-intent \
  -H "Content-Type: application/json" -d '{"productType":"inexistant"}'
```

Attendu : `{"error":"Produit inconnu."}`. La validation du produit reste en amont de la garde, ce
qui permet à un visiteur de découvrir qu'un slug existe (400 contre 401) : les noms de produits sont
publics, ils figurent dans les URL du site, donc l'ordre est choisi pour la clarté du message
d'erreur plutôt que pour une confidentialité qui n'a pas d'objet.

- [ ] **Step 4: Vérifier que le tunnel 14 € connecté fonctionne encore**

Au navigateur, connecté, ouvrir `/checkout/rapport-complet`. Le formulaire de paiement doit
s'afficher comme avant (le `clientSecret` arrive). **Ne pas payer.**

- [ ] **Step 5: Committer**

```bash
git add src/app/api/stripe/create-payment-intent/route.ts
git commit -m "Aucun paiement anonyme : trois produits livrent un droit rattaché à un compte"
```

---

### Task 2: Une seule identité PostHog du navigateur au webhook

Aujourd'hui le navigateur identifie sur l'UUID Supabase (`PostHogProvider.tsx:52`) et les événements
serveur émettent sur l'e-mail : deux personnes distinctes dans PostHog, donc un achat qui
n'appartient pas au parcours qui l'a produit. Le patron correct existe déjà dans
`comparateur-vie/ask/route.ts:70` (le client transmet son `distinct_id`).

**Files:**
- Create: `src/lib/posthog-identity.ts`
- Create: `src/lib/posthog-identity.test.ts`
- Modify: `src/components/PaymentWrapper.tsx:43-51` (corps de requête)
- Modify: `src/app/api/stripe/create-payment-intent/route.ts` (lecture, métadonnée, capture)
- Modify: `src/app/api/stripe/webhook/route.ts:77` et `:157` (distinctId)

**Interfaces:**
- Consumes: la garde d'auth de la tâche 1.
- Produces: `sanitizeDistinctId(input: unknown, fallback: string): string` ;
  `paymentIntent.metadata.phDistinctId` disponible pour le webhook.

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/lib/posthog-identity.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { sanitizeDistinctId } from "./posthog-identity.ts";

test("garde un identifiant PostHog plausible", () => {
  assert.equal(
    sanitizeDistinctId("0197f3a2-1b2c-7000-8000-abcdef012345", "repli"),
    "0197f3a2-1b2c-7000-8000-abcdef012345",
  );
});

test("retombe sur le repli quand la valeur est absente ou vide", () => {
  assert.equal(sanitizeDistinctId(undefined, "repli"), "repli");
  assert.equal(sanitizeDistinctId("", "repli"), "repli");
  assert.equal(sanitizeDistinctId("   ", "repli"), "repli");
  assert.equal(sanitizeDistinctId(42, "repli"), "repli");
});

test("refuse une valeur trop longue plutôt que de la tronquer", () => {
  // Tronquer fabriquerait un identifiant qui ressemble à un vrai et agrège deux personnes.
  assert.equal(sanitizeDistinctId("x".repeat(201), "repli"), "repli");
});

test("refuse les caractères de contrôle et les sauts de ligne", () => {
  assert.equal(sanitizeDistinctId("abc\ndef", "repli"), "repli");
  // Espace INTERNE : « abc » suivi d'un espace serait accepté, le trim l'ayant retiré.
  assert.equal(sanitizeDistinctId("abc def", "repli"), "repli");
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `node --test src/lib/posthog-identity.test.ts`
Expected: FAIL, `Cannot find module './posthog-identity.ts'`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `src/lib/posthog-identity.ts` :

```ts
// Le distinct_id de PostHog voyage du navigateur au serveur, puis jusqu'au webhook par les
// métadonnées Stripe. Sans lui, les événements serveur créent une SECONDE personne : le navigateur
// identifie sur l'UUID Supabase (PostHogProvider), les routes émettaient sur l'e-mail, donc l'achat
// n'appartenait pas au parcours qui l'a produit.
//
// Pas de `server-only` : la fonction est pure et testée sous `node --test`.

const MAX_LEN = 200;

export function sanitizeDistinctId(input: unknown, fallback: string): string {
  if (typeof input !== "string") return fallback;
  const trimmed = input.trim();
  if (!trimmed) return fallback;
  // Refuser plutôt que tronquer : un identifiant coupé ressemble à un vrai et fusionnerait
  // silencieusement deux personnes.
  if (trimmed.length > MAX_LEN) return fallback;
  // Caractères de contrôle et espaces INTERNES : un identifiant qui en porte vient d'un client
  // bricolé, et il polluerait la table des personnes de l'outil de mesure.
  if (/[\u0000-\u001f\u007f\s]/.test(trimmed)) return fallback;
  return trimmed;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `node --test src/lib/posthog-identity.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Transmettre le distinct_id depuis le formulaire de paiement**

Dans `src/components/PaymentWrapper.tsx`, ajouter l'import et la lecture, sur le patron de
`OuVivreClient.tsx:202` :

```ts
import posthog from "posthog-js";

function clientDistinctId(): string | undefined {
  try {
    return posthog.get_distinct_id?.() ?? undefined;
  } catch {
    return undefined;
  }
}
```

Puis, dans `requestBody` :

```ts
  const requestBody = JSON.stringify({
    amount,
    productType,
    targetInsee: grant?.targetInsee,
    targetCommune: grant?.targetCommune,
    source: grant?.source,
    rank: grant?.rank,
    pack,
    phDistinctId: clientDistinctId(),
  });
```

**Attention** : `requestBody` sert aussi de `requestKey` dans le `useEffect`. `get_distinct_id()`
est stable pour une session, donc la clé ne change pas à chaque rendu. Si le SDK n'est pas prêt, la
valeur est `undefined` et disparaît du JSON, ce qui reste stable.

- [ ] **Step 6: Lire et propager côté route de paiement**

Dans `create-payment-intent/route.ts`, la destructuration du corps devient (le renommage est
nécessaire : la valeur brute et la valeur assainie ne peuvent pas porter le même nom) :

```ts
import { sanitizeDistinctId } from "@/lib/posthog-identity";

// …
    const {
      productType, targetInsee, targetCommune, source, rank, pack,
      phDistinctId: phDistinctIdRaw,
    } = await request.json();

    // … après la garde d'authentification, `user` est garanti :
    const phDistinctId = sanitizeDistinctId(phDistinctIdRaw, user.id);
```

L'ajouter aux `metadata` du PaymentIntent (`phDistinctId`), et remplacer le `distinctId` du
`posthog.capture` final par `phDistinctId`.

- [ ] **Step 7: Lire le distinct_id dans le webhook**

Dans `webhook/route.ts`, `handleSucceededPayment`, ajouter `phDistinctId` à la destructuration des
métadonnées, puis remplacer les deux `distinctId` (lignes 77 et 157) par :

```ts
  // Le seul point du parcours sans navigateur : l'identité voyage par les métadonnées Stripe.
  // Sans elle, `payment_completed` créait une personne distincte de celle qui a cliqué.
  const distinctId = sanitizeDistinctId(phDistinctId, userId || paymentIntent.id);
```

- [ ] **Step 8: Vérifier au navigateur, connecté**

Ouvrir `/checkout/rapport-complet`, onglet réseau, inspecter le corps envoyé à
`create-payment-intent` : il doit porter `phDistinctId`, égal à la valeur de
`posthog.get_distinct_id()` en console. Dans PostHog, `payment_intent_created` doit apparaître **sur
la même personne** que les événements de navigation.

- [ ] **Step 9: Committer**

```bash
git add src/lib/posthog-identity.ts src/lib/posthog-identity.test.ts \
        src/components/PaymentWrapper.tsx \
        src/app/api/stripe/create-payment-intent/route.ts \
        src/app/api/stripe/webhook/route.ts
git commit -m "Une seule identité PostHog du navigateur au webhook"
```

---

### Task 3: La lib pure de décision (ancrage et candidats)

Le cœur doctrinal, sans réseau ni base : ce qui rend une adresse vendable, et quels numéros proches
sont admissibles.

**Files:**
- Create: `src/lib/dossier-qualification.ts`
- Create: `src/lib/dossier-qualification.test.ts`

**Interfaces:**
- Consumes: rien.
- Produces:
  - `type ReverseHit = { banId: string; label: string; citycode: string | null; distanceM: number }`
  - `type NearbyHouseNumber = { banId: string; label: string; distanceM: number }`
  - `isSellableAnchor(type: string | null): boolean`
  - `admissibleCandidates(selected: { banId: string; citycode: string; type: string | null }, hits: ReverseHit[]): NearbyHouseNumber[]`
  - `MAX_CANDIDATES = 5`

- [ ] **Step 1: Écrire le test qui échoue**

Créer `src/lib/dossier-qualification.test.ts`. Les identifiants viennent d'appels réels du
30/07/2026 (« le Cros », Méounes-lès-Montrieux, 83136) :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import {
  isSellableAnchor,
  admissibleCandidates,
  type ReverseHit,
} from "./dossier-qualification.ts";

test("seul un numéro d'adresse est un ancrage vendable", () => {
  assert.equal(isSellableAnchor("housenumber"), true);
  assert.equal(isSellableAnchor("street"), false);
  assert.equal(isSellableAnchor("locality"), false);
  assert.equal(isSellableAnchor("municipality"), false);
  assert.equal(isSellableAnchor(null), false);
});

// L'identifiant BAN d'un numéro est `citycode_idvoie_numero`. Vérifié le 30/07/2026 :
// la voie « le Cros » est 83077_i1no3t, « 1986 le Cros » est 83077_i1no3t_01986.
const hit = (banId: string, label: string, distanceM: number, over: Partial<ReverseHit> = {}): ReverseHit => ({
  banId, label, distanceM,
  citycode: "83077", city: "Méounes-lès-Montrieux", postcode: "83136",
  latitude: 43.2819, longitude: 5.9780,
  ...over,
});

const hits: ReverseHit[] = [
  hit("83077_i1no3t_01986", "1986 le Cros", 9),
  hit("83077_rbzfxz_00850", "850 le Vallon", 44),
  hit("83077_rbzfxz_00771", "771 le Vallon", 44),
  hit("83077_i1no3t_00451", "451 le Cros", 58),
];

test("sur une voie, seuls les numéros de CETTE voie sont admissibles", () => {
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    hits,
  );
  assert.deepEqual(out.map((c) => c.banId), ["83077_i1no3t_01986", "83077_i1no3t_00451"]);
});

test("aucun seuil de distance : un numéro de la bonne voie à 58 m reste admissible", () => {
  // C'est la raison pour laquelle un MAX_DISTANCE de 50 m est refusé : il aurait écarté
  // « 451 le Cros », qui est légitime.
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    hits,
  );
  assert.ok(out.some((c) => c.distanceM === 58));
});

test("sur un lieu-dit, le filtre se réduit à la commune, dans un périmètre borné", () => {
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    hits,
  );
  assert.equal(out.length, 4);
  assert.deepEqual(out.map((c) => c.distanceM), [9, 44, 44, 58]);
});

test("sur un lieu-dit, un numéro hors du périmètre n'est jamais proposé", () => {
  // Sans borne, le reverse rendrait le numéro le plus proche même à des kilomètres, et
  // l'écran proposerait une adresse sans rapport avec le bien cherché. Le préfixe de voie
  // protège la branche `street` ; le lieu-dit n'a pas de voie pour le faire.
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    [hit("83077_zzz_00001", "1 Très Loin", 900)],
  );
  assert.deepEqual(out, []);
});

test("une commune saisie seule ne propose AUCUN candidat", () => {
  // « Kerlaz Locronan » rend une feature `municipality` dont le reverse voisin est
  // « 13 Rue Moal » à 0 m, au centre du bourg. Proposer cinq numéros du centre à qui n'a
  // saisi qu'un nom de commune n'aurait aucun sens : le geste attendu est de saisir une
  // adresse, pas de choisir dans une liste arbitraire.
  const out = admissibleCandidates(
    { banId: "29136", citycode: "29136", type: "municipality" },
    [hit("29136_aaa_00013", "13 Rue Moal", 0, { citycode: "29136" })],
  );
  assert.deepEqual(out, []);
});

test("un candidat d'une autre commune n'est jamais proposé", () => {
  const out = admissibleCandidates(
    { banId: "83077_xyz", citycode: "83077", type: "locality" },
    [...hits, hit("83999_aaa_00001", "1 rue Ailleurs", 2, { citycode: "83999" })],
  );
  assert.ok(!out.some((c) => c.banId.startsWith("83999")));
});

test("cinq candidats au plus, les plus proches", () => {
  const many: ReverseHit[] = Array.from({ length: 9 }, (_, i) =>
    hit(`83077_i1no3t_0000${i}`, `${i} le Cros`, 100 - i));
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    many,
  );
  assert.equal(out.length, 5);
  assert.deepEqual(out.map((c) => c.distanceM), [92, 93, 94, 95, 96]);
});

test("la voie ne matche jamais par préfixe partiel", () => {
  // 83077_i1no3 est un préfixe textuel de 83077_i1no3t : sans le séparateur, un numéro
  // d'une autre voie passerait pour un numéro de celle-ci.
  const out = admissibleCandidates(
    { banId: "83077_i1no3", citycode: "83077", type: "street" },
    hits,
  );
  assert.deepEqual(out, []);
});

test("aucun candidat admissible rend une liste vide, jamais null", () => {
  const out = admissibleCandidates(
    { banId: "83077_i1no3t", citycode: "83077", type: "street" },
    [],
  );
  assert.deepEqual(out, []);
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `node --test src/lib/dossier-qualification.test.ts`
Expected: FAIL, `Cannot find module './dossier-qualification.ts'`.

- [ ] **Step 3: Écrire l'implémentation minimale**

Créer `src/lib/dossier-qualification.ts` :

```ts
// ════════════════════════════════════════════════════════════════════════════
// La décision de vente, séparée de tout accès réseau. Pas de `server-only` : testée sous
// `node --test`.
//
// LE REFUS PORTE SUR L'IDENTIFICATION DU BIEN, JAMAIS SUR LA MATIÈRE DISPONIBLE. Sous une feature
// `street` ou `locality`, le point désigne le centre d'une voie ou d'un lieu-dit : les distances
// d'Autour se calculeraient depuis le mauvais endroit et la parcelle trouvée pourrait être celle
// d'un tiers. Le défaut ne serait pas un dossier incomplet, ce serait un dossier PRÉCIS SUR LE
// MAUVAIS OBJET.
//
// L'absence de diagnostic ne refuse rien (35 à 53 % des adresses), l'absence de parcelle non plus
// (le rapport garde neuf sources au point sans elle).
// ════════════════════════════════════════════════════════════════════════════

export const MAX_CANDIDATES = 5;

// Périmètre de PROPOSITION pour un lieu-dit, jamais un seuil de qualité. Convention nommée et
// versionnée, sur le patron de CARTOFRICHES_RAYON_RECHERCHE_M. Mesuré le 30/07/2026 sur six
// hameaux (Aubrac, Doubs, Queyras, Lozère, Var) : le premier numéro est entre 3 et 59 m. Au-delà
// de ce périmètre, un numéro n'a plus de rapport crédible avec le lieu-dit saisi, et un refus
// honnête vaut mieux qu'un candidat lointain. À réviser si les refus abondent.
export const LOCALITY_RADIUS_M = 150;

// Un candidat porte SES coordonnées. Sans elles, sélectionner « 1986 le Cros » relancerait la
// qualification avec l'identifiant du numéro et le POINT DE LA VOIE : le cadastre serait sondé au
// centroïde, et l'écran annoncerait une parcelle (ou son absence) sur le mauvais endroit. C'est
// très exactement le faux ancrage que la doctrine du refus existe pour empêcher.
export type ReverseHit = {
  banId: string;
  label: string;
  citycode: string | null;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export type NearbyHouseNumber = {
  banId: string;
  label: string;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  distanceM: number;
};

export function isSellableAnchor(type: string | null): boolean {
  return type === "housenumber";
}

// L'identifiant BAN d'un numéro est `citycode_idvoie_numero`. La compatibilité de voie est donc un
// test de PRÉFIXE, exact et sans heuristique sur les libellés : « le Vallon » (83077_rbzfxz_00850)
// tombe mécaniquement face à « le Cros » (83077_i1no3t). Le séparateur final est obligatoire, sinon
// `83077_i1no3` matcherait `83077_i1no3t_01986`.
//
// AUCUN SEUIL DE DISTANCE. « 451 le Cros » est à 58 m sur la bonne voie : tout MAX_DISTANCE de
// 50 m aurait écarté un numéro légitime, et aucune valeur ne serait défendable. La distance sert
// au TRI et à l'AFFICHAGE.
export function admissibleCandidates(
  selected: { banId: string; citycode: string; type: string | null },
  hits: ReverseHit[],
): NearbyHouseNumber[] {
  // Une commune saisie seule ne se précise pas par une liste : le geste attendu est de saisir une
  // adresse. Proposer les numéros du centre-bourg serait arbitraire.
  if (selected.type !== "street" && selected.type !== "locality") return [];

  const sameStreet = selected.type === "street";
  const prefix = `${selected.banId}_`;

  return hits
    .filter((h) => h.citycode === selected.citycode)
    .filter((h) =>
      sameStreet ? h.banId.startsWith(prefix) : h.distanceM <= LOCALITY_RADIUS_M,
    )
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, MAX_CANDIDATES)
    .map(({ banId, label, city, postcode, latitude, longitude, distanceM }) => ({
      banId, label, city, postcode, latitude, longitude, distanceM,
    }));
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `node --test src/lib/dossier-qualification.test.ts`
Expected: PASS, 8 tests.

- [ ] **Step 5: Committer**

```bash
git add src/lib/dossier-qualification.ts src/lib/dossier-qualification.test.ts
git commit -m "L'identifiant BAN porte la voie : l'admissibilité d'un numéro est un préfixe, pas un rayon"
```

---

### Task 4: Les sondes de sources, qui distinguent panne et absence

`getDpeCandidatesByBanId` et `findCadastreParcelByPoint` rendent `[]` ou `null` aussi bien quand la
source répond « rien » que quand elle ne répond pas (`fetchLines` retourne `[]` si `!res.ok`). Dire
« aucun diagnostic à cette adresse » pendant une panne de l'ADEME violerait l'invariant central.

**Files:**
- Modify: `src/lib/dpe.ts` (ajout d'un export, aucune fonction existante touchée)
- Modify: `src/lib/cadastre.ts` (ajout d'un export)
- Modify: `src/lib/ban.ts` (ajout de `reverseHouseNumbers`)

**Interfaces:**
- Consumes: `ReverseHit` de la tâche 3.
- Produces:
  - `probeDpeByBanId(banId: string): Promise<{ status: "found" | "none" | "unavailable"; count: number }>`
  - `probeCadastreAtPoint(lon: number, lat: number): Promise<{ status: "found" | "none" | "unavailable" }>`
  - `reverseHouseNumbers(lon: number, lat: number): Promise<ReverseHit[] | null>` (`null` = panne)

- [ ] **Step 1: Ajouter la sonde DPE**

Dans `src/lib/dpe.ts`, après `getDpeCandidatesByBanId`, ajouter :

```ts
// Sonde de QUALIFICATION : dit si un diagnostic EXACT existe à cet identifiant BAN, et distingue
// l'absence de la panne. `fetchLines` rend `[]` dans les deux cas, ce qui ferait annoncer « aucun
// diagnostic » pendant un incident ADEME.
//
// Elle ne cherche PAS par coordonnées : un DPE à 50 m est un candidat à confirmer (doctrine
// B2_NEARBY_UNCONFIRMED), et l'annoncer avant paiement promettrait une matière que le produit
// refuse d'affirmer après l'achat.
export async function probeDpeByBanId(
  banId: string,
): Promise<{ status: "found" | "none" | "unavailable"; count: number }> {
  let sawFailure = false;
  let count = 0;

  for (const dataset of [DS.existant, DS.neuf]) {
    const url = new URL(`${dataset}/lines`);
    url.searchParams.set("qs", `identifiant_ban:"${banId}"`);
    url.searchParams.set("size", "5");
    url.searchParams.set("select", "numero_dpe");
    try {
      // Timeout explicite : sans lui, une ADEME lente bloque une route publique jusqu'au timeout
      // de la plateforme, et le lecteur regarde un écran vide au lieu de lire un avertissement.
      const res = await fetch(url.toString(), {
        next: { revalidate: 86400 },
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) {
        sawFailure = true;
        continue;
      }
      const json = (await res.json()) as { results?: unknown[] };
      count += json.results?.length ?? 0;
    } catch {
      sawFailure = true;
    }
  }

  if (count > 0) return { status: "found", count };
  // Une absence n'est affirmée que si les DEUX jeux ont RÉPONDU. Sinon on ne sait pas.
  return sawFailure ? { status: "unavailable", count: 0 } : { status: "none", count: 0 };
}
```

- [ ] **Step 2: Ajouter la sonde cadastre**

Dans `src/lib/cadastre.ts`, ajouter :

```ts
// Sonde de QUALIFICATION : la lecture parcellaire sera-t-elle disponible pour ce point ? L'absence
// de parcelle ne refuse RIEN (le rapport garde Géorisques au point, les cavités, le GPU,
// Cartofriches, l'IRIS). Elle est seulement annoncée avant le paiement.
export async function probeCadastreAtPoint(
  longitude: number,
  latitude: number,
): Promise<{ status: "found" | "none" | "unavailable" }> {
  try {
    // UN SEUL APPEL, AU POINT. `findCadastreParcelByPoint` retombe sur des carrés de 3, 8 puis
    // 15 m quand le point ne tombe dans aucune parcelle : quatre requêtes, acceptables pour un
    // dossier payé, trop pour une route publique à haut volume.
    //
    // Divergence assumée, et elle va dans le bon sens : la qualification peut annoncer
    // « lecture parcellaire indisponible » là où le dossier la trouvera par repli. On promet
    // moins que ce qu'on livre, jamais l'inverse.
    const features = await fetchCadastreFeatures(
      { type: "Point", coordinates: [longitude, latitude] },
      1,
    );
    return { status: toCadastreParcel(features[0]) ? "found" : "none" };
  } catch {
    // Une panne réseau ne se traduit JAMAIS en « aucune parcelle ».
    return { status: "unavailable" };
  }
}
```

- [ ] **Step 3: Ajouter le reverse filtré sur les numéros**

Dans `src/lib/ban.ts`, ajouter :

```ts
import type { ReverseHit } from "./dossier-qualification.ts";

const BAN_REVERSE_URL = "https://api-adresse.data.gouv.fr/reverse/";

// Les numéros d'adresse autour d'un point. SEUL moyen de savoir si un lieu-dit porte des numéros :
// `GET /search/?q=…&type=housenumber` rend ZÉRO résultat sur une rue pleine de numéros (le score
// plein texte ne fait pas remonter les numéros quand la requête n'en porte pas), vérifié sur
// « rue Crébillon » à Nantes le 30/07/2026.
//
// `null` = panne. Une liste vide affirme l'absence de numéro, ce qui refuse une vente : elle ne
// doit jamais venir d'un appel qui a échoué.
export async function reverseHouseNumbers(
  longitude: number,
  latitude: number,
): Promise<ReverseHit[] | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const url = new URL(BAN_REVERSE_URL);
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("type", "housenumber");
    url.searchParams.set("limit", "10");

    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 86400 },
      signal: controller.signal,
    });
    if (!res.ok) return null;

    const json = (await res.json()) as {
      features?: { properties?: Record<string, unknown>; geometry?: unknown }[];
    };
    return (json.features ?? []).flatMap((f) => {
      const p = f.properties ?? {};
      const banId = typeof p.id === "string" ? p.id : null;
      const label = typeof p.label === "string" ? p.label : null;
      const distance = typeof p.distance === "number" ? p.distance : null;
      if (!banId || !label || distance === null) return [];
      // La GÉOMÉTRIE, pas seulement les propriétés : c'est le point du numéro, et c'est lui qui
      // doit servir à qualifier si le lecteur choisit ce candidat.
      const coords = (f.geometry as { coordinates?: [number, number] } | undefined)?.coordinates;
      if (!coords || coords.length !== 2) return [];
      return [{
        banId,
        label,
        citycode: typeof p.citycode === "string" ? p.citycode : null,
        city: typeof p.city === "string" ? p.city : null,
        postcode: typeof p.postcode === "string" ? p.postcode : null,
        longitude: coords[0],
        latitude: coords[1],
        distanceM: distance,
      }];
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
```

- [ ] **Step 4: Vérifier les trois sondes contre les API réelles**

```bash
node --input-type=module -e '
const { reverseHouseNumbers } = await import("./src/lib/ban.ts");
console.log("le Cros  :", (await reverseHouseNumbers(5.978039, 43.28191))?.slice(0,2));
console.log("Crebillon:", (await reverseHouseNumbers(-1.559088, 47.214331))?.slice(0,1));
'
```

Attendu : « 1986 le Cros » à 9 m pour le premier, « 2 Rue Crébillon » à ~4 m pour le second.

**Note** : `dpe.ts` importe `server-only`, donc `probeDpeByBanId` ne se teste pas sous `node --test`
ni par cette commande. Elle se vérifie par la route de la tâche 5.

- [ ] **Step 5: Vérifier que le typecheck passe**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Committer**

```bash
git add src/lib/dpe.ts src/lib/cadastre.ts src/lib/ban.ts
git commit -m "Trois sondes qui distinguent une absence d'une panne"
```

---

### Task 5: La route de qualification

**Files:**
- Create: `src/app/api/dossier/qualification/route.ts`
- Create: `src/lib/dossier-pricing.ts`
- Create: `src/lib/dossier-pricing.test.ts`

**Interfaces:**
- Consumes: `isSellableAnchor`, `admissibleCandidates`, `MAX_CANDIDATES` (tâche 3) ;
  `probeDpeByBanId`, `probeCadastreAtPoint`, `reverseHouseNumbers` (tâche 4) ;
  `validateSelectedBanAddress` (`src/lib/selected-ban-address.ts`) ;
  `hasPaidTerritory(supabase, userId, insee)` (`src/lib/active-territory.ts`) ;
  `communeParent` (`src/lib/plm.ts`).
- Produces:
  - `DOSSIER_PRICE = { fullCents: 3900, deepeningCents: 2500, territoryDeductionCents: 1400 }`
  - `quoteForDossier(hasPaidTerritory: boolean): { basePriceCents: number; territoryDeductionCents: number; amountDueCents: number }`
  - `POST /api/dossier/qualification` rendant le `QualificationOutcome` de la spec.

- [ ] **Step 1: Écrire le test du devis, qui échoue**

Créer `src/lib/dossier-pricing.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { DOSSIER_PRICE, quoteForDossier } from "./dossier-pricing.ts";

test("plein tarif quand le territoire n'a pas été payé", () => {
  assert.deepEqual(quoteForDossier(false), {
    basePriceCents: 3900,
    territoryDeductionCents: 0,
    amountDueCents: 3900,
  });
});

test("tarif d'approfondissement quand le territoire a été payé", () => {
  assert.deepEqual(quoteForDossier(true), {
    basePriceCents: 3900,
    territoryDeductionCents: 1400,
    amountDueCents: 2500,
  });
});

test("la déduction est exactement le prix du Territoire", () => {
  // Sinon un lecteur qui a payé 14 € puis 25 € n'aurait pas payé le même total que
  // celui qui paie 39 € d'un coup.
  assert.equal(
    DOSSIER_PRICE.fullCents - DOSSIER_PRICE.territoryDeductionCents,
    DOSSIER_PRICE.deepeningCents,
  );
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `node --test src/lib/dossier-pricing.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 3: Écrire le devis**

Créer `src/lib/dossier-pricing.ts` :

```ts
// Le prix du dossier d'adresse. Pas de `server-only` : pure, testée.
//
// LA DÉDUCTION EST UN ÉTAT RECALCULÉ, JAMAIS UN CRÉDIT CONSOMMABLE. Elle vaut pour TOUS les biens
// d'une commune déjà payée, pas seulement le premier. Le fait générateur est
// `decidePaidTerritory` (src/lib/territory-claims.ts), vrai pour un 14 € direct, un grant
// `pack_decision` et un dossier antérieur payé ; faux pour la seule résidence (déclarative, sinon
// elle deviendrait un bon de réduction) et faux pour un dossier administratif (rien n'a été
// encaissé).
export const DOSSIER_PRICE = {
  fullCents: 3900,
  deepeningCents: 2500,
  territoryDeductionCents: 1400,
} as const;

export function quoteForDossier(hasPaidTerritory: boolean): {
  basePriceCents: number;
  territoryDeductionCents: number;
  amountDueCents: number;
} {
  const territoryDeductionCents = hasPaidTerritory
    ? DOSSIER_PRICE.territoryDeductionCents
    : 0;
  return {
    basePriceCents: DOSSIER_PRICE.fullCents,
    territoryDeductionCents,
    amountDueCents: DOSSIER_PRICE.fullCents - territoryDeductionCents,
  };
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `node --test src/lib/dossier-pricing.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 5: Écrire la route**

Créer `src/app/api/dossier/qualification/route.ts` :

```ts
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateSelectedBanAddress } from "@/lib/selected-ban-address";
import {
  isSellableAnchor,
  admissibleCandidates,
  type NearbyHouseNumber,
} from "@/lib/dossier-qualification";
import { reverseHouseNumbers } from "@/lib/ban";
import { probeDpeByBanId } from "@/lib/dpe";
import { probeCadastreAtPoint } from "@/lib/cadastre";
import { quoteForDossier, DOSSIER_PRICE } from "@/lib/dossier-pricing";
import { hasPaidTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════
// La qualification est PUBLIQUE ET ANONYME : c'est le capteur du visiteur froid, et le visiteur
// froid est précisément le moment d'achat. Elle mesure et elle refuse ; elle n'enrichit jamais.
//
// GÉORISQUES N'EST JAMAIS APPELÉ ICI. Cette route porterait notre token sur une surface publique,
// ce qui publierait gratuitement le cœur du fan-out payant.
//
// LE DEVIS N'EST JAMAIS MIS EN CACHE : il dépend des droits d'un compte. La matière (parcelle, DPE)
// se met en cache par adresse via le `revalidate` des sondes ; une PANNE ne se met jamais en cache,
// puisque les sondes rendent alors un statut distinct plutôt qu'une absence.
// ════════════════════════════════════════════════════════════════════════════

type Warning =
  | { code: "no_exact_dpe_found" }
  | { code: "no_parcel_reading" }
  | { code: "source_unavailable"; source: "ademe" | "cadastre" };

// Limite de débit en mémoire, par instance. Elle arrête l'abus trivial, pas un attaquant
// distribué : le vrai garde-fou est l'absence de Géorisques ci-dessus. Fluid Compute réutilise les
// instances, donc le compteur survit entre requêtes voisines.
const HITS = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 20;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const cur = HITS.get(ip);
  if (!cur || cur.resetAt < now) {
    HITS.set(ip, { n: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  cur.n += 1;
  return cur.n > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as { address?: unknown } | null;
  const sel = validateSelectedBanAddress(body?.address);
  if (!sel) {
    return NextResponse.json({ error: "Adresse BAN invalide." }, { status: 400 });
  }

  // ── Adresse non ancrée : préciser, ou refuser sur un fait vérifié ────────────────────
  if (!isSellableAnchor(sel.type)) {
    const hits = await reverseHouseNumbers(sel.longitude, sel.latitude);
    if (hits === null) {
      // Une panne du reverse ne devient jamais « aucun numéro n'existe » : ce serait refuser une
      // vente sur un appel qui a échoué.
      return NextResponse.json(
        { error: "Vérification indisponible.", code: "BAN_VERIFICATION_FAILED" },
        { status: 503 },
      );
    }
    const candidates: NearbyHouseNumber[] = admissibleCandidates(
      { banId: sel.banId, citycode: sel.citycode, type: sel.type },
      hits,
    );
    if (candidates.length === 0) {
      return NextResponse.json({
        status: "unsupported_at_launch",
        reason: "no_reliable_local_anchor",
      });
    }
    return NextResponse.json({
      status: "needs_precision",
      reason: "missing_house_number",
      candidates,
    });
  }

  // ── Adresse ancrée : la matière, puis le devis ───────────────────────────────────────
  const [dpe, cadastre] = await Promise.all([
    probeDpeByBanId(sel.banId),
    probeCadastreAtPoint(sel.longitude, sel.latitude),
  ]);

  const warnings: Warning[] = [];
  if (dpe.status === "none") warnings.push({ code: "no_exact_dpe_found" });
  if (dpe.status === "unavailable") {
    warnings.push({ code: "source_unavailable", source: "ademe" });
  }
  if (cadastre.status === "none") warnings.push({ code: "no_parcel_reading" });
  if (cadastre.status === "unavailable") {
    warnings.push({ code: "source_unavailable", source: "cadastre" });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Anonyme : le prix de base, avec la déduction ANNONCÉE. Elle doit être conçue plutôt que
  // surgir après connexion comme une mutation inexpliquée du prix.
  if (!user) {
    return NextResponse.json({
      status: "qualified",
      anchorSource: "ban_housenumber",
      warnings,
      quote: {
        status: "provisional",
        basePriceCents: DOSSIER_PRICE.fullCents,
        amountDueCents: DOSSIER_PRICE.fullCents,
      },
    });
  }

  const paid = await hasPaidTerritory(supabase, user.id, communeParent(sel.citycode));
  return NextResponse.json({
    status: "qualified",
    anchorSource: "ban_housenumber",
    warnings,
    quote: {
      status: "final",
      ...quoteForDossier(paid),
      // La clé d'idempotence NE NAÎT PAS ICI : elle naît dans la page de checkout (tâche 7A), qui
      // est le vrai « devis final » (elle revalide l'adresse et recalcule le prix pour un
      // utilisateur connecté). La produire ici obligerait à la traverser jusqu'au formulaire à
      // travers une éventuelle connexion, sans rien garantir de plus.
    },
  });
}
```

- [ ] **Step 6: Vérifier les trois issues contre la route réelle**

Serveur lancé, **déconnecté** :

```bash
# ancrée : housenumber nantais
curl -s -X POST localhost:3000/api/dossier/qualification -H "Content-Type: application/json" -d '{"address":{"banId":"44109_2300_00002","label":"2 Rue Crébillon 44000 Nantes","postcode":"44000","city":"Nantes","citycode":"44109","latitude":47.214331,"longitude":-1.559088,"type":"housenumber"}}'

# à préciser : la voie « le Cros »
curl -s -X POST localhost:3000/api/dossier/qualification -H "Content-Type: application/json" -d '{"address":{"banId":"83077_i1no3t","label":"le Cros 83136 Méounes-lès-Montrieux","postcode":"83136","city":"Méounes-lès-Montrieux","citycode":"83077","latitude":43.28191,"longitude":5.978039,"type":"street"}}'
```

Attendu : la première rend `status: "qualified"` avec un devis `provisional` à 3900 ; la seconde
rend `needs_precision` avec « 1986 le Cros » et « 451 le Cros », **sans** « le Vallon ».

- [ ] **Step 7: Vérifier le devis final, connecté**

Au navigateur connecté, depuis la console d'une page du site (pour envoyer les cookies) :

```js
await (await fetch("/api/dossier/qualification", {
  method: "POST", headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ address: { banId: "44109_2300_00002", label: "2 Rue Crébillon 44000 Nantes",
    postcode: "44000", city: "Nantes", citycode: "44109",
    latitude: 47.214331, longitude: -1.559088, type: "housenumber" } }),
})).json()
```

Attendu : `quote.status === "final"`. Sur un compte possédant un dossier payé ou un grant à Nantes,
`amountDueCents` vaut 2500 ; sinon 3900. **Un dossier administratif ne doit pas faire tomber le prix
à 2500** : c'est le test de `decidePaidTerritory` en conditions réelles.

- [ ] **Step 8: Committer**

```bash
git add src/lib/dossier-pricing.ts src/lib/dossier-pricing.test.ts \
        src/app/api/dossier/qualification/route.ts
git commit -m "La qualification refuse sur l'ancrage, annonce les manques, et ne cache jamais un devis"
```

---

### Task 6: La porte publique

**Files:**
- Create: `src/app/(public)/dossier/page.tsx`
- Create: `src/app/(public)/dossier/DossierQualificationClient.tsx`

**Interfaces:**
- Consumes: `POST /api/dossier/qualification` (tâche 5) ; `AddressAutocomplete`
  (`src/components/report/AddressAutocomplete.tsx`, props
  `{ onSelect: (a: BanAddressResult) => void; placeholder?: string; showModify?: boolean; onModify?: () => void }`).
- Produces: l'écran qui mène à `/checkout/dossier?...` (tâche 7), et les trois premiers événements
  PostHog du parcours.

- [ ] **Step 1: Écrire la page serveur**

Créer `src/app/(public)/dossier/page.tsx`. Elle est **publique et indexable** : c'est la porte
appelée depuis les pages commune, la landing et `/rapport`.

```tsx
import Navbar from "@/components/Navbar";
import { DossierQualificationClient } from "./DossierQualificationClient";

export const metadata = {
  title: "Analyser une adresse : ce que devient ce lieu | futur•e",
  description:
    "Ce qui entoure une adresse, ce que dit le bâtiment, et comment la commune évolue. Nous vérifions d'abord que nous savons de quel bien il s'agit.",
};

export default function DossierPage() {
  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <Navbar />
      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Une adresse précise
        </p>
        <h1
          className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.15] tracking-[-0.5px] text-label mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Quel bien voulez-vous faire examiner&nbsp;?
        </h1>
        <DossierQualificationClient />
      </div>
    </div>
  );
}
```

**Le texte n'a aucun `max-w` propre** : la largeur de lecture vient du conteneur de page, sinon la
phrase wrappe à mi-bloc.

- [ ] **Step 2: Écrire le client, avec les trois issues**

Créer `src/app/(public)/dossier/DossierQualificationClient.tsx` :

```tsx
"use client";

import { useState } from "react";
import posthog from "posthog-js";
import { AddressAutocomplete } from "@/components/report/AddressAutocomplete";
import type { BanAddressResult } from "@/lib/ban";

type Candidate = {
  banId: string; label: string; city: string | null; postcode: string | null;
  latitude: number; longitude: number; distanceM: number;
};
type Warning =
  | { code: "no_exact_dpe_found" }
  | { code: "no_parcel_reading" }
  | { code: "source_unavailable"; source: "ademe" | "cadastre" };
type Outcome =
  | { status: "qualified"; warnings: Warning[];
      quote: { status: "final" | "provisional"; amountDueCents: number;
               territoryDeductionCents?: number } }
  | { status: "needs_precision"; candidates: Candidate[] }
  | { status: "unsupported_at_launch" };

// Ce que la qualification DIT, et ce qu'elle ne dit jamais. Elle nomme la MATIÈRE et les manques
// propres à cette adresse. Aucune valeur, aucun état, aucun verdict : sinon elle devient le
// produit gratuit qui rend le payant inutile.
const WARNING_COPY: Record<string, string> = {
  no_exact_dpe_found:
    "Le diagnostic exact de ce logement n'a pas été retrouvé. Le dossier le dira, et lira le bâtiment autrement.",
  no_parcel_reading:
    "La lecture parcellaire n'est pas disponible ici. Les risques au point et les alentours le restent.",
  source_unavailable_ademe:
    "Nous n'avons pas pu interroger les diagnostics à l'instant. Ce n'est pas une absence de diagnostic.",
  source_unavailable_cadastre:
    "Nous n'avons pas pu vérifier la parcelle à l'instant.",
};

const EUR = (cents: number) => `${(cents / 100).toFixed(0).replace(".", ",")} €`;

export function DossierQualificationClient() {
  const [address, setAddress] = useState<BanAddressResult | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function qualify(a: BanAddressResult) {
    if (!a.id || !a.citycode || a.latitude == null || a.longitude == null) {
      setError("Adresse sans coordonnées exploitables.");
      return;
    }
    setBusy(true);
    setError(null);
    setOutcome(null);
    setAddress(a);
    try {
      const res = await fetch("/api/dossier/qualification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: {
            banId: a.id, label: a.label, postcode: a.postcode ?? "", city: a.city ?? "",
            citycode: a.citycode, latitude: a.latitude, longitude: a.longitude, type: a.type,
          },
        }),
      });
      if (res.status === 503) {
        setError("Vérification indisponible pour l'instant. Réessayez dans un moment.");
        return;
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const payload = (await res.json()) as Outcome;
      setOutcome(payload);
      posthog.capture("address_qualification_result", {
        status: payload.status,
        insee: a.citycode,
        ban_feature_type: a.type,
        warnings: payload.status === "qualified" ? payload.warnings.map((w) => w.code) : [],
      });
    } catch {
      setError("Qualification impossible pour l'instant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <AddressAutocomplete
        placeholder="Saisissez une adresse"
        onSelect={qualify}
        onModify={() => { setOutcome(null); setError(null); }}
      />

      {busy && (
        <p className="text-[14px] text-muted mt-6">
          Nous vérifions ce que nous savons de cette adresse.
        </p>
      )}

      {error && <p className="text-[14px] text-muted mt-6">{error}</p>}

      {outcome?.status === "qualified" && address && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-4">{address.label}</p>
          {outcome.warnings.length > 0 && (
            <ul className="mb-6" style={{ display: "grid", gap: 10 }}>
              {outcome.warnings.map((w) => (
                <li key={w.code + ("source" in w ? w.source : "")} className="text-[14px] text-muted leading-relaxed">
                  {WARNING_COPY[
                    "source" in w ? `${w.code}_${w.source}` : w.code
                  ]}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[15px] text-label mb-1">
            {EUR(outcome.quote.amountDueCents)}
          </p>
          {outcome.quote.status === "provisional" ? (
            <p className="font-mono text-[12px] text-ghost mb-5">
              14 € sont déduits si vous avez déjà la lecture de cette commune.
            </p>
          ) : (
            outcome.quote.territoryDeductionCents
              ? <p className="font-mono text-[12px] text-ghost mb-5">
                  Vous avez déjà la lecture de cette commune : 14 € déduits.
                </p>
              : <span />
          )}
          <a
            // Trois paramètres, et pas un de plus : ils SUFFISENT au serveur pour retrouver la
            // feature canonique (`fetchBanFeaturesByLabel` + `pickFeatureById`) et en tirer les
            // coordonnées lui-même. Passer les coordonnées dans l'URL les rendrait modifiables
            // pour rien, puisqu'elles seraient de toute façon écrasées par la revalidation.
            href={`/checkout/dossier?banId=${encodeURIComponent(address.id!)}&label=${encodeURIComponent(address.label)}&insee=${encodeURIComponent(address.citycode!)}`}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/[0.12] text-accent text-[14px] no-underline border border-accent/[0.25]"
            onClick={() => posthog.capture("address_checkout_viewed", {
              insee: address.citycode,
              amount_due_cents: outcome.quote.amountDueCents,
            })}
          >
            Créer mon dossier
          </a>
        </div>
      )}

      {outcome?.status === "needs_precision" && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-2">
            Nous n&apos;avons pas encore identifié le bien avec assez de précision.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            {outcome.candidates.length > 0
              ? "Cette adresse désigne une voie. Voici les adresses numérotées les plus proches."
              : "Saisissez une adresse précise dans cette commune, avec son numéro."}
          </p>
          <div style={{ display: "grid", gap: 10 }}>
            {outcome.candidates.map((c) => (
              <button
                key={c.banId}
                type="button"
                // LES COORDONNÉES DU CANDIDAT, jamais celles de la feature grossière. Reprendre
                // le point de la voie sonderait le cadastre au centroïde tout en affichant
                // l'adresse d'un numéro précis.
                onClick={() => qualify({
                  id: c.banId, label: c.label,
                  city: c.city ?? address?.city ?? null,
                  citycode: address?.citycode ?? null,
                  postcode: c.postcode ?? address?.postcode ?? null,
                  type: "housenumber",
                  latitude: c.latitude, longitude: c.longitude,
                })}
                className="text-left px-5 py-3 rounded-lg bg-white/[0.05] text-label text-[14px] border border-white/[0.08]"
              >
                {c.label}
                <span className="font-mono text-[12px] text-ghost"> · à {Math.round(c.distanceM)} m</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {outcome?.status === "unsupported_at_launch" && address && (
        <div className="glass rounded-xl p-6 mt-8">
          <p className="text-[16.5px] text-label leading-snug mb-3">
            Nous ne pouvons pas encore identifier ce bien assez précisément.
          </p>
          <p className="text-[14px] text-muted leading-relaxed mb-5">
            Cette adresse ne porte pas de point de bâtiment fiable. Pour éviter d&apos;analyser la
            mauvaise parcelle ou de mesurer les alentours depuis un point approximatif, nous
            préférons ne pas vous vendre ce dossier.
          </p>
          <a
            href={`/territoire/${address.citycode}`}
            className="text-[14px] text-muted underline"
            onClick={() => posthog.capture("address_qualification_exit", { choice: "territory_14" })}
          >
            Lire ce que devient {address.city ?? "cette commune"}
          </a>
        </div>
      )}
    </div>
  );
}
```

**Le renvoi vers la commune est un lien de texte, jamais le bouton dominant.** Un refus qui débouche
sur une vente mise en avant devient une technique commerciale et perd ce qui le rendait crédible.

**Un candidat sélectionné relance une qualification complète** sur son `banId` : c'est le seul
chemin qui repasse par l'ancrage.

- [ ] **Step 3: Émettre l'événement d'ouverture**

Dans `DossierQualificationClient`, juste après les quatre `useState` et avant `qualify`, ajouter :

```tsx
  // Le dénominateur de tout le parcours. Émis au montage, une seule fois : le tableau de
  // dépendances vide est le contrat, sinon un rendu de plus double le volume mesuré.
  useEffect(() => {
    posthog.capture("address_qualification_viewed");
  }, []);
```

Et changer la première ligne d'import en `import { useEffect, useState } from "react";`.

- [ ] **Step 4: Vérifier au navigateur, déconnecté**

Ouvrir `/dossier`. Saisir « 2 rue Crébillon Nantes », choisir la suggestion : le prix de 39 € et la
mention de déduction doivent apparaître. Saisir « le Cros Méounes » et choisir la voie : les
candidats numérotés doivent s'afficher avec leur distance, **sans « le Vallon »**. Cliquer un
candidat doit relancer la qualification et rendre l'écran vendable.

- [ ] **Step 5: Vérifier le build**

Run: `npm run build`
Expected: succès. Les `Failed to build /chaleur/[insee]` en timeout réseau sont normaux et repassent
au retry : vérifier le compte final et le code de sortie, jamais une ligne isolée.

- [ ] **Step 6: Committer**

```bash
git add "src/app/(public)/dossier/page.tsx" "src/app/(public)/dossier/DossierQualificationClient.tsx"
git commit -m "La porte par l'adresse : trois issues, et le refus propose les numéros voisins"
```

---

### Task 7A: Le checkout du dossier

Sans cette tâche, le backend existe et **personne ne l'atteint** : `/checkout/[product]` appelle
`notFound()` pour tout slug hors `rapport-complet` (`getCheckoutProduct` ne connaît que lui), et
`CheckoutPaymentPanel` envoie systématiquement vers `/merci` après succès.

**Files:**
- Create: `src/app/(public)/checkout/dossier/page.tsx`
- Create: `src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx`
- Modify: `src/components/PaymentWrapper.tsx` (deux props transmises au corps de requête)

**Interfaces:**
- Consumes: `fetchBanFeaturesByLabel` (tâche 7, étape 5), `pickFeatureById`, `isSellableAnchor`,
  `quoteForDossier`, `hasPaidTerritory`, `communeParent`.
- Produces: l'URL `/checkout/dossier?banId=…&label=…&insee=…`, et le `checkoutAttemptId` que la
  tâche 7 consomme comme clé d'idempotence.

**Un segment statique prime sur un segment dynamique** dans le routage : `/checkout/dossier` gagne
sur `/checkout/[product]`, donc le registre catalogue reste intact et n'a ni thème ni copie à
recevoir pour un produit qui se rend dynamiquement.

- [ ] **Step 1: Étendre le formulaire de paiement**

Dans `src/components/PaymentWrapper.tsx`, ajouter deux props au type et au corps de requête :

```ts
type PaymentWrapperProps = {
  // … props existantes
  address?: unknown;            // SelectedBanAddress, revalidée côté serveur de toute façon
  checkoutAttemptId?: string;   // clé d'idempotence de la tentative
};
```

```ts
  const requestBody = JSON.stringify({
    amount,
    productType,
    targetInsee: grant?.targetInsee,
    targetCommune: grant?.targetCommune,
    source: grant?.source,
    rank: grant?.rank,
    pack,
    address,
    checkoutAttemptId,
    phDistinctId: clientDistinctId(),
  });
```

`requestBody` sert de `requestKey` au `useEffect` : `checkoutAttemptId` étant stable pour un rendu de
page, la clé ne bouge pas et le PaymentIntent n'est demandé qu'une fois.

- [ ] **Step 2: Écrire la page serveur, qui exige l'identité au dernier moment utile**

Créer `src/app/(public)/checkout/dossier/page.tsx` :

```tsx
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { fetchBanFeaturesByLabel } from "@/lib/ban";
import { pickFeatureById } from "@/lib/ban-verify";
import { isSellableAnchor } from "@/lib/dossier-qualification";
import { quoteForDossier } from "@/lib/dossier-pricing";
import { hasPaidTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";
import { DossierCheckoutPanel } from "./DossierCheckoutPanel";

export default async function DossierCheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ banId?: string; label?: string; insee?: string }>;
}) {
  const { banId, label, insee } = await searchParams;
  if (!banId || !label || !insee) redirect("/dossier");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // L'IDENTITÉ AU DERNIER MOMENT UTILE. Le lecteur a déjà vu que son bien est analysable, ce que
  // le dossier contiendra et ce qui manquera : l'authentification n'interrompt pas la découverte,
  // elle sécurise l'acquisition. `getSafeNextPath` (src/app/auth/actions.ts) accepte tout chemin
  // relatif, query comprise, donc l'adresse survit à la connexion.
  if (!user) {
    const next = `/checkout/dossier?banId=${encodeURIComponent(banId)}&label=${encodeURIComponent(label)}&insee=${encodeURIComponent(insee)}`;
    redirect(`/connexion?next=${encodeURIComponent(next)}`);
  }

  // LE SERVEUR DÉCIDE DE L'ADRESSE. Le navigateur n'a transmis qu'un libellé et une commune.
  const features = await fetchBanFeaturesByLabel(label, insee);
  if (features === null) redirect("/dossier?erreur=verification");
  const canonical = pickFeatureById(
    features.flatMap((f) => (f.id ? [{ ...f, id: f.id }] : [])),
    banId,
  );
  if (!canonical || !isSellableAnchor(canonical.type) || !canonical.citycode) {
    redirect("/dossier?erreur=ancrage");
  }

  const paid = await hasPaidTerritory(supabase, user.id, communeParent(canonical.citycode));
  const quote = quoteForDossier(paid);

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <Navbar />
      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Le dossier de ce bien
        </p>
        <h1
          className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.15] tracking-[-0.5px] text-label mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {canonical.label}
        </h1>
        <DossierCheckoutPanel
          address={{
            banId: canonical.id, label: canonical.label,
            postcode: canonical.postcode ?? "", city: canonical.city ?? "",
            citycode: canonical.citycode,
            latitude: canonical.latitude, longitude: canonical.longitude,
            type: canonical.type,
          }}
          quote={quote}
          userEmail={user.email}
          {/* Généré à CHAQUE rendu de la page : un double clic sur « Payer » réutilise la même
              valeur, puisqu'elle vit dans les props du formulaire, tandis qu'un retour explicite
              sur cette page ouvre une tentative neuve. C'est exactement la frontière voulue entre
              doublon technique et second achat légitime. */}
          checkoutAttemptId={crypto.randomUUID()}
        />
      </div>
    </div>
  );
}
```

**Attention** : un commentaire JSX dans un ternaire casse le build. Celui ci-dessus est un enfant
direct de l'élément, donc il est légal ; ne pas l'y déplacer.

- [ ] **Step 3: Écrire le panneau client**

Créer `src/app/(public)/checkout/dossier/DossierCheckoutPanel.tsx` :

```tsx
"use client";

import { useRouter } from "next/navigation";
import { PaymentWrapper } from "@/components/PaymentWrapper";

type Address = {
  banId: string; label: string; postcode: string; city: string; citycode: string;
  latitude: number; longitude: number; type: string | null;
};

export function DossierCheckoutPanel({
  address, quote, userEmail, checkoutAttemptId,
}: {
  address: Address;
  quote: { basePriceCents: number; territoryDeductionCents: number; amountDueCents: number };
  userEmail: string | null | undefined;
  checkoutAttemptId: string;
}) {
  const router = useRouter();
  const eur = (c: number) => `${(c / 100).toFixed(0)} €`;

  return (
    <div className="glass rounded-xl p-6">
      <p className="text-[15px] text-label mb-1">{eur(quote.amountDueCents)}</p>
      {quote.territoryDeductionCents > 0 && (
        <p className="font-mono text-[12px] text-ghost mb-5">
          Vous avez déjà la lecture de {address.city} : {eur(quote.territoryDeductionCents)} déduits
          des {eur(quote.basePriceCents)}.
        </p>
      )}
      <p className="text-[14px] text-muted leading-relaxed mb-6">
        Paiement rattaché à <span className="text-label">{userEmail}</span>. TVA non applicable,
        art. 293 B du CGI.
      </p>
      <PaymentWrapper
        // `amount` n'est qu'un AFFICHAGE : le montant facturé est recalculé côté serveur par
        // `quoteForDossier`, et un client qui modifierait cette valeur ne changerait rien.
        amount={quote.amountDueCents / 100}
        productType="address-dossier"
        address={address}
        checkoutAttemptId={checkoutAttemptId}
        returnUrl="/dossier/merci"
        onSuccess={() => router.push("/dossier/merci")}
      />
    </div>
  );
}
```

**« TVA non applicable, art. 293 B du CGI »**, jamais « TVA incluse ».

- [ ] **Step 4: Vérifier le parcours jusqu'au formulaire, déconnecté puis connecté**

Déconnecté, ouvrir `/dossier`, qualifier « 2 rue Crébillon Nantes », cliquer « Créer mon dossier » :
la connexion doit s'afficher, et **après connexion le checkout doit revenir sur la même adresse**.
Vérifier que le montant affiché vaut 39 € (ou 25 € si la commune est déjà payée) et que l'adresse
affichée est celle rendue par la BAN.

Falsifier l'URL (`&banId=44109_2300_00099`) doit renvoyer vers `/dossier?erreur=ancrage`, sans jamais
afficher de formulaire de paiement.

- [ ] **Step 5: Committer**

```bash
git add "src/app/(public)/checkout/dossier" src/components/PaymentWrapper.tsx
git commit -m "Le checkout du dossier : l'identité au dernier moment, l'adresse décidée par le serveur"
```

---

### Task 7: L'intention, le webhook, la page d'attente

Les trois vont ensemble : aucun ne se vérifie seul, puisque le seul test valable est un paiement
qui produit un dossier.

**Files:**
- Create: `supabase/26_dossier_intents.sql`
- Create: `src/lib/ban-verify.ts`
- Create: `src/lib/ban-verify.test.ts`
- Modify: `src/lib/ban.ts` (ajout de `fetchBanFeaturesByLabel`)
- Modify: `src/app/api/stripe/create-payment-intent/route.ts` (produit + branche)
- Modify: `src/app/api/stripe/webhook/route.ts` (branche `address-dossier`)
- Create: `src/app/api/dossier/statut/route.ts`
- Create: `src/app/(account)/dossier/merci/page.tsx`
- Create: `src/app/(account)/dossier/merci/DossierMerciClient.tsx`

**Interfaces:**
- Consumes: `quoteForDossier`, `DOSSIER_PRICE` (tâche 5) ; `isSellableAnchor` (tâche 3) ;
  `sanitizeDistinctId` (tâche 2) ; `hasPaidTerritory`, `communeParent`.
- Produces: `pickFeatureById(features, banId)` ; la table `dossier_intents` ; le produit
  `address-dossier` dans la carte de prix serveur ; `GET /api/dossier/statut?pi=…`.

- [ ] **Step 1: Écrire la migration**

Créer `supabase/26_dossier_intents.sql` :

```sql
begin;

-- L'intention de paiement d'un dossier d'adresse.
--
-- POURQUOI CETTE TABLE PLUTÔT QUE LES MÉTADONNÉES STRIPE. L'adresse analysée n'est pas l'adresse
-- de facturation : c'est le LIEU QUE QUELQU'UN ENVISAGE. La transmettre à un tiers de paiement
-- avec ses coordonnées communique une intention de vie qui n'a aucun rôle dans la transaction.
-- Le patron existe déjà pour le Pack Décision (`pack_snapshots`).
--
-- Elle porte l'adresse CANONIQUE, telle que le serveur l'a revalidée contre la BAN, jamais celle
-- reçue du navigateur.
--
-- ELLE N'OUVRE AUCUN DROIT. Le droit reste l'existence d'une ligne `address_dossiers`. Une
-- intention sans paiement est sans effet.
create table if not exists public.dossier_intents (
  stripe_payment_intent_id text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  ban_id        text not null,
  insee         text not null,
  address_label text not null,
  city          text,
  postcode      text,
  latitude      double precision not null,
  longitude     double precision not null,
  amount_due_cents int not null check (amount_due_cents >= 0),
  territory_deduction_cents int not null default 0 check (territory_deduction_cents >= 0),
  created_at    timestamptz not null default now()
);

-- AUCUNE COLONNE `decision_journey_id`. La spec envisageait un cookie signé de parcours ; il n'est
-- pas construit au lancement (voir « Ce que ce plan ne construit pas »), et une colonne sans
-- écrivain est exactement le piège que la spec du 29/07 a refusé pour `dwelling_discriminator`.
-- Le regroupement des événements se fait par le distinct_id PostHog, qui persiste déjà.

-- RÉTENTION. Cette table existe pour éviter d'envoyer à Stripe les lieux que des gens envisagent
-- d'habiter : elle ne doit pas devenir l'archive permanente de ces mêmes intentions. L'index sert
-- la purge, qui se lance à la main tant que le volume est faible :
--   delete from public.dossier_intents
--    where created_at < now() - interval '30 days'
--      and stripe_payment_intent_id not in (
--        select stripe_payment_intent_id from public.address_dossiers
--         where stripe_payment_intent_id is not null);
create index if not exists dossier_intents_created_at_idx
  on public.dossier_intents (created_at);

alter table public.dossier_intents enable row level security;

-- AUCUNE POLICY, donc aucun accès pour `authenticated` : seul le service role écrit et lit cette
-- table. Un client qui pourrait écrire ici choisirait l'adresse livrée par le webhook après avoir
-- payé, ou son montant.
revoke all on public.dossier_intents from authenticated, anon;

commit;
```

- [ ] **Step 2: Appliquer la migration et vérifier l'absence d'accès client**

Il n'existe qu'**une seule base Supabase, et c'est la production** : aucun environnement de
développement séparé. Appliquer le fichier tel quel, par l'éditeur SQL du tableau de bord Supabase
ou par le MCP Supabase (`apply_migration`), en le collant intégralement plutôt qu'en le retapant.
La migration est idempotente (`create table if not exists`), donc une double application est sans
effet.

Puis vérifier depuis un client authentifié que la table est inaccessible :

```bash
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/dossier_intents?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

Attendu : une erreur de permission, jamais une liste.

- [ ] **Step 3: Écrire le test du choix de feature, qui échoue**

Créer `src/lib/ban-verify.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { pickFeatureById } from "./ban-verify.ts";

const f = (id: string, type: string) => ({
  id, type, label: `${id} label`, city: "Nantes", citycode: "44109",
  postcode: "44000", latitude: 47.2, longitude: -1.55,
});

test("retient la feature dont l'identifiant correspond exactement", () => {
  const out = pickFeatureById(
    [f("44109_2300_00001", "housenumber"), f("44109_2300_00002", "housenumber")],
    "44109_2300_00002",
  );
  assert.equal(out?.id, "44109_2300_00002");
});

test("rend null quand l'identifiant demandé est absent", () => {
  // Le client a désigné une adresse que la BAN ne confirme pas : on ne vend pas.
  assert.equal(pickFeatureById([f("44109_2300_00001", "housenumber")], "44109_9999_00002"), null);
});

test("ne se rabat jamais sur le premier résultat", () => {
  assert.equal(pickFeatureById([f("44109_2300_00001", "street")], "44109_2300_00002"), null);
});

test("rend null sur une liste vide", () => {
  assert.equal(pickFeatureById([], "44109_2300_00002"), null);
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `node --test src/lib/ban-verify.test.ts`
Expected: FAIL, module introuvable.

- [ ] **Step 5: Écrire la lib et le fetch de revalidation**

Créer `src/lib/ban-verify.ts` :

```ts
// Le navigateur DÉSIGNE une adresse ; le serveur DÉCIDE de l'adresse réellement achetée.
//
// `feature_type` décide de l'éligibilité et vient du client. Un client qui affirme `housenumber`
// sur une voie obtiendrait le droit de payer, et le dossier créé porterait un `ban_id` de voie :
// tout se calculerait au centroïde. Pas de `server-only` : pure, testée.
export type BanFeatureLike = {
  id: string;
  type: string;
  label: string;
  city: string | null;
  citycode: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
};

// Jamais de repli sur le premier résultat : c'est la porte par laquelle une adresse voisine
// entrerait dans un dossier payé.
export function pickFeatureById<T extends { id: string }>(
  features: T[],
  banId: string,
): T | null {
  return features.find((f) => f.id === banId) ?? null;
}
```

Dans `src/lib/ban.ts`, ajouter :

```ts
// Retrouve les features BAN d'un libellé dans une commune, pour REVALIDER une adresse au moment du
// paiement. L'API BAN n'expose pas de lecture par identifiant : on recherche, puis on choisit par
// identifiant exact (`pickFeatureById`). Vérifié le 30/07/2026 :
// `?q=2 rue Crebillon&citycode=44109` rend bien `44109_2300_00002`, type `housenumber`.
export async function fetchBanFeaturesByLabel(
  label: string,
  citycode: string,
): Promise<BanAddressResult[] | null> {
  try {
    const url = new URL(BAN_SEARCH_URL);
    url.searchParams.set("q", label);
    url.searchParams.set("citycode", citycode);
    url.searchParams.set("limit", "10");
    const res = await fetch(url.toString(), {
      headers: { accept: "application/json" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as BanResponse;
    return parseBanAutocomplete(json.features ?? []);
  } catch {
    return null;
  }
}
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `node --test src/lib/ban-verify.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Ajouter le produit et la branche au checkout**

Dans `create-payment-intent/route.ts`, ajouter à `PRODUCT_PRICES` :

```ts
  // Le montant réel est calculé par `quoteForDossier` (39 € ou 25 €) : cette entrée sert à
  // reconnaître le produit, son `amountEur` n'est jamais facturé tel quel.
  "address-dossier": { amountEur: 39, stripePriceId: process.env.STRIPE_DOSSIER_PRICE_ID ?? "" },
```

Puis, après la garde d'authentification et avant `stripe.paymentIntents.create`, insérer la branche
(le corps doit accepter `address` et `checkoutAttemptId`) :

```ts
    const isDossier = productType.trim() === "address-dossier";
    let dossierAmountCents = 0;
    let dossierIntent: {
      banId: string; insee: string; label: string; city: string | null;
      postcode: string | null; latitude: number; longitude: number;
      deductionCents: number;
    } | null = null;

    if (isDossier) {
      const sel = validateSelectedBanAddress(address);
      if (!sel) {
        return NextResponse.json({ error: "Adresse invalide." }, { status: 400 });
      }

      // REVALIDATION : la BAN a le dernier mot sur le type ET sur les coordonnées.
      const features = await fetchBanFeaturesByLabel(sel.label, sel.citycode);
      if (features === null) {
        return NextResponse.json(
          { error: "Vérification indisponible.", code: "BAN_VERIFICATION_FAILED" },
          { status: 503 },
        );
      }
      const canonical = pickFeatureById(
        features.flatMap((f) => (f.id ? [{ ...f, id: f.id }] : [])),
        sel.banId,
      );
      // Le `citycode` est exigé ici parce qu'il gouverne le droit et le prix : une feature sans
      // code commune ne peut ni être comparée à un grant, ni porter un dossier.
      if (!canonical || !isSellableAnchor(canonical.type) || !canonical.citycode) {
        return NextResponse.json(
          { error: "Ce bien n'est pas identifié assez précisément.", code: "ANCHOR_REFUSED" },
          { status: 422 },
        );
      }

      // TOUTES les valeurs viennent de la feature canonique. Sécuriser le type en gardant les
      // coordonnées du client analyserait un point choisi par le client.
      const paid = await hasPaidTerritory(supabase, user.id, communeParent(canonical.citycode));
      const quote = quoteForDossier(paid);
      dossierAmountCents = quote.amountDueCents;
      dossierIntent = {
        banId: canonical.id, insee: canonical.citycode!, label: canonical.label,
        city: canonical.city, postcode: canonical.postcode,
        latitude: canonical.latitude, longitude: canonical.longitude,
        deductionCents: quote.territoryDeductionCents,
      };
    }
```

Modifier la création du PaymentIntent pour prendre le montant du dossier et la clé d'idempotence :

```ts
    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: isDossier ? dossierAmountCents : Math.round(priceConfig.amountEur * 100),
        currency: "eur",
        payment_method_types: ["card"],
        metadata: {
          /* … champs existants, plus : */
          phDistinctId,
          checkoutAttemptId: attemptId,
        },
      },
      // IDEMPOTENCE TECHNIQUE SEULE. Elle ne dérive PAS de (userId, banId) : le produit autorise
      // délibérément plusieurs dossiers sur le même `ban_id` (deux appartements d'un immeuble), et
      // une clé fondée sur l'adresse rendrait à l'acheteur du second bien le PaymentIntent du
      // premier. Un double clic réutilise la tentative ; « créer un autre dossier » en ouvre une
      // nouvelle.
      // Bornée par l'utilisateur : deux comptes ne peuvent pas se partager une clé, même si
      // l'un devinait celle de l'autre.
      isDossier ? { idempotencyKey: `dossier_${user.id}_${attemptId}` } : undefined,
    );
```

Puis, après la création, écrire l'intention en service role :

```ts
    if (isDossier && dossierIntent) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      const { error: intentError } = await admin.from("dossier_intents").upsert(
        {
          stripe_payment_intent_id: paymentIntent.id,
          user_id: user.id,
          ban_id: dossierIntent.banId,
          insee: dossierIntent.insee,
          address_label: dossierIntent.label,
          city: dossierIntent.city,
          postcode: dossierIntent.postcode,
          latitude: dossierIntent.latitude,
          longitude: dossierIntent.longitude,
          amount_due_cents: dossierAmountCents,
          territory_deduction_cents: dossierIntent.deductionCents,
        },
        { onConflict: "stripe_payment_intent_id" },
      );

      // SANS INTENTION, LE WEBHOOK NE POURRA PAS CRÉER LE DOSSIER. Rendre le `clientSecret` ici
      // reviendrait à ouvrir un paiement dont la livraison est déjà impossible. On échoue avant que
      // la carte ne soit débitée.
      if (intentError) {
        console.error("[create-payment-intent] dossier_intents", intentError.message);
        return NextResponse.json(
          { error: "Préparation du dossier impossible." },
          { status: 500 },
        );
      }
    }
```

`attemptId` se lit du corps, au-dessus de la branche `isDossier` :

```ts
    // Clé d'idempotence de la TENTATIVE. Générée par le serveur avec le devis final, renvoyée par
    // le client. Rien ne dépend de la confiance qu'on lui accorde : le prix est recalculé à chaque
    // requête, donc ce jeton n'est qu'une clé. Un identifiant absent ou biscornu produit une
    // nouvelle tentative plutôt qu'un refus, parce qu'une clé illisible ne doit jamais empêcher un
    // achat légitime.
    const attemptId =
      typeof checkoutAttemptId === "string" &&
      /^[A-Za-z0-9_-]{8,100}$/.test(checkoutAttemptId)
        ? checkoutAttemptId
        : crypto.randomUUID();
```

`crypto` est global sous Node 18+, aucun import nécessaire.

- [ ] **Step 8: Écrire la branche du webhook**

Dans `webhook/route.ts`, `handleSucceededPayment`, avant la branche `pack-decision`, ajouter :

```ts
  if (productType === "address-dossier") {
    // L'ADRESSE VIENT DE L'INTENTION, jamais des métadonnées Stripe, qui ne la portent pas.
    const { data: intent } = await supabaseAdmin
      .from("dossier_intents")
      .select("*")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    if (!intent) {
      // Une intention absente est une ERREUR, pas un cas dégradé : inventer une adresse depuis un
      // paiement produirait un dossier sur un bien inconnu.
      //
      // ON LÈVE, ON NE RETOURNE PAS. `POST` répond `{ received: true }` juste après cet appel :
      // un `return` ferait croire à Stripe que l'événement est traité, donc il ne le rejouerait
      // JAMAIS, et le paiement resterait encaissé sans dossier, définitivement. En levant, la
      // route répond 500 et Stripe réessaie pendant trois jours, ce qui laisse le temps de
      // réparer.
      throw new Error(`dossier_intents introuvable pour ${paymentIntent.id}`);
    }

    // Le rang du dossier dans le compte, AVANT l'insertion. C'est la seule valeur d'historique de
    // l'instrumentation, et elle a une source réelle : la base la connaît, personne ne l'invente.
    const { count: paidBefore } = await supabaseAdmin
      .from("address_dossiers")
      .select("id", { count: "exact", head: true })
      .eq("user_id", intent.user_id)
      .not("stripe_payment_intent_id", "is", null);

    // `upsert` avec `ignoreDuplicates`, JAMAIS `insert`. Un `insert` sur une clé déjà prise lève une
    // erreur, donc un webhook rejoué échouerait à chaque fois. `ignoreDuplicates: true` produit le
    // `ON CONFLICT … DO NOTHING` que la spec exige, et la relecture qui suit fait RÉUSSIR le rejeu
    // en retrouvant le dossier existant. L'index unique garantit qu'un doublon n'est pas créé ;
    // cette séquence garantit que le rejeu répond en succès. Ce sont deux affirmations distinctes.
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from("address_dossiers")
      .upsert({
      user_id: intent.user_id,
      ban_id: intent.ban_id,
      insee: intent.insee,
      address_label: intent.address_label,
      city: intent.city,
      postcode: intent.postcode,
      latitude: intent.latitude,
      longitude: intent.longitude,
      stripe_payment_intent_id: paymentIntent.id,
      // La seule vérité de ce qui a été encaissé est ce que STRIPE déclare avoir encaissé.
      amount_paid_cents: paymentIntent.amount,
      purchased_at: new Date().toISOString(),
      },
      // LES DEUX OPTIONS SONT OBLIGATOIRES. Sans `onConflict`, Postgres arbitre sur la clé
      // primaire (`id`, un uuid neuf), donc le conflit réel n'est jamais vu. Sans
      // `ignoreDuplicates`, l'upsert ÉCRASE la ligne existante, ce qui réécrirait le montant et la
      // date d'achat d'un dossier déjà payé à chaque rejeu.
      { onConflict: "stripe_payment_intent_id", ignoreDuplicates: true })
      .select("id");

    if (insertError) throw insertError;

    // `ignoreDuplicates` rend une liste VIDE quand la ligne existait déjà : c'est ainsi qu'on
    // distingue une création d'un rejeu, et cette distinction gouverne les effets de bord plus bas.
    const created = (inserted?.length ?? 0) > 0;

    const { data: dossier } = await supabaseAdmin
      .from("address_dossiers")
      .select("id")
      .eq("stripe_payment_intent_id", paymentIntent.id)
      .maybeSingle();

    // Un dossier introuvable APRÈS l'insertion signale une base incohérente : même traitement que
    // l'intention absente, on laisse Stripe rejouer plutôt que d'accuser réception dans le vide.
    if (!dossier) throw new Error(`dossier introuvable après insertion ${paymentIntent.id}`);

    await supabaseAdmin.from("payments").upsert(
      {
        user_id: intent.user_id,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        product_type: productType,
        status: "succeeded",
        email: userEmail || null,
        target_insee: intent.insee,
      },
      { onConflict: "stripe_payment_intent_id" },
    );

    // AUCUN report_grant dérivé : le droit territorial se déduit de l'existence du dossier, donc
    // `access_revoked_at` le retire sans laisser un grant orphelin. On pose seulement le
    // territoire ACTIF de lecture, au grain commune (PLM ferait lire « Paris 1er »).
    await supabaseAdmin
      .from("user_profiles")
      .update({ active_insee_code: communeParent(intent.insee), active_commune: intent.city })
      .eq("user_id", intent.user_id);

    // ÉMIS À LA CRÉATION SEULEMENT. Un rejeu compterait un second achat, et son `rank_in_dossiers`
    // serait faux puisque le dossier existe déjà au moment du décompte. `$insert_id` ajoute une
    // déduplication côté PostHog, au cas où deux instances traiteraient le même événement.
    if (created) {
      const posthog = getPostHogClient();
      posthog.capture({
        distinctId: sanitizeDistinctId(phDistinctId, intent.user_id),
        event: "address_dossier_purchased",
        properties: {
          $insert_id: `address_dossier_purchased_${paymentIntent.id}`,
          amount_paid_cents: paymentIntent.amount,
          deducted: (intent.territory_deduction_cents ?? 0) > 0,
          insee: intent.insee,
          dossier_id: dossier.id,
          rank_in_dossiers: (paidBefore ?? 0) + 1,
        },
      });
      await posthog.shutdown();
    }
    return;
  }
```

Importer `communeParent` et `sanitizeDistinctId` en tête du fichier.

**`rank_in_dossiers`** s'ajoute ici, avec sa source réelle : un `count` des dossiers payés du compte
avant l'insertion.

- [ ] **Step 9: Écrire la route de statut**

Créer `src/app/api/dossier/statut/route.ts` :

```ts
import "server-only";
import { NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/user-account";

export const dynamic = "force-dynamic";

// Le dossier d'un paiement, POUR SON PROPRIÉTAIRE SEULEMENT.
//
// La recherche porte sur `stripe_payment_intent_id` ET `user_id`. Sans le second, quiconque détient
// un identifiant de PaymentIntent pourrait sonder l'existence d'un dossier et récupérer son uuid,
// qui est la clé d'ouverture de toutes les pages du bien. L'exigence est gratuite : aucun paiement
// ne peut avoir lieu sans authentification.
export async function GET(request: Request) {
  const { supabase, user } = await requireCurrentUser();
  const pi = new URL(request.url).searchParams.get("pi");
  if (!pi) return NextResponse.json({ error: "pi requis" }, { status: 400 });

  const { data } = await supabase
    .from("address_dossiers")
    .select("id")
    .eq("stripe_payment_intent_id", pi)
    .eq("user_id", user.id)
    .is("access_revoked_at", null)
    .maybeSingle();

  return NextResponse.json(data?.id ? { status: "ready", dossierId: data.id } : { status: "pending" });
}
```

- [ ] **Step 10: Écrire la page d'attente**

Créer `src/app/(account)/dossier/merci/page.tsx` :

```tsx
export const dynamic = "force-dynamic";

import Navbar from "@/components/Navbar";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/user-account";
import { DossierMerciClient } from "./DossierMerciClient";

export default async function DossierMerciPage({
  searchParams,
}: {
  searchParams: Promise<{ payment_intent?: string }>;
}) {
  await requireCurrentUser();
  const { payment_intent: pi } = await searchParams;
  // Sans identifiant de paiement, il n'y a rien à attendre : la liste des dossiers dit la vérité.
  if (!pi) redirect("/rapport/dossiers");

  return (
    <div
      className="min-h-screen bg-canvas text-label relative overflow-hidden"
      style={{ fontFamily: "'Instrument Sans', sans-serif" }}
    >
      <Navbar />
      <div className="relative z-[2] max-w-[920px] mx-auto px-7 pb-24 pt-14">
        <h1
          className="font-normal text-[clamp(26px,3vw,40px)] leading-[1.15] tracking-[-0.5px] text-label mb-6"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Merci.
        </h1>
        <DossierMerciClient paymentIntentId={pi} />
      </div>
    </div>
  );
}
```

`searchParams` est une promesse dans cette version de Next : lire
`node_modules/next/dist/docs/` avant d'écrire une signature de page si celle-ci est refusée au build.

Créer ensuite `src/app/(account)/dossier/merci/DossierMerciClient.tsx`. Il interroge
`/api/dossier/statut` toutes les 2 secondes et, au bout de 30 secondes, cesse d'interroger :

```tsx
"use client";

import { useEffect, useState } from "react";

// Elle NE PEUT PAS supposer le dossier créé : Stripe confirme côté client avant que le webhook
// n'arrive. Discipline d'attente du produit : la matière d'abord, ce que la lecture permet
// ensuite, la transparence sur le délai en dernier.
export function DossierMerciClient({ paymentIntentId }: { paymentIntentId: string }) {
  const [state, setState] = useState<"waiting" | "ready" | "slow">("waiting");
  const [dossierId, setDossierId] = useState<string | null>(null);

  useEffect(() => {
    let stop = false;
    const started = Date.now();
    const tick = async () => {
      if (stop) return;
      const res = await fetch(`/api/dossier/statut?pi=${encodeURIComponent(paymentIntentId)}`);
      const payload = (await res.json().catch(() => null)) as
        | { status: string; dossierId?: string } | null;
      if (payload?.status === "ready" && payload.dossierId) {
        setDossierId(payload.dossierId);
        setState("ready");
        window.location.href = `/rapport/dossiers/ouvrir?id=${payload.dossierId}&vers=logement`;
        return;
      }
      if (Date.now() - started > 30_000) { setState("slow"); return; }
      setTimeout(tick, 2000);
    };
    tick();
    return () => { stop = true; };
  }, [paymentIntentId]);

  if (state === "slow") {
    return (
      <p className="text-[15px] text-muted leading-relaxed">
        Votre paiement est enregistré. Votre dossier s&apos;ouvre dans un instant : vous le
        retrouverez dans vos dossiers.
      </p>
    );
  }

  return (
    <p className="text-[15px] text-muted leading-relaxed">
      {dossierId ? "Nous ouvrons votre dossier." : "Nous préparons votre dossier."}
    </p>
  );
}
```

La redirection vise `/rapport/dossiers/ouvrir`, une **Route Handler** : elle se fait par
`window.location`, jamais par `<Link>`.

- [ ] **Step 11: Éprouver un achat de bout en bout**

En mode test Stripe, sur une adresse `housenumber`, avec le webhook branché
(`stripe listen --forward-to localhost:3000/api/stripe/webhook`) :

1. `/dossier`, qualifier « 2 rue Crébillon Nantes », cliquer « Créer mon dossier » ;
2. payer avec `4242 4242 4242 4242` ;
3. la page d'attente doit basculer sur le dossier en quelques secondes ;
4. en base : une ligne `address_dossiers` avec `stripe_payment_intent_id`, `amount_paid_cents` égal
   au montant Stripe, `purchased_at` renseigné ;
5. rejouer l'événement depuis le dashboard Stripe : **aucun second dossier**, et le webhook répond
   en succès ;
6. relancer un achat sur la **même adresse** : un second dossier légitime doit se créer, au tarif
   d'approfondissement de 25 € puisque la commune est désormais payée.

- [ ] **Step 12: Committer**

```bash
git add supabase/26_dossier_intents.sql src/lib/ban-verify.ts src/lib/ban-verify.test.ts \
        src/lib/ban.ts src/app/api/stripe/create-payment-intent/route.ts \
        src/app/api/stripe/webhook/route.ts src/app/api/dossier/statut/route.ts \
        "src/app/(account)/dossier/merci"
git commit -m "Le serveur décide de l'adresse achetée, le webhook crée le dossier, l'attente ne ment pas"
```

---

### Task 8: Retirer la porte administrative

Elle existait pour éprouver les écrans sans checkout. Le checkout existe.

**Files:**
- Modify: variables d'environnement de production (`ENABLE_ADMIN_DOSSIER_CREATION`)
- Modify: `src/app/(account)/rapport/dossiers/page.tsx` (retrait de `AdminDossierCreator`)
- Delete: `src/app/api/admin/dossier/route.ts`, `src/components/report/AdminDossierCreator.tsx`,
  `src/lib/server/admin-dossier.ts`

**Interfaces:**
- Consumes: le parcours complet de la tâche 7, **vérifié en production**.
- Produces: rien. C'est une suppression.

- [ ] **Step 1: Ne rien supprimer avant un achat réel réussi en production**

Condition d'entrée dans cette tâche : au moins un dossier créé par un vrai paiement, ouvert et lu.
Tant que ce n'est pas le cas, la porte administrative reste le seul moyen d'éprouver les écrans.

- [ ] **Step 2: Retirer la variable d'environnement de production**

Retirer `ENABLE_ADMIN_DOSSIER_CREATION` de l'environnement Vercel. La route répond alors 404 quelle
que soit la liste d'e-mails. **Ce geste seul suffit à fermer la porte** : le reste est du nettoyage.

- [ ] **Step 3: Supprimer les deux dossiers de test en base**

```sql
delete from public.address_dossiers where stripe_payment_intent_id is null;
```

La condition n'est pas cosmétique : elle rend cette commande incapable de détruire un achat, quel
que soit le moment où quelqu'un la rejoue.

- [ ] **Step 4: Supprimer le code**

Retirer l'import et l'usage de `AdminDossierCreator` dans `rapport/dossiers/page.tsx`, ainsi que
`canCreate` et l'import de `isAdminDossierCreator`. Puis supprimer les trois fichiers.

- [ ] **Step 5: Vérifier**

Run: `npx tsc --noEmit && npm run build`
Expected: succès, aucune référence pendante.

- [ ] **Step 6: Committer**

```bash
git add -u
git commit -m "Le checkout existe : la porte administrative n'a plus de raison de rester ouverte"
```

---

## Ce que ce plan ne construit pas

Carte, sélecteur de parcelle, placement manuel d'un bien non adressé. Table de parcours, table de
qualifications, rattachement post-paiement par e-mail. Pack, pass de recherche, remise dégressive,
grille tarifaire, test A/B de prix, tableau de bord. Téléversement de documents. Rattachement
bâtimentaire RNB (`docs/audits/2026-07-30-rnb-dpe-rattachement-batiment.md`). Intake déclaratif et
confirmation de diagnostic, qui appartiennent à la spec B et vivent après le paiement.

`address_dossier_reopened` n'est pas dans ce plan : il se pose avec la première lecture d'un dossier
possédé, hors du parcours d'achat.

**La captation d'e-mail après un refus non plus.** La spec mentionne une valeur `notified` pour
`address_qualification_exit` ; le lancement ne la produit pas. Motif : recueillir un e-mail demande
une table (patron `pro_inscriptions`) et une politique de conservation, alors que le refus s'est
avéré **rare** une fois les numéros ruraux découverts par le reverse. La valeur revient avec le geste
de placement manuel, dont elle mesurera la demande. En attendant, `address_qualification_exit` ne
porte que `territory_14` et `left`, et le volume de refus se lit sur
`address_qualification_result`.

## Ordre et dépendances

```
Task 1 (garde auth) ──┬── Task 2 (identité PostHog)
                      │
Task 3 (lib pure) ────┴── Task 4 (sondes) ── Task 5 (route) ── Task 6 (porte)
                                                                     │
                                    Task 7A (checkout) ── Task 7 (intention + webhook + attente)
                                                                     │
                                                      Task 8 (retrait de la porte admin)
```

Les tâches 1 et 3 sont indépendantes et peuvent démarrer en parallèle. **7A dépend de deux fonctions
écrites dans la tâche 7** (`fetchBanFeaturesByLabel` et `pickFeatureById`, étapes 3 à 6) : écrire ces
deux-là d'abord, puis 7A, puis le reste de la tâche 7. La tâche 8 attend un achat réel en
production.

## Ce que l'exécution ne peut pas vérifier seule

Trois choses demandent un œil humain et ne se déduisent d'aucun test :

- **Le refus doit se lire comme une preuve de sérieux**, pas comme une panne. Si l'écran
  `unsupported_at_launch` donne l'impression que le produit est cassé, la copie a échoué même si le
  code est juste.
- **Le renvoi vers la commune à 14 € ne doit pas dominer l'écran de refus.** Un refus qui débouche
  sur une vente mise en avant devient une technique commerciale.
- **La bascule de prix de 39 € à 25 € doit se comprendre**, jamais surprendre.
