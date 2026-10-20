# FUT-22 · Quand deux analyses se comparent-elles ? Contrat de comparabilité condition par condition

20 octobre 2026 · note métier de la passe V3.2 de FUT-41 · **proposition, aucun code moteur modifié.**

Cette note répond à l'arbitrage W4 : formaliser dans FUT-22 un contrat de comparabilité qui ne déclare
pas toute une comparaison « hors cadre » pour une différence qui ne concerne qu'une condition. Elle part
du code en place sur `main` (`3da725e3`) et ne propose rien qui exige un changement du moteur
`engine-6` dans cette passe.

## 1. Ce qui existe aujourd'hui

**`signatureDecisionnelle(projet)`** (`src/lib/decision/projet-materiel.ts`) résume en une chaîne ce que
le moteur lit du Projet : posture, intention (achat ou location), structuration, contraintes dures avec
leur valeur canonique, préférences avec leur poids, conditions confirmées (FUT-7). Elle passe par la
valeur effective (FUT-8). Deux projets de même signature « concluent pareil ». Elle sert deux usages :

- la **péremption d'un dossier vendu** (`projetAChangeMateriellement`) ;
- la **comparabilité** dans `comparaison-candidats.ts`, qui l'emprunte volontairement pour ne pas avoir
  deux définitions du « même projet ».

**`comparabilite(a, b)`** (`src/lib/decision/comparaison-candidats.ts`) rend `memeCadreDAnalyse` vrai
seulement si les quatre égalités tiennent : même `engineVersion`, même `conventionsVersion`, même
signature décisionnelle du `projectSnapshot`, même `dossier.scope`. Sinon, **toutes** les lignes dont
les issues diffèrent deviennent `difference_hors_cadre_commun`, et une phrase de réserve s'ajoute par
empêchement. Les lignes d'issues égales restent `meme_lecture`, même hors cadre.

**Ce que le module dit lui-même ne pas vérifier** (en-tête, 20/08/2026) : les **millésimes des données
sources**. Une BPE 2024 contre une BPE 2025 donnerait une différence présentée comme venant du lieu. Le
module est déclaré **non rendable en l'état** pour cette raison.

**Ce que l'artefact porte** (`DecisionArtifactV1`) : `generatedAt`, `engineVersion`,
`conventionsVersion`, `projectSnapshot`, `dossier` (dont `scope` et `criteria.registry`, avec par
critère `outcome`, `coverage`, `unexaminedReason`), `dataSnapshot` facultatif (aujourd'hui seulement
`catnatInondation`), `contexteDuBien` facultatif. **Aucun millésime de source** et **aucune liste des
paramètres consommés par critère** ne sont figés.

**Une brique déjà prête.** `valeurDecisionnelle(clé, contraintes)` et `canonique()`
(`criterion-value.ts`) donnent l'empreinte d'**une** contrainte telle que le moteur la lit. FUT-7
l'utilise déjà pour épingler la confirmation d'une condition à sa valeur exacte. C'est la base naturelle
d'une signature **par critère**.

## 2. Pourquoi le contrat actuel est trop large, et trop étroit

**Trop large.** La signature est globale. Passer d'une gare à 20 minutes à une gare à 30 change la
signature, donc rend hors cadre la mer, le médecin, la chaleur et le calme, que cette valeur n'affecte
pas. Dans le prototype V3.1, cela vidait la comparaison de Kervily et des Sternes pour une seule
condition.

**Trop étroit.** Deux analyses sous la même signature peuvent ne pas se comparer : moteur différent (la
règle « compromis transports × chaleur » retirée par engine-6 change l'issue de `faible_chaleur`),
conventions différentes, millésime de source différent, ou échelle d'examen différente (commune contre
adresse). Seuls le moteur, les conventions et l'échelle globale sont vérifiés aujourd'hui ; ni le
millésime, ni l'échelle **à laquelle chaque critère a été établi**.

## 3. Le contrat proposé : huit composantes, et une règle par critère

