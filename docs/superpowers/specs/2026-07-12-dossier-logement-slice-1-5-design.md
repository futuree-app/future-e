# Dossier de décision — slice 1.5 : faits Logement (augmentation adresse)

**Date** : 2026-07-12 · **Statut** : design validé (brainstorm porteur + revue ChatGPT), prêt pour plan.
**Ascendance** : étend `docs/superpowers/specs/2026-07-11-dossier-decision-materialite-design.md` (slice 1,
Territoire au grain commune). Le slice 1 avait posé la frontière : Logement = extension 1.5 déclenchée
par la présence d'une adresse. Ce document la spécifie.

## 1. Objectif

Quand une **analyse logement est déjà sauvegardée pour la commune active** (artefact `logement-store`,
comme le module Logement la rehydrate), enrichir le dossier « En une minute » avec les faits Logement
au grain adresse (DPE, RGA/bâti, PPRN, cavités, patrimoine, sinistralité), **sans ralentir le hub** et
**sans figer le statut réglementaire** (doctrine Logement : re-fetché à chaque rendu, jamais snapshoté).

## 2. Arbitrage gravé (porteur)

**Dans le slice 1.5, aucune règle Logement n'émet le rôle `incompatibility`.** Les faits Logement
émettent des **réserves** (`verification`), des **inconnues scopées** (`unknown` impact `scoped`), ou
du contexte. Une incompatibilité exige une contrainte non négociable DÉCLARÉE contredite ; le
`UserProject` ne porte aucune contrainte au grain adresse. Laisser un PPRN, un RGA, un DPE ou une
cavité produire un « blocage » par leur seule gravité réintroduirait un jugement absolu, contraire à
`docs/vault/arbitrages/dossier-decision-eliminatoire-contrainte-declaree.md`. Une incompatibilité au
grain adresse ne pourra exister que lorsqu'une future version du projet permettra de déclarer
explicitement une contrainte non négociable correspondante.

Conséquence : le Logement **modifie le niveau de réserve** de la conclusion, jamais l'existence d'un
blocage. « À l'échelle de la commune, aucune incompatibilité établie » peut devenir « À l'échelle de
la commune et de l'adresse, aucune incompatibilité établie ; N points liés au logement doivent
néanmoins être examinés ». Jamais « ce logement est compatible » ni « aucun risque détecté ».

## 3. Architecture : augmentation serveur différée sous `<Suspense>`

Le hub rend le **dossier communal immédiatement** (promesse « En une minute » intacte). Si un artefact
logement existe pour la commune active, une frontière `<Suspense>` rend d'abord le dossier communal
comme **fallback explicitement provisoire**, puis un **Server Component asynchrone** charge le rapport
réglementaire FRAIS, fait tourner LE MÊME moteur, et **remplace toute la section** par le dossier
`commune+adresse`.

```
Hub /rapport (payant, commune connue, projet)
  ├─ dossier commune (synchrone, immédiat)
  └─ si artefact logement pour cette commune :
       <Suspense fallback={ <DossierDecisionSection dossier={communeDossier}
                                                    logementStatus="pending" /> }>
         <DossierAvecLogement address={…} savedDpe={…} communeFacts={…} project={…}>
            try {
              report = await fetchLogementReport(address)   // lib extraite, FRAÎCHE, timeout
              logementFacts = buildLogementFacts(report, savedDpe, project)
              facts = { ...communeFacts, logement: logementFacts }
              dossier = assembleDossier(runRules(facts, project), project, "commune+adresse")
              → <DossierDecisionSection dossier={dossier} logementStatus="done" />
            } catch {
              → <DossierDecisionSection dossier={communeDossier} logementStatus="unavailable" />
            }
         </DossierAvecLogement>
       </Suspense>
```

- **`Suspense` gère `pending`. Le `try/catch` gère `unavailable`.** Ce ne sont pas le même état :
  le fallback est un chargement, le catch est une panne. Une panne conserve `scope: "commune"` +
  une note visible, jamais un silence = pas de risque.
- **Remplacement de toute la section**, jamais l'ajout discret d'une carte sous une conclusion déjà
  lue : un fait adresse change le niveau de réserve de la conclusion principale.
- **Fraîcheur** : les appels réglementaires ne doivent pas réutiliser un cache. La lib extraite force
  l'absence de cache (`no-store`) sur les fetchers externes ; à vérifier au plan.

## 4. La lib serveur extraite

Le cœur de la route `/api/georisques-logement` est DÉJÀ une fonction isolable : `buildReport(address,
banFeatureType)`. On l'extrait dans `src/lib/server/georisques-logement.ts` :

