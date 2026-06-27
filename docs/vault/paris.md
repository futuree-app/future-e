# Les paris de futur•e

> Registre vivant — un type de page à part dans le vault. Ni invariant (ça bouge avec ce qu'on
> apprend), ni ADR (ce n'est pas une décision unique et datée), ni doctrine pure (ce n'est pas
> une règle, c'est un journal). C'est la **boucle de retour** du projet : la liste des croyances
> sur lesquelles futur•e a déjà engagé du travail, leur niveau de confiance, et ce qui les
> tuerait. Source des paris en prose : `vision/modele-economique.md` (section « Hiérarchie de
> preuve »). Fiche miroir : `/memory/project_paris_registre.md`.

## Pourquoi cette page existe

L'équipe d'agents de futur•e raisonne **avant** le fait : chacun juge une décision à l'aune de
la doctrine et de la vision. Aucun ne revient, **après**, demander si le réel a confirmé. Cette
page est ce retour. Elle existe avant l'agent qui l'exploitera un jour (voir le bas de page) :
on commence par la doctrine, comme pour le Discoverability Strategist.

Deux lignes la gouvernent — et gouverneront un jour l'agent :

1. **On réduit l'incertitude au coût le plus faible possible — on ne la supprime pas.** On ne
   cherche pas la preuve parfaite, mais le plus petit apprentissage utile. Cinq conversations
   valent souvent mieux qu'un test sous-dimensionné.
2. **L'absence de preuve n'est jamais une excuse pour ne pas décider.** Un pari sans signal se
   tranche par conviction et se *note* ici pour être revisité — il ne se gèle pas. Le registre
   sert à décider mieux, jamais à décider moins.

## Anatomie d'un pari

- **Statut** : non testé · en observation · appris · mort.
- **Confiance** : faible / moyenne / forte, *et sur quoi elle repose* (anecdote, analogie,
  doctrine, donnée). Nommer la nature de la preuve est déjà la moitié du travail.
- **Signal attendu** : ce qu'on verrait dans le monde si le pari est vrai.
- **Source de preuve** : *où* ce signal apparaîtra — donc ce qu'il faut instrumenter **avant**
  que la décision n'arrive (les conversations du fondateur d'abord, PostHog/Stripe ensuite).
- **Critère de mort** : ce qui invaliderait le pari (le seuil qui change la décision).
- **Ce qu'on a appris** : pas un verdict — ce que l'observation nous apprend *sur le lecteur*.
  Un pari infirmé sans apprentissage est du réel gâché.
- **Dernière revue** : date.

---

## Pari #1 — Le consentement à payer en B2C

Le pari central du modèle (précédent CityScan, parti en B2B faute de B2C). Tout le reste en dépend.

- **Statut** : non testé.
- **Confiance** : faible — repose sur des ancres de prix (14 € contre 600-800 € de diagnostics)
  et l'analogie DPE, pas sur une vente observée.
- **Signal attendu** : un taux de passage paywall → paiement non nul et stable sur le rapport 14 €.
- **Source de preuve** : d'abord les premières ventes et conversations directes ; ensuite Stripe
  (conversions) + PostHog (clic CTA payant → paiement). À instrumenter **en premier**.
- **Critère de mort** : conversion durablement quasi nulle malgré une intention forte en amont →
  le marché lit futur•e comme un gratuit-de-plus, pas comme un achat de décision.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-26.

## Pari #2 — La catégorie est comprise (« intelligence territoriale », pas « un comparateur de plus »)

Risque n°1 du modèle, et marketing avant d'être économique. C'est le pari le mieux servi
aujourd'hui par **toi** : ce que les gens disent de futur•e dans tes appels et tes emails. Le
premier capital d'un produit vient des humains, pas des dashboards.

- **Statut** : non testé.
- **Confiance** : faible — conviction de positionnement, pas encore confrontée à la façon dont un
  inconnu décrit le produit.
- **Signal attendu** : des gens qui, sans qu'on les guide, décrivent futur•e comme « ça m'aide à
  choisir où vivre », pas comme « un site de scores de villes ».
- **Source de preuve** : conversations, retours, interviews, emails — qualitatif, disponible dès
  maintenant.
- **Critère de mort** : on doit réexpliquer la catégorie à presque chaque interlocuteur → le
  produit ne porte pas son positionnement seul.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-26.

## Pari #3 — Le comparateur crée une valeur d'arbitrage qu'on paie

Le Pack Décision (39 €) parie que la comparaison complète vaut un achat, sur les communes que le
lecteur compare (2 ou 3 ; cf. `adr/ADR-0007` et son addendum).

