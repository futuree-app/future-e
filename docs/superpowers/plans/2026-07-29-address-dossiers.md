# `address_dossiers` : le dossier devient un objet (plan d'implémentation)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans. Steps en `- [ ]`.

**Goal:** Faire descendre le droit à l'échelle du bien : `public.logement` devient
`public.address_dossiers`, identifié par un uuid, écrit par le seul serveur, et l'existence de la
ligne devient le droit d'ouvrir le dossier.

**Architecture:** L'identité passe de `(user_id, ban_id)` à un uuid, ce qui permet à deux
appartements d'un même immeuble de coexister. Le droit cesse d'être un flag de plan global doublé
d'un grant communal : Territoire se lit par grant ou par dossier dans la commune, Autour et Logement
par le dossier précis. Aucune écriture cliente ne subsiste sur la table.

**Tech Stack:** TypeScript, Next.js App Router, Supabase, tests `node --test`.

**Spec:** `docs/superpowers/specs/2026-07-29-address-dossiers-design.md`. En cas de divergence, la
spec fait foi.

## Global Constraints

- **Le droit est la ligne.** `ligne possédée + access_revoked_at IS NULL` suffit. Les colonnes de
  paiement documentent la provenance, elles ne définissent jamais l'accès.
- **Aucune écriture cliente.** `authenticated` n'a ni `insert`, ni `update`, ni `delete` sur
  `address_dossiers`. Toute écriture passe par `updateOwnedAddressDossier`.
- **Le helper ne rend jamais le client service role à l'appelant.** Il écrit lui-même, sous une
  clause `.eq("id", …).eq("user_id", …)` qu'aucune route ne réécrit.
- **Un dossier administratif n'est jamais une acquisition** (`stripe_payment_intent_id is null`) :
  il ouvre Territoire pour les tests, il ne donne aucun tarif d'approfondissement.
- **Piège PLM** : `communeParent()` (`src/lib/plm.ts`) sert à comparer droits et prix. La colonne
  `insee` garde le code local de l'arrondissement, dont dépendent les données fines. Ne jamais la
  normaliser.
- Conventions : imports `.ts` en lib, `@/` en composant. FR sans tiret cadratin, jamais d'antithèse
  « c'est X, pas Y ».
- **Pièges connus** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore (un
  lint vert ne dit rien d'eux) ; un module qui importe `server-only` casse sous `node --test` (d'où
  la séparation décision pure / accès base) ; un commentaire JSX dans un ternaire casse le build ;
  stager par chemin, jamais `git add -A`.

**Vérif de référence :** `npx tsc --noEmit` · `node --test src/lib/<fichier>.test.ts`

**AUCUN PUSH AVANT LA TASK 9.** Le projet déploie en production sur push `main`, sans PR
(`docs/handoff/CURRENT.md`, « Pièges »). Or plusieurs tasks se terminent volontairement sur un
`tsc --noEmit` en erreur, réparé par la suivante. Committer localement est prévu ; **pousser
mettrait un build cassé en production**. Travailler sur une branche ou un worktree, et ne
fusionner qu'une fois les Tasks 1 à 8 vertes.

**Interruption de service assumée :** à partir de la Task 4, personne n'ouvre Autour ni Logement par
l'application tant que la Task 7 n'est pas livrée (aucun dossier n'existe et le flag global ne
déverrouille plus rien). Sans conséquence, aucun compte n'a payé.

**La migration est une coupure franche :** l'ancien code interroge `logement`, le nouveau
`address_dossiers`. Aucun ordre de déploiement n'évite une courte incompatibilité, d'où la Task 9.

---

## Task 1: Migration SQL

**Files:**
- Create: `supabase/25_address_dossiers.sql`

**Interfaces:**
- Produces: table `public.address_dossiers` avec `id uuid` en clé primaire, `ban_id`,
  `stripe_payment_intent_id`, `amount_paid_cents`, `purchased_at`, `access_revoked_at`.

- [ ] **Step 1: Écrire la migration**

