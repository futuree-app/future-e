// FUT-50 · INDEX DES PROTOTYPES D'ACCUEIL. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, Surtitre } from "@/components/releve/primitives";

const DIRECTIONS = [
  { href: "/dev/fut50/a", nom: "A · Le Projet d'abord", these: "On commence par ce que la personne cherche. Le premier écran montre le Projet comme un objet qui pose des questions à chaque lieu ; le deuxième laisse changer une priorité et voir la vraie lecture de Sète changer." },
  { href: "/dev/fut50/b", nom: "B · Une décision éclairée par les preuves", these: "On commence au moment où l'on s'engage pour un lieu. Le premier écran montre ce que l'on sait d'une commune avant de connaître le projet ; le deuxième déplie une ligne du dossier, puis révèle ce que le projet en fait." },
];

export default function IndexFut50() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <main className={s.releve}>
      <Navbar />
      <div className={s.feuille} style={{ padding: "56px 28px 96px", display: "grid", gap: 28, maxWidth: 920 }}>
        <Surtitre>Prototypes FUT-50 · haut de l&apos;accueil</Surtitre>
        <h1 className={s.display}>Deux accueils à comparer</h1>
        <p className={s.chapo}>Même cas réel (Sète, lecture du moteur relevée le 12 octobre 2026), mêmes destinations réelles, deux thèses différentes. Rien ici n&apos;est en production.</p>
        <ul className={s.liste}>
          {DIRECTIONS.map((d) => (
            <li key={d.href} style={{ display: "grid", gap: 8 }}>
              <Link href={d.href} className={s.sousTitre} style={{ fontSize: 21, textDecoration: "underline", textUnderlineOffset: 5 }}>{d.nom}</Link>
              <p className={s.corps}>{d.these}</p>
            </li>
          ))}
        </ul>
        <p className={s.nuance}>Analyse, comparaison et recommandation : <code>docs/audits/2026-10-12-fut50-accueil-decision.md</code>. <Link href="/">Accueil actuel</Link>.</p>
      </div>
    </main>
  );
}
