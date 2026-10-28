# FUT-156 · reprise (28/10/2026)

Fait (worktree `.claude/worktrees/fut156`, branche `bonjourfuturee/fut-156-fibre-adresse`, commit local, rien de poussé) :
- `src/lib/fibre-adresse.ts` (format, classement, lecture), `fibre-adresse-texte.ts`, `server/fibre-adresse-index.ts`
  (bucket privé, activé par `FIBRE_ADRESSE_BUCKET`), route + type + versionnement + `FibreAdresseSection` (Relevé), banc `/dev/fut156`.
- Pipeline `scripts/fibre-adresse/` : `construire.mjs`, `publier.mjs` (garde production), `contre_epreuve.py`, `capturer-cas.mjs`.
- Tests : `src/lib/fut156-fibre-adresse.test.ts` (37/37), `scripts/fibre-adresse/fibre-adresse.test.mjs` (12/12). tsc OK.
- Mesures 17 : 435 586/435 586 adresses identiques à la contre-épreuve Python ; 80,0 % avec état (4 000 retirées par la règle des 150 m).
  21 lots, 1,16 Mo. Fichiers départementaux d'éligibilité : 1,448 Go au national (contre 1,87 Go pour le fichier national).

En cours / reste à faire :
1. Reconstruction nationale propre (lecture CSV RFC 4180 ajoutée après l'arrêt sur `base_imb_43`) : sortie dans le scratchpad
   `.../scratchpad/index/2026T2` (`rapport.json`). La relancer si interrompue : elle reprend département par département.
2. Recontre-épreuve 17 avec les sources copiées dans `.../scratchpad/src17`, recapturer la fixture si les codes changent.
3. Pilote Supabase sur `future-e-test` (bucket privé `fibre-adresse`) : aucune clé serveur du projet de test disponible localement ;
   quotas Free partagés par l'organisation (1 Go, 5 Go d'egress). Mesurer upload, latence, lots vs communes.
4. Recette navigateur bureau/mobile (extension Chrome non connectée ; Playwright webkit disponible), lint vs main, build, suite complète.
5. Doc pipeline trimestriel, PR, Linear In Review. Aucune fusion, aucun déploiement, aucune écriture en production.
