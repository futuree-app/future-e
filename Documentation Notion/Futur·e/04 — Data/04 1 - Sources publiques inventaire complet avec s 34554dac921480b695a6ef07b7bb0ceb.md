# 04.1 - Sources publiques : inventaire complet avec statut d’intégration

Cette base recense les sources publiques utilisées ou envisagées dans futur·e.

Elle doit permettre de répondre rapidement à ces questions :

- quelles sources alimentent quels modules du produit
- à quelle échelle géographique elles sont valables
- sous quelle forme elles sont accessibles
- quel est leur statut réel d’intégration
- quelles précautions éditoriales ou techniques elles impliquent

### Sources publiques

- ***Propriétés***
    
    - Nom
    
    - Organisme
    
    - Type
    
    - Thème
    
    - Sous-thème
    
    - URL
    
    - Couverture géographique
    
    - Granularité
    
    - Granularité temporelle
    
    - Format
    
    - Mode d’accès
    
    - Fréquence de mise à jour
    
    - Statut d’intégration
    
    - Modules concernés
    
    - Usage produit
    
    - Source primaire ?
    
    - Fiabilité perçue
    
    - Priorité produit
    
    - Dernière vérification
    
    - Notes
    
- ***Valeurs recommandées pour*** Statut d’intégration
    
    - à explorer
    
    - exploration en cours
    
    - source validée
    
    - partiellement intégrée
    
    - intégrée
    
    - bloquée
    
    - abandonnée
    
- ***Valeurs recommandées pour*** Priorité produit
    
    - P1
    
    - P2
    
    - P3
    

———

### **Premières fiches à créer**

