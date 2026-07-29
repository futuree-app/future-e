import type { MetadataRoute } from 'next';
import { isArrondissement } from '@/lib/communes';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://futur-e.fr';

// UNE URL N'ENTRE ICI QUE SI ELLE EST SERVIE, ET SI ELLE EST CANONIQUE SUR SON INTENTION.
//
// Corrigé le 30/07/2026. Deux défauts vivaient dans cette liste : `/savoir/canicule` et
// `/savoir/submersion` y étaient soumis alors qu'ils sont des REDIRECTIONS 308 vers `/chaleur` et
// `/inondation` (un sitemap ne soumet jamais une redirection), et `/inondation` en était absent,
// si bien que sur l'enjeu inondation la seule URL déclarée était la version legacy. Le hub sur
// mesure n'était pas dans son propre sitemap.
//
// Le site est fermé au crawl (`public/robots.txt` en `Disallow: /`, plus `index: false` dans
// `layout.tsx`), donc cette liste ne produit aucun effet aujourd'hui. Elle décrit l'intention.
const STATIC_PAGES: MetadataRoute.Sitemap = [
  { url: BASE_URL,                         priority: 1.0, changeFrequency: 'weekly'  },
  { url: `${BASE_URL}/chaleur`,            priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/inondation`,         priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/ou-vivre`,           priority: 0.9, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/comparateur`,        priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/rapport`,            priority: 0.8, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/pourquoi`,           priority: 0.6, changeFrequency: 'yearly'  },
  { url: `${BASE_URL}/j-utilise-beaucoup-ma-voiture`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/cadmium`,     priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/dependance-auto`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/maladies-emergentes`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/pollutions-invisibles`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/chaleur-sante-mentale`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/savoir/preparation-catastrophes`, priority: 0.7, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/canicule`,      priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/cadmium`,       priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/inondation`,    priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/feux-forets`,   priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/dependance-auto`, priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/pollutions-invisibles`, priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/agir/voiture-electrique`, priority: 0.6, changeFrequency: 'monthly' },
  { url: `${BASE_URL}/mentions-legales`,   priority: 0.2, changeFrequency: 'yearly'  },
  { url: `${BASE_URL}/politique-confidentialite`, priority: 0.2, changeFrequency: 'yearly' },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let communeEntries: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(
      'https://geo.api.gouv.fr/communes?fields=code&limit=35000',
      { next: { revalidate: 86400 * 30 } },
    );
    const communes: { code: string }[] = await res.json();

    communeEntries = communes
      .filter((c) => !isArrondissement(c.code))
      .map((c) => ({
        url: `${BASE_URL}/chaleur/${c.code}`,
        priority: 0.6,
        changeFrequency: 'monthly' as const,
      }));
  } catch {
    // Le sitemap des communes reste vide si l'API est indisponible au build
  }

  return [...STATIC_PAGES, ...communeEntries];
}
