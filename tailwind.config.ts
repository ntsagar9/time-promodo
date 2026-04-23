import type { Config } from 'tailwindcss'

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist Variable', 'Inter', 'system-ui', 'sans-serif']
      },
      colors: {
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
        surface: 'hsl(var(--surface) / <alpha-value>)',
        muted: 'hsl(var(--muted) / <alpha-value>)'
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0, 0, 0, 0.12)'
      }
    }
  },
  plugins: []
} satisfies Config
