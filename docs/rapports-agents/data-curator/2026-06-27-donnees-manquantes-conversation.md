# Rapport Data Curator — données manquantes du test réel « Brest vs Lorient » (2026-06-27)

> Mandat : 4 sources candidates issues du dogfood. Question-mère : *cette donnée mérite-t-elle
> d'entrer dans le système de décision, et si oui comment l'utiliser honnêtement ?*
> Read-only. Je n'intègre rien : je pose les choix à l'humain.

## Ce que j'ai réellement inspecté dans le repo (vérité vivante du code)

- `data/comparateur-index.json` — schéma d'une commune (Brest 29019) : `population` (commune
  seule), `uu` (code UU2020, ex. 29701), `clim` (indicateurs DRIAS), `viv` (pm25/no2/apl/
  éloignement, source ADEME data_communes), `logement`, etc. **Pas** de pop d'agglo, **pas** de
  HLM, **pas** d'ensoleillement réel.
- `src/lib/comparateur-vie.ts` (l. 970-975) : le critère **`ensoleillement_recherche` existe
  déjà** mais c'est un PROXY : `0.45 × percentile(température été JJA) + 0.55 × (100 −
  percentile(pluie annuelle mm))`. Labels montrés à l'utilisateur (l. 1107) : « Chaud et
  ensoleillé / Ensoleillement modéré / **Frais et peu ensoleillé** », aide = « Le caractère
  ensoleillé… ».
- `scripts/build-comparateur-index.mjs` (l. 42) : `NORRR_yr` commenté « **proxy
  ensoleillement/sécheresse perçue** ». Aveu en clair que la pluie-volume sert d'ersatz de soleil.
- `data/drias_median_metadata.json` : 30 indicateurs DRIAS. **Aucun** n'est l'ensoleillement ni
  le nombre de jours de pluie ≥1 mm. On a `NORRR_yr` (cumul mm), `NORRR_seas`, `NORRRq99`,
  `NORRx1d` (intensité) — le VOLUME et l'INTENSITÉ, jamais la FRÉQUENCE ni la LUMIÈRE.
- `data/uu2020.xlsx` : feuille `UU2020` = liste des unités urbaines avec `TUU2017` (tranche de
  taille INSEE 1-8) et `NB_COM`, **mais pas la population de l'UU**. Feuille
  `Composition_communale` = mapping commune→UU déjà exploité par `populate-unite-urbaine.py`.
- `src/lib/commune-data.ts` (l. 68-69, 101-102, 179) : ADEME data_communes expose **déjà**, à la
  maille **commune** : `nombre_de_logements_sociaux_rpls_2023` (RPLS 2023) et
  `taux_de_logements_sociaux_percent`. Fetchés dans le rapport, **absents de l'index comparateur**.
- `src/lib/eaufrance.ts` : Hub'Eau ne couvre que eau potable (nitrates/conformité) + ONDE
  (sécheresse). **Confirmé : aucune baignade.**

Conséquence transversale : sur 4 « trous », **2 sont des dérivations/câblages internes
(UU, HLM)** sans nouvelle source, et **1 révèle une dette doctrinale déjà en prod**
(le faux « ensoleillement »).

---

## Source 1 — Ensoleillement (h/an) + nombre de jours de pluie ≥1 mm — Météo-France normales

- **Source** : Normales climatiques 1991-2020, Météo-France (meteo.data.gouv.fr / fiches
  climatologiques). Variables visées : `DUREE_INSOLATION` (h/an) et `NBJRR1` (nb jours RR≥1 mm).
- **Problème résolu / décision** : OUI, le plus criant. Le cliché « il pleut en Bretagne » porte
  sur la **fréquence des jours gris + la lumière**, PAS sur le volume. Le porteur a dû combler de
  mémoire (~1550 h Brest vs ~2250 h La Rochelle) = hors-produit non sourcé. C'est exactement le
  contraste que futur•e revendique de raconter honnêtement (« vrai pour Brest, faux pour Lorient »).
- **Doublon** : NON sur le fond, mais **collision frontale avec un proxy malhonnête déjà en prod**.
  Le critère `ensoleillement_recherche` AFFICHE « ensoleillement » / « peu ensoleillé » alors
  qu'il MESURE température été + pluie-volume. C'est une **attribution fausse** (`doctrine/
  data.md` : « à quelle échelle / sur quoi cette affirmation est-elle vraie ? » → la réponse
  honnête est « ce n'est pas du soleil »). La vraie normale d'insolation **corrige** cette dette,
  elle ne s'y ajoute pas.
- **Type** : **mesurée / historique** (normale observée 1991-2020). Donc PIÈGE de temporalité :
  ne JAMAIS la mettre sous le sélecteur d'horizon DRIAS (2030/2050/2100). C'est un point de
  départ observé, pas une projection (`doctrine/data.md`, section horizon). DRIAS ne projette pas
  l'insolation : on assume « observé récent », sans trajectoire.
- **Échelle & granularité** : **station**, pas commune. Réseau insolation **clairsemé** (héliographe/
  pyranomètre = quelques centaines de stations, bien moins dense que la pluie). Rattachement
  honnête = station de référence la plus proche, en **nommant la station et sa distance**, jamais
  « à votre adresse ». NBJRR1 est plus dense (plus de postes pluvio). Affirmation vraie à l'échelle
  « bassin climatique local », pas communale fine.
- **Licence** : données publiques Météo-France ouvertes depuis le 01/01/2024 → **Licence Ouverte
  Etalab 2.0** (à reconfirmer sur la fiche meteo.data.gouv.fr exacte au moment du build ; mes
  WebFetch n'ont pas rendu la métadonnée propre, à vérifier d'un clic). Aucune contrainte de
  partage à l'identique (≠ OSM/ODbL).
- **Couverture** : sous-ensemble de stations, **pas 34 000 communes**. Assumé : on interpole/
  rattache, on ne prétend pas une valeur par commune. Pour le scoring national, c'est une limite
  réelle (trous = stations manquantes → valeur héritée de la station proche).
- **Coût de maintenance** : **faible**. Normale figée (1991-2020), build statique, pas d'API live.
  Re-téléchargement seulement au prochain millésime de normales (~tous les 10 ans). Si elle
  disparaissait : on reviendrait au proxy malhonnête → perte = l'honnêteté du critère climat.
- **Criticité** : **enrichissement** (le produit survit sans), mais à fort effet de vérité : elle
  transforme un critère faux en critère vrai. Atypique : un enrichissement qui paie une dette.
- **Comment la raconter honnêtement** :
  - Renommer/reseparer : un critère **« Ensoleillement »** adossé à `DUREE_INSOLATION` mesurée, et
    laisser la fréquence de pluie (NBJRR1) raconter « jours gris ». Cesser de faire dire « soleil »
    à la pluie-volume.
  - Formuler « mesuré, normale 1991-2020, station X à N km », jamais d'horizon futur.
  - Reste **non directionnel** (préférence, pas avantage universel) — cohérent avec l'actuel
    `directionnel:false`, donc pas de gagnant, pas de note (`ADR-0001`).
- **Verdict** : **INTÉGRER** — surface : scoring climat `/ou-vivre` (refonte du critère existant) +
  rapport Territoire. Angle : **réparer le proxy**, pas empiler. C'est la candidate n°1.

## Source 2 — Qualité des eaux de baignade — Ministère de la Santé (SISE-Baignades, 2006/7/CE)

- **Source** : classement annuel des eaux de baignade (Excellent/Bon/Suffisant/Insuffisant,
  directive 2006/7/CE) + résultats par site. **Producteur autorité = Ministère de la Santé /
  ARS** (baignades.sante.gouv.fr, base SISE-Baignades).
  ⚠️ **Piège de publication** : les reposts data.gouv « Ressourcerie datalocale » que j'ai
  inspectés sont des miroirs « licence non spécifiée », métadonnée 11 %. **Ne pas s'y câbler** :
  prendre la source **canonique du Ministère** (Licence Ouverte). Choisir l'éditeur faisant
  autorité fait partie du travail de curation.
- **Problème résolu** : OUI, a manqué **deux fois** (algues vertes baie de Saint-Brieuc, « plages
  polluées ? »). Critère de décision réel pour un projet de vie **littoral**.
- **Doublon** : NON. Hub'Eau (`eaufrance.ts`) = eau potable + sécheresse, jamais baignade. Aucun
  recouvrement.
- **Type** : **mesurée + réglementaire** (classement administratif pluriannuel sur 4 saisons).
  Impose un récit « classement officiel », opposable, daté de la saison.
- **Échelle & granularité** : **site de baignade (point)**, pas commune. Une commune peut avoir 0,
  1 ou plusieurs sites de classements différents. Mapping site→commune nécessaire, en **nommant le
  site**, sans agréger en une note communale (ce serait inventer une moyenne).
- **DEUX pièges d'honnêteté majeurs** (sinon refus) :
  1. **Classement pluriannuel ≠ pollution ponctuelle.** « Excellent » est une synthèse sur 4 ans ;
     une plage Excellente peut être fermée 48 h après un orage (débordement réseau). Ne jamais
     laisser entendre « sûr aujourd'hui ». Dire « classement officiel de la saison », renvoyer au
     temps réel ARS pour le jour J.
  2. **Les algues vertes ne sont PAS dans ce classement.** L'eutrophisation/ulves est un autre
     phénomène (azote/nitrates, déjà tangentiellement via Hub'Eau nitrates). Promettre « algues
     vertes » via la baignade serait une **attribution fausse**. À traiter séparément si un jour.
- **Licence** : Licence Ouverte côté source ministérielle (à confirmer sur la fiche canonique).
- **Couverture** : **sous-ensemble assumé** — uniquement communes avec site de baignade recensé
  (mer + lacs/rivières, ~3 400 sites). Hors-sujet pour l'intérieur des terres. Donc **pas un
  critère de scoring national** : non comparable entre une commune littorale et une commune sans
  eau de baignade (absence ≠ mauvais).
- **Coût de maintenance** : **moyenne** — actualisation saisonnière, structure de la base SISE à
  surveiller. Statique annuel suffit (le classement, pas le temps réel). Si elle disparaissait :
  perte d'un signal littoral, le produit reste entier ailleurs.
- **Criticité** : **enrichissement**, ciblé littoral.
- **Comment la raconter honnêtement** : au **rapport** (module Santé / cadre de vie), pour les
  communes concernées, « classement directive 2006/7/CE, saison AAAA, site X : Excellent ».
  Jamais au scoring national `/ou-vivre` (non universel). Mention « ne préjuge pas d'une fermeture
  ponctuelle ».
- **Verdict** : **INTÉGRER au RAPPORT (littoral), DIFFÉRER au moteur de scoring.** Surface : Santé/
  cadre de vie, communes à site de baignade. Angle : signal réglementaire daté et localisé, pas
  une note de plage.

## Source 3 — Population d'unité urbaine / « taille vécue »

- **Source** : aucune nouvelle. **Dérivation** de l'existant : somme des `population` (index) par
  code `uu`, + tranche INSEE `TUU2017` déjà dans `uu2020.xlsx`.
- **Problème résolu** : OUI. « Est-ce une grande ville ? » se joue sur la taille **vécue**, pas la
  commune. Le porteur a corrigé à la main 3-4 fois l'écart commune↔agglo (Brest 140k / ~210k aire ;
  Bordeaux 262k / 820k). Note : le critère `eviter_isolement` (l. 963) utilise déjà `tailleVille(c)`
  « taille d'agglomération » — donc une notion de taille agglo existe DÉJÀ en interne mais n'est ni
  exposée ni nommée en habitants.
- **Doublon** : partiel — la logique de taille agglo existe ; ce qui manque c'est **le chiffre
  d'habitants de l'UU exposé**.
- **Type** : **déclarative / calculée** (agrégat INSEE). Récit « à l'échelle de l'agglomération ».
- **Échelle & granularité** : UU = enveloppe de continuité du bâti. **Honnêteté n°1 : ne pas
  confondre 3 définitions** — commune ≠ **unité urbaine (UU2020)** ≠ **aire d'attraction des villes
  (AAV)**. On a **UU2020 sur disque, PAS l'AAV**. L'AAV (qui inclut les couronnes périurbaines) est
  une 4e donnée, plus large, **non présente** : ne pas la prétendre. Choisir UU, la **nommer**
  (« unité urbaine », « agglomération »), pas « aire urbaine » (terme AAV).
- **Licence** : INSEE / Licence Ouverte. RAS.
- **Couverture** : nationale (toute commune dans une UU ; les communes hors UU = « H » sont
  isolées, à afficher comme telles, pas 0).
- **Coût de maintenance** : **faible** — dérivé au build de l'index, millésime UU2020 déjà figé.
  Piège connu déjà géré par `populate-unite-urbaine.py` : arrondissements PLM (Paris/Lyon/Marseille)
  → UU parente.
- **Criticité** : **enrichissement** à fort confort décisionnel.
- **Comment la raconter honnêtement** : exposer « commune : 140k hab / agglomération (UU) : ~210k »,
  les deux chiffres côte à côte, étiquetés. Alternative robuste sans agrégation : afficher la
  **tranche INSEE TUU** (« grande agglomération ») qui est un label officiel. Non directionnel
  (grande ville n'est ni bien ni mal).
- **Verdict** : **INTÉGRER** — surface : champ `popUU` + label tranche dans l'index, exposé au
  comparateur et au rapport. Quasi zéro coût, forte valeur. Bien border le vocabulaire UU vs AAV.

## Source 4 — Logement social / taux HLM

- **Source** : aucune nouvelle. **Déjà fetché** dans `commune-data.ts` via ADEME data_communes :
  `taux_de_logements_sociaux_percent` + `nombre_de_logements_sociaux_rpls_2023` (RPLS 2023), maille
  **commune**. Absent uniquement de l'**index comparateur**.
- **Problème résolu** : demandé explicitement (volet « politique du logement »). Partiel : un taux
  HLM ne dit pas une « politique », il en est une trace.
- **Doublon** : il existe aussi un `taux_hlm` à l'IRIS (`commune-data.ts` l. 47/88, IRIS agrégé).
  **Ne pas empiler** : pour le comparateur, la maille commune RPLS suffit ; l'IRIS reste au rapport
  fin. Une seule histoire par surface.
- **Type** : **déclarative / transactionnelle** (parc recensé RPLS). Récit « part du parc, commune ».
- **Échelle & granularité** : commune (RPLS 2023). Honnête.
- **PIÈGE d'honnêteté décisif** : le **taux HLM nu est trompeur**. L'obligation SRU (20/25 %) ne
  s'applique qu'aux communes en agglo de >3 500 hab (>1 500 IDF) ; pour une commune rurale, un taux
  bas/0 n'est NI une carence NI un choix politique. Et surtout : **plus de HLM n'est ni « bien » ni
  « mal » universellement** → ce n'est **PAS un critère de scoring directionnel** (`ADR-0001` :
  pas de note, et ici pas de « gagnant »). C'est un fait de composition, à exposer en **neutre**.
- **Licence** : Licence Ouverte (ADEME data_communes / RPLS). RAS.
- **Couverture** : nationale.
- **Coût de maintenance** : **faible** — champ déjà sélectionné dans `SELECT_COMMUNE`, à porter
  dans l'index au build. Millésime RPLS annuel.
- **Criticité** : **enrichissement / opportuniste**.
- **Comment la raconter honnêtement** : exposer « X % de logements sociaux (RPLS 2023, commune) »
  comme **fait descriptif neutre**, non noté, non classé en avantage. Ne pas le brancher comme
  critère directionnel `/ou-vivre`. Au rapport Logement plutôt qu'au scoring.
- **Verdict** : **INTÉGRER en descriptif neutre (rapport Logement + champ d'index informatif),
  REFUSER comme critère de scoring directionnel.** Angle : trace de composition, jamais jugement.

---

## Victoires méthodologiques (prêtes à graver dans `inventaire-sources.md`)

1. **Le faux « ensoleillement » démasqué.** Le critère `ensoleillement_recherche` affichait
   « ensoleillé / peu ensoleillé » en mesurant température été + pluie-VOLUME (build-index l. 42
   l'avoue : « proxy ensoleillement »). C'est une **attribution fausse** (`doctrine/data.md`).
   Décision proposée : intégrer la **vraie normale d'insolation Météo-France** non pour enrichir
   mais pour **réparer** le critère. Gain : un critère climat cesse de mentir sur ce qu'il mesure.
2. **Baignade = au rapport, pas au moteur.** Donnée site (point), couverture littorale partielle,
   classement pluriannuel ≠ sûreté du jour, et **algues vertes hors périmètre** (eutrophisation,
   pas 2006/7/CE). Refus du scoring national (non comparable mer/intérieur) ; intégration ciblée
   rapport littoral. Gain : pas de fausse note de plage, pas d'attribution algues vertes trompeuse.
3. **Toujours câbler l'éditeur faisant autorité.** Pour la baignade, les miroirs « Ressourcerie
   datalocale » sont « licence non spécifiée / métadonnée 11 % » : se câbler au **Ministère de la
   Santé** (source canonique, Licence Ouverte), jamais au repost. Gain : licence sûre, fraîcheur
   maîtrisée.
4. **Deux trous n'étaient pas des sources mais des câblages.** UU (pop d'agglo) et HLM
   (taux_de_logements_sociaux_percent) sont **déjà sur disque/déjà fetchés** ; il manquait de les
   porter dans l'index. Gain : ne pas aller chercher dehors ce qu'on a déjà dedans.

## Cohérence avec la doctrine (tensions posées à l'humain, non tranchées)

- **`ADR-0001` (pas de note)** : HLM et taille d'agglo sont **non directionnels** → les exposer en
  descriptif neutre, jamais en avantage/gagnant. Tension à arbitrer : où s'arrête le « descriptif
  neutre » dans une UI de comparaison qui compare ?
- **`doctrine/data.md` (horizon)** : l'insolation et la baignade sont **mesurées/historiques** →
  interdites sous le sélecteur 2030/2050/2100. Risque si quelqu'un les range par réflexe dans le
  bloc climat projeté.
- **`doctrine/data.md` (granularité)** : insolation = station, baignade = site. Nommer la
  station/le site, jamais « à votre adresse ».
- **Vocabulaire** : UU ≠ AAV. On n'a que l'UU. Interdire « aire urbaine » si on calcule l'UU.

## Mise à jour proposée de `inventaire-sources.md` (prêt à écrire par Claude principal)

- Section **Climat** : ajouter une ligne **« Normales 1991-2020 (insolation, jours de pluie ≥1 mm)
  | Météo-France | Rapport Territoire + scoring climat (réparation du critère ensoleillement) |
  nouveau script `populate-insolation` | station → commune »**, criticité **enrichissement**,
  maintenance faible. Noter explicitement « MESURÉE, hors horizon DRIAS ».
- Section **Environnement/eau** : ajouter **« Qualité eaux de baignade (2006/7/CE) | Min. Santé /
  SISE-Baignades | Rapport Santé littoral UNIQUEMENT | nouveau lib | site → commune »**, criticité
  enrichissement, couverture « communes à site de baignade (sous-ensemble assumé) ».
- Section **Mobilité/services/démo/social** : noter que **pop UU** (dérivée index + TUU2017) et
  **taux HLM** (ADEME data_communes, déjà fetché `commune-data.ts`) sont à **porter dans l'index**,
  pas de nouvelle source. HLM = descriptif neutre, non scoré.
- Section **victoires méthodologiques** : ajouter les 4 ci-dessus.
- Signaler la dette : le commentaire `build-comparateur-index.mjs` l. 42 et le critère
  `ensoleillement_recherche` (`comparateur-vie.ts` l. 970) à corriger une fois l'insolation câblée.
