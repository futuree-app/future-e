# Bilan du lot 2026-10-lot-01 (dix communes)

Arrêté le 15/10/2026. **Rien n'est publié ni fusionné.** « Prêt à relire » veut dire que les étapes automatiques sont finies, pas que l'article est validé : la relecture humaine reste la seule autorisation de publication.

## État des dix communes

Lecture : `http://localhost:3155/dev/lot` (serveur de développement), un lien « Lire l'article » par commune ; rendu complet (sections A à F), dossier, complément, contrôles et relecture à côté.

| Commune | État | Version lue | Corrections automatiques | Retouches à la main |
|---|---|---|---|---|
| Poitiers | prêt à relire | `edition.md` | 1 | lieu de travail allégé, conclusion |
| Angers | prêt à relire | `edition.md` | 1 | inventaire des secteurs réduit, vacances de Toussaint retirées |
| Lorient | prêt à relire | `edition.md` | 1 | transition, affirmation générale, annonce de réextraction |
| Vannes | prêt à relire | `edition.md` | 1 | « à vol d'oiseau », chiffre isolé, exemples secondaires, annonce de mise à jour |
| Saint-Nazaire | prêt à relire | `edition.md` | 1 | nom du réseau (Ycéo), surcoût, exemples, précaution, possession, réextraction, chapeau |
| Cholet | prêt à relire | `correction.md` | 1 | aucune |
| La Roche-sur-Yon | prêt à relire | `edition.md` | 1 | conclusion |
| Saint-Brieuc | prêt à relire | `correction.md` | 1 | aucune |
| Tours | prêt à relire | `correction.md` | 1 | aucune |
| Le Mans | prêt à relire | `edition.md` | 0 (aucune anomalie bloquante) | conclusion |

Chaque retouche à la main est tracée dans la section F de `edition.md` (avant, après, raison) ; les versions générées (`redaction.md`, `correction.md`) sont conservées. Après tout cela, le contrôle déterministe ne relève aucune anomalie sur les dix articles.

## Erreurs relevées, par nature

**Erreurs factuelles ou de raisonnement (signalées « bloquantes » par la relecture, puis corrigées une fois)** : 17 sur les dix articles, de 0 (Le Mans) à 3 (Vannes).
- Raisonnement (10) : généralisation contredite par d'autres secteurs (« ailleurs, c'est beaucoup plus rare »), proximité des équipements présentée comme devant réduire la voiture, pratique observée transformée en possibilité ou en cause, usage des transports en commun vers deux communes présenté comme une desserte générale.
- Conclusion (4) : « la place de la voiture dans le secteur », « l'équipement automobile du secteur », inventaire du type « vous y verrez ». **Cause dans la chaîne** : un exemple de formulation du tableau des capacités, recopié ; corrigé le 15/10/2026.
- Population (1) : « y vont travailler » lu comme un lieu de travail (Angers).
- Arrondis (2) : hausse du carburant (calculée sur prix non arrondis) différente d'un centime de la différence des prix affichés (Saint-Nazaire, et Cholet en « à revoir »). **Cause dans la chaîne** : le dossier ne prévenait pas ; précaution ajoutée le 15/10/2026.

**Erreur documentaire** : le réseau de Saint-Nazaire appelé « STRAN » d'après un champ « offre » périmé de transport.data.gouv.fr ; l'intitulé du jeu, l'agence du GTFS et le site officiel portent « Ycéo ». Corrigé dans la règle d'identité et dans l'article.

