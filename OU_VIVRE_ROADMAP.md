# /ou-vivre — backlog produit (post-V1)

Sujets ouverts après la première passe UX du Comparateur de vie. Rien ici n'est
bloquant pour la V1 ; ce sont les chantiers de confiance / crédibilité repérés à
l'usage réel. Tenu à jour au fil des passes.

Dernière mise à jour : 2026-06-05.

## 1. Signal « bassin d'emploi » — LIVRÉ (dégel moteur, 2026-06-01)

Premier signal **économique** du comparateur. Le moteur ne répond plus seulement à
une question territoriale ou climatique : il pèse aussi la crédibilité d'un projet
de vie actif. Tranché « signal de viabilité » (taille + diversité du bassin), pas
matching métier : le « ce que le climat fait à votre secteur » reste au rapport
(module Métier).

Constat fondateur : un utilisateur précisant une contrainte d'emploi (« ma conjointe
doit retrouver un poste de gestionnaire de paie ») voyait ressortir Bastia et levait
un sourcil. Désormais le bassin d'emploi est pesé et ce cas produit un changement
visible (les bassins plus profonds et diversifiés remontent).

Données (lot A, commit data séparé) :
- maille **zone d'emploi INSEE ZE2020** (306 zones), héritée par commune ;
- source **Flores A38 fin 2024** (effectifs salariés, niveau ZE pour éviter le secret
  statistique communal) + composition communale ZE2020 ; caches versionnés
  (`communes-emploi.json`, `ze-emploi-na38.json`), brut INSEE gitignoré ;
- **taille** = courbe saturante log (anti-biais métropole) ; **diversite** = entropie
  A38 étirée p5-p95. Salarié uniquement (limite assumée).

Moteur (lot B) : clé `viabilite_emploi` = `0.6·taille + 0.4·diversite`. Modèle hybride :
- emploi **signalé** par le parse → préférence poids 2 ;
- projet **hors-emploi** (retraite, télétravail total) → baseline emploi supprimée,
  jamais pénalisé ;
- emploi **non mentionné** → partage du plancher de réalisme existant
  (`eviter_isolement` 0,5 + `viabilite_emploi` 0,5), budget de viabilité implicite
  **inchangé** vs V1 (pas de préférence universelle ajoutée vers les métropoles).
