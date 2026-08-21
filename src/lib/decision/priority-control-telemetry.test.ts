import test from "node:test";
import assert from "node:assert/strict";
import { GESTES } from "./logement-gestes.ts";
import {
  sujetDuControle, typeDeGeste, proprietesAffichage, proprietesActivation,
} from "./priority-control-telemetry.ts";

test("le code INSEE ne part pas dans l'événement", () => {
  assert.equal(sujetDuControle("31555:composition-argiles-ppr"), "composition-argiles-ppr");
  assert.equal(sujetDuControle("exposition-bati"), "exposition-bati");
  assert.equal(sujetDuControle("logement.dpe-faible"), "logement.dpe-faible");
});

test("LA CORSE AUSSI : un code commune n'est pas toujours cinq chiffres", () => {
  // Le filtre d'origine cherchait `^\d{5}:`. Ajaccio (2A004) et Bastia (2B033) le traversaient
  // intacts, c'est-à-dire exactement les communes où un code identifie le plus étroitement.
  assert.equal(sujetDuControle("2A004:composition-argiles-ppr"), "composition-argiles-ppr");
  assert.equal(sujetDuControle("2B033:exposition-bati"), "exposition-bati");
});

test("UN PRÉFIXE D'UNE FORME NON PRÉVUE EST RETIRÉ AUSSI", () => {
  // La garantie ne peut pas dépendre de la liste des formats qu'on a imaginés. Tout ce qui précède
  // le premier « : » part, y compris un identifiant de dossier ou un code à venir.
  assert.equal(sujetDuControle("97105:vie-locale"), "vie-locale");
  assert.equal(sujetDuControle("f7b2c1d0-1111-2222-3333-444455556666:cavite"), "cavite");
  assert.equal(sujetDuControle("dep31:cavite"), "cavite");
});

test("AUCUN SUJET SORTANT NE PORTE DE PRÉFIXE D'IDENTITÉ", () => {
  // L'invariant tel qu'il est écrit dans l'en-tête du module, vérifié sur la sortie des deux
  // constructeurs d'événements plutôt que sur la fonction seule.
  const anchors = ["31555:x", "2A004:x", "2B033:x", "97105:x", "abcd:x", "sans-prefixe"];
  const props = proprietesAffichage(anchors.map((anchorId) => ({ label: "Regardez", anchorId })), "priorite", 0);
  for (const sujet of props.sujets as string[]) {
    assert.doesNotMatch(sujet, /:/, `« ${sujet} » porte encore un préfixe`);
  }
  assert.deepEqual(props.sujets, ["x", "x", "x", "x", "x", "sans-prefixe"]);
});

test("le type de geste vient du verbe, pour les quatre coûts distincts", () => {
  assert.equal(typeDeGeste("Demandez au bailleur l'état des risques"), "demander");
  assert.equal(typeDeGeste("Regardez les signes visibles sur le bâti"), "regarder");
  assert.equal(typeDeGeste("Consultez le règlement de la zone en mairie"), "consulter");
  assert.equal(typeDeGeste("Faites chiffrer les travaux d'amélioration"), "faire_faire");
  assert.equal(typeDeGeste("Vérifier sur place"), "autre");
});

test("TOUS les gestes du module sont classés, aucun ne tombe en « autre »", () => {
  // Si un geste nouveau n'entre dans aucun type, la mesure devient muette sur lui sans que rien ne
  // le dise. Le test le fait dire ici, au moment où le geste est écrit.
  for (const [key, geste] of Object.entries(GESTES)) {
    for (const [bucket, copy] of Object.entries(geste)) {
      if (!copy.label) continue;
      assert.notEqual(typeDeGeste(copy.label), "autre", `${key}.${bucket} : « ${copy.label} » non classé`);
    }
  }
});

test("l'événement d'affichage ne transporte aucun libellé rédigé", () => {
  const props = proprietesAffichage(
    [
      { label: "Demandez au bailleur l'état des risques", anchorId: "17107:composition-argiles-ppr" },
      { label: "Regardez les signes visibles sur le bâti", anchorId: "exposition-bati" },
    ],
    "priorite", 1,
  );
  const serialise = JSON.stringify(props);
  assert.doesNotMatch(serialise, /bailleur|bâti visible|Regardez|Demandez/);
  assert.doesNotMatch(serialise, /\b\d{5}:/); // ni code commune
  assert.deepEqual(props.types, ["demander", "regarder"]);
  assert.deepEqual(props.sujets, ["composition-argiles-ppr", "exposition-bati"]);
  assert.equal(props.actions_count, 2);
  assert.equal(props.actions_liees, 1);
  assert.equal(props.ordre, "priorite");
});

test("l'événement d'activation dit la position, jamais l'adresse", () => {
  const props = proprietesActivation(
    { label: "Faites chiffrer les travaux d'amélioration", anchorId: "31555:logement.dpe-faible" }, 1, "ensuite",
  );
  assert.deepEqual(props, { ordre: "ensuite", position: 1, sujet: "logement.dpe-faible", type: "faire_faire" });
});
