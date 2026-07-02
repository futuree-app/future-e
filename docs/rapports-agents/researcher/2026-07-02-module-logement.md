# Ouverture (divergence) — Module Logement

> Agent Researcher. Divergence, NON VÉRIFIÉ par construction. Je ne filtre pas, je ne classe
> pas par qualité, je ne désigne pas de gagnant. Handoff obligatoire : Data Curator (sélection)
> puis board/porteur. Toute conclusion « la question est mal posée » remonte au porteur, pas au
> Data Curator.
> Date : 2026-07-02. Terrain lu : `_contexte-module-logement-2026-07-02.md`, `LogementModule.tsx`,
> invariants, archétype-lecteur, arbitrages (loisirs, comparateur), donnée ONRN sécheresse prête.

---

## Le problème, recadré en question créative

Le brief pose : « quelles données brancher pour fonder la vulnérabilité et la valeur d'un bien ? ».
La contrainte la plus féconde du vault n'est pas une donnée manquante, c'est une **interdiction** :
on ne valorise pas (invariant 2, pas de score/note), on ne surpromet pas la précision
(invariant 5), on ne monétise pas via l'assurance ou l'immobilier (invariant 7), on éclaire sans
décider (invariant 1). Le hero actuel met en avant les deux briques les plus spéculatives
(« Pression d'assurance », « Valeur à 20 ans ») produites par des heuristiques sur des labels.

Retournée en générateur :

> **Quelle lecture du COÛT et de la VALEUR d'un bien dans le temps fonctionne sans jamais afficher
> un prix, une note, ni orienter vers un vendeur ? Autrement dit : comment rendre visible ce que
> le prix affiché cache, sans prétendre le rechiffrer ?**

Corollaire, à partir de la donnée déjà prête (ONRN sécheresse : coût moyen + fréquence + repré-
sentativité, en tranches) : **et si le risque n'était pas une étiquette d'aléa mais un coût
annualisé ressenti — un « loyer du risque » que personne ne facture mais que tout le monde paie ?**

---

## Et si je jetais la question ?

Trois questions alternatives que le chantier devrait peut-être poser à la place :

1. **« Adresse d'abord » ou « verbe d'abord » ?** Le parcours part d'une adresse tapée = le bien.
   Mais un conseiller humain demande toujours d'abord ce qu'on veut FAIRE : acheter, louer,
   rénover, rester, revendre. La donnée pertinente n'est pas la même selon le verbe. La question
   n'est peut-être pas « que devient ce bien ? » mais « que veux-tu faire, et qu'est-ce que tu ne
   vois pas dans ce geste ? ».

2. **Le module Logement doit-il exister séparé de Territoire ?** (Question qui remonte au board.)
   Territoire s'est enrichi (identité, bande CatNat, relation résidence/découverte, synthèse
   hiérarchisée). Logement, c'est le MÊME lieu vu depuis « je possède un mur ici » au lieu de « je
   vis ici ». Peut-être Logement n'est pas un module mais une **lentille/un zoom** posé sur
   Territoire. L'arbitrage loisirs (« pas de module autonome faute de masse critique de données
   propres ») est un précédent de direction, pas une interdiction.

3. **Le sujet est-il le mur, ou le ménage ?** « La vulnérabilité du bien » suppose que la
   vulnérabilité est une propriété du bâti. Mais le même choc sécheresse ruine un propriétaire
   modeste et égratigne un aisé. La question déplacée : « ce projet est-il soutenable pour CE
   ménage, pas seulement solide pour ce bâti ? » (à manier : frôle le jugement social,
   invariants 1 et 2).

---

## Les paradigmes (la carte)

- **A. Le bien comme actif dans le temps** — rendre visible le coût de possession futur (travaux
  imposés, prime, énergie, loyer du risque) sans jamais afficher un prix de marché.
- **B. Le verbe avant le bien** — le module part du projet (acheter/louer/rénover/rester/revendre) ;
  la même donnée se réordonne derrière le geste.
- **C. Le logement comme corps exposé** — le physique, sensible : la maison qui fissure, le gaz du
  sous-sol, l'eau qui monte, l'été 2050 invivable. Raconter la sensation, pas le code d'aléa.
