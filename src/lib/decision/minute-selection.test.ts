import { test } from "node:test";
import assert from "node:assert/strict";
import { selectionMinute, MINUTE_MAX_CARTES } from "./minute-selection.ts";

// Les ENTRÉES minimales de la sélection : elle ne lit que les faits affichés, l'orientation, ce que le
// héros nomme, et les règles rattachées à un critère déclaré.
function entrees(opts: {
  orientation: string;
  nommes?: string[];
  cartes: { id: string; role: string; sujet: string; regle?: string }[];
  reglesDeclarees?: string[];
}) {
  const faits = opts.cartes.filter((c) => c.role !== "composition").map((c) => ({
    id: c.id, ruleId: c.regle ?? "r", role: c.role, topic: c.sujet, headlineSubject: c.sujet,
  }));
  const compositions = opts.cartes.filter((c) => c.role === "composition").map((c) => ({
    id: c.id, kind: "mismatch_with_action", title: c.sujet, headlineSubject: c.sujet,
    referencedRuleIds: [c.regle ?? "r"],
  }));
  return {
    faits, compositions, orientation: opts.orientation,
    nommes: new Set(opts.nommes ?? []),
    reglesDeclarees: new Set(opts.reglesDeclarees ?? ["r"]),
  } as unknown as Parameters<typeof selectionMinute>[0];
}

test("le plafond est GLOBAL : jamais plus que le maximum, quelle que soit la répartition", () => {
  // La cause mécanique du gonflement : six plafonds par section (2+3+3+3+3+4) laissaient chaque rubrique
  // remplir ses places sans regarder le total.
  const d = entrees({
    orientation: "arbitration",
    cartes: Array.from({ length: 12 }, (_, i) => ({
      id: `f${i}`, role: i < 6 ? "mismatch" : "verification",
      sujet: `sujet ${i}`,
    })),
  });
  assert.equal(selectionMinute(d).size, MINUTE_MAX_CARTES);
});

