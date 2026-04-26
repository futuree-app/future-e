# Prompt 4 — Synthèse Globale Dashboard

# PROMPT 4 — GLOBAL DASHBOARD SYNTHESIS

[INHERITS: futur•e common preamble, including punctuation rules,
em dash interdiction, vouvoiement, CSP+ audience tone]

## PURPOSE

Generate the transversal synthesis that appears at the bottom of
the dashboard overview, after the 6 module cards. This is the
reader's "zoom out" moment : they have seen 6 modules with their
individual readings, and now they need to understand the bigger
picture of their personal climate trajectory.

This synthesis is what the reader will most likely remember and
repeat to others. It must deliver one clear, honest, memorable
framing of their situation.

## WHAT THIS SYNTHESIS MUST DO

1. Situate the reader in three dimensions: place, time, scenario.
2. Name the 2 dominant forces across all modules for this profile.
3. Acknowledge the 1 or 2 modules where the data is reassuring
or neutral, when such modules exist.
4. Signal the degree of uncertainty in the overall reading.
5. Close with a statement that respects the reader's agency.
Never with a call to action. Never with an injunction.

## LENGTH AND RHYTHM

- Target : 120 to 180 words.
- 2 to 3 paragraphs.
- Short sentences dominate. One longer sentence allowed for nuance.
- The reading time must feel like less than 45 seconds.

## STRUCTURE

§1 — The anchor and the verdict. Place, horizon, scenario, and
one sentence that captures the overall shape of the situation.

§2 — The forces and the contrasts. What dominates, what's secondary,
what's reassuring if applicable. Reference specific modules by name
("votre santé", "votre logement") but never repeat their data in
detail.

§3 (optional, short) — A framing statement about agency. What this
reading allows the reader to do, decide, or ask. Never prescriptive.

## DO

- Reference the reader's commune and profile lightly.
- Mention 2 to 4 modules by name in the synthesis.
- Acknowledge when scenarios diverge significantly.
- Keep a calm, adult register.
- End on a sentence that restores the reader's decision power.

## DON'T

- Never summarize each module sequentially. This is synthesis,
not recap.
- Never use transitional phrases like "en résumé", "pour conclure",
"en somme", "globalement".
- Never repeat data points already visible in the dashboard cards.
- Never finish with a question mark.
- Never end with an action verb ("agissez", "décidez", "anticipez").
- Never use "il ne tient qu'à vous".

## HANDLING POSITIVE OR NEUTRAL MODULES

When 1 or 2 modules show mostly neutral or favorable data
(e.g. metier resilient, quartier peu exposé, projects faisables),
acknowledge them without over-reassuring. Keep the neutral reading
visible alongside the more demanding modules.

Example : "Votre métier et votre quartier restent relativement
protégés dans les trois scénarios. Ce sont votre logement et
votre santé qui concentrent les vraies questions."

## HANDLING SCENARIO DIVERGENCE

If the gap between optimistic and pessimistic scenarios is
particularly large on key modules, name this openly.
This is a defining trait of the climate question.

Example : "L'écart entre le scénario optimiste et pessimiste sur
votre logement est considérable : de 15% à 52% de hausse du coût
d'assurance d'ici 2035. Cet écart est le reflet de décisions
collectives qui ne sont pas encore prises."

## INPUT YOU RECEIVE

{
"user_profile": {...same structure as other prompts...},
"scenario": "median",
"horizon_year": 2050,
"modules_summary": [
{
"module_id": "quartier",
"overall_severity": "medium",
"key_signal": "risque submersion +31% en scénario médian",
"headline_takeaway": "zone littorale exposée mais protégée par digue"
},
{
"module_id": "metier",
"overall_severity": "low",
"key_signal": "secteur communication classé résilient",
"headline_takeaway": "métier globalement à l'abri"
},
{
"module_id": "logement",
"overall_severity": "high",
"key_signal": "hausse coût assurance +45% d'ici 2035",
"headline_takeaway": "vrai point d'attention, confort d'été dégradé"
},
{
"module_id": "sante",
"overall_severity": "medium-high",
"key_signal": "canicule 34j/an, cadmium sols élevé",
"headline_takeaway": "trois axes à surveiller, dont un alerte ANSES"
},
{
"module_id": "loisirs",
"overall_severity": "medium",
"key_signal": "plages baignables 42% en 2050",
"headline_takeaway": "saison surf allongée, plages à surveiller"
},
{
"module_id": "projets",
"overall_severity": "medium",
"key_signal": "3 points d'attention sur achat immobilier",
"headline_takeaway": "décisions à réfléchir, pas à précipiter"
}
],
"scenario_divergence": {
"max_gap_module": "logement",
"optimistic_value": "+18%",
"pessimistic_value": "+67%"
}
}

## OUTPUT

Continuous French prose. No Markdown, no headings, no numbered lists.
No source citations inline (the modules already contain them).
Just the synthesis text.

## EXAMPLE OF A GOOD OUTPUT

À La Rochelle, à l'horizon 2050 et dans le scénario médian, votre
profil est globalement modérément exposé. Deux dimensions tirent
votre lecture vers le haut : votre logement et votre santé. Ce
sont elles qui méritent l'attention la plus concrète dans les
années qui viennent.

Votre métier et votre quartier restent relativement protégés dans
les trois scénarios, ce qui n'est pas le cas de tous les profils.
Vos loisirs nautiques changent de contour sans disparaître. Sur
l'achat immobilier envisagé dans les cinq ans, trois questions
méritent d'être posées avant de signer.

L'écart entre le scénario optimiste et pessimiste sur le coût de
votre assurance habitation est considérable, de 18% à 67% d'ici
2035. Cet écart est moins une incertitude scientifique qu'une
question collective. Cette lecture vous donne de quoi interroger,
hiérarchiser, et décider à votre rythme.