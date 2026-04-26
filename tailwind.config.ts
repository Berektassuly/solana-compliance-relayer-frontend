import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/widgets/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Operations console light theme
        background: "#fdf8f8",
        panel: "#ffffff",
        "panel-hover": "#fafafa",
        border: "#c8c5ca",
        "border-light": "#e4e4e7",
        primary: {
          DEFAULT: "#1c1b1b",
          dark: "#09090b",
          light: "#47464a",
        },
        status: {
          pending: "#78767b",
          confirmed: "#00714d",
          failed: "#ba1a1a",
        },
        foreground: "#1c1b1b",
        muted: "#71717a",
        "muted-dark": "#47464a",
      },
      fontFamily: {
        sans: ["Inter", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #1c1b1b 0%, #09090b 100%)",
        "gradient-radial": "linear-gradient(90deg, #fdf8f8 0%, #fdf8f8 100%)",
      },
      animation: {
        "pulse-slow": "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
