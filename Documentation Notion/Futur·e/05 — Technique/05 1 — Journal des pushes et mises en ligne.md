# 05.1 — Journal des pushes et mises en ligne

## Règle de lecture

Ce journal ne remplace pas `git log`.  
Il reformule l’historique en séquences produit lisibles :

- **date**
- **commit(s)**
- **ce qui a été poussé**
- **impact visible**
- **notes**

## Workflow actuel

- Les changements sont poussés **directement sur `main`**
- La production suit cette branche
- Il n’y a pas encore de versionning par release (`v0.x`, tags, changelog de prod)
- Certaines journées contiennent plusieurs commits successifs sur un même chantier

## Historique synthétique

### 22/05/2026 — Gestion des cookies : lien de réouverture

**Commits**
- `9425a87` — Gestion des cookies : lien de réouverture de la bannière

**Pages / modules touchés**
- `src/components/ConsentBanner.tsx` — écoute event `futuree:show-consent`
- `src/components/CookieSettingsLink.tsx` — nouveau composant bouton
- `src/components/FutureELanding.tsx` — footer : + Confidentialité + Gestion des cookies
- `(public)/politique-confidentialite/page.tsx` — lien Gestion des cookies fonctionnel

**Impact utilisateur**
- Clic sur "Gestion des cookies" → bannière de consentement réapparaît sans rechargement

**Dépendances externes**
- Aucune

---

### 22/05/2026 — Politique de confidentialité : corrections v2

**Commits**
- `74b8337` — Politique de confidentialité : corrections v2

**Pages / modules touchés**
- `(public)/politique-confidentialite/page.tsx`

**Modifications**
- "santé" → "confort de vie, environnement personnel" (évite les données sensibles RGPD)
- Mention explicite : pas de revente ni publicité comportementale
- Cookies : lien "Gestion des cookies" (à ajouter en footer)
- Nouvelle section enregistrements de session avec mention masquage champs sensibles
- Nouvelle section âge minimum (< 15 ans)
- Transferts US : formulation "clauses contractuelles types UE"

**Dépendances externes**
- Lien "Gestion des cookies" dans le footer à implémenter

---

### 22/05/2026 — PostHog : correction double init + options manquantes

**Commits**
- `119e842` — PostHog : correction double init + pageleave, web vitals, scroll depth

**Pages / modules touchés**
- `instrumentation-client.ts` — seul point d'init, options complètes
- `src/components/PostHogProvider.tsx` — init supprimée, Provider seul

**Impact utilisateur**
- $pageleave, $web_vitals et scroll depth désormais capturés
- Plus de conflit d'initialisation double

**Dépendances externes**
- Aucune nouvelle — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` et `NEXT_PUBLIC_POSTHOG_HOST` déjà requis

---

### 22/05/2026 — Page politique de confidentialité

**Commits**
- `9eefc30` — Ajout de la page Politique de confidentialité

**Pages / modules touchés**
- `(public)/politique-confidentialite/page.tsx` — nouvelle page statique

**Impact utilisateur**
- Lien "En savoir plus" de la bannière de consentement désormais fonctionnel
- Page accessible à `/politique-confidentialite`

**Dépendances externes**
- Aucune

---

### 21/05/2026 — Consent Mode v2 + bannière de consentement

**Commits**
- `b1ee337` — Consent Mode v2 : bannière de consentement + défauts Google

**Pages / modules touchés**
- `src/app/layout.tsx` — script défauts denied injecté avant GTM, ConsentBanner ajouté
- `src/components/ConsentBanner.tsx` — nouveau composant barre basse discrète

**Impact utilisateur**
- Barre de consentement visible au premier chargement, disparaît après choix
- Choix mémorisé en localStorage (`futuree-consent`)
- Analytics et ads désactivés par défaut, activés uniquement si accepté

**Dépendances externes**
- Lien "En savoir plus" pointe vers `/politique-confidentialite` (page à créer si besoin)

---

### 21/05/2026 — Ajout de Google Tag Manager (GTM-NZ9TS3ZF)

**Commits**
- `5fb4a1c` — Ajout de Google Tag Manager (GTM-NZ9TS3ZF)

**Pages / modules touchés**
- `src/app/layout.tsx` — composant `GoogleTagManager` injecté dans le root layout

**Impact utilisateur**
- GTM actif sur l'ensemble du site, prêt à recevoir des tags et triggers depuis l'interface GTM

**Dépendances externes**
- Container ID hardcodé : `GTM-NZ9TS3ZF` (compte GTM existant)
- Aucune variable d'env requise

---

### 21/05/2026 — PostHog : Provider client-side et tracking pageview

**Commits**
- `de231da` — PostHog : ajout du Provider client-side et tracking pageview

**Pages / modules touchés**
- `src/components/PostHogProvider.tsx` — nouveau composant client (init + pageview)
- `src/app/layout.tsx` — wrap de l'app dans PostHogProvider

**Impact utilisateur**
- Tracking pageview actif sur toutes les routes, events custom déjà présents dans le code désormais opérationnels

**Dépendances externes**
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` et `NEXT_PUBLIC_POSTHOG_HOST` à définir dans Vercel et `.env.local`

