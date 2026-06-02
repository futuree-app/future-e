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

### 01/06/2026 — Comparateur « Où vivre » : gate sémantique, gloses visibles + réassurance moteur

**Commits**
- `71861a3` — feat(comparateur): gate sémantique, gloses visibles + réassurance moteur

**Pages / modules touchés**
- `src/lib/comparateur-labels.ts` — `PREFERENCE_INTERPRETATIONS` (table de gloses) + `preferencesToInterpreted()` : porte l'interprétation visible (glose) à côté de chaque libellé de critère. Pur affichage, aucun impact sur le score.
- `src/app/(public)/ou-vivre/OuVivreClient.tsx` — au gate « ce que nous avons compris » : gloses affichées sous les puces (serif italique, connecteur `→`) pour les faux amis / polysémies (doux, calme, ensoleillé, proximité mer, vie locale) ; micro-réassurance réécrite (20+ indicateurs publics projetés à 2050, 34 000 communes) ; bouton principal « Lancer l'analyse » (au lieu de « C'est bien ça 👍 ») ; suppression du disclaimer périmètre (écoles/prix/métier) ; bouton « Découvrir ce territoire » allégé (police + centrage) ; phrase de chargement alignée sur 34 000 communes.

**Impact utilisateur**
- Le gate ne dit plus seulement « j'ai compris », il montre **comment** il a compris : chaque critère ambigu porte l'interprétation réelle du moteur (ex. « doux → hivers tempérés, étés sans excès »), ce qui désamorce les malentendus silencieux identifiés par l'audit sémantique.
- Réassurance recentrée sur la profondeur (indicateurs + projection climatique 2050) plutôt que sur le seul volume de communes.
- Aucun changement de score ni de classement.

**Dépendances externes**
- Aucune nouvelle variable d'env, aucune donnée nouvelle, aucune migration.

**Notes**
- Chantier issu de `AUDIT_SEMANTIQUE_COMPARATEUR.md` (recommandation n°1, « pédagogie au gate »). Spec : `docs/superpowers/specs/2026-06-01-gloses-visibles-hors-mesure-design.md`.
- Volet « honnêteté hors-mesure » (champ `horsMesure` au parse pour nature / authentique / chaleureux) **non livré** dans ce lot, repoussé volontairement : on valide d'abord la pédagogie sur les critères déjà mesurés.

---

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

---

### 29/05/2026 — Landing : bloc rapport remonté, wizard → checkout, lien commune Q&R

**Commits**
- (lot de session — commit unique)

**Pages / modules touchés**

*Bloc "Rapport personnalisé" remonté*
- `src/components/FutureELanding.tsx` — le bloc CTA "Rapport personnalisé / Votre rapport en 2 minutes." est déplacé avant la section "Pourquoi s'abonner" (était après) : l'appel à l'action produit précède le texte éditorial long

*Wizard → checkout*
- `src/components/wizard/WizardTeaser.tsx` — le bouton final du wizard "Débloquer mon rapport complet — 14€" pointe désormais vers `/checkout/rapport-complet` (était `/paiement`, page inexistante)

*Lien commune cliquable dans le bloc Q&R*
- `src/components/FutureELanding.tsx` — dans l'état vide du bloc Q&R (aucune commune saisie), "Saisissez votre commune." devient un bouton cliquable : scrolle vers le champ de saisie en haut du hero et le met en focus ; le champ reçoit l'`id="commune-input"` pour cibler l'action

**Impact visible**
- Le wizard ne renvoie plus vers une URL cassée
- L'utilisateur qui arrive sur le Q&R sans commune peut cliquer directement sur le texte pour être ramené au champ de saisie

**Dépendances externes**
- Aucune

---

### 29/05/2026 — Module Quartier : sécheresse (VigiEau + ONDE), ADEME territoire, fix bug DRIAS columns + régénération JSON

**Commits**
- (à compléter après commit)

**Pages / modules touchés**

