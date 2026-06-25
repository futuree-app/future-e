# Modèle économique : thèse, offre, dimensionnement

> Page stratégique durable. Consolide le retour « investisseur » sur le business plan
> (intake conv. ChatGPT, juin 2026), l'« Étude de marché v2 » du 10 juin 2026 (pièce la plus
> récente, sourcée) et les « Projections consolidées » de mai 2026 (modélisation interne).
> Décision de séquencement B2B : voir `adr/ADR-0008`. Fiche miroir :
> `/memory/business_modele_economique.md`.
>
> STATUT DES CHIFFRES. Tout le dimensionnement ci-dessous est une estimation datée (10 juin
> 2026), en fourchettes, reposant sur des taux de conversion NON MESURÉS. À réviser après
> septembre 2026 et dès 1 000 sessions/mois instrumentées (PostHog/Clarity). Ne jamais
> présenter ces chiffres comme acquis.

## La thèse

Le marché de futur·e n'est pas l'information climatique : c'est la décision de lieu de vie,
un comportement massif et ancien (palmarès de presse, comparateurs de communes, avis
d'habitants, portails immobiliers) qui draine des audiences énormes mais n'est quasiment pas
monétisé en B2C. Le climat n'est plus le marché : c'est le différenciant et le moat, ce qui
rend le produit difficile à copier proprement (jamais « impossible à copier ») et ce qui
justifie le paiement. Corollaire d'acquisition : l'intention prime sur le volume. Un ménage
en situation active de décision (achat, mutation, retraite, installation) vaut bien plus
qu'un visiteur « curieux climat ».

## L'architecture d'offre

### B2C (le socle, seul livré aujourd'hui)

- **Gratuit** : parcours `/ou-vivre` jusqu'aux 3 territoires et à la synthèse (étage
  d'acquisition, pas le marché).
- **14 €** : rapport de territoire (comprendre une commune).
- **39 €** : Pack Décision (arbitrer entre trois communes ; cf. `adr/ADR-0007`). Ancre de
  conversion : « trois rapports valent 42 €, le Pack les réunit pour 39 € ».
- **Abonnement (« Le Fil »)** : PAS encore achetable. Une page de pré-lancement publique
  existe (`/le-fil`, liste d'attente, `noindex`) et affiche encore « 9 €/mois », mais la
  direction porteur est désormais un **tarif annuel** (~49,99 €/an, le 9 €/mois jugé trop
  cher) : la page live est à recaler (cf. `arbitrages/pricing-abonnements-reportes.md`).
- **Mode Foyer** : upsell multi-personnes sur le rapport one-shot, distinct de l'abonnement
  (cf. `arbitrages/mode-foyer-recadre.md` et `arbitrages/pricing-abonnements-reportes.md`).

futur·e occupe l'étage intermédiaire vacant du marché, entre le gratuit générique et le
service humain coûteux (chasseur immobilier 2-3 % du bien, coaching relocation 300 €+). Les
ancres psychologiques jouent en sa faveur : 14 € contre 600-800 € de diagnostics
obligatoires par transaction, 39 € contre le coût d'un aller-retour dans une commune mal
choisie. Réserve honnête : un étage vacant peut signaler une opportunité OU une absence de
demande solvable (voir hypothèse critique).

### B2B (relais, avant-première dès automne 2026, pas encore de produit payant)

Une page de pré-lancement publique existe (`/professionnels`, « futur•e Pro », avant-première,
capture de leads, `noindex`) : elle annonce un lancement **automne 2026, segment par segment**.
Aucun produit B2B n'est encore achetable. Calendrier et statut « relais, pas pilier » :
voir `adr/ADR-0008`. Quatre segments identifiés, dans cet ordre d'activation et avec cette
hiérarchie d'ARPU. La séquence est pensée pour un fondateur solo (ne pas tout activer en même
temps) et part du segment à la friction la plus basse.

- **CGP** (~4 000 cabinets ; ARPU ~64 €) : activé en premier, le produit actuel suffit, seul
  l'export PDF manque. Univers habitué à payer 20-150 €/mois par outil.
- **Agents et courtiers d'assurance** (~37 000 ; ARPU ~51 €, prix d'entrée bas 39 € pour la
  pénétration) : besoin données CatNat + export PDF. Volume le plus large, marge par client
  basse, valeur sur le volume et les plans Cabinet/Réseau.
- **Notaires** (~17 000, ~70 000 collaborateurs ; ARPU ~128 €, le meilleur) : cycle le plus
  long, besoin export PDF format acte + recherche par adresse. Levier = devoir d'information.
- **Diagnostiqueurs** (~11 600 certifiés ; ARPU ~35 €, le plus bas) : besoin version mobile.
  Volume max mais marge/client min ; la clé est le partenariat avec les éditeurs de logiciels
  métier (Liciel, Stelyx), sans quoi l'acquisition individuelle est trop chère.

