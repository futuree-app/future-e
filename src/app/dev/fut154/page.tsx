// FUT-154 · Banc de développement : le Pack Décision tel qu'un acheteur le lit, sur deux projets dont une piste n'a
// aucun compromis établi, et dont la matrice met des communes à égalité. Données réelles de l'index, aucun compte,
// aucun paiement, aucune donnée client, aucun appel Anthropic. 404 en production.
import { notFound } from "next/navigation";
import Link from "next/link";
import { matchProjects, type ParsedProject } from "@/lib/comparateur-vie";
import { PackUnlockedView } from "@/app/(public)/comparateur/pack-decision/PackUnlockedView";

const CAS: { nom: string; titre: string; projet: ParsedProject }[] = [
  {
    nom: "pays-basque",
    titre: "Un faible risque d'inondation, Pyrénées-Atlantiques (Anglet dans le trio, Hendaye en piste)",
    projet: { reformulation: "Un faible risque d'inondation, Pyrénées-Atlantiques", hardConstraints: { departements: ["64"] }, preferences: [{ key: "faible_risque_inondation", weight: 3 }] },
  },
  {
    nom: "fraicheur",
    titre: "Des étés frais et un bon accès aux soins, France entière (Bagnères-de-Bigorre en piste)",
    projet: { reformulation: "Des étés frais et un bon accès aux soins", hardConstraints: {}, preferences: [{ key: "faible_chaleur", weight: 3 }, { key: "acces_soins", weight: 2 }] },
  },
];

export default async function BancFut154({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas: nom } = await searchParams;
  const cas = CAS.find((c) => c.nom === nom) ?? CAS[0]!;
  const o = await matchProjects(cas.projet);
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-154 · index réel, aucune donnée client</p>
      <h1 className="text-[20px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-8 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut154?cas=${c.nom}`} className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      <div id="fut154-vue">
        <PackUnlockedView data={o.comparaisonComplete} trio={o.results.slice(0, 3)} pistes={o.pistes} projetLabel={cas.projet.reformulation} />
      </div>
      <div id="fut154-fin" />
    </main>
  );
}
