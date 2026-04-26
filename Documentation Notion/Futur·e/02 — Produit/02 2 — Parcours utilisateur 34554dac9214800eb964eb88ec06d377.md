# 02.2 — Parcours utilisateur

## Parcours principal

Le parcours est conçu pour une montée progressive : d'une question urgente à un rapport complet, puis à un usage récurrent.

### Étape 1 — Découverte

La personne arrive sur la landing page. Elle comprend en moins de 10 secondes que ***futur•e*** ne parle pas du climat en général, mais de sa vie dans un lieu précis.

Point de vigilance design : le hero doit ancrer immédiatement la promesse locale. "Votre vie à La Rochelle en 2050" vaut mieux que "Comprendre le changement climatique".

---

### Étape 2 — Saisie de la commune

La commune est le premier ancrage du produit. Avant le profil, avant le paiement, avant tout.

Techniquement : autocomplete via API Base Adresse Nationale (BAN), api-adresse.data.gouv.fr. Retour : nom de commune, code INSEE, coordonnées. On ne demande jamais l'adresse exacte. Seulement la commune, pour RGPD.

---

### Étape 3 — Questions dynamiques et réponse directe

Le produit affiche 4 tensions sélectionnées dynamiquement selon la commune saisie *(voir catalogue des 26 tensions dans 02.4).*

Exemples pour La Rochelle : *Acheter à La Rochelle ? / Surfer dans 20 ans ? / Élever mes enfants face au littoral ? / Mon métier est-il menacé ?*

Exemples pour Chamonix : *Acheter en altitude ? / Skier dans 20 ans ? / Randonner autour de Chamonix ? / Mon métier du tourisme va-t-il tenir ?*

L'utilisateur clique sur une question ou pose la sienne librement. Il reçoit immédiatement une réponse directe : un verdict court (8-15 mots qui prennent position), un corps de 60-110 mots sourcé, et un CTA vers le rapport complet.

**Cette réponse est volontairement incomplète.** Elle est basée sur les données de la commune, pas encore sur le profil personnel. Elle donne un aperçu crédible de la valeur du produit, pas le produit complet. C'est le hook, pas la promesse tenue.

Deux cas de sortie de cette étape :

- L'utilisateur veut aller plus loin → clique sur "Générer mon rapport"
→ passe à l'étape 4.
- L'utilisateur n'est pas convaincu → quitte. C'est acceptable.

Note : certains utilisateurs arrivent directement à l'étape 4 sans passer par le module Q&R (entrée SEO via une page Savoir, lien direct, recommandation d'un abonné). **Le module Q&R est une porte d'entrée parmi d'autres, pas l'unique chemin.**

---

### Étape 4 — Profil (deux couches)

Le profil fonctionne en deux couches. La couche 1 simplifiée est toujours demandée.
La couche 2 est optionnelle et réalisée module par module.

**Couche 1 — Profil de base (toujours, 2 minutes)**

Champs obligatoires :

