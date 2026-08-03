import test from "node:test";
import assert from "node:assert/strict";
import { buildAutourConclusion, distanceFr, SEUIL_A_PIED_M } from "./autour-conclusion.ts";
import type { Face3Cat, Face3Snapshot, PermisSnapshot } from "../logement-autour-types.ts";

function cat(c: Face3Cat, m: number | null, typeLabel: string | null = null, cap = 3000) {
  return { category: c, nearest: m == null ? null : { distanceMeters: m, typeLabel }, searchCapMeters: cap };
}

function snap(categories: ReturnType<typeof cat>[], bpe: "complete" | "failed" = "complete"): Face3Snapshot {
  return {
    center: { lng: 0, lat: 0 },
    bpe: { categories },
    osm: { potentiallyNoisyInfrastructure: [], nearestMappedGreenSpace: null, bboxRadiusMeters: 1000 },
    sourceStatus: { bpe, osmInfrastructure: "complete", osmGreenSpaces: "complete" },
    sources: { bpeVersion: "BPE24", osmFetchedAt: null, osmQueryVersion: "v1" },
    sourcesVersion: "v1",
    computedAt: "2026-07-31T00:00:00.000Z",
  } as Face3Snapshot;
}

/**
 * Un snapshot de permis GELÉ. Le rayon est un paramètre, jamais la constante : c'est exactement ce
 * que les tests doivent pouvoir faire varier pour prouver qu'un dossier ancien décrit le périmètre
 * qui l'a réellement sélectionné.
 */
function permis(
  liste: { annee: number; etat: "acheve" | "chantier_ouvert" | "autorise_non_commence" }[],
  rayonMeters = 50,
): PermisSnapshot {
  return {
    permis: liste,
    rayonMeters,
    ancienneteMaxAns: 3,
    anneeReference: 2026,
    consulteLe: "2026-08-01T00:00:00.000Z",
  };
}

// Le cas réel relevé au Capitole le 31/07/2026.
const CAPITOLE = [
  cat("sante", 68, "Pharmacie"),
  cat("alimentation", 120, "Boulangerie"),
  cat("education", 287, "École maternelle"),
  cat("transports", 1200, "Gare"),
  cat("services", 28, "Banque"),
];

/** Le Capitole, avec un registre des permis consulté. `undefined` veut dire NON consulté. */
function snapAvecPermis(p: PermisSnapshot | undefined, bpe: "complete" | "failed" = "complete"): Face3Snapshot {
  return { ...snap(CAPITOLE, bpe), ...(p ? { permis: p } : {}) };
}

// ── Ne rien conclure quand on n'a pas pu regarder ───────────────────────────────────────────

test("source BPE en échec : AUCUNE conclusion", () => {
  // « Rien à proximité » et « on n'a pas pu regarder » sont deux affirmations différentes, et la
  // seconde ne se déduit jamais de la première. Même règle que la couverture du Logement.
  assert.equal(buildAutourConclusion(snap(CAPITOLE, "failed")), null);
});

test("aucune catégorie examinée : aucune conclusion", () => {
  assert.equal(buildAutourConclusion(snap([])), null);
});

// ── Le cas ordinaire ───────────────────────────────────────────────────────────────────────

test("le lead compte ce qui est à portée de pas et NOMME la convention", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.lead.includes("Sur les 5 repères"), c.lead);
  assert.ok(c.lead.includes("4 sont"), c.lead);
  assert.ok(c.lead.includes(`${SEUIL_A_PIED_M} m`), "le seuil est dit, jamais caché");
  assert.ok(c.lead.includes("vol d'oiseau"), "la nature de la mesure est dite");
});

test("les repères proches sont nommés du plus proche au plus éloigné", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  const i = (s: string) => c.lead.indexOf(s);
  assert.ok(i("une banque") < i("une pharmacie"), "28 m avant 68 m");
  assert.ok(i("une pharmacie") < i("une boulangerie"), "68 m avant 120 m");
  assert.ok(i("une boulangerie") < i("une école maternelle"), "120 m avant 287 m");
});

test("le plus ÉLOIGNÉ est nommé : c'est lui qui décidera d'un déplacement", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.lead.includes("Le plus éloigné est une gare, à 1,2 km"), c.lead);
});

