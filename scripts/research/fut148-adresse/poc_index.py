# Index POC dept 17 : BAN key -> immeubles IPE -> statut cartefibre + offres FO (MCI). Pickle pour réutilisation.
import csv,gzip,collections,pickle,sys
S=sys.argv[1]
imb={}; parAddr=collections.defaultdict(list)
with gzip.open(f'{S}/mci/base_imb_17.csv.gz','rt',encoding='utf-8') as f:
  for r in csv.DictReader(f,delimiter=';'):
    imb[r['imb_id']]=r; parAddr[r['addr_code']].append(r['imb_id'])
fo=collections.defaultdict(set); best=collections.defaultdict(set)
with gzip.open(f'{S}/mci/actuel_17.csv.gz','rt') as f:
  for r in csv.DictReader(f,delimiter=';'):
    if r['code_techno']=='FO': fo[r['imb_id']].add(r['code_operateur'])
    best[r['imb_id']].add(r['code_techno'])
cf={}; dup=0
with open(f'{S}/imm/imm17.csv',encoding='utf-8') as f:
  for r in csv.DictReader(f):
    if r['imb_id'] in cf:
      dup+=1
      if cf[r['imb_id']]['imb_etat']!=r['imb_etat']: cf[r['imb_id']]['_conflit']=True
      continue
    cf[r['imb_id']]=r
pickle.dump(dict(imb=imb,parAddr=dict(parAddr),fo=dict(fo),techs=dict(best),cf=cf),open(f'{S}/poc17.pkl','wb'))
print('doublons cartefibre',dup,'conflits',sum(1 for r in cf.values() if r.get('_conflit')))
