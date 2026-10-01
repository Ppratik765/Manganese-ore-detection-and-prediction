import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/fraunces/opsz.css";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { MotionProvider } from "@/hooks/useMotionPreference";
import { TerrainBackground } from "@/components/ui/TerrainBackground";

export const metadata: Metadata = {
  title: "MOIL Limited | Space-Tech Manganese Intelligence & Mine Production Shortfall Prevention",
  description: "AI/ML and Space Technology platform for Manganese reserve identification and mine production shortfall prevention for MOIL Limited (SIH 2026).",
  keywords: ["MOIL", "Manganese Mining", "SIH 2026", "Geospatial AI", "Sentinel-2", "U-Net", "XGBoost", "Prescriptive Dispatch"],
  authors: [{ name: "Priyanshu Pratik & Team", url: "https://github.com/Ppratik765/Manganese-ore-detection-and-prediction" }],
  icons: {
    icon: "/gold.png",
    shortcut: "/gold.png",
    apple: "/gold.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0c08",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-motion="on">
      <body className="bg-canvas-dark text-text-primary min-h-screen antialiased">
        <MotionProvider>
          <TerrainBackground />
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
