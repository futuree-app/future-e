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

### 28/05/2026 — Analytics PostHog : tracking complet — wizard, modules, feedback IA, horizon, checkout

**Commits**
- `82e29c3` — feat(analytics): PostHog tracking complet — wizard funnel, modules rapport, feedback IA, catégorie QnA
- `40eaf48` — fix(analytics): sécurisation du tracking PostHog
- `7a5035b` — feat(analytics): finalisation PostHog — région, risk_category, horizon, feedback unifié, checkout, CAS

**Pages / modules touchés**
- `src/lib/posthog-props.ts` — helpers centralisés `buildGeoProps()` (commune, insee_code, département, région) et `buildModuleProps()` (risk_category, module_index) ; `src/lib/regions-fr.ts` (nouveau — 101 départements → 13 régions + 5 DOM-TOM)
- `src/hooks/useModuleTracking.ts` (nouveau) — hook client : `report_module_opened` (`source: "page"`), `report_module_scroll` aux seuils 25/50/75/90 %, `report_module_closed` au démontage avec read_percentage et time_spent_seconds
- `src/components/ModuleTracker.tsx` (nouveau) — composant de montage du hook dans les pages module
- `src/app/(account)/rapport/quartier/page.tsx` et `logement/page.tsx` — ajout de `<ModuleTracker source="page">`
- `src/app/(account)/rapport/RapportTrackedLinks.tsx` — `report_module_opened` avec `source: "hub"` au clic depuis le hub
- `src/components/wizard/ReportWizard.tsx` — `wizard_step_viewed` déclenché une seule fois par étape par session (Set ref) + `wizard_completed` enrichis avec step_index, commune, insee_code, département, région
- `src/components/report/HorizonBar.tsx` — `report_scenario_changed` avec from_scenario / to_scenario et géo complète
- `src/components/AskFuture.tsx` — boutons 👍/👎 par message ; double-événement `ai_feedback_positive` / `ai_feedback_negative` (legacy) + `ai_feedback_submitted` (unifié, recommandé pour dashboards)
- `src/app/qna/route.ts` — enrichissement de `$ai_generation` : `question_category`, `module_id`, `module_context`, `report_id`
- `src/components/PostHogProvider.tsx` — stub `posthog.identify()` pour le CAS (Climate Awareness Score) documenté en commentaire
- `src/app/(public)/checkout/[product]/CheckoutViewedTracker.tsx` — `checkout_started` (plan, price, source) ajouté en complément de `checkout_viewed` (rétrocompat conservé)
- `docs/analytics-posthog.md` (nouveau) — référence complète de la taxonomie : tous les événements, propriétés, valeurs autorisées, filtres PostHog recommandés, limites connues

**Impact utilisateur**
- Aucun changement visible — tracking transparent
- PostHog reçoit désormais : funnel wizard complet, lecture des modules (scroll depth, temps passé), changements d'horizon, feedbacks IA, catégories QnA, données de checkout, géographie (commune → région) sur tous les événements

