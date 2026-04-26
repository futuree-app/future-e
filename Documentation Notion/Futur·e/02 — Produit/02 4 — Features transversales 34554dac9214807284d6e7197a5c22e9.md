# 02.4 — Features transversales

## Mode Foyer

**Vision :**
Le mode foyer permet de croiser les profils de 2 à 6 membres d'un même foyer pour faire apparaître les vulnérabilités partagées, les divergences d'exposition, et les décisions collectives éclairées par la lecture climatique de chaque membre.

**Ce qui justifie le prix supérieur (15€/mois vs 9€/mois) :**

- Matrice d'exposition partagée (qui est exposé à quoi, d'un coup d'œil)
- Timeline des décisions collectives (achat immo, école, déménagement,
retraite) avec lecture climatique croisée
- Comparateur de villes (feature exclusive foyer) : comparer 2-3 villes
candidates pour le profil complet du foyer
- Newsletter avec section "Dans votre foyer ce mois-ci" personnalisée
pour chaque membre

**Membres du foyer :**
Jusqu'à 6 membres. Types : conjoint·e, enfant, parent âgé, autre membre. Chaque membre renseigne son propre profil simplifié (90 secondes). L'adresse est partagée (logement commun). Le métier, l'âge et les loisirs sont propres à chaque membre.

**Règles éditoriales spécifiques au foyer :**

- Jamais de classement des membres par exposition
- Jamais de pronostics individuels sur les enfants
- Toujours "conjoint·e", jamais présumer du genre
- Les enfants apparaissent via leurs caractéristiques biologiques
générales, pas comme individus pronostiqués

Un utilisateur du mode foyer peut également compléter les modules de son choix avec des informations plus précises sur son profil.

**Pricing :**
9€/mois Suivi individuel → 15€/mois Suivi Foyer
L'écart est faible psychologiquement mais significatif économiquement.
Estimation : 40% des abonnés Suivi basculent en Foyer dans leur première
année.

**Prompt associé :** Prompt 7 — Synthèse Foyer (voir 03 — Éditorial)

**Statut de développement :** Proto React validé. Dev réel : mois 7-9.

---

## Module Question-Réponse

**Vision :**
Brique de question-réponse directe, plus courte et plus tranchante que les synthèses de module. Présente à deux endroits :

- Sur la landing page comme hook de conversion (utilisateur anonyme,
saisit juste sa commune)
- Dans le dashboard payant comme outil de consultation ponctuelle
(abonné connecté, profil déjà renseigné)

**Les 4 questions sont dynamiques.**
Elles sont sélectionnées dans un catalogue de 24 tensions en fonction de la commune saisie. Un utilisateur de La Rochelle ne voit pas les mêmes questions qu'un utilisateur de Chamonix ou de Rodez. C'est ce qui crée la crédibilité immédiate du produit : la personne sent que l'outil comprend sa géographie.

**Algorithme de sélection :**

1. Récupérer les catégories de la commune depuis communes_categorization
2. Filtrer le catalogue tensions_catalog selon ces catégories
3. Appliquer les filtres de profil si disponibles (has_children,
is_owner, age_50_plus)
4. Trier par priorité (1 = haute)
5. Diversifier par linked_module (pas 4 questions sur logement)
6. Compléter avec tensions applies_to: "all" si moins de 4 résultats

**Champ libre :**
En dessous des 4 questions, l'utilisateur peut poser sa propre question.
En landing anonyme : réponse générique qui oriente vers le rapport.
Dans le dashboard payant : réponse personnalisée via Prompt 10 avec le profil complet.

**Ton spécifique à ce module :**
Plus court, plus direct, verdict qui prend position. "À acheter avec les yeux ouverts." "Trois signaux méritent votre attention." "Oui, mais les conditions changent." La nuance est dans le corps, pas dans le verdict. Ce module a des règles de ton distinctes de tous les autres
prompts.

---

### Catalogue des 24 tensions

Chaque tension est définie par : id, label (avec {commune} variable), sous-titre, catégories de communes applicables, priorité (1 haute, 3 basse), facteurs liés, module associé, filtre de profil optionnel.

