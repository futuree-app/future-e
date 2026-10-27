# FUT-82 · 5. Valeur de décision : huit scénarios sur des données réellement consultées

> Chaque scénario s'appuie sur des réponses obtenues le 27/10/2026 (`mesures/sondes-adresses.json`,
> sortie du POC `scripts/research/fut82/poc-zones-reglementaires.mjs`). Les adresses ciblées sont
> géocodées le plus souvent à la rue : elles illustrent un secteur, pas un logement précis. Rien n'est
> inventé ; quand une donnée n'a pas été lue, le scénario le dit.

Grille : **(1)** ce que futur•e sait déjà · **(2)** ce qu'il ignore · **(3)** ce que la donnée ajoute ·
**(4)** ce qui change dans une vérification ou un arbitrage · **(5)** ce qu'on ne peut toujours pas conclure ·
**(6)** restitution simple.

---

## S1. Acheter près d'un aéroport · Villeneuve-le-Roi (Orly), Goussainville (Roissy)

1. **Déjà su.** La mesure communale de calme désigne le **rail** comme source dominante dans les deux
   communes ; le module Autour liste autoroutes, routes à grande circulation et voies ferrées, **pas les
   aéroports**. Le dossier ne dit rien de l'aérien.
2. **Ignoré.** Que l'adresse est dans un plan d'exposition au bruit, et lequel.
3. **Apport.** Villeneuve-le-Roi (12 avenue de la République, géocodée au numéro) : **zone B** du PEB d'Orly
   (arrêté du 21/12/2012) et **zone 2** du plan de gêne sonore ; la **zone A** commence à moins de 50 m
   dans certaines directions. Goussainville : **zone C** du PEB de Roissy (2007) et **zone 3** du PGS.
4. **Ce qui change.** (a) Une pièce à exiger : le vendeur doit joindre un document sur la zone de bruit
   (art. L112-11) ; (b) une aide possible : le PGS ouvre droit, sous conditions, à l'aide à
   l'insonorisation ; (c) un arbitrage de Projet : en zones A, B et C, agrandir pour loger plus de monde
   ou diviser est en principe exclu (art. L112-10), alors qu'une rénovation sans augmenter la capacité
   reste possible. Pour un Projet « agrandir la maison », c'est décisif.
5. **Toujours inconnu.** Le bruit vécu dans ce logement (isolation, orientation, couloirs réellement
   survolés, nuit).
6. **Restitution.** À retenir : « Zone B du plan d'exposition au bruit d'Orly. » Pour votre projet :
   « Une extension qui ajoute des habitants y est en principe interdite. » À vérifier : « Le document
   d'information du vendeur, l'isolation des fenêtres, une visite aux heures de passage. »

**Contre-exemple utile.** À La Rochelle (1 rue du Palais), la mesure communale désigne l'**aéroport**
comme source dominante, mais l'adresse n'est dans **aucune** zone de PEB : le fait d'adresse corrige le
fait communal dans l'autre sens.

## S2. Maison en zone boisée, mémoire des incendies · La Teste-de-Buch, Landiras, Agel ; Gonfaron

1. **Déjà su.** Le danger météorologique projeté (DRIAS) : La Teste et Landiras au 50ᵉ percentile
   national seulement ; le risque « Feu de forêt » déclaré par Géorisques pour la commune ; une composition
   qui mentionne le débroussaillement en général.
2. **Ignoré.** Si l'adresse est soumise à l'obligation de débroussailler ; ce que la commune a déjà vécu.
3. **Apport.** OLD : La Teste (rue, zone publiée, arrêté du 17/10/2025), Landiras, Agel, Serres-Gaston :
   **en zone**. BDIFF (commune) : La Teste 93 feux depuis 2006, le plus étendu **5 709 ha** (2022) ;
   Landiras **12 552 ha** (2022) ; Agel 14 ha (2018).
