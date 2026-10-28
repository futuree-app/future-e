import sys,zlib,struct,collections,json,time
out=open(sys.argv[1],'w'); stats=collections.Counter(); etat=collections.Counter()
d=zlib.decompressobj(-15); buf=b''; head=b''; started=False; header=None; rest=b''; t0=time.time(); n=0
src=sys.stdin.buffer
# skip local header
h=src.read(30); nl,el=struct.unpack('<HH',h[26:30]); src.read(nl+el)
while True:
  chunk=src.read(1<<20)
  if not chunk: break
  data=rest+d.decompress(chunk)
  lines=data.split(b'\n'); rest=lines.pop()
  for l in lines:
    if header is None:
      header=l; out.write(l.decode()+'\n'); continue
    n+=1
    parts=l.split(b',')
    # code_insee is column 8 but nom_voie may contain commas? count
    if len(parts)!=20: stats['cols!=20']+=1
    ins=parts[8] if len(parts)==20 else b''
    etat[parts[12] if len(parts)==20 else b'?']+=1
    if ins.startswith(b'17'): out.write(l.decode('utf-8','replace')+'\n'); stats['17']+=1
print(json.dumps({'lignes':n,'stats':stats,'etat':{k.decode():v for k,v in etat.items()},'s':round(time.time()-t0)}),file=sys.stderr)
