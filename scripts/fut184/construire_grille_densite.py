"""FUT-184 · Construit la table de la grille communale de densité Insee 2025 (DENS7) lue par Territoire.

Usage : python3 -I scripts/fut184/construire_grille_densite.py <dossier_sources>
  <dossier_sources> contient fichier_diffusion_2025.xlsx et fichier_diffusion_2026.xlsx, téléchargés par
  scripts/fut184/telecharger_sources.sh (empreintes vérifiées). Écrit src/lib/territoire/grille-densite.generated.ts.

Ce que fait le script, et rien de plus :
  - lit le CODE OFFICIEL `DENS7` de la feuille « Maille communale » (en-têtes en ligne 5) ;
  - refuse de continuer si une empreinte SHA-256 diffère, si un code est dupliqué, si un libellé `LIBDENS7`
    ne correspond pas à son code, ou si les deux éditions géographiques (01/01/2025 et 01/01/2026) divergent
    sur un code ou une classe ;
  - ne recalcule AUCUNE classe : ni à partir des parts P1/P2/P3 (80 communes ne s'y retrouvent pas, FUT-180 §3.2),
    ni à partir d'une densité moyenne. Les parts ne sont pas exportées.
La table retenue est l'édition « géographie au 01/01/2025 », celle du COG de l'index ; l'édition 2026 sert de contre-épreuve.
"""
import hashlib, json, os, sys

import pandas as pd

RACINE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SORTIE = os.path.join(RACINE, "src", "lib", "territoire", "grille-densite.generated.ts")

EMPREINTES = {  # identiques à docs/audits/2026-11-09-fut180-grille-densite-insee/SHA256-source.txt
    "fichier_diffusion_2025.xlsx": "951ae15ad9055235f3ec1d8bd7c9a2281d35f98a98e01bc2bc513f70eb1b3452",
    "fichier_diffusion_2026.xlsx": "8ebf3011743db45ab94c4ffb74d1bcb06929f0076ecd5b8247011bca861ca978",
}
LIBELLES_INSEE = {
    1: "Grands centres urbains",
    2: "Centres urbains intermédiaires",
    3: "Petites villes",
    4: "Ceintures urbaines",
    5: "Bourgs ruraux",
    6: "Rural à habitat dispersé",
    7: "Rural à habitat très dispersé",
}


def refus(msg: str) -> None:
    print(f"REFUS : {msg}", file=sys.stderr)
    sys.exit(1)


def sha256(chemin: str) -> str:
    h = hashlib.sha256()
    with open(chemin, "rb") as f:
        for bloc in iter(lambda: f.read(1 << 20), b""):
            h.update(bloc)
    return h.hexdigest()


def lire(chemin: str) -> tuple[pd.DataFrame, str]:
    entete = pd.read_excel(chemin, sheet_name="Maille communale", header=None, nrows=3).iloc[:, 0].tolist()
    g = pd.read_excel(chemin, sheet_name="Maille communale", header=4, dtype={"CODGEO": str})
    g = g[["CODGEO", "LIBGEO", "DENS7", "LIBDENS7"]].copy()
    if g.CODGEO.isna().any() or g.DENS7.isna().any():
        refus(f"{os.path.basename(chemin)} : code commune ou DENS7 vide")
    g["DENS7"] = g.DENS7.astype(int)
    if g.CODGEO.duplicated().any():
        refus(f"{os.path.basename(chemin)} : codes dupliqués {g.CODGEO[g.CODGEO.duplicated()].tolist()[:5]}")
    if not g.DENS7.isin(LIBELLES_INSEE).all():
        refus(f"{os.path.basename(chemin)} : DENS7 hors 1-7")
    faux = g[g.LIBDENS7 != g.DENS7.map(LIBELLES_INSEE)]
    if len(faux):
        refus(f"{os.path.basename(chemin)} : {len(faux)} libellés LIBDENS7 ne correspondent pas à leur code")
    return g, str(entete[2]).split("Géographie au")[-1].strip()


def main() -> None:
    src = sys.argv[1] if len(sys.argv) > 1 else refus("dossier des sources requis")
    for nom, attendu in EMPREINTES.items():
        p = os.path.join(src, nom)
        if not os.path.isfile(p):
            refus(f"{nom} absent de {src}")
        if sha256(p) != attendu:
            refus(f"{nom} : empreinte différente de la source auditée par FUT-180")
    g25, geo25 = lire(os.path.join(src, "fichier_diffusion_2025.xlsx"))
    g26, geo26 = lire(os.path.join(src, "fichier_diffusion_2026.xlsx"))
    if geo25 != "01/01/2025" or geo26 != "01/01/2026":
        refus(f"géographies inattendues : {geo25!r} / {geo26!r}")
    m = g25.merge(g26, on="CODGEO", how="outer", suffixes=("_25", "_26"), indicator=True)
    if (m._merge != "both").any():
        refus(f"les deux éditions n'ont pas les mêmes codes : {m[m._merge != 'both'].CODGEO.tolist()[:10]}")
    diff = m[m.DENS7_25 != m.DENS7_26]
    if len(diff):
        refus(f"{len(diff)} classes diffèrent entre 2025 et 2026 : {diff.CODGEO.tolist()[:10]}")

    par_classe = {k: sorted(g25.CODGEO[g25.DENS7 == k]) for k in LIBELLES_INSEE}
    comptes = {k: len(v) for k, v in par_classe.items()}
    lignes = [
        "// GÉNÉRÉ par scripts/fut184/construire_grille_densite.py : NE PAS MODIFIER À LA MAIN.",
        "// Grille communale de densité Insee 2025, code officiel DENS7 (sept niveaux), feuille « Maille communale ».",
        "// Une ligne par classe : les codes communes, triés, séparés par une espace. Aucune classe n'est recalculée.",
        "",
        "export const GRILLE_DENSITE_SOURCE = " + json.dumps({
            "producteur": "Insee",
            "jeu": "Grille communale de densité 2025, niveau à 7 postes (DENS7)",
            "url": "https://www.insee.fr/fr/information/8571524",
            "fichier": "fichier_diffusion_2025.xlsx",
            "sha256": EMPREINTES["fichier_diffusion_2025.xlsx"],
            "geographie": "2025-01-01",
            "donnees": "Recensement de la population 2021, carroyé à 1 km",
            "contre_epreuve": {"fichier": "fichier_diffusion_2026.xlsx", "sha256": EMPREINTES["fichier_diffusion_2026.xlsx"],
                               "geographie": "2026-01-01", "classes_differentes": 0},
            "licence": "Licence Ouverte 2.0 (Etalab), « Source : Insee »",
            "communes": int(len(g25)),
            "comptes_par_classe": {str(k): v for k, v in comptes.items()},
        }, ensure_ascii=False, indent=2) + " as const;",
        "",
        "export const GRILLE_DENSITE_CODES: Readonly<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string>> = {",
    ]
    for k, codes in par_classe.items():
        lignes.append(f'  {k}: "{" ".join(codes)}",')
    lignes += ["};", ""]
    with open(SORTIE, "w", encoding="utf-8") as f:
        f.write("\n".join(lignes))
    print(f"écrit {os.path.relpath(SORTIE, RACINE)} : {len(g25)} communes, géographie {geo25}, contre-épreuve {geo26} identique")
    print("par classe :", comptes)


if __name__ == "__main__":
    main()