```sql
begin;

-- ════════════════════════════════════════════════════════════════════════════
-- address_dossiers : le dossier devient un OBJET, identifié par un uuid.
--
-- Deux défauts corrigés d'un coup. (1) La clé (user_id, logement_id) avec
-- logement_id = ban_id écrasait l'appartement du 2e étage par celui du 4e, alors
-- que PreciseLogementStep existe précisément parce qu'une adresse BAN contient
-- plusieurs logements. (2) Le droit vivait dans un flag de plan global doublé
-- d'un grant communal : aucune notion de droit par bien.
--
-- Le droit devient l'existence de la ligne. Les colonnes de paiement en
-- documentent la provenance ; access_revoked_at le retire sans détruire
-- l'artefact. Aucune écriture cliente ne subsiste.
--
-- À appliquer après 24. Spec : docs/superpowers/specs/2026-07-29-address-dossiers-design.md
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Renommage ───────────────────────────────────────────────────────────
alter table public.logement rename to address_dossiers;

-- ── 2. Identité : uuid, et ban_id perd toute unicité ───────────────────────
alter table public.address_dossiers rename column logement_id to ban_id;
alter table public.address_dossiers drop constraint if exists logement_pkey;

alter table public.address_dossiers
  add column if not exists id uuid not null default gen_random_uuid();
alter table public.address_dossiers
  add constraint address_dossiers_pkey primary key (id);

-- (user_id, ban_id) reste une LECTURE fréquente (les dossiers d'un immeuble),
-- jamais une contrainte : deux appartements y partagent légitimement un ban_id.
drop index if exists public.logement_user_insee_idx;
create index if not exists address_dossiers_user_ban_idx
  on public.address_dossiers (user_id, ban_id);
create index if not exists address_dossiers_user_insee_idx
  on public.address_dossiers (user_id, insee);
alter index if exists public.logement_user_id_idx
  rename to address_dossiers_user_id_idx;

-- ── 3. Provenance, révocation, date de naissance ───────────────────────────
-- created_at n'existait pas (17/19/20/21/22 ne portent qu'updated_at). Le panneau de
-- choix doit dire « créé le … » pour distinguer deux dossiers d'un même immeuble :
-- updated_at bouge à chaque écriture technique, purchased_at est nul pour un dossier
-- administratif. Un écrivain, un lecteur, un sens.
alter table public.address_dossiers
  add column if not exists stripe_payment_intent_id text,
  add column if not exists amount_paid_cents        int,
  add column if not exists purchased_at             timestamptz,
  add column if not exists access_revoked_at        timestamptz,
  add column if not exists created_at               timestamptz not null default now();

-- Remplace le filet que la disparition de unique (user_id, insee) retire :
-- le webhook n'a AUCUNE idempotence propre, toute sa protection contre un
-- événement rejoué vient des contraintes de table.
create unique index if not exists address_dossiers_payment_intent_key
  on public.address_dossiers (stripe_payment_intent_id);

-- ── 4. Purge des lignes de test ────────────────────────────────────────────
-- HONNÊTETÉ SUR CE QUI PROTÈGE QUOI. La condition `stripe_payment_intent_id is null`
-- ne démontre rien ici : la colonne vient d'être créée, donc TOUTES les lignes
-- antérieures la portent à null, quelle qu'ait été leur histoire. Ces lignes sont
-- supprimées parce qu'elles ont été VÉRIFIÉES comme données de test avant la
-- migration, pas parce que le SQL le prouverait.
--
-- Le garde-fou ci-dessous protège du vrai risque : exécuter ce fichier sur la
-- mauvaise base. Remplacer <NOMBRE_ATTENDU> par le compte relevé juste avant, avec
--   select count(*) from public.address_dossiers;
do $$
declare n integer;
begin
  select count(*) into n from public.address_dossiers;
  if n <> <NOMBRE_ATTENDU> then
    raise exception 'Migration annulée : % lignes trouvées, % attendues. Mauvaise base ?', n, <NOMBRE_ATTENDU>;
  end if;
end $$;

delete from public.address_dossiers where stripe_payment_intent_id is null;

-- ── 5. Cohérence : deux états admis, administratif ou acheté ───────────────
alter table public.address_dossiers
  drop constraint if exists address_dossiers_provenance_ck;
alter table public.address_dossiers
  add constraint address_dossiers_provenance_ck check (
    (stripe_payment_intent_id is null
      and amount_paid_cents is null
      and purchased_at is null)
    or
    (stripe_payment_intent_id is not null
      and amount_paid_cents is not null
      and purchased_at is not null
      and amount_paid_cents >= 0)
  );

-- ── 6. Droits : lecture seule pour l'utilisateur ───────────────────────────
-- Les policies d'écriture permettaient à un acheteur de créer son propre dossier,
-- et de réécrire snapshot / synthesis_fact_hash via PostgREST (le second gouverne
-- la régénération de la synthèse, donc des appels LLM facturés).
drop policy if exists logement_insert_own on public.address_dossiers;
drop policy if exists logement_update_own on public.address_dossiers;
drop policy if exists logement_select_own on public.address_dossiers;

-- access_revoked_at est dans la POLICY, pas seulement dans les requêtes applicatives.
-- Sans cette clause, un dossier révoqué resterait lisible par son propriétaire via
-- PostgREST avec son JWT : ce serait une révocation d'interface, jamais de droit.
create policy address_dossiers_select_own
  on public.address_dossiers for select
  using (auth.uid() = user_id and access_revoked_at is null);

-- delete est révoqué explicitement bien qu'aucune policy delete_own n'existe :
-- une interdiction implicite ne se relit pas.
revoke insert, update, delete on public.address_dossiers from authenticated;

commit;
```

- [ ] **Step 2: Appliquer sur la base de développement**

Coller le contenu dans l'éditeur SQL Supabase du projet de développement, exécuter.
Attendu : `Success. No rows returned`.

- [ ] **Step 3: Vérifier la forme obtenue**

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_name = 'address_dossiers' order by ordinal_position;

select indexname, indexdef from pg_indexes where tablename = 'address_dossiers';

select polname, polcmd from pg_policy
where polrelid = 'public.address_dossiers'::regclass;

select grantee, privilege_type from information_schema.role_table_grants
where table_name = 'address_dossiers' and grantee = 'authenticated';
```

Attendu : `id` uuid non nul en clé primaire · un index unique sur
`stripe_payment_intent_id` · **une seule** policy, `address_dossiers_select_own`, en `r` (select) ·
pour `authenticated`, **uniquement** `SELECT`.

- [ ] **Step 4: Commit**

```bash
git add supabase/25_address_dossiers.sql
git commit -m "Le dossier devient un objet : uuid en identité, ban_id sans unicité, lecture seule côté client"
```

---

## Task 2: Le store, renommé et re-clé

**Files:**
- Rename: `src/lib/logement-store.ts` → `src/lib/address-dossier-store.ts`
- Create: `src/lib/address-dossier-store.test.ts`

**Interfaces:**
- Produces:
  - `type AddressDossierRow` (ex-`LogementRow`, avec `id`, `ban_id`, `created_at`, colonnes de provenance)
  - `pickSoleDossier(rows: AddressDossierRow[]): AddressDossierRow | null`
  - `getDossier(sb, userId, dossierId): Promise<AddressDossierRow | null>`
  - `listDossiers(sb, userId): Promise<AddressDossierRow[]>`
  - `getSoleDossier(sb, userId): Promise<AddressDossierRow | null>`
  - `SOURCES_VERSION`, `needsRecompute`, `buildDpeSelectionFields` (inchangés)

- [ ] **Step 1: Écrire le test de la décision pure**

Créer `src/lib/address-dossier-store.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { pickSoleDossier, type AddressDossierRow } from "./address-dossier-store.ts";

function row(id: string, updatedAt: string): AddressDossierRow {
  return {
    id, user_id: "u1", ban_id: "b1", insee: "44109", address_label: "1 rue X",
    city: "Nantes", postcode: "44000", latitude: 47.2, longitude: -1.5,
    parcel_code: null, posture: "residence", snapshot: null,
    dpe_selection_status: "pending", selected_dpe_id: null, selected_dpe_snapshot: null,
    selected_dpe_at: null, created_at: "2026-07-18T08:00:00Z", updated_at: updatedAt,
    synthesis_text: null, synthesis_fact_hash: null, synthesis_generated_at: null,
    stripe_payment_intent_id: null, amount_paid_cents: null, purchased_at: null,
    access_revoked_at: null,
  };
}

