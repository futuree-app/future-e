# Cadrage architecture — « Le Fil » (couche temporelle de futur•e)

Software Architect — 2026-07-09. Scope resserré : go/no-go, pas le framework détaillé.
Fil rouge = FIABILITÉ (« hyper fiable ET véritablement alerte »).

## Périmètre lu (vérité vivante, pas mémoire)
- `src/lib/georisques.ts` (697 l.) : CatNat via GASPAR `/gaspar/catnat` (sans token), déjà fetché + parsé + caché **en mémoire process** (`getGasparCatnatSummary`, `Map` par INSEE). `fetchJson` = `next: { revalidate: 86400 }`.
- `src/lib/vigieau.ts` (152 l.) : Propluvia/restrictions d'eau **déjà câblé** (`api.vigieau.gouv.fr`), niveaux + `startDate`/`endDate` par zone, grain ZONE (SUP/SOU), pas commune.
- `src/lib/atmo.ts` (167 l.) : qualité de l'air, indice **quotidien** par INSEE (Atmo France), token, fenêtre today/yesterday.
- Migrations : `12_report_grants` (périmètre débloqué par user), `17_logement` (artefact user+snapshot jsonb), `18_osm_tile_cache` (cache service-role par cellule, statut complete/failed).
- `after()` (Fluid Compute) déjà utilisé (`synthesize-logement`, `logement-autour`) ; `maxDuration=60`, `runtime=nodejs`, `dynamic=force-dynamic`.
- Doc Next 16.2.4 : route handlers **non cachés par défaut** (ok pour un endpoint cron). **Le cron n'est PAS une API Next** : c'est la plateforme Vercel (`vercel.json` `crons`) — aucun `vercel.json` dans le repo aujourd'hui.

## Verdict d'entrée
**Système SÉPARÉ, pas une extension du pipeline rapport.** Difficulté globale : **MOYEN pour CatNat + eau** (nature événement/état, clés relativement stables), **DIFFICILE pour l'air + les diffs Géorisques** (l'événement est *fabriqué* par futur•e, terrain à faux positifs). Voie la moins endettante : **walking skeleton sur CatNat seul**, colonne vertébrale minimale, généralisation différée après le 2e flux.

---

## Q1 — Nouveau système ou extension du pipeline rapport ?
**Nouveau système, qui RÉUTILISE les adapters de source, PAS le pipeline rapport.**

Le rapport lit un **état courant** à la demande d'un user, en mémoire, éphémère (`Map` par lambda, ne survit pas). Le Fil a besoin d'un **état persistant national qui évolue indépendamment de toute requête user**, comparé dans le temps. Ce sont deux régimes incompatibles : greffer le diff sur le re-fetch du rapport = coupler la veille à la présence d'un lecteur (faux négatif garanti : personne ne regarde une commune → aucun événement détecté).

Frontière la moins endettante :
- **RÉUTILISER** : les adapters bruts de source (`vigieau.ts`, `atmo.ts`, et le `fetchJson` brut de `georisques.ts`). Les patterns déjà éprouvés : service-role + snapshot jsonb (`osm_tile_cache`/`logement`), `after()`, `sourceStatus` sans `.catch` muet, `report_grants` comme graine de périmètre, Resend, le routing modèle synthèse.
- **NE PAS réutiliser** : `getGasparCatnatSummary`. Il est **lossy** — il agrège en compteurs/années et **jette l'identité de l'arrêté** (ne garde que `date_debut_evt` + `libelle_risque_jo`). Or l'identité de l'arrêté est LA clé de l'idempotence. Le Fil doit fetcher le **brut**, pas le résumé.

