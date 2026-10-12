# FUT-75 · Deuxième itération : sortir de l'austérité, et soigner chaque geste

Date : 12 octobre 2026 · Branche : `feat/fut-75-motion-releve` · Atelier : `/dev/fut75` (404 en production).
Aucun composant de production modifié, aucune dépendance ajoutée, rien de FUT-10 touché.
Première itération : `docs/audits/2026-10-11-fut75-motion-releve.md` (toujours au banc, pour comparer).
Planche, vidéos et comparaisons : `docs/audits/fut75-motion/README.md`.

## 1. La première itération, revue sans complaisance

**En directeur artistique.**
- **B était un graphique de rapport technique.** Des nombres de 30 px gris à côté d'un graphique à
  tiges en 11 px : rien ne disait « 14 jours », tout disait « tableau de bord ». Aucune couleur alors
  que la palette a une teinte pour la chaleur (`--red`). Le geste (un curseur fin qui glisse) était
  juste mais imperceptible.
- **C était un organigramme.** Six étapes empilées sur 900 px, reliées par des voies à gauche : on
  lisait un diagramme de flux, pas une démonstration. Le moment fort (la conclusion fondée) était noyé
  au milieu de la colonne.
- **A tenait.** Les coins de coupe et le tracé à l'ouverture ont une identité : c'est le seul prototype
  qui ressemblait à futur•e et à rien d'autre.
- **Ce qui manquait partout :** de l'échelle typographique, une couleur qui signifie, des réactions
  qu'on sent sous le doigt. La rigueur était là ; le désir, non.

**En développeur.** L'architecture tient (règles pures testées, trois modes, aucune dépendance). Deux
limites : un seul niveau de mouvement pour des besoins très différents, et un interdit du ressort trop
large (il interdisait aussi aux commandes de « se poser »).

## 2. Ce que Prompt Motion apprend, et ce qu'on n'en prend pas

Seule la référence « shape morphing through UI states » documente sa technique ; les deux autres sont
des films (Remotion) sans règle applicative. Retenu et traduit en composants interactifs :
- **Un seul élément qui se transforme** (taille, rayon, couleur) pendant que son contenu s'échange par
  un flou court : le bouton d'action (Q1), la ligne d'état qui devient proposition (Q5), la bascule
  des chiffres (B).
- **Un indicateur d'onglet à deux bords** sur des ressorts distincts, le bord de tête s'étirant le
  premier : le sélecteur élastique (B, Q2, Q6).
- **Des ressorts, un dépassement minime au plus** : un micro-ressort calculé (≈ 2 %), réservé aux
  commandes.
- **Les formes changent de fonction** : la priorité et les chiffres deviennent les fondements de la
  conclusion (C1), l'étiquette d'une commune devient un jeton de comparaison (Q3), le glyphe d'échelle
  se transforme d'une vue à l'autre (Q6).
