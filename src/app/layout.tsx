import type { Metadata } from "next";
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ConsentBanner } from "@/components/ConsentBanner";
import { PostHogProvider } from "@/components/PostHogProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "futur•e",
  description: "Projection climatique personnelle",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Scripts bootstrap (consent + thème) : inline dans <head>, rendus
            uniquement côté serveur (root layout = Server Component, jamais
            re-rendu en nav client) → exécution avant paint, sans warning React.
            Placement dans <head> = recommandation explicite de React 19. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('futuree-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}})();`,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        {/* GTM dans <body> (et non enfant direct de <html>) : @next/third-parties
            l'injecte via next/script, c'est le placement attendu. */}
        <GoogleTagManager gtmId="GTM-NZ9TS3ZF" />
        <PostHogProvider>
          {children}
        </PostHogProvider>
        <ConsentBanner />
        <Analytics />
        <SpeedInsights />
        <GoogleAnalytics gaId="G-MLT5Y4TC6W" />
      </body>
    </html>
  );
}
