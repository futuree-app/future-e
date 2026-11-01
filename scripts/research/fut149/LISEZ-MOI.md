# FUT-149 · Contre-épreuves du zonage du débroussaillement (à rejouer à chaque édition)

Scripts de recherche, lancés depuis un dossier de travail qui contient :

- `dl/full.gpkg` : la version complète de la base DÉBROUSSAILLEMENT (GeoPackage extrait du `.7z` de l'IGN) ;
- `arretes/annexe1.txt`, `arretes/annexe2.txt` : le texte des annexes de l'arrêté du 6 février 2024 dans sa
  version en vigueur (PDF publiés par AIDA/INERIS, extraits avec `pypdf`) ;
- `out/<édition>/` : l'édition construite par `scripts/debroussaillement/construire.py`.

Environnement : `python3 -m venv venv && venv/bin/pip install -r scripts/debroussaillement/requirements.txt pypdf`.

| Script | Ce qu'il vérifie |
|---|---|
| `arretes.py` | Commune par commune, les massifs (`ZONAGE = 1`) contre les listes des annexes 1 (communes classées) et 2 (communes exclues). |
| `annexe1.py` | Annexe 1 : massifs situés entièrement hors de toute commune listée ; zones publiées à plus de 200 m des communes listées. |
| `pa64.py` | Annexe 2 : zones publiées à plus de 200 m du bord des communes exclues (Pyrénées-Atlantiques, Vaucluse). Alimente `scripts/debroussaillement/exclusions-arretes.json`. |
| `oracle.py` | 20 000 points (la moitié à moins de 120 m d'une limite) classés par Shapely sur les polygones Lambert-93 d'origine. |
| `contre-epreuve.mts` | La lecture de l'application (tuiles, `lireDebroussaillement`) contre cet oracle : `node scripts/research/fut149/contre-epreuve.mts <dossier de travail>`. |
| `candidats.py` | Recherche d'adresses de recette dans et hors zone, par commune (BAN inverse sur une grille). |

Résultats du 28/10/2026 : `docs/audits/2026-10-28-fut149-debroussaillement/02-contre-epreuves.md`.

**Format `debroussaillement-2` (30/10/2026, option A de R3).** Les tuiles portent les vraies limites du zonage,
calculées par `construire.py`. `limites-alignees.mjs` (recherche des vraies limites posées sur la grille, que la lib
du format 1 devait deviner) n'a plus d'objet. Les contre-épreuves du format 2 (oracle sur la géométrie d'origine,
jonctions, trous, interstices, multipolygones, frontières construites par le vrai constructeur) sont dans
`docs/audits/2026-10-30-fut149-contre-revue-pr111/sondes/` et leurs résultats dans le rapport du même nom (§ 14).

