# Hero « Le projet de vie devient territoire » — animation

Date : 2026-06-10
Statut : implémenté (récit à deux actes), en attente de commit

## Intention

Remplacer la photo de cartons de déménagement (boîte image 4/3 de la colonne droite
de la section « Décrivez votre projet de vie… » sur la home) par une animation
propriétaire qui raconte le cœur différenciant de futur·e : un projet de vie en langage
naturel devient des territoires, **avec leurs compromis**, et **se recompose quand on
précise le projet**.

Émotion visée : clarté, confiance, projection. Aucune esthétique IA, aucun cerveau /
robot / spinner, aucune carte de France, aucun score / jauge / classement, aucun emoji.

## Périmètre

- **Composant autonome** `src/components/HeroProjetTerritoires.tsx`, sans prop requise
  (option `className`), avec son propre `<style>` scopé.
- **Modif dans `FutureELanding.tsx`** :
  - la boîte image (≈ l. 2689-2700) + la citation italique + « Un exemple de projet »
    sont remplacées par `<HeroProjetTerritoires />` ; le CTA « Trouver où vivre → » reste.
  - dans la media query `@media (max-width:768px)`, la carte `.lifecompare-grid` reçoit
    `padding: 32px 22px` (la carte gardait 56px de padding horizontal même sur mobile,
    réduisant la boîte à ~190px ; on récupère de la largeur).
- Aucune autre modif. Aucune dépendance ajoutée. L'asset
  `comparer-deux-communes-demenagement.jpg` est conservé (utilisé sur 2 autres pages).

## Technique

Machine à états en JS (`phase` 0→9) pilotant des transitions CSS, + un **compteur de
frappe** (`typed`) pour l'effet machine à écrire.

- `IntersectionObserver` : la boucle ne tourne que visible.
- `prefers-reduced-motion` : saute à l'**état final statique** (fin d'acte 2, le plus
  complet). Chrome headless le déclenche par défaut → fallback prouvé.
- Boîte en `aspect-ratio` responsive : **4/3 desktop**, **1/1 sous 600px** (loge la phrase
  multi-lignes + les 4 critères de l'acte 2). Un `<svg viewBox 0 0 400 300>`
  preserveAspectRatio="none" partage le repère % des éléments HTML (les positions en %
  restent justes quel que soit le ratio ; seules les épaisseurs de filets se déforment
  imperceptiblement).
- `containerType: inline-size` + unités `cqw` : tailles de texte calées sur la largeur
  réelle de la boîte.

## Direction artistique

- Fond bleu nuit (`var(--bg)` + halo orange léger), bordure `var(--border-1)`.
- Phrase + noms de ville : `Instrument Serif`. Jetons, critères, légende : `JetBrains Mono`.
- Accent `var(--orange)`. **Aucun emoji.**
- **Marqueur de compromis** : point **plein** = critère répondu ; **anneau creux** +
  label estompé = critère en retrait. Légende « ● répondu  ○ en retrait ».
- Mouvement lent, peu ample, premium.

## Timeline — boucle ~24 s, deux actes

| Phase | Acte | Contenu |
|---|---|---|
| 0 TYPE1 | 1 | Machine à écrire : « Près de la mer, au calme, sans dépendre de la voiture. » (caret orange clignotant ; mer · calme · voiture accentués). |
| 1 DECOMP1 | 1 | 3 jetons : **Mer · Calme · Mobilité** + constellation. |
| 2 RELATE1 | 1 | Les filets convergent vers un point central (pulsation douce). |
| 3 CITIES1 | 1 | Émergent : **Vannes · Saint-Nazaire · La Rochelle**. |
| 4 COMPRO1 | 1 | Sous chaque ville, les critères en points pleins/creux : chacune coche 2/3, différemment. |
| 5 TYPE2 | 2 | Le projet est **édité** : on retire « . » et on tape « , sans subir la canicule. ». |
| 6 DECOMP2 | 2 | 4 jetons : **Mer · Calme · Mobilité · Fraîcheur** (canicule → critère positif Fraîcheur). |
| 7 RELATE2 | 2 | Convergence. |
| 8 CITIES2 | 2 | **Les résultats changent** : La Rochelle (la plus chaude) sort, **Saint-Brieuc** (plus fraîche) entre. Trio = Vannes · Saint-Nazaire · Saint-Brieuc. |
| 9 COMPRO2 | 2 | Compromis sur les 4 critères ; les 3 villes cochent Fraîcheur mais gardent leurs arbitrages Calme/Mobilité. Fin → boucle. |

## Contenu (copy figée)

- Phrase acte 1 : « Près de la mer, au calme, sans dépendre de la voiture. »
- Phrase acte 2 : « Près de la mer, au calme, sans dépendre de la voiture, sans subir la canicule. »
- Critères acte 1 : Mer · Calme · Mobilité — acte 2 : + Fraîcheur.
- Compromis (● répondu / ○ en retrait) :
  - Acte 1 — Vannes ●Mer ●Calme ○Mobilité · Saint-Nazaire ●Mer ○Calme ●Mobilité · La Rochelle ●Mer ○Calme ●Mobilité
  - Acte 2 — Vannes ●Mer ●Calme ○Mobilité ●Fraîcheur · Saint-Nazaire ●Mer ○Calme ●Mobilité ●Fraîcheur · Saint-Brieuc ●Mer ●Calme ○Mobilité ●Fraîcheur

## Accessibilité

- `prefers-reduced-motion: reduce` → état final acte 2 statique.
- Mécanique décorative `aria-hidden` ; `role="img"` + `aria-label` décrivant le récit
  complet (projet → territoires → compromis → recomposition avec Saint-Brieuc).

## Critères de réussite (validés par capture réelle)

- Récit lisible en < 3 s ; compromis compréhensible en un coup d'œil.
- Tient à 360 px (boîte carrée ~258 px) pour l'état le plus dense (acte 2, 4 critères) :
  villes sur une ligne, légende sans chevauchement.
- Respecte reduced-motion ; ne tourne pas hors écran ; aucune dépendance ; aucune
  régression ailleurs sur la home.
