// ════════════════════════════════════════════════════════════════════════════
// AskFuture · barre conversationnelle territoriale
// — POST  : envoie une question, reçoit une réponse structurée (tool use)
// — PATCH : enregistre une réponse à une question de profil
//
// Schéma de sortie strict via Anthropic tool use → pas de parsing texte fragile.
// Périmètre strict : on s'appuie uniquement sur les données futur•e disponibles
// (communes_categorization, sources publiques de l'enrichissement, user_profiles). Si une donnée
// manque, Claude doit le dire explicitement, jamais inventer.
// ════════════════════════════════════════════════════════════════════════════

import Anthropic from "@anthropic-ai/sdk";
import { canAccessTerritory, loadTerritoryClaims } from "@/lib/active-territory";
import { quotaQuestions } from "@/lib/territory-claims";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deriveCategories } from "@/lib/commune-categories";
import { gatherCommuneEnrichment } from "@/lib/commune-enrichment";
import {
  construireReferentiel,
  construireSystemPrompt,
  type ProfileRow,
} from "@/lib/ask/system-prompt";
import { limiteParAdresse, reserverBudgetModele } from "@/lib/server/garde-appels-modele";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ─── Colonnes user_profiles ouvertes à l'enrichissement par la conversation ─
// Les valeurs réelles correspondent à des colonnes existantes du schéma
// user_profiles (cf. supabase/04_init_accounts.sql et 09_init_ask_conversations.sql).
const PROFILE_FIELDS = {
  housing_type:        { type: "text" as const },
  logement_chauffage:  { type: "text" as const },
  logement_isolation:  { type: "text" as const },
  presence_enfants:    { type: "boolean" as const },
  age_enfants:         { type: "text" as const },
  travail_exterieur:   { type: "boolean" as const },
  vehicule_type:       { type: "text" as const },
  health_flags:        { type: "array" as const },
  life_projects:       { type: "array" as const },
};

type ProfileField = keyof typeof PROFILE_FIELDS;

const PROFILE_FIELD_KEYS = Object.keys(PROFILE_FIELDS) as ProfileField[];

// ─── Schéma d'entrée du tool (sortie structurée garantie) ──────────────────
const TOOL_INPUT_SCHEMA = {
  type: "object" as const,
  properties: {
    answer: {
      type: "string",
      description:
        "Réponse à la question, 2 à 4 paragraphes maximum. Vouvoiement strict. Aucun tiret cadratin. Aucun point d'exclamation. Sources citées entre parenthèses en fin de paragraphe concerné (ex : 'Source : DRIAS' ou 'Source : Géorisques, ATMO').",
    },
    out_of_scope: {
      type: "boolean",
      description:
        "true si la question dépasse le périmètre futur•e (logement, santé environnementale, climat local, mobilité, risques, assurance, qualité de vie territoriale). Si true, answer doit suivre exactement le format de refus indiqué dans le system prompt.",
    },
    profile_question: {
      type: "object",
      description:
        "Question optionnelle pour enrichir le profil utilisateur. À n'inclure QUE si l'information manquante améliorerait significativement la prochaine réponse. UNE SEULE par message. Si rien d'utile à collecter, ne pas inclure ce champ du tout.",
      properties: {
        field: {
          type: "string",
          enum: PROFILE_FIELD_KEYS,
          description: "Champ du profil utilisateur à renseigner.",
        },
        contextualization: {
          type: "string",
          description:
            "Phrase courte qui explique pourquoi cette information est demandée. Obligatoire : la collecte doit toujours être transparente.",
        },
        question: {
          type: "string",
          description: "La question elle-même, courte, neutre, vouvoyée.",
        },
        options: {
          type: "array",
          items: { type: "string" },
          description: "Options de réponse rapides proposées à l'utilisateur.",
        },
      },
      required: ["field", "contextualization", "question", "options"],
    },
  },
  required: ["answer", "out_of_scope"],
};

