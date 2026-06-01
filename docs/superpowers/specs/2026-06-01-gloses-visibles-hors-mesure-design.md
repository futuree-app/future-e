# Gloses visibles + honnêteté hors-mesure (conception)

Date : 2026-06-01. Issu des retours du porteur sur le prototype « interprétations
visibles » au gate du comparateur, et de l'audit sémantique (`AUDIT_SEMANTIQUE_COMPARATEUR.md`,
recommandations 1 et 2). Aucun changement de score, aucun changement de classement.

## Contexte

Le gate « ce que nous avons compris » affiche désormais une glose sous certaines puces
de critère, pour rendre explicite ce que le moteur entend (« doux » = hivers tempérés,
pas la Méditerranée). Deux limites identifiées par le porteur :

1. La glose est devenue l'information la plus importante du bloc, mais elle est au plus
   bas de la hiérarchie visuelle (`text-[10.5px]`, `text-ghost`, la couleur la plus
   pâle). L'œil va à la reformulation, aux puces, aux boutons, jamais à la glose.
2. Les notions sans critère dans le moteur (nature, authentique, chaleureux, convivial)
   ne sont pas traitées : elles tombent dans le bloc générique « ce qui reste ouvert »
   (formulation vague) ou sont abandonnées en silence. C'est le risque le plus pernicieux
   de l'audit : abandon silencieux ou hallucination de la synthèse.

Ce spec couvre deux chantiers, A et B. Deux sujets connexes sont explicitement HORS
périmètre (specs séparés) :

- **Couvert forestier** : faire de « nature » un vrai critère mesuré (Corine Land Cover).
  Tant qu'il n'est pas livré, « nature » est traité par B comme `donnee_absente`.
- **Firewall synthèse** : interdire à la route `synthesize` d'affirmer une notion non
  mesurée (« village authentique »). Lié au risque #3 du roadmap, plus lourd.

## A. Gloses visibles (pur UI)

Principe : la glose est la voix du moteur qui explique son propre sens. On la remonte
d'un cran dans la hiérarchie, sans qu'elle vole la vedette à la puce.

Fichier : `src/app/(public)/ou-vivre/OuVivreClient.tsx`, bloc « Les critères identifiés »
(actuellement la glose est rendue en `px-1 text-[10.5px] leading-tight text-ghost`).

Traitement retenu :

- Taille `10.5px → 12px`.
- Couleur `text-ghost → text-muted` (un cran plus lisible, reste subordonné à la puce).
- Connecteur `→ ` en tête de glose, pour lier visuellement la glose à sa puce.
- Italique Instrument Serif (la fonte de la reformulation), pour signer « c'est le
  moteur qui parle » et relier la glose au bloc « ce que nous avons compris ».

Aucun changement de structure de données : la glose vient déjà de
`preferencesToInterpreted` (`comparateur-labels.ts`). Affinage fin (exact `px`, teinte)
à faire en live dans l'app, comme le porteur itère déjà.

## B. Honnêteté hors-mesure (prompt + type + UI)

Quand l'utilisateur exprime une notion qui n'a AUCUN critère dans le moteur, on ne
fabrique pas de fausse interprétation. On le reconnaît honnêtement sous le bloc existant
« ⚠ Ce qui reste ouvert », avec deux formulations selon la famille (audit C vs D).

### B.1 Parse : nouveau champ `horsMesure`

Fichier : `src/app/api/comparateur-vie/parse/route.ts`.

Nouveau champ dans `TOOL_INPUT_SCHEMA` (et non un détournement de `ambiguities`, qui sert
à poser une question de clarification, sémantique différente) :

```
horsMesure: {
  type: "array",
  description: "Notions exprimées par l'utilisateur qui n'ont AUCUN critère dans le
    moteur. Maximum 3. Vide si aucune.",
  items: {
    type: "object",
    properties: {
      term: { type: "string" },                       // le mot tel que l'utilisateur l'a dit
      kind: { type: "string", enum: ["donnee_absente", "non_mesurable"] },
    },
    required: ["term", "kind"],
  },
}
```

Ajout au `SYSTEM` (section traduction), guidage fermé :

- `donnee_absente` : la nature / la verdure / les forêts / les espaces préservés. Une
  donnée publique pourrait l'approcher un jour (couvert forestier), mais elle n'est pas
  encore un critère. NE PAS la rabattre silencieusement sur `cadre_calme` ou
  `faible_pression_agricole` : la signaler dans `horsMesure`.
- `non_mesurable` : authentique, chaleureux, accueillant, convivial, esprit de village,
  caractère. Notions affectives ou culturelles, sans mesure crédible à la maille commune.
  Ne jamais leur chercher un proxy.
- Ne remplir `horsMesure` que si la notion est réellement exprimée, pas par défaut.

### B.2 Type

Fichier : `src/lib/comparateur-vie.ts`, type `ParsedProject` :

```
horsMesure?: { term: string; kind: "donnee_absente" | "non_mesurable" }[];
```

### B.3 UI

Fichier : `src/app/(public)/ou-vivre/OuVivreClient.tsx`, sous le bloc « ⚠ Ce qui reste
ouvert » (réutiliser le bloc existant, ne pas en créer un nouveau ; il s'affiche si
`ambiguities` OU `horsMesure` est non vide).

Formulations, clés par `kind` :

- `donnee_absente` : « La proximité de la nature n'est pas encore un critère mesuré par
  futur•e. »
- `non_mesurable` : « Le caractère authentique ou chaleureux relève d'une expérience
  personnelle, pas d'une donnée territoriale. »

Note de wording : formulation fixe par `kind` (pas d'interpolation du `term` brut, pour
éviter une phrase bancale du type « Le caractère convivial relève… » au singulier mal
accordé). Le `term` sert à la détection, pas forcément à l'affichage littéral. À valider
en live : une variante interpolée propre est possible si elle se lit bien.

## Contraintes de wording (rappel doctrine)

- Aucun tiret cadratin (virgule ou deux points).
- Vouvoiement.
- Pas de verdict, pas de prédiction : on décrit ce que le moteur mesure ou ne mesure pas,
  jamais une qualité du territoire.

## Critères de succès

1. Au gate, la glose est nettement plus lisible qu'avant (taille + couleur + connecteur +
   italique serif), sans écraser la puce.
2. Une demande contenant « nature » fait apparaître la phrase `donnee_absente` sous « ce
   qui reste ouvert », et « nature » n'est pas silencieusement rabattu sur un autre critère.
3. Une demande contenant « authentique » / « chaleureux » fait apparaître la phrase
   `non_mesurable`.
4. Aucun changement de score ni de classement (vérifiable : mêmes communes, même ordre,
   avant/après, pour une demande sans terme hors-mesure).
5. Aucune clé technique ni tiret cadratin ne fuit à l'écran.

## Hors périmètre (specs séparés)

- Couvert forestier comme critère « nature » mesuré (Corine Land Cover).
- Firewall de la synthèse contre l'affirmation de notions non mesurées.
- Décomposition / affinage interactif de « doux », « calme » (chantier moteur V2).
