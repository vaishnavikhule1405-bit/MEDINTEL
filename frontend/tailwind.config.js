/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── MedIntel Design System ──────────────────────────────────────
        // Zinc-based neutrals (premium, not generic blue)
        // Emerald accent for healthcare trustworthiness
        mi: {
          // Surfaces
          bg:        { DEFAULT: '#ffffff',   dark: '#09090b' },
          surface:   { DEFAULT: '#fafafa',   dark: '#18181b' },
          surface2:  { DEFAULT: '#f4f4f5',   dark: '#27272a' },
          // Borders
          border:    { DEFAULT: '#e4e4e7',   dark: '#3f3f46' },
          'border-strong': { DEFAULT: '#d4d4d8', dark: '#52525b' },
          // Text
          text:      { DEFAULT: '#09090b',   dark: '#fafafa' },
          'text-2':  { DEFAULT: '#71717a',   dark: '#a1a1aa' },
          muted:     { DEFAULT: '#a1a1aa',   dark: '#52525b' },
          // Accent – emerald (healthcare)
          accent:    { DEFAULT: '#10b981',   dark: '#34d399' },
          'accent-bg': { DEFAULT: '#ecfdf5', dark: '#022c22' },
          'accent-border': { DEFAULT: '#6ee7b7', dark: '#065f46' },
          // Status
          warning:   { DEFAULT: '#f59e0b',   dark: '#fbbf24' },
          'warning-bg': { DEFAULT: '#fffbeb', dark: '#1c1003' },
          danger:    { DEFAULT: '#ef4444',   dark: '#f87171' },
          'danger-bg':  { DEFAULT: '#fef2f2', dark: '#1a0000' },
          info:      { DEFAULT: '#3b82f6',   dark: '#60a5fa' },
          'info-bg': { DEFAULT: '#eff6ff',   dark: '#0c1a3a' },
        },
        // Legacy tokens kept for backwards compat during transition
        clinical: {
          navy:  '#0f172a',
          slate: '#475569',
          muted: '#64748b',
          surface: '#ffffff',
          bg:    '#f8fafc',
          border: '#e2e8f0',
          blue:  '#0284c7',
          'blue-light': '#f0f9ff',
          teal:  '#0d9488',
          'teal-light': '#f0fdfa',
          emerald: '#059669',
          amber: '#d97706',
          'amber-light': '#fffbeb',
          rose:  '#e11d48',
          'rose-light': '#fff1f2',
          purple: '#7c3aed',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        // Very subtle — Cliste style (no heavy shadows)
        'mi-sm': '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        'mi':    '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'mi-md': '0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04)',
        // Legacy
        'clinical':    '0 1px 3px 0 rgba(15,23,42,0.06), 0 1px 2px -1px rgba(15,23,42,0.04)',
        'clinical-md': '0 4px 6px -1px rgba(15,23,42,0.07), 0 2px 4px -2px rgba(15,23,42,0.05)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      transitionDuration: {
        '150': '150ms',
      },
    },
  },
  plugins: [],
}
