/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      colors: {
        border: "hsl(var(--border))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        secondary: { DEFAULT: "hsl(var(--secondary))", foreground: "hsl(var(--secondary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: { DEFAULT: "hsl(var(--accent))", foreground: "hsl(var(--accent-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
        destructive: { DEFAULT: "hsl(var(--destructive))", foreground: "hsl(var(--destructive-foreground))" },
        surface: {
          0: "hsl(var(--surface0))",
          1: "hsl(var(--surface1))",
          2: "hsl(var(--surface2))",
        },
        ctp: {
          red: "hsl(var(--ctp-red))",
          green: "hsl(var(--ctp-green))",
          yellow: "hsl(var(--ctp-yellow))",
          blue: "hsl(var(--ctp-blue))",
          mauve: "hsl(var(--ctp-mauve))",
          pink: "hsl(var(--ctp-pink))",
          teal: "hsl(var(--ctp-teal))",
          peach: "hsl(var(--ctp-peach))",
          lavender: "hsl(var(--ctp-lavender))",
          sapphire: "hsl(var(--ctp-sapphire))",
          sky: "hsl(var(--ctp-sky))",
          rosewater: "hsl(var(--ctp-rosewater))",
        },
      },
    },
  },
  plugins: [],
}
