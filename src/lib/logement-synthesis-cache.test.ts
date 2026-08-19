import test from "node:test";
import assert from "node:assert/strict";
import { buildCoverage, buildFactHash, buildSynthesisPayload, SYNTHESIS_PROMPT_VERSION } from "./logement-synthesis-cache.ts";

test("buildFactHash déterministe : mêmes faits -> même hash", () => {
  assert.equal(buildFactHash(fullData()), buildFactHash(fullData()));
});

test("buildFactHash porte la version du prompt en clair", () => {
  assert.equal(buildFactHash(fullData()).startsWith(`syn:${SYNTHESIS_PROMPT_VERSION}:`), true);
});

test("buildFactHash change si le DPE change", () => {
  const a = buildFactHash(fullData());
  const b = buildFactHash(fullData({ selectedDpe: { ...fullData().selectedDpe, etiquette_dpe: "F", conso_ep_m2: 400 } }));
  assert.notEqual(a, b);
});

test("buildFactHash NE change PAS avec l'« autour » (frontière de module)", () => {
  // CE TEST A ÉTÉ RETOURNÉ le 29/07/2026. Il vérifiait l'inverse : que l'arrivée tardive de
  // l'« autour » invalidait bien la synthèse figée (board critique 2a). Cette course a disparu
  // avec l'entourage lui-même, parti dans le module Autour de l'adresse. La propriété à tenir est
  // désormais la frontière : ce que le module Logement n'affiche pas n'entre pas dans son texte,
  // exactement comme irep/friches ci-dessous.
  const sansAutour = buildFactHash(fullData({ autour: null }));
  const avecAutour = buildFactHash(fullData());
  assert.equal(sansAutour, avecAutour);
});

test("buildFactHash NE change PAS avec la posture (jamais un fait)", () => {
  assert.equal(buildFactHash(fullData({ posture: "residence" })), buildFactHash(fullData({ posture: "prospection" })));
});

test("buildFactHash NE change PAS avec irep/friches (frontière Santé)", () => {
  assert.equal(buildFactHash(fullData({ irep: { count: 9 } })), buildFactHash(fullData({ irep: { count: 0 } })));
});

test("SYNTHESIS_PROMPT_VERSION exporté", () => {
  assert.equal(typeof SYNTHESIS_PROMPT_VERSION, "string");
});

function fullData(over = {}) {
  return {
    address: { label: "10 rue X, Lyon" },
    altitude: 170,
    dpeSelectionStatus: "user_confirmed",
    selectedDpe: {
      id_dpe: "X1", type_batiment: "appartement", methode_dpe: "dpe appartement individuel",
      confort_ete: "moyen", etiquette_dpe: "D", etiquette_ges: "D", conso_ep_m2: 250, emission_ges_m2: 30,
      surface_m2: 60, annee_construction: 1970, date_dpe: "2024-01-01", traversant: true,
      protection_solaire: null, ventilation: "VMC simple flux", inertie: "moyenne", isolation_toiture: null,
      brasseur_air: null, isolation_murs: "bonne", isolation_menuiseries: "moyenne",
      id_ban: null, adresse: null, etage: null, complement: null,
    },
    georisques: { parcel: { risks: { labels: ["sismicité modérée"] }, pprn: { labels: [] }, seismic: { label: "modérée" }, rga: { label: "exposition forte" } } },
    sinistralite: { secheresse: { coutMoyen: "10 000 à 20 000 €" } },
    irep: { count: 3 },
    cartofriches: { count: 2, friches: [{ sol_pollue: true }] },
    autour: { bpe: [{ category: "sante", nearest: { typeLabel: "Pharmacie", distanceMeters: 220 } }], osm: { nearestMappedGreenSpace: { kind: "park", distanceMeters: 300 } } },
    communeData: { commune: { nom: "Lyon", population: 500000 } },
    posture: "prospection",
    ...over,
  };
}

test("buildSynthesisPayload exclut autour/irep/friches/posture", () => {
  const p = buildSynthesisPayload(fullData());
  // L'entourage se lit dans son propre module : le texte Logement ne doit pas pouvoir le
  // commenter, puisque aucun bloc de cette page ne l'affiche sous lui.
  assert.equal("autour" in p, false);
  assert.equal("irep" in p, false);
  assert.equal("friches" in p, false);
  assert.equal("posture" in p, false);
});

