# Journal produit — premier test réel par Julien et Lisa à Ciré-d’Aunis (2026-08-16)

> **Nature** : entrée de journal produit, matière source pour recherche et arbitrage ultérieurs.
> **Statut global** : consigné et confronté au dépôt le 16/08/2026 ; aucune suggestion ci-dessous
> n’est une décision produit, un engagement de roadmap ou une modification de code.

## Contexte et niveau de preuve

- Participants : Julien et Lisa, deux personnes lors d’une même session.
- Date : 16 août 2026.
- Situation : premier test réel de futur•e, sur ordinateur, pour le bien situé
  **2 Chemin des Pierrières, 17290 Ciré-d’Aunis** (identifiant BAN
  `17107_gi7uj3_00002`). L’adresse a été retrouvée après la première consignation, à partir de la
  facture et du dossier de production associés au paiement.
- Unité d’observation : une session, une adresse, deux voix rapportées ensemble. Ce signal peut
  révéler un risque ; il ne permet pas seul d’estimer sa fréquence ni de décider d’une solution.
- Conservation de la voix : les champs **Retour brut** reprennent les formulations reçues sans les
  corriger. Tout ce qui les interprète vit dans un champ distinct.
- Périmètre du complément d’enquête : lecture seule des artefacts de production figés le soir du
  test, confrontation au code qui les rendait et, pour « Autour », contrôle ponctuel dans les
  sources disponibles le 16/08/2026. Le compte n’a pas été modifié et aucun dossier n’a été
  régénéré.
- Relance reçue après la première analyse : Julien a précisé les lignes qu’il jugeait inexactes
  dans « Autour » et a nommé une contradiction sur l’inondation. Ces précisions sont conservées
  séparément des verbatims initiaux dans JL-11 et JL-13.

## Pièces du dossier réellement livré

Cette section n’ajoute aucun retour utilisateur : elle expose les faits qui permettent de relire
les verbatims sans les réécrire.

### Chronologie retrouvée

- **18 h 23 min 49 s (heure de Paris)** : paiement de **19 €**, au tarif de lancement, pour un
  dossier attaché à cette adresse. La facture porte bien une seule adresse.
- **18 h 23 min 51 s** : l’envoi du courriel de dossier est accepté par le prestataire ; cela prouve
  l’envoi applicatif, pas à lui seul la réception dans la boîte.
- **18 h 24 min 57 s** : le projet est enregistré, soit environ 68 secondes après le paiement.
- **18 h 25 min 07 s** : les artefacts de décision Territoire et Adresse, version 1, sont figés.
- **18 h 30 min 58 s** : la synthèse du logement est générée.
- **18 h 33 min 24 s** : le snapshot « Autour » est calculé ; ses sources BPE et OSM ont toutes
  répondu complètement pendant cette même session.

Cette chronologie confirme l’ordre vécu dans ce funnel : **paiement, puis expression du projet**.
Elle ne dit pas, à elle seule, quel ordre serait préférable.

### Projet réellement exprimé et matière réellement disponible

- **Réponse de projet enregistrée, verbatim** : « Nous cherchons une maison au calme avec de la
  surface en jardin. »
- Le parseur n’a retenu comme préférence mesurable que `cadre_calme`. « Maison avec jardin » a été
  classé hors mesure, comme critère affectif ; aucune contrainte dure n’a été enregistrée.
- Le questionnaire principal en six questions n’a pas été utilisé (`wizard_answers` est vide).
- Un DPE existait à l’adresse, mais aucun diagnostic n’a pu être attribué à ce logement précis ; le
  module DPE est donc resté en attente de sélection.
- Les deux verdicts figés, Territoire et Adresse, sont neutres : « Dans ce qui a pu être examiné,
  rien ne penche nettement pour ou contre Ciré-d’Aunis. » L’artefact Adresse contient seulement deux
  cartes de contrôle, sur le retrait-gonflement des argiles et la sinistralité communale.
- La synthèse Logement conservée décrit une exposition moyenne aux argiles, une sismicité modérée,
  une faible sinistralité sécheresse à l’échelle communale, l’absence de DPE attribuable et
  l’absence d’enjeu aigu. Elle ne fabrique donc pas un avantage ou un risque pour remplir l’espace.

La faible matière perçue ne s’explique pas par une panne générale des sources : elle résulte au
moins autant du fait que le jardin n’est pas mesuré, que le calme n’a donné aucun écart net, que le
DPE n’était pas attribuable et que les règles d’intégrité empêchent de dramatiser une adresse sans
signal aigu.

### Snapshot « Autour » réellement affichable

- Boulangerie : environ **903 m** ; école primaire : **729 m** ; pharmacie : **940 m** ; bureau de
  poste : **951 m** ; aucun point de transport recensé dans les **3 km** analysés.
- Aucun de ces cinq repères du quotidien n’est à moins de 500 m à vol d’oiseau. Le rendu le dit sans
  qualifier le secteur de « bien » ou « mal » desservi.
- Espace cartographié le plus proche : un objet OSM `natural=wood`, affiché comme **« Bois » à
  environ 253 m**. L’objet ne porte ni nom ni indication d’accès public : la distance au bois est
  reproductible, mais elle ne prouve pas l’existence d’un parc accessible.
- Aucune autoroute, route à grande circulation ou voie ferrée n’a été trouvée dans les 1,5 km
  cherchés ; aucun bloc « abords » n’était donc rendu.
- Aucune autorisation d’urbanisme créant des logements n’a été trouvée à moins de 50 m parmi les
  dossiers déposés depuis 2023 ; le registre a été consulté le 16 août 2026.
- L’îlot de chaleur n’était pas qualifiable à cette adresse. Le taux automobile affichable était
  **95,7 % des ménages**, mais au grain de toute la commune, avec la réserve explicite que
  Ciré-d’Aunis n’est pas découpée en secteurs, source Insee recensement 2022.

