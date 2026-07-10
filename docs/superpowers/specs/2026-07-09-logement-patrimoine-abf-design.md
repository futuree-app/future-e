# Spec — Patrimoine protégé à cette adresse (Face 2, module Logement)

**Date** : 2026-07-09 · **Branche cible** : `feat/logement-patrimoine-abf` (depuis `main`) · **Statut** : design validé par le porteur, à planifier.

Issu du spike du 9 juillet (`docs/audits/2026-07-09-inventaire-sources-angles-morts.md`). Doctrine du
module : `docs/vault/modules/logement.md`.

## Problème

Une adresse située dans un périmètre patrimonial est soumise à une contrainte de travaux que futur•e
ignore complètement. Le code ne mentionne **nulle part** l'Architecte des Bâtiments de France ni les
monuments historiques (vérifié par `grep` sur `src/`).

Mesuré sur **210 adresses réelles de logements** (tirées des DPE de l'ADEME, 70 communes
échantillonnées au prorata de la population, chaque point interrogé auprès du Géoportail de
l'urbanisme) :

| | Part en périmètre patrimonial | IC 95 % |
|---|---:|---|
| toutes communes | **25 %** (52/210) | 19 % – 31 % |
| communes ≥ 50 000 hab | **55 %** (18/33) | 38 % – 70 % |
| communes < 50 000 hab | 19 % (34/177) | 14 % – 26 % |

Un run indépendant sur 60 adresses donnait 18 %, dans l'intervalle du second.

Dans ces périmètres, les travaux modifiant l'aspect extérieur sont soumis à autorisation d'urbanisme,
avec avis de l'Architecte des Bâtiments de France, qui **peut s'opposer** à une modification visible
de façade (Code du patrimoine, art. L621-30 à L621-32). L'avis est certain ; l'issue ne l'est pas.

*Note d'honnêteté : `/api/renovation` n'est appelé par aucune interface et `ThermalComfortSection`
mentionne l'isolation des murs comme une glose. futur•e ne **recommande** pas de travaux aujourd'hui.
Le fait reste décisif pour un acheteur, qui, lui, en envisagera.*

## Scope

**DANS (version 1) :**
- Servitudes **patrimoniales seules** : `AC1` (abords d'un monument historique), `AC2` (site classé ou
  inscrit), `AC4` (site patrimonial remarquable).
- Un bloc en **Face 2**, dans la brique « Statut réglementaire à cette adresse » existante.
- Un point dans « À vérifier avant de décider », réservé aux projets d'achat et de résidence.

**HORS, et pourquoi :**
- **Zone du PLU (U / AU / A / N)** : le vault interdit « synthèse des droits à construire » et
  « verdict de marge de manœuvre ». Dire la zone sans rien en conclure est une ligne de crête, non
  franchie en v1.
- **Servitudes de risques (`PM1`, `PM3`)** : elles doubleraient la brique PPRN déjà affichée.
- **Toutes les autres SUP** (captages, lignes électriques, voies ferrées, télécom) : le fait utile
  n'existe pas pour un habitant, et le bloc deviendrait un catalogue. La Place Stanislas renvoie
  **134 assiettes**, la cathédrale de Strasbourg **107**.
- **Secteurs de sols pollués (SIS / SUP sols)** : reportés en **version 1.1**, voir plus bas.
- **Alimentation de la synthèse IA** : le prompt n'apprend rien de cette brique en v1. Le fait est
  déterministe et se suffit à lui-même.

## Doctrine centrale

**Le fait est binaire, jamais énuméré.** Un point est dans autant de périmètres qu'il y a de
monuments autour. Le lecteur n'a pas besoin de savoir qu'il y en a 134 : il a besoin de savoir qu'il
est dedans. La lib dédoublonne par famille et rend **au plus trois lignes**.

**On ne déduit jamais les travaux autorisés ou interdits.** Comme `pprn-zonage.ts`, la lib structure
ce que l'API renvoie. La Face 2 énonce la procédure ; la checklist, dont chaque point *est un geste*,
nomme l'enjeu concret. Le verdict appartient à l'ABF, jamais à futur•e.

**Le silence n'est jamais une absence.** `municipality` n'expose aucun indicateur de publication des
servitudes : on ne peut pas distinguer « aucune servitude ici » de « rien n'a été versé ». On
n'invente donc pas cet état. Quand rien n'est trouvé, **rien ne s'affiche**, et la mention de source
est portée **une fois** à l'intro de la brique, comme la Face 3 le fait pour OpenStreetMap. En cas de
panne, `sourceStatus` la rend observable, sans jamais présenter une absence de réponse comme une
absence de servitude.

*Vérification de couverture : sur sept monuments historiques majeurs (cathédrales de Mende, Ajaccio,
Chartres, Strasbourg, Reims, Palais des Papes, Place Stanislas), les sept renvoient bien leurs
périmètres. Les zéros observés ailleurs venaient de centroïdes communaux tombés loin des centres.*

**Le statut réglementaire reste frais.** La doctrine de rehydratation
(`2026-07-07-logement-rehydratation-design.md`) pose que le risque ne se gèle pas : le PPRN est
re-fetché, l'autour est snapshoté. Le patrimoine est un statut réglementaire : il suit le PPRN, il
**n'entre pas dans le snapshot** et il est re-fetché à chaque génération et à chaque rehydratation.

## Architecture

**`src/lib/gpu-servitudes.ts` — lib PURE, sans réseau, testable.**

```ts
export type HeritageFamily = "AC1" | "AC2" | "AC4";

export type HeritageProtection = {
  family: HeritageFamily;
  label: string;   // terme officiel : « Abords d'un monument historique »
};

export type RawSupFeature = { properties?: { idass?: string | null } | null };

/**
 * Filtre les seules familles patrimoniales, dédoublonne (un point peut être dans 134 assiettes),
 * et rend un ordre STABLE : AC1, AC4, AC2. Cet ordre est une convention de lecture, non une
 * hiérarchie de contrainte : un site classé (AC2) peut être plus contraignant que des abords (AC1).
 * Ne compte rien, ne nomme aucun monument, ne juge pas la sévérité.
 */
export function buildHeritageProtections(features: RawSupFeature[] | null | undefined): HeritageProtection[];
```

La famille se lit dans le préfixe de `idass` (`"AC1-172014607-..."` → `AC1`). Un `idass` absent,
vide ou non reconnu est ignoré, jamais deviné.

**`src/lib/gpu.ts` — fetcher server-only.**

```ts
export async function fetchHeritageProtections(lon: number, lat: number): Promise<{
  items: HeritageProtection[];
  sourceStatus: "ok" | "unavailable";
}>;
```

Appelle `https://apicarto.ign.fr/api/gpu/assiette-sup-s?geom={Point}`. Timeout, un seul essai, pas de
retry agressif : une panne rend `unavailable`, jamais une liste vide. Latence mesurée : **641 ms en
médiane, 1 495 ms au pire, aucun rejet sur dix appels en rafale**. À lancer **en parallèle** des
appels Géorisques existants, jamais en série.

**Intégration.** Le résultat remonte par la route du rapport, à côté de `regulatoryPlans`. Il n'est
pas persisté.

**`src/lib/logement-checklist.ts`.** `ChecklistFacts` gagne `perimetrePatrimonial: boolean`. Une
règle de plus, dans les buckets `achat` et `reside` uniquement : un locataire ne fait pas ces travaux.

## Ce que le lecteur voit

**Face 2**, dans « Statut réglementaire à cette adresse », après les plans de prévention. Titre de
bloc : **« Patrimoine protégé à cette adresse »**.

Les familles présentes sont **nommées une fois chacune**, puis la phrase de procédure est portée
**une seule fois** pour le bloc entier. Sans quoi deux familles produiraient deux fois le même
paragraphe.

> **Abords d'un monument historique** · **Site patrimonial remarquable**
>
> Cette adresse se situe dans un périmètre patrimonial. Certains travaux modifiant l'aspect extérieur
> du bâtiment peuvent nécessiter une autorisation et l'avis de l'Architecte des Bâtiments de France.
> À vérifier en mairie avant devis ou dépôt de dossier.

Aucun chiffre, aucun nom de monument, aucune distance, aucun compteur.

*Sur la modalité :* la procédure générale est certaine (dans un périmètre, une modification de
l'aspect extérieur passe par une autorisation d'urbanisme, et l'ABF est consulté). Le « peuvent »
couvre le fait que tous les travaux ne modifient pas l'aspect extérieur, et que l'issue de l'avis est
inconnue. Formulation arbitrée par le porteur, retenue telle quelle.

**« À vérifier avant de décider »**, buckets achat et résidence :

> Si vous envisagez des travaux extérieurs, isolation, menuiseries ou toiture, faites vérifier en
> mairie ce que le périmètre patrimonial autorise, avant tout devis.

## Erreurs et cas limites

| Cas | Comportement |
|---|---|
| API en panne ou timeout | `sourceStatus: "unavailable"`, aucun bloc, aucune affirmation d'absence |
| Aucune servitude patrimoniale au point | aucun bloc (silence), la mention de source reste à l'intro |
| 134 assiettes `AC1` sur le point | une seule ligne « Abords d'un monument historique » |
| `idass` absent ou famille inconnue | feature ignorée |
| Familles non patrimoniales (`PM1`, `AS1`…) | ignorées en v1 |
| Adresse à Paris, Lyon, Marseille | le GPU répond aux coordonnées, jamais à l'INSEE : le piège PLM ne s'applique pas ici |

## Tests

Lib pure, TDD, comme `pprn-zonage.test.ts` et `logement-checklist.test.ts` :

- 134 features `AC1` → une seule protection.
- Mélange `AC1` + `AC4` + `PM1` → deux protections, `PM1` écarté.
- `features: []`, `null`, `undefined` → `[]`.
- `idass` vide, `idass: "XX9-..."` → ignoré.
- Ordre stable : `AC1`, puis `AC4`, puis `AC2`.
- Checklist : `perimetrePatrimonial` avec bucket `location` → aucun item ; avec `achat` → un item.

Le fetcher n'est pas testé contre le réseau : son contrat est `{items, sourceStatus}`, et la lib pure
porte toute la logique.

## Critères d'acceptation

1. Une adresse dans le Marais affiche le bloc, avec une ou deux lignes, jamais un compteur.
2. Une adresse rurale sans servitude n'affiche **rien**, et le rapport ne dit nulle part qu'il n'y a
   pas de protection.
3. Le GPU coupé : le rapport se rend, sans bloc, sans erreur visible, `sourceStatus` observable.
4. Le bloc est re-fetché à la rehydratation, comme le PPRN, jamais servi depuis un snapshot.
5. La checklist ajoute un point pour un projet d'achat, aucun pour une location.
6. Un point portant deux familles (`AC1` et `AC4`) affiche deux intitulés et **une seule** phrase de
   procédure.
7. La latence ajoutée au rendu du rapport reste sous 300 ms au p50, l'appel GPU étant lancé en
   parallèle des appels Géorisques et non en série.

## Non-objectifs

- Prédire l'issue de l'avis de l'ABF.
- Nommer, compter ou localiser les monuments.
- Afficher la zone du PLU ou raisonner sur les droits à construire.
- Alimenter la synthèse IA.
- Traiter les sols pollués (version 1.1).

## Version 1.1, décidée et non vague

Les **secteurs de sols pollués au point** (`conclusions_sis`, `conclusions_sup` de Géorisques), sous
un intitulé distinct, avec la même mécanique : silence par défaut, fait affirmé quand il existe.

Mesuré sur 120 adresses réelles de logements : **aucune n'est dans un secteur de sols** (IC 95 % :
0 – 3 %), et 15 % en ont un à moins de 500 mètres. La brique se déclenchera donc pour moins de 3 % des
lecteurs. Elle vaut d'être construite précisément pour eux : un secteur de sols sur la parcelle
engage une obligation d'information de l'acquéreur et peut coûter une vente.

Cela demande une nuance dans `docs/vault/modules/logement.md`, qui range aujourd'hui « sols pollués »
dans Santé. La règle proposée, arbitrée avec le porteur le 2026-07-09 : **le fait réglementaire à
l'adresse vit en Face 2 ; l'exposition du corps vit en Santé ; le second renvoie au premier sans le
répéter.** Les 15 % « à moins de 500 mètres » sont une exposition, non un statut : ils restent hors
Face 2.
