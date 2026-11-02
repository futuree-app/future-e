// FUT-138 · LES PRIX IMMOBILIERS DANS LES VRAIS COMPOSANTS. DEV UNIQUEMENT : 404 en production.
//
// Une seule lecture (`getLecturePrix`, l'index régénéré), quatre surfaces : la carte de Territoire
// (`QuartierAside`), la section du dossier Logement (`MarcheLocalSection`), la ligne des cartes Où vivre et
// comparateur, le bloc donné aux modèles (AskFuture, réponses du comparateur). Aucune autre source chargée.
//
//   /dev/fut138?insee=17300  La Rochelle        /dev/fut138?insee=08053  Bazeilles (commune nouvelle 2024)
//   /dev/fut138?insee=85165  L'Oie (rétablie)    /dev/fut138?insee=67482  Strasbourg (hors DVF)
//   /dev/fut138?insee=75111  Paris 11e           /dev/fut138?insee=75056  Paris, ville entière
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { MarcheLocalSection } from "@/components/report/logement/MarcheLocalSection";
import { getLecturePrix } from "@/lib/prix-immobiliers-commune";
import { blocPrixPourModele, lignePrixComparateur, textePrix } from "@/lib/prix-immobiliers";

export const dynamic = "force-dynamic";

const CAS: [string, string][] = [
  ["17300", "La Rochelle"], ["08053", "Bazeilles"], ["49126", "Orée d'Anjou"], ["93066", "Saint-Denis"], ["85165", "L'Oie"],
  ["85084", "Essarts-en-Bocage"], ["67482", "Strasbourg"], ["57463", "Metz"], ["75111", "Paris 11e"], ["75056", "Paris"], ["99999", "absente"],
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const insee = (await searchParams).insee ?? "17300";
  const lecture = await getLecturePrix(insee);
  const texte = textePrix(lecture);

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">Banc FUT-138 · {lecture.nom}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-10 text-[13px]">
          {CAS.map(([c, n]) => (
            <Link key={c} href={`/dev/fut138?insee=${c}`} className={c === insee ? "text-label" : "text-muted"}>{n}</Link>
          ))}
        </nav>
        <QuartierAside communeName={lecture.nom} scenarios={null} georisques={null} territoire={null} vigieau={null} drought={null} prix={texte} />
        <section className="mt-14">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Dossier Logement</p>
          <MarcheLocalSection texte={texte} />
        </section>
        <section className="mt-14 glass rounded-xl px-5 py-4 text-[13px] leading-[1.6] text-muted">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Ligne Où vivre et comparateur</p>
          <p className="text-label/75">{lignePrixComparateur(lecture)}</p>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mt-5 mb-2">Bloc donné aux modèles</p>
          <pre className="whitespace-pre-wrap text-[12px]">{blocPrixPourModele(lecture)}</pre>
        </section>
      </div>
    </div>
  );
}
