# 02.7 — Journal des décisions produit

## Format de chaque entrée

Date · Sujet · Décision · Raison · Impact · Statut

---

**17/04/2026 · Nom du produit**
Décision : futur•e (minuscules, point médian orange, pas de majuscule)
Raison : inclusif, distinctif, typographiquement fort, différent de tout
concurrent
Impact : branding, communication, domaine futuree.fr
Statut : Validé ✅

---

**17/04/2026 · Positionnement central**
Décision : "Lucidité pas panique, données pas opinions"
Raison : différenciation claire vs médias climat anxiogènes et vs outils
B2B froids
Impact : manifeste, ton éditorial, prompts, landing
Statut : Validé ✅

---

**17/04/2026 · Pricing**
Décision : Gratuit / 14€ one-shot / 9€ mois individuel / 15€ mois foyer
Raison : conversion progressive, foyer justifié par valeur ajoutée concrète
(matrice, comparateur, newsletter enrichie)
Impact : Stripe, onboarding, marketing, prévisions économiques
Statut : Validé, à réévaluer après 3 mois de beta ✅

---

**17/04/2026 · Score synthétique**
Décision : Pas de score unique, ni individuel ni foyer
Raison : invite à la compétition entre foyers, à la culpabilité, à
l'optimisation. Contraire à la philosophie du produit.
Impact : dashboard, UX, prompts, positionnement
Statut : Validé, non négociable ✅

---

**17/04/2026 · Tirets cadratins**
Décision : Interdits dans tous les outputs IA et dans l'interface
Raison : signature visuelle la plus reconnaissable des textes LLM, détruit
la crédibilité éditoriale
Impact : préambule commun, tous les 10 prompts, interface
Statut : Validé, non négociable ✅

---

**17/04/2026 · Direction artistique**
Décision : Glassmorphism sombre, palette validée, typos Inter Tight /
Instrument Serif / JetBrains Mono
Raison : distinctif, premium, éditorial sans être froid, évite l'esthétique
app verte générique
Impact : tous les protos, composants React, future charte graphique
Statut : Validé ✅

---

**17/04/2026 · Modules — nommage initial**

Décision : Quartier / Logement / Métier / Santé / Loisirs / Projets
Raison : noms courts et incarnés, correspondent à ce que l'utilisateur comprend immédiatement de sa vie
Impact : interface, prompts, onboarding, marketing
Statut : Révisé le 18/04/2026 (voir entrée ci-dessous) ↓

---

**18/04/2026 · Modules — renommage Module 5 et redistribution Loisirs**

Décision : Module 5 devient "Mobilité et territoire" (Option B retenue). Les loisirs et pratiques (surf, ski, baignade, randonnée, jardinage, chasse, pêche) se redistribuent dans les modules Quartier (accès aux espaces naturels, pratiques locales liées au territoire) et Santé (qualité des eaux de baignade, chaleur lors des activités sportives, pollens). Ils ne constituent pas un module autonome.

Raison : Mobilité quotidienne et loisirs sont deux logiques utilisateur distinctes. La mobilité concerne une fragilité budgétaire et structurelle quotidienne — c'est un pilier central de la promesse futur•e. Les loisirs en revanche ne méritent pas un module autonome : ils s'intègrent naturellement dans Quartier (ce que mon territoire permet de faire) et dans Santé (ce que mon environnement fait à mon corps quand je pratique).

L'Option B évite le fourre-tout "Mobilités et loisirs" qui dilue les deux logiques.

Impact : 02.1 Vision produit, 02.4 catalogue tensions, 02.2 parcours, onboarding, prompts, 03.6 Pages Savoir

Statut : Validé ✅

---

**18/04/2026 · Tensions mobilité — fusion carburant_volatil**

Décision : le catalogue passe à 26 tensions (pas 27). Les tensions "mobilite_fragile" et "carburant_volatil" sont fusionnées en une seule : "Mon mode de vie quotidien à {commune} repose-t-il trop sur la voiture ?" La tension "voiture_electrique" reste distincte.
Raison : du point de vue de l'utilisateur, les deux questions sont la même.

La dépendance automobile inclut naturellement l'exposition budgétaire au prix du carburant. Deux tensions distinctes produiraient de la redondance dans le module Q&R et dilueraient le signal.

Impact : 02.4 catalogue tensions, 02.4 catégories communes (seuils explicites), Prompt 10

Statut : Validé ✅

---

**17/04/2026 · Notifications push**
Décision : 4 types uniquement (seuil franchi / alerte sanitaire /
amélioration positive / décision locale)
Raison : éviter sur-notification et faux positifs qui détruisent la
confiance
Impact : prompt 8, backend veille, UX paramètres notifications
Statut : Validé ✅

---

**17/04/2026 · Timing notifications**
Décision : Jamais entre 22h et 7h. Jamais deux fois sur le même sujet
en 30 jours.
Raison : respect du lecteur, cohérence avec positionnement non anxiogène
Impact : backend notifications, prompt 8
Statut : Validé ✅

---

