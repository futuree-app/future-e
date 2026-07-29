# `address_dossiers` : le dossier devient un objet, et le droit descend à l'échelle du bien

- **Date** : 2026-07-29
- **Statut** : conception validée, non implémentée
- **Origine** : `docs/handoff/CURRENT.md` §4 et §5, rapport
  `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md`
- **Ne couvre pas** : la route de qualification, le calcul du prix, la création du dossier par le
  webhook Stripe, la page de succès. Voir « Frontière » plus bas.

---

## Le problème, en deux défauts qui n'en font qu'un

**Défaut 1, le grain du droit.** `canAccessCompleteReport(account)` est un flag de **plan global** :
il ne dit pas quelle commune a été payée. `report_grants` déverrouille une **commune**. Il n'existe
aucune notion de droit par bien. Deux conséquences aujourd'hui : un acheteur ouvre Autour et Logement
pour n'importe quelle adresse d'une commune débloquée, et surtout, `resolveReadableTerritory()` ne
contrôle aucun grant quand on lit sa résidence, donc **un achat quelconque ouvre le Territoire complet
de la commune de résidence**, jamais achetée.

**Défaut 2, l'écrasement.** La clé primaire est `(user_id, logement_id)` avec `logement_id = ban_id`.
Or `PreciseLogementStep` existe précisément parce que plusieurs logements partagent une adresse BAN
(« quand plusieurs diagnostics existent à l'adresse, on demande LEQUEL est le bon »). Un lecteur qui
analyse l'appartement du 2ᵉ étage puis celui du 4ᵉ **écrase le premier** : même ligne, même snapshot,
choix de DPE remplacé. C'est gratuit aujourd'hui, c'est une réclamation le jour où chaque dossier
coûte 39 €.

Les deux défauts sont le même : le grain déclaré du produit (un bien) et le grain du schéma (un plan,
une commune, un point postal) ne disent pas la même chose.

---

## Doctrine

**Un dossier est l'analyse d'un bien situé à une adresse.** Cette formulation remplace partout
« un dossier = une adresse », qui est sémantiquement fausse : une adresse BAN contient plusieurs
logements, et c'est la raison d'être de l'écran de précision.

Au moment où le dossier naît, le bien peut n'être que partiellement identifié. Le dossier existe
d'abord ; son attribution se précise ensuite (choix du DPE). L'identité du dossier ne dépend donc
jamais du diagnostic.

---

## Schéma

`public.logement` devient `public.address_dossiers`.

| Colonne | Rôle |
|---|---|
| `id uuid primary key default gen_random_uuid()` | **L'identité.** Stable avant le choix du DPE, quand aucun DPE n'existe, si le choix est corrigé, et si deux biens partagent un `ban_id`. |
| `ban_id text not null` (ex-`logement_id`) | Le point postal. **Indexé, jamais unique**, ni seul ni avec `user_id`. |
| `user_id`, `insee`, `address_label`, `city`, `postcode`, `latitude`, `longitude`, `parcel_code` | Identité de l'adresse, inchangées. |
| `posture`, `snapshot`, `dpe_selection_status`, `selected_dpe_*`, `synthesis_*`, `updated_at` | L'artefact, inchangé. |
| `stripe_payment_intent_id text unique` | **Provenance**, écrite par le service role. Un index unique Postgres accepte plusieurs `NULL`, donc les dossiers administratifs coexistent. |
| `amount_paid_cents int`, `purchased_at timestamptz` | Provenance, service role. |

**Aucune unicité sur `(user_id, ban_id)`** : deux appartements du même immeuble sont deux dossiers
légitimes. Le doublon involontaire se traite en interface (voir « Le panneau de choix »), jamais par
une impossibilité inscrite dans la clé.

**Colonnes explicitement refusées** :
- `dwelling_discriminator` : aucun écrivain, aucun lecteur. S'ajoutera le jour où un écran demande
  l'étage. Le handoff nomme ce piège (`irisScope`, `part_deplacements_motorises`).
- `status` à états multiples : dupliquerait `dpe_selection_status` et la présence de
  `synthesis_text`. Deux vérités qui divergent est exactement la classe de défaut traquée le 29/07.
- `entitlement_status` : voir « Le droit est la ligne ». Une colonne de droit dans une table que le
  client peut écrire est un self-service de droits.
- `territory_credit_payment_id` : la remise n'est pas un crédit consommable, c'est un état calculé.
  Voir « Tarif ».
- `access_source` : `stripe_payment_intent_id IS NULL` suffit tant que les dossiers administratifs
  ne naissent pas en production. À ajouter le jour où ce ne sera plus vrai.

---

## Le droit est la ligne

**L'existence d'une ligne `address_dossiers` appartenant à l'utilisateur EST le droit d'ouvrir ce
dossier.** Il n'y a pas de seconde table de droits pour le bien. Les colonnes de paiement documentent
la **provenance** du droit, elles ne le définissent pas : sinon un dossier créé pour les tests
n'ouvrirait rien sans fabriquer un faux paiement.

```
Ligne existante + user_id propriétaire   → accès au dossier
stripe_payment_intent_id renseigné       → dossier acheté
stripe_payment_intent_id NULL            → dossier administratif (tests, démonstration)
```

`report_grants` reste **strictement territorial** et n'est pas modifié. Aucun `dossier_id` nullable
n'y est ajouté : ce serait une table polymorphe dont le nom ne décrirait plus le contenu, avec des
règles d'unicité divergentes selon la ligne.

### Les lectures

```
Territoire complet sur INSEE = report_grant sur cette commune
                             OU un dossier accessible dans cette commune
Autour / Logement            = le dossier précis
```

- `canAccessCompleteReport()` **cesse d'être un verrou de lecture**. Le flag de plan ne déverrouille
  plus ni Territoire, ni Autour, ni Logement.
- `canAnalyzeCommune()` **disparaît** avec le droit communal qu'elle relayait.
- `canAccessTerritory(userId, insee)` la remplace : un grant, ou un dossier dans cette commune.
- La **résidence n'ouvre plus rien par elle-même**. Elle garde son rôle de commune affichée par
  défaut. Un compte gratuit voit le rapport partiel de sa commune, comme partout ailleurs.

Un dossier acheté ne crée **pas** de `report_grant` dérivé. Le droit territorial se déduit de
l'existence du dossier, ce qui le fait disparaître proprement si le dossier est révoqué, sans laisser
un grant orphelin derrière lui.

**Piège PLM** : la comparaison de communes passe par `communeParent()` des deux côtés
(`src/lib/plm.ts`). Une adresse lyonnaise est géocodée sur l'arrondissement (`691xx`), la commune est
stockée sur `69123`.

### Qui écrit, et comment

**Aucun `INSERT` ni `UPDATE` direct pour `authenticated`.** Les policies `insert_own` et `update_own`
de `supabase/17_logement.sql` sont supprimées et les privilèges révoqués. `select_own` est conservée.

Motif : les trois routes qui écrivent aujourd'hui (`logement-artefact`, `logement-dpe`,
`logement-autour`) passent toutes par le client utilisateur, donc par la RLS. Laisser ces policies
permettrait à un acheteur de créer son propre dossier, et de réécrire directement `snapshot`,
`synthesis_text` ou `synthesis_fact_hash` via PostgREST. Le dernier est le plus coûteux : il gouverne
la régénération de la synthèse, donc des appels LLM facturés.

