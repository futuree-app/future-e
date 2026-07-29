# Business Strategist — Le dossier adresse à 39 € : découpage, qualification, modèles de suite

- **Date** : 2026-07-29
- **Saisine** : `docs/handoff/CURRENT.md` §4 (brainstorming interrompu) et §5 (défaut latent `logement_id = ban_id`)
- **Statut** : rapport read-only. Rien n'est tranché ici, tout est argumenté et hiérarchisé.
- **Doctrine lue** : `docs/vault/vision/modele-economique.md`, `adr/ADR-0002`, `adr/ADR-0007` (+ addendum),
  `adr/ADR-0008`, `principes/invariants.md`, `arbitrages/recurrence-b2c-episodique-pas-mensuelle.md`,
  `arbitrages/pricing-abonnements-reportes.md`, `arbitrages/moat-assemblage-largeur-en-tunnel.md`.
- **Code vérifié** : `src/lib/access.ts` (`canAccessCompleteReport` = flag de plan global),
  `src/lib/active-territory.ts` + `src/lib/decision-packs.ts` (`report_grants` = droit par COMMUNE),
  `src/lib/checkout-products.ts` (un seul produit catalogue, `rapport-complet`, 14 €),
  `src/app/api/stripe/create-payment-intent/route.ts` (carte de prix serveur : `one-shot` 14 €,
  `pack-decision` 39 €), `src/app/(account)/rapport/logement/page.tsx` et `.../autour/page.tsx`
  (redirigent si `!canAccessCompleteReport`), `src/components/report/LogementModule.tsx` (l'événement
  `logement_same_commune_multi`).

---

## Le goulot aujourd'hui

**Zéro euro encaissé.** Le goulot doctrinal reste la disposition à payer B2C non mesurée
(`modele-economique.md`, hiérarchie de preuve), mais il faut le dire dans sa forme concrète du
29/07/2026 : *rien n'est achetable et testé de bout en bout, donc aucune des questions posées ne
peut être tranchée par autre chose qu'un raisonnement*. Le porteur en a d'ailleurs pris acte lui-même
sur la question « un dossier = une adresse », arbitrée par réversibilité asymétrique faute de donnée.

Deuxième formulation du même goulot, plus opérationnelle : **le nombre d'adresses qu'un projet
compare est la variable dominante et elle est aujourd'hui invisible**, parce que les seules surfaces
qui la produiraient (Logement, Autour) sont derrière le paywall. Le code le confirme : les deux pages
redirigent si `canAccessCompleteReport` est faux. Sans acheteur, l'instrument ne mesure rien.

Toute la suite se lit à travers ça.

---

## Décision évaluée

Re-découper l'offre B2C : **14 € = Territoire (commune seule)**, **39 € = commune + adresse
(Autour + Logement)**, un dossier acheté portant sur **une adresse** matérialisée par un objet
`address_dossiers`. Restent ouverts : la survie du 14 €, la qualification avant paiement, le modèle
après le premier dossier.

Ce que ça change concrètement dans le réel du code : aujourd'hui `canAccessCompleteReport` est un
**booléen de plan**, et `report_grants` un droit **par commune**. Il n'existe aucune notion de droit
par adresse. Le découpage proposé introduit donc un troisième niveau de granularité de droit, là où
le code n'en connaît que deux.

---

## La vraie question

**Ce n'est pas « comment découper l'offre », c'est « dans combien de jours une carte bancaire
peut-elle être débitée ».**

Je nomme la variable dominante : **le délai jusqu'au premier euro encaissé**. Elle domine pour trois
raisons vérifiables.

Un. Aucune des trois questions ouvertes (survie du 14 €, prix du 2ᵉ dossier, forme du pass) ne peut
être tranchée sans achats observés. Continuer à les raffiner produit des arbitrages qu'il faudra
rejuger dès la première vente.

