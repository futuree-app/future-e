import test from "node:test";
import assert from "node:assert/strict";
import {
  construireLectureInondation, zonageInondationDepuisPlans, ligneOnrnInondation,
  lignePerilSansSinistre, ONRN_PERIODE, type EntreeLectureInondation, type LectureInondation,
} from "./inondation-lecture.ts";
import { catnatInondationDepuisCompte } from "./catnat-evidence.ts";
import type { PerilState } from "../onrn-sinistralite.ts";

// ── LE CAS RÉEL, tel que le dépôt le reproduit le 17/08/2026 ──────────────────────────────────
// Adresse testée par Julien et Lisa à Ciré-d'Aunis (17107), premier test utilisateur réel :
//   • Géorisques ne renvoie aucun plan de prévention zonant le point ;
//   • `data/comparateur-index.json.gz` : inondation.catnat = 5 ;
//   • `data/onrn-inondation.json` : « Pas de sinistre répertorié à CCR » -> kind "aucun".
// Aucune donnée personnelle n'entre ici : le code INSEE et les valeurs publiques de la commune
// suffisent à rejouer la contradiction.
const CIRE: EntreeLectureInondation = {
  zonage: { kind: "aucun_zonage" },
  catnat: catnatInondationDepuisCompte(5, "17107"),
  onrn: { kind: "aucun" },
};

/** Tout ce que l'écran affiche à partir d'une lecture, en un seul texte : c'est ça qu'on relit. */
function toutLeTexte(l: LectureInondation): string {
  return [
    ...l.constats.flatMap((c) => [c.entete, c.periode ?? "", c.enonce, c.source]),
    l.reconciliation,
    l.limite,
  ].join(" ");
}

test("Ciré-d'Aunis : les trois lectures sont rendues, dans l'ordre point puis commune", () => {
  const l = construireLectureInondation(CIRE);
  assert.ok(l, "la carte doit exister : trois sources déterminées, cinq arrêtés comptés");
  assert.deepEqual(l.constats.map((c) => c.cle), ["zonage_point", "catnat_commune", "onrn_assurance"]);
});

test("Ciré-d'Aunis : la carte ne conclut à aucune absence de risque", () => {
  const t = toutLeTexte(construireLectureInondation(CIRE)!);
  // Les formulations que le lecteur a cru lire, et qu'aucun chemin ne doit pouvoir produire.
  for (const interdit of [
    "aucun risque", "pas de risque", "sans risque", "aucune exposition",
    "n'est pas exposé", "n'est pas exposée", "à l'abri", "rien à signaler",
  ]) {
    assert.equal(t.toLowerCase().includes(interdit), false, `formulation interdite : « ${interdit} »`);
  }
});

test("Ciré-d'Aunis : l'absence de sinistre ONRN n'est jamais isolée de l'historique GASPAR", () => {
  const l = construireLectureInondation(CIRE)!;
  const onrn = l.constats.find((c) => c.cle === "onrn_assurance")!;
  // Le constat lui-même est borné par sa période ET par son échantillon : il ne dit pas
  // « aucun sinistre d'inondation » tout court.
  assert.match(onrn.enonce, /1995-2021/);
  assert.match(onrn.enonce, /échantillon/);
  // Et la réconciliation, produite par le MÊME objet, rappelle le compte d'arrêtés et refuse de
  // conclure. Ces deux phrases ne peuvent pas être séparées : elles sortent du même appel.
  assert.match(l.reconciliation, /ne permet pas de conclure à l'absence d'événement ou de risque/);
  assert.match(l.reconciliation, /5 arrêtés de catastrophe naturelle inondation depuis 1982/);
});

test("Ciré-d'Aunis : le compte affiché est celui de la preuve du dossier, mot pour mot", () => {
  // Régression du défaut « le lecteur clique sur 7 et lit 23 » : la phrase vient de
  // `catnat-evidence`, jamais réécrite ici.
  const l = construireLectureInondation(CIRE)!;
  const catnat = l.constats.find((c) => c.cle === "catnat_commune")!;
  assert.match(catnat.enonce, /^La commune compte 5 arrêtés de catastrophe naturelle inondation depuis 1982\./);
  assert.match(catnat.source, /submersion marine exclue/);
  assert.equal(catnat.periode, "depuis 1982");
});

test("chaque constat dit son grain, sa période et son objet AVANT son résultat", () => {
  const l = construireLectureInondation(CIRE)!;
  const parCle = Object.fromEntries(l.constats.map((c) => [c.cle, c]));
  assert.equal(parCle.zonage_point.entete, "Au point de l'adresse · zonage réglementaire");
  assert.equal(parCle.zonage_point.periode, null); // un zonage est actuel, il n'a pas de fenêtre
  assert.equal(parCle.catnat_commune.entete, "Dans la commune · reconnaissances de catastrophe naturelle");
  assert.equal(parCle.onrn_assurance.entete, "Dans la commune · sinistres indemnisés par les assurances");
  assert.equal(parCle.onrn_assurance.periode, ONRN_PERIODE);
  for (const c of l.constats) assert.ok(c.source.length > 0, `${c.cle} doit citer sa source`);
});

