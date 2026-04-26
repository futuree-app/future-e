# Prompt 2 — Facteur

# PROMPT 2 — FACTOR MICRO-DESCRIPTION

[INHERITS: futur•e common preamble]

## PURPOSE

Generate the short descriptive text that appears under a single
factor card within a module detail view. Each module (santé,
quartier, logement...) contains 4 to 8 factor cards. Each card
displays: an icon, a name, a headline number, and this short
description.

This is the text that tells the reader, in two to four sentences,
what this factor means for them specifically, where the data comes
from, and what to watch for.

## LENGTH AND RHYTHM

- Target: 25 to 55 words.
- 1 to 3 sentences maximum.
- Must read as a single coherent thought, not as a fragment.
- First sentence must carry the most important information.

## WHAT THIS TEXT MUST DO

1. Translate the headline number or status into plain language.
2. Add one piece of local or personal context that makes it matter
to this specific reader.
3. Optionally signal what to watch or where to learn more.

## DO

- Start with the concrete effect, not with the data source.
- Reference the commune or department when relevant.
- Use specific examples (aliments, activités, infrastructures).
- Keep sentences short and declarative.

## DON'T

- Never repeat the headline number already shown on the card.
- Never explain what the measurement methodology is (that belongs
to the Page Savoir).
- Never include the full source citation (the card has a small
source line already).
- Never start with "Cette donnée", "Ce chiffre", "Cet indicateur".
- Never moralize.

## INPUT YOU RECEIVE

{
"user_profile": {...same structure as Prompt 1...},
"scenario": "median",
"horizon_year": 2050,
"factor": {
"id": "cadmium_sols",
"module_id": "sante",
"headline_number": "Teneur élevée",
"headline_unit": null,
"baseline_context": "1 Français sur 2 surexposé (ANSES 2026)",
"local_value": "zone de teneur élevée",
"commune_context": "sols calcaires charentais, cadmium
naturellement concentré",
"affected_items": ["pain", "céréales", "pomme de terre", "légumes"],
"source_short": "GisSol / RMQS"
}
}

## OUTPUT

Plain French prose, no Markdown, no headings, no source block.
Just the short descriptive text.

## EXAMPLES OF GOOD OUTPUTS

Example 1 (cadmium sols, La Rochelle) :
"Les sols charentais, naturellement calcaires, concentrent le
cadmium. Ce métal lourd se retrouve principalement dans le pain,
les céréales, les pommes de terre et les légumes-racines cultivés
localement. Un Français sur deux est surexposé selon l'alerte
sanitaire de début 2026."

Example 2 (jours de canicule, 2050 scénario médian) :
"Vous passerez trois fois plus de temps en alerte canicule
qu'aujourd'hui. Votre appartement de 1985 n'a pas été conçu pour
ces températures. Les nuits chaudes, qui empêchent le corps de
récupérer, deviennent la vraie difficulté sanitaire."

Example 3 (plages baignables, Charente-Maritime) :
"Un tiers des plages du département sont déjà jugées peu
recommandables en 2025 par les agences sanitaires. Les pluies
intenses en été saturent les réseaux d'assainissement et polluent
l'eau de baignade. Les plages des Minimes et de Chef de Baie
restent les plus fiables."

Example 4 (pesticides air, pression modérée) :
"La pression en pesticides dans l'air à La Rochelle est proche
de la moyenne nationale. Quatre substances sont régulièrement
détectées à la station locale, dont le glyphosate et le folpel.
La saison de traitement dans les vignobles de Charente est la
période de plus forte concentration."