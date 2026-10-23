# Note éditoriale réutilisable · articles locaux « se déplacer depuis une commune »

Tirée de l'article pilote La Rochelle (13/10/2026). Ce n'est pas un plan d'article : le récit rochelais ne se transpose pas tel quel. Une future rédaction part d'un dossier d'entrée (`redaction/<insee>/dossier.md`, produit depuis la fiche par `outil/dossier_redaction.py`), qui recopie la section 2 de cette note ; le prompt est `redaction/PROMPT_REDACTION.md`.

## 1. Géographie des visuels

> **Le sujet de l'article détermine le cadrage géographique ; le périmètre des données détermine ce qu'on colore. Situer les lieux nécessaires à la compréhension, à l'endroit où le lecteur en a besoin.**

- Ce qu'on colore = la donnée mesurée, et seulement elle (ici : les IRIS de la commune). Une moyenne communale ne partage jamais la légende d'une valeur infra-communale.
- Une carte de situation se pose **à côté du chiffre qui compare les lieux** : à La Rochelle, la carte des quatre communes accompagne le graphique 44 % / 72 % (côte à côte sur grand écran, l'une sous l'autre sur mobile), et la carte des quartiers garde toute sa largeur. Elle se dessine en traitement neutre, sans rampe : elle situe, elle ne mesure rien.
- On ne situe que ce qui sert la lecture : un lieu cité en passant n'appelle pas de carte.
- Le périmètre d'un visuel de contexte reproduit exactement celui du chiffre qu'il éclaire (quatre communes ici, pas le groupe automatique « voisines » de la fiche, qui inclut Châtelaillon-Plage).
- Contours : uniquement des géométries officielles (IGN). Un contour de commune s'obtient par fusion exacte de ses IRIS ; on ne dessine rien à main levée.
- Libellés : peu nombreux, posés dans les espaces libres avec un trait de rappel, et limités aux lieux cités dans le texte, plus un repère au besoin. Noms officiels sur la carte ; le texte peut employer le nom d'usage.
- Une catégorie de légende n'apparaît que si elle est présente sur la carte.
- Dans l'image, seulement une définition courte, la source et le millésime ; les précisions vont dans la légende HTML. Deux thèmes (clair, sombre), chacun avec sa rampe validée sur sa surface.

## 2. Voix générale de futur•e (vaut pour tous les sujets)

