// FUT-16 : le `system` envoyé à Anthropic par AskFuture ne porte plus aucune note de `communes_tension`.
//
// Les tests portent sur `construireSystemPrompt`, la fonction dont la route passe le résultat à
// `anthropic.messages.create({ system })` (T7 vérifie ce branchement). Les communes sont réelles
// (__fixtures__/communes.json : enrichissements et lignes `communes_tension` relevés le 02/10/2026).
//
// Avant FUT-16, Bourg-en-Bresse recevait « feux : score 75 (exposition 100, vulnérabilité 1,
// adaptation 99, occurrence 100) » à côté de 3,5 jours d'indice forêt-météo, et Claude répondait
// « exposition maximale (100/100) … (Source : référentiel interne futur•e) ».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { aDesDonneesDetaillees, construireReferentiel, construireSystemPrompt, SYSTEM_PROMPT_BASE } from "./system-prompt.ts";
import { deriveCategories } from "../commune-categories.ts";

type LigneTension = { slug: string; score: number; ind_exposition: number | null; ind_vulnerabilite: number | null; ind_adaptation: number | null; ind_occurrence: number | null };
type Commune = {
  nom: string;
  categorization: { commune_name: string; categories: string[] } | null;
  tensions: LigneTension[];
  enrichment: Parameters<typeof construireSystemPrompt>[0]["enrichment"];
};
const F = JSON.parse(readFileSync(new URL("./__fixtures__/communes.json", import.meta.url), "utf8")).communes as Record<string, Commune>;

/** Ce que la route construit, à l'identique (lireReferentielInterne puis construireSystemPrompt). */
function systemDe(insee: string, enrichment = F[insee].enrichment, profile: Record<string, unknown> | null = null): string {
  const c = F[insee];
  const categories = c.categorization?.categories?.length ? c.categorization.categories : deriveCategories(insee);
  const referentiel = construireReferentiel({ insee, nomCommune: c.categorization?.commune_name ?? null, categories });
  return construireSystemPrompt({ communeName: c.nom, communeInsee: insee, referentiel, enrichment, profile });
}

/** Le bloc [Référentiel interne futur•e], seul, tel qu'il apparaît dans le `system`. */
function blocReferentiel(system: string): string {
  const debut = system.indexOf("[Référentiel interne futur•e]");
  const fin = system.indexOf("\n[", debut + 1);
  return system.slice(debut, fin);
}

const COMMUNES_AVEC_LIGNES = ["13039", "01053", "84080", "06088"]; // Fos-sur-Mer, Bourg-en-Bresse, Monteux, Nice

// ── T1 : plus aucune note synthétique dans le system prompt ─────────────────────────────────

test("T1 : pour une commune qui a des lignes communes_tension, le system ne porte plus aucune note", () => {
  for (const insee of COMMUNES_AVEC_LIGNES) {
    assert.ok(F[insee].tensions.length > 0, `${insee} doit avoir des lignes en base (fixture)`);
    const s = systemDe(insee);
    for (const motif of [
      /communes_tension/,
      /Tensions territoriales/,
      /scores? et indicateurs sur 100/,
      /scores? de tension/i,
      /\bscore \d/,
      /\b(exposition|vulnérabilité|adaptation|occurrence) \d/,
      /ind_(exposition|vulnerabilite|adaptation|occurrence)/,
      /dependance-auto|\bsecheresse\b|\bfeux : /,
    ]) assert.doesNotMatch(s, motif, `${F[insee].nom} : ${motif}`);
  }
});

test("T1 : aucune valeur de communes_tension n'atteint le system, même déguisée", () => {
  // Bourg-en-Bresse : la ligne corrompue « feux : score 75 (exposition 100, vulnérabilité 1, adaptation
  // 99, occurrence 100) ». Ses nombres ne doivent apparaître nulle part dans le référentiel.
  const bloc = blocReferentiel(systemDe("01053"));
  for (const t of F["01053"].tensions) {
    for (const v of [t.score, t.ind_exposition, t.ind_vulnerabilite, t.ind_adaptation, t.ind_occurrence]) {
      if (v != null) assert.doesNotMatch(bloc, new RegExp(`\\b${v}\\b`), `valeur ${v} (${t.slug}) dans le référentiel`);
    }
  }
});

