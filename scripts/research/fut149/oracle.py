import sys, json, random
sys.path.insert(0,'py')
from gpkg import lire
import shapely, numpy
from shapely.geometry import Point
from shapely.strtree import STRtree
from pyproj import Transformer
T='debroussaillement_complet_format_v8_janvier26'
z=[(g,a) for g,a in lire('dl/full.gpkg',T,'ZONAGE=2','ID,DEPT,DIFFUSION')]
gs=[g for g,_ in z]; tr=STRtree(gs)
to84=Transformer.from_crs(2154,4326,always_xy=True)
random.seed(149)
pts=[]
# 1. Points près des limites : un sommet de limite au hasard, décalé de 0 à 120 m.
for _ in range(10000):
    g,_=random.choice(z)
    ring=random.choice([g.geoms[i].exterior for i in range(len(g.geoms))])
    c=shapely.get_coordinates(ring); x,y=c[random.randrange(len(c))]
    r=random.uniform(0,120); a=random.uniform(0,6.283)
    pts.append((x+r*numpy.cos(a), y+r*numpy.sin(a)))
# 2. Points au hasard dans l'emprise de zones tirées au hasard (intérieur et extérieur lointains).
for _ in range(10000):
    g,_=random.choice(z); x0,y0,x1,y1=g.bounds
    pts.append((random.uniform(x0-3000,x1+3000), random.uniform(y0-3000,y1+3000)))
out=[]
for x,y in pts:
    p=Point(x,y); idx=tr.query(p.buffer(200))
    dedans=[k for k in idx if gs[k].contains(p) or gs[k].touches(p)]
    d=min([gs[k].boundary.distance(p) for k in idx], default=1e9)
    amb=any(z[k][1][2]!='Oui' for k in idx if gs[k].distance(p)<=50)
    lon,lat=to84.transform(x,y)
    out.append({"lon":lon,"lat":lat,"dedans":bool(dedans),"d":round(d,3),"ambigu":amb})
json.dump(out,open('oracle-points.json','w'))
print(len(out), sum(o['dedans'] for o in out), sum(o['d']<=50 for o in out))
