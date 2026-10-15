import Link from "next/link";
import Navbar from "@/components/Navbar";

// HOTFIX FUT-104 · CE QUE LIT UN VISITEUR À LA PLACE D'UNE PROJECTION FAUSSE.
//
// Rendu par les `not-found.tsx` des pages `/chaleur/[insee_code]` et `/inondation/[insee_code]`, avec un statut 404,
// quand le code est ultramarin : ces pages reposent sur DRIAS-TRACC, qui ne couvre que l'Hexagone et la Corse, et
// leurs anciennes valeurs ultramarines venaient de points de grille métropolitains. Aucun chiffre, aucun rang, aucun
// appel à acheter un dossier : une absence dite clairement vaut mieux qu'une valeur fausse.
const CSS = `
  .pi{position:relative;z-index:2;max-width:860px;margin:0 auto;padding:72px 28px 120px;}
  .pi-eyebrow{font-family:var(--font-mono);font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--fg-4);margin:0 0 18px;}
  .pi h1{font-family:var(--font-serif);font-weight:var(--weight-title);font-size:clamp(30px,5vw,44px);line-height:1.12;letter-spacing:-0.02em;color:var(--fg-1);margin:0 0 22px;}
  .pi p{font-size:17px;color:var(--fg-3);line-height:1.75;margin:0 0 16px;max-width:680px;}
  .pi a{color:var(--fg-1);}
`;

export default function ProjectionsIndisponibles({ retour, libelleRetour }: { retour: string; libelleRetour: string }) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <Navbar />
      <main className="pi">
        <div className="pi-eyebrow">Projections climatiques</div>
        <h1>Pas encore de projection fiable pour ce territoire</h1>
        <p>
          Les projections de cette page proviennent de DRIAS-TRACC (Météo-France), qui couvre l&apos;Hexagone et la
          Corse. Elles ne s&apos;appliquent pas aux territoires d&apos;outre-mer, dont le climat fait l&apos;objet de
          projections propres, avec leurs seuils et leurs horizons.
        </p>
        <p>Ces projections ultramarines sont en cours d&apos;intégration. Rien n&apos;est affiché d&apos;ici là.</p>
        <p>
          <Link href={retour}>{libelleRetour}</Link>
        </p>
      </main>
    </>
  );
}