- Commune (pré-remplie depuis l'étape 2, modifiable)
- Tranche d'âge
- Statut logement (locataire ou propriétaire)
- Type de logement (appartement ou maison)
- Secteur d'activité (liste déroulante, environ 15 options)
- Loisirs principaux (multi-sélection, 5-6 options max)

Champs optionnels dans la couche 1 :

- Projets de vie à 5 ans (achat, déménagement, enfants, retraite)
- Composition du foyer (seul, en couple, avec enfants)

Design : un seul écran scrollable, deux sections visuelles ("qui vous êtes" / "votre vie"). Barre de progression visible. Bouton "Générer mon rapport" toujours visible en bas. Promesse : "2 minutes pour un rapport qui lit votre situation à {commune} en 2050."

---

**Couche 2 — Profil approfondi (optionnel, module par module, v1.5)**

Disponible dans le dashboard payant. Chaque module propose ses propres questions d'approfondissement. L'utilisateur choisit les modules sur lesquels il veut aller plus loin. Plus il renseigne, plus la projection est précise et actionnable.

Module Santé approfondi :

- Sensibilités respiratoires connues ? (asthme, rhinite allergique)
- Enfants de moins de 7 ans dans le foyer ?
- Consommation régulière de légumes du jardin ou circuits courts ?
- Source d'eau principale (robinet, filtrée, bouteille) ?

Module Métier approfondi :

- Travail principalement en intérieur ou en extérieur ?
- Activité dépend de ressources naturelles locales ?
- Statut (salarié, indépendant, dirigeant) ?
- Type d'employeur (collectivité, entreprise, association) ?

Module Logement approfondi :

- Année de construction approximative ?
- Isolation des combles ? Climatisation présente ?
- Étage ou rez-de-chaussée ?
- Jardin ou terrasse exposée plein sud ?

Module Projets approfondi :

- Zone du projet d'achat (littorale, urbaine, rurale) ?
- Horizon de revente envisagé ?
- Déménagement lié à un changement d'emploi ou de vie ?

Note RGPD sur les données de santé : les questions du Module Santé approfondi nécessitent un consentement explicite séparé. Un checkbox dédié précise que ces informations sont utilisées uniquement pour personnaliser la projection sanitaire et ne sont jamais partagées.

Statut : Couche 1 au MVP. Couche 2 en v1.5, module Santé en premier.

---

## Compte utilisateur

### Principe général

Le compte n'est pas une barrière d'entrée. C'est une couche de valeur ajoutée proposée progressivement selon l'engagement de l'utilisateur. L'objectif est de créer le moins de friction possible à l'entrée, tout en rendant le compte suffisamment désirable pour que l'utilisateur
veuille le créer.

### Quand le compte est créé

**Rapport gratuit sans compte :**
L'utilisateur peut générer et lire le rapport partiel sans créer de compte. Il le lit dans le navigateur. Il peut le partager par lien temporaire (72h). Mais il ne peut pas le retrouver s'il ferme le navigateur et il ne reçoit pas les mises à jour.

**Proposition de compte après le rapport gratuit :**
Une fois le rapport partiel affiché, un bandeau propose : "Sauvegardez votre rapport et recevez les mises à jour gratuitement." Un email suffit. Connexion par magic link (pas de mot de passe à créer). L'utilisateur peut ignorer et continuer sans compte.

**Compte obligatoire au paiement :**
Dès qu'il paie (one-shot 14€ ou abonnement), un compte est créé automatiquement avec l'email de paiement Stripe. C'est standard, attendu, non négociable.

### Ce que le compte débloque selon le plan

`Sans compte
  Rapport partiel (lecture navigateur, lien 72h)
  Pages Savoir gratuites (3 maximum)

Compte gratuit (email + magic link)
  Rapport partiel sauvegardé indéfiniment
  Lien de partage permanent
  1 notification si données mises à jour (levier de conversion)

Compte one-shot 14€
  Rapport complet PDF téléchargeable et re-téléchargeable
  Dashboard simplifié (6 modules en lecture seule, sans
  interactivité : pas de switcher scénarios, pas de détail facteurs)
  Régénération du rapport 1 fois par an si données changent
  Pas de newsletter

Compte Suivi 9€/mois
  Dashboard complet et interactif (switcher scénarios et horizons,
  détail de chaque facteur, pistes d'action)
  Profil modifiable à tout moment
  Profil approfondi module par module (v1.5)
  Newsletter mensuelle personnalisée
  Notifications ciblées (v1.5)
  Historique des mises à jour du rapport

Compte Foyer 15€/mois
  Tout le Suivi, plus :
  Mode foyer jusqu'à 6 membres
  Matrice d'exposition partagée
  Timeline des décisions collectives
  Comparateur de villes (feature exclusive)
  Newsletter avec section "Dans votre foyer ce mois-ci"`

### Pourquoi le dashboard one-shot est délibérément limité

Le dashboard one-shot montre les 6 modules mais sans interactivité : pas de switcher de scénarios, pas d'accès au détail des facteurs, pas de pistes d'action. L'utilisateur a son rapport complet, c'est ce pour quoi il a payé. Mais l'envie naturelle de basculer en scénario pessimiste,
de lire les détails du module Santé, de voir les pistes d'action concrètes crée le désir de passer au Suivi. Ce n'est pas de la frustration, c'est de la conversion par démonstration.

### Authentification technique

Magic links Supabase Auth : l'utilisateur entre son email, reçoit un lien de connexion, clique dessus, il est connecté. Pas de mot de passe. Natif dans Supabase, environ 10 lignes de code, zéro coût supplémentaire.

Option mot de passe disponible pour les utilisateurs qui préfèrent (une partie des CSP+ 40-65 ans est méfiante des magic links). Les deux méthodes coexistent.

---

### Schéma du parcours complet

`LANDING PAGE
     │
     ├─── [Saisit sa commune]
     │
     ▼
MODULE Q&R (gratuit, anonyme)
4 questions dynamiques selon commune
     │
     ├─── [Clique sur une question ou pose la sienne]
     │         │
     │         ▼
     │    RÉPONSE DIRECTE
     │    Verdict (8-15 mots) + corps sourcé + CTA
     │         │
     │         ▼
     │    PROFIL SIMPLIFIÉ ←── Entrée directe possible
     │    (6 champs, 2 min)    (SEO, lien, reco abonné)
     │         │
     │         ▼
     │    RAPPORT PARTIEL GRATUIT
     │    Synthèse globale + 1 module au choix
     │         │
     │    MUR DE PAIEMENT
     │         │
     │    ┌────┴────────┐──────────────┐
     │    │             │              │
     │   14€           9€/mois        15€/mois
     │  one-shot       Suivi          Foyer
     │    │             │              │
     │    ▼             ▼              ▼
     │  PDF          DASHBOARD      DASHBOARD
     │  complet      complet +      foyer +
     │               newsletter     comparateur
     │                              villes
     │
     └─── [Ne clique pas → quitte ou explore pages Savoir]`

---

### Étape 5 — Choix du scénario

Si l’utilisateur est un abonné payant, il choisit son horizon de lecture et son scénario climatique.

Horizons disponibles : 2030 / 2040 / 2050 / 2070.
Scénarios disponibles :

- Optimiste (+1.8°C) : accords climatiques tenus
- Médian (+2.9°C) : trajectoire actuelle des politiques
- Pessimiste (+4.1°C) : statu quo sans action supplémentaire

Le scénario médian est affiché par défaut. L'utilisateur peut basculer à tout moment pour comparer.

---

### Étape 6 — Lecture du rapport

L'utilisateur reçoit son rapport personnalisé. Il est :

- Personnel : prend en compte chaque élément du profil
- Modulaire : organisé en 6 modules explorables indépendamment
- Narratif : texte continu, pas un dashboard de chiffres
- Sourcé : chaque affirmation significative est citée
- Gradué en certitude : distingue observé / projeté / scénario / interprétation éditoriale

**Offre gratuite :** rapport court, 1 ville, 2 dimensions. 
**Offre one-shot 14€ :** rapport complet PDF, toutes dimensions. Mise à jour unique et dashboard simple.
**Offre Suivi 9€/mois :** rapport complet + mises à jour + newsletter.
**Offre Foyer 15€/mois :** tout le Suivi + mode foyer + comparateur de villes.

---

### Étape 7 — Approfondissement

L'utilisateur payant explore au-delà du rapport :

- Détail de chaque facteur dans les modules
- Pages Savoir thématiques (encyclopédiques, SEO)
- Pages Savoir actionnables (guides pratiques, comment faire)
- Pistes d'action contextualisées
- Sources et liens vers les données brutes

---

### Étape 8 — Retour récurrent

L'utilisateur revient via :

- Newsletter mensuelle personnalisée (premier lundi du mois)
- Notification ciblée sur événement public qui le concerne
- Mise à jour du rapport quand les données sous-jacentes changent
- Évolution de sa situation (déménagement, nouveau membre du foyer, nouveau projet)

**C'est cette étape qui justifie l'abonnement récurrent.** Le climat n'est pas un sujet qu'on règle en lisant un rapport. C'est un sujet qu'on oublie entre deux canicules. L'abonnement futur•e existe pour maintenir le climat de votre vie dans votre conscience active toute l'année.

---

## Le mur de paiement : où et comment

**Avant le mur :**

- Saisie de la commune
- Affichage des 4 questions dynamiques
- Réponse courte à une question (module Q&R)
- Aperçu du rapport : synthèse globale + 1 module complet (au choix)
- Accès à 3 pages Savoir thématiques

**Au mur :**

- Tentative d'accès au deuxième module
- Tentative de téléchargement PDF
- Tentative d'accès aux pages Savoir actionnables
- Tentative d'accès au mode foyer

**Design du mur :**
Pas de paywall brutal. Un CTA sobre qui nomme ce qu'on débloque.
"Pour lire les 5 autres modules et télécharger votre rapport PDF, choisissez votre formule." Pas de compte à rebours, pas de sentiment d'urgence artificiel.

---

## États d'erreur et cas limites

**Commune inconnue ou mal orthographiée :**
L'autocomplete BAN gère 99% des cas. Si la commune n'est pas trouvée, le produit propose les 3 communes les plus proches orthographiquement et demande confirmation.

**Commune avec données insuffisantes :**
Certaines petites communes n'ont pas de données ATMO locales, pas de données IRIS, pas de données plages. Dans ce cas, le produit est transparent : "Pour ce facteur, les données communales ne sont pas encore disponibles. Nous utilisons les données départementales."
On n'invente jamais une donnée manquante.

**Profil incomplet (abandon à mi-onboarding) :**
Le rapport peut être généré avec les données disponibles, en précisant les dimensions non personnalisées. L'utilisateur peut compléter son profil à tout moment pour affiner la lecture.

**Question libre hors scope :**
Si la question posée dans le module Q&R ne concerne pas le climat, la santé environnementale, le logement ou les projets de vie, le produit le dit honnêtement et redirige vers les modules disponibles. Il n'invente pas une réponse pour rester dans la conversation.

**Données sources temporairement indisponibles :**
Si une API source est down au moment de la génération, le rapport est généré avec les données cachées (la plupart des données sont statiques ou mises à jour annuellement). Un bandeau précise la date de la dernière mise à jour des données utilisées.