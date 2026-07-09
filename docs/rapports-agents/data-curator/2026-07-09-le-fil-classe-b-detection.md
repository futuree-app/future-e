# Le Fil — Classe B (signaux éditoriaux) : la DÉTECTION est-elle sourçable ?

> Data Curator, 2026-07-09. Read-only. Lentille unique : faisabilité de l'AMONT (sourcer/détecter),
> pas le traitement aval (déjà bien décrit par ChatGPT). Confronté au CODE (`src/lib/{georisques,
> irep,gissol,cartofriches,atmo}.ts` — présents) et à la SOURCE (data.gouv arrêtés préfectoraux,
> baignade, 2026-07-09). Complète mon rapport Classe A `2026-07-09-le-fil-fiabilite-sources.md`.

---

## VERDICT (en tête)

**La Classe B N'EST PAS un produit sourçable par un système. C'est une belle doctrine dont
l'amont dépend du hasard — et il faut l'assumer comme telle, pas la maquiller en pipeline.**

La détection classe B se scinde en deux, et AUCUNE des deux ne donne un flux automatisable
honnête :

1. **Les inventaires d'ÉTAT semi-structurés** (sites pollués SSP/SIS via Géorisques, IREP/BDREP
   émissions, baignade sante.gouv, ARS robinet SISE-Eaux) existent et sont captables — mais ce
   sont des **états, pas des événements**. Les differ pose exactement le problème de faux positifs
   de re-publication que j'ai déjà tranché en DIFFÉRÉ pour les couches structurées Géorisques. Et
   ils appartiennent au **module Santé**, pas au Fil. Ce ne sont pas des « signaux éditoriaux
   ponctuels » : c'est du stock, déjà couvert (ou à couvrir) ailleurs.

2. **Le vrai signal éditorial** (les fûts radioactifs, un rapport ANSES, un avis ASNR, une
   controverse documentée) **n'a AUCUN flux géo-rattaché**. Les agences publient bien (ANSES,
   ASNR, BRGM, Ifremer, Santé publique France) mais à l'échelle **nationale/thématique, sans tag
   commune**. Le rattachement « fûts Atlantique → La Rochelle » est un acte d'INTERPRÉTATION
   humaine, pas une jointure. C'est irréductiblement de la curation manuelle.

**Par quoi commencer : PAS par une ingestion. Par un JOURNAL éditorial tenu à la main** — le
curateur inscrit une entrée datée, sourcée, tag-géo quand un signal sérieux arrive. Le seul
amont semi-automatisable est une **watchlist de ~8 flux d'autorité** (RSS/pages agences) triée
par un humain : un ASSISTANT à la curation, jamais une détection. Et la promesse doit dire
« quand une information sérieuse nous parvient », **jamais** « nous surveillons tout ».

---

## Q1 — Sources classe B semi-structurées et fiables : le tri source par source

Vérifié sur data.gouv (2026-07-09) et sur le code existant. Verdict par source :

