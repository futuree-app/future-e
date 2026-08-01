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

// ── Les cinq formes ─────────────────────────────────────────────────────────────────────────

test("un chantier ouvert seul : l'année est dite, rattachée au DÉPÔT", () => {
  // Le point-virgule porte un fait : 2025 est l'année de dépôt, jamais celle de l'ouverture du
  // chantier. Un complément collé au verbe laisserait les deux dates se contaminer.
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : un chantier de logements est déclaré ouvert " +
      "à moins de 50 m ; le dossier a été déposé en 2025.",
  );
});

test("une autorisation non commencée seule : l'ouverture manquante est dite, puis l'année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2024, etat: "autorise_non_commence" }])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : une autorisation créant des logements est " +
      "recensée à moins de 50 m, sans ouverture de chantier déclarée ; le dossier a été déposé " +
      "en 2024.",
  );
});

test("plusieurs, tous ouverts : pluriel, AUCUNE année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "chantier_ouvert" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : deux chantiers de logements sont déclarés " +
      "ouverts à moins de 50 m.",
  );
});

test("plusieurs, aucun ouvert : pluriel, AUCUNE année", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : trois autorisations créant des logements sont " +
      "recensées à moins de 50 m, sans ouverture de chantier déclarée.",
  );
});

test("états mixtes : le total, puis les ouverts, sans compter les autres", () => {
  // Le total permet de déduire les non commencées. Les compter séparément produirait une phrase de
  // registre administratif là où on attend une lecture.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
    { annee: 2023, etat: "acheve" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : trois autorisations créant des logements sont " +
      "recensées à moins de 50 m, dont deux chantiers déclarés ouverts.",
  );
});

test("mixte avec UN SEUL chantier ouvert : l'accord suit", () => {
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : deux autorisations créant des logements sont " +
      "recensées à moins de 50 m, dont un chantier déclaré ouvert.",
  );
});

test("même millésime au pluriel : l'année reste TUE", () => {
  // Règle éditoriale assumée, pas un raccourci : l'année n'apparaît que lorsque la conclusion
  // mentionne une seule autorisation. L'ajouter au pluriel rapprocherait la charnière de
  // l'inventaire que le bloc précédent rend déjà.
  const c = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2025, etat: "chantier_ouvert" },
  ])));
  assert.ok(!c?.mouvement?.includes("2025"));
});

test("au-delà de neuf, le nombre passe en chiffres", () => {
  const dix = Array.from({ length: 10 }, () => ({ annee: 2025, etat: "chantier_ouvert" as const }));
  const c = buildAutourConclusion(snapAvecPermis(permis(dix)));
  assert.equal(
    c?.mouvement,
    "Cette configuration peut encore changer : 10 chantiers de logements sont déclarés ouverts " +
      "à moins de 50 m.",
  );
});

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

test("AUCUN VOLUME de logements, en chiffres comme en lettres", () => {
  // La charnière écrit ses nombres en toutes lettres, donc un test sur /\d+\s+logements/ seul
  // laisserait passer « deux logements ». L'interdit porte sur le VOLUME de logements, jamais sur
  // le nombre d'autorisations, qui est légitime et attendu.
  const VOLUME = /(\d+|un|une|deux|trois|quatre|cinq|six|sept|huit|neuf)\s+logements/i;
  const m = buildAutourConclusion(snapAvecPermis(permis([
    { annee: 2025, etat: "chantier_ouvert" },
    { annee: 2024, etat: "autorise_non_commence" },
  ])))?.mouvement ?? "";
  assert.ok(!VOLUME.test(m), `un volume de logements a été écrit : ${m}`);
  assert.ok(m.includes("deux autorisations"), "le nombre d'autorisations, lui, doit être dit");
});

test("LE RAYON VIENT DU SNAPSHOT, jamais de la constante du jour", () => {
  // Un dossier créé sous un ancien rayon doit continuer de décrire le périmètre qui l'a réellement
  // sélectionné. Une phrase bâtie sur RAYON_PERMIS_M mentirait sur tous les dossiers antérieurs au
  // prochain changement de rayon.
  const c = buildAutourConclusion(snapAvecPermis(permis([{ annee: 2025, etat: "chantier_ouvert" }], 80)));
  assert.ok(c?.mouvement?.includes("à moins de 80 m"));
  assert.ok(!c?.mouvement?.includes("50 m"));
});
