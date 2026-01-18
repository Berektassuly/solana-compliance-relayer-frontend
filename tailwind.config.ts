import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // DeFi Dark Theme
        background: "#0b0f14",
        panel: "#111722",
        "panel-hover": "#1a2332",
        border: "#1f2a3a",
        "border-light": "#2d3a4d",
        // Purple Gradient
        primary: {
          DEFAULT: "#7c3aed",
          dark: "#5b21b6",
          light: "#a78bfa",
        },
        // Status Colors
        status: {
          pending: "#eab308",
          confirmed: "#22c55e",
          failed: "#ef4444",
        },
        // Text
        foreground: "#ffffff",
        muted: "#94a3b8",
        "muted-dark": "#64748b",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-primary": "linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)",
        "gradient-radial": "radial-gradient(ellipse at top, #1a1f2e 0%, #0b0f14 50%)",
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
