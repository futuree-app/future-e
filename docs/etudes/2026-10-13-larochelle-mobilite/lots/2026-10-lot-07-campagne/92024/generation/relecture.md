```json
{"anomalies": [
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Parmi ceux qui habitent Clichy et travaillent à Gennevilliers, cette part est de 31 %.",
   "probleme": "La méthode ne dit pas pourquoi Gennevilliers a été choisie (destination_92036). C'est pourtant la commune de travail où la part de la voiture est la plus élevée parmi les destinations dont l'échantillon est suffisant. Comparée sans repère aux 12 % des actifs qui travaillent à Clichy, elle peut passer pour typique des trajets hors de Clichy, alors que mobpro.voiture_selon_destination.ailleurs est de 18 %.",
   "correction_minimale": "Ajouter dans la méthode une phrase sur la règle de choix, par exemple : « Gennevilliers est, parmi les communes de travail dont l'échantillon est suffisant, celle où la part de la voiture est la plus élevée. »"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "La proximité des équipements repose sur la BAN et la Base permanente des équipements de l’INSEE",
   "probleme": "L'année des données d'équipements (BPE 2025, source de iris.920240402.panier_500m et iris.920240303.panier_500m) n'apparaît ni dans le récit ni dans la méthode.",
   "correction_minimale": "Écrire « la Base permanente des équipements 2025 de l’INSEE »."}
]}
```