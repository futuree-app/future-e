```json
{"anomalies": [
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "parmi les secteurs d’habitat retenus",
   "probleme": "La méthode ne dit pas quels secteurs sont « retenus » : iris.voiture.min et iris.voiture.max ne portent que sur les IRIS d'habitat d'au moins 300 actifs. Le lecteur ne peut donc pas savoir parmi quels secteurs Dominos et Sainte-Marie sont aux extrêmes.",
   "correction_minimale": "Ajouter dans « Méthode et sources » : « Seuls les secteurs d’habitat comptant au moins 300 actifs sont retenus. »"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "qui travaillent à Puteaux, 11 % déclarent la voiture comme mode principal ; cette part est de 28 % parmi ceux qui travaillent à Nanterre",
   "probleme": "L'article compare deux communes de travail (destination.92062.voiture, destination.92050.voiture), mais la méthode n'explique pas pourquoi celles-ci ont été retenues parmi les communes de travail du tableau.",
   "correction_minimale": "Ajouter une phrase de méthode qui donne la règle du choix (par exemple : deux communes de travail fréquentes des actifs résidents, aux échantillons suffisants)."}
]}
```