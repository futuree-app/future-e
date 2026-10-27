# FUT-82 · 6. Architecture de mise en œuvre (vague A uniquement)

> **Rien de ceci n'est codé.** C'est un plan pour décision. Les deux intégrations proposées partagent la
> même forme : un zonage officiel lu au point et à la parcelle, qui produit un fait réglementaire, ses
> limites et une vérification. On les conçoit ensemble pour n'écrire le patron qu'une fois.
>
> - **A1. Bruit aérien réglementaire** : plan d'exposition au bruit (PEB) et plan de gêne sonore (PGS).
> - **A2. Obligation légale de débroussaillement** (OLD).

## 1. Où ça vit

| | A1 PEB/PGS | A2 OLD |
|---|---|---|
| Module | **Logement**, section « Statut réglementaire à cette adresse » (`RegulatorySection.tsx`), parce que le fait **atteint le bien** (constructibilité, document que le vendeur doit fournir). Un renvoi d'une ligne dans le paragraphe bruit d'Autour (« l'adresse est aussi en zone C du PEB »). | **Logement**, même section : obligation attachée au terrain. |
| Grain canonique | Point BAN au numéro **et** parcelle cadastrale | Idem |
| Identifiants | code OACI de l'aérodrome, date de l'arrêté, zone | département, identifiant d'objet, date de l'arrêté préfectoral (`dat_ap_old`) |
| Niveau d'intégration V1 | **2 : information de décision** (fait + interprétation prudente + vérification) | **2**, puis **3** (composition avec le danger d'incendie déjà lu) |
| Moteur de classement (comparateur) | **Non.** Le PEB est rare et d'adresse ; il ne doit pas entrer dans un score de commune | **Non** |

## 2. Contrats de données proposés

Un seul type de lecture, partagé, dans une lib **pure** (`src/lib/zonages-reglementaires.ts`, testée
sous `node --test`), et deux lectures réseau minces.

```ts
/** L'état d'une lecture de zonage. Une panne n'est JAMAIS une absence. */
export type EtatZonage =
  | "en_zone"        // le point ET la parcelle sont dans la zone (ou parcelle couverte au-delà du seuil)
  | "en_limite"      // le point et la parcelle divergent, ou la parcelle n'est couverte qu'en deçà du seuil
  | "hors_zone"      // ni le point ni la parcelle
  | "non_couvert"    // territoire hors du périmètre de la source (département sans zonage publié, etc.)
  | "indisponible";  // source muette, délai dépassé, exception servie en HTTP 200

/** Aligné sur FUT-12 (provenance structurée) : la date de lecture n'est jamais une date de donnée. */
export type ProvenanceZonage = {
  producteur: "DGAC" | "Ministère de l'Agriculture";
  diffuseur: "IGN Géoplateforme";
  jeu: string;                    // ex. "DGAC_Plan_d_Exposition_au_Bruit_PEB", "DEBROUSSAILLEMENT"
  couche: string;                 // ex. "dgac_peb_plan_wmsv"
  statut: "reglementation";       // ni observation, ni modélisation
  dateReference: string | null;   // date de l'arrêté (PEB) ou de l'arrêté préfectoral (OLD)
  millesimeSource?: string | null;// OLD : millésime des données sources
  consulteLe: string;             // ISO, date de lecture par futur•e
  methode: "point+parcelle" | "point";
  geocodage: "numero" | "rue" | "lieu-dit" | "commune"; // portée de la lecture
  licence: string;
};

export type LecturePeb = {
  etat: EtatZonage;
  zone?: "A" | "B" | "C" | "D";        // zone la plus exposée si plusieurs (règle de l'état des nuisances)
  zonesTouchees?: ("A" | "B" | "C" | "D")[];
  aerodrome?: { nom: string; oaci: string };
  pgs?: { zone: "1" | "2" | "3"; aerodrome: string } | null;
  provenance: ProvenanceZonage;
};

export type LectureOld = {
  etat: EtatZonage;
  departement?: string;
  provenance: ProvenanceZonage;
};
```

Champs ajoutés à `LogementReport` (`logement-report-types.ts`) : `bruitAerien?: LecturePeb` et
`debroussaillement?: LectureOld`, **optionnels** : un rapport antérieur ne les a pas et ne doit pas se
les inventer.

