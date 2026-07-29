import test from "node:test";
import assert from "node:assert/strict";
import { decideTerritoryAccess, decidePaidTerritory, type TerritoryClaim } from "./territory-claims.ts";

const NANTES = "44109";

test("aucune revendication : ni accès ni acquisition", () => {
  assert.equal(decideTerritoryAccess([], NANTES), false);
  assert.equal(decidePaidTerritory([], NANTES), false);
});

test("un grant ouvre le territoire ET vaut acquisition (tout grant naît du webhook)", () => {
  const claims: TerritoryClaim[] = [{ kind: "grant", insee: NANTES }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), true);
});

test("un dossier PAYÉ ouvre le territoire et vaut acquisition", () => {
  const claims: TerritoryClaim[] = [{ kind: "dossier", insee: NANTES, paid: true }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), true);
});

test("un dossier ADMINISTRATIF ouvre le territoire mais n'est JAMAIS une acquisition", () => {
  // Sinon créer un dossier de test à Nantes offrirait le tarif d'approfondissement sur tous les
  // biens nantais, alors que rien n'a été encaissé.
  const claims: TerritoryClaim[] = [{ kind: "dossier", insee: NANTES, paid: false }];
  assert.equal(decideTerritoryAccess(claims, NANTES), true);
  assert.equal(decidePaidTerritory(claims, NANTES), false);
});

test("une revendication sur une AUTRE commune ne donne rien", () => {
  const claims: TerritoryClaim[] = [{ kind: "grant", insee: "75056" }];
  assert.equal(decideTerritoryAccess(claims, NANTES), false);
  assert.equal(decidePaidTerritory(claims, NANTES), false);
});

test("PLM : un dossier sur l'arrondissement vaut pour la commune, et réciproquement", () => {
  // L'adresse est géocodée sur l'arrondissement (69386), la commune est stockée sur 69123.
  // Comparer sans communeParent() refuserait un droit réellement acquis.
  const surArrondissement: TerritoryClaim[] = [{ kind: "dossier", insee: "69386", paid: true }];
  assert.equal(decideTerritoryAccess(surArrondissement, "69123"), true);
  assert.equal(decidePaidTerritory(surArrondissement, "69386"), true);

  const surCommune: TerritoryClaim[] = [{ kind: "grant", insee: "69123" }];
  assert.equal(decideTerritoryAccess(surCommune, "69386"), true);
});

test("un dossier administratif ne masque pas un dossier payé dans la même commune", () => {
  // L'ordre des revendications ne doit jamais décider : `some` cherche une preuve, il ne s'arrête
  // pas au premier élément qui échoue.
  const claims: TerritoryClaim[] = [
    { kind: "dossier", insee: NANTES, paid: false },
    { kind: "dossier", insee: NANTES, paid: true },
  ];
  assert.equal(decidePaidTerritory(claims, NANTES), true);
});
