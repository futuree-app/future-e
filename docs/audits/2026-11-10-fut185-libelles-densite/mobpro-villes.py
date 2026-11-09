"""FUT-185 · Part voiture des trajets domicile-travail des quatre villes de la machine à sous de l'accueil.

Usage : python3 -I mobpro-villes.py <rp-mobpro-2022.parquet>

Même calcul que scripts/populate-mobilite.py (IPONDI[TRANS == 5] / IPONDI total, commune de RÉSIDENCE), mais
au grain de la ville ENTIÈRE : Lyon (69123) et Marseille (13055) agrègent tous leurs arrondissements, là où
l'index ne connaît que les arrondissements. Le fichier source (base MOBPRO du RP 2022, Insee) n'est pas
versionné ; empreinte SHA-256 de la copie utilisée le 10/11/2026 :
6b91385a79846e1a0de67c60ce9c6d163cfb6c775fc7b8aee41b7c2a0a6daf3d
Valeurs attendues (src/lib/accueil/recits.ts, MACHINE_A_SOUS_MOBPRO) :
  69123 Lyon 0.2916 · 13055 Marseille 0.5178 · 56260 Vannes 0.6754 · 17300 La Rochelle 0.5328
"""
import sys, collections
import pyarrow.parquet as pq

VILLES = {"69123": "Lyon", "13055": "Marseille", "56260": "Vannes", "17300": "La Rochelle"}
agg = collections.defaultdict(lambda: [0.0, 0.0])
for b in pq.ParquetFile(sys.argv[1]).iter_batches(columns=["COMMUNE", "TRANS", "IPONDI"], batch_size=500_000):
    d = b.to_pydict()
    for c, t, w in zip(d["COMMUNE"], d["TRANS"], d["IPONDI"]):
        if c in VILLES and w is not None:
            agg[c][0] += w
            agg[c][1] += w if t is not None and float(t) == 5 else 0.0
for c, nom in VILLES.items():
    tot, voit = agg[c]
    print(f"{c} {nom} {round(voit / tot, 4)} ({round(tot)} actifs en emploi pondérés)")
