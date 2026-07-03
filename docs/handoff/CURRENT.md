# Brief de passation — session vivante

**Horodatage** : 2026-07-03
**Branche courante** : `main` (HEAD = `da556ab`, à pousser). Arbre propre après commit.

---

## Objectif en cours

**Chantier harmonisation du rapport : CLÔTURÉ et poussé.** Le kit de cartes partagé
(`ReportSection` + `GlassCard`) est la source unique du langage visuel ; Logement le consomme,
sa prose est remontée au registre de Territoire, ses cartes sont en verre arrondi et son passeport
a l'effet 3D. Territoire n'est pas migré (adoption = fast-follow mécanique).

**Nouvelle cible : suite du module Logement.** Le module est aujourd'hui une lecture Face 2
(sinistralité ONRN) branchée sur une Face « risques du bâti » + DPE. Reste à brancher/finir les
autres faces et la plomberie autour (voir « Prochaine étape »).

## Fait dans cette session

1. **Face 2 Logement — sinistralité ONRN** (LIVRÉ + poussé) : bloc « Ce que le risque a déjà
   coûté ici » (coût moyen + fréquence ONRN sécheresse **et** inondation, 1995-2021, classes
   verbatim gatées par la représentativité, pédagogie CatNat non prédictive). Lib pure testée
   `src/lib/onrn-sinistralite.ts` (8/8), JSON runtime, câblage API. Vérifié navigateur (3 états).
2. **Harmonisation du rapport (CLÔTURÉ)** :
   - `d7d5040` kit `src/components/report/kit.tsx` (`ReportSection` + `GlassCard`).
   - `901ba5f` migration + harmonisation de `LogementModule.tsx` : sections de résultat passées au
     verre arrondi ; prose remontée à ~15-16px (au lieu de 11-13px) ; **tous** les encarts arrondis
     (champ/bouton de recherche, alertes, `ActionCard`, lignes de scénario d'audit, signaux) ;
     passeport du bien enveloppé dans `PassportTiltScene` (dépliage + tilt curseur + parallaxe
     sceau DPE/adresse, en miroir du passeport territorial).
   - `da556ab` doctrine : section « Kit de cartes du rapport » + règle d'harmonisation dans
     `docs/vault/recherches/inventaire-design.md`.
   - Vérifié navigateur (3 adresses : Toulouse/Bordeaux/Lille, 0 erreur console, tsc + eslint verts).

## Décisions prises (porteur)

- **Le rapport = un seul produit visuel.** Un écran de rapport qui lit « plus petit » ou « plus
  carré » que Territoire est un défaut d'harmonisation (gravé dans l'inventaire design).
- **Registre typo de lecture** : la prose d'un module se tient à ~15-16px comme Territoire, pas
  11-13px. Le porteur décrivait le confort visé comme « Territoire zoomé à ~110 % ».
- **Structure partagée, accent propre au module** : Territoire = info/bleu, Logement = taupe
  (`#c8b89a`). Le kit ne porte que le chrome, jamais le contenu.
- **Commit direct sur `main` + push** = norme de session (pas de PR sur ce repo).

## État git

- Branche `main`, HEAD `da556ab`. **Commits faits, push à confirmer** (dernière commande de la
  session = `git push`). **Aucune PR.** Arbre propre (hors ce fichier).
- Route dev jetable `src/app/dev-logement-preview/` **supprimée** (elle a servi la vérif navigateur).

## Prochaine étape immédiate

**Suite du module Logement — l'améliorer.** Le porteur veut avancer sur ce qui reste (cf. fiche
mémoire `project_module_logement.md`, section « RESTE »). Chantiers ouverts, non priorisés :

1. **Faces 1/3/4 non branchées** : le module lit aujourd'hui DPE + risques du bâti + sinistralité
   (Face 2). Restent à câbler, selon la doctrine `docs/vault/modules/logement.md` :
   - Face 1 « dedans » : DPE/confort été (îlot de chaleur CSTB en réserve, cf. `icu_ilot_chaleur_data.md`).
   - Face 3 « autour immédiat » : buffer marche BPE + OSM.
   - Face 4 « financier » : assurance DOCUMENTÉE (matérialité passée + parcelle + régime CatNat),
     jamais prédite.
2. **Dashboard PostHog** acheteur/résident à créer (l'instrumentation `logement_analyzed` /
   `logement_projet_declare` émet déjà `relation_inferee`, `in_declared_commune`, `projet`).
3. **Mapping INSEE 107 communes fusionnées** (certaines adresses tombent en `indispo`).

Avant de coder : relire `docs/vault/modules/logement.md` (doctrine des 4 faces, frontière
Santé = pollution/sols/industrie/radon/air, valeur immo prédite parquée, HLM exclu) et **brainstormer
avec le porteur** quelle face prioriser.

## À lire d'abord à la reprise

1. `MEMORY.md` (index) + fiche **`project_module_logement.md`** (état complet du module, RESTE).
2. `docs/vault/modules/logement.md` (doctrine des 4 faces, ce qui est branché/parqué).
3. `src/components/report/LogementModule.tsx` (le module ; API du kit via `kit.tsx`).
4. `docs/vault/recherches/inventaire-design.md` (règle d'harmonisation du rapport, à respecter pour
   tout nouvel écran Logement).
5. `docs/handoff/AUTO-SNAPSHOT.md` (fraîcheur repo).

## Pièges / fils ouverts

- **Auth** : `/rapport/logement` est derrière `canAccessCompleteReport` (payant). La vérif visuelle
  passait par une route dev jetable (supprimée) ; le vrai parcours connecté n'a pas été retesté.
- **`next build` complet non lancé** ce chantier (conflit dev server) : la trace serverless de la
  Face 2 (`outputFileTracingIncludes`) suit le pattern existant mais n'est pas prouvée par un build.
- **Tension éditoriale ouverte** (posée par l'Editorial, non tranchée) : « retrait-gonflement des
  argiles » (jargon dans `{mecanisme}`) à gloser ou assumer.
- **Adoption du kit par Territoire** = fast-follow documenté (mécanique, à faire quand on peut
  vérifier Territoire au navigateur).
- Script de pilotage navigateur réutilisable : `…/scratchpad/drive-face2.mjs` (3 adresses),
  binaire `chrome-headless-shell` via `PW_CHROMIUM`, dev server sur :3000.
