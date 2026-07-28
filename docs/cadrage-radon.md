# Cadrage — le radon (29/07/2026)

Table de vérité écrite **avant** le code, comme le climat et le bruit avant lui. Elle fixe ce que la
carte dit, ce qu'elle ne dira jamais, et ce qui se passe quand il n'y a rien à dire.

## Pourquoi il n'est nulle part

Quatre mentions dans le dépôt, **toutes des exclusions**. `sante-facts.ts` affirmait qu'il « vit dans
Logement » ; `point-hazards.ts` l'écarte de Logement ; le prompt de `synthesize-logement` interdit
d'en parler. Chaque module le renvoyait au voisin. La phrase fautive de `sante-facts` a été corrigée
le 29/07 — c'est elle qui expliquait pourquoi personne ne le cherchait au bon endroit.

## La source

`https://www.georisques.gouv.fr/api/v1/radon?code_insee=XXXXX` — publique, **sans jeton**, une ligne
par commune : `{ classe_potentiel, code_insee, libelle_commune }`.

**Grain communal, et pas plus fin — vérifié le 29/07/2026.** L'endpoint exige `code_insee` et refuse
`latlon` (HTTP 400). Le rapport au point (`resultats_rapport_risque?latlon=`) porte bien un
`libelleStatutAdresse` **et** un `libelleStatutCommune`, mais sur neuf points testés (Clermont,
Brest, La Rochelle, Paris, Nice, Toulouse, Nancy, Creuse) ils sont **toujours égaux** : l'API recopie
le communal à l'adresse. Le champ promet une finesse qu'il ne livre pas.

⚠️ Angle mort connu : `/radon?code_insee=75056` rend **zéro** résultat pour Paris ; le rapport au
point, lui, répond (« faible »). Même piège PLM que sur les IRIS. À traiter à l'intégration.

## Fréquence, mesurée

200 communes tirées de l'index, 29/07/2026 :

| classe | libellé | part | lecture |
|---|---|---|---|
| 3 | potentiel significatif | **19,5 %** | discriminant |
| 2 | potentiel intermédiaire | 5,5 % | — |
| 1 | potentiel faible | 75,0 % | majoritaire |

Repères de la doctrine : feu recensé 43 %, boisement ≥ 70 % 9,4 %, inondation 86 % (universel, donc
écartée). À 19,5 %, le signal **trie**.

## Les quatre axes

| | |
|---|---|
| **Ancre du calcul** | l'adresse (c'est elle qui donne le code commune) |
| **Grain de la preuve** | `commune` |
| **Relation** | `attribut` — le sous-sol de la commune, pas une distance |
| **Échelle dérivée** | territoire (par `echelles.ts`, sans exception) |
| **Geste produit** | dans le **logement** — et c'est tout l'intérêt |

Le point de départ du calcul n'est pas ce que la donnée décrit : même figure que « la gare est à
8 minutes ». C'est le modèle ancre/support posé le 28/07 qui le porte, sans règle spéciale.

## Table de vérité

| classe | outcome | ce qui s'affiche |
|---|---|---|
| **3** | `verification` | la carte ci-dessous |
| **2** | `not_applicable` | **rien** |
| **1** | `not_applicable` | **rien** |
| source muette | `not_applicable` | **rien** |

**Pourquoi les classes 1 et 2 ne produisent AUCUN `satisfied`.** C'est la leçon du bruit, le matin
même : un `satisfied` sans fait ne porte aucune carte, donc aucune limitation, et
`criteria-registry` en tire « favorable » plus une montée de couverture. Le lecteur recevrait « pas
de problème de radon » alors que le classement ne mesure **rien** dans son logement — un potentiel
faible n'interdit pas une concentration élevée dans un bâtiment mal ventilé. Le silence est ici la
seule position tenable.

**Pourquoi `verification` et non `mismatch`.** Le fait est établi (le classement existe, il est
officiel) mais il ne tranche aucun projet : il appelle une mesure. C'est la définition d'une
vérification.

## Ce que la carte dit

> **Potentiel radon significatif dans la commune**
>
> La commune est classée en catégorie 3, correspondant à un potentiel radon significatif lié aux
> caractéristiques géologiques du sous-sol.

**Limitation** (obligatoire, jamais optionnelle) :

> Ce classement décrit le sous-sol de la commune, pas ce logement. Seule une mesure réalisée à
> l'intérieur du bâtiment établit la concentration réelle, qui dépend aussi de la construction, de
> l'étanchéité au sol et de la ventilation.

**Geste**, par posture :

| posture | label |
|---|---|
| achat | Demandez si une mesure du radon a déjà été faite dans le logement |
| location | Demandez au bailleur si une mesure du radon a été faite |
| réside | Faites mesurer le radon pendant la saison de chauffe |
| neutre | Renseignez-vous sur la mesure du radon dans ce logement |

Le détail dit la pratique, jamais un droit ni un délai : la mesure se fait sur plusieurs semaines,
en période de chauffe, avec un dosimètre.

## Ce que la carte ne dira JAMAIS

- « exposition élevée au radon » — le classement ne mesure pas l'exposition
- « logement exposé » / « air intérieur dangereux » — rien dans la source ne décrit le logement
- « risque sanitaire avéré dans ce bien »
- « aucun risque radon » en classe 1 ou 2 — voir la table de vérité
- toute mention d'un seuil de becquerels : nous n'en mesurons aucun

## Rattachement au projet

**Aucune priorité existante.** Le rattacher à `air_sain` (qui porte l'air extérieur), à
`faible_exposition_industrielle` ou à `cadre_calme` serait une fausse correspondance sémantique.

Il entre donc comme **constat établi non demandé** — le régime que le climat applique déjà, avec un
seuil plus exigeant qu'une priorité déclarée. Une priorité « santé du logement » pourrait le
réclamer un jour ; elle n'existe pas, et l'inventer pour ce seul fait serait mettre la charrue avant
les bœufs.

**Il n'entre pas d'office dans « en une minute ».** À 19,5 %, il occuperait trop souvent l'unique
place ambiante d'un budget plafonné à 4 cartes — porte qu'on vient justement de border pour les
risques recensés. Le chantier « en une minute » est rouvert à la fin, une fois les trois modules
stabilisés : la question s'y tranchera avec les autres.

## Coût d'intégration

Faible. Une source communale de plus dans `commune-enrichment` (même patron que VigiEau ou
littoral), un champ dans `ModuleFacts`, une règle dans `materiality-rules`, ses tests. Aucune donnée
à héberger, aucun artefact à régénérer.

**Reste à trancher par le porteur** : le libellé exact de la carte, et si le geste « faire mesurer »
mérite un lien vers un annuaire — auquel cas la doctrine du handoff diagnostiqueurs s'applique
(annuaire qualifié SANS commission, le moteur ne connaît jamais les rémunérations).