*Phase 0 — hygiène et câblage de données déjà fetchées*
- `src/components/report/QuartierClimatData.tsx` — retrait de `pm25` (récupéré et ignoré via `void pm25`, angle Santé pas Quartier) ; branchement de `drought` (Hub'Eau ONDE, écoulements terrain) et `territoire` (ADEME communeData) ; carte « Taux de boisement » ajoutée
- `src/app/(account)/rapport/quartier/page.tsx` — extraction de `drought`, `territoire`, `vigieau` depuis `gatherCommuneEnrichment` et propagation aux composants
- `src/lib/eaufrance.ts` — fix bug détection assec : `obs.includes("écoul")` matchait à tort « Écoulement visible acceptable » ; remplacé par `obs.includes("assec") || obs.includes("non visible")` (seuls libellés ONDE indiquant un cours d'eau réellement à sec)

*Nouvelle source — VigiEau / Propluvia (arrêtés sécheresse préfectoraux)*
- `src/lib/vigieau.ts` (nouveau) — `getVigieauSummary(insee)` interroge `api.vigieau.gouv.fr/api/zones?commune=` ; retourne le niveau de gravité le plus élevé en cours sur la commune (vigilance / alerte / alerte renforcée / crise / aucune restriction) + nom du bassin et période de validité. Couverture 100% France. Cache `next: { revalidate: 3600 }` + cache mémoire par commune. Fallback `{ maxLevel: null, zones: [] }` en cas d'échec API
- `src/lib/commune-enrichment.ts` — `gatherCommuneEnrichment` ajoute `vigieau` à `EnrichmentResult` ; fetché en parallèle des autres sources
- `src/components/report/QuartierClimatData.tsx` — carte « Restrictions sécheresse » (couleur calée sur le niveau : vert / orange / rouge selon gravité) ; paragraphe narratif sécheresse unifié en arc temporel à 3 signaux : présent administratif (VigiEau) + présent observation terrain (ONDE si commune avec station rurale) + futur modélisé (DRIAS SWI04, horizon courant)

*Bug correction — mapping de colonnes DRIAS faux dans l'app entière*
- `scripts/build-drias-median.js` — sélectionne désormais le fichier source ayant le **plus d'indicateurs** comme référence d'ordonnancement canonique (au lieu du premier alphabétique) ; ajoute la couverture par indicateur dans les métadonnées (`indicator_coverage_by_models`) ; conserve `canonical_source_file` et `indicator_order` pour traçabilité
- `public/data_climat.json` — régénéré : 35 006 communes × 3 scénarios × 30 indicateurs (au lieu de 28). Les 28 indicateurs standards sont couverts par 17/17 modèles, NORIFM40_yr et AIFM40_yr par 10/17 modèles (les modèles WRF381P, ALADIN63_HadGEM2, HIRHAM5, HadREM3-GA7, RegCM4-6_MPI-ESM ne fournissent pas l'indicateur feu)
- `data/drias_median_metadata.json` — régénéré avec les nouveaux champs
- `src/lib/drias-json.ts` — COLUMN_MAP corrigé : `NORRRq99_yr` passe de column15 → column14 (était décalé), `NORRx1d_yr` de column16 → column15, ajout de `NORRRq99refD_yr: column16`, `NORIFM40_yr: column17` (rétabli, était indisponible), `NORSWI04_yr: column18` (correct par hasard mais valeur était fausse)

**Impact visible**

*Module Quartier (`/rapport/quartier`)*
- Aside passe de 6 à 9 cartes : ajout de « Restrictions sécheresse » (VigiEau), « Sécheresse des sols » (DRIAS SWI04 vraies données), « Taux de boisement » (ADEME). Layout 4+4+1 temporaire en `grid-cols-4` jusqu'à intégration des prochains indicateurs (P1 GASPAR, P4 BDIFF, P8 INSEE équipements) qui combleront pour 12 cartes (3 × 4)
- Paragraphe sécheresse unifié : pour La Rochelle 2050 par exemple, lit désormais « La Rochelle est actuellement en vigilance sécheresse sur le bassin du Curé - Sèvre Niortaise jusqu'au 31 octobre 2026 (VigiEau, Propluvia). À l'horizon 2050, le sol de la commune serait sec environ 145 jours par an (DRIAS, indice SWI < 0,4). »
- Carte « Conditions météo favorables au feu » : valeur corrigée. Avant le bug DRIAS, elle affichait en réalité la sécheresse des sols sous un label feu (ex : 150 j/an annoncés comme feu pour La Rochelle GWL30, en fait du SWI04). Désormais : ~9-10 j/an, cohérent avec la côte atlantique humide

*Cascades positives ailleurs (le bug DRIAS faussait silencieusement plusieurs pages)*
- `src/app/(public)/comparateur/page.tsx` — la colonne « jours risque feu » retrouve la vraie donnée NORIFM40_yr
- `src/app/(public)/inondation/[insee_code]/page.tsx` et `villes-les-plus-exposees/page.tsx` — les scores NORRRq99_yr / NORRx1d_yr étaient calculés avec des colonnes décalées d'un cran : ils étaient faux, désormais corrects
- `src/components/FutureELanding.tsx` — narratives feux et précipitations extrêmes retrouvent leurs vraies valeurs
- `src/app/api/ask/route.ts` — Q&R peut citer les jours risque feu avec la bonne valeur

**Validation croisée**
- Commune test au hasard : Radepont (27487, Eure). Valeurs JSON GWL15 / GWL20 / GWL30 recalculées indépendamment depuis les 17 fichiers source bruts : médianes identiques à la décimale pour NORTX30D_yr (7,7 / 11,9 / 18,2), NORIFM40_yr sur 10 modèles (2 / 4 / 7,5), NORSWI04_yr sur 17 modèles (128 / 136 / 148). Validation OK
- Commune test La Rochelle (17300) GWL30 : NORIFM40_yr = 9,5 j/an (plausible côte atlantique), NORSWI04_yr = 150 j/an (plausible)

**Dépendances externes**
- **VigiEau API** (`api.vigieau.gouv.fr/api`) : licence publique, sans clé, sans rate-limit annoncé. Si l'API tombe, fallback silencieux `maxLevel: null` (carte affiche « Aucune restriction » en vert), pas de crash
- Aucune migration Supabase, aucune nouvelle variable d'env

**Ce qui manque ensuite (Phase 1 du plan d'action)**
- Synthèse Claude streamée par défaut sur les modules Quartier et Logement (sortir l'IA de derrière le bouton, AI SDK 6 `streamText` via Vercel AI Gateway)
- Croisement DPE × climat dans Logement
- Coûts rénovation ADEME + carte RGE à proximité dans Logement (libs `renovation.ts` et `rge.ts` déjà présentes, jamais affichées)
- Intégration des sources Couche 2 prioritaires : P1 GASPAR (CatNat historiques), P4 BDIFF (incendies historiques), P11 zonage H1/H2/H3, P8 équipements INSEE
- La carte « Conditions feu » repose sur 10/17 modèles seulement (les modèles WRF, ALADIN_HadGEM2, HIRHAM5, HadREM3-GA7, RegCM4-6_MPI-ESM ne publient pas NORIFM40_yr). La médiane reste valide mais moins robuste que les autres indicateurs — à noter si on étend l'usage de cet indicateur
- Documentation produit : `SOURCES_MODULES_MATRIX.md` créé à la racine, en complément de `DATA_SOURCES.md` (branchement technique vs branchement éditorial)

---

### 29/05/2026 — Synthèse Quartier streamée, observations terrain, renommage « rapport interactif » + inversion hiérarchie PDF

> **Statut : committé et poussé sur `main`.** Cinq chantiers regroupés ci-dessous. La migration Supabase `11` a déjà été exécutée manuellement en base.

**Commits**
- `f49db20` — feat: synthèse Quartier streamée, observations terrain, renommage « rapport interactif » + hiérarchie PDF

**Chantier 1 — Synthèse Quartier streamée (IA sortie de derrière le bouton)**
- `src/components/report/QuartierSynthesis.tsx` (nouveau) — panneau pleine largeur : titre + 3 blocs streamés depuis `/api/synthesize-quartier`, mini-nav horizons, bouton « Régénérer avec mes repères », footer « Sources mobilisées », fallback statique si l'IA échoue
- `src/app/api/synthesize-quartier/route.ts` (nouveau) — `streamText` (AI SDK 6) via Anthropic direct (`claude-sonnet-4-5`), prompt éditorial strict (voix, jargon interdit, périmètre Quartier), probe du premier chunk → vrai 502 si provider down
- `src/lib/quartier-signals.ts` (nouveau) — `deriveQuartierSources()` (sources mobilisées par horizon) + `buildFallbackSummary()`
- `src/components/AskFutureInlineMount.tsx` (nouveau) — montage inline d'AskFuture en bas de module (comptes payants)
- `src/components/report/SuiviWaitlistBlock.tsx` (nouveau) — bloc transition liste d'attente Suivi, events PostHog `follow_waitlist_cta_viewed` / `_clicked`
- `src/hooks/useHorizon.ts`, `src/components/AskFuture.tsx`, `src/components/ask-future.css`, `src/components/report/QuartierClimatData.tsx` — ajustements de branchement
- `docs/synthesis-cache-todo.md` (nouveau) — note de cache à faire sur la synthèse

**Chantier 2 — Refonte fin de module Quartier + repères de terrain**
- `src/app/(account)/rapport/quartier/page.tsx` — suppression de l'en-tête « Lecture territoriale » redondant, espace hero réduit, réordonnancement de la fin (AskFuture → bouton Module Logement → bloc Suivi → Retour), workbook alimenté en `commune`/`inseeCode`/`reportId`
- `src/app/(account)/compte/QuartierWorkbook.tsx` — dédoublonnage en-tête, 5 questions (Q2/Q3 reformulées « vécu », Q4 nouvelle « changements observés »), compteur /5

**Chantier 3 — Observations terrain (base propre, intelligence territoriale future)**
- `supabase/11_terrain_observations.sql` (nouveau) — table `terrain_observations` (user/commune/module, answers jsonb, free_text, source, version), index unique `(user_id, insee_code, module)`, index `insee_code`, RLS par utilisateur (select/insert/update own). **Déjà exécutée en base.**
- `src/app/api/terrain-observations/route.ts` (nouveau) — POST double écriture : `user_profiles.workbook_quartier` (compat) + upsert `terrain_observations` ; fallback `/api/profile` si commune inconnue
- `QuartierWorkbook.tsx` — sauvegarde bascule vers `/api/terrain-observations` ; 4 events PostHog : `workbook_opened`, `workbook_answered`, `workbook_completed`, `workbook_free_text_written` (texte libre : longueur seule, jamais le contenu)
- `supabase/README.md` — doc migration 11
- ⚠️ Observations **non encore injectées** dans les prompts IA (mesure de volume/qualité d'abord)

**Chantier 4 — Renommage marketing « rapport » → « rapport interactif » (copy uniquement)**
- ~40 fichiers de copie visible (landing, espace connecté, checkout, hubs chaleur/inondation/voiture, pages agir, auth, merci, wizard, territoires…) : « rapport » isolé → « rapport interactif » ; palier « Rapport complet » → « Rapport interactif » (sans « complet »)
- **Intacts (zéro migration produit)** : routes `/rapport*`, slug Stripe `rapport-complet`, clés produit (`checkout-products.ts`), événements/props analytics (`posthog-props.ts`), variables d'env, libellé court navbar « Mon rapport »
- **Préservés à la main** : rapports externes (« Rapport Dumont », « Copernicus · Rapport 2025 », « Météo-France rapport régional », Lancet/Pasteur/ANSES/Croix-Rouge/EFSA, ERRIAL), prompts IA internes, « par rapport à », classes CSS `*-rapport-*`

**Chantier 5 — Copy produit restante + inversion de la hiérarchie PDF**
- `src/lib/checkout-products.ts` — descriptions visibles : titre « Rapport complet » → « Rapport interactif », sous-titres alignés, features réordonnées (« 6 modules interactifs personnalisés », « AskFuture — 3 questions incluses », « Dashboard simplifié… », « Export PDF, à conserver »). **Slug / IDs / logique Stripe intacts.**
- `src/app/api/stripe/webhook/route.ts` — emails transactionnels alignés : « Votre **rapport interactif** futur·e est en préparation » (sujet + corps + relance J+7). Logique inchangée.
- **Inversion PDF → fonctionnalité** (le PDF n'est plus présenté comme le produit, mais comme une capacité incluse) sur 4 emplacements :
  - `checkout/[product]/page.tsx` item 01 : « Rapport PDF complet » → « Rapport interactif personnalisé » (+ « Export PDF inclus » en fin de body)
  - `FutureELanding.tsx` carte pricing : 1ᵉʳ bullet « Rapport complet PDF » remplacé par « 6 modules interactifs » + « AskFuture » en tête, « Export PDF, à conserver » rétrogradé
  - `checkout-products.ts` features : idem
  - `src/lib/access.ts` : label du plan `one_shot` « Rapport PDF one-shot » → « Rapport interactif » (clé `one_shot` inchangée)
- **Non touché** : politique de confidentialité (« Fournir le rapport personnalisé » conservé — texte juridique) ; zones pro/Suivi où le PDF était déjà une capacité (« Export PDF… », « ne s'arrête pas à un PDF », « Plus un PDF figé »)
- ⚠️ Le PDF reste une **fonctionnalité incluse** partout : aucune suppression de capacité, aucune migration produit

**Impact utilisateur**
- Le module Quartier ouvre directement sur une lecture IA streamée et personnalisable (repères de terrain), sans clic
- Les repères de terrain sont persistés proprement et préparent une couche d'observation collective
- Le produit est nommé « rapport interactif » partout dans la copie visible : l'utilisateur n'attend plus un PDF

**Dépendances externes**
- **package.json** : ajout de `ai@^6` et `@ai-sdk/anthropic@^3` (streaming synthèse) — `npm install` requis au déploiement
- **Supabase** : migration `11_terrain_observations.sql` — ✅ déjà exécutée
- **Env** : `ANTHROPIC_API_KEY` déjà requise (aucune nouvelle variable)
- Routing modèle : Anthropic direct aujourd'hui, à migrer vers Vercel AI Gateway à la mise en vente

**Ce qui reste à surveiller après push**
- Vérifier le `npm install` (nouvelles deps `ai` / `@ai-sdk/anthropic`) au build Vercel
- Plus tard : injection des observations terrain dans les prompts IA (quand le volume sera suffisant), API d'agrégation anonymisée par commune (seuil ~30), migration du routing modèle vers Vercel AI Gateway

---

### 29/05/2026 — UX : barre de chargement de navigation (feedback au clic)

**Commits**
- `e9d8290` — feat(ux): barre de chargement de navigation sur l'espace compte et le dashboard

**Pages / modules touchés**
- `src/components/RouteLoadingBar.tsx` (nouveau) — server component : barre orange indéterminée fixée en haut (réutilise le keyframe global `wizard-loading-bar`) + indice central pulsé, fond `bg-canvas` pleine page
- `src/app/(account)/loading.tsx` (nouveau) — frontière Suspense de navigation pour tout l'espace compte (compte, rapport, modules, mémoire)
- `src/app/(dashboard)/loading.tsx` (nouveau) — idem pour le dashboard

**Problème résolu**
- Les pages module (`/rapport`, `/rapport/quartier`, `/rapport/logement`) sont `force-dynamic` avec de gros fetchs (DRIAS, Géorisques, VigiEau) et n'avaient **aucun** `loading.tsx` : au clic sur « ouvrir le module », rien ne s'affichait jusqu'à la fin du chargement → impression de missclick
- Solution idiomatique Next 16 : `loading.tsx` au niveau des groupes de routes → Next montre la barre instantanément au clic pendant que le server component charge

**Impact utilisateur**
- Retour visuel immédiat sur toute navigation vers l'espace compte / les modules / le dashboard

**Dépendances externes**
- Aucune (build de production validé localement)

---

### 30/05/2026 — Couverture éditoriale par commune (module Quartier)

**Commits**
- `b15d388` — feat(quartier): couverture éditoriale par commune (illustrations bespoke)

**Pages / modules touchés**
- `src/components/report/TerritoryCover.tsx` (réécrit) — bande ultra-wide sous le titre, avant la synthèse. Image par commune via chaîne de repli `/covers/bespoke/{insee}.webp` → `/covers/archetypes/{catégorie}.webp` → `all.webp` (repli à la volée sur `onError`). Cartouche HTML catégorie (dynamique, aucun texte gravé), recadrage CSS `object-fit: cover`, fondu vers le canvas + bordure.
- `src/lib/territory-mood.ts` — `deriveTerritoryMood()` (catégorie géo + densité + boisement ADEME), + `inseeCode`. `buildImagePrompt()` conservé (socle).
- `src/data/cover-communes-top100.json` — top 100 communes par population (issu de `top1000-communes.json`) + repère visuel pré-rempli (rangs 1-50 + La Rochelle).
- `public/covers/bespoke/*.webp` — **51 illustrations bespoke** (top 50 communes + La Rochelle 17300), style sérigraphie éditoriale, recette « warm muted » ancrée sur la palette de marque. Générées via ChatGPT (gpt-image-1) à partir d'une fiche-recette verrouillée, recadrées en bande, **converties PNG→WebP (145 Mo → 15 Mo)**.
- `src/components/AskFuture.tsx` + `ask-future.css` — variante inline : retrait de la ligne de sources, champ/placeholder mis en valeur (encadré + couleur d'accent).
- `.gitignore` — `Photos/` (bannières sources PNG) et exports « Design System » exclus du suivi.

**Décisions de direction (exploration design)**
- Testé : bande SVG procédurale → atmosphérique → trajectoire 2030/2050/2100 → illustration éditoriale figurative → photo. **Retenu** : illustration éditoriale (sérigraphie), **bande ultra-wide sans knockout**, nom en HTML. Le « wow » reste la synthèse qui se génère ; la couverture pose l'identité du lieu sans la concurrencer.
- Cast jaune (travers gpt-image-1) neutralisé : 9 images corrigées via ImageMagick, et **bloc STYLE anti-jaune** (balance neutre) adopté comme standard pour les lots suivants.
- Stratégie **hybride** : bespoke pour le top 100 (~15-16 % de la population couverte par commune exacte), **archétypes par catégorie** (~10-12, à produire) pour les ~84 % restants.

**Impact utilisateur**
- Le module Quartier ouvre sur une bande illustrée propre à la commune (top 50 + La Rochelle), avant la lecture.

**Dépendances externes**
- Aucune. Images statiques servies depuis `public/covers`.

**Reste à faire**
- Régénérer les ~9 communes pâles/jaunes si on veut l'uniformité parfaite (optionnel).
- Produire les **~10-12 archétypes** par catégorie (couverture des communes hors top 100).
- Continuer les bespoke 51→100 si souhaité.
- Note mapping : Colombes = 92025, Argenteuil = 95018.

---

### 30/05/2026 — GASPAR (CatNat), socle de contexte commun AskFuture/Quartier, bannières 51-60, UX Quartier

**Commits**
- `eecb32c` — feat(quartier): GASPAR CatNat + socle contexte commun (AskFuture/synthèse) + bannières 51-60

**Chantier 1 — GASPAR (arrêtés CatNat) — « histoire vécue du territoire » (P1 de la matrice)**
- `src/lib/georisques.ts` — `getGasparCatnatSummary(insee)` : total d'arrêtés CatNat, première/dernière année, répartition par aléa (familles), cache + fallback. Endpoint v1 `/gaspar/catnat` (sans token). Distinct de `/gaspar/risques` (typologie, déjà utilisée pour les flags).
- `src/components/report/QuartierClimatData.tsx` — carte « Catastrophes naturelles reconnues » (ex. « 21 arrêtés depuis 1999 · surtout inondations »). Grille → 9 cartes.
- `src/lib/quartier-signals.ts` — chip source **GASPAR** ajoutée.
- `src/app/api/synthesize-quartier/route.ts` — `historique_catnat` dans le payload + règle éditoriale « histoire vécue » (évocation sobre, une fois, sans alarmisme ni citation de source).

**Chantier 2 — Socle de contexte territorial commun (consolidation AskFuture)**
- Audit : AskFuture (`/api/ask`) ne recevait NI Géorisques, NI GASPAR, et VigiEau était fetché puis jeté. La synthèse Quartier les avait. Incohérence : AskFuture répondait avec moins de données que les modules.
- `src/lib/commune-enrichment.ts` — `gatherCommuneEnrichment` promu en **socle commun** : ajoute `georisques` + `catnat` à l'agrégat (DRIAS/ADEME/Hub'Eau/VigiEau déjà présents). Une source branchée une fois → dispo partout.
- `src/app/api/synthesize-quartier/route.ts` + `src/app/(account)/rapport/quartier/page.tsx` — consomment `enrichment.georisques/catnat` (3 fetchs en doublon supprimés).
- `src/app/api/ask/route.ts` — AskFuture reçoit désormais **Géorisques** (risques + zone sismique), **GASPAR** (historique CatNat), **VigiEau** (restriction en cours), + observations terrain `change` (Q4). Liste des sources citables du prompt mise à jour. Garde-fous « dire quand la donnée manque » étendus à chaque nouveau bloc.
- Périmètre éditorial **inchangé** : la synthèse Quartier reste territoriale (aucun champ individuel ajouté à son payload). Couche report/module (adresse/DPE) reportée en v2.

**Chantier 3 — Bannières bespoke 51-60**
- `public/covers/bespoke/{insee}.webp` — 10 communes (Poitiers, Aubervilliers, Aulnay, Dunkerque, Nouméa, Saint-Pierre 974, Versailles, Courbevoie, Rueil-Malmaison, Le Tampon 974), recette « warm muted aplats nets », WebP. Scan jaune propre.
- `src/data/cover-communes-top100.json` — landmarks 51-70(+71) pré-remplis.

**Chantier 4 — UX module Quartier**
- `src/app/(account)/rapport/quartier/page.tsx` — inversion **AskFuture ↔ Observations de terrain** (parcours : lire → demander → contribuer → continuer).
- `src/app/(account)/compte/QuartierWorkbook.tsx` — copy simplifiée (titre + une ligne) + **bouton « Compléter ▾ »** clair pour signaler que le bloc se déplie.

**Impact utilisateur**
- AskFuture peut enfin répondre sur les catastrophes naturelles, les risques recensés et la sécheresse en cours d'une commune.
- Module Quartier : carte CatNat + synthèse qui ancre le passé vécu ; parcours fin de module plus logique.
- 60 communes bespoke couvertes (sur top 100).

**Dépendances externes**
- Aucune nouvelle. GASPAR/VigiEau v1 publics sans token. `GEORISQUES_API_TOKEN` déjà requis pour la v2 adresse/parcelle (module Logement, inchangé).

**Reste à faire**
- Archétypes par catégorie (couverture hors top 100).
- Bespoke 61→100 (briefs envoyés jusqu'à 71).
- BDIFF (incendies historiques, P4) = prochain candidat « histoire vécue » côté feu.

---

### 30/05/2026 — Drawers éditoriaux des cartes Quartier (primitive MetricDrawer) + synthèse CatNat déterministe

**Commits**
- `e3b4167` — feat(quartier): drawer éditorial cartes-indicateurs (CatNat) + synthèse déterministe

**Chantier — Une carte n'est pas un KPI mort, c'est une porte d'entrée**
- `src/components/MetricDrawer.tsx` (nouveau) — primitive de design-system **réutilisable et agnostique du module** : panneau latéral (desktop) / bottom-sheet (mobile) qui glisse sans quitter la page. Contenu éditorial court : chiffre phare → répartition → faits → « pourquoi ce chiffre compte » → (optionnel) question AskFuture. Un module fournit juste un objet `CardDetail`.
- `src/components/report/QuartierClimatData.tsx` — `Factor` accepte un `detail?: CardDetail`. Carte « Catastrophes naturelles reconnues » devient cliquable (rôle/clavier/focus) et ouvre le drawer GASPAR (répartition par aléa, première/dernière reconnaissance, mise en perspective). Affordance « Détail → ».
- `src/components/AskFuture.tsx` — écoute l'événement window `futuree:ask` : le bouton « Poser une question » du drawer pré-remplit AskFuture inline (découplage par événement, pas de prop drilling).
- `src/lib/georisques.ts` — `simplifyCatnatRisk` enrichi (érosion/vagues, crues, torrentiel, affaissement, neige, grains…) confirmé comme **point unique** de traduction du jargon CatNat. `describeCatnat` = phrase de synthèse **déterministe** (≤120 car., aucune IA, pure logique sur les fréquences), exposée via `GasparCatnatSummary.summary`.

**Reste à faire (drawers Quartier)**
- Drawer « Sécheresse des sols » (arc 3 signaux VigiEau + ONDE + DRIAS).
- Drawer « Jours chauds >30 °C » (trajectoire 2030/2050/2100 + seuils).
- Puis primitive légère `<MetricTooltip>` pour 5 cartes (chaleur >35, nuits tropicales, feu, inondation, submersion). Boisement = aucun détail.
- Principe : drawer seulement si la carte raconte une histoire ; pas de mini-dashboards.

**Couvertures**
- Bespoke 61→71 converties et poussées (`22d3d0b`) : Béziers `34032`, Pau `64445`, Cherbourg-en-Cotentin `50129`, Mérignac `33281`, Champigny-sur-Marne `94017`, Antibes `06004`, Saint-Maur-des-Fossés `94068`, Ajaccio `2A004`, Fort-de-France `97209`, Saint-Nazaire `44184`. La Rochelle (rang 63, `17300`) déjà couverte. Mapping `cover-communes-top100.json` déjà pré-rempli (résolution par nom de fichier `{insee}.webp`).
- Reste : bespoke 72→100 + archétypes par catégorie (hors top 100 → placeholder sinon).

---

### 30/05/2026 — Drawers Chaleur (trajectoire) + Sécheresse (arc 3 signaux) + primitive MetricTooltip + briefs 72→81

**Commits**
- `9a743df` — feat(quartier): drawers Chaleur (trajectoire) + Sécheresse (arc 3 signaux) + MetricTooltip

**Chantier — Finir le sens des cartes Quartier (drawers + tooltips)**
- `src/components/report/QuartierClimatData.tsx` :
  - Carte **« Jours chauds > 30 °C »** → drawer **trajectoire** : lecture des 3 horizons DRIAS (`scenarios.gwl15/20/30.v.NORTX30D_yr`) → 2030 / 2050 / 2100. Subhead déterministe (« de X à Y jours »), fait « dont > 35 °C », `breakdownLabel: "Trajectoire"`.
  - Carte **« Sécheresse des sols »** → drawer **arc à 3 signaux** : VigiEau (arrêté du moment) · ONDE/Hub'Eau (terrain) · DRIAS SWI04 (futur). `breakdownLabel: "Les trois signaux"`. Carte non grisée + cliquable dès qu'**un** des 3 signaux existe (plus seulement DRIAS) ; headline et val s'adaptent à la donnée disponible. Facts = bassin + date de fin d'arrêté si restriction active.
  - `buildFactors` change de signature : reçoit `scenarios` (au lieu de `gwlData`), `vigieau`, `drought`.
  - `Factor` gagne `tip?: string`. **5 tooltips** (chaleur > 35, nuits tropicales, feu, inondation, submersion) ; boisement = rien.
- `src/components/MetricTooltip.tsx` (nouveau) — primitive légère « ⓘ » au coin de carte : survol + focus clavier + tap mobile, bulle, fermeture clic-extérieur/Échap, `stopPropagation` pour ne pas déclencher un éventuel drawer. Pas d'état partagé.
- `src/components/MetricDrawer.tsx` — `breakdownLabel?` optionnel (défaut « Répartition »).
- `src/app/(account)/rapport/quartier/page.tsx` — `QuartierAside` reçoit `vigieau` + `drought` (déjà dans `gatherCommuneEnrichment`, aucun nouveau fetch).

**Principe tenu** : drawer seulement si la carte raconte une histoire (CatNat, Chaleur, Sécheresse) ; tooltip pour un seuil à gloser ; rien pour le boisement. Pas de mini-dashboards.

**Couvertures**
- Briefs d'illustration **72→81** renseignés dans `cover-communes-top100.json` (Cannes, Noisy-le-Grand, Drancy, Mamoudzou, Cergy, Levallois-Perret, Issy-les-Moulineaux, Calais, Pessac, Colmar). À générer puis convertir.

**Reste à faire**
- Génération PNG 72→81 puis conversion WebP + bespoke 82→100.
- Archétypes par catégorie (hors top 100).

---

### 30/05/2026 — Tooltip boisement + drawers recentrés sur le récit territorial + doctrine tooltips

**Commits**
- `cafe9ca` — feat(quartier): tooltip Taux de boisement + tooltips sans source, zéro tiret cadratin
- `10fb97f` — refactor(quartier): drawers Sécheresse + Chaleur recentrés sur le récit territorial
- `803e692` — refactor(quartier): tooltips recentrés sur l'enjeu territorial

**Chantier 1 — Tooltip boisement + règles de copy**
- `src/components/report/QuartierClimatData.tsx` — tooltip ajouté sur « Taux de boisement » (la carte raconte une histoire : îlots de chaleur tempérés l'été, rôle sur le feu).
- Règle posée : les tooltips ne citent **jamais** la source (retrait de « PPRI, atlas »). La ligne `src` des cartes et le pied des drawers portent déjà la provenance.
- Règle posée : **jamais de tiret cadratin** dans la copy ; virgule ou deux points. Corrigé partout (tooltips, drawer Chaleur, titre du bloc données).

**Chantier 2 — Drawers Sécheresse + Chaleur au niveau de CatNat (test utilisateur interne)**
- Constat : CatNat marche (histoire territoriale immédiate) ; Sécheresse et Chaleur restaient « sources et indicateurs » (VigiEau, ONDE, DRIAS, « France +2°C »…).
- Objectif : garder la donnée, raconter le phénomène, sources présentes mais discrètes. Test : « si je ne connais ni ONDE ni DRIAS, est-ce que je comprends quand même ? ».
- `src/components/MetricDrawer.tsx` — deux ajouts à la primitive :
  - `breakdown[].bar` (0→1) : barre de proportion sous une ligne → la donnée se **voit**, pas juste se lit.
  - `sources` : note de pied **discrète** (filet + mono 10px gris). La narration ne cite plus les bases ; le pied, oui.
- **Drawer Chaleur** : trajectoire rendue en **barres** (montée visible), libellés = années seules (plus de « France +2°C » dans le tableau), headline « X → Y jours par an », subhead « Les journées à plus de 30°C deviennent progressivement plus fréquentes », paragraphe centré sur le **quotidien** (nuits, logements/écoles, travail dehors, personnes fragiles, accélération) au lieu de définir le seuil. Sources en pied (DRIAS, Météo-France).
- **Drawer Sécheresse** : trois temps en langage utilisateur — **Aujourd'hui** / **Cours d'eau observés** (« réseau ONDE » sorti du libellé) / **Sols en 2050** ; headline « Sol sec ~X jours/an d'ici 2050 » ; paragraphe sur le **phénomène vécu** (l'eau restreinte l'été, les rivières qui faiblissent, la terre qui se rétracte et fragilise les fondations), pas la méthodo. Facts « Zone concernée » + « Jusqu'au ». Sources en pied (VigiEau · ONDE/Hub'Eau · DRIAS).
- **Drawer CatNat** : pied de sources ajouté pour la cohérence des trois drawers.

**Chantier 3 — Doctrine tooltips**
- Un tooltip répond à UNE question : « **Pourquoi ce chiffre aide-t-il à comprendre le territoire ?** ». **≤ 2 phrases, ≤ 35 mots.** Interdit : définir l'indicateur, décrire la méthodo, citer la source, jargon/seuils chiffrés. Ton simple, concret, humain.
- Réécriture des 6 tooltips (chaleur > 35, nuits tropicales, feu, inondation, submersion, boisement) dans cet esprit.

**Règle de design éditorial (drawers)**
- CatNat = référence. Un bon drawer futur•e ne documente pas une source et ne décrit pas une méthodologie : il **raconte un phénomène territorial**. Le lecteur ressort avec « j'ai compris ce qui change dans ma commune », pas « j'ai compris quelles bases ont été utilisées ».

**Mémoire** (hors repo) : règles « pas de tiret cadratin » et « doctrine tooltips » enregistrées.

**Reste à faire**
- Génération PNG 72→81 puis conversion WebP + bespoke 82→100 ; archétypes par catégorie.
- Valider le rendu des drawers/tooltips en conditions réelles (app).

---

### 31/05/2026 — Comparateur de vie « Où vivre » : moteur V1.6 gelé + plateforme de marque + business model

**Commits**
- `ecb97d2` — feat(comparateur): moteur V1.6 « Où vivre » (gel)
- `e74caf0` — docs: plateforme de marque + business model B2C (Le Fil, comparateur)
- (rappel) `cf8c558` — docs: business model B2C initial

**Chantier produit — bascule analyse → orientation**
- futur•e passe de « que vaut cette commune ? » à « où pourrais-je vivre ? ». Nouvelle porte d'entrée : projet de vie → comparateur → rapport → AskFuture → Le Fil.
- `PLATEFORME_DE_MARQUE.md` (racine) : Vision « Habiter dans un monde qui change », Problème, Réponse, Mission, Nos principes (lucides/sourcés/honnêtes/utiles), nuance anti-prescription (« futur•e ne choisit pas à votre place »).
- `BUSINESS_MODEL_B2C.md` : produit récurrent renommé **Le Fil futur•e** (catégorie veille territoriale ; canal newsletter ; brique Signaux), §5 comparateur de vie + compte multi-territoires + **Pack Décision** (3 territoires) comme hero SKU. Échelle gratuit / 19 € / 39 € / 49 €-an.
- `docs/comparateur-sante-environnementale.md` : audit santé-env (pesticides/eau/sols/industriel).

**Moteur (déterministe, IA seulement pour parse + future synthèse)**
- `data/comparateur-index.json` — index national pré-calculé, **34 788 communes métropole**. Contenu : climat DRIAS gwl20 (+ temp hiver, pluie annuelle) et percentiles ; géo (distance côte approx via ancres côtières, à remplacer par trait de côte IGN) ; population/densité ; **santé : PM2.5/NO2** ; **vivabilité : APL médecins, éloignement services** ; **pression agricole : IFT × SAU, nuance bio**. Tout bulk ADEME `data_communes` (gratuit, sans clé) + DRIAS local.
- `src/lib/comparateur-vie.ts` — 13 préférences pondérées, contraintes dures (région, mer, lieu nommé géolocalisé, taille de ville 5k/25k/100k), courbes comportementales (isolement, calme en bande, douceur via temp hivernale), baseline de viabilité, rollup Paris/Lyon/Marseille, compromis explicite + cas « aucun territoire parfait ».
- `src/app/api/comparateur-vie/parse/route.ts` — Anthropic tool use (claude-sonnet-4-6), vocabulaire fermé, règle élimine/pondère/ambigu, climat perçu (fuir chaleur ≠ douceur ≠ soleil), **heuristique famille/santé** : famille/enfant/environnement sain/pesticides/agriculture intensive → active acces_services + eviter_isolement + faible_pression_agricole sans exposer le jargon (« IFT », « pression agricole » jamais montrés).
- `src/app/api/comparateur-vie/match/route.ts` — déterministe, 0 IA, 0 appel externe.
- `scripts/` — fetch ADEME (population/air/soins/services/IFT/SAU/bio), build index, demo de validation. Caches bruts `data/communes-*.json` gitignorés (l'index buildé est versionné).

**Itérations scoring validées par batteries de tests réelles**
- V1 climat/géo → V1.5 (air_sain, acces_soins, acces_services) → V1.6 (pression agricole IFT). Absurdités corrigées en route : isolement (échelle absolue vs percentile), calme (bande optimale), « doux ≠ le plus froid » (temp hivernale + douceur_climat + ensoleillement_recherche), villages pour projets famille (heuristique + baseline), pression agricole crédible (Épernay 100, Beaune 63, Guéret 6, Chamonix 0).
- `pression_agricole` = PRESSION (IFT), jamais exposition ; préférence **optionnelle**.
- Exclus du score (anti-biais social) : revenu médian, logements sociaux, sécurité, ICPE.

**Reste à faire**
- Interface `/ou-vivre` (3 étapes : projet libre → reformulation/validation → résultats) + **couche synthèse IA** (interprétation + enrichissement shortlist eau / cadmium / BASOL-SIS).
- Instrumentation PostHog (events life_comparator_*).
- Déploiement : ajouter `data/comparateur-index.json` à `outputFileTracingIncludes` dans `next.config.ts` (sinon index 16 Mo non embarqué en serverless).
- V2 : nitrates eau en score national (bulk Hub'Eau), RPG fin, bassin d'emploi.

---

### 31/05/2026 — Comparateur : couche synthèse IA + tracing serverless

**Commit** : `822da7a` — feat(comparateur): synthèse IA interprétative + tracing index serverless

- `next.config.ts` : `outputFileTracingIncludes` pour `data/comparateur-index.json` sur `/api/comparateur-vie/match` (embarquer l'index 16 Mo en serverless).
- `src/app/api/comparateur-vie/synthesize/route.ts` : synthèse éditoriale streamée (AI SDK, Anthropic direct, claude-sonnet-4-5), miroir de synthesize-quartier. INTERPRÈTE le résultat déterministe, ne choisit/reranke/modifie aucune commune.
- **Doctrine éditoriale (frontière comparateur ↔ rapport)** : la synthèse parle des RAISONS, le rapport des CONSÉQUENCES. Généreuse sur l'interprétation du projet (le miroir, le « wow »), avare sur le détail commune (la curiosité). Compromis = pont vers le rapport. Crée une question, pas une réponse. Qualitatif only (aucun chiffre/percentile/horizon daté), non prescriptif, jamais « top villes », pression ≠ exposition, suivi ≠ danger. Vouvoiement, zéro tiret cadratin.
- Contrat d'entrée **extensible** : `enrichment` (eau/cadmium/sols suivis) optionnel, branché plus tard sans changer la signature.
- Validé en réel : synthèse « famille/sain/océan » → miroir du projet + logique Bretagne vs Pays basque + compromis central nommé + clôture « la décision vous appartient ». Effet futur•e confirmé.

**Reste** : enrichissement eau/cadmium/BASOL-SIS en prose (contrat prêt) ; page `/ou-vivre` ; instrumentation PostHog `life_comparator_*`.

---

### 31/05/2026 (soir) : Comparateur, endpoint AskFuture scellé + territoire actif de lecture

**Commits** : `edfc953` (AskFuture comparateur scellé), `eb0b017` + `79e7dd6` (territoire actif, module Quartier).

- `edfc953` : endpoint AskFuture du comparateur, guide de lecture scellé (ne reçoit que du qualitatif, firewall préservé).
- `eb0b017` / `79e7dd6` (module territoire, hors comparateur) : notion de territoire actif de lecture, gating territoire-aware ; migration 12 appliquée, roadmap V2 multi-territoire notée.

---

### 01/06/2026 : Comparateur, parcours /ou-vivre + ancres géographiques + montagne par altitude

**Commits** : `3c2194f` (ancres + parcours), `eaeb313` (gradient de force), `06eff64` (altitude), `30cfb99` (montagne générique).

- **Parcours `/ou-vivre`** posé (`3c2194f`) : projet libre → reformulation/validation → résultats. Ancres géographiques V1.
- **Ancres = LIEU, pas préférence** : le moteur possède la table jeton → départements (`geo-zones.ts`), le LLM ne fait que NOMMER (liste fermée de jetons : régions, macro-zones, façades, massifs). L'ancre définit l'espace de recherche ; les préférences ordonnent dedans. Plusieurs ancres dures = intersection. Chaque zone porte une `convention` affichée honnêtement.
- **Gradient de force** (`eaeb313`) : hard (filtre), preferred (bonus fort), inspiration (bonus léger). Lu sur le MARQUEUR d'intensité, pas sur la zone (mention nue = hard). Polarité d'abord (« surtout pas le Sud » = exclusion).
- **Altitude** ajoutée à l'index (`06eff64`, centroïde IGN, m NGF), base de la détection montagne.
- **Montagne par altitude** (`30cfb99`) : `hardConstraints.montagne`, distinct des massifs nommés. Courbe de montagnosité (pivot 600 m). hard = filtre (≥ ~600 m), preferred/inspiration = bonus proportionnel. Intersection zone+montagne priorisée (« Sud-Ouest idéalement à la montagne » → Bagnères, pas Toulouse). À cette étape, « proche de la montagne » restait NON supporté (corrigé le même jour, voir entrée relief).

---

### 01/06/2026 : Comparateur, viabilité du bassin d'emploi (ZE2020 + Flores A38)

**Commits** : `1d6016b` (données), `f9b38f9` (scoring), `60f15d9` (docs).

- **Données** (`1d6016b`) : Flores A38 fin 2024 à la maille ZE2020 (évite le secret statistique du grain commune), hérité par commune. `taille` = courbe log saturante, `diversite` = entropie A38 étirée p5-p95. Caches `data/communes-emploi.json` (34 743) + `data/ze-emploi-na38.json` (306 ZE). Salarié uniquement (sous-estime agri/indépendants), limite assumée.
- **Scoring** (`f9b38f9`) : clé `viabilite_emploi` (0,6·taille + 0,4·diversite). Modèle hybride : emploi signalé → préférence poids 2 ; hors-emploi (retraite, télétravail total) → `emploiHorsSujet`, jamais pénalisé ; non mentionné → partage du plancher de réalisme (isolement 0,5 + bassin 0,5), budget INCHANGÉ vs V1.
- Le bassin est PESÉ, le métier précis reste au rapport. Firewall qualitatif préservé (« un bassin d'emploi dynamique »).

---

### 01/06/2026 : Comparateur, pression climatique sur l'économie locale (narratif, non scoré)

**Commits** : `b3e73dc` (conception), `2691318` (feat), `3af5908` (docs).

- Second signal économique, **NARRATIF et NON SCORÉ** (aucun impact sur le tri). Σ part_secteur(ZE) × sensibilité × aléa(pct commune), calculé au build (`pression_eco`), attaché après le scoring.
- Couples V1 : agri+forêt × sécheresse/feu (feu réservé aux percentiles ≥ 80, pour ne pas étiqueter un vignoble), proxy tourisme estival × chaleur en plaine / tourisme montagne × neige en altitude. Neige = maillon faible assumé.
- Seuil de dépendance 8 % (on ne flague que si le secteur sensible pèse vraiment). Paliers par percentiles, faible = aucune note.
- **Garde-fous stricts** : jamais « résilience » ni « fragile » ni verdict ; toujours « dépendance » ; capacité d'adaptation non mesurée (note d'humilité unique). Transmis prudemment à synthèse + AskFuture.

---

### 01/06/2026 : Comparateur, audit sémantique + gloses visibles + gate sémantique

**Commits** : `6d5e5be` (audit), `6cb2a5e` (conception), `71861a3` (gate).

- **Audit sémantique** (`6d5e5be`, `AUDIT_SEMANTIQUE_COMPARATEUR.md`) : cartographie des mots dont le sens utilisateur diffère de ce que le moteur mesure. Quatre familles : A faux ami (doux = hiver océanique, pas Méditerranée), B polysémie (calme = densité), C hors-mesure donnée absente (nature), D non mesurable affectif (authentique). Le risque produit n'est plus « le moteur manque de données » mais « il répond silencieusement à un autre sens que celui voulu ».
- **Gate sémantique livré** (`71861a3`) : gloses d'interprétation sous les puces de critère (serif italique, connecteur `→`), pour rendre explicite ce que le moteur entend. Réassurance recentrée (« 20+ indicateurs publics projetés à 2050, croisés sur 34 000 communes »). Bouton « Lancer l'analyse ». Retrait du disclaimer périmètre qui cassait le moment.
- **Hors-mesure** (volet B) conçu mais non livré (afficher les notions sans critère sous « ce qui reste ouvert »), reporté pour valider d'abord la pédagogie sur les critères mesurés.

---

### 01/06/2026 : Comparateur, signature territoriale (image identitaire du lieu)

**Commit** : `4c56923` feat(comparateur): signature territoriale, image identitaire du lieu
(fait suite, le même jour, au gate sémantique `71861a3` : gloses visibles + réassurance moteur, non encore journalé)

**Quoi** : une couche `signature: string[]` sur `MatchResult`, distincte des `reasons`. Les raisons justifient le score, la signature donne une IMAGE du territoire. Ordre fixe géographie, bassin d'emploi nommé, climat ou relief. Max 3, 100 % déterministe, mêmes tables que les filtres d'ancres. Affichée en ligne discrète sous « Région · dépt », au-dessus des raisons.
- Géo : côte incarnée par région (« Côte bretonne », « Côte méditerranéenne ») si littoral ≤ 15 km, sinon massif (« Aux portes des Alpes », « Dans le Massif central ») si dept ∈ massif et altitude ≥ 200 m.
- Bassin : « Bassin de X » via `data/ze-emploi-na38.json` (ZE2020, Flores A38), avec élision correcte (du / des / de la / d').
- Climat/relief : maritime ou méditerranéen sur les côtes, « En altitude » en massif ≥ 600 m, sinon caractère hivernal si marqué (≤ 3 °C) ou doux (≥ 8 °C), sinon rien.

**Règle de conception (la doctrine, plus importante que le correctif)** : un élément de signature doit être distinctif ET identitaire. Une chose par laquelle un humain décrit spontanément un territoire, pas une donnée vraie mais inerte affichée pour remplir un emplacement. « Altitude 286 m », « altitude modérée », « température moyenne X » sont réels mais ne racontent rien : c'est une fuite de donnée dans l'interface. La bande altitude 200 à 600 m a donc été retirée (elle ne sortait que là où le label massif portait déjà le relief : Grenoble, Clermont) ; seule la haute altitude reste, là où la montagne EST le lieu (Aurillac, Le Puy). Corollaire : une signature peut être courte, n'a pas besoin de trois éléments, on ne remplit jamais pour remplir. Limoges, « Bassin de Limoges », point.

**Correctif lié** : la raison emploi « vaste » est graduée sur l'effectif salarié réel de la zone (seuil ~200 k), plus sur un percentile saturé. Grenoble oui, Brest/Cherbourg non.

**Tracing** : `ze-emploi-na38.json` ajouté à `outputFileTracingIncludes` du endpoint `/api/comparateur-vie/match` (sinon introuvable en serverless).

**Validé** sur panel réel (build OK + trace des signatures) : Limoges/Dijon courts, Clermont/Grenoble débarrassés du filler altitude, Aurillac/Le Puy gardent « En altitude », côtes Atlantique/Manche en « Climat maritime », Méditerranée en « Climat méditerranéen ».

**Suite** : le doublon méditerranéen, le dédoublonnage du bassin et l'axe ville ont été tranchés et livrés dans le lot relief (entrée suivante).

---

### 01/06/2026 : Comparateur, « proche d'une montagne » (précalcul relief) + raffinements signature + firewall synthèse

**Analyse produit (avant code).** Cas révélateur : « proche d'une montagne pour la randonnée », puis la synthèse conclut « aucun n'est à proximité d'un massif ». Le parse traduisait « proche d'une montagne » en NÉANT (non supporté, par conception), le moteur n'en tenait donc aucun compte, et la synthèse rationalisait l'oubli après coup. Asymétrie indéfendable : « à la montagne » et « près des Alpes » marchaient, « proche d'une montagne » disparaissait. Test des deux approximations possibles : l'union des départements massif fait remonter Nice/Toulouse/Strasbourg (préfectures de plaine ou de littoral d'un département classé massif) ; l'altitude propre rate Grenoble (214 m). Conclusion : vrai trou de données, comme « nature ». Choix d'aller direct au vrai correctif.

**Précalcul relief** (`scripts/add-relief-proximite.mjs`). Pour chaque commune, `relief_proximite` (0–100) = altitude max dans 35 km, à partir des seules altitudes de l'index (aucune source externe). reliefMax et non densité (la densité avantage les Alpes, massif large, et pénalise les Pyrénées, chaîne étroite : Pau tomberait à 23). Validé : Grenoble 95, Pau 69, Tarbes 85, Annecy 84, Gap 100, Toulouse/Strasbourg/Limoges 0. Effet de bord assumé : Côte d'Azur ~66 (sommets proches), sous les vraies villes de montagne. Champ ajouté aux 34 788 communes, idempotent, documenté dans `meta`.

**Moteur** : `hardConstraints.reliefProche` (gradient hard/preferred/inspiration), distinct de `montagne` (altitude propre). hard = filtre `relief_proximite ≥ 50` ; preferred/inspiration = bonus proportionnel. Montagne et relief sont le même axe (max, pas somme). End-to-end vérifié : projet « famille/nature/calme/air sain » sans reliefProche → Mont-de-Marsan (plaine) ; avec → Oloron-Sainte-Marie, Bagnères-de-Bigorre, Saint-Dié, Aurillac.

**Parse** : « proche d'une montagne / au pied des montagnes / pour faire de la randonnée » → `reliefProche`, distinct de « à la montagne » (montagne) et des massifs nommés (zones). N'est plus jeté.

**Gate, glose visible** : sous « Le périmètre recherché », puce « proche d'un massif » + glose `→ reliefs montagneux à proximité`. Doctrine tranchée : la glose dit le SENS retenu (interprétation utilisateur), jamais la MÉTHODE (l'estimation par l'altitude alentour reste hors écran). Pas de surpromesse d'accès aux sentiers.

**Firewall synthèse** (`synthesize/route.ts`) : règle stricte « ne commentez que ce qui a été mesuré ». La synthèse ne peut plus affirmer ni nier une notion absente des signaux mesurés, même si le texte brut du projet la mentionne ; jamais « aucun n'est X » pour un X non mesuré. Tue la rationalisation a posteriori à la source.

**Raffinements signature (lot groupé)** :
- Bassin dédupliqué : « Bassin de X » seulement si X ≠ nom de la commune (« Bassin de Limoges » sur Limoges ne raconte rien, retiré).
- Climat méditerranéen retiré du doublon : sur la côte med, « Côte méditerranéenne · … · Climat méditerranéen » répétait le mot ; remplacé par la facette vécue distinctive (« Hivers doux »). L'Atlantique garde « Climat maritime » (facette neuve).
- Axe ville (repli quand ni côte ni massif) : « Grande ville » (≥ 100k) / « Ville moyenne » (30–100k) / « Petite ville » (10–30k), langage naturel (jamais « pôle urbain », jargon). Signatures vides : de 2,5 % à 0,3 %. Doctrine [[feedback_signature_identitaire]] : un élément doit raconter le lieu.

**Règle de conception actée** : futur•e ne doit jamais affirmer ni nier une notion qu'il n'a pas réellement mesurée. Le gate rend l'interprétation visible, le firewall empêche la synthèse d'improviser, le précalcul comble le trou plutôt que de l'avouer quand la donnée le permet.

**Reste / V2** : « proximité au relief » est aujourd'hui approchée par l'altitude alentour (centroïde, rayon circulaire, pas de versant ni d'accès route). Une vraie métrique d'accès au relief reste un raffinement V2. Logement €/m² (achat + location) : chantier données autonome à scoper séparément (DVF, loyers, granularité, qualité des sources).

---

### 01/06/2026 : Logement, conception (avant toute acquisition) + doctrine tranchée

**Document** : `LOGEMENT_TERRITORIAL.md` (racine, jumeau de `PRESSION_CLIMATIQUE_ECONOMIE.md`). Conception only, aucun code, aucune donnée acquise.

**Sources vérifiées (juin 2026)** :
- Achat → **CEREMA DV3F** (indicateurs agrégés : prix médian €/m², volumes, accessibilité financière, taux de rotation ; mailles commune/EPCI/aire d'attraction/dept ; xlsx libre + API ; version DV3F 2025-1). Trou : exclut Alsace-Moselle (57/67/68) et Mayotte (livre foncier). DVF brut = repli, pas retenu (le CEREMA fait mieux le nettoyage).
- Location → **Carte des loyers** (Ministère Transition écologique / ANIL ; loyer €/m² charges comprises modélisé depuis annonces leboncoin+SeLoger ; maille commune, France hors Mayotte ; appart T1-T2/T3+ et maison ; millésime 2025 ; drapeaux de fiabilité R²/n/intervalle ; imputation des petites communes). Limite : loyers d'ANNONCE, pas baux réels.

**Doctrine tranchée par le porteur** :
- **Logement non scoré, aucun impact sur le tri.** Un score logement universel reviendrait à décréter « moins cher = meilleur territoire », pénaliserait la désirabilité, combattrait les autres signaux et rouvrirait le biais social du revenu. Ce n'est pas la mission du comparateur.
- Séparation produit clé : le **comparateur** répond à « **où vivre ?** », le **module logement** à « **puis-je réellement m'y installer ?** ».
- **Module à trois couches** : niveau de prix, accessibilité, tension. Le comparateur ne reçoit que **deux notes narratives** (prix relatif, tension locative), statut identique à la pression climatique. Le reste vit dans le module et le rapport.
- **Accessibilité CEREMA hors classement** (repose sur le revenu médian, exclu du moteur pour le biais social) : rapport / AskFuture / module seulement.
- **Tension locative** = note complémentaire (« marché tendu / détendu »), pas un critère.
- Achat et location toujours séparés. Maille : commune affichée, marché calculé (héritage commune → EPCI → aire d'attraction), comme l'emploi.

**Porte V2 (notée, pas ouverte)** : abordabilité comme préférence **opt-in** (pesée seulement si formulée : « abordable », « budget serré »), dans la doctrine « on ne score que ce qui est formulé ». Décision distincte après épreuve du narratif ; faux ami « abordable » à trancher d'abord.

**Restent ouvertes** (détails d'implémentation, au lancement du chantier) : affichage chiffre vs positionnement relatif ; traitement propre du trou Alsace-Moselle ; nom du module. Aucune acquisition ni implémentation tant que non lancé.

---

### 02/06/2026 : Comparateur, signal logement narratif non scoré (achat + location)

**Commit** : `feat(comparateur): ajouter signal logement narratif non scoré`. Conception : `LOGEMENT_TERRITORIAL.md` (section « Implémenté V1 »).

**Source tranchée par les faits (Phase 1 sur données réelles)** : Option B. Le CEREMA DV3F n'est pas automatisable pour un produit privé (Box manuel / API réservée acteurs publics), et son atout (accessibilité) étant hors comparateur, on perdait le pipeline maîtrisé pour rien. Donc **DVF auto-agrégé (achat) + Carte des loyers ANIL (location)**. CEREMA réservé au futur module.

**Robustesse validée (crunch national, 34 788 communes, fenêtre 2021-2024)** : maison 74 % commune / 22 % EPCI / 0 % au-delà ; appartement 16 % / 78 % / 2 % (bascule EPCI en rural, normal) ; **4,6 % absent = Alsace-Moselle** (57/67/68, hors DVF). Le risque « inutilisable sur 20 000 communes » ne s'est pas matérialisé.

**Implémenté** :
- `scripts/populate-logement.mjs` : médian €/m² DVF (maison/appart, repli commune→EPCI→au-delà) + loyer €/m² ANIL, paliers par percentiles nationaux (déciles/tiers), patch du champ `logement` de l'index. Cache brut (~420 Mo) gitignoré, dérivé dans l'index, script rejouable.
- Moteur : note `logement` qualitative attachée HORS score (comme `pression_eco`), zéro impact ranking.
- **Signal comparateur** : une phrase agrégée (« marché parmi les plus chers / plus cher / moins cher que la moyenne… ») quand achat et location concordent, détail (« achat moins cher, loyers plus élevés ») seulement en divergence, un seul axe si l'autre est silencieux, rien si tout moyen. **Jamais « abordable »** (= accessibilité, module) **ni « tendu »** (= signal tension à venir). Zéro chiffre (réservé au rapport).
- **Alsace-Moselle** : achat silencieux au comparateur, « non disponible » au rapport, jamais déguisé en « moyen ».
- **Synthèse + AskFuture** : reçoivent le libellé qualitatif, règle stricte (sens tel quel, pas de chiffre, pas d'« abordable », pas de verdict).
- **Garantie anti-carte-vide** : une carte sans raison au-dessus du seuil affiche ses 1-2 meilleurs aspects relatifs (plus de carte « pas finie »).

**Vérifié** : build OK ; échantillon réel (Bordeaux/Nice « marché parmi les plus chers », Grenoble « plus cher que la moyenne », Limoges silence, Strasbourg loyers seuls, Saint-Véran achat seul) ; libellés agrégés et cas de divergence cohérents.

**Reste** : tension locative (note à venir : zonage tendu + vacance) ; accessibilité (module logement, CEREMA) ; abordabilité opt-in (porte V2). `DONNEES_CANDIDATES_CEREMA.md` (pistes CEREMA explorées) gardé local, non committé.

---

### 02/06/2026 : Comparateur, critère nature opt-in (couvert naturel OSO à proximité)

**Commits** : `feat(comparateur): ajouter critère nature opt-in par couvert OSO à proximité` + `docs(comparateur)` avec `NATURE_TERRITORIAL.md` (doctrine V1 figée).

**Quoi** : nouveau critère SCORÉ **opt-in** `nature` = caractère naturel à proximité, pesé seulement si l'utilisateur le formule (aucun effet sinon). Comble le trou « nature » de l'audit sémantique. Premier critère bâti pour combler un trou sémantique.

**Source + méthode** : **OSO 2023** (CESBIO/Théia, raster 10 m), calcul zonal par commune (`scripts/populate-nature.py`, Python + rasterio, **offline** ; env. géospatial requis). Définition **élargie « perçu comme naturel »** = couvert naturel strict + **prairies** (forêts, landes, garrigue, pelouses, marais, dunes, eaux + prairies extensives) ; **exclut** grandes cultures intensives, vignes, vergers. Maille = **rayon 15 km** pondéré surface (pas la commune : Grenoble 19 % intra → 79 % rayon). Score = **percentile national du rayon** (ranking) ; `brut_pct` + `composition` pour le rapport.

**Décisions tranchées sur données réelles** : OSO vs CLC (OSO récent + finesse bocage : Vire 11 % forêt OSO vs 2 % CLC à 25 ha) ; élargi vs strict (l'Aubrac tombe à 11 % en strict OSO, classé « prairies », 100 % en élargi → prairies incluses) ; vignes/vergers exclus (Meursault 18 % → 65 % si inclus ; nature ≠ paysage agricole). **Limite assumée** : prairies intensives lisent « naturel » ; on mesure un PAYSAGE perçu naturel, pas la biodiversité.

**Glose stricte** : « forêts, prairies et milieux naturels autour ». Jamais « biodiversité / sauvage / préservé » (non mesurés).

**Fix global** : `passesHard` exclut désormais les communes à **population nulle** (14, ex. Conques-en-Rouergue) pour TOUTES les requêtes, pour ne pas faire remonter de communes fantômes via nature.

**Vérifié sur le moteur** : build OK ; nature seule → Bagnères-de-Bigorre / Bourg-d'Oisans / Digne (min pop 3 063, aucune commune fantôme) ; **nature + emploi → Annecy en tête** (sweet-spot naturel-vivant) ; nature + soins, nature + services cohérents. Score percentile discriminant (Coulon 9, Outarville 0, Grenoble 73, Annecy 79, Nasbinals 99).

**Cache** : OSO 2023 (737 Mo) + contours gitignorés (`data/cache-nature/`) ; dérivé dans l'index ; script rejouable.

**Reste / V2** : effet rayon qui relève les vignobles via leur environnement boisé (accepté) ; tension future avec un signal mobilité ; classes spécialisées (vignes/vergers/pastoral) réversibles si tests utilisateurs.
