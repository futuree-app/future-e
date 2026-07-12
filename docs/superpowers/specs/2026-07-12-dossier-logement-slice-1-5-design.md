# Dossier de décision — slice 1.5 : faits Logement (augmentation adresse) — v2

**Date** : 2026-07-12 · **Statut** : design v2 (révisé après 2e revue adversariale), prêt pour plan.
**Ascendance** : étend `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md` (slice 1).

## Changelog v1 → v2 (revue adversariale)

La v1 réintroduisait l'erreur du slice 1 : des **booléens** qui transforment « source indisponible » en
`false` (= aucun signal). Corrigé, et la donnée existante le supporte déjà :

1. **Statuts par famille, pas des booléens.** Chaque source réglementaire distingue déjà présent /
   rien-trouvé / indisponible : `HeritageStatus.sourceStatus` (« une panne n'est JAMAIS une absence de
   servitude »), les 4 `kind` d'`OnrnSinistralite` (`lecture`/`faible_repr`/`aucun`/`indispo`),
   `fetchCavitesNearPoint` (`[]` vide vs `null` panne). Le moteur reçoit un statut, jamais un booléen
   qui écrase l'absence.
2. **Fetch lean découplé du rapport complet.** Le dossier n'appelle pas `buildReport` (11 sources) mais
   `fetchLogementDecisionData` (RGA, PPRN, cavités, patrimoine, sinistralité), qui appelle les fetchers
   BAS NIVEAU directement — d'où le statut par famille (résout le point 1) et l'abandon de
   `banFeatureType`. La route garde son extraction du rapport complet.
3. **Erreur typée, pas de `catch` aveugle.** `LogementDataUnavailableError` pour les pannes attendues ;
   un bug d'adaptateur/règle/assembleur remonte (jamais maquillé en « unavailable »).
4. **Preuves conformes.** `EvidenceRef.sourceMode` (`persisted_snapshot` pour le DPE, `live_fetch` pour
   le réglementaire) + `factId` distinct par famille.
5. **Adaptateur sans `project`** (faits intrinsèques ; la doctrine projet-relative reste aux règles),
   **DPE formulé depuis la classe exacte**, **action propre à chaque règle**.
6. **Faits communs réutilisés** (pas de second `loadModuleFacts`) ; l'impossibilité d'émettre
   `incompatibility` est portée par des fabriques d'aide + garde runtime + test.

**Nuances (divergences assumées, hors périmètre v1.5)** : timeout par `Promise.race` = timeout
d'affichage, sans annulation des appels sous-jacents (documenté, `AbortSignal` = suite) ; un lecteur
de rapport UNIQUE partagé avec `LogementModule` = suite (le module lit le rapport inline côté client) ;
impossibilité d'`incompatibility` par fabriques + runtime + test, pas par généricité complète de type.

## 1. Objectif

Inchangé : quand une analyse logement existe pour la commune active, enrichir « En une minute » avec
les faits Logement au grain adresse, sans ralentir le hub ni figer le statut réglementaire.

## 2. Arbitrage gravé (porteur)

Inchangé : **aucune règle Logement n'émet `incompatibility` en 1.5** (réserves, inconnues scopées,
contexte). Le Logement modifie le niveau de réserve, jamais l'existence d'un blocage. cf.
`docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`.

## 3. Architecture : augmentation serveur différée sous `<Suspense>`

Inchangé dans son principe (dossier communal immédiat, fallback provisoire, remplacement de toute la
section, `try/catch` → `unavailable`). Précisions v2 :

```
<Suspense fallback={ <DossierDecisionSection dossier={communeDossier} logementStatus="pending" /> }>
  <DossierAvecLogement communeFacts={…} project={…} address={…} savedDpe={…} communeDossier={…}>
     try {
       data = await fetchLogementDecisionDataWithTimeout(address)   // lean, FRAÎCHE, timeout
       logement = buildLogementFacts(data, savedDpe)                // pas de project
       facts = { ...communeFacts, hasAddress: true, logement }      // MÊMES faits communs (pas de reload)
       dossier = assembleDossier(runRules(facts, project), project, "commune+adresse")
       → <DossierDecisionSection dossier={dossier} logementStatus="done" />
     } catch (e) {
       if (e instanceof LogementDataUnavailableError)
         → <DossierDecisionSection dossier={communeDossier} logementStatus="unavailable" />
       throw e   // un bug de code reste visible (frontière d'erreur / observabilité)
     }
  </DossierAvecLogement>
</Suspense>
```

- **`communeFacts` passés en prop** (pas de second `loadModuleFacts`) : le fallback et la version
  augmentée partent EXACTEMENT du même socle. `buildCommuneDossier` retourne `{ moduleFacts, dossier }`.
- **Fraîcheur** : le dossier appelle la lib DIRECTEMENT (aucun cache CDN de route). Le
  `Cache-Control: s-maxage=3600` de la route est pré-existant et n'affecte que le fetch client du
  module (orthogonal). Exigence réelle : les fetchers bas niveau ne doivent pas utiliser le data-cache
  Next (audit large au plan ; `cache: "no-store"` où nécessaire).
