// FUT-167 · Banc de développement : la carte « Santé environnementale » du module Territoire, sur les vrais
// composants (`QuartierAside`) et les vraies lectures (index national, sites Seveso, radon Géorisques), telle que
// la page /rapport/quartier la reçoit, sans compte ni paiement. Aucune donnée client. 404 en production.
import { notFound } from "next/navigation";
import Link from "next/link";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { getSanteEnvironnementale } from "@/lib/server/sante-environnementale";

type Cas = { nom: string; titre: string; insee: string; commune: string; adresse?: boolean };
const CAS: Cas[] = [
  { nom: "feyzin", titre: "Feyzin : raffinerie à 900 m, NO₂ au-delà de la recommandation OMS", insee: "69276", commune: "Feyzin" },
  { nom: "lille", titre: "Lille : NO₂ 15,9 µg/m³ (la preuve air du dossier)", insee: "59350", commune: "Lille" },
  { nom: "radon", titre: "Commune 16016 : radon en catégorie 3, aucun Seveso à 8 km", insee: "16016", commune: "Commune 16016" },
  { nom: "larochelle-adresse", titre: "La Rochelle, lecteur avec une adresse : les distances partent du centre", insee: "17300", commune: "La Rochelle", adresse: true },
  { nom: "paris", titre: "Paris, au grain de la ville : arrondissement par arrondissement", insee: "75056", commune: "Paris" },
  { nom: "lyon9", titre: "Lyon 9e arrondissement : radon en catégorie 3", insee: "69389", commune: "Lyon 9e Arrondissement" },
];

export default async function BancFut167({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas: nom } = await searchParams;
  const cas = CAS.find((c) => c.nom === nom) ?? CAS[0]!;
  const sante = await getSanteEnvironnementale(cas.insee, cas.commune, { adresseConnue: cas.adresse === true });
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-167 · données réelles, aucune donnée client</p>
      <h1 className="text-[20px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-8 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut167?cas=${c.nom}`} className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      <div id="fut167-vue">
        <QuartierAside communeName={cas.commune} scenarios={null} georisques={null} drought={null} territoire={null} vigieau={null} sante={sante} />
      </div>
    </main>
  );
}
