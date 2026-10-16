```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Peuple-Boivin-Saint-Jacques mérite ainsi d’être examiné si votre projet consiste à moins conduire.",
   "probleme": "La part de la voiture chez les actifs qui habitent le secteur (iris.voiture.min, 26 %) devient une recommandation de quartier pour le lecteur. Or cette part décrit une pratique des habitants actuels, pas ce que le secteur permettrait au lecteur de faire.",
   "correction_minimale": "Supprimer la phrase et garder seulement la description de l'écart, avec l'invitation à partir de ses propres destinations."},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "où 73 % des actifs résidents vont pourtant travailler principalement en voiture",
   "probleme": "« pourtant » suggère que la proximité des équipements (iris.422181804.panier_500m) devrait faire baisser l'usage de la voiture pour aller travailler (iris.422181804.voiture), alors que la proximité ne doit jamais être présentée comme la cause des pratiques domicile-travail.",
   "correction_minimale": "Remplacer « pourtant » par une juxtaposition neutre : « C’est aussi le cas à Gounod, où 73 % des actifs résidents vont travailler principalement en voiture. »"},
  {"categorie": "consigne_interne",
   "gravite": "a_revoir",
   "passage": "le dossier permet de regarder la présence simultanée",
   "probleme": "Renvoi au dossier de production, qui ne veut rien dire pour le lecteur.",
   "correction_minimale": "Écrire « on peut regarder la présence simultanée »."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Les comparaisons entre secteurs et entre communes de travail concernent des groupes distincts",
   "probleme": "La méthode ne dit pas pourquoi ces six communes de travail ont été retenues (mobpro.voiture_selon_destination.communes_voisines : communes de la même unité urbaine, au plus les 6 plus peuplées). Le lecteur ne peut donc pas comprendre ce choix, alors que d'autres communes de travail pèsent autant ou plus.",
   "correction_minimale": "Ajouter à la méthode : « Saint-Chamond, Firminy, Rive-de-Gier, Le Chambon-Feugerolles, Roche-la-Molière et Unieux sont les six communes les plus peuplées de l’unité urbaine de Saint-Étienne, hors Saint-Étienne. »"}
]}
```