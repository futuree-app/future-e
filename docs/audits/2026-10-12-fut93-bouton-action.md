# FUT-93 · « Mettre à jour l'analyse » raccordé au bouton Q1

Date : 12 octobre 2026 · Branche : `feat/fut-93-bouton-action`, depuis `main` (`dc8464a6`, FUT-10 et FUT-75 fusionnés).
Vidéos et captures : `docs/audits/fut93-bouton-action/`.

## Smoke test du site public (avant développement, lecture seule)

Accueil, `/ou-vivre`, `/comparateur`, `/pourquoi`, `/professionnels`, `/connexion`, `/dossier`, une page
`/chaleur`, `/agir`, `/savoir`, le sitemap : 200. Checkout sans session : redirection vers `/connexion`
avec retour au checkout. Avec la session du porteur : l'espace compte, le rapport existant (bandeau
FUT-10 « Votre projet a changé… » et son bouton, non cliqué), la navigation vers Territoire, et la page
de checkout d'une adresse publique avant paiement (récapitulatif, 29 €, « Votre projet est déjà
renseigné ») s'affichent ; aucune erreur console. Aucun paiement, aucune actualisation, aucune écriture.
Observation non bloquante : `/rapport/quartier` affiche « Le chargement prend plus de temps que prévu »
environ 4 s après le clic, puis se charge en moins de 12 s.

## Ce qui change

`AnalyseAncienProjet.tsx` (les deux présentations, classique et Le relevé, l'utilisent tel quel) :
- le bouton est `BoutonAction` : il s'enfonce à la pression, passe en attente (l'emblème ne paraît
  qu'après 300 ms), puis devient la confirmation ou l'échec ;
- l'état n'avance que par la réponse réelle d'`/api/dossier/actualiser` (`issueDepuisReponse`,
  `suivantAction`) : « Analyse mise à jour » exige `{ statut: "abouti", version }` ; `en_cours` donne
  « Relire la page », qui relit sans relancer de génération ;
- la confirmation se lit 900 ms, puis la page se relit et sert la nouvelle version ; l'analyse affichée
  ne bouge pas pendant l'attente ni après un échec ;
- une réponse arrivée pour un autre dossier, ou après la disparition du bloc, ne confirme rien ;
- une ligne `aria-live` sous le bouton dit l'attente, la confirmation ou le motif d'échec (projet
  manquant, contexte d'achat illisible, génération, connexion), toujours avec « l'analyse ci-dessous
  reste inchangée » ;
- les trois raisons de FUT-10 (projet, lien avec le bien, voisinage) et leurs phrases sont intactes.

`etat-action.ts` : `gesteAppui` (envoyer, relire, ignorer), `compteRenduAction`, `LECTURE_CONFIRMATION_MS`.
`bouton-action.module.css` : le survol ne s'applique plus qu'au repos et à l'échec (après un clic, la
souris restait sur la confirmation et rendait son texte illisible). Banc `/dev/fut91` : cas `lien=1`.
Aucun changement de route, de génération, de Stripe, de Supabase ni de règle métier ; `DECISION_RELEVE`
inchangé.

## Vérifications

Dans les vrais composants (`/dev/fut91`, dossier d'adresse public de Nîmes, réponses de la route
simulées dans le navigateur selon son contrat réel), en présentation classique et dans Le relevé :
48 contrôles conformes. Les trois raisons ; attente courte (pas d'emblème), attente longue (emblème,
ancienne analyse affichée) ; succès seulement sur `abouti` avec version, relecture après 900 ms ;
`en_cours` puis « Relire la page » sans seconde demande ; 409, 503, 502, réseau coupé, `abouti` sans
version : échec dit, aucune relecture ; réessai ; cinq appuis rapides pour une seule demande ;
changement de présentation pendant l'attente : rien ne se confirme ; clavier (focus conservé jusqu'au
succès) ; mouvement réduit (emblème immobile, transitions à 0).

Suite complète 2532/2532, TypeScript, lint (42 signalements préexistants, aucun dans les fichiers
modifiés), build Webpack.

**Performance** (processeur ralenti 6 fois, mode développement, trois essais, appui puis attente puis
succès) : classique 53 à 56 i/s, Le relevé 48 à 57 i/s, à 1280 et 390 px. Une tâche longue au moment de
l'appui (150 à 300 ms ralentie, soit 25 à 50 ms réels) : le profil attribue moins de 5 ms au code du
composant ; le reste est le rendu du navigateur et les enregistreurs d'audience (PostHog, Clarity)
qui observent le DOM. Aucun repli nécessaire.

## Vidéos et captures

| Fichier | Contenu |
| --- | --- |
| `videos/q1-classique-ordinateur.mp4`, `videos/q1-classique-mobile.mp4` | attente longue et succès ; échec 502 puis réessai ; déjà en cours puis « Relire la page » |
| `videos/q1-releve-ordinateur.mp4`, `videos/q1-releve-mobile.mp4` | les mêmes gestes dans Le relevé (toucher sur mobile) |
| `images/q1-{classique,releve}-{repos,attente,succes,echec}-{1440,390}.jpg` | chaque état, à vraie largeur |
