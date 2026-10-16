// FUT-50 · VERSION C AFFINÉE · L'ACCUEIL COMPLET. DEV UNIQUEMENT : 404 en production.
// Les composants sont ceux de l'accueil public (`src/components/accueil`) ; le prototype garde ses routes de
// développement, la composition « mobilité » et la maquette du film.
// `?pastilles=mobilite` affiche la composition de comparaison (la mobilité à la place des hivers).
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { HeroLieu } from "@/components/accueil/HeroLieu";
import { Pourquoi, Echelles, DossierAdresse, Offres, Savoir, Pied } from "@/components/accueil/SectionsAccueil";
import c from "@/components/accueil/accueil.module.css";

export default async function PrototypeAccueilC({ searchParams }: { searchParams: Promise<{ pastilles?: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const composition = (await searchParams).pastilles === "mobilite" ? "mobilite" : "recommandee";
  return (
    <main className={`${s.releve} ${c.page}`}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-50 · version C affinée · pastilles {composition === "mobilite" ? "avec la mobilité" : "recommandées"} (
        <Link href={composition === "mobilite" ? "/dev/fut50/c" : "/dev/fut50/c?pastilles=mobilite"}>{composition === "mobilite" ? "voir la composition recommandée" : "voir la composition avec la mobilité"}</Link>
        ) · <Link href="/dev/fut50/storyboard">storyboard du dossier</Link> · <Link href="/">accueil actuel</Link> · <Link href="/dev/fut50">index</Link>
      </BandeauPrototype>
      <div className={s.feuille}>
        <HeroLieu composition={composition} api="/dev/fut50/api" />
        <Pourquoi />
        <Echelles />
        <DossierAdresse maquette />
        <Offres />
        <Savoir />
        <Pied />
      </div>
    </main>
  );
}
