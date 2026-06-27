# Rapport Product Strategist — limites PRODUIT/UX du test réel Brest vs Lorient

> Source : `docs/rapports-agents/_sources/2026-06-27-conversation-brest-lorient.md` (sections
> « Limites PRODUIT / UX » + « Insights méta »). Terrain relu : `vision/archetype-lecteur.md`,
> `vision/positionnement.md`, `doctrine/positionnement.md`, `principes/invariants.md` (n°1, n°2,
> n°5), arbitrages `comparateur-un-moteur-trois-portes`, `comparateur-communes-retrograde`,
> `mode-foyer-recadre`, `carte-exploration-probleme-ouvert` ; code réel
> `src/app/(public)/comparateur/page.tsx`, `ModeChoixSearch.tsx`, `ModeChoixSynthese.tsx`.

## Lecture d'ensemble : un seul fait domine le test

Le test ne révèle pas « 6 features manquantes ». Il révèle **une nature** : la décision de vie
est un **fil itératif** (région → finalistes → départage → visite), pas une requête. Mes 6 pistes
ne sont pas 6 produits à construire, ce sont 6 endroits où le produit casse le fil. La bonne
réponse à la plupart n'est pas « un module de plus », c'est « relier mieux ce qui existe ». Mon
réflexe par défaut tient : **le meilleur produit ici est surtout celui qu'on ne construit pas**.

Une seule piste mérite vraiment du code neuf (la 3). Deux sont des reformulations à faible coût
(2, 6). Trois sont des besoins réels dont la **surface autonome n'est pas mûre** et qui ont déjà
un réceptacle dans le vault (1, 4, 5). Je hiérarchise par valeur/effort à la fin.

---

## Piste 3 — Synthèse centrale / verdict de SEUIL (la plus haute valeur du lot)