| Source | Format réel | Granularité géo | Cadence | Nature | Captable comme FLUX du Fil ? |
|---|---|---|---|---|---|
| **Préfecture — arrêtés ICPE / épisode pollution / AEP / baignade** | RAA = **PDF** par département ; sur data.gouv, SEULS des jeux « biotope » existent (vérifié : 8/28 = tous biotope, aucun ICPE/pollution/AEP, aucun à cadence régulière) | dept → point | irrégulier | réglementaire ponctuel | **NON.** Pas de flux structuré. Le RAA est du PDF non normalisé. C'est LE trou. |
| **Sécheresse (VigiEau/Propluvia)** | API | zone→commune | temps réel | réglementaire | OUI — mais c'est de la **Classe A**, déjà cadrée (priorité 2 MVP). |
| **CatNat (GASPAR)** | API, clé `code_national_catnat` | commune | flux | réglementaire | OUI — **Classe A**, socle MVP. |
| **Sites pollués SSP / ex-BASOL, SIS** | CSV national + API Géorisques (~11 200 sites) | point | inventaire (maj lentes) | ÉTAT historique | Diffable en théorie, mais **état≠événement** + **frontière Santé** (cf. `idee_sante_environnementale`, décision 2026-06-25). Pas un signal éditorial. |
| **IREP / BDREP (émissions industrielles)** | `irep.ts` câblé ; dataset ADEME `sbq7rbqfr5yfhmm7gj9wf65v` | établissement | **annuel** (déclaration N-1) | déclaratif | Cadence annuelle = pas une veille. Frontière Santé. Non. |
| **Baignade** | national = baignades.sante.gouv.fr ; sur data.gouv = **fragmenté** par collectivité (Haut-Léon, Saint-Malo, AMP… vérifié) | site | saisonnier | mesuré (état) | État sanitaire saisonnier, frontière Santé, pas un événement du Fil. Non. |
| **ARS robinet (SISE-Eaux)** | Hub'Eau `qualite_eau_potable`, `eaufrance.ts` câblé | commune | continu | mesuré | Déjà à Santé (décision 2026-06-29). Non pour le Fil. |
| **ANSES** | site + actualités (RSS/pages) | **national, aucun tag commune** | ponctuel | publication scientifique | **Amont possible en watchlist**, mais rattachement géo = 100 % humain. Pas un flux géo. |
| **ASNR (ex-IRSN/ASN, fusionnés 2025)** | publications/avis, pages | **national/site nucléaire** | ponctuel | avis d'autorité | Idem : national ou site précis, jamais commune-générique. Watchlist humaine. |
| **BRGM / InfoTerre (hors CatNat)** | publications + couches | national/point | ponctuel | scientifique | Les couches = état (différé) ; les publications = watchlist humaine. |
| **Ifremer** | publications, communiqués | national/façade maritime | ponctuel | scientifique | **Le cas des fûts vient d'ici** : façade « Atlantique NE », pas commune. Watchlist humaine. |
| **Santé publique France** | communiqués, BEH | national/région | ponctuel | épidémiologie | Régional au mieux. Watchlist humaine. |
| **Légifrance / Bulletin officiel** | API DILA (Légifrance) | national | flux | réglementaire | Existe et structuré, mais volume national énorme, non tagué commune, tri = travail humain massif. Non pour un solo. |
| **HAL / revues** | API HAL | aucune | flux | scientifique brut | Trop en amont, non filtré, non géo. Non (relève du Researcher, pas du Fil). |

**Conclusion Q1** : les seules sources classe B réellement **structurées** sont soit déjà de la
Classe A (sécheresse), soit des **inventaires d'état côté Santé** (dont la diffabilité est le
problème que j'ai déjà mis en DIFFÉRÉ), soit des **publications nationales non géo-rattachées**.
**Aucune ne délivre un signal éditorial ponctuel, géo-rattaché à la commune, en flux.** Le vrai
gisement (arrêtés préfectoraux locaux) n'est pas exposé en flux : il dort dans des PDF
départementaux.

---

## Q2 — La part irréductible « presse / signaux faibles »

Le signal des fûts est arrivé par **alerte perso**. C'est le prototype de la classe B pure : pas
de source structurée, seulement de la presse et de la publication d'autorité non géo-taguée.

Peut-on la capter de façon fiable ?

- **Agrégateurs de presse / alertes type Google** : possibles pour amorcer, mais rappel et
  précision médiocres. Rappel biaisé vers le médiatisé (grandes villes, littoraux), silence total
  sur le rural. Précision polluée par le bruit (homonymies de communes, reprises multiples d'un
  même fait, marronniers). Ce n'est pas une détection, c'est une pêche.
- **LLM + recherche web** : utilisable comme ASSISTANT de tri, **jamais comme source**. Risque
  majeur et rédhibitoire pour futur•e : **source hallucinée / fait inventé**. Un Fil qui affirme
  un événement local faux détruit la seule chose que je protège (la vérité). Un LLM ne peut que
  **proposer des pistes à un humain qui vérifie la source primaire**, jamais publier.
- **Taux réaliste** : recall faible et surtout **non mesurable** (on ne connaît pas le
  dénominateur des vrais signaux). Précision acceptable UNIQUEMENT si un humain valide chaque
  entrée contre la source primaire. Donc : **c'est un vœu tant qu'il n'y a pas un humain au
  bout.** Avec un humain au bout, c'est un plan — mais un plan de curation, pas de détection.

**Conclusion Q2** : la part presse/signaux faibles n'est captable QUE via un humain qui vérifie
la source primaire. Aucune automatisation ne peut publier seule sans trahir la fiabilité.

---

## Q3 — Couverture et coût pour un fondateur solo