| ID | Label | Sous-titre | Catégories | Priorité |
| --- | --- | --- | --- | --- |
| acheter_littoral | Acheter à {commune} ? | Risque côtier, valeur à 20 ans | littoral | 1 |
| acheter_canicule | Acheter à {commune} ? | Chaleur extrême, valeur à 20 ans | urbain_dense_sud, mediterranee | 1 |
| acheter_rural | S'installer à {commune} ? | Qualité de vie, ressources, valeur | rural_peri_urbain, rural_agricole | 1 |
| acheter_urbain_nord | Acheter à {commune} ? | Climat urbain, valeur à 20 ans | urbain_dense_nord | 1 |
| acheter_montagne | Acheter en altitude à {commune} ? | Neige, saisons, attractivité | montagne | 1 |
| surfer_ici | Surfer à {commune} dans 20 ans ? | Saisons, qualité de l'eau, tempêtes | littoral_atlantique, littoral_manche | 2 |
| baignade_ici | Se baigner à {commune} l'été ? | Plages, rivières, qualité sanitaire | littoral_mediterranee, rural_lacs, rural_riviere | 2 |
| ski_ici | Skier à {commune} dans 20 ans ? | Enneigement, stations, saisons | montagne | 2 |
| randonner_ici | Randonner autour de {commune} ? | Feux de forêt, chaleur, accès | mediterranee, montagne, rural_forestier | 3 |
| metier_exterieur | Mon métier en extérieur va-t-il tenir ? | BTP, agriculture, voirie | all | 2 |
| metier_tourisme | Mon métier du tourisme va-t-il tenir ? | Hôtellerie, restauration, loisirs | littoral, montagne, tourisme_urbain | 2 |
| metier_general | Mon métier est-il menacé par le climat ? | Secteur, structure, évolutions | all | 3 |
| metier_agricole | L'agriculture locale va-t-elle survivre ? | Filières, eau, rendements | rural_agricole, rural_viticole | 2 |
| enfants_chaleur | Élever mes enfants ici face à la chaleur ? | École, air, canicule | urbain_dense_sud, mediterranee | 2 |
| enfants_sante | Élever mes enfants à {commune} ? | Air, cadmium, école, chaleur | all | 2 |
| enfants_littoral | Élever mes enfants face au littoral ? | Submersion, érosion, école | littoral | 2 |
| eau_potable_ici | L'eau du robinet va-t-elle rester bonne ? | Ressource, qualité, restrictions | rural_agricole, littoral_mediterranee, tension_hydrique_connue | 2 |
| canicule_vivable | Vivre les étés à {commune} dans 20 ans ? | Chaleur, nuits tropicales, santé | urbain_dense_sud, mediterranee, urbain_dense_nord | 2 |
| air_urbain | Qualité de l'air à {commune} dans 20 ans ? | Ozone, particules, santé respiratoire | urbain_dense_sud, urbain_dense_nord, vallee_industrielle | 3 |
| retraite_ici | Ma retraite à {commune} est-elle viable ? | Santé, climat, coût de la vie | all | 3 |
| demenager_vers | Partir vers le Nord ou rester à {commune} ? | Comparer les climats futurs | urbain_dense_sud, mediterranee | 3 |
| valeur_immobiliere | Mon logement va-t-il perdre de la valeur ? | DPE, risques, assurance | all | 2 |
| vignobles_avenir | Mon vignoble va-t-il tenir à {commune} ? | Cépages, rendements, AOC | rural_viticole | 2 |
| feux_foret_menace | Les feux vont-ils atteindre {commune} ? | Risque, évolution, protection | mediterranee, rural_forestier, sud_ouest | 2 |
| mobilite_fragile | Mon mode de vie quotidien à {commune} repose-t-il trop sur la voiture ? | Dépendance auto, coût carburant, alternatives réelles, fragilité budgétaire | rural_peri_urbain, periurbain_dependance_auto, faible_offre_transport | 1 |
| voiture_electrique | Passer à l'électrique a-t-il du sens à {commune} ? | Recharge, trajets, alternatives, coût | periurbain_dependance_auto, faible_offre_transport, bonne_couverture_irve | 2 |

**Règle de fallback :**
Si une commune génère moins de 4 tensions spécifiques, on complète avec les tensions applies_to: "all" dans l'ordre : enfants_sante, metier_general, valeur_immobiliere, retraite_ici.

---

### Les 18 catégories de communes

Ces catégories sont stockées dans la table commune_categories de Supabase. Chaque commune peut appartenir à plusieurs catégories. La table communes_categorization fait le lien entre code INSEE et catégories applicables.

