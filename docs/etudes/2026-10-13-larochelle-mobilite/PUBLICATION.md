# Publication des deux pilotes mobilité (La Rochelle, Niort) : préparation

Préparé le 14/10/2026, **rien n'est publié**. Ce document dit où iront les deux articles, ce qui est prêt, et ce qu'il reste à faire le jour de la mise en ligne. Il ne recopie aucun texte : les articles, légendes et textes alternatifs restent dans l'étude.

## Dates : trois dates distinctes

| Date | La Rochelle | Niort | Où elle s'affiche |
|---|---|---|---|
| Étude (données, calculs) | 13 octobre 2026 | 13 octobre 2026 | pied d'article : « Étude futur•e du 13 octobre 2026 » |
| Mise à jour éditoriale | 14 octobre 2026 (conclusion harmonisée) | 14 octobre 2026 (complément Tanlib, populations) | pied d'article : « mise à jour le 14 octobre 2026 » ; à avancer si le texte change encore |
| Publication | à fixer | à fixer | bloc « Publié / Mis à jour » en tête de page, comme `/savoir/dependance-auto` |
| Sources documentaires | prix carburant : semaines du 6/10/2025 et du 5/10/2026 | idem ; pages Tanlib consultées le 14/10/2026 | méthode |

Si les prix sont réextraits la veille, les semaines citées et les montants changent : la mise à jour éditoriale prend alors la date de réextraction.

## URL et emplacement

**Proposition** : les deux études deviennent des pages filles du guide général qu'elles approfondissent.

| Article | URL proposée | Source du texte |
|---|---|---|
| Guide général (existant) | `/savoir/dependance-auto` | `src/app/(public)/savoir/dependance-auto/page.tsx` |
| La Rochelle | `/savoir/dependance-auto/la-rochelle` | `article/article-v3.md`, visuels `visuels/` |
| Niort | `/savoir/dependance-auto/niort` | `redaction/79191/article.md`, visuels `visuels/79191/` |

Pourquoi : les articles du site vivent sous `/savoir/<sujet>` (une page fille existe déjà : `/savoir/cadmium/actionnable`) ; le lien de parenté avec le guide se lit dans l'URL ; un segment `[commune]` pourra prendre les communes suivantes sans changer de schéma. Nom de commune en minuscules avec tirets ; en cas d'homonymes, suffixer le code INSEE (`saint-denis-93066`).

**Liens réciproques** :
- articles → guide : déjà dans le texte (« notre article sur la dépendance automobile », `/savoir/dependance-auto`) ;
- guide → articles : section « Deux villes regardées de près » (`etudesLocales` dans `page.tsx`), aujourd'hui visible en développement seulement avec des liens `/dev/article-*` ; à la publication, remplacer par les URL ci-dessus et retirer la condition `NODE_ENV` ;
- hub Mobilité `/j-utilise-beaucoup-ma-voiture` : il pointe déjà vers le guide ; pas de carte supplémentaire pour deux villes (à reconsidérer quand il y en aura davantage).

