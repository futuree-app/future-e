"""Contre-lecture indépendante DBF/XLSX. Aucun import du code métier de la PR."""
import hashlib,json,struct,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
from collections import Counter
ROOT=Path(__file__).resolve().parents[3]
TABLE=json.loads((ROOT/'data/arcep-fibre.json').read_text())
CACHE=Path('/tmp/review105-source')
NS={'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
sha={}
for key,name in [('fichierCommune','communes.zip'),('observatoire','observatoire.xlsx')]:
 b=(CACHE/name).read_bytes();sha[name]=hashlib.sha256(b).hexdigest();assert sha[name]==TABLE['meta'][key]['sha256']
z=zipfile.ZipFile(CACHE/'communes.zip');names=[n for n in z.namelist() if n.lower().endswith('.dbf')];assert len(names)==1
b=z.read(names[0]);n,header,length=struct.unpack_from('<IHH',b,4);fields=[];offset=32
while b[offset]!=13:
 f=b[offset:offset+32];fields.append((f[:11].split(b'\0')[0].decode('latin1'),f[16]));offset+=32
rows={}
for i in range(n):
 rec=b[header+i*length:header+(i+1)*length]
 if rec[:1]==b'*':continue
 p=1;r={}
 for name,size in fields:r[name]=rec[p:p+size].decode('latin1').strip();p+=size
 code=r['INSEE_COM'];assert code not in rows;rows[code]=r
z=zipfile.ZipFile(CACHE/'observatoire.xlsx');strings=[]
for _,e in ET.iterparse(z.open('xl/sharedStrings.xml'),events=['end']):
 if e.tag.endswith('}si'):
  strings.append(''.join(t.text or '' for t in e.iter() if t.tag.endswith('}t')));e.clear()
rels={e.attrib['Id']:e.attrib['Target'] for e in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
sheets={e.attrib['name']:rels[e.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']] for e in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS)}
def cells(sheet):
 for _,e in ET.iterparse(z.open('xl/'+sheets[sheet]),events=['end']):
  if e.tag.endswith('}row'):
   row={}
   for c in e:
    ref=c.attrib['r'];col=''.join(x for x in ref if x.isalpha());v=c.find('m:v',NS)
    value=v.text if v is not None else ''.join(t.text or '' for t in c.iter() if t.tag.endswith('}t'))
    if c.attrib.get('t')=='s':value=strings[int(value)]
    row[col]=value
   yield row;e.clear()
obs={}
for sheet,key in [('Communes','Code commune'),('Arrondissements','Code arrondissement')]:
 it=cells(sheet)
 for row in it:
  if key in row.values():header={v:k for k,v in row.items()};break
 for r in it:
  code=r.get(header[key]);
  if code:
   assert code not in obs
   obs[code]={'locaux':float(r[header['Meilleure estimation des locaux T2 2026']]),'ftth':float(r[header['T2 2026']]),'source':r[header['Source retenue T2 2026']]}
assert len(rows)==34919
mismatches=[];classes=[];obs_diffs=[];insee_count=0
for code,r in rows.items():
 l=float(r['Locaux']);f=int(float(r['ftth']));den='insee' if obs[code]['source'].strip().upper()=='INSEE' else 'ipe'
 if den=='insee':insee_count+=1
 expect_class=0 if f==0 else 5 if f/l<.1 else 10 if f/l<.25 else 25 if f/l<.5 else 50 if f/l<.8 else 80 if f/l<.95 else 95
 if l>0 and int(float(r['couv']))!=expect_class:classes.append(code)
 if abs(obs[code]['locaux']-l)>.5 or obs[code]['ftth']!=f:obs_diffs.append({'code':code,'commune':[l,f],'classeur':obs[code]})
 if code in TABLE['discordantes']:continue
 actual=TABLE['communes'].get(code)
 if actual is None or abs(actual[0]-l)>.000051 or actual[1]!=f or actual[2]!=den:mismatches.append(code)
assert not mismatches,mismatches
assert not classes,classes
assert len(TABLE['communes'])==34918
assert list(TABLE['discordantes'])==['54524']
assert {x['code'] for x in obs_diffs}=={'54524','54254'}
assert sum(int(float(r['ftth'])) for r in rows.values())==TABLE['meta']['national']['raccordables']
assert round(sum(float(r['Locaux']) for r in rows.values()))==TABLE['meta']['national']['locaux']
selection={c:{'nom':rows[c]['NOM_COM'],'commune':[float(rows[c]['Locaux']),int(float(rows[c]['ftth']))],'classeur':obs[c]} for c in ['63072','63163','63179','26274','15138','29016','54524','54254','55039','75101','69389','13216']}
plm={}
for parent,prefix,a,b in [('75056','751',1,20),('69123','6938',1,9),('13055','132',1,16)]:
 codes=[prefix+str(i).zfill(2 if prefix!='6938' else 1) for i in range(a,b+1)]
 l=sum(float(rows[c]['Locaux']) for c in codes);f=sum(int(float(rows[c]['ftth'])) for c in codes)
 assert abs(l-obs[parent]['locaux'])<.5 and f==obs[parent]['ftth'];plm[parent]=[l,f]
summary={'sha256':sha,'dbf_records':len(rows),'published_rows':len(TABLE['communes']),'row_mismatches':mismatches,'class_mismatches':classes,'insee_count_raw':insee_count,'insee_count_published':sum(r[2]=='insee' for r in TABLE['communes'].values()),'national':TABLE['meta']['national'],'discrepancies':obs_diffs,'selection':selection,'PLM':plm}
output=ROOT/'docs/rapports-agents/revue/2026-10-28-pr105-sources-controle.json';output.write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n');print(json.dumps(summary,ensure_ascii=False,indent=2))
