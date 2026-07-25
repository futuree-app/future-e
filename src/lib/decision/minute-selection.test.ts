import { test } from "node:test";
import assert from "node:assert/strict";
import { selectionMinute, MINUTE_MAX_CARTES } from "./minute-selection.ts";
import type { Dossier } from "./decision-fact.ts";

// Un dossier MINIMAL : la sélection ne lit que les sections, le registre et le headline.
function dossier(opts: {
  orientation: string;
  nommes?: string[];
  cartes: { id: string; role: string; section: string; sujet: string; regle?: string }[];
  reglesDeclarees?: string[];
}): Dossier {
  const parSection = new Map<string, unknown[]>();
  for (const c of opts.cartes) {
    const card = c.role === "composition"
      ? { kind: "composition", composition: { id: c.id, kind: "mismatch_with_action", title: c.sujet, headlineSubject: c.sujet, referencedRuleIds: [c.regle ?? "r"] } }
      : { kind: "fact", fact: { id: c.id, ruleId: c.regle ?? "r", role: c.role, topic: c.sujet, headlineSubject: c.sujet } };
    if (!parSection.has(c.section)) parSection.set(c.section, []);
    parSection.get(c.section)!.push(card);
  }
  return {
    sections: [...parSection].map(([key, cards]) => ({ key, title: key, cards })),
    criteria: {
      orientation: opts.orientation,
      registry: (opts.reglesDeclarees ?? ["r"]).map((r) => ({ criterionKey: r, ruleIds: [r] })),
    },
    narrativePlan: {
      verdict: { headline: { consumedFactIds: opts.nommes ?? [], consumedCompositionIds: opts.nommes ?? [] } },
    },
  } as unknown as Dossier;
}

test("le plafond est GLOBAL : jamais plus que le maximum, quelle que soit la répartition", () => {
  // La cause mécanique du gonflement : six plafonds par section (2+3+3+3+3+4) laissaient chaque rubrique
  // remplir ses places sans regarder le total.
  const d = dossier({
    orientation: "arbitration",
    cartes: Array.from({ length: 12 }, (_, i) => ({
      id: `f${i}`, role: i < 6 ? "mismatch" : "verification",
      section: i < 6 ? "mismatches" : "verifications", sujet: `sujet ${i}`,
    })),
  });
  assert.equal(selectionMinute(d).size, MINUTE_MAX_CARTES);
});

test("un fait NOMMÉ par le verdict passe avant tout le reste", () => {
  const d = dossier({
    orientation: "arbitration", nommes: ["nomme"],
    cartes: [
      { id: "autre1", role: "mismatch", section: "mismatches", sujet: "a" },
      { id: "autre2", role: "mismatch", section: "mismatches", sujet: "b" },
      { id: "nomme", role: "verification", section: "verifications", sujet: "c" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("nomme"), "le fait qui FONDE le verdict doit toujours être là");
});

test("ARBITRAGE : une place est RÉSERVÉE au contrepoids, même s'il arrive après dans le tri", () => {
  // Sans réservation, les écarts occupent toutes les places : l'écran ne montre que du négatif alors que
  // le verdict dit « la décision se joue entre ces correspondances et les écarts relevés ».
  const d = dossier({
    orientation: "arbitration",
    cartes: [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, role: "mismatch", section: "mismatches", sujet: `écart ${i}` })),
      { id: "align", role: "alignment", section: "alignments", sujet: "la vie locale" },
    ],
  });
  const sel = selectionMinute(d);
  assert.ok(sel.has("align"), "le contrepoids doit avoir sa place en arbitrage");
  assert.equal(sel.size, MINUTE_MAX_CARTES);
});

test("FAVORABLE : les correspondances FONDENT le verdict et peuvent occuper la majorité", () => {
  // Une hiérarchie universelle « écart > correspondance » sous-documenterait ce dossier, où le héros
  // nomme lui-même les priorités bien servies.
  const d = dossier({
    orientation: "favorable",
    cartes: [
      { id: "a1", role: "alignment", section: "alignments", sujet: "les soins" },
      { id: "a2", role: "alignment", section: "alignments", sujet: "les écoles" },
      { id: "a3", role: "alignment", section: "alignments", sujet: "la culture" },
      { id: "v1", role: "verification", section: "verifications", sujet: "la chaleur" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal([...sel].filter((k) => k.startsWith("a")).length, 3); // trois places sur quatre
});

test("HORS favorable : une seule correspondance — le verdict nomme déjà le côté favorable", () => {
  const d = dossier({
    orientation: "arbitration",
    cartes: [
      { id: "a1", role: "alignment", section: "alignments", sujet: "les soins" },
      { id: "a2", role: "alignment", section: "alignments", sujet: "les écoles" },
      { id: "a3", role: "alignment", section: "alignments", sujet: "la culture" },
      { id: "m1", role: "mismatch", section: "mismatches", sujet: "la chaleur" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal([...sel].filter((k) => k.startsWith("a")).length, 1);
});

test("NON-REDONDANCE : deux cartes sur le même sujet ne prennent pas deux places", () => {
  // Cinq cartes qui disent au fond « la chaleur mérite votre attention » ne valent pas mieux qu'une.
  const d = dossier({
    orientation: "arbitration",
    cartes: [
      { id: "m1", role: "mismatch", section: "mismatches", sujet: "les fortes chaleurs" },
      { id: "m2", role: "mismatch", section: "mismatches", sujet: "Les Fortes Chaleurs" },
      { id: "m3", role: "mismatch", section: "mismatches", sujet: "l'inondation" },
    ],
  });
  const sel = selectionMinute(d);
  assert.equal(sel.size, 2);
  assert.ok(sel.has("m3"));
});

test("un fait rattaché à une PRIORITÉ passe avant un fait indépendant de même nature", () => {
  const d = dossier({
    orientation: "arbitration",
    reglesDeclarees: ["declaree"],
    cartes: [
      ...Array.from({ length: 5 }, (_, i) => ({ id: `x${i}`, role: "verification", section: "verifications", sujet: `s${i}`, regle: "ambiante" })),
      { id: "prio", role: "verification", section: "verifications", sujet: "priorisé", regle: "declaree" },
    ],
  });
  assert.ok(selectionMinute(d).has("prio"));
});

test("un dossier court n'est pas rempli artificiellement", () => {
  const d = dossier({
    orientation: "arbitration",
    cartes: [{ id: "m1", role: "mismatch", section: "mismatches", sujet: "la chaleur" }],
  });
  assert.equal(selectionMinute(d).size, 1);
});
