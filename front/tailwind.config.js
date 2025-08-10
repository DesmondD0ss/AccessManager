/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'jetbrains': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
        'sans': ['JetBrains Mono', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'Noto Sans', 'sans-serif'],
        'mono': ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', 'monospace'],
      },
      colors: {
        // Canvas (Arrière-plans)
        'canvas': {
          'default': 'rgb(var(--color-canvas-default))',
          'overlay': 'rgb(var(--color-canvas-overlay))',
          'inset': 'rgb(var(--color-canvas-inset))',
          'subtle': 'rgb(var(--color-canvas-subtle))',
        },
        
        // Foreground (Textes)
        'fg': {
          'default': 'rgb(var(--color-fg-default))',
          'muted': 'rgb(var(--color-fg-muted))',
          'subtle': 'rgb(var(--color-fg-subtle))',
          'on-emphasis': 'rgb(var(--color-fg-on-emphasis))',
        },
        
        // Bordures
        'border': {
          'default': 'rgb(var(--color-border-default))',
          'muted': 'rgb(var(--color-border-muted))',
          'subtle': 'rgb(var(--color-border-subtle))',
        },
        
        // Boutons
        'btn': {
          'text': 'rgb(var(--color-btn-text))',
          'bg': 'rgb(var(--color-btn-bg))',
          'border': 'rgb(var(--color-btn-border))',
          'hover-bg': 'rgb(var(--color-btn-hover-bg))',
          'hover-border': 'rgb(var(--color-btn-hover-border))',
          'active-bg': 'rgb(var(--color-btn-active-bg))',
          'active-border': 'rgb(var(--color-btn-active-border))',
          'selected-bg': 'rgb(var(--color-btn-selected-bg))',
        },
        
        // Boutons Primary
        'btn-primary': {
          'text': 'rgb(var(--color-btn-primary-text))',
          'bg': 'rgb(var(--color-btn-primary-bg))',
          'border': 'rgb(var(--color-btn-primary-border))',
          'hover-bg': 'rgb(var(--color-btn-primary-hover-bg))',
          'hover-border': 'rgb(var(--color-btn-primary-hover-border))',
          'selected-bg': 'rgb(var(--color-btn-primary-selected-bg))',
          'selected-shadow': 'rgb(var(--color-btn-primary-selected-shadow))',
          'disabled-text': 'rgb(var(--color-btn-primary-disabled-text))',
          'disabled-bg': 'rgb(var(--color-btn-primary-disabled-bg))',
          'disabled-border': 'rgb(var(--color-btn-primary-disabled-border))',
        },
        
        // Accent
        'accent': {
          'fg': 'rgb(var(--color-accent-fg))',
          'emphasis': 'rgb(var(--color-accent-emphasis))',
          'muted': 'rgb(var(--color-accent-muted))',
          'subtle': 'rgb(var(--color-accent-subtle))',
        },
        
        // Success
        'success': {
          'fg': 'rgb(var(--color-success-fg))',
          'emphasis': 'rgb(var(--color-success-emphasis))',
          'muted': 'rgb(var(--color-success-muted))',
          'subtle': 'rgb(var(--color-success-subtle))',
        },
        
        // Attention/Warning
        'attention': {
          'fg': 'rgb(var(--color-attention-fg))',
          'emphasis': 'rgb(var(--color-attention-emphasis))',
          'muted': 'rgb(var(--color-attention-muted))',
          'subtle': 'rgb(var(--color-attention-subtle))',
        },
        
        // Danger
        'danger': {
          'fg': 'rgb(var(--color-danger-fg))',
          'emphasis': 'rgb(var(--color-danger-emphasis))',
          'muted': 'rgb(var(--color-danger-muted))',
          'subtle': 'rgb(var(--color-danger-subtle))',
        },
        
        // Inputs
        'input': {
          'bg': 'rgb(var(--color-input-bg))',
          'border': 'rgb(var(--color-input-border))',
          'disabled-bg': 'rgb(var(--color-input-disabled-bg))',
          'disabled-border': 'rgb(var(--color-input-disabled-border))',
        },
      },
      boxShadow: {
        'github-shadow-small': '0 1px 2px rgba(106, 115, 125, 0.3)',
        'github-shadow-medium': '0 3px 6px rgba(140, 149, 159, 0.15)',
        'github-shadow-large': '0 8px 24px rgba(140, 149, 159, 0.2)',
        'github-shadow-extra-large': '0 12px 28px rgba(140, 149, 159, 0.15)',
        // Dark mode shadows
        'github-dark-shadow-small': '0 0 transparent',
        'github-dark-shadow-medium': '0 3px 6px rgba(0, 0, 0, 0.12)',
        'github-dark-shadow-large': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'github-dark-shadow-extra-large': '0 12px 28px rgba(0, 0, 0, 0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('@tailwindcss/aspect-ratio'),
  ],
}