---

### 21/05/2026 — Ajout de Google Analytics 4

**Commits**
- `a8197cb` — Ajout de Google Analytics 4 (G-MLT5Y4TC6W)

**Pages / modules touchés**
- `src/app/layout.tsx` — composant `GoogleAnalytics` injecté dans le root layout

**Impact utilisateur**
- Tracking GA4 actif sur l'ensemble du site

**Dépendances externes**
- Measurement ID hardcodé : `G-MLT5Y4TC6W` (compte Google Analytics existant)
- Aucune variable d'env requise

---

### 21/05/2026 — Ajout de Microsoft Clarity

**Commits**
- `b8b4e9e` — Ajout de Microsoft Clarity (analytics comportemental)

**Pages / modules touchés**
- `src/components/ClarityInit.tsx` — nouveau composant client
- `src/app/layout.tsx` — intégration dans le root layout

**Impact utilisateur**
- Enregistrement des sessions et heatmaps actifs sur l'ensemble du site dès que la variable d'env est définie

**Dépendances externes**
- `NEXT_PUBLIC_CLARITY_PROJECT_ID` à ajouter dans les variables d'env Vercel (et `.env.local` en dev)
- Le Project ID se trouve dans Clarity > Settings > Overview

---

### 21/05/2026 — Pages auth : copy différenciée connexion / inscription

**Commits**
- `7f853b9` — Pages auth : copy différenciée connexion / inscription

**Pages / modules touchés**
- `(auth)/layout.tsx` — bloc `auth-story` sorti du layout partagé
- `(auth)/connexion/page.tsx` — copy "retour", métriques visuelles (6 / 3 / ∞)
- `(auth)/inscription/page.tsx` — copy "Ce que ce lieu fait à votre vie", liste orientée promesse personnelle

**Impact utilisateur**
- Les deux pages affichent désormais un message distinct, adapté au contexte (retour vs première fois)
- L'inscription communique la promesse de personnalisation plutôt que la description du produit

**Dépendances externes**
- Aucune

---

### 18/04/2026 — Initialisation du projet

**Commits**
- `000fce9` — Initialize Next.js app
- `095d904` — Initial commit
- `3524257` — Resolve README merge conflict
- `a9dc89e` — Add landing page and Supabase setup

**Ce qui a été poussé**
- création du repo applicatif
- base Next.js
- premier ancrage landing
- première connexion Supabase

**Impact visible**
- le projet passe de l’idée au produit codé
- un premier socle technique existe déjà : app, landing, backend léger

**Notes**
- c’est le vrai point de départ du code actuellement visible dans Git

---

### 19/04/2026 — Première landing reliée au module Q&R

**Commits**
- `fa36ba6` — Polish landing and connect Q&A to Claude
- `89d7485` — Fix Vercel build for landing component

**Ce qui a été poussé**
- affinage de la landing
- branchement de la logique Q&R à Claude
- corrections de build pour Vercel

**Impact visible**
- le site commence à ressembler à un objet interactif, pas seulement à une vitrine statique

