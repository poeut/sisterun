import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "SisterRun — Courez ensemble, en sécurité",
  description:
    "Application communautaire de course pour femmes : courses en groupe vérifiées, parcours sûrs, alertes SOS.",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#7B2D8E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <head>
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        />
      </head>
      <body className="font-sans">
        <SessionProvider>
          <div className="phone-frame">{children}</div>
          <Toaster richColors position="top-center" closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
