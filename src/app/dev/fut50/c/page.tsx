// FUT-50 · VERSION C · L'ACCUEIL COMPLET : UN LIEU, PUIS CE QUI COMPTE. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype } from "@/components/releve/primitives";
import { HeroLieu } from "@/components/prototypes/fut50/c/HeroLieu";
import { Pourquoi, Echelles, Offres, Savoir, Pied } from "@/components/prototypes/fut50/c/SectionsC";
import c from "@/components/prototypes/fut50/c/c.module.css";

export default function PrototypeAccueilC() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={`${s.releve} ${c.page}`}>
      <Navbar />
      <BandeauPrototype>
        Prototype FUT-50 · version C · accueil complet ·{" "}
        <Link href="/dev/fut50/a">A</Link> · <Link href="/dev/fut50/b">B</Link> · <Link href="/">accueil actuel</Link> · <Link href="/dev/fut50">index</Link>
      </BandeauPrototype>
      <div className={s.feuille}>
        <HeroLieu />
        <Pourquoi />
        <Echelles />
        <Offres />
        <Savoir />
        <Pied />
      </div>
    </main>
  );
}
