# Entrée commune vs Pack comparateur : qui porte le PREMIER test de WTP ?

> Business Strategist (contre-pouvoir rentabilité durable / allocation de la ressource rare).
> Passe bornée, subordonnée à mon rapport du 2026-06-28 (frontiere-gratuit-payant.md).
> Question unique : le premier vrai test de disposition à payer doit-il passer par l'entrée
> COMMUNE (paywall territoire 14 €) plutôt que (ou avant) le Pack comparateur 39 € ?
> Terrain : rapport du 28/06 + ADR-0008 + code `territoire/[insee]/debloquer/page.tsx`.

---

## Rappel du cadre (non rejoué)

Le goulot reste le **débit d'inconnus qualifiés** et le premier apprentissage visé est **binaire**
(~10-30 inconnus : quelqu'un paie-t-il ?). Pas le taux, pas le réglage de frontière. La question
d'aujourd'hui ne déplace donc PAS le goulot : elle choisit seulement **par quelle porte** on va
chercher le premier euro. C'est une question d'instrument de mesure, pas de priorité.

## État de préparation, sur pièces

Les deux portes sont **livrées et instrumentées** (attribution `source`/`rank` portée jusqu'au
paywall 14 €, funnel PostHog complet). Le paywall territoire est même éditorialement abouti :
hero de continuité, aperçu réel gaté, prose « pourquoi payant » qui porte déjà le bon recadrage
(« vous ne payez pas l'accès aux données publiques, vous payez leur croisement »). **Aucune des
deux n'est plus prête que l'autre.** L'argument « teste d'abord ce qui est le plus prêt » ne
départage pas : les deux le sont. Le départage se joue donc sur l'économie du signal, pas sur le
reste-à-faire.

## En quoi l'économie des deux entrées diffère pour un test de WTP

**Entrée commune (14 €) — le signal le plus RAPIDE, mais le plus AMBIGU.**
- Intention plus forte : on parle de SON lieu, l'engagement est déjà pris, ce n'est pas un « et
  si ». Moins de curieux, plus de gens en situation. Bon pour le débit qualifié.
- Friction plus basse : 14 € < 39 €. Le premier euro tombe plus vite. Pour un apprentissage
  *binaire* (« quelqu'un paie-t-il ? »), c'est l'avantage décisif.
- MAIS interprétation salissante : une vente à 14 € sur SA commune peut être de la **réassurance /
  assurance morale** (« est-ce que je me suis trompé ? »), pas l'achat de la catégorie-cible
  (« le travail de décision déjà fait »). Elle valide « la trajectoire climat d'un lieu se
  monétise » — ce qui est précieux — mais PAS le pari #3 (la valeur d'arbitrage du Pack). Ne pas
  lire une vente commune comme une validation du Pack.

**Entrée comparateur (39 €) — le signal le plus PROPRE sur la thèse, mais plus LENT.**
- Teste directement le moat différenciant (croisement × transformation, ADR-0002) et la catégorie
  « décision déjà faite ». Si ça paie, c'est la thèse cœur qui tient.
- Mais prix plus haut, intention plus hypothétique (« je ne sais pas où vivre »), donc premier
  euro plus lent et dénominateur plus bruité d'indécis.

**Verdict d'économie :** la commune donne le signal *binaire* le plus vite et au moindre coût ;
le comparateur donne le signal *de thèse* le plus propre. Ce ne sont pas le même test.

## Où pointer les 20-30 premiers ? — TRANCHE

**Ne pas choisir l'une CONTRE l'autre. Laisser l'intention router, instrumenter les deux, et
LEAD-MESURER sur la commune.** Concrètement :
1. Les deux portes restent ouvertes (coût marginal nul, déjà construites). Un inconnu arrive avec
   un lieu en tête → commune. Un inconnu indécis → comparateur. On ne force pas une porte qui ne
   correspond pas à sa situation : ce serait fabriquer un faux signal.
2. **Mais le porteur va chercher en priorité les inconnus « avec un lieu en tête »** (qui achètent
   / mutent / héritent vers une commune nommée) : intention plus forte, premier euro plus rapide,
   c'est là que le doute binaire dominant (« quelqu'un sort-il sa carte ? ») se lève le plus vite.
3. Attribution stricte par porte, pour ne jamais confondre les deux paris.

Pourquoi ne pas tout miser sur le comparateur : on attendrait plus longtemps un premier euro plus
cher pour un signal plus pur dont on n'a pas encore besoin (la pureté de thèse est un luxe de
l'étape 2). Pourquoi ne pas tout miser sur la commune : on risquerait de graver « ça marche » sur
un signal de réassurance et de croire la thèse validée à tort.

## L'adressabilité B2B change-t-elle l'ordre ? — NON, explicitement

L'entrée commune est B2B-adressable (CGP, notaires, diagnostiqueurs arrivent avec une adresse) :
c'est une vraie **optionalité**, à noter. Mais elle ne réordonne RIEN. ADR-0008 est clair : le
B2B *valorise* une preuve B2C, il ne la *fabrique* pas. L'adressabilité est un atout pour PLUS
TARD ; la laisser tirer le premier test en avant serait exactement l'erreur que l'ADR interdit
(le B2B qui dicte la roadmap cœur). On choisit la commune pour son intention B2C plus forte et sa
friction plus basse — **pas** pour son débouché B2B. Le jour où la preuve B2C tient, l'adressabilité
devient un accélérateur ; pas avant.

## Le piège de l'entrée commune (à tester, pas asséné)

Deux risques, posés en hypothèses (invariant n°8) :
- **Cannibalisation par le « gratuit perçu »** : « c'est MA commune, je peux la googler ». Plus
  fort que pour le comparateur (où la valeur = trancher entre options, non self-serviceable). Le
  différenciant du rapport 14 € (trajectoire climat + santé environnementale *croisées*) est
  précisément le non-googleable — bon — mais la *perception* de gratuité reste à vérifier en
  conversation.
- **Valeur assurantielle / anxiogène** : un rapport sur SON lieu peut glisser vers « dois-je
  partir ? », registre anxiété. Ça vend peut-être, mais ça abîme le positionnement (on éclaire,
  on ne fait pas peur, invariant n°1). Une vente obtenue par l'angoisse est du revenu vanité.

Ces deux pièges sont des **questions de conversation**, pas des bloqueurs : raison de plus pour
parler aux 5-10 premiers acheteurs commune, pas seulement compter les euros.

## Verdict

**POURSUIVRE en lead-mesurant sur l'entrée commune, comparateur maintenu en parallèle.** L'entrée
commune ne change pas la priorité (le goulot reste le débit) ; elle est le **meilleur porteur du
premier test binaire** parce qu'elle combine intention plus forte et friction plus basse. Mais
elle ne remplace pas le comparateur, qui reste le test propre de la thèse cœur. Et l'adressabilité
B2B ne réordonne rien (ADR-0008 tient).

## Mini-table d'allocation

| | |
|---|---|
| **Goulot actuel** | Débit d'inconnus qualifiés en décision active (inchangé). Cette question ne le déplace pas, elle choisit la porte de mesure. |
| **Où pointer le premier test** | Entrée COMMUNE en priorité (inconnus avec un lieu en tête), comparateur ouvert et instrumenté en parallèle. Attribution stricte par porte. |
| **Pourquoi maintenant** | Les deux portes sont livrées et instrumentées à égalité ; la commune fait tomber le premier euro le plus vite (intention + 14 € < 39 €) → lève le doute binaire dominant au moindre coût. |
| **Ce qu'on N'investit PAS** | Réordonner vers le B2B (ADR-0008) ; arbitrer prix/frontière ; construire une 3e surface ; forcer un inconnu vers une porte qui ne colle pas à sa situation. |
| **Piège à surveiller** | Lire une vente 14 € comme validation du Pack (faux) ; vente obtenue par réassurance/anxiété (revenu vanité) ; gratuit perçu « ma commune, je la google ». |
| **Sujet à rouvrir** | Après ~10-30 ventes/refus : comparer conversion ET *motif d'achat* par porte. Si la commune vend mais par réassurance → revoir le positionnement. Si le comparateur ne vend pas mais la commune oui → la thèse cœur (#3) est en question, pas le prix. |

## La version minimale

Mêmes 20-30 inconnus que dans mon rapport du 28/06, mais **biaisés vers des gens ayant déjà un
lieu en tête** (groupes mutation/achat sur une ville précise, mutés professionnels, héritage/
résidence secondaire), poussés vers le rapport commune 14 € ; comparateur laissé ouvert pour ceux
qui sont réellement indécis. 5-10 conversations, en demandant explicitement « pour quoi avez-vous
payé : trancher, ou vous rassurer ? ». Coût : quelques jours porteur, zéro acquisition payante.
Cela capte ~90 % de la valeur : premier euro plus rapide + qualification du *motif*, qui désambiguïse
le signal que le compteur seul ne donnera pas.

## Quand rouvrir / changer d'avis

- **Basculer le lead-measure vers le comparateur** si les ventes commune se révèlent majoritairement
  de la réassurance (motif anxiété) : alors le signal n'éclaire pas la thèse cœur et il faut le
  test propre.
- **Réordonner vers le B2B** uniquement si la preuve B2C échoue après débit réel, OU si un accord
  cadre se présente (ADR-0008, conditions inchangées) — l'adressabilité commune deviendra alors
  l'accélérateur, pas avant.
- **Fusionner / simplifier les portes** si l'instrumentation montre que les inconnus ne se
  distribuent pas du tout comme « lieu en tête vs indécis » (mon hypothèse de routage tomberait).

## Limite de mon regard

Je n'ai pas les données réelles (PostHog/Stripe). Je ne sais pas si l'entrée commune reçoit
aujourd'hui du trafic indépendant du comparateur (elle est conçue comme aval du parcours
« territoires découverts », cf. en-tête du code : « Retour aux territoires »). Si la commune n'a
PAS d'entrée autonome (on n'y arrive qu'après être passé par /ou-vivre), alors son avantage
« intention plus forte » est en partie illusoire et l'écart de propreté entre les deux portes se
réduit — point à vérifier avec le porteur avant de pousser des inconnus directement vers une URL
commune. La psychologie « réassurance vs trancher » est une hypothèse à tester, pas un fait.
