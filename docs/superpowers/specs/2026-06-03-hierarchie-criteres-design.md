# Hiérarchie d'information du bloc « critères identifiés » — design

Date : 2026-06-03
Statut : LIVRÉ. Révision en cours d'implémentation (porteur) : le **niveau 3 a été
supprimé** — jugé redondant avec le tooltip N2 (sa première moitié répétait la glose), et
réintroduisant un registre méthodologique qu'on voulait sortir de ce moment. Les limites
méthodologiques vivent dans le **rapport**. Design final = **N1 (puces) + N2 (tooltip
positif)** uniquement. Les sections N3 ci-dessous sont conservées pour mémoire mais NON
implémentées (`PREFERENCE_CAVEAT` et le champ `caveat` n'existent pas dans le code livré).

## Intention

Le bloc « critères identifiés » de `/ou-vivre` affiche aujourd'hui, en permanence sous chaque
puce, une glose en italique (`→ …`) qui mélange ce que le critère MESURE et ce qu'il NE mesure
PAS (« présence d'établissements supérieurs et poids des étudiants, pas la qualité ni la
réputation des formations »). Problèmes : surcharge visuelle, méthodologie mise en avant avant
l'analyse, formulations négatives qui donnent l'impression que le moteur se justifie, alors que
ce moment doit surtout servir à **valider que la demande a été comprise**.

On restructure en trois niveaux d'information, du plus visible au plus secondaire.

## Doctrine

- Les gloses **visibles** aident à comprendre le **sens** du critère ; elles ne détaillent pas
  immédiatement ce qu'il ne mesure pas.
- **Formulations positives** privilégiées. Les exclusions / limites de périmètre vivent dans un
  niveau secondaire.
- Cohérent avec [[feedback_tooltip_no_sources]] : le tooltip répond « pourquoi/quoi ça mesure »,
  sans méthodo, source ni jargon.

## Les trois niveaux

### N1 — visible (toujours)
La rangée de **puces seules** (libellé `PREFERENCE_LABELS`). **Suppression** de la ligne serif
`→ glose` permanente sous chaque puce. L'écran redevient léger.

### N2 — survol / tap (à la demande)
Une puce qui porte une nuance reçoit un **soulignement pointillé discret** et devient déclencheur
sur toute sa surface (survol, focus clavier, tap mobile, fermeture Échap / clic extérieur — on
réutilise le comportement de `MetricTooltip`). La bulle montre une phrase **courte et positive**
(ce que le critère mesure). Une puce **sans** nuance (libellé self-évident) reste une puce nue,
non soulignée : l'affordance inégale est un signal utile (« ici il y a une nuance »).

### N3 — aide secondaire (repliée)
Sous les puces, un `<details>` natif **fermé par défaut**, titré **« Ce que ces critères
mesurent »**, qui liste pour chaque critère demandé portant un caveat une ligne `Libellé : limite
de périmètre`. Formulé en **limite positive** (« mesure X, sans évaluer Y »), jamais en « pas… ».
Le bloc n'apparaît que si ≥1 critère demandé a un caveat.

## Couche données (`src/lib/comparateur-labels.ts`)

`PREFERENCE_INTERPRETATIONS` (qui mélange les deux registres) est éclatée en **deux maps** :

```ts
// N2 : glose positive, courte, orientée compréhension. null = puce nue (pas de bulle).
export const PREFERENCE_TOOLTIP: Record<string, string | null> = { … };
// N3 : limite de périmètre, formulée en positif. null = pas de caveat (pas de ligne N3).
export const PREFERENCE_CAVEAT: Record<string, string | null> = { … };
```

`preferencesToInterpreted` renvoie désormais `{ label, tooltip, caveat }` (au lieu de
`{ label, gloss }`). Seul consommateur : `OuVivreClient`. `PREFERENCE_INTERPRETATIONS` et l'ancien
champ `gloss` sont supprimés. `preferencesToLabels` (contexte AskFuture) est inchangé.

## Contenu (source de vérité)

| Clé | N2 tooltip (positif) | N3 caveat (limite positive) |
|---|---|---|
| `vie_etudiante` | Présence d'établissements d'enseignement supérieur et d'une population étudiante active. | mesure la présence d'établissements et d'étudiants, sans évaluer les formations |
| `acces_transports` | Présence et fréquentation des gares à proximité. | mesure la présence et la fréquentation des gares, sans détailler horaires ni correspondances |
| `faible_dependance_auto` | Part des trajets domicile-travail faits autrement qu'en voiture. | mesure les habitudes de déplacement du territoire |
| `cadre_calme` | Environnement peu dense, propice à un rythme plus calme. | — |
| `douceur_climat` | Hivers tempérés, étés sans excès. | — |
| `ensoleillement_recherche` | Plus chaud et plus sec. | — |
| `proximite_mer` | Accès rapide à la côte. | — |
| `eviter_isolement` | Présence d'un bassin de vie offrant services et activités du quotidien. | — |
| `nature` | Forêts, prairies et milieux naturels autour. | mesure le couvert naturel dans les environs de la commune |
| `acces_culture` | Présence d'équipements culturels à proximité. | mesure la présence d'équipements culturels, sans évaluer l'activité culturelle locale |
| `acces_ecoles` | Collèges et lycées accessibles alentour. | mesure l'accès aux collèges et lycées, sans évaluer la qualité des établissements |
| `eviter_grandes_villes` | Taille de l'agglomération (unité urbaine). | mesure la taille de l'agglomération entière (unité urbaine) |
| `prefere_grande_ville` | Taille de l'agglomération (unité urbaine). | mesure la taille de l'agglomération entière (unité urbaine) |
| `faible_risque_inondation` | Historique d'inondations observé sur le territoire. | mesure l'historique d'inondations observé, sans préjuger des crues futures |
| `faible_precip_extremes` | Pluies intenses projetées par le climat. | mesure les pluies intenses projetées, distinctes du risque d'inondation réel |
| `faible_chaleur`, `faible_secheresse`, `faible_risque_feu`, `air_sain`, `acces_soins`, `acces_services`, `faible_pression_agricole`, `viabilite_emploi` | *(null — puce nue, le libellé suffit)* | — |

## Couche UI (`src/app/(public)/ou-vivre/OuVivreClient.tsx`)

- Bloc « critères identifiés » (~l.682-709) : on retire la ligne serif `→ {c.gloss}`. Chaque puce
  dont `tooltip != null` est rendue via un petit composant déclencheur (soulignement pointillé +
  bulle) ; les autres restent des `<span>` puces nues.
- Nouveau bloc juste après la rangée de puces : `<details>` « Ce que ces critères mesurent »,
  fermé par défaut, rendu seulement si `criteres.some((c) => c.caveat)`. Chaque ligne :
  `{label} : {caveat}`.

## Composant N2 (`src/components/`)

Un petit composant `ChipTooltip` (ou équivalent) réutilisant le comportement et le style de bulle
de `MetricTooltip` (survol + focus + tap + Échap + clic extérieur, bulle ≤240px), mais dont le
**déclencheur est la puce entière** (soulignement pointillé), pas une icône ⓘ. `MetricTooltip`
(icône ⓘ pour les cartes-indicateurs) reste inchangé pour son usage actuel.

## Vérification (pas de runner de test, cf. AGENTS.md)

1. `npx tsc --noEmit` + `npm run lint` (aucune erreur sur les fichiers touchés).
2. `curl`/visuel sur le dev (port 3000), une recherche multi-critères (ex : « ville étudiante au
   calme près de la mer, accès au train ») :
   - N1 : les puces s'affichent **sans** glose permanente dessous.
   - N2 : « ville étudiante », « accès au train », « cadre calme » portent le pointillé ; au
     survol/tap, bulle positive ; « des étés plus frais » (si présent) n'a ni pointillé ni bulle.
   - N3 : le panneau « Ce que ces critères mesurent » est **fermé** par défaut ; déplié, il liste
     les caveats des seuls critères demandés qui en ont un.
3. Aucune régression AskFuture : `preferencesToLabels` inchangé (les libellés partent toujours).

## Hors périmètre

- Le gate hors-mesure (`HORS_MESURE_PHRASES`) et les prompts synthèse / ask : inchangés (leurs
  caveats vivent déjà au bon endroit).
- Les cartes résultats et `MetricTooltip` (usage cartes-indicateurs) : inchangés.
- Aucun impact moteur / score : pur affichage.

## Notes doctrine

Cf. [[feedback_tooltip_no_sources]] (tooltip = compréhension, pas méthodo), [[feedback_no_em_dash]],
[[feedback_text_maxwidth]] (largeur de lecture du panneau N3 = conteneur, pas de max-w arbitraire).
