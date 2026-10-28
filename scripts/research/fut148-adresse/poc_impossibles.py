import pickle,sys,csv,gzip,collections,math,re,unicodedata
S=sys.argv[1]; D=pickle.load(open(f'{S}/poc17.pkl','rb'))
imb,parAddr,cf=D['imb'],D['parAddr'],D['cf']
C=collections.Counter
def norm(s):
  s=unicodedata.normalize('NFD',s or '').encode('ascii','ignore').decode().upper()
  return re.sub(r'[^A-Z0-9]+',' ',s).strip()
# index texte des immeubles IPE sans clé BAN (addr_source fo)
txt=collections.defaultdict(list)
for i,r in imb.items():
  if r['imb_source']=='fo':
    txt[(r['addr_code_insee'],r['addr_numero'],(r['addr_rep'] or '').upper(),norm(r['addr_nom_voie']))].append(i)
# grille de proximité (info seulement) en mètres Lambert ~ via lon/lat de cartefibre
grid=collections.defaultdict(list)
for r in cf.values():
  try: lon,lat=float(r['x']),float(r['y'])
  except: continue
  grid[(round(lon,3),round(lat,3))].append((lon,lat))
def dist_min(lon,lat):
  best=1e9
  for dx in (-1,0,1):
    for dy in (-1,0,1):
      for (a,b) in grid.get((round(lon,3)+dx/1000,round(lat,3)+dy/1000),[]):
        d=math.hypot((a-lon)*111320*math.cos(math.radians(lat)),(b-lat)*110540); best=min(best,d)
  return best
cat=C(); pos=C(); ld=C(); dist=C(); textrec=C(); ex=[]
with gzip.open(f'{S}/ban/adresses-17.csv.gz','rt',encoding='utf-8') as f:
  for b in csv.DictReader(f,delimiter=';'):
    if b['id'] in parAddr: continue
    cat['impossible']+=1; pos[b['type_position']]+=1
    num=int(b['numero']) if b['numero'].isdigit() else -1
    ld['lieu-dit/toponyme (num>=5000 ou 99999)' if num>=5000 else ('rep '+b['rep'] if b['rep'] else 'numéro simple')]+=1
    k=(b['code_insee'],b['numero'],(b['rep'] or '').upper(),norm(b['nom_voie']))
    if k in txt: textrec['même numéro+voie (texte) dans IPE sans clé BAN']+=1
    d=dist_min(float(b['lon']),float(b['lat']))
    dist['<15 m' if d<15 else '15-50 m' if d<50 else '50-150 m' if d<150 else '>=150 m']+=1
    if len(ex)<25 and (len(ex)<5 or d>=150 or k in txt): ex.append((b['id'],b['numero'],b['rep'],b['nom_voie'],b['nom_commune'],b['type_position'],round(d)))
print(cat); print('type_position',pos.most_common()); print(ld.most_common()); print(textrec); print('immeuble fibre le plus proche (information, pas rattachement)',dist.most_common())
for e in ex: print(e)