Un `GRANT UPDATE` colonne par colonne protégerait le droit sans protéger l'intégrité du rapport, et
demanderait la même vigilance à chaque colonne ajoutée. On passe donc par le serveur, avec un helper
unique :

```ts
requireOwnedAddressDossier(dossierId)
// authentifie, vérifie la propriété, retourne le client service role
// toute écriture cible id = dossierId AND user_id = currentUser.id
```

Les trois routes passent par lui, et par lui seul. `selected_dpe_id` n'est jamais accepté
aveuglément : la route vérifie que le diagnostic figure parmi les candidats retrouvés pour l'adresse.

### Qui crée

Deux créateurs, et deux seulement :

1. **Le webhook Stripe**, en service role, après paiement (spec suivante).
2. **`POST /api/admin/dossier`**, réservée aux adresses listées dans `FUTUREE_ADMIN_EMAILS`,
   vérifiées contre l'e-mail de la session. Elle crée la ligne en service role avec
   `stripe_payment_intent_id` à `NULL`, exactement comme le webhook la créera. `DELETE` sur la même
   route pour nettoyer. Un bouton visible pour ce seul compte, sur l'écran de saisie d'adresse.

**Ce créateur privilégié ne contourne aucun contrôle d'accès.** `canAccessTerritory` et la lecture
des dossiers ignorent totalement l'existence d'un compte de service. Une variable d'environnement mal
configurée ne peut donc pas ouvrir le produit à tout le monde ; au pire, quelqu'un se crée des
dossiers vides à lui-même. C'est ce qui distingue un créateur privilégié, dont le pire effet est
borné, d'une exception dans le contrôle d'accès, qui fuit en silence.

