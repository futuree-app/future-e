```json
{"anomalies": [
  {"categorie": "population",
   "gravite": "a_revoir",
   "passage": "17 % des actifs occupés habitant Saint-Denis",
   "probleme": "Saint-Denis est ici le nom d'un secteur IRIS de Colombes (iris.voiture.min, IRIS 920250101). « Habitant Saint-Denis » désigne pourtant, pour un lecteur d'Île-de-France, les habitants de la commune Saint-Denis (93066), qui apparaît d'ailleurs comme commune de travail dans le dossier (destination.93066).",
   "correction_minimale": "Écrire « des actifs occupés du secteur Saint-Denis » (et de même « du secteur Salvador Allende-Égalité »)."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "parmi les actifs qui habitent Colombes et travaillent à Courbevoie, **27 %**",
   "probleme": "Le texte compare deux communes de travail, Courbevoie et Nanterre (destination.92026.voiture, destination.92050.voiture), mais la méthode ne dit pas pourquoi celles-ci ont été retenues.",
   "correction_minimale": "Ajouter dans la méthode que Courbevoie et Nanterre sont les deux communes de travail les plus fréquentes après Colombes (environ 5 % des actifs résidents chacune)."},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "Ce panier est présent dans ce rayon pour **46 % des adresses** du secteur Salvador Allende-Égalité.",
   "probleme": "Les deux mêmes secteurs servent d'exemple pour la voiture et pour les équipements : le plus bas pour la voiture (iris.voiture.min) a tous les équipements, le plus haut (iris.voiture.max) n'en a que 46 %. Ce rapprochement invite à lire la proximité comme une explication de l'usage de la voiture, ce que le dossier ne mesure pas. D'autres secteurs ont 100 % d'adresses équipées avec une part de voiture élevée (iris.920250204 : 34 % de voiture, 100 % de panier).",
   "correction_minimale": "Préciser en une phrase que la proximité des équipements et la part de la voiture ne vont pas toujours ensemble selon les secteurs, ou ne pas présenter ces deux secteurs comme une paire."}
]}
```