- ***DRIAS***
    
    - Nom : DRIAS
    
    - Organisme : Météo-France / DRIAS
    
    - Type : projections climatiques
    
    - Thème : climat
    
    - Sous-thème : chaleur, sécheresse, précipitations, feux, nuits tropicales
    
    - Couverture géographique : France
    
    - Granularité : grille spatiale
    
    - Granularité temporelle : horizon/scénario
    
    - Format : fichiers texte séparés par point-virgule, encodage
    latin1, grille spatiale de 8981 points couvrant la France métropolitaine.
    
    - Mode d’accès : compte gratuit sur [drias-climat.fr](http://drias-climat.fr/), téléchargement manuel,
    pas d'API REST publique.
    
    - Statut d’intégration : source validée, import manuel, modèle unique testé". Note importante : un seul modèle testé (CCLM4-8-17_MPI-ESM), médiane des 17 modèles à calculer avant production.
    
    - Modules concernés : lieu de vie, logement, santé, loisirs, projets de vie
    
    - Usage produit : moteur de projection climatique
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : très forte
    
    - Priorité produit : P1
    
    - Notes : source structurante ; nécessite rattachement point utilisateur → maille climatique. 
    
    Rattachement commune : point le plus proche par distance euclidienne
    sur coordonnées GPS. Exemple La Rochelle (46.1591, -1.1520) → point 9329
    à 2.9 km.
    
    Modèles disponibles : 17 modèles TRACC-2023. Tests effectués sur
    CCLM4-8-17_MPI-ESM uniquement. Médiane d'ensemble sur 17 modèles
    obligatoire avant mise en production.
    
    Scénarios testés et validés :
    
    - GWL15 → 2030 / France +2°C
    - GWL20 → 2050 / France +2.7°C
    - GWL30 → 2100 / France +4°C
    
    Indicateurs disponibles (30 au total, testés) :
    
    - Températures : moyenne annuelle, été, hiver, max été
    - Chaleur extrême : jours >= 30°C, jours >= 35°C, nuits tropicales
    - Sécheresse : jours sols secs (SWI < 0.4)
    - Feux : jours risque météo élevé (IFM > 40)
    - Précipitations : cumul annuel, été, hiver, extrêmes
    
    Mise à jour : annuelle, quand DRIAS publie de nouvelles projections.
    Fréquence de réimport en base : 1 fois par an maximum.
    
    **Données d'impact à explorer**
    
    DRIAS contient aussi des simulations d'impact déjà interprétées :
    
    - Agriculture
    - Risques naturels — Feux de forêts
    - Tourisme hivernal — Enneigement
    
    Ces données sont directement utilisables dans les modules Loisirs
    et Projets sans retraitement. A télécharger maintenant mais à explorer en v1.5.
    Priorité : P2. 
    
- ***Géorisques***
    
    - Nom : Géorisques
    
    - Organisme : Ministère / BRGM / Géorisques
    
    - Type : risques
    
    - Thème : risques naturels et technologiques
    
    - Sous-thème : inondation, argiles, sismicité, submersion, mouvements de terrain
    
    - Couverture géographique : France
    
    - Granularité : commune / zonage selon couches
    
    - Format : API / couches cartographiques
    
    - Mode d’accès : API
    
    - Statut d’intégration : source validée
    
    - Modules concernés : lieu de vie, logement, projets de vie
    
    - Usage produit : exposition territoriale et résidentielle
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : très forte
    
    - Priorité produit : P1
    
    - Notes : source centrale pour traduire les risques physiques en implications concrètes
    
- ***BAN***
    
    - Nom : Base Adresse Nationale
    
    - Organisme : BAN
    
    - Type : géocodage
    
    - Thème : localisation
    
    - Sous-thème : adresse, commune, coordonnées
    
    - Couverture géographique : France
    
    - Granularité : adresse / point
    
    - Format : API
    
    - Mode d’accès : API
    
    - Statut d’intégration : source validée
    
    - Modules concernés : tous
    
    - Usage produit : point d’entrée géographique utilisateur
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P1
    
    - Notes : brique indispensable pour mapper ensuite vers commune, code INSEE, maille DRIAS, etc.
    
- ***INSEE***
    - Nom : INSEE / API Géo
    - Organisme : INSEE / IGN / DINUM
    - Type : socio-économique + géographique
    - Thème : territoire, démographie
    - Sous-thème : population, structure administrative, coordonnées
    - Couverture géographique : France
    - Granularité : commune / département / région
    - Format : API REST JSON
    - Mode d'accès : API publique, sans clé, gratuite
    - URL : [https://geo.api.gouv.fr/communes/{insee}](https://geo.api.gouv.fr/communes/%7Binsee%7D)
    - Statut d'intégration : source validée
    - Modules concernés : tous
    - Usage produit : données administratives et démographiques par commune
    - Source primaire ? : oui
    - Fiabilité perçue : très forte
    - Priorité produit : P1
    - Notes : remplace INSEE et IGN pour les données de base. Une seule
    requête retourne code INSEE, population, coordonnées GPS du centre
    commune, département, région, codes postaux. Validé le 18/04/2026
    sur La Rochelle (79 851 hab., centre -1.1765 / 46.162,
    Nouvelle-Aquitaine). Sans authentification, sans limite documentée.
- ***IGN***
    - Nom : IGN — API Altimétrie
    - Organisme : IGN / Géoplateforme
    - Type : géographique
    - Thème : géographie physique
    - Sous-thème : altitude, exposition littorale
    - Couverture géographique : France
    - Granularité : point GPS
    - Format : API REST JSON
    - Mode d'accès : API publique, sans clé, gratuite
    - URL : [https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json](https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json)
    - Statut d'intégration : source validée
    - Modules concernés : logement, projets de vie, lieu de vie
    - Usage produit : altitude exacte du logement utilisateur
    - Source primaire ? : oui
    - Fiabilité perçue : très forte
    - Priorité produit : P1
    - Notes : retourne l'altitude en mètres pour n'importe quel point GPS.
    Sans authentification, sans clé API. Validé le 18/04/2026.
    Centre La Rochelle : 17.24m. Port La Rochelle : 6.22m.
    Différence critique pour le risque submersion marine.
    Ancien domaine [wxs.ign.fr](http://wxs.ign.fr/) obsolète, utiliser [data.geopf.fr](http://data.geopf.fr/).
- ***Eaufrance***
    
    - Nom : Eaufrance
    
    - Organisme : Eaufrance
    
    - Type : eau
    
    - Thème : ressource et qualité de l’eau
    
    - Sous-thème : sécheresse, qualité, tension locale
    
    - Couverture géographique : France
    
    - Granularité : variable
    
    - Format : API / datasets
    
    - Mode d’accès : API / téléchargement
    
    - Statut d’intégration : source validée
    
    - Modules concernés : lieu de vie, santé, logement
    
    - Usage produit : tension sur la ressource, qualité, vulnérabilité
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P2
    
    - Notes : très intéressant pour rendre le climat concret localement
    
- ***ATMO / AASQA***
    
    - Nom : ATMO / AASQA
    
    - Organisme : réseaux ATMO régionaux
    
    - Type : qualité de l’air
    
    - Thème : santé
    
    - Sous-thème : pollution atmosphérique, pesticides dans l’air
    
    - Couverture géographique : France, selon réseaux
    
    - Granularité : stations / zones
    
    - Format : API / fichiers
    
    - Mode d’accès : CSV quotidien publié sur [data.gouv.fr](http://data.gouv.fr/).
    URL : [https://www.data.gouv.fr/api/1/datasets/r/d2b9e8e6-8b0b-4bb6-9851-b4fa2efc8201](https://www.data.gouv.fr/api/1/datasets/r/d2b9e8e6-8b0b-4bb6-9851-b4fa2efc8201)
    Contenu : 72 036 lignes, toutes communes françaises, indice ATMO
    du jour et J+1, mis à jour quotidiennement à 14h.
    Stratégie d'intégration : téléchargement quotidien en cron job,
    import en base Supabase, pas d'appel API en temps réel.
    
    - Statut d’intégration : source validée, mode CSV quotidien national (pas API directe)
    
    - Modules concernés : santé
    
    - Usage produit : qualité de l’air et exposition environnementale
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P2
    
    - Notes : utile pour le module santé enrichi
    
- ***Santé publique France***
    
    - Nom : Santé publique France
    
    - Organisme : SPF
    
    - Type : santé publique
    
    - Thème : santé
    
    - Sous-thème : canicule, maladies vectorielles, vulnérabilités sanitaires
    
    - Couverture géographique : France
    
    - Granularité : variable
    
    - Format : rapports / indicateurs / datasets
    
    - Mode d’accès : mixte
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : santé
    
    - Usage produit : traduction sanitaire des effets climatiques
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : très forte
    
    - Priorité produit : P2
    
    - Notes : forte valeur narrative, probablement plus complexe à normaliser
    
- ***RNSA***
    
    - Nom : RNSA
    
    - Organisme : Réseau National de Surveillance Aérobiologique
    
    - Type : santé environnementale
    
    - Thème : santé
    
    - Sous-thème : pollens et allergies
    
    - Couverture géographique : France
    
    - Granularité : stations / zones
    
    - Format : bulletins / données
    
    - Mode d’accès : à vérifier
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : santé
    
    - Usage produit : allergies et saisonnalité
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P3
    
    - Notes : forte valeur perçue utilisateur
    
- ***ADEME***
    
    - Nom : ADEME
    
    - Organisme : ADEME
    
    - Type : bâtiment / énergie / adaptation
    
    - Thème : logement
    
    - Sous-thème : bâtiment, adaptation, énergie
    
    - Couverture géographique : France
    
    - Granularité : variable
    
    - Format : open data / rapports
    
    - Mode d’accès : téléchargement
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : logement
    
    - Usage produit : adaptation du bâti et lecture logement
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P2
    
    - Notes : utile pour sortir du seul risque physique
    
- ***ONERC***
    
    - Nom : ONERC
    
    - Organisme : ONERC
    
    - Type : cadrage
    
    - Thème : climat
    
    - Sous-thème : effets du réchauffement
    
    - Couverture géographique : France
    
    - Granularité : surtout synthèse
    
    - Format : rapports
    
    - Mode d’accès : téléchargement
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : pages Savoir, éditorial
    
    - Usage produit : base de cadrage et pédagogie
    
    - Source primaire ? : non
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P3
    
    - Notes : plus utile pour la couche éditoriale que pour le moteur temps réel
    
- ***BRGM / GisSol***
    
    - Nom : BRGM / GisSol
    
    - Organisme : BRGM / GisSol
    
    - Type : sols
    
    - Thème : santé / environnement
    
    - Sous-thème : cadmium, qualité des sols
    
    - Couverture géographique : France
    
    - Granularité : variable
    
    - Format : couches / cartes / datasets
    
    - Mode d’accès : à vérifier
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : santé, alimentation, lieu de vie
    
    - Usage produit : exposition environnementale locale
    
    - Source primaire ? : oui
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P3
    
    - Notes : cohérent avec l’élargissement du module santé 
    
- ***Solagro / Adonis***
    
    - Nom : Solagro / Adonis
    
    - Organisme : Solagro
    
    - Type : agriculture / pesticides
    
    - Thème : santé / alimentation
    
    - Sous-thème : pression phytosanitaire
    
    - Couverture géographique : France
    
    - Granularité : communale ou territoriale selon jeu
    
    - Format : cartes / données
    
    - Mode d’accès : à vérifier
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : santé, alimentation
    
    - Usage produit : pression phytosanitaire locale
    
    - Source primaire ? : non
    
    - Fiabilité perçue : moyenne à forte
    
    - Priorité produit : P3
    
    - Notes : à distinguer clairement des sources institutionnelles
    
- ***Qualité des eaux de baignade***
    - Nom : Qualité des eaux de baignade
    - Mode d'accès : PDF annuel, [baignades.sante.gouv.fr](http://baignades.sante.gouv.fr/)
    - Format : PDF texte, parsable par script
    - Fréquence : 1 fois par an, fin de saison balnéaire
    - Statut : source validée, import annuel
    - Données disponibles : classement E/B/S/I par site,
    4 ans d'historique (2022-2025), toute la France
    - Donnée La Rochelle : Plage Concurrence classée
    Insuffisante 2023-2024, Suffisante 2025. Signal
    fort pour le module Loisirs.
- ***France Stratégie***
    
    - Nom : France Stratégie
    
    - Organisme : France Stratégie
    
    - Type : emploi / prospective
    
    - Thème : métier
    
    - Sous-thème : transformations sectorielles
    
    - Couverture géographique : France
    
    - Granularité : souvent nationale ou sectorielle
    
    - Format : rapports
    
    - Mode d’accès : téléchargement
    
    - Statut d’intégration : à explorer
    
    - Modules concernés : métier
    
    - Usage produit : lecture sectorielle des impacts
    
    - Source primaire ? : non
    
    - Fiabilité perçue : forte
    
    - Priorité produit : P3
    
    - Notes : utile pour les narrations métier, moins pour des calculs locaux précis