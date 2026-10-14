// FUT-93 · LES GESTES DES CRITÈRES DU PROJET ET DU LIEN AVEC LE BIEN, EN MÉMOIRE. DEV UNIQUEMENT.
// Le banc y redirige `/api/project/criterion` (POST) et `/api/dossier/relation` (PATCH) : les vrais
// composants envoient leur vraie requête, rien n'est écrit en base, et le rendu suivant le reflète.
import { notFound } from "next/navigation";
import { etatBanc } from "../../etat";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();
  const corps = (await request.json().catch(() => ({}))) as { action?: string };
  etatBanc().critere = corps.action === "adopter" ? "adopte" : "inspire";
  return Response.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();
  const corps = (await request.json().catch(() => ({}))) as { relation?: string | null; objectif?: string | null };
  etatBanc().lien = true;
  return Response.json({ relation: corps.relation ?? null, objectif: corps.objectif ?? null });
}
