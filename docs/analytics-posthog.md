# Analytics PostHog — futur•e

> Dernière mise à jour : 2026-08-21

---

## Propriétés communes (helpers)

### `buildGeoProps(ctx)` — `src/lib/posthog-props.ts`

Produit les propriétés géographiques du territoire analysé (`report_geo`).

| Propriété | Type | Source |
|---|---|---|
| `commune` | string \| null | `home_commune` profil |
| `insee_code` | string \| null | `home_insee_code` profil |
| `department` | string \| null | Dérivé des 2 premiers chiffres de l'INSEE |
| `region` | string \| null | Table `src/lib/regions-fr.ts` (13 régions + 5 DOM-TOM) |
| `report_id` | string \| null | `inseeCode` en priorité |

> **report_geo ≠ user_geo** : `report_geo` est le territoire analysé dans futur•e.  
> `user_geo` (localisation IP de navigation) n'est pas collecté côté client.

### `buildModuleProps(moduleId)` — `src/lib/posthog-props.ts`

| Propriété | Type | Valeurs |
|---|---|---|
| `risk_category` | string | `quartier`, `logement`, `sante`, `autre` |
| `module_index` | number | 1–6 (ordre dans le rapport) |

---

## Événements implémentés

### Funnel Wizard

#### `wizard_step_viewed`
Déclenché une seule fois par étape par session de wizard.

| Propriété | Valeurs |
|---|---|
| `step` | `adresse`, `logement`, `metier`, `sante`, `mobilite`, `projets` |
| `step_index` | 0–5 |
| `commune`, `insee_code`, `department`, `region` | geo du territoire saisi |
| `report_id` | inseeCode |

**Source :** client · `src/components/wizard/ReportWizard.tsx`

#### `wizard_completed`
Déclenché quand l'utilisateur passe la dernière étape (step 5→6).

| Propriété | Notes |
|---|---|
| `commune`, `secteur`, `mobilite`, `projets` | Réponses du wizard |
| `unknown_answers_count` | Nombre d'étapes skippées |
| `insee_code`, `department`, `region`, `report_id` | Géographie complète |

**Source :** client · `src/components/wizard/ReportWizard.tsx`

---

### Modules du rapport

#### `report_module_opened`
Déclenché à deux moments distincts — différencier via `source`.

| Propriété | Valeurs |
|---|---|
| `module_id` | `quartier`, `autour`, `logement` |
| `source` | `hub` (clic depuis `/rapport`) · `page` (arrivée sur la page module) |
| `surface` | `echelle_navigator` pour le repère supérieur de `/rapport` · absent sur la page module |
| `risk_category` | cf. `buildModuleProps` |
| `module_index` | 1–3 |
| `commune`, `insee_code`, `department`, `region`, `report_id` | geo |

**Filtre recommandé pour compter les ouvertures uniques :**
```
event = report_module_opened AND source = "page"
```

**Source :** client · `src/hooks/useModuleTracking.ts` + `src/components/report/EchelleNavigator.tsx`

#### `report_scale_address_required`
Déclenché quand le dossier ne couvre que Territoire et que le lecteur choisit le geste distinct
« Analyser une adresse ». Les deux niveaux fermés ne sont jamais rendus comme des liens accessibles.

| Propriété | Valeurs |
|---|---|
| `requested_modules` | `["autour", "logement"]` |
| `source` | `hub` |
| `surface` | `echelle_navigator` (le repère, AVANT la lecture) · `fin_de_dossier` (la carte qui suit les contrôles, APRÈS la lecture) |
| `commune`, `insee_code`, `department`, `region`, `report_id` | geo |

Les deux emplacements portent la même destination et le même événement, et se distinguent par
`surface` : c'est ce qui permettra d'en retirer un. La question posée est « quel moment déclenche le
geste », pas « combien de clics au total » — grouper sans `surface` répond à côté.

**Source :** client · `src/components/report/EchelleNavigator.tsx` et
`src/app/(account)/rapport/RapportTrackedLinks.tsx`

#### `report_module_scroll`
Déclenché aux seuils 25 / 50 / 75 / 90 %.

| Propriété | Notes |
|---|---|
| `module_id` | — |
| `scroll_percentage` | 25, 50, 75 ou 90 |
| `time_spent_seconds` | Depuis l'ouverture de la page |
| `risk_category`, `module_index` | — |
| `commune`, `insee_code`, `department`, `region`, `report_id` | geo |

