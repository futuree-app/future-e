// FUT-118 · L'INDEX DES ÉCRANS TÉMOINS. DEV UNIQUEMENT : 404 en production.
//
// Cinq usages, une seule grammaire. Deux témoins existent déjà dans le produit et ne sont PAS
// refaits ici : l'accueil (`/`, en production depuis FUT-50) et « Ma décision » (le banc FUT-91,
// qui rend les composants de production sur un vrai dossier du moteur). Les trois autres sont
// nouveaux et fictifs : un module dense, une comparaison à N possibilités, un tunnel d'achat.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, BandeauPrototype, Surtitre } from "@/components/releve/primitives";
import t from "./temoins.module.css";

const TEMOINS = [
  { n: "01", href: "/", nom: "Accueil", quoi: "Production. Le Relevé appliqué à la découverte : une question, une recherche, une lecture gratuite qui s'ouvre en planche." },
  { n: "02", href: "/dev/fut91?vue=releve&pane=1&artefact=1", nom: "Ma décision", quoi: "Composants de production sur un vrai dossier du moteur (banc FUT-91). La plaque du verdict, la balance, la marge de preuve, la liste complète des contrôles." },
  { n: "03", href: "/dev/fut118/territoire", nom: "Un module dense : Territoire", quoi: "Fictif. Des chiffres, des seuils, des rangs, une mémoire datée, une donnée absente, une lecture enrichie en préparation." },
  { n: "04", href: "/dev/fut118/comparaison", nom: "Une comparaison à N possibilités", quoi: "Fictif. Les objets visuels du futur centre de décision (FUT-41) : issue par possibilité, niveau d'examen, registre des possibilités. De 2 à 10, sans colonnes figées." },
  { n: "05", href: "/dev/fut118/paiement", nom: "De la qualification au dossier", quoi: "Fictif. Qualification d'adresse, paiement, attente, échec et confirmation dans la même grammaire que le dossier acheté." },
];

export default function IndexFut118() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className={s.releve}>
      <Navbar />
      <BandeauPrototype>FUT-118 · écrans témoins du Relevé · données fictives · aucun appel au moteur, au modèle ni à Stripe</BandeauPrototype>
      <main className={`${s.feuille} ${t.page}`}>
        <header className={t.tete}>
          <Surtitre numero="FUT-118">Phase A</Surtitre>
          <h1 className={s.display}>Une grammaire, cinq usages.</h1>
          <p className={s.chapo}>
            Chaque écran ci-dessous n&apos;utilise que les primitives de <code className={s.mono}>src/components/releve/</code>.
            Ce qu&apos;il a fallu ajouter est rassemblé dans une seule feuille, et chaque ajout y est nommé comme un manque du canon.
          </p>
        </header>
        <ul className={t.indexListe}>
          {TEMOINS.map((x) => (
            <li key={x.n}>
              <Link href={x.href} className={t.indexLien}>
                <span className={s.numero} style={{ paddingTop: 3 }}>{x.n}</span>
                <span className={s.pileSerree}>
                  <span className={s.sousTitre}>{x.nom}</span>
                  <span className={s.dense}>{x.quoi}</span>
                </span>
                <span aria-hidden className={s.mono}>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
