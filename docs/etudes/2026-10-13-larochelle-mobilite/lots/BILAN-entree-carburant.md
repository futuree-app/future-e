# Entrée carburant de la série mobilité (15/10/2026)

**Décision du porteur.** La hausse du carburant est le point de départ éditorial de la série mobilité : elle relie le coût des déplacements au choix d'un logement. Chaque article s'ouvre sur la hausse datée, place au début le tableau du surcoût selon la distance, puis amène la question locale : quelle place prend la voiture, selon le secteur et le lieu de travail ? Cette règle vaut pour la série mobilité seulement.

## Huit articles adaptés

Caen, Brest, Nîmes (lot 02), Quimper, Amiens, Besançon, Valence et Pau (lot 03). L'article retenu de chacun est désormais `<insee>/generation/edition.md`, et la retouche est tracée dans sa section F. Aucune régénération ni nouvelle collecte n'a eu lieu.

Ce qui a été ajouté à chaque article :
- un chapeau sur la hausse datée du gazole (semaines du 6 octobre 2025 et du 5 octobre 2026, rayon de 12 km autour du centre) ;
- un passage « Ce que la hausse coûte selon la distance » : la hausse du SP95-E10, les trois hypothèses dites une fois, puis le tableau déterministe ;
- une transition : le surcoût ne dépend que de la longueur du trajet, quelle que soit l'adresse, et les pratiques recensées en 2022, avant cette hausse, varient selon le secteur. L'article parle aussi du lieu de travail quand il compare plusieurs groupes de destination (Brest, Besançon, Pau) ;
- la source carburant en méthode, les lignes de correspondance (section C), le visuel et la réextraction des prix avant publication (section D).

Le reste est conservé :
- l'ancien chapeau devient un paragraphe ;
- deux intertitres de raccord sont ajoutés, à Besançon et Pau, où le passage local suivait le chapeau sans intertitre ;
- les cellules du tableau ne sont pas reprises dans la prose ;
- aucun surcoût n'est attribué à un quartier ou à une commune de travail.

**Choix d'écriture :** l'ouverture donne la hausse datée sans les deux prix. Le dossier demande de ne pas écrire la hausse et les deux prix, que le lecteur soustrairait lui-même.

**Vérification :**
- Toutes les valeurs sont lues dans `dossier.json` par un script, sans saisie à la main.
- Contrôle déterministe : 0 anomalie sur les huit articles.
- Sur /dev/lot, le tableau s'affiche avant la carte. À Amiens, ses valeurs sont celles du scénario du dossier (80, 250 et 590 € pour le gazole ; 50, 160 et 380 € pour le SP95-E10).

**Exceptions :** aucune. Les faits carburant et le scénario sont utilisables dans les huit dossiers.

Temps du terminal pilote : environ 15 minutes, du script aux vérifications.

## Vingt articles

Les vingt articles ouvrent désormais sur le carburant :
- La Rochelle et Niort (pilotes) et les dix du lot 01 l'avaient déjà ; ils ne sont pas retouchés ;
- les huit articles des lots 02 et 03 l'ont reçue par cette retouche.

## Consignes harmonisées

- `redaction/parametres_editoriaux.md` : l'ouverture carburant devient l'étape fixe du format de référence, avec le tableau au début, la transition et les interdits (attribuer le scénario, expliquer les pratiques de 2022 par la hausse). La liberté éditoriale porte sur les faits locaux. Seule exception : des données absentes ou inutilisables, nommées en section A. Le carburant quitte la liste des « indices » facultatifs.
- `redaction/PROMPT_REDACTION.md` : l'entrée carburant n'est pas une piste. Le carburant est retiré des familles de données « qui ne sont pas un plan », et une exception se motive en section A par la donnée en cause.
- `redaction/RELECTURE.md` : le carburant ne figure plus parmi les thèmes omis à ne pas signaler. Le point raisonnement cite les deux glissements à surveiller.
- `outil/controle_article.py` : quand le dossier a des faits carburant utilisables, l'absence du tableau du surcoût en tête des visuels devient une anomalie bloquante (`entree_carburant`), qui déclenche la correction. Avec cette version, le contrôle signale les huit articles d'avant la retouche et aucun des dix du lot 01.
- La réextraction des prix reste dans la liste avant publication (`outil/lot.py`, section D de chaque article).

Les dossiers déjà produits ne sont pas regénérés. Les prochains reprendront les nouveaux paramètres éditoriaux.
