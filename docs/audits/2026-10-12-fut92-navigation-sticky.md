# FUT-92 · Navigation persistante et décompte compact

Date : 12 octobre 2026 · Branche : `feat/fut-92-navigation-sticky`, depuis `origin/main` (`50e500d0`, FUT-91 #48).
Statut : **livré pour revue, non activé.** Tout le changement visible est derrière `DECISION_RELEVE=true`,
comme le relevé lui-même. Sans le drapeau, `/rapport` rend exactement le même DOM qu'avant (vérifié, § 5).

## 1. Audit : pourquoi le repère ne pouvait pas simplement devenir collant

Deux obstacles, indépendants l'un de l'autre. Chacun suffisait à faire échouer un `sticky top-20`.

**La racine de `/rapport` est un conteneur de défilement.** Elle porte `overflow-hidden` (pour contenir les
halos décoratifs). Or `overflow: hidden` crée un conteneur de défilement, même quand il ne défile jamais :
tout descendant `position: sticky` colle alors à cette racine, qui défile avec la page, et ne colle donc
jamais à l'écran. La mesure le montre sur l'écran actuel : **la navigation principale elle-même, qui se
déclare `sticky`, part avec la page sur `/rapport`** (elle colle partout ailleurs sur le site).

**La colonne d'appui s'arrête avant les contrôles.** `EchelleNavigator` est passé en `supportingPane` à
`DossierDecisionSection`, qui le place dans sa propre grille (colonne droite, deux rangées). Mais
`ControlesDuDossier` est rendu À CÔTÉ de cette section par les trois appelants (repli du `Suspense`,
dossier communal seul, `DossierAvecLogement`). Un élément collant ne sort jamais de sa zone de grille :
il se serait arrêté à la fin de la minute, avant la liste complète des contrôles.

## 2. Ce qui a été fait

**Desktop (relevé, à partir de 1024 px).**
- La liste complète des contrôles passe par la section : nouvel emplacement `controles` de
  `DossierDecisionSection`, comme `supportingPane`. Dans le relevé, elle entre dans la colonne principale
  de la même grille, après la balance ; la colonne d'appui couvre donc toute la lecture.
- La colonne d'appui colle à 88 px (navigation de 64 px, plus 24 px d'air) par CSS seul. Elle s'arrête
  d'elle-même au dernier contrôle, sans script, sans calcul de position, et ne peut recouvrir ni le pied de
  page, ni le geste « Affiner avec une adresse », ni la carte projet qui suivent.
- La racine de `/rapport` passe en `overflow-clip` à partir de `lg`, avec le relevé seulement. `clip`
  coupe ce qui déborde exactement comme `hidden`, sans créer de conteneur de défilement.
- Fenêtre basse : le dessin du repère se réduit avec la hauteur (224 px, jusqu'à 132 px) ; la liste des
  trois liens reste entière. Sous 540 px de hauteur, le repère ne colle plus et reste en haut du dossier.
- La navigation principale colle désormais elle aussi : `scroll-padding-top` réserve sa hauteur, pour
  qu'aucun focus clavier ni aucune ancre du sommaire ne finisse dessous (les cartes gardent leur dégagement
  total de 96 px).

**Mobile (relevé, sous 1024 px).**
- Rien ne colle, rien ne flotte : la racine garde `overflow-hidden`, la navigation principale se comporte
  comme aujourd'hui, le repère reste entre la conclusion et le décompte.
- « D'où viennent ces constats » perd son grand emblème. Il devient trois lignes : un petit repère au trait
  de l'emblème (plein : des constats ; fin : examiné sans constat ; pointillé : non examiné), le nom de
  l'échelle, puis son état (« 5 constats », « examiné, aucun constat affiché », « non examiné dans cette
  lecture »). Zéro garde son « examiné », une échelle non examinée n'a jamais de nombre.
- Le seuil est celui de la colonne d'appui : l'emblème compté ne réapparaît qu'une fois le repère rangé
  dans sa colonne, jamais empilé sous lui (donc aussi sur tablette).

