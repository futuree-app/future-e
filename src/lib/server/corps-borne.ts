// FUT-155 · LE CORPS D'UNE REQUÊTE QUI MÈNE AU MODÈLE EST BORNÉ, SUR LES OCTETS RÉELLEMENT REÇUS.
//
// Le budget du jour compte les appels, pas les jetons (`garde-appels-modele.ts`). Sans borne, un seul appel portait
// des centaines de kilo-octets vers le modèle (contre-épreuve du 29/10 : 419 ko, contre ~20 ko d'ordinaire, consigne
// comprise). La borne se lit en tête de route, après la limite par adresse et avant tout budget ou appel payant.
//
// `Content-Length` n'est qu'une déclaration : il sert à refuser tôt un corps annoncé trop gros, jamais à en accepter
// un. Le flux est compté octet par octet et coupé dès que la borne est franchie.

/** 32 Kio (validé par le porteur le 29/10/2026). Les corps légitimes les plus lourds en sont loin (cf. test FUT-155). */
export const CORPS_MAX_OCTETS = 32 * 1024;

export type CorpsLu = { texte: string } | { tropGros: true };

export async function lireCorpsBorne(request: Request, max = CORPS_MAX_OCTETS): Promise<CorpsLu> {
  const annonce = Number(request.headers.get("content-length"));
  if (Number.isFinite(annonce) && annonce > max) return { tropGros: true };
  if (!request.body) return { texte: "" };
  const lecteur = request.body.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await lecteur.cancel().catch(() => {});
      return { tropGros: true };
    }
    morceaux.push(value);
  }
  const octets = new Uint8Array(total);
  let i = 0;
  for (const m of morceaux) { octets.set(m, i); i += m.byteLength; }
  return { texte: new TextDecoder().decode(octets) };
}
