# Inventaire factuel du module Logement (socle de cadrage, 2026-07-02)

> Document de CONTEXTE, pas un audit critique. Établi par Claude principal pour ancrer les
> briefs des agents (Product Strategist, Design Critic, Researcher). Décrit ce qui EST, sans
> juger. Objectif du chantier : reprendre le module Logement (créé il y a plusieurs semaines,
> jugé non abouti par le porteur), l'harmoniser avec Territoire (très enrichi depuis), et
> décider quelles données brancher et comment. La correction de la donnée sécheresse ONRN
> (coût moyen + fréquence) est faite et parquée dans `data/source/onrn/`, en attente d'une
> direction claire.

## 1. Ce que le module est aujourd'hui (comportement)

- **Point d'entrée** : `src/app/(account)/rapport/logement/page.tsx` (32 lignes), monte
  `LogementModule` (906 lignes, `"use client"`) avec `defaultCommune`.
- **Parcours** : l'utilisateur **tape une adresse** dans un champ. Un seul appel
  `GET /api/georisques-logement?q=…` renvoie toute la payload. Puis 3 onglets :
  **Synthèse / Détails / Agir**. La synthèse narrative (Claude) est générée **à la demande**
  via un bouton « Générer la lecture » (`POST /api/synthesize-logement`, Sonnet 4.6).
