# FUT-127 · MESURES NATIONALES, LECTURE SEULE.
#
# Croise l'index du comparateur (data/comparateur-index.json.gz) et l'export public GASPAR
# (https://files.georisques.fr/GASPAR/gaspar.zip, fichiers datés du 05/10/2026).
#
#   curl -L -o /tmp/gaspar.zip https://files.georisques.fr/GASPAR/gaspar.zip && unzip -d /tmp/gaspar /tmp/gaspar.zip
#   python3 -I docs/audits/2026-10-22-fut127-risques-naturels/mesure-nationale.py /tmp/gaspar
#
# Aucune écriture. Les chiffres cités dans l'audit sont ceux que ce script imprime.
import collections, csv, glob, gzip, json, os, re, statistics, sys

DOSSIER = sys.argv[1]
fichier = lambda motif: sorted(glob.glob(os.path.join(DOSSIER, motif)))[-1]
C = json.loads(gzip.open("data/comparateur-index.json.gz").read())["communes"]
N = len(C)
POP = sum(c.get("population") or 0 for c in C)
par_insee = {c["insee"]: c for c in C}


def part(selection):
    s = [c for c in C if selection(c)]
    return f"{len(s)} communes ({100 * len(s) / N:.1f} %), {100 * sum(c.get('population') or 0 for c in s) / POP:.1f} % de la population"


print("== 1. Le rang CatNat inondation de l'index")
print("règle « exposition élevée » (rang >= 66) :", part(lambda c: c.get("inondation") and c["inondation"]["risque"] >= 66))
seuil = min(c["inondation"]["catnat"] for c in C if c.get("inondation") and c["inondation"]["risque"] >= 66)
print("plus petit compte classé « élevé » :", seuil, "reconnaissances depuis 1982")
for k in (4, 6, 8, 10, 12):
    print(f"  compte >= {k} :", part(lambda c, k=k: c.get("inondation") and c["inondation"]["catnat"] >= k))
print("champ `tri` vrai dans l'index :", sum(1 for c in C if (c.get("inondation") or {}).get("tri")))

print("\n== 2. Taille de commune et compte")
avec = [c for c in C if c.get("inondation") and c.get("population")]


def rangs(v):
    o = sorted(range(len(v)), key=lambda i: v[i]); r = [0.0] * len(v); i = 0
    while i < len(o):
        j = i
        while j + 1 < len(o) and v[o[j + 1]] == v[o[i]]:
            j += 1
        for k in range(i, j + 1):
            r[o[k]] = (i + j) / 2
        i = j + 1
    return r


print("Spearman population ~ compte :", round(statistics.correlation(rangs([c["population"] for c in avec]), rangs([c["inondation"]["catnat"] for c in avec])), 3))
for lo, hi in [(0, 500), (500, 2000), (2000, 10000), (10000, 50000), (50000, 10**9)]:
    s = [c for c in avec if lo <= c["population"] < hi]
    print(f"  {lo}-{hi} hab. : n={len(s)}, médiane {statistics.median(c['inondation']['catnat'] for c in s)}, « élevée » {100 * sum(c['inondation']['risque'] >= 66 for c in s) / len(s):.0f} %")

print("\n== 3. Les plans de prévention (export GASPAR pprn)")
R = list(csv.DictReader(open(fichier("pprn_gaspar_*.csv"), encoding="utf-8"), delimiter=";"))
opp = [r for r in R if r["LIBELLE ETAT"] == "Opposable"]
porte = lambda r, motif: any(re.search(motif, r.get(f"LIBELLE RISQUE {i}", "") or "", re.I) for i in (2, 3))
INOND = r"inond|submersion|crue|ruissel|nappe"
# La règle de production (src/lib/decision/inondation-lecture.ts, `zonageInondationDepuisPlans`).
ALEA = re.compile(r"\bPPRI\b|inondation|inondable|submersion|crue|ruissellement", re.I)
reconnu = lambda r: r["CODE MODELE"] in ("PPRN-I", "PPRN-SM") or bool(ALEA.search(r["LIBELLE PROCEDURE"]))
print("modèles opposables :", collections.Counter(r["CODE MODELE"] for r in opp).most_common())
rates = [r for r in opp if porte(r, INOND) and not reconnu(r)]
print("plans opposables portant un aléa inondation/submersion NON reconnus comme inondation :",
      len({r["CODE PROCEDURE"] for r in rates}), "procédures,", len({r["CODE INSEE COMMUNE"] for r in rates}), "communes",
      collections.Counter(r["CODE MODELE"] for r in rates).most_common())
avec_ppr = {r["CODE INSEE COMMUNE"] for r in opp if porte(r, INOND)}
sub = {r["CODE INSEE COMMUNE"] for r in opp if porte(r, r"submersion")}
print("communes avec un PPR inondation opposable :", part(lambda c: c["insee"] in avec_ppr))
bas = [i for i in avec_ppr if i in par_insee and par_insee[i].get("inondation") and par_insee[i]["inondation"]["risque"] < 66]
print("  dont rang < 66 (règle « satisfied », signal favorable) :", len(bas), f"({100 * len(bas) / len([i for i in avec_ppr if i in par_insee]):.1f} %)")
sub_bas = sorted(par_insee[i]["nom"] for i in sub if i in par_insee and par_insee[i]["inondation"]["risque"] < 66)
print("communes avec un PPR submersion opposable :", len([i for i in sub if i in par_insee]), "| dont rang < 66 :", len(sub_bas), sub_bas[:20])
eleve_sans = [c for c in C if c.get("inondation") and c["inondation"]["risque"] >= 66 and c["insee"] not in avec_ppr]
print("communes « élevées » sans aucun PPR inondation opposable :", len(eleve_sans))
print("PPR opposable OU compte >= 8 :", part(lambda c: c["insee"] in avec_ppr or (c.get("inondation") and c["inondation"]["catnat"] >= 8)))

print("\n== 4. Les libellés des reconnaissances CatNat (export GASPAR catnat)")
K = list(csv.DictReader(open(fichier("catnat_gaspar_*.csv"), encoding="utf-8"), delimiter=";"))
print("libellés contenant « submersion » :", sum(1 for r in K if re.search("submersion", r["lib_risque_jo"], re.I)))
x = collections.Counter(r["lib_risque_jo"] for r in K if r["date_debut"].startswith("2010-02-2") and r["code_commune"][:2] in ("17", "85"))
print("Xynthia (27/02/2010, Charente-Maritime et Vendée), libellés :", x.most_common())
