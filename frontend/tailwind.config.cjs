// tailwind.config.cjs
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      "light",
      {
        black: {
          // Définir directement les propriétés sans importer de daisyUIThemes
          // Ces valeurs sont basées sur le thème "black" par défaut
          "primary": "#facc15",
          "secondary": "rgb(24, 24, 24)",
          "accent": "#f8fafc",
          "neutral": "#272626",
          "base-100": "#000000",
          "info": "#0ea5e9",
          "success": "#22c55e",
          "warning": "#facc15",
          "error": "#ef4444",
        },
      },
    ],
  },
};