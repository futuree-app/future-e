# Feuille d'exécution, 19 septembre 2026

Une page. Elle remplace la liste de 25 chantiers de la veille
(`recherches/2026-09-19-veille-strategique.md`), qui reste un registre d'opportunités.

**Le critère qui classe :** une affirmation fausse dans un produit vendu passe avant une panne
possible, qui passe avant une donnée manquante, qui passe avant une source nouvelle.

## 1. Intégrité de ce qui est affirmé — EN COURS

Ce que le produit dit aujourd'hui et qui n'est pas établi. Touche le gratuit et le payé.

- **Le détenteur du diagnostic.** Le prompt de `synthesize-logement` donne en exemple « celui de ce
  logement précis existe, et le vendeur le détient ». 3 des 6 synthèses payées sans diagnostic
  attribué l'ont recopiée. Deux affirmations non établies : qu'un diagnostic de ce logement existe
  (il n'est obligatoire qu'à la vente ou à la location), et qu'il y a un vendeur (la situation
  n'est pas connue). Le commentaire de `decision-fact.ts` porte la même hypothèse.
  Le moteur déterministe, lui, est juste : la règle dit « des diagnostics existent à cette adresse,
  aucun n'a pu être rattaché à ce logement », et les gestes existent en 4 variantes de situation.
- **Les priorités inventées.** Le parse ajoute des critères que la personne n'a pas exprimés
  (2 essais sur 5 sur « j'ai peur des moustiques tigres et des tiques » : étés plus frais,
  agriculture intensive). Ce ne sont pas des mots, ce sont les communes proposées qui changent.
- **Le tiroir « affectif ».** Toute préoccupation qui n'est ni une école ni de la culture y tombe
  et déclenche « le caractère d'un lieu relève d'une expérience personnelle », y compris pour la
  potabilité de l'eau (3 essais sur 3) et les moustiques (5 sur 5).
- **La posture inscrite d'office.** `posture` vaut `residence` par défaut et n'est jamais écrite
  par le parcours. Cf. `/memory/project_usage_reel_septembre.md`.

## 2. Migration du géocodeur

L'ancien point d'entrée (`api-adresse.data.gouv.fr`, déprécié) sert encore 8 fichiers, dont
`src/lib/ban.ts` et le parcours d'achat. S'il ferme, personne ne peut plus acheter.

Un adaptateur unique, **avec deux fonctions distinctes derrière** : `geocode-place.ts` utilise les
deux services délibérément, parce que l'ancien ne connaît que des adresses quand la Géoplateforme
sait trouver une gare ou un hôpital. Fusionner les deux casserait les contraintes « à 30 minutes
de la gare Matabiau ».

## 3. Comprendre le lecteur

6 dossiers payés sur 14 n'ont ni projet ni situation déclarée. La chaîne du moat commence par le
projet : sans lui, le premier maillon manque. Demander la situation dans le parcours d'achat,
faire remonter les priorités et leur état d'examen au-dessus du rapport (la table existe,
`criteria-registry.ts`, elle sort en petits caractères pâles en fin de conclusion).

## 4. Prouver la différence avant paiement

Le socle existe (`dossier-couverture-attendue.ts`, l'écran dit le manque avant ce qui reste).
Y montrer la façon de raisonner, pas la liste des bases : un fait, ce qu'il change pour ce projet,
ce qu'il reste à vérifier. Et distinguer « un diagnostic trouvé à l'adresse » de « un diagnostic
attribuable à ce logement », que l'écran confond aujourd'hui.

## 5. Version et date des couches réglementaires dans les preuves

Les argiles viennent de l'API Géorisques, donc la version servie est courante. Elle n'est affichée
nulle part.

## 6. Relire les 5 compositions

`assertCompositionsValid` vérifie les identifiants, les sections, les absorptions et la longueur
des libellés, jamais le sens. 5 compositions existent, 2 recopient le texte d'un fait déjà validé :
3 phrases écrites à la main à relire. Pas de validateur automatique, on ne vérifie pas la vérité
d'une phrase par du code.

## 7. Ensuite seulement : un premier croisement

La chaleur reste le meilleur laboratoire. Elle doit fonctionner **sans** la morphologie urbaine
(couverte sur 93 territoires de plus de 50 000 habitants, muette ailleurs), celle-ci venant en
enrichissement.

## Ce qui attend dans le registre

PFAS, LCZ, DRIAS-Eau, SISPEA, BatEnR, LiDAR, EGMS, Copernicus, éclairage nocturne, cours d'eau,
copropriété, GPU, trait de côte, OLD, bruit CBS. Sourcés et datés dans la veille du 19/09.
