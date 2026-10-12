# FUT-93 · La version générée n'était pas affichée : cause, correctif, limites

Date : 12 octobre 2026 · Branche : `fix/fut-93-version-affichee`, depuis `origin/main` (`a25fa9fd`).
Preuves : `docs/audits/fut93-version-affichee/` (journal du test réel, captures, vidéos).

## 1. Le constat (test réel en production, 12/10/2026)

Sur un dossier de test autorisé (Nantes) : un seul POST `/api/dossier/actualiser`, réponse 200
`{ statut: "abouti", version: 3 }` en 10,3 s, v3 `ready` en base, v1 et v2 conservées, `router.refresh()`
déclenché 987 ms après, flux RSC terminé environ 7 s plus tard. L'écran gardait pourtant l'analyse du
12 août, le bandeau et « Analyse mise à jour ». Une relecture manuelle a ensuite affiché la v3.
Journal minuté : `fut93-version-affichee/test-reel-2026-10-12-journal.md`.

## 2. La cause établie

Établie par mesure, sur un banc qui reprend la structure de `/rapport` (`/dev/fut93` : repli communal en
`Suspense`, section du bien servie en 7 s, vrais composants `DossierDecisionSection` et
`DossierDecisionReleve`, version réellement incrémentée côté serveur par une route du banc) et une
sonde qui journalise séparément le RENDU et la VALIDATION (commit) de la version reçue.

| Hypothèse | Verdict | Mesure |
| --- | --- | --- |
| Décalage de déploiement | écartée | production `a25fa9fd` créée à 12:48 UTC, page chargée à 13:05 |
| Cache serveur | écartée | `/rapport` et ses lectures sont `force-dynamic`, `readLatestArtifact` lit la base sans cache |
| Contenu RSC périmé | écartée | le flux de la relecture contient la nouvelle version (`curl` et trace réseau : 40 536 octets, « 13 août ») |
| Streaming non résolu | écartée | le flux se termine ; sans `Suspense` et sans délai, le blocage persiste |
| État client obsolète | écartée | sans le composant Q1 (`window.next.router.refresh()` nu), même blocage, 4 fois sur 4 |
| **Réponse fraîche rendue mais jamais validée par React** | **établie** | la sonde journalise « rendu v2 » puis jamais « validé v2 » |

Bissection (build de production local, Next 16.2.4, React 19.2.4, relecture nue) :

| Arbre rendu | Relecture validée |
| --- | --- |
| sonde seule, avec ou sans `Suspense`, 0 ou 7 s | 6 / 6 |
| `DossierDecisionSection` en `logementStatus="pending"` (conclusion rendue directement) | 3 / 3 |
| `DossierDecisionSection` en `done` (conclusion rédigée sous `Suspense`), classique ou Le relevé | 0 / 9 |
| idem, la frontière de la conclusion portant une clé liée à la version servie | 10 / 10 |

**Cause établie.** Une relecture du routeur (une transition) dont la nouvelle charge contient la
frontière `Suspense` de `ConclusionRedigee` (composant serveur asynchrone), DÉJÀ RÉVÉLÉE à l'écran avec
la même identité, est rendue par React mais n'est pas validée : la transition reste suspendue et l'ancien
écran demeure. En mode développement, la relecture s'appliquait (d'où l'échec non vu avant la production).

**Ce qui n'est pas établi** : le mécanisme interne de React ou de Next qui empêche la reprise de cette
transition. Il est reproduit et contourné, pas expliqué ligne à ligne.

## 3. Le correctif

**À la source.** La frontière de la conclusion rédigée porte une clé liée à la version servie
(`${scopeKey}:${versionServie ?? generatedAt ?? "vivant"}`), dans les deux présentations
(`DossierDecisionSection`, `DossierDecisionReleve`). Une nouvelle version est une nouvelle frontière :
React la valide aussitôt (repli déterministe), puis la conclusion arrive. Aucune règle, aucune
génération ni aucun contexte d'achat n'est touché.

