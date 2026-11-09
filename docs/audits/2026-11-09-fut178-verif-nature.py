import json, gzip, math, sys
import numpy as np
W="/Users/quentinbrache/Desktop/Futur·e/.claude/worktrees/fut178"
rec=json.load(open("/Users/quentinbrache/Desktop/Futur·e/data/cache-nature/communes-nature.json"))
idx=json.load(gzip.open(W+"/data/comparateur-index.json.gz"))
C=idx["communes"]
pts=[(c["insee"],c["lat"],c["lon"]) for c in C if c["insee"] in rec and c.get("lat") is not None]
codes=[p[0] for p in pts]; lats=np.array([p[1] for p in pts]); lons=np.array([p[2] for p in pts])
nat=np.array([rec[c]["nat_px"] for c in codes],dtype=np.int64); tot=np.array([rec[c]["tot_px"] for c in codes],dtype=np.int64)
def hav(la,lo,LA,LO):
    r=math.pi/180; dla=(LA-la)*r; dlo=(LO-lo)*r
    a=np.sin(dla/2)**2+math.cos(la*r)*np.cos(LA*r)*np.sin(dlo/2)**2
    return 2*6371*np.arcsin(np.sqrt(a))
cell=0.18; grid={}
for i in range(len(codes)): grid.setdefault((int(lats[i]//cell),int(lons[i]//cell)),[]).append(i)
# grille plus large pour la sélection « vraie » (tous centroïdes ≤ 15 km)
cell2=0.5; grid2={}
for i in range(len(codes)): grid2.setdefault((int(lats[i]//cell2),int(lons[i]//cell2)),[]).append(i)
out={}; ecart_index=0; seul=0; manques=0; ecarts=[]
for i,c in enumerate(codes):
    ci,cj=int(lats[i]//cell),int(lons[i]//cell)
    ids=np.array(sum((grid.get((ci+a,cj+b),[]) for a in (-1,0,1) for b in (-1,0,1)),[]))
    d=hav(lats[i],lons[i],lats[ids],lons[ids]); near=ids[d<=15]
    rp=round(100*nat[near].sum()/tot[near].sum(),1)
    ci2,cj2=int(lats[i]//cell2),int(lons[i]//cell2)
    ids2=np.array(sum((grid2.get((ci2+a,cj2+b),[]) for a in (-1,0,1) for b in (-1,0,1)),[]))
    d2=hav(lats[i],lons[i],lats[ids2],lons[ids2]); near2=ids2[d2<=15]
    rp2=round(100*nat[near2].sum()/tot[near2].sum(),1)
    if abs(rp-(rec[c].get("radius_pct") or -1))>0.05: ecart_index+=1
    if len(near)==1: seul+=1
    if len(near2)>len(near): manques+=1; ecarts.append(abs(rp2-rp))
    out[c]=(len(near),len(near2),rp,rp2)
print("communes",len(codes))
print("radius_pct recalculé ≠ cache :",ecart_index)
print("communes dont le « rayon » ne contient qu'elles-mêmes :",seul)
print("communes où la grille 0,18° omet des centroïdes à ≤15 km :",manques, "écart médian/max (pts) :", (np.median(ecarts) if ecarts else 0), (max(ecarts) if ecarts else 0))
ns=np.array([v[0] for v in out.values()]); print("nb communes dans le « rayon » : médiane",int(np.median(ns)),"p5",int(np.percentile(ns,5)),"p95",int(np.percentile(ns,95)))
for c in ["17094","02100","28199","2B096","13096","74056","33063","59350"]:
    print(c, rec[c]["brut_pct"], rec[c]["radius_pct"], out[c])
json.dump({k:list(map(float,v)) for k,v in out.items()}, open("selection.json","w"))
