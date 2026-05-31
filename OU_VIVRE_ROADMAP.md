# /ou-vivre — backlog produit (post-V1)

Sujets ouverts après la première passe UX du Comparateur de vie. Rien ici n'est
bloquant pour la V1 ; ce sont les chantiers de confiance / crédibilité repérés à
l'usage réel. Tenu à jour au fil des passes.

Dernière mise à jour : 2026-05-31.

## 1. Signal « bassin d'emploi » (chantier V2, à instruire)

Constat à l'usage : un utilisateur qui précise une contrainte d'emploi (« ma
conjointe doit retrouver un poste de gestionnaire de paie ») voit ressortir des
territoires comme Bastia et lève un sourcil, même si le moteur n'est pas faux. Il
ressent qu'un pan important de son projet n'a pas pesé.

État V1 :
- Le parse **entend** l'emploi : il le met dans la reformulation et le sort en
  `ambiguities`. Le gate de confirmation l'affiche donc déjà.
- Mais le moteur **ne score pas** l'emploi (exclu du périmètre V1, cf. prompt
  parse). La reformulation dit « à prendre en compte », ce qui sur-engage
  légèrement. Atténué en V1 par une ligne de cadrage honnête au gate
  (« le comparateur pèse climat/environnement/cadre de vie ; emploi, écoles, prix
  se lisent dans le rapport »).

Doctrine à trancher en V2 : l'emploi est-il une question de **raisons** (« où
regarder », comparateur) ou de **conséquences** (« votre secteur ici », module
*métier* du rapport) ? Position actuelle : plutôt conséquences, donc rapport. Un
signal emploi au niveau comparateur recouperait le module métier.

Si on l'instruit quand même comme **signal de viabilité** (pas un score fin) :
- source candidate : zones d'emploi INSEE, taux d'emploi / densité d'emplois,
  éventuellement dynamisme par grand secteur ;
- forme : préférence souple `viabilite_emploi` ou filtre de plancher, PAS une
  promesse « votre métier ici » (ça reste le rapport) ;
- impact : nouvelle clé `PREFERENCE_KEYS` + scoring → **touche le moteur gelé
  V1.6**, donc décision de dégel explicite requise.

## 2. Diversité des résultats — RÉSOLU (dégel moteur, 2026-05-31)

Décision prise : dégeler légèrement le moteur pour garantir 3 territoires
réellement différents. Implémenté dans `matchProjects` (`comparateur-vie.ts`) :
au lieu de prendre les 5 meilleurs scores bruts (souvent agglomérés), on étale
sur **tout le vivier** de candidats : meilleure par région d'abord, puis
complétion par départements absents, puis sans contrainte. Le n°1 reste le
meilleur score national ; les rangs 2-3 favorisent des régions distinctes (perte
de quelques points assumée : différence > optimalité brute).

Vérifié sur les 4 scénarios : 3 régions distinctes à chaque fois, rangs 2-3 à
quelques points du n°1 (ex. S1 87/81/80). Le cas « 2 cartes » a disparu.

La dé-dup côté client (`diversify()` dans `OuVivreClient.tsx`) est conservée comme
filet de sécurité (région puis département) ; elle est désormais quasi inerte
puisque le moteur livre déjà des résultats étalés.

## 3. Caractérisations hors contexte scellé (noté, à surveiller)

La synthèse et AskFuture **inventent parfois** de la différenciation absente des
données du moteur, en puisant dans la connaissance géographique du modèle
(ex. « Istres, profil plus industriel », « douceur occitane »). Double tranchant :
ça enrichit, mais c'est non vérifié et ça peut contredire le moteur (Istres donné
à 97 % sans compromis). La dé-dup géo réduit le besoin d'inventer (3 lieux
réellement distincts se différencient sur du réel : Atlantique / Manche /
Méditerranée). À surveiller ; durcir le prompt si ça dérive.

## 4. Ambiguïtés sémantiques « doux / calme / ensoleillé » (noté)

