# FUT-45 : la couverture du dossier face à toute la demande exprimée (audit, phases 0 à 3)

Date : 03/10/2026. Base : `main` 7b5f0aa9. Aucun code produit modifié. Reproductions : `scripts/fut45/reproduire.mjs`
(vrai parseur → `buildCommuneDossier` → conclusion ; lecture seule).

## 1. Le chemin actuel

1. **Parseur** (`api/comparateur-vie/parse`, `parse-assainir.ts`) : préférences, contraintes, et `horsMesure`
   (`{ term, kind: ecoles | culture | affectif | autre }`, 3 au plus, sans poids). Le budget va en `autre`.
2. **Où vivre** montre `horsMesure` (`horsMesureToLignes`, « ce que nous n'avons pas pu mesurer »).
3. **Dossier** : `buildCriteriaRegistry` (`criteria-registry.ts`) ne connaît que les contraintes déclarées et les
   préférences. `horsMesure` n'est lu NULLE PART dans `src/lib/decision/`.
4. Chaque critère du registre : `coverage` examined / unexamined (`no_rule` | `inconclusive`), `outcome`
   (favorable, mismatch, reserve, to_confirm, incompatible, indeterminate), `capability` (trancher / apprecier /
   ne_pas_mesurer). « Examined » = au moins une évaluation exploitable : satisfied, mismatch, **neutral**,
   condition_check, not_surfaced…
5. **Le niveau global** : `examined = 0` → `none` ; sinon `high` si aucune condition confirmée n'est restée muette
   ET `examined / registre ≥ 0,7` ; sinon `partial`.
6. **Utilisations** : `conclusion-plan.ts` choisit le verdict sur ce niveau (« Bonne correspondance : X semble bien
   correspondre à votre projet » si `high` + favorable ; « Signaux favorables : sur ce qui a pu être examiné… » si
   `partial` ; « Lecture non disponible : … les données manquent pour cette commune » si `none`).
   `comparaison-candidats.ts` le recopie (`couverture`), sans affichage. Pages de développement. Aucun prompt ne le
   reçoit directement ; la conclusion rédigée part du plan de conclusion qui, lui, en dépend.
7. **Limites déjà dites** : le bloc « uncovered_priorities » nomme les priorités qu'aucune règle ne sait examiner
   et celles examinées sans conclusion ici. `horsMesure` n'y entre pas.

## 2. Reproductions (vrai parseur, vrai dossier, Brest sauf mention)

| Cas | Compris | Couverture | Verdict produit |
|---|---|---|---|
| A « budget 250 000 € et air sain » | air_sain:3 ; horsMesure « budget 250 000 € » | high | **Bonne correspondance — Brest semble bien correspondre à votre projet.** « Les critères de votre projet qui ont pu être examinés vont dans ce sens. » Le budget n'apparaît nulle part |
| B « éviter les fortes chaleurs » | faible_chaleur:3 (apprecier) | high | Bonne correspondance (en posture « semble ») |
| E « air sain, pas trop chaud, nature, calme, et surtout de bonnes écoles réputées » | 5 préférences ; horsMesure « bonnes écoles réputées » | high (5/5 examinés, dont nature **neutre** et calme **défavorable**) | **Bonne correspondance** ; « les critères examinés vont dans ce sens » alors que le calme est un écart |
| F « une ville authentique et chaleureuse » | rien de mesurable ; horsMesure affectif ×2 | none | « Vos critères n'ont pas encore pu être lus… **Les données qui permettraient de répondre manquent encore pour cette commune.** » Cause fausse : c'est futur•e qui ne mesure pas ces sujets |
| G « surtout un budget de 200 000 €, et aussi calme, nature, air sain, services » | 4 préférences ; horsMesure « budget de 200 000 € maximum » | high | Arbitrage sur le calme ; le budget, « surtout », n'apparaît nulle part |
| D « nature », Paris 11e | nature (donnée absente) | none | « … les données manquent pour cette commune » (cause juste ici, mais même phrase que F) |

## 3. La cause

Le registre de couverture ne contient que les critères structurés. Une demande comprise mais rangée dans
`horsMesure` sort du calcul et de la lecture finale. Trois défauts s'y ajoutent dans le même chemin :
- « examiné » compte comme « couvert » un critère **neutre** (rien à en dire) ou seulement **apprécié** ;
- le seuil de 70 % laisse dire « élevée » avec 3 critères sur 10 non lus ;
- la phrase de détail « les critères examinés vont dans ce sens » est écrite dès que l'orientation est favorable,
  même avec un neutre et un écart secondaire (un seul écart secondaire ne déclenche pas l'arbitrage).

## 4. Le score `coverage` lui-même

**La question qu'il voulait servir** : « sur quelle part de mon projet futur•e a-t-il pu lire quelque chose ? »,
pour éviter de conclure trop fort sur une lecture lacunaire. La question est utile : c'est elle qui empêche
« Bonne correspondance » sur un projet à moitié lu.

**Ce qu'il mesure** : la part des critères **structurés** qui ont reçu au moins une évaluation exploitable. Le
problème vient de la **formule** (dénominateur sans `horsMesure`, seuil 0,7) et du **vocabulaire** (`high` lu comme
« répondu »), pas du concept.

**Une mesure synthétique honnête ?** Un pourcentage ou un niveau gradué agrège des demandes d'importance inégale
(cas G : quatre préférences lues ne compensent pas le budget « surtout »). Le parseur ne pèse pas `horsMesure` ;
toute moyenne serait arbitraire. Seule une notion binaire tient : **la lecture est-elle complète, oui ou non**, et
si non, **lesquelles** ne le sont pas.

## 5. Modèle cible proposé (A)

1. **Un état par demande**, dans la lecture finale, en mots humains :
   - « futur•e peut répondre précisément sur… » (trancher, condition confirmée) ;
   - « futur•e peut donner une indication sur… » (apprecier : toutes les préférences) ;
   - « futur•e ne mesure pas encore… » (`horsMesure`, ou aucune règle) ;
   - « la donnée manque pour ce lieu sur… » (règle sans conclusion ici).
2. **`horsMesure` entre dans le résumé des critères** (`CriteriaSummary.nonMesurees`, le terme du lecteur) et dans
   le bloc de limites de la conclusion : « futur•e ne mesure pas encore votre budget de 250 000 € ». Trois au
   plus, comme aujourd'hui.
3. **`coverage` devient binaire, et change de nom de valeur** : `complete` (chaque demande comprise a été lue :
   aucun `horsMesure`, aucun critère sans lecture, aucune condition muette) / `partial` / `none`. Plus de seuil de
   70 %. `high` disparaît.
4. **Le verdict** : « Bonne correspondance — X semble bien correspondre à votre projet » n'est possible que si la
   lecture est complète. Sinon, la tournure existante « Sur ce que futur•e a pu lire, X va dans le sens de ce que
   vous avez demandé », et le détail NOMME ce qui manque (« votre budget reste sans réponse ») au lieu de « les
   autres critères ».
5. **`none` dit sa vraie cause** : rien de mesurable dans la demande (F) → « futur•e ne mesure pas encore ce que
   vous avez demandé : … » ; donnée absente ici (D) → la phrase actuelle.
6. **« Vont dans ce sens »** n'est écrit que si tous les critères lus sont favorables ; sinon « une partie de vos
   priorités va dans ce sens ». Aucune règle d'orientation ne change.
7. **Aucun score composite** : un booléen de complétude et des listes nommées.

**Alternative B** : garder `high / partial / none` mais calculer le ratio sur toutes les demandes (dénominateur +
`horsMesure`, neutres exclus du numérateur). Moins de changements, mais un seuil reste arbitraire et un ratio
élevé peut encore masquer le budget (G).

**Alternative C** : afficher un tableau d'états par demande dans l'écran du dossier, sans aucun niveau global.
Le plus transparent, mais c'est un chantier d'interface ; il peut venir après A, qui en pose les données.

## 6. Cas G (critère majeur non mesuré)

`horsMesure` n'a pas de poids : on ne sait pas classer le budget « surtout » au-dessus des autres. Le modèle A ne
compte pas, il NOMME : toute demande non mesurée est citée dans la conclusion, quel que soit le nombre de
critères lus. Garder le « surtout » du lecteur demanderait d'ajouter un poids à `horsMesure` dans le parseur :
hors FUT-45, noté ci-dessous.

## 7. Migration, types, snapshots

- `CoverageLevel` : `high` → `complete` dans `criteria-registry.ts`, `conclusion-plan.ts`, la page de dev. Les
  dossiers figés gardent leur `high` (le schéma de l'artefact laisse `criteria` libre) ; `comparaison-candidats`
  recopie la chaîne, sans affichage.
- Nouveau champ `CriteriaSummary.nonMesurees` ; le plan de conclusion le reçoit.
- Pas de migration de données. `ENGINE_VERSION` → `engine-4` (le moteur conclut autrement).
- La conclusion rédigée par le modèle valide ses blocs : le bloc de limites gagne les termes du lecteur comme
  phrases exigées, comme pour les priorités non couvertes.

## 8. Périmètre recommandé

`criteria-registry.ts` (résumé + niveau binaire), `decision-assembler.ts` (passage au plan), `conclusion-plan.ts`
(verdict, détail, bloc de limites, cause de `none`), `decision-artifact.ts` (version), tests, page de dev. Pas
d'interface nouvelle, pas de changement de règle d'orientation, pas de changement du parseur.

## Scores / indicateurs à challenger

| # | Nom | Objectif supposé | Mesure réelle | Problème | Valeur si reconstruit | Recommandation | Ticket séparé |
|---|---|---|---|---|---|---|---|
| 1 | `coverage` (high/partial/none) | « quelle part de mon projet a été lue » | part des critères structurés avec une évaluation exploitable, seuil 0,7 | ignore `horsMesure` ; neutre et apprécié comptés comme couverts ; seuil arbitraire ; « high » lu comme « répondu » | élevée : empêcher une conclusion forte sur une lecture lacunaire | **remplacer** (modèle A, dans FUT-45) | non |
| 2 | orientation `favorable` / seuil d'arbitrage | « le lieu va dans votre sens » | aucun écart matériel au sens « 1 structurant ou ≥ 2 secondaires » | un écart secondaire unique laisse « Bonne correspondance » et « vont dans ce sens » (cas E, le calme) | moyenne | **reformuler** le détail dans FUT-45 ; la règle elle-même : à examiner | oui, petit : « un écart secondaire unique doit-il empêcher “Bonne correspondance” ? » |
| 3 | issue `favorable` d'une préférence | « répond à votre priorité » | position dans le classement national (parmi les X % les plus favorables) | un rang relatif dit « mieux que la plupart », pas « suffisant pour vous » ; le verdict reste en « semble » | moyenne | **conserver**, en surveillant le vocabulaire | non |
| 4 | « budget » rangé hors mesure | — | le parseur classe « prix » hors périmètre | la question n° 1 d'un acheteur reste sans réponse, alors que l'index porte un niveau de marché immobilier (`logementNiveau`, utilisé par le comparateur) | **forte** : un budget est souvent la première condition | **améliorer** : examiner si un niveau de prix communal honnête peut éclairer le budget | oui |
| 5 | `horsMesure` sans poids | — | une liste de termes | le « surtout » du lecteur est perdu (cas G) | moyenne | **améliorer** (parseur : garder l'insistance) | oui, petit |