**Faux positifs du contrôle déterministe (défauts de l'outil, corrigés)** : dates prises pour des valeurs, bornes de la méthode, identifiants écrits sans accents graves, montants en centimes. Avant correction, ils ont déclenché à tort une partie des corrections de Poitiers et d'Angers ; les correcteurs les ont écartés en le justifiant (section E).

**Retouches éditoriales (préférences de lecture, pas des erreurs)** : sélection des chiffres, transitions, annonces de production dans le texte (réextraction, « avant publication »), demandées pour les cinq premiers articles.

## Corrigé dans la chaîne, et ce qui reste propre à un article

Dans la chaîne (`outil/`, `redaction/`), valable pour les lots suivants :
- **Quota** : refus reconnu au message (désormais conservé) ou à sa signature (erreur sans aucun jeton) ; tout le lot est suspendu au premier refus, état « suspendu par quota » distinct d'une erreur ; un refus n'est pas compté comme tentative ; la reprise ne fait que les étapes manquantes. Vérifié sur les cinq réponses enregistrées le 14/10 (reconnues) et sur les quinze vrais appels (aucun pris pour un refus) ; aucun appel refusé provoqué.
- **Identité des transports** : nom commercial, autorité organisatrice et site distingués ; le nom n'est retenu que confirmé par deux sources ; l'exploitant n'est jamais nommé ; collectes conservées.
- **Consignes internes** : la réextraction ne figure plus dans le statut des faits carburant, seulement dans les vérifications ; le prompt et la relecture excluent toute consigne de production du texte.
- **Sélection** : la consigne existante dit désormais de retenir les exemples qui font avancer la question et de laisser le détail aux visuels ; aucun quota de chiffres.
- **Relecture calibrée** : erreur ou ambiguïté plausible pour un lecteur ordinaire ; un conseil pratique n'est pas une promesse, une liaison n'est pas une cause.
- **Conclusion** : exemples de formulation retirés du tableau des capacités.
- **Arrondis du carburant** : précaution dans les limites des faits carburant.
- **Contrôle** : dates, méthode, identifiants nus, centimes.

Propre à un article, à regarder en relecture :
- **Titres** : Cholet et La Roche-sur-Yon portent le même titre (« … : où la voiture pèse moins sur le trajet du travail »).
- **Cholet** : chapeau « environ 75 centimes » et prix 1,55 → 2,31 € dans le corps (relevé « à revoir », non corrigé).
- **Angers** : horaires du tram sans période de validité (la source ne la donne pas).
- **Noms de secteurs** : libellés d'IRIS cités comme noms de quartiers, partout.

Les cinq dernières communes ont été rédigées avant la précaution sur les arrondis et la correction des exemples de conclusion : la première est rattrapée par la relecture et à la main, la seconde par les retouches de La Roche-sur-Yon et du Mans.

## Durées et consommation (mesures)

| Étape | Appels | Durée cumulée mesurée | « Équivalent API » rapporté |
|---|---:|---:|---:|
| Préparation (gratuite) | — | 29 à 46 s par commune | — |
| Collecte (6 réseaux joignables + Poitiers) | 7 | 4,2 min | 0,31 $ |
| Rédaction | 10 réalisés + 5 refusés pour quota (0 jeton) | 27,0 min | 6,43 $ |
| Relecture | 10 | 12,4 min | 5,01 $ |
| Correction | 9 | 12,1 min | 5,10 $ |
| **Total** | **36 appels utiles** | **55,8 min** | **16,86 $** |

Hors tableau : un appel de rédaction pour Angers interrompu volontairement le 14/10 (lancement parti avant la collecte), non mesuré. Retouches à la main et vérifications de cette reprise : non chronométrées (estimation : environ une heure pour les sept articles retouchés, hors temps d'attente).

L'« équivalent API » est un calcul local de Claude Code (jetons × tarif public) : **rien n'a été facturé**, et ce n'est **pas** une mesure du quota de l'abonnement Pro, qui n'est pas exposé. La seule limite rencontrée : un refus de quota le 14/10 à 15 h 19 UTC, après 22 appels réalisés (dont 7 collectes), sans compter l’appel interrompu d’Angers ; la reprise du 14/10 à 22 h 35 UTC (cinq communes, 29 min) s'est faite sans nouveau refus.

## Restant avant toute publication

- Relecture humaine des dix articles (sections E et F comprises).
- Réextraction des prix du carburant à la publication (procédure dans le suivi, pas dans les articles).
- Saint-Nazaire : collecte documentaire d'Ycéo non faite (site identifié après la collecte ; pas de collecte générale relancée).
- Vannes (Kicéo) et La Roche-sur-Yon (Impulsyon) : site du réseau injoignable ou non identifié.
- Intégration publique (voir `../../PUBLICATION.md` pour le modèle des pilotes).
