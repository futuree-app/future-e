# FUT-12 · Provenance et fraîcheur des preuves

Branche `bonjourfuturee/fut-12-provenance-preuves`, partie de `main` (d38a4e91). Travaux du 04 au 06/11/2026.

**Doctrine : la provenance fait partie de la preuve.** Une donnée chargée en 2026 et mesurée en 2022 ne doit jamais se lire comme une observation de 2026.

---

## A. Diagnostic

### Les contrats qui existaient

| Contrat | Champs | Ce qui manquait |
|---|---|---|
| `FactSource` (Territoire) | `producer`, `dataset`, `field` | Aucun diffuseur, aucune nature. « Géorisques » posé comme *producteur* de GASPAR, « INSEE via ADEME » dans un seul champ. |
| `Fact.vintage` / `Fact.observedAt` | millésime libre, date de lecture | `vintage` mêlait période (« 2015-2021 ») et convention (« DRIAS-TRACC, référence 1976-2005 »). |
| `EvidenceRef` (dossier) | `label`, `grain`, `sourceMode`, `observedAt` | Un seul texte libre pour producteur, diffuseur, édition et période. `observedAt` avait **deux sens** : jour du diagnostic DPE (confort d'été), consultation du registre (permis). |
| Permis | `consulteLe` | Déjà transmis, seule date de consultation réellement affichée (dans la convention). |
| Relevé (`lecture-dossier`) | conserve `observedAt` | Affichait « observée le … » quel que soit le sens de la date. |

### Ce qui se perdait

1. **Le registre Territoire n'était lu par aucune carte.** Producteur, jeu et millésime existaient dans `facts.ts`, mais chaque carte affichait une source écrite à la main (`src`, `sources`).
2. **`fetchedAt` du Logement n'arrivait jamais à l'écran.** Il était calculé dans `logement-decision-data.ts`, puis abandonné. Et il aurait été faux : les résumés Géorisques vivent dans un cache de process sans limite, donc l'instant du rendu n'est pas celui de la lecture.
3. **Une preuve avec valeur ne disait jamais sa source.** `factSources` écartait toute preuve portant une `observedValue` : la pastille « DPE G » ne disait ni la base ni la date du diagnostic.
4. **La date d'approbation des plans de prévention** (lue depuis FUT-127) ne quittait pas le moteur.

### Preuves concernées

Toutes les familles Logement (argiles, plans de prévention, cavités, servitudes, indemnisations ONRN, DPE, confort d'été, diagnostic non attribué), le zonage inondation à l'adresse, les plans communaux GASPAR, les reconnaissances CatNat, le climat projeté DRIAS, la distance au rivage, la BPE, les permis, le secteur IRIS, et les cartes Territoire.

---

## B. Contrat retenu

**Un seul type**, `Provenance` (`src/lib/facts/provenance.ts`, pur, utilisable côté client). Il est porté par `EvidenceRef.provenance` (dossier) et par `Fact.provenance` (Territoire). On n'a pas créé de troisième modèle : `label`, `source`, `vintage` et `observedAt` restent tels quels, et la provenance s'y ajoute.

| Champ | Sens, et un seul |
|---|---|
| `producer` | qui produit la donnée |
| `dataset` | le jeu précis |
| `distributor` | qui la diffuse, ou le service interrogé |
| `sourceUrl` | une référence |
| `version` | l'édition officielle (« Carte d'exposition 2026 », « Plan approuvé le 26 février 2019 ») |
| `period` | ce que la donnée **mesure** (« 2022 », « 2022-2025 », un jour de diagnostic) |
| `publishedAt` | la publication par le producteur |
| `consultedAt` | la lecture effective d'une source vivante (**volatil**) |
| `loadedAt` | l'entrée d'un fichier dans futur•e (**technique**) |
| `nature` | `observation`, `derive`, `estimation`, `projection`, `reglementaire` |
| `status` | `provisoire` se dit ; `definitif` documente |
| `fallback` | la maille réellement utilisée quand elle est plus large |
| `limits` | la limite propre à la source |

### Règles

- **Absent veut dire inconnu.** Aucun champ n'a de défaut, `provenance()` n'écrit jamais de clé vide.
- **Aucune date ne se déduit d'une autre.** La fonction de rendu ne fabrique jamais une période à partir d'une consultation ou d'un chargement (test 3 bis).
- **Le verbe suit la nature.** « Données observées en 2022 », « Estimation sur des données de 2025 », « Calculé sur des données de 2022 à 2025 », « Projection, période de référence 1976-2005 ».
- **Aucun parsing de texte libre.** La livraison DVF est recopiée telle que l'index l'écrit, à sa place (`version`). Elle n'est pas découpée par expression régulière.
- **Un document réglementaire ancien n'est pas une donnée périmée.** « Plan approuvé le 26 février 2019 » date la règle, sans aucun qualificatif.
- **Une source muette n'est pas consultée.** La preuve garde sa provenance sans `consultedAt`. VigiEau en panne affiche « Consultation tentée le … ».

### Les dates de consultation sont prises à la lecture, pas au rendu

- `georisques.ts` horodate chaque résumé (adresse, parcelle) au moment de l'appel réel (API v2, `no-store`). Le cache de process garde cet instant.
- `logement-coverage.ts` retient la date du résumé qui a **fourni** la valeur (la parcelle si elle porte l'argile, sinon le point).
- Les servitudes (`gpu.ts`, `no-store`) sont datées au lancement de la lecture.
- Les cavités ne sont pas datées : leur appel passe par le cache de 24 h de Next, et l'instant de la réponse réelle n'est pas connu.

### Catalogues

- `src/lib/decision/provenances.ts` : une entrée par famille de preuve du moteur.
- `src/lib/territoire/provenances.ts` : les faits Territoire. Ce fichier est séparé du registre, que le garde-fou FUT-147 protège ligne à ligne ; le registre ne reçoit qu'une ligne d'application.

---

## C. Audit RGA 2026

### Conclusion : version 2026 confirmée

C'est la version servie **aujourd'hui** par l'API interrogée. La date de bascule est impossible à établir.

### Source réellement interrogée

- `GET https://www.georisques.gouv.fr/api/v2/rga?latitude=…&longitude=…&pageSize=10&pageNumber=0` (au point).
- `GET …/api/v2/rga?codesParcelle=…` (à la parcelle).
- Bearer token, `cache: "no-store"`, plus le cache de process du résumé.

### Ce que l'API ne dit pas

- Réponse brute : `{"totalElements":1,…,"content":[{"codeExposition":"3","exposition":"Exposition forte"}]}`.
- Schéma OpenAPI officiel (`/api/v3/api-docs`) : `RgaDto = { codeExposition, exposition }`. Aucun champ de version, de millésime ni de date.
- Aucun paramètre de version n'existe sur l'endpoint.

### Comment la version a été établie

1. Téléchargement des deux cartes officielles pour la Charente-Maritime (17) et la Haute-Garonne (31) :
   - `files.georisques.fr/argiles/AleaRG{dep}_L93.zip`, Last-Modified 11/06/2019 ;
   - `files.georisques.fr/argiles/2025/AleaRG_2025_{dep}_L93.zip`, Last-Modified 28/11/2025. C'est la base `alearg_25`, présentée par Géorisques comme « Carte d'exposition (2026) », révisée par l'arrêté du 9 janvier 2026 et applicable au 1er juillet 2026.
2. Tirage de 28 points où les deux cartes donnent des classes différentes (inclusion point-polygone).
3. Interrogation de l'API en chacun de ces points.

| Date | Conformes à la carte 2026 | Conformes à la carte 2019 |
|---|---|---|
| 04/11/2026 | 28 / 28 | 0 |
| 06/11/2026 (rejeu) | 28 / 28 | 0 |

Script de contre-épreuve, en lecture seule : `scripts/audit/fut12-rga-version.mjs`, avec les points dans `scripts/audit/fut12-rga-points.json`.

### Transmission jusqu'au moteur et à l'interface

- `provenanceArgiles(consultedAt)` porte « Carte d'exposition 2026 » **seulement** pour une lecture datée du 04/11/2026 ou après.
- Une lecture non datée, ou antérieure au constat, ne reçoit pas de version.
- La limite voyage avec la preuve : une carte d'exposition décrit une zone ; ce n'est ni une étude du sol de la parcelle, ni une prévision de dommage.

### Anomalie résiduelle (à traiter séparément)

On ignore **quand** Géorisques a basculé de la carte 2019 à la carte 2026. Les dossiers d'adresse figés avant la bascule ont pu recevoir une classe de 2019. Ils n'affichent aucune version, et FUT-12 ne leur en attribue pas.

Pour mesurer l'impact, il faudrait réinterroger l'API aux adresses des dossiers figés et comparer les classes. Cela demande une lecture des adresses en base de production, donc un ticket dédié et ton accord. Aucune migration n'a été faite.

---

## D. Effets produit

### Avant / après

| Preuve | Avant | Après |
|---|---|---|
| Argiles (dossier) | `Source : BRGM, via Géorisques` | `Source : BRGM · Carte d'exposition au retrait-gonflement des argiles, via Géorisques. Carte d'exposition 2026 · Source consultée le 4 novembre 2026` |
| Plan de prévention | `Source : Base GASPAR, via Géorisques` | `… Base GASPAR, plans de prévention des risques, via Géorisques. Plan approuvé le 10 août 2021` (rendu réel, page `/dev/fut127`) |
| Indemnisations | libellé unique « mise à jour 2025 · données 1995-2021 » | `Données observées de 1995 à 2021 · Mise à jour 2025` |
| DPE (pastille) | « DPE G », sans source | pastille, puis `Source : ADEME · Base des diagnostics… · Données du 12 mars 2023` |
| Secteur IRIS | « Ménages et voiture · secteur » | `Insee · Recensement de la population 2022, base IRIS logement · Estimation sur des données de 2022 · Chargées dans futur•e en juillet 2026` |
| Climat DRIAS | aucune source | `Météo-France · DRIAS… · Projection, période de référence 1976-2005` |
| Prix (Territoire) | méthode en texte replié | `Calculé sur des données de 2022 à 2025 · Livraison DGFiP d'octobre 2026, version géolocalisée Etalab du 20/10/2026 · Valeur établie à l'échelle de l'intercommunalité` (en cas de repli) |
| Loyers | « estimée depuis des communes voisines » | `Estimation sur des données de 2025 · Valeur établie à l'échelle de communes voisines…`, jamais « observé » |

### Sur les trois niveaux

- **Territoire.** Les volets des cartes affichent une ligne « source / fraîcheur » visible, sous le récit, au-dessus de « Méthodologie et sources » : population, densité, espaces naturels, boisement, démographie, résidences secondaires, logements inoccupés, climat (5 cartes), sécheresse (VigiEau, ONDE, DRIAS), inondation, submersion, CatNat, érosion, prix. La face des cartes est inchangée.
- **Autour.** Les ventes à proximité indiquent la période des ventes et la livraison dans la marge. La BPE porte son millésime structuré, les permis leur consultation.
- **Logement.** Dans le dossier, « Données et limites » montre la provenance de chaque preuve, avec ou sans valeur. Dans le module, le bloc argiles affiche « Carte d'exposition 2026 · Source consultée le … ». Dans le relevé, la marge met la source sous la valeur, avec sa fraîcheur.

### Données inconnues et dossiers historiques

- Une preuve sans provenance se rend **exactement** comme avant : `Source : libellé`, ou rien si elle porte une valeur. Pour le relevé, voir le test 8.
- L'artefact figé avant FUT-20 se rend toujours mot pour mot comme sur main (test FUT-20).
- Aucune date n'est ajoutée à un dossier figé. Les champs nouveaux sont tous optionnels, et le schéma des artefacts est en `passthrough`.

### Couverture réelle

Toutes les preuves Logement émises portent une provenance (test 9 bis). Les preuves du moteur suivantes **restent sans provenance structurée** :

| Preuve | Raison |
|---|---|
| Positions nationales (`Territoire · {commune}` : alignements, écarts, absences, taille d'agglomération, scores des conditions) | rang composite de l'index ; la source dépend du critère, il faudrait une provenance par critère (chantier propre) |
| Position (lat/lon), département | identité géographique, pas une mesure |
| Air (PM2,5, NO₂), bruit, exposition industrielle, radon | plusieurs sources et millésimes par lecture, non vérifiés dans ce lot (cf. FUT-152, FUT-167) |
| Feu de forêt recensé (GASPAR), couvert forestier | non qualifiés dans ce lot |
| Santé et gares autour (distances) | la valeur n'a pas de provenance propre ; la référence BPE voisine porte le millésime |
| Infrastructures OSM (Autour) | pas de millésime : un extrait vivant |
| CatNat (compte de l'index) | provenance posée, **sans période** : la date de l'export compté n'est pas tracée dans l'objet |
| Cavités | provenance posée, **sans consultation** (cache de 24 h) |
| Taux de boisement ADEME, érosion Cerema | provenance posée, **sans millésime** : non documenté dans nos fichiers |

Le chargement dans futur•e (`loadedAt`) n'est connu que pour l'artefact IRIS (`builtAt`). L'index du comparateur ne porte aucune date de construction : la phrase « chargées en … » n'y est donc jamais écrite.

---

## E. Non-régression

### Tests

- `src/lib/decision/fut12-provenance.test.ts` : 19 tests, qui couvrent les dix cas demandés (réglementaire avec version, période d'observation, chargé récemment mais mesuré avant, repli, estimation, consultation, inconnu, historique, propagation lecture et relevé, empreintes).
- Suite complète : 4 356 tests, 4 355 réussis, 0 échec, 1 ignoré (déjà ignoré sur main).

Trois tests existants ajustés, pour un ajout et rien d'autre :

1. `fut17-relecture-semantique` : la comparaison d'une **génération neuve** à l'artefact figé retire `provenance` avant comparaison. Le reste doit être identique.
2. `fut20-chaleur-logement` : le dossier **régénéré** gagne la ligne de provenance DRIAS ; l'artefact figé reste mot pour mot.
3. `fut147-non-regression` : le garde-fou du registre admet les deux lignes d'application de la provenance.

### Empreintes

- **Territoire.** `Fact.provenance` est hors de `hashableContent`. La synthèse ne lit que les valeurs (`projectForSynthesis`) : le test vérifie, sur le registre réel (Châtelaillon), que l'empreinte et la projection sont identiques avec ou sans provenance. Un changement de `vintage` change toujours l'empreinte.
- **Dossier.** Le plan narratif ne recopie aucune `EvidenceRef` : une nouvelle consultation ne change ni le plan ni la conclusion (test 10 bis), donc pas de régénération des conclusions rédigées.
- **Synthèse Logement.** Son payload (`buildSynthesisPayload`) ne lit pas les preuves : il n'est pas touché.

### Types, lint, build

- `tsc --noEmit` : propre.
- ESLint sur les fichiers modifiés : propre.
- `next build` : réussi.

### Recette

L'extension Chrome n'était pas connectée : la recette s'est faite sur le **HTML rendu** par le serveur de développement, pages `/dev/fut127` et `/dev/fut138`. Ces pages ne font aucune écriture Supabase.

- Dossier rendu : la date d'approbation d'un plan et la période ONRN distincte de sa mise à jour sont présentes.
- Prix : la provenance structurée arrive dans les props du composant client.

L'aspect visuel des volets (ouverture au clic) **n'a pas été vu** : c'est à contrôler en contre-revue.

### Vercel

Aucun déploiement, aucune Preview, aucune variable d'environnement. Aucun appel nouveau en production : l'horodatage est local, et les appels Géorisques restent ceux d'avant.

---

## F. Hors périmètre, à proposer séparément

1. **RGA, dossiers figés avant la bascule** : mesurer combien de dossiers d'adresse portent une classe de la carte 2019 (lecture en production, sur accord).
2. **VigiEau** : `consultedAt` est posé après un `fetch` avec cache Next d'une heure. La date affichée peut donc devancer la lecture réelle d'une heure au plus (et le jour, autour de minuit). Correctif possible : horodater depuis l'en-tête `Date` de la réponse.
3. **Index du comparateur** : écrire la date de construction (`loadedAt`) et l'édition DVF en champs structurés dans `meta` lors du prochain `populate-logement.mjs`, au lieu d'une phrase.
4. **Provenance par critère** des positions nationales (index).
