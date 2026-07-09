# Rapport stratégique — Business Strategist (futur•e)
## Cadrage « Le Fil » : couche vivante / temporelle. 2026-07-09.

> Angle : renforce-t-il le moteur et le moat, ou les dilue-t-il ? Lentille allocateur de
> ressources rares. Évaluation datée, pas de la doctrine (cf. `../_README.md`).
> Prolonge et ne contredit pas `2026-06-26-pricing-le-fil-v2.md` (dont l'action « retirer le
> prix de /le-fil » est déjà appliquée, cf. `src/app/(public)/le-fil/page.tsx` l.204).

---

### Le goulot aujourd'hui

Le goulot de futur•e n'a pas bougé : **la disposition à payer B2C, non mesurée, sur les deux
produits réellement vivants (14 € et 39 €)**. Le tunnel est instrumenté (`pack_decision_cta_clicked`
→ `checkout_viewed` → `pack_payment_submitted` existent dans le code), mais l'intrant manque : le
**débit d'inconnus qualifiés en décision active exposés au payant** (cf. `project_tension_gratuit_payant`).
Tant que ce chiffre est proche de zéro, aucune décision sur un produit non construit ne peut être
prioritaire. Toute la suite se lit à travers ce filtre.

### Décision évaluée

Cadrer Le Fil : couche de veille nationale (4 flux — CatNat, Propluvia, Atmo, diffs Géorisques,
~80 % déjà intégrés), rattachée par tags géo, activée par abonnement à un périmètre, objet central
= le dossier threadé, discipline du silence. Deux segments débattus (B2C extension du rapport déjà
acheté vs B2B veille de portefeuille), un prix évoqué (~4,99 €/mois), un MVP à faible coût data
marginal. Rien n'est achetable aujourd'hui ; `/le-fil` est une liste d'attente `noindex`.

### La vraie question (mauvaise question posée)

Le porteur débat le **modèle de prix** et le **segment**. Ce sont les deux mauvaises questions,
et je peux nommer pourquoi.

La variable dominante que personne ne regarde, c'est le **taux de déclenchement réel par commune
et par an** : combien de fois, pour une commune typique déjà vendue, un des 4 flux franchit-il un
seuil qui mérite qu'on parle ? Ce chiffre décide de **tout** en amont du prix :

- S'il est de ~0,5 à 2 fois/an pour une commune médiane, alors **aucun modèle mensuel n'existe** :
  on facturerait 10-12 prélèvements pour 1-2 signaux, et la discipline du silence (le cœur de la
  promesse) devient la cause mécanique du churn. Le débat mensuel/annuel est réglé par la donnée,
  pas par l'intuition.
- S'il est élevé et concentré sur quelques communes exposées (littoral, PPRi, vallées), alors Le
  Fil n'est pas un produit uniforme mais une **valeur très inégale** selon le lieu acheté, ce qui
  interdit un prix unique et rapproche du modèle assurance.
- Il détermine si Le Fil est **un produit** (assez de valeur récurrente pour être vendu seul) ou
  **une feature de rétention** (trop peu pour être vendu, mais précieuse pour la boucle).

Ce chiffre est **mesurable maintenant, à coût quasi nul** : faire tourner les 4 flux sur les
communes déjà vendues et compter les franchissements sur 12 mois glissants rétrospectifs. On ne
price pas un silence qu'on n'a pas mesuré. Tant que ce nombre est inconnu, arbitrer 4,99 €/mois vs
49,99 €/an vs par-commune, c'est décorer un revenu qui n'existe pas — exactement le diagnostic du
rapport v2, ré-appliqué un cran plus haut.

### La tension mensuel vs discipline du silence (traitée à fond)

La tension posée par Claude principal est **réelle et structurelle**, pas un détail d'exécution.
Un prélèvement mensuel crée une **attente mensuelle de valeur**. Un Fil muet trois mois — ce qui,
si la discipline du silence est respectée, sera le cas le plus fréquent — se fait résilier avec le
sentiment « je paie pour rien ». Le mensuel et le silence sont en contradiction de conception :
le premier facture une cadence, le second promet l'absence de cadence. Classement des options :