---

### 20/04/2026 — Premiers signaux DRIAS et instrumentation Vercel

**Commits**
- `ad8039d` — Add DRIAS-backed preview indicators
- `b0ca783` — Install and configure Vercel Speed Insights
- `704d2ec` — Merge pull request #1 from futuree-app/vercel/install-and-configure-vercel-s-8pn7dh
- `8007113` — Install Vercel Web Analytics
- `b911a65` — Merge pull request #2 from futuree-app/vercel/install-vercel-web-analytics-uqms09

**Ce qui a été poussé**
- premiers indicateurs DRIAS visibles dans le produit
- branchement de Speed Insights
- branchement de Web Analytics

**Impact visible**
- début de la lecture climatique à partir de données projetées
- début du suivi réel d’usage côté Vercel

---

### 21/04/2026 — Tunnel d’authentification et espace gratuit

**Commits**
- `85d1a05` — Ship compact DRIAS and magic-link auth
- `2219f35` — Fix prod magic-link redirects and unify auth tunnel
- `295c415` — Fix magic-link auth flow
- `9ad67dd` — Fix auth callback build typing
- `0f2f427` — Simplify email auth flow
- `b6a46f3` — Restore password auth flow
- `907d2af` — Align free account space with product model

**Ce qui a été poussé**
- itérations rapides sur l’auth
- magic link, callback, redirections
- retour partiel au mot de passe
- alignement du compte gratuit avec la promesse produit

**Impact visible**
- l’entrée dans l’espace utilisateur devient exploitable
- premier vrai tunnel d’accès au compte

**Notes**
- cette journée montre que le tunnel d’auth a été un chantier très itératif dès le début

---

### 22/04/2026 — Premier espace compte / rapport cohérent

**Commits**
- `63daa98` — Redesign free account experience
- `bf468e8` — Fix build and update report page
- `de3b3b0` — Add Georisques signals for Quartier
- `f937e17` — Update report page narrative
- `0fbe8c8` — Fix compte page lint and dead links

**Ce qui a été poussé**
- refonte de l’expérience gratuite
- travail sur la page rapport
- premiers signaux Géorisques pour le module Quartier

**Impact visible**
- le compte devient plus crédible comme espace produit
- le rapport commence à sortir du simple prototype

---

### 25/04/2026 — Stabilisation du repo et du build

**Commits**
- `9ed920c` — Restauration et ajout du fichier JSON de données
- `bd77e06` — Ajout de .gitignore pour protéger les fichiers hors projet
- `4667373` — Nettoyage des fichiers de travail et restructuration propre
- `291a373` — Réparation finale : variables d'env et structure
- `ec37da8` — Build réussi : structure corrigée et DashboardExperience restauré

**Ce qui a été poussé**
- nettoyage du dépôt
- correction de la structure
- restauration de composants critiques
- remise en état du build

**Impact visible**
- le projet retrouve une base de travail stable
- la suite du développement peut repartir plus proprement

---

### 26/04/2026 — Refonte structurelle de l’app, design system initial, paywall et wizard

**Commits**
- `d620cb9` à `ec4bd3b`

**Principaux commits**
- `d620cb9` — Correction : reconnexion des flux API et dynamique des composants
- `00ef71d` — fix: gestion robuste des communes PLM et mise à jour du dataset
- `3f291e4` — feat: ajout des pages savoir, système freemium et paywall
- `d77e2ac` — feat: restructure navigation with thematic dropdowns and add savoir hub to landing page
- `bfb0da9` — feat: add CSS design tokens and glass utility to globals.css
- `fbebea1` — refactor: move auth pages to (auth) route group, layout hosts AuthShell
- `54fc745` — refactor: organize app into route groups (account), (dashboard), (public)
- `396fec9` — feat: implement Wizard rapport + design system unification
- `cd0003e` — design: premium wizard redesign — aerated, Stripe-style
- `ec4bd3b` — Ajout du module wizard sur landing et amélioration réponse prompt tension

**Ce qui a été poussé**
- vraie réorganisation App Router
- séparation `(auth)`, `(account)`, `(dashboard)`, `(public)`
- apparition du système freemium et du paywall
- intégration sérieuse du wizard
- premiers tokens design et utilities visuelles

