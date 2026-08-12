import "server-only";
import { requireCurrentUser } from "@/lib/user-account";
import { getDossier } from "@/lib/address-dossier-store";
import { marquerDossierActif } from "@/lib/server/marquer-dossier-actif";

export const dynamic = "force-dynamic";

// ════════════════════════════════════════════════════════════════════════════════════════════
// « J'AI VRAIMENT OUVERT CE BIEN. »
//
// ── POURQUOI UNE ROUTE, ET PAS `after()` DANS LA PAGE (revue du 11/08/2026) ──────────────────
// L'écriture vivait dans `after()`, côté serveur, au rendu de la page Logement ou Autour. Or
// `after()` s'exécute même quand la réponse n'aboutit pas : un préchargement RSC, une navigation
// abandonnée ou deux onglets écrivaient dans un ordre qui n'était pas celui de l'intention. Une
// préférence de navigation ne peut pas dépendre de l'ordre de fin de deux réponses serveur.
//
// Le client appelle donc cette route APRÈS montage effectif. Le geste écrit est alors celui que le
// lecteur a réellement fait : sa page s'est affichée.
//
// ── CE QU'ELLE VÉRIFIE ───────────────────────────────────────────────────────────────────────
// La propriété du dossier, par `getDossier`, filtré par `user_id` et par la RLS. Un identifiant
// fabriqué ne désigne rien : au pire, un lecteur repose son propre contexte sur son propre bien.
// Ce n'est pas un droit, c'est un souvenir.
// ════════════════════════════════════════════════════════════════════════════════════════════

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { dossierId?: string } | null;
  const dossierId = body?.dossierId;
  if (!dossierId) return Response.json({ error: "dossierId requis" }, { status: 400 });

  const { supabase, user } = await requireCurrentUser();
  const dossier = await getDossier(supabase, user.id, dossierId);
  // Un dossier qui n'existe pas, ne lui appartient pas, ou dont l'accès est révoqué : on ne dit pas
  // lequel des trois. Le contexte de lecture ne se pose pas, et rien n'est révélé.
  if (!dossier) return Response.json({ error: "DOSSIER_NOT_ACCESSIBLE" }, { status: 403 });

  await marquerDossierActif(supabase, user.id, dossier);
  return Response.json({ ok: true });
}
