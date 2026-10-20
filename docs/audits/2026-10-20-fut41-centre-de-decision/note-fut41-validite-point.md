# FUT-41 · Quand « Faire le point » est-il encore vrai ? Contrat de validité

20 octobre 2026 · note métier de la passe V3.2 · **proposition, aucun code produit.** Arbitrage W5.

## 1. Le principe

« Faire le point » est une **lecture déterministe** : elle ne rédige rien, n'appelle aucun modèle, et
se calcule à partir de ce que la recherche contient. Elle coûte peu. Le contrat le plus sûr est donc :

> **On ne met pas « Faire le point » en cache. On le recalcule à chaque ouverture**, à partir de l'état
> courant de la recherche.

Un cache n'est utile que pour une **lecture rédigée** (IA, chantier séparé, W6) ou pour **dater un
point** qu'on veut retrouver plus tard (« le point du 4 octobre »). Dans ces deux cas, il faut savoir
dire si le point est encore vrai : c'est l'objet de la suite.

## 2. Ce que la clé du prototype ne voit pas

La clé V3.1 / V3.2 (`cleLecture`) concatène : révision du Projet, identifiant de chaque lieu et
**révision** de chacune de ses analyses, **nombre** d'observations, priorités mises de côté, lieux
écartés, date de dernière visite. Elle manque :

| Changement | Pourquoi la clé ne le voit pas | Conséquence |
| --- | --- | --- |
| Une analyse **refaite** sous la même révision (nouveau moteur, nouvelle source) | seule la révision entre dans la clé | un point ancien serait servi sur une analyse nouvelle |
| Une observation **corrigée** | seul le nombre d'observations compte | un point citerait une note qui n'existe plus sous cette forme |
| Une observation **supprimée puis une autre ajoutée** | le nombre ne change pas | idem |
| Un lieu **repris** après avoir été écarté, puis réécarté pour un autre motif | la liste des écartés est la même | le motif cité serait l'ancien |
| Un **état de connaissance** qui change (enregistré → aperçu → analysé) | absent de la clé | un lieu « enregistré » resterait dit tel après son analyse |
| Une **vérification cochée** (« ajouté à ma visite ») | absente | « Pour avancer » proposerait ce qui est déjà fait |
| La **date du jour** (une visite passée, « depuis votre dernière visite ») | seule la dernière visite compte | une visite du 24 oct. resterait « à préparer » le 25 |

## 3. Ce dont dépend un point (son empreinte)

Un point se fonde sur des **faits constitutifs**. Chacun doit être identifié par ce qui le rend unique,
pas par un compteur.

| Fait constitutif | Identifiant à prendre | Existe aujourd'hui ? |
| --- | --- | --- |
| Le Projet | `signatureDecisionnelle(projet)` (valeur effective, conditions confirmées) | **oui** (`projet-materiel.ts`) |
| Chaque lieu en jeu | identifiant du lieu + **état** (`a_considerer`, `en_course`, `ecarte`) + motif d'écart | **non** : il n'existe pas de lieu enregistré dans le produit (voir README-v3-2 § 5) |
| L'état de connaissance de chaque lieu | `enregistre` / `apercu` / `analyse`, et pour l'aperçu sa date | **non** |
| Chaque analyse lue | identifiant de l'artefact **et sa version servie** (`servedVersion`), `engineVersion`, `conventionsVersion`, `generatedAt` | **oui** (`decision_artifact`, `StoredArtifact`) |
| Les faits réellement consommés | pour chaque énoncé du point, la liste `(artefact, critère)` qu'il cite | **oui dans le prototype** (`refs` de chaque énoncé) ; à conserver dans le produit |
| Les comparaisons dites | pour chaque paire citée, l'empreinte de comparabilité par critère (note FUT-22) | **non** (dépend de FUT-22) |
| Les observations | identifiant **et** date de dernière modification de chacune (pas leur nombre) | partiel : `terrain_observations` a `updated_at`, une ligne par (utilisateur, commune, module), pas par lieu ni par critère |
| Les vérifications faites | identifiant + état | **non** |
| Le temps | la date du jour, **seulement** pour ce qui en dépend (visite à venir ou passée, « depuis votre dernière visite ») | trivial |

