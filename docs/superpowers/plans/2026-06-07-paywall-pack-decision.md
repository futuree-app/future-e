# Paywall Pack Décision (39 €) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Vendre le Pack Décision 39 € : un bundle qui déverrouille, pour un trio de communes, la comparaison complète, les 3 rapports territoire, 3 nouvelles pistes (rangs 4-6) et AskFuture (9 questions incluses).

**Architecture :** L'unité d'achat est le trio (clé `trio_key` = 3 INSEE triés). Le verrou est une séparation de payload serveur : la matrice complète n'a AUCUN endpoint d'API, elle n'est rendue que côté serveur pour un acheteur vérifié en base ; le `/match` gratuit cesse de la renvoyer ; un endpoint d'aperçu ne sert que du tronqué. L'achat crée une ligne `decision_packs` (avec snapshot du projet) plus 3 `report_grants`, via le webhook Stripe (idempotent) doublé d'un appel optimiste au retour de paiement.

**Tech Stack :** Next.js App Router (version à breaking changes, lire `node_modules/next/dist/docs/` avant d'écrire), Supabase (SQL + RLS, service role pour les écritures Stripe), Stripe PaymentIntent, React client components. Pas de test runner : vérification par `npx tsc --noEmit`, `npx eslint <fichiers>`, sondes `scripts/sonde-*.mjs` contre `npm run dev`, et `curl`.

**Spec de référence :** `docs/superpowers/specs/2026-06-07-paywall-pack-decision-design.md`

---

## Conventions de ce plan

- **Pas de tiret cadratin** dans tout copy produit : virgule ou deux points (doctrine `feedback_no_em_dash`).
- **`var(--accent)` n'existe pas** en CSS inline : utiliser les classes Tailwind `text-accent` / `bg-accent`, ou les tokens `--orange` / `--orange-tint` / `--orange-ring`. Jamais `style={{ color: "var(--accent)" }}`.
- Branche : `feat/paywall-pack-decision`, merge `--ff-only` sur `main` à la fin.
- Vérif standard à chaque tâche : `npx tsc --noEmit` propre, `npx eslint <fichiers touchés>` propre (ne PAS linter tout le repo, ~100 erreurs préexistantes).

---

## File Structure

**Créés :**
- `supabase/13_init_decision_packs.sql` : table `decision_packs` + `pack_snapshots` (staging) + RLS.
- `src/lib/decision-packs.ts` : types + `trioKey()`, `resolvePackOwnership()`, `grantDecisionPackFromSnapshot()` (server-only, partagée webhook + page de retour).
- `src/app/api/comparateur-vie/apercu/route.ts` : aperçu tronqué (toujours, jamais le complet).
- `src/app/(public)/comparateur/pack-decision/page.tsx` : page serveur, branche possédé / teaser.
- `src/app/(public)/comparateur/pack-decision/PackConvictionView.tsx` : client, teaser + achat.
- `src/app/(public)/comparateur/pack-decision/PackUnlockedView.tsx` : client, comparaison complète + 3 pistes + liens rapports.
- `src/app/(public)/comparateur/pack-decision/PackPaymentPanel.tsx` : client, panneau Stripe du pack.
- `scripts/sonde-pack-decision.mjs` : sonde verrou + pistes.

**Modifiés :**
- `src/lib/comparateur-vie.ts` : `matchProjects` calcule `pistes` (rangs 4-6, narratif) ; ajout du champ `pistes` à `MatchOutcome` ; export d'un helper `truncateComparaison()`.
- `src/app/api/comparateur-vie/match/route.ts` : strip `comparaisonComplete` + `pistes` + résultats au-delà du top 3.
- `src/lib/checkout-products.ts` : produit `pack-decision` (39 €).
- `src/app/api/stripe/create-payment-intent/route.ts` : prix `pack-decision`, metadata trio, persistance du snapshot dans `pack_snapshots`.
- `src/app/api/stripe/webhook/route.ts` : branche `pack-decision` (decision_pack + 3 grants + entitlements one_shot depuis le staging).
- `src/app/api/ask/route.ts` : quota AskFuture proportionnel aux droits (3 × report_grants, pool unique).
- `src/components/PaymentWrapper.tsx` : prop `pack` (trio + snapshot) + `returnUrl` configurable.
- `src/components/PaymentForm.tsx` : `return_url` configurable (prop).
- `src/app/(public)/ou-vivre/OuVivreClient.tsx` : CTA Pack Décision persiste `parsed` + trio en `localStorage` et navigue vers la page ; suppression du rendu libre `view === "complete"`.
- `src/app/(public)/ou-vivre/CompareView.tsx` : CTA Pack Décision pointe vers la page ; correction du bug `var(--accent)`.

---

## Task 1 : Migration `decision_packs` + `pack_snapshots`

**Files:**
- Create: `supabase/13_init_decision_packs.sql`

- [ ] **Step 1: Écrire la migration**

```sql
begin;

-- ════════════════════════════════════════════════════════════════════════════
-- decision_packs : un Pack Décision acheté = un arbitrage entre TROIS communes.
--
-- L'unité d'achat est le trio (trio_key = 3 INSEE triés, joints par '-'). Le
-- projet acheté est figé dans parsed_snapshot : la comparaison et les pistes du
-- pack se recalculent depuis ce snapshot, jamais depuis le projet courant, pour
-- que l'acheteur retrouve exactement ce qu'il a payé. Le pack ne réimplémente
-- pas les rapports : il crée en plus 3 report_grants (un par commune).
--
-- Écriture : service role (webhook Stripe + endpoint optimiste). Lecture :
-- l'utilisateur lit ses propres packs.
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.decision_packs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  trio_key text not null,                 -- 3 INSEE triés joints par '-'
  insee_1 text not null,
  insee_2 text not null,
  insee_3 text not null,
  commune_1 text,
  commune_2 text,
  commune_3 text,
  projet_label text,
  parsed_snapshot jsonb not null,         -- ParsedProject figé à l'achat
  stripe_payment_intent_id text,
  created_at timestamptz not null default now(),
  unique (user_id, trio_key)
);

create index if not exists decision_packs_user_id_idx
  on public.decision_packs (user_id);

alter table public.decision_packs enable row level security;

drop policy if exists decision_packs_select_own on public.decision_packs;
create policy decision_packs_select_own
  on public.decision_packs
  for select
  using (auth.uid() = user_id);

-- ── Staging du snapshot entre create-payment-intent et webhook ──────────────
-- Le ParsedProject dépasse la limite de 500 caractères par clé des metadata
-- Stripe. On le persiste ici à la création du PaymentIntent (clé = PI id) et le
-- webhook (ou l'endpoint optimiste) le relit. Service role uniquement.
create table if not exists public.pack_snapshots (
  stripe_payment_intent_id text primary key,
  user_id uuid references auth.users (id) on delete cascade,
  trio_key text not null,
  insee_1 text not null,
  insee_2 text not null,
  insee_3 text not null,
  commune_1 text,
  commune_2 text,
  commune_3 text,
  projet_label text,
  parsed_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.pack_snapshots enable row level security;
-- Aucune policy : lecture/écriture par service role uniquement (bypass RLS).

commit;
```

- [ ] **Step 2: Appliquer la migration**

Appliquer le SQL sur la base Supabase du projet (même méthode que les migrations `01`–`12` ; voir `supabase/README.md`). Si la commande échoue, NE PAS inventer : remonter l'erreur.

- [ ] **Step 3: Vérifier l'existence des tables**

Via le SQL editor Supabase ou `psql` :
```sql
select to_regclass('public.decision_packs'), to_regclass('public.pack_snapshots');
```
Expected : les deux renvoient le nom de la table (non `null`).

- [ ] **Step 4: Commit**

```bash
git checkout -b feat/paywall-pack-decision
git add supabase/13_init_decision_packs.sql
git commit -m "feat(pack-decision): migration decision_packs + pack_snapshots"
```

---

## Task 2 : `matchProjects` calcule les pistes (rangs 4-6)

Les rangs 4-6 doivent recevoir le même narratif que le trio (identité, forces, compromis), calculé comme leur propre groupe de 3 (cohérence : le narratif du trio reste relatif à un groupe de 3, inchangé). Le champ `pistes` est ajouté à `MatchOutcome` ; le verrou (Task 3) décidera de le renvoyer ou non.

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (type `MatchOutcome` ~ligne 268 ; corps de `matchProjects` ~ligne 2150-2185)

- [ ] **Step 1: Ajouter le champ `pistes` au type `MatchOutcome`**

Dans `src/lib/comparateur-vie.ts`, dans `export type MatchOutcome = { ... }`, après la ligne `comparaisonComplete: ComparaisonComplete;` ajouter :

```ts
  // Pistes : les communes suivantes (rangs 4-5-6) du MÊME projet, narratif calculé
  // comme leur propre groupe de 3 (identité, forces, compromis), pour le Pack Décision.
  // Réservé au payload payant : le verrou (route /match) le retire de la réponse gratuite.
  pistes: MatchResult[];
```

- [ ] **Step 2: Calculer les pistes dans `matchProjects`**

Dans `matchProjects`, juste APRÈS le bloc qui assigne le narratif du trio
(`assignSignaux(shownPicks, ...)` … `assignDecouverte(shownPicks, ...)`) et AVANT
`const comparaisonComplete = buildComparaisonComplete(shownPicks, byInsee);`, insérer :

```ts
  // Pistes : rangs 4-5-6, narratif calculé comme un groupe de 3 distinct (le trio
  // garde son narratif relatif au groupe de 3 affiché). byInsee couvre déjà tous
  // les candidats. Cartes seulement : pas de comparaison complète sur les pistes.
  const pistesPicks = deduped.slice(3, 6);
  if (pistesPicks.length) {
    const pistesDistinctive = buildDistinctive(
      pistesPicks.map((r) => byInsee.get(r.insee)).filter((c): c is IndexCommune => c != null),
      liDistinct,
    );
    for (const r of pistesPicks) r.distinctive = pistesDistinctive[r.insee] ?? null;
    assignSignaux(pistesPicks, byInsee, requestedKeys);
    assignIdentite(pistesPicks, byInsee);
    assignCompromis(pistesPicks, byInsee, tradeoffKeyByInsee);
    assignDecouverte(pistesPicks, byInsee, requestedKeys);
  }
```

- [ ] **Step 3: Renvoyer `pistes` dans l'outcome**

Dans le `return { ... }` de `matchProjects`, après `comparaisonComplete,` ajouter :

```ts
    pistes: pistesPicks,
```

- [ ] **Step 4: Vérifier le typage**

Run: `npx tsc --noEmit`
Expected : aucune erreur. (Si `liDistinct` n'est pas dans le scope au point d'insertion, le réutiliser depuis le bloc trio juste au-dessus : c'est la même variable déjà construite pour `buildDistinctive(shownPicks…)`.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparateur-vie.ts
git commit -m "feat(pack-decision): matchProjects calcule les pistes (rangs 4-6)"
```

---

## Task 3 : Verrou sur `/api/comparateur-vie/match` + helper de troncature

Le `/match` gratuit ne doit plus livrer la matrice complète, les pistes, ni les résultats au-delà du top 3. On ajoute aussi un helper exporté `truncateComparaison()` réutilisé par l'aperçu (Task 4).

**Files:**
- Modify: `src/lib/comparateur-vie.ts` (nouvel export)
- Modify: `src/app/api/comparateur-vie/match/route.ts`

- [ ] **Step 1: Exporter `truncateComparaison` dans `comparateur-vie.ts`**

À la fin de `src/lib/comparateur-vie.ts`, ajouter :

```ts
// Aperçu tronqué de la comparaison complète : on ne garde que les 2 premiers thèmes,
// pour le teaser de la page de conviction. Le complet n'a aucun endpoint d'API.
export function truncateComparaison(cc: ComparaisonComplete): ComparaisonComplete {
  return {
    resume: cc.resume.slice(0, 1),
    themes: cc.themes.slice(0, 2),
  };
}
```

- [ ] **Step 2: Strip du payload payant dans la route `/match`**

Remplacer, dans `src/app/api/comparateur-vie/match/route.ts`, le bloc :

```ts
  try {
    const outcome = await matchProjects(parsed);
    return NextResponse.json(outcome);
  } catch (error) {
```

par :

```ts
  try {
    const outcome = await matchProjects(parsed);
    // VERROU : la matrice complète et les pistes sont payantes (Pack Décision).
    // On ne les expose jamais dans la réponse gratuite, et on borne les résultats
    // au top 3 (la CompareView gratuite n'affiche que le trio).
    const { comparaisonComplete: _cc, pistes: _p, ...safe } = outcome;
    return NextResponse.json({ ...safe, results: outcome.results.slice(0, 3) });
  } catch (error) {
```

- [ ] **Step 3: Vérifier que le verrou tient (sonde curl)**

Démarrer le serveur si besoin : `npm run dev` (port 3000). Puis :
```bash
PARSED=$(curl -s localhost:3000/api/comparateur-vie/parse -H 'content-type: application/json' \
  -d '{"text":"Un coin calme près de la mer pour ma retraite, avec de bons médecins."}')
echo "$PARSED" | node -e 'process.stdin.resume();let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const p=JSON.parse(d).parsed;fetch("http://localhost:3000/api/comparateur-vie/match",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({parsed:p})}).then(r=>r.json()).then(o=>{console.log("comparaisonComplete present?",o.comparaisonComplete!==undefined,"| pistes present?",o.pistes!==undefined,"| results:",o.results.length)})})'
```
Expected : `comparaisonComplete present? false | pistes present? false | results: 3`

- [ ] **Step 4: `tsc` + `eslint`**

Run: `npx tsc --noEmit && npx eslint src/app/api/comparateur-vie/match/route.ts src/lib/comparateur-vie.ts`
Expected : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add src/lib/comparateur-vie.ts src/app/api/comparateur-vie/match/route.ts
git commit -m "feat(pack-decision): verrou serveur (strip matrice + pistes du /match gratuit)"
```

---

## Task 4 : Endpoint d'aperçu tronqué `/api/comparateur-vie/apercu`

Cet endpoint ne renvoie JAMAIS le complet, seulement le tronqué (sûr par construction). Le teaser de la page de conviction l'appelle.

**Files:**
- Create: `src/app/api/comparateur-vie/apercu/route.ts`

- [ ] **Step 1: Écrire la route**

```ts
// ════════════════════════════════════════════════════════════════════════════
// Comparateur de vie · APERÇU (teaser Pack Décision)
// POST { parsed } → comparaison complète TRONQUÉE (2 thèmes). Jamais le complet :
// la matrice intégrale n'a aucun endpoint d'API, elle n'est rendue que côté
// serveur pour un acheteur vérifié (cf. page pack-decision).
// ════════════════════════════════════════════════════════════════════════════

import { NextResponse, type NextRequest } from "next/server";
import { matchProjects, truncateComparaison, type ParsedProject } from "@/lib/comparateur-vie";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let parsed: ParsedProject;
  try {
    ({ parsed } = await request.json());
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.preferences)) {
    return NextResponse.json({ error: "Projet structuré manquant ou invalide." }, { status: 400 });
  }
  if (!parsed.hardConstraints || typeof parsed.hardConstraints !== "object") {
    parsed.hardConstraints = {};
  }

  try {
    const outcome = await matchProjects(parsed);
    return NextResponse.json({
      apercu: truncateComparaison(outcome.comparaisonComplete),
      trio: outcome.results.slice(0, 3).map((r) => ({ insee: r.insee, nom: r.nom })),
    });
  } catch (error) {
    console.error("[comparateur-vie/apercu]", error);
    return NextResponse.json({ error: "Erreur lors du calcul de l'aperçu." }, { status: 500 });
  }
}
```

- [ ] **Step 2: Vérifier (curl)**

Avec `npm run dev` lancé :
```bash
echo "$PARSED" | node -e 'process.stdin.resume();let d="";process.stdin.on("data",c=>d+=c);process.stdin.on("end",()=>{const p=JSON.parse(d).parsed;fetch("http://localhost:3000/api/comparateur-vie/apercu",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({parsed:p})}).then(r=>r.json()).then(o=>{console.log("themes tronqués:",o.apercu.themes.length,"| trio:",o.trio.map(t=>t.nom).join(", "))})})'
```
Expected : `themes tronqués: 2 | trio: …` (3 noms).

- [ ] **Step 3: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint src/app/api/comparateur-vie/apercu/route.ts
git add src/app/api/comparateur-vie/apercu/route.ts
git commit -m "feat(pack-decision): endpoint apercu tronque (teaser)"
```

---

## Task 5 : Helpers `decision-packs.ts` (ownership + snapshot)

**Files:**
- Create: `src/lib/decision-packs.ts`

- [ ] **Step 1: Écrire le module**

```ts
import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedProject } from "@/lib/comparateur-vie";

// trio_key : les 3 INSEE triés, joints par '-'. Identité de l'achat (un trio).
// Robuste à l'ordre des colonnes : Annecy/Chambéry/Grenoble et Grenoble/Annecy/
// Chambéry donnent la même clé.
export function trioKey(insees: string[]): string {
  return insees
    .map((i) => i.trim().toUpperCase())
    .filter(Boolean)
    .sort()
    .join("-");
}

export type DecisionPack = {
  trioKey: string;
  insees: [string, string, string];
  communes: [string | null, string | null, string | null];
  projetLabel: string | null;
  parsedSnapshot: ParsedProject;
};

// L'utilisateur possède-t-il le pack pour ce trio ? Lecture RLS (ses propres packs).
export async function resolvePackOwnership(
  supabase: SupabaseClient,
  userId: string,
  insees: string[],
): Promise<DecisionPack | null> {
  const key = trioKey(insees);
  const { data } = await supabase
    .from("decision_packs")
    .select(
      "trio_key, insee_1, insee_2, insee_3, commune_1, commune_2, commune_3, projet_label, parsed_snapshot",
    )
    .eq("user_id", userId)
    .eq("trio_key", key)
    .maybeSingle();

  if (!data) return null;
  return {
    trioKey: data.trio_key,
    insees: [data.insee_1, data.insee_2, data.insee_3],
    communes: [data.commune_1, data.commune_2, data.commune_3],
    projetLabel: data.projet_label,
    parsedSnapshot: data.parsed_snapshot as ParsedProject,
  };
}
```

- [ ] **Step 2: Ajouter la fonction d'octroi partagée (webhook + page de retour)**

`confirmPayment` redirige vers `return_url` sur succès (pas de `redirect: "if_required"`), donc le
`onSuccess` client ne s'exécute pas de façon fiable : l'octroi se fait côté serveur, soit par le
webhook, soit par la page de retour qui lit `?payment_intent`. Cette fonction est l'octroi unique,
idempotent, appelée par les deux. Ajouter à la fin de `src/lib/decision-packs.ts` :

```ts
// Octroi du pack depuis le snapshot en staging (pack_snapshots), idempotent.
// `admin` doit être un client service-role (bypass RLS). Si `expectedUserId` est
// fourni, on vérifie que le snapshot appartient bien à cet utilisateur (sécurité
// quand l'appel vient de la page de retour, pas du webhook signé). `email` permet
// de poser les entitlements one_shot (report_access complete) sans clobber : tout
// utilisateur connecté a déjà sa ligne user_accounts, l'upsert est un UPDATE.
// Retourne le trio_key octroyé, ou null si rien à faire.
export async function grantDecisionPackFromSnapshot(
  admin: SupabaseClient,
  paymentIntentId: string,
  expectedUserId?: string,
  email?: string,
): Promise<string | null> {
  const { data: snap } = await admin
    .from("pack_snapshots")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  if (!snap || !snap.user_id) return null;
  if (expectedUserId && snap.user_id !== expectedUserId) return null;

  await admin.from("decision_packs").upsert(
    {
      user_id: snap.user_id,
      trio_key: snap.trio_key,
      insee_1: snap.insee_1,
      insee_2: snap.insee_2,
      insee_3: snap.insee_3,
      commune_1: snap.commune_1,
      commune_2: snap.commune_2,
      commune_3: snap.commune_3,
      projet_label: snap.projet_label,
      parsed_snapshot: snap.parsed_snapshot,
      stripe_payment_intent_id: paymentIntentId,
    },
    { onConflict: "user_id,trio_key" },
  );

  await admin.from("report_grants").upsert(
    [
      { insee: snap.insee_1, commune: snap.commune_1 },
      { insee: snap.insee_2, commune: snap.commune_2 },
      { insee: snap.insee_3, commune: snap.commune_3 },
    ].map((t, i) => ({
      user_id: snap.user_id,
      insee: t.insee,
      commune: t.commune,
      source: "pack_decision",
      rank: i + 1,
      stripe_payment_intent_id: paymentIntentId,
    })),
    { onConflict: "user_id,insee" },
  );

  // Entitlements one_shot au niveau compte : sans report_access = complete,
  // l'acheteur ne pourrait NI lire les rapports (canAccessCompleteReport) NI
  // utiliser AskFuture (api/ask bloque le plan free). Mêmes droits qu'un achat
  // rapport one-shot. email requis seulement à l'INSERT (la ligne existe déjà).
  if (email) {
    await admin.from("user_accounts").upsert(
      {
        user_id: snap.user_id,
        email,
        plan: "one_shot",
        status: "active",
        report_access: "complete",
        dashboard_access: "read_only",
      },
      { onConflict: "user_id" },
    );
  }

  return snap.trio_key as string;
}
```

- [ ] **Step 3: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint src/lib/decision-packs.ts
git add src/lib/decision-packs.ts
git commit -m "feat(pack-decision): helpers trioKey + resolvePackOwnership + grant partage"
```

---

## Task 6 : Produit `pack-decision` + create-payment-intent + staging du snapshot

**Files:**
- Modify: `src/lib/checkout-products.ts`
- Modify: `src/app/api/stripe/create-payment-intent/route.ts`

- [ ] **Step 1: Ajouter le produit `pack-decision`**

Dans `src/lib/checkout-products.ts`, élargir le type union et la map. Remplacer la ligne du type :

```ts
export type CheckoutProductSlug = "rapport-complet" | "suivi";
```

par :

```ts
export type CheckoutProductSlug = "rapport-complet" | "suivi" | "pack-decision";
```

Ajouter dans `CHECKOUT_PRODUCTS`, après l'entrée `suivi` :

```ts
  "pack-decision": {
    slug: "pack-decision",
    title: "Pack Décision",
    subtitle:
      "L'arbitrage entre trois territoires : la comparaison complète, leurs trois rapports, et trois nouvelles pistes.",
    amount: 39,
    priceLabel: "39 € une fois",
    productType: "pack-decision",
    ctaLabel: "Débloquer le Pack Décision",
    features: [
      "La comparaison complète des trois territoires, thème par thème",
      "Les trois rapports complets, un par commune",
      "Trois nouvelles pistes sur le même projet",
      "AskFuture : 9 questions incluses",
    ],
  },
```

Élargir le type `productType` dans le même fichier (la propriété de `CheckoutProduct`) :

```ts
  productType: "one-shot" | "suivi-solo" | "pack-decision";
```

Et `getCheckoutProduct` :

```ts
export function getCheckoutProduct(slug: string) {
  if (slug === "rapport-complet" || slug === "suivi" || slug === "pack-decision") {
    return CHECKOUT_PRODUCTS[slug];
  }
  return null;
}
```

- [ ] **Step 2: Étendre `create-payment-intent` (prix + trio + staging snapshot)**

Dans `src/app/api/stripe/create-payment-intent/route.ts` :

Ajouter le prix `pack-decision` à `PRODUCT_PRICES` :
```ts
  "pack-decision": { amountEur: 39, stripePriceId: process.env.STRIPE_PACK_PRICE_ID ?? "" },
```

Remplacer la lecture du body :
```ts
    const { productType, targetInsee, targetCommune, source, rank } =
      await request.json();
```
par :
```ts
    const { productType, targetInsee, targetCommune, source, rank, pack } =
      await request.json();
```

Juste avant `const paymentIntent = await stripe.paymentIntents.create({`, insérer la
validation + préparation du pack (le snapshot ne va PAS dans les metadata Stripe,
trop volumineux : il est mis en staging après création du PaymentIntent) :

```ts
    // Pack Décision : trio de 3 INSEE valides + snapshot du projet. Le snapshot
    // est persisté en base (pack_snapshots) ; les metadata Stripe ne portent que
    // le petit (3 INSEE, 3 communes, libellé projet).
    const isPack = productType.trim() === "pack-decision";
    let packTrio: { insee: string; commune: string }[] = [];
    let packProjetLabel = "";
    if (isPack) {
      const raw = Array.isArray(pack?.trio) ? pack.trio : [];
      packTrio = raw
        .map((t: { insee?: string; commune?: string }) => ({
          insee: typeof t?.insee === "string" && /^[0-9AB][0-9]{4}$/i.test(t.insee.trim())
            ? t.insee.trim().toUpperCase() : "",
          commune: typeof t?.commune === "string" ? t.commune.trim().slice(0, 120) : "",
        }))
        .filter((t: { insee: string }) => t.insee);
      if (packTrio.length !== 3) {
        return NextResponse.json({ error: "Trio de 3 communes requis." }, { status: 400 });
      }
      if (!pack?.parsedSnapshot || typeof pack.parsedSnapshot !== "object") {
        return NextResponse.json({ error: "Projet manquant." }, { status: 400 });
      }
      packProjetLabel = typeof pack?.projetLabel === "string" ? pack.projetLabel.trim().slice(0, 200) : "";
    }
```

Dans `metadata` du `paymentIntents.create`, ajouter (après `grantRank: cleanRank,`) :

```ts
        packInsee1: isPack ? packTrio[0].insee : "",
        packInsee2: isPack ? packTrio[1].insee : "",
        packInsee3: isPack ? packTrio[2].insee : "",
        packCommune1: isPack ? packTrio[0].commune : "",
        packCommune2: isPack ? packTrio[1].commune : "",
        packCommune3: isPack ? packTrio[2].commune : "",
        packProjetLabel,
```

Juste APRÈS `const paymentIntent = await stripe.paymentIntents.create({ ... });`,
insérer la persistance du snapshot via service role :

```ts
    if (isPack) {
      const { createClient: createAdminClient } = await import("@supabase/supabase-js");
      const { trioKey } = await import("@/lib/decision-packs");
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
      );
      await admin.from("pack_snapshots").upsert(
        {
          stripe_payment_intent_id: paymentIntent.id,
          user_id: user?.id ?? null,
          trio_key: trioKey(packTrio.map((t) => t.insee)),
          insee_1: packTrio[0].insee,
          insee_2: packTrio[1].insee,
          insee_3: packTrio[2].insee,
          commune_1: packTrio[0].commune || null,
          commune_2: packTrio[1].commune || null,
          commune_3: packTrio[2].commune || null,
          projet_label: packProjetLabel || null,
          parsed_snapshot: pack.parsedSnapshot,
        },
        { onConflict: "stripe_payment_intent_id" },
      );
    }
```

- [ ] **Step 3: Déclarer l'env Stripe**

Ajouter `STRIPE_PACK_PRICE_ID` au fichier d'env local (`.env.local`) et sur Vercel
(valeur = l'ID de prix Stripe du Pack Décision 39 €). Si l'ID n'est pas encore créé
côté Stripe, le noter au porteur : sans lui, le PaymentIntent se crée quand même
(le price ID n'est qu'une trace en metadata), mais le créer pour la cohérence.

- [ ] **Step 4: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint src/lib/checkout-products.ts src/app/api/stripe/create-payment-intent/route.ts
git add src/lib/checkout-products.ts src/app/api/stripe/create-payment-intent/route.ts
git commit -m "feat(pack-decision): produit 39e + create-payment-intent (trio + staging snapshot)"
```

---

## Task 7 : Webhook : créer le pack + 3 grants

**Files:**
- Modify: `src/app/api/stripe/webhook/route.ts`

- [ ] **Step 1: Importer la fonction d'octroi partagée**

Dans `src/app/api/stripe/webhook/route.ts`, ajouter en tête l'import de la fonction partagée
(définie en Task 5, Step 2) :

```ts
import { grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
```

Pas de duplication : le webhook et la page de retour appellent la même fonction, idempotente.

- [ ] **Step 2: Brancher le pack dans `handleSucceededPayment`**

Au début de `handleSucceededPayment`, après la ligne `const resend = getResend();`, insérer :

```ts
  // Pack Décision : crée le pack + 3 grants + entitlements one_shot (report_access
  // complete) depuis le snapshot en staging, via la fonction partagée (l'email pose
  // les entitlements, sans quoi l'acheteur ne pourrait ni lire les rapports ni
  // utiliser AskFuture). Puis mail de confirmation, et on s'arrête (pas de
  // territoire actif, le pack gère son propre déblocage).
  if (productType === "pack-decision") {
    await grantDecisionPackFromSnapshot(supabaseAdmin, paymentIntent.id, undefined, userEmail || undefined);
    await supabaseAdmin.from("payments").upsert(
      {
        user_id: userId && userId !== "anonymous" ? userId : null,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        product_type: productType,
        status: "succeeded",
        email: userEmail || null,
      },
      { onConflict: "stripe_payment_intent_id" },
    );
    if (userEmail) {
      await resend.emails.send({
        from: "futur·e <hello@futur-e.fr>",
        to: userEmail,
        subject: "Votre Pack Décision futur·e est débloqué",
        html: `
          <p>Merci pour votre confiance.</p>
          <p>Votre comparaison complète et vos trois rapports sont accessibles depuis votre espace.</p>
          <p>— futur·e</p>
        `,
      });
    }
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: userEmail || userId || paymentIntent.id,
      event: "payment_completed",
      properties: { product_type: productType, amount: paymentIntent.amount / 100 },
    });
    await posthog.shutdown();
    return;
  }
```

- [ ] **Step 3: `tsc` + `eslint`**

Run: `npx tsc --noEmit && npx eslint src/app/api/stripe/webhook/route.ts`
Expected : aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/stripe/webhook/route.ts
git commit -m "feat(pack-decision): webhook cree le pack + 3 report_grants + entitlements"
```

---

## Task 7B : AskFuture, pool unique proportionnel aux droits (3 × grants)

Le quota AskFuture actuel (`api/ask`) pour un plan `one_shot` est un compteur **global de 3**, pas
« 3 par rapport ». Pour livrer honnêtement « 9 questions incluses » dans le Pack Décision (un seul
pool, pas trois compteurs), on rend le quota proportionnel aux droits : `quota = 3 × nombre de
report_grants`. Un rapport seul reste à 3 (1 grant), un pack donne 9 (3 grants), en un seul
compteur.

**Files:**
- Modify: `src/app/api/ask/route.ts` (bloc `if (plan === "one_shot") { ... }`, ~lignes 537-549)

- [ ] **Step 1: Remplacer le quota fixe par un quota proportionnel aux grants**

Dans `src/app/api/ask/route.ts`, remplacer :

```ts
    if (plan === "one_shot") {
      const { count } = await supabase
        .from("ask_conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");
      if ((count ?? 0) >= 3) {
        return NextResponse.json(
          { error: "Quota de 3 questions atteint. Passez au Suivi pour un accès illimité." },
          { status: 403 },
        );
      }
    }
```

par :

```ts
    if (plan === "one_shot") {
      // Pool unique proportionnel aux droits : 3 questions par territoire débloqué
      // (report_grant), comptées globalement. Un rapport seul = 3, un Pack Décision
      // (3 grants) = 9, en un seul compteur. Plancher de 3 (résidence sans grant).
      const { count: grantCount } = await supabase
        .from("report_grants")
        .select("insee", { count: "exact", head: true })
        .eq("user_id", user.id);
      const quota = 3 * Math.max(1, grantCount ?? 0);
      const { count: askedCount } = await supabase
        .from("ask_conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");
      if ((askedCount ?? 0) >= quota) {
        return NextResponse.json(
          { error: `Quota de ${quota} questions atteint. Passez au Suivi pour un accès illimité.` },
          { status: 403 },
        );
      }
    }
```

- [ ] **Step 2: `tsc` + `eslint`**

Run: `npx tsc --noEmit && npx eslint src/app/api/ask/route.ts`
Expected : aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/ask/route.ts
git commit -m "feat(pack-decision): AskFuture quota proportionnel aux droits (3 x grants)"
```

---

## Task 8 : Octroi au retour de paiement (sur la page, pas d'endpoint)

`confirmPayment` redirige vers `return_url` sur succès. L'octroi optimiste est donc géré
directement par la page de conviction (Task 11) qui lit le paramètre `?payment_intent` ajouté
par Stripe et appelle `grantDecisionPackFromSnapshot(admin, payment_intent, user.id)` avant le
contrôle de possession. Pas d'endpoint `/api/pack/activer` : un endpoint séparé serait redondant
avec le webhook (le filet) et la page (le chemin rapide). Cette tâche ne produit aucun fichier ;
elle documente la décision et renvoie à la Task 11, Step 1.

---

## Task 9 : Plomberie paiement (PaymentWrapper / PaymentForm) pour le pack

**Files:**
- Modify: `src/components/PaymentWrapper.tsx`
- Modify: `src/components/PaymentForm.tsx`

- [ ] **Step 1: Lire les signatures actuelles**

Run: `sed -n '1,80p' src/components/PaymentWrapper.tsx && echo '--- FORM ---' && sed -n '1,80p' src/components/PaymentForm.tsx`
But cette étape (lecture) : repérer `type PaymentGrant`, le `body` du `fetch` create-payment-intent, et le `return_url` hardcodé `/merci` dans PaymentForm.

- [ ] **Step 2: Ajouter la prop `pack` et `returnUrl` à PaymentWrapper**

Dans `src/components/PaymentWrapper.tsx`, ajouter au type des props (à côté de `grant?: PaymentGrant;`) :

```ts
  pack?: {
    trio: { insee: string; commune: string }[];
    projetLabel: string;
    parsedSnapshot: unknown;
  };
  returnUrl?: string;
```

Dans le `body: JSON.stringify({ ... })` du `fetch("/api/stripe/create-payment-intent"`, ajouter
après `rank: grant?.rank,` :

```ts
        pack,
```

Inclure `pack` dans la `requestKey` pour ne pas recycler un PaymentIntent entre un rapport et un
pack : remplacer
```ts
  const requestKey = `${amount}:${productType}:${grant?.targetInsee ?? ""}`;
```
par
```ts
  const requestKey = `${amount}:${productType}:${grant?.targetInsee ?? ""}:${pack?.trio.map((t) => t.insee).join("-") ?? ""}`;
```

Passer `returnUrl` au `PaymentForm` rendu par le wrapper (repérer le `<PaymentForm ... />` et lui
ajouter la prop) :
```tsx
        returnUrl={returnUrl}
```
(et ajouter `returnUrl` à la déstructuration des props du composant `PaymentWrapper`.)

- [ ] **Step 3: Rendre `return_url` configurable dans PaymentForm**

Dans `src/components/PaymentForm.tsx`, ajouter `returnUrl?: string` aux props, déstructurer
`returnUrl`, et remplacer :
```ts
        return_url: `${window.location.origin}/merci`,
```
par :
```ts
        return_url: returnUrl ?? `${window.location.origin}/merci`,
```

- [ ] **Step 4: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint src/components/PaymentWrapper.tsx src/components/PaymentForm.tsx
git add src/components/PaymentWrapper.tsx src/components/PaymentForm.tsx
git commit -m "feat(pack-decision): PaymentWrapper/PaymentForm acceptent pack + returnUrl"
```

---

## Task 10 : Panneau de paiement du pack `PackPaymentPanel`

**Files:**
- Create: `src/app/(public)/comparateur/pack-decision/PackPaymentPanel.tsx`

- [ ] **Step 1: Écrire le composant**

```tsx
"use client";

import { PaymentWrapper } from "@/components/PaymentWrapper";
import type { ParsedProject } from "@/lib/comparateur-vie";

type Props = {
  trio: { insee: string; commune: string }[];
  projetLabel: string;
  parsedSnapshot: ParsedProject;
  returnUrl: string;
  submitLabel?: string;
};

// Panneau Stripe du Pack Décision. Stripe redirige vers returnUrl (la page de
// conviction) sur succès : c'est là que l'octroi optimiste a lieu (via ?payment_intent),
// pas dans un onSuccess client. Le webhook reste le filet de sécurité. onSuccess est
// laissé en no-op (rarement atteint, le cas sans redirection).
export function PackPaymentPanel({ trio, projetLabel, parsedSnapshot, returnUrl, submitLabel }: Props) {
  return (
    <PaymentWrapper
      amount={39}
      productType="pack-decision"
      submitLabel={submitLabel}
      returnUrl={returnUrl}
      pack={{ trio, projetLabel, parsedSnapshot }}
      onSuccess={() => {}}
    />
  );
}
```

- [ ] **Step 2: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint "src/app/(public)/comparateur/pack-decision/PackPaymentPanel.tsx"
git add "src/app/(public)/comparateur/pack-decision/PackPaymentPanel.tsx"
git commit -m "feat(pack-decision): PackPaymentPanel (returnUrl, octroi sur page de retour)"
```

---

## Task 11 : Page de conviction serveur (branche possédé / teaser)

**Files:**
- Create: `src/app/(public)/comparateur/pack-decision/page.tsx`

- [ ] **Step 1: Écrire la page serveur**

Elle lit le trio dans `searchParams.communes` (3 INSEE séparés par des virgules), vérifie la
possession, et branche : possédé → `PackUnlockedView` (données calculées serveur depuis le
snapshot) ; sinon → `PackConvictionView` (teaser, parsed lu côté client).

```tsx
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import { createClient } from "@/lib/supabase/server";
import { resolvePackOwnership, grantDecisionPackFromSnapshot } from "@/lib/decision-packs";
import { matchProjects } from "@/lib/comparateur-vie";
import { PackConvictionView } from "./PackConvictionView";
import { PackUnlockedView } from "./PackUnlockedView";

export const metadata: Metadata = {
  title: "Pack Décision · futur•e",
  robots: { index: false, follow: false },
};

function parseCommunes(raw: string | undefined): string[] {
  if (typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[0-9AB][0-9]{4}$/i.test(s))
    .slice(0, 3);
}

export default async function PackDecisionPage({
  searchParams,
}: {
  searchParams: Promise<{ communes?: string; payment_intent?: string; redirect_status?: string }>;
}) {
  const { communes: rawCommunes, payment_intent: paymentIntent, redirect_status: redirectStatus } =
    await searchParams;
  const insees = parseCommunes(rawCommunes);
  // Sans trio exploitable, on renvoie au comparateur (le pack n'a pas de sens hors parcours).
  if (insees.length !== 3) redirect("/ou-vivre");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Retour de Stripe : confirmPayment redirige ici avec ?payment_intent. On octroie
  // le pack de façon optimiste (idempotent avec le webhook) AVANT le contrôle de
  // possession, pour afficher le complet sans attendre le webhook. Sécurité : la
  // fonction vérifie que le snapshot appartient bien à l'utilisateur courant.
  if (user && paymentIntent && redirectStatus === "succeeded") {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    await grantDecisionPackFromSnapshot(admin, paymentIntent, user.id, user.email ?? undefined);
  }

  const pack = user ? await resolvePackOwnership(supabase, user.id, insees) : null;

  if (pack) {
    // POSSÉDÉ : on calcule la comparaison complète + les pistes côté serveur,
    // depuis le snapshot acheté (reproductible). La matrice n'a jamais transité
    // par une API publique.
    const outcome = await matchProjects(pack.parsedSnapshot);
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
          <PackUnlockedView
            data={outcome.comparaisonComplete}
            trio={outcome.results.slice(0, 3)}
            pistes={outcome.pistes}
            projetLabel={pack.projetLabel}
          />
        </main>
      </div>
    );
  }

  // NON POSSÉDÉ : teaser. Le parsed du projet est lu côté client (localStorage),
  // et le compte est requis avant paiement (comme le 14 €).
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 120px" }}>
        <PackConvictionView
          insees={insees}
          userEmail={user?.email ?? null}
          returnUrl={`/comparateur/pack-decision?communes=${insees.join(",")}`}
        />
      </main>
    </div>
  );
}
```

- [ ] **Step 2: `tsc` (les deux vues seront créées aux tâches 12-13 ; cette étape compile après elles)**

Note : cette page importe `PackConvictionView` et `PackUnlockedView` qui n'existent pas encore.
Créer d'abord des stubs minimaux pour compiler, puis les remplir aux tâches suivantes :

`PackConvictionView.tsx` stub :
```tsx
"use client";
export function PackConvictionView(_: { insees: string[]; userEmail: string | null; returnUrl: string }) {
  return null;
}
```
`PackUnlockedView.tsx` stub :
```tsx
"use client";
import type { ComparaisonComplete, MatchResult } from "@/lib/comparateur-vie";
export function PackUnlockedView(_: {
  data: ComparaisonComplete; trio: MatchResult[]; pistes: MatchResult[]; projetLabel: string | null;
}) {
  return null;
}
```

- [ ] **Step 3: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint "src/app/(public)/comparateur/pack-decision/page.tsx"
git add "src/app/(public)/comparateur/pack-decision/"
git commit -m "feat(pack-decision): page serveur (branche possede/teaser) + stubs vues"
```

---

## Task 12 : `PackUnlockedView` (comparaison complète + 3 pistes + liens rapports)

**Files:**
- Modify: `src/app/(public)/comparateur/pack-decision/PackUnlockedView.tsx`

- [ ] **Step 1: Remplir la vue déverrouillée**

Réutilise `ComparaisonCompleteView` (déjà construite) pour la matrice, ajoute la bande des 3
pistes (cartes style `CompareView`) et les liens vers les 3 rapports complets.

```tsx
"use client";

import Link from "next/link";
import type { ComparaisonComplete, MatchResult } from "@/lib/comparateur-vie";
import { ComparaisonCompleteView } from "@/app/(public)/ou-vivre/ComparaisonCompleteView";

type Props = {
  data: ComparaisonComplete;
  trio: MatchResult[];
  pistes: MatchResult[];
  projetLabel: string | null;
};

function cap(s: string): string {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function forces(r: MatchResult): string[] {
  const confirmation = r.reasons?.[0] ?? null;
  const decouverte = r.decouverte ?? r.reasons?.[1] ?? null;
  const out: string[] = [];
  if (confirmation) out.push(confirmation);
  if (decouverte && decouverte !== confirmation) out.push(decouverte);
  return out.slice(0, 2);
}

export function PackUnlockedView({ data, trio, pistes, projetLabel }: Props) {
  return (
    <div className="pt-4">
      {projetLabel && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
          Pack Décision · {projetLabel}
        </p>
      )}

      {/* Liens vers les 3 rapports complets (débloqués par les report_grants) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10">
        {trio.map((r) => (
          <Link
            key={r.insee}
            href={`/territoire/${r.insee}`}
            className="glass rounded-xl p-4 flex items-center justify-between hover:border-white/[0.28] border border-white/[0.14] transition-colors"
          >
            <span className="text-[14px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              Rapport · {r.nom}
            </span>
            <span aria-hidden className="text-accent">→</span>
          </Link>
        ))}
      </div>

      {/* La comparaison complète */}
      <ComparaisonCompleteView data={data} trio={trio} onBack={() => history.back()} />

      {/* Les 3 nouvelles pistes (rangs 4-6) */}
      {pistes.length > 0 && (
        <section className="mt-12">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">
            Trois nouvelles pistes
          </p>
          <h3
            className="font-normal text-[clamp(20px,3vw,28px)] leading-[1.15] text-label mb-2"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Si aucune des trois ne vous convainc totalement.
          </h3>
          <p className="text-[13px] leading-[1.6] text-muted mb-6">
            Les communes suivantes pour le même projet, à explorer.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pistes.map((r) => (
              <div key={r.insee} className="glass rounded-2xl p-6 flex flex-col">
                <h4 className="font-normal text-[20px] leading-[1.2] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
                  {r.nom}
                </h4>
                <p className="mt-2 text-[14px] leading-[1.6] text-accent italic">{r.identite}</p>
                <ul className="mt-4 space-y-2">
                  {forces(r).map((f) => (
                    <li key={f} className="text-[13.5px] leading-[1.55] text-label flex gap-2">
                      <span className="text-emerald-400 shrink-0" aria-hidden>+</span>
                      <span>{cap(f)}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 pt-3 border-t border-white/[0.08] text-[13px] leading-[1.55] text-muted">
                  {r.compromis}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier l'import de `ComparaisonCompleteView`**

Run: `grep -n "export function ComparaisonCompleteView" "src/app/(public)/ou-vivre/ComparaisonCompleteView.tsx"`
Expected : la fonction est bien exportée nommément (sinon adapter l'import).

- [ ] **Step 3: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint "src/app/(public)/comparateur/pack-decision/PackUnlockedView.tsx"
git add "src/app/(public)/comparateur/pack-decision/PackUnlockedView.tsx"
git commit -m "feat(pack-decision): vue deverrouillee (comparaison + 3 pistes + liens rapports)"
```

---

## Task 13 : `PackConvictionView` (teaser + achat)

Page de conviction dans l'esprit de `/territoire/[insee]/debloquer`. Lit le `parsed` du projet en
`localStorage` (déposé par OuVivreClient en Task 14), récupère l'aperçu tronqué via
`/api/comparateur-vie/apercu`, affiche la valeur du bundle et le panneau Stripe (compte requis).

**Files:**
- Modify: `src/app/(public)/comparateur/pack-decision/PackConvictionView.tsx`

- [ ] **Step 1: Lire la page debloquer comme gabarit de style**

Run: `sed -n '60,260p' "src/app/(public)/territoire/[insee]/debloquer/page.tsx"`
Reprendre la grammaire visuelle (héro de continuité, bloc « ce que vous débloquez », garde-fou de
latence sur l'aperçu, bloc « pourquoi 39 € », bloc « aucun engagement »). Ne PAS plafonner un
paragraphe avec un `max-w` plus étroit que son bloc bordé (doctrine `feedback_text_maxwidth`).

- [ ] **Step 2: Écrire la vue**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ComparaisonComplete, ParsedProject } from "@/lib/comparateur-vie";
import { PackPaymentPanel } from "./PackPaymentPanel";

type Props = {
  insees: string[];
  userEmail: string | null;
  returnUrl: string;
};

type Apercu = { apercu: ComparaisonComplete; trio: { insee: string; nom: string }[] };

const BUNDLE = [
  { t: "La comparaison complète", d: "Les trois territoires, thème par thème, ce qui les départage vraiment." },
  { t: "Les trois rapports complets", d: "Un rapport par commune, à conserver, accessible depuis votre espace." },
  { t: "Trois nouvelles pistes", d: "Les communes suivantes sur le même projet, si aucune des trois ne tranche." },
  { t: "AskFuture : 9 questions incluses", d: "Pour creuser ce qui compte, sur chacun des territoires." },
];

export function PackConvictionView({ insees, userEmail, returnUrl }: Props) {
  const [parsed, setParsed] = useState<ParsedProject | null>(null);
  const [projetLabel, setProjetLabel] = useState("");
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [slow, setSlow] = useState(false);

  // Le projet vit en localStorage (déposé par le comparateur au clic Pack Décision).
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("futuree:projet:parsed");
      if (raw) setParsed(JSON.parse(raw) as ParsedProject);
      const label = window.localStorage.getItem("futuree:projet:label");
      if (label) setProjetLabel(label);
    } catch {
      // pas de projet en mémoire : l'aperçu restera générique, l'achat indisponible.
    }
  }, []);

  // Aperçu tronqué (garde-fou de latence : on n'attend pas indéfiniment).
  useEffect(() => {
    if (!parsed) return;
    const slowTimer = setTimeout(() => setSlow(true), 1200);
    fetch("/api/comparateur-vie/apercu", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ parsed }),
    })
      .then((r) => r.json())
      .then((d: Apercu) => setApercu(d))
      .catch(() => {})
      .finally(() => { clearTimeout(slowTimer); setSlow(false); });
    return () => clearTimeout(slowTimer);
  }, [parsed]);

  const trioNoms = apercu?.trio.map((t) => t.nom) ?? [];
  const trioForBuy = (apercu?.trio ?? insees.map((insee) => ({ insee, nom: "" }))).map((t) => ({
    insee: t.insee,
    commune: t.nom,
  }));

  return (
    <div className="pt-4">
      <Link
        href="/ou-vivre"
        className="font-mono text-[11px] tracking-[0.1em] text-muted hover:text-label mb-6 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Revenir au comparateur
      </Link>

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-accent mb-3">Pack Décision · 39 €</p>
      <h1
        className="font-normal text-[clamp(28px,4vw,44px)] leading-[1.1] tracking-[-0.8px] text-label mb-5"
        style={{ fontFamily: "'Instrument Serif', serif" }}
      >
        {trioNoms.length === 3
          ? `Vous hésitez entre ${trioNoms[0]}, ${trioNoms[1]} et ${trioNoms[2]} ?`
          : "Vous hésitez entre ces trois territoires ?"}
        <br />
        <span className="italic text-accent">Tranchez, sans deviner.</span>
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_0.8fr] gap-8 items-start mt-8">
        {/* Aperçu réel tronqué + valeur du bundle */}
        <div>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-3">Aperçu de la comparaison</p>
          {apercu ? (
            <div className="glass rounded-2xl p-6">
              {apercu.apercu.resume.map((line, i) => (
                <p key={i} className="text-[14px] leading-[1.6] text-label mb-3">{line}</p>
              ))}
              {apercu.apercu.themes.map((th) => (
                <div key={th.id} className="mt-4 pt-4 border-t border-white/[0.08]">
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1">{th.titre}</p>
                  <p className="text-[13px] leading-[1.55] text-muted">{th.synthese}</p>
                </div>
              ))}
              <p className="mt-5 text-[12px] text-muted italic">Et cinq autres thèmes, une fois le pack débloqué.</p>
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-[13px] text-muted">
              {slow ? "Préparation de l'aperçu…" : "Chargement de l'aperçu…"}
            </div>
          )}

          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-8 mb-3">Ce que vous débloquez</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {BUNDLE.map((b) => (
              <div key={b.t} className="glass rounded-xl p-4">
                <p className="text-[14px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>{b.t}</p>
                <p className="mt-1 text-[12.5px] leading-[1.5] text-muted">{b.d}</p>
              </div>
            ))}
          </div>

          <p className="mt-6 text-[13px] leading-[1.6] text-muted">
            Trois rapports valent 42 € à l&apos;unité. Le Pack Décision les réunit, avec la comparaison et les
            pistes, pour 39 €. Aucun engagement, paiement unique.
          </p>
        </div>

        {/* Achat */}
        <aside className="glass rounded-2xl p-6 md:sticky md:top-6">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-white/[0.08]">
            <span className="text-[15px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>Pack Décision</span>
            <span className="text-[28px] text-label" style={{ fontFamily: "'Instrument Serif', serif" }}>
              39<span className="text-[15px] text-muted ml-1">€</span>
            </span>
          </div>
          {userEmail && parsed ? (
            <PackPaymentPanel
              trio={trioForBuy}
              projetLabel={projetLabel}
              parsedSnapshot={parsed}
              returnUrl={returnUrl}
              submitLabel="Débloquer le Pack Décision"
            />
          ) : !userEmail ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] leading-[1.6] text-muted">Le paiement doit être rattaché à un compte.</p>
              <Link
                href={`/inscription?next=${encodeURIComponent(returnUrl)}`}
                className="flex items-center justify-center px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
              >
                Créer mon compte puis payer
              </Link>
              <Link
                href={`/connexion?next=${encodeURIComponent(returnUrl)}`}
                className="flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/[0.14] text-[13px] text-label"
              >
                J&apos;ai déjà un compte
              </Link>
            </div>
          ) : (
            <p className="text-[13px] leading-[1.6] text-muted">
              Reprenez votre comparaison pour débloquer le pack.{" "}
              <Link href="/ou-vivre" className="text-accent hover:underline">Revenir au comparateur</Link>.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: `tsc` + `eslint` + commit**

```bash
npx tsc --noEmit && npx eslint "src/app/(public)/comparateur/pack-decision/PackConvictionView.tsx"
git add "src/app/(public)/comparateur/pack-decision/PackConvictionView.tsx"
git commit -m "feat(pack-decision): vue de conviction (teaser apercu + achat)"
```

---

## Task 14 : Câbler l'entrée depuis le comparateur + corriger le bug `var(--accent)`

**Files:**
- Modify: `src/app/(public)/ou-vivre/OuVivreClient.tsx`
- Modify: `src/app/(public)/ou-vivre/CompareView.tsx`

- [ ] **Step 1: Persister le projet + le trio, et naviguer, sur le CTA Pack Décision**

Dans `src/app/(public)/ou-vivre/OuVivreClient.tsx`, dans le rendu de la `CompareView` (~ligne 632),
remplacer :
```tsx
          onPackDecision={() => capture("pack_decision_waitlist_clicked", { count: top.length })}
          onPreviewComplete={() => setView("complete")}
```
par :
```tsx
          onPackDecision={() => {
            const trio = topCards(outcome.results);
            try {
              if (parsed) window.localStorage.setItem("futuree:projet:parsed", JSON.stringify(parsed));
              window.localStorage.setItem("futuree:projet:label", submittedText.slice(0, 200));
            } catch {
              // localStorage indisponible : la page de conviction proposera de revenir au comparateur.
            }
            capture("pack_decision_cta_clicked", { count: trio.length });
            const communes = trio.map((r) => r.insee).join(",");
            window.location.href = `/comparateur/pack-decision?communes=${encodeURIComponent(communes)}`;
          }}
```

- [ ] **Step 2: Supprimer le rendu libre de la comparaison complète**

Toujours dans `OuVivreClient.tsx`, supprimer le bloc `if (view === "complete" && ...) { ... }`
(~lignes 620-630) et retirer `"complete"` du type d'état `view` (ligne 152) :
```tsx
  const [view, setView] = useState<"results" | "compare">("results");
```
Supprimer aussi l'import et toute référence restante à `ComparaisonCompleteView` dans ce fichier
(la vue est désormais rendue uniquement par la page pack-decision pour les acheteurs).

- [ ] **Step 3: CompareView : CTA + retrait de l'aperçu temporaire + fix `var(--accent)`**

Dans `src/app/(public)/ou-vivre/CompareView.tsx` :

Retirer `onPreviewComplete` du type `Props` et de la signature, et supprimer le bloc
`{onPreviewComplete && ( ... )}` (le lien « Voir la comparaison complète (aperçu) »).

Corriger le bug CSS du bloc Pack Décision. Remplacer :
```tsx
      <div
        className="mt-8 glass rounded-2xl p-7"
        style={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent)" }}
      >
```
par (tokens orange réels, cf. `feedback` piège CSS) :
```tsx
      <div
        className="mt-8 glass rounded-2xl p-7"
        style={{ borderColor: "var(--orange-ring)", boxShadow: "0 0 0 1px var(--orange-ring)" }}
      >
```

Mettre à jour le bloc Pack Décision : le kicker « Bientôt · Pack Décision » devient « Pack
Décision · 39 € », et le bouton `onPackDecision` voit son libellé passer de « Me prévenir au
lancement » à « Comparer en profondeur » (le CTA mène désormais à l'achat, plus à une waitlist) :
```tsx
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent mb-1.5">
          Pack Décision · 39 €
        </p>
```
et
```tsx
        <button
          onClick={onPackDecision}
          className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-accent text-canvas font-semibold text-[14px]"
          style={{ fontFamily: "'Instrument Sans', sans-serif" }}
        >
          Comparer en profondeur
          <span aria-hidden>→</span>
        </button>
```

- [ ] **Step 4: `tsc` + `eslint`**

Run: `npx tsc --noEmit && npx eslint "src/app/(public)/ou-vivre/OuVivreClient.tsx" "src/app/(public)/ou-vivre/CompareView.tsx"`
Expected : aucune erreur. (Si `ComparaisonCompleteView` était importée et n'est plus utilisée,
eslint le signalera : retirer l'import.)

- [ ] **Step 5: Commit**

```bash
git add "src/app/(public)/ou-vivre/OuVivreClient.tsx" "src/app/(public)/ou-vivre/CompareView.tsx"
git commit -m "feat(pack-decision): CTA comparateur vers la page d'achat + fix var(--accent)"
```

---

## Task 15 : Sonde + vérification de bout en bout

**Files:**
- Create: `scripts/sonde-pack-decision.mjs`

- [ ] **Step 1: Écrire la sonde**

```js
// Sonde Pack Décision : vérifie le VERROU (le /match gratuit ne fuit ni la matrice
// complète ni les pistes) et que l'aperçu renvoie bien un tronqué (2 thèmes) + un
// trio. Ne teste pas le paiement (Stripe) ni la possession (auth) : ces chemins se
// valident manuellement avec un compte de test + webhook Stripe CLI.
// Prérequis : npm run dev (port 3000). Usage : node scripts/sonde-pack-decision.mjs
const BASE = process.env.SONDE_BASE ?? "http://localhost:3000";

const PROJETS = [
  "Un coin calme près de la mer pour ma retraite, avec de bons médecins.",
  "Je cherche une petite ville vivante avec une gare et un climat supportable l'été.",
];

async function probe(text) {
  const pr = await fetch(`${BASE}/api/comparateur-vie/parse`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!pr.ok) return { text, error: `parse ${pr.status}` };
  const { parsed } = await pr.json();

  const mr = await fetch(`${BASE}/api/comparateur-vie/match`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  const match = await mr.json();

  const ar = await fetch(`${BASE}/api/comparateur-vie/apercu`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ parsed }),
  });
  const apercu = await ar.json();

  return { text, match, apercu };
}

async function main() {
  let ok = true;
  for (const text of PROJETS) {
    const r = await probe(text);
    console.log("\n==================================================");
    console.log("PROJET » " + r.text);
    if (r.error) { console.log("  ERREUR:", r.error); ok = false; continue; }

    const leakCC = r.match.comparaisonComplete !== undefined;
    const leakPistes = r.match.pistes !== undefined;
    const resultsCount = (r.match.results ?? []).length;
    const apercuThemes = r.apercu.apercu?.themes?.length ?? 0;
    const trioCount = r.apercu.trio?.length ?? 0;

    console.log(`  VERROU match : comparaisonComplete fuite? ${leakCC} | pistes fuite? ${leakPistes} | results=${resultsCount}`);
    console.log(`  APERÇU       : thèmes tronqués=${apercuThemes} | trio=${trioCount} (${(r.apercu.trio ?? []).map((t) => t.nom).join(", ")})`);

    if (leakCC || leakPistes) { console.log("  ✗ FUITE DU PAYLOAD PAYANT"); ok = false; }
    if (resultsCount > 3) { console.log("  ✗ results > 3 (le gratuit ne doit montrer que le trio)"); ok = false; }
    if (apercuThemes !== 2) { console.log("  ✗ aperçu non tronqué à 2 thèmes"); ok = false; }
    if (trioCount !== 3) { console.log("  ✗ trio aperçu != 3"); ok = false; }
  }
  console.log("\n" + (ok ? "✓ SONDE VERTE" : "✗ SONDE ROUGE"));
  process.exit(ok ? 0 : 1);
}

main();
```

- [ ] **Step 2: Lancer la sonde**

Avec `npm run dev` actif :
Run: `node scripts/sonde-pack-decision.mjs`
Expected : `✓ SONDE VERTE` (verrou tient, aperçu tronqué à 2 thèmes, trio de 3).

- [ ] **Step 3: Vérification manuelle du parcours payant**

Documenter pour le porteur (pas automatisable ici) :
1. `npm run dev`, se connecter avec un compte de test.
2. Faire une recherche `/ou-vivre`, aller à la comparaison, cliquer « Comparer en profondeur ».
3. Sur `/comparateur/pack-decision?communes=...` : vérifier le héro nommant les 3 communes,
   l'aperçu tronqué, le panneau d'achat.
4. Payer en mode test Stripe (carte `4242 4242 4242 4242`), webhook via `stripe listen`.
5. Au retour, la page doit afficher la comparaison complète + les 3 liens rapports + 3 pistes.
6. En base : `select * from decision_packs` (1 ligne, trio_key correct), `select * from report_grants`
   (3 lignes source `pack_decision`).

- [ ] **Step 4: Vérification finale globale**

```bash
npx tsc --noEmit
npx eslint "src/app/(public)/comparateur/pack-decision/" "src/app/api/comparateur-vie/apercu/route.ts" "src/app/api/ask/route.ts" "src/lib/decision-packs.ts" src/lib/comparateur-vie.ts src/lib/checkout-products.ts src/app/api/stripe/create-payment-intent/route.ts src/app/api/stripe/webhook/route.ts src/components/PaymentWrapper.tsx src/components/PaymentForm.tsx "src/app/(public)/ou-vivre/OuVivreClient.tsx" "src/app/(public)/ou-vivre/CompareView.tsx"
```
Expected : aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add scripts/sonde-pack-decision.mjs
git commit -m "feat(pack-decision): sonde verrou + apercu"
```

---

## Finalisation

- [ ] Relire la spec une dernière fois, vérifier que chaque critère de réussite (spec §10) est couvert.
- [ ] `npx tsc --noEmit` global propre.
- [ ] Sonde verte.
- [ ] Parcours payant validé manuellement (compte de test + Stripe CLI).
- [ ] Merge `--ff-only` sur `main` (invoquer la skill `superpowers:finishing-a-development-branch`).

---

## Self-Review (auteur du plan)

**Couverture spec :**
- §3 identité trio + snapshot → Task 1 (colonnes), Task 5 (`trioKey`), Task 6 (staging), Task 7 (webhook) + Task 11 (page de retour) octroient depuis le snapshot. ✓
- §4 `decision_packs` + 3 grants → Task 1, Task 7. ✓
- §5 verrou séparation payload → Task 2 (pistes), Task 3 (strip /match), Task 4 (aperçu tronqué), Task 11 (full rendu serveur seulement). La matrice complète n'a aucun endpoint d'API. ✓
- §6 page de conviction dédiée + produit 39 € + metadata trio → Task 6, Task 11, Task 13. ✓
- §7 expérience déverrouillée (matrice + 3 pistes + liens rapports + 9 questions) → Task 12 (vue), Task 7 (entitlements one_shot, sans quoi rapports + AskFuture restent verrouillés), Task 7B (quota AskFuture = 3 × grants, pool unique de 9 réel et honnête). ✓
- §8 doctrine (no em-dash, fix `var(--accent)`, largeur texte) → Task 14, rappels en tête. ✓
- §9 hors-périmètre → non implémentés (corrects). ✓
- §10 critères de réussite → Task 15 (sonde verrou) + vérif manuelle parcours payant. ✓

**Scan placeholders :** Pas de trou. L'octroi au retour de paiement ne dépend plus d'un
`onSuccess(paymentIntentId)` fragile : `confirmPayment` redirige vers `returnUrl`, et la page de
retour lit `?payment_intent` pour octroyer côté serveur (Task 8 doc + Task 11 Step 1), le webhook
restant le filet. Tout le reste contient le code réel.

**Cohérence des types :** `trioKey()` (signature unique, Task 5) réutilisée Task 6.
`grantDecisionPackFromSnapshot(admin, pi, expectedUserId?, email?)` (Task 5, 4 params) appelée par
le webhook (Task 7, email = userEmail) et la page (Task 11, email = user.email). Quota AskFuture
(Task 7B) lit `report_grants`, plancher `max(1, …)` couvre le cas résidence sans grant.
`pistes` ajouté à `MatchOutcome` Task 2, consommé Task 11/12/15. `pack` / `returnUrl` ajoutés à
PaymentWrapper Task 9, consommés Task 10/13. Produit `pack-decision` / productType `pack-decision`
cohérents Task 6 → create-payment-intent → webhook.
