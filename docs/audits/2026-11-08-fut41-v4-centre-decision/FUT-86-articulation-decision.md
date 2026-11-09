# FUT-41 · FUT-86 · Ma décision, la fiche de suivi et l'analyse complète : articulation avec les pages existantes

9 novembre 2026 · cadrage et conception, **sans implémentation**. Audit fait sur `origin/main` `bab5eb49` (lecture seule).
Aucune page de production modifiée, aucune redirection créée, aucun changement du moteur, de Stripe, des droits ni de Linear.
S'appuie sur l'étude d'articulation du 21/10 (`explore/fut-41-centre-decision`, `docs/audits/2026-10-21-fut41-fut86-articulation/`) et la met à jour : depuis, « Vos lieux » est en production (FUT-41 lot 1) et la V5.1 a fixé la forme cible.

## 0. En bref

**Trois rôles, trois mots.**

| Rôle | Nom pour la personne | Ce que c'est | Ce que ce n'est pas |
|---|---|---|---|
| L'espace de recherche | **Ma décision** | communes, logements, comparaisons, visites, notes, suivi, prochains gestes | un rapport |
| Suivre une possibilité | **la fiche du logement** (titrée par son nom : « T3 quai de la Fosse ») | votre suivi, ce que futur•e en sait, la conclusion citée, les questions, vos notes | une seconde analyse ; elle ne recompose aucun fait |
| Consulter le résultat | **l'analyse complète** | la conclusion datée, les preuves, et les trois échelles : Territoire, Autour de l'adresse, Logement | une page « Relevé » ; le mot reste interne (direction artistique) |

**La règle qui évite deux expériences parallèles.** On ne construit pas un nouvel espace à côté de `/rapport` : **`/rapport` devient Ma décision**, lot après lot, sur les mêmes URL. L'analyse complète, ce sont les pages qui existent déjà (le hub quand un lieu est ouvert, puis `/rapport/quartier`, `/rapport/autour`, `/rapport/logement`), adressées par l'URL au lieu de l'état caché du compte.

**Ce qui ne doit jamais casser.** Trois familles de liens anciens sont permanentes et ne peuvent pas être réécrites :
1. **les analyses figées** : le moteur écrit `/rapport/quartier` et `/rapport/logement` dans les faits (`fact-compositions.ts`, `materiality-rules.ts`, `logement-rules.ts`, `chaleur-logement.ts`), et ces faits sont enregistrés dans des versions qu'on ne régénère pas ;
2. **les courriels déjà envoyés** : « Ouvrir mon dossier », « Ouvrir ma comparaison », « Ouvrir mon rapport » mènent à `https://futur-e.fr/rapport` (`transactional-email.ts`) ;
3. **le retour de paiement** passe par `/rapport/dossiers/ouvrir` (`webhook/route.ts`), et les liens de « Vos lieux » aussi.

**Recommandation.** Garder les URL `/rapport/*` comme adresses durables. Faire porter le lieu par l'URL (`?lieu=`), transformer `/rapport` sans lieu en accueil de Ma décision, et n'envisager des URL nouvelles (`/decision/…`) qu'en dernier lot, si un bénéfice est démontré (critère d'acceptation de FUT-86).

---

## 1. L'existant (audit de `origin/main`)

### 1.1 Ce que voit la personne

| Situation | Barre de navigation | Boutons |
|---|---|---|
| Visiteur | Où vivre · Explorer · Mon rapport · Vos lieux · Comparateur · Pourquoi futur•e | Se connecter · Commencer |
| Connecté (pages publiques) | idem | Mon compte · Mon rapport |
| `/rapport`, Territoire, Autour, Logement | idem | Mon rapport · Analyser une adresse |
| `/rapport/dossiers` (« Vos lieux ») | idem | Mon compte · Mon rapport |
| `/dossier/merci` | idem | Vos lieux |
| `/compte` | idem | Analyser une adresse · Mon rapport ; section « Mes biens analysés » |
| En-tête du dossier sous `DECISION_RELEVE` | | « ← Vos lieux » ; le lieu ; « Votre projet aujourd'hui » |