- La voix est sérieuse, concrète et vivante. Une phrase marquante est permise quand elle dit quelque chose de juste ; ce qui est proscrit, c'est le slogan automatique de fin de paragraphe. Un conseil pratique dit l'action à faire (« vérifiez dès l'annonce si une place est comprise »), sans comparaison qui la décore.
- Partir d'une situation reconnaissable du lecteur (annonce, visite, trajet du matin, plein, horaires), puis faire avancer le récit par les données.
- Deux entrées possibles : un fait d'actualité daté, s'il amène la question que les données éclairent (sinon il reste un décor) ; ou une question durable de recherche résidentielle (« depuis ce quartier, pourra-t-on moins prendre la voiture ? »). La série mobilité suit une progression de référence (ouverture, pratiques locales, courses et école, vérifications, projet du lecteur) décrite dans `redaction/parametres_editoriaux.md` ; elle règle l'ordre du raisonnement, pas le contenu de chaque ville.
- Le millésime se dit clairement une fois dans le récit et figure sur chaque visuel ; ensuite, présent simple, sans « aujourd'hui » ni « habitants actuels ».
- Décrire ce qui est mesuré : la proximité d'un équipement n'est pas son usage (« une école à moins de 500 mètres », pas « l'école se fait près de chez soi »).

### Contre la surjustification

Le lecteur n'a pas besoin qu'on lui répète ce que le texte ne mesure pas. Un article qui s'excuse à chaque paragraphe prend une voix scolaire.

- Garder une précision seulement si elle **change le sens**, et la porter d'abord par une formulation exacte plutôt que par une phrase de prudence : nommer chaque groupe par ce qu'il est (« les actifs qui habitent et travaillent à Niort », « ceux qui travaillent à Chauray ») évite d'ajouter qu'il s'agit de groupes distincts ; cette limite va dans la méthode. Restent dans le récit les hypothèses d'un scénario (consommation, nombre d'allers-retours, variation du prix).
- Définir une notion **une fois, au bon endroit**, sans la redéfinir ensuite.
- Le détail technique (vol d'oiseau, sondage, seuils, millésimes des contours) va dans la méthode ou la légende, pas dans le récit.
- Supprimer les évidences : un tableau intitulé « surcoût de carburant » n'a pas à énumérer ensuite l'assurance, l'entretien et le stationnement ; « sept fois plus de kilomètres coûtent sept fois plus » n'apprend rien.
- Ne pas remplacer une justification supprimée par une autre formule de prudence.
- Pas de déduction en chaîne que les données ne portent pas (« ils habitent plus loin, donc roulent plus, donc paient plus ») : quand un scénario chiffré montre déjà l'effet, il suffit.
- Décrire des pratiques, jamais des contraintes : aucun quartier n'« impose » un mode de vie ; ne jamais attribuer une pratique au seul quartier ; ne culpabiliser personne.
- Pas de hiérarchie causale que les données ne mesurent pas (« compte plus que », « dépend d'abord de »).
- Pas de transitions annoncées (« voici le résultat le plus utile »), de maximes de fin de section, d'antithèses d'emphase, ni de témoignages ou scènes inventés. Le texte doit rester concret après suppression de ses phrases d'accroche.
- Chiffres arrondis et lisibles ; populations explicites (actifs, ménages, adresses) ; aucune précision qui laisserait croire à une mesure exacte. Un arrondi ne change pas le sens : une valeur proche de 100 % ou de 0 % s'écrit « la quasi-totalité » ou « presque aucun », jamais « tous » ou « aucun ».
- La conclusion vers futur•e est courte : elle part du projet du lecteur et de l'intérêt d'examiner l'adresse dans son ensemble, sans inventaire de fonctionnalités, et ne promet que les capacités produit autorisées pour une promesse publiée (une capacité repérée dans le code ne suffit pas).
- Chaque chiffre doit apporter quelque chose au lecteur : on n'ajoute pas un fait parce qu'il est disponible.

## 3. Ce qui est propre à La Rochelle (ne pas transposer sans vérifier)

- Ville de vélo (2e part sur 82 communes comparables) où la voiture reste majoritaire.
- Écart de 27 % à 71 % entre secteurs ; services présents presque partout, y compris là où la voiture domine (Mireuil Est).
- Écart de 44 % à 72 % selon que l'on travaille à La Rochelle ou dans l'une des quatre communes limitrophes.
- 40 % des emplois tenus par des habitants de l'extérieur de l'unité urbaine, à 90 % en voiture.
- Stationnement réservé rare dans l'hypercentre.

Ailleurs, ces faits peuvent être absents, inversés ou sans intérêt. L'angle se choisit d'après la fiche de la commune, pas d'après ce récit.

## 4. Données indispensables pour reproduire l'angle ailleurs

| Besoin | Où le trouver | Condition |
|---|---|---|
| Modes de la commune, possession / usage | fiche : `mobpro.modes`, `mobpro.posseder_utiliser` | Toujours disponible |
| Mode selon la commune de travail | fiche : tableau `modes_par_destination`, ou liste de communes explicite (`10_incertitude.py`) | Flux de 150 lignes ou plus ; écrire la liste des communes |
| Qui vient travailler dans la commune | fiche : `mobpro.qui_vient_travailler` | Commune en unité urbaine |
| Écarts entre secteurs, carte | fiche : `iris.ecart_voiture`, tableau `iris` ; contours `iris_ign_<insee>.json` | Commune découpée en IRIS d'habitat ; sinon pas de carte infra-communale |
| Stationnement, ménages sans voiture | fiche : `iris.menages_commune`, tableau `iris` | Population : ménages |
| Services et bus autour des adresses | fiche : `acces.adresses` | Garder en méthode ; GTFS à relire |
| Carburant | fiche : `carburant.evolution` ; scénario `11_scenarios_carburant.py` | Refaire l'extraction avant publication |
| Carte de situation des communes comparées | contours IRIS des communes, fusionnés (`visuels/generer_visuels.py --communes`) | Même liste que le chiffre qu'il éclaire ; posée à côté de lui |
| Promesse produit | `MATRICE_ARTICLE_PRODUIT.md` | Vérifier la restitution à l'écran avant publication |
