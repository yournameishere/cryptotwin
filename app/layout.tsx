import type { Metadata, Viewport } from "next";
import { Geist, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";

import "@/app/globals.css";
import { SiteShell } from "@/components/site-shell";
import { getAppBaseUrl } from "@/lib/site-url";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(getAppBaseUrl()),
  title: {
    default: "CryptoTwin AI",
    template: "%s | CryptoTwin AI"
  },
  description:
    "Find the live market asset that most closely resembles a coin's current market DNA.",
  applicationName: "CryptoTwin AI",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "any" }
    ],
    apple: "/apple-touch-icon.svg"
  },
  openGraph: {
    title: "CryptoTwin AI",
    description:
      "Live CoinMarketCap data, market DNA extraction, and AI explanations for crypto twin discovery.",
    type: "website",
    url: "/",
    siteName: "CryptoTwin AI",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "CryptoTwin AI live market DNA dashboard"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoTwin AI",
    description:
      "Live market DNA extraction and AI explanations for crypto twin discovery.",
    images: ["/twitter-image"]
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#101815"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geist.variable} ${spaceGrotesk.variable} ${jetBrainsMono.variable}`}
    >
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