Contrôle de fraîcheur effectué le 16/08/2026 : le produit affichait la **BPE 2024**, alors que
l’Insee avait publié la [BPE 2025 géolocalisée](https://www.insee.fr/fr/statistiques/8217525) le
4 août 2026. La dette de millésime est donc réelle. En revanche, le fichier officiel BPE 2025 redonne
les quatre mêmes équipements aux mêmes distances utiles — l’écart maximal est l’arrondi du bureau
de poste, 951/952 m — et toujours aucun transport dans les 3 km. Une interrogation OSM effectuée le
même jour retrouve aussi le bois à 253 m. Le contrôle n’a donc pas reproduit de valeur numérique
fausse parmi les lignes ci-dessus.

Après la relance, deux contrôles d’existence ont été ajoutés. L’[École primaire du
Marais](https://www.intramuros.org/ballon/etablissements_scolaires/45229), au 1 rue de la Mairie, est
encore documentée par le service local, avec des menus publiés en 2025 et 2026. Une boulangerie
exploitée sous le nom [Le Lion Gourmand](https://sarl-le-lion-gourmand.eatbu.com/?lang=fr) se présente
au 6 Grande Rue, au même point que celui de la BPE. Ces indices corroborent les points BPE, mais ne
constituent pas une vérification physique de leur ouverture le 16/08/2026. Le produit ne conserve ni
le nom, ni l’adresse, ni un identifiant d’établissement dans son snapshot : il ne montre que le type
« Boulangerie » ou « École primaire » et une distance à vol d’oiseau. Le lecteur ne peut donc pas
identifier facilement ce qui a été compté ni contrôler son accessibilité ou son ouverture réelle.

### Ce qui ne peut pas être rejoué exactement

Les paragraphes générés lors des clics sur 2030 et 2050 ne sont pas persistés. Les artefacts de
décision, la synthèse Logement et le snapshot « Autour » sont auditables après coup ; les synthèses
d’horizon ne le sont pas. Cette limite d’observabilité empêche de comparer mot à mot les deux sorties
vues par Julien et Lisa, même si leurs entrées climatiques et le comportement du générateur peuvent
être contrôlés.

## Légende

### Typologie

`Fiabilité / données` · `Bug / UX` · `Compréhension` · `Valeur perçue` · `Pricing / offre` ·
`Comparaison / décision` · `Positif`

### Priorité provisoire fondée sur le risque produit

- **P0** : confiance, exactitude ou blocage critique ; un P0 peut rester à confirmer.
- **P1** : gêne significative dans le parcours, la compréhension ou la valeur obtenue.
- **P2** : amélioration utile sans risque majeur démontré.
- **Exploration** : hypothèse à valider avant toute décision.

Le **statut** décrit seulement le traitement de l’observation (`confirmé dans le dépôt`,
`partiellement couvert`, `à préciser`, `question ouverte`, `signal positif`). Il ne vaut jamais
priorisation de roadmap.

## Registre détaillé

### JL-01 — Esthétique générale

- **Typologie** : Positif
- **Priorité provisoire** : Exploration
- **Retour brut** : « Esthétique très beau et moderne. »
- **Problème utilisateur éventuellement révélé** : aucun dans cette formulation ; signal positif
  sur la première impression.
- **État réel constaté dans le dépôt** : le dépôt porte un système visuel transversal et de nombreux
  composants partagés. Ce retour ne permet pas d’isoler la page ou le composant à l’origine de
  l’impression.
- **Hypothèse d’explication** : l’identité visuelle et la cohérence des surfaces ont produit un effet
  de qualité perçue dès la première session.
- **Piste éventuelle, non décidée** : demander quelles pages ou quels détails ont le plus contribué à
  cette impression afin de protéger ces actifs lors de futures itérations.
- **Statut de traitement** : signal positif consigné ; aucune action décidée.

### JL-02 — Un champ « Nom et prénom » plutôt que deux champs

- **Typologie** : Compréhension
- **Priorité provisoire** : P2
- **Retour brut** : « Formulaire inscription, fais plutôt une case par question (une prénom une nom,
  plus facile à gérer pour ta database). »
- **Problème utilisateur éventuellement révélé** : le champ d’identité groupé peut sembler moins
  structuré ou moins conforme au modèle mental attendu d’un formulaire d’inscription. Le retour
  formule toutefois surtout un conseil de modélisation, pas une difficulté d’usage explicite.
- **État réel constaté dans le dépôt** : `src/components/AuthForms.tsx` demande un unique champ
  `fullName`, libellé « Nom et prénom », avec l’indication qu’il figurera sur les factures et que
  rien d’autre n’en dépend. `src/app/auth/actions.ts` normalise ce champ puis l’enregistre dans la
  métadonnée Supabase Auth `full_name`, qui est aussi la clé fournie par la connexion Google.
  `src/lib/invoice.ts` l’utilise pour nommer l’acheteur sur la facture. Aucun usage distinct de
  `first_name` et `last_name` ni schéma séparé n’a été trouvé. Dans ce cas réel, la valeur saisie et
  portée sur la facture est une désignation commune de deux personnes, pas un couple prénom/nom
  d’une personne unique. Une scission automatique ne saurait pas la répartir correctement.
- **Hypothèse d’explication** : Julien ou Lisa anticipe un besoin de base de données que le produit
  actuel n’a pas. Scinder le champ aujourd’hui modifierait aussi la réconciliation avec Google et
  le contrat de facturation ; ce n’est donc pas une correction évidente.
- **Piste éventuelle, non décidée** : vérifier d’abord s’il y a eu une hésitation réelle à la saisie,
  puis n’envisager deux champs que si un usage produit, légal ou analytique distinct du prénom et du
  nom est établi.
- **Statut de traitement** : comportement et usage réel du champ confirmés ; préférence utilisateur
  consignée, mais le cas d’un achat à deux rend la solution proposée non triviale ; aucune
  modification décidée.

### JL-03 — Ordre questions, résultat et paiement

- **Typologie** : Bug / UX · Valeur perçue
- **Priorité provisoire** : P1
- **Retour brut** :
  - « J'inverserais le process de ces deux étapes. »
  - « D'abord le client répond aux questions, ensuite tu le frustres et l'invite à payer s'il veut
    voir le résultat (quitte à le teaser avec une ligne ou deux). »
- **Problème utilisateur éventuellement révélé** : dans le parcours vécu, le paiement est arrivé
  avant que la personne ait suffisamment investi son projet ou perçu une réponse personnalisée.
- **État réel constaté dans le dépôt** : il existe deux ordres différents.
  `src/components/wizard/ReportWizard.tsx` et `src/components/wizard/WizardTeaser.tsx` posent six
  questions, montrent un teaser de signaux puis proposent de débloquer le dossier Territoire à
  14 €. Ce parcours correspond déjà à la proposition. À l’inverse, la porte adresse
  `src/app/(public)/dossier/DossierQualificationClient.tsx` qualifie d’abord le bien et la matière
  disponible, affiche le prix puis conduit au checkout avant les questions de projet. La conception
  de ce second chemin est décrite dans
  `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md` : la qualification y
  sert à identifier le bien, avertir et éventuellement refuser la vente, pas à enrichir le projet.
  Les horodatages du dossier confirment le second chemin : paiement à 18 h 23 min 49 s, puis réponse
  de projet à 18 h 24 min 57 s ; le questionnaire principal en six questions n’a pas été utilisé.
- **Hypothèse d’explication** : le retour vise bien la porte adresse. Il peut toutefois exprimer un
  manque de valeur perçue avant paiement autant qu’un problème d’ordre pur : le contenu personnalisé
  n’a commencé qu’après la transaction.
- **Piste éventuelle, non décidée** : tester séparément trois hypothèses : davantage de projet avant
  paiement, teaser plus probant, ou meilleure explication de ce qui sera livré. Ne pas transposer
  automatiquement le funnel Territoire au dossier adresse.
- **Statut de traitement** : parcours exact de la session et ordre paiement → projet confirmés ;
  l’arbitrage de conception existant est documenté, pas invalidé par un signal unique ; aucun ordre
  modifié.

### JL-04 — Changement d’horizon perçu comme un possible bug

- **Typologie** : Bug / UX
- **Priorité provisoire** : P1
- **Retour brut** : « Ici il y avait une petite loading sur le curseur de la souris, j'ai cru que ça
  bugé mais ça devait juste générer le contenu des dates. »
- **Problème utilisateur éventuellement révélé** : le système ne rend pas suffisamment visible
  qu’un nouveau texte est en cours de génération ; l’attente ressemble à un blocage.
- **État réel constaté dans le dépôt** : comportement confirmé dans
  `src/components/report/QuartierSynthesis.tsx`. Chaque changement d’horizon déclenche une requête
  streamée vers `/api/synthesize-quartier`, remet le texte à vide et désactive les boutons avec un
  curseur d’attente. Un message discret « Lecture en cours... » s’affiche avant le premier fragment,
  puis le texte arrive progressivement. Aucun cache de synthèse n’est en place ;
  `docs/synthesis-cache-todo.md` documente une latence attendue d’environ 1,5 à 3 secondes avant le
  premier fragment et une nouvelle génération à chaque visite. Le code présent le jour du test est
  bien celui-ci. Les sorties 2030/2050 n’étant pas enregistrées, aucun incident propre à cette
  requête ne peut être prouvé après coup ; le comportement visible décrit par l’utilisateur, lui,
  correspond exactement à l’état de chargement prévu.
- **Hypothèse d’explication** : le curseur d’attente est plus saillant que le message de progression,
  placé dans le contenu. L’utilisateur voit l’indice d’indisponibilité avant de comprendre la tâche
  en cours.
- **Piste éventuelle, non décidée** : rendre l’état de génération plus explicite et local au sélecteur
  d’horizon, mesurer la latence réelle, puis décider séparément du cache et de la présentation.
- **Statut de traitement** : dette UX confirmée ; incident technique non démontré ; aucune correction
  dans cette passe.

### JL-05 — Situer le futur par rapport à « aujourd’hui »

- **Typologie** : Compréhension
- **Priorité provisoire** : P1
- **Retour brut** : « Remarque pertinente de Lisa sur ça : ça pourrait être intéressant de savoir
  aujourd'hui qu'est ce qu'il en est ? »
- **Problème utilisateur éventuellement révélé** : une projection seule est difficile à interpréter
  sans point de départ vécu ou récent.
- **État réel constaté dans le dépôt** : le besoin est **partiellement couvert**, mais pas par un
  horizon narratif équivalent à 2030/2050/2100. `src/lib/decision/climat-facts.ts` interdit de faire
  passer la référence DRIAS pour le présent : DRIAS n’expose pas de valeur actuelle et compare ses
  projections à 1976-2005. `src/components/report/QuartierClimatData.tsx` affiche cette référence
  reconstruite, libellée « Fin du XXe siècle » ou « période de référence 1976-2005 », et peut ajouter
  une tendance réellement observée ERA5-Land sous « Déjà observé ». Le composant
  `src/components/HorizonSwitch.tsx` possède une option « Aujourd’hui », mais il est utilisé dans une
  prévisualisation de landing, pas comme horizon de la synthèse Territoire payante. La doctrine
  `docs/vault/doctrine/data.md` exige déjà qu’une projection ait un point de départ explicite. Pour
  Ciré-d’Aunis, la preuve disponible au moment du test portait une température annuelle récente de
  14,14 °C contre 12,45 °C sur 1961-1990, soit **+1,69 °C déjà observé**, avec des données allant
  jusqu’en 2025. Elle vivait dans le détail « Déjà observé », pas dans un récit « Aujourd’hui » au
  même niveau que 2030 et 2050.
- **Hypothèse d’explication** : le point de départ existe dans les preuves détaillées mais pas au
  même niveau de saillance que la synthèse par horizon ; Lisa ne l’a donc pas vu ou ne l’a pas
  reconnu comme réponse à « aujourd’hui ».
- **Piste éventuelle, non décidée** : tester une comparaison plus visible entre observations récentes,
  référence 1976-2005 et projections, sans rebaptiser la référence DRIAS « aujourd’hui ». ERA5 ou
  une autre observation datée doit porter toute affirmation au présent.
- **Statut de traitement** : donnée actuelle réellement disponible et convention existante
  identifiées ; manque de saillance confirmé par le parcours, sans décision de nouvel horizon.

### JL-06 — Peu de matière pour une maison rurale appréciée

- **Typologie** : Valeur perçue · Fiabilité / données
- **Priorité provisoire** : P1
- **Retour brut** : « Malheureusement l'adresse qu'on a rentrée c'est celle d'une maison qu'on trouve
  pas mal un peu perdue dans la campagne, l'IA n'avait pas beaucoup de choses à dire (parce qu'il ne
  doit pas y avoir beaucoup de sources). »
- **Problème utilisateur éventuellement révélé** : une adresse calme ou rurale peut donner un dossier
  honnête mais perçu comme pauvre, alors que l’intérêt pour le bien est réel et que le produit est
  payé à l’adresse.
- **État réel constaté dans le dépôt** : la limite est connue. La conception de qualification
  `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md` dit explicitement
  qu’une adresse analysable peut néanmoins produire un résultat honnête et décevant et mesure
  l’absence de DPE exact à 86 % dans l’échantillon rural. `src/app/api/synthesize-logement/route.ts`
  demande au moteur de laisser une adresse calme rester calme et de ne pas inventer d’enjeu.
  `docs/handoff/2026-08-01-parcours-achat-dossiers.md` relève déjà que la valeur du dossier varie avec
  la matière disponible. Dans le cas réel, les sources « Autour » ont répondu ; la restriction vient
  surtout de la matière décisionnelle : seul le calme était mesurable et il n’a produit aucun écart
  net, le jardin était hors mesure, aucun DPE n’était attribuable, et la conclusion Adresse ne
  contenait que deux contrôles. La synthèse disait explicitement qu’aucun enjeu aigu ne ressortait.
- **Hypothèse d’explication** : la personne attribue naturellement la brièveté à un manque de sources,
  alors que le moteur disposait de sources mais de peu de faits différenciants reliés à son projet.
  Le problème paraît donc être la composition et la promesse de valeur pour une adresse « calme »,
  plus qu’une panne de collecte.
- **Piste éventuelle, non décidée** : identifier les blocs jugés pauvres et vérifier si la
  qualification avant paiement a correctement annoncé la couverture. Explorer ensuite ce qui aide
  à décider pour un bien « sans alerte » — y compris les limites et points de visite — sans fabriquer
  de contenu.
- **Statut de traitement** : faible densité du dossier et ses causes immédiates confirmées ; aucune
  donnée ni narration ajoutée artificiellement ; la valeur des dossiers sans signal aigu reste à
  investiguer.

### JL-07 — Frise des sinistres appréciée

- **Typologie** : Positif
- **Priorité provisoire** : Exploration
- **Retour brut** : « Très top le graphique des sinistres par années. »
- **Problème utilisateur éventuellement révélé** : aucun ; signal de valeur sur une preuve historique
  et temporelle.
- **État réel constaté dans le dépôt** : le composant probablement visé est
  `src/components/report/TerritoryYearsBand.tsx`, « La mémoire du lieu », qui affiche les années de
  reconnaissance CatNat issues de GASPAR/Géorisques depuis 1982. Il montre des années de
  reconnaissances, pas un décompte exhaustif de sinistres assurantiels individuels. Le dossier figé
  comporte par ailleurs cinq reconnaissances pour le seul périmètre inondation de l’artefact de
  décision ; ce nombre n’est pas le total tous risques de la frise. Une confirmation reste
  nécessaire si le retour visait plutôt le bloc ONRN de sinistres indemnisés.
- **Hypothèse d’explication** : la forme temporelle rend l’historique local immédiatement lisible et
  concret.
- **Piste éventuelle, non décidée** : conserver cette force et vérifier que le libellé empêche de
  confondre reconnaissance CatNat et nombre de sinistres.
- **Statut de traitement** : signal positif consigné ; composant probable relié, à confirmer.

### JL-08 — Paragraphes 2030 et 2050 presque identiques

- **Typologie** : Compréhension · Valeur perçue
- **Priorité provisoire** : P1
- **Retour brut** : « Les paragraphes qu'on a eu en 2030 et 2050 étaient quasi les mêmes. »
- **Problème utilisateur éventuellement révélé** : le changement d’horizon ne fait pas percevoir une
  progression suffisante, ce qui réduit la valeur de l’interaction et peut faire douter de la prise
  en compte du sélecteur.
- **État réel constaté dans le dépôt** : aucun même texte codé en dur ni réemploi en cache n’a été
  trouvé. `src/components/report/QuartierSynthesis.tsx` envoie bien l’horizon sélectionné à chaque
  nouvelle génération. En revanche, `src/app/api/synthesize-quartier/route.ts` impose à tous les
  horizons le même plan en trois blocs — « Ce qui domine », « Ce qui tient, ce qui se tend », « Ce
  qu’on sous-estime ici » — et limite la synthèse à trois phénomènes. Les données locales de
  `public/data_climat.json` pour Ciré-d’Aunis ne sont pas identiques : entre `gwl15` (2030) et
  `gwl20` (2050), les jours à plus de 30 °C passent par exemple de 21 à 27,4 par an et les nuits
  tropicales de 9,2 à 15,8, tandis que les jours de sécheresse des sols restent à 151. Les cumuls de
  pluie restent eux aussi proches (793,89 contre 822,03 mm/an). Les textes réellement produits
  pendant la session ne sont persistés ni dans le dossier ni dans `decision_narrative` ; leur
  proximité exacte n’est donc pas reproductible ici.
- **Hypothèse d’explication** : la hiérarchie des phénomènes peut rester la même aux deux horizons,
  et le plan fixe ainsi que la compression narrative accentuent la répétition malgré des valeurs
  différentes. Une variabilité du moteur narratif reste possible ; les textes manquent pour séparer
  données, prompt et génération.
- **Piste éventuelle, non décidée** : récupérer les deux sorties, puis tester une narration de
  trajectoire qui explicite d’abord **ce qui change depuis l’horizon précédent** au lieu de demander
  deux portraits autonomes de même structure. Ajouter un contrôle de vérité sur les différences
  racontées, distinct du simple contrôle que le texte s’affiche. Séparément, décider si ces sorties
  doivent devenir auditables après génération ; ce besoin d’observabilité n’implique pas de changer
  leur narration.
- **Statut de traitement** : passage correct des horizons et données distinctes confirmés ; cause
  narrative probable mais non prouvée sans les sorties ; dette d’observabilité identifiée ; aucun
  changement de prompt.

### JL-09 — Paiement limité à une seule adresse

- **Typologie** : Pricing / offre · Valeur perçue
- **Priorité provisoire** : Exploration
- **Retour brut** :
  - « On a été un peu frustré d'avoir un paiement pour une adresse uniquement. »
  - « Peut-être un paiement = 2 adresses promptées. »
- **Problème utilisateur éventuellement révélé** : l’unité de valeur facturée ne correspond peut-être
  pas au travail réel de présélection, qui comporte plusieurs biens.
- **État réel constaté dans le dépôt** : le comportement est explicite :
  `src/app/(public)/dossier/DossierQualificationClient.tsx` indique « Une fois, pour ce bien ».
  `src/lib/dossier-pricing.ts` porte un tarif plein de 39 € par dossier adresse, ou 25 € lorsque les
  14 € du territoire ont déjà été payés ; aucun crédit de deux adresses n’existe. Le Pack à 39 €
  décrit dans `docs/vault/adr/ADR-0007-pack-decision-bundle.md` et
  `docs/vault/modules/comparateur.md` concerne deux ou trois **communes**, pas deux logements. Cette
  session a payé **19 € au tarif de lancement**, toujours pour une seule adresse : le signal existe
  donc même à un prix inférieur aux tarifs nominaux documentés.
- **Hypothèse d’explication** : la frustration semble moins réductible au montant absolu qu’à l’unité
  « une adresse », à l’absence de comparaison et à la faible matière du premier bien. Ces causes
  n’appellent pas la même réponse et le verbatim ne permet pas de les pondérer.
- **Piste éventuelle, non décidée** : traiter « un paiement = 2 adresses » comme une hypothèse
  d’offre à tester avec d’autres recherches réelles, en mesurant le nombre de biens considérés, la
  disposition à payer et l’effet d’un premier dossier pauvre. Ne pas modifier le pricing à partir de
  cette session seule.
- **Statut de traitement** : offre actuelle confirmée ; suggestion enregistrée comme hypothèse, pas
  comme décision.

### JL-10 — Comparer deux biens

- **Typologie** : Comparaison / décision
- **Priorité provisoire** : Exploration
- **Retour brut** : « Pour revenir au forfait "2 adresses" ça permettrait aussi de faire comme tu
  avais dit, de comparer entre deux biens les caractéristiques. »
- **Problème utilisateur éventuellement révélé** : le produit analyse des biens séparément alors que
  la décision réelle consiste souvent à départager des candidats.
- **État réel constaté dans le dépôt** : plusieurs dossiers adresse peuvent déjà coexister pour un
  même compte, y compris à la même adresse, grâce aux UUID de `supabase/25_address_dossiers.sql`, et
  la liste de dossiers permet d’en rouvrir plusieurs. Il n’existe toutefois pas de vue de comparaison
  de deux logements. La vision cible
  `docs/vault/vision/objet-central-dossier-de-decision.md` formalise déjà
  `Profil → Projet → candidats territoire/logement → versions d’analyse`, avec plusieurs candidats
  par projet et plusieurs versions par candidat. Cette cible n’est que partiellement matérialisée :
  le projet courant reste un unique JSON `user_profiles.user_project`
  (`supabase/17_add_user_project.sql`, `src/lib/user-project.ts`) et les dossiers adresse ne portent
  pas de `project_id`. `supabase/28_decision_artifact.sql` sait en revanche conserver plusieurs
  versions immuables d’une analyse. Les paris de `docs/vault/paris.md` sur la valeur du comparateur et
  la réouverture d’un dossier sont des hypothèses suivies, pas une décision de comparateur logement.
- **Hypothèse d’explication** : la demande de « deux adresses » est peut-être le véhicule commercial
  d’un besoin plus profond : voir les différences décisionnelles entre deux finalistes sans relire
  deux rapports complets.
- **Piste éventuelle, non décidée** : observer le protocole de comparaison réel — mêmes communes ou
  non, critères communs, moment avant visite — avant de choisir entre bundle, tableau comparatif,
  synthèse d’arbitrage ou simple navigation entre dossiers.
- **Statut de traitement** : besoin cohérent avec l’architecture cible, non couvert par l’interface
  actuelle ; exploration requise avant offre ou conception.

### JL-11 — Informations anciennes ou inexactes dans « Autour de l’adresse »

- **Typologie** : Fiabilité / données
- **Priorité provisoire** : **P1** ; à escalader en **P0** si une valeur fausse est identifiée
- **Retour brut** : « Les infos du module "autour de l'adresse" étaient soit trop anciennes soit
  inexacte. »
- **Relance brute transmise** : « c'était sur la partie des commerces à proximité, notamment pas de
  boulangeries ni école alors qu'il affichait une à 900 metres »
- **Problème utilisateur éventuellement révélé** : le module qui décrit le voisinage immédiat peut
  présenter une information obsolète ou fausse. La précision montre aussi qu’un point BPE à environ
  900 m peut ne pas être reconnu par une personne qui connaît le lieu comme un commerce ou une école
  réellement « à proximité ».
- **État réel constaté dans le dépôt** : l’adresse et son snapshot sont maintenant retrouvés. Le
  snapshot a été calculé à 18 h 33 le soir du test, à partir du bon point BAN, et toutes les lectures
  BPE/OSM ont répondu ; l’hypothèse d’un vieux cache servi par erreur n’est pas soutenue. Les chemins
  et résultats contrôlés sont :
  - `src/app/api/logement-autour/route.ts` assemble la réponse du module ;
  - `src/lib/logement-bpe.ts` lit la BPE INSEE 2024 pour les équipements, dans un rayon maximal de
    3 km ; `src/components/report/logement/AutourSection.tsx` affiche ce millésime et précise que les
    distances sont approximatives à vol d’oiseau. La BPE 2025 était officiellement disponible
    depuis le 4 août : l’ancienneté du millésime affiché est confirmée. Mais la comparaison avec le
    fichier officiel 2025 redonne la boulangerie à 903 m, l’école à 729 m, la pharmacie à 940 m, le
    bureau de poste à 952 m au lieu de 951 m par arrondi, et aucun transport dans les 3 km. Le service
    local documente toujours l’École du Marais et une boulangerie se présente toujours au 6 Grande
    Rue sous un autre nom commercial. Ces contrôles corroborent les deux points, sans prouver leur
    ouverture effective le jour du test ;
  - le snapshot BPE ne conserve que la catégorie, le type et les coordonnées. Il perd le nom,
    l’adresse et l’identifiant de l’établissement source. L’écran peut donc écrire seulement
    « Boulangerie · env. 903 m » ou « École primaire · env. 729 m » : impossible pour le lecteur de
    reconnaître le lieu compté, de distinguer un ancien nom d’un établissement actuel ou de vérifier
    son activité ;
  - `src/lib/logement-osm.ts` interroge OpenStreetMap/Overpass pour certaines infrastructures et
    catégories d’espaces verts dans une emprise de 1,5 km. La version de requête
    `osm-v3-2026-08-03` corrige une ancienne emprise longitude tronquée, documentée dans
    `docs/audits/2026-08-03-osm-semantique-distance.md`. Le snapshot a bien cette version et une
    interrogation actuelle retrouve le même bois à 253 m. Ce bois n’a cependant ni nom ni tag
    d’accès public : le fait cartographique est exact, l’utilité ou l’accessibilité ne sont pas
    établies ;
  - `src/lib/icu.ts` utilise le jeu CSTB de décembre 2024 au grain grand-IRIS, seulement dans sa zone
    de couverture ; aucune valeur ICU n’a été rendue pour cette adresse ;
  - `src/lib/server/autour-response.ts` fournit l’équipement automobile du secteur à partir du
    recensement INSEE 2022. Ici, le chiffre de 95,7 % porte sur la commune entière, pas sur le proche
    voisinage ; cette limite était affichée explicitement ;
  - `src/lib/server/sitadel-permis.ts` et `src/lib/decision/autour-permis.ts` utilisent le registre
    Sitadel des autorisations d’urbanisme, recherché autour de la parcelle, et affichent la date de
    consultation. Le résultat figé était « aucune autorisation créant des logements » à moins de
    50 m, sur les dossiers depuis 2023, registre consulté le 16 août 2026 ;
  - `src/lib/logement-autour.ts` persiste `computedAt`, la date de récupération OSM et les versions
    de sources dans le snapshot du dossier. La carte BPE/OSM affiche ses millésimes et limites, mais
    pas la date de calcul ni la date de récupération OSM.
- **Hypothèse d’explication** : la BPE compte des équipements administrativement recensés, là où
  Julien raisonne à partir de sa connaissance actuelle et praticable du lieu. Le millésime ancien,
  la perte du nom de l’établissement et la distance à vol d’oiseau empêchent de comprendre la
  divergence. Il peut s’agir d’un changement d’exploitant, d’une fermeture temporaire ou réelle, ou
  simplement d’un modèle mental différent de « proximité » ; aucune de ces causes n’est établie.
- **Piste éventuelle, non décidée** : conserver dans les futurs snapshots BPE le nom, l’adresse et
  l’identifiant de l’équipement, avec le millésime, afin que le fait soit vérifiable. Distinguer
  explicitement « recensé à vol d’oiseau » de l’accès réel à pied ou en voiture. Une éventuelle
  vérification d’ouverture doit être conçue comme une source distincte, datée, et non déduite de la
  seule présence BPE.
- **Statut de traitement** : **fraîcheur BPE insuffisante confirmée** ; aucune inexactitude numérique
  reproduite et existence des deux catégories corroborée par plusieurs sources ; **imprécision de
  preuve confirmée**, car le produit ne permet pas d’identifier les établissements qu’il compte ni
  leur ouverture. Aucune valeur n’a été corrigée sans vérification physique.

### JL-12 — Reconnaissance du travail et impression finale

- **Typologie** : Positif
- **Priorité provisoire** : Exploration
- **Retour brut** :
  - « Tu as dû passer du temps en tout cas. »
  - « Bon boulot 🙂 »
- **Problème utilisateur éventuellement révélé** : aucun explicite. La première phrase peut signaler
  une perception de richesse ou d’effort, sans permettre à elle seule de conclure à la valeur
  d’usage ou à la disposition à payer.
- **État réel constaté dans le dépôt** : non vérifiable comme comportement ; signal d’impression
  générale.
- **Hypothèse d’explication** : l’étendue du produit et le niveau de finition sont perceptibles lors
  d’un premier essai.
- **Piste éventuelle, non décidée** : distinguer dans les prochains entretiens admiration du travail,
  utilité décisionnelle et volonté de payer ; ces trois signaux ne sont pas interchangeables.
- **Statut de traitement** : signal positif consigné ; aucune action décidée.

### JL-13 — Lecture contradictoire du risque d’inondation

- **Typologie** : Fiabilité / données · Compréhension
- **Priorité provisoire** : **P0**
- **Relance brute transmise** : « ensuite par rapport aux risques à un moment elle disait pas de
  risque d'inondation puis sur une autre partie risque d'inondation, enfin c'était contradictoire
  sur cette partie. »
- **Problème utilisateur éventuellement révélé** : le dossier ne donne pas une lecture cohérente de
  l’inondation. Même si deux sources mesurent des objets différents, lire successivement une absence
  puis des antécédents d’inondation empêche de savoir ce qui est vrai pour le bien et détériore la
  confiance dans l’ensemble du dossier.
- **État réel constaté dans le dépôt et les données du cas** : la contradiction de lecture est
  reproductible, mais aucune phrase générée conservée n’affirme littéralement « aucun risque
  d’inondation ». Elle naît de trois faits déterministes non réconciliés :
  - au point de l’adresse, Géorisques ne renvoie ni PPRN applicable ni libellé d’inondation. Le bloc
    `src/components/report/logement/RegulatorySection.tsx` affiche alors « Aucune règle de
    construction particulière à cette adresse », puis précise que cela ne signifie pas l’absence de
    risque ;
  - le jeu ONRN/CCR de `data/onrn-inondation.json`, période 1995-2021, classe Ciré-d’Aunis en « Pas de
    sinistre répertorié à CCR ». `src/components/report/logement/SinistraliteSection.tsx` le rend par
    « Aucun sinistre d’inondation n’a été remboursé dans cette commune sur la période connue. Un
    passé sans dégât ne garantit pas l’avenir. » ;
  - l’artefact Territoire figé et l’API GASPAR comptent **cinq reconnaissances CatNat inondation**
    depuis 1982 : 1982, 1993-1994, 1999, 2007 et 2010. Trois événements, en 1999, 2007 et 2010,
    appartiennent donc aussi à la fenêtre 1995-2021 du jeu ONRN.
- **Hypothèse d’explication** : les sources peuvent techniquement coexister — zonage réglementaire au
  point, reconnaissances administratives à l’échelle communale et sinistres indemnisés dans un
  échantillon assurantiel ne répondent pas à la même question. Mais chaque module présente son fait
  isolément. Le mot absolu « Aucun » domine les réserves, et aucune phrase ne résout la tension avec
  les cinq reconnaissances CatNat. Le lecteur transforme légitimement cette juxtaposition en
  contradiction sur « le risque d’inondation ».
- **Piste éventuelle, non décidée** : construire une lecture déterministe commune aux trois sources,
  sans fabriquer de verdict global. Dans ce cas précis, elle devrait dire en substance : « Aucun
  zonage PPRN inondation n’est identifié au point de l’adresse. La commune a néanmoins connu cinq
  reconnaissances CatNat inondation depuis 1982. Le jeu ONRN/CCR 1995-2021 ne recense pas de sinistre
  indemnisé dans son périmètre ; cette absence ne contredit ni n’annule l’historique GASPAR. » Les
  libellés doivent rendre visibles avant le résultat le grain, la période et l’objet mesuré. Ajouter
  un test sur ce cas réel qui vérifie ce que l’écran raconte, pas seulement la présence des cartes.
- **Statut de traitement** : **défaut de réconciliation et risque de confiance confirmés** ; les
  sources exactes et les chemins de rendu sont identifiés ; aucune donnée source n’a été modifiée et
  aucune correction de narration n’a été effectuée dans cette passe documentaire.

## Questions de relance restantes

1. Dans l’ordre paiement → projet que vous avez vécu, qu’est-ce qui vous manquait concrètement avant
   de payer : exprimer vos critères, voir un premier résultat personnalisé, connaître la densité de
   données disponible, ou autre ?
2. Pouvez-vous partager les deux paragraphes 2030 et 2050, ou des captures ? Avez-vous attendu la fin
   de chaque génération avant de changer d’horizon ?
3. Dans le dossier de la maison rurale, quels blocs vous ont semblé manquer de matière : services,
   risques, climat, DPE, synthèse, permis, autre ? L’avertissement avant paiement sur les données
   disponibles était-il visible et compréhensible ?
4. Pour les deux adresses, s’agissait-il de deux biens réellement finalistes à comparer ? Dans la
   même commune ou dans deux communes ? La frustration venait-elle surtout du montant, de devoir
   repayer, ou de l’absence d’une comparaison côte à côte ?
5. Le champ « Nom et prénom » a-t-il réellement gêné la saisie, ou était-ce uniquement une
   suggestion pour la base de données ?
6. Le « graphique des sinistres par années » était-il bien la frise « La mémoire du lieu » sur les
   reconnaissances CatNat ? Qu’est-ce qui l’a rendu particulièrement utile ?

## Lecture de synthèse, sans décision

- **Risque de confiance le plus immédiat — P0** : le dossier juxtapose une absence de sinistre
  indemnisé ONRN/CCR et cinq reconnaissances CatNat inondation GASPAR sans les réconcilier (JL-13).
  Les sources ne mesurent pas la même chose, mais le lecteur ne peut pas le comprendre à partir des
  cartes isolées. Ce défaut n’a pas besoin d’autres retours pour être traité.
- **Fiabilité de proximité — P1** : la BPE 2024 était encore utilisée douze jours après la publication
  de la BPE 2025 (JL-11). L’école et la boulangerie contestées sont corroborées par la BPE 2025 et
  par des présences en ligne actuelles, mais le produit a perdu leur nom, leur adresse et leur
  identifiant : il affirme un type et une distance sans fournir une preuve reconnaissable. Le point
  à améliorer est déjà établi, même si une fermeture physique n’est pas démontrée.
- **Frottements confirmés dans le produit** : attente générative à chaque horizon avec signal de
  chargement discret (JL-04), point de départ actuel moins saillant que les projections (JL-05),
  dossier pauvre lorsque les préférences importantes sont hors mesure et le DPE non attribuable
  (JL-06), offre adresse unitaire sans comparaison de logements (JL-09/JL-10).
- **Cause plausible, encore non prouvée** : similarité 2030/2050 amplifiée par un plan narratif fixe
  malgré des données locales distinctes (JL-08). L’absence de conservation de ces deux sorties
  empêche d’auditer le cas réel.
- **À valider sur d’autres usages avant arbitrage** : deux adresses par paiement, comparaison de
  deux biens, changement global d’ordre du funnel et séparation prénom/nom. Le fait que la
  frustration existe après un paiement de lancement à 19 € renforce le signal d’unité de valeur,
  mais ne valide aucun forfait.
- **À protéger** : qualité visuelle perçue et lisibilité de l’historique CatNat.

---

## Implémentation et vérification après correction

> **Nature** : champ ajouté le 19/08/2026, après arbitrages du porteur du 17/08/2026. Il rend compte
> de ce qui a été CODÉ. Il ne modifie aucun verbatim, aucune hypothèse historique et aucune
> priorité provisoire ci-dessus : les constats du 16/08 restent tels qu'ils ont été consignés.
> Aucune donnée de production n'a été régénérée, aucun dossier vendu n'a été réécrit.

### P0 — JL-13 : les trois lectures de l'inondation sont ordonnées

**Ce qui a été construit.** Une lecture déterministe commune aux trois sources vit dans
`src/lib/decision/inondation-lecture.ts`, pure et testée. Elle produit un constat par source, chacun
portant son **en-tête (grain, période, objet mesuré) AVANT son énoncé**, puis une phrase de
réconciliation qui ordonne sans conclure. Le compte d'arrêtés n'y est jamais réécrit : il vient de
l'objet partagé `catnat-evidence.ts`, celui-là même que la pastille du dossier et la carte
« Mémoire des catastrophes » affichent, ce qui interdit à deux surfaces d'annoncer deux nombres.

**Ce que le lecteur voit maintenant, pour ce cas exact** (sortie réelle du moteur, 19/08/2026) :

| En-tête | Énoncé |
|---|---|
| Au point de l'adresse · zonage réglementaire | Aucun plan de prévention du risque inondation ne réglemente ce point. Un zonage encadre la construction, il ne mesure pas ce que le lieu peut connaître. |
| Dans la commune · reconnaissances de catastrophe naturelle · depuis 1982 | La commune compte 5 arrêtés de catastrophe naturelle inondation depuis 1982. Une reconnaissance est un acte administratif qui ouvre l'indemnisation après un épisode, pas une probabilité. |
| Dans la commune · sinistres indemnisés par les assurances · 1995-2021 | Sur 1995-2021, aucun sinistre d'inondation indemnisé n'est recensé dans l'échantillon de contrats de cette commune. |

Puis, sous un filet : « Ces trois lectures ne mesurent pas la même chose : une règle d'urbanisme au
point de l'adresse, des reconnaissances administratives à l'échelle communale et des indemnisations
observées dans un échantillon assurantiel. L'absence de sinistre recensé dans cet échantillon ne
permet pas de conclure à l'absence d'événement ou de risque à cette adresse. Le dossier compte par
ailleurs 5 arrêtés de catastrophe naturelle inondation depuis 1982 : cet écart tient aux périmètres,
à la période et au champ des contrats couverts, et il ne se tranche pas depuis ces données. »

L'écart est donc **nommé et rendu explicable, jamais neutralisé** : la formulation ne dit pas que
les sources « ne se contredisent pas ».

**Où la carte apparaît.** Entre « Statut réglementaire à cette adresse » et « Sinistres indemnisés »,
c'est-à-dire à l'endroit précis où la contradiction se fabriquait. Condition d'affichage :
au moins deux sources déterminées **et** au moins un signal (zonage inondation, arrêté, ou
indemnisations, y compris à faible représentativité). Trois absences bien lues ne produisent aucune
carte : la ligne bornée de la sinistralité suffit.

**Ce qui a disparu.** La phrase « Aucun sinistre {de sécheresse|d'inondation} n'a été remboursé dans
cette commune sur la période connue » n'existe plus, pour les **deux** périls. Elle ne nommait ni sa
période ni son échantillon, et son « Aucun » dominait la réserve qui suivait. À sa place, un fait
borné : « Aucun sinistre indemnisé recensé · échantillon de contrats assurés, 1995-2021 ». La
mention de la période et de l'échantillon, jusque-là conditionnée à l'existence d'une classe
lisible, s'affiche désormais toujours.

**Chemin de la donnée.** Le compte d'arrêtés est résolu par la page `/rapport/logement` :
l'artefact de décision figé du dossier d'abord (donc le nombre **tel qu'il a été vendu**), l'index
courant en repli. Il ne transite pas par `/api/georisques-logement`, route au fan-out d'une dizaine
d'API externes.

**Prose générée.** Deux verrous, dans cet ordre. En amont, un état ONRN « aucun sinistre » ne
franchit plus la frontière du modèle sans le compte d'arrêtés qui permet de le situer
(`sinistralitePourRecit`) : sans ce contexte, l'absence est retirée du payload, la carte
déterministe la portant déjà. En filet, le garde-fou `synthesis-guardrails.ts` refuse une famille
d'assertions nouvelle, `absence_sinistre_conclue` (« aucun sinistre », « jamais été inondée »,
« épargnée »…), et la relance envoyée au modèle nomme la période, l'échantillon et l'existence
possible d'arrêtés. Aucun bump de `SYNTHESIS_PROMPT_VERSION` : l'enquête n'a trouvé aucune synthèse
conservée portant la phrase fautive, et un bump aurait régénéré toutes les synthèses vendues.
L'invariant est testé : sans péril en « aucun », le payload et son hash sont inchangés.

### P1 — JL-11 : les équipements deviennent identifiables, et les doublons cessent de mentir

**Ce que la BPE 2025 a révélé, et qui n'était pas dans le plan.** Au 6 Grande Rue à Ciré-d'Aunis, la
BPE recense **deux boulangeries au même point** : « BOULANGERIE DE CIRE D'AUNIS » (SIRET
509 898 623) et « LE LION GOURMAND » (SIRET 978 491 454). **Le millésime 2025 ne tranche pas** : les
deux y figurent encore, aux mêmes coordonnées et à la même adresse. Même motif au 4 rue du Four, où
quatre médecins partagent un cabinet. L'ordre des lignes du parquet décidait donc quelle enseigne
serait nommée, et le comptage « à portée de pas » voyait deux boulangeries là où il n'y a qu'un
commerce. Le retour de Julien (« pas de boulangerie ni d'école alors qu'il affichait une à
900 mètres ») trouve ici une cause matérielle qui n'avait pas été identifiée le 16/08.

**Politique de doublons physiques**, appliquée à la génération des shards
(`scripts/populate-bpe.py`, `grouper_lieux`, selftest inclus) : deux enregistrements de même type
sont le même **lieu** s'ils partagent le même point (5 décimales, ~1 m) ou la même adresse à moins
de 100 m. Conséquences :

- un lieu n'est **nommé que si un seul établissement y est recensé** ; sinon l'écran affiche
  l'adresse et une réserve courte : « 2 établissements recensés ici : la BPE ne dit pas lesquels
  sont ouverts. » (le millésime n'y est pas répété, il vit sur la ligne de source du bloc) ;
- le comptage « à moins de 500 m » compte des **lieux**, plus des enregistrements administratifs ;
- les enregistrements sources (nom, SIRET) sont **conservés dans `data/bpe-points` pour l'audit**,
  mais ne descendent pas dans le dossier : ils n'y seraient jamais affichés.

**Millésime.** Les shards sont régénérés depuis la BPE 2025 (2 217 cellules, 281 925 enregistrements
géolocalisés → 241 820 lieux, dont 20 464 à plusieurs exploitants). Le millésime est **écrit dans la
donnée** et remonte jusqu'à l'écran ; la ligne « Sources : INSEE, BPE 2024 » codée en dur dans le
composant a disparu, et c'est elle qui était la dette de fraîcheur. Six cellules présentes en 2024 et
absentes en 2025 ont été supprimées, pour qu'aucun équipement d'un millésime antérieur ne survive
sans le dire.

**Le comparateur passe au même millésime** (arbitrage porteur, 19/08/2026 : une seule source pour
tout le produit). Les scores `ecoles`, `culture`, `etudes_acces` et l'attestation `etudesSup` sont
recalculés sur la BPE 2025, et `index.meta` porte désormais `bpeMillesime`, que l'index ne disait
pas. Effet mesuré sur 34 788 communes :

| Score | Communes dont le percentile bouge | Écart maximal |
|---|---|---|
| Écoles (collèges, lycées) | 11 676 (33,6 %) | 13 points |
| Culture | 25 792 (74,1 %) | 70 points |
| Accès aux études supérieures | 5 804 (16,7 %) | 41 points |

Les écarts sont **très concentrés** : 88 % des communes ne bougent pas d'un point sur la culture,
10 % bougent de 5 points ou moins, et la queue tient en une quinzaine de cas. Les plus gros
mouvements sont les **arrondissements de Marseille**, et ils corrigent un trou de la BPE 2024 :
28 équipements culturels y étaient recensés contre 67 en 2025, pour 870 000 habitants. Le
recalcul rapproche donc le comparateur du réel, il ne le déplace pas au hasard.

Le nombre de communes sans établissement du supérieur dans leur rayon passe de 14 069 à 14 123
(40,4 % → 40,6 %). L'écart reste sous le seuil de refus du script d'attestations, mais la constante
`ABSENCE_NATIONAL_CONTEXT` et sa version `absence-dist-…` ont été mises à jour quand même : le
chiffre porté par un dossier doit être celui de l'index qui le sert.

**Ce qui n'est toujours pas promis** : ni l'ouverture aujourd'hui, ni les horaires, ni la qualité,
ni l'accès à pied ou en voiture. La ligne de limite le dit sous le bloc, et les distances sont
toujours annoncées à vol d'oiseau.

**Compatibilité.** `SOURCES_VERSION` n'a pas été bumpée : aucun snapshot figé n'est invalidé. Les
dossiers antérieurs continuent d'afficher type et distance, sans nom ; leur ligne de source dit
« millésime non enregistré dans ce dossier » plutôt que d'en supposer un.

### Vérifications

| Vérification | Résultat |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `node --test` sur toute la suite `src/**/*.test.ts` | **1468 tests, 0 échec** (35 tests ajoutés par cette passe) |
| `npx eslint` sur les fichiers touchés | 0 problème |
| `npx eslint src scripts` (dépôt entier) | 45 problèmes, **tous préexistants** et dans des fichiers non touchés par cette passe |
| `populate-bpe.py --selftest` | OK (rayons, adresses lisibles, doublons) |
| `npm run index:verify` après recalcul et repack | OK |
| `populate-absence-attestations.mts` (garde de prévalence) | accepté, prévalence remesurée 40,6 % |
| Régénération des shards, deux fois de suite | même sortie (déterministe) |

Tests ajoutés : 19 sur la lecture de l'inondation (dont le cas Ciré-d'Aunis exact, les variantes
indisponible / 0 arrêté / sinistralité mesurable / faible représentativité / zonage présent, et une
garantie transverse sur 64 combinaisons d'entrées), 9 sur la preuve BPE (dont les deux boulangeries
du 6 Grande Rue, l'ancien snapshot, le changement d'enseigne, l'absence de promesse d'ouverture),
4 sur le payload narratif et 3 sur le garde-fou. Aucune donnée personnelle : les fixtures sont le
code INSEE, les codes SIRET publics et les valeurs publiques de la commune.

### Ce qui reste ouvert

- **Les dossiers antérieurs au 19/08/2026 ne rattrapent pas l'identité des équipements.** Un
  rattrapage était possible (le motif existe pour les permis), il a été écarté : il réécrirait des
  distances dans un dossier vendu, et le snapshot est historique par doctrine.
- **La réserve de doublon ne distingue pas** un cabinet partagé d'une succession d'enseignes : la
  donnée ne le permet pas. Trancher demanderait une source d'activité datée, distincte et à décider.
- **Aucun élément de JL-01 à JL-12 hors JL-11 n'a été traité** : ordre du funnel, champ d'identité,
  attente générative, horizon « aujourd'hui », densité des dossiers ruraux, offre à deux adresses et
  comparaison de deux biens restent à l'état où ce journal les a consignés.

---

## Implémentation — passe du 19-20/08/2026 (consolidation du moteur de décision)

> **Nature** : second champ « Implémentation », distinct du précédent et distinct des verbatims. Il
> rend compte de ce qui a été CODÉ dans une passe dont l'origine n'est que partiellement ce journal
> (elle vient aussi d'une analyse comparative externe). Aucun verbatim, aucune hypothèse et aucune
> priorité provisoire ci-dessus n'est modifié. Aucune donnée de production n'a été touchée, aucun
> dossier vendu n'a été régénéré, rien n'a été committé.

### JL-10 — comparer deux biens : le moteur existe, la surface est arrêtée

- **Décision** : la comparaison se fait entre deux **analyses figées** déjà vendues, sur l'axe des
  **critères déclarés** et de leur issue, jamais sur des valeurs mesurées (grains, millésimes et
  périmètres ne sont pas garantis compatibles).
- **Implémentation** : `src/lib/decision/comparaison-candidats.ts`, pur, 13 tests. Sortie sans note,
  sans gagnant, sans moyenne : ce qui correspond, ce qui contredit, les compromis, les inconnues, les
  contrôles prioritaires (repris mot pour mot), la couverture, la version et la date de chaque
  analyse. Un écart d'issue produit par deux moteurs, deux conventions, deux projets ou deux échelles
  différents est marqué `difference_non_attribuable` et porte sa réserve rédigée : l'écart n'est
  jamais masqué, il n'est simplement pas imputé au lieu.
- **Statut** : moteur livré ; **page utilisateur non construite**. Deux décisions produit manquent
  (la comparaison est-elle incluse dans la possession de deux dossiers ou vendue ? est-elle ouverte à
  deux dossiers quelconques ou réservée à des finalistes d'un même projet ?). Conception, blocage et
  tranche suivante : `docs/superpowers/specs/2026-08-19-comparaison-deux-candidats-design.md`.
  Aucune migration n'est nécessaire pour la suite.

### JL-03 / JL-06 — la promesse ne s'arrêtait plus à l'écran précédent

- **Constat vérifié** : l'écran de qualification `/dossier` dit tout (les trois échelles, la matière
  trouvée, ce qui manquera). L'écran où l'on **paie** (`/checkout/dossier`) ne portait que l'adresse
  et un montant. Or on y arrive aussi par un lien partagé, et le parcours de création de compte y
  ramène après un détour par `/connexion` : quelqu'un pouvait payer devant un prix nu.
- **Implémentation** : les trois échelles deviennent une source unique
  (`src/lib/dossier-echelles.ts`), lue par les deux écrans, et la page de paiement les affiche avec
  la phrase de structure (« chaque constat porte sa source et sa limite, et nomme, quand il en
  appelle un, le contrôle à mener avant de vous engager »). La **couverture propre à l'adresse n'est
  pas répétée** : cette page ne l'a pas mesurée, elle ne peut pas la promettre.
- **Ce qui n'a pas changé** : l'ordre du parcours (paiement puis projet) reste celui qu'a arbitré
  `docs/superpowers/specs/2026-07-30-qualification-checkout-dossier-design.md`. Un signal unique ne
  renverse pas un arbitrage.

### Le contrôle prioritaire est désormais observable

- **Vérifié dans le code** : le contrôle prioritaire reprend l'action **mot pour mot** de la carte,
  ne renvoie qu'aux cartes réellement rendues, et une **égalité n'invente aucun gagnant** (tous les
  candidats de tête sont parcourus dans l'ordre éditorial, dédoublonnés, plafonnés à deux). La
  posture gouverne bien l'action, par la table partagée des gestes.
- **Implémentation** : deux événements, `priority_control_shown` et `priority_control_activated`,
  réduits par une lib pure et testée (`priority-control-telemetry.ts`) : ni adresse, ni libellé
  rédigé, ni code INSEE. Le protocole qualitatif qu'ils cadrent, et qu'ils ne remplacent pas, est
  écrit dans `docs/protocoles/2026-08-19-premier-controle-entretien.md`. Aucune réponse libre n'est
  stockée : le dépôt n'a pas de convention pour cela.

### Correction hors journal : les gestes `location` supposaient un bail en cours

Non issue de ce test, consignée ici parce qu'elle touche le même moteur. Trois variantes s'adressaient
à un locataire **déjà en place** (« Signalez les fissures apparentes au bailleur », « Signalez tout
affaissement au bailleur », un détail mêlant « remis à la signature » et « sinistre survenu pendant le
bail »), alors que la posture `location` est celle de quelqu'un qui **envisage** de louer — l'occupant
relève de `reside`. Elles étaient donc muettes pour la seule personne qui pouvait encore renoncer.
Réécrites en gestes faisables avant l'engagement (regarder pendant la visite, demander à qui détient
l'information), sans attribuer de cause aux fissures, sans promettre qu'un document lève le doute et
sans énoncer de droit ou de délai. Invariant tenu par `src/lib/decision/logement-gestes.test.ts`,
famille par famille.

### Statut

Livré dans le worktree, **non committé**. Reste ouvert : la page de comparaison (deux décisions
produit), et tout ce que le champ « Implémentation » précédent listait déjà comme non traité.