**Impact visible**
- l’architecture actuelle du produit prend forme
- le produit cesse d’être un prototype monobloc
- la landing, l’auth, le compte et le dashboard commencent à parler le même langage

**Notes**
- c’est une des journées les plus structurantes de tout l’historique
- plusieurs commits de cette journée se recouvrent partiellement : à lire comme une refonte continue

---

### 26/04/2026 — Refonte initiale de la landing et du wizard

**Commits**
- `2ab58da` — fix: resolve hydration error, duplicate CSS, and dialog layout
- `cd0003e` — design: premium wizard redesign — aerated, Stripe-style
- `ec4bd3b` — Ajout du module wizard sur landing et amélioration réponse prompt tension

**Ce qui a été poussé**
- première base solide de la landing
- wizard intégré au hero
- correction de bugs de rendu/hydratation

**Impact visible**
- la home commence à ressembler à un vrai produit
- le module de génération de rapport devient central dans l’entrée du site

---

### 27/04/2026 — Premières pages éditoriales et structure de compte

**Commits**
- `6bac2ec` — amélioration page compte et rapport
- `ad1e035` — nouvelles pages voiture agir
- `6e991b6` — ajout menu pages
- `4b4abd7` — ajout pages canicule
- `7cf1dd2` — ajout menu page
- `ed1f4fd` — ajout page inondation et feux de foret

**Ce qui a été poussé**
- premiers hubs et pages éditoriales publiques
- structuration du menu
- premières versions des espaces compte / rapport

**Impact visible**
- le site cesse d’être seulement une landing
- l’architecture éditoriale commence à émerger

---

### 03/05/2026 — Refonte éditoriale de la landing et mise en place du design system

**Commits**
- `cb8d7f5` à `c8000fd`

**Principaux commits**
- `83d7193` — Publish pourquoi future page and landing updates
- `f42440b` — Design system step 1 : tokens, fonts, useTheme, ThemeToggle
- `29a672a` — Design system step 2 : migration hex → tokens dans 4 fichiers
- `52cb9ca` — Design system step 3 : ThemeToggle dans la navbar
- `d9576db` — Ajout MIGRATION_NOTES.md — récapitulatif intégration design system
- `3862198` — drias mediane 17 modeles
- `c4e6b7a` — Géorisques V2 : module logement + données granulaires adresse/parcelle

**Ce qui a été poussé**
- gros travail de copie de landing
- page `pourquoi`
- design tokens + thème clair/sombre
- premières briques sérieuses côté données DRIAS et Géorisques

**Impact visible**
- montée nette en qualité de l’interface
- le site devient cohérent visuellement
- premières vraies briques data reliées au produit

---

### 04/05/2026 — Branchement massif de nouvelles sources

**Commits**
- `420ce32` à `cda0e0e`

**Principaux commits**
- `420ce32` — ATMO : intégration qualité de l'air par commune
- `5cb4bc1` — ATMO : branché sur dashboard, wizard-preview et module logement
- `634ec0e` — IGN Altimétrie + Eaufrance/Hub'Eau : nouvelles sources
- `31a9033` — ADEME DPE : schéma Supabase + lib + API route
- `c573216` — ADEME backend complet
- `749c21f` — Add ADEME commune and IRIS housing data
- `7ae9cf7` — ajout risque vectoriel
- `2366c21` — chaleur et santé mentale

**Ce qui a été poussé**
- enrichissement data très important
- qualité de l’air, eau, altitude, DPE, ZFE, IREP, audits, friches, RGE
- début de densification des pages éditoriales

**Impact visible**
- le produit devient beaucoup plus crédible côté profondeur de données
- les modules commencent à s’appuyer sur de vraies sources croisées

---

### 05/05/2026 au 07/05/2026 — Comparateur et navigation produit

**Commits**
- `5e34829` à `cb359f2`