- **Timeout** : `Promise.race` (timeout d'AFFICHAGE) ; les appels sous-jacents continuent (documenté,
  annulation par `AbortSignal` = suite).

## 4. La donnée de décision (lean) + l'erreur typée

`src/lib/server/logement-decision-data.ts` :

```ts
export type SourceCoverage = "present" | "none" | "unavailable"; // none = source a répondu, rien trouvé

export type LogementDecisionData = {
  rga: { coverage: SourceCoverage; label: string | null };
  pprn: { coverage: SourceCoverage; count: number };
  cavites: { coverage: SourceCoverage; count: number };
  patrimoine: { coverage: SourceCoverage; count: number };
  sinistralite: { coverage: SourceCoverage; active: boolean }; // active = lecture|faible_repr
  fetchedAt: string;
};

export class LogementDataUnavailableError extends Error {
  constructor(public readonly reason: "timeout" | "upstream_error" | "insufficient_address") { super(reason); }
}

export async function fetchLogementDecisionData(address: ResolvedAddress): Promise<LogementDecisionData>;
export function fetchLogementDecisionDataWithTimeout(address: ResolvedAddress, ms?: number): Promise<LogementDecisionData>;
```

Dérivation du `coverage` par famille (le statut EXISTE déjà à la source) :
- **cavités / mvt** : `fetchCavitesNearPoint` → `null` ⇒ `unavailable`, `[]` ⇒ `none`, `[…]` ⇒ `present`.
- **patrimoine** : `fetchHeritageProtections` → `sourceStatus==="unavailable"` ⇒ `unavailable`, sinon
  `items.length>0` ⇒ `present`, `===0` ⇒ `none`.
- **sinistralité** : `getOnrnSinistralite` → `indispo` ⇒ `unavailable`, `aucun` ⇒ `none`,
  `lecture`/`faible_repr` ⇒ `present` (`active:true`).
- **RGA / PPRN** : depuis `getGeorisquesAddressSummary` / `getGeorisquesParcelSummary` → résumé `null`
  (token absent / panne) ⇒ `unavailable` ; sinon lecture CHAMP PAR CHAMP (RGA parcelle-puis-adresse,
  regulatoryPlans parcelle-puis-adresse) ⇒ `present`/`none`.

Le timeout REJETTE avec `LogementDataUnavailableError("timeout")`. Une panne réseau globale →
`upstream_error`. Ces deux-là seuls sont captés par l'augmentation.

**Fetchers partagés, pas de duplication** : `fetchLogementDecisionData` réutilise les MÊMES fonctions
bas niveau que la route (`getGeorisquesAddressSummary`, `fetchCavitesNearPoint`,
`fetchHeritageProtections`, `getOnrnSinistralite`, `findCadastreParcelByPoint` pour la parcelle).

## 5. Contrats moteur

```ts
export type LogementFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent"; // DPE SAUVEGARDÉ (persisté)
  dpeLabel: string | null;                               // classe exacte (F/G/E…)
  rga: SourceCoverage; expositionBati: boolean;          // present + label notable => expositionBati
  pprn: SourceCoverage; zoneReglementee: boolean;
  cavites: SourceCoverage; caviteProche: boolean;
  patrimoine: SourceCoverage; perimetrePatrimonial: boolean;
  sinistralite: SourceCoverage; sinistraliteActive: boolean;
  addressLabel: string;
};
type ModuleFacts = { /* …commune… */ logement?: LogementFacts };
```

`EvidenceRef` gagne :

```ts
sourceMode: "persisted_snapshot" | "live_fetch";
observedAt?: string; // pour live_fetch (fetchedAt)
// factId distinct : "logement.dpe", "logement.pprn", "logement.cavites", …
```

Aucun nouveau rôle `DecisionFact`. Aucun nouvel état de conclusion. `Dossier.scope` reste
`"commune" | "commune+adresse"`. `pending`/`unavailable` = props de rendu.

## 6. Adaptateur `buildLogementFacts`

`buildLogementFacts(data: LogementDecisionData, savedDpe: DpeRecord | null): LogementFacts` — pur,
**sans `project`**. Mappe chaque famille : `coverage` transmis tel quel ; le booléen dérivé
(`expositionBati` = `rga.coverage==="present" && /moyen|fort|élev/.test(label)`, etc.) n'est vrai que
si `coverage==="present"`. `dpe` = `energyState(savedDpe?.etiquette_dpe)`, `dpeLabel` = l'étiquette.

## 7. Règles Logement (statut-aware)

