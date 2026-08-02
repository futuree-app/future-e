// LA BOUCLE DE VÉRIFICATION des écrans d'attente.
//
// Pourquoi elle existe : ces écrans vivent entre 200 ms et quelques secondes, et ils se remplacent
// eux-mêmes dès que les données arrivent. Impossible à juger en production, où il faudrait ouvrir un
// module lourd puis espérer que le réseau traîne assez pour voir la séquence se dérouler. Ici l'écran
// reste, avec la chronologie exacte du vrai.
//
// La séquence tient entièrement en CSS (le composant est un server component sans JS), donc
// RECHARGEZ la page pour la rejouer depuis zéro. La matière apparaît à 0,2 s, puis les états basculent
// toutes les 3,4 s.
//
// `?scope=territoire` rend le jeu d'un contexte, `?label=…` la variante à libellé fixe (un seul état,
// sans séquence). Sans paramètre : le sommaire des six jeux, pour les relire d'un coup.
//
// DEV UNIQUEMENT : 404 en production.
import Link from "next/link";
import { notFound } from "next/navigation";
import { RouteLoadingBar } from "@/components/RouteLoadingBar";
import { LOADING_MESSAGES, instantDeLEtat, type LoadingScope } from "@/lib/loading-messages";

export const dynamic = "force-dynamic";

const SCOPES = Object.keys(LOADING_MESSAGES) as LoadingScope[];

// Où chaque jeu se voit en vrai. TROIS de ces six contextes sont des échelles du produit (territoire,
// autour, logement) ; les autres sont des surfaces.
const SEGMENTS: Record<LoadingScope, string> = {
  compte: "/compte, /compte/memoire",
  rapport: "/rapport",
  // Dette assumée, pas une coquille : l'URL dit encore « quartier » alors qu'Autour porte désormais la
  // lecture locale. Résidu conceptuel à nettoyer, hors de ce lot (l'URL est indexée).
  territoire: "/rapport/quartier",
  autour: "/rapport/autour",
  logement: "/rapport/logement",
  dossiers: "/rapport/dossiers",
};

const ECHELLES = new Set<LoadingScope>(["territoire", "autour", "logement"]);

export default async function DevLoadingPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; label?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();

  const { scope, label } = await searchParams;
  const cible = SCOPES.find((s) => s === scope);

  if (label?.trim()) return <RouteLoadingBar label={label.trim()} />;
  if (cible) return <RouteLoadingBar messages={LOADING_MESSAGES[cible]} />;

  return (
    <div
      className="min-h-screen bg-canvas text-label"
      style={{ fontFamily: "var(--font-sans)" }}
    >
      <div className="max-w-[920px] mx-auto px-7 py-16">
        <p className="font-mono text-[11px] tracking-[0.12em] uppercase text-ghost mb-2">
          Dev · écrans d&apos;attente
        </p>
        <h1
          className="font-[var(--weight-title)] text-[length:var(--text-title)] leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Six jeux contextuels, dont trois échelles.
        </h1>
        <p className="text-[15px] text-muted leading-relaxed mb-10">
          La matière d&apos;abord, en mono : ce qui est réellement chargé, et le seul état que voit un
          chargement court. Puis les phrases en serif, ce que cette lecture permet de comprendre, et
          enfin la transparence sur le délai. Rien avant 0,2 s pour éviter le flash, bascule toutes les
          3,4 s. Ouvrez un jeu, puis rechargez pour rejouer la séquence.
        </p>

        <div style={{ display: "grid", gap: 14 }}>
          {SCOPES.map((s) => {
            const m = LOADING_MESSAGES[s];
            return (
              <div key={s} className="glass rounded-xl p-6">
                <div className="flex items-baseline justify-between gap-4 mb-4 flex-wrap">
                  <p className="font-mono text-[12px] tracking-[0.08em] uppercase text-accent">
                    {s}
                    {!ECHELLES.has(s) && (
                      <span className="text-ghost"> · surface</span>
                    )}
                  </p>
                  <p className="font-mono text-[11px] text-ghost">{SEGMENTS[s]}</p>
                </div>

                <ol style={{ display: "grid", gap: 10, margin: "0 0 20px", paddingLeft: 0, listStyle: "none" }}>
                  {[m.matiere, ...m.suites].map((texte, i) => (
                    <li key={texte} className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] text-ghost shrink-0" style={{ minWidth: 46 }}>
                        {instantDeLEtat(i).toFixed(1).replace(".", ",")} s
                      </span>
                      {i === 0 ? (
                        <span className="font-mono text-[length:var(--text-kicker)] tracking-[0.1em] uppercase text-muted">
                          {texte}
                        </span>
                      ) : (
                        <span
                          className="text-[18px] leading-[1.3] text-label"
                          style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.3px" }}
                        >
                          {texte}
                        </span>
                      )}
                    </li>
                  ))}
                </ol>

                <Link
                  href={`/dev/loading?scope=${s}`}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/[0.12] text-accent text-[length:var(--text-dense)] no-underline border border-accent/[0.25]"
                >
                  Voir l&apos;écran
                </Link>
              </div>
            );
          })}
        </div>

        <p className="text-[length:var(--text-dense)] text-ghost leading-relaxed mt-10">
          Variante à libellé fixe, sans séquence :{" "}
          <Link href="/dev/loading?label=Analyse en cours" className="text-accent">
            /dev/loading?label=Analyse en cours
          </Link>
        </p>
      </div>
    </div>
  );
}
