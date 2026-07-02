# Data Curator — Matrice Savoir/Agir × commune : la donnée mérite-t-elle d'entrer, par quadrant et par thème ?

> Rapport d'évaluation read-only. Date : 2026-06-29. Question-mère appliquée à chaque case
> « par commune » : la donnée existe-t-elle, à quelle granularité NATIVE, fraîche, sous quelle
> licence, et sa génération sur ~34 000 communes produit-elle un SIGNAL différencié ou du
> « rien à signaler » (thin content) ? Je ne décide rien : je pose les choix.

Doctrine relue et confrontée : `project_frontiere_savoir_agir.md` (la matrice 2×2 tranchée),
`docs/vault/recherches/inventaire-sources.md` (phrase-mère, typologie, criticité, victoires),
`docs/vault/doctrine/data.md` (granularité native, question de contrôle « à quelle échelle est-ce
vrai ? »), ADR-0001 (pas de score synthétique). Code inspecté : `savoir/[slug]/[insee_code]/page.tsx`,
`agir/inondation/page.tsx` (gabarit des 7 pages Agir), `src/lib/georisques.ts`, `src/lib/gissol.ts`,
`src/lib/irep.ts`, `src/lib/pollen.ts`, `scripts/populate-dependance-auto.js`, l'arbo
`src/lib/` et `scripts/populate-*`.

---

## 0. Deux constats de cohérence AVANT la matrice (à régler, ils précèdent toute génération)

### 0.1 La page Savoir×commune actuelle viole ADR-0001 (score synthétique) — bloquant doctrinal

`savoir/[slug]/[insee_code]/page.tsx` ne lit PAS les données honnêtes par commune. Elle lit la
table legacy **`communes_tension`** (`fetchCommuneDetail`) et affiche :
- un **`score` /100** en hero (« Score de tension / 100 », « Score calculé sur 4 indicateurs »),
- 4 IndicatorCards **`ind_exposition / ind_vulnerabilite / ind_adaptation / ind_occurrence`**,
  chacune notée /100 avec barre de progression.

C'est exactement la **note composite opaque** que l'ADR-0001 interdit, et `communes_tension`
est la table scorée que la fiche `project_comparateur_consolidation` dit **à jeter**. La
« couche données gratuite » que la doctrine d'accès veut exposer (surface SEO 34k) repose donc
aujourd'hui sur un artefact interdit, pas sur les données réelles (DRIAS/Géorisques/ATMO/Eaufrance
sont chargées plus bas dans `fullHtml`, mais derrière le paywall `report`).

**Conséquence Curator :** avant d'élargir la matrice, la couche gratuite de Savoir×commune doit
être **re-fondée sur les données honnêtes par commune** (les mêmes que le rapport, racontées à
leur échelle), pas sur un score/100 + 4 sous-scores inventés. Sinon on industrialise une fausse
précision sur 34k pages indexables. Je ne tranche pas le « comment », mais la donnée actuelle
**n'a pas le droit d'entrer telle quelle** dans une surface qu'on revendique honnête.

### 0.2 Savoir×commune et Agir×commune partageraient les MÊMES jeux de données (doublon de données total)

`savoir/[insee]` charge déjà : `getClimatDataCommune` (DRIAS), `getGeorisquesSummary` (PPRN/GASPAR/
sismique), `getAtmoForCommune` (air), `getEaufranceSummary` (eau/sécheresse). Une page
`agir/[thème]/[commune]` qui parle PPRN, CatNat, Vigicrues taperait **exactement** GASPAR/Géorisques.
La redondance de **données** entre les deux quadrants est totale : il n'y a pas deux jeux, il y a un
seul, lu deux fois.

La seule séparation honnête est **éditoriale, pas documentaire** : Savoir×commune = « voici l'état »
(la donnée à son échelle) ; Agir×commune = « voici quoi faire vu cet état » (la décision/le levier
contextualisé). Le risque, si on génère les deux : deux pages minces sur la même donnée, qui se
cannibalisent en SEO et diluent le signal. Recommandation Curator : **une seule donnée par commune,
deux récits** — et n'ouvrir Agir×commune que là où l'état porte un signal qui change l'action.

