# Le Fil — fiabilité des sources et taux de déclenchement réel

> Data Curator, 2026-07-09. Read-only. Terrain : `docs/vault/recherches/inventaire-sources.md`,
> `doctrine/data.md`, `doctrine/editoriale.md`, ADR-0001 (pas de score), ADR-0002 (moat = transformation).
> Confronté au CODE (`src/lib/{georisques,vigieau,atmo}.ts`, `scripts/populate-inondation.py`) et à la
> SOURCE (sondes API Géorisques CatNat + VigiEau sur panel réel, 2026-07-09).

---

## LA RÉPONSE (le chiffre qui décide de tout)

**Signaux QUALIFIÉS / commune / an, hors qualité de l'air** (voir pourquoi l'air sort ci-dessous),
fourchette bornée par type de commune, mesurée sur la source réelle :

| Type de commune (panel) | CatNat (mesuré) | Sécheresse Propluvia (estimé) | Diffs Géorisques (estimé) | **TOTAL / an** |
|---|---|---|---|---|
| Rural calme / montagne (Guéret 23096, Chamonix 74056) | 0,3 | 0–0,5 | ~0,1 | **0,4 – 1** |
| Littoral / périurbain (La Rochelle 17300, Blagnac 31069) | 0,4 | 0,5–1,5 | ~0,1 | **1 – 2** |
| Grande ville / rural argileux (Toulouse 31555, Marseille 13055, Nérac 47195) | 0,8–1,2 | 1–3 | ~0,1–0,2 | **2 – 4,5** |
| Très exposé méditerranéen (Nice 06088) | 2,6 | 1–3 | ~0,2 | **4 – 6** |

Source du CatNat : comptage réel des arrêtés `date_publication_jo` sur la décennie 2014-2023 via
`georisques.gouv.fr/api/v1/gaspar/catnat` (page_size 500), 8 communes. **C'est de la mesure, pas une intuition.**

**Si on AJOUTE la qualité de l'air** au seuil « Mauvais » (indice ≥ 4), on bascule dans un autre ordre de
grandeur, dominé par l'air : +5 à +25 signaux/an dans les zones polluées (grandes villes, PACA, vallées
alpines), +0 à +3 en rural propre. L'air écrase alors tout le reste et fait « gonfler » artificiellement
le compteur.

### Ce que ce chiffre tranche

- **Hors air, pour la commune TYPIQUE : ~1 à 3 signaux/an.** C'est **sous** le seuil ~4/an que le cadrage
  pose pour justifier un abonnement. → **Le Fil, sur son socle honnête (CatNat + sécheresse + diffs),
  ressemble davantage à une FONCTIONNALITÉ INCLUSE qu'à un abonnement autonome** pour la majorité des communes.
- **L'abonnement à >4/an ne tient que par deux leviers**, tous deux fragiles : (a) cibler les communes très
  exposées (méditerranéennes, argileuses) ; (b) inclure l'air à un seuil bas — mais l'air est justement le
  flux le moins fiable comme « signal de lieu » et empiète sur le module Santé. **Fonder la promesse
  « hyper fiable » d'un abonnement payant sur le flux le plus bruité serait un contresens.**
- Recommandation de posture (hors ma lentille stricte, à confirmer par Business/Product) : traiter Le Fil
  comme **veille incluse dans le rapport territoire débloqué**, l'abonnement autonome n'étant défendable que
  sur un segment « communes exposées » à démontrer. Ma lentille ne tranche pas le prix ; elle fournit le
  chiffre honnête.

---

## Flux par flux

### 1. CatNat — reconnaissances de catastrophe naturelle — INTÉGRER (flagship du Fil)

- **Source** : Géorisques GASPAR `/gaspar/catnat` (BRGM/DGPR). Déjà câblé (`georisques.ts` `loadGasparCatnatSummary`,
  `scripts/populate-inondation.py`). Sans token, v1.
- **Type** : historique/réglementaire (arrêté interministériel officiel). Récit factuel daté.
- **Champs vérifiés sur la source** (2026-07-09) : `code_national_catnat`, `date_debut_evt`, `date_fin_evt`,
  `date_publication_arrete`, `date_publication_jo`, `libelle_risque_jo`, `code_insee`.
  → **`code_national_catnat` = clé unique = diff idempotent PARFAIT.** On notifie quand un `code_national_catnat`
  absent du dernier snapshot apparaît. Zéro ambiguïté.
