# FUT-41 / FUT-22 · V3.2 · La continuité avec le Relevé

20 octobre 2026 · branche `explore/fut-41-centre-decision` · **prototype de revue, données fictives.**
Aucun changement du moteur, des droits, des prix ni du paiement ; aucun appel IA ; aucune PR, fusion ni
déploiement ; `DECISION_RELEVE` n'est pas activé ; V1, V2, V3 et V3.1 sont intactes ; les branches
FUT-118 et FUT-91 ne sont pas touchées (seules quelques captures en ont été **copiées** dans
`captures-v3-2/reference/`).

- **Prototype** : `prototype-v3-2.html` (lien raw.githack dans `pour-chatgpt/LISEZ-MOI.md`). La bande
  « Démonstration » donne les quatre moments, **« Depuis un rapport : commune / adresse »** (le parcours
  de continuité) et **« Marques : A / B »** (W3).
- **Planche** : `planche-continuite-v3-2.html`, et ses images `captures-v3-2/planche-*.png`.
- **Notes métier** : `note-fut22-comparabilite.md` (W4), `note-fut41-validite-point.md` (W5).
- **Protocole** : `protocole-test-trois-personnes.md` (non mené).

---

## 1. Ce qui a été relu, et ce qui est en production

| Source | Ce qui a été examiné |
| --- | --- |
| **FUT-87** (`feat/fut-87-direction-artistique`) | captures avant / après de Ma décision et de Logement, cas défavorables, échelles |
| **FUT-91** (`feat/fut-91-decision-releve`, 6665ff11) | audit de livraison, matrice de parité, captures du vrai hub (communal, adresse, états), code `src/components/releve/` |
| **FUT-118** (`feat/fut-118-convergence-releve`, 17303dbd, PR #71) | `grammaire-du-releve.md` (§ 0 à 10), `releve.module.css`, `primitives.tsx`, `echelle-geometry.ts`, témoins `/dev/fut118` (dont le témoin 04, comparaison) |
| **FUT-75** | jetons `--m-*`, niveaux geste / état / structure, mouvement réduit |
| **FUT-41 V3.1** | prototype, 34 captures, code |
| **Produit (`main`, 3da725e3)** | `comparaison-candidats.ts`, `projet-materiel.ts`, `criterion-value.ts`, `decision-artifact.ts`, `active-territory.ts`, tables utilisées |

**Production et cible.** En production, Ma décision est encore l'**écran classique** : cartes à coins
arrondis, surtitres en capitales mono, pastilles de preuve, puces colorées
(`reference/production-ma-decision-classique-1440.jpg`). Le Relevé y existe, mais **derrière
`DECISION_RELEVE`, éteint**. En revanche, l'**accueil de production** emploie déjà les primitives du
Relevé. La cible de cette passe est donc le Relevé tel que FUT-91 le rend sous le drapeau, pas l'écran
actuel. **Conséquence à retenir** : tant que le drapeau reste éteint, une personne qui passe d'un
dossier à un centre de décision V3.2 changerait de langage visuel. La continuité recherchée ici suppose
l'activation du Relevé (décision X1).

## 2. Audit visuel : V3.1 face au Relevé

Le jugement porte sur la **parenté des compositions**, pas sur l'identité des jetons, qui était déjà
acquise en V3.1 (mêmes couleurs, même Archivo, mêmes durées).

| Dimension | Le Relevé (FUT-87 / 91 / 118) | La V3.1 | Jugement | V3.2 |
| --- | --- | --- | --- | --- |
| **Hiérarchie typographique** | un display par écran (le verdict, dans la plaque) ; les rubriques en **surtitres numérotés** (« 01 Votre projet face au lieu ») ; un titre dit une phrase | les rubriques (« Vos lieux », « À faire », « Ce qu'il faut retenir », « Vos notes ») en grands titres de 23 à 31 px ; le Projet en display à tous les moments | **rupture** : la V3.1 se lit comme une application à sections, le Relevé comme un document numéroté. C'est l'écart qui rendait la V3.1 générique | rubriques en surtitres numérotés ; le titre d'écran dit une phrase |
| **Rythme** | mouvements de 56 px à filet ; **grille à marge** (texte, 232 px de marge, 48 de gouttière) | mouvements à filet, mais **une seule colonne** partout ; la grille à marge n'apparaissait qu'au troisième niveau | **rupture** sur la structure la plus reconnaissable du Relevé | grille à marge dans la fiche, au premier niveau |
| **Surfaces** | la **plaque** (fond `--bg-deep`, deux coins de coupe), une par écran ; la **bande** pour la balance | **aucune plaque** ; des encadrés pointillés (« Votre Projet a changé ») qui reprennent la forme de l'**emplacement réservé au contenu d'un tiers** ; des formulaires encadrés | **rupture** et un **contresens** (le pointillé) | une plaque, pour « Faire le point » ; l'état « Projet changé » devient filet et trait neutre ; formulaires inchangés (composant « champ » manquant au canon) |
| **Registres** | trait de 3 px devant le sujet, jamais une pastille ; un non-établi n'a **aucune valence** | traits corrects partout, **sauf** les marques de piste remplies (W3), et l'issue « à vérifier » dessinée en **bleu** sur les pistes, ce qui donne une valence à un non-établi (§ 8.1.2) | deux écarts | variante B (§ 4) |
| **Échelles** | cercle, carré, losange ; l'**emblème emboîté**, rose graduée, trois états de trait | trois petites formes côte à côte sur chaque tuile (forme reprise du témoin 04 de FUT-118) ; **colorées par registre** quand une lentille est active | l'emblème, signe le plus singulier du Relevé, manquait ; la coloration des formes contrevient au § 4.1 | emblème emboîté, sans teinte, sur les tuiles, la fiche, la comparaison et le point |
| **Données dessinées** | règle de rang, seuils, échelle DPE, règle du temps | les pistes de comparaison, et rien d'autre | la fiche perdait le dessin que le rapport venait de montrer | la règle de rang est reprise à l'identique dans la fiche |
| **Marges de preuve** | à côté de chaque affirmation, en mono : grain, preuve, source, date | **invisibles avant deux clics** | **rupture** majeure (point 4 de la revue) | marge au premier niveau, sans millésime (§ 6) |
| **Vocabulaire** | « votre projet », « Ce qui correspond à votre projet », « À contrôler », « Données et limites », « à l'échelle de la commune » | « votre Projet », « Correspond à votre Projet », « À vérifier », « Voir les détails de cette analyse », « à la commune » | proches, mais **trois mots divergent** pour le même objet | « Données et limites » adopté ; « Projet » et « À vérifier » gardés, à trancher (X5, X6) |
| **Interactions et mouvement** | FUT-75 ; `details` à `+` / `−` ; rien qui zoome | identiques | **commun** | inchangé |
| **Signature** | plaque, emblème, marge, surtitres, règle du temps | tuiles et filets bien faits, mais aucun des signes propres | **générique** | plaque, emblème, marge, surtitres ; la règle du temps reste absente (proposée pour l'histoire d'un lieu, non faite) |

**Ce qui doit rester différent, parce que l'usage diffère.** Le rapport est lu de haut en bas une fois ;
le centre est parcouru, manipulé, rouvert. D'où, dans le centre : des **tuiles en grille** (on choisit un
lieu parmi plusieurs) ; **pas de verdict** ni de plaque de conclusion sur l'accueil ; **pas de bande de
balance** (la balance oppose deux côtés d'un même arbitrage, jamais deux lieux, § 5 de la grammaire) ;
des **gestes** (comparer, ajouter, écarter) que le rapport n'a pas ; une marge **en ligne** sous 900 px,
plus compacte que celle du rapport, parce que le centre doit montrer le premier lieu sans défiler.

## 3. Les compositions proposées

### 3.1 « Faire le point », relevé de la recherche (composition signature)

Une **plaque**, comme le verdict du rapport, mais **sans verdict**. Elle contient, dans l'ordre :

1. une ligne mono, « Relevé de votre recherche · 20 oct. », et le titre « Où en est votre recherche » ;
2. **la rangée des lieux en jeu** : pour chacun, son emblème des trois échelles, son nom, son état de
   connaissance en mots (« trois échelles analysées », « aperçu gratuit de la commune », « analyse
   d'avant votre dernier changement »), **dans l'ordre d'ajout, dit à l'écran** ; les écartés à la fin,
   atténués. Une phrase dit que **les formes ne disent rien de ce que vaut le lieu** ;
3. les **quatre blocs de la V3.1**, inchangés (où vous en êtes, ce qui peut vous faire hésiter, pour
   avancer, ce que futur•e ne mesure pas) ;
4. au pied, **sa provenance** : « Établi le 20 oct. à partir de 5 analyses (du 17 sept. au 16 oct.) et de
   2 notes · votre Projet du 8 oct. · aucun texte rédigé par une IA ».

Ce que la rangée montre est **établi** (quelles échelles ont été lues pour chaque lieu) ; ce qu'elle
s'interdit : un ordre de mérite, une couleur par lieu, un compte de points favorables. **Avec un seul
lieu**, elle se réduit à un emblème et garde son sens (ce qui est lu, ce qui ne l'est pas).

Pistes écartées : une matrice conditions × lieux (elle se lit comme un tableau de scores dès trois
lieux) ; un « cadran de la recherche » (il inventerait une jauge de complétude) ; la règle du temps
comme fond du point (le temps n'est pas ce que le point établit).

### 3.2 La place du Projet selon la maturité

Même ordre partout (Projet, phrase, geste), seules les tailles changent :

| Moment | Le Projet | Le titre de l'écran (h1) |
| --- | --- | --- |
| aucun lieu, un lieu | display, avec sa définition en une phrase | le Projet |
| deux lieux | un rôle en dessous (25 à 34 px) | le Projet |
| recherche enrichie | **une ligne** : « Votre Projet · Vivre près de la mer… · 6 conditions · Voir mon Projet » | **la phrase qui dit où en est la recherche** (« Cinq lieux sont dans votre recherche, et un a été écarté. ») |

**« Votre Projet »** est défini en une phrase, visible au début et en tête du Projet déplié : « Votre
Projet, c'est ce que vous avez dit chercher : vos conditions et vos préférences. futur•e lit chaque lieu
à partir de lui. »

### 3.3 La comparaison (un seul moment graphique)

Les deux lieux se font face **avec leur emblème** et leur état de connaissance en mots : une différence
de profondeur se voit avant toute ligne, sans être présentée comme un avantage. Les pistes restent
celles de la V3.1, avec les marques de la variante retenue. Je n'ai ajouté aucune autre figure.

## 4. W3 · les marques de piste

Deux variantes, **mêmes données, même cadrage**, sombre et clair, 1440 et 360 px
(`captures-v3-2/w3-*.png`, planche § 03). Le prototype permet de basculer (« Marques : A / B »).

- **A, marques colorées (V3.1).** La forme de l'échelle, remplie de la teinte du registre ; « à
  vérifier », en pointillé bleu.
- **B, Relevé strict.** La forme de l'échelle, à l'encre, sans remplissage ; le registre passe au **trait
  de 3 px devant le mot** sous la marque ; une issue non établie a un trait pointillé **sans teinte** ;
  la ligne pointillée d'une issue incertaine devient grise.

| Critère | A | B |
| --- | --- | --- |
| **Compréhension immédiate** | **meilleure** : le croisement (vert ici, orange là, puis l'inverse) se voit avant toute lecture ; la phrase « les compromis ne vont pas dans le même sens » se vérifie d'un coup d'œil | il faut lire les mots ; le croisement se voit encore, mais par deux traits de 3 px, plus discrets |
| **Ce que dit la forme** | brouillé : dans une comparaison de deux communes, tous les ronds sont des ronds ; remplis de couleur, ils se lisent comme des **pastilles d'état**, pas comme « la commune » | clair, mais **redondant** avec « à la commune » écrit à gauche : la forme sert surtout d'ancre |
| **Conformité au Relevé** | contraire à deux règles stables : « le registre se porte par un trait, jamais par une pastille » (§ 3.3) et « un non-établi n'a aucune valence » (§ 8.1.2) | conforme |
| **Continuité avec le rapport** | le rapport ne colore jamais une forme : la personne qui en vient voit un nouveau code | **même code que le rapport** : trait devant le mot, forme pour l'échelle |
| **Singularité** | plus graphique, plus « tableau de bord » | plus sobre, plus « relevé » |
| **Thème clair** | les teintes claires (vert sombre, brun, violet) restent lisibles en aplat de 20 px ; le brun et le vert se distinguent mal pour une personne daltonienne, mais le mot les double | traits lisibles ; contraste du texte inchangé |
| **Mobile 360 px** | lisible ; un libellé long passe sur deux lignes sans problème | lisible ; un libellé long passe sur deux lignes, le trait suit le premier mot (corrigé pendant la passe : il s'en détachait) |
| **Risque doctrinal** | les couleurs se **comptent** (« trois verts contre deux ») : la pente vers un score est réelle | rien à compter au premier regard |

**Recommandation : B.** La raison principale est la continuité : une personne qui arrive de son rapport
doit retrouver le même code (le trait devant le mot pour le jugement, la forme pour l'échelle), et A en
invente un troisième. La seconde est doctrinale : des aplats colorés se comptent, et c'est la pente la
plus courte vers un classement. **Ce que B coûte**, et il faut le dire : le motif croisé se lit moins vite.
La phrase d'entrée de la comparaison le compense (elle dit le sens des compromis), et le protocole de test
le mesurera (variante W3). **Rien n'est inscrit dans FUT-118** : B ne demande aucune exception.

## 5. Enregistrer, apercevoir, analyser

### 5.1 Ce que le produit permet aujourd'hui (audit sur `main`)

| Mécanisme | Ce qu'il garde | Gratuit ? | Ce qu'il ne fait pas |
| --- | --- | --- | --- |
| `user_profiles.home_insee_code` | la commune de **résidence** | oui | une seule ; ce n'est pas un lieu étudié |
| `user_profiles.active_insee_code` | le **territoire de lecture** courant | oui | un seul à la fois ; il remplace le précédent |
| Session Où vivre (`localStorage`, 2 h) | le dernier parcours du comparateur | oui | ni compte, ni durée, ni lieu choisi |
| Projet avant compte (`localStorage`) | le Projet saisi | oui | aucun lieu |
| Rapport partiel de la résidence | une lecture gratuite de **sa** commune | oui | une seule commune |
| Comparateur Où vivre, pages commune publiques, aperçu du dossier comparatif (`/api/comparateur-vie/apercu`, deux thèmes) | des lectures gratuites, à la commune | oui | rien n'est **attaché** à un lieu enregistré |
| `report_grants` | une commune **achetée** (dossier de territoire) | non | |
| `address_dossiers` | un **bien** (dossier d'adresse), qui ouvre aussi la commune (`canAccessTerritory`) ; « Mes biens » le liste | non (sauf dossier ouvert par l'administration) | |
| `decision_packs` | un dossier comparatif (trois communes) | non | |
| `decision_artifact` | l'analyse figée d'un périmètre acheté | lié à l'achat | |
| `terrain_observations` | des notes, **une par (utilisateur, commune, module)** | oui | pas par lieu ni par condition |

**Constat.** Il **n'existe aucun moyen de garder un lieu sans l'acheter**, en dehors de la résidence et
d'un territoire actif unique. Le « lieu enregistré » de la V3.2 est donc **une proposition** : il
demanderait un stockage nouveau (une table, ou un stockage local d'abord), décision qui n'est pas prise
ici (X3). Le prototype ne suppose aucun droit : quand un lieu partage la commune d'un bien déjà acheté,
la commune est dite lue **parce que** `canAccessTerritory` l'ouvre déjà ; que l'**analyse décisionnelle**
de cette commune puisse être réutilisée pour le nouveau lieu reste **à confirmer** côté produit.

### 5.2 Les états proposés

| État | Ce que la personne a fait | Ce que futur•e sait | Emblème | Mots (tuile, fiche, point) | Se compare ? | Ce qui est proposé |
| --- | --- | --- | --- | --- | --- | --- |
| **Enregistré** | ajouter une commune, une adresse ou une annonce | rien | trois formes en pointillé | « Enregistré · rien n'est encore lu » | non : « il ne se compare pas encore » | voir l'aperçu gratuit (commune) ; ce que l'analyse apporterait |
| **Aperçu** | ouvrir l'aperçu gratuit de la commune | une partie de vos conditions, **à la commune** | cercle en pointillé fin | « Aperçu gratuit de la commune » ; chaque issue suivie de « (aperçu) » ; « Source · … · aperçu » en marge | non : « hors départage » | ce que l'analyse de la commune ajouterait |
| **Adresse enregistrée, commune lue** | ajouter une adresse dans une commune déjà analysée | la commune ; ni abords ni logement | cercle plein, carré et losange en pointillé | « Commune analysée · adresse enregistrée, pas encore analysée » | à la commune seulement | ce que l'analyse de l'adresse apporterait |
| **Adresse inconnue** | ajouter une annonce sans adresse exacte | la commune si elle est lue | idem | « Commune analysée · adresse inconnue » | à la commune seulement | préciser l'adresse |
| **Analysé** | acheter le dossier (hors prototype) | le périmètre acheté, daté, pour un Projet donné | formes pleines des échelles lues | « Commune analysée », « Commune, abords et logement analysés » | oui, dans le même cadre | comparer, vérifier, noter |

**Règles d'expérience.**

1. **Ajouter enregistre.** Le bouton dit « Ajouter à ma recherche », et la phrase dessous : « Rien n'est
   analysé, rien n'est acheté. » Le geste principal suivant est « Voir ce qui peut être lu de… », jamais
   « Comparer ».
2. **Aucun bouton de marque ne parle d'acheter.** L'analyse s'ouvre par un lien sobre, « Ce que
   l'analyse de l'adresse apporterait », qui explique le dossier concerné et dit que **le prix s'affiche
   avant tout paiement**. Aucun prix, aucune offre nouvelle, aucun Pass (FUT-49 reste une hypothèse).
3. **Un lieu enregistré ne pèse rien** dans une comparaison ni dans le point : il est nommé, avec son
   état, et la phrase dit que ce n'est « ni bon ni mauvais signe ».
4. **L'aperçu ne départage jamais.** Il montre ce qu'il lit, marqué « aperçu », et ce qu'il ne lit pas.
5. Dans le prototype, l'analyse est **simulée** par un bouton marqué « démonstration, aucun achat ».

## 6. La preuve au premier niveau

Dans la fiche d'un lieu, chaque constat devient une **ligne de relevé** : à gauche, le sujet et ce que
dit la source ; à droite (sous 900 px, dessous, en une ligne), une marge mono qui donne :

- **l'échelle** : glyphe et mot (« ○ à la commune ») ;
- **la provenance** : « Source · Ameli, annuaire santé », sans millésime ; « · aperçu » pour une lecture
  gratuite ;
- **vos notes**, quand il y en a : « Vous · note de visite · 4 oct. ».

Le **statut** se lit par la position, comme dans le Relevé : ce que dit la source est le texte ; ce que
futur•e en conclut est le **trait de registre** du groupe (« Avec un compromis ») et la phrase du
deuxième niveau ; ce que vous avez observé est signé « Vous ». Une phrase de légende le dit une fois en
tête de la fiche. Le millésime, la date d'analyse, la version du Projet et le moteur restent dans
« Données et limites ». Dans la comparaison, la colonne des conditions porte la même ligne mono (glyphe
et sources). Les **tuiles** restent sans marge : elles portent seulement l'emblème et l'état en mots.

## 7. Notes métier

- **FUT-22, comparabilité** : `note-fut22-comparabilite.md`. Contrat en huit composantes, règle critère
  par critère fondée sur `valeurDecisionnelle` (déjà utilisée par FUT-7), cas de la gare, cas limites,
  tests. Le prototype **n'applique pas** cette règle (il garde la règle V3) : la montrer sans l'avoir
  écrite dans le moteur laisserait croire qu'elle existe.
- **FUT-41, validité du point** : `note-fut41-validite-point.md`. Recalcul à chaque ouverture ;
  empreinte par artefact et version servie, observations par identifiant et date, états des lieux ;
  invalidation par empreinte, jamais par date ; sept manques de la clé actuelle.

## 8. Le parcours de continuité

Lancement : bande « Démonstration », « Depuis un rapport : commune ». Le rapport est une
**reconstitution** dans la grammaire de FUT-91 sur les données fictives du prototype (il le dit en tête
d'écran) : comparer un rapport réel de Nîmes à une recherche fictive de Port-Anvel n'aurait rien prouvé.
La fidélité de la reconstitution se juge côte à côte avec la capture réelle de FUT-91 (planche § 02).

| Étape | Capture | Ce que la personne retrouve | Ce qui change, et pourquoi |
| --- | --- | --- | --- |
| 1. Le rapport de Port-Anvel | `c01` | plaque, verdict, sommaire, emblème, balance, marges | (proposition) en bas, « Dans votre recherche » et « Ouvrir Ma recherche » |
| 2. Ma recherche | `c02` | la commune, son **emblème** (cercle plein, carré et losange en pointillé, comme dans le rapport), « vient de votre dossier du 9 oct. » | des tuiles, un geste ; pas de verdict |
| 3. Le lieu | `c03` | **les mêmes constats**, la même source en marge, la même **règle de rang** pour la vie de quartier, « Données et limites » | groupés par ce que futur•e en conclut, avec une légende d'une ligne |
| 4. Ajouter Ploubrec | `c04`, `c05` | | « Ajouter à ma recherche » ; Ploubrec est **enregistrée**, rien n'est lu, elle ne se compare pas |
| 4 bis. L'aperçu, puis l'analyse | `c06`, `c07` | | l'aperçu lit trois conditions à la commune, marquées « aperçu » ; l'analyse est expliquée, puis simulée (« démonstration, aucun achat ») |
| 5. Comparer | `c08` | les emblèmes face à face, le trait et le mot du rapport | les pistes, propres au centre |
| 6. Une preuve | `c09` | « Données et limites », la marge mono | les deux côtés en regard |
| 7. Faire le point | `c10` | la plaque, l'emblème de chaque lieu | une plaque sans verdict, la rangée, quatre blocs |

**Depuis un dossier d'adresse** (`a01` à `a05`) : l'emblème du dossier a ses trois formes pleines
(3 constats à la commune, 2 aux abords, 1 au logement) ; la tuile et la fiche du 12 rue des Sternes
montrent les mêmes trois formes ; chaque constat garde en marge le glyphe de **son** échelle (le calme
aux abords, carré ; la chaleur au logement, losange ; le médecin à la commune, cercle). Les trois
échelles restent cohérentes de bout en bout, y compris à 390 px (`a04`, `a05`).

**Ce que la continuité n'a pas encore.** Le verdict du rapport n'a pas d'équivalent dans la fiche du
lieu : la fiche reprend les constats, pas la phrase de conclusion. C'est voulu (le centre ne réécrit pas
un verdict vendu), mais une personne pourrait chercher « la phrase du rapport ». Une ligne « Votre
dossier conclut : … » en tête de la fiche, citée mot pour mot, est une option (X7).

## 9. Contrôles

**Parcours automatique** (`tour32`, Chrome, Playwright), sur 13 situations (les 11 de la V3.1 et les deux
départs « depuis un rapport »). Pour chaque situation : chaque fiche, un fait ouvert et ses « Données et
limites », la comparaison, ses preuves, chaque lien de « Faire le point ». Il vérifie en plus que :

- **la marge dit vrai** : pour chaque constat de chaque fiche, la source et l'échelle affichées sont
  celles de la donnée (« apparaît » et « dit vrai » sont deux assertions, règle d'`AGENTS.md`) ; idem
  pour la ligne de sources de chaque condition comparée ;
- l'**état de connaissance** écrit sous le titre d'une fiche est celui que calcule la logique ;
- en variante B, **aucune forme n'est teintée** ; la variante A s'affiche sans débordement ;
- **ajouter enregistre** : un lieu ajouté est « enregistré », son adresse n'est pas lue, le geste n'est
  pas « Comparer », et sa tuile ne se dit pas analysée ; l'analyse n'arrive que par le bouton de
  démonstration ;
- le **parcours de continuité** complet : départ sur le rapport (« Mes dossiers » courant), pont,
  ajout de Ploubrec (enregistrée, ne se compare pas), aperçu (aucune comparaison proposée), analyse
  simulée, « Comparer ces deux lieux », preuve et « Données et limites », point (rangée « Port-Anvel,
  Ploubrec ») ;
- **aucun bouton de marque** ne parle d'acheter, de payer, d'analyser ni d'un prix, dans aucune
  situation ;
- et, repris de la V3.1 : aucun défilement horizontal, aucun mot technique au premier niveau, conditions
  sans compromis fidèles à l'issue réelle, phrase d'entrée de la comparaison complète, aucune piste
  dessinée quand la comparaison n'est pas fiable, Échap, clavier, mouvement réduit, aucun
  `font-variation-settings`.

**Résultat à 1440 px : aucune erreur.** Le passage complet aux cinq largeurs (1440, 1024, 820, 390,
360) tournait au moment du dépôt ; son résultat est ajouté ci-dessous dès qu'il est connu.

**Défauts trouvés et corrigés pendant la passe** : la navigation marquait « Où vivre » comme page
courante ; « une constat » ; la pastille « depuis votre dossier » chevauchait l'état de la tuile ; une
commune connue par l'aperçu proposait « Comparer avec » ; deux rubriques numérotées « 01 » ; le trait de
la variante B se détachait d'un libellé sur deux lignes à 360 px ; un contour de focus sur le titre du
point ; « Ce qui pèse : … » sous le titre « Ce qui pèse » ; « du 9 oct. au 9 oct. » ; la planche rognait
les vignettes.

**Non vérifiés** : Safari, lecteur d'écran, écran non Retina, et la compréhension par des personnes
qui découvrent futur•e (protocole prêt, non mené).

## 10. Autocritique

**Ce qui gagne vraiment en singularité.** Trois signes du Relevé reviennent là où ils ont un sens propre
au centre : l'**emblème** (qui dit enfin, sur chaque lieu, ce qui a été analysé), la **marge** (qui
remet la source à côté du constat), et la **plaque** de « Faire le point », dont la rangée d'emblèmes
est, je crois, la seule composition vraiment nouvelle de cette passe. Les surtitres numérotés font le
reste, sans bruit.

**Ce qui coûte en lisibilité.**
- La marge ajoute une ou deux lignes mono par constat : la fiche d'un lieu passe de 2 195 à 2 483 px à
  390 px de large (+13 %), de 2 164 à 2 311 px sur ordinateur (+7 %).
- Sur mobile, une recherche enrichie montre son premier lieu **plus bas** qu'en V3.1 (nom à 764 px
  contre 711 à 390 × 844) : le titre-phrase est plus long que l'ancien titre-Projet. Il reste au-dessus
  du pli. Sur ordinateur, c'est l'inverse (653 contre 782 px).
- Les surtitres de 13,5 px repèrent moins vite que les titres de la V3.1 quand on fait défiler une
  longue page : on y gagne la parenté, on y perd du balisage.
- L'emblème de 46 px sur les tuiles est petit : ses graduations se voient, son carré pointillé à peine.
  Il dit « analysé » ou « pas analysé », guère plus.
- La légende de la fiche (« à gauche… le trait… en marge… ») est une explication de l'interface ; si
  elle est nécessaire, c'est que la composition ne parle pas seule. À vérifier avec trois personnes.

**Ce qui doit rester différent entre rapport et centre.** Le verdict, la balance en bande et la règle du
temps restent au rapport ; les tuiles, les gestes, la rangée du point et les états de connaissance
restent au centre. Copier la plaque de verdict sur l'accueil du centre aurait été le contresens à
éviter : il n'y a pas de verdict de recherche.

**Ce que je n'ai pas fait, ou mal.**
- La **reconstitution** du rapport est la mienne, pas le composant de production : elle peut différer
  du vrai FUT-91 sur des détails (espacements de la plaque, colonne d'appui absente). La planche les met
  côte à côte pour cette raison.
- La **règle par critère** de FUT-22 est décrite, pas montrée (la montrer sur des données fictives
  laisserait croire qu'elle existe dans le moteur).
- La **règle du temps** n'entre pas dans le centre ; l'histoire d'un lieu (repliée) serait sa place
  naturelle. Non tenté, pour ne pas multiplier les objets.
- Les **formulaires** (note, écarter) restent encadrés : le canon n'a pas encore de composant « champ ».
- Les pistes gardent une **ligne** entre les deux marques. Elle ne mesure rien (positions fixes,
  coupure au milieu), mais une ligne évoque une distance. C'est le point de la comparaison que je
  surveillerais le plus en test.
- Safari, lecteur d'écran, écran non Retina : non vérifiés.

## 11. Décisions qui vous reviennent

| # | Décision | Ma recommandation |
| --- | --- | --- |
| **X1** | La continuité visée suppose que Ma décision passe au Relevé (`DECISION_RELEVE`). L'ordre : activer le Relevé avant, ou en même temps que, le centre de décision ? | avant : sinon le centre ressemblerait plus au dossier que le dossier lui-même |
| **X2** | W3 : retenir la variante B (forme à l'encre, trait de registre) | **B** (§ 4) |
| **X3** | Le lieu **enregistré** n'existe pas dans le produit. Le stocker : localement d'abord (aucune migration, perdu en changeant d'appareil), ou dans une table (migration, décision de données) ? | à trancher avec FUT-49 en tête, sans le présupposer ; un stockage local suffit pour tester le parcours |
| **X4** | Réutiliser l'**analyse de commune** d'un dossier d'adresse pour un autre lieu de la même commune (le droit existe déjà, la réutilisation de l'artefact non) | oui, si le produit confirme que l'artefact communal est le même ; à vérifier dans le code des dossiers |
| **X5** | Graphie : « votre projet » (rapport) ou « votre Projet » (centre) | une seule, dans FUT-118 ; je pencherais pour la majuscule, qui en fait un objet que l'on retrouve |
| **X6** | Un seul mot : « À contrôler » (rapport) ou « À vérifier » (centre) | « À vérifier », plus courant, à reporter au rapport |
| **X7** | Citer, en tête de la fiche d'un lieu analysé, la phrase de conclusion de son dossier, mot pour mot | oui, en une ligne, avec sa date |
| **X8** | Contrat de comparabilité par critère (FUT-22) et ajout de `CadreDuCritere` au schéma de l'artefact, à terme | oui, en deux temps : la règle d'abord, le schéma ensuite |
| **X9** | « Faire le point » recalculé à chaque ouverture, sans cache ; empreinte seulement pour un point daté ou une version rédigée | oui |
| **X10** | Mener le protocole à trois personnes avant toute implémentation | oui |

**À proposer à FUT-118** (conventions réellement partagées, rien du métier du centre) :

1. **L'emblème d'un lieu en petit** (40 à 64 px), avec ses trois états de trait, pour toute surface qui
   liste des lieux (centre, Mes biens, comparatif) ;
2. **La marge en ligne sous 900 px** (une ligne mono, sans filet pointillé), pour les surfaces denses ;
3. **Le trait devant le mot** sous une marque de comparaison (variante B), comme application de § 3.3,
   sans exception nouvelle ;
4. **X5 et X6**, la graphie de « Projet » et le mot pour une vérification.

La rangée du point, les états de connaissance et les pistes restent des composants du centre.

## 12. Captures (`captures-v3-2/`)

- `c01` à `c10` : le parcours de continuité depuis le rapport de Port-Anvel ;
- `a01` à `a05` : depuis le dossier du 12 rue des Sternes (dont 390 px) ;
- `e01` à `e06` : états de connaissance (adresse enregistrée, ce que l'analyse apporterait, annonce sans
  adresse, commune connue par l'aperçu, mobile) ;
- `p01` à `p26` : les écrans de la V3.1 refaits en V3.2, pour l'avant / après avec `captures-v3-1/`
  (ordinateur, tablette, 390 et 360 px, sombre et clair) ;
- `w3-*` : les seize vues de W3 (deux communes, deux adresses ; A et B ; sombre et clair ; 1440 et 360) ;
- `planche-parcours.png`, `planche-cote.png`, `planche-w3.png` : la planche ;
- `reference/` : captures réelles copiées de FUT-87, FUT-91, FUT-118 et de la production.