---

## 1. Savoir × commune — solidité de la couche données par thème (la couche existe déjà)

Lecture : pour chaque thème, quelle est la donnée NATIVE par commune, sa couverture réelle, et le
% de communes porteuses d'un signal non trivial. Type entre crochets (typologie inventaire).

| Thème | Source / lib | Granularité native | Licence | Couverture / signal par commune | Verdict couche données |
|---|---|---|---|---|---|
| **Canicule / chaleur** | DRIAS-TRACC `drias-json.ts` [projetée] | maille → commune | MF ouvert | Trajectoire (jours Tmax≥30/35, nuits trop.) sur **100 % des communes**, différenciée | **Solide partout** |
| **Inondation / submersion fluviale** | Géorisques GASPAR/CatNat/PPRN `georisques.ts` [réglementaire+historique] | commune | Etalab | GASPAR national ; flag inondation + arrêtés CatNat sur une **large part** ; PPRN sur sous-ensemble | **Solide là où risque** ; nul sur communes sans aléa |
| **Submersion côtière** | trait de côte Cerema `littoral.ts` [mesurée] | commune littorale | Etalab | **~littoral seulement (~1000 comm.)** | **Solide mais bornée littoral** |
| **Air (ATMO)** | `atmo.ts` [mesurée] | point → station/zone | ATMO | Indice quotidien rattaché commune ; stations éparses, valeur souvent zone | **Correcte, échelle station à dire** |
| **Eau potable / sécheresse** | Hub'Eau `eaufrance.ts` [mesurée] | commune/UDI/bassin | Etalab | Nitrates/bactério par UDI ; signal fort en zone agricole | **Correcte, lacunaire selon UDI** |
| **Cadmium / sols** | GisSol RMQS `gissol.ts` [mesurée éparse] | **département (fallback codé en dur)** | ouvert | **Médiane DÉPARTEMENTALE** masquée en commune | **Creux / fausse granularité (voir §3)** |
| **Pollens** | RNSA/ATMO `pollen.ts` [mesurée] | **zone (souvent département)** | RNSA | `code_zone` dept, fallback dept explicite dans le code | **Creux à l'échelle commune** |
| **Pollutions invisibles (IREP/SSP/friches)** | `irep.ts`/`populate-heritage-industriel.py`/`cartofriches.ts` [mesurée ponctuelle] | **point** | Etalab | Sites épars : **majorité de communes = 0 site** | **Signal fort mais rare → conditionnel** |
| **Dépendance auto** | MOBPRO+ADEME `populate-dependance-auto.js`, SNCF, OSM [déclarative+communautaire] | commune (OSM=point) | Etalab / **ODbL (OSM)** | % domicile-travail voiture sur **100 % communes**, différencié | **Solide partout** |

**Lecture d'ensemble Savoir×commune.** Trois régimes :
1. **Signal partout, honnête à la commune** : canicule (DRIAS), dépendance auto (MOBPRO). Ce sont
   les seuls thèmes où une page commune dit quelque chose de vrai ET différencié sur 34k communes.