## 3. Chargement

- **Synchrone**, dans le `Promise.all` de `src/app/api/georisques-logement/route.ts`, branché sur la
  promesse de parcelle déjà existante (`parcelP`) pour l'étape « parcelle ».
- Mesuré : PEB 43-90 ms médiane, PGS ≈ 45 ms, OLD 42 ms ; **délai borné à 4 s** par appel, au-delà
  `indisponible`.
- 3 à 5 requêtes par dossier : PEB au point, PGS au point, OLD au point, OLD à la parcelle (et PEB à la
  parcelle si l'on veut l'état « en limite » strict ; sinon voisinage de la parcelle par GetFeatureInfo
  sur son emprise).
- **Cache** par coordonnées arrondies (5 décimales) : 30 jours (zonages lents à bouger), comme les autres
  sources Géoplateforme (`next: { revalidate }`).

## 4. Règles de lecture (ce que la lib pure décide)

1. **Portée.** Une lecture « à l'adresse » exige un géocodage au numéro. Sinon la phrase dit « à
   proximité » (mesuré : 38 points sur 45 de l'audit n'étaient pas au numéro, et toutes les sources
   rendaient une classe sans le signaler).
2. **Parcelle.** Si la parcelle croise une zone que le point ne touche pas (ou l'inverse) : `en_limite`.
   **Réutiliser** le calcul de part couverte de FUT-81 (`geometrie-parcelle.ts`, seuils nommés 2 % ou
   25 m²) au lieu d'en écrire un second.
3. **PEB.** Plusieurs zones touchées : la plus exposée est retenue (A > B > C > D), et les autres sont
   dites. Mesuré : Villeneuve-le-Roi passe de B à A à 50 m.
4. **OLD.** Seules les zones diffusées (`zonage = 2`). Département absent de la base : `non_couvert`
   (« aucun zonage publié pour ce département »), jamais « pas d'obligation ».
5. **Panne.** Statut ≠ 200, délai, **corps d'exception en HTTP 200**, JSON illisible : `indisponible`.
6. **Projection.** La couche OLD est en EPSG:2154 : la conversion est testée contre un point connu
   (La Teste-de-Buch → en zone) ; un filtre dans la mauvaise projection rend « zéro » en silence.

## 5. Versioning des dossiers historiques

- Ajouter `bruit_aerien` et `debroussaillement` à `sourcesAbsentes()` **uniquement sur
  `indisponible`** (même règle que FUT-80 et FUT-81) : une actualisation pendant une panne est refusée
  et la version N reste.
- Un dossier antérieur (champ absent) n'affiche **rien** de ces deux sujets, pas « hors zone ».
- L'empreinte de la synthèse ne change pas en V1 (les faits ne sont pas transmis à la synthèse) : aucune
  régénération, aucun appel Anthropic.

## 6. Effets sur le moteur, AskFuture et les synthèses

| | V1 (niveau 2) | Plus tard (niveau 3) |
|---|---|---|
| Moteur de décision | Un **point à vérifier** par lecture `en_zone` / `en_limite` (`logement-verifications.ts`), sans `satisfied` (leçon radon : un « tout va bien » sans fait ment) | OLD × danger d'incendie : la composition existante (`fact-compositions.ts`, « exposition au danger d'incendie ») reçoit l'obligation à l'adresse comme preuve de son geste. PEB × Projet « agrandir / diviser » : condition non tranchable sans certificat d'urbanisme |
| AskFuture | Rien | Le fait, avec sa provenance, dans le contexte de l'adresse |
| Synthèse | Rien (empreinte inchangée) | Ajout explicite au contrat de faits, avec bump d'empreinte et règle de non-régénération |

Règle d'AGENTS.md à appliquer au moment de la composition : quand l'obligation OLD deviendra une preuve
de la composition feu, **chercher tous les points de citation** (texte du geste, limitation, convention
affichée) : « la carte apparaît » et « la carte dit vrai » sont deux tests distincts.

## 7. Tests nécessaires

