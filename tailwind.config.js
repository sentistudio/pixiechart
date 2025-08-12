/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Apple HIG inspired semantic colors
        'clr-bg': 'var(--clr-bg)',
        'clr-bg-secondary': 'var(--clr-bg-secondary)',
        'clr-primary': 'var(--clr-primary)',
        'clr-secondary': 'var(--clr-secondary)',
        'clr-accent': 'var(--clr-accent)',
        'clr-info': 'var(--clr-info)',
        'clr-success': 'var(--clr-success)',
        'clr-warning': 'var(--clr-warning)',
        'clr-error': 'var(--clr-error)',
        'clr-text': 'var(--clr-text)',
        'clr-text-secondary': 'var(--clr-text-secondary)',
        'clr-border': 'var(--clr-border)',
        'clr-hover': 'var(--clr-hover)',
        'clr-active': 'var(--clr-active)',
      },
      fontFamily: {
        'sf': ['SF Pro Display', 'SF Pro Text', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'body': 'clamp(1rem, 2.5vw, 1.125rem)',
        'heading': 'clamp(1.5rem, 4vw, 2rem)',
        'title': 'clamp(2rem, 5vw, 3rem)',
      },
      spacing: {
        '1.5': '0.375rem',
        '2.5': '0.625rem',
        '3.5': '0.875rem',
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '6.5': '1.625rem',
        '7.5': '1.875rem',
        '8.5': '2.125rem',
        '9.5': '2.375rem',
        '10.5': '2.625rem',
        '11.5': '2.875rem',
        '12.5': '3.125rem',
        '13.5': '3.375rem',
        '14.5': '3.625rem',
        '15.5': '3.875rem',
        '16.5': '4.125rem',
        '17.5': '4.375rem',
        '18.5': '4.625rem',
        '19.5': '4.875rem',
        '20.5': '5.125rem',
      },
      borderRadius: {
        'apple': '8px',
        'apple-lg': '12px',
        'apple-xl': '16px',
      },
      backdropFilter: {
        'glass': 'blur(20px) saturate(180%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spring': 'spring 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        spring: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 