**Parcours produit** : la conclusion des deux articles renvoie vers `/dossier` (« la porte par l'adresse », publique). Lien posé dans les deux textes le 14/10/2026.

## Métadonnées proposées

| | La Rochelle | Niort |
|---|---|---|
| Titre de page (H1, inchangé) | Vivre à La Rochelle en utilisant moins la voiture : quels quartiers, quels trajets ? | À Niort, la voiture ne tient pas la même place d'un secteur à l'autre |
| `title` | Vivre à La Rochelle en utilisant moins la voiture · futur•e | À Niort, la place de la voiture secteur par secteur · futur•e |
| `description` | À La Rochelle, de 27 % à 71 % des actifs vont travailler en voiture selon le quartier. Ce qu'il faut regarder pour choisir un logement en utilisant moins la voiture. | À Niort, de 49 % à 87 % des actifs vont travailler en voiture selon le secteur. Commerces, stationnement, bus gratuit : quoi vérifier avant de choisir un logement. |
| Étiquette, temps de lecture | Mobilité · à mesurer sur le texte final | idem |
| Canonique | URL proposée | URL proposée |

Les chiffres des descriptions sont ceux des intertitres (correspondances `article/correspondance-faits.md` et `redaction/79191/correspondance-faits.md`).

## Visuels, textes alternatifs, sources

| | La Rochelle | Niort |
|---|---|---|
| Visuels | carte par secteur ; graphique lieu de travail + carte de situation des communes (un bloc) | carte par secteur ; graphique lieu de travail |
| Fichiers | `visuels/*_17300_*.png`, `barres_lieu_travail_*.png` (clair / sombre, large / mobile) | `visuels/79191/*.png` (idem) |
| Légendes et textes alternatifs | `visuels/legendes.html` (lus par le rendu, une seule source) | `visuels/79191/legendes.html` |
| Tableau accessible de la carte | `visuels/tableau_iris_17300.html` | `visuels/79191/tableau_iris_79191.html` |
| Sources et méthode | section « Méthode et sources » de l'article | idem |

## Intégration technique proposée (sans nouveau système)

Les deux pages publiques réutilisent le rendu des prévisualisations (`src/app/dev/_apercu-article/rendu.tsx` : `ArticleEtude`, `Visuel`, `lecteurLegendes`) et lisent les fichiers de l'étude, comme aujourd'hui. Ce qui change :
- deux pages `src/app/(public)/savoir/dependance-auto/{la-rochelle,niort}/page.tsx` avec `Navbar`, métadonnées, bloc de dates, sans bandeau « prévisualisation » ; le rendu partagé sort de `src/app/dev/` vers un dossier non `dev` ;
- les PNG servis par une route d'image par article, sur le modèle de `src/app/dev/article-*/visuel/[fichier]/route.ts`, sans la garde `NODE_ENV` ;
- les fichiers lus au runtime déclarés dans `outputFileTracingIncludes` de `next.config.ts` (convention déjà employée pour `data/`), sinon ils manquent en production ;
- les deux URL ajoutées à `src/app/sitemap.ts` ;
- les prévisualisations `/dev/article-*` restent en place.

Rien de cela n'est fait sur la branche : ce serait déjà publier au premier déploiement.

## Prêt / reste à faire

**Prêt** : textes édités et correspondances ; conclusions harmonisées (projet du lecteur, adresse examinée dans son ensemble, lien `/dossier`) ; visuels clair / sombre / mobile ; légendes, textes alternatifs, tableaux accessibles ; renvois articles → guide ; URL, métadonnées et dates proposées.

**Vérifications concrètes avant mise en ligne** :
1. **Carburant** : réextraire les prix la veille et contrôler la hausse sur les mêmes stations (chapeaux, sections carburant, tableaux des deux articles) ; mettre à jour les semaines citées.
2. **Pages Tanlib** (Niort) : recontrôler gratuité, jours de circulation des lignes 1 à 10, validité des fiches, lien du calcul d'itinéraire.
3. **Parcours `/dossier`** : jouer un dossier réel et vérifier que l'examen part bien du projet de la personne. La page d'entrée ne parle aujourd'hui que de l'adresse : si le projet n'est pas pris en compte, retirer « à partir de votre projet » des deux conclusions ou viser une autre entrée.
4. **Niort** : relire les libellés d'IRIS cités comme noms de secteurs et l'intérêt du groupe Chauray, Aiffres, Bessines.
5. **Relecture finale** des deux textes selon `redaction/README.md` : population réellement désignée, valeurs aux bornes, conditions documentaires, fidélité du raisonnement.
6. **Intégration** : pages publiques, route d'images, `outputFileTracingIncludes`, sitemap ; puis `next build` et rendu en production locale (images présentes, clair / sombre, mobile).
7. **Guide général** : liens « Deux villes regardées de près » vers les URL publiques, condition `NODE_ENV` retirée, date « Mis à jour » au jour de publication.
8. **Tableaux accessibles** : décider où ils se lisent (lien sous la carte ou bloc dépliable) ; aujourd'hui la prévisualisation ne les affiche pas.
9. **Hub Mobilité** (`/j-utilise-beaucoup-ma-voiture`) : la carte « jusqu'à 29 % du budget » reste à sourcer ou retirer.

Le site est fermé à l'indexation (`robots.txt`, `index: false`) : la mise en ligne ne rend pas les pages trouvables par les moteurs tant que ce réglage ne change pas.