Deux. Le découpage est **réversible dans le bon sens** (le porteur l'a déjà noté) : partir serré et
élargir ensuite ne lèse personne, tant qu'il n'y a pas d'acheteur. Chaque semaine passée à chercher
le découpage optimal consomme précisément la fenêtre où l'erreur est gratuite.

Trois. Il reste, d'après `/memory/project_comparateur_consolidation.md`, une migration
`supabase/15_pack_mode_choix.sql` non passée et **un achat Stripe jamais testé de bout en bout**.
Un tunnel de paiement non éprouvé est une variable qui met le chiffre d'affaires à zéro quelle que
soit la qualité du découpage. Elle est en amont de tout le reste.

Conséquence de méthode pour la suite de ce rapport : je tranche les trois questions, mais je les
tranche **dans le sens qui minimise le travail avant mise en vente**, pas dans le sens qui maximise
l'élégance du modèle.

---

## Marché et coût

### Qui paie, et ce qu'il achète vraiment

Hypothèse porteuse, à tester, jamais à asséner : ce qui s'achète à l'échelle adresse n'est pas de
l'information, c'est **le droit de se rassurer ou de renoncer sans avoir l'air irrationnel**.
L'acheteur ne cherche pas à savoir ; il cherche à pouvoir dire à son conjoint « on y va » ou « on
laisse tomber » avec autre chose que son intuition. Le produit vend un argument, pas un fichier.

### Le fait de marché qui contraint le contenu

À l'échelle adresse, une partie du terrain est **légalement gratuite et obligatoire** : l'état des
risques (ERP / ERRIAL, généré sur georisques.gouv.fr) est remis à l'acquéreur et au locataire, sans
frais, au moment de la transaction. Un dossier adresse qui se présenterait comme un bulletin de
risques réglementaires entrerait en concurrence frontale avec un document que l'acheteur recevra
gratuitement quelques jours plus tard, remis par un notaire, avec une autorité que futur•e n'aura
jamais.

C'est exactement la thèse du vault (« le climat n'est plus le marché, c'est le différenciant »),
appliquée à l'adresse. Le différenciant vendable est ailleurs : **la trajectoire** (ce que devient
cet endroit) et **le quotidien** (Autour : ce qu'on a autour de soi, à quel grain). Le réglementaire
est le socle de crédibilité, jamais l'argument de vente. Le handoff §3 dit la même chose avec d'autres
mots (« Logement se vendait par son contenu, pas par sa SORTIE »).

### L'ancre de prix se renforce en passant à l'adresse

`modele-economique.md` pose l'ancre « 39 € contre 600-800 € de diagnostics obligatoires ». Cette ancre
était bancale à l'échelle commune (le lecteur compare un rapport de commune à des diagnostics de
logement). **À l'échelle adresse, elle devient juste** : même objet, même moment, même acheteur, deux
ordres de grandeur d'écart. Le re-découpage améliore donc la lisibilité du prix, ce qui est un gain
réel, indépendant du contenu.

### Le concurrent affaibli

Aucun, à court terme. Le concurrent naturel à l'échelle adresse était CityScan : vérifié le 29/07/2026,
**cityscan.fr redirige vers « CityScan devient Modelo Insight »**, offre exclusivement professionnelle
(à partir de 30-50 € HT/mois), aucune offre grand public. Le précédent cité dans le vault (« CityScan
parti en B2B ») est donc non seulement confirmé, il s'est aggravé : l'acteur a été absorbé dans un
outil d'estimation pour agents. À noter dans `modele-economique.md`, car la référence de prix
« 6-8,50 € HT/adresse » citée pour le B2B doit être re-sourcée.

Lecture honnête de ce fait : c'est **ambigu**, pas rassurant. Soit le B2C adresse est un espace vide
parce que personne ne l'a bien fait, soit il est vide parce qu'il ne se vend pas. On ne le saura qu'en
vendant.

### Le coût

Le coût n'est pas le levier ici, pour une raison précise : le coût variable dominant est l'appel
Claude (~0,015 €/appel) et un fan-out d'API publiques. À 39 €, la marge reste sans effet sur la
décision. **Une seule exception, qui est un vrai levier** : un modèle « adresses illimitées » (pass ou
accès communal) déplacerait ce coût de borné à non borné, et surtout ouvrirait un usage de scraping
avec notre token Géorisques. C'est un argument de conception, pas de marge, et il tranche contre les
formules illimitées (voir §4).

---

## Question 1 — Le 14 € survit-il ?

**Recommandation : le 14 € survit, resserré sur Territoire, et cesse d'être le produit phare.**

Quatre arguments, du plus fort au plus faible.