- **Fraîcheur / latence** : l'arrêté paraît au JO **des semaines à des mois** après l'événement (le RGA
  sécheresse d'une année est souvent reconnu l'année suivante). `date_publication_jo` est l'ancre temporelle
  honnête. **Conséquence éditoriale (honnêteté)** : le signal dit « reconnaissance publiée », JAMAIS « il vient
  de se passer » — sinon on fait croire à une imminence qui n'existe pas.
- **Granularité** : **commune** (native, propre). Rattachement parfait.
- **Faux positifs** : quasi nuls (re-publication rétroactive rare ; la clé nationale les absorbe).
- **Faux négatifs** : le seul risque est le cap `page_size=500` (max observé = 83 arrêtés/commune → aucune
  troncature réaliste). Fiable.
- **Fréquence mesurée** : 0,3–1,2/an (médiane ~0,5), jusqu'à 2,6/an à Nice. Le signal le plus VALUABLE et le
  plus FIABLE des quatre.
- **Honnêteté** : c'est de la matérialité passée reconnue, pas une prédiction. Cohérent avec la doctrine CatNat
  déjà en place (observé quasi-stationnaire ≠ projeté DRIAS).
- **Verdict : INTÉGRER en priorité 1.** C'est le socle du Fil.

### 2. Propluvia / VigiEau — restrictions d'eau — INTÉGRER avec discipline (priorité 2)

- **Source** : `api.vigieau.gouv.fr` (MTE). Déjà câblé (`vigieau.ts`). Type : réglementaire (arrêté préfectoral).
- **Granularité — PIÈGE MAJEUR vérifié sur la source (2026-07-09)** : la donnée est par **ZONE d'alerte**, pas
  par commune, et une commune est couverte par **plusieurs zones simultanées de type différent** :
  `SUP` (eaux superficielles), `SOU` (souterraines), `AEP` (eau potable). Panel réel : Marseille = 3 zones
  « Littoral » toutes en vigilance ; Guéret = 3 zones « Creuse aval » toutes en **crise** (juillet 2026) ;
  Toulouse/Nérac = 0 zone. → **Il FAUT dédupliquer les 3 types en un seul niveau max par commune** (le code
  `getVigieauSummary` le fait déjà : `maxLevel`), sinon on triple-notifie le même épisode. Doctrine `data.md`
  règle 5 : rattachement zone→commune documenté, jamais « la sécheresse de la commune X » sans dire la zone.
- **Fraîcheur** : temps réel (arrêté préfectoral applicable immédiatement). Latence quasi nulle. Bon pour une veille.
- **Diffabilité** : API d'ÉTAT COURANT (pas un journal d'événements). On diffe des snapshots. Idempotent si on
  clé sur (zone, niveau, `arrete.id`). Notifier UNIQUEMENT sur **escalade vers `alerte` ou plus** (ignorer
  vigilance = bruit), et sur la sortie de crise. Ne jamais re-notifier une reconduction d'arrêté au même niveau.
- **Faux positifs** : renouvellement/re-codage de zone, oscillations vigilance↔pas de restriction. Maîtrisables
  par le gate « alerte+ » et la clé arrêté.
- **Faux négatifs** : API indisponible pendant une crise courte. Le `.catch` actuel renvoie un summary vide
  silencieux (`vigieau.ts:131`) → **pour Le Fil, un échec de fetch ne doit PAS être lu comme « retour à la
  normale »** (sinon on rate le signal, le pire). Distinguer « pas de restriction » de « source muette ».
- **Fréquence estimée** : saisonnière, très année-dépendante. Zone prone (centre/sud) : 1–3 escalades/été en
  année sèche, 0 en année humide. Nord/Bretagne/montagne : 0–1/an. Moyenne pluriannuelle ~0,5–3/an selon exposition.
- **Honnêteté** : une restriction est une **mesure de gestion**, pas une catastrophe. « Crise » sonne alarmant
  mais désigne une règle d'usage de l'eau. Le Fil doit cadrer « restriction d'usage en vigueur », jamais un danger.
