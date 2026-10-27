# FUT-143 — DPE contradictoire et aperçu avant achat

Branche `bonjourfuturee/fut-143-dpe-et-rnb-securiser-la-selection-contradictoire-et`, depuis `main` 2af75b87 (FUT-80 inclus). Ni FUT-80 ni les règles serveur d'attribution ne sont modifiés. Aucune migration.

## A. Un DPE contredit par le bâtiment ne se retient plus d'un clic

**Reproduction avant correction** (`src/components/report/fut143-dpe-contradictoire.test.ts`, vrais `AddressDiagnosticsBlock`, `DpeSelector` et `SaisieNumeroDpe`, fixture Monchaux-sur-Écaillon de FUT-80) : un clic sur la ligne « rattaché par la base ADEME à un autre bâtiment » appelait `onPick` aussitôt (`1 !== 0`), donc le POST `/api/logement-dpe`. Six tests sur douze échouaient ; les cas non contradictoires passaient déjà.

**Correction.**
- `ligneCandidat` expose `contredit` (même règle que le serveur : `contreditParLeBatiment` sur `idsDesBatiments`).
- Dans `DpeSelector`, un clic sur une ligne contredite déplie sous elle l'explication, puis deux gestes : « Retenir quand même ce diagnostic » (seul appel à `onPick`) et « Annuler » (replie, n'écrit rien). Les autres lignes gardent leur clic unique. `aria-expanded` / `aria-controls` sur la ligne ; le libellé accessible dit « après confirmation ».
- Une seule explication pour les deux chemins : `explicationContradiction(geste)` dans `batiment-rnb.ts`. La recherche par numéro garde son texte d'origine ; la liste conclut par son propre geste.

**Préservé** (tests) : DPE cohérent, `id_rnb` absent, plusieurs bâtiments dont l'un est désigné, RNB inconnu ou indisponible (aucune contradiction inventée) ; refus « aucun de ces diagnostics » sans confirmation ; bouton désactivé pendant une écriture en cours. DPE d'immeuble : toujours hors de la liste (FUT-74). Décisions historiques et protections atomiques de FUT-80 : non touchées (aucun changement serveur).

## B. L'aperçu avant achat dit ce que le dossier présentera

**Reproduction avant correction** : Villeurbanne, 2 rue des Alliés, la sonde exacte rend `none`, et l'écran disait « Aucun diagnostic de performance énergétique n'est rattaché à cette adresse dans la base ouverte. Ce dossier ne pourra donc qualifier ni la performance énergétique de ce logement, ni son comportement en été. » Le dossier payé propose 18 diagnostics de logements aux autres adresses du même bâtiment.

**Mesure** (`scripts/fut143/mesure-sonde-batiment.mjs`, 60 adresses du tirage du 31/07 + 7 témoins FUT-80, sans cache, lecture seule) :

| | médiane | p95 | max |
|---|---|---|---|
| sonde exacte (existante) | 76 ms | 148 ms | |
| RNB par adresse | 84 ms | 100 ms | |
| ADEME par `id_rnb` (2 jeux) | 80 ms | 111 ms | |
| chaîne ajoutée RNB → ADEME | 159 ms | 195 ms | 251 ms |

Zéro échec. Sur 47 adresses sans DPE exact : 2 ont des candidats de logement au même bâtiment, 1 un DPE d'immeuble seul. Statuts RNB : 48 confirmés, 9 ambigus, 3 sans bâtiment. Détail : `2026-10-26-fut143/mesure-sonde-batiment.json`.

**Choix : option A** (information vérifiée). La sonde est légère, ses appels sont ceux que le dossier fera à l'ouverture (même cache d'une journée), et elle ne bloque rien :
- le RNB part en même temps que la sonde exacte et le cadastre ; la recherche ADEME au bâtiment n'a lieu que si rien n'est à l'adresse et si le RNB désigne un seul bâtiment (règle du dossier, `georisques-logement`) ;
- délai de 2 s (dix fois le p95) ; au-delà ou en panne : `non_verifie`, la qualification répond quand même ;
- aucune valeur ne voyage : ni classe, ni numéro, ni nombre.

**États** (`qualification-meme-batiment.ts`, `matter.memeBatiment`, présent seulement si `dpe === "none"`) :

| état | condition | texte |
|---|---|---|
| `candidats` | ≥ 1 DPE **de logement** lu à une autre adresse (même si un jeu ADEME est tombé ou la page tronquée) | ligne « Autres adresses du même bâtiment · diagnostics à vérifier » ; « Des diagnostics de logements le sont néanmoins à d'autres adresses du même bâtiment : le dossier vous les présentera, à vérifier avant d'en retenir un pour ce logement. » |
| `aucun` | bâtiment unique, deux jeux ADEME répondus **en entier (non tronqués)**, aucun DPE de logement (immeuble seul compris) | « Sans diagnostic, ce dossier ne pourra qualifier… » + « la plupart des adresses » |
| `sans_objet` | plusieurs bâtiments, aucun bâtiment | idem `aucun` (le dossier ne cherchera pas au bâtiment) |
| `non_verifie` | RNB indisponible, délai dépassé, ADEME muette ou liste tronquée sans DPE de logement lu (correctif de revue du 27/10) | « Les autres adresses du même bâtiment n'ont pas pu être consultées à l'instant : le dossier les consultera à son ouverture, sans garantie d'y trouver un diagnostic. » |
| absent | DPE à l'adresse, ADEME muette à l'adresse, ou réponse d'un déploiement antérieur | textes d'avant ; la conséquence d'absence est désormais conditionnelle (« Sans diagnostic, … ») |

