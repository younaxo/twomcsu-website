import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        canvas: 'hsl(var(--canvas))',
        surface: {
          DEFAULT: 'hsl(var(--surface))',
          raised: 'hsl(var(--surface-raised))',
          sunken: 'hsl(var(--surface-sunken))',
        },
        overlay: 'hsl(var(--overlay) / var(--overlay-opacity))',
        border: {
          DEFAULT: 'hsl(var(--border))',
        },
        separator: 'hsl(var(--separator))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        focus: 'hsl(var(--focus))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          hover: 'hsl(var(--primary-hover))',
          active: 'hsl(var(--primary-active))',
          muted: 'hsl(var(--primary-muted))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          solid: 'hsl(var(--destructive-solid))',
        },
        control: {
          fill: 'hsl(var(--control-fill))',
          hover: 'hsl(var(--control-hover))',
          active: 'hsl(var(--control-active))',
          disabled: 'hsl(var(--control-disabled))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          solid: 'hsl(var(--success-solid))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          solid: 'hsl(var(--warning-solid))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          solid: 'hsl(var(--info-solid))',
        },
      },
      boxShadow: {
        'glow-primary': '0 0 24px hsl(var(--primary) / 0.35)',
        xs: 'var(--shadow-xs)',
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-hover)))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        control: 'var(--radius-control)',
        card: 'var(--radius-card)',
        window: 'var(--radius-window)',
      },
      transitionDuration: {
        instant: '120ms',
        fast: '180ms',
        base: '220ms',
        slow: '320ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-out': 'cubic-bezier(0.65, 0, 0.35, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(2px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
      },
      fontFamily: {
        sans: [
          'var(--font-geologica)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        display: [
          'var(--font-geologica)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        geologica: [
          'var(--font-geologica)',
          'ui-sans-serif',
          'system-ui',
          'sans-serif',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Segoe UI Symbol',
          'Noto Color Emoji',
        ],
        mono: [
          'var(--font-mono)',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [animate],
};

export default config;
