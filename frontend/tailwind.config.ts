import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        brand: {
          olive: "#606c38",
          moss: "#8a9a52",
          forest: "#283618",
          cornsilk: "#fefae0",
          caramel: "#dda15e",
          copper: "#bc6c25",
          ember: "#e2703a",
        },
        ink: {
          950: "#080906",
          900: "#0b0c08",
          800: "#11130c",
          700: "#181b10",
          600: "#222616",
        },
        canvas: {
          dark: "#0b0c08",
        },
        surface: {
          card: "rgba(254, 250, 224, 0.035)",
          hover: "rgba(254, 250, 224, 0.07)",
        },
        border: {
          subtle: "rgba(254, 250, 224, 0.09)",
        },
        text: {
          primary: "#f5f0d8",
          secondary: "#a8a58c",
          muted: "#77755f",
        },
        danger: "#e5634d",
      },
      fontFamily: {
        sans: ['"Inter Variable"', "Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ['"Fraunces Variable"', "Fraunces", "Georgia", "serif"],
        mono: ['"JetBrains Mono Variable"', "JetBrains Mono", "SF Mono", "Menlo", "Consolas", "monospace"],
      },
      letterSpacing: {
        label: "0.14em",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(254,250,224,0.05) inset, 0 24px 48px -24px rgba(0,0,0,0.7)",
        glow: "0 0 0 1px rgba(221,161,94,0.35), 0 8px 32px -8px rgba(221,161,94,0.35)",
      },
      animation: {
        shimmer: "shimmer 1.8s ease-in-out infinite",
        "ping-soft": "ping-soft 2.4s cubic-bezier(0, 0, 0.2, 1) infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "sheen": "sheen 5s ease-in-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ping-soft": {
          "0%": { transform: "scale(1)", opacity: "0.55" },
          "80%, 100%": { transform: "scale(2.6)", opacity: "0" },
        },
        sheen: {
          "0%, 55%": { transform: "translateX(-120%)" },
          "100%": { transform: "translateX(220%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
