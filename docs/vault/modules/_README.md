# modules/

> **RÉVISÉ par `adr/ADR-0010-mailles-et-themes.md` (2026-07-14).** Il n'y a plus sept modules. Il y a
> **une prémisse** (le projet de vie), **trois mailles** (Territoire, Autour du lieu, Logement), **un
> dossier** (Décision), et des **thèmes** qui traversent les mailles (climat, santé environnementale,
> mobilité, services, vie locale, nature, emploi, coût).
>
> Santé, Mobilité, Métier et Projets **ne sont pas des modules** : ce sont des lectures, ou une prémisse.
> Les pages jamais écrites ne l'ont jamais été parce que leur objet n'existait pas. **Les conteneurs
> disparaissent, les promesses restent** : « santé environnementale » et « mobilité » demeurent des mots
> du produit (offre, chapitres du dossier, pages /savoir, SEO).

Une page par surface produit. Chaque page documente l'objet, ses sources de données, ses
spécificités de doctrine, et renvoie aux décisions liées (adr/, arbitrages/).

## Pages

- **`territoire.md`** — frontière éditoriale : Territoire pose le décor, les autres modules
  le traduisent dans la vie de l'utilisateur (la page module complète viendra ensuite).
- **`comparateur.md`** — un moteur conforme, trois portes (découverte / départage / Pack), une
  sortie ; frontière gratuit/payant ; cardinalité de l'arbitrage (N ∈ {2, 3}).

Restent à écrire : **Logement** (le module existe, sa page non), **Autour du lieu** (la maille est
nommée, sa doctrine reste à poser : c'est un RAYON, pas un découpage administratif, parce que 59 % des
communes n'ont qu'un seul IRIS) et **Décision** (le dossier). Santé, Mobilité, Métier et Projets ne
seront jamais écrites : cf. ADR-0010.
