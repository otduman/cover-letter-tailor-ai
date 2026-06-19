/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        // Carried over from the original Streamlit design palette
        ink: "#1C2B1A",
        sage: "#4A7C3F",
        muted: "#6B7B63",
        paper: "#FAFAF6",
        panel: "#F4F2ED",
        line: "#D2DAC9",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["IBM Plex Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
