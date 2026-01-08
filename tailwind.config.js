/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0A0A0A',
        card: '#161616',
        border: '#262626',
        accent: '#8B5CF6',
        success: '#22C55E',
        freshness: '#F59E0B',
        authority: '#60A5FA'
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.35)',
        glow: '0 0 0 1px rgba(255,255,255,0.03), 0 0 30px rgba(139,92,246,0.15)'
      }
    }
  },
  plugins: []
};
