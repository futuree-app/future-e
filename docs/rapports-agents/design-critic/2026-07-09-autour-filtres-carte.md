# Design Critic — Face « Autour » : filtres + carte interactive ?

Date : 2026-07-09
Question-mère : une carte interactive + des filtres SERVENT-ILS la décision du lecteur, dans la
voix et la DA de futur•e, ou ajoutent-ils du bruit ?

Fichiers lus : `src/components/report/logement/AutourSection.tsx`,
`docs/vault/modules/logement.md`, `docs/vault/doctrine/design.md`, `docs/vault/doctrine/data.md`,
`/memory/project_module_logement.md`, `/memory/project_comparateur_relation_spatiale.md`,
`docs/rapports-agents/design-critic/2026-07-08-module-logement-design-ui-structure.md`.
Fait technique vérifié : **aucune librairie de carte dans le repo** (pas de leaflet / mapbox /
maplibre dans `package.json`). Une carte serait une dépendance NEUVE et lourde, sans précédent.

---

## Écran

Bloc « Autour de cette adresse » (Face 3), `AutourSection.tsx`, en beat 4 du module Logement
(session payante, grain adresse). Sert le moment « qu'est-ce que j'ai à ma porte sur CE bien ? »
(acheter / renoncer / négocier). Décision éclairée : la vie quotidienne accessible à pied autour
d'un logement qu'on habite ou qu'on vise.

État actuel : une **liste** honnête. Plus proche par catégorie (santé, alimentation, éducation,
transports, services) avec type précis + distance brute à vol d'oiseau ; espace vert le plus
proche (nature précisée) ; intro « les plus proches » (pas « tous »), footer ODbL, mention « à
vol d'oiseau ». Zéro score, zéro adjectif de proximité, zéro couleur alarmiste.

---

## Ce qui fonctionne (à préserver AVANT de vouloir ajouter)

- **La liste actuelle est déjà honnête et décisionnelle.** Elle dit « les plus proches »
  (jamais « tous »), distance à vol d'oiseau assumée, pas de note. C'est un modèle de signal
  propre. Le risque N°1 de ce chantier est de **casser cette honnêteté** en ajoutant un visuel
  qui promet plus que la donnée.
- **Le grain de donnée est le plus-proche-par-catégorie**, pas un recensement exhaustif. C'est
  le bon choix pour décider (« ai-je une pharmacie près ? »), mais c'est exactement ce qui
  interdit une carte de pins (voir Honnêteté du signal).

---

## 1. La carte révèle-t-elle, ou reformate-t-elle de l'inerte ? La ligne avec le comparateur

**Ce n'est PAS le même cas que le comparateur — et c'est un point important.** Le précédent
(carte de communes écartée) reposait sur : « le lecteur sait déjà où sont ses communes, localiser
Rennes est une donnée vraie mais inerte ». Ici, le lecteur **ne sait pas** ce qu'il y a autour
d'un bien qu'il vise. Les points (boulangerie à 55 m, école à 332 m) ne sont pas une redondance
de ce qu'il a en tête. Il y a donc une valeur latente réelle.

MAIS le principe profond du précédent s'applique quand même, et il tranche : **la question n'est
pas « faut-il une carte ? » mais « quelle est la façon la plus rapide de faire SENTIR la relation
spatiale ? »**. Et surtout : une carte ne se justifie que si elle **révèle une configuration que
la liste ne peut pas dire**. Or :

- Ce qu'une carte pourrait révéler légitimement = la **configuration** (tout est au nord, rien
  au sud ; une coupure — rivière, voie rapide — entre le logement et les commerces ; un
  regroupement « centre » vs isolement). Ça, la liste le cache, et c'est un vrai signal de vie.
- Ce qu'une carte ferait à la place, avec la donnée actuelle = **localiser** 5-6 points « les
  plus proches ». C'est-à-dire reproduire la liste sous forme de pins, sans révéler la
  configuration (5 pins ne dessinent pas une couverture). **Donnée inerte reformatée en visuel** :
  le piège exact du comparateur.

**Verdict de la ligne** : une carte sur la donnée d'aujourd'hui retombe dans l'inerte. La seule
carte non-inerte demanderait une donnée de configuration (dispersion, densité, barrières) qu'on
n'a pas et qu'on n'a pas décidé de construire.

## 2. Les filtres : le pattern le plus clairement à rejeter

**Un rapport se lit, il ne se pilote pas.** Des filtres demandent au lecteur de **configurer
l'écran pour révéler** l'information. C'est l'inverse exact de mon verbe « révéler » (l'écran
montre l'essentiel d'emblée). Trois raisons dures :