test("l'absence de zonage dit ce qu'un zonage est, sinon « aucun » se lit « rien à craindre »", () => {
  const l = construireLectureInondation(CIRE)!;
  const z = l.constats.find((c) => c.cle === "zonage_point")!;
  assert.match(z.enonce, /encadre la construction, il ne mesure pas ce que le lieu peut connaître/);
  assert.equal(z.signal, false);
});

test("la limite distingue le grain du point de celui de la commune", () => {
  const l = construireLectureInondation(CIRE)!;
  assert.match(l.limite, /Seul le zonage est lu au point de l'adresse/);
  assert.match(l.limite, /portent sur la commune entière/);
});

// ── LES VARIANTES ─────────────────────────────────────────────────────────────────────────────

test("trois absences bien lues ne fabriquent pas une carte de plus", () => {
  const l = construireLectureInondation({
    zonage: { kind: "aucun_zonage" },
    catnat: catnatInondationDepuisCompte(0, "12345"),
    onrn: { kind: "aucun" },
  });
  assert.equal(l, null);
});

test("aucun arrêté MAIS des indemnisations : la carte se rend quand même", () => {
  // Arbitrage porteur du 17/08/2026 : la tension existe aussi dans ce sens.
  const l = construireLectureInondation({
    zonage: { kind: "aucun_zonage" },
    catnat: catnatInondationDepuisCompte(0, "12345"),
    onrn: { kind: "lecture", cout: "Entre 0 et 2,5 k€", frequence: "Entre 1 et 2 ‰", representativite: "> 50%" },
  });
  assert.ok(l);
  assert.match(l.reconciliation, /tous les dégâts d'eau n'en relèvent pas/);
});

test("une faible représentativité reste un signal : la carte se rend", () => {
  const l = construireLectureInondation({
    zonage: { kind: "aucun_zonage" },
    catnat: catnatInondationDepuisCompte(0, "12345"),
    onrn: { kind: "faible_repr", representativite: "< 15%" },
  });
  assert.ok(l);
  assert.match(
    l.constats.find((c) => c.cle === "onrn_assurance")!.enonce,
    /trop peu de biens y sont assurés dans l'échantillon/,
  );
});

test("données indisponibles : une seule source déterminée ne s'ordonne pas", () => {
  assert.equal(
    construireLectureInondation({
      zonage: { kind: "indisponible" }, catnat: null, onrn: { kind: "aucun" },
    }),
    null,
  );
  assert.equal(
    construireLectureInondation({
      zonage: { kind: "indisponible" }, catnat: catnatInondationDepuisCompte(5), onrn: { kind: "indispo" },
    }),
    null,
  );
});

test("compte d'arrêtés inconnu : deux lectures, et la phrase s'accorde", () => {
  const l = construireLectureInondation({
    zonage: { kind: "zone_inondation", plans: ["PPRI de la Charente"] },
    catnat: null,
    onrn: { kind: "aucun" },
  })!;
  assert.equal(l.constats.length, 2);
  assert.match(l.reconciliation, /^Ces deux lectures ne mesurent pas la même chose/);
  // Sans compte d'arrêtés, on ne prétend pas en citer un.
  assert.equal(l.reconciliation.includes("arrêté"), false);
});

test("un zonage inondation au point est énoncé comme un fait, avec le nom du plan", () => {
  const l = construireLectureInondation({
    zonage: { kind: "zone_inondation", plans: ["PPRI de la Charente"] },
    catnat: catnatInondationDepuisCompte(5),
    onrn: { kind: "aucun" },
  })!;
  const z = l.constats.find((c) => c.cle === "zonage_point")!;
  assert.match(z.enonce, /Un plan de prévention du risque inondation réglemente ce point : PPRI de la Charente\./);
  assert.equal(z.signal, true);
});

test("un plan d'un autre aléa ne devient pas une absence de plan", () => {
  const l = construireLectureInondation({
    zonage: { kind: "zonage_autre" },
    catnat: catnatInondationDepuisCompte(5),
    onrn: { kind: "aucun" },
  })!;
  assert.match(
    l.constats.find((c) => c.cle === "zonage_point")!.enonce,
    /D'autres plans de prévention s'y appliquent, pour d'autres phénomènes/,
  );
});

// ── LE FILTRE D'ALÉA, sur la forme réelle des plans Géorisques ─────────────────────────────────

test("le zonage inondation se lit sur le modèle de procédure, et sur le nom en repli", () => {
  assert.equal(zonageInondationDepuisPlans(null).kind, "indisponible");
  assert.equal(zonageInondationDepuisPlans([]).kind, "aucun_zonage");
  assert.equal(
    zonageInondationDepuisPlans([{ plan: "PPRN argiles", hazardModel: "PPRN-RGA" }]).kind,
    "zonage_autre",
  );
  assert.equal(
    zonageInondationDepuisPlans([{ plan: null, hazardModel: "PPRN-I" }]).kind,
    "zone_inondation",
  );
  assert.equal(
    zonageInondationDepuisPlans([{ plan: null, hazardModel: "PPRN-SM" }]).kind,
    "zone_inondation",
  );
  // Modèle non renseigné : le nom du plan reste une preuve d'aléa.
  const parNom = zonageInondationDepuisPlans([{ plan: "PPRI du Val de Loire", hazardModel: null }]);
  assert.equal(parNom.kind, "zone_inondation");
  assert.deepEqual(parNom.kind === "zone_inondation" ? parNom.plans : [], ["PPRI du Val de Loire"]);
});

// ── LA LIGNE DE LA CARTE « SINISTRES INDEMNISÉS » ─────────────────────────────────────────────

test("la ligne ONRN ne dit jamais « aucun sinistre d'inondation » tout court", () => {
  const seule = ligneOnrnInondation({ kind: "aucun" }, false)!;
  assert.equal(seule.valeur, "Aucun sinistre indemnisé recensé");
  assert.match(seule.precision, /1995-2021/);
  assert.match(seule.precision, /ne permet pas de conclure à l'absence d'événement ou de risque/);

  // Avec la carte au-dessus, la borne reste (période + échantillon) ; la réconciliation, elle,
  // n'est pas répétée à trente centimètres d'elle-même.
  const avec = ligneOnrnInondation({ kind: "aucun" }, true)!;
  assert.match(avec.precision, /échantillon de contrats assurés, 1995-2021/);
  assert.equal(avec.precision.includes("risque"), false);

  // Les autres états ne passent pas par cette ligne : la carte les rend avec leurs classes.
  assert.equal(ligneOnrnInondation({ kind: "indispo" }, true), null);
  assert.equal(ligneOnrnInondation({ kind: "faible_repr", representativite: "< 15%" }, true), null);
});

test("la sécheresse perd elle aussi son absolu : la période et l'échantillon sont nommés", () => {
  const l = lignePerilSansSinistre();
  assert.match(l.precision, /1995-2021/);
  assert.match(l.precision, /échantillon de contrats assurés/);
  assert.equal(l.precision.includes("période connue"), false);
});

// ── LA GARANTIE TRANSVERSE ────────────────────────────────────────────────────────────────────

test("aucune combinaison d'entrées ne produit une conclusion rassurante", () => {
  const zonages = [
    { kind: "aucun_zonage" }, { kind: "zonage_autre" }, { kind: "indisponible" },
    { kind: "zone_inondation", plans: ["PPRI test"] },
  ] as const;
  const catnats = [null, catnatInondationDepuisCompte(0), catnatInondationDepuisCompte(1), catnatInondationDepuisCompte(5)];
  const onrns: PerilState[] = [
    { kind: "indispo" }, { kind: "aucun" }, { kind: "faible_repr", representativite: "< 15%" },
    { kind: "lecture", cout: "Plus de 20 k€", frequence: "Plus de 10 ‰", representativite: "> 50%" },
  ];
  let rendues = 0;
  for (const zonage of zonages) for (const catnat of catnats) for (const onrn of onrns) {
    const l = construireLectureInondation({ zonage, catnat, onrn });
    if (!l) continue;
    rendues++;
    const t = toutLeTexte(l).toLowerCase();
    for (const interdit of ["aucun risque", "pas de risque", "sans risque", "aucune exposition", "à l'abri"]) {
      assert.equal(t.includes(interdit), false, `« ${interdit} » dans : ${t}`);
    }
    // Une absence ONRN sans sa borne n'existe pas.
    if (onrn.kind === "aucun") {
      assert.match(l.reconciliation, /ne permet pas de conclure à l'absence d'événement ou de risque/);
    }
    // Un compte d'arrêtés positif est toujours énoncé quelque part.
    if (catnat && catnat.count > 0) assert.ok(t.includes("depuis 1982"));
  }
  assert.ok(rendues > 20, `couverture insuffisante : ${rendues} lectures rendues`);
});

test("« PPRIF » (feux de forêt) n'entre pas par la porte du repli sur le nom", () => {
  assert.equal(
    zonageInondationDepuisPlans([{ plan: "PPRIF du massif des Maures", hazardModel: "PPRN-F" }]).kind,
    "zonage_autre",
  );
});