Fabriques dans `logement-rules.ts` (structurellement incapables d'émettre `incompatibility`) :

```ts
function logementVerification(id, ev, tier, statement, action, opts?): VerificationFact;
function logementScopedUnknown(id, ev, statement, action?): UnknownFact; // impact: "scoped"
```

Chaque règle lit le `coverage` de sa famille :
- `present` (signal établi) → `verification` (constat établi + action propre).
- `unavailable` (source en panne) → `unknown` scopée (« n'a pas pu être vérifié à cette adresse »).
- `none` (source a répondu, rien) → **aucun fait** (honnête par omission, jamais « aucun risque »).

Les six familles (rôle `verification`/`unknown` scopée, jamais `incompatibility`), posture-aware
(bucket achat/reside/location/neutre), action propre :

| ruleId | present → verification | unavailable → unknown scopée | action type |
|--------|------------------------|------------------------------|-------------|
| `logement.dpe-faible` | DPE ∈ {passoire, energivore}, formulé depuis la classe exacte | (DPE persisté : pas de `unavailable`) | `demander_confirmation` (achat : chiffrer travaux) |
| `logement.exposition-bati` | RGA moyen/fort | RGA non lisible | `verifier_sur_place` |
| `logement.zone-reglementee` | ≥1 PPRN | zonage non lisible | `obtenir_document` |
| `logement.cavite` | ≥1 cavité < 500 m | source cavités en panne | `verifier_sur_place` |
| `logement.patrimoine` | dans un périmètre (buckets ≠ location) | GPU en panne | `obtenir_document` |
| `logement.sinistralite` | `active` | `indispo` | `obtenir_document` |

Discipline : DPE = `persisted_snapshot` dans la preuve ; le reste = `live_fetch` + `observedAt`. RGA
et sinistralité portent une `limitation` obligatoire. DPE G/F ⇒ « une passoire énergétique », E ⇒
« un logement énergivore » (jamais la concaténation fautive de la v1).

Impossibilité d'`incompatibility` garantie à 3 niveaux : les fabriques ne produisent que
`verification`/`unknown` ; une garde runtime dans `runRules` jette si un `ruleId` commençant par
`logement.` émet `incompatibility` ; un test le vérifie.

## 8. Rendu (`logementStatus`)

Inchangé v1 (none/pending/done/unavailable, bannières, titre section « À examiner avant de vous
engager »). Les faits `unknown` scopés Logement apparaissent dans la section « Ce que nous ne savons
pas encore » (rôle unknown), distincts des `verification`.

## 9. Conclusion double grain

Inchangé : `scope==="commune+adresse"` préfixe « À l'échelle de la commune et de l'adresse, ». Les
inconnues scopées Logement comptent dans les réserves.

## 10. Invariants à tester (plan)

1. Aucune règle Logement n'émet `incompatibility` (fabriques + garde runtime + test).
2. Bloc `logement` absent → dossier communal STRICTEMENT inchangé.
3. Famille `present` → `verification` avec preuve `sourceMode` correct, limite, action propre.
4. Famille `unavailable` → `unknown` scopée (« n'a pas pu être vérifié »), jamais rien / jamais « aucun risque ».
5. Famille `none` → aucun fait émis.
6. Échec global (timeout/upstream) → `LogementDataUnavailableError` → `scope: "commune"` + `unavailable`.
7. Un bug d'adaptateur/règle/assembleur REMONTE (pas capté comme `unavailable`).
8. Augmentation réussie → `scope: "commune+adresse"` ; faits communs identiques au fallback (pas de reload).
9. Preuve DPE = `persisted_snapshot` ; preuve réglementaire = `live_fetch` + `observedAt` ; `factId` distinct.
10. Textes achat/location/habitant distincts ; DPE formulé depuis la classe exacte.

## 11. Fichiers

Neufs :
- `src/lib/server/georisques-logement.ts` (extraction `fetchLogementReport` du `buildReport` de la route, pour LA ROUTE).
- `src/lib/server/logement-decision-data.ts` (`fetchLogementDecisionData` lean + `LogementDataUnavailableError` + timeout).
- `src/lib/decision/logement-facts.ts` (adaptateur pur `buildLogementFacts`, sans project) + test.
- `src/lib/decision/logement-rules.ts` (fabriques + 6 règles statut-aware) + test.
- `src/components/report/DossierAvecLogement.tsx` (Server Component async, catch typé).

Touchés :
- `src/app/api/georisques-logement/route.ts` (importe `fetchLogementReport`).
- `src/lib/decision/decision-fact.ts` (`ModuleFacts.logement?`, `LogementFacts`, `SourceCoverage`, `EvidenceRef.sourceMode/observedAt`).
- `src/lib/decision/materiality-rules.ts` (REGISTRY + garde runtime `logement.*` ≠ incompatibility).
- `src/lib/decision/decision-assembler.ts` (conclusion double grain, titre neutralisé).
- `src/lib/decision/territory-facts.ts` (`buildCommuneDossier` retourne `{ moduleFacts, dossier }`).
- `src/components/report/DossierDecisionSection.tsx` (`logementStatus`).
- `src/app/(account)/rapport/page.tsx` (Suspense + passage de `moduleFacts`).

## 12. Hors périmètre / suites documentées

- `AbortSignal` (annulation réelle des fetchers au timeout).
- Lecteur de rapport UNIQUE partagé entre `LogementModule` (client, inline) et le dossier.
- Distinction `unsupported` / `insufficient_precision` (sous-cas de `SourceCoverage`).
- Face 3 (autour immédiat) dans le dossier.
- Incompatibilité au grain adresse (attend une contrainte adresse déclarable).
- IA de formulation (slice 2).