```ts
export type ResolvedAddress = { id: string | null; label: string; city: string | null; citycode: string | null; postcode: string | null; latitude: number; longitude: number };
export async function fetchLogementReport(address: ResolvedAddress, banFeatureType: string | null): Promise<LogementReport>;
```

La **route** l'importe (comportement client inchangé). Le **dossier** l'appelle directement, sans
détour HTTP interne, avec l'adresse de l'artefact sauvegardé. Un wrapper `fetchLogementReportWithTimeout`
(ex. 4 s) protège le hub ; un dépassement lève, capté par le `try/catch` → `unavailable`.

## 5. Contrats (extensions minimales, aucun nouveau moteur)

`ModuleFacts` gagne un bloc optionnel. Aucune règle Territoire ne change.

```ts
type LogementFacts = {
  dpe: "passoire" | "energivore" | "correct" | "absent";     // du DPE SAUVEGARDÉ (fait persisté distinct)
  confortEteInsuffisant: boolean;
  expositionBati: boolean;                                    // RGA/argile exposition notable (moyen/fort)
  zoneReglementee: boolean;                                   // >= 1 zonage PPRN au point
  sinistraliteActive: boolean;                                // péril indemnisé lisible à l'échelle commune
  caviteProche: boolean;                                      // >= 1 cavité recensée à moins de 500 m
  perimetrePatrimonial: boolean;                              // AC1/AC2/AC4 au point (ABF)
  addressLabel: string;                                       // pour la preuve (grain "adresse")
};

type ModuleFacts = { /* …commune… */ logement?: LogementFacts };
```

- **Aucun nouveau rôle `DecisionFact`.** Les règles Logement émettent `verification` (ou `unknown`
  scopée). `EvidenceRef.grain` passe à `"adresse"` pour ces faits.
- **Aucun nouvel état de conclusion.** `no_incompatibility_established` porte déjà le suffixe « N
  points restent à examiner » ; il couvre le cas « avec réserves » sans état supplémentaire.
- **`Dossier.scope` reste `"commune" | "commune+adresse"`** (donnée pure). `pending` / `unavailable`
  sont des **props de rendu** (`logementStatus`), jamais des états de l'assembleur : le moteur pur
  ignore le streaming, il sait seulement s'il reçoit un bloc `logement` exploitable.

## 6. L'adaptateur `buildLogementFacts`

`buildLogementFacts(report: LogementReport, savedDpe: DpeRecord | null, project): LogementFacts`, pur,
généralise la construction des `ChecklistFacts` de `LogementModule.tsx` :

- `dpe` = `energyState(savedDpe?.etiquette_dpe)` (fait persisté, pas re-fetché).
- `expositionBati` = `report.georisques.(parcel??address).rga.label` matche `moyen|fort|élev`.
- `zoneReglementee` = `report.georisques.(parcel??address).regulatoryPlans?.length > 0`.
- `sinistraliteActive` = `report.sinistralite` lisible (kind `lecture`/`faible_repr`).
- `caviteProche` = `report.pointHazards.cavites.count > 0`.
- `perimetrePatrimonial` = `report.heritage.items.length > 0`.
- `confortEteInsuffisant` : depuis l'ICU/thermique du rapport si disponible, sinon `false`.