- **(a) Assurance-attention** (on paie pour être couvert, le silence est le signe que tout va
  bien). C'est le **bon modèle mental** : il retourne le silence de passif (« je paie pour rien »)
  en actif (« pas de nouvelle, bonne nouvelle, et je serai prévenu si ça bouge »). Mais le modèle
  mental n'impose pas la cadence de facturation : une assurance se paie rarement au mois.
- **(b) Suivi inclus 12 mois dans l'achat du rapport, puis prolongation payante.** La plus forte
  côté B2C. Elle épouse trois choses d'un coup : (1) le fait acté que ~90 % des abonnés ont déjà
  acheté un rapport — Le Fil est une **extension**, pas une acquisition ; (2) la fraîcheur
  naturelle d'un rapport (les données publiques évoluent sur ~12 mois) ; (3) un **moment de
  re-consentement** franc à l'échéance, qui est précisément le signal de rétention que Le Fil est
  censé produire. Elle ne combat pas le silence : inclus = aucune attente mensuelle.
- **(c) Forfait annuel bas.** Aligne le silence (pas de coup mensuel ressenti) mais **encaisse
  d'avance** : il masque la rétention au lieu de la prouver (déjà tranché en v2). Bon pour le
  cash, muet sur « pourquoi il revient ».
- **(d) Par commune vs portefeuille illimité.** C'est l'axe de **segmentation**, pas de cadence :
  le B2C suit **une** commune (celle qu'il a achetée) ; le portefeuille illimité est la définition
  même du **B2B**. Ne pas mélanger les deux dans une même grille.

**Verdict cadence : le mensuel est la pire option pour un produit de silence.** Si Le Fil se
vend B2C, c'est (b) inclus-puis-prolongation, sur un cadre (a) assurance-attention. Jamais le
mensuel. Mais ce verdict est subordonné au taux de déclenchement : si (b) prolongé ne se justifie
pas parce que le déclenchement est trop rare, alors Le Fil B2C n'est pas un produit payant du tout
(voir ci-dessous).

### Marché et coût

Le coût **n'est pas le levier** ici, et c'est un piège : « 80 % intégré, coût data marginal » est
l'argument séducteur qui pousse à construire parce que c'est *pas cher*. Mais le coût qui compte
n'est pas l'API, c'est **l'attention du porteur** et le risque de **graver un produit qui combat
sa propre promesse**. Un coût de build faible ne rend pas le moment juste.

Qui paie et pourquoi sortirait-il sa carte, en **hypothèse** non assénée : côté B2C, l'inscrit
d'une liste d'attente « veille » n'est peut-être venu que pour un one-shot — il arbitre « 14 € ou
39 € ? », pas « est-ce que je m'abonne ? » (arbitrage `pricing-abonnements-reportes`). Côté B2B,
en revanche, la douleur économique est **réelle et déjà solvable** : notaires, CGP, assureurs
paient CityScan 6-8,50 € HT/adresse pour de l'intelligence territoriale, et la veille de
portefeuille (surveiller N adresses d'un stock client) est un besoin natif de ces métiers. Le B2B
est le **seul segment où la disposition à payer pour de la veille est prouvée par un tiers**.

### Effet sur le moteur

Le Fil vise le maillon explicitement le plus faible : le **« pourquoi revient-il »**. Sur le
papier, c'est le bon organe. Mais deux nuances d'allocateur :

- Le modèle nomme **deux** réponses au « pourquoi il revient » : le récurrent (Le Fil) **et la
  prescription** (le satisfait recommande au conjoint, au notaire). La prescription est peut-être
  moins chère à tester et compose davantage. Rien ne prouve que le récurrent payant batte la
  prescription gratuite pour renforcer ce maillon.
- Déplacer le « quand » vers la durée n'a de sens **qu'une fois le « pourquoi paie-t-il » du
  one-shot prouvé**. On ne prolonge pas une relation qu'on n'a pas encore su ouvrir.

### Effet sur le moat et les actifs

Le point dur. Les 4 flux sont **100 % publics** : n'importe quel agrégateur mieux financé fetch
CatNat, Propluvia, Atmo, Géorisques et pose des tags géo trivialement. **La donnée n'est pas le
moat.** Ce qui l'est : (1) l'**intégration au rapport déjà payé** (le contexte du lecteur, son
profil, sa commune) ; (2) la **voix** — la discipline du silence, ne pas crier au loup, le dossier
threadé qui accumule ; (3) le **temps** accumulé du fil.

Conséquence stratégique tranchante : **Le Fil détaché du rapport a un moat faible** (c'est un
agrégateur d'alertes copiable) ; **Le Fil greffé au rapport a un moat réel**. Cohérent avec la
doctrine d'accès (`project_frontiere_savoir_agir`) : Le Fil vend sa valeur propre, mais sa valeur
propre *est* la continuité de ce que le lecteur a déjà acheté. Un Fil B2C autonome, vendu à des
gens sans rapport, serait le pire des deux mondes : moat faible **et** cible non prouvée.

### Effet sur les boucles

Si Le Fil B2C est **inclus** (gratuit 12 mois avec le rapport), il **nourrit** les deux boucles :
la boucle d'apprentissage (on observe quels signaux font revenir, ouvrir, cliquer — capital de
compréhension) et la boucle de prescription (un fil vivant se partage mieux qu'un PDF figé). S'il
est **vendu cher en mensuel**, il risque de **court-circuiter** la boucle : peu de souscripteurs,
churn rapide, aucun signal exploitable, et l'annuel-upfront encaisse avant de prouver la rétention
(diagnostic v2). L'inclusion sert la machine ; la monétisation prématurée la prive de sa donnée.

### Niveau de preuve

Empilement de paris traités comme acquis dans le débat actuel : (1) un public d'abonnement B2C
existe ; (2) sa rétention est suffisante ; (3) le récurrent bat la prescription sur le « revient » ;
(4) le taux de déclenchement rend la veille assez vivante pour se vendre. **Aucun n'est mesuré.**
Le seul fait sourcé du dossier, c'est le pari B2B (les métiers paient déjà pour de la veille
territoriale, réf. CityScan) — et lui bute sur ADR-0008.

### Invariants et principes

- **Principe stratégique B2C-d'abord (ADR-0008)** : un Fil **B2B autonome lancé avant** que la
  preuve B2C ne soit faite le violerait frontalement. B2B = valorisation d'une preuve, jamais son
  point de départ. Le Fil ne doit pas devenir le cheval de Troie qui avance le B2B avant l'heure.
- **n°8 (preuves > intérêts)** : pricer / construire une rétention jamais observée, c'est avancer
  avec l'espoir. Toléré si assumé comme pari ; sanctionné si déguisé en acquis.
- **n°1 (on éclaire, on ne vend pas la décision)** : la discipline du silence *est* le respect de
  n°1 appliqué au temps. À protéger absolument — un Fil qui, pour justifier un prélèvement mensuel,
  se met à parler quand il n'y a rien à dire, trahit l'invariant fondateur.

### Risques structurants

- **Aggrave** le risque n°1 (catégorie mal comprise) si Le Fil devient un flux d'alertes anxiogène
  de plus : futur•e passe de « intelligence territoriale » à « appli d'alertes climat », catégorie
  déjà encombrée et faible en valeur.
- **Aggrave** le risque n°2 (paiement B2C non prouvé) si on investit l'attention dans un 4e produit
  avant d'avoir mesuré la carte bancaire sur les deux premiers.
- **Atténue** potentiellement le risque « écart intention-action » : un fil qui suit dans la durée
  peut accompagner le passage à l'acte — mais c'est une hypothèse à tester, pas un acquis.
- **Concurrence gratuite / agrégateur** : la partie « flux public tagué géo » est copiable ;
  seule l'intégration au rapport et la voix résistent.

### Coût d'opportunité et pourquoi maintenant

Pendant qu'on cadre Le Fil, on ne corrige pas le **bug PLM** (module cassé Paris / Lyon /
Marseille). C'est la **variable dominante côté production** : PLM, ce sont les trois plus grandes
villes de France, sur des pages **déjà vivantes et censées porter du revenu**, dans le tunnel qui
alimente le goulot. Un produit non construit (Le Fil) contre un produit livré cassé sur les trois
plus gros marchés : l'allocation n'est pas discutable. **PLM d'abord.**

« Pourquoi maintenant ? » : rien n'est mûr. Produit non construit, rétention non observable,
consentement B2C non mesuré, taux de déclenchement inconnu. Le seul geste mûr et gratuit, c'est
**la mesure** du taux de déclenchement (voir version minimale), qui ne coûte presque rien et
débloque toutes les décisions ultérieures.

### Le vrai pari

« **Il existe assez de signaux qui franchissent un seuil, assez souvent, pour qu'un lecteur ayant
déjà payé son rapport trouve une valeur récurrente à être suivi — et revienne, ou prescrive, à
cause de ça.** » Le prix n'est presque jamais le pari ; ici le pari est le **taux de déclenchement
× la rétention**. Tant qu'il n'est pas mesuré, tout prix est une décoration.

### Vue extérieure

Si j'étais l'investisseur : je verrais un fondateur solo tenté de construire un 4e produit
(récurrent, non prouvé) alors que le 1er (14 €) n'a pas encore démontré qu'on sort la carte, et
que les 3 plus grosses villes sont cassées en prod. Je dirais : « montre-moi 30 ventes et un
module PLM qui marche avant de me parler d'abonnement. »

Si j'étais le concurrent (portail immo, agrégateur financé) : la couche « alertes publiques taguées
géo » ne me fait pas peur, je la refais en un trimestre. Ce qui me ferait peur, c'est que futur•e
tienne une **relation** dans la durée avec un lecteur qui lui a déjà confié son projet de vie. Donc
je pousserais futur•e à détacher Le Fil du rapport (moat faible) plutôt qu'à l'y greffer.

### Verdict : DIFFÉRER la monétisation, MESURER maintenant, greffer plus tard

- **Ne pas construire Le Fil comme produit payant maintenant.** Ni B2C mensuel, ni B2B autonome.
- **Mesurer maintenant** le taux de déclenchement des 4 flux sur les communes déjà vendues (coût
  quasi nul, débloque tout).
- **Route B2C = extension incluse**, pas produit vendu séparément : quand Le Fil sera livré, le
  greffer **inclus 12 mois** au rapport, cadre assurance-attention, prolongation payante à
  l'échéance. Jamais mensuel. C'est la seule forme qui compose (moat + boucles) sans combattre le
  silence.
- **Route B2B = le vrai produit payant du Fil**, mais **séquencé après** la preuve B2C (ADR-0008).
  Le Fil n'avance pas le B2B ; il en sera un **format** (veille de portefeuille) le jour venu.

### Si report — victoire stratégique (prête à graver)

*Dilution évitée.* On a écarté un 4e produit récurrent, non prouvé, dont le modèle mensuel
combattait sa propre promesse (le silence), au profit du seul goulot réel (consentement B2C sur
14/39 €) et du seul produit cassé qui saigne (PLM). On a refusé de pricer une rétention jamais
observée et de graver une ancre sur une page qui ne prend pas de carte. On a nommé que la donnée
du Fil n'est pas le moat (publique, copiable) : le moat est l'intégration au rapport payé et la
voix — ce qui condamne l'idée d'un Fil B2C autonome et sauve l'idée d'un Fil-extension. On a
protégé la discipline du silence comme application temporelle de l'invariant n°1.

### Cohérence (non tranchée, posée au porteur)

1. **Récurrent payant vs prescription gratuite** comme réponse au « pourquoi il revient ». Le
   modèle nomme les deux ; on n'a pas testé que le premier bat le second. Tester la prescription
   d'abord (moins cher, compose plus) ?
2. **Le Fil B2C = feature de rétention (incluse, gratuite) ou produit (vendu)** ? Ma lecture penche
   feature-incluse tant que le déclenchement n'est pas prouvé abondant. À trancher par la mesure.
3. **Le Fil comme accélérateur ou disperseur du B2B 2027** : la veille de portefeuille est le
   format B2B naturel du Fil, mais la construire pour le B2B avant la preuve B2C heurte ADR-0008.

### Mise à jour de doctrine (prête à écrire)

- `arbitrages/pricing-abonnements-reportes.md` : ajouter « Le mensuel est écarté par conception
  (combat la discipline du silence) ; direction B2C = inclus 12 mois au rapport + prolongation,
  cadre assurance-attention ; prix tranché après mesure du taux de déclenchement ET du
  consentement B2C sur 14/39 €. »
- `modele-economique.md`, maillon « pourquoi revient-il » : « Le Fil ne se price pas avant que son
  taux de déclenchement par commune/an soit mesuré ; sa donnée (flux publics) n'est pas le moat,
  son intégration au rapport payé et sa voix le sont ; un Fil détaché du rapport a un moat faible. »
- Risques structurants : noter le risque « appli d'alertes » (glissement de catégorie).

---

### Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Disposition à payer B2C, non mesurée, sur les produits vivants (14 € / 39 €) — faute de débit d'inconnus qualifiés devant le payant. |
| **Variable dominante** | Le **taux de déclenchement réel par commune / an** des 4 flux (décide format, cadence, prix, produit-ou-feature). Le débat prix/segment est en aval. |
| **Temps à investir** | Mesure du taux de déclenchement : ~1 à 2 jours (rejouer les 4 flux sur les communes vendues, compter). Zéro build produit. |
| **Impact attendu** | Fort en information (débloque toute décision Le Fil), nul en CA immédiat. |
| **Temps à NE PAS investir** | Le débat 4,99 €/mois vs annuel vs par-commune ; construire le MVP payant ; toute route B2B autonome maintenant. |
| **Priorité suivante** | Le **bug PLM** (Paris/Lyon/Marseille cassés = 3 plus gros marchés, prod, dans le tunnel) ; puis distribution founder-led vers 20-30 inconnus pour mesurer le consentement 14/39 €. |
| **Sujet à rouvrir** | Après (a) ≥ 30 ventes ou ~1 000 sessions instrumentées prouvant le consentement B2C, ET (b) taux de déclenchement mesuré ≥ ~1/trimestre pour une commune médiane. Alors trancher inclus-puis-prolongation (B2C) puis format portefeuille (B2B). |

**Si j'étais CEO** : je ne construirais ni ne pricerais Le Fil ce trimestre ; je passerais deux
jours à mesurer le taux de déclenchement sur les communes déjà vendues, je réparerais PLM, et je
ne rouvrirais l'abonnement qu'une fois la carte bancaire prouvée sur le 14 € — et alors comme
extension incluse au rapport, jamais en mensuel.

### Version minimale (~90 % de la valeur)

Ne rien vendre, ne rien construire de facturable. **Rejouer les 4 flux (déjà à 80 %) sur le stock
de communes déjà vendues et compter les franchissements de seuil sur 12 mois glissants.** Ce seul
test — quelques jours, zéro nouveau checkout, zéro risque de graver une ancre — répond à la
question qui commande toutes les autres : Le Fil est-il un produit ou une feature, et à quelle
cadence. C'est l'asymétrie recherchée : coût minuscule, information qui débloque tout.

### Quand rouvrir ce sujet

- Le taux de déclenchement mesuré ressort **abondant et régulier** (≥ ~1/trimestre pour une commune
  médiane) → Le Fil redevient un candidat produit ; rouvrir la cadence (inclus-puis-prolongation).
- **≥ 30 ventes** 14/39 € ou **~1 000 sessions instrumentées** → consentement B2C tranché, le
  maillon « revient » devient légitime à financer.
- Un **accord-cadre B2B** (réseau notarial, éditeur logiciel, assureur) se présente avec la veille
  de portefeuille comme besoin nommé → rouvrir la route B2B (dérogation ADR-0008 assumée).
- Le module **PLM** est réparé et le débit d'inconnus démarre → l'attention se libère pour un 4e
  produit.
- À l'inverse, si la mesure montre un déclenchement **rare** (< 1/an médian) → graver que Le Fil
  n'est **pas** un produit payant B2C, seulement une feature de rétention incluse, et réallouer.