- **Verdict : INTÉGRER en priorité 2**, sous les 3 disciplines (dédup zones, gate alerte+, échec ≠ normale).

### 3. Diffs de données structurées Géorisques — DIFFÉRER (hors MVP)

- **Source** : couches structurées Géorisques (PPRN, TRI, zonages, aléas) — déjà partiellement câblées
  (`georisques.ts` v1/v2, `pprn-zonage.ts`).
- **Type** : réglementaire/zonage. Grande valeur quand ça change (un PPRN approuvé change la constructibilité).
- **Diffabilité — le point faible** : il n'existe **pas de flux d'événements**. Il faut differ des snapshots
  complets de dataset. Le risque n°1 est le **faux positif de re-publication** : Géorisques ré-exporte/ré-ingère
  régulièrement (churn de schéma, reformatage), ce qui produit des « changements » qui ne sont pas des
  changements RÉELS de risque. Distinguer une révision administrative d'un nouvel aléa physique demande une
  normalisation fine et invérifiable au MVP.
- **Fréquence** : très rare — ~0–0,2/an par commune (approbation/révision de PPRN, nouveau TRI).
- **Honnêteté** : un changement de zonage est **administratif**, pas « un nouveau risque est apparu ».
- **Verdict : DIFFÉRER.** Rare + diffabilité non maîtrisée = exactement le flux qui **trahit la promesse
  « hyper fiable »** par des faux positifs. Le socle CatNat couvre déjà l'essentiel du risque officiel qui
  bouge. À rouvrir quand la diffabilité est prouvée sur un dataset stable et versionné (voir signaux de réouverture).

### 4. Qualité de l'air (Atmo / Geod'Air) — DIFFÉRER pour Le Fil (rester dans Santé)

- **Source** : `admindata.atmo-france.org` (`atmo.ts`). Indice ATMO **modélisé, publié par commune**
  (`code_zone = code INSEE`, vérifié dans le code). Auth ATMO_USERNAME/PASSWORD.
- **Type** : mesuré/modélisé, **en situation de fond** (doctrine `data.md` règle 5 : ne reflète pas
  l'exposition de la rue, effet canyon/bord d'axe ignoré).
- **Fraîcheur** : quotidien, ~13h le jour même. Très frais.
- **Diffabilité** : franchissement de seuil quotidien. Mais **fréquence très élevée** si seuil bas → 5–25
  jours/an « Mauvais » en zone polluée. C'est ce flux qui gonfle artificiellement le compteur.
- **Faux positifs / honnêteté** : prévision modélisée révisable ; indice de fond présenté comme « l'air que
  vous respirez » **surpromet** (règle 5). Une station déplacée ou un modèle recalé changent le signal sans
  changement réel.
- **Frontière Santé** : la qualité de l'air **appartient déjà au module Santé** (`inventaire-sources.md` :
  ATMO = Rapport Santé). En faire le carburant de fréquence d'un abonnement Fil, c'est (a) doublonner Santé,
  (b) asseoir « hyper fiable » sur le flux le moins fiable comme signal de lieu.
- **Verdict : DIFFÉRER / hors MVP du Fil.** Garder l'air dans Santé. Si un jour Le Fil porte l'air, ce doit
  être un pic **exceptionnel** (procédure préfectorale d'épisode, pas l'indice quotidien), donc via un flux
  « arrêté d'épisode de pollution », pas l'indice de fond — à instruire séparément.

---

## Ordre de priorité MVP (le plus fiable + fréquent d'abord)

1. **CatNat** (fiable, idempotent, valuable) — socle.
2. **Sécheresse Propluvia** (fréquent, frais, mais discipline zone/escalade obligatoire).
3. ~~Diffs Géorisques~~ → **différé** (diffabilité non maîtrisée).
4. ~~Air~~ → **différé / rester Santé** (frontière + flux le moins fiable comme alerte de lieu).

**MVP honnête = 2 flux, pas 4.** CatNat + sécheresse. Les deux autres du cadrage sont soit non-diffables au MVP
(Géorisques), soit hors périmètre/frontière Santé (air).

---

## Version minimale (~90 % de la valeur)