**L'identité de la version servie.** `StoredArtifact.servedVersion` descend jusqu'à Q1 :
`DossierAvecLogement` (portée du bien) et `/rapport` (portée commune, repli et dossier de commune seule)
→ `DossierDecisionSection` → `DossierDecisionReleve` → `AnalyseAncienProjet` (`versionServie`, nulle
pour un dossier assemblé à l'instant).

**L'expérience.** À `abouti`, N est la version attendue.
1. « Mise à jour en cours » pendant la génération ;
2. « Nouvelle analyse prête » à la confirmation du serveur (900 ms) ;
3. « Affichage de votre analyse… » pendant la relecture, l'ancienne analyse restant lisible ;
4. la nouvelle analyse, avec sa date : « affichée » se DÉDUIT de `versionServie >= N` pour la même
   portée (`etatVisible`), jamais d'un rafraîchissement, d'une date ou de la disparition du bandeau.
« La page l'affiche dans un instant » a disparu.

**La récupération, bornée** (`etapeAffichage`, pure et testée) : une relecture ; si elle se termine sans
servir N, une seconde, une seule ; si une relecture reste bloquée au-delà de 20 s (`DELAI_RELECTURE_MS`,
la relecture de production prend 7 à 8 s), un seul rechargement complet de la même adresse (le dossier
actif est conservé en base, `user_profiles`). La page rechargée sait qu'une version N est attendue
(stockage de session, 10 min, propre à ce dossier et cette portée). Si N n'est toujours pas servie :
« Afficher la nouvelle analyse », avec « La nouvelle analyse est prête, mais la page n'a pas pu
l'afficher. Le bouton recharge la page, sans relancer de calcul. » Aucune étape ne renvoie de POST.
Sans stockage de session disponible, on ne recharge pas automatiquement : on le dit, et on propose le
rechargement.

« Relire la page » (état « déjà en cours ») recharge désormais la page entière : une relecture du
routeur y était exposée au même blocage, puisque la version servie, et donc la clé, ne change pas.

**Centrage du bouton.** Le corps du libellé était 1,75 px trop haut (mesuré sur capture : la boîte de
ligne réserve la place des jambages). Le bouton centre en Flex, et le libellé rogne sa ligne entre la
hauteur des capitales et la ligne de base (`text-box: trim-both cap alphabetic`). Mesure géométrique
après correction : libellé −0,01 px, emblème et coche 0,00 px, à 1440 et 390 px, mouvement réduit
compris. Sans `text-box` (Firefox), le centrage Flex reste, à l'écart d'origine près.

## 4. Vérifications

Scénarios d'intégration sur le banc (build de production local, où le défaut se reproduit), dans les
deux présentations, tous conformes :

| Scénario | Résultat |
| --- | --- |
| `abouti`, version servie | v2 affichée à la première relecture, sans rechargement : 10 / 10 |
| premier refresh sans effet (contenu encore ancien) | v2 affichée après l'échéance et un rechargement, 1 requête |
| refresh lent (12 s) | v2 affichée sans récupération |
| relecture bloquée | v2 affichée après un seul rechargement complet (28 à 32 s), 1 requête |
| version encore ancienne après rechargement | « Afficher la nouvelle analyse », puis v2, 0 requête de plus |
| échec de chargement de la relecture | v2 affichée, 1 requête |
| changement de dossier pendant l'attente | le dossier ouvert ensuite reste au repos, aucun rechargement |
| six appuis rapides | 1 requête |

Tests unitaires : états, récupération bornée (simulation exhaustive : 2 relectures et 1 rechargement au
plus, jamais de POST), mémoire de rechargement, câblage de la version servie dans les deux
présentations. Suite complète 2549/2549, TypeScript, lint (42 signalements préexistants, aucun dans
les fichiers modifiés), build Webpack.

Captures (`images/`, densité 2) : huit états × deux présentations × 1440 et 390 px. Vidéos (`videos/`) :
la séquence complète, classique sur ordinateur, Le relevé sur mobile.

## 5. Limites

- **Pas de nouvelle génération réelle** : sans votre autorisation, le correctif n'est validé qu'en local
  (build de production, banc fidèle). Il reste à le confirmer par un clic réel après déploiement.
- **Mécanisme interne non expliqué** (voir § 2) ; une montée de version de React ou de Next devra être
  revérifiée sur le banc (`/dev/fut93`, en développement ; la reproduction exige un build de production,
  en ouvrant temporairement le banc hors développement).
- **Autres relectures de la page** : `CriteresDuProjet`, `LienAvecCeBien`, `ProjectSummaryCard`,
  `LectureFactuelleDuBien`, `RepriseRecherche`, `CommuneSetupBanner` appellent aussi `router.refresh()`.
  Quand la version servie ne change pas, la clé ne change pas : ils sont exposés au même blocage (par
  exemple, le bandeau pourrait n'apparaître qu'au rechargement après une modification du projet). Non
  vérifié en production, hors de ce lot.
- **Annonce aux lecteurs d'écran** : quand la nouvelle version s'affiche, le bandeau disparaît avec sa
  région `aria-live` ; la date nouvelle est visible, mais aucune phrase n'est annoncée.
