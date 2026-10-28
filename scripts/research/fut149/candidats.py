import sys, json, time, urllib.request
sys.path.insert(0,'py')
from gpkg import lire
import shapely
from shapely.geometry import shape, Point
from shapely.strtree import STRtree
from pyproj import Transformer
T='debroussaillement_complet_format_v8_janvier26'
zs=[g for g,_ in lire('dl/full.gpkg',T,'ZONAGE=2','ID')]
tr=STRtree(zs)
to93=Transformer.from_crs(4326,2154,always_xy=True)
to84=Transformer.from_crs(2154,4326,always_xy=True)
def get(u):
    for i in range(3):
        try:
            with urllib.request.urlopen(u, timeout=20) as r: return json.load(r)
        except Exception as e: time.sleep(1+i)
    return None
def classe(lon,lat):
    x,y=to93.transform(lon,lat); p=Point(x,y)
    near=tr.query(p.buffer(2000))
    dedans=any(zs[k].contains(p) for k in near)
    d=min([zs[k].exterior.distance(p) if False else zs[k].boundary.distance(p) for k in near], default=99999)
    return dedans, round(d)
out={}
for insee in sys.argv[1:]:
    c=get(f'https://geo.api.gouv.fr/communes/{insee}?fields=nom,contour&format=json&geometry=contour')
    g=shape(c['contour']); nom=c['nom']
    g93=shapely.transform(g, lambda a: __import__('numpy').column_stack(to93.transform(a[:,0],a[:,1])))
    x0,y0,x1,y1=g93.bounds
    step=200
    vus={}
    import numpy as np
    pts=[(x,y) for x in np.arange(x0,x1,step) for y in np.arange(y0,y1,step) if g93.contains(Point(x,y))]
    import random; random.seed(149); random.shuffle(pts); pts=pts[:450]
    for x,y in pts:
            lon,lat=to84.transform(x,y)
            r=get(f'https://data.geopf.fr/geocodage/reverse?lon={lon}&lat={lat}&limit=1&index=address')
            if not r or not r['features']: continue
            f=r['features'][0]; pr=f['properties']
            if pr.get('citycode')!=insee or pr['type']!='housenumber' or pr.get('distance',999)>150: continue
            lo,la=f['geometry']['coordinates']
            ded,d=classe(lo,la)
            vus[pr['id']]=(pr['label'],ded,d,lo,la)
            time.sleep(0.05)
    out[insee]={'nom':nom,'adresses':vus}
    ins=[v for v in vus.values() if v[1] and v[2]>150]; hors=[v for v in vus.values() if not v[1] and v[2]>150]; lim=[v for v in vus.values() if v[2]<=40]
    print(nom, 'n',len(vus),'dedans',len(ins),'hors',len(hors),'limite',len(lim), flush=True)
json.dump(out,open('candidats.json','w'),ensure_ascii=False)