| ID | Label | Critère de classification | Source |
| --- | --- | --- | --- |
| littoral | Littoral | Commune avec façade maritime ou à moins de 5 km de la côte | INSEE loi Littoral + Cerema |
| littoral_atlantique | Littoral atlantique | Commune littoral Manche, Atlantique, Golfe de Gascogne | INSEE + zonage climatique |
| littoral_manche | Littoral Manche | Commune littoral Manche, Mer du Nord, côtes bretonnes nord | INSEE |
| littoral_mediterranee | Littoral méditerranéen | Commune littoral Méditerranée et Corse | INSEE |
| urbain_dense_sud | Urbain dense Sud | Unité urbaine > 50 000 habitants, moitié sud | INSEE + zonage climatique |
| urbain_dense_nord | Urbain dense Nord | Unité urbaine > 50 000 habitants, moitié nord | INSEE |
| mediterranee | Zone méditerranéenne | Climat méditerranéen selon classification Köppen-Geiger | Météo-France |
| montagne | Montagne | Commune classée zone de montagne | Loi Montagne + INSEE |
| rural_peri_urbain | Rural péri-urbain | Commune rurale dans l'aire d'attraction d'une ville | INSEE grille densité |
| rural_agricole | Rural agricole | Commune rurale avec > 30% de SAU agricole | Agreste |
| rural_viticole | Rural viticole | Commune avec vignobles AOC ou IGP significatifs | INAO + Agreste |
| rural_forestier | Rural forestier | Commune avec > 40% de surface boisée | IGN BD Forêt |
| rural_lacs | Rural avec lacs | Commune avec plan d'eau de baignade suivi ARS | ARS baignades |
| rural_riviere | Rural avec rivière | Commune traversée par cours d'eau catégorie 1 ou 2 | SANDRE |
| tension_hydrique_connue | Tension hydrique avérée | Commune en arrêté sécheresse récurrent ou zone SDAGE en tension | BRGM + Agences de l'eau |
| vallee_industrielle | Vallée industrielle | Commune dans vallée à forte densité industrielle | INSEE + ATMO |
| sud_ouest | Sud-Ouest feux | Départements Landes, Gironde, Lot-et-Garonne, Dordogne, Gers | INSEE + Promethée |
| tourisme_urbain | Tourisme urbain | Ville > 100 000 habitants avec emploi touristique > 10% | INSEE emploi |
| periurbain_dependance_auto | Dépendance automobile périurbaine | Part voiture > 70 % des actifs occupés résidents ET flux domicile-travail sortants > 40 % | INSEE RP / Ecolab mobilité |
| faible_offre_transport | Faible offre de transport collectif | Couverture locale limitée ou absente dans le PAN transport.data.gouv.fr | transport.data.gouv.fr |
| bonne_couverture_irve | Bonne couverture IRVE | Au moins 1 borne ouverte au public pour 2 000 habitants dans un rayon de 10 km | data.gouv IRVE |

---

### Exemples de matching par commune

Ces exemples permettent de valider que l'algorithme produit des résultats qui font sens géographiquement.

**La Rochelle (17000)**
Catégories : littoral, littoral_atlantique, urbain_dense_nord
Questions affichées : Acheter à La Rochelle ? / Surfer dans 20 ans ? / Élever mes enfants face au littoral ? / Mon métier est-il menacé ?

**Montpellier (34000)**
Catégories : urbain_dense_sud, mediterranee
Questions affichées : Acheter à Montpellier ? / Vivre les étés dans 20 ans ? / Élever mes enfants face à la chaleur ? / Qualité de l'air dans 20 ans ?

**Chamonix (74400)**
Catégories : montagne
Questions affichées : Acheter en altitude à Chamonix ? / Skier dans 20 ans ? / Randonner autour de Chamonix ? / Mon métier du tourisme va-t-il tenir ?

**Saint-Émilion (33330)**
Catégories : rural_viticole, rural_agricole, sud_ouest
Questions affichées : S'installer à Saint-Émilion ? / Mon vignoble va-t-il tenir ? / Les feux vont-ils atteindre Saint-Émilion ? / L'agriculture locale va-t-elle survivre ?

**Clermont-Ferrand (63000)**
Catégories : urbain_dense_nord, vallee_industrielle
Questions affichées : Acheter à Clermont-Ferrand ? / Qualité de l'air dans 20 ans ? / Vivre les étés dans 20 ans ? / Mon logement va-t-il perdre de la valeur ?

**Rodez (12000)**
Catégories : rural_peri_urbain
Questions affichées : S'installer à Rodez ? / L'eau du robinet va-t-elle rester bonne ? / Mon métier est-il menacé ? / Élever mes enfants à Rodez ?

---

### Implémentation technique

**Tables Supabase nécessaires :**

`tensions_catalog
  id (text, primary key)
  label (text) — contient {commune} variable
  subtitle (text)
  applies_to (text[]) — array de catégorie IDs ou ["all"]
  priority (int) — 1 haute, 2 moyenne, 3 basse
  linked_factors (text[])
  linked_module (text)
  profile_filter (text[]) — optionnel

commune_categories
  id (text, primary key)
  label (text)
  criterion (text)
  source (text)

communes_categorization
  insee_code (text, primary key)
  commune_name (text)
  categories (text[]) — array de category IDs`

