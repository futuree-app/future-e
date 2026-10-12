# FUT-75 · Intégration motion n° 1 : Q4 et Q5 dans le produit, Q1 prêt, Q2 raccourci

Date : 12 octobre 2026 · Branche : `feat/fut-75-motion-integration-1`, depuis `origin/main` (`9cd6a34c`).
La branche des prototypes `feat/fut-75-motion-releve` reste intacte, comme référence artistique.
Vidéos et captures : `docs/audits/fut75-integration-1/` (voir § 9).

## 1. Raccordement avec FUT-10 (audité en premier)

FUT-10 (`feat/fut-10-projet-relation-checkout`, `21746fd6`) **n'est pas fusionné**. Il modifie
`AnalyseAncienProjet.tsx` (nouveau motif « lien avec le bien »), la route `/api/dossier/actualiser`
(contexte d'achat, 503 `PURCHASE_CONTEXT_UNAVAILABLE`), `DossierDecisionReleve.tsx`,
`DossierAvecLogement.tsx`, `DossierDecisionSection.tsx` et `rapport/page.tsx`.
Il ne touche **ni** `EntreeReleve.tsx`, **ni** `releve.module.css`, **ni** `DecisionFactRenderParts.tsx`,
**ni** `QuartierSynthesis.tsx`, **ni** `synthesis-display.ts` : Q4 et Q5 s'intègrent sans conflit. Q1,
dont la surface réelle est `AnalyseAncienProjet`, est préparé mais **pas raccordé** (§ 5).

## 2. Fichiers réels modifiés

| Fichier | Changement |
| --- | --- |
| `src/app/design-tokens.css` | Jetons `--m-*` (durées, courbes, micro-ressort) et leur mise à zéro en mouvement réduit |
| `src/lib/motion.ts` (nouveau) | La grammaire en logique pure, alignée sur les jetons par test |
| `src/components/releve/EntreeReleve.tsx` | « Données et limites » reçoit la classe `detailsFluide` (une ligne) |
| `src/components/releve/releve.module.css` | `.detailsFluide` : ouverture et fermeture en continuité |
| `src/lib/territoire/synthesis-display.ts` | Événement `showDeterministic` (retour à la lecture immédiate), `ligneEtatLecture` |
| `src/components/report/QuartierSynthesis.tsx` | Une ligne d'état unique, la bascule courte, le temps écoulé au-delà de 10 s |
| `src/lib/interaction/etat-action.ts` (nouveau) | Q1 : états, issues réelles depuis la réponse d'`actualiser`, phrases d'échec |
| `src/components/interaction/BoutonAction.tsx` + `.module.css` (nouveaux) | Q1 : composant d'affichage, sans réseau, non raccordé |
| `src/app/dev/motion/` (nouveau, 404 en production) | Page de contrôle : aperçu Q1 sur le contrat réel d'`actualiser` rejoué, sélecteur Q2 à trois durées |
| Tests (nouveaux) | `src/lib/motion.test.ts`, `src/lib/interaction/etat-action.test.ts`, `src/lib/territoire/synthesis-display-etat.test.ts` |

Rien de l'atelier, de ses données de démonstration ni de ses routes n'entre dans l'application.

## 3. La grammaire commune

| Moment | Durée | Courbe | Jeton | Exemple |
| --- | --- | --- | --- | --- |
| Réaction au geste | 90 ms (pression), 120 ms (survol, focus) | `ease` ; micro-ressort pour une commande qui se pose | `--m-pression`, `--m-geste`, `--m-ressort` | bouton qui s'enfonce et revient |
| Transition d'état | 240 ms | `--m-releve` | `--m-etat` | zone qui s'ouvre, bouton qui devient attente |
| Arrivée d'un contenu | 180 ms, fondu et flou de 2 px, sans déplacement | `--m-releve` | `--m-bascule` | lecture enrichie qui s'affiche |
| Confirmation | coche tracée en 260 ms, après la réponse | `--m-releve` | | « Analyse mise à jour » |

**Règles.** Le repère bouge, la donnée reste (aucune valeur ne défile). Le micro-ressort (≈ 2 % de
dépassement) ne s'applique qu'aux commandes. **Interruption** : une transition CSS repart de l'état
courant, aucune séquence ne se joue contre le lecteur. **Mouvement réduit** : les jetons de
déplacement tombent à 0 ms pour tout le site ; seule la teinte change. **Mobile** : mêmes durées,
cibles ≥ 40 px, aucune information réservée au survol. **Budget** : ≥ 30 i/s avec le processeur ralenti
6 fois, sinon repli plus simple. Aucune dépendance ajoutée.

## 4. Ce qui est intégré

**Q4 · « Données et limites » dans la carte du relevé** (présentation `DECISION_RELEVE` seulement). Toujours
un `<details>` natif : clavier, lecteur d'écran et recherche dans la page inchangés. La zone passe de
zéro à sa hauteur en 240 ms (`::details-content`, `interpolate-size`), le contenu arrive de 4 px, le
signe « + » tourne en « × » sur le micro-ressort. Le titre et la commande ne bougent pas (mesuré :
même position avant et après). Amélioration progressive : un navigateur sans ces propriétés garde
l'ouverture instantanée d'aujourd'hui. Sources, liens de provenance et limites sont intacts ; la
présentation classique (`MethodDetails`) n'est pas touchée.

**Q5 · La lecture enrichie dans `QuartierSynthesis`** (module Territoire), branchée sur ses vrais états :
- la lecture immédiate reste affichée et complète, la lecture enrichie n'est jamais substituée d'office ;
- **une seule ligne d'état** change de fonction : « Une lecture enrichie se prépare. La lecture ci-dessus
  est complète. » (le temps écoulé n'apparaît qu'au-delà de 10 s, par pas de 5 s, jamais de pourcentage
  ni de temps restant), puis « Lecture enrichie prête · l'afficher », puis « Revenir à la lecture
  immédiate » (nouveau : le texte déterministe redevient accessible) ;
- le point qui pulsait est remplacé par un repère fixe : rien ne « réfléchit » ;
- l'échec, auparavant silencieux, est dit sans alarme : « Pas de lecture enrichie pour l'instant. La
  lecture ci-dessus est complète. » ;
- l'échange de texte passe d'un fondu de 600 ms à une bascule de 180 ms, sans View Transitions ;
- même bouton pour « l'afficher » et « revenir » : le focus clavier reste en place.
**Pas de bouton « réessayer »** : chaque tentative relancerait une génération payante au modèle ; la
préparation automatique et son abandon après 210 s sont ceux de production.

`ConclusionRedigee` (hub) a été étudiée : sa lecture enrichie arrive par le flux serveur (`Suspense`),
sans état client. Lui appliquer la même ligne d'état demande une décision produit (proposer plutôt que
substituer), hors de ce lot.

