# Passation : 29/07/2026, soirée

**Horodatage** : 2026-07-29, ~20h15 · **Branche** : `main` = `cb3fc79`, **tout est poussé**.
**Migration appliquée en production ce soir.** Rien n'est en attente de commit.

> Le handoff des deux sessions précédentes (la bascule six thèmes → trois échelles, l'entourage qui
> prend son module, les neuf faux silencieux) est archivé dans
> **`docs/handoff/2026-07-29-journee-trois-echelles.md`**. Il reste utile : ses §1, §2, §3 et §6
> décrivent du code encore vivant. Son **§4 est PÉRIMÉ** (le brainstorming interrompu qu'il décrivait
> a été mené et livré), et son **§5 est RÉSOLU** (c'est l'objet de cette session).

---

## Objectif en cours

Faire descendre le droit à l'échelle du **bien** : `public.logement` est devenue
`public.address_dossiers`, identifiée par un **uuid**, et l'existence d'une ligne EST le droit
d'ouvrir le dossier. Cette tranche est **livrée et vérifiée en production**. La suite est la spec de
**qualification et de checkout**, qui est désormais bloquante : sans elle, aucune surface ne crée de
dossier hors de la route de test.

---

## Fait dans cette session

**Trois documents, à lire dans cet ordre à la reprise :**
- `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` (610 l.) : l'analyse
  business. Goulot = zéro euro encaissé. Le 14 € survit resserré sur Territoire, la qualification
  pré-paiement devient le capteur du goulot, le 2ᵉ dossier reste à l'unité.
- `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` : la doctrine de l'objet dossier.
- `docs/superpowers/plans/2026-07-29-address-dossiers.md` : le plan en 9 tâches, toutes exécutées.

**Le code, 12 commits de `79e1b64` à `cb3fc79` :**
- `supabase/25_address_dossiers.sql` : renommage, `id uuid` en clé, `ban_id` **sans unicité**,
  colonnes `stripe_payment_intent_id` (unique) / `amount_paid_cents` / `purchased_at` /
  `access_revoked_at` / `created_at`, purge des 24 lignes de test, contrainte de cohérence de
  provenance, policy SELECT portant `access_revoked_at is null`, `revoke insert, update, delete`.
  Une seconde migration a retiré `TRUNCATE`.
- `src/lib/address-dossier-store.ts` (ex-`logement-store.ts`) : lectures seules, toutes **lèvent**
  au lieu de transformer une panne en absence de droit. `pickSoleDossier` refuse de deviner.
- `src/lib/territory-claims.ts` (+ test) : `decideTerritoryAccess` / `decidePaidTerritory`, purs,
  sans `server-only` pour rester testables sous `node --test`.
- `src/lib/server/address-dossier-write.ts` : `updateOwnedAddressDossier`, **seul** chemin
  d'écriture. Il ne rend jamais le client service role.
- `src/lib/active-territory.ts` : `canAnalyzeCommune` supprimée, `canAccessTerritory` et
  `hasPaidTerritory` la remplacent.
- Routes : `/api/logement-artefact` **supprimée** ; `logement-dpe`, `logement-autour`,
  `synthesize-logement`, `georisques-logement` passent par le dossier.
- Pages : `?logementId=` → `?dossierId=`, nouvelle page `/rapport/dossiers`, saisie d'adresse
  retirée des deux modules.
- `/api/admin/dossier` + `AdminDossierCreator` : créateur de dossiers pour les tests.
- `scripts/verify-address-dossiers-rls.mjs` : vérification des privilèges contre la base réelle.
- `cb3fc79` : correctif du gel « environnement en cours de récupération » (voir Pièges).