test("aucun dossier : pas de repli", () => {
  assert.equal(pickSoleDossier([]), null);
});

test("un seul dossier : il est le repli", () => {
  const only = row("d1", "2026-07-29T10:00:00Z");
  assert.equal(pickSoleDossier([only])?.id, "d1");
});

test("PLUSIEURS dossiers : AUCUN repli, la question est posée au lecteur", () => {
  // updated_at bouge à chaque écriture technique (synthèse, posture, rehydratation) :
  // le dossier le plus récemment MODIFIÉ n'est pas celui qu'on voulait rouvrir.
  // Ouvrir le 2e étage quand le lecteur visait le 4e est le défaut que l'uuid corrige.
  const rows = [row("d1", "2026-07-29T12:00:00Z"), row("d2", "2026-07-29T09:00:00Z")];
  assert.equal(pickSoleDossier(rows), null);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/address-dossier-store.test.ts`
Attendu : FAIL, `Cannot find module './address-dossier-store.ts'`.

- [ ] **Step 3: Renommer le fichier et adapter le contrat**

```bash
git mv src/lib/logement-store.ts src/lib/address-dossier-store.ts
```

Dans le fichier renommé : `LogementRow` devient `AddressDossierRow`, avec `id: string` en tête,
`logement_id` remplacé par `ban_id`, et les quatre colonnes ajoutées :

```ts
export type AddressDossierRow = {
  // L'IDENTITÉ. Stable avant le choix du DPE, quand aucun DPE n'existe, si le choix est corrigé,
  // et si deux biens partagent un ban_id (deux appartements d'un même immeuble).
  id: string;
  user_id: string;
  // Le point postal. Indexé, JAMAIS unique : il ne désigne pas un logement.
  ban_id: string;
  insee: string;
  address_label: string;
  city: string | null;
  postcode: string | null;
  latitude: number;
  longitude: number;
  parcel_code: string | null;
  posture: Posture;
  snapshot: Face3Snapshot | null;
  dpe_selection_status: DpeSelectionStatus;
  selected_dpe_id: string | null;
  selected_dpe_snapshot: DpeRecord | null;
  selected_dpe_at: string | null;
  // Date de NAISSANCE du dossier, ce que le sélecteur affiche pour distinguer deux biens d'un
  // même immeuble. updated_at bouge à chaque écriture technique, purchased_at est nul pour un
  // dossier administratif : ni l'un ni l'autre ne répond à « lequel ai-je ouvert en premier ? ».
  created_at: string;
  updated_at: string;
  synthesis_text: string | null;
  synthesis_fact_hash: string | null;
  synthesis_generated_at: string | null;
  // PROVENANCE, écrite par le seul service role. Ne définit jamais l'accès.
  stripe_payment_intent_id: string | null;
  amount_paid_cents: number | null;
  purchased_at: string | null;
  // Retire l'accès SANS détruire l'artefact ni la trace de la transaction.
  access_revoked_at: string | null;
};
```

Remplacer les fonctions d'accès. **Supprimer `upsertLogement`, `upsertLogementAddress` et
`saveSynthesis`** : plus aucune écriture ne part du client (Task 4 les remplace).

```ts
// Repli par défaut quand aucun dossier n'est visé explicitement. Il ne s'applique QU'À un dossier
// unique : au-delà, le cas ambigu doit produire une question, jamais une supposition.
export function pickSoleDossier(rows: AddressDossierRow[]): AddressDossierRow | null {
  return rows.length === 1 ? rows[0] : null;
}

// UNE PANNE N'EST PAS UN REFUS DE DROIT. Le code actuel écrit partout `const { data } = await …`
// puis `data ?? null` : une erreur réseau, une colonne renommée ou une requête invalide y
// deviennent silencieusement « ce dossier ne vous appartient pas ». Sur un produit payant, ça
// répond 403 à un acheteur légitime pendant une panne. Toutes les fonctions de ce module lèvent.
function unwrap<T>(res: { data: T | null; error: { message: string } | null }, what: string): T | null {
  if (res.error) throw new Error(`address_dossiers ${what} a échoué : ${res.error.message}`);
  return res.data;
}

export async function getDossier(
  sb: SupabaseClient, userId: string, dossierId: string,
): Promise<AddressDossierRow | null> {
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .eq("id", dossierId)
    .is("access_revoked_at", null)
    .maybeSingle();
  return unwrap(res, "getDossier") as AddressDossierRow | null;
}

// Les dossiers d'une même adresse : ce que le panneau de choix affiche quand un lecteur soumet
// une adresse où il possède déjà quelque chose.
// Les dossiers actifs du compte, les plus récemment créés d'abord. Alimente /rapport/dossiers.
export async function listDossiers(
  sb: SupabaseClient, userId: string,
): Promise<AddressDossierRow[]> {
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .order("created_at", { ascending: false });
  return (unwrap(res, "listDossiers") as AddressDossierRow[] | null) ?? [];
}

export async function getSoleDossier(
  sb: SupabaseClient, userId: string,
): Promise<AddressDossierRow | null> {
  // limit(2) suffit à répondre « y en a-t-il plus d'un ? » sans tout charger.
  const res = await sb
    .from("address_dossiers")
    .select("*")
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .order("created_at", { ascending: false })
    .limit(2);
  return pickSoleDossier((unwrap(res, "getSoleDossier") as AddressDossierRow[] | null) ?? []);
}
```

- [ ] **Step 4: Lancer les tests**

Run: `node --test src/lib/address-dossier-store.test.ts`
Attendu : PASS (3 tests).

Run: `npx tsc --noEmit`
Attendu : **des erreurs**, dans les routes et pages qui importaient `logement-store`. Elles sont
corrigées Tasks 4 à 6. Ne pas les corriger ici.

- [ ] **Step 5: Commit**

```bash
git add src/lib/address-dossier-store.ts src/lib/address-dossier-store.test.ts
git commit -m "Le store passe au dossier : uuid, ban_id, et un repli qui refuse de deviner"
```

---

## Task 3: La décision de droit, pure et testable

**Files:**
- Create: `src/lib/territory-claims.ts`
- Create: `src/lib/territory-claims.test.ts`

**Interfaces:**
- Produces:
  - `type TerritoryClaim = { kind: "grant"; insee: string } | { kind: "dossier"; insee: string; paid: boolean }`
  - `decideTerritoryAccess(claims: TerritoryClaim[], insee: string): boolean`
  - `decidePaidTerritory(claims: TerritoryClaim[], insee: string): boolean`

**Note de conception :** `TerritoryClaim` ne porte pas la source du grant. **Tout `report_grant`
naît du webhook Stripe** (migration 12 : aucune policy d'écriture, service role uniquement), donc
tout grant est par construction un achat. Discriminer `direct` de `pack_decision` dans le code
graverait un débat tarifaire là où il n'y en a pas.

**Cet invariant est une hypothèse sur le monde, et il faut le dire là où il se romprait.** Le jour
où un grant promotionnel, offert ou importé apparaît, `decidePaidTerritory` deviendra faux sans
qu'aucun type ne change. Porter donc ce commentaire au point d'écriture, dans
`src/app/api/stripe/webhook/route.ts`, à côté de l'upsert de `report_grants` :

```ts
// Ce webhook est le SEUL écrivain de report_grants (aucune policy d'écriture côté client).
// decidePaidTerritory() en dépend : tout grant y vaut acquisition payante. Créer un grant
// offert ou promotionnel par un autre chemin rendrait cette règle fausse en silence.
```

Les lignes révoquées sont filtrées **à la lecture** (Task 2), elles n'atteignent jamais ces
fonctions.

- [ ] **Step 1: Écrire les tests**

Créer `src/lib/territory-claims.test.ts` :

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { decideTerritoryAccess, decidePaidTerritory, type TerritoryClaim } from "./territory-claims.ts";

const NANTES = "44109";

test("aucune revendication : ni accès ni acquisition", () => {
  assert.equal(decideTerritoryAccess([], NANTES), false);
  assert.equal(decidePaidTerritory([], NANTES), false);
});

test("un grant ouvre le territoire ET vaut acquisition (tout grant naît du webhook)", () => {
  const claims: TerritoryClaim[] = [{ kind: "grant", insee: NANTES }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), true);
});

test("un dossier PAYÉ ouvre le territoire et vaut acquisition", () => {
  const claims: TerritoryClaim[] = [{ kind: "dossier", insee: NANTES, paid: true }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), true);
});

test("un dossier ADMINISTRATIF ouvre le territoire mais n'est JAMAIS une acquisition", () => {
  // Sinon créer un dossier de test à Nantes offrirait le tarif d'approfondissement
  // sur tous les biens nantais, alors que rien n'a été encaissé.
  const claims: TerritoryClaim[] = [{ kind: "dossier", insee: NANTES, paid: false }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), false);
});

test("une revendication sur une AUTRE commune ne donne rien", () => {
  const claims: TerritoryClaim[] = [{ kind: "grant", insee: "75056" }];
  assert.equal(decideTerritoryAccess(claims, NANTES), false);
  assert.equal(decidePaidTerritory(claims, NANTES), false);
});

test("PLM : un dossier sur l'arrondissement vaut pour la commune, et réciproquement", () => {
  // L'adresse est géocodée sur l'arrondissement (69386), la commune stockée sur 69123.
  // Comparer sans communeParent() refuserait un droit réellement acquis.
  const surArrondissement: TerritoryClaim[] = [{ kind: "dossier", insee: "69386", paid: true }];
  assert.equal(decideTerritoryAccess(surArrondissement, "69123"), true);
  assert.equal(decidePaidTerritory(surArrondissement, "69386"), true);

  const surCommune: TerritoryClaim[] = [{ kind: "grant", insee: "69123" }];
  assert.equal(decideTerritoryAccess(surCommune, "69386"), true);
});
```

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node --test src/lib/territory-claims.test.ts`
Attendu : FAIL, `Cannot find module './territory-claims.ts'`.

- [ ] **Step 3: Implémenter**

Créer `src/lib/territory-claims.ts` :

```ts
import { communeParent } from "./plm.ts";

// ════════════════════════════════════════════════════════════════════════════
// La DÉCISION de droit territorial, séparée de son accès à la base.
//
// Deux questions distinctes, et les confondre coûte cher :
//   - « peut-il LIRE le territoire ? » : un grant, ou un dossier dans la commune ;
//   - « a-t-il PAYÉ le territoire ? » : gouverne le tarif d'approfondissement.
// Un dossier administratif répond oui à la première, non à la seconde.
//
// Ce module n'importe PAS `server-only` : il doit rester testable sous `node --test`.
// ════════════════════════════════════════════════════════════════════════════

export type TerritoryClaim =
  | { kind: "grant"; insee: string }
  | { kind: "dossier"; insee: string; paid: boolean };

// PLM : l'adresse est géocodée sur l'arrondissement (691xx), la commune stockée sur 69123.
// On compare au grain COMMUNE des deux côtés. La colonne `insee` garde son code local.
function sameCommune(a: string, b: string): boolean {
  return communeParent(a) === communeParent(b);
}

export function decideTerritoryAccess(claims: TerritoryClaim[], insee: string): boolean {
  return claims.some((c) => sameCommune(c.insee, insee));
}

export function decidePaidTerritory(claims: TerritoryClaim[], insee: string): boolean {
  return claims.some(
    (c) => sameCommune(c.insee, insee) && (c.kind === "grant" || c.paid),
  );
}
```

- [ ] **Step 4: Lancer, vérifier le succès**

Run: `node --test src/lib/territory-claims.test.ts`
Attendu : PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/territory-claims.ts src/lib/territory-claims.test.ts
git commit -m "Lire le territoire et l'avoir payé sont deux questions : un dossier de test ouvre sans acquérir"
```

---

## Task 4: L'écriture passe par le serveur

**Files:**
- Create: `src/lib/server/address-dossier-write.ts`
- Modify: `src/lib/active-territory.ts`
- Modify: `src/app/(account)/rapport/page.tsx:46`

**Interfaces:**
- Consumes: `AddressDossierRow` (Task 2), `decideTerritoryAccess` / `decidePaidTerritory` (Task 3)
- Produces:
  - `type AddressDossierPatch`
  - `updateOwnedAddressDossier(userId: string, dossierId: string, patch: AddressDossierPatch): Promise<AddressDossierRow | null>`
  - `loadTerritoryClaims(sb, userId): Promise<TerritoryClaim[]>`
  - `canAccessTerritory(sb, userId, insee): Promise<boolean>`
  - `hasPaidTerritory(sb, userId, insee): Promise<boolean>`
  - **Supprime** `canAnalyzeCommune`

- [ ] **Step 1: Écrire le helper d'écriture**

Créer `src/lib/server/address-dossier-write.ts` :

```ts
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { AddressDossierRow } from "@/lib/address-dossier-store";

// ════════════════════════════════════════════════════════════════════════════
// LE SEUL chemin d'écriture d'un dossier. `authenticated` n'a plus aucun privilège
// d'écriture sur la table (migration 25) : sans ce helper, rien ne s'écrit.
//
// Il ne REND JAMAIS le client service role. Une fonction qui vérifie la propriété du
// dossier A puis remet un client tout-puissant laisse une route future écrire le
// dossier B par erreur. La clause de propriété vit ici, elle n'est pas une convention
// répétée dans chaque route.
// ════════════════════════════════════════════════════════════════════════════

// Type FERMÉ sur les seules colonnes d'artefact. Ni id, ni user_id, ni ban_id, ni insee,
// ni aucune colonne de provenance ou de révocation.
export type AddressDossierPatch = Partial<
  Pick<
    AddressDossierRow,
    | "posture" | "snapshot"
    | "dpe_selection_status" | "selected_dpe_id" | "selected_dpe_snapshot" | "selected_dpe_at"
    | "synthesis_text" | "synthesis_fact_hash" | "synthesis_generated_at"
  >
>;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// Retourne la ligne mise à jour, ou null si le dossier n'existe pas, ne lui appartient pas,
// ou a été révoqué. Un null est un REFUS, jamais un succès silencieux.
export async function updateOwnedAddressDossier(
  userId: string,
  dossierId: string,
  patch: AddressDossierPatch,
): Promise<AddressDossierRow | null> {
  const { data } = await admin
    .from("address_dossiers")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", dossierId)
    .eq("user_id", userId)
    .is("access_revoked_at", null)
    .select("*")
    .maybeSingle();
  return (data as AddressDossierRow) ?? null;
}
```

- [ ] **Step 2: Brancher les droits sur la base**

Dans `src/lib/active-territory.ts` : **supprimer entièrement `canAnalyzeCommune`** et ajouter :

```ts
import { decideTerritoryAccess, decidePaidTerritory, type TerritoryClaim } from "./territory-claims.ts";

// Charge en DEUX requêtes ce qui fonde un droit territorial. Les dossiers révoqués sont exclus
// ici : ils n'atteignent jamais la décision.
export async function loadTerritoryClaims(
  supabase: SupabaseClient,
  userId: string,
): Promise<TerritoryClaim[]> {
  const [grantsRes, dossiersRes] = await Promise.all([
    supabase.from("report_grants").select("insee").eq("user_id", userId),
    supabase
      .from("address_dossiers")
      .select("insee, stripe_payment_intent_id")
      .eq("user_id", userId)
      .is("access_revoked_at", null),
  ]);

  // Les DEUX erreurs sont inspectées. Une liste vide obtenue par panne se lirait « aucun droit »,
  // donc fermerait le Territoire d'un acheteur légitime pendant l'incident.
  if (grantsRes.error) throw new Error(`report_grants a échoué : ${grantsRes.error.message}`);
  if (dossiersRes.error) throw new Error(`address_dossiers a échoué : ${dossiersRes.error.message}`);
  const { data: grants } = grantsRes;
  const { data: dossiers } = dossiersRes;

  return [
    ...((grants ?? []) as { insee: string }[]).map(
      (g): TerritoryClaim => ({ kind: "grant", insee: g.insee }),
    ),
    ...((dossiers ?? []) as { insee: string; stripe_payment_intent_id: string | null }[]).map(
      (d): TerritoryClaim => ({
        kind: "dossier",
        insee: d.insee,
        paid: d.stripe_payment_intent_id !== null,
      }),
    ),
  ];
}

// Territoire complet : un grant sur la commune, ou un dossier accessible dans cette commune.
// La RÉSIDENCE n'ouvre plus rien par elle-même. Ce n'est pas une régression : un compte gratuit
// voyait déjà le rapport PARTIEL de sa commune, qui reste rendu quand cette fonction dit faux.
export async function canAccessTerritory(
  supabase: SupabaseClient,
  userId: string,
  insee: string | null | undefined,
): Promise<boolean> {
  if (!insee) return false;
  return decideTerritoryAccess(await loadTerritoryClaims(supabase, userId), insee);
}

// Gouverne le TARIF d'approfondissement (spec de tarification). Un dossier administratif
// (stripe_payment_intent_id nul) ouvre le territoire sans jamais valoir acquisition.
export async function hasPaidTerritory(
  supabase: SupabaseClient,
  userId: string,
  insee: string | null | undefined,
): Promise<boolean> {
  if (!insee) return false;
  return decidePaidTerritory(await loadTerritoryClaims(supabase, userId), insee);
}
```

Dans `resolveReadableTerritory`, remplacer la seule lecture directe de `report_grants` par
`decideTerritoryAccess(await loadTerritoryClaims(supabase, userId), territory.inseeCode)`, pour
qu'un territoire couvert par un dossier cesse d'être refusé.

**Ne pas toucher à la branche `if (territory.isResidence) return …`.** Ce resolver choisit
**quelle commune afficher**, il ne dit pas si le rapport est complet. Supprimer ce
court-circuit ferait retomber un compte gratuit sur aucune commune du tout, alors qu'il doit
continuer de voir le rapport partiel de la sienne.

La complétude devient une question **séparée**, posée par la page. Dans
`src/app/(account)/rapport/page.tsx:46` :

```tsx
// Avant : un flag de plan GLOBAL, qui ne disait pas quelle commune était payée. Un achat
// quelconque ouvrait donc le Territoire complet de la commune de résidence, jamais achetée.
// const fullReport = canAccessCompleteReport(account);
const fullReport = await canAccessTerritory(supabase, user.id, inseeCode);
```

Les dix branches qui consomment `fullReport` restent inchangées : le rapport partiel reste rendu
quand la réponse est faux.

- [ ] **Step 3: Typecheck**

Run: `npx tsc --noEmit`
Attendu : des erreurs **uniquement** dans les routes et pages (Tasks 5 et 6), aucune dans
`active-territory.ts` ni `address-dossier-write.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/server/address-dossier-write.ts src/lib/active-territory.ts
git add "src/app/(account)/rapport/page.tsx"
git commit -m "La complétude du rapport se demande à la commune, plus à un flag de plan global"
```

---

## Task 5: Les routes d'écriture

**Files:**
- Delete: `src/app/api/logement-artefact/route.ts`
- Modify: `src/components/report/LogementModule.tsx:100-115` (l'appel qui disparaît)
- Modify: `src/app/api/logement-dpe/route.ts`
- Modify: `src/app/api/logement-autour/route.ts`
- Modify: `src/app/api/synthesize-logement/route.ts`

**Interfaces:**
- Consumes: `updateOwnedAddressDossier`, `getDossier` (Tasks 2 et 4)

- [ ] **Step 1: Supprimer la route d'artefact et son appelant**

```bash
git rm -r src/app/api/logement-artefact
```

Dans `LogementModule.tsx`, supprimer la fonction qui appelle `/api/logement-artefact` (l. 100-115)
et son site d'appel. Motif à porter en commentaire là où l'appel se trouvait :

```tsx
// La ligne de dossier n'est plus créée par le client. Elle naît du webhook Stripe (dossier acheté)
// ou de la route d'administration. Un créateur implicite côté client ferait revenir par la fenêtre
// exactement ce que le 29/07 a supprimé.
```

- [ ] **Step 2: Basculer les trois routes restantes**

Dans chacune : le corps de requête porte désormais `dossierId` (chaîne uuid) au lieu de
`logement_id`, le contrôle `canAnalyzeCommune` disparaît, et l'écriture passe par le helper.
Patron identique dans les trois, ici sur `logement-dpe` :

```ts
const { user } = await requireCurrentUser();

if (typeof body?.dossierId !== "string" || !body.dossierId) {
  return Response.json({ error: "dossierId requis" }, { status: 400 });
}

// Le droit N'EST PLUS la commune : c'est le dossier lui-même. Un null du helper est un refus
// (dossier inexistant, appartenant à quelqu'un d'autre, ou révoqué).
const updated = await updateOwnedAddressDossier(user.id, body.dossierId, {
  ...buildDpeSelectionFields(status, dpe, new Date().toISOString()),
});

if (!updated) {
  return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
}
```

Dans `logement-dpe`, ajouter le contrôle que la spec exige : `selected_dpe_id` n'est jamais accepté
aveuglément, il doit figurer parmi les candidats retrouvés pour l'adresse du dossier.

Dans `synthesize-logement`, `saveSynthesis(...)` devient
`updateOwnedAddressDossier(user.id, body.dossierId, { synthesis_text, synthesis_fact_hash, synthesis_generated_at })`.
L'ancien no-op silencieux quand la ligne manquait disparaît : un refus se dit.

Dans `logement-autour`, l'upsert du snapshot devient un patch `{ snapshot, posture }`.

- [ ] **Step 3: Ajuster les appelants clients**

Dans `LogementModule.tsx` et `AutourModule.tsx`, `logement_id: result.address?.id` devient
`dossierId: <l'uuid du dossier ouvert>`, threadé depuis la page (Task 6).

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Attendu : erreurs restantes **uniquement** dans les pages (Task 6).

- [ ] **Step 5: Commit**

```bash
git add -u src/app/api src/components/report
git commit -m "Les routes écrivent par le dossier possédé, et le créateur implicite disparaît"
```

---

## Task 6: Les pages et le panneau de choix

**Files:**
- Modify: `src/app/(account)/rapport/logement/page.tsx`
- Modify: `src/app/(account)/rapport/autour/page.tsx`
- Modify: `src/app/(account)/rapport/page.tsx:77`
- Create: `src/app/(account)/rapport/dossiers/page.tsx`

**Interfaces:**
- Consumes: `getDossier`, `getSoleDossier`, `listDossiers` (Task 2), `canAccessTerritory` (Task 4)

**Ce qui a été retiré de cette tâche, et pourquoi :** le panneau « vous avez déjà un dossier à
cette adresse » **appartient à la spec de qualification**. Il suppose une adresse soumise, donc un
`ban_id` connu, un prix calculé et un checkout, qui n'existent pas encore. L'écrire ici produirait
un composant que rien n'appelle, avec un bouton payant qui ne mène nulle part. Ici, on livre la
seule chose dont les modules ont besoin tout de suite : **choisir parmi les dossiers qu'on
possède déjà**.

- [ ] **Step 1: La page de sélection**

Créer `src/app/(account)/rapport/dossiers/page.tsx` : la liste des dossiers actifs du compte, via
`listDossiers`. C'est la destination des modules quand aucun dossier n'est visé et qu'il en existe
plusieurs.

Chaque ligne porte de quoi reconnaître le bien : `address_label`, date de `created_at`, classe du
DPE sélectionné quand il existe, sinon « logement à préciser ». Deux liens par ligne, vers
`/rapport/logement?dossierId=…` et `/rapport/autour?dossierId=…`.

**Aucun bouton payant sur cette page.** Elle ne fait que rouvrir ce qui est déjà possédé.

Si la liste est vide, la page dit qu'aucun dossier n'existe encore et renvoie vers `/rapport`,
sans jamais rediriger en silence.

- [ ] **Step 2: Basculer les deux pages**

Dans les deux, `?logementId=` devient `?dossierId=`, **sans compatibilité** (ces pages sont
derrière le paywall, en `force-dynamic`, non indexées, et aucun compte n'a payé).

Le verrou `canAccessCompleteReport(account)` en tête disparaît. À la place :

```tsx
const { dossierId } = await searchParams;

if (dossierId) {
  const dossier = await getDossier(supabase, user.id, dossierId);
  // Le droit EST la ligne. Pas de dossier accessible, pas de module.
  if (!dossier) redirect("/rapport");
  // … rendu du module sur ce dossier
}

// Aucun dossier visé : le repli ne s'applique QU'À un dossier unique.
const sole = await getSoleDossier(supabase, user.id);
if (sole) redirect(`/rapport/logement?dossierId=${encodeURIComponent(sole.id)}`);

// Zéro dossier, ou plusieurs. Dans les deux cas on ne devine pas : la page de sélection
// répond « lequel ? » quand il y en a plusieurs, et « aucun encore » quand il n'y en a pas.
redirect("/rapport/dossiers");
```

Rediriger vers `?dossierId=` plutôt que rendre le dossier unique en place garde une seule forme
d'URL : celle qu'on peut recharger, mettre en favori et relire dans les journaux.

Le repli reste soumis aux mêmes conditions de rehydratation qu'aujourd'hui (`city` + `postcode`
pour le re-fetch Géorisques ; en plus, sur `/rapport/logement`, un `dpe_selection_status` terminal).

Dans `rapport/page.tsx:77`, le lien devient
`` `/rapport/logement?dossierId=${encodeURIComponent(dossier.id)}` ``.

- [ ] **Step 3: Typecheck et build**

Run: `npx tsc --noEmit` → attendu : **aucune erreur**.
Run: `npm run build` → attendu : succès.

- [ ] **Step 4: Commit**

```bash
git add -u "src/app/(account)/rapport" && git add "src/app/(account)/rapport/dossiers/page.tsx"
git commit -m "Deux dossiers au même immeuble posent une question au lieu d'en ouvrir un au hasard"
```

---

## Task 7: Le créateur administratif

**Files:**
- Create: `src/app/api/admin/dossier/route.ts`
- Modify: `src/components/report/LogementModule.tsx` (le bouton)
- Modify: `.env.example`

**Interfaces:**
- Consumes: le client service role (Task 4)
- Produces: `POST /api/admin/dossier` → `{ dossierId: string }` · `DELETE /api/admin/dossier`

- [ ] **Step 1: La route, avec ses deux verrous**

```ts
import "server-only";

// DEUX verrous indépendants. ENABLE_ADMIN_DOSSIER_CREATION est absent en production par défaut,
// donc la route y répond 404 quelle que soit la liste d'e-mails.
//
// Ce créateur privilégié ne contourne AUCUN contrôle d'accès : canAccessTerritory et la lecture
// des dossiers ignorent totalement l'existence d'un compte de service. Une variable mal
// configurée ne peut donc pas ouvrir le produit à tout le monde ; au pire, quelqu'un se crée des
// dossiers vides à lui-même. C'est la différence avec une exception dans le contrôle d'accès,
// qui fuit en silence.
function adminEnabled(email: string | null | undefined): boolean {
  if (process.env.ENABLE_ADMIN_DOSSIER_CREATION !== "true") return false;
  const allowed = (process.env.FUTUREE_ADMIN_EMAILS ?? "")
    .split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && allowed.includes(email.toLowerCase()));
}
```

Si le verrou refuse : `new Response(null, { status: 404 })`, jamais un 403 (un 403 confirmerait
l'existence de la route). Sinon, insertion en service role avec les colonnes de provenance
**laissées nulles**, ce que la contrainte `address_dossiers_provenance_ck` impose de toute façon.
La réponse porte le `dossierId` créé.

Le `DELETE` filtre sur **deux** conditions, jamais sur le seul `id` :

```ts
// Le service role ignore la RLS : sans ces deux filtres, l'outil de nettoyage pourrait détruire
// un dossier PAYÉ (le tien, le jour où tu en auras un) ou celui de quelqu'un d'autre.
.eq("id", dossierId)
.eq("user_id", user.id)
.is("stripe_payment_intent_id", null)
```

- [ ] **Step 2: Le bouton**

Sur l'écran de saisie d'adresse, visible pour ce seul compte : « créer un dossier (test) ». Il
poste l'adresse validée et redirige vers `/rapport/logement?dossierId=<uuid>`. Le porteur parcourt
ensuite **le même chemin que n'importe quel acheteur**.

- [ ] **Step 3: Documenter les variables**

Dans `.env.example` :

```
# Créateur de dossiers pour les tests. Les DEUX sont requis, et le premier reste absent en prod.
ENABLE_ADMIN_DOSSIER_CREATION=true
FUTUREE_ADMIN_EMAILS=bonjour.futuree@gmail.com
```

- [ ] **Step 4: Vérifier de bout en bout**

`npm run dev`, se connecter avec le compte de service, saisir une adresse, cliquer, vérifier que le
module s'ouvre. Puis retirer `ENABLE_ADMIN_DOSSIER_CREATION` de `.env.local`, redémarrer, et
vérifier que la route répond **404**.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/admin/dossier/route.ts .env.example && git add -u src/components/report
git commit -m "Un créateur de dossiers pour les tests, qui ne contourne aucun contrôle d'accès"
```

---

## Task 8: Vérifier la RLS contre la base réelle

**Files:**
- Create: `scripts/verify-address-dossiers-rls.mjs`

**Pourquoi un script et pas un test :** un test qui simule un client Supabase éprouverait notre
propre logique contre nos propres chaînes, ce que le handoff §6 reproche précisément aux anciens
tests. Une policy ne se vérifie que contre la base, avec un vrai JWT utilisateur.

- [ ] **Step 1: Écrire le script**

Il lit ses identifiants dans l'**environnement**, jamais dans `argv` (un mot de passe en argument
se retrouve dans l'historique du shell et dans la liste des processus). Il se connecte avec la clé
**anon**, jamais la service role.

**Phase de préparation, en service role** : le script crée d'abord un dossier appartenant à un
**second** compte. Sans cette ligne étrangère, le test d'isolation réussirait sur une table qui
n'en contient simplement aucune, c'est-à-dire pour la mauvaise raison.

```js
// Préparation (service role) : un dossier au compte A, un dossier au compte B.
// Puis, connecté en anon comme compte A :
// 1. INSERT d'un dossier pour soi          → doit échouer (privilège révoqué)
// 2. UPDATE de snapshot sur son dossier    → doit échouer
// 3. UPDATE de stripe_payment_intent_id    → doit échouer
// 4. DELETE de son propre dossier          → doit échouer
// 5. SELECT de ses dossiers                → doit RÉUSSIR, et voir le sien
// 6. SELECT du dossier du compte B (par id)→ doit retourner 0 ligne
// 7. RÉVOCATION : le service role pose access_revoked_at sur le dossier de A,
//    puis A relit sa propre ligne         → doit retourner 0 ligne
```

Le point 7 est celui qui distingue une révocation de droit d'une révocation d'interface. Il échoue
si la clause `access_revoked_at is null` manque dans la policy.

Le script sort en code 1 si une seule de ces attentes est démentie, en nommant laquelle.

- [ ] **Step 2: Lancer contre la base de développement**

```bash
TEST_USER_EMAIL=… TEST_USER_PASSWORD=… TEST_OTHER_USER_ID=… \
  node scripts/verify-address-dossiers-rls.mjs
```

Attendu : `RLS vérifiée : 4 écritures refusées, lecture propre OK, isolation OK, révocation OK.`

- [ ] **Step 3: Vérifier la coexistence de deux dossiers au même immeuble**

Avec la route d'administration, créer deux dossiers sur **le même `ban_id`**. Puis, en SQL :

```sql
select id, ban_id, dpe_selection_status, selected_dpe_id
from public.address_dossiers where ban_id = '<le ban_id>';
```

Attendu : **deux lignes**, deux `id` distincts. Choisir un DPE différent sur chacune depuis
l'application, relancer la requête, et vérifier que les deux `selected_dpe_id` diffèrent. **C'est le
test du défaut §5** : avant cette migration, la seconde analyse écrasait la première.

- [ ] **Step 4: Vérifier l'idempotence de schéma**

```sql
insert into public.address_dossiers
  (user_id, ban_id, insee, address_label, latitude, longitude,
   stripe_payment_intent_id, amount_paid_cents, purchased_at)
values ('<user_id>', 'b1', '44109', 'test', 47.2, -1.5, 'pi_test_1', 3900, now());
-- rejouer la MÊME insertion
```

Attendu : la seconde échoue sur `address_dossiers_payment_intent_key`. Que le webhook rejoué
**retrouve** le dossier et réponde en succès relève du `ON CONFLICT`, donc de la spec du webhook.

- [ ] **Step 5: Commit**

```bash
git add scripts/verify-address-dossiers-rls.mjs
git commit -m "Une policy ne se vérifie que contre la base, avec un vrai JWT"
```

---

## Task 9: Release coordonnée

**Files:** aucun. Cette tâche est une séquence d'exécution, et elle est la seule qui touche la
production.

**Pourquoi elle existe :** l'ancien code interroge `logement`, le nouveau `address_dossiers`. Entre
l'application de la migration et l'arrivée du nouveau code en production, l'ancien code tourne
contre une table qui n'existe plus. La fenêtre doit être courte et voulue, jamais découverte.

- [ ] **Step 1: Vérifier que tout est vert sur la branche**

Run: `npx tsc --noEmit` → aucune erreur.
Run: `npm run build` → succès.
Run: `node --test src/lib/address-dossier-store.test.ts src/lib/territory-claims.test.ts` → PASS.

- [ ] **Step 2: Relever le compte de lignes de la base de PRODUCTION**

```sql
select count(*) from public.logement;
```

Reporter ce nombre dans `<NOMBRE_ATTENDU>` de la migration. S'il diffère de ce qui était attendu,
**arrêter** et comprendre pourquoi avant d'aller plus loin.

- [ ] **Step 3: Appliquer la migration en production**

Coller `supabase/25_address_dossiers.sql` dans l'éditeur SQL du projet de production. Le garde-fou
lève une exception si le compte ne correspond pas, et la transaction entière est annulée.

- [ ] **Step 4: Fusionner et pousser immédiatement**

```bash
git checkout main && git merge <branche> && git push
```

Suivre le déploiement Vercel jusqu'à ce qu'il soit actif. C'est ici que la fenêtre
d'incompatibilité se referme.

- [ ] **Step 5: Smoke tests en production, dans cet ordre**

1. Compte gratuit : `/rapport` affiche le **rapport partiel** de la commune de résidence. C'est la
   vérification que le nouveau contrôle n'a pas fermé ce qui était ouvert.
2. Compte avec un `report_grant` : `/rapport` sur cette commune est **complet**.
3. Sans dossier : `/rapport/logement` redirige vers `/rapport/dossiers`, qui dit qu'aucun dossier
   n'existe.
4. Route d'administration : créer un dossier, vérifier que Logement et Autour s'ouvrent dessus.
5. Créer un **second** dossier au même `ban_id`, choisir un DPE différent sur chacun, rouvrir le
   premier et vérifier qu'il a gardé le sien. **C'est le défaut §5, vérifié en production.**
6. `/rapport/logement` sans paramètre, avec deux dossiers : redirige vers `/rapport/dossiers`.
7. Vérifier que `ENABLE_ADMIN_DOSSIER_CREATION` est **absent** de l'environnement de production et
   que la route y répond 404.

- [ ] **Step 6: Consigner**

Ajouter à `docs/handoff/CURRENT.md` la date d'application de la migration et le résultat des sept
smoke tests. Une migration appliquée dont personne ne sait quand est une migration qu'on
réappliquera.

---

## Ce que ce plan ne fait pas

La spec de tarification prend la suite : la route publique de qualification, le calcul du prix
(`hasPaidTerritory` est livré ici, son usage tarifaire non), la création du dossier par le webhook
Stripe avec son `ON CONFLICT`, la page de succès qui attend le webhook, et l'instrumentation.

**Rappel :** entre la Task 4 et la Task 7, l'application n'ouvre plus Autour ni Logement. C'est
assumé, aucun compte n'a payé, et ça rend un nouveau chemin faux visible immédiatement plutôt qu'au
premier achat.
