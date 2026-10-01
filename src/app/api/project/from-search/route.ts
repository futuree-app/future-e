// « Reprendre cette recherche pour définir mon projet » (FUT-8, §5.2).
//
// Deux temps, une seule route :
//   { mode: "apercu" }      → ce que futur•e retiendra, ce qui reste propre à la recherche, et ce que le
//                             remplacement abandonnerait. N'écrit rien.
//   { mode: "enregistrer" } → écrit le Projet, seulement si celui que le lecteur a vu dans l'aperçu est
//                             toujours celui en base (`vuUpdatedAt`), sinon 409.
// Le Projet écrit est NEUF : ni condition, ni définition, ni adoption. Sa posture et son intention
// (achat, location) sont gardées : elles ne viennent pas de la recherche et décrivent la situation du
// lecteur, pas ses critères.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { normalizeUserProject, stampUserProject, normalizeUserProjectInput } from "@/lib/user-project";
import { placeDirectory, type ParsedProject } from "@/lib/comparateur-vie";
import { parsedPourLeProjet, apercuReprise } from "@/lib/decision/recherche-vers-projet";
import { ecrireProjetSiInchange } from "@/lib/server/projet-ecriture";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Connexion requise." }, { status: 401 });

  let body: { mode?: unknown; parsed?: unknown; rawText?: unknown; vuUpdatedAt?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }
  const rawText = typeof body.rawText === "string" ? body.rawText.trim().slice(0, 4000) : "";
  const recherche = body.parsed && typeof body.parsed === "object" ? (body.parsed as ParsedProject) : null;
  if (!rawText && !recherche) return NextResponse.json({ error: "Aucune recherche à reprendre." }, { status: 400 });

  const { data: ligne, error: lectureError } = await supabase
    .from("user_profiles").select("user_project").eq("user_id", user.id).maybeSingle();
  if (lectureError) return NextResponse.json({ error: "Lecture impossible." }, { status: 500 });
  const actuel = normalizeUserProject((ligne as { user_project?: unknown } | null)?.user_project ?? null);

  const dir = await placeDirectory();
  const parsed = parsedPourLeProjet(recherche, rawText, (label) => {
    const e = dir.byName(label);
    return e ? { nom: e.nom, tailleVille: e.tailleVille } : null;
  });

  if (body.mode === "apercu") {
    return NextResponse.json({
      ...(parsed && recherche ? apercuReprise(parsed, recherche) : { retenus: [], propresALaRecherche: [] }),
      remplace: actuel ? { texte: actuel.rawText ?? actuel.parsed?.reformulation ?? "", updatedAt: actuel.updatedAt ?? null } : null,
      abandonnes: actuel
        ? { conditions: actuel.conditions?.length ?? 0, precisions: actuel.definitions?.length ?? 0, adoptions: actuel.adoptions?.length ?? 0 }
        : null,
    });
  }
  if (body.mode !== "enregistrer") return NextResponse.json({ error: "Mode inconnu." }, { status: 400 });

  // Le lecteur a validé un aperçu : si le Projet a changé depuis, il n'a pas vu ce qu'il remplace.
  const vu = typeof body.vuUpdatedAt === "string" ? body.vuUpdatedAt : null;
  if ((actuel?.updatedAt ?? null) !== vu) {
    return NextResponse.json({ error: "Votre projet a changé entre-temps. Rechargez la page." }, { status: 409 });
  }
  const input = normalizeUserProjectInput({
    posture: actuel?.posture ?? "recherche", intent: actuel?.intent ?? null, rawText: rawText || null, parsed,
  });
  if (!input) return NextResponse.json({ error: "Projet invalide." }, { status: 400 });
  const project = stampUserProject(input, new Date().toISOString());
  const r = await ecrireProjetSiInchange(supabase, user.id, project, { existe: actuel != null, updatedAt: actuel?.updatedAt ?? null });
  if (r === "conflit") return NextResponse.json({ error: "Votre projet a changé entre-temps. Rechargez la page." }, { status: 409 });
  if (r === "erreur") return NextResponse.json({ error: "Erreur de sauvegarde." }, { status: 500 });
  return NextResponse.json({ success: true, project });
}