**17/04/2026 · Signaux communautaires**
Décision : Écarté pour MVP et v2, à réévaluer en v3 uniquement
Raison : risque désinformation, modération lourde, contradictoire avec
ton sobre et sourcé, distraction en phase de construction
Impact : roadmap, positionnement
Statut : En attente v3 ⏳

---

**17/04/2026 · Eau potable**
Décision : Intégré dans module Santé comme sous-dimension, pas module
autonome
Raison : pertinent mais pas assez large pour module seul. Croise
qualite-eau.fr, BRGM nappes, ARS, restrictions sécheresse.
Impact : sources module Santé, prompt 1 module santé
Statut : Validé ✅

---

**17/04/2026 · Newsletter**
Décision : Dans MVP dès le lancement, mode artisanal les 6 premiers mois
Raison : rétention critique (brise le cycle amnésie climatique), faisable
manuellement avec Prompt 9 et Buttondown gratuit
Impact : prompt 9, roadmap M6
Statut : Validé ✅

---

**17/04/2026 · Notifications automatisées**
Décision : v1.5 ou v2, pas dans le MVP
Raison : complexité technique moteur de veille, risque faux positifs,
rétention assurée par newsletter d'abord, budget dev insuffisant au
démarrage
Impact : roadmap, backend, prompt 8
Statut : Reporté v1.5 ⏳

---

**17/04/2026 · Questions dynamiques landing**
Décision : 4 questions sélectionnées dynamiquement dans catalogue de
24 tensions selon catégories de la commune
Raison : crédibilité immédiate, l'utilisateur sent que le produit comprend
sa géographie, impact direct sur la conversion
Impact : prompt 10, catalogue tensions, table communes_categorization,
backend
Statut : Validé, à implémenter M1-2 ✅

---

**17/04/2026 · Statut juridique**
Décision : Micro-entreprise au lancement, bascule SASU vers M12-18
Raison : simplicité, compatible emploi salarié ABC, suffisant pour les
revenus initiaux, pas de capital à mobiliser
Impact : facturation, TVA, CGV, RGPD
Statut : À créer cette semaine 🔴

---

**17/04/2026 · Accord ABC**
Décision :  futur•e est développé en parallèle de l'activité ABC sur temps libre. ABC pourrait aider plus tard (partenariat potentiel).
Raison : clarification nécessaire avant tout investissement de temps
Impact : clause de non-concurrence, positionnement, futurs partenariats
Statut : Accord verbal 🔴, accord écrit recommandé 🔴

---

**17/04/2026 · Crédit one-shot vers Suivi**
Décision : Un utilisateur ayant payé le one-shot 14€ peut basculer
en Suivi avec ses 14€ déduits automatiquement (couvre le premier mois
à 9€ et 5€ sur le second).
Raison : convertit les one-shot en abonnés sans friction, honnête
(l'utilisateur ne repaye pas ce qu'il a déjà payé), coût nul à proposer via Stripe credits
Impact : Stripe (credit balance), onboarding one-shot, email de
conversion automatique à J+7 après achat one-shot
Statut : Validé ✅, à implémenter avec le paiement en mois 3

---

**17/04/2026 · Stack technique**
Décision : Next.js 14 + Supabase + Vercel + Stripe + Claude API +
Buttondown + Resend
Raison : stack connu (AssoFlow), coût quasi nul les 6 premiers mois,
scalable, pas de dette technique majeure
Impact : tout le développement
Statut : Validé ✅

---

**17/04/2026 · Budget lancement**
Décision : Objectif < 50€/mois les 6 premiers mois
Raison : contrainte financière explicite, side project en parallèle
d'un emploi salarié, validation du produit avant investissement
Impact : choix des outils, roadmap, pas de dev salarié avant M12+
Statut : Validé ✅

---

17/04/2026 - Application mobile native
Décision : Pas en année 1 ni en priorité année 2. PWA installable
dès mois 4-5 (Next.js natif, coût 1-2 jours dev). App React Native
envisagée en année 2 uniquement si sessions mobile > 40% et revenus
le permettent.
Raison : produit de lecture lente, cible principalement desktop/tablette,
App Store contraignant, fragmentation dev coûteuse trop tôt
Impact : roadmap, stack, budget
Statut : Reporté, à réévaluer en fin d'année 1 sur métriques 🔴

## Questions ouvertes (à arbitrer)

Les décisions suivantes sont en suspens. Elles seront arbitrées au fur
et à mesure du développement et des retours beta.

- Comment regrouper précisément les sous-facteurs sans perdre la richesse
du produit dans chaque module
- Quel niveau de granularité géographique est réellement soutenable avec
les données publiques disponibles (commune ok, IRIS à vérifier source
par source)
- Quel équilibre entre onboarding riche (profil complet) et onboarding
minimal (commune + âge) pour maximiser la conversion
- Comment articuler question-réponse, rapport et pages Savoir dans
le parcours payant (double entrée ou linéaire)
- À partir de quel moment une recommandation devient trop prescriptive
et sort du positionnement éditorial
- Comment gérer les communes avec peu de données publiques disponibles
sans dégrader la qualité perçue
- Quel est le bon moment pour introduire le mode foyer dans l'onboarding
(au premier rapport ou après le premier mois)