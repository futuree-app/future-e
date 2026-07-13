# Dossier de décision — slice 2 : la conclusion rédigée (IA de formulation bornée)

**Date** : 2026-07-13 · **Statut** : spec validée (porteur) · **Prérequis** : slices 1 et 1.5 livrés (`7286d2c`).

## 1. Le problème

Le moteur déterministe sélectionne juste. Il parle mal.

La conclusion du dossier est aujourd'hui une **concaténation mécanique** de trois clauses
(`decision-assembler.ts` : `reservesClause` + `prioritiesClause` + `examinedClause`) :

> « À l'échelle de la commune et de l'adresse, sur les contraintes que nous savons examiner, aucune
> n'est contredite. 4 points méritent néanmoins d'être examinés de près. Vos priorités concernant la
> qualité de l'air, l'agriculture ne sont pas encore couvertes dans cette synthèse. Nous n'avons pas
> encore examiné, à ce grain : la proximité de la mer. »

Trois registres d'incertitude **de gravité très différente** y sont posés à plat, dans l'ordre où le
code les a produits :

1. les **réserves trouvées** : on a regardé, on a vu quelque chose ;
2. les **priorités déclarées non couvertes** : le lecteur y tient, futur•e ne sait pas encore les lire ;
3. les **contraintes dures non examinées** : le plus grave, il a posé une condition absolue et on ne
   sait pas la vérifier, donc le verdict lui-même est diminué.

Le slice 2 fait rédiger cette conclusion par un LLM. Le risque numéro un est qu'il **aplatisse** ces
trois niveaux en un « il reste quelques points à vérifier ». La spec ne se contente pas de l'interdire
par prompt : elle rend l'aplatissement **structurellement impossible**.

## 2. La règle qui gouverne tout

> **L'IA est appelée seulement lorsque plusieurs éléments déjà hiérarchisés doivent être articulés.
> Elle ne sélectionne rien, ne classe rien, et n'est jamais utilisée pour maquiller un dossier pauvre.**

Corollaire assumé : tant que la couverture reste mince (2 contraintes Territoire sur 11, Santé
inexistant), le gate rendra souvent `false` et **c'est le texte déterministe qui restera affiché**.
Le slice 2 améliore la voix, pas la matière. La vraie priorité produit reste d'élargir la couverture.

## 3. Périmètre : la conclusion, et rien d'autre

L'IA réécrit **la conclusion seule**. Les `statement`, `limitation`, `evidence` et `action` des
`DecisionFact` restent déterministes, mot pour mot. Les réécrire créerait deux formulations
concurrentes du même fait (celle du moteur, celle du LLM) pour un bénéfice éditorial secondaire, alors
que ces phrases portent des contrats sensibles : le grain géographique, le degré de certitude, la
limitation, la distinction entre fait observé et implication, le lien à la preuve.

Une éventuelle reformulation des faits sera un slice ultérieur, avec son propre contrat.

## 4. Le plan narratif (`src/lib/decision/conclusion-plan.ts`, pur)

