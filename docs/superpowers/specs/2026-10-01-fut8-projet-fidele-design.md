# FUT-8 : un Projet fidèle, des définitions décisionnelles, des critères tranchables

1er octobre 2026. **Spécification d'implémentation, rien n'est codé.** Elle part de l'audit
`docs/audits/2026-10-01-fut8-capacites-cibles.md` (phase 0) et des arbitrages produit qui l'ont
suivi (addendum de l'audit). Après validation, l'implémentation démarre sans nouvel arbitrage
structurel.

Base : `main` à `2f4d8388` (FUT-7 mergé).

---

## 1. Doctrine

**Répondre honnêtement oui ou non au plus grand nombre de questions.** Maximiser `trancher` ne veut
pas dire seuiller les indicateurs existants : une question reste `apprecier` tant que futur•e ne mesure
qu'un proxy. FUT-8 traite les cas où le moteur sait répondre, mais où le Projet perd une métrique, une
unité, un seuil, un mode, un périmètre, une provenance ou une définition.

**La précision du moteur ne contamine pas le langage de l'interface.** Trois couches, toujours
distinctes :

| Couche | Qui la voit | Exemple |
|---|---|---|
| **Langage du lecteur** | toujours | « Vivre en Bretagne », « Être près de Nantes », « Quitter Lyon » |
| **Interprétation de futur•e** | seulement quand elle compte, derrière « Comment futur•e l'interprète » | « Pour cette analyse, futur•e considère ici la Bretagne dans ses limites régionales actuelles. » |
| **Moteur** | jamais tel quel | jeton `bretagne`, codes de départements, `unite_urbaine`, `vol_oiseau`, `zone:sud-ouest@1`, empreintes |

Aucun écran ne demande au lecteur de parler comme le moteur. Il écrit « je veux éviter les
canicules » ; c'est futur•e qui sait quels indicateurs lire.

**futur•e ne devient pas un questionnaire.** Une ambiguïté sans effet reste en silence. Une précision se
demande seulement :
1. quand le lecteur fait d'un critère une condition sans compromis ;
2. quand l'ambiguïté empêche un critère important de produire une réponse ;
3. quand le lecteur choisit lui-même d'affiner son Projet.

---

## 2. Les dimensions indépendantes du Projet

| Dimension | Ce qu'elle dit | Qui l'écrit | Où elle vit |
|---|---|---|---|
| `parsed` | ce que futur•e a **compris** du texte | le parseur | `UserProject.parsed` |
| `definitions` | ce que le lecteur a **précisé ou accepté** comme sens d'un critère | un geste du lecteur | `UserProject.definitions` (nouveau, hors de `parsed`) |
| importance | ce critère compte peu, beaucoup, énormément | le parseur, puis le lecteur | `parsed.preferences[].weight` aujourd'hui (voir §2.1) |
| `adoptions` | « futur•e m'a proposé ce critère, je le reprends à mon compte » | un geste du lecteur | `UserProject.adoptions` (nouveau, hors de `parsed`) |
| `conditions` | « si ce critère n'est pas respecté, je n'envisage pas ce lieu » | un geste du lecteur | `UserProject.conditions` (FUT-7) |

**Un seul écrivain par structure.** Le parseur écrit `parsed`, et lui seul ; aucun geste du lecteur ne
modifie `parsed`. Les gestes écrivent `definitions`, `adoptions` et `conditions`, jamais l'inverse.

**Une définition existe sans condition.** « À moins de 20 km de Nantes, à vol d'oiseau » est une
précision du Projet ; ce n'est pas, en soi, une condition sans compromis. Le modèle ne lie jamais une
définition à une condition : chacune a son propre geste, sa propre empreinte, son propre retrait.

### 2.1 L'importance dans FUT-8

FUT-8 n'ajoute pas d'écran d'importance. Il garantit seulement qu'elle reste séparée :
- pour une préférence, l'importance est son poids ;
- pour un critère géographique, qui n'a pas encore de poids, la règle transitoire de FUT-7 reste
  (écart **structurant** quand il n'est pas rempli, sans prétendre que le lecteur a choisi « poids 3 ») ;
- le champ `importance` utilisateur, s'il vient plus tard, vivra hors de `parsed`, comme `definitions`.

---

## 3. Les types cibles

### 3.0 L'identité d'un critère : `CriterionInstanceRef`

Une famille peut contenir plusieurs éléments (« quitter Lyon, éviter Bordeaux »). Une définition, une
adoption, une condition et une suggestion désignent donc un **élément**, jamais une position dans un
tableau.

```ts
type CriterionInstanceRef =
  | { kind: "hard"; key: HardConstraintKey; instance: string | null }
  | { kind: "preference"; key: PreferenceKey; instance: null };
```

L'identité canonique de l'instance, par famille, ne dépend ni de l'ordre ni de la casse :

| Famille | Instance | Raison |
|---|---|---|
| `excludePlace` | nom normalisé de la ville (`normalizeName`) : `"lyon"` | chaque ville se quitte indépendamment |
| `excludeZones` | jeton : `"idf"`, `"nord"` | chaque exclusion est indépendante (une union) |
| `zones`, `departements` | `null` : le **périmètre entier** | les ancres se composent (`zonesMatch` all / any) en un seul périmètre ; la condition porte sur lui |
| `nearPlace`, `communeSize`, `sizeRelativeTo`, `nearSea`, `excludeSea`, `montagne`, `reliefProche` | `null` | un seul élément par famille |
| préférences | `null` | une clé, une préférence (dédoublonnée depuis le 12/08) |

`CriterionRef` de FUT-7 devient `CriterionInstanceRef` (`instance` absent = `null` à la lecture). Aucune
confirmation n'existe en production : l'évolution ne périme rien de réel.

Conséquences :
- **évaluation par instance** dans le dossier : pour `excludePlace` et `excludeZones`, l'adaptateur
  évalue chaque élément séparément (le noyau est appelé avec un seul élément) ; la Recherche garde
  l'évaluation de la famille entière, inchangée ;
- **péremption par instance** : si « Lyon » devient « Nantes » au reparse, l'instance `lyon` disparaît ;
  sa définition et sa condition deviennent périmées, et celles de `bordeaux` restent valides ;
- **suggestions par instance** : « absolument quitter Lyon, éviter Bordeaux » produit un `forceMarker`
  sur `{excludePlace, "lyon"}` seulement.

### 3.1 Ce que le parseur conserve (`parsed`)

Le parseur garde **ce qui a été dit**, et seulement cela. `null` signifie « non dit ».

```ts
type DistanceMetric = "vol_oiseau" | "route";          // une distance en km
type TravelMode = "car" | "walk" | "bike";
type SizeUnit = "commune" | "unite_urbaine";
type CityScope = "commune" | "unite_urbaine";

// nearPlace : le seuil dit, et sa nature.
type NearPlaceParsed = {
  label: string;
  maxKm: number | null;
  maxMinutes: number | null;
  metric: DistanceMetric | null;   // NOUVEAU : « à vol d'oiseau », « par la route » ; null si non dit
  mode: TravelMode | null;
};

// communeSize : des bornes DITES, avec leur unité si elle est dite.
type CommuneSizeParsed = {
  min: number | null;
  max: number | null;
  unit: SizeUnit | null;           // NOUVEAU : « commune de… », « agglomération de… »
};

// « petite ville », « ville moyenne », « grande ville » : un MOT, jamais des bornes inventées.
type SizeWord = "petite" | "moyenne" | "grande";
// Porté par une préférence qualitative (eviter_grandes_villes / prefere_grande_ville / eviter_isolement)
// et par `parsed.sizeWord: SizeWord | null` (NOUVEAU) pour que le libellé humain le restitue.

type SizeRelativeParsed = { label: string; direction: "smaller" | "larger"; unit: SizeUnit | null };

type ExcludePlaceParsed = { label: string; scope: CityScope | null };   // « quitter la commune de Lyon »

// Exclusions de zone : le jeton ET le mot du lecteur, pour ne plus confondre « région parisienne »
// et « Île-de-France ».
type ExcludeZoneParsed = { token: string; said: string | null };
// Compatibilité : `excludeZones: string[]` legacy reste lisible (said: null).

// Mots forts : une SUGGESTION de condition, jamais une condition.
type ForceMarker = { criterion: CriterionInstanceRef; quote: string };   // parsed.forceMarkers?: ForceMarker[]

// Préférences : la provenance, telle que le parseur l'a produite. « parse » = lue dans le texte ;
// « ancre » = dérivée d'une commune-ancre. Un geste ne la change JAMAIS (voir `adoptions`).
type PreferenceSource = "parse" | "ancre";   // parsed.preferences[].source ; absent = "parse" legacy
```

Ce que la consigne du parseur **cesse** de faire : écrire `communeSize: {5000, 25000}` pour « petite
ville » ; rendre une mention nue « dure » pour le Projet (le champ `strength` reste, il sert la
Recherche).

### 3.2 Ce que le lecteur précise ou accepte (`definitions`)

Une union discriminée, une variante par famille de précision. Chaque variante n'admet que les
combinaisons possibles : on ne peut pas écrire une métrique « route » avec un temps de trajet, ni une
unité sur une région.

```ts
type DefinitionBase = {
  criterion: CriterionInstanceRef;  // la famille ET l'élément (§3.0)
  parsedFingerprint: string;        // empreinte de la valeur `parsed` de CET élément, vue par le lecteur
  definedAt: string;
  source: "user";                   // la seule valeur admise
};

type Definition = DefinitionBase & (
  // Distance vers un lieu : la métrique, et éventuellement un seuil corrigé.
  | { kind: "distance_lieu"; metric: DistanceMetric; maxKm: number }
  // Temps vers un lieu : le mode, et éventuellement un seuil corrigé.
  | { kind: "temps_lieu"; mode: Exclude<TravelMode, "bike">; maxMinutes: number }
  // Taille : l'unité, et éventuellement des bornes corrigées.
  | { kind: "taille"; unit: SizeUnit; min: number | null; max: number | null }
  // Taille relative : l'unité de comparaison.
  | { kind: "taille_relative"; unit: SizeUnit }
  // Quitter une ville : le périmètre, par ville.
  | { kind: "quitter_ville"; scope: CityScope }
  // Région parisienne : le périmètre choisi parmi ceux que les données testent.
  | { kind: "perimetre_parisien"; perimetre: "paris" | "petite_couronne" | "agglomeration" | "ile_de_france" }
  // Une convention de futur•e acceptée comme sens du critère (macro-zones dans FUT-8 ; tailles
  // qualitatives, climat plus tard).
  | { kind: "convention"; conventionId: string; conventionVersion: number }
);

// « Je reprends ce critère à mon compte » : une préférence proposée par une ancre, adoptée.
type Adoption = {
  criterion: Extract<CriterionInstanceRef, { kind: "preference" }>;
  parsedFingerprint: string;        // la préférence telle que futur•e l'a proposée
  adoptedAt: string;
  source: "user";
};

type UserProject = /* FUT-7 */ & {
  definitions?: Definition[];   // absent = aucune précision ; jamais vide en base
  adoptions?: Adoption[];       // absent = aucune adoption ; jamais vide en base
};
```

**Invariants vérifiés à la lecture** (comme `normalizeConditions`) : `kind` compatible avec la famille
du critère ; seuils finis et positifs ; `mode` routable ; `conventionId` présent dans le registre et
applicable à ce critère ; `source: "user"`. Ce qui échoue **tombe**, entrée par entrée.

### 3.3 La valeur effective d'un critère

```
valeurEffective(critère) = parsed(critère) ⊕ definition(critère)  si definition valide (non périmée)
                         = parsed(critère)                         sinon
```

- `distance_lieu` : impose `metric` et `maxKm`, retire `maxMinutes`.
- `temps_lieu` : impose `mode` et `maxMinutes`, retire `maxKm`.
- `taille` : impose `unit`, `min`, `max`.
- `quitter_ville` : impose `scope` sur l'instance.
- `perimetre_parisien` : remplace le jeton `paris` / `idf` par le périmètre choisi.
- `convention` : attache la définition versionnée (pour une macro-zone : la liste de départements de la
  version acceptée, figée par la version, même si la table évolue).

C'est la valeur effective que lisent **l'hydratation du dossier, `criterionCapability`, l'empreinte
de condition et les libellés**. La Recherche, elle, continue de lire `parsed` (ses filtres ne
changent pas), sauf quand le lecteur reprend explicitement son Projet pour chercher (hors FUT-8).

### 3.4 Empreintes, péremption, reparse

| Objet | Empreinte | Devient périmé quand… | Effet |
|---|---|---|---|
| définition | `parsedFingerprint` = empreinte de la valeur `parsed` du critère (et de l'instance) | le reparse change ce que le lecteur avait sous les yeux (« Nantes » → « Rennes ») | ignorée, gardée en base, proposée à nouveau |
| adoption | `parsedFingerprint` = empreinte de la préférence proposée | l'ancre ou le trait proposé change au reparse | ignorée, gardée, proposée à nouveau |
| condition (FUT-7) | empreinte de la **valeur effective** de l'élément (`criterion-value.ts` étendu à la définition et à l'instance) | la valeur effective change (nouvelle définition, nouveau seuil, reparse) | ignorée, gardée, proposée à nouveau |

`criterionFingerprint` évolue ainsi : `hard:<clé>:<canonique(valeurDecisionnelle(valeurEffective))>`,
où la valeur décisionnelle inclut désormais `metric`, `unit`, `scope`, le périmètre parisien et
`conventionId@version`. **Aucune confirmation n'existe en production** (pas de geste avant FUT-8) :
changer le format de l'empreinte ne périme rien de réel. Les tests FUT-7 seront mis à jour.

**Reparse** (le lecteur corrige son texte) : `parsed` est remplacé, `definitions` et `conditions` sont
reportés par le serveur (comme FUT-7), et chacun redevient valide seulement si son empreinte
correspond encore. Aucune précision n'est transférée d'un critère à un autre.

### 3.5 Le registre des conventions

```ts
type ConventionStatus =
  | "historique"        // existe dans le code, non justifiée : jamais pour trancher
  | "experimentale"     // en cours de justification : jamais pour trancher
  | "perimetre"         // définit un PÉRIMÈTRE dont l'appartenance se mesure exactement : tranchable une fois acceptée
  | "validee";          // mesure sourcée et défendable : tranchable une fois acceptée

type Convention = {
  id: string;                         // "zone:sud-ouest"
  version: number;                    // 1
  criterion: { kind: "hard"; key: HardConstraintKey } | { kind: "preference"; key: PreferenceKey };
  definition:                          // structurée, jamais une phrase
    | { kind: "departements"; departements: string[] }
    | { kind: "seuil_population"; unit: SizeUnit; min: number | null; max: number | null }
    | { kind: "seuil_altitude"; metres: number; mesure: "chef_lieu" | "adresse" }
    | { kind: "climat"; indicateurs: string[]; horizon: string; seuil: number };
  grainsValides: ("commune" | "adresse")[];
  libelleCourt: string;               // « le Sud-Ouest tel que futur•e le délimite »
  explication: string;                // la phrase secondaire « Comment futur•e l'interprète »
  justification: string | null;       // source, norme, raisonnement ; null = « justification externe à rechercher »
  status: ConventionStatus;
};
```

**Une convention contribue à `trancher` seulement si** son statut est `perimetre` ou `validee`, que le
lecteur l'a acceptée (`definitions`), et que le grain évalué est dans `grainsValides`.

Pourquoi `perimetre` suffit pour les macro-zones : le fait mesuré (le département de la commune) est
exact ; seule la frontière est conventionnelle, et c'est précisément ce que le lecteur accepte en
voyant le périmètre. Pour une **mesure** conventionnelle (600 m au chef-lieu), l'acceptation ne corrige
ni le proxy ni le grain : elle reste `historique`.

Contenu initial :
| id | statut | raison |
|---|---|---|
| `zone:sud`, `zone:sud-ouest`, `zone:sud-est`, `zone:nord`, `zone:est`, `zone:grand-ouest`, `zone:centre` (v1, depuis `geo-zones.ts`) | `perimetre` | appartenance exacte à un périmètre affiché |
| `facade:*`, `massif:*` | `historique` | un département n'est ni la côte ni le massif |
| `montagne:600m-chef-lieu`, `relief:1250m-35km`, `littoral:15km`, `mer:15-100km` | `historique` | proxy et grain |
| `taille:petite/moyenne/grande` (bornes du parseur et `agglomeration-size-v1`) | `historique` | deux conventions contradictoires, non sourcées |
| aucune convention climatique | | à créer plus tard, statut `experimentale` d'abord |

---

## 4. La capacité dans FUT-8

`criterionCapability(critère, grain)` lit la **valeur effective**. Promotions (et seulement elles) :

| Critère | Condition de `trancher` | Grain |
|---|---|---|
| `nearPlace` distance | `metric: "vol_oiseau"` + `maxKm` | adresse |
| `nearPlace` temps | `mode` car / walk + `maxMinutes` | adresse (inchangé) |
| `nearPlace` sans seuil | après définition `distance_lieu` (vol d'oiseau) ou `temps_lieu` | adresse |
| `communeSize` | `unit` connue + bornes dites par le lecteur ou corrigées par lui | commune et adresse |
| `sizeRelativeTo` | `unit` connue | commune et adresse |
| `excludePlace` | `scope` connu pour **chaque** ville | commune et adresse |
| `excludeZones` parisien | périmètre choisi | commune et adresse |
| `zones` macro-zone | convention `perimetre` acceptée pour **chaque** ancre non administrative | commune et adresse |

Reste `apprecier` : `metric: "route"` (aucune mesure routière en km dans ce lot, voir §11) ; tout
`nearPlace` au grain commune ; façades ; massifs ; montagne ; relief ; mer ; tailles qualitatives
sans convention validée ; toutes les préférences. Reste `ne_pas_mesurer` : vélo, temps sans mode,
`faible_secheresse`, `faible_pression_agricole`.

### 4.1 Ce que l'évaluateur doit savoir faire (aucune nouvelle donnée)

- `communeSize` / `sizeRelativeTo` en unité `commune` : lire `population` (déjà dans l'index) au lieu
  de `tailleVille`. Pour Paris, Lyon, Marseille, l'index est par arrondissement : la population
  communale se reconstitue par la somme des arrondissements (`PLM_VILLES` porte déjà la population
  communale) ; à défaut, `unexamined(missing_data)`.
- `excludePlace` en `scope: "commune"` : comparer l'INSEE de la commune évaluée à celui de la ville
  (PLM : les arrondissements 75101-75120, 69381-69389, 13201-13216 appartiennent à leur ville).
- Périmètres parisiens : `paris` = département 75 (exact) ; `petite_couronne` = 75, 92, 93, 94 ;
  `agglomeration` = unité urbaine 00851 (table PLM) ; `ile_de_france` = les 8 départements.

---

## 5. Recherche et Projet

### 5.1 Fin de l'écriture implicite

`OuVivreProjectSync` cesse d'écrire. Il n'est plus monté sur `/rapport` (le composant est supprimé, la
route `user_project_if_empty` aussi si plus rien ne l'appelle). La session locale de « Où vivre » reste
inchangée : elle restaure la recherche, rien d'autre.

### 5.1 bis « Petite ville » dans la Recherche

Le parseur cesse d'écrire 5 000-25 000. Dans « Où vivre », « je cherche une petite ville » reste un
**signal de classement** par la préférence `eviter_grandes_villes` (la cloche petite / moyenne ville
existante, avec son plancher `eviter_isolement`), et n'est plus un **filtre numérique dur**. Effet
visible : une ville de 30 000 habitants n'est plus exclue, elle est classée plus bas. « Ville moyenne »
(`eviter_grandes_villes` + `eviter_isolement`) et « grande ville » (`prefere_grande_ville`) suivent la
même règle. Un chiffre dit par le lecteur (« moins de 20 000 habitants ») reste un filtre dur, comme
aujourd'hui.

### 5.2 Le geste « Reprendre cette recherche pour définir mon projet » (V1)

**Où** : sur la page de résultats d'« Où vivre », pour un lecteur connecté. Libellé : « Reprendre cette
recherche pour définir mon projet » s'il n'a pas de Projet ; « Utiliser cette recherche pour mon
projet » s'il en a un.

**Ce qu'il montre avant d'écrire** (une feuille, pas un formulaire) :
- « Ce que futur•e retiendra dans votre projet » : les critères, en langage du lecteur (« Vivre en
  Bretagne », « Une petite ville », « Inspiré de Brest : la vie locale, le calme »).
- « Ce qui reste propre à cette recherche » : en une ligne, « ne pas vous reproposer Brest », « des
  villes d'une taille proche de Brest ».
- S'il existe déjà un Projet : « Cela remplacera votre projet actuel », avec les deux textes côte à
  côte. Aucune fusion.
- Deux boutons : « Enregistrer comme projet » et « Annuler ».

**Ce que le serveur écrit** (route dédiée `POST /api/project/from-search`) : le texte et `parsed`
**nettoyé** : sans exclusion d'ancre, sans fourchette d'ancre, sans bornes de taille conventionnelles,
`forceMarkers` conservés comme suggestions, `strength` conservé (il ne vaut jamais consentement). Aucune
`condition`, aucune `definition`. Si un Projet existait, ses `definitions` et `conditions` sont
**abandonnées** (le lecteur a choisi de remplacer son projet) ; la feuille le dit quand il y en a.

**Sans Projet** : `/rapport` affiche « Projet non encore défini » et propose de le décrire ; si une
session « Où vivre » existe, il propose aussi « Reprendre votre recherche ».

---

## 6. Communes-ancres

**Une ancre aide à dire un cadre de vie ; elle n'est jamais une condition.**

- **Projet** : `communeAncre`, préférences dérivées avec `source: "ancre"`, affichées « Inspiré de
  Brest », retirables (`suppressNarrativeKeys`, inchangé).
- **Recherche seulement** : l'exclusion de l'ancre et la fourchette ÷/× 2,5 sont **recalculées au
  moment de la recherche** depuis `communeAncre` (dans `matchProjects`), jamais écrites dans `parsed`.
  La route `/parse` cesse de les injecter dans `hardConstraints`.
- **Garantie « jamais une condition sans reprise »** : la route de condition refuse de confirmer une
  préférence `source: "ancre"` qui n'est pas **adoptée**. Le geste « Garder ce critère » écrit une
  `adoption` ; il ne touche pas `parsed`, et la provenance reste vraie (« inspiré de Brest », adopté).
  « En faire une condition sans compromis » sur une préférence d'ancre fait les deux d'un coup :
  adoption et confirmation, atomiquement. Une adoption périme si la préférence proposée change au
  reparse (nouvelle ancre, trait disparu).

---

## 7. Écriture serveur

Le navigateur générique (`PATCH /api/profile` `user_project`) continue d'ignorer `conditions` et
`definitions`, et le serveur les **reporte** (comme FUT-7). Une route dédiée porte les gestes :

`POST /api/project/criterion`

```ts
type CriterionAction =
  | { action: "definir"; criterion: CriterionRef; instance?: string; seen: string; definition: DefinitionInput }
  | { action: "retirer_definition"; criterion: CriterionRef; instance?: string }
  | { action: "confirmer"; criterion: CriterionRef; seen: string; definition?: DefinitionInput }
  | { action: "retirer_condition"; criterion: CriterionRef }
  | { action: "adopter"; criterion: Extract<CriterionInstanceRef, { kind: "preference" }>; seen: string }
  | { action: "retirer_adoption"; criterion: Extract<CriterionInstanceRef, { kind: "preference" }> };
// Tous les `criterion` sont des CriterionInstanceRef. « confirmer » sur une préférence d'ancre non
// adoptée écrit l'adoption et la confirmation dans la même écriture.
// `seen` = l'empreinte de la valeur que le client affichait (parsed pour « definir », effective pour
// « confirmer »). `DefinitionInput` = la variante de Definition sans les champs serveur.
```

Déroulé, pour chaque geste :
1. relire le Projet en base ;
2. vérifier que l'élément est déclaré (famille + instance) et, pour `adopter`, qu'il vient d'une ancre ;
3. comparer `seen` à l'empreinte serveur : différente → `409`, le client recharge ;
4. valider la définition (variante compatible, seuils, convention connue et applicable) ;
5. calculer la nouvelle valeur effective ;
6. créer ou retirer la confirmation (empreinte de la valeur effective de l'élément) ; pour une
   préférence d'ancre non adoptée, écrire aussi l'adoption ;
7. écrire atomiquement, avec contrôle de concurrence sur `updatedAt` (une écriture concurrente → `409`).

Cas couverts : définition seule ; modification ; retrait de définition (la condition qui en dépendait
devient périmée, elle n'est pas supprimée) ; confirmation sans précision ; confirmation et précision
dans le même geste ; retrait de condition sans perdre la définition.

---

## 8. Les états UX

### 8.1 Dans le Projet (carte « Votre projet », `/rapport`)

Chaque critère est une ligne en langage du lecteur, avec au plus une action visible.

| État | Ce que voit le lecteur | Action |
|---|---|---|
| Compris | « Vivre en Bretagne » | « Comment futur•e l'interprète » (repliée) ; « En faire une condition sans compromis » |
| Inspiré d'une ancre | « Inspiré de Brest : la vie locale » | « Retirer » ; « Garder ce critère » |
| Suggestion de condition (mot fort) | « Vous avez écrit « absolument ». En faire une condition sans compromis ? » | « Oui » / « Non » |
| À préciser (seulement au moment de confirmer, ou si le lecteur affine) | « Par 20 km, vous pensez à vol d'oiseau ou par la route ? » | deux choix, puis confirmation |
| Périmètre à accepter (macro-zone) | « Voici le périmètre que futur•e utilise pour le Sud-Ouest. » | « Voir le périmètre » ; « Ça me convient » ; « Modifier mon texte » |
| Confirmation d'un critère dont le sens peut surprendre | au moment du geste, une phrase : « Ici, Bretagne désigne la région dans ses limites actuelles. » | « Ça me convient » (puis confirmé) / « Annuler » |
| Condition sans compromis | « Vivre en Bretagne · condition sans compromis » | « Retirer la condition » |
| Condition à revoir (périmée) | « Votre condition portait sur Nantes ; votre projet parle désormais de Rennes. » | « La garder pour Rennes » / « La retirer » |
| Non tranchable ici | au moment de confirmer : « futur•e pourra apprécier cette condition, sans pouvoir la trancher avec les données actuelles. » | confirmer quand même |
| Tranchable seulement à l'adresse | au moment de confirmer : « Elle sera tranchée dans les dossiers d'adresse. » | confirmer |

**Règle de confirmation** : quand l'interprétation de futur•e peut écarter un lieu que le lecteur croirait
dedans (une région, une macro-zone, une agglomération, une unité de taille), elle s'affiche **au moment
de confirmer**, en une phrase en langage du lecteur, et la confirmation ne part qu'après « Ça me
convient ». Ce n'est pas une définition (le sens n'est pas ambigu pour le moteur) : c'est rendre visible
le sens au moment où il devient décisif. La confirmation garde la trace de l'interprétation montrée
(`ConditionConfirmation.interpretation?: string`, l'identifiant versionné de la phrase), pour l'audit ;
elle n'entre pas dans l'empreinte.

### 8.2 Dans le dossier

Inchangés depuis FUT-7 : « Condition respectée », « Condition non respectée », « Condition ouverte ·
plutôt favorable / défavorable », « Condition non évaluée ». FUT-8 n'y ajoute que les **libellés
humains** (§9) et, dans « Données et limites », la définition acceptée (« Pour cette analyse, … »).

### 8.3 Climat (aucun verdict dur dans ce lot)

« Je veux éviter les canicules » continue de produire la lecture actuelle (plutôt favorable /
défavorable, preuves DRIAS au dépliable). Confirmée, la condition reste « ouverte » : capacité
`apprecier`. Le modèle accepte déjà, plus tard, une convention climatique `validee` ; sa restitution
dira « selon les projections climatiques retenues par futur•e », jamais « ce lieu n'aura pas de
canicules ».

---

## 9. Les libellés humains

Un registre de présentation, `src/lib/decision/criterion-labels.ts`, distinct du moteur. Pour chaque
critère et selon la valeur effective :

```ts
type CriterionPresentation = {
  titre: string;          // « Vivre en Bretagne »
  court: string;          // « la Bretagne »
  question?: string;      // « Est-ce une condition sans compromis ? »
  interpretation?: string; // « Pour cette analyse, futur•e considère ici la Bretagne dans ses limites régionales actuelles. »
};
```

| Critère | titre | court | interprétation (si utile) |
|---|---|---|---|
| région | Vivre en Bretagne | la Bretagne | « …la Bretagne dans ses limites régionales actuelles. » |
| macro-zone | Vivre dans le Sud-Ouest | le Sud-Ouest | « Voici le périmètre que futur•e utilise pour le Sud-Ouest. » + lien |
| montagne | Vivre à la montagne | la montagne | « futur•e s'appuie aujourd'hui sur l'altitude du centre de la commune ; elle ne dit pas l'altitude de votre logement. » |
| calme | Un cadre calme | le calme | « futur•e lit la densité de la commune, pas le bruit de votre rue. » |
| mer | Être près de la mer | la mer | « futur•e estime la distance depuis le centre de la commune. » |
| taille | Une commune de moins de 20 000 habitants | la taille de la commune | « Population de la commune elle-même. » / « Population de l'agglomération. » |
| petite ville | Une petite ville | la taille de la ville | aucune borne affichée tant qu'aucune convention n'est validée |
| distance | Être à moins de 20 km de Nantes | la distance à Nantes | « À vol d'oiseau, depuis votre logement. » |
| temps | Être à moins de 30 minutes de Nantes en voiture | le trajet vers Nantes | « Temps estimé sans trafic, depuis votre logement. » |
| quitter Lyon | Quitter Lyon | Lyon | « La commune de Lyon » / « Toute l'agglomération lyonnaise » |
| ancre | Inspiré de Brest | Brest | « Ces critères viennent de ce que Brest a de distinctif. » |

Les phrases du dossier (« Votre condition de vivre en Bretagne n'est pas respectée à Nantes ») se
construisent depuis ce registre, plus depuis les libellés moteur (`hardConstraintLabel`, qui reste pour
la preuve et les tests).

---

## 10. Migration (A)

Normalisation **à la lecture** (`normalizeUserProject`), aucune réécriture en base, aucun reparse LLM,
dossiers figés inchangés.

| Legacy | Lu comme |
|---|---|
| `nearPlace.maxKm` | `metric: null` |
| `nearPlace.mode` absent | `mode: null` |
| `communeSize` | bornes **conservées**, `unit: null`, provenance inconnue. Jamais déduite des chiffres : un lecteur a pu écrire « entre 5 000 et 25 000 habitants ». L'unité se demande seulement si le critère devient une condition |
| `excludePlace` | `scope: null` |
| `excludePlace` = une ancre résolue | retiré (comme FUT-7) |
| `communeSize` = fourchette exacte d'ancre | retirée (comme FUT-7) |
| `excludeZones: string[]` | `{ token, said: null }` |
| préférences | `source: "parse"`, sauf dérivées démontrablement d'une ancre (traits recalculés depuis `communeAncre` à l'identique : `source: "ancre"`) |
| `definitions`, `adoptions`, `conditions` | absents |

**On ne retire une valeur legacy que si son origine technique est démontrable** : la fourchette d'ancre
(formule et ancre connues) et l'exclusion de l'ancre. Rien d'autre.

`schemaVersion: 3` décrit la forme lisible par le contrat v3, rien d'autre : ni migration faite, ni
acceptation, ni confirmation.

---

## 11. Hors FUT-8 (le modèle les accueille plus tard)

Sous-questions factuelles dans les préférences (risque feu recensé, PPRN, médecin, pharmacie,
commerce, école, gare, population en hausse) ; trait de côte ; altitude de l'adresse, zonage
montagne ; vrai massif ; routage vélo ; distance routière en km (l'extension de l'appel d'itinéraire
est plausible mais non vérifiée : à documenter, pas à faire) ; EPCI / métropole ; bruit, industrie et
transports urbains à l'adresse ; donnée agricole ; conventions climatiques ; convention de taille
qualitative non justifiée ; rayon BPE comme définition.

---

## 12. Tests de référence (bout en bout)

Colonnes : `parsed` ; suggestion ; précision proposée (au moment de confirmer) ; `definition` après
le geste ; capacité commune / adresse ; condition possible ; résultat après confirmation.

| # | Texte | `parsed` | Suggestion | Précision | `definition` | Commune / adresse | Condition ? | Après confirmation |
|---|---|---|---|---|---|---|---|---|
| 1 | Je veux absolument vivre en Bretagne | zones `bretagne` | oui (« absolument ») | aucune | aucune | T / T | oui | Nantes : non respectée ; Rennes : respectée |
| 2 | En Bretagne | zones `bretagne` | non | aucune | aucune | T / T | oui (geste sans suggestion) | idem |
| 3 | Je veux éviter les canicules | `faible_chaleur` | non | aucune | aucune | Ap / Ap | oui | ouverte, plutôt favorable / défavorable |
| 4 | Les canicules sont rédhibitoires pour moi | `faible_chaleur` + `forceMarkers` | oui | aucune | aucune | Ap / Ap | oui | ouverte (jamais respectée / non respectée dans ce lot) |
| 5 | Une petite ville | `eviter_grandes_villes`, `sizeWord: petite`, **aucune borne** | non | « Préférez-vous fixer une taille ? » (facultatif) | `taille` si le lecteur donne un chiffre | Ap / Ap ; T si `taille` | oui | ouverte ; tranchée seulement si le lecteur fixe un chiffre et une unité. Recherche : aucune exclusion numérique, classement par la préférence |
| 6 | Une commune de moins de 20 000 habitants | `communeSize {max 20000, unit commune}` | non | aucune | aucune | T / T | oui | tranchée sur la population communale |
| 7 | Une agglomération de moins de 100 000 habitants | `communeSize {max 100000, unit unite_urbaine}` | non | aucune | aucune | T / T | oui | tranchée sur l'unité urbaine |
| 8 | À moins de 20 km de Nantes | `nearPlace {maxKm 20, metric null}` | non | « À vol d'oiseau ou par la route ? » | `distance_lieu {vol_oiseau, 20}` | Ap / T (vol d'oiseau) ; Ap (route) | oui | adresse : respectée / non respectée ; commune : ouverte |
| 9 | À moins de 20 km à vol d'oiseau de Nantes | `nearPlace {maxKm 20, metric vol_oiseau}` | non | aucune | aucune | Ap / T | oui | idem 8 |
| 10 | À moins de 30 minutes de Nantes | `nearPlace {maxMinutes 30, mode null}` | non | « En voiture ou à pied ? » | `temps_lieu {car, 30}` | N → Ap / T | oui | adresse : tranchée ; commune : ouverte |
| 11 | À moins de 30 minutes de Nantes en voiture | `nearPlace {maxMinutes 30, mode car}` | non | aucune | aucune | Ap / T | oui | idem |
| 12 | Près de Nantes | `nearPlace {label}` | non | « Jusqu'à quelle distance, ou quel temps ? » | `distance_lieu` ou `temps_lieu` | Ap / T après précision | oui | ouverte tant que non précisé |
| 13 | Quitter Lyon | `excludePlace [{Lyon, scope null}]` | non | « La commune de Lyon, ou toute l'agglomération ? » | `quitter_ville {scope}` | Ap → T / T | oui | tranchée selon le périmètre choisi |
| 14 | Quitter la commune de Lyon | `excludePlace [{Lyon, commune}]` | non | aucune | aucune | T / T | oui | Villeurbanne : respectée ; Lyon 3e : non respectée |
| 15 | Quitter l'agglomération lyonnaise | `excludePlace [{Lyon, unite_urbaine}]` | non | aucune | aucune | T / T | oui | Villeurbanne : non respectée |
| 16 | Dans le Sud-Ouest | zones `sud_ouest` | non | « Voici le périmètre que futur•e utilise. Ça vous convient ? » | `convention {zone:sud-ouest, v1}` | Ap → T / T | oui | appartenance au périmètre accepté |
| 17 | Sur la côte atlantique | zones `atlantique` | non | aucune (rien qui la rendrait tranchable) | aucune | Ap / Ap | oui | ouverte ; Bordeaux jamais « respectée » |
| 18 | Dans les Pyrénées | zones `pyrenees` | non | aucune | aucune | Ap / Ap | oui | ouverte ; Toulouse jamais « respectée » |
| 19 | Vivre à la montagne | `montagne` | non | aucune | aucune | Ap / Ap | oui | ouverte (« selon l'altitude du centre de la commune ») |
| 20 | Une ville comme Brest | `communeAncre [Brest]`, préférences `source: ancre` ; **ni exclusion ni fourchette dans `parsed`** | non | « Garder ces critères ? » (facultatif) | aucune ; `adoption` après « Garder ce critère » | Ap / Ap | oui, avec adoption (même geste possible) ; `parsed` jamais modifié | la Recherche exclut Brest et applique le gabarit ; le dossier sur Brest ne parle jamais de quitter Brest |
| 21 | Je dois absolument quitter Lyon, et j'aimerais éviter Bordeaux | `excludePlace [{Lyon}, {Bordeaux}]`, `forceMarkers` sur `{excludePlace, "lyon"}` | oui, pour Lyon seulement | périmètre de Lyon au moment de confirmer | `quitter_ville` sur l'instance `lyon` | T / T (Lyon, une fois le périmètre défini) ; Bordeaux : écart | oui, par ville | à Villeurbanne : « quitter Lyon » tranchée selon le périmètre ; Bordeaux reste un écart ; reparse « Lyon » → « Nantes » : la condition sur `lyon` est périmée, rien ne bouge pour Bordeaux |

Tests supplémentaires : le parseur et les gestes n'écrivent jamais la même structure (aucun geste ne
modifie `parsed`) ; un legacy `communeSize {5000, 25000}` garde ses bornes et sa provenance inconnue ;
« petite ville » dans « Où vivre » ne filtre plus numériquement et classe par la préférence ; la
confirmation de « Vivre en Bretagne » affiche l'interprétation avant de partir ; une définition sans condition change la lecture (8 : la carte d'écart parle
de vol d'oiseau) sans créer de condition ; un reparse « Nantes » → « Rennes » périme la définition et
la condition ; `PATCH /api/profile` ne peut injecter ni définition ni condition ; la Recherche filtre à
l'identique (parité) ; aucun dossier figé ne change.

---

## 13. Séquence d'implémentation

1. **Types et lecture** : `CriterionInstanceRef`, `definitions`, `adoptions`, `ExcludeZoneParsed`, `metric` / `unit` / `scope` / `sizeWord` /
   `source`, normalisation à la lecture (§10), registre des conventions.
2. **Valeur effective et empreintes** : `parsed ⊕ definition`, `criterionFingerprint` étendu,
   péremption ; mise à jour des tests FUT-7.
3. **Évaluateur** : taille en unité commune, `excludePlace` par commune, périmètres parisiens,
   macro-zones par convention figée.
4. **Capacité** : les promotions du §4, et rien d'autre.
5. **Parseur** : nouveaux champs, fin des bornes inventées, `forceMarkers`, ancres sans exclusion ni
   fourchette ; dérivés d'ancre recalculés dans `matchProjects` (parité de la Recherche).
6. **Recherche ≠ Projet** : retrait d'`OuVivreProjectSync`, route `from-search`, feuille de reprise.
7. **Route `criterion`** et ses gestes.
8. **Libellés humains** et UX de la carte « Votre projet ».
9. **Vérification visuelle** sur `/dev/dossier` (étendue aux définitions) et sur les 20 cas.

---

## 14. Risques

- **Questionnaire** : la tentation d'afficher toutes les précisions possibles. Règle : une précision ne
  s'affiche qu'au moment de confirmer ou quand le lecteur affine.
- **Parité de la Recherche** : sortir les dérivés d'ancre de `parsed` exige de les recalculer à
  l'identique dans `matchProjects`. Test de parité obligatoire.
- **Empreintes** : toute nouvelle dimension de la valeur effective doit entrer dans l'empreinte, sinon
  une condition survit à un changement de sens.
- **PLM** : les tests de taille communale et de « quitter la commune » à Paris, Lyon, Marseille
  dépendent d'une reconstitution par arrondissements, à tester explicitement.
- **Remplacement du Projet par une recherche** : il abandonne définitions et conditions ; la feuille
  doit le dire.

---

## 15. Décisions prises dans cette spec (sans changer la vérité produit)

- Statut de convention `perimetre` : une macro-zone devient tranchable une fois son périmètre accepté,
  parce que l'appartenance se mesure exactement.
- Distance routière en km : reportée (documentée au §11).
- Une préférence d'ancre devient confirmable seulement adoptée (`adoptions`), jamais en réécrivant `parsed`.
- Identité des éléments multiples : `CriterionInstanceRef`, instance = ville normalisée pour
  `excludePlace`, jeton pour `excludeZones`, périmètre entier (`null`) pour `zones` et `departements`.
- Legacy : aucune provenance déduite des chiffres ; seuls les dérivés d'ancre démontrables sont retirés.
- « Petite ville » : signal de classement dans la Recherche, plus de filtre numérique.
- Une interprétation qui peut surprendre s'affiche au moment de confirmer.
- « Remplacer mon projet par cette recherche » abandonne les définitions et conditions de l'ancien
  projet.
- Normalisation legacy à la lecture, sans script d'écriture.