- **Statut** : non testé.
- **Confiance** : faible — repose sur l'ancre « trois rapports valent 42 €, le Pack les réunit
  pour 39 € » et la doctrine du révélateur d'arbitrages, pas sur un achat.
- **Signal attendu** : une part de Packs dans les ventes, et des lecteurs qui formulent
  spontanément le besoin de *comparer* (pas seulement de comprendre une commune).
- **Source de preuve** : conversations d'abord ; Stripe (part Pack vs rapport simple) ensuite.
- **Critère de mort** : les acheteurs prennent le rapport simple et ne montent jamais au Pack,
  même bien mis en avant.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-26.

## Pari #4 — Le moment « j'ai déjà 2 villes en tête » est solvable

Le mode choix du comparateur (`modules/comparateur.md`) parie que le départage de lieux déjà
choisis est un moment d'achat. **Pari contesté en interne**, et c'est sa valeur.

- **Statut** : non testé.
- **Confiance** : faible, et *disputée*. Product et Business le tiennent pour le moment d'achat le
  plus chaud (intention déjà formée, douleur de se tromper présente). Une critique externe (ChatGPT)
  l'inverse : ce moment serait de la **réassurance** (le lecteur croit déjà connaître la réponse),
  donc une disposition à payer plus *faible* que le moment « je n'ai aucune idée où aller ». Personne
  n'a la donnée. C'est un angle mort de consensus, gardé ouvert exprès.
- **Signal attendu** : la conversion à 39 € des arrivées en mode choix (départage) au moins
  comparable à celle des arrivées par la découverte.
- **Source de preuve** : conversations d'abord ; Stripe + PostHog (conversion par porte d'entrée) ensuite.
- **Critère de mort** : les départageurs convertissent nettement moins que les découvreurs → la
  réassurance ne se monétise pas, le mode choix est un hook gratuit, pas un étage payant.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-26.

## Pari #5 — Le moment « choix » a du volume

- **Statut** : non testé.
- **Confiance** : faible — on suppose que beaucoup de gens arrivent avec des communes déjà en tête,
  sans donnée.
- **Signal attendu** : une part non marginale des sessions du comparateur saisit 2-3 communes à la
  main (vs rebond vers `/ou-vivre`).
- **Source de preuve** : PostHog après lancement (part des arrivées mode choix avec communes saisies).
- **Critère de mort** : presque personne n'emprunte la porte « choix » → le mode ne mérite pas son
  chantier, `/ou-vivre` + Pack suffisent.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-26.

---

## Pari #6 — Avant d'arbitrer, le lecteur veut savoir qu'aucune option n'est catastrophique

Issu du premier dogfood réel (Brest vs Lorient, 2026-06-27). Reformulé après critique externe : le bon niveau
n'est pas « la synthèse crée la valeur » (la synthèse n'est qu'un *véhicule*), mais le **changement d'état
mental** qu'elle produit. Le lecteur arrive avec « et si je faisais une énorme erreur ? » et cherche d'abord
à atteindre « ok, les trois options sont raisonnables » — *avant* de chercher le meilleur choix. Le bénéfice
premier est un **écran anti-catastrophe** (un seuil rassurant), pas un classement. Ce qui a soulagé le couple,
c'est « si La Rochelle est vivable, Lorient l'est confortablement » : une mise hors de danger, pas une
préférence.

Conséquence sur ce qu'on construit : un objet **borné et petit** (le lecteur est-il rassuré qu'aucune piste
n'est désastreuse ?), pas « une meilleure synthèse » (vague et infini). À **prototyper et mesurer**, pas à
ériger en colonne du produit.

- **Statut** : non testé.
- **Confiance** : faible — une anecdote forte (dogfood N=1, le fondateur, juge et partie), mais cohérente
  avec `vision/archetype-lecteur.md` (le bénéfice est émotionnel : « être en paix avec sa décision »).
- **Signal attendu** : les lecteurs cherchent/retiennent d'abord le rassurage (« aucune n'est un mauvais
  choix ») avant le départage ; les retours qualitatifs citent ce moment comme le soulagement.
- **Source de preuve** : conversations directes d'abord ; ensuite engagement (PostHog : le rassurage est-il
  lu/retenu avant le classement, ou sauté ?).
- **Critère de mort** : les lecteurs réclament d'emblée des chiffres bruts et le classement, et ignorent le
  rassurage → le besoin premier est l'arbitrage, pas la mise hors de danger.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-27.

---

## Pari #7 — Le besoin n'est pas la similarité, c'est l'ancrage (« ne pas repartir de zéro »)

