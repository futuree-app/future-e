```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Pourtant, la voiture reste le mode principal de 61 % des actifs du secteur pour aller travailler.",
   "probleme": "« Pourtant » présente la proximité des commerces, de la pharmacie et de l'école (iris.441090802.panier_500m) comme si elle devait réduire l'usage de la voiture pour aller travailler (iris.441090802.voiture). Le dossier interdit d'en faire une cause des pratiques domicile-travail, et « reste » suggère une évolution qui n'est pas mesurée.",
   "correction_minimale": "La voiture est le mode principal de 61 % des actifs du secteur pour aller travailler."},
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Ce secteur mérite donc d'être regardé sous ces deux aspects",
   "probleme": "Les observations sur la Chauvinière (iris.441090802.panier_500m, iris.441090802.voiture) deviennent une recommandation de ce secteur pour le lecteur, alors qu'elles ne décrivent que la proximité des adresses et les pratiques des actifs qui y habitent.",
   "correction_minimale": "Pour tout logement envisagé, regardez ces deux aspects"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "les groupes de destination sont distincts et leurs écarts ne mesurent pas l'effet d'un déménagement.",
   "probleme": "La méthode ne dit pas pourquoi ce sont ces six communes de travail qui sont comparées (mobpro.voiture_selon_destination.communes_voisines). Elles ont été retenues automatiquement : ce sont les six plus peuplées de la même unité urbaine.",
   "correction_minimale": "Ajouter : « Les six communes de travail comparées sont, hors Nantes, les plus peuplées de son unité urbaine. »"}
]}
```