**Constat.** Le même espace s'appelle « Mon rapport » dans la barre, « Ma décision » en surtitre de « Vos lieux », et n'a pas de nom propre dans le hub. « Vos lieux » est à la fois une entrée de la barre globale et une page. Le Comparateur public reste au niveau global (FUT-86 demande de l'en retirer).

### 1.2 Les routes, leur rôle et la façon dont elles choisissent le lieu

| Route | Rôle actuel | Choix du lieu | Droits |
|---|---|---|---|
| `/rapport` | le hub : verdict (titre), cartes, contrôles, Projet (`#projet`), navigateur d'échelles ; « Mon rapport » | **état du compte** : `active_insee_code` (sinon résidence) puis `choisirDossierActif` (bien actif s'il est dans la commune, sinon le plus récent) | `decideTerritoryAccess` ; sans droit, rapport partiel |
| `/rapport/quartier` | module Territoire | état du compte | `canAccessTerritory`, sinon redirection `/rapport` |
| `/rapport/autour?dossierId=` | module Autour de l'adresse | URL, sinon repli sur le bien actif ; puis `MarquerBienActif` (`POST /api/dossier/actif`) | dossier lu par `user_id` + RLS |
| `/rapport/logement?dossierId=` | module Logement | idem | idem |
| `/rapport/dossiers` | **« Vos lieux »** (FUT-41 lot 1) : chaque lieu accessible, conclusion figée citée, date, version, état ; « Analyser une autre adresse » | liste | lecture filtrée par compte |
| `/rapport/dossiers/ouvrir?id=&vers=` | GET qui **écrit** le triplet (commune, nom, bien actif) puis redirige (`dossier` → `/rapport`, `commune` → `/rapport/quartier`, `autour`, `logement` ; `territoire` accepté pour les anciens liens) | paramètre | dossier vérifié |
| `/rapport/territoire?insee=` | GET qui écrit la commune active après vérification du droit, efface le bien actif, → `/rapport` | paramètre | `decideTerritoryAccess` |
| `/rapport/residence` | GET qui remet la résidence, → `/rapport` | | |
| `/dossier/merci` | après achat d'une adresse | | |
| `/merci` | après achat d'un territoire (3-D Secure) → `/rapport` | | |
| `/compte` | compte, plan, factures, « Mes biens analysés », CTA | | |
| `/compte/memoire` | ce que futur•e a retenu de la personne (profil) | | |
| `/api/dossier/actualiser` | mise à jour gratuite d'un dossier : version n+1, l'ancienne reste lisible | | dossier acquis |
| `/comparateur`, `/comparateur/pack-decision` | comparateur public ; Dossier comparatif (39 €) | | octroi FUT-115 |

### 1.3 Risques connus, toujours ouverts

| # | Risque | Où | Gravité |
|---|---|---|---|
| R1 | **Même URL, lieux différents** : `/rapport` et `/rapport/quartier` lisent l'état du compte ; deux onglets ou un signet peuvent afficher un autre lieu que celui attendu | hub, Territoire | moyenne |
| R2 | **GET qui écrivent** (`ouvrir`, `territoire`, `residence`) : un futur `<Link>` préchargé changerait le lieu au survol | 3 routes | faible aujourd'hui, piège |
| R3 | **Faits du moteur avec des liens sans lieu** (`href: "/rapport/logement"` sans `dossierId`) : ils s'ouvrent sur le bien actif, qui n'est pas forcément celui de l'analyse lue | analyses figées | moyenne, et permanente |
| R4 | **Six noms pour deux espaces** | navigation, en-têtes, courriels | confusion |

---

## 2. La cible

### 2.1 Schéma de navigation