test("buildSynthesisPayload exclut l'altitude : une donnée dont aucun usage n'est autorisé", () => {
  // TROIS SYNTHÈSES STOCKÉES, TROIS INFÉRENCES INTERDITES (capture du 11/08/2026, textes exacts
  // dans docs/audits/2026-08-11-syntheses-logement-fautives.md) :
  //
  //   « le bâti est bas : à 7,5 mètres d'altitude, les fondations sont proches d'un sol qui,
  //     selon les saisons, travaille »
  //   « l'altitude de 8 mètres environ n'éloigne pas le bien des contraintes de sol »
  //
  // Le prompt interdisait déjà cette déduction en toutes lettres (« L'altitude seule n'est pas un
  // phénomène, ne la transformez pas en signal »), et le payload transmettait la valeur quand
  // même. Une donnée fournie sans usage autorisé finit mobilisée : on donne rarement une
  // information inutile à quelqu'un, et le modèle le sait.
  //
  // L'altitude ne nourrit AUCUN fait, aucune règle, aucune preuve de ce module. La frontière
  // n'est donc pas une consigne mieux écrite, c'est l'absence de la donnée.
  const p = buildSynthesisPayload(fullData());
  assert.equal("altitude" in p, false);
});

test("buildFactHash change quand l'altitude sort du payload (les synthèses en cache se rejouent)", () => {
  // L'identité de cache dérive du payload : retirer un champ invalide les synthèses stockées, donc
  // les trois textes fautifs. C'est l'effet recherché, il est noté pour qu'il ne surprenne personne.
  assert.equal(buildFactHash(fullData({ altitude: 7.5 })), buildFactHash(fullData({ altitude: 812 })));
});