| # | Composante | Ce qu'elle désigne | Où elle vit, ou devrait vivre | Portée |
| --- | --- | --- | --- | --- |
| 1 | **Identité du Projet** | « c'est la même recherche » | identifiant du projet de l'utilisateur | n'autorise **aucune** comparaison à elle seule ; elle dit seulement qu'on compare dans une même recherche |
| 2 | **Signature décisionnelle effective** | ce que le moteur lit du Projet, globalement | `signatureDecisionnelle` (existant) | sert à la péremption d'un dossier ; **ne doit plus** décider seule de la comparabilité |
| 3 | **Empreinte par critère** | les seuls paramètres du Projet que **ce** critère consomme : sa valeur (`valeurDecisionnelle`), son poids, sa confirmation, la posture et l'intention s'il les lit | **à figer** dans le registre de l'artefact, par critère | décide la comparabilité **de ce critère** |
| 4 | **Moteur et règles** | la version du moteur, et pour chaque critère les règles qui l'ont produit | `engineVersion` (existant) ; identifiants de règles par critère **à figer** | un changement de moteur ne rend incomparable que les critères dont les règles ont changé, **si** on sait lesquelles ; sinon, tous |
| 5 | **Conventions et référentiels** | seuils, horizons, référentiel TRACC, conventions de lecture | `conventionsVersion` (existant) | même logique : global tant qu'on ne sait pas quels critères une convention touche |
| 6 | **Millésimes des sources** | l'état de chaque source lue (BPE 2024 ou 2025, index régénéré le…) | **absent** ; à figer par critère (`sources: [{ id, millesime }]`) | deux millésimes différents d'une même source rendent le critère incomparable |
| 7 | **Échelle et profondeur réellement examinées** | le grain auquel **ce** critère a été établi (commune, abords, logement), et sa couverture | `scope` global (existant) ; grain par critère **à figer** (le moteur le connaît via `criterionCapability(…, grain)`) | une différence de profondeur n'est jamais un avantage du lieu : elle rend la ligne « un seul est examiné ici » |
| 8 | **Inconnues, aperçus, constats non établis** | `to_confirm`, `indeterminate`, `unexamined`, et toute lecture d'aperçu gratuit | `outcome`, `coverage` (existant) ; l'aperçu n'a pas d'artefact | jamais comparés : « rien à départager, à vérifier » |

### La règle, critère par critère

Pour deux analyses A et B et un critère *c* présent dans les deux :

1. Si *c* est non établi d'un côté (`to_confirm`, `indeterminate`, `unexamined`, aperçu) :
   **`indetermine_ici`**. Inchangé.
2. Sinon, *c* est **comparable** si et seulement si :
   - les **empreintes de *c*** (composante 3) sont égales ;
   - le **moteur** et les **conventions** sont égaux, **ou** la table des règles et conventions
     touchées montre que *c* n'est pas concerné (composantes 4, 5) ;
   - les **millésimes** des sources lues par *c* sont égaux (composante 6) ;
   - le **grain** auquel *c* a été établi est le même des deux côtés (composante 7).
3. *c* comparable, issues égales : **`meme_lecture`** ; issues différentes :
   **`difference_dans_le_meme_cadre`**.
4. *c* non comparable : **`difference_hors_cadre_commun`**, **même si les issues sont égales.** Un
   accord obtenu sous deux cadres n'est pas plus établi qu'un désaccord (règle tenue depuis la V3 du
   prototype, plus stricte que le code actuel, qui laisse `meme_lecture` hors cadre).
5. La réserve dit **pourquoi, critère par critère** : « La gare : votre limite est passée de 20 à 30
   minutes entre les deux analyses. »

**Condition sans compromis.** Une condition sans compromis non tenue (`incompatible`) **n'entre dans
aucune compensation** : elle s'affiche en tête, quel que soit l'état de comparabilité des autres
critères, et aucune ligne « en commun » ne la relativise. Si elle est elle-même hors cadre (l'analyse a
été faite sous une autre valeur de la condition), elle s'affiche **comme telle** (« ne tenait pas votre
condition d'alors »), sans être tenue pour levée.

**Ce que la règle ne fait jamais.** Elle ne compte pas les critères comparables pour produire un indice
de confiance, ne trie pas les lieux, et ne remplace pas une ligne hors cadre par une estimation.

## 4. Le cas de la gare (exemple du porteur)

Projet révisé : une gare à moins de 30 minutes au lieu de 20. Kervily (analysé sous 20) et les Sternes
(analysé sous 30).

| Critère | Empreinte | Moteur, conventions, millésimes, grain | Comparable ? |
| --- | --- | --- | --- |
| La mer à moins de 15 km | identique | identiques | **oui** |
| Un médecin disponible | identique | identiques | oui, mais `to_confirm` des deux côtés : à vérifier |
| Une gare à moins de N min | **20 contre 30** | identiques | **non** : « votre limite a changé entre les deux analyses » |
| Des nuits fraîches l'été | identique | identiques | **oui** |
| Le calme | identique | identiques | **oui** |
| Une vie de quartier | identique | identiques | **oui** |

Résultat : la comparaison montre cinq lignes dans le même cadre et **une** ligne hors cadre, au lieu de
tout déclarer non fiable. Mettre à jour l'analyse de Kervily reste proposé, pour **la gare**.

