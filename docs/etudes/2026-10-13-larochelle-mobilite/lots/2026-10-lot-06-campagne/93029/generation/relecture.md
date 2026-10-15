```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "À Drancy, quels secteurs regarder pour chercher à réduire ces déplacements en voiture ? Les pratiques locales donnent des repères",
   "probleme": "La part de la voiture chez les actifs d'un secteur (iris.voiture.min, iris.voiture.max) sert ici de repère pour choisir un quartier : elle devient une recommandation au lecteur, alors que le dossier ne mesure aucun lien entre un quartier et une pratique.",
   "correction_minimale": "Remplacer par une question descriptive, par exemple : « À Drancy, quelle place la voiture prend-elle dans les trajets domicile-travail, selon le secteur et le lieu de travail ? »"},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "À Paris Campagne 2, 95 % des adresses ont à la fois un commerce alimentaire, une pharmacie et une école élémentaire à moins de 500 m",
   "probleme": "Les deux secteurs cités pour le panier quotidien (iris.930290902.panier_500m, iris.930290401.panier_500m) sont les deux extrêmes de la part de la voiture cités plus haut. Ce rapprochement laisse penser que la proximité des équipements explique l'usage de la voiture pour aller travailler, ce que le dossier ne mesure pas.",
   "correction_minimale": "Préciser en une phrase que la proximité des équipements ne s'observe pas toujours avec une faible part de la voiture, ou retirer le rappel implicite aux deux mêmes secteurs."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "contre 72 % de ceux qui travaillent à Roissy-en-France",
   "probleme": "Rien n'explique pourquoi Roissy-en-France est retenue (destination.95527.voiture, 2 % des actifs résidents). Le lecteur peut prendre ce chiffre pour celui des actifs qui travaillent hors de Drancy, alors que ce groupe est à 44 % (mobpro.voiture_selon_destination.ailleurs).",
   "correction_minimale": "Indiquer dans la méthode ou dans la phrase que Roissy-en-France a la part de la voiture la plus élevée parmi les communes de travail dont l'échantillon est suffisant."}
]}
```