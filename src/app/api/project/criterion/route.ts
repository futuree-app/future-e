// LES GESTES DU LECTEUR SUR UN CRITÈRE (FUT-8, §7) : préciser, confirmer, garder un critère inspiré
// d'une ancre, et leurs retraits. Le navigateur générique (PATCH /api/profile) n'écrit jamais ces
// structures ; elles ne s'écrivent qu'ici, geste par geste.
//
// Déroulé : relire le Projet en base → appliquer le geste (lib pure criterion-gestes.ts, qui vérifie
// l'élément, l'empreinte `seen`, la précision) → écrire seulement si le Projet n'a pas changé depuis la
// lecture (garde SQL sur updatedAt). Toute divergence → 409, le client recharge.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUserProject } from "@/lib/user-project";
import { appliquerGeste, lireGeste } from "@/lib/decision/criterion-gestes";
import { ecrireProjetSiInchange } from "@/lib/server/projet-ecriture";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  let geste;
  try {
    geste = lireGeste(await request.json());
  } catch {
    geste = null;
  }
  if (!geste) return NextResponse.json({ error: "Geste invalide." }, { status: 400 });

  const { data: ligne, error: lectureError } = await supabase
    .from("user_profiles").select("user_project").eq("user_id", user.id).maybeSingle();
  if (lectureError) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  const actuel = normalizeUserProject((ligne as { user_project?: unknown } | null)?.user_project ?? null);
  if (!actuel) return NextResponse.json({ error: "Aucun projet enregistré." }, { status: 404 });

  const now = new Date().toISOString();
  const r = appliquerGeste(actuel, geste, now);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });

  const project = { ...r.project, schemaVersion: 3 as const, updatedAt: now };
  const ecrit = await ecrireProjetSiInchange(supabase, user.id, project, { existe: true, updatedAt: actuel.updatedAt ?? null });
  if (ecrit === "conflit") return NextResponse.json({ error: "Votre projet a changé entre-temps. Rechargez la page." }, { status: 409 });
  if (ecrit === "erreur") return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  return NextResponse.json({ success: true, project });
}
