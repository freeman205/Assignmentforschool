/** @type {import('tailwindcss').Config} */
const defaultConfig = require("shadcn/ui/tailwind.config")

module.exports = {
  ...defaultConfig,
  content: [
    ...defaultConfig.content,
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ".index.html", // Ensure index.html is scanned for Tailwind classes
  ],
  theme: {
    ...defaultConfig.theme,
    extend: {
      ...defaultConfig.theme.extend,
      colors: {
        ...defaultConfig.theme.extend.colors,
        primary: {
          DEFAULT: "#20c997", // Vibrant teal/mint green
          light: "#40e0a8",
          lighter: "#60f0c0",
          dark: "#1a9f7a",
          foreground: defaultConfig.theme.extend.colors.primary.foreground,
        },
        secondary: {
          DEFAULT: "#6c757d", // Soft grey
          foreground: defaultConfig.theme.extend.colors.secondary.foreground,
        },
        accent: {
          DEFAULT: "#fd7e14", // Bright orange
          dark: "#e06c0f",
          light: "#ff923d",
          foreground: defaultConfig.theme.extend.colors.accent.foreground,
        },
        background: "#f8f9fa", // Very light grey
        "card-background": "#ffffff", // Pure white
        "text-primary": "#212529", // Dark charcoal
        "text-secondary": "#6c757d", // Soft grey
        "border-light": "#e9ecef", // Light border color
      },
      boxShadow: {
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [...defaultConfig.plugins, require("tailwindcss-animate")],
}
