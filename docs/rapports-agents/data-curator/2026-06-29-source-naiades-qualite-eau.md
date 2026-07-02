# Évaluation de source — Naïades / Hub'Eau « qualité des cours d'eau » (micropolluants)

> Data Curator, 2026-06-29. Read-only. Je n'intègre rien. Source évaluée : la donnée publique
> derrière l'enquête Mediacités/Reporterre « 1 700 rivières contaminées », c.-à-d. les mesures
> des agences de l'eau dans la base **Naïades**, exposées par l'API **Hub'Eau qualité des cours
> d'eau** (`qualite_cours_deau` / physico-chimie). J'évalue la SOURCE, pas l'article.

## 1. Identité de la source

- **Producteur** : agences de l'eau (6 + offices DOM), agrégées par l'OFB/Eaufrance dans la base
  **Naïades** (banque nationale des données sur la qualité des eaux de surface continentales).
  L'API Hub'Eau `qualite_cours_deau` (endpoints `station_pc`, `operation_pc`,
  `condition_environnementale_pc`, `analyse_pc`) en est le robinet ; en v2 elle est synchronisée
  en continu avec Naïades (confirmé sur `hubeau.eaufrance.fr/page/api-qualite-cours-deau`).
- **Type SANDRE** : physico-chimie sur eau (résultats d'analyse par paramètre/substance, à la
  station, par opération de prélèvement). C'est la maille « micropolluants » de l'enquête
  (métaux, HAP, pesticides, PFAS, médicaments).
- **Licence** : Licence Ouverte / Etalab 2.0 (standard de tout l'écosystème Eaufrance/OFB). Pas
  d'ODbL, pas de share-alike. Attribution simple. **Compatible** sans contrainte virale. (Non
  réaffiché texto sur la page API faute de mention explicite ; à reconfirmer d'un clic sur la
  fiche data.gouv « Naïades » au moment d'intégrer, mais c'est le régime constant de la maison.)
- **Fraîcheur** : v2 synchronisée en continu avec Naïades. MAIS la donnée scientifique utile est
  une **moyenne annuelle** (pollution chronique) : on parle d'un signal 2022-2024, pas d'un
  « aujourd'hui ». La fraîcheur API ne change pas la temporalité du signal (annuel/pluriannuel).
- **Historique** : profondeur pluriannuelle (ère DCE, données continues depuis la fin des années
  2000 selon les réseaux). Suffisant pour une tendance, mais la donnée est irrégulière par
  station (toutes ne mesurent pas toutes les substances tous les ans).

## 2. Granularité — LE point dur (et le motif de refus en commune)

C'est ici que la candidature se joue, et elle échoue à l'étage commune.

- **Maille native** : la **station de mesure**, posée sur un **tronçon de cours d'eau**. Ce n'est
  ni une commune, ni un point « chez l'habitant » : c'est un point sur une rivière, qui décrit
  l'état d'une **masse d'eau / d'un bassin versant amont**, pas d'un territoire administratif.
- **Couverture réelle** : l'enquête elle-même donne l'ordre de grandeur — **1 691 cours d'eau**
  avec ≥1 dépassement, ~8 stations sur 10 concernées. Le réseau de surveillance DCE
  (RCS + RCO + réseaux complémentaires) se compte en **quelques milliers de stations** réparties
  sur le linéaire hydrographique. Face aux **~35 000 communes**, la majorité n'a **aucune station
  exploitable « chez elle »**, et là où il y en a une, elle mesure la rivière, pas la commune.
