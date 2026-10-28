import sqlite3, struct
from shapely import wkb
def blob_to_geom(b):
    flags = b[3]; env = (flags >> 1) & 7
    n = {0:0,1:32,2:48,3:48,4:64}[env]
    return wkb.loads(bytes(b[8+n:]))
def lire(path, table, where="1=1", cols="ID,DEPT,SOURCE"):
    con = sqlite3.connect(f"file:{path}?mode=ro", uri=True)
    for row in con.execute(f"select geom,{cols} from {table} where {where}"):
        yield blob_to_geom(row[0]), row[1:]