// ── T2 : le contrat du builder ne laisse entrer aucune structure de la table ───────────────

test("T2 : construireReferentiel refuse une ligne de tension glissée dans ses arguments", () => {
  const avecTensions = { insee: "01053", nomCommune: "Bourg-en-Bresse", categories: [], tensions: F["01053"].tensions };
  assert.throws(() => construireReferentiel(avecTensions as never), /clé\(s\) non prévue\(s\) par le contrat : tensions/);
  for (const cle of ["score", "scores", "communes_tension", "ind_exposition"]) {
    assert.throws(() => construireReferentiel({ insee: "01053", nomCommune: null, categories: [], [cle]: 1 } as never), /non prévue/);
  }
});

test("T2 : construireSystemPrompt refuse tout argument supplémentaire (hasTensionData, tensions…)", () => {
  const base = { communeName: "Bourg-en-Bresse", communeInsee: "01053", referentiel: "INSEE : 01053", enrichment: F["01053"].enrichment, profile: null };
  assert.doesNotThrow(() => construireSystemPrompt(base));
  for (const extra of [{ hasTensionData: true }, { tensions: F["01053"].tensions }, { scores: [] }]) {
    assert.throws(() => construireSystemPrompt({ ...base, ...extra } as never), /non prévue/);
  }
});

// ── T3 : les faits explicites sont préservés ──────────────────────────────────────────────

