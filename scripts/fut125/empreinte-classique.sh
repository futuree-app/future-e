#!/bin/sh
# FUT-125 · LE CLASSIQUE NE BOUGE PAS : empreinte des cas du lot, en présentation classique.
# Usage (depuis la racine du dépôt, serveur local lancé avec DOSSIER_NARRATIVE=false) :
#   sh scripts/fut125/empreinte-classique.sh <dossier-de-sortie> [base=http://localhost:3125]
# Puis : node scripts/fut118/comparer-empreintes.mjs <avant> <après>
L='lieu=Place%20de%20l%27H%C3%B4tel%20de%20Ville%2017000%20La%20Rochelle'
EMPREINTE_PAGES="[[\"c-recette\",\"/dev/fut92?vue=classique&$L&projet=recette&ailleurs=6&biens=2&objectif=buy&lien=lives_here\"],[\"c-etats\",\"/dev/fut92?vue=classique&$L&projet=etats&residence=Lorient&defaut=1&biens=2\"],[\"c-sans\",\"/dev/fut92?vue=classique&insee=17300&projet=sans\"],[\"c-fut91\",\"/dev/fut91?vue=classique&pane=1&artefact=1&projet=1\"]]" \
  node scripts/fut118/empreinte-visuelle.mjs "$1" "${2:-http://localhost:3125}"
