```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Mais lequel regarder lorsqu’on veut moins prendre la voiture au fil de la journée ?",
   "probleme": "Juste après « les pratiques varient fortement selon le secteur », la question fait de la part de la voiture chez les actifs d'un secteur (section 3, iris.590090601.voiture, iris.voiture.max) un critère de choix de quartier pour un lecteur qui veut moins prendre la voiture. Ce passage des pratiques des habitants à une recommandation est exclu, et le dossier n'établit aucun lien de cause entre un quartier et une pratique.",
   "correction_minimale": "Remplacer la question par une transition qui ne promet pas de désigner un secteur, par exemple : « Quelle place la voiture prend-elle dans les trajets des habitants, selon le secteur ? »"},
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "La carte donne des repères pour examiner les annonces.",
   "probleme": "La carte des parts de la voiture par secteur (iris.*.voiture, actifs qui habitent le secteur, recensement 2022) devient un outil pour trier les logements. Or ces parts décrivent les pratiques des actifs qui y habitent, et non ce que le secteur permettrait à un nouvel habitant.",
   "correction_minimale": "Remplacer par : « La carte montre comment les actifs de chaque secteur se rendent au travail ; elle ne dit pas comment s'y déplacera un nouvel habitant. »"},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "Ce secteur mérite ainsi d’être examiné",
   "probleme": "Le « ainsi » rattache la recommandation à la fois aux adresses où les trois équipements sont proches (iris.590090704.panier_500m) et aux 43 % d'actifs qui vont travailler en voiture (iris.590090704.voiture). Le lecteur peut donc comprendre qu'on lui recommande le secteur pour ses pratiques de déplacement, alors que seule la proximité des équipements peut fonder ce conseil.",
   "correction_minimale": "Remplacer « Ce secteur mérite ainsi d’être examiné » par « Ses adresses méritent d’être examinées »."},
  {"categorie": "consigne_interne",
   "gravite": "a_revoir",
   "passage": "Le dossier mesure un panier réunissant",
   "probleme": "« Le dossier » est un mot de la rédaction (il désigne le document de travail) qui renvoie le lecteur à une pièce qu'il ne connaît pas.",
   "correction_minimale": "Remplacer « Le dossier mesure un panier réunissant » par « On regarde ici si une adresse a à la fois »."}
]}
```