**Réserve importante.** Ce découpage suppose que le critère « gare » est le **seul** à lire la valeur de
la gare. Si une règle croisée (comme l'ancien « transports × chaleur ») lit deux critères, l'empreinte
du second doit inclure la valeur du premier. C'est pourquoi la composante 3 doit être **produite par le
moteur** (la liste réelle des paramètres lus par chaque règle), et jamais déduite par l'interface.

## 5. Cas limites

| Cas | Décision proposée |
| --- | --- |
| Même révision du Projet, **moteur différent** (engine-4 contre engine-6) | Tant que la table « règles touchées par version » n'existe pas : tous les critères hors cadre, comme aujourd'hui. Avec la table : seuls les critères touchés (ex. `faible_chaleur` entre engine-5 et engine-6). |
| Même révision, **conventions différentes** | idem, par la table des conventions touchées |
| Même tout, **millésime BPE différent** | les critères qui lisent la BPE (santé, vie de quartier, écoles) hors cadre ; les autres comparables. Aujourd'hui **indétectable** : c'est le blocage déclaré du module |
| Commune contre **adresse** | critère par critère : une ligne établie à la commune des deux côtés se compare ; une ligne établie aux abords d'un seul côté devient « un seul est examiné ici » |
| Deux adresses de **la même commune** | le socle communal est **une seule** lecture : il ne se compare pas à lui-même, il se dit une fois (« même commune ») |
| Une **préférence retirée** du Projet | le critère disparaît du Projet actuel ; l'analyse ancienne le garde. Il devient « critère non partagé », nommé, jamais silencieusement écarté (comportement actuel de `criteresNonPartages`) |
| Un **poids** changé (« compte un peu » à « compte beaucoup ») | si le poids change l'issue (une règle de matérialité), l'empreinte change et le critère sort du cadre ; s'il ne change que l'ordre d'affichage, il n'entre pas dans l'empreinte. **À trancher avec le moteur**, règle par règle |
| Une **condition confirmée** après coup (FUT-7) | la confirmation entre dans l'empreinte du critère (elle peut le rendre éliminatoire) ; elle n'affecte pas les autres |
| **Posture** ou **intention** changées (achat contre location) | elles entrent dans l'empreinte des seuls critères qui les lisent ; si le moteur ne sait pas le dire, dans toutes |
| Artefact **antérieur au 05/08/2026**, sans `projectSnapshot` | rien n'est affirmé : comparaison impossible à établir, dite comme telle |
| **Aperçu gratuit** contre analyse | jamais comparé : « connu par l'aperçu, hors départage » (pas d'artefact, pas de cadre) |

## 6. Ce qu'il faudrait figer dans l'artefact (pour plus tard, hors de cette passe)

Une entrée par critère du registre, sans changer les issues :

```ts
type CadreDuCritere = {
  criterionKey: string;
  empreinte: string;              // canonique(valeurDecisionnelle(...)) + poids + confirmation + posture/intention si lues
  grain: "commune" | "secteur" | "batiment";
  regles: string[];               // identifiants des règles qui ont produit l'issue
  sources: { id: string; millesime: string }[];
};
```

C'est un **ajout au schéma de l'artefact** (donc une version de schéma, et une décision du porteur),
pas une modification des règles. Les artefacts déjà vendus n'en auront pas : pour eux, la règle
retombe sur le contrat actuel (global), et l'écran le dit.

## 7. Tests attendus (à écrire avec l'implémentation, pas dans cette passe)

1. **Gare 20 → 30** : seule la ligne gare est `difference_hors_cadre_commun` ; les cinq autres gardent
   leur relation ; la réserve nomme la gare et les deux valeurs.
2. **Règle croisée** : une règle qui lit gare et chaleur rend la chaleur hors cadre quand la gare
   change.
3. **Millésime** : même projet, même moteur, BPE 2024 contre 2025 : santé et vie de quartier hors
   cadre, la mer comparable.
4. **Accord hors cadre** : deux issues `favorable` sous deux empreintes différentes ne donnent **pas**
   `meme_lecture`.
5. **Sans compromis** : une condition `incompatible` reste en tête et n'est jamais comptée dans « en
   commun », que le reste soit comparable ou non.
6. **Profondeur** : commune contre adresse sur un critère établi aux abords d'un seul côté donne
   « un seul est examiné ici », jamais un avantage.
7. **Rétrocompatibilité** : un artefact sans `CadreDuCritere` retombe exactement sur le comportement
   actuel (tests existants inchangés).
8. **Texte rendu** (règle d'`AGENTS.md`) : la phrase d'entrée de la comparaison et la réserve citent
   les mêmes critères que les lignes ; « la carte apparaît » et « la carte dit vrai » sont deux
   assertions.

## 8. Ce que le prototype V3.2 en montre, et n'en montre pas

Le prototype applique encore la règle V3 (une révision différente rend hors cadre toutes les lignes,
même égales). Il **n'implémente pas** la règle par critère : la montrer sur des données fictives sans
l'avoir écrite dans le moteur laisserait croire qu'elle existe. Elle est décrite ici pour décision.

**Décisions demandées au porteur :** adopter la règle par critère (§ 3) ; accepter d'ajouter
`CadreDuCritere` au schéma de l'artefact à terme (§ 6) ; confirmer qu'un accord hors cadre ne se dit
pas « en commun » (§ 3, règle 4), ce qui durcit le code actuel.
