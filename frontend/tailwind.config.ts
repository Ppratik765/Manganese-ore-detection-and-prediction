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
          olive: "#606c38", // Olive Leaf
          forest: "#283618", // Black Forest
          cornsilk: "#fefae0", // Cornsilk
          caramel: "#dda15e", // Light Caramel
          copper: "#bc6c25", // Copper
        },
        canvas: {
          dark: "#121212", // Dark Obsidian background
        },
        surface: {
          card: "#3a4624", // Custom blend: slightly lighter than Black Forest for contrast
          hover: "#606c38", // Olive Leaf for hover states
        },
        border: {
          subtle: "#606c38", // Olive Leaf for borders
        },
        text: {
          primary: "#fefae0", // Cornsilk
          secondary: "#dda15e", // Light Caramel
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "SF Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scanline": "scanline 8s linear infinite",
        "radar-sweep": "radar 4s linear infinite",
      },
      keyframes: {
        scanline: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(1000%)" },
        },
        radar: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        }
      }
    },
  },
  plugins: [],
};

export default config;
