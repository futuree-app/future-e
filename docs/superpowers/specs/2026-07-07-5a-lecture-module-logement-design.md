# Spec 5a — La lecture du module Logement

**Date** : 2026-07-07 · **Statut** : design validé (porteur), prêt pour plan d'implémentation
**Chantier** : étape 5a du plan board Logement (2026-07-07). Fait suite à 4 (extraction des faces) et 4.5 (gate commune).
**Intervenants** : porteur, Design Critic + Editorial Writer (rapports sur disque : `docs/rapports-agents/{design-critic,editorial-writer}/2026-07-07-5a-lecture-module-logement.md`).

## Objectif

Faire **comprendre** un logement avant de le **documenter**. Le module est aujourd'hui empilé dans l'ordre de dev (la chaleur avant la synthèse, la sonde en tête, « à vérifier » avant « autour ») : le lecteur reçoit un dossier d'inspection, pas une histoire. 5a lui donne une colonne vertébrale de lecture, sans reconstruire la logique des faces.

Question directrice : **si un utilisateur ne lit que 30 secondes, dans quel ordre construit-il sa compréhension ?**

## Doctrine gravée (à porter dans le vault)

1. **La synthèse décrit le LOGEMENT. Les blocs déterministes décrivent ce que la PERSONNE doit regarder.**
   La synthèse est une propriété du bien (neutre, stable, auditable) ; « À vérifier » est une propriété de la *relation* (personne × projet × territoire × logement). La personnalisation par projet vit UNIQUEMENT dans la checklist, jamais dans la prose IA. « Synthèse adressée au projet » n'est même plus considéré comme une évolution évidente : laissé de côté jusqu'à preuve d'un besoin.
2. **Ne jamais énumérer le contenu d'un module dans un hero / une intro** (proposé par l'Editorial).
3. **L'échelle voyage avec le chiffre, pas seulement dans le chapeau** (proposé par l'Editorial).

## Colonne vertébrale (5 beats) — VALIDÉE

```
1. Identité              « Quel logement ? »          PropertyPassport (compacté, tilt conservé)
2. Synthèse              « Qu'est-ce que je retiens ? » LogementSynthesis (POSTURE-NEUTRE)
3. Preuves               « Pourquoi ? »
   A. Le logement lui-même                 EnergieSection, ThermalComfortSection
   B. Ce à quoi cette adresse est exposée   Risques du bâti (dé-dramatisé), RegulatoryStatusBlock, SinistraliteBlock (contexte communal)
4. Autour                « Qu'y a-t-il autour ? »      Face3Block (sobre, cartographique)
5. À vérifier avant de décider  « Et moi, je fais quoi ? »  ProjectProbe → Checklist déterministe
```

Décrochages actuels corrigés : `ThermalComfortSection` (rendue avant la synthèse) revient coller `EnergieSection` ; la synthèse remonte en position 2 ; la sonde descend en fin ; `Face2Implication`+`Face3Block` sont inversés (Autour en 4, checklist en 5).

## Détail par beat

### Beat 1 — Identité (Passeport compacté)

