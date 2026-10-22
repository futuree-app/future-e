# FUT-127 · Correctifs P0 : l'inondation lue à l'adresse, sans fausse absence ni fausse réassurance

Branche `bonjourfuturee/fut-127-rendre-les-controles-georisques-complementaires-a-lanalyse`, depuis `main` 3af53c3c.
Audit d'origine : branche `docs/fut-127-audit-risques-naturels`, `docs/audits/2026-10-22-fut127-risques-naturels.md`.
Arbitrages du porteur du 22/10/2026 appliqués tels quels (option A, paliers, correction des pages existantes).

## Ce qui change pour le lecteur

| Situation | Avant (`engine-6`) | Après (`engine-7`) |
|---|---|---|
| Charron, Dossier Adresse, acheteur, zone rouge Rs2 « zones submersibles » | « Bonne correspondance » ; module : « Aucun plan de prévention des inondations ne réglemente ce point » | « Correspondance à nuancer · Le principal point à contrôler à Charron : le zonage inondation de l'adresse » ; carte « Zone d'interdiction » qui nomme la zone, le plan, sa date d'approbation, le phénomène, le régime, et un geste ciblé : « Demandez l'état des risques et vérifiez qu'il indique la zone Rs2 » |
| Charron, inondation confirmée comme condition | « Ouverte · plutôt favorable » | « plutôt défavorable » à l'adresse ; « ouverte », sans sens, au grain communal |
| La Rochelle, dossier communal | « L'exposition de la commune à l'inondation ressort élevée. Consultez l'état des risques (Géorisques) » | « À La Rochelle, un plan de prévention des risques littoraux, « PPR La Rochelle », approuvé le 26 février 2019, réglemente la submersion marine », l'historique CatNat en contexte, ce que ces faits ne disent pas, et le geste qui lève l'inconnue |
| La Rochelle, Quai Duperré (zone Os1 d'un plan qui réglemente aussi le recul du trait de côte) | Renvoi Géorisques en premier contrôle ; module : « aucun plan des inondations » | Zone dite, phénomène « à confirmer » (la donnée ne dit pas lequel fonde Os1), aucune conclusion favorable, geste ciblé vers l'état des risques |
| Point et parcelle en désaccord (Châtelaillon Rs3 / Os ; Minimes Bs1 / Bs2 sur parcelle de repli) | La parcelle seule, sans le dire | « futur•e ne tranche pas entre les deux lectures », état prudent, non orientant |
| Hors zone (rue du Palais) | Rien, ou le renvoi communal | « n'est dans aucune zone d'un plan de prévention des inondations », avec « Être hors zone ne met pas à l'abri » ; examiné **neutre**, jamais favorable |
| Géorisques muet | Renvoi communal | « Le zonage de cette adresse n'a pas pu être lu », faits communaux, et ici seulement le renvoi vers l'état des risques et « Mes risques » |
| Analyse figée avant la correction | Inchangée, sans contexte | Inchangée, précédée d'un avertissement visible (« version antérieure de la lecture des inondations ») dans les deux présentations |

## Les quatre correctifs

- **P0-A, classification des plans.** `pprn-zonage.ts` : aléas et date d'approbation lus dans le détail du plan (`/api/v2/gaspar/pprn/{idGaspar}`, appel mis en cache, panne = `null`), `natureInondation` (inondation / autre / **inconnue**), `zoneLieeALInondation`. `inondation-lecture.ts` : état `zonage_alea_inconnu`, plus jamais « aucun plan des inondations » sans aléas connus. Bloc réglementaire : risque concerné, approbation, vrai grain (point ou parcelle).
- **P0-B, la règle lit l'adresse.** `zonage-inondation.ts` (pur) confronte point et parcelle (rattachement par repli cadastral exposé par `cadastre.ts`) ; deux règles dans `materiality-rules.ts` : `territoire.inondation-exposition` (orientante : zone liée explicitement à l'inondation, rattachement fiable ; `decision_critical` pour les régimes d'interdiction, `structuring` pour les prescriptions) et `territoire.inondation-lecture` (non orientante : zone à confirmer, aléa inconnu, hors zone, commune). Aucune ne rend `satisfied`. La carte « plan applicable » se tait quand la carte inondation porte le même plan, et nomme sinon zone et régime.
- **P0-C, plus de rang CatNat.** Carte communale déclenchée par un plan de prévention des inondations approuvé, appliqué par anticipation ou prescrit (`data/gaspar-pprn-inondation.json`, extrait de l'export GASPAR du 05/10/2026 par `scripts/gaspar/extraire-pprn-inondation.mts` : 12 042 communes, 13 748 plans) ; états administratifs distingués ; CatNat cité comme historique. Source « submersion marine exclue » retirée (fausse).
- **P0-D, la portée.** « Cette lecture prépare celle de l'état des risques sans la remplacer : c'est ce document, remis par le vendeur ou le bailleur, qui fait foi pour le bien. » Une seule source (`PORTEE_ETAT_DES_RISQUES`), sur les cartes d'adresse et dans le bloc réglementaire du module.
- **Versionnement.** `ENGINE_VERSION` = `engine-7`. Aucun artefact réécrit ; contextualisation reconnue au contenu (`inondation-anterieure.ts`, composant `AvertissementInondationAnterieure`).

## Preuves

- `npm test` : 2 980 tests, 0 échec (2 956 sur `main` avant). `npx tsc --noEmit` et `eslint` sur les fichiers touchés : propres.
- `src/lib/fut127-inondation-adresse.test.ts` (22 tests) : la vraie chaîne sur l'index réel, la table GASPAR et les relevés Géorisques réels figés dans `src/lib/__fixtures__/fut127/` ; Charron, La Rochelle (commune, Os1, Minimes, rue du Palais), Châtelaillon, Géorisques muet, aléas non lus, chaque modèle de plan, quatre postures, poids 1, priorité non déclarée, liste « à vérifier » du module, parité classique / Relevé, bloc réglementaire rendu, analyses figées relues à l'identique et contextualisées.
- Captures : `captures/`, rendues par `/dev/fut127` (relevés réels, composants de production, aucune donnée client, `DOSSIER_NARRATIVE=false`, aucune clé) et `/dev/dossier` sur `main` et sur la branche pour l'avant / après communal (`commune-17091-*`, `commune-17300-*`). Script : `scripts/fut127/capturer.mjs`. Aucun débordement horizontal à 1440 et 390 px.
- La capture `ancien-*` simule un artefact `engine-6` en remplaçant la seule phrase de la carte ; le reste de la carte est celui du moteur courant.

## Ce qui n'est pas fait (hors P0, conformément à l'arbitrage)

- Le **comparateur** garde son score `faible_risque_inondation = 100 - rang` et la phrase « Peu d'inondations recensées à ce jour » sous le rang 66 (`comparateur-vie.ts:2256`). C'est un classement : non modifié ici, à arbitrer.
- La carte Territoire « Inondation fluviale » et la synthèse déterministe (« périmètres… recensés ») : P1-3 de l'audit.
- Payload de la synthèse Logement (champs morts), commune multiple en `latlon`, PPRT au point, statuts du rapport « Mes risques » : P1 et P2, non lancés.
- Aucun appel Anthropic, aucune donnée utilisateur, aucune fusion, aucun déploiement.

## À surveiller en recette

- Le détail des plans ajoute un appel Géorisques par plan distinct (mis en cache par process) à la construction d'un rapport Logement et d'un Dossier Adresse.
- `data/gaspar-pprn-inondation.json` (2,7 Mo) est ajouté à la trace des routes `/rapport`, `/rapport/quartier`, `/api/dossier/actualiser`, `/api/stripe/webhook`. Fichier absent = règle `uncertain`, jamais « aucun plan ».
