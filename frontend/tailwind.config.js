/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // Discord-inspired dark theme — exact hex equivalents in OKLCH
        // #1e1f22 → oklch(0.165 0.006 264)
        // #2b2d31 → oklch(0.215 0.006 264)
        // #313338 → oklch(0.245 0.007 264)
        // #383a40 → oklch(0.275 0.008 264)
        // #5865f2 → oklch(0.55 0.22 264)
        discord: {
          dark:    "#1e1f22",
          sidebar: "#2b2d31",
          chat:    "#313338",
          input:   "#383a40",
          hover:   "#35373c",
          border:  "#1e1f22",
          text:    "#dcddde",
          muted:   "#96989d",
          header:  "#f2f3f5",
          accent:  "#5865f2",
        },
        // dc-* aliases used by LandingPage
        dc: {
          bg:           "#1e1f22",
          sidebar:      "#2b2d31",
          chat:         "#313338",
          input:        "#383a40",
          accent:       "#5865f2",
          "accent-hover": "#4752c4",
          muted:        "#96989d",
          text:         "#dcddde",
          "text-secondary": "#b9bbbe",
        },
        // Neon theme tokens
        neon: {
          bg:     "oklch(0.12 0.02 280)",
          accent: "oklch(0.75 0.25 300)",
          text:   "oklch(0.90 0.05 300)",
          border: "oklch(0.40 0.15 300)",
        },
        // Retro theme tokens
        retro: {
          bg:     "oklch(0.15 0.04 60)",
          accent: "oklch(0.70 0.20 60)",
          text:   "oklch(0.90 0.05 60)",
          border: "oklch(0.40 0.12 60)",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/container-queries"),
  ],
};
