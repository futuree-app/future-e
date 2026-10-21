# FUT-41 · Premier lot : « Vos lieux » dans Ma décision

21 octobre 2026 · branche `feat/fut-41-vos-lieux`, depuis `main` 99dda219. Référence fonctionnelle :
`docs/audits/2026-10-21-fut41-fut86-articulation/README.md` (branche `explore/fut-41-centre-decision`).

## Ce qui change pour la personne

`/rapport/dossiers` (« Mes biens ») devient **« Vos lieux »**, sous le surtitre « Ma décision ». Une
ligne par lieu accessible :

1. le bien (adresse et commune) ou la commune ;
2. les échelles **réellement examinées**, lues dans le périmètre du dossier servi (emblème des trois
   échelles et phrase) ;
3. **la conclusion exacte du dossier**, citée telle qu'elle a été figée
   (`narrativePlan.verdict.headline.text` de la version servie) ;
4. sa **version et sa date** (marge) ;
5. son **état face au Projet actuel** (« répond à votre Projet actuel », « votre Projet a changé
   depuis : cette conclusion répond à votre Projet d'alors », ou « impossible de vérifier ») ;
6. **« Ouvrir le dossier »**, et pour un bien, une échelle en particulier (routes existantes) ;
7. le retour : l'entrée « Vos lieux » de la barre de navigation (ex-« Mes biens ») et les liens
   existants « Changer de bien », « Analyser un autre bien » mènent tous ici.

États sans conclusion, dits explicitement et sans rien générer : aucune conclusion enregistrée,
conclusion en préparation, conclusion illisible. La **commune de résidence** sans droit apparaît comme
« Lecture gratuite et partielle », sans conclusion de dossier.

## Garanties

| Garantie | Comment |
| --- | --- |
| Aucune recomposition | le texte vient de l'artefact servi ; une conclusion figée sous « 20 min » reste « 20 min » (test) |
| Aucune génération | aucune écriture, aucun appel de modèle ; un dossier sans artefact le dit |
| Version servie = celle du hub | même fonction `etatArtefact` ; repli sur `readLatestArtifact` si la candidate ne se relit pas |
| Appartenance et révocation | toutes les lectures filtrées par `user_id` ; biens lus par `listDossiers` (révoqués exclus) |
| Résidence | aucun contenu payant au seul titre de la résidence : sans droit (`decideTerritoryAccess`), pas de conclusion, même si un artefact existait |
| Commune et adresse | une ligne et un artefact par bien (`logement:<id>`) ; deux biens d'une commune ne sont jamais fusionnés ; un territoire porté par un bien ne se répète pas |
| Paris, Lyon, Marseille, Corse | clés d'artefact au grain commune (`communeParent`) ; deux droits d'arrondissement donnent une seule commune ; codes 2A / 2B lus tels quels |
| Pas d'effet de bord à la visite | la page ne fait que lire ; les liens vers les routes qui posent le lieu actif sont des `<a>` natifs, jamais préchargés |
| Lectures groupées | cinq requêtes quel que soit le nombre de lieux (profil, biens, droits, têtes d'artefacts, contenus des seules versions servies) |

## Hors de ce lot

Comparaison (FUT-22), « Faire le point », lieux simplement enregistrés, passe-recherche, observations,
refonte des URL, activation de `DECISION_RELEVE`. `/rapport/page.tsx`, `src/components/releve/` et la
bascule des présentations ne sont pas modifiés (coordination FUT-118).

**Besoin documenté pour FUT-118** : un lien « Retour à vos lieux » dans l'en-tête du dossier (hub
`/rapport`) demanderait de modifier `/rapport/page.tsx` ou `EnTeteDossier`, laissés au chantier
FUT-118. En attendant, le retour passe par la barre de navigation.

**Écart constaté, non corrigé ici** : les pages du compte utilisent `bg-canvas`, une couleur figée
(`#060812`) qui reste sombre en thème clair. « Vos lieux » utilise le fond du Relevé (`--r-fond`), qui
suit le thème.

## Contrôles

- Tests : `src/lib/decision/vos-lieux.test.ts`, 16 tests (assembleur et lecture sur une base simulée :
  deux comptes sans fuite, dossier révoqué, sans artefact, version en préparation, version illisible,
  conclusion ancienne, résidence, Paris, Corse, aucune écriture, nombre de requêtes). Suite complète :
  2 916 tests, 0 échec (avant l'ajout du banc).
- TypeScript (`tsc --noEmit`) : 0 erreur. Lint ciblé : 0 erreur. Build de production : réussi.
- Recette visuelle sur le banc `/dev/vos-lieux` (404 en production), lieux fictifs assemblés par la
  fonction de production : 1440, 390 et 360 px, sombre et clair, aucun débordement, chaque lien
  atteint au clavier avec un contour, texte rendu vérifié (`outils/recette-vos-lieux.cjs`).
- Visiteur non connecté : renvoyé vers `/connexion`, comme avant.
- **Non fait** : parcours sur un vrai compte connecté (aucun compte de test utilisé), Safari, lecteur
  d'écran.

Captures : `captures/vos-lieux-{1440,390,360}-{sombre,clair}.png`.
