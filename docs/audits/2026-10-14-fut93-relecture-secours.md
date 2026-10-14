# FUT-93 · Le secours des relectures : un témoin validé, sinon un seul rechargement

Date : 14 octobre 2026 · Branche : `fix/fut-93-relecture-secours`, depuis `main` (`a85fa930`).
Suite de `2026-10-14-fut93-test-production.md`. Banc `/dev/fut93` (vrais `CriteresDuProjet` et
`LienAvecCeBien`), build de production local, Next 16.2.4, React 19.2.4 : aucune dépendance modifiée.
Aucune génération réelle, aucune écriture en base, 0 appel Anthropic.

## 1. Diagnostic

En production, après un changement de lien, la relecture de `/rapport` arrive en entier mais React ne
la valide pas : l'écran garde l'ancien état. C'est la course de React sur la frontière EXTÉRIEURE (la
section du bien, servie en 7 s), que la PR #56 n'a pas remontée à chaque rendu. On ne la résout pas :
on constate si la relecture est affichée, et sinon on recharge une fois.

## 2. Ce qui a été écarté, et pourquoi

| Piste | Écartée parce que |
| --- | --- |
| Remonter la section du bien à chaque rendu | le dossier communal se réafficherait 7 s à chaque geste |
| Reprendre `etapeAffichage` de Q1 telle quelle | elle constate l'affichage par la VERSION servie ; ces six gestes ne changent pas de version |
| Recharger sur la seule fin de la réponse serveur | un préchargement du même chemin s'en distingue mal (aucun en-tête visible) : rechargement prématuré possible |
| Un témoin rendu comme élément de la page (jeton dans un attribut) | **il bloquait lui-même la relecture** sur le banc, en tête comme en fin de section, dans les deux présentations (scénario normal : 0 affichage, secours au plafond) |

## 3. Le correctif

- **Le signal : `TemoinDeRendu`**, en tête de `DossierAvecLogement`, donc derrière la frontière exposée.
  Il reçoit un jeton neuf à chaque rendu serveur (`jetonDeRendu()`), ne rend RIEN, et note dans un
  effet le jeton validé. Un effet ne s'exécute qu'après la validation par React : un nouveau jeton noté
  prouve que la relecture, et donc l'état enregistré, est à l'écran. Aucun délai ne décide d'un succès.
- **`relireLaPage(router)`** remplace `router.refresh()` dans les six gestes (`CriteresDuProjet`,
  `LienAvecCeBien`, `ProjectSummaryCard` ×2, `RepriseRecherche`, `CommuneSetupBanner`,
  `LectureFactuelleDuBien`). Sans témoin sur la page (commune seule, `/ou-vivre`, `/compte`, lecture
  factuelle) : relecture simple, comme avant. Le suivi vit hors des composants : le geste peut être
  démonté par la relecture elle-même.
- **La décision (`etapeRelecture`, pure et testée)** : nouveau jeton validé, c'est affiché. Sinon,
  au-delà du délai de Q1 (`DELAI_RELECTURE_MS`, 20 s, réutilisé), un rechargement complet de la même
  adresse. Tant qu'aucune réponse de relecture n'est arrivée, on attend encore, jusqu'au plafond
  (`PLAFOND_RELECTURE_MS`, 30 s) : un serveur lent n'est pas un blocage.
- **Un seul rechargement par geste, sans boucle** : le suivi est clos avant de recharger, et une page
  rechargée n'en ouvre aucun (seul un nouveau geste le fait). Aucun appel à `/api/dossier/actualiser`.
- **Le défilement** : la position est mémorisée (`sessionStorage`, même adresse, 60 s) et rendue par le
  témoin une fois la section arrivée, la restauration du navigateur tombant sur une page encore courte.
- Q1 garde sa récupération (par version) : rien n'est dupliqué ni modifié. Moteur, prix, protection
  contre les doublons : intouchés.

## 4. Résultats sur le banc (code final, 15/10/2026)

Vrais `CriteresDuProjet` et `LienAvecCeBien`, deux présentations. Journaux hors dépôt (`.banc-fut93/`).

| Scénario | Résultat |
| --- | --- |
| normal (section en 7 s), 1280 et 390 px | 24 : 23 affichés en 8,5 à 10,3 s sans rechargement ; 1 blocage SPONTANÉ (Le relevé, critère), rattrapé par un rechargement à 31 s, bandeau à 31,1 s |
| lent (15 s), 1280 px | 8/8 : bandeau en 16,5 à 17,5 s, 0 rechargement |
| très lent (22 s, au-delà du délai de 20 s), 1280 px | 4/4 : bandeau en 23,5 à 24,3 s, 0 rechargement |
| bloqué (clé de conclusion figée), 1280 et 390 px | 24/24 : 23 blocages rattrapés par UN rechargement vers 30 s, bandeau en 31 à 41 s ; 1 blocage non reproduit, 0 rechargement |

Partout : une écriture, **0 appel de génération**, même adresse, aucun second rechargement dans les
30 s suivantes. Le jeton est validé 10 à 120 ms après la fin de la réponse du serveur.

**Le témoin ne bloque pas lui-même la relecture.** Comparaison contrôlée sur le même banc, 40 relectures
de chaque côté : avec le témoin, 0 blocage ; sans, 0 blocage. Sur l'ensemble du code final : 1 blocage
sur 64 relectures avec le témoin, contre 0 sur 40 sans (et 0 sur 115 lors de la revue du 14/10) : écart
non significatif, compatible avec la course naturelle, déjà mesurée sur la frontière extérieure (3 sur
50 dans Q1). La forme rejetée du témoin, elle, bloquait à chaque essai.

**Le défilement.** Avec l'ancre, l'élément lu reste à la même hauteur à travers le rechargement (écart de
0 à 1 px), dès le chargement de la page puis à l'arrivée de la section. Les déplacements de 102 et
109 px observés à 390 px sur le geste du lien PRÉEXISTENT au secours : ils se produisent au moment du
geste, à l'identique dans le scénario normal sans aucun rechargement (159 → 49 px), et le secours les
conserve sans les aggraver.

**Vérifications** : suite complète 2562 / 2562 (2555 sur `main` + 7), TypeScript, lint des fichiers
modifiés, build Webpack. Lancée en même temps qu'une autre charge (TypeScript, Chrome du banc), la suite
rapportait moins de tests (2515, 2528) sans échec : des fichiers entiers manquaient au rapport ; seule,
elle les compte tous. Comportement du lanceur sous charge, sans lien avec ce correctif.

## 5. Risques résiduels

- Blocage où la réponse ne se termine jamais : le secours attend son plafond, 30 s pour le lecteur.
- Pendant le rechargement, la section du bien revient après environ 7 s (repli communal entre-temps).
- Le témoin n'est mesuré que sur le banc ; la production le confirmera.
- Safari non mesuré. Les quatre autres gestes partagent le mécanisme, non rejoués un par un.
- Le rechargement relit `/rapport` comme un rechargement manuel : les rattrapages automatiques déjà
  prévus à l'ouverture d'un dossier s'y appliquent comme avant ; aucun appel à la génération demandée.
