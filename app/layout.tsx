import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter, Instrument_Serif } from "next/font/google";
import { site } from "@/content/site";
import "./globals.css";

const sans = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const display = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-instrument", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.role}`, template: `%s — ${site.name}` },
  description: site.summary,
  openGraph: { title: site.name, description: site.summary, type: "website", url: site.url },
  twitter: { card: "summary", title: site.name, description: site.summary },
};

export const viewport: Viewport = { themeColor: "#000000", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Marks JS as available (so reveal styles only apply when they can be undone) and skips the intro after the first visit. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js');try{if(sessionStorage.getItem('ros-intro'))document.documentElement.classList.add('intro-seen')}catch(e){}" }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