**Dépendances externes**
- Aucune nouvelle variable d'env ni migration Supabase
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` déjà requis

---

### 28/05/2026 — Carnet de bord Quartier → Supabase + AskFuture

**Commits**
- `2eee0d6` — feat(quartier): connecte le carnet de bord à Supabase et AskFuture
- `e4a1cc5` — fix(profile): corrige l'utilisation de value avant sa déclaration dans PATCH workbook_quartier

**Pages / modules touchés**
- `supabase/10_add_workbook_quartier.sql` (nouveau) — migration : `ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS workbook_quartier jsonb`
- `src/app/api/profile/route.ts` — PATCH accepte le champ `workbook_quartier` (objet JSONB, traité avant la validation FIELDS)
- `src/app/(account)/compte/QuartierWorkbook.tsx` — debounce 1s : synchronise les réponses vers Supabase après chaque modification, en plus du localStorage
- `src/app/api/ask/route.ts` — `buildUserProfileText()` intègre les observations du carnet (vécu estival, exposition eau, état du bâti) avec labels lisibles dans le prompt d'AskFuture

**Impact utilisateur**
- Les réponses du carnet de bord (module Quartier) sont persistées en base et survivent à un changement d'appareil ou à la suppression du cache
- AskFuture les utilise automatiquement : une question sur la chaleur ou l'inondation tient compte des observations terrain de l'utilisateur

**Dépendances externes**
- **Supabase** : exécuter `supabase/10_add_workbook_quartier.sql` — `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS workbook_quartier jsonb;`

---

### 28/05/2026 — Refonte module Quartier : données territoriales, inondation, layout, textes

**Commits**
- `a5c9ae5` — feat(quartier): refonte module Quartier — données territoriales, inondation, layout et textes

**Pages / modules touchés**
- `src/app/(account)/rapport/quartier/page.tsx` — hero pleine largeur (suppression de l'aside vertical), fetch `getGeorisquesSummary` en parallèle de `gatherCommuneEnrichment`, boutons "Retour au rapport" et "Changer l'horizon temporel" (ancre `/rapport#horizon`) sous la grille de données, CTA "Module Logement", bloc upsell masqué pour les comptes payants
- `src/components/report/QuartierClimatData.tsx` — `QuartierAside` restructuré en grille horizontale 4 colonnes ; `QuartierSectionTitle` : nouveau composant client avec titre dynamique horizon-aware ; ajout indicateur "Jours chauds > 30°C" ; suppression PM2.5 (déplacé vers module Santé) ; ajout cartes "Inondation fluviale" et "Submersion marine" via Géorisques ; textes narratifs réécrits sans citations de sources ni abréviations techniques, tirets cadratins supprimés, ton éditorial futur·e ; libellés incendie nuancés (indice météo ≠ risque réel)
- `src/app/(account)/rapport/page.tsx` — en-tête unifié free/payant, MODULE_BENEFIT mis à jour pour les 6 modules, hub payant simplifié ("Vos six dimensions, pour vous."), ancre `id="horizon"` sur le wrapper HorizonBar
- `src/app/(account)/compte/QuartierWorkbook.tsx` — accordéon fermé par défaut, description courte visible à l'état fermé, progression toujours visible

**Impact utilisateur**
- La grille de données (chaleur, inondation, submersion, incendie…) s'affiche en horizontal sous le titre, sans espace vide
- Le titre de section se génère dynamiquement depuis les données : "18 jours de chaleur en 2050, La Rochelle exposée aux inondations et submersion marine."
- Les risques inondation et submersion marine sont maintenant affichés pour les communes concernées (données Géorisques)
- Le workbook d'observations terrain est fermé par défaut : moins intrusif tant que les réponses ne sont pas exploitées
- Le hub rapport a un en-tête et des descriptions de modules plus précis

**Dépendances externes**
- `getGeorisquesSummary` : déjà intégré, aucune nouvelle clé requise
- Les risques inondation/submersion sont identifiés à l'échelle communale via GASPAR (Géorisques API)

---

### 28/05/2026 — Horizon temporel partagé, module Quartier réactif, harmonisation températures France

**Commits**
- `7fc0f7e` — feat(horizon): HorizonBar partagé + useHorizon hook + QuartierClimatData réactif + harmonisation °C France

