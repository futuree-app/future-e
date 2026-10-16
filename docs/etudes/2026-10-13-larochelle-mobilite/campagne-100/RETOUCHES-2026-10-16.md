# Retouches après la relecture du 16/10/2026

Relecture d'un échantillon (Toulouse, Nantes, Grenoble, Nanterre, Ajaccio), du bilan et des compteurs. Trois actions retenues ; ni régénération des cent articles, ni traitement des 101 remarques de niveau 2.

## 1. Tableau du surcoût affiché deux fois

Les 80 articles de la campagne (et aucun des vingt précédents) contenaient à la fois le marqueur `[VISUEL : Tableau du scénario de surcoût de carburant]`, qui affiche le tableau construit depuis le dossier, et un tableau Markdown recopié par le rédacteur.

- Correction : dans chaque article, le tableau recopié est remplacé par le marqueur, à sa place, et le marqueur d'origine retiré ; l'ordre du texte est conservé. Article retenu : `generation/edition.md`, trace en section F. Script : `dedoublonner_tableau_carburant` (`outil/lot.py`).
- Vérification : contrôle déterministe à 0 anomalie sur les 80 ; un seul tableau dans le rendu de /dev/lot (vérifié sur Toulouse, Montpellier, Nanterre, Ajaccio).
- Prévention : la chaîne applique ce retrait automatiquement après la rédaction (trace en section F) ; la consigne de rédaction dit de ne pas recopier le contenu d'un visuel.

## 2. Titres et raccord prescriptifs

- Nantes : titre « où chercher un logement pour moins prendre la voiture ? » → « la place de la voiture selon le secteur et le lieu de travail » ; raccord « Pour sélectionner les annonces à approfondir, regardez donc le secteur… » → description de la carte, qui renvoie au trajet propre du lecteur.
- Ajaccio : titre « quels secteurs regarder pour utiliser moins la voiture ? » → « la voiture domine même pour travailler dans la commune » (74 % des actifs qui habitent et travaillent à Ajaccio).

Retouches à la main, en section F, contrôle à 0. Les autres titres de forme voisine (une bonne partie des 80 : « quelle adresse choisir pour moins prendre la voiture ? », « quel secteur regarder… ») ne sont pas retouchés ; ils relèvent de la relecture avant publication.

## 3. Consignes qui poussaient à la recommandation

Origine : le dossier présentait la question de la série comme « utiliser moins sa voiture » (gabarit `outil/dossier_redaction.py`, `redaction/COMPLEMENT_DOCUMENTAIRE.md`), d'où les titres « où chercher… pour moins conduire ». Recadrage pour les prochains lots :
- la question servie devient « la place de la voiture dans les déplacements depuis un futur logement » ;
- `redaction/parametres_editoriaux.md` (ouverture) : le titre et la question décrivent cette place telle que les pratiques la montrent, sans promettre qu'un secteur ou une adresse permettra de moins conduire ;
- étape 4 : « les vérifications concrètes » (au lieu de « options et vérifications »).

Les dossiers déjà produits ne sont pas régénérés.

## Précision sur le bilan

Le bilan compte 41 **articles** corrigés pour une anomalie de niveau 1, certains pour plusieurs anomalies, de gravité variable. L'intitulé du bilan est corrigé en ce sens.
