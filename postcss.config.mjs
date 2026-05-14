// Tailwind v4 uses the dedicated PostCSS plugin.
// CSS-first theme tokens live in src/app/globals.css (BUILD_INSTRUCTIONS §11).
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};

export default config;