**Source :** client · `src/hooks/useModuleTracking.ts`

#### `report_module_closed`
Déclenché au démontage du composant (navigation, fermeture, refresh).

| Propriété | Notes |
|---|---|
| `module_id` | — |
| `read_percentage` / `scroll_depth_pct` | Identiques — deux noms pour rétrocompatibilité dashboards |
| `time_spent_seconds` / `time_spent_sec` | Identiques — idem |
| `risk_category`, `module_index` | — |
| geo | — |

**Filtre recommandé :**
```
event = report_module_closed GROUP BY scroll_depth_pct
```

**Source :** client · `src/hooks/useModuleTracking.ts`

---

### Changement d'horizon climatique

#### `report_scenario_changed`
Déclenché quand l'utilisateur clique sur un bouton d'horizon dans la HorizonBar.

| Propriété | Valeurs |
|---|---|
| `from_scenario` | `2030`, `2050`, `2100` |
| `to_scenario` | `2030`, `2050`, `2100` |
| `module_id` | module actif si disponible |
| `risk_category` | null (non déterminé au niveau HorizonBar) |
| geo | commune + insee_code + department + region + report_id |

**Source :** client · `src/components/report/HorizonBar.tsx`

> `report_horizon_viewed` (au montage) n'est pas implémenté pour éviter la duplication avec `report_module_opened`. Utiliser ce dernier filtré sur `source = "page"`.

---

### Feedback IA

#### `ai_feedback_positive` / `ai_feedback_negative`
Événements granulaires (conservés pour rétrocompatibilité).

#### `ai_feedback_submitted` ← recommandé pour les dashboards
Événement unifié émis en complément des deux précédents.

| Propriété | Valeurs |
|---|---|
| `feedback` | `positive` · `negative` |
| `question_category` | `null` (classification NLP non disponible côté client) |
| `module_id` / `module_context` | Déduit de `window.location.pathname` |
| `trace_id` | `{sessionId}_msg{index}` |
| `report_id` | inseeCode de la commune AskFuture |

**Filtre recommandé :**
```
event = ai_feedback_submitted GROUP BY feedback
```

**Source :** client · `src/components/AskFuture.tsx`

---

### Génération IA (QnA)

#### `$ai_generation`
Événement PostHog LLM standard enrichi.

| Propriété | Notes |
|---|---|
| `$ai_trace_id`, `$ai_provider`, `$ai_model` | Standard PostHog LLM |
| `$ai_input_tokens`, `$ai_output_tokens`, `$ai_latency` | Performance |
| `question_category` | Déduit de `tension.id` via mapping de règles |
| `module_id` / `module_context` | `tension.id` |
| `report_id` | `inseeCode` transmis dans le body de la requête |

**Valeurs `question_category` autorisées :**
`chaleur`, `eau`, `inondation`, `logement`, `energie`, `sante`, `assurance`, `demenagement`, `autre`

**Source :** serveur · `src/app/qna/route.ts`

---

### Checkout / Intentions de paiement

#### `checkout_viewed` (existant, conservé)
```
{ product: "rapport-complet" | "suivi" }
```

#### `checkout_started` ← nouveau
```
{ plan, price, source }
```

**Source :** client · `src/app/(public)/checkout/[product]/CheckoutViewedTracker.tsx`

#### `report_upgrade_cta_clicked` (existant, enrichi)
```
{ source: string }
```

---

### Contrôle prioritaire du dossier

> Ajoutés le 19/08/2026. Ils ne mesurent pas une « performance » de la ligne : ils cadrent la question
> qualitative posée en entretien (`docs/protocoles/2026-08-19-premier-controle-entretien.md`) —
> sur quels sujets le contrôle prioritaire tombe, et est-il utilisé pour aller voir la carte.

#### `priority_control_shown`
Déclenché une fois par montage du bloc de verdict qui porte une démarche. Jamais sur `/dev/*`.

