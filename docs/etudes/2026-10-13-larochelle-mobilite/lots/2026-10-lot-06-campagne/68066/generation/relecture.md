```json
{"anomalies": [
  {"categorie": "consigne_interne",
   "gravite": "a_revoir",
   "passage": "Le dossier mesure leur proximité par un panier",
   "probleme": "« Le dossier » est un renvoi au document de production ; le lecteur ne connaît pas ce dossier (acces.*.panier_quotidien_500m, iris.*.panier_500m).",
   "correction_minimale": "Remplacer « Le dossier mesure » par « On mesure ici »."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "La proximité des équipements repose sur la Base adresse nationale et la Base permanente des équipements de l'INSEE.",
   "probleme": "L'année de la BPE (2025) n'apparaît ni dans le texte ni dans la méthode, alors que le dossier la donne pour iris.680660104.panier_500m et iris.680660804.panier_500m.",
   "correction_minimale": "Écrire « la Base permanente des équipements 2025 de l'INSEE »."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "les groupes de destination rassemblent des personnes différentes",
   "probleme": "La méthode n'explique pas comment ont été choisies les six communes de travail du groupe à 83 %. Le dossier donne cette règle : communes de la même unité urbaine, au plus les 6 plus peuplées (mobpro.voiture_selon_destination.communes_voisines).",
   "correction_minimale": "Ajouter dans la méthode : « Les six communes de travail citées sont les plus peuplées de l'unité urbaine de Colmar, Colmar exceptée. »"},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "malgré leurs pratiques domicile-travail très différentes",
   "probleme": "« Malgré » laisse entendre que les équipements proches devraient réduire l'usage de la voiture pour aller travailler, ce que le dossier ne mesure pas (iris.680660104.panier_500m, iris.680660804.voiture).",
   "correction_minimale": "Remplacer « malgré leurs pratiques » par « alors que leurs pratiques »."}
]}
```