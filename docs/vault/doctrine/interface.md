# Interface : lisibilité et gloses

> Règle durable. Fiches miroir : `/memory/feedback_text_maxwidth.md`,
> `/memory/feedback_tooltip_no_sources.md`. La règle de largeur est aussi inscrite dans
> `AGENTS.md` (chargée à chaque session).

## 1. Largeur du texte : ne pas couper une phrase à mi-bloc

La largeur de lecture est gouvernée par le **conteneur de page** (`max-w-[920px]` ou
`max-w-[1100px]` `mx-auto`). Ne jamais plafonner un paragraphe avec un `max-w-[NNNpx]`
arbitraire **plus étroit que le bloc bordé qui l'entoure** : la phrase wrappe au milieu et
laisse un vide à droite, très visible dans une carte `.glass`.

- **Texte dans une carte ou section bordée large** : il remplit le bloc, aucun `max-w`
  propre.
- Un `max-w-[NNNpx]` sur du texte n'est légitime que pour : le conteneur de page
  (`mx-auto`), un sous-titre de hero mesuré en espace ouvert sous un grand H1, ou un texte
  en `flex-row` qui partage sa ligne avec un autre élément.
- **Diagnostic d'abord la largeur** (max-w, conteneur), pas `text-balance` ni les
  orphelins. Sur ce sujet, deux mauvais diagnostics (text-balance, puis insécables) ont
  précédé la vraie cause (`max-w-[600px]`). Regarder la largeur du bloc en premier.
- Typo FR : lier les petits mots par espace insécable (`bindOrphans`) ; `text-wrap: pretty`
  est ignoré par Safari.

Signalé par le porteur sur `/ou-vivre` (bloc AskFuture).

## 2. Doctrine des tooltips : le sens, pas la source

Un `MetricTooltip` (glose au survol des cartes-indicateurs Quartier) répond à **une seule
question** : « Pourquoi ce chiffre aide-t-il à comprendre le territoire ? »

Contraintes strictes :
- **≤ 2 phrases, ≤ 35 mots.**
- Interdit : définir l'indicateur, décrire la méthodologie, citer la source, employer du
  jargon scientifique (pas de seuils chiffrés type « > 35 °C », pas de noms de bases).
- Ton simple, concret, humain. Le lecteur comprend l'enjeu, il n'apprend pas le
  vocabulaire.
- **Pourquoi** : les tooltips testés « sources et indicateurs » n'aidaient pas à comprendre
  le territoire. Le sens prime sur la définition. La ligne `src` sous la carte et
  l'accordéon `sources` des drawers portent déjà la provenance ; le tooltip n'y touche pas.
  Un renvoi produit interne discret est autorisé (ex. « Détail à votre adresse dans le
  module Logement ») : ce n'est pas une source de donnée.

### Hiérarchie du bloc « critères identifiés » (/ou-vivre, livré 2026-06-03)

Deux niveaux seulement :
- **N1** : la rangée de **puces seules** (libellé), aucune glose permanente.
- **N2** : une puce qui porte une nuance a un soulignement pointillé et une **bulle
  positive** au survol/focus/tap (composant `ChipTooltip`, déclencheur = la puce entière).
  Phrase courte, POSITIVE (ce que le critère mesure), jamais de négation. Les critères
  self-évidents (« des étés plus frais ») restent des puces nues, sans bulle (anti-bloat).
  Contenu : `PREFERENCE_TOOLTIP` dans `src/lib/comparateur-labels.ts`.

**Niveau 3 envisagé puis rejeté** (porteur) : un panneau « Ce que ces critères mesurent »
listant les limites de périmètre. Supprimé avant merge : il répétait le tooltip N2 et
réintroduisait le registre méthodologique qu'on voulait sortir de ce moment.
**Doctrine : les limites méthodologiques vivent dans le RAPPORT, pas sur l'écran de
validation des critères.** Ce moment sert à valider que la demande a été comprise.

## Liens

Voix et honnêteté du texte : `doctrine/editoriale.md`.