- **Écarté** : les mouvements de caméra, le montage, le rythme calé sur une musique (des effets de
  film, pas des comportements d'interface) ; et, comme la référence elle-même, les rebonds, halos et
  dégradés.

## 3. Audit des interactions réelles

Audit du code des parcours (accueil, Où vivre, comparateur, projet, hub, modules, preuves, lecture
enrichie, actualisation). Le checkout n'a été que lu.

| Interaction | Aujourd'hui | Impact visuel | Fréquence | Bénéfice | Complexité |
| --- | --- | --- | --- | --- | --- |
| **Q1 · Mettre à jour une analyse** (`AnalyseAncienProjet`) | « Mise à jour… », bouton pâli, puis rechargement brutal ; rien ne confirme | fort | rare | fort (confiance) | faible |
| **Q2 · Sélecteurs** (`HorizonSwitch`, onglets d'échelle) | fond changé d'un coup ; `HorizonSwitch` garde un sable `#c8b89a` retiré de la palette (§ 5.2) | fort | très fréquente | moyen | faible |
| **Q3 · Choisir des communes** (comparateur, Où vivre) | case cochée, compteur | moyen | fréquente | moyen | moyenne |
| **Q4 · Ouvrir les preuves** (`MethodDetails`, `<details>`) | ouverture instantanée, le texte qui suit saute | moyen | très fréquente | fort (lecture) | faible |
| **Q5 · Lecture enrichie** (`QuartierSynthesis`, `ConclusionRedigee`) | point qui pulse, bouton, remplacement brutal | fort | à chaque dossier | fort (honnêteté) | moyenne |
| **Q6 · Changer d'échelle, revenir à une preuve** (modules, `EvidenceArrival`) | page remplacée ; bref contour d'arrivée | fort | très fréquente | fort (orientation) | moyenne |
| Chargement de route (`RouteLoadingBar`) | barre indéterminée et phrases ; déjà honnête | faible | fréquente | faible | – |
| Bouton du parcours projet (`WizardStep`) | survol avec ombre colorée et léger rétrécissement : générique | faible | ponctuelle | faible | faible |

Les six premières sont prototypées ; les deux dernières ne justifient pas un prototype.

## 4. Le système motion, deuxième version

Trois niveaux, qui ne se mélangent pas (`motion.ts`, `NIVEAUX`, et jetons `--m-*`) :

| Niveau | Durée | Courbe | Pour quoi | Exemples |
| --- | --- | --- | --- | --- |
| **Geste** | 90 à 160 ms | micro-ressort (dépassement ≈ 2 %) ou `releve` | réaction immédiate à la main : pression, survol, focus | bouton qui s'enfonce (0,97), indicateur qui se pose, signe qui tourne |
| **État** | 180 à 320 ms | `releve` | continuité entre deux présentations d'un même élément | bouton qui devient attente, carte qui se déploie, chiffre qui bascule |
| **Structure** | 400 à 900 ms | `releve` | compréhension d'ensemble, toujours déclenchée ou jouée une fois | ouverture tracée, dévoilement, changement de vue |

**Règles.**
1. **Aucune donnée ne s'anime**, à aucun niveau : un chiffre bascule d'un bloc (flou ≤ 3 px, fondu,
   recadrage de 3 %, jamais de défilement vertical), une barre ou une grille change d'état en une fois.
2. **Le ressort est réservé aux commandes** (test V2 : il n'apparaît sur aucune donnée).
3. **La couleur signifie** : la chaleur en `--red` (palette § 5.2), l'action en orange de marque, la
   confirmation en vert d'alignement, le contrôle en bleu de contrôle ; jamais une teinte décorative.
4. **Contraste** : l'état actif gagne en encre et en épaisseur, jamais seulement en couleur.
5. **Toucher** : cibles d'au moins 44 px, aucune information réservée au survol, pression immédiate
   (`touch-action: manipulation`).
6. **Chargements honnêtes** : ce qui est connu s'affiche tout de suite ; l'attente se dit en mots et en
   secondes écoulées, jamais en pourcentage ; aucune animation qui « réfléchit » ; un succès n'existe
   qu'à la réception d'une réponse.
7. **Continuité** : par l'API View Transitions quand une forme change de fonction ; repli immédiat en
   mouvement réduit, sans animation, ou sans prise en charge.
8. **Mouvement réduit** : aucun déplacement ni ressort ; seuls des fondus de 120 ms au plus.

## 5. Les prototypes de cette itération

**A, peaufiné.** Les quatre coins du réticule se posent l'un après l'autre (18 ms d'écart) sur le
micro-ressort, et une croisée de visée se trace dans le périmètre visé. Aucun zoom.

**B1 · éditoriale.** Le chiffre en très grand (jusqu'à 168 px, Archivo élargie, `--red`), l'écart à
1976-2005 en toutes lettres, une grille où un carré vaut un jour (référence en gris, horizon en rouge,
seuil en trait fin). Au changement d'horizon, le chiffre bascule et les carrés qui changent s'éclairent
un instant, tous ensemble.

**B2 · instrument.** La règle du temps linéaire porte des barres isolées à leur année et la référence
en bande large ; une cote mesure l'écart sur la barre choisie ; le sélecteur est relié aux barres par
des lignes de rappel. Bascule entre jours et nuits tropicales.

Commun à B1 et B2 : une note sépare **niveau de réchauffement** (+2 / +2,7 / +4 °C en France) et
**année d'atteinte** (TRACC), et dit la nature conventionnelle du seuil.

**C1 · dévoilement éditorial.** La conclusion en tête ; dessous, une scène de quatre temps dans un même
espace (ce que vous recherchez, ce que la donnée établit, ce que futur•e en conclut, ce qui reste à
vérifier), navigable par boutons, frise et flèches. La priorité et les chiffres se transforment en
étiquettes « parce que » sous la conclusion.

**C2 · couches dans la carte.** Repliée : la conclusion seule. Dépliée : la conclusion grandit et
quatre strates arrivent une à une sous elle (priorité, donnée, convention, limite) ; son trait de
registre s'allonge à chaque couche. Les deux compositions sont belles sans mouvement.

**Interactions du quotidien (Q1 à Q6)** : décrites au § 3, chacune face à son comportement actuel dans
l'atelier. Q1 et Q5 attendent une vraie réponse réseau (route de développement : issue et délai
réglables) ; le texte « enrichi » de Q5 est un texte d'exemple signalé comme tel.

## 6. Évaluation

**B et C** (1 à 5) :

| | B1 éditoriale | B2 instrument | C1 dévoilement | C2 couches |
| --- | --- | --- | --- | --- |
| Lisibilité immédiate | 5 : on lit « 14 » avant tout | 4 : plus riche, demande un regard | 4 : conclusion en tête, une idée par scène | 5 : repliée comme dépliée |
| Effet wow | 4 : la grille qui change de rouge | 4 : la cote et les rappels | 5 : la priorité qui devient fondement | 4 : la conclusion qui s'affirme |
| Intérêt pour la décision | 4 : l'écart à la référence en grand | 5 : trois horizons et la référence d'un coup d'œil | 4 : la logique, pas à pas | 5 : tout le fondement sur la carte même |
| Reconnaissable futur•e | 4 | 5 : la règle du temps du relevé | 4 | 5 : registre, marge, sobriété |
| Risque | la grille arrondit à l'unité (dit sous la grille) | densité sur mobile | longueur si on veut tout voir | aucun notable |

**Interactions du quotidien** (1 à 5) :

| | Plaisir | Lisibilité | Cohérence | Performance | Intérêt réel |
| --- | --- | --- | --- | --- | --- |
| Q1 bouton d'action | 5 | 5 | 5 | 5 | 5 : confirme enfin, distingue échec et « déjà en cours » |
| Q2 sélecteur élastique | 5 | 4 | 5 | 4 | 4 : le contrôle le plus fréquent du produit |
| Q3 communes à comparer | 4 | 4 | 4 | 4 | 3 : utile au comparateur, moins ailleurs |
| Q4 preuves déployées | 4 | 5 | 5 | 5 | 5 : on garde sa ligne de lecture |
| Q5 lecture enrichie | 4 | 5 | 5 | 5 | 5 : honnêteté de l'attente |
| Q6 changement de vue | 5 | 4 | 5 | 3 (View Transitions coûteuses sur appareil lent) | 4 |

**Recommandation.**
1. **Intégrer d'abord Q1, Q4 et Q5** : faible coût, gain de confiance immédiat, aucun risque.
2. **Puis le sélecteur élastique (Q2)** comme composant unique de sélection (horizons, échelles,
   mesures), en remplacement de `HorizonSwitch`, ce qui résorbe aussi sa couleur hors palette.
3. **Pour la signature : C2** sur les cartes à composition du relevé, et **B2** quand Territoire passera
   au relevé (B1 pour les pages publiques par commune, où le grand chiffre fait le travail).
4. **Q6 et C1** (View Transitions) : à garder pour les écrans où la continuité change la compréhension,
   avec un repli sur les appareils lents (§ 7).

## 7. Tests réellement exécutés

- **Unitaires** : 21 tests (M1 à M11, V1 à V10). Mutations détectées : un succès fabriqué par le
  composant, un ressort posé sur une donnée, un pourcentage inventé dans l'attente (et les trois de la
  première itération).
- **Accessibilité** (navigateur automatisé) : groupes radio au clavier (flèches qui bouclent, Début,
  Fin, un seul arrêt de tabulation) ; C1 aux flèches, focus sur le titre de scène, étape annoncée ;
  C2 `aria-expanded`, focus conservé ; Q1 `aria-busy`, `aria-disabled`, focus conservé pendant
  l'attente, zone annoncée ; Q4 contenu replié `inert`, titre immobile à l'ouverture ; Q6 focus posé sur
  la carte visée.
- **Mouvement réduit du système** : modes résolus en `reduit`, 0 animation de l'indicateur, 0 transition
  de vue déclenchée, emblème d'attente immobile. **Sans animation** : 0 animation en cours, couches
  affichées d'emblée.
- **Largeurs** : 360, 390, 1024, 1440 : aucun débordement propre aux prototypes (le débordement de la
  `Navbar` à 1024 px est connu et hors lot).
- **Performance** (build de production local, processeur normal puis ralenti 6 fois) :

| Geste | Normal | Ralenti × 6 (ordinateur) | Ralenti × 6 (390 px) |
| --- | --- | --- | --- |
| B1 changement d'horizon | 53 à 55 i/s, une tâche de 60 à 120 ms | 11 à 21 i/s, tâche de 400 à 530 ms | 13 à 25 i/s |
| B2 changement d'horizon | 60 i/s | 46 i/s, une tâche de 142 ms | 46 i/s |
| C1 scène suivante | 53 i/s, aucune tâche longue | 17 à 35 i/s, une tâche de 190 à 310 ms | 17 à 34 i/s |
| C2 couches | 58 i/s | 20 i/s, une tâche de 140 ms | 34 i/s |
| Q2 sélecteur | 60 i/s | 45 i/s, une tâche de 147 ms | 55 i/s |
| Q4 preuves | 60 i/s | 45 i/s, une tâche de 95 ms | 48 i/s |
| Q6 changement de vue | 58 i/s | 20 i/s, une tâche de 138 ms | 39 i/s |

  Lecture : tout est fluide sur un poste ordinaire. Sur appareil lent, **B1** coûte surtout par le
  rendu de la page (mesuré : 155 à 260 ms même sans aucune animation ; l'isolation `contain` de la
  grille évite de monter à 395 ms) ; les **View Transitions** restent les gestes les plus chers sur
  appareil lent, même limitées à leur portée (§ 8, points 6 et 7 : sur mobile, Q6 est passé de 19 à
  39 i/s et C2 de 24 à 34). Avant intégration : réserver les View Transitions aux appareils capables
  (repli bascule), et alléger la page qui porte B1 (l'atelier, qui empile tous les prototypes, est bien
  plus lourd qu'un écran réel). Les mesures varient d'un passage à l'autre : les fourchettes sont celles
  de deux séries.
- **Vidéos** : 21 MP4 en temps réel (ordinateur 1280 × 800, mobile 390 × 844), interactions réelles.
- Suite complète, TypeScript, lint et build Webpack : voir le compte rendu de livraison.

## 8. Défauts trouvés en route, corrigés

1. **B2 débordait à 390 px** : la colonne prenait la largeur du graphique, et le graphique celle de la
   colonne (boucle). Corrigé (`minmax(0, 1fr)`, `min-width: 0`).
2. **Q6 ne posait pas le focus sur la carte visée** : avec View Transitions, la mise à jour est
   asynchrone. Le focus suit désormais le rendu de la nouvelle vue.
3. **Des espaces disparaissaient après un texte en gras** quand la phrase continuait à la ligne
   (compilation JSX) : espaces explicites.
4. **Pendant l'attente de Q1, la zone annoncée répétait le message de repos** : elle dit maintenant que
   la mise à jour est demandée et attend le serveur.
5. **Le build Webpack échouait** : les règles `::view-transition-*` placées dans le module CSS ne sont
   pas des sélecteurs « purs ». Sous Turbopack, elles passaient, mais les `@keyframes` qu'elles
   appelaient étaient renommés : les passages personnalisés (scène de C1, sens de Q6) ne s'appliquaient
   pas. Ils vivent désormais dans une feuille globale de l'atelier (`transitions.css`), vérifiés appliqués.
6. **Chaque View Transition photographiait toute la page** et tous les éléments nommés des autres
   prototypes (treize groupes et la racine). Les noms ne sont plus posés que pendant la transition de
   leur composant (`html[data-vt]`), et la racine n'est plus capturée.
7. **Le flou d'une scène entière coûtait cher** sur appareil lent : retiré des passages de scène ; le
   flou court reste réservé aux petits éléments qui basculent.
8. Dans mes scripts de démonstration (pas dans le produit) : un sélecteur ambigu (« 5 s » trouvait
   « 0,15 s »). Les vidéos C1, C2, Q3, Q5 et Q6 ont été refaites après les corrections 5 à 7.

## 9. Décisions ouvertes

1. Inscrire les trois niveaux et le ressort réservé aux commandes dans `DESIGN.md` (§ 6.4 garde son
   interdit sur les données).
2. Réserver les View Transitions aux appareils capables, ou les abandonner au profit de la bascule.
3. B1 ou B2 pour Territoire, et B1 pour les pages publiques par commune ?
4. C2 sur toutes les cartes à composition, ou seulement sur celle qui fonde le verdict ?
5. Remplacer `HorizonSwitch` par le sélecteur élastique (et sa couleur hors palette) dans un lot dédié.
