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
      "./data/comparateur-index.json",
      "./data/ze-emploi-na38.json",
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
      // Renommage offre « Suivi » → « Le Fil » (texte + routes publiques)
      { source: '/suivi-bientot', destination: '/le-fil', permanent: true },
      { source: '/checkout/suivi', destination: '/checkout/le-fil', permanent: true },
    ];
  },
};

export default nextConfig;
