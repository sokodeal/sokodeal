import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "SokoDeal — Marketplace N°1 en Afrique",
    template: "%s | SokoDeal"
  },
  description: "Achetez, vendez et louez facilement en Afrique. Immobilier, vehicules, electronique, emploi et plus encore. Des milliers d annonces au Rwanda et en Afrique.",
  keywords: ["annonces", "Rwanda", "Kigali", "immobilier", "voitures", "emploi", "marketplace", "Afrique", "acheter", "vendre", "SokoDeal"],
  authors: [{ name: "SokoDeal" }],
  creator: "SokoDeal",
  publisher: "SokoDeal",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    }
  },
  openGraph: {
    type: "website",
    locale: "fr_RW",
    url: "https://sokodeal.app",
    siteName: "SokoDeal",
    title: "SokoDeal — Marketplace N°1 en Afrique",
    description: "Achetez, vendez et louez facilement en Afrique. Immobilier, vehicules, electronique, emploi et plus encore.",
    images: [
      {
        url: "https://sokodeal.app/og-image.png",
        width: 1200,
        height: 630,
        alt: "SokoDeal — Marketplace N°1 en Afrique",
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SokoDeal — Marketplace N°1 en Afrique",
    description: "Achetez, vendez et louez facilement en Afrique.",
    images: ["https://sokodeal.app/og-image.png"],
  },
  alternates: {
    canonical: "https://sokodeal.app",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/favicon.ico",
  },
  verification: {
    google: "",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <meta name="theme-color" content="#0f5233"/>
        <meta name="geo.region" content="RW"/>
        <meta name="geo.placename" content="Kigali, Rwanda"/>
        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0, padding:0, background:'#f5f7f5'}}>{children}</body>
    </html>
  );
}