**Pages / modules touchés**
- `src/hooks/useHorizon.ts` — nouveau hook client : lit/écrit `futuree:horizon` dans localStorage, exposé `HorizonKey`, `HORIZON_META` (year + france par GWL) et `useHorizon()`. Default `gwl20`. SSR-safe via `useEffect`.
- `src/components/report/HorizonBar.tsx` — refonte : pills + tagline uniquement (plus de cartes DRIAS). Props `{ communeName, locked? }`. `locked=true` force gwl20, grise les pills, affiche une bannière upsell. Les labels des pills utilisent les températures France (+2°C / +2,7°C / +4°C).
- `src/components/report/QuartierClimatData.tsx` — nouveau fichier : deux composants client `QuartierAside` et `QuartierDataBody` qui réagissent au hook `useHorizon()`. Reçoivent les 3 scénarios DRIAS sérialisés en props depuis le server component. `buildFactors()` et `buildParagraphs()` construisent chaleur, nuits tropicales, air PM2.5 et risque feu selon l'horizon actif.
- `src/app/(account)/rapport/page.tsx` — `dynamic = "force-dynamic"`, HorizonBar branché sur la vraie commune utilisateur (`home_commune`), `CommuneSetupBanner` pour les comptes sans commune. Plus de `getClimatDataCommune`.
- `src/app/(account)/rapport/quartier/page.tsx` — server component refactorisé : charge tous les scénarios via `gatherCommuneEnrichment`, extrait `scenarios` et `pm25`, passe en props à `QuartierAside` et `QuartierDataBody`.
- `src/components/report/LogementModule.tsx` — suppression du bloc "Trajectoire climatique" (doublon avec le module Quartier). Ajout d'un avertissement doux si l'adresse saisie est dans une commune différente de la commune de résidence déclarée.
- `src/app/api/georisques-logement/route.ts` — suppression de `getClimatDataCommune` : l'appel DRIAS n'est plus fait dans cette route, réduisant la latence de la réponse logement.
- Harmonisation des températures France scope dans tous les fichiers concernés : gwl15 → +2°C, gwl20 → +2,7°C, gwl30 → +4°C (référence DRIAS / TRACC-2023, projection France métropolitaine).

**Impact utilisateur**
- L'horizon temporel (2030 / 2050 / 2100) est maintenant partagé entre les modules via localStorage : choisir son horizon dans le hub `/rapport` l'applique automatiquement au module Quartier et aux prochains modules.
- Les comptes gratuits voient les pills grisées et ne peuvent lire que le scénario médian 2050.
- Le module Quartier affiche des données climatiques réactives à l'horizon sélectionné (chaleur extrême, nuits tropicales, qualité de l'air, risque feu).
- Le module Logement n'affiche plus la trajectoire climatique (celle-ci est dans le module Quartier) : page plus lisible et sans doublon.
- Si un utilisateur analyse une adresse hors de sa commune déclarée, un avertissement doux l'en informe.
- Les températures France sont harmonisées et exactes partout dans l'application.

**Dépendances externes**
- Aucune nouvelle variable d'env ni migration Supabase
- `gatherCommuneEnrichment` déjà en place — les 3 scénarios GWL sont déjà dans la réponse DRIAS

---

### 27/05/2026 — Modules Quartier et Logement sur données réelles + plan-aware + nettoyage UX

**Commits**
- `3ab7c57` — feat(rapport): modules Quartier et Logement connectés aux données réelles
- `7d53743` — fix(compte): page plan-aware — affichage correct pour abonnés suivi/foyer
- `4283bf8` — chore(ux): suppression mentions temporelles sur les modules
- `bdfb144` / `441f126` — suppression puis revert du forfait rapport (nettoyage partiel, annulé le même soir)

**Pages / modules touchés**
- `src/app/(account)/rapport/quartier/page.tsx` — données DRIAS (jours chaleur, nuits tropicales, incendie) et ADEME (PM2.5) chargées dynamiquement depuis la commune du profil ; `CommuneSetupBanner` si commune absente ; fin du hardcodé La Rochelle
- `src/app/(account)/rapport/logement/page.tsx` — commune du profil pré-remplit le placeholder adresse
- `src/app/api/georisques-logement/route.ts` — projections DRIAS de la commune de l'adresse analysée intégrées ; bloc "Trajectoire climatique 2050" dans l'onglet Synthèse
- `src/components/report/LogementModule.tsx` — avertissement doux si l'adresse analysée est hors commune déclarée
- `src/app/(account)/compte/page.tsx` — label plan dynamique (`getPlanLabel`), hero/CTAs/aside différenciés abonnés vs gratuit, modules déverrouillés visibles sans upgrade band pour les abonnés
- `src/app/(account)/rapport/page.tsx` et `compte/page.tsx` — suppression des badges "En construction" / "Bientôt" / "prochainement"

**Impact utilisateur**
- Le module Quartier affiche les vraies données climatiques de la commune de l'utilisateur (fin du hardcodé La Rochelle)
- Le module Logement intègre les projections DRIAS de la commune de l'adresse analysée
- La page Compte adapte son discours au plan réel : les abonnés ne voient plus les blocs d'upsell
- Les badges temporaires "En construction" disparaissent

