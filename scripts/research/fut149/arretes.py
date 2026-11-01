"""Contre-épreuve : les massifs (ZONAGE=1) de la base IGN, commune par commune, contre les annexes de l'arrêté
du 6 février 2024 dans leur version du 13 avril 2026 (annexe 1 : communes classées L132-1 ; annexe 2 : communes
où tous les massifs sont exclus, L133-1)."""
import sys, json, re, unicodedata, urllib.request, difflib, collections
sys.path.insert(0, 'py')
from gpkg import lire
import shapely, numpy
from shapely.geometry import shape
from shapely.strtree import STRtree
from pyproj import Transformer

NOMS = {"Charente":"16","Charente-Maritime":"17","Cher":"18","Corrèze":"19","Côtes-d’Armor":"22","Essonne":"91","Eure":"27","Eure-et-Loir":"28","Finistère":"29","Haute-Garonne":"31","Gers":"32","Haute-Loire":"43","Ille-et-Vilaine":"35","Indre":"36","Indre-et-Loire":"37","Isère":"38","Loir-et-Cher":"41","Loire":"42","Loiret":"45","Maine-et-Loire":"49","Morbihan":"56","Sarthe":"72","Savoie":"73","Seine-et-Marne":"77","Deux-Sèvres":"79","Tarn-et-Garonne":"82","Vienne":"86",
        "Alpes de Haute-Provence":"04","Hautes-Alpes":"05","Ariège":"09","Aude":"11","Aveyron":"12","Bouches-du-Rhône":"13","Dordogne":"24","Drôme":"26","Gard":"30","Hérault":"34","Lot":"46","Lot-et-Garonne":"47","Lozère":"48","Pyrénées-Atlantiques":"64","Hautes-Pyrénées":"65","Pyrénées-Orientales":"66","Tarn":"81","Var":"83","Vaucluse":"84"}
def norm(s):
    s = unicodedata.normalize('NFD', s.upper()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = s.replace('Œ', 'OE').replace('’', "'"); s = re.sub(r"\bSAINTE?\b", lambda m: 'ST' if m.group(0) == 'SAINT' else 'STE', s)
    return re.sub(r"[^A-Z0-9]", "", s)

def parse(path):
    out = collections.defaultdict(list); dep = None; liste = False
    for l in open(path):
        l = l.strip()
        if re.match(r'^ANNEXE 2', l) and 'annexe1' in path: break
        m = re.match(r"^Département (?:de la |de l’|des |du |de |d’)(.+?)\s*$", l)
        if m:
            dep = NOMS.get(m.group(1).strip()); liste = False; continue
        if 'JOURNAL OFFICIEL' in l or not l: continue
        if re.search(r"communes (de|suivantes)\s*:", l): liste = True; continue
        if liste and dep and re.match(r"^[A-ZÀ-ÜŒ' ’\-().0-9,]+$", l) and len(l) > 1:
            out[dep].append(l)
        elif liste and l and l[0].islower(): continue
    return out

def get(u):
    with urllib.request.urlopen(u, timeout=60) as r: return json.load(r)

T = 'debroussaillement_complet_format_v8_janvier26'
to93 = Transformer.from_crs(4326, 2154, always_xy=True)
def l93(g): return shapely.transform(g, lambda c: numpy.column_stack(to93.transform(c[:, 0], c[:, 1])))

def communes(dep):
    fc = get(f"https://geo.api.gouv.fr/departements/{dep}/communes?fields=code,nom&format=geojson&geometry=contour")
    return [(f['properties']['code'], f['properties']['nom'], l93(shape(f['geometry']))) for f in fc['features']]

def match(nom, index):
    n = norm(re.sub(r"\(.*?\)", "", nom))
    if n in index: return index[n], 'exact'
    c = difflib.get_close_matches(n, list(index), n=1, cutoff=0.85)
    return (index[c[0]], 'approx') if c else (None, None)

rapport = {}
a1, a2 = parse('arretes/annexe1.txt'), parse('arretes/annexe2.txt')
for annexe, listes in (("annexe1", a1), ("annexe2", a2)):
    for dep, noms in sorted(listes.items()):
        cs = communes(dep)
        index = {norm(n): (c, n) for c, n, _ in cs}
        conditionnels = {i for i, n in enumerate(noms) if '(' in n}
        listes_codes, non_trouves = set(), []
        for i, n in enumerate(noms):
            (cn, how) = match(n, index)
            if cn is None: non_trouves.append(n)
            elif i not in conditionnels: listes_codes.add(cn[0])
        d3 = dep.zfill(3) if dep.isdigit() else '0' + dep
        massifs = [shapely.make_valid(g) for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=1", 'ID')]
        zones = [g for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=2", 'ID')]
        tm, tz = STRtree(massifs) if massifs else None, STRtree(zones) if zones else None
        par = {}
        for code, nom, g in cs:
            am = sum(massifs[k].intersection(g).area for k in tm.query(g, predicate='intersects')) if tm else 0
            az = sum(zones[k].intersection(g).area for k in tz.query(g, predicate='intersects')) if tz else 0
            par[code] = (nom, am / 1e4, az / 1e4)
        if annexe == "annexe1":
            hors = [(par[c][0], round(par[c][1], 1)) for c in par if c not in listes_codes and par[c][1] > 1]
            vides = [(par[c][0], round(par[c][2], 1)) for c in listes_codes if c in par and par[c][1] <= 0.01]
            rapport[f"{annexe} {dep}"] = {"communes_listees": len(noms), "non_appariees": non_trouves, "massifs_hors_liste_ha>1": sorted(hors, key=lambda x: -x[1]), "listees_sans_massif": vides}
        else:
            dans = [(par[c][0], round(par[c][1], 1)) for c in listes_codes if c in par and par[c][1] > 1]
            rapport[f"{annexe} {dep}"] = {"communes_exclues": len(noms), "conditionnelles": len(conditionnels), "non_appariees": non_trouves, "massifs_dans_communes_exclues_ha>1": sorted(dans, key=lambda x: -x[1])}
        r = rapport[f"{annexe} {dep}"]
        print(annexe, dep, {k: (len(v) if isinstance(v, list) else v) for k, v in r.items()}, flush=True)
json.dump(rapport, open('arretes/comparaison.json', 'w'), ensure_ascii=False, indent=1)
