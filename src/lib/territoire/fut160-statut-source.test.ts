// FUT-160 · LE SNAPSHOT TERRITOIRE DIT « SOURCE INDISPONIBLE » QUAND GÉORISQUES TOMBE, ET PLUS « MANQUANT ».
//
// Pendant l'incident du 24 au 28/10/2026, quatre snapshots enregistraient `risk.georisques` et `risk.catnat`
// `missing`, le statut d'une donnée non collectée. VigiEau, dans le même cas, enregistrait déjà
// `source_unavailable`. Ces tests fixent les trois statuts, et vérifient que l'écran et la synthèse lisent
// une panne exactement comme avant : aucune valeur, jamais un zéro.
import test from "node:test";
import assert from "node:assert/strict";
import { buildTerritoireSnapshot, type TerritoireInputs } from "./facts.ts";
import { factOf, synthesisFacts, valueOf } from "../facts/contract.ts";
import { withHash } from "../facts/hash.ts";
import { screenFromSnapshot } from "./screen.ts";
import { projectForSynthesis } from "./synthesis-contract.ts";
import { deterministicSynthesis } from "./synthesis-deterministe.ts";
import { chatelaillonInputs } from "./__fixtures__/chatelaillon.ts";

const T0 = "2026-10-28T16:32:00.000Z";
const snap = (i: TerritoireInputs) => withHash(buildTerritoireSnapshot(i, T0));
const statut = (i: TerritoireInputs, cle: string) => factOf(buildTerritoireSnapshot(i, T0), cle)?.status;

const enPanne = (): TerritoireInputs => ({
  ...chatelaillonInputs(), georisques: null, catnat: null, georisquesIndisponible: true, catnatIndisponible: true,
});

test("Géorisques en panne : les deux faits passent `source_unavailable`, sans valeur", () => {
  const s = buildTerritoireSnapshot(enPanne(), T0);
  for (const cle of ["risk.georisques", "risk.catnat"]) {
    assert.equal(factOf(s, cle)?.status, "source_unavailable", cle);
    assert.equal(factOf(s, cle)?.value, null, cle);
    assert.equal(valueOf(s, cle), null, cle);
  }
});

test("une seule lecture en panne : l'autre garde sa valeur", () => {
  const i = { ...chatelaillonInputs(), catnat: null, catnatIndisponible: true };
  assert.equal(statut(i, "risk.catnat"), "source_unavailable");
  assert.equal(statut(i, "risk.georisques"), "ok");
});

test("non collecté (aucune panne déclarée) : `missing`, comme avant", () => {
  const i = { ...chatelaillonInputs(), georisques: null, catnat: null };
  assert.equal(statut(i, "risk.georisques"), "missing");
  assert.equal(statut(i, "risk.catnat"), "missing");
});

test("absence valide dans une source lue : `ok`, avec sa valeur (aucun risque recensé, zéro arrêté)", () => {
  const base = chatelaillonInputs();
  const i: TerritoireInputs = {
    ...base,
    georisques: { ...base.georisques!, riskLabels: [], flags: { ...base.georisques!.flags, flood: false, marineSubmersion: false } },
    catnat: { ...base.catnat!, total: 0, byRisk: [], byDecade: [] },
    georisquesIndisponible: false, catnatIndisponible: false,
  };
  const s = buildTerritoireSnapshot(i, T0);
  assert.equal(factOf(s, "risk.georisques")?.status, "ok");
  assert.deepEqual(valueOf(s, "risk.georisques"), { flood: false, marineSubmersion: false });
  assert.equal(factOf(s, "risk.catnat")?.status, "ok");
  assert.equal(valueOf<{ total: number }>(s, "risk.catnat")?.total, 0);
});

test("retour du service : faits `ok`, nouvelle empreinte, l'empreinte de la panne reste la sienne", () => {
  const panne = snap(enPanne());
  const retour = snap(chatelaillonInputs());
  assert.equal(factOf(retour, "risk.georisques")?.status, "ok");
  assert.equal(factOf(retour, "risk.catnat")?.status, "ok");
  // Le snapshot est rangé sous son empreinte, sans écrasement (`ignoreDuplicates`) : la photo de la panne et
  // celle du retour sont deux lignes, la première reste lisible telle qu'elle a été prise.
  assert.notEqual(panne.hash, retour.hash);
  assert.equal(snap(enPanne()).hash, panne.hash);
});

test("écran et synthèse : une panne se lit exactement comme un fait manquant, jamais comme zéro", () => {
  const panne = buildTerritoireSnapshot(enPanne(), T0);
  const manquant = buildTerritoireSnapshot({ ...chatelaillonInputs(), georisques: null, catnat: null }, T0);
  assert.deepEqual(screenFromSnapshot(panne), screenFromSnapshot(manquant));
  assert.equal(screenFromSnapshot(panne).catnat, null);
  for (const cle of ["risk.georisques", "risk.catnat"]) {
    assert.ok(!synthesisFacts(panne).facts.some((f) => f.key === cle), `${cle} n'atteint pas la synthèse`);
  }
  assert.deepEqual(projectForSynthesis(panne, "gwl20"), projectForSynthesis(manquant, "gwl20"));
  assert.equal(deterministicSynthesis(projectForSynthesis(panne, "gwl20"), "gwl20"), deterministicSynthesis(projectForSynthesis(manquant, "gwl20"), "gwl20"));
});
