# FUT-93 · Revue avant intégration : identité de la conclusion, récupération, six relectures

Date : 14 octobre 2026 · Branche : `fix/fut-93-relectures-rapport`. Suite de
`2026-10-12-fut93-relectures-rapport.md`. Tout est mesuré en local, sur un build de production
(Next 16.2.4, React 19.2.4) et le banc `/dev/fut93` ouvert temporairement hors développement. Aucune
génération réelle, aucune écriture en base, 0 appel Anthropic.

## 1. Une conclusion neuve à chaque rendu serveur : ce que cela coûte

Banc : sous la même clé par rendu que la vraie, une conclusion « rédigée » simulée, plus longue que son
repli et servie 250 ms après lui ; le lecteur est positionné sur les critères du projet, sous le
dossier ; une relecture est déclenchée. Deux présentations, 1280 et 390 px, 3 passages chacun.

| Effet | Mesure | Portée |
| --- | --- | --- |
| Repli déterministe visible | 292 à 305 ms à chaque relecture | seulement quand la rédaction diffère du repli (production) ; relue depuis le cache, sans génération |
| Position de ce que lit le lecteur | 0 px de déplacement (la page change de 54 px à 1280, de 163 px à 390) | Chrome compense (ancrage du défilement). **Safari non mesuré** : pas de WebKit sur ce poste |
| Sélection de texte DANS la conclusion | perdue (71 caractères, puis 0) | idem dans les deux présentations |
| Focus DANS la conclusion | rendu au document (démarche cliquable, sommaire du relevé) | idem |
| Mesure `priority_control_shown` | réémise à chaque relecture (remontage) | **corrigé**, voir plus bas |

Ces effets ne surviennent qu'après une relecture, c'est-à-dire après un geste du lecteur AILLEURS sur la
page (critère, lien, projet) : le focus et la sélection sont alors hors de la conclusion. Aucune
relecture n'est automatique sur `/rapport`. Compromis jugé acceptable : sans la clé, ces gestes ne
s'affichent pas du tout (témoin ci-dessous). Correctif conservé.

**Corrigé : la mesure d'affichage du contrôle prioritaire.** `PriorityControlActions` émettait
`priority_control_shown` à chaque montage ; la conclusion étant remontée à chaque relecture, chaque geste
du lecteur aurait compté un affichage de plus, et fait baisser le taux d'activation des lecteurs les plus
actifs. La garde vit désormais hors du composant, par document et par contenu affiché
(`premiereMesure`, `signatureAffichage`, testées). Différence assumée : revenir au même dossier par une
navigation interne, sans rechargement, ne compte plus un second affichage.

## 2. L'échec isolé de 60 s

**Ce qui est établi.** Rejoué 50 fois (scénario « premier rafraîchissement sans effet », deux
présentations, journal complet : états du bouton, relectures, échéance, déchargement) : **0 échec**.
3 passages sur 50 ont eu besoin du rechargement de secours, et il a eu lieu à chaque fois (31 à 43 s),
dont un qui commençait exactement comme l'échec isolé (une seule relecture partie, restée bloquée).
La course de React subsiste donc, rarement, sur la frontière extérieure du rapport (la section du bien),
qu'on ne peut pas remonter à chaque rendu sans réafficher pendant 7 s le dossier communal.

**Ce qui n'est pas établi** : pourquoi, lors de l'échec isolé, le rechargement n'a pas eu lieu. Son
journal n'avait pas été conservé. L'audit du code laisse deux voies, aucune observée :
- le composant a été démonté puis remonté pendant l'affichage : son état et son échéance sont perdus, et
  le bouton revient à « Mettre à jour l'analyse ». C'est la signature de l'échec (une relecture, aucun
  rechargement). C'est aussi la voie dangereuse : un nouvel appui lancerait une génération payante ;
- React ne valide plus aucune mise à jour, même hors transition : aucune minuterie fondée sur l'état ne
  pourrait alors agir.

**Le délai est-il garanti ?** L'échéance de 20 s est posée avant chaque relecture, levée seulement par
la relecture suivante ou le démontage. Vérifié pour une relecture bloquée par le réseau (28 à 32 s) et
pour les 3 blocages spontanés ci-dessus. **Attente indéfinie ?** Non dans les cas mesurés : « Mise à
jour en cours » est bornée par le serveur (`maxDuration` 60 s, pas de borne côté client) ; « Affichage
de votre analyse… » par deux relectures et un rechargement, puis « Afficher la nouvelle analyse ».
Aucun mécanisme ajouté : la défaillance n'est pas démontrée.