test("quand TOUT est à portée de pas, aucune phrase sur un éloignement", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 68, "Pharmacie"), cat("alimentation", 120, "Boulangerie"),
    cat("services", 28, "Banque"),
  ]))!;
  assert.equal(c.lead.includes("Le plus éloigné"), false, c.lead);
  assert.ok(c.lead.includes("Sur les 3 repères du quotidien examinés, 3 sont"), c.lead);
});

// ── Le cas rural ───────────────────────────────────────────────────────────────────────────

test("rien à 500 m : le plus proche fixe l'échelle, pour ne pas laisser imaginer le désert", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 2400, "Pharmacie"), cat("alimentation", 850, "Épicerie"),
    cat("education", null), cat("transports", null), cat("services", 3000, "Bureau de poste"),
  ]))!;
  assert.ok(c.lead.startsWith("Aucun des 5 repères"), c.lead);
  assert.ok(c.lead.includes("Le plus proche est une épicerie, à 850 m"), c.lead);
});

test("les absences sont dites séparément, avec le périmètre cherché", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", 300, "Pharmacie"),
    cat("education", null, null, 3000),
    cat("transports", null, null, 3000),
  ]))!;
  assert.equal(c.absences.length, 2);
  assert.ok(c.absences[0].includes("Aucune école"), c.absences[0]);
  assert.ok(c.absences[0].includes("3,0 km analysés"), c.absences[0]);
});

test("aucun repère nulle part : le lead porte sur l'absence, sans inventer un plus proche", () => {
  const c = buildAutourConclusion(snap([
    cat("sante", null), cat("alimentation", null), cat("education", null),
  ]))!;
  assert.ok(c.lead.includes("Aucun des 3 repères"), c.lead);
  assert.equal(c.lead.includes("Le plus proche"), false, "il n'y en a pas");
  assert.equal(c.absences.length, 3);
});

// ── Ce que la conclusion ne fait jamais ────────────────────────────────────────────────────

test("AUCUN jugement, AUCUNE note : l'ADR-0001 interdit la note composite", () => {
  // Un adjectif de qualité serait une note déguisée. On décrit une configuration, le lecteur juge.
  const interdits = /bien desservi|mal desservi|excellent|médiocre|idéal|attractif|de qualité|score|note/i;
  for (const jeu of [
    CAPITOLE,
    [cat("sante", 2400, "Pharmacie"), cat("education", null)],
    [cat("sante", null), cat("alimentation", null)],
  ]) {
    const c = buildAutourConclusion(snap(jeu))!;
    const tout = [c.lead, ...c.absences, c.limite].join(" ");
    assert.equal(interdits.test(tout), false, tout);
  }
});

test("la limite est TOUJOURS dite : présence n'est pas qualité", () => {
  const c = buildAutourConclusion(snap(CAPITOLE))!;
  assert.ok(c.limite.includes("jamais la qualité"), c.limite);
  assert.ok(c.limite.includes("vol d'oiseau"), c.limite);
});

// ── Formatage ──────────────────────────────────────────────────────────────────────────────

test("les distances se lisent : mètres sous le kilomètre, virgule décimale au-delà", () => {
  assert.equal(distanceFr(68), "68 m");
  assert.equal(distanceFr(999), "999 m");
  assert.equal(distanceFr(1000), "1,0 km");
  assert.equal(distanceFr(1200), "1,2 km");
  assert.equal(distanceFr(3000), "3,0 km");
  assert.equal(distanceFr(1200).includes("."), false, "jamais de point décimal");
});

test("un type inconnu de la nomenclature ne casse pas la phrase", () => {
  const c = buildAutourConclusion(snap([cat("services", 100, "Déchèterie intercommunale")]))!;
  assert.ok(c.lead.includes("un déchèterie intercommunale") || c.lead.includes("une déchèterie intercommunale"), c.lead);
});

test("sans type précis, la famille prend le relais", () => {
  const c = buildAutourConclusion(snap([cat("education", 200, null)]))!;
  assert.ok(c.lead.includes("une école"), c.lead);
});

// ── La charnière temporelle des permis : le silence d'abord ─────────────────────────────────

test("registre NON CONSULTÉ : aucune charnière", () => {
  // Un dossier antérieur au 01/08/2026, ou une API muette. Le bloc des permis disparaît pour cette
  // raison, et la conclusion doit se taire pour la même : un registre non consulté ne se lit jamais
  // comme un voisinage stable.
  const c = buildAutourConclusion(snapAvecPermis(undefined));
  assert.equal(c?.mouvement, null);
});

