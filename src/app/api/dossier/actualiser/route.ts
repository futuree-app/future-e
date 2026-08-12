import "server-only";
import { requireCurrentUser } from "@/lib/user-account";
import { normalizeUserProject } from "@/lib/user-project";
import { readLatestArtifact } from "@/lib/server/decision-artifact-store";
import { prochaineVersionAReserver } from "@/lib/decision/decision-artifact";
import { generateDecisionArtifact } from "@/lib/server/generate-decision-artifact";
import { getDossier } from "@/lib/address-dossier-store";
import { canAccessTerritory } from "@/lib/active-territory";
import { communeParent } from "@/lib/plm";

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
// Le droit sur le territoire, la GRAMMAIRE du scope, la propriété du dossier quand il y en a un, et
// que ce dossier est bien DANS cette commune. La génération est filtrée par `user_id` de bout en
// bout, mais cela ne suffisait pas : voir ci-dessous.
// ════════════════════════════════════════════════════════════════════════════════════════════

/**
 * LA CIBLE DOIT ÊTRE COHÉRENTE PAR CONSTRUCTION (revue du 12/08/2026).
 *
 * La route vérifiait le droit sur `insee` d'un côté, la propriété du dossier de l'autre, sans jamais
 * vérifier que le dossier était dans cette commune. Un lecteur possédant un territoire A et un
 * dossier d'adresse en B pouvait donc demander `{ insee: A, scopeKey: logement:<dossier de B> }` :
 * le générateur recalcule sa clé depuis la CIBLE, si bien que la version lue et la version écrite ne
 * portaient pas la même identité. Rien n'était volé (tout est filtré par `user_id`), mais l'artefact
 * produit décrivait un logement de B rangé sous la commune A, avec les faits communaux de A.
 *
 * Elle acceptait aussi n'importe quel `scopeKey` : `logement:` seul, ou une chaîne libre, ce qui
 * réservait une version sous une clé qu'aucune lecture n'irait jamais chercher.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function dossierIdDuScope(scopeKey: string): { ok: true; dossierId: string | null } | { ok: false } {
  if (scopeKey === "commune") return { ok: true, dossierId: null };
  if (!scopeKey.startsWith("logement:")) return { ok: false };
  const id = scopeKey.slice("logement:".length);
  return UUID.test(id) ? { ok: true, dossierId: id } : { ok: false };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { insee?: string; scopeKey?: string }
    | null;
  // L'IDENTITÉ D'UN ARTEFACT EST LA COMMUNE : un client qui enverrait `69383` doit lire et écrire la
  // même ligne que celui qui envoie `69123`, sans quoi la lecture et la génération se manqueraient.
  // La normalisation est faite ici ET dans le générateur, chacun étant responsable de sa ligne.
  const insee = communeParent(body?.insee?.trim() || null);
  const scopeKey = body?.scopeKey?.trim();
  if (!insee || !scopeKey) return Response.json({ error: "insee et scopeKey requis" }, { status: 400 });

  const scope = dossierIdDuScope(scopeKey);
  if (!scope.ok) return Response.json({ error: "SCOPE_INVALIDE" }, { status: 400 });

  const { supabase, user } = await requireCurrentUser();
  if (!(await canAccessTerritory(supabase, user.id, insee))) {
    return Response.json({ error: "TERRITORY_NOT_ACCESSIBLE" }, { status: 403 });
  }

  const dossierId = scope.dossierId;
  const dossier = dossierId ? await getDossier(supabase, user.id, dossierId) : null;
  if (dossierId && !dossier) {
    return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });
  }
  // `communeParent` des deux côtés : un dossier géocodé sur le 3e arrondissement de Lyon (69383)
  // concerne bien la commune de Lyon (69123), et les deux formes circulent dans le produit.
  if (dossier && communeParent(dossier.insee) !== communeParent(insee)) {
    return Response.json({ error: "DOSSIER_HORS_COMMUNE" }, { status: 400 });
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
  // ── ATTENDRE N'EST PAS ABOUTIR, ÉCHOUER N'EST PAS ATTENDRE (revue du 12/08/2026) ────────────
  // Ces deux cas étaient confondus : une v2 en échec faisait répondre « déjà en cours », et aucune
  // v3 ne naissait jamais. Le lecteur cliquait indéfiniment sur un bouton qui répondait `ok`.
  // `prochaineVersionAReserver` ne rend `null` que pour une génération VRAIMENT en cours.
  // Une génération abandonnée (fonction tuée après la réservation) ne bloque pas éternellement : son
  // bail expire, et la tentative suivante prend le numéro d'après. Voir `BAIL_GENERATION_MS`.
  const version = prochaineVersionAReserver(existant, new Date());
  if (version === null) return Response.json({ ok: true, statut: "en_cours" });
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
  // `skipped` = LA PLACE ÉTAIT DÉJÀ PRISE, pas « c'est fait ». Un second onglet, ou un double clic
  // qui a franchi le garde ci-dessus, a réservé ce numéro entre la lecture et l'insertion. Répondre
  // « abouti » ferait recharger la page sur une version qui n'existe pas encore.
  if (r.status === "skipped") return Response.json({ ok: true, statut: "en_cours" });
  return Response.json({ ok: true, statut: "abouti", version });
}
