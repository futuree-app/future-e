```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "À Nice, choisir son secteur pour utiliser moins la voiture",
   "probleme": "Le titre présente les pratiques des actifs d'un secteur (iris.voiture.min, iris.voiture.max) comme un levier : choisir un secteur ferait moins prendre la voiture. Or le dossier décrit des pratiques, sans mesurer l'effet d'un emménagement ni aucun lien de cause entre un quartier et une pratique.",
   "correction_minimale": "À Nice, la place de la voiture selon le secteur et le lieu de travail"},
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "un secteur où la voiture est peu utilisée pour travailler mérite d’être examiné avec votre propre lieu d’emploi et vos horaires",
   "probleme": "La faible part de la voiture chez les actifs d'un secteur (section 3) devient une recommandation de quartier pour le lecteur, juste après des chiffres par commune de travail (mobpro.voiture_selon_destination.*) que le dossier ne croise pas avec les secteurs.",
   "correction_minimale": "cela invite à garder la destination professionnelle à côté des annonces et à confronter chaque logement à votre propre lieu d’emploi et à vos horaires."},
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "Ce secteur mérite donc un examen différent selon que vous cherchez à revoir vos déplacements professionnels ou ceux liés aux besoins quotidiens.",
   "probleme": "Le « donc » tire du panier à 100 % et des 71 % de voiture (iris.060880905.panier_500m, iris.060880905.voiture) une conclusion pour le lecteur : les courses s'y feraient sans voiture, le travail l'exigerait. La proximité devient un usage et la pratique observée une contrainte.",
   "correction_minimale": "Supprimer cette phrase ; le constat qui précède suffit."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Les groupes définis par la commune de travail sont distincts.",
   "probleme": "La méthode n'explique pas comment ont été choisies Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet et Saint-Laurent-du-Var (mobpro.voiture_selon_destination.communes_voisines) : ce sont les six communes les plus peuplées de l'unité urbaine de Nice.",
   "correction_minimale": "Ajouter : « Antibes, Cannes, Cagnes-sur-Mer, Grasse, Le Cannet et Saint-Laurent-du-Var sont les six communes les plus peuplées de l’unité urbaine INSEE de Nice, hors Nice. »"},
  {"categorie": "lisibilite",
   "gravite": "a_revoir",
   "passage": "reprenezz votre destination et vos horaires",
   "probleme": "Coquille dans le verbe, sans identifiant du dossier en cause.",
   "correction_minimale": "reprenez votre destination et vos horaires"}
]}
```