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

## 4. Les dossiers historiques (21/10/2026, avec l'accord du porteur)

### Méthode

- **Lecture seule** des tables `decision_artifact` et `decision_narrative` de production (uniquement
  des `select`), extraites dans un dossier temporaire local, **supprimé après la recette** ; aucune
  donnée brute dans le dépôt, Linear ou ce rapport.
- **Aucun effet de bord** : aucune écriture, aucune génération (`DOSSIER_NARRATIVE=false`, aucune clé
  de modèle chargée), aucune variable Vercel touchée, aucun compte activé.
- Chaque artefact prêt est rendu **tel qu'il a été enregistré** (`parseDecisionArtifact`, puis le
  `dossier` figé), par les composants de production, dans les deux présentations, sur un banc local
  supprimé après usage. Aucune conclusion n'est recalculée avec le moteur actuel.
- **Lectures enrichies associées par leur identité exacte**, celle de la production : compte, commune,
  périmètre (`scope_key`) et empreinte du plan (`input_hash = buildConclusionHash(plan)`), jamais par la
  commune seule. Elles sont rendues comme un cache servi : blocs stockés, validés par
  `validateGeneratedBlocks`, puis `ConclusionBlock` dans chaque variante.
- Contrôles par artefact : titre et détail du verdict comparés **à l'artefact lui-même** ; chaque phrase
  du classique **comptée** dans le texte complet du Relevé (une absence à un second endroit ne se cache
  pas derrière la première occurrence) ; liens de preuve, sources externes, liens internes ; lecture
  enrichie bloc par bloc ; exceptions d'exécution. Tout ce que le Relevé affiche en plus est relu et
  rattaché à sa source.

### Corpus

58 artefacts prêts, **confirmé** (67 lignes au total : les 9 autres sont en échec, sans dossier ; la
production retombe alors sur l'assemblage du jour, identique dans les deux présentations). Cinq comptes,
du 11/08/2026 au 21/10/2026, 12 en commune seule et 46 en commune + adresse, 9 périmètres à plusieurs
versions (jusqu'à la v19) ; 53 sont antérieurs à FUT-10 (sans contexte du bien). Aucun artefact
engine-3 n'existe. 6 lectures enrichies en base, toutes au contrat `v16`.

### Bilan

| Moteur | Artefacts | Commune / adresse | Lectures enrichies retrouvées | Fidèlement restitués | Pertes ou altérations métier | Écarts constatés (tous non bloquants) |
| --- | --- | --- | --- | --- | --- | --- |
| engine-1 | 47 | 10 / 37 | 3 | **47** | **0** | intitulés « Méthode du signal » / « Données et limites » moins répétés ; 7 liens de preuve avec provenance en plus |
| engine-2 | 1 | 0 / 1 | 0 | **1** | **0** | intitulés |
| engine-4 | 8 | 2 / 6 | 0 | **8** | **0** | intitulés ; un résumé de composition stocké affiché par le Relevé seul |
| engine-5 | 1 | 0 / 1 | 0 | **1** | **0** | — |
| engine-6 | 1 | 0 / 1 | 0 | **1** | **0** | — |
| **Total** | **58** | 12 / 46 | **3** | **58** | **0** | |

- **Verdict** : titre et détail affichés = ceux de l'artefact, **58 / 58**, dans les deux présentations.
- **Contenu** : 4 735 phrases du classique ; **aucune** n'apparaît moins souvent dans le Relevé, hors deux
  intitulés de rubrique (ci-dessous). Aucune preuve, aucune source externe, aucune démarche perdue.
- **Exceptions d'exécution** : aucune, dans aucune présentation (anciennes structures comprises).

### Écarts, classés

**Différences de présentation attendues**

- *Intitulés.* Le classique range les sources d'une carte sous « Méthode du signal », dans « Données et
  limites ». Le Relevé porte ces mêmes sources dans sa marge de preuve (« Source : … », même texte, même
  nombre d'occurrences) : l'intitulé apparaît donc moins souvent, et le dépliant n'existe plus quand il
  ne contiendrait que des sources. Reproduire : un dossier dont une carte n'a que des sources ; compter
  « Méthode du signal » dans les deux présentations.
- *Libellés de structure ajoutés.* Bande « D'où viennent ces constats » (compte par échelle, « examiné,
  aucun constat affiché », « non examiné dans cette lecture »), légendes des jauges et des rangs, ligne
  de marge « Territoire · commune », preuves regroupées sur une ligne (« Autorisations d'urbanisme ·
  parcelles à moins de 50 m · 1 dossier non achevé · observée le … »). Tous dérivés de l'artefact.
- *Sujets.* Le Relevé titre certains faits par le libellé de la priorité ou le sujet du titre enregistrés
  dans l'artefact (`label`, `headlineSubject`), avec une majuscule.
- *Ordre de la lecture enrichie.* Mêmes lignes dans les deux variantes ; le Relevé fait monter la démarche
  prioritaire avant l'explication (FUT-91).

**Défauts préexistants du classique, que le Relevé ne reproduit pas**

- *Provenance absente de certains liens de preuve* (7 artefacts, cartes climat et feu de forêt d'une
  composition) : le classique envoie vers la donnée courante (`/rapport/quartier#evidence-…`), le Relevé
  vers la version achetée (`?preuve=<périmètre>#evidence-…`, comme `evidenceHref`). Même cible.
- *Résumé de composition* (1 artefact engine-4) : le résumé enregistré d'une composition n'est affiché que
  par le Relevé.

**Comportement préexistant identique dans les deux présentations (hors périmètre du Relevé)**

- *Lecture enrichie du bloc `compositions_found`* (3 artefacts engine-1) : le texte rédigé est stocké,
  mais `ConclusionBlock` ne rend jamais ce bloc, ni enrichi ni déterministe, dans aucune présentation ;
  les compositions restent affichées par leurs cartes (résumés présents 7 / 7 dans les deux). Aucune
  information perdue ; un texte payé à la génération n'est simplement jamais montré. Reproduire : un
  dossier avec une composition nommée hors tête ; le bloc figure dans `narrativePlan.blocks`, pas à
  l'écran.

**Régressions introduites par le Relevé : aucune.**

**Impossible à vérifier**

- 4 lectures enrichies sur 6 n'appartiennent à aucun périmètre servi par un artefact (dossiers assemblés
  avant les artefacts) : elles passent par le même `ConclusionRedigee` dans les deux présentations,
  mais n'ont pas pu être rendues sur leur dossier d'origine, qui n'est pas figé.
- Les 9 artefacts en échec n'ont pas de dossier à rendre.

## 5. Ce qui n'est pas vérifié

- **`/rapport` réel avec une session** : se fait au palier 1, sur le compte du porteur.
- Safari sur iPhone réel ; mise à jour d'analyse (Q1) sur prévisualisation ; performance (TTFB, LCP).
