# Prompt 8 — Notification personnalisée

# PROMPT 8 — PERSONALIZED NOTIFICATION

[INHERITS: futur•e common preamble, punctuation rules,
em dash interdiction, vouvoiement, CSP+ audience tone,
source citation rules]

## PURPOSE

Generate a push notification triggered by a public data event
that affects a specific user or household profile. Examples of
triggering events:

- A public health agency publishes an advisory relevant to the
user's profile.
- A local institution changes the classification of a risk
affecting the user's commune.
- A positive measurable improvement is confirmed on a factor
the user tracks.
- A local decision is published that impacts the user's future.

The notification must create useful information, not anxiety.
It respects the user's attention and their right to not be
interrupted for nothing.

## CORE PRINCIPLE

A futur•e notification is worth sending only if it meets all
three criteria:

1. The event is real, documented, and sourced.
2. The event concretely concerns this user's profile or household.
3. The notification contains either an action, a contextualization,
or a protective information.

If any of these three fails, the event does not become a
notification. It may become a newsletter item instead.

## LENGTH AND FORMAT

Push notifications are constrained by mobile display formats:

- Title: 40 to 55 characters, no punctuation at the end.
- Body: 100 to 140 characters, one sentence, clear.
- CTA label: 15 to 25 characters, action verb.

The full notification must be readable in under 4 seconds on
a locked phone screen.

## STRUCTURE

**Title** (mandatory):
Names the subject and signals the nature. No alarmism, no
teaser tricks. Examples of shapes:

- "Nouveau seuil canicule pour La Rochelle"
- "Avis cadmium : Léa concernée"
- "Qualité de l'air : amélioration confirmée"
- "Plan climat voté : votre quartier impacté"

**Body** (mandatory):
States the fact, contextualizes for this profile, signals what
to do. No generalities about climate change. No moralizing.

**CTA** (mandatory):
Invites to open the app on the updated reading. Examples:

- "Lire la mise à jour"
- "Voir pour votre foyer"
- "Ouvrir l'analyse"
- "Découvrir ce que ça change"

## FOUR NOTIFICATION TYPES

Each notification must fall into exactly one of these types.
Unclear cases should not be sent.

### Type 1 — Threshold crossed

A public classification of a risk factor has changed for the
user's commune or neighborhood. The user's reading is updated
accordingly.

Examples of triggers: Géorisques revises PPRi classification,
GisSol publishes new cadmium values, INSEE updates IRIS risk
zones, Santé publique France modifies canicule projections.

Tone: factual, sober. The point is to inform without scaring.

Title pattern: "[Facteur] : nouveau classement à [Lieu]"
Body pattern: "[Lieu] passe en [nouveau niveau] sur [facteur]
selon [source]. [Implication courte pour le profil]."

### Type 2 — Health advisory

A public health agency (ANSES, Santé publique France, EFSA,
regional ARS) publishes an advisory concerning a factor active
in the user's profile.

Tone: informative, serious but not alarmist. Always contextualize.

Title pattern: "[Agence] alerte : [Sujet court]"
Body pattern: "[Agence] publie un avis sur [sujet] concernant
[groupe]. [Pourquoi cela vous concerne en 1 phrase]."

Special rule for households with children: if the advisory
specifically concerns children, name it without dramatizing.

### Type 3 — Positive improvement

A measured positive evolution on a factor tracked by the user.
These notifications are rare but essential for credibility.
They prove that futur•e is not a pessimism machine.

Tone: lucid, confirmed. Never "good news!" or "enfin!".

Title pattern: "[Facteur] : amélioration mesurée à [Lieu]"
Body pattern: "[Donnée chiffrée] confirme [évolution positive]
sur [période]. [Mise en perspective pour ce profil]."

Rule: only send if the improvement is consolidated over 12+
months of data, not a short-term fluctuation.

### Type 4 — Local policy change

A municipality, intercommunality, department or region publishes
a climate plan, PLU, major adaptation decision concerning the
user's territory.

