# FUT-118 · Activation progressive du Relevé dans Ma décision (21/10/2026)

Chantier ciblé : rendre activable, compte par compte, le Relevé de Ma décision (FUT-91, FUT-92) déjà
fusionné, sans attendre R1, FUT-41 ou FUT-86. Livré **désactivé pour tout le monde**.

## 1. Le mécanisme

| | |
| --- | --- |
| Bascule générale | `DECISION_RELEVE=true` (inchangée) |
| Palier par compte | `DECISION_RELEVE_COMPTES` : UUID Supabase séparés par des virgules ; un identifiant mal formé est ignoré |
| Indépendance | ne lit ni `FUTUREE_ADMIN_EMAILS`, ni les achats, ni les droits ; aucune adresse e-mail |
| Résolution | **une fois par requête**, dans `/rapport` (`presentationPour(user.id)`), puis transmise aux cinq points de montage (racine, deux `DossierDecisionSection`, deux `ControlesDuDossier`, `DossierAvecLogement`) ; la prop est obligatoire, aucun composant ne lit l'environnement (test A2) |
| Retour au classique | retirer l'identifiant ou la variable, puis redéployer ; en secondes : Instant Rollback |
| Sans état | basculer ne touche ni les artefacts, ni les lectures enrichies (même empreinte), ni les droits |

Sans aucune des deux variables, la production sert le classique à l'identique.

## 2. Bloqueurs et imperfections

### Bloqueur trouvé, corrigé : le thème clair

`/rapport` est peint en couleurs fixes (`bg-canvas`, `text-label`) : en thème clair, la page reste
sombre, le classique compris (seule la barre de navigation passe en clair). Le Relevé suit, lui, le
thème par ses jetons : il posait des plaques crème et une encre sombre **sur ce fond sombre**, des pans
entiers devenaient illisibles (constaté dans Chrome et WebKit, 390 et 1440 px).

Correction minimale : sous le Relevé, le conteneur du dossier fixe `data-theme="dark"`, comme la page
qui l'entoure, et `design-tokens.css` redérive les `--r-*` sur tout conteneur qui fixe son thème (un
jeton déclaré sur `:root` garde sinon les couleurs de la racine). Le classique est inchangé ; aucune
autre page ne porte de `data-theme` imbriqué. Le thème clair de Ma décision viendra avec son habillage
(R2). Test A3.

### Imperfections esthétiques, laissées pour R2 (non bloquantes)

- surtitre « ● DOSSIER » en capitales mono orange dans `EnTeteDossier`, au-dessus de la plaque ;
- carte projet (`ProjectSummaryCard`) en verre, avec cinq « EN FAIRE UNE CONDITION SANS COMPROMIS » en
  capitales mono orange, juste après le Relevé (fichier proche du Projet : à traiter avec FUT-41) ;
- bandeau « Votre projet a changé » en carte arrondie au-dessus de la plaque (§ 6.2, point 3) ;
- appel « Préciser cette lecture à une adresse » en carte arrondie ; orbes flous très atténués ;
- navigation en capitales (FUT-86).

## 3. Recette (bancs de développement, vrais dossiers du moteur, sans génération ni écriture)

`/rapport` exige une session et déclenche, pour un compte qui a des droits, des tâches qui écrivent
(synthèse du territoire, voisinage, rattrapage d'artefact). La recette passe donc par les bancs qui
rendent les **composants de production** : `/dev/fut92` (le gabarit complet de `/rapport`) et
`/dev/fut91` (les états), serveur local avec `DOSSIER_NARRATIVE=false`.

| § 6.2 | Contrôle | Résultat |
| --- | --- | --- |
| 1, 7, 8 | **Fidélité du contenu**, classique contre Relevé, 14 cas : artefact daté, analyse d'adresse en attente / indisponible / faite, Projet, lien ou voisinage modifié, condition sans compromis, **non-régression FUT-90** (Nîmes, `confirmer=faible_chaleur`), nombreuses réserves, titre long, correspondance sans réserve, dossier d'adresse, projet non structuré | même titre dans 14 / 14 ; **0 phrase perdue sur 459** ; aucun lien de preuve ni source externe perdu ; phrases propres au Relevé : seulement des libellés de structure (« D'où viennent ces constats », « non examiné dans cette lecture ») et les légendes des jauges, dont les valeurs sont dans le texte |
| 8 | Liens de preuve | identiques, plus : sur une version figée, deux liens climat portent la provenance (`preuve=`) dans le Relevé et pas dans le classique (même cible ; le Relevé désigne la version vendue, comme `evidenceHref`) |
| 4 | Navigation collante | colonne d'appui collée à 88 px du haut à 25 / 50 / 75 % de la lecture, à 1440×900, 1280×800, 1024×700 et 1024×560, Chrome et WebKit |
| 5, 6 | Mobile, WebKit | aucun débordement horizontal à 1440, 1024, 390, 360 px, sombre et clair, Chrome et WebKit (moteur de Safari, Playwright) |
| 11 | Mesure | `PriorityControlActions` et `EchelleNavigator` sont les mêmes composants dans les deux présentations |
| — | Console | seulement la mesure d'audience factice du serveur local |

## 4. Ce qui n'est pas vérifié

- **Artefacts réels en série** (§ 6.2, points 1 et 2 : 58 artefacts prêts, engine-1 à engine-6, cinq
  comptes ; lectures enrichies stockées). Ils sont en base de production ; leur lecture, même en
  lecture seule et anonymisée, attend l'accord du porteur. Les cas ci-dessus sont des dossiers du
  moteur actuel, et les artefacts engine-5 figés du dépôt (`fut17-artefacts-*.json`) restent couverts
  par les tests existants.
- **`/rapport` réel avec une session** : se fait au palier 1, sur le compte du porteur.
- Safari sur iPhone réel ; mise à jour d'analyse (Q1) sur prévisualisation ; performance (TTFB, LCP).