## 5. Q1 : prêt, non raccordé (dépendance FUT-10)

**Fait.** `BoutonAction` (affichage seul, sans réseau) et `etat-action.ts` (logique pure) :
- succès **seulement** sur `200 { statut: "abouti", version }` ; `en_cours` n'est jamais une livraison ;
- échecs nommés : 409 projet manquant, 503 contexte d'achat indisponible, 502 génération, réseau ;
- double appui ignoré pendant l'attente ; une réponse orpheline ne confirme rien ;
- indicateur (emblème des trois échelles) seulement après 300 ms ; `aria-busy`, focus conservé ;
- vérifié sur `/dev/motion` contre le contrat réel d'`actualiser`, rejoué sans rien écrire : attente
  courte, attente longue, succès, chacun des échecs, « déjà en cours », double clic.

**Bloqué.** Le raccordement à `AnalyseAncienProjet` attend la fusion de FUT-10, qui réécrit ce composant.
Plan : partir de sa version fusionnée ; garder les trois motifs (projet, lien avec le bien, voisinage) ;
lancer `fetch` dans le composant de production, traduire la réponse par `issueDepuisReponse`, faire
avancer l'état par `suivantAction` ; ne montrer « Analyse mise à jour » qu'avec la version livrée, puis
`router.refresh()` ; l'ancienne version reste lisible pendant l'attente et après un échec. Un test
garantit qu'`AnalyseAncienProjet` ne l'importe pas encore.