**Il monétise le seul canal d'acquisition qui existe.** L'acquisition de futur•e est le maillage des
34 000 pages commune (`modele-economique.md`, « priorité d'acquisition absolue : le SEO »). Ce trafic
arrive **à l'échelle commune**, sans adresse, souvent sans bien identifié. Supprimer le 14 €, c'est
laisser ce trafic sans aucune sortie payante et exiger de chaque visiteur qu'il ait déjà un bien précis
en tête. On amputerait la monétisation du haut de parcours pour un gain de simplicité.

**Les deux prix ne sont pas deux niveaux de générosité, ce sont deux moments.** 14 € répond à « est-ce
que je peux vivre là », 39 € à « est-ce que je peux vivre *ici précisément* ». Un lecteur qui hésite
entre trois villes n'a pas d'adresse à donner. La cannibalisation supposée entre les deux repose sur
l'idée qu'ils s'adressent au même instant du parcours ; c'est faux dans la majorité des cas.

**Le 14 € rend le 39 € lisible.** Un prix unique ne dit rien de ce qu'on gagne en montant. Deux prix
avec une échelle explicite (« la commune » / « la commune et l'adresse ») transforment le paiement en
choix d'échelle, ce qui est précisément la doctrine retenue (« on vend l'échelle, pas le module »).

**Sa suppression n'est pas gratuite en temps.** Le handoff dit « la suppression est gratuite » : c'est
vrai commercialement (zéro acheteur lésé), faux techniquement. `checkout-products.ts`, la carte de
prix serveur, la page `/territoire/[insee]/debloquer` et le webhook existent et fonctionnent pour le
14 €. Le supprimer est du travail de suppression ; le garder coûte zéro heure. Dans un contexte où la
ressource rare est le temps du porteur, l'option par défaut est celle qui ne consomme rien.

### La collision de prix qu'il faut voir : deux produits à 39 €

Vérifié dans `create-payment-intent/route.ts` : `pack-decision` vaut déjà 39 €. Le dossier adresse
viendrait donc à un prix **déjà occupé par un autre objet** (la comparaison de 2-3 communes, ADR-0007).

Deux lectures.

La mauvaise : deux produits différents au même prix, le prix ne nomme plus rien, la page de vente
devient un catalogue.

La bonne, que je recommande : **39 € est le palier de la décision, sous deux formes.** En largeur, on
départage trois communes. En profondeur, on instruit une adresse. 14 € est le palier de la
compréhension. Cette lecture donne une grammaire de prix tenable, cohérente avec l'addendum d'ADR-0007
(« le Pack se définit par l'arbitrage, pas par le nombre de communes »), et elle évite d'inventer un
troisième prix.

Condition pour que ça tienne : **les deux formes ne coexistent jamais dans le même écran de choix**.
Elles se rencontrent à des moments différents du parcours ; les mettre côte à côte dans une grille
tarifaire ferait exactement le catalogue qu'on veut éviter.

### La faille de séquence à corriger tout de suite

Un lecteur qui paie 14 € puis découvre qu'il lui faut 39 € pour son adresse a payé deux fois pour un
ensemble qui se décrivait comme un tout. C'est le seul point où le re-découpage abîme la confiance.

Correctif, peu coûteux et à décider maintenant : **le 14 € déjà payé se déduit du dossier adresse**
(39 € moins 14 € déjà versés). Le droit existe déjà (`report_grants` par commune), donc la déduction
est vérifiable côté serveur. Elle a un effet secondaire précieux : elle rend le 14 € sans regret, ce
qui protège la conversion du haut de parcours qu'on vient de justifier.

---

## Question 2 — La qualification avant paiement

**Recommandation : la qualification pré-paiement, avec refus de vente. Le remboursement sur seuil est
écarté comme mécanisme affiché.**

Cinq raisons.

**Le remboursement est un aveu, la qualification est une preuve.** Refuser une vente est l'incarnation
la plus littérale de l'invariant n°1 (« on éclaire, on ne vend pas la décision ») et de l'invariant n°7.
Aucune page de marque ne produira jamais autant de confiance qu'un écran qui dit « sur cette adresse,
nous n'avons pas de quoi vous être utile, ne payez pas ». C'est du marketing gratuit qui parle en
faisant, pas en promettant.

**Le remboursement détruit la boucle de prescription.** Un remboursé ne revient pas et ne recommande
pas. La boucle de prescription est un des deux moteurs du modèle. Chaque remboursement retire un
prescripteur, alors qu'un refus de vente en crée un. L'asymétrie est massive et se joue exactement sur
l'actif que le vault dit protéger.

**Le remboursement consomme la ressource rare.** Chaque demande est un échange humain avec le porteur.
Les frais Stripe ne reviennent pas sur un remboursement, mais ce n'est pas le sujet : à ce volume,
c'est le temps qui coûte, pas les 1,4 %.

**Un seuil de remboursement affiché télégraphie le doute et s'invite au jeu.** Annoncer « si nous
trouvons moins de X éléments, vous êtes remboursé » revient à écrire sur la page de vente qu'on n'est
pas sûr de son produit, et à donner un critère chiffré à contester. Le seuil doit rester interne.

**Et surtout : la qualification est l'instrument de mesure du goulot.** C'est l'argument décisif, et il
ne figure pas encore dans le raisonnement du handoff. Une qualification **gratuite, par adresse, avant
tout paiement** produit exactement la donnée qui manque : combien d'adresses distinctes une même
personne soumet, dans combien de communes, sur combien de jours. Aujourd'hui cette donnée est
inaccessible parce que Logement et Autour sont derrière le paywall. La qualification la fait passer
devant. On obtient la variable dominante **sans un seul acheteur**.

### Ce que la qualification montre, et ce qu'elle ne montre jamais

- Elle montre **la matière** : ce qui sera examiné à cette adresse, et les manques propres à cette
  adresse (« aucun diagnostic retrouvé »). Jamais l'inventaire des sources que le produit n'a pas
  (le handoff a raison : ce serait un catalogue anxiogène).
- Elle ne montre **aucune valeur**, aucun état, aucun verdict, aucun « bonne nouvelle ». Sinon la
  qualification devient le produit gratuit qui rend le payant inutile, ce que
  `arbitrages/moat-assemblage-largeur-en-tunnel.md` interdit explicitement.
- Elle ne promet **jamais un résultat intéressant**. Dire « nous avons de quoi travailler » n'est pas
  dire « vous allez apprendre quelque chose ». Le handoff a déjà nommé le risque réel : « parcelle
  identifiée, sismicité faible, aucun risque réglementaire, pharmacie à 1,8 km » est honnête et
  décevant à 39 €. La qualification ne couvre pas ce risque-là, elle couvre le risque de socle absent.
  Il faut le savoir : elle réduit les remboursements, elle ne supprime pas la déception.

### Coût technique

Faible, et le fait vérifié du handoff est le bon garde-fou : ce doit être **une route publique dédiée,
légère, cachée par adresse, avec limite de débit**, jamais `/api/georisques-logement` (réservée au
rapport complet, fan-out ~10 API dont le token Géorisques). Sans ça, on publie un scraper gratuit de
la base DPE avec notre token. C'est une contrainte de conception, pas un coût.

### Ce qui reste du remboursement

Il subsiste, **non affiché**, en geste discrétionnaire du porteur. Un remboursement accordé sans
discuter à quelqu'un qui écrit est un acte de marque. Un remboursement promis d'avance sur un seuil est
un produit d'assurance qu'on ne veut pas vendre.

---

## Question 3 — Les moments où plusieurs adresses sont comparées

Tout ce qui suit est **hypothèse à tester**, jamais un fait. Je n'ai trouvé aucune source française
solide sur le nombre de biens comparés en shortlist, et je refuse de citer un chiffre de blog
immobilier comme s'il était mesuré. Ce qui suit est un cadrage des moments, à confronter au réel par
la qualification gratuite (§6).

**Moment A — l'exploration (3 à 9 mois).** Beaucoup d'adresses vues en ligne, quelques visites.
Urgence faible, engagement nul, disposition à payer par adresse quasi nulle. Un dossier à 39 € y est
structurellement inadapté : personne ne paiera 39 € huit fois. **C'est le territoire du gratuit et du
14 €**, à l'échelle commune. Vouloir vendre l'adresse ici est l'erreur la plus coûteuse possible.

**Moment B — la shortlist (quelques jours à deux semaines).** Deux ou trois biens qui tiennent la
route, un arbitrage réel, une échéance. Urgence forte, montant en jeu à six chiffres, disposition à
payer maximale. **C'est le moment du dossier adresse.** Point capital pour la suite : à ce moment, les
adresses arrivent le plus souvent **en séquence** (on instruit celle qui plaît, elle tombe ou elle
part, on passe à la suivante), rarement en parallèle. Cette séquentialité gouverne la réponse à la
question 4.

**Moment C — entre l'offre et la fin du délai de rétractation.** Urgence maximale, disposition à payer
maximale, fenêtre très courte. Mais **une seule adresse**, et une concurrence directe du dossier
notarial et de l'ERP gratuit. C'est un moment vendable, sur un argument unique : la trajectoire, ce
que le dossier notarial ne contient pas. Volume faible.

**Moment D — la location et la mutation.** Deux à quatre logements comparés, décision réversible,
engagement court. Disposition à payer faible. Le 39 € ne s'y adresse pas ; ne pas concevoir pour eux.

**Moment E — le professionnel.** Des dizaines d'adresses, un vrai besoin, un vrai budget. Hors sujet
ici : `ADR-0008` le range en relais 2027, et le point de marché ci-dessus (CityScan devenu Modelo
Insight) montre exactement la pente sur laquelle on glisserait.

**Ce que ce cadrage impose** : le dossier adresse est un produit de **fin de parcours**, acheté **une à
trois fois par projet**, **en séquence**, sur une fenêtre courte. Il ne se vend pas au volume, il se
vend à l'instant. Toute mécanique qui suppose un achat groupé simultané se trompe de moment.

---

## Question 4 — Le modèle après le premier dossier

**Recommandation : le 2ᵉ dossier à l'unité, plein tarif, sans remise ni pack, pendant le premier
trimestre de vente.**

Ce que les autres coûteraient, en complexité et en signal.

**Le pack de 3 prépayé.** Complexité : crédits non consommés à suivre, expiration à définir, produit de
remboursement implicite, et une question de rattachement comptable en franchise de TVA. Signal :
« forfait », donc « outil », alors qu'on vend un dossier. Coût le plus grave, invisible : **il détruit
l'information**. Un pack de 3 vendu ne dit plus si la personne voulait une adresse ou trois. On
achèterait un peu de chiffre d'affaires immédiat au prix de la seule mesure qui compte. Refus net à ce
stade.

**Le pass temporel (3 / 6 mois, adresses illimitées).** C'est la bonne direction à terme :
`arbitrages/recurrence-b2c-episodique-pas-mensuelle.md` a déjà gravé que le récurrent B2C est un pass
de recherche, pas un abonnement. Mais il est prématuré ici pour deux raisons. Il suppose connu le
nombre d'adresses par projet, qu'on ignore. Et « illimité » déplace le coût variable de borné à non
borné, sur des routes qui portent notre token Géorisques. **À rouvrir dès qu'on mesure une moyenne
supérieure à ~2,5 adresses par projet**, et pas avant.

**L'accès communal (toutes les adresses d'une commune).** C'est littéralement le défaut d'aujourd'hui
qu'on est en train de réparer (`report_grants` par commune). Le réintroduire annulerait la décision
« un dossier = une adresse » et sa justification par réversibilité asymétrique. Refus.

**Le 2ᵉ dossier à l'unité, plein tarif.** Complexité additionnelle : zéro (même checkout, même objet,
juste une ligne de plus dans `address_dossiers`). Signal : « chaque adresse est un dossier réel »,
cohérent avec le fait qu'on refuse de vendre là où le socle manque. Information produite : maximale,
c'est la mesure nue de la disposition à repayer.