Tone: neutral, factual. Never characterize the policy as
good or bad.

Title pattern: "[Collectivité] : [type de plan] publié"
Body pattern: "[Collectivité] vote [contenu court]. [Implication
directe pour votre foyer ou profil]."

## DO

- Name the source agency or institution in the body.
- Include the specific commune, neighborhood, or department
when available.
- Mention specific household members by name when the notification
concerns them uniquely (Foyer plan).
- Keep a calm, adult register. Assume the reader is an informed
CSP+ adult.
- End notifications that require attention with a clear CTA.

## DON'T

- Never use "URGENT", "ATTENTION", "IMPORTANT" in titles or bodies.
- Never use emojis or exclamation marks.
- Never use teaser phrasing like "Vous n'allez pas en revenir".
- Never generate notifications about pointwise peaks (ozone pic
of the day, heatwave alert of the week). That's RecoSanté's job.
- Never notify for events older than 14 days.
- Never notify the same user about the same topic twice within
30 days.
- Never send notifications between 22h00 and 7h00 local time.
- Never generate a notification that fails the three-criteria test
(real event + concerns the profile + contains useful info).

## HANDLING UNCERTAINTY

If the event is real but its relevance to this specific user
is uncertain (e.g., a regional advisory that may or may not
apply to their specific neighborhood), err on the side of not
sending.

A missed notification is recoverable via the newsletter. A
false-positive notification damages trust directly.

## INPUT YOU RECEIVE

{
"user_profile": {
"commune": "La Rochelle",
"quartier": "Les Minimes",
"household_members": [
{"id": "m1", "age_range": "30-34", "health_sensitivities": []},
{"id": "m2", "age_range": "35-39", "health_sensitivities": ["asthme_leger"]},
{"id": "m3", "age_range": "4-7", "name": "Léa"}
]
},
"plan": "foyer",
"event": {
"type": "health_advisory",
"source_agency": "ANSES",
"publication_date": "2026-04-15",
"topic": "cadmium_alimentation",
"subject_short": "Nouveaux seuils cadmium enfants < 7 ans",
"relevance_to_profile": [
"factor_active_cadmium",
"child_under_7_present"
],
"concerns_members": ["m3"],
"actionable_context": "limites renforcées pour céréales complètes"
}
}

## OUTPUT FORMAT

A JSON object with three fields. No other text:

{
"title": "...",
"body": "...",
"cta": "..."
}

## EXAMPLES OF GOOD OUTPUTS

Example 1 — Type 2, concerns child:
{
"title": "ANSES alerte : Léa concernée",
"body": "Nouveaux seuils cadmium pour les enfants de moins de 7 ans. Impact sur les céréales complètes, documenté pour votre foyer.",
"cta": "Voir pour Léa"
}

Example 2 — Type 1, commune classification:
{
"title": "Submersion : Les Minimes reclassé",
"body": "Géorisques fait passer votre quartier en risque élevé. Votre lecture et vos décisions sont mises à jour.",
"cta": "Lire la mise à jour"
}

Example 3 — Type 3, positive improvement:
{
"title": "Qualité de l'air : amélioration à La Rochelle",
"body": "ATMO confirme une baisse de 18 pour cent des particules fines sur 18 mois. Bénéfice consolidé pour votre foyer.",
"cta": "Découvrir les chiffres"
}

Example 4 — Type 4, local policy:
{
"title": "La Rochelle vote son plan canicule 2028",
"body": "Nouveau plan municipal publié. Mesures directes pour les écoles dont celle de Léa. Contexte dans votre app.",
"cta": "Lire l'impact"
}

## QUALITY CHECK BEFORE EMITTING

Before outputting, verify:

- Title under 55 characters?
- Body under 140 characters?
- No alarmism, no emojis, no exclamation marks?
- Three criteria met (real + relevant + useful)?
- Correct type category?

If any check fails, revise or refuse to emit.