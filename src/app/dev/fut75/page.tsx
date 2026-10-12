// FUT-75 · L'ATELIER DU MOUVEMENT : trois prototypes « Le relevé », sur des données réelles et publiques.
// DEV UNIQUEMENT : 404 en production. Aucun appel au modèle, aucune écriture.
//
// Prototype A : le repère « Explorer le dossier » (ouverture tracée, réticule, recul).
// Prototype B : les horizons 2030 / 2050 / 2100 (curseur, trace), médianes DRIAS-TRACC.
// Prototype C : le chemin d'un constat, du fait à la décision (pas à pas, d'un trait, statique).
// Réglages reproductibles par l'URL : a, am, ae, ap · b, bm, bc, bh · c, cm, ce (voir `Banc`).
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { Banc, type ReglagesBanc } from "@/components/prototypes/fut75/Banc";
import { apercuParEchelle, cheminConfortEte, COMMUNES_HORIZONS, etatsDuRepere, mesuresHorizons } from "./donnees";

export const dynamic = "force-dynamic";

export default async function AtelierFut75({ searchParams }: { searchParams: Promise<ReglagesBanc> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const sp = await searchParams;
  const [adresse, commune, chemin, apercu, ...horizons] = await Promise.all([
    etatsDuRepere("adresse"), etatsDuRepere("commune"), cheminConfortEte(), apercuParEchelle(),
    ...COMMUNES_HORIZONS.map(async (c) => ({ ...c, mesures: await mesuresHorizons(c.insee) })),
  ]);
  return (
    <main className={s.releve}>
      <Navbar />
      <BandeauPrototype>
        Atelier FUT-75 · le mouvement de « Le relevé » · données publiques : hôtel de ville de Nîmes, médianes
        DRIAS-TRACC de trois communes, projet de test · <Link href="/dev/fut92">gabarit de /rapport</Link>
      </BandeauPrototype>
      <div className={s.feuille}>
        <header className="grid gap-3 pt-10 pb-6">
          <h1 className="text-[34px] leading-[1.08] text-label" style={{ fontVariationSettings: '"wdth" 118', fontWeight: 500 }}>Le geste du relevé</h1>
          <p className="text-[16px] leading-[1.62] text-muted">
            Le repère bouge, la donnée reste. Trois prototypes pour rendre perceptibles l&apos;échelle, le
            temps et le chemin d&apos;une décision, sans qu&apos;aucune valeur ne s&apos;anime.
          </p>
        </header>
        <Banc initial={sp} repere={{ adresse, commune }} horizons={horizons} chemin={chemin} apercu={apercu} />
      </div>
    </main>
  );
}
