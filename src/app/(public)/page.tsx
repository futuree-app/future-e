// L'ACCUEIL (FUT-50, version C) : un lieu, puis ce qui compte. Le hero lit les données publiques de la commune
// choisie par `/api/accueil/*` (service partagé `@/lib/accueil/lecture-accueil`, mêmes règles que le dossier) ;
// le reste de la page reprend les sections de l'ancien accueil (`FutureELanding`), recomposées.
//
// La section « Dossier Adresse » (le mini-film, FUT-56) a sa place réservée entre les échelles et les offres :
// `DossierAdresse` ne rend rien tant qu'aucun film réel n'est validé. Aucune démonstration simulée.
import Navbar from "@/components/Navbar";
import { releve as s } from "@/components/releve/primitives";
import { HeroLieu } from "@/components/accueil/HeroLieu";
import { Pourquoi, Echelles, DossierAdresse, Offres, Savoir, Pied } from "@/components/accueil/SectionsAccueil";
import { SuiviTarifs } from "@/components/accueil/SuiviTarifs";
import c from "@/components/accueil/accueil.module.css";

export default function Home() {
  return (
    <main className={`${s.releve} ${c.page}`}>
      <Navbar />
      <div className={s.feuille}>
        <HeroLieu />
        <Pourquoi />
        <Echelles />
        <DossierAdresse />
        <Offres />
        <Savoir />
        <Pied />
      </div>
      <SuiviTarifs />
    </main>
  );
}
