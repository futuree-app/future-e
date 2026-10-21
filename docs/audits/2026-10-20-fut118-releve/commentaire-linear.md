**FUT-118 · phase A livrée pour revue** (cadrage, rien de fusionné, déployé ni activé)

Branche `feat/fut-118-convergence-releve` (worktree `fut118-releve`, depuis `main` `bdf3fd4a`). Rapport : `docs/audits/2026-10-20-fut118-releve.md` · grammaire canonique : `docs/audits/2026-10-20-fut118-releve/grammaire-du-releve.md` · écrans témoins : `/dev/fut118` (dev seulement, données fictives) · captures : `docs/audits/2026-10-20-fut118-releve/captures/`.

**Constats**
- `DECISION_RELEVE` n'existe dans **aucun** environnement Vercel (Production, Preview) : seul l'accueil montre le Relevé. Tout payant voit Ma décision classique et des modules entièrement historiques.
- La rupture la plus forte est dans le **tunnel** (connexion à halos, déblocage Territoire en italique orange et cartes arrondies), entre l'accueil et le dossier.
- **Trois canons se contredisent** : `DESIGN.md` v2.1, `report/kit.tsx` (« source unique », couleur par module), `src/components/releve/` (utilisé en production, annoncé « prototype »). Trois échelles typographiques.
- Ma décision Relevé : bascule **sans appel Anthropic** (même plan, même empreinte) ; reste à vérifier : artefacts historiques en série, lectures enrichies réelles, Safari (jamais testé), mobile dans le vrai `/rapport`, contrôle final du sticky (FUT-92), et une coquille encore classique (orbes, carte projet, bandeau « projet changé »).
- Chaque évolution du dossier se paie déjà deux fois (FUT-10, FUT-20, FUT-93).

**Vérifications** : suite complète seule 2831/2831 avant synchronisation, `tsc` OK, lint des nouveaux fichiers OK, 0 px de débordement sur toutes les captures (1440, 390, 360). 5 tests des témoins (isolation, aucun réseau, la phrase dit ce que dit la marge ; une mutation détectée).

**Plan proposé** : R0 canon (sans changement visible) → R1 primitives manquantes → R2 Ma décision (coquille + activation par palier) → Q correctifs immédiats → R6 tunnel → R3 Logement → R4 Territoire → R5 Autour → R7 navigation (avec FUT-86) → R8 pages commune → R9-R11 → R12 nettoyage. FUT-41 peut démarrer dès R0.

**Hors périmètre** : le nom de commune pris dans l'URL du déblocage est suivi dans **FUT-119** (High), non corrigé ici. Textes « ce territoiresera », « ce territoire est-elle » : lot Q.

**Arbitrages du 20/10** : Relevé unique grammaire canonique ; `DESIGN.md` v3.0 privilégiée, adoption après relecture (correspondance section par section : grammaire § 9, 5 sections remplacées, 19 amendées, 3 ajoutées) ; habillage complet de Ma décision avant activation ; activation progressive par compte ; tunnel avant modules ; puis Logement, Territoire, Autour ; FUT-41 / FUT-22 adoptent le canon dès validation ; **aucune activation de `DECISION_RELEVE`**.

**Synchronisation** : branche rebasée sur `main` après FUT-116 (`3da725e3`), suite 2852/2852 deux fois, `tsc` et lint OK. Restent à faire : Safari, thème clair, écrans connectés réels, vérifications 1 à 12 du § 6.2 (lots R2 / R2b).

**Prochaine étape** : revue détaillée des documents, avant R0.