**Desktop garde l'emblème compté**, à côté de sa lecture : il dit l'état des trois échelles (plein, fin,
pointillé), ce que le repère de navigation ne dit pas. Le remplacer par les trois lignes compactes partout
est un changement d'une ligne de CSS, si tu le préfères après revue.

## 3. Fichiers

| Fichier | Changement |
| --- | --- |
| `src/components/report/DossierDecisionSection.tsx` | Emplacement `controles` ; en classique, `<>{section}{controles}</>` (même DOM) |
| `src/components/releve/DossierDecisionReleve.tsx` | Liste dans la grille, colonne d'appui `.repere`, décompte large ou compact, `ReperEchelle` |
| `src/components/releve/releve.module.css` | Collage, fenêtre basse, `scroll-padding-top`, décompte compact |
| `src/components/releve/lecture-dossier.ts` | `texteEtatEchelle` gagne `etatCourt` (même règle, trois états) |
| `src/app/(account)/rapport/page.tsx` | Racine `overflow-hidden lg:overflow-clip` avec le relevé ; liste passée en `controles` (2 lignes) |
| `src/components/report/DossierAvecLogement.tsx` | Liste passée en `controles` (même dossier, même provenance) |
| `src/components/releve/navigation-sticky.test.ts` | 7 tests (N1 à N7) |
| `src/app/dev/fut92/` | Banc : le gabarit de `/rapport` autour des composants de production, streaming compris (404 en production) |
| `src/app/dev/fut91/page.tsx`, `src/app/dev/fut87/dossier-de-test.ts` | Banc FUT-91 aligné sur l'emplacement ; projet de test exposé |

