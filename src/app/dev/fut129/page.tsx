// FUT-129 · Banc de développement : le Dossier comparatif tel qu'un acheteur le rouvre, avec la ligne
// « Inondation » factuelle et les avertissements des comparatifs vendus avant la nouvelle lecture.
// Données réelles de l'index, aucun compte, aucun paiement, aucune donnée client, aucun appel Anthropic.
// 404 en production.
import { notFound } from "next/navigation";
import Link from "next/link";
import { matchProjects, rejouerPack, seedComparaison, type ParsedProject } from "@/lib/comparateur-vie";
import { avertissementPackAnterieur, AVERTISSEMENT_TRIO_RECOMPOSE } from "@/lib/comparateur/inondation-historique";
import { PackUnlockedView } from "@/app/(public)/comparateur/pack-decision/PackUnlockedView";

const PROJET: ParsedProject = {
  reformulation: "Un faible risque d'inondation et un bon accès aux soins, en Charente-Maritime",
  hardConstraints: { departements: ["17"] },
  preferences: [{ key: "faible_risque_inondation", weight: 3 }, { key: "acces_soins", weight: 2 }],
};

type Cas = { nom: string; titre: string };
const CAS: Cas[] = [
  { nom: "pack-ancien", titre: "Dossier comparatif acheté le 1er septembre 2026, avant la nouvelle lecture, trio d'alors : Yves, Île-d'Aix, La Couarde-sur-Mer" },
  { nom: "pack-actuel", titre: "Dossier comparatif rejoué aujourd'hui sur le même projet (trio du classement actuel)" },
  { nom: "choix", titre: "Comparatif de communes nommées : Charron, La Rochelle, Grenoble" },
];

export default async function BancFut129({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas: nom } = await searchParams;
  const cas = CAS.find((c) => c.nom === nom) ?? CAS[0]!;
  let vue: React.ReactNode = null;
  if (cas.nom === "choix") {
    const s = await seedComparaison(["17091", "17300", "38185"]);
    if (s) vue = <PackUnlockedView data={s.comparaison} trio={s.trio} pistes={[]} projetLabel="Charron, La Rochelle, Grenoble" />;
  } else {
    const insees = cas.nom === "pack-ancien"
      ? ["17483", "17004", "17121"]
      : (await matchProjects(PROJET)).results.slice(0, 3).map((x) => x.insee);
    const r = await rejouerPack(PROJET, insees);
    if (r) {
      const avertissements = [
        cas.nom === "pack-ancien" ? avertissementPackAnterieur("2026-09-01T10:00:00Z") : null,
        r.trioRecompose && cas.nom === "pack-ancien" ? AVERTISSEMENT_TRIO_RECOMPOSE : null,
      ].filter((x): x is string => x != null);
      vue = <PackUnlockedView data={r.data} trio={r.trio} pistes={r.pistes} projetLabel="faible risque d'inondation, soins, Charente-Maritime" avertissements={avertissements} />;
    }
  }
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-129 · index réel, aucune donnée client</p>
      <h1 className="text-[20px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-8 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut129?cas=${c.nom}`} className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      <div id="fut129-vue">{vue}</div>
      <div id="fut129-fin" />
    </main>
  );
}