- **Hero** (promesse affichée) : « Ce que votre habitat devient. Confort, risques, valeur. »
  Sous-titre : « lit le bien lui-même : DPE, risques par adresse, pression assurantielle et
  trajectoire de valeur ». Aside « Les briques du module » : 4 tuiles (Performance énergétique,
  Risques par adresse, Pression d'assurance, Valeur à 20 ans).
- **Différence de nature avec Territoire** : Logement est **piloté par une adresse tapée**
  (le bien), Territoire est **rendu serveur pour la commune déclarée** de l'utilisateur.

## 2. Données réellement branchées (via `/api/georisques-logement`)

Toutes réelles, chacune dans un `.catch(() => null)` (dégradation silencieuse) :
- **Adresse** : géocodage BAN (`geocodeBanAddress`).
- **Parcelle** : `findCadastreParcelByPoint` (API Carto) → code parcelle, contenance.
- **Altitude** : IGN.
- **DPE + audit** : `getDpeByBanId`/`getDpeByCoordinates`, `getAuditByBanId` (étiquette, conso,
  GES, surface, année, scénarios de travaux).
- **ZFE** : `getZfeForPoint` (zone à faibles émissions, Crit'Air).
- **IREP** : `getIrepNearPoint` (installations industrielles polluantes à proximité).
- **Cartofriches** : `getCartofrichesForCommune` (friches, sol pollué).
- **Géorisques** : `getGeorisquesSummary` (commune) + si `GEORISQUES_API_TOKEN`,
  `getGeorisquesAddressSummary` (point) et `getGeorisquesParcelSummary` (parcelle) :
  risks/pprn labels, **RGA (retrait-gonflement argiles, code+label)**, sismicité.
- **Commune (ADEME) + IRIS** : `getCommuneFullData` (`src/lib/commune-data.ts`) :
  - commune : population, vieillissement, logements vacants, **logements sociaux / HLM %**,
    qualité air (PM2.5/PM10/NO2/O3), revenu médian + infériorité nationale, APL médecins,
    éloignement services, densité, incendies, taux boisement.
  - IRIS agrégé : **passoires thermiques %**, **précarité énergétique %**, propriété/location,
    **HLM %**, suroccupation, motorisation, transports en commun.

## 3. Ce qui est affiché mais N'EST PAS de la donnée réelle (heuristiques)

- **« Pression d'assurance »** (tuile hero + onglet) : `getInsuranceOutlook(risks)` déduit un
  texte à partir des seuls **labels de risque**. Pas de donnée assurantielle réelle.
- **« Valeur à 20 ans »** (tuile hero + onglet) : `getValueOutlook({dpe, risks, friche, passoires})`
  heuristique combinant DPE + risques + friche polluée + passoires. Pas de donnée de marché.
- **`computeQuickVerdict`** : compte des signaux pour un verdict good/medium/bad.
- Conséquence : **les deux « briques » les plus mises en avant du hero (assurance, valeur) sont
  les plus spéculatives.** C'est précisément là que la donnée sécheresse ONRN (coût moyen +
  fréquence, réelle, gatée par la représentativité) apporterait un socle factuel sur le volet
  RGA/sécheresse, dimension centrale de la vulnérabilité d'un bien.

## 4. Divergence de FORME avec Territoire (mesurée)

- **Deux langages de style** : `LogementModule.tsx` = **85 objets `style` inline `var(--…)`**
  (ancien design system : `var(--bg-card)`, `var(--fg-hi)`, `var(--border-2)`, `var(--accent)`).
  `QuartierSynthesis.tsx` (Territoire) = **0 inline `var()`, 43 classes Tailwind**
  (`bg-canvas`, `text-label`, `.glass`, Instrument Serif). Le hero de Logement est en Tailwind,
  mais **tout le bloc résultats bascule en inline** : incohérence même à l'intérieur du module.
- **Territoire a un vocabulaire de composants que Logement n'a pas** : `TerritoryIdentityCard`
  (carte d'identité + trait distinctif), `TerritoryYearsBand` (bande des années CatNat),
  `ReportRelationBanner` (relation résidence/découverte corrigeable), `HorizonBar`, passeport
  (`PassportTiltScene`), `QuartierSynthesis` (synthèse hiérarchisée avec discipline de preuve),
  mood déterministe (`deriveTerritoryMood`). Logement n'a ni identité, ni bande, ni passeport,
  ni contexte de relation, ni synthèse déterministe hiérarchisée : il a un verdict compté + une
  synthèse IA à la demande + des grilles de `Block label/value`.
- **Architecture** : Territoire = page serveur `force-dynamic`, données assemblées côté serveur
  (`gatherCommuneEnrichment`), premium-gaté, contexte de lecture (relation) câblé. Logement =
  composant client, une adresse → un fetch → onglets, pas de contexte de relation, pas de gate
  premium visible au niveau module.

## 5. Voix / synthèse

- `synthesize-logement` : prompt système riche (voix futur•e stricte : vouvoiement, pas de
  tiret cadratin, pas de phrases IA-typiques, distinguer observé/modélisé/incertain), sortie
  JSON (verdict, signals, reading 3-5 §, actions). Sonnet 4.6, effort medium, thinking off.
- La synthèse Territoire (`synthesize-quartier`) suit une doctrine « synthèse hiérarchisée +
  discipline de preuve » récemment recalibrée. Les deux prompts ne partagent pas de socle commun.

## 6. Questions ouvertes (à instruire par les agents, NON tranchées ici)

- **Le fond** : quel est l'archétype du module Logement ? Que doit-il faire décider (acheter /
  louer / rénover / provisionner des travaux / négocier) ? Adresse-first est-il le bon parcours,
  ou faut-il une lecture « mon bien » plus incarnée ? Qu'est-ce qui manque en valeur ?
- **La forme** : jusqu'où harmoniser avec Territoire (mêmes composants/tokens) sans effacer la
  spécificité « le bien, pas le territoire » ? Un passeport du bien ? Une bande ? Une identité ?
- **Les données** : parmi ce qui est déjà branché, qu'est-ce qui est structurant vs bruit ?
  Quelles données manquent (assurabilité réelle, sécheresse/RGA gravité, inondation à l'adresse,
  valeur/marché) ? Comment les brancher honnêtement ? La sécheresse ONRN est prête : où et
  comment l'intégrer sans surpromettre ?
- **Frontière Logement / Territoire / Santé** : éviter la redondance (RGA, air, incendies
  apparaissent des deux côtés).

## 7. Fichiers clés

- `src/components/report/LogementModule.tsx` (906 l.)
- `src/app/api/georisques-logement/route.ts` (assemblage serveur)
- `src/app/api/synthesize-logement/route.ts` (synthèse IA)
- `src/lib/commune-data.ts` (ADEME commune + IRIS)
- Territoire pour comparaison : `src/app/(account)/rapport/quartier/page.tsx`,
  `src/components/report/{QuartierSynthesis,TerritoryIdentityCard,TerritoryYearsBand,ReportRelationBanner}.tsx`
- Donnée sécheresse prête : `data/source/onrn/onrn_secheresse_consolide.json` (+ rapport
  `docs/rapports-agents/data-curator/2026-07-02-fix-csv-secheresse-onrn.md`)