Pourquoi **plein tarif** plutôt que dégressif, alors que le dégressif rapporterait plus : la même
réversibilité asymétrique qui a tranché « un dossier = une adresse ». Baisser un prix plus tard est
facile et bien accueilli ; le remonter est impossible. Et un dégressif introduit d'emblée du bruit dans
la mesure : on ne saurait pas si le 2ᵉ achat vient du besoin ou de la remise.

Séquence recommandée, à ne pas raccourcir : plein tarif → mesurer le taux de 2ᵉ dossier → si ce taux
est faible mais que la qualification montre que les gens soumettent plusieurs adresses, introduire une
remise → si la moyenne dépasse ~2,5 adresses, introduire le pass de recherche.

---

## Question 5 — La cannibalisation

**Entre 14 € et 39 €** : faible en tant que substitution (moments différents, §3), réelle en tant que
**friction de choix**. Le danger n'est pas qu'un lecteur prenne 14 au lieu de 39 ; c'est qu'il ne
choisisse pas du tout. Traitement : ne jamais présenter les deux comme une grille. Le prix se présente
là où le lecteur est, à l'échelle où il est. La déduction du 14 € payé (§1) neutralise le reste.

**Entre le Pack 39 € (largeur) et le dossier 39 € (profondeur)** : pas de cannibalisation économique
(mêmes euros, moments différents), mais un risque de **brouillage sémantique** si les deux
apparaissent ensemble. Traitement : la grammaire « 39 € = le palier décision, deux formes », et jamais
côte à côte.

