// FUT-138 · LES PRIX IMMOBILIERS DANS LES VRAIS COMPOSANTS, À CHAQUE ÉCHELLE. DEV UNIQUEMENT : 404 en production.
//
//   Territoire : la carte « Prix immobiliers » de la commune (`QuartierAside`).
//   Autour     : le bloc « Les ventes à proximité » (`VentesAutourBloc`), lu par `lireVentesAutour` comme la page.
//   Logement   : aucun prix (une vente à 300 m décrit le voisinage, pas le bien).
// Plus la ligne des cartes Où vivre et comparateur, et le bloc donné aux modèles.
//
// Les ventes à proximité exigent le serveur local de recette (rien n'est publié) :
//   node scripts/dvf-autour/serveur-local.mjs
//   PRIX_AUTOUR_BUCKET=prix-autour PRIX_AUTOUR_STORAGE_URL=http://localhost:54138 npm run dev
//   /dev/fut138?cas=0 … (les points de scripts/dvf-autour/recette.mjs)
import Link from "next/link";
import { notFound } from "next/navigation";
import { QuartierAside } from "@/components/report/QuartierClimatData";
import { VentesAutourBloc } from "@/components/report/VentesAutourBloc";
import { getLecturePrix } from "@/lib/prix-immobiliers-commune";
import { blocPrixPourModele, lignePrixComparateur, textePrix } from "@/lib/prix-immobiliers";
import { lireVentesAutour } from "@/lib/server/prix-autour-tuiles";
import { typeDuLogement } from "@/lib/prix-autour-texte";

export const dynamic = "force-dynamic";

const CAS = [
  { nom: "La Rochelle, appartement (Vieux-Port)", insee: "17300", lat: 46.158, lon: -1.153, dpe: "appartement" },
  { nom: "La Rochelle, maison (Laleu)", insee: "17300", lat: 46.1712, lon: -1.1912, dpe: "maison" },
  { nom: "Lyon 3e (dense)", insee: "69383", lat: 45.7605, lon: 4.857, dpe: "appartement" },
  { nom: "Paris 11e, appartement", insee: "75111", lat: 48.865, lon: 2.378, dpe: "appartement" },
  { nom: "Paris 11e, maison (2 km)", insee: "75111", lat: 48.865, lon: 2.378, dpe: "maison" },
  { nom: "Limite Paris 20e / Bagnolet", insee: "75120", lat: 48.8636, lon: 2.41, dpe: "appartement" },
  { nom: "Limite La Rochelle / Aytré", insee: "17300", lat: 46.1395, lon: -1.135, dpe: "maison" },
  { nom: "Rural, Royère-de-Vassivière", insee: "23165", lat: 45.84, lon: 1.91, dpe: "maison" },
  { nom: "Montagne, Saint-Christophe-en-Oisans", insee: "38375", lat: 44.956, lon: 6.178, dpe: "maison" },
  { nom: "Strasbourg (hors DVF)", insee: "67482", lat: 48.5839, lon: 7.7455, dpe: "appartement" },
  { nom: "La Rochelle, sans diagnostic confirmé", insee: "17300", lat: 46.158, lon: -1.153, dpe: null },
  { nom: "La Rochelle, diagnostic d'immeuble", insee: "17300", lat: 46.158, lon: -1.153, dpe: "immeuble" },
];

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const i = Math.min(CAS.length - 1, Math.max(0, Number((await searchParams).cas ?? 0) || 0));
  const c = CAS[i];
  const lecture = await getLecturePrix(c.insee);
  const autour = await lireVentesAutour({ lat: c.lat, lon: c.lon }, c.insee);
  const type = typeDuLogement(
    c.dpe ? "user_confirmed" : "pending",
    c.dpe ? { type_batiment: c.dpe, methode_dpe: c.dpe === "immeuble" ? "dpe immeuble collectif" : `dpe ${c.dpe} individuel` } : null,
  );

  return (
    <div className="min-h-screen bg-canvas text-label" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="max-w-[1100px] mx-auto px-5 sm:px-7 py-12">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-info mb-4">Banc FUT-138 · {c.nom}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 mb-10 text-[13px]">
          {CAS.map((x, k) => (
            <Link key={x.nom} href={`/dev/fut138?cas=${k}`} className={k === i ? "text-label" : "text-muted"}>{x.nom}</Link>
          ))}
        </nav>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Territoire</p>
        <QuartierAside communeName={lecture.nom} scenarios={null} georisques={null} territoire={null} vigieau={null} drought={null} prix={textePrix(lecture)} />
        <section className="mt-14">
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ghost mb-2">Autour</p>
          {autour === undefined && <p className="text-[13px] text-muted">Lecture non activée : lancer le serveur local de recette (voir l’en-tête de ce fichier).</p>}
          <VentesAutourBloc autour={autour} type={type} />
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