4. **Ce qui change.** Une charge concrète (débroussailler, en général sur 50 m autour des constructions,
   parfois chez le voisin), une information que le vendeur doit donner dès l'annonce, un arbitrage
   « maison en lisière » contre « maison en bourg ». Au 50ᵉ percentile de danger projeté, l'indice seul
   aurait laissé La Teste dans la moyenne ; la mémoire de 2022 et l'obligation légale disent autre chose.
5. **Toujours inconnu.** L'état réel de la végétation, le coût, l'assurabilité, la défendabilité du
   terrain par les secours.
6. **Restitution.** À retenir : « Terrain soumis à l'obligation de débroussailler (zonage publié, arrêté
   du 17/10/2025). » Pour votre projet : « Un entretien annuel à prévoir, parfois au-delà de votre
   clôture. » À vérifier : « La profondeur fixée par l'arrêté, le coût d'entretien, la situation des
   voisins. »

**Contre-exemple.** Gonfaron : 6 832 ha brûlés dans la commune en 2021, mais le bourg testé est **hors**
zone OLD. Le fait communal ne doit jamais devenir « des incendies près de chez vous ».

## S3. Maison avec sous-sol, sensibilité aux remontées de nappe · Villeneuve-le-Roi, La Rochelle, Abbeville

1. **Déjà su.** La lecture inondation à l'adresse (PPRN, ONRN, CatNat par commune avec le péril
   « remontées de nappe » quand il a été reconnu).
2. **Ignoré.** La sensibilité du secteur aux remontées de nappe.
3. **Apport.** Villeneuve-le-Roi et La Rochelle centre : « potentiellement sujet aux **inondations de
   cave** », fiabilité **forte** ; Abbeville : idem, fiabilité moyenne. Mais **60 %** des logements
   tirés sont dans une classe « sujette », 39 % en fiabilité moyenne ou forte.