**Vérifié en production, au navigateur** : deux dossiers sur le même `ban_id`
(`44109_2300_00002`, 2 rue Crébillon à Nantes) coexistent avec des choix DPE divergents
(`user_confirmed`/D et `not_in_list`), le premier se rouvre avec le sien. **C'est le défaut §5,
mort.** Le rapport se rend en entier (passeport, parcelle, confort d'été, périmètre ABF, sinistres).

---

## Décisions prises, pas encore dans le vault

Toutes **tranchées par le porteur** ce soir, sauf mention contraire :

1. **Un dossier est l'analyse d'un BIEN situé à une adresse.** Jamais « un dossier = une adresse » :
   cette formule contredit l'existence de `PreciseLogementStep`.
2. **Identité = uuid**, `ban_id` sans aucune unicité.
3. **Le droit EST la ligne.** Pas de seconde table de droits ; `report_grants` reste territorial.
4. **Le tarif d'approfondissement est un ÉTAT calculé, jamais un crédit consommable.** Tous les
   biens d'une commune déjà payée en bénéficient, pas seulement le premier.
5. **Le business-strategist recommandait le 2ᵉ dossier à PLEIN TARIF** pour ne pas brouiller la
   mesure. **Sciemment écarté** : revendre le tiers d'un ensemble que le compte possède déjà est un
   fait que futur•e connaîtrait en l'encaissant. Une session qui relira le rapport y trouvera
   l'inverse ; ne pas « corriger ».
6. **Le Pack Décision ouvre le tarif d'approfondissement** sur ses trois communes (arbitrage porteur).
7. **Un dossier administratif n'est jamais une acquisition** (`stripe_payment_intent_id is null`).
8. **La résidence n'ouvre plus rien par elle-même**, et ce n'est pas une régression : il n'a jamais
   existé d'accès gratuit au Territoire COMPLET de la résidence, seulement le rapport partiel, qui
   reste rendu quand `canAccessTerritory` répond faux.
9. **Écarté** (proposé, refusé) : `dwelling_discriminator`, un `status` à états multiples,
   `entitlement_status`, `territory_credit_payment_id`, `last_opened_at`, `access_source`.

**À porter au vault à la reprise** : `docs/vault/vision/modele-economique.md` (architecture d'offre,
et **l'ancre de prix à corriger**, voir Pièges), plus un arbitrage
`arbitrages/dossier-adresse-unite-pas-pack.md`.

---

## État git

- **Branche** : `main`, à jour avec `origin/main`. **Aucun commit non poussé.**
- **Non commité** : uniquement `Futur.e Design System.zip` (non suivi, **à ne jamais committer**).
- **Branches locales à nettoyer** : `feat/address-dossiers` est fusionnée dans `main`, elle peut
  être supprimée. Restent aussi `feat/composition-faits-lies`, `feat/lot-a-depate-en-une-minute`,
  `feat/verdict-heros`, antérieures et hors sujet.
- **Aucune PR** : le projet pousse directement sur `main`, et **un push déploie en production**.
- **Base** : une seule base Supabase (`xkewgsccadjmondzmjxj`), **c'est la production**. Il n'y a pas
  d'environnement de développement séparé.

---

## URGENT : le droit est incohérent entre les écrans (constaté après le déploiement)

**Symptôme observé par le porteur, connecté** : `/rapport` sert le **rapport partiel** de La Rochelle,
pendant que `/compte` annonce « Trois échelles, toutes ouvertes ». Les deux écrans ne posent plus la
même question.

**Cause, et c'est une faute de ce lot.** Le point de décision a été changé sur `/rapport`, Logement
et Autour, mais **cinq points de citation sont restés en arrière** :

| Endroit | Question posée aujourd'hui |
|---|---|
| `src/app/(account)/rapport/page.tsx:66` | `canAccessTerritory(commune)` ← changé ce soir |
| `src/app/(account)/compte/page.tsx:33` | `canAccessCompleteReport(account)` ← flag de plan |
| `src/app/(account)/rapport/quartier/page.tsx:35,40` | `canAccessCompleteReport(account)` ← flag de plan |
| `src/app/api/synthesize-quartier/route.ts:222` | `canAccessCompleteReport(account)` ← flag de plan |
| `src/app/(dashboard)/dashboard/page.tsx:16` | `canAccessCompleteReport(account)` ← flag de plan |

Plus deux commentaires périmés qui citent l'ancienne règle : `src/lib/decision-packs.ts:125` et
`src/lib/active-territory.ts:21`.

C'est **exactement le piège écrit dans `AGENTS.md`** (« un seuil qui devient conditionnel rend
conditionnel tout ce qui le cite… le point de décision, le texte rendu, la convention affichée »).
La règle était dans le projet, elle n'a pas été appliquée.

**Pourquoi le compte du porteur est touché** : `plan = suivi`, `report_access = complete`, mais
**zéro `report_grant`**, résidence La Rochelle (`17300`), et ses deux dossiers sont à Nantes
(`44109`). Donc `canAccessTerritory(17300)` répond faux.

**Un vrai acheteur n'aurait pas ce problème** : le webhook Stripe crée le grant au paiement
(`webhook/route.ts:125`). Le trou ne concerne que les comptes dont le plan a été posé à la main,
c'est-à-dire les cinq comptes de test. La spec déclarait le grandfathering « sans objet parce que
personne n'a payé » : exact sur les paiements, **faux sur les états de compte**.

### Arbitrage à trancher par le porteur, AVANT de coder

1. **Créer un `report_grant` sur la résidence** pour les comptes dont le plan est payant
   (régularisation de données, le code reste juste). Effet de bord à assumer : ce grant vaudra
   « territoire payé », donc ouvrira le tarif d'approfondissement plus tard. Recommandation de la
   session précédente.
2. **Rouvrir la résidence au flag de plan** (`report_access === "complete"`). Aucune écriture en
   base, mais ça rouvre le trou que ce lot vient de fermer.
3. **Ne rien faire** : vivre avec le partiel jusqu'à ce que le checkout existe, et ne corriger que
   les textes.

Puis, dans tous les cas : **aligner les cinq points de citation sur la même question**. Attention à
l'ordre, aligner avant de régulariser fermerait aussi le module Territoire.

SQL de régularisation, si l'option 1 est retenue :
```sql
insert into public.report_grants (user_id, insee, commune, source)
select p.user_id, p.home_insee_code, p.home_commune, 'direct'
from public.user_profiles p
join public.user_accounts a on a.user_id = p.user_id
where a.report_access = 'complete' and p.home_insee_code is not null
on conflict (user_id, insee) do nothing;
```

---

## Défaut préexistant découvert au passage : le teaser nomme la mauvaise commune

`src/components/wizard/WizardTeaser.tsx:292` fait `const ville = answers.quartier || "votre
commune"` pour le titre « Aperçu personnalisé · {ville} », **mais charge les signaux sur
`inseeCode`**, la commune du rapport. Chez le porteur : quatre points d'attention calculés sur **La
Rochelle**, affichés sous le nom de **Carpentras** (sa réponse au wizard).

Faux silencieux au sens du §6 de l'archive : plausible, aucune erreur levée, aucun test capable de
le voir. Antérieur à ce lot. Le titre doit nommer la commune réellement analysée, ou le teaser doit
charger la commune qu'il nomme, mais pas les deux à la fois.

---

## Prochaine étape immédiate

**D'abord trancher l'arbitrage de la section URGENT ci-dessus** : le porteur n'a plus accès au
rapport complet de sa propre commune, et deux écrans se contredisent. C'est ce qui bloque son
usage, avant tout autre chantier.

**Ensuite seulement : vérifier que le correctif `cb3fc79` a résolu le gel du module Autour.** Ouvrir
`https://futur-e.fr/rapport/autour?dossierId=cfe1ed8e-5fc0-4b8c-81ad-989c1d0c3db6` connecté, et
regarder le bloc « Espace vert ».

- Si l'espace vert s'affiche : le sujet est clos, passer à la spec de qualification (et lire la
  section « Chantiers hérités » plus bas : six chantiers antérieurs restent ouverts, dont un qui
  s'est aggravé ce soir).
- S'il répète « environnement en cours de récupération » : la racine serveur est corrigée, donc le
  problème restant est **côté client**. `AutourModule` ne retente qu'**une seule fois par montage**
  (`autourRetriedRef`, ~l. 120). Un second échec exige un rechargement manuel. C'est la limite
  connue, à traiter là.

Contrôle SQL rapide de l'état réel :
```sql
select id, snapshot->'sourceStatus' from public.address_dossiers;
```
`osmInfrastructure` et `osmGreenSpaces` doivent passer à `complete`.

**Puis** : lancer la vérification RLS, jamais exécutée (elle demande le mot de passe du porteur) :
```bash
TEST_USER_EMAIL=bonjourfuturee@gmail.com TEST_USER_PASSWORD='…' \
TEST_OTHER_USER_ID=b779cc8f-40c9-4ba5-a3d8-5a5726897c84 \
  node scripts/verify-address-dossiers-rls.mjs
```

---

## Chantiers hérités du handoff précédent, toujours ouverts

Sa section « La suite » portait huit points. Deux sont faits (le brainstorming §4 et
`address_dossiers`, c'est cette session). Voici les six autres, avec ce que la livraison de ce soir
a changé pour eux.

**A. La porte « j'ai une adresse » sur la home. STATUT AGGRAVÉ, c'est le plus urgent.**
Les deux CTA sont `Trouver où vivre` et `Analyser ma commune`. Il n'y avait aucune entrée par
l'adresse, alors que deux des trois modules l'exigent. **Ce soir, la saisie libre d'adresse a été
retirée des modules eux-mêmes** (la route `georisques-logement` exige que l'adresse soit celle du
dossier, donc une saisie libre ne pouvait plus qu'échouer). Il n'existe donc **plus aucune entrée
par l'adresse dans tout le produit**, hors la porte de test. Ce n'était qu'un arbitrage de confort ;
c'est devenu la condition d'existence du parcours payant. À traiter avec la spec de qualification,
qui est l'endroit naturel de cette saisie.

**B. Le test manuel de la bascule. PARTIELLEMENT FAIT.**
Vérifié ce soir en production : un dossier neuf, un second au même immeuble, la divergence des
choix DPE, la réouverture, le repli qui refuse de deviner. **Pas encore vérifié** : une adresse
**sans DPE** (le trou fréquent, et le cas où le Passeport doit rester digne), et l'aller-retour
Territoire → Autour → Logement.

**C. `checkout-products.ts`. MÛR maintenant.**
Le champ `features` décrit encore « la lecture du territoire… qui s'enrichit au fil des prochains
modules ». Il n'est affiché nulle part (vérifié), mais c'est une source de vérité dormante et
divergente. Le handoff disait « à nettoyer quand l'offre sera tranchée » : **elle l'est** (14 € =
Territoire seul, 39 € = commune + un bien). Cette promesse d'enrichissement gratuit contredit
désormais le découpage.

**D. « Autour » : quatre chantiers, dans l'ordre.** Afficher les infrastructures bruyantes déjà
calculées (une session, aucune donnée nouvelle) · compter dans un rayon plutôt que le plus proche ·
les permis Sitadel autour de l'adresse (API vérifiée, jointure par parcelle) · le zonage PLU des
parcelles voisines. Détail et réserves dans le §6 de l'archive.

**E. Le radon attend une décision produit, pas du code** : libellé exact de la carte, et si le geste
« faire mesurer » mérite un annuaire. Si oui, la doctrine diagnostiqueurs s'applique : annuaire
qualifié SANS commission, le moteur ne connaît jamais les rémunérations.

**F. La conclusion déterministe d'« Autour »** : le module rend des faits sans synthèse. **Ne PAS
créer un troisième prompt** : assembler des énoncés déterministes à partir de `secteur-facts.ts`
(`equipementAutoStatement` fait déjà ce geste). Mémoire : `project_futuree_autour_conclusion`.

**Ordre suggéré** : A avec la spec de qualification (ils se répondent), puis C (court, et l'offre
est tranchée), puis B, puis D/F, puis E qui demande un arbitrage porteur.

---

## À lire d'abord à la reprise

1. `MEMORY.md` (chargé au démarrage) puis les fiches `project_module_logement`,
   `project_paywall_territoire`, `business_modele_economique`.
2. `docs/superpowers/specs/2026-07-29-address-dossiers-design.md` — **la doctrine fait foi** en cas
   de divergence avec le code.
3. `docs/rapports-agents/business-strategist/2026-07-29-dossier-adresse-39e.md` — §6 (protocole de
   test sans historique payant) et §7 (les six événements) alimentent directement la spec suivante.
4. `docs/handoff/2026-07-29-journee-trois-echelles.md` — §1, §2, §3, §6 et la section « Pièges »
   restent valables. Son §4 est périmé, son §5 est résolu.
5. `docs/handoff/AUTO-SNAPSHOT.md` — **daté du 08/07, très en retard.** Ne pas s'y fier.
6. `docs/vault/arbitrages/recurrence-b2c-episodique-pas-mensuelle.md` avant toute idée de pass.

---

## Pièges et fils ouverts

**Le produit ne peut plus créer de dossier sans la porte de test.** Deux variables, absentes du
repo (`.env.example` est gitignoré), **actuellement actives en production** :
```
ENABLE_ADMIN_DOSSIER_CREATION=true      # absent = route 404, quelle que soit la liste
FUTUREE_ADMIN_EMAILS=bonjourfuturee@gmail.com
```
La comparaison d'e-mail est stricte : Gmail confond `bonjour.futuree@` et `bonjourfuturee@`, pas
nous. **À RETIRER de la production le jour où le checkout dossier existera** : ce genre de porte
reste ouverte des années.

**L'ancre de prix du vault est FAUSSE et doit être corrigée avant toute page de vente.**
`modele-economique.md` compare 39 € aux « 600 à 800 € de diagnostics ». Or le dossier de diagnostics
est à la charge du **vendeur** (art. L271-4 CCH), du bailleur en location : l'acquéreur ne débourse
pas cette somme. L'ancre resterait juste pour un vendeur ou un propriétaire, segment non instruit.

**`TRUNCATE` reste accordé à `authenticated` sur toutes les autres tables** (`payments`,
`report_grants`, `user_profiles`…), défaut Supabase : la protection repose entièrement sur la RLS,
que TRUNCATE ignore. Retiré sur `address_dossiers` seulement. PostgREST ne l'expose pas, donc c'est
théorique. Chantier distinct.

**Le compteur d'adresses est mort, pas remplacé.** `logement_same_commune_multi` comptait par
session (`useRef`) et par commune (`Map` clé INSEE) : il ratait le multi-session et le
multi-commune, les deux façons dont un projet compare réellement des adresses. Sa mesure appartient
à la qualification, à l'échelle du **parcours de décision** (`decision_journey_id` anonyme), jamais
du `project_id` : `user_project` est une colonne de `user_profiles`, donc un visiteur froid n'en a
pas, et le visiteur froid est précisément le moment d'achat identifié.

**Deux dossiers de test vivent en base** (2 rue Crébillon, Nantes), `stripe_payment_intent_id` nul,
donc exclus de tout comptage et d'aucun tarif. Supprimables par `DELETE /api/admin/dossier`.

**Le webhook Stripe n'a AUCUNE idempotence propre** : toute sa protection contre un événement
rejoué vient des contraintes de table. `address_dossiers` porte un index unique sur
`stripe_payment_intent_id`, mais la gestion `ON CONFLICT` (retrouver le dossier et répondre en
succès) appartient à la spec du webhook, et n'existe pas encore.

**Rappels mécaniques** : `tsconfig.json` exclut `**/*.test.ts` du typecheck et eslint les ignore, un
lint vert ne dit rien d'eux. Un module important `server-only` casse sous `node --test`. Un
commentaire JSX dans un ternaire casse le build. Le hook pre-commit lance `index:verify`.
**Ne pas lancer `scripts/probe-conclusion.ts`** (45 appels LLM facturés).
