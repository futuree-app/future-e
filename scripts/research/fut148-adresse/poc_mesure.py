import pickle,sys,csv,gzip,collections,re,unicodedata,json
S=sys.argv[1]; D=pickle.load(open(f'{S}/poc17.pkl','rb'))
imb,parAddr,cf,fo=D['imb'],D['parAddr'],D['cf'],D['fo']
C=collections.Counter
def norm(s):
  s=unicodedata.normalize('NFD',s or '').encode('ascii','ignore').decode().upper()
  return re.sub(r'[^A-Z0-9]+',' ',s).strip()
txt=collections.defaultdict(list)
for i,r in imb.items():
  if r['imb_source']=='fo' and r['addr_source']!='ban':
    txt[(r['addr_code_insee'],r['addr_numero'],(r['addr_rep'] or '').upper(),norm(r['addr_nom_voie']))].append(i)
def statut(ids):
  ipe=[imb[i] for i in ids if imb[i]['imb_source']=='fo']
  if not ipe: return ('indisponible','aucun immeuble fibre',None)
  st=set(cf.get(r['imb_code'],{}).get('imb_etat','?') for r in ipe)
  if len(st)==1 and '?' not in st: return ('fiable',f'{len(ipe)}',st.pop())
  return ('ambigu',f'{len(ipe)}',None)
ban={}
with gzip.open(f'{S}/ban/adresses-17.csv.gz','rt',encoding='utf-8') as f:
  for b in csv.DictReader(f,delimiter=';'):
    if b['id'] not in ban or b['type_position'] in ('logement','bâtiment','entrée'): ban[b['id']]=b
print('adresses BAN uniques',len(ban))
newfmt=lambda k: not re.match(r'^[0-9AB]{5}_[0-9A-Z]{4}_',k)
print('ids BAN nouveau format: BAN',sum(newfmt(k) for k in ban),'MCI addr_code ban',sum(newfmt(r['addr_code']) for r in imb.values() if r['addr_source']=='ban'))
res=C(); par=C(); stat=C()
for k,b in ban.items():
  if k in parAddr:
    cat,m,s=statut(parAddr[k]); rung='cle BAN'
  else:
    t=(b['code_insee'],b['numero'],(b['rep'] or '').upper(),norm(b['nom_voie']))
    if t in txt: cat,m,s=statut(txt[t]); rung='libelle identique'
    else: cat,m,s,rung='impossible','',None,'aucun'
  res[(cat,rung)]+=1; par[cat]+=1
  if s: stat[s]+=1
  par['nouveau format' if newfmt(k) and cat=='impossible' else '_']+=0
n=len(ban)
for k,v in sorted(res.items(), key=lambda kv:-kv[1]): print(k,v,f'{100*v/n:.2f} %')
print({k:f'{100*v/n:.2f} %' for k,v in par.items()}); print('statuts',stat)
imp_new=sum(1 for k in ban if k not in parAddr and newfmt(k)); print('impossibles au nouveau format',imp_new)
