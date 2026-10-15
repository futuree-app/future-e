```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "À Toulouse, quel secteur regarder pour utiliser moins la voiture ?",
   "probleme": "Le titre fait de la part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max, tableau de la section 3) un critère de choix de quartier pour le lecteur ; c'est une recommandation que ces pratiques ne permettent pas.",
   "correction_minimale": "À Toulouse, quelle place pour la voiture selon le secteur et le lieu de travail ?"},
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "La carte permet de situer les secteurs à examiner pendant vos recherches.",
   "probleme": "Les pratiques des actifs de chaque secteur (section 3) deviennent une liste de secteurs à cibler. La phrase suivante (« gardez donc votre lieu de travail à côté de la carte des secteurs ») pousse aussi à croiser secteur et commune de travail, alors que le dossier ne donne pas ce croisement.",
   "correction_minimale": "Remplacer par « La carte situe ces pratiques dans la ville. » et supprimer « Pour sélectionner des annonces, gardez donc votre lieu de travail à côté de la carte des secteurs »."},
  {"categorie": "lisibilite",
   "gravite": "a_revoir",
   "passage": "la voiture est le mode principal pour aller travailler de 14 % à Saint-Rome",
   "probleme": "La construction « est le mode principal … de 14 % » peut faire croire que la voiture domine dans les deux secteurs, alors que iris.voiture.min donne une part de 14 % des actifs.",
   "correction_minimale": "la part des actifs qui vont travailler principalement en voiture va de 14 % à Saint-Rome à 74 % à Saint-Simon Ouest"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Cette part est de 59 % parmi ceux qui travaillent à Blagnac et de 70 % parmi ceux qui travaillent à Colomiers.",
   "probleme": "La méthode ne dit pas pourquoi l'article cite ces deux communes de travail parmi celles de la section 4 (destination.31069, destination.31149), alors que d'autres pèsent autant, comme Labège et Balma.",
   "correction_minimale": "Ajouter en méthode une phrase sur la règle de choix, par exemple : « Blagnac et Colomiers sont les deux premières communes de travail des actifs toulousains après Toulouse. »"}
]}
```