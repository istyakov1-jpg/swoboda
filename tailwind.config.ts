import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Wired to the next/font CSS variable set in app/layout.tsx
        sans: ["var(--font-manrope)", "system-ui", "sans-serif"],
      },
      colors: {
        // Surfaces
        ink: "#07070D", // page canvas
        panel: "#0B0B13", // phone body
        surface: "#0D0D1A", // brand base dark

        // Brand gold (money + victory)
        gold: {
          DEFAULT: "#F5B843",
          light: "#FBD888",
          dark: "#E0891F",
          soft: "#C8A24A", // muted gold text
          glow: "#FFF0CB",
        },

        // Semantic cell + state colors
        pos: "#34D399", // возможность / positive / green
        neg: "#FB6B6B", // удар / negative / red
        info: "#5B9DF9", // биржа / blue
        warn: "#F4C430", // событие / yellow
        violet: "#A78BFA", // аукцион / purple

        // Text scale
        hi: "#F4F5FA", // primary
        body: "#C7CBD6", // secondary
        muted: "#9AA0B4", // tertiary
        faint: "#8B91A6", // quaternary
        dim: "#6B7185", // disabled / inactive
      },
      keyframes: {
        glowPulse: {
          "0%,100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        confFall: {
          "0%": { transform: "translateY(0) rotate(0deg)", opacity: "1" },
          "100%": { transform: "translateY(900px) rotate(540deg)", opacity: "0" },
        },
        ringPulse: {
          "0%,100%": {
            boxShadow:
              "0 0 0 0 rgba(245,184,67,.45), 0 16px 36px -10px rgba(245,184,67,.55)",
          },
          "50%": {
            boxShadow:
              "0 0 0 10px rgba(245,184,67,0), 0 16px 36px -10px rgba(245,184,67,.55)",
          },
        },
      },
      animation: {
        glow: "glowPulse 2.2s ease-in-out infinite",
        floaty: "floaty 3.2s ease-in-out infinite",
        conf: "confFall 4s linear infinite",
        ring: "ringPulse 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