**Dépendances externes**
- Aucune nouvelle

---

### 26/05/2026 — Mémoire, contrôle d'accès AskFuture, commune dynamique

**Commits**
- `db642de` — feat(memoire): page Mémoire + contrôle d'accès AskFuture + commune dynamique

**Pages / modules touchés**
- `src/app/(account)/compte/memoire/page.tsx` — nouvelle page : lecture et édition des informations de profil (chauffage, isolation, présence d'enfants, véhicule, sensibilités, projets…). Commune affichée en lecture seule pour free/one_shot, modifiable pour suivi/foyer via autocomplete geo.api.gouv.fr
- `src/components/MemoireForm.tsx` — formulaire client complet : TextField, SelectField, BooleanField, ArrayField, CommuneBlock avec autocomplete, effacement global
- `src/app/api/profile/route.ts` — PATCH (champ par champ + cas spécial commune) et DELETE (scope "ask_collected")
- `src/components/AskFutureMount.tsx` — gate par plan : free → non monté ; one_shot → monté avec quota 3 questions (comptées dans ask_conversations) ; suivi/foyer → illimité
- `src/components/AskFuture.tsx` — affichage du compteur de questions restantes, bannière "quota atteint" avec lien /checkout/suivi, incrémentation locale après chaque réponse
- `src/components/ask-future.css` — styles quota (compteur, bannière, CTA)
- `src/app/api/ask/route.ts` — gate serveur : 403 pour free, 403 si ≥ 3 questions pour one_shot (double protection côté API)
- `src/app/(account)/compte/page.tsx` — lecture de home_commune depuis user_profiles, "La Rochelle" hardcodé remplacé partout par la valeur réelle, bannière CommuneSetupBanner pour les nouveaux comptes sans commune
- `src/components/CommuneSetupBanner.tsx` — bloc horizontal compact avec autocomplete, sauvegarde via PATCH /api/profile et refresh Next.js

**Impact utilisateur**
- Les comptes gratuits ne voient plus AskFuture
- Les acheteurs du Rapport ont 3 questions incluses avec indicateur visuel
- Les abonnés Suivi/Foyer ont un accès illimité et peuvent modifier leur commune
- Les nouveaux comptes (ex. OAuth Google) voient une bannière de saisie de commune dès l'arrivée dans /compte
- "La Rochelle" n'est plus hardcodé : la page compte affiche la vraie commune de l'utilisateur

**Dépendances externes**
- Aucune nouvelle — Supabase migration 09 déjà requise (colonnes ajoutées précédemment)
- `ANTHROPIC_API_KEY` déjà requise pour AskFuture

---

### 26/05/2026 — Observability LLM + correctifs TypeScript Mémoire

**Commits**
- `1de06fb` — feat(observability): tracing LLM Anthropic → PostHog via OpenTelemetry
- `3eca0d7` / `93d939d` / `0065543` — fix(memoire): correctifs TypeScript sur le type `SaveFn` (commune en tant que `Record`)

**Pages / modules touchés**
- `instrumentation.ts` (nouveau) — tracing OpenTelemetry : enregistre chaque appel AskFuture dans PostHog LLM Analytics (prompts, réponses, tokens, latence, coût estimé)
- `src/components/MemoireForm.tsx` — typage `SaveFn` élargi pour accepter le champ `commune` sous forme d'objet `{ name, inseeCode }`

**Impact utilisateur**
- Aucun impact visible
- Chaque conversation AskFuture est désormais traçable dans PostHog avec coût et performance

**Dépendances externes**
- Aucune nouvelle variable d'env — le tracing utilise la clé PostHog déjà requise

---

### 26/05/2026 — Ask Futur·e : assistant IA territorial

**Commits**
- `d4d9c7e` — feat(ask): assistant IA territorial — Ask Futur·e

**Pages / modules touchés**
- `src/app/api/ask/route.ts` — route principale : reçoit la question + l'historique, charge le contexte territorial (ADEME, DRIAS, Hub'Eau), appelle Claude, renvoie réponse + éventuelle question de profil
- `src/app/api/ask/context/route.ts` — pré-warm du contexte : déclenché silencieusement à la première ouverture du chat, pour que la vraie première question soit déjà rapide
- `src/components/AskFuture.tsx` — composant chat complet (bouton flottant, fenêtre, bulles, gestion des profil-questions)
- `src/components/AskFutureMount.tsx` — point de montage client : lit le profil Supabase pour injecter `communeInsee` et `communeName`
- `src/components/ask-future.css` — styles du chat (bouton flottant, overlay, bulles, responsive)
- `src/lib/commune-enrichment.ts` — enrichissement de la commune (données ADEME, DRIAS, Hub'Eau) pour construire le contexte IA
- `src/lib/eaufrance.ts` — fix du parsing de conformité eau (codes `"C"`/`"N"` au lieu de libellés complets)
- `supabase/09_init_ask_conversations.sql` — schéma DB : table `ask_conversations` pour l'historique des échanges par session
- `src/app/(account)/layout.tsx` et `src/app/(dashboard)/layout.tsx` — ajout de `AskFutureMount` dans les deux layouts

**Impact utilisateur**
- Un bouton flottant "Ask Futur·e" apparaît dans l'espace compte et le dashboard
- L'utilisateur peut poser des questions sur son territoire : risques climatiques, qualité de l'eau, données énergétiques…
- L'IA répond avec le contexte de la commune déjà chargé (pas de saisie répétée de la commune)
- Si l'IA manque de données profil, elle peut poser une question ciblée avec des options de réponse rapide

**Dépendances externes**
- **Variable d'env** : `ANTHROPIC_API_KEY` (ou clé Claude) requise côté serveur — à vérifier dans Vercel
- **Supabase** : exécuter `supabase/09_init_ask_conversations.sql` pour créer la table `ask_conversations`
- Les sources de données (ADEME, DRIAS, Hub'Eau) utilisent les routes API existantes — aucune nouvelle clé requise

---

### 22/05/2026 — PostHog : événements transversaux, identify utilisateurs, suppression Clarity

**Commits**
- `1dc6308` — chore(analytics): suppression Microsoft Clarity — couvert par PostHog
- `6e14fd2` — feat(analytics): PostHog identify — lie les events aux profils utilisateurs connectés
- `5662c4a` — chore: retrait des fichiers non-source du suivi git (logo, docs Notion, wizard reports)
- `50b71db` / `96fea33` / `6024136` / `043c479` — corrections proxy PostHog, réinstall propre, redéploiements

**Pages / modules touchés**
- `src/components/PostHogProvider.tsx` — `posthog.identify(user.id, { email })` au montage et sur chaque `SIGNED_IN` ; `posthog.reset()` sur `SIGNED_OUT` — lie tous les événements PostHog à l'utilisateur Supabase connecté
- `src/components/ClarityInit.tsx` — supprimé (Microsoft Clarity retiré, couvert par PostHog)
- `src/app/layout.tsx` — retrait du composant Clarity
- `src/app/auth/actions.ts` — events `user_logged_in`, `user_signed_up`, `user_signed_out` (serveur via posthog-node)
- `src/app/qna/route.ts` — event `$ai_generation` (premier câblage, enrichi ensuite le 28/05)
- `src/app/(account)/rapport/RapportTrackedLinks.tsx` — `report_module_opened` (version initiale)
- `src/app/(public)/checkout/[product]/CheckoutViewedTracker.tsx` — `checkout_viewed`
- `src/components/wizard/ReportWizard.tsx` — `wizard_completed` (version initiale)
- `src/components/GoogleSignInButton.tsx` — `google_sign_in_clicked`
- `src/components/LandingComparatorInput.tsx` — `comparator_commune_selected`
- `src/components/SuiviWaitlistForm.tsx` — `suivi_waitlist_joined`
- `.gitignore` — logo/, Documentation Notion/, posthog-setup-report.md exclus du suivi

**Impact utilisateur**
- Aucun impact visible
- Les events PostHog sont désormais liés aux profils utilisateurs connectés (identify)
- Microsoft Clarity retiré définitivement

**Dépendances externes**
- `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` et `NEXT_PUBLIC_POSTHOG_HOST` requis (déjà présents)

---

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

---

### 28/05/2026 — Unification navbar, reformulation cards landing, barre de chargement, switch temporel

**Commits**
- `4e48f6b` — Unification navbar (AccountNav → Navbar avec prop `ctas`)
- `c4663dc` — Barre de chargement animée sur le panneau héro droit
- `73fe3a2` — Reformulation cards héro + suppression ligne source
- `ec51cd5` — Switch temporel 2030 / 2050 / 2100 sur les cards de tension

**Ce qui a été poussé**

*Navbar unifiée*
- `AccountNav` supprimé — remplacé par `Navbar` (même composant que la landing) sur toutes les pages `/compte`, `/rapport`, `/rapport/quartier`, `/rapport/logement`, `/compte/memoire`
- `Navbar` accepte maintenant une prop optionnelle `ctas` pour personaliser les deux boutons selon le contexte

*Barre de chargement héro*
- fine barre orange animée (shimmer) au-dessus des preview cards droites pendant le fetch commune (DRIAS + Géorisques + GisSol)
- valeurs des cards atténuées (opacity 0.35) pendant le chargement

*Reformulation des preview cards*
- tous les `val` des 4 cards héro réécrits en phrases complètes avec le nom de la commune interpolé
- suppression du badge source sur la landing (gardé uniquement dans le rapport)
- mise à jour des cards hardcodées (Lyon, Marseille, Vannes, La Rochelle)

*Switch temporel*
- nouveau composant `HorizonSwitch.tsx` : pill "Aujourd'hui / 2030 / 2050 / 2100" avec sublabels +2°C / +2.7°C / +4°C
- s'affiche au-dessus des 4 cards de tension dès qu'une commune est saisie
- 8 tensions projetables (canicule, feux, eau, vigne, randonner…) : subtitle bascule vers les chiffres DRIAS du GWL correspondant — sans nouvelle requête réseau (données déjà chargées)
- autres tensions : subtitle statique + mention discrète "données actuelles · projection temporelle non disponible" quand un horizon futur est sélectionné

**Impact visible**
- menu cohérent sur toutes les pages de l'app connectée
- transition visuellement propre quand une commune est saisie sur la landing
- cards héro lisibles et personnalisées (retour utilisateur adressé)
- première démonstration interactive de la valeur temporelle de futur•e : l'utilisateur voit comment son territoire change dans le temps

**Dépendances externes**
- aucune
- données DRIAS déjà présentes dans `public/data_climat.json` pour les trois GWL

---

### 28/05/2026 — Landing : réorganisation sections + analytics transversaux

**Commits**
- `45b4eac` — feat(landing): interversion sections — 6 modules avant Pourquoi s'abonner
- `fc6b5ad` — fix(analytics): correction des propriétés PostHog manquantes ou mal nommées
- `52b929c` — feat(analytics): territory_compared, report_link_copied, pricing_page_viewed

**Pages / modules touchés**
- `src/components/FutureELanding.tsx` — la section "6 modules" (preuve produit) remonte avant la section "Pourquoi s'abonner" (pricing) : l'utilisateur voit la valeur avant l'appel à l'action
- `src/components/wizard/ReportWizard.tsx` — taxonomie `wizard_step_viewed` corrigée : noms d'étapes stabilisés (`landing / adresse / profil_foyer / logement / mobilite / generation`) + `step_name` ajouté comme alias de `step`
- `src/components/ComparatorSearch.tsx` — event `territory_compared` déclenché sur "Lancer la comparaison" avec `commune_a`, `insee_a`, `commune_b`, `insee_b` ; event `report_link_copied` sur "Copier le lien"
- `src/components/FutureELanding.tsx` — event `pricing_page_viewed` via IntersectionObserver (seuil 20%) sur `<section id="pricing">`, déclenché une seule fois par montage

**Impact utilisateur**
- Ordre de lecture amélioré : les preuves concrètes (modules) précèdent la conversion
- Aucun impact visible sur l'analytics

**Dépendances externes**
- Aucune

---

### 28-29/05/2026 — Switch temporel : correctifs placement et refonte narrative

**Commits**
- `49e10e5` — fix(landing): switch temporel — placement hero + style inline
- `6e3e83a` — refactor(landing): switch temporel narratif — ton par horizon, chiffres secondaires

**Pages / modules touchés**
- `src/components/HorizonSwitch.tsx` — pills épurées : sublabels "+2°C" retirés des boutons, ligne contextuelle séparée sous le switch ("projection +2,7°C · DRIAS TRACC-2023") ; style inline complet (compatibilité Tailwind v4 purge)
- `src/components/FutureELanding.tsx` — placement du switch corrigé dans le hero droit ; basculement en narratives par horizon : chaque card affiche une phrase immersive selon l'horizon choisi (texte de tension plutôt que chiffre brut) ; données chiffrées reléguées en position secondaire (`note`), non affichées en render landing

**Impact visible**
- Interface plus lisible : les boutons de sélection temporelle ne sont plus chargés
- Les cards communiquent une tension narrative ("les nuits sans fraîcheur deviennent plus fréquentes") plutôt qu'un chiffre brut

**Dépendances externes**
- Aucune

---

### 29/05/2026 — Narratives DRIAS immersives, CTA rapport, navbar comparateur, fix catégorie

**Commits**
- (lot non encore committé au moment de la rédaction — commit de session)

**Pages / modules touchés**

*Narratives DRIAS — FutureELanding.tsx*
- 5 indicateurs prioritaires câblés : `NORTX35D_yr` (Canicule), `NORTR_yr` (Nuits tropicales), `NORRRq99_yr` (Pluies extrêmes), `NORIFM40_yr` (Feux), `NORSWI04_yr` (Eau/sécheresse)
- Chaque indicateur dispose de 4 phrases distinctes par horizon (aujourd'hui / 2030 / 2050 / 2100), plates, sans seuils numériques — chiffres conservés dans `note` pour usage futur mais non affichés sur la landing
- Architecture des cards : bloc 1 Canicule (universel), bloc 2 catégorie (Feux/Eau/Vigne/Neige selon profil géographique), bloc 3 Nuits (universel), bloc 4 Pluies (universel), bloc 5 Géorisques horizon-aware, bloc 6 statiques
- `getQuestionIntro` réécrit avec ton immersif et territorial par catégorie (méditerranée, littoral, montagne, vectoriel, all)
- Limit Q&A gratuite réduite : `LANDING_QNA_LIMIT = 1` (était 2)
- Suppression du texte "données actuelles · projection temporelle non disponible" dans le bloc Q&R
- Suppression du rendu des chiffres (`note`) dans les cards — contenu narratif seul en partie gratuite

*CTA rapport*
- Bloc "50+ indicateurs" ajouté sous les cards dans le panneau héro droit (visible uniquement si commune saisie) : texte contextuel, lien vers `/checkout/rapport-complet`, lien vers `/comparateur`, mention "50+ indicateurs climatiques, sanitaires et territoriaux" en monospacé

*Navbar comparateur*
- `src/app/(public)/comparateur/page.tsx` — remplacement de la nav sur mesure par `<Navbar />` (composant partagé), cohérence avec toutes les autres pages de l'app

*Fix catégorie géographique*
- `src/lib/commune-categories.ts` — correction typo `'mediteranee'` → `'mediterranee'` (ligne 54) : les communes du Sud (Perpignan, Marseille, Nice…) recevaient une catégorie inconnue, les empêchant d'obtenir les cards DRIAS spécifiques (Feux, Vigne)

*Explorer menu*
- `src/config/navigation.ts` — descriptions conservées mais sources retirées (ex. "Jours > 30 °C, nuits tropicales" sans "· DRIAS 2050") : menu plus épuré sans attribution technique

**Impact visible**
- Cards landing entièrement narratives : plus de chiffres bruts en accès libre, ton engageant par commune et par horizon
- Comparateur : menu cohérent avec le reste du site
- Perpignan et toutes les communes méditerranéennes reçoivent désormais les bonnes cards de catégorie

**Dépendances externes**
- Aucune — `NORRRq99_yr` (column15) déjà présent dans `public/data_climat.json`
