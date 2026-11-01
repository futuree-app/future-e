import sys, json, re
sys.path.insert(0,'py')
exec(open('py/arretes.py').read().split("rapport = {}")[0])
lignes = open('arretes/annexe2.txt').read().split('\n')
def bloc(a, b):
    return [l.strip() for l in lignes[a:b] if l.strip() and 'JOURNAL OFFICIEL' not in l and re.match(r"^[A-ZÀ-ÜŒ' ’\-().0-9,]+$", l.strip())]
for dep, (a, b), d3 in [("64", (793, 1027), "064"), ("84", (1878, 1886), "084")]:
    noms = bloc(a, b)
    cs = communes(dep); index = {norm(n): (c, n) for c, n, _ in cs}; geo = {c: g for c, n, g in cs}
    codes = {match(n, index)[0][0] for n in noms if match(n, index)[0]}
    zones = [shapely.make_valid(g) for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=2", 'ID')]
    massifs = [shapely.make_valid(g) for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=1", 'ID')]
    tz, tm = STRtree(zones), STRtree(massifs)
    res = []
    for c in codes:
        g = geo[c]; interieur = g.buffer(-200)
        zi = sum(zones[k].intersection(interieur).area for k in tz.query(interieur, predicate='intersects')) / 1e4 if not interieur.is_empty else 0
        mi = sum(massifs[k].intersection(g).area for k in tm.query(g, predicate='intersects')) / 1e4
        res.append((c, index_nom := [n for n2,(cc,n) in index.items() if cc == c][0], round(mi, 1), round(zi, 1)))
    res.sort(key=lambda x: -x[3])
    print(dep, 'communes exclues', len(noms), 'appariées', len(codes), 'avec zone publiée à >200 m du bord', sum(1 for r in res if r[3] > 1), 'avec massif >1ha', sum(1 for r in res if r[2] > 1))
    print('  ', res[:12])
