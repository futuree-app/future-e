// LE GARDE-FOU DE /qna (FUT-37). Module PUR : la route ne fait que l'appel réseau.
//
// Avant FUT-37, la réponse du modèle était affichée telle quelle. Le modèle recevait comme « base
// éditoriale » des textes écrits pour une autre commune (La Rochelle, Bressuire, la Charente) et les
// valeurs DRIAS de 2100 étiquetées « 2050 ». Rien ne vérifiait ce qu'il écrivait.
//
// Le circuit est désormais :
//   1. le modèle ne reçoit que les faits de la commune demandée (`FaitsCommune`), aucune réponse
//      éditoriale ;
//   2. sa sortie passe un contrôle déterministe : les règles d'assertion partagées avec le dossier
//      (src/lib/garde-fous/assertions.ts), puis les NOMBRES (tout nombre écrit doit venir des faits, de
//      la question ou des connaissances nationales sourcées du prompt) ;
//   3. à la moindre violation, la phrase fautive n'est pas affichée : la réponse devient le repli
//      déterministe (src/lib/accueil/reponses.ts). Aucune seconde tentative du modèle, qui pourrait
//      reproduire la même dérive.
import { checkRecitPublic, type Violation } from "../garde-fous/assertions.ts";
import { reponseDeRepli, type ReponseQna } from "./reponses.ts";
import { construireFaitsCommune, indicatorsDepuisScenarios, type FaitsCommune } from "./faits.ts";
import type { GwlScenarios } from "../decision/climat-facts.ts";
import type { GeorisquesFlags } from "./recits.ts";

export const SYSTEM_PROMPT = `You are the short-answer engine of the futur•e landing page, a French web app that helps people decide where to live using public data.

You produce a short direct answer for the "module question-réponse".

Rules:
- Write only in French.
- Address the reader with "vous".
- Tone: direct, sober, lucid, sourced. Write for everyone — no assumed expertise, no jargon.
- Never mention that you are an AI.
- No markdown.
- No em dash.
- Verdict: 8 to 15 words, one sentence.
- Detail: ideally 55 to 90 words, 2 or 3 sentences, concrete and readable.
- CTA: 4 to 8 words, starting with an action verb.
- Use the commune name naturally.

What you may affirm (this is checked automatically; an answer that breaks a rule is discarded):
- Only the facts given in "faits_commune", for THIS commune, and the qualitative "territory_signals". Never quote a number that is not in them, except the national figures of the domain knowledge below, presented as national with their source.
- Climate values are DRIAS-TRACC projections at the stated horizon (2050, +2,7 °C in France), compared with the reference period 1976-2005. None of them is a present-day value: never write "aujourd'hui" or "actuellement" about a projected value.
- A number of days per year says nothing about how long an episode lasts: never write "plusieurs semaines", "durer", "tout l'été" or "une grande partie de l'été".
- Days of dry soil (SWI) describe soil moisture for vegetation. They say nothing about water access, drinking water, groundwater, rivers, restrictions or shortages: never conclude on any of those.
- The fire-weather index (IFM ≥ 40) describes weather favourable to fires, not the probability that a fire breaks out: never write that fires will reach, threaten or become more frequent in the commune.
- Winter temperature says nothing about snow cover, ski resorts or the mountain economy.
- Risks listed by the State (Géorisques) are CURRENT facts at the scale of the whole commune: never project their extent, frequency or new zones in the future, and never apply them to a specific home or address.
- Heavy rain says nothing about floods by itself.
- Never predict property prices, a loss of value, insurance costs or insurability.
- Never rank or compare the commune with others ("parmi les plus…", "que la plupart des villes…", "de France"): no fact compares communes.
- Never explain WHY (sea influence, relief, altitude, urban heat islands…): say only what the facts count.
- Never use "aujourd'hui" or "actuellement" for a climate value: the reference is the period 1976-2005, not the present.
- If the facts do not answer the question, say so plainly and point to the dossier.

Forbidden vocabulary — always replace with plain French:
- "IFT" → "indice d'utilisation des pesticides"
- "RCP 2.6 / 4.5 / 8.5" → "scénario optimiste / médian / pessimiste"
- "PPRi" → "plan de prévention du risque inondation"
- "DPE" → explain once as "diagnostic de performance énergétique du logement", then DPE is OK
- "retrait-gonflement des argiles" → "mouvements des sols argileux"
- "stress hydrique" → "manque d'eau dans les sols"
- "résilience" → only if explained in context
- "impact" → "effet", "conséquence", "ce que ça change concrètement"
- "GES" → always expand to "gaz à effet de serre"
- "Bilan Carbone" → NEVER use (registered trademark). Always use "empreinte carbone" instead.
- "arbovirose" → "maladie transmise par le moustique tigre (chikungunya, dengue)"
- "Aedes albopictus" → "moustique tigre"
- "cas autochtone" → "cas contracté localement, sans voyage"

Domain knowledge — préparation des Français aux catastrophes climatiques (Croix-Rouge française / Crédoc, rapport 2024), NATIONAL figures:
- Seulement 26 % des Français se sentent bien ou très bien préparés face aux vagues de chaleur (sondage OpinionWay / Croix-Rouge, janvier 2024).
- 44 % des Français estiment avoir déjà subi les conséquences du changement climatique sur leur lieu de vie.
- 84 % pensent que leur territoire devra prendre des mesures importantes dans les décennies à venir.
- La Croix-Rouge française recommande de préparer un sac d'urgence, d'identifier les personnes vulnérables de son entourage et de connaître le plan canicule de sa commune.

Domain knowledge — santé vectorielle en France (bilan 2025, Santé publique France, mai 2026), NATIONAL figures:
- Le moustique tigre est présent dans 81 des 96 départements hexagonaux au 1er janvier 2025.
- En 2025, 809 cas de chikungunya contractés localement ont été confirmés en France hexagonale.
- 30 cas de dengue contractés localement ont aussi été recensés, principalement en PACA et Occitanie.
- La saison de surveillance active s'étend du 1er mai au 30 novembre.

Output strict JSON with:
{
  "verdict": "...",
  "detail": "...",
  "cta": "..."
}`;

