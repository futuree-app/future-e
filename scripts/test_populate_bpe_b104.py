"""FUT-99 : tests du vrai producteur, avec petits parquets synthétiques."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
import pyarrow as pa
import pyarrow.parquet as pq

spec = importlib.util.spec_from_file_location('bpe', Path(__file__).with_name('populate-bpe.py'))
bpe = importlib.util.module_from_spec(spec)
spec.loader.exec_module(bpe)

class B104Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)

    def source(self, rows):
        defaults = dict(TYPEQU='B104', LATITUDE=46.17, LONGITUDE=-1.12,
                        NOMRS='MAGASIN', SIRET='123', STATUT_DIFFUSION='O',
                        NUMVOIE='1', INDREP='', TYPVOIE='RUE', LIBVOIE='TEST',
                        CODPOS='17000', LIBCOM='LA ROCHELLE', AN='2025', APET='4711F')
        # Column names are the production schema, not assumed aliases.
        defaults[bpe.COL_LAT] = defaults.pop('LATITUDE')
        defaults[bpe.COL_LON] = defaults.pop('LONGITUDE')
        p = self.root / 'source.parquet'
        pq.write_table(pa.Table.from_pylist([{**defaults, **r} for r in rows]), p)
        return str(p)

    def test_selection_and_deduplication(self):
        p = self.source([{}, {'SIRET':'456'}, {'APET':'4719A'}, {'APET':None},
                         {bpe.COL_LAT:None}, {'TYPEQU':'B105'}])
        points = [p for s in bpe.build_face3_shards(p).values() for p in s['points']]
        self.assertEqual([p['t'] for p in points], ['B104', 'B105'])
        self.assertEqual(points[0]['c'], 'alimentation')
        self.assertEqual(points[0]['x'], 2)
        self.assertNotIn('n', points[0])

    def test_private_identity_is_removed_even_with_coordinates(self):
        p = self.source([{'STATUT_DIFFUSION':'P'}])
        point = next(iter(bpe.build_face3_shards(p).values()))['points'][0]
        self.assertEqual(set(point), {'c', 't', 'lat', 'lon'})

    def test_unknown_status_and_mixed_extract_rejected(self):
        with self.assertRaises(ValueError):
            bpe.build_face3_shards(self.source([{'STATUT_DIFFUSION':''}]))
        with self.assertRaises(ValueError):
            bpe.build_face3_shards(self.source([{'TYPEQU':'B105'}]), b104_only=True)

    def test_append_preserves_existing_and_is_idempotent(self):
        p = self.source([{}, {'SIRET':'456'}])
        shard = next(iter(bpe.build_face3_shards(p).values()))
        dest = self.root / 'dest'
        dest.mkdir()
        file = dest / (shard['cell'] + '.json')
        oldpoint = {'c':'alimentation','t':'B105','lat':46.17,'lon':-1.12}
        file.write_text(json.dumps({**shard, 'points':[oldpoint]}))
        self.assertEqual(bpe.append_b104(p, str(dest), str(dest)), 1)
        data = json.loads(file.read_text())
        self.assertEqual(data['points'][1:], [oldpoint])
        original = file.read_bytes()
        self.assertEqual(bpe.append_b104(p, str(dest), str(dest)), 0)
        self.assertEqual(file.read_bytes(), original)
        data['millesime'] = '2024'
        file.write_text(json.dumps(data))
        with self.assertRaises(ValueError):
            bpe.append_b104(p, str(dest), str(dest))

if __name__ == '__main__':
    unittest.main()
