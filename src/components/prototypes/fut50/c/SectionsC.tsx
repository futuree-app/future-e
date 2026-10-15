// FUT-50 · VERSION C · LE RESTE DE L'ACCUEIL, RECOMPOSÉ À PARTIR DE L'EXISTANT. DEV UNIQUEMENT.
//
// Rien n'est un second manifeste ni un bloc éditorial de plus : chaque section reprend une section de
// `FutureELanding.tsx`, plus courte et dans la grammaire « Le relevé ». Les textes repris mot pour mot sont
// marqués `existant` ; les formulations corrigées le sont `corrigé`, avec la raison (cf. compte rendu, § 4).
import Image from "next/image";
import Link from "next/link";
import { GlypheGrain, type GrainCle } from "@/components/releve/primitives";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";
import { FilmDossier, type Film } from "./FilmDossier";
import { PLANS, Cadre, DUREE_FILM } from "./PlansDossier";
import { fr } from "../commun";
import c from "./c.module.css";

// ── Pourquoi futur•e (existant, raccourci, remonté sous le hero) ─────────────────────────────────

export function Pourquoi() {
  return (
    <section className={c.section} aria-labelledby="pourquoi-c">
      <div className={c.pourquoi}>
        <div className={c.pourquoiTexte}>
          <h2 id="pourquoi-c" className={c.sectionTitre}>Votre futur lieu de vie ne tient pas dans une annonce.</h2>
          {/* La phrase sur l'annonce (14/10) est retirée le 15/10 : le titre du hero porte désormais cette idée. */}
          {/* existant, mot pour mot : premier et troisième paragraphes de la section « Pourquoi futur•e ». */}
          <p className={c.pourquoiCorps}>
            {fr("Choisir où vivre est l’une des décisions les plus engageantes qui soient : des années de vie, une grande partie d’un patrimoine, parfois la santé d’une famille.")}
          </p>
          <p className={c.pourquoiCorps}>
            {fr("futur•e rassemble les données connues, éclaire les angles morts et vous aide à préparer les vérifications avant de vous engager.")}
          </p>
          <p className={c.triptyque}>
            Ce que nous savons. <span style={{ color: "var(--r-texte)" }}>Ce que cela change pour vous.</span>{" "}
            <span style={{ color: "var(--orange-ink)" }}>Ce qu’il reste à vérifier.</span>
          </p>
          <p style={{ margin: "4px 0 0" }}><Link href="/pourquoi" className={c.lienFleche}>Pourquoi futur•e existe</Link></p>
        </div>
        <div className={c.photo}>
          <Image src="/future-territoire-landing.jpg" alt="Vue urbaine au crépuscule à travers une fenêtre ouverte" fill sizes="(max-width: 900px) 100vw, 480px" style={{ objectFit: "cover" }} />
        </div>
      </div>
    </section>
  );
}

// ── Les trois échelles (existant, simplifié : une descente, sans listes) ─────────────────────────

const MARCHES: { grain: GrainCle; nom: string; echelle: string; texte: string }[] = [
  // Les trois descriptions sont celles de la constante MODULES de l'accueil actuel ; les listes d'items, qui
  // revenaient presque à l'identique dans les tarifs, sont retirées.
  { grain: "commune", nom: "Territoire", echelle: "la commune", texte: "Services, population, nature et climat : le portrait d'une commune, et la façon dont elle change." },
  { grain: "secteur", nom: "Autour de l'adresse", echelle: "le voisinage", texte: "Commerces, école, santé, transports, espaces verts : le quotidien à quelques minutes de la porte." },
  { grain: "batiment", nom: "Logement", echelle: "le bâtiment", texte: "Diagnostic, exposition du bâti, sol de la parcelle : le bien lui-même, et les questions à poser avant de signer." },
];

