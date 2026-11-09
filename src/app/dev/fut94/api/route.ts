import { notFound } from "next/navigation";

// FUT-94 · LE STOCKAGE SIMULÉ DU BANC. DEV UNIQUEMENT. Il rend ce que rend la vraie route (même
// forme de réponse), et sait tomber en panne : `?panne=toujours` échoue à chaque envoi,
// `?panne=commentaire` n'échoue que sur l'envoi d'un commentaire (pour la recette « texte conservé »).
let commentaire: string | null = null;

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();
  const panne = new URL(request.url).searchParams.get("panne");
  const corps = (await request.json().catch(() => null)) as { answer?: string; comment?: string | null } | null;
  await new Promise((ok) => setTimeout(ok, 450));
  if (panne === "toujours" || (panne === "commentaire" && corps && "comment" in corps)) {
    return Response.json({ error: "Enregistrement impossible pour le moment.", code: "enregistrement_impossible" }, { status: 503 });
  }
  if (!corps?.answer) return Response.json({ error: "Réponse invalide.", code: "reponse_invalide" }, { status: 400 });
  if ("comment" in corps) commentaire = typeof corps.comment === "string" && corps.comment.trim() ? corps.comment.trim() : null;
  return Response.json({ ok: true, retour: { answer: corps.answer, comment: commentaire } });
}
