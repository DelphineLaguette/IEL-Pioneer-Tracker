/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ibl: {
          navy:  '#002060',
          cyan:  '#00D0DA',
          pink:  '#FF51A1',
        },
      },
    },
  },
  plugins: [],
}
