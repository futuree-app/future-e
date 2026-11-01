# FUT-163 · Cadrage : quatre tickets, dont une restitution « santé environnementale »

30/10/2026 · lecture de `origin/main` 82cbc171 · suite de `docs/audits/2026-10-30-fut163-pollutions-gratuit-payant.md`. Aucun commit, aucune PR, aucune modification Linear ni Supabase, aucun déploiement. FUT-157 et FUT-149 non touchés.

Les statistiques de distribution citées viennent de l'index local `data/comparateur-index.json` (34 788 communes, fichier du 24/09). Ce sont des ordres de grandeur, à recompter sur l'index de production au moment du développement.

## 0. Décision du porteur du 30/10, après ce cadrage

**Elle remplace les §5.6, 7 et 8 ci-dessous, et corrige la ligne 2 du §5.3.** La décision complète est dans la description Linear de FUT-163.

- **Version ambitieuse directement.** Il n'y a plus de version minimale avant lancement suivie d'une version ambitieuse. D se livre en deux faces, toutes deux dans l'objectif produit :
  - **D1 · Territoire** : une carte « Santé environnementale » dans le groupe « Les risques », quatre lignes (air de fond, industrie, bruit, radon), les quatre preuves ouvrent leur ligne, la règle industrie ne conclut plus « favorable » à l'adresse.
  - **D2 · Logement** : les installations industrielles pertinentes autour du logement (nom officiel, catégorie et statut, distance à vol d'oiseau depuis le point géocodé avec la précision de la localisation), les plans de prévention des risques technologiques (PPRT), une réponse explicite à « le logement est-il dans un périmètre PPRT, et que peut-on établir pour ce bien ? », les vérifications avant achat ou location. Placée à côté de « Sols pollués sur ce terrain » (FUT-157, PR #118 en contre-revue, non modifiée).
- **A, B et C** restent validés sans changement.
- **Air et bruit à l'adresse** : aucune estimation ; données communales avec leurs limites ; le bruit aérien de Logement (FUT-146) reste distinct.
- **Percentiles d'air écartés** en V1 : valeurs et seuils explicités seulement (point d'arbitrage n° 4 tranché).
- **Anciens dossiers** : complément daté, sans réécrire les faits historiques (point n° 7 tranché, option 1).
- **Année de l'air** : retrouver la vraie période de mesure ; si elle n'est pas démontrable, ne pas inventer de date ni rassurer.
- **Organisation** : tickets A, B, C, D ; D en deux PR (Territoire, Logement). Contre-revues indépendantes. Aucune fusion, aucun déploiement, aucune modification Supabase ou Vercel, aucune clôture Linear sans GO explicite.
- **Blocage de donnée** : s'il manque une donnée officielle indispensable (géométries PPRT notamment), le champ concerné dit « non déterminable », le blocage est documenté avec les solutions possibles, et le reste du chantier se livre.

### Erreur de ce cadrage, corrigée

La ligne 2 (§5.3) proposait d'écrire « aucun site Seveso dans un rayon de 8 km » quand le site retenu par le calcul n'est pas Seveso. C'est faux. Le site retenu est celui qui pèse le plus dans le calcul (gravité × proximité), pas le plus proche ni le plus grave : un site soumis à la directive IED à 1 km pèse 2,6, un Seveso seuil bas à 7 km pèse 0,6 (`scripts/populate-exposition-industrielle.py`, `exposure`). Un Seveso peut donc exister dans le rayon sans être retenu. La ligne industrie de D1 s'appuie sur une donnée à ajouter à l'index : pour chaque catégorie Seveso, la distance du site le plus proche, mesurée depuis le point de référence, avec sa provenance. Sans cette donnée, aucune absence n'est affirmée.

## 1. Résumé exécutif

