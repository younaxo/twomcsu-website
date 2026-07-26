import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b0d10',
        surface: '#12161b',
        outline: '#222a33',
        muted: '#98a2b3',
        accent: '#4ade80',
      },
      fontFamily: {
        sans: ['var(--font-onest)', 'system-ui', 'sans-serif'],
        display: ['var(--font-geologica)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
