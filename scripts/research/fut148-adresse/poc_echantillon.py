import pickle,sys,csv,gzip,collections,re,unicodedata,json,random
S=sys.argv[1]; D=pickle.load(open(f'{S}/poc17.pkl','rb'))
imb,parAddr,cf,fo=D['imb'],D['parAddr'],D['cf'],D['fo']
def norm(s):
  s=unicodedata.normalize('NFD',s or '').encode('ascii','ignore').decode().upper(); return re.sub(r'[^A-Z0-9]+',' ',s).strip()
txt=collections.defaultdict(list)
for i,r in imb.items():
  if r['imb_source']=='fo' and r['addr_source']!='ban':
    txt[(r['addr_code_insee'],r['addr_numero'],(r['addr_rep'] or '').upper(),norm(r['addr_nom_voie']))].append(i)
ban={}
with gzip.open(f'{S}/ban/adresses-17.csv.gz','rt',encoding='utf-8') as f:
  for b in csv.DictReader(f,delimiter=';'):
    if b['id'] not in ban or b['type_position'] in ('logement','bâtiment','entrée'): ban[b['id']]=b
strat=collections.defaultdict(list)
for k,b in ban.items():
  ids=parAddr.get(k)
  if not ids:
    t=(b['code_insee'],b['numero'],(b['rep'] or '').upper(),norm(b['nom_voie']))
    strat['libelle' if t in txt else ('impossible_bis' if b['rep'] else 'impossible_nouveau' if '_00' in k and not re.match(r'^\w{5}_\d{4}_',k) else 'impossible')].append(k); continue
  ipe=[imb[i] for i in ids if imb[i]['imb_source']=='fo']
  if not ipe: strat['indisponible'].append(k); continue
  st=set(cf.get(r['imb_code'],{}).get('imb_etat','?') for r in ipe)
  if len(st)>1: strat['ambigu'].append(k); continue
  s=st.pop(); typ=ipe[0]['imb_type']
  if s!='deploye': strat['statut_'+s].append(k)
  elif len(ipe)>1: strat['multi_meme_statut'].append(k)
  else: strat[f'deploye_{typ}'].append(k)
quota={'deploye_PA':8,'deploye_IM':6,'multi_meme_statut':3,'statut_cible':2,'statut_signe':2,'statut_en cours de deploiement':2,'statut_raccordable demande':3,'statut_rad en cours de deploiement':2,'ambigu':4,'indisponible':3,'impossible':6,'impossible_bis':3,'impossible_nouveau':3,'libelle':2}
random.seed(148)
ech=[]
for cat,q in quota.items():
  for k in random.sample(sorted(strat[cat]),q):
    b=ban[k]; lab=' '.join(x for x in [b['numero'],b['rep'],b['nom_voie'],b['code_postal'],b['nom_commune']] if x)
    ech.append(dict(strate=cat,ban_id=k,label=lab,lon=float(b['lon']),lat=float(b['lat']),type_position=b['type_position'],nom_ld=b['nom_ld']))
print({k:len(v) for k,v in strat.items()})
json.dump(ech,open(f'{S}/echantillon.json','w'),ensure_ascii=False,indent=1); print(len(ech))
