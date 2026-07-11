# Arbitrage : le moat est un assemblage ; la largeur vit en haut de tunnel, le payant vend la décision

- **Date** : 2026-07-11, tranché par le porteur après un débat contradictoire en trois temps
  (réponse d'un modèle de raisonnement externe, réfutation point par point par Claude, réponse
  révisée du modèle avec concessions explicites).
- **Source** : conversation stratégique du 2026-07-11 (non versionnée), chiffres INSEE vérifiés
  (5,9 M de déménagements en 2023, dont 3,94 M changeant de commune, Insee Première n° 2073).
  Prolonge `recurrence-b2c-episodique-pas-mensuelle.md` et `ADR-0008`.

## Le point de départ, accepté par tous

**futur•e n'a pas de moat produit, et n'en aura pas.** Toutes ses sources sont publiques et
ouvertes (Météo-France, Géorisques, DVF, ADEME, INSEE, GPU, ANIL) : la session de mesures du
9-11 juillet a montré empiriquement que chaque brique s'extrait en quelques appels d'API.
L'intégration, la doctrine éditoriale, la voix et le grain adresse sont une **avance d'exécution
de 12 à 18 mois**, pas une protection structurelle. En années 0-2, rien ne protège futur•e :
l'avance doit être convertie en actif cumulatif avant d'être copiée.

## La décision : le moat est un assemblage asymétrique

Aucune protection unique n'existe. Trois mécanismes, chacun contre un adversaire différent :

1. **Contre les nouveaux entrants (dont startups financées) : la découvrabilité accumulée.**
   Position organique en recherche + présence dans les citations des modèles génératifs,
   construites par des milliers de pages rigoureuses au grain commune et adresse, sur 2-3 ans.
   L'actif n'est pas « 36 000 pages » mais l'ensemble : couverture historique des requêtes, URLs
   stables indexées, backlinks et citations, historique Search Console, recherches de marque.
   L'argent accélère une reconstruction ; il n'achète pas rétroactivement deux années d'historique.
2. **Contre les incumbents (portails immobiliers, banques, assureurs) : le conflit d'intérêts.**
   Un portail veut faciliter la transaction ; il ne publiera jamais « cette adresse est en
   périmètre ABF, votre isolation sera contrainte » sur une annonce à vendre. Ce moat est
   **structurel** (leur modèle économique l'interdit), pas réputationnel.
3. **Contre le capital : la petitesse du marché.** Estimation d'ordre de grandeur (modèle, pas
   mesure) : 50 000 à 150 000 achats potentiels/an pour toute la catégorie à 30-80 €, soit
   quelques M€ à ~10 M€/an. Trop petit pour attirer un concurrent financé sérieux, assez grand
   pour faire vivre une petite entreprise rentable. La petitesse EST une protection.

**L'autorité de tiers de confiance** (indépendance démontrée, traçabilité, corrections publiques,
cohérence quand elle coûte) n'est PAS le moat initial : c'est le **facteur de durabilité** de la
distribution, qui commence à composer avec elle en années 3-5.

## La largeur : haut de tunnel, pas produit payant symétrique

La critique acceptée : « six modules symétriques et sophistiqués » poussent à remplir
artificiellement chaque catégorie et fabriquent un produit qui « sait un peu tout mais n'est
l'autorité incontestable sur aucune décision précise ». La règle retenue :

> **Réduire le moment de décision, pas les domaines de données.**
> **Couper l'encyclopédie comme produit lourd, pas comme surface gratuite.**

- La **largeur** (climat, santé environnementale, logement, ~28 critères) reste dans le moteur de
  données et dans les **pages publiques gratuites** : elle maximise la surface de découverte
  (SEO + GEO) et sert l'audience habitant (cf. arbitrage récurrence). C'est le carburant du moat n° 1.
- Le **payant** vend la personnalisation et la décision : hiérarchie, incompatibilités, compromis
  structurants, différences matérielles entre options, inconnues, vérifications avant engagement.
  Il ne vend jamais la donnée vue gratuitement : il vend son croisement avec le projet du lecteur.
- **À arrêter** : nouveaux critères sans demande identifiable ; modules artificiellement
  équilibrés ; récits sophistiqués pour chaque dimension ; pages d'adresse massives et
  interchangeables (doorway) ; fonctionnalités périphériques sans rôle d'acquisition ou de
  conversion ; considérer la prose générée comme le produit (la conclusion structurée et auditable
  d'abord, le texte comme interface ensuite).

## La doctrine éditoriale, reformulée (adoptée)

L'ancienne formule « décrire, jamais juger » risque l'encyclopédie. La nouvelle :

> **Ne jamais juger un territoire dans l'absolu. Juger explicitement son adéquation à un projet
> donné et la solidité des preuves disponibles.**

futur•e ne dit pas qu'une ville est bonne ou mauvaise ; il dit ce qui est matériel ou accessoire,
ce qui doit remonter en premier, ce qui est incompatible avec CE projet, ce qui distingue vraiment
deux options, et ce qui reste trop incertain pour conclure.

## Les deux tests de falsification (à exécuter au lancement)

1. **Test habitant (proposé par le modèle externe).** Sur 1 000 utilisateurs qualifiés déclarant
   n'avoir AUCUN déménagement ou achat prévu sous 12 mois : si ≥ 3 % achètent spontanément le
   rapport large à 14 € sous 14 jours (sans remise ni relance), l'exploration large mérite de
   rester un produit payant central. En dessous, elle reste gratuite en haut de tunnel.
2. **Test miroir (ajouté par Claude, indispensable).** Le taux d'achat du dossier de décision chez
   ceux qui ONT un projet engagé (2-5 options réelles). Sans ce second bras, un échec du premier
   test ne départage pas « rapport large faible » de « segment non urgent faible ».

Réserve : réunir 1 000 utilisateurs qualifiés est en soi une campagne d'acquisition ; ces tests
se lisent après le lancement, pas avant.

## Ce que cet arbitrage ne tranche PAS (chantier ouvert 2026-07-11)

**L'architecture du rapport payant.** Si le payant n'est plus « six modules symétriques », sa
forme reste à concevoir : divergence Researcher lancée
(`docs/rapports-agents/researcher/2026-07-11-architecture-rapport-payant.md`) + réflexion externe
en parallèle. Contrainte posée par le porteur : les modules Territoire et Logement existants sont
**l'usine** (données, briques, libs, doctrine) ; ce qui est questionné est la **chaîne
d'assemblage de la sortie**, jamais l'usine. Toute alternative doit dire ce qu'elle réutilise.

## Ce qui rouvrirait le sujet

- Le test habitant réussi (≥ 3 %) : le rapport large redevient un produit payant central.
- Un incumbent qui accepte le conflit d'intérêts (publie le défavorable sur ses annonces) : le
  moat n° 2 tombe, réévaluer.
- Une preuve que la découvrabilité ne compose pas (18 mois de publication sans progression de
  position ni citation) : le moat n° 1 tombe, il ne reste que la course, pivoter vers le canal
  qui reste.
