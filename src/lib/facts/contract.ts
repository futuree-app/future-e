// ════════════════════════════════════════════════════════════════════════════════════════════
// LE CONTRAT GÉNÉRIQUE `Fact → DerivedFact → FactsSnapshot → projection` (FUT-6, 28/09/2026).
//
// Le défaut qu'il corrige : sur le module Territoire, les cartes et la synthèse lisaient chacune
// leurs sources. Les cartes disaient « Occupation mixte, 37 % d'espaces naturels » ; la synthèse,
// nourrie d'un autre chiffre (boisement ADEME 1,5 %) et d'un trait mal nommé, écrivait « le béton et
// le bitume couvrent l'essentiel du territoire ». Chaque surface était fidèle à sa source ; personne
// ne partageait la même.
//
// La règle : un écran lit UNE photo des données (`FactsSnapshot`). Les cartes et la synthèse la
// consomment toutes les deux ; la synthèse n'en reçoit qu'une PROJECTION explicite.
//
// Ce module est PUR et UNIVERSEL : aucun import Node, aucun réseau, rien de propre à Territoire.
// L'empreinte (SHA-256) vit à part (`./hash.ts`), parce que `node:crypto` n'existe pas dans un
// bundle navigateur et que les composants client importent les TYPES d'ici.
// ════════════════════════════════════════════════════════════════════════════════════════════

/** L'échelle RÉELLE de la mesure. Une valeur ne se lit jamais à une autre échelle que la sienne. */
export type FactScale = "commune" | "radius_15km" | "urban_unit" | "department" | "point";

export type FactSource = {
  /** Qui produit la donnée (CESBIO, INSEE, Météo-France…). */
  producer: string;
  /** Le jeu de données (OSO, DRIAS-TRACC, base GASPAR…). */
  dataset: string;
  /** Le champ technique d'où vient la valeur, pour la retrouver sans ambiguïté. */
  field: string;
};

/**
 * POURQUOI UN FAIT N'A PAS DE CARTE. L'absence de carte est un choix, jamais un oubli : le registre
 * le dit ici, au plus près du fait (doctrine FUT-6).
 */
export type NoCardReason =
  | "redundant" // déjà dit par une autre carte ou un autre fait
  | "context_only" // sert à situer, pas à démontrer
  | "too_granular" // trop fin pour une carte autonome
  | "low_standalone_value" // sans valeur seul
  | "other";

export type CardPolicy =
  | { card: string }
  | { noCard: { reason: NoCardReason; note: string } };

/** D11 : chaque fait dit s'il nourrit la synthèse, et sinon pourquoi. */
export type SynthesisPolicy =
  | { include: true }
  | { include: false; reason: string };

export type FactStatus = "ok" | "missing" | "source_unavailable";

export type Fact<V = unknown> = {
  key: string;
  value: V | null;
  unit: string | null;
  scale: FactScale;
  source: FactSource;
  /** Millésime ou période des données. `null` = inconnu, et c'est dit (jamais inventé). */
  vintage: string | null;
  /**
   * Date de LECTURE d'une source vivante (VigiEau, GASPAR). HORS de l'empreinte : une nouvelle lecture
   * à valeur identique ne change pas le sens, et ne doit pas invalider le cache de synthèse. Le jour où
   * une surface VERBALISE cette date, elle doit entrer dans la valeur (donc dans l'empreinte).
   */
  observedAt: string | null;
  status: FactStatus;
  /** La limite qui empêche une mauvaise lecture (échelle, définition, couverture). */
  limits?: string;
  card: CardPolicy;
  synthesis: SynthesisPolicy;
};

/**
 * Une INTERPRÉTATION DÉTERMINISTE : une catégorie produite par une règle nommée et versionnée. Elle
 * borne ce que la synthèse a le droit de dire (D3, D4) : l'IA relie des conclusions déjà sûres, elle
 * n'invente pas ses propres adjectifs.
 */
