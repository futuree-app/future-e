"""
Contre-épreuve indépendante de l'index de la fibre à l'adresse (FUT-156).

Recalcule, en Python et sans rien partager avec le pipeline Node, le code de CHAQUE adresse BAN d'un
département à partir des fichiers officiels bruts, puis le compare à l'entrée publiée dans les lots.
Les règles sont réécrites ici depuis leur énoncé (README du pipeline), pas traduites du code :
  - rattachement par la clé BAN, puis par le libellé exact pour les immeubles fibre sans clé BAN ;
  - un immeuble fibre à plus de 150 m du point BAN rend le rattachement douteux ;
  - états différents -> ambigu ; état absent -> non publié ;
  - opérateurs : codes distincts des lignes FO, hors pseudo-opérateurs ; immeuble absent de `actuel` ->
    nombre non établi ; présent sans ligne FO -> zéro.

Usage : python3 -I contre_epreuve.py <base_imb.csv.gz> <actuel.csv.gz> <immeuble_dep.csv> <adresses.csv.gz> <dossier des lots> <dep>
`immeuble_dep.csv` : l'extrait cartefibre du département au format CSV d'origine (en-tête compris), produit
par un autre outil que le pipeline (le POC FUT-148 : `scripts/research/fut148-adresse/extraire_imm.py`).
"""
import csv, gzip, json, math, re, sys, unicodedata, collections, glob, os

base_imb, actuel, imm_csv, ban_csv, lots_dir, dep = sys.argv[1:7]
SEUIL = 150.0
PSEUDO = {"CCC", "CCCC", "??", "FORM", "ARCEP"}
LETTRES = {"deploye": "D", "raccordable demande": "R", "rad en cours de deploiement": "Q",
           "en cours de deploiement": "E", "cible": "C", "signe": "S", "abandonne": "X"}

def norm(s):
    # Seuls les diacritiques disparaissent ; toute autre ponctuation (apostrophe typographique comprise) sépare.
    s = "".join(c for c in unicodedata.normalize("NFD", s or "") if unicodedata.category(c) != "Mn").upper()
    return re.sub(r"[^A-Z0-9]+", " ", s).strip()

def merc(x, y):
    R = 6378137.0
    return math.degrees(x / R), math.degrees(2 * math.atan(math.exp(y / R)) - math.pi / 2)

def dist(lon1, lat1, lon2, lat2):
    kx = 111320 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.hypot((lon1 - lon2) * kx, (lat1 - lat2) * 110540)

# États cartefibre (extraction indépendante). Un code publié deux fois avec deux états : inconnu.
etat = {}
with open(imm_csv, encoding="utf-8") as f:
    for r in csv.DictReader(f):
        e = LETTRES.get(r["imb_etat"]) if r["imb_etat"] else ""
        if r["imb_id"] in etat and etat[r["imb_id"]] != e:
            etat[r["imb_id"]] = None
        else:
            etat.setdefault(r["imb_id"], e)

imm = {}
par_cle = collections.defaultdict(list)
par_lib = collections.defaultdict(list)
with gzip.open(base_imb, "rt", encoding="utf-8") as f:
    for r in csv.DictReader(f, delimiter=";"):
        imm[r["imb_id"]] = r
        if r["addr_code"]:
            par_cle[r["addr_code"]].append(r["imb_id"])
        if r["imb_source"] == "fo" and r["addr_source"] != "ban":
            par_lib[(r["addr_code_insee"], r["addr_numero"], (r["addr_rep"] or "").upper(), norm(r["addr_nom_voie"]))].append(r["imb_id"])

presents, ops = set(), collections.defaultdict(set)
with gzip.open(actuel, "rt", encoding="utf-8") as f:
    for r in csv.DictReader(f, delimiter=";"):
        presents.add(r["imb_id"])
        if r["code_techno"] == "FO":
            ops[r["imb_id"]].add(r["code_operateur"])

PREF = ["entrée", "bâtiment", "logement", "délivrance postale", "parcelle", "segment", "service technique"]
ban = {}
with gzip.open(ban_csv, "rt", encoding="utf-8") as f:
    for b in csv.DictReader(f, delimiter=";"):
        rang = PREF.index(b["type_position"]) if b["type_position"] in PREF else 99
        if b["id"] not in ban or rang < ban[b["id"]][0]:
            ban[b["id"]] = (rang, b)

def attendu(b):
    ids, lib = par_cle.get(b["id"]), False
    if not ids:
        ids = par_lib.get((b["code_insee"], b["numero"], (b["rep"] or "").upper(), norm(b["nom_voie"])))
        lib = bool(ids)
    if not ids:
        return None
    p = "~" if lib else ""
    fo = [imm[i] for i in ids if imm[i]["imb_source"] == "fo"]
    if not fo:
        return p + "I"
    suf = "/%d" % len(fo) if len(fo) > 1 else ""
    lon, lat = float(b["lon"]), float(b["lat"])
    if any(dist(*merc(float(r["imb_x"]), float(r["imb_y"])), lon, lat) > SEUIL for r in fo if r["imb_x"] and r["imb_y"]):
        return p + "G" + suf
    es = [etat.get(r["imb_code"]) for r in fo]
    if any(not e for e in es):
        return p + "U" + suf
    if len(set(es)) > 1:
        return p + "A:" + "".join(sorted(set(es))) + suf
    comptes = []
    for r in fo:
        if r["imb_id"] not in presents or ops[r["imb_id"]] & PSEUDO:
            comptes = None
            break
        comptes.append(len(ops[r["imb_id"]]))
    n = "" if comptes is None else (str(comptes[0]) if min(comptes) == max(comptes) else "%d-%d" % (min(comptes), max(comptes)))
    return p + es[0] + n + suf

publie = {}
for f in glob.glob(os.path.join(lots_dir, "%s-*.json.gz" % dep)):
    lot = json.load(gzip.open(f, "rt", encoding="utf-8"))
    for insee, entrees in lot["communes"].items():
        for suffixe, code in entrees.items():
            publie["%s_%s" % (insee, suffixe)] = code

ecarts = []
compte = collections.Counter()
for k, (_, b) in ban.items():
    a, p = attendu(b), publie.get(k)
    compte["identiques" if a == p else "differents"] += 1
    if a != p and len(ecarts) < 20:
        ecarts.append((k, a, p))
for k in publie:
    if k not in ban:
        compte["publie_hors_ban"] += 1
print(json.dumps({"adresses_ban": len(ban), "entrees_publiees": len(publie), **compte, "exemples": ecarts}, ensure_ascii=False, indent=1))
sys.exit(0 if compte["differents"] == 0 and compte["publie_hors_ban"] == 0 else 1)
