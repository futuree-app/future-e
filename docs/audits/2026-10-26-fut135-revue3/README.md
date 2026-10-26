# FUT-135, troisième revue de Work : bornes du couple compte / accès

- `reproduction-contradiction.mjs` : la reproduction décrite par Work dans FUT-135 (sa branche locale n'est pas publiée), réécrite d'après son commentaire : copies d'Angers, Rennes, Poitiers et Corte avec `etudesSup = {measured: true, radiusKm: 5, establishmentCount: 1, weightedAccess: 2}`.
- `reproduction-avant.json` : sur `2b5fedf2`, état `presence` et identité accordée dans les 4 villes, code 1.
- `reproduction-apres.json` : état `incertain`, identité refusée, score et identité réelle inchangés, code 0.
- Contrôleur de la deuxième revue (`../2026-10-26-fut135-revue2/controle-preuve-positive.mjs`, non modifié) : 0 violation avant comme après.

Rejouer depuis la racine : `node docs/audits/2026-10-26-fut135-revue3/reproduction-contradiction.mjs`. Détail au §9 de `docs/audits/2026-10-25-fut135-part-etudiante.md`.
