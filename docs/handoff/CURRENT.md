# Passation — 2026-08-03, branche `main`

**Horodatage** : 2026-08-03 · **Branche** : `main` = `47dfadc`, tout est poussé.
Le handoff précédent (parcours d'achat des dossiers) est archivé sous
`docs/handoff/2026-08-01-parcours-achat-dossiers.md`. Son lot D1/D2 a été commité depuis.

> ⚠ **Deux terminaux travaillent sur `main`.** Relire `git status` avant tout `git add`.

---

## Objectif en cours

La séquence de refonte du langage visuel (`docs/handoff/2026-07-29-design-system-sequencage.md`)
est **terminée, étapes 1 à 5**. Le travail s'est prolongé sur la typographie, le thème clair et une
recherche de logotype, aujourd'hui **close par un brief**. Le dernier lot en date améliore le
module Autour en reliant deux faits qu'il affichait sans les rapprocher.

## Fait dans cette session

- **`DESIGN.md` (racine), v2.0** : document prescriptif, onze sections. Couche d'application sous la
  doctrine du vault, qui garde l'autorité.
- **Bascule typographique** : l'interface passe à **Archivo** (variable, auto-hébergée en WOFF2),
  avec une **échelle de rôles** (`--text-*`, dix rôles) et une **échelle de graisses**
  (`--weight-*`). 197 déclarations de police en dur migrées vers les tokens. Le logo garde
  Instrument Serif, isolé sur `--font-brand`.
- **Thème clair réparé** : 431 occurrences de voiles blancs en dur migrées vers les tokens, plus
  les tokens `--x-ink` (teinte de texte, distincte de la teinte de surface).
- **Explorer nettoyé** : gabarit générique `savoir/[slug]` et `territoires/[slug]` retiré
  (il servait un score composite interdit par l'ADR-0001), `Navbar` unifiée sur 14 pages, sitemap
  corrigé, badges « Bientôt » et colonne « Par profil » retirés du header.
- **Deux audits** : `docs/audits/2026-07-30-famille-editoriale.md` et
  `docs/audits/2026-07-29-accueil-rapport-territoire.md`.
- **Brief de logotype** : `docs/vault/briefs/2026-08-03-logotype-articulation-r-point-e.md`.
- **Lecture composée chaleur/végétation** dans Autour : `src/lib/logement-autour-chaleur.ts`
  (11 tests), branchée dans `AutourSection.tsx`.
- **Doctrine** : « un équipement n'est pas un refuge » et ses trois niveaux de preuve, dans
  `docs/vault/doctrine/data.md`.
- **Trois bancs d'essai en dev** (404 en production) : `/dev/typo`, `/dev/logo`,
  `/dev/logo/bifurcation`.

## Décisions prises, pas encore dans le vault

Tout est dans le vault **sauf** ces trois points :

1. **Le mot-symbole reste `futur•e` en Archivo** pour la bêta (porteur). La recherche de logotype
   ne rouvre qu'avec un dessinateur, sur le brief ci-dessus.
2. **Ordre arrêté pour la suite d'Autour** (porteur, sur avis externe) : auditer la sémantique de
   la distance et l'accessibilité **avant** d'ajouter la surface des polygones OSM.
3. **La palette close de `DESIGN.md` n'est pas appliquée** : le sable `#c8b89a` subsiste dans
   `professionnels/page.tsx`, `ProForm.tsx` et `globals.css`. Le document déclare sa suppression,
   le code la contredit.

## État git

- Branche `main`, `47dfadc`, **rien à pousser**.
- Non suivis, sans intérêt : `.impeccable/`, `Futur.e Design System.zip`.
- Aucune PR ouverte (le dépôt travaille directement sur `main`, déploiement en production au push).

## Prochaine étape immédiate

**Auditer la sémantique de la distance dans `src/lib/logement-osm.ts`.** Répondre à quatre
questions, dans cet ordre : la distance est-elle au bord ou au centroïde (c'est le bord,
`distancePointToPolygonM`, à confirmer sur les cas limites) ; existe-t-il un tag OSM `access` ou
`barrier` exploitable pour distinguer un espace public d'un espace privé ; combien d'espaces verts
sont représentés par un simple point plutôt qu'un polygone ; quelle part des géométries est
invalide ou multipolygone.

Ce n'est qu'après que la surface (`area`) devient pertinente : un espace accessible de 2 000 m²
vaut mieux qu'une forêt privée de 40 hectares dont la limite est proche.

## À lire d'abord à la reprise

1. `MEMORY.md` et les fiches `project_module_logement`, `icu_ilot_chaleur_data`.
2. `DESIGN.md` (racine), en particulier § 5 (couleur), § 6.2 (filet), § 9.1 (typographie).
3. `docs/vault/doctrine/data.md`, section « un équipement n'est pas un refuge ».
4. `docs/vault/doctrine/design.md`, deux amendements datés (orbes retirés, Archivo).
5. `docs/handoff/2026-07-29-design-system-sequencage.md` pour l'historique de la séquence.
6. `docs/handoff/AUTO-SNAPSHOT.md` pour vérifier la fraîcheur.

## Pièges et fils ouverts

- **Les substitutions massives se paient en silence.** Deux bugs introduits et corrigés dans cette
  session : `@font-face { font-family: var(--font-serif) }` (invalide, la police n'était plus
  chargée) et `--border-1: var(--border-1)` (auto-référence, toutes les bordures du thème sombre
  vides pendant deux jours). Ni l'un ni l'autre ne lève d'erreur ni ne casse un test. **Après tout
  script de remplacement sur du CSS, relire les lignes qui DÉCLARENT les tokens.**
- **`--orange` sur du texte échoue en thème clair** (2,13:1). Les tokens `--x-ink` existent, seuls
  les surtitres du dossier et le point médian du logo sont migrés. Le reste du produit ne l'est pas.
- **Le linter `impeccable` signale encore une occurrence**, le `@font-face` du logo. Assumée : elle
  se ferme le jour où le logo passe aux SVG de `logo/svg/`, décision non prise.
- **`--orange` sert à la fois d'accent de marque et de registre « compromis »** dans le dossier de
  décision. Tranché pour le rapport (le sens gagne), pas ailleurs.
- **L'ICU et l'espace vert ne sont pas des `DecisionFact`** : ni poids, ni matérialité, ni effet sur
  le verdict, alors qu'ils pèsent sur une décision résidentielle. Tension gravée dans
  `doctrine/data.md`, non tranchée.
- **Le décompte des échelles se contredit** dans le rapport : « six angles » a été retiré du hero,
  mais « trois échelles » et « Module 01 » cohabitent encore.
- **Aucune CGV n'existe** (rétractation 14 jours, médiateur de la consommation). Arbitrage du
  porteur : à traiter en fin de séquence.
- **Le site est fermé au crawl** (`robots.txt` en `Disallow: /`). La canonicité des URL doit être
  tranchée **avant** de lever cette ligne.