**Principaux commits**
- `f4813b5` — comparateur
- `af45561` — comparateur
- `eb37659` — comparateur final
- `a09e53c` — amélioration comparateur
- `e7b1678` — landing comparateur
- `7356382` — scenario drias comparateur
- `cb359f2` — ajout chaleur nocturne

**Ce qui a été poussé**
- naissance du comparateur
- intégration dans la landing
- enrichissement des signaux de lecture

**Impact visible**
- nouvel objet de conversion / rétention
- le produit ne repose plus seulement sur la commune seule

---

### 08/05/2026 — Page chaleur et navigation

**Commits**
- `58b4d03`
- `2f5976a`
- `fb42e6c`
- `2d5dcdd`

**Ce qui a été poussé**
- amélioration des blocs commune
- ajustements de navigation
- lancement de la page chaleur
- prise en compte des arrondissements pour chaleur

**Impact visible**
- le thème chaleur devient un vrai pilier du produit public

---

### 09/05/2026 au 11/05/2026 — Hubs publics, top 10, dépendance auto, module logement

**Commits**
- `255fafb` à `7946120`

**Principaux commits**
- `255fafb` — ajout d'une page dédiée aux pro
- `660cd0b` — article préparation citoyens
- `5c72cbe` — ajout page catastrophe
- `a2605e6` — ajout hub inondation
- `568b6f6` — articles top 10
- `cf5dfaf` — amélioration des pages inondation et submersion
- `0f82521` — dépendance automobile hub
- `38ba63c` — réecriture top 10 dependance voiture
- `e6966fd` — ajout module logement
- `655f25e` — amélioration rapport logement
- `296513c` — rapport logement
- `7946120` — refonte logement

**Ce qui a été poussé**
- densification forte des surfaces publiques
- premiers top 10 éditorialisés
- hub dépendance automobile
- montée en puissance du module logement

**Impact visible**
- la partie gratuite devient riche
- le rapport payant commence à avoir une vraie colonne vertébrale

---

### 14/05/2026 — Wizard et données historiques

**Commits**
- `b52c532`
- `af1debe`
- `b904c6e`
- `7ed027d`
- `ba85ef6`

**Ce qui a été poussé**
- amélioration du wizard
- correction de signaux
- ajout de données historiques
- branchement ERA5 métro et DOM

**Impact visible**
- meilleure qualité de lecture temporelle
- la partie climat gagne en profondeur historique

---

### 18/05/2026 — Auth Google et blocage d’indexation

**Commits**
- `7ac173d` — ajout google auth
- `4a040a6` — Block search indexing

**Ce qui a été poussé**
- connexion Google en parallèle de l’auth email/mot de passe
- blocage de l’indexation moteurs en attendant la maturité du produit

**Impact visible**
- onboarding plus fluide
- site maintenu hors indexation SEO volontaire

**Notes**
- blocage en place via metadata `robots` + `public/robots.txt`

---

### 19/05/2026 — Première intégration Stripe / Resend

**Commits**
- `0646217` — feat: intégration Stripe Elements + webhook + Resend
- `7ec46fc` — stripe elements + resend

**Ce qui a été poussé**
- base de paiement Stripe Elements
- webhook Stripe
- intégration Resend
- table `payments`
- page `/merci`

**Impact visible**
- la brique de paiement existe
- la logique backend de conversion commence à être en place

**Notes**
- deux commits proches sur le même chantier : séquence à considérer comme un seul lot fonctionnel

---

### 21/05/2026 — Refonte des pages /checkout

**Commits**
- `e67af8c` — Refonte des pages /checkout/rapport-complet et /checkout/suivi

**Pages / modules touchés**
- `src/app/(public)/checkout/[product]/page.tsx` : refonte complète
- thème par produit (vert pour Rapport, orange pour Suivi)
- sections ajoutées : hero avec badge statut, « Ce que vous obtenez » (4 cartes), timeline en 3 étapes, FAQ inline (4 questions), aside sticky avec récap commande, bande de clôture avec citation
- `/checkout/suivi` : embarque désormais `SuiviWaitlistForm`, marquée `noindex`

