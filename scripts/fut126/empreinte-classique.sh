#!/bin/sh
# FUT-126 · LE CLASSIQUE NE BOUGE PAS : empreinte des cas du lot, en présentation classique.
# Usage (depuis la racine du dépôt, serveur local lancé avec DOSSIER_NARRATIVE=false) :
#   sh scripts/fut126/empreinte-classique.sh <dossier-de-sortie> [base=http://localhost:3126]
# Puis : node scripts/fut118/comparer-empreintes.mjs <avant> <après>
# Le cas « La Rochelle » réunit les points de la recette : vie locale, taille, argiles, bruit, contrôles.
L='lieu=Place%20de%20l%27H%C3%B4tel%20de%20Ville%2017000%20La%20Rochelle'
P='prefs=vie_locale:3,eviter_grandes_villes:3,calme_sonore:2,mobilite_quotidienne:2,proximite_mer:2,faible_risque_inondation:2'
EMPREINTE_PAGES="[[\"c-larochelle\",\"/dev/fut92?vue=classique&$L&$P&projet=recette\"],[\"c-larochelle-commune\",\"/dev/fut92?vue=classique&insee=17300&$P\"],[\"c-nimes\",\"/dev/fut92?vue=classique\"],[\"c-fut91\",\"/dev/fut91?vue=classique&pane=1&artefact=1&projet=1\"]]" \
  node scripts/fut118/empreinte-visuelle.mjs "$1" "${2:-http://localhost:3126}"
