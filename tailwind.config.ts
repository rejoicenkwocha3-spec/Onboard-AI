import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: "#102A43", deep: "#071C2C" },
        brand: { DEFAULT: "#2563EB", light: "#3B82F6", soft: "#EAF2FF" },
        teal: { accent: "#14B8A6" },
        surface: "#F6F8FC",
        ink: { DEFAULT: "#172B4D", muted: "#697586" },
        line: "#E5EAF1",
        success: "#16A36A",
      },
      fontFamily: {
        heading: ["var(--font-manrope)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
