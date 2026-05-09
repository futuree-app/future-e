import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
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
    ];
  },
};

export default nextConfig;