export type ContexteQna = {
  commune: string;
  tensionId: string;
  questionLabel: string;
  questionSub?: string | null;
  faits: FaitsCommune;
};

/** Le message utilisateur envoyé au modèle. Aucune réponse éditoriale, aucun fait d'une autre commune. */
export function construirePromptUtilisateur(args: {
  contexte: ContexteQna;
  categories: string[];
  questionType: "preset" | "free";
  freeTextQuestion: string | null;
  territorySignals: Record<string, unknown> | null;
}) {
  const { contexte } = args;
  return {
    user_profile: { commune: contexte.commune, commune_categories: args.categories, profile_known: false },
    question: {
      type: args.questionType,
      preset_id: contexte.tensionId,
      preset_label: contexte.questionLabel,
      preset_subtitle: contexte.questionSub ?? null,
      free_text: args.freeTextQuestion,
    },
    faits_commune: contexte.faits,
    territory_signals: args.territorySignals,
    objective:
      "Answer the question for this commune using only faits_commune and territory_signals. If they do not answer it, say so and point to the dossier.",
  };
}

// ── Contrôle des nombres ─────────────────────────────────────────────────────────────────────

const NOMBRE = /\d+(?:[.,]\d+)?/g;
const enNombre = (s: string) => Number(s.replace(",", "."));

function nombresDe(texte: string): number[] {
  return (texte.match(NOMBRE) ?? []).map(enNombre).filter(Number.isFinite);
}

/** Les nombres qu'une réponse a le droit d'écrire, et leurs arrondis. */
export function nombresAutorises(ctx: ContexteQna): number[] {
  const out = new Set<number>([0, 1]);
  const ajoute = (n: number | null | undefined) => {
    if (n == null || !Number.isFinite(n)) return;
    for (const x of [n, Math.round(n), Math.floor(n), Math.ceil(n), Math.round(n * 10) / 10, Math.abs(n), Math.abs(Math.round(n * 10) / 10)]) out.add(x);
  };
  // Les conventions des indicateurs, l'horizon, la période de référence et les paliers de réchauffement.
  for (const n of [35, 30, 20, 40, 0.4, 1976, 2005, 2030, 2050, 2100, 1.5, 2, 2.7, 3, 4]) ajoute(n);
  for (const s of [ctx.faits.horizon.annee, ctx.faits.horizon.rechauffement_france, ctx.faits.horizon.reference]) nombresDe(s).forEach(ajoute);
  // Les faits de la commune.
  for (const m of Object.values(ctx.faits.climat ?? {})) {
    ajoute(m.projete);
    ajoute(m.reference);
  }
  // La question elle-même (« dans 20 ans ») et le nom de la commune (« Marseille 7e Arrondissement »).
  [ctx.questionLabel, ctx.questionSub ?? "", ctx.commune].forEach((t) => nombresDe(t).forEach(ajoute));
  // Les chiffres NATIONAUX sourcés du prompt.
  nombresDe(SYSTEM_PROMPT.slice(SYSTEM_PROMPT.indexOf("Domain knowledge"))).forEach(ajoute);
  return [...out];
}

function nombresNonSources(texte: string, autorises: number[]): Violation[] {
  const out: Violation[] = [];
  for (const brut of texte.match(NOMBRE) ?? []) {
    const n = enNombre(brut);
    if (!autorises.some((a) => Math.abs(a - n) < 0.051)) out.push({ rule: "nombre:non-source", excerpt: brut });
  }
  return out;
}