Référence de prix marché B2B (sourcée) : CityScan facture l'analyse d'une adresse 6-8,50 € HT
aux professionnels. C'est la preuve que ces professions paient déjà pour de l'intelligence
territoriale, et le socle du dossier B2B. Pourquoi B2B en relais et pas en pilier : voir
`adr/ADR-0008`.

## Le dimensionnement marché (B2C, étude du 10 juin 2026, sourcé)

- **TAM décisionnel** : 1,5 à 2 M ménages/an (transactions, déménagements de bassin de vie,
  relocalisations retraite, déduplication faite). En valeur, au panier moyen de 22 € (mix
  pondéré 14 €/39 €, le Pack mieux mis en avant) : **35 à 55 M€/an**, hors abonnement. Le 22 €
  est un ticket moyen de calcul, PAS un changement de prix : le Pack reste à 39 €.
- **SAM** : 500 000 à 900 000 ménages/an, soit **10 à 18 M€/an**. Filtre principal et non
  mesuré : la disposition à payer 14-39 € face à une offre gratuite abondante (25-35 %).
- **SOM à 36 mois** : médian 5 500 à 8 000 ventes one-shot/an, **120 à 180 k€**/an de revenu
  one-shot (bas ~40 k€, haut 280-480 k€), hors abonnement et hors B2B qui s'additionnent.
- **SAM B2B agrégé** : 5 à 15 M€/an ; SOM B2B 2027-2028 : 20 à 80 k€/an en phase de
  validation.

Les projections internes de MRR mois par mois (mai 2026) ne sont PAS reprises ici : trop
volatiles, à réviser tous les 3 mois. Elles vivent dans le prévisionnel financier.

## Unit economics (forme durable)

SaaS pur : marge brute structurellement élevée (estimée ~91 % à M+12, ~95 % à M+36 : les
coûts marginaux montent bien moins vite que les revenus). Coûts fixes faibles (Vercel,
Supabase, Resend). **Coût variable dominant : l'API Claude** pour les synthèses
personnalisées (hypothèse ~0,015 €/appel, ~3 appels par utilisateur actif/mois). Acquisition
volontairement à budget zéro pendant ~12 mois (SEO + presse + prescription) ; paid envisagé
seulement à partir de M+13 quand les marges le permettent. Conséquence : la priorité absolue
d'acquisition est le SEO, dont le moteur est le maillage des pages communes
`/territoire/[theme]/[insee]` sur 34 000 communes.

## L'hypothèse critique (le pari central)

Personne n'a jamais démontré qu'un ménage paie pour de l'intelligence territoriale en ligne.
Le précédent CityScan est le cas d'école : version grand public lancée en 2017, monétisation
finalement reportée sur le B2B. La disposition à payer B2C est la variable à instrumenter en
premier (taux de clic des CTA payants, taux paywall vers paiement), avant toute dépense
d'acquisition. Tout chantier de données ou de feature passe après cette preuve.

## Risques de marché structurants

1. Le paiement B2C non démontré (précédent CityScan).
2. Concurrence gratuite frontale en SEO (City Score, Bien dans ma ville, ville-ideale,
   MeilleurVille occupent déjà « où vivre »/« ville idéale »).
3. Intégration d'un score climat par un portail immobilier (SeLoger, Bien'ici) : scénario le
   plus dangereux. Ces portails sont aussi l'acquéreur le plus plausible si la traction est
   prouvée.
4. Écart intention-action : le produit monétise la réflexion, pas le déménagement (le segment
   « sa propre commune » ne dépend d'aucun acte).
5. Dépendance au cycle immobilier, atténuée par les segments mobilité/retraite/ancrés.
6. Réglementation à double tranchant : un diagnostic territorial climatique obligatoire
   ouvrirait massivement le marché (surtout B2B) mais ferait entrer des acteurs
   institutionnels (Géorisques, DGS).

## Contexte d'accélération 2025-2026 (sourcé, étude)

Surprime CatNat passée de 12 % à 20 % au 01/01/2025 ; PNACC-3 fixant la trajectoire TRACC
(+2,7 °C en 2050, +4 °C en 2100, échelle France) ; intention de mobilité pour raison
climatique doublée en deux ans (13 % en 2023 à 28 % en 2025, Odoxa) ; précédent DPE (un
logement A se vend ~16 % plus cher qu'un D) qui prouve qu'une information territoriale lisible
devient un standard de marché.

## Liens

`adr/ADR-0008-b2b-relais-pas-pilier.md`, `adr/ADR-0002-pivot-compatibilite-territoriale.md`,
`adr/ADR-0007-pack-decision-bundle.md`, `arbitrages/pricing-abonnements-reportes.md`,
`arbitrages/mode-foyer-recadre.md`, `vision/archetype-lecteur.md`, `vision/positionnement.md`,
`doctrine/legal.md`, `/memory/business_modele_economique.md`,
`/memory/feedback_positionnement_compatibilite.md`, `/memory/project_paywall_territoire.md`.
