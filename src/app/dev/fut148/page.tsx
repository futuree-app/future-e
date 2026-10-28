// FUT-148 · LA CARTE « FIBRE OPTIQUE » DANS LE VRAI COMPOSANT DE TERRITOIRE. DEV UNIQUEMENT : 404 en production.
//
// La lecture passe par `getFibreCommune` sur la table officielle `data/arcep-fibre.json`, puis par
// `texteFibre` et `QuartierAside`, comme sur /rapport/quartier. Les autres cartes du module ne sont pas
// chargées (aucune source appelée) : seule la fibre est en recette ici.
//
// `?insee=<code>&projet=1` (le lecteur a parlé de fibre ou de télétravail), `insee=panne` (table illisible).
//   /dev/fut148?insee=63072   Chabreloche, 0 %          /dev/fut148?insee=63179   Job, 3 %
//   /dev/fut148?insee=75056   Paris, somme              /dev/fut148?insee=54524   Thumeréville, discordante
//   /dev/fut148?insee=55039   aucun local               /dev/fut148?insee=99999   commune absente
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { getFibreCommune } from "@/lib/fibre-commune";
import { ligneComparateur, texteFibre } from "@/lib/fibre-texte";
import { phrasesNonMesurees } from "@/lib/decision/conclusion-plan";

export const dynamic = "force-dynamic";

const CAS: [string, string][] = [
  ["63072", "Chabreloche"], ["63163", "Gelles"], ["63179", "Job"], ["15138", "Murat (15)"], ["54254", "Haucourt-Moulaine"],
  ["26274", "Rochefourchat"], ["75056", "Paris"], ["75101", "Paris 1er"], ["54524", "Thumeréville"], ["55039", "Beaumont-en-Verdunois"],
  ["99999", "absente"], ["panne", "table illisible"],
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const insee = sp.insee ?? "63072";
  const pourLeProjet = sp.projet === "1";
  const lecture = insee === "panne" ? null : await getFibreCommune(insee);
  const texte = texteFibre(lecture, { pourLeProjet });
  const nom = CAS.find(([c]) => c === insee)?.[1] ?? insee;

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">Banc FUT-148 · {nom}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-10 text-[13px]">
          {CAS.map(([c, n]) => (
            <Link key={c} href={`/dev/fut148?insee=${c}${pourLeProjet ? "&projet=1" : ""}`} className={c === insee ? "text-label" : "text-muted"}>{n}</Link>
          ))}
          <Link href={`/dev/fut148?insee=${insee}${pourLeProjet ? "" : "&projet=1"}`} className="text-info">
            {pourLeProjet ? "Sans projet télétravail" : "Avec projet télétravail"}
          </Link>
        </nav>
        <QuartierAside
          communeName={nom} scenarios={null} georisques={null} territoire={null} vigieau={null} drought={null}
          fibre={{ texte, pourLeProjet }}
        />
        <section className="mt-14 glass rounded-xl px-5 py-4 text-[13px] leading-[1.6] text-muted" id="ou-vivre">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ligne Où vivre (projet qui parle de fibre)</p>
          <p className="text-label/75">{ligneComparateur(lecture)}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mt-5 mb-2">Phrase du dossier pour « fibre »</p>
          <p>{phrasesNonMesurees([{ terme: "fibre", raison: "manque_produit", theme: "connexion" }])[0]}</p>
        </section>
      </div>
    </div>
  );
}
