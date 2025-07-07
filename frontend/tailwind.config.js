// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
    "./app/**/*.{js,jsx}",
    "./src/**/*.{js,jsx}",
    // Origin UI components
    "./src/components/ui/**/*.{js,jsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Enhanced responsive breakpoints for 2024 best practices
      screens: {
        'xs': '475px',
        '3xl': '1600px',
        '4xl': '1920px',
      },
      // Container query sizes for ultra-responsive design
      containers: {
        'xs': '20rem',
        'sm': '24rem',
        'md': '28rem',
        'lg': '32rem',
        'xl': '36rem',
        '2xl': '42rem',
        '3xl': '48rem',
        '4xl': '56rem',
        '5xl': '64rem',
        '6xl': '72rem',
        '7xl': '80rem',
      },
      // Enhanced spacing system for zoom flexibility
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
        '144': '36rem',
      },
      // Fluid typography using clamp() for zoom flexibility
      fontSize: {
        'fluid-xs': 'clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)',
        'fluid-sm': 'clamp(0.875rem, 0.8rem + 0.375vw, 1rem)',
        'fluid-base': 'clamp(1rem, 0.9rem + 0.5vw, 1.125rem)',
        'fluid-lg': 'clamp(1.125rem, 1rem + 0.625vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem)',
        'fluid-2xl': 'clamp(1.5rem, 1.3rem + 1vw, 2rem)',
        'fluid-3xl': 'clamp(1.875rem, 1.6rem + 1.375vw, 2.5rem)',
        'fluid-4xl': 'clamp(2.25rem, 1.9rem + 1.75vw, 3rem)',
        'fluid-5xl': 'clamp(3rem, 2.5rem + 2.5vw, 4rem)',
      },
      // Enhanced max-width system
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
        '10xl': '104rem',
      },
      // Custom boxShadow definitions
      boxShadow: {
        'card-hover': '0 4px 10px rgba(0, 0, 0, 0.1)',
        'card-focus': '0 0 0 2px rgba(59, 130, 246, 0.5)',
        'smooth': '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
        'elevated': '0 4px 6px rgba(0, 0, 0, 0.07), 0 1px 3px rgba(0, 0, 0, 0.06)',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar))",
          foreground: "hsl(var(--sidebar-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
        },
        "cedo-blue": "#0E2B63",
        "cedo-gold": "#F3BB02",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
        "slide-up": {
          from: { opacity: 0, transform: 'translateY(10px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        "scale-in": {
          from: { opacity: 0, transform: 'scale(0.95)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
        progress: {
          "0%": { width: "0%" },
          "50%": { width: "70%" },
          "100%": { width: "100%" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        progress: "progress 2s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Temporarily commented out due to build issues
    // require("@tailwindcss/container-queries"),
  ],
};