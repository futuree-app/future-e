```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "a_revoir",
   "passage": "Pour départager des annonces dans ces secteurs, le trajet professionnel mérite donc un examen précis.",
   "probleme": "Le « donc » fait de l'écart entre secteurs (iris.595120503.voiture, iris.595121201.voiture) un argument sur le trajet professionnel, comme si l'écart venait du lieu de travail ; or ces parts portent sur tous les actifs du secteur, quelle que soit leur commune de travail, et le dossier ne mesure aucun lien de ce type (section 3).",
   "correction_minimale": "Supprimer « donc », ou supprimer la phrase et garder le conseil du paragraphe sur la destination."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "leur comparaison ne mesure pas l'effet d'un déménagement",
   "probleme": "Les groupes de destination se distinguent par la commune de travail : la limite donnée par le dossier porte sur l'effet d'un changement d'emploi (mobpro.voiture_selon_destination.*), pas sur celui d'un déménagement.",
   "correction_minimale": "Remplacer « d'un déménagement » par « d'un changement de lieu de travail »."}
]}
```