**Absence honnête** : une source `null` dans le rapport (panne partielle interne à `buildReport`,
qui `.catch(() => null)` par source) → le fait correspondant reste `false` et la règle n'émet RIEN.
On ne produit jamais un fait « aucun risque ». La distinction fine `no_record` (rien trouvé) vs
`temporarily_unavailable` (source en panne → inconnue scopée « n'a pas pu être vérifié ») demande de
typer l'erreur de chaque fetcher : **suite documentée**, hors slice 1.5. L'invariant tenu ici : une
panne ne devient jamais un signal d'absence de risque (par omission).

## 7. Les six familles de règles Logement (amorçage)

Toutes rôle `verification` (ou `unknown` scopée), gate sur `facts.logement`, `not_applicable` si
absent, posture-aware (textes migrés des `RULES` de `logement-checklist.ts`, par bucket
achat/reside/location/neutre). Chaque fait porte le **constat établi** (statement) ET **l'action**
(un fait établi n'est pas présenté comme incertain ; c'est sa conséquence qui reste à faire).

| ruleId | Déclencheur | evidenceStrength | Action |
|--------|-------------|------------------|--------|
| `logement.dpe-faible` | `dpe ∈ {passoire, energivore}` | `established` | estimer travaux/charges selon posture |
| `logement.exposition-bati` | `expositionBati` | `indicative` | observer désordres, demander antécédents |
| `logement.zone-reglementee` | `zoneReglementee` | `established` | consulter le règlement en mairie |
| `logement.cavite` | `caviteProche` | `established` (ou `unknown` scopée si grain insuffisant) | étude de sol / confirmation |
| `logement.patrimoine` | `perimetrePatrimonial` (buckets neutre/achat/reside) | `established` | vérifier la portée si travaux |
| `logement.sinistralite` | `sinistraliteActive` | `indicative` | état des risques, historique du bien |

Discipline : jamais reformulé en prédiction de sinistre ; la sinistralité et le RGA portent une
`limitation` obligatoire (exposition de zone ≠ dommage sur ce bien). Le patrimoine n'est ni un risque
ni un défaut. `materialityTier` : `structuring` pour DPE/PPRN/cavité, `secondary` pour patrimoine.

## 8. Rendu (`logementStatus`)

`DossierDecisionSection` gagne `logementStatus?: "none" | "pending" | "done" | "unavailable"` :

- `none` (pas d'adresse) : dossier communal, CTA « Affiner avec une adresse » (slice 1).
- `pending` : dossier communal + bannière « Première lecture à l'échelle de la commune. L'analyse du
  logement et de son environnement immédiat est en cours. » Aucune conclusion présentée comme finale.
- `done` : dossier `commune+adresse`, CTA « Voir l'analyse du logement » (déjà en place). La conclusion
  s'ouvre sur « À l'échelle de la commune et de l'adresse, … ».
- `unavailable` : dossier communal + note « L'analyse réglementaire de cette adresse n'a pas pu être
  actualisée. La conclusion reste limitée à la commune. » + lien module / nouvelle tentative.

Titre de la section `verifications` neutralisé (couvre Territoire + Logement) : « À examiner avant de
vous engager » (habitant : « À comprendre ou surveiller »). Sous-groupement par module = ultérieur.

## 9. Conclusion à double grain

Quand `scope === "commune+adresse"`, la conclusion préfixe « À l'échelle de la commune et de
l'adresse, ». L'assembleur distingue déjà les réserves ; le nombre « N points » inclut désormais les
faits Logement. Le fallback (`pending`) garde strictement « À l'échelle de la commune » + le marqueur
provisoire.

## 10. Invariants à tester (plan)

1. Aucune règle Logement n'émet `incompatibility`.
2. Bloc `logement` absent → dossier communal STRICTEMENT inchangé (mêmes faits/état qu'au slice 1).
3. Une donnée réglementaire présente → fait avec preuve (`grain: "adresse"`), limite et action.
4. Une source absente ne produit jamais « aucun signal / aucun risque » (omission).
5. Indisponibilité complète (fetch en échec) → `scope: "commune"` + `logementStatus: "unavailable"`.
6. Augmentation réussie → `scope: "commune+adresse"`.
7. Le fallback `pending` est explicitement provisoire (pas de conclusion finale).
8. La section entière est remplacée après résolution (pas d'ajout de carte sous une ancienne conclusion).
9. DPE (persisté) et statut réglementaire (frais) restent distingués dans leurs preuves.
10. Les textes diffèrent achat / location / habitant, même si le rôle interne reste `verification`.

## 11. Fichiers

Neufs :
- `src/lib/server/georisques-logement.ts` (lib extraite `fetchLogementReport` + `fetchLogementReportWithTimeout`).
- `src/lib/decision/logement-facts.ts` (adaptateur pur `buildLogementFacts` ; type-only imports, testable).
- `src/lib/decision/logement-rules.ts` (les 6 règles, ajoutées au `REGISTRY`) + test.
- `src/components/report/DossierAvecLogement.tsx` (Server Component async, try/catch → unavailable).

Touchés :
- `src/app/api/georisques-logement/route.ts` (importe la lib extraite au lieu de son `buildReport` local).
- `src/lib/decision/decision-fact.ts` (`ModuleFacts.logement?`, `LogementFacts`).
- `src/lib/decision/materiality-rules.ts` (`REGISTRY` inclut les règles Logement).
- `src/lib/decision/decision-assembler.ts` (préfixe conclusion `commune+adresse` ; titre section neutralisé).
- `src/components/report/DossierDecisionSection.tsx` (`logementStatus` + bannières).
- `src/app/(account)/rapport/page.tsx` (Suspense + montage de `DossierAvecLogement` quand artefact présent).

## 12. Hors périmètre

- Incompatibilité au grain adresse (attend une contrainte adresse déclarable).
- Distinction fine `no_record` vs `temporarily_unavailable` par source (typage d'erreur des fetchers).
- Sous-groupement visuel des faits par module.
- IA de formulation (slice 2, inchangé : fallback déterministe permanent).
- Faits Face 3 (autour immédiat) dans le dossier : le snapshot est là, mais l'amorçage 1.5 se
  concentre sur les faits décisionnels (risques/bâti/patrimoine/DPE). Face 3 = extension.