**Un seul flux : CatNat, en diff sur `code_national_catnat`.** C'est officiel, idempotent, à la commune,
zéro faux positif, et c'est le cœur de mission de futur•e (le risque reconnu). Une notification par nouvelle
reconnaissance, formulée « reconnaissance publiée le {date_jo} », avec le type d'aléa. Rien d'autre n'est
nécessaire pour livrer Le Fil v0 et **mesurer le taux de déclenchement réel en production** avant d'ajouter
la sécheresse. Ne PAS composer de « score d'alerte » agrégé (ADR-0001) : un événement = un fait daté, pas une note.

---

## Cohérence doctrinale (tensions posées, non tranchées)

- **ADR-0001 (pas de score)** : Le Fil ne doit pas produire un « niveau de menace » composite du lieu. Chaque
  signal reste un fait daté, attribué, à son échelle. Tension à surveiller si le produit veut un « indice de
  vigilance » synthétique.
- **`doctrine/data.md` règle 5** : sécheresse = zone (pas commune), air = fond (pas rue). À porter dans le récit
  du Fil, sinon fausse attribution.
- **Frontière Santé** : l'air est déjà à Santé (comme IREP/friches viennent d'y être renvoyés côté Logement).
  Cohérent de ne pas le remettre dans Le Fil.
- **Attribution** : jamais Callendar. CatNat = « Géorisques / GASPAR », sécheresse = « VigiEau / Propluvia (MTE) ».
- **Le moat = la transformation (ADR-0002)** : la valeur du Fil n'est pas l'accès aux flux (publics) mais le
  diff idempotent + le rattachement propre + le récit honnête (latence, échelle). C'est là que se joue « hyper fiable ».

---

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

Ajouter à la section « victoires méthodologiques » de `inventaire-sources.md` :

| Source | Décision | Pourquoi | Gain |
|---|---|---|---|
| **Diffs structurés Géorisques (PPRN/TRI/zonages) pour Le Fil** | différé | pas de flux d'événements ; diff sur snapshots complets → faux positifs de re-publication/churn de schéma indistinguables d'un vrai changement de risque ; ~0–0,2/an | évite un flux qui trahirait « hyper fiable » par des alertes administratives ; le socle CatNat couvre déjà le risque officiel qui bouge |
| **Qualité de l'air (indice ATMO) comme signal du Fil** | différé / maintenu à Santé | indice modélisé « de fond » (pas la rue, règle 5) ; fréquence élevée qui gonfle le compteur ; doublon du module Santé ; asseoir un abonnement « fiable » sur le flux le moins fiable = contresens | garde l'air à sa juste échelle et son bon module ; protège la promesse de fiabilité |

Et une ligne de doctrine : **« Le Fil MVP = CatNat + sécheresse Propluvia. Taux mesuré ~1–3 signaux/commune/an
(hors air), sous le seuil abonnement : Le Fil penche fonctionnalité incluse, pas abonnement autonome — sauf
segment communes exposées à démontrer. »**

---

## Quand rouvrir ce sujet

- **Diffs Géorisques** : si Géorisques publie un dataset **versionné avec journal de changements** (ou une API
  d'événements), la diffabilité devient maîtrisable → réévaluer.
- **Air** : si un flux **« arrêté préfectoral d'épisode de pollution »** (événement exceptionnel, pas indice
  quotidien) est disponible proprement à la commune → réévaluer comme signal rare et fiable.
- **Abonnement vs inclus** : si l'instrumentation en production (v0 CatNat) montre un taux réel > 4/an sur un
  segment identifiable de communes exposées, la thèse abonnement redevient défendable sur CE segment.
- **Sécheresse** : si VigiEau change de modèle de données (zones re-découpées) ou si le taux de faux positifs
  d'escalade dépasse ce que le gate « alerte+ » absorbe → revoir la discipline de diff.
- **Latence CatNat** : si le décalage JO s'allonge structurellement (réforme du régime post-Langreney), revoir
  le cadrage éditorial « reconnaissance publiée ».

*Avis daté du 2026-07-09. Chiffre CatNat = mesure directe sur la source ; chiffres sécheresse/air/Géorisques =
estimations d'ordre de grandeur à raffiner par instrumentation en production (les moteurs de recherche
n'ont pas donné de bilan national exploitable ce jour ; le chiffre porteur ne dépend pas d'eux, il vient de l'API).*
