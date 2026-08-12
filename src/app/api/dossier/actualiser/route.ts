import "server-only";
import { requireCurrentUser } from "@/lib/user-account";
import { normalizeUserProject } from "@/lib/user-project";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { getDossier } from "@/lib/address-dossier-store";
import { canAccessTerritory } from "@/lib/active-territory";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ════════════════════════════════════════════════════════════════════════════════════════════
// « METTRE À JOUR L'ANALYSE », DEMANDÉ EXPLICITEMENT.
//
// ── LA DOCTRINE QUI GOUVERNE CETTE ROUTE ─────────────────────────────────────────────────────
// Une pièce que le lecteur DÉPOSE (un diagnostic) recalcule seule : il attend qu'elle compte. Un
// PROJET qu'il change se demande : l'analyse achetée répondait à une autre question, et la refaire
// sans le dire effacerait une décision sur laquelle il a peut-être déjà agi.
//
// ── CE QU'ELLE PRODUIT ───────────────────────────────────────────────────────────────────────
// Une version n+1. La précédente reste en base, lisible, et c'est elle qui portait la décision.
// `claimArtifactSlot` réserve la place sur la contrainte unique de la table : un double clic, un
// rechargement ou deux onglets ne peuvent pas créer deux versions, le perdant s'arrête tout seul.
//
// ── CE QU'ELLE VÉRIFIE ───────────────────────────────────────────────────────────────────────
// Le droit sur le territoire, et la propriété du dossier quand il y en a un. Un `scopeKey`
// fabriqué ne désigne rien : la génération est filtrée par `user_id` de bout en bout.
// ════════════════════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { insee?: string; scopeKey?: string }
    | null;
  const insee = body?.insee?.trim();
  const scopeKey = body?.scopeKey?.trim();
  if (!insee || !scopeKey) return Response.json({ error: "insee et scopeKey requis" }, { status: 400 });

  const { supabase, user } = await requireCurrentUser();
  if (!(await canAccessTerritory(supabase, user.id, insee))) {
    return Response.json({ error: "TERRITORY_NOT_ACCESSIBLE" }, { status: 403 });
  }

  const dossierId = scopeKey.startsWith("logement:") ? scopeKey.slice("logement:".length) : null;
  const dossier = dossierId ? await getDossier(supabase, user.id, dossierId) : null;
  if (dossierId && !dossier) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_project")
    .eq("user_id", user.id)
    .maybeSingle();
  const project = normalizeUserProject((profile as { user_project?: unknown } | null)?.user_project ?? null);
  // SANS PROJET, RIEN À METTRE À JOUR : le dossier de décision se construit à partir de lui, et une
  // version produite sans projet vaudrait moins que celle qu'on remplacerait.
  if (!project) return Response.json({ error: "PROJECT_MISSING" }, { status: 409 });

  const existant = await readLatestArtifact(supabase, user.id, insee, scopeKey).catch(() => null);
  // Une génération déjà en cours (v2 réservée par un autre onglet) : on ne la double pas.
  if (existant?.versionPlusRecente) return Response.json({ ok: true, deja: true });

  const version = (existant?.version ?? 0) + 1;
  const cible = dossier
    ? {
        kind: "adresse" as const,
        insee,
        dossierId: dossier.id,
        address: {
          id: dossier.ban_id, label: dossier.address_label, city: dossier.city,
          citycode: dossier.insee, postcode: dossier.postcode,
          latitude: dossier.latitude, longitude: dossier.longitude,
        },
        savedDpe: dossier.selected_dpe_snapshot,
      }
    : { kind: "commune" as const, insee };

  const r = await generateDecisionArtifact(supabase, user.id, project, cible, version);
  if (r.status === "failed") {
    // LA VERSION PRÉCÉDENTE RESTE SERVIE. `readLatestArtifact` ne rend que la dernière version
    // SERVABLE : une v2 marquée en échec ne masque pas la v1 sur laquelle le lecteur a décidé.
    console.error("[actualiser] génération échouée", { userId: user.id, insee, scopeKey, r });
    return Response.json({ error: "GENERATION_FAILED" }, { status: 502 });
  }
  return Response.json({ ok: true, version });
}