4. **Ce qui change.** Seulement si le bien a une **cave ou un sous-sol** (ou si le Projet en prévoit un) :
   une question à poser (inondations passées, pompe de relevage, traces d'humidité). Pour un appartement
   en étage ou une maison sur dalle, rien.
5. **Toujours inconnu.** Si ce sous-sol a été inondé, la profondeur de la nappe, la fréquence.
6. **Restitution (conditionnelle).** À retenir : « Secteur classé sensible aux inondations de cave par
   remontée de nappe (fiabilité forte). » Pour votre projet : « Utile si vous comptez utiliser la cave
   ou aménager le sous-sol. » À vérifier : « Les épisodes passés, auprès du vendeur et des voisins. »

## S4. Immeuble près d'un réseau de chaleur · Grenoble, Metz, Paris, La Rochelle

1. **Déjà su.** Le DPE du logement (et ses énergies de chauffage quand il existe), l'audit éventuel.
2. **Ignoré.** Qu'un réseau de chaleur passe à proximité, son taux d'énergies renouvelables, l'existence
   d'une obligation de raccordement (PDP).
3. **Apport.** Grenoble centre : réseau à **72 m**, 80,9 % d'EnR&R ; Metz : **8 m**, en PDP ; Paris
   (Hôtel de Ville) : 0 m, en PDP ; La Rochelle centre : réseau à **501 m**, au-delà du seuil.
4. **Ce qui change.** Pour une passoire à rénover, une option de chauffage que le DPE ne propose pas ; en
   copropriété, une question au syndic (l'immeuble est-il raccordé ? un raccordement est-il voté ?).
5. **Toujours inconnu.** La faisabilité et le coût du raccordement (le gestionnaire seul peut le dire,
   selon la documentation de l'API).
6. **Restitution.** À retenir : « Un réseau de chaleur passe à 72 m (80 % d'énergies renouvelables). »
   Pour votre projet : « Une piste pour remplacer un chauffage énergivore. » À vérifier : « Auprès du
   syndic et du gestionnaire du réseau. »

## S5. Télétravail avec connectivité incertaine · non démontré

Aucune donnée ARCEP n'a été lue à l'adresse (pas d'API ; fichier national de 835 Mo par trimestre). Le
scénario est plausible (bourg rural, Projet télétravail) mais **non démontré** dans cet audit.
Restitution envisageable plus tard : « L'immeuble est déclaré raccordable à la fibre par N opérateurs
(ARCEP, T2 2026) » ; à vérifier : « un test d'éligibilité chez un opérateur avant l'offre ».

## S6. Terrain ou extension soumis à une prescription · Goussainville (PEB C), Agel (Natura 2000)

1. **Déjà su.** Servitudes patrimoniales (ABF) et, si FUT-81 fusionne, zone du PLU et prescriptions.
2. **Ignoré.** Les contraintes du PEB ; le statut Natura 2000 du terrain.
3. **Apport.** Goussainville : zone C (constructibilité de logements nouveaux restreinte) ; Agel : point
   dans le site Natura 2000 « Les Causses du Minervois » et en zone OLD.
4. **Ce qui change.** Pour un Projet de construction, d'extension ou de division : une vérification
   d'urbanisme supplémentaire (mairie, évaluation d'incidences Natura 2000 pour certains travaux).
5. **Toujours inconnu.** Ce qui sera autorisé : seul un certificat d'urbanisme ou une instruction le dit.
6. **Restitution.** À retenir : « Terrain dans la zone C du PEB de Roissy. » Pour votre projet :
   « Créer un logement supplémentaire y est en principe exclu. » À vérifier : « Un certificat
   d'urbanisme avant de compter sur une division. »

## S7. Rénovation ou panneaux solaires · Metz, Marseille, Guéret

1. **Déjà su.** Le rayonnement solaire communal (ERA5) ; le DPE et l'audit.
2. **Ignoré.** L'ordre de grandeur de production d'un kWc au point ; le potentiel du toit.
3. **Apport.** PVGIS (SARAH-3) : **1 113** kWh par kWc et par an à Metz, **1 204** à Guéret, **1 602** à
   Marseille. Le potentiel « méthode simplifiée » du bâti existe pour 49 millions de bâtiments, mais au
   point BAN, 2 à 4 bâtiments sont candidats.
4. **Ce qui change.** Un écart de 44 % de production entre Metz et Marseille pèse sur la rentabilité d'un
   Projet photovoltaïque ; il ne change pas le choix d'un lieu de vie.
5. **Toujours inconnu.** L'orientation et l'ombrage du toit, la structure, les contraintes ABF.
6. **Restitution.** « Ordre de grandeur : 1 kWc produirait environ 1 100 kWh par an ici (estimation
   PVGIS, toit bien orienté, sans ombrage). À vérifier : une étude d'installateur. »

## S8. Cadre de vie proche d'espaces protégés · Saintes-Maries-de-la-Mer, communes en PNR

1. **Déjà su.** Le caractère naturel perçu (OSO dans 15 km) ; les espaces verts utilisables autour.
2. **Ignoré.** Les statuts : Natura 2000, PNR, réserves, Ramsar.
3. **Apport.** Saintes-Maries : Natura 2000 (SIC et ZPS « Camargue »), PNR de Camargue, site Ramsar,
   ZNIEFF 2. Communes tirées : PNR du Verdon, de Scarpe-Escaut, des Marais du Cotentin.
4. **Ce qui change.** Pour un Projet « vivre au contact de la nature », un repère identitaire et
   vérifiable ; pour des travaux, des règles possibles (charte de PNR, évaluation d'incidences).
5. **Toujours inconnu.** La biodiversité réellement présente, l'accès au public, la gêne éventuelle
   (moustiques en Camargue, fréquentation touristique).
6. **Restitution.** « Dans le Parc naturel régional de Camargue, à proximité de sites Natura 2000. »
   Jamais « terrain protégé » sans intersection significative de la parcelle.