- Jamais un filtre dur. Firewall qualitatif préservé (« un bassin d'emploi dynamique »).

Cadrage gate mis à jour : « le comparateur pèse climat, cadre de vie et vitalité du
bassin d'emploi ; le détail du métier reste au rapport ».

Vérifié : non-régression climat / Sud, retraite et télétravail non pénalisés, cas
fondateur (conjointe gestionnaire de paie) à effet visible, Corse qui recule sans
être éliminée.

## 1bis. Pression climatique sur l'économie locale — LIVRÉ (2026-06-01)

Second signal **économique**, distinct de la viabilité (on ne contamine pas un signal
robuste taille+diversité par un signal interprétatif). **Narratif, non scoré, aucun
impact sur le tri** : une note « À noter » prudente quand un territoire recommandé
dépend d'une activité sensible à un aléa climatique.

- Données : `ze-emploi-na38.json` (parts A38 par ZE) + percentiles DRIAS + altitude.
- Couples : `AZ` (agri+forêt, sécheresse/feu, feu réservé aux percentiles ≥ 80) ;
  `IZ` (proxy tourisme : estival×chaleur en plaine, montagne×neige en altitude, type
  classé par médiane d'altitude de la ZE, proxy neige prudent à plancher).
- Seuil de **dépendance 8 %** : flague seulement si le secteur sensible pèse vraiment
  (sinon signal climatique déguisé). Paliers faible/modérée/marquée par percentiles ;
  signal rare (596 communes / 34 788).
- Garde-fous : jamais « résilience / fragile / va décliner / verdict » ; capacité
  d'adaptation explicitement non mesurée. Synthèse et AskFuture prudents (vérifié réel).

Le moteur répond désormais à trois questions : territoriale/climatique, viabilité du
projet de vie (bassin d'emploi), et pression climatique sur l'économie locale.
Conception et réalités de la donnée : `PRESSION_CLIMATIQUE_ECONOMIE.md` (section
« Implémenté V1 »). Hors V1 : dépendance forêt comme sujet propre (source dédiée),
V2 éventuelle d'un signal scoré après épreuve du narratif.

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

## 7. Comparateur — teaser vers la comparaison complète (plan payant) — À CONCEVOIR

Sur la page comparateur (CompareView, le révélateur d'arbitrages), donner envie
d'aller plus loin : entrer en profondeur dans la **comparaison complète** des trois
territoires, réservée au plan payant (Pack Décision). Aujourd'hui CompareView
révèle l'arbitrage (identité / 2 forces / 1 compromis, zéro chiffre) puis s'arrête ;
il manque le pont qui transforme le doute intelligent en envie de creuser.

À traiter **dans un deuxième temps**, une fois la comparaison complète construite :
on veut d'abord voir à quoi elle ressemble (quelles dimensions côte à côte, quelle
forme) avant de dessiner le teaser qui y mène. Le teaser doit donner envie sans
livrer l'essentiel (même principe que le firewall AskFuture / la synthèse). Cohérent
avec le placeholder Pack Décision déjà posé (« comparez les 3 territoires sur
l'ensemble des critères, posez vos questions, explorez jusqu'à 3 nouvelles pistes »).

Ordre : 1) construire la comparaison complète (vue plan payant) ; 2) en déduire le
teaser sur CompareView.

## 8. Héritage industriel (sols pollués) — LIVRÉ (signal narratif non scoré, 2026-06-05)

Implémenté comme **signal NARRATIF, NON scoré** (PAS un critère), sur branche
`feat/heritage-industriel` (non mergé tant que « push sur main » n'est pas dit). Spec
`docs/superpowers/specs/2026-06-05-heritage-industriel-design.md`, plan
`docs/superpowers/plans/2026-06-05-heritage-industriel.md`.

Doctrine fondatrice tranchée : **ICPE/Seveso = industrie active (scoré) vs SSP/ex-BASOL =
héritage (narratif)**, jamais fondus. Scorer l'héritage pénaliserait les ports / bassins
ouvriers / villes anciennes = biais social refusé. Donc gate par intention exprimée
(`heritageIntent` au parse, comme l'intention littorale), surfacé en synthèse (frontière
`calme_sonore`) + AskFuture, jamais dans le tri.

- **Source** : API Géorisques `/api/v1/ssp`, sous-clé `instructions` UNIQUEMENT (ex-BASOL curé) ;
  `casias` banni (bruit), SIS/Cartofriches/IREP réservés au rapport. Index national 18 % des
  communes à **R=3 km** (figé par sonde, gate porteur ; 5 km réservé au rapport détaillé).
- **Récit** documentaire au passé, activité nommée (usine à gaz / hydrocarbures / station-service /
  métallurgie / mine / chimie / décharge) + repli générique, « parmi d'autres » au pluriel. JAMAIS
  « pollué/risque/toxique » ni chiffre au gratuit (état de gestion → rapport).
- **Témoin obligatoire validé** : Marcel-Paul (La Rochelle) → « une ancienne usine à gaz … recensée
  à proximité ». 96 communes (0,3 %) en 500 API persistant = `null` (défaut sûr).
- **Évolution future notée** : filtre opt-in binaire NON scoré (« voir/éviter »), module rapport
  payant (état, substances, densité, SIS, 5 km).

Cf. [[exposition_industrielle]], [[idee_sante_environnementale]].

## 9. Pages paywall « Le rapport complet de… » — à refaire

Refonte des pages paywall du rapport (« Le rapport complet de {commune} »).
Objectif : convertir l'envie née sur le comparateur / les fiches en achat. À cadrer
avec le porteur (contenu, preuve de valeur, prix déjà affiché 14 €, articulation
avec le Pack Décision et le teaser comparaison complète du point 7).

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
