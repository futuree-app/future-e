# Software Architect — Modèle d'accès harmonisé (deux rapports : résidence vs exploration)

- **Date** : 2026-06-28
- **Agent** : Software Architect (contre-pouvoir = protège le futur du code)
- **Question-mère** : si le porteur reprend ce code dans 6 mois sans mémoire, comprend-il qui a
  le droit de lire quoi, et peut-il faire évoluer le modèle d'accès sans rejouer cette enquête ?
- **Statut** : évaluation datée. La doctrine cible doit être gravée en ADR (voir « Décision à graver »).

---

## Périmètre

Sous-système : **contrôle d'accès aux rapports** (résidence + territoires explorés).

Fichiers lus :
- `src/lib/access.ts` — capacités dérivées du plan (`PLAN_MATRIX`, `canAccessCompleteReport`, …).
- `src/lib/user-account.ts` — chargement du compte (`report_access` lu en base).
- `src/lib/active-territory.ts` — résolution résidence vs territoire actif + gate grant.
- `src/lib/decision-packs.ts` — `grantDecisionPackFromSnapshot` (le point de fuite).
- `src/app/api/stripe/webhook/route.ts` — pose des entitlements à l'achat.
- `src/app/api/ask/route.ts` — gate AskFuture (plan + grant).
- `src/app/(account)/rapport/{page,quartier/page,logement/page}.tsx` — sites de lecture.
- `src/app/(public)/territoire/[insee]/debloquer/page.tsx` — paywall territoire 14€.
- Migrations `supabase/04_init_accounts.sql`, `12_init_report_grants.sql`,
  `13_init_decision_packs.sql`, `15_pack_mode_choix.sql`.
- ADR-0003 (territoire actif vs résidence), ADR-0004 (stack).

Appelants : les pages `(account)/rapport/*` (RSC) et `api/ask` consomment les gates ; le webhook
Stripe et `grantDecisionPackFromSnapshot` écrivent (service role). RLS : l'utilisateur LIT ses
grants (`report_grants_select_own`), il n'écrit JAMAIS (aucune policy insert) — toutes les
écritures passent par le service role.

---

## Ce qui est sain (à préserver)

1. **`report_grants` indexé par INSEE existe déjà et est le bon modèle.** ADR-0003 l'a déclaré
   source de vérité ; `report_access` y est explicitement nommé « gate V1 transitoire ». La cible
   demandée n'est donc pas un virage, c'est l'achèvement d'une trajectoire déjà décidée.
2. **`resolveActiveTerritory` / `resolveReadableTerritory` sont propres.** La séparation
   résidence (jamais écrasée) vs territoire actif (overlay de lecture) est claire, commentée,
   centralisée. Le repli sur la résidence avec `deniedInsee` pour l'UI est un bon design : on ne
   montre jamais un territoire non payé, on l'explique.
3. **`trioKey` déterministe et robuste à l'ordre.** L'identité d'un pack est stable.
4. **Idempotence des écritures** : tous les `upsert` ont un `onConflict` correct
   (`user_id,insee`, `user_id,trio_key`, `stripe_payment_intent_id`). Rejouer un webhook ne
   duplique rien. C'est le bon réflexe pour un système de paiement.
5. **AskFuture vérifie déjà le grant par INSEE** (l. 588-605) et calcule un quota proportionnel
   aux grants. La porte AskFuture est, elle, déjà sur le bon modèle.
6. **Le staging `pack_snapshots`** (contournement de la limite 500 car. des metadata Stripe) est
   un choix justifié et commenté. À ne pas toucher.

---

## Le diagnostic central : `report_access` est une dénormalisation redondante qui a fui en gate

`report_access` ne porte **aucune information que `plan` ne porte déjà**. Dans `PLAN_MATRIX`,
`report_access` est mécaniquement dérivé de `plan` (`free → partial`, tout le reste → `complete`).
Le webhook et `grantDecisionPackFromSnapshot` écrivent toujours les deux ensemble et cohérents.
Concrètement : `report_access === "complete"` ⇔ `plan !== "free"`. C'est une copie.

Cette copie est devenue un **gate de lecture de la résidence** (`canAccessCompleteReport`), alors
que les territoires explorés, eux, sont gatés par `report_grants`. D'où **deux systèmes d'accès
qui fuient l'un dans l'autre** :

- Résidence → gatée par `report_access` (niveau COMPTE).
- Exploré → gaté par `report_grants` (par INSEE).

