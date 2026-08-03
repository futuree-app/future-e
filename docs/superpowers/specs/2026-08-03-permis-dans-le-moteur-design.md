# Les permis d'urbanisme entrent dans le moteur de décision

**Date** : 2026-08-03 · **Statut** : SPÉCIFIÉ, pas implémenté. · **Point 1 des quatre restes de**
`2026-08-01-permis-autour-adresse-design.md`.

## Ce que ça répare

`decision-assembler.ts:32` l'écrit depuis le premier jour de la liste des contrôles :

> les permis autour de l'adresse, les abords et la conclusion Autour produisent des constats **hors
> moteur**

Conséquence : le registre des autorisations est appelé, gelé, rendu à l'écran, doté d'une doctrine
complète, et il n'existe pour le moteur de décision. Il n'a ni `DecisionFact`, ni règle, ni grain
déclaré. Il est donc absent du verdict, absent de la minute, absent de `ControlesDuDossier`, et le
groupe « Autour de l'adresse » de cette liste ne porte qu'un seul item, l'équipement automobile du
secteur.

C'est la raison pour laquelle le titre de la liste dit « établis par nos sources » et non « tous les
points à vérifier » : la vue est exhaustive de ce que le MOTEUR a établi, pas de ce que le produit
sait.

## Périmètre : les permis seuls

Trois familles de faits d'adresse sont hors moteur : les permis, l'îlot de chaleur urbain et
l'espace vert le plus proche. Ce lot ne traite **que les permis**, et le porteur l'a tranché ainsi le
03/08/2026 :

| Lot | Objet | Pourquoi cet ordre |
|---|---|---|
| 1 | permis | doctrine déjà tranchée, donnée déjà gelée, périmètre mesuré (une adresse sur quatre) |
| 2 | ÎCU | réutilise le patron établi ici |
| 3 | espace vert | idem, mais **après** l'audit de la sémantique de distance et d'accessibilité, déjà décidé |