## Q2 — Où vit l'état temporel ? (modèle minimal Supabase)
5 tables, service-role en écriture (le moteur n'a pas de user), lecture RLS-own pour ce qui est perso :

- `fil_source_snapshot(flux, perimeter_key, payload jsonb, content_hash, fetched_at)` — snapshots **immuables** de source. Sert au diff, à l'audit, ET à détecter les **corrections rétroactives** (même clé, nouveau hash).
- `fil_event(id, flux, insee, natural_key, event_type, severity, occurred_at, detected_at, payload jsonb, status, dossier_id)` avec **`UNIQUE(flux, natural_key)`**. C'est la pierre angulaire : l'idempotence dérive de la contrainte SQL, pas du code applicatif.
- `fil_dossier(id, flux, insee, kind, opened_at, last_event_at, status, summary_text, summary_generated_at)` — le thread qui vit.
- `fil_subscription(user_id, insee, flux_mask, threshold, created_at)` — périmètre d'intérêt. **Graine = `report_grants` + `home_insee_code`** pour le spike ; droit explicite plus tard (cf. tension Q ci-dessous).
- `fil_notification(id, user_id, event_id, dossier_id, channel, sent_at)` avec **`UNIQUE(user_id, event_id)`** (ou milestone de dossier). Dédup de notif = contrainte, pas logique.

**Rattachement événement→dossier (déterministe) :** un événement rejoint le dossier ouvert le plus récent de même `(insee, famille d'aléa, statut=actif)` ; sinon il en ouvre un. Zéro IA dans cette décision.

## Q3 — Fiabilité = le cœur
**Le pari load-bearing = la CLÉ NATURELLE STABLE, différente par flux.** L'erreur serait un « diff générique ». Chaque flux a une **ontologie d'événement distincte** :

| Flux | Nature | Clé naturelle | Événement | Seuil |
|---|---|---|---|---|
| CatNat GASPAR | événement (batch JO) | `(insee, aléa, date_evt, réf. arrêté/JO)` | nouvelle reconnaissance | existence d'une nouvelle clé |
| Eau VigiEau | **état** | `(zone, arrêté id)` | **transition** de niveau | franchissement de gravité |
| Air Atmo | **continu** | *à fabriquer* (fenêtre + contenu) | dépassement **soutenu** | N jours ≥ seuil / épisode officiel |
| Diff Géorisques | snapshot | hash par item | **fabriqué** par comparaison | changement structurel réel |

**Idempotence** : la clé naturelle, jamais « ai-je déjà vu ce fetch ». Rejouer le cron = 0 doublon par construction (upsert sur `UNIQUE`).

**Faux négatifs (perte de confiance fatale)** — trois digues :
1. Ne jamais faire confiance à un seul fetch. Une clé absente doit l'être sur **K fetches réussis consécutifs** avant `status=withdrawn` (contre trou de pagination / panne transitoire).
2. **Distinguer erreur et vide** : un timeout/5xx/schéma cassé n'est PAS « aucun événement » (le code actuel a déjà cette hygiène `sourceStatus`). Un snapshot en échec ne déclenche aucun retrait.
3. **Alerte sur le silence** : si un flux n'a pas produit de fetch national réussi depuis X heures → alerte opérateur. « Véritablement alerte » = **le pipeline se surveille lui-même**.

**Faux positifs (bruit = résiliation)** : le seuil est une **transition de gravité**, jamais la simple existence. L'air surtout : dépassement soutenu / épisode officiel, jamais un pic d'indice quotidien. Debounce par flux.

**Corrections rétroactives** : snapshots immuables + clé naturelle → un arrêté rectifié = même clé, nouveau hash → transition `actif→rectifié` (elle-même événement « cette reconnaissance a été rectifiée »). Retrait = disparition confirmée sur K fetches. On ne DELETE jamais sur une absence unique.

**Où l'IA intervient / n'intervient PAS** : IA **uniquement en bout de chaîne**, pour rédiger le résumé lisible d'un dossier déjà structuré. Elle ne décide JAMAIS « est-ce un événement », « le seuil est-il franchi », « quel dossier ». C'est exactement la doctrine déjà gravée pour la synthèse Logement (« oriente sans introduire un fait absent d'un bloc déterministe »). Le moat = l'auditable.

## Q4 — Déclenchement, coût, montée en charge
- **Cron = Vercel (`vercel.json` `crons`)**, cible = un route handler `force-dynamic` (non caché). À confirmer sur la doc plateforme : Hobby ≈ 2 crons/quotidien max → **le Fil suppose probablement le plan Pro** (~20 €/mois, dans l'enveloppe si l'IA est milestone-gatée).
- **Cadence par flux** : CatNat quotidien (cadence JO), eau quotidien, air différé (horaire = cher + bruyant), diff Géorisques hebdomadaire.
- **Montée 100 → 34 000 = non-problème SI on ingère les EXPORTS NATIONAUX** (GASPAR a des exports data.gouv complets), pas 34 000 appels au point-API. Le moteur = O(datasets), pas O(communes). Les lectures locales lisent le store. C'est exactement « un moteur national + lectures locales ». **Si une source n'offre que le point-API → tueur de scaling** (34k appels/jour, quotas, coût) → à vérifier par flux.
- **Coût IA** : résumé de dossier seulement aux **jalons** (nouveau dossier / franchissement), borné, routé comme la synthèse existante.

## Q5 — Spike minimal (walking skeleton, CatNat, validé sur 100 communes)
Ordonné par **levée d'inconnu**, pas par découpage fonctionnel :

1. **Inconnu bloquant** : GASPAR expose-t-il une **clé naturelle stable + un marqueur de rectification** ? Fetch brut `/gaspar/catnat` sur quelques communes, inspecter **tous** les champs (le type actuel est un sous-ensemble) + schéma de l'export national. **Sans clé stable, STOP et repenser.** Critère d'arrêt de l'étape.
2. Ingérer UN snapshot national dans `fil_source_snapshot`, calculer les clés par arrêté.
3. Ingérer un **2e** snapshot (réel ou muté synthétiquement), lancer le diff déterministe → produire `fil_event` de façon **idempotente**. Prouver : rejeu = 0 doublon + détection de rectification.
4. Threading : rattacher les events à `fil_dossier` par `(insee, aléa)`.
5. Notifier : pour 100 communes abonnées (graine `report_grants`), franchissement → **une** ligne `fil_notification` idempotente + résumé IA du dossier par Resend.

**Critère d'arrêt du spike** : un vrai changement CatNat sur une vraie commune traverse detect→qualify→thread→notify ; deux passages du cron = **zéro notification dupliquée** ; une rectification simulée bascule le statut **sans re-notifier** à tort.

**Inconnus, dans l'ordre** : (a) clé stable + rectification GASPAR [bloquant] ; (b) export national dispo + stabilité de schéma ; (c) ontologie eau/air [différée] ; (d) source du périmètre d'abonnement [réutiliser `report_grants`] ; (e) canal notif [Resend, existe].

---

## Ce que cette architecture rend FACILE / DIFFICILE à changer
**FACILE** : ajouter un flux (chaque flux = adapter → snapshot → diff keyé → events, même colonne vertébrale) ; changer un seuil (donnée, pas code) ; changer la copy de notif (IA au bord). Rejouer/auditer l'historique (snapshots immuables).

**DIFFICILE (paris irréversibles)** : si le **choix de clé naturelle par flux** est faux, tout l'aval pourrit (idempotence, threading, dédup notif) ; basculer d'une ingestion **export national** vers **point-API** (ou l'inverse) = re-architecture du déclenchement ; fusionner dans un même dossier des flux d'**ontologies d'événement incompatibles**.

## Les paris de l'architecture, et leurs seuils de bascule
- **Pari : chaque source expose une clé naturelle stable.** Seuil : au 1er flux sans identité stable (Atmo, indice quotidien) → clé à *fabriquer* (contenu + fenêtre), risque de faux positifs → stratégie de clé **par flux**, jamais générique. Casse dès l'air.
- **Pari : le grain COMMUNE (insee) est le pivot de rattachement.** Seuil : dès un événement infra-communal (secteur/parcelle) ou supra (zone/département). **VigiEau est déjà ZONE, pas commune** → table de mapping zone→communes à tenir. Ce pari casse **dès le flux eau**.
- **Pari : ingestion par export national.** Seuil : une source qui n'offre que le point-API → file d'attente + quotas.
- **Pari : l'IA reste en bout de chaîne.** Seuil : le jour où on voudrait que l'IA *qualifie* → perte d'auditabilité = changement de **doctrine**, pas d'implémentation.
- **Pari : volume gérable en Postgres nu.** 34k × 4 flux × cadence = milliers d'events/jour, OK très longtemps.

## Version minimale (~90 % de la valeur)
NE construire NI les 4 flux NI un moteur générique. **Seulement la colonne vertébrale sur CatNat** : snapshot immuable → diff keyé → `fil_event` → `fil_dossier` → 1 notif idempotente, sur `report_grants` existant, cron quotidien Vercel. Le générique multi-flux émerge **après le 2e flux (eau)**, pas avant : l'ontologie d'événement diffère trop pour être devinée depuis un seul flux (abstraction prématurée sinon).

## Quand rouvrir ce sujet
- GASPAR sans clé stable → repenser tout le modèle.
- **Au branchement du 2e flux (eau)** : c'est là qu'on sait si la colonne vertébrale généralise (zone ≠ commune, état ≠ événement). Moment de vérité de l'abstraction.
- Taux de faux positifs perçu > 0 sur le canal notif (une résiliation = signal fatal).
- Coût cron/IA hors enveloppe.
- Une source qui passe de l'export national au point-API (scaling).

## Cohérence / tension à trancher par l'humain
Le **périmètre de veille** : le réutiliser depuis `report_grants` lie « j'ai payé un rapport » à « je suis abonné au Fil ». Or Le Fil est probablement un **produit d'abonnement distinct** (≠ Pack). Question non tranchée par l'architecte : le périmètre est-il *dérivé* des grants (offert avec le rapport ?) ou un *droit explicite payant séparé* ? Ne pas le figer dans le spike (graine `report_grants` juste pour tester la boucle).

## Décision à graver (candidate ADR)
« Le Fil = système d'événements **séparé** ; ingestion par **export national** + store Postgres **keyé par clé naturelle propre à chaque flux** ; détection / seuil / threading **100 % déterministes** ; IA **en bout de chaîne** (résumé de dossier only) ; **notification idempotente par contrainte d'unicité**. Le moteur est national, les lectures sont locales par abonnement. »

## Limites de mon regard (ce run)
- Je n'ai **pas exécuté** d'appel GASPAR/VigiEau : la présence d'une **clé naturelle stable + marqueur de rectification** et l'existence d'un **export national** sont l'inconnu le plus load-bearing, et je les ai **raisonnés, pas prouvés**. Le spike doit commencer par là.
- Je n'ai **pas** la doc Vercel Cron sous les yeux (hors `node_modules/next`, c'est plateforme) : les limites de plan (Hobby 2 crons/quotidien) sont de mémoire, à confirmer.
- Je n'ai **pas mesuré** volumes ni coûts, ni lu tout le pipeline rapport appelant — seulement les libs source et les patterns de persistance.
