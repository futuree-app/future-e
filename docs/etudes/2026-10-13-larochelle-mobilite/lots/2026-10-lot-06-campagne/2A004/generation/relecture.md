```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Ces pratiques donnent des repères pour orienter les recherches",
   "probleme": "Avec le titre « quels secteurs regarder pour utiliser moins la voiture ? », cette phrase fait des pratiques des actifs qui habitent Centre Ville et La Confina (iris.voiture.min, iris.voiture.max) une orientation de quartier pour le lecteur, comme si s'installer dans le secteur le plus bas suffisait à moins conduire ; le dossier ne mesure aucun lien de cause entre un secteur et une pratique.",
   "correction_minimale": "Remplacer par une phrase descriptive, par exemple : « Ces écarts décrivent les trajets des actifs qui y habitent ; ils ne disent pas quel sera le vôtre, qui dépend d'abord du lien entre l'adresse et votre lieu de travail. »"},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "À Candia, pourtant, 81 % des actifs occupés utilisent principalement la voiture pour travailler",
   "probleme": "« Pourtant » laisse entendre que la proximité des équipements (iris.2A0040701.panier_500m) devrait faire baisser l'usage de la voiture pour aller travailler (iris.2A0040701.voiture). Le dossier interdit de présenter la proximité comme une cause des pratiques domicile-travail, et la section elle-même dit qu'il s'agit d'une autre question.",
   "correction_minimale": "Supprimer « pourtant » et écrire : « À Candia, 81 % des actifs occupés qui y habitent vont travailler principalement en voiture, quelle que soit leur commune de travail. »"},
  {"categorie": "croisement",
   "gravite": "a_revoir",
   "passage": "Travailler à Ajaccio, depuis quel secteur ?",
   "probleme": "Ce titre présente les parts par secteur comme celles des actifs qui travaillent à Ajaccio. Or iris.voiture.min et iris.voiture.max portent sur tous les actifs qui habitent le secteur, quelle que soit leur commune de travail, et le dossier ne croise pas secteur et commune de travail. La mention « tous lieux de travail confondus » corrige ce sens dans le texte, mais le titre peut encore induire le lecteur en erreur.",
   "correction_minimale": "Retitrer sans lier secteur et lieu de travail, par exemple : « La voiture pour aller travailler, selon le lieu de travail puis selon le secteur »."}
]}
```