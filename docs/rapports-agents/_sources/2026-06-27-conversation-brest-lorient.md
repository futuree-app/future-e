# Digest de conversation — test utilisateur réel « Brest vs Lorient » (2026-06-27)

> Matière source pour les agents d'analyse (Data Curator, Product Strategist, Archiviste).
> Contexte : le porteur de futur•e a dogfoodé le produit *à travers Claude* sur une **vraie décision de vie de couple** (lui + sa conjointe), envisageant de s'installer en Bretagne. Ce n'est pas un scénario de test : c'est du réel, émotionnel, itératif. À analyser comme un test d'usage en conditions réelles.

## Le parcours réel suivi (un entonnoir, pas des requêtes isolées)

1. Projections climatiques 2030/2050/2100 pour Brest, Lorient, Saint-Malo (puis Rennes).
2. Bassins d'emploi des 4 villes (Flores A38).
3. Politique / orientation gauche-droite + politiques publiques.
4. Traduction des « politiques intéressantes » en signaux mesurables (mobilité, air, services, logement social).
5. Recentrage sur Brest → recherche de **villes au profil proche** (climat doux + assez grandes).
6. Comparaison Lorient vs La Rochelle (« est-ce vraiment invivable à Lorient ? ») + prix immobilier (Lorient, La Rochelle, Saint-Brieuc, Brest).
7. Peur de « se faire chier » à Saint-Brieuc → vitalité.
8. Comparaisons de taille (Saint-Brieuc vs La Rochelle ; vs Brest/Lorient ; Brest vs Bordeaux).
9. Pollution air + sol (Bordeaux, puis La Rochelle vs Brest/Lorient).
10. Eau / nitrates (Hub'Eau live).
11. Départage final Brest vs Lorient + « qu'est-ce qui manque pour décider, avant d'aller visiter ».
12. Jours de pluie / cliché breton.
13. Qualité des eaux de baignade (plages).

## Données qui ONT fait défaut (constats directs, par impact décisionnel)

1. **Ensoleillement (heures/an) et nombre de jours de pluie.** futur•e a le cumul de pluie (mm DRIAS) et l'intensité (q99, Rx1d) mais PAS la fréquence ni l'ensoleillement. Or le cliché « il pleut en Bretagne » porte exactement là-dessus (jours gris + lumière), pas sur le volume. J'ai dû combler de mémoire (~1550 h Brest vs ~2250 h La Rochelle) = hors-produit, non sourcé. Source candidate : normales Météo-France (ensoleillement, nombre de jours de précipitation ≥ 1 mm).
2. **Qualité des eaux de baignade / plages.** Manquant DEUX fois (algues vertes baie de Saint-Brieuc, puis « les plages sont-elles polluées »). J'ai utilisé baignades.sante.gouv.fr / ARS / Eau et Rivières de Bretagne en externe. Pour un produit de choix de vie LITTORAL, c'est un critère de décision réel. Donnée ouverte, structurée, classée (directive 2006/7/CE : Excellent/Bon/Suffisant/Insuffisant), à jour. Hub'Eau ne l'expose pas ; source = Ministère de la Santé.
3. **Population de l'aire urbaine / « taille vécue ».** L'index a `population` (commune) + code `uu` mais PAS le nombre d'habitants de l'unité urbaine/aire. J'ai dû corriger à la main 3-4 fois l'écart commune↔agglo (Brest 140k commune / ~210k aire ; Bordeaux 262k / 820k métropole). « Est-ce une grande ville ? » se joue sur la taille vécue, pas la commune.
4. **Logement social / taux HLM.** Demandé explicitement (volet « politique du logement »). Absent de l'index du comparateur (présent seulement à l'IRIS, dans une autre brique). Trou sur le « comparer des villes sur leur politique logement ».

## Limites PRODUIT / UX révélées (au-delà de la data)

- **Pas de moteur « communes similaires à X ».** Le porteur a demandé « trouve des villes proches de Brest » ; j'ai dû fabriquer une heuristique de similarité à la main (55 % services / 45 % douceur climatique). Besoin de MILIEU de parcours, distinct des 3 portes existantes (découverte /ou-vivre, départage mode choix, Pack) : « comme ici, mais ailleurs / en mieux sur un axe ». Opportunité forte.
- **Le set de comparaison n'arrête pas de bouger** (3→4→5 villes, ajout La Rochelle puis Bordeaux, retrait, retour Brest/Lorient). Le comparateur est figé sur N∈{2,3}. La délibération réelle est fluide : ajouter/retirer/permuter, et changer la question en cours de route. Tension parcours réel ↔ trio figé.
- **« Est-ce que ce sera invivable ? »** Le couple voulait un VERDICT de seuil, pas des nombres. Ce qui les a soulagés, c'est la synthèse (« si La Rochelle est vivable, Lorient l'est confortablement »). La valeur émotionnelle se cristallise dans la SYNTHÈSE/AskFuture, pas dans la donnée brute.
- **« Horizon 2030/2050/2100 » = en fait niveaux de réchauffement +1,5/+2/+3 °C (GWL).** J'ai dû le ré-expliquer plusieurs fois. Afficher une DATE pour un niveau de réchauffement est lisible mais potentiellement trompeur. Friction pédagogique d'interface.

## Insights méta pour le projet

- **Décision à DEUX.** « Ma conjointe et moi », préférences qui peuvent diverger, peser ensemble. L'archétype/produit semble centré décideur unique. Objet possible « notre arbitrage » (partagé).
- **Le parcours est un ENTONNOIR** (région d'envie → finalistes → départage → préparation de visite). futur•e a des portes d'entrée ; accompagne-t-il l'entonnoir dans la durée, ou répond-il par requêtes ponctuelles ? La valeur tenait au FIL narratif.
- **Le meilleur moment du produit = quand il dit ce qu'il NE sait pas** et passe la main à la visite physique (« passez une soirée dans chaque centre, c'est l'attachement au lieu qui tranche »). À assumer comme SIGNATURE de positionnement (futur•e prépare la décision, ne se substitue pas au ressenti), pas comme un aveu de faiblesse. Cohérent avec la voix honnête déjà en place (« tout est au-dessus du seuil OMS », « le cliché est vrai pour Brest, faux pour Lorient »).

## Ce qui a BIEN fonctionné (à ne pas casser)

- Profondeur data décision-grade : climat, emploi par bassin, immobilier, pollution air/sol, nitrates ont tous tenu.
- La valeur est RELATIONNELLE (contraste entre villes), confirmant la doctrine déjà actée : le chiffre seul est inerte.
- La voix honnête est un actif de confiance.
