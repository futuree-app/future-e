import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  skipTrailingSlashRedirect: true,
  // L'index national du comparateur de vie est lu via fs au runtime par la route
  // match. On force son inclusion dans la trace serverless (sinon : marche en
  // local, fichier introuvable en prod).
  outputFileTracingIncludes: {
    "/api/comparateur-vie/match": [
      "./data/comparateur-index.json.gz",
      "./data/ze-emploi-na38.json",
    ],
    // Module Territoire : la page et la synthèse lisent l'index (carte d'identité,
    // trait distinctif, démographie, couvert naturel) et la saisonnalité.
    "/rapport/quartier": [
      "./data/comparateur-index.json.gz",
      "./data/residences-secondaires.json",
      "./data/communes-baignade.json",
    ],
    "/api/synthesize-quartier": [
      "./data/comparateur-index.json.gz",
      "./data/residences-secondaires.json",
      "./data/communes-baignade.json",
    ],
    // AskFuture : le socle d'enrichissement lit la baignade (lib/baignade.ts).
    "/api/ask": ["./data/communes-baignade.json"],
    "/api/ask/context": ["./data/communes-baignade.json"],
    // Module Logement : la sinistralité ONRN (lib/onrn-sinistralite.ts) lit les
    // deux JSON runtime via fs au runtime de la route.
    "/api/georisques-logement": [
      "./data/onrn-secheresse.json",
      "./data/onrn-inondation.json",
    ],
    // Face 3 « autour de cette adresse » : la lib logement-bpe.ts lit les shards
    // de points BPE par cellule ; la lib icu.ts lit l'index îlot de chaleur (grand-IRIS).
    "/api/logement-autour": [
      "./data/bpe-points/**",
      "./data/icu.json",
    ],
    // FACTURES : pdfkit lit ses métriques de police (.afm) au runtime, par `fs`, pour les
    // quatorze polices PDF de base. Le traceur ne les voit pas, puisque le chemin est construit
    // à l'exécution. Sans cette ligne : PDF parfait en local, et
    // `ENOENT ... pdfkit/js/data/Helvetica.afm` en production, donc 500 au téléchargement et
    // facture manquante en pièce jointe. Constaté le 31/07/2026, exactement le piège décrit en
    // tête de ce bloc pour l'index du comparateur.
    "/api/account/factures/[number]": ["./node_modules/pdfkit/js/data/**"],
    "/api/stripe/webhook": ["./node_modules/pdfkit/js/data/**"],
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  async redirects() {
    return [
      // Anciennes pages hub canicule → nouveau hub chaleur
      { source: '/territoires/canicule', destination: '/chaleur', permanent: true },
      { source: '/territoires/canicule/:code(\\d{5}|2[AB]\\d{3})', destination: '/chaleur/:code', permanent: true },
      { source: '/savoir/canicule', destination: '/chaleur', permanent: true },
      { source: '/savoir/canicule/:code(\\d{5}|2[AB]\\d{3})', destination: '/chaleur/:code', permanent: true },
      // Anciennes pages hub submersion → nouveau hub inondation
      { source: '/territoires/submersion', destination: '/inondation', permanent: true },
      { source: '/territoires/submersion/:code(\\d{5}|2[AB]\\d{3})', destination: '/inondation/:code', permanent: true },
      { source: '/savoir/submersion', destination: '/inondation', permanent: true },
      { source: '/savoir/submersion/:code(\\d{5}|2[AB]\\d{3})', destination: '/inondation/:code', permanent: true },
      // LE GABARIT GÉNÉRIQUE `savoir/[slug]` ET `territoires/[slug]` EST RETIRÉ (30/07/2026).
      // Il servait une note composite sur 100 (« score de tension », « capacité d'adaptation »,
      // « mis à jour quotidiennement ») que l'ADR-0001 interdit, et il était la seule surface
      // payante d'Explorer. Les quatre redirections canicule/submersion ci-dessus le vidaient déjà
      // de ses deux thèmes principaux ; restaient feux, cadmium, pollens et sécheresse.
      //
      // Feux : aucun contenu Savoir n'existe sur le sujet, le guide est la seule destination réelle.
      { source: '/savoir/feux', destination: '/agir/feux-forets', permanent: true },
      { source: '/savoir/feux/:code(\\d{5}|2[AB]\\d{3})', destination: '/agir/feux-forets', permanent: true },
      { source: '/territoires/feux', destination: '/agir/feux-forets', permanent: true },
      { source: '/territoires/feux/:code(\\d{5}|2[AB]\\d{3})', destination: '/agir/feux-forets', permanent: true },
      // Cadmium : l'article rédigé `/savoir/cadmium` masquait déjà la route dynamique. La page
      // commune, elle, était servie par le gabarit legacy : parent et enfant appartenaient à deux
      // générations du produit.
      { source: '/savoir/cadmium/:code(\\d{5}|2[AB]\\d{3})', destination: '/savoir/cadmium', permanent: true },
      { source: '/territoires/cadmium', destination: '/savoir/cadmium', permanent: true },
      { source: '/territoires/cadmium/:code(\\d{5}|2[AB]\\d{3})', destination: '/savoir/cadmium', permanent: true },
      // Pollens et sécheresse : AUCUNE redirection volontairement. Il n'existe aucun contenu vers
      // quoi renvoyer, et la doctrine Data Curator dit que leur donnée n'est pas communale (zonale
      // pour les pollens). Un 404 est plus honnête qu'une redirection vers une page hors sujet.
      // Rien n'est indexé (robots.txt en Disallow), donc rien ne casse.

      // Offre d'abonnement retirée du produit (28/07/2026) : les anciennes URLs
      // publiques ne doivent pas tomber en 404.
      { source: '/suivi-bientot', destination: '/', permanent: true },
      { source: '/le-fil', destination: '/', permanent: true },
      { source: '/checkout/suivi', destination: '/checkout/rapport-complet', permanent: true },
      { source: '/checkout/le-fil', destination: '/checkout/rapport-complet', permanent: true },
    ];
  },
};

export default nextConfig;
