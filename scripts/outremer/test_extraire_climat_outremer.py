"""FUT-104 · L'extraction SocleOM échoue clairement sur une archive incohérente, au lieu d'écrire un fichier
apparemment exploitable. Archives NetCDF synthétiques, une par défaut.

    python3 -P -m unittest scripts/outremer/test_extraire_climat_outremer.py
"""
import datetime as dt
import importlib.util
import os
import tarfile
import tempfile
import unittest

import netCDF4
import numpy as np

ICI = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("extraction", os.path.join(ICI, "extraire_climat_outremer.py"))
X = importlib.util.module_from_spec(spec)
spec.loader.exec_module(X)

LAT = np.array([-21.0, -20.975])
LON = np.array([55.4, 55.425])


def nc(chemin, var, valeur, unite="C", bornes=("1991-01-01", "2020-12-31"), lat=LAT, lon=LON):
    d = netCDF4.Dataset(chemin, "w")
    d.createDimension("time", 1); d.createDimension("lat", len(lat)); d.createDimension("lon", len(lon)); d.createDimension("bounds", 2)
    d.createVariable("lat", "f8", ("lat",))[:] = lat
    d.createVariable("lon", "f8", ("lon",))[:] = lon
    tb = d.createVariable("time_bounds", "i8", ("time", "bounds"))
    base = dt.date(1991, 1, 1)
    tb.units = "days since 1991-01-01 00:00:00"
    tb[0, :] = [(dt.date.fromisoformat(b) - base).days for b in bornes]
    v = d.createVariable(var, "f4", ("time", "lat", "lon"), fill_value=np.float32(np.nan))
    v.units = unite
    v.long_name = var
    v[0, :, :] = np.full((len(lat), len(lon)), valeur, dtype="f4")
    d.close()


class Extraction(unittest.TestCase):
    def setUp(self):
        self.dir = tempfile.mkdtemp()
        self.sauve = (X.INDICATEURS, X.NIVEAUX, X.TERRITOIRES, X.LACUNES_CONNUES)
        X.INDICATEURS = {"TMm": {"libelle": "T", "unite": "°C", "familles": {"R"}},
                         "TX31D": {"libelle": "J", "unite": "jours", "familles": {"R"}}}
        X.NIVEAUX = {"Test": {1.5: "2030", 2.0: "2050", 2.9: "2100"}}
        X.TERRITOIRES = {"999": {"id": "test", "zones": ["Test"], "famille": "R"}}
        X.LACUNES_CONNUES = set()

    def tearDown(self):
        X.INDICATEURS, X.NIVEAUX, X.TERRITOIRES, X.LACUNES_CONNUES = self.sauve

    def archive(self, nom, fichiers):
        """fichiers : [(indicateur, période « 1991-2020 » ou « RWL-20 », nature None/ANOMd, kwargs de nc)]"""
        chemin = os.path.join(self.dir, nom)
        with tarfile.open(chemin, "w") as t:
            for ind, per, anom, kw in fichiers:
                n = f"{ind}_yr_{per}_TIMEavg_{anom + '-1991-2020_' if anom else ''}GEOxy_FR-Test_SocleOM-Climat-2025_MF-CDFt_ssp585_ENSq50.nc"
                p = os.path.join(self.dir, n)
                bornes = kw.pop("bornes", ("1991-01-01", "2020-12-31") if per == "1991-2020" else ("2200-01-01", "2200-12-31"))
                nc(p, ind, kw.pop("valeur", 20.0), bornes=bornes, **kw)
                t.add(p, arcname=n)
        return chemin, {"cle": nom, "taille": os.path.getsize(chemin), "etag": "x", "sha256": "x", "mis_en_ligne": "x"}

    def zone_complete(self, sauf=(), extra=(), niveaux=("RWL-15", "RWL-20", "RWL-29"), unite_tx="day"):
        fichiers = []
        for ind, u in (("TMm", "C"), ("TX31D", unite_tx)):
            if (ind, "ref") not in sauf:
                fichiers.append((ind, "1991-2020", None, {"unite": u}))
            for n in niveaux:
                if (ind, n, "valeur") not in sauf:
                    fichiers.append((ind, n, None, {"unite": u}))
                if (ind, n, "ecart") not in sauf:
                    fichiers.append((ind, n, "ANOMd", {"unite": u, "valeur": 1.0}))
        z = X.Zone("Test")
        z.ajouter(*self.archive("RWL20.tar", fichiers + list(extra)))
        return z

    def test_zone_coherente_acceptee(self):
        X.valider_zone(self.zone_complete())

    def test_nom_d_archive_trompeur_mais_contenu_juste(self):
        # Mayotte : l'archive « RWL20 » contient les fichiers RWL-15. Seul le contenu compte.
        X.valider_zone(self.zone_complete())

    def test_niveau_hors_table_tracc(self):
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete(niveaux=("RWL-15", "RWL-25", "RWL-29")))

    def test_reference_hors_1991_2020(self):
        with self.assertRaises(SystemExit):
            z = X.Zone("Test")
            z.ajouter(*self.archive("h.tar", [("TMm", "1991-2020", None, {"bornes": ("1976-01-01", "2005-12-31")})]))

    def test_unite_kelvin(self):
        with self.assertRaises(SystemExit):
            z = X.Zone("Test")
            z.ajouter(*self.archive("k.tar", [("TMm", "1991-2020", None, {"unite": "K"})]))
            X.valider_zone(z)

    def test_unite_de_jours_inattendue(self):
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete(unite_tx="%"))

    def test_valeur_sans_ecart(self):
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete(sauf={("TX31D", "RWL-20", "ecart")}))

    def test_niveau_partiel(self):
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete(sauf={("TX31D", "RWL-20", "ecart"), ("TX31D", "RWL-20", "valeur")}))

    def test_reference_absente_non_declaree(self):
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete(sauf={("TX31D", "ref")}))

    def test_reference_absente_declaree(self):
        X.LACUNES_CONNUES = {("Test", "TX31D", "reference")}
        X.valider_zone(self.zone_complete(sauf={("TX31D", "ref")}))

    def test_lacune_declaree_mais_publiee(self):
        X.LACUNES_CONNUES = {("Test", "TX31D", "reference")}
        with self.assertRaises(SystemExit):
            X.valider_zone(self.zone_complete())

    def test_grille_differente(self):
        with self.assertRaises(SystemExit):
            self.zone_complete(extra=[("TX31D", "1991-2020", None, {"lat": LAT + 1, "unite": "day"})])

    def test_doublon_contradictoire(self):
        z = self.zone_complete()
        with self.assertRaises(SystemExit):
            z.ajouter(*self.archive("bis.tar", [("TMm", "1991-2020", None, {"valeur": 25.0})]))


if __name__ == "__main__":
    unittest.main()
