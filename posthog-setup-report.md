<wizard-report>
# PostHog post-wizard report

The wizard has completed a full PostHog integration for the futur·e Next.js 16 App Router project. Here is a summary of all changes made:

**New files created:**
- `instrumentation-client.ts` — client-side PostHog initialisation using the Next.js 15.3+ `instrumentation-client` convention, with EU host, `/ingest` reverse proxy, and automatic exception capture enabled.
- `instrumentation.ts` — server-side OpenTelemetry setup (Node.js runtime only). Registers `AnthropicInstrumentation` to auto-capture `$ai_generation` events from every `@anthropic-ai/sdk` call, routed to PostHog via `PostHogSpanProcessor`.
- `src/lib/posthog-server.ts` — server-side PostHog factory (returns a fresh `posthog-node` client per call, with `flushAt: 1` and `flushInterval: 0` for serverless compatibility).
- `src/app/(account)/rapport/RapportTrackedLinks.tsx` — `"use client"` wrapper components (`TrackedModuleLink`, `TrackedUpgradeLink`) used by the server-rendered rapport page to fire click events.
- `src/app/(public)/checkout/[product]/CheckoutViewedTracker.tsx` — `"use client"` component that fires `checkout_viewed` once per checkout page mount.

**Modified files:**
- `next.config.ts` — added EU reverse proxy rewrites (`/ingest/*` → `eu.i.posthog.com`, `/ingest/static/*` and `/ingest/array/*` → `eu-assets.i.posthog.com`) and `skipTrailingSlashRedirect: true`.
- `src/app/auth/actions.ts` — server-side `identify` + capture for `user_logged_in`, `user_signed_up`, `user_signed_out`.
- `src/components/GoogleSignInButton.tsx` — captures `google_sign_in_clicked` on button click.
- `src/app/api/stripe/webhook/route.ts` — captures `payment_completed` with amount, product type, and payment intent ID when Stripe confirms a payment.
- `src/app/api/stripe/create-payment-intent/route.ts` — captures `payment_intent_created` with product type, amount, and user ID.
- `src/components/SuiviWaitlistForm.tsx` — captures `suivi_waitlist_joined` with commune and motivation on successful form submission.
- `src/app/(account)/rapport/page.tsx` — uses `TrackedModuleLink` and `TrackedUpgradeLink` to capture `report_module_opened` and `report_upgrade_cta_clicked`.
- `src/app/(public)/checkout/[product]/page.tsx` — mounts `CheckoutViewedTracker` to fire `checkout_viewed`.
- `src/app/qna/route.ts` — manual `$ai_generation` capture added. This route calls Anthropic via raw `fetch` (bypassing the SDK), so OTel can't auto-instrument it; latency, token counts, model, and trace ID are captured explicitly after each successful response.
- `.env.local` — `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` set.

---

## Events instrumented

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully creates an account with email/password | `src/app/auth/actions.ts` |
| `user_logged_in` | User successfully logs in with email/password | `src/app/auth/actions.ts` |
| `user_signed_out` | User signs out from their account | `src/app/auth/actions.ts` |
| `google_sign_in_clicked` | User clicks the 'Continuer avec Google' button | `src/components/GoogleSignInButton.tsx` |
| `checkout_viewed` | User views a checkout page — top of the payment conversion funnel | `src/app/(public)/checkout/[product]/page.tsx` |
| `payment_intent_created` | Stripe payment intent successfully created | `src/app/api/stripe/create-payment-intent/route.ts` |
| `payment_completed` | Stripe webhook confirms a successful payment | `src/app/api/stripe/webhook/route.ts` |
| `suivi_waitlist_joined` | User successfully submits the Suivi waitlist form | `src/components/SuiviWaitlistForm.tsx` |
| `report_module_opened` | User clicks to open a report module from the rapport hub | `src/app/(account)/rapport/page.tsx` |
| `report_upgrade_cta_clicked` | Free-plan user clicks the 'Ouvrir le rapport complet' upgrade CTA | `src/app/(account)/rapport/page.tsx` |
| `wizard_completed` | User completes all 6 wizard steps and reaches the aperçu screen | `src/components/wizard/ReportWizard.tsx` |
| `comparator_commune_selected` | User selects a commune and clicks 'Comparer' in the landing comparator | `src/components/LandingComparatorInput.tsx` |
| `pro_inscription_submitted` | Professional successfully submits the pro inscription form | `src/app/api/inscription-pro/route.ts` |

---

## LLM analytics

Two Anthropic routes are now instrumented:

| Route | Method | Coverage |
|---|---|---|
| `src/app/api/synthesize-logement/route.ts` | OTel auto-instrumentation via `instrumentation.ts` | Model, tokens, latency, cost captured automatically |
| `src/app/qna/route.ts` | Manual `$ai_generation` capture | Model, tokens, latency, HTTP status, trace ID captured |

Events appear under **[LLM Analytics → Generations](https://eu.posthog.com/llm-analytics/generations)** and **[Traces](https://eu.posthog.com/llm-analytics/traces)** in PostHog.

**Packages added:** `@posthog/ai`, `@opentelemetry/sdk-node`, `@opentelemetry/resources`, `@traceloop/instrumentation-anthropic`

---

## Next steps

We've built a dashboard and five insights to keep an eye on user behavior, based on the events we just instrumented:

- [Dashboard — Analytics basics](/dashboard/697864)
- [New signups (last 30 days)](/insights/2Dy3524C)
- [Checkout conversion funnel](/insights/QF2zeB4J)
- [Wizard completions (last 30 days)](/insights/LEWhxRPg)
- [Revenue — payments completed (last 30 days)](/insights/K3AFSYTW)
- [Lead capture — waitlist & pro signups](/insights/S4yoYFye)

### Agent skill

We've left an agent skill folder in your project at `.claude/skills/integration-nextjs-app-router/`. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