Issu du même dogfood. Le porteur a demandé « trouve des villes proches de Brest » ; il a fallu fabriquer une
heuristique à la main. Reformulé après critique externe : le besoin réel n'est **pas** la similarité (qui
appelle un algorithme, une distance, un score caché — exactement ce que l'invariant n°2 interdit), c'est
**l'ancrage** : ne pas repartir d'une page blanche, partir de quelque chose qu'on connaît. Cet ancrage est
plus général que « comme Brest » : similaire à mon quartier, à mon mode de vie, à là où j'habite aujourd'hui.

Conséquence de doctrine : **bannir le mot « similaire »** dans toute incarnation. La bonne forme n'est pas un
moteur autonome mais une **entrée** dans le moteur existant : « Explorer à partir d'une commune » / « Commencer
par une commune que vous aimez ». Le moteur ne change pas, seule l'amorce change. À brancher sur le problème
déjà OUVERT par le board (« constellation », « territoires-jumeaux »), sans rouvrir un chantier.

- **Statut** : non testé.
- **Confiance** : faible — un seul dogfood, mais converge avec une exploration Researcher déjà cadrée.
- **Signal attendu** : récurrence de « pars de X » / « comme là où j'habite » dans les conversations / sondes ;
  les lecteurs amorcent volontiers par une commune-ancre plutôt que par une page blanche.
- **Source de preuve** : conversations et sondes du comparateur ; plus tard, part des sessions amorcées par
  une commune-ancre.
- **Critère de mort** : personne n'exprime ce besoin d'ancrage → l'amorce par commune n'apporte rien, la page
  blanche suffit.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-27.

---

## Pari #8 — La délibération de couple est un objet produit distinct

Issu du même dogfood (« ma conjointe et moi »). Préférences qui peuvent diverger, à peser ensemble.
L'archétype et le produit sont centrés sur un décideur unique. Objet possible « notre arbitrage » (partagé) —
à peser, pas à trancher.

- **Statut** : non testé.
- **Confiance** : faible — un seul cas, celui du fondateur.
- **Signal attendu** : des lecteurs qui réclament de pondérer / confronter deux jeux de préférences.
- **Source de preuve** : conversations directes ; plus tard, demandes explicites de comparaison de préférences.
- **Critère de mort** : les décisions observées sont quasi toujours mono-décideur, ou le « partage » n'ajoute
  aucune valeur perçue → détail d'usage, pas un objet produit.
- **Ce qu'on a appris** : —
- **Dernière revue** : 2026-06-27.

> Les besoins de **données** révélés par ce dogfood (ensoleillement/jours de pluie, eaux de baignade
> decision-grade) ne sont pas des paris : un pari est une croyance sur laquelle on a déjà engagé du travail.
> Ces données ne sont pas intégrées — elles vivent dans `recherches/inventaire-sources.md` (« Gaps validés par
> une décision réelle ») et deviendront éventuellement des paris quand leur intégration sera engagée.

---

## L'agent viendra après la page (pas l'inverse)

Ce registre est volontairement **sans agent**. Le « gardien de la calibration » (provisoirement
famille *Learning* ; jamais *Empiricist* ni *Evidence* : le centre de gravité est l'apprentissage,
pas la preuve) n'est **ni créé, ni mis en roadmap**. Raison, alignée sur le test d'admission de
`adr/ADR-0006` et la règle « la donnée doit exister » : pré-lancement, un tel agent n'a pas de
substrat et dégénérerait en Researcher (qui *génère* des hypothèses) ou en théâtre de mesure.

Son déclencheur n'est pas un **volume** mais un **besoin** : la première décision réelle affamée
de preuve (« Pack à 39 ou 49 € après quinze ventes ? »). Le jour où cette page vit d'elle-même,
l'agent apparaîtra presque seul, son mandat déjà écrit ici — exactement le chemin du
Discoverability Strategist (doctrine → scripts → outils → agent).

Quand il existera, ce qu'il protégera, en une phrase : **l'écart entre ce que futur•e croit et
ce qu'il a vérifié.** Sa frontière dure avec les autres : Business *projette* le modèle, lui
*constate* ; Data Curator garde les sources qui *entrent* dans le produit, lui regarde les données
sur sa *réception* ; Discoverability possède la mesure d'acquisition (Search Console), lui la
conversion et la rétention une fois le lecteur arrivé. Ses garde-fous sont déjà les deux lignes
du haut de cette page.

## Liens

`vision/modele-economique.md` (les paris en prose, section « Hiérarchie de preuve »),
`principes/invariants.md` (n°8 : évolue avec les preuves, jamais les intérêts),
`adr/ADR-0006-architecture-equipe-ia.md` (test d'admission, poste de travail, « la donnée doit
exister »), `adr/ADR-0007-pack-decision-bundle.md` (Pari #3), `vision/positionnement.md`
(Pari #2), `/memory/project_paris_registre.md`.