- **Volume national de vrais signaux classe B** (rapport ANSES marquant, avis ASNR, pollution
  révélée, controverse documentée, publication BRGM/Ifremer à portée territoriale) : ordre de
  grandeur **quelques par semaine au niveau national**, dont une **fraction seulement**
  géo-rattachable à un ensemble de communes identifiable. Beaucoup sont nationaux (donc touchent
  « toutes les communes » de façon diluée = non actionnable) ou pointent un site précis (donc peu
  de communes).
- **Charge humaine de curation** : gérable en volume brut (quelques/semaine), mais le coût réel
  n'est pas la lecture — c'est le **rattachement géographique honnête** (à quelles communes ce
  fait s'applique-t-il vraiment ? les fûts « Atlantique NE » = tout le littoral atlantique ou
  seulement les ports ?) et la **vérification de la source primaire**. C'est du travail expert,
  non délégable, non parallélisable.
- **Biais de couverture — le point dur** : la couverture serait **structurellement inégale**.
  Grandes villes et littoraux médiatisés : bien couverts. **Rural silencieux : jamais couvert**,
  non parce qu'il ne se passe rien, mais parce que rien n'est publié/repris. Le Fil classe B
  refléterait la **carte de l'attention médiatique**, pas la carte du risque réel. C'est un biais
  que je ne peux pas laisser passer sans le nommer dans la promesse.

---

## Q4 — Conséquence sur la PROMESSE (honnêteté)

La détection étant **incomplète et biaisée par construction**, une seule promesse est tenable :

- **Frontière honnête** : « **Quand une information sérieuse et vérifiée nous parvient sur votre
  territoire, nous vous la signalons, datée et sourcée.** » JAMAIS « nous surveillons tout / une
  vigilance permanente / rien ne vous échappe ».
- **Le silence n'est PAS un signal de sécurité.** Sur une commune, l'absence d'entrée classe B
  signifie **« nous n'avons rien vu »**, pas **« il ne se passe rien »**. Ce doit être écrit
  explicitement, sinon le Fil ment par omission — le pire pour un produit de confiance (un
  utilisateur rural conclurait « tout va bien » alors que personne ne regarde chez lui).
- **Cohérence ADR-0001** : le classe B reste **un fait daté, attribué, à son échelle** — jamais
  agrégé en « niveau de vigilance » du lieu. Un rapport ANSES national marqué sur une commune ne
  doit pas gonfler un score.
- **Attribution** : source primaire nommée (ANSES, ASNR, Ifremer, BRGM…), jamais Callendar,
  jamais un acteur commercial intéressé présenté comme neutre (`feedback_callendar`,
  `feedback_statistiques_marketing_climat`). L'échelle du fait doit être portée dans le récit
  (« observé sur la façade atlantique » ≠ « à La Rochelle »).
- **Frontière Santé** : tout ce qui est pollution/sols/industrie/radon/eau relève du **module
  Santé** (`idee_sante_environnementale`, `exposition_industrielle`, décision 2026-06-29). Le Fil
  classe B **empiète** dès qu'il touche un site pollué ou une émission : la règle est que le Fil
  porte l'**événement daté** (« telle info vient de paraître »), Santé porte l'**état** (« voici
  l'exposition de ce lieu »). Ne pas re-scorer dans le Fil ce que Santé décrit déjà.

---

## Version minimale (~90 % de la valeur)

**Un journal éditorial classe B tenu à la main, zéro ingestion**, avec trois disciplines :
1. une **entrée = un fait daté + source primaire vérifiée + tag communes assumé** (le
   rattachement est un choix explicite, pas une magie) ;
2. **appuyé par une watchlist de ~8 flux d'autorité** (ANSES, ASNR, BRGM, Ifremer, Santé publique
   France, + 2-3 selon actualité) que le curateur balaye — un **assistant de veille**, pas un
   détecteur ;
3. **la mention de couverture** affichée partout : « signalé quand une info sérieuse nous
   parvient ; l'absence ne vaut pas absence de risque ».

C'est la plus petite forme qui capture la valeur (un signal rare mais juste et sourcé) sans
promettre l'exhaustivité qu'aucun pipeline ne peut tenir. Le design/l'orchestration de ce journal
ne relèvent pas de ma lentille : je borne le périmètre de SOURCE, pas l'UX.

---

## Cohérence doctrinale (tensions posées, non tranchées)

- **Le moat = la transformation (ADR-0002)** : pour la classe B, la transformation est le
  **rattachement géographique honnête + la vérification de source**, actes 100 % humains. Le
  produit doit valoriser CE travail, pas prétendre à une couverture machine.