Le porteur parcourt ainsi **le même chemin que n'importe quel acheteur** après la création : la course
webhook mise à part, il verra le panneau de choix, les refus, les états dégradés.

`upsertLogementAddress()` **disparaît**. Elle avait été écrite le 29/07 pour combler la disparition du
créateur implicite (l'ancienne route « autour ») ; le webhook prend ce rôle. Le client ne doit jamais
créer une ligne en secours, sinon le créateur implicite revient par la fenêtre.

**Les dossiers à `stripe_payment_intent_id` nul sont exclus de tout comptage de chiffre d'affaires et
du taux de deuxième dossier**, sinon les tests du porteur polluent la mesure.

---

## Le panneau de choix

Quand un lecteur soumet une adresse pour laquelle il possède déjà un ou plusieurs dossiers, on ne
décide pas à sa place.

```
Vous avez déjà un dossier à cette adresse

Appartement · DPE D · créé le 18 juillet
[Rouvrir]

Vous analysez un autre bien dans cet immeuble ?
[Créer un nouveau dossier · <prix calculé>]
```

Le prix affiché sur ce bouton est **toujours calculé**, jamais écrit en dur : un lecteur qui possède
déjà un dossier ici possède le territoire de cette commune, donc il voit le tarif d'approfondissement.
Écrire 39 € dans ce bouton contredirait la règle de tarif.

Chaque dossier est affiché avec de quoi le reconnaître : date de création, DPE sélectionné quand il
existe, surface et année quand la donnée est là, sinon « logement à préciser ». La réouverture est
gratuite et visuellement dominante ; la création d'un nouveau dossier est explicitement payante.

Motif du refus de l'ouverture automatique : quelqu'un qui saisit volontairement la même adresse pour
un autre appartement atterrirait dans l'ancien dossier et ne s'en apercevrait qu'après avoir changé
son DPE ou régénéré sa synthèse.

**Conséquence sur le repli par défaut** : `getLatestLogement()` (tri par `updated_at`) ne s'applique
que s'il existe **exactement un** dossier. Au-delà, on n'ouvre rien et on affiche le panneau.
`updated_at` bouge à chaque écriture technique (synthèse, posture, rehydratation), donc le dossier le
plus récemment modifié n'est pas nécessairement celui qu'on voulait rouvrir. Aucune colonne
`last_opened_at` n'est ajoutée : le cas ambigu produit une question, pas une supposition.

**URL** : `?logementId=` devient `?dossierId=<uuid>`, sans compatibilité. Ces pages sont derrière le
paywall, en `force-dynamic`, non indexées, aucun acheteur n'existe, et le seul émetteur de lien est
`rapport/page.tsx:77`. Garder l'ancien nom le ferait désigner successivement un `ban_id` puis un
uuid, pour un logement qui peut encore ne pas être identifié.

---

## Tarif : ce qui est décidé ici, et ce qui ne l'est pas

Le calcul du prix appartient à la spec suivante. Ce qui est gravé ici, parce que ça détermine les
fonctions de lecture :

- **La remise est un état, jamais un crédit consommable.** `hasPaidTerritory(userId, insee)` répond à
  la lecture, ne stocke rien, ne se consomme pas. Tous les biens d'une commune déjà payée bénéficient
  du tarif d'approfondissement, pas seulement le premier.
- Elle est vraie pour : un paiement direct de 14 € sur cette commune, un `report_grant` de source
  `pack_decision`, un dossier antérieur dans cette commune.
- Elle est **fausse pour la seule résidence** : un accès offert n'est pas une acquisition. Sinon
  `home_insee_code`, qui est déclaratif, deviendrait un bon de réduction.
- Elle ne se calcule **jamais** sur la simple existence d'un `report_grant` sans regarder ce qui a été
  encaissé.

### Renversement assumé, à ne pas re-litiger

Le business-strategist recommandait le **deuxième dossier à plein tarif**, pour ne pas brouiller la
mesure de la disposition à repayer. Cette spec retient le tarif d'approfondissement pour tous les
biens d'une commune déjà payée. Motif : revendre le tiers d'un ensemble que le compte possède déjà
est un fait que futur•e connaîtrait au moment de l'encaisser, et l'invariant n°1 passe avant la
propreté de la mesure. La mesure survit, à un prix plus bas.

**Une session qui relira le rapport de l'agent y trouvera la recommandation inverse. Elle est
sciemment écartée.**

---

## Frontière

| Dans cette spec | Dans la suivante |
|---|---|
| Le schéma et la migration | La route publique de qualification |
| Les droits, les privilèges, le helper d'écriture | Le calcul du prix (39 € / tarif d'approfondissement) |
| Les fonctions de lecture | La création du dossier par le webhook |
| Le panneau de choix | La page de succès qui attend le webhook |
| Le créateur administratif | L'instrumentation (six événements, `decision_journey_id`) |