test("consulté, RIEN trouvé : aucune charnière", () => {
  // L'absence est déjà dite par le bloc au-dessus, bornée par le périmètre et l'objet du registre.
  // La répéter coûterait une phrase sur trois dossiers sur quatre pour ne rien ajouter.
  const c = buildAutourConclusion(snapAvecPermis(permis([])));
  assert.equal(c?.mouvement, null);
});

test("QUE DES ACHEVÉS : aucune charnière", () => {
  // Un achevé ne signale plus une transformation à venir au moment de l'analyse. Il reste dans le
  // bloc factuel, il n'entre pas dans la charnière temporelle. Ce que le registre établit de lui
  // s'arrête là : une autorisation sélectionnée est passée à l'état achevé, et rien n'assure que
  // son effet soit visible à la visite.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2024, etat: "acheve" },
    { annee: 2023, etat: "acheve" },
  ])));
  assert.equal(c?.mouvement, null);
});

test("BPE en échec : pas de conclusion du tout, même avec un chantier ouvert", () => {
  // « Cette configuration peut encore changer » n'a pas de référent quand aucune configuration n'a
  // été décrite. L'information n'est pas perdue : le bloc des permis reste affiché au-dessus.
  const s = snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }]), "failed");
  assert.equal(buildAutourConclusion(s), null);
});

// ── Les deux formes ────────────────────────────────────────────────────────────────────────
//
// Deux, et non cinq. Les cinq premières disaient le nombre, le rayon, l'objet du registre et
// l'année ; lues À L'ÉCRAN sous la carte des permis, elles en étaient une seconde version. Ne
// reste ici que ce que la carte ne fait pas : dire lequel des deux degrés de certitude s'applique.

test("un chantier déclaré ouvert : le changement est ENGAGÉ", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : au moins un chantier est déclaré ouvert.",
  );
});

test("aucun chantier ouvert : le changement n'est qu'AUTORISÉ", () => {
  // Une autorisation sans chantier peut ne jamais commencer : « encore » le porte sans le promettre.
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2024, etat: "autorise_non_commence" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : aucune ouverture de chantier n'est déclarée.",
  );
});

test("le NOMBRE ne change pas la phrase : un ou dix disent la même chose", () => {
  // Le dénombrement est dans la carte du dessus. Le répéter ici serait de l'inventaire.
  const un = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }])));
  const dix = buildAutourConclusion(snapAvecPermis(permis(
    Array.from({ length: 10 }, () => ({ annee: 2025, etat: "chantier_ouvert" as const })),
  )));
  assert.equal(un?.mouvement, dix?.mouvement);
});

test("états MIXTES : un seul chantier ouvert suffit à engager", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2023, etat: "acheve" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : au moins un chantier est déclaré ouvert.",
  );
});

test("un ACHEVÉ ne compte pas comme un chantier ouvert", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "acheve" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : aucune ouverture de chantier n'est déclarée.",
  );
});

const JEUX = [
  [{ annee: 2025, etat: "chantier_ouvert" as const }],
  [{ annee: 2024, etat: "autorise_non_commence" as const }],
  [{ annee: 2025, etat: "chantier_ouvert" as const }, { annee: 2024, etat: "autorise_non_commence" as const }],
];

// ── Les verrous de doctrine ─────────────────────────────────────────────────────────────────