Décalage entre le sens moteur et l'intuition utilisateur. Cas vu : `douceur_climat`
= hivers océaniques tempérés → Brest/Caen ressortent pour « un territoire doux »,
alors que l'utilisateur en retraite imagine plutôt la Méditerranée. Le moteur a
raison techniquement mais se bat contre l'intuition (AskFuture doit même se
défendre : « ce n'est pas un climat méditerranéen »). À retravailler : soit la
pondération de `douceur_climat`, soit la pédagogie côté reformulation. Idem
« calme » (une ville de 60 000 hab. notée très calme surprend) et « ensoleillé ».

## 5. AskFuture comparateur — dosage des réponses (à traiter, parké)

Retour après usage réel : positionnement bon, chips efficaces, mais réponses
encore trop longues, elles virent à la mini-analyse. Risque : concurrencer le
rapport. À reprendre (le sujet est explicitement reporté par le user).

Cible quand on y reviendra (route `/api/comparateur-vie/ask`, prompt + schema) :
- **Rôle** : guide de lecture, pas analyse. Expliquer le classement, pointer LE
  compromis principal, donner confiance, orienter vers le rapport. Pas : analyser
  le territoire, convaincre, remplacer le rapport.
- **Longueur** : réduire de 40-50 % (aujourd'hui 120-180 mots → viser ~70-100,
  un seul paragraphe). Une idée principale + un compromis principal + une phrase
  de transition optionnelle vers le rapport.
- **Anti-contradiction** : ne jamais dire « pas de compromis majeur » puis lister
  des compromis. Identifier UN compromis principal et s'y tenir.
- Forme de référence (donnée par le user) : « Narbonne ressort en premier car elle
  offre le meilleur équilibre entre accès aux soins, vie locale et proximité de la
  mer. Quimper est plus maritime mais moins favorable sur l'offre médicale. Hyères
  reste intermédiaire. Le rapport permet ensuite de vérifier si ce compromis
  correspond réellement à votre situation. »
- Principe : donner ENVIE de comprendre davantage, pas livrer déjà l'essentiel.

## 6. Ancres géographiques — V1 LIVRÉE (2026-06-01)

Le moteur passe d'un système de préférences à un système de contraintes :
l'ancre définit l'espace de recherche, les préférences ordonnent dedans. Voir
`ANCRES_GEOGRAPHIQUES.md` (section « Implémenté ») pour le détail.

Couvert : macro-zones vernaculaires (le Sud = grand quart sud), façades maritimes
nommées, massifs nommés, exclusions (quitter Paris). Sur-contrainte détectée et
annoncée honnêtement, sans relâche automatique.

Restent notées comme catégories futures (non implémentées) :
- gradient de force d'ancre (dure / préférée / inspiration) ;
- ancres relationnelles (« à 2 h de Paris ») : trou de données isochrones ;
- montagne générique sans nom : trou de données altitude ;
- ancres relatives (« plus au sud ») : pas de résidence dans le comparateur anonyme.

## Fait en V1 (pour mémoire)

- Rythme séquentiel : parse → gate « ce qu'on a compris » (OK / Affiner) → match
  + synthèse. Sépare « m'a compris » de « réfléchit ».
- Ton de la synthèse adouci (simple, direct, moins littéraire) côté prompt
  synthesize. Amélioré, pas parfaitement nettoyé (une antithèse résiduelle vue).
- Score % retiré → palier qualitatif.
- CTA « Découvrir ce territoire · Rapport complet interactif · 14 € ».
- CTA « Comparer ces territoires » élevé en panneau (pont vers le Pack Décision).
- Gate restructuré : ✓ Ce que nous avons compris / ✓ Les critères identifiés /
  ⚠ Ce qui reste ouvert (+ bouton « Modifier ma demande »). Les ambiguïtés sont
  reformulées en hypothèses déclaratives (via `topic`), jamais en questions, tant
  qu'il n'existe pas de mécanisme d'affinage interactif (sujet V2 : vraies
  questions interactives au gate).
- Synthèse : n'attribue plus à l'utilisateur les critères déduits (ex. ne pas être
  isolé pour une famille) ; ils sont présentés comme la lecture du produit.