**Ce que ça casse pendant l'intervalle, et c'est assumé** : entre cette migration et la spec
checkout, personne n'ouvre Autour ni Logement par l'application, puisque aucun dossier n'existe et
que le flag global ne déverrouille plus rien. Le créateur administratif est le seul chemin. Sans
conséquence, aucun compte n'a payé, et le nouveau chemin faux devient visible immédiatement plutôt
qu'au premier achat.

---

## Migration `supabase/25_address_dossiers.sql`

1. **Purge des lignes de test** de `logement`. Aucune ne correspond à un achat. Les garder rendrait
   `stripe_payment_intent_id IS NULL` ambigu entre « dossier administratif » et « résidu ».
2. `alter table logement rename to address_dossiers`.
3. `logement_id` renommé `ban_id` ; la clé primaire tombe ; `id uuid primary key default
   gen_random_uuid()` la remplace ; index sur `(user_id, ban_id)`, **sans unicité**.
4. Colonnes de provenance : `stripe_payment_intent_id text unique`, `amount_paid_cents int`,
   `purchased_at timestamptz`.
5. Policies : `insert_own` et `update_own` supprimées, `select_own` conservée,
   `revoke insert, update on address_dossiers from authenticated`.

Ordre du code, par dépendance : `logement-store.ts` → `address-dossier-store.ts` ;
`requireOwnedAddressDossier` ; les trois routes d'écriture ; `access.ts` et `active-territory.ts` ;
les pages et le panneau de choix ; la route administrative.

---

## Tests

Le handoff §6 reproche aux anciens tests d'éprouver notre logique contre nos propres chaînes. Ceux-ci
visent des faits :

- **Deux dossiers sur le même `ban_id`** pour le même compte coexistent, chacun avec son DPE, et
  l'écriture de l'un ne touche pas l'autre. C'est le test du défaut §5.
- **Un client authentifié ne peut ni insérer une ligne, ni mettre à jour une colonne**, éprouvé
  **contre la base réelle avec un JWT utilisateur**. Un mock de notre propre logique ne dirait rien
  d'une policy.
- `hasPaidTerritory` répond **faux** pour la seule résidence, **vrai** pour un `pack_decision`, et
  **vrai** pour un dossier antérieur dans la commune.
- Deux insertions portant le même `stripe_payment_intent_id` n'en produisent qu'une. C'est le filet
  que la disparition de `unique (user_id, insee)` retire : le webhook n'a **aucune idempotence
  propre**, toute sa protection contre un événement rejoué vient des contraintes de table
  (`webhook/route.ts:59-134`).
- Le repli par défaut n'ouvre rien quand deux dossiers existent.

**Piège** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore. Un lint vert ne
dit rien de ces fichiers.

---

## Pièges à connaître

- **Deux sessions dans le même arbre de travail** : stager par chemin, jamais `git add -A`.
- Le hook de pre-commit lance `index:verify`. Push direct sur `main`, pas de PR.
- Un commentaire JSX `{/* … */}` dans un ternaire y met deux enfants et casse le build.
- Les modules importent `server-only` : un test lancé par `node --test` sur un fichier qui en dépend
  échoue à l'import.