L'**empreinte d'un point** est le hachage canonique de cette liste, triée. Deux points de même empreinte
disent la même chose.

## 4. Les règles

1. **Recalcul par défaut.** Ouvrir « Faire le point » recalcule toujours la lecture déterministe. Aucun
   affichage n'attend une invalidation.
2. **Un point daté se relit avec sa date.** Si le produit garde un point (« le point du 4 octobre »),
   il le sert tel quel, avec sa date, et dit en tête s'il est **dépassé** : « Depuis ce point, votre
   Projet a changé ; l'analyse du 31 route de Kervily a été refaite. » Jamais un vieux point présenté
   comme actuel.
3. **Invalidation par empreinte, jamais par date.** Un point est dépassé si l'empreinte calculée
   aujourd'hui diffère de celle qu'il porte. La leçon de `projet-materiel.ts` vaut ici : `updatedAt`
   bouge pour une virgule, une empreinte ne bouge que pour ce qui change la lecture.
4. **Le motif du dépassement est nommé.** La comparaison des deux empreintes dit **quel** fait a changé
   (Projet, une analyse, une note, un lieu) ; la phrase le reprend.
5. **Ce qui n'invalide pas un point** : une lentille (« afficher selon le calme »), une sélection, un
   tri, l'ouverture d'une fiche, le thème, le passage du temps sans échéance. Les compter rendrait
   « dépassé » un point que rien n'a changé.
6. **Une lecture rédigée (IA) hérite de l'empreinte du point déterministe** qu'elle reformule, plus la
   version du prompt et du modèle. Elle est dépassée dès que le point l'est ; elle n'est jamais
   régénérée sans geste du lecteur (W6 : hors de l'interface commerciale pour l'instant).
7. **La provenance est visible au premier niveau.** Le pied de la plaque dit sur quoi le point repose
   (« Établi le 20 oct. à partir de 5 analyses, du 17 sept. au 16 oct., et de 2 notes · votre Projet du
   8 oct. »). Le détail énoncé par énoncé reste dans « Sur quoi repose ce point ».

## 5. Les quatre blocs, et ce qu'ils lisent

| Bloc | Ce qu'il lit | Ce qu'il s'interdit |
| --- | --- | --- |
| Où vous en êtes | lieux en jeu, leur état, écartés ; la rangée des emblèmes (état de connaissance) | un ordre de mérite ; l'ordre est celui de l'ajout, dit à l'écran |
| Ce qui peut vous faire hésiter | conditions sans compromis non tenues ; comparaisons non fiables (et pourquoi) ; paires comparables ; lectures partielles ; écarts dont la raison a changé | toute compensation d'une condition sans compromis ; toute conclusion sur un aperçu |
| Pour avancer | la **même source** d'actions que l'accueil (`actions()`) | un bouton d'achat présenté comme une action de recherche |
| Ce que futur•e ne mesure pas | le budget, les notes (qui restent des notes) | |

## 6. Tests attendus

1. Analyse refaite sous la même révision : l'empreinte change, le point daté se dit dépassé et nomme
   l'analyse.
2. Observation corrigée (même nombre) : l'empreinte change.
3. Lentille, sélection, ouverture d'une fiche : l'empreinte ne change pas.
4. Lieu enregistré puis analysé : l'empreinte change, la rangée d'emblèmes et la phrase suivent.
5. Visite passée : « Préparer la visite » disparaît de « Pour avancer » le lendemain.
6. Texte rendu : chaque nom de lieu cité dans le point a un état identique dans la rangée et sur sa
   tuile (le test « dit vrai », pas seulement « apparaît »).

## 7. Ce que le prototype fait, et ne fait pas

Le prototype recalcule le point à chaque ouverture (règle 1) et affiche sa provenance au pied de la
plaque (règle 7). Il garde l'ancienne clé `cleLecture` pour la seule version rédigée simulée (revue) :
cette clé a les défauts du § 2, ils sont documentés ici et non corrigés dans le prototype, puisque la
version rédigée sort de l'interface (W6).
