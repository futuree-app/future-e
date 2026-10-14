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

## 4. Résultats sur le banc

Vrais `CriteresDuProjet` et `LienAvecCeBien`, deux présentations ; journaux dans le compte rendu de session.

| Scénario | Résultat |
| --- | --- |
| normal (section en 7 s), 1280 et 390 px | 24/24 : bandeau en 9,1 à 11,0 s, 0 rechargement, jeton validé 10 à 20 ms après la fin de la réponse |
| lent (15 s), 1280 px | 8/8 : bandeau en 17 à 23 s, 0 rechargement (y compris au-delà de 20 s) |
| très lent (26 s), 1280 px | 4/4 : bandeau en 28 à 30 s, 0 rechargement (avec un plafond de 45 s, alors en vigueur) |
| bloqué (clé de conclusion figée), 1280 et 390 px | 24/24 : 23 blocages rattrapés par UN rechargement vers 30 s, bandeau en 31 à 41 s ; 1 blocage non reproduit, 0 rechargement |

Partout : une écriture, 0 appel de génération, même adresse, aucun second rechargement dans les 30 s
suivantes. Défilement après secours (version finale, ancre) : l'élément lu reste à la même hauteur
(écart 0 à 1 px).

**Non rejoué sur le code final** : les séries normale, lente et très lente ont tourné AVANT l'ancre de
lecture et le plafond de 30 s ; à rejouer (le scénario très lent passe à 22 s).

## 5. Risques résiduels

- Blocage où la réponse ne se termine jamais : secours au plafond, 30 s d'attente pour le lecteur.
- Pendant le rechargement, la section du bien revient après environ 7 s (repli communal entre-temps).
- Le témoin est chaotique par nature : un élément de page le bloquait ; seule sa forme actuelle (ne rend
  rien, en tête de section) est mesurée sans blocage, sur le banc. À vérifier en production.
- Safari non mesuré. Les quatre autres gestes partagent le mécanisme, non rejoués un par un.
