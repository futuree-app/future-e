import pickle,sys,json,urllib.request,urllib.parse,time,collections,re,unicodedata,ssl
S=sys.argv[1]; D=pickle.load(open(f'{S}/poc17.pkl','rb'))
imb,parAddr,cf,fo=D['imb'],D['parAddr'],D['cf'],D['fo']
def norm(s):
  s=unicodedata.normalize('NFD',s or '').encode('ascii','ignore').decode().upper(); return re.sub(r'[^A-Z0-9]+',' ',s).strip()
txt=collections.defaultdict(list)
for i,r in imb.items():
  if r['imb_source']=='fo' and r['addr_source']!='ban':
    txt[(r['addr_code_insee'],r['addr_numero'],(r['addr_rep'] or '').upper(),norm(r['addr_nom_voie']))].append(i)
def get(u):
  for _ in range(3):
    try:
      with urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'futuree-poc-fut148/1'}),timeout=20) as r: return json.load(r)
    except Exception as e: err=str(e); time.sleep(1)
  return {'erreur':err}
def rattacher(ban_id, props):
  ids=parAddr.get(ban_id); rung='cle BAN'
  if not ids:
    t=(props.get('citycode',''),str(props.get('housenumber','')).split(' ')[0] if props.get('housenumber') else '', '', norm(props.get('street','')))
    hn=str(props.get('housenumber') or ''); m=re.match(r'^(\d+)\s*(.*)$',hn)
    if m: t=(props.get('citycode',''),m.group(1),m.group(2).upper(),norm(props.get('street','')))
    ids=txt.get(t); rung='libelle identique'
  if not ids: return dict(rattachement='impossible',rung=None)
  ipe=[imb[i] for i in ids if imb[i]['imb_source']=='fo']
  if not ipe: return dict(rattachement='indisponible',rung=rung,motif='aucun immeuble fibre recense')
  det=[dict(imb_code=r['imb_code'],type=r['imb_type'],num=r['imb_num'],statut=cf.get(r['imb_code'],{}).get('imb_etat'),logloc=r['imb_nbr_logloc'],operateurs=sorted(fo.get(r['imb_id'],[])),pm=cf.get(r['imb_code'],{}).get('pm_etat'),date_mad=cf.get(r['imb_code'],{}).get('pm_date_mad')) for r in ipe]
  st={d['statut'] for d in det}
  return dict(rattachement='fiable' if len(st)==1 and None not in st else 'ambigu',rung=rung,statut=st.pop() if len(st)==1 else sorted(map(str,st)),immeubles=det[:6],n_immeubles=len(det))
ech=json.load(open(f'{S}/echantillon.json'))
for e in ech:
  g=get('https://data.geopf.fr/geocodage/search?'+urllib.parse.urlencode({'q':e['label'],'limit':1,'index':'address'}))
  f=(g.get('features') or [None])[0]; p=f['properties'] if f else {}
  e['geocodeur']=dict(id=p.get('id'),label=p.get('label'),score=round(p.get('score',0),3),type=p.get('type'))
  e['meme_cle']=p.get('id')==e['ban_id']
  e['poc']=rattacher(p.get('id') or e['ban_id'],p)
  r=get('https://rnb-api.beta.gouv.fr/api/alpha/buildings/?'+urllib.parse.urlencode({'cle_interop_ban':p.get('id') or e['ban_id']}))
  e['rnb']=len(r.get('results',[])) if 'results' in r else r.get('erreur','?')
  time.sleep(0.25)
  print(f"{e['strate'][:22]:22} {e['meme_cle']!s:5} rnb={e['rnb']} {e['poc']['rattachement']:12} {str(e['poc'].get('statut'))[:28]:28} {e['label'][:60]}")
json.dump(ech,open(f'{S}/echantillon_resultats.json','w'),ensure_ascii=False,indent=1)