## 6. Q2 : trois durées, choix 180 ms

Retouché sur la page `/dev/motion` (la branche des prototypes n'est pas modifiée) : départ franc,
bord de tête en avance de 25 % sur le premier tiers seulement, pose sur le micro-ressort, aucune
traînée ; un nouveau choix repart de la position courante. **140 ms** : précis, mais l'étirement des
bords ne se perçoit plus. **220 ms** : la fin se remarque encore aux clics rapides. **180 ms** : le
déplacement se lit et se termine avant le geste suivant. Retenu : 180 ms. Mouvement réduit : immédiat.

**Remplacer `HorizonSwitch` (lot distinct).** Usages réels : `FutureELanding` (accueil), quatre options
(« 1976–2005 », 2030, 2050, 2100, `HORIZONS_ACCUEIL`) ; le module Territoire a ses propres pastilles
(`HORIZON_PILLS`, trois horizons). Recommandation : un composant de sélection commun (groupe radio,
indicateur à deux bords, 180 ms), alimenté par `src/lib/horizons.ts` (horizon et palier TRACC France) avec
une option facultative pour la période de référence, qui remplace les deux et résorbe la couleur sable
hors palette d'`HorizonSwitch`.

## 7. Q3 : où ce geste existe vraiment

- `/comparateur` (`ModeChoixSearch`) : **trois emplacements au plus**, chacun rempli en tapant un nom et en
  choisissant une suggestion d'autocomplétion ; le dédoublonnage se fait par code.
- `/ou-vivre` : un classement de communes, **sans action de comparaison**.
- Aucune surface ne fait passer une commune d'une liste vers un plateau.

Recommandation : ne pas créer d'écran pour l'animation. Le seul emplacement naturel est le **choix d'une
suggestion** dans `ModeChoixSearch` : la ligne choisie se transformerait en emplacement rempli (même
élément qui change de fonction). À garder comme inspiration pour un lot ultérieur.

## 8. Mesures et tests

**Performance** (processeur ralenti 6 fois, **mode développement**, donc plus lent que la production ;
trois essais successifs, première tâche longue entre parenthèses) :

| Geste | 1280 × 800 | 390 × 844 |
| --- | --- | --- |
| Q4 ouvrir, fermer | 40 · 57 · 54 i/s (143 ms) | 47 · 57 · 59 i/s (118 ms) |
| Q5 proposition, échange | 54 · 57 · 57 i/s (91 ms) | 50 · 56 · 57 i/s (95 ms) |
| Q1 appui | 52 · 56 · 56 i/s (101 ms) | 52 · 52 · 56 i/s (106 ms) |
| Q2 sélecteur 180 ms | 58 · 56 · 58 i/s | 58 · 58 · 58 i/s |

Rien ne descend sous 30 i/s : aucun repli n'a été nécessaire.

**Tests exécutés.** Ciblés : grammaire (G1, G2), Q4, Q1 (A1 à A3), Q5 (L1 à L4). Suite complète
**2445/2445**, TypeScript, lint (42 signalements, identiques à `main`), build Webpack ; `/dev/motion` et
sa route en 404 en production. Navigateur : clavier (Q4 au clavier, focus conservé ; Q5 focus conservé
entre « l'afficher » et « revenir » ; Q1 focus et `aria-busy`), arbre d'accessibilité de Q4 ouvert,
mouvement réduit (durées à 0, emblème immobile, aucune animation de Q5), interruptions (ouvrir puis
refermer aussitôt, clics rapides sur le sélecteur, double appui sur Q1).

## 9. Vidéos et captures (`docs/audits/fut75-integration-1/`)

Avant = `main` ; après = cette branche. Q4 dans la vraie carte (banc `/dev/fut92`, gabarit de /rapport,
dossier d'adresse public) ; Q5 dans le vrai `QuartierSynthesis` (`/dev/synthese-territoire`, instantané
public, réponses de l'API simulées dans le navigateur, texte enrichi de démonstration signalé).

| Vidéos | |
| --- | --- |
| `q4-avant-ordinateur.mp4` / `q4-apres-ordinateur.mp4` · `q4-avant-mobile.mp4` / `q4-apres-mobile.mp4` | ouvrir, fermer, interrompre, autre carte |
| `q5-avant-ordinateur.mp4` / `q5-apres-ordinateur.mp4` · `q5-avant-mobile.mp4` / `q5-apres-mobile.mp4` | préparation, proposition, affichage, retour |
| `q5echec-avant-ordinateur.mp4` / `q5echec-apres-ordinateur.mp4` | lecture enrichie indisponible |
| `q1-apres-ordinateur.mp4` · `q1-apres-mobile.mp4` | livrée, réponse rapide, 409, déjà en cours, double appui |
| `q2-apres-ordinateur.mp4` · `q2-apres-mobile.mp4` | 140, 180, 220 ms, clics rapides |

Captures à vraie largeur (1440 et 390 px) : `q4-carte-ouverte`, `q5-preparation`, `q5-proposition`,
`q5-indisponible`, `q1-repos`.

## 10. Points bloquants avant une PR

1. **Q1** : attendre la fusion de FUT-10, puis raccorder `AnalyseAncienProjet` à partir de sa version finale.
2. **Safari et Firefox** : `::details-content` et `interpolate-size` n'y existent pas encore ; Q4 y reste
   instantané (comportement actuel). Non testé sur un vrai moteur WebKit.
3. **Q4 ne vit que dans le relevé**, désactivé en production (`DECISION_RELEVE`) : il ne sera visible
   qu'à l'activation de la nouvelle présentation.
4. **Mesures en mode développement** : à confirmer sur un build de production et un vrai téléphone modeste.
5. **Décision produit** : la même ligne d'état pour la lecture enrichie du hub (`ConclusionRedigee`).

## 11. Finition après revue (12/10/2026)

**Q5, attente héritée d'un autre horizon.** Le temps écoulé vivait dans `QuartierSynthesis` : après 30 s
d'attente sur 2050, un passage à 2100 pouvait afficher « depuis 30 s » pour une demande qui venait de
partir, jusqu'au tick suivant. Il vit désormais dans `LigneEtatDemande`, montée sous la clé de la demande
(`cleDemande` : horizon, instantané, commune) : chaque demande repart de zéro. Test L5, et contrôle
navigateur à horloge simulée : 2050 après 31 s « depuis 30 s » ; 2100 aussitôt, puis 2050, puis
2030 → 2100 → 2050 : aucune durée ; 11 s après la nouvelle demande : « depuis 10 s ».

**Mouvement réduit.** `--m-geste` tombe aussi à zéro, avec toutes les durées, et `--m-ressort` devient
`linear(0, 1)` (aucun dépassement). L'enfoncement des boutons et le glissé du contenu de Q4 sont
neutralisés. Le test G2 vérifie chaque jeton de durée déclaré, pas une liste écrite à la main.

**Contrôles.** Suite 2446/2446, TypeScript, lint (42, identiques à `main`), build Webpack. Q4 et Q5 dans
les vrais composants, mouvement normal et réduit : titre immobile, focus conservé, `aria-live` en place.
Aucun fichier commun avec FUT-10 (`97c258de`), fusion simulée sans conflit. Q1 reste non raccordé.
