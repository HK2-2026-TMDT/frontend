/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#000000",
        "on-primary": "#ffffff",
        "primary-container": "#e0e0e0",
        "on-primary-container": "#000000",
        secondary: "#9d4300",
        "on-secondary": "#ffffff",
        "secondary-container": "#ffdbcc",
        "on-secondary-container": "#331100",
        tertiary: "#000000",
        "on-tertiary": "#ffffff",
        "tertiary-container": "#e0e0e0",
        "on-tertiary-container": "#000000",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#410002",
        background: "#f7f9fb",
        "on-background": "#191c1e",
        surface: "#f7f9fb",
        "on-surface": "#191c1e",
        "surface-variant": "#dfe3e8",
        "on-surface-variant": "#43474e",
        outline: "#73777f",
        "outline-variant": "#c3c7cf",
        "secondary-fixed": "#ffdbcc",
      },
      spacing: {
        'margin-desktop': '5vw',
        'margin-mobile': '4vw',
        'gutter': '24px',
        'container-max': '1440px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
