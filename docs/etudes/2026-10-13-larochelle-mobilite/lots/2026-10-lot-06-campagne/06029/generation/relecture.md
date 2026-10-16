```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Ces observations donnent des repères pour orienter une recherche à l’intérieur de Cannes.",
   "probleme": "Juste après les parts de 29 % et 75 % (iris.voiture.min, iris.voiture.max), la phrase fait des pratiques des actifs qui habitent un secteur un guide pour choisir un quartier. Elle laisse croire qu'habiter Le Vieux Port-Les îles réduirait l'usage de la voiture du lecteur, alors que le dossier n'établit aucun lien de cause entre un quartier et une pratique.",
   "correction_minimale": "Supprimer la phrase, ou la remplacer par une description : « La part de la voiture varie ainsi fortement d'un secteur à l'autre parmi les actifs qui y habitent. »"},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "le secteur de résidence et le trajet vers votre emploi méritent donc chacun leur attention",
   "probleme": "Le « donc » présente l'écart entre deux groupes distincts d'actifs, ceux qui travaillent à Cannes et ceux qui travaillent au Cannet (destination.06029.voiture, destination.06030.voiture), comme un effet sur le lecteur. Il présente aussi le secteur de résidence comme un facteur de sa propre pratique.",
   "correction_minimale": "Retirer « donc » et « le secteur de résidence » : « Pour examiner une annonce, regardez aussi le trajet vers votre emploi. »"},
  {"categorie": "population",
   "gravite": "a_revoir",
   "passage": "Dans le secteur statistique Le Vieux Port-Les îles, 29 % des actifs utilisent la voiture",
   "probleme": "« des actifs » ne dit pas s'il s'agit des actifs qui habitent le secteur ou de ceux qui y travaillent. Or iris.voiture.min porte sur les actifs qui habitent le secteur, quelle que soit leur commune de travail. La précision ne figure que dans la légende de la carte et dans la méthode.",
   "correction_minimale": "Écrire « 29 % des actifs qui y habitent »."}
]}
```