```
BARRE GLOBALE (connecté)
  futur•e   Où vivre · Explorer · Ma décision        [Analyser une adresse]   Compte
BARRE GLOBALE (visiteur)
  futur•e   Où vivre · Analyser une adresse · Explorer · Pourquoi futur•e     Se connecter

MA DÉCISION  (/rapport, sans lieu)
  ├─ Vue d'ensemble   où vous en êtes · le plus utile maintenant · vos communes et vos logements
  │                   (ex-« Vos lieux » : chaque lieu, ses deux dimensions, sa conclusion citée)
  ├─ Comparer         (/rapport/comparer?…)   communes OU logements, 2 à 4, sélection gardée
  └─ Mon Projet       (/rapport/projet)       conditions, « Et si… ? », adoption, historique
        │
        ├─ fiche d'une commune    (/rapport?lieu=commune:<insee>)        nom de la commune
        └─ fiche d'un logement    (/rapport?lieu=logement:<id>)          nom du logement
              │  fil : Ma décision / Nantes / T3 quai de la Fosse
              │
              └─ ANALYSE COMPLÈTE   (quand une analyse existe)
                   Synthèse          /rapport?lieu=dossier:<id>&vue=analyse   (le hub actuel)
                   Territoire        /rapport/quartier?lieu=…                 (module actuel)
                   Autour            /rapport/autour?dossierId=<id>           (module actuel)
                   Logement          /rapport/logement?dossierId=<id>         (module actuel)
                   fil : Ma décision / T3 quai de la Fosse / Analyse complète
                   retour : « Revenir à la fiche du logement »

COMPTE (/compte)   e-mail · achats et factures · ce que futur•e retient de vous · données · déconnexion
COMPARATEUR PUBLIC  dans Où vivre (« Vous hésitez déjà entre plusieurs communes ? Les comparer »)
```

Deux règles structurent le schéma :
1. **Un lieu n'a qu'une maison** : sa fiche, dans Ma décision. L'analyse complète en est la profondeur ; on y entre depuis la fiche et on en ressort vers elle.
2. **Le lieu affiché est toujours dans l'URL.** L'état du compte (`active_*`) ne sert plus qu'à rouvrir le dernier lieu quand l'URL n'en désigne aucun, et l'écran le dit (« le dernier lieu que vous avez ouvert »).

### 2.2 Matrice de migration « existant → cible »

