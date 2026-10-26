# FUT-135, deuxième revue de Work : preuve positive

- `controle-preuve-positive.mjs` : le contrôleur de Work, **non modifié** (SHA-256 `6abdcda4…79adb64`, identique au manifeste de l'archive jointe à FUT-135). Il écrit `preuve-positive.json` dans ce dossier.
- `preuve-positive-avant.json` : sortie sur `41376a11`, 32 violations, code de sortie 1.
- `preuve-positive-apres.json` : sortie après correctif, 0 violation, code de sortie 0.

Rejouer depuis la racine : `node docs/audits/2026-10-26-fut135-revue2/controle-preuve-positive.mjs`.
Le détail est au §9 de `docs/audits/2026-10-25-fut135-part-etudiante.md`.
