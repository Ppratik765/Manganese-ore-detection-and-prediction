import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MOIL Limited | Space-Tech Manganese Intelligence & Mine Production Shortfall Prevention",
  description: "AI/ML and Space Technology platform for Manganese reserve identification and mine production shortfall prevention for MOIL Limited (SIH 2026).",
  keywords: ["MOIL", "Manganese Mining", "SIH 2026", "Geospatial AI", "Sentinel-2", "U-Net", "XGBoost", "Prescriptive Dispatch"],
  authors: [{ name: "Priyanshu Pratik & Team", url: "https://github.com/Ppratik765/Manganese-ore-detection-and-prediction" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-canvas-dark text-text-primary min-h-screen antialiased selection:bg-brand-cyan selection:text-canvas-dark">
        {children}
      </body>
    </html>
  );
}
