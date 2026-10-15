```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "Ces contrastes donnent une raison de regarder précisément où se trouve chaque annonce.",
   "probleme": "Cette phrase fait de l'écart entre les pratiques des habitants de deux secteurs (iris.644450102.voiture, iris.644450302.voiture) un effet de l'emplacement, qui vaudrait aussi pour le lecteur. Or le dossier ne mesure aucun lien de cause entre un quartier et une pratique.",
   "correction_minimale": "Remplacer par une phrase qui reste descriptive, par exemple : « Ces écarts décrivent les pratiques des habitants de chaque secteur, pas ce que permettra une adresse donnée. »"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Cette part atteint 82 % parmi les actifs résidant à Pau qui travaillent à Lons, Billère, Lescar, Jurançon, Gan ou Idron.",
   "probleme": "La méthode ne dit pas comment ce groupe a été choisi (règle automatique : les six communes les plus peuplées de la même unité urbaine, d'après mobpro.voiture_selon_destination.communes_voisines). Le lecteur ne sait pas pourquoi ces six communes et pas d'autres.",
   "correction_minimale": "Ajouter dans « Méthode et sources » : « Les six communes de travail citées sont les plus peuplées de l'unité urbaine de Pau (définition INSEE), hors Pau. »"},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Proximité des équipements : Base adresse nationale et Base permanente des équipements de l'INSEE.",
   "probleme": "Le millésime de la Base permanente des équipements (BPE 2025, iris.*.panier_500m) n'apparaît ni dans le texte ni dans la méthode.",
   "correction_minimale": "Écrire « Base permanente des équipements de l'INSEE (2025) »."}
]}
```