import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { SessionProvider } from "@/components/auth/SessionProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
    <html lang="fr" className={inter.variable}>
      <body className="font-sans">
        <SessionProvider>
          <div className="phone-frame">{children}</div>
          <Toaster richColors position="top-center" closeButton />
        </SessionProvider>
      </body>
    </html>
  );
}