La tension générale (« un fait d'adresse peut-il peser sur un verdict conçu au grain commune ? ») est
gravée dans `docs/vault/doctrine/data.md` et reste ouverte. Ce lot ne la tranche pas en général : il
la tranche sur un cas, et laisse derrière lui un patron vérifiable.

## La règle

Une seule règle, `autour.permis`, dans un fichier neuf `src/lib/decision/permis-rules.ts`, importée
par le `REGISTRY` à côté de `SECTEUR_RULES`.

### Activation : inconditionnelle

`projectKeys: []`, comme les règles du logement (`logement-rules.ts:22`), et non le patron du secteur
qui exige une priorité déclarée de poids ≥ 2.

**Personne ne déclare « je veux savoir ce qui va se construire à côté ».** C'est l'inconnu décisif
type, celui que le lecteur ne sait pas demander, et le chantier a déjà tranché que c'est « la seule
question qu'aucune visite ne peut trancher ». Le bruit est borné par la rareté même du signal, une
adresse sur quatre, et par le filtre des non achevés.

Conséquence assumée : le fait **n'entre jamais dans le verdict de correspondance**, qui suppose une
préférence à confronter. Il vit dans le registre `verification`, celui des constats établis.

**Ce qui a été écarté** : activer sur `cadre_calme`. Cette préférence est définie comme « environnement
peu dense » au grain COMMUNE, et un permis ne mesure ni le bruit ni la densité. On aurait emprunté une
préférence pour un motif qu'elle ne couvre pas.

### Matérialité : `secondary`, toujours

> Un permis non achevé est toujours un fait `secondary`. L'ouverture du chantier augmente la
> **certitude temporelle** du constat, jamais sa **matérialité décisionnelle**, faute d'information
> sur l'ampleur et les effets de l'opération.

Ce que le fait établit : une autorisation créant des logements, dans le rayon observé, non achevée,
éventuellement avec chantier déclaré ouvert. Ce qu'il n'établit pas : le nombre de logements,
l'emprise, les nuisances, l'effet sur les flux, le calme, les vues ou les services.

Passer à `structuring` sur `chantier_ouvert` ferait glisser de « le changement est plus concret » à
« ce changement structure la décision », et la seconde proposition n'est pas démontrée. C'est déjà la
règle écrite dans `secteur-rules.ts` : « un fait qui ne peut pas conclure ne doit pas peser comme s'il
le pouvait ».

`structuring` redeviendra défendable le jour où une donnée objectivera l'effet : volume, emprise,
nature précise, ou relation explicite à une contrainte du projet. Aujourd'hui ce serait un rang
accordé à l'intuition plutôt qu'à la preuve.

### Un seul fait, agrégé

Quels que soient le nombre de dossiers et la variété des états, la règle émet **un fait unique**. Un
fait par permis produirait plusieurs cartes portant le même geste.

## La table des cas

```text
permis absent (registre non consulté)
→ uncertain
→ aucun fait
→ reason : « registre des autorisations non consulté »

permis présent, aucun dossier retenu
→ not_applicable
→ aucun fait

permis présent, uniquement des achevés
→ not_applicable
→ aucun fait

au moins un dossier non achevé
→ verification
→ un seul fait agrégé, secondary, échelle « Autour de l'adresse »
```

### Pourquoi `uncertain` et non `not_applicable` sur un registre non consulté

Le contrat les distingue explicitement (`decision-fact.ts:361-368`) :

- `not_applicable` : **hors sujet**, la règle ne s'applique pas ici ;
- `uncertain` : la règle **s'applique**, la donnée manque, sans même un fait à montrer.

Un registre non consulté (dossier antérieur au 01/08/2026, ou API muette au moment de l'analyse)
relève du second. Écrire `not_applicable` dirait que la question ne se pose pas pour cette adresse,
et réintroduirait au niveau du moteur exactement la confusion entre « rien trouvé » et « pas lu » que
tout le reste du produit s'emploie à fermer.

Aucune carte n'est produite dans les deux cas : la différence est dans ce que le moteur DIT de
lui-même, pas dans ce que le lecteur voit.

**Ce que cet état ne fait pas** : il ne fait pas bouger la couverture des critères du projet. La
couverture s'indexe sur les `projectKeys`, et cette règle en a zéro, donc il n'y a aucun critère à
marquer examiné. L'évaluation reste observable dans le `RunResult`, donc dans les tests et dans la
table des évaluations de `/dev/dossier`, et nulle part ailleurs.

## Le contenu du fait

### `status` : cinq formes courtes, parce que le fait AGRÈGE

| Composition | `status` |
|---|---|
| Un seul, chantier ouvert | Chantier ouvert |
| Un seul, non commencé | Autorisation non commencée |
| Plusieurs, tous ouverts | Chantiers ouverts |
| Plusieurs, aucun ouvert | Autorisations non commencées |
| États mixtes | Autorisations non achevées |

Deux formes ne suffiraient pas : un fait agrégeant trois dossiers mixtes afficherait « Chantier
ouvert », vrai d'une partie des données et faux comme résumé de la carte.

### `statement` : ce qui a été trouvé

> Trois autorisations créant des logements sont recensées à moins de 50 m, dont deux chantiers
> déclarés ouverts.

Il porte le nombre, l'objet du registre, la composition des états et **le rayon gelé**.

Contrairement à la charnière de la conclusion Autour, le `statement` DOIT porter les chiffres : c'est
une carte autonome, lue dans une liste, pas une phrase posée sous une autre qui les dit déjà.

### `signalConvention` : pourquoi futur•e le fait remonter

> futur•e signale les autorisations non achevées déposées dans les trois années précédant l'analyse.

Il porte la fenêtre gelée, le choix de ne retenir que les non achevées, et le caractère conventionnel
du signalement.

**La séparation est stricte.** Mettre le rayon ET la fenêtre dans les deux champs recréerait à
l'intérieur d'une seule carte la redondance que la vérification à l'écran du 01/08 a révélée entre le
bloc des permis et la conclusion. Le `statement` démontre un fait ; la convention explique pourquoi
ce fait devient un contrôle.

### `topic` : « les autorisations d'urbanisme récentes »

39 caractères, sans ponctuation, sans nom de commune, sans grain (`assertFactValid`, borne 70).

### `action` : le geste comble le manque de la donnée

| | |
|---|---|
| `type` | `obtenir_document` |
| `label`, un seul dossier | Demandez en mairie à consulter le dossier de l'autorisation |
| `label`, plusieurs | Demandez en mairie à consulter les dossiers des autorisations |
| `detail` | Repérez notamment la nature de l'opération, la hauteur et la surface de plancher indiquées dans le dossier. |

58 et 61 caractères, sous la borne de 70, sans point final (`materiality-rules.ts:864`).

**C'est la propriété rare de ce fait** : le dossier déposé en mairie porte la nature de l'opération,
la surface de plancher et la hauteur, c'est-à-dire exactement les trois informations que le registre
SDES ne publie pas et qui décideraient de la matérialité. Le geste ne conseille pas la prudence, il
indique où récupérer la donnée absente qui empêche futur•e d'interpréter l'effet du permis.

Trois formulations ont été écartées :

- **« Regardez le panneau sur place »** : l'affichage n'est obligatoire qu'à partir de la notification
  et pendant les travaux. Sur une autorisation déposée en 2023 et jamais commencée, il peut n'y avoir
  plus rien à regarder, et le lecteur conclurait à tort qu'il n'y a pas de projet.
- **Deux gestes selon l'état** : le manque est identique dans les deux cas, on ignore ce que
  l'autorisation porte réellement. L'état change la certitude temporelle du constat, pas
  l'information qui manque au lecteur.
- **« Demandez l'accès au dossier »** : `detail` ne doit affirmer ni droit ni délai, il décrit la
  pratique et jamais la règle de droit (invariants 3 et 5, `decision-fact.ts:93`). « Demandez à
  consulter » est une pratique ; « demandez l'accès » énonce un droit. De même « repérez notamment »
  plutôt que « pour connaître » : rien ne garantit que chaque pièce soit complète ou lisible.

### `limitation`

> Le registre ne recense que les autorisations créant des logements.

Un entrepôt, un commerce, une extension sans logement nouveau n'y figurent pas. La mention est déjà
verrouillée par un test dans le module ; elle accompagne le fait pour la même raison.

## La preuve

```ts
{
  factId: "autour.permis",
  module: "logement",
  label: "Autorisations d'urbanisme · parcelles à moins de 50 m",
  observedValue: "1 dossier non achevé, dont 1 chantier déclaré ouvert",
  grain: "adresse",
  relation: "proximite",
  href: "/rapport/autour#permis",
  sourceMode: "persisted_snapshot",
  observedAt: <consulteLe du snapshot>,
}
```

**Le « 50 m » du `label` est illustratif** : comme dans le
`statement` et la `signalConvention`, tout nombre écrit ici vient du snapshot gelé (`rayonMeters`,
`ancienneteMaxAns`, `annee`), jamais des constantes du jour. Un dossier créé sous un ancien rayon doit
continuer de décrire le périmètre qui l'a réellement sélectionné.

### `grain` + `relation` donnent l'échelle, et elle tombe juste

`grain: "adresse"` avec `relation: "proximite"` produit l'échelle **quartier** (`echelles.ts:63`),
donc le groupe « Autour de l'adresse » de la liste des contrôles, celui qui ne portait qu'un item.

Le test doctrinal du fichier tranche dans ce sens : « est-ce que le constat parle de ce que le lecteur
VIVRA AUTOUR, ou de ce qui ATTEINT SON BIEN ? ». Un chantier voisin est du premier ordre. Une cavité
souterraine à 300 m resterait du second, malgré une preuve en distance elle aussi.

### `observedAt` répare l'invariant bricolé la veille

La charnière de la conclusion Autour ne porte aucune date et dépend, pour son sens, du « consulté
le … » rendu dans le bloc au-dessus. C'est un invariant de mise en page, écrit en commentaire faute
de mieux.

Ici, `sourceMode: "persisted_snapshot"` et `observedAt: consulteLe` font de la date de consultation
une **propriété de la preuve**, portée partout où le fait est projeté : carte, liste, conclusion,
export futur. Le problème disparaît au lieu d'être documenté.

**Le contrat doit être élargi** : `decision-fact.ts` commente aujourd'hui `observedAt` par « pour
live_fetch ». Le champ devient la date à laquelle la source a été observée, qu'elle soit lue en direct
ou conservée dans un snapshot persistant. Sans cette correction le code serait juste et sa
documentation dirait qu'il ne l'est pas.

### L'ancre `#permis` demande trois lignes de kit

`ReportSection` (`kit.tsx:28`) n'accepte aujourd'hui que `eyebrow`, `tone` et `children` : il n'y a
aucune ancre à cibler. Le lot ajoute une prop `id?: string` posée sur le `<section>`, et
`AutourModule` la renseigne sur le bloc des permis. Sans elle, `href` ne mènerait qu'en haut du
module, ce qui est exactement le défaut que `targetKey` existe pour corriger.

**Aucun `targetKey` n'est inventé** : le vocabulaire partagé (`evidence-targets.ts`) n'en contient pas
pour les permis, et un lien qui promettrait une démonstration inexistante vaut moins qu'un lien
absent.

## Le chemin de la donnée

Aucune I/O nouvelle, aucune source nouvelle : le snapshot est déjà gelé et déjà payé.

1. `page.tsx:94` tient `logementForCommune`, un `AddressDossierRow` dont `snapshot` porte `permis`.
2. Il le passe en prop à `DossierAvecLogement`, exactement comme `savedDpe`.
3. `DossierAvecLogement.tsx:45` l'ajoute aux `ModuleFacts`, là où il pose déjà
   `secteur: buildSecteurFacts(car)`.
4. `ModuleFacts` gagne `permis?: PermisSnapshot`, **optionnel pour la même raison que `secteur`** :
   absent veut dire que le registre n'a pas été consulté, jamais qu'il n'y a rien.

Le fait produit est donc lu par la minute et par `ControlesDuDossier` depuis le MÊME dossier, ce qui
est déjà l'invariant de la liste des contrôles.

## Les tests

Dix-neuf, sous `node --test`, dans `permis-rules.test.ts`. Le tableau ci-dessous en donne
les onze qui portent une décision ; le plan d'implémentation les décline en dix-neuf cas.

| Cas | Attendu |
|---|---|
| `permis` absent | `uncertain`, aucun fait |
| Consulté, liste vide | `not_applicable`, aucun fait |
| Que des achevés | `not_applicable`, aucun fait |
| Un chantier ouvert | un fait, `status` « Chantier ouvert » |
| Un non commencé | `status` « Autorisation non commencée » |
| Plusieurs, tous ouverts | `status` « Chantiers ouverts », `label` d'action au pluriel |
| Plusieurs, aucun ouvert | `status` « Autorisations non commencées » |
| États mixtes | `status` « Autorisations non achevées », jamais « Chantier ouvert » |
| **Jamais `structuring`** | sur les cinq compositions, `materialityTier === "secondary"` |
| **Rayon et fenêtre du snapshot** | un snapshot à 80 m sur 5 ans écrit 80 et 5, jamais 50 et 3 |
| **La preuve porte sa date** | `sourceMode === "persisted_snapshot"` et `observedAt === consulteLe` |

Les trois derniers verrouillent une doctrine plutôt qu'un comportement.

`assertFactValid` couvre déjà, sans test dédié, la borne des 70 caractères sur `topic` et
`action.label` et l'absence de point final : le fait est validé par le moteur à chaque run, et une
violation jette.

## Ce que ce lot ne fait pas

- **L'ÎCU et l'espace vert restent hors moteur.** Le patron établi ici les attend, et l'espace vert
  attend en plus l'audit de la sémantique de distance.
- **Le fait n'entre pas dans le verdict de correspondance**, par construction : sans `projectKeys`, il
  n'y a pas de préférence à confronter.
- **Rien ne change dans le module Autour**, hormis l'ancre : le bloc, sa doctrine et la charnière de
  la conclusion restent tels quels. Le moteur lit la même donnée gelée, il ne la reprend pas.
