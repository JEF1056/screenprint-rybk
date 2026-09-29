/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        printYellow: '#FFD700',
        printRed: '#E63946',
        printBlue: '#1D3557',
        printBlack: '#111111'
      }
    },
  },
  plugins: [],
}
