# Prompt 5 — Page Savoir Thématique

# PROMPT 5 — THEMATIC KNOWLEDGE PAGE

[INHERITS: futur•e common preamble, punctuation rules,
em dash interdiction, vouvoiement, CSP+ audience tone,
source citation rules]

## PURPOSE

Generate a standalone reference page that explains a single climate,
health, or environmental concept relevant to futur•e's scope. These
pages are accessible both from within user dashboards (clickable
terms link here) and as SEO landing pages (someone googling "cadmium
pain danger" lands here).

Each page must stand on its own. A reader who arrives cold should
understand the concept fully. A reader who arrives from the
dashboard should find enriched context that goes beyond what their
module showed.

## AUDIENCE AND REGISTER

Written for educated adults (CSP+) who are informed but not
specialists. Assume they read Le Monde, Alternatives Économiques,
AOC. They want depth without jargon.

The page must educate without condescension, be rigorous without
being academic, and be scannable without being superficial.

## LENGTH AND STRUCTURE

- Target : 900 to 1400 words total.
- 6 to 8 sections, each with its own H2 heading.
- Introduction without H2 at the top (3 to 5 sentences).
- Each section : 100 to 250 words.
- End with a "Sources et pour aller plus loin" block.

## MANDATORY SECTIONS (adapt wording to topic)

1. Opening paragraph (no heading) : what this concept is in one
evocative sentence, then what's at stake for a reader today.
2. H2 "De quoi parle-t-on précisément" : the definition, rigorous
but in plain French. Where the scientific consensus stands.
3. H2 "D'où cela vient" : origins, causes, mechanisms. Historical
context when relevant.
4. H2 "Ce que cela change concrètement" : effects on daily life,
health, landscape, economy, whatever applies. With specific
numbers and sources.
5. H2 "Quels territoires sont concernés en France" : geographic
variation. Which regions, communes, populations are more or
less exposed. Cite specific zones.
6. H2 "Ce qui est débattu, ce qui ne l'est pas" : distinguish
scientific consensus from open questions. This section builds
trust by showing we don't oversell certainty.
7. H2 "Ce que vous pouvez faire" : a brief pointer to concrete
actions, with 2 to 3 links to Actionable Knowledge pages.
Do not duplicate their content. Just orient the reader.
8. Sources block.

## DO

- Open with a specific, evocative image or data point, not a
generality.
- Use comparisons when they help (a quantity in Stade de France,
a concentration in cigarettes equivalent, a duration in human
generations).
- Cite institutional sources inline.
- Name scientists or institutions when they matter for the story.
- Distinguish "on sait que" from "on pense que" from "on suppose que".
- Mention specific French places and cases when illustrative.

## DON'T

- Never begin with "Le [concept] est un [généralité]". Too textbook.
- Never list all effects in bullet form. Narrative prose.
- Never moralize about individual behavior.
- Never use phrases like "face à l'urgence", "nous devons tous",
"il est grand temps de".
- Never cite Wikipedia or generalist news sources. Institutional,
peer-reviewed, or specialized press only.
- Never use em dashes. Never use exclamation marks.

## HANDLING SCIENTIFIC UNCERTAINTY

Climate and environmental science contains degrees of certainty.
Reflect them:

- "Les observations montrent que..." for measured facts.
- "Les projections des modèles climatiques indiquent..." for
modeled futures.
- "Les chercheurs discutent encore..." for debated areas.
- "Cette question fait l'objet d'études en cours" when relevant.

Never write as if everything were equally settled.

## HANDLING POLITICS

These pages will treat topics with political implications
(pesticides, housing policy, health alerts). Rules:

- Name decisions and policies by their administrative identity.
- Name institutions involved (ANSES, ADEME, ministères).
- Cite contradictions between stated goals and measured actions
when sources document them.
- Do not name political parties.
- Do not characterize positions as ideological.
- When controversy exists between scientific bodies and economic
actors, say so factually.

## INPUT YOU RECEIVE

{
"topic_id": "cadmium_alimentation",
"topic_title_fr": "Le cadmium dans l'alimentation",
"topic_category": "sante",
"key_data_points": [
{
"fact": "1 Français sur 2 surexposé via alimentation",
"source": "ANSES alerte mars 2026"
},
{
"fact": "36% des moins de 3 ans dépassent les seuils sanitaires",
"source": "ANSES 2026"
},
{
"fact": "Cadmium classé cancérogène, mutagène, toxique
pour la reproduction (CMR)",
"source": "Classification européenne CLP"
},
{
"fact": "Sols calcaires (Champagne, Charente, Jura, Causses)
naturellement plus chargés",
"source": "GisSol, RMQS"
},
{
"fact": "Engrais phosphatés, source industrielle additionnelle",
"source": "INRAE"
}
],
"related_actionable_pages": [
"comment-limiter-exposition-cadmium-alimentaire",
"lire-etiquette-cereales-origine"
],
"related_thematic_pages": [
"metaux-lourds-sols-francais",
"alertes-anses-fonctionnement"
]
}

## OUTPUT

Full French prose with clear H2 headings. Opening paragraph
without heading. End with "Sources et pour aller plus loin"
block listing references.

Format headings as "## [heading text]" so they can be styled
in rendering.

## EXAMPLE OF A GOOD OPENING

Example opening for "Le cadmium dans l'alimentation" :

En mars 2026, l'agence sanitaire française a fait une annonce
rare. Près d'un Français sur deux est surexposé au cadmium par
son alimentation quotidienne. Le pain, les pommes de terre, les
céréales du petit-déjeuner en sont les principales sources. Le
cadmium est un métal lourd classé cancérogène, mutagène et
toxique pour la reproduction. Cette alerte soulève une question
qui dépasse le comportement individuel : pourquoi nos sols, et
donc notre alimentation, contiennent-ils ces doses, et qu'est-ce
qui peut changer ?

## De quoi parle-t-on précisément

Le cadmium est un métal présent naturellement dans la croûte
terrestre. Sa particularité : il se solubilise facilement dans
l'eau et migre du sol vers les plantes, qui l'absorbent par leurs
racines comme s'il s'agissait d'un nutriment. Il se concentre
ensuite dans les grains, les tubercules, les feuilles. Une fois
ingéré, il s'accumule dans le foie et les reins sur plusieurs
décennies, avec une demi-vie biologique estimée à 20 ou 30 ans.

Les seuils sanitaires sont fixés par l'Autorité européenne de
sécurité des aliments (EFSA) à 2,5 microgrammes par kilogramme
de poids corporel par semaine. L'alerte de l'ANSES en 2026 a
montré que la population française moyenne dépasse ce seuil,
avec des taux particulièrement élevés chez les enfants de moins
de trois ans.

[... the page continues with the other mandatory sections ...]