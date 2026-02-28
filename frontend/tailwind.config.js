/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Discord-inspired palette
        'dc-bg':      'oklch(0.22 0.01 260)',
        'dc-sidebar': 'oklch(0.20 0.01 260)',
        'dc-chat':    'oklch(0.24 0.01 260)',
        'dc-input':   'oklch(0.26 0.01 260)',
        'dc-accent':  'oklch(0.60 0.18 265)',
        'dc-muted':   'oklch(0.60 0.02 260)',

        // Neon theme tokens
        'neon-bg':      'oklch(0.10 0.02 145)',
        'neon-primary': 'oklch(0.75 0.30 145)',
        'neon-accent':  'oklch(0.75 0.30 320)',

        // Retro theme tokens
        'retro-bg':      'oklch(0.18 0.04 50)',
        'retro-primary': 'oklch(0.65 0.20 50)',
        'retro-accent':  'oklch(0.60 0.18 185)',

        // shadcn/ui tokens
        background:  'oklch(var(--background) / <alpha-value>)',
        foreground:  'oklch(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT:     'oklch(var(--card) / <alpha-value>)',
          foreground:  'oklch(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT:     'oklch(var(--popover) / <alpha-value>)',
          foreground:  'oklch(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT:     'oklch(var(--primary) / <alpha-value>)',
          foreground:  'oklch(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT:     'oklch(var(--secondary) / <alpha-value>)',
          foreground:  'oklch(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT:     'oklch(var(--muted) / <alpha-value>)',
          foreground:  'oklch(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT:     'oklch(var(--accent) / <alpha-value>)',
          foreground:  'oklch(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT:     'oklch(var(--destructive) / <alpha-value>)',
          foreground:  'oklch(var(--destructive-foreground) / <alpha-value>)',
        },
        border:  'oklch(var(--border) / <alpha-value>)',
        input:   'oklch(var(--input) / <alpha-value>)',
        ring:    'oklch(var(--ring) / <alpha-value>)',
        chart: {
          '1': 'oklch(var(--chart-1) / <alpha-value>)',
          '2': 'oklch(var(--chart-2) / <alpha-value>)',
          '3': 'oklch(var(--chart-3) / <alpha-value>)',
          '4': 'oklch(var(--chart-4) / <alpha-value>)',
          '5': 'oklch(var(--chart-5) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/container-queries'),
  ],
};