- **Tension Business/Product** : la classe B est séduisante pour justifier un abonnement
  (« veille vivante »). Mais mon chiffre classe A montrait déjà le Fil sous le seuil abonnement ;
  la classe B **n'ajoute pas un flux fiable**, elle ajoute un travail humain non scalable et
  biaisé. Fonder un abonnement sur une vigilance qu'on ne peut pas tenir = trahir la promesse.
  Je pose l'arbitrage à l'humain, je ne le tranche pas.
- **Tension Researcher** : HAL/revues/presse sont son terrain d'OUVERTURE (divergence), pas une
  source du Fil. La classe B éditoriale est la zone où Researcher produit et où je refuse de
  publier sans convergence vérifiée. Ne pas confondre « piste captée » et « signal publiable ».

---

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

Ajouter à la section « victoires méthodologiques » de `inventaire-sources.md` :

| Source | Décision | Pourquoi | Gain (dette évitée) |
|---|---|---|---|
| **Arrêtés préfectoraux locaux (ICPE/pollution/AEP/baignade) comme flux du Fil** | REFUSÉ | pas exposés en flux structuré (data.gouv = seuls jeux « biotope », aucun opérationnel à cadence ; le RAA départemental est du PDF non normalisé) | évite de bâtir un scraper PDF fragile 100+ départements pour un signal qu'on ne pourra pas fiabiliser |
| **Publications d'autorité (ANSES/ASNR/BRGM/Ifremer/SpF) comme flux géo du Fil** | REFUSÉ comme flux, RETENU comme watchlist humaine | publiées au niveau national/site, **sans tag commune** ; le rattachement territorial est un acte d'interprétation humaine (cas fûts radioactifs → littoral) | évite la fausse promesse d'ingestion automatique ; cadre la classe B comme curation assistée |
| **Détection classe B par LLM+web / agrégateur presse** | REFUSÉ comme source publiable | risque de source hallucinée = destruction de la fiabilité ; rappel biaisé médiatique, rural silencieux ; taux non mesurable | protège la vérité (ma raison d'être) ; l'IA reste un assistant de tri, jamais un émetteur |

Et une ligne de doctrine : **« Le Fil classe B = journal éditorial curé à la main (fait daté +
source primaire + tag géo assumé), assisté d'une watchlist d'autorités. Promesse honnête :
"quand une info sérieuse nous parvient", jamais "nous surveillons tout". Le silence sur une
commune = "on n'a rien vu", pas "rien". Frontière Santé : le Fil porte l'ÉVÉNEMENT daté, Santé
porte l'ÉTAT — ne pas re-scorer. »**

---

## Quand rouvrir ce sujet

- **Arrêtés préfectoraux** : si un portail national expose les RAA en **structuré et géo-tagué**
  (au-delà de la sécheresse déjà couverte) — réévaluer, ce serait le meilleur flux classe B.
- **Publications d'autorité** : si une agence publie un flux avec **métadonnée géographique
  exploitable** (code INSEE / façade / bassin normalisé) — la watchlist pourrait devenir
  semi-automatique en amont (l'humain resterait au rattachement fin).
- **Volume** : si l'instrumentation montre >1 signal classe B géo-rattachable par commune et par
  an sur un segment, la thèse « veille vivante » redevient discutable sur CE segment.
- **Sites pollués / émissions** : si le module Santé les expose proprement à la commune, un
  **diff d'inventaire** (nouveau site SSP, nouvelle déclaration IREP) pourrait alimenter le Fil
  comme événement — à condition de résoudre la diffabilité (faux positifs de re-publication) déjà
  mise en DIFFÉRÉ pour les couches Géorisques.
- **Fiabilité LLM** : si un dispositif de vérification de source primaire automatisé et prouvé
  émerge (chaque affirmation gagée sur une URL primaire vérifiée), rouvrir l'assistance au tri —
  jamais l'émission autonome.

*Avis daté du 2026-07-09. Vérifs directes : data.gouv arrêtés préfectoraux (8/28 = biotope,
aucun opérationnel à cadence) et baignade (fragmenté par collectivité). Les URLs RSS agences
testées ont renvoyé 404 sur URL devinée : l'existence de pages d'actualité/RSS est admise, mais
le point tranchant — absence de tag commune — ne dépend pas de ces feeds.*
