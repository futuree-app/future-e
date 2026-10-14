// FUT-50 · INDEX DES PROTOTYPES D'ACCUEIL. DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { releve as s, Surtitre } from "@/components/releve/primitives";

const DIRECTIONS = [
  { href: "/dev/fut50/c", nom: "C · Un lieu, puis ce qui compte (accueil complet, version retenue pour revue)", these: "On commence par chercher un lieu, puis on coche ce qui compte. Chaque priorité affiche une seule lecture : ce que disent les données, ce que cela implique, ce qu'il reste à vérifier. La suite de l'accueil existant est recomposée, plus courte." },
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
        <h1 className={s.display}>Trois accueils à comparer</h1>
        <p className={s.chapo}>Même cas réel (Sète, lecture du moteur relevée le 12 octobre 2026), mêmes destinations réelles, trois propositions. Rien ici n&apos;est en production.</p>
        <ul className={s.liste}>
          {DIRECTIONS.map((d) => (
            <li key={d.href} style={{ display: "grid", gap: 8 }}>
              <Link href={d.href} className={s.sousTitre} style={{ fontSize: 21, textDecoration: "underline", textUnderlineOffset: 5 }}>{d.nom}</Link>
              <p className={s.corps}>{d.these}</p>
            </li>
          ))}
        </ul>
        <p className={s.nuance}>Analyses : <code>docs/audits/2026-10-12-fut50-accueil-decision.md</code> (A et B) et <code>docs/audits/2026-10-14-fut50-version-c.md</code> (C). <Link href="/">Accueil actuel</Link>.</p>
      </div>
    </main>
  );
}