- **Charge cognitive injustifiée.** L'essentiel est déjà montré : le plus proche par catégorie.
  Cacher des catégories derrière des cases à cocher ajoute une étape de travail pour un gain nul
  (il n'y a que 5 familles + verdure ; tout tient à l'écran sans filtre).
- **Un filtre appelle du volume.** On ne filtre que quand il y a trop. Vouloir des filtres
  trahit une envie sous-jacente d'afficher BEAUCOUP de points (tous les commerces), ce qui nous
  ramène au problème d'exhaustivité (point 4). Le filtre est le symptôme, pas le remède.
- **Aucun précédent maison.** Le rapport futur•e n'a pas d'écran « piloté ». Introduire un
  panneau de contrôle est un langage neuf, à contre-courant de la lecture guidée.

Les filtres sont **du bruit**. C'est l'instinct « ajouter » que je suis là pour contrer.

## 3. Si carte il y avait : quelle forme respecte la voix ?

Par ordre de conformité décroissante :

- **Interactif (pan/zoom/clic) : NON.** C'est un jouet, pas un porteur de décision. Il invite à
  explorer au lieu de décider, il pèse une dépendance neuve, et il est mauvais sur mobile (pins
  denses, gestes qui entrent en conflit avec le scroll de lecture). Anti-sobriété (signature
  n°2), pas dans le design system.
- **Snapshot figé (image statique, illustrative) : à la rigueur, et seulement sous les
  garde-fous du comparateur** — illustre une phrase (jamais autonome), ne vole pas la vedette,
  jamais le cheval de Troie vers l'interactif. Et encore : uniquement si la donnée le rend
  honnête (elle ne l'est pas aujourd'hui, cf. point 4).
- **Rappel** : la primitive spatiale de futur•e n'est PAS la carte. C'est le drawer glissant
  (signature n°5) et la carte-porte. Une carte géographique serait un vocabulaire net-neuf sans
  précédent — exactement ce qu'un contre-pouvoir doit ralentir.

## 4. Honnêteté du signal : le blocage dur

Deux fausses certitudes qu'une carte introduirait sur la donnée actuelle :

- **Fausse exhaustivité.** On calcule le **plus proche par catégorie**, pas l'ensemble. Une
  carte de pins se lit spontanément comme « voici tous les commerces / toutes les écoles ». On
  afficherait une couverture qu'on n'a pas. La liste, elle, dit honnêtement « les plus proches » ;
  la carte casserait précisément cette honnêteté (« la forme sert le fond » — design.md).
- **Fausses routes.** Nos distances sont **à vol d'oiseau**. Une carte invite l'œil à tracer un
  chemin à pied qui n'existe pas (rivière, voie ferrée, dénivelé entre les deux). On sur-affirme
  une accessibilité.
- **Précision à l'adresse.** Un point central épinglé dramatise le grain-adresse alors que toute
  la doctrine data pose « jamais une vérité à l'adresse » et « on ne restitue qu'à l'échelle
  honnête ». (Nuance : le module Logement persiste déjà lat/lon comme artefact ; ce n'est donc
  pas un interdit de stockage, mais l'affichage d'un pin précis reste une dramatisation de
  précision à surveiller.)

## Conformité aux patterns

- **ÉCART fort** si carte interactive : introduit une primitive géographique absente du design
  system, sans précédent, contre la sobriété.
- **ÉCART fort** si filtres : introduit un écran « piloté » dans un produit qui se lit.
- **Précédent comparateur** : la surface spatiale est un problème OUVERT confié au Researcher
  sous la consigne « ne jamais dire carte » (sinon il dessine des cartes). Ce chantier redit
  « carte » : il rouvre par la petite porte une décision de board déjà tranchée côté comparateur.
  À poser au porteur comme cohérence, pas à trancher ici.

## Incohérences visibles