test("buildSynthesisPayload : confortEte sous verrou DPE confirmé", () => {
  const confirmed = buildSynthesisPayload(fullData());
  assert.ok(confirmed.confortEte, "confortEte présent si confirmé");
  const pending = buildSynthesisPayload(fullData({ dpeSelectionStatus: "selection_required" }));
  assert.equal(pending.confortEte, null);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// COUVERTURE DES DIMENSIONS (30/07/2026)
//
// Ce qui a rendu le défaut possible : le payload rendait `dpe: null` et `confortEte: null` aussi
// bien pour un logement sans diagnostic que pour un champ tu volontairement. Le prompt demandait,
// quand rien de marquant ne ressort, de « dire que l'adresse est calme ». Sur une adresse rurale
// sans diagnostic, la synthèse a donc conclu que l'adresse « ne portait pas d'enjeu structurant
// identifié », après quatre sections disant qu'on ne savait pas.
//
// Ces tests fixent ce que le modèle REÇOIT, jamais ce qu'il écrit. La formulation reste une
// consigne de prompt, non vérifiable ici. Ce qui est vérifiable, c'est que l'information sans
// laquelle aucune consigne ne peut tenir arrive bien jusqu'à lui.
// ════════════════════════════════════════════════════════════════════════════════════════════

test("couverture : toutes les sources répondent -> rien de non lu, clôture globale autorisée", () => {
  const c = buildCoverage(fullData());
  assert.equal(c.energie, "examined");
  assert.equal(c.confort_ete, "examined");
  assert.equal(c.exposition_adresse, "examined");
  assert.equal(c.sinistralite_communale, "examined");
  assert.deepEqual(c.non_lues, []);
});

test("couverture : aucun diagnostic -> énergie ET confort d'été non lus, ensemble", () => {
  // Les deux tombent d'un coup parce que le confort d'été DÉRIVE du diagnostic. C'est le cas du
  // Cros, à Anglards-de-Saint-Flour : deux sections muettes d'affilée, puis une clôture qui
  // affirmait le calme de l'adresse entière.
  const c = buildCoverage(fullData({ dpeSelectionStatus: "not_found", selectedDpe: null }));
  assert.equal(c.energie, "unexamined");
  assert.equal(c.confort_ete, "unexamined");
  assert.equal(c.non_lues.length, 2);
  assert.equal(c.non_lues[0], "la performance énergétique de ce logement");
});

test("couverture : diagnostic REFUSÉ par le lecteur -> non lu, comme s'il n'existait pas", () => {
  // `rejected` veut dire qu'aucun des diagnostics trouvés n'est celui de ce logement. Le tenir
  // pour examiné ferait conclure au calme sur une dimension que personne n'a lue.
  const c = buildCoverage(fullData({ dpeSelectionStatus: "rejected", selectedDpe: null }));
  assert.equal(c.energie, "unexamined");
});

test("couverture : un diagnostic NON CONFIRMÉ ne compte pas pour lu", () => {
  // Un candidat en attente de sélection n'est le diagnostic de personne. Même règle que le
  // payload, qui ne rend le DPE que sur `auto_confirmed` ou `user_confirmed`.
  const c = buildCoverage(fullData({ dpeSelectionStatus: "selection_required" }));
  assert.equal(c.energie, "unexamined");
  assert.equal(c.confort_ete, "unexamined");
});

test("couverture : un zonage VIDE est un résultat, pas une absence de lecture", () => {
  // La distinction qui manquait. Géorisques a répondu « aucune règle ici » : c'est examiné, et la
  // clôture a le droit de s'en servir. Une adresse sans contrainte n'est pas une adresse non lue.
  const c = buildCoverage(fullData({
    georisques: { parcel: { risks: { labels: [] }, pprn: { labels: [] }, seismic: { label: "faible" }, rga: { label: "exposition faible" } } },
  }));
  assert.equal(c.exposition_adresse, "examined");
  assert.equal(c.non_lues.includes("ce à quoi son adresse est exposée"), false);
});

test("couverture : aucune réponse de Géorisques -> exposition non lue", () => {
  const c = buildCoverage(fullData({ georisques: null }));
  assert.equal(c.exposition_adresse, "unexamined");
  assert.equal(c.non_lues.includes("ce à quoi son adresse est exposée"), true);
});

test("couverture : sinistralité absente -> non lue", () => {
  const c = buildCoverage(fullData({ sinistralite: null }));
  assert.equal(c.sinistralite_communale, "unexamined");
});

test("couverture : un signal défavorable n'efface pas une dimension non lue", () => {
  // Le cas mixte, celui qu'on rate le plus facilement : l'exposition est forte ET le diagnostic
  // manque. Les deux doivent survivre jusqu'au modèle, sinon la clôture nomme l'enjeu et tait
  // l'inconnue.
  const c = buildCoverage(fullData({
    dpeSelectionStatus: "not_found", selectedDpe: null,
    georisques: { parcel: { risks: { labels: ["inondation"] }, pprn: { labels: ["PPRI"] }, seismic: { label: "modérée" }, rga: { label: "exposition forte" } } },
  }));
  assert.equal(c.exposition_adresse, "examined");
  assert.equal(c.energie, "unexamined");
  assert.equal(c.non_lues.length, 2);
});

test("couverture : toutes les sources muettes -> les quatre dimensions non lues", () => {
  const c = buildCoverage(fullData({
    dpeSelectionStatus: "not_found", selectedDpe: null, georisques: null, sinistralite: null,
  }));
  assert.equal(c.non_lues.length, 4);
});

test("la couverture VOYAGE : elle entre dans le payload envoyé au modèle", () => {
  // Le piège gravé dans AGENTS.md : un paramètre branché au point de décision dont le TEXTE ne se
  // sert jamais. Les tests du dessus disent que la couverture est juste, celui-ci dit qu'elle
  // arrive.
  const p = buildSynthesisPayload(fullData({ dpeSelectionStatus: "not_found", selectedDpe: null }));
  assert.equal("couverture" in p, true);
  const c = p.couverture as { non_lues: string[] };
  assert.equal(c.non_lues.length, 2);
});

test("la couverture entre dans le HASH : un diagnostic qui arrive régénère la synthèse", () => {
  const sans = buildFactHash(fullData({ dpeSelectionStatus: "not_found", selectedDpe: null }));
  const avec = buildFactHash(fullData());
  assert.notEqual(sans, avec);
});

// ════════════════════════════════════════════════════════════════════════════════════════════
// LES DIAGNOSTICS DE L'ADRESSE (31/07/2026)
//
// Ils entrent dans le payload uniquement quand AUCUN n'est attribué. C'est ce qui permet au texte
// de dire qu'un document existe et se demande, au lieu de s'arrêter à « non qualifiée ». Ce qu'ils
// ne doivent JAMAIS permettre, c'est d'emprunter une valeur au logement voisin : d'où l'absence
// totale de valeurs individuelles dans ce qui traverse.
// ════════════════════════════════════════════════════════════════════════════════════════════

const voisins = [
  { ...fullData().selectedDpe, id_dpe: "V1", etiquette_dpe: "B", surface_m2: 22 },
  { ...fullData().selectedDpe, id_dpe: "V2", etiquette_dpe: "F", surface_m2: 88 },
  { ...fullData().selectedDpe, id_dpe: "V3", etiquette_dpe: "D", surface_m2: 45 },
];

test("diagnostics de l'adresse : ABSENTS dès qu'un diagnostic est attribué", () => {
  // Le logement a le sien : les voisins n'ont plus rien à dire, et les laisser passer offrirait au
  // modèle une comparaison qu'il n'a pas à faire.
  const p = buildSynthesisPayload(fullData({ dpeCandidates: voisins }));
  assert.equal(p.diagnostics_adresse, null);
});

test("diagnostics de l'adresse : PRÉSENTS quand rien n'est attribué", () => {
  const p = buildSynthesisPayload(fullData({
    dpeSelectionStatus: "selection_required", selectedDpe: null, dpeCandidates: voisins,
  }));
  assert.deepEqual(p.diagnostics_adresse, {
    total: 3, ecart_classes: "B à F", immeuble_entier: false,
  });
});

test("diagnostics de l'adresse : AUCUNE valeur individuelle ne traverse", () => {
  // La garde qui compte. Le modèle ne doit pas pouvoir citer l'étiquette d'un voisin, ni sa
  // surface, ni son identifiant : rien de ce qui décrirait un autre logement que celui-ci.
  const p = buildSynthesisPayload(fullData({
    dpeSelectionStatus: "rejected", selectedDpe: null, dpeCandidates: voisins,
  }));
  const brut = JSON.stringify(p.diagnostics_adresse);
  for (const interdit of ["V1", "V2", "V3", "22", "88", "45"]) {
    assert.equal(brut.includes(interdit), false, `« ${interdit} » ne doit pas traverser`);
  }
});

test("diagnostics de l'adresse : rien à dire quand l'adresse n'en porte aucun", () => {
  // Distinct du cas précédent : ici il n'y a aucun document à réclamer, et le prompt s'appuie sur
  // cette absence pour ne pas en inventer un.
  const p = buildSynthesisPayload(fullData({
    dpeSelectionStatus: "not_found", selectedDpe: null, dpeCandidates: [],
  }));
  assert.equal(p.diagnostics_adresse, null);
});

test("diagnostics de l'adresse : un diagnostic d'IMMEUBLE est signalé comme tel", () => {
  const p = buildSynthesisPayload(fullData({
    dpeSelectionStatus: "selection_required", selectedDpe: null,
    dpeCandidates: [...voisins, { ...voisins[0], id_dpe: "V4", methode_dpe: "dpe immeuble collectif" }],
  })) as { diagnostics_adresse: { immeuble_entier: boolean; total: number } };
  assert.equal(p.diagnostics_adresse.immeuble_entier, true);
  assert.equal(p.diagnostics_adresse.total, 4);
});

// ── UNE ABSENCE DE SINISTRE NE PART PAS AU MODÈLE SANS DE QUOI LA SITUER (17/08/2026, JL-13) ──

test("péril « aucun » sans compte d'arrêtés : il quitte le payload narratif", () => {
  const p = buildSynthesisPayload(fullData({
    sinistralite: { secheresse: { kind: "aucun" }, inondation: { kind: "aucun" } },
  }) as Parameters<typeof buildSynthesisPayload>[0]);
  assert.deepEqual(p.sinistralite, {});
});

test("cas Ciré-d'Aunis : l'absence d'inondation reste, accompagnée des arrêtés comptés", () => {
  const p = buildSynthesisPayload(fullData({
    sinistralite: { secheresse: { kind: "aucun" }, inondation: { kind: "aucun" } },
    catnatInondationCount: 5,
  }) as Parameters<typeof buildSynthesisPayload>[0]);
  assert.deepEqual(p.sinistralite, {
    inondation: {
      kind: "aucun_sinistre_indemnise",
      periode: "1995-2021",
      echantillon: "CCR, contrats assurés de la commune",
      arretes_catnat_inondation_depuis_1982: 5,
    },
  });
  // La sécheresse, elle, n'a pas d'historique administratif à lui opposer : elle sort.
  assert.equal("secheresse" in (p.sinistralite as object), false);
});

test("les états mesurés passent inchangés, et le hash des dossiers existants ne bouge pas", () => {
  // INVARIANT DE CACHE : sans péril en « aucun », le compte d'arrêtés n'entre pas dans le payload.
  // Sans quoi cette passe régénérerait toutes les synthèses déjà vendues, pour rien.
  const mesure = { secheresse: { kind: "lecture", cout: "Plus de 20 k€", frequence: "Entre 2 et 5 ‰", representativite: "> 50%" } };
  const sans = buildSynthesisPayload(fullData({ sinistralite: mesure }) as Parameters<typeof buildSynthesisPayload>[0]);
  const avec = buildSynthesisPayload(fullData({ sinistralite: mesure, catnatInondationCount: 5 }) as Parameters<typeof buildSynthesisPayload>[0]);
  assert.deepEqual(sans.sinistralite, mesure);
  assert.deepEqual(sans, avec);
  assert.equal(
    buildFactHash(fullData({ sinistralite: mesure }) as Parameters<typeof buildFactHash>[0]),
    buildFactHash(fullData({ sinistralite: mesure, catnatInondationCount: 5 }) as Parameters<typeof buildFactHash>[0]),
  );
});

test("la couverture reste « examinée » : on a bien regardé, on ne raconte pas", () => {
  const c = buildCoverage(fullData({ sinistralite: { inondation: { kind: "aucun" } } }) as Parameters<typeof buildCoverage>[0]);
  assert.equal(c.sinistralite_communale, "examined");
});
