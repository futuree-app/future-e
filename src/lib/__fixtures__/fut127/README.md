# Relevés Géorisques réels de FUT-127

Réponses brutes relevées le 22/10/2026 sur des adresses publiques, avec les paramètres exacts de
`src/lib/georisques.ts` (v2 `/api/v2/gaspar/pprn` et `/api/v2/rga` au point et à la parcelle, BAN, API
Carto cadastre avec le repli de `src/lib/cadastre.ts`), puis le détail des trois plans
(`/api/v2/gaspar/pprn/{idGaspar}`). Aucun jeton n'y figure.

| Fichier | Adresse | Ce qu'il montre |
|---|---|---|
| `charron-num.json` | Rue du 19 Mars 1962, 17230 Charron | Zone rouge Rs2 « zones submersibles en aléa très fort », point et parcelle concordants |
| `lr-quai-duperre-num.json` | Quai Duperré, 17000 La Rochelle | Zone orange Os1 (régime 03) du PPR littoral, parcelle de repli à 3 m |
| `lr-minimes-num.json` | Rue de la Désirée, 17000 La Rochelle | Bs1 au point, Bs2 à la parcelle de repli (8 m) |
| `lr-rue-palais.json` | 12 rue du Palais, 17000 La Rochelle | Aucune zone au point ; plan sans zone à la parcelle |
| `chatel-num.json` | 10 boulevard de la Mer, 17340 Châtelaillon-Plage | Rouge Rs3 au point, orange Os à la parcelle |
| `pprn-detail-*.json` | Détail des plans de Charron, La Rochelle, Châtelaillon | Aléas (submersion marine, recul du trait de côte) et dates d'approbation |

Audit et méthode : branche `docs/fut-127-audit-risques-naturels`, `docs/audits/2026-10-22-fut127-risques-naturels.md`.
