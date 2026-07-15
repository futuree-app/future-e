import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

// INVARIANT (spec §9) : un échec de tuile OSM doit PROPAGER hors de load_osm (l'orchestrateur qui boucle et
// écrit), donc aucun cache partiel n'est jamais produit. C'est ce qui autorise le dossier à lire un
// reseauLocal null comme « sous plancher » plutôt que « non lu ». On monkeypatch fetch_tile pour lever, puis
// on vérifie que load_osm lève à son tour.
test("load_osm PROPAGE l'échec d'une tuile (aucun cache partiel)", () => {
  const py = `
import importlib.util, os, tempfile
spec = importlib.util.spec_from_file_location("p", "scripts/populate-reseau-local.py")
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
def boom(*a, **k):
    raise RuntimeError("tuile Overpass échouée")
m.fetch_tile = boom
m.OSM_TILE_DIR = os.path.join(tempfile.gettempdir(), "osm-tiles-test-" + str(os.getpid()))
try:
    m.load_osm(refresh=True)
    print("NO_RAISE")
except RuntimeError:
    print("RAISED")
`;
  const bin = existsSync(".venv-bpe/bin/python") ? ".venv-bpe/bin/python" : "python3";
  const out = execFileSync(bin, ["-c", py], { encoding: "utf8" }).trim();
  assert.match(out, /RAISED/);
});