- **Quatre tickets** : A (l'eau potable dans l'assistant), B (les cours d'eau à sec), C (les promesses de la page gratuite), D (une carte « Santé environnementale » dans Territoire).
- **L'audit était trop étroit sur les preuves orphelines.** Il citait l'air et l'industrie. En réalité, **quatre** constats du dossier renvoient vers Territoire sans qu'aucune carte ne les montre : l'air, l'industrie, le bruit et le radon (§6.1). Le radon est le plus fréquent : il est signalé sans priorité déclarée, sur environ une commune sur cinq. Le ticket D doit donc couvrir ces quatre faits, sinon la moitié du problème reste ouverte.
- **Un second écart, absent de l'audit** : la règle industrie conclut « favorable » même quand une adresse est connue, alors que la mesure part du centre de la commune. La règle bruit a été corrigée pour ce cas précis ; la règle industrie, non (§6.2). Il est traité dans D.
- **La carte santé environnementale est faisable avant lancement sans nouvelle source** : air, industrie et bruit sont déjà dans l'index, et le radon est déjà interrogé par le moteur. Il manque une seule donnée, la distance du site industriel retenu. Il faut l'ajouter à l'index, et le script qui calcule l'exposition la connaît déjà.
- **Avant lancement : A, B, C et D minimal.** A et B corrigent des affirmations fausses. C et D tiennent les promesses de la page gratuite et les liens de preuve du dossier.

## 2. Ticket A · L'assistant lit l'eau potable réseau par réseau

**Titre proposé** : AskFuture : l'eau potable lue par réseau de distribution, jamais attribuée à une adresse

**Problème utilisateur.** Un acheteur du dossier qui demande à l'assistant « l'eau du robinet est-elle bonne ? » reçoit une réponse fondée sur un seul réseau présenté comme toute la commune. Cette réponse peut dire « conforme » à tort (Marseille, 25/08), affirmer « pas de relevé récent » alors qu'un prélèvement existe (01001), ou parler de « nitrites » en lisant le phosphore. La page gratuite, elle, dit juste depuis FUT-152.

**Périmètre.**
- `src/lib/commune-enrichment.ts` : remplacer `drinkingWater` (venu de `getEaufranceSummary`) par la lecture FUT-152 `getEauPotableCommune(insee)` (`src/lib/server/eau-potable.ts`).
- `src/lib/ask/system-prompt.ts:217-247` : réécrire `formatEauBlock` réseau par réseau (nom du réseau, zone si la source la nomme, date du dernier prélèvement, conclusion de l'ARS, limites et références de qualité, paramètres avec leur réseau et leur date).
- Consigne explicite dans le prompt : ne jamais attribuer un réseau à une adresse ; s'il y a plusieurs réseaux, les nommer et dire que le réseau d'un logement se demande à la mairie ou au distributeur.
- Supprimer la partie eau potable de `src/lib/eaufrance.ts` (garder `loadDrought`, qui relève de B).
- Mettre à jour les jeux d'essai de l'assistant (`src/lib/ask/__fixtures__/communes.json`, champ `drinkingWater`).

**Hors périmètre.** Toute carte eau dans Territoire. L'historique sur 12 ou 24 mois. L'eau « de votre logement ». Le filtrage des réseaux non résidentiels (Marseille, Grand port maritime).

**Échelle de lecture.** Réseau de distribution (UDI), à l'intérieur de la commune. Jamais l'adresse.

**Données réutilisées.** Hub'Eau qualité de l'eau potable, par la bibliothèque FUT-152, déjà testée.

**Choix d'affichage.** Aucun écran. Le texte de l'assistant suit la page gratuite : chaque réseau, sa date, la conclusion officielle.

**États à transmettre à l'assistant.**

| État | Ce que l'assistant doit pouvoir dire |
|---|---|
| Un réseau, prélèvement lu | Le réseau, sa date, la conclusion de l'ARS |
| Plusieurs réseaux | La liste ; impossible de dire lequel dessert un logement |
| Réseau sans prélèvement dans la fenêtre | « Pas de prélèvement publié depuis le JJ/MM » pour ce réseau, sans conclure sur les autres |
| Référence de qualité non respectée | Le dire, en distinguant référence et limite |
| Source en panne | « Je n'ai pas pu lire la source aujourd'hui », jamais « aucun relevé » |
| Question sur une adresse | Non attribuable : le réseau d'un logement ne se déduit pas de l'adresse |

**Risques de faux rassurant.** Un réseau conforme présenté pour la commune ; « conforme » aux limites alors qu'une référence n'est pas respectée ; un prélèvement ancien lu comme actuel.

**Anciens dossiers.** Aucun travail de reprise. L'assistant lit les sources au moment de la question (`src/app/api/ask/route.ts:245`), rien n'est figé dans le dossier : tous les dossiers, anciens compris, bénéficient du correctif dès sa mise en ligne.

**Complexité.** Faible : une demi-journée à une journée, tests compris. Recette : Paris (4 réseaux), Marseille (16, référence non respectée), Metz (conclusion ARS reprise), 01001 (prélèvement de février), panne, question sur une adresse.

**Coût Vercel.** Négligeable : 1 + n réseaux + 5 appels Hub'Eau par commune, mis en cache une journée, du temps d'attente plus que du calcul.

**Priorité.** 1, avant lancement. Repli possible en une heure si le temps manque : retirer le bloc eau potable du prompt.

## 3. Ticket B · La carte Territoire voit les cours d'eau à sec

**Titre proposé** : Territoire : l'état d'écoulement des cours d'eau jamais demandé à la source

**Problème utilisateur.** La carte « L'eau et les sols » affiche « Pas de cours d'eau à sec » même quand l'Office français de la biodiversité a observé un assec dans la commune (16016, le 28/10). Le lecteur est rassuré sur un fait que la source contredit.

**Périmètre.**
- `src/lib/eaufrance.ts:132` : demander `libelle_ecoulement` dans `fields`.
- Un test qui vérifie la **requête** : le champ demandé est celui qui est lu. Le test actuel (`src/lib/eaufrance.test.ts`) ne vérifie que la lecture d'une réponse fabriquée, et c'est ce qui a laissé passer le défaut.
- Anciens dossiers : un relevé enregistré avec une date d'observation mais sans état (`status === null` et `lastObservationDate` renseigné) affiche « État du cours d'eau non vérifiable à la date de ce dossier ». C'est la signature exacte du défaut.
- Même règle pour l'assistant, qui lit le même champ.

**Hors périmètre.** Toute nouvelle lecture de la sécheresse. Les restrictions d'eau (VigiEau), qui fonctionnent.

**Échelle de lecture.** Commune, par la station d'observation qui lui est rattachée ; un relevé ponctuel à sa date.

**Données réutilisées.** Hub'Eau écoulement (réseau ONDE), même appel.

**Choix d'affichage.** La carte existante, sans changement de forme. L'état et sa date.

**États.**

| État | Affichage |
|---|---|
| Écoulement observé | État et date |
| Assec ou écoulement interrompu | État et date, mis en avant |
| Pas de station dans la commune | Rien sur ce point (ligne absente) |
| Ancien dossier (signature du défaut) | « Non vérifiable à la date de ce dossier » |
| Source en panne | « Source indisponible », jamais « pas de cours d'eau à sec » |

**Risque de faux rassurant.** C'est le défaut corrigé. Un second risque reste à surveiller : un relevé de juin lu en octobre. La date doit toujours accompagner l'état.

**Anciens dossiers.** Ils sont touchés, et c'est le seul ticket où la reprise compte. La règle de signature évite toute recollecte. Une recollecte des dossiers ouverts n'est pas recommandée : elle changerait le contenu d'un dossier payé sans que le lecteur l'ait demandé.

**Complexité.** Très faible : une à deux heures.

**Coût Vercel.** Nul.

**Priorité.** 2, avant lancement.

## 4. Ticket C · La page gratuite promet ce que le produit fait

**Titre proposé** : Pollutions invisibles : la phrase vers Où vivre dit ce qui entre réellement dans le choix d'une commune

**Problème utilisateur.** La page gratuite annonce que « IREP, sites pollués, qualité de l'air, eau potable » entrent dans le choix d'une commune où vivre (`src/app/(public)/agir/pollutions-invisibles/page.tsx:390`). Un lecteur qui passe au comparateur pour l'eau potable ou IREP ne les trouve pas.

**Périmètre.**
- Réécrire la phrase pour nommer ce qui entre réellement dans Où vivre : l'air de fond, l'éloignement des sites industriels classés, l'ancien site pollué le plus proche quand le lecteur le demande. Ni IREP ni l'eau potable.
- Si D est livré avant, la phrase peut aussi annoncer que le dossier de territoire rassemble ces lectures sur une carte.
- Un garde-fou dans le code : un test qui échoue quand une règle du dossier émet une preuve vers Territoire sans clé de phénomène (`targetKey`), sauf exception listée et justifiée. Il empêche qu'une cinquième preuve orpheline apparaisse en silence. La liste d'exceptions se vide avec D.

**Hors périmètre.** La correction des preuves orphelines elles-mêmes, qui relève de D. Tout lien externe comme solution, conformément à la décision du 30/10.

**Échelle de lecture.** Texte public ; aucune donnée.

**Choix d'affichage.** Une phrase, un bouton inchangé. Texte relu par l'Editorial Writer, sur accord.

**États.** Sans objet.

**Risque de faux rassurant.** Faible. Le risque est de promettre trop, et la réécriture le corrige.

**Anciens dossiers.** Aucun impact.

**Complexité.** Très faible : une heure pour le texte, une à deux heures pour le test.

**Coût Vercel.** Nul.

**Priorité.** 4, avant lancement. Peut partir en même temps que A.

## 5. Ticket D · Une carte « Santé environnementale » dans Territoire

**Titre proposé** : Territoire : une carte « Santé environnementale » qui démontre l'air, l'industrie, le bruit et le radon déjà lus par le dossier

### 5.1 Le problème

Le dossier sait déjà quatre choses sur l'environnement sanitaire d'une commune, et il en tire des constats. Aucun écran ne les montre. Le lecteur qui clique sur la preuve « NO₂ 15,9 µg/m³ » arrive en haut du module Territoire, où rien ne parle d'air. Le lecteur qui n'a pas déclaré ces priorités, lui, n'apprend rien : la page gratuite lui en disait plus.

| Fait | Où il est lu | Quand le dossier en parle | Fréquence du constat |
|---|---|---|---|
| Air de fond (PM2,5, NO₂) | Index, `viv.pm25`, `viv.no2` | Priorité `air_sain` déclarée, NO₂ ≥ 10 ou PM2,5 ≥ 10 µg/m³ | ~6 % des communes |
| Site industriel dominant | Index, `expoIndustrielle` | Priorité `faible_exposition_industrielle` déclarée, score ≤ 50 | ~5,6 % |
| Infrastructure bruyante | Index, `calmeSonore` | Priorité `calme_sonore` déclarée, sous la distance de convention | ~12 % |
| Potentiel radon | Géorisques, appel du moteur | Toujours, en classe 3 | ~19,5 % |

### 5.2 La forme : une seule carte, quatre lignes

**Recommandation : une seule carte, dans le module Territoire, avec un volet de quatre lignes.**

Pourquoi une seule carte :
- Les quatre faits sont faibles un par un, et ils partagent le même grain : la commune, ou un point de référence au centre de la commune. Quatre cartes donneraient à l'environnement sanitaire plus de place que la chaleur ou l'inondation, qui sont mieux mesurées. La proportion compterait plus que chaque fait.
- Une famille de quatre cartes ferait aussi un tableau de bord sanitaire, et c'est l'effet anxiogène qu'il faut éviter.
- La grille Territoire a ses thèmes (« Le territoire », « Le climat », « Les risques ») et sait déjà regrouper.

Pourquoi pas une section à part : une section imposerait une nouvelle mise en page alors que la carte avec volet existe, sait recevoir une preuve (FUT-69 : le volet s'ouvre à l'arrivée et met une ligne en évidence) et sait dire sa relation au projet du lecteur (le filet de registre).

**Articulation avec les preuves.** Quatre nouvelles clés de phénomène dans `src/lib/decision/evidence-targets.ts` : `health.air_background`, `health.industrial_site`, `health.noise_infrastructure`, `health.radon`. Chaque règle (`territoire.sante-air`, `territoire.sante-industrie`, `territoire.sante-bruit`, `territoire.radon`) pose sa clé sur sa preuve. La carte déclare les quatre. À l'arrivée par une preuve, le volet s'ouvre sur la ligne visée, mise en évidence. Le test de couverture existant (`evidence-targets.test.ts`) vérifie que chaque clé a sa carte.

**Place dans la grille.** Groupe « Les risques », en dernière position. L'air et le bruit relèvent aussi du cadre de vie, mais l'industrie et le radon sont des risques recensés par l'État, et la carte doit vivre à un seul endroit. Point d'arbitrage n° 3.

### 5.3 Le contenu, ligne par ligne

Règle générale : **la carte ne signale que ce que le dossier signalerait, aux mêmes seuils.** Elle montre la valeur dans tous les cas, mais elle ne met en avant que ce qui franchit le seuil de la règle. Sans cette règle, la carte raconterait un fait que le dossier a écarté : c'est le piège décrit dans `CLAUDE.md` (« un seuil qui devient conditionnel »). Les seuils sont lus dans `src/lib/decision/sante-facts.ts`, jamais recopiés.

#### Ligne 1 · L'air de fond

- **Grain** : commune. Moyenne annuelle modélisée, communale.
- **Ce qui est montré** : PM2,5 et NO₂ en µg/m³, chacun avec deux repères officiels. Pour les PM2,5 : la recommandation de l'OMS (5) et la valeur limite européenne de 2030 (10). Pour le NO₂ : la recommandation de l'OMS (10) et la valeur limite européenne de 2030 (20).
- **Phrase utile pour la décision** : ce que la moyenne dit de la commune, et ce qu'elle ne dit pas de la rue. Le NO₂ est un marqueur du trafic, il chute de moitié à quelques dizaines de mètres d'un axe passant. Le geste qui en découle est le seul qui compte pour un logement : se situer par rapport aux voies passantes, et regarder la façade des chambres.
- **Phrase qui évite le faux rassurant** : aucune commune française ne descend sous la recommandation de l'OMS pour les particules fines (minimum national : 5,6 µg/m³). Une valeur sous la limite européenne veut dire « sous le seuil réglementaire », jamais « air pur ». La carte le dit une fois, sans dramatiser.
- **Mise en avant** : seulement si NO₂ ≥ 10 ou PM2,5 ≥ 10, comme la règle.
- **Position nationale (optionnelle)** : « plus élevé que X % des communes », lu dans les percentiles déjà présents dans l'index, en silence au milieu de la distribution, comme le veut la doctrine du rang national. Point d'arbitrage n° 4.
- **Prérequis** : retrouver l'année de référence de ces moyennes. Le jeu ADEME ne la documente pas (vérifié le 30/10 dans l'audit). Sans elle, la ligne doit écrire « moyenne annuelle publiée par l'ADEME, année de référence non précisée par la source ». C'est honnête, mais faible. Une demi-journée de recherche, à faire en premier.

#### Ligne 2 · Les sites industriels

- **Grain** : autour du point de référence de la commune, dans un rayon de 8 km.
- **Ce qui est montré** : la catégorie légale du site retenu (Seveso seuil haut, Seveso seuil bas, directive sur les émissions industrielles, autorisation) **et sa distance** au point de référence. La catégorie est opposable et retrouvable sur Géorisques. Le score d'exposition n'est jamais affiché : c'est un déclencheur interne.
- **Donnée à ajouter** : la distance du site retenu. L'index ne porte que la catégorie et le score (`scripts/populate-exposition-industrielle.py:269`), alors que le script calcule la distance de chaque site. Il suffit de la conserver, comme le fait déjà `calmeSonore`. Le nom de l'établissement est possible aussi ; il est réservé à la version ambitieuse (§5.6).
- **Ce qui est mis en avant** :
  - le site franchit le seuil de la règle : la ligne le signale, avec la glose légale de `industrieGlose` ;
  - un site Seveso est présent sous le seuil (plus loin) : la ligne le mentionne sans le mettre en avant (« un site classé Seveso seuil bas à 6,2 km ») ;
  - ~~le site retenu est seulement « autorisation » ou « émissions industrielles » sous le seuil : la ligne dit « aucun site Seveso dans un rayon de 8 km ».~~ **Corrigé au §0** : la présence ou l'absence de Seveso se lit sur la distance du Seveso le plus proche, ajoutée à l'index, jamais sur la catégorie retenue par le score. Elle ne liste pas ces installations, présentes autour de plus des trois quarts des communes : les nommer ne donnerait aucune information de choix et ferait peur ;
  - aucun site retenu (~3 % des communes) : « aucun site Seveso, ni installation industrielle soumise à autorisation, dans un rayon de 8 km ».
- **Geste** : l'état des risques de l'adresse et, s'il existe, le plan de prévention des risques technologiques. C'est déjà l'action de la règle.
- **Ce qui ne mérite pas d'entrer** : IREP (rejets déclarés, sans geste pour un acheteur ; arbitrage FUT-152 maintenu), un décompte d'installations, une carte des sites.

#### Ligne 3 · Le bruit des infrastructures

- **Grain** : autour du point de référence de la commune.
- **Ce qui est montré** : l'infrastructure la plus proche (autoroute ou voie rapide, voie ferrée, aéroport) et sa distance, quand elle est dans la distance de convention (1 km, 500 m, 5 km). Ces distances sont des conventions de produit ; elles sont déjà dites dans le constat du dossier.
- **Hors convention** : « aucune autoroute à moins d'1 km, aucune voie ferrée à moins de 500 m, aucun aéroport à moins de 5 km du centre de la commune ».
- **Pourquoi elle est là** : la preuve bruit du dossier est orpheline elle aussi (§6.1). Sans cette ligne, D laisse un lien vers le vide.
- **Point d'attention** : le bruit aérien à l'adresse existe déjà dans Logement (FUT-146). La ligne ne le reprend pas. Dans un dossier d'adresse, elle renvoie vers lui.

#### Ligne 4 · Le radon

- **Grain** : commune (ou arrondissement pour Paris, Lyon et Marseille). Classement réglementaire du potentiel du sous-sol.
- **Ce qui est montré** : la catégorie, sur 3, et son sens.
- **Phrase qui évite le faux rassurant** : une catégorie 1 ou 2 ne garantit pas une concentration faible dans un logement mal ventilé. La règle radon refuse déjà tout « favorable » pour cette raison (`src/lib/decision/radon-rules.ts:10-14`). La ligne suit la même règle : elle affiche la catégorie sans jamais en faire une bonne nouvelle.
- **Mise en avant** : catégorie 3, comme la règle.
- **Geste** : la mesure dans le logement (dosimètre, deux mois en hiver). Il est déjà dans `GESTES.radon`.
- **Donnée à ajouter au dossier** : la catégorie radon. Le moteur l'interroge déjà, mais elle n'est pas enregistrée dans le relevé Territoire.

### 5.4 La face de la carte

- **Titre** : « Santé environnementale ».
- **Valeur** : le premier signal mis en avant, par ordre de gravité (site Seveso sous le seuil, radon catégorie 3, NO₂ ou PM2,5 au-delà, infrastructure bruyante). Exemples : « Site Seveso seuil haut à 2,1 km », « Radon : potentiel de catégorie 3 ».
- **Sans signal** : « Aucun signal au-delà des seuils retenus », avec, en sous-ligne, « lecture à l'échelle de la commune ». Pas de couleur verte, pas de coche. Point d'arbitrage n° 5.
- **Pas de note, pas de compte de signaux, pas de jauge.** Un « 2 signaux sur 4 » serait un score composite.

### 5.5 Les états

| État | Ligne concernée | Affichage |
|---|---|---|
| Lu, sous le seuil | Toutes | Valeur, repère, phrase de sens ; pas de mise en avant |
| Lu, au-delà du seuil | Toutes | Mise en avant, geste |
| Partiel | Air (un polluant sur deux) | Le polluant lu ; « l'autre polluant n'est pas disponible pour cette commune », jamais une conclusion d'ensemble |
| Indisponible | Radon (Géorisques en panne) | « Source indisponible à la date de ce dossier », jamais « catégorie 1 » |
| Absent de l'index | Air, industrie, bruit (communes non géolocalisées) | « Non lu pour cette commune » |
| Paris, Lyon, Marseille | Air, industrie, bruit | Lecture par arrondissement, présentée en fourchette (sous la forme « de X à Y µg/m³ selon l'arrondissement »), jamais une moyenne de la ville. Radon : déjà par arrondissement |
| Dossier d'adresse | Industrie, bruit | « Mesuré depuis le centre de la commune, pas depuis votre adresse » ; jamais une conclusion sur l'adresse (§6.2) |
| À vérifier sur place | Air (NO₂), bruit, radon | Le geste de la règle |
| Non attribuable | Toutes | Aucune ligne ne parle « du logement » |
| Ancien dossier | Toutes | Voir ci-dessous |

### 5.6 Deux variantes (remplacé par le §0 : la version ambitieuse est retenue directement)

#### Version minimale, avant lancement

- **Ce qu'elle apporte** : les quatre preuves orphelines trouvent leur démonstration ; le dossier payant montre, en une carte, ce que la page gratuite ne sait pas dire (des valeurs annuelles avec leurs repères officiels, la catégorie légale et la distance du site industriel, le radon) ; tout acheteur voit cette lecture, qu'il ait déclaré ou non ces priorités.
- **Contenu** : la carte et ses quatre lignes ci-dessus, au grain commune ou au point de référence ; la distance du site industriel ajoutée à l'index ; la catégorie radon et les trois faits de l'index ajoutés au relevé Territoire ; les quatre clés de preuve ; la correction de la règle industrie à l'adresse (§6.2).
- **Ce qu'elle évite** : toute nouvelle source, tout nouveau seuil, tout calcul à l'adresse, IREP, ATMO, l'eau potable.
- **Coût** : deux à trois jours, dont une demi-journée pour l'année de référence de l'air et une demi-journée pour régénérer l'index. Coût Vercel nul pour l'air, l'industrie et le bruit (index déjà chargé par le relevé), plus un appel Géorisques radon par dossier, déjà fait par le moteur et mis en cache.
- **Risque produit** : moyen-faible. Le principal : une distance mesurée depuis le centre lue comme une distance depuis le logement. La mention de grain sur chaque ligne et la règle « dossier d'adresse » le contiennent. Second risque : l'année de l'air introuvable, qui affaiblit la ligne sans la rendre fausse.

#### Version ambitieuse, après lancement

- **Ce qu'elle apporte** : la ligne industrie passe à l'adresse. Elle donne le nom de l'établissement, sa catégorie et sa distance depuis le logement. Elle indique aussi si un plan de prévention des risques technologiques existe sur la commune (GASPAR, déjà interrogé pour les plans naturels) et si l'adresse est dans son périmètre réglementé (servitude publiée au Géoportail de l'urbanisme, quand elle l'est).
- **Où** : la partie « à l'adresse » vit dans Logement, à côté des sols pollués au point de FUT-157. La carte Territoire garde la lecture communale et renvoie vers elle. C'est la même séparation que pour l'inondation (zonage au point dans Logement, mémoire communale dans Territoire).
- **Ce qu'elle évite** : la confusion entre centre de la commune et logement, qui reste la limite principale de la version minimale.
- **Ce qu'elle n'apporte pas** : l'air à l'adresse. Les cartes de modélisation fine existent chez les associations régionales de surveillance de la qualité de l'air (AASQA), sans agrégat national homogène. Même constat pour les cartes de bruit stratégiques (`sante-facts.ts`).
- **Coût** : une à deux semaines. Index des installations classées à l'adresse (le cache national du script existe), lecture des plans technologiques, coordination avec FUT-157, recette sur des communes à Seveso (Lacq, Fos, Feyzin). Coût Vercel faible si l'index est local, comme IREP aujourd'hui.
- **Risque produit** : moyen. Nommer un établissement près d'un logement est plus anxiogène qu'une catégorie à la commune. Le geste doit accompagner chaque nom. La qualité des servitudes PPRT publiées est inégale selon les départements : à mesurer avant de promettre.

### 5.7 Ce qui ne mérite pas d'être intégré

| Donnée | Raison |
|---|---|
| Indice ATMO du jour | Un épisode, pas une exposition ; il ne dit rien d'un choix de logement. Reste sur la page gratuite |
| IREP | Rejets déclarés, doublon de la catégorie légale, aucun geste pour un acheteur |
| Décomptes communaux de sites et sols (CASIAS, SIS) | Anxiogènes et sans geste ; le fait utile est au point (FUT-157) |
| Eau potable | Ticket A pour l'assistant ; une carte attend la convention sur 12 ou 24 mois |
| PM10, ozone | Typés, jamais affichés ; pas de seuil opposable retenu à ce jour |
| Pression agricole (IFT) | Aucun seuil défendable au grain commune ; le risque réel est au grain parcelle (`sante-facts.ts`) |
| Score composite « santé » | Contraire à la doctrine |

### 5.8 Les anciens dossiers

Un dossier déjà acheté n'a pas ces faits dans son relevé figé. Trois options :

1. **Lire l'index courant à l'affichage**, en le disant : « lecture ajoutée le JJ/MM, après l'édition de votre dossier ». L'air, l'industrie et le bruit sont des valeurs figées de l'index, identiques à celles qui ont produit les constats du dossier : la preuve et la carte concordent. Le radon se lit en direct, avec la même mention. Le code connaît déjà ce schéma pour les arrêtés de catastrophe naturelle (`catnatMisAJour`).
2. **Ne rien afficher** : les anciens dossiers gardent des preuves orphelines.
3. **Recalculer les relevés** : change un dossier payé sans demande du lecteur.

Recommandation : **option 1**, avec un test qui vérifie que la valeur affichée est celle de la preuve quand le dossier en porte une.

### 5.9 Complexité et ordre interne

1. Année de référence de l'air (recherche, une demi-journée). Conditionne le texte de la ligne 1.
2. Distance du site industriel dans l'index (script existant, régénération).
3. Faits au relevé Territoire, clés de preuve, règle industrie à l'adresse.
4. Carte et volet, états, anciens dossiers.
5. Relecture du texte (Editorial Writer, sur accord) et recette : une commune sans signal, Lille (NO₂), une commune Seveso proche (Feyzin), une commune Seveso lointaine, une commune radon 3, Paris, un dossier d'adresse, un ancien dossier.

## 6. Corrections de l'audit, avec preuves

### 6.1 Quatre preuves orphelines, et non deux

L'audit (§2.3) citait l'air et l'industrie. Le bruit et le radon sont dans le même cas :
- bruit : `src/lib/decision/materiality-rules.ts:1100`, `href: territoireHref`, sans `targetKey` ;
- radon : `src/lib/decision/radon-rules.ts:57`, même chose ;
- aucune carte du module ne parle de bruit, de radon, d'air ou d'industrie (`src/components/report/QuartierClimatData.tsx`, liste des cartes l.142-160), et `evidence-targets.ts` n'a aucune clé pour ces phénomènes.

Le radon pèse le plus : sa règle se déclenche sans priorité déclarée, sur environ 19,5 % des communes (`radon-rules.ts:17-20`).

### 6.2 La règle industrie conclut « favorable » à l'adresse

`materiality-rules.ts:1125` rend `satisfied` (« aucun site industriel à risque à portée ») avec ou sans adresse. Pour le bruit, le même cas a été jugé « mensonge silencieux » et corrigé : avec une adresse, la règle rend « non concluant » (`materiality-rules.ts`, règle bruit, commentaire « DÈS QU'UNE ADRESSE EXISTE, CE `satisfied` DEVIENT UN MENSONGE SILENCIEUX »). L'industrie mesure aussi depuis le centre de la commune, dans un rayon de 8 km. Une adresse en bordure de commune peut se trouver à 3 km d'un site que le centre voit à 9 km. Gravité modérée (rayon large, seuil prudent), même nature de défaut. Inclus dans D, parce que la carte doit dire la même chose que la règle.

### 6.3 Ce qui reste juste dans l'audit

Les défauts eau (A) et assec (B) sont confirmés par le code relu aujourd'hui. Aucun autre point de l'audit n'est contredit.

## 7. Ordre de priorité recommandé (remplacé par le §0)

| Rang | Ticket | Pourquoi ce rang | Effort |
|---|---|---|---|
| 1 | A · Eau dans l'assistant | Affirmation fausse sur la santé, dans le payant | ½ à 1 j |
| 2 | B · Cours d'eau à sec | Fausse réassurance visible, correctif minime | 1 à 2 h |
| 3 | D minimal · Santé environnementale | Quatre preuves orphelines, dont une sur cinq dossiers ; le payant rattrape le gratuit | 2 à 3 j |
| 4 | C · Promesse de la page gratuite | Texte court, mieux écrit une fois D connu | 2 à 3 h |

A, B et C sont indépendants et peuvent partir en parallèle. C gagne à être écrit après D, sans en dépendre.

**Indispensable avant lancement** : A, B, D minimal, C.

**Important, peut attendre quelques semaines** : D ambitieux (industrie à l'adresse, plans technologiques), en coordination avec FUT-157 ; l'eau potable dans Territoire, après validation d'une convention (12 ou 24 mois, limites réglementaires seules) ; le filtrage des réseaux d'eau non résidentiels sur la page gratuite.

**À écarter** : ATMO dans le payant ; IREP dans le dossier ; décomptes communaux de sites et sols ; « eau de votre logement » ; tout score composite ; un lien externe comme seule démonstration d'une preuve.

## 8. Points d'arbitrage laissés au porteur (tranchés le 30/10, voir §0)

1. **D couvre-t-il quatre faits ou deux ?** Recommandation : quatre (air, industrie, bruit, radon), parce que les quatre preuves sont orphelines. Avec deux, les preuves bruit et radon restent orphelines au lancement.
2. **Ajouter la distance du site industriel à l'index avant lancement ?** Recommandation : oui. Sans elle, la ligne dit « à proximité », ce qui est vague et inquiète sans informer.
3. **Place de la carte** : groupe « Les risques » (recommandé) ou groupe « Le territoire ».
4. **Position nationale de l'air** (« plus élevé que X % des communes ») : à montrer ou non. Recommandation : oui, en silence au milieu de la distribution.
5. **Face sans signal** : « Aucun signal au-delà des seuils retenus » convient-il, ou préfères-tu une face qui nomme toujours la valeur d'air ?
6. **Année de l'air introuvable** : afficher la ligne avec « année non précisée par la source », ou suspendre la ligne air jusqu'à ce qu'on la trouve ?
7. **Anciens dossiers** : lecture de l'index courant avec mention (recommandé), ou silence.
8. **Repli pour A** si le temps manque : retirer le bloc eau de l'assistant.