- **D. Logement ⊂ Territoire** — pas un module séparé mais une focale/preuve locale sur le lieu.
- **E. Le ménage, pas le mur** — l'exposition croisée à la capacité d'encaisser ; l'assurabilité
  réelle sans vendre d'assurance ; le geste plutôt que le verdict.

---

## Le menu (20 pistes)

### Paradigme A — Le bien comme actif dans le temps

**A1. Le « loyer du risque » annualisé.**
Transformer la donnée ONRN (coût moyen d'un sinistre sécheresse × fréquence) en un ordre de
grandeur : « statistiquement, un bien comme celui-ci sur ce sol paie tant de risque par an sans
que ce soit une ligne sur une facture ».
- *Intéressant* : mécanisme actuariel de l'assureur, importé et retourné au lecteur ; rend
  tangible un coût invisible ; s'appuie sur une donnée déjà corrigée et prête.
- *Hypothèse remise en cause* : « on ne peut pas parler d'argent sans valoriser le bien ».
- *Étiquettes* : `dangereusement séduisante`, `dépend d'une donnée à valider` (tranches larges
  « 10-20k€ » / « 2-5 ‰ »), `remet en cause l'invariant n°5`.
- *Contrainte aval* : ne jamais afficher un € faux-précis ; gater par la représentativité ;
  ordre de grandeur, pas chiffre.

**A2. Le « mur de dépenses » à 20 ans.**
Une frise des dépenses quasi-certaines et imposées : échéances d'interdiction de location DPE
(2025 G, 2028 F, 2034 E), ravalement obligatoire, hausse de franchise CatNat, travaux post-RGA.
- *Intéressant* : ce n'est pas du pronostic, c'est du calendrier légal déjà écrit. Le certain
  déguisé aujourd'hui en incertain.
- *Hypothèse remise en cause* : « la valeur future = spéculation, donc on n'en parle pas ».
- *Étiquettes* : `contre-intuitive`.
- *Contrainte aval* : séparer nettement l'obligation légale (dure) de la projection (molle).

**A3. Coût total de détention plutôt que prix.**
Reframer « Valeur » en « ce que ce bien va vous coûter » : achat + travaux imposés + assurance +
énergie (DPE). La valeur devient un flux de sorties, pas un stock à estimer.
- *Intéressant* : contourne l'interdit de valorisation en changeant de question ; c'est ce que le
  lecteur vit vraiment (invariant 4 : la donnée sert une décision).
- *Hypothèse remise en cause* : « le lecteur veut savoir combien ça vaut » (il veut surtout savoir
  combien ça va lui coûter de le garder).
- *Étiquettes* : aligné marque.

**A4. Le DPE comme dette, pas comme étiquette.**
Traduire F/G non en confort/conso mais en euros de travaux à horizon + date-couperet d'interdiction
de louer. À moitié déjà là, à radicaliser.
- *Intéressant* : le DPE cesse d'être une info de plaquette, devient une échéance qui pince.
- *Hypothèse remise en cause* : « le DPE parle de performance énergétique » (il parle surtout de
  légalité future du bien).

**A5. La décote de revente, en fait national situé, jamais en prédiction.**
Au lieu d'un % inventé sur CE bien : « les biens F/G se revendent en moyenne X% sous le marché
(valeur verte notaires / DVF) ». Un fait agrégé qui éclaire, pas un verdict sur l'adresse.
- *Intéressant* : donne une prise chiffrée sans violer l'interdit d'estimer le bien.
- *Hypothèse remise en cause* : « chiffrer la valeur = trahir l'invariant 2 » (le fait national
  n'est pas une note du bien).
- *Étiquettes* : `dépend d'une donnée à valider` (valeur verte notaires), `remet en cause
  l'invariant n°5` si mal cadré.
- *Contrainte aval* : fait agrégé national ≠ ce bien ; ne jamais projeter le % sur l'adresse.

### Paradigme B — Le verbe avant le bien

**B6. Le module part d'un verbe.**
Écran d'entrée : « J'achète / Je loue / Je rénove / Je reste / Je revends ». Le verbe filtre et
réordonne la même donnée (un locataire n'a pas de « valeur à 20 ans », un revendeur oui).
- *Intéressant* : c'est exactement ce qu'un conseiller humain demande en premier ; recentre sur le
  moment (archétype : « le déclencheur est un moment, pas une catégorie »).
- *Hypothèse remise en cause* : « adresse d'abord = le bien d'abord ».
- *Contrainte aval* : Product veillera à la complexité (5 verbes = 5 lectures à tenir).

**B7. Mode « avant d'acheter » = le contre-diagnostic de l'annonce.**
Check-list de ce que l'annonce immobilière ne dit jamais : RGA, radon, DPE réel vs annoncé, PPRN,
IREP/friche à côté. Le module lit le bien qu'on convoite, pas seulement celui qu'on possède.
- *Intéressant* : capte le moment le plus chaud (portail immobilier ouvert = déclencheur archétypal).
- *Hypothèse remise en cause* : « le lecteur logement possède déjà son bien ».
- *Étiquettes* : aligné marque (« qu'est-ce que je risque d'oublier ? »).

**B8. Mode « je reste et j'encaisse ».**
Pour le propriétaire installé et captif : pas « revendre » mais « qu'est-ce que la loi va m'imposer,
ma prime va-t-elle grimper, ma maison va-t-elle travailler ? ».
- *Intéressant* : sert la majorité silencieuse (déjà propriétaires) que le cadrage acheteur oublie.
- *Hypothèse remise en cause* : « le lecteur logement est un acheteur en mouvement ».

**B9. Servir le locataire.**
Un locataire n'a ni valeur ni revente, mais un DPE (charges/confort), un risque santé (radon,
humidité), une exposition. Tout autre module.
- *Intéressant* : rupture de cible ; le logement n'est pas que de la propriété.
- *Hypothèse remise en cause* : « logement = patrimoine du propriétaire CSP+ ».
- *Étiquettes* : `contre-intuitive`, `éloignée de la marque` (cible actuelle).

### Paradigme C — Le logement comme corps exposé

**C10. La maison qui fissure (RGA rendu sensible).**
Raconter le retrait-gonflement des argiles : « sur ce sol, en été de plus en plus sec, une maison
individuelle travaille, fissure, et la réparation coûte cher ». ONRN sécheresse = la fréquence et
le coût derrière la sensation.
- *Intéressant* : transfère un mécanisme (la sensation physique) là où il n'y a aujourd'hui qu'un
  code Géorisques ; c'est le risque n°1 en coût pour la maison individuelle.
- *Hypothèse remise en cause* : « un risque = une étiquette d'aléa cochée ».
- *Étiquettes* : `dépend d'une donnée à valider` (croiser aléa argile × type bâti maison indiv.).

**C11. Radon à l'adresse (IRSN, potentiel radon commune, catégorie 1/2/3).**
Donnée publique aujourd'hui absente : gaz radioactif du sous-sol, 2e cause de cancer du poumon,
enjeu du logement lui-même.
- *Intéressant* : la santé commence dans la cave, pas dans l'air extérieur ; comble un angle mort.
- *Hypothèse remise en cause* : « la santé est un module séparé / c'est l'air du dehors ».
- *Étiquettes* : `dépend d'une donnée à valider` (granularité commune, frontière avec module Santé).
- *Contrainte aval* : éviter la redondance avec Santé (frontière à trancher).

**C12. Inondation à l'adresse, pas à la commune.**
Dé-binariser : emprise PPRI, TRI/TIM, hauteur d'eau, remontée de nappe (BRGM). Le bien est ou n'est
pas dans l'eau ; la commune ne dit rien.
- *Intéressant* : le grain « adresse » est précisément ce qui distingue Logement de Territoire.
- *Hypothèse remise en cause* : « le risque se lit à la commune ».
- *Étiquettes* : `dépend d'une donnée à valider` (Géorisques adresse déjà partiellement là).

**C13. DRIAS à l'adresse : l'été 2050 de ce logement.**
Croiser projection climatique (jours >35°C, nuits tropicales 2050) × isolation (DPE) = « ce
logement sera-t-il vivable l'été sans clim dans 25 ans ? ».
- *Intéressant* : bascule le DPE de l'hiver (chauffage) vers l'été (surchauffe), le vrai enjeu qui
  monte ; relie deux données (climat × bâti) au lieu de les additionner.
- *Hypothèse remise en cause* : « le DPE parle du froid et du chauffage ».
- *Étiquettes* : `contre-intuitive`, `dépend d'une donnée à valider` (référentiel TRACC à porter).

**C14. Le trait de côte qui recule (Cerema, recul du littoral).**
Pour le littoral : le bien peut disparaître physiquement (érosion, loi Climat-Résilience, communes
listées).
- *Intéressant* : conteste l'idée que le bien est permanent ; spectaculaire donc mémorable.
- *Hypothèse remise en cause* : « un bien immobilier est, par définition, immobile et pérenne ».
- *Étiquettes* : `contre-intuitive`, `dangereusement séduisante`, `remet en cause l'invariant n°6`
  (frôle l'alarmisme, à manier).

### Paradigme D — Logement ⊂ Territoire

**D15. Pas de module séparé : un bouton « je possède un bien ici » sur Territoire.**
Logement devient une posture de lecture du même lieu, sous l'angle patrimoine/coût plutôt que cadre
de vie.
- *Intéressant* : supprime la divergence de forme entre les deux modules à la racine ; réutilise
  identité, bande CatNat, relation, synthèse déjà câblées.
- *Hypothèse remise en cause* : la prémisse du chantier lui-même (« le module doit exister séparé »).
- *Étiquettes* : `remet en cause l'existence du module`.
- *Contrainte aval* : décision structurante → remonte au board/porteur, pas au Data Curator.

**D16. Le rapport à double focale.**
Un seul rapport, deux zooms : le territoire large / mon adresse précise. La relation
résidence/découverte déjà câblée sur Territoire s'étend naturellement au bien.
- *Intéressant* : « relier plutôt qu'additionner » (valeur cardinale de l'archétype).
- *Hypothèse remise en cause* : « deux parcours = deux modules ».

**D17. Le bien comme preuve locale du territoire.**
Le zoom adresse sert à confirmer ou démentir l'affirmation communale : « votre commune est en aléa
argile fort → votre parcelle précisément l'est-elle ? ». Le grain fin comme discipline de preuve
(invariant 3).
- *Intéressant* : le bien gagne une fonction que le territoire n'a pas (vérifier), pas juste
  répéter en plus petit.
- *Hypothèse remise en cause* : « le territoire suffit à situer le risque ».

### Paradigme E — Le ménage, pas le mur

**E18. La vulnérabilité du projet, pas du bien.**
Croiser l'exposition physique × la capacité à encaisser (le même choc RGA ruine un ménage modeste).
Précarité énergétique IRIS déjà en base.
- *Intéressant* : déplace la vulnérabilité du bâti vers le projet vécu ; plus honnête sur ce qui
  fait vraiment mal.
- *Hypothèse remise en cause* : « la vulnérabilité est une propriété du bâtiment ».
- *Étiquettes* : `dangereusement séduisante`, `remet en cause l'invariant n°1/2` (frôle le jugement
  social de la personne).
- *Contrainte aval* : décrire l'exposition, jamais juger le ménage ; grain IRIS ≠ le foyer précis.

**E19. L'assurabilité réelle, sans vendre d'assurance.**
La « donnée manquante » n'est peut-être pas un score d'assurabilité mais le FONCTIONNEMENT du régime :
franchise légale CatNat, surprime CatNat sur la prime, conditions de résiliation, signaux de retrait
d'assureurs sur certaines zones (presse/ACPR/rapports publics). Jamais un lien vers un assureur
(invariant 7).
- *Intéressant* : répond directement à l'hypothèse du brief (« la donnée manquante = l'assurabilité »)
  en la reformulant : le manque, c'est la pédagogie du régime, pas un chiffre par bien.