test("un fait NOMMÉ par le verdict passe avant tout le reste", () => {
  const d = entrees({
    orientation: "arbitration", nommes: ["nomme"],
    cartes: [
      { id: "autre1", role: "mismatch", sujet: "a" },
      { id: "autre2", role: "mismatch", sujet: "b" },
      { id: "nomme", role: "verification", sujet: "c" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("nomme"), "le fait qui FONDE le verdict doit toujours être là");
});

test("ARBITRAGE : une place est RÉSERVÉE au contrepoids, même s'il arrive après dans le tri", () => {
  // Sans réservation, les écarts occupent toutes les places : l'écran ne montre que du négatif alors que
  // le verdict dit « la décision se joue entre ces correspondances et les écarts relevés ».
  const d = entrees({
    orientation: "arbitration",
    cartes: [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, role: "mismatch", sujet: `écart ${i}` })),
      { id: "align", role: "alignment", sujet: "la vie locale" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("align"), "le contrepoids doit avoir sa place en arbitrage");
  assert.equal(sel.size, MINUTE_MAX_CARTES);
});

test("FAVORABLE : les correspondances FONDENT le verdict et peuvent occuper la majorité", () => {
  // Une hiérarchie universelle « écart > correspondance » sous-documenterait ce dossier, où le héros
  // nomme lui-même les priorités bien servies.
  const d = entrees({
    orientation: "favorable",
    cartes: [
      { id: "a1", role: "alignment", sujet: "les soins" },
      { id: "a2", role: "alignment", sujet: "les écoles" },
      { id: "a3", role: "alignment", sujet: "la culture" },
      { id: "v1", role: "verification", sujet: "la chaleur" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal([...sel].filter((k) => k.startsWith("a")).length, 3); // trois places sur quatre
});

test("HORS favorable : une seule correspondance — le verdict nomme déjà le côté favorable", () => {
  const d = entrees({
    orientation: "arbitration",
    cartes: [
      { id: "a1", role: "alignment", sujet: "les soins" },
      { id: "a2", role: "alignment", sujet: "les écoles" },
      { id: "a3", role: "alignment", sujet: "la culture" },
      { id: "m1", role: "mismatch", sujet: "la chaleur" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal([...sel].filter((k) => k.startsWith("a")).length, 1);
});

test("NON-REDONDANCE : deux cartes sur le même sujet ne prennent pas deux places", () => {
  // Cinq cartes qui disent au fond « la chaleur mérite votre attention » ne valent pas mieux qu'une.
  const d = entrees({
    orientation: "arbitration",
    cartes: [
      { id: "m1", role: "mismatch", sujet: "les fortes chaleurs" },
      { id: "m2", role: "mismatch", sujet: "Les Fortes Chaleurs" },
      { id: "m3", role: "mismatch", sujet: "l'inondation" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal(sel.size, 2);
  assert.ok(sel.has("m3"));
});

test("un fait rattaché à une PRIORITÉ passe avant un fait indépendant de même nature", () => {
  const d = entrees({
    orientation: "arbitration",
    reglesDeclarees: ["declaree"],
    cartes: [
      ...Array.from({ length: 5 }, (_, i) => ({ id: `x${i}`, role: "verification", sujet: `s${i}`, regle: "ambiante" })),
      { id: "prio", role: "verification", sujet: "priorisé", regle: "declaree" },
    ],
  });
  assert.ok(selectionMinute(d).has("prio"));
});

test("un dossier court n'est pas rempli artificiellement", () => {
  const d = entrees({
    orientation: "arbitration",
    cartes: [{ id: "m1", role: "mismatch", sujet: "la chaleur" }],
  });
  assert.equal(selectionMinute(d).size, 1);
});

test("UNE SEULE carte AMBIANTE : la minute reste la réponse au projet déclaré", () => {
  // Le cas Magné : un projet portant sur l'inondation dont la minute se remplissait de constats du
  // territoire — chaleur, feu, sécheresse — tous justes, aucun demandé.
  const d = entrees({
    orientation: "arbitration",
    reglesDeclarees: ["declaree"],
    cartes: [
      { id: "prio", role: "mismatch", sujet: "l'inondation", regle: "declaree" },
      { id: "amb1", role: "verification", sujet: "la chaleur", regle: "ambiante" },
      { id: "amb2", role: "verification", sujet: "le feu", regle: "ambiante" },
      { id: "amb3", role: "verification", sujet: "la sécheresse", regle: "ambiante" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("prio"), "ce qui a été demandé passe toujours");
  assert.equal([...sel].filter((k) => k.startsWith("amb")).length, 1);
});

test("SANS aucune priorité déclarée, le plafond ambiant ne s'applique pas", () => {
  // Sinon la minute d'un dossier exploratoire tiendrait en une seule carte : sans « demandé », l'ambiant
  // ne prend la place de rien.
  const d = entrees({
    orientation: "arbitration",
    reglesDeclarees: [],
    cartes: Array.from({ length: 5 }, (_, i) => ({
      id: `a${i}`, role: "verification", sujet: `sujet ${i}`, regle: "ambiante",
    })),
  });
  assert.equal(selectionMinute(d).size, MINUTE_MAX_CARTES);
});

test("UNE PLACE, DEUX CANDIDATS AMBIANTS : l'ordre est ÉDITORIAL, pas celui du registre", () => {
  // Le défaut qu'a créé le plafond : deux constats non demandés retournaient 0 au comparateur, donc le
  // tri stable tranchait — l'ordre de déclaration des règles. Le feu perdait sa place parce qu'il est
  // déclaré trois lignes sous la chaleur. Ici on présente le feu EN PREMIER dans les données : la
  // chaleur doit quand même l'emporter, sinon c'est encore la position qui décide.
  const d = entrees({
    orientation: "arbitration",
    reglesDeclarees: ["declaree"],
    cartes: [
      { id: "prio", role: "mismatch", sujet: "l'inondation", regle: "declaree" },
      { id: "feu", role: "verification", sujet: "le feu", regle: "territoire.verification-feu-futur" },
      { id: "chaleur", role: "verification", sujet: "la chaleur", regle: "territoire.verification-chaleur-future" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("chaleur"), "la chaleur se subit sans condition : elle passe avant le danger d'incendie");
  assert.ok(!sel.has("feu"));
});

test("l'ordre ambiant ne départage JAMAIS deux cartes rattachées à une priorité", () => {
  // Sa portée est bornée aux constats non demandés : appliqué aux réponses au projet, il ferait remonter
  // la chaleur devant l'inondation dans un dossier où les deux ont été explicitement priorisées.
  const d = entrees({
    orientation: "arbitration",
    reglesDeclarees: ["territoire.inondation-exposition", "territoire.verification-chaleur-future"],
    cartes: [
      { id: "inond", role: "mismatch", sujet: "l'inondation", regle: "territoire.inondation-exposition" },
      { id: "chaleur", role: "mismatch", sujet: "la chaleur", regle: "territoire.verification-chaleur-future" },
    ],
  });
  assert.deepEqual([...selectionMinute(d)], ["inond", "chaleur"]);
});
