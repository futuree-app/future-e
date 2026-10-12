// FUT-75 · UNE VRAIE ATTENTE POUR LES PROTOTYPES D'INTERACTION. DEV UNIQUEMENT : 404 en production.
//
// Les prototypes « bouton d'action » et « lecture enrichie » attendent une réponse réseau RÉELLE : un
// succès ne s'affiche qu'à la réception de celle-ci. Cette route la fournit après le délai demandé,
// avec l'issue demandée (`issue=succes|echec|en_cours`). Elle n'écrit rien, n'appelle aucun modèle et
// ne touche à aucune donnée : la « lecture enrichie » qu'elle renvoie est un texte de démonstration,
// signalé comme tel à l'écran.
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request, { params }: { params: Promise<{ action: string }> }) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  const { action } = await params;
  const url = new URL(req.url);
  const delai = Math.min(Math.max(Number(url.searchParams.get("delai")) || 0, 0), 15000);
  const issue = url.searchParams.get("issue") ?? "succes";
  await attendre(delai);
  if (issue === "echec") return NextResponse.json({ statut: "echec" }, { status: 503 });
  if (issue === "en_cours") return NextResponse.json({ statut: "en_cours" });
  if (action === "actualiser") return NextResponse.json({ statut: "ok", version: 4, genereLe: new Date().toISOString() });
  if (action === "lecture") return NextResponse.json({ statut: "ok" });
  return new NextResponse(null, { status: 404 });
}