- *Hypothèse remise en cause* : « il nous manque une donnée d'assurabilité à l'adresse » (le régime
  français mutualise ; le vrai manque est explicatif).
- *Étiquettes* : `dépend d'une donnée à valider` (retrait assureurs peu documenté publiquement),
  `contre-intuitive`.

**E20. Le geste, pas le verdict.**
Chaque signal se termine en question à poser (au notaire, à l'agent, au diagnostiqueur) plutôt qu'en
conclusion : « demandez l'étude de sol G2 », « exigez le DPE de moins de 6 mois ». Le module prépare
la bonne question.
- *Intéressant* : incarnation pure de l'invariant 1 (éclairer sans décider) ; transforme la donnée
  faible en action forte ; désamorce l'interdit de valoriser.
- *Hypothèse remise en cause* : « un module doit conclure / afficher un verdict ».
- *Étiquettes* : très aligné marque.

---

## Le test « sans écran »

- **B6/B7 — le verbe avant le bien.** Survit intact. Un conseiller humain demande d'abord « vous
  achetez, ou vous êtes déjà propriétaire ? ». L'expérience ressentie : « on m'a enfin demandé ce
  que je veux FAIRE, pas juste tapé une adresse ». Concept, pas interface.
- **A1/A2 — loyer du risque + mur de dépenses.** Survit en conseiller ou en podcast : « sur ce type
  de maison sur argile, comptez statistiquement une réparation lourde tous les X ans, et la loi va
  vous imposer tels travaux avant 2034 ». Ressenti : « le vrai coût que personne ne m'avait dit ».
- **C10 — la maison qui fissure.** Survit en récit oral : « votre maison est posée sur un sol qui
  gonfle et se rétracte ; les étés secs, elle travaille ». Ressenti physique, pas donnée.
- *Ne survit pas seul* : le badge DPE coloré (A4 garde son concept « dette », perd son badge), les
  grilles `Block label/value`, les tuiles hero « Pression d'assurance / Valeur » (interfaces d'un
  chiffre spéculatif, pas des concepts).

