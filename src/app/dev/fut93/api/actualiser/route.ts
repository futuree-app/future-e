// FUT-93 · LE CONTRAT D'`/api/dossier/actualiser`, AVEC UNE VRAIE ÉCRITURE EN MÉMOIRE. DEV UNIQUEMENT.
// `abouti` incrémente réellement la version servie du banc (comme la vraie route écrit v N+1 `ready`).
//   ?delai=ms   ?issue=abouti|en_cours|generation   ?retard=n (rendus suivants encore anciens)
//   GET ?reinit=1 : remet le banc à la version 1.
import { notFound } from "next/navigation";
import { etatBanc, reinitialiser } from "../../etat";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();
  if (new URL(request.url).searchParams.get("reinit") === "1") reinitialiser();
  return Response.json(etatBanc());
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") notFound();
  const q = new URL(request.url).searchParams;
  await new Promise((r) => setTimeout(r, Number(q.get("delai") ?? 400)));
  const issue = q.get("issue") ?? "abouti";
  if (issue === "en_cours") return Response.json({ ok: true, statut: "en_cours" });
  if (issue === "generation") return Response.json({ error: "GENERATION_FAILED" }, { status: 502 });
  const e = etatBanc();
  e.version++;
  e.retard = Number(q.get("retard") ?? 0);
  return Response.json({ ok: true, statut: "abouti", version: e.version });
}