type ProfileQuestion = {
  field: ProfileField;
  contextualization: string;
  question: string;
  options: string[];
};

type ToolInput = {
  answer: string;
  out_of_scope: boolean;
  profile_question?: ProfileQuestion;
};

// ─── System prompt ─────────────────────────────────────────────────────────
// Le prompt de base, le référentiel, les blocs d'enrichissement, le profil et leur assemblage vivent dans
// src/lib/ask/system-prompt.ts (fonctions pures, testées) : ce qui part chez Anthropic s'y construit.

// ─── Référentiel interne : identité et catégories de la commune ────────────
// FUT-16 : `communes_tension` n'est plus lue. Ses notes « sur 100 » ne font plus partie de ce que le
// modèle reçoit ; les mesures correspondantes sont dans les blocs DRIAS et ADEME.
type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

async function lireReferentielInterne(insee: string, supabase: SupabaseServer): Promise<string> {
  const { data: catRow } = await supabase
    .from("communes_categorization")
    .select("commune_name, insee_code, categories")
    .eq("insee_code", insee)
    .maybeSingle();

  const categories =
    catRow?.categories && catRow.categories.length > 0
      ? catRow.categories
      : deriveCategories(insee);

  return construireReferentiel({
    insee,
    nomCommune: catRow?.commune_name ?? null,
    categories,
  });
}

