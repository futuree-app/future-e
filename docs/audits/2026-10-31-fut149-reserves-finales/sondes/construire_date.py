# FUT-149, 31/10/2026 · § 3 : lance le VRAI `construire.py` en faisant croire à Python qu'on est un autre jour
# (seul `datetime.date.today()` est remplacé), pour comparer deux constructions faites à des dates différentes.
#   python -I construire_date.py <construire.py> <AAAA-MM-JJ> <arguments de construire.py…>
import datetime as dt, importlib.util, sys

chemin, jour = sys.argv[1], dt.date.fromisoformat(sys.argv[2])


class Jour(dt.date):
    @classmethod
    def today(cls):
        return jour


spec = importlib.util.spec_from_file_location("construire", chemin)
c = importlib.util.module_from_spec(spec)
spec.loader.exec_module(c)
c.dt = type("dt", (), {"date": Jour, "datetime": dt.datetime})
sys.argv = [chemin] + sys.argv[3:]
c.main()