---

## Les pistes que je n'ose presque pas proposer

1. **Tuer le chantier tel qu'il est posé** (D15 poussé au bout) : et si la bonne réponse à
   « comment finir le module Logement ? » était « il ne devrait pas être un module » ? Mon instinct
   veut sauver le travail déjà fait ; je le pose quand même.
2. **Chiffrer le loyer du risque en euros** (A1) : un montant annuel frôle l'invariant 5 et le
   badge « faux-précis ». Tentant et dangereux — exactement le genre d'idée que la convergence doit
   trancher, pas moi.
3. **Servir le locataire / le non-propriétaire** (B9) : casse la cible CSP+-acheteur implicite. Mon
   instinct dit « hors marque » ; c'est peut-être là qu'est un public mal servi.
4. **Afficher « ce bien n'existera plus » sur le littoral** (C14) : brutal, à la lisière de
   l'alarmisme interdit (invariant 6). Je le laisse sur la table.

---

## Réflexe de clôture — quand ré-explorer ce problème ?

- Si la convergence **sèche sur le cadrage** (Data Curator/board n'arrivent pas à trancher
  « module séparé vs lentille sur Territoire ») : rouvrir la divergence sur la seule question D
  (fusion), c'est le nœud.
- Si une **donnée d'assurabilité réelle à l'adresse** devient disponible (retrait assureurs
  cartographié, ACPR ouvre des données) : l'hypothèse E19 change de nature, rouvrir.
- Si l'**usage réel** montre que les entrants tapent une adresse qu'ils ne possèdent PAS (pré-achat)
  plutôt que leur résidence : le verbe B7 devient le cas par défaut, recadrer tout le parcours.
- Si le **pivot B2B** (CGP, assurance, notaires, diagnostiqueurs) s'active : la cible s'élargit,
  B9 (locataire) et E19 (assurabilité) montent en valeur, rejouer la divergence côté relais.
- Si le porteur tranche un **verbe unique** comme MVP : rouvrir pour approfondir ce seul verbe
  plutôt que tenir les cinq.

---

## Rappel de statut

Tout ce menu est **NON VÉRIFIÉ**. Je n'ai rien sélectionné, rien classé par qualité, rien
recommandé. La sélection appartient au Data Curator (vérification des sources : IRSN radon, valeur
verte notaires, Cerema trait de côte, ONRN représentativité, retrait assureurs) puis au board/
porteur (les décisions structurantes : existence du module, cadrage verbe-vs-adresse). J'ai ouvert
le champ ; je ne le referme pas.