// ─── POST : génération d'une réponse ───────────────────────────────────────
export async function POST(request: NextRequest) {
  // LA LIMITE PAR ADRESSE, EN TÊTE : elle ne consomme aucun budget, elle refuse un débit
  // anormal avant tout travail. Le budget, lui, se réserve juste avant l'appel payant.
  const tropVite = limiteParAdresse(request);
  if (tropVite) return tropVite;

  try {
    const body = await request.json();
    const {
      messages,
      communeInsee,
      communeName,
      sessionId,
    } = body as {
      messages?: Array<{ role: "user" | "assistant"; content: string }>;
      communeInsee?: string;
      communeName?: string;
      sessionId?: string;
    };

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages requis." }, { status: 400 });
    }
    if (!communeInsee || !communeName) {
      return NextResponse.json({ error: "Commune requise." }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requis." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    const { data: account } = await supabase
      .from("user_accounts")
      .select("plan")
      .eq("user_id", user.id)
      .maybeSingle();

    const plan = account?.plan ?? "free";

    if (plan === "free") {
      return NextResponse.json(
        { error: "AskFuture est réservé aux détenteurs d'un rapport." },
        { status: 403 },
      );
    }

    if (plan === "one_shot") {
      // Pool unique proportionnel aux droits : trois questions par TERRITOIRE débloqué, comptées
      // globalement. Le calcul vit dans `territory-claims`, avec ses tests, et il est partagé par
      // cette route ET par les deux points de montage d'AskFuture : un quota calculé à deux
      // endroits est un quota qui diverge, ce qui venait justement d'arriver (l'API en autorisait
      // six pendant que l'écran masquait le formulaire au bout de trois).
      const quota = quotaQuestions(await loadTerritoryClaims(supabase, user.id));
      const { count: askedCount } = await supabase
        .from("ask_conversations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("role", "user");
      if ((askedCount ?? 0) >= quota) {
        return NextResponse.json(
          { error: `Quota de ${quota} questions atteint. Passez au Fil pour un accès illimité.` },
          { status: 403 },
        );
      }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    // Gating territoire-aware (cf. resolveReadableTerritory / GATING_TERRITOIRE.md).
    // Le communeInsee vient du client : on n'accepte de répondre que sur la résidence ou un
    // territoire réellement ouvert. Sinon 403 : l'API ne doit pas devenir une porte dérobée vers un
    // rapport jamais acheté.
    //
    // ── LE DROIT VIENT D'UN GRANT *OU* D'UN DOSSIER (revue du 11/08/2026) ────────────────────
    // Ce garde n'acceptait qu'un `report_grant`. Or l'achat d'un dossier d'adresse n'en crée AUCUN :
    // le droit territorial se déduit de l'existence du dossier lui-même (cf. le webhook, et
    // `canAccessTerritory`). Un acheteur à 39 € dont le seul droit sur Nantes vient de son dossier
    // voyait donc AskFuture lui proposer Nantes, puis répondre 403 à sa question. L'interface et
    // l'API appliquaient deux contrats différents pour le même produit.
    //
    // `canAccessTerritory` est le contrat unique, celui que tous les écrans utilisent déjà. La
    // résidence garde son traitement propre : elle ouvre le gratuit sans rien avoir acheté.
    const askInsee = communeInsee.trim().toUpperCase();
    const rawResidence = (profile as Record<string, unknown> | null)?.home_insee_code;
    const residenceInsee =
      typeof rawResidence === "string" ? rawResidence.trim().toUpperCase() : "";
    if (askInsee !== residenceInsee && !(await canAccessTerritory(supabase, user.id, askInsee))) {
      return NextResponse.json(
        { error: "Ce territoire n'est pas débloqué sur votre compte." },
        { status: 403 },
      );
    }

    // Les 4 sources tournent en parallèle. Supabase (rapide, déjà ouvert)
    // + ADEME/DRIAS/Hub'Eau (caches framework côté lib).
    const [referentiel, enrichment] = await Promise.all([
      lireReferentielInterne(communeInsee, supabase),
      gatherCommuneEnrichment(communeInsee),
    ]);
    const systemPrompt = construireSystemPrompt({
      communeName,
      communeInsee,
      referentiel,
      enrichment,
      profile: profile as ProfileRow,
    });

    // LE BUDGET SE RÉSERVE ICI, et jamais en tête de route : une réponse de cache ne coûte
    // rien, et une requête invalide ne doit pas pouvoir vider le quota du jour.
    const budget = await reserverBudgetModele("assistant");
    if (budget) return budget;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      // Synthèse longue et payante : on vise la qualité sans subir l'effort
      // "high" par défaut de Sonnet 4.6 (trop lent). effort medium + thinking
      // coupé = compromis qualité/latence pour le contenu payant.
      output_config: { effort: "medium" },
      thinking: { type: "disabled" },
      system: systemPrompt,
      tools: [
        {
          name: "futuree_reply",
          description:
            "Renvoie la réponse structurée de futur•e à la question de l'utilisateur.",
          input_schema: TOOL_INPUT_SCHEMA,
        },
      ],
      tool_choice: { type: "tool", name: "futuree_reply" },
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const toolBlock = response.content.find((b) => b.type === "tool_use");
    if (!toolBlock || toolBlock.type !== "tool_use") {
      return NextResponse.json(
        { error: "Réponse Claude invalide (tool_use manquant)." },
        { status: 500 },
      );
    }

    const parsed = toolBlock.input as ToolInput;

    const lastUserMessage = messages[messages.length - 1];
    const { error: insertError } = await supabase
      .from("ask_conversations")
      .insert([
        {
          user_id: user.id,
          session_id: sessionId,
          role: "user",
          content: lastUserMessage.content,
          commune_insee: communeInsee,
        },
        {
          user_id: user.id,
          session_id: sessionId,
          role: "assistant",
          content: parsed.answer,
          commune_insee: communeInsee,
        },
      ]);

    if (insertError) {
      // On loggue mais on n'échoue pas la réponse à l'utilisateur — la réponse
      // de Claude reste valable même si l'historique n'a pas pu être persisté.
      console.error("[ask] conversation insert error:", insertError);
    }

    return NextResponse.json({
      answer: parsed.answer,
      outOfScope: parsed.out_of_scope,
      profileQuestion: parsed.profile_question ?? null,
    });
  } catch (error) {
    console.error("[ask] POST error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la réponse." },
      { status: 500 },
    );
  }
}

// ─── PATCH : enregistre une réponse à une question de profil ───────────────
const CHAUFFAGE_VALUES = ["gaz", "electrique", "pompe_chaleur", "fioul", "bois", "autre"] as const;
const VEHICULE_VALUES = ["thermique", "hybride", "electrique", "aucun"] as const;
const ISOLATION_VALUES = ["bonne", "moyenne", "mauvaise", "inconnue"] as const;

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\s+/g, "_");
}