**Inchangés** : `EchelleNavigator.tsx` et son CSS (donc liens, survol, clavier, événements PostHog,
libellés, états d'adresse), `ControlesDuDossier.tsx`, `ControlesReleve.tsx`, le moteur, le verdict, la
sélection, les preuves, la génération.

## 4. Défilement mesuré

Banc `/dev/fut92` (gabarit de `/rapport`), dossier d'adresse réel (hôtel de ville de Nîmes), contrôles
dépliés. Position du haut du repère à l'écran :

| Fenêtre | Haut du dossier | Balance | Milieu des contrôles | Fin du dossier | Pied de page |
| --- | --- | --- | --- | --- | --- |
| Avant, 1440 × 900 | 80 | hors écran | hors écran | hors écran | hors écran |
| 1440 × 900 | 88 | 88 | 88 | 88 | arrêté à la fin du dossier |
| 1280 × 800 | 88 | 88 | 88 | 88 | arrêté |
| 1024 × 768 | 88 | 88 | 88 | 88 | arrêté |
| 1280 × 700 | 88 | 88 | 88 | 88 | arrêté |
| 1280 × 620 (dessin réduit) | 88 | 88 | 88 | 88 | arrêté |
| 1280 × 540 | 88 | 88 | 88 | 88 | arrêté |
| 1280 × 520 | ne colle pas, par choix | | | | |

À chaque position, le repère est entier à l'écran, sous la navigation, et son bas ne dépasse jamais celui du
dossier. Dossier communal (une seule échelle ouverte) : même comportement. Zoom simulé : à 125 % le repère
colle ; à 150 % et 200 %, la page passe au gabarit mobile, sans débordement horizontal.

**Streaming** (`/dev/fut92?flux=6000`) : pendant le repli `pending`, un seul repère, qui colle ; après
résolution de la lecture d'adresse, toujours un seul, qui colle de nouveau jusqu'au dernier contrôle.

**Vrai `/rapport`** (session du porteur, lecture seule, drapeau actif, 1680 × 872, aucune capture
conservée) : le repère tient à 88 px à 5 %, 30 % et 60 % du dossier, remonte avec la fin du dossier à 90 %,
et s'arrête exactement au bas du dossier ; un seul repère visible, aucun identifiant en double visible,
aucun débordement, aucune erreur console liée au lot.

**Mobile, du repère jusqu'à la balance** : 921 → 577 px à 390 px (−344), 944 → 578 px à 360 px (−366),
891 → 575 px pour un dossier communal (−316).

## 5. Fidélité

- **Classique** : DOM de `#dossier-decision` et `#controles`, ordre des frères, hauteurs, comparés à `main`
  sur 5 cas (commune, adresse avec artefact, `pending`, `unavailable`, nombreuses réserves) : **identiques**.
- **Relevé**, comparé à `main` sur 4 cas : mêmes liens (ensemble et nombre), mêmes destinations du repère,
  même provenance (`?preuve=` présent sur les mêmes 8 liens d'un artefact), mêmes cartes, même texte des
  contrôles, mêmes nombres par échelle, aucun identifiant en double.
- **Accessibilité** : l'arbre d'accessibilité n'expose qu'un décompte par largeur (c'est ce contrôle qui a
  trouvé le seul bogue du lot, § 7) ; les trois liens du repère restent la voie sémantique, les formes du
  dessin restent hors du parcours Tab. Clavier : ordre conclusion, repère, décompte, minute, contrôles ;
  aucun élément focalisé masqué par la navigation, en avançant comme en reculant. Ancres du sommaire : la
  cible arrive à 80 px, sous la navigation. Mouvement : aucun ajouté ; le repère ne s'anime pas, il reste
  en place (`prefers-reduced-motion` sans objet).

## 6. Vérifications

- 33 tests du relevé (dont 7 nouveaux, N1 à N7) ; suite complète **2435/2435** ; typecheck ; build.
- Lint : 42 signalements sur tout le projet, **strictement les mêmes que sur `main`**, aucun dans un fichier
  touché.
- Aucun appel au modèle : serveurs lancés avec `DOSSIER_NARRATIVE=false` et la clé commentée. Un
  préchauffage de synthèse de territoire a tenté un appel sur `/rapport` et a échoué faute de clé (0 appel).

## 7. Problèmes trouvés en route

1. **Focus masqué en remontant au clavier** : dès que la navigation principale colle, Maj+Tab amenait des
   liens de preuve sous elle. Corrigé par `scroll-padding-top`, limité aux pages qui portent le relevé.
2. **Décompte affiché deux fois sur ordinateur** : la règle de base du décompte compact venait après la règle
   grand écran, et l'emportait. Trouvé par l'arbre d'accessibilité, corrigé, couvert par N7.
3. **Défaut latent de la présentation classique** : sur `/rapport`, la navigation principale ne colle pas,
   à cause de la même racine `overflow-hidden`. Ce lot ne le corrige pas (consigne : classique intact). La
   correction tient en un mot (`overflow-clip`), à décider.

## 8. Impacts sur FUT-10

- La branche `feat/fut-10-projet-relation-checkout` touche `rapport/page.tsx` (imports, bloc « Ce bien »),
  `DossierAvecLogement.tsx` (prop `contexteAChange`) et `DossierDecisionSection.tsx` (même prop). Ce lot
  touche d'autres lignes de ces fichiers : une fusion simulée (`git merge-tree`) ne donne **aucun conflit**.
- À savoir pour FUT-10, indépendamment de ce lot : sa prop `contexteAChange` devra aussi être transmise à
  `DossierDecisionReleve` (bascule FUT-91), sans quoi le relevé ne signalera pas un lien au bien modifié.

## 9. Écarts et limites

- Safari non testé (pas de moteur WebKit pour l'automate). `overflow: clip` est pris en charge depuis
  Safari 16 ; avant, la racine retomberait sur `visible` à partir de 1024 px.
- Le mobile du vrai `/rapport` n'a pas été mesuré dans la session (seul le banc l'a été, au même gabarit).
- Pendant le streaming, React garde brièvement le dossier résolu dans un conteneur caché avant l'échange :
  deux repères existent alors dans le DOM, un seul est visible. C'est le fonctionnement de `Suspense`,
  identique sur `main`.
- Aucune seconde barre de navigation sur mobile (non demandée sans validation).
