import json, os
HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", "..", ".."))

def slim(src, dst):
    d = json.load(open(os.path.join(HERE, src), encoding="utf-8"))
    out = {i: {"c": v["cout_moyen"], "f": v["frequence"], "r": v["representativite"]}
           for i, v in d.items()}
    p = os.path.join(REPO, "data", dst)
    json.dump(out, open(p, "w", encoding="utf-8"), ensure_ascii=False)
    print("ecrit", dst, ":", len(out), "communes")

slim("onrn_secheresse_consolide.json", "onrn-secheresse.json")
slim("onrn_inondation_consolide.json", "onrn-inondation.json")