function coerceChauffage(raw: string): string | null {
  const n = normalizeText(raw);
  if (n.includes("pompe")) return "pompe_chaleur";
  if (CHAUFFAGE_VALUES.includes(n as (typeof CHAUFFAGE_VALUES)[number])) return n;
  if (n === "electricite") return "electrique";
  return null;
}

function coerceVehicule(raw: string): string | null {
  const n = normalizeText(raw);
  return VEHICULE_VALUES.includes(n as (typeof VEHICULE_VALUES)[number]) ? n : null;
}

function coerceIsolation(raw: string): string | null {
  const n = normalizeText(raw);
  return ISOLATION_VALUES.includes(n as (typeof ISOLATION_VALUES)[number]) ? n : null;
}

function coerceBoolean(raw: unknown): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw !== "string") return null;
  const n = raw.trim().toLowerCase();
  if (["oui", "true", "yes", "1"].includes(n)) return true;
  if (["non", "false", "no", "0"].includes(n)) return false;
  return null;
}

export async function PATCH(request: NextRequest) {
  try {
    const { field, value } = (await request.json()) as {
      field?: string;
      value?: unknown;
    };

    if (typeof field !== "string" || !(field in PROFILE_FIELDS)) {
      return NextResponse.json({ error: "Champ non autorisé." }, { status: 400 });
    }
    const config = PROFILE_FIELDS[field as ProfileField];

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
    }

    let normalized: unknown = null;

    if (config.type === "boolean") {
      const v = coerceBoolean(value);
      if (v === null) {
        return NextResponse.json({ error: "Valeur booléenne invalide." }, { status: 400 });
      }
      normalized = v;
    } else if (config.type === "array") {
      // Pour les jsonb arrays (health_flags, life_projects) : on fusionne
      // avec la valeur existante pour ne jamais écraser silencieusement.
      const incoming = Array.isArray(value)
        ? value.map(String)
        : typeof value === "string" && value.trim().length > 0
          ? [value]
          : null;
      if (!incoming) {
        return NextResponse.json({ error: "Tableau ou chaîne attendue." }, { status: 400 });
      }
      const { data: existing } = await supabase
        .from("user_profiles")
        .select(field)
        .eq("user_id", user.id)
        .maybeSingle();
      const currentRaw = (existing as Record<string, unknown> | null)?.[field];
      const current = Array.isArray(currentRaw) ? (currentRaw as string[]) : [];
      normalized = Array.from(new Set([...current, ...incoming]));
    } else {
      if (typeof value !== "string" || value.trim().length === 0) {
        return NextResponse.json({ error: "Chaîne attendue." }, { status: 400 });
      }
      if (field === "logement_chauffage") {
        const coerced = coerceChauffage(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur de chauffage invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else if (field === "vehicule_type") {
        const coerced = coerceVehicule(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur de véhicule invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else if (field === "logement_isolation") {
        const coerced = coerceIsolation(value);
        if (!coerced) {
          return NextResponse.json({ error: "Valeur d'isolation invalide." }, { status: 400 });
        }
        normalized = coerced;
      } else {
        normalized = value.trim();
      }
    }

    const { error } = await supabase
      .from("user_profiles")
      .update({ [field]: normalized, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);

    if (error) {
      console.error("[ask] PATCH update error:", error);
      return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[ask] PATCH error:", error);
    return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  }
}