**Entre le tunnel gratuit et le payant** : c'est ici que se joue le vrai risque, et il est créé par ma
propre recommandation. Une qualification gratuite par adresse est une surface nouvelle, publique, qui
touche à l'adresse. Si elle laisse échapper une seule valeur, elle devient un produit suffisant.
`arbitrages/moat-assemblage-largeur-en-tunnel.md` a déjà tranché la règle : la largeur reste gratuite,
la décision est payante. La qualification est de la **matière**, jamais de la décision. Cette frontière
doit être écrite dans le code, pas seulement dans l'intention.

---

## Question 6 — Le protocole de test sans historique payant

Principe : à N faible, **la statistique ne sert à rien et le qualitatif bat tout**. Ne rien construire
qui suppose des milliers de sessions.

**Étape 0, avant toute vente : la qualification gratuite mesure la variable dominante.** Nombre
d'adresses distinctes soumises par visiteur, sur combien de communes, sur combien de jours. Cette
mesure ne coûte aucun acheteur et répond seule à la question 4. C'est le meilleur rendement
information / heure de tout le protocole.

**Étape 1 : mettre réellement en vente, à petit volume, sans dépense d'acquisition.** Le seul test
valide d'une disposition à payer est un paiement. Pas de painted door, pas de faux bouton : le produit
existe, un tunnel factice abîmerait l'actif de confiance pour une information qu'un vrai encaissement
donne mieux.

**Étape 2 : parler à 5 à 8 personnes.** Les premiers acheteurs, et surtout les **refusés à la
qualification** et les **arrivés au checkout sans payer**. Trente minutes chacun, par le porteur. À ce
stade, huit conversations valent mieux que dix mille événements.

**Les critères de mort, décidés avant de regarder** (sinon on interprète après coup, ce que
l'invariant n°8 interdit dans l'esprit) :
- moins de 2 achats pour 100 vues de la page de vente adresse → le pari de l'échelle adresse est en
  question, ne pas construire le pass ;
- 5 achats ou plus pour 100 vues → sujet vivant, passer à la mesure du 2ᵉ dossier ;
- taux de 2ᵉ dossier inférieur à 15 % avec plus de 2 adresses qualifiées en moyenne → le problème est
  le prix ou la déception, pas la demande ; c'est là qu'on teste la remise.

**Ce qu'il ne faut PAS construire** : un test A/B de prix (distinguer 3 % de 5 % demande de l'ordre de
2 000 vues par bras, on ne les aura pas avant des mois), un tableau de bord, des cohortes, une
segmentation. Un tableur avec trois colonnes suffira pendant un trimestre.

