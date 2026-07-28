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
      { source: '/territoires/canicule/:code', destination: '/chaleur/:code', permanent: true },
      { source: '/savoir/canicule', destination: '/chaleur', permanent: true },
      { source: '/savoir/canicule/:code', destination: '/chaleur/:code', permanent: true },
      // Anciennes pages hub submersion → nouveau hub inondation
      { source: '/territoires/submersion', destination: '/inondation', permanent: true },
      { source: '/territoires/submersion/:code', destination: '/inondation/:code', permanent: true },
      { source: '/savoir/submersion', destination: '/inondation', permanent: true },
      { source: '/savoir/submersion/:code', destination: '/inondation/:code', permanent: true },
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