2. **Signal conditionnel (présence/absence d'un aléa)** : inondation, submersion côtière, pollutions
   ponctuelles. Vrais et forts là où ils existent ; « rien à signaler » ailleurs.
3. **Fausse granularité** : cadmium (dept), pollens (zone). À l'échelle commune, ces deux thèmes
   répètent une valeur départementale — c'est précisément ce que `doctrine/data.md` interdit.

---

## 2. Agir × commune — la donnée ACTIONNABLE par commune, thème par thème

Question : au-delà de « voici l'état » (Savoir), existe-t-il une donnée qui **change l'action**
selon la commune, récupérable, à la commune, sous licence ouverte, fraîche ? Et sur combien de
communes dit-elle quelque chose de non trivial ?

### Inondation
- **Donnée actionnable par commune, intégrée :** statut PPRN (prescrit/approuvé) + arrêtés CatNat,
  via `georisques.ts` (GASPAR) — commune, Etalab, fraîcheur API tierce. **Vrai levier** : la page
  Agir générique dit « vérifiez si votre commune a un PPRN » ; Agir×commune **répond** (oui/non,
  zonage existant).
- **Actionnable NON intégré :** couverture Vigicrues par tronçon (récupérable, API SCHAPI),
  existence d'un PCS (pas de jeu national propre fiable), Fonds Barnier.
- **Thin content :** signal seulement sur communes à aléa inondation. Génération à **conditionner
  sur `flags.flood` ou ≥1 arrêté CatNat inondation**. Hors de là : page absurde (« rien à faire »).
- **Verdict : VIABLE SOUS CONDITION** (génération conditionnée sur le flag inondation). C'est le
  meilleur candidat de la matrice Agir×commune, car la donnée actionnable existe déjà et est
  réglementaire (opposable).

### Submersion côtière
- **VIABLE SOUS CONDITION, bornée littoral** (`littoral.ts`, ~1000 communes). Ailleurs : ne pas générer.

### Canicule / chaleur
- **Donnée intégrée :** DRIAS (projetée) — mais c'est de la donnée d'ÉTAT, pas d'action. L'actionnable
  par commune serait : registre communal des personnes vulnérables (obligation **universelle** →
  binaire, non différenciant), plan canicule (idem), ÎCU/îlot de chaleur (**réservé Logement/Santé,
  PAS exploitable à la commune** — victoire méthodo `icu_ilot_chaleur_data`, score dept-normalisé).
- **Thin content / doublon :** l'angle « vu cette commune » recyclerait le chiffre DRIAS déjà montré
  en Savoir → **doublon de données**, et les leviers (végétaliser, isoler) restent génériques.
- **Verdict : À NE PAS GÉNÉRER par commune** (au-delà du rappel DRIAS déjà porté par Savoir). La
  valeur ajoutée actionnable communale est quasi nulle ; l'ÎCU qui la porterait n'est pas utilisable
  à cette échelle.

### Cadmium / sols
- **Donnée :** GisSol RMQS = **médiane départementale codée en dur** (`DEPT_CADMIUM` dans `gissol.ts`,
  champ `source: "api" | "departement"`). RMQS ≈ une placette tous les 16 km (~2200 sites nationaux).
- **Thin content + fausse attribution :** 34k pages « cadmium à [commune] » afficheraient en réalité
  la **médiane du département**. C'est le cas d'école de la granularité département masquée en commune
  que `doctrine/data.md` règle 1 interdit. Et l'action (« faites analyser votre sol ») est générique.
- **Verdict : À NE PAS GÉNÉRER par commune. REFUS net.** (Voir victoire méthodo §5.)

### Pollutions invisibles (IREP / sites pollués SSP / friches)
- **Donnée intégrée :** IREP (`irep.ts`, point, lat/lon + distance), SSP sols pollués (point/commune),
  Cartofriches (point/commune) — Etalab. Récupérable, à la commune par rattachement spatial, frais.
- **Signal :** **fort et identitaire là où un site existe** (« 1 ICPE/site pollué à X km »), mais la
  **majorité des communes a 0 site** → « rien à signaler ».
- **Verdict : VIABLE SOUS CONDITION** — générer **uniquement** pour les communes avec ≥1 IREP/SSP/
  friche à portée (probablement quelques milliers, à compter avant génération). Ailleurs : thin content.
  Attention attribution : descriptif neutre, jamais d'inférence sanitaire à l'adresse.

### Feux de forêt
- **Donnée intégrée :** `flags.wildfire` = flag binaire GASPAR/PPRIF (`georisques.ts`, commune). PPRIF
  concentré sur l'arc méditerranéen + Landes/Gironde.
- **Actionnable NON intégré :** Obligations Légales de Débroussaillement (OLD) — réglementaire,
  zonage parcellaire, non câblé ; aléa feu DFCI/cartes départementales — non câblé.
- **Thin content :** signal sur une **minorité de départements**. Générer pour la Bretagne ou le Nord
  = absurde. À conditionner strictement sur `flags.wildfire`.
- **Verdict : VIABLE SOUS CONDITION (Sud/Sud-Ouest), À NE PAS GÉNÉRER ailleurs.** La page resterait
  pauvre tant que l'actionnable réel (OLD) n'est pas intégré : aujourd'hui on n'a qu'un flag binaire.

### Dépendance automobile
- **Donnée intégrée :** % domicile-travail voiture (MOBPRO, commune, Etalab, **partout différencié**),
  gares SNCF (point), réseau TC OSM. Solide.
- **Doublon majeur :** ces mêmes données alimentent déjà 3 critères du comparateur
  (`faible_dependance_auto`, `acces_transports`, `mobilite_quotidienne`). Risque de redite avec
  `/ou-vivre`, moins avec Savoir.
- **Actionnable NON intégré :** bornes IRVE (voir ci-dessous), lignes de bus précises.
- **Licence :** OSM = **ODbL** → attribution obligatoire + partage à l'identique (vigilance inventaire).
- **Verdict : VIABLE** (signal partout), mais l'angle « action » se limiterait à « as-tu une gare / un
  réseau TC » : intéressant, recoupe le moat horizontal. À cadrer pour ne pas dupliquer le comparateur.

### Voiture électrique
- **Donnée :** **IRVE non intégrée** (aucune lib/script `irve`/`borne`). Seul `zfe.ts` existe (ZFE,
  ~15 métropoles, EPCI). Donc **aucune donnée commune actionnable disponible aujourd'hui**.
- **Candidate :** jeu **IRVE data.gouv.fr** (« Infrastructures de Recharge pour Véhicules Électriques »,
  consolidé Etalab/Gireve, point géolocalisé, national, frais, licence ouverte) — récupérable, à la
  commune par rattachement, vrai signal (nb de bornes à portée). Non encore évalué en propre.
- **Verdict : À NE PAS GÉNÉRER aujourd'hui (donnée absente) → DIFFÉRER** jusqu'à évaluation+intégration
  IRVE. Sans IRVE, la page Agir×commune voiture électrique n'a aucun signal communal.

### Pollens
- **Donnée :** `pollen.ts` = `code_zone` **niveau zone/département** (fallback dept explicite). Fausse
  granularité commune, et action générique.
- **Verdict : À NE PAS GÉNÉRER par commune. REFUS** (même motif que cadmium).

---

## 3. Le piège transversal : granularité département/zone masquée en commune

Deux thèmes (cadmium, pollens) et un sous-cas (air ATMO = station/zone) produiraient des pages
commune qui **affichent en réalité une valeur départementale ou de zone**. C'est le risque n°1 de
`doctrine/data.md` (règle 1 : « une donnée communale n'est jamais présentée comme vraie à
l'adresse » ; ici c'est pire : ce n'est même pas communal). Générer 34k pages dessus = à la fois
**thin content** (même valeur répétée sur tout un département) ET **fausse attribution** (on laisse
croire à une mesure locale). Test de contrôle « à quelle échelle est-ce vrai ? » : département →
donc le quadrant Savoir/Agir × commune n'est PAS la bonne surface ; ces thèmes restent légitimes
en Savoir × thème (générique) avec une carte départementale assumée.

---

## 4. Classement final — génération viable / sous condition / à ne pas générer

| Thème | Savoir × commune (état) | Agir × commune (action) | Source / granularité décisive |
|---|---|---|---|
| **Canicule / chaleur** | **VIABLE** (DRIAS, partout) | **À NE PAS GÉNÉRER** (doublon DRIAS, ÎCU non exploitable, action générique) | DRIAS maille→commune |
| **Inondation** | **VIABLE** (là où aléa) | **VIABLE SOUS CONDITION** (flag flood / CatNat) — meilleur candidat | Géorisques GASPAR/PPRN, commune |
| **Submersion côtière** | VIABLE bornée littoral | VIABLE SOUS CONDITION (littoral) | Cerema, commune littorale |
| **Dépendance auto** | **VIABLE** (MOBPRO, partout) | **VIABLE** mais doublon comparateur à cadrer | MOBPRO commune ; OSM **ODbL** |
| **Pollutions invisibles** | VIABLE SOUS CONDITION (sites présents) | **VIABLE SOUS CONDITION** (≥1 site) | IREP/SSP/friches, **point** épars |
| **Feux de forêt** | VIABLE SOUS CONDITION (Sud) | VIABLE SOUS CONDITION (flag wildfire) — pauvre tant qu'OLD non câblé | GASPAR flag binaire, commune |
| **Air (ATMO)** | CORRECTE (échelle station à dire) | À NE PAS GÉNÉRER (action générique) | ATMO point→station |
| **Eau potable** | CORRECTE (selon UDI) | DIFFÉRER (signal réel mais action surtout nationale) | Hub'Eau commune/UDI |
| **Voiture électrique** | — | **DIFFÉRER** (IRVE non intégrée) | IRVE data.gouv à évaluer |
| **Cadmium / sols** | **À NE PAS GÉNÉRER** (dept masqué) | **REFUS** | GisSol RMQS = **médiane dept** |
| **Pollens** | **À NE PAS GÉNÉRER** (zone masquée) | **REFUS** | RNSA = zone/dept |

**Si l'on ne devait ouvrir qu'un seul Agir×commune : inondation.** C'est le seul où (a) la donnée
actionnable est déjà intégrée et réglementaire/opposable, (b) le signal différencie réellement les
communes, (c) la page générique Agir/inondation pose explicitement des questions (« votre commune
a-t-elle un PPRN ? Vigicrues couvre-t-il votre cours d'eau ? ») auxquelles la version commune
**répond** — la valeur ajoutée est nette, pas un doublon de Savoir.

---

## 5. Victoires méthodologiques (prêtes à graver dans `inventaire-sources.md`)

**REFUS — Cadmium par commune (Savoir et Agir).** GisSol RMQS est mesuré sur ~2200 placettes
(≈ 1 / 16 km) ; `gissol.ts` retombe sur une **médiane départementale codée en dur** (`DEPT_CADMIUM`).
Générer « cadmium à [commune] » sur 34k communes afficherait la valeur du département en la faisant
passer pour locale : thin content (répétition départementale) + fausse attribution (`doctrine/data.md`
règle 1). *Gain : on évite des milliers de pages indexables identiques par département et une
fausse précision qui détruirait la crédibilité. Le cadmium reste légitime en Savoir × thème, échelle
départementale assumée.*

**REFUS — Pollens par commune.** `pollen.ts` opère au `code_zone` (zone/département, fallback dept
explicite). Même motif. *Gain : périmètre commune préservé d'une fausse granularité.*

**À NE PAS GÉNÉRER — Canicule × commune (Agir).** La donnée d'état (DRIAS) est déjà portée par
Savoir×commune ; l'actionnable communal réel (ÎCU) est non exploitable à la commune (victoire
`icu_ilot_chaleur_data`) et les leviers restent génériques. Une page Agir canicule×commune serait un
doublon de données DRIAS. *Gain : on n'industrialise pas un doublon sur 34k pages.*

**DIFFÉRER — Voiture électrique × commune.** Aucune donnée IRVE intégrée (seul ZFE, ~15 métros). Le
quadrant est vide de signal communal tant qu'IRVE (data.gouv, Etalab, point, national) n'est pas
évaluée puis intégrée. *Gain : on ne crée pas une page « action » sans donnée pour la nourrir ; on
nomme la dépendance (intégrer IRVE d'abord).*

**CONDITION DE GÉNÉRATION — règle anti-thin-content.** Pour inondation, submersion, pollutions,
feux : ne générer la page commune que si la donnée porte un signal (flag d'aléa présent, ≥1 site/
arrêté). La génération aveugle thème×34k est refusée. *Gain : le domaine n'est pas plombé par des
milliers de « rien à signaler ».*

---

## 6. Cohérence avec la doctrine (tensions posées, non tranchées)

- **ADR-0001 (pas de score) :** la page Savoir×commune actuelle (`communes_tension`, score/100 +
  4 sous-scores) **contredit** l'ADR. À re-fonder sur la donnée honnête avant tout élargissement.
  → choix à poser à l'humain : re-câbler la couche gratuite sur DRIAS/Géorisques/MOBPRO racontés à
  leur échelle, ou garder un artefact interdit en surface SEO ? (Je recommande le re-câblage.)
- **`doctrine/data.md` (granularité) :** cadmium/pollens/ICU = département/zone → interdits en commune.
- **OSM = ODbL :** dépendance auto (réseau TC) impose attribution + partage à l'identique si exposée.
- **Doublon Savoir/Agir (§0.2) :** la séparation doit être éditoriale (état vs action), jamais
  prétendre que ce sont deux jeux de données. Tension avec le Discoverability Strategist (réplicabilité)
  et l'Editorial (voix) : à eux de dire si deux pages sur la même donnée se justifient. Moi je dis :
  la donnée ne se dédouble pas.

---

## 7. Mise à jour de l'inventaire (`inventaire-sources.md`) — prêt à écrire

- **Section « Victoires méthodologiques » :** ajouter les 3 refus/reports du §5 (cadmium commune,
  pollens commune, IRVE différée) + la règle anti-thin-content.
- **Table inventaire :** annoter `gissol.ts` et `pollen.ts` « échelle EFFECTIVE = département/zone
  (fallback codé) → interdites en surface commune » (la colonne Échelle actuelle dit « maille sols » /
  « zone » mais ne signale pas que la page commune les masquerait).
- **Gaps / candidates :** ajouter **IRVE (data.gouv, Etalab, point, national)** comme source candidate
  à évaluer si Agir×commune voiture électrique est priorisé ; **Vigicrues/SCHAPI** (couverture tronçons)
  et **OLD feux** comme actionnables non câblés conditionnant la richesse d'Agir×commune inondation/feux.
- **Note ADR-0001 :** tracer que la surface Savoir×commune repose encore sur `communes_tension` (score),
  à re-fonder.

---

## 8. La version minimale (≈90 % de la valeur, plus petite incarnation)

**N'ouvrir qu'UN quadrant Agir×commune : inondation, et seulement pour les communes à signal
(flag flood / CatNat).** Re-fonder en parallèle la couche gratuite Savoir×commune sur les données
honnêtes (retirer le score/100). Tout le reste de la matrice Agir×commune (canicule, cadmium, pollens,
air, voiture électrique) reste fermé : soit fausse granularité, soit doublon, soit donnée absente.
Cette incarnation capture l'essentiel de la valeur « agir vu cette commune » là où la donnée la porte
vraiment, sans ouvrir 7 thèmes dont 4 produiraient du thin content. Je borne au choix de la donnée :
le design de la page et la décision d'accès payant relèvent de l'orchestrateur / Discoverability /
Product.

## 9. Quand rouvrir ce sujet ?

- **Cadmium / pollens / ICU par commune** → rouvrir si une source NATIVE à la commune apparaît
  (RMQS densifié, cartographie pollens fine, ÎCU LCZ communalisé). Tant que c'est dept/zone : fermé.
- **Voiture électrique** → rouvrir dès qu'IRVE data.gouv est évaluée et intégrée (point, national,
  frais) : le quadrant devient alors VIABLE SOUS CONDITION (≥1 borne à portée).
- **Feux × commune** → passer de SOUS CONDITION à VIABLE le jour où OLD et/ou aléa feu DFCI sont
  câblés (l'actionnable réel, au-delà du flag binaire).
- **Doublon Savoir/Agir** → si une page commune génère beaucoup de trafic mais un taux de rebond
  élevé / cannibalisation SEO mesurée par le Discoverability Strategist, reconsidérer la séparation
  des deux récits.
- **Score `communes_tension`** → dès qu'on re-câble Savoir×commune sur la donnée honnête, retirer la
  dépendance à la table legacy et tracer le retrait.
