import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151515",
        mist: "#f6f2ec",
        silk: "#fffaf3",
        accent: "#8f5c38",
        sage: "#52685a"
      },
      boxShadow: {
        soft: "0 24px 80px rgba(21, 21, 21, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;