test("AUCUNE TRANSFORMATION TENUE POUR ACQUISE : une autorisation n'est pas un bâtiment", () => {
  // Le nom compte : la charnière parle bel et bien d'un possible futur (« peut encore changer »).
  // Ce que ce verrou interdit, c'est d'affirmer une conséquence, de la dater ou de la qualifier.
  //
  // LES LIMITES DE MOT NE SONT PAS OPTIONNELLES. Cherché en sous-chaîne, « va » frappe « travaux »
  // et « évaluation », deux mots parfaitement légitimes ici : le test échouerait sur une phrase
  // juste, et finirait désarmé plutôt que corrigé.
  const INTERDITS = [/\bva\b/i, /\bvont\b/i, /\bsera\b/i, /\bfutur/i, /\bd'ici\b/i, /\bdens/i, /\bprévu/i];
  for (const liste of [
    [{ annee: 2025, etat: "chantier_ouvert" as const }],
    [{ annee: 2024, etat: "autorise_non_commence" as const }],
    [{ annee: 2025, etat: "chantier_ouvert" as const }, { annee: 2024, etat: "autorise_non_commence" as const }],
  ]) {
    const m = buildAutourConclusion(snapAvecPermis(permis(liste)))?.mouvement ?? "";
    for (const interdit of INTERDITS) {
      assert.ok(!interdit.test(m), `« ${interdit} » trouvé dans : ${m}`);
    }
  }
});

test("AUCUN CHIFFRE, ET AUCUNE TOURNURE DE LA CARTE", () => {
  // Premier garde-fou : ce que la phrase ne doit pas CONTENIR. Le rayon, l'année et le nombre sont
  // dans la carte rendue juste au-dessus ; les redire ici a été essayé, vu à l'écran le 01/08/2026,
  // et rejeté.
  //
  // Un test sur les seuls chiffres serait un proxy : une redite peut revenir en toutes lettres. On
  // interdit donc AUSSI les tournures propres à la carte, celles par lesquelles la répétition
  // reviendrait sans qu'aucun chiffre n'apparaisse.
  const TOURNURES = [/à moins de/i, /déposé/i, /logements/i, /recens/i, /parcelle/i, /\bm\b|mètres/i];
  for (const liste of JEUX) {
    for (const rayon of [50, 80]) {
      const m = buildAutourConclusion(snapAvecPermis(permis(liste, rayon)))?.mouvement ?? "";
      assert.ok(!/\d/.test(m), `un chiffre a reparu dans : ${m}`);
      for (const t of TOURNURES) {
        assert.ok(!t.test(m), `une tournure de la carte a reparu (${t}) dans : ${m}`);
      }
    }
  }
});

test("LA PHRASE NE DÉPEND QUE DE L'ENGAGEMENT, de rien d'autre", () => {
  // Second garde-fou, et le plus fort : au lieu de lister ce que la phrase ne doit pas contenir, on
  // vérifie CE DONT ELLE DÉPEND. Rayon, année et nombre de dossiers peuvent varier autant qu'ils
  // veulent, la phrase ne bouge pas ; seule la présence d'au moins un chantier ouvert la change.
  const phrase = (liste, rayon = 50) =>
    buildAutourConclusion(snapAvecPermis(permis(liste, rayon)))?.mouvement;

  const ouvert = { annee: 2025, etat: "chantier_ouvert" as const };
  const dormant = { annee: 2024, etat: "autorise_non_commence" as const };

  // Invariance : rayon, année, nombre, et présence d'achevés.
  assert.equal(phrase([ouvert], 50), phrase([ouvert], 80), "le rayon ne doit rien changer");
  assert.equal(
    phrase([{ annee: 2023, etat: "chantier_ouvert" }]),
    phrase([{ annee: 2026, etat: "chantier_ouvert" }]),
    "l'année ne doit rien changer",
  );
  assert.equal(phrase([ouvert]), phrase([ouvert, ouvert, ouvert]), "le nombre ne doit rien changer");
  assert.equal(
    phrase([dormant]),
    phrase([dormant, { annee: 2023, etat: "acheve" }]),
    "un achevé ne doit rien changer",
  );

  // Dépendance : l'engagement, et lui seul, fait varier la phrase.
  assert.notEqual(phrase([ouvert]), phrase([dormant]), "l'engagement DOIT changer la phrase");
  assert.equal(phrase([ouvert, dormant]), phrase([ouvert]), "un seul ouvert suffit à engager");
});

test("AUCUNE ATTENTE IMPLICITE : une autorisation peut n'être jamais suivie de travaux", () => {
  // « Pas encore » annonce ce qui va venir. La phrase du cas non engagé le disait, et contredisait
  // ainsi la doctrine qu'elle sert : rien ne garantit qu'un chantier s'ouvrira un jour.
  const m = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2024, etat: "autorise_non_commence" }])))?.mouvement ?? "";
  assert.equal(/\bencore\b(?!\s+changer)/.test(m), false, `une attente est suggérée dans : ${m}`);
  assert.equal(/\bpour l'instant\b|\bà ce stade\b|\bpas encore\b/i.test(m), false, m);
});
