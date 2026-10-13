## Lecteur et question

**Lecteur visé.** Une personne ou un ménage qui cherche un logement (achat ou location) dans la commune ou autour, et qui se demande quelle place la voiture prendra dans sa vie quotidienne. Elle ne connaît pas les sources statistiques. Elle veut savoir quoi regarder pendant ses recherches et ses visites.

**Question à éclairer.** Depuis quel quartier, et pour quels trajets, peut-on vivre dans cette commune en utilisant moins la voiture ? Ce que les pratiques observées, les équipements proches et le coût du carburant disent de cette question, et ce qu'il reste à vérifier soi-même.

## Longueur et formats

| Format | Quand | Longueur indicative |
|---|---|---|
| Article complet | Au moins deux angles utilisables et distinctifs (voir ci-dessous) | 700 à 1 000 mots hors méthode |
| Article court | Un seul angle distinctif, ou une matière surtout communale | 300 à 500 mots hors méthode |
| Ne pas publier | Aucun angle distinctif : les faits sont exacts mais n'apprennent rien au lecteur qui ne soit vrai presque partout | Une note de quelques lignes qui explique pourquoi |

La méthode, en fin d'article, n'est pas comptée. Elle reste brève : sources, millésimes, populations, définitions techniques.

## Choisir un angle

L'angle se choisit d'après les faits du dossier, jamais d'après un autre article. Un angle est **distinctif** quand il apprend au lecteur quelque chose de propre à cette commune, et **utilisable** quand ses faits ont le statut « utilisable ».

Angles possibles, à retenir seulement si la condition est remplie. *Les seuils chiffrés ci-dessous sont des propositions du 13/10/2026, à valider par le porteur avant un usage régulier ; tirés de l'article pilote, ils n'ont pas été éprouvés sur d'autres communes.*

1. **Écart entre quartiers.** Condition : au moins 15 points entre la part de la voiture du secteur le plus bas et celle du plus haut, parmi les secteurs d'habitat utilisables. Les écarts de moins de 10 points entre deux secteurs ne se commentent pas.
2. **Le lieu de travail.** Condition : un écart d'au moins 10 points entre deux groupes de destination, chacun « utilisable ». Toujours nommer la liste exacte des communes du groupe.
3. **Posséder sans utiliser.** Condition : fait `mobpro.posseder_utiliser.menage_motorise_mais_pas_en_voiture` utilisable et d'au moins 20 %. Sans comparaison avec d'autres communes dans le dossier, ne pas dire si c'est beaucoup ou peu.
4. **Un quartier équipé où la voiture domine.** Condition : un secteur utilisable dont au moins 90 % des ménages ont le panier quotidien à 500 m, et dont la part de la voiture est dans le tiers le plus élevé des secteurs de la commune. Les bus fréquents ne s'ajoutent qu'après la vérification humaine du réseau. Décrire la proximité, jamais l'usage des équipements.
5. **Le stationnement au centre.** Condition : des secteurs utilisables où moins de la moitié des ménages a une place réservée, à au moins 20 points sous la part communale.
6. **Ceux qui viennent travailler dans la commune.** Condition : fait `qui_vient_travailler` utilisable. Décrire, sans déduire de kilomètres ni de coût.
7. **Le coût du carburant selon la distance.** Condition : faits carburant utilisables et extraction de moins de deux semaines à la date de publication. Le scénario pré-calculé suffit ; il ne s'attribue à aucun quartier ni à aucune commune.

**Entrée de l'article.** Deux possibilités, aucune obligatoire : un fait d'actualité (la hausse du carburant, si elle amène la question) ou une question durable de recherche résidentielle. Choisir celle qui sert le mieux les angles retenus.

**Ce qu'on n'écrit pas faute de donnée.** Toute comparaison avec d'autres communes françaises (rang, « ville de vélo », « plus que la moyenne ») sauf si un fait du dossier la donne ; tout temps de trajet ou kilométrage ; tout lien de cause entre un quartier et une pratique.

## Visuels

Proposer au plus trois visuels, choisis dans la section « Visuels disponibles ou réalisables » du dossier, chacun posé à côté du passage qu'il éclaire. Une carte de situation n'accompagne que la comparaison de communes qu'elle situe, avec la même liste exacte.

## Capacités produit et invitations admissibles

Vérifiées dans le code le **12/10/2026** (révision `a25fa9fd`), aucun parcours joué dans le navigateur. À revérifier avant publication si la date de publication est postérieure de plus d'un mois.

| Capacité | Formulation admissible |
|---|---|
| Équipements autour d'une adresse (BPE, à vol d'oiseau) | « Les équipements les plus proches de votre adresse, et combien à moins de 500 m » |
| Équipement automobile du secteur | « La part des ménages équipés d'une voiture dans le secteur de votre adresse, comparée à la commune » |
| Temps de trajet estimé vers un lieu déclaré, voiture ou marche | « Une estimation du temps en voiture ou à pied vers un lieu que vous indiquez (votre travail, par exemple) » |
| Position de la commune pour la part de la voiture domicile-travail | « La position de votre commune pour la part des actifs qui vont travailler en voiture » |
| Comparateur de communes | « Comparer des communes selon la place de la voiture dans les trajets domicile-travail et le temps estimé vers votre lieu de travail » |

Interdits : promettre un budget ou un coût de déplacement calculé, des horaires ou fréquences de bus à l'adresse, des temps à vélo ou en transports en commun, ou les parts de la voiture par secteur de l'article (analyse de la rédaction, absente du dossier d'adresse).

La conclusion vers futur•e est courte (deux ou trois phrases) et n'emploie que ces formulations. L'offre n'est jamais le sujet de la phrase d'entrée : partir de ce que le lecteur veut vérifier.