export function Echelles() {
  return (
    <section className={c.section} aria-labelledby="echelles-c">
      <h2 id="echelles-c" className={c.sectionTitre}>Trois échelles, de la commune à vos murs.</h2>
      {/* existant : première phrase du chapô de la section « 3 modules ». */}
      <p className={c.sectionChapo} style={{ marginTop: 14 }}>
        {fr("Une bonne commune ne fait pas un bon quartier, ni un bon quartier un bon logement. Chaque échelle peut nuancer la précédente.")}
      </p>
      <ol className={c.descente}>
        {MARCHES.map((m) => (
          <li key={m.nom} className={c.marche}>
            <div className={c.marcheTete}>
              <span aria-hidden style={{ color: "var(--r-encre)" }}><GlypheGrain grain={m.grain} taille={18} /></span>
              <span className={c.marcheNom}>{m.nom}</span>
              <span className={c.marcheEchelle}>{m.echelle}</span>
            </div>
            <p className={c.marcheTexte}>{fr(m.texte)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Le Dossier Adresse : ce que l'on obtient vraiment (nouveau, revue du 14/10/2026) ─────────────

/**
 * LE FILM DU DOSSIER. Nul tant que le dossier exemple réel de FUT-56 n'est pas validé. Dans le prototype, la
 * section montre une MAQUETTE identifiée comme telle ; dans l'accueil public, elle restera ABSENTE tant que ce
 * film n'existe pas (`AFFICHER_SANS_FILM` vaut faux hors prototype).
 */
export const FILM_DOSSIER: Film | null = null;

/** Le lien « Voir un exemple de dossier » : nul jusqu'à la livraison de FUT-56 et de FUT-14. */
export const EXEMPLE_DOSSIER_URL: string | null = null;

export function DossierAdresse({ maquette = false }: { maquette?: boolean }) {
  // Dans l'accueil public, pas de film validé = pas de section : aucune démonstration simulée.
  if (!FILM_DOSSIER && !maquette) return null;
  const planFort = PLANS.find((p) => p.id === "lecture")!;
  return (
    <section className={c.section} id="dossier-adresse" aria-labelledby="dossier-c">
      <h2 id="dossier-c" className={c.sectionTitre}>Et pour votre adresse ?</h2>
      <p className={c.sectionChapo} style={{ marginTop: 14 }}>
        {fr("Le dossier d'adresse relie la commune, le voisinage et le logement à votre projet. Il dit où cela correspond, où cela coince, et quoi vérifier avant de signer.")}
      </p>
      <div className={c.dossierGrille}>
        <FilmDossier
          film={FILM_DOSSIER}
          titre={`Un dossier d'adresse en ${DUREE_FILM} secondes`}
          maquette={<Cadre plan={planFort} numero={3} avecTexte={false} />}
        />
        <div className={c.dossierEtapes}>
          {/* Le message du film, lisible sans le regarder : ce sont aussi ses sous-titres. */}
          <ol className={c.etapes}>
            {PLANS.slice(0, 4).map((p, i) => (
              <li key={p.id} className={c.etape}>
                <span className={c.etapeNumero} aria-hidden>{i + 1}</span>
                <span><strong>{p.titre}.</strong> {fr(p.message)}</span>
              </li>
            ))}
          </ol>
          <div className={c.suites}>
            <Link href="/dossier" className={c.boutonMarque}>Ouvrir un dossier d’adresse · 39 € <span aria-hidden>→</span></Link>
            {EXEMPLE_DOSSIER_URL ? <Link href={EXEMPLE_DOSSIER_URL} className={c.lienFleche}>Voir un exemple de dossier</Link> : null}
          </div>
          {maquette ? (
            <p className={c.noteMaquette}>
              Repère de conception, sans données : le film sera tourné sur le dossier exemple réel (FUT-56).{" "}
              <Link href="/dev/fut50/storyboard" className={c.lienTexte}>Voir le storyboard complet</Link>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// ── Les offres (structure existante, formulations auditées) ──────────────────────────────────────

export function Offres() {
  return (
    <section className={c.section} id="pricing" aria-labelledby="offres-c">
      {/* existant : le titre. corrigé : le chapô (« une lecture personnalisée à partir de vos réponses »
          décrivait l'ancien questionnaire). */}
      <h2 id="offres-c" className={c.sectionTitre}>Découvrir, comprendre ou arbitrer.</h2>
      <p className={c.sectionChapo} style={{ marginTop: 14 }}>
        {fr("Regarder et chercher est gratuit. Un dossier vient quand un lieu compte vraiment pour vous.")}
      </p>
      <div className={c.offres}>
        <article className={c.offre} aria-labelledby="offre-decouverte">
          <h3 id="offre-decouverte" className={c.offreNom}>Découverte</h3>
          <div className={c.prix}>0 €</div>
          <p className={c.prixNote}>Aucune carte bancaire demandée</p>
          {/* corrigé : « le questionnaire de profil personnalisé » et « votre première lecture personnalisée »
              promettaient un questionnaire que le moteur ne lit pas entièrement (FUT-28). « Le climat déjà observé »
              était faux : l'accueil affiche des projections. « 3 pages Savoir » : elles sont toutes en accès libre. */}
          <ul className={c.offreListe}>
            <li>Regarder une commune avec vos priorités, ici même</li>
            <li>Décrire votre projet et voir les territoires qui y répondent</li>
            <li>Les articles et les guides pratiques, en accès libre</li>
          </ul>
          <a href="#lieu" className={c.bouton}>Chercher une commune</a>
        </article>

        <article className={c.offre} aria-labelledby="offre-territoire">
          <h3 id="offre-territoire" className={c.offreNom}>Dossier de territoire</h3>
          <div className={c.prix}>14 € <span className={c.prixUnite}>une fois</span></div>
          <p className={c.prixNote}>Intégralement déduits si vous poursuivez ensuite sur une adresse</p>
          <p className={c.offreTexte}>Une commune examinée depuis votre projet. La première des trois échelles.</p>
          {/* corrigé : « parmi les 34 000 communes » (le total réel est de 35 006 ; jamais un rond faux). */}
          <ul className={c.offreListe}>
            <li>La commune en entier : climat, risques, cadre de vie, ce qui la transforme</li>
            <li>Sa position parmi les communes françaises, critère par critère</li>
            <li>AskFuture : 3 questions incluses</li>
            <li>Chaque constat daté et sourcé, ce qui manque est nommé</li>
          </ul>
          <Link href="/checkout/rapport-complet" className={c.bouton}>Ouvrir un dossier de territoire · 14 €</Link>
        </article>

        <article className={c.offre} aria-labelledby="offre-adresse">
          <h3 id="offre-adresse" className={c.offreNom}>Dossier d’adresse</h3>
          <div className={c.prix}>39 € <span className={c.prixUnite}>au total</span></div>
          <p className={c.prixNote}>ou 25 € après un dossier de territoire</p>
          <p className={c.offreTexte}>{fr("Une commune, ses alentours et un logement ne répondent pas aux mêmes questions. Les trois échelles sont examinées à partir d’une adresse précise.")}</p>
          <ul className={c.offreListe}>
            <li>Tout le dossier de territoire de cette commune</li>
            <li>Autour de l’adresse et le logement, avec ce qui reste à vérifier en visite</li>
            <li>À rouvrir et compléter au fil de votre recherche, depuis votre compte</li>
          </ul>
          <Link href="/dossier" className={c.bouton}>Ouvrir un dossier d’adresse · 39 €</Link>
          {EXEMPLE_DOSSIER_URL ? <Link href={EXEMPLE_DOSSIER_URL} className={c.lienFleche} style={{ fontSize: 15 }}>Voir un exemple de dossier</Link> : null}
        </article>
      </div>

      <div className={c.comparaison}>
        <div style={{ display: "grid", gap: 8 }}>
          <p className={c.offreNom} style={{ fontSize: 18 }}>Vous hésitez entre plusieurs communes ? Dossier comparatif · 39 €</p>
          {/* existant, mot pour mot ; « trois nouvelles pistes » et le nombre de communes comparées restent à
              revérifier avec FUT-32 avant intégration (cf. compte rendu). */}
          <p className={c.offreTexte}>
            {fr("Trois territoires comparés thème par thème sur 27 dimensions, les trois dossiers de territoire complets, et trois nouvelles pistes si aucune commune ne se détache. AskFuture : 9 questions incluses.")}
          </p>
        </div>
        <Link href="/ou-vivre" className={c.bouton}>Comparer trois territoires</Link>
      </div>
      <p className={c.mentionTva}>TVA non applicable, art. 293 B du CGI.</p>
    </section>
  );
}

// ── Savoir (l'existant, trois contenus mis en avant, renvois vers les hubs) ──────────────────────

/**
 * LES ÉTUDES LOCALES À VENIR (FUT-100). Vide tant qu'aucune n'est publiée : la section ne montre jamais une
 * page en préparation. Quand `/savoir/dependance-auto/la-rochelle` et `/savoir/dependance-auto/niort` seront
 * en ligne, une entrée ici suffit à les faire apparaître sous les trois contenus.
 */
export const ETUDES_LOCALES_PUBLIEES: { commune: string; titre: string; href: string }[] = [];

const A_LA_UNE: { theme: string; titre: string; texte: string; image: string; hub: string; liens: { libelle: string; href: string }[] }[] = [
  {
    // Les titres sont ceux des hubs ; les textes, leurs descriptions publiées, sans chiffre repris ici.
    theme: "Chaleur", titre: "Votre commune face à la chaleur extrême",
    texte: "Jours de canicule, nuits étouffantes : ce que les étés de 2050 changeront concrètement, commune par commune.",
    image: "/hub-canicule.jpg", hub: "/chaleur",
    liens: [{ libelle: "Se préparer à la canicule", href: "/agir/canicule" }],
  },
  {
    theme: "Inondation", titre: "Votre commune face aux inondations",
    texte: "Crues, submersions marines et précipitations extrêmes : l'exposition de chaque commune, et comment s'y préparer.",
    image: "/hub-submersion.jpg", hub: "/inondation",
    liens: [{ libelle: "Gérer le risque inondation", href: "/agir/inondation" }],
  },
  {
    theme: "Mobilité", titre: "Vous utilisez beaucoup votre voiture",
    texte: "Dépendance automobile, budget transport, alternatives réelles : de quoi comprendre votre situation avant de choisir un logement.",
    image: "/hub-dependance.jpg", hub: "/j-utilise-beaucoup-ma-voiture",
    liens: [
      { libelle: "Comprendre la dépendance automobile", href: "/savoir/dependance-auto" },
      { libelle: "Réduire sa dépendance", href: "/agir/dependance-auto" },
    ],
  },
];

const AUSSI: { libelle: string; href: string }[] = [
  { libelle: "Cadmium dans les sols", href: "/savoir/cadmium" },
  { libelle: "Maladies émergentes", href: "/savoir/maladies-emergentes" },
  { libelle: "Sommes-nous prêts ?", href: "/savoir/preparation-catastrophes" },
];

export function Savoir() {
  return (
    <section className={c.section} id="savoir" aria-labelledby="savoir-c">
      <h2 id="savoir-c" className={c.sectionTitre}>Comprendre avant de choisir.</h2>
      <p className={c.sectionChapo} style={{ marginTop: 14 }}>
        {fr("Articles et guides gratuits, sourcés, pour savoir où porter le regard avant de décider.")}
      </p>
      <div className={c.articles}>
        {A_LA_UNE.map((a) => (
          <article key={a.hub} className={c.article}>
            <Link href={a.hub} className={c.articleImage} tabIndex={-1} aria-hidden>
              <Image src={a.image} alt="" fill sizes="(max-width: 900px) 100vw, 340px" style={{ objectFit: "cover" }} />
            </Link>
            <span className={c.articleTheme}>{a.theme}</span>
            <h3 className={c.articleTitre}><Link href={a.hub}>{a.titre}</Link></h3>
            <p className={c.articleTexte}>{fr(a.texte)}</p>
            <div className={c.articleLiens}>
              {a.liens.map((l) => <Link key={l.href} href={l.href} className={c.lienFleche} style={{ fontSize: 15 }}>{l.libelle}</Link>)}
            </div>
          </article>
        ))}
      </div>
      {ETUDES_LOCALES_PUBLIEES.length > 0 ? (
        <div className={c.aussi}>
          <span>Études locales :</span>
          {ETUDES_LOCALES_PUBLIEES.map((e) => <Link key={e.href} href={e.href} className={c.lienFleche} style={{ fontSize: 15.5 }}>{e.titre}</Link>)}
        </div>
      ) : null}
      <div className={c.aussi}>
        <span>Aussi à lire :</span>
        {AUSSI.map((l) => <Link key={l.href} href={l.href} className={c.lienFleche} style={{ fontSize: 15.5 }}>{l.libelle}</Link>)}
      </div>
    </section>
  );
}

// ── Pied de page (liens de l'accueil actuel ; les professionnels restent discrets) ───────────────

export function Pied() {
  const liens = [
    { libelle: "Pourquoi futur•e", href: "/pourquoi" },
    { libelle: "Articles et guides", href: "#savoir" },
    { libelle: "Contact", href: "mailto:hello@futur-e.fr" },
    { libelle: "Mentions légales", href: "/mentions-legales" },
    { libelle: "CGV", href: "/conditions-generales-de-vente" },
    { libelle: "Confidentialité", href: "/politique-confidentialite" },
  ];
  return (
    <footer className={c.pied}>
      <nav aria-label="Pied de page" className={c.piedLiens}>
        {liens.map((l) => <a key={l.libelle} href={l.href}>{l.libelle}</a>)}
        <CookieSettingsLink />
        <a href="/professionnels" className={c.piedDiscret}>Professionnels</a>
      </nav>
      <p style={{ margin: 0, fontSize: 13.5, color: "var(--r-discret)" }}>Données publiques : DRIAS, Géorisques, INSEE, ADEME et d&apos;autres, citées à chaque constat.</p>
    </footer>
  );
}