---

## Question 7 — Les événements à instrumenter dès le lancement

**Défaut vérifié dans l'instrumentation actuelle** : `logement_same_commune_multi`
(`LogementModule.tsx` l. 182-190) compte les adresses distinctes via un `useRef`, donc **par session**,
et **par commune** (`Map` clé INSEE). Il rate donc le multi-session et le multi-commune, c'est-à-dire
exactement les deux façons dont un projet réel compare des adresses. Et il ne se déclenche que derrière
le paywall. En l'état, il ne pourra pas répondre à la question 4.

Correctif de fond, en une ligne de doctrine : **la clé d'analyse est le projet, pas la session ni la
commune.** Tout événement du dossier adresse porte un `project_id` stable (le `UserProject` existe
déjà) et un `address_token` anonymisé.

Liste minimale, dix événements, suffisante pour trancher 1, 2 et 4 dans trois mois :

| Événement | Propriétés | Ce qu'il tranche |
|---|---|---|
| `address_qualification_viewed` | `project_id`, `insee`, `rural_urbain` | volume d'intention à l'échelle adresse |
| `address_qualification_result` | `status: sellable\|refused`, `missing[]`, `has_dpe` | taux de refus réel, et sur quoi |
| `address_qualification_repeat` | `distinct_addresses_in_project`, `distinct_communes`, `days_since_first` | **la variable dominante** (question 4) |
| `address_dossier_checkout_viewed` | `project_id`, `price`, `scale: commune\|adresse` | dénominateur de conversion |
| `address_dossier_purchased` | `price`, `rank_in_project`, `days_since_first_qualification`, `credited_14` | question 1 et question 4 |
| `address_dossier_declined_after_refusal` (email laissé) | `insee`, `missing[]` | demande non servie, carte des trous |
| `address_dossier_opened` | `hours_since_purchase` | la valeur est-elle consommée |
| `address_dossier_reopened` | `days_since_purchase` | valeur dans la durée = préalable au pass |
| `address_dossier_shared` | `channel` | boucle de prescription |
| `refund_requested` | `reason` | ce que la qualification n'a pas attrapé |

Une propriété persistante sur la personne : `addresses_qualified_total`. C'est elle qui, dans trois
mois, répondra à « pack, pass ou unité ».

---

## Niveau de preuve

- **Certitude** : le droit est aujourd'hui communal et global (code lu). Le re-découpage est un
  resserrement, pas un ajout.
- **Certitude** : aucun achat, donc aucun grandfathering, donc coût de l'erreur nul aujourd'hui.
- **Preuve forte** : l'ancre de prix est plus juste à l'échelle adresse (diagnostics 600-800 €).
- **Preuve moyenne** : CityScan / Modelo Insight ne sert pas le B2C (vérifié ce jour) ; lecture
  ambiguë, ce n'est ni une preuve de vide exploitable ni une preuve d'absence de demande.
- **Pari non démontré, traité comme un fait dans le raisonnement actuel** : que **l'échelle adresse
  porte une valeur perçue supérieure à l'échelle commune**. Tout le re-découpage repose là-dessus. Ce
  n'est pas absurde, ce n'est pas mesuré. À écrire tel quel dans `paris.md`.
- **Pari non démontré, second** : qu'un projet compare assez d'adresses pour qu'un 2ᵉ dossier existe.
- **Pari central inchangé** : le consentement à payer B2C.

---

## Invariants et principes

- **n°1 (on éclaire, on ne vend pas la décision)** : renforcé par le refus de vente. C'est le plus bel
  usage de cet invariant depuis le début du projet.
