// FUT-147 · Banc de développement : la mémoire des incendies enregistrés (BDIFF), sur les vrais composants.
//   - Territoire : la grille de cartes réelle (`QuartierAside`), avec les projections DRIAS et la table BDIFF
//     de la commune, telle que la page /rapport/quartier la reçoit (sans compte ni paiement) ;
//   - Dossier comparatif : la vue achetée réelle (`PackUnlockedView`) sur un trio nommé.
// Données réelles, aucune donnée client, aucun appel Anthropic. 404 en production.
import { notFound } from "next/navigation";
import Link from "next/link";
import { seedComparaison } from "@/lib/comparateur-vie";
import { PackUnlockedView } from "@/app/(public)/comparateur/pack-decision/PackUnlockedView";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { getClimatDataCommune } from "@/lib/drias-json";
import { getMemoireIncendies } from "@/lib/bdiff-incendies-commune";

type Cas = { nom: string; titre: string; territoire?: { insee: string; nom: string }; trio?: string[] };
const CAS: Cas[] = [
  { nom: "brasparts", titre: "Territoire · Brasparts (1 917 ha en 2022)", territoire: { insee: "29016", nom: "Brasparts" } },
  { nom: "gonfaron", titre: "Territoire · Gonfaron (6 832 ha en 2021)", territoire: { insee: "83067", nom: "Gonfaron" } },
  { nom: "garde-freinet", titre: "Territoire · La Garde-Freinet (plus grand feu recensé : 3 ha)", territoire: { insee: "83063", nom: "La Garde-Freinet" } },
  { nom: "lyon", titre: "Territoire · Lyon 3e (aucun départ recensé, couverture incertaine)", territoire: { insee: "69383", nom: "Lyon 3e Arrondissement" } },
  { nom: "paris", titre: "Territoire · Paris 11e (département sans fiche)", territoire: { insee: "75111", nom: "Paris 11e Arrondissement" } },
  { nom: "marseille", titre: "Territoire · Marseille 8e (faits de toute la ville)", territoire: { insee: "13208", nom: "Marseille 8e Arrondissement" } },
  { nom: "creteil", titre: "Territoire · Créteil (campagnes 2024-2025 non renseignées)", territoire: { insee: "94028", nom: "Créteil" } },
  { nom: "pack-finistere", titre: "Dossier comparatif · Brasparts, Pleyben, Landerneau", trio: ["29016", "29162", "29103"] },
  { nom: "pack-maures", titre: "Dossier comparatif · Gonfaron, La Garde-Freinet, Vidauban", trio: ["83067", "83063", "83148"] },
  { nom: "pack-marseille", titre: "Dossier comparatif · Marseille 8e, Aix-en-Provence, Toulon", trio: ["13208", "13001", "83137"] },
];

export default async function BancFut147({ searchParams }: { searchParams: Promise<{ cas?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { cas: nom } = await searchParams;
  const cas = CAS.find((c) => c.nom === nom) ?? CAS[0]!;
  let vue: React.ReactNode = null;
  if (cas.territoire) {
    const [climat, incendies] = await Promise.all([
      getClimatDataCommune(cas.territoire.insee).catch(() => null),
      getMemoireIncendies(cas.territoire.insee),
    ]);
    vue = (
      <QuartierAside
        communeName={cas.territoire.nom}
        scenarios={(climat?.commune.s ?? null) as never}
        georisques={null}
        drought={null}
        territoire={null}
        vigieau={null}
        incendies={incendies}
      />
    );
  } else if (cas.trio) {
    const s = await seedComparaison(cas.trio);
    if (s) vue = <PackUnlockedView data={s.comparaison} trio={s.trio} pistes={[]} projetLabel={cas.titre} />;
  }
  return (
    <main className="relative z-[2] max-w-[1100px] mx-auto px-5 sm:px-7 pt-10 pb-24">
      <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ghost mb-2">Banc FUT-147 · données réelles, aucune donnée client</p>
      <h1 className="text-[20px] font-semibold text-label mb-4">{cas.titre}</h1>
      <nav aria-label="Cas" className="flex flex-wrap gap-3 mb-8 text-[13px]">
        {CAS.map((c) => (
          <Link key={c.nom} href={`/dev/fut147?cas=${c.nom}`} className={c.nom === cas.nom ? "text-label underline" : "text-muted"}>{c.nom}</Link>
        ))}
      </nav>
      <div id="fut147-vue">{vue}</div>
    </main>
  );
}
