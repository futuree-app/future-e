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
    // FUT-147 : les incendies enregistrés (BDIFF), lus après le classement par la ligne de carte et le
    // Dossier comparatif (lib/bdiff-incendies-commune.ts). Toutes les routes qui assemblent un comparatif.
    "/api/comparateur-vie/match": [
      "./data/comparateur-index.json.gz",
      "./data/ze-emploi-na38.json",
      "./data/bdiff-incendies.json",
      // FUT-148 : la fibre des communes proposées, seulement si le projet en parle (lib/fibre-commune.ts).
      "./data/arcep-fibre.json",
    ],
    "/api/comparateur-vie/apercu": ["./data/bdiff-incendies.json"],
    // FUT-152 : le registre IREP des émissions polluantes, lu par la page /agir/pollutions-invisibles.
    "/api/proxy/irep": ["./data/irep-registre.json"],
    "/comparateur": ["./data/bdiff-incendies.json"],
    "/comparateur/pack-decision": ["./data/bdiff-incendies.json"],
    // Module Territoire : la page et la synthèse lisent l'index (carte d'identité,
    // trait distinctif, démographie, couvert naturel) et la saisonnalité.
    "/rapport/quartier": [
      "./data/comparateur-index.json.gz",
      "./data/residences-secondaires.json",
      "./data/communes-baignade.json",
      "./data/gaspar-pprn-inondation.json",
      // FUT-147 : la carte feu lit les incendies enregistrés, hors du snapshot (lib/bdiff-incendies-commune.ts).
      "./data/bdiff-incendies.json",
      // FUT-148 : la carte « Fibre optique », lue hors du snapshot (lib/fibre-commune.ts).
      "./data/arcep-fibre.json",
      // FUT-167 : la carte « Santé environnementale » lit l'index des sites Seveso (lib/server/installations-seveso.ts).
      "./data/installations-seveso.json",
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
    // FUT-146 : les plans de bruit aérien (lib/server/bruit-aerien-jeu.ts), lus à la parcelle.
    "/api/georisques-logement": [
      "./data/onrn-secheresse.json",
      "./data/onrn-inondation.json",
      "./data/bruit-aerien.json",
      // FUT-167 (D2) : les sites Seveso autour de l'adresse (lib/server/installations-seveso.ts).
      "./data/installations-seveso.json",
    ],
    // La PAGE du module Logement lit l'index pour le compte d'arrêtés inondation, qui réconcilie
    // les trois sources de la carte « Ce que disent les sources sur l'inondation ». Il est lu ICI
    // et pas dans `/api/georisques-logement` : cette route fait déjà un fan-out d'une dizaine
    // d'API externes, et le compte doit venir de l'artefact du dossier d'abord, que seule la page
    // sait lire.
    "/rapport/logement": ["./data/comparateur-index.json.gz"],
    // Face 3 « autour de cette adresse » : la lib logement-bpe.ts lit les shards
    // de points BPE par cellule ; la lib icu.ts lit l'index îlot de chaleur (grand-IRIS).
    // FUT-97 : `/qna` nomme la gare de la commune et la plus proche d'après les gares BPE (lib/gares-bpe.ts,
    // 273 Ko), et lit l'index (signaux du territoire), jusqu'ici inclus par le seul traçage automatique.
    "/qna": [
      "./data/comparateur-index.json.gz",
      "./data/gares-bpe.json",
    ],
    // FUT-146 : les plans de bruit aérien, relus au rendu par l'assembleur de la réponse Autour, que la
    // route ET la page (réhydratation) appellent.
    "/api/logement-autour": [
      "./data/bpe-points/**",
      "./data/icu.json",
      "./data/bruit-aerien.json",
    ],
    "/rapport/autour": ["./data/bruit-aerien.json"],
    // FUT-33 : le dossier mesure la distance d'une ADRESSE au rivage marin (lib/server/rivage-mer.ts). Les
    // trois points d'entrée qui génèrent ou affichent un dossier d'adresse lisent ce fichier.
    // FUT-127 : la règle inondation lit les plans de prévention de la commune (lib/gaspar-pprn-commune.ts).
    "/rapport": ["./data/mer/rivage-5m.f32.gz", "./data/gaspar-pprn-inondation.json"],
    "/api/dossier/actualiser": ["./data/mer/rivage-5m.f32.gz", "./data/gaspar-pprn-inondation.json"],
    "/api/stripe/webhook": ["./data/mer/rivage-5m.f32.gz", "./data/gaspar-pprn-inondation.json"],
    // (Il exista ici deux entrées pour les métriques de police de pdfkit. Elles n'ont RIEN changé :
    // la production répondait toujours `ENOENT ... pdfkit/js/data/Helvetica.afm`. Le rendu passe
    // désormais par `pdfkit.standalone.js`, qui embarque ces métriques et ne lit aucun fichier ;
    // voir l'en-tête de `src/lib/server/invoice-pdf.ts`.)
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