**Impact utilisateur**
- les pages de paiement ne sont plus de simples écrans transactionnels : elles racontent ce qu'on achète et rassurent avant le clic
- cohérence visuelle avec la landing et `/suivi-bientot`
- `/checkout/suivi` devient une variante « bientôt » lisible, sans bouton Stripe inactif

**Dépendances externes**
- aucune nouvelle dépendance — Stripe / Resend / Supabase inchangés
- la liste d'attente Suivi sur cette page utilise la même table `suivi_waitlist` (migration `003` déjà requise)

---

### 21/05/2026 — Page « Suivi à venir » + repositionnement landing

**Commits**
- `e67bb78` — Page « Suivi à venir » + repositionnement de la landing

**Pages / modules touchés**
- nouveau : `/suivi-bientot` (coming soon · liste d'attente)
- nouveau : `POST /api/suivi-waitlist` + table `suivi_waitlist` (migration `003`)
- nouveau : composant `SuiviWaitlistForm`
- landing : badge `Recommandé` → `À venir` sur la carte Suivi, ajout d'un badge vert `Disponible maintenant` sur la carte Rapport, CTA Rapport mis en couleur (vert)
- tous les CTAs « S'abonner au Suivi » redirigés vers `/suivi-bientot` avec libellé « Être prévenu·e à l'ouverture » : landing pricing + paywall question, `PaywallGate`, `/comparateur`, `/agir/canicule`, `/agir/pollutions-invisibles`
- copy d'attente harmonisée (`compte`, `rapport`, `WizardTeaser`, hubs `/savoir`, `checkout-products`)

**Impact utilisateur**
- le Suivi n'est plus présenté comme achetable immédiatement : il devient une promesse claire, avec inscription liste d'attente (email + commune facultative + motivation facultative)
- la landing met visuellement en avant le Rapport (vert, disponible maintenant) face au Suivi (orange, à venir)
- les pages paywallées renvoient désormais à `/suivi-bientot` au lieu d'un parcours d'abonnement inactif

**Dépendances externes**
- **Supabase** : exécuter `src/lib/supabase/migrations/003_suivi_waitlist.sql` (création table `suivi_waitlist` + RLS insert anonyme) — sinon l'API renvoie 500
- aucune nouvelle variable d'environnement requise
- pas d'impact Stripe / Resend / OVH

---

### 20/05/2026 — Rebranding domaine + checkout depuis la landing

**Commits**
- `de6e167` — Rebrand domain to futur-e.fr
- `2b027d9` — Add landing checkout flow

**Ce qui a été poussé**
- passage du domaine applicatif vers `futur-e.fr`
- email expéditeur prévu sur `hello@futur-e.fr`
- pages `/checkout/[product]`
- flux landing → auth → checkout → paiement

**Impact visible**
- cohérence marque / domaine
- premier vrai parcours de paiement intégré depuis la landing

**Notes**
- nécessite la mise à jour coordonnée des services externes : Vercel, OVH, Supabase, Google OAuth, Stripe, Resend

---

## État du suivi au 21/05/2026

### Volume Git actuel

- **122 commits** visibles dans l’historique local
- période couverte par le dépôt actuel : **du 18/04/2026 au 20/05/2026**
- ce journal ne détaille pas les 122 commits un par un
- il les regroupe en **séquences de chantier** pour rester lisible

### Ce qui existe

- un historique Git exploitable
- un workflow réel simple : push direct sur `main`
- un produit public déjà dense
- un paiement désormais branché côté app

### Ce qui manque encore

- des tags de version
- un changelog “prod” séparé du simple historique Git
- une distinction claire entre :
  - push code
  - déploiement effectif
  - migration Supabase exécutée
  - configuration externe réalisée

## Convention recommandée à partir de maintenant

Pour chaque lot poussé :

1. **Commit**
   - message clair, orienté chantier

2. **Push**
   - sur `main`

3. **Journal 05.1**
   - ajouter une entrée courte :
     - date
     - commit(s)
     - pages / modules touchés
     - impact utilisateur
     - dépendances externes éventuelles

4. **Si config externe**
   - préciser si le code seul ne suffit pas
   - ex. : Stripe webhook, DNS OVH, Resend, Supabase Auth, variables Vercel
