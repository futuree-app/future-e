# FUT-27 · Continuité Recherche → Projet (08/11/2026)

Doctrine : un Projet durable, des recherches libres, des changements volontaires.

## 1. Déjà en place avant FUT-27 (livré par FUT-8, le 02/10)

- « Où vivre » n'a **aucun chemin d'écriture** du Projet : ses seuls appels réseau sont `parse`, `match`, `synthesize`, `ask`.
- Le seul passage vers le Projet est le geste `RepriseRecherche` : aperçu d'abord (`mode: "apercu"`, n'écrit rien), écriture seulement sur « Enregistrer comme projet » (`mode: "enregistrer"`). « Annuler » referme sans requête.
- Le serveur nettoie la recherche (`parsedPourLeProjet` : exclusion de l'ancre, fourchette de taille de l'ancre, bornes non chiffrées retirées) et écrit un projet **neuf** : aucune condition sans compromis, précision ni choix sur un critère proposé.
- Double garde de concurrence : `decisionReprise` (le projet vu dans l'aperçu est-il toujours en base ?) puis `ecrireProjetSiInchange` (garde SQL sur `updatedAt`). Échec → 409 « Votre projet a changé entre-temps ».
- Un seul Projet par compte : colonne `user_profiles.user_project`, ligne créée par le trigger `on_auth_user_created`, toujours mise à jour (`update`), jamais insérée.
- Droits : la route lit l'utilisateur de la session Supabase (401 sinon) et n'écrit que sa ligne (`eq("user_id", user.id)`, RLS).

## 2. Ce qui ne fonctionnait pas

**Reprise depuis /rapport cassée depuis le 06/10/2026.** `reprise-recherche.ts` avait recopié la version de session 3. FUT-36 (06/10) est passé à 4, FUT-129 (23/10) à 5. Depuis, /rapport ne reconnaissait plus aucune recherche : le geste n'apparaissait jamais. Sur /ou-vivre, la reprise reçoit la recherche en mémoire et n'était pas touchée.

Reproduit sur une session réelle (recette locale du 08/11) : la session écrite par « Où vivre » porte `v: 5` ; le lecteur de `origin/main` rend `null`, le correctif la relit.

Pourquoi aucun test n'a vu le défaut : le test de la reprise fabriquait une session `v: 3` à la main au lieu de lire ce qu'« Où vivre » écrit.

Défauts secondaires dans l'aperçu :
- La phrase « Ses conditions et précisions ne seront pas reprises » s'affichait dès qu'un seul geste était perdu, y compris un simple choix sur un critère proposé. Elle racontait ce que le projet ne portait pas.
- Les demandes non mesurées (`horsMesure`) passent dans le projet, mais l'aperçu ne les nommait pas : leur absence de la liste laissait croire qu'elles étaient perdues.
- L'intention (achat, location), gardée par la route, n'était pas annoncée.

## 3. Ce qui a été corrigé

- `src/lib/comparateur/session-ou-vivre.ts` porte seul la clé, la version (avec son historique), le délai, le sérialiseur et le lecteur. « Où vivre » (sauvegarde, restauration, effacement), la reprise de /rapport et le script de retour arrière de `/ou-vivre/page.tsx` l'importent. La reprise applique les mêmes refus que la restauration : version, délai de 2 h, date future, session non reconstituable (FUT-139).
- L'aperçu nomme les demandes non mesurées conservées, compte exactement ce qui est abandonné (`phraseAbandon`) et dit si l'intention est conservée.
- La construction du projet écrit par la reprise est extraite en fonction pure (`projetDepuisRecherche`), testée directement.

## 4. Contrat, cas par cas (tests : `src/lib/fut27-recherche-projet.test.ts`)

| Cas | Comportement vérifié |
|---|---|
| A · projet existant, autre recherche | Aucun appel d'écriture depuis « Où vivre » ; l'aperçu laisse le projet intact. |
| B · reprise volontaire | Aperçu : retenus, gardés sans mesure, propres à la recherche, remplacé, abandonnés (compte exact), intention conservée. Écriture seulement sur « Enregistrer ». |
| C · Nantes, Rennes, Bordeaux | Chaque recherche efface la précédente (`clearSession` avant le parse) ; /rapport ne propose que la dernière ; le projet ne bouge pas. Recette navigateur : trois sessions v5 successives, restauration de Bordeaux. |
| D · projet modifié entre-temps | 409 si le projet a changé, est apparu ou a disparu depuis l'aperçu ; garde SQL derrière. |
| E · anonyme puis connecté | La session ne porte aucun compte : la recherche faite sans compte se relit après connexion. Anonyme : aucun geste, route en 401 (vérifié en recette). La connexion ne touche ni la recherche ni le projet. |
| Droits | Identité lue dans la session, jamais dans le corps ; une seule ligne par compte. |

## 5. Limites connues, hors périmètre

- **Navigateur partagé.** La session vit dans le navigateur, pas dans le compte. Un second compte connecté sur le même navigateur dans les 2 h verrait la dernière recherche proposée. C'est déjà le cas sur /ou-vivre, page publique qui restaure cette recherche pour tout visiteur. Le serveur, lui, n'écrit que dans le projet du compte connecté.
- **`coerceParsed` garde les clés inconnues** d'un `parsed` envoyé par le navigateur (ici comme dans `PATCH /api/profile`). Aucune n'est lue comme geste, et un test le vérifie. Durcissement possible côté frontière de confiance (FUT-155).
- **`futuree:projet:parsed`, `:label`, `:labels`** (dépôt du Pack et touche perso du paywall) portent le mot « projet » mais sont des copies de recherche, sans version ni délai. Elles n'écrivent jamais le Projet. À renommer ou borner dans FUT-29.
- La reprise remplace tout le projet, sans fusion partielle.

## 6. Pour la suite (FUT-28, FUT-41, FUT-22, FUT-49)

Réutilisable tel quel : le triplet aperçu → décision → écriture gardée (`apercuComplet`, `decisionReprise`, `ecrireProjetSiInchange`) et la règle « le navigateur ne peut pas fabriquer de geste ». FUT-28 (accueil → projet) doit emprunter ce triplet, pas une écriture directe.

Rien n'empêche la suite, mais ces pièces n'existent pas encore :
- **Shortlist multi-adresses (FUT-41, FUT-22)** : aucun objet « lieux candidats » côté serveur. La recherche est un emplacement unique dans le navigateur ; les candidats devront vivre côté serveur, rattachés au compte (au plus près de `address_dossiers` et de `place_relation`), jamais dans `user_project`.
- **Pass Recherche (FUT-49)** : aucune recherche n'est persistée côté serveur, et il n'y a pas d'historique. Un droit dans le temps suppose des recherches enregistrées et un octroi ; rien de cela n'a été créé ici.
- **Fusion** : reprendre une partie d'une recherche (un critère, une zone) dans un projet existant n'est pas possible ; seul le remplacement complet l'est.

## 7. Réserve de la contre-revue : la déconnexion n'effaçait pas la recherche (corrigé le 08/11)

**Constat (Work, recette connectée sur 38ecfb49).** La recherche « Où vivre » restait 2 h dans le `localStorage` après une déconnexion explicite. Elle restait affichée en anonyme. Un second compte connecté sur le même navigateur se la voyait proposer, avec aperçu et enregistrement possibles. Il n'accédait ni au Projet ni aux dossiers du premier compte, mais il voyait le contenu de sa recherche. Le défaut existait déjà dans « Où vivre » ; la reprise depuis /rapport l'exposait davantage.

**Défaut voisin trouvé au passage.** Les réponses du questionnaire (`futur-e:wizard`, sessionStorage) survivaient aussi à la déconnexion. Sur le même onglet, `WizardAnswersSync` les aurait poussées dans le profil du compte suivant (`PATCH /api/profile`), et la « première lecture » de /rapport les aurait affichées. Elles sont purgées avec le reste.

### Correction

- **Où part la purge.** Le formulaire « Se déconnecter » de /compte devient un composant client (`FormulaireDeconnexion`). Juste avant la Server Action, il efface les recherches du navigateur. La Server Action ne change pas : `signOut` Supabase, puis redirection vers `/`. Rien n'est effacé à la connexion ni à l'inscription.
- **Ce qui est effacé** (`src/lib/purge-recherche.ts`) :
  - dans le `localStorage`, la session « Où vivre » et ses trois copies `futuree:projet:parsed`, `:label` et `:labels` (Pack et paywall) ;
  - dans le `sessionStorage` de l'onglet, le questionnaire et la commune choisie sur l'accueil.
- **Ce qui ne l'est jamais** : le thème, le consentement, l'horizon, le compteur de questions de l'accueil, et toutes les données serveur (Projet, dossiers, factures, droits). Le code ne fait aucun `clear()`, et un test le vérifie.
- **La barrière.** La purge écrit sa date (`futuree:recherche:purgee`) avant d'effacer. Deux règles en découlent :
  - aucune session écrite avant cette date n'est relue, ni par « Où vivre », ni par la reprise. Le paramètre `purge` de `lireSessionOuVivre` est obligatoire : un lecteur ne peut pas l'oublier sans erreur TypeScript ;
  - un écran dont la mémoire date d'avant la purge n'écrit plus. Cela couvre la sauvegarde de session, les priorités du paywall et la copie du Pack. Une recherche lancée après la purge avance la date de l'écran et s'enregistre normalement.
- **Les autres onglets** (`purge-recherche-navigateur.ts`) apprennent la purge de trois façons :
  - l'événement `storage`, pour les autres onglets ;
  - un événement propre au site, pour le même document ;
  - `pageshow` (page servie par le cache du retour arrière) et `visibilitychange` (onglet qui se réveille).

  À ce signal, « Où vivre » oublie la recherche affichée et le texte saisi. Il abandonne aussi les réponses encore en route (parse, match, synthèse, AskFuture). La reprise oublie la recherche, l'aperçu affiché et les aperçus en cours de chargement. La page de conviction du Pack et la touche perso du paywall oublient ce qu'elles montraient. `EcoutePurgeRecherche` (layout racine) efface le `sessionStorage` de chaque autre onglet.
- **Pas d'effacement à tort.** Un onglet qui apprend la purge en retard oublie sa mémoire, mais ne touche jamais au stockage. Il ne peut donc pas supprimer une recherche lancée après la déconnexion.

### Scénarios et résultats

Tests : `src/lib/fut27-deconnexion.test.ts`, 12 tests. Ils rejouent le navigateur avec de vrais stockages : un `localStorage` partagé, un `sessionStorage` par onglet. Ils vérifient aussi le branchement dans le code. Par mutation, ils échouent bien quand la barrière est neutralisée (B, C, E) ou quand la purge n'efface plus le `localStorage` (A, B, C, E).

Recette navigateur : `scripts/fut27-deconnexion-recette.mjs`, sur le build local de cette version, en anonyme, sans aucun appel `/api/profile` ni `/api/project`.

| Cas | Résultat |
|---|---|
| A · déconnexion simple | Les quatre clés sont effacées. Ni « Où vivre » ni la reprise ne relisent Bordeaux. Thème et consentement sont intacts (test et recette). |
| B · navigateur partagé | Le compte B ne relit rien. Même si on réinjecte la session de A, elle est refusée, car elle date d'avant la purge. Sans purge, elle se relisait (test témoin). |
| C · plusieurs onglets | Recette avec deux onglets « Où vivre » ouverts sur Bordeaux et une purge depuis un troisième. Les deux reviennent à un formulaire vide et le questionnaire de l'autre onglet est effacé. L'onglet « endormi », qui ne reçoit pas d'événement, garde Bordeaux affiché : son clic sur une carte n'écrit rien. Le même clic sur Rennes, cherchée après la purge, écrit (témoin). Au réveil, il oublie Bordeaux. Après un retour arrière vers /ou-vivre, la page est vide. |
| D · anonyme puis connecté | La recherche faite sans compte se relit après la connexion. Passer par /connexion n'efface rien. Aucun code de connexion ou d'inscription n'appelle la purge (test). |
| E · nouvelle recherche après la purge | Rennes est enregistrée après la purge et restaurée dans un nouvel onglet. Les anciens onglets ne l'effacent pas. Le délai de 2 h s'applique toujours. |
| F · non-régression | Versions, délai et sessions invalides : tests FUT-27 inchangés et verts. Gardes de concurrence, droits et absence d'écriture implicite du Projet : inchangés. Suite complète : 4 378 tests passent, 0 échec. |

### Ce que la recette n'a pas pu exécuter, et pourquoi

- **Le clic réel sur « Se déconnecter »** suppose un compte connecté. Le seul Supabase joignable depuis ce poste est celui de production, et Docker n'est pas installé, donc aucun Supabase local. Pour ne rien écrire en production, la recette applique la purge comme le fait `purgerRecherchesTemporaires`, depuis un troisième onglet. Les tests vérifient que le formulaire appelle bien la purge avant la Server Action. Il reste à rejouer ce clic avec un compte de test autorisé.
- **La reprise sur /rapport** n'est visible que connectée. Son oubli à la purge est vérifié par les tests, pas en navigateur.
- **Le cache du retour arrière** : Chrome en mode automatisé n'a pas servi la page depuis ce cache (`persisted: false`). Le chemin observé est le rechargement, et la page était vide. Le chemin `pageshow` persisté est branché et testé dans le code, pas observé.

### Limites restantes

- ~~La purge part du formulaire client. Un clic avant que la page /compte soit interactive enverrait la Server Action sans purger.~~ Corrigé, voir la section 8.
- Une expiration de session sans déconnexion explicite ne purge rien. Ce n'est pas le périmètre : la règle vise le départ volontaire.
- Les onglets du compte (/rapport, /compte) gardent la page déjà affichée jusqu'à la prochaine navigation, qui mène alors à la connexion. Seules les recherches et les aperçus sont oubliés sur place.

## 8. Déconnexion envoyée avant l'hydratation, ou sans JavaScript (corrigé le 08/11)

**Constat.** La purge vivait dans le `onSubmit` du formulaire, qui n'existe qu'une fois la page hydratée. Un clic pendant le chargement de /compte, ou un navigateur sans JavaScript, envoyait le formulaire en simple POST : la session était fermée, la recherche restait.

**Choix écarté : un bouton inactif jusqu'à l'hydratation.** Sans JavaScript, le bouton resterait inactif pour toujours et la déconnexion deviendrait impossible. Fermer la session reste prioritaire.

### Correction : le formulaire dit s'il a purgé, sinon le serveur le rappelle

- **Le formulaire** porte un champ caché `purge-recherche`. Il vaut « serveur » dans le HTML, puis « navigateur » une fois la page hydratée, c'est-à-dire quand le `onSubmit` qui purge est en place.
- **La Server Action** ferme toujours la session et redirige vers `/`, comme avant. Si le champ ne vaut pas « navigateur » (absent, « serveur », autre), elle dépose en plus le cookie `futuree-purge-recherche`. Ce cookie porte un jeton aléatoire, il est lisible par la page et dure 30 jours.
- **La première page qui exécute du JavaScript** applique la purge avant toute lecture :
  - `purgeRechercheConnue()`, que lisent « Où vivre », la reprise et les gardes d'écriture, applique d'abord la purge différée. « Où vivre » et la reprise lisent cette date avant la session ;
  - les lecteurs directs l'appellent aussi avant de lire : Pack, touche perso du paywall, questionnaire (synchronisation, première lecture, reprise du questionnaire) et commune de l'accueil, qui est la page de redirection ;
  - l'écoute globale du layout l'applique au montage de chaque page.
- **La purge différée est la même purge** : mêmes clés, même date-barrière, même signal aux autres onglets. Le cookie est effacé et son jeton noté comme vu. Si le cookie ne pouvait pas être effacé, le même jeton ne purge donc qu'une fois, et ne revient pas effacer une recherche lancée depuis. Une nouvelle déconnexion porte un nouveau jeton.
- **Sans JavaScript**, aucune page ne peut lire ces stockages. La purge attend la première page qui le peut, et s'applique avant que la recherche soit lue.

### Scénarios et résultats

Tests : 4 tests ajoutés dans `fut27-deconnexion.test.ts`, soit 16 au total. Par mutation, ils échouent quand la purge différée est neutralisée, ou quand le jeton déjà vu repurge.

Recette : `scripts/fut27-deconnexion-differee-recette.mjs`, sans compte. L'onglet envoie le POST natif d'un formulaire non hydraté à la vraie Server Action `signOutAction` du build : hors de React, avec le champ à « serveur ».

| Cas | Résultat |
|---|---|
| 1 · clic juste après le chargement de /compte (POST natif) | Réponse 303 vers `/` avec le cookie de purge. La page d'arrivée efface la session « Où vivre », le questionnaire et la commune de l'accueil, puis le cookie. La commune n'est pas réaffichée. L'autre onglet, ouvert sur Bordeaux, revient vide. |
| 2 · déconnexion après hydratation | Champ « navigateur » : aucun cookie, la purge a eu lieu avant l'envoi (`onSubmit`, section 7). Vérifié par POST direct : 303, sans `Set-Cookie`. |
| 3 · compte A, déconnexion, puis compte B | Après la purge différée, la reprise ne relit rien, et l'onglet resté sur Bordeaux n'écrit plus (test). |
| 4 · recherche anonyme après la déconnexion, puis connexion | Rennes cherchée après la purge : restaurée dans un nouvel onglet, intacte après /connexion. Même avec le cookie remis à l'identique, elle n'est pas effacée. |
| 5 · dossiers et Projet serveur | Aucun appel `/api/profile` ni `/api/project` pendant la recette. La Server Action n'écrit qu'un cookie. Sans session, `signOut` n'appelle rien côté Supabase. |

Suite complète : 4 382 tests passent, 0 échec. TypeScript OK. ESLint : 0 erreur. Build OK.

**Non exécuté** : le même clic depuis la vraie page /compte, connecté, qui demande un compte. Aucun Supabase de test n'est disponible et aucun compte de production n'a été utilisé. Le POST envoyé est celui que produit ce formulaire avant hydratation : même action, même champ.