test("T3 : les mesures qui rendaient les notes redondantes sont toujours là (DRIAS, ADEME, Géorisques, GASPAR)", () => {
  const fos = systemDe("13039");
  assert.match(fos, /\[DRIAS-TRACC — projections climatiques par niveau de réchauffement\]/);
  assert.match(fos, /Jours risque feu \(IFM > 40\) : 72 j/); // ce que « feux : exposition 100 » déformait
  assert.match(fos, /Jours sécheresse sol \(SWI < 0\.4\) : 221 j/);
  assert.match(fos, /Actifs utilisant un mode motorisé pour aller travailler \(%\) : 87\.5 %/); // « dependance-auto : exposition 87 »
  assert.match(fos, /Risques recensés : .*submersion marine/);
  assert.match(fos, /\[GASPAR — historique des arrêtés de catastrophe naturelle \(CatNat\)\]/);
  assert.match(fos, /\[VigiEau\]/);
  assert.match(fos, /\[Hub'Eau — eau potable et hydrologie\]/);
  assert.match(fos, /\[Baignade — /);

  const bourg = systemDe("01053");
  assert.match(bourg, /Jours risque feu \(IFM > 40\) : 3\.5 j/); // la mesure que la ligne corrompue contredisait
  const monteux = systemDe("84080");
  assert.match(monteux, /Jours sécheresse sol \(SWI < 0\.4\) : 172 j/);
});

test("T3 : le prompt de base, le référentiel et le profil restent assemblés comme avant", () => {
  const s = systemDe("06088", F["06088"].enrichment, { home_commune: "Nice", housing_type: "appartement" });
  assert.ok(s.startsWith(SYSTEM_PROMPT_BASE));
  assert.match(s, /DONNÉES TERRITORIALES DISPONIBLES — Nice \(INSEE 06088\)/);
  assert.match(blocReferentiel(s), /^\[Référentiel interne futur•e\]\nINSEE : 06088\nNom commune \(référentiel interne\) : Nice\nCatégories territoriales : vectoriel, littoral_mediterranee, mediterranee, tourisme_urbain, urbain_dense_sud\n$/);
  assert.match(s, /PROFIL UTILISATEUR CONNU\nCommune de résidence : Nice\nType de logement : appartement$/);
});

// ── T4 : aucun remplacement cosmétique ────────────────────────────────────────────────────

test("T4 : le référentiel ne contient que l'identité et les catégories, sans qualification ajoutée", () => {
  for (const insee of [...COMMUNES_AVEC_LIGNES, "74056"]) {
    const lignes = blocReferentiel(systemDe(insee)).trim().split("\n");
    assert.equal(lignes[0], "[Référentiel interne futur•e]");
    for (const l of lignes.slice(1)) {
      assert.match(l, /^(INSEE : |Nom commune \(référentiel interne\) : |Catégories territoriales : )/, `${insee} : ligne inattendue « ${l} »`);
    }
  }
});

test("T4 : retirer les notes n'a changé aucun bloc de source (seul le référentiel diffère)", () => {
  // Le texte des blocs DRIAS, ADEME, Géorisques… est identique à ce qu'il était : rien n'a été réécrit en
  // adjectifs à partir des notes retirées.
  for (const insee of COMMUNES_AVEC_LIGNES) {
    const s = systemDe(insee);
    const sources = s.slice(s.indexOf("\n[ADEME"), s.indexOf("PROFIL UTILISATEUR CONNU"));
    assert.doesNotMatch(sources, /\b(très )?(faible|modérée?|élevée?|forte?|favorable|défavorable|vulnérable|bien adaptée?)\b/i, insee);
  }
});

// ── T5 : commune sans ancienne ligne ──────────────────────────────────────────────────────

test("T5 : Chamonix (aucune ligne en base) ne reçoit plus de phrase sur l'absence de scores", () => {
  assert.equal(F["74056"].tensions.length, 0);
  const s = systemDe("74056");
  assert.doesNotMatch(s, /Pas de scores|scores? de tension|base interne pour cette commune/);
  assert.match(blocReferentiel(s), /^\[Référentiel interne futur•e\]\nINSEE : 74056\nNom commune \(référentiel interne\) : Chamonix-Mont-Blanc\nCatégories territoriales : montagne\n$/);
  assert.doesNotMatch(s, /\n\n\n\n/); // plus de trou laissé par les lignes retirées
});

// ── T6 : aucune vraie donnée ─────────────────────────────────────────────────────────────

const VIDE = { ademe: null, drias: null, eau: null, vigieau: null, georisques: null, catnat: null, littoral: null, baignade: null };

test("T6 : sans aucune source détaillée, l'indication d'absence de données apparaît", () => {
  const s = systemDe("01053", VIDE as never);
  assert.match(s, /Indication : aucune donnée détaillée disponible dans futur•e pour cette commune/);
  assert.equal(aDesDonneesDetaillees(VIDE as never), false);
});

test("T6 : une seule vraie source suffit à retirer l'indication ; communes_tension n'y entre plus", () => {
  for (const cle of ["ademe", "drias", "eau", "vigieau", "georisques", "catnat", "baignade"] as const) {
    const une = { ...VIDE, [cle]: F["13039"].enrichment[cle] };
    assert.equal(aDesDonneesDetaillees(une as never), true, cle);
    assert.doesNotMatch(systemDe("01053", une as never), /Indication : aucune donnée détaillée/, cle);
  }
});

// ── T7 : la route ne lit plus communes_tension, et passe bien ce system à Anthropic ───────

test("T7 : /api/ask ne lit plus communes_tension et envoie à Anthropic le résultat de construireSystemPrompt", () => {
  const route = readFileSync(new URL("../../app/api/ask/route.ts", import.meta.url), "utf8");
  const code = route.replace(/\/\/.*$/gm, ""); // les commentaires peuvent nommer la table, pas le code
  assert.doesNotMatch(code, /communes_tension/);
  assert.doesNotMatch(code, /ind_(exposition|vulnerabilite|adaptation|occurrence)|hasTensionData/);
  // Un seul appel au modèle, et son `system` est celui que les tests ci-dessus inspectent.
  assert.equal(code.match(/anthropic\.messages\.create\(/g)?.length, 1);
  assert.match(code, /const systemPrompt = construireSystemPrompt\(\{/);
  assert.match(code, /system: systemPrompt,/);
  assert.equal(code.match(/system:/g)?.length, 1);
  // Le pré-warm ne lit pas la table non plus.
  const contexte = readFileSync(new URL("../../app/api/ask/context/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(contexte, /communes_tension|buildCommuneContext/);
});
