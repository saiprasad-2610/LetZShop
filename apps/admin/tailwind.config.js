/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        admin: {
          bg: 'var(--admin-bg)',
          surface: 'var(--admin-surface)',
          raised: 'var(--admin-raised)',
          border: 'var(--admin-border)',
          text: 'var(--admin-text)',
          secondary: 'var(--admin-secondary)',
          muted: 'var(--admin-muted)',
          primary: 'var(--admin-primary)',
          'on-primary': 'var(--admin-on-primary)',
          accent: 'var(--admin-accent)',
          soft: 'var(--admin-soft)',
          danger: 'var(--admin-danger)',
          'danger-soft': 'var(--admin-danger-soft)',
          warning: 'var(--admin-warning)',
          'warning-soft': 'var(--admin-warning-soft)',
          overlay: 'var(--admin-overlay)',
          header: 'var(--admin-header)',
        },
      },
    },
  },
  plugins: [],
};
