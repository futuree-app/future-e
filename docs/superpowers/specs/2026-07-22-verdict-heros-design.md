# « En une minute » : le verdict promu en héros (headline / détail / strate résiduelle)

**Date** : 2026-07-22 · **Périmètre** : le bloc de conclusion du dossier de décision (`ConclusionBlock`), en tête de /rapport. C'est le « Lot B » d'une refonte de mise en forme ; le « Lot A » (désengorgement des cartes) est traité en parallèle.

## Le problème

Le contenu du dossier a gagné en fiabilité, mais l'écran ne se lit pas « en une minute » : il n'a aucun point focal, tout est dit au même volume (Design Critic 2026-07-17 et 2026-07-21). Le plus grand texte de l'écran, « {Commune}, au regard de votre projet. » (Serif ~40px), est un titre de cadrage qui n'apporte aucune réponse ; le VERDICT, la réponse à « ce lieu me convient-il ? », n'est qu'un `text-[21px]` noyé dans un paragraphe de quatre lignes. Le signal est plus petit que son cadre.

**But** : que la réponse soit saisie en un coup d'œil. Un seul héros, une hiérarchie franche entre la réponse, ce qu'il faut regarder ensuite, et les preuves.

## Principe directeur

Trois niveaux, trois fonctions distinctes, jamais redondants :

1. **le headline** dit le cœur de la décision (la réponse) ;
2. **la strate de poids** dit la prochaine priorité à instruire ;
3. **les cartes**, plus bas, donnent les preuves.

> Le héros ne résume pas toute l'analyse. Il nomme ce qui définit la décision. La strate secondaire indique ensuite où porter l'attention, sans répéter le héros.

## Hiérarchie cible de l'écran

Le scope (« commune » / « commune + adresse ») reste où il est déjà : en haut à droite du bloc, mono discret (le Design Critic l'a listé « à préserver »). Le nom de la commune est **tissé dans le headline**, pas dans une ligne séparée : une ligne « {Commune} · commune et adresse » aurait dupliqué ce scope.

```
                                         commune + adresse   ← scope existant, en haut à droite, inchangé
• EN UNE MINUTE                                              ← eyebrow mono

Deux priorités correspondent moins bien à Toulouse :        ← verdictHeadline : le HÉROS
le calme et l'accès aux espaces naturels.                      grand Serif, le nom tissé dedans

Aucune incompatibilité n'a été établie. Ces deux écarts      ← verdictDetail : construit avec le headline
appellent un arbitrage. Quatre constats restent à              (même constructeur), 16-18px
contrôler.

┌ Condition à vérifier ─────────────────────────┐            ← encadré violet (non-savoir), inchangé
│ La proximité de la gare Matabiau reste à       │
│ confirmer à ce niveau de détail.               │
└────────────────────────────────────────────────┘

CONTRÔLES PRIORITAIRES                                       ← strate résiduelle (reserves_found, moins
Parmi ces quatre constats, l'inondation et le sol             les sujets consommés par le headline)
argileux pèsent davantage.
```

## Le contrat déterministe

Le headline ET le détail sont **construits ensemble, à la source, par un même constructeur déterministe**, depuis le même état décisionnel. Ils ne sont JAMAIS générés par le LLM (un élément aussi visible que le héros ne peut pas changer de ton selon un tirage), et le détail n'est JAMAIS un verdict « raccourci a posteriori » par manipulation de chaîne (fragile dès qu'une formulation évolue).

```ts
// Sur ConclusionNarrativePlan (conclusion-plan.ts).
export type VerdictHeadline = {
  kind: "named_issues" | "posture";
  text: string;                    // déterministe, jamais généré
  consumedFactIds: string[];       // faits nommés par le headline
  consumedCompositionIds: string[]; // compositions nommées (leurs absorbedFactIds comptent aussi comme consommés)
};

export type VerdictPresentation = {
  headline: VerdictHeadline;
  detail: string;                  // construit AVEC le headline, pas dérivé de lui
};
```

Chaque branche de la cascade produit **explicitement** son couple `{ headline, detail }` : headline concret + détail sans répétition ; headline de posture + détail complet ; incompatibilité nommée + détail associé ; couverture insuffisante ; favorable en posture.

> **Invariant : le détail n'est pas une version tronquée du verdict. Le headline et le détail sont deux sorties coordonnées d'un même constructeur.**

## La cascade de sélection (déterministe, dans l'ordre)