- **n°7 (l'indépendance ne se monétise pas)** : non touché.
- **n°8 (les preuves, pas les intérêts)** : sous tension. Le re-découpage sert l'intérêt économique
  (39 € au lieu de 14 € pour le même contenu qu'aujourd'hui) sans preuve que la valeur perçue suit.
  Il est légitime, à condition d'être **nommé comme un pari** et non présenté comme une clarification.
- **n°2 (pas de score)** : la qualification ne doit jamais produire un indicateur de couverture
  chiffré présenté comme une note d'adresse. « 7 éléments sur 9 » est un score déguisé.
- **Principe B2C-d'abord (ADR-0008)** : renforcé. Le dossier adresse est exactement l'objet que les
  professionnels achèteront plus tard ; le construire pour le ménage d'abord respecte l'ordre.

---

## Risques structurants

- **Catégorie mal comprise** : risque **aggravé**. Un dossier par adresse ressemble, vu de loin, à un
  diagnostic. Le vault interdit de devenir un SaaS de diagnostics. La sortie du module (« à vérifier
  avant de décider ») est ce qui distingue les deux, et le handoff §3 note qu'elle est absente des
  surfaces de vente. C'est le premier travail éditorial à faire, avant le premier euro.
- **Paiement B2C** : ni aggravé ni atténué, enfin **mesurable**.
- **Concurrence gratuite** : aggravé d'un cran, parce qu'à l'échelle adresse le gratuit devient
  **obligatoire et institutionnel** (ERP au moment de la vente). Atténuation : vendre la trajectoire
  et le quotidien, jamais le bulletin réglementaire.
- **Portail immobilier** : aggravé. Un dossier par adresse est exactement ce qu'un SeLoger peut
  attacher à chaque annonce, gratuitement, avec un volume incomparable. C'est un argument pour que le
  moat reste l'assemblage et la trajectoire (ADR-0002), pas la fiche d'adresse.
- **Écart intention-action** : inchangé.

---

## Coût d'opportunité et pourquoi maintenant

Pendant qu'on affine le découpage, on ne fait pas trois choses qui déplacent davantage le chiffre
d'affaires pour un effort comparable : **passer la migration `15_pack_mode_choix.sql` et tester un
achat Stripe de bout en bout** (sans ça, le chiffre d'affaires est nul par construction), **corriger
le défaut §5** (`logement_id = ban_id`, deux appartements du même immeuble qui s'écrasent : gratuit
aujourd'hui, réclamation à 39 €), et **écrire la sortie de Logement sur la surface de vente**.

Pourquoi maintenant : parce que c'est la dernière fenêtre où resserrer un droit ne lèse personne. Le
jour du premier achat, cette fenêtre se ferme définitivement. C'est un excellent « maintenant », à
condition de le traiter comme une décision de dix minutes et non comme un chantier.

---

## Le vrai pari

Le prix n'est pas le pari. **Le pari est qu'une personne, au moment où elle hésite sur un bien précis,
préfère payer pour savoir ce que cet endroit devient plutôt que faire confiance à ce que le notaire
lui remettra gratuitement dans dix jours.**

---

## Vue extérieure

Si j'étais l'acheteur, devant une page qui me demande 39 € pour une adresse, ma première pensée serait :
« mon notaire me donne l'état des risques gratuitement, qu'est-ce que vous avez de plus ». Si la page
ne répond pas à cette phrase dans ses deux premières lignes, elle ne convertit pas. Aucun découpage
d'offre ne compensera ça.

---

## Verdict

**POURSUIVRE, borné.** Le re-découpage est juste, gratuit aujourd'hui, et améliore la lisibilité du
prix. Mais il est **hors du goulot**, et il ne mérite pas une heure de plus de conception.

- Le 14 € : **le garder**, resserré, avec déduction sur le dossier adresse.
- La qualification pré-paiement : **la faire**, avec refus de vente ; **écarter le remboursement sur
  seuil affiché**.
- Le modèle de suite : **le 2ᵉ dossier à l'unité, plein tarif** ; pack et accès communal refusés ; pass
  **DIFFÉRÉ**, condition de levée : moyenne mesurée supérieure à ~2,5 adresses qualifiées par projet.

---

## Si refus ou report, rédigé comme une victoire (prêt pour `arbitrages/`)

**Le pack de 3 dossiers et l'accès communal sont écartés.** Le pack aurait encaissé plus tôt en
échange de la seule information qui manque : combien d'adresses un projet compare réellement. On
refuse d'acheter du chiffre d'affaires avec de l'aveuglement. L'accès communal aurait rétabli, sous un
nom neuf, le droit trop large qu'on est précisément en train de resserrer pendant qu'il est encore
gratuit de le faire.

**Le pass de recherche est différé, pas abandonné.** Il reste la bonne forme du récurrent B2C
(`arbitrages/recurrence-b2c-episodique-pas-mensuelle.md`). Le lancer avant de connaître le nombre
d'adresses par projet reviendrait à fixer le prix d'un illimité dont on ignore la borne, sur des routes
qui portent notre token Géorisques.

**Le remboursement sur seuil affiché est écarté.** Il aurait inscrit notre propre doute sur la page de
vente, transformé chaque déception en échange avec le porteur, et retiré un prescripteur à chaque
incident. Refuser la vente avant l'encaissement fait l'inverse : ça coûte une vente et ça crée un
prescripteur.

---

## Cohérence, tensions non tranchées (posées à l'humain)

1. **Deux produits à 39 €.** Je propose la grammaire « palier décision, deux formes ». C'est une
   décision de positionnement, pas de business : elle appartient au porteur et à l'Editorial.
2. **Le pari du re-découpage sert l'intérêt économique sans preuve** (invariant n°8). Assumé comme
   pari, oui ; présenté comme clarification, non. Le porteur doit choisir le mot.
3. **Product Strategist en tension** : la qualification pré-paiement ajoute un écran avant l'achat.
   Je la défends comme instrument de mesure et de confiance ; il est légitime qu'on la conteste comme
   friction. C'est le bon débat, ADR-0006.

---

## Mise à jour de la doctrine, si la décision est prise

Dans `docs/vault/vision/modele-economique.md` :
- **Architecture d'offre** : 14 € devient « le rapport de territoire, à l'échelle de la commune » ;
  ajouter « 39 € = le palier décision, deux formes : la comparaison de 2-3 communes (Pack, ADR-0007)
  ou le dossier d'une adresse (commune + Autour + Logement) ». Préciser « un dossier = une adresse ».
- **Le moteur, "pourquoi paie-t-il"** : réécrire l'ancre de prix à l'échelle adresse (l'ancre
  diagnostics 600-800 € y devient exacte).
- **Hiérarchie de preuve** : ajouter aux paris non démontrés « l'échelle adresse porte une valeur
  perçue supérieure à l'échelle commune » et « un projet compare assez d'adresses pour qu'un 2ᵉ dossier
  existe ».
- **Risques structurants** : au risque « concurrence gratuite », ajouter que l'état des risques est
  **obligatoire et gratuit** au moment de la transaction, donc que le dossier adresse ne se vend jamais
  comme un bulletin réglementaire.
- **B2B** : re-sourcer la référence CityScan (cityscan.fr redirige vers Modelo Insight au 29/07/2026,
  offre professionnelle uniquement, à partir de 30-50 € HT/mois ; le « 6-8,50 € HT/adresse » n'est plus
  vérifiable en l'état).
- Nouvel arbitrage : `arbitrages/dossier-adresse-unite-pas-pack.md` (contenu ci-dessus).
- `paris.md` : deux paris nouveaux, avec critère de mort (voir §6).

---

## La version minimale (ce qu'on construit, et rien de plus)

1. Le 14 € reste tel quel, la copie dit l'échelle (« la commune »).
2. Un produit nouveau à 39 € : commune + une adresse. Une table `address_dossiers`. Pas de pack, pas de
   pass, pas de remise, pas de choix de DPE avant paiement.
3. La déduction du 14 € déjà payé.
4. Une route publique de qualification, légère, cachée par adresse, avec limite de débit : de la
   matière, aucune valeur, les manques propres à l'adresse, et un refus de vente.
5. Six événements sur les dix (les quatre premiers du tableau, plus `purchased` et `reopened`), tous
   portant `project_id`.

Rien d'autre avant le premier euro.

---

## Quand rouvrir ce sujet

- **Le pass de recherche** : dès que `address_qualification_repeat` montre une moyenne supérieure à
  ~2,5 adresses par projet, ou qu'un `address_dossier_reopened` significatif apparaît à J+30.
- **La remise sur le 2ᵉ dossier** : si le taux de 2ᵉ dossier est inférieur à 15 % alors que la
  qualification montre plus de 2 adresses soumises par projet.
- **La suppression du 14 €** : si, sur 100 achats, moins de 10 sont des 14 € non suivis d'un upgrade.
- **La qualification** : si le taux de refus dépasse ~20 % des adresses qualifiées, le problème n'est
  plus la vente, c'est la couverture ; le sujet redevient un sujet de données.
- **Le re-découpage entier** : si, sur 100 vues de la page de vente adresse, on est sous 2 achats. Alors
  ce n'est pas le découpage qui est faux, c'est le pari de l'échelle adresse, et il faut revenir au
  produit d'échelle commune.
- **Le portail immobilier** : le jour où SeLoger ou Bien'ici attache une donnée de risque ou de climat
  à ses annonces, tout ce rapport est à rejuger.

---

## Table d'allocation

| | |
|---|---|
| **Goulot actuel** | Zéro euro encaissé : la disposition à payer B2C n'est pas mesurée, et l'instrument (Logement/Autour) est enfermé derrière le paywall |
| **Variable dominante** | Le délai jusqu'au premier euro. Puis, immédiatement après : le nombre d'adresses qualifiées par projet |
| **Temps à investir** | 30 minutes pour graver le découpage et la déduction du 14 €. La qualification pré-paiement est un chantier court, à faire parce qu'elle mesure, pas parce qu'elle vend |
| **Impact attendu** | Le découpage seul : quasi nul sur le chiffre d'affaires tant que rien n'est en vente. La qualification : fort, sur l'apprentissage |
| **Temps à NE PAS investir** | Le pack de 3, le pass, l'accès communal, la grille tarifaire, tout test A/B de prix, tout tableau de bord |
| **Priorité suivante** | Passer `supabase/15_pack_mode_choix.sql`, tester un achat Stripe de bout en bout, corriger `logement_id = ban_id`, écrire la sortie de Logement sur la surface de vente |
| **Sujet à rouvrir** | Après 100 vues de page de vente adresse et 30 adresses qualifiées, ou dès qu'un pass devient justifiable (> 2,5 adresses/projet) |

**Si j'étais CEO** : je gèle le découpage en dix minutes (14 € commune, 39 € une adresse, déduction du
14 €, rien d'autre), je construis la qualification gratuite parce qu'elle est mon seul capteur avant la
première vente, et je ne rouvre ni le pack ni le pass tant que je n'ai pas encaissé trente euros.
