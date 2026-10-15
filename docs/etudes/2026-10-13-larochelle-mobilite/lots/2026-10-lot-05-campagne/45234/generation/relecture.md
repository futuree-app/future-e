```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Bourgogne-Châtelet mérite ainsi l’attention d’une personne qui souhaite explorer une vie quotidienne moins tournée vers la voiture.",
   "probleme": "La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min) devient une recommandation de quartier pour le lecteur. La phrase suivante (« À Sud-Ouest-Chabassières […] la recherche demande d’identifier précisément les déplacements… », iris.voiture.max) transforme de même une pratique en contrainte pour qui s’y installerait.",
   "correction_minimale": "Supprimer les deux phrases « Bourgogne-Châtelet mérite ainsi… » et « À Sud-Ouest-Chabassières, où son usage… », ou les remplacer par une description des pratiques sans conseil sur le quartier."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Les groupes définis par leur commune de travail sont distincts",
   "probleme": "La section méthode n’explique pas comment le groupe des six communes de travail a été choisi : communes de la même unité urbaine, au plus les six plus peuplées (mobpro.voiture_selon_destination.communes_voisines). Le lecteur ne sait pas pourquoi ces communes-là.",
   "correction_minimale": "Ajouter dans la méthode : « Olivet, Saint-Jean-de-Braye, Fleury-les-Aubrais, Saran, Saint-Jean-de-la-Ruelle et La Chapelle-Saint-Mesmin sont les six communes les plus peuplées de l’unité urbaine d’Orléans, hors Orléans. »"}
]}
```