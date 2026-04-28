import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SokoDeal — Africa's Marketplace",
  description: "Achetez, vendez et trouvez un emploi en Afrique",
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
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet"/>
      </head>
      <body style={{margin:0, padding:0, background:'#f0f4f1'}}>{children}</body>
    </html>
  );
}