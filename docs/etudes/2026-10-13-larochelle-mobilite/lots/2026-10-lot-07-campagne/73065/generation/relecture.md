```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "La carte donne ainsi un repère pour sélectionner les secteurs à examiner.",
   "probleme": "La part de la voiture chez les actifs qui habitent chaque secteur (iris.voiture.min, iris.voiture.max, section 3) devient ici un critère de choix de quartier pour le lecteur. Le texte attribue implicitement la pratique au secteur, alors que le dossier ne mesure aucun lien de cause entre un quartier et une pratique.",
   "correction_minimale": "Supprimer la phrase, ou la remplacer par « La carte montre comment cette part se répartit entre les secteurs. »"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Aix-les-Bains, La Motte-Servolex, La Ravoire, Cognin, Saint-Alban-Leysse ou Challes-les-Eaux",
   "probleme": "La méthode n'explique pas pourquoi ces six communes de travail ont été retenues (mobpro.voiture_selon_destination.communes_voisines) : ce sont, au plus, les six communes les plus peuplées de la même unité urbaine.",
   "correction_minimale": "Ajouter dans la méthode : « Les six communes de travail citées sont les plus peuplées de l'unité urbaine de Chambéry, définie par l'INSEE. »"}
]}
```