export type DerivedFact<V extends string = string> = {
  key: string;
  /** Code stable, pour les règles et les contrôles (« mixed », « intermediate »…). */
  value: V;
  /** Le texte affiché, identique sur toutes les surfaces. */
  label: string;
  /** Les faits dont la règle dépend. */
  from: string[];
  /** Identifiant ET version de la règle : « land-category@1 ». */
  rule: string;
  card: CardPolicy;
  synthesis: SynthesisPolicy;
};

export type FactsSnapshot = {
  scope: { kind: string; id: string };
  /** Version du registre et de ses règles : la monter change l'empreinte, donc invalide les caches. */
  registryVersion: string;
  /** Hors de l'empreinte. */
  builtAt: string;
  facts: Fact[];
  derived: DerivedFact[];
};

/** Un snapshot et son empreinte, tels qu'ils circulent entre la page, la base et la route. */
export type HashedSnapshot = FactsSnapshot & { hash: string };

// ── Accès ────────────────────────────────────────────────────────────────────────────────────

export function factOf<V>(snapshot: FactsSnapshot, key: string): Fact<V> | null {
  return (snapshot.facts.find((f) => f.key === key) as Fact<V> | undefined) ?? null;
}

/** La valeur d'un fait, seulement s'il est `ok`. Une valeur manquante ne se lit jamais comme 0. */
export function valueOf<V>(snapshot: FactsSnapshot, key: string): V | null {
  const f = factOf<V>(snapshot, key);
  return f && f.status === "ok" ? f.value : null;
}

export function derivedOf<V extends string = string>(snapshot: FactsSnapshot, key: string): DerivedFact<V> | null {
  return (snapshot.derived.find((d) => d.key === key) as DerivedFact<V> | undefined) ?? null;
}

// ── Empreinte ────────────────────────────────────────────────────────────────────────────────

/**
 * CE QUI ENTRE DANS L'EMPREINTE : tout ce qui peut changer le sens d'une surface, et rien d'autre.
 * `builtAt` et `observedAt` en sont exclus (voir leur définition). Rendu sous forme d'objet, pour que
 * le hachage (serveur) et les tests (partout) partagent exactement la même base.
 */
export function hashableContent(s: FactsSnapshot): unknown {
  return {
    scope: s.scope,
    registryVersion: s.registryVersion,
    facts: s.facts.map((f) => ({ ...f, observedAt: undefined })),
    derived: s.derived,
  };
}

// ── Projection de synthèse (D11) ─────────────────────────────────────────────────────────────

/**
 * Les faits AUTORISÉS à nourrir la synthèse, et eux seuls. Un fait exclu l'est avec sa raison, dans le
 * registre ; il n'atteint jamais le modèle, même s'il vit dans le snapshot pour une carte.
 */
export function synthesisFacts(s: FactsSnapshot): { facts: Fact[]; derived: DerivedFact[] } {
  return {
    facts: s.facts.filter((f) => f.synthesis.include && f.status === "ok"),
    derived: s.derived.filter((d) => d.synthesis.include),
  };
}

/**
 * LE REGISTRE EST-IL COMPLET ? Un fait sans carte doit dire pourquoi ; un fait exclu de la synthèse
 * aussi. Rend la liste des manquements (vide = conforme). Sert aux tests du registre, pour qu'un fait
 * ajouté demain sans justification casse la suite plutôt que de passer en silence.
 */
export function registryGaps(s: FactsSnapshot): string[] {
  const gaps: string[] = [];
  for (const f of [...s.facts, ...s.derived]) {
    if ("noCard" in f.card && !f.card.noCard.note.trim()) gaps.push(`${f.key} : pas de carte, sans raison écrite`);
    if (!f.synthesis.include && !f.synthesis.reason.trim()) gaps.push(`${f.key} : exclu de la synthèse, sans raison`);
  }
  return gaps;
}
