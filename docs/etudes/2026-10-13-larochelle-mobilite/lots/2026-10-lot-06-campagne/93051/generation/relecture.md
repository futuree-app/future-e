```json
{"anomalies": [
  {"categorie": "raisonnement",
   "gravite": "bloquante",
   "passage": "Noisy-le-Grand : où chercher pour utiliser moins la voiture ?",
   "probleme": "Le titre pose la question « où chercher », et le seul contraste de secteurs du texte y répond (20 % contre 47 % de voiture, puis 98 % contre 34 % pour le panier). Les pratiques des actifs de Pavé Neuf 2 et de Richardets 2 deviennent ainsi une recommandation de quartier pour le lecteur, ce que `iris.voiture.min` et `iris.voiture.max` ne permettent pas : elles décrivent des pratiques, pas l'effet d'un quartier.",
   "correction_minimale": "Reprendre la question de la section A dans le titre, par exemple « Noisy-le-Grand : quels repères pour utiliser moins la voiture ? »."},
  {"categorie": "methode",
   "gravite": "a_revoir",
   "passage": "Parmi ceux qui habitent Noisy-le-Grand et travaillent à Courbevoie, cette part est de 9 %.",
   "probleme": "La méthode ne dit pas pourquoi Courbevoie a été retenue parmi les communes de travail de la section 4. Avec `destination.92026.voiture`, c'est l'une des parts les plus basses, et le lecteur peut la prendre pour un cas représentatif des trajets hors de la commune.",
   "correction_minimale": "Ajouter dans la méthode une phrase indiquant que Courbevoie est un exemple parmi les communes de travail, choisi pour sa part de voiture parmi les plus basses, et que la part varie selon la commune de travail."}
]}
```