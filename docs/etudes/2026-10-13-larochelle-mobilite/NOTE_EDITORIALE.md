# Note éditoriale réutilisable · articles locaux « se déplacer depuis une commune »

Tirée de l'article pilote La Rochelle (13/10/2026). Ce n'est pas un plan d'article : le récit rochelais ne se transpose pas tel quel. Une future rédaction doit pouvoir partir d'une fiche factuelle (`outil/fiche_mobilite.py`) et de ces règles, sans l'historique de conversation.

## 1. Géographie des visuels

La doctrine proposée tient, avec une précision :

> **Le sujet de l'article détermine le cadrage géographique ; le périmètre des données détermine ce qu'on colore. Tout lieu cité dans le texte doit pouvoir être situé.**

- Ce qu'on colore = la donnée mesurée, et seulement elle (ici : les IRIS de la commune). Une moyenne communale ne partage jamais la légende d'une valeur infra-communale.
- Les lieux de contexte (communes voisines citées dans un graphique ou dans le texte) sont dessinés dans un traitement neutre, hors de la rampe, et nommés. Une phrase dit qu'ils sont hors du périmètre de la carte : un gris sans explication se lit comme « sans données ».
- Encart ou cadrage élargi : on garde à pleine largeur ce que le lecteur doit lire finement. Quand l'information principale est infra-communale, un encart de situation ; quand elle porte sur les communes elles-mêmes, un cadrage élargi. Le test se fait à largeur mobile.
- Le périmètre d'un visuel de contexte reproduit exactement celui du chiffre qu'il éclaire (quatre communes ici, pas le groupe automatique « voisines » de la fiche, qui inclut Châtelaillon-Plage).
- Contours : uniquement des géométries officielles (IGN). Un contour de commune s'obtient par fusion exacte de ses IRIS ; on ne dessine rien à main levée.
- Libellés : peu nombreux, posés dans les espaces libres avec un trait de rappel, et limités aux lieux cités dans le texte, plus un repère au besoin. Noms officiels sur la carte ; le texte peut employer le nom d'usage.
- Une catégorie de légende n'apparaît que si elle est présente sur la carte.
- Dans l'image, seulement une définition courte, la source et le millésime ; les précisions vont dans la légende HTML. Deux thèmes (clair, sombre), chacun avec sa rampe validée sur sa surface.

## 2. Voix générale de futur•e (vaut pour tous les sujets)

- Partir d'une situation reconnaissable du lecteur (annonce, visite, trajet du matin, plein, horaires), puis faire avancer le récit par les données.
- Le fait d'actualité est le moteur du raisonnement : il doit amener la question que les données éclairent, faute de quoi il reste un décor.
- Garder la limite essentielle collée au chiffre (« deux groupes distincts », « habitants actuels », « carburant seul ») et la méthode à part, en fin d'article.
- Décrire des pratiques, jamais des contraintes : aucun quartier n'« impose » un mode de vie ; ne jamais attribuer une pratique au seul quartier ; ne culpabiliser personne.
- Pas de hiérarchie causale que les données ne mesurent pas (« compte plus que », « dépend d'abord de »).
- Pas de transitions annoncées (« voici le résultat le plus utile »), de maximes de fin de section, d'antithèses d'emphase, ni de témoignages ou scènes inventés. Le texte doit rester concret après suppression de ses phrases d'accroche.
- Chiffres arrondis et lisibles ; populations explicites (actifs, ménages, adresses) ; aucune précision qui laisserait croire à une mesure exacte.
- La conclusion vers futur•e ne promet que ce que la matrice article / produit dit visible et admissible.

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
| Encart des communes citées | contours IRIS des communes, fusionnés (`visuels/generer_visuels.py --encart`) | Même liste que le chiffre qu'il éclaire |
| Promesse produit | `MATRICE_ARTICLE_PRODUIT.md` | Vérifier la restitution à l'écran avant publication |
