/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        groww: {
          bg: "#0B0E14",
          card: "#121824",
          cardBorder: "#1E293B",
          cardHover: "#182232",
          green: "#00D09C",
          greenLight: "rgba(0, 208, 156, 0.12)",
          red: "#EB5757",
          redLight: "rgba(235, 87, 87, 0.12)",
          amber: "#F2994A",
          amberLight: "rgba(242, 153, 74, 0.12)",
          textPrimary: "#F8FAFC",
          textSecondary: "#94A3B8",
          textMuted: "#64748B",
          accent: "#5367FF"
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