**L'idée.** Rendre la synthèse plus centrale : le couple voulait un verdict (« est-ce
invivable ? »), pas des nombres. La valeur émotionnelle s'est cristallisée dans la phrase
(« si La Rochelle est vivable, Lorient l'est confortablement »).

**Le vrai besoin.** Exactement le cœur de l'archétype : *« la tranquillité de décider sans
l'impression d'avoir oublié l'essentiel »*, *« être en paix avec une décision qu'il vivra vingt
ans »*. Le vrai achat est émotionnel, donné par la rigueur. Ce besoin n'est pas un caprice
d'UX, c'est la promesse fondatrice.

**Le piège, et la distinction qui sauve tout.** Le narratif IA de synthèse qui *dénouait* le
choix a déjà été **retiré le 2026-06-27** (board, voir commentaire dans `ModeChoixSynthese.tsx`)
parce qu'il « tranchait gratuitement à la place du lecteur » et cannibalisait le Pack. Et
l'invariant n°1 interdit de décider à la place. Donc « rendre la synthèse centrale » est un piège
SI on entend « verdict de choix ». La distinction décisive :
- **Verdict de SEUIL / vivabilité (absolu, factuel)** : « tout est au-dessus du seuil OMS »,
  « Lorient est confortablement vivable ». Il **rassure sans choisir** entre les finalistes.
  Légitime, central, et c'est précisément ce qui a soulagé le couple. Cohérent invariant n°2
  (palier absolu, pas classement).
- **Verdict de CHOIX (« prenez Lorient »)** : interdit (invariant n°1), et c'est ce qui a été
  retiré à juste titre.

**Valeur / coût.** Valeur émotionnelle maximale, c'est le moment où le produit *tient sa
promesse*. Coût de complexité faible côté périmètre (la surface existe déjà), le coût est
éditorial : tenir la ligne seuil-oui / choix-non sans glisser. C'est du ressort de l'**Editorial
Writer** (la voix du verdict) et du **Design Critic** (sa centralité à l'écran) — je borde le
quoi, pas le comment.

**Différenciation.** Un comparateur immobilier ne dira jamais « c'est vivable, voici pourquoi le
cliché est faux ici » : il note, il ne rassure pas sur un seuil absolu sourcé. Le verdict de seuil
honnête est un actif de moat, pas seulement une richesse.

**Hypothèse porteuse de mon verdict.** Je crois que *ce qui rassure n'est pas le choix fait à la
place du lecteur, mais le cadrage absolu (« vous n'êtes pas en train de vous tromper de seuil »)*.
Si c'était faux — si le lecteur voulait vraiment qu'on tranche — alors le retrait du narratif
était une erreur. À départager sur données une fois le funnel instrumenté.

**Tension avec le Business.** Frontale et saine. Moi : le verdict de seuil doit arriver TÔT et
gratuitement, c'est la promesse. Lui : la cristallisation émotionnelle est ce qui se paie (raison
du retrait du narratif). Arbitrage à nommer au board : *jusqu'où le gratuit rassure-t-il avant de
cannibaliser le Pack ?* Ma position : le verdict de **seuil** (vivable/pas vivable, absolu) est
gratuit et dû ; le verdict d'**arbitrage** détaillé (le départage critère par critère) reste payant.

**Verdict : CONSTRUIRE**, avec garde-fou strict (seuil oui, choix non). Priorité 1.

---

## Piste 2 — Set de comparaison « fluide » (le piège du N grand)

**L'idée.** Le set a bougé sans cesse (3→4→5, ajout/retrait Bordeaux, La Rochelle). Le
comparateur est figé N∈{2,3}. Rendre le set fluide.

**Le vrai besoin — et ce qu'il n'est PAS.** Le besoin réel est de **permuter sans recommencer**
(retirer Bordeaux, glisser La Rochelle) en gardant le fil. Ce n'est **pas** d'afficher 5 colonnes.
Le « 3 » a déjà été tranché (`comparateur-un-moteur-trois-portes` : *« le 3 n'était qu'une
architecture ; la paire suffit à révéler un compromis »*). Au-delà de 3 colonnes, la matrice
d'arbitrages redevient un **tableau de comparaison scoré** — exactement le `communes_tension`
rétrograde qu'on a tué (`comparateur-communes-retrograde`, invariant n°2). 5 villes côte à côte =
glissement vers le SIG/dashboard que le positionnement refuse.

**La vraie forme du besoin.** Fluidité d'**édition** du set, pas élargissement de l'**affichage**.
Le code a déjà `addSlot`/`removeSlot` (`ModeChoixSearch.tsx`) : le squelette existe. Ce qui manque
n'est pas des colonnes, c'est la **persistance du set** et la facilité de swap (le « fil »).

**Version 10× plus simple.** Garder le verdict à N≤3, mais rendre l'ajout/retrait/permutation
trivial et **conserver le set entre deux requêtes** (relié à la piste 5). Refuser N>3 à l'affichage.

**Différenciation.** Neutre. La fluidité d'édition ne creuse pas le moat, mais elle ne l'érode pas
non plus si elle reste sous la discipline du trio. Au-delà, elle l'érode (banalisation en tableur).

**Hypothèse porteuse.** Je crois que *la discipline du trio est ce qui transforme une comparaison
en arbitrage* ; l'élargir, c'est troquer la transformation (« comprendre les compromis ») contre
une capacité de tableur. Si on apprenait que les lecteurs abandonnent faute de pouvoir poser 5
villes, je réviserais — mais alors la réponse serait des départages successifs en cascade, pas 5
colonnes.

**Tension avec le Business.** Il pourrait lire « plus de villes = plus de valeur perçue / plus de
matière à vendre ». Je dis l'inverse : 5 colonnes **diluent** le verdict et rapprochent du
comparateur banal copiable. À arbitrer.

**Verdict : REFORMULER.** Construire la fluidité d'édition + persistance (faible effort, code à
moitié là), refuser l'élargissement N>3. Priorité 2 (quick win).

---

## Piste 6 — Friction GWL (date 2050 vs +2 °C)

**L'idée.** Afficher 2030/2050/2100 pour +1,5/+2/+3 °C est lisible mais a dû être ré-expliqué.

**Ma lentille.** C'est d'abord un problème **pédagogique d'interface** — terrain du **Design
Critic** (le comment de l'écran) et de l'**Editorial** (la formulation). Par ma seule lentille
produit : afficher une DATE pour masquer un niveau de réchauffement frôle l'invariant n°5 (ne
jamais surpromettre la précision, distinguer le projeté). La date est une commodité de lisibilité ;
le GWL est la vérité. **Montrer les deux**, ne jamais cacher le GWL derrière la date.

**Verdict : PASS (renvoi).** Faible coût de périmètre, ce n'est pas un arbitrage de valeur. Ma
seule exigence : honnêteté du signal (les deux visibles). Je renvoie le « comment » au Design
Critic et à l'Editorial. Priorité 3 (correction simple, hors de mon mandat principal).

---

## Piste 1 — Moteur « communes similaires à X » (besoin réel, surface autonome non mûre)

**L'idée.** « Trouve des villes proches de Brest » ; le porteur a fabriqué une heuristique à la
main (55 % services / 45 % douceur climatique). Proposé comme **4e porte** de milieu de parcours.

**Le vrai besoin.** Le segment **« j'ai un ancrage, pas une liste »** : Brest me plaît, élargis
mon champ sans me faire repartir de zéro. Ce segment est déjà identifié, noir sur blanc, dans
`carte-exploration-probleme-ouvert` (angle mort #2 : « j'ai une direction, pas une commune »), et
la forme « communes groupées par parenté de profil » y est listée comme piste Researcher
(**constellation, territoires-jumeaux**), NON VÉRIFIÉE.

**Pourquoi PAS une 4e porte maintenant.** « Similaire » est un piège doctrinal. Similaire sur
quels axes ? L'heuristique 55/45 fabriquée à la main est une **fausse objectivité** : agréger
des dimensions pour produire un classement de proximité, c'est un **score synthétique caché**
(invariant n°2, le motif exact qui a fait écarter la choroplèthe nationale). « Similaire en
général » est creux ; la seule forme honnête est « similaire **selon ce qui compte pour toi** » —
or ça, c'est déjà ce que fait `/ou-vivre`.

**La vraie forme décisionnelle.** Ce n'est pas un 4e moteur, c'est **`/ou-vivre` amorcé par une
commune-ancre** au lieu de préférences vierges : « à partir de Brest, montre des communes qui
partagent ce que tu y aimes ». Même moteur, nouvelle amorce. C'est cohérent avec
`comparateur-un-moteur-trois-portes` (un seul moteur) et ça évite le score caché.

**Différenciation.** C'est le candidat moat le plus fort du lot SI bien fait : une similarité
**pilotée par le moteur de compatibilité** (climat futur, risques invisibles) est **incopiable**
par un portail immobilier (qui ferait « même prix / même région »). Mais mal fait (heuristique
opaque), c'est juste un tableur de proximité copiable.

**Hypothèse porteuse.** Je crois que *le choix du territoire d'ancrage prime, et que « similaire »
sans axe explicite trahit le lecteur en agrégeant à sa place*. Si le segment « ancrage sans
liste » s'avérait majoritaire (à mesurer), la priorité monterait — mais la réponse resterait
« ou-vivre amorcé par une ancre », pas un moteur de similarité opaque.

**Ce qu'on ne sait pas.** Le segment « ancrage sans liste » est-il significatif ? (PostHog :
usage de « quitter X » ; sonde.) Question déjà posée dans `carte-exploration-probleme-ouvert`.

**Verdict : REFORMULER + DIFFÉRER.** Le besoin est réel, la surface autonome ne l'est pas (ma
signature). Ne pas construire un « moteur de similarité ». Hypothèse parquée : **brancher sur le
problème ouvert Researcher (constellation / territoires-jumeaux)** plutôt que rouvrir un chantier.
Déclencheur de réévaluation : *le jour où l'exploration spatiale redevient prioritaire (après la
preuve du paiement B2C) ET où PostHog confirme le segment ancrage-sans-liste*. Priorité 4.