Sans objet (rien à l'écran encore). Note de mobilité : une carte dense serait, elle, une
incohérence de lisibilité visible sur mobile — à vérifier par un test humain de rendu, pas
assertable depuis le code.

## Signalements éditoriaux

- L'intro actuelle « les équipements et repères cartographiés les plus proches » est bien
  calibrée (dit l'échelle, ne promet pas l'exhaustivité). Une carte obligerait à réécrire cette
  honnêteté pour désamorcer l'exhaustivité perçue — signe que le visuel travaille CONTRE le texte.

---

## Verdict : À REVOIR (dans la direction proposée) — et pour les filtres, À REVOIR = rejeter

- **Filtres : rejeter.** Ils inversent le principe « l'écran montre l'essentiel d'emblée », ils
  ajoutent de la charge sans gain (6 familles tiennent à l'écran), et ils sont le symptôme d'une
  envie d'afficher un volume qu'on n'a pas honnêtement.
- **Carte interactive : rejeter dans cette forme.** Dépendance neuve, mobile fragile, invite à
  jouer, et surtout **malhonnête sur la donnée actuelle** (fausse exhaustivité + fausses routes +
  précision dramatisée). Ce n'est pas le trait de futur•e.
- **Ce qui est juste** : la liste actuelle sert déjà la décision honnêtement. Le vrai manque
  n'est pas « une carte », c'est peut-être **la configuration** (tout d'un côté ? une coupure ?),
  que ni la liste ni une carte-de-plus-proches ne disent — et qui demanderait une donnée qu'on
  n'a pas encore décidé de produire.

---

## Version minimale (~90 % de la valeur)

**Garder la liste, ne rien piloter, et si on veut faire sentir la relation spatiale, une LIGNE
déterministe de contexte spatial — pas une carte, pas des filtres.** Exactement la résolution du
comparateur (`spatialContext` : une ligne muted, déterministe, sous la donnée), transposée au
grain adresse. Candidats de signal (à valider côté donnée, je ne code pas) : « Tous les commerces
du quotidien sont à moins de 300 m » / « L'école la plus proche est nettement plus loin que le
reste » / une note de dispersion si les lat/lon des plus-proches la supportent. Ça capte le
gestalt « c'est groupé / c'est dispersé » sans pin, sans dépendance, sans piloter, sans mentir
sur l'exhaustivité. Coût quasi nul, honnêteté préservée.

Si le porteur veut absolument une surface visuelle un jour : la traiter comme le problème OUVERT
du comparateur (confié au Researcher, « représentation mentale de la relation », jamais « carte »),
avec les garde-fous : illustrative jamais analytique, illustre une phrase, snapshot figé jamais
interactif, et **d'abord** une donnée de configuration honnête (pas le plus-proche-par-catégorie
reformaté).

---

## Cohérence (tensions posées au porteur, non tranchées)

- **Ré-ouverture d'une décision de board.** La carte a été écartée côté comparateur ; ce chantier
  la rouvre pour Logement. Le cas est différent (grain fin, points non connus du lecteur), donc
  ce n'est pas automatiquement le même verdict — mais la réouverture doit être consciente, pas
  subie. À arbitrer par le porteur, pas par moi.
- **Configuration comme vraie valeur manquante.** S'il y a un signal spatial que la liste ne dit
  pas, c'est la configuration (direction / coupure / regroupement). C'est une décision DONNÉE
  (faut-il la produire ?) avant une décision DESIGN. À poser au Data Curator / porteur.

## Mise à jour de l'inventaire (prêt à écrire par Claude principal)

1. **Pattern à graver** : « Filtres dans un rapport = anti-pattern. Le rapport se lit, il ne se
   pilote pas ; l'écran montre l'essentiel d'emblée. Un filtre est le symptôme d'un volume qu'on
   ne devrait peut-être pas afficher. »
2. **Extension du précédent carte** : « La carte de points autour d'une adresse n'échappe au
   piège “donnée inerte” du comparateur que si elle révèle la CONFIGURATION (dispersion,
   coupures), pas la localisation. Sur une donnée de plus-proche-par-catégorie à vol d'oiseau,
   une carte de pins ment (fausse exhaustivité + fausses routes) : elle est inerte ET
   malhonnête. Surface spatiale au grain fin = même problème ouvert que le comparateur, mêmes
   garde-fous (illustrative, figée, jamais autonome), et d'abord une donnée de configuration. »

## Quand rouvrir ce sujet

- Si une **donnée de configuration honnête** apparaît (couverture réelle, barrières, dispersion
  calculée) : la carte-snapshot redevient discutable — mais toujours figée, illustrative,
  non pilotée.
- Si des retours utilisateurs montrent que la liste **cache** un fait spatial décisif (« je n'ai
  pas vu que tout était de l'autre côté de l'autoroute ») : rouvrir, en priorité par la LIGNE
  déterministe, la carte en dernier recours.
- Si le Researcher aboutit sur « représentation mentale de la relation » avec une forme validée
  par board : réévaluer la forme retenue (pas forcément une carte).
- Si le porteur tranche d'introduire une dépendance cartographique pour un autre usage : le coût
  d'entrée disparaît, une partie de mon objection technique tombe (restent honnêteté + pilotage).