`buildConclusionPlan(dossier, project)` produit la matière de l'appel. Il ne contient que la
**substance décisionnelle** : aucun `observedAt`, aucun `sourceMode`, aucun timestamp, rien de volatil
(sinon l'artefact s'invalide à chaque chargement alors que rien n'a changé).

```ts
type BlockKey = "verdict" | "unexamined_hard_constraints" | "reserves_found" | "uncovered_priorities";

type NarrativeBlock = {
  key: BlockKey;
  fallbackText: string;  // le texte déterministe de CE registre, affichable seul
  sourceIds: string[];   // factIds / HardConstraintKey / PreferenceKey — JAMAIS produits par l'IA
  maxChars: number;      // borne de longueur du texte généré
};

type LeadSelection =
  | { kind: "single"; factId: string; statement: string; materialityTier: MaterialityTier }
  | { kind: "tied"; factIds: string[]; materialityTier: MaterialityTier }
  | { kind: "none" };

type ConclusionNarrativePlan = {
  scope: "commune" | "commune+adresse";
  conclusionState: ConclusionState;
  posture: ProjectPosture;   // recherche | adresse | habitant | recherche_quartier — pilote le lexique
  blocks: NarrativeBlock[];  // présence ET ordre fixés ici, jamais par l'IA
  reservesCount: number;     // faits AFFICHÉS (post-caps), jamais faits émis — cf. §4.2
  lead: LeadSelection;
};
```

### 4.1 L'ordre est gravé, jamais négocié

`blocks` est construit dans la hiérarchie éditoriale des réserves, du plus grave au moins grave :

1. `verdict` — l'état de conclusion, limité au périmètre réellement examiné ;
2. `unexamined_hard_constraints` — une condition absolue n'a pas pu être testée : elle **diminue la
   valeur du verdict**, donc elle le suit immédiatement ;
3. `reserves_found` — ce qu'on a examiné et qui appelle un regard ;
4. `uncovered_priorities` — réduit la personnalisation, n'invalide pas le verdict.

Le composant rend `plan.blocks` **dans l'ordre reçu**. Il ne trie rien. L'IA renvoie les mêmes clés ;
son ordre de réponse est ignoré.

Une contrainte dure non examinée et une préférence non couverte sont deux absences de couverture, mais
elles ne partagent **jamais** le même bloc.

### 4.2 Défaut d'honnêteté corrigé au passage

`reservesClause` compte aujourd'hui `run.facts` (tous les faits émis) alors que les sections sont
plafonnées (caps 2/3/3/4) et n'affichent que `shown`. Un dossier à cinq vérifications annonce donc
« 5 points méritent d'être examinés » et n'en montre que quatre. **`reservesCount` compte les faits
affichés**, et `decision-assembler.ts` est corrigé dans le même sens.

### 4.3 `lead` : le fait saillant est désigné par le déterministe, jamais élu par l'IA

Calculé sur les seules réserves **affichées** :

- `single` : un fait a un `materialityTier` **strictement** supérieur à tous les autres ;
- `tied` : plusieurs faits partagent le rang maximal ;
- `none` : le rang maximal est `secondary` (rien d'assez matériel pour être cité).

Prendre mécaniquement le premier du tri transformerait un **ordre de déclaration dans le registre** en
**priorité métier** : si deux faits sont `decision_critical`, écrire « à commencer par le PPRN » est
un mensonge de hiérarchie. Donc `tied` existe, et l'IA n'écrit alors aucun « à commencer par ». Le
tie-break technique reste légitime pour l'affichage des cartes ; il ne l'est pas pour déclarer une
priorité dans la conclusion.

## 5. Le gate (`shouldGenerateNarrative(plan)`, pur)

| Contenu du plan | IA |
|---|---|
| projet non structuré | jamais |
| verdict seul | non |
| verdict + un seul autre registre (priorités seules, ou une contrainte non examinée, ou une réserve) | non |
| verdict + deux réserves dont une domine (`lead.kind === "single"`) | oui |
| verdict + trois réserves ou plus | oui |
| verdict + deux registres non-verdict ou plus | oui |

Le nombre brut de blocs n'est pas l'indicateur : « verdict + priorités non couvertes » est exactement
le cas où la matière est faible et où une belle phrase ne ferait que **rendre élégante une absence de
couverture**. À l'inverse, quatre réserves de grains et de niveaux différents justifient une
génération même si le plan ne porte que deux blocs.

**Le gate passe avant le hash et avant la base.** Un plan qui ne justifie aucune rédaction ne doit ni
requêter Supabase, ni pouvoir ressusciter une narration mise en cache quand le gate était positif.

## 6. Génération, validation, rendu

Aucune route API : tout se passe dans le RSC, comme l'augmentation Logement du slice 1.5.

```
page /rapport
 └─ <Suspense fallback={<ConclusionBlock blocks={plan.blocks} />}>   ← déterministe, immédiat
      └─ ConclusionRedigee (async RSC)
           1. header next-router-prefetch === "1" ?  → déterministe, zéro LLM (§6.1)
           2. shouldGenerateNarrative(plan) === false → déterministe, zéro LLM
           3. hash = buildConclusionHash(plan)                        (§7)
           4. artefact en base pour (user, insee, scopeKey, hash) ?
                 → safeParse avec le schéma COURANT : OK → rendu, zéro LLM
                 → parse en échec (contrat qui a bougé) → ignoré, on régénère
           5. generateObject (Sonnet 4.6, medium, thinking off, temp 0.3)
           6. validateGeneratedBlocks(plan, generated)   ← fonction PURE, testée sans LLM
           7. await upsert de l'artefact (échec → log, jamais de blocage du rendu)
           8. rendu ATOMIQUE des 4 blocs ; after() : pruning + métriques
 </Suspense>
```

Le déterministe n'est rendu **qu'en fallback du Suspense**, jamais en double hors frontière.
`ConclusionBlock` produit la **même structure DOM** dans les deux cas, pour que la substitution ne
déplace rien à l'écran.

**Pas de streaming de tokens.** `Suspense` sert ici à différer puis **substituer un résultat validé**,
pas à montrer l'écriture en direct. Un flux mot à mot afficherait des phrases provisoires et des blocs
incomplets, rendrait la validation avant affichage impossible, et donnerait à un rapport de décision
l'allure d'un chatbot. La conclusion apparaît d'un bloc, complète.

### 6.1 Le prefetch ne doit jamais déclencher une génération

Next 16 précharge les routes liées par `<Link>` avant tout clic. Une génération Sonnet dans un RSC
n'est pas une lecture de données : elle coûte. Deux protections, dans cet ordre d'importance :

1. **Garde serveur** (la vraie) : `ConclusionRedigee` lit `headers()` et rend le déterministe si
   `next-router-prefetch === "1"` (header confirmé présent en 16.2.4). Un `<Link>` oublié ne coûte
   plus rien.
2. **`prefetch={false}`** sur les liens menant au hub payant, en défense de surface.

### 6.2 Le modèle ne produit jamais de provenance

Sortie du LLM réduite au strict minimum :

```ts
type GeneratedBlock = { key: string; text: string };
```

Les `sourceIds` sont **dans le plan** : il n'y a aucune raison de demander au modèle de les recopier,
et donc aucune de le laisser les altérer. Le rendu reconstitue la provenance depuis le plan :

```ts
{ ...planBlock, text: validatedText ?? planBlock.fallbackText }
```

On ne « vérifie pas qu'un sourceId n'est pas inventé » : on rend sa fabrication impossible.

### 6.3 Le schéma de transport est permissif, le contrat est dans le code

```ts
const transportSchema = z.object({
  blocks: z.array(z.object({ key: z.string(), text: z.string() })),
});
```

Si le schéma `generateObject` exigeait strictement les quatre blocs, un seul bloc fautif ferait
échouer **l'objet entier** et détruirait la récupération bloc par bloc. Le vrai contrat est donc
imposé par `validateGeneratedBlocks(plan, generated)`, fonction **pure et testée sans LLM**, qui
rejette un bloc si :

- sa clé n'est pas attendue par le plan, ou apparaît en double ;
- son texte est vide, blanc, ou dépasse `maxChars` ;
- il contient un **nombre, pourcentage, année ou horizon absent du `fallbackText` du bloc** (contrôle
  simple qui attrape une grande part des hallucinations sans prétendre valider le sens) ;
- un bloc obligatoire manque (→ son `fallbackText`) ; un bloc en trop est ignoré et journalisé.

Un bloc rejeté retombe sur **son seul** `fallbackText` : une bonne reformulation du verdict survit à
l'échec du bloc des priorités. Un échec total de l'appel rend le déterministe et se log. Aucune
exception silencieuse.

## 7. L'identité de l'artefact : SHA-256 de la matière réellement envoyée

```ts
const inputHash = sha256(stableStringify({
  contractVersion: DECISION_NARRATIVE_CONTRACT_VERSION,  // schéma de sortie + règles de validation
  promptVersion: DECISION_NARRATIVE_PROMPT_VERSION,
  model: DECISION_NARRATIVE_MODEL,
  locale: "fr-FR",
  plan,                                                   // déjà purgé de tout champ volatil (§4)
}));
```

- **SHA-256, pas FNV-1a.** Le `fnv1a` de `logement-synthesis-cache.ts` reste parfait pour un cache
  léger, mais ici une collision servirait au lecteur **le texte d'un autre plan**. On est côté
  serveur : `node:crypto` ne coûte rien. `stableStringify` est extrait dans `src/lib/stable-hash.ts`
  et partagé ; `fnv1a` reste à sa place, pour ses usages existants.
- **Les versions sont DANS la matière hachée**, pas concaténées après un hash du plan.
- **`contractVersion` est distincte de `promptVersion`** : le schéma de sortie et les règles de
  validation peuvent bouger sans que le prompt change, et il faut alors invalider les artefacts.
- **Sérialisation canonique** : clés triées récursivement, `sourceIds` triés, faits déjà ordonnés par
  le déterministe.
- **Validation à la lecture** : l'artefact trouvé passe le schéma **courant** (`safeParse`) avant
  d'être rendu. Un artefact structurellement périmé est ignoré, jamais affiché.

Ce hash dérivé du plan remplace toute pile de compteurs manuels (`rulesRegistryVersion`,
`dossierSchemaVersion`, `projectVersion`) : le plan contient déjà le produit de tout cela, et un
compteur qu'on oublie d'incrémenter affiche un texte périmé comme s'il était courant.

## 8. La table (`supabase/23_decision_narrative.sql`)

```sql
create table public.decision_narrative (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  insee_code     text not null,
  scope_key      text not null,   -- "commune" | "logement:<logementId>"
  input_hash     text not null,
  blocks         jsonb not null,  -- [{ key, text }]
  prompt_version text not null,
  model          text not null,
  created_at     timestamptz not null default now(),
  unique (user_id, insee_code, scope_key, input_hash)
);

create index decision_narrative_retention_idx
  on public.decision_narrative (user_id, insee_code, scope_key, created_at desc, id desc);
-- RLS own (patron des migrations 17/20).
```

`(user_id, insee)` seul serait une clé trop grossière : un même lecteur, sur une même commune, a un
projet qui évolue, une lecture communale puis une lecture avec adresse, éventuellement plusieurs
adresses. L'identité de l'artefact est le **`input_hash`**, et `scope_key` sépare la commune de chaque
logement. Revenir à un projet antérieur retrouve son texte ; deux adresses ne se marchent pas dessus.

**Artefact durable, pas cache opportuniste** : l'`upsert` est **attendu avant le rendu** (`await`),
parce que futur•e vend un document et que le texte affiché doit être celui qu'on retrouvera. Après une
génération de plusieurs secondes, l'écriture coûte quelques dizaines de millisecondes. Son échec est
journalisé et **n'empêche jamais le rendu**. Deux rendus concurrents peuvent tous deux constater un
cache miss : l'`upsert` est **idempotent** et le conflit sur la contrainte unique est un cas normal,
pas une erreur applicative.

Le pruning (ne garder que les **3 derniers** artefacts par `(user, insee, scope_key)`) et les
métriques partent dans `after()`, en best effort.

## 9. Le prompt

Versionné `DECISION_NARRATIVE_PROMPT_VERSION`, à la manière de `SYNTHESIS_PROMPT_VERSION`. Il reçoit
le plan et **rien d'autre** : ni rapports sources, ni données brutes, ni index commune. Il ne peut donc
réinterpréter aucune donnée.

Cinq invariants, dont quatre sont garantis par la structure et non par la consigne :

1. **Il ne choisit pas ce qui apparaît** — présence et ordre des blocs calculés avant l'appel.
2. **Il ne change pas l'état de conclusion** — il ne peut jamais produire « ce lieu vous correspond »,
   « cette adresse est adaptée », « le projet est compatible ».
3. **Il ne modifie pas la hiérarchie** — contraintes dures non examinées et priorités non couvertes
   ne fusionnent jamais.
4. **Il ne crée aucun fait** — il ne reçoit que libellés, identifiants, rôle, grain, limitation déjà
   décidés, et le `lead`.
5. **Il ne recommande rien** — les actions restent celles des `DecisionFact`. Il peut écrire « trois
   points méritent d'être examinés » ; il ne peut pas inventer « faites réaliser une étude de sol ».

Le seul invariant réellement porté par le texte du prompt est le style ; le contrôle des nombres
(§6.3) attrape le reste. Doctrine maison applicable : pas de tiret cadratin, pas d'antithèse
(« c'est X, pas Y »), l'offre n'est jamais sujet de phrase.

Ce que la génération doit produire, sur le même dossier qu'en §1 :

> « Rien de ce que nous avons examiné ne permet d'écarter ce lieu au regard de ce que vous avez posé
> comme non négociable. Cette conclusion reste toutefois incomplète : votre exigence de proximité de
> la mer n'a pas encore pu être vérifiée à ce grain. Quatre points demandent par ailleurs un regard,
> à commencer par l'étiquette F du logement. La qualité de l'air et l'agriculture, enfin, ne font pas
> encore partie de ce que futur•e sait mesurer. »

Le fond n'a pas changé d'un iota. Les niveaux sont ordonnés, la gravité n'est pas aplatie, les limites
restent visibles.

## 10. Configuration

- **Flag serveur `DOSSIER_NARRATIVE`, OFF par défaut** (doctrine `AUTO_SYNTHESIS` : le défaut sûr est
  « ne dépense pas »). Séquence : livrer → observer les artefacts → activer sur un compte interne →
  revoir des sorties réelles → activer. Le déterministe reste le produit ; l'IA est une couche
  activable.
- **Sonnet 4.6, effort medium, thinking off, température 0.3.** La qualité ne viendra pas d'un
  raisonnement long : elle vient du plan, du schéma, de la validation et des interdictions encodées.

## 11. Tests (`node --test`, aucun LLM)

Plan : ordre des blocs conforme à la hiérarchie ; `reservesCount` = faits affichés et non émis ;
absence de tout champ volatil. `lead` : `single` / `tied` / `none`. Gate : la table de vérité du §5,
ligne par ligne. Validation : clé inconnue, clé en double, bloc obligatoire manquant, bloc en trop,
texte vide ou blanc, dépassement de `maxChars`, nombre absent du `fallbackText`, ordre de réponse
aléatoire → ordre final du plan, échec d'un seul bloc → les trois autres survivent. Hash : modèle
changé → hash différent ; prompt changé → hash différent ; contrat changé → hash différent ;
`observedAt` imbriqué changé → **même hash**. Artefact : schéma courant qui ne passe plus → ignoré ;
deux écritures concurrentes sur la même identité → pas d'erreur applicative.

Rappel du piège maison : `comparateur-vie.ts` fait `import "server-only"`. Toute lib testée en
`node --test` n'en prend que des **types**.

## 12. Fichiers

Neufs : `src/lib/decision/conclusion-plan.ts` (+ test), `src/lib/decision/conclusion-validate.ts`
(+ test), `src/lib/decision/conclusion-hash.ts` (+ test), `src/lib/stable-hash.ts`,
`src/lib/server/decision-narrative-store.ts`, `src/components/report/ConclusionBlock.tsx`,
`src/components/report/ConclusionRedigee.tsx`, `supabase/23_decision_narrative.sql`.
Touchés : `src/lib/decision/decision-assembler.ts` (comptage des réserves affichées),
`src/components/report/DossierDecisionSection.tsx` (le verdict devient `ConclusionBlock`),
`src/app/(account)/rapport/page.tsx` (Suspense), `src/lib/logement-synthesis-cache.ts`
(`stableStringify` importé du module partagé).

## 13. Hors périmètre

Reformulation des `statement` des faits (slice ultérieur, contrat séparé). Élargissement de la
couverture Territoire. Module Santé (le plan narratif l'absorbera sans changement d'architecture : un
fait Santé est un `DecisionFact` de plus, donc une réserve de plus). Streaming de tokens (jamais).
Bouton de régénération (la sortie est bornée, il n'y a rien à retenter à la main).

## 14. Critère de réussite

Sur un dossier riche réel : la conclusion générée dit exactement ce que disait le déterministe, dans
l'ordre de gravité, en se lisant d'un trait. Aucun nombre absent du plan. Aucune recommandation
inventée. Couper le flag ou l'API rend le déterministe sans que le lecteur perde une seule
information. Le gate laisse le déterministe en place sur les dossiers pauvres, et on l'assume.
