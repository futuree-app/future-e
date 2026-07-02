# Évaluation de source : balances comptables des communes, compte 6161 (primes d'assurance)

> Data Curator, 2026-07-02. Candidat : signal « dégradation assurantielle locale » inspiré
> d'Assurer ma ville (Reclaim Finance + Data For Good, méthodologie du 2026-07-01). Question
> instruite : les primes d'assurance payées par la COMMUNE disent-elles quelque chose
> d'honnête à un MÉNAGE qui décide où vivre ?

## Source

- **Jeu de données** : « Balances comptables des communes en {AAAA} », un dataset par
  millésime 2010 → 2024, DGFiP / Ministères économiques et financiers.
- **URL vérifiée** : API Opendatasoft `data.economie.gouv.fr`, datasets
  `balances-comptables-des-communes-en-2020` … `-2024` (le dataset data.gouv.fr
  `balances-comptables-des-communes` s'arrête à 2017, dernière MAJ 2019 : c'est la mauvaise
  porte, les millésimes vivants sont sur data.economie.gouv.fr).
- **Contenu** : balance comptable complète (tous comptes) des budgets principaux et annexes,
  ~7 M de lignes par millésime. Champs clés vérifiés : `compte`, `nomen` (M14/M57…),
  `cbudg` ('1' = budget principal), `obnetdeb` (charges nettes de l'exercice), `ndept` +
  `insee`.
- **Compte visé** : 6161 « (primes d'assurance) multirisques ». Existe en M14 comme en M57.
- **Millésime 2024 publié le 2025-12-08** : fraîcheur annuelle, ~1 an de décalage.

### Pièges techniques constatés (vérifiés sur l'API, 2026-07-02)

1. **La clé commune n'est pas un code INSEE.** `insee` est le code intra-départemental sur
   3 chiffres ("079"), à recombiner avec `ndept` ("006" → "06") pour obtenir "06079". Cousin
   direct du piège `home_insee_code`.
2. **Rupture de nomenclature M14 → M57** au milieu de la fenêtre 2020-2024 (2020 :
   quasi tout M14 ; 2024 : quasi tout M57/M57A, généralisation au 2024-01-01). Le compte
   6161 existe des deux côtés, mais la bascule s'accompagne de rebasculements de lignes
   entre subdivisions (6161 multirisques / 6168 autres) qui fabriquent de fausses variations.
3. **6161 seul est un périmètre partiel.** ~15 000 communes portent aussi un compte 6168
   « autres assurances » sur le budget principal ; sur le cas-test Mandelieu-la-Napoule, le
   6168 est PLUS GROS que le 6161 (236 k€ vs 182 k€ en 2024). Ne regarder que 6161 = mesurer
   moins de la moitié de la dépense d'assurance de certaines communes.
4. **Budgets annexes** : lignes 6161 avec `insee` null (ex. « local commercial »), à exclure
   (`cbudg='1'`).

## Problème utilisateur résolu / décision permise

La vraie question du ménage est : « pourrai-je assurer MON logement ici, à quel prix, avec
quelles franchises, un assureur acceptera-t-il ? ». Le compte 6161 ne répond à aucune de ces
questions (voir « Honnêteté » ci-dessous). Ce qu'il permettrait au mieux : « la commune
elle-même paie plus cher pour assurer ses bâtiments ». C'est un fait de gestion municipale,
pas une décision de vie. Sans passerelle causale solide vers l'assurabilité résidentielle,
la donnée remplit une fiche.

## Doublon

Inspecté : `src/lib/georisques.ts` + `scripts/populate-inondation.py` (GASPAR/CatNat déjà au
scoring et au rapport), inventaire-sources (DRIAS trajectoire, PPRN, submersion). Ce que le
6161 raconterait de vrai (« ce territoire a un historique de sinistres qui pèse ») est déjà
raconté plus proprement par **CatNat/GASPAR** (historique, échelle commune, attribution
limpide) et **DRIAS** (trajectoire). La part NON doublonnée du 6161 est précisément la part
non attribuable (marché, émeutes, contrats). La franchise CatNat majorée pour communes sans
PPRN, seul mécanisme qui différencie localement le coût assurantiel des ménages, se dérive de
GASPAR + PPRN qu'on a déjà, pas des balances comptables.

## Type

**Transactionnelle / comptable mesurée** (dépense constatée au compte administratif). La
typologie de l'inventaire range le transactionnel (DVF) en « prudence, pas au moteur ».
Mesuré ne veut pas dire attribuable : le montant est exact, sa cause est illisible.

## Échelle & granularité

Native : la **personne morale commune** (son patrimoine bâti : mairie, écoles, gymnases), pas
le territoire ni le parc résidentiel. L'affirmation « les primes de la commune ont augmenté »
est vraie à l'échelle de l'institution. L'affirmation implicite qu'un lecteur en tirerait
(« ce sera plus dur d'assurer ma maison ici ») n'est vraie à aucune échelle démontrable.
C'est un échec à la question de contrôle de `doctrine/data.md`.

## Honnêteté du signal : la question qui tue

Les primes communales 2020-2024 sont dominées par des causes NON territoriales et NON
climatiques :

- **Crise du marché de l'assurance des collectivités** (documentée par le rapport Langreney,
  avr. 2024, et la mission Sénat Husson/Dagbert 2024) : quasi-duopole SMACL/Groupama en
  difficulté, sous-tarification historique corrigée brutalement, appels d'offres
  infructueux. Hausses de +30 à +100 % subies par des communes SANS aggravation de leur
  risque local.
- **Émeutes de juin-juillet 2023** : les dégâts aux bâtiments publics ont fait exploser les
  primes des communes touchées ou jugées exposées. Une hausse 2023-2024 « lit » souvent le
  risque émeute urbain, pas le climat. Assurer ma ville hérite de ce biais.
- **Cycles de marchés publics** : la prime bouge par marches à la date de renouvellement du
  marché (3-5 ans). Deux communes au risque identique divergent selon leur calendrier
  contractuel. Une « évolution 2020-2024 » compare des communes à des points différents de
  leur cycle.
- **Auto-assurance et franchises** : les grandes villes s'auto-assurent partiellement ou
  acceptent des franchises massives ; leur 6161 sous-estime structurellement, et une prime
  STABLE peut cacher une dégradation (garantie réduite à prime égale, invisible en
  comptabilité).
- **Effet patrimoine** : un gymnase neuf augmente la prime sans aucun changement de risque.
- **Côté ménages, le mécanisme est autre** : la surprime CatNat de l'assurance habitation
  est NATIONALE et uniforme (12 %, portée à 20 % au 2025-01-01, arrêté du 2023-12-22). La
  dégradation assurantielle résidentielle locale se manifeste par des refus de garantie, des
  franchises majorées, des retraits d'assureurs, rien de tout cela n'est dans le 6161.

Conclusion d'honnêteté : commune-qui-s'assure → ménage-qui-s'assure est une **attribution
fausse**. Même racontée prudemment (« fait mesuré, sans lien causal »), la présence du
chiffre dans un produit de choix de vie INVITE l'inférence qu'on ne peut pas soutenir. La
doctrine éditoriale (mesuré / interprété) ne sauve pas une donnée dont la seule lecture
utile pour le lecteur est l'interprétation interdite.

## Pièges de dérivation (si on avait voulu quand même)

Séparer le signal local de l'inflation nationale exigerait : déflater par un indice de prime
collectivités (n'existe pas en open data), neutraliser la bascule M14/M57, sommer 6161+6168,
normaliser par la valeur assurée du patrimoine (inconnue, le budget total est un mauvais
proxy), et connaître les dates de renouvellement de marchés (non publiées). Chaîne de
corrections non finançable et invérifiable : fausse précision garantie.

## Licence, couverture, maintenance

- **Licence** : Licence Ouverte v2.0 (Etalab), compatible, attribution « DGFiP, balances
  comptables des communes » possible en liste blanche.
- **Couverture** : excellente, vérifiée : 33 559 communes avec un 6161 au budget principal
  en 2024 (~96 % des ~35 100 communes présentes), 33 620 en 2020. Pas de trou majeur.
- **Coût de maintenance** : faible à moyenne. Un millésime par an, API Opendatasoft stable,
  mais volumétrie 7 M lignes/an et normalisation de clé + nomenclature à chaque rebuild. Si
  elle disparaissait demain : futur•e ne perdrait rien, elle n'alimente aucune décision.

## Criticité

Opportuniste, et en dessous du seuil d'entrée : c'est l'archétype de « la donnée intégrée
parce qu'elle existe » (et parce qu'un site en a fait l'actualité la veille).

## Verdict : REFUSER (comme signal d'assurabilité, scoring OU récit)

- REFUS au comparateur et à tout score : évident (ADR-0001, et l'indice 0-5 d'Assurer ma
  ville est exactement le score composite que futur•e refuse).
- REFUS aussi au récit (drawer Territoire, module Logement) : le fait mesuré est vrai mais
  la seule inférence qui intéresserait le lecteur est indéfendable. Une donnée vraie mais
  inerte pour la décision est une fuite de donnée (doctrine signature identitaire).
- Le Fil : si l'actualité « crise de l'assurance des collectivités / rapport Langreney »
  mérite un traitement, c'est un sujet éditorial national, pas une donnée communale à brancher.

## Victoire méthodologique (prête à graver dans inventaire-sources.md)

| Source | Décision | Pourquoi | Gain | Référence |
|---|---|---|---|---|
| **Balances comptables des communes, compte 6161** (DGFiP, data.economie.gouv.fr, 2010-2024) | refusée | la prime d'assurance de la COMMUNE ne dit rien de l'assurabilité d'un LOGEMENT (crise SMACL/duopole, émeutes 2023, cycles de marchés publics, auto-assurance, périmètre 6161 partiel vs 6168, rupture M14→M57 en pleine fenêtre) ; le vrai historique de risque est déjà porté par CatNat/GASPAR | évite un signal « dégradation assurantielle » à attribution fausse copié d'un indice tiers ; économise la chaîne de corrections invérifiable (déflateur, nomenclature, patrimoine) | `docs/rapports-agents/data-curator/2026-07-02-balances-comptables-assurance-communes.md` |

## Cohérence (tensions à poser à l'humain, je ne tranche pas)

- Le sujet « assurabilité résidentielle » reste un VRAI inconnu décisif pour le module
  Logement (vulnérabilité). Mon refus porte sur CETTE source, pas sur le sujet. La bonne
  source n'existe pas encore en open data (CCR / France Assureurs ne publient pas de prime
  MRH ni de taux de refus communal). Choix à l'humain : garder « assurabilité du logement »
  en gap ouvert du module Logement, alimenté aujourd'hui par ce qu'on a (CatNat, PPRN, RGA,
  et la franchise majorée dérivable de GASPAR+PPRN), sans nouvelle source.
- Ne jamais citer Assurer ma ville comme source de données dans l'UI : c'est un indice
  militant (Reclaim Finance) construit sur des données publiques qu'on peut citer
  directement ; même logique que le refus des acteurs intéressés (feedback statistiques
  marketing climat).

## Mise à jour de l'inventaire (prêt à écrire)

Ajouter la ligne de victoire méthodologique ci-dessus au tableau « victoires
méthodologiques » de `docs/vault/recherches/inventaire-sources.md`. Rien d'autre : pas de
ligne d'inventaire, pas de statut roadmap.

## Version minimale

La plus petite incarnation qui capture ~90 % de la valeur de ce travail : **une ligne de
refus tracée dans le tableau des victoires méthodologiques**, avec les 4 pièges techniques
documentés (clé ndept+insee, M14→M57, 6161 vs 6168, budgets annexes) pour que personne ne
re-dépense une journée à redécouvrir la même impasse au prochain article de presse sur
l'assurance des communes.

## Quand rouvrir ce sujet ?

- **CCR, France Assureurs ou la DREES/Banque de France publient une donnée communale côté
  MÉNAGES** : prime MRH moyenne, taux de refus/non-renouvellement, retraits d'assureurs par
  zone. C'est la source qui changerait tout ; ré-instruire immédiatement.
- **La surprime CatNat cesse d'être uniforme** (modulation locale évoquée dans les débats
  post-Langreney) : le prix de l'assurance habitation deviendrait un signal LOCAL légitime.
- **Demande utilisateur avérée** (sondes, AskFuture) : des questions « pourrai-je assurer
  ma maison ici ? » en volume feraient remonter le sujet en gap prioritaire du module
  Logement, avec ou sans source parfaite (on peut alors raconter honnêtement le mécanisme
  franchise/PPRN qu'on possède déjà).
- **Le cadrage du module Logement** atteint le chantier « vulnérabilité » : re-vérifier à ce
  moment-là si l'open data assurantiel a bougé (le paysage évolue vite depuis 2024).

Avis daté du 2026-07-02, sur millésimes DGFiP 2020-2024 et méthodologie Assurer ma ville
publiée le 2026-07-01.
