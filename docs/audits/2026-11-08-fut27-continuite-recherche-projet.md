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
