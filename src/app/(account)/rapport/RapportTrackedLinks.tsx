"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { buildGeoProps } from "@/lib/posthog-props";
import { bindOrphans } from "@/lib/typography";

export function TrackedUpgradeLink({
  href,
  children,
  className,
  style,
  source = "autre",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  source?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      onClick={() =>
        posthog.capture("report_upgrade_cta_clicked", { source })
      }
    >
      {children}
    </Link>
  );
}

// LE GESTE DE FIN DE DOSSIER, quand la lecture s'est arrêtée au grain de la commune.
//
// POURQUOI IL EXISTE EN PLUS DU REPÈRE DU HAUT. La colonne des échelles propose déjà d'analyser une
// adresse, mais elle est AVANT la lecture : elle sert à s'orienter. Un lecteur qui vient de
// parcourir le verdict, les constats et les contrôles arrive en bas de page au moment précis où
// l'envie de préciser existe, et n'y trouvait plus rien à faire depuis que le geste de clôture de
// `DossierDecisionSection` s'efface en présence de la colonne. Le haut sert à s'orienter, le bas
// sert à poursuivre.
//
// LA MESURE DISTINGUE LES DEUX. Même événement que la colonne (`report_scale_address_required`),
// avec une `surface` différente : sans ça, on saurait que le geste est utilisé sans savoir lequel
// des deux emplacements le porte, donc sans pouvoir en retirer un.
export function TrackedAddressCta({
  commune,
  inseeCode,
}: {
  commune?: string | null;
  inseeCode?: string | null;
}) {
  // PAS DE `flex-wrap` SUR CETTE CARTE. Les autres cartes de geste du dossier en portent un, et sous
  // 420 px la flèche passe seule à la ligne, en bas à gauche, où elle ressemble à un caractère
  // égaré. Sans repli, elle garde sa colonne de 13 px à droite quelle que soit la largeur.
  // UN FILET ET UNE MARGE, PARCE QUE LA LECTURE EST FINIE. Collée à quarante pixels de la dernière
  // rubrique, la carte se lisait comme une rubrique de plus. Le rapport sépare ses mouvements par un
  // filet de 1 px et une marge large (le pied de page, la section des échelles) : le geste de
  // clôture prend la même respiration, et dit ainsi qu'on quitte la lecture pour agir.
  return (
    <div className="mt-14 pt-10 border-t border-[var(--border-1)]">
    <Link
      href="/dossier"
      onClick={() =>
        posthog.capture("report_scale_address_required", {
          requested_modules: ["autour", "logement"],
          source: "hub",
          surface: "fin_de_dossier",
          ...buildGeoProps({ commune, inseeCode }),
        })
      }
      className="group flex items-center justify-between gap-4 px-5 sm:px-6 py-5 rounded-xl no-underline border border-[var(--border-2)] bg-[var(--bg-elev)] hover:border-accent/40 hover:bg-[var(--bg-elev-2)] transition-colors"
    >
      <span className="flex min-w-0 flex-col gap-1.5">
        <span className="text-[15px] font-semibold text-label">
          Préciser cette lecture à une adresse
        </span>
        <span className="text-[13px] leading-[1.6] text-muted">
          {bindOrphans("Ce dossier s'arrête au grain de la commune. Une adresse ouvre le secteur qui l'entoure et le bâtiment lui-même.")}
        </span>
      </span>
      <span aria-hidden className="shrink-0 font-mono text-[13px] text-accent transition-transform group-hover:translate-x-0.5">→</span>
    </Link>
    </div>
  );
}