| Propriété | Valeurs |
|---|---|
| `ordre` | `priorite` (« À contrôler en priorité ») ou `ensuite` (le héros a déjà nommé le contrôle) |
| `actions_count` | 1 ou 2 (plafond du moteur) |
| `actions_liees` | Combien de démarches mènent réellement à une carte rendue. Un écart avec `actions_count` est un défaut à voir |
| `sujets` | Identifiants de carte, code INSEE retiré (`composition-argiles-ppr`) |
| `types` | `demander` \| `regarder` \| `consulter` \| `faire_faire` \| `autre`, dérivés du verbe |

**Source :** client · `src/components/report/PriorityControlActions.tsx`

#### `priority_control_activated`
Déclenché au clic sur une démarche, juste avant le déplacement vers sa carte.

| Propriété | Valeurs |
|---|---|
| `ordre` | idem ci-dessus |
| `position` | 0 pour la première démarche, 1 pour la seconde |
| `sujet`, `type` | idem, au singulier |

**Source :** client · `src/components/report/PriorityControlActions.tsx`

**Ce qui ne part pas** : aucune adresse, aucun libellé de geste mot pour mot, aucun code INSEE, aucune
réponse libre. La réduction est faite par la lib pure `src/lib/decision/priority-control-telemetry.ts`,
testée. Une réponse libre à la question d'entretien **ne doit pas** être envoyée à PostHog : le dépôt
n'a aucune convention pour y stocker du verbatim.

---

### Événements existants non modifiés

| Event | Source |
|---|---|
| `google_sign_in_clicked` | `GoogleSignInButton.tsx` |
| `comparator_commune_selected` | `LandingComparatorInput.tsx` |
| `suivi_waitlist_joined` | `SuiviWaitlistForm.tsx` |
| `user_logged_in`, `user_signed_up`, `user_signed_out` | `auth/actions.ts` (serveur) |
| `$pageview` | `PostHogProvider.tsx` (auto) |

---

## Événements préparés mais non branchés

| Event | Raison | Où brancher |
|---|---|---|
| `report_exported_pdf` | Bouton PDF inexistant | Ajouter dans le composant d'export quand implémenté |
| `report_shared` / `report_link_copied` | Boutons de partage inexistants | Idem |
| `pricing_page_viewed` | Section `#pricing` non instrumentée | Ajouter un `IntersectionObserver` dans `FutureELanding.tsx` sur `<section id="pricing">` |
| `checkout_abandoned` | Pas de hook Stripe disponible côté client simple | Brancher sur l'événement `payment_intent.canceled` via webhook Stripe |
| `territory_compared` | `comparator_commune_selected` couvre déjà le cas | Renommer ou dupliquer dans `LandingComparatorInput.tsx` si besoin de la taxonomie |

---

## Climate Awareness Score (CAS)

Le CAS n'est pas encore calculé côté app. Les cohorts sont actuellement construites en SQL PostHog.

Quand le score sera disponible (API ou calcul in-app), appeler dans `PostHogProvider.tsx` :

```typescript
posthog.identify(userId, {
  climate_awareness_score: score,        // 0–100
  cas_segment: score < 31 ? "faible"     // "faible" | "moyen" | "fort"
             : score < 71 ? "moyen" : "fort",
  wizard_completed_at: isoDate,
  total_modules_opened: n,
  total_ai_questions: n,
});
```

**Filtres PostHog recommandés pour les cohorts :**
```
person.properties.cas_segment = "faible"   → score 0–30
person.properties.cas_segment = "moyen"    → score 31–70
person.properties.cas_segment = "fort"     → score 71–100
```

---

## Limites connues

1. **`region`** — Dérivée du département. Les codes Corse (`2A`/`2B`) et DOM-TOM (`97X`) sont supportés.
2. **`question_category` dans AskFuture** — `null` côté client. Nécessiterait une classification NLP serveur.
3. **`report_module_opened` double event** — Résolu avec `source = "hub"` vs `source = "page"`. Filtrer sur `source = "page"` pour les comptages uniques.
4. **React Strict Mode (dev)** — `report_module_closed` peut se déclencher au double-mount. Inoffensif en production.
5. **CAS** — Calculé en SQL PostHog, pas encore envoyé via `identify()`. Les cohorts PostHog fonctionnent mais ne sont pas personnalisables par l'utilisateur.
6. **`time_spent_seconds` en cas de navigation par le navigateur (back/forward cache)** — Peut donner une durée négative ou nulle. Acceptable pour une V1.