Le headline nomme les enjeux **lorsqu'un résumé concret, déterministe et honnête peut être construit** ; à défaut, il exprime la posture.

| # | Cas | Headline | kind |
|---|---|---|---|
| 1 | Incompatibilité établie et nommable | nomme la contrainte qui bloque | named_issues |
| 2 | Arbitrage, 1 ou 2 mismatches matériels nommables | nomme les enjeux | named_issues |
| 3 | Réserve dominante unique nommable | nomme le sujet principal | named_issues |
| 4 | 3+ enjeux, matière hétérogène, couverture insuffisante, cas favorable, **ou dépassement de la gate de longueur** | exprime la posture | posture |

**Deux gates, toutes deux nécessaires :**
- **plafond 2 enjeux** (3+ en grand Serif recréeraient un paragraphe ; 3+ → nommer une famille commune seulement si une composition l'enregistre, sinon posture) ;
- **plafond de longueur ~95 caractères, commune comprise** (2 enjeux + nom de commune long + critère long, ex. « l'accès aux collèges et lycées », peuvent déborder). Seuil déterministe à caler visuellement. Au-delà → posture.

**Les cas favorables tombent en posture.** L'architecture n'a pas de fait favorable déterministe (cf. `coast-rules` : « l'architecture n'a pas de fait favorable »). On ne reconstruit pas des positifs depuis des scores bruts. Nommer les positifs est hors périmètre de ce lot.

### Le gabarit recommandé (résout l'accord grammatical)

Plutôt qu'accoler des labels qui ne s'accordent pas (« éviter l'isolement est moins bien servi » ne fonctionne pas), le gabarit à deux points met les sujets **après le deux-points**, ce qui élimine les accords :

- **2 enjeux** : « Deux priorités correspondent moins bien {aCommune} : {sujet A} et {sujet B}. »
- **1 enjeu** : « Une priorité correspond moins bien {aCommune} : {sujet}. »
- **Réserve dominante** : « Le principal point à contrôler {aCommune} : {sujet}. »
- **Incompatibilité nommable** : « Le risque d'inondation dépasse votre limite déclarée {aCommune}. »
- **Incompatibilité, libellé non court** : « Une contrainte de votre projet n'est pas satisfaite {aCommune}. »
- **Posture (couverture insuffisante)** : « Des éléments essentiels manquent encore pour trancher {aCommune}. »
- **Posture (arbitrage hétérogène / 3+)** : « Un arbitrage réel {aCommune}, sans incompatibilité établie. »

Avec ce gabarit, chaque critère n'a besoin que d'un **`subject`** propre (un groupe nominal qui se lit après deux-points), pas d'un contrat éditorial lourd :

```ts
// Le seul besoin par critère : un sujet nominal propre, distinct du `topic` quand celui-ci ne se lit
// pas en tête (« les espaces naturels » -> « l'accès aux espaces naturels »).
type HeadlineSubject = { key: PreferenceKey; subject: string };
// ex. cadre_calme -> "le calme" ; nature -> "l'accès aux espaces naturels".
```

Ces `subject` sont de la copie éditoriale, à faire relire et finaliser par l'Editorial Writer. Le spec fournit des candidats, pas la copie figée.

## Le séquencement (nommer depuis ce qui est réellement affiché)

Le headline sélectionne ses sujets **uniquement parmi les cartes affichées**, jamais parmi les faits émis avant compositions, absorptions et caps. Sinon il nommerait un fait invisible plus bas, ou deux faits désormais regroupés. C'est déjà l'entrée de `buildConclusionPlan` (`input.shownFacts`, `input.shownCompositions`, post-caps) : le headline se construit dans le plan, sur ce même pool.

```
faits évalués
 → compositions
 → cartes absorbées
 → cartes visibles après caps        (input.shownFacts / input.shownCompositions)
 → rankLeadCandidates(...)            (primitive de tri commune)
 → selectHeadline(...)               → headline + consumedFactIds/consumedCompositionIds
 → selectResidualLead(..., consumed) → strate de poids résiduelle
```

Deux sélecteurs explicites au-dessus d'**une primitive de tri commune** (`rankLeadCandidates`), plutôt qu'une `selectLead` surchargée de conditions : `selectHeadline` suit la cascade liée à l'orientation ; `selectResidualLead` cherche le prochain point matériel à instruire dans ce qui reste.

## L'invariant de non-répétition

> **Tout sujet nommé dans le headline est consommé et ne peut plus être nommé dans une strate voisine.** Il réapparaît librement dans les cartes détaillées plus bas (elles portent la preuve), jamais dans deux résumés voisins.

La comparaison se fait sur les **identifiants canoniques**, jamais sur les textes. Pour une composition, on consomme `[composition.id, ...composition.absorbedFactIds]` (précédent déjà présent : le bloc `compositions_found` construit ses `sourceIds` ainsi).

**Consommation NARRATIVE seulement.** Les sujets consommés disparaissent d'une strate résumé, jamais d'un compteur ni d'un état métier. Restent intacts : `reservesShown`, `mismatchTotal`, la couverture, l'orientation, `conclusionBasis`, et les cartes elles-mêmes. Le détail « Quatre constats restent à contrôler » décrit toujours l'ensemble des constats visibles, pas ce qui reste après soustraction. (Vérifié : `reservesShown`/`mismatchTotal` sont des inputs séparés, jamais dérivés du lead.)

## Quelle strate voisine consomme quoi

Le code a deux registres qui nomment des sujets, et ils ne puisent PAS dans le même pool :

- **`reserves_found` (la strate de poids)** : puise dans les **réserves** (vérifications, compositions). Les mismatches en sont **déjà exclus par doctrine** (`RESERVE_ROLES`).
- **`mismatches_found`** : nomme les **mismatches** (le registre « construit, généré, stocké, jamais rendu » relevé par le Design Critic).

Conséquences :

- **Cas arbitrage (headline nomme des mismatches)** : aucune collision avec la strate de poids (elle ne contient pas de mismatches). Le headline **subsume** `mismatches_found`, qui n'est alors plus construit. Le registre orphelin trouve enfin sa maison : sa MATIÈRE (les sujets) ressort dans le héros, sa prose générée disparaît.
- **Cas réserve dominante / composition (headline nomme une réserve)** : le headline puise dans le même pool que `reserves_found`. C'est là que `consumedFactIds`/`consumedCompositionIds` porte : `selectResidualLead` recalcule la strate sur les candidats moins les consommés.

## La strate de poids devient résiduelle

`selectResidualLead` garde la doctrine du lead actuel : elle ne liste pas tout, elle nomme seulement les dominants restants, tier et ordre déterministes (« Parmi ces {M} constats, {N} pèsent davantage : … »). **Le résiduel n'est jamais exhaustif.** **Pas de résiduel → pas de strate** (si le headline a tout consommé, ex. « Le principal point à contrôler : la chaleur estivale », la strate disparaît).

### Table de comportement

| Headline | Éléments restants | Strate de poids |
|---|---|---|
| Posture abstraite | plusieurs | strate actuelle complète |
| 2 mismatches nommés | réserves restantes | strate sur les réserves (mismatches jamais dedans) |
| 1 réserve dominante nommée | autres réserves | strate sur les autres |
| 1 composition nommée | autres faits matériels | strate résiduelle |
| Enjeux nommés | aucun autre élément | pas de strate |
| Posture abstraite | aucun élément nommable | pas de strate |

## Ce qu'on réutilise (delta faible)

- **La primitive de tri des candidats** (extraite de `selectLead`), sous `rankLeadCandidates`, partagée par les deux sélecteurs.
- **Les `topic`/`subject` des faits** comme matière de nommage, et la sélection du/des faits dominants déjà faite par le plan sur le pool affiché.

## Ce qu'on ajoute avec soin

- **Le constructeur `{ headline, detail }` par cas** (voir la cascade), qui remplace toute idée de verdict « trimmé ».
- **Un `subject` de headline par critère** (voir le gabarit), copie éditoriale.
- **`aCommune(nom)`** dans `typography.ts`, en miroir de `deCommune`. « à » n'élide pas devant voyelle (« à Antibes », « à Orléans ») : seule la contraction d'article est à gérer. Cas de test : « Le Havre » → « au Havre », « Le Mans » → « au Mans », « Le Touquet-Paris-Plage » → « au Touquet-Paris-Plage », « Les Sables-d'Olonne » → « aux Sables-d'Olonne », « Les Herbiers » → « aux Herbiers », « La Rochelle » → « à La Rochelle », « La Baule-Escoublac » → « à La Baule-Escoublac », « L'Haÿ-les-Roses » → « à L'Haÿ-les-Roses », « L'Île-Rousse » → « à L'Île-Rousse », « Antibes » → « à Antibes », nom sans article → « à {nom} ».

## Typographie

- **Headline** : grand Serif (Instrument Serif, ~26-34px), isolé par de l'air, sur le modèle du nom de commune du passeport et des titres de synthèse Quartier/Logement. Court par construction (cascade + double gate) : le risque « verdict long → gros pâté » est écarté, le détail porte la longueur.
- **`max-width` du headline** (mesure ~28-32 caractères, ou un conteneur plus étroit que la carte) : c'est l'**exception légitime** à la doctrine de largeur (`feedback_text_maxwidth` autorise « un sous-titre de hero mesuré en espace ouvert sous un grand H1 »). Une phrase héros qui traverse 1100px perd son impact. Ce n'est pas une violation, c'est l'usage prévu de l'exception.
- **Détail** : 16-18px.
- **La couleur du tone reste un accent discret** (filet + eyebrow), **jamais un fond plein** en grand (un `caution` en grand orange dramatiserait par la couleur : signature n°3, invariant n°6).
- L'ancien titre cartouche « {Commune}, au regard de votre projet. » **disparaît**.
- `minHeight: 132px` (anti-saut déterministe/généré) à recalibrer si le héros change la hauteur.
- Tests **responsive** obligatoires : mobile étroit et desktop, sur Toulouse, La Rochelle, Les Sables-d'Olonne, Le Kremlin-Bicêtre et un nom particulièrement long. Le héros reste un signal de 2-3 lignes, jamais 5.

## Ce qu'on ne casse pas

Verdict jamais généré ; structure DOM commune aux chemins déterministe et généré (`ConclusionBlock` partagé) ; ordre épistémique verdict → condition → poids → non-couvert ; aucun compteur / badge / score ; teinte violet du non-savoir (acquis 2026-07-17). La variante habitant du titre de section n'est pas concernée.

## Retrait de `mismatches_found`

Une fois le headline en place, `mismatches_found` n'a plus de surface : sa matière ressort dans le héros, sa prose n'était rendue nulle part. Tâche finale, après vérification qu'aucun autre consommateur ne le lit (validation, stockage, sonde) : le retirer du chemin génératif (ne plus le construire, l'envoyer au modèle, le valider, le stocker).

## Coordination avec le Lot A

Le Lot A (terminé, branche `feat/lot-a-depate-en-une-minute`, NON mergé) touche `DossierDecisionSection.tsx` (regroupement des cartes par grain) ; le Lot B y touche pour retirer le titre cartouche. On réconciliera ce fichier à l'intégration. Le Lot A a aussi laissé **ouverte la question de largeur** (un `max-w` ~860px sur la grille des cartes) en notant qu'elle se décide **avec le Lot B** : verdict héros et cartes prennent leur largeur ensemble. À trancher à l'implémentation.

## Dépendance éditoriale

Les `subject` par critère et les textes de headline/détail par cas sont de la copie déterministe, courte, sensible : ils passent par l'Editorial Writer avant d'être figés. Le présent spec fournit des candidats de départ.

## Tests

- **`conclusion-plan.test.ts`** : la cascade (les 4 cas → bon `kind`, bon couple headline/détail construits ensemble) ; les deux gates (2 enjeux, longueur ~95 car. → posture) ; l'invariant `consumed*` (un sujet nommé par le headline n'apparaît plus dans la strate résiduelle NI dans `mismatches_found`) ; consommation narrative seulement (les comptes `reservesShown`/`mismatchTotal`/couverture/orientation inchangés) ; « pas de résiduel → pas de strate » ; une composition dont les `absorbedFactIds` alimentent la consommation ; le cas arbitrage qui subsume et retire `mismatches_found`.
- **`typography.test.ts`** : `aCommune` (Le/Les/La/L'/Le Mans/L'Haÿ/L'Île-Rousse/défaut).
- `npx tsc --noEmit` = 0 ; `npm run build` compile ; tests responsive au navigateur (liste ci-dessus).
- **Sonde** `scripts/probe-conclusion.ts` : le headline est déterministe (hors modèle) ; vérifier que le `detail` et la strate résiduelle survivent à la validation. Le hash de conclusion inclut le plan (dont `verdictHeadline`) : les artefacts périmés s'invalident seuls, sans bump du prompt (son texte ne change pas).

## Hors périmètre

- Nommer les positifs (pas de fait favorable déterministe aujourd'hui).
- Les variantes de série des mismatches (« aussi », « l'écart est ici plus net ») : différées, à borner rang ≠ poids ≠ tier séparément.
- Le désengorgement des cartes (Lot A).
