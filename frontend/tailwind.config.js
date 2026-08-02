/**
 * tailwind.config.js
 *
 * NOTE: This project uses Tailwind CSS v4.
 * In v4, theme customisation is done via CSS @theme in index.css,
 * NOT in this JS file. This file is kept for compatibility but
 * the active configuration lives in src/index.css.
 *
 * The content paths below are still used by the v4 PostCSS plugin
 * to scan for class names during the build.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
