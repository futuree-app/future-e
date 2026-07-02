import openpyxl, csv, json
from collections import Counter

BASE = "/private/tmp/claude-501/-Users-quentinbrache-Desktop-Futur-e/04eed2eb-fb5a-4ff6-8f48-076dc7f8bb96/scratchpad/"
REPO = "/Users/quentinbrache/Desktop/Futur·e/"

def read_sheet(fname, sheet):
    wb = openpyxl.load_workbook(BASE + fname, read_only=True, data_only=True); ws = wb[sheet]
    rows=[]
    for i,r in enumerate(ws.iter_rows(values_only=True)):
        if i==0: continue
        insee,name,val=r[0],r[1],r[2]
        if insee is None: continue
        rows.append((str(insee).strip(),(name or "").strip(), val.strip() if isinstance(val,str) else val))
    wb.close(); return rows

def is_no(v): return isinstance(v,str) and v.startswith("Pas de sinistre") or (isinstance(v,str) and v.startswith("Pas de sinistre ou"))

# ---------- sources ----------
cout_rows = read_sheet("ONRN_CoutMoyen_SECH_9521.xlsx", "Coût moy. sinistres")   # (name,val) en INSEE desc, colA cassé
rep_rows  = read_sheet("ONRN_CoutMoyen_SECH_9521.xlsx", "Représentativité")        # trusted INSEE->name/repr
freq_rows = read_sheet("ONRN_Frequence_SECH_9521.xlsx", "Fréq. moy. sinistres")    # supposé sain
sp_rows   = read_sheet("onrn_sp_sech.xlsx", "SsurP")                                # supposé sain

colA = set(i for i,_,_ in cout_rows)   # métropole (34839)
seen=set(); trust=[]
for i,n,v in rep_rows:
    if i in seen or i not in colA: continue
    seen.add(i); trust.append((i,n,v))
insee_name = {i:n for i,n,v in trust}
insee_repr = {i:v for i,n,v in trust}

# ---------- 1. cross-validation officielle ----------
official={}
with open(REPO+"data/communes-france-coords.csv", encoding="utf-8") as f:
    for row in csv.DictReader(f):
        official[row["insee_code"].strip()] = row["commune_name"].strip()
in_official = [i for i in insee_name if i in official]
name_match  = [i for i in in_official if official[i]==insee_name[i]]
not_in_off  = [i for i in insee_name if i not in official]
print(f"[CROSS-VALID] INSEE ONRN présents dans réf officielle: {len(in_official)}/{len(insee_name)}")
print(f"  nom identique: {len(name_match)}/{len(in_official)} ({100*len(name_match)/len(in_official):.2f}%)")
print(f"  INSEE ONRN absents de la réf officielle (fusions/2021): {len(not_in_off)}")
# montrer quelques diffs de nom
diffs=[(i,insee_name[i],official[i]) for i in in_official if official[i]!=insee_name[i]][:12]
for d in diffs: print("   diff:", d)

# ---------- 2. Fréquence & S/P sains ? (INSEE<->nom == trust) ----------
def check_aligned(rows, label):
    d={}; mism=0; extra_dom=0
    for i,n,v in rows:
        if i not in colA:  # DOM ou hors périmètre
            extra_dom+=1; continue
        d[i]=(n,v)
        if i in insee_name and insee_name[i]!=n: mism+=1
    print(f"[{label}] lignes métropole: {len(d)} ; hors-métropole ignorées: {extra_dom} ; noms != trust: {mism}")
    return {i:v for i,(n,v) in d.items()}
freq = check_aligned(freq_rows, "Fréquence")
sp   = check_aligned(sp_rows,   "S/P")

# ---------- 3. reconstruction coût (INSEE desc) ----------
h1 = sorted(trust, key=lambda t:t[0], reverse=True)
assert len(h1)==len(cout_rows)
cout = {}
name_mm=0
for (i_t,n_t,_),(iA,n_c,c) in zip(h1,cout_rows):
    if n_t!=n_c: name_mm+=1
    cout[i_t]=c
assert name_mm==0, f"name mismatch {name_mm}"

# ---------- 4. intégrité croisée des couplages no<->no ----------
def norm_no(v): return isinstance(v,str) and v.startswith("Pas de sinistre")
def couple(a,b):
    ok=sum(1 for i in colA if norm_no(a.get(i))==norm_no(b.get(i)) )
    return ok,len(colA)
for lab,(A,B) in {"coût~représ":(cout,insee_repr),"fréq~représ":(freq,insee_repr),
                  "S/P~représ":(sp,insee_repr),"coût~fréq":(cout,freq)}.items():
    ok,tot=couple(A,B); print(f"[couplage {lab}] {ok}/{tot} = {100*ok/tot:.3f}%")

# ---------- 5. livrables ----------
# 5a. CSV corrigé de la feuille coût (INSEE croissant)
with open(BASE+"ONRN_CoutMoyen_SECH_corrige.csv","w",encoding="utf-8",newline="") as f:
    w=csv.writer(f); w.writerow(["code_insee","commune","cout_moyen_secheresse"])
    for i in sorted(colA):
        w.writerow([i, insee_name[i], cout[i]])
# 5b. dataset consolidé JSON
consol={}
for i in sorted(colA):
    consol[i]={"nom":insee_name[i],
               "cout_moyen":cout[i],
               "frequence":freq.get(i),
               "representativite":insee_repr[i]}
json.dump(consol, open(BASE+"onrn_secheresse_consolide.json","w"), ensure_ascii=False, indent=0)
print(f"\nLivrables écrits: ONRN_CoutMoyen_SECH_corrige.csv ({len(colA)} lignes), onrn_secheresse_consolide.json")

# distribution des classes de coût (contrôle de plausibilité)
print("\n[Distribution coût moyen sécheresse reconstruit]")
for k,c in Counter(cout.values()).most_common():
    print(f"  {c:6d}  {k}")
