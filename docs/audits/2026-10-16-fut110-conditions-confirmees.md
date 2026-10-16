# FUT-110 — Corriger l'inversion de sens des conditions confirmées

*16/10/2026 · branche `fix/fut-110-conditions-confirmees`, partie de `main` à `7937f37d` · référence : cadrage FUT-85 (`e71db050`), §D.1 et §D.6.*

---

# Partie 1 — Synthèse

## Ce qui n'allait pas

Un lecteur peut dire d'une de ses priorités qu'elle est **une condition sans compromis**. Pour trois d'entre elles (l'accès aux soins, l'accès au train, la possibilité de vivre avec peu de voiture), le dossier d'adresse **retournait le sens de ce qu'il savait**.

Exemple, reproduit sur `main` : la commune est parmi les 20 % les plus favorables pour l'accès aux soins, et un médecin est recensé à 550 m de l'adresse. La carte affichait :

> **Ouverte · plutôt défavorable**
> Un médecin généraliste se trouve à environ 550 m de cette adresse.

Le verdict en haut du dossier ajoutait : « Les données disponibles sont plutôt défavorables pour un bon accès aux soins. » Le rang favorable de la commune avait disparu.

La cause : pour le moteur, « il y a quelque chose à vérifier » valait « cela penche contre vous ». C'est vrai pour une inondation notable. C'est faux pour un médecin à 550 m.

## Ce qui change

| | Avant | Après |
|---|---|---|
| État de la carte | Ouverte · plutôt **défavorable** | Ouverte · plutôt **favorable** |
| Ce que dit la carte | Le médecin seul | Le rang de la commune, **puis** le médecin, chacun à son échelle |
| Pourquoi on ne tranche pas | « Lecture faite à l'échelle de la commune » (faux : il y a un constat à l'adresse) | Le sens vient de la commune ; le constat à l'adresse ne l'oriente pas et reste à vérifier ; ce qu'un médecin proche ne garantit pas |
| Verdict | « plutôt défavorables » | « plutôt favorables » |
| Geste proposé | Inchangé | Inchangé |

Une information à vérifier ne pèse plus **ni contre ni pour** la condition. Elle reste dans la carte, avec son geste et sa limite. La condition reste **ouverte** dans tous les cas : un médecin proche ne prouve pas qu'il prendra le lecteur.

## Ce qui ne change pas

- Les **expositions établies** pèsent toujours contre : inondation, pluies intenses, pollution de l'air, bruit, industrie. Leurs cartes sont identiques au mot près.
- Une commune **défavorable** reste défavorable, même avec un médecin proche. La carte dit maintenant que c'est la commune qui penche, et nomme quand même le médecin.
- Aucun fait ne change de section. Le registre des critères, l'étiquette du verdict, le contrôle prioritaire et le nombre de contrôles sont inchangés.
- Aucune règle climatique, aucun seuil, aucune donnée source n'a été modifiée.

## Une découverte en plus

L'audit FUT-85 recensait huit règles. Il y en a **neuf**. La règle du feu a une branche « commune très boisée, aucun risque recensé ». Elle déclare elle-même qu'un couvert forestier **n'établit aucun risque**. Confirmée, cette condition affichait aussi « plutôt défavorable ». Elle affiche maintenant « Condition ouverte », sans sens.

**C'est un choix à valider en revue.** Si vous préférez que le boisement penche contre, une ligne suffit à revenir en arrière (§4.3).

## Ce que vous devez savoir avant de fusionner