// ── Contrôle d'une réponse ──────────────────────────────────────────────────────────────────

export type ResultatControle = { ok: true; reponse: ReponseQna } | { ok: false; violations: Violation[] };

export function controlerReponse(brut: unknown, ctx: ContexteQna): ResultatControle {
  const r = brut as Partial<ReponseQna> | null;
  if (!r || typeof r.verdict !== "string" || typeof r.detail !== "string" || typeof r.cta !== "string" || !r.verdict.trim() || !r.detail.trim()) {
    return { ok: false, violations: [{ rule: "format:invalide", excerpt: JSON.stringify(brut)?.slice(0, 120) ?? "" }] };
  }
  const texte = `${r.verdict}\n${r.detail}\n${r.cta}`;
  const violations = [
    ...checkRecitPublic(texte),
    // Le présent appliqué à une projection : « aujourd'hui » ou « actuellement » à côté d'un chiffre DRIAS.
    ...(/\b(aujourd'hui|actuellement)\b[^.]*\d+\s*(jours?|nuits?|°)/i.test(texte.replace(/[’ʼ]/g, "'"))
      ? [{ rule: "temps:projection-au-present", excerpt: texte.slice(0, 120) }]
      : []),
    ...nombresNonSources(texte, nombresAutorises(ctx)),
  ];
  return violations.length ? { ok: false, violations } : { ok: true, reponse: { verdict: r.verdict, detail: r.detail, cta: r.cta } };
}

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export type ReponseFinale = ReponseQna & { source: "modele" | "repli"; violations: string[] };

/**
 * Du texte brut du modèle à ce qui peut être affiché. JAMAIS le texte brut : soit la réponse contrôlée,
 * soit le repli déterministe.
 */
export function finaliserReponseQna(texteModele: string | null, ctx: ContexteQna): ReponseFinale {
  let brut: unknown = null;
  try {
    brut = texteModele == null ? null : JSON.parse(stripCodeFence(texteModele));
  } catch {
    brut = null;
  }
  const c = controlerReponse(brut, ctx);
  if (c.ok) return { ...c.reponse, source: "modele", violations: [] };
  return { ...reponseDeRepli(ctx.tensionId, ctx.faits), source: "repli", violations: [...new Set(c.violations.map((v) => v.rule))] };
}

// ── L'autorité des faits ─────────────────────────────────────────────────────────────────────

/**
 * Les sources canoniques que le serveur interroge. Injectées pour rester testables ; la route branche
 * `getClimatDataCommune` (DRIAS, colonnes de l'accueil) et `getGeorisquesSummary` (GASPAR).
 */
export type SourcesFaits = {
  climat: (insee: string) => Promise<GwlScenarios | null>;
  georisques: (insee: string) => Promise<{ flags?: GeorisquesFlags | null; riskLabels?: string[] | null } | null>;
};

/**
 * Le contexte d'une question, construit à partir du CORPS de la requête. Seuls la commune (pour la
 * formulation), l'INSEE et la question en sont lus. Les FAITS sont reconstruits ici, côté serveur, depuis
 * les sources canoniques : tout champ `faits`, `driasContext`, `georisquesContext` ou
 * `editorial_base_answer` envoyé par le navigateur est ignoré. Un visiteur ne peut donc faire dire au
 * modèle, ni au contrôle des nombres, une valeur que futur•e ne tient pas de sa source.
 *
 * Une source en échec donne un fait absent (`null`), jamais une valeur par défaut.
 */
export async function contexteDepuisCorps(body: unknown, sources: SourcesFaits): Promise<ContexteQna | null> {
  const b = (body ?? {}) as Record<string, unknown>;
  const tension = (b.tension ?? {}) as Record<string, unknown>;
  if (typeof b.commune !== "string" || !b.commune.trim() || typeof tension.id !== "string" || typeof tension.label !== "string") return null;
  const commune = b.commune.trim().slice(0, 120);
  const insee = typeof b.inseeCode === "string" && /^[0-9AB]{5}$/i.test(b.inseeCode.trim()) ? b.inseeCode.trim() : null;
  const [scenarios, georisques] = insee
    ? await Promise.all([sources.climat(insee).catch(() => null), sources.georisques(insee).catch(() => null)])
    : [null, null];
  return {
    commune,
    tensionId: tension.id,
    questionLabel: (typeof b.freeTextQuestion === "string" && b.freeTextQuestion.trim() ? b.freeTextQuestion : tension.label).slice(0, 300),
    questionSub: typeof tension.sub === "string" ? tension.sub.slice(0, 200) : null,
    faits: construireFaitsCommune(commune, indicatorsDepuisScenarios(scenarios), georisques),
  };
}
