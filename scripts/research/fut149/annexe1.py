import sys, json, re
sys.path.insert(0,'py')
exec(open('py/arretes.py').read().split("rapport = {}")[0])
MANUEL = {"LA FLOTTE-EN-RÉ": "La Flotte", "CHEVENELLES": "Chenevelles", "FRUGIÈRES": "Frugières-le-Pin", "SAINT-FLORENT": "Saint-Florent"}
TEXTE = {"77": ["NEMOURS", "POLIGNY"], "91": ["COURANCES", "MILLY-LA-FORET"]}
a1 = parse('arretes/annexe1.txt')
out = {}
for dep in sorted(set(a1) | set(TEXTE)):
    noms = a1.get(dep, []) + TEXTE.get(dep, [])
    cs = communes(dep); index = {norm(n): (c, n) for c, n, _ in cs}; geo = {c: g for c, n, g in cs}; nom = {c: n for c, n, _ in cs}
    codes = set()
    for n in noms:
        if n.startswith("BORS"):
            codes |= {c for c, nn, _ in cs if nn.startswith("Bors")}; continue
        m, _ = match(MANUEL.get(n, n), index)
        if m: codes.add(m[0])
    d3 = dep.zfill(3) if dep.isdigit() else '0' + dep
    massifs = [shapely.make_valid(g) for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=1", 'ID')]
    zones = [shapely.make_valid(g) for g, _ in lire('dl/full.gpkg', T, f"DEPT='{d3}' and ZONAGE=2", 'ID')]
    listees = shapely.union_all([geo[c] for c in codes]) if codes else None
    isoles, total = [], 0
    for g in massifs:
        if g.area < 1e4: continue
        total += 1
        if listees is None or not g.intersects(listees):
            cc = [nom[c] for c, gg in geo.items() if gg.intersects(g)]
            isoles.append((round(g.area / 1e4, 1), cc[:3]))
    zone_ha = sum(z.area for z in zones) / 1e4
    zone_hors = sum(z.difference(listees.buffer(200)).area for z in zones) / 1e4 if listees is not None else zone_ha
    out[dep] = {"communes_listees": len(noms), "appariees": len(codes), "massifs>1ha": total, "massifs_hors_toute_commune_listee": sorted(isoles, key=lambda x: -x[0])[:10], "n_isoles": len(isoles), "zone_ha": round(zone_ha), "zone_ha_a_plus_de_200m_des_communes_listees": round(zone_hors, 1)}
    print(dep, {k: v for k, v in out[dep].items() if k != "massifs_hors_toute_commune_listee"}, out[dep]["massifs_hors_toute_commune_listee"][:4], flush=True)
json.dump(out, open('arretes/annexe1-massifs.json', 'w'), ensure_ascii=False, indent=1)