---

## Piste 4 — Décision à DEUX (couple)

**L'idée.** « Ma conjointe et moi », préférences qui divergent, peser ensemble. Objet possible
« notre arbitrage » partagé.

**Le vrai besoin, et son réceptacle existant.** Le besoin (deux jeux de préférences en tension)
est réel et fréquent (couple CSP+, achat à deux). Mais il a **déjà un réceptacle parqué** :
`mode-foyer-recadre` redéfinit le mode Foyer autour des **comptes multi-personnes et comparatifs
nourris par les données du foyer**, explicitement « feature future, pas l'enveloppe payante ».

**Pourquoi PAS maintenant.** « Objet notre arbitrage partagé » (comptes synchronisés, deux
profils, pondération collaborative) est la **fonctionnalité séduisante mais creuse** type : elle
impressionne, alourdit lourdement (auth, partage, état), et n'attaque pas le goulot (le paiement
B2C solo n'est même pas prouvé). On fabriquerait une surface avant d'avoir la preuve du besoin
simple.

**Version 10× plus simple.** `/ou-vivre` permet déjà d'exprimer des préférences ; un couple peut
faire deux passes et confronter. Le minimum honnête serait de pouvoir exprimer une **tension**
dans UN set (« lui : la mer ; elle : l'emploi ») — une pondération, pas un système de comptes.

**Hypothèse porteuse.** Je crois que *le frein à l'achat n'est pas l'absence d'objet collaboratif,
mais le consentement à payer non prouvé même pour un décideur seul*. Construire le couple avant ça,
c'est ranger les chaises avant de savoir s'il y a une fête.

**Ce qu'on ne sait pas.** Les sessions sont-elles réellement à deux ? (À instrumenter.) Les
préférences divergent-elles assez pour justifier deux profils, ou une pondération de tension
suffit-elle ? (Sonde.)

**Verdict : DIFFÉRER.** Besoin réel, surface autonome non mûre, réceptacle déjà acté (Foyer). Ne
rien construire. Déclencheur : *paiement B2C solo prouvé + observation que les sessions sont à
deux*. Priorité 5.

---

## Piste 5 — Le parcours est un ENTONNOIR / accompagner le fil dans la durée

**L'idée.** Région d'envie → finalistes → départage → préparation de visite. futur•e a des portes
mais répond par requêtes ponctuelles ; la valeur tenait au FIL narratif.

**Ce que c'est vraiment.** Pas une feature : un **principe de conception**. La continuité est déjà
dans l'archétype (« le climat de sa vie n'est plus un sujet oublié », ce que le lecteur paie =
« la continuité d'un suivi »). C'est cohérent vision, et c'est le diagnostic le plus profond du
test.

**Le piège.** « Accompagner le fil » peut devenir un « compagnon de parcours » / workspace /
compte sauvegardé : lourd, couteau suisse, et hors goulot. C'est la complexité non gagnée type.

**La vraie forme.** Le fil se construit en **reliant mieux les 3 portes existantes** (découverte →
départage → Pack → visite), pas en ajoutant une surface « mon parcours ». Le Pack se garde déjà
(rapport interactif). Le morceau le plus concret du fil est la **persistance du set** (piste 2) et
le **chaînage des portes**. Le moment où le produit passe la main à la visite physique (« passez
une soirée dans chaque centre ») doit être assumé comme **signature de positionnement**, pas comme
un aveu — c'est cohérent avec « on dit ce qu'on ne sait pas » (invariant n°3) et avec « la
décision, pas la compréhension ».

**Verdict : REFORMULER en doctrine de parcours**, pas en module. Matière pour
`/memory/parcours_doctrine` et `doctrine/`. DIFFÉRER toute surface dédiée « mon espace ». La piste
2 en est la première brique concrète. Priorité transverse (cadre les autres plus qu'elle ne se
construit).

---

## Hiérarchie par valeur / effort

| # | Piste | Verdict | Valeur | Effort | Priorité |
|---|-------|---------|--------|--------|----------|
| 3 | Synthèse = verdict de SEUIL | CONSTRUIRE (garde-fou seuil≠choix) | Très haute (cœur émotionnel) | Moyen | **1** |
| 2 | Fluidité d'ÉDITION du set (pas N grand) | REFORMULER | Moyenne | Faible (code à moitié là) | **2** |
| 6 | GWL date vs °C | PASS → Design/Editorial | Faible (honnêteté) | Très faible | **3** |
| 1 | « Communes similaires » | REFORMULER + DIFFÉRER | Haute si bien fait | Élevé | **4** |
| 5 | Le fil / entonnoir | REFORMULER en doctrine | Structurante | — (principe) | transverse |
| 4 | Décision à deux | DIFFÉRER (réceptacle Foyer) | Réelle, prématurée | Très élevé | **5** |

## Victoires produit (complexité évitée, à graver le cas échéant)

- **Pas de moteur de similarité autonome** : on évite une fausse objectivité (heuristique opaque =
  score caché, invariant n°2) et un 4e moteur. Le besoin est reformulé en « ou-vivre amorcé par
  une ancre » et renvoyé au problème ouvert Researcher déjà en cours.
- **Pas de comparateur à N grand** : on protège la discipline du trio (révélateur d'arbitrages) et
  on évite la rechute dans le tableau scoré rétrograde.
- **Pas d'objet collaboratif couple maintenant** : réceptacle déjà parqué (Foyer), goulot pas
  atteint. Surface séduisante mais creuse écartée.
- **Pas de surface « mon parcours »** : le fil se tisse en reliant l'existant, pas en ajoutant un
  workspace.

## Tensions avec le Business (matière de board, non tranchées)

1. **Verdict de seuil gratuit (moi) vs cristallisation payante (lui)** — piste 3. Où s'arrête le
   gratuit qui rassure avant de cannibaliser le Pack ? Ma ligne : seuil/vivabilité absolue = dû et
   gratuit ; arbitrage détaillé = payant.
2. **Discipline du trio (moi) vs « plus de villes = plus de valeur perçue » (lui)** — piste 2.
3. **Sobriété / différer le couple (moi) vs Foyer comme produit d'abonnement (lui)** — piste 4.

## Mises à jour de doctrine proposées (à écrire par Claude principal)

- Nouvel arbitrage `arbitrages/synthese-verdict-de-seuil.md` : la synthèse peut rendre un verdict
  de **seuil/vivabilité absolu** (rassure), jamais un verdict de **choix** (invariant n°1) ;
  trace la frontière, cite le retrait du narratif du 2026-06-27.
- `/memory/parcours_doctrine` + `doctrine/` : graver « le parcours est un entonnoir ; chaque porte
  laisse un fil vers la suivante ; passer la main à la visite physique = signature, pas aveu ».
- Étendre `carte-exploration-probleme-ouvert` : y rattacher explicitement la piste « communes
  similaires » comme reformulation « ou-vivre amorcé par une ancre » du segment ancrage-sans-liste.
- `modules/comparateur.md` : noter la fluidité d'édition du set (persistance, swap) sous la
  contrainte N≤3 à l'affichage.

## Les quatre questions de clôture

1. **Si on reconstruisait futur•e aujourd'hui, construirait-on encore ça ?** Le verdict de seuil
   (3) : oui, sans hésiter, c'est la promesse. Le moteur de similarité, le couple, le N grand :
   non, pas à ce stade — on construirait d'abord le fil et la preuve de paiement.
2. **Qu'est-ce qu'on perd à supprimer chaque piste ?** Supprimer 3 = on perd le moment où le
   produit tient sa promesse émotionnelle (inacceptable). Supprimer 1/4/5 maintenant = on ne perd
   rien d'actif, on parque des hypothèses avec leur déclencheur (les besoins restent au vault).
3. **Version 10× plus simple ?** Oui pour presque tout : 2 = persistance + swap (déjà à moitié) ;
   1 = ou-vivre amorcé par une ancre, pas un moteur ; 4 = une pondération de tension dans un set,
   pas des comptes ; 5 = relier les portes, pas un workspace. La 3 est déjà la version simple.
4. **Plus difficile à copier, ou seulement plus riche ?** Le verdict de seuil honnête (3) et la
   similarité pilotée par le moteur (1, si jamais) creusent le moat. Le N grand (2 mal fait) et le
   couple (4) ne font qu'enrichir — donc à tenir sous discipline.

## Si j'étais le gardien du produit

Je construirais **une seule chose** : le verdict de seuil (vivable / pas vivable, absolu, sourcé),
en interdisant qu'il choisisse à la place du lecteur. Je rendrais l'édition du set fluide sans
jamais dépasser trois colonnes. Et je ne construirais **ni** le moteur de similarité, **ni**
l'objet couple, **ni** un espace de parcours : je relierais mieux les trois portes que j'ai déjà,
et je garderais ces trois besoins au vault comme hypothèses parquées, à rouvrir le jour où le
paiement B2C est prouvé.