| Existant | Rôle actuel | Rôle cible | Sort | Nom et URL proposés | À réutiliser | Droits, liens profonds, retours à préserver | Dépendances, tickets |
|---|---|---|---|---|---|---|---|
| `/rapport` (sans lieu désigné) | hub du lieu actif (« Mon rapport ») | **accueil de Ma décision** | **intégré** (même URL, nouveau contenu sans `?lieu`) | Ma décision · `/rapport` | `chargerVosLieux`, `lib/decision/vos-lieux.ts`, `premier-ecran.ts`, `presentationPour` | `requireCurrentUser` ; courriels `https://futur-e.fr/rapport` (permanent) ; `/merci` → `/rapport` ; ancres `#projet` | FUT-86 (libellé), FUT-41 (accueil), FUT-118 (`DECISION_RELEVE`) |
| `/rapport` (lieu ouvert) | verdict, cartes, contrôles | **analyse complète, onglet Synthèse** | **conservé**, adressé par l'URL | Analyse complète · `/rapport?lieu=dossier:<id>` (ou `commune:<insee>`) | `DossierDecisionSection`, `ControlesDuDossier`, `DossierAvecLogement`, `EnTeteDossierReleve`, `EchelleNavigator` | `decideTerritoryAccess` inchangé ; `?lieu` vérifié comme `ouvrir` le fait ; sans `?lieu`, accueil (ci-dessus) | FUT-86 R1, FUT-91/FUT-118 |
| `/rapport/quartier` | Territoire | **analyse complète, onglet Territoire** | **conservé** | Territoire · `/rapport/quartier?lieu=…` ; sans `lieu`, comportement actuel | module Territoire | `canAccessTerritory` ; liens figés `/rapport/quartier` dans les analyses : **permanents**, résolus sur le lieu d'origine quand il est connu (§ 2.4) | FUT-12 (provenance) |
| `/rapport/autour?dossierId=` | Autour de l'adresse | onglet Autour | **conservé** | Autour de l'adresse · même URL | `AutourModule` | inchangés | |
| `/rapport/logement?dossierId=` | Logement (analyse technique) | onglet Logement | **conservé** | Logement · même URL | `LogementModule` | liens figés `/rapport/logement` : permanents (§ 2.4) | |
| `/rapport/dossiers` | « Vos lieux » | contenu de l'accueil de Ma décision | **intégré, puis redirigé** vers `/rapport` quand l'accueil contient tout (lot 3) | aucune page propre | `VosLieux`, `vos-lieux.ts` (conclusion citée, état) | `/dossier/merci` et anciens signets ; redirection permanente, jamais de suppression | FUT-41 lot A |
| `/rapport/dossiers/ouvrir` | GET qui écrit l'état et redirige | lien de compatibilité vers `/rapport?lieu=…` | **conservé**, puis **réduit** à une redirection qui pose `?lieu` (l'écriture d'état devient facultative) | interne | liste blanche `DESTINATIONS` | **retour de paiement** (webhook) ; liens « Vos lieux » ; ancien `vers=territoire` | FUT-86 R2 |
| `/rapport/territoire?insee=` | GET qui écrit la commune active | redirection vers `/rapport?lieu=commune:<insee>` | **conservé**, puis réduit | interne | `decideTerritoryAccess` | garde du droit inchangée | FUT-119 |
| `/rapport/residence` | GET : retour à la résidence | « Votre commune » dans Ma décision | **conservé** (compatibilité) | `/rapport?lieu=commune:<résidence>` | | | |
| `/rapport#projet` | section Projet du hub | **Mon Projet** | **intégré** puis page propre | Mon Projet · `/rapport/projet` (l'ancre `#projet` y redirige côté client) | `ProjectSummaryCard`, `normalizeUserProject`, `projetAChangeMateriellement` | `premier-ecran.ts` produit des liens `/rapport#projet` | FUT-9 (Projet durable), ADR Projet |
| (n'existe pas) | | **Comparer** | **nouveau** | Comparer · `/rapport/comparer?mode=logements&ids=…` | contrat FUT-22 (moteur), V5.1 `lecture51.ts` pour la présentation | sélection dans l'URL ; retour à la même sélection | FUT-22, FUT-49 (avenir du Dossier comparatif) |
| (n'existe pas) | | **fiche du logement** (suivi) | **nouveau** | le nom du logement · `/rapport?lieu=logement:<id>` | conclusion citée par `vos-lieux.ts` ; questions, notes | un logement acheté garde son `dossier_id` ; un logement repéré n'a pas de droit | FUT-41 lot A, migration `property_candidates` (D1-D9) |
| `/compte` | compte + « Mes biens analysés » + CTA produit | **compte seulement** | **réduit** | Compte · `/compte` | factures, déconnexion | « Mes biens analysés » → lien « Retrouver vos lieux dans Ma décision » | FUT-86 |
| `/compte/memoire` | profil retenu | conservé dans Compte | **conservé** | « Ce que futur•e retient de vous » | | | |
| `/dossier/merci` | après achat d'une adresse | conservé | **conservé**, CTA renommés | « Voir l'analyse complète » · « Retrouver ce logement dans Ma décision » | | | |
| `/merci` | après achat d'un territoire | conservé | **conservé** | « Voir l'analyse de {commune} » | | | FUT-119 |
| `/comparateur` | comparateur public | dans Où vivre | **conservé**, retiré de la barre | Comparer des communes · `/comparateur` | | liens publics, SEO | FUT-86, FUT-49 |
| `/comparateur/pack-decision` | Dossier comparatif | à arbitrer | **inchangé** jusqu'à FUT-49 | | | octroi FUT-115 | FUT-49 |

### 2.3 Nomenclature

**Pages et lieux**

| Mot | Usage | À éviter |
|---|---|---|
| **Ma décision** | l'espace, partout (barre, fil, courriels nouveaux) | « Mon rapport », « Mon dossier », « Mes biens » |
| **Vue d'ensemble**, **Comparer**, **Mon Projet** | les trois entrées de Ma décision | « Faire le point » comme destination |
| **Vos communes et vos logements** | la liste sur l'accueil | « Vos lieux » comme page séparée, « Mes biens », « pistes » |
| le **nom du lieu** | titre d'une fiche (« T3 quai de la Fosse », « Nantes ») | « Fiche logement » comme titre |
| **Analyse complète** | la profondeur d'un lieu | « Relevé » (reste interne), « rapport » |
| **Synthèse · Territoire · Autour de l'adresse · Logement** | les onglets de l'analyse | « quartier » (l'URL `/rapport/quartier` reste, le mot disparaît de l'écran) |
| **Votre suivi** / **Ce que futur•e en sait** | les deux dimensions d'un logement | un seul statut qui mélange les deux |
| **Repéré · Visite le 14 nov. · Visité · Écarté** | le suivi (hypothèse à tester pour « Repéré ») | « À étudier » (ressemble à une tâche de futur•e) |
| **Adresse inconnue · Adresse connue, pas encore analysée · Adresse analysée · Analyse à actualiser** | ce que futur•e en sait | « lu », « non lu » |

**Actions** (un verbe, et ce qu'il fait)

| Action | Effet | Remarque |
|---|---|---|
| Ajouter une annonce | garder un logement (lien, valeurs déclarées) | gratuit, aucune analyse |
| Ajouter une commune | garder une commune (lecture gratuite) | |
| Renseigner l'adresse | rend l'analyse possible | gratuit |
| Analyser l'adresse · 39 € | ouvre le panneau (ce que vous saurez, ce qu'elle ne dira pas), puis le paiement | jamais en un clic |
| Étudier la commune · 14 € | idem, pour une commune | remplace « Examiner la commune » |
| Mettre à jour (gratuit) | nouvelle version sous le Projet actuel ; l'ancienne reste | `/api/dossier/actualiser` |
| Voir l'analyse complète | ouvre la profondeur du lieu | remplace « Ouvrir le Relevé », « Ouvrir le dossier » |
| Revenir à la fiche | retour depuis l'analyse | |
| Comparer / Comparer avec un autre logement | ouvre Comparer avec ce lieu choisi | |
| Voir les questions · Noter la réponse | préparer la visite, consigner une réponse | |
| Écarter · Remettre en course | suivi, avec la raison | |
| Essayer un changement · Adopter ce changement | « Et si… ? » | adopter crée une révision du Projet |

**Un point à trancher avec FUT-118** : la V5 et la V5.1 écrivent « Votre Projet » (majuscule, l'objet du produit) ; la production écrit « votre projet ». L'harmonisation était déjà soumise à FUT-118 ; la décision s'applique aux deux.

### 2.4 Liens figés des analyses (R3)

Les faits du moteur portent `href: "/rapport/logement"` ou `"/rapport/quartier"`, **sans lieu**, et sont figés dans les versions. On ne les réécrit pas (une analyse figée ne se modifie pas). Proposition : **l'interface les complète à l'affichage**, à partir du lieu de l'analyse qu'elle sert (`/rapport/logement` → `/rapport/logement?dossierId=<id de l'analyse lue>`). Le moteur n'est pas modifié ; la règle vit dans un seul composant de rendu des preuves, avec un test. Si l'interface ne sait pas (lien isolé, signet), la route garde son repli actuel.

---

## 3. Parcours complets

### P1 · De l'accueil de Ma décision vers une commune ou un logement

| Étape | Écran | URL | Ce qui est affiché | Retour |
|---|---|---|---|---|
| 1 | Ma décision | `/rapport` | « Nantes ou Rennes ? », une phrase, le geste le plus utile, la liste | |
| 2 | clic sur « T3 quai de la Fosse » | `/rapport?lieu=logement:<id>` | la fiche : suivi, ce que futur•e en sait, conclusion citée, questions, notes | fil « Ma décision », bouton retour |
| 2 bis | clic sur « Nantes » | `/rapport?lieu=commune:44109` | la fiche de la commune : conclusion du rapport, ses logements | idem |

### P2 · De la fiche vers l'analyse complète

| Étape | Écran | URL | Garde-fou |
|---|---|---|---|
| 1 | fiche | `/rapport?lieu=logement:<id>` | la conclusion est **citée** depuis l'analyse, jamais recomposée |
| 2 | « Voir l'analyse complète » | `/rapport?lieu=dossier:<id>&vue=analyse` | même conclusion, mot pour mot, même version ; si le Projet a changé : « écrite sous votre Projet du … » |
| 3 | « Revenir à la fiche du logement » | retour à 1 | |

Un logement **repéré sans analyse** n'a pas d'analyse complète : le bouton n'existe pas, la fiche propose « Analyser l'adresse · 39 € » (panneau d'abord).

### P3 · De l'analyse vers Territoire, Autour et Logement

| Onglet | URL | Source |
|---|---|---|
| Synthèse | `/rapport?lieu=dossier:<id>&vue=analyse` | le hub actuel |
| Territoire | `/rapport/quartier?lieu=dossier:<id>` | module actuel, lieu porté par l'URL |
| Autour de l'adresse | `/rapport/autour?dossierId=<id>` | inchangé |
| Logement | `/rapport/logement?dossierId=<id>` | inchangé |

Le fil reste « Ma décision / T3 quai de la Fosse / Analyse complète » sur les quatre onglets ; le navigateur d'échelles actuel (`EchelleNavigator`) devient la barre d'onglets. Une commune seule n'a que Synthèse et Territoire, et le dit (« Autour de l'adresse et Logement demandent l'analyse d'une adresse précise », phrase déjà en production).

### P4 · De l'analyse vers la comparaison, puis retour à la même sélection

| Étape | URL |
|---|---|
| 1 · analyse de la Fosse, « Comparer avec un autre logement » | → `/rapport/comparer?mode=logements&ids=fosse` |
| 2 · on ajoute la Convention | `/rapport/comparer?mode=logements&ids=fosse,convention` |
| 3 · on ouvre la Convention depuis l'en-tête de colonne | `/rapport?lieu=logement:convention` |
| 4 · retour (navigateur ou « Comparer » dans Ma décision) | `/rapport/comparer?mode=logements&ids=fosse,convention` : **même sélection**, même duo sur téléphone |

La sélection vit dans l'URL ; la dernière comparaison est aussi gardée pour l'entrée « Comparer » (comportement prototypé en V5 et V5.1).

### P5 · Depuis un ancien lien, un dossier acheté ou une analyse historique

| Origine | URL reçue | Comportement cible |
|---|---|---|
| Courriel « Ouvrir mon dossier » | `/rapport` | accueil de Ma décision ; le dernier lieu ouvert est proposé en tête (« Reprendre T3 quai de la Fosse ») |
| Retour de paiement d'une adresse | `/rapport/dossiers/ouvrir?id=…&vers=dossier` puis `/dossier/merci` | l'analyse complète du logement payé, avec « Retrouver ce logement dans Ma décision » |
| Retour de paiement d'un territoire | `/merci` → `/rapport` | l'analyse de la commune payée (le webhook pose déjà la commune) |
| Signet `/rapport/dossiers` | | redirigé vers `/rapport` (lot 3), la liste y est |
| Signet `/rapport/quartier` sans lieu | | comportement actuel (lieu actif), avec le nom du lieu affiché |
| Lien figé dans une analyse (`/rapport/logement`) | | complété à l'affichage avec le lieu de l'analyse (§ 2.4) |
| Analyse historique (version n-1) | `/rapport?lieu=dossier:<id>&version=<n>` | la version demandée, « conservée telle qu'elle a été écrite », avec le Projet de son époque ; lien vers la version actuelle |

---

## 4. Sources de vérité

| Donnée | Où elle vit | Qui l'écrit | Comment la fiche l'affiche | Ce que la fiche ne fait jamais |
|---|---|---|---|---|
| **Annonce déclarée** (prix, surface, pièces, lien) | futur candidat (`property_candidates`, D1-D9) ; aujourd'hui rien | la personne | « 289 000 € · 68 m² · déclaré » | la présenter comme vérifiée |
| **Observation, réponse à une question** | événements du candidat (journal en insertion seule) | la personne, avec sa nature (vu, dit par l'agence, lu dans un document) et sa date | « Votre observation du 6 nov. » | modifier une donnée publique ; devenir une mesure |
| **Données publiques** | sources et faits du moteur | le moteur | jamais copiées dans la fiche ; lues dans l'analyse | les recalculer à l'affichage |
| **Analyse versionnée** (conclusion, registre, faits) | artefacts de décision (`readLatestArtifact`, versions) ; `address_dossiers` pour le droit | le moteur, au paiement ou à la mise à jour | citée mot pour mot, datée, version et Projet d'alors | la recomposer, la reconduire silencieusement, la régénérer |
| **Projet actuel** | `user_profiles.user_project` (révisions : FUT-9) | la personne (« Adopter ce changement ») | « Face à votre Projet, révision 3 du 8 oct. » | le confondre avec le Projet sous lequel une analyse a été écrite |
| **Droits** | `report_grants`, `address_dossiers` (claims) | paiement (webhook) | ce qui s'ouvre, ou le panneau d'achat | décider un accès (seules `decideTerritoryAccess` et les lectures filtrées décident) |
| **Comparaison** | calcul à la volée (contrat FUT-22, critère par critère) | aucune écriture | « Ce qui les distingue », « Ce qui reste à savoir » | additionner, classer, désigner un gagnant |

Conséquence pour la fiche : elle est une **vue** qui joint trois sources (le candidat, l'analyse, le Projet). Elle n'a aucune colonne qui recopie un fait ou une conclusion.

---

## 5. Guidage sans tutoriel

**Principe.** L'interface s'explique par sa structure : une question en titre, une phrase pour s'orienter, un seul geste coloré, des mots courants. Une aide existe, mais on peut ne jamais l'ouvrir.

| Besoin | Réponse | Inspiration (sans copie) |
|---|---|---|
| Savoir où je suis | fil court (« Ma décision / Nantes / T3 quai de la Fosse ») dans les profondeurs seulement ; titres qui nomment le lieu | Linear : un seul niveau de contexte visible à la fois |
| Savoir quoi faire | « Le plus utile maintenant », un bouton ; les autres gestes sous le lieu concerné | Linear : une action principale par vue |
| Voir sa progression, sans parcours imposé | sur chaque logement, les trois paliers (commune, adresse, analyse) et le suivi ; aucun stepper, aucun pourcentage | progression contextuelle, non linéaire |
| Découvrir à son rythme | une recherche vide qui propose deux portes ; un lien discret « Comment lire cette page » (replié, trois phrases, se ferme et ne revient pas) | états vides qui enseignent |
| Aller vite (facultatif) | raccourcis clavier documentés dans l'aide (C pour comparer, / pour chercher un lieu) ; jamais nécessaires | Linear : raccourcis découvrables, jamais obligatoires |
| Retrouver son contexte | sélection et lieu dans l'URL ; retour du navigateur fiable | |

À ne pas faire : visite guidée en bulles au premier passage, badges « nouveau », listes de tâches à cocher, jauges de complétude. Elles transforment la recherche en exercice et vieillissent mal.

---

## 6. Plan de migration progressif

Chaque lot est petit, réversible, et passe derrière l'activation par compte existante (`activation.ts`, patron FUT-118) avant d'être généralisé. Aucun lot ne change un droit, un prix, un paiement ou le moteur.

| Lot | Contenu | URL touchées | Retour arrière | Prérequis | Tickets |
|---|---|---|---|---|---|
| **0 · Les mots** | barre : « Mon rapport » → « Ma décision » ; retirer « Vos lieux » et « Comparateur » de la barre ; « Analyser une adresse » en action ; « Compte » ; CTA des pages du compte et de `/dossier/merci` ; « Mes biens analysés » → lien vers Ma décision | aucune | redéployer | décision sur la barre visiteur | FUT-86 V1 |
| **1 · Le lieu dans l'URL** | `/rapport?lieu=…` lu en priorité ; `ouvrir` et `territoire` redirigent avec `?lieu` (ils écrivent encore l'état, en repli) ; complément des liens figés (§ 2.4) | `/rapport`, `/rapport/quartier` (paramètre ajouté) | ignorer `?lieu` | tests des trois routes GET | FUT-86 R1-R3 |
| **2 · L'analyse complète** | onglets Synthèse · Territoire · Autour · Logement sur les pages existantes ; fil et retour vers la fiche ; libellés « Voir l'analyse complète » | aucune nouvelle | activation par compte | lot 1 ; `DECISION_RELEVE` décidé (FUT-118) | FUT-118, FUT-91 |
| **3 · L'accueil de Ma décision** | `/rapport` sans lieu = accueil V5.1 sur les données de « Vos lieux » (lieux achetés, résidence) ; `/rapport/dossiers` redirigé vers `/rapport` une fois l'accueil complet | `/rapport/dossiers` (redirection permanente) | activation par compte | lots 1 et 2 | FUT-41 |
| **4 · La fiche de suivi et l'ajout** | logements repérés (candidats), annonce déclarée, suivi, questions, notes, écart ; ajout par lien et texte collé | `/rapport?lieu=logement:<id>` | activation par compte | migration `property_candidates` (D1-D9) | FUT-41 lot A |
| **5 · Comparer et Mon Projet** | `/rapport/comparer` sur le contrat FUT-22 (moteur) ; `/rapport/projet` avec révisions | nouvelles | activation | FUT-22 côté moteur ; FUT-9 ; FUT-49 pour le Dossier comparatif | FUT-22, FUT-9, FUT-49 |
| **6 · URL canoniques (facultatif)** | `/decision/…` seulement si un bénéfice est démontré ; redirections permanentes depuis `/rapport/*`, jamais retirées | toutes | garder les deux | mesure de l'usage | FUT-86 (critère « pas de migration lourde sans bénéfice ») |

**Invariants de toute la migration.** Les URL `/rapport`, `/rapport/quartier`, `/rapport/logement`, `/rapport/autour`, `/rapport/dossiers/ouvrir`, `/rapport/territoire`, `/rapport/residence`, `/merci`, `/dossier/merci` répondent toujours. Aucun courriel envoyé ne casse. Aucune analyse figée n'est réécrite ni régénérée. Un lieu acheté reste accessible à chaque étape, par au moins deux chemins.

---

## 7. Risques et décisions à arbitrer

| # | Décision ou risque | Options | Recommandation |
|---|---|---|---|
| A1 | Garder `/rapport` comme adresse de Ma décision | garder ; passer à `/decision` | **garder** (courriels, analyses figées, retour de paiement) ; `/decision` seulement au lot 6 |
| A2 | Format du lieu dans l'URL | `?lieu=dossier:<id>` ; segments `/rapport/lieux/<id>` | **paramètre** : compatible avec les pages actuelles, sans nouvelle route au lot 1 |
| A3 | « Comparateur » public | le garder dans la barre ; le déplacer dans Où vivre | **dans Où vivre** (FUT-86) ; son avenir avec le Dossier comparatif reste FUT-49 |
| A4 | « Votre Projet » ou « votre projet » | | à trancher dans FUT-118, une fois pour tout le produit |
| A5 | « Repéré » au lieu de « À étudier » | | après le test utilisateur V5.1 |
| A6 | Ordre lots 2 et 3 | analyse d'abord ; accueil d'abord | **analyse d'abord** : elle sert déjà des personnes qui ont payé ; l'accueil dépend de « Vos lieux » qui existe |
| A7 | `DECISION_RELEVE` | activer avant ; après les lots | activer **par compte** au lot 2, généraliser après recette (règle FUT-118 : jamais sans accord) |
| A8 | Miniature d'annonce | aucune ; accord avec un site ; métadonnées publiées | aucune tant qu'aucune voie autorisée n'est validée juridiquement (V5.1 § 6) |
| R5 | Deux expériences en parallèle | | évité par construction : chaque lot transforme `/rapport`, aucun espace neuf n'est ouvert à côté |
| R6 | Une fiche qui recopie des faits | | la fiche est une vue (§ 4) ; test : aucune colonne d'analyse dans le candidat |
| R7 | Un lien figé ouvre un autre lieu (R3) | | complément à l'affichage (§ 2.4), testé |
| R8 | Le retour de paiement change de destination | | lot 3 seulement, avec recette d'achat réel en environnement de test ; aucun changement de l'URL de retour Stripe |

**Ce que je n'ai pas fait.** Aucune page de production n'a été ouverte avec un compte réel ; l'audit est une lecture du code de `origin/main`. Aucune redirection n'a été écrite. Linear n'a pas été modifié ; FUT-86, FUT-118, FUT-41 et FUT-22 ont été lus.