La fuite exacte (`decision-packs.ts` l. 128-140) : acheter une **découverte** (Pack) écrit
`report_access = "complete"` au niveau compte → ouvre **aussi** le rapport de la résidence, que
l'acheteur n'a jamais payé. C'est le bug que le porteur a identifié, et il est **structurel** : il
découle de la coexistence des deux gates, pas d'un oubli ponctuel.

---

## 1. Cible : `report_grants` par INSEE comme seule source de vérité — bon modèle ?

**Verdict : OUI, c'est le bon modèle, et il est déjà à moitié en place (ADR-0003).** Le principe :
« peut lire le rapport de la commune X » ⇔ « il existe un `report_grant` pour (user, X) ».
Uniforme pour la résidence ET l'exploration. Cela rend le modèle *racontable en une phrase*, ce
qui est exactement le critère « temps de reprise à 6 mois ».

Ce que ça simplifie : un seul concept à réapprendre (le grant par INSEE), une seule requête pour
juger l'accès, la fuite tuée par construction (un achat ne peut ouvrir que les INSEE qu'il
nomme).

**Angles morts à nommer (ce ne sont pas des blocages, ce sont des décisions à prendre) :**

- **Angle mort #1 — le cycle de vie des grants n'est plus uniforme.** Un grant one-shot (rapport
  14€, Pack) est **permanent** : payé une fois, acquis pour toujours. Mais que se passe-t-il pour
  un abonné **Le Fil / Foyer** ? Aujourd'hui `suivi`/`foyer` = `report_access=complete` = tout
  ouvert. Dans le modèle cible, lire un rapport exige un grant. Donc s'abonner doit **auto-créer
  un grant** (au moins sur la résidence). Et là, le cycle de vie diverge : faut-il **révoquer** ce
  grant si l'abonnement est résilié (`status=canceled`) ? Un grant one-shot ne se révoque jamais ;
  un grant adossé à un abonnement, logiquement, oui. **C'est l'angle mort principal.** Le modèle
  doit distinguer deux natures de grant (permanent vs conditionné à l'abonnement) — soit par la
  colonne `source` + une logique de révocation, soit en gardant l'abonnement comme un gate
  *additif* (plan) au-dessus des grants. Recommandation : ne pas révoquer en V1 (simplicité solo,
  un abonné résilié qui garde la lecture de SA résidence n'est pas un trou de revenu grave), mais
  **graver explicitement ce choix** sinon il sera réinventé dans 6 mois.

- **Angle mort #2 — `plan` reste nécessaire pour les capacités NON-rapport.** Dashboard, Le Fil,
  notifications, mode Foyer, et **l'entitlement AskFuture** (free bloqué) restent gouvernés par
  `plan`. Retirer `report_access` ne doit PAS toucher `plan` ni `dashboard_access`. La cible n'est
  donc pas « tout par grant », c'est : **rapports par grant, capacités de service par plan.** Deux
  axes orthogonaux et clairs. C'est plus sain que le mélange actuel.

- **Angle mort #3 — résidence sans grant.** Un compte gratuit qui a fait le wizard a une
  résidence (`home_insee_code`) mais aucun grant → il voit le teaser/partiel. Correct et voulu
  (la résidence est « recommandée mais OPTIONNELLE », donc payante comme le reste). Mais il faut
  que **poser sa résidence (wizard « ma commune ») crée un grant** au moment où elle est payée /
  débloquée, sinon le wizard ne donne accès à rien. Voir Q2/Q4 (nouveau chemin d'écriture).

- **Angle mort #4 — `canAccessSavedReport`** mélange `plan === "free"` OR `report_access`. Sa
  sémantique (« le gratuit peut voir le rapport sauvegardé partiel ») doit être réexprimée en
  termes de grant/teaser, pas supprimée à l'aveugle.

---

## 2. État cible de `grantDecisionPackFromSnapshot` et de chaque achat

Règle d'octroi cible, par chemin d'achat :

| Achat | Grant(s) créé(s) | Touche le plan ? | JAMAIS |
|---|---|---|---|
| Wizard « ma commune » / débloquer résidence | grant sur `home_insee_code`, `source='residence'` | élève free→one_shot si besoin | — |
| `/territoire/[insee]/debloquer` | grant sur cet INSEE, `source='comparateur_vie'`/`direct` | élève free→one_shot | la résidence |
| Pack Décision | grants sur les 2-3 INSEE explorés, `source='pack_decision'` | élève free→one_shot | **la résidence** |
| Abonnement Le Fil / Foyer | grant sur résidence (`source='subscription'`) | plan=suivi/foyer | — |

**`grantDecisionPackFromSnapshot` cible :**

- **GARDER** : upsert `decision_packs` ; upsert des `report_grants` pour les 2-3 INSEE réels
  (déjà fait, l. 106-122). C'est le cœur, c'est juste.
- **RETIRER** : le bloc l. 124-140 qui écrit `report_access = "complete"` au niveau compte. C'est
  la fuite.
- **REMPLACER, ne pas simplement supprimer** : l'acheteur free doit quand même obtenir
  l'entitlement AskFuture (plan ≠ free) et le dashboard read_only. Donc conserver une élévation de
  plan, mais **gardée** : ne bumper `plan` vers `one_shot` QUE si le plan courant est `free`.
  L'upsert inconditionnel actuel `plan=one_shot` est d'ailleurs un **bug latent existant** : un
  abonné Le Fil/Foyer qui achète un Pack serait **rétrogradé** à `one_shot`. À corriger en même
  temps (lire le plan courant, n'élever que depuis `free`, ne jamais redescendre).

Conséquence : une fois `report_access` retiré du gate de lecture, même si on laissait `plan=one_shot`
en place, la résidence resterait fermée (elle n'a pas de grant). Le modèle devient **robuste par
construction** : il n'existe plus aucun chemin où acheter X ouvre Y.

---

## 3. Re-câblage des gates

**Lecture d'un rapport (toute page `(account)/rapport/*`) :**

- Aujourd'hui : `fullReport = canAccessCompleteReport(account)` (compte) + `resolveReadableTerritory`
  (territoire). Deux notions empilées.
- Cible : un seul prédicat `canReadTerritory(supabase, userId, insee)` = « il existe un grant pour
  (userId, insee) ». `resolveReadableTerritory` l'applique déjà pour le territoire actif ≠
  résidence ; il faut **l'étendre à la résidence** (retirer le court-circuit l. 95-97 qui laisse
  passer la résidence sans vérif). Le `fullReport` des pages devient `canReadTerritory(inseeCode)`
  au lieu de `canAccessCompleteReport(account)`. La lecture devient **par territoire consulté**,
  ce qui est plus correct : un user peut avoir le grant de la commune A mais pas de sa résidence.
- `quartier/page.tsx` et `logement/page.tsx` : le `if (!canAccessCompleteReport) redirect("/rapport")`
  devient `if (!canReadTerritory(inseeCode)) redirect("/rapport")` (ou affichage teaser selon la
  doctrine produit). Le hub `/rapport` reste le point de repli qui montre la première lecture
  gratuite.

**AskFuture (`api/ask`) :**

- **Garder** le check `plan === "free" → 403` : AskFuture est un entitlement de service, pas un
  rapport. Un free n'y a pas droit même s'il a un grant offert. (À confirmer côté produit, mais
  c'est la sémantique actuelle.)
- **Garder** le check grant par INSEE (l. 588-605), mais **retirer l'exception résidence**
  (`if askInsee !== residenceInsee`). Dans le modèle cible la résidence aussi exige un grant :
  un free ayant juste rempli le wizard mais jamais payé ne doit pas pouvoir interroger AskFuture
  sur sa résidence. Le check devient uniforme : grant sur `askInsee`, point.
- Quota `3 * max(1, grantCount)` : le plancher `max(1,…)` devient défensif/mort une fois la
  résidence toujours grantée. À laisser (coût nul, ceinture+bretelles) ou nettoyer.

Résultat : **un seul prédicat de lecture** (`canReadTerritory(insee)`) partagé par les pages ET
AskFuture. C'est la simplification qui paie le plus en temps de reprise : il n'y a plus à se
demander « ce code regarde-t-il le compte ou le grant ? ».

---

## 4. Migration / backfill

**Problème** : des utilisateurs existants ont `report_access='complete'` (ils ont payé) mais
peut-être **aucun grant sur leur résidence** (avant que les grants n'existent, l'accès résidence
ne passait QUE par `report_access`). Retirer `report_access` comme gate **leur couperait l'accès**
sans backfill.

**Backfill (migration SQL `supabase/16_...sql`, non destructive) :**

```
insert into public.report_grants (user_id, insee, commune, source)
select p.user_id, p.home_insee_code, p.home_commune, 'residence'
from public.user_profiles p
join public.user_accounts a on a.user_id = p.user_id
where a.report_access = 'complete'          -- a payé sous l'ancien modèle
  and p.home_insee_code is not null
on conflict (user_id, insee) do nothing;    -- idempotent
```

- **Idempotence** : `on conflict (user_id, insee) do nothing` (l'unique existe déjà). Rejouable.
- **Élargir le CHECK `source`** d'abord : `12_init_report_grants.sql` contraint
  `source in ('direct','comparateur_vie','pack_decision')`. Il faut ajouter `'residence'` (et
  `'subscription'` si on auto-grante les abonnés) AVANT le backfill, sinon il échoue.
- **RLS** : la migration tourne en service role → bypass RLS, OK. Mais attention au **nouveau
  chemin d'écriture** : le wizard « ma commune » devra créer un grant. `report_grants` n'a
  **aucune policy insert** (volontaire : écritures service role only). Donc le wizard ne peut PAS
  insérer côté client. Il faut router cette création par un **server action / route handler** qui
  utilise le client admin (comme le webhook). Ne pas être tenté d'ajouter une policy insert client
  — ce serait un trou (un user pourrait s'auto-grant n'importe quelle commune gratuitement).
- **Edge case à signaler au porteur** : un compte `complete` sans `home_insee_code` (a payé,
  jamais posé de résidence) ne reçoit aucun grant de backfill. Il n'a rien à lire de toute façon ;
  le grant naîtra quand il posera sa résidence. Acceptable, mais à connaître.
- **Ne PAS dropper la colonne `report_access`** dans la même migration. La laisser en place
  (dépréciée, commentée) : migration réversible, et si un site de lecture oublié la lit encore, on
  s'en aperçoit sans casse. Drop dans une migration ultérieure, une fois `report_access` retiré du
  code TypeScript et le modèle éprouvé en prod. C'est la prudence solo : une étape = un risque.

---

## 5. Vocabulaire de code

**La confusion à nommer** : le code mélange deux axes (capacité de service vs droit de lecture
d'un territoire) sous des noms qui se ressemblent, et deux gates qui font le même travail.

| Terme actuel | Problème | Cible |
|---|---|---|
| `report_access` (`complete`/`partial`) | dénormalisation de `plan`, fuit en gate résidence | **déprécié puis supprimé** du modèle d'accès |
| `canAccessCompleteReport(account)` | nom dit « complet » mais c'est un gate compte ; ment sur la granularité réelle (par territoire) | `canReadTerritory(userId, insee)` |
| `canAccessSavedReport` | logique `free OR complete` opaque | réexprimer en `hasGrant` / `isTeaser(insee)` |
| `report_grants` | bon | **garder** = la seule source de vérité de lecture |
| `home_insee_code` / résidence | bon (pitfall documenté) | garder, ne jamais renommer |
| `active_insee_code` / territoire actif | bon, bien isolé | garder |
| `grant.source` | valeurs OK mais incomplètes pour les 2 intentions | ajouter `'residence'` (+ `'subscription'` si besoin) |
| `quartier` (id, route, `workbook_quartier`, tracking, `terrain_observations`) | **NE PAS RENOMMER** : casse tracking + terrain_observations (cf. project_modules) | gelé |
| produit `rapport-complet` (checkout/Stripe) | id de produit, contrat externe | gelé |

**Vocabulaire cible aligné sur les deux intentions** : un **grant** = « accès débloqué à un
territoire (INSEE) ». Les deux rapports ne sont **pas deux mécanismes**, ce sont **deux `source`
du même grant** : `source='residence'` (rapport de ma commune) vs
`source IN ('comparateur_vie','pack_decision','direct')` (rapport d'exploration). Le mécanisme est
unique, l'intention est portée par `source`. C'est ce qui permet de raconter le système en une
phrase dans 6 mois : *« on lit une commune si on a un grant dessus ; d'où vient le grant ne change
rien au droit de lire, seulement à l'histoire de l'achat. »* Les capacités de service (dashboard,
Le Fil, Foyer, AskFuture) restent un axe séparé porté par `plan`.

---

## Ce que cette architecture rend FACILE / DIFFICILE à changer

**FACILE (le modèle cible accueille bien) :**
- **Multi-territoires** : un user qui débloque 5, 10 communes — déjà natif (grants par INSEE).
- **Tarifer un nouveau type de déblocage** : il suffit d'une nouvelle valeur `source` + un chemin
  d'écriture service-role. Le code de lecture ne bouge pas.
- **Auditer « qui peut lire quoi »** : une seule table, une seule requête. Support et debug
  simplifiés.
- **Changer le prix / le packaging** sans toucher l'accès (l'accès ne connaît pas le prix).

**DIFFICILE (à connaître avant de s'y engager) :**
- **Révoquer un accès** (abonnement résilié, remboursement) : aujourd'hui un grant ne se révoque
  jamais. Introduire la révocation demandera d'ajouter un cycle de vie (date d'expiration ou
  suppression conditionnée au statut d'abonnement). Pas bloquant tant qu'on ne vend pas d'accès
  *temporaire*, mais c'est le mur le plus proche.
- **Accès à granularité plus fine que la commune** (un module payé séparément, ex. Logement seul
  sur une commune) : le grant est par INSEE, pas par (INSEE × module). Le jour où un module se
  vend à l'unité, il faudra un axe supplémentaire. Voir paris.
- **Accès partagé / Foyer multi-personnes** : les grants sont par `user_id`. Partager les rapports
  entre membres d'un foyer demandera de grant-er au niveau household ou de dupliquer les grants.

---

## Les paris de l'architecture et leurs seuils de bascule

1. **Pari : « la commune (INSEE) est la bonne granularité d'accès. »**
   - Seuil de bascule : le jour où un **module se vend séparément** (Logement seul, Santé seul)
     OU où l'accès se vend à l'**adresse** (sub-communal). Alors `report_grants(user, insee)`
     devient `report_grants(user, insee, scope)`. Migration additive (colonne `scope` nullable,
     défaut = commune entière), donc gérable, mais à anticiper.
2. **Pari : « un accès payé est définitif (jamais révoqué). »**
   - Seuil : première vente d'**abonnement comme condition de lecture** (Le Fil donne accès tant
     qu'on paie), ou premier **remboursement** à honorer. Au-delà, il faut un cycle de vie de
     grant (expiration / révocation liée à `status`). En V1, on parie que les grants
     abonnement-dérivés ne sont pas révoqués — choix à graver.
3. **Pari : « `plan` et `grants` sont deux axes orthogonaux. »** Plan = capacités de service,
   grants = lecture de territoires.
   - Seuil : si un jour un plan doit **impliquer automatiquement** un ensemble dynamique de grants
     (ex. « Le Fil National » = lecture de toutes les communes), l'orthogonalité casse et il faut
     un grant « wildcard » ou une logique de dérivation plan→grants. Le `max(1, grantCount)` du
     quota AskFuture est déjà un petit symptôme de couplage à surveiller.
4. **Pari : « toute écriture de grant passe par le service role. »** Sécurité forte (un user ne
   s'auto-grant pas).
   - Seuil : si le besoin de créer des grants côté client apparaît (ex. essai gratuit
     self-service), il faudra une policy insert très contrainte ou une RPC `security definer`. Ne
     pas céder à la facilité d'une policy insert ouverte.

---

## Verdict : DETTE À TRAITER (subie, structurelle), avec une cible déjà à moitié construite

La dette est **subie** (la coexistence des deux gates n'a jamais été un choix assumé, c'était un
état transitoire V1 qui a fui) et elle se **paie deux fois** : une fois en revenu (la résidence
offerte à l'achat d'un Pack), une fois en temps de reprise (deux systèmes d'accès à réapprendre, un
qui contredit l'autre). Le porteur a raison de vouloir l'assainir AVANT de construire les 6
modules dessus — chaque module ajouté sur le modèle bicéphale double le coût du futur démêlage.

Ce n'est PAS une refonte : `report_grants` existe, est correct, et ADR-0003 a déjà tranché la
direction. C'est un **achèvement** + un **retrait** (`report_access`).

Hiérarchie de ce qui compte :
1. **Urgent / structurel** : tuer la fuite (`decision-packs.ts` l. 124-140) + corriger le bug
   latent de rétrogradation de plan.
2. **Cœur de l'harmonisation** : résidence gatée par grant (resolveReadableTerritory + api/ask) +
   backfill.
3. **Polissage** : retrait de `report_access` du type system, renommage `canReadTerritory`, drop
   de colonne (plus tard).

---

## Version minimale (≈90 % de la valeur)

Trois changements bornés, dans cet ordre :

1. **Tuer la fuite** : dans `grantDecisionPackFromSnapshot`, retirer l'écriture
   `report_access='complete'` (l. 124-140), garder une élévation de plan **gardée** (free→one_shot
   seulement, jamais de rétrogradation). ~15 lignes. Corrige le bug à lui seul.
2. **Harmoniser la lecture** : étendre `resolveReadableTerritory` pour exiger un grant aussi sur
   la résidence, et retirer l'exception résidence dans `api/ask`. Remplacer
   `canAccessCompleteReport(account)` par `canReadTerritory(insee)` dans les 3 pages rapport.
3. **Backfill** : migration `16_...sql` (élargir CHECK `source`, insérer un grant `residence`
   pour tout compte `complete` ayant un `home_insee_code`, `on conflict do nothing`).

Le retrait complet de `report_access` du TypeScript et le drop de colonne sont du **polish
différable** : ils ne changent pas le comportement une fois 1-3 faits, et les faire plus tard
réduit le risque par étape. NE PAS franchir vers l'implémentation des 6 modules ni vers le cycle
de vie de révocation dans ce lot.

---

## Cohérence (tensions posées, non tranchées)

- **AskFuture pour un free avec grant offert** : la cible garde `plan=free → 403`. Si un jour la
  résidence est offerte (grant sans paiement) mais qu'on veut quand même réserver AskFuture aux
  payants, la sémantique « grant ≠ AskFuture » tient. À confirmer côté produit.
- **Grant abonnement-dérivé révocable ou non** : tension entre simplicité solo (ne pas révoquer)
  et justesse business (un résilié garde la lecture). Je pose, le porteur tranche. Recommandation
  archi : ne pas révoquer en V1, mais le graver.

## Décision à graver (prêt pour ADR)

> **Addendum ADR-0003** : `report_grants` (par INSEE) est l'**unique** source de vérité du droit de
> lire un rapport, pour la résidence comme pour les territoires explorés. `report_access` est
> retiré comme gate (déprécié, puis colonne supprimée). `plan` gouverne les **capacités de
> service** (dashboard, Le Fil, Foyer, entitlement AskFuture), axe orthogonal aux grants. Les deux
> intentions « rapport de ma commune » et « rapport d'exploration » sont le **même mécanisme**
> distingué par `report_grants.source` (`residence` vs exploration). Choix V1 assumé : les grants
> ne sont pas révoqués (pas d'accès temporaire). Toute écriture de grant passe par le service role.

---

## Limites de mon regard (ce run)

- **Je n'ai pas exécuté le code ni rejoué un achat Stripe réel.** Mon raisonnement sur la fuite
  est lu sur pièces (decision-packs.ts l. 135 + chaîne de lecture), pas observé en prod.
- **Je n'ai pas lu tous les sites de lecture** : j'ai grepé `rapport/{page,quartier,logement}` et
  `api/ask`. D'autres consommateurs de `canAccessCompleteReport` / `report_access` peuvent exister
  (dashboard, compte, emails, composants) — à grep exhaustivement avant le retrait du type
  (`rg "report_access|canAccessCompleteReport|canAccessSavedReport"`).
- **Je n'ai pas vérifié le volume réel d'utilisateurs `complete` sans grant résidence** : le
  backfill est conçu défensivement, mais le risque concret dépend de combien de comptes payants
  existent aujourd'hui (probablement faible, projet pré-lancement — ce qui rend la migration peu
  risquée).
- **Je n'ai pas eu besoin de consulter `node_modules/next/dist/docs/`** : aucun usage d'API
  Next.js spécifique n'est en jugement ici (RSC data-fetching, route handlers et `force-dynamic`
  sont standards). Le sujet est purement modèle de données + gates applicatifs. Si l'implémentation
  introduit des server actions pour l'écriture de grants, vérifier la doc installée à ce
  moment-là.
- **Je n'ai pas tranché les questions produit** (AskFuture offert, révocation) : hors de ma
  lentille, posées au porteur.

## Quand rouvrir ce sujet ?

- **Premier module vendu à l'unité** ou **premier accès sub-communal** → rouvrir le pari de
  granularité (colonne `scope`).
- **Premier remboursement à honorer** ou **décision de couper la lecture aux résiliés** → rouvrir
  le pari « grant définitif » (cycle de vie / expiration).
- **Mode Foyer activé pour de vrai** (partage entre membres) → rouvrir « grant par user_id ».
- **Un plan qui implique un set dynamique de grants** (offre « toutes communes ») → rouvrir
  l'orthogonalité plan/grants.
- Signal de dette : si un nouveau site de lecture réintroduit un check `report_access`, c'est que
  le retrait du type system n'a pas été mené à terme — finir le polish.
