import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ZernFlow - La alternativa open source a ManyChat",
    template: "%s | ZernFlow",
  },
  description:
    "Automatiza mensajes directos, comentarios y flujos en Instagram, Facebook, WhatsApp, Telegram, X, Bluesky y Reddit. Gratis, autoalojable y de código abierto.",
  metadataBase: new URL("https://zernflow.com"),
  openGraph: {
    title: "ZernFlow - La alternativa open source a ManyChat",
    description:
      "Automatiza mensajes directos, comentarios y flujos en Instagram, Facebook, WhatsApp, Telegram, X, Bluesky y Reddit. Gratis, autoalojable y de código abierto.",
    url: "https://zernflow.com",
    siteName: "ZernFlow",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ZernFlow - La alternativa open source a ManyChat",
    description:
      "Automatiza mensajes directos, comentarios y flujos en 7 plataformas. Gratis, autoalojable y de código abierto.",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem("theme")==="dark"||(!localStorage.getItem("theme")&&matchMedia("(prefers-color-scheme:dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