## 3. Les six autres relectures

Sur `/rapport`, `CriteresDuProjet`, `ProjectSummaryCard` (projet et relation à la commune),
`RepriseRecherche` et `LienAvecCeBien` sont sous le dossier et relisent la page qui porte la conclusion
à clé par rendu ; `LectureFactuelleDuBien` change en outre la version servie. `CommuneSetupBanner` ne
s'y affiche que sans commune, donc sans dossier, comme sur `/compte` et `/rapport/quartier` : aucune
conclusion rédigée, pas d'exposition établie. `RepriseRecherche` sert aussi `/ou-vivre`, sans conclusion.

**Validation fonctionnelle, critères du projet et lien avec le bien.** Les VRAIS composants sur le banc,
sous un dossier servi en 7 s ; leurs vraies requêtes (`/api/project/criterion`,
`/api/dossier/relation`) redirigées vers la mémoire du banc ; le geste doit faire apparaître, sans
rechargement, la ligne à jour ET le bandeau « Votre projet a changé » ou « Vous avez modifié votre lien ».

| | Critère gardé | Lien déclaré |
| --- | --- | --- |
| avec la clé par rendu (classique et Le relevé) | 36 / 36 | 36 / 36 |
| témoin, clé fixe (classique et Le relevé) | 0 / 6 : rien ne change à l'écran | 0 / 6 : le bouton s'allume, le bandeau ne vient jamais |

Bandeau affiché en 8,6 à 9,1 s, le temps de la relecture ; une requête, une relecture, aucun rechargement.

**Reste à valider** (session réelle et écritures en production, non faites) : les mêmes gestes sur un
vrai dossier ; `ProjectSummaryCard`, `RepriseRecherche`, `CommuneSetupBanner`, `LectureFactuelleDuBien`
n'ont pas été rejoués un par un ; le défilement sur Safari.

## 4. Intégration

Cette branche contient les deux commits de la PR #54 (`37f485cf`, `25a24e35`) puis les siens.
`origin/main` (`a25fa9fd`) est la base de la PR #54 : aucune divergence. Après une fusion « squash » de
la PR #54, la rebaser par `git rebase --onto origin/main 25a24e35` pour ne garder que ses propres
commits ; simulé sans conflit. Aucun changement parasite : `docs/handoff/AUTO-SNAPSHOT.md`, le bilan
de backlog non suivi et `supabase/.temp/` restent hors des commits.

Vérifications : suite complète 2552 / 2552, TypeScript, lint (42 signalements préexistants, aucun dans
les fichiers modifiés), build Webpack.

## 5. Une page en retard ne relance plus de génération payante

**Avant.** Côté serveur, `/api/dossier/actualiser` protégeait une génération EN COURS
(`prochaineVersionAReserver` rend `null`, la contrainte unique refuse un doublon), pas une génération
TERMINÉE : une page restée sur la v3 alors que la v4 était prête (bandeau remonté, état client perdu,
onglet resté ouvert) reproposait « Mettre à jour l'analyse », et l'appui réservait une v5, payante.

**Correctif.** Le client envoie `versionLue`, la version que sa page sert (`AnalyseAncienProjet` :
`versionServie` ; `LectureFactuelleDuBien` : 0, puisqu'elle ne s'affiche que sans version prête). Si
une version PRÊTE plus récente existe (`versionDejaServie`, `decision-artifact.ts`), la route la rend
comme `abouti`, sans générer ; le client l'affiche comme une livraison. Un projet modifié APRÈS la
dernière version est demandé depuis une page qui la sert : même numéro, la génération a lieu. Sans
numéro lisible (ancien client en cache, dossier périmé servi par assemblage), comportement inchangé.

**Tests.** `decision-artifact.test.ts` (page en retard : aucune génération ; projet modifié : v3
réservée ; version en échec, absence de version et numéros illisibles : aucune présomption) et
`fut10-livraison.test.ts` (la garde précède la réservation et la génération ; les deux appuis envoient
leur version). Suite 2555 / 2555, TypeScript, lint des fichiers modifiés, build Webpack.

**Limite.** Une page restée sur la v3 et dont le projet a changé APRÈS la v4 recevra d'abord la v4 ;
le bandeau se reproposera alors sur la v4, et le second appui générera. Un clic de plus, aucune
génération perdue.