Tests : `qualification-meme-batiment.test.ts` (états, sonde, textes), `fut143-qualification-route.test.ts` (vraie route, vrais lecteurs ADEME/RNB, `fetch` servi par les fixtures : Villeurbanne, DPE exact sans sonde, immeuble seul, Puyravault, Bordeaux, RNB en panne ou muet, ADEME en panne ou partielle, ADEME muette à l'adresse).

## Vérifications

- `npm test` : 3 482 / 3 482 (dont les tests FUT-80 et de qualification) ; `tsc` propre ; `index:verify` ; `next build`.
- Lint des fichiers touchés : une erreur, identique sur `main` (`set-state-in-effect`, code de lancement de `DossierQualificationClient`) ; aucune nouvelle.
- Recette navigateur (`scripts/fut143/recette-rendu.mjs`, Chrome, 1440 px et Pixel 7) : 18 vérifications. A sur `/dev/fut80?cas=monchaux` : aucune écriture au clic ni à l'annulation, exactement un POST `user_confirmed` / `liste` après confirmation. B sur la vraie page `/dossier`, 8 états, dont Villeurbanne avec la **vraie** route (réponse `memeBatiment: "candidats"`). Aucun débordement horizontal. Captures : `2026-10-26-fut143/rendu/`.
- Défaut trouvé en recette et corrigé : un texte JSX multi-ligne placé après une expression perdait son espace initial (« laquelle: ne »). La phrase est composée en JS, espace insécable avant les deux-points.

## Limites

- La garde de A est côté écran. Le serveur accepte toujours une sélection `liste` d'un DPE contredit sans exiger de preuve de confirmation : c'est la règle FUT-80 (choix manuel autorisé), laissée telle quelle. Un client ancien ou une requête forgée peut donc encore l'enregistrer, comme avant.
- La phrase « Choisir une ligne la retient pour ce logement » reste générale ; la ligne contredite le nuance par son libellé accessible et par l'explication qui se déplie.
- `found` à l'adresse annonce toujours « la lecture du diagnostic énergétique rattaché à cette adresse » : grain exact, hors périmètre.
- La sonde ajoute un appel RNB à chaque qualification ancrée (85 ms, en parallèle), et une recherche ADEME de plus pour les adresses sans DPE dont le bâtiment est unique. Le RNB annonce 20 requêtes/s ; la route reste limitée à 20 qualifications par minute et par IP.

## Coexistence avec FUT-81

Aucun fichier commun avec la branche FUT-81 (992af92f). FUT-81 modifie `cadastre.ts` et `georisques-logement/route.ts`, sans toucher `probeCadastreAtPoint` ni la règle de recherche au bâtiment que la sonde reproduit.

## Recette clavier et lisibilité dans Chrome (27/10/2026)

Demandée par la revue indépendante (« lisibilité ordinateur/mobile et navigation clavier restent à vérifier »). L'extension Claude pour Chrome n'était pas connectée : Google Chrome installé, piloté par Playwright (`scripts/fut143/recette-clavier.mjs`), à 1440 px, sur Pixel 7 et à 360 px. Serveur de dev lancé sans clé Anthropic ; écritures interceptées et comptées. Bilan et captures : `2026-10-26-fut143/clavier/`.

**Clavier, au SHA `1451e1fd` : deux défauts trouvés et corrigés.**
1. Entrée sur la ligne contredite ouvrait l'explication, mais **le focus tombait sur la page** : la ligne n'était enveloppée qu'à l'ouverture, donc React la démontait. Elle garde désormais le même conteneur, ouverte ou fermée.
2. « Annuler » disparaissait sous le focus. Annuler et **Échap** (nouveau) rendent désormais le focus à la ligne.

**Parcours vérifié à chaque largeur, au clavier seul :**
- Tab jusqu'à la ligne, focus visible ;
- Entrée l'ouvre (`aria-expanded="true"`), aucune écriture ;
- Tab vers « Retenir quand même », puis Tab vers « Annuler », focus visible ;
- Entrée sur Annuler : explication fermée, focus sur la ligne, aucune écriture ;
- Espace l'ouvre, Échap la ferme, focus sur la ligne, aucune écriture ;
- Entrée, Tab, Entrée : une seule écriture `user_confirmed`.

Avant achat : Tab jusqu'au champ d'adresse, saisie, flèche bas et Entrée sur la suggestion (vraie route), puis Tab jusqu'à « Créer mon dossier », focus visible.

**Lisibilité : deux défauts corrigés.**

| | avant | après |
|---|---|---|
| état « diagnostics à vérifier » (11 px) | 4,0:1 | 7,31:1 |
| état « aucun à cette adresse » (11 px, existant) | 3,0:1 | 5,06:1 |
| hauteur de « Annuler » | 33 px | 44 px |

Les libellés d'état de la qualification passent en opacité pleine ; seule la pastille garde l'atténuation. Les autres contrastes étaient déjà AA : explication 12,7:1, mention de la ligne 4,69:1, paragraphe avant achat 16,88:1. Aucun débordement de page.

**Défaut existant, hors FUT-143, non corrigé.** Sous 412 px de large, la colonne du module Logement est plus large que l'écran et se fait rogner à droite. Le dépassement est de 38 px à 360 px, 23 px à 375 px et 8 px à 390 px. Cela touche le passeport, la section Énergie (« Chercher », la ligne de diagnostic, le panneau ajouté par FUT-143) et les titres en `nowrap`. **Les mesures sont identiques sur `main` 2af75b87 et sur la PR.**

Cause : la grille de la colonne garde la largeur minimale de ses enfants (`min-width: auto`), et certains contenus ne rétrécissent pas. Ce défaut touche la mise en page commune du module Logement, que FUT-81 modifie en ce moment : il mérite un ticket séparé.
