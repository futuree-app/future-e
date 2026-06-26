# Modèle économique : moteur, moat, dimensionnement

> Page stratégique durable. Décrit comment la valeur **circule et s'accumule**, pas seulement
> l'offre. Consolide le retour business plan (intake juin 2026), l'« Étude de marché v2 »
> (10 juin 2026) et les « Projections consolidées » (mai 2026). Décision de séquencement B2B :
> `adr/ADR-0008`. Fiche miroir : `/memory/business_modele_economique.md`.
>
> STATUT DES CHIFFRES. Tout le dimensionnement est une estimation datée (10 juin 2026), en
> fourchettes, sur des conversions NON MESURÉES. À réviser après septembre 2026 et dès 1 000
> sessions/mois instrumentées. Ne jamais présenter ces chiffres comme acquis (voir la
> hiérarchie de preuve plus bas).

## La thèse

Le marché de futur•e n'est pas l'information climatique : c'est la décision de lieu de vie,
un comportement massif et ancien (palmarès de presse, comparateurs de communes, avis
d'habitants, portails immobiliers) qui draine des audiences énormes mais n'est quasiment pas
monétisé en B2C.

> **Le climat n'est plus le marché : c'est le différenciant.**

C'est la phrase-mère du modèle. Elle explique pourquoi le produit existe, pourquoi il est
difficile à copier proprement (jamais « impossible »), et pourquoi il ne faut pas devenir un
média climat. Corollaire d'acquisition : l'intention prime sur le volume. Un ménage en
décision active (achat, mutation, retraite, installation) vaut bien plus qu'un curieux climat.

## Le moteur économique (qui paie, pourquoi, quand, pourquoi il revient)

Un modèle ne se résume pas à une grille de prix. Quatre questions :

- **Qui paie ?** Aujourd'hui le ménage en décision active (B2C, le socle). Demain le
  professionnel (B2B, le relais, cf. `adr/ADR-0008`).
- **Pourquoi paie-t-il ?** Pour éviter de se tromper d'endroit où vivre. Les ancres de prix
  rendent l'achat évident : 14 € contre 600-800 € de diagnostics obligatoires par transaction,
  39 € contre le coût d'un aller-retour dans une commune mal choisie.
- **Quand paie-t-il ?** Au moment d'engagement long, à forte intention. Le récurrent (Le Fil)
  vise à déplacer le « quand » du one-shot ponctuel vers une présence dans la durée.
- **Pourquoi revient-il ?** C'est le maillon le plus faible aujourd'hui (le récurrent n'est pas
  livré) : le territoire bouge, donc une veille garde la valeur vivante, et un utilisateur
  satisfait revient surtout en **prescrivant** (au conjoint, au notaire, à la famille). À ce
  stade c'est une hypothèse, pas une preuve (voir hiérarchie de preuve).

Le flux de valeur : `acquisition (SEO, intention) → rapport 14 € → Pack 39 € → Mode Foyer →
Le Fil (récurrent) → B2B`. Mais un étage ne sert pas qu'à vendre le suivant : il augmente
aussi la confiance, la relation et la compréhension du lecteur. C'est ce qui distingue un
**système** d'un simple tunnel.

## Les boucles (pourquoi la machine se renforce en tournant)

Le moteur n'est pas linéaire, il est circulaire. La boucle centrale n'est pas le SEO, c'est
**l'apprentissage** :

- **Boucle d'apprentissage (le cœur)** : plus d'utilisateurs → plus de décisions réelles
  observées → meilleure compréhension des arbitrages qui comptent → meilleure doctrine et
  meilleur scoring → meilleur produit → plus de confiance → plus d'utilisateurs. Ce qu'elle
  accumule a un nom : le **capital de compréhension** (comment les gens choisissent, quels
  arbitrages existent, quelles formulations et quelles données comptent vraiment). Aucun
  concurrent ne peut le télécharger ; c'est peut-être plus solide que le moat de données.
- **Boucle de prescription** : une décision éclairée → un rapport partagé (conjoint, notaire,
  famille) → de la confiance → de la prescription et du bouche-à-oreille → plus de trafic
  d'intention, relayé par le maillage SEO des 34 000 pages communes.

C'est cette circularité, pas le catalogue de produits, qui fait la valeur à long terme. Les
deux boucles restent largement hypothétiques : à instrumenter (PostHog) avant de les tenir pour
acquises.

## L'architecture d'offre

### B2C (le socle, seul livré aujourd'hui)
- **Gratuit** : parcours `/ou-vivre` jusqu'aux 3 territoires et à la synthèse (acquisition).
- **14 €** : rapport de territoire (comprendre une commune).
- **39 €** : Pack Décision (arbitrer entre trois communes ; cf. `adr/ADR-0007`). Ancre :
  « trois rapports valent 42 €, le Pack les réunit pour 39 € ».
- **Abonnement (« Le Fil »)** : PAS encore achetable. Page de pré-lancement (`/le-fil`, liste
  d'attente, `noindex`) affichant encore « 9 €/mois », mais direction = **tarif annuel**
  (~49,99 €/an) ; à recaler (cf. `arbitrages/pricing-abonnements-reportes.md`).
- **Mode Foyer** : upsell multi-personnes sur le rapport one-shot, distinct de l'abonnement
  (cf. `arbitrages/mode-foyer-recadre.md`).

futur•e occupe l'étage intermédiaire vacant, entre le gratuit générique et le service humain
coûteux (chasseur immobilier 2-3 %, coaching relocation 300 €+).

### B2B (relais, avant-première dès automne 2026, rien d'achetable)
Page de pré-lancement `/professionnels` (avant-première, capture de leads, `noindex`), lancement
annoncé **automne 2026, segment par segment**. Statut « relais, pas pilier » : `adr/ADR-0008`.
Quatre segments, par friction croissante : **CGP** (ARPU ~64 €, lancé 1er, export PDF seul
manquant), **assurance** (~51 €, besoin CatNat), **notaires** (~128 €, meilleur ARPU, cycle
long, export acte + recherche adresse), **diagnostiqueurs** (~35 €, mobile, clé = partenariat
éditeurs logiciels). Référence de marché : CityScan facture 6-8,50 € HT/adresse aux mêmes
professions (preuve qu'elles paient déjà pour de l'intelligence territoriale).

## Le moat est une accumulation, pas une propriété

Le climat seul n'est pas le moat : DRIAS est public. Le moat est une chaîne qui se densifie
avec le temps :

`sources publiques → croisements → interprétation → UX → marque → confiance → temps accumulé`

(cohérent avec `adr/ADR-0002` : le moat est la combinaison, pas l'élément). Un concurrent copie
un maillon vite ; il ne copie pas l'accumulation. Conséquence : futur•e ne protège pas des
données, elle protège la **transformation**.

> futur•e ne vend pas des rapports : elle accumule une compréhension de la décision
> territoriale, qu'elle restitue sous différentes formes (rapport, Pack, abonnement, B2B).

### Les actifs qui prennent de la valeur

Le modèle n'accumule pas que du revenu, il accumule des actifs qui se valorisent seuls, en deux
familles qui sont deux moteurs distincts :
- **Actifs de connaissance** (ce qui rend futur•e plus intelligente) : le vault (doctrine,
  arbitrages), les pipelines et datasets enrichis, les prompts, et le capital de compréhension.
- **Actifs de distribution** (ce qui rend futur•e plus accessible) : les 34 000 pages SEO, les
  contenus (pages Savoir), la marque, la base clients, les relations B2B.

Lire le modèle par les actifs (pas seulement par le MRR) change la valorisation : même à revenu
modeste, l'accumulation a une valeur. Le code est l'outil des deux familles, pas un actif en soi.

## Ce qu'on refuse de monétiser

Découle des invariants (on éclaire une décision, on ne la vend pas). futur•e refuse, même
contre de la croissance :
- la **publicité** (déjà tenu : « Aucune publicité » affiché en prod),
- l'**affiliation immobilière** et la **vente de leads**,
- les **recommandations sponsorisées** et tout **placement territorial** payé,
- tout **score manipulé** ou pondéré par un intérêt commercial (cf. `adr/ADR-0001`).

Ces refus sont un actif de confiance, pas une contrainte. Ils sont gravés : l'indépendance ne
se monétise pas (**invariant n°7**) et futur•e évolue avec les preuves, jamais avec les
intérêts (**invariant n°8**). Que chaque produit renforce le moteur B2C sans jamais le
détourner, futur•e ne devenant pas un SaaS de diagnostics, est un **principe stratégique**
(non un invariant : contingent du pari B2C, cf. `adr/ADR-0008`).

## Dimensionnement marché (B2C, étude du 10 juin 2026, sourcé)

- **TAM décisionnel** : 1,5 à 2 M ménages/an. En valeur, panier moyen 22 € (mix 14/39, Pack
  mieux mis en avant) : **35 à 55 M€/an**. Le 22 € est un ticket de calcul, le Pack reste 39 €.
- **SAM** : 500 000 à 900 000 ménages/an, **10 à 18 M€/an**. Filtre principal non mesuré : la
  disposition à payer face au gratuit abondant (25-35 %).
- **SOM à 36 mois** : médian 5 500 à 8 000 ventes/an, **120 à 180 k€**/an (bas ~40 k€, haut
  280-480 k€), hors abonnement et B2B.
- **SAM B2B agrégé** : 5 à 15 M€/an ; SOM B2B 2027-2028 : 20 à 80 k€/an.

Les projections internes de MRR mois par mois (mai 2026) ne sont pas reprises : trop volatiles.

## Unit economics (forme durable)

SaaS pur : marge brute structurellement élevée (~91 % à M+12, ~95 % à M+36). Coûts fixes
faibles (Vercel, Supabase, Resend). **Coût variable dominant : l'API Claude** (~0,015 €/appel,
~3 appels/utilisateur actif/mois). Acquisition à budget zéro ~12 mois (SEO + presse +
prescription), paid seulement à partir de M+13. Priorité d'acquisition absolue : le **SEO**,
moteur = maillage des pages communes `/territoire/[theme]/[insee]`.

## Hiérarchie de preuve (ce qui est établi vs ce qu'on parie)

Tout n'est pas au même niveau de certitude. Honnêteté du modèle :

- **Certitudes (sourcées)** : le marché de la décision de lieu de vie existe et est massif
  (951 000 transactions, ~3 M déménagements/an, audiences des gratuits). Les ancres de prix
  (diagnostics 600-800 €).
- **Preuves fortes** : le besoin de comprendre son territoire (91 839 notations ville-ideale,
  couverture intégrale des comparateurs gratuits, intention de mobilité climatique doublée en
  deux ans).
- **Preuves moyennes / faibles** : le SEO comme canal dominant (plausible, pas mesuré sur notre
  prod) ; l'étage de prix vacant (opportunité OU absence de demande solvable).
- **Hypothèses non démontrées (les paris)** : le **consentement à payer B2C** (le pari central,
  précédent CityScan parti en B2B) ; la conversion du tunnel paywall ; la rétention (Le Fil) ;
  la croissance B2B. La disposition à payer est la variable à instrumenter EN PREMIER (clic CTA
  payants, taux paywall → paiement), avant toute dépense d'acquisition.

## Risques structurants

1. **La catégorie mal comprise** (risque marketing avant d'être économique) : si le marché lit
   futur•e comme « un comparateur de villes de plus », on perd ; s'il comprend « une
   intelligence territoriale personnalisée et prospective », on gagne. Le discours doit rattraper
   le produit (cf. `/memory/feedback_positionnement_compatibilite.md`).
2. **Le paiement B2C non démontré** (précédent CityScan).
3. **Concurrence gratuite en SEO** (City Score, Bien dans ma ville, ville-ideale, MeilleurVille).
4. **Un portail immobilier qui ajoute un score climat** (SeLoger, Bien'ici) : le plus dangereux,
   et l'acquéreur le plus plausible si la traction est prouvée.
5. **Écart intention-action** : on monétise la réflexion, pas le déménagement.
6. **Réglementation à double tranchant** : un diagnostic territorial obligatoire ouvrirait le
   marché mais ferait entrer des acteurs institutionnels.

## Contexte d'accélération 2025-2026 (sourcé)

Surprime CatNat 12 % → 20 % au 01/01/2025 ; PNACC-3 (TRACC +2,7 °C en 2050, +4 °C en 2100,
échelle France) ; intention de mobilité climatique doublée (13 % en 2023 → 28 % en 2025,
Odoxa) ; précédent DPE (un A se vend ~16 % plus cher qu'un D) qui prouve qu'une information
territoriale lisible devient un standard de marché.

## Liens

`adr/ADR-0008-b2b-relais-pas-pilier.md`, `adr/ADR-0002-pivot-compatibilite-territoriale.md`
(moat = combinaison), `adr/ADR-0007-pack-decision-bundle.md`,
`adr/ADR-0001-pas-de-score-synthetique.md`, `principes/invariants.md` (n°7 indépendance non
monétisée, n°8 évolue avec les preuves jamais les intérêts), `arbitrages/pricing-abonnements-reportes.md`,
`arbitrages/mode-foyer-recadre.md`, `vision/archetype-lecteur.md`, `vision/positionnement.md`,
`doctrine/legal.md`, `/memory/business_modele_economique.md`,
`/memory/feedback_positionnement_compatibilite.md`, `/memory/project_paywall_territoire.md`.