1. **Lib pure** (fixtures enregistrées pendant cet audit, réponses brutes réduites) :
   Villeneuve-le-Roi (PEB B, PGS 2), Goussainville (PEB C, PGS 3), Bouguenais (PEB D), La Rochelle
   centre (hors zone), La Teste-de-Buch (OLD en zone, arrêté 17/10/2025), Gonfaron bourg (OLD hors zone
   malgré 6 832 ha brûlés dans la commune), un point d'outre-mer, un corps d'exception servi en 200,
   une réponse vide, un délai.
2. **Texte rendu** : pour chaque état, la phrase dit la zone, la date, la portée (« à l'adresse » ou
   « à proximité ») et ne contient jamais « bruyant », « exposé au bruit », « risque d'incendie à
   l'adresse ».
3. **Sentinelles réseau** (script manuel mensuel, hors CI) : quatre points connus doivent rester « en
   zone » ; une dérive (projection, nom de couche, schéma) se voit avant le lecteur.
4. **Versioning** : rapport antérieur sans champ → rien d'affiché ; panne → actualisation refusée.

## 8. Coûts

| | A1 | A2 |
|---|---|---|
| Développement | ≈ 1,5 à 2 jours (lib pure, deux lectures, contrat, section, tests) | ≈ 1,5 jour (même patron) |
| Calcul par dossier | 2-3 requêtes, < 150 ms en parallèle | 2 requêtes, < 100 ms |
| Stockage | quelques centaines d'octets par version | idem |
| Maintenance | nulle hors changement de couche (sentinelle) | idem |

## 9. Dépendances à résoudre

1. **FUT-81 (PR #95)** : fusion préalable ; la section « Statut réglementaire » et le calcul de part de
   parcelle y vivent. Développer A1/A2 avant reviendrait à écrire en conflit.
2. **Licence PEB/PGS** : confirmation écrite de la DGAC (la couche est diffusée sans restriction ; les
   jeux PEB des DDT sont en Licence Ouverte 2.0).
3. **Décret OLD** : numéro et date du décret d'application de la loi n° 2023-580 à citer exactement
   (vérification Légifrance).
4. **FUT-118** : la forme définitive des fiches (ci-dessous) relève du Relevé.

## 10. Critères de revue indépendante

- Une panne, une couverture absente et une absence réelle produisent trois textes différents.
- Aucun texte ne transforme une zone réglementaire en niveau de bruit ou en risque d'incendie.
- La portée « à l'adresse » n'apparaît qu'avec un géocodage au numéro.
- Les tests vérifient le texte rendu, pas seulement la présence d'un bloc.
- Un rapport antérieur reste identique à l'octet.
- Aucune source nouvelle n'entre dans un score du comparateur.

## 11. Restitution conceptuelle pour Le Relevé (à transmettre à FUT-118)

### A1. Zone de bruit aérien

- **À retenir** : « Zone B du plan d'exposition au bruit de l'aéroport d'Orly (arrêté du 21 décembre 2012). »
- **Pour votre projet** : « Ajouter un logement ou agrandir pour loger plus de monde y est en principe
  interdit ; isoler ou rénover reste possible. » (variante calme : « Le plan prévoit un bruit fort ; il
  ne dit pas ce que vous entendrez dans ce logement. »)
- **À vérifier** : « Le document d'information sur la zone de bruit, que le vendeur doit vous remettre ;
  l'isolation des fenêtres ; une visite aux heures de passage. Le logement est aussi en zone 2 du plan de
  gêne sonore : une aide à l'insonorisation peut exister. »
- **Comprendre la donnée** : plan réglementaire de la DGAC, fondé sur des prévisions de trafic ; zones A
  à D ; lu au point et à la parcelle ; ne mesure pas le bruit.

### A2. Obligation de débroussaillement

- **À retenir** : « Terrain situé dans une zone soumise à l'obligation légale de débroussaillement
  (zonage publié, arrêté préfectoral du 17 octobre 2025). »
- **Pour votre projet** : « Un entretien régulier autour des constructions, souvent sur 50 mètres, parfois
  au-delà de votre clôture. »
- **À vérifier** : « La profondeur fixée par l'arrêté, le coût d'entretien, la situation des voisins ;
  le vendeur doit vous en informer. »
- **Comprendre la donnée** : zonage informatif publié par l'IGN pour le ministère de l'Agriculture
  (45 départements) ; seuls l'arrêté et le code forestier font foi.