1. **Dossiers déjà achetés** : ils gardent leur version figée (l'ancienne carte erronée), car l'artefact s'affiche toujours. Rien n'a été régénéré. Une nouvelle version n'apparaît que si le lecteur la demande.
2. **Version du moteur** : `engine-4` passe à `engine-5`, comme l'exige la règle du fichier quand une conclusion change. Le comparatif refusera de rapprocher un dossier `engine-4` d'un dossier `engine-5` (comportement prévu, déjà vécu avec FUT-7, FUT-33 et FUT-45).
3. **Conclusion rédigée** : un dossier vivant concerné a un nouveau plan. Si son plan justifie une rédaction, elle sera refaite une fois, à sa prochaine ouverture. Ce n'est pas déclenché par ce ticket.
4. **Validation** : sur des **fixtures** et la vraie chaîne du moteur, jamais en production.

---

# Partie 2 — Détails techniques

## 1. Reproduction sur `main`

**Méthode.** Vraie chaîne `runRules → conditionsDePreference → composeFacts → assembleDossier`, comme `assembleAddressDossier`, sans I/O. Commune Châtelaillon-Plage (17094) avec un rang **fictif** `[8500, 9000]`. Préférence au poids 3, confirmée par `buildConfirmation`. Adresse renseignée.

**Cas 1 — soins** (médecin à 553 m, snapshot Autour du type `autour-rules.test.ts`) :

```
evaluations : territoire.mismatch-acces_soins=satisfied, territoire.alignment-acces_soins=satisfied,
              autour.acces-soins=verification, condition.acces_soins=condition_check
[incompatibilities] condition_check signal=defavorable status=Ouverte · plutôt défavorable
  statement      : Un médecin généraliste se trouve à environ 550 m de cette adresse.
  whyNotDecided  : Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous. Elle éclaire votre condition sans pouvoir la trancher.
  consequence    : Ce que l'on sait penche contre cette condition. Elle reste ouverte : à vérifier avant de décider.
  action         : Renseignez-vous sur les délais de rendez-vous des médecins du secteur
  evidence       : relativePosition.acces_soins[commune] | autour.sante[adresse]=550 m | autour.sante.source[adresse]
registry : to_confirm | orientation=condition_to_confirm | verdict=Condition ouverte
bloc[verdict] : Les données disponibles sont plutôt défavorables pour un bon accès aux soins.
```

**Cas 2 — transports** (gare à 600 m) : même schéma. `autour.gare=verification`, « Ouverte · plutôt défavorable », constat « Une gare se trouve à environ 600 m de cette adresse. », verdict « plutôt défavorables pour l'accès au train et aux gares ».

**Cas 3 — dépendance automobile** (secteur à 45 % de ménages motorisés contre 70 % dans la commune) : `secteur.equipement-auto=verification`, « Ouverte · plutôt défavorable », constat du secteur seul, verdict « plutôt défavorables pour une faible dépendance à la voiture ».

Dans les trois cas :
- le rang communal favorable est absorbé (il n'est plus affiché nulle part) ;
- seule la pastille sans valeur `relativePosition.*` en garde une trace, invisible sur la face de la carte ;
- `whyNotDecided` annonce une lecture communale pour un constat d'adresse ou de secteur.

**Le défaut existe donc toujours sur `main` au 16/10** (`7937f37d`, après FUT-62 et FUT-97).

**Les tests existants ne le voyaient pas.** Après correction, les 1 007 tests de `src/lib/decision` passent sans modification : aucun ne vérifiait ce que la carte raconte dans ces cas.

## 2. Les règles `verification` examinées et leur orientation réelle

Seules les règles rattachées à **une seule** priorité entrent dans une carte de condition (`faitsDuCritere`). Les règles à `projectKeys: []` (chaleur et feu ambiants, permis, radon, `logement.*`) ne sont jamais absorbées : elles sont hors du champ de ce défaut.

| Règle | Clé | Ce qui motive `verification` | Orientation réelle | Traitement |
|---|---|---|---|---|
| `territoire.inondation-exposition` | `faible_risque_inondation` | Exposition CatNat ≥ 66 (rang des reconnaissances GASPAR) | **Indice défavorable établi** | Oriente (inchangé) |
| `territoire.climat-pluies` | `faible_precip_extremes` | Pluie maximale sur 24 h projetée au-dessus du seuil de signalement | **Défavorable établi** | Oriente (inchangé) |
| `territoire.sante-air` | `air_sain` | NO₂ ≥ recommandation OMS ou PM2,5 ≥ valeur limite UE 2030 | **Défavorable établi** | Oriente (inchangé) |
| `territoire.sante-bruit` | `calme_sonore` | Infrastructure bruyante dans la distance de signalement | **Défavorable établi** (au point de référence) | Oriente (inchangé) |
| `territoire.sante-industrie` | `faible_exposition_industrielle` | Site à risque (catégorie légale) à portée | **Défavorable établi** | Oriente (inchangé) |
| `autour.acces-soins`, présence | `acces_soins` | Médecin ou pharmacie recensé dans le périmètre | **Indice favorable, insuffisant** (disponibilité, nouveaux patients inconnus) | **N'oriente plus** |
| `autour.acces-soins`, absence | `acces_soins` | Aucun équipement dans un rayon borné | **Information insuffisante** (« la commune peut rester bien dotée ») | **N'oriente plus** |
| `autour.gare`, présence | `acces_transports` | Gare recensée dans le périmètre | **Indice favorable, insuffisant** (fréquence, destinations inconnues) | **N'oriente plus** |
| `autour.gare`, absence | `acces_transports` | Aucune gare dans un rayon borné | **Information insuffisante** | **N'oriente plus** |
| `secteur.equipement-auto`, moins motorisé | `faible_dependance_auto` | Écart ≤ −15 points à la commune | **Indice favorable, insuffisant** ; la règle se déclare « nuance, pas verdict » | **N'oriente plus** |
| `secteur.equipement-auto`, plus motorisé | `faible_dependance_auto` | Écart ≥ +15 points | **Indice défavorable, insuffisant** ; même déclaration | **N'oriente plus** |
| `territoire.climat-feu`, branche boisement | `faible_risque_feu` | Forêt ≥ 70 %, aucun risque recensé, indice météo sous le seuil | **Information ambiguë** : la règle écrit qu'elle « n'établit AUCUN risque » et n'existe que pour interdire un « satisfait » | **N'oriente plus** (non listée par FUT-85, voir §4.3) |

Pour le secteur plus motorisé, le choix « n'oriente pas » suit la doctrine écrite en tête de `secteur-rules.ts` : la règle « ne tranche pas le projet » et « nuance » la lecture communale de `mismatch-rules`. Le faire pencher contre aurait produit un arbitrage entre deux échelles que le moteur ne sait pas faire.

## 3. La cause précise

`condition-rules.ts` (sur `main`) :

- `:38` : `const DEFAVORABLES = new Set(["mismatch", "verification"])` ;
- `:51-53`, `signalDe` : une seule évaluation `verification` sur le critère suffit à rendre `"defavorable"`, **avant** même de regarder un `satisfied` ;
- `:95-96`, `constatDe` : pour un signal non favorable, le constat est le **premier** fait non-alignment. Le médecin remplace donc le rang, qui disparaît ;
- `:162` : `whyNotDecided` vaut toujours `POURQUOI_PREFERENCE`, quelle que soit l'échelle des faits réunis.

Ce module confondait les deux sens du rôle `verification` : « il y a quelque chose à contrôler » et « cela penche contre la priorité ». Le reste du moteur ne les confondait pas. `criteria-registry.ts` range déjà `verification` en **réserve**, pas en écart. Le défaut était donc local.

## 4. La solution retenue

### 4.1 Le correctif (`condition-rules.ts`)

1. **Une table explicite des vérifications qui orientent** : `VERIFICATIONS_ORIENTEES`, avec les cinq règles d'exposition. Toute autre `verification` est un **constat à confirmer**. **Le défaut est « n'oriente pas »** : une règle future qui oublierait de se déclarer donnerait une condition « ouverte », jamais un sens inversé.
2. **`lectureDe`** remplace `signalDe`. Elle sépare les faits qui **orientent** (rang, exposition établie), seuls à fonder le signal, des constats **à confirmer**, qui l'accompagnent sans peser.
   - Un constat à confirmer **seul** (rang indisponible) donne une carte **neutre**. Elle porte le constat et son geste, sans rien prétendre de la commune.
3. **Le constat** juxtapose la lecture qui oriente puis les constats à confirmer, **chacun dans les mots de sa règle**. Chaque phrase nomme déjà son échelle : « Châtelaillon-Plage se situe… », « … de cette adresse », « Dans ce secteur… ». Aucun nouveau texte par critère.
4. **`whyNotDecided`** dit le grain réel :
   - sans constat à confirmer : la phrase de toujours, **identique** ;
   - avec : « Le sens de cette lecture vient de la commune, sans seuil fixé par vous. Le constat autour de l'adresse | sur le secteur de l'adresse ne l'oriente pas : il reste à vérifier. Elle éclaire votre condition sans pouvoir la trancher. », suivi de la **limite** écrite par la règle du constat (« Cette présence ne dit ni la disponibilité du praticien… »).
   - Ce sont deux gabarits, pas un texte par critère.
5. **La conséquence est attribuée** quand un constat d'une autre nature accompagne la lecture : « Ce que l'on sait **de la commune** penche contre / va dans le sens de cette condition. » Pour cela, `consequenceDuSignal` (`hard-constraint-rules.ts`) prend un paramètre facultatif `porteur`. Sans ce paramètre, la phrase reste identique.
6. **L'ordre** place la lecture qui oriente devant : elle donne le `topic` (le sujet que la synthèse nomme) et la première preuve. Le geste reste celui du constat : il est le seul à en porter un.

L'ensemble des faits réunis (`faitsDuCritere`) est **inchangé**. Les mêmes faits sont absorbés, avec les mêmes `sourceFactIds`, les mêmes preuves et le même geste. Aucun fait ne change de section, et FUT-90 reste intact.

### 4.2 Alternatives écartées

| Alternative | Pourquoi écartée |
|---|---|
| Remplacer `verification` par `neutral` dans `DEFAVORABLES` | Effaçait les cinq expositions réellement défavorables (inondation, bruit…). Explicitement refusé par le ticket. |
| Un champ `oriente` sur `VerificationFact`, posé par chaque règle | Modifie le contrat sérialisé de **tous** les faits de vérification, artefacts compris, pour une décision qui ne sert qu'à ce module. La table vit au seul endroit qui la consomme (§I.4 de FUT-85 : « correction dans `condition-rules.ts`, pas un mécanisme générique »). |
| Ne plus absorber les constats à confirmer (les laisser dans « À contrôler ») | Déplace des faits entre sections : le compte des contrôles et des réserves change, le verdict aussi. Sépare le médecin de la condition « accès aux soins » que le lecteur a posée. |
| Un champ structuré « constats à confirmer » sur `ConditionCheckFact`, avec rendu dédié | Nouveau contrat, nouveau composant, deux présentations à adapter (classique, Relevé). Le texte juxtaposé suffit, puisque chaque phrase de règle nomme déjà son échelle. À reconsidérer si FUT-17 veut une mise en forme distincte. |
| Importer les identifiants de règles depuis `materiality-rules.ts` | Cycle d'import (les règles importent `condition-rules`) : une `Set` construite au chargement lirait des liaisons non initialisées. Les identifiants sont donc écrits en littéraux, et un test vérifie qu'ils existent dans `REGISTRY`. |

### 4.3 Le point à valider : le boisement

Sur une commune boisée à 85 %, sans risque recensé, avec un indice météo sous le seuil, la condition « à l'abri des incendies » passe de « plutôt défavorable » à « Condition ouverte ».
- Le constat (« la forêt couvre 85 % du territoire… ») et le geste sont conservés.
- `whyNotDecided` reprend la limite de la règle : « Un couvert forestier élevé ne suffit pas à établir un risque… ».

Pour revenir à l'ancien comportement sur ce seul cas, il suffit d'ajouter `"territoire.climat-feu"` à `VERIFICATIONS_ORIENTEES`. Le chemin `mismatch` de la même règle (risque recensé, ou indice au-dessus du seuil) oriente déjà, et n'est pas concerné.

### 4.4 Version du moteur

`ENGINE_VERSION` passe de `engine-4` à `engine-5` (`decision-artifact.ts`), avec la ligne d'historique. La règle du fichier le demande : la constante « se relève à la main quand une règle, un seuil ou une formulation change ce que le moteur conclut ».

## 5. Trois avant/après sur le vrai parcours de composants

**Banc** : `/dev/fut110` (dev uniquement, 404 en production). Des fixtures passent par la même chaîne que `assembleAddressDossier`, puis par le même `DossierDecisionSection` que `/rapport` (présentation classique). Le serveur a été lancé avec `DOSSIER_NARRATIVE=false` et sans clé Anthropic : **aucun appel au modèle**. Captures dans `docs/audits/fut110/`.

### Cas 1 — soins, commune favorable, médecin à 550 m

| | Avant | Après |
|---|---|---|
| Verdict | Les données disponibles sont plutôt **défavorables** pour un bon accès aux soins. | Les données disponibles sont plutôt **favorables** pour un bon accès aux soins. |
| État | Ouverte · plutôt défavorable | Ouverte · plutôt favorable |
| Constat | Un médecin généraliste se trouve à environ 550 m de cette adresse. | Pour l'accès aux soins, Châtelaillon-Plage se situe parmi les 20 % de communes où il est le plus favorable en France. Un médecin généraliste se trouve à environ 550 m de cette adresse. |
| Méthode (« Données et limites ») | Cette lecture est faite à l'échelle de la commune, sans seuil fixé par vous… | Le sens de cette lecture vient de la commune, sans seuil fixé par vous. Le constat autour de l'adresse ne l'oriente pas : il reste à vérifier. Elle éclaire votre condition sans pouvoir la trancher. Cette présence ne dit ni la disponibilité du praticien, ni ses délais de rendez-vous, ni s'il accepte de nouveaux patients. La distance est à vol d'oiseau. |
| Conséquence | Ce que l'on sait penche contre cette condition… | Ce que l'on sait de la commune va dans le sens de cette condition. Elle reste ouverte : à confirmer avant de décider. |
| Preuve, geste | 550 m · Renseignez-vous sur les délais de rendez-vous… | identiques |

Captures : [avant](fut110/avant-soins.jpg) · [après](fut110/apres-soins.jpg) · [après, « Données et limites » ouvert](fut110/apres-soins-donnees-et-limites.jpg).

### Cas 2 — transports, commune favorable, gare à 600 m

| | Avant | Après |
|---|---|---|
| Verdict | plutôt défavorables pour l'accès au train et aux gares | plutôt favorables pour l'accès au train et aux gares |
| État | Ouverte · plutôt défavorable | Ouverte · plutôt favorable |
| Constat | Une gare se trouve à environ 600 m de cette adresse. | Pour l'accès au train, Châtelaillon-Plage se situe parmi les 20 % de communes les mieux desservies par le train en France. Une gare se trouve à environ 600 m de cette adresse. |
| Méthode | phrase communale | … Le constat autour de l'adresse ne l'oriente pas : il reste à vérifier… La présence d'une gare ne dit ni la fréquence des trains, ni les destinations desservies, ni les horaires… |
| Geste | Vérifiez les horaires et destinations de la gare la plus proche | identique |

Captures : [avant](fut110/avant-gare.jpg) · [après](fut110/apres-gare.jpg).

### Cas 3 — dépendance automobile, commune favorable, secteur moins motorisé

| | Avant | Après |
|---|---|---|
| Verdict | plutôt défavorables pour une faible dépendance à la voiture | plutôt favorables pour une faible dépendance à la voiture |
| État | Ouverte · plutôt défavorable | Ouverte · plutôt favorable |
| Constat | Dans ce secteur, 45 % des ménages disposent d'au moins une voiture, contre 70 %… | Pour la possibilité de se déplacer sans voiture, Châtelaillon-Plage se situe parmi les 20 % de communes où elle est la plus favorable en France. Dans ce secteur, 45 % des ménages… |
| Méthode | phrase communale | … Le constat **sur le secteur de l'adresse** ne l'oriente pas… La possession d'une voiture reflète aussi la composition des ménages… |
| Preuve, geste | 45 % contre 70 % dans la commune · Testez vos trajets réels depuis cette adresse | identiques |

Captures : [avant](fut110/avant-auto.jpg) · [après](fut110/apres-auto.jpg).

## 6. Les contre-exemples

Tous sont des tests de `fut110-conditions-confirmees.test.ts`, sur la vraie chaîne. Ils portent sur l'objet produit (signal, état, texte, preuves, sections, verdict), pas sur le source.

| # | Cas | Résultat |
|---|---|---|
| 1 | Commune favorable + présence (×3), et + absence dans le périmètre (soins, gare) | Plutôt favorable ; rang puis constat ; aucune trace de « penche contre » ni de « défavorable » dans l'état, le constat, la méthode, la conséquence ou le verdict |
| 2 | Commune **défavorable** + médecin | Plutôt défavorable, sans le préambule « Vous avez placé… » ; le constat communal d'abord, le médecin ensuite ; « Ce que l'on sait **de la commune** penche contre » |
| 3 | Commune **neutre** + médecin | « Condition ouverte » ; « À l'échelle de la commune, un bon accès aux soins ne se distingue ni… » + médecin ; verdict « ne permettent pas encore de conclure » |
| 4 | Orientations divergentes : commune favorable + secteur **plus** motorisé, commune défavorable + secteur **moins** motorisé | Le rang garde le sens dans les deux cas, la nuance contraire reste écrite, la conséquence est attribuée à la commune |
| 5 | Exposition établie : bruit à 0,8 km, inondation notable | Plutôt défavorable ; méthode et conséquence **identiques au mot près** à `main` ; geste du bruit inchangé |
| 6 | Information absente : voisinage non analysé ; rang indisponible + médecin ; ni l'un ni l'autre | Carte communale identique à `main` ; carte neutre qui ne dit rien de la commune ; **aucune carte** inventée |
| 7 | Confirmée au **poids 1** | Même lecture, tier `secondary` (le poids règle toujours la matérialité) |
| 8 | **Non confirmée** | Pas de carte de condition ; la correspondance reste dans « Ce qui correspond », le médecin dans « À contrôler » |
| 9 | **Chaleur** confirmée (FUT-90) | Plutôt défavorable, constat chiffré, textes identiques ; le mismatch absorbé n'est réintroduit dans aucune composition (`assertCompositionsValid`) |
| 10 | **Trois** conditions (soins favorable, transports défavorable, bruit) | Chaque carte a son sens ; le médecin dans la carte soins seulement, la gare dans la carte transports seulement ; aucun fait affiché deux fois ; verdict « plutôt défavorables pour l'accès au train… et l'éloignement des grandes sources de bruit… » puis « plutôt favorables pour un bon accès aux soins » |
| + | Feu, commune boisée sans risque recensé | Condition ouverte, sans sens ; limite de la règle dans la méthode |
| + | Artefact sérialisé | Construit, sérialisé puis relu par `parseDecisionArtifact` ; `engine-5` ; la carte corrigée survit |
| + | Table des règles orientantes | Chaque identifiant existe dans `REGISTRY` ; les constats à confirmer n'y sont pas |

**Pouvoir discriminant.** Sur le code de `main`, le même fichier donne **14 échecs sur 21**. Ce sont exactement les cas concernés. Les 7 tests de non-régression passent (bruit, inondation, chaleur, non confirmée, voisinage absent, aucune carte, table).

### Différentiel systématique `main` / branche

Toutes les préférences du produit (29) ont été croisées avec :
- 4 rangs (favorable, neutre, défavorable, absent) ;
- commune seule ou adresse avec médecin, gare et secteur ;
- climat exposé ou épargné ;
- poids 1 ou 3 ;
- condition confirmée ou non.

Chaque fixture porte aussi une inondation notable, la santé exposée et 85 % de forêt. Cela fait **1 856 dossiers**, comparés sur leurs sections, leur plan narratif, leur registre et leur conclusion.

- **64 diffèrent**, tous **confirmés**, tous sur `acces_soins`, `acces_transports`, `faible_dependance_auto` (adresse) ou `faible_risque_feu` (climat épargné).
- Transitions : favorable → *favorable*, neutre → *neutre*, rang absent → *neutre*, défavorable → *défavorable* (le texte gagne le constat et l'attribution) ; feu → *neutre*.
- Sur ces 64 dossiers, **aucun** changement de sections, de registre des critères, d'étiquette de verdict, de contrôle prioritaire, de répartition des contrôles ou de compte des réserves. Seuls la carte de condition et le détail du verdict changent.
- Aucune exception levée, ni sur `main` ni sur la branche.

## 7. Tests exécutés

| Vérification | Résultat |
|---|---|
| `node --test src/lib/decision/fut110-conditions-confirmees.test.ts` | 21/21 |
| Ciblés : FUT-7, FUT-90, compositions, plan de conclusion, assembleur, FUT-110 | 263/263 |
| `node --test src/lib/decision/*.test.ts` | 1 028/1 028 (1 007 existants inchangés + 21) |
| Suite complète `node --test --test-force-exit "src/**/*.test.ts" "src/**/*.test.tsx" "scripts/**/*.test.mjs"`, **lancée seule** | **2 617/2 617**. Base `main` lancée seule dans les mêmes conditions : 2 596. Écart : exactement les 21 tests ajoutés, aucun fichier omis |
| `tsc --noEmit` | 0 erreur |
| ESLint sur les fichiers modifiés | 0 erreur (le fichier de test est ignoré par la configuration du dépôt, comme les autres tests) |
| `npm run build` (avec `index:verify`) | Succès ; `/dev/fut110` listée en dynamique |

Une première exécution de la suite complète a échoué sur le garde-fou FUT-33 (`fut33-mer-index.test.ts`) : la fixture de la page dev citait `mer_centre_km`. Le champ, inutile ici, a été retiré : la liste fermée n'a pas été élargie.

**Aucune validation de bout en bout en production.** Tout repose sur des fixtures. Aucune donnée client, aucun appel Anthropic, aucune écriture en base.

## 8. Limites restantes

1. **Dossiers acquis.** `dossierAServir` sert toujours l'artefact figé. Un dossier `engine-4` concerné garde « plutôt défavorable » jusqu'à ce que son lecteur demande une nouvelle version. Les identifier demanderait une lecture en base (non faite) : des artefacts dont une carte `condition_check` sur l'une des quatre clés réunit un fait `autour.*`, `secteur.*` ou le boisement. Faut-il les réémettre de façon proactive ? C'est une décision produit, hors de ce ticket.
2. **Conclusion rédigée.** Le plan d'un dossier vivant concerné change, donc son hash aussi. Si `shouldGenerateNarrative` le permet (au moins deux registres générables), la rédaction est refaite une fois, à la prochaine ouverture. C'est le cas de tout changement du moteur.
3. **Le détail du verdict reste global.** « Les données disponibles sont plutôt défavorables pour… » ne dit pas que c'est la commune qui penche. La carte le dit. Changer `sensRegroupes` (`conclusion-plan.ts`) touchait le texte de toutes les conditions : à traiter dans FUT-17 si souhaité.
4. **Face de carte plus longue.** Deux phrases au lieu d'une. Sur le cas voiture, la phrase de secteur porte en plus sa convention (« futur•e signale cet écart à partir de 15 points »), écrite par sa règle. C'est lisible sur la capture, mais dense.
5. **Typographie préexistante.** Dans la phrase de rang, « 20 % » peut se couper entre « 20 » et « % » (capture soins). C'est le gabarit de `rankFractionFavorable`, identique sur les cartes de correspondance de `main` : non traité ici.
6. **Présentation « Relevé »** (FUT-91, éteinte en production). Elle lit les mêmes champs (`statement`, `whyNotDecided`, `action`), mais n'a pas été capturée.
7. **Le défaut « n'oriente pas »** protège contre l'inversion, mais une nouvelle règle d'exposition qui oublierait de s'ajouter à `VERIFICATIONS_ORIENTEES` rendrait sa condition « ouverte » au lieu de « plutôt défavorable ». Le test vérifie que les identifiants listés existent, pas l'exhaustivité.
8. **Le banc `/dev/fut110`** affiche un encart « Affiner avec une adresse » sur un dossier d'adresse : la page ne transmet pas le module Logement. C'est un artefact du banc, pas du produit.

## 9. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `src/lib/decision/condition-rules.ts` | `VERIFICATIONS_ORIENTEES`, `lectureDe`, constat juxtaposé, `pourquoiDe`, `consequenceDe`, ordre lecture puis constats |
| `src/lib/decision/hard-constraint-rules.ts` | `consequenceDuSignal(signal, porteur?)` : paramètre facultatif, sortie identique sans lui |
| `src/lib/decision/decision-artifact.ts` | `ENGINE_VERSION` `engine-5`, ligne d'historique |
| `src/lib/decision/fut110-conditions-confirmees.test.ts` | Nouveau : 21 tests sémantiques |
| `src/app/dev/fut110/page.tsx` | Nouveau : banc de fixtures, dev uniquement |
| `docs/audits/2026-10-16-fut110-conditions-confirmees.md`, `docs/audits/fut110/*.jpg` | Ce compte rendu et ses captures |

Aucun fichier des branches FUT-50 n'est touché. `feat/fut-50-accueil-decision` et `feat/fut-50-socleom-integration` ne modifient aucun de ces fichiers (§K.5 de FUT-85).

## 10. Implications pour FUT-20 et FUT-17

**FUT-20 (pilote chaleur × logement).** La décision D4 de FUT-85 (« si la chaleur est confirmée, la carte condition reprend le côté logement et son geste ») dépendait de S1. Ce prérequis est levé, et le mécanisme est prêt :
- un fait Logement absorbé par la condition chaleur entrera dans les constats à confirmer, avec son échelle (« autour de l'adresse » ou, pour un attribut du logement, l'adresse) et sa limite ;
- il ne pèsera pas sur le signal, sauf déclaration explicite dans `VERIFICATIONS_ORIENTEES`.

Point d'attention : la table `ECHELLE_DU_CONSTAT` dit « autour de l'adresse » pour tout grain `adresse`. Un attribut **du logement** (DPE, relation `attribut`) devra se dire « sur le logement ». C'est une ligne à ajouter quand le premier fait de ce type entrera dans une carte de condition. Aucun n'y entre aujourd'hui.

**FUT-17 (audit des textes V1).** À ajouter à son périmètre :
- les deux gabarits de `whyNotDecided` introduits ici ;
- la conséquence attribuée (« Ce que l'on sait de la commune ») ;
- la question du détail du verdict, global par sens (§8.3) ;
- la longueur de la face de carte quand deux constats se juxtaposent (§8.4).

Le reste de la liste FUT-85 §J est inchangé (`POURQUOI_*`, `consequenceDuSignal`, règle transports contre chaleur, D7).

**Hors périmètre, non traités** : S2 (nuits chaudes du module Logement), FUT-103, le compromis transports × chaleur, FUT-50. Aucun ticket Linear n'a été modifié.