- **Rattacher une station à une commune = fausse attribution structurelle.** Une station en
  **amont** porte la pollution d'autres communes ; une station en **aval** dilue ou concentre ce
  qui vient d'ailleurs ; un polluant **diffus/atmosphérique** (HAP redéposés loin de la source)
  n'a pas d'auteur local. Dire « la rivière de votre commune est contaminée » à partir d'une
  station communale, c'est attribuer à un territoire un signal qui appartient à un bassin. C'est
  exactement la faute que la doctrine `data.md` interdit (« à quelle échelle cette affirmation
  est-elle vraie ? » → réponse : masse d'eau/bassin, **jamais** commune).
- **Verdict thin content** : générer thème×34k sur cette source produirait une écrasante majorité
  de pages « pas de station / rien d'exploitable » + une minorité de pages à attribution douteuse.
  C'est le **thin content** dénoncé dans `project_frontiere_savoir_agir` (garde-fou n°2) et le
  refus déjà gravé pour le cadmium GisSol (granularité non communale masquée en commune).

**Conclusion granularité** : signal réel à l'échelle **bassin / masse d'eau / national**, jamais
à la commune. Donc : ni page commune, ni critère de scoring `/ou-vivre` (qui exige une valeur
honnête et comparable sur ~34 000 communes — impossible ici sans inventer de la couverture).

## 3. Honnêteté méthodo (la donnée sous-estime structurellement le réel)

Trois biais à porter, sinon on ment par excès de confiance :

- **Les seuils ne couvrent qu'une fraction des molécules** (quelques centaines / ~110 000) et
  **ignorent l'effet cocktail**. Un « pas de dépassement » ne veut PAS dire « eau saine » : il
  veut dire « parmi les substances cherchées et seuillées, aucune ne dépasse seule ». La donnée
  **sous-estime** le réel par construction. → Interdit absolu de transformer un non-dépassement en
  rassurance (« rivière propre »).
- **Détection ≠ danger ; dépassement ≠ verdict sanitaire.** Eau de surface ≠ eau bue. Présenter un
  dépassement comme un risque pour l'habitant serait une fausse attribution de niveau (santé).
- **Type de donnée** : **mesurée** (observation datée), au sens de la typologie de l'inventaire —
  donc récit factuel et daté (« mesuré en 2022-2024, moyenne annuelle, à telle station »), jamais
  projeté ni jugé. Pas d'étoiles, pas de score (ADR-0001).

**Garde-fous obligatoires si jamais exposée** :
1. jamais un verdict, jamais une note ; un **signal** nommé à son échelle (« cette masse d'eau »),
   avec la substance dominante et l'année ;
2. dire explicitement ce que la donnée NE dit pas (cocktail, molécules non cherchées,
   non-dépassement ≠ propreté) ;
3. ne pas afficher un chiffre de concentration brut sans seuil ni unité ni contexte (cf. doctrine
   tooltips / récit « source dominante sans chiffre » des critères calme_sonore/exposition).

## 4. Distinctions à tenir (et le meilleur candidat décisionnel est déjà câblé)

Trois objets différents, trois valeurs décisionnelles différentes :

| Objet | Source | Maille | Valeur pour l'habitant |
|---|---|---|---|
| **Eau de surface (rivière)** = cette candidate | Naïades / Hub'Eau `qualite_cours_deau` | station/bassin | environnementale, indirecte, **faible** pour « où vivre » |
| **Eau potable au robinet** | ARS / SISE-Eaux via Hub'Eau `qualite_eau_potable/resultats_dis` | **commune** (`code_commune`) | sanitaire, directe, **forte** |
| **Cadmium des sols** | GisSol/RMQS | maille sols (≈ départementale) | déjà **refusé** en commune (granularité) |

Point capital pour le porteur : **l'eau potable ARS est DÉJÀ câblée et à la bonne maille.**
- `src/lib/eaufrance.ts` (`loadDrinkingWater`) et `src/app/api/proxy/eau/route.ts` interrogent
  `qualite_eau_potable/resultats_dis` **par `code_commune`** : conformité bactério/physico-chimique,
  nitrates, nitrites, plomb, arsenic, pesticides totaux, avec seuils réglementaires.
- Surfacé dans `PollutionLookup.tsx` (bloc « Qualité de l'eau potable », attribué « ARS via
  Hub'Eau »).
- C'est la donnée **commune-native, décisionnelle, sanitaire**. Si on veut renforcer « qualité de
  l'eau » dans futur•e, **on approfondit l'ARS robinet** (déjà là, déjà à la commune, déjà
  honnête), on n'ajoute pas la rivière. La rivière ne fait pas mieux décider « où vivre » que le
  robinet ; elle fait moins bien (mauvaise maille, signal indirect).

Donc la rivière Naïades n'apporte **pas** de capacité de décision que l'ARS n'apporte déjà mieux,
à l'étage qui compte (commune). C'est un **quasi-doublon de mission** (« qualité de l'eau ») par
une source de moins bonne maille décisionnelle.

## 5. Angle moat — couplage climat × dilution

Tentant : croiser concentration de polluants × trajectoire de débit/sécheresse DRIAS (sécheresse →
moins de dilution → concentration ↑ ; crues → ruissellement ↑). **Verdict : hors de portée
honnête aujourd'hui.**
- Ce serait une **inférence modélisée** (étiquetée « projetée/interprétée ») posée sur une donnée
  **mesurée** à une maille (station) incompatible avec la maille DRIAS (commune/maille) — un
  croisement à deux échelles qui ne se rejoignent pas proprement.
- On produirait une **fausse précision** (« le réchauffement va concentrer les polluants de votre
  rivière ») là où ni la couverture stations, ni la relation débit→concentration substance par
  substance, ne sont établies dans la donnée dispo. C'est exactement la peur que j'incarne.
- Le moat (ADR-0002) n'est pas « croiser deux jeux parce qu'on les a » ; ici le croisement ne
  tient pas à l'échelle. **À ne pas faire.** Le couplage climat × eau reste légitime et solide là
  où il est déjà honnête : **sécheresse/écoulement ONDE** (`loadDrought` dans `eaufrance.ts`) et
  **VigiEau/restrictions** — qui sont à la commune/bassin et descriptifs.

## 6. Verdict

**REFUSER en commune et en scoring `/ou-vivre`. DIFFÉRER (sous conditions strictes) comme contenu
éditorial national/bassin, et seulement si une page « qualité de l'eau » est priorisée.**

- **Page commune (`savoir/[thème]/[commune]`)** : NON. Thin content massif + fausse attribution
  station→commune. Même motif que EAIP et cadmium GisSol.
- **Critère comparateur `/ou-vivre`** : NON. Pas de valeur honnête et comparable sur 34 000
  communes ; pas de maille ; ADR-0001 (on ne note pas une rivière en étoiles).
- **Page Savoir × thème (nationale/bassin), gratuite, verticale** : POSSIBLE plus tard, **non
  prioritaire**. Une page « Qualité des rivières en France » qui raconte le phénomène national
  (familles de polluants, ce que les seuils ne disent pas, l'effet cocktail) à l'**échelle où le
  signal est vrai** — pas à la commune. Elle se subordonne à l'Editorial pour la voix et au
  Discoverability pour l'indexation. Mais elle ne fait PAS l'arbitrage « où vivre » (garde-fou
  vertical/horizontal). **Et elle attend** : le thème « qualité de l'eau » est mieux servi côté
  décision par l'ARS robinet déjà câblé.

## Victoire méthodologique (à graver dans `inventaire-sources.md`, section « Les victoires »)

| Source | Décision | Pourquoi | Gain | Référence |
|---|---|---|---|---|
| **Naïades / Hub'Eau qualité cours d'eau** (micropolluants rivières) | refusée en commune + scoring ; différée en page thématique nationale/bassin non prioritaire | maille station/bassin (≈ quelques milliers de stations) inattribuable à 34 000 communes sans fausse attribution amont/aval/diffus ; seuils ignorant l'effet cocktail → sous-estime le réel (non-dépassement ≠ propre) ; quasi-doublon de mission « qualité de l'eau » déjà mieux servie à la commune par l'ARS robinet (déjà câblé) ; couplage climat×dilution = fausse précision à deux échelles | évite une réplication thin content ×34k + une attribution territoriale fausse ; recentre l'effort « eau » sur l'ARS commune-native | API `hubeau.eaufrance.fr/page/api-qualite-cours-deau` ; ARS déjà câblé `src/lib/eaufrance.ts`, `src/app/api/proxy/eau/route.ts` ; cf. enquête Mediacités/Reporterre 2026 |

## Cohérence doctrinale (tensions, sans trancher — au porteur)

- **Granularité (`data.md`)** : refus net, signal vrai au bassin pas à la commune. Aligné.
- **Attribution (`editoriale.md`)** : attribuer une station à une commune = la fausse attribution
  prohibée. Aligné. (Note positive : ce n'est PAS du Callendar ; Licence Ouverte, attribuable
  « agences de l'eau via Hub'Eau/Naïades ».)
- **Anti-score (ADR-0001)** : aucun score rivière. Aligné.
- **Tension à signaler au porteur** : l'enquête est journalistiquement marquante et la tentation
  produit (« on a la donnée, faisons une carte des rivières contaminées ») est réelle. C'est
  précisément la donnée intégrée « parce que disponible / parce qu'une feature la veut » que je
  refuse. Le bon réflexe est de **renforcer l'ARS robinet**, pas d'ouvrir la rivière.

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

1. Ajouter la ligne « victoire méthodologique » ci-dessus à la table de `inventaire-sources.md`.
2. Dans la section « roadmap / non intégrés » : noter que **« qualité de l'eau »** (idée 🆕 des
   hubs Savoir) est tranchée côté Curator = **ARS robinet (déjà câblé) approfondi**, rivière
   Naïades écartée du décisionnel. Le PFAS « eau » listé comme non-intégré garde la même
   discipline (maille + attribution à instruire avant toute intégration).
3. Aucune nouvelle ligne d'inventaire « source intégrée » : rien n'entre.

## Réflexe 1 — La version minimale (~90 % de la valeur)

Si le porteur veut servir « qualité de l'eau » au moindre coût et sans dette : **ne rien ajouter,
enrichir le bloc ARS eau potable déjà en place** (`PollutionLookup.tsx` + `proxy/eau`). La plus
petite incarnation utile : ajouter au bloc existant la mention honnête « ce contrôle porte sur
l'eau distribuée au robinet, pas sur la rivière ; il ne couvre pas toutes les molécules
(notamment l'effet cocktail) » et, le cas échéant, exposer la conformité **pesticides** déjà
récupérable. Zéro nouvelle source, zéro ×34k, maille commune respectée. La rivière Naïades n'entre
pas dans cette version minimale — c'est le signe qu'elle n'est pas nécessaire.

## Réflexe 2 — Quand rouvrir ce sujet

Réintégrer/ré-explorer la rivière Naïades si **l'un** de ces signaux apparaît :
- une **page Savoir « qualité de l'eau » nationale/bassin** est priorisée par le porteur (alors
  Naïades devient le bon matériau éditorial à l'échelle bassin — pas commune) ;
- l'OFB publie une **donnée agrégée à une maille décisionnelle stable** (masse d'eau rattachée
  proprement à un territoire vécu, ou indice synthétique officiel par bassin de vie) qui lève le
  problème d'attribution ;
- un **besoin utilisateur avéré et répété** (comme l'a été l'eau de baignade au dogfood Brest/
  Lorient) montre que les habitants décident sur la rivière elle-même (pêche, baignade en rivière,
  captage) — auquel cas re-cadrer comme signal de bassin, jamais comme verdict communal ;
- côté santé directe : si un jour on veut « PFAS dans l'eau potable », instruire **l'ARS/SISE-Eaux
  PFAS** (commune-native), pas la rivière.

Re-fermer / abandonner définitivement si : la couverture stations reste inchangée ET l'ARS robinet
couvre déjà le besoin décisionnel (statu quo le plus probable).

---
*Rapport Data Curator — read-only, aucune intégration effectuée. Avis daté du 2026-06-29.*