- **Garder le tilt 3D** (`PassportTiltScene`) : c'est l'objet-identité (matérialisation du grain adresse) et l'harmonisation avec Territoire est gravée. Vigilance : garder ≥2 couches de profondeur lisibles (nom, sceau, champs).
- **Compacter le contenu** (`PropertyPassport.tsx`) :
  - Champs conservés : Surface, Construction, Type de bâti, Parcelle (si dispo).
  - **Couper** : `Altitude … m NGF` (donnée vraie mais inerte) et `Commune · INSEE …` (plomberie analytique, déjà dans le label d'adresse).
  - **DPE** : garder le sceau + la phrase « Classé {lettre} au diagnostic énergétique. » (lecture en clair, identitaire, ne verdict pas). **Couper la caption mono « DPE {lettre} »** sous le sceau (pure répétition). Résultat : DPE 2× dont la version qui a du sens.
- **Modifier l'adresse** : l'affordance reste (aujourd'hui portée par `AddressAutocomplete` en état sélectionné + le bloc d'upsell). 5a ne change pas ce mécanisme.

### Beat 2 — Synthèse

- `LogementSynthesis` inchangé fonctionnellement, remonté en position 2.
- Eyebrow conservé : **« Lecture de ce logement »** (localise sans résumer). Pas de chapeau « Ce qu'il faut retenir » (interdit par la doctrine module : redondant avec la synthèse).
- Reste posture-neutre (le hash gate sur les faits, pas la posture : propriété déjà en place depuis l'étape 3).
- Auto-stream vs bouton : mécanisme du flag `AUTO_SYNTHESIS` inchangé (ON à cible / OFF en dev). 5a garantit que le beat 2 tient visuellement dans les deux modes.

### Beat 3 — Preuves, en 2 sous-familles

- **Séparateurs de sous-famille** (texte NEUF) :
  - A. **« Le logement lui-même »**
  - B. **« Ce à quoi cette adresse est exposée »**
- **Forme du séparateur (arbitrage Design Critic)** : un rang AU-DESSUS des eyebrows de bloc et plus discret — filet fin + label quiet `--fg-4`, **sans puce**. Ne JAMAIS réutiliser la puce de `ReportSection`, ne jamais colorer les groupes. But : chunker (2 blocs / 3 blocs), pas re-segmenter.
- **Famille A** : `EnergieSection` puis `ThermalComfortSection` (la photographie réglementaire du bien, puis ce qu'elle dit du comportement en période chaude).
- **Famille B** : Risques du bâti → `RegulatoryStatusBlock` → `SinistraliteBlock`. Ordre = du point (adresse) vers le plus large (commune).
- **Dé-dramatiser « Risques du bâti »** (bloc inline dans `LogementModule.tsx`) — 4 gestes minimaux (pas de reconstruction complète, réservée à un chantier ultérieur) :
  1. Tuer le rouge (`tone="red"` + chips `rgba(168,74,58,…)` → registre sobre). Le rouge alarmiste viole « l'émotion vient du récit, jamais des couleurs ».
  2. Supprimer les chips « Risques référencés » : labels inertes et redondants (PPRN déjà dans le bloc réglementaire ; RGA/sismicité déjà en `Block` juste dessous).
  3. Ajouter une phrase de tête en langage courant.
  4. Gloser « retrait-gonflement des argiles » comme ailleurs.
- **Sinistralité en contexte** (`SinistraliteSection.tsx`), cadrage renforcé pour éviter la collision d'échelle (bloc au grain COMMUNE dans une famille « à cette adresse ») :
  1. Durcir la N1 : « À l'échelle de la commune, voici ce que les assureurs ont indemnisé par le passé. Ces montants ne disent rien de ce logement en particulier, ni du prix de son assurance. »
  2. Faire voyager l'échelle avec le chiffre : caption « coût moyen d'un sinistre indemnisé » → « coût moyen d'un sinistre indemnisé **dans la commune** ».

### Beat 4 — Autour

- `Face3Block` inchangé, gardé sobre/cartographique, jamais mêlé aux risques. Sert de respiration (palate cleanser) entre les preuves et la clôture.

### Beat 5 — À vérifier avant de décider

Fusionne l'actuelle sonde (aujourd'hui en tête) et l'actuel `Face2Implication` (au milieu). **`Face2Implication` supprimé** (il ne lisait que réglementaire+sinistralité : reconduirait le biais). Son eyebrow « Ce que cela mérite de vérifier » disparaît (doublon du titre de beat).

- **Titre** : « À vérifier avant de décider ».
- **Sonde projet** relibellée : « Quel est votre projet **sur** ce logement ? » → **« Que comptez-vous faire de ce logement ? »**. Boutons inchangés (J'y vis / J'envisage d'acheter / Je loue ou vais louer / Autre). Pas d'amorce « pour ajuster ces points » (mécanisme produit).
- **La checklist est TOUJOURS visible**, jamais gatée derrière la sonde (sinon beat mort). Elle démarre en **version NEUTRE** (pas « résidence » : présumer la relation créerait un décrochage pour un acheteur), puis devient projet-spécifique après réponse.

#### Modèle de la checklist (lib pure `src/lib/logement-checklist.ts`)

- **Clé = le projet** (pas la posture binaire) : `null | "reside" | "achat" | "location" | "autre"`. `null` et `"autre"` → **neutre**.
- **Règles par face × projet, agrégées** : chaque face présente contribue 0-1 point selon l'état de SA donnée. Extensible : ajouter un axe de personnalisation (enfants, métier, télétravail…) = ajouter des règles, jamais toucher au prompt.
- **Déclencheurs (5a)** :
  - Énergie : DPE passoire (F/G) / énergivore, ou DPE non trouvé.
  - Chaleur : indicateur de confort d'été « insuffisant » (attribué).
  - Risques du bâti : exposition RGA/argile ou sismicité relevée.
  - Réglementaire : au moins un zonage PPRN au point.
  - Sinistralité : péril actif (lecture/faible_repr) à l'échelle commune.
- **Ordre** = ordre des preuves (énergie → chaleur → bâti → réglementaire → sinistralité). Un item par face au plus (≤ 5 items ; pas de compteur affiché).
- **Doctrine de rendu (Design Critic)** : `GlassCard`, chaque item = un geste (pas un champ). **Jamais de coche verte / croix rouge**, **zéro compteur** (score de complétude implicite interdit, ADR-0001). Cadrage « les points que cette lecture fait remonter », jamais « tout ce qu'il faut vérifier ».
- **Doctrine de copie (Editorial)** : verbes de vérification, jamais les euros, jamais « vous devriez », jamais un futur prédit, toujours l'échelle.

**Copie de référence (seed ; passe Editorial fine à l'implémentation) :**

- **Gating de l'état neutre** : les items neutres restent **fact-gated** (mêmes déclencheurs que les buckets de projet : un point n'apparaît que si le fait sous-jacent est présent). Seule la formulation diffère (verbes neutres). Le « si une exposition est relevée » de la copie seed ci-dessous est donc à resserrer à l'implémentation, puisque le gating porte déjà la condition. L'état neutre n'est jamais une liste générique déconnectée des preuves.
- **Intro neutre** : « Ces points viennent de la lecture du logement. Votre projet permettra de les rendre plus précis. »
- **Items neutres** (avant réponse) :
  - Vérifier le diagnostic énergétique complet et sa date.
  - Regarder les signes visibles sur le bâti si une exposition est relevée.
  - Lire le règlement local si une zone réglementaire est identifiée.
  - Garder en tête que les sinistres indemnisés sont lus à l'échelle de la commune, pas du logement.
- **Verbes par projet** (le fond de chaque point est le même ; le verbe et le cadre changent) :
  - **Achat** : demander · consulter · faire chiffrer · vérifier avant signature.
  - **Réside** : surveiller · conserver · documenter · suivre dans le temps.
  - **Loue** : demander · observer · vérifier avant signature · signaler si besoin.
- Exemples rédigés (achat / réside), repris des rapports :
  - *Zone réglementée* — Achat : « Consultez le règlement de la zone en mairie avant tout projet de travaux ou d'extension : lui seul dit ce qui est autorisé à cette adresse. » / Réside : « Vérifiez le règlement de la zone avant d'engager une extension ou une rénovation lourde. »
  - *Sinistralité active* — Achat : « Demandez au vendeur l'état des risques et l'historique des sinistres du bien : la commune en a connu, sans que cela concerne forcément ce logement. » / Réside : « Conservez les déclarations de sinistres et d'indemnisation : elles documentent l'exposition réelle du bien, au-delà de la statistique communale. »

## Nettoyages éditoriaux (dans le périmètre de « la lecture »)

- **Hero sub** (`LogementModule.tsx`, section hero) — réécrire : il énumère le contenu du module ET reparle de « ce que les sinistres ont déjà coûté à assurer » (contredit le désamorçage sinistralité). Cible : « Une adresse suffit. Vous lisez ce qui pèse vraiment sur ce logement : sa performance énergétique, ce à quoi son adresse est exposée, et ce qui l'entoure. »
- **Intro de la 2ᵉ section** (« Analyser un logement précis. » + paragraphe) — supprimer le paragraphe d'énumération (doublon du hero à ~20 lignes d'écart).
- **Note inter-commune** — retoucher : fin du langage archi (« les modules Territoire et Santé restent calés… »). Cible : « Cette analyse porte sur ce bien à {city}. Votre commune principale reste {defaultCommune}. »
- **`RegulatorySection.tsx`** : couper « Ces zonages peuvent concerner… Leur ordre sert la lecture. » (décrit l'UI).
- **`RegulatorySection.tsx` — tiret cadratin** : `zoneLabel` renvoie « Zone B2 — faiblement… » (le « — » est rendu à l'écran, interdit). Remplacer par deux points ou virgule : « Zone B2 : faiblement… ».

## Architecture

- **`src/lib/logement-checklist.ts`** : lib PURE (aucun accès réseau/DB), testée TDD (`node --test`). Entrée = un sous-ensemble de faits déjà montrés (DPE attribué, thermalEvidence, `georisques` risques/rga/seismic, `regulatoryPlans`, `sinistralite`) + `projet`. Sortie = liste ordonnée d'items `{ id, text }`. Aucune posture binaire : le projet pilote directement.
- **Rendu** : un composant `src/components/report/logement/DecisionChecklist.tsx` (beat 5), reçoit les faits + `projet` + le handler de la sonde. `ProjectProbe` reste un composant distinct, monté juste au-dessus.
- **`LogementModule.tsx`** : seul le JSX de composition bouge (ré-ordonnancement des `<...Section>`), plus le passage de `projet` à la checklist. La machine d'état DPE, les fetches, le gating synthèse ne changent pas.
- Le `projet` (état existant `projet: string | null`) alimente la checklist. La persistance de posture pour le snapshot « autour » (binaire, via `POSTURE_FOR_PROJET`) reste inchangée et indépendante.

## Hors périmètre (explicite)

- **Rehydratation / artefact chargé au retour** = étape 5b (« Le cycle de vie d'un logement »), chantier d'architecture séparé, avec la persistance des faits serveur (geste 1 différé). La page démarre toujours `result = null` en 5a.
- **Fusion des 3 blocs d'exposition** en une seule section ordonnée par grain (tension Product relayée par les deux agents) : chantier ultérieur, 5a ne reconstruit pas la logique de Face 2.
- **Synthèse adressée au projet** : parquée/abandonnée (cf. doctrine gravée).
- **Reconstruction complète de « Risques du bâti »** (au-delà des 4 gestes de dé-dramatisation).

## Tests & vérification

- `logement-checklist.ts` : tests unitaires `node --test` couvrant (a) chaque déclencheur de face isolé, (b) l'état vide (aucun fait saillant → liste neutre minimale ou vide gérée), (c) les 4 buckets de projet (neutre/achat/réside/loue) sur un même jeu de faits, (d) `"autre"` → neutre.
- `tsc` + `eslint` (fichiers touchés) + `npm run build`.
- **Contrôle visuel session payante** (obligatoire avant merge) : l'ordre des 5 beats, le passeport compacté (tilt conservé), les 2 sous-familles discrètes, « Risques du bâti » dé-dramatisé, la checklist neutre → adaptée à la réponse, les micro-textes nettoyés.

## Risques / points de vigilance

- **Rythme** (Design Critic) : 5 blocs de preuve au gabarit identique après le pic de la synthèse → risque de monotonie au milieu. Amortisseurs : les 2 sous-familles (chunk 2+3), Autour en respiration avant la clôture, « Risques du bâti » allégé en bloc court d'entrée de 3B. Ne PAS ajouter de graphique décoratif.
- **Empilement de la checklist** (Editorial) : un cas rare (plusieurs zonages + 2 périls + passoire + confort insuffisant) peut produire ~5 points. Un item par face borne déjà ; à surveiller à l'intégration, pas de cap dur en 5a.
- Les séparateurs de famille sont le seul texte que « l'ordre seul » ne porte pas : soigner leur discrétion pour ne pas re-segmenter.
