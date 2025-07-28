/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // ✅ React components
    "./public/index.html"         // ✅ Optional for CRA
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