**Coût :** 0€. Données statiques, import CSV unique.
**Lignes estimées communes_categorization :** ~35 000 (toutes les communes françaises). Import prioritaire sur les 2000 premières communes qui représentent 80% de la population.

**Prompt associé :** Prompt 10 — Réponse à tension directe (voir 03 — Éditorial)

**Statut de développement :** Proto HTML validé. Tables Supabase à créer en mois 1. Intégration landing : mois 1-2.

---

## Newsletter mensuelle

**Vision :**
Newsletter personnalisée envoyée le premier lundi de chaque mois à tous les abonnés Suivi et Foyer. Chaque newsletter est unique pour son destinataire.

**Structure en 6 sections :**

1. L'ouverture (60-100 mots) : le mois, la ville, le foyer ou l'individu
2. Le fait marquant du mois (150-250 mots) : l'événement le plus significatif pour ce profil
3. Ce qui change pour vous (200-300 mots) : évolutions concrètes des données du profil
4. Un regard (150-250 mots) : mini-essai transversal, identique pour tous les abonnés du mois
5. Une action possible (80-130 mots) : une seule suggestion, pas dix
6. Dans votre foyer ce mois-ci (150-250 mots) : section exclusive Foyer

**Mode artisanal au démarrage :**
Les 6 premiers mois, la newsletter est rédigée manuellement avec Claude comme assistant éditorial (Prompt 9), puis envoyée via Buttondown (gratuit jusqu'à 100 abonnés, 9$/mois jusqu'à 1000).

**Automatisation à partir de 200-300 abonnés :**
Génération via Claude API (Prompt 9) à partir d'un input JSON des événements du mois, envoi automatisé via Resend + Buttondown.

**Coût estimé API à 1000 abonnés :** 5-10€/mois.

**Signature :** "Pour votre lecture lente, L'équipe futur•e"

**Prompt associé :** Prompt 9 — Newsletter mensuelle (voir 03 — Éditorial)

**Statut de développement :** Mode artisanal dès le lancement (M6). Automatisation M8-9.

---

## Notifications ciblées

**Vision :**
Alertes push envoyées uniquement quand un événement public documenté concerne directement le profil de l'utilisateur. Maximum 2 notifications par mois en plan Suivi, 3 en plan Foyer.

**4 types de déclencheurs uniquement :**

Type 1 — Seuil franchi
Une classification de risque officielle change pour la commune de l'utilisateur. Ex : Géorisques révise le PPRi d'un quartier, GisSol publie de nouvelles valeurs cadmium.

Type 2 — Alerte sanitaire publique
ANSES, Santé publique France, EFSA ou ARS publie un avis qui concerne un facteur actif dans le profil. Ex : nouveaux seuils cadmium enfants, alerte qualité eau de baignade.

Type 3 — Amélioration positive mesurée
Une évolution favorable confirmée sur un facteur suivi par l'utilisateur. Consolidée sur 12+ mois minimum, pas une fluctuation ponctuelle.

Type 4 — Décision locale majeure
Mairie, EPCI, département ou région publie un plan climat, PLU ou décision d'aménagement qui touche directement le profil.

**Règles absolues :**

- Jamais entre 22h et 7h
- Jamais sur des pics ponctuels (alerte météo du jour, ozone du soir)
- Jamais deux fois sur le même sujet dans un délai de 30 jours
- Jamais de notification marketing déguisée en alerte

**Mode artisanal au démarrage :**
Veille manuelle hebdomadaire des sources (ANSES, ARS, Géorisques, BRGM). Validation humaine de chaque notification avant envoi.

**Prompt associé :** Prompt 8 — Notification personnalisée (voir 03 — Éditorial)

**Statut de développement :** v1.5, mois 9-12. Pas dans le MVP.

---

## Signaux communautaires (v3 — en attente)

**Vision :**
Système de contribution lente et validée permettant aux abonnés d'enrichir la base de données territoriale avec leurs observations de terrain.

**Décision :** Écarté pour MVP et v2. À réévaluer en v3 quand la base d'abonnés atteint 1000+ actifs.

**Raisons du report :**

- Risque de désinformation sur signaux non vérifiés
- Modération lourde à mettre en place
- Potentiellement contradictoire avec le positionnement sober et sourcé
- Ressources dev insuffisantes pour faire ça bien

**Si implémenté en v3, trois types de contributions uniquement :**

1. Confirmations d'alertes officielles déjà publiées
2. Observations lentes de terrain (moustiques, floraison, sécheresse
observable)
3. Retours d'expérience sur décisions d'adaptation (isolation, déménagement)

**Ce qui est exclu définitivement :**
Alertes sanitaires en temps réel, messagerie entre abonnés, signaux sur des personnes ou commerces.