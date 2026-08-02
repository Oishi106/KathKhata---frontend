/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: {
          50: "#fdfbf7",
          100: "#faf5ec",
          200: "#f3e8d5"
        },
        wood: {
          50: "#fbf3ea",
          100: "#f0ddc4",
          200: "#e0bd8f",
          300: "#c99a63",
          400: "#a97a45",
          500: "#8a5f34",
          600: "#6f4a29",
          700: "#573920",
          800: "#402a18",
          900: "#2b1c10"
        },
        forest: {
          50: "#eefaf1",
          100: "#d3f0dc",
          200: "#a3ddb6",
          300: "#6fc78d",
          400: "#43ac68",
          500: "#2c8f4e",
          600: "#20713d",
          700: "#1b5931",
          800: "#154527",
          900: "#0f341d"
        }
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem"
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        bn: ["var(--font-bn)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        soft: "0 2px 12px rgba(64, 42, 24, 0.08)",
        card: "0 4px 20px rgba(64, 42, 24, 0.06)"
      }
    }
  },
  plugins: []
};
